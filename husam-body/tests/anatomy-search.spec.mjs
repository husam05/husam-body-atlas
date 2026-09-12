import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { findings } from '../src/findings.js';
import { normalizeAnatomyQuery, searchAnatomy } from '../src/anatomy-search.js';

const entries = Object.entries(findings).map(([id, { label, short }]) => ({ id, label, short }));
const ids = query => searchAnatomy(entries, query).map(entry => entry.id);
assert.deepEqual(ids(''), ['bladder', 'kidney', 'liver', 'hip']);
assert.deepEqual(ids('  KIDN  '), ['kidney']);
assert.deepEqual(ids('left'), ['kidney', 'hip']);
assert.deepEqual(ids('hip left'), ['hip']);
assert.deepEqual(ids('الكُلْـية اليُسْرَى'), ['kidney']);
assert.deepEqual(ids('الورك الايسر'), ['hip']);
assert.deepEqual(ids('bladder المثانة'), ['bladder']);
assert.deepEqual(ids('right kidney'), [], 'Do not invent a selectable right kidney');
assert.deepEqual(ids('pTa'), [], 'Do not index patient findings');
assert.deepEqual(ids('<img src=x onerror=alert(1)>'), []);
assert.equal(normalizeAnatomyQuery('أ إ آ ٱ'), 'ا ا ا ا');

const project = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'atlas-search-'));
let browser;
const errors = [], requests = [];
function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
}
async function assertClosed(input) {
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  assert.equal(await input.getAttribute('aria-activedescendant'), null);
}
async function idle(page) {
  await page.waitForFunction(() => {
    const motion = window.__atlas?.motion();
    return motion && !motion.pendingFrame && !motion.transitioning && !motion.overlay;
  }, null, { timeout: 20000 });
}

