// HaTi — OCR: read scanned paper.
//
// Globals are window-attached on purpose: the app runs on one shared global
// scope (inline handlers, cross-module calls); modules give file isolation for
// editing, not scope isolation.
//
// The design note is DESIGN-ocr.md. In short:
//   detect (a PDF with almost no text layer, or an image)
//     → rasterize each page in the browser with pdf.js at ~200 DPI
//     → recognise: POST /api/ai/ocr (vision) when a key is configured,
//       otherwise Tesseract.js in-browser
//     → return text PLUS honest provenance, which the whole pipeline downstream
//       relies on (capped confidence, viewer banner, audit trail).
//
// Nothing here is loaded until a document actually needs OCR: a workspace with
// only digital PDFs never fetches pdf.js or Tesseract, and static mode boots
// with no network.

const _ocrEsc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));

/* A PDF that yields less than this many characters has no usable text layer. */
const OCR_TEXT_FLOOR = 200;
/* Render target. 200 DPI against the PDF's 72 DPI user space; capped so a large
   sheet cannot blow up memory, floored so a small page is still legible. */
const OCR_DPI = 200, OCR_MAX_EDGE = 2400, OCR_MIN_SCALE = 1.2, OCR_JPEG_QUALITY = 0.72;
/* CDN modules, pinned, loaded lazily and cached.
   Each URL can be overridden by a `window.HATI_OCR_*` global set before app.js
   loads — a deployment behind a strict egress policy (or an air-gapped one) can
   self-host the two libraries and point at them, and the test harness uses the
   same hook. Left unset, the CDN URLs below are used. */
const OCR_CDN = {
  pdfjs:  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.min.mjs',
  worker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.6.82/pdf.worker.min.mjs',
  tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
};
const OCR_PDFJS_URL    = () => window.HATI_OCR_PDFJS    || OCR_CDN.pdfjs;
const OCR_PDFJS_WORKER = () => window.HATI_OCR_PDFJS_WORKER || OCR_CDN.worker;
const OCR_TESSERACT_URL= () => window.HATI_OCR_TESSERACT|| OCR_CDN.tesseract;
// Tesseract fetches its own worker, wasm core and language data at runtime; a
// self-hosted deployment points these at local copies via the same hook.
const OCR_TESSERACT_OPTS=()=>window.HATI_OCR_TESSERACT_OPTS||undefined;

let _pdfjs=null, _pdfjsErr=null;
async function ocrLoadPdfjs(){
  if(_pdfjs) return _pdfjs;
  if(_pdfjsErr) throw _pdfjsErr;
  try{
    const mod=await import(/* @vite-ignore */ OCR_PDFJS_URL());
    const lib=mod.getDocument?mod:(mod.default||mod);
    if(lib.GlobalWorkerOptions) lib.GlobalWorkerOptions.workerSrc=OCR_PDFJS_WORKER();
    _pdfjs=lib; return lib;
  }catch(e){ _pdfjsErr=new Error('Could not load the PDF renderer ('+e.message+')'); throw _pdfjsErr; }
}
let _tess=null, _tessErr=null;
async function ocrLoadTesseract(){
  if(_tess) return _tess;
  if(_tessErr) throw _tessErr;
  if(window.Tesseract){ _tess=window.Tesseract; return _tess; }
  try{
    await new Promise((res,rej)=>{ const s=document.createElement('script');
      s.src=OCR_TESSERACT_URL(); s.onload=res; s.onerror=()=>rej(new Error('script blocked')); document.head.appendChild(s); });
    if(!window.Tesseract) throw new Error('library did not initialise');
    _tess=window.Tesseract; return _tess;
  }catch(e){ _tessErr=new Error('Could not load the offline text recogniser ('+e.message+')'); throw _tessErr; }
}

/* ---------- is this document a scan? ---------- */
const ocrIsImage = mime => /^image\/(png|jpe?g|webp)$/i.test(String(mime||''));
/* A PDF whose extracted text is under the floor is image-only. Images always
   need OCR. Anything else (plain text, a rich PDF) does not. */
function ocrNeeded(mime, extractedText){
  if(ocrIsImage(mime)) return true;
  if(!/pdf/i.test(String(mime||''))) return false;
  return String(extractedText||'').trim().length < OCR_TEXT_FLOOR;
}

