import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || '/usr/bin/google-chrome',headless:true,args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1800,height:1200},deviceScaleFactor:1});
p.on('console',m=>{if(m.type()==='error')console.log(m.text())});
await p.goto(new URL('../design/canvas-artwork.html', import.meta.url).href);await p.waitForTimeout(2000);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:'design/Enhanced-Anatomical-Artwork.png'});
console.log(await p.evaluate(()=>({width:document.body.scrollWidth,height:document.body.scrollHeight,imageLoaded:document.querySelector('img').naturalWidth>0,text:document.querySelector('h1').innerText})));
// Preserve computed styles and embed the anonymous image for an offline copy.
const css=await p.evaluate(()=>Array.from(document.querySelectorAll('style')).map(s=>s.textContent).join('\n'));
let html=await readFile('design/canvas-artwork.html','utf8');html=html.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<style>[\s\S]*?<\/style>/g,'').replace('</head>','<style>'+css.replace(/@import\s+url\([^)]*\);/g,'')+'</style></head>');
const img=(await readFile('design/anatomical-reference-v2.png')).toString('base64');html=html.replace(/https:\/\/[^"\s]+anatomical-reference(?:-v2)?\.png/g,'data:image/png;base64,'+img);await writeFile('design/artwork-offline.html',html);
await browser.close();
