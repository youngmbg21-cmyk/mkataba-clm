/* ============================================================================
   THE PHONE — one contract.

   Read js/mobile.js first. This file is the contract screen (Document / Key
   terms / History), the sticky next-action bar, the overflow sheet, the share
   sheet and the renumber preview.

   WHAT IT DOES NOT DECIDE, and this is the whole design:

     · what the next action IS — wsNextAction(c), the same function the desktop
       action bar reads. Six labels, one authority. A phone that worked out its
       own next step would eventually offer the seal in the middle of a
       negotiation, which is precisely the mistake that function exists to stop.
     · whether the document may be edited or renumbered — negoRenumberBlocked()
       and the executed check the server already enforces. The phone HIDES; the
       server REFUSES. If those two ever disagree, the server is right and this
       screen is a bug.
     · what the history says — negoTimeline(c), rendered here as sentences and
       grouped by the same event kinds the desktop's timeline uses.
     · whether the record is intact — negoIntegrityReport(c), which recomputes
       every fingerprint. The phone prints the verdict; it never forms one.
     · what a share link may do — the server enforces purpose. This sheet picks
       one of three and says plainly what each cannot do.
   ============================================================================ */

/* The contract this screen is about: the app's own idea of it, so opening one
   on the phone and widening the window lands on the same record. */
function mContract(){
  const id = state.activeId;
  return (id && typeof getContract==='function') ? getContract(id) : null;
}

/* Executed means sealed, and sealed means no seat edits it — not this one, not
   the desktop, not the counterparty. Read from the record the same way the
   status chip reads it. */
function mLocked(c){ return !!(c && c.status==='Signed'); }

/* ------------------------------------------------------------- THE HEADER --*/
function mContractHeadHtml(c){
  const s = mS();
  const tab = k => `<button class="m-ctab${s.tab===k?' on':''}" data-m-ctab="${k}">`;
  const party = (typeof cParty==='function' ? cParty(c) : c.counterparty) || 'No counterparty yet';
  return `
    <div class="m-pagehead" style="padding:8px 8px 0">
      <div style="display:flex;align-items:center;gap:2px;padding-bottom:8px">
        <button class="m-head-btn" data-m-act="back" aria-label="${i18t('m_back')}" style="color:var(--color-accent-700)">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        </button>
        <div style="flex:1;min-width:0">
          <div style="font-size:17px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mEsc(c.name||c.id)}</div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:1px">
            ${mPill(c)}
            <span style="flex:1;min-width:0;font-size:14px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mEsc(c.id)} · ${mEsc(party)}</span>
          </div>
        </div>
        <button class="m-head-btn" data-m-act="overflow" aria-label="${i18t('mc_more_actions')}">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/></svg>
        </button>
      </div>
      <div style="display:flex">
        ${tab('doc')}${i18t('tab_document')}</button>
        ${tab('terms')}${i18t('tab_key_terms')}</button>
        ${tab('hist')}${i18t('tab_history')}</button>
      </div>
    </div>`;
}

/* ------------------------------------------------------- THE DOCUMENT TAB --*/

/* Three notices, at most one of which is ever true at a time.

   The gap notice is offered only where renumbering is actually possible.
   negoRenumberBlocked answers that — 'locked' for an executed contract (and for
   a contract that numbers live), 'table' while there are changes on the table —
   and this reads its answer rather than guessing from the status. */
