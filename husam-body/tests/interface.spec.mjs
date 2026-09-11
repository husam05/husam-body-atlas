import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1040 }, deviceScaleFactor: 1 });
const errors = [], network = [], checks = [], layouts = [];
function observe(p) {
  p.on('pageerror', error => errors.push(error.message));
  p.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  p.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
}
observe(page);
const url = new URL('../index.html', import.meta.url).href;
async function settled(p = page) {
  await p.waitForFunction(() => {
    const m = window.__atlas?.motion();
    return m && !m.pendingFrame && !m.transitioning && !m.overlay;
  }, null, { timeout: 20000 });
}
const pose = (p = page) => p.evaluate(() => ({ position: __atlas.camera().position.toArray(), target: __atlas.controls().target.toArray(), view: __atlas.state.view }));
function near(a, b, label, tolerance = 1e-5) {
  assert.ok(a.every((value, index) => Math.abs(value - b[index]) < tolerance), `${label}: ${a} != ${b}`);
}
async function idle(p = page) {
  await settled(p);
  const before = await p.evaluate(() => __atlas.motion().renderedFrames);
  await p.waitForTimeout(350);
  assert.equal(await p.evaluate(() => __atlas.motion().renderedFrames), before, 'idle rendering must stop');
  return before;
}
async function tool(action, p = page) {
  const button = p.locator(`[data-action="${action}"]`);
  if (!await button.isVisible()) await p.locator('[data-action="tools"]').click();
  await button.click();
}
async function layout(width, lang) {
  await page.setViewportSize({ width, height: width < 600 ? 844 : 1040 });
  if (await page.locator('html').getAttribute('lang') !== lang) await page.locator('[data-action="language"]').click();
  await settled();
  await page.evaluate(() => window.scrollTo(0, 0));
  const result = await page.evaluate(() => {
    const bounds = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; };
    const viewer = bounds(document.querySelector('#viewer-card'));
    const panel = bounds(document.querySelector('#finding-panel'));
    const selector = '#topbar button, #page-heading button, .tab, .organ-chip, #viewer-header button, #viewer-footer button, .mobile-details, .anatomy-label';
    const targets = [...document.querySelectorAll(selector)].filter(element => element.checkVisibility()).map(element => ({ name: element.dataset.action || element.dataset.organ || element.dataset.scene || element.dataset.presentation || element.dataset.tab || element.dataset.view, ...bounds(element) }));
    return { width: innerWidth, lang: document.documentElement.lang, dir: document.documentElement.dir, overflow: document.documentElement.scrollWidth > innerWidth, viewer, panel, smallTargets: targets.filter(target => target.width < 43.9 || target.height < 43.9) };
  });
  assert.equal(result.overflow, false, `${width}px ${lang} overflow`);
  assert.equal(result.dir, lang === 'ar' ? 'rtl' : 'ltr');
  assert.ok(result.viewer.y <= (width < 600 ? 280 : 240), `${width}px ${lang}: viewer starts at ${result.viewer.y}px`);
  assert.deepEqual(result.smallTargets, [], `${width}px ${lang}: controls need 44px touch targets`);
  if (width >= 1100) {
    assert.ok(Math.abs(result.viewer.y - result.panel.y) < 2, 'desktop findings beside viewer');
    assert.ok(Math.abs(result.panel.width - 320) < 2, 'desktop findings panel is 320px');
    assert.ok(lang === 'en' ? result.panel.x > result.viewer.x : result.panel.x < result.viewer.x, 'reading order mirrors in Arabic');
  } else assert.ok(result.panel.y >= result.viewer.bottom, 'narrow findings below viewer');
  layouts.push(result);
}