/* ---------- rasterize ---------- */
function ocrCanvasToJpeg(canvas){
  try{ return canvas.toDataURL('image/jpeg', OCR_JPEG_QUALITY); }
  catch(e){ return canvas.toDataURL('image/png'); }
}
/* Page count without rendering anything — used by the pre-flight estimate and
   to apply ocrMaxPages before a single Copilot call is made. */
async function ocrPdfPageCount(dataUrl){
  const pdfjs=await ocrLoadPdfjs();
  const doc=await pdfjs.getDocument({ data: dataUrlBytes(dataUrl) }).promise;
  const n=doc.numPages;
  try{ await doc.destroy(); }catch(e){}
  return n;
}
/* Render one page to a JPEG data URL. `doc` is a loaded pdf.js document. */
async function ocrRenderPage(doc, pageNo){
  const page=await doc.getPage(pageNo);
  const base=page.getViewport({ scale: 1 });
  let scale=OCR_DPI/72;
  const longEdge=Math.max(base.width, base.height)*scale;
  if(longEdge>OCR_MAX_EDGE) scale=Math.max(OCR_MIN_SCALE, scale*(OCR_MAX_EDGE/longEdge));
  const viewport=page.getViewport({ scale });
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width); canvas.height=Math.ceil(viewport.height);
  const ctx=canvas.getContext('2d', { alpha:false });
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({ canvasContext: ctx, viewport }).promise;
  const url=ocrCanvasToJpeg(canvas);
  canvas.width=canvas.height=0;     // release the backing store straight away
  try{ page.cleanup(); }catch(e){}
  return url;
}
/* Downscale a standalone image if it is larger than the render cap. */
async function ocrPrepImage(dataUrl){
  try{
    const img=await new Promise((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>rej(new Error('bad image')); i.src=dataUrl; });
    const longEdge=Math.max(img.width,img.height);
    if(longEdge<=OCR_MAX_EDGE && dataUrl.length < 3.5*1024*1024) return dataUrl;
    /* MIN(1, …) — WITHOUT IT THE ONE PATH THAT EXISTS TO MAKE A FILE SMALLER
       COULD MAKE IT BIGGER. A phone photo cropped tight, or a high-quality
       scan of a small page, arrives under the edge cap and over the byte cap:
       it falls through to here, and a bare OCR_MAX_EDGE/longEdge is then
       GREATER than one. A 1000px page was being scaled UP to 2400px on its way
       to being shrunk. Held at its own size it is still re-encoded as JPEG at
       quality 0.72, which is what actually brings the bytes down. */
    const k=Math.min(1, OCR_MAX_EDGE/longEdge);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(img.width*k)); canvas.height=Math.max(1,Math.round(img.height*k));
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const out=ocrCanvasToJpeg(canvas); canvas.width=canvas.height=0; return out;
  }catch(e){ return dataUrl; }
}

/* ---------- recognise ---------- */
async function ocrPageWithAi(pageDataUrl, { first=false, allowance=false }={}){
  const r=await api('ai/ocr','POST',{ pages:[pageDataUrl], first: !!first, allowance: !!allowance });
  /* `truncated` is carried, not dropped. The route keeps a page that was cut
     short rather than throwing the readable half away, and this is the only
     place that can tell the document it happened — without it the provenance
     line says a page was read when half of it was not. */
  return { text: String(r.text||''), illegible: Number(r.illegible||0),
    confidence: r.confidence||'medium', truncated: !!r.truncated };
}
let _tessWorker=null;
async function ocrTesseractWorker(){
  if(_tessWorker) return _tessWorker;
  const T=await ocrLoadTesseract();
  _tessWorker = await T.createWorker('eng', undefined, OCR_TESSERACT_OPTS());
  return _tessWorker;
}
async function ocrPageWithTesseract(pageDataUrl){
  const w=await ocrTesseractWorker();
  const { data }=await w.recognize(pageDataUrl);
  return { text: String((data&&data.text)||''), illegible: 0,
    confidence: (data&&data.confidence>=80)?'medium':'low', truncated:false };
}
/* Release the Tesseract worker — it holds a few tens of MB. */
async function ocrRelease(){ if(_tessWorker){ try{ await _tessWorker.terminate(); }catch(e){} _tessWorker=null; } }

