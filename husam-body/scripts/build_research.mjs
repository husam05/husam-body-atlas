import {readFile,writeFile,access} from 'node:fs/promises';
import MarkdownIt from 'markdown-it';
import footnote from 'markdown-it-footnote';
const md=new MarkdownIt({html:true}).use(footnote);
let medical=await readFile('research/medical-evidence.md','utf8');
medical=medical.replace(/^# .*\n\n[^\n]+\n\n/,'');
medical=medical.replace('This dossier does not independently validate its entire image inventory or infer additional findings. ','');
medical=medical.replace('The supplied Study0908095422986.zip is the imaging archive underlying the separate CT reconstruction workflow.','The supplied Study0908095422986.zip underlies the separate CT reconstruction.');
const inventoryStart=medical.indexOf('**Public source inventory.**');
const medicalText=medical.slice(0,inventoryStart),medicalInventory=medical.slice(inventoryStart).replace('**Public source inventory.**','## Medical sources').replace('All sources below were opened and relevant text retrieved on **11 September 2026**. They provide general explanation and terminology; local R1–R3 remain the sources for patient-specific claims. No search-result snippets are used as sole evidence.','The following institutional sources support general explanation and terminology. Local R1–R3 remain the sources for patient-specific claims. Accessed 11 September 2026.');
const definitions=new Map();let index=0;
const withNotes=medicalText.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,(_,title,url)=>{if(!definitions.has(url))definitions.set(url,{id:'m'+(++index),title});return '[^'+definitions.get(url).id+']';});
let visual=await readFile('research/visualization-evidence.md','utf8');
visual=visual.replace(/^# .*\n/,'## Visualization and interaction');
visual=visual.replaceAll('**Priority: immediate.** ','').replaceAll('**Priority: subsequent enhancement.** ','');
visual=visual.replace(/\[\^(\d+)\]/g,'[^v$1]');
visual=visual.replace('## Sources','## Visualization sources');
const summary=`# Medical visualization design evidence

The atlas connects reported anatomical findings with an educational three-dimensional body, a conceptual bladder-wall cutaway, and a separate reconstruction of the actual CT coverage. Its visual credibility depends on clear source attribution, stable anatomical orientation, and explicit limits on what images or tissue samples establish.

The supplied pathology reports low-grade inverted urothelial carcinoma, with pTa / G1 preserved as written. No lamina propria invasion was identified and detrusor muscle was present and tumor-free in the examined specimen. Earlier CT findings must remain dated before TURBT. Liver findings remain indeterminate; the left-hip observation belongs to the secondary Arabic review. Numerical organ efficiency cannot be inferred from the supplied records.

The design therefore emphasizes three complementary views: the body for location, the enlarged wall layers for explanation, and the CT surfaces for the scanned anatomy. Colors and illumination identify selection and evidence categories; they are not severity measurements. A more realistic image does not establish a more certain diagnosis.

## Clinical interpretation and visual constraints

`;
const noteDefs=[...definitions].map(([url,d])=>'[^'+d.id+']: '+d.title+'. ['+url+']('+url+'). Accessed 11 September 2026.').join('\n');
const interfaceEvidence=await readFile('research/interface-evidence.md','utf8');
const interfaceIndex=interfaceEvidence.indexOf('## Interface sources');
const interfaceText=interfaceEvidence.slice(0,interfaceIndex),interfaceInventory=interfaceEvidence.slice(interfaceIndex);
const source=summary.replace('## Clinical interpretation and visual constraints\n\n','')+interfaceText+'\n## Clinical interpretation and visual constraints\n\n'+withNotes+'\n'+visual+'\n'+medicalInventory+'\n\n'+interfaceInventory+'\n\n'+noteDefs;
await writeFile('research/design-evidence.md',source);
const css=`@font-face{font-family:Arabic;src:url('../assets/arabic.ttf')}*{box-sizing:border-box}html{background:#eeeeec}body{max-width:930px;margin:0 auto;padding:60px 70px;background:white;color:#262a2b;font:16px/1.7 Georgia,Arabic,serif}h1{font:600 36px/1.2 Arial,sans-serif;margin:0 0 32px;color:#111}h2{font:600 24px/1.3 Arial,sans-serif;margin:38px 0 16px;color:#222}h3{font:600 18px/1.4 Arial,sans-serif}p{margin:0 0 16px}a{color:#365467;text-decoration:underline;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;font:13px/1.5 Arial,Arabic,sans-serif;margin:24px 0}th,td{border:1px solid #c9cccd;padding:10px;vertical-align:top}th{background:#f0f0ee;text-align:left}tr{break-inside:avoid}ul,ol{padding-left:24px}li{margin:6px 0}code{font-size:12px;overflow-wrap:anywhere}.footnotes{font:12px/1.5 Arial,Arabic,sans-serif}.footnotes p{margin:6px 0}.footnote-ref{font:11px Arial,sans-serif}.footnote-backref{display:none}figure{margin:24px 0;break-inside:avoid}figure img{display:block;width:100%;height:auto;border:1px solid #c9cccd}.comparison-pair{display:grid;grid-template-columns:1fr 1fr;gap:14px}.comparison-pair p,figcaption{font:12px/1.5 Arial,Arabic,sans-serif;margin:8px 0 0}.comparison-pair img{height:245px;object-fit:cover;object-position:top}figcaption{color:#4c5356}strong{font-weight:700}.nav{font:13px Arial,sans-serif;margin-bottom:30px}.nav a{margin-right:20px}@page{size:A4;margin:18mm 17mm} @media print{html{background:white}body{padding:0;font-size:10.8pt;line-height:1.5;max-width:none}h1{font-size:24pt}h2{font-size:16pt;break-after:avoid}h3{break-after:avoid}.comparison-pair img{height:150px}figcaption,.comparison-pair p{font-size:8pt}table{font-size:8.5pt}th,td{padding:6px}.nav{display:none}a{color:#293f4b}.footnotes{font-size:8.5pt}p{orphans:3;widows:3}} @media(max-width:600px){body{padding:30px 22px;font-size:15px}h1{font-size:30px}.comparison-pair{grid-template-columns:1fr}.comparison-pair img{height:auto}table{font-size:11px}th,td{padding:6px}}`;
const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Medical visualization design evidence</title><style>'+css+'</style><body><nav class="nav"><a href="../index.html">Open interactive atlas</a><a href="design-evidence.pdf">Download PDF</a></nav>'+md.render(source)+'</body></html>';
await writeFile('research/index.html',html);console.log('Research HTML built.');

if(process.argv.includes('--pdf')){
  for(const name of ['preview-enhanced-desktop.png','preview-enhanced-mobile.png','preview-enhanced-arabic.png','preview-enhanced-immersive.png'])await access(name);
  const {chromium}=await import('playwright');
  const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.goto(new URL('../research/index.html',import.meta.url).href,{waitUntil:'load'});
    await page.evaluate(()=>document.fonts.ready);
    const missing=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||!image.naturalWidth).map(image=>image.getAttribute('src')));
    if(missing.length||errors.length)throw new Error(JSON.stringify({missingImages:missing,browserErrors:errors}));
    await page.pdf({path:'research/design-evidence.pdf',format:'A4',printBackground:true,preferCSSPageSize:true});
    await page.screenshot({path:'research/report-preview.png',fullPage:false});
    console.log('Research PDF and preview built.');
  }finally{await browser.close();}
}
