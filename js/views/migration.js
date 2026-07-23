// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: MIGRATION (bulk contract onboarding)
   Bring an existing portfolio into HaTi in one sitting: drop many
   files at once, each is hashed (dedupe), text-extracted, run
   through AI/heuristic metadata extraction, filed and saved — then
   a confidence-routed review queue lets a human confirm only the
   fields the machine was unsure about. An optional manifest CSV
   reconciles what the customer SAID they sent against what arrived.
   Composes the existing single-upload machinery (extractDocText,
   ai/extract, openMetaReview, files API) — no new server surface.
   ============================================================ */
const MIG_MAX_FILES = 300;                       // sanity cap per batch
const MIG_ACCEPT = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg';
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
    { k:'file',   label:'File attached',        ok: !!(c.upload&&c.upload.fileHash) },
    { k:'cp',     label:'Counterparty',         ok: !!(c.counterparty&&String(c.counterparty).trim()) },
    { k:'folder', label:'Filed in a stream',    ok: !!FOLDERS[c.folder] },
    { k:'term',   label:'Expiry or evergreen',  ok: !!(c.expiry || m.expiryDate || m.renewalType==='evergreen') },
    { k:'review', label:'Details confirmed',    ok: !(c.migration&&c.migration.needsReview) },
  ];
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
function migParseDate(v){
  const t=String(v||'').trim(); if(!t) return null;
  let m=t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if(m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
  m=t.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/); if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  m=t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/); if(m){ const mo=MON[m[2].slice(0,3).toLowerCase()]; if(mo) return `${m[3]}-${String(mo).padStart(2,'0')}-${m[1].padStart(2,'0')}`; }
  return null;
}
const migParseValue = v => { const n=Number(String(v||'').replace(/[^0-9.\-]/g,'')); return Number.isFinite(n)?n:0; };
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
  const text=await file.text();
  const rows=parseCsv(text);
  if(rows.length<2){ toast('That CSV has no data rows','err'); return; }
  const map=migHeaderMap(rows[0]);
  if(map.file==null && map.name==null){ toast('Manifest needs at least a "filename" or "name" column','err'); return; }
  M.manifest=rows.slice(1).map(r=>{
    const g=k=>map[k]!=null?String(r[map[k]]||'').trim():'';
    return { file:g('file'), name:g('name'), counterparty:g('counterparty'),
      folder:migParseFolder(g('folder'))||folderFromType(g('type')), type:g('type'),
      status:migParseStatus(g('status')), value:migParseValue(g('value')), currency:g('currency'),
      effective:migParseDate(g('effective')), expiry:migParseDate(g('expiry')), signed:migParseDate(g('signed')),
      matchedId:null };
  });
  M.manifestName=file.name;
  // re-reconcile against contracts already imported (e.g. manifest loaded second)
  migContracts().forEach(c=>{ const row=migManifestRow(c.upload&&c.upload.fileName); if(row&&!row.matchedId) row.matchedId=c.id; });
  toast(`Manifest loaded — ${M.manifest.length} rows`);
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

/* ---------- bulk metadata extraction (429-safe) ----------
   Uses the same server endpoint as single uploads, but stops calling the AI
   for the rest of the batch after the first rate-limit/failure (the server
   allows 40 light AI calls / 15 min) — remaining files fall back to the
   pattern-matcher and are flagged so "Re-run AI" can finish the job later. */
async function migExtract(text, seed){
  const M=migState();
  let meta=null;
  if(API_MODE() && state.aiConfigured && !M.aiDown){
    try{ const r=await api('ai/extract','POST',{ text:String(text||'').slice(0,24000) }); meta=r.metadata; meta._source='ai'; }
    catch(e){ M.aiDown=true; M.aiDownMsg=/limit/i.test(e.message)?'AI rate limit reached':'AI unavailable ('+e.message+')'; }
  }
  if(!meta){ meta=heuristicExtract(text); meta._source='heuristic'; }
  if(seed){ meta.confidence=meta.confidence||{};
    for(const [k,v] of Object.entries(seed)){ if(v!=null&&v!==''){ meta[k]=v; meta.confidence[k]='high'; } } }
  return meta;
}
/* Does the extraction need a human? Any critical field missing or low-conf. */
function migNeedsReview(meta, c){
  const conf=(meta&&meta.confidence)||{};
  return MIG_CRITICAL.some(k=>{
    const v=meta?meta[k]:null;
    if(k==='value' && c.valueType==='none') return false;
    if(v==null||v===''||(k==='value'&&!(Number(v)>0))) return true;
    return conf[k]==='low';
  });
}