function mDocNoticesHtml(c){
  if(mLocked(c)) return `
    <div class="m-notice" style="background:var(--st-gray-bg);border-color:var(--st-gray-line)">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-600)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
      <span style="font-size:14px;color:var(--color-neutral-700);line-height:1.45">${i18t('mc_executed_sealed')}</span>
    </div>`;

  const blocked = (typeof negoRenumberBlocked==='function') ? negoRenumberBlocked(c) : 'locked';
  if(blocked==='locked' && typeof negoLiveNumbered==='function' && negoLiveNumbered(c)) return `
    <div class="m-notice" style="background:var(--st-steel-bg);border-color:var(--st-steel-line)">
      <span style="width:8px;height:8px;border-radius:50%;background:var(--st-steel-dot);flex:none"></span>
      <span style="font-size:14px;color:var(--st-steel-fg);line-height:1.45">${i18t('mc_numbers_live')}</span>
    </div>`;
  if(blocked) return '';

  let plan = null;
  try{ plan = (typeof negoRenumberPlan==='function') ? negoRenumberPlan(c) : null; }catch(_){ plan=null; }
  const moves = plan && Array.isArray(plan.moves) ? plan.moves.filter(mv=>mv && mv.from!==mv.to) : [];
  if(!moves.length) return '';
  const refs = (plan && Array.isArray(plan.refs) ? plan.refs.length : 0);
  return `
    <div class="m-notice" style="display:block;background:var(--st-amber-bg);border-color:var(--st-amber-line)">
      <div style="font-size:16px;font-weight:600;color:var(--st-amber-fg)">${i18t('mc_numbering_gap')}</div>
      <div class="m-note" style="margin-top:3px">${moves.length} heading${moves.length===1?'':'s'} still read at their old number${refs?`, and ${refs} cross-reference${refs===1?'':'s'} point${refs===1?'s':''} at them`:''}.</div>
      <button class="m-btn" style="margin-top:10px;border-color:var(--st-amber-fg);color:var(--st-amber-fg)" data-m-act="renumber">${i18t('mc_renumber')}</button>
    </div>`;
}

function mDocHtml(c){
  let body = '';
  try{ body = (typeof docBody==='function') ? docBody(c) : ''; }
  catch(e){ body = `<div class="m-note">${i18t('mc_could_not_draw')}</div>`; }
  return `
    <div class="m-scroll" style="padding:12px">
      ${mDocNoticesHtml(c)}
      <div class="m-paper">${body}</div>
      <div style="height:8px"></div>
    </div>`;
}

/* ------------------------------------------------------ THE KEY-TERMS TAB --
   The facts a person checks before they act, in the order they ask for them.
   Read straight off the record and its extracted metadata — no second store,
   and an empty one says "Not set" in the colour that means "this is why the
   contract is not moving". */
function mTermsHtml(c){
  const md = (c && c.metadata) || {};
  const dateOf = v => { if(!v) return null;
    const t = Date.parse(String(v)+'T00:00:00');
    return isNaN(t) ? String(v) : new Date(t).toLocaleDateString(jxLocale(),{day:'2-digit',month:'short',year:'numeric'}); };
  const money = (typeof canViewValues!=='function' || canViewValues());
  const rows = [
    { get label(){ return i18t('m_counterparty'); }, value:(typeof cParty==='function'?cParty(c):c.counterparty)||'', miss:true },
    money ? { get label(){ return i18t('mc_contract_value'); }, value:(typeof isMonetary==='function'&&!isMonetary(c))?'Non-monetary':(c.value?mMoney(c):''), miss:true } : null,
    { get label(){ return i18t('mc_start_date'); }, value:dateOf(md.effectiveDate||c.startDate) },
    { get label(){ return i18t('mc_expiry'); }, value:dateOf((typeof effectiveExpiry==='function'?effectiveExpiry(c):null)||c.expiry) },
    { get label(){ return i18t('mc_payment_terms'); }, value:md.paymentTerms },
    { get label(){ return i18t('mc_notice_period'); }, value:md.noticePeriodDays?md.noticePeriodDays+' days':'' },
    { get label(){ return i18t('mc_renewal'); }, value:(typeof metaOptLabel==='function'&&md.renewalType)?metaOptLabel(md.renewalType):md.renewalType },
    { get label(){ return i18t('me_category'); }, value:(typeof metaOptLabel==='function'&&md.category)?metaOptLabel(md.category):md.category },
    /* The label already carries the unit ("Retention held (%)", "Warranty
       period (months)"), so the value is the bare number. Appending " months"
       here would print an English word beside a Swedish label — a half-English
       screen is still a well-formed screen, which is why nothing would catch it. */
    { get label(){ return i18t('me_retention_pct'); }, value:md.retentionPct||'' },
    { get label(){ return i18t('me_warranty_months'); }, value:md.warrantyMonths||'' },
    { get label(){ return i18t('me_liability_cap'); }, value:(typeof metaOptLabel==='function'&&md.liabilityCapped)?metaOptLabel(md.liabilityCapped):md.liabilityCapped },
    { get label(){ return i18t('me_price_review'); }, value:(typeof metaOptLabel==='function'&&md.priceReview)?metaOptLabel(md.priceReview):md.priceReview },
    { get label(){ return i18t('mc_governing_law'); }, value:md.governingLaw },
    { get label(){ return i18t('mc_filed_under'); }, value:(typeof FOLDERS==='object'&&FOLDERS[c.folder]&&FOLDERS[c.folder].name)||'' },
    { get label(){ return i18t('mc_contract_id'); }, value:c.id },
  ].filter(Boolean);
  const missing = rows.filter(r=>r.miss && !String(r.value||'').trim()).length;
  return `
    <div class="m-scroll">
      <div class="m-card m-list" style="margin:16px">
        ${rows.map(r=>{
          const empty = !String(r.value||'').trim();
          return `<div style="display:flex;align-items:baseline;justify-content:space-between;gap:14px;padding:13px 14px">
            <span style="font-size:14px;color:var(--color-neutral-600);flex:none">${mEsc(r.label)}</span>
            <span style="font-size:16px;font-weight:500;text-align:right;min-width:0;color:${empty&&r.miss?'var(--danger)':'var(--color-text)'}">${mEsc(empty?(r.miss?'Not set':'—'):r.value)}</span>
          </div>`;
        }).join('')}
      </div>
      ${missing?`<div class="m-note" style="margin:0 16px 24px">${missing===1?'One key term is':'Two key terms are'} still empty. Fill ${missing===1?'it':'them'} to move this contract forward — on a computer, where the fields are edited.</div>`:''}
    </div>`;
}

