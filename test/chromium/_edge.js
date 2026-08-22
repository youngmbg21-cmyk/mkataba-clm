/* Screenshot the SAME REGION of both pages at the same scale and measure glyph
   edge quality. A crisp glyph is mostly full-ink or full-paper; a soft one
   spends its pixels in the greys between. smear = mid-tones per dark pixel. */
const fs=require('node:fs');
const {chromium}=require('playwright-core');
const {startHati,seedWorkspace}=require('../helpers');
const V3='/tmp/claude-0/-home-user-mkataba-clm/cf4134ec-0f3e-56f6-9a8a-e4c5cc67e218/scratchpad/v3-localfont.html';
const SHOTS='/tmp/claude-0/-home-user-mkataba-clm/cf4134ec-0f3e-56f6-9a8a-e4c5cc67e218/scratchpad/';
async function measure(p,sel,name,file){
  const el=p.locator(sel).first();
  if(!await el.count()){ console.log(name+'  (no '+sel+')'); return; }
  const buf=await el.screenshot({path:SHOTS+file});
  const r=await p.evaluate(async b64=>{
    const img=new Image();
    await new Promise(r=>{img.onload=r; img.src='data:image/png;base64,'+b64;});
    const cv=document.createElement('canvas'); cv.width=img.width; cv.height=img.height;
    const cx=cv.getContext('2d'); cx.drawImage(img,0,0);
    const d=cx.getImageData(0,0,cv.width,cv.height).data;
    let dark=0, mid=0, n=0, minL=255;
    for(let i=0;i<d.length;i+=4){
      const l=0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2];
      n++; if(l<minL) minL=l;
      if(l<64) dark++; else if(l<224) mid++;
    }
    return {w:cv.width,h:cv.height,darkest:Math.round(minL),
            darkPct:+(100*dark/n).toFixed(2), midPct:+(100*mid/n).toFixed(2),
            smear:+(mid/Math.max(dark,1)).toFixed(2)};
  },buf.toString('base64'));
  console.log(name.padEnd(22)+JSON.stringify(r));
}
(async()=>{
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const p1=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await p1.goto('file://'+V3,{waitUntil:'load'}); await p1.evaluate(()=>document.fonts.ready);
  await p1.waitForTimeout(600);
  await measure(p1,'.h-h','DESIGN title','d-title.png');
  await measure(p1,'.h-facets','DESIGN facts','d-facts.png');

  const h=await startHati(); await seedWorkspace(h);
  const p2=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
  await p2.goto(h.base+'/',{waitUntil:'networkidle'});
  await p2.fill('#li-email','admin@example.co.ke'); await p2.fill('#li-pass','adminpassword1');
  await p2.click('#li-go'); await p2.waitForTimeout(2500);
  await p2.evaluate(()=>openWorkspace(state.contracts[0].id)); await p2.waitForTimeout(2000);
  await p2.evaluate(()=>document.fonts.ready);
  await measure(p2,'.room-head h1','HaTi title','h-title.png');
  await measure(p2,'.room-facets','HaTi facts','h-facts.png');
  await b.close(); await h.stop();
})();
