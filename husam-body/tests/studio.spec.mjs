import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
const p=await browser.newPage({viewport:{width:1600,height:1120},deviceScaleFactor:1,acceptDownloads:true});
const errors=[],network=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
await p.goto(new URL('../index.html', import.meta.url).href);await p.waitForFunction(()=>!!window.__atlas?.stage());await p.waitForTimeout(900);
assert.equal(await p.locator('.organ-chip').count(),4);
assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.screenshot({path:'preview-modern-studio.png',fullPage:true});
assert.equal(await p.locator('[data-presentation]').count(),4);
for(const mode of ['muscles','skeleton','skin','anatomy']){
 await p.locator(`[data-presentation="${mode}"]`).click();await p.waitForTimeout(800);
 const info=await p.evaluate(()=>{const m=window.__atlas.model(),visible={};m.group.traverse(o=>{if(o.geometry&&o.visible){let v=true;for(let p=o.parent;p;p=p.parent)v&&=p.visible;if(v)visible[o.userData.category]=(visible[o.userData.category]||0)+1;}});return {mode:m.getPresentation(),visible,labels:document.querySelectorAll('.anatomy-label').length};});
 assert.equal(info.mode,mode);assert.ok(info.visible[mode==='anatomy'?'organs':mode]>0);
 if(mode!=='anatomy'){assert.equal(info.visible.organs||0,0);assert.equal(await p.locator('.anatomy-labels button').count(),0);assert.equal(await p.locator('.layer-notice').count(),1);assert.equal(await p.locator('[data-action="opacity"]').count(),0);assert.equal(await p.locator('[data-action="labels"]').count(),0);}
 await p.screenshot({path:`preview-layer-${mode}.png`,fullPage:true});
}
await p.locator('[data-presentation="skin"]').click();await p.locator('.organ-chip[data-organ="bladder"]').click();assert.equal(await p.evaluate(()=>window.__atlas.model().getPresentation()),'anatomy');
await p.locator('[data-action="immersive"]').first().click();await p.waitForTimeout(900);assert.equal(await p.locator('#app').evaluate(el=>el.classList.contains('immersive-mode')),true);assert.equal(await p.locator('#finding-panel').isVisible(),false);
assert.ok(await p.locator('#viewer-card').evaluate(el=>el.clientWidth)>700);
await p.screenshot({path:'preview-immersive.png',fullPage:true});await p.keyboard.press('Escape');await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.__atlas.state.immersive),false);
await p.locator('[data-action="tour-start"]').click();await p.waitForTimeout(800);assert.equal(await p.locator('#tour-card').count(),1);assert.equal(await p.evaluate(()=>window.__atlas.state.modelView),'urinary');
const expected=[['bladder','detail'],['kidney','urinary'],['liver','body'],['hip','body']];
for(const [organ,mode] of expected){await p.locator('[data-action="tour-next"]').click();await p.waitForTimeout(850);assert.equal(await p.evaluate(()=>window.__atlas.state.organ),organ);assert.equal(await p.evaluate(()=>window.__atlas.state.modelView),mode);}
await p.locator('[data-action="tour-back"]').click();assert.equal(await p.evaluate(()=>window.__atlas.state.tour),3);await p.locator('[data-action="tour-next"]').click();await p.locator('[data-action="tour-next"]').click();assert.equal(await p.locator('#tour-card').count(),0);
await p.locator('[data-action="tour-start"]').click();await p.locator('.organ-chip[data-organ="kidney"]').click();assert.equal(await p.locator('#tour-card').count(),0);assert.equal(await p.evaluate(()=>window.__atlas.state.tour),-1);
await p.locator('[data-scene="detail"]').click();await p.waitForTimeout(900);await p.screenshot({path:'preview-modern-layers.png',fullPage:true});
await p.locator('[data-action="language"]').click();await p.waitForTimeout(300);await p.screenshot({path:'preview-modern-arabic.png',fullPage:true});
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(700);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:'preview-modern-mobile.png',fullPage:true});
await p.setViewportSize({width:320,height:800});await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
await p.locator('.organ-chip[data-organ="liver"]').click();assert.match(await p.locator('#finding-panel h2').innerText(),/الكبد/);
assert.deepEqual(errors,[]);assert.deepEqual(network,[]);
await writeFile('tests/studio-results.json',JSON.stringify({passed:true,checks:['Modern WebGL rendering','Four anatomy layers and truthful visibility','Clinical selection restores organs','Organ ribbon','Immersive entry and Escape exit','Five-step guided tour','Tour previous and completion','Manual navigation ends tour','Bladder layers','Arabic','390px and 320px responsive layouts','No remote requests','No browser errors'],errors,network},null,2));
console.log('PASS: modern studio, immersive mode, guided tour, Arabic, narrow layouts and offline privacy.');await browser.close();
