/* ═══════════════════════════════════════════════════════════════════════════
   THE NOTICE DESK — a notice ready to serve (S6, HaTi's Next Fifteen)
   ═══════════════════════════════════════════════════════════════════════════

   A contract that renews itself is lost by SILENCE. Everything HaTi already
   does about that is a warning — the renewal card, the calendar, the desk row
   — and a warning is not the thing that has to happen. The thing that has to
   happen is a letter, on the right day, saying the right sentence.

   NOT ONE WORD OF IT IS WRITTEN BY A MODEL, and that is the whole design.
   Every line is composed from the record: the two parties, the agreement's
   own name and date, the notice period the wording states, and the date the
   term ends. A notice is a legal act — the sentence that decides whether an
   agreement continues for another year — and a sentence generated from a
   prompt is a sentence nobody can stand behind in front of a counterparty.

   IT DRAFTS; A PERSON SERVES. HaTi hands over the letter and records that it
   did. Sending it is the person's act, through their own channel or through
   the share door that already exists, because "served" is a claim about
   delivery and this product does not make those lightly.

   IT REFUSES RATHER THAN GUESSES. No notice period on the record, no expiry,
   no counterparty, an amendment rather than an agreement — each is a reason,
   named, and the act is not offered. A letter with a blank where the date
   should be is worse than no letter. */

/* THE TWO KINDS, and they are different letters:
     'non-renewal' — an agreement that renews itself unless somebody says
                     otherwise. The letter says we are not renewing.
     'termination' — a fixed-term agreement with a notice period. The letter
                     gives notice that it ends on its own end date.
   Nothing here drafts a termination FOR CAUSE: that rests on a breach HaTi
   has not read and cannot evidence. */
const NOTICE_KINDS = ['non-renewal', 'termination'];
/* How late is too late to still offer the letter. Past the decision date the
   notice may already be out of time — the letter is still drafted, because a
   late notice is often still worth sending, but the reading SAYS SO and the
   card prints it. */
const NOTICE_LATE_SAYS = true;

const _noEsc = s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;' }[ch]));
/* A day written the way the paper writes one. fmtDocDate reads a fixed month
   list, so a letter does not change its wording with the reader's language
   setting — the counterparty reads the agreement's own language, not ours. */
function _noDay(d){
  const s = String(d || '').slice(0, 10);
  if(!s) return '';
  try{ return (typeof fmtDocDate === 'function' ? (fmtDocDate(s) || s) : s); }catch(_){ return s; }
}

/* ---- WHY THERE IS NO LETTER, WHEN THERE IS NONE ----
   Every answer is a REASON, never a bare null, because the renewal card
   prints it: a control that is simply absent teaches the reader nothing. */
function noticeBlockers(c){
  const out = [];
  if(!c) return ['no-contract'];
  if(c.parentId) out.push('amendment');
  if(c.archived) out.push('archived');
  const w = (typeof renewalWindow === 'function') ? renewalWindow(c) : null;
  if(!w) out.push('not-in-force');
  /* INSIDE THE WINDOW, and that is not a convenience. A notice of non-renewal
     served three hundred days early is not a notice — it is a letter nobody
     asked for that a counterparty may treat as a repudiation. renewalWindow is
     the product's ONE reading of "is this decision close", and the act appears
     exactly where the renewal card it sits on appears. */
  else if(!w.inWindow) out.push('not-yet');
  if(!String(c.counterparty || '').trim()) out.push('no-counterparty');
  const notice = Number((c.metadata && c.metadata.noticePeriodDays) || 0);
  if(!(notice > 0)) out.push('no-notice-period');
  if(w && !w.expiry) out.push('no-expiry');
  return out;
}
const noticeMayDraft = c => noticeBlockers(c).length === 0;

/* ---- THE READING ----
   Plain data, no markup — the Insights panels' own rule, so the dialog, the
   desk row and the renewal card cannot come to disagree about what the letter
   says or when it is due. */
function noticeDraft(c){
  const why = noticeBlockers(c);
  if(why.length) return { ok:false, why };
  const w = renewalWindow(c);
  const auto = !!w.auto;
  const kind = auto ? 'non-renewal' : 'termination';
  const us = (typeof contractParty === 'function' ? contractParty(c) : '')
    || (typeof window !== 'undefined' && window.FIRST_PARTY) || '';
  const them = String(c.counterparty || '').trim();
  const name = String(c.name || '').replace(/\s*\(draft\)\s*$/i, '').trim();
  /* THE AGREEMENT'S OWN DATE, in the order the record answers it: the day the
     term began if that is recorded, then the day it was signed. Absent, the
     letter names the agreement without a date rather than inventing one. */
  const started = (c.metadata && c.metadata.effectiveDate)
    || (typeof contractSignedAt === 'function' ? contractSignedAt(c) : null) || '';
  return {
    ok:true, kind, us, them, name,
    started: started ? String(started).slice(0, 10) : '',
    expiry: w.expiry, decideBy: w.decideBy, notice: w.notice,
    days: w.days, late: w.days < 0 && !w.predatesRecord,
    predatesRecord: !!w.predatesRecord,
    text: noticeText({ kind, us, them, name, started, expiry:w.expiry, notice:w.notice }),
  };
}
/* THE LETTER. Four paragraphs, composed from the six facts above and nothing
   else. English, like every other RECORD this product writes: a notice is an
   instrument, and its wording is not the reader's UI language. */
