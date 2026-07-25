// Minimal raw-PDF writer. Two modes: normal Tj text, and Skia/Google-Docs style
// per-glyph TJ positioning with no space glyphs.
const fs=require('fs');

function esc(s){ return s.replace(/[\\()]/g, c=>'\\'+c); }

function build({pages, producer, skia}){
  const objs=[]; // 1-indexed content
  const add=s=>{ objs.push(s); return objs.length; };
  // reserve: 1 catalog, 2 pages, then per page: page obj + content stream
  const fontObj='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  const pageObjNums=[]; const parts=[];
  let n=3; // 1=catalog 2=pages
  const fontNum=n++;
  const pageEntries=[];
  for(const lines of pages){
    const pn=n++, cn=n++;
    pageEntries.push({pn,cn,lines});
    pageObjNums.push(pn);
  }
  const body={};
  body[1]=`<< /Type /Catalog /Pages 2 0 R >>`;
  body[2]=`<< /Type /Pages /Kids [${pageObjNums.map(p=>p+' 0 R').join(' ')}] /Count ${pageObjNums.length} >>`;
  body[fontNum]=fontObj;
  for(const {pn,cn,lines} of pageEntries){
    body[pn]=`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontNum} 0 R >> >> /Contents ${cn} 0 R >>`;
    let stream='BT /F1 11 Tf 14 TL 56 780 Td\n';
    for(const line of lines){
      if(skia){
        // Skia/Google Docs: each word placed with its own Tj at an explicit
        // position, no space glyphs emitted at all.
        let x=56; const y=null;
        const words=line.split(' ');
        stream+='ET\n';
        let cx=56;
        for(const w of words){
          if(w==='') { cx+=3.06; continue; }
          stream+=`BT /F1 11 Tf 1 0 0 1 ${cx.toFixed(2)} __Y__ Tm [`;
          // per-glyph with kerning offsets, the way Skia emits it
          stream+=w.split('').map(ch=>`(${esc(ch)}) -2`).join(' ');
          stream+='] TJ ET\n';
          cx += w.length*6.1 + 3.06;
        }
        stream+='BT /F1 11 Tf 14 TL 56 780 Td\n';
        stream+='__NL__\n';
      } else {
        stream+=`(${esc(line)}) Tj T*\n`;
      }
    }
    stream+='ET';
    if(skia){
      // resolve the Y placeholders
      let y=780; let out=[];
      for(const ln of stream.split('\n')){
        if(ln==='__NL__'){ y-=14; out.push(''); continue; }
        out.push(ln.replace('__Y__', y.toFixed(2)));
      }
      stream=out.filter(Boolean).join('\n');
    }
    body[cn]=`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  }
  let pdf='%PDF-1.4\n';
  const offsets={};
  const maxN=n-1;
  for(let i=1;i<=maxN;i++){
    offsets[i]=Buffer.byteLength(pdf);
    pdf+=`${i} 0 obj\n${body[i]||'<< >>'}\nendobj\n`;
  }
  const infoNum=maxN+1;
  offsets[infoNum]=Buffer.byteLength(pdf);
  pdf+=`${infoNum} 0 obj\n<< /Producer (${esc(producer||'HaTi test fixture')}) /Creator (${esc(producer||'HaTi test fixture')}) >>\nendobj\n`;
  const xrefPos=Buffer.byteLength(pdf);
  pdf+=`xref\n0 ${infoNum+1}\n0000000000 65535 f \n`;
  for(let i=1;i<=infoNum;i++) pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  pdf+=`trailer\n<< /Size ${infoNum+1} /Root 1 0 R /Info ${infoNum} 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
  return Buffer.from(pdf,'latin1');
}
module.exports={build};
