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
const MIG_CRITICAL = ['counterparty','contractType','effectiveDate','expiryDate','value'];

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
/* Route a contract-type phrase to a value-stream folder (order matters:
   "equipment lease" must land in mfg before the generic "lease" → corp). */
function folderFromType(typeStr){
  const t=String(typeStr||'').toLowerCase();
  if(!t) return null;
  if(/equipment|machin|plant\s*lease|forklift/.test(t)) return 'mfg';
  if(/co-?pack|toll|manufactur|production/.test(t)) return 'mfg';
  if(/raw material|ingredient|commodity|packag|bottle|carton|supply agreement|procure/.test(t)) return 'proc';
  if(/warehous|cold[\s-]?chain|3pl|freight|logistic|transport|distribution(?!\s*agreement)|haul/.test(t)) return 'dist';
  if(/distributor|retail|listing|route.to.market|e-?commerce|sales/.test(t)) return 'sales';
  if(/marketing|media|agency|advertis|sponsor|activation|brand|influencer/.test(t)) return 'mktg';
  if(/nda|non.disclosure|confidential|lease|tenanc|audit|legal|professional|consult|advisory|insurance|software|licen[cs]e|saas|it\s|employment/.test(t)) return 'corp';
  return null;
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
const migMoney = n => '$'+Number(n||0).toFixed(2);
/* Show the estimate and, above the admin-set threshold, require an explicit
   yes. Returns true to proceed. */
async function migConfirmEstimate(files){
  if(!API_MODE()||!state.aiConfigured) return true;
  const est=migEstimate(files);
  const lim=(state.aiCfg||{}).limits||{};
  const threshold=Number(lim.estimateConfirmAt!=null?lim.estimateConfirmAt:1);
  const M=migState();
  M.lastEstimate=est;
  const a=M.allowance;
  /* U-4: an open onboarding allowance IS the admin's explicit pre-authorisation
     for onboarding spend — it is set deliberately and burns down visibly on this
     screen — so it should not also greet the user with a blocking "you may be
     charged" dialog on the headline action of the whole migration journey. Only
     prompt when the batch draws on the day-to-day budget and clears the
     threshold. The estimate itself still shows on screen, framed as an estimate. */
  if(a&&a.open) return true;
  if(!(threshold>0) || est.worstCase<threshold) return true;
  return await confirmDialog({
    get title(){ return i18t('mig_run_batch'); },
    message:`${est.docs} document${est.docs===1?'':'s'}, about ${est.pages} page${est.pages===1?'':'s'} — estimated ${migMoney(est.extractCost)} to read the details`
      + `, up to ${migMoney(est.worstCase)} if every one turns out to be a scan needing OCR.`
      + (est.thorough?' Thorough extraction is on, which multiplies the cost.':'')
      + (a&&a.open?` This draws on the onboarding allowance (${migMoney(a.spent)} of ${a.budget>0?migMoney(a.budget):'no cap'} used).`:' This draws on the daily Copilot budget.')
      + ' These are estimates from file sizes, not charges — the real figure lands in Team & Settings as the batch runs.',
    confirmLabel:'Run the batch' });
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
        : e.spendLimit ? 'Daily Copilot budget reached — the rest of this batch is pattern-matched'
        : /limit/i.test(e.message) ? 'Copilot rate limit reached'
        : 'Copilot unavailable ('+e.message+')';
    }
  }
  if(!meta){ meta=heuristicExtract(text); meta._source='heuristic'; }
  if(seed){ meta.confidence=meta.confidence||{};
    for(const [k,v] of Object.entries(seed)){ if(v!=null&&v!==''){ meta[k]=v; meta.confidence[k]='high'; } } }
  return meta;
}
/* Does the extraction need a human? Any critical field missing or low-conf. */
function migNeedsReview(meta, c){
  const conf=(meta&&meta.confidence)||{};
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
  if(isOcrText(src)) return true;
  return MIG_CRITICAL.some(k=>{
    const v=meta?meta[k]:null;
    if(k==='value' && c.valueType==='none') return false;
    if(v==null||v===''||(k==='value'&&!(Number(v)>0))) return true;
    return conf[k]==='low';
  });
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
  const name=(manifest&&manifest.name)||file.name.replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').trim();
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
    needsReview: !meta || migNeedsReview(meta, c),
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
    aiSource:(meta&&meta._source)||'none' };
  if(manifest) manifest.matchedId=c.id;
  c._loaded=true; c._light=false; c._v=0;
  // A human chose to file this as an amendment of an existing agreement.
  if(link&&link.parentId) applyParentLink(c, link.parentId, link.relation||'amendment',
    link.note||`Linked at import — flagged as a possible duplicate of ${link.parentId}`, u);
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
    step('skipped', 'left out — matched '+(q.dupes||[]).map(d=>d.id).join(', '));
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
    step('saved', action==='link' ? `imported and linked to ${parentId}` : 'imported anyway');
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
  let saved=0, dupes=0, errors=0, words=0, ocrDocs=0, flagged=0, ocrErrors=0, ocrLastError='';
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
          step('duplicate','identical to '+hit+' — skipped'); }
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
      if(readable){
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
        textSource, readable, extractedText, batch, u, link: opts.link,
        // propose a parent when this reads like an amendment AND the
        // counterparty matches — a human confirms on the review screen
        suggest: looksLikeAmendment(file.name, extractedText) });
      q.id=c.id; saved++;
      migIndexContract(c, upload); byHash.set(upload.fileHash, c.id);
      await migDrawAllowanceDoc();
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
  toast(`Batch ${batch}${M.cancelled?' stopped':''}: ${saved} imported${ocrDocs?`, ${ocrDocs} read by OCR`:''}${ocrErrors?`, ${ocrErrors} scan${ocrErrors===1?'':'s'} could not be read (${ocrLastError})`:''}${flagged?`, ${flagged} possible duplicate${flagged===1?'':'s'} waiting for your call`:''}${dupes?`, ${dupes} identical file${dupes===1?'':'s'} skipped`:''}${words?`, ${words} Word file${words===1?'':'s'} refused (save as PDF)`:''}${errors?`, ${errors} failed`:''}${M.cancelled?`, ${M.queue.filter(q=>q.status==='cancelled').length} cancelled`:''}`);
  renderMigration();
}

