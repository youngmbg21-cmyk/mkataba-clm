// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: MIGRATION (bulk contract onboarding)
   Bring an existing portfolio into HaTi in one sitting: drop many
   files at once, each is hashed (dedupe), text-extracted, run
   through Copilot/heuristic metadata extraction, filed and saved — then
   a confidence-routed review queue lets a human confirm only the
   fields the machine was unsure about. An optional manifest CSV
   reconciles what the customer SAID they sent against what arrived.
   Composes the existing single-upload machinery (extractDocText,
   ai/extract, openMetaReview, files API) — no new server surface.
   ============================================================ */
const MIG_MAX_FILES = 25;                        // realistic cap per batch (memory + Copilot window)
// Legacy .doc is deliberately absent: HaTi reads modern .docx (js/docx.js)
// but not the pre-2007 binary format, so the picker must not invite it in.
// Drag-and-drop bypasses `accept`, so migProcessFiles() also sniffs the bytes
// (detectWordFile) as the backstop.
const MIG_ACCEPT = '.pdf,.docx,.txt,.png,.jpg,.jpeg';
/* MIG_CRITICAL, folderFromType and the needs-a-human rule live in
   js/migread.js now (27 Sep 2026): the server reads imported contracts too. */

/* Session-scoped batch state (queue rows + manifest live in memory; every
   saved contract carries its own durable c.migration block, so the register
   below and the KPIs survive a reload — only the in-flight queue does not). */
function migState(){
  if(!state.mig) state.mig={ queue:[], manifest:null, manifestName:'', running:false,
    aiDown:false, defaults:{ status:'Signed', folder:'auto' } };
  return state.mig;
}
const migContracts = () => state.contracts.filter(c=>c.migration);
const migEsc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));

/* ---------- validation gates: what "fully migrated" means ----------
   A contract only counts as migrated when the platform can actually work it:
   file on record, counterparty known, filed in a stream, a term end (or an
   explicit evergreen), and a human has confirmed the extracted details. */
function migGates(c){
  const m=c.metadata||{};
  return [
    { k:'file',   get label(){ return i18t('mig_file_attached'); },        ok: !!(c.upload&&c.upload.fileHash) },
    { k:'cp',     get label(){ return i18t('mig_counterparty'); },         ok: !!(c.counterparty&&String(c.counterparty).trim()) },
    { k:'folder', get label(){ return i18t('mig_filed_in_stream'); },    ok: !!FOLDERS[c.folder] },
    { k:'term',   get label(){ return i18t('mig_expiry_or_evergreen'); },  ok: !!(c.expiry || m.expiryDate || m.renewalType==='evergreen') },
    { k:'review', get label(){ return i18t('mig_details_confirmed'); },    ok: !(c.migration&&c.migration.needsReview) },
  ].concat(
    // Sixth gate — only for documents the suggester actually flagged as looking
    // like an amendment. Forcing a link decision on every contract would be
    // noise; forcing it on the ones that read like addenda is the point.
    (c.linkSuggestions&&c.linkSuggestions.length)
      ? [{ k:'link', get label(){ return i18t('mig_linked_or_standalone'); }, ok: !!(c.parentId||c.linkConfirmed) }]
      : []);
}
const migComplete = c => migGates(c).every(g=>g.ok);

/* ---------- CSV (quoted-field aware, tolerant of \r\n) ---------- */
function parseCsv(text){
  const rows=[]; let row=[], cur='', q=false;
  const s=String(text||'');
  for(let i=0;i<s.length;i++){ const ch=s[i];
    if(q){ if(ch==='"'){ if(s[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
    else if(ch==='"') q=true;
    else if(ch===','){ row.push(cur); cur=''; }
    else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&s[i+1]==='\n') i++; row.push(cur); cur='';
      if(row.some(v=>v.trim()!=='')) rows.push(row); row=[]; }
    else cur+=ch;
  }
  row.push(cur); if(row.some(v=>v.trim()!=='')) rows.push(row);
  return rows;
}
/* Flexible header mapping — customers name columns however they like. */
const MIG_HEADERS = {
  file:['filename','file','document','doc'],
  name:['name','title','contract','contractname','agreement'],
  counterparty:['counterparty','party','vendor','supplier','customer','otherparty','company'],
  folder:['stream','folder','valuestream','category','department'],
  type:['type','contracttype','kind'],
  status:['status','stage','state'],
  value:['value','amount','contractvalue','kes','price'],
  currency:['currency','ccy'],
  effective:['effective','effectivedate','start','startdate','commencement'],
  expiry:['expiry','expirydate','end','enddate','termination','expires'],
  signed:['signed','signeddate','executed','executiondate','datesigned'],
};
function migHeaderMap(headerRow){
  const map={};
  headerRow.forEach((h,i)=>{ const n=String(h||'').toLowerCase().replace(/[^a-z0-9]/g,'');
    for(const [k,alts] of Object.entries(MIG_HEADERS)){ if(map[k]==null && alts.includes(n)) map[k]=i; } });
  return map;
}
/* ---------- dates ----------
   A slashed date is ambiguous and guessing per-cell is the one answer that
   cannot be right: `01/03/2024` is 1 March in Nairobi and 3 January in a
   US-locale export of the same spreadsheet. So the file is sniffed as a whole
   first (migDateOrder) and every row is then read the same way, and anything
   that is not a real calendar date is reported rather than stored. A month of
   15 used to sail through as "2024-15-03", which parses to NaN everywhere
   downstream — so the contract silently vanished from the renewal reminders,
   the Calendar and "expiring soon" while looking perfectly imported. */
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
function migValidDate(y,mo,d){
  if(!(mo>=1&&mo<=12)||!(d>=1&&d<=31)) return null;
  const dt=new Date(Date.UTC(y,mo-1,d));
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d) return null;   // 31 February
  return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}
/* Decide day-first vs month-first for a whole file. A first component above 12
   anywhere proves day-first; a second component above 12 anywhere proves
   month-first. Both, or neither, is genuinely ambiguous and says so. */
function migDateOrder(rows, cols){
  let dayFirst=0, monthFirst=0;
  for(const r of rows) for(const i of cols){
    const m=String(r[i]||'').trim().match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
    if(!m) continue;
    const a=+m[1], b=+m[2];
    if(a>12&&b<=12) dayFirst++;
    else if(b>12&&a<=12) monthFirst++;
  }
  if(dayFirst&&!monthFirst) return { order:'dmy', proven:true };
  if(monthFirst&&!dayFirst) return { order:'mdy', proven:true };
  if(dayFirst&&monthFirst)  return { order:'dmy', proven:false, conflict:true };
  return { order:'dmy', proven:false };                    // Kenyan default, flagged
}
/* Returns { value, problem }. `problem` is a sentence for the reconciliation
   panel — never a silent null, because a silently dropped expiry is invisible. */
function migParseDate(v, order='dmy'){
  const t=String(v||'').trim();
  if(!t) return { value:null };
  let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m){ const iso=migValidDate(+m[1],+m[2],+m[3]);
    return iso?{ value:iso }:{ value:null, problem:`"${t}" is not a real date` }; }
  m=t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/);
  if(m){
    const a=+m[1], b=+m[2], y=+m[3];
    const first=order==='mdy'?migValidDate(y,a,b):migValidDate(y,b,a);
    if(first) return { value:first };
    // the chosen order does not yield a date but the other one does — say so
    const other=order==='mdy'?migValidDate(y,b,a):migValidDate(y,a,b);
    if(other) return { value:other, problem:`"${t}" only makes sense as ${order==='mdy'?'day/month':'month/day'} — read as ${other}` };
    return { value:null, problem:`"${t}" is not a real date` };
  }
  m=t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if(m){ const mo=MON[m[2].slice(0,3).toLowerCase()];
    if(mo){ const iso=migValidDate(+m[3],mo,+m[1]);
      return iso?{ value:iso }:{ value:null, problem:`"${t}" is not a real date` }; } }
  m=t.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/);            // "March 1, 2024"
  if(m){ const mo=MON[m[1].slice(0,3).toLowerCase()];
    if(mo){ const iso=migValidDate(+m[3],mo,+m[2]);
      return iso?{ value:iso }:{ value:null, problem:`"${t}" is not a real date` }; } }
  return { value:null, problem:`"${t}" is not a date HaTi can read` };
}

/* ---------- money ----------
   Kenyan businesses write contract values as "KES 2.5m", "2,500,000/=",
   "Kshs. 750,000/-" and "1.2 million". The old filter kept only digits, dots
   and hyphens, so "2.5m" became 2.5 (out by a million) and "Kshs. 750,000/-"
   became the string ".750000-" → NaN → 0. Both were stored in silence. */
/* The multiplier sits immediately after the digits ("2.5m", "1.2 million"), so
   it cannot be found with a leading \b — there is no word boundary between a
   digit and a letter, which is why "2.5m" used to come through as 2.5. Match it
   as a suffix on the cleaned token instead. */
const VALUE_MULT = { b:1e9, bn:1e9, billion:1e9, billions:1e9, bilioni:1e9,
                     m:1e6, mn:1e6, million:1e6, millions:1e6, milioni:1e6,
                     k:1e3, thousand:1e3, thousands:1e3, elfu:1e3 };
