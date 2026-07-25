// HaTi — template fields: the blanks in a template ARE the database.
//
// Globals are window-attached on purpose (single global scope; see core.js).
// Design note: DESIGN-template-fields.md.
//
// One field schema serves the twelve built-in Kenyan templates and a customer's
// own uploaded paper, so the wizard, the preview and bulk creation neither know
// nor care which kind they are looking at. Filling a contract in writes every
// value into c.metadata AND into the standard contract fields it maps to — the
// register, filters, folder routing and reports get structured data for free,
// with no separate data-entry step.

const TPL_FIELD_TYPES = [
  { k:'text',   label:'Text' },
  { k:'party',  label:'Party (company name)' },
  { k:'num',    label:'Number' },
  { k:'date',   label:'Date' },
  { k:'select', label:'Choice list' },
];
/* Which standard contract field a blank feeds. `maps` is what turns a blank
   into data rather than decoration. */
const TPL_MAPS = [
  { k:'',                 label:'— nothing (extra detail only)' },
  { k:'counterparty',     label:'Counterparty' },
  { k:'value',            label:'Contract value' },
  { k:'expiry',           label:'Expiry date' },
  { k:'effDate',          label:'Effective / start date' },
  { k:'contractType',     label:'Contract type' },
  { k:'currency',         label:'Currency' },
  { k:'noticePeriodDays', label:'Notice period (days)' },
  { k:'paymentTerms',     label:'Payment terms' },
  { k:'governingLaw',     label:'Governing law' },
  { k:'folder',           label:'Value stream (filing)' },
];
const tplMapLabel = k => (TPL_MAPS.find(m=>m.k===k)||{}).label || '';

const tplKeyOk = k => /^[a-z][a-z0-9_]{0,31}$/.test(String(k||''));
/* Turn a human label into a placeholder key, uniquely within a field set. */
function tplKeyFrom(label, existing){
  let base=String(label||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,28);
  if(!base||/^[0-9]/.test(base)) base='field_'+base;
  base=base.replace(/^_+/,'');
  const used=new Set((existing||[]).map(f=>f.key));
  let k=base, n=2;
  while(used.has(k)){ k=base.slice(0,28)+'_'+n; n++; }
  return k;
}
/* The unified accessor. Built-in and custom templates both answer this. */
function templateFields(t){
  if(!t) return [];
  if(Array.isArray(t.fields)) return t.fields;
  return [];
}
const templateBody = t => (t && (t.body!=null ? t.body : t.text)) || '';

/* ---------- rendering ---------- */
const TPL_BLANK = '_____________';
/* Substitute {{key}} placeholders. An unfilled optional blank renders as a
   ruled line so the printed contract still reads as a contract with a gap. */
function fillTemplateBody(body, values){
  return String(body||'').replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g, (m,k)=>{
    const v=values&&values[k];
    return (v==null||v==='') ? TPL_BLANK : String(v);
  });
}
/* Which placeholders the body actually uses — so the editor can warn about a
   field with no blank, or a blank with no field. */
function bodyPlaceholders(body){
  const out=[]; const re=/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g; let m;
  while((m=re.exec(String(body||'')))) if(!out.includes(m[1])) out.push(m[1]);
  return out;
}

/* ---------- auto-detect existing blanks on import ----------
   Real templates usually already mark their blanks: [SQUARE BRACKETS],
   {{curly}}, or a label followed by a run of underscores. Detection is pure
   regex, so it works in static mode with no key. */