/* ---------- review flow (human confirms the machine's guesses) ---------- */
function applyReviewedMeta(c, m){
  c.metadata=m;
  if(m.counterparty) c.counterparty=m.counterparty;
  if(m.value!=null&&Number(m.value)>0){ c.value=Number(m.value); if(c.valueType==='none') c.valueType='estimated'; }
  if(m.expiryDate) c.expiry=m.expiryDate;
  if(c.migration){ c.migration.needsReview=false; c.migration.blocked=null; }
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
    if(opts.onDone) opts.onDone(true); else renderMigration(); toast(`${c.id} confirmed`); },
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
    if(btn) btn.textContent=`Re-running Copilot… ${done}/${todo.length}`;
    try{ await ensureFull(c); }catch(e){}
    const text=(c.upload&&c.upload.extractedText)||'';
    if(text.length<200) continue;
    const meta=await migExtract(text, c.counterparty?{counterparty:c.counterparty}:null);
    if(meta._source!=='ai') break;
    if(isOcrText((c.upload&&c.upload.textSource)||(c.migration&&c.migration.textSource))) capConfidenceForOcr(meta);
    c.metadata=meta;
    if(meta.counterparty&&!c.counterparty) c.counterparty=meta.counterparty;
    if(meta.value&&!(Number(c.value)>0)){ c.value=Number(meta.value)||0; if(c.valueType==='none') c.valueType='estimated'; }
    if(meta.expiryDate&&!c.expiry) c.expiry=meta.expiryDate;
    logAudit(c,'Copilot extraction','Re-ran Copilot metadata extraction over the stored document text');
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
    return [c.id, c.upload&&c.upload.fileName||'', c.name, c.counterparty||'', m.contractType||'',
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
    const c=getContract(g(r,iId)); if(!c||!c.migration){ missed++; continue; }
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
/* Onboarding allowance strip — the batch's budget, burning down in front of
   the person running it. Rendered in the intake card and refreshed after each
   document so it moves while the batch runs. */
function migAllowanceHtml(){
  const M=migState();
  if(!API_MODE()||!state.aiConfigured) return '';
  const a=M.allowance;
  if(!a||!a.open){
    return `<div style="font-size:12px;color:var(--color-neutral-600);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:7px 10px;margin-bottom:12px">
      ${i18t('mig_batch_draws')}</div>`;
  }
  const moneyPct=a.budget>0?Math.min(100,Math.round((a.spent||0)/a.budget*100)):0;
  const docsPct=a.docs>0?Math.min(100,Math.round((a.docsUsed||0)/a.docs*100)):0;
  const pct=Math.max(moneyPct,docsPct);
  const done=a.exhausted;
  return `<div id="mig-allowance" style="font-size:13px;color:${done?'var(--st-ruby-fg)':'var(--color-accent-800)'};background:${done?'var(--st-ruby-bg)':'var(--color-accent-100)'};border:1px solid ${done?'var(--st-ruby-line)':'var(--color-divider)'};border-radius:0;padding:8px 10px;margin-bottom:12px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <span style="font-weight:600">${done?'Onboarding allowance used up':'Onboarding allowance'}</span>
      ${a.budget>0?`<span style="font-family:var(--font-mono)">${migMoney(a.spent)} / ${migMoney(a.budget)}</span>`:`<span>${i18t('mig_no_money_cap')}</span>`}
      ${a.docs>0?`<span style="font-family:var(--font-mono)">${a.docsUsed} / ${a.docs} docs</span>`:''}
    </div>
    <div style="height:5px;background:color-mix(in srgb,var(--color-text) 10%,transparent);border-radius:0;overflow:hidden;margin-top:6px">
      <div style="width:${pct}%;height:100%;background:${done?'var(--st-ruby-fg)':pct>=80?'var(--st-amber-dot)':'var(--st-green-dot)'};transition:width .3s"></div></div>
    ${done?`<div style="margin-top:6px;line-height:1.5">The import carries on with the built-in pattern matcher — nothing fails and nothing is lost, but extracted details will need more review. An admin can top the allowance up in Team &amp; Settings.</div>`:''}
  </div>`;
}
function migKpis(){
  const cs=migContracts();
  return { total:cs.length,
    agreements:cs.filter(c=>!c.parentId).length,
    linkPending:cs.filter(c=>c.linkSuggestions&&c.linkSuggestions.length&&!c.parentId&&!c.linkConfirmed).length,
    complete:cs.filter(migComplete).length,
    review:cs.filter(c=>c.migration.needsReview).length,
    blocked:cs.filter(c=>c.migration.blocked).length };
}
const MIG_QSTATE = {
  waiting:   {t:'Waiting',        c:'var(--color-neutral-500)'},
  reading:   {t:'Reading file…',  c:'var(--color-accent-700)'},
  extracting:{t:'Extracting text…',c:'var(--color-accent-700)'},
  ai:        {t:'Copilot extracting…', c:'var(--color-accent-700)'},
  matching:  {t:'Pattern-matching…',c:'var(--st-amber-fg)'},
  ocr:       {t:'Reading scan…',  c:'var(--color-accent-700)'},
  saved:     {t:'Imported',       c:'var(--st-green-fg)'},
  duplicate: {t:'Duplicate',      c:'var(--st-amber-fg)'},
  dupe:      {t:'Duplicate?',     c:'var(--st-amber-fg)'},
  skipped:   {t:'Skipped',        c:'var(--color-neutral-500)'},
  word:      {t:'Word — not read',c:'var(--st-ruby-fg)'},
  cancelled: {t:'Cancelled',      c:'var(--color-neutral-500)'},
  error:     {t:'Failed',         c:'var(--st-ruby-fg)'},
};
function renderMigQueue(){
  const host=document.getElementById('mig-queue'); if(!host) return;
  const M=migState();
  if(!M.queue.length){ host.innerHTML=''; return; }
  // A cancelled row was abandoned, not processed. Counting it as done filled the
  // bar to 100% and captioned it "finished" after abandoning most of a batch.
  const settled=M.queue.filter(q=>['saved','duplicate','error','word','skipped'].includes(q.status)).length;
  const cancelled=M.queue.filter(q=>q.status==='cancelled').length;
  const done=settled;
  const pct=Math.round(settled/M.queue.length*100);
  host.innerHTML=`
    <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:14px 16px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-size:14px;font-weight:600">${M.running?'Importing batch '+(M.batch||''):'Batch '+(M.batch||'')+(cancelled?' stopped':' finished')}</span>
        <span style="font-size:12px;color:var(--color-neutral-600);font-family:var(--font-mono)">${done}/${M.queue.length}${cancelled?` · ${cancelled} cancelled`:''}</span>
        <span style="flex:1"></span>
        ${M.running?`<button id="mig-cancel" class="ui-btn" style="font-size:13px;padding:4px 10px">${i18t('mig_stop_after_current')}</button>`:''}
      </div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:0;overflow:hidden;margin-bottom:10px"><div style="width:${pct}%;height:100%;background:var(--color-accent);transition:width .3s"></div></div>
      ${M.ocrError?`<div style="font-size:13px;color:var(--st-amber-fg);background:var(--st-amber-bg);border:1px solid var(--st-amber-line);border-radius:0;padding:7px 10px;margin-bottom:8px">A scanned document could not be read: ${migEsc(M.ocrError)}. Those files were imported with no text — open each one and enter the details, or fix the reader and use “Re-run Copilot extraction”.</div>`:''}
      ${M.aiDown?`<div style="font-size:13px;color:var(--st-amber-fg);background:var(--st-amber-bg);border:1px solid var(--st-amber-line);border-radius:0;padding:7px 10px;margin-bottom:8px">${migEsc(M.aiDownMsg||'Copilot unavailable')} — remaining files use the built-in pattern-matcher and are flagged for review. Use “Re-run Copilot extraction” once the limit resets.</div>`:''}
      <div class="scroll-thin" style="max-height:260px;overflow-y:auto">
        ${M.queue.map((q,i)=>{ const s=MIG_QSTATE[q.status]||MIG_QSTATE.waiting;
          const active=['reading','extracting','ai','matching','ocr'].includes(q.status);
          return `<div style="padding:5px 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:13px">
           <div style="display:flex;align-items:center;gap:9px">
            <span ${active?'class="scan-pulse"':''} style="width:7px;height:7px;border-radius:50%;background:${s.c};flex:none"></span>
            <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(q.name)}</span>
            ${q.id?`<button data-open="${q.id}" style="border:0;background:none;cursor:pointer;font-family:var(--font-mono);font-size:12px;color:var(--color-accent-700);padding:0">${q.id}</button>`:''}
            <span style="flex:none;font-size:12px;font-weight:600;color:${s.c}">${s.t}</span>
            ${q.note?`<span style="flex:none;font-size:12px;color:var(--color-neutral-600);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${migEsc(q.note)}">${migEsc(q.note)}</span>`:''}
           </div>
           ${migDupeRowHtml(q, i)}
          </div>`; }).join('')}
      </div>
    </section>`;
  wireOpens(host);
  migWireCancel();
  migWireDupes(host);
  // keep the allowance strip in step with the batch as it burns down
  const al=document.getElementById('mig-allowance');
  if(al) al.outerHTML=migAllowanceHtml();
}
/* The three-way duplicate decision, inline on the queue row. A skipped exact
   match also lists the contract it matched, so nothing ever silently vanishes. */