try {
  const bundle = await build({
    stdin: { contents: `
      import {createAnatomySearch} from './src/anatomy-search.js';
      import {findings} from './src/findings.js';
      const entries=Object.entries(findings).map(([id,{label,short}])=>({id,label,short}));
      const selected=[];
      const search=createAnatomySearch({host:document.querySelector('#search-host'),entries,lang:'en',selectedId:'bladder',onSelect(id){selected.push(id);document.querySelector('#after').focus();}});
      let escaped=0;
      document.addEventListener('keydown',event=>{if(event.key==='Escape')escaped++;});
      window.fixture={search,selected,get escaped(){return escaped;}};
    `, resolveDir: project, loader: 'js' }, bundle: true, write: false, format: 'iife',
  });
  const css = await readFile(new URL('../src/anatomy-search.css', import.meta.url), 'utf8');
  const fixtureFile = join(temporary, 'component.html');
  await writeFile(fixtureFile, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:16px;font-family:Arial,sans-serif}*{box-sizing:border-box}button{min-height:44px;margin-top:220px}${css}</style><body><div id="search-host"></div><button id="after">After search</button><script>${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`);
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const component = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', hasTouch: true });
  observe(component);
  await component.goto(pathToFileURL(fixtureFile).href);
  const input = component.getByRole('combobox');
  assert.equal(await input.getAttribute('aria-autocomplete'), 'list');
  await assertClosed(input);
  await input.focus();
  assert.equal(await component.getByRole('option').count(), 4);
  assert.match(await component.getByRole('status').textContent(), /4 matching/);
  await input.press('Enter');
  assert.deepEqual(await component.evaluate(() => fixture.selected), [], 'Unfiltered Enter must not select arbitrarily');
  await input.press('ArrowUp');
  assert.equal(await component.locator('[role="option"][aria-selected="true"]').textContent(), 'Left hip');
  await input.press('Enter');
  assert.deepEqual(await component.evaluate(() => fixture.selected), ['hip']);
  await assertClosed(input);
  assert.equal(await component.locator('#after').evaluate(node => document.activeElement === node), true);

  await input.fill('الكُلْـية');
  assert.equal(await component.getByRole('option').textContent(), 'Left kidney');
  await input.press('Enter');
  assert.deepEqual(await component.evaluate(() => fixture.selected), ['hip', 'kidney']);
  await input.fill('liver');
  await input.dispatchEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true });
  assert.equal(await component.evaluate(() => fixture.selected.length), 2, 'IME Enter must not navigate');
  await component.getByRole('option', { name: 'Liver', exact: true }).click();
  assert.deepEqual(await component.evaluate(() => fixture.selected), ['hip', 'kidney', 'liver']);

  await input.fill('bladder');
  await input.press('ArrowDown');
  await component.evaluate(() => {
    window.savedInput = document.querySelector('[role="combobox"]');
    savedInput.setSelectionRange(1, 4);
    fixture.search.update({ lang: 'ar', selectedId: 'liver' });
  });
  assert.deepEqual(await component.evaluate(() => ({ same: savedInput === document.querySelector('[role="combobox"]'), focused: document.activeElement === savedInput, query: savedInput.value, start: savedInput.selectionStart, end: savedInput.selectionEnd })), { same: true, focused: true, query: 'bladder', start: 1, end: 4 });
  assert.equal(await component.getByRole('option').textContent(), findings.bladder.label[1]);
  assert.equal(await component.locator('.anatomy-search').getAttribute('dir'), 'rtl');
  assert.equal(await input.getAttribute('dir'), 'auto');
  assert.equal(await component.locator('.anatomy-search').evaluate(node => getComputedStyle(node).letterSpacing), 'normal');
  await input.fill('not-an-organ');
  assert.equal(await component.getByRole('option').count(), 0);
  assert.equal(await input.getAttribute('aria-activedescendant'), null);
  assert.equal(await component.getByRole('status').textContent(), 'لا توجد أعضاء مطابقة');
  await input.press('Enter');
  assert.equal(await component.evaluate(() => fixture.selected.length), 3);
  await input.press('Escape');
  await assertClosed(input);
  assert.equal(await component.evaluate(() => fixture.escaped), 0, 'Escape dismisses only the open search');
  assert.equal(await input.inputValue(), 'not-an-organ');
  await input.click();
  assert.equal(await input.getAttribute('aria-expanded'), 'true');
  await input.fill('');
  assert.equal(await component.getByRole('option').count(), 4);
  await input.press('Tab');
  await assertClosed(input);
  assert.equal(await component.locator('#after').evaluate(node => node === document.activeElement), true);
  await input.focus();
  await component.locator('#after').click();
  await assertClosed(input);

  for (const lang of ['en', 'ar']) {
    await component.evaluate(lang => fixture.search.update({ lang }), lang);
    await component.setViewportSize({ width: 320, height: 844 });
    await input.focus();
    const layout = await component.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, input: document.querySelector('[role="combobox"]').getBoundingClientRect().height, targets: [...document.querySelectorAll('[role="option"]')].map(node => ({ width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height })), animations: document.getAnimations().length }));
    assert.equal(layout.overflow, false);
    assert.ok(layout.input >= 44);
    assert.ok(layout.targets.every(target => target.width >= 44 && target.height >= 44));
    assert.equal(layout.animations, 0);
  }
  await input.fill('bladder');
  await component.getByRole('option').tap();
  assert.equal(await component.evaluate(() => fixture.selected.at(-1)), 'bladder', 'Touch selection must navigate');
  await assertClosed(input);
  await component.emulateMedia({ media: 'print' });
  assert.equal(await component.locator('.anatomy-search').isVisible(), false);
  await component.emulateMedia({ media: 'screen' });
  await component.evaluate(() => fixture.search.destroy());
  assert.equal(await component.getByRole('combobox').count(), 0);
  await component.close();
  console.log('PASS: search matching, keyboard, pointer, IME, focus persistence, RTL, mobile, print and teardown.');

  if (!process.argv.includes('--component-only')) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, reducedMotion: 'reduce' });
    observe(page);
    await page.goto(process.env.ATLAS_URL || new URL('../../Husam-3D.html', import.meta.url).href);
    await page.waitForFunction(() => !!window.__atlas?.motion());
    await page.evaluate(() => document.fonts.ready);
    await idle(page);
    const search = page.getByRole('combobox');
    assert.equal(await search.count(), 1, 'Build the atlas with search integration before running the full suite');
    const before = await page.evaluate(() => ({ organ: __atlas.state.organ, camera: __atlas.camera().position.toArray(), frames: __atlas.motion().renderedFrames }));
    await search.fill('liver');
    await page.waitForTimeout(350);
    assert.deepEqual(await page.evaluate(() => ({ organ: __atlas.state.organ, camera: __atlas.camera().position.toArray(), frames: __atlas.motion().renderedFrames })), before, 'Typing must not move or render the 3D viewer');
    await search.press('Enter');
    await idle(page);
    assert.equal(await page.evaluate(() => __atlas.state.organ), 'liver');
    assert.equal(await page.locator('.organ-chip[data-organ="liver"]').evaluate(node => node === document.activeElement), true);
    await assertClosed(search);

    await search.fill('kidney');
    await page.evaluate(() => {
      window.searchInputBefore = document.querySelector('[role="combobox"]');
      searchInputBefore.setSelectionRange(1, 4);
      document.querySelector('[data-action="language"]').click();
    });
    assert.deepEqual(await page.evaluate(() => ({ same: searchInputBefore === document.querySelector('[role="combobox"]'), focus: searchInputBefore === document.activeElement, value: searchInputBefore.value, start: searchInputBefore.selectionStart, end: searchInputBefore.selectionEnd })), { same: true, focus: true, value: 'kidney', start: 1, end: 4 });
    assert.equal(await page.getByRole('option').textContent(), findings.kidney.label[1]);
    await search.press('Enter');
    await idle(page);
    assert.equal(await page.evaluate(() => __atlas.state.organ), 'kidney');

    const tabs = await page.locator('.tab').evaluateAll(nodes => nodes.map(node => node.dataset.tab).filter(tab => tab !== 'body'));
    for (const tab of tabs) {
      await page.locator(`.tab[data-tab="${tab}"]`).click();
      await search.fill('الورك الايسر');
      await page.getByRole('option', { name: findings.hip.label[1], exact: true }).click();
      await idle(page);
      assert.deepEqual(await page.evaluate(() => ({ tab: __atlas.state.tab, organ: __atlas.state.organ, tour: __atlas.state.tour })), { tab: 'body', organ: 'hip', tour: -1 });
    }
    await page.locator('[data-action="tour-start"]').click();
    await page.locator('[data-scene="detail"]').click();
    await search.fill('bladder');
    await search.press('Enter');
    await idle(page);
    assert.equal(await page.evaluate(() => __atlas.state.modelView), 'body');
    await page.locator('[data-action="tour-start"]').click();
    await search.fill('liver');
    await search.press('Enter');
    await idle(page);
    assert.equal(await page.evaluate(() => __atlas.state.tour), -1);
    assert.equal(await page.locator('#tour-card').count(), 0);

    for (const width of [1440, 390, 320]) for (const lang of ['en', 'ar']) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1040 });
      if (await page.locator('html').getAttribute('lang') !== lang) await page.locator('[data-action="language"]').click();
      await idle(page);
      await search.fill('');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px ${lang} overflow`);
      assert.equal(await page.locator('.anatomy-search').getAttribute('dir'), lang === 'ar' ? 'rtl' : 'ltr');
      assert.equal(await page.getByRole('option').count(), 4);
      assert.ok(await search.evaluate(node => node.getBoundingClientRect().width >= 44), `${width}px ${lang}: search must retain its touch target`);
      assert.deepEqual(await page.locator('.tab').evaluateAll(nodes => nodes.filter(node => node.scrollWidth > node.clientWidth + 1).map(node => node.textContent)), [], `${width}px ${lang}: tab labels must fit their controls`);
      assert.deepEqual(await page.locator('.tab').evaluateAll(nodes => nodes.filter(node => {
        const textVisible = parseFloat(getComputedStyle(node).fontSize) > 0 && node.textContent.trim();
        const icon = node.querySelector('svg');
        return !textVisible && !(icon && icon.getClientRects().length && getComputedStyle(icon).visibility !== 'hidden');
      }).map(node => node.textContent)), [], `${width}px ${lang}: tabs must retain visible text or icons`);
      await search.press('Escape');
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await search.fill('kidney');
    await search.press('Enter');
    await idle(page);
    const frames = await page.evaluate(() => __atlas.motion().renderedFrames);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => __atlas.motion().renderedFrames), frames, 'Search selection must settle to idle');
    await page.close();
    console.log('PASS: root offline launcher, atlas selection, persistent input, all tabs, tours, mobile RTL and idle rendering.');
  }
  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(requests, [], 'Remote requests');
} finally {
  await browser?.close();
  await rm(temporary, { recursive: true, force: true });
}