function detectBlanks(text){
  const t=String(text||'');
  const found=[];              // {raw, label, index}
  const push=(raw,label,index)=>{ const l=String(label||'').trim(); if(l && l.length<=60) found.push({raw,label:l,index}); };
  let m;
  const square=/\[([A-Z][A-Z0-9 ,'./&()-]{1,58})\]/g;
  while((m=square.exec(t))) push(m[0], m[1], m.index);
  const curly=/\{\{\s*([a-zA-Z][a-zA-Z0-9_ ]{0,40})\s*\}\}/g;
  while((m=curly.exec(t))) push(m[0], m[1], m.index);
  // "Counterparty: ______" / "Date _________"
  const rule=/([A-Za-z][A-Za-z ()/&'-]{2,40}?)\s*[:\-]?\s*(_{4,})/g;
  while((m=rule.exec(t))) push(m[0], m[1], m.index);
  // de-duplicate by normalised label, keeping the first occurrence
  const seen=new Set(), out=[];
  for(const f of found){
    const key=f.label.toLowerCase().replace(/[^a-z0-9]+/g,'');
    if(!key||seen.has(key)) continue;
    seen.add(key); out.push(f);
  }
  return out;
}
/* Guess a sensible type and mapping from a blank's label — "Expiry date" is a
   date that feeds c.expiry, "Contract value (KES)" is a number that feeds
   c.value, and so on. */
function guessFieldShape(label){
  const l=String(label||'').toLowerCase();
  if(/counterpart|supplier|vendor|customer|distributor|client|company|party|employee|landlord|tenant/.test(l)) return { type:'party', maps:/counterpart|supplier|vendor|customer|distributor|client|company|party/.test(l)?'counterparty':'' };
  if(/expiry|expires|end date|termination date/.test(l)) return { type:'date', maps:'expiry' };
  if(/effective|commence|start date|date of this/.test(l)) return { type:'date', maps:'effDate' };
  if(/\bdate\b/.test(l)) return { type:'date', maps:'' };
  if(/notice/.test(l)) return { type:'num', maps:'noticePeriodDays' };
  if(/value|amount|price|fee|salary|rent|consideration/.test(l)) return { type:'num', maps:'value' };
  if(/payment term|credit term/.test(l)) return { type:'text', maps:'paymentTerms' };
  if(/governing law|jurisdiction/.test(l)) return { type:'text', maps:'governingLaw' };
  if(/currency/.test(l)) return { type:'text', maps:'currency' };
  if(/days|months|number|quantity|percent/.test(l)) return { type:'num', maps:'' };
  return { type:'text', maps:'' };
}
/* Convert detected blanks into fields AND rewrite the body to use {{key}}.
   Returns { fields, body, converted }. */
function convertDetectedBlanks(text, detected){
  let body=String(text||'');
  const fields=[];
  for(const d of (detected||[])){
    const key=tplKeyFrom(d.label, fields);
    const shape=guessFieldShape(d.label);
    fields.push({ key, label:d.label.replace(/\s+/g,' ').trim(), type:shape.type, maps:shape.maps,
      required:!!shape.maps, def:'', opts:[] });
    // replace every occurrence of this exact marker
    body=body.split(d.raw).join('{{'+key+'}}');
  }
  return { fields, body, converted:fields.length };
}

/* ---------- validation ---------- */
const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
function isRealDate(v){
  if(!ISO_DATE.test(String(v||''))) return false;
  const [y,m,d]=String(v).split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y && dt.getUTCMonth()===m-1 && dt.getUTCDate()===d;
}
/* Validate one value against one field. Returns an error string or null. */
function validateField(f, raw){
  const v=String(raw==null?'':raw).trim();
  if(!v){ return f.required ? `${f.label} is required` : null; }
  if(f.type==='num'){ const n=Number(v.replace(/[, ]/g,''));
    if(!Number.isFinite(n)) return `${f.label} must be a number (got “${v}”)`;
    if(n<0) return `${f.label} cannot be negative`; return null; }
  if(f.type==='date'){ const iso=normaliseDateInput(v);
    if(!iso) return `${f.label} must be a date like 2026-12-31 or 31/12/2026 (got “${v}”)`; return null; }
  if(f.type==='select'){ const opts=(f.opts||[]).map(String);
    if(opts.length && !opts.some(o=>o.toLowerCase()===v.toLowerCase()))
      return `${f.label} must be one of: ${opts.join(', ')} (got “${v}”)`; return null; }
  return null;
}
/* Accept the date formats a Kenyan spreadsheet actually contains. */
function normaliseDateInput(v){
  const t=String(v||'').trim(); if(!t) return null;
  if(isRealDate(t)) return t;
  let m=t.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  if(m){ const iso=`${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`; return isRealDate(iso)?iso:null; }
  const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  m=t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if(m){ const mo=MON[m[2].slice(0,3).toLowerCase()]; if(!mo) return null;
    const iso=`${m[3]}-${String(mo).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`; return isRealDate(iso)?iso:null; }
  return null;
}
/* Coerce a validated value into the type the record should store. */
function coerceField(f, raw){
  const v=String(raw==null?'':raw).trim();
  if(!v) return '';
  if(f.type==='num') return Number(v.replace(/[, ]/g,''));
  if(f.type==='date') return normaliseDateInput(v)||'';
  if(f.type==='select'){ const hit=(f.opts||[]).find(o=>String(o).toLowerCase()===v.toLowerCase()); return hit!=null?hit:v; }
  return v;
}

/* ---------- feed the repository ----------
   THE point of the task: every value goes into c.metadata, and the mapped ones
   also into the standard contract fields, so a contract created from a template
   arrives in the register fully populated with nothing typed twice. */
function applyTemplateValues(c, fields, values){
  c.metadata=c.metadata||{}; c.metadata.confidence=c.metadata.confidence||{};
  c.metadata.templateFields=c.metadata.templateFields||{};
  c.fields=c.fields||{};
  for(const f of (fields||[])){
    const v=coerceField(f, values[f.key]);
    c.fields[f.key]=v;
    c.metadata.templateFields[f.key]=v;
    if(v==='' || v==null) continue;
    // A human typed this. That is the one case where `high` is honest without a
    // further confirmation step.
    const set=(k,val)=>{ c.metadata[k]=val; c.metadata.confidence[k]='high'; };
    switch(f.maps){
      case 'counterparty': c.counterparty=String(v); set('counterparty', String(v)); break;
      case 'value': c.value=Number(v)||0; if(c.value>0&&c.valueType==='none') c.valueType='estimated'; set('value', Number(v)||0); break;
      case 'expiry': c.expiry=String(v); set('expiryDate', String(v)); break;
      case 'effDate': c.fields.effDate=String(v); set('effectiveDate', String(v)); break;
      case 'folder': if(FOLDERS[v]) c.folder=String(v); break;
      case 'contractType': set('contractType', String(v)); break;
      case 'currency': set('currency', String(v)); break;
      case 'noticePeriodDays': set('noticePeriodDays', Number(v)||0); break;
      case 'paymentTerms': set('paymentTerms', String(v)); break;
      case 'governingLaw': set('governingLaw', String(v)); break;
      default: break;
    }
  }
  return c;
}

/* ---------- bulk creation from a spreadsheet ---------- */
const TPL_BULK_MAX = 200;
const _csvCell = v => `"${String(v==null?'':v).replace(/"/g,'""')}"`;
/* One column per field, plus a Name column so each draft can be titled. */
function bulkTemplateCsv(t){
  const fs=templateFields(t);
  const head=['Contract name', ...fs.map(f=>f.label + (f.required?' *':''))];
  const hint=['e.g. Distribution Agreement — Coast', ...fs.map(f=>
    f.type==='date' ? '2026-12-31'
    : f.type==='num' ? '2500000'
    : f.type==='select' ? (f.opts||[]).join(' | ')
    : f.def || (f.type==='party'?'Acme Ltd':''))];
  return [head.map(_csvCell).join(','), hint.map(_csvCell).join(',')].join('\n');
}
const _normHead = s => String(s||'').toLowerCase().replace(/\*/g,'').replace(/[^a-z0-9]/g,'');
/* Parse + validate a whole sheet. Creates NOTHING — it returns rows and errors
   so the caller can refuse the entire batch if any cell is wrong. */
function parseBulkCsv(t, text){
  const fs=templateFields(t);
  const rows=parseCsv(text);
  if(rows.length<2) return { rows:[], errors:[{ row:0, cell:'', msg:'That CSV has no data rows.' }] };
  const head=rows[0].map(_normHead);
  const nameCol=head.findIndex(h=>h==='contractname'||h==='name'||h==='title');
  const colOf={};
  const errors=[];
  for(const f of fs){
    const i=head.findIndex(h=>h===_normHead(f.label)||h===_normHead(f.key));
    if(i<0) errors.push({ row:0, cell:f.label, msg:`The sheet is missing a column for “${f.label}”. Download the template CSV again.` });
    else colOf[f.key]=i;
  }
  if(errors.length) return { rows:[], errors };
  const body=rows.slice(1)
    // the downloaded template ships an example row — drop it rather than
    // creating a contract called "e.g. …"
    .filter(r=>!/^e\.g\./i.test(String(r[nameCol>=0?nameCol:0]||'').trim()))
    .filter(r=>r.some(v=>String(v||'').trim()!==''));
  if(!body.length) return { rows:[], errors:[{ row:0, cell:'', msg:'The sheet has headers but no filled-in rows.' }] };
  if(body.length>TPL_BULK_MAX)
    return { rows:[], errors:[{ row:0, cell:'', msg:`${body.length} rows — the cap is ${TPL_BULK_MAX} per run. Split the sheet.` }] };
  const out=[];
  body.forEach((r,i)=>{
    const rowNo=i+2;                    // 1-based, +1 for the header row
    const values={};
    for(const f of fs){
      const raw=r[colOf[f.key]];
      const err=validateField(f, raw);
      if(err) errors.push({ row:rowNo, cell:f.label, msg:err });
      else values[f.key]=coerceField(f, raw);
    }
    const name=String(nameCol>=0?(r[nameCol]||''):'').trim();
    if(!name) errors.push({ row:rowNo, cell:'Contract name', msg:'Contract name is required' });
    out.push({ rowNo, name, values });
  });
  return { rows:out, errors };
}
/* Create every draft in one pass. Only ever called once validation is clean. */
function createBulkFromTemplate(t, rows, opts={}){
  if(!canEdit()){ toast('Viewers cannot create contracts','err'); return []; }
  const u=currentUser();
  const batch='T-'+Date.now().toString(36).toUpperCase();
  const fs=templateFields(t);
  const tplName=t.name||t.kind||'template';
  const made=[];
  for(const r of rows){
    const c={ id:nextId(), name:r.name, counterparty:'', value:0, status:'Draft',
      template:t.builtin?t.id:null, source:t.builtin?undefined:'template',
      folder:FOLDERS[t.folder]?t.folder:'corp', valueType:'estimated',
      lastAction:todayStr(), hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
      compliance:{iprs:false,pki:false}, expiry:null,
      comments:[{author:'System',role:'Automation',side:'internal',
        text:`Created from template “${tplName}” in bulk run ${batch}. The values from the spreadsheet are already filed as contract data — check them, then share for review.`,ts:fmtDT(nowISO())}],
      fields:{}, scan:null,
      audit:[{at:nowISO(),user:u?.name||'System',action:'Created',
        detail:`Bulk creation from template “${tplName}” · batch ${batch} · run by ${u?.name||'System'}`}],
      signatures:[], templateBatch:batch, templateRef:t.id||null };
    applyTemplateValues(c, fs, r.values);
    const bodyText=fillTemplateBody(templateBody(t), r.values);
    if(bodyText && !t.builtin){
      c.redlineText=bodyText;
      c.versions=[{ n:1, at:nowISO(), by:u?.name||'System', label:`Template “${tplName}”`, text:bodyText }];
    }
    c._loaded=true; c._light=false; c._v=0;
    state.contracts.unshift(c);
    persist(c);
    made.push(c);
  }
  if(API_MODE()){ flushSaves().catch(()=>{}); }
  return made;
}

Object.assign(window,{TPL_FIELD_TYPES,TPL_MAPS,TPL_BLANK,TPL_BULK_MAX,tplMapLabel,tplKeyOk,tplKeyFrom,
  templateFields,templateBody,fillTemplateBody,bodyPlaceholders,detectBlanks,guessFieldShape,
  convertDetectedBlanks,validateField,normaliseDateInput,isRealDate,coerceField,applyTemplateValues,
  bulkTemplateCsv,parseBulkCsv,createBulkFromTemplate});