/* ---------- the whole document ----------
   Returns { text, textSource, pages, skippedPages, totalPages, tier, illegible,
   partialPages, failedPages, error }.
   `textSource` is one of 'ocr-ai' | 'ocr-local' | 'none' and is what the record,
   the viewer banner and the confidence cap all key off.

   opts:
     onProgress(done, total, tier)  progress strip / migration queue note
     shouldContinue()               false stops cleanly, keeping pages already read
     allowance                      draw on the onboarding allowance
     maxPages                       override ocrMaxPages (defaults to the setting) */
async function ocrDocument(dataUrl, mime, opts={}){
  const cfg=(state.aiCfg&&state.aiCfg.limits)||{};
  const maxPages=Math.max(1, Number(opts.maxPages||cfg.ocrMaxPages||30));
  const canAi=!!(API_MODE()&&state.aiConfigured);
  const onProgress=typeof opts.onProgress==='function'?opts.onProgress:()=>{};
  const keepGoing=typeof opts.shouldContinue==='function'?opts.shouldContinue:()=>true;
  const out={ text:'', textSource:'none', pages:0, skippedPages:0, totalPages:0, tier:null,
    illegible:0, partialPages:0, failedPages:0, error:null };

  // ---- open the document and decide how many pages there are to read
  /* ONE PAGE IS RENDERED, THEN READ, THEN THE NEXT — never all of them first.
     It used to rasterize every page into an array before recognising any, and
     that cost three things at once. The PROGRESS STRIP ran twice: "page 1 of
     12" up to 12 while rendering, then 1 to 12 again while reading, so a
     reader watched the same counter fill, reset and fill again. MEMORY held
     up to thirty JPEG data URLs — 150-250 KB each by this file's own
     estimate, so several megabytes of base64 strings alive at once on a
     machine that may be a cheap laptop. And a render failure on page 27 threw
     away twenty-six pages that had already been rendered, before a single one
     had been read. One loop answers all three. */
  let getPage=null, take=0, doc=null;
  try{
    if(ocrIsImage(mime)){
      out.totalPages=1; take=1;
      getPage=async()=>ocrPrepImage(dataUrl);
    } else {
      const pdfjs=await ocrLoadPdfjs();
      doc=await pdfjs.getDocument({ data: dataUrlBytes(dataUrl) }).promise;
      out.totalPages=doc.numPages;
      take=Math.min(doc.numPages, maxPages);
      out.skippedPages=Math.max(0, doc.numPages-take);
      getPage=async i=>ocrRenderPage(doc, i+1);
    }
  }catch(e){ out.error=e.message||'could not render the document'; return out; }
  if(!take){ out.error=out.error||'no pages to read'; return out; }

  // ---- render and recognise, page by page
  const parts=[]; let usedAi=false, usedLocal=false;
  let tier=canAi?'ai':'local';
  try{
    for(let i=0;i<take;i++){
      if(!keepGoing()) break;
      onProgress(i, take, tier);
      let img=null;
      try{ img=await getPage(i); }
      catch(e){
        /* One unrenderable page is not an unreadable document. Recorded and
           stepped over, so the other twenty-nine still reach the record. */
        out.error=e.message||'could not render a page'; out.failedPages++; continue;
      }
      let page=null;
      if(tier==='ai'){
        try{
          page=await ocrPageWithAi(img, { first: i===0 && !usedAi, allowance: !!opts.allowance });
          usedAi=true;
        }catch(e){
          // budget gone, rate limit, provider error — finish the document on the
          // offline recogniser rather than abandoning it half-read
          out.error=e.message||'Copilot OCR failed';
          tier='local';
        }
      }
      if(!page && tier==='local'){
        try{ page=await ocrPageWithTesseract(img); usedLocal=true; }
        catch(e){ out.error=e.message||'offline OCR unavailable'; break; }
      }
      if(page){
        parts.push(page.text); out.illegible+=page.illegible||0; out.pages++;
        if(page.truncated) out.partialPages++;
      }
    }
  } finally { if(doc){ try{ await doc.destroy(); }catch(e){} } }

  out.text=parts.join('\n\n').replace(/[ \t]+\n/g,'\n').replace(/\n{4,}/g,'\n\n\n').trim();
  // the *weakest* tier used decides the provenance — a document part-read by
  // Tesseract must not claim to be an Copilot transcription
  out.tier = usedLocal ? 'local' : (usedAi ? 'ai' : null);
  out.textSource = out.text ? (usedLocal ? 'ocr-local' : usedAi ? 'ocr-ai' : 'none') : 'none';
  if(out.textSource!=='none') out.error=null;   // partial success is success
  return out;
}