/* --------------------------------------------------------- THE HISTORY TAB --
   The record as sentences, newest first, with the reason quoted where somebody
   gave one. The filters are the five kinds of beat a contract has; each maps
   onto the event kinds negoTimeline already emits, so the phone is grouping
   what exists rather than inventing a taxonomy of its own. */
const M_HIST_GROUP = {
  proposed:'change', withdrawn:'change', 'round-closed':'change',
  decided:'decision', signature:'signing', sealed:'signing',
  renumbered:'numbering', link:'sharing', copies:'sharing',
};
const M_HIST_DOT = {
  change:'var(--st-steel-dot)', decision:'var(--st-amber-dot)', signing:'var(--st-green-dot)',
  numbering:'var(--tile-ruby-fg)', sharing:'var(--color-neutral-500)', other:'var(--color-neutral-400)',
};
const M_HIST_CHIPS = [['all','All'],['change','Changes'],['decision','Decisions'],
  ['signing','Signing'],['numbering','Numbering'],['sharing','Sharing']];

function mHistHtml(c){
  const s = mS();
  let ev = [];
  try{ ev = (typeof negoTimeline==='function') ? negoTimeline(c) : []; }catch(_){ ev=[]; }
  ev = ev.slice().reverse();   // newest first: the point of a phone glance is what just happened
  const shown = ev.filter(e => s.hist==='all' || (M_HIST_GROUP[e.kind]||'other')===s.hist);

  const chips = M_HIST_CHIPS.map(([k,label])=>
    `<button class="m-chip${s.hist===k?' on':''}" data-m-hist="${k}">${label}</button>`).join('');

  const when = at => { const t=Date.parse(at||''); return isNaN(t)?'' :
    new Date(t).toLocaleString(jxLocale(),{dateStyle:'medium',timeStyle:'short'}); };

  const list = shown.length ? shown.map(e=>{
    const g = M_HIST_GROUP[e.kind]||'other';
    const reason = e.note || e.reply || null;
    return `<div style="display:flex;gap:11px;padding:13px 0;border-bottom:1px solid var(--color-divider)">
      <span style="width:9px;height:9px;border-radius:50%;background:${M_HIST_DOT[g]};flex:none;margin-top:7px"></span>
      <span style="min-width:0;flex:1">
        <span style="display:flex;align-items:baseline;gap:8px">
          <span style="flex:1;min-width:0;font-size:15px;font-weight:600;line-height:1.35">${mEsc(e.text)}</span>
          ${e.round?`<span style="flex:none;font-size:14px;color:var(--color-neutral-600)">Round ${mEsc(e.round)}</span>`:''}
        </span>
        ${e.clauseLabel?`<span style="display:block;font-size:14px;color:var(--color-neutral-600);margin-top:2px">${mEsc(e.clauseLabel)}</span>`:''}
        ${reason?`<span style="display:block;font-size:14px;color:var(--color-neutral-700);margin-top:5px;padding-left:9px;border-left:2px solid var(--color-neutral-300);line-height:1.5">“${mEsc(reason)}”</span>`:''}
        <span style="display:block;font-size:14px;color:var(--color-neutral-600);margin-top:4px">${mEsc([e.actor, when(e.at)].filter(Boolean).join(' · '))}</span>
      </span>
    </div>`;
  }).join('') : `<div style="padding:22px 2px;text-align:center;font-size:14px;color:var(--color-neutral-600)">${
    s.hist==='all'
      ? 'Nothing has happened on this contract yet — its story starts with the first change or the first share.'
      : "Nothing of that kind in this contract's story yet."}</div>`;

  const v = s.verify;
  return `
    <div class="m-scroll">
      <div class="m-chips" style="padding:14px 16px 4px">${chips}</div>
      <div class="m-note" style="padding:6px 16px 0">${i18t('mc_labels_as_then')}</div>
      ${v?`
      <div style="margin:12px 16px 0;display:flex;gap:10px;border-radius:12px;padding:13px;animation:mFadeIn .3s ease;
        background:${v.ok?'var(--st-green-bg)':'var(--st-ruby-bg)'};border:1px solid ${v.ok?'var(--st-green-line)':'var(--st-ruby-line)'}">
        <span style="min-width:0">
          <span style="display:block;font-size:16px;font-weight:600;color:${v.ok?'var(--st-green-fg)':'var(--st-ruby-fg)'}">
            ${v.ok?'Record verified — no entries altered since creation':'Integrity check failed'}</span>
          <span class="m-note" style="display:block;margin-top:2px">${mEsc(v.ok?v.detail:(v.firstBroken||v.detail))} · ${mEsc(String(v.at).slice(0,19).replace('T',' '))} UTC</span>
        </span>
      </div>`:''}
      <div class="m-card" style="margin:12px 16px 0;padding:4px 14px;box-shadow:none">${list}</div>
      <div style="display:flex;gap:10px;margin:12px 16px 24px">
        <button class="m-btn" style="flex:1" data-m-act="verify">${i18t('mc_verify_integrity')}</button>
        <button class="m-btn" style="flex:1" data-m-act="export-history">${i18t('mc_export_history')}</button>
      </div>
    </div>`;
}

