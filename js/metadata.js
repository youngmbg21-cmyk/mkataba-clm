// HaTi — E1 metadata extraction ("file it for me"). Globals are
// window-attached (see components.js) so cross-module calls keep working.

/* Canonical metadata field set. Each contract may carry c.metadata with these
   keys and c.metadata.confidence[field] in {high,medium,low}. */
const META_FIELDS = [
  { k:'counterparty',     get label(){ return i18t('me_counterparty'); },   type:'text' },
  { k:'contractType',     get label(){ return i18t('me_contract_type'); },  type:'text' },
  /* CATEGORY is not contractType. contractType is the document's own words
     ("Raw Material Supply Agreement") and is free text, so nothing can count
     it. Category is a short closed list, which is what every figure that says
     "where the value sits" has to group by. */
  { k:'category',         get label(){ return i18t('me_category'); },       type:'select', opts:['customer','supplier','employment','lease','licence','partner','funding','other'] },
  { k:'effectiveDate',    get label(){ return i18t('me_effective_date'); }, type:'date' },
  { k:'expiryDate',       get label(){ return i18t('me_expiry_date'); },    type:'date' },
  { k:'value',            get label(){ return i18t('me_value'); },          type:'num'  },
  { k:'currency',         get label(){ return i18t('me_currency'); },       type:'text' },
  { k:'renewalType',      get label(){ return i18t('fa_renewal'); },        type:'select', opts:['auto-renew','fixed','evergreen','unknown'] },
  { k:'noticePeriodDays', get label(){ return i18t('me_notice_days'); },  type:'num'  },
  { k:'governingLaw',     get label(){ return i18t('me_governing_law'); },  type:'text' },
  { k:'paymentTerms',     get label(){ return i18t('me_payment_terms'); },  type:'text' },
  /* ---- what an agreement leaves behind, and what it exposes ----
     These four are the ones a business carries after the work is done or
     while the price is out of its hands. They are read off the document like
     everything above; none of them asks anyone to type a number in. */
  { k:'retentionPct',        get label(){ return i18t('me_retention_pct'); },     type:'num' },
  { k:'retentionReleaseDays',get label(){ return i18t('me_retention_release'); }, type:'num' },
  { k:'warrantyMonths',      get label(){ return i18t('me_warranty_months'); },   type:'num' },
  { k:'liabilityCapped',     get label(){ return i18t('me_liability_cap'); },     type:'select', opts:['capped','uncapped','unclear'] },
  { k:'priceReview',         get label(){ return i18t('me_price_review'); },      type:'select', opts:['nochange','ceiling','indexed','open','unclear'] },
];
/* One table for every select option in META_FIELDS. GETTERS, not literals: an
   object literal of translated strings freezes whatever language was current
   when the module loaded, and this file loads once. Note 'fixed' belongs to
   renewalType only — the price option is 'nochange' precisely so the two
   cannot collide in here. */
const META_OPT_LABEL = {
  get ''(){ return '—'; },
  get 'auto-renew'(){ return i18t('mo_auto_renew'); },
  get fixed(){ return i18t('mo_fixed'); },
  get evergreen(){ return i18t('mo_evergreen'); },
  get unknown(){ return i18t('mo_unknown'); },
  get customer(){ return i18t('mo_customer'); },
  get supplier(){ return i18t('mo_supplier'); },
  get employment(){ return i18t('mo_employment'); },
  get lease(){ return i18t('mo_lease'); },
  get licence(){ return i18t('mo_licence'); },
  get partner(){ return i18t('mo_partner'); },
  get funding(){ return i18t('mo_funding'); },
  get other(){ return i18t('mo_other_category'); },
  get capped(){ return i18t('mo_capped'); },
  get uncapped(){ return i18t('mo_uncapped'); },
  get unclear(){ return i18t('mo_unclear'); },
  get nochange(){ return i18t('mo_nochange'); },
  get ceiling(){ return i18t('mo_ceiling'); },
  get indexed(){ return i18t('mo_indexed'); },
  get open(){ return i18t('mo_open'); },
};
const metaOptLabel = v => { const s=String(v==null?'':v);
  return (s in META_OPT_LABEL) ? META_OPT_LABEL[s] : s; };
/* Kept because other modules read it directly. The values it holds are the
   same four renewal options, now answered by the one table above. */
const RENEWAL_LABEL = { get 'auto-renew'(){ return metaOptLabel('auto-renew'); },
  get fixed(){ return metaOptLabel('fixed'); }, get evergreen(){ return metaOptLabel('evergreen'); },
  get unknown(){ return metaOptLabel('unknown'); }, get ''(){ return '—'; } };