/* ---------- honesty helpers ----------
   Anything extracted from OCR'd text is capped at MEDIUM. It never reaches
   `high` without a human confirming it: OCR misreads dates and amounts, and
   those are exactly the fields the renewal reminders fire on. */
const OCR_SOURCES=['ocr-ai','ocr-local'];
const isOcrText = src => OCR_SOURCES.includes(src);
function capConfidenceForOcr(meta){
  if(!meta) return meta;
  meta.confidence=meta.confidence||{};
  for(const k of Object.keys(meta.confidence)) if(meta.confidence[k]==='high') meta.confidence[k]='medium';
  meta._ocrCapped=true;
  return meta;
}
const OCR_TIER_LABEL={ 'ocr-ai':'Copilot transcription', 'ocr-local':'offline recogniser (Tesseract)' };
/* One sentence describing where a contract's text came from — reused by the
   viewer banner, the audit detail and the clause-review warning. */
function ocrProvenanceLine(u){
  if(!u||!isOcrText(u.textSource)) return '';
  const pages=u.ocrPages?`${u.ocrPages} page${u.ocrPages===1?'':'s'}`:'the document';
  /* THE SKIPPED PAGES ARE THE LAST N OF THE DOCUMENT, not the N after the ones
     that were read, and the two are only the same number when nothing went
     wrong in between. It counted from ocrPages — what actually came back — so
     a 60-page scan capped at 30, of which the recogniser managed 20, reported
     "Pages 21–50 were not read (page limit)": wrong at both ends, and wrong in
     the direction that understates. Pages 21–30 were attempted and failed,
     which is a different fact with a different remedy, and pages 51–60 were
     silently unaccounted for. Counted off the TOTAL it states only what the
     page limit is actually responsible for. */
  const total=Number(u.ocrTotalPages||0), sk=Number(u.ocrSkippedPages||0);
  const from=total&&sk?total-sk+1:u.ocrPages+1;
  const to=total&&sk?total:u.ocrPages+sk;
  const skipped=sk?` Pages ${from}–${to} were not read (page limit).`:'';
  /* A PAGE THE TRANSCRIBER RAN OUT OF ROOM ON IS IN THE RECORD WITH ITS BOTTOM
     MISSING, and this line is the only place that can say so — the viewer
     banner, the audit detail and the clause-review warning all print it. */
  const cut=Number(u.ocrPartialPages||0);
  const partial=cut?` ${cut} page${cut===1?' was':'s were'} cut short and ${cut===1?'is':'are'} incomplete.`:'';
  return `This text was machine-read from a scan (${OCR_TIER_LABEL[u.textSource]}, ${pages}) and may contain errors — check dates and amounts against the original.${partial}${skipped}`;
}
/* The banner shown above machine-read text in the document viewer. */
function ocrBannerHtml(u){
  const line=ocrProvenanceLine(u);
  if(!line) return '';
  return `<div style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:var(--radius);padding:8px 11px;font-size:13px;line-height:1.55;margin-bottom:12px">
    <span style="flex:none;margin-top:1px">${icon('scan','w-3.5 h-3.5')}</span><span>${_ocrEsc(line)}</span></div>`;
}

Object.assign(window,{OCR_TEXT_FLOOR,OCR_SOURCES,OCR_TIER_LABEL,ocrIsImage,ocrNeeded,ocrDocument,
  ocrPdfPageCount,ocrRenderPage,ocrLoadPdfjs,ocrLoadTesseract,ocrRelease,
  isOcrText,capConfidenceForOcr,ocrProvenanceLine,ocrBannerHtml});