try {
  await page.goto(url);
  await page.waitForFunction(() => !!window.__atlas?.motion());
  await page.evaluate(() => document.fonts.ready);
  await idle();
  await layout(1440, 'en');
  await page.screenshot({ path: 'preview-enhanced-desktop.png', fullPage: true });

  await page.evaluate(() => { window.__interfaceNodes = { canvas: document.querySelector('#viewport canvas'), button: document.querySelector('.organ-chip[data-organ="kidney"]') }; });
  await page.locator('.organ-chip[data-organ="kidney"]').focus();
  await page.keyboard.press('Enter');
  await settled();
  assert.equal(await page.evaluate(() => __atlas.state.organ), 'kidney');
  assert.deepEqual(await page.evaluate(() => ({ canvas: __interfaceNodes.canvas === document.querySelector('#viewport canvas'), button: __interfaceNodes.button === document.querySelector('.organ-chip[data-organ="kidney"]'), focus: document.activeElement === __interfaceNodes.button })), { canvas: true, button: true, focus: true });
  assert.equal(await page.locator('.anatomy-label.is-pin').count(), 3);
  await tool('all-labels');
  assert.equal(await page.locator('.anatomy-label.is-pin').count(), 0);
  await tool('all-labels');
  checks.push('Persistent canvas and keyboard-focused organ control', 'Selected annotation plus compact pins and all-labels option');

  await page.locator('[data-view="front"]').click();
  await settled();
  const arc = await page.evaluate(async () => {
    const samples = [], camera = __atlas.camera(), controls = __atlas.controls();
    document.querySelector('[data-view="back"]').click();
    return await new Promise(resolve => {
      function sample() {
        const offset = camera.position.clone().sub(controls.target);
        samples.push({ radius: offset.length(), x: offset.x, z: offset.z });
        if (__atlas.motion().transitioning) requestAnimationFrame(sample);
        else resolve(samples);
      }
      requestAnimationFrame(sample);
    });
  });
  assert.ok(arc.length > 2, 'animated preset has intermediate frames');
  assert.ok(arc.every(sample => sample.radius > arc.at(-1).radius * .8), 'front/back stays outside the body');
  assert.ok(arc.some(sample => Math.abs(sample.x) > sample.radius * .4), 'front/back follows an orbital arc');
  await settled();
  assert.equal(await page.locator('#side-r').innerText(), 'L');
  await page.locator('[data-view="front"]').click();
  await settled();
  assert.equal(await page.locator('#side-r').innerText(), 'R');
  checks.push('Front/back orbital path and anatomical laterality');

  await page.evaluate(() => {
    for (const selector of ['[data-scene="detail"]','[data-wall="muscle"]','[data-scene="urinary"]','[data-scene="body"]','[data-presentation="skeleton"]','[data-presentation="skin"]','[data-presentation="anatomy"]']) document.querySelector(selector).click();
  });
  assert.ok(await page.locator('.scene-transition').count() <= 1);
  await settled();
  assert.equal(await page.locator('.scene-transition').count(), 0);
  assert.deepEqual(await page.evaluate(() => ({ scene: __atlas.state.modelView, presentation: __atlas.model().getPresentation(), bodyVisible: __atlas.model().group.visible, detailVisible: __atlas.detail().group.visible })), { scene: 'body', presentation: 'anatomy', bodyVisible: true, detailVisible: false });
  assert.equal(await page.evaluate(() => __interfaceNodes.canvas === document.querySelector('#viewport canvas')), true);
  checks.push('Rapid scene/layer changes keep newest state and clear overlays');

  await page.locator('[data-view="back"]').click();
  await page.waitForTimeout(100);
  await page.locator('#viewport canvas').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(() => __atlas.motion().transitioning), false);
  assert.equal(await page.evaluate(() => __atlas.state.view), 'custom');
  const afterKey = await pose();
  await settled();
  near((await pose()).position, afterKey.position, 'keyboard interruption stays at selected pose');
  await page.locator('[data-view="front"]').click();
  await page.waitForTimeout(100);
  const viewport = await page.locator('#viewport').boundingBox();
  await page.mouse.move(viewport.x + 20, viewport.y + 24);
  await page.mouse.down();
  assert.equal(await page.evaluate(() => __atlas.motion().transitioning), false);
  await page.mouse.move(viewport.x + 60, viewport.y + 42, { steps: 4 });
  await page.mouse.up();
  await settled();
  assert.equal(await page.evaluate(() => __atlas.state.view), 'custom');
  checks.push('Arrow and pointer input interrupt camera transitions');

  const custom = await pose();
  await page.locator('[data-action="immersive"]').click();
  await settled();
  near((await pose()).position, custom.position, 'immersive entry preserves camera position');
  near((await pose()).target, custom.target, 'immersive entry preserves camera target');
  await page.screenshot({ path: 'preview-enhanced-immersive.png', fullPage: true });
  await page.keyboard.press('Escape');
  await settled();
  near((await pose()).position, custom.position, 'immersive exit preserves camera position');
  checks.push('Expanded view preserves custom orientation');

  await page.locator('[data-view="front"]').click();
  await settled();
  const baseOpacity = await page.evaluate(() => __atlas.model().skinMaterials.map(material => material.opacity));
  await tool('opacity');
  await page.locator('#opacity').fill('40');
  await settled();
  const raisedOpacity = await page.evaluate(() => __atlas.model().skinMaterials.map(material => material.opacity));
  baseOpacity.forEach((value, index) => assert.ok(Math.abs(raisedOpacity[index] - value * 2) < 1e-7));
  await page.locator('#opacity').fill('20');
  await tool('opacity');
  await page.locator('[data-presentation="skin"]').click();
  await page.locator('[data-presentation="anatomy"]').click();
  await settled();
  near(await page.evaluate(() => __atlas.model().skinMaterials.map(material => material.opacity)), baseOpacity, 'opacity presentation round trip');
  checks.push('Opacity is independent of presentation updates');

  const frames = await idle();
  await tool('zoom-in');
  await settled();
  assert.ok(await page.evaluate(() => __atlas.motion().renderedFrames) > frames);
  await page.locator('[data-action="rotate"]').click();
  await page.waitForTimeout(220);
  assert.equal(await page.evaluate(() => __atlas.controls().autoRotate), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => __atlas.motion().reducedMotion);
  await idle();
  assert.equal(await page.evaluate(() => __atlas.state.rotate), false);
  assert.equal(await page.evaluate(() => __atlas.controls().autoRotate), false);
  assert.equal(await page.locator('[data-action="rotate"]').isDisabled(), true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !__atlas.motion().reducedMotion);
  await page.locator('[data-view="back"]').click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForFunction(() => __atlas.motion().reducedMotion);
  await settled();
  assert.equal(await page.locator('#side-r').innerText(), 'L');
  assert.equal(await page.evaluate(() => __atlas.motion().transitioning), false);
  await page.locator('[data-action="effects"]').click();
  await idle();
  assert.equal(await page.locator('.effect-detail').isVisible(), true);
  assert.equal(await page.evaluate(() => __atlas.motion().continuous), false);
  await page.locator('[data-action="effects"]').click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => !__atlas.motion().reducedMotion);
  checks.push('Idle rendering resumes on interaction', 'Dynamic reduced motion finishes camera travel, stops rotation and retains static explanation');

  await page.locator('.tab[data-tab="sources"]').click();
  const sourceFrames = await page.evaluate(() => __atlas.motion().renderedFrames);
  await page.waitForTimeout(350);
  assert.equal(await page.evaluate(() => __atlas.motion().renderedFrames), sourceFrames);
  assert.equal(await page.evaluate(() => __atlas.motion().pendingFrame), false);
  assert.equal(await page.locator('.source-card').count(), 3);
  await page.locator('.tab[data-tab="body"]').click();
  await settled();
  assert.ok(await page.evaluate(() => __atlas.motion().renderedFrames) > sourceFrames);
  checks.push('Reports view stops rendering; return resumes the same canvas');

  await page.locator('.organ-chip[data-organ="liver"]').click();
  for (const width of [1100, 1024, 390, 320]) {
    await layout(width, 'en');
    if (width === 390) await page.screenshot({ path: 'preview-enhanced-mobile.png', fullPage: true });
    await layout(width, 'ar');
    if (width === 390) await page.screenshot({ path: 'preview-enhanced-arabic.png', fullPage: true });
  }
  assert.equal(await page.locator('.summary-context').isVisible(), true);
  const opener = page.locator('[data-action="details-open"]');
  await opener.click();
  assert.equal(await page.locator('#details-dialog').evaluate(dialog => dialog.open), true);
  assert.equal(await page.locator('#details-dialog .finding-extra').isVisible(), true);
  assert.match(await page.locator('#details-dialog .dialog-context').innerText(), /الكبد|بؤر|غير/);
  assert.ok(await page.locator('#details-dialog .dialog-context .source-link').getAttribute('href'));
  assert.equal(await page.locator('#details-dialog').getAttribute('dir'), 'rtl');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.querySelector('#details-dialog').contains(document.activeElement)), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#details-dialog').evaluate(dialog => dialog.open), false);
  assert.equal(await opener.evaluate(element => element === document.activeElement), true);
  checks.push('Desktop/tablet/320px/390px English and Arabic layout and 44px controls', 'Mobile details retain uncertainty and source with accessible focus return');

  const accordionState = await page.locator('.accordion').evaluateAll(elements => elements.map(element => element.open));
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  assert.equal(await page.locator('.finding-list').isVisible(), true, 'print exposes report details from collapsed accordions');
  assert.equal(await page.locator('.function-note').isVisible(), true, 'print includes function context');
  assert.equal(await page.locator('#topbar').isVisible(), false, 'print hides interactive chrome');
  assert.equal(await page.locator('#viewer-card').isVisible(), true);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await page.emulateMedia({ media: 'screen' });
  assert.deepEqual(await page.locator('.accordion').evaluateAll(elements => elements.map(element => element.open)), accordionState, 'printing restores prior accordion state');
  checks.push('Printing exposes full report context and restores collapsed sections');

  const reduced = await browser.newPage({ viewport: { width: 1440, height: 1040 }, reducedMotion: 'reduce' });
  observe(reduced);
  await reduced.goto(url);
  await reduced.waitForFunction(() => !!window.__atlas?.motion());
  await reduced.evaluate(() => document.fonts.ready);
  await idle(reduced);
  assert.equal(await reduced.evaluate(() => __atlas.motion().reducedMotion), true);
  assert.equal(await reduced.locator('[data-action="rotate"]').isDisabled(), true);
  await reduced.locator('[data-view="back"]').click();
  assert.equal(await reduced.evaluate(() => __atlas.motion().transitioning), false);
  await reduced.locator('[data-action="effects"]').click();
  await idle(reduced);
  assert.equal(await reduced.locator('.effect-detail').isVisible(), true);
  await reduced.close();
  checks.push('Reduced-motion preference works from initial load');

  assert.deepEqual(errors, []);
  assert.deepEqual(network, []);
  checks.push('Offline launch with no browser errors or remote requests');
  await writeFile('tests/interface-results.json', JSON.stringify({ passed: true, checks, layouts, errors, network }, null, 2));
  console.log(`PASS: ${checks.length} enhanced interface and motion checks.`);
} catch (error) {
  await writeFile('tests/interface-results.json', JSON.stringify({ passed: false, checks, layouts, error: error.message, errors, network }, null, 2));
  await page.screenshot({ path: 'tests/interface-failure.png', fullPage: true }).catch(() => {});
  throw error;
} finally {
  await browser.close();
}
