const path=require('node:path'),fs=require('node:fs'),http=require('node:http');
const {chromium}=require('playwright-core');
const ROOT=path.join(__dirname);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const srv=http.createServer((req,rep)=>{const rel=decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'');
 const f=path.join(ROOT,rel||'index.html');
 if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rep.writeHead(404);rep.end('x');return;}
 rep.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(rep);});
srv.listen(0,'127.0.0.1',async()=>{const port=srv.address().port;
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
const page=await b.newPage({viewport:{width:1440,height:940}});
await page.goto(`http://127.0.0.1:${port}/test/chromium/parity.html`,{waitUntil:'load'});
await page.evaluate(()=>window.READY); await new Promise(r=>setTimeout(r,400));
await page.evaluate(()=>window.SHOW_OWNER()); await new Promise(r=>setTimeout(r,500));
const R=()=>{const paper=document.querySelector('.redline-page .rl-paper');
 const el=paper.querySelector('.rl-clause-p, .rl-line, .nego-body, p');
 const root=document.querySelector('.redline-page');
 return {tag:el.tagName+'.'+el.className, fs:getComputedStyle(el).fontSize,
   rootVar:getComputedStyle(root).getPropertyValue('--rl-doc-type'),
   paperVar:getComputedStyle(paper).getPropertyValue('--rl-doc-type'),
   elVar:getComputedStyle(el).getPropertyValue('--rl-doc-type'),
   h:Math.round(el.getBoundingClientRect().height),
   rootInline: root.getAttribute('style')};};
console.log('15:',JSON.stringify(await page.evaluate(R)));
await page.evaluate(()=>rlSetDocType(20)); await new Promise(r=>setTimeout(r,500));
console.log('20:',JSON.stringify(await page.evaluate(R)));
await b.close();srv.close();});
