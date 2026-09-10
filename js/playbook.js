// HaTi — E4 playbook engine + clause library. Globals window-attached.
/* The positions below used to name Kenya outright. They read the active
   jurisdiction pack now (js/jurisdiction.js) — the ENGINE is market-neutral and
   the market is a setting, so "keep governing law at home" is one rule rather
   than one rule per country. Seed wording is still practice-shaped rather than
   invented: a pack supplies the place, the forum and the arbitration seat, and
   nothing here composes a legal position a pack has not declared. */
// Reviews incoming paper against the org's preferred/fallback positions
// (Ironclad-Jurist style), augmenting the existing rule-engine scan.

/* ---- clause library (E4-T1): seeded from local practice, editable ---- */
const DEFAULT_CLAUSE_LIBRARY = [
  { id:'cl-law', category:'Governing law',
    get name(){ return `${jxAdjective()} governing law & forum`; },
    get preferred(){ return jxPreferredLaw(); },
    get fallback(){ return jxFallbackLaw(); },
    get guidance(){ return `Keep governing law and forum in ${jxName()}. Foreign law/forum makes enforcement slow and costly and may bypass ${jxAdjective()} protections.`; } },
  { id:'cl-pay', category:'Payment terms', name:'Payment within 30 days',
    get preferred(){ return `The Buyer shall pay each undisputed invoice within thirty (30) days of receipt, in ${jxCurrency()}, exclusive of VAT.`; },
    fallback:'Payment within forty-five (45) days of a valid invoice.',
    guidance:'Prefer ≤ 30 days; 45 days is the outer limit. Anything longer needs Finance sign-off.' },
  { id:'cl-liab', category:'Liability cap', name:'Liability cap at 12 months fees',
    preferred:'Each party’s aggregate liability under this Agreement is capped at the total fees paid in the twelve (12) months preceding the claim, save for liability that cannot be limited at law.',
    fallback:'Liability capped at the total contract value.',
    guidance:`A cap should be at least 12 months of fees and must carve out what ${jxLaw()} will not allow to be limited (e.g. death/personal injury, fraud).` },
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

/* ---- playbook (E4-T2/T3): per contract-type positions, FMCG ---- */
// pos: required|preferred|forbidden; range: {field, op, value} soft check.
const DEFAULT_PLAYBOOK = {
  _default: {
    label:'All contracts (baseline)',
    positions: [
      { category:'Governing law', pos:'required', clause:'cl-law', escalate:true, get note(){ return `${jxAdjective()} law & forum.`; } },
      { category:'Data protection', pos:'preferred', clause:'cl-dp', escalate:false, note:'Where personal data is involved.' },
    ],
    ranges: [
      { key:'paymentDays', label:'Payment terms', op:'<=', value:45, escalate:true, note:'≤ 45 days (prefer 30).' },
      { key:'liabilityMonths', label:'Liability cap', op:'>=', value:12, escalate:true, note:'≥ 12 months’ fees.' },
    ],
  },
  supply: { label:'Supply / raw material / packaging', extends:'_default',
    positions:[ { category:'Quality & rejection', pos:'required', escalate:false,
                  /* Named where the market has a standards body to name; a plain
                     specification requirement where it does not. */
                  get note(){ const sb=jxStandardsBody(); return sb ? `${sb} spec + rejection window.` : 'Agreed product specification + rejection window.'; } },
                { category:'Liability cap', pos:'preferred', clause:'cl-liab', escalate:true } ],
    ranges:[] },
  services: { label:'Professional / marketing services', extends:'_default',
    positions:[ { category:'Confidentiality', pos:'required', clause:'cl-conf', escalate:false },
                { category:'Liability cap', pos:'required', clause:'cl-liab', escalate:true } ],
    ranges:[] },
  lease: { label:'Property lease', extends:'_default',
    get positions(){ const sd=jxStampDuty();
      /* A market with no lease stamp duty gets no position to deviate from,
         rather than one citing a statute that does not apply to it. */
      return sd ? [{ category:'Stamp duty', pos:'required', escalate:true, note:`Stamp duty assessed & paid (${sd.statute}).` }] : []; },
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
      /* Relative to the workspace, not to Kenya: the pack excludes the home
         market's own names, so switching the setting moves what counts as
         foreign without touching this line. */
      const seats=(typeof jxForeignMarkers==='function'?jxForeignMarkers():[]).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
      const foreign=seats?new RegExp(`laws?\\s+of\\s+(${seats})`,'i').test(t):false;
      if(foreign){ V(p.category,'deviation',quote,`${jxAdjective()} law & forum`, cl?cl.preferred:'', true); return; } }
    else if(p.category==='Data protection'){ present=/data protection act|odpc|personal data/i.test(t); const m=t.match(/[^.]*(data protection|personal data)[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Confidentiality'){ present=/confidential/i.test(t); const m=t.match(/[^.]*confidential[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Liability cap'){ present=/liab[^.]*cap|cap[^.]*liab|aggregate liability|limitation of liability/i.test(t); const m=t.match(/[^.]*liab[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Stamp duty'){ present=/stamp dut/i.test(t); const m=t.match(/[^.]*stamp dut[^.]*\./i); quote=m?m[0].trim():''; }
    else if(p.category==='Quality & rejection'){ const sb=(jxStandardsBody()||'').toLowerCase();
      present=new RegExp(`(${sb?sb+'|':''}reject|specification|spec\\b|quality)`,'i').test(t); const m=t.match(/[^.]*(reject|specification|quality)[^.]*\./i); quote=m?m[0].trim():''; }
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
/* `opts.quiet` SUPPRESSES THE TOAST AND CHANGES NOTHING ELSE — see
   runContractBrief for why it exists. WHERE THERE IS NO ANSWER (nothing
   readable) the reason is handed back for the caller to print; WHERE THERE IS
   ONE — the heuristic below, which is a real check against the standards — a
   quiet caller falls through to it exactly as a loud one does, or it would be
   quieter AND worse. Every existing caller passes nothing. */
async function runPlaybookReview(c,opts={}){
  const text = isUpload(c) ? (c.upload&&c.upload.extractedText)||'' : (window.docPlainText?docPlainText(c):'');
  if(!text || text.length<120){
    if(opts.quiet) return { error:i18t('pb_no_readable_clause') };
    toast(i18t('pb_no_readable_clause'),'err'); return null; }
  if(API_MODE() && state.aiConfigured){
    try{ const pb=resolvePlaybook(playbookKeyFor(c));
      // The whole wording goes. A standards check reading only the front of an
      // agreement reports "aligned" on a contract whose deviation is at the
      // back, which is worse than not checking at all. Ceiling: aiDocChars.
      const r=await api('ai/playbook','POST',{ text, playbook:pb, kind:cKind(c) },
        { quiet:!!opts.quiet });
      if(r&&r.notice) opts.notice=r.notice;
      return { key:playbookKeyFor(c), label:pb.label, verdicts:r.verdicts||[], source:'ai' };
    }catch(e){ if(!opts.quiet) toast(i18t('pb_review_unavailable'),'err'); }
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

/* ---- workspace playbook review panel (E4-T5) ----

   REDRAWN TO THE QUIET LIST (see the Contract Scan card, which reads the same
   way). It used to lead every row with a shouted status pill — ALIGNED,
   DEVIATION, MISSING — beside the category, then print the matched sentence,
   then the preferred position, then a link. Five things per row, on a panel
   that is scanned rather than read, and the one fact a reader actually wants
   from it — is anything wrong — was the hardest to pick out of the noise.

   So the status became a small coloured mark at the left, the category became
   the line you read, and everything else folds away until the row is opened.
   Nothing was dropped: the quoted wording, the preferred position and "apply
   as a redline" are all inside the row, exactly as the Scan card holds its own
   detail.

   BUT IT ARRIVES OPEN (changed 2026-08-11, asked for directly). The rows were
   shut on arrival, so pressing "Playbook review" and waiting for it produced a
   list of four headings and nothing you could act on — the quoted wording, the
   standard it misses and "apply as a redline" were all one press further away,
   four times over. You ran the review to read the findings; making you ask for
   each one again is asking twice.

   NOTE THE DELIBERATE ASYMMETRY WITH THE CHANGE CARDS, which are shut until
   somebody opens them (see "A CARD IS SHUT UNTIL SOMEBODY OPENS IT"). That
   rule exists because a busy round arrives as forty cards and a wall of open
   ones is unreadable. A playbook review is a handful of findings a reader
   opened a panel specifically to read, and it is the whole content of that
   panel. The number, and whether the list is the destination or the index, is
   what separates the two.

   SO THE SET RECORDS WHAT IS SHUT, not what is open — the reader's exceptions
   rather than the default. Keyed by contract AND category: the old key was the
   row's INDEX, which is not a fact about anything, so row 2 folded on one
   contract came back folded on the next contract's unrelated row 2. Held in
   memory for the sitting, never persisted. */
window.pbUI = window.pbUI || { shut:new Set() };
const pbFoldKey = (c,v,i) => `${(c&&c.id)||'?'}::${String((v&&v.category)||i)}`;

const PB_MARK = {
  aligned:   { bg:'var(--st-green-bg)', fg:'var(--st-green-fg)', glyph:'&#10003;', word:'matches Our standards' },
  deviation: { bg:'var(--st-amber-bg)', fg:'var(--st-amber-fg)', glyph:'!',        word:'off Our standard' },
  missing:   { bg:'var(--st-ruby-bg)',  fg:'var(--st-ruby-fg)',  glyph:'!',        word:'not in this document' },
};
const _pbEsc = s => String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));

/* The one line under the category. It says what the verdict MEANS, in the
   reader's words rather than the engine's — "Our standard is ≤ 45 days" is a
   sentence; "deviation" is a label you have to translate first. */
/* ONE READING, TWO DRESSES (owner-reported 26 Aug 2026, off a scan card
   printing the literal characters "&middot;" where a separator belongs).

   This was ONE function and it returned MARKUP. The clause editor's scan rail
   needs the same sentence as plain text, so it stripped the tags out of the
   markup and escaped what was left — and stripping tags does not touch an
   ENTITY, so the ampersand was escaped a second time and "&middot;" arrived on
   screen as five visible characters.

   So the sentence is built once in plain characters and dressed once. Nothing
   on the playbook panel moves: `·` and `&middot;` render identically, and the
   only strings _pbEsc touches here are the position, exactly as before.

   THE STANDING RULE: a reading that has to serve a markup slot AND a text slot
   is built as text and dressed at the slot. Never dressed and then undressed —
   the undressing is lossy and the loss is silent. */
function pbVerdictWords(v){
  const pos=String((v&&v.position)||'').trim();
  const st=(v&&v.status)||'';
  if(st==='aligned') return pos ? `Matches Our standards · ${pos}` : 'Matches Our standards';
  if(st==='deviation') return pos ? `Our standard is ${pos}` : 'Off Our standard';
  return pos ? `Not in this document · Our standard is ${pos}` : 'Not in this document';
}
function pbVerdictLine(v){ return _pbEsc(pbVerdictWords(v)); }
/* The pill on the header. Escalation outranks a plain count, because "two of
   these need Legal" is a different message from "two of these are open".

   AN EMPTY REVIEW IS NOT AN ALIGNED ONE. deviationSummary counts deviations and
   missing items, so a review that came back with NO verdicts at all — the
   Copilot route answering with an empty list, or a contract type with no
   positions behind it — scored zero of each and was reported as "aligned". A
   green badge over an empty list is the worst thing this panel can say: it
   tells a reader their contract was checked and passed when nothing was
   checked at all. So no verdicts, no pill, and the card says so in words. */
function pbHeadPill(sm){
  if(!sm||!sm.total) return '';
  const chip=(bg,fg,txt)=>`<span style="flex:none;font-size:var(--t-label);font-weight:var(--w-title);border-radius:var(--radius);padding:2px 9px;background:${bg};color:${fg}">${txt}</span>`;
  if(sm.ok) return chip('var(--st-green-bg)','var(--st-green-fg)','all aligned');
  if(sm.esc) return chip('var(--st-ruby-bg)','var(--st-ruby-fg)',`${sm.esc} to escalate`);
  const n=sm.dev+sm.miss;
  return chip('var(--st-amber-bg)','var(--st-amber-fg)',`${n} to fix`);
}

/* ---- WHAT HAS BEEN PROPOSED INTO THIS CONTRACT, READ OFF THE NEGOTIATION ----
   (owner-asked 10 Sep 2026, as the second half of retiring this panel's own
   Apply.)

   THIS LIST USED TO READ c.clauseInserts, A STORE WITH ONE WRITER — the very
   button that has just gone — so it would have drawn permanently empty. And it
   was already incomplete before that: a standard added from the clause
   editor's scan rail or the Playbook review window never wrote a row, so the
   panel's record of "clauses proposed" quietly missed two of the three doors.

   SO IT IS RE-POINTED RATHER THAN RETIRED, and that is the stronger half: it
   reads the negotiation's OWN pending insertClause asks, which is where every
   door lands, so the list finally covers all of them and there is one fewer
   store to keep in step. What it loses is a row for a proposal whose round has
   since closed and been archived — which is a proposal that is no longer
   pending, and this heading says "proposed".

   IT READS WITHOUT WRITING. `negoChanges` calls `negoInit`, which CREATES a
   negotiation and stamps clause ids into the stored wording; this panel is
   drawn on contracts that have never had one, so the record is read RAW —
   the trap negoClauseNamed already records against exactly this reading.

   THE SHAPE IS pbShowInsert'S OWN, so the "Show me" button beside each row is
   unchanged and still lands on the clause rather than on the negotiation. */
function pbProposedClauses(c){
  const out=[];
  for(const ch of ((c&&c.changes)||[])){
    if(!ch || ch.changeType!=='insertClause') continue;
    if(ch.withdrawn || ch.status==='superseded' || ch.status==='rejected') continue;
    if((ch.authorSide||'owner')!=='owner') continue;
    /* The row's own `x.name||'Clause'` is the fallback and always was — naming
       one here as well would be two answers to one question.

       AND THE SUB-LINE ONLY CLAIMS A PLACE WHERE THE RECORD HOLDS ONE. The
       panel's own path anchored every clause at the END of the document and
       the note said so; the negotiation's own path anchors AHEAD of the
       execution wording, which is why that door was retired — so a row for a
       clause added by the rail or the review window must not go on printing
       "proposed for the end of the document". `afterClauseId` is what the
       change records, and an absent one really is the end. */
    out.push({ name:String(ch.headingText||'').trim(),
      where:ch.afterClauseId?'awaiting':'end', at:ch.at||null, by:ch.author||null,
      changeId:ch.id||null, clauseId:ch.clauseId||null });
  }
  return out;
}
function renderPlaybookSection(c){
  const host=document.getElementById('playbook-section'); if(!host) return;
  const editable=canEdit()&&c.status!=='Signed';
  const r=c.playbook;
  const ins=pbProposedClauses(c);
  // the card must still render when a clause has been inserted but no review has
  // been run — otherwise the record of what was added would have nowhere to live
  /* Nothing run and nothing inserted → nothing to draw. The INVITATION to run
     a review moved to the Checks card at the top of this column (one row,
     beside the scan and the obligations); this card is where the VERDICTS go,
     and it stays away until there are some. It still draws for a contract with
     inserted clauses but no review, because that record has nowhere else to
     live. */
  if(!r && !ins.length){ host.innerHTML=''; return; }
  const sm=deviationSummary(c);
  /* The heading names the ENGINE THAT RAN, never the one that might have. The
     Scan card carries the same rule and the same reason: a panel headed
     "Copilot review" over checks a regular expression made is a lie the reader
     has no way to catch. */
  const head = (r && r.source==='ai') ? 'Copilot review &middot; vs Our standards' : 'Playbook review &middot; vs Our standards';
  const HEAD='font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);margin:0';
  const rowsHtml = r ? r.verdicts.map((v,i)=>{
    const m=PB_MARK[v.status]||PB_MARK.missing;
    const id=pbFoldKey(c,v,i);
    const open=!pbUI.shut.has(id);
    const detail = (v.quote || (v.status!=='aligned'&&v.position) || (editable&&v.redline));
    return `
    <div style="border-top:1px solid var(--color-divider)">
      <button ${detail?`data-pb-row="${_pbEsc(id)}"`:''} style="display:flex;align-items:flex-start;gap:9px;width:100%;text-align:left;border:0;background:none;font:inherit;color:inherit;padding:9px 2px;${detail?'cursor:pointer':'cursor:default'}">
        <span aria-hidden="true" style="flex:none;margin-top:1px;width:17px;height:17px;border-radius:50%;background:${m.bg};color:${m.fg};display:grid;place-items:center;font-size:var(--t-label);font-weight:var(--w-title);line-height:1">${m.glyph}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);line-height:1.35">${_pbEsc(v.category)}</span>
          <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45;margin-top:1px">${pbVerdictLine(v)}</span>
        </span>
        ${v.escalate&&v.status!=='aligned'?`<span title="${i18t('pb_needs_legal')}" style="flex:none;font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.06em;text-transform:uppercase;color:var(--st-ruby-fg)">escalate</span>`:''}
      </button>
      ${open&&detail?`<div style="padding:0 2px 10px 28px;display:flex;flex-direction:column;gap:6px">
        ${v.quote?`<div style="font-size:var(--t-label);line-height:1.6;color:var(--color-neutral-700);border-left:2px solid var(--color-divider);padding-left:9px;font-style:italic">&ldquo;${_pbEsc(String(v.quote).slice(0,220))}${String(v.quote).length>220?'&hellip;':''}&rdquo;</div>`:''}
        ${v.status!=='aligned'&&v.position?`<div style="font-size:var(--t-label);line-height:1.6;color:var(--color-neutral-700)"><b>${i18t('pb_our_standard')}</b> ${_pbEsc(v.position)}</div>`:''}
        ${''/* ---- THIS PANEL IS A READING, AND NOTHING ON IT FILES (owner-asked
               10 Sep 2026: "ONE DOOR ONTO ADDING A CLAUSE") ----
               It carried "Apply suggested wording as a redline", a FOURTH way
               to put a standard on the table, with its own filing path
               (applyClauseRedline) and its own landing rule — it anchored a new
               clause after the LAST clause in the document where the
               negotiation's own path deliberately anchors ahead of the
               execution wording, because text below a signature block can be
               argued as outside what was signed. Two doors onto one act do not
               fail; they drift, and these two already had.

               So the panel says what is missing or off standard and nothing
               more. ADDING STAYS WHERE IT IS: the clause editor's Playbook scan
               rail and the Playbook review window, both through
               rlFilePlaybookProposal, both now through negoAddNamedClause.

               WHAT IT COSTS, said out loud: a reader on the Document tab can no
               longer add a standard from there and must open the negotiation.
               `pb_apply_suggested` is STALE and left inert in both books. */}
      </div>`:''}
    </div>`;
  }).join('') : '';

  host.innerHTML=`
    <div style="padding:var(--s-3) 14px">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:${r?'2px':'8px'}">
        <h6 style="${HEAD};flex:1">${head}</h6>
        ${pbHeadPill(sm)}
      </div>
      ${!r
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55;margin:0">${i18t('pb_check_contract')}</p>`
        : !r.verdicts.length
        ? `<p style="font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55;margin:0">${i18t('pb_came_back_with')} <b>${i18t('pb_nothing_to_report')}</b> ${i18t('pb_not_same_as_passing')} <b>${_pbEsc(r.label)}</b> ${i18t('pb_may_have_no_positions')} <b>${i18t('nav_our_standards')}</b>${i18t('pb_then_rerun')}</p>`
        : `<p style="font-size:var(--t-label);color:var(--color-neutral-500);margin:0 0 var(--s-1)">${i18t('pb_against_the')} <b>${_pbEsc(r.label)}</b> playbook${r.source==='ai'?'':' &middot; basic checks'}</p>
      <div>${rowsHtml}</div>`}
      ${ins.length?`<div style="margin-top:10px;border-top:1px solid var(--color-divider);padding-top:9px">
        ${''/* ---- THEY ARE PROPOSED, NOT INSERTED ----
               This said "Clauses inserted into this document", and they are
               not in the document: every door files one as a
               TRACKED CHANGE awaiting Accept or Reject, deliberately, so
               preferred wording gets a fingerprint and a decision like any
               other ask. The heading promised the opposite, and "Show me" then
               searched the Document tab — a clean read of the AGREED text,
               which by design does not contain a pending proposal. It could
               never find it, and reported that the clause "may have been
               edited or removed", which was untrue twice over. */}
        <div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:6px">${i18t('pb_clauses_proposed')}</div>
        ${ins.map((x,i)=>`<div style="display:flex;align-items:center;gap:var(--s-2);padding:3px 0">
          <span style="flex:none;color:var(--color-accent)">${icon('plus','w-3 h-3')}</span>
          <span style="flex:1;min-width:0">
            <span style="display:block;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_pbEsc(x.name||'Clause')}</span>
            <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-500)">${clauseInsertNote(x.where)}${x.by?' &middot; '+_pbEsc(x.by):''}${x.at?' &middot; '+fmtDT(x.at):''}</span>
          </span>
          <button data-pb-jump="${i}" class="ui-btn" style="flex:none;font-size:var(--t-label);padding:3px 9px">${i18t('pb_show_me')}</button>
        </div>`).join('')}
      </div>`:''}
      ${editable?`<div style="margin-top:10px">
        <button id="pb-run" class="ui-btn" style="font-size:var(--t-meta);padding:5px 11px;display:inline-flex;align-items:center;gap:6px">${icon('scan','w-3 h-3')} ${r?'Re-run':'Run'} playbook review</button>
      </div>`:''}
    </div>`;
  /* Expand/collapse is a repaint of this card only — the same shape the Scan
     card uses, and the reason the open set lives outside this function. */
  host.querySelectorAll('[data-pb-row]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.getAttribute('data-pb-row');
    pbUI.shut.has(id)?pbUI.shut.delete(id):pbUI.shut.add(id);
    renderPlaybookSection(c);
  }));
  host.querySelectorAll('[data-pb-jump]').forEach(b=>b.addEventListener('click',()=>{
    const x=ins[Number(b.getAttribute('data-pb-jump'))]; if(!x) return;
    pbShowInsert(c,x);
  }));
  document.getElementById('pb-run')?.addEventListener('click',async()=>{
    const btn=document.getElementById('pb-run'); btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('pb_reviewing')}</span>`;
    const res=await runPlaybookReview(c);
    if(res){ c.playbook=res; logAudit(c,'Playbook',`Reviewed against ${res.label} — ${deviationSummary(c).dev} deviation(s), ${deviationSummary(c).miss} missing`); persist(c); }
    renderPlaybookSection(c); renderSignButton&&renderSignButton(c);
  });
}
/* ---- WHERE THAT CLAUSE WENT — ONE READING, TWO CALLERS (owner-reported
   10 Sep 2026: "When I click on apply this suggested wording it needs to take
   me where it has been added in the contract.") ----

   THE "Show me" BUTTON HAS DONE THIS SINCE IT WAS BUILT and Apply did not: it
   filed the change, repainted the room and left the reader on the Document tab
   with a toast telling them to go and look. So the journey existed and only the
   press that most needs it could not reach it. Lifted out of that button's own
   handler rather than copied, because two answers to "where did it go" is how
   the two come to land in different places.

   SHOW IT WHERE IT ACTUALLY IS. A proposal lives in the negotiation until it is
   accepted, so that is where this goes — the workbench, scrolled to the change.
   Only once it HAS been accepted is it in the document, and then the old
   document-side jump is the right one; try that first so an accepted clause
   still shows in place.

   THE SIDE PANEL COMES DOWN WITH IT, and closeModal is what does that: the
   panel openSidePanel draws wires its own ✕ to closeModal, so one call takes
   whichever of the two is up. A closeSidePanel() was written here first and
   there is no such function — a guarded call to a name nothing publishes is
   this codebase's most repeated defect, and it would have left the reader on
   the negotiation behind a drawer about the page they had just left. */
function pbShowInsert(c, x){
  if(!x) return false;
  if(jumpToInsertedClause(x.name)) return true;
  if(x.changeId && window.openRedlineWorkbench){
    if(window.closeModal) closeModal();
    openRedlineWorkbench(c.id);
    const cid=x.clauseId||x.changeId;
    /* THE SAME BEAT THE BUTTON HAS ALWAYS USED. The workbench mounts and paints
       before the jump can find a clause to scroll to. */
    setTimeout(()=>{ if(window.rlJumpToClause) rlJumpToClause(cid,{edit:false}); },420);
    return true;
  }
  toast(`“${x.name}” was proposed but its change can no longer be found — it may have been withdrawn`,'err');
  return false;
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
  /* Says what actually happened. "appended to the end of the document" read as
     a completed edit; it is a proposal sitting in the negotiation, and where it
     would land is the end of the document. */
  if(where==='end') return 'proposed for the end of the document · awaiting a decision';
  /* WHERE THE RECORD NAMES AN ANCHOR, THE PLACE IS NOT OURS TO STATE — the
     clause sits after whichever clause that is, and printing "the end of the
     document" would be this row asserting something the change does not say. */
  if(where==='awaiting') return 'proposed · awaiting a decision';
  return String(where||'');
}
/* ---- NO LIVE CALLER SINCE 10 Sep 2026, AND KEPT EXPORTED ALL THE SAME ----
   Its two callers were the panel's "Apply suggested wording as a redline",
   retired that day on the owner's ask for ONE door onto adding a clause, and
   openClausePicker's DEFAULT onPick — already dead, because that picker's one
   caller (#nego-insert-lib) passes its own.

   This file's convention for a builder whose feature has gone is negoCounter-
   LineHtml's: keep it exported rather than delete it, so a third caller cannot
   bring the feature back through a door nobody remembered — and here that
   matters more than usual, because this path anchors a new clause after the
   LAST clause in the document while the negotiation's own deliberately anchors
   AHEAD of the execution wording. It also writes c.clauseInserts, a store
   nothing reads any more.

   IT IS POINTED AT negoAddNamedClause ANYWAY, so a caller revived later
   inherits the wall by construction rather than by remembering — and its old
   guard named negoDupClauseAsk, a model function that no longer exists, which
   would have been a silent no-op: this codebase's most repeated defect.
   f279 asserts it has no caller.

   AND THE JOURNEY AT THE END OF IT WENT UNREACHABLE WITH IT, said out loud
   rather than left to be discovered. pbShowInsert(c,row) below is the answer to
   the owner's own report of the same morning — "when I click on apply this
   suggested wording it needs to take me where it has been added" — and it was
   put HERE because this was the press that needed it. Neither surviving door
   walks the reader to the clause: both are mid-task on a page the paper is
   already beside, and jumping away on every press would throw them out of the
   list they are working through. The walk is still one press away on every row
   of the proposed list above, which since the same day covers those two doors
   for the first time. */
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
    /* The heading is written the way THIS paper writes headings — see
       clauseHeadingFor; the playbook's own insert asks the same one call. */
    const heading=(window.clauseHeadingFor?clauseHeadingFor(name,clauses):name);
    /* ---- A STANDARD THAT IS ALREADY HERE IS SAID BEFORE IT IS ADDED ----
       (owner-reported 10 Sep 2026.) THE THIRD DOOR onto this act, and it asks
       the SAME reading with the SAME words as the others: no door here writes a
       sentence of its own, so four surfaces cannot come to warn about four
       different things.

       IT REFUSES NOTHING — REVERSED IN PLACE 10 Sep 2026 (owner-asked: "Today
       it is a question that refuses nothing. I want it to be impossible.").
       What stood here was that two clauses on one subject is sometimes exactly
       what somebody wants and only the reader can tell. The owner has met that
       dialog and ruled the other way, and the half of the reasoning that
       survives is the half that mattered: the reader still has a way forward,
       it is simply the RIGHT one — open the ask that is already there and
       change its wording, or withdraw it.

       REFUSED BEFORE ANYTHING IS WRITTEN, which is why the wall sits inside the
       one act rather than after the filing: negoInsertClause files, stamps a
       fingerprint and pushes a row; a refusal after that would be refusing
       something that had already happened.

       AND THIS BUILDER HAS NO LIVE CALLER (see the note at the top of it). It
       is pointed at the one act anyway, so a caller revived later inherits the
       wall by construction rather than by remembering — a guard here naming a
       model function that no longer exists would be a silent no-op, which is
       this codebase's most repeated defect. */
    const bag={ side:'owner', author:(u&&u.name)||'This workspace',
      summary:`Preferred wording inserted from the playbook — ${name}` };
    const add=window.negoAddNamedClause;
    const ch=add
      ? await add(c, { headingText:heading, afterClauseId:after,
          bodyHtml:(window.textToRich?textToRich(clauseText):`<p>${String(clauseText)}</p>`) }, bag)
      : await negoInsertClause(c, after,
          { headingText:heading, bodyHtml:(window.textToRich?textToRich(clauseText):`<p>${String(clauseText)}</p>`) }, bag);
    if(!ch && bag.refused){ toast(bag.refused.message,'warn'); return null; }
    if(ch){
      /* clauseId as well as changeId: the workbench scrolls to a CLAUSE, and
         without it "Show me" reaches the negotiation and then stops. */
      const row={ name, where:'end', at:nowISO(),
        by:(u&&u.name)||'System', changeId:ch.id, clauseId:ch.clauseId||null };
      c.clauseInserts=(c.clauseInserts||[]).concat([row]);
      logAudit(c,'Playbook',`Preferred wording (${name}) proposed as ${'#'+ch.id} — it is a tracked change awaiting a decision, not an edit to the document`);
      persist(c); renderWorkspace();
      /* ---- AND IT TAKES YOU THERE (owner-reported 10 Sep 2026) ----
         "When I click on apply this suggested wording it needs to take me where
         it has been added in the contract."

         It filed, repainted the room and left the reader on the Document tab
         with a toast telling them to go and look — so the one press that most
         needs the journey was the one press that could not reach it, while the
         "Show me" button eight rows down had done exactly this since it was
         built. pbShowInsert is that button's own reading, lifted out rather
         than copied, so the two cannot land in different places.

         THE TOAST STILL SPEAKS, and it says what happened rather than what to
         do next: the reader is now looking at the clause, so "review it in the
         negotiation" would be telling them to go where they already are. What
         it names is the fingerprint, which is the fact the screen does not
         carry — and it is 'ok' rather than silent, because a bare call prints
         nothing and this act leaves a record.

         THE JOURNEY IS LAST. persist and renderWorkspace run first, so a
         failure anywhere in the walk cannot cost the filing. */
      toast(i18t('pb_proposed_as',{name,id:'#'+ch.id}),'ok');
      pbShowInsert(c,row);
    }
    return ch;
  }
  if(window.toast) toast(i18t('pb_nego_unavailable'),'err');
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
  /* ---- THE SIGN ON THE FOURTH DOOR (owner-asked 10 Sep 2026) ----
     negoAddNamedClause is the WALL and this row can know before the press, so
     it says so and offers nothing rather than refusing after it. The heading is
     built the way the filing will build it — the same one call — or the sign
     would be answering about a different name from the wall. Null where the
     model is not loaded, which draws the list exactly as it drew before.

     AND IT READS WITHOUT WRITING: negoClauseList calls negoInit, which CREATES
     a negotiation and stamps clause ids into the stored wording, so DRAWING a
     row would start one. It is asked only where a negotiation already exists —
     which costs nothing, because negoDupClauseStop's own reading is guarded the
     same way and answers null there too, so the sign and the wall still agree. */
  const clauses=(c&&c.negotiation&&window.negoClauseList)?negoClauseList(c):[];
  const stopFor=cl=>(!window.negoDupClauseStop||!c)?null
    :negoDupClauseStop(c, window.clauseHeadingFor
      ? clauseHeadingFor(cl.name, clauses)
      : cl.name);
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('pb_insert_from_library')}</h3>
      <p class="text-xs text-ink/60 mb-3">${i18t('pb_adds_preferred')}</p>
      ${''/* No 50vh cap: the side panel this now opens in scrolls itself, and
             a scroll box inside a scroll box is two bars for one list. */}
      <div class="space-y-2">
        ${lib.map(cl=>{ const stop=stopFor(cl); return `<div class="rounded-lg border border-line bg-white p-3">
          <div class="flex items-center gap-2"><span class="text-[10px] font-mono uppercase tracking-wide text-ink/45">${cl.category}</span>
            <span class="text-[12.5px] font-600 text-ink">${cl.name}</span>
            ${stop
              ? `<span class="ml-auto text-[11px] font-600 text-ink/55" title="${_pbEsc(stop.message)}">${i18t('ng_dup_clause_here')}</span>`
              : `<button data-cl-ins="${cl.id}" class="ml-auto rounded-lg bg-brand-600 text-white px-2.5 py-1 text-[11px] font-600 hover:bg-brand-700">${i18t('pb_insert')}</button>`}</div>
          <div class="mt-1 text-[11px] text-ink/65">${cl.preferred.slice(0,160)}${cl.preferred.length>160?'…':''}</div>
          ${stop?`<div class="mt-1 text-[11px] text-ink/55">${_pbEsc(stop.message)}</div>`:''}
        </div>`; }).join('')}
      </div>
      <div class="flex justify-end mt-4"><button id="cp-close" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_close')}</button></div>
    </div>`);
  document.getElementById('cp-close').addEventListener('click',closeModal);
  /* ---- NO DEFAULT, AND THAT IS THE POINT (owner-asked 10 Sep 2026) ----
     This defaulted to applyClauseRedline — a second filing path with its own
     landing rule and no wall against duplicates. It was already dead, because
     this picker's one caller passes its own onPick; leaving it wired is
     precisely the "third caller brings the feature back through a door nobody
     remembered" that keeping the builder exported is meant to prevent. A
     picker opened with nothing to do with what it picks does nothing. */
  const onPick=(opts&&typeof opts.onPick==='function')?opts.onPick:null;
  document.querySelectorAll('[data-cl-ins]').forEach(b=>b.addEventListener('click',()=>{ const cl=clauseById(b.getAttribute('data-cl-ins')); closeModal(); if(onPick) onPick(cl); }));
}

Object.assign(window,{DEFAULT_CLAUSE_LIBRARY,DEFAULT_PLAYBOOK,playbookKeyFor,clauseLibrary,playbook,savePlaybook,resolvePlaybook,clauseById,playbookReviewHeuristic,runPlaybookReview,deviationSummary,renderPlaybookSection,pbProposedClauses,applyClauseRedline,pbShowInsert,openClausePicker,jumpToInsertedClause,clauseInsertNote,pbVerdictWords,pbVerdictLine,pbHeadPill,pbFoldKey,_clauseTextSpan,_rangeFromOffsets,_clauseFlashClear});