/* ---- heuristic fallback: no API key, extract what regex reliably can ---- */
function heuristicExtract(text){
  // flatten the source document's line wrapping — these patterns read across
  // clauses ("…laws of the\nRepublic of Kenya") and would otherwise stop at a break
  const t = String(text||'').replace(/\s+/g,' '); const conf = {};
  const set = (o,k,v,c)=>{ if(v!=null && v!==''){ o[k]=v; conf[k]=c; } };
  const m = {};
  // dates: dd/mm/yyyy, d Month yyyy, yyyy-mm-dd
  const dates = [];
  const push = iso => { if(iso && !dates.includes(iso)) dates.push(iso); };
  const MON = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
  (t.match(/\b(\d{4})-(\d{2})-(\d{2})\b/g)||[]).forEach(push);
  (t.match(/\b(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})\b/g)||[]).forEach(s=>{ const [d,mo,y]=s.split(/[\/.]/); push(`${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`); });
  (t.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/g)||[]).forEach(s=>{ const p=s.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/); const mo=MON[p[2].slice(0,3).toLowerCase()]; if(mo) push(`${p[3]}-${String(mo).padStart(2,'0')}-${String(p[1]).padStart(2,'0')}`); });
  dates.sort();
  if(dates.length){ set(m,'effectiveDate',dates[0],'low'); if(dates.length>1) set(m,'expiryDate',dates[dates.length-1],'low'); }
  // value: KES / Kshs / USD amounts
  const val = t.match(/\b(?:KES|Kshs?|USD|US\$|\$)\s*([\d,]+(?:\.\d+)?)\s*(million|m|bn|billion)?/i);
  if(val){ let n=Number(val[1].replace(/,/g,'')); const u=(val[2]||'').toLowerCase(); if(u==='million'||u==='m') n*=1e6; if(u==='bn'||u==='billion') n*=1e9; set(m,'value',n,'low'); const cur=/usd|\$/i.test(val[0])?'USD':(typeof jxCurrency==='function'?jxCurrency():'KES'); set(m,'currency',cur,'low'); }
  // governing law
  const gl = t.match(/govern(?:ed|ing)[^.]*\blaws?\s+of\s+([A-Z][A-Za-z &]+?)[.,\n)]/i);
  if(gl) set(m,'governingLaw',gl[1].trim().replace(/\s+the\s+$/i,''),'low');
  // payment terms
  const pay = t.match(/\bwithin\s+(\d{1,3})\s+days\b[^.]*\b(?:invoice|payment|delivery)\b/i) || t.match(/\b(?:net|payment terms?)\s*[:\-]?\s*(\d{1,3})\s*days\b/i);
  if(pay) set(m,'paymentTerms',pay[1]+' days','low');
  // notice period
  const notice = t.match(/\b(\d{1,3})\s+(?:days|months?)['’]?\s+(?:written\s+)?notice\b/i);
  if(notice){ let d=Number(notice[1]); if(/month/i.test(notice[0])) d*=30; set(m,'noticePeriodDays',d,'low'); }
  // renewal
  if(/automatically\s+renew|auto-?renew/i.test(t)) set(m,'renewalType','auto-renew','low');
  else if(/evergreen|continue\s+(?:indefinitely|until\s+terminated)/i.test(t)) set(m,'renewalType','evergreen','low');
  else if(/fixed\s+term|expires?\s+on|term\s+of\s+\d/i.test(t)) set(m,'renewalType','fixed','low');

  /* ---- category: first match wins, most specific first ----
     Deliberately ordered. "Employment" beats "services" because a contract of
     service says both; "lease" beats "supplier" because a lease of premises
     mentions rent and supply of services in the same breath. */
  const CAT = [
    ['employment', /contract of (?:service|employment)|employment agreement|the employee\b|staff contract|anställningsavtal/i],
    ['lease',      /\blease\b|tenancy|licence to occupy|the (?:landlord|tenant|lessor|lessee)\b|demised premises/i],
    ['licence',    /software (?:as a service|licence|license)|end.user licence|subscription (?:agreement|terms)|\bSaaS\b|licensed software/i],
    ['funding',    /\bgrant agreement\b|funding agreement|the (?:donor|grantor|grantee)\b|disburse(?:d|ment) of (?:the )?funds/i],
    ['partner',    /memorandum of understanding|consortium|partnership agreement|joint venture|implementing partner/i],
    ['supplier',   /\b(?:supply|purchase|procurement|vendor|subcontract)\w* agreement\b|the (?:supplier|vendor|subcontractor|seller)\b|purchase order/i],
    /* "the Employer" is the construction word for the customer — a works
       contract names neither. Read from the contractor's side, which is the
       side HaTi's user is on. A subcontract is caught by 'supplier' above,
       which is tested first for exactly that reason. */
    ['customer',   /\b(?:services|distribution|sale|reseller|framework)\w* agreement\b|the (?:customer|client|buyer|purchaser|distributor|employer)\b|scope of works?\b|contract for [^.]{0,24}works\b|\bworks contract\b/i],
  ];
  for(const [k,re] of CAT){ if(re.test(t)){ set(m,'category',k,'low'); break; } }

  // retention: the percentage held back, and how long before it comes home
  /* "retain 10%" is read on its own. The earlier patterns all required the word
     "retention" and the figure inside one sentence, which a numbered clause
     breaks: "2. RETENTION. The Employer shall retain 10%…" puts a full stop
     between them, and [^.] stops dead at it. Found by running a real roofing
     contract through the browser, not by reading the pattern. */
  const ret = t.match(/\bretain(?:s|ed|age)?\b[^.]{0,40}?(\d{1,2}(?:\.\d+)?)\s*(?:%|per\s?cent)/i)
           || t.match(/retention[^.]{0,60}?(\d{1,2}(?:\.\d+)?)\s*(?:%|per\s?cent)/i)
           || t.match(/(\d{1,2}(?:\.\d+)?)\s*(?:%|per\s?cent)[^.]{0,40}?\bretention\b/i);
  if(ret) set(m,'retentionPct',Number(ret[1]),'low');
  const rel = t.match(/retention[^.]{0,140}?(\d{1,3})\s*(days?|months?|years?)[^.]{0,80}?(?:practical completion|completion|handover|defects? liability|making good)/i)
           || t.match(/(?:released?|repaid|returned)[^.]{0,60}?(\d{1,3})\s*(days?|months?|years?)[^.]{0,60}?(?:practical completion|completion|handover)/i);
  if(rel) set(m,'retentionReleaseDays',unitDays(rel[1],rel[2]),'low');

  // defects liability / warranty period, always stored in months
  const war = t.match(/(?:defects?\s+liability|warrant(?:y|ies)|guarantee)\s+period[^.]{0,60}?(\d{1,3})\s*(days?|months?|years?)/i)
           || t.match(/warrants?[^.]{0,80}?for\s+(?:a\s+period\s+of\s+)?(\d{1,3})\s*(days?|months?|years?)\s+(?:from|after|following)/i);
  if(war){ const d=unitDays(war[1],war[2]); if(d>0) set(m,'warrantyMonths',Math.round(d/30),'low'); }

  // is our liability capped, and can the price move without our say-so
  if(/(?:aggregate|total)\s+liabilit\w+[^.]{0,120}?(?:shall not exceed|limited to|capped at)|liabilit\w+[^.]{0,60}(?:shall not exceed|capped at)/i.test(t))
    set(m,'liabilityCapped','capped','low');
  else if(/unlimited liabilit|liabilit\w+[^.]{0,60}shall not be limited|without limit(?:ation)? (?:as to|of) (?:amount|liability)|nothing[^.]{0,70}limits?[^.]{0,20}liabilit/i.test(t))
    set(m,'liabilityCapped','uncapped','low');

  if(/(?:increase|adjust|revis)\w*[^.]{0,90}?(?:shall not exceed|no more than|capped at|subject to a maximum of)\s*\d{1,2}\s*(?:%|per\s?cent)/i.test(t))
    set(m,'priceReview','ceiling','low');
  else if(/consumer price index|\bCPI\b|cost of living index|indexed? (?:to|in line with)|indexation/i.test(t))
    set(m,'priceReview','indexed','low');
  else if(/may[^.]{0,40}\b(?:vary|revise|increase|adjust)\b[^.]{0,40}\b(?:price|prices|rates?|fees?|charges)\b/i.test(t))
    set(m,'priceReview','open','low');
  else if(/(?:price|prices|rates?|fees?)[^.]{0,60}?(?:shall remain|remain) fixed|fixed for the (?:term|duration|period)/i.test(t))
    set(m,'priceReview','nochange','low');

  m.confidence = conf;
  return m;
}
/* days / months / years as written, in days. Months are 30 and years 365 —
   HaTi is reading a period out of prose, not settling an account on it. */
function unitDays(n, unit){
  const v=Number(n)||0, u=String(unit||'').toLowerCase();
  if(u.startsWith('year')) return v*365;
  if(u.startsWith('month')) return v*30;
  return v;
}

/* ---- what actually gets sent for extraction ----
   A blind head-slice sent the first eight to twelve pages of a long agreement
   and nothing else — but renewal, termination, notice and expiry clauses
   usually sit at the BACK, so exactly the fields the reminder system depends on
   were the ones most likely to be missing or wrong.

   Instead we assemble: the front (parties, recitals, definitions, commercial
   terms), the back (signature blocks, schedules, execution dates), and a window
   around every mention of the term-critical vocabulary — merged where they
   overlap, joined in original document order, with explicit markers so the
   model knows text was elided and does not infer anything from the gaps. */
const AI_PAYLOAD_MAX = () => Number((state.aiCfg&&state.aiCfg.limits&&state.aiCfg.limits.maxChars)||60000);
const EXTRACT_FRONT = 15000, EXTRACT_BACK = 10000, EXTRACT_WINDOW = 1500;
/* Lower `prio` = kept longer. When the budget runs out the lowest-priority
   windows are dropped first — definitions before termination, as it should be:
   a missing definition costs a label, a missing termination clause costs the
   renewal reminder. */
const EXTRACT_TERMS = [
  { prio:1, re:/renew|terminat|expir|notice|term of this agreement|duration/gi },
  { prio:2, re:/govern|jurisdiction|payment|invoice|price|escalat/gi },
  /* Retention, the defects period and the liability cap sit in the middle of a
     long agreement, which is exactly the part a front-and-back slice throws
     away. They rank with the commercial terms, not with the boilerplate,
     because each of them is money or exposure a business keeps carrying after
     the work is finished. */
  { prio:2, re:/retention|retain|defects? liability|warrant|guarantee period|practical completion|handover/gi },
  { prio:3, re:/stamp duty|force majeure|liabilit|indemnit/gi },
  { prio:4, re:/assign|confidential/gi },
];
const _clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
/* Merge overlapping / touching spans and return them in document order. */
function _mergeSpans(spans){
  const s=spans.slice().sort((a,b)=>a.start-b.start);
  const out=[];
  for(const sp of s){
    const last=out[out.length-1];
    if(last && sp.start<=last.end) last.end=Math.max(last.end, sp.end);
    else out.push({ start:sp.start, end:sp.end });
  }
  return out;
}
const _spanLen = spans => spans.reduce((a,s)=>a+(s.end-s.start),0);

function buildExtractionPayload(text, opts={}){
  const t = String(text||'');
  const cap = Math.max(2000, Number(opts.maxChars||AI_PAYLOAD_MAX()));
  if(t.length<=cap) return { text:t, sections:1, omitted:0, full:true };

  // The anchors are never dropped. If they alone exceed the budget, split it
  // 60/40 between them rather than losing the back of the document entirely.
  let front=EXTRACT_FRONT, back=EXTRACT_BACK;
  if(front+back>cap){ front=Math.floor(cap*0.6); back=cap-front; }
  let accepted=[{ start:0, end:Math.min(front,t.length) },
                { start:Math.max(0,t.length-back), end:t.length }];
  accepted=_mergeSpans(accepted);

  // Candidate windows around every term-critical mention, in priority order.
  const cands=[];
  for(const { prio, re } of EXTRACT_TERMS){
    re.lastIndex=0; let m;
    while((m=re.exec(t))){
      cands.push({ prio, order:m.index,
        start:_clamp(m.index-EXTRACT_WINDOW,0,t.length),
        end:_clamp(m.index+m[0].length+EXTRACT_WINDOW,0,t.length) });
      if(re.lastIndex===m.index) re.lastIndex++;   // zero-width guard
    }
  }
  cands.sort((a,b)=> a.prio-b.prio || a.order-b.order);

  // Greedily take windows while they fit. A window that does not fit is skipped
  // rather than ending the loop — a later, smaller one may still fit, and the
  // priority order is preserved either way.
  let dropped=0;
  for(const c of cands){
    const trial=_mergeSpans(accepted.concat([{start:c.start,end:c.end}]));
    if(_spanLen(trial)<=cap) accepted=trial; else dropped++;
  }

  // Join in original document order, naming every gap so the model knows text
  // was elided and does not read meaning into the join.
  const parts=[]; let cursor=0, omitted=0;
  for(const s of accepted){
    if(s.start>cursor){ const gap=s.start-cursor; omitted+=gap;
      parts.push(`\n\n[... ${gap.toLocaleString(jxLocale())} characters omitted ...]\n\n`); }
    parts.push(t.slice(s.start,s.end));
    cursor=s.end;
  }
  if(cursor<t.length){ const gap=t.length-cursor; omitted+=gap;
    parts.push(`\n\n[... ${gap.toLocaleString(jxLocale())} characters omitted ...]`); }
  return { text:parts.join(''), sections:accepted.length, omitted, dropped, full:false, sourceChars:t.length };
}

/* ---- thorough mode ----
   Off by default. When on, the WHOLE document is read in overlapping 30,000-
   character windows, one deep-tier extraction per window, merged field by
   field. It multiplies cost, which the settings UI and the pre-flight estimate
   both say plainly. */
const THOROUGH_CHUNK = 30000, THOROUGH_OVERLAP = 3000;
function thoroughChunks(text){
  const t=String(text||'');
  if(t.length<=THOROUGH_CHUNK) return [t];
  const out=[]; let i=0;
  while(i<t.length){
    out.push(t.slice(i, i+THOROUGH_CHUNK));
    if(i+THOROUGH_CHUNK>=t.length) break;
    i += THOROUGH_CHUNK-THOROUGH_OVERLAP;
  }
  return out;
}
const CONF_RANK={ high:3, medium:2, low:1 };
/* Later chunks win a tie for the fields that live at the back of an agreement;
   earlier chunks win for the fields that are settled on page one. Anything not
   listed defaults to earlier-wins, which is the safer bet for identity fields. */
const LATE_WINS = new Set(['expiryDate','renewalType','noticePeriodDays']);
function mergeThorough(results){
  const out={ confidence:{}, sourceSpans:{} };
  const best={};
  results.forEach((meta,i)=>{
    if(!meta) return;
    for(const f of META_FIELDS){
      const k=f.k, v=meta[k];
      if(v==null || v==='' || (f.type==='num' && !(Number(v)>0))) continue;
      const rank=CONF_RANK[(meta.confidence||{})[k]]||1;
      const cur=best[k];
      if(!cur){ best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' }; continue; }
      if(rank>cur.rank){ best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' }; continue; }
      if(rank===cur.rank && LATE_WINS.has(k) && i>cur.i)
        best[k]={ v, rank, i, span:(meta.sourceSpans||{})[k], conf:(meta.confidence||{})[k]||'low' };
      // ties on every other field keep the earlier chunk's answer
    }
  });
  for(const [k,b] of Object.entries(best)){
    out[k]=b.v; out.confidence[k]=b.conf;
    if(b.span) out.sourceSpans[k]=b.span;
  }
  out._thorough={ chunks:results.length, read:results.filter(Boolean).length };
  return out;
}

/* ---- the single server-Copilot extraction call ----
   One place that decides what text is sent (buildExtractionPayload, not a blind
   head-slice) and which budget it draws on. Throws on failure so the caller can
   distinguish a spend ceiling from a transport error. */
async function aiExtractMetadata(text, opts={}){
  const thorough = opts.thorough!=null ? !!opts.thorough
    : !!(state.aiCfg&&state.aiCfg.limits&&state.aiCfg.limits.thoroughExtract);
  const t = String(text||'');

  if(thorough && t.length>THOROUGH_CHUNK){
    // one deep-tier call per overlapping window, merged field by field
    const chunks = thoroughChunks(t);
    const results = [];
    for(let i=0;i<chunks.length;i++){
      if(typeof opts.onChunk==='function') opts.onChunk(i, chunks.length);
      try{
        const r = await api('ai/extract','POST',
          { text: chunks[i], allowance: !!opts.allowance, thorough: true, part: i+1, parts: chunks.length });
        const m = r.metadata || {};
        if(r.sourceSpans) m.sourceSpans = r.sourceSpans;
        results.push(m);
      }catch(e){
        // a budget ceiling mid-way still leaves everything read so far usable
        if(!results.length) throw e;
        results.push(null);
        break;
      }
    }
    const merged = mergeThorough(results);
    merged._payload = { chars:t.length, sections:chunks.length, omitted:0, thorough:true };
    return merged;
  }

  // one Copilot call per contract — a 25-file batch has to get through the 15-minute
  // light-tier limit of 40 calls
  const payload = buildExtractionPayload(t);
  const r = await api('ai/extract','POST', { text: payload.text, allowance: !!opts.allowance });
  const meta = r.metadata || {};
  if(r.sourceSpans) meta.sourceSpans = r.sourceSpans;
  meta._payload = { chars: payload.text.length, sections: payload.sections,
    omitted: payload.omitted, sourceChars: payload.sourceChars||t.length };
  return meta;
}

/* ============================================================================
   HaTi CHECKS ITS OWN ARITHMETIC.

   Reported off a real upload (Young, 11 Aug 2026): the expiry came back as
   29 August 2026 on a contract whose own quoted phrase read "remain in force
   for 3 years from the effective date", with an effective date of 9 August
   2026. Three years from then is 2029, not three weeks later.

   A DURATION IS A SUM, AND A SUM CAN BE CHECKED. When the document states a
   term as a length of time from a date HaTi already has, the end date is not a
   matter of opinion — so it is worked out here and compared. Nothing is
   silently overwritten: the review card shows the mismatch, says what the
   document implies, and offers the computed date as one press. The human still
   confirms, which is the whole point of that screen.

   WHY IT MATTERS MORE THAN IT LOOKS: an expiry date is not decoration. It
   drives the renewal reminder, the calendar, the register's expiry views and
   the runway charts. A date three years early does not merely look wrong, it
   fires an alarm nobody needs and hides the one they do.
   ========================================================================= */
const TERM_WORDS = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8,
  nine:9, ten:10, eleven:11, twelve:12, eighteen:18, twenty:20, thirty:30 };
/* A month is not 30 days when a lawyer says "12 months from 9 August" — they
   mean the same day of the month. Calendar arithmetic, then, not multiplication. */
function termAdd(iso, n, unit){
  const t = Date.parse(String(iso||'')+'T00:00:00'); if(isNaN(t)) return null;
  const d = new Date(t);
  if(/^year/.test(unit))      d.setFullYear(d.getFullYear()+n);
  else if(/^month/.test(unit))d.setMonth(d.getMonth()+n);
  else if(/^week/.test(unit)) d.setDate(d.getDate()+n*7);
  else                        d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
const _termN = raw => { const k=String(raw||'').toLowerCase();
  return /^\d+$/.test(k) ? Number(k) : (TERM_WORDS[k]||0); };
/* Reads a stated term out of the document. "twelve (12) months" is the shape
   contracts actually use, so the bracketed digits are allowed to follow the
   word and win — they are the drafter's own restatement. */
function metaReadTerm(text){
  const t = String(text||'').replace(/\s+/g,' ');
  const NUM = '(\\d{1,3}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|eighteen|twenty|thirty)';
  const UNIT = '(day|week|month|year)s?';
  const pats = [
    new RegExp('(?:remain(?:ing)? in (?:full )?force|continue in (?:full )?force)[^.]{0,60}?(?:for )?(?:a )?(?:period|term) of '+NUM+'\\s*(?:\\((\\d{1,3})\\)\\s*)?'+UNIT,'i'),
    new RegExp('(?:remain(?:ing)? in (?:full )?force|continue in (?:full )?force)[^.]{0,40}?for '+NUM+'\\s*(?:\\((\\d{1,3})\\)\\s*)?'+UNIT,'i'),
    new RegExp('(?:term|duration) of this agreement[^.]{0,60}?'+NUM+'\\s*(?:\\((\\d{1,3})\\)\\s*)?'+UNIT,'i'),
    new RegExp('for (?:an? )?(?:initial )?(?:period|term) of '+NUM+'\\s*(?:\\((\\d{1,3})\\)\\s*)?'+UNIT,'i'),
  ];
  for(const re of pats){
    const m = t.match(re);
    if(!m) continue;
    const n = m[2] ? Number(m[2]) : _termN(m[1]);
    if(n>0) return { n, unit:String(m[3]||m[2]||'').toLowerCase(), quoted:m[0].trim().slice(0,140) };
  }
  return null;
}
/* Attaches meta.checks.expiryDate when the document's own term disagrees with
   the extracted end date. Tolerance is 40 days: a contract that says "3 years"
   and ends on the anniversary minus a day is not a mistake worth shouting
   about, and one that is three YEARS out is. */
const TERM_TOLERANCE_DAYS = 40;
function metaCheckTerm(text, meta){
  if(!meta || !meta.effectiveDate) return meta;
  const term = metaReadTerm(text);
  if(!term) return meta;
  const expected = termAdd(meta.effectiveDate, term.n, term.unit);
  if(!expected) return meta;
  const got = meta.expiryDate;
  const gap = got ? Math.abs((Date.parse(got+'T00:00:00')-Date.parse(expected+'T00:00:00'))/864e5) : Infinity;
  if(isFinite(gap) && gap <= TERM_TOLERANCE_DAYS) return meta;
  meta.checks = meta.checks || {};
  meta.checks.expiryDate = { expected, n:term.n, unit:term.unit, quoted:term.quoted, had:got||'' };
  /* A field HaTi can show is wrong is not a field it may call confident. */
  meta.confidence = meta.confidence || {};
  meta.confidence.expiryDate = 'low';
  return meta;
}

/* ---- run extraction: server Copilot if configured, else heuristic ---- */
async function extractMetadata(text, seed, opts={}){
  let meta = null;
  if(API_MODE() && state.aiConfigured){
    try{ meta=await aiExtractMetadata(text, opts); meta._source='ai'; }
    catch(e){ /* fall through to heuristic — the 429 toast has already fired */ }
  }
  if(!meta){ meta=heuristicExtract(text); meta._source='heuristic'; }
  // seed with what the uploader already typed (higher trust than a low-conf guess)
  /* Checked before the seed is applied, so a date the uploader typed in
     themselves is never second-guessed by a phrase in the document. */
  try{ meta=metaCheckTerm(text, meta); }catch(e){}
  if(seed){ meta.confidence=meta.confidence||{};
    if(seed.counterparty){ meta.counterparty=seed.counterparty; meta.confidence.counterparty='high'; }
    if(seed.value){ meta.value=seed.value; meta.confidence.value='high'; if(!meta.currency) meta.currency=(typeof jxCurrency==='function'?jxCurrency():'KES'); }
    if(seed.expiry){ meta.expiryDate=seed.expiry; meta.confidence.expiryDate='high';
      if(meta.checks) delete meta.checks.expiryDate; }
  }
  return meta;
}

/* ---- review-and-confirm panel: the human always confirms before save ---- */
function openMetaReview(meta, onConfirm, opts={}){
  const c = meta.confidence||{};
  const badge = lvl => lvl==='low' ? `<span class="ml-1.5 text-[9px] font-mono uppercase tracking-wide text-amber bg-gold-500/12 rounded px-1 py-0.5">low</span>`
    : lvl==='medium' ? `<span class="ml-1.5 text-[9px] font-mono uppercase tracking-wide text-brand-600 bg-brand-50 rounded px-1 py-0.5">med</span>` : '';
  const p = meta._payload;
  // Say how much of the document was actually read — "Copilot-extracted" over the
  // first eight pages is a materially different claim from over all of it.
  const coverage = !p ? ''
    : p.thorough ? ` · whole document read in ${p.sections} overlapping section${p.sections===1?'':'s'} (thorough mode)`
    : p.omitted ? ` · read the front, the back and ${p.sections-2>0?p.sections-2:0} clause window${p.sections-2===1?'':'s'} of a ${Number(p.sourceChars||0).toLocaleString(jxLocale())}-character document`
    : ` · read the whole ${Number(p.chars||0).toLocaleString(jxLocale())}-character document`;
  const src = (meta._source==='ai' ? 'Copilot-extracted' : 'Pattern-matched (no Copilot key)') + coverage;
  /* A QUEUE NEEDS A DOOR. Opened one at a time from a backfill, this dialog had
     Cancel — which meant "next", not "stop" — so the only way out of a run of
     forty was to dismiss forty. Escape did end it, but silently, which is worse
     than no exit: nothing told you it had stopped or how much was left.
     When a caller supplies onStop the dialog says where you are in the queue,
     offers Skip and Stop as separate buttons, and treats clicking away or
     pressing Escape as Stop — because that is what a person means by it. */
  const queued = typeof opts.onStop === 'function';
  const pos = (queued && opts.queue) ? `<span style="margin-left:auto;font-size:11px;font-weight:600;color:var(--color-neutral-600);white-space:nowrap">${i18t('me_queue_pos',{i:opts.queue.i,n:opts.queue.n})}</span>` : '';
  /* The phrase each value came from, shown under the field. This is what turns
     the confirm step from a leap of faith into a glance — the same
     verbatim-quoting pattern the clause review already uses. */
  const spans = meta.sourceSpans||{};
  const esc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  /* WHERE HaTi DISAGREES WITH ITSELF, IT SAYS SO — under the field, in amber,
     with the date the document implies and one press to take it. Not applied
     silently: this screen exists because a person confirms, and a value that
     changed itself while they were reading it is the one thing that would make
     them stop trusting the rest. */
  const checks = meta.checks||{};
  const checkLine = k => { const ck=checks[k]; if(!ck) return '';
    const pretty = iso => { const t=Date.parse(String(iso)+'T00:00:00');
      if(isNaN(t)) return String(iso);
      try{ return new Date(t).toLocaleDateString(langLocale(),{day:'2-digit',month:'short',year:'numeric'}); }
      catch(e){ return String(iso); } };
    return `<span style="display:block;margin-top:4px;padding:5px 7px;border-radius:0;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);font-size:10.5px;line-height:1.5">
      ${esc(i18t('me_term_mismatch',{n:ck.n, unit:i18t('me_unit_'+String(ck.unit).replace(/s$/,'')), from:pretty(meta.effectiveDate), to:pretty(ck.expected)}))}
      <button type="button" data-mf-use="${k}" data-mf-val="${esc(ck.expected)}" style="border:0;background:none;padding:0;margin-left:4px;font:inherit;font-size:10.5px;font-weight:700;color:inherit;text-decoration:underline;cursor:pointer">${esc(i18t('me_term_use',{d:pretty(ck.expected)}))}</button>
      ${spans[k] ? '' : `<span style="display:block;margin-top:3px;opacity:.85"><i>“${esc(String(ck.quoted).slice(0,120))}”</i></span>`}</span>`; };
  const spanLine = k => { const q=spans[k]; if(!q) return '';
    const t=String(q).replace(/\s+/g,' ').trim().slice(0,180);
    if(!t) return '';
    return `<span style="display:block;margin-top:3px;font-size:10.5px;line-height:1.45;color:var(--color-neutral-600)">found: <i>“${esc(t)}”</i></span>`; };
  const field = f => {
    const v = meta[f.k]!=null ? meta[f.k] : '';
    const low = c[f.k]==='low' || !!checks[f.k];
    const ring = low ? 'border-gold-400 bg-gold-500/5' : 'border-inputln bg-white';
    if(f.type==='select'){
      return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
        <select data-mf="${f.k}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500">
          ${f.opts.map(o=>`<option value="${o}" ${v===o?'selected':''}>${metaOptLabel(o)}</option>`).join('')}</select>${spanLine(f.k)}${checkLine(f.k)}</label>`;
    }
    const it = f.type==='date'?'date':(f.type==='num'?'number':'text');
    return `<label class="block"><span class="text-[11px] font-600 text-ink/70">${f.label}${badge(c[f.k])}</span>
      <input data-mf="${f.k}" type="${it}" value="${String(v).replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border ${ring} px-2.5 py-2 text-sm outline-none focus:border-brand-500"/>${spanLine(f.k)}${checkLine(f.k)}</label>`;
  };
  openModal(`
    <div class="p-6 max-w-lg">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">${i18t('me_review_extracted')}</h3>${pos}</div>
      <p class="text-xs text-ink/60 mb-4">${src}. Check each field — <span class="text-amber font-600">low-confidence</span> ${i18t('me_fields_highlighted')}</p>
      ${opts.ocrNotice?`<div style="display:flex;align-items:flex-start;gap:8px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:0;padding:8px 11px;font-size:11.5px;line-height:1.55;margin:-8px 0 14px">
        <span style="flex:none;margin-top:1px">${icon('scan','w-3.5 h-3.5')}</span>
        <span>${String(opts.ocrNotice).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))} Every field below is capped at <b>medium</b> confidence until you confirm it.</span></div>`:''}
      <div class="grid grid-cols-2 gap-3" style="max-height:min(52vh,460px);overflow-y:auto;padding-right:4px">${META_FIELDS.map(field).join('')}</div>
      <div class="flex justify-end gap-2 mt-5">
        ${queued?`<button id="mr-stop" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50" style="margin-right:auto">${i18t('me_stop')}</button>`:''}
        <button id="mr-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${queued?i18t('me_skip_this'):i18t('act_cancel')}</button>
        <button id="mr-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${opts.saveLabel||'Confirm & save'}</button>
      </div>
    </div>`);
  // A scrim click closes the modal (openModal wiring) without telling the
  // caller — for an upload that silently discarded the whole contract. Treat
  // it exactly like Cancel so the pending save still completes.
  let settled=false;
  const leave=()=>{ if(settled) return; settled=true;
    if(queued) opts.onStop(); else if(opts.onCancel) opts.onCancel(); };
  document.getElementById('modal-scrim').addEventListener('click',leave);
  /* Escape reaches core's own handler, which closes the dialog and tells nobody.
     In a queue that stranded the run halfway with no message at all. */
  document.addEventListener('keydown',function esc(e){
    if(e.key!=='Escape'){ if(settled) document.removeEventListener('keydown',esc); return; }
    document.removeEventListener('keydown',esc); leave();
  });
  document.querySelectorAll('[data-mf-use]').forEach(b=>b.addEventListener('click',e=>{
    e.preventDefault();
    const k=b.getAttribute('data-mf-use'), el=document.querySelector(`[data-mf="${k}"]`);
    if(el){ el.value=b.getAttribute('data-mf-val'); el.dispatchEvent(new Event('change',{bubbles:true})); }
    /* the warning has been answered; leaving it up would read as unresolved */
    b.closest('span[style*="st-amber-bg"]')?.remove();
  }));
  document.getElementById('mr-stop')?.addEventListener('click',()=>{ settled=true; closeModal(); opts.onStop(); });
  document.getElementById('mr-cancel').addEventListener('click',()=>{ settled=true; closeModal(); if(opts.onCancel) opts.onCancel(); });
  document.getElementById('mr-save').addEventListener('click',()=>{
    settled=true;
    const out={ confidence:{} };
    document.querySelectorAll('[data-mf]').forEach(el=>{ const k=el.getAttribute('data-mf'); let v=el.value;
      const f=META_FIELDS.find(x=>x.k===k); if(f.type==='num') v=v===''?0:Number(v);
      out[k]=v; out.confidence[k]= (c[k]&&el.value===String(meta[k]!=null?meta[k]:''))?c[k]:'high'; });
    // keep the evidence with the record — a reviewer later can see what phrase
    // each value was read from, and how much of the document was read
    if(meta.sourceSpans) out.sourceSpans=meta.sourceSpans;
    if(meta._payload) out._payload=meta._payload;
    if(meta._thorough) out._thorough=meta._thorough;
    out.confirmedAt=nowISO(); out.confirmedBy=currentUser()?.name||'';
    closeModal(); onConfirm(out);
  });
}

/* ---- backfill: extract metadata for existing uploads, one at a time,
   each queued for human review before it is written. ---- */
async function runMetaBackfill(opts={}){
  /* TWO ERRANDS, ONE QUEUE. The original: uploads nobody has confirmed yet.
     The second, added with the category field: contracts that WERE confirmed,
     back when there was no category to confirm, and therefore cannot be
     grouped by anything. Those are already "done" by the first test, so
     without this they would sit uncountable forever with no way to reach
     them. */
  const needCat = !!opts.missingCategory;
  const todo = needCat
    ? state.contracts.filter(c=>c.status!=='Declined' && !c.archived && !(c.metadata&&c.metadata.category))
    : state.contracts.filter(c=>isUpload(c) && !(c.metadata&&c.metadata.confirmedAt));
  if(!todo.length){ toast(i18t(needCat?'me_all_categorised':'me_all_confirmed')); return; }
  const lbl=document.getElementById('meta-backfill-lbl');
  let done=0, idx=0, stopped=false;
  const total=todo.length;
  const reset=()=>{ if(lbl) lbl.textContent=i18t('set_extract_metadata'); };
  /* Stopping is a real outcome, not an abort: it says what was done, what is
     left, and where to pick it up. A run that ends in silence teaches people
     never to start one. */
  const stop=()=>{
    if(stopped) return; stopped=true; reset();
    const left=todo.length;
    /* "Stopped after 0" is a sentence nobody writes. The count only earns a
       mention once there is one. */
    toast(left ? i18tn(done?'me_stopped_cat':'me_stopped', left, {n:left, done})
               : i18t('me_all_done_after',{n:done}));
  };
  const next=async()=>{
    if(stopped) return;
    if(!todo.length){ reset(); toast(i18t('me_all_done_after',{n:done})); return; }
    const c=todo.shift(); idx++;
    if(lbl) lbl.textContent=i18t('me_reading_n',{name:c.name, n:todo.length});
    try{ await ensureFull(c); }catch(e){}
    const text=(c.upload&&c.upload.extractedText)||contractPlainText(c);
    if(!text || text.length<200){
      /* Nothing readable in the file. For the original errand that is a skip —
         there is nothing to extract. For the category errand it is not: a
         person can still say what kind of agreement this is, and refusing to
         ask them would leave the contract uncountable with no route out. */
      if(!needCat) return next();
      const bare=Object.assign({}, c.metadata||{},
        { confidence:Object.assign({}, (c.metadata&&c.metadata.confidence)||{}), _source:'heuristic' });
      openMetaReview(bare, m=>{ applyMetadata(c, m); persist(c); done++; next(); },
        { saveLabel:i18t('me_save_next'), onCancel:next, onStop:stop, queue:{i:idx,n:total} });
      return;
    }
    const meta=await extractMetadata(text, {counterparty:c.counterparty, value:c.value, expiry:c.expiry});
    openMetaReview(meta, m=>{ applyMetadata(c, m); persist(c); done++; next(); },
      { saveLabel:i18t('me_save_next'), onCancel:next, onStop:stop, queue:{i:idx,n:total} });
  };
  next();
}

Object.assign(window,{META_FIELDS,RENEWAL_LABEL,termAdd,metaReadTerm,metaCheckTerm,TERM_TOLERANCE_DAYS,META_OPT_LABEL,metaOptLabel,unitDays,heuristicExtract,buildExtractionPayload,thoroughChunks,mergeThorough,THOROUGH_CHUNK,EXTRACT_TERMS,aiExtractMetadata,extractMetadata,openMetaReview,runMetaBackfill});