function migParseValue(v){
  const raw=String(v==null?'':v).trim();
  if(!raw) return { value:0 };
  // drop the currency words and the Kenyan "/=" and "/-" terminators, then the
  // separators — what should be left is digits and at most a multiplier word
  const t=raw.replace(/\b(kes|ksh|kshs|sh|shs|shilling|shillings)\b\.?/ig,' ')
             .replace(/\/\s*[=-]\s*$/,' ')
             .replace(/[,'\s ]/g,'')
             .replace(/\.$/,'')
             .trim()
             .toLowerCase();
  const m=/^(-?\d+(?:\.\d+)?)([a-z]*)$/.exec(t);
  if(!m) return { value:0, problem:`"${raw}" is not a number HaTi can read` };
  const suffix=m[2];
  if(suffix && !(suffix in VALUE_MULT))
    return { value:0, problem:`"${raw}" — HaTi does not recognise "${suffix}" as a multiplier` };
  const n=Number(m[1])*(suffix?VALUE_MULT[suffix]:1);
  if(!Number.isFinite(n)) return { value:0, problem:`"${raw}" is not a number HaTi can read` };
  if(n<0) return { value:0, problem:`"${raw}" is negative` };
  return { value:n };
}
function migParseStatus(v){
  const t=String(v||'').toLowerCase();
  if(/sign|execut|active|live/.test(t)) return 'Signed';
  if(/review|negotiat|pending/.test(t)) return 'Under Review';
  if(/draft/.test(t)) return 'Draft';
  if(/clos|declin|terminat|cancel/.test(t)) return 'Declined';
  return null;
}
function migParseFolder(v){
  const t=String(v||'').toLowerCase(); if(!t) return null;
  for(const f of Object.values(FOLDERS)){ if(f.id===t || f.name.toLowerCase().includes(t) || t.includes(f.id)) return f.id; }
  return folderFromType(t);
}
/* ---------- manifest (the customer's own checklist) ---------- */
async function migLoadManifest(file){
  const M=migState();
  const reject=reason=>{
    // Keeping the previously loaded manifest is right — losing it because a
    // second file was malformed would be worse. Saying nothing is not: the
    // banner would keep describing a different file than the one just chosen.
    M.manifestError={ name:file.name, reason };
    toast(reason,'err');
    renderMigration();
  };
  const text=await file.text();
  const rows=parseCsv(text);
  if(rows.length<2) return reject('That CSV has no data rows');
  const map=migHeaderMap(rows[0]);
  if(map.file==null && map.name==null) return reject('Manifest needs at least a "filename" or "name" column');

  const body=rows.slice(1);
  const dateCols=['effective','expiry','signed'].map(k=>map[k]).filter(i=>i!=null);
  const order=migDateOrder(body, dateCols);
  const problems=[];
  M.manifest=body.map((r,i)=>{
    const g=k=>map[k]!=null?String(r[map[k]]||'').trim():'';
    const label=g('file')||g('name')||`row ${i+2}`;
    const note=(field,p)=>{ if(p) problems.push({ row:i+2, label, field, message:p }); };
    const eff=migParseDate(g('effective'),order.order);   note('effective date',eff.problem);
    const exp=migParseDate(g('expiry'),order.order);      note('expiry date',exp.problem);
    const sgn=migParseDate(g('signed'),order.order);      note('signed date',sgn.problem);
    const val=migParseValue(g('value'));                  note('value',val.problem);
    return { file:g('file'), name:g('name'), counterparty:g('counterparty'),
      folder:migParseFolder(g('folder'))||folderFromType(g('type')), type:g('type'),
      status:migParseStatus(g('status')), value:val.value, currency:g('currency'),
      effective:eff.value, expiry:exp.value, signed:sgn.value,
      matchedId:null };
  });
  M.manifestName=file.name;
  M.manifestError=null;
  M.manifestProblems=problems;
  M.manifestDateOrder=order;
  // re-reconcile against contracts already imported (e.g. manifest loaded second)
  migContracts().forEach(c=>{ const row=migManifestRow(c.upload&&c.upload.fileName); if(row&&!row.matchedId) row.matchedId=c.id; });
  toast(problems.length
    ? `Manifest loaded — ${M.manifest.length} rows, ${problems.length} value${problems.length===1?'':'s'} need${problems.length===1?'s':''} attention`
    : `Manifest loaded — ${M.manifest.length} rows`, problems.length?'err':undefined);
  renderMigration();
}
function migManifestRow(fileName){
  const M=migState(); if(!M.manifest||!fileName) return null;
  const base=String(fileName).toLowerCase();
  const stem=base.replace(/\.[^.]+$/,'');
  return M.manifest.find(r=>{ const f=(r.file||'').toLowerCase();
    return f && (f===base || f.replace(/\.[^.]+$/,'')===stem); }) || null;
}
function migManifestTemplate(){
  const head='filename,name,counterparty,type,stream,status,value,currency,effective date,expiry date,signed date';
  const ex='"acme_supply_2024.pdf","Supply Agreement — Acme","Acme Ltd","Raw Material Supply","Procurement","Executed","2500000","KES","2024-01-01","2026-12-31","2024-01-05"';
  downloadFile('hati-migration-manifest.csv', head+'\n'+ex, 'text/csv');
}

/* ---------- Copilot budget: allowance state + pre-flight estimate ----------
   The Migration screen is where onboarding spend actually happens, so it shows
   the onboarding allowance burning down and estimates a batch BEFORE it runs.
   Everything here is an estimate and is labelled as one — never a charge. */
async function migLoadAiState(){
  const M=migState();
  if(!API_MODE()){ M.allowance=null; return null; }
  try{
    const c=await api('ai/config');
    state.aiCfg=c; M.allowance=c.allowance||null;
    return c;
  }catch(e){ return null; }
}
const MIG_EST_FALLBACK={ charsPerToken:4, extractPromptTokens:700, extractOutputTokens:400,
  ocrPageInputTokens:1700, ocrPagePromptTokens:250, ocrPageOutputTokens:900 };
// USD per million tokens for the model a tier resolves to
function migAiRate(tier){
  const c=state.aiCfg||{};
  const model=(c.models&&c.models[tier])||'';
  const rates=c.rates||{};
  return rates[model]||rates['default']||{in:10,out:50};
}
// A page of a contract is roughly 1,800 characters of text; a PDF page is
// roughly 40 KB on disk. Both are rules of thumb — the estimate says so.
const MIG_CHARS_PER_PAGE=1800, MIG_BYTES_PER_PAGE=40000;
function migGuessPages(file){
  if(/^image\//.test(file.type||'')||/\.(png|jpe?g)$/i.test(file.name||'')) return 1;
  return Math.max(1, Math.round((file.size||0)/MIG_BYTES_PER_PAGE));
}
function migEstimate(files){
  const c=state.aiCfg||{}, lim=c.limits||{};
  const E=Object.assign({}, MIG_EST_FALLBACK, c.estimate||{});
  const maxChars=Number(lim.maxChars||60000);
  const thorough=!!lim.thoroughExtract;
  const ocrMax=Number(lim.ocrMaxPages||30);
  const fast=migAiRate('fast'), deep=migAiRate('deep');
  const r=thorough?deep:fast;
  let docs=0, pages=0, extractCost=0, ocrPages=0;
  for(const f of files){
    const p=migGuessPages(f); docs++; pages+=p;
    const docChars=p*MIG_CHARS_PER_PAGE;
    const chunks=thorough?Math.max(1,Math.ceil(docChars/30000)):1;
    const sent=thorough?Math.min(30000,docChars):Math.min(maxChars,docChars);
    extractCost += chunks*((E.extractPromptTokens + sent/E.charsPerToken)*r.in + E.extractOutputTokens*r.out)/1e6;
    ocrPages += Math.min(p, ocrMax);
  }
  const ocrCost=ocrPages*((E.ocrPageInputTokens+E.ocrPagePromptTokens)*fast.in + E.ocrPageOutputTokens*fast.out)/1e6;
  return { docs, pages, extractCost, ocrCost, ocrPages, worstCase:extractCost+ocrCost, thorough };
}
/* ---- WHAT A BATCH COSTS, IN CALLS (round 22, "The SAP way", as drawn: "Jambo
   reads each one … You see the total before it starts"; the owner's answer of
   18 Oct 2026: Jambo's costs are said in CALLS, never money) ----
   One call reads one file (thorough reading: one per section); a scan with no
   text is read page by page, one call a page, so the most a batch can take
   counts every page as a scan. A reading of the files, nothing spent. */
function migCallsOf(files){
  const est=migEstimate(files||[]);
  const lim=(state.aiCfg||{}).limits||{};
  const thorough=!!lim.thoroughExtract;
  let calls=0;
  for(const f of (files||[])){
    const chars=migGuessPages(f)*MIG_CHARS_PER_PAGE;
    calls+=thorough?Math.max(1,Math.ceil(chars/30000)):1;
  }
  return { files:est.docs, calls, upTo:calls+est.ocrPages, thorough };
}
/* the onboarding allowance said in files, or in a share of it — never money */
function migAllowanceWords(){
  const a=migState().allowance;
  if(!a||!a.open) return { open:false, said:i18t('mig_from_daily') };
  if(a.exhausted) return { open:true, done:true, said:i18t('mig_allow_done') };
  if(a.docs>0) return { open:true, said:i18t('mig_from_allow_docs',{ used:Number(a.docsUsed)||0, of:a.docs }) };
  if(a.budget>0) return { open:true, said:i18t('mig_from_allow_pct',{ pct:Math.min(100,Math.round((Number(a.spent)||0)/a.budget*100)) }) };
  return { open:true, said:i18t('mig_from_allow') };
}
/* the same, as a sentence of its own (Jambo's panel) */
function migAllowanceLine(){
  const a=migState().allowance;
  if(!a||!a.open) return '';
  if(a.exhausted) return i18t('mig_allow_done');
  if(a.docs>0) return i18t('mig_side_allow_docs',{ used:Number(a.docsUsed)||0, of:a.docs });
  if(a.budget>0) return i18t('mig_side_allow_pct',{ pct:Math.min(100,Math.round((Number(a.spent)||0)/a.budget*100)) });
  return '';
}
/* YOU SEE THE TOTAL BEFORE IT STARTS (as drawn — reverses U-4, which let an
   open onboarding allowance start a batch without a word: the owner's yes to
   build every drawn part, 18 Oct 2026). Whenever Jambo will read, the total is
   said in calls and a press starts it; where HaTi's own rules read (no key, a
   static workspace) nothing is spent and nothing is asked. Returns true to
   proceed. */
async function migConfirmEstimate(files){
  if(!API_MODE()||!state.aiConfigured||migState().aiDown) return true;
  const M=migState();
  M.lastEstimate=migEstimate(files);
  const n=migCallsOf(files), aw=migAllowanceWords();
  if(aw.done) return true;   /* nothing of Jambo's is left to spend: HaTi's own rules read the rest, said on the strip */
  return await confirmDialog({
    get title(){ return i18tn('mig_run_title', n.files, { n:n.files }); },
    message:i18tn('mig_run_calls', n.calls, { n:n.calls, from:aw.said })
      +(n.upTo>n.calls?' '+i18t('mig_run_upto',{ n:n.upTo }):'')
      +(n.thorough?' '+i18t('mig_run_thorough'):''),
    confirmLabel:i18t('mig_run_go') });
}

/* ---------- bulk metadata extraction (429-safe) ----------
   Uses the same server endpoint as single uploads, but stops calling the Copilot
   for the rest of the batch after the first rate-limit/failure (the server
   allows 40 light Copilot calls / 15 min) — remaining files fall back to the
   pattern-matcher and are flagged so "Re-run Copilot" can finish the job later. */
async function migExtract(text, seed){
  const M=migState();
  let meta=null;
  if(API_MODE() && state.aiConfigured && !M.aiDown){
    // `allowance: true` tells the server to draw on the onboarding allowance
    // rather than the day-to-day budget. When it runs out the server answers
    // 429 with allowanceExhausted — we fall back to the pattern matcher and
    // say so plainly rather than hard-failing half way through a portfolio.
    try{ meta=await aiExtractMetadata(text, { allowance:!!M.allowance&&M.allowance.open }); meta._source='ai'; }
    catch(e){ M.aiDown=true;
      M.aiDownMsg = e.allowanceExhausted
        ? 'Onboarding allowance used up — the rest of this batch is pattern-matched'
        : e.spendLimit ? 'Daily Jambo budget reached — the rest of this batch is pattern-matched'
        : /limit/i.test(e.message) ? 'Jambo rate limit reached'
        : 'Jambo unavailable ('+e.message+')';
    }
  }
  if(!meta){ meta=heuristicExtract(text); meta._source='heuristic'; }
  if(seed){ meta.confidence=meta.confidence||{};
    for(const [k,v] of Object.entries(seed)){ if(v!=null&&v!==''){ meta[k]=v; meta.confidence[k]='high'; } } }
  return meta;
}
/* ---- COPILOT READS ON THE SERVER NOW (27 Sep 2026: "move the reading to the
   server so it keeps going when you close the tab") ----
   Where this server can read (a live Copilot engine, nothing gone wrong this
   batch, Archive import switched on), each file is filed at once with what the
   pattern matcher can tell and handed to the server's queue
   (importQueueRead, js/agentruns.js), which reads it whether or not this tab
   stays open, checks it against Our standards and emails whoever started the
   batch when it is done. The question asked is the extract route's own; WHAT
   TEXT is sent is still decided here, once (buildExtractionPayload). Thorough
   mode reads section by section and stays in this tab, as it always did. */
function migServerReads(){
  const M=migState();
  if(!(API_MODE() && state.aiConfigured && !M.aiDown && typeof importQueueRead==='function')) return false;
  if(state.aiCfg&&state.aiCfg.limits&&state.aiCfg.limits.thoroughExtract) return false;
  try{ const a=(typeof agentsStatus==='function')?agentsStatus():null; if(a&&a.agents&&a.agents.import&&a.agents.import.on===false) return false; }catch(_){}
  return true;
}
/* What the pattern matcher can tell before Copilot reads it — the seed wins,
   exactly as migExtract applies it. */
function migExtractLocal(text, seed){
  const meta=heuristicExtract(text); meta._source='heuristic';
  if(seed){ meta.confidence=meta.confidence||{};
    for(const [k,v] of Object.entries(seed)){ if(v!=null&&v!==''){ meta[k]=v; meta.confidence[k]='high'; } } }
  return meta;
}
/* Does the extraction need a human? Any critical field missing or low-conf. */
function migNeedsReview(meta, c){
  /* A MACHINE-READ SCAN ALWAYS NEEDS A HUMAN, ONCE — and until 22 Aug 2026 it
     did not, which made the whole honesty chapter of DESIGN-ocr.md a label
     with nothing behind it.

     The chain: OCR reads a date, the extractor is confident about the text it
     was given and marks it `high`, capConfidenceForOcr honestly knocks every
     high down to `medium` — and this gate only ever tripped on `low`. So a
     scan came through the batch marked "complete", nobody was asked to look,
     and the register carried a date no person had ever seen.

     MEASURED, not argued (test/scan/measure.js, the first time a scan was put
     through this product): on a page whose word recall was 100%, a 100 DPI
     scan read "28 February 2028" as "26 February 2028", and a phone photo of
     the same page read it as "28 February 2025". Three years out, on the
     field the renewal reminders fire on, in a reading that looks perfect.
     DESIGN-ocr.md predicted exactly this in words — "3 for 8, 2026 for 2028"
     — and then the gate let it past.

     ASKED OF THE CONTRACT, NOT OF meta._ocrCapped: the provenance is durable
     and the underscore is transport, so a later recompute (migRerunAi) still
     gets the right answer. It says a human must look ONCE, not for ever —
     applyReviewedMeta clears the flag the moment somebody confirms. */
  const src=(c&&c.upload&&c.upload.textSource)||(c&&c.migration&&c.migration.textSource)||'';
  return migReadNeedsReview(meta, { valueNone: !!(c && c.valueType==='none'), ocr: isOcrText(src) });
}

/* ---------- build + save one migrated contract ----------
   Extracted from the batch loop so a file parked for a duplicate decision can
   be finished later through exactly the same path. `link` optionally files the
   new contract as a child of an existing agreement (the "import and link as an
   amendment" action). */
async function migBuildAndSave(ctx){
  const M=migState();
  const { file, mime, dataUrl, manifest, meta, upload, ocr, textSource, readable, extractedText, batch, u, link } = ctx;
  if(API_MODE()){
    try{ const r=await api('files','POST',{ name:file.name, mime, dataUrl }); upload.fileId=r.id; }
    catch(e){ /* fall back to inline bytes */ }
  }
  // resolve filing decisions: manifest > extraction > batch defaults
  const folder=(manifest&&manifest.folder)||folderFromType(meta&&meta.contractType)
    ||(M.defaults.folder!=='auto'?M.defaults.folder:null)||'corp';
  const status=(manifest&&manifest.status)||M.defaults.status;
  const executedOutside=status==='Signed';
  const name=(manifest&&manifest.name)||((typeof fileTitleOf==='function')?fileTitleOf(file.name):String(file.name||'').replace(/\.[^.]+$/,'')).replace(/[_-]+/g,' ').trim();
  const cp=(manifest&&manifest.counterparty)||(meta&&meta.counterparty)||'';
  const value=(manifest&&manifest.value>0)?manifest.value:Number(meta&&meta.value)||0;
  const expiry=(manifest&&manifest.expiry)||(meta&&meta.expiryDate)||null;
  const c={ id:nextId(), name, counterparty:cp, value, status,
    template:null, source:'upload', folder, valueType:value>0?'estimated':'none',
    lastAction:todayStr(), expiry, hash:executedOutside?'MIGRATED':null,
    signedAt:executedOutside?((manifest&&(manifest.signed||manifest.effective))||(meta&&meta.effectiveDate)||null):null,
    // Paper executed elsewhere has no signatory HaTi can name — the person
    // running the import is a filing clerk, not a party to the contract.
    // Who imported it is recorded on c.migration and in the audit trail.
    signatory:executedOutside?null:(u?.name||'Authorized signatory'), compliance:{},
    comments:[{author:'System',role:'Automation',side:'internal',
      text:`Migrated in batch ${batch} from “${file.name}” and filed under ${FOLDERS[folder].name}.${executedOutside?' Recorded as executed outside HaTi — the seal is the uploaded file’s own SHA-256.':''}`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Migrated',
      detail:`Imported “${file.name}” (${Math.round(file.size/1024)} KB) in batch ${batch}${readable?`, ${extractedText.length.toLocaleString()} chars ${isOcrText(textSource)?'machine-read from a scan':'extracted'}`:', no machine-readable text'}${executedOutside?' — executed outside HaTi':''}`}],
    signatures:[], upload };
  // metadata is attached un-"confirmed" — cp/value/expiry were already baked
  // in above, and the audit trail must not claim a human reviewed it yet
  if(meta) c.metadata=meta;
  // provenance in the audit trail — a reader months from now has no other
  // way to know these dates were transcribed by a machine, not typed
  if(isOcrText(textSource)) c.audit.push({ at:nowISO(), user:u?.name||'System', action:'OCR',
    detail:ocrProvenanceLine(upload) });
  c.migration={ batch, importedAt:nowISO(), importedBy:u?.name||'System',
    /* Handed to the server to read: a person checks it once Copilot has read
       it, never before (the agent counts it as being read, not as waiting). */
    needsReview: ctx.serverRead ? true : (!meta || migNeedsReview(meta, c)),
    ...(ctx.serverRead ? { reading:'queued' } : {}),
    // `no-text` may only fire AFTER OCR has been attempted and failed
    blocked: readable?null:'no-text',
    textSource, ocrPages: ocr?ocr.pages:0, ocrSkippedPages: ocr?ocr.skippedPages:0,
    /* ocrTotalPages is what the "pages N-M were not read" sentence counts back
       from, and this record is read by that sentence (the queue row's hover)
       whenever there is no upload beside it. Without it the range is computed
       off what came back, which is the fault this pass fixed in one place and
       would otherwise have left standing in the other. */
    ocrTotalPages: ocr?ocr.totalPages:0, ocrPartialPages: ocr?ocr.partialPages:0,
    manifest: !!manifest, executedOutside,
    /* THE FOLDER IT CAME FROM, where a whole folder was dropped (round 22, as
       drawn: "Old contracts from the shared drive") — the head names it */
    ...(M.from ? { from:String(M.from).slice(0,120) } : {}),
    aiSource:(meta&&meta._source)||'none' };
  if(manifest) manifest.matchedId=c.id;
  c._loaded=true; c._light=false; c._v=0;
  // A human chose to file this as an amendment of an existing agreement.
  if(link&&link.parentId) applyParentLink(c, link.parentId, link.relation||'amendment',
    link.note||`Linked at import — flagged as a possible duplicate of ${(window.contractRef?contractRef(getContract(link.parentId)||{id:link.parentId}):link.parentId)}`, u);
  else if(ctx.suggest){
    // suggest, never auto-link: the proposal and the human's decision are two
    // separate audit entries, so the trail never claims a person confirmed
    // something the machine guessed
    const props=suggestParents({ counterparty:c.counterparty, text:extractedText,
      simhash:upload.simhash, excludeId:c.id });
    if(props.length){ logLinkSuggestion(c, props); c.relationGuess=guessRelation(file.name, extractedText); }
  }
  if(window.contractOwnerStamp) contractOwnerStamp(c);
  state.contracts.unshift(c);
  /* A NEW DRAFT OPENS ON KEY TERMS, not on its document — see
     wsTabDefaults. Registered at every creation site because there is no
     single funnel for creating a contract. */
  if(window.roomOpenOnTerms) roomOpenOnTerms(c.id);
  /* AND COPILOT READS IT (Young ruled 17 Sep 2026) — registered at every
     creation site beside roomOpenOnTerms, because there is no single funnel
     for creating a contract. See contractArrived. */
  if(window.contractArrived) contractArrived(c,{bulk:true});
  persist(c);
  return c;
}
function migIndexContract(c, upload){
  const M=migState();
  if(!M.dupIndex) M.dupIndex=[];
  M.dupIndex.push({ id:c.id, name:c.name, counterparty:c.counterparty, value:c.value,
    fileHash:(upload||c.upload||{}).fileHash||null,
    textFingerprint:(upload||c.upload||{}).textFingerprint||null,
    simhash:(upload||c.upload||{}).simhash||null,
    effectiveDate:effDateOf(c), expiry:c.expiry||null });
}
/* Burn one document off the onboarding allowance (money is drawn by the server
   on each metered call; the document count is ours to report). */
async function migDrawAllowanceDoc(){
  const M=migState();
  if(!(M.allowance&&M.allowance.open&&API_MODE())) return;
  try{ const r=await api('ai/allowance/document','POST',{ count:1 }); M.allowance=r.allowance; renderMigQueue(); }catch(e){}
}

/* ---------- the duplicate decision ----------
   A flagged file is parked, not skipped. The user picks per row:
     skip     — leave it out, the match is recorded on the row
     import   — file it as its own contract anyway
     link     — file it AND link it as an amendment of the contract it matched */
async function migResolveDuplicate(i, action, parentId, relation){
  const M=migState();
  const p=(M.pending||{})[i], q=M.queue[i];
  if(!p||!q) return;
  const step=(st,note)=>{ q.status=st; if(note!=null) q.note=note; renderMigQueue(); };
  if(action==='skip'){
    delete M.pending[i];
    step('skipped', 'left out — matched '+(q.dupes||[]).map(d=>(window.contractRef?contractRef(getContract(d.id)||{id:d.id}):d.id)).join(', '));
    renderMigration(); return;
  }
  step('extracting','importing…');
  try{
    const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(p.file); });
    const c=await migBuildAndSave({ ...p, mime:p.file.type||'application/octet-stream', dataUrl, u:currentUser(),
      link: action==='link'&&parentId ? { parentId, relation:relation||'amendment' } : null });
    migIndexContract(c, p.upload);
    delete M.pending[i];
    q.id=c.id;
    step('saved', action==='link' ? `imported and linked to ${(window.contractRef?contractRef(getContract(parentId)||{id:parentId}):parentId)}` : 'imported anyway');
    await migDrawAllowanceDoc();
    if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
    updateSidebarCounts(); renderMigration();
  }catch(e){ step('error', e.message||'failed'); }
}

/* ---------- the batch pipeline (sequential; UI updates live) ---------- */
async function migProcessFiles(fileList, opts={}){
  if(!canEdit()){ toast(i18t('mig_viewers_no_import'),'err'); return; }
  const M=migState();
  if(M.running){ toast(i18t('mig_batch_running'),'err'); return; }
  let files=[...fileList];
  if(!files.length) return;
  if(files.length>MIG_MAX_FILES){ toast(`Capped at ${MIG_MAX_FILES} files per batch — the rest were skipped`,'err'); files=files.slice(0,MIG_MAX_FILES); }
  // Pre-flight: refresh the budget picture, then estimate and (above the
  // admin's threshold) ask before spending anything.
  await migLoadAiState();
  if(!await migConfirmEstimate(files)) return;
  const batch='B-'+Date.now().toString(36).toUpperCase();
  // Exact bytes still auto-skip (they cannot be anything but the same file),
  // but the row now names the contract it matched so the user can see what
  // happened rather than watching a file silently vanish.
  const byHash=new Map();
  state.contracts.forEach(c=>{ const h=c.upload&&c.upload.fileHash; if(h&&!byHash.has(h)) byHash.set(h,c.id); });
  // The fuzzy index is built from the light register rows — no document bodies.
  M.dupIndex=buildDupIndex(state.contracts);
  M.queue=files.map(f=>({ name:f.name, size:f.size, status:'waiting', note:'', id:null }));
  M.running=true; M.batch=batch; M.cancelled=false; M.ocrError='';
  M.from=opts.from||null; M.startedAt=nowISO();
  /* a new batch: the rows of the last one that never became contracts go,
     and nothing stays chosen that is gone */
  if(_migPick&&/^q:/.test(_migPick)) _migPick=null;
  // Mirror the queue to the server as it goes, so closing the tab leaves a
  // record of which files were dropped and which never landed.
  const syncBatch=async(status)=>{
    if(!API_MODE()) return;
    const rows=M.queue.map(q=>({ name:q.name, size:q.size, status:q.status, note:q.note||'', id:q.id||null }));
    try{
      if(status==='start') await api('batches','POST',{ id:batch, rows });
      else await api('batches/'+batch,'PATCH',{ rows, status });
    }catch(e){ /* the batch must not fail because bookkeeping did */ }
  };
  await syncBatch('start');
  renderMigQueue(); migWireCancel();
  const u=currentUser();
  let saved=0, dupes=0, errors=0, words=0, ocrDocs=0, flagged=0, ocrErrors=0, ocrLastError='', serverQueued=0;
  const byHashRow=new Map();
  for(let i=0;i<files.length;i++){
    if(!M.running){ M.queue.slice(i).forEach(q=>{ if(q.status==='waiting') q.status='cancelled'; }); break; }
    const file=files[i], q=M.queue[i];
    const step=(st,note)=>{ q.status=st; if(note!=null) q.note=note; renderMigQueue();
      if(['saved','duplicate','error','word','dupe','cancelled'].includes(st)) syncBatch();   // settled rows only
    };
    try{
      if(!file.size){ step('error','empty file — 0 bytes, nothing to import'); errors++; continue; }
      if(file.size>uploadMax()){ step('error',`over ${uploadMaxLabel()} — compress or split`); errors++; continue; }
      step('reading');
      const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); });
      const mime=file.type||'application/octet-stream';
      // Legacy .doc is refused before any record exists — no half-contract, no
      // audit entry claiming an import happened. Modern .docx reads for real
      // through extractDocText (js/docx.js) like any PDF.
      const wordKind=detectWordFile(dataUrl, mime, file.name);
      if(wordKind==='doc'){ step('word', WORD_REFUSAL_SHORT); words++; continue; }
      const fileHash=await sha256(dataUrl);
      if(byHash.has(fileHash)){
        const hit=byHash.get(fileHash);
        // `null` means an earlier row in THIS batch reserved the hash but has
        // not saved yet (it may be parked for a duplicate decision). Saying
        // "identical to null" is meaningless, and silently dropping this copy
        // means skipping the parked row loses both — so remember the row.
        if(hit){ q.dupes=[{ id:hit, kind:'exact', distance:0 }];
          step('duplicate','identical to '+(window.contractRef?contractRef(getContract(hit)||{id:hit}):hit)+' — skipped'); }
        else { q.deferredTo=byHashRow.get(fileHash);
          step('duplicate','identical to '+(q.deferredTo!=null?files[q.deferredTo].name:'an earlier file')+' in this batch — skipped'); }
        dupes++; continue; }
      byHash.set(fileHash, null);   // reserve, id filled in once saved
      byHashRow.set(fileHash, i);
      step('extracting');
      let extractedText=await extractDocText(dataUrl, mime);
      // A scan gets OCR'd before anything decides it has "no readable text".
      // The batch stays cancellable between pages, and whatever pages were read
      // before a stop are kept.
      let ocr=null, textSource=wordKind==='docx'?'docx-text':(extractedText.length>=OCR_TEXT_FLOOR?'pdf-text':'none');
      if(ocrNeeded(mime, extractedText)){
        step('ocr','reading the scan…');
        ocr=await ocrDocument(dataUrl, mime, {
          allowance: !!(M.allowance&&M.allowance.open),
          shouldContinue: ()=>M.running,
          onProgress:(done,total,tier)=>step('ocr',`page ${Math.min(done+1,total)} of ${total}${tier==='local'?' · offline recogniser':''}`),
        });
        if(ocr.text){ extractedText=ocr.text.slice(0,EXTRACT_MAX_CHARS); textSource=ocr.textSource; }
        // Count a document as OCR'd only if a page actually came back, and keep
        // the reason it did not — "the renderer could not be loaded" and "this
        // scan is illegible" have completely different remedies, and throwing
        // the distinction away leaves the customer with no way to fix either.
        if(ocr.pages>0) ocrDocs++;
        if(ocr.error){ ocrErrors++; ocrLastError=ocr.error; }
      }
      const manifest=migManifestRow(file.name);
      const seed={};
      if(manifest){ if(manifest.counterparty) seed.counterparty=manifest.counterparty;
        if(manifest.value>0) seed.value=manifest.value;
        if(manifest.expiry) seed.expiryDate=manifest.expiry;
        if(manifest.effective) seed.effectiveDate=manifest.effective;
        if(manifest.type) seed.contractType=manifest.type;
        if(manifest.currency) seed.currency=manifest.currency; }
      let meta=null;
      const readable=extractedText&&extractedText.length>200;
      const serverRead=!!readable && migServerReads();
      if(serverRead){
        step('matching');
        meta=migExtractLocal(extractedText, seed);
        if(isOcrText(textSource)) capConfidenceForOcr(meta);
      }
      else if(readable){
        step(M.aiDown||!API_MODE()||!state.aiConfigured?'matching':'ai');
        meta=await migExtract(extractedText, seed);
        // OCR'd text never yields a high-confidence field without a human
        if(isOcrText(textSource)) capConfidenceForOcr(meta);
      }
      else if(manifest){ meta={ ...seed, confidence:Object.fromEntries(Object.keys(seed).map(k=>[k,'high'])), _source:'manifest' }; }
      const upload={ fileName:file.name, mime, size:file.size, fileHash, uploadedAt:nowISO(),
        uploadedBy:u?.name||'System', extractedText:extractedText||'', textChars:(extractedText||'').length, dataUrl,
        textSource, ocrPages: ocr?ocr.pages:0, ocrSkippedPages: ocr?ocr.skippedPages:0,
        ocrTotalPages: ocr?ocr.totalPages:0, ocrIllegible: ocr?ocr.illegible:0,
        ocrPartialPages: ocr?ocr.partialPages:0 };
      // Near-duplicate signals, computed once and stored on the contract.
      if(readable) await attachDupSignals(upload, extractedText);
      // Then the three fuzzy checks. A flag does NOT silently skip the file —
      // it parks the row for a human decision and the batch carries on.
      const hits=findDuplicates({ fileHash, textFingerprint:upload.textFingerprint, simhash:upload.simhash,
        counterparty:(manifest&&manifest.counterparty)||(meta&&meta.counterparty)||'',
        effectiveDate:(manifest&&manifest.effective)||(meta&&meta.effectiveDate)||null,
        value:(manifest&&manifest.value>0)?manifest.value:Number(meta&&meta.value)||0 }, M.dupIndex);
      if(hits.length && !opts.force){
        q.dupes=hits; q.dupeTotal=hits.totalMatches||hits.length;
        q.pending={ i, batch };                    // everything needed to resume
        M.pending=M.pending||{}; M.pending[i]={ file, seed, manifest, meta, upload, ocr, textSource, readable, extractedText, batch };
        step('dupe', `${q.dupeTotal} possible match${q.dupeTotal===1?'':'es'} — your call`);
        flagged++; continue;
      }
      const c=await migBuildAndSave({ file, mime, dataUrl, manifest, meta, upload, ocr,
        textSource, readable, extractedText, batch, u, link: opts.link, serverRead,
        // propose a parent when this reads like an amendment AND the
        // counterparty matches — a human confirms on the review screen
        suggest: looksLikeAmendment(file.name, extractedText) });
      q.id=c.id; saved++;
      migIndexContract(c, upload); byHash.set(upload.fileHash, c.id);
      if(serverRead){
        /* ON FILE FIRST, then queued: the server reads the contract it holds. */
        let queued=false;
        try{
          await flushSaves();
          const r=await importQueueRead([{ contractId:c.id, batch, text:buildExtractionPayload(extractedText).text,
            seed, ocr:isOcrText(textSource),
            folderAuto: !(manifest&&manifest.folder) && M.defaults.folder==='auto',
            allowance: !!(M.allowance&&M.allowance.open) }]);
          queued=!!(r&&Array.isArray(r.queued)&&r.queued.includes(c.id));
        }catch(e){ queued=false; }
        if(queued){ serverQueued++; step('saved', i18t('mig_reading_server')); continue; }
        /* The server could not take it: read it here, as before, so nothing is
           left half-filed. */
        M.aiDown=true;
        try{
          const m2=await migExtract(extractedText, seed);
          if(isOcrText(textSource)) capConfidenceForOcr(m2);
          c.metadata=m2;
          c.migration={ ...c.migration, reading:undefined, needsReview:migNeedsReview(m2, c), aiSource:m2._source||'heuristic' };
          delete c.migration.reading;
          persist(c);
        }catch(_){}
      }
      else await migDrawAllowanceDoc();
      step('saved', readable?(c.migration.needsReview?'needs review':'complete'):'no readable text — enter details manually');
    }catch(e){ errors++; step('error', e.message||'failed'); }
  }
  M.running=false;
  /* THE WORKER SURVIVES THE FILES AND NOT THE BATCH. Here — and only here —
     ocrRelease is deliberately NOT called per document: the offline recogniser
     reloads its language data on every worker, so terminating it between the
     files of one batch would pay that cost forty times. It is released once
     the batch is over, which the upload and library paths reach immediately
     because one file is the whole run. */
  try{ await ocrRelease(); }catch(e){}
  await migLoadAiState();
  if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
  updateSidebarCounts();
  window.refreshAiUsage&&refreshAiUsage();   // batch just spent Copilot calls — update the meter
  M.cancelled=M.queue.some(q=>q.status==='cancelled');
  await syncBatch(M.cancelled?'stopped':'finished');
  M.ocrError=ocrErrors?ocrLastError:'';
  if(serverQueued) toast(i18tn('mig_server_toast', serverQueued, { n:serverQueued, batch }), 'ok');
  toast(`Batch ${batch}${M.cancelled?' stopped':''}: ${saved} imported${ocrDocs?`, ${ocrDocs} read by OCR`:''}${ocrErrors?`, ${ocrErrors} scan${ocrErrors===1?'':'s'} could not be read (${ocrLastError})`:''}${flagged?`, ${flagged} possible duplicate${flagged===1?'':'s'} waiting for your call`:''}${dupes?`, ${dupes} identical file${dupes===1?'':'s'} skipped`:''}${words?`, ${words} Word file${words===1?'':'s'} refused (save as PDF)`:''}${errors?`, ${errors} failed`:''}${M.cancelled?`, ${M.queue.filter(q=>q.status==='cancelled').length} cancelled`:''}`);
  renderMigration();
}

