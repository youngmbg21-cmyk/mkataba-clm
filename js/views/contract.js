// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   INBOUND / UPLOADED CONTRACTS  ("their paper")
   A received document is stored as a file and wrapped in the same
   review → scan → sign → audit workflow as generated contracts.
   ============================================================ */
const upField=(id,label,ph,type='text')=>`<label class="block"><span class="text-xs font-medium text-brand-800/70">${label}</span><input id="${id}" type="${type}" placeholder="${ph}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"/></label>`;

/* ---------- document text extraction (client-side, no external service) ----------
   A small PDF reader built on the browser's DecompressionStream: it walks the
   page tree, replays each page's content stream through the text operators, and
   lays the positioned runs back out as lines and paragraphs. That layout step is
   the point — a PDF stores glyphs at coordinates, not sentences, so simply
   concatenating the strings in a content stream yields the familiar
   "S e r v i c e   F e e s" soup with every line break lost. Works for standard
   text PDFs and .txt; image-only PDFs / Word fall back to the manual checklist. */
async function inflateBytes(bytes){
  for(const fmt of ['deflate','deflate-raw']){
    try{ const ds=new DecompressionStream(fmt);
      const stream=new Blob([bytes]).stream().pipeThrough(ds);
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }catch(e){}
  }
  return null;
}
const pdfLatin=bytes=>{ let s=''; for(let i=0;i<bytes.length;i++) s+=String.fromCharCode(bytes[i]); return s; };
// WinAnsiEncoding's high range — where the smart quotes, dashes and bullets that
// fill a Word-authored contract live (bytes 128–159 are not Latin-1)
const PDF_WINANSI={128:'€',130:'‚',131:'ƒ',132:'„',133:'…',134:'†',135:'‡',136:'ˆ',137:'‰',
  138:'Š',139:'‹',140:'Œ',142:'Ž',145:'‘',146:'’',147:'“',148:'”',149:'•',150:'–',151:'—',
  152:'˜',153:'™',154:'š',155:'›',156:'œ',158:'ž',159:'Ÿ',160:' ',173:'‐'};

/* ---- indirect objects ---- */
function pdfIndexObjects(bin){
  const objs=new Map(); const re=/(\d+)\s+(\d+)\s+obj\b/g; let m;
  while((m=re.exec(bin))){
    const num=Number(m[1]), start=m.index+m[0].length;
    const end=bin.indexOf('endobj', start);
    const body=bin.slice(start, end<0?Math.min(bin.length,start+400000):end);
    const sm=/\bstream\r?\n/.exec(body);
    let dict=body, raw=null;
    if(sm){
      dict=body.slice(0, sm.index);
      const sStart=start+sm.index+sm[0].length;
      const lm=/\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
      let sEnd=lm?sStart+Number(lm[1]):-1;
      if(sEnd<0 || bin.slice(sEnd, sEnd+20).indexOf('endstream')<0){
        const alt=bin.indexOf('endstream', sStart); sEnd=alt<0?sStart:alt;
      }
      raw=bin.slice(sStart, sEnd);
    }
    if(!objs.has(num)) objs.set(num,{dict,raw});
  }
  return objs;
}
async function pdfStreamBytes(o){
  if(!o||o.raw==null) return null;
  const arr=Uint8Array.from(o.raw, ch=>ch.charCodeAt(0)&0xff);
  /* A DECLARED-FLATE STREAM THAT WILL NOT INFLATE IS NOT READABLE, and
     `return inf||arr` said otherwise: it handed the raw compressed bytes back
     as though they were the decoded content. Everything above this treats the
     return value as text — the content-stream walker turns it straight into
     drawing operators — so a truncated, encrypted or oddly-predicted stream
     became a page full of high-entropy noise that then looked, to every check
     downstream, like a document with text in it.

     Null is what the callers already handle: "this stream could not be read". */
  if(/\/Flate/.test(o.dict)) return await inflateBytes(arr) || null;
  return arr;
}
/* PDF 1.5+ keeps most non-stream objects (page dicts, fonts) inside /ObjStm containers */
async function pdfExpandObjStreams(objs){
  for(const [,o] of [...objs]){
    if(!o.raw||!/\/Type\s*\/ObjStm/.test(o.dict)) continue;
    const bytes=await pdfStreamBytes(o); if(!bytes) continue;
    const txt=pdfLatin(bytes);
    const n=Number((/\/N\s+(\d+)/.exec(o.dict)||[])[1]||0);
    const first=Number((/\/First\s+(\d+)/.exec(o.dict)||[])[1]||0);
    if(!n||!first) continue;
    const head=txt.slice(0,first).trim().split(/\s+/).map(Number);
    for(let i=0;i<n;i++){
      const num=head[i*2], off=head[i*2+1];
      if(!Number.isFinite(num)||!Number.isFinite(off)) continue;
      const nextOff=(i+1<n&&Number.isFinite(head[i*2+3]))?first+head[i*2+3]:txt.length;
      if(!objs.has(num)) objs.set(num,{dict:txt.slice(first+off,nextOff),raw:null});
    }
  }
  return objs;
}
const pdfRef=s=>{ const m=/^\s*(\d+)\s+\d+\s+R/.exec(s||''); return m?Number(m[1]):null; };
const pdfDictVal=(dict,key)=>{ const i=dict.indexOf(key); return i<0?'':dict.slice(i+key.length, i+key.length+240); };

/* pages in reading order: catalog → /Pages → /Kids, else document order */
function pdfPageObjects(objs){
  let rootNum=null;
  for(const [,o] of objs){ if(/\/Type\s*\/Catalog/.test(o.dict)){ rootNum=pdfRef(pdfDictVal(o.dict,'/Pages')); break; } }
  const pages=[], seen=new Set();
  (function walk(num){
    if(num==null||seen.has(num)||pages.length>2000) return; seen.add(num);
    const o=objs.get(num); if(!o) return;
    if(/\/Type\s*\/Page[^s]/.test(o.dict)){ pages.push(num); return; }
    const ki=o.dict.indexOf('/Kids'); if(ki<0) return;
    const arr=/\[([\s\S]*?)\]/.exec(o.dict.slice(ki)); if(!arr) return;
    const kre=/(\d+)\s+\d+\s+R/g; let k;
    while((k=kre.exec(arr[1]))) walk(Number(k[1]));
  })(rootNum);
  if(!pages.length){
    for(const [num,o] of objs) if(/\/Type\s*\/Page[^s]/.test(o.dict)) pages.push(num);
    pages.sort((a,b)=>a-b);
  }
  return pages;
}

/* ---- /ToUnicode CMaps: the only way to read Identity-H (subset) fonts ---- */
function pdfParseCMap(txt){
  const map=new Map();
  const uni=h=>{ let s=''; for(let i=0;i+3<h.length+(h.length%4?1:0);i+=4){ const c=parseInt(h.slice(i,i+4),16); if(Number.isFinite(c)) s+=String.fromCharCode(c); } return s; };
  let m;
  const bc=/beginbfchar([\s\S]*?)endbfchar/g;
  while((m=bc.exec(txt))){ const pre=/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]*)>/g; let p;
    while((p=pre.exec(m[1]))) map.set(parseInt(p[1],16), uni(p[2])); }
  const br=/beginbfrange([\s\S]*?)endbfrange/g;
  while((m=br.exec(txt))){
    const pre=/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]*)>|\[([\s\S]*?)\])/g; let p;
    while((p=pre.exec(m[1]))){
      const lo=parseInt(p[1],16), hi=parseInt(p[2],16);
      if(p[3]!=null){ const base=parseInt(p[3].slice(-4)||'0',16);
        for(let c=lo;c<=hi&&c-lo<65536;c++) map.set(c,String.fromCharCode(base+(c-lo)));
      } else if(p[4]!=null){
        [...p[4].matchAll(/<([0-9A-Fa-f]*)>/g)].forEach((it,k)=>map.set(lo+k, uni(it[1])));
      }
    }
  }
  return map;
}
/* An array value that may sit inline or behind an indirect reference.
   Brackets are matched by DEPTH, not by the first `]` — a CID font's /W array
   nests width groups inside it (`/W [0 [778] 20 21 500 …]`), so stopping at the
   first close truncates it to noise, and the leftovers then parse as ranges of
   zero-width glyphs. That is not a cosmetic bug: every advance downstream comes
   out wrong, the running x-position drifts, and the layout pass turns the drift
   into spaces in the middle of words. */
/* Index of a dictionary key, as a whole NAME token. `/W` must not match inside
   `/Widths` or `/WinAnsiEncoding`, which a plain indexOf happily does. */
function pdfKeyIndex(dict, key){
  let from=0;
  for(;;){
    const i=dict.indexOf(key, from); if(i<0) return -1;
    const nx=dict[i+key.length];
    if(nx===undefined || /[\s()<>[\]{}/%]/.test(nx)) return i;
    from=i+1;
  }
}
function pdfArray(objs, dict, key){
  const i=pdfKeyIndex(dict, key); if(i<0) return null;
  const tail=dict.slice(i+key.length);
  const ref=pdfRef(tail);
  const src = ref!=null ? (objs.get(ref)?.dict||'') : tail;
  const start=src.indexOf('['); if(start<0) return null;
  let depth=0;
  for(let j=start;j<src.length;j++){
    const c=src[j];
    if(c==='[') depth++;
    else if(c===']'){ depth--; if(!depth) return src.slice(start+1, j); }
  }
  return null;                                    // unbalanced — treat as absent
}
const pdfNum=(dict,key)=>{
  const i=pdfKeyIndex(dict||'', key); if(i<0) return null;
  const m=/^\s*(-?[\d.]+)/.exec((dict||'').slice(i+key.length));
  return m?parseFloat(m[1]):null;
};

/* ---- glyph advance widths ----
   THE thing that makes extracted text readable. A PDF ships the exact advance
   of every glyph — /Widths for a simple font, /W and /DW for a CID font, both
   in 1/1000 em. Guessing them instead (which this used to do, from a hardcoded
   per-character table) makes the running x-position drift, and once it drifts
   by ~a third of the point size the layout pass reads the drift as a word gap
   and splits a word: "MASTER RAW" comes out as "MA S TE R R A W".
   Widths are indexed by CHARACTER CODE, not by the decoded character, so the
   decoder hands the codes along with the text. */
async function pdfFontWidths(objs, o){
  const W=new Map();
  let dflt=null;
  if(/\/Subtype\s*\/Type0/.test(o.dict)){
    // CID font: the widths live on the descendant, /W is [ c [w…] | cFirst cLast w ]*
    const dfRef=pdfRef((pdfArray(objs,o.dict,'/DescendantFonts')||'').trim()) ??
                pdfRef(pdfDictVal(o.dict,'/DescendantFonts'));
    const df=dfRef!=null?objs.get(dfRef):null;
    if(df){
      dflt=pdfNum(df.dict,'/DW');
      const w=pdfArray(objs, df.dict, '/W');
      if(w){
        // tokenise into numbers and bracketed groups, in order
        const re=/\[([^\]]*)\]|(-?[\d.]+)/g; let m; const seq=[];
        while((m=re.exec(w))) seq.push(m[1]!=null ? {list:m[1].trim().split(/\s+/).map(Number)} : {n:parseFloat(m[2])});
        for(let i=0;i<seq.length;i++){
          if(seq[i].n==null) continue;
          if(seq[i+1] && seq[i+1].list){                       // c [w1 w2 …]
            const c=seq[i].n; seq[i+1].list.forEach((v,k)=>{ if(Number.isFinite(v)) W.set(c+k, v); });
            i++;
          } else if(seq[i+1] && seq[i+2] && seq[i+1].n!=null && seq[i+2].n!=null){   // cFirst cLast w
            const a=seq[i].n, b=seq[i+1].n, v=seq[i+2].n;
            if(b>=a && b-a<65536) for(let c=a;c<=b;c++) W.set(c, v);
            i+=2;
          }
        }
      }
    }
    if(dflt==null) dflt=1000;                                  // /DW default, per the spec
  } else {
    const first=pdfNum(o.dict,'/FirstChar');
    const arr=pdfArray(objs, o.dict, '/Widths');
    if(arr!=null && first!=null){
      arr.trim().split(/\s+/).map(Number).forEach((v,k)=>{ if(Number.isFinite(v)) W.set(first+k, v); });
    }
    const fd=pdfRef(pdfDictVal(o.dict,'/FontDescriptor'));
    if(fd!=null) dflt=pdfNum(objs.get(fd)?.dict||'','/MissingWidth');
  }
  return { widths:W, missing:dflt };
}
/* Is this font bold, italic, or both? Read in order of how much a producer can
   be trusted to have got it right:
     1. the BaseFont name — "…-Bold", "…-BoldItalic", "…,Italic"; subset prefixes
        like "AAAAAA+" are stripped first;
     2. the FontDescriptor /Flags — bit 7 (64) Italic, bit 19 (262144) ForceBold;
     3. /ItalicAngle and /StemV, which are metrics rather than declarations.
   A false positive here would bold half a contract, so the numeric fallbacks
   are deliberately conservative. */
async function pdfFontStyle(objs, o, twoByte){
  let dict=o.dict;
  if(twoByte){
    const dfRef=pdfRef((pdfArray(objs,o.dict,'/DescendantFonts')||'').trim());
    const df=dfRef!=null?objs.get(dfRef):null;
    if(df) dict=df.dict;
  }
  const bf=/\/BaseFont\s*\/([^\s/<>[\]()]+)/.exec(o.dict);
  const name=bf ? bf[1].replace(/^[A-Z]{6}\+/,'') : '';
  let bold=/bold|black|heavy|semib|demib|[-,_]bd\b/i.test(name);
  let italic=/italic|oblique|[-,_]it\b/i.test(name);

  const fdRef=pdfRef(pdfDictVal(dict,'/FontDescriptor'));
  const fd=fdRef!=null?objs.get(fdRef):null;
  if(fd){
    const flags=pdfNum(fd.dict,'/Flags');
    if(Number.isFinite(flags)){
      if(flags & 64) italic=true;                 // bit 7  — Italic
      if(flags & 262144) bold=true;               // bit 19 — ForceBold
    }
    const ang=pdfNum(fd.dict,'/ItalicAngle');
    if(Number.isFinite(ang) && Math.abs(ang)>=4) italic=true;
    // StemV is the vertical stem width; a text weight sits near 70-90, a bold
    // near 120-190. Only trust it when the name said nothing either way.
    if(!bold){ const sv=pdfNum(fd.dict,'/StemV'); if(Number.isFinite(sv) && sv>=120) bold=true; }
  }
  return { bold, italic };
}
async function pdfPageFonts(objs, resDict){
  const fonts={};
  const fi=resDict.indexOf('/Font'); if(fi<0) return fonts;
  const tail=resDict.slice(fi+5);
  const direct=pdfRef(tail);
  const inner=direct!=null ? (objs.get(direct)?.dict||null) : (/<<([\s\S]*?)>>/.exec(tail)||[])[1];
  if(!inner) return fonts;
  const fre=/\/([^\s/<>[\]()]+)\s+(\d+)\s+\d+\s+R/g; let f;
  while((f=fre.exec(inner))){
    const o=objs.get(Number(f[2])); if(!o) continue;
    let map=null;
    const tu=pdfRef(pdfDictVal(o.dict,'/ToUnicode'));
    if(tu!=null){ const b=await pdfStreamBytes(objs.get(tu)); if(b) map=pdfParseCMap(pdfLatin(b)); }
    const twoByte=/\/Subtype\s*\/Type0/.test(o.dict);
    let widths=new Map(), missing=null;
    try{ ({widths,missing}=await pdfFontWidths(objs,o)); }catch(e){}
    // Weight and slant. A PDF states both, in three places of decreasing
    // reliability — the BaseFont name, the descriptor's /Flags, and /ItalicAngle
    // / /StemV. Recovering them is what lets an uploaded document keep its bold
    // defined terms and its italic parentheticals instead of arriving flat.
    let style={bold:false, italic:false};
    try{ style=await pdfFontStyle(objs, o, twoByte); }catch(e){}
    // The font's OWN space advance is the only honest yardstick for "is this
    // gap a word break?" — a fixed number cannot be right across point sizes,
    // typefaces and tracking. Falls back to 0.25em when the font is silent.
    // No /Widths and no embedded font programme means one of the standard 14,
    // whose metrics are fixed and public — use them rather than guessing.
    let b14=null;
    if(!twoByte && !widths.size){
      const bf=(/\/BaseFont\s*\/([^\s/>\]]+)/.exec(o.dict)||[])[1];
      b14=base14Widths(bf);
      if(b14) widths=b14.widths;
    }
    const sp = twoByte ? null : widths.get(32);
    fonts[f[1]]={ twoByte, map, widths, missing, bold:style.bold, italic:style.italic,
      spaceEm: (Number.isFinite(sp)&&sp>0) ? sp/1000 : (b14?b14.spaceEm:0.278) };
  }
  return fonts;
}
/* Advance width of a run, in text-space em × size. Uses the real per-glyph
   widths where the font declared them and only falls back to the estimate for
   codes it did not. */
function pdfRunWidth(text, codes, font, size){
  if(!font || !font.widths || !font.widths.size) return pdfEstWidth(text, size);
  let em=0;
  for(let i=0;i<codes.length;i++){
    const w=font.widths.get(codes[i]);
    if(Number.isFinite(w)) em += w/1000;
    else if(Number.isFinite(font.missing)) em += font.missing/1000;
    else em += pdfEstWidth(text[i]||'x', 1);      // per-character fallback
  }
  return em*size;
}

/* ---- content-stream tokenizer ---- */
function pdfTokens(s){
  const out=[]; let i=0; const n=s.length;
  const isDelim=c=>'()<>[]{}/%'.indexOf(c)>=0;
  const isWS=c=>c===' '||c==='\n'||c==='\r'||c==='\t'||c==='\f'||c==='\0';
  while(i<n){
    const c=s[i];
    if(isWS(c)){ i++; continue; }
    if(c==='%'){ while(i<n&&s[i]!=='\n'&&s[i]!=='\r') i++; continue; }
    if(c==='('){
      let depth=1, j=i+1, str='';
      while(j<n&&depth){
        const ch=s[j];
        if(ch==='\\'){
          const nx=s[j+1];
          if(nx>='0'&&nx<='7'){ let oct='', k=j+1;
            while(k<n&&oct.length<3&&s[k]>='0'&&s[k]<='7'){ oct+=s[k]; k++; }
            str+=String.fromCharCode(parseInt(oct,8)); j=k; continue; }
          if(nx==='\n'){ j+=2; continue; }
          if(nx==='\r'){ j+=2; if(s[j]==='\n') j++; continue; }
          const esc={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f'};
          str+=(esc[nx]!==undefined?esc[nx]:nx); j+=2; continue;
        }
        if(ch==='('){ depth++; str+=ch; j++; continue; }
        if(ch===')'){ depth--; if(depth) str+=ch; j++; continue; }
        str+=ch; j++;
      }
      out.push({t:'str', v:str}); i=j; continue;
    }
    if(c==='<'&&s[i+1]==='<'){ out.push({t:'op',v:'<<'}); i+=2; continue; }
    if(c==='>'&&s[i+1]==='>'){ out.push({t:'op',v:'>>'}); i+=2; continue; }
    if(c==='<'){ const j=s.indexOf('>',i);
      out.push({t:'hex', v:s.slice(i+1,j<0?n:j).replace(/[^0-9A-Fa-f]/g,'')}); i=(j<0?n:j+1); continue; }
    if(c==='['||c===']'){ out.push({t:'op',v:c}); i++; continue; }
    if(c==='/'){ let j=i+1; while(j<n&&!isWS(s[j])&&!isDelim(s[j])) j++;
      out.push({t:'name', v:s.slice(i+1,j)}); i=j; continue; }
    if(/[-+.\d]/.test(c)){ let j=i; while(j<n&&/[-+.\d]/.test(s[j])) j++;
      const num=parseFloat(s.slice(i,j)); out.push({t:'num', v:Number.isFinite(num)?num:0}); i=j; continue; }
    let j=i; while(j<n&&!isWS(s[j])&&!isDelim(s[j])) j++; if(j===i) j++;
    out.push({t:'op', v:s.slice(i,j)}); i=j;
  }
  return out;
}
const pdfMul=(a,b)=>[a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3],
                     a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]];

/* ---------- the standard 14 fonts ----------
   A PDF that uses Helvetica, Times, Courier, Symbol or ZapfDingbats is not
   required to carry a /Widths array, and the base-14 fonts routinely don't —
   which is exactly the shape produced by legal drafting software, bank letter
   generators and government forms. The PDF specification says a consumer MUST
   fall back to the standard metrics for those fonts. We were falling back to a
   six-bucket guess instead, and the guess is wrong in both directions: digits
   at 0.63 em against a real 0.556 over-ran the following space and welded
   "2024" to "BETWEEN"; capitals at 0.63 against a real ~0.686 mean invented a
   gap wide enough to read as a column break. Words came out glued together and
   headings came out with phantom spaces, and the damage was not typographic —
   the expiry date, the payment terms and the governing law stopped being
   extracted at all, so the contract was never scheduled for a renewal reminder.

   Advances are in 1/1000 em for WinAnsi codes 32..126, straight from the Adobe
   Core-14 AFM files. */
const B14_START = 32;
const B14_SETS = {
  HELV:[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584],
  HELV_B:[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584],
  TIMES:[250,333,408,500,500,833,778,180,333,333,500,564,250,333,250,278,500,500,500,500,500,500,500,500,500,500,278,278,564,564,564,444,921,722,667,667,722,611,556,722,722,333,389,722,611,889,722,722,556,722,667,556,611,722,722,944,722,722,611,333,278,333,469,500,333,444,500,444,500,444,333,500,500,278,278,500,278,778,500,500,500,500,333,389,278,500,500,722,500,500,444,480,200,480,541],
  TIMES_B:[250,333,555,500,500,1000,833,278,333,333,500,570,250,333,250,278,500,500,500,500,500,500,500,500,500,500,333,333,570,570,570,500,930,722,667,722,722,667,611,778,778,389,500,778,667,944,722,778,611,778,722,556,667,722,722,1000,722,722,667,333,278,333,581,500,333,500,556,444,556,444,333,500,556,278,333,556,278,833,556,500,556,556,444,389,333,556,500,722,500,500,444,394,220,394,520],
  COUR:[600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600,600],
};
/* /BaseFont carries a subset tag and a style suffix — "ABCDEF+Helvetica-BoldOblique",
   "Arial,Bold", "TimesNewRomanPS-BoldMT". Normalise to a family and a weight. */
function base14Widths(baseFont){
  const n=String(baseFont||'').replace(/^[A-Z]{6}\+/,'').toLowerCase();
  if(!n) return null;
  const bold=/bold|black|heavy|semibold|[-,]bd\b/.test(n);
  let set=null;
  if(/courier|mono/.test(n)) set='COUR';
  else if(/times|serif|roman|georgia|garamond|book/.test(n)) set=bold?'TIMES_B':'TIMES';
  else if(/helvetica|arial|swiss|sans|verdana|tahoma|calibri/.test(n)) set=bold?'HELV_B':'HELV';
  if(!set) return null;
  const vals=B14_SETS[set];
  const W=new Map();
  for(let i=0;i<vals.length;i++) W.set(B14_START+i, vals[i]);
  return { widths:W, spaceEm:(vals[0]||278)/1000 };
}

/* Approximate advance width of a run. Real widths live in the embedded font
   programme, which we deliberately don't parse — this only has to be good
   enough to tell "the next run continues this word" from "the next run is a
   new column". */
function pdfEstWidth(str, size){
  let em=0;
  for(let i=0;i<str.length;i++){
    const ch=str[i];
    // Buckets tuned to the Helvetica means they stand in for. The previous
    // digit bucket (0.63 against a real 0.556) and the lumping of lowercase
    // w/m in with M/W (0.85 against 0.722/0.833) were the two that welded
    // words together; capitals at 0.63 against a real 0.686 invented gaps.
    if(ch===' ') em+=0.278;
    else if(/[.,;:!|'`\-()[\]]/.test(ch)) em+=0.30;
    else if(/[ijlt]/.test(ch)) em+=0.24;
    else if(/[frI]/.test(ch)) em+=0.31;
    else if(/[0-9]/.test(ch)) em+=0.556;
    else if(/[mw]/.test(ch)) em+=0.78;
    else if(/[MW@]/.test(ch)) em+=0.90;
    else if(/[A-Z]/.test(ch)) em+=0.69;
    else em+=0.53;
  }
  return em*size;
}

/* Replay one page's content stream → positioned text runs. */
function pdfTextRuns(content, fonts){
  const runs=[], args=[], arrStack=[];
  let ctm=[1,0,0,1,0,0], stack=[];
  let tm=[1,0,0,1,0,0], tlm=[1,0,0,1,0,0];
  let leading=0, font=null, fsize=1, charSp=0, hscale=1, render=0;

  const cidChar=code=>{
    const ch=font&&font.map?font.map.get(code):undefined;
    if(ch===undefined||ch==='') return '•';
    const cp=ch.charCodeAt(0);
    return (cp>=0xE000&&cp<=0xF8FF)?'•':ch;      // private-use symbol glyph = list bullet
  };
  /* Decode a string token to text AND to the character codes behind it. The
     codes are what the font's width table is indexed by, so both travel
     together; a code whose glyph maps to nothing still advances the pen, which
     is why the two arrays are allowed to differ in length. */
  const decode=tok=>{
    const codes=[]; let s='';
    if(tok.t==='str'){
      if(font&&font.twoByte){
        for(let i=0;i+1<tok.v.length;i+=2){ const c=(tok.v.charCodeAt(i)<<8)|tok.v.charCodeAt(i+1);
          codes.push(c); s+=font.map?cidChar(c):''; }
        return {text:s, codes};
      }
      for(let i=0;i<tok.v.length;i++){ const cc=tok.v.charCodeAt(i); codes.push(cc);
        s+=(cc>=128&&cc<=173&&PDF_WINANSI[cc]!==undefined)?PDF_WINANSI[cc]:(cc>=128&&cc<=159?'':tok.v[i]); }
      return {text:s, codes};
    }
    const h=tok.v;
    if(font&&font.twoByte){
      for(let i=0;i+3<h.length;i+=4){ const c=parseInt(h.slice(i,i+4),16); codes.push(c); s+=cidChar(c); }
      return {text:s, codes};
    }
    for(let i=0;i+1<h.length;i+=2){ const cc=parseInt(h.slice(i,i+2),16); codes.push(cc);
      s+=(cc>=128&&cc<=173&&PDF_WINANSI[cc]!==undefined)?PDF_WINANSI[cc]:String.fromCharCode(cc); }
    return {text:s, codes};
  };
  /* `kernEm` is the net displacement the TJ array's own numbers contribute, in
     em. It has to be folded into the advance or the running x-position drifts
     across a kerned line and the layout pass reads the drift as word gaps. */
  const emit=(text, codes, kernEm=0)=>{
    if(!text) return;
    const m=pdfMul(tm, ctm);
    // The EFFECTIVE point size is the font size scaled by the matrices — Tf
    // alone is meaningless (a producer may set `Tf 1` and bake the size into
    // Tm), and the matrix alone is equally meaningless (Chromium sets `Tf 20`
    // and leaves Tm unscaled). Both have to be multiplied, or every size-based
    // judgement downstream — line tolerance, paragraph gaps, and which lines
    // are headings — is made on a number that is not the size of anything.
    const scale=Math.hypot(m[2],m[3])||1;
    const size=(fsize||1)*scale;
    const sx=Math.hypot(m[0],m[1])||1;
    const glyphs=pdfRunWidth(text, codes||[], font, fsize);
    const w=(glyphs + (codes?codes.length:text.length)*charSp + kernEm*fsize)*hscale;
    if(render!==3&&render!==7) runs.push({x:m[4], y:m[5], size, w:w*sx, text,
      spaceW:(font?font.spaceEm:0.25)*fsize*hscale*sx,
      bold:!!(font&&font.bold), italic:!!(font&&font.italic)});
    tm=pdfMul([1,0,0,1,w,0], tm);   // keep runs without an explicit move from stacking
  };

  for(const tk of pdfTokens(content)){
    if(tk.t!=='op'){ args.push(tk); continue; }
    const op=tk.v;
    if(op==='['){ arrStack.push(args.length); args.push(tk); continue; }
    if(op===']') continue;
    const nums=args.filter(a=>a.t==='num').map(a=>a.v);
    const lastStr=()=>args.filter(a=>a.t==='str'||a.t==='hex').pop();
    switch(op){
      case 'q': stack.push(ctm.slice()); break;
      case 'Q': ctm=stack.pop()||[1,0,0,1,0,0]; break;
      case 'cm': if(nums.length>=6) ctm=pdfMul(nums.slice(-6), ctm); break;
      case 'BT': tm=[1,0,0,1,0,0]; tlm=tm.slice(); break;
      case 'Tf': { const nm=args.filter(a=>a.t==='name').pop();
                   font=nm?(fonts[nm.v]||null):null; fsize=nums.length?nums[nums.length-1]:1; break; }
      case 'Tc': charSp=nums[nums.length-1]||0; break;
      case 'Tz': hscale=(nums[nums.length-1]||100)/100; break;
      case 'TL': leading=nums[nums.length-1]||0; break;
      case 'Tr': render=nums[nums.length-1]||0; break;
      case 'Tm': if(nums.length>=6){ tlm=nums.slice(-6); tm=tlm.slice(); } break;
      case 'Td': if(nums.length>=2){ tlm=pdfMul([1,0,0,1,nums[nums.length-2],nums[nums.length-1]], tlm); tm=tlm.slice(); } break;
      case 'TD': if(nums.length>=2){ leading=-nums[nums.length-1];
                   tlm=pdfMul([1,0,0,1,nums[nums.length-2],nums[nums.length-1]], tlm); tm=tlm.slice(); } break;
      case 'T*': tlm=pdfMul([1,0,0,1,0,-leading], tlm); tm=tlm.slice(); break;
      case 'Tj': { const s=lastStr(); if(s){ const d=decode(s); emit(d.text,d.codes); } break; }
      case "'": { tlm=pdfMul([1,0,0,1,0,-leading], tlm); tm=tlm.slice();
                  const s=lastStr(); if(s){ const d=decode(s); emit(d.text,d.codes); } break; }
      case '"': { if(nums.length>=2) charSp=nums[1];
                  tlm=pdfMul([1,0,0,1,0,-leading], tlm); tm=tlm.slice();
                  const s=lastStr(); if(s){ const d=decode(s); emit(d.text,d.codes); } break; }
      case 'TJ': { const from=arrStack.pop(); let out='', outCodes=[], kernEm=0;
                   // A TJ number displaces the pen by -n/1000 em. Whether that
                   // displacement is a WORD BREAK or just tracking cannot be
                   // decided by a fixed threshold — it depends on the font and
                   // the point size. The only honest yardstick is the font's
                   // own space advance: a gap worth most of a real space is a
                   // space, anything smaller is kerning. (This used to be a
                   // hardcoded -250, which split words in any document tracked
                   // out more than a quarter em.)
                   const spEm=(font&&font.spaceEm)||0.25;
                   for(let i=(from==null?0:from+1); i<args.length; i++){
                     const a=args[i];
                     if(a.t==='num'){
                       const gap=-a.v/1000;                 // em
                       kernEm+=gap;
                       if(gap>=spEm*0.72 && out && !/\s$/.test(out)){ out+=' '; outCodes.push(32); }
                     }
                     else if(a.t==='str'||a.t==='hex'){ const d=decode(a); out+=d.text; outCodes.push(...d.codes); }
                   }
                   emit(out, outCodes, kernEm); break; }
      default: break;
    }
    args.length=0; arrStack.length=0;
  }
  return runs;
}

/* Positioned runs → LINES. One entry per baseline, carrying both the plain text
   and an inline-marked-up version, plus the geometry a structure pass needs:
   the dominant point size, the left and right edges, and whether the line is
   set bold. Shared by the plain-text projection and the rich reconstruction, so
   the two can never disagree about where a line begins and ends. */
function pdfRunsToLines(runs){
  if(!runs.length) return [];
  const lines=[];
  for(const r of runs.slice().sort((a,b)=>(b.y-a.y)||(a.x-b.x))){
    const tol=Math.max(1.6, r.size*0.32);
    const line=lines.find(l=>Math.abs(l.y-r.y)<=tol);
    if(line){ line.y=(line.y*line.runs.length+r.y)/(line.runs.length+1); line.runs.push(r); }
    else lines.push({y:r.y, runs:[r]});
  }
  lines.sort((a,b)=>b.y-a.y);
  const esc=t=>String(t).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return lines.map(l=>{
    l.runs.sort((a,b)=>a.x-b.x);
    let text='', html='', endX=null, left=Infinity, right=-Infinity;
    let boldChars=0, chars=0;
    let openB=false, openI=false;
    const closeMarks=()=>{ if(openI){ html+='</em>'; openI=false; } if(openB){ html+='</strong>'; openB=false; } };
    for(const r of l.runs){
      if(!r.text) continue;
      let sep='';
      if(endX!=null){
        // A rule or dot-leader run: never glue a single space onto it (it is
        // drawn, not typeset, so a hairline gap means nothing) — but a gap wide
        // enough to be a COLUMN still separates two rules, which is exactly what
        // a side-by-side signature block is made of.
        const ruled=/([-=_.·])\1{2,}\s*$/.test(text);
        // A gap is a word break when it is most of a real space in this font.
        // Keyed off the font's own space advance rather than a flat fraction of
        // the point size — that fraction was small enough that ordinary
        // inter-glyph rounding read as a space and split words apart.
        const sp=r.spaceW||r.size*0.25;
        const gap=r.x-endX;
        const column=gap>sp*2.5;
        if(gap>sp*0.62 && (column||!ruled) && !/\s$/.test(text) && !/^[\s,.;:!?)\]}»’”%-]/.test(r.text)){
          // A gap several spaces wide is COLUMN structure, not a word break —
          // side-by-side signature blocks and fee schedules live in it. Emit it
          // proportionally so the columns survive into the text, where
          // documentTextHtml's ruled-block detection can keep them aligned.
          sep=' '.repeat(column ? Math.min(24, Math.round(gap/sp)) : 1);
        }
      }
      text+=sep;
      // inline marks, opened and closed only where the style actually changes
      if(sep){ if(openI&&!r.italic){ html+='</em>'; openI=false; }
               if(openB&&!r.bold){ html+='</strong>'; openB=false; } html+=esc(sep); }
      if(r.bold&&!openB){ closeMarks(); html+='<strong>'; openB=true; }
      else if(!r.bold&&openB){ if(openI){ html+='</em>'; openI=false; } html+='</strong>'; openB=false; }
      if(r.italic&&!openI){ html+='<em>'; openI=true; }
      else if(!r.italic&&openI){ html+='</em>'; openI=false; }
      html+=esc(r.text);
      text+=r.text;
      chars+=r.text.length; if(r.bold) boldChars+=r.text.length;
      left=Math.min(left, r.x);
      endX=r.x+(r.w||pdfEstWidth(r.text, r.size));
      right=Math.max(right, endX);
    }
    closeMarks();
    const sizes={}; l.runs.forEach(r=>{ sizes[r.size]=(sizes[r.size]||0)+(r.text||'').length; });
    const size=Number(Object.keys(sizes).sort((a,b)=>sizes[b]-sizes[a])[0])||l.runs[0].size;
    return { y:l.y, size, maxSize:Math.max(...l.runs.map(r=>r.size)), left, right,
      bold: chars>0 && boldChars/chars>=0.6,
      text:text.replace(/\s+$/,''), html:html.replace(/\s+$/,'') };
  }).filter(l=>l.text);
}

/* Lines → text, with a blank line where the page leaves a paragraph's worth of
   vertical space. */
function pdfRunsToText(runs){
  const rendered=pdfRunsToLines(runs);
  if(!rendered.length) return '';
  const gaps=[]; for(let i=1;i<rendered.length;i++) gaps.push(rendered[i-1].y-rendered[i].y);
  const sorted=gaps.slice().sort((a,b)=>a-b);
  const median=sorted.length?sorted[Math.floor(sorted.length/2)]:0;
  let out=rendered[0].text;
  for(let i=1;i<rendered.length;i++){
    const own=Math.max(rendered[i-1].maxSize, rendered[i].maxSize)*1.55;
    const limit=median>0?Math.max(median*1.4, own):own;
    out+=((rendered[i-1].y-rendered[i].y)>limit?'\n\n':'\n')+rendered[i].text;
  }
  return out;
}

/* Last resort for PDFs whose page tree we can't follow: the old flat scan of
   every text-showing string. Loses layout, but beats returning nothing. */
function pdfStringsFrom(content){
  const res=[]; const re=/\(((?:\\.|[^()\\])*)\)/g; let m;
  while((m=re.exec(content))){
    res.push(m[1].replace(/\\(\d{1,3})/g,(_,o)=>String.fromCharCode(parseInt(o,8))).replace(/\\([()\\nrt])/g,(x,c)=>({n:'\n',r:'',t:' '}[c]??c)));
  }
  return res.join('');
}
/* THE LAST-RESORT SCRAPE, and it used to destroy the document.

   This runs when the structured parse finds nothing — an unusual encoding, a
   content stream it cannot walk, a generator it has not met. It pulls the
   literal strings out of the drawing operators, which is crude but recoverable:
   the strings still arrive in reading order, and `pdfStringsFrom` already turns
   a PDF `\n` escape into a real newline.

   The last line then threw all of that away:

       out.join(' ').replace(/\s+/g,' ')

   Every line break in the contract collapsed into a space, so the whole
   agreement arrived as ONE run-on string — and everything downstream that
   rebuilds structure works by splitting on newlines, so it rebuilt a single
   paragraph containing the entire document, page footers and all. A reader got
   "…NOW, THEREFORE, IT IS HEREBY AGREED as follows: PAGE 1 OF 4: DEFINITIONS,
   SCOPE &…" as one block of prose, with no clause numbering left to follow.

   Newlines are structure. They survive, runs of blanks are normalised rather
   than obliterated, and each stream is a paragraph boundary because that is
   what a page break is here. What CANNOT be recovered from this path — real
   headings, list nesting — is rebuilt afterwards by docRichFromText, which
   reads the wording itself. */
/* IS THIS STREAM COMPRESSED? The scrape works on a raw regex over the file, so
   it has no object dictionary to hand — it looks at the one that precedes the
   `stream` keyword, and at the bytes themselves. A zlib stream opens 0x78 with
   a valid two-byte check; that is a strong enough signal on its own, and the
   /Filter entry is the authoritative one where it is there to be read. */
function pdfStreamIsCompressed(bin, at, raw){
  const head=bin.slice(Math.max(0, at-800), at);
  const dictAt=head.lastIndexOf('<<');
  if(dictAt>=0 && /\/Filter\b[^>]{0,200}\/(FlateDecode|LZWDecode|DCTDecode|JPXDecode|CCITTFaxDecode|RunLengthDecode|ASCIIHexDecode|ASCII85Decode)/
      .test(head.slice(dictAt))) return true;
  if(raw.length>=2){
    const a=raw.charCodeAt(0)&0xff, b=raw.charCodeAt(1)&0xff;
    if(a===0x78 && ((a<<8)+b)%31===0) return true;      // zlib header
    if(a===0x1f && b===0x8b) return true;               // gzip
  }
  return false;
}
async function pdfFlatText(bin){
  const out=[]; const re=/stream\r?\n([\s\S]*?)\r?\nendstream/g; let m;
  while((m=re.exec(bin))){
    const raw=m[1];
    const arr=Uint8Array.from(raw,ch=>ch.charCodeAt(0)&0xff);
    const inf=await inflateBytes(arr);
    /* COMPRESSED BYTES ARE NOT TEXT, and the fallback treated them as text.

       `inf ? pdfLatin(inf) : m[1]` meant that when the inflate failed — an
       unsupported predictor, a truncated stream, an encrypted document — the
       RAW COMPRESSED BYTES were handed to the scraper. Deflate output is
       high-entropy, so across a few hundred kilobytes it reliably contains the
       letters `Tj` or `BT` somewhere, and plenty of `(` … `)` pairs. The test
       passed, `pdfStringsFrom` dutifully scraped the bytes between the
       parentheses, and the result — pure binary noise — was stored as the
       contract's extractedText and printed by the PDF export.

       An uncompressed content stream really is text and still reads as one.
       A compressed one that will not inflate yields nothing, and nothing is
       the honest answer: it routes to the "no machine-readable text" path and
       the OCR offer, which can actually read the document. */
    if(!inf && pdfStreamIsCompressed(bin, m.index, raw)) continue;
    const text=inf?pdfLatin(inf):raw;
    if(/\bTj\b|\bTJ\b|\bBT\b/.test(text)) out.push(pdfStringsFrom(text));
  }
  return out.join('\n\n')
    .replace(/[ \t]+/g,' ')          // runs of spaces, not runs of lines
    .replace(/[ \t]*\n[ \t]*/g,'\n')
    .replace(/\n{3,}/g,'\n\n')
    .trim();
}

/* ---- THE LAST GATE BEFORE GARBAGE BECOMES THE CONTRACT ----

   Extraction has several fallbacks and each of them can fail in a way that
   still returns a string. The check that matters is not which path produced it
   but whether the result is READABLE — because whatever comes back is stored as
   the document's text, fed to Copilot, searched, diffed and printed.

   Printable means what a person reading a contract would call printable: the
   Latin-1 range, tabs and line breaks. Below 85% over the opening few kilobytes
   this is not a document, it is bytes, and the caller is told so by being given
   nothing at all. Empty is not a failure state here — it is the existing "no
   machine-readable text" path, and it is what puts the OCR offer in front of
   someone whose scan can actually be read. */
function looksLikeText(s){
  const t=String(s==null?'':s);
  if(!t.trim()) return true;                       // nothing is not garbage
  const sample=t.slice(0,4096);
  let ok=0;
  for(let i=0;i<sample.length;i++){
    const ch=sample.charCodeAt(i);
    if(ch===9||ch===10||ch===13||(ch>=32&&ch<=126)||(ch>=160&&ch<=0x2027)||ch>=0x202a) ok++;
  }
  return (ok/sample.length)>0.85;
}

async function extractPdfText(buf){
  const bin=pdfLatin(new Uint8Array(buf));
  let pages=[];
  try{
    const objs=pdfIndexObjects(bin);
    await pdfExpandObjStreams(objs);
    for(const pn of pdfPageObjects(objs)){
      const po=objs.get(pn); if(!po) continue;
      let resDict='', node=po, hops=0;                    // /Resources can be inherited from /Pages
      while(node&&hops++<8){
        const ri=node.dict.indexOf('/Resources');
        if(ri>=0){ const tail=node.dict.slice(ri+10), ref=pdfRef(tail);
          resDict=ref!=null?(objs.get(ref)?.dict||''):tail; break; }
        const par=pdfRef(pdfDictVal(node.dict,'/Parent')); node=par!=null?objs.get(par):null;
      }
      const fonts=await pdfPageFonts(objs, resDict);
      const ci=po.dict.indexOf('/Contents'); if(ci<0) continue;
      const tail=po.dict.slice(ci+9);
      const one=pdfRef(tail);
      let refs=[];
      if(one!=null) refs=[one];
      else { const arr=/\[([\s\S]*?)\]/.exec(tail);
        if(arr){ const re=/(\d+)\s+\d+\s+R/g; let m; while((m=re.exec(arr[1]))) refs.push(Number(m[1])); } }
      let content='';
      for(const r of refs){ const b=await pdfStreamBytes(objs.get(r)); if(b) content+=pdfLatin(b)+'\n'; }
      if(!content.trim()) continue;
      const txt=pdfRunsToText(pdfTextRuns(content, fonts)).trim();
      if(txt) pages.push(txt);
    }
  }catch(e){ pages=[]; }
  const text = pages.length
    ? pages.join('\n\n').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()
    : await pdfFlatText(bin);
  // one gate, on every path out of here — see looksLikeText
  return looksLikeText(text) ? text : '';
}
/* Decode a data: URL locally — fetch(dataUrl) is blocked by the server-mode
   CSP (connect-src 'self'), so the bytes are unpacked without a request. */
function dataUrlBytes(dataUrl){
  const s=String(dataUrl||''); const i=s.indexOf(',');
  if(i<0) return new Uint8Array(0);
  const head=s.slice(0,i), body=s.slice(i+1);
  if(/;base64/i.test(head)){ const bin=atob(body); const arr=new Uint8Array(bin.length);
    for(let j=0;j<bin.length;j++) arr[j]=bin.charCodeAt(j); return arr; }
  return new TextEncoder().encode(decodeURIComponent(body));
}
/* A browsable URL for an uploaded document. The bytes are held as a data: URL,
   but the server-mode CSP won't frame those (default-src 'self'), so the
   preview showed Chrome's "This content is blocked" panel. A blob: URL carries
   the same bytes, is same-document, and is what frame-src allows. */
const _docBlobUrls=new Map();   // "<contract id>:<file hash>" → object URL
function docFileUrl(c){
  const u=(c&&c.upload)||{};
  if(!u.dataUrl) return '';
  const key=c.id+':'+(u.fileHash||u.fileName||'');
  const hit=_docBlobUrls.get(key); if(hit) return hit;
  let url;
  try{ url=URL.createObjectURL(new Blob([dataUrlBytes(u.dataUrl)],{type:u.mime||'application/octet-stream'})); }
  catch(e){ return u.dataUrl; }
  // a session only ever reads a handful of documents; drop the oldest but never
  // the one being rendered right now
  if(_docBlobUrls.size>16){
    for(const [k,v] of _docBlobUrls){
      if(k===key) continue;
      URL.revokeObjectURL(v); _docBlobUrls.delete(k);
      if(_docBlobUrls.size<=8) break;
    }
  }
  _docBlobUrls.set(key,url);
  return url;
}
/* ---------- Word-file detection (refuse, don't half-import) ----------
   The picker no longer offers .doc/.docx, but drag-and-drop bypasses the
   accept attribute and browsers report Word MIME types inconsistently — a
   renamed file would otherwise sail through and land in the register as an
   empty shell. So sniff the actual bytes:
     .docx  — a ZIP archive: PK\x03\x04, with a "word/…" entry inside
     .doc   — an OLE2 compound file: D0 CF 11 E0 A1 B1 1A E1
   Returns 'docx' | 'doc' | null. */
const WORD_REFUSAL = 'HaTi can’t read legacy .doc files (the pre-2007 Word format). Open it in Word and save it as .docx — or as a PDF — and upload that instead.';
const WORD_REFUSAL_SHORT = 'legacy .doc — re-save as .docx or PDF';
const OLE_SIG=[0xD0,0xCF,0x11,0xE0,0xA1,0xB1,0x1A,0xE1];
// latin1-decode a slice without the per-byte string concat used for whole PDFs
function bytesToLatin(bytes, from, to){
  const end=Math.min(bytes.length, to==null?bytes.length:to);
  let out='';
  for(let i=Math.max(0,from||0); i<end; i+=8192)
    out+=String.fromCharCode.apply(null, bytes.subarray(i, Math.min(end, i+8192)));
  return out;
}
function detectWordBytes(bytes, fileName, mime){
  if(!bytes || bytes.length<8) return null;
  const ext=(String(fileName||'').match(/\.([a-z0-9]+)$/i)||[])[1]?.toLowerCase()||'';
  if(OLE_SIG.every((b,i)=>bytes[i]===b)){
    // OLE2 covers legacy .doc/.xls/.ppt; only .doc claims to be a contract here
    if(ext==='doc' || /msword/i.test(mime||'')) return 'doc';
    if(!ext || ext==='docx') return 'doc';
    return null;
  }
  if(bytes[0]===0x50&&bytes[1]===0x4B&&bytes[2]===0x03&&bytes[3]===0x04){
    // OOXML part names appear verbatim in the local headers + central directory
    const head=bytesToLatin(bytes, 0, 8192);
    const tail=bytesToLatin(bytes, Math.max(0, bytes.length-65536));
    const zip=head+tail;
    if(/word\/(document|_rels|settings)\.xml/i.test(zip)||/wordprocessingml/i.test(zip)) return 'docx';
    if(ext==='docx'||ext==='doc'||/wordprocessingml/i.test(mime||'')) return 'docx';
  }
  return null;
}
/* Convenience wrapper for the three upload entry points — decodes the data URL
   once and reports the Word kind (or null). */
function detectWordFile(dataUrl, mime, fileName){
  try{ return detectWordBytes(dataUrlBytes(dataUrl), fileName, mime); }catch(e){ return null; }
}

async function extractDocText(dataUrl, mime){
  try{
    const bytes=dataUrlBytes(dataUrl);
    if(/text\//.test(mime)){ return new TextDecoder().decode(bytes).slice(0,EXTRACT_MAX_CHARS); }
    if(/pdf/.test(mime)){ return (await extractPdfText(bytes.buffer)).slice(0,EXTRACT_MAX_CHARS); }
    if(detectWordBytes(bytes,'',mime)==='docx'){ return (await docxExtract(bytes)).text.slice(0,EXTRACT_MAX_CHARS); }
  }catch(e){}
  return '';
}
/* .docx extraction that keeps the tracked-changes counts, for the flows that
   must put "markup was found and read as accepted" on the audit record. */
async function extractWordText(dataUrl){
  const out=await docxExtract(dataUrlBytes(dataUrl));
  return { text:out.text.slice(0,EXTRACT_MAX_CHARS), tracked:out.tracked };
}
const trackedNote=t=>(t&&(t.ins||t.del))
  ? `The file carried ${t.ins+t.del} tracked change${t.ins+t.del===1?'':'s'} (Word markup) — read with all changes accepted`
  : '';
/* Render extracted document text on screen the way the paper reads: prose keeps
   the document face and wraps, while ruled/columnar blocks (fee schedules drawn
   with | and +---+, side-by-side signature blocks) go into a monospace block so
   their columns still line up. Section titles and clause numbers are recognised
   (docLineKind, js/docx.js) and STYLED — bold headings, set-off clause numbers —
   so an edited contract still reads like the document it was, not a flat wall.
   Display-only: the text underneath is byte-identical to what is stored; the
   seal and every diff bind the text, never this presentation.
   Escapes its input — never pass HTML. */
function documentTextHtml(text, {size='12.5px', lh='1.65'}={}){
  const esc=s=>String(s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const kind=window.docLineKind||(()=> 'text');
  const lines=String(text||'').split('\n');
  const isRuled=l=>/^\s*[|+]/.test(l)||/[|+]\s*$/.test(l)||/\S\s{4,}\S/.test(l);
  const hSize=(parseFloat(size)+1).toFixed(1);
  const out=[]; let buf=[], bufRuled=false;
  const flush=()=>{
    if(!buf.length) return;
    if(bufRuled){
      out.push(`<div class="doc-pre" style="font-family:var(--font-doc-mono),var(--font-mono);font-size:${parseFloat(size)-1.5}px;line-height:1.5;white-space:pre;overflow-x:auto;margin:8px 0">${esc(buf.join('\n'))}</div>`);
      buf=[]; return;
    }
    // one pre-wrap block per run of body lines; headings break the run and
    // absorb the single blank line each side so the rhythm doesn't double up
    const paras=[]; let para=[];
    const endPara=()=>{ if(para.length){ paras.push(`<div style="white-space:pre-wrap">${para.join('\n')}</div>`); para=[]; } };
    for(let i=0;i<buf.length;i++){
      const l=buf[i], k=kind(l);
      if(k==='heading'){
        if(para.length&&kind(para[para.length-1].replace(/<[^>]*>/g,''))==='blank') para.pop();
        endPara();
        paras.push(`<div style="font-weight:700;font-size:${hSize}px;letter-spacing:.01em;margin:${paras.length?'14px':'0'} 0 6px;white-space:pre-wrap">${esc(l)}</div>`);
        if(i+1<buf.length&&kind(buf[i+1])==='blank') i++;
        continue;
      }
      if(k==='clause'&&window.docClausePrefix){
        const p=docClausePrefix(l), at=l.indexOf(p);
        para.push(esc(l.slice(0,at))+`<span style="font-weight:600">${esc(p)}</span>`+esc(l.slice(at+p.length)));
        continue;
      }
      para.push(esc(l));
    }
    endPara();
    out.push(paras.join(''));
    buf=[];
  };
  for(const l of lines){
    const ruled=isRuled(l);
    if(buf.length && ruled!==bufRuled) flush();
    bufRuled=ruled; buf.push(l);
  }
  flush();
  // --color-doc-text is the app's ONE reading-ink (see index.html tokens) —
  // stated here so every caller, portal included, reads black, not grey
  return `<div style="font-size:${size};line-height:${lh};color:var(--color-doc-text)">${out.join('')}</div>`;
}

/* The contract's working-text body, in whichever format it carries. Rich
   content goes through renderDocHtml (which sanitises AGAIN, at render); plain
   text keeps the reflow repair and the original escaped path, byte for byte. */
function docBodyHtml(c, opts={}){
  const body=c.redlineText;
  if(window.isRich && isRich(c.format)) return renderDocHtml(body, RICH_FORMAT, opts);
  return documentTextHtml(window.reflowWorkingText?reflowWorkingText(body):body, opts);
}

// Heuristic clause analysis over the REAL extracted text — quotes verbatim.
function sentenceAround(text, idx){
  let s=text.lastIndexOf('.',idx); s=s<0?Math.max(0,idx-140):s+1;
  let e=text.indexOf('.',idx); e=e<0?Math.min(text.length,idx+220):e+1;
  return text.slice(s,e).replace(/\s+/g,' ').trim().slice(0,260);
}
function findingsFromText(c, text){
  // extraction keeps the page's line breaks; these clause checks read the
  // document as prose, so flatten the wrapping first (quotes stay verbatim)
  text=String(text||'').replace(/\s+/g,' ');
  const F=[]; const low=text.toLowerCase();
  /* The quote is kept as its own field, not only baked into `what`. Every
     finding here is anchored to 'doc' because an uploaded document has no
     clause anchors to pin to — which meant "Go to document" landed on the
     banner at the very top rather than on the wording the finding is about.
     With the quote carried, the panel can find the passage itself. */
  const add=(id,sev,kind,title,quote,why,fix,conf)=>F.push({id,sev,kind,title,anchor:'doc',confidence:conf,
    quote:quote||null,
    what:quote?`The document reads: “${quote}”`:'(clause not located in the extracted text)', why, fix});
  const firstIdx=(...ks)=>{ for(const k of ks){ const i=low.indexOf(k); if(i>=0) return i; } return -1; };
  // 1) governing law — scan ALL candidate mentions and pick the one that names a
  //    jurisdiction (a ref-line like "governing law as stated below" is ignored).
  /* FOREIGN MEANS "NOT WHERE WE ARE", not "not Kenya". The list comes from the
     active jurisdiction pack (js/jurisdiction.js), which excludes the home
     market's own names — so a Kenyan-law contract is correctly foreign paper to
     a Stockholm workspace, and this line does not change when the setting does. */
  const foreign=(typeof jxForeignMarkers==='function'?jxForeignMarkers():[]).concat(['uganda','tanzania','rwanda','south africa']);
  const homeName=(typeof jxName==='function'?jxName():'this jurisdiction');
  const homeAdj=(typeof jxAdjective==='function'?jxAdjective():'local');
  const govKeys=['governing law','governed by the laws','laws of the republic','exclusive jurisdiction','jurisdiction of','arbitration seated','arbitration in','governed by'];
  const cands=[]; for(const k of govKeys){ let i=low.indexOf(k); while(i>=0){ cands.push(i); i=low.indexOf(k,i+1); } }
  let foreignSen=null,foreignHit=null,homeSen=null;
  for(const idx of [...new Set(cands)].sort((a,b)=>a-b)){ const sen=sentenceAround(text,idx), sl=sen.toLowerCase();
    const fh=foreign.find(f=>sl.includes(f)), hk=(typeof jxNamesHome==='function'?jxNamesHome(sl):sl.includes('kenya'));
    if(fh&&!hk&&!foreignSen){ foreignSen=sen; foreignHit=fh; }
    if(hk&&!homeSen) homeSen=sen;
  }
  if(foreignSen) add('t-law','high','risk','Foreign governing law detected',foreignSen,
    `A ${foreignHit.replace(/\b\w/g,x=>x.toUpperCase())} governing law or forum makes enforcement slow and costly for a ${homeAdj} business and may bypass ${homeAdj} protections.`,
    `Negotiate ${homeAdj} governing law and forum, or budget for foreign enforcement before signing.`,'high');
  else if(homeSen) add('t-law','low','ambiguity',`Governing law: ${homeName} (found in text)`,homeSen,
    `${homeAdj} governing law keeps enforcement local and predictable.`,'No change needed — confirm the forum (courts vs. arbitration) suits you.','high');
  else add('t-law','med','missing','Governing law / jurisdiction not clearly stated','',
    'No clause naming a governing law or forum was found in the extracted text — every high-value or cross-border contract needs a clear governing law and forum.',`Locate or add the governing-law clause and confirm it names ${homeName}.`,'low');
  // 2) payment terms
  const pm=low.match(/(?:within|net)\s*(\d{1,3})\s*days/);
  if(pm){ const i=low.indexOf(pm[0]), d=Number(pm[1]);
    add('t-pay', d>45?'med':'low', d>45?'risk':'ambiguity', `Payment terms: ${d} days`, sentenceAround(text,i),
      d>45?`${d}-day terms tie up working capital and raise exposure if the payer delays.`:'Payment terms look within a healthy range.',
      d>45?'Negotiate toward 30–45 days, or price the extended terms into the deal.':'Confirm this matches what was agreed.','high'); }
  // 3) auto-renewal
  const ar=low.search(/auto(?:matically)?[\s-]*renew|renews?\s+automatically/);
  if(ar>=0) add('t-renew','med','risk','Automatic renewal clause',sentenceAround(text,ar),
    'Auto-renewing contracts with long notice windows are a common way to get locked in.',
    'Confirm the renewal is intended and the exit notice period is workable.','high');
  // 4) termination notice
  const tn=low.match(/(\d{1,3})\s*days'?\s*(?:written\s*)?notice/);
  if(tn){ const i=low.indexOf(tn[0]); add('t-term','low','ambiguity',`Termination notice: ${tn[1]} days`,sentenceAround(text,i),
    'The exit notice period sets how quickly you can walk away.','Confirm the notice period is acceptable for your exposure.','high'); }
  // 5) liability / indemnity
  const li=firstIdx('limitation of liability','total liability','liability is limited','liability shall','indemnif');
  if(li>=0) add('t-liab','med','risk','Liability / indemnity — review carefully',sentenceAround(text,li),
    'Counterparty paper often caps their liability low and pushes broad indemnities onto you.',
    'Confirm the cap is mutual and reasonable and indemnities are limited to their fault.','medium');
  // 6) stamp duty for leases
  /* SKIPPED WHERE THE MARKET HAS NO SUCH DUTY. Sweden levies none on an
     ordinary commercial lease, and a finding that fires with the statute name
     blanked out reads as advice nobody wrote. A check that stays quiet is the
     honest version of "this does not apply here". */
  const sd=(typeof jxStampDuty==='function'?jxStampDuty():null);
  if(sd && (low.includes('lease')||low.includes('landlord')||low.includes('tenant')) && !low.includes('stamp duty'))
    add('t-stamp','med','risk','Lease with no stamp-duty provision','',sd.consequence,sd.action,'medium');
  // 7) data protection for corporate/IT paper
  if(c.folder==='corp' && !/(data protection|data processing|personal data|odpc|gdpr)/.test(low))
    add('t-dp','low','missing','No data-protection terms detected','',
      `Under ${(typeof jxDataProtection==='function'?jxDataProtection():'applicable data-protection law')} you remain responsible for how vendors process personal data.`,
      `Confirm a data-processing / DPA clause aligned with ${(typeof jx==='function'?jx().dataProtectionRegulator:'the regulator')} expectations is included.`,'low');
  return F;
}

/* ---------------- Upload a received contract — FILE FIRST (WO N2) ----------
   The old form collected name, counterparty, email, folder, value and expiry
   UP FRONT, then ran extraction — whose whole job is to read exactly those
   facts out of the document. The user typed what the machine was about to
   read. The order is flipped: step 1 is a drop zone and nothing else; the
   pipeline reads the file (Word text, PDF text, or OCR for scans) and
   extracts the details; step 2 hands the SAME fields back pre-filled, marked
   "✦ read from the document" where a value came from the paper, with only
   what the machine could not find left to type — usually the counterparty's
   email, which is never printed in the document itself.

   Both steps are built once and toggled (the share dialog's pattern). Nothing
   is created until "File contract" — closing the dialog at ANY point, drop
   zone or mid-scan or on the confirm card, files nothing and leaves nothing
   behind. The uploaded bytes go to the server only inside submitUpload, for
   the same reason. */
let _up=null;   // pipeline result carried from the drop to the confirm
function openUploadModal(){
  if(!canEdit()){ toast(i18t('ct_viewers_no_add'),'err'); return; }
  _up=null;
  openModal(`
    <div class="p-6">
      <div id="up-step-1">
        <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('upload')}</span>
          <h2 class="font-display font-700 text-brand-900">${i18t('ct_add_received')}</h2></div>
        <p class="text-xs text-brand-800/70 mb-4">A contract another company sent you — on their own paper. Drop the file: HaTi reads the counterparty, value and dates out of the document, and you check them before anything is filed.</p>
        <div id="up-drop" role="button" tabindex="0" aria-label="${i18t('ct_drop_file_here')}" style="border:2px dashed var(--color-accent);border-radius:12px;background:var(--color-bg);padding:34px 20px;text-align:center;cursor:pointer;transition:background .15s">
          <div style="font-size:15px;font-weight:600;color:var(--color-text)">${i18t('ct_drop_here')}</div>
          <div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:5px">${i18t('ct_upload_hint',{max:uploadMaxLabel()})}</div>
          <div style="font-size:11.5px;color:var(--color-accent-700);margin-top:8px;font-weight:600">${i18t('ct_thats_all')}</div>
        </div>
        <input id="up-file" type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" class="hidden"/>
        <div id="up-steps" class="hidden" style="margin-top:12px"></div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:14px">
          <button id="up-bulk" style="border:0;background:none;padding:0;font:inherit;font-size:11px;color:var(--color-neutral-600);cursor:pointer" title="${i18t('ct_bulk_importer')}">${i18t('ct_whole_catalogue')} <u>${i18t('ct_import_many')}</u></button>
          <span style="flex:1"></span>
          <button id="up-cancel" class="rounded-lg border border-brand-200 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">${i18t('act_cancel')}</button>
        </div>
      </div>
      <div id="up-step-2" class="hidden">${uploadConfirmHtml(null,null)}</div>
    </div>`);
  const drop=document.getElementById('up-drop'), input=document.getElementById('up-file');
  drop.addEventListener('click',()=>input.click());
  drop.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); input.click(); } });
  drop.addEventListener('dragover',e=>{ e.preventDefault(); drop.style.background='var(--color-accent-100)'; });
  drop.addEventListener('dragleave',()=>{ drop.style.background='var(--color-bg)'; });
  drop.addEventListener('drop',e=>{ e.preventDefault(); drop.style.background='var(--color-bg)';
    const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) runUploadPipeline(f); });
  input.addEventListener('change',()=>{ const f=input.files&&input.files[0]; if(f) runUploadPipeline(f); });
  document.getElementById('up-cancel').addEventListener('click',closeModal);
  document.getElementById('up-bulk').addEventListener('click',()=>{ closeModal(); setView('migration'); });
}
/* The confirm card — the old form's fields, handed back pre-answered. Called
   with (null, null) for the skeleton built into the dialog (so the fields
   exist from the first render), then re-rendered with the pipeline's result.
   `meta` is the extraction outcome, null when the file yielded no readable
   text — in which case the card says so and the person types, exactly as the
   old form asked them to, but only in the case where the machine truly
   could not help. */
function uploadConfirmHtml(ext, meta){
  const m=meta||{}, conf=m.confidence||{}, spans=m.sourceSpans||{};
  const esc2=s=>String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const attr=s=>esc2(s).replace(/"/g,'&quot;');
  const has=k=>meta!=null&&m[k]!=null&&m[k]!==''&&!(typeof m[k]==='number'&&!(m[k]>0));
  const MARK=`<span style="font-family:var(--font-mono);font-size:8.5px;color:var(--color-accent-700);letter-spacing:.05em"> ✦ ${i18t('ct_read_from_doc').toUpperCase()}</span>`;
  const found=k=>{ const q=spans[k]; if(!q) return '';
    return `<span style="display:block;margin-top:2px;font-size:10px;line-height:1.4;color:var(--color-neutral-600)">found: <i>“${esc2(String(q).replace(/\s+/g,' ').trim().slice(0,140))}”</i></span>`; };
  const fld=(id,label,opts={})=>{
    const read=!!opts.read;
    return `<label class="block"><span class="text-xs font-medium text-brand-800/70">${label}${read?MARK:''}</span>
      <input id="${id}" type="${opts.type||'text'}" value="${attr(opts.value||'')}" placeholder="${attr(opts.ph||'')}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"${read?' style="border-color:var(--color-accent);background:var(--color-accent-100)"':''}/>${read?found(opts.foundKey||''):''}${opts.sub?`<span style="display:block;margin-top:2px;font-size:10px;color:var(--color-neutral-600)">${opts.sub}</span>`:''}</label>`;
  };
  const fileBase=ext?String(ext.file.name||'').replace(/\.[^.]+$/,''):'';
  const nameFromDoc=has('contractType')&&has('counterparty');
  const suggestedName=nameFromDoc?`${m.contractType} — ${m.counterparty}`:fileBase;
  const readCount=['counterparty','value','expiryDate'].filter(has).length;
  const intro=!ext?'':meta
    ? `Everything marked <b style="color:var(--color-accent-700)">✦</b> was read out of the document — confirm or correct it. What the machine could not find is left for you.`
    : `HaTi could not read text out of this file, so nothing could be pre-filled — add the details yourself. The file itself is attached either way.`;
  /* The details beyond the essentials — renewal, notice, governing law — ride
     along folded: read from the same document, applied on filing, corrected
     here if wrong, but never a wall the first-timer has to climb. */
  /* Guarded like every cross-module read: the node tests stage this file
     without js/metadata.js on the floor. */
  const extras=(typeof META_FIELDS!=='undefined'?META_FIELDS:[])
    .filter(f=>!['counterparty','value','expiryDate'].includes(f.k)&&has(f.k));
  const extraFld=f=>{
    const v=m[f.k];
    if(f.type==='select') return `<label class="block"><span class="text-xs font-medium text-brand-800/70">${f.label}${MARK}</span>
      <select data-umf="${f.k}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400">
        ${f.opts.map(o=>`<option value="${o}" ${v===o?'selected':''}>${RENEWAL_LABEL[o]||o}</option>`).join('')}</select>${found(f.k)}</label>`;
    return `<label class="block"><span class="text-xs font-medium text-brand-800/70">${f.label}${MARK}</span>
      <input data-umf="${f.k}" type="${f.type==='date'?'date':f.type==='num'?'number':'text'}" value="${attr(v)}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"/>${found(f.k)}</label>`;
  };
  return `
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h2 class="font-display font-700 text-brand-900">${i18t('ct_check_what_read')}</h2></div>
      ${intro?`<p class="text-xs text-brand-800/70 mb-3" style="line-height:1.55">${intro}</p>`:''}
      ${ext&&isOcrText(ext.textSource)?`<div style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:5px;padding:8px 11px;font-size:11.5px;line-height:1.55;margin:0 0 12px">
        <span style="flex:none;margin-top:1px">${icon('scan','w-3.5 h-3.5')}</span>
        <span>${esc2(ocrProvenanceLine(ext.upload))} ${i18t('ct_capped_at')} <b>${i18t('ct_medium')}</b> ${i18t('ct_confidence_until')}</span></div>`:''}
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        ${fld('up-name','Contract name',{value:suggestedName, ph:'e.g. Supply Agreement — Acme', read:nameFromDoc, sub:(ext&&!nameFromDoc)?'from the file name — rename it to what it is':''})}
        ${fld('up-cp','Received from (counterparty)',{value:has('counterparty')?m.counterparty:'', ph:'e.g. Acme Ltd', read:has('counterparty'), foundKey:'counterparty'})}
        ${fld('up-cpemail','Their email (so you can send it back)',{ph:'them@company.co.ke', type:'email', sub:ext?'the one thing a document never carries — add it and the first send is one click':''})}
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        <label class="block"><span class="text-xs font-medium text-brand-800/70">${i18t('ct_file_under')}</span>
          <select id="up-folder" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">${folderOptionsHtml(null, false)}</select></label>
        <label class="block"><span class="text-xs font-medium text-brand-800/70">${i18t('ct_value_type')}</span>
          <select id="up-vtype" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">
            <option value="estimated">${i18t('ct_estimated_value')}</option><option value="fixed">${i18t('ct_fixed_value')}</option><option value="none">Non-monetary</option></select></label>
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        ${fld('up-value',`Contract value (${jxCurrency()})`,{value:has('value')?m.value:'', ph:'e.g. 2500000', type:'number', read:has('value'), foundKey:'value'})}
        ${fld('up-expiry','Expiry date (optional)',{value:has('expiryDate')?m.expiryDate:'', type:'date', read:has('expiryDate'), foundKey:'expiryDate'})}
      </div>
      ${extras.length?`<details style="margin:0 0 12px;border:1px solid var(--color-divider);border-radius:8px;padding:8px 12px">
        <summary style="cursor:pointer;font-size:11.5px;font-weight:600;color:var(--color-neutral-700)">More details HaTi read (${extras.length}) — renewal, notice, governing law…</summary>
        <div class="grid sm:grid-cols-2 gap-2" style="margin-top:10px">${extras.map(extraFld).join('')}</div>
      </details>`:''}
      ${ext&&readCount?`<p style="margin:0 0 10px;font-size:11px;color:var(--color-neutral-600)">Everything ✦ came from the document${meta&&meta._source==='ai'?', read by Copilot':', pattern-matched'}. Nothing is saved until you press <b>${i18t('ct_file_contract')}</b>.</p>`:''}
      <div class="flex items-center gap-2">
        <button id="up-back" class="rounded-lg border border-brand-200 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">← Another file</button>
        <span style="flex:1"></span>
        <button id="up-cancel-2" class="rounded-lg border border-brand-200 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">${i18t('act_cancel')}</button>
        <button id="up-go" class="flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition">${icon('check2','w-3.5 h-3.5')} ${i18t('ct_file_contract')}</button>
      </div>`;
}
/* Named progress line for an upload — turns the anxious wait into visible steps
   and reinforces that a human confirms at the end. active is 1-based; steps at
   an index < active read as done, == active as in-progress, > active as pending. */
const UPLOAD_STEPS=['Reading document','Extracting details','Ready for your review'];
/* `note` rides under the strip — used for the OCR page counter ("Reading page 4
   of 12"), which is the difference between a slow step and a hung one. */
function renderUploadSteps(active, note){
  const host=document.getElementById('up-steps'); if(!host) return;
  host.classList.remove('hidden');
  host.innerHTML=`<div style="padding:10px 12px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:8px">
   <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
    ${UPLOAD_STEPS.map((s,i)=>{ const n=i+1; const done=n<active, cur=n===active;
      const dot=done?`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--st-green-dot);color:#fff">${icon('check2','w-2.5 h-2.5')}</span>`
        :cur?`<span class="scan-pulse" style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-accent);color:#fff;font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`
        :`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-neutral-200);color:var(--color-neutral-600);font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`;
      const col=done?'var(--st-green-fg)':cur?'var(--color-accent-800)':'var(--color-neutral-500)';
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:${cur?600:500};color:${col}">${dot}${s}</span>`
        + (n<UPLOAD_STEPS.length?`<span style="color:var(--color-neutral-400);margin:0 1px">→</span>`:''); }).join('')}
   </div>
   ${note?`<div id="up-step-note" style="margin-top:7px;font-size:11px;color:var(--color-neutral-600);display:flex;align-items:center;gap:6px">
     <span class="scan-pulse" style="width:6px;height:6px;border-radius:50%;background:var(--color-accent);flex:none"></span>${String(note).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`:''}
  </div>`;
}
/* The reading pipeline — everything between the drop and the confirm card.
   Verbatim the old flow's machinery in the old order (read bytes → refuse
   legacy .doc → Word/PDF text → OCR for scans → metadata extraction), with
   one difference: it produces `_up` and repaints the dialog instead of
   creating a record. Closing the dialog mid-read is handled by absence — the
   step strip and the confirm card are looked up before writing, and a missing
   host means the person left, so the result is dropped on the floor. */
async function runUploadPipeline(file){
  if(file.size>uploadMax()){ toast(uploadTooBigMsg(file),'err'); return; }
  const drop=document.getElementById('up-drop');
  if(drop){ drop.style.pointerEvents='none'; drop.style.opacity='.55'; }
  const revive=()=>{ const d=document.getElementById('up-drop');
    if(d){ d.style.pointerEvents=''; d.style.opacity=''; }
    const inp=document.getElementById('up-file'); if(inp) inp.value=''; };
  const refuse=(msg)=>{
    toast(msg,'err');
    const steps=document.getElementById('up-steps');
    if(steps){ steps.classList.remove('hidden');
      steps.innerHTML=`<div style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);color:var(--st-ruby-fg);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.55">${msg}</div>`; }
    revive();
  };
  renderUploadSteps(1);   // Step 1 — Reading document
  const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); }).catch(()=>null);
  if(!dataUrl){ refuse('Could not read that file'); return; }
  const mime=file.type||'application/octet-stream';
  // Legacy .doc is still refused BEFORE anything is read — a silent empty
  // shell in the register is worse than a clear refusal. Modern .docx is read
  // for real (see js/docx.js) and goes through the same pipeline as a PDF.
  const word=detectWordFile(dataUrl, mime, file.name);
  if(word==='doc'){ refuse(WORD_REFUSAL); return; }
  const fileHash=await sha256(dataUrl);
  let extractedText, wordTracked=null;
  if(word==='docx'){
    // read the wording out of the Word file itself; a failure here is a
    // refusal, not an empty shell — the person can re-save and try again
    try{ const w=await extractWordText(dataUrl); extractedText=w.text; wordTracked=w.tracked; }
    catch(e){ refuse('Could not read this Word file: '+e.message); return; }
  } else {
    extractedText=await extractDocText(dataUrl, mime);   // real text extraction
  }
  /* NOTHING UNREADABLE IS STORED, whichever reader produced it. extractPdfText
     already applies this gate, and it is applied again here because this is the
     last point before the string becomes the contract's text — and because the
     next line decides whether to offer OCR, which is exactly the right thing to
     do with a document nobody could read. */
  if(!looksLikeText(extractedText)) extractedText='';
  // A PDF with no text layer, or a photo of a contract, is read by OCR rather
  // than filed as an empty shell. Provenance is recorded either way.
  let ocr=null, textSource=word==='docx'?'docx-text':(extractedText.length>=OCR_TEXT_FLOOR?'pdf-text':'none');
  if(word!=='docx' && ocrNeeded(mime, extractedText)){
    if(API_MODE()&&!state.aiCfg){ try{ state.aiCfg=await api('ai/config'); }catch(e){} }
    renderUploadSteps(1, 'This looks like a scan — reading it with OCR…');
    ocr=await ocrDocument(dataUrl, mime, {
      onProgress:(done,total,tier)=>renderUploadSteps(1,
        `Reading page ${Math.min(done+1,total)} of ${total}${tier==='local'?' (offline recogniser — slower and less accurate)':''}…`),
    });
    if(ocr.text){ extractedText=ocr.text.slice(0,EXTRACT_MAX_CHARS); textSource=ocr.textSource; }
    else if(ocr.error) toast(i18t('ct_could_not_read_scan')+ocr.error,'err');
  }
  const u=currentUser();
  const upload={ fileName:file.name, mime, size:file.size, fileHash, uploadedAt:nowISO(), uploadedBy:u?.name||'System',
    docKind:word||null, extractedText, textChars:extractedText.length, dataUrl, textSource,
    ocrPages: ocr?ocr.pages:0, ocrSkippedPages: ocr?ocr.skippedPages:0, ocrTotalPages: ocr?ocr.totalPages:0,
    ocrIllegible: ocr?ocr.illegible:0 };
  // E1, flipped (WO N2): the machine reads BEFORE the person types. No seed —
  // there is nothing typed yet to seed with; the person corrects on the card.
  let meta=null;
  if(extractedText && extractedText.length>200){
    renderUploadSteps(2, isOcrText(textSource)?'Reading details out of the machine-read text…':null);
    meta=await extractMetadata(extractedText, null);
    // Anything read out of an OCR'd scan is capped at medium confidence — OCR
    // misreads dates and amounts, and those are what the reminders fire on.
    if(isOcrText(textSource)) capConfidenceForOcr(meta);
  }
  renderUploadSteps(3);   // Step 3 — Ready for your review
  const s1=document.getElementById('up-step-1'), s2=document.getElementById('up-step-2');
  if(!s1||!s2) return;    // the dialog was closed mid-read — nothing is filed
  _up={ file, mime, word, wordTracked, extractedText, textSource, upload, meta };
  s2.innerHTML=uploadConfirmHtml(_up, meta);
  s1.classList.add('hidden');
  s2.classList.remove('hidden');
  bindFolderSelect(document.getElementById('up-folder'));
  document.getElementById('up-go').addEventListener('click',submitUpload);
  document.getElementById('up-cancel-2').addEventListener('click',closeModal);
  document.getElementById('up-back').addEventListener('click',()=>{
    _up=null;
    s2.classList.add('hidden'); s2.innerHTML=uploadConfirmHtml(null,null);
    s1.classList.remove('hidden');
    const steps=document.getElementById('up-steps'); if(steps){ steps.classList.add('hidden'); steps.innerHTML=''; }
    revive();
  });
}
/* "File contract" — the one moment anything is created. Same validation, same
   record shape, same destination as the old form's Add button; the metadata
   block is assembled here the way openMetaReview assembled it, with the same
   confidence rule: a value the person left as the machine read it keeps the
   machine's confidence, a value they corrected is theirs and reads high. */
async function submitUpload(){
  if(!_up||!_up.file){ toast(i18t('ct_choose_file_upload'),'err'); return; }
  const { file, mime, wordTracked, extractedText, textSource, upload, meta }=_up;
  const cp=fval('up-cp');
  const cpEmail=fval('up-cpemail');
  if(cpEmail && !/.+@.+\..+/.test(cpEmail)){ toast(`"${cpEmail}" is not an email address`,'err'); return; }
  const name=fval('up-name')||file.name.replace(/\.[^.]+$/,'');
  const folder=document.getElementById('up-folder').value;
  const vtype=document.getElementById('up-vtype').value;
  const value=vtype==='none'?0:Number(fval('up-value')||0);
  const expiry=fval('up-expiry')||null;
  const btn=document.getElementById('up-go');
  btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_filing')}</span>`;
  // API mode: store bytes on the server and keep only a reference in the
  // synced record. Done HERE, not in the pipeline — a person who read the
  // card and pressed Cancel must leave no orphaned bytes behind.
  if(API_MODE() && !upload.fileId){
    try{ const r=await api('files','POST',{ name:file.name, mime, dataUrl:upload.dataUrl });
      upload.fileId=r.id; }catch(e){ /* fall back to inline bytes */ }
  }
  const u=currentUser();
  const c={ id:nextId(), name, counterparty:cp, counterpartyEmail:cpEmail||undefined, value, status: cp?'Under Review':'Draft',
    template:null, source:'upload', folder, valueType:vtype,
    lastAction:todayStr(), expiry, hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{},
    comments:[{author:'System',role:'Automation',side:'internal',text:`Uploaded “${file.name}”, received from ${cp||'a counterparty'} and filed under ${FOLDERS[folder].name}.${extractedText.length>200?` ${extractedText.length.toLocaleString()} characters of text extracted for Copilot review.`:''} Review and sign to record acceptance.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Uploaded',detail:`Received “${file.name}” (${Math.round(file.size/1024)} KB)${extractedText.length>200?`, ${extractedText.length.toLocaleString()} chars extracted`:', no text extracted'}`}],
    signatures:[], upload };
  // The audit trail must say the text was machine-read from a scan — a reader
  // months from now has no other way to know the dates were never typed.
  if(isOcrText(textSource)) c.audit.push({ at:nowISO(), user:u?.name||'System', action:'OCR',
    detail:ocrProvenanceLine(upload) });
  // …and it must say when a Word file arrived carrying unresolved markup: the
  // filed text is the document with every tracked change accepted, and only
  // this line tells a reader that resolution happened at upload, not in Word.
  if(wordTracked&&(wordTracked.ins||wordTracked.del)) c.audit.push({ at:nowISO(), user:u?.name||'System', action:'Document',
    detail:trackedNote(wordTracked) });
  c._loaded=true; c._light=false; c._v=0;
  if(meta){
    const conf=meta.confidence||{};
    const out={ confidence:{} };
    const setF=(k,v)=>{ if(v==null||v===''||(typeof v==='number'&&!(v>0)&&k==='value')) return;
      out[k]=v; out.confidence[k]=(String(meta[k]!=null?meta[k]:'')===String(v)&&conf[k])?conf[k]:'high'; };
    setF('counterparty',cp); setF('value',value); setF('expiryDate',expiry);
    document.querySelectorAll('[data-umf]').forEach(el=>{ const k=el.getAttribute('data-umf'); let v=el.value;
      const f=(typeof META_FIELDS!=='undefined'?META_FIELDS:[]).find(x=>x.k===k);
      if(f&&f.type==='num') v=v===''?0:Number(v); setF(k,v); });
    if(meta.sourceSpans) out.sourceSpans=meta.sourceSpans;
    if(meta._payload) out._payload=meta._payload;
    out._source=meta._source;
    out.confirmedAt=nowISO(); out.confirmedBy=u?.name||'';
    applyMetadata(c, out);
  }
  _up=null;
  state.contracts.unshift(c);
  /* A NEW DRAFT OPENS ON KEY TERMS, not on its document — see
     wsTabDefaults. Registered at every creation site because there is no
     single funnel for creating a contract. */
  if(window.roomOpenOnTerms) roomOpenOnTerms(c.id);
  state.activeId=c.id;
  persist(c);
  closeModal();
  toast(i18t('ct_uploaded_filed_in')+FOLDERS[folder].name);
  setView('workspace');
  renderSideFolders();
}
/* Fold confirmed metadata back into the contract's own fields + a metadata block. */
function applyMetadata(c, m){
  c.metadata = m;
  if(m.counterparty && !c.counterparty) c.counterparty=m.counterparty;
  if(m.value && !(Number(c.value)>0)){ c.value=Number(m.value)||0; if(c.valueType==='none') c.valueType='estimated'; }
  if(m.expiryDate && !c.expiry) c.expiry=m.expiryDate;
  logAudit(c,'Metadata confirmed',`Filed with ${m._source==='ai'?'Copilot-extracted':'pattern-matched'} details (type ${m.contractType||'—'}, renewal ${m.renewalType||'—'})`);
}

/* Working-text document body: shown once a contract carries edited wording
   (an owner edit or an accepted counterparty redline). This exact text is
   what versions/compare diff and what the seal will bind. */
/* ---------- THE FRONT OF THE SHEET ----------
   Every document body this tab renders opened differently: the generated one
   with a centred kind/market/id line, the edited working text with a
   left-aligned mono line and a rule all the way across. One agreement, two
   faces, depending on whether anybody had edited it.

   One head now, and it is the shape a deed has (Young, 10 Aug 2026): the
   market it is governed by, the agreement's name, and who it is between —
   from the contract's own record, with the parties line dropped rather than
   invented where a counterparty has not been named. The short rule under it
   is the flourish printed agreements carry; a full-width border reads as a
   table header. Styled by .rl-paper-head in the workbench's stylesheet, which
   this tab loads (see wireDocumentSync), so both screens draw one object. */
function docPaperHeadHtml(c, opts={}){
  const market=(typeof jxName==='function')?jxName():'';
  const us=String((typeof window!=='undefined'&&window.FIRST_PARTY)||'').trim();
  const them=String((c&&c.counterparty)||'').trim();
  const between=(us&&them)?i18t('ct_between_parties',{us:esc(us),them:esc(them)}):'';
  return `<header class="rl-paper-head">
    ${market?`<div class="rl-paper-kick">${esc(market)}${opts.note?' · '+esc(opts.note):''}</div>`:''}
    <h3 class="rl-paper-title">${esc((c&&c.name)||'')}</h3>
    ${between?`<div class="rl-paper-sub">${between}</div>`:''}
  </header>`;
}

function redlineDocBody(c){
  return `
    ${docPaperHeadHtml(c,{note:i18t('ct_working_text_short')})}
    <div class="mb-4 flex items-start gap-2 rounded-[4px] px-3 py-2 text-[11px]" style="background:var(--color-accent-100);border:1px solid var(--color-accent-300);color:var(--color-accent-800)" data-anchor="recital">
      ${icon('history','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>${i18t('ct_doc_carries')} <strong>${i18t('ct_edited_working')}</strong>. Use <strong>${i18t('act_edit')}</strong> ${i18t('ct_to_change_wording')} <strong>${i18t('ct_compare')}</strong> ${i18t('ct_review_between')}</span>
    </div>
    <div style="color:var(--color-doc-text)" data-anchor="redline">${docBodyHtml(c,{size:'13.5px', lh:'1.85'})}</div>
    ${signatureBlock(c)}`;
}

/* Plain-text document editor (Admin + Legal). Saves are versioned so
   Compare shows exactly what changed; the audit trail records the edit. */
function openEditDocModal(c){
  if(!canEdit()){ toast(i18t('ct_viewers_no_edit_doc'),'err'); return; }
  if(c.status==='Signed'){ toast(i18t('ct_executed_readonly'),'err'); return; }
  // the Word-review soft lock: edits made here while the file is out would
  // silently lose to (or clobber) the wording coming back from Word
  const wasRich=!!(window.isRich&&isRich(c.format)&&c.redlineText);
  const cur=wasRich ? docPlainText(c)
    : (window.reflowWorkingText?reflowWorkingText(docPlainText(c)):docPlainText(c));
  if(!cur){ toast(i18t('ct_no_editable_text'),'err'); return; }
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const firstEdit=!c.redlineText&&!isUpload(c);
  // Full-window editor: the dialog takes the whole screen and the wording sits
  // in a centred book-page column — same save-and-version behaviour, more room.
  const COL='width:100%;max-width:800px;margin-left:auto;margin-right:auto;flex:none';
  openModal(`
    <div style="padding:24px 26px 20px;height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="${COL};padding:0 26px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('ct_edit_document',{id:c.id})}</h3></div>
        <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 10px;line-height:1.5">${i18t('ct_change_and_save')} <b>new version</b> ${i18t('ct_review_under')} <b>${i18t('ct_compare')}</b> and share the updated text with the counterparty as usual.${firstEdit?` <b>${i18t('ct_note')}</b> the first edit converts the drafted layout into working text; the highlighted quick-fill fields no longer apply after that.`:''}</p>
        ${wasRich?`<div style="display:flex;gap:7px;align-items:flex-start;border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:4px;padding:8px 11px;margin:0 0 10px;font-size:11.5px;line-height:1.5;color:var(--color-accent-800)">
          <span style="flex:none;margin-top:1px">${icon('alert','w-3.5 h-3.5')}</span>
          <span>${i18t('ct_doc_carries')} <b>formatting</b> ${i18t('ct_headings_bold')} <b>${i18t('ct_converts_plain')}</b>${i18t('ct_clause_numbers_text')}</span></div>`:''}
      </div>
      <textarea id="ed-text" class="scroll-thin" spellcheck="false" style="${COL};flex:1 1 auto;min-height:0;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:22px 26px;font:inherit;font-size:15px;line-height:1.95;resize:none;outline:none">${esc(cur)}</textarea>
      <div style="${COL};padding:0 26px;margin-top:12px">
        <label style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:9px 11px;font-size:11.5px;cursor:pointer">
          <input type="checkbox" id="ed-from-cp" style="margin-top:2px;flex:none"/>
          <span><b>${i18t('ct_changes_came_from',{who:esc(c.counterparty||i18t('ng_the_counterparty'))})}</b>
          <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">${i18t('ct_tick_when_typing')} <b>${i18t('ct_in_their_name')}</b> ${i18t('ct_waits_for_decision')}</span></span>
        </label>
      </div>
      <div style="${COL};padding:0 26px;display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span id="ed-count" style="font-size:10.5px;color:var(--color-neutral-500)">${cur.length.toLocaleString()} characters</span>
        <span style="display:flex;gap:8px">
          <button id="ed-cancel" class="ui-btn">${i18t('act_cancel')}</button>
          <button id="ed-save" class="ui-btn ui-btn-primary">${icon('check2','w-3.5 h-3.5')} Save changes</button>
        </span>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  const ta=document.getElementById('ed-text');
  ta.addEventListener('input',()=>{ const el=document.getElementById('ed-count'); if(el) el.textContent=ta.value.length.toLocaleString()+' characters'; });
  document.getElementById('ed-cancel').addEventListener('click',closeModal);
  document.getElementById('ed-save').addEventListener('click',()=>{
    const txt=ta.value;
    if(txt.trim()===cur.trim()){ toast(i18t('ct_no_changes_made')); closeModal(); return; }
    if(!txt.trim()){ toast(i18t('ct_text_not_empty'),'err'); return; }
    const fromCp=!!document.getElementById('ed-from-cp')?.checked;
    if(fromCp){
      // THEIR wording, typed in by us. It becomes a round in their name and
      // goes through the same review step as a redline sent through the portal
      // — never a silent owner edit, which is what this used to record.
      const r=fileCounterpartyEdit(c, txt, { by:c.counterparty, channel:'received outside HaTi' });
      if(!r) return;
      persist(c); closeModal(); renderWorkspace();
      toast(`Filed as round ${r.n} from ${c.counterparty||'the counterparty'} — review the changes`);
      if(window.reviewProposedRound) reviewProposedRound(c, r.n);
      return;
    }
    const v=applyOwnerEdit(c, txt);
    if(!v && !c.redlineText) return;
    persist(c);
    closeModal(); renderWorkspace();
    toast(i18t('ct_changes_saved'));
  });
}

/* The one Word download in the product. Two controls used to say "Word" on the
   same screen: this one, and a second in the panel below that ALSO froze online
   editing — silently, with no explanation and no obvious way back. The pause is
   a real and useful thing (edits made here while the file is out would collide
   with the wording coming back), so it is kept — as a choice, stated in words,
   next to the button that causes it. */
/* ---- the owner's half of the discussion ----
   The mirror of the panel on the counterparty's page, reading and writing the
   same thread. Rendered even when empty and nothing has been shared yet, so the
   channel is discoverable before it is needed rather than after. */
/* The points the counterparty raised that we did not adopt. The counterparty's
   page has shown these since the second review; the owner's side never has, so
   the one list that says what is actually still being argued about existed at
   only one end of the negotiation. Each carries the same reply strip her
   counterparty gets, so a sentence can be answered with a sentence from either
   side of the deal. */
function discussPointsSectionHtml(c){
  const pts=(window.openPointsFor?openPointsFor(c):[])||[];
  if(!pts.length || !window.discussPointReplyHtml) return '';
  const e=x=>String(x==null?'':x).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  const who=e(c.counterparty||'the counterparty');
  return `
    <div id="ws-openpoints" style="border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:8px;padding:14px 18px;margin:0 0 14px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
        <span style="flex:none;color:var(--st-amber-dot);display:inline-flex">${icon('alert','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;color:var(--st-amber-fg)">${i18t('ct_still_open')}</span>
        <span style="margin-left:auto;font-size:10.5px;color:var(--st-amber-fg);font-family:var(--font-mono)">${pts.length} point${pts.length===1?'':'s'}</span>
      </div>
      <p style="margin:0 0 10px;font-size:11.5px;line-height:1.55;color:var(--st-amber-fg)">${i18t('ct_not_adopted',{who})}</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${pts.map((pt,i)=>`
          <div style="border:1px solid #e8d5ad;background:var(--color-surface);border-radius:6px;padding:9px 12px;font-size:12px;line-height:1.6">
            ${pt.before?`<div><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('ct_contract_says')}</span>
              <div style="color:var(--color-neutral-800)">${e(pt.before)}</div></div>`:''}
            ${pt.after?`<div style="margin-top:5px"><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('ct_they_asked_for')}</span>
              <div style="color:var(--st-ruby-fg)">${e(pt.after)}</div></div>`:''}
            ${pt.ask?`<div style="margin-top:5px;font-size:11.5px;color:var(--color-neutral-700)"><b>${i18t('ct_they_said')}</b> ${e(pt.ask)}</div>`:''}
            ${pt.reason?`<div style="margin-top:4px;font-size:11.5px;color:var(--color-neutral-700)"><b>${i18t('ct_you_replied')}</b> ${e(pt.reason)}</div>`:''}
            ${discussPointReplyHtml('point:'+pt.id, c._messages||[], {
              idp:'ws-op-'+i, mine:'owner',
              label:'Still open — '+discussTrim(pt.after||pt.before,60),
              placeholder:'e.g. Net-45 works if delivery goes weekly.',
              disabled:!canEdit(), disabledNote:'Viewers can read this but cannot reply.' })}
          </div>`).join('')}
      </div>
    </div>`;
}
function renderDiscussSection(c){
  const host=document.getElementById('discuss-section'); if(!host) return;
  if(!window.discussPanelHtml || !API_MODE()){ host.innerHTML=''; return; }
  const topics=window.discussTopics?discussTopics(c, window.docPlainText?docPlainText(c):''):[];
  host.innerHTML=discussPointsSectionHtml(c)+discussPanelHtml({
    messages:c._messages||[], topics, mine:'owner', idp:'ws-discuss',
    title:`Talk it through with ${c.counterparty||'the counterparty'}`,
    blurb:'Answer a question or raise one without opening a formal round. This sends a message only — the wording of the contract is untouched, and nothing here needs reviewing or deciding.',
    disabled:!canEdit(), disabledNote:'Viewers can read this conversation but cannot post to it.',
  });
  if(!canEdit()) return;
  const post=(topic,topicLabel,body)=>api('contracts/'+c.id+'/messages','POST',{topic,topicLabel,body});
  const after=res=>{
    c._messages=(res&&res.messages)||c._messages||[];
    renderDiscussSection(c);
    // whether it actually reached them is the sort of thing this product says
    // out loud rather than leaving to be discovered
    toast(res&&res.emailSent ? `Message sent to ${res.to}`
      : res&&res.to ? `Saved — but the email to ${res.to} could not be sent. They will see it when they open their link.`
      : 'Saved — they will see it when they open their link');
  };
  wireDiscussPanel({ idp:'ws-discuss', topics, send:post, onSent:after });
  if(window.wireDiscussPoints) wireDiscussPoints({ send:post, onSent:after });
}
async function loadDiscussion(c){
  if(!API_MODE()||!window.discussPanelHtml) return;
  try{ const r=await api('contracts/'+c.id+'/messages'); c._messages=r.messages||[]; }
  catch(e){ c._messages=c._messages||[]; }
  renderDiscussSection(c);
}

function uploadDocBody(c){
  const u=c.upload||{}, mime=u.mime||'';
  const isPdf=/pdf/.test(mime), isImg=/^image\//.test(mime), isText=/^text\//.test(mime);
  const isDocx=!!(window.isWordDoc&&isWordDoc(c));
  // a generous reading surface: fills the viewport height, with an Expand
  // control that opens the document near-fullscreen for comfortable review
  const canPreview = isPdf||isText||isImg;
  const fileUrl = docFileUrl(c);
  const previewHead = canPreview ? `
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="text-[11px] font-600 uppercase tracking-[0.14em] text-brand-800/60">${i18t('ct_document_preview')}</div>
      <button type="button" data-expand-doc class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-600 text-brand-700 hover:border-brand-400 hover:text-brand-900 transition">${icon('expand','w-3.5 h-3.5')} Expand</button>
    </div>` : '';
  const preview = previewHead + ((isPdf||isText)
    ? `<iframe id="uploaded-doc-frame" src="${fileUrl}" class="w-full h-[calc(100vh-235px)] min-h-[560px] rounded-xl border border-brand-100 bg-white elev-1" title="${i18t('ct_uploaded_document')}"></iframe>`
    : isImg
    ? `<div class="rounded-xl border border-brand-100 bg-white elev-1 overflow-auto max-h-[calc(100vh-235px)] min-h-[420px] grid place-items-start"><img id="uploaded-doc-frame" src="${fileUrl}" class="max-w-full" alt="${i18t('ct_uploaded_document')}"/></div>`
    : (isDocx&&!c.redlineText&&(u.extractedText||'').length>40)
    ? `<div class="flex items-center justify-between gap-2 mb-2">
         <div class="text-[11px] font-600 uppercase tracking-[0.14em] text-brand-800/60">${i18t('ct_reading_view')}</div>
       </div>
       <div class="scroll-thin rounded-xl border border-brand-100 bg-white elev-1 overflow-y-auto max-h-[calc(100vh-235px)] min-h-[420px]" style="padding:26px 30px">${documentTextHtml(u.extractedText,{size:'13px',lh:'1.85'})}</div>`
    : `<div class="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-10 text-center">
         <div class="text-brand-300 mb-2 flex justify-center">${icon('file','w-8 h-8')}</div>
         <div class="text-sm font-600 text-brand-800/80">${u.fileName||'Document'}</div>
         <div class="text-xs text-brand-800/65 mt-1">${i18t('ct_cant_preview')}</div>
       </div>`);
  const sizeKB = u.size?Math.round(u.size/1024):0;
  return `
    <div class="mb-6 pb-5 border-b border-brand-100">
      <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-800/60 mb-2">${i18t('ct_external_received',{id:c.id})}</div>
      <h3 class="font-display font-700 text-lg tracking-tight text-brand-900">${esc(c.name)}</h3>
    </div>
    <div class="mb-5 flex items-start gap-2 rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-2.5 text-[11px] text-gold-700" data-anchor="doc">
      ${icon('upload','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>${isExternallyExecuted(c)
        ? `This contract was <strong>${i18t('ct_executed_outside')}</strong>${c.counterparty?` with <strong>${esc(c.counterparty)}</strong>`:''} and migrated in as a record. It is filed for reference, renewal and reporting — there is nothing to sign here.`
        : `${i18t('ct_received_from',{who:c.counterparty||i18t('ct_a_counterparty')})}${i18t('ct_on_their_paper')} <strong>${FIRST_PARTY}</strong>’s acceptance with a cryptographic seal.`}</span>
    </div>
    ${PORTAL_MODE?'':`
    ${ocrBannerHtml(u)}
    <div class="mb-4 grid sm:grid-cols-2 gap-2 text-[11px]">
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">${i18t('ct_original_file')}</div><div class="font-medium text-brand-900 truncate">${u.fileName||'—'} · ${sizeKB} KB</div></div>
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">${i18t('ct_uploaded')}</div><div class="font-medium text-brand-900 truncate">${u.uploadedBy||'—'} · ${u.uploadedAt?fmtDT(u.uploadedAt):'—'}</div></div>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <a href="${fileUrl}" download="${(u.fileName||'contract').replace(/"/g,'')}" class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download original</a>
      <span class="inline-flex items-center gap-1.5 rounded-lg border ${u.textChars>200?(isOcrText(u.textSource)?'border-gold-500/25 bg-gold-500/10 text-gold-700':'border-brand-100 bg-brand-50/50 text-brand-700'):'border-gold-500/25 bg-gold-500/10 text-gold-700'} px-3 py-2 text-[11px]">${icon('scan','w-3.5 h-3.5')}${u.textChars>200
        ? `${Number(u.textChars).toLocaleString()} characters ${isOcrText(u.textSource)?`machine-read from ${u.ocrPages||'the'} scanned page${u.ocrPages===1?'':'s'}`:'read'} — Copilot review analyses the actual text`
        : 'Text not machine-readable — Copilot review falls back to a manual checklist'}</span>
      ${canEdit()?`<button type="button" data-reread class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition" title="${i18t('ct_read_original_again')}">${icon('history','w-3.5 h-3.5')} Re-read document</button>`:''}
    </div>`}
    <!-- Everything above is the owner's own handling of the file: the Word
         round-trip control, who uploaded it and when, and how well the text
         could be read for Copilot review. None of it is the counterparty's business,
         and shown to them it produced a second Download button competing with
         the portal's own, under copy addressed to somebody else. -->
    ${c.redlineText?`
    <div class="mb-4" data-anchor="redline">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="color:var(--color-accent)">${icon('history','w-3.5 h-3.5')}</span>
        <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--color-neutral-600)">${i18t('ct_working_text')}</span>
      </div>
      <div style="border:1px solid var(--color-accent-300);background:var(--color-surface);border-radius:5px;padding:12px 14px;color:var(--color-doc-text)">${docBodyHtml(c,{size:'13px',lh:'1.7'})}</div>
      <div style="font-size:10.5px;color:var(--color-neutral-600);margin-top:4px">This edited text is what versions, Compare and the seal operate on — the original file below is retained unchanged as the received source.</div>
    </div>`:''}
    ${preview}
    ${signatureBlock(c)}`;
}

/* Read the stored original again and replace the extracted text. Documents
   uploaded before an extraction improvement keep whatever text was read at the
   time; the file itself is still on record, so re-reading repairs them in place
   without a re-upload. Safe on executed contracts too — an upload's seal binds
   the file's own hash, not this text (see sealString). */
async function rereadUploadText(c, btn){
  if(!canEdit()){ toast(i18t('ct_viewers_no_change'),'err'); return; }
  const u=c.upload||{};
  const restore=btn?btn.innerHTML:'';
  if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_reading')}</span>`; }
  try{
    /* There is one file on an upload now — the original. The branch that
       re-read the newest adopted Word version went when the round trip did. */
    const cur=null;
    if(cur){
      persist(c);
      toast(`Document re-read from ${cur.key} — ${text.length.toLocaleString()} characters`);
      renderWorkspace();
      return;
    }
    if(!u.dataUrl && u.fileId && API_MODE()){
      const f=await api('files/'+u.fileId); u.dataUrl=f.dataUrl;
    }
    if(!u.dataUrl) throw new Error('the original file is not available on this record');
    const text=await extractDocText(u.dataUrl, u.mime||'');
    // …and the same gate on the repair path: a re-read that produced bytes must
    // not overwrite text that was readable
    if(!text || text.length<40 || !looksLikeText(text)) throw new Error('no machine-readable text in this file');
    const before=Number(u.textChars||0);
    u.extractedText=text; u.textChars=text.length;
    c.lastAction=todayStr();
    logAudit(c,'Document',`Re-read the original file — ${text.length.toLocaleString()} characters extracted (was ${before.toLocaleString()})`);
    persist(c);
    toast(`Document re-read — ${text.length.toLocaleString()} characters`);
    renderWorkspace();
  }catch(e){
    toast(i18t('ct_could_not_reread')+e.message,'err');
    if(btn){ btn.disabled=false; btn.innerHTML=restore; }
  }
}

// near-fullscreen reader for a received document — the reading surface the
// inline preview can't give inside the split workspace
function openDocReader(url, name, mime){
  if(!url) return;
  const prev=document.getElementById('doc-reader'); if(prev) prev.remove();
  // the url may be a blob: handle, which carries no type — trust the stored mime
  const isImg=mime?/^image\//.test(mime):/^data:image\//.test(url);
  const body=isImg
    ? `<div class="flex-1 min-h-0 overflow-auto bg-docbg grid place-items-start p-4"><img src="${url}" class="max-w-full mx-auto" alt="${(name||'Document').replace(/"/g,'')}"/></div>`
    : `<iframe src="${url}" class="flex-1 min-h-0 w-full bg-white" title="${(name||'Document').replace(/"/g,'')}"></iframe>`;
  const ov=document.createElement('div');
  ov.id='doc-reader';
  ov.className='fixed inset-0 z-[80] bg-ink/60 backdrop-blur-sm flex flex-col p-3 sm:p-6';
  ov.style.animation='viewIn .2s var(--ease)';
  ov.innerHTML=`
    <div class="mx-auto w-full max-w-[1100px] flex-1 min-h-0 flex flex-col bg-white rounded-2xl elev-4 overflow-hidden">
      <div class="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-hair">
        <div class="min-w-0 flex items-center gap-2.5">
          <span class="h-8 w-8 grid place-items-center rounded-lg bg-brand-50 text-brand-600 shrink-0">${icon('file','w-4 h-4')}</span>
          <div class="min-w-0"><div class="text-sm font-700 text-brand-900 truncate">${name||'Document'}</div><div class="text-[11px] text-brand-800/60">${i18t('ct_received_fullscreen')}</div></div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="${url}" download="${(name||'contract').replace(/"/g,'')}" class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-600 text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download</a>
          <button type="button" data-close-reader class="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 text-white px-3 py-2 text-xs font-600 hover:bg-brand-800 transition">${icon('close','w-3.5 h-3.5')} ${i18t('ct_close')}</button>
        </div>
      </div>
      ${body}
    </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.querySelector('[data-close-reader]').addEventListener('click',close);
  ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
  document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc);} });
}

function uploadScanRules(c){
  const F=[]; const add=(id,sev,kind,title,what,why,fix)=>F.push({id,sev,kind,title,anchor:'doc',what,why,fix});
  // metadata checks (always)
  if(!c.counterparty) add('u-cp','high','missing','Counterparty not recorded',
    'No counterparty name is recorded against this uploaded document.',
    'A signed contract with no recorded party is hard to enforce and clutters the register.',
    'Add the counterparty’s full registered name (as on the BRS certificate) in the deal details.');
  if(isMonetary(c) && !(Number(c.value)>0)) add('u-val','med','missing','Contract value not recorded',
    'The value field is empty for a document marked as monetary.',
    'Value drives approval thresholds, stamp-duty assessment and portfolio reporting.',
    `Record the agreed ${jxCurrency()} value, or mark the contract non-monetary if none passes.`);

  const u=c.upload||{};
  /* The working text once it exists, not the file as it arrived: the panel
     quotes verbatim and the reader is shown the working text, so scanning the
     original would quote wording that is no longer on the page. */
  const text=(c.redlineText ? docPlainText(c) : '') || u.extractedText || '';
  if(text.length>200){
    // The review still quotes verbatim from whatever text we hold. When that
    // text came out of a scan, say so first and loudly — every quote below is a
    // quote of the transcription, not of the paper.
    if(isOcrText(u.textSource)) add('u-ocr','med','risk','Quotes below come from a machine-read scan',
      ocrProvenanceLine(u),
      'OCR misreads dates, figures and names. A clause quoted here is a quote of the transcription, not of the original paper — and a wrong date drives a wrong renewal reminder.',
      'Check every quoted date, amount and party name against the original document before relying on this review.');
    // real analysis over the extracted text
    findingsFromText(c, text).forEach(f=>F.push(f));
  } else {
    // no text even after OCR was attempted → honest manual checklist
    add('u-noext','low','missing','Document text could not be read automatically',
      u.textSource==='none'&&u.ocrTotalPages
        ? `OCR was attempted on this document (${u.ocrTotalPages} page${u.ocrTotalPages===1?'':'s'}) and produced no usable text. The points below are a manual checklist, not a read of the clauses.`
        : 'This file did not yield extractable text. The points below are a manual checklist, not a read of the clauses.',
      'Without readable text there is nothing for a clause-level review to analyse.',
      'Re-scan the document at a higher resolution and upload it again, or review the document manually.');
    add('u-law','med','risk',`Confirm governing law is ${(typeof jxAdjective==='function'?jxAdjective():'local')}`,
      `Confirm the governing-law and jurisdiction clause names ${(typeof jxName==='function'?jxName():'your jurisdiction')}.`,
      `A foreign governing law or arbitration seat makes enforcement slow and expensive for a ${(typeof jxAdjective==='function'?jxAdjective():'local')} business.`,
      `Find the governing-law clause and confirm ${(typeof jxName==='function'?jxName():'your jurisdiction')} and a local forum; negotiate if not.`);
    add('u-liab','med','risk','Check liability cap & indemnities',
      'Counterparty paper often caps their liability low and pushes broad indemnities onto you.',
      'An unbalanced liability/indemnity split can expose you well beyond the deal value.',
      'Confirm the cap is mutual and reasonable and indemnities are limited to their fault.');
    add('u-term','low','ambiguity','Confirm term, renewal & exit',
      'Check the term length, any automatic renewal, and your notice period to exit.',
      'Auto-renewing contracts with long notice periods are a common way to get locked in.',
      'Confirm renewal is acceptable and the exit notice period is workable.');
  }
  // always — honest disclaimer
  add('u-legal','low','missing','Have qualified counsel review before signing',
    'This Copilot review flags common issues but is not legal advice and cannot catch everything.',
    'External paper is drafted for the other side; a clause-by-clause read by a lawyer catches what heuristics miss.',
    'Obtain independent legal review before signing where the value or risk is material.');
  return F;
}

/* ============================================================
   DOC BODY + WORKSPACE
   ============================================================ */
/* docBody() dressed in the document's STRUCTURE (js/branding.js).

   Four of the five structures are pure CSS and arrive through the paper div's
   data-doc-structure attribute, so they need nothing here. Contents First is
   the one that emits markup, and it only prepends — so this wrapper is the
   single place the canvas gains a contents page, and every repaint of
   #doc-canvas has to come through it or the page would vanish on the next
   partial render.

   NOT used by freezeContractHtml, deliberately: a contents page is generated
   navigation, rebuilt from the headings on every render. Sealing it would put
   a generated artefact inside the hash, so a later improvement to the
   generator would break verification of contracts sealed today. The seal
   holds the contract; the contents page is how it is read. */
function docBodyStructured(c){
  const body = docBody(c);
  return (window.docStructureBodyHtml && window.resolveDocBranding)
    ? docStructureBodyHtml(resolveDocBranding(c), body) : body;
}

/* ---- THE DOCUMENT TAB READS; IT DOES NOT EDIT ----
   A generated contract is built with its commercial terms as <input> boxes so
   a draft can be completed in place, and for several of those terms — the
   tonnage, the inspection window, the notice period — that is the ONLY place
   they exist. So this tab cannot simply stop being editable: a brand-new
   agreement would have no way to be filled in at all.

   The line is the moment the contract stops being yours alone. While it is a
   DRAFT the blanks are yours and the boxes stay. From the moment it goes for
   review — the point at which a counterparty may be reading it — the page
   becomes a clean read, and every wording change goes through Negotiate where
   it is a tracked change with a fingerprint someone has to decide. Two ways to
   change a contract is how the two drift apart.

   Clean read means readOnlyDocHtml: each field is replaced by the TEXT it
   holds, an em-dash where it is empty. That is the same projection the
   counterparty's page and every export already use, so the reader here and the
   reader there are looking at one document. */
function docFillable(c){
  if(!c) return false;
  if(c.status==='Signed'||PORTAL_MODE||!canEdit()) return false;
  if(isUpload(c)||c.redlineText) return false;
  return c.status==='Draft';
}

function docBody(c){
  if(isUpload(c)) return uploadDocBody(c);
  if(c.status==='Signed' && c.execution && c.execution.html) return frozenDocBody(c);
  if(c.redlineText) return redlineDocBody(c);
  const t=TEMPLATES[c.template];
  const locked=c.status==='Signed'||PORTAL_MODE||!canEdit();
  const dis=locked?'disabled':'';
  const fDate=(id,val)=>`<input ${dis} type="date" value="${val||''}" data-field="${id}" class="field field-date"/>`;
  const fText=(id,val,ph='')=>`<input ${dis} type="text" value="${val||''}" placeholder="${ph}" data-field="${id}" class="field"/>`;
  const fNum=(id,val,ph='')=>`<input ${dis} type="number" value="${val??''}" placeholder="${ph}" data-field="${id}" class="field field-num"/>`;
  // a blank holding SHILLINGS says so, so it can be written out with thousands
  // separators; a blank holding tonnes, days or years must not be (see
  // fieldDisplayValue in js/core.js — guessing turns "2026" into "2,026")
  const fMoney=(id,val,ph='')=>`<input ${dis} type="number" value="${val??''}" placeholder="${ph}" data-field="${id}" data-money="1" class="field field-num"/>`;
  const CP=`<input ${dis} type="text" value="${(c.counterparty||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ct_counterparty_name')}" data-sync="counterparty" class="field"/>`;
  const VAL=`<input ${dis} type="number" value="${c.value||''}" placeholder="0" data-sync="value" data-money="1" class="field field-num"/>`;
  // Presentational clause flags — reuse the app's EXISTING scan findings
  // (openFindings), map each to its clause anchor, keep the worst severity.
  const flags={};
  try{ (window.openFindings?openFindings(c):[]).forEach(x=>{ const a=x.anchor;
    if(/^c\d+$/.test(a||'')){ const r=(window.SEV_RANK&&SEV_RANK[x.sev])||{high:3,med:2,low:1}[x.sev]||0;
      if(!flags[a]||r>flags[a].r) flags[a]={r,sev:x.sev}; } }); }catch(e){}
  const FLAGPAL={ high:{tag:'High',bg:'var(--st-ruby-bg)',fg:'var(--st-ruby-fg)',box:'rgba(176,69,60,.05)',line:'rgba(176,69,60,.3)'},
    med:{tag:'Deviation',bg:'var(--st-amber-bg)',fg:'var(--st-amber-fg)',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'},
    low:{tag:'Check',bg:'var(--st-amber-bg)',fg:'var(--st-amber-fg)',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'} };
  const clause=(n,title,body)=>{
    const p=flags['c'+n]?FLAGPAL[flags['c'+n].sev]:null;
    const wrap=p?` style="background:${p.box};outline:1px solid ${p.line};border-radius:4px;padding:6px 10px;margin-bottom:14px"`:'';
    const tag=p?`<span style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:${p.bg};color:${p.fg};padding:1px 6px;border-radius:3px;flex:none">${p.tag}</span>`:'';
    return `<div class="${p?'py-1':'mb-5 px-2 -mx-2 py-1'}" data-anchor="c${n}"${wrap}><div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px"><h4 class="font-display font-600 text-brand-900 text-[13px]" style="margin:0">${n}. ${title}</h4>${tag}</div><p class="text-[13.5px] leading-[1.85]" style="margin:0;color:var(--color-doc-text)">${body}</p></div>`;
  };
  const f=c.fields;
  const D=id=>fDate(id,f[id]);                    // date field
  const T=(id,ph)=>fText(id,f[id],ph);            // text field
  const N=(id,def,ph)=>fNum(id,(f[id]??def),ph);  // number field (with default)
  const M=(id,def,ph)=>fMoney(id,(f[id]??def),ph);// an amount in shillings

  /* ---- THE MARKET SPEAKS THROUGH THESE, NOT THROUGH THE DRAFTING ----
     Every clause below used to name Kenya outright — its money, its standards
     body, its tax authority, its courts — so a workspace switched to Sweden got
     Swedish kronor on the register and Kenyan law in the contract it created.
     The pack answers all of it now, and a null answer means the clause drops
     that half of the sentence rather than naming a stand-in. Read the guards
     below as "say this only where it is true", not as formatting. */
  const CUR  = (typeof jxCurrency==='function') ? jxCurrency() : 'KES';
  const MKT  = (typeof jxName==='function') ? jxName() : 'Kenya';
  const SB   = (typeof jxStandardsBody==='function') ? jxStandardsBody() : null;
  const FSR  = (typeof jxFoodSafetyRegulator==='function') ? jxFoodSafetyRegulator() : null;
  const TAX  = (typeof jxTaxAuthority==='function') ? jxTaxAuthority() : null;
  const PROF = (typeof jxProfessionalBodies==='function') ? jxProfessionalBodies() : null;
  const FORUM = (typeof jx==='function') ? jx().forum : 'the courts';
  const INC  = (typeof jxIncorporatedIn==='function') ? jxIncorporatedIn() : MKT;
  const LAW  = (typeof jxGovernedBy==='function') ? jxGovernedBy() : '';
  const LAWARB = (typeof jxGovernedByArb==='function') ? jxGovernedByArb() : '';
  const LEASELAW = (typeof jxLeaseLaw==='function') ? jxLeaseLaw() : '';
  const ADJ  = (typeof jxAdjective==='function') ? jxAdjective() : 'Kenyan';
  const EG   = k => (typeof jxEg==='function') ? jxEg(k) : '';

  // Each builder returns { title, recital, clauses[] }. Clause 'c2' holds the
  // contract value for most types (NDA has no value; scanRules mirrors this).
  const BUILD = {
    RM:()=>({ title:'RAW MATERIAL SUPPLY AGREEMENT',
      recital:`This Raw Material Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('material','e.g. refined sugar')} into the Buyer's production facilities in ${MKT}.`,
      clauses:[
        clause(1,'Supply & Specification',`The Supplier shall supply an estimated ${N('volume',5000)} metric tonnes per annum meeting the agreed specification${SB?` and the applicable ${SB} standard`:''}, delivered DDP to the Buyer's plant.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is ${CUR} ${VAL}, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT.`),
        clause(3,'Quality & Rejection',`Consignments failing specification${(FSR||SB)?` or ${[FSR,SB].filter(Boolean).join(' / ')} requirements`:' or the agreed quality requirements'} may be rejected within ${N('inspectDays',3)} days of delivery, with replacement at the Supplier's cost.`),
        clause(4,'Governing Law',LAWARB),
      ]}),
    PK:()=>({ title:'PACKAGING SUPPLY AGREEMENT',
      recital:`This Packaging Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('packType','e.g. PET bottles & preforms')} and related packaging materials.`,
      clauses:[
        clause(1,'Scope of Supply',`The Supplier shall manufacture and supply packaging to the Buyer's approved artwork and specification, against a rolling forecast, to the Buyer's plants in ${MKT}.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is ${CUR} ${VAL}, on agreed per-unit pricing. Any dedicated tooling is owned by the Buyer and listed in Annexure A.`),
        clause(3,'Forecast, Lead Time & Stock',`The Buyer issues a ${N('forecastWeeks',8)}-week rolling forecast; the Supplier holds ${N('safetyDays',14)} days of safety stock and honours agreed lead times.`),
        clause(4,'Intellectual Property & Governing Law',`All trademarks and artwork remain the Buyer's property. ${LAW}`),
      ]}),
    CM:()=>({ title:'CONTRACT MANUFACTURING & CO-PACKING AGREEMENT',
      recital:`This Contract Manufacturing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Brand Owner") and ${CP} (the "Co-Packer") for the manufacture of ${T('product','e.g. powdered beverages')} to the Brand Owner's specification.`,
      clauses:[
        clause(1,'Manufacturing Scope',`The Co-Packer shall manufacture, fill and pack the products to the Brand Owner's recipe and specification at its licensed facility. All formulations and recipes remain the exclusive property of the Brand Owner.`),
        clause(2,'Tolling Fee & Contract Value',`The estimated annual contract value is ${CUR} ${VAL}, billed as a per-unit conversion (tolling) fee and reconciled monthly against actual output.`),
        clause(3,'Quality, Food Safety & Licences',`The Co-Packer shall maintain FSSC 22000${SB?` / ${SB}`:''} certification and valid ${(FSR&&TAX)?`${FSR} and ${TAX}`:'food-safety and business'} licences, and permit the Brand Owner to audit on ${N('auditNotice',7)} days' notice.`),
        clause(4,'Liability & Governing Law',`The Co-Packer is liable for defects arising from its process, including recall costs. ${LAW}`),
      ]}),
    EQ:()=>({ title:'EQUIPMENT LEASE & MAINTENANCE AGREEMENT',
      recital:`This Equipment Lease is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Lessee") and ${CP} (the "Lessor") for the lease of ${T('equipment','e.g. a PET filling line')} installed at the Lessee's plant.`,
      clauses:[
        clause(1,'Equipment & Title',`The Lessor shall install and commission the equipment at the Lessee's premises. Title to the equipment remains with the Lessor at all times during the term.`),
        clause(2,'Lease Charges',`The Lessee shall pay a monthly lease charge of ${CUR} ${VAL}, in advance, exclusive of VAT.`),
        clause(3,'Maintenance & Uptime',`The Lessor guarantees ${N('uptime',95)}% availability with an on-site response within ${N('respHrs',24)} hours, and holds critical spares locally.`),
        clause(4,'Term, Insurance & Governing Law',`The term is ${N('termYears',3)} years. The Lessee shall insure the equipment to full replacement value with the Lessor noted as loss payee. ${ADJ} law governs.`),
      ]}),
    WH:()=>({ title:'WAREHOUSING & COLD-CHAIN SERVICES AGREEMENT',
      recital:`This Warehousing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Provider") for third-party storage and handling at ${T('site',EG('site'))}.`,
      clauses:[
        clause(1,'Storage & Handling',`The Provider shall store up to ${N('pallets',1200)} pallet positions, including ${T('tempRange','e.g. 2–8°C chilled')} temperature-controlled space, with inventory managed on the Client's WMS.`),
        clause(2,'Service Charge',`The monthly service charge is ${CUR} ${VAL}, based on pallet positions and throughput, exclusive of VAT.`),
        clause(3,'Stock Accuracy & Temperature SLA',`The Provider shall maintain not less than ${N('accuracy',99)}% stock accuracy and continuous temperature logging, reporting any excursion within ${N('excursionHrs',2)} hours.`),
        clause(4,'Liability & Governing Law',`The Provider is liable for loss or damage to goods in its custody up to their stock value. ${LAW}`),
      ]}),
    FF:()=>({ title:'FREIGHT & DISTRIBUTION AGREEMENT',
      recital:`This Freight & Distribution Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Carrier") for the distribution of finished goods across ${T('region',EG('region'))}.`,
      clauses:[
        clause(1,'Scope of Services',`The Carrier shall collect from the Principal's warehouse and deliver to the ${T('channel','e.g. distributors and modern trade')} within the agreed territory.`),
        clause(2,'Rates & Contract Value',`The estimated annual contract value is ${CUR} ${VAL}, billed against agreed per-drop and per-kilometre rates and reconciled monthly.`),
        clause(3,'Service Levels',`The Carrier commits to an on-time-in-full (OTIF) target of ${N('otif',98)}% with delivery within ${N('leadHrs',48)} hours of dispatch, per the KPI schedule in Annexure A.`),
        clause(4,'Liability & Governing Law',`Liability for loss in transit is capped per consignment value. ${LAWARB}`),
      ]}),
    DA:()=>({ title:'DISTRIBUTOR AGREEMENT',
      recital:`This Distributor Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Distributor"), appointing the Distributor for the ${T('territory',EG('territory'))} territory.`,
      clauses:[
        clause(1,'Appointment & Territory',`The Principal appoints the Distributor on a non-exclusive basis to distribute its products within the territory. The Distributor shall not actively sell outside the territory without written consent.`),
        clause(2,'Targets & Contract Value',`The estimated annual purchase value is ${CUR} ${VAL}, against agreed volume targets and a ${N('margin',12)}% distributor margin.`),
        clause(3,'Credit & Payment Terms',`A credit limit of ${N('creditDays',30)} days applies, secured by a bank guarantee. Title to goods passes on delivery.`),
        clause(4,'Term, Termination & Governing Law',`The term is ${N('termYears',2)} years, terminable on ${N('noticeDays',90)} days' written notice. ${ADJ} law governs.`),
      ]}),
    RL:()=>({ title:'RETAIL LISTING & SUPPLY AGREEMENT',
      recital:`This Retail Listing & Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Supplier") and ${CP} (the "Retailer") for the listing and supply of the Supplier's products into the Retailer's stores.`,
      clauses:[
        clause(1,'Listing & Range',`The Retailer shall list the agreed SKUs across ${N('stores',40)} stores, with planogram and shelf space per the trading terms in Annexure A.`),
        clause(2,'Trading Terms & Value',`The estimated annual supply value is ${CUR} ${VAL}, with a ${N('rebate',5)}% volume rebate and the agreed listing fees.`),
        clause(3,'Payment & Returns',`Payment falls due within ${N('payDays',60)} days of invoice. Short-dated or damaged stock is handled per the returns schedule.`),
        clause(4,'Compliance & Governing Law',`Products shall comply with ${SB?`${SB} labelling and Legal Metrology requirements`:'applicable labelling and weights-and-measures requirements'}. ${LAW}`),
      ]}),
    MK:()=>({ title:'MARKETING & TRADE PROMOTION SERVICES AGREEMENT',
      recital:`This Marketing Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Agency") for ${T('services','e.g. creative, media and activation')} services.`,
      clauses:[
        clause(1,'Scope of Services',`The Agency shall provide the services in accordance with approved campaign briefs and the Client's annual marketing calendar.`),
        clause(2,'Fees & Contract Value',`The annual retainer / working budget is ${CUR} ${VAL}, billed ${T('billing','e.g. monthly')}, exclusive of VAT and third-party pass-through costs.`),
        clause(3,'Approvals & Media',`All spend and creative require the Client's prior written approval. Any media rebates or volume bonuses are passed back to the Client in full.`),
        clause(4,'IP, Confidentiality & Governing Law',`All work product and campaign intellectual property vest in the Client upon payment. ${LAW}`),
      ]}),
    ND:()=>({ title:'MUTUAL NON-DISCLOSURE AGREEMENT',
      recital:`This Mutual Non-Disclosure Agreement is entered into on ${D('effDate')} between <strong>${FIRST_PARTY}</strong>, a company incorporated in ${INC}, and ${CP}, collectively the "Parties".`,
      clauses:[
        clause(1,'Purpose',`The Parties wish to explore a potential business relationship and, in connection therewith, may disclose confidential and proprietary information. No monetary consideration passes under this Agreement; the mutual exchange of Confidential Information constitutes sufficient consideration.`),
        clause(2,'Confidential Information',`"Confidential Information" means all non-public information disclosed by one Party to the other, including recipes, specifications, commercial terms, pricing and customer data.`),
        clause(3,'Term',`This Agreement shall remain in force for ${N('termYears',3)} years from the effective date, unless terminated earlier by written notice to the other Party's registered office.`),
        clause(4,'Governing Law',`This Agreement is governed by the laws of ${INC}, and the Parties submit to the exclusive jurisdiction of ${FORUM}.`),
      ]}),
    LE:()=>({ title:'COMMERCIAL PROPERTY LEASE AGREEMENT',
      recital:`This Lease is made on ${D('effDate')} between ${CP} (the "Landlord") and <strong>${FIRST_PARTY}</strong> (the "Tenant") in respect of commercial premises situated at ${T('premises',EG('premises'))}.`,
      clauses:[
        clause(1,'Demised Premises',`The Landlord leases to the Tenant premises measuring ${N('sqm',420)} square metres, together with shared access to power, water and secure parking.`),
        clause(2,'Rent',`The Tenant shall pay monthly rent of ${CUR} ${VAL}, in advance on or before the 5th day of each month, exclusive of VAT${TAX?` at the prevailing ${TAX} rate`:''}.`),
        clause(3,'Term & Deposit',`The lease term is ${N('termYears',6)} years, secured by a deposit of ${M('deposit',0,`deposit ${CUR}`)} held against dilapidations and refundable per clause 7.`),
        clause(4,'Governing Law',LEASELAW),
      ]}),
    PS:()=>({ title:'PROFESSIONAL SERVICES AGREEMENT',
      recital:`This Professional Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Adviser") for ${T('services','e.g. statutory audit / legal advisory')} services.`,
      clauses:[
        clause(1,'Scope of Engagement',`The Adviser shall provide the professional services described in the engagement letter / Annexure A with reasonable skill and care.`),
        clause(2,'Fees & Contract Value',`The fees for the engagement are ${CUR} ${VAL}, billed ${T('billing','e.g. on milestones')}, exclusive of VAT and disbursements.`),
        clause(3,'Standard & Independence',`The services shall be performed to professional standards and, where regulated, in line with ${PROF?`${PROF} requirements and `:''}applicable independence rules.`),
        clause(4,'Liability, Confidentiality & Governing Law',`The Adviser's liability is capped at the fees paid, save for negligence or wilful default. ${LAW}`),
      ]}),
  };
  const built=(BUILD[c.template]||BUILD.ND)();
  const title=built.title, recital=built.recital, clauses=built.clauses;
  /* One head for every body this tab draws — see docPaperHeadHtml. The
     template's own `title` is kept as the fallback for a contract with no name
     of its own; the record's name is what the rest of the product calls this
     agreement, so it leads. */
  return `
    ${docPaperHeadHtml({...c, name:(c.name||title)},{note:t.kind})}
    <p class="text-[13px] leading-[1.7] mb-6 px-2 -mx-2 py-1" style="color:var(--color-doc-text)" data-anchor="recital">${recital}</p>
    ${clauses.join('')}
    ${signatureBlock(c)}`;
}
/* Which template, and which VERSION of it, this contract was generated from.
   Worth surfacing because a template can be edited afterwards and this contract
   will NOT change — so "Raw Mats v3" is the only thing that answers "which
   wording is this?" once the template has moved on. Says so explicitly, and
   flags when the template has since been revised. */
function templateProvenanceHtml(c){
  const tid=c.templateId||c.templateRef;
  if(!tid || !window.customTemplates) return '';
  const name=c.templateName||'';
  const v=Number(c.templateVersion||0);
  const live=customTemplates().find(t=>t.id===tid);
  const liveV=live?templateVersionNo(live):0;
  const label=`${(live?live.name:name)||'a template'}${v?` v${v}`:''}`;
  const moved=live && v && liveV>v;
  const esc=x=>String(x||'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  /* A CARD IN THE COLUMN, not a band over the sheet. The 660px width and the
     auto margins were centring it on the paper it sat above; here it takes the
     column's width and wears the column's shape. */
  return `<div style="display:flex;align-items:flex-start;gap:7px;font-size:11px;line-height:1.5;color:var(--color-neutral-700);border:1px solid var(--color-divider);background:var(--color-surface);box-shadow:0 1px 2px rgba(15,23,42,.05);border-radius:12px;padding:10px 13px">
    <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('copy','w-3.5 h-3.5')}</span>
    <span>${i18t('ct_created_from')} <b>${esc(label)}</b>.${moved
      ? ` That template has since been revised — it is now <b>v${liveV}</b>. <b>${i18t('ct_keeps_wording')}</b>; editing a template never changes a contract already made from it.`
      : ` Editing the template later does not change this contract — its wording was copied at creation.`}${
      !live ? ` <span style="color:var(--color-neutral-500)">${i18t('ct_template_deleted')}</span>` : ''}</span>
  </div>`;
}

/* Migrated paper: signed before it reached HaTi, so there is no signature to
   show and no electronic-signature law to cite. Naming the person who ran the
   import would put a party on the contract who never agreed to it — say plainly
   what happened instead, and show the evidence that does exist: the stored
   file's own fingerprint. */
function externalExecutionBlock(c){
  const m=c.migration||{}, u=c.upload||{};
  const filedBy=m.importedBy||((c.audit||[]).find(a=>a.action==='Migrated')||{}).user||'—';
  const filedAt=m.importedAt?fmtDT(m.importedAt):(((c.audit||[]).find(a=>a.action==='Migrated')||{}).at?fmtDT((c.audit||[]).find(a=>a.action==='Migrated').at):'—');
  const cell=(k,v,sub)=>`<div class="rounded-lg bg-white border border-brand-100 p-2.5">
    <div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1">${k}</div>
    <div class="font-medium text-brand-700">${v}</div>${sub?`<div class="text-[10px] text-brand-800/65 leading-snug">${sub}</div>`:''}</div>`;
  return `
    <div class="seal-in mt-8 rounded-2xl elev-3 bg-gradient-to-br from-brand-50 to-white p-6">
      <div class="flex items-start gap-4">
        <svg class="seal-pop shrink-0" width="62" height="62" viewBox="0 0 96 96" style="filter:drop-shadow(0 6px 14px rgba(40,50,70,.16))">
          <circle cx="48" cy="48" r="46" fill="#fff"/>
          <circle cx="48" cy="48" r="46" fill="none" style="stroke:var(--color-accent)" stroke-width="2"/>
          <circle cx="48" cy="48" r="38" fill="color-mix(in srgb,var(--color-accent) 11%,transparent)" stroke="#8fa8c2" stroke-width="1.5"/>
          <text x="48" y="45" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12.5" fill="#3f6087">${i18t('ct_on_file')}</text>
          <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" style="fill:var(--color-accent)">${i18t('ct_migrated')}</text>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2"><span class="font-display font-700 text-[17px] text-ink">${i18t('ct_executed_outside_hati')}</span>${statusChip('Signed')}</div>
          <div class="mt-1 text-xs text-brand-800/60">${i18t('ct_signed_before_migration')} <strong>${i18t('ct_no_esig_here')}</strong> ${i18t('ct_sigs_on_original')}</div>
          <div class="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
            ${cell('Filed into HaTi by', filedBy, filedAt)}
            ${cell('Executed on (as recorded)', c.signedAt||'—', 'from the migrated record, not verified by HaTi')}
          </div>
          <div class="mt-3 rounded-lg bg-brand-900 p-3 font-mono text-[11px] leading-relaxed">
            <div class="flex items-center gap-1.5 text-gold-400 mb-1">${icon('hash','w-3 h-3')} ORIGINAL FILE FINGERPRINT (SHA-256)</div>
            <div class="text-brand-100 break-all">${u.fileHash||'—'}</div>
            <div class="text-brand-300 mt-1.5">${u.fileName||'original document'}</div>
          </div>
          <div class="mt-2 text-[10px] text-brand-800/60 leading-snug">For a migrated contract this fingerprint is the evidence of record — it proves the stored file has not changed since it was filed. It is not a signature and identifies no signer.</div>
        </div>
      </div>
    </div>`;
}
function signatureBlock(c){
  const locked=c.status==='Signed';
  if(locked && isExternallyExecuted(c)) return externalExecutionBlock(c);
  if(locked){
    const hashDisplay=c.hash&&c.hash!=='PRE-SEEDED'?c.hash:('sample-'+generatePseudo(c.id).slice(0,32));
    const sigs=(c.signatures||[]);
    const partyLabel=s=> s.party==='counterparty'?'Counterparty' : s.party==='first'?'First party' : (s.role||'Signer');
    /* The face of a signed document carries WHO signed, HOW, and WHEN. The
       signer's IP address and browser are evidence about the act, not part of
       the agreement, and they are on the document face where every reader —
       and every exported PDF, screenshot and forwarded copy — carries them.
       They are still captured, and they still appear in the audit trail and in
       the downloadable evidence pack, which is where evidence belongs.
       (Display-only: nothing about the sealed content moves. See F5.) */
    const sub=s=>`<div class="text-[10px] text-brand-800/65 font-normal leading-snug">${[s.email,s.form?s.form+' signature':s.method,s.at?fmtDT(s.at):''].filter(Boolean).join(' · ')}</div>`;
    const card=s=>`<div class="rounded-lg bg-white border border-brand-100 p-2.5">
      <div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">${icon(s.party==='counterparty'?'users':'finger','w-3 h-3')} ${partyLabel(s)}</div>
      ${s.image?`<img src="${s.image}" alt="signature of ${(s.name||'').replace(/"/g,'')}" style="height:40px;max-width:190px;object-fit:contain;margin:2px 0 5px"/>`:''}
      <div class="font-medium text-brand-700">${(s.name||'').replace(/</g,'&lt;')}${signatureCapacity(s)?', '+signatureCapacity(s).replace(/</g,'&lt;'):''}</div>${sub(s)}</div>`;
    const sigList = sigs.length ? sigs.map(card).join('')
      : `<div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/60 text-xs">${c.signatory?('Signed by '+c.signatory):'Not recorded'}</div></div>`;
    return `
    <div class="seal-in mt-8 rounded-2xl elev-3 bg-gradient-to-br from-brand-50 to-white p-6">
      <div class="flex items-start gap-4">
        <svg class="seal-pop shrink-0" width="62" height="62" viewBox="0 0 96 96" style="filter:drop-shadow(0 6px 14px rgba(60,40,10,.18))">
          <circle cx="48" cy="48" r="46" fill="#fff"/>
          <circle cx="48" cy="48" r="46" fill="none" stroke="#086B54" stroke-width="2"/>
          <circle cx="48" cy="48" r="38" fill="rgba(8,107,84,.10)" stroke="#C79A3E" stroke-width="1.5"/>
          <text x="48" y="45" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12.5" style="fill:var(--st-green-dot)">${i18t('ct_sealed')}</text>
          <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" style="fill:var(--st-green-fg)">SHA-256</text>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 warm-flip"><span class="font-display font-700 text-[17px] text-ink">${i18t('ct_executed_sealed_caps')}</span>${statusChip('Signed')}</div>
          <div class="mt-1 text-xs text-brand-800/60">${(c.execution&&c.execution.esignature)||jxEsignatureShort()}</div>
          <div class="mt-3 grid sm:grid-cols-2 gap-3 text-xs">${sigList}</div>
          ${!isUpload(c)?`<div class="mt-3 rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1">${i18t('ct_sealed_fingerprint')}</div><div class="font-mono text-[10px] break-all text-brand-700">${c.execution?.textHash||'—'}</div></div>`:''}
          <div class="mt-3 rounded-lg bg-brand-900 p-3 font-mono text-[11px] leading-relaxed">
            <div class="flex items-center gap-1.5 text-gold-400 mb-1">${icon('hash','w-3 h-3')} ${i18t('ct_document_seal')}</div>
            <div class="text-brand-100 break-all">${hashDisplay}</div>
            <div class="text-brand-300 mt-1.5">${c.signedAt||'Timestamp recorded'}</div>
          </div>
          <div class="mt-2 text-[10px] text-brand-800/60 leading-snug">Signer identity is verified by account session (first party) and email one-time code (counterparty). Government IPRS identity and CAK-accredited PKI are on the roadmap and not yet active.</div>
        </div>
      </div>
    </div>`;
  }
  /* PARTIALLY SIGNED: the marks already taken are part of the document's
     face. A counterparty opening a copy the owner signed first used to see
     the bare "pending execution" placeholder — nothing anywhere said a
     signature was already on it (field report, 02 Aug 2026). The recorded
     marks render here exactly as they will on the executed face; the seal
     still only applies when every party has signed. */
  const sofar=(c.signatures||[]);
  if(sofar.length){
    const partyLabel=s=> s.party==='counterparty'?'Counterparty' : s.party==='first'?'First party' : (s.role||'Signer');
    const cap=s=>(window.signatureCapacity?signatureCapacity(s):(s.title||''))||'';
    const card=s=>`<div class="rounded-lg bg-white border border-brand-100 p-2.5">
      <div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1">${partyLabel(s)}</div>
      ${s.image?`<img src="${s.image}" alt="signature of ${(s.name||'').replace(/"/g,'')}" style="height:40px;max-width:190px;object-fit:contain;margin:2px 0 5px"/>`:''}
      <div class="font-medium text-brand-700">${(s.name||'').replace(/</g,'&lt;')}${cap(s)?', '+cap(s).replace(/</g,'&lt;'):''}</div>
      <div class="text-[10px] text-brand-800/65 font-normal leading-snug">${[s.email,s.form?s.form+' signature':s.method,s.at?fmtDT(s.at):''].filter(Boolean).join(' · ')}</div></div>`;
    return `
    <div class="mt-8 rounded-xl border border-brand-200 bg-brand-50/30 p-5" data-anchor="sig">
      <div class="flex items-center gap-2"><span class="text-sm font-semibold text-brand-800/80">${i18t('ct_sigs_so_far')}</span>
        <span class="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-gold-50 text-gold-700">partially signed</span></div>
      <div class="text-xs text-brand-800/65 mt-0.5 mb-3">The marks below are already on this contract. It is not yet fully executed — the seal is applied when every party has signed.</div>
      <div class="grid sm:grid-cols-2 gap-3 text-xs">${sofar.map(card).join('')}</div>
    </div>`;
  }
  /* ---- AN UNSIGNED CONTRACT ENDS THE WAY PAPER ENDS ----
     This was a dashed box with an icon in it reading "signature block pending",
     which is a note about the software printed at the foot of an agreement. It
     is two ruled lines and the parties' names now (Young, 10 Aug 2026) — the
     shape every contract anybody has ever signed has — built by the same
     rlPaperFootHtml the workbench, the counterparty's page and the phone use,
     so one contract ends the same way on every screen it is read on.

     STILL NOT A SIGNING SURFACE. Nothing here is pressable and nothing is
     stamped: signing is the Signing tab's job, behind its own record and its
     own seal. The anchor is kept, because the room scrolls to it by name. */
  const foot=window.rlPaperFootHtml?rlPaperFootHtml(c):'';
  if(foot) return `<div data-anchor="sig">${foot}</div>`;
  /* No parties named yet — a contract with nothing to rule a line for. Say so
     in a sentence rather than printing two empty rules. */
  return `
    <div class="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-5 text-center" data-anchor="sig">
      <div class="text-sm font-medium text-brand-800/70">${i18t('ct_sig_block_pending')}</div>
      <div class="text-xs text-brand-800/65 mt-0.5">${i18t('ct_confirm_intent_panel')}</div>
    </div>`;
}
function frozenDocBody(c){
  // A frozen body that was rich at signing is sanitised again here, at render,
  // because this same markup is served to the counterparty portal with no
  // login. Sanitising is idempotent, so the sealed fragment survives it intact
  // — and a fragment that reached storage some other way still cannot execute.
  // A pre-rich frozen body is left exactly as it is: it was produced from
  // escaped text by freezeContractHtml, and its classes are not on the rich
  // allowlist, so passing it through the sanitiser would change how a SEALED
  // contract looks. That is not allowed.
  const html = (window.isRich && isRich(c.execution.format))
    ? `<div class="hati-doc" data-anchor="redline">${sanitizeRich(c.execution.html)}</div>`
    : c.execution.html;
  return `${html}${signatureBlock(c)}`;
}

/* One clear next action per lifecycle stage — drives the sticky bar at the top
   of the open contract so the single most useful verb is never buried in the
   rich workspace. Returns {label, ic, guide, kind} or null. */
function wsNextAction(c){
  if(c.status==='Signed') return { get label(){ return i18t('ct_evidence_pack'); }, ic:'download', guide:'Executed &amp; sealed.', kind:'evidence' };
  if(c.status==='Declined') return null;
  if(!canEdit()) return null;
  const hasTerms=c.counterparty&&(!isMonetary(c)||Number(c.value)>0);
  const appr=(window.approvalState?approvalState(c):{ok:true});
  /* THE OTHER SIDE IS WAITING ON YOU, and that outranks everything below.

     This bar used to answer "what is the next step for a contract at this
     status", which stops being the right question the moment a counterparty
     sends something back. A contract whose status is still Draft carried on
     saying "Key terms are set — move it into review" with a returned-changes
     banner sitting directly above it saying the opposite. Two primary buttons,
     two different next steps, one screen. The one that is actually urgent is
     the one somebody else is waiting on. */
  const openRds=(c.rounds||[]).filter(r=>r&&r.status==='open').length;
  const pendingCh=(Array.isArray(c.changes)?c.changes:[])
    .filter(x=>x&&x.status==='pending'&&x.authorSide==='counterparty').length;
  if(openRds||pendingCh){
    const n=openRds||pendingCh;
    return { get label(){ return i18t('ct_review_changes'); }, ic:'history', kind:'review-changes',
      guide:`${c.counterparty||'The counterparty'} is waiting on you — ${n} ${openRds?`round${n===1?'':'s'}`:`change${n===1?'':'s'}`} to decide.` };
  }
  /* THEY HAVE SIGNED AND WE HAVE NOT, and nothing on this page said so.

     Walked end to end: the counterparty opens the signing link, adopts a mark,
     signs. Their signature is filed, the audit trail records it and the share
     shows "Signed" — and the owner's page went on reading "Key terms are set —
     move it into review", with a button offering to do something the contract
     passed three rounds ago. The one act left in the entire deal is her
     signature, and the screen never mentioned it. */
  const cpSigned=(Array.isArray(c.signatures)?c.signatures:[])
    .some(s=>s && s.party==='counterparty');
  const weSigned=(Array.isArray(c.signatures)?c.signatures:[])
    .some(s=>s && s.party!=='counterparty');
  if(cpSigned && !weSigned && !(c.execution&&c.execution.at)){
    const who=(c.signatures.find(s=>s.party==='counterparty')||{}).name||c.counterparty||'The counterparty';
    return { get label(){ return i18t('ct_sign'); }, ic:'finger', kind:c.compliance&&c.compliance.consent?'sign':'sign-scroll',
      guide:`${who} has signed. Your signature is the only thing left.` };
  }
  if(c.status==='Draft'){
    if(!hasTerms) return { get label(){ return i18t('ct_complete_key_terms'); }, ic:'pencil', guide:'Add the counterparty and value to move this forward.', kind:'terms' };
    /* ---- READ IT BEFORE YOU SEND IT ----
       The rung between "the facts are in" and "send it out" was missing, so a
       draft went straight from Key terms to the counterparty with nothing
       having looked at the wording. The checks are the one thing on this
       platform that reads the paper, and they are one press away; the ladder
       now stops here until they have run. Once they have, it moves on — this
       is a rung, not a gate, and Share is still in the head throughout. */
    if(window.checkVerdict && !checkVerdict(c,'risk') && !checkVerdict(c,'playbook'))
      return { get label(){ return i18t('ct_read_through_checks'); }, ic:'scan', kind:'checks',
        guide:'The facts are in. Read the wording and run the checks before it goes out.' };
    return { get label(){ return i18t('ct_send_for_review'); }, ic:'check2', guide:'Key terms are set and the checks have run — move it into review.', kind:'review' };
  }
  /* A LIVE NEGOTIATION IS NOT "READY TO SIGN".

     Everything below this point answers for a contract sitting in review with
     nothing outstanding. Sending the draft out now moves the status, which is
     right — but it also dropped the bar straight onto "Approved and ready —
     apply the sealed signature" while the two sides were still three rounds
     from agreeing. Offering the seal in the middle of an argument is worse
     than saying nothing. Say whose move it is instead. */
  const liveChanges=(Array.isArray(c.changes)?c.changes:[])
    .filter(x=>x && x.status!=='superseded');
  const notSettled=liveChanges.some(x=>x.status==='pending'
    || (x.status==='rejected' && !x.withdrawn));
  const theirTurn=(window.negoTurn ? negoTurn(c)==='counterparty'
    : !!(c.negotiation && c.negotiation.turn==='counterparty'));
  if(!cpSigned && (notSettled || theirTurn)){
    const who=c.counterparty||'the counterparty';
    const mine=liveChanges.filter(x=>x.status==='pending').length;
    return theirTurn
      ? { get label(){ return i18t('ct_open_negotiation'); }, ic:'history', kind:'review-changes',
          guide:`It is with ${who}. Nothing needs you until they answer.` }
      : { get label(){ return i18t('ct_open_negotiation'); }, ic:'history', kind:'review-changes',
          guide:`Your turn — ${mine||'some'} change${mine===1?'':'s'} still open with ${who}.` };
  }
  // Under Review
  if(!appr.ok) return { get label(){ return i18t('ct_send_to_cp'); }, ic:'share', get guide(){ return i18t('ct_share_draft_guide'); }, kind:'share' };
  /* ---- NO BUTTON FOR "GO AND FIND THE REAL BUTTON" ----
     U-8 gave this state a primary reading "Review & sign below", on the sound
     reasoning that labelling it "Sign" was a false promise: the click only
     scrolled to the consent box. But the honest label gave away what the
     control was — a button whose whole job is to point at another button, in
     the most prominent slot on the page, beside Share and Draft new agreement.
     Removed (Young, 10 Aug 2026).

     THE GUIDE STAYS. `noButton` keeps this branch answering the question the
     status line asks — what is the next step — while the head draws nothing.
     Returning null instead would have been the smaller edit and the wrong one:
     the line would fall back to "All key terms are set", which is true, useless
     and says nothing about the signature that is actually outstanding. */
  if(!c.compliance.consent) return { get label(){ return i18t('ct_review_sign_below'); }, ic:'finger',
    guide:'Approved — confirm intent-to-sign on the Signing tab, then sign.', kind:'sign-scroll', noButton:true };
  return { get label(){ return i18t('ct_sign'); }, ic:'finger', guide:'Approved and ready — apply the sealed signature.', kind:'sign' };
}

/* The status strip under the document header. Split out so filling in the key
   terms can refresh the guidance and the primary button in place, without
   re-rendering the workspace under the cursor. */
/* ---- THE QUIET LINE UNDER THE TABS ----
   ONE line, and no button on it that the head already carries. The next-action
   button moved up into roomHeadHtml — it is the contract's primary act and it
   belongs beside the contract's name — so what is left here is the sentence
   that says WHY, plus, on the Document tab, the one secondary the prototype
   gives it: the way over to Negotiate.

   Before this there were two bars: this one with its own copy of the primary,
   and a second inside the document pane repeating the reading rule. Two
   explanatory strips above a document is one more than a document needs. */
function actionBarHtml(c){
  const locked=c.status==='Signed';
  const line=t=>`<span style="font-size:12px;color:var(--color-neutral-700)">${t}</span>`;
  /* ---- NO SECOND NEXT-STEP BUTTON ON THIS STRIP ----
     "Go to Negotiate →" lived here. It was a THIRD control claiming to say
     what happens next, next to the head's own primary and the right column's
     "Next: Signing" — three answers, one screen, and only the head's read the
     contract's state at all. Worse, this strip is painted once per render and
     did not repaint on a tab change, so the Document tab's sentence AND its
     button followed the reader onto Key terms, Signing and History: you could
     stand on Key terms being told to go to Negotiate by a bar describing a tab
     you had left. The button is gone and the strip repaints — see
     applyWsTabs. What is left here is the sentence that says WHY. */
  const tail='';
  /* ---- THE DOCUMENT TAB SAYS NOTHING HERE AT ALL ----
     This strip carried a status chip and a sentence — "the contract as it
     stands, a clean read, proposed wording lives on the Negotiate tab" — as a
     full-width band directly above the agreement. Asked for its removal
     (Young, 10 Aug 2026): "open this space up for the contract exclusively."

     Nothing is lost. The status is a chip beside the contract's name, two
     lines up, on every tab. The sentence described the READING RULE, which the
     page now demonstrates rather than announces: there are no marks on it. And
     the door it pointed at is a button on the tab row, at the right of the
     screen, where the reader will find it without a paragraph.

     The other tabs keep the strip. On Key terms, Signing and History it is not
     a description of the page, it is the contract's next step — which is what
     this strip is for and why it repaints per tab (see applyWsTabs). */
  if(_wsTab==='docs') return '';
  if(locked) return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--st-green-bg);color:var(--st-green-fg)"><span style="width:6px;height:6px;border-radius:50%;background:var(--st-green-dot)"></span>${i18t('ct_executed_sealed')}</span>${line('Executed &amp; sealed. This document is locked and fields are read-only.')}`;
  if(!canEdit()) return `${statusChip(c.status)}${line('You have viewer access — the document is read-only for your role.')}${tail}`;
  /* On the Document tab the sentence is about READING, because that is what
     this tab is now for; the status guidance is on every other tab, where a
     next step is what the reader came for. */
  if(_wsTab==='docs'&&!docFillable(c))
    return `${statusChip(c.status)}${line(i18t('ct_clean_read'))}${tail}`;
  if(_wsTab==='docs'&&docFillable(c))
    return `${statusChip(c.status)}${line('This draft still has blanks — fill the highlighted fields below. Once it goes for review, wording changes happen on <b>Negotiate</b>.')}${tail}`;
  const na=wsNextAction(c);
  return `${statusChip(c.status)}${line(na?na.guide:'All key terms are set.')}`;
}
function renderActionBar(c){
  const host=document.getElementById('ws-actionbar'); if(!host) return;
  host.innerHTML=actionBarHtml(c);
  wireActionBar(c);
}
function wireActionBar(c){
  /* ws-to-nego is NOT wired here. It moved onto the tab row (see
     roomTabsHtml's row in renderWorkspace) and is wired with it — this
     function runs again on every tab change, and the tab row is not redrawn
     by one, so binding it here would stack a handler per tab press. */
  document.getElementById('ws-evidence')?.addEventListener('click',()=>downloadEvidence(c));
  document.getElementById('ws-next-action')?.addEventListener('click',e=>{
    const kind=e.currentTarget.getAttribute('data-na');
    if(kind==='evidence'){ downloadEvidence(c); return; }
    /* Deliberately the same code path as the returned-changes strip's own
       button: two ways to reach one thing, never two things that can drift. */
    if(kind==='review-changes'){
      const strip=document.getElementById('changes-review');
      if(strip){ strip.click(); return; }
      /* Changes that arrived as tracked items rather than as a round have no
         strip to borrow — the workbench is where they are decided. */
      if(window.openRedlineWorkbench) openRedlineWorkbench(c.id); return;
    }
    if(kind==='share'){ openShareModal(c); return; }
    if(kind==='terms'){ focusKeyTerms(c); return; }
    /* The reading rung: put the document in front of them and open the Checks
       card's own panel, rather than leaving "run the checks" as an instruction
       to go and find something. */
    if(kind==='checks'){
      roomGoTab(c,'docs');
      setTimeout(()=>{
        const card=document.getElementById('checks-card');
        if(card){ card.scrollIntoView({behavior:'smooth',block:'center'});
          card.classList.add('anchor-flash'); setTimeout(()=>card.classList.remove('anchor-flash'),1800); }
      },160);
      return;
    }
    if(kind==='review'){
      if(c.status==='Draft'){ c.status='Under Review'; c.lastAction=todayStr(); logAudit(c,'Status changed','Draft → Under Review (sent for review)'); persist(c); updateStatusUI(c); renderWorkspace(); toast(i18t('ct_moved_to_review')); }
      return;
    }
    if(kind==='sign-scroll'){
      /* The consent box is on the SIGNING tab. Scrolling to it without going
         there first scrolled a pane nobody was looking at, and the toast then
         asked for a tick on a box that was not on screen. */
      roomGoTab(c,'sign');
      setTimeout(()=>{
        const sw=document.getElementById('sign-wrap'); if(sw) sw.scrollIntoView({behavior:'smooth',block:'center'});
        const box=document.querySelector('[data-comp="consent"]'); if(box){ const card=box.closest('label'); if(card){ card.classList.add('anchor-flash'); setTimeout(()=>card.classList.remove('anchor-flash'),1800); } }
      },160);
      toast(i18t('ct_tick_then_sign'));
      return;
    }
    /* SIGN WHERE THE SIGNING IS. This signed from wherever the reader happened
       to be standing — Key terms, History — so the one irreversible act in the
       product happened on a tab that shows none of it: no signature panel, no
       block filling in, no seal. Land on Signing first, then sign, so the
       result is in front of the person who caused it. Already there? Sign at
       once; a tab switch to the tab you are on is a flicker for nothing. */
    if(kind==='sign'){
      if(_wsTab==='sign'){ signDocument(c); return; }
      roomGoTab(c,'sign');
      setTimeout(()=>signDocument(c),180);
      return;
    }
  });
}
/* "Complete key terms" — put the cursor where the terms can actually be typed.
   That is the Key terms TAB now, not a panel behind a sub-tab on the right:
   the Document tab is a clean read and carries no fields of its own. */
function focusKeyTerms(c){
  roomGoTab(c,'terms');
  setTimeout(()=>{
    const panel=document.querySelector('[data-kt="counterparty"]');
    if(!panel){ toast(i18t('ct_no_editable_terms'),'err'); return; }
    panel.focus(); panel.select&&panel.select();
  },250);
}

/* ---- Document workspace right-panel: two tabs (Screening | Signing) --------
   Screening (default while a contract is in progress) stacks Playbook review →
   Insert clause → Copilot Contract Scan, with a "Next: Signing" button. Signing
   (default once executed) shows read-only Key terms on top and a card with
   four inner tabs: Activity · Terms · Audit · Signing. Tab choices persist
   across re-renders of the same contract, and reset when a different contract
   opens. */
let _docTopTab='screening';                 // 'screening' (= Draft & Review) | 'signing'
let _docInnerTab='signing';                 // Signing tab inner: 'signing' | 'audit'
let _docTabsFor=null;                        // contract id the choices belong to
/* Two inner tabs, not three: the per-contract Obligations surface was
   retired as premature — obligations still exist as data (the Calendar and
   Home count and complete them), but a dedicated tab per contract was more
   cockpit than this stage of the product needs. */
const DOC_INNER_TABS=['signing','audit'];
function docTabDefaults(c){
  if(_docTabsFor!==c.id){                    // first open of this contract → sensible defaults
    _docTopTab = (c.status==='Signed') ? 'signing' : 'screening';
    _docInnerTab = 'signing';
    _docTabsFor = c.id;
  }
}
/* ---- Workspace-level tabs: Docs · Negotiate (internal key 'redline') ------
   A sibling of the Docs view, not a card inside it. The redline needs the full
   width of the window — the document whole, with the changes and the
   discussion beside it — and the right-hand panel here is a third of the
   screen, so it could never have lived in it.

   Which is why only ONE of these two is a pane. Docs is; Redline is a door to
   the workbench at view-redline, and it snaps back to Docs on the way through
   so that coming back lands on the document rather than on a tab pointing
   somewhere the reader has left. The choice resets when a different contract
   opens. */
let _wsTab='docs';                           // see ROOM_TABS
let _wsTabFor=null;
/* A tab chosen from the WORKBENCH, which is a different view. Pressing "Key
   terms" over there has to come back here first, and the arrival must land on
   the tab that was pressed rather than on the default. Honoured once, then
   cleared, so it cannot leak into the next contract. */
let _wsTabWant=null;
/* ---- A CONTRACT YOU HAVE JUST DRAFTED OPENS ON KEY TERMS ----
   Asked for directly (Young, 09 Aug 2026): "when you draft a contract it does
   not land you to document but rather lands you to Key terms first."

   It is the right order of work. A new draft's document is a template with
   blanks in it, and the blanks are filled from the terms — value, dates,
   parties, governing law. Landing on the document shows somebody the OUTPUT of
   a form they have not filled in yet, which reads as a half-finished contract
   rather than as a step they have not taken.

   ONCE, AND ONLY FOR A DRAFT. The id is consumed on first arrival, so going
   back to the contract later behaves exactly as it always has — this is about
   where a NEW contract opens, not a permanent change to the room's default.
   And it is checked against the live status rather than against the moment of
   creation: an uploaded agreement that is already executed has no terms to fill
   and belongs on its document.

   Registered by every path that creates a contract — the wizard, both template
   routes, the clause library, the uploader and the migration importer — because
   there is no single funnel for creation the way negoFileChange is for changes,
   and a flag set in one of them is a flag the other five never set. */
const _wsNewDrafts=new Set();
function roomOpenOnTerms(id){ if(id) _wsNewDrafts.add(String(id)); }
/* Which tab the room has settled on. `_wsTab` is a module-level `let`, so
   nothing outside this file can read it — which made the landing rule above
   untestable and, worse, unobservable from the workbench. One reader, no
   setter: changing the tab still goes through roomGoTab. */
function roomCurrentTab(){ return _wsTab; }
function wsTabDefaults(c){
  if(_wsTabFor!==c.id){
    const fresh=_wsNewDrafts.delete(String(c.id));
    _wsTab=(fresh && c.status==='Draft')?'terms':'docs';
    _wsTabFor=c.id;
    if(window.negoResetView) negoResetView();   // don't open on another contract's fingerprint
  }
  if(_wsTabWant){ _wsTab=_wsTabWant; _wsTabWant=null; }
}

/* ---- THE ROOM'S TAB ROW — ONE BUILDER, BOTH SHELLS ----
   The Docs page and the negotiation workbench are two VIEWS drawing one room,
   and each used to render its own [Docs][Negotiate] switcher in its own
   markup. Two tab rows for one room is how they drift apart. There is one
   builder now and renderRedline calls it too, so a tab added here appears on
   both without anyone having to remember the second place.

   FIVE TABS, AND NOTHING NEW BEHIND THEM. Key terms, Signing and History were
   already in the room — key terms and signing behind a pair of sub-tabs on the
   right-hand panel, history behind a button that opened a modal. Being three
   clicks and a dialog deep is not the same as not existing, but it reads that
   way. They are tabs now. */
/* THE TABS READ IN THE ORDER THE WORK HAPPENS.

   They used to read Document · Negotiate · Key terms · Signing · History,
   which is not the order anything is done in: Key terms sat third and has to
   be filled in FIRST — a contract with no counterparty and no value cannot be
   read for sense, cannot be sent, and cannot be signed. A reader following the
   row left to right was being walked past the one thing blocking them.

   Now: agree the facts, read the paper, argue the wording, sign it. History is
   a record rather than a step, so it stays at the end.

   The KEYS are untouched — 'docs', 'redline', 'terms', 'sign', 'history' —
   because stored state, saved links and every route are built on them. Only
   the order of the row moved. Opening a contract still LANDS on Document: you
   opened it to look at it, and the next-step button says where to go from
   there. */
/* The second entry is a DICTIONARY KEY, not a label: this row is drawn by both
   the workspace view and the redline view, and on the phone, so translating it
   here reaches every one of them. */
const ROOM_TABS=[
  ['terms','tab_key_terms'],['docs','tab_document'],['redline','tab_negotiate'],
  ['sign','tab_signing'],['history','tab_history'],
];
function roomTabsHtml(c,active){
  return `<div id="ws-tabs" class="room-tabs" role="tablist" aria-label="${i18t('tab_room_aria')}">${
    ROOM_TABS.map(([k,key])=>{
      const on=k===active;
      return `<button type="button" data-ws-tab="${k}" data-room-tab="${k}" role="tab" aria-selected="${on}" class="room-tab${on?' on':''}">${t(key)}${k==='redline'?negoTabCountHtml(c):''}</button>`;
    }).join('')}</div>`;
}
/* The count of changes on the tab itself, and WHOSE turn it is in its colour.
   Amber and filled while some of them wait on this reader; plain once they are
   all with the other side. A negotiation that needs an answer must not be
   discoverable only by clicking. */
function negoTabCountHtml(c){
  if(!window.negoProgress) return '';
  /* NARROWED FOR A REVIEWER, so the tab and the column it opens onto agree. A
     pill reading 3 over a stack of 2 is the same "pill that counts something
     other than the list it labels" fault redlineCardIds exists to prevent —
     and here the third number is a change they were deliberately not handed. */
  const mineOnly = (typeof window.reviewMyChangeIds==='function')
    ? (()=>{ try{ return reviewMyChangeIds(c); }catch(_){ return null; } })() : null;
  const p = mineOnly
    ? (typeof negoChanges==='function' ? negoChanges(c) : [])
        .filter(x=>x && mineOnly.has(String(x.id)) && x.status!=='superseded' && !x.withdrawn)
        .reduce((a,x)=>({ total:a.total+1, pending:a.pending+(x.status==='pending'?1:0) }), { total:0, pending:0 })
    : negoProgress(c);
  const total=p.total||0;
  if(!total) return '';
  const due=p.pending||0;
  return `<span id="nego-tab-count" class="rt-n${due?' due':''}" title="${due?due+' change'+(due===1?'':'s')+' waiting on a decision':total+' change'+(total===1?'':'s')+' on the table'}">${due||total}</span>`;
}
function applyWsTabs(c){
  const keys=ROOM_TABS.map(t=>t[0]);
  if(!keys.includes(_wsTab)) _wsTab='docs';
  const paint=k=>{
    document.querySelectorAll('[data-ws-pane]').forEach(p=>{
      const on=p.getAttribute('data-ws-pane')===k;
      p.style.display=on?(p.id==='doc-grid'?'grid':'flex'):'none';
    });
    document.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(b=>
      b.classList.toggle('on',b.getAttribute('data-ws-tab')===k));
  };
  paint(_wsTab);
  /* THE STRIP DESCRIBES THE TAB YOU ARE ON, so it is repainted when the tab
     changes. It was drawn once per workspace render, which meant whichever tab
     happened to be current at render time kept describing the room for as long
     as you stayed on the page. */
  if(typeof renderActionBar==='function') renderActionBar(c);
  /* AN EMPTY STRIP TAKES NO ROOM. The Document tab draws nothing here now, and
     an empty flex box still costs the column its own height and the 12px gap
     above it — which is the very space this was asked to give back to the
     contract.

     THE ATTRIBUTE MOVES WITH THE STYLE, or the hide does not survive. The
     collapse toggle restores every folding row to `data-ws-display` (see
     applyWsCollapse), which it reads as the row's OWN display — so leaving
     that saying "flex" while the style said "none" put the empty strip back
     the moment the header was unfolded, which is on the very next line of the
     render. */
  const _bar=document.getElementById('ws-actionbar');
  if(_bar){
    const _has=!!_bar.innerHTML.trim();
    _bar.setAttribute('data-ws-display',_has?'flex':'none');
    _bar.style.display=_has?'flex':'none';
  }
  /* ---- REDLINE IS A DOOR, NOT A PANE ----
     The redline needs the whole window — the document entire, with the changes
     and the discussion beside it — and the right-hand panel here is a third of
     the screen, so it could never have lived in it. It opens the REDLINE
     WORKBENCH at view-redline instead: the same engine, laid out as the design
     sets it.

     The tab snaps back to Document before it goes, so that coming BACK from
     the workbench lands on a page showing the document rather than on a tab
     pointing somewhere the reader is no longer standing. */
  if(_wsTab==='redline'){
    _wsTab='docs';
    paint('docs');
    /* Through openRedlineWorkbench, not by setting activeId and switching view
       here: that one function is where the previous occupant of the bench is
       taken off and put back in Drafting, and a second route in would skip it
       silently. */
    if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
    else toast(i18t('ct_workbench_unavailable'),'err');
    return;
  }
  if(_wsTab==='history') roomPaintHistory(c);
  if(_wsTab==='terms'){ renderKeyTermsSide(c); if(window.wireKtRows) wireKtRows(c); }
  /* The Document pane has just been given a width for the first time since it
     was hidden. Measure it NOW — see the note in layoutDocResizer about why it
     refuses to measure a hidden pane at all. */
  if(_wsTab==='docs'&&window.layoutDocResizer) layoutDocResizer();
}
/* The one router BOTH shells press. From the Docs page a tab is a pane swap;
   from the workbench every tab but Negotiate is a journey back to this view,
   which is why the wanted tab is parked rather than applied. */
function roomGoTab(c,k){
  if(!c) return;
  if(k==='redline'){
    if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
    else if(window.toast) toast(i18t('ct_workbench_unavailable'),'err');
    return;
  }
  if(state.view==='redline'){
    _wsTabWant=k;
    if(window.openWorkspace) openWorkspace(c.id);
    return;
  }
  _wsTab=k; _wsTabFor=c.id; applyWsTabs(c);
}
function wireWsTabs(c){
  document.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(b=>b.addEventListener('click',()=>
    roomGoTab(c,b.getAttribute('data-ws-tab'))));
  /* The one door off the Document tab rides on this row now, so it is wired
     with the row. It went through the ACTION BAR's wiring while it lived on
     that band — and that wiring runs again on every tab change, which would
     have stacked a second handler onto a button the tab change does not
     redraw. Through the room's own router, like every other tab press, so the
     landing rules (wsTabDefaults) apply however you arrived. */
  document.getElementById('ws-to-nego')?.addEventListener('click',()=>{
    if(window.roomGoTab) roomGoTab(c,'redline');
    else if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
  });
  applyWsTabs(c);
}
/* ============ KEY TERMS ============
   WHAT THE CONTRACT SAYS, AND WHAT IT COMMITS YOU TO.

   The mockup put three more rows on this panel — governing law, liability cap,
   payment terms — by typing them in. HaTi does not store them; they live in the
   wording. So they are shown when, and only when, the playbook review has
   actually READ them out of the document, each with the quote it read. Where it
   has not been run the panel says which rows are missing and offers to go and
   get them, which is more useful than a blank row and more honest than a
   plausible one. */
/* ---- READ FIRST, EDIT ON CLICK ----
   This panel was eight input boxes in a column. Every value — a company, a sum
   of money, two dates — was dressed identically, so nothing looked more
   important than anything else and the page shouted "form" where it should have
   read as a summary. A sum of money in a bordered box is not a fact; it is a
   task.

   Nothing looks like a field until you touch it. Values are plain text, right
   aligned, formatted the way the rest of HaTi formats them; clicking one turns
   THAT row — and only that row — into the field it always was. Everything is
   still editable and the inputs still carry data-kt, so every existing handler
   and every test presses exactly what it always pressed.

   STATUS HAS GONE FROM THE LIST. It is already a chip beside the contract's
   name on every tab; this was the third place it was said. */
/* The read-out for one row, so an edit can refresh just that row. */
function ktReadValue(c,key){
  const dash=`<span class="kt-none" data-kt-none="1">${i18t('ct_not_set')}</span>`;
  // Same instruction the panel's own date rows carry — see ktTermsRowsHtml.
  const day=v=>v?esc((window.fmtDocDate&&fmtDocDate(v))||v)
    :`<span class="kt-none" data-kt-none="1">${i18t('ct_pick_a_date')}</span>`;
  if(key==='counterparty') return c.counterparty?esc(c.counterparty):dash;
  if(key==='cpEmail') return c.counterpartyEmail?esc(c.counterpartyEmail):dash;
  if(key==='value') return `<span style="font-family:var(--font-mono)">${isMonetary(c)?(c.value?fmtMoney(c.value):dash):`<span class="kt-none">${i18t('ct_non_monetary')}</span>`}</span>`;
  if(key==='effDate') return day(c.fields&&c.fields.effDate);
  if(key==='expiry') return day(c.expiry);
  return '';
}
/* "Nothing here yet" vs "nothing to put here". Both render through .kt-none —
   an unfilled date says "Not set", a contract with no money on it says
   "Non-monetary" — and only the first is an invitation. The dashed prompt goes
   on the first alone, so a non-monetary contract is not nagged to price
   itself. */
/* A MARKER, NOT THE WORDS. This used to match the literal text "Not set", which
   stopped working the moment that text became translatable — and worse, it
   stopped working SILENTLY: the row simply lost its dashed invitation and
   nothing failed. Matching on copy a translator can change is the same fault
   whichever language it breaks in, so the empty read now carries data-kt-none
   and this looks for that. */
const ktIsEmptyRead = html => /data-kt-none="1"/.test(String(html));
/* ---- AN EMPTY ROW CARRIES THE MARK OF WHAT GOES IN IT ----
   Reported (Young, 10 Aug 2026): "it should be clear that the boxes are entry
   fields... you should clearly see you need to enter a date there." The box was
   already drawn at rest by then; what it did not say was what KIND of thing was
   missing. Three rows reading "Not set" in identical grey boxes are three
   identical shrugs, and the two that want dates look exactly like the one that
   wants an email address.

   A CUE ICON, ONLY WHEN EMPTY. A filled row does not need telling what it
   holds — it is holding it — so the icon is the empty state's alone, which also
   stops a settled panel filling up with decoration. Hidden from screen readers:
   the label to its left already names the field, and the empty read says its
   own words ("Pick a date"). */
function ktRowHtml(key,label,readHtml,fieldHtml,editable,cueIcon){
  if(!editable) return `<div class="kt-row"><span class="kt-k">${label}</span><span class="kt-v">${readHtml}</span></div>`;
  const isEmpty=ktIsEmptyRead(readHtml);
  const empty=isEmpty?' data-kt-empty="1"':'';
  const cue=(isEmpty&&cueIcon&&window.icon)
    ?`<span class="kt-cue" aria-hidden="true">${icon(cueIcon,'w-3 h-3')}</span>`:'';
  return `<div class="kt-row is-editable" data-kt-row="${key}">
    <span class="kt-k">${label}</span>
    <button type="button" class="kt-v kt-read"${empty} data-kt-edit="${key}" title="${esc(isEmpty?i18t('ct_empty_click'):i18t('ct_click_change'))}">${cue}${readHtml}</button>
    <span class="kt-field hidden">${fieldHtml}</span></div>`;
}
function ktTermsRowsHtml(c,opts={}){
  const ed=!!opts.editable;
  const KIN='min-width:0;width:100%;border:1px solid var(--color-accent);background:var(--color-bg);border-radius:5px;padding:4px 8px;font:inherit;font-size:11.5px;text-align:right;outline:none';
  const dash=`<span class="kt-none" data-kt-none="1">${i18t('ct_not_set')}</span>`;
  /* A DATE ROW SAYS SO IN WORDS AS WELL AS IN ITS ICON. "Not set" is a state;
     "Pick a date" is an instruction, and the two date rows are the ones a
     reader was getting wrong. Same data-kt-none marker, so everything that
     keys off empty (the dashed border, the cue, ktIsEmptyRead) is unchanged. */
  const dashDate=`<span class="kt-none" data-kt-none="1">${i18t('ct_pick_a_date')}</span>`;
  const money=isMonetary(c)?(c.value?fmtMoney(c.value):dash):`<span class="kt-none">${i18t('ct_non_monetary')}</span>`;
  const day=v=>v?esc((window.fmtDocDate&&fmtDocDate(v))||v):dashDate;
  const tmpl=c.template?((window.TEMPLATES&&TEMPLATES[c.template]&&TEMPLATES[c.template].name)||c.template)
    :(isUpload(c)?'Uploaded document':'');
  return [
    ktRowHtml('counterparty','Counterparty', c.counterparty?esc(c.counterparty):dash,
      `<input data-kt="counterparty" type="text" value="${(c.counterparty||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ct_who_is_this_with')}" style="${KIN}"/>`, ed, 'pencil'),
    /* ---- THEIR EMAIL, ON THE ROW UNDER THEIR NAME ----
       This was a banner across the top of the negotiation asking for it. The
       address is a fact about the counterparty, exactly like the name directly
       above it, so it is asked here — once, quietly, in the panel that holds
       the commercial facts. Filling it in is what makes a send just a send;
       leaving it empty costs nothing, because the share dialog still collects
       an address at the moment of sending. */
    ktRowHtml('cpEmail','Their email', c.counterpartyEmail?esc(c.counterpartyEmail):dash,
      `<input data-kt="cpEmail" type="email" value="${(c.counterpartyEmail||'').replace(/"/g,'&quot;')}" placeholder="${i18t('ct_changes_straight')}" style="${KIN}"/>`, ed, 'pencil'),
    ktRowHtml('value','Contract value', `<span style="font-family:var(--font-mono)">${money}</span>`,
      `<span style="display:flex;align-items:center;gap:6px;justify-content:flex-end">
         <span style="font-size:11px;color:var(--color-neutral-500);flex:none">${jxCurrency()}</span>
         <input data-kt="value" type="text" inputmode="numeric" value="${isMonetary(c)&&c.value?Number(c.value).toLocaleString(jxLocale()):''}" placeholder="0" ${isMonetary(c)?'':'disabled'} style="${KIN};font-family:var(--font-mono)"/>
         <label style="display:flex;align-items:center;gap:5px;font-size:10.5px;color:var(--color-neutral-600);flex:none;white-space:nowrap">
           <input data-kt="nonmonetary" type="checkbox" ${!isMonetary(c)?'checked':''} style="width:14px;height:14px;accent-color:var(--color-accent)"/>none</label></span>`, ed),
    ktRowHtml('effDate','Effective', day(c.fields&&c.fields.effDate),
      `<input data-kt="effDate" type="date" value="${(c.fields&&c.fields.effDate)||''}" style="${KIN}"/>`, ed, 'calendar'),
    ktRowHtml('expiry','Expiry', day(c.expiry),
      `<input data-kt="expiry" type="date" value="${c.expiry||''}" style="${KIN}"/>`, ed, 'calendar'),
    ktRowHtml('stream','Value stream', esc((window.streamLabel?streamLabel(c):'')||'—'),'',false),
    tmpl?ktRowHtml('template','Template', esc(tmpl),'',false):'',
  ].join('');
}
/* One row at a time. Opening a second closes the first, so the panel never
   becomes the form it was rescued from. Blur puts it back to reading. */
function wireKtRows(c){
  const rows=document.querySelectorAll('[data-kt-row]');
  const shut=r=>{ r.querySelector('.kt-read')?.classList.remove('hidden');
    r.querySelector('.kt-field')?.classList.add('hidden'); r.classList.remove('is-open'); };
  rows.forEach(r=>{
    r.querySelector('[data-kt-edit]')?.addEventListener('click',()=>{
      rows.forEach(o=>{ if(o!==r) shut(o); });
      r.querySelector('.kt-read').classList.add('hidden');
      const f=r.querySelector('.kt-field'); f.classList.remove('hidden'); r.classList.add('is-open');
      const inp=f.querySelector('input:not([type=checkbox])'); if(inp){ inp.focus(); inp.select&&inp.select(); }
    });
    r.querySelectorAll('.kt-field input').forEach(inp=>inp.addEventListener('blur',()=>{
      /* Late enough for a click on the checkbox beside it to land first. */
      setTimeout(()=>{ if(!r.contains(document.activeElement)) renderKeyTerms(c); },120);
    }));
  });
}
/* Repaint the panel from the record — after an edit, so the read-out beside a
   field agrees with what was just typed. */
function renderKeyTerms(c){
  const host=document.getElementById('kt-rows'); if(!host) return;
  const ktEditable=c.status!=='Signed'&&canEdit()&&!PORTAL_MODE;
  host.innerHTML=ktTermsRowsHtml(c,{editable:ktEditable});
  wireKtRows(c); wireKeyTerms(c);
}
function termsFromPlaybook(c){
  const r=c&&c.playbook;
  if(!r||!Array.isArray(r.verdicts)) return [];
  return r.verdicts.filter(v=>v&&v.quote&&String(v.quote).trim())
    .map(v=>({ label:String(v.category||'Term'), quote:String(v.quote).trim(), status:v.status||'' }));
}
function readTermsHtml(c){
  const rows=termsFromPlaybook(c);
  const H='font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500)';
  if(!rows.length) return `<div style="margin-top:13px;padding-top:11px;border-top:1px solid var(--color-divider)">
      <div style="${H};margin-bottom:5px">${i18t('ct_read_from_doc')}</div>
      ${''/* ---- THE SENTENCE STAYS, THE BUTTON GOES ----
             Removed (Young, 10 Aug 2026). The playbook review is a check on the
             WORDING: it reads the clauses, pins its findings to them and opens
             them in a panel over the document. All of that is on the Document
             tab, in the Checks card, which is where it is run from. A second
             door here took you to a different tab to see what it found — the
             same duplication Find obligations was removed for, in the other
             direction. What is left is the sentence, which is not a duplicate:
             it explains why governing law and the liability cap are not rows in
             this panel, and that is a question only this panel raises. */}
      <p style="margin:0;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">Governing law, the liability cap and the payment terms are in the wording, not in this panel. The playbook review on the <b>Document</b> tab reads them out and quotes the clause it found them in.</p>
    </div>`;
  return `<div style="margin-top:13px;padding-top:11px;border-top:1px solid var(--color-divider)">
      <div style="${H};margin-bottom:6px">${i18t('ct_read_from_doc')}</div>
      ${rows.map(r=>`<div class="kt-read-row" title="${esc(r.quote)}">
        <span class="kt-read-k">${esc(r.label)}</span>
        <span class="kt-read-v">&ldquo;${esc(r.quote.slice(0,120))}${r.quote.length>120?'&hellip;':''}&rdquo;</span></div>`).join('')}
      <p style="margin:7px 0 0;font-size:10.5px;color:var(--color-neutral-500)">${i18t('ct_quoted_from_clause')}</p>
    </div>`;
}
/* ---- RISK: A READ OF THE CHECKS YOU HAVE RUN, NOT A NEW NUMBER ----
   The mockup's risk score was invented. This one is arithmetic on findings
   that already exist: the playbook's verdicts, and the scan's open findings by
   severity. Run neither and it says so rather than showing a zero that would
   read as "no risk". */
function riskRead(c){
  const pb=(c.playbook&&Array.isArray(c.playbook.verdicts))?c.playbook.verdicts:null;
  const open=(typeof openFindings==='function')?openFindings(c):[];
  if(!pb&&!c.scan) return null;
  const bars=[];
  if(pb) pb.slice(0,5).forEach(v=>bars.push({ label:String(v.category||'Term'),
    n:v.status==='aligned'?8:v.status==='deviation'?55:v.escalate?90:75 }));
  /* ---- THE SCALE, AND WHY IT IS NOT AN AVERAGE OF THE BARS ----
     Averaging saturated instantly: one scan bar drawn from six ordinary
     findings scored the whole contract 100 — maximum risk on a routine supply
     agreement, which is the sort of number that gets a scoring system ignored.
     The score is a WEIGHTED COUNT of what was actually found, on a scale where
     60 (the Legal sign-off line) takes something real to reach: three high
     findings, or two missing standards, or a spread of smaller ones. */
  let scan=0;
  if(c.scan){
    const w={high:20,med:9,low:3};
    scan=Math.min(100,open.reduce((a,x)=>a+(w[x.sev]||3),0));
    bars.push({ get label(){ return i18t('ct_open_scan_findings'); }, n:scan });
  }
  let book=0;
  if(pb) book=Math.min(100,pb.reduce((a,v)=>a+(v.status==='aligned'?0:v.status==='deviation'?12:18)+(v.escalate&&v.status!=='aligned'?10:0),0));
  const score=Math.min(100,Math.round(scan*0.6+book*0.6));
  return { score, bars, ranPb:!!pb, ranScan:!!c.scan };
}
function riskCardHtml(c){
  const H='margin:0;font-size:13px;font-weight:700;font-family:var(--font-heading)';
  const r=riskRead(c);
  if(!r) return `<h6 style="${H};margin-bottom:7px">${i18t('ct_risk')}</h6>
    <p style="margin:0 0 9px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">${i18t('ct_nothing_checked')}</p>
    ${''/* Reported with the obligations pair (Young, 10 Aug 2026): almost
           transparent. A bare .ui-btn is a hairline border on a white
           background, which is fine on a toolbar full of other buttons and
           invisible alone at the foot of a paragraph. It takes the accent
           outline the design already keeps for a secondary act — the same
           treatment, and the same restraint, as Add obligation beside it. */}
    <button id="kt-gocheck" class="ui-btn ob-btn-add" style="font-size:11.5px;padding:5px 11px">${i18t('ct_go_to_checks')}</button>`;
  const tone=r.score>=60?'var(--st-ruby-fg)':r.score>=35?'var(--st-amber-fg)':'var(--st-green-fg)';
  const bg=r.score>=60?'var(--st-ruby-bg)':r.score>=35?'var(--st-amber-bg)':'var(--st-green-bg)';
  return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
      <h6 style="${H};flex:1">${i18t('ct_risk')}</h6>
      <span class="pill-x" style="background:${bg};color:${tone};font-family:var(--font-mono)">${r.score}</span>
    </div>
    ${r.bars.map(b=>`<div class="risk-row"><span class="risk-k">${esc(b.label)}</span>
      <span class="risk-bar"><i style="width:${b.n}%;background:${b.n>=60?'var(--st-ruby-dot)':b.n>=35?'var(--st-amber-dot)':'var(--st-green-dot)'}"></i></span>
      <span class="risk-n">${b.n}</span></div>`).join('')}
    <p style="margin:8px 0 0;font-size:10.5px;line-height:1.5;color:var(--color-neutral-500)">Scored from ${[r.ranPb?'the playbook review':'',r.ranScan?'the Copilot scan':''].filter(Boolean).join(' and ')}. Anything above 60 needs Legal sign-off before signing.</p>`;
}
/* ---- ONE CARD BESIDE KEY TERMS, AND IT MATCHES IT ----
   The Risk card is gone from this tab (Young, 10 Aug 2026). It was the third
   card in a two-card column: Key terms on the left, Obligations and Risk
   stacked on the right, so the right column ran past the bottom of the left
   one and the two halves of the screen never lined up. Risk is not lost — it
   is READ from the playbook review and the Copilot scan, and both of those,
   with their findings, live on the Document tab. A score with no way to act on
   it beside it is a number to look at, and it was pushing the obligations it
   sat above off the fold.

   THE ONE THAT STAYS IS SIZED TO ITS NEIGHBOUR. Obligations now takes the
   column's full height with its list scrolling inside (see .ob-list), so the
   two cards square off. align-items:stretch on the grid does the work; the
   height is not a number written twice, which is how two cards drift apart the
   first time somebody adds a row to one of them. */
function renderKeyTermsSide(c){
  const host=document.getElementById('kt-side'); if(!host) return;
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:8px;padding:13px 15px';
  host.innerHTML=`<section id="obligations-section" class="kt-side-card" style="${CARD}"></section>`;
  if(window.renderObligationsSection) renderObligationsSection(c);
  /* #kt-readdoc's wiring went with the button — see readTermsHtml. */
}

/* ============ HISTORY ============
   ONE STORY, TOLD ONCE, AS A TIMELINE.

   This tab used to open on five filter dropdowns and three buttons, then a flat
   list of negotiation events, then a SECOND card underneath holding the audit
   trail — which is the same story told by the system instead of by people. Two
   lists answering "what happened to this contract" is one list too many.

   The two are merged, oldest first, on one rail. The filters, the integrity
   check and the export are all kept — they are the reason this record is worth
   anything to an auditor — but they belong on the card's head, not in front of
   the story. Versions sit beside it, because "what changed between these two
   dates" is asked in the same breath as "what happened", and until now the only
   way to compare two versions was a menu on another tab. */
const HIST_KIND={ proposed:{mark:'✎',tone:'var(--color-accent)'}, decided:{mark:'✓',tone:'var(--st-green-dot)'},
  withdrawn:{mark:'↩',tone:'var(--color-neutral-400)'}, 'round-closed':{mark:'⊘',tone:'var(--st-steel-dot)'},
  system:{mark:'·',tone:'var(--color-neutral-400)'} };
/* ---- THE AUDIT TRAIL CONTRIBUTES WHAT THE TIMELINE CANNOT TELL ----
   Merging the two lists naively doubles the page up, and it took putting them
   on one rail to see how badly: the trail writes its OWN entry for every
   proposal the negotiation already reports — same change, same clause, in
   machine language with the fingerprint spelled out — so a three-change round
   printed six events, half of them unreadable.

   The negotiation's own account is the better one: it names the clause, the
   person and the outcome. So the trail is asked only for what that account has
   no way to know — the contract being created, sent, scanned, reviewed,
   renamed, signed. Nothing is deleted; the fingerprints it was reciting are
   still on the record and still what Verify integrity recomputes. */
/* ---- NOTHING IS DROPPED. THE TWIN IS FOLDED IN. ----
   The first version of this SKIPPED every audit entry whose action was
   "Negotiation", on the reading that the trail was retelling proposals the
   timeline already reported. It was — but dropping the category quietly turned
   the page into a summary: ten events became six, and the fingerprints went
   with them.

   The record is complete again. Where a system entry genuinely describes an
   event the negotiation already tells in better words, the two are MERGED —
   one row, the readable text, and the machinery it duplicated (the fingerprint,
   the actor) carried on the row rather than thrown away. Everything else the
   trail knows and the negotiation cannot — created, sent, scanned, reviewed,
   renumbered, signed — stands as its own event. */
/* ---- THE RECORD LANDS SHORT AND OPENS LONG ----
   Both readings are the same list; the difference is whether each proposal
   prints the wording it changed underneath it. The short one answers "what
   happened to this contract" in a screenful. The long one is the record an
   auditor reads — every proposal with its redline, exactly as the exported
   report prints it — and it runs to several screens on a three-round deal.

   Landing on the long one made a first glance into a scroll, so the page opens
   short and the wording is one press away. The choice is remembered for the
   session but not stored on the contract: it is how somebody is reading, not
   something true about the agreement. */
let _histDetail=false;
function _histKey(at,txt){
  return String(at||'').slice(0,10)+'|'+String(txt||'').toLowerCase()
    .replace(/[^a-z0-9]+/g,' ').trim().slice(0,48);
}
function roomHistoryEvents(c,f={}){
  const filtered=Object.values(f||{}).some(v=>v);
  const nego=(window.negoTimeline?negoTimeline(c,f):[]).map(e=>({...e,_k:e.kind||'proposed'}));
  /* System events carry no clause, side or round, so no filter can match one.
     They drop out the moment a filter is on rather than sitting there looking
     as though the filter had missed them. */
  if(filtered) return nego.sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')));
  /* A change id inside a system entry is the strongest signal that it is the
     twin of a negotiation event: the trail writes "#CHG-002 proposed by …".

     THE ID ALONE IS NOT ENOUGH, though, and keying on it alone put every trail
     entry about a change onto the SAME row. One change produces two entries —
     proposed, then accepted — and the map, written in a loop, kept whichever
     came last: the decision. So both fingerprints landed on "Accepted by …",
     which printed the identical hash twice, and the proposal above it, which
     is where a fingerprint means something, showed none at all.

     The trail names the verb it is recording, so the verb decides the row. */
  const _verb=d=>/\bwithdrew\b/i.test(d)?'withdrawn'
    :/\b(accepted|rejected)\b/i.test(d)?'decided'
    :/\bproposed\b/i.test(d)?'proposed':'';
  const byChange=new Map();
  nego.forEach(e=>{ if(e.ch&&e.ch.id){
    const id=String(e.ch.id);
    if(!byChange.has(id)) byChange.set(id,{});
    /* First wins per kind: two events of one kind on one change is not a shape
       the timeline produces, and if it ever were, the earlier is the original. */
    if(!byChange.get(id)[e._k]) byChange.get(id)[e._k]=e;
  }});
  const said=new Map(nego.map(e=>[_histKey(e.at,e.text),e]));
  const sys=[];
  (c.audit||[]).forEach(a=>{
    const detail=String(a.detail||'');
    const idm=detail.match(/#?(CHG-[A-Za-z0-9-]+)/);
    const kinds=(idm&&byChange.get(idm[1]))||null;
    /* The named verb first; failing that, any row for this change rather than
       a second copy of an event the page already tells. */
    const twin=(kinds&&(kinds[_verb(detail)]||kinds.proposed||kinds.decided||kinds.withdrawn))
      ||said.get(_histKey(a.at,detail));
    if(twin){ twin._also=twin._also||[]; twin._also.push(a); return; }   // folded in, not lost
    sys.push({ _k:'system', at:a.at||'', actor:a.user||'System',
      text:`${a.action||'Recorded'}${detail?' — '+detail:''}`, clauseLabel:'', round:null, _audit:a });
  });
  return nego.concat(sys).sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')));
}
function roomHistoryHtml(c,f={}){
  const evs=roomHistoryEvents(c,f);
  /* The total is the UNFILTERED list, counted the same way — merged twins are
     one event in both, so "7 of 11" can never appear over a page that is
     hiding nothing. */
  const all=roomHistoryEvents(c,{}).length;
  const on=Object.values(f||{}).filter(Boolean).length;
  const row=e=>{
    const m=HIST_KIND[e._k]||HIST_KIND.system;
    const when=e.at?String(e.at).slice(0,10):'';
    const meta=[when,e.actor||'',e.round!=null&&e.round!==''?`round ${e.round}`:'',e.clauseLabel||'']
      .filter(Boolean).map(esc).join(' · ');
    /* ---- THE WORDING THAT CHANGED, UNDER THE EVENT THAT CHANGED IT ----
       The exported report prints each proposal's redline and the page did not,
       which is why the export read as the fuller record. Same builder, same
       green-added / red-removed convention, on the screen too. */
    const body=(_histDetail&&e._k==='proposed'&&e.ch&&window.negoChangeHtml)
      ? `<div class="hist-redline">${negoChangeHtml(e.ch)}</div>` : '';
    const why=e.note?`<div class="hist-note">Why they asked: ${esc(e.note)}</div>`:'';
    const reply=(e._k==='decided'&&e.reply)?`<div class="hist-note">${i18t('ct_reply_prefix',{text:esc(e.reply)})}</div>`:'';
    /* The system twin this row absorbed — its fingerprint and its actor kept on
       the row rather than printed as a second event. */
    /* One fingerprint per row, however many trail entries folded into it. A
       change's proposal and its acceptance carry the SAME hash — that is the
       point of the hash — so printing one per entry printed it twice. */
    const seenFp=new Set();
    const also=(e._also||[]).map(a=>{ const fp=String(a.detail||'').match(/(0x[0-9a-f]{8,})/i);
      if(!fp||seenFp.has(fp[1])) return '';
      seenFp.add(fp[1]);
      return `<span class="hist-fp" title="${esc(a.detail||'')}">${esc(fp[1].slice(0,18))}…</span>`; }).join('');
    return `<div class="hist-ev"><span class="hist-mark" style="color:${m.tone};border-color:${m.tone}" aria-hidden="true">${m.mark}</span>
      <div class="hist-body"><div class="hist-text">${esc(e.text||'')}</div>
      <div class="hist-meta">${meta}${also?' · '+also:''}</div>${body}${why}${reply}</div></div>`;
  };
  /* WHOSE ASKS AM I LOOKING AT — the one filter people actually reach for, so
     it is three chips on the head rather than the fourth dropdown inside a
     panel behind a button. It writes the SAME f.side the dropdown does, so the
     two can never disagree and the panel shows the chip's choice selected. */
  const side=String(f.side||'');
  const chip=(v,label)=>`<button type="button" data-ht-side="${v}" class="hist-seg${side===v?' is-on':''}"
    aria-pressed="${side===v?'true':'false'}">${label}</button>`;
  return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px">
      <h6 style="margin:0;font-size:13px;font-weight:700;font-family:var(--font-heading);flex:1">History</h6>
      <span class="pill-x" style="background:var(--color-neutral-100);color:var(--color-neutral-600)">${on?`${evs.length} of ${all}`:`${all} events`}</span>
      <div class="hist-segs" role="group" aria-label="${i18t('ct_whose_changes')}">
        ${chip('','Everyone')}${chip('owner','Ours')}${chip('counterparty','Theirs')}
      </div>
      ${''/* The long reading. Named for what pressing it does, not for the mode
             it is in — "Detailed" tells you nothing about which way you are
             about to go. */}
      <button id="hist-detail" class="ui-btn" aria-pressed="${_histDetail?'true':'false'}"
        title="${esc(_histDetail?i18t('ct_hist_back_short'):i18t('ct_hist_print_wording'))}"
        style="font-size:11px;padding:4px 10px">${_histDetail?i18t('ct_hist_hide_wording'):i18t('ct_hist_show_wording')}</button>
      <button id="hist-filter" class="ui-btn" style="font-size:11px;padding:4px 10px">${i18t('ct_filter')}${on?` · ${on}`:''} &#9662;</button>
      <div style="position:relative">
        <button id="hist-more" class="ui-btn" aria-haspopup="true" style="width:28px;height:28px;padding:0;font-size:14px;line-height:1">&#8943;</button>
        <div id="hist-more-menu" class="room-menu hidden" style="min-width:250px">
          <button type="button" id="ht-verify">${icon('shield','w-3.5 h-3.5')}Verify integrity<span class="mnote">${i18t('ct_recompute_fingerprints')}</span></button>
          <button type="button" id="ht-export">${icon('download','w-3.5 h-3.5')}${i18t('ct_export_history')}<span class="mnote">${i18t('ct_standalone_file')}</span></button>
          <button type="button" id="ht-print">${icon('printer','w-3.5 h-3.5')}Print history<span class="mnote">${i18t('ct_same_report_paper')}</span></button>
        </div>
      </div>
    </div>
    <div id="hist-filters" class="hidden" style="margin-bottom:10px">${roomHistoryFiltersHtml(c,f)}</div>
    <div id="ht-verify-result"></div>
    <div class="hist-rail">${evs.length?evs.map(row).join('')
      :`<p style="margin:6px 0;font-size:12px;color:var(--color-neutral-600)">${on?'Nothing matches these filters.':'Nothing has happened to this contract yet.'}</p>`}</div>`;
}
function roomHistoryFiltersHtml(c,f){
  const all=window.negoTimeline?negoTimeline(c):[];
  const uniq=pairs=>Array.from(new Map(pairs.filter(x=>x&&String(x[0])).map(x=>[String(x[0]),x])).values());
  const sel=(k,label,pairs)=>`<label class="hist-f"><span>${label}</span>
    <select data-ht-filter="${k}">${`<option value="">${i18t('ct_all')}</option>`}${pairs.map(p=>
      `<option value="${esc(String(p[0]))}"${String(f[k]||'')===String(p[0])?' selected':''}>${esc(String(p[1]).slice(0,42))}</option>`).join('')}</select></label>`;
  return `<div class="hist-filters">
    ${sel('clauseId','Clause',uniq(all.map(e=>[e.clauseId||'',e.clauseLabel||''])))}
    ${sel('actor','Person',uniq(all.map(e=>[e.actor||'',e.actor||''])))}
    ${sel('side','Side',[['owner','Owner side'],['counterparty','Counterparty']])}
    ${sel('round','Round',uniq(all.filter(e=>e.round!=null&&e.round!=='').map(e=>[e.round,'Round '+e.round])))}
    ${sel('outcome','Outcome',[['accepted','Accepted'],['rejected','Rejected'],['pending','Pending'],['withdrawn','Withdrawn']])}
    <button id="ht-clear" class="ui-btn" style="align-self:flex-end;font-size:11px;padding:5px 10px">${i18t('ct_clear2')}</button>
  </div>`;
}
function roomVersionsHtml(c){
  const vs=(window.listedVersions?listedVersions(c):(c.versions||[])).slice().reverse();
  return `<h6 style="margin:0 0 9px;font-size:13px;font-weight:700;font-family:var(--font-heading)">${i18t('ct_versions')}</h6>
    ${vs.length?vs.map((v,i)=>`<div class="check-row" style="border-top:${i?'1px solid var(--color-divider)':'0'}">
      <span class="ci">${icon('file','w-3.5 h-3.5')}</span>
      <span class="cn">v${v.n} ${i===0?'· current':''}<span style="display:block;font-weight:400;font-size:10.5px;color:var(--color-neutral-500)">${esc(String(v.label||'Saved'))} · ${window.fmtDT?fmtDT(v.at):esc(String(v.at||'').slice(0,10))}</span></span>
      <button class="ui-btn" data-hist-compare="${v.n}" style="flex:none;font-size:11px;padding:4px 10px">${i18t('ct_compare')}</button>
    </div>`).join('')
    :`<p style="margin:0;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">${i18t('ct_no_saved_versions')}</p>`}`;
}
function roomPaintHistory(c,f={}){
  const host=document.getElementById('ws-history-pane');
  if(!host) return;
  host.innerHTML=roomHistoryHtml(c,f);
  const vhost=document.getElementById('ws-versions-pane');
  if(vhost){
    vhost.innerHTML=roomVersionsHtml(c);
    vhost.querySelectorAll('[data-hist-compare]').forEach(b=>b.addEventListener('click',()=>{
      if(window.openCompareModal) openCompareModal(c);
      else toast(i18t('ct_compare_unavailable'),'err');
    }));
  }
  const read=()=>{ const g=k=>{ const el=host.querySelector(`[data-ht-filter="${k}"]`); return el&&el.value?el.value:''; };
    return {clauseId:g('clauseId'),actor:g('actor'),side:g('side'),round:g('round'),outcome:g('outcome')}; };
  const panel=host.querySelector('#hist-filters');
  host.querySelector('#hist-filter')?.addEventListener('click',()=>panel?.classList.toggle('hidden'));
  if(Object.values(f).some(Boolean)) panel?.classList.remove('hidden');
  host.querySelectorAll('[data-ht-filter]').forEach(s=>
    s.addEventListener('change',()=>roomPaintHistory(c,read())));
  host.querySelector('#ht-clear')?.addEventListener('click',()=>roomPaintHistory(c,{}));
  /* The chips write f.side and repaint — the same field the Side dropdown
     writes, so opening the panel afterwards shows the chip's choice already
     selected rather than a second opinion. */
  host.querySelectorAll('[data-ht-side]').forEach(b=>b.addEventListener('click',()=>
    roomPaintHistory(c,{...read(),side:b.getAttribute('data-ht-side')||''})));
  host.querySelector('#hist-detail')?.addEventListener('click',()=>{
    _histDetail=!_histDetail; roomPaintHistory(c,read());
  });
  const mb=host.querySelector('#hist-more'), mm=host.querySelector('#hist-more-menu');
  if(mb&&mm){
    mb.addEventListener('click',e=>{ e.stopPropagation(); mm.classList.toggle('hidden'); });
    mm.addEventListener('click',()=>setTimeout(()=>mm.classList.add('hidden'),0));
    document.addEventListener('click',ev=>{ if(!mm.contains(ev.target)&&ev.target!==mb) mm.classList.add('hidden'); });
  }
  host.querySelector('#ht-verify')?.addEventListener('click',async()=>{
    const box=host.querySelector('#ht-verify-result');
    if(!box||!window.negoIntegrityReport) return;
    box.innerHTML=`<div style="font-size:11.5px;color:var(--color-neutral-600);padding:8px 0">${i18t('ct_recomputing')}</div>`;
    box.innerHTML=negoVerifyResultHtml(await negoIntegrityReport(c));
  });
  /* Export runs the verification FIRST and carries the result inside the file,
     exactly as the dialog does — a report that claims a record is intact
     without saying when that was checked is the thing this page exists to
     avoid. Shared with the dialog through negoHistoryExportRun. */
  host.querySelector('#ht-export')?.addEventListener('click',()=>{
    if(window.negoHistoryExportRun) negoHistoryExportRun(c);
  });
  /* Print is the SAME report, not a print stylesheet over this page. Printing
     the tab would put the app's chrome, the filter chips and a half-open menu
     on the paper, and it would print whichever reading happened to be on
     screen — a short list is not a record. The report already carries its own
     colours, its own legend and its verification result, and it already prints
     well because people file it. So: build it, hand it to the browser. */
  host.querySelector('#ht-print')?.addEventListener('click',()=>{
    if(window.negoHistoryPrintRun) negoHistoryPrintRun(c);
    else toast(i18t('ct_printing_unavailable'),'err');
  });
}
/* The owner's side of the shared component. Everything side-specific about the
   owner lives here — who they are, what pressing "Propose edits" does, where
   the hand-off goes — so js/views/negotiation.js stays the same code for both
   parties. */
/* REPAINT THE ROOM, IF THE ROOM IS WHAT THEY ARE LOOKING AT.

   The room is a full-window layer mounted outside the app shell, so
   renderWorkspace() rebuilds the page UNDERNEATH it and leaves it exactly as it
   was. Every path that changes the record while the owner might be standing in
   the room has to say so — an answer arriving from the counterparty, a reply on
   a thread — or the screen goes on showing a state the contract left behind.

   Guarded on the contract as well as on the room: repainting somebody's open
   negotiation because a DIFFERENT contract moved would be worse than not
   repainting at all. */
function negoRepaintOpenRoom(c){
  if(!c || !window.negoRoomIsOpen || !negoRoomIsOpen()) return false;
  if(!window.negoRoomContract || negoRoomContract() !== c) return false;
  openNegotiationOwnerRoom(c);
  return true;
}
function openNegotiationOwnerRoom(c){
  if(!window.openNegotiationRoom) return;
  /* THE OTHER SIDE OF EVERY THREAD, fetched before the cards are drawn.
     A counterparty's reply on a fingerprint is filed in the discussion channel
     — it cannot be written to our contract record from a public page — so a
     room that read only c.changes[].thread showed the owner their own question
     with no answer under it. negoThreadOf merges the two stores; this is what
     puts the second one within its reach. Fire-and-forget: the room opens
     immediately either way and repaints when the replies land. */
  if(API_MODE()&&!Array.isArray(c._messages)){
    api('contracts/'+c.id+'/messages')
      .then(r=>{ c._messages=(r&&r.messages)||[];
        if(window.negoRoomIsOpen&&negoRoomIsOpen()) openNegotiationOwnerRoom(c); })
      .catch(()=>{ c._messages=c._messages||[]; });
  }
  openNegotiationRoom(c, {
    side:'owner',
    org:window.FIRST_PARTY,
    /* negoExecuted, not `status === 'Signed'`, which is the narrowing the
       predicate was named to prevent: a contract carrying a seal or an
       execution stamp is executed whatever its status field says, and this
       mount was letting that case through to a fully editable room. */
    readonly:!canEdit()||(typeof negoExecuted==='function'?negoExecuted(c):c.status==='Signed'),
    by:currentUser()?.name,
    author:currentUser()?.name,
    /* The other half of every thread, and which of them this reader has read.
       Passed rather than looked up, because the counterparty's page keeps the
       same two things somewhere else entirely — see portalNegoContract. */
    messages:c._messages||[],
    seenScope:c.id,
    shares:(window.cachedShares?cachedShares(c):[]),
    onChange(){ persist(c); },
    /* AND THEIR LINK IS A PHOTOCOPY — the same fault, walked the other way.
       refreshLiveShareQuietly was added so a counterparty's own answers stop
       being replayed to them as undecided, and it was called from exactly one
       place: the path that applies THEIR response. Nothing called it when WE
       answered. So the counterparty asked for a change, the owner accepted it,
       and a week later they reloaded their link and found their own ask back on
       the table marked "waiting on the other side".

       Only answers to what is already on the table — a decision, or an ask
       taken back. Wording the owner has newly PROPOSED is deliberately not
       pushed down a live link: what the reader is being asked to look at
       changes when somebody decides to send it, not as a side effect.

       Silent, like the original: no email, no new share record, no re-marking
       the link as sent, no resetting whether they have opened it. */
    /* WHO WE ARE NEGOTIATING WITH, if we know. The room asks for it once when
       we do not, and sends without asking when we do. */
    contact:(window.counterpartyContact?counterpartyContact(c,(window.cachedShares?cachedShares(c):[])):null),
    onSetCounterparty(x){
      c.counterpartyEmail=String((x&&x.email)||'').trim();
      if(x&&x.name) c.counterpartyName=x.name;
      logAudit(c,'Negotiation',`Counterparty contact set — changes on this contract go to ${c.counterpartyEmail}`);
      persist(c);
      toast(`Saved — changes now go straight to ${c.counterpartyEmail}`);
      if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
    },
    /* THE SEND, once there is somewhere to send to. Rides the same route the
       "send updated version" control has always used: an existing standing link
       is refreshed in place rather than duplicated, and a first send mints one.
       A NEW ASK NOTIFIES — unlike a decision, which updates their link in
       silence. They are not waiting to be told we accepted something; they
       cannot answer wording they do not know has arrived. */
    async onSendDirect(){
      const to=c.counterpartyName||c.counterparty||'the counterparty';
      try{
        const out=await reshareToLastRecipient(c,{ purpose:'negotiate' });
        if(!negoHandOver(c,{ to:'counterparty', by:currentUser()?.name })) { persist(c); }
        else persist(c);
        /* Three honest outcomes. quiet: the standing link took the round and no
           email goes — by design, the platform is the channel after the first
           send. delivered: the FIRST send, which emails the link. Otherwise the
           link went out on a channel that cannot deliver itself. */
        toast(out.quiet
          ? `Sent to ${to} — the new round is on their link, and it is now their turn`
          : out.delivered
          ? `Sent to ${to} — it is now their turn`
          : `Published to ${to}'s link — it is now their turn. ${out.channel==='email'?'It was not emailed; send them the link.':'Send them the link.'}`,
          (out.quiet||out.delivered)?undefined:'err');
      }catch(err){
        toast(`Could not send to ${to} — ${err.message}`,'err');
      }
      if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
    },
    onDecided(){ if(window.refreshLiveShareQuietly) refreshLiveShareQuietly(c); },
    onWithdraw(){ if(window.refreshLiveShareQuietly) refreshLiveShareQuietly(c); },
    /* A comment on a fingerprint has to LEAVE THE BUILDING. negoPostComment
       writes it onto our record, which is what the owner's card reads — and
       for a long time was the whole of it, so a question asked here reached
       the counterparty only if the share link happened to be refreshed
       afterwards. It goes down the discussion channel as well, under the
       change's own topic, which is the store their page reads. Same message,
       both stores, one thread on each side's card. */
    async onComment(_c, ch, msg){
      if(!API_MODE()||!ch) return;
      try{
        const res=await api('contracts/'+c.id+'/messages','POST',{
          topic:(window.negoTopicFor?negoTopicFor(ch):'change:'+ch.id),
          topicLabel:`Change #${ch.id}${ch.clauseLabel?' · '+ch.clauseLabel:''}`,
          body:msg.text });
        c._messages=(res&&res.messages)||c._messages||[];
        toast(`Comment posted on #${ch.id} — ${c.counterparty||'the counterparty'} sees it on the same change. The contract is unchanged.`);
      }catch(e){
        toast(`Saved on the change, but it could not be sent to ${c.counterparty||'the counterparty'}: ${e.message||'the message channel is unavailable'}`,'err');
      }
    },
    onPropose(){ openNegoProposeModal(c); },
    /* Leaving puts the workspace back the way it was, and repaints it — a
       decision taken in the room has to be visible on the Docs page the reader
       lands on. */
    onExit(){ renderWorkspace(); },
    onSaveDraft(){ persist(c); toast(i18t('ct_draft_saved')); },
    /* The second argument carries onSent/handOver when the room's turn banner
       is what opened this — the turn moves only if a share really goes out. */
    onShareLink(x, o){ closeNegotiationRoom(); renderWorkspace(); openShareModal(c, { purpose:'negotiate', ...(o||{}) }); },
    /* THE OWNER ISSUES THE SIGNING LINK, and it is a new link — never the old
       one changing character underneath the reader. The counterparty signalled;
       this is the answer to that signal.

       Same share dialog, so the recipient, the channel, the expiry and the
       record of what went out are the ones every other share uses. What is
       different is the purpose it carries, and that purpose is what supersedes
       every negotiation link on this contract the moment the new one exists. */
    onIssueSigningLink(){
      closeNegotiationRoom();
      renderWorkspace();
      issueSigningAct(c);
    },
    /* The transition point, and nothing past it. It closes the round so the
       agreed wording becomes the baseline, then puts the reader on the Docs
       tab where signing lives. No signing logic is built here, by design. */
    onReadyToSign(){
      negoAdvanceRound(c,{ by:currentUser()?.name });
      logAudit(c,'Negotiation','Negotiation complete — every change resolved; the agreed wording was carried to the Docs tab for signature');
      persist(c);
      _wsTab='docs'; _docTopTab='signing';
      closeNegotiationRoom();
      renderWorkspace();
      toast(i18t('ct_agreed_carried'));
    },
  });
}
/* ---- proposing wording, from either side ----------------------------------
   The distinction this modal exists to keep is between EDITING a contract and
   PROPOSING a change to it. Editing is what ws-edit does: it is our document,
   we change it, it versions immediately. Proposing puts wording on the table
   for the other side to answer, and it does not touch the document until they
   do — which is why the wording typed here goes through negoFileProposal and
   arrives as pending fingerprints rather than as a new version.

   The box is prefilled with the round's BASELINE, not the live document, so the
   edits are measured against exactly what both sides agreed they are arguing
   about. One line per block, because that is what richToText emits and what
   negoClausesOf reads back. */
function openNegoProposeModal(c){
  if(!canEdit()){ toast(i18t('ct_viewers_no_propose'),'err'); return; }
  if(c.status==='Signed'){ toast(i18t('ct_executed_readonly'),'err'); return; }
  /* A library-template contract's wording is the template manager's, not the
     deal-maker's: fixed wording is read-only on both sides, and the blanks
     are filled through the form, not rewritten through a redline. Changing
     the standard is a template edit (a new published version), not a per-deal
     negotiation over company boilerplate. */
  if(c.templateForm){ toast(i18t('ct_standard_template_readonly'),'err'); return; }
  const base=negoBaseText(c);
  if(!base.trim()){ toast(i18t('ct_no_wording_to_propose'),'err'); return; }
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">${i18t('ct_propose_changes_to',{who:esc(c.counterparty||i18t('ng_the_counterparty'))})}</h3>
          <p style="font-size:11.5px;color:var(--color-neutral-600);margin:7px 0 0;line-height:1.55">Edit the wording below. Each clause you change becomes its own fingerprinted change on the index, for them to accept, reject or discuss. <b>${i18t('ct_nothing_changes_contract')}</b> ${i18t('ct_moves_when_accepted')}</p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:20px 26px;background:var(--color-bg)">
        <div style="${COL}">
          <textarea id="nego-prop-text" spellcheck="false" style="width:100%;min-height:52vh;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:14px 16px;font:inherit;font-family:var(--font-mono);font-size:12.5px;line-height:1.8;outline:none;resize:vertical">${esc(base)}</textarea>
          <label style="display:block;margin-top:12px">
            <span style="display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">${i18t('ct_why_asking')}</span>
            <input id="nego-prop-why" type="text" placeholder="${esc(i18t('ct_ph_reason'))}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:9px 11px;font:inherit;font-size:12.5px;outline:none"/>
          </label>
        </div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <span style="flex:1;min-width:150px;font-size:11.5px;color:var(--color-neutral-600)">${i18t('ct_changed_become_pending')}</span>
          <button id="nego-prop-cancel" class="ui-btn">${i18t('act_cancel')}</button>
          <button id="nego-prop-go" class="ui-btn ui-btn-primary">${i18t('ct_propose_changes')}</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  document.getElementById('nego-prop-cancel').addEventListener('click',closeModal);
  document.getElementById('nego-prop-go').addEventListener('click',async e=>{
    const text=document.getElementById('nego-prop-text')?.value||'';
    const why=String(document.getElementById('nego-prop-why')?.value||'').trim();
    const btn=e.currentTarget, restore=btn.innerHTML;
    btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_filing')}</span>`;
    let filed=[];
    try{
      filed=await negoFileProposal(c, text, { side:'owner', author:currentUser()?.name,
        via:'the Negotiation tab' });
      /* One reason, given once, against every change it explains — into `why`.
         This wrote it to `note`, reading a box literally named "why" and
         filing it as internal provenance, which is the same mix-up the
         counterparty's inbound redline had. */
      if(why) for(const ch of filed) ch.why=why;
    }catch(err){
      btn.disabled=false; btn.innerHTML=restore;
      toast(i18t('ct_could_not_file_changes')+err.message,'err'); return;
    }
    closeModal();
    if(!filed.length){ toast(i18t('ct_identical_to_baseline')); return; }
    persist(c);
    toast(`${filed.length} change${filed.length===1?'':'s'} proposed — ${filed.map(x=>'#'+x.id).join(', ')}`);
    renderWorkspace();
  });
}
function topTabBtn(k,label,ic){
  return `<button data-top-tab="${k}" title="${label}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:7px;background:none;cursor:pointer;font:inherit;font-size:12.5px;font-weight:600;color:var(--color-neutral-600);padding:8px 4px;white-space:nowrap;transition:background .12s,color .12s">${icon(ic,'w-4 h-4')}<span>${label}</span></button>`;
}
function innerTabBtn(k,label,ic){
  return `<button data-inner-tab="${k}" title="${label}" style="flex:1;display:flex;align-items:center;justify-content:center;gap:5px;border:0;border-radius:6px;background:none;cursor:pointer;font:inherit;font-size:11.5px;font-weight:600;color:var(--color-neutral-600);padding:7px 4px;white-space:nowrap;transition:background .12s,color .12s">${icon(ic,'w-3.5 h-3.5')}<span>${label}</span></button>`;
}
function applyDocTabs(){
  const root=document.getElementById('doc-right'); if(!root) return;
  if(_docTopTab!=='screening'&&_docTopTab!=='signing') _docTopTab='screening';
  if(!DOC_INNER_TABS.includes(_docInnerTab)) _docInnerTab='signing';
  root.querySelectorAll('[data-top-pane]').forEach(p=>{ p.style.display=(p.getAttribute('data-top-pane')===_docTopTab)?'flex':'none'; });
  root.querySelectorAll('#doc-toptabs [data-top-tab]').forEach(b=>{ const on=b.getAttribute('data-top-tab')===_docTopTab;
    b.style.background=on?'var(--color-accent-800)':'none'; b.style.color=on?'#fff':'var(--color-neutral-600)'; });
  root.querySelectorAll('[data-inner-pane]').forEach(p=>{ p.style.display=(p.getAttribute('data-inner-pane')===_docInnerTab)?'flex':'none'; });
  root.querySelectorAll('#doc-innertabs [data-inner-tab]').forEach(b=>{ const on=b.getAttribute('data-inner-tab')===_docInnerTab;
    b.style.background=on?'var(--color-accent-100)':'none'; b.style.color=on?'var(--color-accent-800)':'var(--color-neutral-600)'; });
}
/* The Screening|Signing pair and the Signing|Audit pair that used to live on
   the right-hand panel are GONE — they became two of the room's own tabs. The
   wiring stays for the one control that outlived them: "Next: Signing", which
   now moves the whole room rather than a panel inside it. applyDocTabs is kept
   and simply finds nothing to switch. */
function wireDocTabs(c){
  /* screening-next is gone with its button. A listener left behind is how a
     removed control comes back the next time somebody re-adds the markup. */
  applyDocTabs();
}
/* ============ CHECKS ============
   THE ROW IS THE ANSWER, NOT JUST THE INVITATION.

   This card and the results cards under it were the same idea drawn twice: a
   row saying "Run →" that never changed, and — permanently, once run — a full
   card repeating everything the row could have said in three words. A column a
   third of the screen wide cannot afford to say anything twice.

   So the row carries the verdict once the check has run ("2 to escalate",
   "All clear", "4 found"), and pressing it again opens the findings OVER the
   page, where they are read, acted on, and dismissed. The findings themselves
   are unchanged: the same builders draw them, into a panel instead of into the
   column, so a finding still pins to its clause and still files a redline.

   Nothing here reimplements a check. Each row presses the act the product
   already has — runScanAct, runPlaybookReview, runFindObligations — so a row
   and its panel can never come to disagree about what was found. */
function checkVerdict(c,kind){
  if(kind==='playbook'){
    const r=c.playbook;
    if(!r) return null;
    const s=(typeof deviationSummary==='function')?deviationSummary(c):{dev:0,miss:0};
    const bad=(s.dev||0)+(s.miss||0);
    return bad ? {tone:'bad',label:`${bad} to look at`} : {tone:'ok',get label(){ return i18t('ct_all_aligned'); }};
  }
  if(kind==='risk'){
    if(!c.scan) return null;
    const open=(typeof openFindings==='function')?openFindings(c):[];
    if(!open.length) return {tone:'ok',get label(){ return i18t('ct_all_clear'); }};
    const high=open.filter(x=>x.sev==='high').length;
    return {tone:high?'bad':'warn',label:high?`${high} high · ${open.length} open`:`${open.length} open`};
  }
  const n=((c.obligations)||[]).length;
  return n ? {tone:'ok',label:`${n} tracked`} : null;
}
/* How many required form fields are still empty — 0 when this contract has no
   form at all, which is the common case (a plain template or an uploaded
   document arrives complete). The Checks card reads it to say why running a
   check now would be reading a document that is not finished. Counted the same
   way renderTemplateFormSection counts it, from the same record. */
function tplFormOpenCount(c){
  const form=c&&c.templateForm;
  if(!form||!Array.isArray(form.fields)) return 0;
  const values=form.values||{};
  return form.fields.filter(f=>f&&f.required&&f.fieldType!=='signature_name_title'
    && String(values[f.fieldKey]||'').trim()==='').length;
}
function checksRowsHtml(c){
  const row=(kind,ic,name)=>{
    const v=checkVerdict(c,kind);
    const tone=v&&v.tone==='bad'?'background:var(--st-ruby-bg);color:var(--st-ruby-fg)'
      :v&&v.tone==='warn'?'background:var(--st-amber-bg);color:var(--st-amber-fg)'
      :'background:var(--st-green-bg);color:var(--st-green-fg)';
    return `<div class="check-row"><span class="ci">${icon(ic,'w-3.5 h-3.5')}</span><span class="cn">${name}</span>
      <button class="cg" data-check="${kind}" title="${esc(v?i18t('ct_see_found'):i18t('ct_run_check'))}">${
        v?`<span class="pill-x" style="${tone}">${v.label}</span>`:'Run &rarr;'}</button></div>`;
  };
  /* ---- FIND OBLIGATIONS IS NOT A CHECK ON THIS CARD ANY MORE ----
     Removed as a duplicate (Young, 10 Aug 2026). The Obligations card on Key
     terms carries its own Find obligations button, beside the list the sweep
     fills and beside Add obligation, which is the other half of the same job.
     Two entry points to one act is one too many — and this one was the worse
     of the two, because pressing it here took you to the other tab to read the
     result anyway (see the roomGoTab in the wiring below, now gone with it).

     THE OTHER TWO STAY, and the difference is where their results live: a
     playbook review and a risk scan pin their findings to CLAUSES, on this
     tab, in a panel over this document. They are checks on the wording. An
     obligation is a commitment on the record, and the record is on Key terms. */
  return row('playbook','shield',i18t('ct_playbook_review'))
    + row('risk','scan',i18t('ct_copilot_risk_scan'));
}
function renderChecksCard(c){
  const card=document.getElementById('checks-card'); if(!card) return;
  const rows=card.querySelector('[data-checks-rows]'); if(!rows) return;
  rows.innerHTML=checksRowsHtml(c);
  /* The line above the rows moves with the form. Typing the last required
     field has to take "12 still empty" off the card in the same breath —
     otherwise the card goes on telling somebody to do the thing they just
     finished. Repainted from the record, never from a counter of its own. */
  const note=card.querySelector('[data-checks-note]');
  if(note) note.innerHTML=checksNoteHtml(c);
  wireChecksCard(c);
}
function checksNoteHtml(c){
  const n=tplFormOpenCount(c);
  return n
    ? `Fill the contract form above first — ${n} required field${n===1?'':'s'} still empty. A check reads the wording as it stands.`
    : i18t('ct_run_before_sending');
}
/* The findings, over the page. The panel hosts the SAME element id the column
   used to, so the existing renderer fills it without knowing it moved — which
   is also why the column no longer carries one: two elements with one id is
   how a "why did nothing happen" bug starts. */
/* Findings open at the RIGHT EDGE, not in the middle, and without a scrim.
   Every finding in here offers "Go to the wording", which scrolls the document
   and flashes the clause — behind a centred, scrimmed modal that was a jump you
   could not watch. See openSidePanel in js/core.js. */
function openCheckPanel(c,kind){
  const id=kind==='playbook'?'playbook-section':'scan-section';
  const title=kind==='playbook'?i18t('ct_playbook_review'):i18t('ct_risk_scan');
  if(window.openSidePanel) openSidePanel(`<div id="${id}"></div>`,{width:'400px',title,get label(){ return i18t('ct_checks'); }});
  else openModal(`<div style="padding:6px"><div id="${id}"></div></div>`,{maxWidth:'620px'});
  if(kind==='playbook') renderPlaybookSection(c); else renderScanSection(c);
  /* Both section renderers empty their host when there is nothing to show, and
     a full-height column of nothing is a worse answer than a sentence. The
     Checks card only opens this once something HAS run, so this is a backstop
     rather than a normal path — but a panel that can open blank will. */
  const host=document.getElementById(id);
  if(host && !host.innerHTML.trim()){
    host.innerHTML=`<p style="margin:0;font-size:12px;line-height:1.6;color:var(--color-neutral-600)">
      Nothing has been ${kind==='playbook'?'reviewed against the playbook':'scanned'} on this contract yet.
      Close this and press <b>${kind==='playbook'?i18t('ct_playbook_review'):i18t('ct_copilot_risk_scan')}</b> ${i18t('ct_in_checks_card')}</p>`;
  }
}
function wireChecksCard(c){
  const card=document.getElementById('checks-card'); if(!card) return;
  const editable=(typeof canEdit!=='function'||canEdit())&&c.status!=='Signed';
  card.querySelectorAll('[data-check]').forEach(b=>{
    const kind=b.getAttribute('data-check');
    const ran=!!checkVerdict(c,kind);
    /* Reading a finding is not editing. A viewer, and anyone on an executed
       contract, can still open what was found — they just cannot re-run it. */
    if(!editable&&!ran){ b.disabled=true; b.style.opacity='.45'; b.style.cursor='default';
      b.title='Read-only for your role, or this contract is executed'; return; }
    b.addEventListener('click',async()=>{
      if(ran) return openCheckPanel(c,kind);
      if(!editable) return;
      b.innerHTML=`<span style="opacity:.6">${i18t('ct_working')}</span>`; b.disabled=true;
      try{
        if(kind==='risk'){
          if(!window.runScanAct) throw new Error('unavailable');
          runScanAct(c);            // repaints the card itself when it lands
          return;
        }
        if(kind==='playbook'){
          if(!window.runPlaybookReview) throw new Error('unavailable');
          const res=await runPlaybookReview(c);
          if(res){ c.playbook=res; logAudit(c,'Playbook',`Reviewed against ${res.label} — ${deviationSummary(c).dev} deviation(s), ${deviationSummary(c).miss} missing`); persist(c); }
          renderChecksCard(c);
          if(window.renderSignButton) renderSignButton(c);
          openCheckPanel(c,'playbook');
          return;
        }
        /* The obligations branch lived here and has gone with its row — the
           sweep is run from the Obligations card on Key terms, which is where
           what it finds is read. runFindObligations itself is untouched; this
           card simply no longer offers a second door onto it. */
      }catch(e){
        toast(i18t('ct_check_unavailable'),'err');
        renderChecksCard(c);
      }
    });
  });
}
/* Draggable divider between the contract (left) and workspace (right). The
   contract takes about two thirds by default and drags either way — wider for
   reading, narrower to give the panel room. The chosen fraction is remembered
   per browser, so an existing choice survives a change of default. */
const DOC_FMIN = 0.50;                    // narrowest contract: an even split
const DOC_F0   = 2 / 3;                   // default left share (matches the 2fr:1fr grid)
const DOC_FMAX = 0.80;                    // widest contract
const DOC_GAP = 12;
const DOC_LEFT_MIN = 420;                 // neither column may be squeezed below
const DOC_RIGHT_MIN = 300;                // these widths, whatever the fraction says
function _docLeftFrac(){
  try{ const v=Number(lsGet('hati.v1.docLeftFrac')); return (v>=DOC_FMIN-0.001&&v<=DOC_FMAX+0.001)?v:DOC_F0; }catch(_){ return DOC_F0; }
}
function layoutDocResizer(){
  const grid=document.getElementById('doc-grid'), rez=document.getElementById('doc-resizer');
  if(!grid||!rez) return;
  /* ---- A HIDDEN PANE HAS NO WIDTH, AND NO WIDTH IS NOT ZERO ----
     Every other tab hides this one with display:none, and a hidden element
     reports clientWidth 0. Zero is below the two-column minimum, so this
     function did correct arithmetic on a meaningless number and wrote the
     STACKED layout — one column, the review panel dumped under the contract,
     the divider withdrawn. Nothing re-measured on the way back, so visiting Key
     terms and returning left the Document tab collapsed until a window resize.

     Measured: 881px + 441px before, a single 1334px column after.

     So: refuse to measure what is not on screen and leave the layout exactly as
     it was. applyWsTabs re-runs this the moment the tab is shown again, which
     is the first point at which there is a real width to read. */
  if(!grid.clientWidth) return;
  const avail=Math.max(1, grid.clientWidth - DOC_GAP);
  /* TWO COLUMNS NEED THE ROOM FOR TWO COLUMNS. Below the pair's own minimums
     the fraction was still splitting whatever was left, so on a small laptop
     the contract and the review panel each got half of far too little and both
     were unreadable. Under that floor they stack instead: the contract full
     width, the review panel beneath it, the divider withdrawn because there is
     no longer a gap to drag. This writes an inline style — as the whole
     function does — so it cannot be expressed as a media query. */
  if(avail < DOC_LEFT_MIN + DOC_RIGHT_MIN){
    grid.style.gridTemplateColumns='minmax(0,1fr)';
    /* Stacked, the two panes need room to be themselves rather than half a
       view each, so the grid itself takes the scroll and each pane keeps a
       readable minimum. */
    grid.style.gridAutoRows='minmax(360px,auto)';
    grid.style.overflowY='auto';
    rez.style.display='none';
    applyDocZoom();
    return;
  }
  grid.style.gridAutoRows='';
  grid.style.overflowY='';
  rez.style.display='flex';
  let leftPx=Math.round(_docLeftFrac()*avail);
  // On a narrow window the fraction alone would starve one side; pixels win.
  leftPx=Math.min(Math.max(leftPx,DOC_LEFT_MIN), avail-DOC_RIGHT_MIN);
  grid.style.gridTemplateColumns=leftPx+'px minmax(0,1fr)';
  rez.style.left=leftPx+'px';            // handle sits in the gap immediately right of the contract
  applyDocZoom();
}
/* The sheet is a fixed-width page and no wider however much room it is given.
   Left alone it would simply centre itself in a wide column, which is why
   widening the divider used to do nothing for legibility — it bought margin,
   not readable text. So the page (and the banners above it) scale up to fill
   the width instead: the same document, nearer the eye. Capped, or a maximised
   window would render a contract at poster size.
   DOC_PAGE_W is the page's border-box width — it sets the max-width in the
   markup below, so the two cannot drift apart. */
const DOC_PAGE_W = 660;
const DOC_ZOOM_MAX = 2.0;   // fills a 2560-wide window; past this it stops being a contract
function applyDocZoom(){
  const pane=document.getElementById('doc-scroll'), wrap=document.getElementById('doc-zoom');
  if(!pane||!wrap) return;
  const cs=getComputedStyle(pane);
  // clientWidth already excludes the scrollbar; the 2px keeps a rounding
  // overshoot from tipping the pane into a horizontal scroll.
  const room=pane.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
  const fit=Math.min(DOC_ZOOM_MAX, Math.max(1, room/DOC_PAGE_W));
  /* The reader's text-size preference — the A⁻/A⁺ stepper both tabs carry,
     persisted by the workbench (rlDocType, default 15) — multiplies the
     width-fit zoom, so one stored choice sizes the contract on the Doc tab
     and the Redline canvas alike. At the default it is exactly the old
     behaviour. */
  const pref=(window.rlDocType?rlDocType():15)/15;
  wrap.style.setProperty('--doc-zoom', (fit*pref).toFixed(3));
}
function wireDocResizer(){
  const grid=document.getElementById('doc-grid'), rez=document.getElementById('doc-resizer');
  if(!grid||!rez) return;
  const grip=rez.firstElementChild;
  const clamp=f=>Math.max(DOC_FMIN, Math.min(DOC_FMAX, f));
  layoutDocResizer();
  let startX=0, startFrac=DOC_F0;
  const onMove=e=>{ const x=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX);
    const avail=Math.max(1, grid.clientWidth - DOC_GAP);
    const frac=clamp(startFrac + (x-startX)/avail);
    try{ lsSet('hati.v1.docLeftFrac',frac); }catch(_){}
    layoutDocResizer(); };
  const onUp=()=>{ delete rez.dataset.drag; grip.style.background='var(--color-neutral-300)';
    document.body.style.cursor=''; document.body.style.userSelect='';
    window.removeEventListener('pointermove',onMove); window.removeEventListener('pointerup',onUp); };
  rez.addEventListener('pointerdown',e=>{ e.preventDefault(); rez.dataset.drag='1';
    startX=e.clientX; startFrac=_docLeftFrac();
    grip.style.background='var(--color-accent)'; document.body.style.cursor='col-resize'; document.body.style.userSelect='none';
    window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp); });
  rez.addEventListener('dblclick',()=>{ try{ lsSet('hati.v1.docLeftFrac',DOC_F0); }catch(_){} layoutDocResizer(); });
  if(!window._docResizeBound){ window._docResizeBound=true; window.addEventListener('resize',()=>{ if(state.view==='workspace') layoutDocResizer(); }); }
}
/* Returned changes, said out loud. An open negotiation round used to be visible
   only in the right-hand panel, below the playbook and the scan, so a contract
   could sit all day with a counterparty's redline waiting on it while the page
   said nothing above the fold. This strip belongs to the contract's state — it
   sits with the status bar, not on the paper, so it cannot be scrolled past. */
function openRounds(c){ return (c.rounds||[]).filter(r=>r.status==='open'); }
function returnedChangesStrip(c){
  const open=openRounds(c);
  if(!open.length) return '';
  const latest=open[open.length-1];
  const withText=open.filter(r=>r.proposedText).length;
  const who=esc(latest.by||'The counterparty');
  return `
    <div id="changes-strip" style="flex:none;display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:9px 16px;background:var(--st-amber-bg);border-top:1px solid var(--st-amber-line);border-bottom:1px solid var(--st-amber-line)">
      <span class="changes-pip" style="flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:var(--st-amber-dot);color:#fff;border-radius:999px;padding:3px 10px">${i18t('ct_changes_returned')}</span>
      <span style="font-size:12.5px;color:var(--st-amber-fg);min-width:0"><b>${who}</b> ${withText?'proposed edits':'requested changes'} — ${open.length} round${open.length===1?'':'s'} awaiting your decision.</span>
      <span style="flex:1"></span>
      <button id="changes-review" style="flex:none;font:inherit;font-size:12px;font-weight:600;border:1px solid var(--st-amber-dot);background:var(--color-surface);color:var(--st-amber-fg);border-radius:5px;padding:6px 13px;cursor:pointer">${withText?'Review changes':'Read the request'}</button>
    </div>
    <style>
      @keyframes changes-pulse{0%,100%{box-shadow:0 0 0 0 rgba(184,134,43,.55)}50%{box-shadow:0 0 0 6px rgba(184,134,43,0)}}
      #changes-strip .changes-pip{animation:changes-pulse 1.9s ease-out infinite}
      @media (prefers-reduced-motion:reduce){ #changes-strip .changes-pip{animation:none} }
    </style>`;
}
/* THE COUNTERPARTY HAS SAID THEY ARE READY, on the Docs page.

   The second of the three places this reaches the owner, and the one that
   matters most: a readiness signal that lived only inside the negotiation room
   would be found by opening the room, which is precisely the screen someone
   stops opening once the arguing is over.

   It sits with the returned-changes strip, in the contract's status band rather
   than on the paper, so it cannot be scrolled past. Its verb is the owner's:
   the deal does not advance by itself, and the wording says both that nothing
   is signed and what the next act is. */
/* The owner's "issue a signing link" act, from the strip or the room — one
   code path for both, as before, but now it asks the signing route FIRST.
   A route naming counterparty signers means the recipients were already
   decided, in order, with addresses (D5: signing is strict identity) — so the
   links are generated from it, bound and sequenced, and the dialog with its
   one hand-typed recipient is only the planless fallback (W7 fault 2). */
async function issueSigningAct(c){
  const supersededLine=()=>{
    logAudit(c,'Shared','A signing link was issued — the negotiation links on this contract are superseded and can no longer be answered');
    persist(c); renderWorkspace();
  };
  if(window.issueSigningRouteLinks){
    let out=null;
    try{ out=await issueSigningRouteLinks(c); }
    catch(e){ toast(e.message||'The signing links could not be issued','err'); return; }
    if(out && out.links){
      supersededLine();
      const held=out.links.filter(x=>x.heldForTurn).length;
      const first=out.links.find(x=>!x.heldForTurn);
      toast(first
        ? `${first.signer.name} ${first.emailSent?'has been emailed their own signing link':'gets their own signing link (nothing was emailed — check the outbox)'}${held?`; ${held} more release${held===1?'s':''} automatically as each signer signs`:''}`
        : 'Signing links created and held — they go out in order once internal signing is complete');
      return;
    }
    if(out && out.missingEmails){
      toast(`The signing route has no email address for ${out.missingEmails.map(s=>s.name).join(', ')} — add it to the route, or send a link by hand below`,'err');
    }
  }
  openShareModal(c,{ purpose:'sign', onSent(){ supersededLine(); } });
}
function readyToSignStrip(c){
  const sig=window.negoReadySignal?negoReadySignal(c,'counterparty'):null;
  if(!sig) return '';
  if(c.status==='Signed'||c.status==='Declined') return '';
  const when=window.fmtDT?fmtDT(sig.at):String(sig.at||'');
  const bits=[];
  if(sig.changes) bits.push(`${sig.changes} change${sig.changes===1?'':'s'} settled`);
  if(sig.accepted) bits.push(`${sig.accepted} adopted into the wording`);
  if(sig.withdrawn) bits.push(`${sig.withdrawn} ask${sig.withdrawn===1?'':'s'} withdrawn`);
  /* A signal the change set has since moved past stays on the strip and stops
     inviting the next step. Hiding it would lose the fact that they said it;
     leaving the button on it would have the owner issue a signing link for a
     contract that has gone back into negotiation. */
  const stale=!!sig.stale;
  return `
    <div id="ready-strip" data-stale="${stale?'1':'0'}" style="flex:none;display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:9px 16px;background:${stale?'var(--st-amber-bg)':'var(--st-green-bg)'};border-top:1px solid ${stale?'var(--st-amber-line)':'var(--st-green-line)'};border-bottom:1px solid ${stale?'var(--st-amber-line)':'var(--st-green-line)'}">
      <span style="flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:${stale?'var(--st-amber-dot)':'var(--st-green-fg)'};color:#fff;border-radius:999px;padding:3px 10px">${i18t('ct_ready_to_sign')}</span>
      <span style="font-size:12.5px;color:${stale?'var(--st-amber-fg)':'var(--st-green-fg)'};min-width:0"><b>${esc(sig.by||c.counterparty||i18t('ct_the_counterparty_cap'))}</b> ${i18t('ct_ready_to_sign_signal',{when:esc(when)})}${bits.length?` · ${esc(bits.join(', '))}`:''}. <b>${i18t('ct_nothing_signed')}</b>${stale?' Something has been reopened since, so this no longer describes where the deal stands.':''}</span>
      <span style="flex:1"></span>
      ${canEdit()&&!stale?`<button id="ready-issue" style="flex:none;font:inherit;font-size:12px;font-weight:600;border:1px solid var(--st-green-fg);background:var(--st-green-fg);color:#fff;border-radius:5px;padding:6px 13px;cursor:pointer">${i18t('ct_issue_signing_link')}</button>`:''}
    </div>`;
}
/* The strip's one action: open the redline if there is one, otherwise take the
   reader to the round itself rather than leaving the button doing nothing. */
function wireChangesStrip(c){
  document.getElementById('changes-review')?.addEventListener('click',()=>{
    const open=openRounds(c);
    const redline=open.slice().reverse().find(r=>r.proposedText);
    if(redline && window.reviewProposedRound) return reviewProposedRound(c, redline.n);
    _docTopTab='screening'; applyDocTabs();
    document.getElementById('nego-section')?.scrollIntoView({behavior:'smooth',block:'center'});
  });
  document.getElementById('ready-issue')?.addEventListener('click',()=>{
    /* The same act as the room's button, and deliberately the same code path —
       two ways to reach one thing, not two things that could drift. */
    issueSigningAct(c);
  });
}
/* ---- the header, folded away ----
   Collapsing keeps what tells you WHERE YOU ARE — the contract's name, its
   status, the way back — and folds what you use to ACT on it. The two are
   different jobs, and only one of them is wanted while you are reading.

   The Copilot button stays out too: it is the one action you reach for while
   reading rather than while deciding.

   Per user, not per contract: someone who reads more than they act wants it
   folded on every contract they open, and being asked again on each one is the
   friction this removes. */
const WS_FOLD_KEY = () => { const u=(typeof currentUser==='function')&&currentUser();
  return 'hati.v1.wsChrome.'+((u&&u.id)||'anon'); };
const wsChromeFolded = () => { try{ return !!lsGet(WS_FOLD_KEY()); }catch(_){ return false; } };
function applyWsCollapse(){
  const on=wsChromeFolded();
  /* Restore the element's OWN display, not a bare '' — setting display:'' on
     unfold wipes the inline `display:flex` these rows are laid out with, which
     turns the status strip into a block and its flex spacer to zero width. */
  document.querySelectorAll('[data-ws-fold]').forEach(el=>{ el.style.display=on?'none':(el.getAttribute('data-ws-display')||''); });
  const btn=document.getElementById('ws-collapse');
  if(btn){
    btn.setAttribute('aria-expanded', on?'false':'true');
    btn.title=on?i18t('ct_show_toolbar'):i18t('ct_collapse_bar');
    /* THE LABEL COMES BACK WITH THE ICON. This wrote the icon ALONE into the
       row, so the menu carried a line holding nothing but a dash — no words at
       all — which is what the owner photographed. Same fault as Focus mode
       beside it: a row that relabels itself has to rewrite the whole row. */
    btn.innerHTML=`${icon(on?'plus':'minus','w-3.5 h-3.5')}${on?'Show the header':'Collapse the header'}`;
  }
}
function wireWsCollapse(c){
  applyWsCollapse();
  document.getElementById('ws-collapse')?.addEventListener('click',()=>{
    try{ lsSet(WS_FOLD_KEY(), !wsChromeFolded()); }catch(_){}
    applyWsCollapse();
  });
}

/* THE EXPORT MENU IS THE "⋯" MENU NOW. PDF, Word and the sealed Record were
   a caret button of their own on a header that already had eight; they are
   three items in the room's overflow, keeping the ids they always had (ws-pdf,
   ws-word, ws-pdf-record) so every handler and every test presses exactly the
   control it always pressed. Opening and closing is wireRoomHead's job. */
/* ---- WORD, WITH THE REDLINES AS REAL TRACKED CHANGES ----
   The same writer the Doc Lab proved out (docxExportTracked), reconnected to
   a reachable button: the redline as the owner sees it, as a .docx a
   counterparty can accept and reject in their own copy of Word. The whole
   document, not one clause — a tracked-changes file with three clauses in it
   is not the agreement. */
function exportWordTracked(c){
  if(!window.docxExportTracked||!window.redlineDocHtml){ toast(i18t('ct_word_writer_missing'),'err'); return; }
  let out;
  try{
    const html=redlineDocHtml(c,{side:'owner'});
    out=docxExportTracked(html,{author:(currentUser()&&currentUser().name)||'HaTi'});
  }catch(e){ toast(i18t('ct_word_write_failed')+((e&&e.message)||e),'err'); return; }
  const name=`${c.id}-redline.docx`;
  try{
    const blob=new Blob([out.bytes],{type:window.DOCX_MIME||'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }catch(e){ toast(i18t('ct_download_failed')+((e&&e.message)||e),'err'); return; }
  logAudit(c,'Export',`Word export — ${name}`+(out.tracked&&(out.tracked.ins||out.tracked.del)
    ?` carrying ${out.tracked.ins} insertion${out.tracked.ins===1?'':'s'} and ${out.tracked.del} deletion${out.tracked.del===1?'':'s'} as tracked changes`
    :' (no redlines — clean wording)'));
  persist(c);
  toast(out.tracked&&(out.tracked.ins||out.tracked.del)
    ? `${name} — ${out.tracked.ins} insertion${out.tracked.ins===1?'':'s'} and ${out.tracked.del} deletion${out.tracked.del===1?'':'s'}, as Word tracked changes`
    : `${name} — no redlines on this document, so it exports as clean wording`);
}

/* ---- FOCUS MODE, THE DOC PAGE'S OWN ----
   The Redline page's focus button, on this tab: hide the header card and the
   strips, give the room to the document. The button lives on the tab row —
   which stays — because a control that hides itself cannot be pressed again
   (the collapse button above learned the same lesson). A posture, not a
   setting: it resets when the reader moves to another contract. */
let _wsFocus=false,_wsFocusFor=null;
/* ---- FOCUS MODE HAD NO EXIT ----
   It hides the header, and the only switch was the one inside the header it
   had just hidden. There was no key out either. A reader who pressed it was
   stuck until they opened a different contract and came back — which is not a
   mode, it is a trap.

   Two ways out now, the same two the negotiation workbench has always had: a
   chip that stays on the page, and Escape. The chip is created on entry and
   removed on exit, so it costs nothing when focus is off. */
function wsFocusChip(){
  let chip=document.getElementById('ws-focus-out');
  if(!_wsFocus){ if(chip) chip.remove(); return; }
  if(chip) return;
  chip=document.createElement('button');
  chip.id='ws-focus-out';
  chip.type='button';
  chip.className='ui-btn ui-btn-primary';
  chip.title='Exit focus mode and bring the header back (Esc)';
  chip.style.cssText='position:fixed;right:18px;bottom:18px;z-index:70;font-size:12px;padding:8px 14px;box-shadow:var(--shadow-md)';
  chip.innerHTML='Exit focus &middot; Esc';
  chip.addEventListener('click',()=>{ _wsFocus=false; applyWsFocus(); });
  document.body.appendChild(chip);
}
let _wsFocusKeyWired=false;
function applyWsFocus(){
  const head=document.getElementById('ws-head');
  if(head) head.style.display=_wsFocus?'none':'';
  const strips=document.getElementById('ws-strips');
  if(strips) strips.style.display=_wsFocus?'none':'contents';
  const b=document.getElementById('ws-focus');
  if(b){
    b.setAttribute('aria-pressed',_wsFocus?'true':'false');
    /* innerHTML, not textContent. Assigning textContent to relabel this row
       DELETED the row — the icon and the "Esc to leave" hint are child
       elements, and textContent replaces every child with one text node. This
       runs on every render, so Focus mode was the one line in the menu with no
       symbol beside it and no hint after it, from the moment it was built. */
    b.innerHTML=`${icon('scan','w-3.5 h-3.5')}${_wsFocus?'Exit focus mode':'Focus mode'}<span class="mnote">${i18t('ct_esc_to_leave')}</span>`;
    b.title=_wsFocus?i18t('ct_exit_focus'):i18t('ct_focus_mode');
  }
  wsFocusChip();
}
function wireWsFocus(c){
  if(_wsFocusFor!==c.id){ _wsFocus=false; _wsFocusFor=c.id; }
  document.getElementById('ws-focus')?.addEventListener('click',()=>{ _wsFocus=!_wsFocus; applyWsFocus(); });
  /* Bound ONCE on the document, not per paint: this page rebuilds itself on
     every save, and a listener per paint is a leak. */
  if(!_wsFocusKeyWired){
    _wsFocusKeyWired=true;
    document.addEventListener('keydown',e=>{
      if(e.key!=='Escape'||!_wsFocus) return;
      const t=e.target;
      if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName||'')) return;
      if(t&&t.isContentEditable) return;
      _wsFocus=false; applyWsFocus();
    });
  }
  applyWsFocus();
}

/* ---- THE ROOM'S HEAD — ONE BUILDER, BOTH SHELLS ----
   Like the tab row: the contract page and the negotiation workbench each drew
   their own version of this, so the furniture moved when the work did.

   THE TOOLBAR IS GONE. It carried Share, Import, Save-as-template, Compare,
   History, Export, Delete, Draft-new-agreement and a collapse — nine controls
   over the top of every contract, competing with the contract's own name for
   the eye. What is left is the name, said large, and the three acts a reader
   reaches for from here: the overflow, Share, and whatever this contract needs
   done next. Every other verb is inside the "⋯", with the id it always had, so
   nothing was removed and nothing that pressed one of them has to change. */
function roomHeadHtml(c,opts={}){
  const _wr=state.wsReturn||{};
  /* window.FOLDERS, not the bare global. The negotiation workbench calls this
     builder too, and its test stage loads the engine without the folder model
     — a head that throws there takes the whole page with it. */
  const F=(typeof window!=='undefined'&&window.FOLDERS)||{};
  const backLabel=(_wr.view==='folder'&&_wr.folderId&&F[_wr.folderId])
    ? i18t('ct_back_to',{where:F[_wr.folderId].name})
    : i18t('ct_back_to',{where:({register:i18t('ct_back_register'),pipeline:i18t('ct_back_queue'),intel:i18t('ct_back_intel'),calendar:i18t('ct_back_calendar'),dashboard:i18t('ct_back_portfolio'),reports:i18t('ct_back_reports'),advice:i18t('ct_back_advice')}[_wr.view]||i18t('ct_back_register'))});
  const may=(typeof canEdit!=='function')||canEdit();
  const locked=c.status==='Signed';
  /* The primary is the CONTRACT'S next act, read from wsNextAction — the same
     read the quiet line under the tabs states in words. On a contract waiting
     to go out that is "Send to counterparty"; on one waiting on a decision it
     is the decision. A head whose big button is always the same button is a
     head that has stopped paying attention. */
  /* Only worked out when this head is being asked for its OWN primary. The
     workbench passes its own (Publish Round), and wsNextAction reaches across
     half the app to answer — so asking it for a button that is about to be
     thrown away is both waste and, on a stage that has not loaded that half,
     a crash. */
  let primary='';
  if(opts.primary===undefined){
    const na=(!locked&&may&&window.wsNextAction)?wsNextAction(c):null;
    primary=locked
      ? `<button id="ws-evidence" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:7px 14px">${icon('download','w-3.5 h-3.5')} Evidence pack</button>`
      /* A next action may have no button of its own — see wsNextAction's
         intent-to-sign branch. It still answers the status line; it just does
         not earn the head's primary slot. */
      : (na && !na.noButton) ? `<button id="ws-next-action" data-na="${na.kind}" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:7px 14px">${icon(na.ic,'w-3.5 h-3.5')} ${na.label}</button>`
      : '';
  }
  /* ---- DRAFT NEW AGREEMENT SITS AFTER THE CONTRACT'S OWN NEXT ACT ----
     It was at the foot of the Document tab's right-hand column, which meant it
     only existed on one of the five tabs and only after a scroll. It is the
     thing you do once this contract is dealt with, so it belongs beside the
     act that deals with it — one place, on every tab, always in view.

     SOLID GREEN, as asked. I had it as a green outline on the reasoning that
     one filled button per head keeps the hierarchy — the owner's call is that
     starting the next agreement is a first-class act on this platform and
     should look like one. Share is filled too now, on the same call (09 Aug
     2026): the head carries the acts, and an act drawn as an outline beside two
     filled ones reads as the one you are not meant to press.

     Only where this head owns its primary. The negotiation workbench passes
     its own (Publish Round) and is a working surface, not a landing — offering
     to start a different agreement mid-round is noise. */
  const newBtn=(opts.primary===undefined&&may&&!(typeof PORTAL_MODE!=='undefined'&&PORTAL_MODE))
    ? `<button id="ws-new" data-page-new class="ui-btn ui-btn-primary room-new" style="font-size:12.5px;padding:7px 14px">${icon('plus','w-3.5 h-3.5')} ${i18t('home_draft_new')}</button>`
    : '';
  return `<section class="room-head" id="ws-head">
    <button id="ws-back" title="${backLabel}" class="ui-btn room-back">${icon('arrowLeft','w-4 h-4')}</button>
    <div class="room-id">
      <div class="room-name">
        <h1>${esc(c.name)}</h1>
        <span id="ws-status" style="flex:none">${window.contractStatusChip?contractStatusChip(c)
          :(window.statusChip?statusChip(c.status):esc(c.status||''))}</span>
      </div>
      ${''/* ---- THE ROUND READS WITH THE OTHER FACTS ABOUT THE CONTRACT ----
             It used to be an amber chip at the end of the workbench's tab row,
             which is navigation furniture, and it appeared on one of the five
             tabs. Where a negotiation is actually running the round is a fact
             about this agreement exactly like its stream and its value, so it
             reads here — on every tab, from one line (Young, 10 Aug 2026).
             Drawn only where there IS a negotiation: "Round 1" over a draft
             nobody has redlined is a number about nothing. */}
      <div class="room-sub">${c.id}${F[c.folder]?' · '+esc(F[c.folder].name):''}${
        (c.negotiation&&window.negoRound)?' · '+i18t('ct_round_n',{n:negoRound(c)}):''}${
        ''/* `typeof`, not window: fmtMoney is a top-level const in
              js/jurisdiction.js and a const is a LEXICAL binding, not a
              property of window — the trap THE MAP records against currentUser
              and friends. A bare call from a stage that has not loaded that
              file is a ReferenceError that takes the whole head down. */}${
        (typeof fmtMoney==='function'&&Number(c.value)>0)?' · '+esc(fmtMoney(c.value)):''}${
        c.lastAction?' · '+i18t('ct_updated_on',{when:esc(c.lastAction)}):''}</div>
    </div>
    <div class="room-acts">
      ${''/* ---- THE DESK, AND IT COSTS THE PAGE ONE CONTROL ----
             Who leads this negotiation is a FACT about the contract, like its
             value and its stream, so it sits with the other facts rather than
             in a band of its own above the document. Both this page and the
             negotiation workbench call roomHeadHtml, so the desk appears on
             both from one line. See the note above deskChipHtml for the space
             budget this is drawn to. */}
      ${(window.deskChipHtml?deskChipHtml(c,opts):'')}
      <div style="position:relative;flex:none">
        <button id="ws-more" class="ui-btn" aria-haspopup="true" aria-expanded="false"
          title="${i18t('ct_everything_else')}" style="width:34px;height:34px;padding:0;font-size:15px;line-height:1">&#8943;</button>
        ${''/* WRITTEN OUT, not built by a loop. Every id below is the id the
               control had on the old toolbar, and half the test suite reaches
               for them by name in this file's SOURCE — a helper that assembled
               `id="..."` at runtime would leave those names nowhere a reader
               (or a grep) could find them. */}
        ${''/* GROUPED, AND WITH SOMETHING TO AIM AT. This was nine items in one
               weight, no icons, and a stray em-dash where a note failed to
               render — so exporting, editing and destroying all looked the
               same. Three named groups, an icon on each row, and Delete alone
               at the foot in its own colour. Every id is the id it has always
               had. */}
        <div id="ws-more-menu" class="room-menu hidden">
          <div class="mgroup">${i18t('ct_this_contract')}</div>
          ${may?`<button type="button" id="ws-import" title="${i18t('ct_read_word_back')}">${icon('download','w-3.5 h-3.5')}Import their response</button>`:''}
          <button type="button" id="ws-compare" title="${i18t('ct_compare_review')}">${icon('columns','w-3.5 h-3.5')}Compare versions</button>
          ${may?`<button type="button" id="ws-tpl" title="${i18t('ct_save_as_reusable')}">${icon('copy','w-3.5 h-3.5')}Save as template</button>`:''}
          <hr>
          <div class="mgroup">${i18t('ct_export')}</div>
          <button type="button" id="ws-pdf" title="${i18t('ct_clean_copy')}">${icon('printer','w-3.5 h-3.5')}PDF<span class="mnote">clean copy</span></button>
          <button type="button" id="ws-word" title="${i18t('ct_redline_word')}">${icon('file','w-3.5 h-3.5')}Word<span class="mnote">tracked changes</span></button>
          ${(window.printIsHatiExecuted&&printIsHatiExecuted(c))?`<button type="button" id="ws-pdf-record" title="The full record for your own file — the document plus HaTi's seal and the audit trail">${icon('shield','w-3.5 h-3.5')}Record<span class="mnote">sealed + audit</span></button>`:''}
          <hr>
          <div class="mgroup">${i18t('ct_view')}</div>
          <button type="button" id="ws-focus" aria-pressed="false" title="${i18t('ct_hide_header')}">${icon('scan','w-3.5 h-3.5')}Focus mode<span class="mnote">${i18t('ct_esc_to_leave')}</span></button>
          <button type="button" id="ws-collapse" aria-expanded="true" title="${i18t('ct_collapse_bar')}">${icon('minus','w-3.5 h-3.5')}${i18t('ct_collapse_the_header')}</button>
          ${(may&&(c.status==='Draft'||c.status==='Under Review'))?`<hr>
          <button type="button" id="ws-delete" class="danger" title="${i18t('ct_delete_draft')}">${icon('trash','w-3.5 h-3.5')}${i18t('ct_delete_this_draft')}</button>`:''}
          ${''/* ws-new keeps its id and its data-page-new: it is a real button
                 on the Document tab now, so it is not repeated here. */}
        </div>
      </div>
      ${''/* SOLID GREEN, on the owner's call (Young, 09 Aug 2026) — "make the
             Share buttons both in Document and Negotiate tabs visible in green
             like the other buttons". It was the head's one plain outline, and
             beside two filled greens it read as a lesser control than Save as
             template in the ⋯ menu, which is the opposite of what sending a
             contract to the other side is worth.

             ONE BUTTON, BOTH TABS. roomHeadHtml is drawn by renderWorkspace
             (Document, Key terms, Signing, History) AND by renderRedline
             (Negotiate) — there is no second Share markup anywhere, so this is
             the whole of the change. See THE MAP's five-tabs section. */}
      ${may?`<button id="ws-share" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:7px 14px" title="${esc(i18t('ct_share_with_cp'))}">${icon('share','w-3.5 h-3.5')} ${i18t('ct_share')}</button>`:''}
      ${opts.primary===false?'':(typeof opts.primary==='string'?opts.primary:primary)}
      ${newBtn}
    </div>
  </section>`;
}
/* Opening and closing the "⋯". The items themselves are wired where they
   always were — ws-share, ws-import, ws-compare and the exports keep their
   ids, so wireWorkspaceActions binds them without knowing they moved. */
function wireRoomHead(c){
  const btn=document.getElementById('ws-more'), menu=document.getElementById('ws-more-menu');
  if(btn&&menu){
    const shut=()=>{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
    btn.addEventListener('click',e=>{ e.stopPropagation();
      const open=menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded',open?'false':'true'); });
    menu.addEventListener('click',()=>setTimeout(shut,0));
    document.addEventListener('click',ev=>{ if(!menu.contains(ev.target)&&ev.target!==btn) shut(); });
  }
  document.getElementById('ws-back')?.addEventListener('click',()=>{
    const r=state.wsReturn||{};
    if(r.view==='folder'&&r.folderId&&window.FOLDERS&&FOLDERS[r.folderId]){ state.folderId=r.folderId; setView('folder'); }
    else setView(r.view&&r.view!=='workspace'?r.view:'register');
  });
  /* ---- DELETE BELONGS TO THE HEAD, NOT TO ONE OF THE TABS THAT WEARS IT ----
     roomHeadHtml draws this menu for BOTH the Document tab and the Negotiate
     workbench, but each tab used to wire the menu's buttons for itself, and
     the workbench's list — ws-share, ws-import, ws-compare, ws-pdf, ws-word,
     ws-tpl, ws-focus, ws-collapse — simply did not include ws-delete. So on
     Negotiate the item rendered, opened nothing, said nothing and did nothing.
     A dead button is worse than a missing one: it reads as a refusal, and a
     refusal with no reason is something you try again.

     It is wired HERE, in the one function both views call, so it cannot come
     apart again. deleteContract already explains every refusal it makes — a
     viewer's role, a status past review, or the server's own answer for an
     executed agreement — and none of those messages could be reached from
     this tab before, because the click never arrived. */
  document.getElementById('ws-delete')?.addEventListener('click',()=>
    deleteContract(c.id).then(ok=>{ if(ok) setView('register'); }));
}

function renderWorkspace(){
  const c=getContract(state.activeId);
  const content=document.getElementById('content');
  if(!c){
    content.innerHTML=`
    <div class="view-enter grid place-items-center min-h-screen px-8">
      <div class="text-center max-w-sm">
        <div class="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-white border border-brand-100 text-brand-300 mb-4">${icon('file','w-7 h-7')}</div>
        <h2 class="font-display font-600 text-lg text-brand-900">${i18t('ct_no_contract_open')}</h2>
        <p class="text-sm text-brand-800/70 mt-1">${i18t('ct_open_folder_or_template')}</p>
        <button onclick="setView('dashboard')" class="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-800 transition">${icon('grid')} ${i18t('ct_go_to_dashboard')}</button>
      </div>
    </div>`;
    setActiveNav('workspace'); return;
  }
  // load the full contract body (comments, audit, execution text, extracted text) on first open
  if(API_MODE() && !c._loaded){
    /* No view-enter on the placeholder: opening a contract painted twice —
       spinner fading in, then the real page fading in over it — and the two
       back-to-back intros read as a double flash. The spinner appears plainly;
       at most one intro plays, on the page itself. */
    content.innerHTML=`<div class="grid place-items-center min-h-screen"><div class="text-center text-brand-800/70"><div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"></div><div class="text-sm">${i18t('ct_loading_contract')}</div></div></div>`;
    setActiveNav('workspace');
    ensureFull(c).then(()=>{ if(state.activeId===c.id) renderWorkspace(); })
      .catch(e=>{ if(state.activeId===c.id) content.innerHTML=`<div class="grid place-items-center min-h-screen text-sm text-rose-600">${i18t('ct_could_not_load',{err:e.message})}</div>`; });
    return;
  }
  const locked=c.status==='Signed';
  /* The sheet's own rules — the front matter, the parties' lines at the foot —
     live with the workbench because both tabs draw them from one builder. The
     call is idempotent and it is made BEFORE the paint, so the first render of
     a contract is not a frame of unstyled front matter. */
  if(window.redlineLayoutCss) redlineLayoutCss();
  /* Industry design-system tokens — inline styles per the design handoff.
     12px and a hairline lift, matching the change cards and the queue on the
     Negotiate tab: the two tabs are one room and their objects should be the
     same objects (Young, 10 Aug 2026). */
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:0 1px 2px rgba(15,23,42,.05);border-radius:12px';
  const H6='margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
  const KROW='display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);font-size:11.5px';
  const KKEY='color:var(--color-neutral-600);flex:none';
  const kv=(k,v)=>`<div style="${KROW}"><span style="${KKEY}">${k}</span><span style="font-weight:500;text-align:right;min-width:0">${v}</span></div>`;
  const KIN='min-width:0;max-width:62%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:3px 7px;font:inherit;font-size:11.5px;text-align:right;outline:none';
  const tmplLabel=c.template?((window.TEMPLATES&&TEMPLATES[c.template]&&TEMPLATES[c.template].name)||c.template):(isUpload(c)?'Uploaded document':'—');
  // Key terms stay editable until the seal binds them (sealString folds
  // counterparty/value/valueType in), and only for roles that can edit.
  const ktEditable=!locked&&canEdit()&&!PORTAL_MODE;
  const ktReadable=((isUpload(c)?(c.upload&&c.upload.extractedText):(window.docPlainText?docPlainText(c):''))||'').length>200;
  // Back returns to wherever the workspace was opened from (register/folder/queue…),
  // defaulting to the register. state.wsReturn is captured in setView.
  const _wr=state.wsReturn||{};
  const backLabel=(_wr.view==='folder'&&_wr.folderId&&FOLDERS[_wr.folderId])
    ? i18t('ct_back_to',{where:FOLDERS[_wr.folderId].name})
    : i18t('ct_back_to',{where:({register:i18t('ct_back_register'),pipeline:i18t('ct_back_queue'),intel:i18t('ct_back_intel'),calendar:i18t('ct_back_calendar'),dashboard:i18t('ct_back_portfolio'),reports:i18t('ct_back_reports'),advice:i18t('ct_back_advice')}[_wr.view]||i18t('ct_back_register'))});
  content.innerHTML=`
  <div class="view-enter" style="height:var(--view-h);box-sizing:border-box;padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px">

    <!-- ============ THE ROOM'S HEAD ============
         Built by roomHeadHtml, which the negotiation workbench calls too, so
         the furniture holds still while the tabs change what is under it. The
         nine-button toolbar that used to live here is inside its "⋯". -->
    ${roomHeadHtml(c)}

    <div id="ws-strips" style="display:contents">${readyToSignStrip(c)}${returnedChangesStrip(c)}</div>

    <!-- ============ THE ROOM'S TABS ============
         Five faces of one contract: read it, negotiate it, check its terms,
         sign it, read its story. Built by roomTabsHtml, which the negotiation
         workbench calls too — the row is drawn once and appears on both.

         Negotiate hands the contract to the workbench at view-redline (the tab
         a lawyer would call "redline"; the internal key keeps that name),
         where the wording is negotiated as tracked changes with a fingerprint
         on each. The count beside it says how many, and goes amber when some
         of them are waiting on this reader.

         The status strip ("Drafting — add the counterparty and value…") sits
         on its own quiet line below, not inside this row: five tabs and a
         status sentence on one line is a line that wraps, and a wrapped tab
         row puts its underline in the middle of the strip. -->
    <div class="room-tabrow" style="display:flex;align-items:center;gap:14px;flex:none;border-bottom:1px solid var(--color-divider)">
      ${roomTabsHtml(c,_wsTab)}
      <span style="flex:1"></span>
      ${''/* The text-size stepper, and — at the far right — the one door off
             this tab. The band that used to carry that door is gone (see
             actionBarHtml), so it rides here, where a reader looking for
             somewhere to go already looks.

             FILLED, LIKE DRAFT NEW AGREEMENT, on the owner's call (Young,
             10 Aug 2026). It is a real act rather than a way of looking, and
             on this head an act is drawn solid.

             Only where a negotiation is actually running: on a fresh draft the
             head's own primary is the next thing to do, and a second answer to
             that question beside it is noise. */}
      ${(_wsTab==='docs'&&window.rlTypeStepHtml)?rlTypeStepHtml():''}
      ${(_wsTab==='docs'&&c.negotiation&&window.negoChanges&&negoChanges(c).length)
        ? `<button type="button" id="ws-to-nego" class="ui-btn ui-btn-primary" style="flex:none;font-size:12.5px;padding:7px 14px">${i18t('ct_open_negotiate')}</button>`
        : ''}
    </div>

    <!-- The quiet line under the tabs: where this contract stands, what it
         needs next, and the one button that does it. Its own row, because five
         tabs and a sentence on one line is a line that wraps — and a wrapped
         tab row leaves its underline stranded in the middle of the strip. -->
    <div id="ws-actionbar" class="room-quiet" data-ws-fold="strip" data-ws-display="flex" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">${actionBarHtml(c)}</div>

    <!-- ============ BODY: contract (left) · workspace (right) — the divider sets how wide the contract runs ============ -->
    <div id="doc-grid" data-ws-pane="docs" style="position:relative;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px">

      <!-- LEFT: document
           ---- THE SHEET SITS ON THE PAGE, NOT IN A CARD ----
           This pane used to be a bordered white card holding a white sheet: a
           box inside a box, and the reason the paper never read as paper. The
           card chrome is off (Young, 10 Aug 2026) and the sheet carries the
           whole of the object — warm ground, warm hairline, a long soft lift —
           exactly as the negotiation workbench draws it, from the same tokens.
           Same arrangement on both tabs, so switching moves the work and not
           the furniture. -->
      <section style="overflow:hidden;display:flex;flex-direction:column;min-height:0">
        <!-- document body (scrolls within the left pane) -->
        <div id="doc-scroll" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:4px 2px 24px">
          <!-- The page and its banners scale together to fill whatever width the
               divider gives them (see applyDocZoom), so a wider contract is a
               bigger contract rather than a wider margin. -->
          <div id="doc-zoom" style="zoom:var(--doc-zoom,1)">
          ${''/* THE SECOND EXPLANATORY BAR IS GONE. The quiet line under the
                 tabs already says how this tab reads and how to leave it; a
                 copy of the same sentence pinned over the paper was two
                 strips of explanation before the first word of a contract.
                 The two states that are NOT about the reading rule — an
                 executed document, and a received one — still say so here,
                 because those are facts about the paper itself. */}
          ${locked?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-900 text-brand-100 px-3 py-2 text-[11px]" style="max-width:660px;margin:0 auto 14px">${icon('lock','w-3.5 h-3.5')}<span>This document is executed and locked.${isUpload(c)?' The sealed file is bound by its SHA-256 fingerprint.':' Fields are read-only.'}</span></div>`
            :isUpload(c)?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('scan','w-3.5 h-3.5')}<span>${i18t('ct_received_read_below')}</span></div>`
            :''}
          ${''/* THE PROVENANCE LINE HAS LEFT THE SPACE ABOVE THE PAPER. It read
                 "Created from WH v1 — editing the template later does not
                 change this contract", as a second full-width band between the
                 tabs and the agreement. It is a fact about where this contract
                 CAME FROM, not about the wording in front of you, so it reads
                 with the contract's other facts in the right-hand column
                 (Young, 10 Aug 2026: "open this space up for the contract
                 exclusively"). Same builder, same words, one column across. */}
          <div class="blueprint"${window.docDesignPaperAttr&&window.resolveDocBranding?docDesignPaperAttr(resolveDocBranding(c)):''} style="background:var(--color-doc-warm);border-color:var(--color-doc-warm-line);box-shadow:var(--shadow-paper);padding:34px 40px 44px;max-width:${DOC_PAGE_W}px;margin:0 auto;border-radius:14px;${window.docDesignPaperStyle&&window.resolveDocBranding?docDesignPaperStyle(resolveDocBranding(c)):''}">
            ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c,{bleedX:40,bleedY:34}):''}
            <article id="doc-canvas" class="doc-surface" style="background:transparent">${docFillable(c)?docBodyStructured(c):readOnlyDocHtml(docBodyStructured(c))}</article>
            ${''/* The parties' lines at the foot are NOT drawn here. Every
                   document body this tab can render ends with signatureBlock,
                   and that is where they are — one foot per contract, not two
                   stacked because two files each thought it was theirs. */}
            ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
          </div>
          </div>
        </div>
      </section>

      <!-- ============ RIGHT: what you do to the contract while you read it ============
           The Screening|Signing pair that used to head this column is gone —
           both of them became tabs of the room. What is left is one column
           about the document in front of you: the checks you run on it, and
           the conversation your own side is having about it. -->
      <section id="doc-right" class="scroll-thin" style="display:flex;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;padding-right:2px">

        <div style="display:flex;flex-direction:column;gap:12px">
          <!-- ---- CHECKS: THREE ROWS, NOT THREE CARDS ----
               The playbook review and the Copilot scan each used to open a
               full card carrying a paragraph of explanation and a filled
               button, before either had been run — two thirds of this column
               spent describing work nobody had asked for yet. They are rows
               now. Each one's RESULTS still open into the full card below,
               which is what those cards were always for. -->
          <!-- ---- FILL THE CONTRACT IN, THEN CHECK IT ----
               Checks sat above the contract form, which put the reviewing
               before the writing: a form reading "0 of 26 required filled" had
               three Run buttons above it offering to review a document that
               did not exist yet. Nothing they returned could have been true.

               The form comes first now, and Checks follows it — the order the
               work is actually done in. Checks is not hidden or disabled while
               the form is open (a contract from a plain template has no form at
               all, and an uploaded one is complete on arrival), but it does say
               so: see checksRowsHtml, which counts the unfilled fields. -->
          <!-- template form: the open fields of a library-template contract -->
          <div id="tplform-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          ${''/* Where this contract came from. Quiet, because it is a thing you
                 check once — and it says the one thing that is easy to get
                 wrong, which is that a template revised later does not revise
                 the contracts already made from it. */}
          ${templateProvenanceHtml(c)}
          <section id="checks-card" style="${CARD};padding:13px 15px">
            <h6 style="margin:0;font-size:13px;font-weight:700;font-family:var(--font-heading)">${i18t('ct_checks')}</h6>
            <p data-checks-note style="font-size:11.5px;color:var(--color-neutral-600);margin:4px 0 2px;line-height:1.5">${checksNoteHtml(c)}</p>
            <div data-checks-rows>${checksRowsHtml(c)}</div>
          </section>
          ${''/* THE RESULTS CARDS HAVE LEFT THIS COLUMN. They open over the
                 page from the rows above — see openCheckPanel — because a
                 finding is something you read and act on, not something that
                 lives in the sidebar forever repeating a verdict the row can
                 say in three words. Their ids move with them; they are not
                 declared twice. */}

          <!-- collaborate & negotiate -->
          ${''/* The role chip that used to sit beside every name is gone. It was
                 a bordered pill per message, on a column of messages, doing the
                 work one line of quiet grey text does — and it made three
                 comments read as nine competing objects. Name, then role and
                 when, then what they said: the shape every message list has. */}
          <section style="${CARD};padding:12px 14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <h6 style="${H6};flex:1">${i18t('ct_activity_comments')}</h6>
              <span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;color:var(--st-green-fg);font-weight:600"><span class="live-dot" style="height:6px;width:6px;border-radius:9999px;background:var(--st-green-dot);display:inline-block"></span>${i18t('ct_live')}</span>
            </div>
            <div id="feed" class="scroll-thin" style="max-height:300px;overflow-y:auto;padding-right:4px;display:flex;flex-direction:column;gap:14px"></div>
            <div style="margin-top:12px;padding-top:11px;border-top:1px solid var(--color-divider)">
              <div style="font-size:10.5px;color:var(--color-neutral-500);margin-bottom:7px">${i18t('ct_commenting_as')} <span style="font-weight:600;color:var(--color-text)">${currentUser()?.name||'you'}</span> · internal</div>
              <div style="display:flex;gap:7px">
                <textarea id="comment-input" class="chat-field" rows="1" placeholder="${i18t('ct_add_comment')}" title="${i18t('ct_internal_to_team')}" style="flex:1;min-width:0;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:8px;padding:8px 11px;font-size:12px;outline:none"></textarea>
                <button id="comment-send" class="ui-btn ui-btn-primary" style="width:36px;height:36px;padding:0;flex:none;border-radius:8px">${icon('send','w-4 h-4')}</button>
              </div>
            </div>
          </section>
          <div id="shares-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          ${''/* the general discussion panel is removed — see js/views/portal.js */}
          ${''/* "Counterparty activity" is removed, and NOT only for room.

                 It listed the engagement log — one row per open, with a time
                 and an IP — under a count reading "52 opens". But the
                 counterparty's page POLLS the same endpoint that writes that
                 log, every 10s while they are reading and every 45s when they
                 are not (PORTAL_POLL_MS in js/views/portal.js, and the comment
                 on portalSignature which already knew "the engagement log ticks
                 on every open"). So "52 opens" was never 52 readings of the
                 contract. It was one counterparty leaving the tab open over
                 lunch. A number that looks like attention and measures dwell
                 time is worse than no number: it was read as interest, and it
                 would have been used to decide when to chase.

                 What it was for survives, correctly, one card up: the Shares
                 panel states per recipient whether their link is sent, opened
                 or responded to, with the FIRST open stamped once
                 (shares.first_opened_at) rather than re-counted on every poll.
                 "Have they seen it" is answered there and answered honestly.

                 The server still records every open with its IP — nothing was
                 deleted and the audit value is untouched. It is simply no
                 longer drawn on a panel people read as a summary. */}
          <div id="nego-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          ${''/* "Versions & changes" is removed. Its Compare button repeated the
                 one in this page's own toolbar, and the negotiation page carries
                 a version picker on each pane — three doors onto one act. The
                 two verbs that lived ONLY on that card, Snapshot now and
                 Restore, moved into the Compare window rather than going with
                 it; see openCompareModal in js/versioning.js. Nothing was
                 dropped, only stopped being said three times. */}

          ${''/* ---- "NEXT: SIGNING" IS GONE ----
                 It was hardcoded: it said Signing and went to Signing from
                 every tab, at every stage, whether or not the contract had a
                 counterparty, a value, agreed wording or a settled
                 negotiation. It offered the last step of the deal to a blank
                 draft. The room has ONE next-step button now — the head's,
                 which reads the contract's state and names the rung actually
                 in front of you. See wsNextAction. */}
          ${''/* ---- DRAFT NEW AGREEMENT IS NOT HERE ANY MORE ----
                 It was at the foot of this column: one tab out of five, below a
                 scroll. It moved up into the room head, immediately after the
                 contract's own next act, so it is in view wherever you are.
                 Same id, same data-page-new — the shell's delegated handler
                 anchors the menu under it exactly as before. */}
        </div>
      </section>

      <!-- Divider: drag right to widen the contract (default → +25%), never narrower. Double-click resets. -->
      <div id="doc-resizer" title="${i18t('ct_drag_width')}" style="position:absolute;top:0;bottom:0;left:0;width:14px;z-index:6;cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none" onmouseover="this.firstElementChild.style.background='var(--color-accent)'" onmouseout="if(!this.dataset.drag)this.firstElementChild.style.background='var(--color-neutral-300)'">
        <span style="width:4px;height:72px;border-radius:999px;background:var(--color-neutral-300);transition:background .15s"></span>
      </div>
    </div>

    <!-- ============ KEY TERMS — its own tab now ============
         It used to be the top card of a Signing sub-tab on the right-hand
         panel: a third of the screen wide, behind two clicks, holding the
         commercial facts of the agreement. For an uploaded or template-based
         document this panel is the ONLY place the counterparty, the value and
         the dates can be set, which is a poor reason to be hard to find.
         Editable until the seal binds them. -->
    <div data-ws-pane="terms" class="scroll-thin" style="display:none;flex:1;min-height:0;overflow-y:auto;flex-direction:column;padding:2px">
      <div class="terms-grid">
      ${''/* align-self is gone from BOTH columns, which is what squares them
             off: left to itself each card was only as tall as its contents, so
             the two halves of the screen ended at different places and neither
             one looked deliberate. Stretched, the shorter card grows to meet
             the taller and the obligations list — which is the part that varies
             — scrolls inside its own bounds. See renderKeyTermsSide. */}
      <div style="${CARD};padding:16px 18px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <h6 style="margin:0;flex:1;font-size:13px;font-weight:700;font-family:var(--font-heading)">${i18t('tab_key_terms')}</h6>
          ${(!ktEditable)?`<span class="pill-x" style="background:var(--st-green-bg);color:var(--st-green-fg)">${i18t('ct_confirmed')}</span>`:''}
          ${ktEditable&&ktReadable?`<button id="kt-fill" class="ui-btn" style="font-size:10.5px;padding:3px 8px" title="${i18t('ct_read_out_details')}">${icon('sparkle','w-3 h-3')} Fill from document</button>`:''}
        </div>
        <div id="kt-rows">${ktTermsRowsHtml(c,{editable:ktEditable})}</div>
        ${readTermsHtml(c)}
      </div>
      ${''/* Obligations: what this contract COMMITS you to — the question a
             reader has the moment they have finished reading the terms
             themselves. Filled by renderKeyTermsSide from the record the
             Calendar already chases. */}
      <div id="kt-side" style="display:flex;flex-direction:column;gap:12px;min-height:0"></div>
      </div>
    </div>

    ${''/* ============ SIGNING ============
           The page is named after a signature and used to show none — not who
           signs, not for which company, not whether the other side had. The
           block is the page now: a box per party, in signing order, filling in
           as each mark lands. Beside it, what is holding the signature up (the
           approval gate) and who is queued behind it (the route) — both of
           which were stacked on top of the button in a third of the screen. */}
    <div data-ws-pane="sign" class="scroll-thin" style="display:none;flex:1;min-height:0;overflow-y:auto;flex-direction:column;padding:2px">
      <div class="sign-grid">
        <div style="${CARD};padding:16px 18px;display:flex;flex-direction:column;gap:12px;align-self:start">
          <div id="sign-block"></div>
          ${(!locked&&canEdit())?`
          <label style="display:flex;align-items:flex-start;gap:9px;border:1px solid var(--color-divider);border-radius:6px;padding:10px;cursor:pointer">
            <input type="checkbox" data-comp="consent" ${c.compliance.consent?'checked':''} class="mt-0.5 h-4 w-4" style="accent-color:var(--color-accent);flex:none"/>
            <span style="font-size:11.5px"><span style="font-weight:600;display:block">${i18t('ct_intend_to_sign')}</span><span style="color:var(--color-neutral-700);display:block;line-height:1.4">${jxEsignature()}</span></span>
          </label>`:''}
          <div id="sign-wrap"></div>
        </div>
        <div id="sign-side" style="display:flex;flex-direction:column;gap:12px;align-self:start"></div>
      </div>
    </div>

    <!-- ============ HISTORY — its own tab now ============
         The same screen the History button opened in a dialog: every proposal,
         decision, signature and renumbering, oldest first, with its filters,
         its integrity check and its export. Painted by roomPaintHistory when
         the tab is selected, so a contract nobody opens History on pays
         nothing for it. The audit trail sits below, which is where the record
         of what the SYSTEM did belongs — beside the record of what people did.

         The header's History button still opens the dialog; both read one
         builder, so they cannot tell different stories. -->
    <div data-ws-pane="history" class="scroll-thin" style="display:none;flex:1;min-height:0;overflow-y:auto;flex-direction:column;padding:2px">
      <div class="hist-grid">
        <div id="ws-history-pane" style="${CARD};padding:14px 16px;align-self:start"></div>
        <div id="ws-versions-pane" style="${CARD};padding:14px 16px;align-self:start"></div>
      </div>
      ${''/* The audit-trail CARD has gone: its entries are on the one timeline
             now, marked as system events. The element stays, empty and hidden,
             because renderAuditSection is called from a dozen places and a
             missing host there would be a silent no-op rather than an error —
             this way it keeps working and simply is not drawn. */}
      <div id="audit-section" hidden></div>
    </div>

    <!-- ============ NEGOTIATION: the three-pane fingerprinted redline ============
         Rendered by js/views/negotiation.js — the SAME component the
         counterparty's link renders, so neither side is looking at a lesser
         screen than the other. -->
    <div id="nego-tab" data-ws-pane="negotiation" style="display:none;flex:1;min-height:0"></div>
  </div>`;

  scanUI = { running:false, filter:'all', expanded:new Set() };
  docTabDefaults(c);   // Screening for in-progress, Signing once executed (per contract)
  wsTabDefaults(c);    // Document by default; the choice persists per contract
  wireDocumentSync(c); renderFeed(c); wireComments(c); wireCompliance(c); renderSignButton(c); renderScanSection(c); renderPlaybookSection(c); renderSharesSection(c); renderNegotiationSection(c); renderAuditSection(c);
  if(window.renderTemplateFormSection) renderTemplateFormSection(c);
  wireChecksCard(c);   // the three Run → rows, each pressing an existing act
  wireDocTabs(c);      // "Next: Signing" — the pair of sub-tabs it belonged to has gone
  wireWsTabs(c);       // the room's five tabs
  document.getElementById('doc-to-nego')?.addEventListener('click',()=>roomGoTab(c,'redline'));
  wireDocResizer();   // draggable divider — sets the contract's width, and with it the page zoom
  wireChangesStrip(c);   // the returned-changes strip above the document
  // rehydrate a server-stored uploaded file's bytes for preview/download
  if(API_MODE() && isUpload(c) && c.upload?.fileId && !c.upload?.dataUrl){
    api('files/'+c.upload.fileId).then(f=>{ c.upload.dataUrl=f.dataUrl;
      if(state.activeId===c.id){ const dc=document.getElementById('doc-canvas'); if(dc){ dc.innerHTML=docBodyStructured(c); wireDocCanvas(c); } }
    }).catch(()=>{});
  }
  wireKeyTerms(c);
  wireActionBar(c);
  wireDocCanvas(c);   // expand / re-read buttons (inside #doc-canvas)
  wireRoomHead(c);    // the "⋯" and the way back — shared with the workbench
  wireWsCollapse(c);
  /* Draft new agreement carries data-page-new and is NOT wired here. The shell
     binds every [data-page-new] trigger once, by delegation (js/app.js), and
     that handler is the one that ANCHORS the menu — measured under the button
     that was pressed and clamped to the viewport. The first version of this
     button had its own listener that only lifted `hidden`, so the fixed-
     position menu opened wherever it had last been placed: on a fresh session,
     the far corner of the screen, nowhere near the button that asked for it.
     One binding, one anchoring, every trigger. */
  window.updateAIBadge&&updateAIBadge();   // the Copilot's unread dot lives on the sidebar launcher now

  document.getElementById('ws-share')?.addEventListener('click',()=>openShareModal(c));   // ws-evidence is wired by wireActionBar
  // WP-2.1 — read-only by nature, so no canEdit gate: a viewer reads the story too.
  // ws-delete is wired in wireRoomHead — the one function BOTH the Document tab
  // and the Negotiate workbench call. A second listener here would fire twice.
  document.getElementById('ws-import')?.addEventListener('click',()=>openImportModal(c));
  document.getElementById('ws-compare')?.addEventListener('click',()=>openCompareModal(c));
  // No ws-edit wiring: the button is gone, and leaving the listener behind is
  // how a removed feature comes back the next time someone re-adds the markup.
  /* API mode: "Save as template" lands in the versioned Template Library (a
     draft opened in the builder). The older settings-blob flow remains the
     local-mode path, where the server-backed library does not exist. */
  document.getElementById('ws-tpl')?.addEventListener('click',()=>{
    if(API_MODE()&&window.saveContractToLibrary) saveContractToLibrary(c);
    else saveContractAsTemplate(c);
  });
  document.getElementById('ws-pdf')?.addEventListener('click',()=>exportPDF(c));
  document.getElementById('ws-pdf-record')?.addEventListener('click',()=>exportPDF(c,{record:true}));
  document.getElementById('ws-word')?.addEventListener('click',()=>exportWordTracked(c));
  // The text-size stepper on the tab row: the control, its styles and its
  // state all live with the workbench (rlTypeStepHtml/rlWireTypeStep), so the
  // two tabs render one component reading one persisted preference. The
  // stylesheet call is idempotent; the zoom applies the stored choice now.
  if(window.redlineLayoutCss) redlineLayoutCss();
  if(window.rlWireTypeStep) rlWireTypeStep(content);
  wireWsFocus(c);
  applyDocZoom();
  setActiveNav('workspace');
}

/* Listeners on nodes INSIDE #doc-canvas die with every innerHTML re-render of
   the canvas — and the canvas re-renders more than once per visit: after the
   stored file's bytes are fetched (the rehydrate above) and after signing.
   Wiring them through one function lets every re-render re-arm them; wiring
   them inline at only the first render is how the Word buttons went dead the
   moment a reloaded page rehydrated (BUGLOG F9-003). */
function wireDocCanvas(c){
  document.querySelector('[data-expand-doc]')?.addEventListener('click',()=>openDocReader(docFileUrl(c), c.upload?.fileName||c.name, c.upload?.mime));
  document.querySelector('[data-reread]')?.addEventListener('click',e=>rereadUploadText(c, e.currentTarget));
}

/* -------- doc field sync --------
   Counterparty and value can be typed in two places: the quick-fill inputs
   inside a generated document body, and the Key terms panel (the only place for
   uploaded or template-based documents). Both write the same fields, so every
   on-screen copy is refreshed after each edit. */
function syncKeyTermsUI(c, source){
  const put=(sel,val)=>document.querySelectorAll(sel).forEach(el=>{ if(el!==source&&el.value!==String(val)) el.value=val; });
  put('#doc-canvas [data-sync="counterparty"], [data-kt="counterparty"]', c.counterparty||'');
  put('#doc-canvas [data-sync="value"]', c.value||'');
  /* The key-terms field carries thousand separators; writing the raw number
     into it here would strip them back out on every keystroke. */
  put('[data-kt="value"]', c.value?Number(c.value).toLocaleString(jxLocale()):'');
  const cp=document.getElementById('meta-cp'); if(cp) cp.textContent=c.counterparty||'—';
  const mv=document.getElementById('meta-value');
  if(mv){
    mv.textContent=!isMonetary(c)?'Non-monetary':(c.value?fmtMoney(c.value)+(c.valueType==='estimated'?' (est.)':''):'—');
    mv.classList.add('text-brand-500'); setTimeout(()=>mv.classList.remove('text-brand-500'),250);
  }
}
/* Draft leaves drafting the moment the terms needed to review it are present.
   Everything that reads those terms is refreshed with it: the guidance strip,
   the signing checklist ("Complete: counterparty name, contract value…") and
   the renewal date the obligations panel derives from the expiry. */
function keyTermsProgress(c){
  if(c.status==='Draft'&&c.counterparty&&(!isMonetary(c)||Number(c.value)>0)){
    c.status='Under Review'; updateStatusUI(c);
    logAudit(c,'Status changed','Draft → Under Review (key terms completed)');
  }
  renderActionBar(c);
  renderSignButton(c);
}
function wireDocumentSync(c){
  const canvas=document.getElementById('doc-canvas');
  canvas.querySelectorAll('[data-sync]').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const key=inp.getAttribute('data-sync');
      if(key==='value') c.value=inp.value===''?0:Number(inp.value);
      else if(key==='counterparty') c.counterparty=inp.value;
      syncKeyTermsUI(c, inp);
      /* The read-out beside the field has to agree with what was just typed. */
      const _row=inp.closest('[data-kt-row]');
      /* The prompt has to clear the moment the row stops being empty, or a
         filled value keeps wearing the dashed "fill me in" box for ever. */
      if(_row){ const rd=_row.querySelector('.kt-read');
        if(rd){ const html=ktReadValue(c,_row.getAttribute('data-kt-row'));
          rd.innerHTML=html;
          if(ktIsEmptyRead(html)){ rd.setAttribute('data-kt-empty','1'); rd.title=i18t('ct_empty_click'); }
          else { rd.removeAttribute('data-kt-empty'); rd.title=i18t('ct_click_change'); } } }
      keyTermsProgress(c);
      c.lastAction=todayStr();
      logAudit(c,'Edited',`Updated ${key==='value'?'contract value':'counterparty'}`);
      persist(c); renderAuditSection(c);
    });
  });
  canvas.querySelectorAll('[data-field]').forEach(inp=>inp.addEventListener('input',()=>{
    c.fields[inp.getAttribute('data-field')]=inp.value;
    c.lastAction=todayStr();
    logAudit(c,'Edited',`Updated field "${inp.getAttribute('data-field')}"`);
    persist(c); renderAuditSection(c);
  }));
}

/* -------- Key terms panel -------- */
function wireKeyTerms(c){
  const LABEL={counterparty:'counterparty', value:'contract value', nonmonetary:'value type',
               effDate:'effective date', expiry:'expiry date', cpEmail:'counterparty email'};
  document.querySelectorAll('[data-kt]').forEach(inp=>{
    const key=inp.getAttribute('data-kt');
    const evt=(inp.type==='checkbox'||inp.type==='date')?'change':'input';
    inp.addEventListener(evt,()=>{
      if(key==='counterparty') c.counterparty=inp.value.trim();
      /* Their address. Stored as typed and never refused mid-keystroke — half
         an email is what every email looks like on the way in. It is only ever
         USED by a send, and the send already checks it and asks if it cannot
         reach anyone, so a typo costs a dialog rather than a lost change. */
      else if(key==='cpEmail') c.counterpartyEmail=inp.value.trim();
      /* THE FIGURE READS AS A FIGURE. This field was type=number, so a
         78-million-shilling contract showed `78000000` — eight digits with no
         separators, on the panel whose whole job is to state the commercial
         facts. It is a text field now that carries the separators; every
         non-digit is stripped on the way into the record, so what is stored is
         the same plain number it always was. */
      else if(key==='value'){
        const digits=String(inp.value).replace(/[^\d]/g,'');
        c.value=digits===''?0:Number(digits);
      }
      else if(key==='nonmonetary'){
        c.valueType=inp.checked?'none':(c.valueType==='none'?'estimated':c.valueType||'estimated');
        const v=document.querySelector('[data-kt="value"]');
        if(v){ v.disabled=inp.checked; v.style.opacity=inp.checked?'.45':''; }
      }
      else if(key==='effDate'){ c.fields=c.fields||{}; c.fields.effDate=inp.value; }
      else if(key==='expiry') c.expiry=inp.value;
      syncKeyTermsUI(c, inp);
      keyTermsProgress(c);
      c.lastAction=todayStr();
      logAudit(c,'Edited',`Updated ${LABEL[key]||key}`);
      persist(c); renderAuditSection(c);
    });
  });
  document.getElementById('kt-fill')?.addEventListener('click',()=>fillKeyTermsFromDocument(c));
}
/* Read what the document itself says and drop it into the EMPTY fields — never
   over something already entered. Uses the Copilot reader when a key is configured
   (it finds party names, which the pattern matcher can't) and the pattern
   matcher otherwise. */
async function fillKeyTermsFromDocument(c){
  const btn=document.getElementById('kt-fill');
  const text=(isUpload(c)?(c.upload&&c.upload.extractedText):(window.docPlainText?docPlainText(c):''))||'';
  if(text.length<200){ toast(i18t('ct_no_readable_text'),'err'); return; }
  if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_reading')}</span>`; }
  try{
    const meta=await extractMetadata(text, null);
    const filled=[];
    if(!c.counterparty && meta.counterparty){ c.counterparty=String(meta.counterparty).trim(); filled.push('counterparty'); }
    // the pattern matcher just takes the first money amount it sees — in a
    // contract that is as likely to be a unit rate as the deal value, so only
    // trust a figure the Copilot reader picked out
    if(meta._source==='ai' && isMonetary(c) && !(Number(c.value)>0) && Number(meta.value)>0){
      c.value=Number(meta.value); if(c.valueType!=='estimated') c.valueType='estimated'; filled.push('value');
    }
    if(!(c.fields&&c.fields.effDate) && meta.effectiveDate){ c.fields=c.fields||{}; c.fields.effDate=meta.effectiveDate; filled.push('effective date'); }
    if(!c.expiry && meta.expiryDate){ c.expiry=meta.expiryDate; filled.push('expiry'); }
    if(!filled.length){
      toast(meta._source==='ai'?'Nothing new found — the fields already hold what the document says'
                               :'Nothing found. Party names and the deal value need an Copilot key — type them in instead','err');
      return;
    }
    c.lastAction=todayStr();
    logAudit(c,'Edited',`Filled ${filled.join(', ')} from the document (${meta._source==='ai'?'Copilot':'pattern match'})`);
    persist(c);
    toast(`Filled ${filled.join(', ')} — check it before signing`);
    renderWorkspace();
  }catch(e){
    toast(i18t('ct_could_not_read_doc')+(e.message||'try again'),'err');
  }finally{
    if(btn&&document.body.contains(btn)){ btn.disabled=false; btn.innerHTML=`${icon('sparkle','w-3 h-3')} Fill from document`; }
  }
}
function updateStatusUI(c){
  const ms=document.getElementById('meta-status'), ws=document.getElementById('ws-status');
  const chip=window.contractStatusChip?contractStatusChip(c):statusChip(c.status);
  if(ms) ms.innerHTML=chip;
  if(ws) ws.innerHTML=chip;
}

/* -------- comments -------- */
function renderFeed(c){
  const feed=document.getElementById('feed');
  /* H-1: escape every value that reaches innerHTML. A counterparty's typed name
     (m.author) and comment (m.text) flow into c.comments through the public
     share portal (applyResponse in core.js), so this feed renders text that
     originates OUTSIDE the workspace. Rendered raw, a name or comment like
     "<img src=x onerror=…>" would execute in the contract owner's browser —
     stored cross-site scripting from an external party against an internal
     (often admin) user. Every other typed-text surface already escapes; this
     older panel did not. initials is derived from author, so it is escaped too. */
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  feed.innerHTML=c.comments.map(m=>{
    const internal=m.side==='internal';
    const initials=esc(String(m.author||'').split(' ').map(w=>w[0]||'').slice(0,2).join('').toUpperCase());
    /* "Legal (Internal)" is two facts, and the second one is already said by
       the footer under this list — every comment you can type here is internal.
       So the parenthetical is dropped from the line and the side is carried by
       the avatar's colour instead, which is where it costs nothing to read. */
    const role=esc(String(m.role||'').replace(/\s*\(internal\)\s*$/i,'').trim());
    /* Relative where the stamp can be read as a date, absolute where it cannot.
       Comments filed before `at` existed carry only a formatted display string,
       and a message list that silently drops its timestamps because a parse
       failed is worse than one showing the long form. */
    const when=esc((window.relTime?relTime(m.at||m.ts):'') || m.ts || '');
    return `
    <div style="display:flex;gap:10px">
      <div style="flex:none;height:28px;width:28px;display:grid;place-items:center;border-radius:50%;font-size:10px;font-weight:700;
        background:${internal?'var(--color-accent-100)':'var(--st-amber-bg)'};color:${internal?'var(--color-accent-800)':'var(--st-amber-fg)'}">${initials}</div>
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;line-height:1.4">
          <span style="font-size:12.5px;font-weight:600;color:var(--color-text)">${esc(m.author)}</span>
          <span style="font-size:10.5px;color:var(--color-neutral-500)">${role}${role&&when?' · ':''}${when}</span>
        </div>
        <p style="font-size:12px;color:var(--color-neutral-700);margin:3px 0 0;line-height:1.55">${esc(m.text)}</p>
      </div>
    </div>`;
  }).join('');
  feed.scrollTop=feed.scrollHeight;
}
function wireComments(c){
  const input=document.getElementById('comment-input');
  const send=document.getElementById('comment-send');
  const post=()=>{
    const text=input.value.trim(); if(!text) return;
    const u=currentUser();
    /* `at` is the machine-readable stamp; `ts` stays as the long form both for
       records written before this and for the fallback in renderFeed. A list
       that says "3h ago" needs a date it can subtract, not a sentence. */
    const at=nowISO();
    c.comments.push({ author:u?.name||'You', role:`${ROLE_LABEL[u?.role]||'User'} (Internal)`, side:'internal', text, at, ts:fmtDT(at) });
    logAudit(c,'Comment','Internal comment added');
    persist(c);
    input.value=''; renderFeed(c); renderAuditSection(c);
  };
  send.addEventListener('click',post);
  input.addEventListener('keydown',e=>{
    if(window.chatFieldSubmits?chatFieldSubmits(e):e.key==='Enter') post();
  });
  if(window.chatFieldWire) chatFieldWire(input.parentNode||document);
}

/* -------- compliance + signing -------- */
function wireCompliance(c){
  document.querySelectorAll('[data-comp]').forEach(cb=>cb.addEventListener('change',()=>{
    const key=cb.getAttribute('data-comp');
    c.compliance[key]=cb.checked;
    if(key==='consent') logAudit(c,'Consent',`Intent-to-sign ${cb.checked?'confirmed':'withdrawn'} by ${currentUser()?.name||'user'}`);
    persist(c); renderSignButton(c); renderAuditSection(c);
  }));
}
/* ---- THE SIGNATURE BLOCK — THE THING THE PAGE IS NAMED AFTER ----
   The Signing tab did not show a signature. Not who signs, not for which
   company, not whether the other side had. All of it was already on the
   contract; none of it was drawn.

   A box per party, in signing order. Where a route has been set the boxes are
   its signers; where none has, there are two — one for each side of the table —
   because a contract with no route still has two parties, and showing them is
   how a reader discovers a route is worth setting.

   Signed boxes carry what the SEAL carries: the name, the capacity, the moment,
   and the drawn or typed mark itself. This screen and the sealed copy read the
   same record, so they cannot come to disagree. */
function signPartyBoxes(c){
  const plan=(window.signerPlan?signerPlan(c):[]).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  const sigs=c.signatures||[];
  if(plan.length) return plan.map(s=>({
    id:s.id, side:s.party==='counterparty'?'counterparty':'first',
    org:s.party==='counterparty'?(c.counterparty||'the counterparty'):(window.FIRST_PARTY||'us'),
    name:s.name||'', role:s.role||'', signed:!!s.signed, at:s.at||'',
    image:(s.signature&&s.signature.image)||'',
  }));
  /* No route yet: the two implied parties. Ours is whoever has already signed,
     else the signatory named on the contract, else the person reading — the
     same order signDocument itself uses when it stamps a signature. */
  const ourSig=sigs.find(s=>s.party!=='counterparty');
  const theirSig=sigs.find(s=>s.party==='counterparty');
  const me=(typeof currentUser==='function'&&currentUser())||null;
  const contact=(typeof counterpartyContact==='function')?counterpartyContact(c):null;
  return [
    { side:'first', org:window.FIRST_PARTY||'us',
      name:(ourSig&&ourSig.name)||c.signatory||(me&&me.name)||'',
      role:(ourSig&&(ourSig.role||ourSig.capacity))||(me&&window.signerTitle?signerTitle(me):'')||'',
      signed:!!ourSig, at:(ourSig&&ourSig.at)||'', image:(ourSig&&ourSig.image)||'' },
    { side:'counterparty', org:c.counterparty||'the counterparty',
      name:(theirSig&&theirSig.name)||(contact&&contact.name)||'',
      role:(theirSig&&(theirSig.role||theirSig.capacity))||'', signed:!!theirSig,
      at:(theirSig&&theirSig.at)||'', image:(theirSig&&theirSig.image)||'' },
  ];
}
function signBlockHtml(c){
  const boxes=signPartyBoxes(c);
  const done=boxes.filter(b=>b.signed).length;
  const chip=done===boxes.length&&done
    ? `<span class="pill-x" style="background:var(--st-green-bg);color:var(--st-green-fg)">${i18t('ct_fully_executed')}</span>`
    : done ? `<span class="pill-x" style="background:var(--st-amber-bg);color:var(--st-amber-fg)">${i18t('ct_of_n_signed',{done,total:boxes.length})}</span>`
    : `<span class="pill-x" style="background:var(--st-amber-bg);color:var(--st-amber-fg)">${i18t('ct_awaiting_signature')}</span>`;
  const box=b=>`<div class="sig-box${b.signed?' is-signed':''}">
      <div class="sig-mark">${b.image
        ? `<img src="${b.image}" alt="${esc(i18t('ct_signature_of',{who:b.name}))}"/>`
        : b.signed ? `<span class="sig-name">${esc(b.name||'Signed')}</span>`
        : `<span class="sig-none">${i18t('ct_not_yet_signed')}</span>`}</div>
      <div class="sig-who">${i18t('ct_for')} <b>${esc(b.org)}</b>${b.name?`<br>${esc(b.name)}${b.role?' · '+esc(b.role):''}`:''}${
        b.signed&&b.at?`<br><span class="sig-at">${window.fmtDT?fmtDT(b.at):esc(b.at)}</span>`:''}</div>
    </div>`;
  return `<div style="display:flex;align-items:center;gap:9px;margin-bottom:11px">
      <h6 style="margin:0;flex:1;font-size:13px;font-weight:700;font-family:var(--font-heading)">${i18t('ct_signature_block')}</h6>${chip}
    </div>
    <div class="sig-grid">${boxes.map(box).join('')}</div>`;
}
function renderSignButton(c){
  const wrap=document.getElementById('sign-wrap'); if(!wrap) return;
  if(c.status==='Signed'){
    wrap.innerHTML=`
      <div class="flex items-center justify-center gap-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 py-3 text-sm font-medium">${icon('check2')} Executed &amp; sealed</div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button id="verify-seal" class="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('shield','w-3.5 h-3.5')} Verify seal</button>
        <button id="evidence-dl" class="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Evidence pack</button>
      </div>
      ${distributionPanelHtml(c)}`;
    document.getElementById('verify-seal').addEventListener('click',()=>verifySeal(c));
    document.getElementById('evidence-dl').addEventListener('click',()=>downloadEvidence(c));
    // pressed deliberately, so it goes now — see distributeExecuted's `force`
    document.getElementById('dist-send')?.addEventListener('click',()=>{ if(c.distribution) delete c.distribution; distributeExecuted(c,{force:true}); });
    return;
  }
  if(!canEdit()){
    wrap.innerHTML=`<div class="text-center text-[11px] text-brand-800/65 py-2">${i18t('ct_viewer_no_signing')}</div>`;
    return;
  }
  // The other way a deal ends. Offered once the wording is settled, because
  // until then there is nothing to have signed on paper.
  const paperRoute = !((window.negoSigningBlockers ? negoSigningBlockers(c).length
      : (window.unresolvedRedlines && unresolvedRedlines(c))))
    ? `<button id="sign-paper" class="mt-2 w-full text-center text-[11px] text-brand-800/70 hover:text-brand-900 underline decoration-dotted underline-offset-2 py-1.5 transition">${i18t('ct_signed_on_paper_q')}</button>`
    : '';
  const wirePaper = () => document.getElementById('sign-paper')?.addEventListener('click',()=>openPaperSignatureModal(c));
  const appr=approvalState(c);
  const ns=nextSigner(c), planned=signerPlan(c).length>0;
  // With a signer plan, the in-app button only acts when it's an internal
  // signer's turn; counterparty turns are collected via the share link.
  const signerReady = !planned || (ns && ns.party==='internal');
  const ready=c.counterparty&&(!isMonetary(c)||Number(c.value)>0)&&c.compliance.consent&&appr.ok&&signerReady;
  const missing=[];
  if(!c.counterparty)missing.push('counterparty name');
  if(isMonetary(c)&&!(Number(c.value)>0))missing.push('contract value');
  if(!c.compliance.consent)missing.push('intent-to-sign consent');
  if(!appr.ok)missing.push('approvals');
  /* ---- THE BUTTON SAYS WHAT IS STOPPING IT ----
     It used to grey out and print the reason in 11px underneath, which is the
     one arrangement guaranteed to be missed: the eye goes to the disabled
     control, finds no explanation on it, and concludes the page is broken.
     The blocker IS the label now, and the small print underneath explains the
     act rather than repeating the obstacle. */
  const blockLabel = !c.counterparty ? 'Sign — add the counterparty'
    : (isMonetary(c)&&!(Number(c.value)>0)) ? 'Sign — add the contract value'
    : !appr.ok ? 'Sign — approvals outstanding'
    : !c.compliance.consent ? 'Sign — tick intent to sign first'
    : (planned&&ns&&ns.party==='counterparty') ? `Sign — waiting on ${ns.name}`
    : 'Sign Document';
  const signLabel = ready ? (planned&&ns ? `Sign as ${ns.name}` : 'Sign Document') : blockLabel;
  /* WHO SIGNS, AND IN WHAT ORDER — asked BEFORE the button that ends it.

     This was an 11px text link UNDERNEATH "Sign Document": a decision about
     which parties execute the contract and in which sequence, sitting below the
     control that carries it out and styled like a footnote. Anyone who read
     down the panel in order had already signed by the time they reached it, and
     a signature cannot be taken back.

     It sits above the button now and is drawn as a control rather than as small
     print. Once an order exists the panel shows the route itself, with its own
     "edit route" — so this appears exactly while it is still a live choice. */
  const signerRoute = !planned&&canEdit()&&c.status!=='Signed'
    ? `<button id="sp-setup" class="w-full flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-white py-2.5 mb-2.5 text-[12.5px] font-600 text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition">
        ${icon('users','w-4 h-4')} Set a multi-signer order…
      </button>
      <p class="mb-3 text-[10.5px] text-center text-brand-800/60 leading-relaxed">${i18t('ct_more_than_one_signatory')}</p>`
    : '';
  /* The approval chain and the signing route render in the Signing tab's OWN
     right-hand column now (renderSignSide) rather than stacked on top of this
     button. Where that column does not exist — any older slot that still fills
     #sign-wrap — they are drawn here as before, so nothing loses them. */
  const sideCol=document.getElementById('sign-side');
  wrap.innerHTML=`
    ${sideCol?'':approvalPanelHtml(c)}
    ${sideCol?'':signerRoute}
    <button id="sign-btn" ${ready?'':'disabled'} class="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition ${ready?'bg-brand-900 text-white hover:bg-brand-800 shadow-lg shadow-brand-900/20':'bg-brand-100 text-brand-800/60 cursor-not-allowed'}">
      ${icon('finger','w-[18px] h-[18px]')} ${signLabel}
    </button>
    ${ready?`<p class="mt-2 text-[11px] text-center text-brand-800/65">Freezes the exact text, applies a tamper-evident SHA-256 seal${planned?' when the last signer signs':''}.</p>`
           :`<p class="mt-2 text-[11px] text-center text-brand-800/65">${planned&&ns&&ns.party==='counterparty'?`Their link collects it — share the contract to start their turn.`:`Signing freezes the wording and seals it. It cannot be undone.`}</p>`}
    ${(()=>{ const oh=openFindings(c).filter(x=>x.sev==='high').length;
      return oh?`<p class="mt-1.5 text-[11px] text-center text-rose-600 font-medium flex items-center justify-center gap-1">${icon('alert','w-3 h-3')} ${i18tn('ct_high_findings',oh,{n:oh})}</p>`:''; })()}
    ${paperRoute}`;
  if(ready) document.getElementById('sign-btn').addEventListener('click',()=>signDocument(c));
  document.getElementById('sp-setup')?.addEventListener('click',()=>openSignerPlanEditor(c));
  wirePaper();
  renderSignSide(c);
  wireApprovalPanel(c);
  document.getElementById('sign-block')&&(document.getElementById('sign-block').innerHTML=signBlockHtml(c));
}
/* ---- THE SIGNING TAB'S RIGHT-HAND COLUMN ----
   What is holding the signature up, and who is queued behind it. Both were
   already built — the approval chain and the route panel — and both were stacked
   above the Sign button in a third of the screen. They get their own column.

   ADD SIGNER IS ALWAYS OFFERED. The old control appeared only while NO route
   existed, so the moment you set one you could no longer add anybody to it from
   this page — you had to find "edit route" inside the panel. Adding a signatory
   is the commonest thing to want here and it is a top-level button now, whether
   the route is empty or five deep. */
function renderSignSide(c){
  const host=document.getElementById('sign-side'); if(!host) return;
  const plan=(window.signerPlan?signerPlan(c):[]);
  const may=canEdit()&&c.status!=='Signed';
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:8px;padding:13px 15px';
  const H='margin:0;font-size:13px;font-weight:700;font-family:var(--font-heading)';
  const chain=window.approvalChainHtml?approvalChainHtml(c,{bare:true}):'';
  const route=window.signerRouteHtml?signerRouteHtml(c,{bare:true}):'';
  host.innerHTML=`
    ${chain?`<section style="${CARD}"><h6 style="${H};margin-bottom:9px">${i18t('ct_approval_gate')}</h6>${chain}</section>`:''}
    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">
        <h6 style="${H};flex:1">${i18t('ct_signing_order')}</h6>
        ${plan.length?`<span class="pill-x" style="background:var(--color-neutral-100);color:var(--color-neutral-600)">${plan.filter(s=>s.signed).length} of ${plan.length} signed</span>`:''}
      </div>
      ${route||`<p style="margin:0 0 10px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">No route set. One signature each side is assumed — ${esc(window.FIRST_PARTY||'us')} first, then ${esc(c.counterparty||'the counterparty')}. Add signers to change that.</p>`}
      ${may?`<button id="sp-add-signer" class="ui-btn" style="width:100%;justify-content:center;font-size:12px;padding:7px 12px;margin-top:${route?'8px':'0'}">${icon('users','w-3.5 h-3.5')} ${plan.length?'Add or reorder signers':'Add signers'}</button>`:''}
      ${may?`<p style="margin:7px 0 0;font-size:10.5px;line-height:1.5;color:var(--color-neutral-500)">Internal signers sign here; each counterparty signer gets their own link, held until every internal signature is in. The seal lands with the last one.</p>`:''}
    </section>`;
  host.querySelector('#sp-add-signer')?.addEventListener('click',()=>openSignerPlanEditor(c));
}
async function signDocument(c){
  if(!canEdit()){ toast(i18t('ct_viewers_no_sign'),'err'); return; }
  if(!c.compliance.consent){ toast(i18t('ct_tick_intent_first'),'err'); return; }
  if(!approvalState(c).ok){ toast(i18t('ct_needs_approval'),'err'); return; }
  // The document is out in Word: the counterparty may be mid-edit on wording
  // this signature would seal. Bring the file back (or cancel) before signing.
  /* E2-T5: don't seal over an unsettled negotiation. Admin/Legal may override.

     Through negoSigningBlockers, which asks BOTH generations of the
     negotiation. This read `unresolvedRedlines` alone — open ROUNDS carrying
     proposed text — and the room creates no round at all, so a contract with
     four unanswered changes on it reported nothing outstanding and was sealed
     mid-argument. See js/negotiation.js. */
  /* AND IT IS A REFUSAL, not a warning.

     This used to let Admin or Legal sign anyway behind a confirmation, on the
     reading that an approver should be able to overrule the gate. There are
     three roles — Admin, Legal and Viewer — and a Viewer cannot sign at all.
     So "Admin or Legal" was everybody who could reach the button: the override
     granted no one anything, and the gate was a dialog rather than a gate.

     A signature is the one act in this product that cannot be taken back. It
     freezes the wording, seals it with a fingerprint and sends both parties
     their copy as the record of the deal. It does not go on top of an argument
     that is still running. The room has verbs for every way out — accept,
     refuse, withdraw — and the refusal names which ones are outstanding. */
  const blockers=(window.negoSigningBlockers?negoSigningBlockers(c):
    (unresolvedRedlines(c)?[`${unresolvedRedlines(c)} proposed edit(s) from the counterparty are still open`]:[]));
  if(blockers.length){
    toast(`Not signed — ${blockers.join('; ')}. Settle the negotiation first: every change has to be accepted, or refused and withdrawn.`,'err');
    return;
  }
  /* ---- THE SAME BAR THE SHARE DIALOG ALREADY HOLDS THIS CONTRACT TO ----
     contractReadiness has listed the blanks that make a contract unsafe to
     send since it was written — no counterparty, no value on a contract type
     that carries one, and placeholders still sitting in the wording — and
     readinessBlocks has filtered them to the refusing kind. NOTHING EVER
     CALLED IT. So Share showed you the list and Sign, the one act in this
     product that cannot be taken back, asked for none of it: a contract that
     did not come through the template form could be sealed with [COUNTERPARTY]
     still in the text, and the seal makes that wording the record of the deal.

     Through window, because readinessBlocks is a const in js/core.js and a
     bare name here would never reach it.

     The template-form check below is the same rule for contracts that DID come
     through the form, and is left exactly as it was; this is every other way a
     contract arrives — uploaded, imported, or drafted before the form existed. */
  if(window.readinessBlocks){
    const unfilled=readinessBlocks(c);
    if(unfilled.length){
      toast(`Not signed — ${unfilled.map(x=>x.label).join(' ')} Fill these in on Key terms, or in the document, before signing.`,'err');
      return;
    }
  }
  /* A template contract signs only when its form holds together: every
     required blank filled and every value valid per the shared registry. The
     signature seals the RENDERED wording, so a blank that slipped through
     would be sealed as the label of a missing answer. */
  if(c.templateForm && window.templateFormProblems){
    const probs=templateFormProblems(c.templateForm);
    if(probs.length){
      toast(`Not signed — ${probs.length} field${probs.length===1?' needs':'s need'} attention first: ${probs.slice(0,3).map(p=>p.label).join(', ')}${probs.length>3?'…':''}`,'err');
      return;
    }
  }
  const u=currentUser(), at0=nowISO();
  // capture server-stamped IP + time where available (honest attribution)
  let meta={ ip:null, at:at0 };
  if(API_MODE()){ try{ meta=await api('sign-meta','POST',{}); }catch(e){} }
  const at=meta.at||at0;
  const ordLabel=n=>{ const t=['th','st','nd','rd'], v=n%100; return n+(t[(v-20)%10]||t[v]||t[0]); };
  // E5-T3 multi-signer route: signers execute in order; each captures their own
  // mark; the seal is applied only when the last signature lands.
  const plan=signerPlan(c), ns=nextSigner(c);
  if(plan.length && ns){
    if(ns.party!=='internal'){ toast(`Next signer is ${ns.name} (counterparty) — share the link to collect their signature`,'err'); return; }
    if(ns.memberId && u && u.id!==ns.memberId){ toast(`This step is reserved for ${ns.name}. Sign in as ${ns.name} to sign here.`,'err'); return; }
    const sig=await captureSignature(ns.name);   // free choice: draw / type / upload
    if(!sig) return;                              // signer cancelled the pad
    ns.signed=true; ns.at=at; ns.by=u.name; ns.signature={ form:sig.form, image:sig.image, imageHash:sig.imageHash };
    c.signatures=c.signatures||[];
    // ns.role is the signing route's free-text "Title (e.g. CFO)" field — a
    // capacity, not a permission level. Fall back to the member's own recorded
    // title, and to nothing at all rather than to Admin/Legal/Viewer.
    c.signatures.push({ party:'internal-planned', name:ns.name||u.name, title:ns.role||signerTitle(u), email:ns.email||u.email, at,
      method:'session-authenticated', ip:meta.ip||null, ua:navigator.userAgent,
      form:sig.form, image:sig.image, imageHash:sig.imageHash, typedName:sig.typedName, font:sig.font });
    logAudit(c,'Signature',`${ns.name} signed (${ordLabel(ns.order)} of ${plan.length}) — ${sig.form} signature${signerProvenance(meta.ip,navigator.userAgent)}`);
    if(!allSigned(c)){
      persist(c); renderSignButton(c); renderAuditSection(c);
      const nxt=nextSigner(c);
      if(nxt && nxt.party==='counterparty' && internalAllSigned(c)){
        /* W7 fault 2, closed: this used to open the share dialog for the owner
           to hand-type ONE recipient, on a contract whose route already names
           every counterparty signer with an address. The route issues the
           links itself now — the first signer is emailed and the rest release
           in order — and the dialog remains only where the route cannot drive
           it (static mode, or a plan missing an address). */
        let out=null;
        try{ out=window.issueSigningRouteLinks ? await issueSigningRouteLinks(c) : null; }catch(e){ out=null; }
        if(out && out.links){
          const first=out.links.find(x=>!x.heldForTurn);
          toast(`Internal signing complete — ${first&&first.emailSent
            ? `${first.signer.name} has been emailed their own signing link`
            : 'the signing links are issued from the route'}${out.links.length>1?'; the rest release automatically as each signer signs':''}`);
          renderSignButton(c); renderAuditSection(c);
        } else {
          if(out && out.missingEmails)
            toast(`The signing route has no email address for ${out.missingEmails.map(s=>s.name).join(', ')} — add it, or share a link by hand`,'err');
          else
            toast(i18t('ct_internal_complete'));
          setTimeout(()=>{ try{ openShareModal(c); }catch(e){} },500);
        }
      } else {
        toast(`Recorded — ${signersRemaining(c)} signer(s) remaining`);
        notifyNextSigner(c, nxt);
      }
      return;
    }
    await finalizeExecution(c, { by:u, meta });   // last signer is internal
    return;
  }
  // Single-signer path (no route): capture the first party's mark, then seal.
  const sig=await captureSignature(u.name);
  if(!sig) return;
  await finalizeExecution(c, { by:u, meta, firstPartySig:sig });
}

/* Open the free-choice signature pad; falls back to a metadata-only signature
   if the pad module is unavailable. */
async function captureSignature(name){
  if(typeof openSignaturePad!=='function') return { form:'session', image:null, imageHash:null };
  return await openSignaturePad({ name });
}

/* ---- signed on paper ----
   A deal negotiated in HaTi and then signed on paper had nowhere to land. The
   scan could only be uploaded as a NEW contract, so the record of how the
   parties got there — every round, every version, every decision — was
   orphaned from the document those rounds produced. Cross-border deals are
   still signed on paper often enough that this was a real dead end at the last
   step.

   What this does NOT do is pretend HaTi witnessed anything. No electronic
   signature is taken, the seal is the scanned file's own fingerprint, and the
   record says "executed outside HaTi" — the same language a migrated
   already-signed contract carries, because it is the same claim. */
async function attachPaperSignature(c, file, opts={}){
  if(!canEdit()){ toast(i18t('ct_viewers_no_execute'),'err'); return null; }
  if(c.status==='Signed' || (c.execution&&c.execution.at)){
    toast(i18t('ct_already_executed'),'err'); return null; }
  /* The same gate as the electronic route, through the same helper: a scan of
     a signature page is the same claim about the parties, and asked only about
     the old round model it let a room negotiation straight past. */
  const paperBlockers=(window.negoSigningBlockers?negoSigningBlockers(c):
    (window.unresolvedRedlines&&unresolvedRedlines(c)?['there are still open proposed edits']:[]));
  if(paperBlockers.length){
    toast(`${paperBlockers.join('; ')} — settle the negotiation before recording a signature`,'err'); return null; }
  if(file.size>uploadMax()){ toast(uploadTooBigMsg(file),'err'); return null; }

  let dataUrl;
  try{ dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader();
    rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); }); }
  catch(e){ toast(i18t('ct_could_not_read_file'),'err'); return null; }

  const u=currentUser();
  const fileHash=await sha256(dataUrl);
  const at=nowISO();
  let fileId=null;
  if(API_MODE()){
    try{ const r=await api('files','POST',{ name:file.name, mime:file.type||'application/pdf', dataUrl }); fileId=r.id; }
    catch(e){ /* fall back to inline bytes, as the Word return does */ }
  }
  // the server authorises file reads and sweeps files from c.documents
  if(fileId){
    c.documents=Array.isArray(c.documents)?c.documents:[];
    c.documents.push({ fileId, name:file.name, mime:file.type||'application/pdf',
      size:file.size, kind:'paper-signature', at, by:u?.name||'System' });
  }
  // the wording as it stood when the parties signed it, kept as a version
  if(window.captureVersion) captureVersion(c,'Executed on paper', u?.name, {auto:true,listed:true});
  c.execution={ at, by:u?.name||'System', method:'paper', offPlatform:true,
    fileName:file.name, fileHash, fileId, dataUrl:fileId?null:dataUrl,
    signedOn:opts.signedOn||null, note:opts.note||null };
  c.hash=fileHash;                       // the seal IS the scanned file
  c.signedAt=opts.signedOn||at;
  c.status='Signed';
  c.lastAction=todayStr();
  logAudit(c,'Executed outside HaTi',
    `Signed on paper and filed by ${u?.name||'System'} — “${file.name}” (${Math.round(file.size/1024)} KB), SHA-256 ${fileHash.slice(0,16)}…${opts.signedOn?`, signed on ${opts.signedOn}`:''}. No electronic signature was taken in HaTi; the signatures are on the scanned document, which is retained here. The negotiation history above is the record of how this wording was reached.`);
  persist(c); renderWorkspace();
  toast(i18t('ct_filed_on_paper'));
  return c.execution;
}
/* The dialog: a date, an optional note, and the scan itself. */
function openPaperSignatureModal(c){
  if(!canEdit()){ toast(i18t('ct_viewers_no_execute'),'err'); return; }
  openModal(`
    <div style="padding:22px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent);display:inline-flex">${icon('finger')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0">${i18t('ct_signed_on_paper')}</h2></div>
      <p style="font-size:12.5px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">
        Attach the signed copy to <b>this</b> contract, so the ${(c.rounds||[]).length} round${(c.rounds||[]).length===1?'':'s'} of negotiation stay with the document they produced.
        HaTi records it as <b>${i18t('ct_executed_outside')}</b> ${i18t('ct_no_esig_scan')}</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">${i18t('ct_date_signed')}</span>
        <input id="ps-date" type="date" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">${i18t('ct_note_optional')}</span>
        <input id="ps-note" type="text" placeholder="${esc(i18t('ct_ph_signed_note'))}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">${i18t('ct_the_signed_copy')}</span>
        <input id="ps-file" type="file" accept=".pdf,image/*" style="width:100%;font-size:12.5px"/></label>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
        <button id="ps-cancel" class="ui-btn">${i18t('act_cancel')}</button>
        <button id="ps-go" class="ui-btn ui-btn-primary">${i18t('ct_file_as_executed')}</button>
      </div>
    </div>`);
  document.getElementById('ps-cancel').addEventListener('click',closeModal);
  document.getElementById('ps-go').addEventListener('click',async e=>{
    const input=document.getElementById('ps-file');
    const file=input&&input.files&&input.files[0];
    if(!file){ toast(i18t('ct_choose_signed_copy'),'err'); return; }
    const btn=e.currentTarget; btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_filing')}</span>`;
    const ok=await attachPaperSignature(c, file, {
      signedOn:fval('ps-date')||null, note:fval('ps-note')||null });
    if(ok) closeModal(); else { btn.disabled=false; btn.innerHTML='File as executed'; }
  });
}

/* Freeze + seal + (single-signer) record the first mark + distribute. Called
   once, from either completion point (last internal signer here, or a
   counterparty's signature in applyResponse). Idempotent. */
const _sealingInFlight = new Set();   // H-5: guards against a concurrent double-seal
async function finalizeExecution(c, opts={}){
  if(c.status==='Signed' || (c.hash && c.hash!==null)) return;   // already executed
  /* H-5: the guard above runs synchronously, but c.status only becomes 'Signed'
     AFTER several awaits below (freeze + two hashes). Two polls firing close
     together — the interval tick and a focus/visibility refresh — could both
     pass that guard before either committed, and both would seal and distribute:
     duplicate signatures, duplicate audit lines, a double /distribute. An
     in-flight lock keyed by id closes the window. Kept in a Set, not on the
     record, so it is never persisted. */
  if(_sealingInFlight.has(c.id)) return;
  _sealingInFlight.add(c.id);
  try{
  const u=opts.by||currentUser();
  const at=(opts.meta&&opts.meta.at)||nowISO();
  const ip=(opts.meta&&opts.meta.ip)||null;
  const btn=document.getElementById('sign-btn'); if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ct_sealing')}</span>`; }
  /* Stamp the document design the contract is wearing RIGHT NOW onto the
     record, before anything freezes. resolveDocBranding() treats a sealed
     contract's snapshot as final, so this is the moment its look stops
     following the company default (DESIGN-contract-designer.md §5). Chrome
     only — the frozen body, its hash and the seal are untouched. */
  if(window.resolveDocBranding){
    const worn=resolveDocBranding(c);
    if(worn&&worn.designId&&!(c.branding&&c.branding.designId)) c.branding={...worn};
  }
  const exec={ at, method:'session-authenticated', consent:true, ua:(typeof navigator!=='undefined'?navigator.userAgent:''), ip,
    // H-6: freeze the first-party name into the record so the seal binds the
    // name as it was at signing, not the live (renameable) workspace name.
    firstParty:(typeof window!=='undefined'&&window.FIRST_PARTY)||(typeof FIRST_PARTY!=='undefined'?FIRST_PARTY:''),
    /* The statute the signatures rest on, frozen at the moment of sealing —
       a legal claim printed on every copy of an executed contract, so it must
       never follow a later change of the workspace's market setting, and the
       server-built PDF must quote the same sentence the screen showed the
       signer (the eIDAS-vs-Kenya divergence of 02 Aug 2026). */
    esignature:(typeof jxEsignatureShort==='function'?jxEsignatureShort():'') };
  if(!isUpload(c)){
    exec.html=freezeContractHtml(c);
    // Record WHAT was sealed and HOW it was hashed, on the execution record
    // itself. Everything sealed before rich content existed carries neither
    // field, reads as 'text', and re-verifies through the identical path.
    // freezeContractHtml only emits rich markup for a rich WORKING text; a
    // built-in template's rendered layout is not rich content, so both fields
    // are driven off the one condition and can never disagree.
    const richBody=!!(window.isRich&&isRich(c.format)&&c.redlineText);
    exec.format=richBody?'rich':'text';
    exec.hashMode=richBody?'rich':'text';
    exec.textHash=await sha256(window.execHashInput?execHashInput(exec):normText(exec.html));
  }
  c.execution=exec;
  c.signedAt=fmtDT(at)+' EAT';
  c.lastAction=todayStr();
  // The capacity someone signed in, not the permissions they hold. With no
  // title recorded this is just their name — which is true — rather than a
  // claim about authority that the workspace never captured.
  c.signatory=u?(signerTitle(u)?`${u.name} (${signerTitle(u)})`:u.name):(c.signatory||'Authorized signatory');
  c.signatures=c.signatures||[];
  // Single-signer path records the first-party mark here; a route already
  // recorded each signer's mark as they signed.
  if(!signerPlan(c).length && opts.firstPartySig && u){
    const s=opts.firstPartySig;
    c.signatures.push({ party:'first', name:u.name, email:u.email, title:signerTitle(u), at,
      method:'session-authenticated', ip, ua:navigator.userAgent,
      form:s.form, image:s.image, imageHash:s.imageHash, typedName:s.typedName, font:s.font });
  }
  c.sealVersion=2;                       // fold the marks into the seal (see sealString)
  c.hash=await sha256(sealString(c));
  c.status='Signed';
  if(!isUpload(c)) captureVersion(c,'Signed & sealed',u?u.name:'System',{auto:true,listed:true});
  logAudit(c,'Signed',`Executed & sealed — ${(c.signatures||[]).length} signature(s) · ${isUpload(c)?'file':'text'} hash ${(exec.textHash||c.upload?.fileHash||'').slice(0,16)}…${signerProvenance(ip,exec.ua)}`);
  persist(c);                            // critical state saved before any DOM work
  /* AND ACTUALLY WRITTEN, before anything reads it back off the server.

     `persist` only marks the contract dirty and sets a 400 ms timer.
     distributeExecuted below POSTs to /distribute, and the server checks the
     STORED status before it will send an executed copy — so the request
     overtook the save, the server saw a contract that was not yet Signed, and
     answered "Contract is not executed yet". That sentence was then filed on
     the distribution record and printed in the signature panel of a contract
     the same panel had just marked Executed & sealed, with both parties shown
     as Failed. Nobody received their copy. */
  try{ await flushSaves(); }catch(_){}
  // Re-render if the contract is open; guarded so a headless finalize (the
  // counterparty signs last while the contract isn't on screen) can't fail.
  try{
    const canvas=document.getElementById('doc-canvas'); if(canvas){ canvas.innerHTML=docBodyStructured(c); wireDocCanvas(c); }
    if(typeof updateStatusUI==='function') updateStatusUI(c);
    /* The bar that says what to do next. Left alone, it kept the sentence it
       had a second earlier — "Erik has signed. Your signature is the only thing
       left." — on a contract that was by then executed and sealed, until the
       reader happened to reload. That is the last screen of the whole journey. */
    if(typeof renderActionBar==='function') renderActionBar(c);
    renderSignButton(c); renderAuditSection(c);
  }catch(e){ /* not on screen — fine */ }
  if(!opts.silent){
    // Say what actually happened. With a counterparty still to sign, "Signed
    // & sealed" alone reads as "done" — which is exactly the misreading the
    // Partially-signed chip exists to prevent.
    const waiting = window.bothPartiesSigned && !bothPartiesSigned(c);
    toast(waiting
      ? `Sealed with your signature — ${c.counterparty||'the counterparty'} still has to sign. Copies go out when their signature lands.`
      : 'Signed & sealed — the exact text is frozen and fingerprinted');
  }
  distributeExecuted(c);                 // email a sealed copy to every party
  } finally { _sealingInFlight.delete(c.id); }   // H-5: release the seal lock
}

/* Auto-distribute the executed copy to every party (§ auto-distribution).

   HELD UNTIL EVERY PARTY HAS SIGNED, and that is not the same test as "the
   contract is sealed". Sealing happens on the first signature so the wording
   stops moving; a copy sent at that moment is a document with one signature on
   it, sealed and fingerprinted, arriving in the other side's inbox reading
   exactly like a finished agreement. Nobody should be filing that as their
   record of the deal.

   `opts.force` is the owner pressing the button in the signature panel with
   their eyes open. It still does not send a half-signed COPY — the server
   answers a part-signed contract with a progress notice carrying no seal and no
   link — it only says the notice may go now rather than waiting. */
async function distributeExecuted(c, opts={}){
  if(c.distribution && c.distribution.at) return;                 // send once
  if(!opts.force && window.bothPartiesSigned && !bothPartiesSigned(c)) return;
  const recipients=(typeof distributionRecipients==='function')?distributionRecipients(c):[];
  if(!recipients.length){ return; }
  /* `fully` is stamped onto the record so a later reader can tell WHICH send
     this was: the executed copy, or only a part-signed progress notice. The
     late-distribution catch in applyResponse (core.js) reads it — a progress
     notice must not stand in for the copy when the last signature lands. */
  const fully=!window.bothPartiesSigned||bothPartiesSigned(c);
  if(API_MODE()){
    try{
      const appUrl=location.origin+location.pathname;
      const res=await api('contracts/'+c.id+'/distribute','POST',{ recipients, appUrl });
      c.distribution={ at:res.at||nowISO(), triggeredBy:'auto',
        fully:(res.fullyExecuted!==undefined?!!res.fullyExecuted:fully),
        recipients:res.recipients||recipients.map(r=>({...r,status:'queued'})) };
    }catch(e){
      // fully:false on a failed request, so the next signature landing (or a
      // manual Send again) retries rather than treating the failure as sent.
      c.distribution={ at:nowISO(), triggeredBy:'auto', fully:false, error:e.message, recipients:recipients.map(r=>({...r,status:'failed'})) };
    }
  } else {
    c.distribution={ at:nowISO(), triggeredBy:'manual', fully, recipients:recipients.map(r=>({...r,status:'mailto'})) };
  }
  logAudit(c,'Distributed',fully
    ? `Executed copy ${API_MODE()?'emailed to':'prepared for'} ${recipients.length} recipient(s)`
    : `Part-signed progress notice ${API_MODE()?'emailed to':'prepared for'} ${recipients.length} recipient(s) — no copy and no seal were sent, because not every party has signed`);
  persist(c); renderSignButton(c);
}

/* Best-effort "it's your turn" nudge to the next INTERNAL signer — internal
   only, on purpose. This early return used to be W7's fault 1: counterparty
   signers were skipped in silence, because the only email anyone could send
   them said "sign in to HaTi" and they have no account. They are now emailed
   their own bound link by the signing route instead — issueSigningRouteLinks
   at issue time, the server's releaseNextSignerLink for every turn after —
   so a counterparty landing here is handled elsewhere, not unhandled. */
async function notifyNextSigner(c, nxt){
  if(!API_MODE() || !nxt || nxt.party!=='internal' || !/.+@.+\..+/.test(nxt.email||'')) return;
  try{ await api('contracts/'+c.id+'/notify-signer','POST',{ email:nxt.email, name:nxt.name, order:nxt.order }); }catch(e){}
}

/* Distribution panel shown in the sign area once a contract is executed. */
function distributionPanelHtml(c){
  const d=c.distribution;
  const dot=st=>['delivered','queued','sent'].includes(st)?'var(--st-green-dot)'
    :['failed','bounced'].includes(st)?'var(--st-ruby-dot)'
    :st==='outbox'?'var(--st-amber-dot)':'#8a8f95';
  const stTxt=st=>st==='delivered'?'Delivered':(st==='queued'||st==='sent')?'Sent':st==='failed'?'Failed':st==='bounced'?'Bounced':st==='mailto'?'Ready to email':st==='outbox'?'In outbox — email not set up':st;
  /* WHY NOTHING HAS GONE OUT YET, said before anyone has to wonder. The copy is
     held until every party has signed; a panel that simply showed the button
     and never fired it would read as a broken feature rather than a rule. */
  const ex=(typeof executionParties==='function')?executionParties(c):{fully:true};
  if(!d){
    if(!canEdit()) return '';
    return `<div class="mt-2 rounded-xl border border-line bg-white p-3">
      <div class="text-[11px] font-600 text-ink mb-1">${i18t('ct_distribute_copies')}</div>
      <div class="text-[10.5px] text-ink/60 mb-2">${ex.fully
        ? 'Email a sealed copy of the executed contract to every party for their records — the platform keeps the master copy.'
        : `Held: only <b>${(ex.ourName||'one party').replace(/</g,'&lt;')}</b> has signed, so the copy is not going out. Both parties have to sign before the contract is shared. Sending now delivers a progress notice — who has signed, who has not — with no copy and no seal in it.`}</div>
      <button id="dist-send" class="w-full flex items-center justify-center gap-1.5 rounded-lg ${ex.fully?'bg-brand-900 text-white hover:bg-brand-800':'border border-line text-brand-700 hover:bg-brand-50'} py-2 text-[11.5px] font-600">${icon('share','w-3.5 h-3.5')} ${ex.fully
        ? 'Send signed copies to all parties'
        : 'Send a progress notice to all parties'}</button>
    </div>`;
  }
  const rows=(d.recipients||[]).map(r=>`<div class="py-1 text-[11px]">
    <div class="flex items-center gap-2">
    <span class="min-w-0 flex-1"><span class="text-ink/80 font-500">${(r.name||r.email||'').replace(/</g,'&lt;')}</span>${r.role?` <span class="text-ink/45">· ${String(r.role).replace(/</g,'&lt;')}</span>`:''}${r.attached?` <span class="text-[8.5px] font-mono px-1 py-px rounded bg-brand-50 text-brand-600" title="${i18t('ct_executed_attached')}">${i18t('ct_doc_attached')}</span>`:''}<br><span class="font-mono text-[9.5px] text-ink/45">${(r.email||'').replace(/</g,'&lt;')}</span></span>
    <span class="text-[9.5px] font-mono flex items-center gap-1 shrink-0" style="color:${dot(r.status)}"><span style="width:6px;height:6px;border-radius:999px;background:${dot(r.status)}"></span>${stTxt(r.status)}</span>
    </div>
    ${r.detail?`<div class="text-[9.5px] mt-0.5" style="color:${dot(r.status)}">${String(r.detail).replace(/</g,'&lt;')}</div>`:''}
  </div>`).join('');
  return `<div class="mt-2 rounded-xl border border-line bg-white p-3">
    <div class="flex items-center gap-2 mb-1"><span class="text-[11px] font-600 text-ink">${i18t('ct_copies_sent')}</span>
      <span class="text-[9px] font-mono text-ink/45 ml-auto">${d.at?fmtDT(d.at):''}</span></div>
    ${rows||`<div class="text-[10.5px] text-ink/50">${i18t('ct_no_recipients')}</div>`}
    ${d.error?`<div class="text-[10px] text-rose-600 mt-1">${String(d.error).replace(/</g,'&lt;')}</div>`:''}
    ${canEdit()?`<button id="dist-send" class="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-line text-brand-700 py-1.5 text-[11px] font-600 hover:bg-brand-50">${icon('share','w-3 h-3')} Send again</button>`:''}
    ${!API_MODE()?`<div class="text-[9.5px] text-ink/45 mt-1.5">${i18t('ct_static_mode_email')}</div>`:''}
  </div>`;
}



Object.assign(window,{wsChromeFolded,applyWsCollapse,wireWsCollapse,WS_FOLD_KEY,applyDocZoom,renderDiscussSection,discussPointsSectionHtml,loadDiscussion,attachPaperSignature,openPaperSignatureModal,WORD_REFUSAL,WORD_REFUSAL_SHORT,detectWordBytes,detectWordFile,extractWordText,trackedNote,bytesToLatin,actionBarHtml,applyMetadata,captureSignature,dataUrlBytes,distributeExecuted,distributionPanelHtml,docBody,docBodyStructured,docBodyHtml,docFileUrl,documentTextHtml,externalExecutionBlock,templateProvenanceHtml,extractDocText,extractPdfText,fillKeyTermsFromDocument,finalizeExecution,findingsFromText,focusKeyTerms,frozenDocBody,inflateBytes,keyTermsProgress,notifyNextSigner,openDocReader,openEditDocModal,openUploadModal,pdfRunsToText,pdfRunsToLines,pdfStringsFrom,pdfTextRuns,pdfLatin,pdfStreamIsCompressed,looksLikeText,pdfIndexObjects,pdfExpandObjStreams,pdfPageObjects,pdfPageFonts,pdfStreamBytes,pdfRef,pdfDictVal,pdfFontWidths,base14Widths,pdfRunWidth,pdfArray,pdfNum,pdfKeyIndex,pdfFontStyle,redlineDocBody,renderActionBar,renderFeed,issueSigningAct,rereadUploadText,syncKeyTermsUI,wireActionBar,wireKeyTerms,
  /* ---- THE ROWS WERE NOT CLICKABLE IN A REAL BROWSER ----
     Key terms became read-first, edit-on-click, and the binder for that never
     reached the window. This file's globals are not automatic; the assign
     below IS the export list, and applyWsTabs guards its call with
     `if(window.wireKtRows)` — so in the app the guard was simply false and
     every row sat there looking editable and doing nothing. It passed the unit
     tests because the test stage evaluates these modules into one shared
     scope, where a bare `wireKtRows` resolves whether it was exported or not.
     Caught by driving the real page. ktTermsRowsHtml and renderKeyTerms go
     with it: the same guard-and-miss is waiting for both. */
  wireKtRows,ktTermsRowsHtml,ktReadValue,ktIsEmptyRead,renderKeyTerms,
  /* And layoutDocResizer, for the same reason and with worse consequences: the
     line that re-measures the Document pane the moment its tab is shown is
     guarded on `window.layoutDocResizer`. Unexported, that guard was false, so
     the recovery from a zero-width measurement — the whole point of that fix —
     never ran on a plain tab swap. It only appeared to work because the routes
     I walked it on re-rendered the workspace, which measures on the way in. */
  layoutDocResizer,renderSignButton,renderSignSide,signBlockHtml,signPartyBoxes,renderWorkspace,sentenceAround,signDocument,signatureBlock,submitUpload,uploadConfirmHtml,runUploadPipeline,upField,updateStatusUI,uploadDocBody,uploadScanRules,wireComments,wireCompliance,wireDocumentSync,wsNextAction,
  wsTabDefaults,applyWsTabs,wireWsTabs,negoTabCountHtml,openNegotiationOwnerRoom,negoRepaintOpenRoom,openNegoProposeModal,
  ROOM_TABS,roomTabsHtml,roomGoTab,roomOpenOnTerms,roomCurrentTab,wsTabDefaults,roomPaintHistory,roomHistoryHtml,roomHistoryEvents,roomVersionsHtml,docFillable,wireChecksCard,renderChecksCard,checksRowsHtml,checkVerdict,tplFormOpenCount,openCheckPanel,roomHeadHtml,wireRoomHead});
