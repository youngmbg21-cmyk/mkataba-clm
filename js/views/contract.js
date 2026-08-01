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

function openUploadModal(){
  if(!canEdit()){ toast('Viewers cannot add contracts','err'); return; }
  const folderOpts=folderOptionsHtml(null, false);
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('upload')}</span>
        <h2 class="font-display font-700 text-brand-900">Upload a received contract</h2></div>
      <p class="text-xs text-brand-800/70 mb-4">Add a contract another company sent you — on their own paper. Attach the file and a few details, then review, Copilot-scan and sign it here, with a full audit trail and a cryptographic seal.</p>
      <label class="block mb-3">
        <span class="text-xs font-medium text-brand-800/70">Contract file <span class="text-brand-800/65">(PDF, Word .docx, image or text · max ${uploadMaxLabel()} · legacy .doc must be re-saved first)</span></span>
        <input id="up-file" type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" class="mt-1 w-full text-sm rounded-lg border border-brand-100 bg-canvas p-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-900 file:text-white file:px-3 file:py-2 file:text-xs file:font-medium"/>
      </label>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        ${upField('up-name','Contract name','e.g. Supply Agreement — Acme')}
        ${upField('up-cp','Received from (counterparty)','e.g. Acme Ltd')}
        ${upField('up-cpemail','Their email (so you can send it back)','them@company.co.ke','email')}
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        <label class="block"><span class="text-xs font-medium text-brand-800/70">File under</span>
          <select id="up-folder" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">${folderOpts}</select></label>
        <label class="block"><span class="text-xs font-medium text-brand-800/70">Value type</span>
          <select id="up-vtype" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">
            <option value="estimated">Estimated value</option><option value="fixed">Fixed value</option><option value="none">Non-monetary</option></select></label>
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-4">
        ${upField('up-value',`Contract value (${jxCurrency()})`,'e.g. 2500000','number')}
        ${upField('up-expiry','Expiry date (optional)','','date')}
      </div>
      <div id="up-steps" class="hidden" style="margin-bottom:4px"></div>
      <div id="up-actions" class="flex items-center gap-2 justify-end">
        <button id="up-cancel" class="rounded-lg border border-brand-200 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">Cancel</button>
        <button id="up-go" class="flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition">${icon('upload','w-3.5 h-3.5')} Add contract</button>
      </div>
    </div>`);
  document.getElementById('up-cancel').addEventListener('click',closeModal);
  document.getElementById('up-go').addEventListener('click',submitUpload);
  bindFolderSelect(document.getElementById('up-folder'));
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
      const dot=done?`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:#2e8763;color:#fff">${icon('check2','w-2.5 h-2.5')}</span>`
        :cur?`<span class="scan-pulse" style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-accent);color:#fff;font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`
        :`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-neutral-200);color:var(--color-neutral-600);font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`;
      const col=done?'#1e6b4d':cur?'var(--color-accent-800)':'var(--color-neutral-500)';
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:${cur?600:500};color:${col}">${dot}${s}</span>`
        + (n<UPLOAD_STEPS.length?`<span style="color:var(--color-neutral-400);margin:0 1px">→</span>`:''); }).join('')}
   </div>
   ${note?`<div id="up-step-note" style="margin-top:7px;font-size:11px;color:var(--color-neutral-600);display:flex;align-items:center;gap:6px">
     <span class="scan-pulse" style="width:6px;height:6px;border-radius:50%;background:var(--color-accent);flex:none"></span>${String(note).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`:''}
  </div>`;
}
async function submitUpload(){
  const fileInput=document.getElementById('up-file');
  const file=fileInput.files&&fileInput.files[0];
  if(!file){ toast('Choose a file to upload','err'); return; }
  if(file.size>uploadMax()){ toast(uploadTooBigMsg(file),'err'); return; }
  const cp=fval('up-cp');
  const cpEmail=fval('up-cpemail');
  if(cpEmail && !/.+@.+\..+/.test(cpEmail)){ toast(`"${cpEmail}" is not an email address`,'err'); return; }
  const name=fval('up-name')||file.name.replace(/\.[^.]+$/,'');
  const folder=document.getElementById('up-folder').value;
  const vtype=document.getElementById('up-vtype').value;
  const value=vtype==='none'?0:Number(fval('up-value')||0);
  const expiry=fval('up-expiry')||null;
  const btn=document.getElementById('up-go'); const cancelBtn=document.getElementById('up-cancel');
  btn.disabled=true; if(cancelBtn) cancelBtn.disabled=true;
  btn.innerHTML='<span class="animate-pulse">Working…</span>';
  renderUploadSteps(1);   // Step 1 — Reading document
  const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); }).catch(()=>null);
  if(!dataUrl){ toast('Could not read that file','err'); btn.disabled=false; if(cancelBtn) cancelBtn.disabled=false; return; }
  const mime=file.type||'application/octet-stream';
  // Legacy .doc is still refused BEFORE anything is created — a silent empty
  // shell in the register is worse than a clear refusal. Modern .docx is read
  // for real (see js/docx.js) and goes through the same pipeline as a PDF.
  const word=detectWordFile(dataUrl, mime, file.name);
  const refuse=(msg)=>{
    toast(msg,'err');
    const steps=document.getElementById('up-steps');
    if(steps){ steps.classList.remove('hidden');
      steps.innerHTML=`<div style="border:1px solid #e6c9c1;background:#fdf4f2;color:#8f322b;border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.55">${msg}</div>`; }
    btn.disabled=false; if(cancelBtn) cancelBtn.disabled=false;
    btn.innerHTML=`${icon('upload','w-3.5 h-3.5')} Add contract`;
  };
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
    else if(ocr.error) toast('Could not read this scan: '+ocr.error,'err');
  }
  const u=currentUser();
  const upload={ fileName:file.name, mime, size:file.size, fileHash, uploadedAt:nowISO(), uploadedBy:u?.name||'System',
    docKind:word||null, extractedText, textChars:extractedText.length, dataUrl, textSource,
    ocrPages: ocr?ocr.pages:0, ocrSkippedPages: ocr?ocr.skippedPages:0, ocrTotalPages: ocr?ocr.totalPages:0,
    ocrIllegible: ocr?ocr.illegible:0 };
  // API mode: store bytes on the server and keep only a reference in the synced record.
  if(API_MODE()){
    try{ const r=await api('files','POST',{ name:file.name, mime, dataUrl });
      upload.fileId=r.id; }catch(e){ /* fall back to inline bytes */ }
  }
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
  const saveContract=(metadata)=>{
    if(metadata){ applyMetadata(c, metadata); }
    state.contracts.unshift(c);
    state.activeId=c.id;
    persist(c);
    closeModal();
    toast('Contract uploaded and filed in '+FOLDERS[folder].name);
    setView('workspace');
    renderSideFolders();
  };
  // E1: extract metadata from the text, then let the human confirm before saving.
  if(extractedText && extractedText.length>200){
    renderUploadSteps(2, isOcrText(textSource)?'Reading details out of the machine-read text…':null);
    const meta=await extractMetadata(extractedText, {counterparty:cp, value, expiry});
    // Anything read out of an OCR'd scan is capped at medium confidence — OCR
    // misreads dates and amounts, and those are what the reminders fire on.
    if(isOcrText(textSource)) capConfidenceForOcr(meta);
    renderUploadSteps(3);   // Step 3 — Ready for your review (the confirm screen)
    openMetaReview(meta, saveContract, { onCancel:()=>saveContract(null),
      ocrNotice: isOcrText(textSource)?ocrProvenanceLine(upload):'' });
  } else {
    saveContract(null);
  }
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
function redlineDocBody(c){
  return `
    <div class="mb-6 pb-5 border-b border-brand-100">
      <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-800/60 mb-2">${cKind(c)} · working text · ${c.id}</div>
      <h3 class="font-display font-700 text-lg tracking-tight text-brand-900">${esc(c.name)}</h3>
    </div>
    <div class="mb-4 flex items-start gap-2 rounded-[4px] px-3 py-2 text-[11px]" style="background:var(--color-accent-100);border:1px solid var(--color-accent-300);color:var(--color-accent-800)" data-anchor="recital">
      ${icon('history','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>This document carries <strong>edited working text</strong>. Use <strong>Edit</strong> to change the wording and <strong>Compare</strong> to review changes between versions — the seal binds this exact text at signing.</span>
    </div>
    <div style="color:var(--color-doc-text)" data-anchor="redline">${docBodyHtml(c,{size:'13.5px', lh:'1.85'})}</div>
    ${signatureBlock(c)}`;
}

/* Plain-text document editor (Admin + Legal). Saves are versioned so
   Compare shows exactly what changed; the audit trail records the edit. */
function openEditDocModal(c){
  if(!canEdit()){ toast('Viewers cannot edit documents','err'); return; }
  if(c.status==='Signed'){ toast('Executed contracts are sealed and read-only','err'); return; }
  // the Word-review soft lock: edits made here while the file is out would
  // silently lose to (or clobber) the wording coming back from Word
  const wasRich=!!(window.isRich&&isRich(c.format)&&c.redlineText);
  const cur=wasRich ? docPlainText(c)
    : (window.reflowWorkingText?reflowWorkingText(docPlainText(c)):docPlainText(c));
  if(!cur){ toast('This document has no editable text yet','err'); return; }
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const firstEdit=!c.redlineText&&!isUpload(c);
  // Full-window editor: the dialog takes the whole screen and the wording sits
  // in a centred book-page column — same save-and-version behaviour, more room.
  const COL='width:100%;max-width:800px;margin-left:auto;margin-right:auto;flex:none';
  openModal(`
    <div style="padding:24px 26px 20px;height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="${COL};padding:0 26px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Edit document — ${c.id}</h3></div>
        <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 10px;line-height:1.5">Change any wording below and save. Every save is captured as a <b>new version</b> — review it under <b>Compare</b> and share the updated text with the counterparty as usual.${firstEdit?' <b>Note:</b> the first edit converts the drafted layout into working text; the highlighted quick-fill fields no longer apply after that.':''}</p>
        ${wasRich?`<div style="display:flex;gap:7px;align-items:flex-start;border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:4px;padding:8px 11px;margin:0 0 10px;font-size:11.5px;line-height:1.5;color:var(--color-accent-800)">
          <span style="flex:none;margin-top:1px">${icon('alert','w-3.5 h-3.5')}</span>
          <span>This document carries <b>formatting</b> — headings, bold, numbered clauses, tables. This is the plain-text editor, so saving here <b>converts it to plain text and the formatting is lost</b>. The clause numbers below are written out as text so the wording survives. Cancel if you did not intend that.</span></div>`:''}
      </div>
      <textarea id="ed-text" class="scroll-thin" spellcheck="false" style="${COL};flex:1 1 auto;min-height:0;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:22px 26px;font:inherit;font-size:15px;line-height:1.95;resize:none;outline:none">${esc(cur)}</textarea>
      <div style="${COL};padding:0 26px;margin-top:12px">
        <label style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:9px 11px;font-size:11.5px;cursor:pointer">
          <input type="checkbox" id="ed-from-cp" style="margin-top:2px;flex:none"/>
          <span><b>These changes came from ${esc(c.counterparty||'the counterparty')} (received outside HaTi).</b>
          <span style="display:block;color:var(--color-neutral-600);line-height:1.5;margin-top:2px">Tick this when you are typing in wording they sent by email, Word or on the phone. It is filed as a negotiation round <b>in their name</b> and waits for your decision, instead of being recorded as your own edit.</span></span>
        </label>
      </div>
      <div style="${COL};padding:0 26px;display:flex;justify-content:space-between;align-items:center;margin-top:10px">
        <span id="ed-count" style="font-size:10.5px;color:var(--color-neutral-500)">${cur.length.toLocaleString()} characters</span>
        <span style="display:flex;gap:8px">
          <button id="ed-cancel" class="ui-btn">Cancel</button>
          <button id="ed-save" class="ui-btn ui-btn-primary">${icon('check2','w-3.5 h-3.5')} Save changes</button>
        </span>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  const ta=document.getElementById('ed-text');
  ta.addEventListener('input',()=>{ const el=document.getElementById('ed-count'); if(el) el.textContent=ta.value.length.toLocaleString()+' characters'; });
  document.getElementById('ed-cancel').addEventListener('click',closeModal);
  document.getElementById('ed-save').addEventListener('click',()=>{
    const txt=ta.value;
    if(txt.trim()===cur.trim()){ toast('No changes made'); closeModal(); return; }
    if(!txt.trim()){ toast('The document text cannot be empty','err'); return; }
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
    toast('Changes saved — open Compare to review them');
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
    <div id="ws-openpoints" style="border:1px solid #e0c48a;background:#fdf6e7;border-radius:8px;padding:14px 18px;margin:0 0 14px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
        <span style="flex:none;color:#b8862b;display:inline-flex">${icon('alert','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;color:#7d5a14">Still open between you</span>
        <span style="margin-left:auto;font-size:10.5px;color:#7d5a14;font-family:var(--font-mono)">${pts.length} point${pts.length===1?'':'s'}</span>
      </div>
      <p style="margin:0 0 10px;font-size:11.5px;line-height:1.55;color:#7d5a14">Changes ${who} asked for that were not adopted. The contract reads as it did; answering here changes nothing in it.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${pts.map((pt,i)=>`
          <div style="border:1px solid #e8d5ad;background:var(--color-surface);border-radius:6px;padding:9px 12px;font-size:12px;line-height:1.6">
            ${pt.before?`<div><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">Contract says</span>
              <div style="color:var(--color-neutral-800)">${e(pt.before)}</div></div>`:''}
            ${pt.after?`<div style="margin-top:5px"><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">They asked for</span>
              <div style="color:#8f322b">${e(pt.after)}</div></div>`:''}
            ${pt.ask?`<div style="margin-top:5px;font-size:11.5px;color:var(--color-neutral-700)"><b>They said:</b> ${e(pt.ask)}</div>`:''}
            ${pt.reason?`<div style="margin-top:4px;font-size:11.5px;color:var(--color-neutral-700)"><b>You replied:</b> ${e(pt.reason)}</div>`:''}
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
      <div class="text-[11px] font-600 uppercase tracking-[0.14em] text-brand-800/60">Document preview</div>
      <button type="button" data-expand-doc class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-600 text-brand-700 hover:border-brand-400 hover:text-brand-900 transition">${icon('expand','w-3.5 h-3.5')} Expand</button>
    </div>` : '';
  const preview = previewHead + ((isPdf||isText)
    ? `<iframe id="uploaded-doc-frame" src="${fileUrl}" class="w-full h-[calc(100vh-235px)] min-h-[560px] rounded-xl border border-brand-100 bg-white elev-1" title="Uploaded document"></iframe>`
    : isImg
    ? `<div class="rounded-xl border border-brand-100 bg-white elev-1 overflow-auto max-h-[calc(100vh-235px)] min-h-[420px] grid place-items-start"><img id="uploaded-doc-frame" src="${fileUrl}" class="max-w-full" alt="Uploaded document"/></div>`
    : (isDocx&&!c.redlineText&&(u.extractedText||'').length>40)
    ? `<div class="flex items-center justify-between gap-2 mb-2">
         <div class="text-[11px] font-600 uppercase tracking-[0.14em] text-brand-800/60">Reading view — text read out of the Word file</div>
       </div>
       <div class="scroll-thin rounded-xl border border-brand-100 bg-white elev-1 overflow-y-auto max-h-[calc(100vh-235px)] min-h-[420px]" style="padding:26px 30px">${documentTextHtml(u.extractedText,{size:'13px',lh:'1.85'})}</div>`
    : `<div class="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-10 text-center">
         <div class="text-brand-300 mb-2 flex justify-center">${icon('file','w-8 h-8')}</div>
         <div class="text-sm font-600 text-brand-800/80">${u.fileName||'Document'}</div>
         <div class="text-xs text-brand-800/65 mt-1">This file type can't preview in the browser — download the original to review it.</div>
       </div>`);
  const sizeKB = u.size?Math.round(u.size/1024):0;
  return `
    <div class="mb-6 pb-5 border-b border-brand-100">
      <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-800/60 mb-2">External Document · received · ${c.id}</div>
      <h3 class="font-display font-700 text-lg tracking-tight text-brand-900">${esc(c.name)}</h3>
    </div>
    <div class="mb-5 flex items-start gap-2 rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-2.5 text-[11px] text-gold-700" data-anchor="doc">
      ${icon('upload','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>${isExternallyExecuted(c)
        ? `This contract was <strong>executed outside HaTi</strong>${c.counterparty?` with <strong>${esc(c.counterparty)}</strong>`:''} and migrated in as a record. It is filed for reference, renewal and reporting — there is nothing to sign here.`
        : `This is a contract <strong>received from ${c.counterparty||'a counterparty'}</strong>, on their own paper. Review it below, run the Copilot review, then sign to record <strong>${FIRST_PARTY}</strong>’s acceptance with a cryptographic seal.`}</span>
    </div>
    ${PORTAL_MODE?'':`
    ${ocrBannerHtml(u)}
    <div class="mb-4 grid sm:grid-cols-2 gap-2 text-[11px]">
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">Original file</div><div class="font-medium text-brand-900 truncate">${u.fileName||'—'} · ${sizeKB} KB</div></div>
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">Uploaded</div><div class="font-medium text-brand-900 truncate">${u.uploadedBy||'—'} · ${u.uploadedAt?fmtDT(u.uploadedAt):'—'}</div></div>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <a href="${fileUrl}" download="${(u.fileName||'contract').replace(/"/g,'')}" class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download original</a>
      <span class="inline-flex items-center gap-1.5 rounded-lg border ${u.textChars>200?(isOcrText(u.textSource)?'border-gold-500/25 bg-gold-500/10 text-gold-700':'border-brand-100 bg-brand-50/50 text-brand-700'):'border-gold-500/25 bg-gold-500/10 text-gold-700'} px-3 py-2 text-[11px]">${icon('scan','w-3.5 h-3.5')}${u.textChars>200
        ? `${Number(u.textChars).toLocaleString()} characters ${isOcrText(u.textSource)?`machine-read from ${u.ocrPages||'the'} scanned page${u.ocrPages===1?'':'s'}`:'read'} — Copilot review analyses the actual text`
        : 'Text not machine-readable — Copilot review falls back to a manual checklist'}</span>
      ${canEdit()?`<button type="button" data-reread class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition" title="Read the original file again — use this if the extracted text looks garbled">${icon('history','w-3.5 h-3.5')} Re-read document</button>`:''}
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
        <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--color-neutral-600)">Working text (edited)</span>
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
  if(!canEdit()){ toast('Viewers cannot change contracts','err'); return; }
  const u=c.upload||{};
  const restore=btn?btn.innerHTML:'';
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Reading…</span>'; }
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
    toast('Could not re-read this document — '+e.message,'err');
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
          <div class="min-w-0"><div class="text-sm font-700 text-brand-900 truncate">${name||'Document'}</div><div class="text-[11px] text-brand-800/60">Received document · full-screen reader</div></div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="${url}" download="${(name||'contract').replace(/"/g,'')}" class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-600 text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download</a>
          <button type="button" data-close-reader class="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 text-white px-3 py-2 text-xs font-600 hover:bg-brand-800 transition">${icon('close','w-3.5 h-3.5')} Close</button>
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
  const CP=`<input ${dis} type="text" value="${(c.counterparty||'').replace(/"/g,'&quot;')}" placeholder="Counterparty name" data-sync="counterparty" class="field"/>`;
  const VAL=`<input ${dis} type="number" value="${c.value||''}" placeholder="0" data-sync="value" data-money="1" class="field field-num"/>`;
  // Presentational clause flags — reuse the app's EXISTING scan findings
  // (openFindings), map each to its clause anchor, keep the worst severity.
  const flags={};
  try{ (window.openFindings?openFindings(c):[]).forEach(x=>{ const a=x.anchor;
    if(/^c\d+$/.test(a||'')){ const r=(window.SEV_RANK&&SEV_RANK[x.sev])||{high:3,med:2,low:1}[x.sev]||0;
      if(!flags[a]||r>flags[a].r) flags[a]={r,sev:x.sev}; } }); }catch(e){}
  const FLAGPAL={ high:{tag:'High',bg:'#f1dcd8',fg:'#8f322b',box:'rgba(176,69,60,.05)',line:'rgba(176,69,60,.3)'},
    med:{tag:'Deviation',bg:'#f1e6cd',fg:'#7d5a14',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'},
    low:{tag:'Check',bg:'#f1e6cd',fg:'#7d5a14',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'} };
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

  // Each builder returns { title, recital, clauses[] }. Clause 'c2' holds the
  // contract value for most types (NDA has no value; scanRules mirrors this).
  const BUILD = {
    RM:()=>({ title:'RAW MATERIAL SUPPLY AGREEMENT',
      recital:`This Raw Material Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('material','e.g. refined sugar')} into the Buyer's production facilities in Kenya.`,
      clauses:[
        clause(1,'Supply & Specification',`The Supplier shall supply an estimated ${N('volume',5000)} metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard, delivered DDP to the Buyer's plant.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is KES ${VAL}, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT.`),
        clause(3,'Quality & Rejection',`Consignments failing specification or Public Health / KEBS requirements may be rejected within ${N('inspectDays',3)} days of delivery, with replacement at the Supplier's cost.`),
        clause(4,'Governing Law',`This Agreement is governed by the laws of Kenya, with disputes referred to arbitration in Nairobi under the Nairobi Centre for International Arbitration.`),
      ]}),
    PK:()=>({ title:'PACKAGING SUPPLY AGREEMENT',
      recital:`This Packaging Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('packType','e.g. PET bottles & preforms')} and related packaging materials.`,
      clauses:[
        clause(1,'Scope of Supply',`The Supplier shall manufacture and supply packaging to the Buyer's approved artwork and specification, against a rolling forecast, to the Buyer's plants in Kenya.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is KES ${VAL}, on agreed per-unit pricing. Any dedicated tooling is owned by the Buyer and listed in Annexure A.`),
        clause(3,'Forecast, Lead Time & Stock',`The Buyer issues a ${N('forecastWeeks',8)}-week rolling forecast; the Supplier holds ${N('safetyDays',14)} days of safety stock and honours agreed lead times.`),
        clause(4,'Intellectual Property & Governing Law',`All trademarks and artwork remain the Buyer's property. This Agreement is governed by the laws of Kenya.`),
      ]}),
    CM:()=>({ title:'CONTRACT MANUFACTURING & CO-PACKING AGREEMENT',
      recital:`This Contract Manufacturing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Brand Owner") and ${CP} (the "Co-Packer") for the manufacture of ${T('product','e.g. powdered beverages')} to the Brand Owner's specification.`,
      clauses:[
        clause(1,'Manufacturing Scope',`The Co-Packer shall manufacture, fill and pack the products to the Brand Owner's recipe and specification at its licensed facility. All formulations and recipes remain the exclusive property of the Brand Owner.`),
        clause(2,'Tolling Fee & Contract Value',`The estimated annual contract value is KES ${VAL}, billed as a per-unit conversion (tolling) fee and reconciled monthly against actual output.`),
        clause(3,'Quality, Food Safety & Licences',`The Co-Packer shall maintain FSSC 22000 / KEBS certification and valid Public Health and KRA licences, and permit the Brand Owner to audit on ${N('auditNotice',7)} days' notice.`),
        clause(4,'Liability & Governing Law',`The Co-Packer is liable for defects arising from its process, including recall costs. This Agreement is governed by the laws of Kenya.`),
      ]}),
    EQ:()=>({ title:'EQUIPMENT LEASE & MAINTENANCE AGREEMENT',
      recital:`This Equipment Lease is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Lessee") and ${CP} (the "Lessor") for the lease of ${T('equipment','e.g. a PET filling line')} installed at the Lessee's plant.`,
      clauses:[
        clause(1,'Equipment & Title',`The Lessor shall install and commission the equipment at the Lessee's premises. Title to the equipment remains with the Lessor at all times during the term.`),
        clause(2,'Lease Charges',`The Lessee shall pay a monthly lease charge of KES ${VAL}, in advance, exclusive of VAT.`),
        clause(3,'Maintenance & Uptime',`The Lessor guarantees ${N('uptime',95)}% availability with an on-site response within ${N('respHrs',24)} hours, and holds critical spares locally.`),
        clause(4,'Term, Insurance & Governing Law',`The term is ${N('termYears',3)} years. The Lessee shall insure the equipment to full replacement value with the Lessor noted as loss payee. Kenyan law governs.`),
      ]}),
    WH:()=>({ title:'WAREHOUSING & COLD-CHAIN SERVICES AGREEMENT',
      recital:`This Warehousing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Provider") for third-party storage and handling at ${T('site','e.g. Industrial Area, Nairobi')}.`,
      clauses:[
        clause(1,'Storage & Handling',`The Provider shall store up to ${N('pallets',1200)} pallet positions, including ${T('tempRange','e.g. 2–8°C chilled')} temperature-controlled space, with inventory managed on the Client's WMS.`),
        clause(2,'Service Charge',`The monthly service charge is KES ${VAL}, based on pallet positions and throughput, exclusive of VAT.`),
        clause(3,'Stock Accuracy & Temperature SLA',`The Provider shall maintain not less than ${N('accuracy',99)}% stock accuracy and continuous temperature logging, reporting any excursion within ${N('excursionHrs',2)} hours.`),
        clause(4,'Liability & Governing Law',`The Provider is liable for loss or damage to goods in its custody up to their stock value. This Agreement is governed by the laws of Kenya.`),
      ]}),
    FF:()=>({ title:'FREIGHT & DISTRIBUTION AGREEMENT',
      recital:`This Freight & Distribution Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Carrier") for the distribution of finished goods across ${T('region','e.g. Nairobi to Coast')}.`,
      clauses:[
        clause(1,'Scope of Services',`The Carrier shall collect from the Principal's warehouse and deliver to the ${T('channel','e.g. distributors and modern trade')} within the agreed territory.`),
        clause(2,'Rates & Contract Value',`The estimated annual contract value is KES ${VAL}, billed against agreed per-drop and per-kilometre rates and reconciled monthly.`),
        clause(3,'Service Levels',`The Carrier commits to an on-time-in-full (OTIF) target of ${N('otif',98)}% with delivery within ${N('leadHrs',48)} hours of dispatch, per the KPI schedule in Annexure A.`),
        clause(4,'Liability & Governing Law',`Liability for loss in transit is capped per consignment value. This Agreement is governed by Kenyan law with arbitration seated in Nairobi.`),
      ]}),
    DA:()=>({ title:'DISTRIBUTOR AGREEMENT',
      recital:`This Distributor Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Distributor"), appointing the Distributor for the ${T('territory','e.g. Nyanza')} territory.`,
      clauses:[
        clause(1,'Appointment & Territory',`The Principal appoints the Distributor on a non-exclusive basis to distribute its products within the territory. The Distributor shall not actively sell outside the territory without written consent.`),
        clause(2,'Targets & Contract Value',`The estimated annual purchase value is KES ${VAL}, against agreed volume targets and a ${N('margin',12)}% distributor margin.`),
        clause(3,'Credit & Payment Terms',`A credit limit of ${N('creditDays',30)} days applies, secured by a bank guarantee. Title to goods passes on delivery.`),
        clause(4,'Term, Termination & Governing Law',`The term is ${N('termYears',2)} years, terminable on ${N('noticeDays',90)} days' written notice. Kenyan law governs.`),
      ]}),
    RL:()=>({ title:'RETAIL LISTING & SUPPLY AGREEMENT',
      recital:`This Retail Listing & Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Supplier") and ${CP} (the "Retailer") for the listing and supply of the Supplier's products into the Retailer's stores.`,
      clauses:[
        clause(1,'Listing & Range',`The Retailer shall list the agreed SKUs across ${N('stores',40)} stores, with planogram and shelf space per the trading terms in Annexure A.`),
        clause(2,'Trading Terms & Value',`The estimated annual supply value is KES ${VAL}, with a ${N('rebate',5)}% volume rebate and the agreed listing fees.`),
        clause(3,'Payment & Returns',`Payment falls due within ${N('payDays',60)} days of invoice. Short-dated or damaged stock is handled per the returns schedule.`),
        clause(4,'Compliance & Governing Law',`Products shall comply with KEBS labelling and Legal Metrology requirements. This Agreement is governed by the laws of Kenya.`),
      ]}),
    MK:()=>({ title:'MARKETING & TRADE PROMOTION SERVICES AGREEMENT',
      recital:`This Marketing Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Agency") for ${T('services','e.g. creative, media and activation')} services.`,
      clauses:[
        clause(1,'Scope of Services',`The Agency shall provide the services in accordance with approved campaign briefs and the Client's annual marketing calendar.`),
        clause(2,'Fees & Contract Value',`The annual retainer / working budget is KES ${VAL}, billed ${T('billing','e.g. monthly')}, exclusive of VAT and third-party pass-through costs.`),
        clause(3,'Approvals & Media',`All spend and creative require the Client's prior written approval. Any media rebates or volume bonuses are passed back to the Client in full.`),
        clause(4,'IP, Confidentiality & Governing Law',`All work product and campaign intellectual property vest in the Client upon payment. This Agreement is governed by the laws of Kenya.`),
      ]}),
    ND:()=>({ title:'MUTUAL NON-DISCLOSURE AGREEMENT',
      recital:`This Mutual Non-Disclosure Agreement is entered into on ${D('effDate')} between <strong>${FIRST_PARTY}</strong>, a company incorporated in the Republic of Kenya, and ${CP}, collectively the "Parties".`,
      clauses:[
        clause(1,'Purpose',`The Parties wish to explore a potential business relationship and, in connection therewith, may disclose confidential and proprietary information. No monetary consideration passes under this Agreement; the mutual exchange of Confidential Information constitutes sufficient consideration.`),
        clause(2,'Confidential Information',`"Confidential Information" means all non-public information disclosed by one Party to the other, including recipes, specifications, commercial terms, pricing and customer data.`),
        clause(3,'Term',`This Agreement shall remain in force for ${N('termYears',3)} years from the effective date, unless terminated earlier by written notice to the registered office in Nairobi.`),
        clause(4,'Governing Law',`This Agreement is governed by the laws of the Republic of Kenya, and the Parties submit to the exclusive jurisdiction of the Courts at Nairobi.`),
      ]}),
    LE:()=>({ title:'COMMERCIAL PROPERTY LEASE AGREEMENT',
      recital:`This Lease is made on ${D('effDate')} between ${CP} (the "Landlord") and <strong>${FIRST_PARTY}</strong> (the "Tenant") in respect of commercial premises situated at ${T('premises','e.g. Westlands, Nairobi')}.`,
      clauses:[
        clause(1,'Demised Premises',`The Landlord leases to the Tenant premises measuring ${N('sqm',420)} square metres, together with shared access to power, water and secure parking.`),
        clause(2,'Rent',`The Tenant shall pay monthly rent of KES ${VAL}, in advance on or before the 5th day of each month, exclusive of VAT at the prevailing KRA rate.`),
        clause(3,'Term & Deposit',`The lease term is ${N('termYears',6)} years, secured by a deposit of ${M('deposit',0,'deposit KES')} held against dilapidations and refundable per clause 7.`),
        clause(4,'Governing Law',`This Lease is governed by the laws of Kenya, including the Land Act (2012), with disputes referred to the Environment and Land Court at Nairobi.`),
      ]}),
    PS:()=>({ title:'PROFESSIONAL SERVICES AGREEMENT',
      recital:`This Professional Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Adviser") for ${T('services','e.g. statutory audit / legal advisory')} services.`,
      clauses:[
        clause(1,'Scope of Engagement',`The Adviser shall provide the professional services described in the engagement letter / Annexure A with reasonable skill and care.`),
        clause(2,'Fees & Contract Value',`The fees for the engagement are KES ${VAL}, billed ${T('billing','e.g. on milestones')}, exclusive of VAT and disbursements.`),
        clause(3,'Standard & Independence',`The services shall be performed to professional standards and, where regulated, in line with ICPAK / LSK requirements and applicable independence rules.`),
        clause(4,'Liability, Confidentiality & Governing Law',`The Adviser's liability is capped at the fees paid, save for negligence or wilful default. This Agreement is governed by the laws of Kenya.`),
      ]}),
  };
  const built=(BUILD[c.template]||BUILD.ND)();
  const title=built.title, recital=built.recital, clauses=built.clauses;
  return `
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-size:10px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.2em;color:var(--color-neutral-600);margin-bottom:6px">${t.kind} · ${jxName()} · ${c.id}</div>
      <h3 style="text-align:center;font-size:19px;margin:0;line-height:1.2">${title}</h3>
    </div>
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
  return `<div style="max-width:660px;margin:0 auto 10px;display:flex;align-items:flex-start;gap:7px;font-size:11px;line-height:1.5;color:var(--color-neutral-700);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px">
    <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('copy','w-3.5 h-3.5')}</span>
    <span>Created from <b>${esc(label)}</b>.${moved
      ? ` That template has since been revised — it is now <b>v${liveV}</b>. <b>This contract keeps the wording it was created with</b>; editing a template never changes a contract already made from it.`
      : ` Editing the template later does not change this contract — its wording was copied at creation.`}${
      !live ? ' <span style="color:var(--color-neutral-500)">The template itself has since been deleted.</span>' : ''}</span>
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
          <circle cx="48" cy="48" r="46" fill="none" stroke="#5980a6" stroke-width="2"/>
          <circle cx="48" cy="48" r="38" fill="rgba(89,128,166,.10)" stroke="#8fa8c2" stroke-width="1.5"/>
          <text x="48" y="45" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12.5" fill="#3f6087">ON FILE</text>
          <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" fill="#5980a6">MIGRATED</text>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2"><span class="font-display font-700 text-[17px] text-ink">Executed outside HaTi</span>${statusChip('Signed')}</div>
          <div class="mt-1 text-xs text-brand-800/60">Signed before it was migrated into HaTi. <strong>No electronic signature was taken here</strong> — the signatures are on the original document.</div>
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
          <text x="48" y="45" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12.5" fill="#2e8763">SEALED</text>
          <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" fill="#1e6b4d">SHA-256</text>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 warm-flip"><span class="font-display font-700 text-[17px] text-ink">Executed &amp; Sealed</span>${statusChip('Signed')}</div>
          <div class="mt-1 text-xs text-brand-800/60">${jxEsignatureShort()}</div>
          <div class="mt-3 grid sm:grid-cols-2 gap-3 text-xs">${sigList}</div>
          ${!isUpload(c)?`<div class="mt-3 rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1">Sealed text fingerprint (SHA-256)</div><div class="font-mono text-[10px] break-all text-brand-700">${c.execution?.textHash||'—'}</div></div>`:''}
          <div class="mt-3 rounded-lg bg-brand-900 p-3 font-mono text-[11px] leading-relaxed">
            <div class="flex items-center gap-1.5 text-gold-400 mb-1">${icon('hash','w-3 h-3')} DOCUMENT SEAL (SHA-256)</div>
            <div class="text-brand-100 break-all">${hashDisplay}</div>
            <div class="text-brand-300 mt-1.5">${c.signedAt||'Timestamp recorded'}</div>
          </div>
          <div class="mt-2 text-[10px] text-brand-800/60 leading-snug">Signer identity is verified by account session (first party) and email one-time code (counterparty). Government IPRS identity and CAK-accredited PKI are on the roadmap and not yet active.</div>
        </div>
      </div>
    </div>`;
  }
  return `
    <div class="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-5 text-center" data-anchor="sig">
      <div class="text-brand-300 mb-2 flex justify-center">${icon('finger','w-6 h-6')}</div>
      <div class="text-sm font-medium text-brand-800/70">Signature block — pending execution</div>
      <div class="text-xs text-brand-800/65 mt-0.5">Confirm intent to sign from the panel on the right.</div>
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
  if(c.status==='Signed') return { label:'Evidence pack', ic:'download', guide:'Executed &amp; sealed.', kind:'evidence' };
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
    return { label:'Review the changes', ic:'history', kind:'review-changes',
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
    return { label:'Sign', ic:'finger', kind:c.compliance&&c.compliance.consent?'sign':'sign-scroll',
      guide:`${who} has signed. Your signature is the only thing left.` };
  }
  if(c.status==='Draft'){
    if(!hasTerms) return { label:'Complete key terms', ic:'pencil', guide:'Add the counterparty and value to move this forward.', kind:'terms' };
    return { label:'Send for review', ic:'check2', guide:'Key terms are set — move it into review.', kind:'review' };
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
      ? { label:'Open the negotiation', ic:'history', kind:'review-changes',
          guide:`It is with ${who}. Nothing needs you until they answer.` }
      : { label:'Open the negotiation', ic:'history', kind:'review-changes',
          guide:`Your turn — ${mine||'some'} change${mine===1?'':'s'} still open with ${who}.` };
  }
  // Under Review
  if(!appr.ok) return { label:'Send to counterparty', ic:'share', guide:'Share the draft to negotiate or collect signature.', kind:'share' };
  // U-8: when intent-to-sign is not yet ticked, this button only scrolls to the
  // consent box — it does not sign. Labelling it "Sign" made the prominent verb
  // a false promise (tick the box, then hunt for a second Sign control). It now
  // says what it actually does; the label becomes "Sign" only when a click will
  // truly execute.
  if(!c.compliance.consent) return { label:'Review & sign below', ic:'finger', guide:'Approved — confirm intent-to-sign below, then sign.', kind:'sign-scroll' };
  return { label:'Sign', ic:'finger', guide:'Approved and ready — apply the sealed signature.', kind:'sign' };
}

/* The status strip under the document header. Split out so filling in the key
   terms can refresh the guidance and the primary button in place, without
   re-rendering the workspace under the cursor. */
function actionBarHtml(c){
  const locked=c.status==='Signed';
  if(locked) return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;padding:2px 9px;border-radius:999px;background:#e8f4ee;color:#1e6b4d"><span style="width:6px;height:6px;border-radius:50%;background:#2e8763"></span>Executed &amp; sealed</span><span style="font-size:12px;color:var(--color-neutral-700)">Executed &amp; sealed. This document is locked and fields are read-only.</span><span style="flex:1"></span><button id="ws-evidence" class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 13px">${icon('download','w-3.5 h-3.5')} Evidence pack</button>`;
  if(!canEdit()) return `${statusChip(c.status)}<span style="font-size:12px;color:var(--color-neutral-700)">You have viewer access — the document is read-only for your role.</span>`;
  const na=wsNextAction(c);
  return `${statusChip(c.status)}<span style="font-size:12px;color:var(--color-neutral-700)">${na?na.guide:'All key terms are set.'}</span>`
    + `<span style="flex:1"></span>`
    + (na?`<button id="ws-next-action" data-na="${na.kind}" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:6px 14px">${icon(na.ic,'w-3.5 h-3.5')} ${na.label}</button>`:'');
}
function renderActionBar(c){
  const host=document.getElementById('ws-actionbar'); if(!host) return;
  host.innerHTML=actionBarHtml(c);
  wireActionBar(c);
}
function wireActionBar(c){
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
    if(kind==='review'){
      if(c.status==='Draft'){ c.status='Under Review'; c.lastAction=todayStr(); logAudit(c,'Status changed','Draft → Under Review (sent for review)'); persist(c); updateStatusUI(c); renderWorkspace(); toast('Moved to review'); }
      return;
    }
    if(kind==='sign-scroll'){
      const sw=document.getElementById('sign-wrap'); if(sw) sw.scrollIntoView({behavior:'smooth',block:'center'});
      const box=document.querySelector('[data-comp="consent"]'); if(box){ const card=box.closest('label'); if(card){ card.classList.add('anchor-flash'); setTimeout(()=>card.classList.remove('anchor-flash'),1800); } }
      toast('Tick intent-to-sign, then Sign');
      return;
    }
    if(kind==='sign'){ signDocument(c); return; }
  });
}
/* "Complete key terms" — put the cursor where the terms can actually be typed:
   the quick-fill fields of a generated body, else the Key terms panel (which
   lives on the Signing tab, so switch to it first). */
function focusKeyTerms(c){
  const inDoc=document.querySelector('#doc-canvas [data-sync]');
  if(inDoc){ inDoc.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>inDoc.focus(),300); return; }
  const panel=document.querySelector('[data-kt="counterparty"]');
  if(!panel){ toast('This document has no editable key terms','err'); return; }
  _docTopTab='signing'; applyDocTabs();
  const right=document.getElementById('doc-right'); if(right) right.scrollTo({top:0,behavior:'smooth'});
  setTimeout(()=>{ panel.focus(); panel.select&&panel.select(); },250);
}

/* ---- Document workspace right-panel: two tabs (Screening | Signing) --------
   Screening (default while a contract is in progress) stacks Playbook review →
   Insert clause → Copilot Contract Scan, with a "Next: Signing" button. Signing
   (default once executed) shows read-only Key terms on top and a card with
   four inner tabs: Activity · Terms · Audit · Signing. Tab choices persist
   across re-renders of the same contract, and reset when a different contract
   opens. */
let _docTopTab='screening';                 // 'screening' (= Draft & Review) | 'signing'
let _docInnerTab='signing';                 // Signing tab inner: 'signing' | 'obligations' | 'audit'
let _docTabsFor=null;                        // contract id the choices belong to
const DOC_INNER_TABS=['signing','obligations','audit'];
function docTabDefaults(c){
  if(_docTabsFor!==c.id){                    // first open of this contract → sensible defaults
    _docTopTab = (c.status==='Signed') ? 'signing' : 'screening';
    _docInnerTab = 'signing';
    _docTabsFor = c.id;
  }
}
/* ---- Workspace-level tabs: Docs · Redline ---------------------------------
   A sibling of the Docs view, not a card inside it. The redline needs the full
   width of the window — the document whole, with the changes and the
   discussion beside it — and the right-hand panel here is a third of the
   screen, so it could never have lived in it.

   Which is why only ONE of these two is a pane. Docs is; Redline is a door to
   the workbench at view-redline, and it snaps back to Docs on the way through
   so that coming back lands on the document rather than on a tab pointing
   somewhere the reader has left. The choice resets when a different contract
   opens. */
let _wsTab='docs';                           // 'docs' | 'redline'
let _wsTabFor=null;
function wsTabDefaults(c){
  if(_wsTabFor!==c.id){
    _wsTab='docs';
    _wsTabFor=c.id;
    if(window.negoResetView) negoResetView();   // don't open on another contract's fingerprint
  }
}
function wsTabBtn(k,label,ic){
  return `<button data-ws-tab="${k}" title="${label}" style="display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:7px;background:none;cursor:pointer;font:inherit;font-size:12.5px;font-weight:600;color:var(--color-neutral-600);padding:6px 14px;white-space:nowrap;transition:background .12s,color .12s">${icon(ic,'w-4 h-4')}<span>${label}</span></button>`;
}
/* The count of undecided changes, on the tab itself. A negotiation waiting on
   the reader is the one thing that must not be discoverable only by clicking. */
function negoTabCountHtml(c){
  if(!window.negoProgress) return '';
  const p=negoProgress(c);
  if(!p.pending) return '';
  return `<span id="nego-tab-count" title="${p.pending} change${p.pending===1?'':'s'} waiting on a decision" style="align-self:center;margin:0 8px 0 -6px;font-family:var(--font-mono);font-size:10px;font-weight:700;background:#b8862b;color:#fff;border-radius:999px;padding:1px 7px">${p.pending}</span>`;
}
function applyWsTabs(c){
  if(_wsTab!=='docs'&&_wsTab!=='redline') _wsTab='docs';
  document.querySelectorAll('[data-ws-pane]').forEach(p=>{
    const on=p.getAttribute('data-ws-pane')===_wsTab;
    p.style.display=on?(p.id==='doc-grid'?'grid':'flex'):'none';
  });
  document.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(b=>{ const on=b.getAttribute('data-ws-tab')===_wsTab;
    b.style.background=on?'var(--color-accent-800)':'none'; b.style.color=on?'#fff':'var(--color-neutral-600)'; });
  /* ---- REDLINE IS A DOOR, NOT A PANE ----
     It was a door before too, and it opened the full-window negotiation room:
     three panes squeezed under this header left both documents too small to
     read. It now opens the REDLINE WORKBENCH — the page at view-redline —
     which is the same engine laid out as the design sets it, with the document
     whole and the changes and discussion beside it.

     Either way the tab snaps back to Docs before it goes, so that coming BACK
     from the workbench lands on a workspace showing the document rather than
     on a tab pointing at somewhere the reader is no longer standing. */
  if(_wsTab==='redline'){
    _wsTab='docs';
    document.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(b=>{ const on=b.getAttribute('data-ws-tab')==='docs';
      b.style.background=on?'var(--color-accent-800)':'none'; b.style.color=on?'#fff':'var(--color-neutral-600)'; });
    document.querySelectorAll('[data-ws-pane]').forEach(p=>{
      p.style.display=(p.getAttribute('data-ws-pane')==='docs')?(p.id==='doc-grid'?'grid':'flex'):'none'; });
    /* Through openRedlineWorkbench, not by setting activeId and switching view
       here: that one function is where the previous occupant of the bench is
       taken off and put back in Drafting, and a second route in would skip it
       silently. */
    if(window.openRedlineWorkbench) openRedlineWorkbench(c.id);
    else toast('The redline workbench is unavailable on this page','err');
  }
}
function wireWsTabs(c){
  document.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(b=>b.addEventListener('click',()=>{
    _wsTab=b.getAttribute('data-ws-tab'); _wsTabFor=c.id; applyWsTabs(c); }));
  applyWsTabs(c);
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
    onSaveDraft(){ persist(c); toast('Draft saved'); },
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
      toast('Agreed wording carried to the Docs tab — sign it there when you are ready');
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
  if(!canEdit()){ toast('Viewers cannot propose changes','err'); return; }
  if(c.status==='Signed'){ toast('Executed contracts are sealed and read-only','err'); return; }
  /* A library-template contract's wording is the template manager's, not the
     deal-maker's: fixed wording is read-only on both sides, and the blanks
     are filled through the form, not rewritten through a redline. Changing
     the standard is a template edit (a new published version), not a per-deal
     negotiation over company boilerplate. */
  if(c.templateForm){ toast('This contract comes from a standard template — fixed wording is read-only. Fill the open fields in the form instead.','err'); return; }
  const base=negoBaseText(c);
  if(!base.trim()){ toast('This contract has no wording to propose changes to','err'); return; }
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Propose changes to ${esc(c.counterparty||'the counterparty')}</h3>
          <p style="font-size:11.5px;color:var(--color-neutral-600);margin:7px 0 0;line-height:1.55">Edit the wording below. Each clause you change becomes its own fingerprinted change on the index, for them to accept, reject or discuss. <b>Nothing here changes the contract</b> — the document moves only when a change is accepted.</p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:20px 26px;background:var(--color-bg)">
        <div style="${COL}">
          <textarea id="nego-prop-text" spellcheck="false" style="width:100%;min-height:52vh;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:14px 16px;font:inherit;font-family:var(--font-mono);font-size:12.5px;line-height:1.8;outline:none;resize:vertical">${esc(base)}</textarea>
          <label style="display:block;margin-top:12px">
            <span style="display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">Why you are asking (optional) — they see it against each change</span>
            <input id="nego-prop-why" type="text" placeholder="e.g. Our AP cycle runs monthly, so Net-30 forces out-of-cycle payments." style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:9px 11px;font:inherit;font-size:12.5px;outline:none"/>
          </label>
        </div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <span style="flex:1;min-width:150px;font-size:11.5px;color:var(--color-neutral-600)">Changed clauses become pending fingerprints. Unchanged ones are left alone.</span>
          <button id="nego-prop-cancel" class="ui-btn">Cancel</button>
          <button id="nego-prop-go" class="ui-btn ui-btn-primary">Propose these changes</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  document.getElementById('nego-prop-cancel').addEventListener('click',closeModal);
  document.getElementById('nego-prop-go').addEventListener('click',async e=>{
    const text=document.getElementById('nego-prop-text')?.value||'';
    const why=String(document.getElementById('nego-prop-why')?.value||'').trim();
    const btn=e.currentTarget, restore=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Filing…</span>';
    let filed=[];
    try{
      filed=await negoFileProposal(c, text, { side:'owner', author:currentUser()?.name,
        via:'the Negotiation tab' });
      // one reason, given once, against every change it explains
      if(why) for(const ch of filed) ch.note=why;
    }catch(err){
      btn.disabled=false; btn.innerHTML=restore;
      toast('Could not file those changes — '+err.message,'err'); return;
    }
    closeModal();
    if(!filed.length){ toast('That wording is identical to the current baseline — nothing to propose'); return; }
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
function wireDocTabs(){
  document.querySelectorAll('#doc-toptabs [data-top-tab]').forEach(b=>b.addEventListener('click',()=>{ _docTopTab=b.getAttribute('data-top-tab'); applyDocTabs(); }));
  document.querySelectorAll('#doc-innertabs [data-inner-tab]').forEach(b=>b.addEventListener('click',()=>{ _docInnerTab=b.getAttribute('data-inner-tab'); applyDocTabs(); }));
  document.getElementById('screening-next')?.addEventListener('click',()=>{ _docTopTab='signing'; applyDocTabs(); const r=document.getElementById('doc-right'); if(r) r.scrollTo({top:0,behavior:'smooth'}); });
  applyDocTabs();
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
  const avail=Math.max(1, grid.clientWidth - DOC_GAP);
  let leftPx=Math.round(_docLeftFrac()*avail);
  // On a narrow window the fraction alone would starve one side; pixels win.
  if(avail>=DOC_LEFT_MIN+DOC_RIGHT_MIN) leftPx=Math.min(Math.max(leftPx,DOC_LEFT_MIN), avail-DOC_RIGHT_MIN);
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
    <div id="changes-strip" style="flex:none;display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:9px 16px;background:#fdf6e7;border-top:1px solid #e0c48a;border-bottom:1px solid #e0c48a">
      <span class="changes-pip" style="flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#b8862b;color:#fff;border-radius:999px;padding:3px 10px">Changes returned</span>
      <span style="font-size:12.5px;color:#7d5a14;min-width:0"><b>${who}</b> ${withText?'proposed edits':'requested changes'} — ${open.length} round${open.length===1?'':'s'} awaiting your decision.</span>
      <span style="flex:1"></span>
      <button id="changes-review" style="flex:none;font:inherit;font-size:12px;font-weight:600;border:1px solid #b8862b;background:var(--color-surface);color:#7d5a14;border-radius:5px;padding:6px 13px;cursor:pointer">${withText?'Review changes':'Read the request'}</button>
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
    <div id="ready-strip" data-stale="${stale?'1':'0'}" style="flex:none;display:flex;align-items:center;gap:11px;flex-wrap:wrap;padding:9px 16px;background:${stale?'#fdf6e7':'#eef7f1'};border-top:1px solid ${stale?'#e0c48a':'#a8cbb8'};border-bottom:1px solid ${stale?'#e0c48a':'#a8cbb8'}">
      <span style="flex:none;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:${stale?'#b8862b':'#1e6b4d'};color:#fff;border-radius:999px;padding:3px 10px">Ready to sign</span>
      <span style="font-size:12.5px;color:${stale?'#7d5a14':'#14503a'};min-width:0"><b>${esc(sig.by||c.counterparty||'The counterparty')}</b> signalled they are ready to sign — ${esc(when)}${bits.length?` · ${esc(bits.join(', '))}`:''}. <b>Nothing is signed yet.</b>${stale?' Something has been reopened since, so this no longer describes where the deal stands.':''}</span>
      <span style="flex:1"></span>
      ${canEdit()&&!stale?`<button id="ready-issue" style="flex:none;font:inherit;font-size:12px;font-weight:600;border:1px solid #1e6b4d;background:#1e6b4d;color:#fff;border-radius:5px;padding:6px 13px;cursor:pointer">Issue a signing link</button>`:''}
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
    btn.title=on?'Show the toolbar again':'Collapse this bar and give the contract more room';
    btn.innerHTML=icon(on?'plus':'minus','w-3.5 h-3.5');
  }
}
function wireWsCollapse(c){
  applyWsCollapse();
  document.getElementById('ws-collapse')?.addEventListener('click',()=>{
    try{ lsSet(WS_FOLD_KEY(), !wsChromeFolded()); }catch(_){}
    applyWsCollapse();
  });
}

/* ---- THE EXPORT MENU ----
   Open on the button, shut on a pick or a click anywhere else. The document
   listener is bound once and checks liveness itself, because this header is
   rebuilt on every renderWorkspace and a listener per paint is a leak. */
let _wsExportDocWired=false;
function wireWsExportMenu(){
  const btn=document.getElementById('ws-export'), menu=document.getElementById('ws-export-menu');
  if(!btn||!menu) return;
  const shut=()=>{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  btn.addEventListener('click',e=>{ e.stopPropagation();
    const open=menu.classList.toggle('hidden')===false;
    btn.setAttribute('aria-expanded',open?'true':'false'); });
  menu.addEventListener('click',()=>shut());
  if(!_wsExportDocWired&&typeof document!=='undefined'){
    _wsExportDocWired=true;
    document.addEventListener('click',e=>{
      const m=document.getElementById('ws-export-menu'), b=document.getElementById('ws-export');
      if(m&&b&&!m.classList.contains('hidden')&&!m.contains(e.target)&&!b.contains(e.target)){
        m.classList.add('hidden'); b.setAttribute('aria-expanded','false');
      }
    });
  }
}
/* ---- WORD, WITH THE REDLINES AS REAL TRACKED CHANGES ----
   The same writer the Doc Lab proved out (docxExportTracked), reconnected to
   a reachable button: the redline as the owner sees it, as a .docx a
   counterparty can accept and reject in their own copy of Word. The whole
   document, not one clause — a tracked-changes file with three clauses in it
   is not the agreement. */
function exportWordTracked(c){
  if(!window.docxExportTracked||!window.redlineDocHtml){ toast('The Word writer is not loaded on this page','err'); return; }
  let out;
  try{
    const html=redlineDocHtml(c,{side:'owner'});
    out=docxExportTracked(html,{author:(currentUser()&&currentUser().name)||'HaTi'});
  }catch(e){ toast('That document could not be written as Word: '+((e&&e.message)||e),'err'); return; }
  const name=`${c.id}-redline.docx`;
  try{
    const blob=new Blob([out.bytes],{type:window.DOCX_MIME||'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),0);
  }catch(e){ toast('The download could not start: '+((e&&e.message)||e),'err'); return; }
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
function applyWsFocus(){
  const head=document.getElementById('ws-head');
  if(head) head.style.display=_wsFocus?'none':'';
  const strips=document.getElementById('ws-strips');
  if(strips) strips.style.display=_wsFocus?'none':'contents';
  const b=document.getElementById('ws-focus');
  if(b){
    b.setAttribute('aria-pressed',_wsFocus?'true':'false');
    b.style.background=_wsFocus?'var(--color-accent-800)':'';
    b.style.color=_wsFocus?'#fff':'';
    b.style.borderColor=_wsFocus?'var(--color-accent-800)':'';
    b.title=_wsFocus?'Exit focus mode — bring the header back':'Focus mode — hide the header and give the room to the document';
  }
}
function wireWsFocus(c){
  if(_wsFocusFor!==c.id){ _wsFocus=false; _wsFocusFor=c.id; }
  document.getElementById('ws-focus')?.addEventListener('click',()=>{ _wsFocus=!_wsFocus; applyWsFocus(); });
  applyWsFocus();
}

function renderWorkspace(){
  const c=getContract(state.activeId);
  const content=document.getElementById('content');
  if(!c){
    content.innerHTML=`
    <div class="view-enter grid place-items-center min-h-screen px-8">
      <div class="text-center max-w-sm">
        <div class="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-white border border-brand-100 text-brand-300 mb-4">${icon('file','w-7 h-7')}</div>
        <h2 class="font-display font-600 text-lg text-brand-900">No contract open</h2>
        <p class="text-sm text-brand-800/70 mt-1">Open a folder from the dashboard, or generate a contract from a template.</p>
        <button onclick="setView('dashboard')" class="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-800 transition">${icon('grid')} Go to dashboard</button>
      </div>
    </div>`;
    setActiveNav('workspace'); return;
  }
  // load the full contract body (comments, audit, execution text, extracted text) on first open
  if(API_MODE() && !c._loaded){
    content.innerHTML=`<div class="view-enter grid place-items-center min-h-screen"><div class="text-center text-brand-800/70"><div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"></div><div class="text-sm">Loading contract…</div></div></div>`;
    setActiveNav('workspace');
    ensureFull(c).then(()=>{ if(state.activeId===c.id) renderWorkspace(); })
      .catch(e=>{ if(state.activeId===c.id) content.innerHTML=`<div class="grid place-items-center min-h-screen text-sm text-rose-600">Could not load this contract: ${e.message}</div>`; });
    return;
  }
  const locked=c.status==='Signed';
  // Industry design-system tokens — inline styles per the design handoff.
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px';
  const H6='margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
  const KROW='display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.06);font-size:11.5px';
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
    ? 'Back to '+FOLDERS[_wr.folderId].name
    : 'Back to '+({register:'register',pipeline:'my queue',intel:'intelligence',calendar:'calendar',dashboard:'portfolio',reports:'reports',advice:'advice desk'}[_wr.view]||'register');
  content.innerHTML=`
  <div class="view-enter" style="height:var(--view-h);box-sizing:border-box;padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px">

    <!-- ============ FULL-WIDTH DOCUMENT HEADER (spans the doc + the right panel) ============ -->
    <section id="ws-head" style="${CARD};flex:none;overflow:hidden">
      <div style="display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;padding:12px 16px">
        <button id="ws-back" title="${backLabel}" class="ui-btn" style="width:32px;height:32px;padding:0;flex:none">${icon('arrowLeft','w-4 h-4')}</button>
        <div style="min-width:0;flex:1">
          <div style="display:flex;align-items:center;gap:8px">
            <h3 style="font-size:17px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</h3>
            <span id="ws-status" style="flex:none">${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</span>
          </div>
          <div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.id} · ${FOLDERS[c.folder].name} · updated ${c.lastAction}</div>
        </div>
        <div data-ws-fold="actions" data-ws-display="flex" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:flex-end">
          <!-- Edit is GONE from this page. The Docs page reads, checks and signs;
               wording changes happen in the negotiation, where every one of them
               is a tracked change with a fingerprint someone has to decide. Two
               ways to change a contract is how the two drift apart, and the
               whole-document editor was the one that could not keep a heading. -->
          ${canEdit()?`<button id="ws-share" title="Share with counterparty" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('share','w-3.5 h-3.5')} Share</button>
          <button id="ws-import" title="Import counterparty response" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('upload','w-3.5 h-3.5')} Import</button>
          <button id="ws-tpl" title="Save as template" class="ui-btn" style="width:30px;height:30px;padding:0">${icon('copy','w-3.5 h-3.5')}</button>`:''}
          <button id="ws-compare" title="Compare versions &amp; review changes" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('history','w-3.5 h-3.5')} Compare</button>
          <button id="ws-history" title="The whole negotiation as one story — every proposal, decision, signature and renumbering, with filters" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('history','w-3.5 h-3.5')} History</button>
          <!-- ---- ONE EXPORT MENU, NOT A ROW OF EXPORT BUTTONS ----
               PDF, Word-with-tracked-changes and the sealed Record are three
               shapes of the same act, and each one on its own button was the
               crowding this header keeps being trimmed for. The ids inside are
               the ORIGINAL ids (ws-pdf, ws-pdf-record) so every existing
               handler and test presses exactly the button it always pressed. -->
          <div style="position:relative;flex:none">
            <button id="ws-export" class="ui-btn" aria-haspopup="true" aria-expanded="false" title="Export this contract — PDF, Word with tracked changes, or the sealed record" style="font-size:12px;padding:5px 10px">${icon('printer','w-3.5 h-3.5')} Export &#9662;</button>
            <div id="ws-export-menu" class="hidden" style="position:absolute;right:0;top:calc(100% + 4px);z-index:60;min-width:250px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:9px;box-shadow:0 8px 24px rgba(15,23,42,.14);padding:5px">
              <button id="ws-pdf" title="Export a clean copy for sending — your branding, the wording and the signatures, with no HaTi marks on it" style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:var(--color-text);border-radius:6px;padding:7px 10px">PDF <span style="font-weight:400;color:var(--color-neutral-500)">— clean copy to send</span></button>
              <button id="ws-word" title="Export the redline as a Word file — every pending change travels as a real Word tracked change the other side can accept or reject in their own copy" style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:var(--color-text);border-radius:6px;padding:7px 10px">Word <span style="font-weight:400;color:var(--color-neutral-500)">— with tracked changes</span></button>
              ${printIsHatiExecuted(c)?`<button id="ws-pdf-record" title="Export the full record for your own file — the same document plus HaTi's seal and the audit trail. Not the copy to send a counterparty." style="display:block;width:100%;text-align:left;border:0;background:none;cursor:pointer;font:inherit;font-size:12px;font-weight:600;color:var(--color-text);border-radius:6px;padding:7px 10px">Record <span style="font-weight:400;color:var(--color-neutral-500)">— sealed + audit trail</span></button>`:''}
            </div>
          </div>
          ${(canEdit()&&(c.status==='Draft'||c.status==='Under Review'))?`<button id="ws-delete" title="Delete this draft permanently" class="ui-btn" style="font-size:12px;padding:5px 10px;border-color:#e6c9c1;color:#8f322b">${icon('trash','w-3.5 h-3.5')} Delete</button>`:''}
        </div>
        ${''/* GIVE THE DOCUMENT THE ROOM. This header carries nine actions, a
              status strip and a tab row before one line of the contract is
              visible — right while you are deciding what to do, in the way once
              you are reading. Collapsing folds the actions away and keeps what
              tells you where you are: the name, the status, the way back.

              These two sit OUTSIDE the row that folds, because a control that
              hides itself cannot be pressed again.

              ASK COPILOT HAS GONE FROM HERE. It was not the only way in — the
              Copilot has a launcher in the sidebar on every screen, and the
              Redline page reaches it from a selection — so this was a third
              door to one room, taking the most prominent slot on the page.
              What that slot now carries is the act this page does not
              otherwise offer at all: starting the next agreement. It opens the
              same new-contract menu the command bar and the dashboard open,
              rather than being a second way of creating paper. */}
        <div style="display:flex;gap:6px;align-items:center;flex:none">
          <button id="ws-new" data-page-new title="Draft a new agreement" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('plus','w-3.5 h-3.5')} Draft new agreement</button>
          <button id="ws-collapse" class="ui-btn" style="width:30px;height:30px;padding:0;flex:none"
            title="Collapse this bar and give the contract more room" aria-expanded="true">${icon('minus','w-3.5 h-3.5')}</button>
        </div>
      </div>
    </section>

    <div id="ws-strips" style="display:contents">${readyToSignStrip(c)}${returnedChangesStrip(c)}</div>

    <!-- ============ TABS + STATUS, ONE ROW: Docs · Redline · next action ============
         Two ways of working on one contract. Docs is this page — the document,
         the review panel, signing. Redline hands the contract to the workbench
         at view-redline, where the wording is negotiated as tracked changes
         with a fingerprint on each one. The count beside it is the number of
         changes waiting on a decision, so a negotiation that needs an answer is
         never discoverable only by clicking.

         The status strip ("Drafting — add the counterparty and value…") used
         to be a full-width band inside the header card, with this tab switcher
         on a band of its own below it — two tiers of chrome before the first
         line of the contract. It now sits INLINE on the tab row, flat, with no
         card of its own: same chip, same guidance, same next-action button,
         one row instead of two. -->
    <div style="flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <div id="ws-tabs" style="flex:none;display:flex;gap:3px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:9px;padding:3px;box-shadow:var(--shadow-sm)">
        ${wsTabBtn('docs','Docs','file')}
        ${wsTabBtn('redline','Redline','pencil')}${negoTabCountHtml(c)}
      </div>
      ${window.rlTypeStepHtml?rlTypeStepHtml():''}
      <button id="ws-focus" class="ui-btn" aria-pressed="false" style="width:30px;height:30px;padding:0;flex:none"
        title="Focus mode — hide the header and give the room to the document">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
      </button>
      <div id="ws-actionbar" data-ws-fold="strip" data-ws-display="flex" style="flex:1;min-width:280px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">${actionBarHtml(c)}</div>
    </div>

    <!-- ============ BODY: contract (left) · workspace (right) — the divider sets how wide the contract runs ============ -->
    <div id="doc-grid" data-ws-pane="docs" style="position:relative;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:12px">

      <!-- LEFT: document -->
      <section style="${CARD};overflow:hidden;display:flex;flex-direction:column;min-height:0">
        <!-- document body (scrolls within the left pane) -->
        <div id="doc-scroll" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:20px 24px;background:var(--color-bg)">
          <!-- The page and its banners scale together to fill whatever width the
               divider gives them (see applyDocZoom), so a wider contract is a
               bigger contract rather than a wider margin. -->
          <div id="doc-zoom" style="zoom:var(--doc-zoom,1)">
          ${locked?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-900 text-brand-100 px-3 py-2 text-[11px]" style="max-width:660px;margin:0 auto 14px">${icon('lock','w-3.5 h-3.5')}<span>This document is executed and locked.${isUpload(c)?' The sealed file is bound by its SHA-256 fingerprint.':' Fields are read-only.'}</span></div>`
            :!canEdit()?`<div class="mb-5 flex items-center gap-2 rounded-[4px] px-3 py-2 text-[11px]" style="max-width:660px;margin:0 auto 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);color:var(--color-neutral-700)">${icon('lock','w-3.5 h-3.5')}<span>You have viewer access — the document is read-only for your role.</span></div>`
            :isUpload(c)?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('scan','w-3.5 h-3.5')}<span>Received document — read it below, run the Copilot review, then sign to record acceptance.</span></div>`
            :c.redlineText?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('pencil','w-3.5 h-3.5')}<span>Working text — use <b>Edit</b> to change the wording and <b>Compare</b> to review changes between versions.</span></div>`
            :`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('sparkle','w-3.5 h-3.5')}<span>Highlighted fields are editable — changes sync live to the key terms on the right.</span></div>`}
          ${templateProvenanceHtml(c)}
          <div class="blueprint"${window.docDesignPaperAttr&&window.resolveDocBranding?docDesignPaperAttr(resolveDocBranding(c)):''} style="background:#fbfbfc;box-shadow:var(--shadow-md);padding:30px 36px;max-width:${DOC_PAGE_W}px;margin:0 auto;border-radius:4px;${window.docDesignPaperStyle&&window.resolveDocBranding?docDesignPaperStyle(resolveDocBranding(c)):''}">
            ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c,{bleedX:36,bleedY:30}):''}
            <article id="doc-canvas" class="doc-surface" style="background:transparent">${docBody(c)}</article>
            ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
          </div>
          </div>
        </div>
      </section>

      <!-- ============ RIGHT: two tabs — Screening | Signing ============ -->
      <section id="doc-right" class="scroll-thin" style="display:flex;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;padding-right:2px">

        <!-- Top-level tabs -->
        <div id="doc-toptabs" style="position:sticky;top:0;z-index:4;flex:none;display:flex;gap:3px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:9px;padding:4px;box-shadow:var(--shadow-sm)">
          ${topTabBtn('screening','Draft &amp; Review','scan')}
          ${topTabBtn('signing','Signing','finger')}
        </div>

        <!-- ===== DRAFT & REVIEW: review → fix → negotiate (everything pre-signature) ===== -->
        <div data-top-pane="screening" style="display:flex;flex-direction:column;gap:12px">
          <!-- template form: the open fields of a library-template contract -->
          <div id="tplform-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          <!-- review & fix -->
          <div id="playbook-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          <div id="scan-section" style="${CARD};overflow:hidden"></div>

          <!-- collaborate & negotiate -->
          <section style="${CARD};padding:12px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <h6 style="${H6};flex:1">Activity &amp; comments</h6>
              <span class="flex items-center gap-1" style="font-size:10px;color:#1e6b4d;font-weight:600"><span class="live-dot" style="height:6px;width:6px;border-radius:9999px;background:#2e8763;display:inline-block"></span>live</span>
            </div>
            <div id="feed" class="space-y-3 scroll-thin" style="max-height:300px;overflow-y:auto;padding-right:4px"></div>
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-divider)">
              <div style="font-size:10px;color:var(--color-neutral-600);margin-bottom:6px">Commenting as <span style="font-weight:600;color:var(--color-neutral-800)">${currentUser()?.name||'you'}</span> · internal — counterparty replies arrive via share-link responses</div>
              <div style="display:flex;gap:6px">
                <textarea id="comment-input" class="chat-field" rows="1" placeholder="Add a comment on the terms…" style="flex:1;min-width:0;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px;font-size:12px;outline:none"></textarea>
                <button id="comment-send" class="ui-btn ui-btn-primary" style="width:32px;height:32px;padding:0;flex:none">${icon('send','w-4 h-4')}</button>
              </div>
            </div>
          </section>
          <div id="shares-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          ${''/* the general discussion panel is removed — see js/views/portal.js */}
          <div id="engagement-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          <div id="nego-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
          <div id="versions-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>

          <div style="display:flex;justify-content:flex-end;padding-top:2px">
            <button id="screening-next" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:7px 16px;display:inline-flex;align-items:center;gap:6px">Next: Signing ${icon('chevR','w-3.5 h-3.5')}</button>
          </div>
        </div>

        <!-- ===== SIGNING: Key terms (top) + inner tabs (Signing / Obligations / Audit) ===== -->
        <div data-top-pane="signing" style="display:none;flex-direction:column;gap:12px">

          <!-- Key terms. Editable until the contract is sealed: counterparty,
               value and valueType are folded into the seal, and for uploaded or
               template-based documents this panel is the ONLY place they can be
               set (a generated body carries its own quick-fill fields). -->
          <div style="${CARD};padding:12px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
              <h6 style="${H6};flex:1">Key terms</h6>
              ${ktEditable&&ktReadable?`<button id="kt-fill" class="ui-btn" style="font-size:10.5px;padding:3px 8px" title="Read the counterparty, dates and value out of the document">${icon('sparkle','w-3 h-3')} Fill from document</button>`:''}
            </div>
            ${ktEditable?`
            <label style="${KROW}"><span style="${KKEY}">Counterparty</span>
              <input data-kt="counterparty" type="text" value="${(c.counterparty||'').replace(/"/g,'&quot;')}" placeholder="Who is this with?" style="${KIN}"/></label>
            <label style="${KROW}"><span style="${KKEY}">Value</span>
              <input data-kt="value" type="number" min="0" value="${c.value||''}" placeholder="0" ${isMonetary(c)?'':'disabled'} style="${KIN};text-align:right;font-family:var(--font-mono)${isMonetary(c)?'':';opacity:.45'}"/></label>
            <label style="${KROW};cursor:pointer"><span style="${KKEY}">Non-monetary</span>
              <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--color-neutral-600)">no consideration passes
                <input data-kt="nonmonetary" type="checkbox" ${!isMonetary(c)?'checked':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none"/></span></label>
            <div style="${KROW}"><span style="${KKEY}">Status</span><span id="meta-status">${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</span></div>
            ${kv('Stream',(window.streamLabel?streamLabel(c):'—'))}
            <label style="${KROW}"><span style="${KKEY}">Effective</span>
              <input data-kt="effDate" type="date" value="${(c.fields&&c.fields.effDate)||''}" style="${KIN}"/></label>
            <label style="${KROW}"><span style="${KKEY}">Expiry</span>
              <input data-kt="expiry" type="date" value="${c.expiry||''}" style="${KIN}"/></label>
            <div style="${KROW};border-bottom:none"><span style="${KKEY}">Template</span><span style="font-weight:500;text-align:right;min-width:0">${tmplLabel}</span></div>`
            :`
            <div style="${KROW}"><span style="${KKEY}">Counterparty</span><span id="meta-cp" style="font-weight:500;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:62%">${c.counterparty||'—'}</span></div>
            <div style="${KROW}"><span style="${KKEY}">Value</span><span id="meta-value" style="font-weight:600;text-align:right;font-family:var(--font-mono)">${!isMonetary(c)?'Non-monetary':(c.value?fmtMoney(c.value)+(c.valueType==='estimated'?' (est.)':''):'—')}</span></div>
            <div style="${KROW}"><span style="${KKEY}">Status</span><span id="meta-status">${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</span></div>
            ${kv('Stream',(window.streamLabel?streamLabel(c):'—'))}
            ${kv('Effective',(c.fields&&c.fields.effDate)||'—')}
            ${kv('Expiry',c.expiry||'—')}
            <div style="${KROW};border-bottom:none"><span style="${KKEY}">Template</span><span style="font-weight:500;text-align:right;min-width:0">${tmplLabel}</span></div>`}
          </div>

          <!-- Bottom card: inner tabs -->
          <div style="${CARD};overflow:hidden;display:flex;flex-direction:column">
            <div id="doc-innertabs" style="display:flex;gap:2px;padding:6px 6px 0;border-bottom:1px solid var(--color-divider)">
              ${innerTabBtn('signing','Signing','finger')}
              ${innerTabBtn('obligations','Obligations','check2')}
              ${innerTabBtn('audit','Audit','history')}
            </div>
            <div style="padding:11px">

              <!-- SIGNING -->
              <div data-inner-pane="signing" style="display:flex;flex-direction:column;gap:10px">
                ${(!locked&&canEdit())?`
                <label style="display:flex;align-items:flex-start;gap:9px;border:1px solid var(--color-divider);border-radius:4px;padding:9px;cursor:pointer">
                  <input type="checkbox" data-comp="consent" ${c.compliance.consent?'checked':''} class="mt-0.5 h-4 w-4" style="accent-color:var(--color-accent);flex:none"/>
                  <span style="font-size:11.5px"><span style="font-weight:600;display:block">I intend to sign electronically</span><span style="color:var(--color-neutral-700);display:block;line-height:1.4">${jxEsignature()}</span></span>
                </label>`:''}
                <div id="sign-wrap"></div>
              </div>

              <!-- OBLIGATIONS (post-execution commitments to track) -->
              <div data-inner-pane="obligations" style="display:none;flex-direction:column;gap:12px">
                <div id="obligations-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
              </div>

              <!-- AUDIT (the record) -->
              <div data-inner-pane="audit" style="display:none;flex-direction:column;gap:12px">
                <div id="family-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
                <div id="audit-section" style="${CARD};overflow:hidden"></div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <!-- Divider: drag right to widen the contract (default → +25%), never narrower. Double-click resets. -->
      <div id="doc-resizer" title="Drag to set how wide the contract is · double-click to reset" style="position:absolute;top:0;bottom:0;left:0;width:14px;z-index:6;cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none" onmouseover="this.firstElementChild.style.background='var(--color-accent)'" onmouseout="if(!this.dataset.drag)this.firstElementChild.style.background='var(--color-neutral-300)'">
        <span style="width:4px;height:72px;border-radius:999px;background:var(--color-neutral-300);transition:background .15s"></span>
      </div>
    </div>

    <!-- ============ NEGOTIATION: the three-pane fingerprinted redline ============
         Rendered by js/views/negotiation.js — the SAME component the
         counterparty's link renders, so neither side is looking at a lesser
         screen than the other. -->
    <div id="nego-tab" data-ws-pane="negotiation" style="display:none;flex:1;min-height:0"></div>
  </div>`;

  scanUI = { running:false, filter:'all', expanded:new Set() };
  docTabDefaults(c);   // Screening for in-progress, Signing once executed (per contract)
  wsTabDefaults(c);    // Docs by default; the choice persists per contract
  wireDocumentSync(c); renderFeed(c); wireComments(c); wireCompliance(c); renderSignButton(c); renderScanSection(c); renderPlaybookSection(c); renderSharesSection(c); renderNegotiationSection(c); renderVersionsSection(c); renderObligationsSection(c); loadEngagement(c); renderFamilySection(c); renderAuditSection(c);
  if(window.renderTemplateFormSection) renderTemplateFormSection(c);
  wireDocTabs();   // Draft & Review | Signing top tabs; Signing has Signing/Obligations/Audit inner tabs
  wireWsTabs(c);   // Docs | Negotiation — the workspace-level pair
  wireDocResizer();   // draggable divider — sets the contract's width, and with it the page zoom
  wireChangesStrip(c);   // the returned-changes strip above the document
  // rehydrate a server-stored uploaded file's bytes for preview/download
  if(API_MODE() && isUpload(c) && c.upload?.fileId && !c.upload?.dataUrl){
    api('files/'+c.upload.fileId).then(f=>{ c.upload.dataUrl=f.dataUrl;
      if(state.activeId===c.id){ const dc=document.getElementById('doc-canvas'); if(dc){ dc.innerHTML=docBody(c); wireDocCanvas(c); } }
    }).catch(()=>{});
  }
  wireKeyTerms(c);
  wireActionBar(c);
  wireDocCanvas(c);   // expand / re-read buttons (inside #doc-canvas)
  document.getElementById('ws-back').addEventListener('click',()=>{
    const r=state.wsReturn||{};
    if(r.view==='folder'&&r.folderId&&FOLDERS[r.folderId]){ state.folderId=r.folderId; setView('folder'); }
    else setView(r.view&&r.view!=='workspace'?r.view:'register');
  });
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
  document.getElementById('ws-history')?.addEventListener('click',()=>{ if(window.openHistoryTimeline) openHistoryTimeline(c); });
  document.getElementById('ws-delete')?.addEventListener('click',()=>deleteContract(c.id).then(ok=>{ if(ok) setView('register'); }));
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
  wireWsExportMenu();
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
  put('#doc-canvas [data-sync="value"], [data-kt="value"]', c.value||'');
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
  window.renderObligationsSection&&renderObligationsSection(c);
}
function wireDocumentSync(c){
  const canvas=document.getElementById('doc-canvas');
  canvas.querySelectorAll('[data-sync]').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const key=inp.getAttribute('data-sync');
      if(key==='value') c.value=inp.value===''?0:Number(inp.value);
      else if(key==='counterparty') c.counterparty=inp.value;
      syncKeyTermsUI(c, inp);
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
               effDate:'effective date', expiry:'expiry date'};
  document.querySelectorAll('[data-kt]').forEach(inp=>{
    const key=inp.getAttribute('data-kt');
    const evt=(inp.type==='checkbox'||inp.type==='date')?'change':'input';
    inp.addEventListener(evt,()=>{
      if(key==='counterparty') c.counterparty=inp.value.trim();
      else if(key==='value') c.value=inp.value===''?0:Number(inp.value);
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
  if(text.length<200){ toast('No readable document text to read from','err'); return; }
  if(btn){ btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Reading…</span>'; }
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
    toast('Could not read the document — '+(e.message||'try again'),'err');
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
    const avatarBg=internal?'bg-brand-100 text-brand-700':'bg-gold-500/15 text-gold-600';
    const initials=esc(String(m.author||'').split(' ').map(w=>w[0]||'').slice(0,2).join('').toUpperCase());
    return `
    <div class="flex gap-2.5">
      <div class="h-7 w-7 shrink-0 grid place-items-center rounded-full text-[10px] font-semibold ${avatarBg}">${initials}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-medium text-brand-900">${esc(m.author)}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${internal?'bg-brand-50 text-brand-600':'bg-gold-500/10 text-gold-600'}">${esc(m.role)}</span>
          <span class="text-[10px] text-brand-800/60 ml-auto">${esc(m.ts)}</span>
        </div>
        <p class="text-xs text-brand-800/75 mt-0.5 leading-relaxed">${esc(m.text)}</p>
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
    c.comments.push({ author:u?.name||'You', role:`${ROLE_LABEL[u?.role]||'User'} (Internal)`, side:'internal', text, ts:fmtDT(nowISO()) });
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
    wrap.innerHTML=`<div class="text-center text-[11px] text-brand-800/65 py-2">Viewer access — signing is disabled for your role.</div>`;
    return;
  }
  // The other way a deal ends. Offered once the wording is settled, because
  // until then there is nothing to have signed on paper.
  const paperRoute = !((window.negoSigningBlockers ? negoSigningBlockers(c).length
      : (window.unresolvedRedlines && unresolvedRedlines(c))))
    ? `<button id="sign-paper" class="mt-2 w-full text-center text-[11px] text-brand-800/70 hover:text-brand-900 underline decoration-dotted underline-offset-2 py-1.5 transition">Signed on paper instead? File the signed copy here</button>`
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
  const signLabel = planned&&ns ? `Sign as ${ns.name}` : 'Sign Document';
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
      <p class="mb-3 text-[10.5px] text-center text-brand-800/60 leading-relaxed">More than one signatory? Set the order first — signing seals the document.</p>`
    : '';
  wrap.innerHTML=`
    ${approvalPanelHtml(c)}
    ${signerRoute}
    <button id="sign-btn" ${ready?'':'disabled'} class="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition ${ready?'bg-brand-900 text-white hover:bg-brand-800 shadow-lg shadow-brand-900/20':'bg-brand-100 text-brand-800/60 cursor-not-allowed'}">
      ${icon('finger','w-[18px] h-[18px]')} ${signLabel}
    </button>
    ${ready?`<p class="mt-2 text-[11px] text-center text-brand-800/65">Freezes the exact text, applies a tamper-evident SHA-256 seal${planned?' when the last signer signs':''}.</p>`
           :`<p class="mt-2 text-[11px] text-center text-brand-800/65">${planned&&ns&&ns.party==='counterparty'?`Next signer is <b>${ns.name}</b> (counterparty) — share the link to collect their signature.`:`Complete: <span class="text-gold-600 font-medium">${missing.join(', ')||'approval'}</span>`}</p>`}
    ${(()=>{ const oh=openFindings(c).filter(x=>x.sev==='high').length;
      return oh?`<p class="mt-1.5 text-[11px] text-center text-rose-600 font-medium flex items-center justify-center gap-1">${icon('alert','w-3 h-3')} ${oh} high-severity finding${oh===1?'':'s'} still open</p>`:''; })()}
    ${paperRoute}`;
  if(ready) document.getElementById('sign-btn').addEventListener('click',()=>signDocument(c));
  document.getElementById('sp-setup')?.addEventListener('click',()=>openSignerPlanEditor(c));
  wirePaper();
  wireApprovalPanel(c);
}
async function signDocument(c){
  if(!canEdit()){ toast('Viewers cannot sign documents','err'); return; }
  if(!c.compliance.consent){ toast('Tick the intent-to-sign box first','err'); return; }
  if(!approvalState(c).ok){ toast('This contract needs approval before signing','err'); return; }
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
            toast('Internal signing complete — now share it with the counterparty');
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
  if(!canEdit()){ toast('Viewers cannot execute contracts','err'); return null; }
  if(c.status==='Signed' || (c.execution&&c.execution.at)){
    toast('This contract is already executed — record an amendment instead','err'); return null; }
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
  catch(e){ toast('Could not read that file','err'); return null; }

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
  toast('Filed as executed on paper — the negotiation history stays with it');
  return c.execution;
}
/* The dialog: a date, an optional note, and the scan itself. */
function openPaperSignatureModal(c){
  if(!canEdit()){ toast('Viewers cannot execute contracts','err'); return; }
  openModal(`
    <div style="padding:22px 24px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent);display:inline-flex">${icon('finger')}</span>
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0">Signed on paper</h2></div>
      <p style="font-size:12.5px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">
        Attach the signed copy to <b>this</b> contract, so the ${(c.rounds||[]).length} round${(c.rounds||[]).length===1?'':'s'} of negotiation stay with the document they produced.
        HaTi records it as <b>executed outside HaTi</b> — no electronic signature is taken, and the seal is the scanned file's own fingerprint.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Date signed (optional)</span>
        <input id="ps-date" type="date" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">Note (optional)</span>
        <input id="ps-note" type="text" placeholder="e.g. Signed at the Nairobi office, both parties present" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"/></label>
      <label style="display:block"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono)">The signed copy *</span>
        <input id="ps-file" type="file" accept=".pdf,image/*" style="width:100%;font-size:12.5px"/></label>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
        <button id="ps-cancel" class="ui-btn">Cancel</button>
        <button id="ps-go" class="ui-btn ui-btn-primary">File as executed</button>
      </div>
    </div>`);
  document.getElementById('ps-cancel').addEventListener('click',closeModal);
  document.getElementById('ps-go').addEventListener('click',async e=>{
    const input=document.getElementById('ps-file');
    const file=input&&input.files&&input.files[0];
    if(!file){ toast('Choose the signed copy first','err'); return; }
    const btn=e.currentTarget; btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Filing…</span>';
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
  const btn=document.getElementById('sign-btn'); if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">Sealing…</span>`; }
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
    firstParty:(typeof window!=='undefined'&&window.FIRST_PARTY)||(typeof FIRST_PARTY!=='undefined'?FIRST_PARTY:'') };
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
    const canvas=document.getElementById('doc-canvas'); if(canvas){ canvas.innerHTML=docBody(c); wireDocCanvas(c); }
    if(typeof updateStatusUI==='function') updateStatusUI(c);
    /* The bar that says what to do next. Left alone, it kept the sentence it
       had a second earlier — "Erik has signed. Your signature is the only thing
       left." — on a contract that was by then executed and sealed, until the
       reader happened to reload. That is the last screen of the whole journey. */
    if(typeof renderActionBar==='function') renderActionBar(c);
    renderSignButton(c); renderAuditSection(c);
  }catch(e){ /* not on screen — fine */ }
  if(!opts.silent) toast('Signed & sealed — the exact text is frozen and fingerprinted');
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
  if(API_MODE()){
    try{
      const appUrl=location.origin+location.pathname;
      const res=await api('contracts/'+c.id+'/distribute','POST',{ recipients, appUrl });
      c.distribution={ at:res.at||nowISO(), triggeredBy:'auto', recipients:res.recipients||recipients.map(r=>({...r,status:'queued'})) };
    }catch(e){
      c.distribution={ at:nowISO(), triggeredBy:'auto', error:e.message, recipients:recipients.map(r=>({...r,status:'failed'})) };
    }
  } else {
    c.distribution={ at:nowISO(), triggeredBy:'manual', recipients:recipients.map(r=>({...r,status:'mailto'})) };
  }
  const fully=!window.bothPartiesSigned||bothPartiesSigned(c);
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
  const dot=st=>['delivered','queued','sent'].includes(st)?'#2e8763':['failed','bounced'].includes(st)?'#b0453c':'#8a8f95';
  const stTxt=st=>st==='delivered'?'Delivered':(st==='queued'||st==='sent')?'Sent':st==='failed'?'Failed':st==='bounced'?'Bounced':st==='mailto'?'Ready to email':st;
  /* WHY NOTHING HAS GONE OUT YET, said before anyone has to wonder. The copy is
     held until every party has signed; a panel that simply showed the button
     and never fired it would read as a broken feature rather than a rule. */
  const ex=(typeof executionParties==='function')?executionParties(c):{fully:true};
  if(!d){
    if(!canEdit()) return '';
    return `<div class="mt-2 rounded-xl border border-line bg-white p-3">
      <div class="text-[11px] font-600 text-ink mb-1">Distribute copies</div>
      <div class="text-[10.5px] text-ink/60 mb-2">${ex.fully
        ? 'Email a sealed copy of the executed contract to every party for their records — the platform keeps the master copy.'
        : `Held: only <b>${(ex.ourName||'one party').replace(/</g,'&lt;')}</b> has signed, so the copy is not going out. Both parties have to sign before the contract is shared. Sending now delivers a progress notice — who has signed, who has not — with no copy and no seal in it.`}</div>
      <button id="dist-send" class="w-full flex items-center justify-center gap-1.5 rounded-lg ${ex.fully?'bg-brand-900 text-white hover:bg-brand-800':'border border-line text-brand-700 hover:bg-brand-50'} py-2 text-[11.5px] font-600">${icon('share','w-3.5 h-3.5')} ${ex.fully
        ? 'Send signed copies to all parties'
        : 'Send a progress notice to all parties'}</button>
    </div>`;
  }
  const rows=(d.recipients||[]).map(r=>`<div class="flex items-center gap-2 py-1 text-[11px]">
    <span class="min-w-0 flex-1"><span class="text-ink/80 font-500">${(r.name||r.email||'').replace(/</g,'&lt;')}</span>${r.role?` <span class="text-ink/45">· ${String(r.role).replace(/</g,'&lt;')}</span>`:''}<br><span class="font-mono text-[9.5px] text-ink/45">${(r.email||'').replace(/</g,'&lt;')}</span></span>
    <span class="text-[9.5px] font-mono flex items-center gap-1 shrink-0" style="color:${dot(r.status)}"><span style="width:6px;height:6px;border-radius:999px;background:${dot(r.status)}"></span>${stTxt(r.status)}</span>
  </div>`).join('');
  return `<div class="mt-2 rounded-xl border border-line bg-white p-3">
    <div class="flex items-center gap-2 mb-1"><span class="text-[11px] font-600 text-ink">Copies sent</span>
      <span class="text-[9px] font-mono text-ink/45 ml-auto">${d.at?fmtDT(d.at):''}</span></div>
    ${rows||'<div class="text-[10.5px] text-ink/50">No recipients found.</div>'}
    ${d.error?`<div class="text-[10px] text-rose-600 mt-1">${String(d.error).replace(/</g,'&lt;')}</div>`:''}
    ${canEdit()?`<button id="dist-send" class="mt-2 w-full flex items-center justify-center gap-1.5 rounded-lg border border-line text-brand-700 py-1.5 text-[11px] font-600 hover:bg-brand-50">${icon('share','w-3 h-3')} Send again</button>`:''}
    ${!API_MODE()?`<div class="text-[9.5px] text-ink/45 mt-1.5">Static mode: run the HaTi server to send email automatically.</div>`:''}
  </div>`;
}



