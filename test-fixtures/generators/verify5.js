// static mode + register/filter regression
const {launch,shot,txt}=require('./drv.js');
const {as,nav}=require('./lib.js');
const ok=(l,p,d)=>console.log((p?'  PASS  ':'  FAIL  ')+l+(d?'  — '+d:''));
(async()=>{
 const {b,pg}=await launch();
 await pg.goto('http://localhost:8099/index.html',{waitUntil:'networkidle'}); await pg.waitForTimeout(2500);
 if(await pg.$('#su-org')){
   await pg.fill('#su-org','Static Test Ltd'); await pg.fill('#su-name','Test User');
   await pg.fill('#su-email','test@static.co.ke'); await pg.fill('#su-pass','Password123!');
   await pg.click('#su-go'); await pg.waitForTimeout(3000);
 }
 let errs=0;
 for(const v of ['register','migration','templates','team','calendar','reports','pipeline','dashboard']){
   await pg.evaluate(x=>window.setView(x),v); await pg.waitForTimeout(800);
   errs=pg.logs.filter(l=>l.startsWith('PAGEERROR')).length;
 }
 ok('static mode: every view renders with no page errors',errs===0,JSON.stringify(pg.logs.filter(l=>l.startsWith('PAGEERROR')).slice(0,3)));
 await shot(pg,'verify-static');
 await b.close();

 const {b:b2,pg:pg2}=await as('amina@mwangifoods.co.ke');
 await pg2.waitForTimeout(1500);
 const counts=await pg2.evaluate(async()=>{
   const probe=async qs=>{const r=await (await fetch('/api/contracts?'+qs)).json();return {total:r.total,rows:r.rows.length};};
   return {all:await probe('limit=200'),draft:await probe('status=Draft&limit=200'),
           draftProc:await probe('status=Draft&folder=proc&limit=200'),zero:await probe('status=Draft&folder=mktg&q=zzz&limit=200')};});
 const exact=Object.values(counts).every(c=>c.total===c.rows);
 ok('filter counts still exactly match rows returned',exact,JSON.stringify(counts));
 await nav(pg2,'register'); await pg2.waitForTimeout(1500);
 const t=await txt(pg2);
 ok('register renders',/Register|contracts/i.test(t)&&t.length>800,'chars='+t.length);
 ok('no page errors in server mode',pg2.logs.filter(l=>l.startsWith('PAGEERROR')).length===0,JSON.stringify(pg2.logs.filter(l=>l.startsWith('PAGEERROR')).slice(0,3)));
 await shot(pg2,'verify-register');
 await b2.close();
})();
