/* THE REFERENCE READING — Mozilla's pdf.js, run in its OWN PROCESS.
   jsdom (which read-with-hati.js needs) installs a browser-shaped global
   environment that pdf.js then detects and half-uses, and it silently
   returns nothing. The two readers never share a process for that reason. */
import fs from 'node:fs'; import path from 'node:path';
import { createRequire } from 'node:module';
const P = createRequire(import.meta.url)('./paths.js');
const pdfjs = await import(P.PDFJS+'/pdf.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = P.PDFJS+'/pdf.worker.mjs';
const files=[]; (function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  if(e.isDirectory())w(p); else if(e.name.endsWith('.pdf'))files.push(p);}})(P.CORPUS); files.sort();
const out={};
for(const f of files){
  const name=path.relative(P.CORPUS,f);
  let doc=null, pages=0, t='';
  try{
    doc = await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(f)),verbosity:0}).promise;
    pages = doc.numPages;
    for(let i=1;i<=pages;i++){
      const c = await (await doc.getPage(i)).getTextContent();
      t += c.items.map(x=>x.str).join(' ')+'\n';
    }
    out[name]={text:t,pages};
  }catch(e){
    // Keep whatever was read before the failure — a page 4 that throws must not
    // discard pages 1-3, and cleanup failing must not discard the lot.
    out[name] = t.trim() ? {text:t,pages,partial:(e.message||String(e)).slice(0,90)}
                         : {err:(e.message||String(e)).slice(0,90)};
  }
  try{ if(doc && typeof doc.destroy==='function') await doc.destroy(); }catch(_){}
}
fs.writeFileSync(P.REF,JSON.stringify(out));
console.log('pdf.js read', Object.values(out).filter(x=>x.text&&x.text.trim()).length, 'of', files.length);
