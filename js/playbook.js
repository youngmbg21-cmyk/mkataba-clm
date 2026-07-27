// HaTi — E4 Kenya playbook engine + clause library. Globals window-attached.
// Reviews incoming paper against the org's preferred/fallback positions
// (Ironclad-Jurist style), augmenting the existing rule-engine scan.

/* ---- clause library (E4-T1): seeded from Kenyan practice, editable ---- */
const DEFAULT_CLAUSE_LIBRARY = [
  { id:'cl-law', category:'Governing law', name:'Kenyan governing law & forum',
    preferred:'This Agreement is governed by the laws of Kenya and the parties submit to the exclusive jurisdiction of the courts of Kenya (or arbitration seated in Nairobi under the Nairobi Centre for International Arbitration).',
    fallback:'This Agreement is governed by the laws of Kenya; disputes may be referred to arbitration seated in Nairobi.',
    guidance:'Keep governing law and forum in Kenya. Foreign law/forum makes enforcement slow and costly and may bypass Kenyan protections.' },
  { id:'cl-pay', category:'Payment terms', name:'Payment within 30 days',
    preferred:'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt, in Kenya Shillings, exclusive of VAT.',
    fallback:'Payment within forty-five (45) days of a valid invoice.',
    guidance:'Prefer ≤ 30 days; 45 days is the outer limit. Anything longer needs Finance sign-off.' },
  { id:'cl-liab', category:'Liability cap', name:'Liability cap at 12 months fees',
    preferred:'Each party’s aggregate liability under this Agreement is capped at the total fees paid in the twelve (12) months preceding the claim, save for liability that cannot be limited at law.',
    fallback:'Liability capped at the total contract value.',
    guidance:'A cap should be at least 12 months of fees and must carve out what Kenyan law will not allow to be limited (e.g. death/personal injury, fraud).' },
  { id:'cl-conf', category:'Confidentiality', name:'Mutual confidentiality',
    preferred:'Each party shall keep the other’s confidential information secret and use it only for this Agreement, for the term and three (3) years after.',
    fallback:'Confidentiality for the term and two (2) years after.',
    guidance:'Mutual, survives termination by 2–3 years.' },
  { id:'cl-dp', category:'Data protection', name:'Data Protection Act 2019 compliance',
    preferred:'Where personal data is processed, each party complies with the Data Protection Act, 2019 and applicable ODPC guidance, and only processes such data on documented instructions.',
    fallback:'The parties comply with the Data Protection Act, 2019.',
    guidance:'Required whenever personal data changes hands. Reference the Act and the Office of the Data Protection Commissioner (ODPC).' },
  { id:'cl-term', category:'Termination', name:'Termination on notice + cause',
    preferred:'Either party may terminate for material breach not remedied within thirty (30) days of notice, or for convenience on ninety (90) days’ written notice.',
    fallback:'Termination for uncured material breach on 30 days’ notice.',
    guidance:'Always include a cure period and clear notice mechanics.' },
];