/* ------------------------------------------------- THE STICKY ACTION BAR ---
   One sentence of guidance and at most one button, both taken from
   wsNextAction. A viewer, a declined contract and an executed one each produce
   their own honest version of "nothing for you to press here". */
function mActionBarHtml(c){
  let na = null;
  try{ na = (typeof wsNextAction==='function') ? wsNextAction(c) : null; }catch(_){ na=null; }
  const viewer = (typeof canEdit==='function') && !canEdit();
  const guide = na ? na.guide
    : viewer ? 'You have viewer access — this is read-only.'
    : c.status==='Declined' ? 'Closed — this contract is a record now.'
    : 'All key terms are set.';
  return `
    <div class="m-actionbar">
      <div class="m-note" style="margin-bottom:${na?'8px':'0'}">${guide}</div>
      ${na?`<button class="m-btn m-btn-primary" data-m-na="${mEsc(na.kind)}">${mEsc(na.label)}</button>`:''}
    </div>`;
}

function mContractHtml(){
  const c = mContract();
  if(!c) return `
    <div class="m-pagehead"><div class="m-title">${i18t('mc_no_contract_open')}</div></div>
    <div class="m-scroll"><div class="m-card" style="margin:16px;padding:24px;text-align:center">
      <div class="m-note">${i18t('mc_pick_from_contracts')}</div>
      <button class="m-btn m-btn-primary" style="margin-top:14px" data-m-tab="contracts">${i18t('mc_open_contracts')}</button>
    </div></div>`;
  const s = mS();
  const body = s.tab==='terms' ? mTermsHtml(c) : s.tab==='hist' ? mHistHtml(c) : mDocHtml(c);
  return mContractHeadHtml(c) + body + mActionBarHtml(c);
}

