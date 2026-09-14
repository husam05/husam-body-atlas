import assert from 'node:assert/strict';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {reportCatalog} from '../src/report-catalog.js';
import {findings} from '../src/findings.js';

assert.equal(reportCatalog.length,5);
assert.equal(new Set(reportCatalog.map(r=>r.id)).size,5);
assert.equal(reportCatalog.reduce((n,r)=>n+r.figures.length,0),14);
assert.equal(reportCatalog.find(r=>r.id==='abdomen-pelvis-secondary-review').date,null);
for(const report of reportCatalog){
  assert.ok(report.organs.every(id=>findings[id]));
  for(const path of [report.pdf,report.html,...report.figures.map(f=>f.src)].filter(Boolean)){
    assert.ok(!path.includes('..')&&!path.startsWith('/')&&!/^https?:/.test(path));
    assert.ok((await stat(new URL('../'+path,import.meta.url))).size>100);
  }
  const pdf=await readFile(new URL('../'+report.pdf,import.meta.url));
  assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
}
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const page=await browser.newPage({viewport:{width:1440,height:1040},reducedMotion:'reduce'});
const errors=[],remote=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('request',r=>{if(/^https?:/.test(r.url()))remote.push(r.url())});
async function idle(){await page.waitForFunction(()=>{const m=window.__atlas?.motion();return m&&!m.pendingFrame&&!m.transitioning&&!m.overlay;});}
try{
 await page.goto(process.env.ATLAS_URL||new URL('../index.html',import.meta.url).href);
 await page.waitForFunction(()=>!!window.__atlas?.renderer());await idle();
 assert.equal(await page.locator('.organ-chip').count(),5);
 const anatomy=await page.evaluate(()=>{const m=__atlas.model();return {anchors:Object.keys(m.anchors),lungs:m.organMeshes.filter(x=>/lung · schematic/.test(x.name)).map(x=>({name:x.name,x:x.position.x,organ:x.userData.organ})),finite:m.organMeshes.every(x=>[...x.geometry.attributes.position.array].every(Number.isFinite))};});
 assert.ok(anatomy.anchors.includes('chest')&&anatomy.finite);
 assert.equal(anatomy.lungs.length,2);assert.ok(anatomy.lungs.find(x=>x.name.startsWith('Right')).x<0);assert.ok(anatomy.lungs.find(x=>x.name.startsWith('Left')).x>0);
 await page.locator('.organ-chip[data-organ="liver"]').click();await idle();
 assert.equal(await page.locator('.linked-image').getAttribute('data-report-open'),'liver-mri');
 await page.locator('.linked-image').click();
 assert.equal(await page.locator('.report-card.is-selected').getAttribute('data-report-id'),'liver-mri');
 assert.equal(await page.locator('.rl-figure-button').count(),7);
 await page.locator('[data-action="language"]').click();
 assert.equal(await page.locator('.report-card.is-selected').getAttribute('data-report-id'),'liver-mri','Language switch preserves chosen report');
 assert.equal(await page.locator('.report-library').getAttribute('dir'),'rtl');
 await page.locator('#report-query').fill('الكُلْـبد');
 assert.equal(await page.locator('.rl-empty').isVisible(),true);
 await page.locator('#report-query').fill('الكبد');
 assert.ok(await page.locator('[data-report-id="liver-mri"]').count());
 await page.locator('#report-query').fill('');
 await page.locator('[data-action="language"]').click();
 await page.locator('[data-rl-filter="mri"]').click();assert.equal(await page.locator('.report-card').count(),1);
 await page.evaluate(()=>__atlas.openReport('chest-ct'));
 assert.equal(await page.locator('.report-card').count(),5);
 assert.equal(await page.locator('.report-card.is-selected').getAttribute('data-report-id'),'chest-ct');
 assert.equal(await page.locator('.rl-figure-button').count(),7);
 assert.match(await page.locator('.report-detail').innerText(),/pulmonary embolism.*cannot|cannot.*pulmonary embolism/i);
 const firstFigure=page.locator('.rl-figure-button').first();await firstFigure.click();
 assert.equal(await page.locator('.rl-lightbox').evaluate(x=>x.open),true);
 assert.ok(await page.locator('.rl-lightbox img').evaluate(x=>x.complete&&x.naturalWidth>0));
 await page.keyboard.press('Escape');assert.equal(await page.locator('.rl-lightbox').evaluate(x=>x.open),false);
 await page.locator('.rl-document-links [data-rl-organ="chest"]').click();await idle();
 assert.deepEqual(await page.evaluate(()=>({organ:__atlas.state.organ,view:__atlas.state.modelView,tab:__atlas.state.tab})),{organ:'chest',view:'chest',tab:'body'});
 assert.match(await page.locator('.model-disclaimer').innerText(),/No lung lesion is marked/);
 await page.locator('.linked-image').click();
 await page.locator('.rl-region select').selectOption('hip');assert.equal(await page.locator('.report-card').count(),1);
 assert.equal(await page.locator('.report-card').getAttribute('data-report-id'),'abdomen-pelvis-secondary-review');
 await page.locator('.rl-region select').selectOption('all');
 for(const width of [1440,1100,780,390,320])for(const lang of ['en','ar']){
   await page.setViewportSize({width,height:width>780?1040:844});
   if(await page.locator('html').getAttribute('lang')!==lang)await page.locator('[data-action="language"]').click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Report library overflow ${width} ${lang}`);
   await page.locator('[data-report-id="chest-ct"]').click();
   assert.equal(await page.locator('.report-detail').isVisible(),true);
   const bad=await page.locator('.rl-document-links .rl-button').evaluateAll(nodes=>nodes.filter(x=>x.getBoundingClientRect().width<44||x.getBoundingClientRect().height<44).length);
   assert.equal(bad,0,`Report links need touch targets ${width} ${lang}`);
 }
 await page.evaluate(()=>__atlas.openReport('liver-mri'));
 assert.ok(await page.locator('.report-detail').evaluate(x=>x.getBoundingClientRect().top<30),'Mobile direct report link reveals selected detail');
 await page.evaluate(()=>__atlas.openReport('chest-ct'));
 await page.setViewportSize({width:1440,height:1040});await page.locator('[data-action="language"]').click();
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'preview-all-reports.png',fullPage:false});
 await page.locator('.rl-document-links [data-rl-organ="chest"]').click();await idle();
 await page.screenshot({path:'preview-chest-atlas.png',fullPage:false});
 assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 await writeFile('tests/report-results.json',JSON.stringify({passed:true,reports:5,figures:14,checks:['All local report and image assets','Actual PDF files','Selectable correctly sided schematic lungs','Liver MRI linkage','Selected report survives language change','Arabic search','Filters and direct report navigation','Image dialog and Escape','Report-to-chest navigation','Secondary review provenance','English and Arabic at five viewport widths','No JavaScript errors or network requests']},null,2));
 console.log('PASS: five-report atlas, 14 figures, source links, chest anatomy, filters, image dialog, body navigation and responsive bilingual library.');
}finally{await browser.close();}
