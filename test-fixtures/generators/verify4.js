// F-010: close the tab mid-batch, reopen, and be told which files never landed.
const {as,shot,txt,nav}=require('./lib.js');
const FIX='/home/user/mkataba-clm/test-fixtures/';
const ok=(l,p,d)=>console.log((p?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));
(async()=>{
 const {b,ctx,pg}=await as('amina@mwangifoods.co.ke');
 await nav(pg,'migration'); await pg.waitForTimeout(1200);
 await ctx.route('**/api/contracts/**',async r=>{await new Promise(s=>setTimeout(s,2500));await r.continue();});
 await ctx.route('**/api/files**',async r=>{await new Promise(s=>setTimeout(s,2500));await r.continue();});
 const files=Array.from({length:10},(_,i)=>FIX+'varied-'+String(i+1).padStart(2,'0')+'.pdf');
 await pg.setInputFiles('#mig-files',files);
 for(let i=0;i<50;i++){ await pg.waitForTimeout(500);
   const s=await pg.evaluate(()=>window.state.mig.queue.filter(q=>q.status==='saved').length).catch(()=>0);
   if(s>=2) break; }
 const mid=await pg.evaluate(()=>window.state.mig.queue.map(q=>q.status));
 console.log('  at close:',JSON.stringify(mid.reduce((a,x)=>(a[x]=(a[x]||0)+1,a),{})));
 await b.close();   // tab closed mid-batch

 const {b:b2,pg:pg2}=await as('amina@mwangifoods.co.ke');
 await nav(pg2,'migration'); await pg2.waitForTimeout(3500);
 const t=await txt(pg2);
 ok('F-010 the interrupted batch is reported',/did not finish/.test(t),(t.match(/Batch [^\n]*did not finish[^\n]*/)||[''])[0]);
 ok('F-010 the missing files are named by name',/varied-\d\d\.pdf/.test(t),(t.match(/varied-\d\d\.pdf/g)||[]).slice(0,4).join(', '));
 await shot(pg2,'verify-unfinished-batch');
 await b2.close();
})();