/* -------------------------------------------------------- OVERFLOW SHEET ---
   Everything else this contract can do. The two acts an executed contract must
   never offer — editing and renumbering — are shown greyed with the reason, not
   removed: a control that vanishes reads as a feature you have lost, and a
   control that explains itself reads as the lock it is. */
function mOverflowSheetHtml(){
  const c = mContract();
  if(!c) return '';
  const locked = mLocked(c);
  const items = [
    locked ? { k:'edit-locked', get label(){ return i18t('mc_edit_document'); }, muted:true }
           : { k:'edit', get label(){ return i18t('mc_edit_document'); }, desk:true },
    { k:'share', get label(){ return i18t('mc_share_link'); } },
    { k:'history', get label(){ return i18t('mc_history'); } },
    { k:'verify', get label(){ return i18t('mc_verify_integrity'); } },
    { k:'export-history', get label(){ return i18t('mc_export_history'); } },
    locked ? { k:'renumber-locked', get label(){ return i18t('mc_renumber'); }, muted:true }
           : { k:'renumber', get label(){ return i18t('mc_renumber'); } },
    { k:'copilot', get label(){ return i18t('mc_ask_copilot'); } },
    { k:'compare', get label(){ return i18t('mc_compare_versions'); }, desk:true },
    { k:'template', get label(){ return i18t('mc_save_as_template'); }, desk:true },
  ];
  return `
    <div class="m-grab"></div>
    ${items.map(i=>`
      <button class="m-row" data-m-act="${i.k}" style="padding:0 12px;border-radius:8px">
        <span style="flex:1;font-size:16px;font-weight:500;color:${i.muted?'var(--color-neutral-400)':'var(--color-text)'}">${mEsc(i.label)}</span>
        ${i.desk?`<span style="flex:none;font-size:14px;color:var(--color-neutral-600)">${i18t('m_computer')}</span>`:''}
      </button>`).join('')}
    <button class="m-btn m-btn-quiet" style="margin-top:6px" data-m-act="close-sheet">${i18t('act_cancel')}</button>`;
}

/* ------------------------------------------------------------ SHARE SHEET --
   One link, one purpose. The three are the three the server knows about, and
   the note under each says what that link CANNOT do — which is the half people
   get wrong. The picking happens here; the enforcing happens there. */