/* ---------- review flow (human confirms the machine's guesses) ---------- */
function applyReviewedMeta(c, m){
  /* MERGED, NEVER REPLACED (27 Sep 2026) — see metaMergeReviewed
     (js/metadata.js): a key this review did not carry, or left empty, keeps
     the answer already on file. */
  c.metadata=(typeof window.metaMergeReviewed==='function') ? window.metaMergeReviewed(c.metadata, m) : m;
  /* The copies onto the record below read the REVIEW's own answers, as they
     always did: only what a person just confirmed moves the counterparty, the
     value and the dates. */
  if(m.counterparty) c.counterparty=m.counterparty;
  if(m.value!=null&&Number(m.value)>0){ c.value=Number(m.value); if(c.valueType==='none') c.valueType='estimated'; }
  if(m.expiryDate) c.expiry=m.expiryDate;
  /* AND THE EFFECTIVE DATE the reviewer just confirmed, which this copied
     nowhere — see metaEffDateOnto (js/metadata.js). Overwriting, like the
     expiry above it: a person has just confirmed this very value. */
  if(typeof metaEffDateOnto==='function') metaEffDateOnto(c, m, { overwrite: true });
  if(c.migration){ c.migration.needsReview=false; c.migration.blocked=null; delete c.migration.reading; }   // a person's check ends Copilot's wait (runImportQueue leaves it)
  c.lastAction=todayStr();
  logAudit(c,'Migration review',`Extracted details confirmed by ${currentUser()?.name||'reviewer'}`);
  persist(c);
}
async function openMigReview(c, opts={}){
  try{ await ensureFull(c); }catch(e){}
  let meta=c.metadata;
  if(!meta){
    const text=(c.upload&&c.upload.extractedText)||'';
    meta=text.length>200?await migExtract(text,{counterparty:c.counterparty,value:c.value>0?c.value:null,expiryDate:c.expiry}):{ counterparty:c.counterparty||'', value:c.value||0, expiryDate:c.expiry||'', confidence:{} };
  }
  const src=(c.upload&&c.upload.textSource)||(c.migration&&c.migration.textSource);
  if(isOcrText(src)) capConfidenceForOcr(meta);
  openMetaReview(meta, m=>{ applyReviewedMeta(c,m); updateSidebarCounts();
    if(opts.onDone) opts.onDone(true); else renderMigration(); toast(`${(window.contractRef?contractRef(c):c.id)} confirmed`); },
    { saveLabel:opts.saveLabel||'Confirm & save', onCancel:()=>{ if(opts.onDone) opts.onDone(false); },
      ocrNotice: isOcrText(src)?ocrProvenanceLine(c.upload||{}):'' });
}
/* Walk the whole review queue one confirm at a time (same pattern as the
   settings backfill — cancel skips to the next, so a stuck doc never blocks). */
function migReviewAll(){
  const todo=migContracts().filter(c=>c.migration.needsReview);
  /* Every confirmation on this screen was a BARE call, which prints nothing:
     the reader pressed a button, the screen did not visibly change, and the
     product said the same as a dead button would have. Each of these reports
     a real outcome now, in the kind that matches it. */
  if(!todo.length){ toast(i18t('mig_nothing_waiting'),'warn'); return; }
  let done=0;
  const next=()=>{ const c=todo.shift();
    if(!c){ renderMigration(); toast(i18tn('mig_review_pass_done',done,{n:done}),'ok'); return; }
    openMigReview(c,{ saveLabel:`Save & next (${todo.length} left)`, onDone:ok=>{ if(ok) done++; next(); } });
  };
  next();
}
/* Re-run Copilot over contracts that only got the pattern-matcher (e.g. the batch
   hit the 15-minute Copilot rate limit) — auto-applies, keeps the review flag
   honest, never overwrites human-confirmed metadata. */
async function migRerunAi(){
  const M=migState();
  if(!API_MODE()||!state.aiConfigured){ toast(i18t('mig_connect_key'),'err'); return; }
  M.aiDown=false;
  const todo=migContracts().filter(c=>c.migration.needsReview && c.migration.aiSource!=='ai' && !(c.metadata&&c.metadata.confirmedAt));
  if(!todo.length){ toast(i18t('mig_no_pattern_left')); return; }
  const btn=document.getElementById('mig-rerun'); if(btn){ btn.disabled=true; }
  let done=0;
  for(const c of todo){
    if(migState().aiDown) break;
    if(btn) btn.textContent=`Re-running Jambo… ${done}/${todo.length}`;
    try{ await ensureFull(c); }catch(e){}
    const text=(c.upload&&c.upload.extractedText)||'';
    if(text.length<200) continue;
    const meta=await migExtract(text, c.counterparty?{counterparty:c.counterparty}:null);
    if(meta._source!=='ai') break;
    if(isOcrText((c.upload&&c.upload.textSource)||(c.migration&&c.migration.textSource))) capConfidenceForOcr(meta);
    /* A CORRECTION SURVIVES THE RE-RUN (the owner's list, 27 Sep 2026): this
       replaced the whole reading, so a value typed in through the review sheet
       or given by the manifest — both stamped 'high' — was lost to Copilot's.
       This contract was read only by the pattern-matcher, whose own answers are
       'low'; a 'high' here is somebody's word, and it stays. */
    const was=(c.metadata&&typeof c.metadata==='object')?c.metadata:{};
    const wasConf=(was.confidence&&typeof was.confidence==='object')?was.confidence:{};
    meta.confidence=Object.assign({}, meta.confidence||{});
    for(const [k,lvl] of Object.entries(wasConf)){
      if(lvl!=='high'||was[k]==null||was[k]==='') continue;
      meta[k]=was[k]; meta.confidence[k]='high';
      if(was.sourceSpans&&was.sourceSpans[k]!=null){ meta.sourceSpans=Object.assign({}, meta.sourceSpans||{}); meta.sourceSpans[k]=was.sourceSpans[k]; }
    }
    c.metadata=meta;
    if(meta.counterparty&&!c.counterparty) c.counterparty=meta.counterparty;
    if(meta.value&&!(Number(c.value)>0)){ c.value=Number(meta.value)||0; if(c.valueType==='none') c.valueType='estimated'; }
    if(meta.expiryDate&&!c.expiry) c.expiry=meta.expiryDate;
    /* The effective date too, fill only like the expiry above it — see
       metaEffDateOnto (js/metadata.js). */
    if(typeof metaEffDateOnto==='function') metaEffDateOnto(c, meta);
    logAudit(c,'Jambo extraction','Re-ran Jambo metadata extraction over the stored document text');
    c.migration.aiSource='ai';
    c.migration.needsReview=migNeedsReview(meta, c);
    persist(c); done++;
  }
  if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
  toast(migState().aiDown
    ? i18t('mig_rerun_stopped',{why:migState().aiDownMsg||'',n:done})
    : i18tn('mig_rerun_done',done,{n:done}),
    migState().aiDown ? 'warn' : 'ok');
  window.refreshAiUsage&&refreshAiUsage();
  updateSidebarCounts(); renderMigration();
}