function migDupeRowHtml(q, i){
  if(!q.dupes||!q.dupes.length) return '';
  const M=migState();
  const pending = q.status==='dupe' && (M.pending||{})[i];
  const hit=d=>{ const c=getContract(d.id);
    return `<span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--color-neutral-700);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:0;padding:2px 7px">
      <b style="font-family:var(--font-mono)">${d.id}</b>
      <span style="max-width:170px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(c?c.name:'')}</span>
      <span style="color:var(--color-neutral-500)">${DUP_LABEL[d.kind]}${d.distance!=null&&d.kind!=='exact'&&d.kind!=='text'?` · distance ${d.distance}`:''}</span></span>`; };
  const btn='font:inherit;font-size:12px;font-weight:600;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:3px 9px;cursor:pointer';
  const parentOpts=q.dupes.map(d=>`<option value="${d.id}">${d.id}</option>`).join('');
  return `<div style="margin:5px 0 3px 16px;display:flex;flex-direction:column;gap:5px">
    <div style="display:flex;flex-wrap:wrap;gap:5px">${q.dupes.map(hit).join('')}${q.dupeTotal>q.dupes.length?`<span style="font-size:12px;color:var(--color-neutral-500);align-self:center">+${q.dupeTotal-q.dupes.length} more</span>`:''}</div>
    ${pending?`<div style="display:flex;flex-wrap:wrap;align-items:center;gap:6px">
      <button data-dup-skip="${i}" style="${btn}">${i18t('mig_skip')}</button>
      <button data-dup-import="${i}" style="${btn}">${i18t('mig_import_anyway')}</button>
      <span style="display:inline-flex;align-items:center;gap:5px">
        <button data-dup-link="${i}" style="${btn};border-color:var(--color-accent);color:var(--color-accent-800)">${i18t('mig_import_link_as')}</button>
        <select data-dup-rel="${i}" style="font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:3px 5px">
          ${CONTRACT_RELATIONS.map(r=>`<option value="${r.k}">${r.label}</option>`).join('')}</select>
        <span style="font-size:12px;color:var(--color-neutral-600)">of</span>
        <select data-dup-parent="${i}" style="font:inherit;font-size:12px;font-family:var(--font-mono);border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:3px 5px">${parentOpts}</select>
      </span>
    </div>`:''}
  </div>`;
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
  document.getElementById('mig-cancel')?.addEventListener('click',()=>{ migState().running=false; toast(i18t('mig_stopping'),'warn'); });
}
function migGateDots(c){
  return migGates(c).map(g=>`<span title="${g.label}${g.ok?'':' — missing'}" style="width:8px;height:8px;border-radius:50%;display:inline-block;background:${g.ok?'var(--st-green-dot)':'var(--color-neutral-300)'};border:1px solid ${g.ok?'var(--st-green-dot)':'var(--color-neutral-400)'}"></span>`).join('');
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
    <div style="font-size:13px;color:var(--st-ruby-fg);background:var(--st-ruby-bg);border:1px solid var(--st-ruby-line);border-radius:0;padding:9px 11px;margin-bottom:10px">
      <div style="font-weight:600;margin-bottom:4px">Batch ${migEsc(b.id)} did not finish — ${b.missed.length} file${b.missed.length===1?'':'s'} ${b.missed.length===1?'was':'were'} not imported.</div>
      <div style="margin-bottom:5px">Started ${migEsc(String(b.startedAt||'').slice(0,16).replace('T',' '))}${b.startedBy?' by '+migEsc(b.startedBy):''}. Drop these files again to finish the job:</div>
      <ul style="margin:0 0 6px;padding-left:16px;line-height:1.6">${b.missed.slice(0,15).map(x=>`<li>${migEsc(x.name)}${x.note?` — ${migEsc(x.note)}`:''}</li>`).join('')}</ul>
      ${b.missed.length>15?`<div style="margin-bottom:6px">…and ${b.missed.length-15} more.</div>`:''}
      <button data-dismiss-batch="${migEsc(b.id)}" class="ui-btn" style="font-size:12px;padding:3px 9px">${i18t('mig_dismiss')}</button>
    </div>`).join('');
}
function renderMigration(){
  const M=migState();
  const cs=migContracts();
  const k=migKpis();
  const heur=cs.filter(c=>c.migration.needsReview&&c.migration.aiSource!=='ai').length;
  const recon=M.manifest?{
    matched:M.manifest.filter(r=>r.matchedId).length,
    missing:M.manifest.filter(r=>!r.matchedId),
    extra:cs.filter(c=>!c.migration.manifest).length }:null;
  const folderOpts=folderOptionsHtml(M.defaults.folder||'auto', true);
  const statusOpts=[['Signed','Executed — signed outside HaTi'],['Under Review','In Review'],['Draft','Drafting']]
    .map(([v,l])=>`<option value="${v}" ${M.defaults.status===v?'selected':''}>${l}</option>`).join('');
  const kpi=(n,label,color)=>`<div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;padding:18px 20px;box-shadow:var(--shadow-sm)">
      <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${color||'var(--color-text)'};line-height:1;font-variant-numeric:tabular-nums">${n}</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);margin-top:6px">${label}</div></div>`;
  const selStyle='font:inherit;font-size:13px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:5px 7px;color:inherit;cursor:pointer';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:var(--page-pad)">
    <style>
      .mig-table{width:100%;border-collapse:collapse;font-size:14px}
      .mig-table th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);padding:12px 14px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:var(--color-neutral-100)}
      .mig-table td{padding:12px 14px;border-bottom:1px solid var(--color-divider);vertical-align:middle}
      /* The reference's KPI strip: two up on a phone, four on a tablet, five on
         a desktop — a real grid, so the tiles line up instead of flexing to
         whatever their number happens to be. */
      .mig-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
      @media (min-width:640px){ .mig-kpis{grid-template-columns:repeat(4,minmax(0,1fr))} }
      @media (min-width:1024px){ .mig-kpis{grid-template-columns:repeat(5,minmax(0,1fr))} }
      .mig-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      #mig-drop{border:2px dashed var(--color-divider);border-radius:0;padding:32px 16px;
        text-align:center;cursor:pointer;transition:border-color .15s,background .15s}
      #mig-drop:hover{border-color:var(--color-accent)}
      #mig-drop.dragover{border-color:var(--color-accent);background:var(--color-accent-100)}
    </style>
    <div style="display:flex;flex-direction:column;gap:12px">

      <!-- KPI strip -->
      <div id="mig-kpis" class="mig-kpis">
        ${kpi(k.agreements===k.total?k.total:`${k.agreements}<span style="font-size:14px;color:var(--color-neutral-500)"> · ${k.total}</span>`, k.agreements===k.total?i18t('mig_contracts_migrated'):i18t('mig_agreements_documents'))}
        ${kpi(k.complete,'Fully migrated', k.total&&k.complete===k.total?'var(--st-green-fg)':undefined)}
        ${kpi(k.review,i18t('mig_need_review'), k.review?'var(--st-amber-fg)':'var(--st-green-fg)')}
        ${kpi(k.blocked,i18t('mig_no_text'), k.blocked?'var(--st-ruby-fg)':'var(--st-green-fg)')}
        ${k.linkPending?kpi(k.linkPending,'Link decision waiting','var(--st-amber-fg)'):''}
        ${recon?kpi(`${recon.matched}/${M.manifest.length}`,'Manifest matched', recon.matched===M.manifest.length?'var(--st-green-fg)':'var(--st-amber-fg)'):''}
      </div>

      ${canEdit()?`
      <!-- intake -->
      <section class="blueprint" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:20px;border-radius:0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="display:inline-flex;color:var(--color-accent)">${icon('upload')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">${i18t('mig_bulk_import')}</h3>
        </div>
        <p style="font-size:13px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">${i18t('mig_drop_all',{max:uploadMaxLabel(),how:API_MODE()&&state.aiConfigured?i18t('mig_read_by_copilot'):i18t('mig_pattern_matched')})} ${API_MODE()?'':`<strong>${i18t('mig_static_mode')}</strong>`}</p>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <label style="display:flex;align-items:center;gap:7px;font-size:13px;color:var(--color-neutral-700)">${i18t('mig_import_as')}
            <select id="mig-status" style="${selStyle}">${statusOpts}</select></label>
          <label style="display:flex;align-items:center;gap:7px;font-size:13px;color:var(--color-neutral-700)">${i18t('mig_file_under')}
            <select id="mig-folder" style="${selStyle}">${folderOpts}</select></label>
          <span style="flex:1"></span>
          <button id="mig-manifest-btn" class="ui-btn" style="font-size:13px;padding:5px 11px">${icon('list','w-3.5 h-3.5')} ${M.manifest?'Replace manifest':'Load manifest CSV'}</button>
          <button id="mig-manifest-tpl" style="border:0;background:none;cursor:pointer;font-size:12px;color:var(--color-accent-700);text-decoration:underline;padding:0">template</button>
          <input id="mig-manifest-file" type="file" accept=".csv" class="hidden" style="display:none">
        </div>
        ${migAllowanceHtml()}
        ${migUnfinishedHtml()}
        ${M.manifestError?`<div style="font-size:13px;color:var(--st-ruby-fg);background:var(--st-ruby-bg);border:1px solid var(--st-ruby-line);border-radius:0;padding:7px 10px;margin-bottom:8px"><strong>${migEsc(M.manifestError.name)}</strong> was not loaded — ${migEsc(M.manifestError.reason)}.${M.manifest?` Still using <strong>${migEsc(M.manifestName)}</strong>.`:''}</div>`:''}
        ${M.manifest?`<div style="font-size:13px;color:var(--color-accent-800);background:var(--color-accent-100);border:1px solid var(--color-divider);border-radius:0;padding:7px 10px;margin-bottom:12px">${i18t('mig_manifest')} <strong>${migEsc(M.manifestName)}</strong> loaded — ${M.manifest.length} rows. Files are matched by filename; manifest details (counterparty, dates, value, stream, status) take precedence over extraction.${M.manifestDateOrder&&!M.manifestDateOrder.proven?` Slashed dates are being read as <strong>${M.manifestDateOrder.order==='mdy'?'month/day/year':'day/month/year'}</strong>${M.manifestDateOrder.conflict?' — this file contains both orders, so check them':' (nothing in the file settles it either way)'}.`:''} The manifest lives in this session only — re-load it after a refresh to re-run reconciliation.</div>`:''}
        ${(M.manifestProblems&&M.manifestProblems.length)?`<div style="font-size:13px;color:var(--st-amber-fg);background:var(--st-amber-bg);border:1px solid var(--st-amber-line);border-radius:0;padding:8px 10px;margin-bottom:12px">
          <div style="font-weight:600;margin-bottom:4px">${M.manifestProblems.length} value${M.manifestProblems.length===1?'':'s'} in the manifest could not be read — those cells were left empty rather than guessed:</div>
          <ul style="margin:0;padding-left:16px;line-height:1.6">${M.manifestProblems.slice(0,12).map(p=>`<li><strong>${migEsc(p.label)}</strong> · ${migEsc(p.field)}: ${migEsc(p.message)}</li>`).join('')}</ul>
          ${M.manifestProblems.length>12?`<div style="margin-top:4px">…and ${M.manifestProblems.length-12} more.</div>`:''}
        </div>`:''}
        <div id="mig-drop">
          <div style="display:inline-grid;place-items:center;width:40px;height:40px;border-radius:0;background:var(--color-neutral-100);color:var(--color-accent-600);margin-bottom:8px">${icon('upload','w-5 h-5')}</div>
          <div style="font-size:14px;font-weight:600">${i18t('mig_drop_files')}</div>
          <div style="font-size:12px;color:var(--color-neutral-600);margin-top:3px">Up to ${MIG_MAX_FILES} files per batch · duplicates skipped automatically</div>
          <input id="mig-files" type="file" multiple accept="${MIG_ACCEPT}" style="display:none">
        </div>
      </section>`:`<div style="font-size:13px;color:var(--color-neutral-600);background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;padding:12px 14px">${i18t('mig_viewers_readonly')}</div>`}

      <div id="mig-queue">${''}</div>

      <!-- migrated register -->
      ${cs.length?`
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--color-divider)">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">${i18t('mig_migrated_contracts')}</h3>
          <span style="font-size:12px;color:var(--color-neutral-600)">${k.complete}/${k.total} fully migrated</span>
          <span style="flex:1"></span>
          ${canEdit()&&k.review?`<button id="mig-review-all" class="ui-btn ui-btn-primary" style="font-size:13px;padding:5px 12px">${icon('check2','w-3.5 h-3.5')} Review all (${k.review})</button>`:''}
          ${canEdit()&&heur&&API_MODE()&&state.aiConfigured?`<button id="mig-rerun" class="ui-btn" style="font-size:13px;padding:5px 12px">${icon('sparkle','w-3.5 h-3.5')} Re-run Copilot extraction (${heur})</button>`:''}
          <button id="mig-sheet-out" class="ui-btn" style="font-size:13px;padding:5px 12px">${icon('download','w-3.5 h-3.5')} Review sheet</button>
          ${canEdit()?`<button id="mig-sheet-in" class="ui-btn" style="font-size:13px;padding:5px 12px">${icon('upload','w-3.5 h-3.5')} Import sheet</button>
          <input id="mig-sheet-file" type="file" accept=".csv" style="display:none">`:''}
        </div>
        <div class="table-scroll">
          <table class="mig-table">
            <thead><tr>
              <th style="padding-left:12px">ID</th><th>${i18t('mig_col_contract')}</th><th>${i18t('mig_col_stream')}</th>
              <th style="text-align:right">${i18t('mig_col_value')}</th><th>${i18t('mig_col_expiry')}</th><th>${i18t('mig_col_stage')}</th>
              <th>${i18t('mig_col_gates')}</th><th style="text-align:right;padding-right:12px"></th>
            </tr></thead>
            <tbody>
              ${cs.map(c=>{ const m=c.metadata||{};
                const need=c.migration.needsReview;
                return `<tr data-row="${c.id}" style="cursor:pointer">
                <td style="padding-left:12px;font-family:var(--font-mono);font-size:13px;color:var(--color-neutral-600);white-space:nowrap">${c.id}</td>
                <td style="max-width:250px">
                  <span style="display:block;font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.parentId?`<span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:12px">↳ ${RELATION_LABEL[c.relation]||'Amendment'} of ${c.parentId} · </span>`:''}${migEsc(c.name)}</span>
                  <span style="display:block;font-size:12px;color:${c.counterparty?'var(--color-neutral-600)':'var(--st-ruby-fg)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(c.counterparty)||'No counterparty'} · ${migEsc((c.upload&&c.upload.fileName)||'')}</span>
                </td>
                <td style="font-size:13px;color:var(--color-neutral-700);white-space:nowrap">${streamLabel(c)}</td>
                <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:400;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—')}</td>
                <td style="font-size:13px;white-space:nowrap">${c.expiry||m.expiryDate||(m.renewalType==='evergreen'?'evergreen':'<span style="color:var(--st-ruby-fg)">—</span>')}</td>
                <td>${statusChip(c.status)}</td>
                <td><span style="display:inline-flex;gap:3px;align-items:center">${migGateDots(c)}</span>
                  ${c.migration.blocked?`<span style="display:block;font-size:12px;color:var(--st-ruby-fg)">no readable text${c.migration.ocrTotalPages?' (OCR tried)':''}</span>`:need?`<span style="display:block;font-size:12px;color:var(--st-amber-fg)">${c.migration.aiSource==='ai'?'low-confidence fields':'pattern-matched only'}</span>`:''}
                  ${isOcrText(c.migration.textSource)?`<span style="display:block;font-size:12px;color:var(--st-amber-fg)" title="${migEsc(ocrProvenanceLine(c.upload||c.migration))}">machine-read from a scan${c.migration.ocrSkippedPages?` · ${c.migration.ocrSkippedPages} page${c.migration.ocrSkippedPages===1?'':'s'} skipped`:''}</span>`:''}</td>
                <td style="text-align:right;padding-right:12px;white-space:nowrap" onclick="event.stopPropagation()">
                  ${(c.linkSuggestions&&c.linkSuggestions.length&&!c.parentId&&!c.linkConfirmed&&canEdit())?`<button data-mig-link="${c.id}" class="ui-btn" style="font-size:12px;padding:3.5px 10px;border-color:var(--color-accent);color:var(--color-accent-800)">${i18t('mig_col_link')}</button>`:''}
                  ${need&&canEdit()?`<button data-mig-review="${c.id}" class="ui-btn ui-btn-primary" style="font-size:12px;padding:3.5px 10px">${i18t('mig_review')}</button>`:''}
                  <button data-open="${c.id}" class="ui-btn" style="font-size:12px;padding:3.5px 10px">${i18t('mig_open')}</button>
                </td>
              </tr>`; }).join('')}
            </tbody>
          </table>
        </div>
      </section>`:`
      <div style="text-align:center;padding:26px 16px;color:var(--color-neutral-600);font-size:14px">${i18t('mig_none_yet')}</div>`}

      <!-- manifest reconciliation -->
      ${recon&&(recon.missing.length||recon.extra)?`
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:14px 16px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0 0 8px">${i18t('mig_reconciliation')}</h3>
        ${recon.missing.length?`
          <div style="font-size:13px;font-weight:600;color:var(--st-ruby-fg);margin-bottom:4px">${recon.missing.length} manifest row${recon.missing.length===1?'':'s'} with no file received:</div>
          <div class="scroll-thin" style="max-height:180px;overflow-y:auto;margin-bottom:8px">
            ${recon.missing.map(r=>`<div style="display:flex;gap:8px;font-size:13px;padding:4px 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
              <span style="font-family:var(--font-mono);color:var(--color-neutral-600);flex:none">${migEsc(r.file||'—')}</span>
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(r.name||'')}${r.counterparty?' · '+migEsc(r.counterparty):''}</span>
            </div>`).join('')}
          </div>
          <p style="font-size:12px;color:var(--color-neutral-600);margin:0">Chase these with the customer — a contract on the checklist that never arrived is the most common way migrations silently lose paper.</p>`:''}
        ${recon.extra?`<p style="font-size:13px;color:var(--st-amber-fg);margin:${recon.missing.length?'8px':'0'} 0 0">${recon.extra} imported file${recon.extra===1?'':'s'} had no manifest row — worth confirming they belong in this migration.</p>`:''}
      </section>`:''}
    </div>
  </div>`;

  // wiring
  if(M.unfinished==null && API_MODE()){ M.unfinished=[]; migLoadUnfinished(); }
  const drop=document.getElementById('mig-drop');
  if(drop){
    const fi=document.getElementById('mig-files');
    drop.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',()=>{ if(fi.files.length) migProcessFiles(fi.files); });
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('dragover'); }));
    // Both entry points hand the whole selection to migProcessFiles, which owns
    // the empty-file rule — the drop path used to filter silently while the
    // picker imported the same file as an executed contract.
    drop.addEventListener('drop',e=>{ const fs=[...(e.dataTransfer?.files||[])]; if(fs.length) migProcessFiles(fs); });
    document.getElementById('mig-status')?.addEventListener('change',e=>{ M.defaults.status=e.target.value; });
    bindFolderSelect(document.getElementById('mig-folder'), v=>{ M.defaults.folder=v; });
    document.querySelectorAll('[data-dismiss-batch]').forEach(b=>
      b.addEventListener('click',()=>migDismissBatch(b.getAttribute('data-dismiss-batch'))));
    const mf=document.getElementById('mig-manifest-file');
    document.getElementById('mig-manifest-btn')?.addEventListener('click',()=>mf.click());
    mf?.addEventListener('change',()=>{ if(mf.files[0]) migLoadManifest(mf.files[0]); });
    document.getElementById('mig-manifest-tpl')?.addEventListener('click',migManifestTemplate);
  }
  document.getElementById('mig-review-all')?.addEventListener('click',migReviewAll);
  document.getElementById('mig-rerun')?.addEventListener('click',migRerunAi);
  document.getElementById('mig-sheet-out')?.addEventListener('click',migExportSheet);
  const sf=document.getElementById('mig-sheet-file');
  document.getElementById('mig-sheet-in')?.addEventListener('click',()=>sf.click());
  sf?.addEventListener('change',()=>{ if(sf.files[0]) migImportSheet(sf.files[0]); });
  document.querySelectorAll('[data-mig-review]').forEach(b=>b.addEventListener('click',()=>{ const c=getContract(b.getAttribute('data-mig-review')); if(c) openMigReview(c); }));
  document.querySelectorAll('[data-mig-link]').forEach(b=>b.addEventListener('click',()=>{ const c=getContract(b.getAttribute('data-mig-link')); if(c) openLinkModal(c, ()=>renderMigration()); }));
  document.querySelectorAll('.mig-table [data-row]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-row'))));
  wireOpens(document.getElementById('content'));
  renderMigQueue();
  setActiveNav('migration');
}

Object.assign(window,{MIG_CRITICAL,migAllowanceHtml,migBuildAndSave,migIndexContract,migDrawAllowanceDoc,migResolveDuplicate,migDupeRowHtml,migWireDupes,migEstimate,migConfirmEstimate,migLoadAiState,migGuessPages,applyReviewedMeta,folderFromType,migContracts,migExportSheet,migGates,migImportSheet,migLoadManifest,migLoadUnfinished,migDismissBatch,migUnfinishedHtml,migDateOrder,migParseDate,migParseValue,migNeedsReview,migProcessFiles,migReviewAll,migRerunAi,migState,openMigReview,parseCsv,renderMigration});