/* ---- playbook (E4-T2/T3): per contract-type positions, Kenya FMCG ---- */
// pos: required|preferred|forbidden; range: {field, op, value} soft check.
const DEFAULT_PLAYBOOK = {
  _default: {
    label:'All contracts (baseline)',
    positions: [
      { category:'Governing law', pos:'required', clause:'cl-law', escalate:true, note:'Kenyan law & forum.' },
      { category:'Data protection', pos:'preferred', clause:'cl-dp', escalate:false, note:'Where personal data is involved.' },
    ],
    ranges: [
      { key:'paymentDays', label:'Payment terms', op:'<=', value:45, escalate:true, note:'≤ 45 days (prefer 30).' },
      { key:'liabilityMonths', label:'Liability cap', op:'>=', value:12, escalate:true, note:'≥ 12 months’ fees.' },
    ],
  },
  supply: { label:'Supply / raw material / packaging', extends:'_default',
    positions:[ { category:'Quality & rejection', pos:'required', escalate:false, note:'KEBS/EAS spec + rejection window.' },
                { category:'Liability cap', pos:'preferred', clause:'cl-liab', escalate:true } ],
    ranges:[] },
  services: { label:'Professional / marketing services', extends:'_default',
    positions:[ { category:'Confidentiality', pos:'required', clause:'cl-conf', escalate:false },
                { category:'Liability cap', pos:'required', clause:'cl-liab', escalate:true } ],
    ranges:[] },
  lease: { label:'Property lease', extends:'_default',
    positions:[ { category:'Stamp duty', pos:'required', escalate:true, note:'Stamp duty assessed & paid (Stamp Duty Act Cap 480).' } ],
    ranges:[] },
  nda: { label:'NDA', extends:'_default',
    positions:[ { category:'Confidentiality', pos:'required', clause:'cl-conf', escalate:false } ],
    ranges:[] },
};
// Map a contract kind/folder to a playbook key.
function playbookKeyFor(c){
  const k=(cKind(c)||'').toLowerCase(), f=c.folder;
  // user-defined types with custom match keywords win first (so a type added in
  // the editor actually applies to matching contracts)
  try{ const pb=playbook();
    for(const key in pb){ const p=pb[key];
      if(key==='_default'||!p||!Array.isArray(p.match)||!p.match.length) continue;
      if(p.match.some(w=>{ w=String(w||'').toLowerCase().trim(); return w && (k.includes(w)||f===w); })) return key; }
  }catch(_){}
  if(/nda|non-disclosure/.test(k)) return 'nda';
  if(/lease/.test(k)) return 'lease';
  if(/professional|marketing|services|advisory|agency/.test(k)) return 'services';
  if(/supply|packaging|raw material|manufactur|co-pack|distribut|warehous|freight|logistics|retail/.test(k)||f==='proc'||f==='sales'||f==='dist'||f==='mfg') return 'supply';
  return '_default';
}

function clauseLibrary(){ return (state.settings&&state.settings.clauseLibrary)||DEFAULT_CLAUSE_LIBRARY; }
function playbook(){ return (state.settings&&state.settings.playbook)||DEFAULT_PLAYBOOK; }
function savePlaybook(pb){ state.settings=state.settings||{}; state.settings.playbook=pb; if(typeof saveSettings==='function') saveSettings(); }
function resolvePlaybook(key){
  const pb=playbook(); const p=pb[key]||pb._default||DEFAULT_PLAYBOOK._default;
  const base=(p.extends&&pb[p.extends])?pb[p.extends]:(p.extends?DEFAULT_PLAYBOOK[p.extends]:null);
  return { label:p.label, positions:[...(base?base.positions:[]),...(p.positions||[])], ranges:[...(base?base.ranges:[]),...(p.ranges||[])] };
}
function clauseById(id){ return clauseLibrary().find(c=>c.id===id); }