/* ---------- the batch pipeline (sequential; UI updates live) ---------- */
async function migProcessFiles(fileList){
  if(!canEdit()){ toast('Viewers cannot import contracts','err'); return; }
  const M=migState();
  if(M.running){ toast('A batch is already running — let it finish first','err'); return; }
  let files=[...fileList];
  if(!files.length) return;
  if(files.length>MIG_MAX_FILES){ toast(`Capped at ${MIG_MAX_FILES} files per batch — the rest were skipped`,'err'); files=files.slice(0,MIG_MAX_FILES); }
  const batch='B-'+Date.now().toString(36).toUpperCase();
  const seen=new Set(state.contracts.filter(c=>c.upload&&c.upload.fileHash).map(c=>c.upload.fileHash));
  M.queue=files.map(f=>({ name:f.name, size:f.size, status:'waiting', note:'', id:null }));
  M.running=true; M.batch=batch;
  renderMigQueue(); migWireCancel();
  const u=currentUser();
  let saved=0, dupes=0, errors=0;
  for(let i=0;i<files.length;i++){
    if(!M.running){ M.queue.slice(i).forEach(q=>{ if(q.status==='waiting') q.status='cancelled'; }); break; }
    const file=files[i], q=M.queue[i];
    const step=(st,note)=>{ q.status=st; if(note!=null) q.note=note; renderMigQueue(); };
    try{
      if(file.size>UPLOAD_MAX){ step('error','over 4 MB — compress or split'); errors++; continue; }
      step('reading');
      const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); });
      const fileHash=await sha256(dataUrl);
      if(seen.has(fileHash)){ step('duplicate','identical file already in the register'); dupes++; continue; }
      seen.add(fileHash);
      const mime=file.type||'application/octet-stream';
      step('extracting');
      const extractedText=await extractDocText(dataUrl, mime);
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
      if(readable){ step(M.aiDown||!API_MODE()||!state.aiConfigured?'matching':'ai'); meta=await migExtract(extractedText, seed); }
      else if(manifest){ meta={ ...seed, confidence:Object.fromEntries(Object.keys(seed).map(k=>[k,'high'])), _source:'manifest' }; }
      const upload={ fileName:file.name, mime, size:file.size, fileHash, uploadedAt:nowISO(),
        uploadedBy:u?.name||'System', extractedText:extractedText||'', textChars:(extractedText||'').length, dataUrl };
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
        signatory:u?.name||'Authorized signatory', compliance:{},
        comments:[{author:'System',role:'Automation',side:'internal',
          text:`Migrated in batch ${batch} from “${file.name}” and filed under ${FOLDERS[folder].name}.${executedOutside?' Recorded as executed outside HaTi — the seal is the uploaded file’s own SHA-256.':''}`,ts:fmtDT(nowISO())}],
        fields:{}, scan:null,
        audit:[{at:nowISO(),user:u?.name||'System',action:'Migrated',
          detail:`Imported “${file.name}” (${Math.round(file.size/1024)} KB) in batch ${batch}${readable?`, ${extractedText.length.toLocaleString()} chars extracted`:', no machine-readable text'}${executedOutside?' — executed outside HaTi':''}`}],
        signatures:[], upload };
      // metadata is attached un-"confirmed" — cp/value/expiry were already baked
      // in above, and the audit trail must not claim a human reviewed it yet
      if(meta) c.metadata=meta;
      c.migration={ batch, importedAt:nowISO(),
        needsReview: !meta || migNeedsReview(meta, c),
        blocked: readable?null:'no-text',
        manifest: !!manifest, executedOutside,
        aiSource:(meta&&meta._source)||'none' };
      if(manifest) manifest.matchedId=c.id;
      c._loaded=true; c._light=false; c._v=0;
      state.contracts.unshift(c);
      persist(c);
      q.id=c.id; saved++;
      step('saved', readable?(c.migration.needsReview?'needs review':'complete'):'no readable text — enter details manually');
    }catch(e){ errors++; step('error', e.message||'failed'); }
  }
  M.running=false;
  if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
  updateSidebarCounts();
  toast(`Batch ${batch}: ${saved} imported${dupes?`, ${dupes} duplicate${dupes===1?'':'s'} skipped`:''}${errors?`, ${errors} failed`:''}`);
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
  openMetaReview(meta, m=>{ applyReviewedMeta(c,m); updateSidebarCounts();
    if(opts.onDone) opts.onDone(true); else renderMigration(); toast(`${c.id} confirmed`); },
    { saveLabel:opts.saveLabel||'Confirm & save', onCancel:()=>{ if(opts.onDone) opts.onDone(false); } });
}
/* Walk the whole review queue one confirm at a time (same pattern as the
   settings backfill — cancel skips to the next, so a stuck doc never blocks). */