const M_SHARE_KINDS = [
  ['negotiate','Negotiation link','They can redline and answer changes. It cannot sign, and it never shows our risk scoring.'],
  ['sign','Signing link','Bound to one seat on the signing route. It cannot redline, and the code goes only to that address.'],
  ['view','Read-only link','A frozen snapshot for an adviser or counsel. It can do nothing at all — the server refuses.'],
];
function mShareSheetHtml(){
  const s = mS();
  const kinds = M_SHARE_KINDS.map(([k,label,note])=>{
    const on = s.share===k;
    return `<button class="m-share-kind${on?' on':''}" data-m-share="${k}">
      <span class="m-radio"><span class="m-radio-dot" style="background:${on?'var(--accent-solid)':'transparent'}"></span></span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:16px;font-weight:600">${label}</span>
        <span class="m-note" style="display:block;margin-top:2px">${note}</span>
      </span>
    </button>`;
  }).join('');
  const expiry = s.share==='view' ? 30 : 14;
  const cta = s.share==='negotiate' ? 'Create negotiation link'
    : s.share==='sign' ? 'Create signing link' : 'Create read-only link';
  /* THE PROTOTYPE HAD A SWITCH HERE AND IT DOES NOT EXIST.
     "Require email verification" was drawn as a toggle, and there is nothing
     on the server for it to set: a counterparty signature is ALWAYS verified by
     a one-time code to the invited address, and no other link kind mints one at
     all. A switch that changes nothing is worse than no switch — it tells the
     reader they have made a security decision they have not made. So the fact
     is stated instead, and it says which of the three links it applies to. */
  const verifyNote = s.share==='sign'
    ? 'A one-time code goes to the invited address before a signature is recorded. It cannot be sent anywhere else, and it is not optional.'
    : s.share==='negotiate'
      ? 'No code is needed to read or answer on a negotiation link — every reply is recorded against the address it was sent to.'
      : 'No code, no reply channel. A read-only link can be opened and printed and nothing else.';
  return `
    <div class="m-grab"></div>
    <div class="m-sheet-title">${i18t('mc_share_link')}</div>
    <div class="m-sheet-note">One link, one purpose. A negotiation link can't sign, a signing link can't redline, a read-only link can do nothing at all.</div>
    <div style="display:flex;flex-direction:column;gap:8px">${kinds}</div>
    <div class="m-card m-list" style="margin-top:12px;background:var(--color-bg)">
      <div style="display:flex;align-items:center;gap:12px;padding:13px 14px">
        <span style="flex:1;font-size:16px">${i18t('mc_expires')}</span>
        <span style="font-size:16px;font-weight:600">${expiry} days</span>
      </div>
      <div style="padding:13px 14px">
        <div style="font-size:16px">${i18t('mc_email_verification')}</div>
        <div class="m-note" style="margin-top:2px">${verifyNote}</div>
      </div>
    </div>
    <label style="display:block;margin-top:12px">
      <span class="m-capline" style="display:block;margin-bottom:5px">${i18t('mc_send_it_to')}</span>
      <input class="m-input" id="m-share-email" inputmode="email" autocomplete="off" placeholder="them@theircompany.co.ke" value="${mEsc(s.shareEmail||'')}">
    </label>
    ${s.shareErr?`<div class="m-err">${mEsc(s.shareErr)}</div>`:''}
    <button class="m-btn m-btn-primary" style="margin-top:12px" data-m-act="share-create">${cta}</button>
    <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="close-sheet">${i18t('act_cancel')}</button>`;
}

/* -------------------------------------------------------- RENUMBER SHEET ---
   Old number → new number, and the references that move with them. Nothing
   happens until Confirm, and the plan shown is the plan applied — both come
   from clauseRenumberPlan through negoRenumberPlan, so the preview cannot
   drift from the act. */
function mRenumberSheetHtml(){
  const c = mContract();
  if(!c) return '';
  let plan = null;
  try{ plan = (typeof negoRenumberPlan==='function') ? negoRenumberPlan(c) : null; }catch(_){ plan=null; }
  const moves = plan && Array.isArray(plan.moves) ? plan.moves.filter(mv=>mv && mv.from!==mv.to) : [];
  const refs = plan && Array.isArray(plan.refs) ? plan.refs : [];
  if(!moves.length) return `
    <div class="m-grab"></div>
    <div class="m-sheet-title">${i18t('mc_renumber')}</div>
    <div class="m-sheet-note">${i18t('mc_nothing_to_renumber')}</div>
    <button class="m-btn m-btn-quiet" data-m-act="close-sheet">${i18t('act_close')}</button>`;
  return `
    <div class="m-grab"></div>
    <div class="m-sheet-title">${i18t('mc_renumber')}</div>
    <div class="m-sheet-note">${i18t('mc_nothing_moves')}</div>
    <div class="m-card m-list" style="background:var(--color-bg)">
      ${moves.map(mv=>`
        <div style="display:flex;align-items:center;gap:10px;padding:12px 14px">
          <span style="flex:1;min-width:0;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${mEsc(mv.title||mv.heading||'')}</span>
          <span style="flex:none;font-size:16px;color:var(--color-neutral-600)">${mEsc(mv.from)}</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-400)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          <span style="flex:none;font-size:16px;font-weight:600">${mEsc(mv.to)}</span>
        </div>`).join('')}
    </div>
    ${refs.length?`<div class="m-note" style="margin-top:10px">${refs.length} cross-reference${refs.length===1?'':'s'} ${refs.length===1?'is':'are'} repointed in the same plan.</div>`:''}
    <button class="m-btn m-btn-primary" style="margin-top:12px" data-m-act="renumber-apply">Renumber ${moves.length} heading${moves.length===1?'':'s'}</button>
    <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="close-sheet">${i18t('act_cancel')}</button>`;
}

