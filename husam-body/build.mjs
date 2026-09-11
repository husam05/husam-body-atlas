import {build} from 'esbuild';
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
const result=await build({entryPoints:['src/app.js'],bundle:true,minify:true,format:'iife',write:false,legalComments:'inline'});
const css=(await readFile('src/style.css','utf8'))+'\n'+(await readFile('src/modern.css','utf8'));
const html=await readFile('src/index.template.html','utf8');
await writeFile('index.html',html.replace('/* APP_CSS */',()=>css).replace('/* APP_JS */',()=>result.outputFiles[0].text.replaceAll('</script','<\\/script')));
console.log('Built offline index.html. Open it directly in a browser.');