function migReviewAll(){
  const todo=migContracts().filter(c=>c.migration.needsReview);
  if(!todo.length){ toast('Nothing waiting for review'); return; }
  let done=0;
  const next=()=>{ const c=todo.shift();
    if(!c){ renderMigration(); toast(`Review pass finished — ${done} confirmed`); return; }
    openMigReview(c,{ saveLabel:`Save & next (${todo.length} left)`, onDone:ok=>{ if(ok) done++; next(); } });
  };
  next();
}
/* Re-run AI over contracts that only got the pattern-matcher (e.g. the batch
   hit the 15-minute AI rate limit) — auto-applies, keeps the review flag
   honest, never overwrites human-confirmed metadata. */
async function migRerunAi(){
  const M=migState();
  if(!API_MODE()||!state.aiConfigured){ toast('Connect an AI key in Team & Settings first','err'); return; }
  M.aiDown=false;
  const todo=migContracts().filter(c=>c.migration.needsReview && c.migration.aiSource!=='ai' && !(c.metadata&&c.metadata.confirmedAt));
  if(!todo.length){ toast('No pattern-matched contracts left to re-run'); return; }
  const btn=document.getElementById('mig-rerun'); if(btn){ btn.disabled=true; }
  let done=0;
  for(const c of todo){
    if(migState().aiDown) break;
    if(btn) btn.textContent=`Re-running AI… ${done}/${todo.length}`;
    try{ await ensureFull(c); }catch(e){}
    const text=(c.upload&&c.upload.extractedText)||'';
    if(text.length<200) continue;
    const meta=await migExtract(text, c.counterparty?{counterparty:c.counterparty}:null);
    if(meta._source!=='ai') break;
    c.metadata=meta;
    if(meta.counterparty&&!c.counterparty) c.counterparty=meta.counterparty;
    if(meta.value&&!(Number(c.value)>0)){ c.value=Number(meta.value)||0; if(c.valueType==='none') c.valueType='estimated'; }
    if(meta.expiryDate&&!c.expiry) c.expiry=meta.expiryDate;
    logAudit(c,'AI extraction','Re-ran AI metadata extraction over the stored document text');
    c.migration.aiSource='ai';
    c.migration.needsReview=migNeedsReview(meta, c);
    persist(c); done++;
  }
  if(API_MODE()){ try{ await flushSaves(); }catch(e){} }
  toast(migState().aiDown?`AI re-run stopped (${migState().aiDownMsg}) — ${done} done, try again later`:`AI re-ran on ${done} contract${done===1?'':'s'}`);
  updateSidebarCounts(); renderMigration();
}

