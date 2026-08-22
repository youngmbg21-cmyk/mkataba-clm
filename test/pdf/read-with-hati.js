const fs=require('fs'), path=require('path');
const P=require('./paths.js');
process.chdir(path.join(__dirname,'..','..'));
const { buildWorld } = require('../world.js');
(async()=>{
  const w = await buildWorld({ contractView:true });
  const read = w.win.extractPdfText;
  const files=[]; (function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
    if(e.isDirectory())walk(p); else if(e.name.endsWith('.pdf'))files.push(p);}})(P.CORPUS); files.sort();
  const out={};
  for(const f of files){
    const name=path.relative(P.CORPUS,f);
    const b=fs.readFileSync(f);
    const t0=Date.now();
    try{
      const txt = await read(b.buffer.slice(b.byteOffset, b.byteOffset+b.byteLength));
      out[name]={text:String(txt||''), ms:Date.now()-t0};
    }catch(e){ out[name]={err:(e.message||String(e)).slice(0,120), ms:Date.now()-t0}; }
  }
  fs.writeFileSync(P.GOT,JSON.stringify(out));
  console.log('HaTi produced text for', Object.values(out).filter(x=>x.text&&x.text.trim()).length, 'of', files.length,
              '· threw on', Object.values(out).filter(x=>x.err).length);
})().catch(e=>{console.error('FAILED',e.message);process.exit(1);});