/* ---------- review-sheet round trip (Excel is where legal teams live) ---------- */
function migExportSheet(){
  const rows=migContracts();
  if(!rows.length){ toast(i18t('mig_nothing_migrated'),'err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','File','Name','Counterparty','Contract type','Stream','Status',`Value (${jxCurrency()})`,'Currency','Effective date','Expiry date','Renewal','Notice (days)','Governing law','Payment terms','Category','Retention (%)','Retention release (days)','Warranty (months)','Our liability','Price changes','Needs review','Low-confidence fields'];
  const body=rows.map(c=>{ const m=c.metadata||{}, conf=m.confidence||{};
    const low=Object.keys(conf).filter(k=>conf[k]==='low').join('; ');
    return [(window.contractRef?contractRef(c):c.id), c.upload&&c.upload.fileName||'', c.name, c.counterparty||'', m.contractType||'',
      FOLDERS[c.folder]?.name||'', statusLabel(c.status), isMonetary(c)?(c.value||0):'', m.currency||'',
      m.effectiveDate||'', m.expiryDate||c.expiry||'', m.renewalType||'', m.noticePeriodDays||'',
      m.governingLaw||'', m.paymentTerms||'', m.category||'', m.retentionPct||'', m.retentionReleaseDays||'',
      m.warrantyMonths||'', m.liabilityCapped||'', m.priceReview||'',
      c.migration.needsReview?'YES':'', low].map(esc).join(','); });
  downloadFile('hati-migration-review-sheet.csv',[head.map(esc).join(','),...body].join('\n'),'text/csv');
  toast(`Review sheet exported — ${rows.length} contracts. Correct it in Excel, then import it back.`);
}
async function migImportSheet(file){
  if(!canEdit()){ toast(i18t('mig_viewers_no_import2'),'err'); return; }
  const rows=parseCsv(await file.text());
  if(rows.length<2){ toast(i18t('mig_csv_no_rows'),'err'); return; }
  const head=rows[0].map(h=>String(h||'').toLowerCase().replace(/[^a-z0-9()]/g,''));
  const col=n=>head.indexOf(n);
  const iId=col('id');
  if(iId<0){ toast(i18t('mig_needs_id_col'),'err'); return; }
  const idx={ name:col('name'), cp:col('counterparty'), type:col('contracttype'), stream:col('stream'),
    status:col('status'), value:col('value(kes)'), currency:col('currency'), eff:col('effectivedate'),
    exp:col('expirydate'), renewal:col('renewal'), notice:col('notice(days)'), law:col('governinglaw'), pay:col('paymentterms'),
    cat:col('category'), retpct:col('retention()'), retrel:col('retentionrelease(days)'),
    warm:col('warranty(months)'), liab:col('ourliability'), price:col('pricechanges') };
  const g=(r,i)=>i>=0?String(r[i]||'').trim():'';
  let updated=0, missed=0;
  for(const r of rows.slice(1)){
    const ref=g(r,iId), c=(state.contracts||[]).find(x=>x.id===ref||x.contractNo===ref); if(!c||!c.migration){ missed++; continue; }
    const m=Object.assign({}, c.metadata||{});
    m.confidence=Object.assign({}, m.confidence||{});
    const set=(k,v)=>{ if(v!==''){ m[k]=v; m.confidence[k]='high'; } };
    set('counterparty', g(r,idx.cp)); set('contractType', g(r,idx.type));
    set('effectiveDate', migParseDate(g(r,idx.eff))||''); set('expiryDate', migParseDate(g(r,idx.exp))||'');
    const val=migParseValue(g(r,idx.value)); if(val>0){ m.value=val; m.confidence.value='high'; }
    set('currency', g(r,idx.currency));
    const ren=g(r,idx.renewal).toLowerCase(); if(['auto-renew','fixed','evergreen','unknown'].includes(ren)){ m.renewalType=ren; m.confidence.renewalType='high'; }
    const not=Number(g(r,idx.notice)); if(Number.isFinite(not)&&not>0){ m.noticePeriodDays=not; m.confidence.noticePeriodDays='high'; }
    set('governingLaw', g(r,idx.law)); set('paymentTerms', g(r,idx.pay));
    // closed lists are checked against the list — a typo in a spreadsheet cell
    // must not become a category nothing can group by
    const inList=(v,list)=>list.includes(String(v||'').trim().toLowerCase());
    const cat=g(r,idx.cat).toLowerCase();
    if(inList(cat,['customer','supplier','employment','lease','licence','partner','funding','other'])){ m.category=cat; m.confidence.category='high'; }
    const liab=g(r,idx.liab).toLowerCase();
    if(inList(liab,['capped','uncapped','unclear'])){ m.liabilityCapped=liab; m.confidence.liabilityCapped='high'; }
    const pr=g(r,idx.price).toLowerCase();
    if(inList(pr,['nochange','ceiling','indexed','open','unclear'])){ m.priceReview=pr; m.confidence.priceReview='high'; }
    for(const [k,i] of [['retentionPct',idx.retpct],['retentionReleaseDays',idx.retrel],['warrantyMonths',idx.warm]]){
      const n=Number(g(r,i)); if(Number.isFinite(n)&&n>0){ m[k]=n; m.confidence[k]='high'; }
    }
    m.confirmedAt=nowISO(); m.confirmedBy=(currentUser()?.name||'')+' (sheet import)';
    applyReviewedMeta(c, m);
    if(g(r,idx.name)) c.name=g(r,idx.name);
    const st=migParseStatus(g(r,idx.status)); if(st) c.status=st;
    const fo=migParseFolder(g(r,idx.stream)); if(fo) c.folder=fo;
    persist(c); updated++;
  }
  if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
  toast(`Sheet imported — ${updated} contract${updated===1?'':'s'} updated${missed?`, ${missed} rows didn’t match a migrated contract`:''}`);
  updateSidebarCounts(); renderMigration();
}

/* ============================================================ RENDER */
/* ═══ IMPORT, "THE SAP WAY" AS DRAWN (round 22 of the redesign; the owner's
   yes of 18 Oct 2026 to build every drawn part — "Check all 3" borrows option
   1's "One at a time" view) ═══════════════════════════════════════════════
   · THE HEAD: the page's name, what the batch is ("Old contracts from <the
     folder>", started <day> by <you>, N files) and Choose files… (migPaintHead).
   · FIVE FIGURES in the white band, each a door narrowing the list: Files ·
     Filed · To check · Duplicate? · No readable text (migKpis, one reading).
   · THE DROP STRIP and its three labelled boxes: Import as · File under · A list
     of what is in them; the cost said in Jambo calls before anything is read.
   · ONE TABLE, "Files in this batch · the ones that need you first": a row per
     file — the contracts it made AND the files that did not become one this
     sitting (a duplicate waiting for a call, a file refused) — read by ONE
     reading, migRows. A press CHOOSES a row; Jambo's panel says it.
   · CHECK ALL N: the one-at-a-time view — the file's own words on the left,
     numbered where each fact was found, the facts to file on the right, Jambo
     saying why he was not sure, next and previous (migCheckHtml).
   · JAMBO'S PANEL is the shared one (jlFrame, js/views/inspector.js): his
     head, the chosen file's facts ready to file, the ask box and its hint.
   Nothing here spends a call or files anything until a press. */

/* ---- THE FIGURES ARE DOORS (each narrows the list to what it counts) ---- */
let _migShow = 'all';
const MIG_SHOWS = ['all', 'filed', 'check', 'dupe', 'none'];
/* "9 of 24 shown · Show all 24": every row that needs you, then the rest up
   to nine; the cap is said, never a silent trim */
const MIG_ROWS_SHOWN = 9;
let _migAll = false;
const MIG_ST_ORDER = { check:0, dupe:1, none:2, failed:3, reading:4, skipped:5, filed:6 };
const MIG_ST_TONE = { check:'amber', dupe:'amber', none:'ruby', failed:'ruby', reading:'steel', skipped:'grey', filed:'green' };
const MIG_NEEDS = ['check', 'dupe', 'none', 'failed'];
function migShowPass(r, show){
  const k = show || _migShow;
  if (k === 'all') return true;
  return !!(r && r.st && r.st.k === k);
}
function migShowSet(k){ _migShow = (!MIG_SHOWS.includes(k) || k === _migShow) ? 'all' : k; _migAll = false; renderMigration(); }

/* ---- ONE READING OF WHERE EACH FILE STANDS ---- */
const migLinkPending = c => !!(c && c.linkSuggestions && c.linkSuggestions.length && !c.parentId && !c.linkConfirmed);
const migRefOf = id => { const c = getContract(id); return (window.contractRef ? contractRef(c || { id }) : id); };
/* the word for one of the facts a file is filed with */
const MIG_FACT_WORD = { contractType:'mig_fw_title', counterparty:'mig_fw_party', effectiveDate:'mig_fw_starts', expiryDate:'mig_fw_ends', value:'mig_fw_value' };
function migNoneWhy(c){
  const mg = c.migration || {}, u = c.upload || {};
  if (mg.ocrTotalPages && Number(u.ocrIllegible) > 0) return i18t('mig_why_faint');
  if (mg.ocrTotalPages) return i18t('mig_why_none_scan');
  return i18t('mig_why_none');
}
function migLinkWhy(c){ const s = (c.linkSuggestions || [])[0]; return s ? i18t('mig_why_link', { ref:migRefOf(s.id) }) : ''; }
/* why a file waits to be checked: the first fact missing, else read only by
   HaTi's own rules, else the first fact read without certainty */
function migCheckWhy(c){
  const mg = c.migration || {};
  const by = Object.fromEntries(migSideFacts(c).map(f => [f.k, f]));
  const scan = (typeof isOcrText === 'function') && isOcrText(mg.textSource);
  const parts = [];
  if (scan) parts.push(i18t('mig_why_scan'));
  const miss = ['expiryDate', 'counterparty', 'value', 'effectiveDate', 'contractType'].find(k => by[k] && by[k].missing);
  const uns = ['value', 'expiryDate', 'counterparty', 'effectiveDate', 'contractType'].find(k => by[k] && by[k].unsure);
  if (miss) parts.push(i18t('mig_why_missing_' + miss));
  else if (!scan && mg.aiSource !== 'ai' && mg.needsReview) parts.push(i18t('mig_why_rules'));
  else if (uns) parts.push(i18t('mig_why_unsure', { what:i18t(MIG_FACT_WORD[uns]) }));
  else if (mg.needsReview && !scan) parts.push(i18t('mig_why_look'));
  if (migLinkPending(c)) parts.push(migLinkWhy(c));
  return parts.join(' · ');
}
function migStateOf(c){
  const mg = c.migration || {};
  if (mg.reading === 'queued') return { k:'reading', why:i18t('mig_why_reading') };
  if (mg.blocked) return { k:'none', why:migNoneWhy(c) };
  if (mg.needsReview || migLinkPending(c)) return { k:'check', why:migCheckWhy(c) };
  return { k:'filed', why:'' };
}
/* a file that matched one HaTi already has, in words */
const MIG_DUP_WORD = { exact:'mig_dup_exact', text:'mig_dup_text', near:'mig_dup_near', related:'mig_dup_related', metadata:'mig_dup_meta' };
function migDupeWhy(q, left){
  const M = migState();
  if (q.deferredTo != null && M.queue[q.deferredTo]) return i18t('mig_dup_in_batch', { file:M.queue[q.deferredTo].name }) + ' · ' + i18t('mig_dup_left');
  const d = (q.dupes || [])[0];
  if (!d) return q.note || '';
  const w = i18t(MIG_DUP_WORD[d.kind] || 'mig_dup_near', { ref:migRefOf(d.id) });
  return left ? w + ' · ' + i18t('mig_dup_left') : w;
}
function migQueueState(q){
  const s = q.status;
  if (s === 'dupe') return { k:'dupe', why:migDupeWhy(q) };
  if (s === 'duplicate') return { k:'skipped', why:migDupeWhy(q, true) };
  if (s === 'skipped') return { k:'skipped', why:q.note || '' };
  if (s === 'error') return { k:'failed', why:q.note || '' };
  if (s === 'word') return { k:'failed', why:i18t('mig_why_word') };
  if (s === 'cancelled') return { k:'skipped', why:i18t('mig_why_cancelled') };
  return { k:'reading', why:q.note || i18t(s === 'waiting' ? 'mig_why_waiting' : 'mig_why_reading_now') };
}
/* the stream a file is filed under: the list's word, the read type, the
   batch's choice — ONE reading, migBuildAndSave's and the waiting file's */
function migFolderFor(manifest, meta){
  const M = migState();
  return (manifest && manifest.folder) || folderFromType(meta && meta.contractType)
    || (M.defaults.folder !== 'auto' ? M.defaults.folder : null) || 'corp';
}
/* EVERY FILE OF THE BATCH, the ones that need you first: the contracts the
   imports made, and this sitting's files that did not become one */
function migRows(){
  const M = migState(), out = [];
  (M.queue || []).forEach((q, i) => { if (!q.id) out.push({ key:'q:' + i, q, i, file:q.name, st:migQueueState(q) }); });
  migContracts().forEach(c => out.push({ key:c.id, c, file:(c.upload && c.upload.fileName) || c.name || c.id, st:migStateOf(c) }));
  out.forEach((r, n) => { r.n = n; });
  return out.sort((a, b) => (MIG_ST_ORDER[a.st.k] - MIG_ST_ORDER[b.st.k]) || (a.n - b.n));
}
function migRowByKey(key){ return key ? (migRows().find(r => r.key === key) || null) : null; }
function migKpis(){
  const rows = migRows(), cs = migContracts();
  const n = k => rows.filter(r => r.st.k === k).length;
  return { files:rows.length, filed:n('filed'), check:n('check'), dupe:n('dupe'), none:n('none'), failed:n('failed'), reading:n('reading'),
    /* the contracts' own counts, as before */
    total:cs.length, agreements:cs.filter(c => !c.parentId).length,
    linkPending:cs.filter(migLinkPending).length,
    complete:cs.filter(migComplete).length,
    review:cs.filter(c => c.migration.needsReview).length,
    blocked:cs.filter(c => c.migration.blocked).length };
}
/* the rows the list shows: a door's own kind whole; otherwise everything that
   needs you, then the rest up to nine — "Show all N" lifts the cap */
function migShown(rows){
  const pass = rows.filter(r => migShowPass(r));
  if (_migShow !== 'all' || _migAll) return { list:pass, of:rows.length };
  const list = [];
  for (const r of rows) if (MIG_NEEDS.includes(r.st.k) || list.length < MIG_ROWS_SHOWN) list.push(r);
  return { list, of:rows.length };
}


/* ---- THE HEAD: what the batch is, who started it and when ---- */
function migDayWord(iso){
  const d = new Date(String(iso || ''));
  if (isNaN(d.getTime())) return '';
  /* "Fri 16 Oct", as drawn: weekday, day and month, the year only when it is not this one */
  const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
  const part = o => { try { return d.toLocaleDateString(loc, o).replace(/\.$/, ''); } catch (_){ return ''; } };
  const bits = [part({ weekday:'short' }), part({ day:'numeric' }), part({ month:'short' })];
  if (d.getFullYear() !== new Date().getFullYear()) bits.push(String(d.getFullYear()));
  return bits.filter(Boolean).join(' ');
}
function migHeadFacts(){
  const rows = migRows(); if (!rows.length) return '';
  const M = migState(), me = (typeof currentUser === 'function') ? currentUser() : null;
  const cs = migContracts().filter(c => c.migration && c.migration.importedAt);
  const firstC = cs.slice().sort((a, b) => String(a.migration.importedAt).localeCompare(String(b.migration.importedAt)))[0];
  let at = firstC ? firstC.migration.importedAt : '', by = firstC ? firstC.migration.importedBy : '';
  if (M.startedAt && (!at || String(M.startedAt) < String(at))){ at = M.startedAt; by = me ? me.name : by; }
  const froms = new Set(cs.map(c => c.migration.from || '').concat(M.queue.length ? [M.from || ''] : []));
  const from = froms.size === 1 ? [...froms][0] : '';
  const who = (me && by && String(by) === String(me.name)) ? i18t('mig_head_you') : (by || '');
  const bits = [from ? i18t('mig_head_from', { from }) : i18t('mig_head_old')];
  const day = migDayWord(at);
  if (day) bits.push(who ? i18t('mig_head_started_by', { day, who }) : i18t('mig_head_started', { day }));
  bits.push(i18tn('mig_head_files', rows.length, { n:rows.length }));
  return bits.join(' · ');
}
/* painted into the page head's two slots (PAGE_HEAD_PAINT.migration) */
function migPaintHead(){
  if (typeof document === 'undefined') return;
  const f = document.getElementById('page-head-facts'), a = document.getElementById('page-head-acts');
  if (f) f.textContent = migHeadFacts();
  if (a) a.innerHTML = canEdit() ? `<button type="button" class="ui-btn ui-btn-primary" id="mig-choose">${esc(i18t('mig_choose_dots'))}</button>` : '';
}

/* ---- THE FIVE FIGURES, in the white band ---- */
function migBandHtml(){
  const k = migKpis();
  const fig = (show, label, n, tone) => {
    const door = n > 0, on = door && show !== 'all' && _migShow === show;
    const num = `<span class="mig-kpi-n${n && tone ? ' is-' + tone : ''}">${n}</span>`;
    const lab = `<span class="mig-kpi-l">${esc(label)}</span>`;
    return door
      ? `<button type="button" class="mig-kpi${on ? ' is-on' : ''}" data-mig-show="${show}" aria-pressed="${on ? 'true' : 'false'}" title="${esc(i18t(show === 'all' ? 'mig_show_all' : 'mig_show_only', { what:label }))}">${lab}${num}</button>`
      : `<div class="mig-kpi-card">${lab}${num}</div>`;
  };
  return `<div id="mig-kpis" class="mig-kpis">
    ${fig('all', i18t('mig_k_files'), k.files)}
    ${fig('filed', i18t('mig_k_filed'), k.filed, 'green')}
    ${fig('check', i18t('mig_k_check'), k.check, 'amber')}
    ${fig('dupe', i18t('mig_k_dupe'), k.dupe, 'amber')}
    ${fig('none', i18t('mig_no_text'), k.none, 'ruby')}
  </div>`;
}

/* ---- THE DROP STRIP: what it takes, what reading costs, said before ---- */
function migCostLine(){
  const M = migState();
  const head = i18t('mig_drop_sub', { max:MIG_MAX_FILES });
  if (!API_MODE()) return head + ' ' + i18t('mig_cost_static');
  if (!state.aiConfigured || M.aiDown) return head + ' ' + i18t('mig_cost_rules');
  const aw = migAllowanceWords();
  if (aw.done) return head + ' ' + i18t('mig_allow_done');
  return head + ' ' + i18t('mig_cost_calls', { from:aw.said }) + ' ' + i18t('mig_cost_before');
}
function migDropCardHtml(){
  const M = migState();
  /* "Let Jambo suggest", as drawn, where Jambo reads them; HaTi's own rules route by the type they read */
  const folderOpts = folderOptionsHtml(M.defaults.folder || 'auto', true)
    .replace(/(<option value="auto"[^>]*>)[^<]*/, '$1' + esc(i18t(API_MODE() && state.aiConfigured ? 'mig_auto_jambo' : 'fo_auto_route')));
  const statusOpts = [['Signed', i18t('mig_as_signed')], ['Under Review', i18t('mig_as_review')], ['Draft', i18t('mig_as_draft')]]
    .map(([v, l]) => `<option value="${v}" ${M.defaults.status === v ? 'selected' : ''}>${esc(l)}</option>`).join('');
  const list = M.manifest
    ? `<span class="mig-list-name" title="${esc(M.manifestName)}">${esc(M.manifestName)}</span><span class="mig-list-n">${esc(i18t('mig_list_matched', { n:M.manifest.filter(r => r.matchedId).length, of:M.manifest.length }))}</span>`
    : '';
  return `<section class="mig-card mig-drop-card">
    <div id="mig-drop" role="button" tabindex="0" aria-label="${esc(i18t('mig_drop_h'))}">
      <span class="mig-drop-i" aria-hidden="true">${icon('upload', 'w-5 h-5')}</span>
      <span class="mig-drop-w"><b>${esc(i18t('mig_drop_h'))}</b><span id="mig-cost" class="mig-drop-s">${esc(migCostLine())}</span></span>
      <span class="ui-btn mig-drop-b" aria-hidden="true">${esc(i18t('mig_choose_files'))}</span>
    </div>
    <div class="mig-opts">
      <label class="mig-opt"><span class="mig-opt-l">${esc(i18t('mig_import_as'))}</span><select id="mig-status">${statusOpts}</select></label>
      <label class="mig-opt"><span class="mig-opt-l">${esc(i18t('mig_file_under'))}</span><select id="mig-folder">${folderOpts}</select></label>
      <div class="mig-opt mig-opt-list"><span class="mig-opt-l">${esc(i18t('mig_list_l'))}</span>
        <div class="mig-list-box">${list}<button type="button" id="mig-manifest-btn" class="mig-link" title="${esc(i18t('mig_list_csv'))}">${esc(i18t(M.manifest ? 'mig_list_replace' : 'mig_list_load'))}</button><span class="mig-list-sep" aria-hidden="true">·</span><button type="button" id="mig-manifest-tpl" class="mig-link">${esc(i18t('mig_list_empty'))}</button></div>
        <input id="mig-manifest-file" type="file" accept=".csv" style="display:none"></div>
    </div>
    ${API_MODE() ? '' : `<p class="mig-note">${esc(i18t('mig_static_mode'))}</p>`}
    ${migUnfinishedHtml()}
    ${M.manifestError ? `<div class="mig-warn is-ruby"><strong>${migEsc(M.manifestError.name)}</strong> was not loaded — ${migEsc(M.manifestError.reason)}.${M.manifest ? ` Still using <strong>${migEsc(M.manifestName)}</strong>.` : ''}</div>` : ''}
    ${M.manifest ? `<div class="mig-warn is-steel">${i18t('mig_manifest')} <strong>${migEsc(M.manifestName)}</strong> loaded — ${M.manifest.length} rows. Files are matched by filename; manifest details (counterparty, dates, value, stream, status) take precedence over extraction.${M.manifestDateOrder && !M.manifestDateOrder.proven ? ` Slashed dates are being read as <strong>${M.manifestDateOrder.order === 'mdy' ? 'month/day/year' : 'day/month/year'}</strong>${M.manifestDateOrder.conflict ? ' — this file contains both orders, so check them' : ' (nothing in the file settles it either way)'}.` : ''} The manifest lives in this session only — re-load it after a refresh to re-run reconciliation.</div>` : ''}
    ${(M.manifestProblems && M.manifestProblems.length) ? `<div class="mig-warn is-amber">
      <div style="font-weight:var(--w-strong);margin-bottom:var(--s-1)">${M.manifestProblems.length} value${M.manifestProblems.length === 1 ? '' : 's'} in the manifest could not be read — those cells were left empty rather than guessed:</div>
      <ul style="margin:0;padding-left:var(--s-4);line-height:1.6">${M.manifestProblems.slice(0, 12).map(p => `<li><strong>${migEsc(p.label)}</strong> · ${migEsc(p.field)}: ${migEsc(p.message)}</li>`).join('')}</ul>
      ${M.manifestProblems.length > 12 ? `<div style="margin-top:var(--s-1)">…and ${M.manifestProblems.length - 12} more.</div>` : ''}
    </div>` : ''}
  </section>`;
}

/* ---- ONE TABLE: "Files in this batch · the ones that need you first" ---- */
function migWhatOf(r){
  if (r.c){
    const c = r.c, m = c.metadata || {};
    if (c.migration && c.migration.blocked && !m.contractType && !c.counterparty) return i18t('mig_nothing_read');
    return [m.contractType || '', c.counterparty || m.counterparty || ''].filter(Boolean).join(' · ') || i18t('mig_nothing_found');
  }
  const p = (migState().pending || {})[r.i];
  const m = p && p.meta;
  return m ? [m.contractType || '', m.counterparty || ''].filter(Boolean).join(' · ') : '';
}
/* a cell that says a fact, or that Jambo was not sure of it (amber) */
const migCellNotSure = () => `<span class="mig-ns">${esc(i18t('mig_not_sure'))}</span>`;
function migValueCell(r){
  if (!r.c) return '—';
  const c = r.c, need = r.st.k === 'check';
  if (!isMonetary(c)) return '—';
  const f = migSideFacts(c).find(x => x.k === 'value');
  if (need && f && (f.missing || f.unsure)) return migCellNotSure();
  return Number(c.value) > 0 ? esc(window.fmtMoneyShortOf ? fmtMoneyShortOf(c) : fmtMoneyShort(c.value)) : '—';
}
function migEndsCell(r){
  if (!r.c) return '—';
  const c = r.c, m = c.metadata || {}, need = r.st.k === 'check';
  const nda = (typeof ndaClean === 'function') ? ndaClean(c.nda) : null;
  if (nda && nda.ends){
    let mon = nda.ends; try { mon = new Date(nda.ends + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { month:'short', year:'numeric' }); } catch (_){}
    return esc(i18t('mig_ends_secret', { d:mon }));
  }
  const f = migSideFacts(c).find(x => x.k === 'expiryDate');
  if (need && f && (f.missing || f.unsure)) return migCellNotSure();
  if (m.renewalType === 'evergreen' && !(c.expiry || m.expiryDate)) return esc(i18t('mig_renews'));
  const iso = c.expiry || m.expiryDate;
  return iso ? esc(migDay(iso)) : '—';
}
/* the six marks of a file that is waiting for a call, read off what it WOULD
   be filed with — the same gates (migGates), nothing written */
function migPendingGates(r){
  const p = (migState().pending || {})[r.i]; if (!p) return null;
  const m = p.meta || {};
  return migGates({ upload:p.upload || {}, counterparty:(p.manifest && p.manifest.counterparty) || m.counterparty || '',
    folder:migFolderFor(p.manifest, m), expiry:(p.manifest && p.manifest.expiry) || m.expiryDate || null,
    metadata:m, migration:{ needsReview:true } });
}
function migDotsHtml(gates){
  return `<span class="mig-dots">${gates.map(g => `<span class="mig-dot${g.ok ? ' is-ok' : ''}" title="${esc(g.label)}${g.ok ? '' : ' — ' + esc(i18t('mig_side_mark_no'))}"></span>`).join('')}</span>`;
}
function migStateCell(r){
  const tone = MIG_ST_TONE[r.st.k] || 'grey';
  const word = i18t('mig_st_' + r.st.k);
  const pill = `<span class="mig-st is-${tone}">${r.st.k === 'reading' && typeof busyHtml === 'function' ? busyHtml(word) : esc(word)}</span>`;
  const sub = r.st.k === 'filed' && r.c
    ? `<button type="button" class="mig-ref" data-open="${esc(r.c.id)}" title="${esc(i18t('mig_open_ref'))}">${window.refHtml ? refHtml(r.c) : esc(r.c.id)}</button>`
    : (r.st.why ? `<span class="mig-st-why" title="${esc(r.st.why)}">${esc(r.st.why)}</span>` : '');
  return pill + sub;
}
/* the stream a row is (or would be) filed under */
function migStreamOf(r){
  if (r.c) return streamLabel(r.c);
  const p = r.st.k === 'dupe' ? (migState().pending || {})[r.i] : null;
  return p ? streamLabel({ folder:migFolderFor(p.manifest, p.meta) }) : '—';
}
function migRowHtml(r){
  const gates = r.c ? migGates(r.c) : (r.st.k === 'dupe' ? migPendingGates(r) : null);
  const on = r.key === _migPick;
  return `<tr data-row="${esc(r.key)}" tabindex="0" class="mig-tr is-${r.st.k}${on ? ' is-picked' : ''}" aria-selected="${on ? 'true' : 'false'}">
    <td class="mig-td-f"><span class="mig-fn" title="${esc(r.file)}">${esc(r.file)}</span><span class="mig-fr">${esc(migWhatOf(r)) || '&nbsp;'}</span></td>
    <td class="mig-td-s">${esc(migStreamOf(r))}</td>
    <td class="mig-td-v">${migValueCell(r)}</td>
    <td class="mig-td-e">${migEndsCell(r)}</td>
    <td class="mig-td-d">${gates ? migDotsHtml(gates) : '—'}</td>
    <td class="mig-td-st">${migStateCell(r)}</td>
  </tr>`;
}
function migListHtml(){
  const M = migState(), rows = migRows(), k = migKpis();
  if (!rows.length) return `<div class="mig-empty">${esc(i18t('mig_none_yet'))}</div>`;
  const sh = migShown(rows);
  const batches = new Set(migContracts().map(c => c.migration && c.migration.batch).filter(Boolean));
  if (M.batch && M.queue.length) batches.add(M.batch);
  const settled = M.queue.filter(q => ['saved', 'duplicate', 'error', 'word', 'skipped', 'dupe'].includes(q.status)).length;
  const heur = migContracts().filter(c => c.migration.needsReview && c.migration.aiSource !== 'ai' && !c.migration.blocked).length;
  return `<div class="mig-lh">
      <h3 class="mig-lh-t">${esc(i18t(batches.size > 1 ? 'mig_list_h_all' : 'mig_list_h'))}</h3>
      <span class="mig-lh-n">${rows.length}</span>
      <span class="mig-lh-s">${esc(i18t('mig_list_sub'))}</span>
      <span class="mig-sp"></span>
      <button type="button" id="mig-sheet" class="ui-btn ui-btn-sm" aria-haspopup="menu" aria-expanded="false">${esc(i18t('mig_sheet'))}</button>
      ${canEdit() && heur && API_MODE() && state.aiConfigured ? `<button type="button" id="mig-rerun" class="ui-btn ui-btn-sm" title="${esc(i18tn('mig_rerun_cost', heur, { n:heur }))}">${esc(i18tn('mig_rerun_n', heur, { n:heur }))}</button>` : ''}
      ${canEdit() && k.check ? `<button type="button" id="mig-check-all" class="ui-btn ui-btn-sm ui-btn-primary">${esc(i18tn('mig_check_all', k.check, { n:k.check }))}</button>` : ''}
    </div>
    ${M.running ? `<div class="mig-run">${typeof busyHtml === 'function' ? busyHtml(i18t('mig_running', { n:settled, of:M.queue.length })) : esc(i18t('mig_running', { n:settled, of:M.queue.length }))}<span class="mig-sp"></span><button type="button" id="mig-cancel" class="ui-btn ui-btn-sm">${esc(i18t('mig_stop_after_current'))}</button></div>` : ''}
    ${M.ocrError ? `<div class="mig-warn is-amber">A scanned document could not be read: ${migEsc(M.ocrError)}. Those files were imported with no text — check each one and type its details, or fix the reader and read them again.</div>` : ''}
    ${M.aiDown ? `<div class="mig-warn is-amber">${migEsc(M.aiDownMsg || 'Jambo unavailable')} — the rest of the files were read by HaTi's own rules and wait for you to check them.</div>` : ''}
    <div class="table-scroll">
      <table class="mig-table">
        <thead><tr>
          <th>${esc(i18t('mig_col_file'))}</th><th>${esc(i18t('mig_col_stream'))}</th><th class="mig-td-v">${esc(i18t('mig_col_value'))}</th>
          <th>${esc(i18t('mig_col_ends'))}</th><th>${esc(i18t('mig_col_done'))}</th><th>${esc(i18t('mig_col_state'))}</th>
        </tr></thead>
        <tbody>${sh.list.map(migRowHtml).join('')}</tbody>
      </table>
    </div>
    <div class="mig-foot"><span>${esc(i18t('mig_shown_n', { n:sh.list.length, of:sh.of }))}</span>${sh.list.length < sh.of ? `<span class="mig-list-sep" aria-hidden="true">·</span><button type="button" class="mig-link" data-mig-all>${esc(i18tn('mig_show_all_n', sh.of, { n:sh.of }))}</button>` : ''}</div>`;
}
function migListPaint(){
  const host = document.getElementById('mig-list'); if (!host) return;
  host.innerHTML = migListHtml();
  migWireCancel();
}
function migBandPaint(){
  const host = document.getElementById('mig-band'); if (!host || _migCheck) return;
  host.innerHTML = migBandHtml();
}
/* during a batch the page moves as each file settles: the list, the figures,
   the cost line and the head — never the drop strip's own boxes */
function renderMigQueue(){
  if (typeof document === 'undefined' || !document.querySelector('.mig-page')) return;
  migListPaint(); migBandPaint(); migPaintHead();
  const cost = document.getElementById('mig-cost'); if (cost) cost.textContent = migCostLine();
  if (!_migPick && !_migCheck) migSidePaint();
}
/* The three-way duplicate decision, said in Jambo's panel for the chosen file.
   A skipped exact match also lists the contract it matched, so nothing ever
   silently vanishes. */
function migDupeRowHtml(q, i){
  if(!q.dupes||!q.dupes.length) return '';
  const M=migState();
  const pending = q.status==='dupe' && (M.pending||{})[i];
  const hit=d=>{ const c=getContract(d.id);
    return `<span class="mig-hit"><b class="hati-ref">${(window.contractRef&&c?contractRef(c):d.id)}</b>
      <span class="mig-hit-n">${migEsc(c?c.name:'')}</span>
      <span class="mig-hit-k">${DUP_LABEL[d.kind]}${d.distance!=null&&d.kind!=='exact'&&d.kind!=='text'?` · distance ${d.distance}`:''}</span></span>`; };
  const parentOpts=q.dupes.map(d=>`<option value="${d.id}">${(window.contractRef?contractRef(getContract(d.id)||{id:d.id}):d.id)}</option>`).join('');
  return `<div class="mig-hits">${q.dupes.map(hit).join('')}${q.dupeTotal>q.dupes.length?`<span class="mig-hit-more">+${q.dupeTotal-q.dupes.length} more</span>`:''}</div>
    ${pending?`<div class="mig-cf-acts">
      <button type="button" data-dup-skip="${i}" class="ui-btn ui-btn-sm">${i18t('mig_skip')}</button>
      <button type="button" data-dup-import="${i}" class="ui-btn ui-btn-sm">${i18t('mig_import_anyway')}</button>
    </div>
    <div class="mig-cf-acts mig-dup-link">
      <button type="button" data-dup-link="${i}" class="ui-btn ui-btn-sm ui-btn-primary">${i18t('mig_import_link_as')}</button>
      <select data-dup-rel="${i}" aria-label="${esc(i18t('mig_dup_rel'))}">${CONTRACT_RELATIONS.map(r=>`<option value="${r.k}">${r.label}</option>`).join('')}</select>
      <span class="mig-hit-k">${esc(i18t('mig_dup_of'))}</span>
      <select data-dup-parent="${i}" aria-label="${esc(i18t('mig_dup_parent'))}">${parentOpts}</select>
    </div>`:''}`;
}
function migWireDupes(host){
  (host||document).querySelectorAll('[data-dup-skip]').forEach(b=>b.addEventListener('click',()=>migResolveDuplicate(Number(b.getAttribute('data-dup-skip')),'skip')));
  (host||document).querySelectorAll('[data-dup-import]').forEach(b=>b.addEventListener('click',()=>migResolveDuplicate(Number(b.getAttribute('data-dup-import')),'import')));
  (host||document).querySelectorAll('[data-dup-link]').forEach(b=>b.addEventListener('click',()=>{
    const i=Number(b.getAttribute('data-dup-link'));
    const parent=(host||document).querySelector(`[data-dup-parent="${i}"]`)?.value;
    const rel=(host||document).querySelector(`[data-dup-rel="${i}"]`)?.value;
    migResolveDuplicate(i,'link',parent,rel);
  }));
}
function migWireCancel(){
  /* "Stop after current" sets a flag and nothing on screen moves until the
     file in flight finishes, so a bare (silent) toast made the one control
     that stops a long import read as a dead press. */
  const b=document.getElementById('mig-cancel'); if(!b||b.dataset.wired) return; b.dataset.wired='1';
  b.addEventListener('click',()=>{ migState().running=false; toast(i18t('mig_stopping'),'warn'); });
}
/* An import that was interrupted is the one thing the customer cannot discover
   for themselves: they have no per-file record of what they dropped, so a
   seven-file shortfall in a 400-contract migration is invisible. Name the
   files. Even without resume, that turns silent data loss into a re-drop. */
async function migLoadUnfinished(){
  const M=migState();
  if(!API_MODE()) return;
  try{
    const r=await api('batches/unfinished');
    M.unfinished=(r.batches||[]).filter(b=>b.id!==M.batch)
      .map(b=>({ ...b, missed:(b.rows||[]).filter(x=>!['saved','duplicate','word'].includes(x.status)) }))
      .filter(b=>b.missed.length);
    if(M.unfinished.length) renderMigration();
  }catch(e){ /* the screen is still usable without this */ }
}
async function migDismissBatch(id){
  try{ await api('batches/'+id,'DELETE'); }catch(e){}
  const M=migState();
  M.unfinished=(M.unfinished||[]).filter(b=>b.id!==id);
  renderMigration();
}
function migUnfinishedHtml(){
  const M=migState();
  if(!M.unfinished||!M.unfinished.length) return '';
  return M.unfinished.map(b=>`
    <div class="mig-warn is-ruby">
      <div style="font-weight:var(--w-strong);margin-bottom:var(--s-1)">Batch ${migEsc(b.id)} did not finish — ${b.missed.length} file${b.missed.length===1?'':'s'} ${b.missed.length===1?'was':'were'} not imported.</div>
      <div style="margin-bottom:5px">Started ${migEsc(String(b.startedAt||'').slice(0,16).replace('T',' '))}${b.startedBy?' by '+migEsc(b.startedBy):''}. Drop these files again to finish the job:</div>
      <ul style="margin:0 0 6px;padding-left:var(--s-4);line-height:1.6">${b.missed.slice(0,15).map(x=>`<li>${migEsc(x.name)}${x.note?` — ${migEsc(x.note)}`:''}</li>`).join('')}</ul>
      ${b.missed.length>15?`<div style="margin-bottom:6px">…and ${b.missed.length-15} more.</div>`:''}
      <button data-dismiss-batch="${migEsc(b.id)}" class="ui-btn ui-btn-sm">${i18t('mig_dismiss')}</button>
    </div>`).join('');
}

/* ═══ JAMBO'S PANEL BESIDE THE LIST — the shared one (jlFrame) ═════════════
   A READING, NOTHING FILED until a press. With no file chosen Jambo says the
   batch in words from the figures' own counts (migKpis), with chips that are
   the page's own doors. A press on a row CHOOSES it (pressed again, it is let
   go — PRESS IT AGAIN AND IT CLOSES; ‹ Jambo lets it go too); the panel then
   says that file: "Check this file" with the facts it is filed with, ready to
   change, amber where Jambo was not sure or found nothing, "File it" grey
   with its reason until the facts the file needs are there. */
let _migPick = null;
function migPickSet(id){
  const ok = id && (getContract(id) || (/^q:\d+$/.test(id) && migState().queue[Number(id.slice(2))]));
  _migPick = (!ok || id === _migPick) ? null : id;
  document.querySelectorAll('.mig-table tbody tr[data-row]').forEach(tr => {
    const on = tr.getAttribute('data-row') === _migPick;
    tr.classList.toggle('is-picked', on); tr.setAttribute('aria-selected', on ? 'true' : 'false'); });
  migSidePaint();
  /* the light list carries no file text: the chosen file is read whole once,
     and the panel says where its facts were found when it lands */
  const c = _migPick ? getContract(_migPick) : null;
  if (c && c._light !== false && typeof ensureFull === 'function'){
    const want = _migPick;
    Promise.resolve(ensureFull(c)).then(() => { if (_migPick === want) migSidePaint(); }).catch(() => {});
  }
}
const migFieldLabel = k => { const f = (typeof META_FIELDS !== 'undefined' ? META_FIELDS : []).find(x => x.k === k); return f ? f.label : k; };
/* a day as the drawing writes it: "1 Apr 2019" */
const migDay = d => { const t = new Date(String(d || '').slice(0, 10) + 'T00:00:00'); if (isNaN(t.getTime())) return String(d || '');
  try { return t.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : 'en-GB', { day:'numeric', month:'short', year:'numeric' }); } catch (_){ return String(d).slice(0, 10); } };
/* One fact of a chosen file: its value as the record holds it, and whether it
   needs a person — missing, or read with low confidence. A contract that says
   no money passes is not missing its value (migReadNeedsReview's valueNone). */
function migSideFacts(c){
  const m = c.metadata || {}, conf = m.confidence || {};
  const money = (typeof isMonetary === 'function') ? isMonetary(c) : true;
  const val = {
    counterparty: c.counterparty || m.counterparty || '',
    contractType: m.contractType || '',
    effectiveDate: (c.fields && c.fields.effDate) || m.effectiveDate || '',
    expiryDate: c.expiry || m.expiryDate || '',
    value: !money ? i18t('mig_side_no_money') : (Number(c.value) > 0 ? ((window.fmtMoneyShortOf ? fmtMoneyShortOf(c) : fmtMoneyShort(c.value))) : ''),
  };
  const shown = k => k === 'effectiveDate' || k === 'expiryDate' ? (val[k] ? migDay(val[k]) : '') : val[k];
  return (typeof MIG_CRITICAL !== 'undefined' ? MIG_CRITICAL : ['counterparty', 'contractType', 'effectiveDate', 'expiryDate', 'value']).map(k => {
    let text = shown(k);
    if (k === 'expiryDate' && !text && m.renewalType === 'evergreen') text = i18t('mig_side_evergreen');
    const missing = !text;
    const unsure = !missing && conf[k] === 'low' && !(k === 'value' && !money);
    return { k, label: migFieldLabel(k), text, missing, unsure };
  });
}

/* ---- WHERE A FACT WAS FOUND, IN THE FILE'S OWN WORDS (never translated) ----
   A reading over the stored text, nothing written: Jambo's own quote where he
   kept one (sourceSpans), else the fact looked up in the words — the party's
   name, a date written any common way (English or Swedish months), the
   amount's digits, the type's words; for the end, the sentence that says it
   renews. Each answer is the place in the text: { s, e }. */
const MIG_MON = { jan:1, feb:2, mar:3, apr:4, may:5, maj:5, jun:6, jul:7, aug:8, sep:9, oct:10, okt:10, nov:11, dec:12 };
function migFind(text, quote){
  const q = String(quote || '').replace(/\s+/g, ' ').trim(); if (q.length < 2) return null;
  const words = q.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  let re; try { re = new RegExp(words.join('\\s+'), 'i'); } catch (_){ return null; }
  const m = re.exec(String(text || ''));
  return m ? { s:m.index, e:m.index + m[0].length } : null;
}
function migDateAt(text, iso){
  if (!iso) return null;
  const t = String(text || '');
  const pad = n => String(n).padStart(2, '0');
  const pats = [
    [/\b(\d{4})-(\d{2})-(\d{2})\b/g, m => `${m[1]}-${m[2]}-${m[3]}`],
    [/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/g, m => `${m[3]}-${pad(m[2])}-${pad(m[1])}`],
    [/\b(\d{1,2})\.?\s+(?:den\s+)?([A-Za-zÅÄÖåäö]{3,10})\.?,?\s+(\d{4})\b/g, m => { const mo = MIG_MON[m[2].slice(0, 3).toLowerCase()]; return mo ? `${m[3]}-${pad(mo)}-${pad(m[1])}` : ''; }],
    [/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\b/g, m => { const mo = MIG_MON[m[1].slice(0, 3).toLowerCase()]; return mo ? `${m[3]}-${pad(mo)}-${pad(m[2])}` : ''; }],
  ];
  for (const [re, iso2] of pats){ let m; re.lastIndex = 0; while ((m = re.exec(t))){ if (iso2(m) === iso) return { s:m.index, e:m.index + m[0].length }; } }
  return null;
}
function migAmountAt(text, v){
  const n = Number(v); if (!(n > 0)) return null;
  const t = String(text || '');
  const re = /\d{1,3}(?:[ ,.\u00a0]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
  let m;
  while ((m = re.exec(t))){
    const digits = m[0].replace(/[ \u00a0]/g, '').replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.');
    if (Number(digits) === n){
      let s = m.index, e = m.index + m[0].length;
      const before = /(?:KES|Kshs?\.?|USD|US\$|SEK|EUR|\$)\s*$/i.exec(t.slice(Math.max(0, s - 6), s));
      if (before) s -= before[0].length;
      const after = /^\s*(?:kronor|kr|shillings|KES|SEK|USD|EUR)\b/i.exec(t.slice(e, e + 12));
      if (after) e += after[0].length;
      return { s, e };
    }
  }
  return null;
}
/* the sentence that says the agreement runs on by itself */
const MIG_RENEW_RE = /(automatically\s+renew|renews?\s+(?:by\s+itself|itself|automatically|for\s+(?:a\s+)?(?:further|successive|another))|shall\s+continue\s+(?:in\s+force\s+)?until|förläng|fortsätter\s+att\s+gälla|evergreen)/i;
function migRenewAt(text){
  const t = String(text || ''); const m = MIG_RENEW_RE.exec(t); if (!m) return null;
  let s = m.index, e = m.index;
  while (s > 0 && !/[.\n]/.test(t[s - 1])) s--;
  while (e < t.length && !/[.\n]/.test(t[e])) e++;
  if (e < t.length && t[e] === '.') e++;
  while (s < e && /\s/.test(t[s])) s++;
  return { s, e };
}
/* the clause a place in the text sits in, as the file numbers it ("§ 3",
   "clause 4") — read off the start of its paragraph, never invented */
function migClauseAt(text, at){
  const t = String(text || '');
  const ls = t.lastIndexOf('\n', Math.max(0, at - 1)) + 1;
  const line = t.slice(ls, ls + 40);
  let m = /^\s*(§\s*\d+[a-z]?)/i.exec(line); if (m) return m[1].replace(/\s+/g, ' ');
  m = /^\s*(?:clause|section|article)\s+(\d+(?:\.\d+)*)/i.exec(line); if (m) return i18t('mig_clause_n', { n:m[1] });
  m = /^\s*(\d{1,2}(?:\.\d+)*)[.)]\s/.exec(line); if (m) return i18t('mig_clause_n', { n:m[1] });
  return '';
}
function migFoundAt(text, k, c){
  const m = c.metadata || {}, spans = m.sourceSpans || {};
  if (!text) return null;
  if (spans[k]){ const r = migFind(text, spans[k]); if (r) return r; }
  if (k === 'counterparty') return migFind(text, c.counterparty || m.counterparty);
  if (k === 'contractType') return migFind(text, m.contractType);
  if (k === 'effectiveDate') return migDateAt(text, (c.fields && c.fields.effDate) || m.effectiveDate);
  if (k === 'expiryDate'){
    const iso = c.expiry || m.expiryDate;
    if (iso){ const r = migDateAt(text, iso); if (r) return r; }
    return migRenewAt(text);
  }
  if (k === 'value') return migAmountAt(text, c.value || m.value);
  return null;
}
const migQuoteOf = (text, at) => at ? String(text).slice(at.s, at.e).replace(/\s+/g, ' ').trim() : '';

/* ---- THE FACTS A FILE IS FILED WITH (one builder: the panel and the check
   view) ---- Title · Party · Starts · Ends · Value · Stream, each a box with
   what the record holds, amber where Jambo was not sure or found nothing, and
   under it where it was found. Party, Ends and Stream are what "fully
   migrated" asks (migGates), so File it waits for them. */
const MIG_FORM_KEYS = ['contractType', 'counterparty', 'effectiveDate', 'expiryDate', 'value', 'folder'];
const MIG_FORM_LABEL = { contractType:'mig_f_title', counterparty:'mig_f_party', effectiveDate:'mig_f_starts', expiryDate:'mig_f_ends', value:'mig_f_value', folder:'mig_f_stream', status:'mig_f_as' };
const MIG_GATE_KEYS = ['counterparty', 'expiryDate', 'folder'];
function migFormOf(c){
  const m = c.metadata || {}, mg = c.migration || {};
  const by = Object.fromEntries(migSideFacts(c).map(f => [f.k, f]));
  const text = (c.upload && c.upload.extractedText) || '';
  const money = isMonetary(c);
  const eff = (c.fields && c.fields.effDate) || m.effectiveDate || '';
  const ends = c.expiry || m.expiryDate || '';
  const renews = !ends && m.renewalType === 'evergreen';
  /* "Jambo was not sure", as drawn, where Jambo read it — missing or unsure alike; HaTi's own rules say their own word */
  const unsureWord = i18t(mg.aiSource === 'ai' ? 'mig_side_not_sure' : 'mig_rules_not_sure');
  const ai = mg.aiSource === 'ai';
  const rows = MIG_FORM_KEYS.map(k => {
    const f = by[k] || {};
    const at = k === 'folder' ? null : migFoundAt(text, k, c);
    const r = { k, label:i18t(MIG_FORM_LABEL[k]), need:!!(f.missing || f.unsure), missing:!!f.missing, unsure:!!f.unsure, at, quote:migQuoteOf(text, at),
      where:at ? migClauseAt(text, at.s) : '', gate:MIG_GATE_KEYS.includes(k), ro:false, word:(f.missing && !ai) ? i18t('mig_side_not_found') : unsureWord };
    if (k === 'contractType') r.val = m.contractType || '';
    if (k === 'counterparty') r.val = c.counterparty || m.counterparty || '';
    if (k === 'effectiveDate'){ r.val = eff ? migDay(eff) : ''; r.iso = eff; }
    if (k === 'expiryDate'){ r.val = renews ? i18t('mig_renews') : (ends ? migDay(ends) : ''); r.iso = ends; r.renews = renews; if (renews){ r.need = false; } }
    if (k === 'value'){ r.ro = !money; r.val = !money ? i18t('mig_side_no_money') : (Number(c.value) > 0 ? (window.fmtMoneyShortOf ? fmtMoneyShortOf(c) : fmtMoneyShort(c.value)) : ''); r.num = Number(c.value) || 0; }
    if (k === 'folder'){ r.val = c.folder || ''; r.ro = !(typeof mayReFile === 'function' && mayReFile()); r.need = !FOLDERS[c.folder]; }
    return r;
  });
  return rows;
}
function migFormRowHtml(c, r, n, o){
  const id = 'mig-f-' + r.k;
  const lab = `<label class="mig-ff-l" for="${id}">${n ? `<span class="mig-ff-n" aria-hidden="true">${n}</span>` : ''}${esc(r.label)}</label>`;
  let ctl;
  if (r.k === 'folder'){
    ctl = r.ro
      ? `<span class="mig-ff-ro" id="${id}" title="${esc(i18t('mig_stream_admin'))}">${esc(streamLabel(c))}</span>`
      : `<select id="${id}" class="mig-ff-in" data-mig-f="folder" data-was="${esc(r.val)}">${folderOptionsHtml(c.folder || '', false)}</select>`;
  } else if (r.ro){
    ctl = `<span class="mig-ff-ro" id="${id}">${esc(r.val)}</span>`;
  } else {
    ctl = `<input id="${id}" class="mig-ff-in" type="text" autocomplete="off" data-mig-f="${r.k}" value="${esc(r.val)}" data-was="${esc(r.val)}"${r.iso ? ` data-iso="${esc(r.iso)}"` : ''}${r.k === 'value' ? ` data-num="${r.num}"` : ''}${r.need ? ` placeholder="${esc(r.word)}"` : ''}>`;
  }
  const why = r.need
    ? `<div class="mig-ff-why">${r.val ? `<span>${esc(r.word)}</span>` : ''}${r.quote ? `<span>${r.where ? esc(r.where) + ': ' : ''}“${esc(r.quote.slice(0, 180))}”</span>` : ''}</div>`
    : (r.k === 'folder' && r.ro ? `<div class="mig-ff-sub">${esc(i18t('mig_stream_admin'))}</div>` : '');
  const use = r.k === 'expiryDate' && r.need && !r.ro && canEdit() && !(o && o.noUse)
    ? `<button type="button" class="mig-ff-use" data-mig-renews>${esc(i18t('mig_use_renews'))}</button>` : '';
  return `<div class="mig-ff${r.need ? ' is-need' : ''}" data-mig-ff="${r.k}">${lab}<div class="mig-ff-c">${ctl}${why}${use}</div></div>`;
}
/* the facts' numbers, where each was found in the file (form order) — the
   title is what the file IS, read from the whole, so it takes no number */
function migFormMarks(rows){ let n = 0; const out = {}; rows.forEach(r => { if (r.at && r.k !== 'contractType') out[r.k] = ++n; }); return out; }
function migFormHtml(c, o){
  const opt = o || {};
  const rows = migFormOf(c), marks = opt.marks ? migFormMarks(rows) : {};
  if (!migReviewOpen(c) || !canEdit()) rows.forEach(r => { if (r.k !== 'folder' || !canEdit()) r.ro = true; });
  const asRow = opt.asRow ? `<div class="mig-ff" data-mig-ff="status"><span class="mig-ff-l">${esc(i18t('mig_f_as'))}</span><div class="mig-ff-c"><span class="mig-ff-ro">${esc(c.migration && c.migration.executedOutside ? i18t('mig_as_signed') : (typeof statusLabel === 'function' ? statusLabel(c.status) : c.status))}</span>${c.signedAt ? `<div class="mig-ff-sub">${esc(i18t('mig_as_signed_on', { d:migDay(String(c.signedAt).slice(0, 10)) }))}</div>` : ''}</div></div>` : '';
  return `<div class="mig-ffs">${rows.map(r => migFormRowHtml(c, r, marks[r.k] || 0, opt)).join('')}${asRow}</div>`;
}
/* a file's facts are open to a person's check until the check is filed: an
   imported signed paper takes exactly ONE review save (the server's wall,
   PUT /api/contracts/:id "THE IMPORT REVIEW OF PAPER SIGNED ELSEWHERE") */
const migReviewOpen = c => !!(c && c.migration && (c.migration.needsReview || c.migration.blocked));
/* ---- READING THE BOXES: what a person put in them ---- */
function migDateRead(v){
  const t = String(v || '').trim().replace(/\.(?=\s|$)/g, '');
  if (!t) return { empty:true };
  const r = migParseDate(t);
  if (r.value) return { iso:r.value };
  const m = /^(\d{1,2})\s+([A-Za-zÅÄÖåäö]{3,10})\s+(\d{4})$/.exec(t);
  if (m){ const mo = MIG_MON[m[2].slice(0, 3).toLowerCase()]; const iso = mo ? migValidDate(+m[3], mo, +m[1]) : null; if (iso) return { iso }; }
  return { bad:true };
}
const MIG_RENEWS_RE = /renew|by itself|förläng|av sig själv|tills|until (?:it is )?ended|evergreen/i;
function migFormRead(form){
  const box = k => form.querySelector(`[data-mig-f="${k}"]`);
  const out = { bad:[] };
  const t = box('contractType'); if (t) out.contractType = t.value.trim();
  const p = box('counterparty'); if (p) out.counterparty = p.value.trim();
  const s = box('effectiveDate');
  if (s){ if (s.value === s.getAttribute('data-was') && s.getAttribute('data-iso')) out.effectiveDate = s.getAttribute('data-iso');
    else { const d = migDateRead(s.value); if (d.iso) out.effectiveDate = d.iso; else if (d.bad) out.bad.push('effectiveDate'); } }
  const e = box('expiryDate');
  if (e){
    if (MIG_RENEWS_RE.test(e.value)) out.ends = { renews:true };
    else if (e.value === e.getAttribute('data-was') && e.getAttribute('data-iso')) out.ends = { iso:e.getAttribute('data-iso') };
    else { const d = migDateRead(e.value); if (d.iso) out.ends = { iso:d.iso }; else if (d.bad) out.bad.push('expiryDate'); }
  }
  const v = box('value');
  if (v){ if (v.value === v.getAttribute('data-was')) out.value = Number(v.getAttribute('data-num')) || null;
    else if (v.value.trim()){ const r = migParseValue(v.value.replace(/^\s*[A-Za-z]{3}\s+/, '')); if (r.value > 0) out.value = r.value; else out.bad.push('value'); } else out.value = null; }
  const f = box('folder'); out.folder = f ? f.value : null;
  return out;
}
/* what File it waits for: the facts "fully migrated" asks (a party, an end
   or renews by itself, a stream) and any box HaTi cannot read */
function migFormWaits(c, form){
  const v = migFormRead(form), out = [];
  if ('counterparty' in v && !v.counterparty) out.push('counterparty');
  if (form.querySelector('[data-mig-f="expiryDate"]') && !v.ends) out.push('expiryDate');
  if (!FOLDERS[(v.folder || (c && c.folder)) || '']) out.push('folder');
  v.bad.forEach(k => { if (!out.includes(k)) out.push(k); });
  return out;
}
function migWaitWords(waits){
  if (!waits.length) return '';
  if (waits.length === 1) return i18t('mig_wait_' + waits[0]);
  return i18t('mig_wait_many', { what:waits.map(k => i18t(MIG_FORM_LABEL[k])).join(', ') });
}
/* the same, read off the record before anything is typed */
function migFormWaitsOf(c){
  const m = c.metadata || {}, out = [];
  if (!String(c.counterparty || m.counterparty || '').trim()) out.push('counterparty');
  if (!(c.expiry || m.expiryDate || m.renewalType === 'evergreen')) out.push('expiryDate');
  if (!FOLDERS[c.folder]) out.push('folder');
  return out;
}
/* repaint File it and its reason as the boxes change */
function migFormGatePaint(form){
  const c = getContract(form.getAttribute('data-mig-form')); if (!c) return;
  const waits = migFormWaits(c, form), say = migWaitWords(waits);
  form.querySelectorAll('[data-mig-file]').forEach(b => { b.disabled = !!waits.length; b.title = say || ''; });
  form.querySelectorAll('[data-mig-wait]').forEach(el => { el.textContent = say; el.hidden = !say; });
}
/* ---- FILE IT: the one writer of a review (applyReviewedMeta) — a person's
   answers, each confirmed, the record's review flag cleared ---- */
async function migFileIt(id, form){
  const c = getContract(id); if (!c || !form) return false;
  if (!canEdit()){ toast(i18t('mig_viewers_no_import2'), 'err'); return false; }
  const waits = migFormWaits(c, form);
  if (waits.length){ toast(migWaitWords(waits), 'warn'); return false; }
  const v = migFormRead(form);
  try { await ensureFull(c); } catch (_){}
  const m = { confidence:{} };
  const put = (k, val) => { if (val != null && val !== ''){ m[k] = val; m.confidence[k] = 'high'; } };
  put('contractType', v.contractType); put('counterparty', v.counterparty); put('effectiveDate', v.effectiveDate);
  if (v.ends && v.ends.renews){
    /* RENEWS BY ITSELF is the answer "fully migrated" takes in place of an end
       date (evergreen): a date read earlier is not kept beside it */
    m.renewalType = 'evergreen'; m.confidence.renewalType = 'high';
    c.expiry = null;
    if (c.metadata) c.metadata = Object.assign({}, c.metadata, { expiryDate:null });
  } else if (v.ends) put('expiryDate', v.ends.iso);
  if (isMonetary(c) && v.value > 0) put('value', v.value);
  m.confirmedAt = nowISO(); m.confirmedBy = currentUser()?.name || '';
  applyReviewedMeta(c, m);
  updateSidebarCounts();
  toast(i18t('mig_filed_toast', { ref:(window.contractRef ? contractRef(c) : c.id) }), 'ok');
  return true;
}

/* ---- WHAT THE PANEL SAYS ---- */
function migSideSay(){
  const k = migKpis(), a = migState().allowance;
  if (!k.files) return { lines:[esc(i18t('mig_side_none'))], src:false, chips:[] };
  const lines = [esc(i18tn('mig_side_files', k.files, { n:k.files, filed:k.filed }))];
  const need = [];
  if (k.check) need.push(i18tn('mig_side_n_review', k.check, { n:k.check }));
  if (k.dupe) need.push(i18tn('mig_side_n_dupe', k.dupe, { n:k.dupe }));
  if (k.none) need.push(i18tn('mig_side_n_blocked', k.none, { n:k.none }));
  if (k.failed) need.push(i18tn('mig_side_n_failed', k.failed, { n:k.failed }));
  lines.push(esc(need.length ? i18t('mig_side_need', { what:need.join(', ') }) : i18t('mig_side_need_none')));
  if (a && a.open && migAllowanceLine()) lines.push(esc(migAllowanceLine()));
  const chips = [];
  if (k.check && canEdit()) chips.push({ label:i18tn('mig_chip_check', k.check, { n:k.check }), run:() => migCheckOpen() });
  if (k.dupe) chips.push({ label:i18tn('mig_side_show_dupe', k.dupe, { n:k.dupe }), run:() => { migShowSet('dupe'); migLandFirst(); } });
  if (k.none) chips.push({ label:i18tn('mig_chip_none', k.none, { n:k.none }), run:() => { migShowSet('none'); migLandFirst(); } });
  if (k.total) chips.push({ label:i18t('mig_chip_sheet'), run:() => migExportSheet() });
  if (k.filed) chips.push({ label:i18tn('mig_chip_filed', k.filed, { n:k.filed }), run:() => {
    const ids = migRows().filter(r => r.c && r.st.k === 'filed').map(r => r.c.id);
    if (typeof regShowOnly === 'function') regShowOnly(ids, i18t('mig_filed_label'));
    if (typeof jlLand === 'function') jlLand('list');
  } });
  return { lines, chips };
}
const migLandFirst = () => { if (typeof landOn === 'function') landOn(() => document.querySelector('.mig-table tbody tr[data-row]'), { block:'nearest', focus:false }); };
function migFileLineHtml(file){ return `<div class="mig-cf-file">${icon('file', 'w-3.5 h-3.5')}<span title="${esc(file)}">${esc(file)}</span></div>`; }
function migSayOf(c){
  const mg = c.migration || {};
  if (mg.blocked) return i18t('mig_cf_say_none');
  const rows = migFormOf(c), n = rows.filter(r => r.need).length;
  if ((typeof isOcrText === 'function') && isOcrText(mg.textSource)) return i18t('mig_cf_say_scan');
  if (mg.aiSource !== 'ai') return n ? i18tn('mig_cf_say_rules', n, { n }) : i18t('mig_cf_say_ok_rules');
  if (!n && migLinkPending(c)) return i18t('mig_side_say_link');
  return n ? i18tn('mig_cf_say_ai', n, { n }) : i18t('mig_cf_say_ok');
}
/* the chosen row, said by Jambo */
function migSideRowHtml(r){
  const edit = canEdit();
  if (r.c && (r.st.k === 'check' || r.st.k === 'none') && migReviewOpen(r.c)){
    const c = r.c, link = migLinkPending(c);
    const waits = edit ? migFormWaitsOf(c) : [];
    const say = migWaitWords(waits);
    return `<div class="mig-cf" data-mig-form="${esc(c.id)}">
      ${migFileLineHtml(r.file)}
      <h3 class="mig-cf-t">${esc(i18t(r.st.k === 'none' ? 'mig_cf_t_none' : 'mig_cf_t'))}</h3>
      <p class="mig-cf-say">${esc(migSayOf(c))}</p>
      ${migFormHtml(c)}
      <div class="mig-cf-acts">
        ${edit ? `<button type="button" class="ui-btn ui-btn-primary" data-mig-file="${esc(c.id)}"${waits.length ? ` disabled title="${esc(say)}"` : ''}>${esc(i18t('mig_file_it'))}</button>` : ''}
        ${r.st.k === 'none' ? `<button type="button" class="ui-btn" data-open="${esc(c.id)}">${esc(i18t('mig_open'))}</button>` : `<button type="button" class="ui-btn" data-mig-check-one="${esc(c.id)}">${esc(i18t('mig_open_file'))}</button>`}
        ${link && edit ? `<button type="button" class="ui-btn" data-mig-side-link="${esc(c.id)}">${esc(i18t('mig_link_it'))}</button>` : ''}
        ${edit && r.st.k === 'check' ? `<button type="button" class="mig-link" data-mig-review-full="${esc(c.id)}" title="${esc(i18t('mig_all_details_t'))}">${esc(i18t('mig_all_details'))}</button>` : ''}
      </div>
      <p class="mig-cf-wait" data-mig-wait${say ? '' : ' hidden'}>${esc(say)}</p>
    </div>`;
  }
  if (r.c){
    const c = r.c, gates = migGates(c), link = r.st.k === 'check' && migLinkPending(c);
    const mark = g => `<li class="${g.ok ? 'is-ok' : 'is-no'}"><span class="mig-sm-dot" aria-hidden="true"></span>${migEsc(g.label)}<span class="mig-sm-w">${migEsc(i18t(g.ok ? 'mig_side_mark_ok' : 'mig_side_mark_no'))}</span></li>`;
    const fact = f => `<div class="mig-sf"><dt>${migEsc(f.label)}</dt><dd>${f.missing ? '—' : migEsc(f.text)}</dd></div>`;
    return `<div class="mig-cf">
      ${migFileLineHtml(r.file)}
      <h3 class="mig-cf-t">${r.st.k === 'reading' ? esc(i18t('mig_cf_t_reading')) : link ? esc(i18t('mig_cf_t_link')) : i18t('mig_cf_t_filed', { ref:window.refHtml ? refHtml(c) : esc(c.id) })}</h3>
      <p class="mig-cf-say">${esc(r.st.k === 'reading' ? i18t('mig_cf_say_reading') : link ? i18t('mig_side_say_link') : (migComplete(c) ? i18t('mig_side_say_done') : i18t('mig_side_say_missing')))}</p>
      <dl class="mig-sfs"><div class="mig-sf"><dt>${migEsc(i18t('mig_col_stream'))}</dt><dd>${migEsc(streamLabel(c))}</dd></div>${migSideFacts(c).map(fact).join('')}</dl>
      <div class="mig-side-h">${migEsc(i18t('mig_side_marks'))}</div>
      <ul class="mig-sms">${gates.map(mark).join('')}</ul>
      <div class="mig-cf-acts">${link && canEdit() ? `<button type="button" class="ui-btn ui-btn-primary" data-mig-side-link="${esc(c.id)}">${esc(i18t('mig_link_it'))}</button>` : ''}<button type="button" class="ui-btn" data-open="${esc(c.id)}">${esc(i18t('mig_open'))}</button></div>
    </div>`;
  }
  const q = r.q;
  const t = r.st.k === 'dupe' ? 'mig_cf_t_dupe' : r.st.k === 'failed' ? 'mig_cf_t_failed' : r.st.k === 'reading' ? 'mig_cf_t_reading' : 'mig_cf_t_left';
  return `<div class="mig-cf">
    ${migFileLineHtml(r.file)}
    <h3 class="mig-cf-t">${esc(i18t(t))}</h3>
    <p class="mig-cf-say">${esc(r.st.why || '')}${r.st.k === 'failed' ? ' ' + esc(i18t('mig_cf_say_again')) : ''}</p>
    ${r.st.k === 'dupe' || r.st.k === 'skipped' ? migDupeRowHtml(q, r.i) : ''}
  </div>`;
}
/* keep what a person typed when the panel is painted again for the same file */
function migFormKeep(host){
  const f = host && host.querySelector('[data-mig-form]'); if (!f) return null;
  const vals = {}; f.querySelectorAll('[data-mig-f]').forEach(el => { vals[el.getAttribute('data-mig-f')] = el.value; });
  return { id:f.getAttribute('data-mig-form'), vals };
}
function migFormPut(host, keep){
  if (!keep) return;
  const f = host.querySelector(`[data-mig-form]`); if (!f || f.getAttribute('data-mig-form') !== keep.id) return;
  for (const [k, v] of Object.entries(keep.vals)){ const el = f.querySelector(`[data-mig-f="${k}"]`); if (el && el.tagName !== 'SELECT') el.value = v; }
  migFormGatePaint(f);
}
function migSidePaint(){
  const host = document.getElementById('mig-side'); if (!host) return;
  /* ‹ Jambo, and his tab, let the chosen file go (the check view closes) */
  host._jlBack = () => { if (_migCheck){ migCheckClose(); return true; } if (_migPick){ migPickSet(null); return true; } return false; };
  /* a word that needs one contract takes the file the panel holds */
  host._jlHeld = () => { const r = _migCheck ? migRowByKey(migCheckId()) : (_migPick ? migRowByKey(_migPick) : null); return (r && r.c) || null; };
  const keep = migFormKeep(host);
  const body = (typeof jlFrame === 'function') ? jlFrame(host, { jlPh:i18t('jl_ph_any') }) : host;
  const row = _migCheck ? migRowByKey(migCheckId()) : (_migPick ? migRowByKey(_migPick) : null);
  const holds = !!row;
  if (typeof jlHeadPaint === 'function') jlHeadPaint(host, { jlWord:(_migCheck && row && row.c) ? (row.c.name || i18t('mig_side_word')) : i18t('mig_side_word'), jlHome:i18t('mig_side_word') }, holds);
  if (_migCheck) body.innerHTML = migCheckSideHtml(row) + '<div id="jl-feed" class="jl-feed" aria-live="polite"></div>';
  else if (row) body.innerHTML = migSideRowHtml(row) + '<div id="jl-feed" class="jl-feed" aria-live="polite"></div>';
  else body.innerHTML = (typeof jlWordsHtml === 'function') ? jlWordsHtml({ jlSay:migSideSay, empty:i18t('mig_side_none') }) : '';
  migFormPut(host, keep);
  if (typeof renderAIFeed === 'function' && typeof ai !== 'undefined' && ai && Array.isArray(ai.history) && ai.history.length) try { renderAIFeed(!!ai.busy); } catch (_){}
}

/* ═══ CHECK ALL N — ONE AT A TIME (option 1's view, borrowed) ═════════════
   The files that need you, one at a time: the file's own words on the left,
   a number where each fact was found, the facts to file on the right, Jambo
   saying why he was not sure and offering the likely answer (a press fills
   the box; File it is a second press). Next and previous file; Skip for now.
   Per sitting, kept through a refresh (migPlace). */
let _migCheck = null;
function migCheckIds(){ return migRows().filter(r => r.c && r.st.k === 'check').map(r => r.c.id); }
function migCheckId(){ return _migCheck ? (_migCheck.ids[_migCheck.i] || null) : null; }
function migCheckOpen(startId){
  const ids = migCheckIds();
  if (startId && getContract(startId) && !ids.includes(startId)) ids.unshift(startId);
  if (!ids.length){ toast(i18t('mig_nothing_waiting'), 'warn'); return false; }
  _migCheck = { ids, i:Math.max(0, startId ? ids.indexOf(startId) : 0) };
  _migPick = null;
  renderMigration();
  if (typeof landOn === 'function') landOn('#mig-ck-facts', { block:'nearest', focus:'.mig-ff.is-need .mig-ff-in, .mig-ff .mig-ff-in' });
  return true;
}
function migCheckClose(){
  const id = migCheckId();
  _migCheck = null;
  _migPick = id && getContract(id) ? id : null;
  renderMigration();
  if (_migPick && typeof landOn === 'function') landOn(() => [...document.querySelectorAll('.mig-table tr[data-row]')].find(tr => tr.getAttribute('data-row') === _migPick) || null, { block:'nearest', focus:false });
}
function migCheckGo(d){
  if (!_migCheck) return;
  const n = _migCheck.ids.length;
  _migCheck.i = Math.min(n - 1, Math.max(0, _migCheck.i + d));
  renderMigration();
}
function migCheckTo(id){
  if (!_migCheck) return;
  const i = _migCheck.ids.indexOf(id); if (i < 0) return;
  _migCheck.i = i; renderMigration();
}
/* after a file is filed: the next that still waits, else back to the list */
function migCheckNext(){
  if (!_migCheck) return;
  const left = _migCheck.ids.filter((id, j) => j !== _migCheck.i && (() => { const c = getContract(id); return c && migStateOf(c).k === 'check'; })());
  if (!left.length){ _migCheck = null; renderMigration(); toast(i18t('mig_ck_done'), 'ok'); return; }
  const after = _migCheck.ids.slice(_migCheck.i + 1).find(id => left.includes(id)) || left[0];
  _migCheck = { ids:_migCheck.ids, i:_migCheck.ids.indexOf(after) };
  renderMigration();
}
/* the file's own words, with each found fact marked and numbered */
function migDocHtml(c, rows){
  const text = (c.upload && c.upload.extractedText) || '';
  if (c._light !== false && !text) return `<p class="mig-ck-wait">${typeof busyHtml === 'function' ? busyHtml(i18t('mig_ck_loading')) : esc(i18t('mig_ck_loading'))}</p>`;
  if (!text.trim()) return `<p class="mig-ck-wait">${esc(i18t('mig_ck_no_text'))}</p>`;
  const marks = migFormMarks(rows);
  const ranges = rows.filter(r => r.at && marks[r.k]).map(r => ({ s:r.at.s, e:r.at.e, n:marks[r.k], need:r.need }))
    .sort((a, b) => a.s - b.s).filter((r, i, a) => !i || r.s >= a[i - 1].e);
  /* a short first line in capitals is the file's title, drawn as one */
  const first = /^\s*([^\n]{3,90})\n/.exec(text);
  const titled = first && first[1] === first[1].toUpperCase() && /[A-ZÅÄÖ]{3}/.test(first[1]) && !ranges.some(r => r.s < first[0].length);
  const start = titled ? first[0].length : 0;
  let out = '', at = start;
  for (const r of ranges){
    if (r.s < start) continue;
    out += esc(text.slice(at, r.s)) + `<mark class="mig-ck-m${r.need ? ' is-need' : ''}" data-mig-n="${r.n}">${esc(text.slice(r.s, r.e))}</mark><sup class="mig-ck-sup">${r.n}</sup>`;
    at = r.e;
  }
  out += esc(text.slice(at));
  return `${titled ? `<div class="mig-ck-title">${esc(first[1].trim())}</div>` : ''}<div class="mig-ck-text">${out.replace(/^\s+/, '')}</div>`;
}
/* Jambo's why, in the file's own words, and the likely answer he offers */
function migWhyHtml(c){
  const text = (c.upload && c.upload.extractedText) || '';
  const rows = migFormOf(c), by = Object.fromEntries(rows.map(r => [r.k, r]));
  const m = c.metadata || {}, mg = c.migration || {};
  const lines = [], offers = [];
  const e = by.expiryDate;
  if (e && e.need){
    const rs = migRenewAt(text);
    if (rs && !e.iso){
      const where = migClauseAt(text, rs.s);
      lines.push(`<b>${esc(i18t('mig_why_end_h'))}</b> ${esc(i18t(where ? 'mig_why_end_renews_at' : 'mig_why_end_renews', { where }))} “${esc(migQuoteOf(text, rs).slice(0, 240))}”`);
      const days = Number(m.noticePeriodDays) || 0;
      lines.push(esc(days ? i18t('mig_why_end_so_notice', { n:days }) : i18t('mig_why_end_so')));
      offers.push({ k:'renews', label:i18t('mig_use_renews_colon') });
    } else if (m.checks && m.checks.expiryDate && m.checks.expiryDate.expected){
      const d = migDay(m.checks.expiryDate.expected);
      lines.push(`<b>${esc(i18t('mig_why_end_h'))}</b> ${esc(i18t('mig_why_end_term', { d }))}`);
      offers.push({ k:'date', iso:m.checks.expiryDate.expected, label:i18t('mig_use_date', { d }) });
    } else if (e.missing) lines.push(`<b>${esc(i18t('mig_why_end_h'))}</b> ${esc(i18t('mig_why_end_none'))}`);
    else lines.push(esc(i18t('mig_why_unsure_q', { what:i18t('mig_fw_ends'), q:e.quote || e.val })));
  }
  for (const k of ['counterparty', 'effectiveDate', 'value', 'contractType']){
    const r = by[k]; if (!r || !r.need) continue;
    if (r.missing) lines.push(esc(i18t('mig_why_missing_say', { what:i18t(MIG_FACT_WORD[k]) })));
    else lines.push(esc(i18t('mig_why_unsure_q', { what:i18t(MIG_FACT_WORD[k]), q:r.quote || r.val })));
  }
  if ((typeof isOcrText === 'function') && isOcrText(mg.textSource)) lines.push(esc(i18t('mig_why_scan_say')));
  else if (mg.aiSource !== 'ai') lines.push(esc(i18t('mig_why_rules_say')));
  if (migLinkPending(c)) lines.push(esc(i18t('mig_side_say_link')));
  if (!lines.length) lines.push(esc(i18t('mig_why_all_there')));
  return { lines, offers };
}
function migCheckSideHtml(r){
  if (!r || !r.c) return '';
  const c = r.c, w = migWhyHtml(c);
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 24, 'jl-say-face').replace('<img', '<img data-ink-exempt') : '';
  const next = _migCheck ? _migCheck.ids.slice(_migCheck.i + 1).concat(_migCheck.ids.slice(0, _migCheck.i)).map(getContract).filter(x => x && migStateOf(x).k === 'check') : [];
  return `<div class="jl-words mig-ck-why">
      <div class="jl-say">${face}<div class="jl-bub">${w.lines.map(l => `<p class="mig-why-p">${l}</p>`).join('')}</div></div>
      <p class="jl-src">${esc(i18t('mig_src_file'))}</p>
      ${w.offers.length && canEdit() ? `<div class="jl-chips">${w.offers.map(o => `<button type="button" class="ui-btn ui-btn-sm" data-mig-use="${o.k}"${o.iso ? ` data-iso="${esc(o.iso)}"` : ''}>${esc(o.label)}</button>`).join('')}</div>` : ''}
    </div>
    ${next.length ? `<div class="mig-ck-next"><div class="mig-side-h">${esc(i18t('mig_ck_next_h'))}</div>
      <div class="mig-ck-nl">${next.map(x => `<button type="button" class="mig-ck-nr" data-mig-ck-to="${esc(x.id)}"><span class="mig-ck-nf">${esc((x.upload && x.upload.fileName) || x.name)}</span><span class="mig-ck-nw">${esc(migStateOf(x).why)}</span></button>`).join('')}</div></div>` : ''}`;
}
function migCheckHtml(){
  const id = migCheckId(), c = id ? getContract(id) : null;
  if (!c) return '';
  const n = _migCheck.ids.length;
  const rows = migFormOf(c);
  const file = (c.upload && c.upload.fileName) || c.name;
  const edit = canEdit();
  const waits = migReviewOpen(c) ? migFormWaitsOf(c) : [];
  const say = migWaitWords(waits);
  return `<div class="mig-ck">
    <section class="mig-card mig-ck-doc" id="mig-ck-doc" aria-label="${esc(i18t('mig_ck_doc_sub'))}">
      <div class="mig-ck-h">${icon('file', 'w-4 h-4')}<b title="${esc(file)}">${esc(file)}</b><span>${esc(i18t('mig_ck_doc_sub'))}</span></div>
      <div class="mig-ck-page">${migDocHtml(c, rows)}</div>
    </section>
    <section class="mig-card mig-ck-facts" id="mig-ck-facts" data-mig-form="${esc(c.id)}">
      <div class="mig-ck-h"><b>${esc(i18t('mig_ck_facts_h'))}</b><span>${esc(i18t('mig_ck_facts_sub'))}</span></div>
      <div class="mig-ck-body">${migFormHtml(c, { marks:true, asRow:true, noUse:migWhyHtml(c).offers.length > 0 })}</div>
      <div class="mig-ck-foot">
        ${edit && migReviewOpen(c) ? `<button type="button" class="ui-btn ui-btn-primary" data-mig-file="${esc(c.id)}" data-mig-ck-file${waits.length ? ` disabled title="${esc(say)}"` : ''}>${esc(i18t('mig_file_it'))}</button>` : ''}
        ${edit && !migReviewOpen(c) && migLinkPending(c) ? `<button type="button" class="ui-btn ui-btn-primary" data-mig-side-link="${esc(c.id)}">${esc(i18t('mig_link_it'))}</button>` : ''}
        <span class="mig-cf-wait" data-mig-wait${say ? '' : ' hidden'}>${esc(say)}</span>
        <span class="mig-sp"></span>
        ${edit && migReviewOpen(c) ? `<button type="button" class="mig-link" data-mig-review-full="${esc(c.id)}" data-mig-ck-file title="${esc(i18t('mig_all_details_t'))}">${esc(i18t('mig_all_details'))}</button>` : ''}
        ${n > 1 ? `<button type="button" class="ui-btn" data-mig-ck-skip>${esc(i18t('mig_ck_skip'))}</button>` : ''}
      </div>
    </section>
  </div>`;
}
function migCheckBarHtml(){
  const n = _migCheck.ids.length, i = _migCheck.i;
  return `<div class="mig-ck-bar">
    <button type="button" class="mig-ck-back" data-mig-ck-close>‹ ${esc(i18t('mig_ck_back'))}</button>
    <h2 class="mig-ck-t">${esc(i18tn('mig_ck_title', n, { n }))}</h2>
    <span class="mig-sp"></span>
    <span class="mig-ck-pos">${esc(i18t('mig_ck_pos', { i:i + 1, n }))}</span>
    <button type="button" class="ui-btn ui-btn-sm ui-btn-icon" data-mig-ck-go="-1" aria-label="${esc(i18t('mig_ck_prev'))}" title="${esc(i18t('mig_ck_prev'))}"${i ? '' : ' disabled'}>‹</button>
    <button type="button" class="ui-btn ui-btn-sm ui-btn-icon" data-mig-ck-go="1" aria-label="${esc(i18t('mig_ck_next'))}" title="${esc(i18t('mig_ck_next'))}"${i < n - 1 ? '' : ' disabled'}>›</button>
  </div>`;
}

/* ---- REVIEW SPREADSHEET: two doors are a menu (SAP pop-ups) — the sheet out
   to correct in Excel, and the corrected one back in ---- */
function migSheetMenu(anchor){
  const was = document.getElementById('mig-sheet-menu');
  if (was){ was.remove(); anchor.setAttribute('aria-expanded', 'false'); return; }   /* pressed again, it closes */
  const m = document.createElement('div');
  m.id = 'mig-sheet-menu'; m.className = 'nd-menu'; m.setAttribute('role', 'menu'); m.setAttribute('data-top-overlay', '1');
  const item = (k, ico, t, d) => `<button type="button" role="menuitem" class="nd-item" data-mig-sheet-do="${k}"><span class="nd-ic">${icon(ico, 'w-4 h-4')}</span><span class="nd-tx"><span class="nd-t">${esc(t)}</span><span class="nd-d">${esc(d)}</span></span></button>`;
  m.innerHTML = item('out', 'download', i18t('mig_sheet_out'), i18t('mig_sheet_out_sub')) + (canEdit() ? item('in', 'upload', i18t('mig_sheet_in'), i18t('mig_sheet_in_sub')) : '');
  document.body.appendChild(m);
  const ar = anchor.getBoundingClientRect(), w = m.offsetWidth;
  m.style.top = Math.round(ar.bottom + 4) + 'px';
  m.style.left = Math.round(Math.max(8, Math.min(ar.right - w, window.innerWidth - w - 8))) + 'px';
  anchor.setAttribute('aria-expanded', 'true');
  const close = () => { m.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', away, true); document.removeEventListener('keydown', key, true); };
  const away = ev => { if (!m.contains(ev.target) && ev.target !== anchor && !anchor.contains(ev.target)) close(); };
  const key = ev => { if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopImmediatePropagation(); close(); anchor.focus(); } };
  m.querySelectorAll('[data-mig-sheet-do]').forEach(b => b.addEventListener('click', () => {
    const k = b.getAttribute('data-mig-sheet-do'); close();
    if (k === 'out') migExportSheet(); else document.getElementById('mig-sheet-file')?.click();
  }));
  document.addEventListener('pointerdown', away, true);
  document.addEventListener('keydown', key, true);
  m.querySelector('[data-mig-sheet-do]')?.focus();
}

/* ---- A WHOLE FOLDER DROPPED (as drawn: "Drop old contracts here, or a whole
   folder") — the folder is walked and its contracts taken; anything that is
   not a file HaTi reads is left out and said ---- */
const MIG_TAKE_RE = /\.(pdf|docx|doc|txt|png|jpe?g)$/i;
const MIG_WALK_MAX = 400;
async function migFilesFromDrop(dt){
  const items = [...((dt && dt.items) || [])];
  const entries = items.map(it => (it && typeof it.webkitGetAsEntry === 'function') ? it.webkitGetAsEntry() : null).filter(Boolean);
  if (!entries.some(e => e.isDirectory)) return { files:[...((dt && dt.files) || [])], from:null, left:0 };
  const files = []; let left = 0, seen = 0;
  const fileOf = e => new Promise(res => e.file(res, () => res(null)));
  const readAll = dir => new Promise(res => { const r = dir.createReader(), all = [];
    const more = () => r.readEntries(b => { if (!b.length) return res(all); all.push(...b); if (all.length > MIG_WALK_MAX) return res(all); more(); }, () => res(all)); more(); });
  const walk = async e => {
    if (seen++ > MIG_WALK_MAX) return;
    if (e.isFile){ if (MIG_TAKE_RE.test(e.name) && !/^\./.test(e.name)){ const f = await fileOf(e); if (f) files.push(f); } else left++; return; }
    if (e.isDirectory) for (const x of await readAll(e)) await walk(x);
  };
  for (const e of entries) await walk(e);
  const dirs = entries.filter(e => e.isDirectory);
  return { files, from:dirs.length === 1 ? dirs[0].name : null, left };
}
async function migDropTake(dt){
  const r = await migFilesFromDrop(dt);
  if (r.left) toast(i18tn('mig_folder_left', r.left, { n:r.left }), 'warn');
  if (!r.files.length){ if (r.from) toast(i18t('mig_folder_empty', { from:r.from }), 'warn'); return; }
  migProcessFiles(r.files, r.from ? { from:r.from } : {});
}

/* ---- A REFRESH LANDS AT THE SAME SPOT (PLACE_PARTS.migration): the figure
   door, Show all, the chosen file and the check view on its file ---- */
function migPlace(){
  return { show:_migShow, all:_migAll, pick:(_migPick && !/^q:/.test(_migPick)) ? _migPick : null, check:migCheckId() };
}
function migPlacePut(p){
  if (!p || typeof p !== 'object') return;
  if (MIG_SHOWS.includes(p.show)) _migShow = p.show;
  _migAll = !!p.all;
  _migPick = typeof p.pick === 'string' ? p.pick : null;
  _migCheck = typeof p.check === 'string' ? { ids:[p.check], i:0, want:p.check } : null;
}

function renderMigration(){
  const M=migState();
  const keep=migFormKeep(document.getElementById('content'));
  /* the check view put back by a refresh: its file among the ones that wait */
  if(_migCheck&&_migCheck.want){ const want=_migCheck.want; if(!getContract(want)) _migCheck=null;
    else { const ids=migCheckIds(); if(!ids.includes(want)) ids.unshift(want); _migCheck={ ids, i:ids.indexOf(want) }; } }
  if(_migCheck&&!getContract(migCheckId())) _migCheck=null;
  if(_migPick&&!migRowByKey(_migPick)) _migPick=null;
  document.getElementById('content').innerHTML=`
  <div class="view-enter sap-page mig-page${_migCheck?' is-checking':''}">
    ${''/* THE WHITE BAR (owner, 9 Oct 2026): the page's name, what the batch is
           and Choose files… on the white head; the five figures (or the check
           view's bar) on the same white band, closed by its rule */}
    <div class="sap-band mig-band" id="mig-band">${_migCheck?migCheckBarHtml():migBandHtml()}</div>
    <style>
      .mig-page{padding:0 var(--page-pad-x) var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)}
      .mig-band{padding-top:var(--s-1);padding-bottom:var(--s-3)}
      .mig-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--s-3)}
      @media (min-width:640px){ .mig-kpis{grid-template-columns:repeat(5,minmax(0,1fr))} }
      .mig-kpi,.mig-kpi-card{display:flex;flex-direction:column;gap:4px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:12px 14px;text-align:left;font:inherit;color:inherit;min-width:0}
      .mig-kpi{cursor:pointer}
      .mig-kpi:hover{border-color:var(--btn-edge)}
      .mig-kpi.is-on{border-color:var(--color-accent);box-shadow:0 0 0 1px var(--color-accent)}
      .mig-kpi:focus-visible{outline:2px solid var(--focus-color);outline-offset:2px}
      .mig-kpi-l{font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-kpi-n{font-size:24px;line-height:1.1;font-weight:var(--w-title);font-variant-numeric:tabular-nums;color:var(--color-text)}
      .mig-kpi-n.is-green{color:var(--st-green-fg)} .mig-kpi-n.is-amber{color:var(--st-amber-fg)} .mig-kpi-n.is-ruby{color:var(--st-ruby-fg)}
      .mig-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);min-width:0}
      .mig-drop-card{padding:var(--s-4);display:flex;flex-direction:column;gap:var(--s-3)}
      #mig-drop{display:flex;align-items:center;gap:var(--s-3);border:1px dashed var(--color-neutral-400);border-radius:var(--radius-lg);padding:12px 16px;text-align:left;cursor:pointer;background:var(--surface-2);transition:border-color var(--dur-1),background var(--dur-1)}
      #mig-drop:hover,#mig-drop:focus-visible{border-color:var(--color-accent)}
      #mig-drop:focus-visible{outline:2px solid var(--focus-color);outline-offset:2px}
      #mig-drop.dragover{border-color:var(--color-accent);background:var(--st-steel-bg)}
      .mig-drop-i{display:inline-grid;place-items:center;flex:none;width:36px;height:36px;border-radius:var(--radius);background:var(--color-surface);border:1px solid var(--color-divider);color:var(--accent-ink-700)}
      .mig-drop-w{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
      .mig-drop-w b{font-size:var(--t-body);font-weight:var(--w-strong)}
      .mig-drop-s{font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.5}
      .mig-drop-b{flex:none}
      .mig-opts{display:flex;flex-wrap:wrap;gap:var(--s-3) var(--s-4);align-items:flex-end}
      .mig-opt{display:flex;flex-direction:column;gap:4px;min-width:0}
      .mig-opt-l{font-size:var(--t-meta);color:var(--color-neutral-600)}
      .mig-opt select{font:inherit;font-size:var(--field-size);height:var(--ctl-h);min-width:180px;border:1px solid var(--chip-edge,var(--color-divider));background:var(--color-surface);border-radius:var(--radius);padding:0 28px 0 var(--s-2);color:var(--color-text);cursor:pointer}
      .mig-list-box{display:flex;align-items:center;gap:6px;height:var(--ctl-h);padding:0 var(--s-2);border:1px solid var(--chip-edge,var(--color-divider));border-radius:var(--radius);background:var(--color-surface);min-width:0;max-width:100%}
      .mig-list-name{font-size:var(--t-meta);font-weight:var(--w-strong);max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-list-n{font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap}
      .mig-list-sep{color:var(--color-neutral-500)}
      .mig-link{appearance:none;border:0;background:none;padding:0;font:inherit;font-size:var(--t-meta);color:var(--accent-ink);cursor:pointer;white-space:nowrap}
      .mig-link:hover{text-decoration:underline}
      .mig-note{margin:0;font-size:var(--t-meta);color:var(--color-neutral-700)}
      .mig-warn{font-size:var(--t-meta);border-radius:var(--radius);padding:7px 10px;border:1px solid var(--color-divider)}
      .mig-warn.is-ruby{color:var(--st-ruby-fg);background:var(--st-ruby-bg);border-color:var(--st-ruby-line)}
      .mig-warn.is-amber{color:var(--st-amber-fg);background:var(--st-amber-bg);border-color:var(--st-amber-line)}
      .mig-warn.is-steel{color:var(--st-steel-fg);background:var(--st-steel-bg)}
      .mig-list{overflow:hidden}
      .mig-list .mig-warn{margin:0 var(--s-4) var(--s-2)}
      .mig-lh{display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap;padding:var(--s-3) var(--s-4)}
      .mig-lh-t{margin:0;font-size:var(--t-card);font-weight:var(--w-strong)}
      .mig-lh-n{font-size:var(--t-label);font-weight:var(--w-strong);background:var(--surface-2);border-radius:999px;padding:1px 8px;font-variant-numeric:tabular-nums}
      .mig-lh-s{font-size:var(--t-meta);color:var(--color-neutral-600)}
      .mig-sp{flex:1 1 auto}
      .mig-run{display:flex;align-items:center;gap:var(--s-2);padding:0 var(--s-4) var(--s-2);font-size:var(--t-meta);color:var(--color-neutral-700)}
      .mig-table{width:100%;border-collapse:collapse;font-size:var(--t-body);table-layout:fixed}
      .mig-table th{text-align:left;font-size:var(--t-meta);font-weight:var(--w-body);color:var(--color-neutral-600);padding:10px 14px;border-top:1px solid var(--color-divider);border-bottom:1px solid var(--color-divider);white-space:nowrap}
      .mig-table th:nth-child(1){width:29%} .mig-table th:nth-child(2){width:13%} .mig-table th:nth-child(3){width:12%} .mig-table th:nth-child(4){width:15%} .mig-table th:nth-child(5){width:11%} .mig-table th:nth-child(6){width:20%}
      .mig-table td{padding:10px 14px;border-bottom:1px solid var(--color-divider);vertical-align:middle;min-width:0}
      .mig-table tbody tr{cursor:pointer}
      .mig-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      .mig-table tbody tr.is-picked{background:color-mix(in srgb,var(--color-accent) 9%,transparent);box-shadow:inset 3px 0 0 var(--color-accent)}
      .mig-table tbody tr:focus-visible{outline:2px solid var(--focus-color);outline-offset:-2px}
      .mig-td-f{overflow:hidden}
      .mig-fn,.mig-fr{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-fn{font-weight:var(--w-label)}
      .mig-fr{font-size:var(--t-meta);color:var(--color-neutral-600);margin-top:2px}
      .mig-td-s,.mig-td-e{font-size:var(--t-meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-table .mig-td-v{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-ns{color:var(--st-amber-fg)}
      .mig-dots{display:inline-flex;gap:4px;align-items:center}
      .mig-dot{width:9px;height:9px;border-radius:50%;border:1.5px solid var(--color-neutral-400);background:var(--color-surface)}
      .mig-dot.is-ok{background:var(--color-accent);border-color:var(--color-accent)}
      .mig-td-st{overflow:hidden}
      .mig-st{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-label);font-weight:var(--w-label);border-radius:999px;padding:1px 8px;line-height:1.5;white-space:nowrap}
      .mig-st.is-amber{color:var(--st-amber-fg);background:var(--st-amber-bg)}
      .mig-st.is-green{color:var(--st-green-fg);background:var(--st-green-bg)}
      .mig-st.is-ruby{color:var(--st-ruby-fg);background:var(--st-ruby-bg)}
      .mig-st.is-steel{color:var(--st-steel-fg);background:var(--st-steel-bg)}
      .mig-st.is-grey{color:var(--color-neutral-700);background:var(--surface-2)}
      .mig-st-why{display:block;font-size:var(--t-label);color:var(--color-neutral-600);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-ref{display:block;appearance:none;border:0;background:none;padding:0;margin-top:3px;font:inherit;font-size:var(--t-label);color:var(--accent-ink);cursor:pointer}
      .mig-ref:hover{text-decoration:underline}
      .mig-foot{display:flex;align-items:center;gap:6px;padding:10px var(--s-4);font-size:var(--t-meta);color:var(--color-neutral-600)}
      .mig-empty{padding:26px var(--s-4);text-align:center;color:var(--color-neutral-600)}
      ${''/* JAMBO'S PANEL: the chosen file, ready to file */}
      .mig-cf{padding:14px 16px;display:flex;flex-direction:column;gap:8px}
      .mig-cf-file{display:flex;align-items:center;gap:6px;font-size:var(--t-meta);color:var(--color-neutral-600);min-width:0}
      .mig-cf-file span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-cf-t{margin:0;font-size:var(--t-card);font-weight:var(--w-strong)}
      .mig-cf-say{margin:0;font-size:var(--t-meta);line-height:1.5;color:var(--color-neutral-700)}
      .mig-cf-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
      .mig-cf-acts select{font:inherit;font-size:var(--t-meta);height:var(--ctl-h-sm);border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:0 22px 0 6px;max-width:130px}
      .mig-cf-wait{margin:0;font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.45}
      .mig-cf-wait[hidden]{display:none}
      .mig-ffs{display:flex;flex-direction:column;border-top:1px solid var(--color-divider)}
      .mig-ff{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;align-items:start;padding:7px 0;border-bottom:1px solid var(--color-divider)}
      .mig-ff-l{display:flex;align-items:center;gap:6px;font-size:var(--t-meta);color:var(--color-neutral-700);padding-top:8px}
      .mig-ff-n{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:var(--surface-2);font-size:10px;font-weight:var(--w-strong);color:var(--color-neutral-700);flex:none}
      .mig-ff-c{min-width:0;display:flex;flex-direction:column;gap:4px;align-items:stretch}
      .mig-ff-in{font:inherit;font-size:var(--t-body);height:var(--ctl-h);width:100%;min-width:0;border:1px solid var(--color-neutral-300);border-radius:var(--radius);background:var(--color-surface);padding:0 10px;color:var(--color-text)}
      .mig-ff-in:focus{border-color:var(--accent-ink);outline:none;box-shadow:0 0 0 3px var(--color-accent-100)}
      .mig-ff.is-need .mig-ff-in{background:var(--need-bg,var(--st-amber-bg));border-color:var(--st-amber-line)}
      .mig-ff-in::placeholder{color:var(--st-amber-fg)}
      .mig-ff-ro{font-size:var(--t-body);padding-top:7px;color:var(--color-text)}
      .mig-ff-why{display:flex;flex-direction:column;gap:2px;font-size:var(--t-label);line-height:1.45;color:var(--st-amber-fg)}
      .mig-ff-sub{font-size:var(--t-label);color:var(--color-neutral-600)}
      .mig-ff-use{align-self:flex-start;appearance:none;border:1px solid var(--color-accent-100);background:var(--color-surface);color:var(--accent-ink);border-radius:999px;padding:2px 10px;font:inherit;font-size:var(--t-label);cursor:pointer}
      .mig-ff-use:hover{background:var(--color-accent-50)}
      .mig-sfs{margin:0;display:flex;flex-direction:column;border-top:1px solid var(--surface-2)}
      .mig-sf{display:grid;grid-template-columns:42% minmax(0,1fr);gap:8px;padding:6px 0;border-bottom:1px solid var(--surface-2);font-size:var(--t-meta)}
      .mig-sf dt{color:var(--color-neutral-600)}
      .mig-sf dd{margin:0;overflow-wrap:anywhere}
      .mig-side-h{font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600);margin:4px 0 2px}
      .mig-sms{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:3px;font-size:var(--t-meta)}
      .mig-sms li{display:flex;align-items:center;gap:7px}
      .mig-sm-dot{width:9px;height:9px;border-radius:50%;flex:none;border:1.5px solid var(--color-neutral-400);background:var(--color-surface)}
      .mig-sms li.is-ok .mig-sm-dot{background:var(--color-accent);border-color:var(--color-accent)}
      .mig-sm-w{margin-left:auto;font-size:var(--t-label);color:var(--color-neutral-600)}
      .mig-sms li.is-no .mig-sm-w{color:var(--st-amber-fg)}
      .mig-hits{display:flex;flex-wrap:wrap;gap:5px}
      .mig-hit{display:inline-flex;align-items:center;gap:5px;font-size:var(--t-label);color:var(--color-neutral-700);background:var(--surface-2);border-radius:var(--radius);padding:2px 7px;max-width:100%}
      .mig-hit b{white-space:nowrap}
      .mig-hit-n{max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-dup-link select{max-width:112px}
      .mig-hit-k,.mig-hit-more{font-size:var(--t-label);color:var(--color-neutral-600)}
      ${''/* CHECK ALL N: the file's own words beside the facts */}
      .mig-ck-bar{display:flex;align-items:center;gap:var(--s-2);min-height:var(--ctl-h)}
      .mig-ck-back{appearance:none;border:0;background:none;padding:0;font:inherit;font-size:var(--t-meta);color:var(--accent-ink);cursor:pointer;white-space:nowrap}
      .mig-ck-back:hover{text-decoration:underline}
      .mig-ck-t{margin:0 0 0 var(--s-2);font-size:var(--t-card);font-weight:var(--w-strong)}
      .mig-ck-pos{font-size:var(--t-meta);color:var(--color-neutral-600);white-space:nowrap}
      .mig-ck{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:var(--s-3);align-items:start}
      .mig-ck .mig-card{display:flex;flex-direction:column;max-height:calc(var(--view-h,100vh) - 2 * var(--s-3) - 8px);overflow:hidden}
      .mig-ck-h{flex:none;display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--color-divider);min-width:0;font-size:var(--t-meta);color:var(--color-neutral-600)}
      .mig-ck-h b{font-size:var(--t-body);color:var(--color-text);font-weight:var(--w-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
      .mig-ck-h span{white-space:nowrap}
      .mig-ck-page{flex:1 1 auto;min-height:0;overflow:auto;padding:16px;background:var(--surface-2)}
      .mig-ck-page > *{background:var(--color-surface);border:1px solid var(--color-divider)}
      .mig-ck-title{font-family:var(--font-doc,inherit);font-weight:var(--w-strong);text-align:center;letter-spacing:.04em;padding:20px 24px 0;border-bottom:0}
      .mig-ck-title + .mig-ck-text{border-top:0}
      .mig-ck-text{font-family:var(--font-doc,inherit);font-size:var(--t-body);line-height:1.75;white-space:pre-wrap;overflow-wrap:anywhere;padding:14px 24px 22px}
      .mig-ck-wait{margin:0;padding:16px;font-size:var(--t-meta);color:var(--color-neutral-700)}
      .mig-ck-m{background:var(--st-green-bg);color:inherit;border-radius:3px;padding:0 2px}
      .mig-ck-m.is-need{background:var(--st-amber-bg)}
      .mig-ck-sup{font-size:10px;font-weight:var(--w-strong);color:var(--color-neutral-700);margin-left:1px}
      .mig-ck-body{flex:1 1 auto;min-height:0;overflow:auto;padding:4px 16px 8px}
      .mig-ck-body .mig-ffs{border-top:0}
      .mig-ck-body .mig-ff{grid-template-columns:110px minmax(0,1fr)}
      .mig-ck-foot{flex:none;display:flex;align-items:center;gap:8px;padding:10px 16px;border-top:1px solid var(--color-divider)}
      .mig-why-p{margin:0 0 6px}
      .mig-why-p:last-child{margin-bottom:0}
      .mig-ck-next{padding:4px 14px 14px}
      .mig-ck-nl{display:flex;flex-direction:column;border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden}
      .mig-ck-nr{appearance:none;border:0;background:var(--color-surface);text-align:left;padding:9px 12px;font:inherit;cursor:pointer;display:flex;flex-direction:column;gap:2px;min-width:0}
      .mig-ck-nr + .mig-ck-nr{border-top:1px solid var(--color-divider)}
      .mig-ck-nr:hover{background:var(--surface-2)}
      .mig-ck-nf{font-size:var(--t-meta);font-weight:var(--w-label);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .mig-ck-nw{font-size:var(--t-label);color:var(--color-neutral-600)}
    </style>
    ${canEdit()?`<input id="mig-files" type="file" multiple accept="${MIG_ACCEPT}" style="display:none"><input id="mig-sheet-file" type="file" accept=".csv" style="display:none">`:''}
    ${_migCheck?migCheckHtml():`
      ${canEdit()?migDropCardHtml():`<div class="mig-warn">${i18t('mig_viewers_readonly')}</div>`}
      <section class="mig-card mig-list" id="mig-list">${migListHtml()}</section>
      ${migReconHtml()}`}
    <aside class="ins-panel mig-side" id="mig-side" aria-label="${migEsc(i18t('mig_side_label'))}"></aside>
  </div>`;

  // wiring: the drop strip and its boxes are drawn again each paint, so bound here
  if(M.unfinished==null && API_MODE()){ M.unfinished=[]; migLoadUnfinished(); }
  const fi=document.getElementById('mig-files');
  fi?.addEventListener('change',()=>{ if(fi.files.length) migProcessFiles(fi.files); fi.value=''; });
  const drop=document.getElementById('mig-drop');
  if(drop){
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('dragover'); }));
    // Both entry points hand the whole selection to migProcessFiles, which owns
    // the empty-file rule — a folder is walked first (migDropTake).
    drop.addEventListener('drop',e=>{ if(e.dataTransfer) migDropTake(e.dataTransfer); });
    document.getElementById('mig-status')?.addEventListener('change',e=>{ M.defaults.status=e.target.value; });
    bindFolderSelect(document.getElementById('mig-folder'), v=>{ M.defaults.folder=v; });
    const mf=document.getElementById('mig-manifest-file');
    document.getElementById('mig-manifest-btn')?.addEventListener('click',()=>mf.click());
    mf?.addEventListener('change',()=>{ if(mf.files[0]) migLoadManifest(mf.files[0]); });
    document.getElementById('mig-manifest-tpl')?.addEventListener('click',migManifestTemplate);
  }
  const sf=document.getElementById('mig-sheet-file');
  sf?.addEventListener('change',()=>{ if(sf.files[0]) migImportSheet(sf.files[0]); sf.value=''; });
  migWireCancel();
  migSidePaint();
  migFormPut(document.getElementById('content'), keep);
  migPaintHead();
  setActiveNav('migration');
  /* the check view's file is read whole once (the list is light) */
  const ck=migCheckId()&&getContract(migCheckId());
  if(ck&&ck._light!==false&&typeof ensureFull==='function'){ const want=ck.id;
    Promise.resolve(ensureFull(ck)).then(()=>{ if(migCheckId()===want) renderMigration(); }).catch(()=>{}); }
}
/* the customer's list against what arrived (kept as it was) */
function migReconHtml(){
  const M=migState(), cs=migContracts();
  if(!M.manifest) return '';
  const missing=M.manifest.filter(r=>!r.matchedId), extra=cs.filter(c=>!c.migration.manifest).length;
  if(!missing.length&&!extra) return '';
  return `<section class="mig-card" style="padding:14px var(--s-4)">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-card);margin:0 0 var(--s-2)">${i18t('mig_reconciliation')}</h3>
    ${missing.length?`
      <div style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-ruby-fg);margin-bottom:var(--s-1)">${missing.length} manifest row${missing.length===1?'':'s'} with no file received:</div>
      <div class="scroll-thin" style="max-height:180px;overflow-y:auto;margin-bottom:var(--s-2)">
        ${missing.map(r=>`<div style="display:flex;gap:var(--s-2);font-size:var(--t-meta);padding:var(--s-1) 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
          <span style="font-family:var(--font-mono);color:var(--color-neutral-600);flex:none">${migEsc(r.file||'—')}</span>
          <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(r.name||'')}${r.counterparty?' · '+migEsc(r.counterparty):''}</span>
        </div>`).join('')}
      </div>
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:0">Chase these with the customer — a contract on the checklist that never arrived is the most common way migrations silently lose paper.</p>`:''}
    ${extra?`<p style="font-size:var(--t-meta);color:var(--st-amber-fg);margin:${missing.length?'8px':'0'} 0 0">${extra} imported file${extra===1?'':'s'} had no manifest row — worth confirming they belong in this migration.</p>`:''}
  </section>`;
}

/* ---- ONE LISTENER EACH, ARMED ONCE AT LOAD (A LISTENER ON A PAINTED ELEMENT
   IS BOUND ONCE): the page and its panel are painted again on every choice,
   so every press below reads the live element at press time ---- */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !(typeof window !== 'undefined' && window._migWired)){
  if (typeof window !== 'undefined') window._migWired = true;
  const inPage = t => t.closest('.mig-page') || t.closest('#page-head');
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || !inPage(t)) return;
    let el;
    if ((el = t.closest('#mig-choose'))){ document.getElementById('mig-files')?.click(); return; }
    if (!t.closest('.mig-page')) return;
    if ((el = t.closest('[data-open]'))){ e.stopPropagation(); openWorkspace(el.getAttribute('data-open')); return; }
    if ((el = t.closest('#mig-drop'))){ document.getElementById('mig-files')?.click(); return; }
    if ((el = t.closest('[data-mig-show]'))){ migShowSet(el.getAttribute('data-mig-show')); migLandFirst(); return; }
    if ((el = t.closest('[data-mig-all]'))){ _migShow = 'all'; _migAll = true; migListPaint(); migBandPaint(); return; }
    if ((el = t.closest('#mig-check-all'))){ migCheckOpen(); return; }
    if ((el = t.closest('#mig-sheet'))){ migSheetMenu(el); return; }
    if ((el = t.closest('#mig-rerun'))){ migRerunAi(); return; }
    if ((el = t.closest('[data-dismiss-batch]'))){ migDismissBatch(el.getAttribute('data-dismiss-batch')); return; }
    if ((el = t.closest('[data-mig-ck-close]'))){ migCheckClose(); return; }
    if ((el = t.closest('[data-mig-ck-go]'))){ migCheckGo(Number(el.getAttribute('data-mig-ck-go'))); return; }
    if ((el = t.closest('[data-mig-ck-to]'))){ migCheckTo(el.getAttribute('data-mig-ck-to')); return; }
    if ((el = t.closest('[data-mig-ck-skip]'))){ migCheckGo(_migCheck && _migCheck.i >= _migCheck.ids.length - 1 ? -(_migCheck.ids.length - 1) : 1); return; }
    if ((el = t.closest('[data-mig-file]'))){
      const form = el.closest('[data-mig-form]'); const inCheck = el.hasAttribute('data-mig-ck-file');
      el.disabled = true;
      migFileIt(el.getAttribute('data-mig-file'), form).then(ok => {
        if (!ok){ el.disabled = false; return; }
        if (inCheck) migCheckNext(); else renderMigration();
      });
      return;
    }
    /* THE WHOLE REVIEW WINDOW, KEPT (openMigReview): every fact the reading
       holds (law, notice, payment terms…), confirmed in the same ONE save a
       signed paper takes — File it is the drawn short way */
    if ((el = t.closest('[data-mig-review-full]'))){
      const c = getContract(el.getAttribute('data-mig-review-full')); if (!c) return;
      const inCheck = el.hasAttribute('data-mig-ck-file');
      openMigReview(c, { onDone:ok => { if (!ok) return; if (inCheck) migCheckNext(); else renderMigration(); } });
      return;
    }
    if ((el = t.closest('[data-mig-check-one]'))){ migCheckOpen(el.getAttribute('data-mig-check-one')); return; }
    if ((el = t.closest('[data-mig-renews]'))){
      const form = el.closest('[data-mig-form]'); const box = form && form.querySelector('[data-mig-f="expiryDate"]');
      if (box){ box.value = i18t('mig_renews'); migFormGatePaint(form); box.focus(); }
      return;
    }
    if ((el = t.closest('[data-mig-use]'))){
      const form = document.querySelector('#mig-ck-facts[data-mig-form]'); const box = form && form.querySelector('[data-mig-f="expiryDate"]');
      if (box){ box.value = el.getAttribute('data-mig-use') === 'renews' ? i18t('mig_renews') : migDay(el.getAttribute('data-iso')); migFormGatePaint(form);
        if (typeof landOn === 'function') landOn(() => form.querySelector('[data-mig-file]'), { block:'nearest' }); }
      return;
    }
    if ((el = t.closest('[data-mig-side-link]'))){ const c = getContract(el.getAttribute('data-mig-side-link')); if (c) openLinkModal(c, () => renderMigration()); return; }
    if ((el = t.closest('[data-dup-skip]'))){ migResolveDuplicate(Number(el.getAttribute('data-dup-skip')), 'skip'); return; }
    if ((el = t.closest('[data-dup-import]'))){ migResolveDuplicate(Number(el.getAttribute('data-dup-import')), 'import'); return; }
    if ((el = t.closest('[data-dup-link]'))){
      const i = Number(el.getAttribute('data-dup-link')), box = el.closest('.mig-cf') || document;
      migResolveDuplicate(i, 'link', box.querySelector(`[data-dup-parent="${i}"]`)?.value, box.querySelector(`[data-dup-rel="${i}"]`)?.value);
      return;
    }
    /* A PRESS CHOOSES, A SECOND PRESS LETS IT GO (round 22, Jambo's panel) */
    if ((el = t.closest('.mig-table tbody tr[data-row]'))){ migPickSet(el.getAttribute('data-row')); return; }
  });
  document.addEventListener('dblclick', e => {
    const tr = e.target && e.target.closest ? e.target.closest('.mig-page .mig-table tbody tr[data-row]') : null; if (!tr) return;
    const id = tr.getAttribute('data-row'); if (getContract(id)) selectContract(id);
  });
  document.addEventListener('keydown', e => {
    const tr = e.target && e.target.closest ? e.target.closest('.mig-page .mig-table tbody tr[data-row]') : null;
    if (tr && e.target === tr && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      const id = tr.getAttribute('data-row');
      if (e.key === 'Enter' && id === _migPick && getContract(id)) selectContract(id); else migPickSet(id);
      return;
    }
    const d = e.target && e.target.closest ? e.target.closest('.mig-page #mig-drop') : null;
    if (d && e.target === d && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); document.getElementById('mig-files')?.click(); }
  });
  document.addEventListener('input', e => {
    const f = e.target && e.target.closest ? e.target.closest('[data-mig-form]') : null;
    if (f && e.target.matches('[data-mig-f]')) migFormGatePaint(f);
  });
  document.addEventListener('change', async e => {
    const s = e.target && e.target.matches ? e.target : null;
    if (!s || !s.matches('select[data-mig-f="folder"]')) return;
    const f = s.closest('[data-mig-form]'); const c = f && getContract(f.getAttribute('data-mig-form')); if (!c) return;
    /* THE ONE STREAM WRITER (ktFolderMove): it asks who will see it, then moves it */
    let moved = false;
    if (s.value === '__new__'){ const nf = (typeof promptNewFolder === 'function') ? await promptNewFolder() : null; if (nf) moved = await ktFolderMove(c, nf.id); }
    else moved = (typeof ktFolderMove === 'function') ? await ktFolderMove(c, s.value) : false;
    if (!moved){ s.value = c.folder || ''; return; }
    renderMigQueue(); migSidePaint(); if (_migCheck) renderMigration();
  });
}

Object.assign(window,{migPickSet,migSideHtml:migSideRowHtml,migSideRowHtml,migSideFacts,migSidePaint,migSideSay,migShowPass,migShowSet,MIG_SHOWS,MIG_ROWS_SHOWN,migShown,migRows,migRowByKey,migStateOf,migQueueState,migCheckWhy,migDupeWhy,migKpis,migHeadFacts,migPaintHead,migBandHtml,migCostLine,migCallsOf,migAllowanceWords,migDropCardHtml,migListHtml,migFolderFor,
  migFormOf,migFormHtml,migFormRead,migFormWaits,migWaitWords,migFileIt,migDateRead,migFind,migDateAt,migAmountAt,migRenewAt,migClauseAt,migFoundAt,migFormMarks,
  migCheckOpen,migCheckClose,migCheckGo,migCheckIds,migCheckId,migCheckNext,migCheckHtml,migDocHtml,migWhyHtml,migSheetMenu,migFilesFromDrop,migDropTake,migPlace,migPlacePut,
  migBuildAndSave,migIndexContract,migDrawAllowanceDoc,migResolveDuplicate,migDupeRowHtml,migWireDupes,migEstimate,migConfirmEstimate,migLoadAiState,migGuessPages,applyReviewedMeta,migContracts,migExportSheet,migGates,migImportSheet,migLoadManifest,migLoadUnfinished,migDismissBatch,migUnfinishedHtml,migDateOrder,migParseDate,migParseValue,migNeedsReview,migProcessFiles,migReviewAll,migRerunAi,migState,openMigReview,parseCsv,renderMigration,renderMigQueue});