Object.assign(window,{wsChromeFolded,applyWsCollapse,wireWsCollapse,WS_FOLD_KEY,applyDocZoom,renderDiscussSection,discussPointsSectionHtml,loadDiscussion,attachPaperSignature,openPaperSignatureModal,WORD_REFUSAL,WORD_REFUSAL_SHORT,detectWordBytes,detectWordFile,extractWordText,trackedNote,bytesToLatin,actionBarHtml,applyMetadata,captureSignature,dataUrlBytes,distributeExecuted,distributionPanelHtml,docBody,docBodyHtml,docFileUrl,documentTextHtml,externalExecutionBlock,templateProvenanceHtml,extractDocText,extractPdfText,fillKeyTermsFromDocument,finalizeExecution,findingsFromText,focusKeyTerms,frozenDocBody,inflateBytes,keyTermsProgress,notifyNextSigner,openDocReader,openEditDocModal,openUploadModal,pdfRunsToText,pdfRunsToLines,pdfStringsFrom,pdfTextRuns,pdfLatin,pdfStreamIsCompressed,looksLikeText,pdfIndexObjects,pdfExpandObjStreams,pdfPageObjects,pdfPageFonts,pdfStreamBytes,pdfRef,pdfDictVal,pdfFontWidths,base14Widths,pdfRunWidth,pdfArray,pdfNum,pdfKeyIndex,pdfFontStyle,redlineDocBody,renderActionBar,renderFeed,issueSigningAct,rereadUploadText,syncKeyTermsUI,wireActionBar,wireKeyTerms,renderSignButton,renderWorkspace,sentenceAround,signDocument,signatureBlock,submitUpload,upField,updateStatusUI,uploadDocBody,uploadScanRules,wireComments,wireCompliance,wireDocumentSync,wsNextAction,
  wsTabBtn,wsTabDefaults,applyWsTabs,wireWsTabs,negoTabCountHtml,openNegotiationOwnerRoom,negoRepaintOpenRoom,openNegoProposeModal});