/* ---- heuristic playbook review (no key): deterministic clause checks ---- */
function playbookReviewHeuristic(c, text){
  const t=String(text||'').replace(/\s+/g,' '); const T=t.toLowerCase();   // read across the document's line wrapping
  const pb=resolvePlaybook(playbookKeyFor(c));
  const verdicts=[];
  const V=(category,status,quote,position,redline,escalate)=>verdicts.push({category,status,quote:quote||'',position:position||'',redline:redline||'',escalate:!!escalate});
  // positions
  pb.positions.forEach(p=>{
    const cl=p.clause?clauseById(p.clause):null;
    let present=false, quote='';
    if(p.category==='Governing law'){ present=/govern(?:ed|ing)[^.]*law/i.test(t); const m=t.match(/[^.]*govern(?:ed|ing)[^.]*law[^.]*\./i); quote=m?m[0].trim():'';
      const foreign=/laws?\s+of\s+(england|wales|singapore|new york|delaware|switzerland|india|uae|dubai|mauritius|south africa)/i.test(t);
      if(foreign){ V(p.category,'deviation',quote,'Kenyan law & forum', cl?cl.preferred:'', true); return; } }
    else if(p.category==='Data protection'){ present=/data protection act|odpc|personal data/i.test(t); const m=t.match(/[^.]*(data protection|personal data)[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Confidentiality'){ present=/confidential/i.test(t); const m=t.match(/[^.]*confidential[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Liability cap'){ present=/liab[^.]*cap|cap[^.]*liab|aggregate liability|limitation of liability/i.test(t); const m=t.match(/[^.]*liab[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Stamp duty'){ present=/stamp dut/i.test(t); const m=t.match(/[^.]*stamp dut[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Quality & rejection'){ present=/(kebs|reject|specification|spec\b|quality)/i.test(t); const m=t.match(/[^.]*(reject|specification|quality)[^.]*\./i); quote=m?m[0].trim():''; }
    else { present=T.includes(p.category.toLowerCase()); }
    if(present) V(p.category,'aligned',quote,cl?cl.name:p.note||'','',false);
    else V(p.category,'missing','',cl?cl.name:(p.note||p.category), cl?cl.preferred:'', p.escalate);
  });
  // ranges
  pb.ranges.forEach(r=>{
    if(r.key==='paymentDays'){ const m=t.match(/within\s+(\d{1,3})\s+days?\b[^.]*\b(?:invoice|payment|delivery)/i)||t.match(/\b(?:net|payment terms?)\s*[:\-]?\s*(\d{1,3})\s*days/i);
      if(m){ const d=Number(m[1]); const ok=r.op==='<='?d<=r.value:d>=r.value; V(r.label, ok?'aligned':'deviation', m[0].trim(), r.note||`${r.op} ${r.value} days`, ok?'':clauseById('cl-pay')?.preferred||'', !ok&&r.escalate); }
      else V(r.label,'missing','',r.note||'Payment terms', clauseById('cl-pay')?.preferred||'', r.escalate); }
    else if(r.key==='liabilityMonths'){ const m=t.match(/(\d{1,3})\s+months?[^.]*\b(?:fees|liabilit)/i)||t.match(/liab[^.]*?(\d{1,3})\s+months/i);
      if(m){ const d=Number(m[1]); const ok=d>=r.value; V(r.label, ok?'aligned':'deviation', m[0].trim(), r.note||`≥ ${r.value} months`, ok?'':clauseById('cl-liab')?.preferred||'', !ok&&r.escalate); }
      // if no explicit months, the 'Liability cap' position check already covers presence
    }
  });
  return { key:playbookKeyFor(c), label:pb.label, verdicts, source:'heuristic' };
}
async function runPlaybookReview(c){
  const text = isUpload(c) ? (c.upload&&c.upload.extractedText)||'' : (window.docPlainText?docPlainText(c):'');
  if(!text || text.length<120){ toast('No readable clause text to review','err'); return null; }
  if(API_MODE() && state.aiConfigured){
    try{ const pb=resolvePlaybook(playbookKeyFor(c));
      const r=await api('ai/playbook','POST',{ text:text.slice(0,20000), playbook:pb, kind:cKind(c) });
      return { key:playbookKeyFor(c), label:pb.label, verdicts:r.verdicts||[], source:'ai' };
    }catch(e){ toast('Copilot playbook review unavailable — using the basic checks','err'); }
  }
  return playbookReviewHeuristic(c, text);
}
function deviationSummary(c){
  const r=c.playbook; if(!r) return null;
  const dev=r.verdicts.filter(v=>v.status==='deviation').length;
  const miss=r.verdicts.filter(v=>v.status==='missing').length;
  const esc=r.verdicts.filter(v=>(v.status==='deviation'||v.status==='missing')&&v.escalate).length;
  return { dev, miss, esc, total:r.verdicts.length, ok:dev===0&&miss===0 };
}

/* ---- workspace playbook review panel (E4-T5) ---- */
function renderPlaybookSection(c){
  const host=document.getElementById('playbook-section'); if(!host) return;
  const editable=canEdit()&&c.status!=='Signed';
  const r=c.playbook;
  const ins=(c.clauseInserts||[]);
  // the card must still render when a clause has been inserted but no review has
  // been run — otherwise the record of what was added would have nowhere to live
  if(!editable && !r && !ins.length){ host.innerHTML=''; return; }
  const sm=deviationSummary(c);
  const badge=st=>st==='aligned'?'bg-brand-50 text-brand-600 border-brand-200':st==='deviation'?'bg-gold-500/12 text-gold-600 border-gold-500/30':'bg-rose-50 text-rose-600 border-rose-200';
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-brand-500">${icon('shield')}</span>
        <h3 class="text-sm font-display font-600 text-ink">Playbook review</h3>
        ${sm?`<span class="ml-auto text-[10px] font-mono ${sm.ok?'text-brand-600':'text-gold-600'}">${sm.ok?'aligned':`${sm.dev} deviation${sm.dev===1?'':'s'}, ${sm.miss} missing`}</span>`:''}
      </div>
      <p class="text-[11px] text-ink/60 mb-3">${r?`Checked against the <b>${r.label}</b> playbook · ${r.source==='ai'?'Copilot review':'basic checks'}.`:'Review this contract against your preferred and fallback positions for its type.'}</p>
      ${r?`<div class="space-y-1.5 mb-3">${r.verdicts.map((v,i)=>`
        <div class="rounded-lg border border-line bg-white px-3 py-2">
          <div class="flex items-center gap-2 text-[12px]">
            <span class="inline-block rounded-full border ${badge(v.status)} px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide">${v.status}</span>
            <span class="text-ink font-500">${v.category}</span>
            ${v.escalate&&v.status!=='aligned'?`<span class="text-[9px] font-mono text-rose-500 uppercase">escalate</span>`:''}
          </div>
          ${v.quote?`<div class="mt-1 text-[10px] text-ink/55 italic border-l-2 border-line pl-2">“${(v.quote||'').slice(0,180).replace(/</g,'&lt;')}”</div>`:''}
          ${v.status!=='aligned'&&v.position?`<div class="mt-1 text-[10px] text-ink/60"><b>Preferred:</b> ${(v.position||'').replace(/</g,'&lt;')}</div>`:''}
          ${editable&&v.redline?`<button data-pb-apply="${i}" class="mt-1.5 text-[10px] font-600 text-brand-600 hover:text-brand-800">Apply suggested wording as a redline →</button>`:''}
        </div>`).join('')}</div>`:''}
      ${ins.length?`<div class="mt-3 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2">
        <div class="text-[10px] font-mono uppercase tracking-wide text-ink/50 mb-1.5">Clauses inserted into this document</div>
        ${ins.map((x,i)=>`<div class="flex items-center gap-2 text-[11px] py-0.5">
          <span class="text-brand-500 shrink-0">${icon('plus','w-3 h-3')}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-600 text-ink truncate">${String(x.name||'Clause').replace(/</g,'&lt;')}</span>
            <span class="block text-[10px] text-ink/55">${clauseInsertNote(x.where)} · ${x.by?String(x.by).replace(/</g,'&lt;')+' · ':''}${x.at?fmtDT(x.at):''}</span>
          </span>
          <button data-pb-jump="${i}" class="shrink-0 rounded-lg border border-brand-200 bg-white px-2 py-1 text-[10px] font-600 text-brand-700 hover:bg-brand-50">Show me</button>
        </div>`).join('')}
      </div>`:''}
      ${editable?`<div class="flex flex-wrap gap-2 mt-3">
        <button id="pb-run" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-600 hover:bg-brand-50 transition">${icon('scan','w-3 h-3')} ${r?'Re-run':'Run'} playbook review</button>
      </div>`:''}
    </div>`;
  host.querySelectorAll('[data-pb-jump]').forEach(b=>b.addEventListener('click',()=>{
    const x=ins[Number(b.getAttribute('data-pb-jump'))]; if(!x) return;
    if(!jumpToInsertedClause(x.name))
      toast('Could not find that clause in the document — it may have been edited or removed','err');
  }));
  document.getElementById('pb-run')?.addEventListener('click',async()=>{
    const btn=document.getElementById('pb-run'); btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Reviewing…</span>';
    const res=await runPlaybookReview(c);
    if(res){ c.playbook=res; logAudit(c,'Playbook',`Reviewed against ${res.label} — ${deviationSummary(c).dev} deviation(s), ${deviationSummary(c).miss} missing`); persist(c); }
    renderPlaybookSection(c); renderSignButton&&renderSignButton(c);
  });
  host.querySelectorAll('[data-pb-apply]').forEach(b=>b.addEventListener('click',()=>{
    const v=r.verdicts[Number(b.getAttribute('data-pb-apply'))];
    applyClauseRedline(c, v.redline, v.category);   // files a tracked change; see above
  }));
}
/* Insert a preferred clause as a redline addition (uses E2 redline text).

   An inserted clause used to be appended to the end of the document with no
   marker of any kind — no heading, no label, nothing in the workspace to say it
   had happened or where it had landed. In a contract that is not a small thing:
   you cannot review, negotiate or seal wording you cannot find. Every insertion
   now:

     · lands as a NAMED section, so it reads as a clause and not as an orphan
       paragraph glued to whatever came last;
     · says plainly where it went (the end of the document — the one place that
       cannot disrupt the existing clause numbering);
     · is recorded on the contract, listed in the review card, and jumpable to;
     · scrolls the document to it and flashes it, so the very first thing you
       see after inserting is the clause in its new home. */
function clauseInsertNote(where){
  return where==='end' ? 'appended to the end of the document' : String(where||'');
}
async function applyClauseRedline(c, clauseText, label){
  if(!clauseText) return null;
  const name=String(label||'Clause').trim();
  const u=(window.currentUser?currentUser():null);

  /* PREFERRED WORDING IS A PROPOSAL, NOT AN EDIT.

     This used to append the clause straight onto c.redlineText — the document
     simply grew, with nothing to review and nothing to accept. That was the
     same untracked editing the negotiation model replaced everywhere else, and
     it was reachable from the Docs page, which is now for reading, checking and
     signing only.

     So it files a tracked insertClause change instead: it gets a fingerprint, a
     hash, a place in the chain and an Accept/Reject like any other ask. Both
     callers benefit — the clause library and the playbook review's "apply this
     wording" — because the destination changed, not each button. */
  if(window.negoInsertClause && window.negoInit){
    negoInit(c);
    const clauses=(window.negoClauseList?negoClauseList(c):[]);
    const after=clauses.length?clauses[clauses.length-1].clauseId:null;
    const ch=await negoInsertClause(c, after,
      { headingText:name, bodyHtml:(window.textToRich?textToRich(clauseText):`<p>${String(clauseText)}</p>`) },
      { side:'owner', author:(u&&u.name)||'This workspace',
        summary:`Preferred wording inserted from the playbook — ${name}` });
    if(ch){
      c.clauseInserts=(c.clauseInserts||[]).concat([{ name, where:'end', at:nowISO(),
        by:(u&&u.name)||'System', changeId:ch.id }]);
      logAudit(c,'Playbook',`Preferred wording (${name}) proposed as ${'#'+ch.id} — it is a tracked change awaiting a decision, not an edit to the document`);
      persist(c); renderWorkspace();
      toast(`“${name}” proposed as ${'#'+ch.id} — review it in the negotiation`);
    }
    return ch;
  }
  if(window.toast) toast('The negotiation model is unavailable on this page','err');
  return null;
}

/* Scroll the document to an inserted clause and flash it.

   Matches the LAST occurrence of the clause name, because a clause can be
   inserted more than once and the most recent one is the one being asked about.

   The hard part is that "the clause" is not always an element. A formatted
   document gives us the <h3> we wrote and the blocks after it. A PLAIN-TEXT
   document does not: documentTextHtml renders the whole body as one
   `white-space:pre-wrap` block, so the smallest element containing the clause is
   the entire contract — which is why highlighting "the block" lit up the whole
   page. There, the clause has to be found as a RANGE OF TEXT and wrapped for the
   duration of the flash, then unwrapped again. */
function _clauseFlashClear(root){
  root.querySelectorAll('.clause-flash').forEach(el=>{
    if(el.hasAttribute('data-clause-flash-wrap')){
      const p=el.parentNode; if(!p) return;
      while(el.firstChild) p.insertBefore(el.firstChild, el);
      el.remove(); p.normalize();
    } else el.classList.remove('clause-flash');
  });
}
/* Where the clause sits in the document's text: from its name to the start of
   the next heading-like line, or to the end. */
function _clauseTextSpan(text, name){
  const NAME=String(name||'').toUpperCase();
  if(!NAME) return null;
  const start=text.lastIndexOf(NAME);
  if(start<0) return null;
  // a blank line followed by an ALL-CAPS line is the next section starting
  const re=/\n[ \t]*\n(?=[^a-z\n]{4,}[\n$])/g;
  re.lastIndex=start+NAME.length;
  const m=re.exec(text);
  return { start, end: m ? m.index : text.length };
}
/* Map character offsets in a subtree's text to a DOM Range. */
function _rangeFromOffsets(root, start, end){
  const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let pos=0, sn=null, so=0, en=null, eo=0, n;
  while((n=w.nextNode())){
    const len=n.nodeValue.length;
    if(sn===null && pos+len>start){ sn=n; so=start-pos; }
    if(sn!==null && pos+len>=end){ en=n; eo=end-pos; break; }
    pos+=len;
  }
  if(!sn||!en) return null;
  try{ const r=document.createRange(); r.setStart(sn,Math.max(0,so)); r.setEnd(en,Math.max(0,eo)); return r; }
  catch(e){ return null; }
}
function jumpToInsertedClause(name){
  const canvas=document.getElementById('doc-canvas'); if(!canvas) return false;
  const want=String(name||'').trim();
  if(!want) return false;
  _clauseFlashClear(canvas);

  // ---- formatted document: the heading we wrote, plus its body ----
  const heads=Array.from(canvas.querySelectorAll('h1,h2,h3,h4'))
    .filter(h=>(h.textContent||'').trim().toLowerCase()===want.toLowerCase());
  if(heads.length){
    const head=heads[heads.length-1];
    const lvl=Number(head.tagName[1]);
    const run=[head];
    for(let el=head.nextElementSibling; el; el=el.nextElementSibling){
      // stop at the next heading of the same or higher rank — that is the next clause
      if(/^H[1-4]$/.test(el.tagName) && Number(el.tagName[1])<=lvl) break;
      run.push(el);
    }
    run.forEach(el=>el.classList.add('clause-flash'));
    try{ head.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){ head.scrollIntoView(); }
    setTimeout(()=>run.forEach(el=>el.classList.remove('clause-flash')), 2600);
    return true;
  }

  // ---- plain text: wrap just the clause's own characters ----
  const span=_clauseTextSpan(canvas.textContent||'', want);
  if(span){
    const range=_rangeFromOffsets(canvas, span.start, span.end);
    if(range){
      const mark=document.createElement('span');
      mark.className='clause-flash';
      mark.setAttribute('data-clause-flash-wrap','1');
      let ok=true;
      try{ range.surroundContents(mark); }
      catch(e){
        try{ mark.appendChild(range.extractContents()); range.insertNode(mark); }
        catch(e2){ ok=false; }
      }
      if(ok){
        try{ mark.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){ mark.scrollIntoView(); }
        setTimeout(()=>_clauseFlashClear(canvas), 2600);
        return true;
      }
    }
  }

  // ---- not found: it went to the end, so go there rather than do nothing ----
  const scroller=canvas.closest('.scroll-thin')||canvas.parentElement;
  if(scroller) scroller.scrollTo({ top:scroller.scrollHeight, behavior:'smooth' });
  return false;
}

function openClausePicker(c, opts){
  const lib=clauseLibrary();
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-1">Insert clause from library</h3>
      <p class="text-xs text-ink/60 mb-3">Adds the preferred wording to the document as a redline you can review and seal.</p>
      <div class="space-y-2 max-h-[50vh] overflow-y-auto scroll-thin">
        ${lib.map(cl=>`<div class="rounded-lg border border-line bg-white p-3">
          <div class="flex items-center gap-2"><span class="text-[10px] font-mono uppercase tracking-wide text-ink/45">${cl.category}</span>
            <span class="text-[12.5px] font-600 text-ink">${cl.name}</span>
            <button data-cl-ins="${cl.id}" class="ml-auto rounded-lg bg-brand-600 text-white px-2.5 py-1 text-[11px] font-600 hover:bg-brand-700">Insert</button></div>
          <div class="mt-1 text-[11px] text-ink/65">${cl.preferred.slice(0,160)}${cl.preferred.length>160?'…':''}</div>
        </div>`).join('')}
      </div>
      <div class="flex justify-end mt-4"><button id="cp-close" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Close</button></div>
    </div>`);
  document.getElementById('cp-close').addEventListener('click',closeModal);
  const onPick=(opts&&typeof opts.onPick==='function')?opts.onPick:(cl=>applyClauseRedline(c, cl.preferred, cl.name));
  document.querySelectorAll('[data-cl-ins]').forEach(b=>b.addEventListener('click',()=>{ const cl=clauseById(b.getAttribute('data-cl-ins')); closeModal(); onPick(cl); }));
}

Object.assign(window,{DEFAULT_CLAUSE_LIBRARY,DEFAULT_PLAYBOOK,playbookKeyFor,clauseLibrary,playbook,savePlaybook,resolvePlaybook,clauseById,playbookReviewHeuristic,runPlaybookReview,deviationSummary,renderPlaybookSection,applyClauseRedline,openClausePicker,jumpToInsertedClause,clauseInsertNote,_clauseTextSpan,_rangeFromOffsets,_clauseFlashClear});