/* ------------------------------------------------------------- BEHAVIOUR ---*/
const M_DESK_MSG = 'Open HaTi on a computer to do this.';

function mContractAct(k, btn){
  const s = mS();
  const c = mContract();

  if(k==='overflow'){ mOpenSheet('overflow'); return; }
  if(k==='renumber'){ mOpenSheet('renumber'); return; }
  if(k==='share'){ mOpenSheet('share'); return; }
  if(k==='history'){ mCloseSheet(); s.tab='hist'; mRender(); return; }
  if(k==='copilot'){ mCloseSheet(); if(window.openAI) openAI(); return; }
  if(k==='edit'||k==='compare'||k==='template'){ mCloseSheet(); if(window.toast) toast(M_DESK_MSG); return; }
  if(k==='edit-locked'){ mCloseSheet(); if(window.toast) toast(i18t('mc_sealed_no_edit')); return; }
  if(k==='renumber-locked'){ mCloseSheet(); if(window.toast) toast(i18t('mc_never_renumber')); return; }

  if(k==='verify'){
    mCloseSheet(); s.tab='hist'; mRender();
    if(typeof negoIntegrityReport==='function' && c){
      negoIntegrityReport(c).then(r=>{ s.verify=r; mRender();
        if(window.toast) toast(r.ok
          ? 'Every fingerprint recomputed — the chain and the seal hold'
          : 'Integrity check FAILED — the first broken link is named on the record', r.ok?'ok':'err');
      }).catch(()=>{ if(window.toast) toast(i18t('mc_verify_failed'),'err'); });
    }
    return;
  }
  if(k==='export-history'){
    mCloseSheet();
    if(!c || typeof negoIntegrityReport!=='function') return;
    negoIntegrityReport(c).then(r=>{
      const html = (typeof negoHistoryExportHtml==='function') ? negoHistoryExportHtml(c, r) : '';
      if(html && window.downloadFile) downloadFile(`${c.id}-negotiation-history.html`, html, 'text/html');
      if(window.toast) toast(`History exported — the report carries its own verification result (${r.ok?'verified':'FAILED'})`);
    }).catch(()=>{ if(window.toast) toast(i18t('mc_export_failed'),'err'); });
    return;
  }

  if(k==='renumber-apply'){
    if(!c) return;
    try{
      const applied = (typeof negoRenumberApply==='function') ? negoRenumberApply(c) : null;
      mCloseSheet();
      if(window.toast) toast(applied
        ? `${applied.headings||''} heading${applied.headings===1?'':'s'} renumbered — recorded in History`.replace(/^ /,'')
        : 'Renumbering was refused — the record says why');
    }catch(e){ if(window.toast) toast(e.message||'Renumbering was refused','err'); }
    mRender();
    return;
  }

  if(k==='share-create'){ mShareCreate(); return; }
}

/* The next action, performed. Deliberately the same six kinds wsNextAction
   emits — a seventh here would be a step the desktop does not know about. */
