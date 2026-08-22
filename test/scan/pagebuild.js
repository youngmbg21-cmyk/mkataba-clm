/* ============================================================
   Making a scan — the page builders, injected into the browser
   ============================================================
   These run INSIDE the page, because that is the only place there is a real
   canvas, a real font renderer and a real JPEG encoder. They take a known
   contract page and hand back the bytes a scanner, a photocopier or a phone
   would have produced from it — which is what gives this measurement an
   answer key: we know exactly what the paper says.

   Exported as one source string and injected with addInitScript, so the test
   file stays readable and the page code stays in one place. */
'use strict';

const PAGE_BUILDERS = `
window.SCAN = (function(){

  /* ---------- draw the page ----------
     A4 at the DPI asked for. Georgia rather than a sans face because contract
     paper is set in a serif and serifs are what a recogniser finds hardest —
     measuring against the easy case would flatter the result. */
  function drawPage(lines, { dpi=200, font='Georgia, serif' }={}){
    const W=Math.round(8.27*dpi), H=Math.round(11.69*dpi);
    const c=document.createElement('canvas'); c.width=W; c.height=H;
    const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,W,H);
    x.fillStyle='#111'; x.textBaseline='top';
    const size=Math.round(dpi*0.155), lead=Math.round(size*1.55);
    let y=Math.round(dpi*0.9);
    for(const raw of lines){
      const bold=/^[0-9]+\\.\\s|^[A-Z][A-Z ]{4,}$/.test(raw);
      x.font=(bold?'bold ':'')+size+'px '+font;
      x.fillText(raw, Math.round(dpi*0.9), y);
      y+=lead;
    }
    return c;
  }

  /* ---------- degrade it ----------
     Each of these is one real journey the paper takes, and each is a different
     reason a recogniser struggles.

     A FIRST VERSION OF THIS DID ALMOST NOTHING AND SCORED 100% ON EVERYTHING,
     which is how it was caught. It added speckle and THEN thresholded, and a
     hard threshold removes exactly the noise that had just been added: the
     glyph cores stayed solid, the background stayed white, and "faxed" paper
     came back cleaner than the original. Order matters — the damage has to
     happen after the step that would repair it, which is also the order the
     real world does it in. */
  function blur(x, c, r){
    x.filter='blur('+r+'px)'; x.drawImage(c,0,0); x.filter='none';
  }
  function resample(c, k){            // down and back up: detail that is gone stays gone
    const t=document.createElement('canvas');
    t.width=Math.max(1,Math.round(c.width*k)); t.height=Math.max(1,Math.round(c.height*k));
    const tx=t.getContext('2d'); tx.imageSmoothingQuality='low'; tx.drawImage(c,0,0,t.width,t.height);
    const o=document.createElement('canvas'); o.width=c.width; o.height=c.height;
    o.getContext('2d').drawImage(t,0,0,c.width,c.height);
    return o;
  }
  function degrade(src, how){
    let c=document.createElement('canvas'); c.width=src.width; c.height=src.height;
    let x=c.getContext('2d');
    x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height);

    if(how==='skew'){                       // a phone photo, hand-held
      x.translate(c.width/2,c.height/2); x.rotate(2.6*Math.PI/180); x.translate(-c.width/2,-c.height/2);
      x.drawImage(src,0,0);
      x.setTransform(1,0,0,1,0,0);
      c=resample(c,0.55);                   // held too far away
      x=c.getContext('2d');
      blur(x,c,1.1);                        // and not quite in focus
      const g=x.createLinearGradient(0,0,c.width,c.height);   // a window on one side
      g.addColorStop(0,'rgba(0,0,0,0.22)'); g.addColorStop(0.45,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.34)');
      x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
      return c;
    }

    x.drawImage(src,0,0);
    if(how==='fax'){
      /* Photocopied twice and faxed once, in that order:
           lose detail  →  threshold to 1 bit  →  THEN the drum picks up dirt
         and the dirt is what survives, because nothing downstream cleans it. */
      c=resample(c,0.5); x=c.getContext('2d');
      blur(x,c,0.6);
      const d=x.getImageData(0,0,c.width,c.height), p=d.data;
      for(let i=0;i<p.length;i+=4){
        const v=p[i]*0.299+p[i+1]*0.587+p[i+2]*0.114;
        const t=v>150?255:0;
        p[i]=p[i+1]=p[i+2]=t;
      }
      // salt and pepper AFTER the threshold — 1.2% of pixels flipped outright
      for(let n=0;n<p.length/4*0.012;n++){
        const i=(Math.floor(Math.random()*(p.length/4)))*4;
        const v=Math.random()<0.5?0:255;
        p[i]=p[i+1]=p[i+2]=v;
      }
      x.putImageData(d,0,0);
      // a scanner that fed the sheet slightly crooked
      const o=document.createElement('canvas'); o.width=c.width; o.height=c.height;
      const ox=o.getContext('2d'); ox.fillStyle='#fff'; ox.fillRect(0,0,o.width,o.height);
      ox.translate(o.width/2,o.height/2); ox.rotate(0.9*Math.PI/180); ox.translate(-o.width/2,-o.height/2);
      ox.drawImage(c,0,0);
      return o;
    }
    return c;
  }

  /* ---------- an image-only PDF, which is what a scanner writes ----------
     One page, one DCTDecode image drawn to fill it, a real cross-reference
     table. No text objects anywhere in the file — that absence is the whole
     point, and the first thing the measurement checks. */
  function imagePdf(jpegDataUrl, w, h){
    const b64=jpegDataUrl.split(',')[1];
    const bin=atob(b64);
    const pw=Math.round(w*72/200), ph=Math.round(h*72/200);
    const objs=[];
    objs[1]='<</Type/Catalog/Pages 2 0 R>>';
    objs[2]='<</Type/Pages/Kids[3 0 R]/Count 1>>';
    objs[3]='<</Type/Page/Parent 2 0 R/Resources<</XObject<</Im0 4 0 R>>>>'
           +'/MediaBox[0 0 '+pw+' '+ph+']/Contents 5 0 R>>';
    const content=pw+' 0 0 '+ph+' 0 0 cm /Im0 Do';
    let out='%PDF-1.4\\n', offsets=[0];
    const put=(n,body)=>{ offsets[n]=out.length; out+=n+' 0 obj\\n'+body+'\\nendobj\\n'; };
    put(1,objs[1]); put(2,objs[2]); put(3,objs[3]);
    offsets[4]=out.length;
    out+='4 0 obj\\n<</Type/XObject/Subtype/Image/Width '+w+'/Height '+h
       +'/ColorSpace/DeviceRGB/BitsPerComponent 8/Filter/DCTDecode/Length '+bin.length+'>>\\nstream\\n'
       +bin+'\\nendstream\\nendobj\\n';
    put(5,'<</Length '+content.length+'>>\\nstream\\n'+content+'\\nendstream');
    const xref=out.length;
    out+='xref\\n0 6\\n0000000000 65535 f \\n';
    for(let i=1;i<=5;i++) out+=String(offsets[i]).padStart(10,'0')+' 00000 n \\n';
    out+='trailer\\n<</Size 6/Root 1 0 R>>\\nstartxref\\n'+xref+'\\n%%EOF\\n';
    let b='';
    for(let i=0;i<out.length;i+=8192) b+=String.fromCharCode.apply(null,
      Array.from(out.slice(i,i+8192)).map(ch=>ch.charCodeAt(0)&0xff));
    return 'data:application/pdf;base64,'+btoa(b);
  }

  /* One named variant, ready to feed the pipeline. */
  function make(lines, kind){
    const dpi = kind==='low' ? 100 : 200;
    const q   = kind==='low' ? 0.30 : kind==='fax' ? 0.35 : kind==='skew' ? 0.45 : 0.82;
    let c = drawPage(lines, { dpi });
    if(kind==='fax'||kind==='skew') c = degrade(c, kind);
    const jpeg = c.toDataURL('image/jpeg', q);
    return { jpeg, pdf: imagePdf(jpeg, c.width, c.height), w:c.width, h:c.height,
      bytes: Math.round(jpeg.length*0.75) };
  }

  return { drawPage, degrade, imagePdf, make };
})();
`;

module.exports = { PAGE_BUILDERS };
