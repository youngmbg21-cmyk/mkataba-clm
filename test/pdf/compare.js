const fs=require('fs');
const P=require('./paths.js');
const ref=JSON.parse(fs.readFileSync(P.REF)), got=JSON.parse(fs.readFileSync(P.GOT));
const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
const words=s=>norm(s).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(Boolean);
function recall(r,g){const R=words(r);if(!R.length)return null;const M=new Map();
  for(const t of words(g))M.set(t,(M.get(t)||0)+1);
  let h=0;for(const t of R){const n=M.get(t)||0;if(n>0){h++;M.set(t,n-1);}}return h/R.length;}
const rows=Object.keys(ref).map(k=>{
  const r=ref[k], g=got[k]||{};
  const comparable = !!(r.text && norm(r.text).length>20);
  return { k, comparable, refLen:norm(r.text).length, gotLen:norm(g.text).length,
    refErr:r.err||null, gotErr:g.err||null, ms:g.ms,
    rec: comparable ? recall(r.text,g.text) : null };
});
const pct=x=>x==null?'  —  ':(Math.round(x*100)+'%').padStart(5);
console.log('\nHaTi\'s PDF reader vs pdf.js — real-world PDFs');
console.log('recall = share of the words pdf.js found that HaTi also found\n');
console.log('recall   pdf.js    HaTi   ms   file');
console.log('-'.repeat(84));
for(const x of rows.filter(x=>x.comparable).sort((a,b)=>a.rec-b.rec))
  console.log(`${pct(x.rec)} ${String(x.refLen).padStart(8)} ${String(x.gotLen).padStart(7)} ${String(x.ms).padStart(4)}   ${x.k}`);
const sc=rows.filter(x=>x.comparable);
console.log('-'.repeat(84));
const mean=sc.reduce((a,x)=>a+x.rec,0)/sc.length;
console.log(`${sc.length} comparable · mean recall ${Math.round(mean*100)}%`);
console.log(`  perfect or near (>=95%): ${sc.filter(x=>x.rec>=.95).length}`);
console.log(`  usable            (>=80%): ${sc.filter(x=>x.rec>=.80).length}`);
console.log(`  poor               (<50%): ${sc.filter(x=>x.rec<.50).length}`);
console.log(`  NOTHING at all        (0%): ${sc.filter(x=>x.gotLen===0).length}`);
console.log('\nNot comparable (pdf.js found no text either — image-only or encrypted):');
for(const x of rows.filter(x=>!x.comparable)) console.log('  '+x.k+(x.refErr?'  — '+x.refErr:'')+(x.gotLen?`  [HaTi returned ${x.gotLen} chars]`:''));