/* ---------- review-sheet round trip (Excel is where legal teams live) ---------- */
function migExportSheet(){
  const rows=migContracts();
  if(!rows.length){ toast('Nothing migrated yet','err'); return; }
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const head=['ID','File','Name','Counterparty','Contract type','Stream','Status','Value (KES)','Currency','Effective date','Expiry date','Renewal','Notice (days)','Governing law','Payment terms','Needs review','Low-confidence fields'];
  const body=rows.map(c=>{ const m=c.metadata||{}, conf=m.confidence||{};
    const low=Object.keys(conf).filter(k=>conf[k]==='low').join('; ');
    return [c.id, c.upload&&c.upload.fileName||'', c.name, c.counterparty||'', m.contractType||'',
      FOLDERS[c.folder]?.name||'', statusLabel(c.status), isMonetary(c)?(c.value||0):'', m.currency||'',
      m.effectiveDate||'', m.expiryDate||c.expiry||'', m.renewalType||'', m.noticePeriodDays||'',
      m.governingLaw||'', m.paymentTerms||'', c.migration.needsReview?'YES':'', low].map(esc).join(','); });
  downloadFile('hati-migration-review-sheet.csv',[head.map(esc).join(','),...body].join('\n'),'text/csv');
  toast(`Review sheet exported — ${rows.length} contracts. Correct it in Excel, then import it back.`);
}
async function migImportSheet(file){
  if(!canEdit()){ toast('Viewers cannot import','err'); return; }
  const rows=parseCsv(await file.text());
  if(rows.length<2){ toast('That CSV has no data rows','err'); return; }
  const head=rows[0].map(h=>String(h||'').toLowerCase().replace(/[^a-z0-9()]/g,''));
  const col=n=>head.indexOf(n);
  const iId=col('id');
  if(iId<0){ toast('The sheet needs the ID column from the exported review sheet','err'); return; }
  const idx={ name:col('name'), cp:col('counterparty'), type:col('contracttype'), stream:col('stream'),
    status:col('status'), value:col('value(kes)'), currency:col('currency'), eff:col('effectivedate'),
    exp:col('expirydate'), renewal:col('renewal'), notice:col('notice(days)'), law:col('governinglaw'), pay:col('paymentterms') };
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
function migKpis(){
  const cs=migContracts();
  return { total:cs.length,
    complete:cs.filter(migComplete).length,
    review:cs.filter(c=>c.migration.needsReview).length,
    blocked:cs.filter(c=>c.migration.blocked).length };
}
const MIG_QSTATE = {
  waiting:   {t:'Waiting',        c:'var(--color-neutral-500)'},
  reading:   {t:'Reading file…',  c:'var(--color-accent-700)'},
  extracting:{t:'Extracting text…',c:'var(--color-accent-700)'},
  ai:        {t:'AI extracting…', c:'var(--color-accent-700)'},
  matching:  {t:'Pattern-matching…',c:'#7d5a14'},
  saved:     {t:'Imported',       c:'#1e6b4d'},
  duplicate: {t:'Duplicate',      c:'#7d5a14'},
  cancelled: {t:'Cancelled',      c:'var(--color-neutral-500)'},
  error:     {t:'Failed',         c:'#8f322b'},
};
function renderMigQueue(){
  const host=document.getElementById('mig-queue'); if(!host) return;
  const M=migState();
  if(!M.queue.length){ host.innerHTML=''; return; }
  const done=M.queue.filter(q=>['saved','duplicate','error','cancelled'].includes(q.status)).length;
  const pct=Math.round(done/M.queue.length*100);
  host.innerHTML=`
    <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:14px 16px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-size:13px;font-weight:600">${M.running?'Importing batch '+(M.batch||''):'Batch '+(M.batch||'')+' finished'}</span>
        <span style="font-size:11px;color:var(--color-neutral-600);font-family:var(--font-mono)">${done}/${M.queue.length}</span>
        <span style="flex:1"></span>
        ${M.running?`<button id="mig-cancel" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Stop after current file</button>`:''}
      </div>
      <div style="height:6px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden;margin-bottom:10px"><div style="width:${pct}%;height:100%;background:var(--color-accent);transition:width .3s"></div></div>
      ${M.aiDown?`<div style="font-size:11.5px;color:#7d5a14;background:#fbf4e3;border:1px solid #f0e3c2;border-radius:4px;padding:7px 10px;margin-bottom:8px">${migEsc(M.aiDownMsg||'AI unavailable')} — remaining files use the built-in pattern-matcher and are flagged for review. Use “Re-run AI extraction” once the limit resets.</div>`:''}
      <div class="scroll-thin" style="max-height:260px;overflow-y:auto">
        ${M.queue.map(q=>{ const s=MIG_QSTATE[q.status]||MIG_QSTATE.waiting;
          const active=['reading','extracting','ai','matching'].includes(q.status);
          return `<div style="display:flex;align-items:center;gap:9px;padding:5px 2px;border-bottom:1px solid rgba(29,31,32,.05);font-size:12px">
            <span ${active?'class="scan-pulse"':''} style="width:7px;height:7px;border-radius:50%;background:${s.c};flex:none"></span>
            <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(q.name)}</span>
            ${q.id?`<button data-open="${q.id}" style="border:0;background:none;cursor:pointer;font-family:var(--font-mono);font-size:10.5px;color:var(--color-accent-700);padding:0">${q.id}</button>`:''}
            <span style="flex:none;font-size:11px;font-weight:600;color:${s.c}">${s.t}</span>
            ${q.note?`<span style="flex:none;font-size:10.5px;color:var(--color-neutral-600);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${migEsc(q.note)}">${migEsc(q.note)}</span>`:''}
          </div>`; }).join('')}
      </div>
    </section>`;
  wireOpens(host);
  migWireCancel();
}
function migWireCancel(){
  document.getElementById('mig-cancel')?.addEventListener('click',()=>{ migState().running=false; toast('Stopping after the current file'); });
}
function migGateDots(c){
  return migGates(c).map(g=>`<span title="${g.label}${g.ok?'':' — missing'}" style="width:8px;height:8px;border-radius:50%;display:inline-block;background:${g.ok?'#2e8763':'#d9d5cd'};border:1px solid ${g.ok?'#2e8763':'#b8b2a6'}"></span>`).join('');
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
  const folderOpts=`<option value="auto" ${M.defaults.folder==='auto'?'selected':''}>Auto — route by contract type</option>`
    +Object.values(FOLDERS).map(f=>`<option value="${f.id}" ${M.defaults.folder===f.id?'selected':''}>${f.name}</option>`).join('');
  const statusOpts=[['Signed','Executed — signed outside HaTi'],['Under Review','In Review'],['Draft','Drafting']]
    .map(([v,l])=>`<option value="${v}" ${M.defaults.status===v?'selected':''}>${l}</option>`).join('');
  const kpi=(n,label,color)=>`<div style="flex:1;min-width:120px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:7px;padding:12px 14px;box-shadow:var(--shadow-sm)">
      <div style="font-family:var(--font-mono);font-size:22px;font-weight:600;color:${color||'var(--color-text)'};line-height:1">${n}</div>
      <div style="font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-600);margin-top:5px">${label}</div></div>`;
  const selStyle='font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:5px 7px;color:inherit;cursor:pointer';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:14px 16px 28px">
    <style>
      .mig-table{width:100%;border-collapse:collapse;font-size:12.5px}
      .mig-table th{text-align:left;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:color-mix(in srgb,var(--color-text) 60%,transparent);padding:6.8px;border-bottom:1px solid var(--color-divider);white-space:nowrap;background:#fafbfc}
      .mig-table td{padding:6.8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 8%,transparent);vertical-align:middle}
      .mig-table tbody tr:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
      #mig-drop.dragover{border-color:var(--color-accent);background:var(--color-accent-100)}
    </style>
    <div style="display:flex;flex-direction:column;gap:12px">

      <!-- KPI strip -->
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${kpi(k.total,'Contracts migrated')}
        ${kpi(k.complete,'Fully migrated', k.total&&k.complete===k.total?'#1e6b4d':undefined)}
        ${kpi(k.review,'Need review', k.review?'#7d5a14':'#1e6b4d')}
        ${kpi(k.blocked,'No readable text', k.blocked?'#8f322b':'#1e6b4d')}
        ${recon?kpi(`${recon.matched}/${M.manifest.length}`,'Manifest matched', recon.matched===M.manifest.length?'#1e6b4d':'#7d5a14'):''}
      </div>

      ${canEdit()?`
      <!-- intake -->
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="display:inline-flex;color:var(--color-accent)">${icon('upload')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">Bulk import</h3>
        </div>
        <p style="font-size:12px;color:var(--color-neutral-700);margin:0 0 12px;line-height:1.55">Drop your whole portfolio at once (PDF, Word, image or text · max 4&nbsp;MB each). Every file is hashed for duplicates, text-extracted and ${API_MODE()&&state.aiConfigured?'read by the AI engine':'pattern-matched'} — then only the fields the machine wasn’t sure about come back to you for review. ${API_MODE()?'':'<strong>Static mode stores files in this browser (≈5 MB total) — for a real migration, run the HaTi server.</strong>'}</p>
        <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
          <label style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--color-neutral-700)">Import as
            <select id="mig-status" style="${selStyle}">${statusOpts}</select></label>
          <label style="display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--color-neutral-700)">File under
            <select id="mig-folder" style="${selStyle}">${folderOpts}</select></label>
          <span style="flex:1"></span>
          <button id="mig-manifest-btn" class="ui-btn" style="font-size:11.5px;padding:5px 11px">${icon('list','w-3.5 h-3.5')} ${M.manifest?'Replace manifest':'Load manifest CSV'}</button>
          <button id="mig-manifest-tpl" style="border:0;background:none;cursor:pointer;font-size:11px;color:var(--color-accent-700);text-decoration:underline;padding:0">template</button>
          <input id="mig-manifest-file" type="file" accept=".csv" class="hidden" style="display:none">
        </div>
        ${M.manifest?`<div style="font-size:11.5px;color:var(--color-accent-800);background:var(--color-accent-100);border:1px solid var(--color-divider);border-radius:4px;padding:7px 10px;margin-bottom:12px">Manifest <strong>${migEsc(M.manifestName)}</strong> loaded — ${M.manifest.length} rows. Files are matched by filename; manifest details (counterparty, dates, value, stream, status) take precedence over extraction. The manifest lives in this session only — re-load it after a refresh to re-run reconciliation.</div>`:''}
        <div id="mig-drop" style="border:2px dashed var(--color-divider);border-radius:8px;padding:28px 16px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s">
          <div style="display:inline-grid;place-items:center;width:40px;height:40px;border-radius:8px;background:var(--color-bg);color:var(--color-accent-700);margin-bottom:8px">${icon('upload','w-5 h-5')}</div>
          <div style="font-size:13px;font-weight:600">Drop contract files here — or click to choose</div>
          <div style="font-size:11px;color:var(--color-neutral-600);margin-top:3px">Up to ${MIG_MAX_FILES} files per batch · duplicates skipped automatically</div>
          <input id="mig-files" type="file" multiple accept="${MIG_ACCEPT}" style="display:none">
        </div>
      </section>`:`<div style="font-size:12px;color:var(--color-neutral-600);background:var(--color-surface);border:1px solid var(--color-divider);border-radius:7px;padding:12px 14px">Viewers have read-only access — an Admin or Legal member runs the migration.</div>`}

      <div id="mig-queue">${''}</div>

      <!-- migrated register -->
      ${cs.length?`
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm)">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--color-divider)">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:14px;margin:0">Migrated contracts</h3>
          <span style="font-size:11px;color:var(--color-neutral-600)">${k.complete}/${k.total} fully migrated</span>
          <span style="flex:1"></span>
          ${canEdit()&&k.review?`<button id="mig-review-all" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('check2','w-3.5 h-3.5')} Review all (${k.review})</button>`:''}
          ${canEdit()&&heur&&API_MODE()&&state.aiConfigured?`<button id="mig-rerun" class="ui-btn" style="font-size:12px;padding:5px 12px">${icon('sparkle','w-3.5 h-3.5')} Re-run AI extraction (${heur})</button>`:''}
          <button id="mig-sheet-out" class="ui-btn" style="font-size:12px;padding:5px 12px">${icon('download','w-3.5 h-3.5')} Review sheet</button>
          ${canEdit()?`<button id="mig-sheet-in" class="ui-btn" style="font-size:12px;padding:5px 12px">${icon('upload','w-3.5 h-3.5')} Import sheet</button>
          <input id="mig-sheet-file" type="file" accept=".csv" style="display:none">`:''}
        </div>
        <div style="overflow-x:auto">
          <table class="mig-table">
            <thead><tr>
              <th style="padding-left:12px">ID</th><th>Contract</th><th>Stream</th>
              <th style="text-align:right">Value</th><th>Expiry</th><th>Stage</th>
              <th>Gates</th><th style="text-align:right;padding-right:12px"></th>
            </tr></thead>
            <tbody>
              ${cs.map(c=>{ const m=c.metadata||{};
                const need=c.migration.needsReview;
                return `<tr data-row="${c.id}" style="cursor:pointer">
                <td style="padding-left:12px;font-family:var(--font-mono);font-size:11.5px;color:var(--color-neutral-600);white-space:nowrap">${c.id}</td>
                <td style="max-width:250px">
                  <span style="display:block;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(c.name)}</span>
                  <span style="display:block;font-size:10.5px;color:${c.counterparty?'var(--color-neutral-600)':'#8f322b'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(c.counterparty)||'No counterparty'} · ${migEsc((c.upload&&c.upload.fileName)||'')}</span>
                </td>
                <td style="font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap">${streamLabel(c)}</td>
                <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:500;white-space:nowrap;${isMonetary(c)?'':'color:var(--color-neutral-400)'}">${!isMonetary(c)?'n/m':(c.value?fmtKESshort(c.value):'—')}</td>
                <td style="font-size:11.5px;white-space:nowrap">${c.expiry||m.expiryDate||(m.renewalType==='evergreen'?'evergreen':'<span style="color:#8f322b">—</span>')}</td>
                <td>${statusChip(c.status)}</td>
                <td><span style="display:inline-flex;gap:3px;align-items:center">${migGateDots(c)}</span>
                  ${c.migration.blocked?`<span style="display:block;font-size:9.5px;color:#8f322b">no readable text</span>`:need?`<span style="display:block;font-size:9.5px;color:#7d5a14">${c.migration.aiSource==='ai'?'low-confidence fields':'pattern-matched only'}</span>`:''}</td>
                <td style="text-align:right;padding-right:12px;white-space:nowrap" onclick="event.stopPropagation()">
                  ${need&&canEdit()?`<button data-mig-review="${c.id}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:3.5px 10px">Review</button>`:''}
                  <button data-open="${c.id}" class="ui-btn" style="font-size:11px;padding:3.5px 10px">Open</button>
                </td>
              </tr>`; }).join('')}
            </tbody>
          </table>
        </div>
      </section>`:`
      <div style="text-align:center;padding:26px 16px;color:var(--color-neutral-600);font-size:12.5px">No migrated contracts yet — drop a batch of files above to begin.</div>`}

      <!-- manifest reconciliation -->
      ${recon&&(recon.missing.length||recon.extra)?`
      <section class="blueprint bp-round" style="background:var(--color-surface);box-shadow:var(--shadow-sm);padding:14px 16px">
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:14px;margin:0 0 8px">Reconciliation against the manifest</h3>
        ${recon.missing.length?`
          <div style="font-size:12px;font-weight:600;color:#8f322b;margin-bottom:4px">${recon.missing.length} manifest row${recon.missing.length===1?'':'s'} with no file received:</div>
          <div class="scroll-thin" style="max-height:180px;overflow-y:auto;margin-bottom:8px">
            ${recon.missing.map(r=>`<div style="display:flex;gap:8px;font-size:11.5px;padding:4px 2px;border-bottom:1px solid rgba(29,31,32,.05)">
              <span style="font-family:var(--font-mono);color:var(--color-neutral-600);flex:none">${migEsc(r.file||'—')}</span>
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${migEsc(r.name||'')}${r.counterparty?' · '+migEsc(r.counterparty):''}</span>
            </div>`).join('')}
          </div>
          <p style="font-size:11px;color:var(--color-neutral-600);margin:0">Chase these with the customer — a contract on the checklist that never arrived is the most common way migrations silently lose paper.</p>`:''}
        ${recon.extra?`<p style="font-size:11.5px;color:#7d5a14;margin:${recon.missing.length?'8px':'0'} 0 0">${recon.extra} imported file${recon.extra===1?'':'s'} had no manifest row — worth confirming they belong in this migration.</p>`:''}
      </section>`:''}
    </div>
  </div>`;

  // wiring
  const drop=document.getElementById('mig-drop');
  if(drop){
    const fi=document.getElementById('mig-files');
    drop.addEventListener('click',()=>fi.click());
    fi.addEventListener('change',()=>{ if(fi.files.length) migProcessFiles(fi.files); });
    ['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.remove('dragover'); }));
    drop.addEventListener('drop',e=>{ const fs=[...(e.dataTransfer?.files||[])].filter(f=>f.size); if(fs.length) migProcessFiles(fs); });
    document.getElementById('mig-status')?.addEventListener('change',e=>{ M.defaults.status=e.target.value; });
    document.getElementById('mig-folder')?.addEventListener('change',e=>{ M.defaults.folder=e.target.value; });
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
  document.querySelectorAll('.mig-table [data-row]').forEach(el=>el.addEventListener('click',()=>selectContract(el.getAttribute('data-row'))));
  wireOpens(document.getElementById('content'));
  renderMigQueue();
  setActiveNav('migration');
}

Object.assign(window,{MIG_CRITICAL,applyReviewedMeta,folderFromType,migContracts,migExportSheet,migGates,migImportSheet,migLoadManifest,migNeedsReview,migProcessFiles,migReviewAll,migRerunAi,migState,openMigReview,parseCsv,renderMigration});