function noticeText(f){
  const on = f.started ? ` dated ${_noDay(f.started)}` : '';
  const head = f.kind === 'non-renewal' ? 'NOTICE OF NON-RENEWAL' : 'NOTICE OF TERMINATION';
  const body = f.kind === 'non-renewal'
    ? [`We refer to the ${f.name || 'agreement'}${on} between ${f.us || 'us'} and ${f.them} (the "Agreement").`,
       `This letter is written notice that ${f.us || 'we'} will not renew the Agreement. The Agreement will therefore end on ${_noDay(f.expiry)} and will not continue beyond that date.`,
       `This notice is given in accordance with the ${f.notice}-day notice period stated in the Agreement.`,
       `Each party remains bound by the obligations that survive the end of the Agreement. We will be in touch about the orderly close-out of anything outstanding.`]
    : [`We refer to the ${f.name || 'agreement'}${on} between ${f.us || 'us'} and ${f.them} (the "Agreement").`,
       `This letter is written notice that ${f.us || 'we'} are terminating the Agreement with effect from ${_noDay(f.expiry)}.`,
       `This notice is given in accordance with the ${f.notice}-day notice period stated in the Agreement.`,
       `Each party remains bound by the obligations that survive the end of the Agreement. We will be in touch about the orderly close-out of anything outstanding.`];
  return `${head}\n\nTo: ${f.them}\nFrom: ${f.us || ''}\nDate: ${_noDay(new Date().toISOString())}\n\n${body.join('\n\n')}\n\nYours faithfully,\n\n\n____________________\nFor and on behalf of ${f.us || ''}`;
}

/* ---- THE ACT ----
   It hands the letter over and records that it did. It does NOT send: "served"
   is a claim about delivery, and this product does not make those lightly. */
function noticeDialogHtml(d){
  const e = _noEsc;
  return `<div class="p-6">
    <h3 style="margin:0 0 var(--s-1);font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section)">${e(i18t('nt_title'))}</h3>
    <p style="margin:0 0 var(--s-3);font-size:var(--t-meta);color:var(--color-neutral-700);line-height:1.55">${
      e(i18t(d.kind === 'non-renewal' ? 'nt_sub_nonrenewal' : 'nt_sub_termination', { date:_noDay(d.decideBy), n:d.notice }))}</p>
    ${d.late ? `<p style="margin:0 0 var(--s-3);font-size:var(--t-meta);color:var(--st-ruby-fg)">${e(i18t('nt_late', { n:Math.abs(d.days) }))}</p>` : ''}
    ${''/* A DATE OLDER THAN THE RECORD IS NOT ONE ANYBODY HERE MISSED, and the
           renewal card says exactly this about the same contract — the same
           reading (renewalWindow's `predatesRecord`), so the letter and the
           card cannot accuse the reader of two different things. Said here as
           well because the line above it names that date, and a date in the
           past with no explanation reads as a failure. */}
    ${d.predatesRecord ? `<p style="margin:0 0 var(--s-3);font-size:var(--t-meta);color:var(--st-amber-fg)">${e(i18t('nt_predates'))}</p>` : ''}
    <pre id="nt-text" style="margin:0;max-height:46vh;overflow:auto;white-space:pre-wrap;font:inherit;font-size:var(--t-meta);line-height:1.65;background:var(--color-bg);border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-3)">${e(d.text)}</pre>
    <p style="margin:var(--s-3) 0 0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.6">${e(i18t('nt_foot'))}</p>
    <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
      <button id="nt-close" class="ui-btn">${e(i18t('act_close'))}</button>
      <button id="nt-copy" class="ui-btn ui-btn-primary">${e(i18t('nt_copy'))}</button>
    </div>
  </div>`;
}
function openNoticeDialog(c){
  const d = noticeDraft(c);
  if(!d.ok){ if(typeof toast === 'function') toast(noticeWhyLine(d.why), 'warn'); return false; }
  openModal(noticeDialogHtml(d), { label:i18t('nt_title'), maxWidth:DLG_W.l });
  document.getElementById('nt-close')?.addEventListener('click', closeModal);
  document.getElementById('nt-copy')?.addEventListener('click', async () => {
    try{ await navigator.clipboard.writeText(d.text); toast(i18t('nt_copied'), 'ok'); }
    catch(_){ toast(i18t('nt_copy_failed'), 'warn'); return; }
    /* THE TRAIL SAYS A LETTER WAS DRAFTED AND TAKEN, and says no more than
       that. It does not say the notice was served, because HaTi did not serve
       it and has no way of knowing whether the person did. */
    try{
      if(typeof logAudit === 'function') logAudit(c, 'Notice',
        `A ${d.kind === 'non-renewal' ? 'non-renewal' : 'termination'} notice was drafted and copied — the Agreement ends ${_noDay(d.expiry)}. HaTi did not send it.`);
      if(typeof persist === 'function') persist(c);
    }catch(_){}
  });
  return true;
}
const noticeWhyLine = why => {
  const k = (why || [])[0] || 'no-contract';
  const KEY = { 'amendment':'nt_why_amendment', 'archived':'nt_why_archived',
    'not-in-force':'nt_why_not_in_force', 'no-counterparty':'nt_why_no_cp',
    'no-notice-period':'nt_why_no_notice', 'no-expiry':'nt_why_no_expiry',
    'not-yet':'nt_why_not_yet' };
  return i18t(KEY[k] || 'nt_why_not_in_force');
};

Object.assign(window, { NOTICE_KINDS, NOTICE_LATE_SAYS, noticeBlockers, noticeMayDraft,
  noticeDraft, noticeText, noticeDialogHtml, openNoticeDialog, noticeWhyLine });