function mDoNextAction(kind){
  const c = mContract();
  if(!c) return;
  if(kind==='evidence'){ if(window.downloadEvidence) downloadEvidence(c); return; }
  if(kind==='review-changes'){
    /* The workbench, on the phone, with the desktop shell stepping back in
       under a back bar — see the m-redline rules in js/mobile.js. It is the one
       screen the phone does not redraw, because it already reduces to a single
       column and because rebuilding where wording is argued over is the most
       expensive thing in this app to get subtly wrong. */
    if(window.openRedlineWorkbench){ openRedlineWorkbench(c.id); return; }
    if(window.toast) toast(i18t('mc_nego_on_computer'));
    return;
  }
  if(kind==='share'){ mOpenSheet('share'); return; }
  if(kind==='terms'){ mS().tab='terms'; mRender(); if(window.toast) toast(i18t('mc_fill_on_computer')); return; }
  if(kind==='review'){
    if(c.status==='Draft'){
      c.status='Under Review';
      if(typeof todayStr==='function') c.lastAction=todayStr();
      if(window.logAudit) logAudit(c,'Status changed','Draft → Under Review (sent for review)');
      if(window.persist) persist(c);
      if(window.toast) toast(i18t('mc_moved_to_review'));
      mRender();
    }
    return;
  }
  if(kind==='sign'||kind==='sign-scroll'){
    /* Signing is the one act that must not be a two-tap affair on a phone with
       nothing else on screen: it needs the intent box, the mark and the seal,
       and those live on the signing surface. */
    if(window.signDocument && kind==='sign'){ signDocument(c); return; }
    if(window.toast) toast(i18t('mc_confirm_intent'));
    return;
  }
}

/* Create the share, through the same endpoint and the same payload builder the
   desktop dialog uses. Purpose travels with it; the server is what enforces it. */
async function mShareCreate(){
  const s = mS();
  const c = mContract();
  if(!c) return;
  const email = String(s.shareEmail||'').trim();
  if(!email){ s.shareErr='Enter the address this link should go to.'; mRender(); return; }
  if(typeof API_MODE==='function' && !API_MODE()){
    s.shareErr=''; mCloseSheet();
    if(window.toast) toast(i18t('mc_sharing_needs_server'),'err');
    return;
  }
  s.shareErr=''; mRender();
  try{
    if(window.ensureFull) await ensureFull(c);
    const docHash = (window.sha256 && window.canonicalDoc) ? await sha256(canonicalDoc(c)) : null;
    const who = { name:'', email, phone:'' };
    const payload = buildSharePayload(c, docHash, who, { purpose:s.share });
    const r = await api('shares','POST',{ payload, channel:'email', recipient:who,
      expiryDays: s.share==='view'?30:14, durable:s.share!=='sign', purpose:s.share });
    mCloseSheet();
    if(window.toast) toast(r && r.emailSent
      ? `${s.share==='view'?'Read-only':s.share==='sign'?'Signing':'Negotiation'} link sent to ${email}`
      : `Link created for ${email} — it was not emailed from here`);
    if(window.refreshShareOverview) refreshShareOverview();
  }catch(e){
    s.shareErr = (e && e.message) || 'The link could not be created.';
    mRender();
  }
}

function mWireContract(root){
  const s = mS();
  root.querySelectorAll('[data-m-ctab]').forEach(b=>b.addEventListener('click',()=>{
    s.tab = b.getAttribute('data-m-ctab'); mRender();
  }));
  root.querySelectorAll('[data-m-hist]').forEach(b=>b.addEventListener('click',()=>{
    s.hist = b.getAttribute('data-m-hist'); mRender();
  }));
  root.querySelectorAll('[data-m-na]').forEach(b=>b.addEventListener('click',()=>{
    mDoNextAction(b.getAttribute('data-m-na'));
  }));
  root.querySelectorAll('[data-m-share]').forEach(b=>b.addEventListener('click',()=>{
    s.share = b.getAttribute('data-m-share'); mRender();
  }));
  const em = root.querySelector('#m-share-email');
  if(em) em.addEventListener('input',()=>{ s.shareEmail = em.value; });
}

Object.assign(window,{ mContract, mLocked, mContractHtml, mDocHtml, mTermsHtml, mHistHtml,
  mActionBarHtml, mOverflowSheetHtml, mShareSheetHtml, mRenumberSheetHtml,
  mContractAct, mWireContract, mDoNextAction, mShareCreate, M_HIST_GROUP, M_SHARE_KINDS });
