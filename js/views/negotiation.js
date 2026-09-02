// HaTi — the Negotiation tab: the dual-pane fingerprinted redline.
// Globals are window-attached like every module (see components.js).
//
// ONE COMPONENT, BOTH SIDES
//
// This file renders the negotiation for WHOEVER is looking at it. The owner
// opens it as a tab in the contract workspace; the counterparty opens it from
// their link and gets the same three panes, the same fingerprints and the same
// controls. `opts.side` decides authorship and permissions, and nothing else.
//
// That is not a nicety. Until now the two sides read different screens built
// from different code — the owner reviewed a redline in a modal, the
// counterparty edited clauses in a textarea — so "we are both looking at the
// same thing" was a claim nobody could check. js/discuss.js already proved the
// pattern in this codebase for the conversation; this does it for the document.
//
// WHAT IS BORROWED, NOT REBUILT
//
//   js/negotiation.js  the change model, the clause keys, accept/reject/comment
//   js/versioning.js   wordDiff — the same segmentation the compare modal uses,
//                      so a redline here and a redline there cannot drift
//   js/richdoc.js      richToText for the clause projection
//   js/discuss.js      the thread bubbles, so a conversation reads identically
//                      wherever it appears
//   js/core.js         emailOff / counterpartySeenState for the status strip
//
// A ROOM, NOT A PANEL
//
// The negotiation owns the whole viewport. It was first built as a tab inside
// the contract workspace, below the workspace header, the action bar and a tab
// row — which left the two documents sharing about half the width and too
// short to read, defeating the point of putting them side by side at all.
// Entering is a mode change: the app shell is hidden, the room takes the
// window, and the "Doc ›" breadcrumb is the way back out (so is Esc).
//
// DESIGN
//
// The room keeps prototype.html's own COLOUR: the slate #33475c bar, the cool
// #f2f4f7 canvas, its redline ramp. That reverses an earlier reading of the
// brief, which took "match HaTi's real tokens where they genuinely conflict" as
// licence to restyle the whole screen — see BUGLOG D3.
//
// Its TYPE is the platform's, which is the later correction: the room used to
// set a serif document face of its own, so the same clause read as a different
// document depending on which screen you opened it from. The --n-font-* tokens
// now alias the platform faces; everything else in the ramp stays local.
//
// The tokens are declared on `.nego-room` and `#nego-root`, never on `:root`,
// and that scoping is the entire safety argument: inside the negotiation
// everything reads as the prototype draws it, and not one rule reaches the rest
// of the product.

/* Which change is in focus, and which threads are open. Module-level rather
   than on the contract: this is where the reader is looking, not something
   about the agreement, and it must never reach storage or the share payload. */
let _negoActive = null;
let _negoThreads = {};
/* Reading the contract instead of reading the redline. A view, never a
   decision: nothing is accepted, nothing is written, and switching back leaves
   the round exactly where it was. Module-level for the same reason as the two
   above — it is where the reader is looking. */
let _negoClean = false;
/* WHICH SENT DECISIONS THIS READER HAS RE-OPENED. Where the reader is looking,
   not anything about the agreement — so it lives here beside _negoThreads and
   never reaches storage, the record or the share payload. Cleared with the rest
   of the view state when a different contract opens. */
let _negoRedeciding = {};
/* WHICH CLOSED ROUNDS THIS READER HAS OPENED. Same class of state again: a
   round's history is folded away by default so the round in flight is what the
   index shows first, and unfolding one is a look, not a decision. */
let _negoOpenRounds = {};
const negoCleanView = () => _negoClean;
const negoSetCleanView = on => { _negoClean = !!on; return _negoClean; };

/* ---------- WHAT THIS READER HAS ALREADY READ ----------
   A local fact about a person, never a fact about the agreement: when did I
   last open the thread on this change. It decides one thing — whether the
   Discuss button nags — and it must not travel with the contract, must not
   reach the share payload, and must not be something the other side can see or
   change. So it is kept per browser, keyed by the thing that identifies the
   conversation on each side: the contract id for the owner, the share token for
   the counterparty, whose page has no contract id to key on.

   Every read and write is wrapped: a no-login origin can throw outright on
   localStorage, and a decoration that cannot remember what you read is not a
   reason to take a screen down. */
const negoSeenKey = (scope, id) => `hati.threadSeen.${scope || 'anon'}.${id}`;
function negoThreadSeenAt(scope, id){
  try { return localStorage.getItem(negoSeenKey(scope, id)) || null; }
  catch (e){ return null; }
}
function negoMarkThreadSeen(scope, id){
  const at = window.nowISO ? nowISO() : new Date().toISOString();
  try { localStorage.setItem(negoSeenKey(scope, id), at); } catch (e){}
  return at;
}
/* Which store this reader's "seen" marks belong in. The owner is identified by
   the contract; the counterparty by the link they were sent. */
const negoSeenScope = (c, opts) => String((opts && opts.seenScope)
  || (opts && opts.side === 'counterparty' ? (opts.token || '') : '')
  || (c && c.id) || 'anon');

const _ne = s => (window.esc ? esc(s) : String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
/* OUR SIDE AS THE PAPER NAMES IT. Three places in this file print "between A
   and B" — the printed history, the document pane's meta line and the ruled
   signature foot — and all three are the DOCUMENT speaking, so all three take
   the contract's own party rather than the workspace. Everything else here
   that names us (who has not seen an answer, whose colleagues a note stays
   inside, who will send a signing link) is the ORGANISATION and keeps
   FIRST_PARTY. See contractParty in js/core.js for the line between them. */
const _ngOurParty = c => (typeof window !== 'undefined' && window.contractParty)
  ? contractParty(c) : ((typeof window !== 'undefined' && window.FIRST_PARTY) || '');
/* ESCAPED FOR AN ATTRIBUTE, which _ne is not. The app's `esc` handles & < >
   and leaves quotes alone, which is right for text between tags and wrong the
   moment the value is a person's name inside title="…" — one apostrophe or
   double quote and the attribute closes early, with everything after it parsed
   as markup. Every attribute this view writes from a NAME goes through here. */
const _nea = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* A clause id is a NEGOTIATION key, not a DOM id. "clause:2." carries a colon
   and a full stop, both of which are CSS combinators — `#nw-clause:2.` is not a
   selector, it is a parse error, so any querySelector against it throws rather
   than returning null. getElementById does not care, but relying on that would
   leave a trap for the next person to reach for a selector here.

   So the DOM gets a slug and the model keeps the real key: element ids are
   slugged, and the true clause id travels in `data-clause` where it can be
   matched with an attribute selector safely. */
const negoDomId = id => String(id == null ? '' : id).replace(/[^A-Za-z0-9_-]+/g, '_');

/* ---------- the stylesheet ----------
   A <style> block is the established way to do this here (portalRevisedBanner
   does it for its keyframes): the tri-pane needs real CSS — margin-anchored
   absolute positioning, media queries and a keyframe — and inline styles cannot
   express any of the three. Every colour is a HaTi token, so the tab cannot
   drift from the rest of the product.

   It goes in <head>, and that is the whole point rather than a detail. This
   markup used to carry its own <style> inside the host element, guarded by a
   "already emitted?" flag so it appeared once. Both halves of that were wrong
   together: every re-render replaces the host's innerHTML and takes the
   stylesheet with it, and the flag then refused to put it back. So the tab was
   styled the first time it was opened and unstyled after any repaint —
   switching to Docs and back, deciding a change, or any renderWorkspace() call.

   In <head> it survives every innerHTML replacement in the document, and
   re-adding is a no-op because the id is checked first. Nothing has to remember
   anything. */
function negoEnsureStyle(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('nego-style')) return;
  const head = document.head || document.getElementsByTagName('head')[0] || document.body;
  if (!head) return;
  const holder = document.createElement('div');
  holder.innerHTML = negoStyleHtml();
  const style = holder.querySelector('style');
  if (style) head.appendChild(style);
}
/* ---------- the stylesheet ----------
   negoStyleHtml and redlineLayoutCss LIVE IN js/views/negotiation-css.js since
   21 Aug 2026 — 3,096 lines of CSS string that referenced nothing else in this
   file and were called from three places. Both are still published to window by
   that file, so every call here reaches them unchanged. See the header there
   for why this seam and no other. */

/* ---------- a clause body, as the document holds it ----------
   Used wherever a clause is shown with nothing proposed against it. Falls back
   to the text projection when there is no body to show, or when this page has
   no sanitiser — never to the raw html, because an unsanitised clause body is
   the one thing that must not reach the page and a flattened clause is a far
   smaller loss. */
const negoFlatBody = cl => `<p>${_ne((cl && cl.text) || '')}</p>`;
/* A clause proposed for DELETION is struck through whole and every word of it
   stays on the page — the text is not removed until the deletion is accepted.
   It keeps its line structure while it is struck: a schedule being deleted is
   still a schedule, and a reader deciding whether to lose it needs to see what
   is in it. Rendered through the ops path so the blocks, the hanging indents
   and the heading levels come out identically to every other redline. */
function _negoStruckBlocks(text){
  const t = String(text == null ? '' : text);
  if (window.redlineOpsBlocksHtml)
    return redlineOpsBlocksHtml([{ op: 'del', text: t }]);
  return `<p><span class="nego-del">${_ne(t)}</span></p>`;
}

function negoRichBody(cl){
  const html = String((cl && cl.bodyHtml) || '').trim();
  if (!html || !window.sanitizeRich) return negoFlatBody(cl);
  return `<div class="nego-body">${sanitizeRich(html)}</div>`;
}

/* ---------- the document panes ----------
   Both panes are built from the SAME baseline clause list, so a clause sits at
   the same place in both and the eye can cross between them. The working pane
   differs only in what it draws over each clause:

     pending  → the redline (what would go, what would arrive) + a live badge
     accepted → the new wording, washed green for a moment, + a ✓ badge
     rejected → the baseline wording untouched + a ✕ badge and a note

   A rejected clause reading exactly as the baseline reads is the point: it is
   the visible half of "silence rejects". */
/* ---------- SAYING THAT THE NUMBERING HAS A HOLE IN IT ----------
   A reader who meets clause 8 followed by clause 10 has two readings available
   and no way to choose between them: somebody deleted 9, or the document is
   broken. They are not equally cheap. The second one costs the platform its
   credibility with the only audience that matters here, and it is the reading a
   lawyer reaches for first, because a contract that skips a number is normally
   a contract somebody mangled.

   So the gap is named, and the act that made it is named with it — and on a
   DRAFT, on the owner's own surface, the notice now carries the one door out
   of it: `Renumber clauses…`, which opens a full preview and writes nothing
   until it is confirmed (N2-T5). The button appears only where the caller
   states the owner seat (opts.offer) — opt-IN, so a surface that forgets the
   flag shows no button rather than showing one to the wrong seat — and never
   when the numbering is locked. The old rule here was "no button at all",
   argued on the ground that a notice offering the undo is how a signed
   contract gets renumbered by accident; what actually holds that line is the
   lock plus the preview, not the absence of the door on drafts, and N2 built
   both before this button existed.

   TWO VOICES, and the difference is the lock. On a draft the gap is a loose end
   the owner may want to deal with before signing. On an executed contract it is
   part of the record: the numbers have been cited by the act of signing and
   every amendment that follows will cite them again, so the gap is not a defect
   to be fixed but a fact to be read correctly. The executed notice is therefore
   buttonless — the action is ABSENT, not disabled, because a disabled button
   says "this exists and you may not", and no such act exists against a signed
   agreement. */
function negoNumberingNoticeHtml(c, opts = {}){
  const gaps = window.negoNumberingGaps ? negoNumberingGaps(c) : [];
  const broken = window.negoBrokenRefs ? negoBrokenRefs(c) : [];
  /* A BROKEN REFERENCE CAN OUTLIVE ITS GAP. Renumbering closes the gap and
     leaves "subject to Clause 9" pointing at a number nothing carries, so this
     notice has to be able to appear for the references alone. Two conditions,
     not one. */
  if (!gaps.length && !broken.length) return '';
  if (!gaps.length) return negoBrokenRefsOnlyHtml(c, broken, opts);
  const locked = window.negoNumberingLocked ? !!negoNumberingLocked(c) : false;
  const list = ns => ns.length === 1 ? ns[0]
    : ns.slice(0, -1).join(', ') + ' and ' + ns[ns.length - 1];
  const nums = gaps.map(g => g.num);
  const what = `<b>Clause${gaps.length === 1 ? '' : 's'} ${_ne(list(nums))} `
    + `${gaps.length === 1 ? 'was' : 'were'} deleted, and the numbering was not closed up.</b>`;
  /* The run is spelled out only where there is one gap to spell out. Four gaps
     produce four "x is followed by y" clauses that nobody reads, and the
     numbers above already say which clauses are missing. */
  const run = (gaps.length === 1 && gaps[0].before && gaps[0].after)
    ? ` ${_ne(gaps[0].before)} is followed by ${_ne(gaps[0].after)}.` : '';
  const why = locked
    ? 'This contract is executed, so its numbering is final. Any amendment to it — '
      + 'and anyone reading the two documents together — cites these clauses by the '
      + 'numbers they carry here, so the gap stays exactly where it is.'
    : 'Numbers are printed exactly as the document carries them, so nothing else moved '
      + 'and no reference to another clause was repointed. Renumbering is a separate, '
      + 'deliberate act — and once this contract is signed its numbering is final.';
  /* Two clicks to close the gap: this one, then the preview's confirm.
     GREY WHEN THE PLAN WOULD MOVE NOTHING, with the reason on hover — the door
     asked only "are there gaps", while negoRenumberOpen behind it asks the
     narrower question "would renumbering actually change a number", and the
     two can disagree (a gap at the very end moves nothing above it). One
     reading now decides whether the door draws live and what pressing it does. */
  let renumWhy = '';
  if (!locked && opts.offer){
    try {
      const plan = window.negoRenumberPlan ? negoRenumberPlan(c) : null;
      if (plan && !plan.changed) renumWhy = i18t('ng_renumber_no_gaps');
    } catch (e) { /* unreadable is not "nothing to do" — leave the door live */ }
  }
  const door = (!locked && opts.offer)
    ? `<button type="button" class="renum" data-renumber-open="${_ne(c.id)}"${renumWhy ? ' disabled aria-disabled="true"' : ''}
        title="${_ne(renumWhy)}"
        onclick="window.negoRenumberOpen&&negoRenumberOpen(this.getAttribute('data-renumber-open'))">${i18t('ng_renumber_ellipsis')}</button>`
    : '';
  return `<div class="nego-gaps" id="${_ne(opts.noticeId || 'nego-gaps')}" data-locked="${locked ? '1' : '0'}"
      data-gaps="${gaps.length}" data-brokenrefs="${broken.length}" role="status">
    <span class="mark" aria-hidden="true">${locked ? '§' : '!'}</span>
    <span class="body">${what}${run}${negoBrokenRefsLine(broken)}<span class="why">${_ne(why)}</span>${door}</span>
  </div>`;
}

/* ---------- …AND SOMETHING STILL REFERS TO IT ----------
   Appended to the gap notice rather than raised as a second banner beside it.
   Both sentences are about the same act — a clause was deleted — and two
   notices stacked on one screen saying two halves of one fact is how a reader
   learns to close notices without reading them.

   NAMES BOTH ENDS. "Clause 15 refers to Clause 9, which was deleted" tells a
   reader where to go. "A reference is broken" tells them to go looking. */
function negoBrokenRefsLine(broken){
  if (!broken || !broken.length) return '';
  const one = broken.length === 1;
  const where = broken.slice(0, 3)
    .map(b => b.fromNum ? `Clause ${_ne(b.fromNum)}` : 'another clause');
  const more = broken.length > 3 ? ` and ${broken.length - 3} more` : '';
  return ` <b>${where.join(', ')}${more} still refer${one ? 's' : ''} to `
    + `${one ? 'it' : 'clauses that were deleted'}.</b>`;
}

/* The same fact when there is no gap left to report it against — after a
   renumbering has closed the gap and left the reference behind. */
function negoBrokenRefsOnlyHtml(c, broken, opts = {}){
  const locked = window.negoNumberingLocked ? !!negoNumberingLocked(c) : false;
  const one = broken.length === 1;
  const what = broken.slice(0, 3).map(b =>
    `<b>${_ne(b.fromLabel || ('Clause ' + b.fromNum))} refers to Clause ${_ne(b.num)}, `
    + `which was deleted.</b>`).join(' ');
  const more = broken.length > 3 ? ` And ${broken.length - 3} more.` : '';
  /* ADVISORY, AND SAYS SO. The reader either revises the referring clause — an
     ordinary tracked change the other side sees and rules on — or leaves it,
     because a reference to a deleted clause is sometimes exactly what the
     parties meant to leave. Nothing here rewrites legal wording to tidy up a
     warning. */
  const why = locked
    ? 'This contract is executed, so nothing here can be changed. Noted so that anyone '
      + 'reading it knows the reference is to a clause the signed document does not carry.'
    : 'Nothing has been changed for you. Revising the sentence is a drafting decision — '
      + 'file it as a change like any other, so the other side sees it and rules on it.';
  return `<div class="nego-gaps" id="${_ne(opts.noticeId || 'nego-gaps')}" data-locked="${locked ? '1' : '0'}"
      data-gaps="0" data-brokenrefs="${broken.length}" role="status">
    <span class="mark" aria-hidden="true">${locked ? '§' : '!'}</span>
    <span class="body">${what}${more}<span class="why">${_ne(why)}</span></span>
  </div>`;
}
/* ---------- THE HISTORY TIMELINE SCREEN (WP-2.1) ----------
   The centrepiece of the history work: one chronological story of the whole
   negotiation — proposals, decisions with their reasons, withdrawals, round
   closures, the renumbering acts (X3) and the signing beats (X6) — with
   filters that combine. Read-only by nature, so every signed-in role gets it,
   viewers included.

   THE SENTENCES COME FROM THE MODEL (negoTimeline), which reads stored labels
   (X1) and stored prose; this renderer only lays the story out. Filtering
   re-asks the model rather than hiding DOM — what is on the page is what the
   filter produced, and a test can hold the model without a browser. */
const _HT_KIND_META = {
  proposed:   { mark: '✎', get word(){ return i18t('ng_proposed'); } },
  decided:    { mark: '⚖', get word(){ return i18t('ng_decided'); } },
  withdrawn:  { mark: '↩', get word(){ return i18t('ng_withdrawn'); } },
  'round-closed': { mark: '▣', get word(){ return i18t('ng_round'); } },
  renumbered: { mark: '§', get word(){ return i18t('ng_renumbered'); } },
  link:       { mark: '✉', get word(){ return i18t('ng_link'); } },
  signature:  { mark: '✍', get word(){ return i18t('ng_signature'); } },
  sealed:     { mark: '🔏', get word(){ return i18t('ng_sealed'); } },
  copies:     { mark: '📤', get word(){ return i18t('ng_copies'); } },
};
function negoTimelineEventHtml(c, e){
  const m = _HT_KIND_META[e.kind] || { mark: '·', word: e.kind };
  const when = e.at ? String(e.at).slice(0, 10) : '';
  const meta = [when, e.round != null && e.round !== '' && e.kind !== 'round-closed' ? `round ${e.round}` : '',
    e.outcome && e.kind === 'proposed' ? 'still pending' : '']
    .filter(Boolean).join(' · ');
  /* X1 on the face of it: the stored label, with the durable id beneath in
     the DOM for filtering — never a lookup of today's number. */
  const clause = e.clauseLabel
    ? `<span class="ht-clause" data-ht-clause="${_nea(e.clauseId || '')}">${_ne(e.clauseLabel)}</span>` : '';
  const body = e.kind === 'proposed' && e.ch
    ? `<div class="ht-redline">${negoChangeHtml(e.ch)}</div>`
      + (e.note ? `<div class="ht-note">Why they asked: ${_ne(e.note)}</div>` : '')
    : e.kind === 'decided' && e.reply
    ? `<div class="ht-note">${i18t('ng_reply_prefix',{text:_ne(e.reply)})}</div>`
    : '';
  return `<div class="ht-ev" data-ht-kind="${_nea(e.kind)}" data-ht-outcome="${_nea(e.outcome || '')}">
    <span class="ht-mark" aria-hidden="true">${m.mark}</span>
    <div class="ht-body">
      <div class="ht-text">${_ne(e.text)}</div>
      <div class="ht-meta">${_ne(meta)}${clause ? ' · ' : ''}${clause}</div>
      ${body}
    </div>
  </div>`;
}
/* ONE COMPONENT, TWO CHAIRS. This screen is rendered for the owner (the pop-out
   record, and the share dialog's preview) and for the COUNTERPARTY (their
   read-only history link) — the same events, the same filters, deliberately the
   same code. Only one line in it can be said from a chair: the Side filter.
   "Ours" and "Theirs" are the plain words the room's History tab now uses, and
   which one goes on which row depends on who is reading. It used to say "Owner
   side" and "Counterparty" to everybody, which is written from OUR chair and
   was being handed to theirs.
   The VALUES never move — 'owner' and 'counterparty' are what the events carry
   and what every filter reads. Only the label turns over.

   ONE PREDICATE ANSWERS IT, and PORTAL_MODE is the net rather than the explicit
   seat: this screen reaches the counterparty by TWO roads — their read-only
   history page mounts it directly, and openPortalHistory opens it through
   openHistoryTimeline — and a seat threaded by hand through two functions is a
   seat that gets dropped down one of them. An explicit seat still wins, so the
   owner's surfaces can never be caught out by a stale flag. */
function negoTimelineSeatIsTheirs(opts){
  return (opts && opts.seat) ? opts.seat === 'counterparty' : !!window.PORTAL_MODE;
}
function negoTimelineScreenHtml(c, f = {}, opts = {}){
  const theirChair = negoTimelineSeatIsTheirs(opts);
  const all = negoTimeline(c);
  const list = negoTimeline(c, f);
  const uniq = pairs => Array.from(new Map(pairs.filter(x => x && String(x[0])).map(x => [String(x[0]), x])).values());
  const sel = (id, label, pairs, cur) => `<label class="ht-f"><span>${_ne(label)}</span>
    <select id="${id}" data-ht-filter="${id.replace('ht-f-', '')}">
      <option value="">${i18t('ng_all')}</option>
      ${pairs.map(p => `<option value="${_nea(p[0])}"${String(cur || '') === String(p[0]) ? ' selected' : ''}>${_ne(String(p[1]).slice(0, 48))}</option>`).join('')}
    </select></label>`;
  return `<div id="history-timeline" class="ht" data-count="${list.length}">
    <style>
      .ht{padding:20px 22px;max-width:820px;max-height:82vh;overflow-y:auto}
      .ht h3{font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;color:var(--color-text);margin:0 0 2px}
      .ht .ht-sub{font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3)}
      .ht .ht-filters{display:flex;gap:var(--s-2);flex-wrap:wrap;margin-bottom:14px;padding-bottom:var(--s-3);border-bottom:1px solid var(--color-divider)}
      .ht .ht-f{display:flex;flex-direction:column;gap:2px;font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)}
      .ht .ht-f select{font:inherit;font-size:var(--t-meta);font-weight:var(--w-body);text-transform:none;letter-spacing:0;border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-1) 6px;background:var(--color-surface);color:var(--color-text);max-width:180px}
      .ht .ht-ev{display:flex;gap:10px;padding:var(--s-2) 0;border-bottom:1px solid color-mix(in srgb,var(--color-divider) 55%,transparent)}
      .ht .ht-mark{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--color-bg);border:1px solid var(--color-divider);font-size:var(--t-label)}
      .ht .ht-body{flex:1;min-width:0}
      .ht .ht-text{font-size:var(--t-body);line-height:1.5;color:var(--color-text)}
      .ht .ht-meta{font-size:var(--t-label);color:var(--color-neutral-600);margin-top:1px}
      .ht .ht-clause{font-weight:var(--w-strong)}
      .ht .ht-redline{border:1px solid var(--color-divider);border-radius:var(--radius);padding:7px 9px;margin-top:6px;font-size:var(--t-meta);line-height:1.55;background:var(--color-surface)}
      .ht .ht-redline ins{background:var(--st-green-bg);text-decoration:none}
      .ht .ht-redline del{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
      .ht .ht-note{font-size:var(--t-label);color:var(--color-neutral-700);margin-top:var(--s-1);border-left:2px solid var(--color-divider);padding-left:var(--s-2)}
    </style>
    <h3>Negotiation history — ${_ne(c.name || c.id)}</h3>
    <p class="ht-sub">${all.length} event${all.length === 1 ? '' : 's'}, oldest first. Labels read as they were when each event happened.</p>
    <div class="ht-filters">
      ${sel('ht-f-clauseId', 'Clause', uniq(all.map(e => [e.clauseId || '', e.clauseLabel || ''])), f.clauseId)}
      ${sel('ht-f-actor', 'Person', uniq(all.map(e => [e.actor || '', e.actor || ''])), f.actor)}
      ${sel('ht-f-side', 'Side', [['owner', theirChair ? 'Theirs' : 'Ours'],
                                  ['counterparty', theirChair ? 'Ours' : 'Theirs']], f.side)}
      ${sel('ht-f-round', 'Round', uniq(all.filter(e => e.round != null && e.round !== '').map(e => [e.round, 'Round ' + e.round])), f.round)}
      ${sel('ht-f-outcome', 'Outcome', [['accepted', 'Accepted'], ['rejected', 'Rejected'], ['pending', 'Pending'], ['withdrawn', 'Withdrawn']], f.outcome)}
      <button id="ht-clear" class="ui-btn" style="align-self:flex-end;font-size:var(--t-label);padding:5px 10px">${i18t('ng_clear')}</button>
      <span style="flex:1"></span>
      <button id="ht-verify" class="ui-btn" style="align-self:flex-end;font-size:var(--t-label);padding:5px 10px" title="${i18t('ng_recompute_title')}">${i18t('ng_verify_integrity')}</button>
      <button id="ht-export" class="ui-btn" style="align-self:flex-end;font-size:var(--t-label);padding:5px 10px" title="${i18t('ng_report_title')}">${i18t('ng_export_history')}</button>
    </div>
    <div id="ht-verify-result"></div>
    <div id="ht-list">${list.length
      ? list.map(e => negoTimelineEventHtml(c, e)).join('')
      : `<div style="font-size:var(--t-meta);color:var(--color-neutral-600);padding:14px 0">${i18t('ng_nothing_matches')}</div>`}</div>
  </div>`;
}
function openHistoryTimeline(c, f = {}, opts = {}){
  if (!c || typeof window.openModal !== 'function') return;
  /* ---- THE PANEL HAS TO BE AS WIDE AS THE SCREEN INSIDE IT ----
     `.ht` asks for 820px and this call did not say so, so the modal applied
     its 32rem default and the whole history rendered at 510px — 62% of the
     width it was drawn for, with the filter bar wrapped into four rows and
     every event squeezed into a column half the intended measure. An inner
     max-width cannot argue with an outer one; it can only lose.

     Invisible to jsdom, which has no layout engine: f120 and f121 were green
     throughout, because every event WAS present. Found by
     test/chromium/timeline-verify.js on its first run — the check this screen
     had been waiting on since Session 14. 820px is the house width for a modal
     of this kind (see js/views/library.js), and the two numbers must stay in
     step: the browser check reads `.ht`'s own max-width and fails if the panel
     cannot deliver it. */
  openModal(negoTimelineScreenHtml(c, f, opts), { maxWidth: '820px' });
  /* Filters combine: every change re-renders the same screen with the whole
     filter state, so the two sources of truth cannot drift. The SEAT rides
     along with them — a re-render that forgot it would relabel the Side filter
     under the reader the moment they touched a different one. */
  const read = () => {
    const g = k => { const el = document.getElementById('ht-f-' + k); return el && el.value ? el.value : ''; };
    return { clauseId: g('clauseId'), actor: g('actor'), side: g('side'), round: g('round'), outcome: g('outcome') };
  };
  document.querySelectorAll('#history-timeline [data-ht-filter]').forEach(s =>
    s.addEventListener('change', () => openHistoryTimeline(c, read(), opts)));
  document.getElementById('ht-clear')?.addEventListener('click', () => openHistoryTimeline(c, {}, opts));
  /* WP-2.5 — the one answer, with the first broken link named. The result
     panel is written, never toasted: a verdict about the integrity of a legal
     record does not scroll away. */
  document.getElementById('ht-verify')?.addEventListener('click', async () => {
    const box = document.getElementById('ht-verify-result');
    if (!box || !window.negoIntegrityReport) return;
    box.innerHTML = `<div style="font-size:var(--t-meta);color:var(--color-neutral-600);padding:var(--s-2) 0">${i18t('ng_recomputing')}</div>`;
    const r = await negoIntegrityReport(c);
    box.innerHTML = negoVerifyResultHtml(r);
  });
  /* WP-2.4 — the standalone report. Verification runs FIRST and rides inside
     it: an export that merely claims the record is intact, without saying when
     that was checked, is the "Verified" pill fakery in file form. */
  document.getElementById('ht-export')?.addEventListener('click', async () => {
    negoHistoryExportRun(c);
  });
}
/* Lifted out of the dialog's own handler so the History TAB presses the same
   act rather than a second copy of it. Verification runs first and rides
   inside the file either way. */
async function negoHistoryExportRun(c){
  if (!window.negoIntegrityReport) return;
  const r = await negoIntegrityReport(c);
  const html = negoHistoryExportHtml(c, r);
  if (window.downloadFile) downloadFile(`${c.id}-negotiation-history.html`, html, 'text/html');
  if (window.toast) toast(`History exported — the report carries its own verification result (${r.ok ? 'verified' : 'FAILED'})`);
}
/* THE SAME REPORT, HANDED TO THE PRINTER INSTEAD OF TO THE DISK.

   Deliberately not a print stylesheet over the History tab: that would print
   the app's chrome and the filter controls, and it would print whichever
   reading was on screen — the short list is a glance, not a record. The export
   is already the full account, already carries its own colours and legend, and
   already states when its integrity was last verified.

   The window is opened BEFORE the await. A popup blocker judges a window by
   whether the click that asked for it is still on the stack, and the
   verification is asynchronous — opening after it returns is how this becomes a
   button that silently does nothing. The blank window is closed if the report
   cannot be built, so a blocked or failed run leaves nothing behind. */
async function negoHistoryPrintRun(c){
  if (!window.negoIntegrityReport) return;
  const w = window.open('', '_blank');
  if (!w){ if (window.toast) toast(i18t('ng_allow_popups'), 'err'); return; }
  try {
    const r = await negoIntegrityReport(c);
    w.document.open();
    w.document.write(negoHistoryExportHtml(c, r));
    w.document.close();
    /* ---- ONE DIALOG, AND IT GOES AWAY WHEN YOU DISMISS IT ----
       (owner-reported 23 Aug 2026: "you click on print history then decide to
       click cancel, there is a bug because it flashes then the whole page
       reappears again without cancelling")

       TWO FAULTS, AND TOGETHER THEY ARE THE REPORT. MEASURED before the fix by
       counting the calls on the popup: print() ran TWICE. Both triggers below
       fired — the load handler AND the 350ms timer — so pressing Cancel closed
       the first dialog and the second re-opened it a moment later. That is the
       flash. And nothing ever closed the window, so the report itself was still
       standing behind it, which is the other half of what was reported.

       BOTH TRIGGERS STAY, BEHIND A ONE-SHOT LATCH. The timer is not redundant
       and must not simply be deleted: `load` can fire between document.close()
       and the line that assigns the handler, and then the timer is the only
       thing that prints — delete it and the button silently does nothing on
       exactly the runs that are hardest to reproduce. So whichever arrives
       first prints, and the other finds the latch closed.

       THE WINDOW CLOSES WHEN THE DIALOG IS DISMISSED, and the listener is
       registered BEFORE print() because print() blocks until the dialog goes.
       Chrome fires afterprint for Save and for Cancel alike, so we cannot tell
       them apart and do not try: either way the reader is finished with it, and
       the report is one press away from being rebuilt. Where afterprint never
       arrives the window simply stays open — which is exactly today's
       behaviour, so the fallback is the status quo rather than a new failure. */
    let asked = false;
    const ask = () => {
      if (asked) return;
      asked = true;
      try {
        try { w.addEventListener('afterprint',
          () => { try { w.close(); } catch (e2) {} }, { once: true }); } catch (e3) {}
        w.focus();
        w.print();
      } catch (e) {}
    };
    w.onload = ask;
    setTimeout(ask, 350);
  } catch (e){
    try { w.close(); } catch (e2) {}
    if (window.toast) toast(i18t('ng_could_not_build_history'), 'err');
  }
}
function negoVerifyResultHtml(r){
  return r.ok
    ? `<div data-verify-ok="1" style="border:1px solid color-mix(in srgb,var(--st-green-dot) 30%,transparent);background:var(--st-green-bg);border-radius:var(--radius);padding:10px var(--s-3);margin-bottom:var(--s-3);font-size:var(--t-meta);color:var(--st-green-fg)">✓ ${_ne(r.detail)}. Verified ${_ne(String(r.at).slice(0, 19).replace('T', ' '))} UTC.</div>`
    : `<div data-verify-ok="0" style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:var(--radius);padding:10px var(--s-3);margin-bottom:var(--s-3);font-size:var(--t-meta);color:var(--st-ruby-fg)"><b>${i18t('ng_integrity_failed')}</b> ${_ne(r.firstBroken || r.detail)}<br><span style="font-size:var(--t-label)">Nothing has been changed by this check. The first broken link is named above; everything before it verified. Checked ${_ne(String(r.at).slice(0, 19).replace('T', ' '))} UTC.</span></div>`;
}
/* The report a reader with no login can hold: the whole story, every filter
   off, each change as its rendered redline, and the integrity statement —
   result, when it was run, and the seal it was run against. Self-contained by
   construction: the styles ride inline and nothing references the app. */
/* ---- THE ADDED AND THE REMOVED, IN A FILE THAT CARRIES ITS OWN COLOURS ----
   The ins/del rules below once named var(--st-green-bg) and var(--st-ruby-bg).
   Those custom properties are declared in the APP's stylesheet, and this export
   is a standalone document that carries none of it — so both resolved to
   nothing and every redline printed as flat text with no added/removed
   distinction at all. Literal values, because self-contained has to mean
   self-contained.

   THE SAME TRAP CAUGHT THE CORNERS ON 26 Aug 2026, and it is why this note is
   worth re-reading before editing anything below: the platform-wide 2px sweep
   turned three border-radius:0 declarations here into var(--radius), which
   resolves to nothing in a file that carries no :root. Every rounded box in
   this report squared off, silently. This block takes LITERAL values — every
   one of them — and a var() of any kind does not belong in it.

   And not colour ALONE. This is a report people print and file: browsers drop
   backgrounds when printing unless told otherwise, and a reader with a colour
   vision deficiency gets nothing from a green wash either. So the strike and
   the underline carry the meaning too, print-color-adjust asks for the wash on
   top rather than instead of them, and a legend states the convention in words.

   Everything explanatory stays HERE rather than in the emitted <style>: the
   file goes to a counterparty, and our commentary is not theirs to read. */
/* ---- A STANDALONE FILE CARRIES NO :root, SO IT CARRIES NO TOKENS ----
   Everything this function emits leaves the building as its own .html and is
   opened without HaTi's stylesheet, so `var(--t-meta)` there resolves to
   NOTHING — the declaration is simply dropped and the browser falls back to
   whatever it inherits. The 25 Aug ladder sweep reached in here and f143
   caught it in one run, which is exactly what that test exists for. Every
   size, weight and space below is a LITERAL on purpose.
   THE SAME RULE, AND THE SAME REASON, as js/views/healthreport.js and
   js/views/weekly.js — both excluded from that sweep by name. This one is a
   builder inside an ordinary view file, which is why a file-level exclusion
   did not cover it. Any new builder that emits a whole document belongs on
   that list. */
function negoHistoryExportHtml(c, report){
  const ev = negoTimeline(c, {});
  const sigs = (c.signatures || []).map(s =>
    `<li>${_ne(s.name || '')}${s.title ? `, ${_ne(s.title)}` : ''} — ${_ne(s.party || '')}${s.verified === false ? ' (NOT independently verified)' : s.method ? ` (${_ne(s.method)})` : ''}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Negotiation history — ${_ne(c.name || c.id)}</title>
<style>
  body{font:13px/1.55 Georgia,serif;color:#1c2126;max-width:760px;margin:32px auto;padding:0 18px}
  h1{font-size:21px;margin:0 0 2px} .sub{color:#5a6470;font-size:13px;margin:0 0 18px}
  .integrity{border:1.5px solid ${report.ok ? '#10b981' : '#f43f5e'};border-radius:2px;padding:12px 14px;margin:0 0 20px;font-size:14px}
  .ht-ev{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #e3e7ea;page-break-inside:avoid}
  .ht-mark{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1px solid #cdd4da;font-size:12px}
  .ht-body{flex:1;min-width:0} .ht-text{font-size:14px} .ht-meta{font-size:12px;color:#5a6470}
  .ht-clause{font-weight:600}
  .ht-redline{border:1px solid #e3e7ea;border-radius:2px;padding:7px 9px;margin-top:6px;font-size:13px}
  /* added wording — LITERAL ON PURPOSE, and f143 is the test that says so. This
     stylesheet is written into a STANDALONE .html file the counterparty saves
     and opens on their own machine; it carries none of the app's :root, so a
     var() here resolves to nothing and the marks lose their colour. That was a
     real fault once and this file is named for it. Never tokenise in an
     exporter — the census of the app's own screens cannot see this one. */
  .ht-redline ins{background:#d1fae5;color:#047857;text-decoration:underline;
    text-decoration-thickness:1px;text-underline-offset:2px}
  .ht-redline del{background:#ffe4e6;color:#be123c;text-decoration:line-through}
  .ht-redline ins,.ht-redline del{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ht-key{margin:0 0 14px;font-size:12px;color:#5a6470}
  .ht-key ins,.ht-key del{padding:0 3px;border-radius:2px}
  /* OI-5: open the seam between a deletion and its replacement — display only */
  .ht-redline del+ins{margin-left:.3em}
  .ht-note{font-size:12px;color:#3c454e;margin-top:4px;border-left:2px solid #cdd4da;padding-left:8px}
  @media print{ body{margin:10mm auto} }
</style></head><body>
<h1>Negotiation history — ${_ne(c.name || c.id)}</h1>
<p class="sub">${_ne(c.id)} · between ${_ne(_ngOurParty(c) || 'the owner')} and ${_ne(c.counterparty || 'the counterparty')}
 · ${ev.length} events, oldest first · generated ${_ne(String(report.at).slice(0, 19).replace('T', ' '))} UTC by HaTi CLM</p>
<div class="integrity">
  <b>${report.ok ? '✓ Record verified' : '✗ Integrity check FAILED'}</b> — ${_ne(report.detail)}<br>
  Run ${_ne(String(report.at).slice(0, 19).replace('T', ' '))} UTC · ${report.chain.checked} chained record${report.chain.checked === 1 ? '' : 's'} recomputed${c.hash ? ` · document seal (SHA-256): <span style="font-family:monospace;font-size:12px;word-break:break-all">${_ne(c.hash)}</span>` : ' · not yet executed, so no seal to check'}
</div>
<p class="ht-key">${i18t('ng_in_redlines_below')} <ins>${i18t('ng_underlined_green')}</ins> and
 <del>${i18t('ng_struck_red')}</del>.</p>
${sigs ? `<p style="font-size:13px"><b>${i18t('ng_sigs_on_record')}</b></p><ul style="font-size:13px">${sigs}</ul>` : ''}
${ev.map(e => negoTimelineEventHtml(c, e)).join('')}
<p style="font-size:12px;color:#5a6470;margin-top:22px">This report stands alone: every sentence above was generated from the stored
negotiation record, labels read as they were when each event happened, and the integrity statement applies to the record as it stood at the
generation time shown. HaTi retains the master copy.</p>
</body></html>`;
}

/* ---------- THE RENUMBER PREVIEW (N2-T3) ----------
   Everything that would move, shown before anything is written: every heading
   old → new, every cross-reference old → new, and — just as deliberately —
   everything that will NOT be touched, with its reason. A preview that only
   shows the tidy half invites a confirm from somebody who has not seen the
   whole act. Nothing outside the plan is ever touched, and Cancel leaves the
   document byte-identical because the plan never wrote anything to cancel. */
function negoRenumberPreviewHtml(c, plan){
  const hRows = plan.headings.map(h => `
    <div class="flex items-start gap-2 py-1.5 border-b border-line/60 text-[12px]" data-renum-head="${_ne(h.clauseId)}">
      <span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-slate-100 text-ink/70 shrink-0">${_ne(h.oldNum)} → ${_ne(h.newNum)}</span>
      <span class="min-w-0 text-ink/80"><s class="text-ink/45">${_ne(h.oldHeading)}</s><br>${_ne(h.newHeading)}</span>
    </div>`).join('');
  const refRows = plan.refs.map(r => `
    <div class="flex items-start gap-2 py-1 text-[11.5px]" data-renum-ref="${_ne(r.clauseId)}">
      <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-ink/70 shrink-0">${_ne(r.from)} → ${_ne(r.to)}</span>
      <span class="text-ink/70">${i18t('ng_in_clause_ref',{num:_ne(r.fromNum || '?'),text:_ne(r.refText)})}</span>
    </div>`).join('');
  const dangling = plan.untouched.filter(u => u.reason === 'dangling');
  const unreachable = plan.untouched.filter(u => u.reason === 'formatting')
    .reduce((a, u) => a + (u.count || 1), 0);
  const leftAlone = (dangling.length || unreachable) ? `
    <div class="text-[11px] font-700 text-ink/70 mt-3 mb-1">${i18t('ng_will_not_be_touched')}</div>
    ${dangling.map(u => `<div class="text-[11.5px] text-ink/60 py-0.5" data-renum-untouched="dangling">“${_ne(u.refText)}” — unresolvable: no clause here carries ${_ne(u.num)}, so it is left exactly as written.</div>`).join('')}
    ${unreachable ? `<div class="text-[11.5px] text-ink/60 py-0.5" data-renum-untouched="formatting">${unreachable} reference${unreachable === 1 ? '' : 's'} sit${unreachable === 1 ? 's' : ''} across formatting and cannot be rewritten safely — left as ${unreachable === 1 ? 'it is' : 'they are'}.</div>` : ''}` : '';
  return `<div class="p-6" style="max-width:640px" id="renum-preview">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ng_renumber_clauses')}</h3>
    <p class="text-xs text-ink/60 mb-3">The gaps close, and nothing else moves: every clause keeps its identity, every
      cross-reference below is repointed to keep citing the same clause, and no other wording changes.
      Nothing is written until you confirm.</p>
    <div class="text-[11px] font-700 text-ink/70 mb-1">Headings — ${plan.headings.length}</div>
    <div class="max-h-52 overflow-y-auto pr-1">${hRows}</div>
    <div class="text-[11px] font-700 text-ink/70 mt-3 mb-1">${i18t('ng_refs_repointed',{n:plan.refs.length})}</div>
    ${plan.refs.length ? `<div class="max-h-36 overflow-y-auto pr-1">${refRows}</div>`
      : `<div class="text-[11.5px] text-ink/50">${i18t('ng_none_cite')}</div>`}
    ${leftAlone}
    <div class="flex justify-end gap-2 mt-4">
      <button id="renum-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="renum-apply" class="rounded-lg bg-brand-900 text-white px-4 py-2 text-sm font-600 hover:bg-brand-800">${i18tn('ng_renumber',plan.headings.length,{n:plan.headings.length})}</button>
    </div>
  </div>`;
}
/* The door's handler. Looks the contract up by id because the notice is
   generated markup on two different canvases — the inline handler carries the
   one durable fact (the contract id), and everything else is asked fresh. */
function negoRenumberOpen(cId){
  const c = (typeof window.getContract === 'function') ? getContract(cId) : null;
  if (!c) return;
  const blocked = window.negoRenumberBlocked ? negoRenumberBlocked(c) : 'locked';
  if (blocked === 'locked'){
    // The button never renders here — this answers a crafted call, not a click.
    if (window.toast) toast(i18t('ng_executed_numbering_final'), 'err');
    return;
  }
  if (blocked === 'table'){
    if (window.toast) toast(i18t('ng_settle_changes_first'), 'err');
    return;
  }
  const plan = window.negoRenumberPlan ? negoRenumberPlan(c) : null;
  if (!plan || !plan.changed){
    /* 'warn', never a bare call: a bare toast prints nothing at all, so this
       refusal — the one the greyed door above is meant to make unreachable —
       was silent for anybody who got past it. */
    if (window.toast) toast(i18t('ng_nothing_to_renumber'), 'warn');
    return;
  }
  if (typeof window.openModal !== 'function') return;
  openModal(negoRenumberPreviewHtml(c, plan));
  document.getElementById('renum-cancel')?.addEventListener('click', () => closeModal());
  document.getElementById('renum-apply')?.addEventListener('click', () => {
    const applied = window.negoRenumberApply ? negoRenumberApply(c) : null;
    closeModal();
    if (!applied){
      if (window.toast) toast(i18t('ng_nothing_renumbered'), 'err');
      return;
    }
    if (window.persist) persist(c);
    if (window.toast) toast(`Renumbered ${applied.headings.length} clause${applied.headings.length === 1 ? '' : 's'}`
      + (applied.refs.length ? ` and repointed ${applied.refs.length} cross-reference${applied.refs.length === 1 ? '' : 's'}` : ''));
    /* Repaint whichever surface the reader is on — the room if it is open,
       the workspace behind it either way. */
    let painted = false;
    try{ painted = !!(window.negoRepaintOpenRoom && negoRepaintOpenRoom(c)); }catch(_){}
    try{ if (!painted && window.renderWorkspace) renderWorkspace(); }catch(_){}
  });
}

/* ---------- WHICH CHANGE THE PAPER DRAWS, ONCE ----------
   THE ONE READING BOTH DOCUMENT RENDERERS ASK, and it is one because the two
   copies of it had already drifted apart and made the contract on screen untrue.
   redlineDocHtml was corrected for MK-311 on 15 Aug 2026 — a sentence struck by
   their ask, adopted by us, and still printed in full — and negoDocHtml, which
   is what the contract tab and the room draw, went on making exactly the same
   mistake for a day. Two renderers disagreeing about what the agreement SAYS is
   the worst thing this product can do, and it is the duplication warning at the
   top of the rulebook in its least obvious direction: the drawing differs
   between those two surfaces on purpose, the READING never may.

   THE RULE IS ABOUT MEASUREMENT, NOT AGE:
     · Prefer the newest change measured against what NOW STANDS. A change
       written on top of an adoption already contains it, so drawing that one
       shows the adopted wording in its own un-struck text. That is every
       ordinary sequential edit.
     · Where nothing was measured against what stands — the rivals case, which
       is the reported one — draw the LAST ADOPTED change instead. Its marks ARE
       the standing wording, and the rival keeps its tag, which opens its own
       wording where the detail belongs.
     · With nothing adopted, "what stands" IS the baseline, so every change
       qualifies and the newest is drawn: first rounds and legacy two-rival
       clauses are untouched, byte for byte.

   NO RE-DIFFING, deliberately: the stored ops are inside the fingerprint, and a
   mark drawn from a fresh diff would not be the mark the other side verified.
   This picks between changes already on the record; it never rewrites one. */
function negoLeadChange(c, cl, chs){
  const list = Array.isArray(chs) ? chs : (chs ? [chs] : []);
  if (!list.length) return null;
  const standing = (typeof negoClauseNowById === 'function')
    ? (negoClauseNowById(c, cl.clauseId) || cl) : cl;
  const stands = String(standing.text == null ? '' : standing.text);
  const onStanding = x => (typeof negoMeasuredFrom === 'function')
    ? negoMeasuredFrom(x) === stands
    : String((x && x.oldText) == null ? '' : x.oldText) === stands;
  for (let i = list.length - 1; i >= 0; i--) if (onStanding(list[i])) return list[i];
  for (let i = list.length - 1; i >= 0; i--)
    if (list[i] && list[i].status === 'accepted' && list[i].changeType !== 'insertClause') return list[i];
  return list[list.length - 1];
}

function negoDocHtml(c, opts){
  const baseline = !!opts.baseline;
  const clauses = negoClauseList(c);
  let changes = negoChanges(c).filter(x => x.status !== 'superseded');
  /* NARROWED TO ONE, when the reader clicked a fingerprint in the margin. The
     bar above the list says so and offers the way back, so this is never a
     state somebody can be stuck in without knowing why the list got short. */
  if (_negoOnly && _negoLinked && changes.some(x => x.id === _negoLinked))
    changes = changes.filter(x => x.id === _negoLinked);
  /* A LIST PER CLAUSE — the same correction as redlineDocHtml's, and the
     rulebook's rule that a drawing fix goes in BOTH pending-change renderers.
     Newest last, so the entry the old one-per-clause map kept is the one whose
     body is still drawn; the others keep their badges. */
  const byClause = new Map();
  for (const ch of changes.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0))){
    if (ch.changeType === 'insertClause') continue;
    const arr = byClause.get(ch.clauseId) || [];
    arr.push(ch);
    byClause.set(ch.clauseId, arr);
  }
  /* Insertions are drawn WHERE THEY WERE PROPOSED — after the clause they name
     — rather than swept to the end of the document. The old model appended
     them because a line-index id gave it nowhere else to point; a durable id
     names the anchor, so the new clause reads in the place it is meant to
     occupy. An insertion with no surviving anchor falls to the end, and only
     then. */
  const insertsAfter = new Map();
  const orphanInserts = [];
  for (const ch of changes){
    if (ch.changeType !== 'insertClause') continue;
    const anchor = ch.afterClauseId && clauses.some(cl => cl.clauseId === ch.afterClauseId)
      ? ch.afterClauseId : null;
    if (anchor){
      if (!insertsAfter.has(anchor)) insertsAfter.set(anchor, []);
      insertsAfter.get(anchor).push(ch);
    } else orphanInserts.push(ch);
  }

  const title = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name)
    || c.name || 'Contract';
  const meta = [c.counterparty ? `Between ${(_ngOurParty(c) || 'this workspace')} and ${c.counterparty}` : null,
    c.id, baseline ? 'Baseline · the wording this round is measured against'
      : `Round ${negoRound(c)} · proposed redline`].filter(Boolean).join(' · ');

  /* Every clause carries its own heading, rebuilt from num and title on this
     render. The label is never stored and never hashed, so renumbering the
     contract changes what is printed here and nothing else. */
  /* ---- AND A CHANGE CAN PROPOSE A NEW ONE (owner-asked 28 Aug 2026) ----
     BOTH document renderers or neither: this canvas is what the contract tab
     and the room draw, redlineDocHtml is what the negotiation page and the
     counterparty's copy draw, and the rulebook's first rule is that the
     DRAWING may differ between two surfaces while the READING never may. So
     the reading is the shared one — negoHeadingAsk — and only the clothes
     differ: this canvas prints the LABEL (number and title, rebuilt), the
     other prints the document's own heading verbatim.

     Read the clause's own lead change, which is the change whose body is drawn
     below it, so the heading and the wording tell one story. */
  const _headLabel = h => {
    const raw = String(h || '').trim();
    if (!raw) return '';
    if (!window.clauseParseHeading) return raw;
    try { return negoClauseLabel(clauseParseHeading(raw)) || raw; } catch (_){ return raw; }
  };
  const head = (cl, ch) => {
    const ask = (typeof negoHeadingAsk === 'function') ? negoHeadingAsk(cl, ch) : null;
    const label = negoClauseLabel(cl);
    if (!ask) return label ? _ne(label) : '';
    const to = _headLabel(ask.to);
    /* A settled rename keeps its marks; a live one follows the reading, the
       same rule the body under it obeys. */
    const settled = ch.status !== 'pending' || ch.withdrawn;
    const which = settled ? 'marks' : rlReadSideOf(ch, rlReadMode());
    if (which === 'del') return label ? _ne(label) : '';
    if (which === 'ins') return _ne(to);
    return `${label ? `<span class="nego-del">${_ne(label)}</span> ` : ''}<span class="nego-ins">${_ne(to)}</span>`;
  };
  /* The redline comes from the change's STORED ops, never from a diff run now.
     Two renders of one record are identical by construction, which is what
     makes "what was reviewed is what was decided on" a property rather than a
     hope. */
  /* BLOCK-AWARE, and still rendered from storage. redlineOpsBlocksHtml regroups
     the recorded ops at their newlines — it rewrites none of them — so a clause
     under redline keeps its heading, its numbered sub-clauses and its lettered
     sub-paragraphs instead of collapsing into one paragraph. That collapse was
     worst exactly where it hurt most: the clause a reader is being asked to
     decide about. */
  /* ---- AND IT HONOURS THE READING THE PERSON CHOSE ----
     The three readings are switched on the workbench (see rlReadMode), and the
     choice is one module-level value rather than one per surface. This
     renderer has no switch of its own, but it must not contradict the one that
     does: a reader who set "As agreed" on the workbench and then opened this
     room would otherwise be shown the marks again with nothing saying why.
     Same predicate, same ops transform — THE MAP's rule that both renderers
     draw a pending change the same way. */
  const redline = ch => {
    const ops = rlOpsAsSide(ch.ops, rlReadSideOf(ch, rlReadMode()));
    return (window.redlineOpsBlocksHtml && Array.isArray(ops) && ops.length)
      ? redlineOpsBlocksHtml(ops)
      : (window.negoChangeHtml ? negoChangeHtml(ch) : _ne(ch.newText || ''));
  };
  /* The adopted wording, in the same blocks. Built off the ops with the
     deletions dropped, so an accepted clause reads as the document rather than
     as the redline minus its red. */
  const resolvedHtml = ch => {
    if (Array.isArray(ch.ops) && ch.ops.length && window.redlineOpsBlocksHtml){
      const kept = ch.ops.filter(o => o.op !== 'del')
        .map(o => ({ op: o.op === 'ins' ? 'ins' : 'keep', text: o.text }));
      return redlineOpsBlocksHtml(kept, { insClass: 'nego-resolved', spans: true });
    }
    return `<p class="rl-line rl-text"><span class="nego-resolved" data-fade>${_ne(ch.newText)}</span></p>`;
  };

  /* 2.1/2.2 — the working pane is EDITABLE, and it edits the rich document
     rather than a textarea over a text projection. Each clause carries its own
     controls, so a change is filed against the clause the writer was actually
     looking at; the old "propose" flow handed them the whole document in one
     box and then tried to work out afterwards which clause they had meant.

     Read-only panes get none of this: the baseline is a reference and the
     other side's turn is not yours to edit. */
  const editable = !baseline && !opts.readonly && opts.canEdit !== false;
  /* "Change", not "Edit". A counterparty cannot edit somebody else's contract
     and knows it, so a button marked Edit reads as one they are not allowed to
     press — and the act it performs is not an edit at all: it files a tracked
     change for the other side to accept or reject. The word people reach for is
     the one the portal's own redline screen already uses. */
  /* THE STATUS SITS WITH THE VERBS, ON ONE LINE.

     "Accepted", "Rejected — baseline kept" and "Needs review" used to be pushed
     inside the clause's own <h2 data-nego-chrome>, which put a status pill in the middle of the
     document's heading — "Clause 4 · Payment Terms Accepted" reads as part of
     the title of the clause, and on a narrow pane it wrapped the heading onto
     two lines. It belongs with the controls that act on that clause, which
     already have a row of their own.

     The row is flex/justify-end, so the notes are emitted FIRST and land
     immediately before Change and Delete. Where there is no row — a read-only
     pane, the baseline — the note stays exactly where it was, because a
     reference copy still has to say what was decided. */
  const tools = (cl, notes) => editable ? `<div class="nego-tools">
      ${notes || ''}
      ${opts.noAi ? '' : `<button class="nego-tool" data-nego-ai-clause="${_ne(cl.clauseId)}"
        title="${i18t('ng_ai_redraft_title')}">&#10024; Copilot</button>`}
      <button class="nego-tool" data-nego-edit="${_ne(cl.clauseId)}"
        title="${i18t('ng_propose_change_title')}">Change</button>
      ${''/* "Add clause" is gone. Proposing a clause the contract does not
             have yet is a real act, but it was done through two blank prompt
             boxes — a heading, then a body, typed into a modal with no sight of
             the document around it — which is not how anybody drafts a clause.
             Removed rather than left as a control nobody could use well.
             Wording still enters through the template, through an edit, or as a
             redline from the other side. */}
      ${''/* "Delete" is gone from this toolbar, and "Propose deletion" from
             the workbench's, both seats at once (Young, 03 Aug 2026). Striking
             a whole clause out stopped earning its own always-visible verb:
             the ENGINE keeps deletions as first-class changes — records that
             carry one still render, travel and get accepted or rejected
             exactly as before, and the Copilot's span replace still files
             them — but originating one is no longer a single button beside
             every clause. */}
    </div>` : '';

  /* ---------- THE TWO WAYS A CLAUSE IS DRAWN ----------
     A clause with a change on it is drawn from the TEXT PROJECTION, and it has
     to be: the redline is rendered from the change's stored ops, which are ops
     over that projection, so the marked-up words and the fingerprint that binds
     them are the same substance. Nothing here touches that.

     A clause with nothing on it is drawn from the DOCUMENT — its own bodyHtml,
     lists and emphasis and tables intact — because there is no redline to line
     up against and no reason to show anybody a flattened copy of a document
     they are being asked to agree to.

     Both keep the same wrapper: the same clause id, the same tools, the same
     heading, so Change, Delete, badge anchoring and the synchronised highlight
     do not know the difference. And the comparison is unaffected either way —
     negoEditClause still opens on bodyHtml, the diff still runs on text. */
  const clauseBlock = (cl, chs, domPrefix) => {
    /* `chs` is the clause's LIST of changes, newest last, and one of them
       carries the BODY while the rest keep their badges — so a decided ask
       stays visible beside a newer one instead of losing its place.

       WHICH ONE CARRIES THE BODY IS A QUESTION ABOUT MEASUREMENT, NOT AGE, and
       this renderer was reading it as age (`chs[chs.length - 1]`) long after
       its twin was corrected. That is the duplication warning at the top of the
       rulebook, in its least obvious direction: redlineDocHtml was fixed on
       15 Aug 2026 for MK-311 — a sentence struck by their ask, adopted by us,
       and still printed in full — and this canvas, which is what the contract
       tab and the room draw, went on making exactly the same mistake. The two
       renderers disagreed about what the contract said.

       The rule, and it is the same reading negoMeasuredAlike gave the accept
       guard: prefer the newest change measured against what NOW STANDS (an edit
       written on top of an adoption already contains it, which is every
       ordinary sequential edit and is what was drawn before); failing that draw
       the last ADOPTED change, because its wording IS what stands. With nothing
       adopted, "what stands" is the baseline and every change qualifies — so
       first rounds and legacy two-rival clauses are untouched, byte for byte. */
    const _list = Array.isArray(chs) ? chs : (chs ? [chs] : []);
    const ch = negoLeadChange(c, cl, _list);
    const rest = _list.filter(x => x !== ch);
    if (baseline || !ch)
      return `<div class="nego-clause" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}">
        ${tools(cl)}${head(cl, null) ? `<h2 data-nego-chrome>${head(cl, null)}</h2>` : ''}${negoRichBody(cl)}</div>`;

    let body, badgeCls = '', badgeSuffix = '', note = '';
    /* A FORMATTING-ONLY change has all-keep ops — rendered from them it would
       show the baseline with no marks at all, a proposal invisible on the page
       it is proposed on. So it renders the proposed rich body itself (the new
       formatting, visible), and the chip in the notes row says what kind of
       ask it is. No rich-diff marks are invented — the words are unchanged by
       definition, and the summary and chip say so. */
    const fmtBody = (ch.formattingOnly && ch.bodyHtml && window.sanitizeRich)
      ? `<div class="nego-redline nego-fmt-only">${sanitizeRich(ch.bodyHtml)}</div>`
      /* ---- A RENAME MOVES NO WORDS, SO THE CLAUSE READS AS THE DOCUMENT ----
         Drawn from all-keep ops the clause comes back as its text projection,
         which costs a numbered or indented clause its shape the moment
         somebody proposes a new name for it. Same reading and same remedy as
         redlineDocHtml's, so the two canvases agree. */
      : (Array.isArray(ch.ops) && ch.ops.length && !negoWordsMoved(ch))
        ? `<div class="nego-redline">${negoRichBody(cl)}</div>` : null;
    if (ch.status === 'pending'){
      /* A proposed DELETION strikes the clause through whole and leaves every
         word of it on the page. The text is not removed until the deletion is
         accepted — a document that quietly loses a clause while someone is
         still deciding about it is the failure this rule exists to prevent. */
      body = ch.changeType === 'deleteClause'
        ? `<div class="nego-redline">${_negoStruckBlocks(cl.text)}</div>`
        : (fmtBody || `<div class="nego-redline">${redline(ch)}</div>`);
    } else if (ch.status === 'accepted'){
      body = ch.changeType === 'deleteClause'
        ? `<div class="nego-redline">${_negoStruckBlocks(cl.text)}</div>`
        : (fmtBody || `<div class="nego-redline">${resolvedHtml(ch)}</div>`);
      badgeCls = 'is-accepted'; badgeSuffix = ' ✓';
      /* THE LABEL NAMES THE CHANGE, and it has to.

         A clause block is whatever sits between two headings, and in a real
         contract that can be a great deal: the parties, the recitals and the
         "NOW, THEREFORE" all land in one block under one short heading. A bare
         "Accepted" pill over a slab like that reads as a verdict on every
         paragraph beneath it, and the reader has no way to tell which part of
         it the word refers to.

         Naming the change fixes exactly that, and nothing else moves. It reads
         as the outcome of one identified proposal — the same one whose
         fingerprint is in the margin an inch away and whose entry is in the
         index on the right — rather than as a stamp on the document. */
      note = ch.changeType === 'deleteClause'
        ? `<span class="nego-note ok">${i18t('ng_accepted_removed',{id:_ne(ch.id)})}</span>`
        : `<span class="nego-note ok">#${_ne(ch.id)} accepted</span>`;
    } else {
      /* Rejected: the baseline stands, so this clause is not under redline any
         more and reads as the document — the visible half of "silence
         rejects". It used to render the projection, which meant a refusal
         quietly cost the clause its structure for the rest of the negotiation. */
      body = negoRichBody(cl);
      badgeCls = 'is-rejected'; badgeSuffix = ' ✕';
      note = `<span class="nego-note no">#${_ne(ch.id)} rejected — baseline kept</span>`;
    }
    const active = _negoActive === ch.id;
    const flag = ch.needsReview
      ? `<span class="nego-note no" title="${_ne(ch.needsReviewWhy || '')}">${i18t('ng_needs_review',{id:_ne(ch.id)})}</span>` : '';
    /* Said while the ask is live or adopted; a rejected one reads as the
       baseline, where the chip would be a claim about wording no longer on
       the table. */
    const fmtFlag = (ch.formattingOnly && ch.status !== 'rejected')
      ? `<span class="nego-note fmt" title="${_nea(i18t('ng_formatting_only_title'))}">${i18t('ng_formatting_only')}</span>` : '';
    const notes = note + fmtFlag + flag;
    /* Emitted ONCE: in the tools row where there is one, in the heading where
       there is not. Rendering it in both places is the thing this change exists
       to stop. */
    const row = tools(cl, notes);
    const inHead = row ? '' : notes;
    /* One badge per change on the clause, oldest first, each wearing its own
       verdict glyph — the newest (whose redline is the body below) keeps the
       active highlight it always had. First token of data-change stays the
       drawn change, for the selection helpers that read one id. */
    const restBadges = rest.map(x => {
      const cls = x.status === 'accepted' ? ' is-accepted' : x.status === 'rejected' ? ' is-rejected' : '';
      const sfx = x.status === 'accepted' ? ' ✓' : x.status === 'rejected' ? ' ✕' : '';
      return `<button class="nego-badge${cls}" data-badge="${_ne(x.id)}" title="${_ne(x.hash || '')}"
        aria-label="${_ne(i18t('ng_change_aria',{id:x.id,status:x.status}))}">#${_ne(x.id)}${sfx}</button>`;
    }).join('');
    const changeIds = _ne([ch].concat(rest).map(x => x.id).join(' '));
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}" data-change="${changeIds}">
      ${row}${restBadges}<button class="nego-badge${active && !badgeCls ? ' is-active' : ''}${badgeCls ? ' ' + badgeCls : ''}"
        data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}" aria-label="${_ne(i18t('ng_change_aria',{id:ch.id,status:ch.status}))}">#${_ne(ch.id)}${badgeSuffix}</button>
      ${head(cl, ch) ? `<h2 data-nego-chrome>${head(cl, ch)}${inHead}</h2>` : inHead}${body}</div>`;
  };

  const insertBlock = ch => {
    const active = _negoActive === ch.id;
    const cls = ch.status === 'accepted' ? 'is-accepted' : ch.status === 'rejected' ? 'is-rejected' : (active ? 'is-active' : '');
    const sfx = ch.status === 'accepted' ? ' ✓' : ch.status === 'rejected' ? ' ✕' : '';
    const inner = ch.status === 'rejected'
      ? `<span class="nego-del">${_ne(ch.newText)}</span>`
      : ch.status === 'accepted' ? resolvedHtml(ch)
      : `<span class="nego-ins">${_ne(ch.newText)}</span>`;
    const note = ch.status === 'accepted' ? `<span class="nego-note ok">${i18t('ng_accepted_added',{id:_ne(ch.id)})}</span>`
      : ch.status === 'rejected' ? `<span class="nego-note no">${i18t('ng_rejected_not_added',{id:_ne(ch.id)})}</span>` : '';
    const label = ch.headingText || ch.clauseLabel || 'New clause';
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="nw-${negoDomId(ch.clauseId)}" data-clause="${_ne(ch.clauseId)}" data-change="${_ne(ch.id)}">
      <button class="nego-badge${cls ? ' ' + cls : ''}" data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}"
        aria-label="${_ne(i18t('ng_new_clause_aria',{id:ch.id,status:ch.status}))}">#${_ne(ch.id)}${sfx}</button>
      <h2 data-nego-chrome>${_ne(label)}${note}</h2><p>${inner}</p></div>`;
  };

  const prefix = baseline ? 'nb' : 'nw';
  /* Folded to the reviewer's own clauses, exactly as on the workbench — two
     renderers draw this document and both must fold, or the two screens
     disagree about what a reviewer is reading. See rlRvDocClauses. */
  const _rvOnly = (typeof rlRvDocClauses === 'function') ? rlRvDocClauses(c, opts) : null;
  const _rvHidden = _rvOnly ? clauses.filter(cl => !_rvOnly.has(String(cl.clauseId))).length : 0;
  const body = clauses.filter(cl => !_rvOnly || _rvOnly.has(String(cl.clauseId))).map(cl => {
    const own = clauseBlock(cl, byClause.get(cl.clauseId), prefix);
    if (baseline) return own;
    const after = (insertsAfter.get(cl.clauseId) || []).map(insertBlock).join('');
    return own + after;
  }).join('');
  const tail = baseline ? '' : orphanInserts.map(insertBlock).join('');

  /* ON THE WORKING PANE ONLY. The baseline is the wording this round is
     measured against and carries the same gap — saying so twice, side by side,
     reads as two different faults rather than one document. The renumber door
     is offered only on the owner's editable seat: the counterparty reads the
     notice, but renumbering is the document owner's act. */
  const gaps = baseline ? '' : negoNumberingNoticeHtml(c, { noticeId: 'nego-gaps',
    offer: opts.side !== 'counterparty' && (typeof window.canEdit !== 'function' || window.canEdit()) });

  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne(meta)}</div>
    ${gaps}
    ${(typeof rlRvDocNoticeHtml === 'function') ? rlRvDocNoticeHtml(c, opts, _rvHidden) : ''}
    ${body || `<p style="color:var(--n-ink-soft)">${i18t('ng_no_wording_yet')}</p>`}
    ${tail}
  </article>`;
}

/* ---------- the change index ---------- */
/* ============================================================
   WHICH MODE THE ROOM IS IN
   ============================================================
   Two states that look almost identical and mean opposite things:

     INTERNAL SANDBOX DRAFTING — asks of ours that have not been sent. The other
     side cannot see them, cannot answer them, and does not know they exist.
     Work in progress, on our desk.

     COUNTERPARTY PUBLISHED ROUND — what was sent is on their table. It can be
     answered, and every word of it has left the building.

   The distinction was legible only by reading the send strip at the bottom of
   the index. A person drafting six asks and assuming the other side was already
   looking at them is not a far-fetched mistake; this says which it is, at the
   top, in the language of the thing. */
function negoModeHtml(c, opts = {}){
  const side = opts.side || 'owner';
  const me = side === 'counterparty' ? 'counterparty' : 'owner';
  const unsent = window.negoUnsentAsks ? negoUnsentAsks(c, me) : [];
  const n = unsent.length;
  const other = side === 'counterparty'
    ? (window.FIRST_PARTY || 'the other side')
    : (c.counterparty || 'the counterparty');
  if (n) return `
    <div class="nego-mode is-sandbox" role="status">
      <b>${i18t('ng_internal_sandbox')}</b>
      <span style="flex:1;min-width:180px">${n} ask${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} still on your desk. ${_ne(other)} cannot see ${n === 1 ? 'it' : 'them'} and cannot answer until you send.</span>
    </div>`;
  return `
    <div class="nego-mode is-published" role="status">
      <b>${i18t('ng_cp_published_round')}</b>
      <span style="flex:1;min-width:180px">${i18t('ng_all_shared',{who:_ne(other)})}</span>
    </div>`;
}

/* The bar that says the index is showing one change out of many, and gets the
   reader back to all of them. Rendered above the cards rather than inside the
   filtered list, so it survives the filter that produced it. */
function negoLinkedBarHtml(){
  if (!_negoLinked) return '';
  return `<div class="nego-filterbar" role="status">
    <span style="flex:1;min-width:0">${_negoOnly
      ? `Showing change <b>#${_ne(_negoLinked)}</b> on its own.`
      : `Change <b>#${_ne(_negoLinked)}</b> and its conversation are highlighted below.`}</span>
    <button id="nego-only" type="button">${_negoOnly ? 'Show all changes' : 'Show only this one'}</button>
    <button id="nego-unfilter" type="button">${i18t('ng_clear')}</button>
  </div>`;
}
function negoCardsHtml(c, opts){
  const pair = negoComparePair();
  if (!negoIsLivePair(pair.left, pair.right)){
    /* Comparison mode. Differences between two old versions are NOT proposals:
       nobody put them forward and nobody can accept them, so this list has no
       verbs on it. Showing Accept here would invent a decision. */
    const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
    const moved = cmp ? cmp.rows.filter(r => r.state !== 'same') : [];
    if (!moved.length) return `
      <div style="padding:18px 6px;font-size:var(--t-meta);line-height:1.6;color:var(--n-ink-soft)">
        <b style="display:block;color:var(--n-ink);margin-bottom:var(--s-1)">${i18t('ng_no_differences')}</b>
        ${cmp ? _ne(cmp.summary) : ''}</div>`;
    return moved.map(r => `
      <div class="nego-card" data-nego-cmp-row="${_ne(r.clauseId)}" role="button" tabindex="0">
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-st ${r.state === 'added' ? 'accepted' : r.state === 'removed' ? 'rejected' : 'pending'}">${_ne(r.state)}</span>
        </div>
        <div style="font-size:var(--t-body);font-weight:var(--w-strong);line-height:1.45;margin-bottom:var(--s-1)">${_ne(r.label || r.clauseId)}</div>
        <div style="font-size:var(--t-meta);line-height:1.55;color:var(--n-ink)">${
          window.redlineOpsHtml ? redlineOpsHtml(r.ops) : _ne(r.newText)}</div>
      </div>`).join('');
  }
  return negoLiveCardsHtml(c, opts);
}
/* ---- THE COUNTER LINE IS OFF THE CARD (owner-asked, 15 Aug 2026) ----
   It read "Counters #CHG-005 — the earlier ask stays on the record" and it was
   added, unasked, when supersession shipped. The owner's instruction on seeing
   it: "avoid adding more information to the cards unless I ask you to."

   It is a fair call and the reason is the card's own budget. A change card is
   already carrying an id, a status, a clause, an author, a company, the
   wording with its marks, a reason and a row of verbs; a ninth line about
   record-keeping is the least of those and it pushed the wording down. The
   FACT is not lost — `counterOf` is still stamped by the funnel, still
   travels on the payload, and the audit trail still names both changes, which
   is where a record belongs.

   The builder is kept as a stub rather than deleted: it is exported, and both
   card renderers call it. A stub that returns nothing cannot be reached by
   some third caller and start drawing the line again through a door nobody
   remembered. `ng_counters_line` and `.rl-counterline` / `.nego-counterline`
   are STALE — flag any mention. */
function negoCounterLineHtml(){ return ''; }
function negoLiveCardsHtml(c, opts){
  const side = opts.side || 'owner';
  /* THE REVIEWER'S POSTURE. Missed here on the first pass, which is exactly the
     duplication warning in the project's own rules: five renderers compute
     canAct, and gating two of them gated nothing this reader could see. */
  const canAct = opts.readonly ? false : !rlActorHeld(c, opts);
  /* DECIDING AND SPEAKING ARE NOT THE SAME PERMISSION, and one flag was
     answering for both. A read-only copy is one that cannot move the
     negotiation — a spent one-shot link, an executed contract — and that is
     right for Accept and Reject. It is wrong for the reply box: a comment
     opens no round, moves no wording and consumes no link, and the route it
     travels on says so. So a counterparty who had already sent their decisions
     found the owner's "what do you think?" on a card with nowhere to answer it.

     The default is unchanged, so any caller that says nothing gets exactly the
     behaviour it had. A page that knows it still has a channel back says so. */
  const canComment = opts.canComment != null ? !!opts.canComment : canAct;
  const seenScope = negoSeenScope(c, opts);
  /* Narrowed to what this reader was handed, when they are reviewing here. See
     rlMyCardIds — the twin of the filter on the workbench's column. */
  const _mineOnly = rlMyCardIds(c, opts);
  /* THE SAME ORDER AS THE WORKBENCH'S COLUMN, from the same function — this is
     the second of the two card renderers this app draws a change with, and the
     project's own duplication rule says a fix in one is not a fix in the other.
     This list keeps settled changes (it shows everything not superseded), so it
     is the list where sinking them matters most. See rlCardSort. */
  const changes = rlCardSort(negoChanges(c).filter(x => x.status !== 'superseded'
    && (!_mineOnly || _mineOnly.has(String(x.id)))),
    new Set(opts.holdsDecisions ? (opts.heldDecisionIds || []) : []));
  const history = negoHistoryHtml(c, opts);
  if (!changes.length) return `
    <div style="padding:18px 6px;font-size:var(--t-meta);line-height:1.6;color:var(--n-ink-soft)">
      <b style="display:block;color:var(--n-ink);margin-bottom:var(--s-1)">${i18t('ng_no_changes')}</b>
      ${canAct
        ? `To ask for something different, press <b>${i18t('ng_change')}</b> beside any clause in the middle pane. `
          + 'Each one you make lands here as its own item, and the other side accepts or rejects them one at a time.'
        : side === 'counterparty'
          ? 'Nothing has been proposed for this round yet.'
          : 'Nothing has been proposed for this round yet. When the counterparty proposes wording, each change arrives here with its own fingerprint.'}
    </div>${history}`;

  return changes.map(ch => {
    const active = _negoActive === ch.id;
    const open = _negoThreads[ch.id];
    /* A NAME ON A CARD IS A GLANCE — the same rule and the same function as
       the workbench card's meta line (cardName, js/core.js). The author's
       ORGANISATION rides with it so a counterparty filing under their own
       company name is not initialled into a different company. */
    const _liveOrg = ch.authorSide === 'counterparty'
      ? (c.counterparty || 'counterparty') : (window.FIRST_PARTY || 'us');
    const _liveShort = n => (window.cardName ? cardName(n, _liveOrg) : String(n || ''));
    /* Three answers, one predicate — see negoTheirCopy. Only 'none' changes
       what this card says; 'unknown' leaves every sentence exactly as it was. */
    const _liveNoCopy = side !== 'counterparty' && !opts.readonly
      && (window.negoTheirCopy ? negoTheirCopy(c) === 'none' : false);
    /* BOTH HALVES OF THE CONVERSATION. The thread written onto the record and
       the replies filed through the discussion channel are one exchange; see
       negoThreadOf. Reading only ch.thread is how a card could show the
       question and not the answer to it. */
    const msgs = window.negoMergedThread ? negoMergedThread(c, ch, opts.messages) : (ch.thread || []);
    const n = msgs.length;
    /* SOMEBODY IS WAITING ON AN ANSWER, and the card has to say so without
       being read. The count alone does not: "Discuss (2)" looks the same
       whether the last word was theirs an hour ago or yours a moment ago. */
    const unread = !!(window.negoThreadUnread
      && negoThreadUnread(msgs, side, negoThreadSeenAt(seenScope, ch.id)));
    const disCls = `b-dis${n ? ' has-thread' : ''}${unread ? ' has-unread' : ''}`;
    const disTitle = unread
      ? ` title="${_ne(i18t('ng_replied_waiting',{who:(msgs[msgs.length - 1] || {}).who || i18t('ng_they')}))}"`
      : '';
    /* A side may decide the OTHER side's proposals. Nobody rules on their own
       ask: it would let one party mark their own wording adopted and tell the
       other it was agreed. They can still discuss it, and withdraw it by
       proposing something else. */
    const mine = ch.authorSide === side;
    /* ALREADY SENT to the other side. The page that holds decisions until they
       are posted marks them when they go, because the copy of the contract this
       screen reads was snapshotted before they existed — without the mark the
       cards would repaint as undecided the moment the send succeeded, which
       reads as the send having done nothing.

       A sent decision is no longer theirs to UNDO: it is filed with the other
       party, and quietly returning it to "pending" here would leave the two
       sides holding different answers.

       AND IT IS NOT STILL A QUESTION. `sent` used to keep Accept and Reject on
       the card, on the reasoning that changing your mind is allowed. It is —
       but the effect was that the counterparty pressed Send, watched the verbs
       come straight back, and had no way to tell whether anything had left. The
       owner's copy of the same change settled into its decided state at the
       same moment, so the two sides were reading different screens about the
       same decision, which is the one thing this component exists to prevent.

       A decided change is decided on both sides. Deciding it AGAIN is a
       deliberate act now, behind "Change decision" below — the ability is kept,
       the accident is not. */
    const sent = !!ch.sentByMe;
    /* ANSWERED HERE, AND NOWHERE ELSE YET. The one state on this screen that
       looks finished and is not: the card says "accepted", it is green, and the
       other side has heard nothing at all. The only thing that said so was a
       line of small print under a button at the bottom of the panel — so a
       reader who answered and closed the tab lost the answer and had every
       reason to think they had sent it.

       The page supplies this, because the page is the only thing that knows.
       The component cannot work it out: a decision that WAS sent, applied, and
       came back on a refreshed link looks identical from here. */
    const held = !!ch.heldByMe;
    const reopened = !!_negoRedeciding[ch.id];
    const decidable = canAct && !mine && (ch.status === 'pending' || reopened);
    /* DOES THIS SIDE HOLD ITS ANSWERS BEFORE THEY GO?

       The two sides answer differently and the difference is not cosmetic. The
       owner's decision is written to the record as it is made — there is no
       holding step, so there is nothing to warn about and nothing to post. The
       counterparty's is held on their page until they send the round, because a
       public link that wrote to the contract on every click would hand back the
       turn, email the owner and file an audit line five times over one sitting.

       Which of the two this is decides what "changing your mind" means, so the
       page says so outright rather than the component guessing from `sentByMe`
       — which is false on a page that has been reloaded, and would have quietly
       given the owner's Undo to an answer that had already been filed. */
    const holds = !!opts.holdsDecisions;
    const decided = ch.status !== 'pending';
    /* Quiet undo, while the answer is still in this browser. On a side that
       does not hold answers at all, every decision is undoable — the record is
       ours and reopening it is our own act. Never while the verbs are showing:
       Undo beside Accept and Reject is two ways to do one thing, one of which
       is not a decision. */
    const undoable = canAct && !mine && decided && !reopened && (!holds || held);
    /* And the deliberate way back, once the answer is with the other party —
       whether it went from this page a moment ago or was applied and came back
       on the link. */
    const redecidable = canAct && !mine && decided && !reopened && holds && !held;
    /* THE ONE VERB A SIDE HAS OVER ITS OWN ASK. It is not a decision — they
       cannot accept their own proposal — it is an acknowledgement that the
       other side refused it and they are letting it go. Without it a single
       refusal leaves the deal permanently unaligned and neither party can ever
       signal readiness, which is a worse failure than the one the gate fixes.
       Only on a REFUSED ask, and only for the side that made it. */
    const withdrawable = canAct && mine && ch.status === 'rejected';

    /* ---- A CARD IS A CARD AGAIN WHEN THE READING IS DONE ----

       An open thread grows without limit, and the card grows with it: a dozen
       replies and one change fills the index, pushing every other change on the
       table off the screen. Discuss has always been the toggle, but on a long
       thread the toggle is somewhere above the top of the window — you have to
       scroll back past everything you just read to close what you just read.

       So the way out sits at the TOP of the thread, next to the label that
       names it, where it is reachable the moment the thread opens and stays
       reachable however long the thread gets. And the messages themselves are
       given a ceiling with their own scroll, so a card can be open without
       becoming the whole index. */
    const thread = `
      <div class="nego-thread${open ? ' open' : ''}" id="nego-thread-${_ne(ch.id)}">
        <div class="nego-thead">
          <span class="nego-tlabel">${i18t('ng_discussion_no_redraft',{id:_ne(ch.id)})}</span>
          <button class="nego-tmin" data-nego-collapse="${_ne(ch.id)}"
            title="${i18t('ng_collapse_discussion')}">${i18t('ng_hide')}</button>
        </div>
        <div class="nego-tbody">${n ? msgs.map(m => {
            /* A note nobody sent is marked as one, every time it is read.
               A reader has to be able to tell at a glance which half of a
               thread the other side can see — the cost of guessing wrong is
               saying something to a room you thought was empty. */
            const shared = m.visibility === 'shared';
            const badge = `<span class="nego-vis ${shared ? 'nego-vis-sh' : 'nego-vis-int'}">${
              shared ? '\uD83C\uDF10 Shared with counterparty' : '\uD83D\uDD12 Internal only'}</span>`;
            const bubble = window.discussBubbleHtml
              ? discussBubbleHtml({ author: m.who, at: m.at, body: m.text, side: m.side }, side)
              : `<div style="font-size:var(--t-meta);margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`;
            return `<div class="nego-msg${shared ? '' : ' is-internal'}">
              <div style="margin-bottom:3px">${badge}</div>${bubble}</div>`;
          }).join('')
          : `<div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:var(--s-2)">${i18t('ng_no_comments_yet')}</div>`}</div>
        ${canComment ? `<div class="nego-compose" style="flex-wrap:wrap">
          <div class="nego-visswitch" role="group" aria-label="${i18t('ng_who_can_read')}" style="flex:none;margin-bottom:5px">
            <button type="button" class="v-int" data-nego-vis="internal" data-for="${_ne(ch.id)}" aria-pressed="false">\uD83D\uDD12 Internal</button>
            <button type="button" class="v-sh" data-nego-vis="shared" data-for="${_ne(ch.id)}" aria-pressed="true">\uD83C\uDF10 ${i18t('ng_send_to_them')}</button>
          </div>
          <textarea class="chat-field" rows="1" id="nego-ti-${_ne(ch.id)}" placeholder="${i18t('ng_reply_on_change')}" aria-label="${_ne(i18t('ng_reply_on_change_aria',{id:ch.id}))}"></textarea>
          ${''/* "Send", because that is what it does: the comment goes to the
                  other side on the discussion channel the moment it is
                  pressed. It was briefly "Save" to keep it apart from the
                  postbox below — but a button whose word does not match its
                  act is the worse of the two problems. */}
          <button data-nego-send="${_ne(ch.id)}">${i18t('ng_send')}</button>
        </div>` : ''}
      </div>`;

    const acts = decidable ? `
      <div class="nego-acts">
        <button class="b-acc" data-nego-accept="${_ne(ch.id)}">${i18t('ng_accept')}</button>
        <button class="b-rej" data-nego-reject="${_ne(ch.id)}">${i18t('ng_reject')}</button>
        <button class="${disCls}"${disTitle} aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="nego-thread-${_ne(ch.id)}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
      </div>`
      : `<div class="nego-acts">
        <button class="${disCls}"${disTitle} aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="nego-thread-${_ne(ch.id)}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
        ${''/* ONE ACT, ONE WORD, ON BOTH CARDS (13 Aug 2026). This button and
               the workbench card's new Reopen are the same press on the same
               handler — but only on a side that does NOT hold its answers,
               where "undo" means reopening a decision already on the record.
               Where the answer is still held on this page, Undo is the right
               word: nothing has been decided anywhere else yet. */}
        ${undoable ? `<button class="b-undo" data-nego-undo="${_ne(ch.id)}">${
          holds ? i18t('ng_undo') : i18t('ng_change_decision')}</button>` : ''}
        ${redecidable ? `<button class="b-redecide" data-nego-redecide="${_ne(ch.id)}"
            title="${i18t('ng_answered_and_sent')}">${i18t('ng_change_decision')}</button>` : ''}
        ${withdrawable && !ch.withdrawn
          ? `<button class="b-wdr" data-nego-withdraw="${_ne(ch.id)}"
              title="${i18t('ng_they_refused')}">${i18t('ng_withdraw_ask')}</button>` : ''}
        ${withdrawable && ch.withdrawn
          ? `<button class="b-undo" data-nego-unwithdraw="${_ne(ch.id)}"
              title="${i18t('ng_put_ask_back')}">${i18t('ng_put_it_back')}</button>` : ''}
      </div>`;

    return `
      <div class="nego-card${active ? ' is-active' : ''}${held ? ' is-held' : ''}${mine ? ' is-mine' : ''}${ch.id === _negoLinked ? ' is-linked' : ''}" id="nego-card-${_ne(ch.id)}" data-nego-card="${_ne(ch.id)}"
           role="button" tabindex="0">
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-id">#${_ne(ch.id)}</span>
          ${''/* THE ORIGIN PILL IS GONE FROM HERE TOO (owner-asked, 12 Aug 2026).
                 It came off the workbench's card because it was a third tag in
                 a corner that already had two, and the same is true on this
                 one. It is removed from BOTH renderers on the same day and for
                 the same reason — a fact drawn in two places and deleted from
                 one is a fact the two screens now disagree about. What answers
                 the question here is .is-mine on the card (the coloured edge)
                 and the author line below. negoWhoseHtml survives for the
                 PAST-ROUND cards in the history panel, which have no filter
                 above them and no edge worth reading. */}
          ${negoVerifyPill(c, ch)}
          <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
          ${sent ? `<span class="nego-st sent" data-sent="${_ne(ch.id)}"
            title="${i18t('ng_answer_sent')}">sent</span>` : ''}
        ${held ? `<span class="nego-st unsent" data-unsent="${_ne(ch.id)}"
            title="${i18t('ng_answered_not_sent')}">${i18t('ng_not_sent_yet_lc')}</span>` : ''}
          ${ch.withdrawn ? `<span class="nego-st withdrawn" data-withdrawn="${_ne(ch.id)}"
            title="${i18t('ng_refused_withdrawn')}">withdrawn</span>` : ''}
          ${''/* THE SAME CHIP THE WORKBENCH DRAWS, from the same function. Two
                 renderers draw a change in this product and both have to carry
                 every fact about it — the day formatting-only changes shipped
                 was the day that stopped being advice. */}
          ${window.reviewChipHtml ? reviewChipHtml(ch, opts, c) : ''}
        </div>
        ${''/* THE SAME HONESTY AS THE WORKBENCH CARD (13 Aug 2026). "It stops
                being outstanding when <them> withdraws it" is a claim about
                their screen, and it is false where they hold no live copy of
                the contract. Both renderers carry the correction, on the same
                day, from the same reading — the project's own duplication
                rule, and this is exactly the kind of sentence that gets fixed
                in one renderer and left in the other. */}
        ${ch.status === 'rejected' && !ch.withdrawn ? `<div class="nego-contested" data-contested="${_ne(ch.id)}">
          <b>${i18t('ng_still_between_you')}</b> This was refused. ${
          (!mine && _liveNoCopy)
            ? _ne(i18t('ng_nocopy_say', { who: c.counterparty || i18t('ng_the_counterparty') }))
            : `It stops being outstanding when ${mine ? 'you withdraw it' : `${_ne(_liveShort(ch.author))} withdraws it`} — until then neither side can signal readiness to sign.`}</div>` : ''}
        <div style="font-size:var(--t-body);font-weight:var(--w-strong);line-height:1.45;margin-bottom:var(--s-1)">${_ne(ch.summary)}</div>
        <div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
        ${''/* The "(your side)" italic that used to live here is gone. It was
                the only thing on the card saying whose ask this was: grey, small,
                at the bottom, next to a name that on a deal where both sides are
                you says nothing at all. It is a pill in the top row now, and the
                card carries an edge. */}
        ${''/* Shortened like the workbench card's meta line — one shared
                function, so the two renderers cannot drift. The whole name is
                on this line's own hover. */}
        <div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:7px" title="${_ne(String(ch.author || ''))}">${i18t('ng_author')} <b style="color:var(--n-ink);font-weight:var(--w-strong)">${
          _ne(window.cardName ? cardName(ch.author, _liveOrg) : ch.author)}</b></div>
        ${negoCounterLineHtml(c, ch)}
        ${''/* Both renderers carry it — the project's own duplication rule. */}
        ${(side !== 'counterparty' && ch.revisedBy && ch.revisedBy !== ch.author) ? `<div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:7px"
          title="${_ne(i18t('ng_revised_title'))} — ${_ne(String(ch.revisedBy))} / ${_ne(String(ch.author))}"><span aria-hidden="true">&#9998;</span> ${
          i18t('ng_revised_by_after',{who:_ne(_liveShort(ch.revisedBy)),author:_ne(_liveShort(ch.author))})}</div>` : ''}
        ${(ch.why || ch.note) ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:var(--radius);padding:6px 9px;margin-bottom:var(--s-2)">
          <span style="display:block;font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--n-slate)">${i18t('ng_why_they_asked')}</span>
          <span class="nego-why-clamp" style="font-size:var(--t-meta);line-height:1.5;color:var(--n-ink)">${_ne(ch.why || ch.note)}</span></div>` : ''}
        ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:var(--s-2);font-size:var(--t-meta);line-height:1.5;color:var(--n-ink)"><b>${i18t('ng_reply')}</b> ${_ne(ch.reply)}</div>` : ''}
        ${(() => { if (!window.reviewSeatShowsReview || !reviewSeatShowsReview(opts)) return '';
          const v = window.reviewOn ? reviewOn(ch) : null;
          /* Same rule as the workbench's twin: the note names its author. */
          const sayBy = (v && window.reviewVerdictByFor) ? reviewVerdictByFor(ch, null, c) : (v && v.by);
          return (v && v.note && sayBy) ? `<div style="border-left:2px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:var(--radius);padding:6px 9px;margin-bottom:var(--s-2)">
            ${''/* NOT UPPERCASE, unlike the labels above it: this one holds a
                   PERSON'S NAME. "WHY THEY ASKED" is a caption and capitals
                   read as a caption; "ACHIENG OTIENO SAID" reads as shouting,
                   and a long name in caps outgrows the card. Same rule as the
                   review chip beside it. */}
            <span style="display:block;font-size:var(--t-label);font-weight:var(--w-title);letter-spacing:.01em;color:var(--st-amber-fg)" title="${_ne(String(sayBy))}">${i18t('rv_reviewer_said', { who: _ne(_liveShort(sayBy)) })}</span>
            <span style="font-size:var(--t-meta);line-height:1.5;color:var(--n-ink)">${_ne(v.note)}</span></div>` : ''; })()}
        <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
        ${acts}
        ${''/* ---- THE GAP WHERE A VERB WOULD HAVE BEEN ----
               Both card renderers carry it — the project's own duplication
               rule, and this feature is exactly the kind that gets fixed in one
               and forgotten in the other. Only the "instead" sentence, not the
               drafted-by line the workbench card gets: THIS card already prints
               the author on a line of its own a few rows up, and saying it
               twice would be the "one tag per card" fault the review feature
               was reported for. */}
        ${window.deskCardInsteadHtml ? deskCardInsteadHtml(c, ch, opts) : ''}
        ${''/* The requester's way out of their own escalation — see
               reviewCardCancelHtml. Both card renderers carry it, which is the
               project's own duplication rule and exactly the kind of thing this
               feature has been fixed in one renderer and forgotten in the other
               before. */}
        ${(() => { const x = window.reviewCardCancelHtml ? reviewCardCancelHtml(c, ch, opts) : '';
          return x ? `<div class="nego-acts" style="margin-top:7px">${x}</div>` : ''; })()}
        ${window.reviewVerbsHtml ? reviewVerbsHtml(c, ch, opts) : ''}
        ${held ? `<div class="nego-hold" data-hold="${_ne(ch.id)}">
          <span aria-hidden="true">▲</span>
          <span><b>${i18t('ng_not_sent_yet')}</b> ${_ne(String(opts.org || window.FIRST_PARTY || 'The other side'))} has not seen this answer.
          Use the blue <b>${i18t('ng_send')}</b> ${i18t('ng_button_under_list')}</span>
        </div>` : ''}${thread}
      </div>`;
  }).join('') + history;
}

/* ---------- WHOSE ASK IS THIS ----------

   The one fact a change index has to carry and did not. Every card looked
   alike, and the only thing distinguishing an ask you had made from one you
   were being asked to answer was the word "(your side)" in grey italic at the
   bottom, beside an author name — which on a deal where the same person is
   testing both sides says nothing at all, and on a real one still asks the
   reader to read where they wanted to glance.

   It is why "Change decision" appears on some cards and not others: nobody
   rules on their own ask. That rule was being applied on a screen that did not
   say which was which, so its effect read as an inconsistency.

   SAID TWICE, ON PURPOSE, IN TWO CHANNELS. The pill carries the words, and
   words survive a printed page, a colour-blind reader and a phone that renders
   its own controls. The edge carries the colour, and colour is what lets eight
   cards split into two groups without being read.

   NAMED, NOT SIDED. "Nordfrakt Logistik AB asked" beats "counterparty asked" —
   the reader knows who they are talking to, and one component serves both
   screens, so the card you see as yours is the card they see as ours.

   ---- AND IT IS OFF THE LIVE CARDS (owner-asked, 12 Aug 2026) ----
   The argument above is still the right argument; it just stopped being worth
   a third tag in a corner that already had two. On a LIVE card the same
   question is answered by the Mine / Theirs / All filter standing over the
   column and by the author line under the head, so the pill was the third
   answer and the one nobody needed. Removed from both live renderers on the
   same day — this one and redlineChangeCardsHtml — because a fact deleted from
   one of two screens is a fact those screens now disagree about.

   THIS FUNCTION STAYS, and it has exactly one caller left:
   negoHistoryCardHtml, the settled cards in the closed-round panel. Those have
   no filter above them, no verbs to make the question urgent and no live
   column to read them against — they are a record, and a record says who
   asked. Deleting it there would have been tidiness applied where the reason
   does not reach. */
function negoWhoseHtml(c, ch, opts, mine){
  const side = opts.side || 'owner';
  const them = (side === 'owner'
    ? String((c && c.counterparty) || '')
    : String(opts.org || window.FIRST_PARTY || '')).trim();
  const label = mine ? 'Your ask' : (them ? `${them}’s ask` : 'Their ask');
  return `<span class="nego-whose${mine ? ' mine' : ''}" data-whose="${mine ? 'mine' : 'theirs'}"
    title="${mine ? 'Your side asked for this. Nobody rules on their own ask, so there is no Accept or Reject on it here.'
      : 'They asked for this — it is yours to accept, reject or discuss.'}">${_ne(label)}</span>`;
}

/* ---------- THE ROUNDS THAT ARE OVER ----------

   Closing a round archives its decided changes onto the round record and empties
   the live list, which is right — a round is a batch of decisions that has been
   settled, and carrying it forever into the next one is how the index became a
   pile. But the index drew the live list and nothing else, so the moment round 1
   closed, five decisions, their reasons, their discussions and their
   fingerprints left the screen entirely and the panel read "No changes on the
   table." Nothing was lost; nothing was reachable either, and a negotiation
   record you cannot look at is not much of a record.

   READ-ONLY, AND VISIBLY SO. These are settled: the wording they produced is
   already the baseline the current round is measured against, and their hashes
   are sealed into the chain. There is no verb that could honestly be offered on
   one — accepting a change that was accepted in round 1 would be inventing a
   second decision — so the cards carry none. What they carry is what was
   decided, by whom, why, and the fingerprint to prove it.

   Folded away by default. A reader arriving at the room must see the round in
   flight first; the history is there when they go looking for it. */
function negoHistoryHtml(c, opts = {}){
  const rounds = (c.negotiation && Array.isArray(c.negotiation.rounds)) ? c.negotiation.rounds : [];
  if (!rounds.length) return '';
  const side = opts.side || 'owner';
  return `<div class="nego-history" id="nego-history">
    <div class="nego-history-head">${i18t('ng_earlier_rounds')}</div>
    ${rounds.map(r => {
      const list = (r.changes || []).filter(x => x && x.status !== 'superseded');
      const open = !!_negoOpenRounds[r.n];
      const acc = list.filter(x => x.status === 'accepted').length;
      const rej = list.filter(x => x.status === 'rejected').length;
      const when = r.at ? String(r.at).slice(0, 10) : '';
      return `<section class="nego-round${open ? ' open' : ''}" data-round="${_ne(r.n)}">
        <button class="nego-round-tog" data-nego-round="${_ne(r.n)}"
          aria-expanded="${open ? 'true' : 'false'}" aria-controls="nego-round-body-${_ne(r.n)}">
          <span class="nego-round-caret" aria-hidden="true">${open ? '▾' : '▸'}</span>
          <span class="nego-round-name">${i18t('ng_round_n',{n:_ne(r.n)})}</span>
          <span class="nego-round-count">${list.length} change${list.length === 1 ? '' : 's'}${
            acc ? ` · ${acc} accepted` : ''}${rej ? ` · ${rej} rejected` : ''}</span>
        </button>
        ${''/* DRAWN ONLY WHEN IT IS OPEN, not drawn and hidden. Six rounds of
               history behind display:none is six rounds of cards, threads and
               fingerprints built on every repaint of a screen showing none of
               them — and it makes "is this readable" a question about a
               stylesheet rather than about what is on the page. */}
        <div class="nego-round-body" id="nego-round-body-${_ne(r.n)}">${open ? `
          <div class="nego-round-note">Closed${when ? ` on ${_ne(when)}` : ''} — settled, and kept as the record.
            The wording agreed here became the baseline for round ${_ne(r.n + 1)}.</div>
          ${list.length
            ? list.map(ch => negoHistoryCardHtml(c, ch, r, opts)).join('')
            : `<div class="nego-round-note">${i18t('ng_round_closed_nothing')}</div>`}` : ''}
        </div>
      </section>`;
    }).join('')}
  </div>`;
}
function negoHistoryCardHtml(c, ch, r, opts){
  const side = (opts && opts.side) || 'owner';
  const msgs = ch.thread || [];
  const mine = ch.authorSide === side;
  return `<div class="nego-card is-past${mine ? ' is-mine' : ''}" data-nego-past="${_ne(ch.id)}" data-round-of="${_ne(r.n)}">
    <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:7px;flex-wrap:wrap">
      <span class="nego-id">#${_ne(ch.id)}</span>
      ${negoWhoseHtml(c, ch, opts || {}, mine)}
      <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
      ${ch.withdrawn ? '<span class="nego-st withdrawn">withdrawn</span>' : ''}
      <span class="nego-st past" data-past-round="${_ne(ch.id)}"
        title="${_ne(i18t('ng_decided_archived',{n:r.n}))}">${i18t('ng_round_lower',{n:_ne(r.n)})}</span>
    </div>
    <div style="font-size:var(--t-body);font-weight:var(--w-strong);line-height:1.45;margin-bottom:var(--s-1)">${_ne(ch.summary)}</div>
    <div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
    <div style="font-size:var(--t-label);color:var(--n-ink-soft);margin-bottom:7px">${i18t('ng_author')} <b style="color:var(--n-ink);font-weight:var(--w-strong)">${_ne(ch.author)}</b></div>
    ${(ch.why || ch.note) ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:var(--radius);padding:6px 9px;margin-bottom:var(--s-2)">
      <span style="display:block;font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--n-slate)">${i18t('ng_why_they_asked')}</span>
      <span class="nego-why-clamp" style="font-size:var(--t-meta);line-height:1.5;color:var(--n-ink)">${_ne(ch.why || ch.note)}</span></div>` : ''}
    ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:var(--s-2);font-size:var(--t-meta);line-height:1.5;color:var(--n-ink)"><b>${i18t('ng_reply')}</b> ${_ne(ch.reply)}</div>` : ''}
    <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
    ${msgs.length ? `<div class="nego-past-thread">
      <div class="nego-tlabel">${i18tn('ng_discussion_closed',msgs.length,{id:_ne(ch.id),n:msgs.length})}</div>
      ${msgs.map(m => (window.discussBubbleHtml
        ? discussBubbleHtml({ author: m.who, at: m.at, body: m.text, side: m.side }, side)
        : `<div style="font-size:var(--t-meta);margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`)).join('')}
    </div>` : ''}
  </div>`;
}

/* ---------- the "Verified" pill ----------
   The prototype renders this unconditionally, and so did this component until
   now — which is the exact fakery the prototype is criticised for. A pill that
   always says Verified verifies nothing; worse, it teaches a reader that the
   word is decoration.

   It now reads verifyChangeChain(), which recomputes every hash in the history
   from STORED content and checks each link against the one before it. Three
   states, and only one of them is reassuring:

     ok            → Verified, with the number of records checked
     failed        → Integrity check failed, NAMING the first broken change
     not yet run   → Checking…, which claims nothing

   A change that is itself the broken link is called out on its own card, so a
   reader looking at that change sees the problem where the problem is. */
function negoVerifyPill(c, ch){
  const v = window.negoVerifyCached ? negoVerifyCached(c) : null;
  if (!v) return `<span class="nego-st verified" title="${_ne(i18t('ng_recomputing_fp'))}">${i18t('ng_checking')}</span>`;
  /* "Verified in part" is not a hedge, it is the truth about this copy: every
     record it holds was recomputed and matched, and the links across records it
     was never given could not be. It stays GREEN — nothing here suggests
     tampering, and a warning colour would recreate the alarm this replaced. */
  if (v.ok) return `<span class="nego-st verified" data-verify="${v.partial ? 'ok-partial' : 'ok'}" title="${_ne(v.detail)}">${
    v.partial ? 'Verified in part' : 'Verified'}</span>`;
  const isThis = ch && v.failedAt === ch.id;
  return `<span class="nego-st rejected" data-verify="${isThis ? 'failed-here' : 'failed'}" title="${_ne(v.detail)}">${
    isThis ? 'Integrity check failed' : 'Chain unverified'}</span>`;
}

/* What both render paths do once the markup is on the page.

   It lives here rather than inside either of them because it was inside only
   ONE of them: the embedded tab refreshed the verification, the full-window
   room did not, so in the mode the component mostly runs in the pill and the
   status strip sat on "Checking…" for ever. That is the same room-vs-tab
   divergence as the synchronised-highlight bug, and the same fix — one
   function, called by both — rather than a second copy that can drift again.

   Verification hashes, so it cannot run inside a synchronous render. The first
   paint therefore claims nothing, and this repaints the two places that report
   it once the chain has actually been walked. Showing "Verified" first and
   correcting it afterwards would be the same lie the pill was fixed for,
   briefly. */
function negoAfterPaint(c, opts, host){
  if (!host || !window.negoRefreshVerification) return;
  if (window.negoVerifyCached && negoVerifyCached(c)) return;
  negoRefreshVerification(c).then(() => {
    if (!host.isConnected) return;          // the screen moved on while we hashed
    const strip = host.querySelector('#nego-status');
    if (strip) strip.outerHTML = negoStatusHtml(c, opts);
    host.querySelectorAll('[data-nego-card]').forEach(card => {
      const ch = negoChangeById(c, card.getAttribute('data-nego-card'));
      const pill = card.querySelector('.nego-st');
      if (ch && pill) pill.outerHTML = negoVerifyPill(c, ch);
    });
  }).catch(() => {});
}

/* ---------- the pane selectors ----------
   The headers used to be labels: "Original Baseline v0", "Working Version v1".
   They are now the controls that decide what each pane shows, because "what did
   this say before round 2" was a question the screen could not answer.

   Reading the pair back out of the DOM rather than storing it twice: the select
   IS the state as far as the user is concerned, and a second copy is a second
   thing that can be wrong. */
function negoPaneSelectHtml(c, which, current){
  /* The CHOICES, not every record: a version that says word for word what an
     entry above it already says is not a second answer to "which document".
     Both panes' current selections are passed in so neither can be dropped out
     from under a <select> that is showing it — see negoVersionChoices. */
  const pair = negoComparePair();
  const opts = window.negoVersionChoices
    ? negoVersionChoices(c, [pair.left, pair.right, current])
    : (window.negoVersionOptions ? negoVersionOptions(c) : []);
  /* A ROUND THAT IS OVER IS MARKED, and the round in flight is left alone. The
     list spans the whole negotiation now, and every row on it starts with the
     word "Round" — so the reader needs to know which of them are still moving
     without reading each number against the one at the top of the screen. */
  const cur = window.negoRound ? negoRound(c) : null;
  return `<select class="nego-vsel" data-nego-vsel="${which}" aria-label="${which === 'left' ? i18t('ng_pane_left') : i18t('ng_pane_right')}">
    ${opts.map(o => {
      const closed = cur != null && o.roundN != null && o.roundN < cur;
      return `<option value="${_ne(o.key)}" class="${closed ? 'closed' : 'live'}"${
        closed ? ' data-closed="1"' : ''}${o.key === current ? ' selected' : ''}>${_ne(o.label)}</option>`;
    }).join('')}
  </select>`;
}

/* A document rendered as a redline against another version.
   Used only in comparison mode. There are no badges and no decisions here —
   the differences between two old versions were never proposed to anybody, so
   there is nothing to accept. */
function negoCompareDocHtml(c, cmp, whichSide){
  const rows = cmp.rows;
  const title = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name)
    || c.name || 'Contract';
  const v = whichSide === 'left' ? cmp.left : cmp.right;
  const body = rows.map(r => {
    /* The LEFT pane shows the old wording plainly; the right shows the redline,
       so the eye crosses between them the way it does in the live view. */
    if (whichSide === 'left'){
      if (r.state === 'added') return '';
      return `<div class="nego-clause" id="nb-${negoDomId(r.clauseId)}" data-clause="${_ne(r.clauseId)}">
        ${r.label ? `<h2 data-nego-chrome>${_ne(r.label)}</h2>` : ''}<p>${_ne(r.oldText)}</p></div>`;
    }
    if (r.state === 'removed')
      return `<div class="nego-clause" id="nw-${negoDomId(r.clauseId)}" data-clause="${_ne(r.clauseId)}">
        ${r.label ? `<h2 data-nego-chrome>${_ne(r.label)}<span class="nego-note no">${i18t('ng_removed')}</span></h2>` : ''}
        <p><span class="nego-del">${_ne(r.oldText)}</span></p></div>`;
    const note = r.state === 'added' ? `<span class="nego-note ok">${i18t('ng_added')}</span>` : '';
    const inner = r.state === 'same' ? _ne(r.newText)
      : (window.redlineOpsHtml ? redlineOpsHtml(r.ops) : _ne(r.newText));
    return `<div class="nego-clause" id="nw-${negoDomId(r.clauseId)}" data-clause="${_ne(r.clauseId)}">
      ${r.label ? `<h2 data-nego-chrome>${_ne(r.label)}${note}</h2>` : ''}<p>${inner}</p></div>`;
  }).join('');
  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne([c.id, v ? v.label : '', v && v.sub ? v.sub : ''].filter(Boolean).join(' · '))}</div>
    ${body || `<p style="color:var(--n-ink-soft)">${i18t('ng_version_no_wording')}</p>`}
  </article>`;
}

/* ---------- READING THE CONTRACT, NOT THE REDLINE ----------
   The same two panes with every mark taken off: the left says what the round
   started from, the right says what it would say if every change on the table
   were agreed. Struck-through wording is GONE rather than struck; proposed
   wording is simply there. No badges, no fingerprints, no verbs — this is a
   document to read, and a decision taken from a screen that looks like a clean
   contract while the changes are still pending would be a decision taken about
   something that is not true yet.

   The words come from negoCleanBody, which is the same builder that produces
   the agreed document when a change is actually accepted. So what this shows is
   not an approximation of the outcome — it is the outcome. */
function negoCleanDocHtml(c, whichSide){
  const left = whichSide === 'left';
  const body = left ? negoBaseBody(c) : negoCleanBody(c);
  const clauses = window.clauseSegment ? clauseSegment(body || '') : [];
  const title = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name)
    || c.name || 'Contract';
  const open = negoChanges(c).filter(x => x.status === 'pending' && !x.withdrawn).length;
  const meta = [c.id,
    left ? `Round ${negoRound(c)} · the wording as it stands today`
      : `Round ${negoRound(c)} · as it would read with ${open ? `all ${open} open change${open === 1 ? '' : 's'}` : 'every change'} agreed`,
  ].filter(Boolean).join(' · ');
  const rows = clauses.map(cl => {
    const label = negoClauseLabel(cl);
    /* Every clause through the document's own body: there is no redline on this
       screen at all, so there is nothing here that needs the flat projection —
       and a screen whose whole purpose is "read it as a contract" is the last
       place that should show a flattened one. */
    return `<div class="nego-clause" id="${left ? 'nb' : 'nw'}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}">
      ${label ? `<h2 data-nego-chrome>${_ne(label)}</h2>` : ''}${negoRichBody(cl)}</div>`;
  }).join('');
  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne(meta)}</div>
    ${rows || `<p style="color:var(--n-ink-soft)">${i18t('ng_no_wording_yet')}</p>`}
  </article>`;
}
/* The banner for that mode. It says plainly that nothing has been agreed, and
   carries the way back — a mode you can enter and not leave is a trap. */
function negoCleanBarHtml(c){
  if (!_negoClean) return '';
  if (!negoIsLivePair(negoComparePair().left, negoComparePair().right)) return '';
  const open = negoChanges(c).filter(x => x.status === 'pending' && !x.withdrawn).length;
  /* NO BUTTON OF ITS OWN. The way out is the toggle at the top of the working
     pane — the same control that opened the mode, in the place the reader
     pressed to get here. A second one on this bar meant two buttons reading
     "Show changes" on one screen, a few inches apart, doing the same thing;
     and the one further from the document was the more prominent of the two.

     The bar stays, because the sentence on it is the point: this is a
     hypothetical, and nothing has been accepted. */
  return `<div class="nego-cmp-bar clean" id="nego-clean-bar" role="status">
    ${''/* The mode's own name, matching the control that opens it. */}
    <span class="nego-cmp-tag">${i18t('ng_clean_read')}</span>
    <span class="nego-cmp-txt">${open
      ? `Both documents read clean: removed wording is out, proposed wording is in. <b>${i18t('ng_nothing_accepted')}</b> — ${open} change${open === 1 ? ' is' : 's are'} still open and this is only what the contract would say if ${open === 1 ? 'it were' : 'they were all'} agreed.`
      : 'Both documents read clean. Every change on the table has already been decided, so this is the wording as it stands.'}</span>
  </div>`;
}

/* The banner that says you are reading history. It carries the way back,
   because a mode you can enter and not leave is a trap. */
/* Shown only when the panes are not the live pair. */
function negoCompareBarHtml(c){
  const pair = negoComparePair();
  if (negoIsLivePair(pair.left, pair.right)) return '';
  const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
  return cmp ? negoCompareBannerHtml(cmp) : '';
}
function negoCompareBannerHtml(cmp){
  return `<div class="nego-cmp-bar" id="nego-cmp-bar">
    <span class="nego-cmp-tag">${i18t('ng_comparing_versions')}</span>
    <span class="nego-cmp-txt">${_ne(cmp.summary)}. This is a read-only look back — these differences were never proposed, so there is nothing here to accept or reject.</span>
    <button class="nego-cmp-exit" id="nego-cmp-exit">${i18t('ng_back_to_live')}</button>
  </div>`;
}

/* ---------- the status strip ----------
   Every field is read from the product rather than typed in: emailOff() and
   counterpartySeenState() already own their answers elsewhere in the app, and a
   strip that agreed with them only by coincidence would be worse than none. */
function negoStatusHtml(c, opts){
  const p = negoProgress(c);
  const theirs = (opts.side === 'counterparty');
  /* Two segments are ours and not theirs. "Email: Not Configured" is our
     server's setup, and "Last seen" is us watching THEM — showing a reader a
     record of their own opening times is both odd and none of their business.
     The negotiation facts stay on both sides. */
  const seen = (!theirs && window.counterpartySeenState ? counterpartySeenState(c, opts.shares || []) : null);
  const off = !theirs && !!(window.emailOff && window.emailOff());
  const seenLine = seen
    ? (seen.kind === 'responded' ? 'Counterparty: responded'
      : seen.kind === 'opened' ? 'Last seen: opened the current wording'
      : 'Last seen: not opened yet')
    : 'Last seen: not shared yet';
  return `
    <div class="nego-status" id="nego-status">
      ${theirs ? '' : `<div class="seg"><span class="dot ${off ? 'warn' : 'ok'}"></span>Email: ${off ? 'Not Configured' : 'Configured'}${off ? ` <span style="opacity:.65">${i18t('ng_sharing_limits')}</span>` : ''}</div>`}
      ${theirs ? '' : `<div class="seg"><span class="dot ${seen && seen.kind !== 'unopened' ? 'ok' : 'warn'}"></span>${_ne(seenLine)}</div>`}
      <div class="seg">${i18t('ng_negotiation_round',{n:negoRound(c)})}</div>
      <div class="seg" id="nego-resolved">Resolved: ${p.done} / ${p.total}</div>
      ${negoIntegritySeg(c)}
      <span class="spacer"></span>
      <span class="seg" style="font-family:var(--n-font-mono);font-size:var(--t-label);opacity:.6">${_ne(String(opts.side === 'counterparty' ? 'counterparty view' : 'owner view'))} · fingerprinted redline</span>
    </div>`;
}

/* The whole history in one line, on the strip both sides read. Named, not a
   tick: "Integrity check failed" that does not say WHICH change failed is not
   an actionable statement about a legal document. */
function negoIntegritySeg(c){
  const v = window.negoVerifyCached ? negoVerifyCached(c) : null;
  if (!v) return `<div class="seg" id="nego-integrity"><span class="dot warn"></span>${i18t('ng_fingerprints_checking')}</div>`;
  if (v.ok) return `<div class="seg" id="nego-integrity" title="${_ne(v.detail)}"><span class="dot ok"></span>Fingerprints: ${v.checked} verified${
    v.partial ? ' in part — this copy does not carry every earlier draft' : ''}</div>`;
  return `<div class="seg" id="nego-integrity" title="${_ne(v.detail)}"><span class="dot warn"></span>${i18t('ng_integrity_failed_at',{at:_ne('#' + (v.failedAt || 'unknown'))})}</div>`;
}

/* ---------- the header strip ----------
   Only the contract-specific actions from the prototype's top bar. Brand,
   breadcrumbs and avatar are page chrome the workspace (or the portal) already
   provides, and repeating them would put two headers on one screen. */
function negoHeadHtml(c, opts){
  const p = negoProgress(c);
  /* ALIGNMENT, not "every change has an answer". negoReadyToSign asks whether
     the ROUND is finished, which a refused ask satisfies. This banner says
     "nothing is outstanding between the parties", which a refused ask does not
     — so gating it on the weaker question had it announce agreement over a live
     disagreement, which is the class of untruth this screen exists to remove.
     A refusal clears when the side that asked withdraws it. */
  const ready = negoProgress(c).total > 0
    && (window.negoAlignment ? negoAlignment(c).aligned : negoReadyToSign(c));
  const canAct = !opts.readonly && !rlActorHeld(c, opts);   /* see rlActorHeld */
  const side = opts.side || 'owner';
  return `
    ${negoModeHtml(c, opts)}
    <div style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;
      background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--radius);box-shadow:var(--shadow-sm)">
      <span style="font-size:var(--t-body);font-weight:var(--w-title);color:var(--n-ink)">${i18t('ng_negotiation')}</span>
      <span class="nego-ver">${i18t('ng_round_n',{n:negoRound(c)})}</span>
      <span style="font-size:var(--t-meta);color:var(--n-ink-soft);min-width:0;flex:1">
        ${p.total
          ? `${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved — every change carries its own fingerprint.`
          : 'No changes on the table yet. Propose wording and each change becomes a fingerprint on this list.'}
      </span>
      ${''/* THE PAIR THE LIVE PAGE REALLY DRAWS, and it had the fault twice:
             it HID them when nothing was pending, and left them lit whenever
             anything was — including a round where nothing was theirs to
             reject or nothing was clear to accept. Same one reading as the
             other two surfaces; drawn and greyed rather than hidden, so the
             reader can see what would be there and read why it is not. */}
      ${canAct ? (() => { const bs = negoBulkState(c, side, canAct); return `
        <button id="nego-all-acc" class="ui-btn"${bs.acc.ok ? '' : ' disabled aria-disabled="true"'}
          title="${_ne(bs.acc.why || i18t('ng_accept_nonrisk_title'))}" style="flex:none;font-size:var(--t-meta);padding:5px 11px;border-color:var(--st-green-fg);color:var(--st-green-fg)">${i18t('ng_accept_all_nonrisk')}</button>
        <button id="nego-all-rej" class="ui-btn"${bs.rej.ok ? '' : ' disabled aria-disabled="true"'}
          title="${_ne(bs.rej.why || i18t('ng_reject_all_title'))}" style="flex:none;font-size:var(--t-meta);padding:5px 11px;border-color:var(--st-ruby-dot);color:var(--st-ruby-dot)">${i18t('ng_reject_all_cp')}</button>`; })() : ''}
      ${side === 'owner' ? `<button id="nego-export" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:5px 11px"
        title="${p.pending ? 'Pending changes must be resolved first' : 'Export the agreed wording'}"${p.pending ? ' disabled' : ''}>${i18t('ng_export_clean_pdf')}</button>` : ''}
    </div>
    ${ready ? negoReadyHtml(c, opts) : ''}`;
}

/* ---------- the one transition out ----------
   Every change on the table has an answer, so the negotiation is done and the
   contract is ready for signature. What is built here is the TRANSITION POINT
   and nothing else: it names the hand-off and moves the reader to the tab that
   owns signing. No signing logic lives here, by design — see SUMMARY.md. */
function negoReadyHtml(c, opts){
  const side = opts.side || 'owner';
  const p = negoProgress(c);
  const accepted = negoChanges(c).filter(x => x.status === 'accepted').length;
  const withdrawn = negoChanges(c).filter(x => x.withdrawn).length;
  return `
    <div id="nego-ready" style="flex:none;display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap;
      border:1px solid var(--st-green-line);background:var(--st-green-bg);border-left:4px solid var(--st-green-fg);border-radius:var(--radius);
      padding:var(--s-3) var(--s-4);box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-green-fg);color:#fff;font-size:var(--t-card);font-weight:var(--w-title)" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:var(--t-card);font-weight:var(--w-strong);color:var(--st-green-fg)">${i18t('ng_ready_every_resolved')}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--n-ink-soft);margin-top:1px">All ${p.total} change${p.total === 1 ? '' : 's'} on the table ${p.total === 1 ? 'has' : 'have'} an answer${accepted ? ` · ${accepted} adopted into the wording` : ''}${withdrawn ? ` · ${withdrawn} ask${withdrawn === 1 ? '' : 's'} withdrawn` : ''}. Nothing is outstanding between the parties.</span>
      </span>
      ${side === 'owner'
        ? `<button id="nego-to-docs" class="ui-btn ui-btn-primary nego-go" style="flex:none">${i18t('ng_send_to_docs')}</button>`
        : `<span style="flex:none;font-size:var(--t-meta);color:var(--n-ink-soft)">${i18t('ng_will_send_signature',{who:_ne(window.FIRST_PARTY || i18t('ng_other_side'))})}</span>`}
    </div>`;
}

/* ---------- ONE BANNER AT A TIME ----------
   Four of these could be on the screen at once: the readiness signal, "every
   change is resolved", whose turn it is, and the comparison bar. They were
   rendered unconditionally, one after another, so a contract could carry a
   stack of notices that between them said three different things about where it
   stood — and on an EXECUTED contract two of them were simply false, still
   inviting the reader to propose changes and to issue a signing link for a deal
   that had already been signed.

   They are not four notices. They are one question — where does this stand? —
   with one answer at a time, and the answers have a natural order because each
   supersedes the one below it:

     executed        the deal is done; nothing about turns or readiness applies
     declined        likewise, in the other direction
     comparing       you are reading history, not the live round
     signalled       somebody has said they are ready; the next act is named
     aligned         everything is settled but nobody has said so yet
     otherwise       whose move it is

   The compare bar is left to render on its own because it is a MODE with its
   own way out, not a notice — but while it is up the rest are suppressed, since
   they describe a round you are not currently looking at. */
/* WHO ARE WE NEGOTIATING WITH — ASKED WHERE THEY ARE ALREADY NAMED.

   This used to be a strip across the top of the negotiation: "Negotiating with
   X? Add their email and changes go straight to them", a field and a Save. It
   was the last banner standing between the top of the page and the first word
   of the contract, and it was asking a KEY TERM in the middle of a working
   surface — the counterparty's name is a row on Key terms, and their address
   was the one fact about them that lived somewhere else.

   It is a Key terms row now (see ktTermsRowsHtml, "Their email"), which is
   also where it is read back from. Nothing else changed: the wizard and the
   upload form still ask at creation, so most contracts never lack it; a
   contract that does still sends, the dialog just collects the address at that
   moment. The negotiation page carries no banner about it at all.

   negoCounterpartySetupHtml is deliberately gone rather than left returning
   nothing — a builder nobody calls is a place for a future reader to reinstate
   the banner by accident. */
function negoRoomBannerHtml(c, opts = {}, ready){
  const comparing = !negoIsLivePair(negoComparePair().left, negoComparePair().right);
  if (comparing) return '';
  const status = String(c.status || '');
  if (status === 'Signed' || status === 'Declined') return negoClosedBannerHtml(c, opts);
  const signal = negoReadySignalHtml(c, opts);
  if (signal) return signal;
  if (ready) return negoReadyHtml(c, opts);
  return `<div style="padding:0 14px">${negoTurnBannerHtml(c, opts)}</div>`;
}
/* An executed or declined contract is not a negotiation. Saying so once, in the
   slot the turn banner used, is the whole of it — the alternative was a signed
   contract telling its owner it was their turn to propose changes. */
function negoClosedBannerHtml(c, opts = {}){
  const signed = String(c.status || '') === 'Signed';
  const when = (window.contractSignedLabel?contractSignedLabel(c):c.signedAt) || (c.negotiation && c.negotiation.turnAt) || '';
  return `<div class="nego-closed" id="nego-closed" data-state="${signed ? 'signed' : 'declined'}" role="status">
    <span class="tick" aria-hidden="true">${signed ? '✓' : '✕'}</span>
    <span class="body"><b>${signed ? 'This contract is executed and sealed.' : 'This contract was declined.'}</b>
      ${signed
        ? `The wording is final and read-only${when ? ` — ${_ne(String(when))}` : ''}. Record an amendment if it has to change.`
        : 'The negotiation is closed. Nothing here can be proposed or decided.'}</span>
  </div>`;
}

/* ---------- somebody has said they are ready ----------
   The first of the three places the owner meets this: in the room, at the top,
   where the negotiation they were reading is.

   It reports a SIGNAL, and says so — "signalled", "nothing is signed yet", and
   the next step named as an action the owner takes. A banner that said "ready
   to sign" with a green tick and no verb would read as a state the contract had
   arrived at by itself, which is exactly the inference this whole change
   removes.

   Both directions. The counterparty sees ours too, because a reader who cannot
   tell whether the other side has answered cannot tell waiting from finished. */
function negoReadySignalHtml(c, opts = {}){
  if (!window.negoReadySignal) return '';
  const me = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const them = me === 'owner' ? 'counterparty' : 'owner';
  const theirs = negoReadySignal(c, them);
  const mine = negoReadySignal(c, me);
  if (!theirs && !mine) return '';
  const when = at => (at && window.fmtDT ? fmtDT(at) : String(at || ''));
  const rows = [];
  if (theirs) rows.push(`<span class="row" data-ready="them"><b>${_ne(theirs.by)}</b> signalled
    ${''/* "they are", never the organisation's name again. It read "Young
           Mbagaya signalled Young Mbagaya is ready to sign" — the signer and
           the party they sign for are usually the same words, and repeating
           them turns a fact into a stutter. */}
    they are ready to sign — ${_ne(when(theirs.at))}. <b>${i18t('ng_nothing_signed')}</b>
    ${theirs.stale
      ? 'Something has been reopened since, so this no longer describes where the deal stands — settle it and the signal counts again.'
      : me === 'owner'
        ? 'Issue a signing link to take it forward; this negotiation link is superseded the moment you do.'
        : `${_ne(window.FIRST_PARTY || 'They')} will send a signing link.`}</span>`);
  /* What the reader's OWN signal means for them next, said plainly. "You
     signalled" on its own leaves the obvious question — and then what? —
     unanswered, and the answer is different on each side: the owner issues the
     signing link, the counterparty waits for it. */
  if (mine){
    const other = me === 'owner' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'the other side');
    rows.push(`<span class="row" data-ready="me">You signalled ready to sign on
      ${_ne(when(mine.at))}${theirs ? '' : `, and ${_ne(other)} has not yet`}.
      ${theirs || me === 'owner' ? '' : `${_ne(other)} will send a signing link when they are ready — nothing is signed until you open it.`}</span>`);
  }
  const both = !!(theirs && mine);
  const stale = !!((theirs && theirs.stale) || (mine && mine.stale));
  return `<div class="nego-readysig${both ? ' both' : ''}${stale ? ' stale' : ''}" id="nego-ready-signal"
      data-ready-side="${theirs ? them : me}" role="status">
    <span class="tick" aria-hidden="true">${both ? '✓✓' : '✓'}</span>
    <span class="body">${rows.join('')}</span>
    ${theirs && !theirs.stale && me === 'owner' && !opts.readonly
      ? `<button class="nego-tbtn acc" id="nego-issue-signing">${i18t('ng_issue_signing_link')}</button>` : ''}
  </div>`;
}

/* ---------- 2.4: whose turn it is ----------
   Both sides read the same banner, built from the same record. A negotiation
   where neither party can tell whether they are waiting or being waited on is
   how a fortnight goes past with the document sitting in someone's inbox.

   Every field is a READ — the turn, the pending count, the time it was sent —
   so the banner can never claim a state the change set does not support. */
function negoTurnBannerHtml(c, opts){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const b = window.negoTurnBanner ? negoTurnBanner(c, side) : null;
  if (!b) return '';
  const sent = c.negotiation && c.negotiation.turnAt;
  const when = sent && window.fmtDT ? fmtDT(sent) : null;
  const mine = b.mine;
  /* ASKED DIRECTLY, not read off the banner's own summary. negoTurnBanner
     returns unsent:0 whenever it is your turn — right for the sentence it
     writes, wrong for deciding whether the postbox already has this covered. So
     on your own turn with an ask you had not sent, BOTH rendered, both carrying
     id="nego-send" — and the wiring, which takes the first match, bound the
     banner's. The button in the index was the one on screen beside the work,
     and it was the one with no handler on it: pressing it did nothing at all. */
  const heldHere = (side === 'owner' && window.negoUnsentAsks)
    ? negoUnsentAsks(c, 'owner').length : (b.unsent || 0);
  return `<div class="nego-turn" id="nego-turn" data-turn="${mine ? 'mine' : 'theirs'}"
      style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:var(--radius);padding:9px 14px;
      border:1px solid ${mine ? 'var(--st-green-line)' : 'var(--n-line)'};background:${mine ? 'var(--st-green-bg)' : 'var(--n-badge-bg)'};
      border-left:4px solid ${mine ? 'var(--n-accept)' : 'var(--n-slate-soft)'}">
    <span style="flex:1;min-width:200px;font-size:var(--t-body);font-weight:var(--w-strong);color:${mine ? 'var(--st-green-fg)' : 'var(--n-ink)'}">
      ${_ne(b.text)}${!mine && when ? ` <span style="font-weight:var(--w-body);color:var(--n-ink-soft)">— sent ${_ne(when)}</span>` : ''}</span>
    ${''/* THE BUTTON THAT DID NOTHING, and only ever could have done nothing.

           "Send to <the owner>" was rendered on both sides of the banner and
           wired, on both sides, to the OWNER's share route — it opened the
           share dialog, which mints a new link to a contract. A counterparty
           holding a link cannot mint links to somebody else's contract, so on
           their side the press either opened a dialog they could not complete
           or, on their page, silently found nothing to open.

           Their answers do not travel by minting a link. They travel on the
           response route, from the send that sits in the change index beside
           the decisions it carries. So the banner's send is the owner's, and
           theirs is where their work is. */}
    ${''/* AND WHEN IT IS NOT OUR TURN BUT WE ARE HOLDING SOMETHING UNSENT.

           Rendered on `mine` alone, this was the counterparty's old dead end
           moved to our side of the glass: propose a change after handing over
           and it sat in the index, pending, with nothing anywhere in the room
           that would send it. The rule the counterparty's postbox already
           follows is the right one — offer the send where there is something to
           send. Whose turn it is decides what the banner SAYS. */}
    ${''/* AND IT FLASHES WHILE SOMETHING IS WAITING, the way the counterparty's
           postbox does. Theirs pulses under a line reading "nothing has reached
           them yet", so a held answer is impossible to walk past; ours sat
           still, in a bar at the top, and an ask we had filed and not sent
           looked exactly like an ask we had sent. Same signal, both sides.

           The pulse is on unsent work only — not on the ordinary "your turn"
           send, where nothing is being held and a blinking control would just
           be noise. */}
    ${''/* Only when the postbox is NOT up. With unsent asks the send belongs in
           the index beside them; with none, this is the way to hand the
           contract back unchanged, and there is nowhere else for it. */}
    ${''/* And not while the reader is somebody's reviewer here: a door that
           opens onto a refusal is worse than no door. */}
    ${mine && !heldHere && !opts.readonly && side === 'owner' && !rlActorHeld(c, opts)
      ? `<button id="nego-send" class="ui-btn ui-btn-primary nego-go" style="flex:none">${i18t('ng_send_to_who',{who:_ne(c.counterparty || i18t('ng_the_counterparty'))})}</button>`
      : ''}
  </div>`;
}

/* ---------- the whole tab ---------- */
/* ---------- the workbench ----------
   The three panes and the two dividers between them, shared by the room and by
   the embedded mode so there is exactly one of these to get right. Labels are
   the prototype's own words. */
/* THE POSTBOX FOR PER-CHANGE ANSWERS, and it belongs in the index.

   A decision is taken on one card at a time; the send is what puts the batch of
   them in the post. It sat in the top bar, beside verbs about the whole deal,
   which made it read as a third answer to the deal — and put it next to a
   SECOND send ("Send to …", the owner's share route, which on the
   counterparty's link tried to mint a share link they cannot mint and silently
   did nothing at all). One send, in the place the thing it sends is made.

   Rendered only where there is something to send. A button that is always there
   and usually does nothing teaches people to ignore it. */
function negoIndexSendHtml(c, opts = {}){
  const me = opts.side || 'owner';
  if (opts.readonly) return '';
  /* THE OWNER'S POSTBOX, in the index, where the work is.

     Their side has always had this: file an answer and the send appears
     directly under it, flashing, over a line saying nothing has reached anybody
     yet. Ours was a button in a bar at the top — the same act, a screen away
     from the thing it acts on, and it kept being asked for because it kept not
     being found. One send, both sides, in the same place. The turn banner keeps
     its own send for the case this one does not cover: handing the contract
     back with nothing of ours outstanding. */
  if (me === 'owner'){
    const total = window.negoUnsentAsks ? negoUnsentAsks(c, 'owner').length : 0;
    /* What is HELD comes off the count for the same reason it comes off the
       toolbar's: this button publishes, and it must not offer to publish
       something the reviewer has stopped. Where everything is held the postbox
       says so rather than disappearing — a send that vanishes leaves the reader
       looking for the button rather than reading the reason. */
    const heldN = window.reviewHeldIds ? reviewHeldIds(c).size : 0;
    const waitN = window.reviewAwaiting ? reviewAwaiting(c).length : 0;
    const n = Math.max(0, total - heldN - waitN);
    const them = _ne(String(c.counterparty || 'the counterparty'));
    /* AND NOT WHILE THE READER IS A REVIEWER HERE. Same reasoning as the held
       count above, one step further out: this button publishes, and a person
       who has accepted a review does not publish on this contract until they
       have handed it back. Says why rather than vanishing, for the reason the
       comment above gives. */
    /* rlActorHeld now answers for TWO postures — mid-review, and not the lead of
       this negotiation — so the sentence has to be fetched from whichever one is
       true. Asking only the review would have printed nothing at all for a
       contributor: the button would vanish with no explanation, which is the
       exact failure the comment above says this branch exists to avoid. */
    if (rlActorHeld(c, opts)){
      let why = null;
      if (window.deskSendBlock){ try{ why = deskSendBlock(c); }catch(_){ why = null; } }
      if (!why && window.reviewActorBlockMessage){
        try{ why = reviewActorBlockMessage(c); }catch(_){ why = null; }
      }
      return why ? `<div class="nego-index-send"><span class="why">${_ne(why)}</span></div>` : '';
    }
    if (!n){
      if (waitN) return `<div class="nego-index-send">
        <span class="why">${_ne(i18tn('rv_all_waiting_note', waitN, { n: waitN }))}</span></div>`;
      return heldN ? `<div class="nego-index-send">
        <span class="why">${_ne(i18tn('rv_all_held_note', heldN, { n: heldN }))}</span>
      </div>` : '';
    }
    /* THE ONE SEND, WHERE THE DRAFTS ARE. This button used to have a flashing
       proxy in the page header ("Send All"), which crowded the toolbar until
       the contract dropdown clipped mid-word — two copies of one act. The
       proxy is gone and its identity moved HERE, onto the engine's own
       control at the head of the Tracked Changes column: same words, same
       count, same blast styling, beside the cards it publishes. */
    return `<div class="nego-index-send">
      <button id="nego-send" data-rl-blast class="nego-pulse rl-btn-blast"
        title="${i18t('ng_publish_all_title',{who:them})}">&#9889; ${i18tn('ng_send_all',n,{n})}</button>
      <span class="why">${i18t('ng_held_until_send',{who:them})}</span>
    </div>`;
  }
  if (me !== 'counterparty') return '';
  /* No preview branch here any more: Counterparty View mounts read-only, so
     this builder returns '' for it at the top, and the column's explanation is
     the readonlyWhy line — one voice, not two. The old text here claimed the
     preview could enter changes on their behalf, which stopped being true when
     the view became a window (see renderRedline's mount). */
  const n = opts.pendingDecisions || 0;
  /* WORDING THEY HAVE ASKED FOR COUNTS TOO, and leaving it out was a dead end
     with no bottom. This postbox counted decisions only — answers to the
     owner's asks — so a counterparty who pressed Change on a clause, wrote what
     they wanted and saved it got a fingerprinted change in the index and NO
     SEND ANYWHERE ON THE SCREEN. The one act the room exists for could not
     leave the browser. */
  const pr = opts.pendingProposals || 0;
  if (!n && !pr) return '';
  const parts = [];
  if (pr) parts.push(`${pr} change${pr === 1 ? '' : 's'} you have asked for`);
  if (n) parts.push(`${n} decision${n === 1 ? '' : 's'}`);
  const who = _ne(String(opts.org || window.FIRST_PARTY || 'the other side'));
  return `<div class="nego-index-send">
    <button id="nego-send-decisions" class="nego-pulse">${i18t('ng_send_parts_to',{what:parts.join(i18t('ng_and')),who})}</button>
    <span class="why">${i18t('ng_held_until_send',{who})}</span>
  </div>`;
}
function negoPanesHtml(c, opts = {}){
  const p = negoProgress(c);
  const canAct = !opts.readonly && !rlActorHeld(c, opts);   /* see rlActorHeld */
  /* Which chair. Same reason as redlinePanesHtml: this markup is shared, and
     the risk-derived bulk verb is the owner's alone (D2). */
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const L = negoLayout();
  const pair = negoComparePair();
  const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
  const comparing = !!(cmp && !cmp.live);
  /* Comparing two old versions wins over reading clean: a hypothetical outcome
     of the LIVE round says nothing about a pair of snapshots from before it. */
  const clean = _negoClean && !comparing;
  return `<div class="nego-work${L.idxOff ? ' idx-off' : ''}" id="nego-work"
      style="--nego-f:${L.f};--nego-c:${L.c}px">

    <section class="nego-pane baseline" aria-label="${i18t('ng_original_baseline')}">
      <div class="nego-pane-head">${negoPaneSelectHtml(c, 'left', pair.left)}<span class="nego-sub">${
        clean ? 'clean — no marks' : 'read-only reference'}</span></div>
      <div class="nego-scroll" id="nego-scroll-base">${comparing
        ? negoCompareDocHtml(c, cmp, 'left')
        : clean ? negoCleanDocHtml(c, 'left')
        : negoDocHtml(c, { ...opts, baseline: true })}</div>
    </section>

    <div class="nego-rz nego-rz-a" id="nego-rz-a" role="separator" aria-orientation="vertical"
      aria-label="${i18t('ng_drag_resize_panes')}"
      title="${i18t('ng_drag_resize')}"></div>

    <section class="nego-pane working" aria-label="${i18t('ng_working_version')}">
      ${''/* THE PANE SAYS WHAT IT IS FOR BEFORE ANYTHING IS IN IT.

             "Proposed Redline · fingerprints anchor in the margin" describes a
             pane that already has changes in it. On an empty round it described
             nothing the reader could see, and the one act this whole screen
             exists for — asking for different wording — had no words anywhere
             naming the control that performs it. Someone sent a contract to
             negotiate met two verbs, Decline and Ready to sign, and no third
             option. */}
      <div class="nego-pane-head">${negoPaneSelectHtml(c, 'right', pair.right)}<span class="nego-sub">${comparing
        ? '— read-only comparison'
        : clean ? '— as it would read with every change agreed'
        : (canAct && !p.total) ? '— press Change on any clause to ask for different wording'
        : '— Proposed Redline · fingerprints anchor in the margin'}</span>
        ${''/* THE QUESTION THE REDLINE CANNOT ANSWER.

               Both panes are marked up — struck-through wording, inserted
               wording, a fingerprint against each — which is what deciding a
               change needs and the opposite of what READING the contract
               needs. "What does this actually say if we agree to all of it"
               had no answer on this screen short of accepting everything to
               find out, which is a decision rather than a look. One press,
               and it is a view: nothing is accepted and nothing is written. */}
        ${''/* "Clean Read", not "Read as agreed". The old label described the
                ARRANGEMENT rather than the view, and on a screen where the one
                thing at stake is what has and has not been agreed, a control
                that says "agreed" is the wrong word to have to read twice. It
                names what it shows: a clean document. The banner it opens still
                says in full that nothing has been accepted.

                And "Show changes", not "Show the redline" — the way back is
                the same act on the other side of the switch, and "changes" is
                the word this screen uses for them everywhere else. */}
        ${comparing ? '' : `<button class="nego-clean-btn" id="nego-clean-toggle" type="button"
          aria-pressed="${clean ? 'true' : 'false'}"
          title="${clean
            ? 'Put the change marks back'
            : 'Read both documents clean — removed wording out, proposed wording in. Nothing is accepted.'}">${
          clean ? 'Show changes' : 'Clean Read'}</button>`}</div>
      <div class="nego-scroll" id="nego-scroll-work">${comparing
        ? negoCompareDocHtml(c, cmp, 'right')
        : clean ? negoCleanDocHtml(c, 'right')
        : negoDocHtml(c, { ...opts, baseline: false })}</div>
    </section>

    <div class="nego-rz nego-rz-b" id="nego-rz-b" role="separator" aria-orientation="vertical"
      aria-label="${i18t('ng_drag_resize_index')}"
      title="${i18t('ng_drag_resize')}"></div>

    <aside class="nego-pane index" id="nego-index" aria-label="${i18t('ng_fingerprinted_index')}">
      <div class="nego-index-head">
        <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:9px">
          <h3 style="font-size:var(--t-body);font-weight:var(--w-title);margin:0;flex:1;min-width:0">${i18t('ng_change_index')}</h3>
          <span class="nego-count" id="nego-count">${cmp && !cmp.live ? cmp.moved : (p.pending || p.total)}</span>
          <button class="nego-fold" id="nego-fold" title="${i18t('ng_fold_index')}">${i18t('ng_hide')}</button>
        </div>
        ${cmp && !cmp.live ? `
        <div style="font-size:var(--t-label);color:var(--n-ink-soft)" id="nego-progress">${i18t('ng_readonly_comparison')}</div>`
        : `
        <div class="nego-track"><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
        <div style="font-size:var(--t-label);color:var(--n-ink-soft)" id="nego-progress">${i18tn('ng_resolved',p.total,{done:p.done,total:p.total})}</div>
        ${''/* ---- WHOSE PLAYBOOK, AND WHOSE COUNTERPARTY ----
               D2. "Accept All Non-Risk" sorts by OUR playbook and OUR scan
               signals. Offering it to the other side both hands them a verb
               they cannot reason about and tells them how we score their asks
               — the playbook is our negotiating position, and this button is a
               readout of it. Owner only.

               "Reject All Counterparty" was worse than useless from their
               seat: read from their chair, "counterparty" means US. The verbs
               are named from the reader's chair on each side; the ACT is
               identical either way, and unchanged — both only ever touch the
               other side's pending asks.

               The capability stays, and so does the ID. What differs by side is
               the LABEL and what the button claims to do, not the DOM contract —
               changing the id would have broken every page and test that reaches
               for the bulk verbs by name, to express a difference the label
               already carries. "I agree to all of it" is a real and common
               answer, and withholding the button would not withhold the
               decision, only make them press Accept six times to say it. */}
        ${canAct ? (() => {
          const bs = negoBulkState(c, side, canAct);   /* see negoBulkState */
          const accWhy = bs.acc.why || (side === 'owner'
            ? 'Accepts only the pending changes that trip no playbook, scan or review signal'
            : `Accepts every change ${negoOtherSideName(opts)} has proposed. Your own asks are untouched.`);
          const rejWhy = bs.rej.why || i18t('ng_reject_all_who_title',{who:negoOtherSideName(opts)});
          return `<div class="nego-bulk">
          <button class="b-acc" id="nego-bulk-acc"${bs.acc.ok ? '' : ' disabled aria-disabled="true"'}
            title="${_ne(accWhy)}"
            >${side === 'owner' ? 'Accept All Non-Risk' : 'Accept all'}</button>
          <button class="b-rej" id="nego-bulk-rej"${bs.rej.ok ? '' : ' disabled aria-disabled="true"'}
            title="${_ne(rejWhy)}">${side === 'owner' ? i18t('ng_reject_all_cp2') : i18t('ng_reject_all2')}</button>
        </div>`; })() : ''}
        ${negoIndexSendHtml(c, opts)}`}
      </div>
      <div class="nego-index-scroll" id="nego-cards">${negoLinkedBarHtml()}${negoCardsHtml(c, opts)}</div>
    </aside>

    <button id="nego-drawer" aria-label="${i18t('ng_toggle_index')}">CHG</button>
  </div>
  ${L.idxOff ? `<button class="nego-fold" id="nego-unfold"
      style="position:absolute;right:14px;top:64px;z-index:8"
      title="${i18t('ng_bring_index_back')}">${i18t('ng_show_index_n',{n:p.pending || p.total})}</button>` : ''}`;
}

/* Embedded mode: the panes with the summary strip above and the status strip
   below, mounted inside somebody else's page. Kept because it is a smaller
   thing to reason about than the room, and every pane-level test drives it. */
function negoTabHtml(c, opts = {}){
  negoInit(c);
  return `<div id="nego-root">
    ${negoHeadHtml(c, opts)}
    ${''/* THE REVIEW BANNER AND THE DESK BAND HAVE LEFT THIS SLOT TOO. They
           were the first thing above the work here, exactly as they were on the
           workbench before it moved them — and the rule is the page's, not one
           screen's: nothing draws as a full-width band across the top of the
           contract (Young, 12 Aug 2026). They float bottom-right now, from the
           same builder and the same stack the workbench uses. */}
    ${negoTurnBannerHtml(c, opts)}
    ${negoCompareBarHtml(c)}
    ${negoCleanBarHtml(c)}
    ${''/* IN FLOW AND ABOVE THE WORK, not floating over its corner (owner-asked
           23 Aug 2026). It was last in this builder and position:fixed; it is
           first and in the column now, so a notice pushes the columns down by
           its own height rather than covering them. It draws nothing at all on
           an ordinary negotiation — a reading you have not changed and a desk
           that is not holding you produce no cards — so the space it takes is
           the space it needs. */}
    ${window.rlFloatingNoticesHtml ? rlFloatingNoticesHtml(c, opts) : ''}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;position:relative">
      ${negoPanesHtml(c, opts)}
      ${negoStatusHtml(c, opts)}
    </div>
  </div>`;
}

/* ---------- the room ----------
   prototype.html's own chrome: brand, breadcrumb, the contract's actions, the
   workbench, the status bar. The one addition is the way out, and it is the
   breadcrumb rather than a new button — "Doc ›" already reads as where you came
   from, so making it the exit says the same thing with one control instead of
   two. */
/* WHO IS ANSWERING, asked in the room.

   Their name gated every send, and the field it was read from lived on the page
   UNDERNEATH the full-window room. Once the room became the page they were sent
   rather than a mode they entered, that field was unreachable — so the very
   first line of the send ("Enter your full name") failed a check against a box
   nobody could see or fill, and the button did nothing, forever, with no
   explanation. The field belongs where the sending happens.

   Prefilled from the share's recipient where the sender addressed it to a
   person, and still theirs to correct: the sender's address book is not
   evidence of who is actually at the keyboard. */
/* ---------- THE NAME THIS BROWSER HAS ALREADY GIVEN ----------
   The box asks who is at the keyboard, and it asked again on every refresh:
   a counterparty working through a round of changes typed their own name back
   in each time the page reloaded, to answer a question they had already
   answered. Kept per browser, because that is the scope of the fact — one
   person, at one keyboard, whose name does not change between visits.

   NOT the same thing as filling the box with an organisation. The rule this
   sits beside still holds: opts.by is refused as a seed because it falls back
   to the counterparty COMPANY, and a company is not who signed. This is the
   reader's own previous answer, given by them, in this box. */
const NEGO_NAME_KEY = 'hati.v1.responderName';
function negoRememberedName(){
  try { return String(localStorage.getItem(NEGO_NAME_KEY) || '').trim(); }
  catch(e){ return ''; }
}
function negoRememberName(v){
  const s = String(v == null ? '' : v).trim();
  try { if (s) localStorage.setItem(NEGO_NAME_KEY, s); else localStorage.removeItem(NEGO_NAME_KEY); }
  catch(e){}
}
/* ONE LISTENER, ON THE DOCUMENT. The box is drawn in more places than any one
   host can see: the room's own top bar (negoRoomHtml), the workbench, and the
   portal's respond panel underneath it — and on the counterparty's seat it sits
   OUTSIDE the pane mount, which is why a host-scoped listener saved nothing
   there. Delegated and installed once, so every mount is covered and a repaint
   cannot stack a second copy.

   focusout as well as change: a reader who types their name and presses Send
   without leaving the field never fires change in some browsers, and losing
   the name at the exact moment they used it is the whole complaint. */
function negoWireNameMemory(){
  if (typeof document === 'undefined' || document._negoNameWired) return;
  document._negoNameWired = true;
  const keep = e => {
    const t = e && e.target;
    if (t && (t.id === 'nego-cp-name' || t.id === 'pt-name')) negoRememberName(t.value);
  };
  document.addEventListener('change', keep, true);
  document.addEventListener('focusout', keep, true);
}

function negoNameFieldHtml(opts = {}){
  /* ONLY from the share's recipient. Not from opts.by, which falls back to the
     counterparty ORGANISATION when nobody is named — filling this box with
     "Nordfrakt Logistik AB" would file a company as the person who answered,
     and would do it silently because the box would look already-filled. An
     empty box asks the question; a wrong one answers it.

     The share's name still wins where there is one: that is who the sender
     addressed this to. The remembered name is the fallback under it. */
  const v = String(opts.recipientName || '').trim() || negoRememberedName();
  /* INSTALLED WHERE THE BOX IS DRAWN. A side effect in a render function is
     not free, and it is here deliberately: this is the ONLY point every mount
     of this box passes through. Hanging the listener off a wiring pass instead
     missed the counterparty's seat, where the box sits in the room's top bar
     rather than inside the pane host that pass is scoped to — which is exactly
     the seat the name kept being lost on. Idempotent, so drawing the box a
     hundred times installs one listener. */
  negoWireNameMemory();
  return `<label class="nego-who" title="${i18t('ng_name_recorded')}">
    <span class="lbl">${i18t('ng_you')}</span>
    <input id="nego-cp-name" type="text" value="${_ne(v)}" placeholder="${i18t('ng_your_full_name')}"
      aria-label="${i18t('ng_your_full_name_rec')}"/>
  </label>`;
}
/* IS THERE ANYWHERE TO GO? The room has a way out only when there is a page
   behind it. For the owner there always is — the workspace they came from. For
   the counterparty it depends entirely on what the link was:

     a NEGOTIATION link  → the room IS the page they were sent. Nothing is
                           behind it, so "← Doc" led to an empty shell and Esc
                           did the same by accident. No exit, and none wanted.
     a SIGNING link      → they are reading the document and pressed "Review
                           what changed". That is a mode they entered from a
                           page that still exists, so it has a way back.

   Defaulting to "no exit for the counterparty" keeps the first case right
   without every caller having to remember; the second says so explicitly. */
function negoRoomHasExit(opts = {}){
  if (opts.noExit != null) return !opts.noExit;
  return (opts.side || 'owner') !== 'counterparty';
}
/* The other party, named from the reader's chair. On the owner's screen that
   is the counterparty; on the counterparty's screen it is us. A label that
   says "counterparty" to the counterparty is telling them about themselves. */
function negoOtherSideName(opts){
  const side = (opts && opts.side) || 'owner';
  if (side === 'owner') return 'the counterparty';
  return String((opts && opts.org) || (window.FIRST_PARTY || 'the sender'));
}

function negoRoomActionsHtml(c, opts){
  const side = opts.side || 'owner';
  const p = negoProgress(c);
  /* While the panes are showing two OLD versions, nothing on this screen is a
     live proposal — so the bulk verbs are disabled too. Leaving them live would
     let someone reading history accept the round behind it, which is the
     "nothing here to accept" rule leaking at the top of the page. */
  const comparing = !negoIsLivePair(negoComparePair().left, negoComparePair().right);
  /* Same posture as the workbench — see rlActorHeld. Both renderers or the two
     screens disagree about what a reviewer may do. */
  const canAct = !opts.readonly && !comparing && !rlActorHeld(c, opts);
  if (side === 'counterparty'){
    /* The counterparty's actions occupy the slot the owner uses for Save Draft
       and Share Link. Same room, same place on the screen, the verbs each side
       actually has.

       WHAT THEY DELIBERATELY DO NOT GET, and why:
         · Ask Copilot — it reads our whole portfolio and our playbook.
         · Save Draft — our draft state, meaningless outside the workspace.
         · Share Link — distribution stays with the owner; a counterparty who
           can re-share has published our contract onward.
         · Insert clause — our clause library IS our negotiating position.

       WHAT THEY DO GET that might look surprising: the index's Accept All and
       Reject All. Those act on OUR asks, and "I agree to all of it" is a real
       and common answer — withholding the button would not withhold the
       decision, only make them press Accept six times to say the same thing.
       A lesser screen for the other side is the thing this room exists not to
       be. Everything needed to read, judge, propose and answer is here.

       TWO VERBS, BOTH ABOUT THE WHOLE DEAL. There were four, at two different
       scopes, rendered as equals:

         · "Accept wording" accepted the entire document. In a room whose whole
           premise is a decision per change, pressing it with changes still
           pending filed an acceptance on nobody's behalf — an answer to
           everyone's ask that answered none of them. Gone.
         · "Approve & sign" signed nothing; it routed to a panel. It is now
           "Ready to sign", which is what it always did.
         · "Send N decisions" moved to the change index, next to the decisions.

       What is left is the pair that has no per-change equivalent: say the deal
       is settled, or end it. */
    const al = window.negoAlignment ? negoAlignment(c) : { aligned: true };
    const why = window.negoAlignmentWhy ? negoAlignmentWhy(c, 'counterparty') : '';
    const sent = !!opts.readySignalled;
    const ready = al.aligned && !comparing && !sent;
    /* A SCREEN WITH NO VERBS MUST SAY WHY IT HAS NONE. Read-only is a real and
       correct state — a spent link, an answered one-shot, a copy with no
       channel back — but rendering it as simply an absence leaves the reader
       looking for a button that was never going to be there. */
    if (opts.readonly && opts.readonlyWhy)
      return `<span class="nego-why" id="nego-readonly-why">${_ne(opts.readonlyWhy)}</span>`;
    /* RENDERED ON !readonly, DISABLED ON comparing — two different questions
       that one flag was answering for both.

       `canAct` is false while the panes show two OLD versions, which is right
       for the bulk verbs: nothing on that screen is a live proposal. It is
       wrong for this bar. Gating the bar on it emptied the top of their screen
       the moment they compared two versions — no Decline, no explanation, and
       the NAME FIELD gone, taking whatever they had typed into it with it.
       Ending a deal has no precondition, and who you are does not depend on
       which version you are looking at. */
    const canShow = !opts.readonly;
    return `
      ${canShow ? negoNameFieldHtml(opts) : ''}
      ${canShow ? `<button class="nego-tbtn ghost" id="nego-cp-decline">${i18t('ng_decline')}</button>` : ''}
      ${canShow ? `<button class="nego-tbtn acc" id="nego-cp-ready"${ready ? '' : ' disabled'}
        title="${sent ? 'Already sent — they know you are ready'
          : ready ? 'Tell them everything is settled from your side. Nothing is signed here.'
          : _ne(comparing ? 'Not while you are comparing versions' : why)}">${
        sent ? 'Sent — they know you are ready' : 'Ready to sign'}</button>` : ''}
      ${canShow && !ready && !sent ? `<span class="nego-why" id="nego-ready-why">${
        _ne(comparing ? 'Not while you are comparing versions' : why)}</span>` : ''}
`;
  }
  return `
    <button class="nego-tbtn ghost" id="nego-save-draft">${i18t('ng_save_draft')}</button>
    ${''/* SHARE LINK IS GONE FROM THIS BAR, because "Send to <them>" in the
            turn banner opens the very same share dialog by the very same route
            — see the send handler below, which has always said so. Two ghost
            buttons a few inches apart minting the same link is one too many,
            and the quieter of the two sat next to Save Draft where nothing
            about it said it was how the contract reaches the other party.

            Sharing is not lost: the workspace's own Share and the contracts
            list both open the same dialog, for the cases this room is not the
            right place for — a third party, a re-send, a link for signature. */}
    <button class="nego-tbtn ghost" id="nego-copilot" title="${i18t('ng_ask_about_contract')}">✦ Ask Copilot</button>
    ${canAct ? `<button class="nego-tbtn ghost" id="nego-insert-lib" title="${i18t('ng_insert_preferred')}">+ Insert clause</button>` : ''}
    ${(() => { const bs = negoBulkState(c, side, canAct);   /* see negoBulkState */
      const t = (own, dflt) => comparing ? 'Not while you are comparing versions' : (own || dflt);
      return `<button class="nego-tbtn acc" id="nego-all-acc"${bs.acc.ok && !comparing ? '' : ' disabled aria-disabled="true"'}
      title="${_ne(t(bs.acc.why, 'Accepts only the pending changes that trip no playbook, scan or review signal — the rest are held back for you'))}">${i18t('ng_accept_all_nonrisk_btn')}</button>
    <button class="nego-tbtn rej" id="nego-all-rej"${bs.rej.ok && !comparing ? '' : ' disabled aria-disabled="true"'}
      title="${_ne(t(bs.rej.why, 'Rejects every pending change proposed by the other side. Your own asks are untouched.'))}">${i18t('ng_reject_all_cp_btn')}</button>`; })()}
    <button class="nego-tbtn ghost" id="nego-export"${p.pending ? ' disabled' : ''}
      title="${p.pending ? 'Pending changes must be resolved first' : 'Export the agreed wording'}">${i18t('ng_export_clean_pdf_btn')}</button>`;
}
function negoRoomHtml(c, opts = {}){
  negoInit(c);
  const side = opts.side || 'owner';
  /* ALIGNMENT, not "every change has an answer". negoReadyToSign asks whether
     the ROUND is finished, which a refused ask satisfies. This banner says
     "nothing is outstanding between the parties", which a refused ask does not
     — so gating it on the weaker question had it announce agreement over a live
     disagreement, which is the class of untruth this screen exists to remove.
     A refusal clears when the side that asked withdraws it. */
  const ready = negoProgress(c).total > 0
    && (window.negoAlignment ? negoAlignment(c).aligned : negoReadyToSign(c));
  const org = String(opts.org || (window.FIRST_PARTY || 'HaTi'));
  const who = String(opts.author || (window.currentUser && window.currentUser()?.name) || '');
  const initials = who.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'HT';
  /* The owner reads a workspace path; the counterparty reads a contract. Our
     template code and internal naming are filing structure, not theirs. */
  const path = side === 'counterparty'
    ? `${c.name || c.id || 'Contract'}${c.id ? ' · ' + c.id : ''}`
    : `${c.id || ''}${c.template ? ' · ' + c.template : ''}${c.name ? ' · ' + c.name : ''}`;
  const statusChip = String(c.status || 'Draft');
  return `<div class="nego-room" id="nego-room" role="region" aria-label="${i18t('ng_negotiation_room')}">
    <header class="nego-topbar">
      <div class="nego-brand"><span class="mark">Ha</span>HaTi <small>${i18t('ng_clm')}</small></div>
      <nav class="nego-crumbs" aria-label="${i18t('ng_workspace_breadcrumbs')}">
        ${''/* NO WAY OUT ON THEIR SIDE, and that is the correct shape.

              "← Doc" is a breadcrumb: it says there is a workspace behind this
              room and you came from it. For the owner that is true. For the
              counterparty there is no Doc page, no workspace, and nothing
              underneath — the room IS the page they were sent. Pressing it left
              them on an empty shell with no way back, and Esc did the same
              thing by accident.

              This deliberately reverses an assertion made a round ago, that
              "leaving the room lands on their page and does not snap shut
              again". That was true while the room was a mode you entered from a
              portal page. It stopped being true when the room became the
              landing. The f49 test that asserted it has been rewritten to
              assert the opposite, rather than worked around. */}
        ${negoRoomHasExit(opts) ? `<button class="nego-exit" id="nego-exit" title="${i18t('ng_leave_room')}">
          <span aria-hidden="true">←</span> Doc
        </button>
        <span class="sep" aria-hidden="true">›</span>` : ''}
        <span class="path">${side === 'counterparty' ? '' : 'Contract Workspace '}${_ne(path)}</span>
        <span class="draft-chip">${_ne(statusChip)}</span>
      </nav>
      <div class="nego-top-actions">
        ${negoRoomActionsHtml(c, opts)}
        <div class="nego-avatar" title="${_ne(who || org)}">${_ne(initials)}</div>
      </div>
    </header>
    ${''/* Which mode the room is in, above everything the reader will act on.
          The embedded tab carries the same banner from negoHeadHtml; the room
          is a different layout and needed it mounting separately, which is why
          it appeared on one surface and not the other. */}
    <div style="flex:none;padding:9px 18px 0">${negoModeHtml(c, opts)}</div>
    ${negoRoomBannerHtml(c, opts, ready)}
    ${negoCompareBarHtml(c)}
    ${negoCleanBarHtml(c)}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;position:relative">
      ${negoPanesHtml(c, opts)}
    </div>
    ${negoStatusHtml(c, opts)}
  </div>`;
}

/* ---------- the layout, and remembering it ----------
   `f` is the baseline's share of the document space, `c` the index's width in
   pixels, `idxOff` whether the index is folded away. Persisted per browser like
   the Docs page's own divider (hati.v1.docLeftFrac), so a reader who prefers a
   wide baseline keeps it. */
const NEGO_LAYOUT_KEY = 'hati.v1.negoLayout';
const NEGO_F_MIN = 0.2, NEGO_F_MAX = 0.8, NEGO_F0 = 0.46;
const NEGO_C_MIN = 240, NEGO_C_MAX = 560, NEGO_C0 = 335;
let _negoLayout = null;
function negoLayout(){
  if (_negoLayout) return _negoLayout;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(NEGO_LAYOUT_KEY)); } catch (e) {}
  _negoLayout = {
    f: (saved && Number.isFinite(saved.f)) ? Math.min(NEGO_F_MAX, Math.max(NEGO_F_MIN, saved.f)) : NEGO_F0,
    c: (saved && Number.isFinite(saved.c)) ? Math.min(NEGO_C_MAX, Math.max(NEGO_C_MIN, saved.c)) : NEGO_C0,
    idxOff: !!(saved && saved.idxOff),
  };
  return _negoLayout;
}
function negoSetLayout(patch){
  const L = negoLayout();
  if (patch.f != null) L.f = Math.min(NEGO_F_MAX, Math.max(NEGO_F_MIN, patch.f));
  if (patch.c != null) L.c = Math.min(NEGO_C_MAX, Math.max(NEGO_C_MIN, patch.c));
  if (patch.idxOff != null) L.idxOff = !!patch.idxOff;
  try { localStorage.setItem(NEGO_LAYOUT_KEY, JSON.stringify(L)); } catch (e) {}
  const work = document.getElementById('nego-work');
  if (work){
    work.style.setProperty('--nego-f', String(L.f));
    work.style.setProperty('--nego-c', L.c + 'px');
    work.classList.toggle('idx-off', L.idxOff);
  }
  return L;
}
/* The dividers. Applied to the live element rather than through a re-render, so
   a drag is smooth and does not rebuild two documents on every pointer move. */
function wireNegoLayout(opts = {}){
  /* Same trap as wireNegotiationTab's, and the same fix: the counterparty's
     page mounts two copies of the workbench, so a document-wide lookup wired
     the ROOM's dividers to the hidden embedded one. Dragging the room's
     dividers did nothing. */
  const root = (opts.hostId && document.getElementById(opts.hostId)) || document;
  const work = negoPick(root, 'nego-work');
  if (!work) return;
  const drag = (rz, onDelta, onReset) => {
    if (!rz) return;
    let startX = 0, start = null;
    const move = e => { onDelta(e.clientX - startX, start, work.getBoundingClientRect()); };
    const up = () => {
      delete rz.dataset.drag;
      document.body.style.cursor = ''; document.body.style.userSelect = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    rz.addEventListener('pointerdown', e => {
      e.preventDefault();
      rz.dataset.drag = '1';
      startX = e.clientX; start = { ...negoLayout() };
      document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    rz.addEventListener('dblclick', onReset);
  };
  drag(negoPick(root, 'nego-rz-a'),
    (dx, start, box) => {
      const docs = Math.max(1, box.width - negoLayout().c - 12);
      negoSetLayout({ f: start.f + dx / docs });
    },
    () => negoSetLayout({ f: NEGO_F0 }));
  drag(negoPick(root, 'nego-rz-b'),
    (dx, start) => negoSetLayout({ c: start.c - dx }),   // drag left widens the index
    () => negoSetLayout({ c: NEGO_C0 }));

  const refold = () => { if (opts.rerender) opts.rerender(); };
  negoPick(root, 'nego-fold')?.addEventListener('click', () => { negoSetLayout({ idxOff: true }); refold(); });
  negoPick(root, 'nego-unfold')?.addEventListener('click', () => { negoSetLayout({ idxOff: false }); refold(); });
}

/* ---------- entering and leaving ----------
   Entering hides the app shell and mounts the room over the window; leaving
   puts the shell back exactly as it was. Both are idempotent, because a mode
   you can enter twice is a mode you can get stuck in. */
let _negoCmpL = 'baseline';
let _negoCmpR = 'working';
const negoComparePair = () => ({ left: _negoCmpL, right: _negoCmpR });
function negoSetComparePair(left, right){
  _negoCmpL = left || 'baseline';
  _negoCmpR = right || 'working';
}
let _negoRoomOpen = false;
let _negoRoomC = null;
/* Which contract the room is showing, so js/ai.js can tell Copilot what is on
   the screen without the room having to reach into the panel. */
const negoRoomContract = () => (_negoRoomOpen ? _negoRoomC : null);
let _negoEscHandler = null;
/* The opts the room is CURRENTLY open with. The Escape handler is registered
   once on the document and outlives any one room, so it has to ask what is on
   the screen now rather than what was on it when it was installed — a page that
   opened the owner's room and then the counterparty's kept the owner's handler
   and closed a room that has nowhere to go back to. Chromium found it; jsdom
   could not, because the jsdom stage only ever opens one side. */
let _negoRoomOpts = null;
function negoRoomHost(){
  let host = document.getElementById('nego-room-root');
  if (!host){
    host = document.createElement('div');
    host.id = 'nego-room-root';
    document.body.appendChild(host);
  }
  return host;
}
function openNegotiationRoom(c, opts = {}){
  negoEnsureStyle();
  const host = negoRoomHost();
  const shell = document.getElementById('app-shell');
  /* ---- ARRIVING SHOWS THE CHANGES. ALWAYS. ----
     Clean read and version comparison are both LOOKS somebody takes, and both
     were module state that outlived the room. Take a clean read, step out to
     the Docs page, come back — and the negotiation opened on a clean document
     with every change invisible and a button reading "Show changes". Nothing
     was broken and nothing said so; the screen simply was not the screen the
     reader expected, and the one thing they had come to do was the one thing
     they could not see.

     The first thing a negotiation must show is what is being negotiated. So
     entering resets the view to the live round, every time. Repaints do not:
     `_negoRoomOpen` is already true for those, and a mode that switched itself
     off every time a change was accepted would fight the person using it. */
  const arriving = !_negoRoomOpen;
  if (arriving){ negoSetCleanView(false); negoSetComparePair('baseline', 'working'); }
  if (shell && !_negoRoomOpen){ shell.dataset.negoHidden = '1'; shell.classList.add('hidden'); }
  _negoRoomOpen = true;
  _negoRoomC = c;
  _negoRoomOpts = opts;
  document.body.classList.add('nego-room-open');
  host.innerHTML = negoRoomHtml(c, opts);
  /* THE CALLER'S OWN REPAINT WINS, when it supplied one.

     This used to be unconditionally `() => openNegotiationRoom(c, opts)` — the
     same contract object and the same opts, forever. On the counterparty's page
     that froze two things the room is supposed to react to: the record is
     rebuilt from the share payload plus the decisions held in the browser, and
     `pendingDecisions` is counted from those decisions. Re-opening with the
     captured opts meant the count stayed at whatever it was when the room first
     opened — so the send that appears once there is something to send never
     appeared at all, however many changes they decided.

     Falling back to the local closure keeps the owner's room, which supplies no
     rerender, working exactly as before. */
  const rerender = typeof opts.rerender === 'function'
    ? opts.rerender
    : () => openNegotiationRoom(c, opts);
  wireNegotiationTab(c, { ...opts, hostId: 'nego-room-root', rerender });
  wireNegoLayout({ rerender, hostId: 'nego-room-root' });
  const roomId = id => negoPick(host, id);
  roomId('nego-exit')?.addEventListener('click', () => closeNegotiationRoom(opts));
  roomId('nego-save-draft')?.addEventListener('click', () => {
    if (opts.onSaveDraft) opts.onSaveDraft(c);
    else if (window.toast) toast(i18t('ng_saving_unavailable'), 'err');
  });
  /* The Share Link button is gone from the bar; opts.onShareLink is NOT. It is
     the route "Send to <them>" travels, and removing the hook along with the
     button would have taken the send with it. */
  /* The counterparty's verbs. Each one hands back to the page that owns it —
     the room renders them, it does not implement signing or declining. */
  for (const [id, hook] of [['nego-cp-ready', 'onSignalReady'],
    ['nego-cp-decline', 'onDecline'],
    ['nego-issue-signing', 'onIssueSigningLink'],
    ['nego-send-decisions', 'onSendDecisions']]){
    const el = roomId(id);
    /* wireNegotiationTab wires the hand-off itself now — see the negoWired
       guard there — so this only binds what is still unwired. */
    if (!el || el.dataset.negoWired) continue;
    el.dataset.negoWired = '1';
    el.addEventListener('click', () => {
      if (typeof opts[hook] === 'function') opts[hook](c);
      else if (window.toast) toast(i18t('ng_action_unavailable'), 'err');
    });
  }
  /* Esc leaves the room — for whoever has somewhere to go. The counterparty
     does not: the room is the page they were sent, and an accidental Esc used
     to empty the window under them with no way back.

     The test is made INSIDE the handler, against the room that is open now.
     Guarding only at registration time was not enough: the listener is a
     document-level singleton, so one installed for a room with an exit went on
     answering Escape for every room opened afterwards. */
  if (!_negoEscHandler){
    _negoEscHandler = e => {
      if (e.key !== 'Escape' || !_negoRoomOpen) return;
      if (!negoRoomHasExit(_negoRoomOpts || {})) return;
      closeNegotiationRoom(_negoRoomOpts || {});
    };
    document.addEventListener('keydown', _negoEscHandler);
  }
  negoAfterPaint(c, { ...opts, hostId: 'nego-room-root' }, host);
  const fade = () => host.querySelectorAll('[data-fade]').forEach(n => n.classList.add('nego-faded'));
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => setTimeout(fade, 900));
  else setTimeout(fade, 900);
  return host;
}
function closeNegotiationRoom(opts = {}){
  const host = document.getElementById('nego-room-root');
  if (host) host.innerHTML = '';
  const shell = document.getElementById('app-shell');
  if (shell && shell.dataset.negoHidden){ delete shell.dataset.negoHidden; shell.classList.remove('hidden'); }
  _negoRoomOpen = false;
  _negoRoomC = null;
  _negoRoomOpts = null;
  document.body.classList.remove('nego-room-open');
  if (_negoEscHandler){ document.removeEventListener('keydown', _negoEscHandler); _negoEscHandler = null; }
  if (opts && typeof opts.onExit === 'function') opts.onExit();
}
const negoRoomIsOpen = () => _negoRoomOpen;

/* ---------- rendering + wiring ----------
   One render path, called after every state change, so the three panes can
   never disagree about a change's status. Cheap enough to do wholesale: the
   document is a page, not a feed. */
function renderNegotiationTab(c, opts = {}){
  const host = document.getElementById(opts.hostId || 'nego-tab');
  if (!host) return;
  negoEnsureStyle();                 // in <head>, so a repaint cannot strip it
  host.innerHTML = negoTabHtml(c, opts);
  wireNegotiationTab(c, opts);
  negoAfterPaint(c, opts, host);
  // soften the wash on freshly accepted wording, the way the prototype does
  const fade = () => host.querySelectorAll('[data-fade]').forEach(n => n.classList.add('nego-faded'));
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => setTimeout(fade, 900));
  else setTimeout(fade, 900);
}

/* Synchronised focus. A badge, a clause or a card — all three land here, and
   all three light up all three panes. `source` exists for one reason: clicking
   a clause you are already reading must not yank that pane to centre it. */
function negoFocus(c, id, source){
  _negoActive = id;
  const ch = negoChangeById(c, id);
  if (!ch) return;
  /* The embedded tab mounts #nego-root; the ROOM mounts .nego-room and has no
     #nego-root at all — so looking only for the id meant synchronised
     highlighting silently did nothing in the full-window mode, which is the
     mode this component mostly runs in. jsdom could not catch it: the markup
     was right in both, and only a browser that actually applies the class shows
     that nothing lights up. Found in the Chromium pass, recorded in BUGLOG. */
  /* The ROOM first when the room is open. Both mounts carry these ids, and
     #nego-root is the embedded copy — so on the counterparty's page every
     synchronised highlight was applied to a hidden panel while the screen they
     were reading did not move. */
  const root = (_negoRoomOpen && document.getElementById('nego-room'))
    || document.getElementById('nego-root') || document.getElementById('nego-room');
  if (!root) return;

  root.querySelectorAll('.nego-clause').forEach(n => n.classList.remove('is-active', 'flash'));
  root.querySelectorAll('.nego-badge').forEach(n => n.classList.remove('is-active'));
  root.querySelectorAll('.nego-card').forEach(n => n.classList.remove('is-active'));

  const base = negoPick(root, 'nb-' + negoDomId(ch.clauseId));
  if (base){
    base.classList.add('is-active', 'flash');
    if (base.scrollIntoView) base.scrollIntoView({ block: 'center' });
  }
  const work = negoPick(root, 'nw-' + negoDomId(ch.clauseId));
  if (work){
    work.classList.add('is-active', 'flash');
    if (source !== 'clause' && work.scrollIntoView) work.scrollIntoView({ block: 'center' });
  }
  const badge = root.querySelector(`[data-badge="${ch.id}"]`);
  if (badge && ch.status === 'pending') badge.classList.add('is-active');
  const card = negoPick(root, 'nego-card-' + ch.id);
  if (card){
    card.classList.add('is-active');
    if (source !== 'card' && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
  }
}

/* FIND AN ELEMENT BY ID, WITHIN ONE MOUNT.

   Written as an attribute selector rather than `#id` on purpose. The
   counterparty's page mounts this component twice — the room over the window
   and the embedded copy underneath — so several ids exist twice in the
   document, which is what the scoping above exists to survive. But a `#id`
   selector is answered from the document's id map: it finds the FIRST element
   with that id and then checks whether it is inside the subtree, returning null
   when it is not. Scoping to the room would therefore have returned null for
   every duplicated id instead of the room's own copy — trading one wrong
   element for none, which is not an improvement.

   `[id="…"]` is matched against the subtree itself and gives the right answer.
   The value is escaped for the quoted-string form, not for a selector. */
const negoPick = (root, id) =>
  (root || document).querySelector('[id="' + String(id).replace(/["\\]/g, '\\$&') + '"]');

/* ============================================================
   WHICH CHANGE THE READER SINGLED OUT FROM THE DOCUMENT
   ============================================================
   Clicking a fingerprint badge in the margin narrows the index to that one
   change and its conversation. Module-level beside _negoActive and _negoThreads
   for the same reason they are: it is where the reader is looking, not anything
   about the agreement, and it must never reach storage or a share payload. */
let _negoLinked = null;
/* And whether the reader asked to see ONLY that one. Kept apart from _negoLinked
   on purpose: clicking a fingerprint should always single its conversation out,
   but it must not silently remove every other change from the index — a reader
   who clicks #12 to read it and then goes looking for #13 should still find it.
   Narrowing is a second, explicit, reversible act. */
let _negoOnly = false;

/* ============================================================
   IS THIS CHANGE SAFE TO ACCEPT WITHOUT READING IT?
   ============================================================
   "Accept all non-risk redlines" moves contract wording without a human
   reading each one, so what counts as risk decides how much damage one click
   can do. The answer is drawn from signals this product already computes, and
   the test is deliberately INCLUSIVE — anything that trips any signal is held
   back for a person.

     · the clause deviates from the corporate playbook (js/playbook.js)
     · the clause is quoted in an open scan finding (js/ai.js)
     · the change is flagged needsReview by the model itself
     · the change deletes or inserts a whole clause — losing or gaining a clause
       wholesale is never a routine acceptance
     · the change is ours: nobody rules on their own ask, so a batch that swept
       up our own proposals would be routing around that rule in bulk

   Anything unclassifiable counts as risk. A signal that fails to load must not
   read as "nothing to worry about". */
function negoRiskOf(c, ch, side){
  const why = [];
  if (!ch || ch.status !== 'pending') return { risky: true, why: ['not awaiting a decision'] };
  /* Deliberately NOT excluded here: an ask of our own. negoResolve already
     refuses to let a side rule on its own proposal, so listing it as a risk
     would double-count a rule the model enforces — and would make the preview
     claim a change was held back for danger when it was never ours to take. */
  if (ch.needsReview) why.push(ch.needsReviewWhy || 'flagged for review');
  if (ch.changeType === 'deleteClause') why.push('removes a whole clause');
  if (ch.changeType === 'insertClause') why.push('adds a whole clause');
  const hay = `${ch.oldText || ''}\n${ch.newText || ''}`.toLowerCase();
  const label = String(ch.clauseLabel || '').toLowerCase();
  try{
    const pb = c && c.playbook;
    for (const v of ((pb && pb.verdicts) || [])){
      if (v.status !== 'deviation') continue;
      const q = String(v.quote || '').toLowerCase().trim();
      const cat = String(v.category || '').toLowerCase().trim();
      if ((q && q.length > 6 && hay.includes(q)) || (cat && label.includes(cat)))
        why.push(`playbook deviation — ${v.category || 'flagged'}`);
    }
  }catch(e){ why.push('the playbook could not be read'); }
  try{
    const scan = c && c.scan;
    const dismissed = new Set((scan && scan.dismissed) || []);
    for (const f of ((scan && scan.findings) || [])){
      if (dismissed.has(f.id)) continue;
      const q = String((window.findingQuote ? findingQuote(f) : f.quote) || '').toLowerCase().trim();
      if (q && q.length > 6 && hay.includes(q))
        why.push(`open ${f.sev || ''} finding — ${f.title || f.kind || 'risk'}`.replace(/\s+/g, ' ').trim());
    }
  }catch(e){ why.push('the scan could not be read'); }
  return { risky: why.length > 0, why };
}
/* Split the pending set the way the two batch buttons need it. */
function negoBatchSplit(c, side){
  const pending = (window.negoChanges ? negoChanges(c) : []).filter(x => x.status === 'pending');
  const clear = [], held = [], theirs = [];
  for (const ch of pending){
    const r = negoRiskOf(c, ch, side);
    if ((ch.authorSide || 'owner') !== (side || 'owner')) theirs.push(ch);
    if (r.risky) held.push({ ch, why: r.why }); else clear.push(ch);
  }
  return { pending, clear, held, theirs };
}

/* ---- WHETHER THE TWO BATCH BUTTONS CAN DO ANYTHING, AND WHY NOT ----
   THREE SURFACES DRAW THIS PAIR — negoHeadHtml (the live negotiation page's
   own head), negoAllHtml (the room's toolbar) and the index column — and all
   three asked a WIDER question than the act behind them: "is anything pending
   at all". bulk() asks negoBatchSplit, which is narrower on each button —
   Accept takes only what trips no playbook, scan or review signal; Reject only
   what came from the other side. So on a round where every pending change
   tripped the playbook, or where all of them were ours, the buttons were lit
   and both answered with a refusal.

   ONE READING now decides whether each draws live AND what pressing it does,
   so the two cannot disagree — and it carries the REASON, because a dimmed
   control that cannot explain itself is a wall, which is worse than a silent
   press: the reader cannot even try. */
function negoBulkState(c, side, canAct){
  if (!canAct) return { acc:{ ok:false, why:'' }, rej:{ ok:false, why:'' } };
  const sp = negoBatchSplit(c, side);
  return {
    split: sp,
    acc: { ok: !!sp.clear.length,
      why: sp.clear.length ? '' : (sp.held.length
        ? i18tn('ng_bulk_none_clear', sp.held.length, { n: sp.held.length })
        : i18t('ng_bulk_none_pending')) },
    rej: { ok: !!sp.theirs.length,
      why: sp.theirs.length ? '' : i18t('ng_bulk_none_theirs') },
  };
}

/* The preview. A batch that moves contract wording says exactly what it will
   move and exactly what it is holding back, BEFORE it moves anything — the
   alternative is a button whose blast radius a person can only learn by
   pressing it. */
async function negoBatchConfirm(c, kind, split){
  const e = window.esc || _negoEsc;
  const take = kind === 'accept' ? split.clear : split.theirs;
  if (!take.length){
    if (window.toast) toast(kind === 'accept'
      ? 'Nothing is clear to accept — every pending change tripped a risk signal, so each needs a person'
      : 'No changes from the other side are pending');
    return null;
  }
  const list = arr => arr.slice(0, 12).map(x => {
    const ch = x.ch || x;
    return `<li style="margin:0 0 var(--s-1)"><code style="font-family:var(--font-mono);font-size:var(--t-label)">#${e(ch.id)}</code> ${e(ch.clauseLabel || ch.clauseId || '')}${
      x.why ? ` <span style="color:var(--st-ruby-fg)">— ${e(x.why.join('; '))}</span>` : ''}</li>`;
  }).join('') + (arr.length > 12 ? `<li style="color:var(--color-neutral-600)">${i18t('ng_and_more',{n:arr.length - 12})}</li>` : '');
  const body = `
    <div style="font-size:var(--t-body);line-height:1.6">
      <p style="margin:0 0 var(--s-2)"><b>${take.length} change${take.length === 1 ? '' : 's'}</b> will be ${kind === 'accept' ? 'accepted and merged into the wording' : 'rejected, reverting those clauses to the baseline'}.</p>
      <ul style="margin:0 0 var(--s-3);padding-left:18px">${list(take)}</ul>
      ${kind === 'accept' && split.held.length ? `
        <p style="margin:0 0 6px"><b>${split.held.length}</b> ${i18t('ng_held_back')}</p>
        <ul style="margin:0;padding-left:18px">${list(split.held)}</ul>` : ''}
    </div>`;
  if (window.confirmDialog){
    return await confirmDialog({
      title: kind === 'accept' ? 'Accept the changes with no risk signal?' : 'Reject every change from the other side?',
      body,
      confirmLabel: kind === 'accept' ? `Accept ${take.length}` : `Reject ${take.length}`,
      danger: kind !== 'accept'
    }) ? take : null;
  }
  /* No dialog available (a headless stage, an embedded mount): proceed and let
     the toast report what moved. Every decision here is reopenable, so the
     preview is a courtesy rather than the thing that makes this safe. */
  return take;
}

/* ============================================================
   THE SELECTION MENU AND THE AI PROPOSAL
   ============================================================
   Three things a person wants done to wording they have just read, offered
   where they read it. Every one of them ends at a PROPOSAL — a redline shown
   against the current clause with Apply or Cancel — and never at an edit. The
   document does not move because a model suggested something.

   "⚖️ ALIGN WITH CORPORATE PLAYBOOK" WAS THE FOURTH AND IS GONE, from here for
   the same reason it went from the Doc Lab's menu: the playbook holds category
   VERDICTS on a contract — liability cap, governing law, payment terms — and no
   preferred wording for any of them. The action asked a model to match a
   formulation that does not exist, so the model supplied its own and it arrived
   wearing the playbook's authority. A reviewer who reads "aligned with
   playbook" on a redline stops checking it, which is the point at which a
   confident guess becomes a term of the agreement.

   The playbook still reaches the model on every ask as context, and still
   drives the risk signals that hold a change back from a batch accept. What has
   gone is the claim that it can draft. */
const NEGO_AI_ACTIONS = [
  { id: 'advantage', label: '🪄 Rephrase for Buyer/Supplier Advantage',
    get ask(){ return `Rewrite this contract wording so it is more favourable to the party I act for, while staying commercially reasonable and enforceable under ${jxLaw()}.`; } },
  { id: 'risk', label: '🔍 Explain Legal Risk',
    ask: 'Explain the legal and commercial risk this wording carries, then give a safer alternative formulation.', explain: true },
  { id: 'shorten', label: '✂️ Shorten Wording',
    ask: 'Rewrite this contract wording more concisely without changing its legal effect. Keep defined terms exactly as they are.' }
];
function _negoKillSelMenu(){
  document.querySelectorAll('.nego-selmenu').forEach(n => n.remove());
}
function _negoKillAiPop(){
  document.querySelectorAll('.nego-aipop').forEach(n => n.remove());
}
/* Where the menu goes. Off the selection's own rectangle, clamped to the
   viewport so a clause selected at the bottom of the window does not put its
   menu below the fold. */
function _negoAnchor(rect, w, h){
  const pad = 10;
  let left = Math.min(Math.max(pad, rect.left), window.innerWidth - w - pad);
  let top = rect.bottom + 8;
  if (top + h > window.innerHeight - pad) top = rect.top - h - 8;
  /* ---- AND IT LANDS ON SCREEN EVEN WHEN ITS ANCHOR DOES NOT ----
     The flip above answers "the menu would hang off the bottom" by putting it
     ABOVE the wording. That is the right first move and it is not enough on
     its own: if the anchor itself is off screen — a clause below the fold,
     reached by keyboard or by a press that scrolled underneath — the flipped
     position is off screen too, and the menu is drawn where nobody can see it.
     Caught the day the contract started scaling to fill its column, which
     makes the document taller and puts more of it past the fold.

     Both axes are clamped the same way now: preferred position first, then
     into the window. The horizontal clamp has always been here; this is its
     twin. */
  top = Math.min(Math.max(pad, top), Math.max(pad, window.innerHeight - h - pad));
  return { left, top };
}
/* An answer where the menu would have been. Used when a highlight is real and
   legible but cannot lead anywhere — front matter, or two highlights at once.
   It is the menu's own layer with no items in it, so it dismisses on the same
   click-away and Escape as the menu, and it says the reason at the wording it
   is about rather than in a toast that is gone before the sentence is read. */
function _negoSayAtSelection(rect, head, body){
  _negoKillSelMenu();
  const menu = document.createElement('div');
  menu.className = 'nego-selmenu';
  menu.setAttribute('role', 'status');
  menu.innerHTML = `<div class="nego-selhead">${_ne(head)}</div>
    <div class="nego-selnote">${_ne(body)}</div>`;
  document.body.appendChild(menu);
  const box = menu.getBoundingClientRect();
  const at = _negoAnchor(rect, box.width, box.height);
  menu.style.left = at.left + 'px';
  menu.style.top = at.top + 'px';
  return menu;
}

/* Ask the Copilot for wording, then show what it would change — never change
   anything. The popover is the whole safety argument for putting a model
   anywhere near a contract: it renders the redline that WOULD be filed against
   the clause as it currently stands, and Apply is a person's decision. Cancel,
   Escape and clicking away all leave the document untouched.

   What comes back is treated as WORDING, not as instructions and not as
   markup: it is escaped by the redline renderer like any other proposed text. */
async function negoAiPropose(c, ctx){
  const { action, text, clauseId, rect, side, opts, again } = ctx;
  const e = window.esc || _negoEsc;
  _negoKillAiPop();
  const pop = document.createElement('div');
  pop.className = 'nego-aipop';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', action.label.replace(/^\S+\s/, ''));
  pop.innerHTML = `
    <header><b>${e(action.label)}</b><span style="flex:1"></span>
      <button type="button" data-ai-x class="ui-btn" style="font-size:var(--t-label);padding:3px 9px">${i18t('act_close')}</button></header>
    <div class="nego-aiwait"><span class="nego-aispin"></span>${i18t('ng_reading_clause')}</div>`;
  document.body.appendChild(pop);
  const place = () => {
    const box = pop.getBoundingClientRect();
    const at = _negoAnchor(rect, box.width, box.height);
    pop.style.left = at.left + 'px'; pop.style.top = at.top + 'px';
  };
  place();
  pop.querySelector('[data-ai-x]').addEventListener('click', () => pop.remove());

  const fail = msg => {
    pop.querySelector('.nego-aiwait')?.remove();
    const body = document.createElement('div');
    body.className = 'nego-aierr';
    body.textContent = msg;
    pop.insertBefore(body, pop.firstChild.nextSibling);
    place();
  };
  if (!window.copilotAvailable || !copilotAvailable()){
    fail('The Copilot is not connected on this workspace yet, so there is nothing to ask. Connect it under Team & Settings, then try again — the wording you selected is untouched.');
    return;
  }

  /* Said before the model is asked: a drag across a clause boundary cannot be
     spliced back into one clause, and misreporting it as pending edits sent
     people hunting for redlines that were not there. */
  if (ctx.spans){
    fail('The selection covers more than one clause. Select within a single clause — the Copilot rewrites one clause at a time.');
    return;
  }
  const cl = window.negoClauseById ? negoClauseById(c, clauseId) : null;
  /* ---- A CLAUSE THAT IS ITSELF STILL A PROPOSAL ----
     The room draws a clause somebody has asked to ADD, and it reads like any
     other — but it is not in the round baseline, which is what "proposed"
     means, so negoEditClause has nothing to file against and answers null. The
     popover happily proposed wording for it and Apply then reported "that
     wording matches the clause already", a claim about the document that was
     not true. Said before the model is asked, and only where the clause really
     is a pending insertion; any other absence keeps the old fallback. */
  if (!cl && window.negoChanges){
    const ins = negoChanges(c).find(x =>
      x && x.clauseId === clauseId && x.changeType === 'insertClause' && x.status !== 'superseded');
    if (ins){
      fail('This clause is itself still a proposal — it has not been accepted into the document yet, '
        + 'so there is no agreed wording to redline. Revise it from its change card, or accept it first.');
      return;
    }
  }
  const clauseText = cl ? cl.text : text;
  const pbLine = (() => {
    try{
      const v = ((c.playbook && c.playbook.verdicts) || []).filter(x => x.status === 'deviation');
      return v.length ? `Our playbook flags this contract for: ${v.map(x => x.category).join(', ')}.` : '';
    }catch(_){ return ''; }
  })();
  const messages = [{ role: 'user', content:
    `${action.ask}\n\n`
    + `You are helping negotiate a contract governed by ${jxLaw()}. `
    + `The party I act for is ${side === 'counterparty' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'us')}. `
    + (pbLine ? pbLine + ' ' : '')
    + `\n\nThe selected wording is:\n"""\n${text}\n"""\n\n`
    + (action.explain
      ? `Reply with at most three sentences of risk explanation, then a line containing only ---, then the replacement wording for the selected passage and nothing else.`
      : `Reply with the replacement wording for the selected passage and nothing else. No preamble, no quotation marks, no commentary.`) }];

  let raw;
  try{
    const res = await copilotAsk(messages, window.buildAssistantContext ? buildAssistantContext() : null);
    raw = typeof res === 'string' ? res
      : (res && (res.text || res.answer || res.content || res.reply || res.message)) || '';
    if (raw && typeof raw !== 'string') raw = String(raw);
  }catch(err){
    fail(err && err.needsKey
      ? 'The Copilot needs an API key. Add one under Team & Settings, then try again.'
      : `The Copilot couldn't answer: ${(err && err.message) || err}. Try again.`);
    return;
  }
  if (!pop.isConnected) return;                    // closed while it was thinking
  if (!String(raw || '').trim()){ fail('The Copilot didn\'t return a usable answer. Try again.'); return; }

  let note = '', replacement = String(raw).trim();
  if (action.explain){
    const parts = replacement.split(/\n---+\n/);
    if (parts.length > 1){ note = parts[0].trim(); replacement = parts.slice(1).join('\n').trim(); }
    else { note = replacement; replacement = ''; }
  }
  /* A model that wrapped its answer in quotes or a code fence is answering the
     question; it is not proposing quotation marks into the contract. */
  replacement = replacement.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
    .replace(/^["“]([\s\S]*)["”]$/, '$1').trim();

  /* THE SELECTION HAS TO BE FOUND IN THE CLAUSE. Falling back to "replace the
     whole clause with whatever came back" is a quiet catastrophe: a person
     selects five words inside a clause under redline — where the visible text
     mixes kept, inserted and struck-through wording and exists in no single
     version — the lookup misses, and the entire clause is silently swapped. */
  /* `marked` was read off the selection's own fragment when the menu opened and
     is true only where the marks inside the chosen words belong to a LIVE
     redline — not merely somewhere in the clause, and not a change that was
     settled weeks ago and still renders its marks in the document. */
  /* Matched tolerantly, spliced exactly: negoResolvePassage straightens smart
     quotes, strips zero-width characters, collapses whitespace, forgives the
     list markers the projection prints, tries the clause as the round baseline
     holds it, and honours WHICH occurrence of the phrase was highlighted — then
     answers with real offsets into the stored clause text. */
  /* Two facts, checked separately, each said only when it is true — see the
     note in rlAiPropose for why coupling them made the message so often wrong. */
  if (replacement && ctx.marked === true){
    fail('This text already has pending edits. Accept or reject the current redline first, or select a section without changes.');
    return;
  }
  const hit = replacement
    ? negoResolvePassage(clauseText, ctx.passage || { text })
    : null;
  const found = !!hit;
  if (replacement && !found){
    fail('This selection couldn\'t be matched to the clause\'s current wording. Reselect the passage and try again.');
    return;
  }
  const proposed = found ? clauseText.slice(0, hit.start) + replacement + clauseText.slice(hit.end) : clauseText;
  const structured = window.redlineStructuredHtml
    ? redlineStructuredHtml(clauseText, proposed) : null;
  const canApply = found && proposed !== clauseText;

  pop.querySelector('.nego-aiwait')?.remove();
  const body = document.createElement('div');
  body.className = 'nego-aibody';
  body.innerHTML = (note ? `<p style="font-family:var(--n-font-ui);font-size:var(--t-body);line-height:1.6;margin:0 0 10px;padding:9px 11px;background:var(--n-canvas);border-radius:var(--radius)">${e(note)}</p>` : '')
    + (canApply
      ? `<div class="nego-redline">${structured || e(proposed)}</div>`
      : `<p style="font-family:var(--n-font-ui);font-size:var(--t-body);color:var(--n-ink-soft);margin:0">${note ? i18t('ng_no_wording_note_is_all') : i18t('ng_no_wording_change')}</p>`);
  pop.insertBefore(body, pop.querySelector('header').nextSibling);
  const foot = document.createElement('footer');
  foot.innerHTML = `
    ${canApply ? `<button type="button" data-ai-apply class="ui-btn ui-btn-primary" style="font-size:var(--t-meta)">${i18t('ng_apply_redline')}</button>` : ''}
    <button type="button" data-ai-cancel class="ui-btn" style="font-size:var(--t-meta)">${i18t('act_cancel')}</button>
    <span style="flex:1"></span>
    <span style="font-family:var(--n-font-ui);font-size:var(--t-label);color:var(--n-ink-soft);align-self:center">${i18t('ng_nothing_changed_yet')}</span>`;
  pop.appendChild(foot);
  place();
  foot.querySelector('[data-ai-cancel]').addEventListener('click', () => pop.remove());
  foot.querySelector('[data-ai-apply]')?.addEventListener('click', async () => {
    const btn = foot.querySelector('[data-ai-apply]');
    btn.disabled = true; btn.textContent = 'Filing…';
    try{
      /* Filed as a tracked change like any other proposal — same model, same
         fingerprint, same chain. A suggestion that arrived from a model is not
         a different KIND of change and must not get a private path into the
         document. */
      const html = window.negoRichFromLines ? negoRichFromLines(proposed) : `<p>${e(proposed)}</p>`;
      const ch = await negoEditClause(c, clauseId, html, {
        side, author: opts.by,
        note: `Copilot — ${action.label.replace(/^\S+\s/, '')}` });
      if (!ch){ btn.disabled = false; btn.textContent = 'Apply redline';
        if (window.toast) toast(i18t('ng_wording_matches')); return; }
      if (opts.persist !== false && window.persist) persist(c);
      if (window.toast) toast(`#${ch.id} filed from the Copilot — it is a proposal until the other side answers it`);
      pop.remove();
      if (typeof again === 'function') again();
    }catch(err){
      btn.disabled = false; btn.textContent = 'Apply redline';
      if (window.toast) toast(`Could not file that change: ${(err && err.message) || err}`, 'err');
    }
  });
}

if (typeof window !== 'undefined') Object.assign(window, {
  negoRiskOf, negoBatchSplit, negoBulkState, negoBatchConfirm, NEGO_AI_ACTIONS,
  negoAiPropose, negoLinkedBarHtml, negoModeHtml
});

/* ============================================================
   READING A HIGHLIGHT — the Range, not the string it prints to
   ============================================================
   `sel.toString()` was the whole of what a selection used to hand on, and
   everything downstream was an attempt to find that string again in a clause
   the reader could plainly see it in. It fails in both directions at once, and
   the failures are not exotic — they are the ordinary shapes of a contract:

     the screen shows what the record does not — the clause HEADING, the
       "#3 · Your ask" tag, and the hover toolbar, all of which sit inside the
       clause's own box and all of which a drag from above the first word
       sweeps straight into the string;
     the record holds what the screen does not — the list markers richToText
       prints ("a. ", "2.1. ", "• "), which the browser draws as ::marker and
       no selection can contain;
     and the same string appears twice — "thirty (30) days" for invoices and
       again for a cure period — where a bare indexOf always answers the first,
       so a redline lands on wording nobody pointed at and nothing about the
       result looks wrong.

   So the Range is read while it is still live, and what travels on is what the
   Range knew: the wording with the page's furniture taken out of it, the
   readings that make sense against a clause carrying a change, WHICH occurrence
   of the phrase was under the cursor, and which clauses genuinely have words in
   the highlight — not merely which ones a boundary happens to touch. */
const _NEGO_SEL_BLOCK = new Set(['P', 'DIV', 'LI', 'OL', 'UL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'BLOCKQUOTE', 'PRE', 'TABLE', 'TR', 'TD', 'TH']);
/* THE PAGE'S FURNITURE IS NOT THE CONTRACT. Every one of these renders inside
   `[data-clause]` and none of it is wording anybody negotiated: the heading is
   the document's own (and is stored apart from the clause body, so including it
   guarantees a miss), the ask tag, the badge and the status notes are
   marginalia about the clause, and the toolbar is a control. They are cut from
   the reading, not from the page.

   `data-nego-chrome` is the explicit way to say so, and the clause headings
   carry it because they cannot be told apart by shape: the workbench heads a
   clause with h4.rl-clause-h, the room with a bare h2, and a clause BODY under
   redline legitimately renders sub-headings of its own (redlineOpsBlocksHtml
   emits h4.rl-line for them) which ARE stored wording and must not be cut. A
   rule guessing from the tag name would take those with it. */
const _NEGO_SEL_CHROME = '[data-nego-chrome],.nego-tool,.rl-asktag,.nego-badge,'
  + '.rl-cp-pill,.rl-cp-src,'
  + '.nego-note,.rl-clause-h,.nego-edit-bar,[data-nego-editor],button,input,textarea,select';
/* One reading of a node's wording. `mode` says how to treat tracked marks:
   'baseline' keeps struck wording and drops inserted (what the round baseline
   still holds), 'current' does the reverse, and null takes the page at its
   word. Block edges emit a newline so two paragraphs cannot run their last and
   first words together into a phrase that is in no document anywhere. */
function _negoNodeText(node, mode){
  let out = '';
  const walk = n => {
    if (!n) return;
    if (n.nodeType === 3){ out += String(n.nodeValue || ''); return; }
    /* A cloned Range arrives as a DocumentFragment (11), never an element, so
       the walk has to enter one — reading only elements answered "" for every
       selection ever made and made every passage unmatchable. */
    if (n.nodeType === 11 || n.nodeType === 9){
      for (const ch of Array.from(n.childNodes)) walk(ch);
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = n.tagName;
    if (tag === 'BR'){ out += '\n'; return; }
    try { if (n.matches && n.matches(_NEGO_SEL_CHROME)) return; } catch (e){}
    const cls = n.classList;
    const isIns = tag === 'INS' || !!(cls && cls.contains('nego-ins'));
    const isDel = tag === 'DEL' || !!(cls && cls.contains('nego-del'));
    if (mode === 'baseline' && isIns) return;
    if (mode === 'current' && isDel) return;
    const block = _NEGO_SEL_BLOCK.has(tag);
    if (block && out && !out.endsWith('\n')) out += '\n';
    for (const ch of Array.from(n.childNodes)) walk(ch);
    if (block && out && !out.endsWith('\n')) out += '\n';
  };
  walk(node);
  return out;
}
/* The part of `range` that lies inside `el`, or null if the two do not really
   overlap. "Really" is the load-bearing word: a drag that overshoots into the
   margin below a clause leaves its end at offset 0 of the NEXT one, touching it
   without selecting a character of it, and reading that as a second clause is
   what refused a single-clause highlight as spanning two. */
function _negoRangeIn(range, el){
  try{
    const doc = el.ownerDocument;
    const full = doc.createRange();
    full.selectNodeContents(el);
    const r = range.cloneRange();
    if (r.compareBoundaryPoints(1, full) <= 0) return null;   // this.end ≤ el.start
    if (r.compareBoundaryPoints(3, full) >= 0) return null;    // this.start ≥ el.end
    if (r.compareBoundaryPoints(0, full) < 0) r.setStart(full.startContainer, full.startOffset);
    if (r.compareBoundaryPoints(2, full) > 0) r.setEnd(full.endContainer, full.endOffset);
    return r.collapsed ? null : r;
  }catch(e){ return null; }
}
/* Which occurrence of this wording the highlight sits on, counted over what the
   SCREEN shows — because that is the thing the reader was looking at when they
   chose. Everything before the selection's start, inside the clause, is read
   the same way the passage itself is read, and the answer is how many complete
   copies of the phrase are already behind it. */
function _negoOccurrenceIn(range, clauseEl, needle){
  try{
    const want = window.negoNormalizeText ? negoNormalizeText(needle) : String(needle || '').trim();
    if (!want) return 0;
    const before = clauseEl.ownerDocument.createRange();
    before.selectNodeContents(clauseEl);
    before.setEnd(range.startContainer, range.startOffset);
    const seen = window.negoNormalizeText
      ? negoNormalizeText(_negoNodeText(before.cloneContents(), null))
      : _negoNodeText(before.cloneContents(), null);
    let n = 0;
    for (let i = seen.indexOf(want); i >= 0; i = seen.indexOf(want, i + 1)) n++;
    return n;
  }catch(e){ return 0; }
}
/* Everything the highlight knows about itself, read off the live Range.
   `root` bounds the search for clauses — the working pane, never the document,
   so a stray match in the baseline pane cannot be counted as a second clause. */
function negoReadPassage(range, root){
  const out = { text: '', readings: [], occurrence: 0, hasMarks: false,
    clauses: [], clauseIds: [], parts: [], multiRange: false };
  if (!range) return out;
  let frag = null;
  try { frag = range.cloneContents(); } catch (e){ return out; }
  const read = mode => _negoNodeText(frag, mode).replace(/[ \t]+\n/g, '\n').trim();
  out.text = read(null);
  /* The two readings that make a clause under change findable at all. Offered
     only when they DIFFER from what the page shows — a clean clause has one
     reading and three copies of it would just be three attempts at the same
     lookup. */
  for (const mode of ['baseline', 'current']){
    const t = read(mode);
    if (t && t !== out.text) out.readings.push(t);
  }
  /* A mark with no words of its own is not wording under change: a highlight
     that stops exactly where an insertion begins clones an empty <ins>, and
     counting it announced pending edits on a selection that contained none. */
  try{
    out.hasMarks = !!(frag.querySelectorAll && [...frag.querySelectorAll(
      'ins, del, .nego-ins, .nego-del, [data-change-id]')]
      .some(n => String(n.textContent || '').trim()));
  }catch(e){}
  const scope = root && root.querySelectorAll ? root : null;
  if (scope){
    for (const el of scope.querySelectorAll('[data-clause]')){
      const r = _negoRangeIn(range, el);
      if (!r) continue;
      const frag2 = r.cloneContents();
      const own = _negoNodeText(frag2, null).replace(/[ \t]+\n/g, '\n').trim();
      if (!own) continue;                              // touched, not selected
      out.clauses.push(el);
      out.clauseIds.push(el.getAttribute('data-clause'));
      /* THE HIGHLIGHT'S SHARE OF THIS CLAUSE, kept per clause. A span that runs
         across blocks is not one passage to be found in one place: it is a head,
         some whole middles and a tail, and each end has to be located in its own
         clause before any of it can be spliced. */
      const part = { clauseId: el.getAttribute('data-clause'), text: own, readings: [],
        occurrence: _negoOccurrenceIn(r, el, own) };
      for (const mode of ['baseline', 'current']){
        const t = _negoNodeText(frag2, mode).replace(/[ \t]+\n/g, '\n').trim();
        if (t && t !== own) part.readings.push(t);
      }
      out.parts.push(part);
    }
  }
  if (out.clauses.length) out.occurrence = _negoOccurrenceIn(range, out.clauses[0], out.text);
  return out;
}
if (typeof window !== 'undefined') Object.assign(window, { negoReadPassage, _negoNodeText });

/* ---- THE ACKNOWLEDGEMENT IS PER CONTRACT AND PER SET ----
   Answering "send the rest" must not become a standing permission: file a new
   change, put it in a review, press send again, and the question has to be
   asked again. Keyed on the ids actually waiting, so any change to that set
   re-asks. Held in memory only — a decision this cheap to re-ask is not worth
   persisting, and a stored one would outlive the reason it was given. */
let _rlSendAck = {};
const _rlAckKey = (c, warn) => String(c && c.id) + '|' + (warn.ids || []).slice().sort().join(',');
const _rlSendAcked = (c, warn) => _rlSendAck[_rlAckKey(c, warn)] === true;
const _rlAckSend = (c, warn) => { _rlSendAck[_rlAckKey(c, warn)] = true; };

/* Three answers, because there are three sensible things to do and a yes/no
   dialog would force the useful one to be spelled out in prose instead. */
function reviewConfirmSend(c, warn, handlers){
  const e = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  if (!window.openModal){ handlers.onRest && handlers.onRest(); return; }
  openModal(`
    <div style="padding:18px 20px var(--s-4)">
      <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 6px">${e(i18t('rv_warn_title'))}</h2>
      <p style="font-size:var(--t-body);line-height:1.6;color:var(--color-neutral-700);margin:0 0 var(--s-3)">${e(warn.text)}</p>
      <ul style="list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:var(--s-1)">
        ${warn.ids.map(id => `<li style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--color-neutral-700)">#${e(id)}</li>`).join('')}
      </ul>
      <div style="display:flex;gap:var(--s-2);justify-content:flex-end;flex-wrap:wrap">
        <button id="rv-warn-wait" class="ui-btn">${e(i18t('rv_warn_wait'))}</button>
        <button id="rv-warn-rest" class="ui-btn ui-btn-primary"${warn.restIds.length ? '' : ' disabled'}>${
          e(i18tn('rv_warn_send_rest', warn.restIds.length, { n: warn.restIds.length }))}</button>
      </div>
    </div>`, { maxWidth: '30rem' });
  document.getElementById('rv-warn-wait')?.addEventListener('click', () => {
    closeModal(); handlers.onWait && handlers.onWait();
  });
  document.getElementById('rv-warn-rest')?.addEventListener('click', () => {
    closeModal(); handlers.onRest && handlers.onRest();
  });
}

function wireNegotiationTab(c, opts = {}){
  const side = opts.side || 'owner';
  const host = document.getElementById(opts.hostId || 'nego-tab');
  if (!host) return;
  /* SCOPED TO THIS MOUNT, and it has to be.

     The counterparty's page carries TWO copies of this component: the room over
     the window, and the embedded tab underneath it that the parity test diffs
     the two sides against. Both mount the same element ids, and every wiring
     here used document.getElementById — which returns the FIRST match in the
     document, always the embedded one. So on their page the room's Accept All,
     Reject All, the index drawer, the export and the per-change reply boxes
     were all wired to a hidden copy and did nothing when pressed. The controls
     the reader could actually see had no handlers on them at all.

     Every lookup below goes through the mount this call is wiring. */
  const byId = id => negoPick(host, id);
  /* Repaint whatever is actually mounted. In the room that is the room —
     re-rendering the embedded tab instead would quietly replace a full-window
     mode with a panel. */
  const again = () => {
    if (opts.onChange) opts.onChange(c);
    if (typeof opts.rerender === 'function') opts.rerender();
    else renderNegotiationTab(c, opts);
  };
  /* The same test the working pane's own clause tools use (`editable`, in
     negoDocHtml): the baseline is a reference, and a reader with no right to
     propose must not be offered a menu that ends in a proposal. */
  const editableRoom = !opts.readonly && opts.canEdit !== false;
  /* The internal review's own clicks — the verdict buttons on each card and the
     banner's ask/return/cancel. ONE wiring function, shared with the workbench
     and delegated from the host, so a repaint cannot strand a listener and a
     card painted after this call is still live. Never on a read-only mount:
     Counterparty View is a window, not a chair, and an internal review is the
     last thing that seat may touch. */
  if (editableRoom && window.reviewWireCards) reviewWireCards(c, host, { repaint: () => again() });
  /* ---- THE LOCK, NOT ONLY THE SIGN ----
     A read-only mount (Counterparty View, an executed contract, a signing
     link) renders no verbs — but hiding buttons is the sign on the door, and
     the executed-contract work taught that the lock has to exist separately:
     a stray handler, a keyboard path or next year's wiring must find a
     refusal here, not a live engine. */
  const lockedOut = () => {
    if (!opts.readonly) return false;
    if (window.toast) toast(i18t('ng_view_only_no_actions'), 'err');
    return true;
  };
  /* THE REVIEWER'S POSTURE, ENFORCED AND NOT MERELY UNDRAWN. The cards stop
     offering Accept and Reject while a review is open with this reader, but a
     hidden verb is a decision about pixels; this is the decision about the
     record. Answering the counterparty settles their ask and travels on the
     next round, which is precisely what a person who has taken on a review
     does not do here until they hand it back. */
  /* TWO POSTURES, ONE DOOR. Not being the lead of this negotiation has exactly
     the same consequence as being mid-review — answering the counterparty is
     reaching them — so the two refusals are asked in one place and print their
     own sentence. The desk is asked first because it is the standing state:
     "you are not on this negotiation" explains more than "hand your review
     back" to somebody who has no review. */
  const postureOut = () => {
    if (opts.side === 'counterparty' || opts.readonly) return false;
    let msg = null;
    if (typeof window.deskSendBlock === 'function'){
      try{ msg = deskSendBlock(c); }catch(_){ msg = null; }
    }
    if (!msg && typeof window.reviewActorBlockMessage === 'function'){
      try{ msg = reviewActorBlockMessage(c); }catch(_){ return false; }
    }
    if (!msg) return false;
    if (window.toast) toast(msg, 'err');
    return true;
  };
  const decide = (id, status, extra) => {
    if (lockedOut() || postureOut()) return;
    const ch = negoResolve(c, id, status, { side, by: opts.by, ...(extra || {}) });
    if (!ch) return;
    delete _negoRedeciding[id];   // answered again — the card settles again
    _negoActive = id;
    if (opts.persist !== false && window.persist) persist(c);
    /* THE OTHER SIDE HAS TO BE ABLE TO SEE THIS, and their copy of the
       negotiation is not this one. Whoever mounted this component says what
       that costs on their side — the owner catches up the live link, the
       counterparty has no link to catch up. See openNegotiationOwnerRoom. */
    if (typeof opts.onDecided === 'function') opts.onDecided(c, ch);
    if (window.toast){
      if (status === 'accepted') toast(`#${id} accepted — merged into the clean text · ${negoShortHash(ch.hash)} filed to the audit trail`);
      else if (status === 'rejected') toast(`#${id} rejected — the clause reverts to the baseline and the ask travels back as an open point`);
      else toast(`#${id} reopened — back to pending`);
    }
    again();
  };

  /* ---------- 2.1/2.2: editing a clause, adding one, deleting one ----------
     Every one of these files (or updates) a change through the model and then
     repaints. Nothing here writes to the document: a proposal is a proposal
     until the other side decides it, on this surface exactly as on every
     other. */
  const fileAndRepaint = async (fn, msg, onNothing) => {
    if (lockedOut()) return;
    const ch = await fn();
    /* A refusal must land where the press happened. The corner toast remains
       the fallback, but a caller with a bar to write on says it there —
       "nothing filed" delivered off-screen is how a live button reads as a
       dead one (the fault that opened the formatting-only work order). */
    if (!ch){
      if (typeof onNothing === 'function') onNothing();
      else if (window.toast) toast(i18t('ng_nothing_changed_no_fp'));
      return;
    }
    _negoActive = ch.id;
    if (window.negoInvalidateVerification) negoInvalidateVerification(c);
    if (opts.persist !== false && window.persist) persist(c);
    if (window.toast) toast(msg(ch));
    again();
    /* ---- AND THEN IT ASKS FOR A NOTE (owner-ruled 31 Aug 2026) ----
       AFTER the filing, the persist and the repaint, deliberately: the change
       exists on the record before the dialog is drawn, so nothing a reader does
       with the dialog — skip it, dismiss it, close the tab — can be the
       difference between a redline existing and not. rlNoteAskAfterFile decides
       whether to ask at all; this is the press arriving there. */
    rlNoteAskAfterFile(c, ch, { side, author: opts.by, persist: opts.persist })
      .then(out => { if (out) again(); });
  };

  /* ---------- Ask Copilot ----------
     Opens the application's OWN Copilot, unchanged. The room only has to get
     out of its way (the body class above lifts it over this screen) and tell it
     which negotiation is being looked at — aiChatContext() picks that up from
     negoRoomContract(). */
  /* ---------- the version selectors ----------
     Changing either one repaints the whole screen, because which versions are
     shown decides what every pane and the index contain — including whether
     there is anything to decide at all. */
  host.querySelectorAll('[data-nego-vsel]').forEach(sel => sel.addEventListener('change', () => {
    const which = sel.getAttribute('data-nego-vsel');
    const pair = negoComparePair();
    negoSetComparePair(which === 'left' ? sel.value : pair.left,
      which === 'right' ? sel.value : pair.right);
    _negoActive = null;
    again();
  }));
  host.querySelector('#nego-cmp-exit')?.addEventListener('click', () => {
    negoSetComparePair('baseline', 'working');
    _negoActive = null;
    again();
  });
  /* Clean read. A repaint and nothing else — no model call, no persist, no
     decision — so the round is in exactly the state it was in either way.

     Through `byId`, not host.querySelector('#…'): the counterparty's page
     mounts this component twice, and a `#id` selector is answered from the
     document's id map, so scoping it to the room returns null rather than the
     room's own button. See negoPick. */
  byId('nego-clean-toggle')?.addEventListener('click', () => { negoSetCleanView(!_negoClean); again(); });
  /* A comparison row scrolls both panes to the clause, which is the only verb
     this mode has. */
  host.querySelectorAll('[data-nego-cmp-row]').forEach(row => {
    const go = () => {
      const id = row.getAttribute('data-nego-cmp-row');
      for (const prefix of ['nb-', 'nw-']){
        const el = byId(prefix + negoDomId(id));
        if (el){ el.classList.add('flash'); if (el.scrollIntoView) el.scrollIntoView({ block: 'center' }); }
      }
    };
    row.addEventListener('click', go);
    row.addEventListener('keydown', e => {
      if (e.target !== row) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); go();
    });
  });

  /* The clause library, moved here from the Docs page. It is OUR preferred
     wording — the counterparty never sees the playbook, which is why the
     button is only on the owner's bar. Picking one files a tracked change
     through applyClauseRedline, so library wording is proposed and decided like
     anything else rather than appearing in the document unannounced. */
  host.querySelector('#nego-insert-lib')?.addEventListener('click', async () => {
    if (typeof window.openClausePicker !== 'function'){
      if (window.toast) toast(i18t('ng_library_unavailable'), 'err');
      return;
    }
    openClausePicker(c, { onPick: async cl => {
      const after = _negoActive
        ? (negoChangeById(c, _negoActive) || {}).clauseId
        : null;
      /* THE STANDARD CLAUSE JOINS THIS PAPER, so its heading is written the way
         this paper writes headings — the same reading the playbook's own insert
         asks, and the reason it is one function rather than three. */
      const heading = window.clauseHeadingFor
        ? clauseHeadingFor(cl.name, (window.negoClauseList ? negoClauseList(c) : []))
        : cl.name;
      const ch = await negoInsertClause(c, after || null,
        { headingText: heading, bodyHtml: window.textToRich ? textToRich(cl.preferred) : `<p>${_ne(cl.preferred)}</p>` },
        { side, author: opts.by,
          summary: `Preferred wording inserted from the playbook — ${cl.name}` });
      if (!ch){ if (window.toast) toast(i18t('ng_clause_not_inserted'), 'err'); return; }
      _negoActive = ch.id;
      if (window.negoInvalidateVerification) negoInvalidateVerification(c);
      if (opts.persist !== false && window.persist) persist(c);
      if (window.toast) toast(`#${ch.id} filed — “${cl.name}” proposed from the library`);
      again();
    } });
  });

  const copBtn = host.querySelector('#nego-copilot');
  if (copBtn) copBtn.addEventListener('click', () => {
    if (typeof window.openAI !== 'function'){
      if (window.toast) toast(i18t('ng_copilot_unavailable'), 'err');
      return;
    }
    openAI();
  });

  /* The setup strip's Save and "More options…" were wired here. The strip is
     gone from this page — the address is a Key terms row — so there is nothing
     to bind. opts.onSetCounterparty is still accepted and still honoured by the
     owner adapter; it simply has no control on THIS surface any more. */

  /* THE HAND-OFF, wired wherever the readiness banner renders. This lived only
     in the retired room's chrome (openNegotiationRoom), so on the workbench
     page — the only owner surface left — the banner's one button, "Issue a
     signing link", did nothing. Found in the cross-party audit: an aligned
     negotiation could not be moved to signature from the page it was
     negotiated on. Guarded per element because the room's own wiring may run
     on the same host. */
  const issue = byId('nego-issue-signing');
  if (issue && !issue.dataset.negoWired){
    issue.dataset.negoWired = '1';
    issue.addEventListener('click', () => {
      if (typeof opts.onIssueSigningLink === 'function') opts.onIssueSigningLink(c);
      else if (window.toast) toast(i18t('ng_action_unavailable'), 'err');
    });
  }

  /* ---- WHAT IS TYPED IN THE NAME BOX IS KEPT ----
     Bound wherever the box is mounted — the room, the workbench, the portal
     all render it through negoNameFieldHtml — and guarded so a repaint cannot
     stack listeners on the same input. Saved on the way out of the field
     rather than on every keystroke: a half-typed name is not an answer. */
  const nameBox = host.querySelector('#nego-cp-name');
  /* dataset guarded for the same reason the rest of this file guards it: the
     node stage's elements do not carry one. */
  if (nameBox && nameBox.dataset && !nameBox.dataset.negoNameWired){
    nameBox.dataset.negoNameWired = '1';
    const keep = () => negoRememberName(nameBox.value);
    nameBox.addEventListener('change', keep);
    nameBox.addEventListener('blur', keep);
  }

  const send = host.querySelector('#nego-send');
  if (send) send.addEventListener('click', () => {
    /* REFUSED HERE AS WELL AS AT THE DOOR, and the repetition is deliberate.
       core.js holds the send itself — the share dialog and the round-send both
       land on reviewSendBlock, and nothing gets out past it. But this button
       opens a DIALOG, and a person who fills in an address, writes a covering
       note and presses Send only to be told the wording is still with their
       boss has been walked to the end of a corridor with no door. Said before
       the corridor, not after it. */
    if (window.deskSendBlock){
      let msg = null; try{ msg = deskSendBlock(c); }catch(_){ msg = null; }
      if (msg){ if (window.toast) toast(msg, 'err'); return; }
    }
    if (window.reviewGateMessage){
      let msg = null; try{ msg = reviewGateMessage(c); }catch(_){ msg = null; }
      if (msg){ if (window.toast) toast(msg, 'err'); return; }
    }
    /* ---- AND THE SOFTER CASE: SOME OF THIS IS STILL BEING LOOKED AT ----
       With the rule off, sending wording that is sitting with a colleague is
       allowed and is almost always a mistake — the review comes back the next
       morning with a verdict on something the counterparty has already read.
       So it asks, once, and names who is holding it. Answering "send the rest"
       leaves those changes behind exactly as a hold would; there is no third
       state and nothing new to remember. */
    if (window.reviewSendWarning){
      let warn = null; try{ warn = reviewSendWarning(c); }catch(_){ warn = null; }
      if (warn && !_rlSendAcked(c, warn)){
        reviewConfirmSend(c, warn, {
          onRest: () => { _rlAckSend(c, warn); send.click(); },
          onWait: () => {},
        });
        return;
      }
    }
    /* WE ALREADY KNOW WHERE THIS GOES. With an address recorded, the send is a
       send — the same one-press act the counterparty's postbox has always been.
       Without one it still appears, and still works: it opens the dialog, which
       collects the address it needs. What must never happen is the press doing
       nothing, which is the dead end this whole thread began with. */
    /* ASKED AT PRESS TIME, not at paint time. opts.contact is resolved once
       when this screen renders, and the share list it reads may still have
       been in flight then — so a first press could open the dialog for an
       address the record already held, and the second press would not. The
       fresh answer wins; the painted one remains the fallback for callers
       that pass a contact without the resolver being reachable. */
    const live = (window.counterpartyContact && window.cachedShares)
      ? counterpartyContact(c, cachedShares(c)) : null;
    const contact = (live && live.email) ? live : opts.contact;
    if (side === 'owner' && contact && contact.email
        && typeof opts.onSendDirect === 'function'){
      opts.onSendDirect(c);
      return;
    }
    /* "Send to the counterparty" takes the SAME ROUTE as Share Link: the
       summary of what changed, then the send form. It used to flip the turn
       and tell nobody — the contract said "waiting on Nordfrakt" while nothing
       had left the building.

       So the turn moves in the onSent callback and nowhere else. Close the
       dialog, or fail to send, and it is still your turn — because it is.
       Handing over rides the existing share/response routes; there is no new
       endpoint here and deliberately never will be. */
    const to = side === 'owner' ? 'counterparty' : 'owner';
    const who = to === 'counterparty' ? (c.counterparty || 'the counterparty') : 'the owner';
    const shareOpts = {
      handOver: true,
      onSent: info => {
        if (!negoHandOver(c, { to, by: opts.by })) return;
        if (opts.persist !== false && window.persist) persist(c);
        if (window.toast) toast(info && info.emailSent
          ? `Sent to ${who} — it is now their turn`
          : `Link created for ${who} — it is now their turn. Send them the link if it was not emailed.`);
        again();
      },
    };
    if (typeof opts.onShareLink === 'function') opts.onShareLink(c, shareOpts);
    else if (typeof window.openShareModal === 'function') openShareModal(c, shareOpts);
    else if (window.toast) toast(i18t('ng_sharing_unavailable'), 'err');
  });

  /* ---- ONE EDITOR, TWO HOMES (owner-asked 16 Aug 2026: build the editing
     inside the panel) ----
     The clause panel does not get an editor of its own. It gets THIS one,
     opened on a different element. Everything below — the formatting bar, the
     two-step save, the reason question and its Skip, the fingerprint, every
     refusal — is the same code in both homes, so the two can never come to
     disagree about what filing a change costs.

     The DIFFERENCE is three lines: which element the editor replaces, and
     therefore where the writing appears. data-nego-edit still opens it on the
     clause in the document; data-rl-cp-edit opens it in the panel, on the
     "As it stands" wording, which IS a copy of the standing clause — so the
     panel's ＋ is literally "copy what stands into a draft and let me work on
     it", with no second reading of what "what stands" means (both are
     negoClauseNowById; see openOn below). */
  host.querySelectorAll('[data-nego-edit],[data-rl-cp-edit]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const inPanel = b.hasAttribute('data-rl-cp-edit');
    const clauseId = b.getAttribute(inPanel ? 'data-rl-cp-edit' : 'data-nego-edit');
    const block = inPanel
      ? host.querySelector(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${clauseId}"]`)
      : host.querySelector(`.nego-pane.working .nego-clause[data-clause="${clauseId}"]`);
    if (!block || block.querySelector('.nego-edit-bar')) return;
    /* THE WHOLE BODY, not the first paragraph of it. A clause with nothing
       proposed against it is drawn as its own markup — `<div class="nego-body">`
       around however many paragraphs, lists and tables it has — so reaching for
       `p` found the first paragraph inside it and swapped only that, leaving the
       list and the paragraphs after it stranded below the editor and outside
       what would be saved.

       In the panel the target is the "As it stands" block, which is the same
       wording drawn by the same reading. */
    const body = inPanel ? block.querySelector('.rl-cp-stands')
      : (block.querySelector('.nego-body') || block.querySelector('p'));
    if (!body) return;
    /* ---- WHAT IS ON SCREEN FOR THIS CLAUSE, READ ONCE ----
       Moved above the clause lookup 25 Aug 2026 so the proposed-clause branch
       below can use it. Unchanged otherwise: the ids come off the block the
       renderer drew, never from a search of c.changes, so the editor can only
       ever open on wording the reader is already entitled to see (the wall
       keeps the other side's unsent drafts out of the document). */
    const anchorEl = inPanel
      ? host.querySelector(`.nego-pane.working .nego-clause[data-clause="${clauseId}"]`)
      : block;
    const shownIds = String((anchorEl && (anchorEl.getAttribute('data-nego-card-anchor')
      || anchorEl.getAttribute('data-change'))) || '').split(/\s+/).filter(Boolean);
    /* ---- A CLAUSE THAT IS ONLY PROPOSED (owner-asked 25 Aug 2026: "standard
       clauses added should be editable as well") ----
       An insertClause ask has no clause in the baseline, so negoClauseById
       answers null and this handler used to stop here — which is why a clause
       added from the playbook was the one thing on the paper with no way back
       into it. The ASK supplies the clause instead: its own heading and its own
       proposed wording, which is exactly what the paper and the panel are
       already showing. OUR OWN AND LIVE ONLY, and it must be one of the ids the
       block itself carries — the same wall as everything else here. */
    const meSide = side === 'counterparty' ? 'counterparty' : 'owner';
    const newAsk = shownIds.length
      ? (typeof negoChanges === 'function' ? negoChanges(c) : [])
        .find(x => x && shownIds.includes(x.id) && x.clauseId === clauseId
          && x.changeType === 'insertClause' && x.status === 'pending' && !x.withdrawn
          && x.authorSide === meSide)
      : null;
    /* The clause is edited as the RICH content it is, in place. The old flow
       put the whole document into a <textarea>, which is why headings,
       numbering and tables did not survive being proposed on. */
    const cl = negoClauseById(c, clauseId)
      || (newAsk ? { clauseId, headingText: newAsk.headingText || '',
        text: newAsk.newText || '', bodyHtml: newAsk.bodyHtml } : null);
    if (!cl) return;
    /* ---- THE EDITOR OPENS ON THE WORDING THAT IS ON THE TABLE ----
       Not on the baseline underneath it. This used to read cl.bodyHtml
       unconditionally, and cl is the ROUND BASELINE clause — so a writer who
       filed a redline, then pressed Direct Edit again to change one word of
       it, was handed the ORIGINAL wording back with their proposal nowhere on
       screen. Saving from there re-filed against the baseline and their first
       ask was gone: not refused, not withdrawn, silently overwritten. What
       makes it worse than a lost keystroke is that the document beside the
       editor still showed the redline, so the page disagreed with itself about
       what was being proposed.

       The live pending change is the right base whichever side filed it. On
       our own ask it is our own draft, continued. On theirs it is what a
       counter-proposal actually counter-proposes — the same marked-up wording
       the clause is displaying an inch above — and negoFileChange already
       knows the difference: it revises in place when the same hand comes back
       and stacks a new change when a different one does.

       Only PENDING — a rejected change means the wording stands, and reopening
       the editor on it would edit wording the record does not carry. A proposed
       DELETION carries no replacement wording at all, so it falls through to
       the clause itself. And bodyHtml is not guaranteed on a change (one lifted
       from returned text may have only ops), so the clause stays the floor.

       AND WHAT "THE CLAUSE ITSELF" MEANS WAS WRONG (owner-reported 15 Aug 2026).
       This line used to say "an accepted change is in the baseline already" and
       fall back to the ROUND BASELINE. It is not: adopting a change does not
       move the baseline — only closing the round does — so on a clause with an
       adopted change the editor opened on the wording as it stood BEFORE the
       adoption. Reported from a clause whose governing-law sentence had been
       struck out and agreed: the document read without it and the editor opened
       with it back.

       That was not only a stale reading. Since a filing is now measured against
       the clause as the author was SHOWN it (negoClauseNowById), opening this
       editor and pressing Save without typing anything filed a change proposing
       to put the deleted sentence back — an adopted change quietly reversed by
       a reader who had touched nothing. Reproduced before it was touched.

       So the floor is the clause AS IT STANDS, which is the same reading the
       filing uses and the same wording the document is displaying. On a clause
       with nothing adopted the two are one text, so nothing else moves.

       WHICH change is read off the CLAUSE ITSELF — the id the renderer wrote
       into the block it drew — rather than searched for in the record. The
       record holds changes this page is deliberately not showing: the wall
       keeps the other side's unsent drafts out of the document (see the
       hiddenIds note at negoDocHtml), and a search of c.changes would have
       walked straight past it and opened the editor on wording the reader is
       not entitled to see. Reading the block's own anchor means the editor can
       only ever open on the wording already on the screen. */
    /* The anchor may carry several ids now (one per change on the clause,
       lead first). The editor opens on the wording that is ON SCREEN, which
       is the lead's — so the first pending token wins, exactly the change
       whose marks the block is drawing. */
    /* THE PANEL'S ＋ CONTINUES THE SAME DRAFT THE CLAUSE IS SHOWING (16 Aug
       2026, caught by f144 the day the clause's own editor retired). The
       anchor lives on the DOCUMENT's clause block; the panel body never
       carried one, so in the panel `shownIds` came back empty, onTable came
       back null, and the ＋ — which then carried its own "Continue your draft"
       label, retired 26 Aug 2026 — opened on the standing wording with the
       writer's own ask nowhere on screen —
       f144's original fault, back through the new door. The panel reads the
       clause's OWN anchor rather than growing a copy that could drift: one
       canvas, one wall, one list of what is on screen. */
    const onTable = shownIds.length
      ? (typeof negoChanges === 'function' ? negoChanges(c) : [])
        .find(x => x && shownIds.includes(x.id) && x.status === 'pending'
          && x.changeType !== 'deleteClause' && x.changeType !== 'insertClause')
      : null;
    /* The clause as it currently stands — baseline plus whatever is adopted on
       it — for the reason set out above. Falls back to the baseline reading if
       the model is not loaded, which is the behaviour every stage without it
       had before. */
    const shown = newAsk ? cl
      : ((typeof negoClauseNowById === 'function')
        ? (negoClauseNowById(c, clauseId) || cl) : cl);
    /* On a proposed clause the ask IS the wording on screen, so it is the seed;
       onTable deliberately never matches an insertClause. */
    const openOn = (newAsk && String(newAsk.bodyHtml || '').trim())
      || (onTable && String(onTable.bodyHtml || '').trim())
      || shown.bodyHtml || `<p>${_ne(shown.text)}</p>`;
    const holder = document.createElement('div');
    holder.className = 'nego-editing';
    holder.setAttribute('contenteditable', 'true');
    holder.setAttribute('data-nego-editor', clauseId);
    /* IN THE PANEL ONLY. negoReadPassage resolves which clause a highlight
       belongs to by walking up to the nearest [data-clause]; in the document
       the clause section already carries one, and adding a second inside it
       would give a selection two answers. In the panel there is no such
       ancestor, so the editor is it. */
    if (inPanel) holder.setAttribute('data-clause', clauseId);
    /* Sanitised on the way IN as well as on the way out. Every other surface
       that shows a clause runs its stored markup through sanitizeRich at
       render time — the rule js/richdoc.js states in its own header, because
       the counterparty portal serves people outside the workspace — and this
       one path assigned storage straight into a live element. */
    holder.innerHTML = window.sanitizeRich ? sanitizeRich(openOn) : openOn;
    body.replaceWith(holder);
    /* ---- AND THE CLAUSE'S NAME OPENS WITH ITS WORDING (owner-asked 28 Aug
       2026: "the ability to edit the name of the header") ----
       ONE editor, one press, one record: a heading is part of the clause the
       reader opened, so renaming it is not a second act with a second door and
       there is no second control anywhere on the page. It opens on what is ON
       THE TABLE, exactly as the wording below it does — a pending ask's
       proposed name where there is one, the standing name otherwise — so the
       box never disagrees with the paper an inch away.

       THE PANEL ONLY, and that is a decision rather than an omission. The
       panel is the door the paper's own pencil opens, so this is where a
       reader on the negotiation page arrives. The ROOM's inline editor
       (negoDocHtml, the contract tab) deliberately gets no name box: that
       canvas prints a REBUILT LABEL — number and title, assembled on every
       render — rather than the heading string the document stores, so a box
       over it would be editing something the record does not hold.

       ONLY WHERE THERE IS A HEADING TO RENAME. A clause with none is an upload
       that arrived as a wall of paragraphs, and in that document headings do
       not mark the clauses at all — writing one in would re-segment the whole
       agreement under a reader who asked to change a name. clauseReplaceHeading
       refuses it too, so this is the screen agreeing with the model. */
    const headStands = String((shown && shown.headingText) || (cl && cl.headingText) || '').trim();
    const headOpen = (newAsk ? String(newAsk.headingText || '').trim() : '')
      || (onTable ? String(onTable.headingText || '').trim() : '') || headStands;
    let headEl = null;
    /* ---- AND NOT ON THEIR SEAT (owner-ruled 29 Aug 2026) ----
       The other side may not rename our clauses: the numbering and the
       cross-references that cite them are ours to keep coherent. The WALL is in
       negoFileChange, which every route reaches without passing a screen; this
       is the SIGN, and it is here because a control whose only outcome is a
       refusal is furniture. Their wording box below is untouched — proposing
       new wording is what their page is for — and a rename WE propose still
       draws for them and is still theirs to accept or refuse. */
    const mayName = meSide === 'owner';
    if (inPanel && headStands && mayName){
      const nameEl = block.querySelector('.rl-cp-clname');
      if (nameEl){
        headEl = document.createElement('p');
        headEl.className = 'rl-cp-clname nego-name-edit';
        headEl.setAttribute('contenteditable', 'true');
        headEl.setAttribute('role', 'textbox');
        headEl.setAttribute('spellcheck', 'true');
        headEl.setAttribute('aria-label', i18t('ng_cp_name_edit'));
        headEl.setAttribute('title', i18t('ng_cp_name_edit'));
        headEl.textContent = headOpen;
        nameEl.replaceWith(headEl);
        /* A HEADING IS ONE LINE. The box is contenteditable, so Enter would put
           a break inside a citation string — and the document model writes a
           heading with textContent, so that break would be flattened on the way
           to the record and the box would stop showing what is stored. */
        headEl.addEventListener('keydown', ev => {
          if (ev.key === 'Enter'){ ev.preventDefault(); headEl.blur(); }
        });
      }
    }
    /* The clause says it is being written in, so its hover verbs can stand
       down; the repaint that closes the editor takes the class with it. */
    block.classList.add('is-editing');
    /* ---- THE FORMATTING TOOLBAR, BOTH SIDES ----
       The editor has always been rich — Ctrl+B worked — but a control you
       have to know about is a control half the writers never find, and the
       counterparty portal mounts this same component, so one toolbar serves
       both chairs. mousedown + preventDefault, because a click would take
       the selection (and the formatting command's target) away with it. */
    const fmt = document.createElement('div');
    fmt.className = 'nego-fmt-bar';
    fmt.innerHTML = [
      ['bold', '<b>B</b>', 'Bold'],
      ['italic', '<i>I</i>', 'Italic'],
      ['underline', '<u>U</u>', 'Underline'],
      ['insertUnorderedList', '&#8226;&#8210;', 'Bulleted list'],
      ['insertOrderedList', '1.', 'Numbered list'],
    ].map(([cmd, label, tip]) =>
      `<button type="button" data-nego-fmt="${cmd}" title="${tip}" tabindex="-1">${label}</button>`).join('');
    holder.before(fmt);
    fmt.querySelectorAll('[data-nego-fmt]').forEach(fb => fb.addEventListener('mousedown', ev => {
      ev.preventDefault(); ev.stopPropagation();
      try{ document.execCommand(fb.getAttribute('data-nego-fmt')); }catch(_){ /* an engine without execCommand still has the keyboard */ }
    }));
    /* ---- SAVE IS ONE PRESS ----
       REVERSED IN PLACE 28 Aug 2026, owner-asked: "we need to remove the
       mandate for adding why this change for every change. Users can use the
       notes feature to add notes on changes."

       WHAT STOOD HERE, and its reasoning is the useful part: Save led INTO the
       question — step one the wording, step two "why this change?" — on the
       argument that a reason sitting under the wording as one more optional
       field is a field people scroll past, and that the record then fills with
       changes nobody can explain a round later. Skip was always a visible
       button, so the ANSWER was never mandatory; it was the QUESTION that was
       unavoidable, and that is exactly what the owner has now removed. A pass
       over six clauses cost six extra presses, and the second press is the one
       that made redlining feel like paperwork.

       WHAT IS LOST, SAID OUT LOUD RATHER THAN ABSORBED. `why` TRAVELS — its own
       label said "the other side sees it beside the redline" — and a note does
       not: the composer defaults to Internal on our seat and an internal note
       never leaves the building. So the sentence that explained a redline to
       the counterparty at the moment it was made now has to be typed on
       purpose, in the clause panel's own note box with the switch thrown to
       "Send to them".

       AND THE FIELD IS NOT GONE FROM THE PRODUCT, which is what keeps `why`
       writable at all: the Copilot proposal card still carries it, as one
       optional box that blocks nothing. That was never the mandate and is
       deliberately untouched.

       The FIELD on the record, the fingerprint (which never carried `why`),
       every card that prints one and negoWireWhyClamp are all unchanged — an
       existing change keeps its reason and still shows it. */
    const bar = document.createElement('div');
    bar.className = 'nego-edit-bar';
    const step1 = `<button class="b-save" data-nego-next="${_ne(clauseId)}">${i18t('ng_save_change')}</button>`
      + `<button class="b-cancel" data-nego-cancel="${_ne(clauseId)}">${i18t('act_cancel')}</button>`;
    bar.innerHTML = step1;
    holder.after(bar);
    if (holder.focus) holder.focus();

    const file = () => {
      /* ---- ONE EDITOR, TWO KINDS OF ASK ----
         A proposed clause is revised through negoReviseInsert, which files the
         SAME clauseId back through the same funnel so the ask keeps its id and
         its place and the previous wording goes onto revisions[]. Everything
         else about this bar — the one press, the fingerprint, every refusal —
         is the same code either way.

         NO `why` IS PASSED, so the funnel files without one exactly as Skip
         always did. The option is still on the funnel for the Copilot card,
         which is the one surface that still writes a reason. */
      /* The name, where a box for it was drawn. Absent, both funnel doors read
         it as "leave the heading as it is" rather than as "clear it", which is
         what every caller written before this relies on. */
      const headingText = headEl
        ? String(headEl.textContent || '').replace(/\s+/g, ' ').trim() : null;
      const headOpt = headingText == null ? {} : { headingText };
      fileAndRepaint(() => (newAsk
        ? negoReviseInsert(c, clauseId, { bodyHtml: holder.innerHTML, ...headOpt },
          { side, author: opts.by })
        : negoEditClause(c, clauseId, holder.innerHTML,
          { side, author: opts.by, ...headOpt })),
        ch => `#${ch.id} filed — ${ch.summary}`,
        /* Nothing changed — neither words nor formatting. Said IN the bar,
           beside the button that was pressed: the toast alone made File
           change read as broken (formatting-only work order, FO-5). */
        () => {
          let n = bar.querySelector('.nego-nofile');
          if (!n){ n = document.createElement('span'); n.className = 'nego-nofile'; bar.appendChild(n); }
          n.textContent = i18t('ng_nothing_changed_inline');
          if (window.toast) toast(i18t('ng_nothing_changed_no_fp'));
        });
    };
    const wire = () => {
      bar.querySelector('[data-nego-cancel]')?.addEventListener('click', ev => { ev.stopPropagation(); again(); });
      /* ONE PRESS FILES. `data-nego-next` kept its name because half a dozen
         checks and both browser files reach the Save button by it, and a
         rename would cost those and buy nothing — what changed is where it
         goes. `data-nego-save`, `data-nego-skip`, `data-nego-back` and
         `data-nego-reason` are STALE — flag any mention. */
      bar.querySelector('[data-nego-next]')?.addEventListener('click', ev => { ev.stopPropagation(); file(); });
    };
    wire();
  }));

  /* No [data-nego-del] wiring: both delete buttons are gone — see the clause
     toolbars. Deletion CHANGES remain first-class in the engine; only the
     buttons that originated them were removed. */

  /* A BADGE IN THE MARGIN NARROWS THE INDEX TO ITS OWN CHANGE.

     Focusing already scrolled the index to the card and lit it. On a document
     with thirty changes that is not enough: the reader clicks #12, lands on
     #12, and is still looking at a column of twenty-nine other conversations
     they have to keep their place in. Clicking the badge now also FILTERS —
     one change, its thread, and a way back — and clicking the same badge again
     clears it, so the narrowing is never a state you can get stuck in. */
  negoWireWhyClamp(host);
  host.querySelectorAll('[data-badge]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-badge');
    if (_negoLinked === id){ _negoLinked = null; _negoOnly = false; }
    else { _negoLinked = id; }
    if (_negoLinked){
      _negoThreads[id] = true;              // the conversation is the point of asking
      negoMarkThreadSeen(seenScope, id);
    }
    /* REPAINT FIRST, THEN FOCUS. negoFocus lights the clause in both panes and
       the card in the index by setting classes on live nodes; repainting after
       it rebuilds those nodes and throws the highlight away. Narrowing the
       index has to redraw it, so the order is forced: redraw, then light up
       what the reader just clicked. */
    again();
    negoFocus(c, id, 'badge');
  }));
  byId('nego-only')?.addEventListener('click', () => { _negoOnly = !_negoOnly; again(); });
  byId('nego-unfilter')?.addEventListener('click', () => { _negoLinked = null; _negoOnly = false; again(); });

  /* ============================================================
     HIGHLIGHT A PASSAGE, ASK FOR SOMETHING TO BE DONE TO IT
     ============================================================
     The menu is offered on the WORKING pane only. The baseline is a reference
     and the other side's turn is not ours to rewrite, so offering to redraft
     either would end at a proposal we are not allowed to file.

     Bound on mouseup and on keyup, not on selectionchange: the latter fires on
     every character of a drag and would flicker a menu under the pointer the
     whole way across the clause. */
  if (editableRoom){
    /* ---- AND THE CLAUSE PANEL'S OPEN EDITOR IS A THIRD LEGAL PANE ----
       (owner-asked 16 Aug 2026: "Leave the feature where you can highlight a
       sentence and it allows you to edit with copilot and moves you to the
       copilot assistant chat bot.")

       NARROWED TO THE EDITOR ITSELF, not to the panel. The panel also prints
       the history — other people's asks, with their marks on — and a highlight
       there would be offered a redraft of a settled record. Only wording the
       reader is actively writing qualifies, which is also the only wording a
       proposal could be filed from.

       ONE MENU, NOT A SECOND ONE. It routes into the same opts.selMenu the
       document's own selections use, so the passage reaches the Copilot the
       same way with the same refusals. This file's own rule: "a second menu
       would be a second set of refusals to keep in step." */
    const paneSel = '.nego-pane.working .nego-doc, .nego-doc[data-nego-working], '
      + '.rl-cp-src [data-nego-editor]';
    const openSelMenu = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.isCollapsed){ _negoKillSelMenu(); return; }
      const anchorNode = sel.anchorNode;
      const pane = anchorNode && anchorNode.nodeType === 1
        ? anchorNode.closest(paneSel)
        : (anchorNode && anchorNode.parentElement ? anchorNode.parentElement.closest(paneSel) : null);
      if (!pane || !host.contains(pane)){ _negoKillSelMenu(); return; }
      /* ---- NOTHING IS EDITED FROM THE PAPER ON THE NEGOTIATION PAGE ----
         (owner-asked 19 Aug 2026: "there should not be possibility to edit the
         contract while on the contract in the left hand side. Only way to edit
         is to click edit and the edit happens in the panel on the right.")

         THE HIGHLIGHT ITSELF STAYS — deliberately, and the owner asked for it:
         selecting words is how anybody copies wording out of a contract, and
         taking that away costs something real to buy nothing. What goes is the
         MENU: the gesture is reading, not a door, and the one door is the green
         Edit pill on the clause.

         SCOPED BY THE CANVAS AND BY THE SEAT. `.rl-doc` is the negotiation
         page's own paper (the room's two-pane view keeps its .nego-pane.working
         markup and has no clause panel to send anybody to, so it is untouched),
         and the panel's editor is exempt because that is where the writing now
         happens — a highlight there still hands one sentence to the Copilot.
         The counterparty's seat is left exactly as it was: their mount already
         passes a no-op menu and noAi, so they never saw one, and skipping this
         guard for them keeps even the front-matter notice below unchanged. */
      const inCpEditorPane = !!(pane.closest && pane.closest('.rl-cp-src'));
      const theirSeat = side === 'counterparty'
        || (typeof window !== 'undefined' && window.PORTAL_MODE);
      if (!theirSeat && !inCpEditorPane && pane.closest && pane.closest('.rl-doc')){
        _negoKillSelMenu();
        return;
      }
      let range;
      try { range = sel.getRangeAt(0); } catch (e){ return; }
      let rect;
      try { rect = range.getBoundingClientRect(); } catch (e){ return; }
      if (!rect || (!rect.width && !rect.height)) return;
      /* ---- READ THE RANGE, NOT THE STRING IT PRINTS TO ----
         negoReadPassage takes the page's furniture out of the wording, offers
         the readings that make a clause under change findable, counts WHICH
         occurrence of the phrase this is, and reports only the clauses that
         genuinely have words in the highlight. */
      const passage = negoReadPassage(range, pane);
      const text = passage.text;
      /* ---- A SELECTION WITH NO NEGOTIABLE WORDING IN IT ----
         The recital, the title, the party block: real text on a page that
         claims to show the document, and none of it a clause anybody can file
         against. This used to end here in silence — the gesture did nothing and
         said nothing, which reads as a broken page rather than as an answer.
         Front matter is now told what it is, in the same floating layer the
         menu would have used. Chrome alone (a drag over the toolbar) is not
         worth a message and still ends quietly. */
      const clauseEl = passage.clauses[0]
        || ((anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement)?.closest('[data-clause]'));
      if (!clauseEl){
        _negoKillSelMenu();
        if (text.length >= 3) _negoSayAtSelection(rect,
          'Not a negotiable clause',
          'This wording is the document\'s front matter — its title, kicker or recital. '
          + 'Changes are filed against numbered clauses, so there is nothing here to redraft.');
        return;
      }
      if (text.length < 3){ _negoKillSelMenu(); return; }
      const clauseId = clauseEl.getAttribute('data-clause');
      /* ---- ONE HIGHLIGHT, OR SEVERAL PRETENDING TO BE ONE ----
         Ctrl-dragging a second phrase leaves two ranges on the page and every
         one of them looks highlighted. Reading only the first would redraft
         wording the reader can see they also chose, so it is refused rather
         than half-honoured. */
      if (sel.rangeCount > 1){
        _negoKillSelMenu();
        _negoSayAtSelection(rect, 'More than one highlight',
          'There are ' + sel.rangeCount + ' separate highlights on the page. '
          + 'The Copilot rewrites one passage at a time — clear the others and select the wording once.');
        return;
      }
      /* ---- WHAT KIND OF MARKS ARE INSIDE THE CHOSEN WORDS ----
         `marked` is the refusal: wording under a LIVE redline cannot be
         redrafted, because there is no single version of it to redraft. A
         SETTLED change — accepted last week, refused the week before — still
         renders its marks in the document, and counting those refused clean
         selections with the one instruction that could never help: "accept or
         reject the current redline first", about a redline already decided. */
      /* First token: the attribute lists every change on the clause, lead
         first, and the lead is the one whose marks this selection sits in. */
      const changeId = String(clauseEl.getAttribute('data-change')
        || clauseEl.getAttribute('data-nego-card-anchor') || '').split(/\s+/)[0];
      const chOf = changeId && window.negoChangeById ? negoChangeById(c, changeId) : null;
      const live = !!chOf && chOf.status === 'pending' && !chOf.withdrawn;
      const marked = passage.hasMarks && live;
      const settled = passage.hasMarks && !live;
      /* ---- DID THE DRAG REALLY CROSS A CLAUSE? ----
         Counted from the clauses that have words in the highlight, so
         overshooting into the margin below a clause — which leaves the range's
         end at offset 0 of the next one — is the single-clause selection it
         looks like. */
      const spans = passage.clauses.length > 1;
      _negoKillSelMenu();
      /* ---- THE HOST DECIDES WHAT A SELECTION OFFERS ----
         The contract tab and the room keep the engine's own menu below. The
         Redline workbench passes its own builder, which offers the three
         standardised actions and routes every one of them into the Copilot
         side panel instead of a floating dialog over the document. The hook is
         here rather than in a fork of this function because everything else
         about a selection — which pane it is legal in, which clause it belongs
         to, whether the reader may propose at all — is the same question on
         every surface and must keep exactly one answer. */
      if (typeof opts.selMenu === 'function'){
        /* Inside the clause panel's own editor the offer narrows to one action
           — see the note in rlSelMenu. Read off the pane the selection is in,
           which is the only thing that tells the two surfaces apart. */
        const inCpEditor = !!(pane.closest && pane.closest('.rl-cp-src'));
        opts.selMenu({ c, opts, text, clauseId, rect, side, again, marked, settled, spans,
          passage, clauseIds: passage.clauseIds, only: inCpEditor ? ['edit'] : null });
        return;
      }
      defaultMenu({ text, clauseId, rect, marked, settled, spans, passage });
    };
    /* The engine's own menu, lifted out of openSelMenu so the clause toolbar's
       Copilot button can raise the identical thing. Two doors, one menu, one
       proposal path — a second menu would be a second set of refusals to keep
       in step. */
    function defaultMenu(ctx){
      const { text, clauseId, rect, marked, settled, spans, passage } = ctx;
      const menu = document.createElement('div');
      menu.className = 'nego-selmenu';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = `
        <div class="nego-selhead">${ctx.whole ? 'This clause' : 'Selected wording'}</div>
        <div class="nego-selquote">${_ne(text.length > 64 ? text.slice(0, 63) + '…' : text)}</div>
        ${NEGO_AI_ACTIONS.map(a =>
          `<button type="button" role="menuitem" data-nego-ai="${a.id}">${_ne(a.label)}</button>`).join('')}`;
      document.body.appendChild(menu);
      const box = menu.getBoundingClientRect();
      const at = _negoAnchor(rect, box.width, box.height);
      menu.style.left = at.left + 'px';
      menu.style.top = at.top + 'px';
      /* mousedown on the selection path: clicking first collapses the selection,
         and the proposal needs the words that were chosen. The button path has
         no selection to lose, so it listens for a real click and the keyboard
         reaches it too. */
      const evName = ctx.event || 'mousedown';
      menu.querySelectorAll('[data-nego-ai]').forEach(b => b.addEventListener(evName, ev => {
        ev.preventDefault(); ev.stopPropagation();
        const action = NEGO_AI_ACTIONS.find(a => a.id === b.getAttribute('data-nego-ai'));
        _negoKillSelMenu();
        if (action) negoAiPropose(c, { action, text, clauseId, rect, side, opts, again,
          marked, settled, spans, passage });
      }));
    }
    /* ---- WHAT A DOOR ONTO THE CLAUSE EDITOR MEANS (owner-reported 29 Aug 2026)
       *"The only fix is when i click on pencil it takes me to the editor page
       but the rest is not working."*

       THREE CONTROLS OPEN THAT PAGE — the panel's Copilot button, the ✦ on a
       tracked change and the paper's own pencil — and all three are one reading:
       a reader saying *edit this clause*. So the reading is written ONCE and
       they call it, rather than three call sites each remembering to say the
       same thing; a fourth door added in this function inherits it.

       `typing: true` IS THE ASK rlOpenClauseEditor ALREADY HONOURS — main built
       it for a click into another clause's words, and a door needs it for the
       same reason. Without it the reader pressed Edit, landed on a page still
       showing marks, and had to find a SECOND pencil over there, which is the
       "click the pencil symbol once" this whole job is about.

       IT NARROWS THE 28 Aug ARRIVAL RULE AND DOES NOT REPEAL IT. That rule —
       the page never opens in a state that hides marks that exist — still
       governs every move INSIDE the page, because the ask is CONSUMED on
       arrival: `ceGoClause` afterwards inherits nothing. What is overruled is
       only the case the owner rang, where the press itself said "edit". */
    const openEditor = (clauseId, extra) => !!(window.rlOpenClauseEditor
      && rlOpenClauseEditor(c, clauseId,
        { ...opts, side, again, by: opts && opts.by, typing: true, ...(extra || {}) }));

    /* ---- THE COPILOT BUTTON ON A CLAUSE ----
       Everything the selection path works out from a drag, worked out from the
       clause instead: the whole clause is the passage, and whether it is under
       a live redline is read off the same marks and the same change record the
       drag would have read. It then hands over to exactly the same menu — the
       host's, where the host supplies one (the workbench routes into the
       Copilot column), otherwise the engine's. */
    host.querySelectorAll('[data-nego-ai-clause]').forEach(btn => btn.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const clauseId = btn.getAttribute('data-nego-ai-clause');
      const clauseEl = btn.closest('[data-clause]') || host.querySelector(`[data-clause="${clauseId}"]`);
      const cl = window.negoClauseById ? negoClauseById(c, clauseId) : null;
      const text = String((cl && cl.text) || (clauseEl && clauseEl.textContent) || '').trim();
      if (!text){ if (window.toast) toast(i18t('ng_clause_no_wording'), 'err'); return; }
      let rect;
      try { rect = btn.getBoundingClientRect(); } catch (e){ return; }
      const changeId = clauseEl ? String(clauseEl.getAttribute('data-change')
        || clauseEl.getAttribute('data-nego-card-anchor') || '').split(/\s+/)[0] : '';
      const chOf = changeId && window.negoChangeById ? negoChangeById(c, changeId) : null;
      const live = !!chOf && chOf.status === 'pending' && !chOf.withdrawn;
      const hasMarks = !!(clauseEl && clauseEl.querySelector
        && [...clauseEl.querySelectorAll('ins, del, .nego-ins, .nego-del, [data-change-id]')]
          .some(n => String(n.textContent || '').trim()));
      const passage = { text, readings: [], occurrence: 0, parts: [], hasMarks,
        clauses: clauseEl ? [clauseEl] : [], clauseIds: [clauseId], multiRange: false };
      /* Pressed from the clause panel: one action, and no menu to anchor. See
         the note beside the button — its own rect is unreadable by the time
         this runs, because closing the panel hides the body it sits in. */
      const fromPanel = !!btn.closest('.rl-cp-src');
      /* ---- THE CLAUSE EDITOR IS THE FIRST ANSWER (25 Aug 2026) ----
         Where the page is loaded and will take this clause, it takes it and
         nothing below runs. Where it REFUSES it has already said why, in
         words, so falling through to a second route afterwards would answer a
         refusal with a different feature — the press stops here.

         Where the module is absent entirely the old route runs unchanged, and
         the panel is closed by hand because its own data-rl-cp-close came off
         the button (see the note beside it). */
      if (btn.hasAttribute('data-rl-cp-editor') && window.rlOpenClauseEditor){
        openEditor(clauseId);
        return;
      }
      if (fromPanel && window.rlCpSetShown)
        rlCpSetShown(btn.closest('.redline-page') || document, null);
      const ctx = { c, opts, text, clauseId, rect, side, again, whole: true, event: 'click',
        marked: hasMarks && live, settled: hasMarks && !live, spans: false,
        passage, clauseIds: [clauseId],
        only: fromPanel ? ['edit'] : null, direct: fromPanel };
      _negoKillSelMenu();
      if (typeof opts.selMenu === 'function'){ opts.selMenu(ctx); return; }
      defaultMenu(ctx);
    }));
    /* ---- THE ROW'S OWN DOOR ONTO THE CLAUSE EDITOR ----
       The same act as the panel's Copilot button, resolved the same way: the
       clause comes off the attribute and rlOpenClauseEditor is the only route.
       stopPropagation because the row's own press navigates — a door that also
       moves you is two acts on one press, which is the rule the Open button
       beside it already states. */
    host.querySelectorAll('[data-rl-cp-editor-row]').forEach(btn => btn.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation();
      openEditor(btn.getAttribute('data-rl-cp-editor-row'),
        { changeId: btn.getAttribute('data-rl-cp-editor-change') || '' });
    }));
    /* ---- THE PAPER'S OWN PENCIL, WIRED WHERE THE ROW'S DOOR IS WIRED ----
       (owner-reported 29 Aug 2026: "when i click on the pencil i would go
       straight to edit with copilot page and that is not working".)

       The pencil started carrying data-rl-cp-editor when the editor became its
       destination — and NOTHING LISTENED FOR IT ON THE PAPER. The only handler
       that read that attribute is the one a few lines above, bound to
       [data-nego-ai-clause] elements, which is the PANEL's Copilot button and
       not this. So the press fell through every branch and did nothing at all:
       no page, no panel, no refusal, no error. A dead press is the one outcome
       the draw-time decision at pillFor exists to prevent, and it was defeated
       by the attribute having no reader rather than by the decision being wrong.

       It is wired HERE, beside the row's own door, because rlOpenClauseEditor
       needs the contract, the seat and the repaint — none of which the
       module-load listener that owns data-rl-cp-open can see.

       THE PANEL'S COPILOT BUTTON IS EXCLUDED BY SELECTOR, not by luck: it
       carries both attributes and is already wired above, and two handlers on
       one press would open the page, tear it down and open it again.

       stopPropagation for the reason the pill's other door already gives — the
       pencil sits inside .rl-clause, whose own press navigates, and a door that
       also moves you is two acts on one press. */
    host.querySelectorAll('[data-rl-cp-editor]:not([data-nego-ai-clause])').forEach(btn =>
      btn.addEventListener('click', ev => {
        ev.preventDefault(); ev.stopPropagation();
        openEditor(btn.getAttribute('data-rl-cp-editor'));
      }));
    /* A MOUSEUP ON A CONTROL IS NOT A SELECTION GESTURE, and treating it as one
       made the Redline workbench's AI Assist flash and vanish. The clause
       toolbar sits inside this host, so pressing it fires this handler too;
       a tick later openSelMenu looked for a selection, found none — a click
       collapses one — and dismissed the menu the button's own click handler had
       just opened. The menu was removed by the gesture that asked for it.

       So the gesture is read first: pressing a button, a link or a field is
       somebody operating the page, not selecting words in it. */
    const fromControl = t => {
      if (!t || !t.closest) return false;
      /* ---- THE CLAUSE PANEL'S EDITOR IS THE ONE EXEMPTION ----
         [data-nego-editor] is on this list because dragging inside the
         DOCUMENT's clause editor is somebody selecting words to bold them, and
         a Copilot menu popping over the formatting bar there is in the way.

         In the panel the editor IS the writing surface and the owner asked for
         exactly the opposite behaviour (16 Aug 2026): "Leave the feature where
         you can highlight a sentence and it allows you to edit with copilot and
         moves you to the copilot assistant chat bot."

         NARROW BY CONSTRUCTION: the formatting bar is a SIBLING of the holder,
         not a child of it (holder.before(fmt)), so its buttons are still read
         as controls and still raise nothing. Only wording inside the box is
         exempt. */
      if (t.closest('.rl-cp-src [data-nego-editor]')) return false;
      return !!t.closest(
        '.nego-tool, .nego-selmenu, .nego-aipop, #ai-panel, ' +
        '[data-nego-editor], button, a, input, textarea, select');
    };
    host.addEventListener('mouseup', e => {
      if (fromControl(e.target)) return;
      setTimeout(openSelMenu, 0);
    });
    host.addEventListener('keyup', e => {
      if (!(e.shiftKey || e.key === 'Shift')) return;
      if (fromControl(e.target)) return;
      setTimeout(openSelMenu, 0);
    });
    document.addEventListener('mousedown', e => {
      if (!e.target.closest || (!e.target.closest('.nego-selmenu') && !e.target.closest('.nego-aipop')))
        _negoKillSelMenu();
    }, true);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape'){ _negoKillSelMenu(); _negoKillAiPop(); }
    });
  }
  host.querySelectorAll('[data-nego-card]').forEach(card => {
    const id = card.getAttribute('data-nego-card');
    card.addEventListener('click', () => negoFocus(c, id, 'card'));
    /* ONLY when the card itself is focused. The card behaves like a button, so
       Enter and Space select it — but the discuss thread's reply field lives
       INSIDE the card, and this handler used to cancel every space typed into
       it. You could write words and not put spaces between them.

       A container that acts like a button must never claim keys that were
       aimed at a field within it. */
    card.addEventListener('keydown', e => {
      if (e.target !== card) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      negoFocus(c, id, 'card');
    });
  });
  host.querySelectorAll('.nego-clause[data-change]').forEach(n => n.addEventListener('click', () =>
    negoFocus(c, String(n.getAttribute('data-change') || '').split(/\s+/)[0], 'clause')));

  /* The co-pilot band's fold (W3-1). Its ROWS are not wired here and must
     not be: their buttons carry the cards' own attributes and are picked up
     by the very handlers below, which is the whole design. */
  host.querySelectorAll('[data-rl-plan-toggle]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); e.preventDefault();
    rlPlanSetOpen(!rlPlanIsOpen());
    /* BARE, like every other caller in this file. Written `window.rlRepaintFrom`
       it read as ordinary defensiveness and was a guard that is ALWAYS false —
       rlRepaintFrom is not among this module's window exports — so the fold
       flipped its state and the page never redrew, and the band could not be
       opened at all. Same family as the rlPaperFootHtml lesson: nothing catches
       a call that is never made. Found 19 Aug 2026, photographing the band. */
    rlRepaintFrom(b); }));
  host.querySelectorAll('[data-nego-accept]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); decide(b.getAttribute('data-nego-accept'), 'accepted'); }));
  host.querySelectorAll('[data-nego-undo]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); decide(b.getAttribute('data-nego-undo'), 'pending'); }));
  /* Re-open ONE sent decision for another answer. It changes nothing about the
     change — not its status, not its hash, not what the other side holds — it
     only puts the verbs back on this one card, for this reader, until they use
     them. Deciding again then travels exactly as the first answer did. */
  host.querySelectorAll('[data-nego-redecide]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-redecide');
    _negoRedeciding[id] = true;
    _negoActive = id;
    again();
  }));
  /* Withdrawing an ask, and putting it back. Not routed through decide(): this
     is not a decision on the change and must not read like one — the change
     keeps its rejected status, and what moves is whether the point is still
     outstanding between the parties. */
  host.querySelectorAll('[data-nego-withdraw]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-withdraw');
    if (!window.negoWithdraw || !negoWithdraw(c, id, { side, by: opts.by })) return;
    _negoActive = id;
    if (opts.persist !== false && window.persist) persist(c);
    if (typeof opts.onWithdraw === 'function') opts.onWithdraw(c, id, true);
    if (window.toast) toast(`#${id} withdrawn — the ask is off the table and no longer stands between you`);
    again();
  }));
  host.querySelectorAll('[data-nego-unwithdraw]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-unwithdraw');
    if (!window.negoUnwithdraw || !negoUnwithdraw(c, id, { side, by: opts.by })) return;
    _negoActive = id;
    if (opts.persist !== false && window.persist) persist(c);
    if (typeof opts.onWithdraw === 'function') opts.onWithdraw(c, id, false);
    if (window.toast) toast(`#${id} is back on the table`);
    again();
  }));
  host.querySelectorAll('[data-nego-reject]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    /* A refusal the other side cannot understand is a refusal they will send
       again. Ask for the reason here, while it is fresh — the same judgement
       renderNegotiationSection already makes for a whole round. */
    let why = '';
    if (window.promptDialog){
      why = await promptDialog({ get title(){ return i18t('ng_why_turning_down'); },
        message: 'This travels back with your decision, so they know what to do next. Leave it blank to reject without a reason.',
        label: 'Reply to ' + (side === 'owner' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'the other side')),
        placeholder: 'e.g. Net-30 stands, or we can look at a 2% price increase.',
        confirmLabel: 'Reject change' });
      if (why == null) return;                    // cancelled — the change stays pending
    }
    decide(b.getAttribute('data-nego-reject'), 'rejected', { reply: why });
  }));

  const seenScope = negoSeenScope(c, opts);
  /* Put the card back the size it was. Same state the Discuss toggle writes —
     one open/closed fact per change, two ways to reach it. */
  host.querySelectorAll('[data-nego-collapse]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-collapse');
    _negoThreads[id] = false;
    negoMarkThreadSeen(seenScope, id);   // they read it, then closed it
    again();
  }));
  /* Unfolding a closed round. A look and nothing more — no record is read, no
     decision is offered, and the cards inside carry no verbs. */
  host.querySelectorAll('[data-nego-round]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const n = b.getAttribute('data-nego-round');
    _negoOpenRounds[n] = !_negoOpenRounds[n];
    again();
  }));
  host.querySelectorAll('[data-nego-discuss]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-discuss');
    _negoThreads[id] = !_negoThreads[id];
    _negoActive = id;
    /* Opening it is reading it. Marked on the way OPEN and not on the way
       closed, because a reader who opens a thread and immediately collapses it
       has still read what was in it — and marking on close would leave the
       nag lit for anyone who read it and clicked elsewhere. */
    if (_negoThreads[id]) negoMarkThreadSeen(seenScope, id);
    again();
    const inp = byId('nego-ti-' + id);
    if (inp && inp.focus) inp.focus();
  }));
  host.querySelectorAll('[data-nego-send]').forEach(b => {
    const id = b.getAttribute('data-nego-send');
    const send = async () => {
      const inp = byId('nego-ti-' + id);
      const text = inp ? String(inp.value || '').trim() : '';
      if (!text){ if (window.toast) toast(i18t('ng_write_reply_first'), 'err'); return; }
      /* WHICH SWITCH IS PRESSED DECIDES WHO READS IT.

         The composer defaults to Send-to-them, because that is what this box
         has always done and a silent change of destination would be the worst
         possible way to introduce this. The MODEL defaults the other way
         (negoPostComment treats anything but 'shared' as internal), so the two
         defaults are not in conflict: a person's explicit choice is read here,
         and a caller that never made one keeps the note at home. */
      /* A bare `CSS` is a ReferenceError where the global does not exist, not a
         falsy value — and this ran inside the send handler, so on a stage
         without it every comment threw before it was ever posted. Change ids
         are [A-Z0-9-] by construction, so the attribute selector needs no
         escaping at all; the lookup is just scoped and read directly. */
      const visBtn = [...host.querySelectorAll('[data-nego-vis][aria-pressed="true"]')]
        .find(el => el.getAttribute('data-for') === id);
      const visibility = visBtn ? visBtn.getAttribute('data-nego-vis') : 'shared';
      const msg = negoPostComment(c, id, text, { side, author: opts.author, visibility });
      _negoThreads[id] = true;
      _negoActive = id;
      negoMarkThreadSeen(seenScope, id);   // answering is reading
      if (opts.persist !== false && window.persist) persist(c);
      /* WHERE THE COMMENT ACTUALLY GOES.

         negoPostComment writes it onto the contract record this screen is
         reading. On the OWNER's screen that record is the contract, so writing
         it is the whole job. On the counterparty's it is a copy assembled from
         the share payload, thrown away on the next paint and never persisted —
         so a reply typed in the room reached nobody at all, and the room is now
         the only page they have. The page that owns a channel back supplies one
         here, and the comment rides the messages route that already exists for
         exactly this: it changes no wording and closes no link. */
      /* AWAITED, and the repaint comes after it. This used to fire and forget,
         then repaint immediately — so on the counterparty's page the repaint
         rebuilt the room from the share payload, a snapshot taken before the
         comment existed, while the post was still in flight. Their reply
         appeared for one frame and was gone: the local copy of the contract is
         thrown away on every repaint, and the store that WOULD have carried it
         had not been updated yet.

         Waiting means the repaint reads a message list that already has the
         reply in it, on both sides. */
      /* THE CHANNEL IS THE ONLY WAY OUT, so an internal note simply does not
         take it. ch.thread is not in the share payload and never has been, so
         withholding the post is the whole of the wall — there is no filter
         downstream that could be got wrong later. */
      if (visibility === 'shared' && typeof opts.onComment === 'function' && msg){
        try { await opts.onComment(c, negoChangeById(c, id), msg); }
        catch (e){ /* the handler reports its own failure */ }
      }
      else if (window.toast) toast(visibility === 'shared'
        ? `Comment sent on #${id} — the contract is unchanged and no round was opened`
        : `Internal note filed on #${id} — it stays inside ${window.FIRST_PARTY || 'this organisation'}`);
      again();
      const back = byId('nego-ti-' + id);
      if (back && back.focus) back.focus();
    };
    b.addEventListener('click', e => { e.stopPropagation(); send(); });
    /* The switch is a pair of pressed states, not a checkbox: both options are
       named, so neither is the one you get by not noticing a control. */
    host.querySelectorAll(`[data-nego-vis][data-for="${id}"]`).forEach(v =>
      v.addEventListener('click', e => {
        e.stopPropagation();
        host.querySelectorAll(`[data-nego-vis][data-for="${id}"]`).forEach(o =>
          o.setAttribute('aria-pressed', String(o === v)));
      }));
    const inp = byId('nego-ti-' + id);
    if (inp){
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('keydown', e => {
        if (window.chatFieldSubmits ? chatFieldSubmits(e) : (e.key === 'Enter' && (e.preventDefault(), true))) send();
      });
    }
  });

  /* ---------- the two batch actions ----------
     Neither is "do it to everything". Accept takes only the changes that trip
     no risk signal and holds the rest for a person; reject takes only the other
     side's asks, because sweeping away our own would be a bulk route around
     "nobody rules on their own ask". Both show what they are about to do first
     — a button that moves contract wording should not have a blast radius you
     can only learn by pressing it.

     Resolved ONE AT A TIME through negoResolve rather than through
     negoResolveAll, because the whole point is that this batch is a chosen
     subset. negoResolveAll takes everything pending and would quietly undo the
     selection the preview just showed. */
  const bulk = kind => {
    const split = negoBatchSplit(c, side);
    if (!split.pending.length){
      if (window.toast) toast(i18t('ng_nothing_pending'));
      return;
    }
    const take = kind === 'accept' ? split.clear : split.theirs;
    if (!take.length){
      if (window.toast) toast(kind === 'accept'
        ? `Nothing accepted automatically — all ${split.held.length} pending change${split.held.length === 1 ? '' : 's'} tripped a risk signal, so each one needs a person`
        : 'No changes from the other side are pending', 'err');
      return;
    }
    /* Resolved ONE AT A TIME through negoResolve rather than through
       negoResolveAll, because the whole point is that this batch is a chosen
       subset: negoResolveAll takes everything pending and would quietly undo
       the selection. */
    const status = kind === 'accept' ? 'accepted' : 'rejected';
    let done = 0;
    for (const ch of take) if (negoResolve(c, ch.id, status, { side, by: opts.by })) done++;
    if (!done){ if (window.toast) toast(i18t('ng_nothing_moved'), 'err'); return; }
    if (opts.persist !== false && window.persist) persist(c);
    if (typeof opts.onDecided === 'function')
      for (const ch of take){ try { opts.onDecided(c, negoChangeById(c, ch.id)); } catch (e){} }
    /* WHAT WAS HELD BACK IS SAID, every time. A batch that silently took nine
       of twelve reads as though it took all twelve, and the three left behind
       are exactly the ones that needed a person to look at them. */
    if (window.toast) toast(kind === 'accept'
      ? `${done} change${done === 1 ? '' : 's'} accepted — merged into the clean text`
        + (split.held.length ? ` · ${split.held.length} held back for you: ${split.held.slice(0, 3).map(h => '#' + h.ch.id + ' (' + h.why[0] + ')').join(', ')}${split.held.length > 3 ? '…' : ''}` : '')
      : `${done} change${done === 1 ? '' : 's'} rejected — those clauses revert to the baseline`);
    again();
  };
  ['nego-bulk-acc', 'nego-all-acc'].forEach(id => byId(id)?.addEventListener('click', () => bulk('accept')));
  ['nego-bulk-rej', 'nego-all-rej'].forEach(id => byId(id)?.addEventListener('click', () => bulk('reject')));

  byId('nego-drawer')?.addEventListener('click', () =>
    byId('nego-index')?.classList.toggle('open'));

  /* ---- THE ROUND'S EXPORT, WHICH HAD NEVER EXPORTED ANYTHING ----
     This called `exportContractPdf`, and nothing in the product defines that
     name — it is defined nowhere, called here, and reached through a
     `window.` guard, so the guard was simply always false and the else branch
     was the only branch that had ever run. The button was honest about it
     (ng_export_unavailable says so in words rather than doing nothing), which
     is the only reason it never read as broken; it was still a button that had
     never once produced a file. Found by the proofreader added 21 Aug 2026 —
     the rlPaperFootHtml fault exactly, and the reason that check exists.

     THE EXPORTER WAS THERE ALL ALONG: exportPDF (js/views/portal.js) is the
     one this product uses everywhere else — the Document tab's PDF, the sealed
     Record, the counterparty's own clean copy — and it already carries every
     rule this seat needs. It renders the branding, the execution block and the
     seal; it writes the audit line and persists; and it refuses to write
     anything from a counterparty's seat (PORTAL_MODE), which matters because
     this component mounts there too. So the fix is to call the exporter that
     exists rather than to build a second one.

     A CLEAN COPY, DELIBERATELY. The press is refused while anything is still
     pending, so by the time it works every ask is settled and the agreed
     wording is what belongs on the page; tracked changes have their own
     export (exportWordTracked). This matches the word the counterparty's own
     menu already uses for it: "PDF (clean copy)".

     The guard stays, and is not furniture: a stage that mounts this component
     without js/views/portal.js genuinely has no exporter, and saying so is
     better than a dead press. */
  byId('nego-export')?.addEventListener('click', () => {
    if (negoProgress(c).pending){ if (window.toast) toast(i18t('ng_resolve_before_export'), 'err'); return; }
    if (typeof exportPDF === 'function') exportPDF(c);
    else if (window.toast) toast(i18t('ng_export_unavailable'), 'err');
  });
  /* The hand-off. It closes the round — making the agreed wording the baseline
     — and moves the reader to the tab that owns signing. It does NOT sign, and
     deliberately builds none of that flow. */
  byId('nego-to-docs')?.addEventListener('click', async () => {
    /* THE BUTTON SAYS SIGNATURE AND THE ACT IS CLOSING A ROUND, and those are
       not the same thing to the person pressing it. It archives the round's
       decisions, makes the agreed wording the new baseline, moves the counter,
       and empties the table — and there is no way back: nothing in this product
       reopens a closed round. That is a great deal to happen behind a button
       whose words are about the next step rather than this one.

       So the round is named before it closes. Cancel means nothing happened —
       not closed and reopened; the round never closed, the changes are still
       live, no snapshot, no audit line. */
    if (!await negoConfirmCloseRound(c)) return;
    if (opts.onReadyToSign){ opts.onReadyToSign(c); return; }
    negoAdvanceRound(c, { by: opts.by });
    if (window.persist) persist(c);
    if (window.toast) toast(i18t('ng_agreed_carried'));
    if (window.renderWorkspace) renderWorkspace();
  });
}

/* What is about to happen, in the words of the thing that is about to happen.
   Real numbers off the contract, because "5 changes move into the history" is
   a sentence somebody can check against the list in front of them and "your
   changes will be archived" is not.

   A page with no dialog available goes ahead, exactly as it did before: this
   guards a deliberate act, and refusing to perform it because a confirmation
   could not be drawn would break the one route out of a finished round. */
async function negoConfirmCloseRound(c){
  if (!window.confirmDialog) return true;
  const n = negoRound(c);
  const decided = negoChanges(c).filter(x => x.status === 'accepted' || x.status === 'rejected');
  const acc = decided.filter(x => x.status === 'accepted').length;
  const one = decided.length === 1;
  return await confirmDialog({
    title: `Close Round ${n}?`,
    message: `This ends round ${n} and starts round ${n + 1}. `
      + `The agreed wording becomes the new baseline, so anything proposed from now on is measured against it. `
      + `${one ? 'The 1 change' : `All ${decided.length} changes`} decided in this round`
      + `${acc ? ` (${acc} accepted)` : ''} move${one ? 's' : ''} into the history: `
      + `still readable, but no longer able to be changed, undone or decided again. `
      + `A snapshot is saved as “Round ${n} closed”. This cannot be undone — if they come back with more asks, those open as round ${n + 1}. `
      + `Signing still happens on the Docs tab; nothing here signs anything.`,
    confirmLabel: `Close round ${n} and continue`,
    cancelLabel: 'Cancel',
  });
}

/* Reset the reader's place. Called when a different contract opens, so the tab
   does not come up focused on a fingerprint from another agreement. */
const negoIsRedeciding = id => !!_negoRedeciding[id];
function negoResetView(){ _negoActive = null; _negoThreads = {}; _negoRedeciding = {}; _negoOpenRounds = {}; _negoClean = false; _rlRead = 'marks'; _rlCardFilter = 'all'; _rlCardOpen = null; negoSetComparePair('baseline', 'working'); }

/* ---------- WHOSE ASKS AM I LOOKING AT ----------
   Asked for by name (Young, 10 Aug 2026): the column's strip "should also
   contain a filter that shows which changes are from me, counterparty or all".

   IT WAS HERE AND IT WAS TAKEN OUT, so it comes back deliberately rather than
   by accident. The dropdown that went in the redesign sliced four ways —
   yours, theirs, drafts, sent — and the argument for removing it was that a
   control which can hide a change is a control that can lose one. That
   argument is answered rather than ignored:

   - THREE OPTIONS, NOT FIVE. Drafts and Sent were states, not authors, and
     the card already says which it is. Who asked is the one cut a reader
     actually makes.
   - EVERY OPTION CARRIES ITS OWN COUNT, so a filter can never hide a change
     silently — "Theirs 3" is on screen while you are reading Mine.
   - IT IS SEGMENTED, NOT A DROPDOWN. All three answers and the live one are
     visible without opening anything, which is the whole difference between
     a filter you can forget you set and one you cannot.

   'mine' and 'theirs' are read against the SEAT, not against the company, so
   the counterparty's own page and our preview of it both answer correctly:
   their asks are "mine" on their screen. Held in memory for the sitting and
   reset by negoResetView, like every other reading preference on this page —
   a filter that outlived the tab is one somebody finds already applied. */
const RL_CARD_FILTERS = [['all', 'ng_filter_all'], ['mine', 'ng_filter_mine'], ['theirs', 'ng_filter_theirs']];
let _rlCardFilter = 'all';
function rlCardFilter(){ return _rlCardFilter; }
function rlSetCardFilter(v){
  _rlCardFilter = RL_CARD_FILTERS.some(f => f[0] === v) ? v : 'all';
  return _rlCardFilter;
}
/* THE ONE PREDICATE, asked by the card list AND by redlineCardIds — which is
   the count above it. Two copies of this reading is exactly the fault
   redlineCardIds exists to prevent: a pill that counts something other than
   the list it labels. */
/* ---- THE WHOSE-ASKS FILTER IS RETIRED (owner-asked 26 Aug 2026: "delete the
       whose ask feature") ----
   IT ANSWERS TRUE FOR EVERYTHING NOW, and the function stays rather than every
   caller losing a line, because it is what redlineCardIds AND
   redlineChangeCardsHtml both ask — leaving it in place is what keeps the pill
   and the column reading one population, which is the property those two have
   always had to share.

   THE THING IT WAS FOR IS ANSWERED BY THE PILES. It was a control that HID
   changes, and it came back after an earlier removal carrying three safety
   properties precisely because hiding is dangerous: a reader can sit on "Mine"
   without registering it and conclude the other side has asked for nothing.
   The column is banded now — WHOSE ASKS was answering "show me only mine" and
   the headings answer it by SORTING instead of hiding, which is the same
   reading with nothing taken off the screen. And since 26 Aug the front edge
   of every row is coloured by whose ask it is, so the question the filter
   asked is answered at a glance without a control at all.

   RL_CARD_FILTERS, rlCardFilter and rlSetCardFilter are left INERT rather than
   deleted: they are exported, half the suite reaches for them, and a stub that
   cannot narrow is safer than a name a third caller could bring back. */
function rlCardFilterPass(ch, side){ return true; }

/* ---- THE REVIEWER'S DOCUMENT OPENS ON THEIR OWN CLAUSE ----
   Asked for as distraction (Young, 09 Aug 2026): a colleague handed one clause
   was reading the whole agreement to find it. So the document folds to the
   clauses they were sent, with ONE control that opens the rest.

   FOLDED, NOT WITHHELD, and the difference matters: a reviewer judging a
   liability cap has to be able to check what "Losses" is defined as three
   clauses up, and an answer given without that is worse than a slower one. The
   control is on the page, always, saying how much is hidden.

   Per sitting and in memory, like the banner's clear — a reader who opened the
   whole contract yesterday should still land on their clause today. */
let _rlRvFullDoc = false;
function rlRvFullDoc(){ return _rlRvFullDoc; }
function rlSetRvFullDoc(on){ _rlRvFullDoc = !!on; }
/* ONE DELEGATED LISTENER, registered once — the pattern js/aichart.js uses for
   its card buttons, and for the same reason. This control lives INSIDE the
   document pane, and that pane is repainted by several paths after the page
   wires itself; a listener bound to the element is dropped by the first of
   them, which is exactly what happened when it was. Bound to the document, it
   cannot be repainted away. */
if (typeof document !== 'undefined' && !document._rlRvDocWired){
  document._rlRvDocWired = true;
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-rv-fulldoc]');
    if (!b) return;
    ev.preventDefault();
    rlSetRvFullDoc(b.getAttribute('data-rl-rv-fulldoc') === '1');
    if (window.renderRedline) renderRedline();
  });
}
/* ---------- HOW THE CONTRACT IS BEING READ ----------
   THREE READINGS OF ONE RECORD, and not one of them changes it. The workbench
   has always drawn the marked-up reading — every live proposal shown as a
   strike and an insertion — which is the right default and a hard read once a
   round carries eight of them. Two more were asked for (Young, 10 Aug 2026):

   - AGREED  — the wording as it stands today, proposals NOT applied. What the
               contract says if nobody does anything.
   - PROPOSED— every live proposal folded in, read as one clean contract. What
               the contract would say if this round were accepted whole.

   Settled changes are not affected by any of this: an accepted insertion is
   the wording, a rejected one is not, in all three readings. Only the LIVE
   ones — the ones still being argued about — read differently, because they
   are the only ones whose outcome is still a question.

   Per sitting and in memory. A reading is a posture for an afternoon, not a
   setting about a contract, and a colleague opening the same page must not be
   shown a document silently missing its marks. negoResetView clears it. */
const RL_READS = ['marks', 'agreed', 'proposed'];
let _rlRead = 'marks';
function rlReadMode(){ return _rlRead; }
function rlSetReadMode(v){
  _rlRead = RL_READS.includes(v) ? v : 'marks';
  rlPaintReadSegs();
  return _rlRead;
}
/* ONE PAINTER, like rlPaintFocusBtn beside it and for the same reason: this
   switch is drawn in more than one place now — the owner's toolbar and the
   counterparty's header — and a repaint reaches only the mount it belongs to.
   The counterparty's sits OUTSIDE the mount its press redraws, so without this
   their page changed its wording while the switch went on showing the segment
   they had just moved off. Faces, never a rebuild: a repaint here would throw
   away the header the reader is pressing in. */
function rlPaintReadSegs(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.rl-readwrap [data-rl-read]').forEach(b => {
    const on = b.getAttribute('data-rl-read') === _rlRead;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
/* ---- A READING IS NOT A WORKING POSTURE (owner-asked 24 Aug 2026) ----
   "Remove the ability to edit in those pages and grey out the change index card
   when you go to those pages, which should then indicate to the user that to
   make any edits they need to go back to redline page."

   THE REASON IT IS ONE PREDICATE AND NOT A FLAG IN THREE PLACES: 'As agreed'
   and 'With changes' draw the paper WITHOUT its marks — one shows the wording
   as it stands, the other the wording if every proposal landed — so any control
   that files a change there would be measured against a document the reader is
   not being shown. That was already true of the selection menu, which this page
   shut on 19 Aug; the clause pencil and the change column are the rest of it.
   The way back is the tab row, which is on screen the whole time and says which
   reading you are in. */
/* ---- THE WHOSE-ASKS FILTER, DRAWN IN THE INDEX'S OWN SLOT ----
   Lifted out of the head below it (WO-8, 24 Aug 2026) so it draws where the
   markup had already reserved a place for it. The reading is unchanged, line
   for line: every option carries its own count, counted with countAll so the
   filter can never move its own numbers, and a narrowed reviewer gets no
   filter at all because a control with one outcome is furniture. */
function rlIdxFilterHtml(c, opts, side, tabHidden){
  /* RETIRED 26 Aug 2026 — see rlCardFilterPass. A `return ''` STUB rather than
     a deletion, on this file's own convention: it is exported and the progress
     foot calls it, so a third caller must not be able to bring the control back
     through a door nobody remembered. Everything below is dead and is kept so
     that putting it back is uncommenting one line. */
  return '';
  /* eslint-disable no-unreachable */
  if (rlMyCardIds(c, opts)) return '';
  return (() => {
            const totals = redlineCardIds(c, { ...opts, hiddenIds: [...tabHidden], countAll: true });
            const bySide = k => totals.filter(id => {
              const ch = (typeof negoChangeById === 'function') ? negoChangeById(c, id) : null;
              if (!ch) return false;
              const mine = ch.authorSide === (side === 'counterparty' ? 'counterparty' : 'owner');
              return k === 'mine' ? mine : !mine;
            }).length;
            const n = k => (k === 'all' ? totals.length : bySide(k));
            const tip = { all: 'ng_filter_all_t',
              mine: 'ng_filter_mine_t', theirs: 'ng_filter_theirs_t' };
            /* ---- A DROPDOWN, ON THE INDEX'S OWN LINE (owner-asked 24 Aug
                   2026, pointing at where it should sit) ----
                   THIS REVERSES "SEGMENTED, NOT A DROPDOWN", and that reversal
                   was put to the owner with its reason before it was built: the
                   segmented control came back, after the filter had once been
                   removed altogether, with three safety properties, and one of
                   them was that a control which HIDES changes must not be
                   collapsible — a reader can sit on "Mine" without registering
                   it and conclude the other side has asked for nothing.
                   THE OTHER TWO PROPERTIES ARE KEPT AND ARE WHAT MAKE THIS
                   SAFE: three options only, and every option still carries its
                   OWN count, unmoved by the filter — so the number of theirs is
                   readable without opening the control. The third is answered
                   by rlCardFilterNoteHtml below: while the column is narrowed
                   it SAYS so and offers the way back, which is the same
                   mechanism the page already uses when a filter empties it. */
            /* ---- AND IT IS LABELLED (owner-asked 25 Aug 2026, off the
                   drawing: WHOSE ASKS sits to its left) ----
                   A dropdown reading "All (7)" says what it is SET to and not
                   what it is ABOUT — this page has already learned once that a
                   filter whose only label is a title attribute leaves two of
                   them side by side both reading "Any". The aria-label was
                   already this sentence; the drawing makes it visible, which
                   costs the row nothing because the select was alone on it. */
            return `<span class="rl-idx-fk">${_ne(i18t('ng_whose_asks'))}</span>
              <select id="rl-cardfilter" class="rl-idx-filter"
                aria-label="${_nea(i18t('ng_filter_group'))}"
                title="${_nea(i18t(tip[rlCardFilter()] || tip.all, { who: c.counterparty || i18t('ng_the_counterparty') }))}">${
              RL_CARD_FILTERS.map(([k, key]) => `<option value="${k}"${rlCardFilter() === k ? ' selected' : ''}
                >${_ne(i18t(key))} (${n(k)})</option>`).join('')}</select>`;
          })();
  /* eslint-enable no-unreachable */
}

function rlReadOnlyReading(){ return rlReadMode() !== 'marks'; }
/* The sentence the floating notice prints, and the one place that decides
   whether a notice is owed at all — an empty string means the page is on its
   ordinary reading and has nothing to explain. */
function rlReadNote(){
  return _rlRead === 'proposed'
    ? i18t('ng_read_note_proposed')
    : _rlRead === 'agreed' ? i18t('ng_read_note_agreed') : '';
}
/* ---- WHICH SIDE OF A CHANGE A READING SHOWS ----
   'marks' means draw it as a redline; 'del' means draw the wording it would
   replace; 'ins' means draw the wording it proposes. A SETTLED change answers
   the same in all three readings, because its outcome is no longer a question:
   an accepted change IS the wording, a rejected or withdrawn one is not. Only
   the live ones follow the switch. One function, so the document, the cards
   and anything drawn later cannot answer it three different ways. */
function rlReadSideOf(ch, mode){
  if (!ch) return 'marks';
  if (ch.status === 'accepted') return 'ins';
  if (ch.status === 'rejected' || ch.withdrawn) return 'del';
  const m = mode || rlReadMode();
  return m === 'agreed' ? 'del' : m === 'proposed' ? 'ins' : 'marks';
}
/* The ops array as one side of itself: the kept runs stay, the wanted side
   becomes ordinary text, the other side goes. Never mutates — the record's own
   ops are what the fingerprint is taken over. */
function rlOpsAsSide(ops, which){
  if (which === 'marks' || !Array.isArray(ops)) return ops;
  const drop = which === 'ins' ? 'del' : 'ins';
  return ops.filter(o => o && o.op !== drop)
    .map(o => (o.op === which ? { ...o, op: 'keep' } : o));
}
/* ---- WHERE A DELEGATED CONTROL SENDS ITS REPAINT ----
   A control wired per-mount closes over its host's rerender and repaints the
   right page without being told. A control wired ONCE ON THE DOCUMENT — the
   pattern below, and the right one for buttons that get painted into a mount
   after the page has wired itself — has no mount in scope, so it has to work
   out which surface it was pressed on.

   IT USED TO GUESS, AND IT GUESSED THE OWNER'S. #view-redline, else the
   contract tab. Both are the owner's; the counterparty's link is neither, and
   `state` does not even exist on that page, so the second door is shut as well
   as wrong. The result was a control that set its state correctly and repainted
   nothing — drawn, pressable, and apparently dead. It cost the whose-asks
   filter on the counterparty's link (Young, 10 Aug 2026), and the two controls
   beside it had the same fault waiting.

   SO IT ASKS THE PAGE INSTEAD OF GUESSING. Walk up from whatever was pressed:
   inside a mount there is an .rl-embed root carrying the host's own rerender
   (see redlineEmbed), and that is the only correct answer there. Outside one,
   the two owner doors are still right. The order matters — an embed can be
   mounted on a page that also has #view-redline (the owner's preview of their
   seat), and repainting the workbench from a press inside the embed would
   paint the wrong page over the right one. */
function rlRepaintFrom(node){
  const embed = node && node.closest && node.closest('.rl-embed');
  if (embed && typeof embed._rlRerender === 'function'){ embed._rlRerender(); return true; }
  /* ---- A CONTROL CAN SIT OUTSIDE THE THING IT REDRAWS (15 Aug 2026) ----
     Every caller above walks UP from the press, which works while the control
     lives inside the mount it repaints. The counterparty's reading switch does
     not: it is in their page header, and the document it changes is in an embed
     alongside. Walking up from it found no mount, no #ws-notices, no #m-root
     and no #view-redline, so the press set the mode and redrew nothing — the
     paper kept its marks and the switch kept its old segment lit.
     So where the press is not inside a mount, the page's ONE mount answers.
     Guarded on there being exactly one: with two mounted embeds "the page's
     mount" is not a question with an answer, and the callers below are the
     right fallback for that shape. */
  if (node && node.closest && !embed){
    const mounts = [...document.querySelectorAll('.rl-embed')]
      .filter(el => typeof el._rlRerender === 'function');
    if (mounts.length === 1){ mounts[0]._rlRerender(); return true; }
  }
  /* THE ROOM'S STACK REPAINTS ITSELF AND NOTHING ELSE. The Document tab is not
     the workbench: falling through to renderNegotiationTab would replace the
     room a reader is standing in with the negotiation component. It owns one
     container, so pressing its bell repaints that container. */
  if (node && node.closest && node.closest('#ws-notices') && window.wsPaintNotices
      && window.getContract && window.state){
    wsPaintNotices(getContract(state.activeId) || null);
    return true;
  }
  /* AND THE PHONE REPAINTS ITSELF. Its shell is not the desktop's and none of
     the renderers below exist on it; mRender is the phone's whole answer to
     "draw this again". */
  if (node && node.closest && node.closest('#m-root') && typeof window.mRender === 'function'){
    mRender();
    return true;
  }
  if (document.getElementById('view-redline') && window.renderRedline){ renderRedline(); return true; }
  if (window.renderNegotiationTab && window.getContract && window.state){
    renderNegotiationTab(getContract(state.activeId) || null, {});
    return true;
  }
  return false;
}

/* ---- EVERY DOOR ONTO THE POSTBOX IS DELEGATED, AND ARMED AT LOAD ----
   A [data-redline-proxy] button is not a transport: it presses the page's one
   hidden postbox (#nego-send on our seat, #nego-send-decisions on theirs), so
   one send exists however many doors reach it.

   TWO FAULTS, ONE AFTER THE OTHER, both found on 15 Aug 2026 and both recorded
   because the second was created by the fix for the first.

   (1) IT SCANNED AN ELEMENT. The wiring sat inside renderRedline, scanning
   #content at a line BEFORE the panes were mounted a few lines below. Every
   proxy in the page shell got its handler; a proxy painted into the mount got
   none. Harmless while the toolbar was the only door, and it made "Send all N"
   a dead button the moment the unsent band arrived in the change column —
   reproduced before it was touched: the toolbar pressed the postbox once, the
   band pressed it zero times.

   (2) AND THEN IT WAS ARMED ON ONE SEAT. Delegating it to the document fixed
   the scan but left it inside renderRedline, which is the OWNER's page. The
   counterparty reaches this component through renderShareWorkbench and never
   calls renderRedline at all — so on their own browser, opening a share link
   and nothing else, the band's Send would have been dead exactly as before.
   It survived a browser check only because that harness draws the owner's page
   too, which armed the listener for the whole document. A jsdom test opening
   the portal alone caught it.

   So it is armed HERE, at module load, on the same terms and for the same
   reason as the reading buttons and the ask tags below it: a listener on the
   document cannot be painted away, and one registered at load cannot belong to
   whichever page happened to render first.

   ONE MECHANISM, NOT TWO. The element-bound scan is gone rather than kept
   beside this, because a proxy reachable by both would press its postbox twice
   and publish the round twice. redlineSyncProxies still runs per paint — that
   is a different job (whether a proxy is USABLE) and has always had to re-run
   on fresh markup. */
/* Which change a card's Send is about, for the duration of one press. Consumed
   by onSendDirect; null means a BATCH send (the band, Publish Round). See the
   [data-rl-send] handler in rlWireClauseTools. */
let _rlSoloSendId = null;
if (typeof document !== 'undefined' && !document._rlProxyWired){
  document._rlProxyWired = true;
  document.addEventListener('click', ev => {
    const el = ev.target && ev.target.closest && ev.target.closest('[data-redline-proxy]');
    if (!el || el.disabled) return;
    const target = document.getElementById(el.getAttribute('data-redline-proxy'));
    /* A proxy is always a BATCH door — the band's "Send all N" and Publish
       Round both come through here — so any solo marker is stale by
       definition and must not narrow this send. */
    _rlSoloSendId = null;
    if (target && !target.disabled) target.click();
  });
}

/* ---- WIRED ONCE, ON THE DOCUMENT ----
   The same pattern (and the same reason) as the reviewer's fold control above:
   two of these buttons live in the toolbar, which renderRedline paints, and one
   lives on the floating notice, which redlinePanesHtml paints into the mount a
   moment LATER. A listener bound while the page was being built reaches the
   first two and never the third — so "Back to redlined" was drawn, looked like
   a button, and did nothing. Bound to the document, it cannot be painted away. */
if (typeof document !== 'undefined' && !document._rlReadWired){
  document._rlReadWired = true;
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-read]');
    if (!b) return;
    ev.preventDefault();
    rlSetReadMode(b.getAttribute('data-rl-read'));
    rlRepaintFrom(b);
  });
  /* ---- AND THE ASK TAG, ON THE SAME TERMS (OI-12) ----
     Delegated on the document for the reason the reading buttons give above:
     these tags are painted by two document renderers into four different
     shells, and a listener bound while a page is being built reaches whichever
     of them existed at the time.

     stopPropagation is load-bearing. The tag sits inside .nego-clause, whose
     own press jumps to the lead change's card — so without this, pressing a tag
     would open the panel and navigate away from it in the same gesture. */
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-asktag]');
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    rlAskSetOpen(b.getAttribute('data-rl-asktag'));
    rlRepaintFrom(b);
  });
  /* Escape closes it, like every other posture on this page. Guarded on one
     being open so the key stays free for the dialogs above it. */
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || ev.defaultPrevented || !rlAskOpenId()) return;
    const el = document.querySelector('[data-rl-askrv]');
    if (!el) { rlAskResetOpen(); return; }
    ev.preventDefault();
    rlAskResetOpen();
    rlRepaintFrom(el);
  });
}

/* ---- THE STRIP IS RETIRED, AND THE FACT IS NOT (owner-reported 24 Aug 2026,
       off a screenshot with the band ringed: "remove the strip from the top of
       the contract in both as agreed and with changes pages") ----
   THIS REVERSES "THE NOTICE IS OWED, NOT OPTIONAL", and the standing rule
   behind it is kept rather than dropped: a document silently missing its
   strikes looks like a document with nothing on the table, so a non-default
   reading must still SAY so and must still offer the way back. What changed is
   where. When this was written the reading switch was a grey pill group in a
   toolbar; since the 22 Aug redesign it is the TAB ROW at the top of the page —
   Redlined / As agreed / With changes, the live one bold and underlined,
   permanently on screen — and the change column beside it now greys itself and
   names the way back in words (see rlReadOnlyReading). Two more statements of
   one fact, one of them a band across the top of the contract, is what the
   owner was looking at.
   KEPT AS A BUILDER WITH NO CONTENT rather than deleted: it is exported and
   called from the notice stack, and a third caller must not be able to bring
   the band back through a door nobody remembered.

   ---- AND ITS BODY IS BACK FOR ONE SURFACE (owner-asked 26 Aug 2026: the
   clause editor's two non-editable readings say "this page is not editable -
   back to redline", in the owner's own words) ----
   THE NEGOTIATION PAGE'S RETIREMENT STANDS AND IS WHAT `opts.on` PROTECTS: the
   notice stack calls this with nothing and still gets nothing, so the band the
   owner took off that page cannot come back through this door. What changed is
   that a second surface asked for it — and there the reasoning that retired it
   does not hold. That page says the reading twice (the tab row, and a change
   column that greys itself and names the way back); the clause editor has no
   change column, and since 26 Aug its pencil is HOVER-ONLY, so on a reading
   that refuses editing there is nothing on screen a reader could see is
   missing. The page simply stops responding, which reads as a fault rather
   than as a rule.

   IT PASSES BOTH HALVES OF THE STANDING BAND TEST, which is why it is drawn
   rather than asked about again: it says something no control on that screen
   says, and it carries its own act — the way back is ON the band. That act
   presses `data-rl-read`, the reading tabs' own attribute, so it is the
   existing door and never a second one.

   ON THE TWO CLEAN READINGS ONLY. On Redlined it draws nothing at all, so it
   cannot become furniture. */
function rlReadNoticeHtml(opts = {}){
  if (!opts || !opts.on) return '';
  if (!rlReadOnlyReading()) return '';
  return `<div class="rl-readnote" role="status">
    <span class="rl-readnote-t">${_ne(i18t('ce_not_editable'))}</span>
    <button type="button" class="rl-readnote-b" data-rl-read="marks"
      title="${_nea(i18t('ng_read_marks_title'))}">${_ne(i18t('ng_read_back'))}</button>
  </div>`;
}

/* ---------- THE REDLINE PAGE ----------
   The workbench as a top-level destination, not only a tab inside a contract
   and not only the full-window room.

   It renders THE SAME workbench through the same entry point the contract tab
   uses — renderNegotiationTab, which carries the style, the wiring and the
   after-paint with it. Nothing here re-implements a pane, a change card or a
   thread, so there is exactly one redline in the product and it cannot drift
   from itself. What this adds is the page around it: the design's header, and
   an empty state for arriving with no contract open.

   The header deliberately holds only the title and the round. Every control the
   design draws beside it — the internal/counterparty toggle, accepting the
   non-risk changes, publishing the round — already exists inside the workbench
   below, wired to the real engine. Drawing a second copy up here would give the
   page two buttons for one action, and the top one would be the one that is
   not connected to anything. */
/* The design's header carries a "Round 2" tag. There is no round-number helper
   to read one from, so this counts c.rounds — but it floors at 1 to agree with
   the workbench's own status bar directly below it, which calls the live round
   "Round 1" before anything has been closed. Two figures for the same thing,
   one saying "No rounds yet" and one saying "Round 1", is worse than no figure
   at all. The open count is unresolvedRedlines, the same one the register uses. */
let _redlineSide = 'owner';
/* ---- FOCUS MODE ----
   One boolean, and deliberately NOT persisted: focus is a posture you take for
   a reading session, not a setting. Arriving at the Redline tab from anywhere
   else always lands on the full screen (setView clears it via rlResetFocus),
   so nobody can be trapped on a page whose exits are hidden.
   Toggling flips a class on #view-redline rather than repainting the page —
   the three scroll boxes keep their positions because nothing rebuilds them —
   but renderRedline also reads the flag at paint time, so the repaints the
   engine triggers mid-session (saving a redline, answering a card) come back
   in the same mode they left. */
let _rlFocus = false;
function rlFocusOn(){ return _rlFocus; }
/* ============================================================
   "N NOT SENT" — THE BAND ON THE CHANGE COLUMN (15 Aug 2026, OI-9)
   ============================================================
   Reported: you write three redlines, every card says Draft and carries its own
   Send, and NOTHING counts them or says they have not left your desk. The only
   surface that mentioned it was a suffix on Publish Round at the far end of the
   toolbar — which never uses the word "send", is nowhere near the cards just
   written, and FOLDS AWAY on the fit ladder's second rung, so on an ordinary
   laptop the count is simply not on screen.

   ONE LINE, NEVER TWO. Owner-ruled on sight, after two-line drafts measured
   108px against this one's 41px. The count and the button are fixed width; the
   middle phrase is the only thing that gives and it ellipsises, so a column
   dragged to its 300px minimum still holds one line. The whole sentence is on
   the hover.

   ONE COUNT, MANY SURFACES. It borrows the same arithmetic the toolbar's Publish
   Round suffix and the wall line already use — negoUnsentAsks, less what a
   review is holding — so the band and the button cannot disagree. That suffix
   comes OFF when this ships: two places printing one number is how they come to
   differ.

   DRAWN ONLY WHEN SOMETHING IS UNSENT. An always-on warning is furniture.

   AND THE SEND IS A PROXY, never a second transport — the same postbox the
   per-card Send presses, which is why pressing it sends everything. The
   per-card Send stays: the owner asked for both routes in the same breath. */
function rlUnsentCount(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  if (opts.readonly) return 0;
  /* THEIR SEAT COUNTS WHAT THEIR PAGE IS HOLDING, ours what the record says is
     unsent. Two different stores, one question — and their page is the only
     thing that knows about the first, which is why it hands the numbers in. */
  if (side === 'counterparty')
    return Math.max(0, Number(opts.pendingDecisions || 0) + Number(opts.pendingProposals || 0));
  const unsent = window.negoUnsentAsks ? negoUnsentAsks(c, 'owner').length : 0;
  const held = window.reviewHeldIds ? reviewHeldIds(c).size : 0;
  const wait = window.reviewAwaiting ? reviewAwaiting(c).length : 0;
  return Math.max(0, unsent - held - wait);
}
/* ---- THE CO-PILOT'S FIRST PASS, DRAWN (W3-1) ----
   A folded band over the change column: how many of their asks sit inside
   our standard, how many need pushing back, how many are somebody else's
   call. Open it and every ask has its recommendation, the position it was
   measured against, and what our own history says about that standard.

   THE BUTTONS ARE THE CARDS' OWN. data-nego-accept, data-rl-ask-review and
   data-rl-cp-open are wired by the existing handlers a few lines below this
   markup, so a press here is the same press as on the card: same funnel,
   same guards, same catch-up to the counterparty. Nothing in this file
   decides anything, and that is what makes it safe.

   NEVER ON THEIR SEAT. This is our playbook, our fallbacks and our
   negotiating history, read out loud. */
function rlPlanBandHtml(){
  /* ---- A STUB, NOT A DELETION (WO-3, 24 Aug 2026) ----
     The owner asked for the strip off the page and the machinery left where it
     is. Everything this used to build — js/redlineplan.js, the rp_* wording in
     both languages, the .rl-plan rules — is untouched and dormant; only the
     drawing stops. Restoring it is putting the body of this function back.
     IT DECIDED NOTHING AND FILED NOTHING, which is why removing it takes no
     capability away: every button it drew carried the ordinary cards' own
     attributes and pressed the ordinary funnel. */
  return '';
}
/* Per sitting, in memory — a working posture, not a setting, and shut on
   arrival so the column opens on the cards themselves. */
let _rlPlanOpen = false;
const rlPlanIsOpen = () => _rlPlanOpen;
const rlPlanSetOpen = v => { _rlPlanOpen = !!v; };
/* ---- THE STRIP IS RETIRED AND THE ACT SURVIVES IT (owner-asked 26 Aug 2026:
   "delete the entire long strip complete and leave that space for the change
   cards. Move the send all button to ... the opposite side of tracked changes.
   Only move the button") ----
   THIS REVERSES THE ONE EXCEPTION NO NEW BANDS ON THE PAGE WROTE DOWN BY NAME
   — that rule kept this strip because the owner had asked for it and because
   the act was ON it, which is the test a band has to pass. The owner has now
   looked at it in place and taken the strip while keeping the act, which is
   the same test answered the other way: the act moved to the column's head,
   where it is on screen without a band under it.

   ONE SENTENCE IS LOST FROM THE SCREEN AND IS SAID OUT LOUD RATHER THAN
   ABSORBED: ng_unsent_why — "they cannot answer yet" — had no other home. It
   rides the button's own hover now (ng_unsent_full, which already carried the
   count, the sentence and the name of who is waiting), so it is one hover away
   rather than gone. ng_unsent_n and ng_unsent_why are STALE as visible text.

   A `return ''` STUB rather than a deletion, on this file's own convention:
   the name is exported and a third caller must not be able to bring the strip
   back through a door nobody remembered. */
function rlUnsentBandHtml(){ return ''; }

/* THE BUTTON ALONE, for the head's own top row. Every rule the strip carried
   is carried here unchanged — the count, the refusal to offer a batch send to
   a reviewer who cannot publish, and the seat's own postbox — because they are
   the same rules and this is the same act; only the clothes and the slot are
   new. It is still a PROXY onto the page's one postbox (#nego-send, or the
   counterparty's #nego-send-decisions) and never a second transport, so the
   delegated proxy listener picks it up wherever it is drawn. */
function rlUnsentSendHtml(c, opts = {}){
  const n = rlUnsentCount(c, opts);
  if (!n) return '';
  /* A reviewer holding somebody's clause cannot publish a round, so offering
     them the batch send would be a control whose one outcome is a refusal. */
  if (rlActorHeld(c, opts)) return '';
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const who = side === 'counterparty'
    ? (opts.org || (window.FIRST_PARTY) || i18t('ng_the_counterparty'))
    : (c.counterparty || i18t('ng_the_counterparty'));
  const target = side === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
  /* BOTH SENTENCES RIDE THE HOVER. ng_unsent_full is the one the deleted strip
     printed on the page — "N of your changes have not been sent … cannot answer
     them yet" — and ng_unsent_send_title is the hint this button already had,
     that every card keeps its own Send. Neither had another home, so the button
     carries the pair rather than choosing between them. */
  return `<button type="button" class="rl-unsent-go" data-redline-proxy="${target}"
    title="${_nea(i18t('ng_unsent_full', { n, who }) + ' ' + i18t('ng_unsent_send_title', { n, who }))}">${
      i18t('ng_unsent_send', { n })}</button>`;
}

/* ---- CLOSE ROUND, IN THE COLUMN HEAD (owner-asked 27 Aug 2026) ----
   The other half of the pair beside Send all, and the same rules apply to it
   for the same reasons: our seat only (a counterparty answers a round, they do
   not close one), never on a read-only copy, and never for a reviewer holding
   somebody's clause — rlActorHeld is the one predicate for that, exactly as
   the send beside it asks it.

   IT DECIDES NOTHING. `data-rl-close-round` is the attribute the page's own
   handler has always bound, so the press runs negoAdvanceRound behind the same
   naming dialog it always did; this builder chooses only whether the control is
   drawn and whether it is live.

   GREYED, NOT HIDDEN, AND NOT A REFUSAL AFTER THE PRESS. Whether a round can
   close is something HaTi knows before anybody touches it — negoProgress has
   counted it all along — so the control states it: disabled, dimmed, and the
   reason on its hover. Hiding it until the round settles is what it used to do
   from the page head, and it meant a reader working their first round never
   saw that closing one was a thing at all.

   THE PROGRESS READING IS PASSED IN. The panes have already asked negoProgress
   once for the bar; a second call here would be a second arithmetic on a figure
   already on the page. */
function rlCloseRoundHtml(c, opts = {}, prog = null){
  if ((opts.side === 'counterparty' ? 'counterparty' : 'owner') !== 'owner') return '';
  if (opts.readonly) return '';
  if (rlActorHeld(c, opts)) return '';
  const p = prog || ((typeof negoProgress === 'function') ? negoProgress(c)
    : { pending: 0, total: 0 });
  /* Nothing on the table is nothing to close. */
  if (!p.total) return '';
  const blocked = p.pending > 0;
  const title = blocked
    ? i18tn('ng_close_blocked', p.pending, { n: p.pending })
    : i18t('ng_close_round_title');
  return `<button type="button" class="rl-close-go" data-rl-close-round${
    blocked ? ' disabled aria-disabled="true"' : ''} title="${_nea(title)}">${
      _ne(i18t('ng_close_round_n', { n: negoRound(c) }))}</button>`;
}

/* ============================================================
   THE ASK TAG ON A CLAUSE, AND WHAT PRESSING IT OPENS (15 Aug 2026, OI-12)
   ============================================================
   The tag read `CHG-006 · Their ask · ✓ adopted` — 218px of a clause's heading
   row, or 129px without a verdict. Four changes on one clause wanted about
   694px and pushed the heading off its own line, which is how it was reported.

   COLOUR IS WHOSE, GLYPH IS WHERE IT STANDS. The tag is the change id and one
   mark — ✓ adopted, ? awaiting, ✗ refused, ↩ withdrawn — and the side rides on
   a coloured cap down its left edge. 102px and 98px measured.

   THE CAP IS THE CHANGE CARD'S OWN LEFT BORDER, deliberately: the card is
   already teal for ours and amber for theirs (data-rl-origin), while this tag
   was amber for BOTH sides, so the paper carried no side colour at all. This is
   not a new colour language — it is the card's, finally reaching the clause.

   AND THE RULE HAS NO EXCEPTIONS. A first draft gave a refused tag its own ruby
   fill; two refusals, one theirs and one ours, then drew identically and the
   side was gone. Colour answers ONE question. Refusal is carried by ✗, by the
   strikethrough already on the wording, and by the card's own ruby edge.

   COLOUR IS NEVER THE ONLY CARRIER: the title names the side in words, and the
   change's card names the author and the organisation. The pipeline ring's rule
   — every slice named in the key besides — applies here too. */
const RL_ASK_GLYPH = { accepted: '&#10003;', rejected: '&#10007;' };
function rlAskGlyph(ch){
  if (!ch) return '?';
  if (ch.withdrawn) return '&#8617;';
  return RL_ASK_GLYPH[ch.status] || '?';
}
function rlAskWord(ch){
  if (!ch) return '';
  if (ch.withdrawn) return i18t('ng_tag_withdrawn');
  return ch.status === 'accepted' ? i18t('ng_tag_adopted')
    : ch.status === 'rejected' ? i18t('ng_tag_refused') : i18t('ng_tag_awaiting');
}
function rlAskTagHtml(ch, side, opts = {}){
  if (!ch) return '';
  const theirs = ch.authorSide !== (side === 'counterparty' ? 'counterparty' : 'owner');
  /* The words the tag no longer prints are what the hover says instead — the
     side, where it stands, and the refusal's reason where there is one. */
  const bits = [theirs ? i18t('ng_their_ask') : i18t('ng_your_ask_short'), rlAskWord(ch)];
  if (opts.newClause) bits.push(i18t('ng_new_clause_tag'));
  if (ch.status === 'rejected' && ch.reply) bits.push('“' + String(ch.reply) + '”');
  const open = rlAskOpenId() === ch.id;
  return `<button type="button" class="rl-asktag${open ? ' on' : ''}" data-rl-asktag="${_nea(ch.id)}"
    aria-expanded="${open ? 'true' : 'false'}" title="${_nea(bits.join(' · ') + ' — ' + i18t('ng_tag_press'))}"
    ><span class="rl-asktag-cap rl-cap-${theirs ? 'them' : 'us'}"></span><span class="rl-asktag-lb">${
    _ne(ch.id)}<span class="rl-asktag-g">${rlAskGlyph(ch)}</span></span>${
    open ? '<span class="rl-asktag-x" aria-hidden="true">&#10005;</span>' : ''}</button>`;
}
/* ---- PRESSING A TAG SHOWS WHAT THE CHANGE PROPOSED, IN THE CLAUSE ----
   Owner-asked, and it closes a hole rather than only adding one: the clause
   press resolves the FIRST token of the jump anchor, so on a clause carrying
   three changes the other two could not be reached from the paper at all.

   IT MATTERS MOST ONCE THE CARD HAS GONE. A decided change leaves the Tracked
   Changes column — deliberate, unchanged — but its tag stays on the clause for
   the life of the contract, so after a round closes the tag is the ONLY handle
   left on it. Pressing it did nothing.

   THE CLAUSE BODY IS NOT SWAPPED, and that was the alternative. The body is the
   wording as it STANDS; redrawing it with one change's marks makes the paper
   temporarily untrue under a reader. The panel sits beside the wording so both
   are on screen at once.

   ONE AT A TIME, document-wide, in memory, never persisted — the same single
   value and the same reasoning as the clause panel's _rlCpId. It is a reading
   posture: it never prints and never leaves the page. */
let _rlAskOpen = null;
const rlAskOpenId = () => _rlAskOpen;
function rlAskSetOpen(id){ _rlAskOpen = (_rlAskOpen === id) ? null : (id || null); return _rlAskOpen; }
function rlAskResetOpen(){ _rlAskOpen = null; }
/* ---- WHAT ONE CHANGE PROPOSED, DRAWN FROM ITS OWN STORED OPS ----
   The ask reveal and the clause panel both print this and they must never
   drift: two renderings of one change is how a page comes to say two things
   about the same ask. NO RE-DIFFING — the stored ops are inside the
   fingerprint, so a mark drawn from a fresh diff would not be the mark the
   other side verified. */
function rlChangeWordingHtml(ch, opts = {}){
  if (!ch) return '';
  const ops = rlChangeOps(ch);
  return window.redlineOpsBlocksHtml
    ? redlineOpsBlocksHtml(ops, { changedOnly: !!opts.changedOnly })
    : (window.redlineOpsHtml ? `<p>${redlineOpsHtml(ops)}</p>` : `<p>${_ne(ch.newText || '')}</p>`);
}
/* THE OPS THIS CHANGE IS DRAWN FROM, including the stand-in for a change that
   carries none. Named because the card counts blocks off the same ops it is
   about to draw, and a second construction of that fallback is a second
   answer to "what does this change propose". */
function rlChangeOps(ch){
  return (Array.isArray(ch && ch.ops) && ch.ops.length) ? ch.ops
    : [{ op: (ch && ch.changeType) === 'deleteClause' ? 'del' : 'ins',
         text: (ch && (ch.newText || ch.oldText)) || '' }];
}
function rlAskRevealHtml(c, ch, side, opts = {}){
  if (!ch || rlAskOpenId() !== ch.id) return '';
  const theirs = ch.authorSide !== (side === 'counterparty' ? 'counterparty' : 'owner');
  const wording = rlChangeWordingHtml(ch);
  /* ---- WHO SETTLED IT NEVER TRAVELS ----
     `resolvedBy` is stripped from the share payload — it is one of the two
     things this product walls off from the other side — and their page mounts
     this very renderer. So the line names the ask and its outcome from every
     chair, and the PERSON who ruled only on ours. The refusal's reason does
     travel: it is the answer to their ask and they are owed it. */
  const seatShowsRuler = side !== 'counterparty' && !(typeof window !== 'undefined' && window.PORTAL_MODE);
  const author = String(ch.author || ch.by || '').trim();
  const when = ch.updatedAt || ch.createdAt;
  const ruled = seatShowsRuler && ch.resolvedBy ? String(ch.resolvedBy).trim() : '';
  const line = [
    `<b>${_ne(ch.id)}</b>`,
    theirs ? i18t('ng_their_ask_lc') : i18t('ng_your_ask_lc'),
    rlAskWord(ch) + (ruled ? ' ' + i18t('ng_tag_by', { who: _ne(ruled) }) : ''),
    author && ch.status === 'pending' ? i18t('ng_tag_from', { who: _ne(author) }) : '',
    when ? negoWhen(when) : '',
  ].filter(Boolean).join(' &middot; ');
  /* ---- A SETTLED ASK NEEDS A WAY BACK, AND THIS IS THE ONLY PLACE IT HAS ONE
     ---- (owner-reported 15 Aug 2026, MK-311: "when I reopen a card and I click
     accept nothing happens and i am therefore stuck on awaiting you.")

     Reproduced. The accept guard refuses a second acceptance on a clause whose
     rival is already adopted, and it refuses IN WORDS, naming the way out:
     "reopen it first, or reject this one". The way out did not exist. An
     ADOPTED change has no card — _rlIsLive keeps pending only, and a refused
     one survives on `contestedAny` while an accepted one does not — so the
     reader was told to press a button that is not drawn anywhere on the page.
     A refusal whose stated remedy cannot be reached is worse than no remedy.

     The tag on the clause is where it belongs: it is the one place a settled
     change is still visible, it is what the reader presses to read the ask,
     and it is on the clause the refusal is about. This uses the ENGINE's own
     re-open (data-nego-undo → decide(id,'pending')) rather than a second
     path — the same control the card carries where the card exists.

     OUR SEAT ONLY, and narrowly. The counterparty's page has its own answer
     for its own answers (data-nego-redecide, behind a deliberate press) and
     the mirror rule that a refusal is reopened by the side that GAVE it. This
     is the owner reopening a decision the owner made; widening it would be a
     different change with a different rule to walk. */
  const settled = ch.status === 'accepted' || (ch.status === 'rejected' && !ch.withdrawn);
  const mayReopen = settled && side !== 'counterparty'
    && !(typeof window !== 'undefined' && window.PORTAL_MODE)
    && !opts.readonly && opts.canEdit !== false;
  return `<div class="rl-askrv rl-askrv-${theirs ? 'them' : 'us'}" data-rl-askrv="${_nea(ch.id)}">
    <span class="rl-askrv-bar" aria-hidden="true"></span>
    <div class="rl-askrv-bd">
      <span class="rl-askrv-who">${line}</span>
      <div class="rl-askrv-wd">${wording}</div>
      ${ch.status === 'rejected' && ch.reply
        ? `<span class="rl-askrv-why">“${_ne(ch.reply)}”</span>` : ''}
      ${mayReopen ? `<div class="rl-askrv-act">
        <button type="button" class="rl-askrv-reopen" data-nego-undo="${_ne(ch.id)}"
          data-rl-reopen="${_ne(ch.id)}"
          title="${_nea(i18t('ng_reopen_ask_title', { id: ch.id }))}">${i18t('ng_change_decision')}</button>
      </div>` : ''}
    </div>
  </div>`;
}
/* ---- THE GREEN EDIT PILL, AND THE PANEL IT OPENS (owner-asked, 16 Aug 2026)
   ---- "Just add a green pill that says Edit on the top right of the clause."

   IT IS A DOOR, NOT A VERB. Pressing it does not open an editor; it opens the
   clause's own panel on the right — what the clause says now, what is on the
   table, and everything that has ever been asked about it — and the ways to
   change the wording are inside, beside the history that explains why anybody
   would want to.

   WHY IT IS ALWAYS DRAWN. A hover-only door is an invisible affordance, which
   is the exact fault this file already records against the selection route — a
   reader looking at a clause and wanting to change it must be able to SEE that
   they can. Since 16 Aug 2026 it is also the ONLY door on the clause: the
   hover tool row at the foot (Copilot / Direct Edit) is retired on the owner's
   instruction that no edit happens on the contract itself — every way to write
   lives behind this pill, in the panel.

   ONE PLACE THE PANEL IS OFFERED. Not on a read-only copy and not for a seat
   with no hands: `editable` is the same reading the retired tool row asked, so
   a viewer, a signing link and a closed round get a clause they can read and
   no door promising something the page would refuse. */
/* THE WORD BECAME THE PENCIL (owner-asked 20 Aug 2026, off a picture of the
   glyph: "replace the edit word on the contract with the edit symbol … it
   should not be too dark but visible as well"). Icon-only on the paper; the
   WORD survives as the aria-label and the hover title, so a screen reader and
   a hesitant pointer both still get "Edit". The ink is the workspace accent —
   the established answer to "visible but not furniture" (the folded-notices
   chip, .ui-btn), and lighter than the nav-bg fill it replaces. */
/* ---- ONE PENCIL, TWO DOORS (owner-asked 26 Aug 2026) ----
   The clause editor draws THIS SAME PAPER, and on it the pencil cannot mean
   "open the clause panel" — the panel is the page the reader came FROM. So a
   caller may say what its own pencil does, and everything else about the
   control — where it sits, what it looks like, when it stands down, and that
   it is hover-only with a keyboard and an active state keeping it reachable —
   comes from this one builder rather than from a second pencil written beside
   it. A second pencil is how the two surfaces come to disagree about a control
   the owner ruled on twice in one week.

   `opts.pill` is that hook: {attr, label, title, pressed}. Absent, this is
   byte for byte the control it has always been. `hasPanel` still gates the
   default door, because that door needs a panel to open; a caller supplying
   its own attribute is supplying its own room and is not asked for one. */
function rlClauseEditPillHtml(cl, opts = {}){
  const pill = opts.pill || null;
  if (!cl || opts.editable === false || (!opts.hasPanel && !pill)) return '';
  /* NOT ON A READING. Asked here rather than at the three call sites, so the
     three clause branches cannot come to disagree about it — and the clause
     editor inherits Phase 4's rule by construction rather than by remembering
     to ask it again. */
  if (rlReadOnlyReading()) return '';
  const id = _ne(cl.clauseId);
  /* THE PENCIL'S OWN DOOR. A caller that names its own attribute still wins —
     the clause editor's own pencil means something different on the clause it
     is working on — and where nobody names one this is our seat's door onto the
     editor, or the panel where the editor cannot take the clause (see the note
     at pillFor, which is where that is decided). */
  const attr = (pill && pill.attr) ? String(pill.attr)
    : (opts.toEditor ? 'data-rl-cp-editor' : 'data-rl-cp-open');
  /* A DOOR ONTO A FULL-WINDOW PAGE IS NEVER "OPEN": the page covers this one,
     so aria-expanded on a control nobody can see would be a claim about a state
     that cannot be observed. The panel's pencil still reports its own. */
  const on = pill ? String(pill.pressed == null ? '' : pill.pressed) === String(cl.clauseId)
    : (!opts.toEditor && rlCpOpenId() === String(cl.clauseId));
  /* A caller's words may be a FUNCTION of the clause, because on the clause
     editor the same pencil means two different things depending on whether it
     is the clause being worked on — and the alternative is one pencil telling
     nineteen clauses it will do something it will not. */
  const say = (v, fb) => {
    if (typeof v === 'function'){ try{ return v(cl); }catch(_){ return fb; } }
    return v || fb;
  };
  const label = say(pill && pill.label, i18t('ng_cp_edit'));
  /* THE WORDS FOLLOW THE DOOR (owner-reported 30 Aug 2026, off a screenshot of
     this tooltip). The default said "Open this clause — what it says now, what
     is on the table, and everything that has been asked about it", which
     describes the CLAUSE PANEL — and this pencil has opened the edit page since
     29 Aug wherever the editor can take the clause. A control that names
     somewhere it does not go is the same fault as one that goes nowhere, just
     quieter. The panel's own wording is kept and is still right on the controls
     that really do open it. */
  const title = say(pill && pill.title,
    i18t(attr === 'data-rl-cp-editor' ? 'ng_cp_edit_title' : 'ng_cp_open_title'));
  return `<button type="button" class="rl-cp-pill" ${attr}="${id}"
    aria-expanded="${on ? 'true' : 'false'}"
    aria-label="${_nea(label)}"
    title="${_nea(title)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg></button>`;
}

/* ---- ONE CLAUSE, ONE SHAPE, WHEREVER IT IS DRAWN ----
   (owner-reported 19 Aug 2026, off a screenshot of clause 3 side by side:
   "make sure the structure in the contract is resembled in the panel on the
   left so that users can follow the words and structure as well.")

   THE PAPER AND THE PANEL WERE PRINTING THE SAME WORDS IN TWO SHAPES. A clause
   UNDER CHANGE is drawn from its stored ops through redlineOpsBlocksHtml, which
   splits the opening marker — "3.1", "(b)", "•" — into its own span and stamps
   the line rl-hang, so the number sits in a gutter and every wrapped line
   starts under the first word. A clause drawn from its own markup — every
   unmarked clause, and the panel's "As it stands" block — went straight out as
   stored: same words, no gutter, wraps running back to the margin. So the
   reported screenshot had 3.1/3.2/3.3 hanging correctly on the contract and
   flush on the panel twelve pixels away, which is exactly the comparison the
   panel exists to make easy.

   THIS IS THE SAME TREATMENT, APPLIED TO RENDERED MARKUP RATHER THAN TO OPS.
   It reads the marker with redlineSplitMarker — the ONE pattern, shared with
   the op renderer, so the two can never come to disagree about what a marker
   is — and emits the classes the sheet already styles (.rl-hang, .rl-marker,
   defined once for .rl-doc and .rl-cp-src alike). Nothing is re-diffed, nothing
   is re-worded and no stored body is rewritten: this is a class and a span
   around characters that were already there, and textContent is identical.

   BOTH SURFACES OR NEITHER. It is applied by redlineDocHtml's own richBody and
   by the panel's standing block, which is what makes the two agree on a marked
   clause AND on an unmarked one. The room's two-pane view is deliberately not
   in this list: it has its own sheet and its own rules, and negoRichBody stays
   exactly what it was for every caller that is not this page. */
function rlHangRichHtml(html){
  const src = String(html == null ? '' : html);
  if (!src || typeof redlineSplitMarker !== 'function') return src;
  return src.replace(/<p\b([^>]*)>([^<]*)/g, (whole, attrs, text) => {
    let split;
    try { split = redlineSplitMarker(text); } catch (e){ return whole; }
    if (!split || !split.marker) return whole;
    /* The marker's own characters, boxed to the hanging measure. The text after
       it is left untouched — the split is on the leading run only, so anything
       else in the paragraph (bold, a defined term, a nested span) is never
       reached. */
    const head = text.slice(0, text.length - split.rest.length);
    const at = String(attrs || '');
    const dressed = /\bclass\s*=\s*"/.test(at)
      ? at.replace(/\bclass\s*=\s*"/, 'class="rl-hang ')
      : at + ' class="rl-hang"';
    return `<p${dressed}><span class="rl-marker">${head}</span>${split.rest}`;
  });
}

/* The panel's contents for ONE clause.

   IT IS NOT RENDERED INSIDE THE CLAUSE, and that was the first build. Putting a
   second copy of the clause's own wording inside .rl-clause — even hidden —
   poisons every query scoped to a clause: three of this file's own tests
   immediately counted four paragraphs where the document has two, and found an
   unattributed mark that is the panel's history row rather than anything on the
   paper. A hidden node is still in the DOM, and this page is read by measuring
   the DOM.

   So redlineDocHtml pushes these into opts.cpSink and the PANEL renders them.
   One producer, one reading: the wall that hides the other side's unsent draft,
   the reviewer's fold and the change grouping are all computed exactly once, in
   the canvas, and the panel is only a consumer. A caller with no sink — the
   Word export renders this same canvas — gets no panel bodies and, by the same
   flag, no Edit pill: a door is drawn only where the room behind it exists. */
function rlClausePanelBodyHtml(c, cl, chs, side, opts = {}){
  const editable = opts.editable !== false;
  const id = _ne(cl.clauseId);
  const list = (chs || []).slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));
  /* AS IT STANDS is the clause as the reader is SHOWN it — baseline plus what
     is adopted on it — never the round baseline. Adopting does not move the
     baseline (only closing the round does), so a panel headed "as it stands"
     printing the baseline would state the wording that was in force before the
     adoption the reader had just made. negoClauseNowById is the one reading;
     the accept guard, the editor's seed and the paper all measure from it. */
  /* ---- A CLAUSE THAT IS ONLY PROPOSED HAS NOTHING STANDING (owner-asked
     25 Aug 2026: "standard clauses added should be editable as well") ----
     An insertClause ask is not in the baseline, so negoClauseNowById answers
     null for it and every reading below has to come off the ask itself. The
     panel says AS PROPOSED rather than AS IT STANDS, because a clause nobody
     has agreed to is not in force and this heading is the one place the page
     would be saying it is. Everything else about the panel is the same. */
  const isNew = !!opts.newClause;
  const standing = isNew ? cl
    : ((typeof negoClauseNowById === 'function')
      ? (negoClauseNowById(c, cl.clauseId) || cl) : cl);
  const standsBody = rlHangRichHtml((typeof negoRichBody === 'function')
    ? negoRichBody(standing) : `<p>${_ne(standing.text || '')}</p>`);
  const live = list.filter(x => x.status === 'pending' && !x.withdrawn);
  /* One of OUR OWN asks still on the table. The editor continues it rather than
     starting a rival — the engine's rule, not a decision taken here — so the ＋
     says so instead of promising something else. */
  const mine = live.some(x => x.authorSide === (side === 'counterparty' ? 'counterparty' : 'owner')
    && (isNew ? x.changeType === 'insertClause'
      : (x.changeType !== 'deleteClause' && x.changeType !== 'insertClause')));
  /* What is SETTLED — everything that is not on the table. Same list, same
     order, one predicate apart, so a change cannot be in neither or in both. */
  const past = list.filter(x => !live.includes(x));
  /* ---- A SETTLED ASK NEEDS A WAY BACK, AND THE PANEL IS NOW THE ONLY PLACE IT
     HAS ONE ---- (16 Aug 2026, moved with the ask tags.)

     It used to live in the tag's reveal on the clause, because that was the one
     place a settled change was still visible. The tags have come off the paper
     (owner-asked), so the History section here is that place: the reveal's rule
     did not change, only its address.

     The rule itself is unchanged and still narrow. The accept guard refuses a
     second acceptance on a clause whose rival is already adopted and refuses IN
     WORDS, naming reopening as the way out; a refusal whose stated remedy
     cannot be reached is worse than no remedy, which is why this had to move
     rather than simply go. OUR SEAT ONLY: their page has its own answers for
     its own answers, and the mirror rule that a refusal is reopened by the side
     that GAVE it. */
  const mayReopen = ch => (ch.status === 'accepted' || (ch.status === 'rejected' && !ch.withdrawn))
    && side !== 'counterparty' && !(typeof window !== 'undefined' && window.PORTAL_MODE)
    && !opts.readonly && editable;
  const row = ch => {
    const theirs = ch.authorSide !== (side === 'counterparty' ? 'counterparty' : 'owner');
    /* WHO SETTLED IT NEVER TRAVELS — resolvedBy is stripped from the share
       payload and their page mounts this renderer. The REASON does travel: it
       is the answer to their ask and they are owed it. Same wall, same words,
       as the ask reveal a few lines above. */
    const seatShowsRuler = side !== 'counterparty' && !(typeof window !== 'undefined' && window.PORTAL_MODE);
    const author = String(ch.author || ch.by || '').trim();
    const when = ch.updatedAt || ch.createdAt;
    const ruled = seatShowsRuler && ch.resolvedBy ? String(ch.resolvedBy).trim() : '';
    const line = [
      `<b>${_ne(ch.id)}</b>`,
      theirs ? i18t('ng_their_ask_lc') : i18t('ng_your_ask_lc'),
      rlAskWord(ch) + (ruled ? ' ' + i18t('ng_tag_by', { who: _ne(ruled) }) : ''),
      author ? i18t('ng_tag_from', { who: _ne(author) }) : '',
      when ? negoWhen(when) : '',
    ].filter(Boolean).join(' &middot; ');
    /* ---- THE REPLY BOX LIVES HERE NOW (16 Aug 2026, with the pop-out's
       retirement). This is the ONE composer for the change — id
       "nego-ti-<change>", data-nego-send, the visibility switch — the exact
       markup wireNegotiationTab binds, rendered in exactly one place. The
       pop-out existed to BORROW the card's copy because a second copy is a box
       that accepts typing and posts nothing; rendering the original here,
       inside the mount the engine wires, keeps that rule without the dance.
       The card renders no composer at all any more. */
    /* ---- THE NOTE BOX HAS LEFT THIS PANEL (owner-asked 27 Aug 2026) ----
       It lives in the Notes panel now, split into an internal room and an
       external one, because an internal aside and a reply to the other side
       must not sit in one list. This row keeps a DOOR onto it and draws no box:
       there is exactly one note box per change in the product, and a second
       copy is a box that accepts typing and posts nothing — the lesson the
       retired pop-out was built around. The count is negoNoteCounts, the same
       arithmetic the panel's own tabs print. */
    /* ---- AND THEIR SEAT KEEPS ITS BOX, DELIBERATELY ----
       The Notes panel is the SHELL's drawer, and the shell is hidden whole on
       the counterparty's page — the same reason their alerts have a panel of
       their own. Sending them to a drawer that does not exist would take away
       the only channel they have, so their seat keeps the box it has always
       had, rendered here, and rlCardNotesHtml still draws for them alone.
       NOTHING IS LOST BY THE SPLIT NOT REACHING THEM: they have no internal
       notes and never can — their page is assembled from the share payload and
       thrown away on the next paint, so there is nowhere to keep one. Every
       note on their seat is external by definition, which is exactly the ONE
       ROOM the panel would draw them. When their page grows a drawer of its
       own, this is the branch that retires. */
    const _nc = negoNoteCounts(c, ch, opts, side);
    const notes = side === 'counterparty'
      ? ((typeof rlCardNotesHtml === 'function')
          ? rlCardNotesHtml(c, ch, { canComment: opts.canComment != null ? opts.canComment : !opts.readonly,
              messages: opts.messages, org: opts.org, readonly: opts.readonly }, side)
          : '')
      : `<button type="button" class="rl-cp-notes-go" data-rl-notes="${_nea(ch.id)}"
      >${_nc.total ? _ne(i18t('ng_card_notes_n', { n: _nc.total })) : _ne(i18t('ng_card_notes'))}</button>`;
    return `<div class="rl-cp-row rl-cp-row-${theirs ? 'them' : 'us'}" data-rl-cp-change="${_nea(ch.id)}">
      <span class="rl-cp-bar" aria-hidden="true"></span>
      <div class="rl-cp-rowbd">
        <span class="rl-cp-who">${line}</span>
        <div class="rl-cp-wd">${rlChangeWordingHtml(ch)}</div>
        ${''/* ---- THE REASON THE ASK WAS MADE, WHICH CAME HERE FROM THE CARD
               (19 Aug 2026) ---- The column's card carried it as its own titled
               strip and no longer does; a reason removed from one slot has to be
               findable in another before the slot goes, and this is the slot —
               the same row that already carries the wording, the author and the
               outcome, on the clause the reason is about.

               IT IS THE AUTHOR'S REASON, and the line below it is the REFUSAL's
               reply: two different people answering two different questions, so
               they are two lines and never one. Both travel to the other side
               and both are drawn on both seats, unchanged. */}
        ${ch.why
          ? `<span class="rl-cp-why"><b>${i18t('ng_why_they_asked')}</b> ${_ne(ch.why)}</span>` : ''}
        ${ch.status === 'rejected' && ch.reply
          ? `<span class="rl-cp-why">&ldquo;${_ne(ch.reply)}&rdquo;</span>` : ''}
        ${mayReopen(ch) ? `<div class="rl-cp-act-row">
          <button type="button" class="rl-cp-reopen" data-nego-undo="${_ne(ch.id)}"
            data-rl-reopen="${_ne(ch.id)}"
            title="${_nea(i18t('ng_reopen_ask_title', { id: ch.id }))}">${i18t('ng_change_decision')}</button>
        </div>` : ''}
        ${notes}
      </div>
    </div>`;
  };
  /* THE HISTORY IS ALWAYS DRAWN, including when it is empty. A section that
     appears only once there is something in it teaches the reader nothing about
     where to look the first time they need it, and "nothing has been asked
     about this clause yet" is a real answer to a real question. */
  return `<div class="rl-cp-src${rlCpOpenId() === String(cl.clauseId) ? ' is-on' : ''}" data-rl-cp-for="${id}">
    ${''/* The region has no heading of its own — its title is INSIDE its own
           markup, which is what makes editing the region edit the title — so it
           is named here in the reader's own language. `cl.title` is the RECORD's
           word (English, stamped into clauseLabel) and is deliberately not what
           a screen prints. */}
    <p class="rl-cp-clname">${cl.front ? _ne(i18t('ng_front_matter'))
      : _ne(String(cl.headingText || cl.title || '').trim() || i18t('ng_cp_stands'))}</p>
    <section class="rl-cp-sec">
      <h5 class="rl-cp-h">${i18t(isNew ? 'ng_cp_proposed' : 'ng_cp_stands')}</h5>
      <p class="rl-cp-note">${i18t(isNew ? 'ng_cp_proposed_note' : 'ng_cp_stands_note')}</p>
      <div class="rl-cp-stands">${standsBody}</div>
    </section>
    ${''/* ---- THE ACTS SIT UNDER THE WORDING THEY ACT ON (owner-asked 16 Aug
           2026: "these buttons should appear under the As it Stands clause") ----
           They were at the FOOT of the panel, below the history, which put the
           ＋ furthest from the one thing it copies. It belongs here for the same
           reason the editor opens here: this block IS what the ＋ duplicates, so
           the button and its subject read as one thing. It also means the
           editor, once open, is at the top of the panel rather than under a
           scroll of settled asks. */}
    ${!editable ? '' : `<section class="rl-cp-sec rl-cp-acts">
      <h5 class="rl-cp-h">${i18t('ng_cp_acts')}</h5>
      ${''/* ---- THE PLUS COPIES WHAT STANDS INTO A DRAFT ----
             It opens the ENGINE's own editor (see the two-homes note at
             data-nego-edit) on the "As it stands" block a few lines above —
             which is the same wording, from the same reading, that a filing
             will be measured against. So "copy the standing wording into a
             draft" is not a second act this panel performs; it is where the
             one editor happens to open.

             ---- ITS WORD IS FIXED (owner-asked 26 Aug 2026: "the highlighted
             box should always be called propose new wording but it seems it
             changes based on how you get there") ----
             THIS REVERSES "its word changes with what is already there". That
             rule read the state honestly — with one of our own asks pending the
             editor continues THAT draft rather than starting a rival — and it
             was right about the BEHAVIOUR and wrong about what a button name is
             for. A control that renames itself is one the reader cannot learn:
             the owner met it as the same box in the same corner of the same
             panel wearing two different names, with nothing on screen
             explaining which they would get, and read that as a fault rather
             than as a briefing.
             THE BEHAVIOUR IS UNTOUCHED — the engine still folds a second edit
             into the pending ask, which is what stops the column filling with
             rivals — and the fact has not been dropped: it moved to the HOVER,
             where a title is allowed to say more than a name can. So the button
             says one thing for ever and the tooltip still tells the truth about
             this particular press: ng_cp_continue_title is that sentence and is
             live. ng_cp_continue — the LABEL — is retired and left inert in the
             dictionary; flag any mention of it as stale. */}
      <button type="button" class="rl-cp-act rl-cp-act-new" data-rl-cp-edit="${id}"
        title="${_nea(i18t(mine ? 'ng_cp_continue_title' : 'ng_cp_propose_title'))}"
        >&#43; ${i18t('ng_cp_propose')}</button>
      ${''/* DIRECT EDIT HAS LEFT THIS PANEL (owner-asked 16 Aug 2026: "Direct
             edit will not be needed because the window is already open for
             direct editing"). It is the same act as the ＋ beside it, one press
             further away and pointed at the clause behind the panel. Later the
             same day it left the CLAUSE's hover row too, with the whole row —
             the owner's "no edits on the contract itself" — so the ＋ here and
             the highlight-Copilot are now the ways to write, full stop. */}
      ${''/* ---- AND THE COPILOT IS A SIGNAL HERE, NOT A CONTROL ----
             (owner-asked 16 Aug 2026: "delete the edit with copilot feature but
             leave the words as they are there in purple without a pill around
             it. This is to signal that the feature ... is available where you
             can highlight and get the copilot feature.")

             The button is gone; the words stay, in the violet this page already
             gives the Copilot, with no pill and nothing to press. What they now
             do is NAME the thing the line under them explains — highlight a
             sentence and the Copilot is offered on it — which is the only route
             this panel ever needed. A door and a label for one feature, twelve
             pixels apart, was the door doing the label's job badly.

             THE HIGHLIGHT ROUTE IS UNTOUCHED and is what makes this honest: the
             selection inside this editor is a legal pane (see paneSel) and
             offers exactly this action. If that ever stops working these words
             become a promise the page does not keep — which is why f210 pins
             them together. */}
      ${''/* ---- IT WENT STRAIGHT TO THE COPILOT, WITH NO MENU IN BETWEEN ----
             (owner-reported 16 Aug 2026: "When I click edit with copilot the
             panel disappears and the copilot dropdown appears on the top right
             corner.")

             Reproduced. This button raised the same three-item menu the clause
             toolbar raises, anchored on ITSELF — and the panel is shut in the
             capture phase before the menu is built, which sets its body to
             display:none, so the button's rect came back all zeros and the menu
             was clamped into the corner of the window. A dropdown detached from
             the thing that summoned it, offering two actions the owner had
             already asked this surface not to offer.

             Both halves answered at once by taking the menu out: a control
             already narrowed to ONE action is a menu with one row, and a menu
             with one row is a press the reader has to make twice. `direct`
             hands it to rlAiPropose, which is where every route ends anyway —
             so the press does what its label says and lands in the Copilot
             chat, which is the "moves you to the copilot assistant" the owner
             asked for. */}
      ${''/* ---- AND IT IS A BUTTON AGAIN (owner-asked 19 Aug 2026: "change
             'edit with copilot' to be a button which if clicked, it takes you
             to copilot and you can edit the entire clause") ----

             THIS REVERSES 16 Aug, when the button became plain violet WORDS on
             the reasoning that a door and a label for one feature, twelve
             pixels apart, was the door doing the label's job badly. What
             changed under it is the paper: the highlight menu is off the
             contract now, so the words were the only Copilot on this page and
             they pointed at a route the reader has to discover by dragging.

             THE TWO ROUTES ARE DIFFERENT SIZES, which is what makes both worth
             having: the button hands the WHOLE clause over, the highlight hands
             ONE SENTENCE from the draft you are writing. The hint line below
             says the second one out loud, so nothing rests on discovery.

             STRAIGHT TO THE COPILOT, NO MENU IN BETWEEN — `direct` in the
             handler at data-nego-ai-clause, for the reason recorded there: a
             control already narrowed to one action would raise a menu of one
             row, anchored on a button the closing panel has just hidden. */}
      ${''/* ---- AND SINCE 25 Aug 2026 IT OPENS THE CLAUSE EDITOR ----
             (owner-approved prototype, "The Clause Journey"). It used to hand
             the clause to the Copilot DRAWER, which is a chat about a clause
             you cannot see; it opens a page about the clause instead — the
             wording as it stands above the wording being proposed, with the
             marks computed between them, and Copilot down a third of it.

             data-nego-ai-clause STAYS ON THE BUTTON and is not a leftover: it
             is the FALLBACK. The handler tries the editor first and falls
             through to this exact route where the editor module is not loaded
             (the browser harnesses build their own script lists), so a stage
             without js/views/clauseeditor.js behaves precisely as it did.

             data-rl-cp-close CAME OFF, and that is load-bearing rather than
             tidying: it is handled in the CAPTURE phase, so the panel would
             shut before the page opened and closing the page would land the
             reader on a shut panel. The fall-through closes it by hand. */}
      ${opts.noAi ? '' : `<button type="button" class="rl-cp-act rl-cp-act-ai"
        data-nego-ai-clause="${id}" data-rl-cp-ai="1" data-rl-cp-editor="1"
        title="${_nea(i18t('ng_cp_copilot_title'))}">&#10024; ${i18t('ng_cp_copilot')}</button>`}
      ${''/* THEY ARE NOT .rl-tool, AND THAT IS A RULE RATHER THAN A STYLE
             CHOICE. The first build wore the sheet's tool-pill class, and the
             panel is written EARLIER in the grid than the document, so the
             query that measures the sheet's own furniture started answering
             with a hidden button inside this panel and returned a 0x0 box.
             paper-grows-verify caught it. A control that is not on the sheet
             must not answer to the sheet's selectors; it wears the same colours
             through its own class. */}
      <p class="rl-cp-note rl-cp-hint">${i18t('ng_cp_sel_hint')}</p>
    </section>`}
    <section class="rl-cp-sec">
      <h5 class="rl-cp-h">${i18t('ng_cp_table')}</h5>
      ${live.length ? live.map(row).join('') : `<p class="rl-cp-none">${i18t('ng_cp_table_none')}</p>`}
      ${''/* ---- WHAT HAPPENED BEFORE (W3-2, precedent memory) ----
             One sentence, and only where the workspace's own settled rounds
             have something to say about THIS standard: how often this
             counterparty has pushed here, what was conceded, what was held,
             and the figure it settled at. It sits under the live asks
             because it is context for the decision being taken above it,
             not a fact about the clause.

             NEVER ON THE COUNTERPARTY'S PAGE. This is our own negotiating
             history — how far we have bent before, and with whom — which is
             the single most useful thing an opponent could read. The seat
             check is the wall; precedentForChange is never called there. */}
      ${(side !== 'counterparty' && !PORTAL_MODE && live.length && typeof precedentForChange === 'function') ? (() => {
        const line = (typeof precedentLine === 'function')
          ? precedentLine(precedentForChange(c, live[0])) : '';
        return line ? `<p class="rl-cp-note" data-rl-precedent>${esc(line)}</p>` : '';
      })() : ''}
    </section>
    <section class="rl-cp-sec">
      <h5 class="rl-cp-h">${i18t('ng_cp_history')}</h5>
      ${''/* ---- SETTLED ONLY, AND THAT IS A REVERSAL (owner-reported 16 Aug
             2026: "when i redline, the new change appears On the Table and also
             as the last redline which is redundant. It should only appear On
             the Table and once resolved it takes its place at the bottom of the
             sequence in history.")

             This drew EVERY change, on the reasoning that "what am I deciding"
             and "how did this clause get here" are different questions and an
             open ask is a true answer to both. Measured against the screen, it
             is not worth the line it costs: the two sections sit twelve pixels
             apart, so a live ask printed itself twice, identically, and the
             reader has to work out that they are one thing.

             The sequence is the point of the section, and it is not broken by
             this — a change joins the history at the moment it is settled, at
             the BOTTOM, which is where it belongs in seq order anyway. */}
      ${past.length ? past.map(row).join('') : `<p class="rl-cp-none">${i18t('ng_cp_history_none')}</p>`}
    </section>
  </div>`;
}

/* ---- HOW THE CONTRACT READS, AS ONE BUILDER (15 Aug 2026) ----
   Three words — Redlined / As agreed / With changes — and they were written
   inline in renderRedline, which is the owner's page and only the owner's. The
   counterparty was asked to decide on wording with no way to read it clean,
   even though their page has always DRAWN whatever reading was set: both
   document renderers ask rlReadMode, and theirs is one of them. The switch was
   the only missing half, so this is a builder rather than a second copy — two
   segmented controls for one setting is exactly how the two pages come to
   disagree about what "As agreed" means.

   The presses are already delegated on `document` (see the [data-rl-read]
   listener), so a control drawn on any mounted page is live with nothing to
   wire — which is why the counterparty's costs no handler of its own. */
function rlReadSegsHtml(opts = {}){
  /* ---- AND "REDLINED" SAYS HOW MANY (owner-approved render, 22 Aug 2026) ----
     The design's first tab reads "Redlined 12". It is the same number the
     change column's All tab prints — the caller passes it, because only the
     caller knows which contract and which seat is being read, and a second
     count worked out in here is a second answer waiting to disagree with the
     first. Absent (the counterparty's header, a stage with no contract) the
     tab draws no number rather than a zero. */
  const n = Number(opts.n);
  const cnt = (Number.isFinite(n) && n > 0)
    ? `<span class="rl-seg-n">${n}</span>` : '';
  const seg = (v, label, tip) => `<button type="button" data-rl-read="${v}"
    class="rl-seg${rlReadMode() === v ? ' on' : ''}" aria-pressed="${rlReadMode() === v ? 'true' : 'false'}"
    title="${_nea(tip)}">${_ne(label)}${v === 'marks' ? cnt : ''}</button>`;
  return `<div class="rl-segwrap rl-readwrap" role="group" aria-label="${_nea(i18t('ng_read_group'))}"
    title="${_nea(i18t('ng_read_group'))}">${
    seg('marks', i18t('ng_read_marks'), i18t('ng_read_marks_title'))}${
    seg('agreed', i18t('ng_read_agreed'), i18t('ng_read_agreed_title'))}${
    seg('proposed', i18t('ng_read_proposed'), i18t('ng_read_proposed_title'))}</div>`;
}
/* WHICHEVER PAGE IS MOUNTED. #view-redline is the owner's own bench; the
   counterparty reads the same component mounted inside their share page, where
   that id does not exist — so looking it up by name alone made focus mode a
   verb that could only ever work for one of the two seats. It is asked for by
   name first (the owner's page is the common case and unambiguous) and then by
   the class every mounted redline page carries. */
function rlFocusPage(){
  if (typeof document === 'undefined') return null;
  return document.getElementById('view-redline') || document.querySelector('.redline-page');
}
function rlSetFocus(on){
  _rlFocus = !!on;
  const page = rlFocusPage();
  if (page) page.classList.toggle('rl-focus', _rlFocus);
  /* The counterparty's header is not the app shell and is not stood down by
     `rl-focused`, which hides the sidebar and the top strip. Their page carries
     its own marker so its own stylesheet can answer — see portalWorkbenchStyle.
     Kept separate rather than widening `rl-focused`: one class meaning "hide
     the owner's shell" and "hide the reader's header" is one class that will be
     changed for one page and break the other. */
  if (typeof document !== 'undefined' && document.body && document.body.classList)
    document.body.classList.toggle('pw-focused', _rlFocus && !!(typeof window !== 'undefined' && window.PORTAL_MODE));
  /* The sidebar and the top strip live OUTSIDE this page, so the class that
     stands them down has to go on the body. Cleared on the way out and on the
     way off this page — a reader who leaves the bench in focus mode and lands
     on the register must not find the navigation missing. */
  if (typeof document !== 'undefined' && document.body && document.body.classList)
    document.body.classList.toggle('rl-focused', _rlFocus);
  /* ---- THE DEAD BAND AT THE FOOT ----
     The page is `height:var(--view-h)`, and --view-h is the scroll container
     measured ONCE, while the top strip was still on screen. Focus mode then
     hides the strip and the sidebar, so the container grows and the page does
     not — leaving a strip's worth of empty white below the panes, with the
     exit chip floating in it. That is the band, and it is not a padding value
     to halve: it is a stale measurement.

     So it is re-measured. The class changes are applied above, and the browser
     needs a frame to lay the new shell out before clientHeight means anything,
     which is what the rAF is for; the timeout is for the stages that have no
     rAF. Leaving focus re-measures for the same reason, in reverse. */
  /* ---- AND THE WIDTH IS A STALE MEASUREMENT FOR EXACTLY THE SAME REASON ----
     The note above is about the height, and it was right about the height and
     silent about the other axis. Focus mode hides the sidebar, hides the top
     strip and drops the page's padding — every one of which makes the GRID
     WIDER — while rlLayoutResizer has written the columns in PIXELS for the
     narrow shell. So the queue and the contract keep their old widths, the
     whole gain falls into the cards (the only `1fr` track), and the drag handle
     stays drawn at a boundary that has moved.

     Nothing looks wrong until you touch the handle. The first pointer move
     calls rlLayoutResizer, which finally measures the focus-mode width and
     snaps all three columns at once — measured at 1600px: the queue jumping
     210 to 300 and the contract 724 to 834 on a ONE-PIXEL drag. Reported as
     "the left window grows and closes the contract box", and only in focus
     mode, which is the tell: regular mode never changes width underneath the
     inline columns.

     Re-measured in the same frame as the height, for the same reason and with
     the same rAF: the browser needs one to lay the new shell out. */
  if (typeof window !== 'undefined'){
    const remeasure = () => {
      try{ if (window.syncViewHeight) syncViewHeight(); }catch(_){}
      try{ rlLayoutResizer(document); }catch(_){}
    };
    if (window.requestAnimationFrame) requestAnimationFrame(remeasure);
    else setTimeout(remeasure, 0);
  }
  rlPaintFocusBtn();
}
/* The button is the way in AND the way out — the toolbar it lives on stays
   under focus, so its face has to say which of the two it currently is. */
function rlPaintFocusBtn(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-rl-focus]').forEach(b => {
    b.classList.toggle('on', _rlFocus);
    b.setAttribute('aria-pressed', _rlFocus ? 'true' : 'false');
    b.setAttribute('aria-label', _rlFocus ? 'Exit focus mode' : 'Enter focus mode');
    b.title = _rlFocus
      ? 'Exit focus mode — bring the header back'
      : 'Focus mode — hide the header and give the space to the document and the changes';
  });
}
function rlResetFocus(){ _rlFocus = false; }
/* Esc is the second exit, wired once onto the document and guarded twice: the
   flag says focus is on, and the page must actually be mounted — the listener
   outlives any single paint, and pressing Esc on another view must do nothing.
   A dialog that swallowed the key first leaves defaultPrevented set, and is
   respected. */
let _rlFocusKeyWired = false;
function rlWireFocusKey(){
  if (_rlFocusKeyWired || typeof document === 'undefined') return;
  _rlFocusKeyWired = true;
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    /* Asked of whichever page is mounted, for the reason rlFocusPage gives —
       on the counterparty's link the guard was #view-redline, which is never
       there, so Escape was the way out of a mode they could not enter anyway.
       Both halves are fixed together or the second is a trap. */
    if (_rlFocus && rlFocusPage()) rlSetFocus(false);
  });
}
/* ---- DOES THE TAB ROW HOLD BOTH? ASK THE BROWSER, DO NOT GUESS ----
   The row wraps on content, which is flex-wrap doing its ordinary job. What
   CSS cannot express is the consequence: the rule under the tabs has to move
   onto the spacer, and the head has to stretch, only WHEN the wrap happened.
   So this reads the wrap and records it as a class.

   IT MEASURES WITH THE CLASS OFF, always, or it would read its own effect:
   once the spacer is a full-width line the head is wrapped by definition, and
   a row that had grown room again could never come back to one line.

   Called on every paint of the workbench (the head's contents change with the
   round — a reviewer's button, an "N needs you" — and each one moves the
   width) and once on resize, throttled to a frame. */
let _rlFitWired = false;
function rlFitTabRow(){
  if (typeof document === 'undefined') return;
  const row = document.querySelector('.redline-page .rl-tabrow');
  if (!row || !row.getBoundingClientRect) return;
  const head = row.querySelector('.rl-head');
  const tabs = row.firstElementChild;
  if (!head || !tabs || tabs === head) return;
  row.classList.remove('rl-tabrow-wrap');
  row.classList.remove('rl-tabrow-tight');
  row.classList.remove('rl-tabrow-half');
  row.classList.remove('rl-tabrow-lite');
  row.classList.remove('rl-tabrow-trim');
  /* jsdom has no layout: every rect is zero, so every row would read as
     unwrapped. That is the right answer there — the class is a painting
     detail — but say so rather than letting a zero fall through by luck. */
  const dropped = () => {
    const hr = head.getBoundingClientRect(), tr = tabs.getBoundingClientRect();
    if (!hr.height && !tr.height) return null;
    return hr.top > tr.top + 6;
  };
  if (!dropped()) return;
  /* It does not fit with the full words. TIGHTEN BEFORE WRAPPING — a ThinkPad
     window is the ordinary corporate laptop, and a second line there is a band
     taken straight out of the contract (Young, 10 Aug 2026).

     ONE RUNG AT A TIME, and measure after each: the row keeps everything it
     can still afford. Reported (Young, 13 Aug 2026) because the single step
     was a cliff — one pixel of overflow at 1280px took every word off the row
     and left 402px of empty gap where they had been. The classes are
     cumulative and the order is the order of what each costs; see the
     stylesheet, where each rung's own loss is written on it.

     Measure with the rung ON, because whether IT fits is the question. */
  row.classList.add('rl-tabrow-trim');    // whitespace — nothing disappears
  if (!dropped()) return;
  row.classList.add('rl-tabrow-lite');    // the counts and the readout
  if (!dropped()) return;
  row.classList.add('rl-tabrow-half');    // the way back keeps its count
  if (!dropped()) return;
  row.classList.add('rl-tabrow-tight');   // the purple buttons, last of all
  if (!dropped()) return;
  /* Genuinely too narrow even compressed — the honest second line, with the
     full words back on: a row of its own has room for them. */
  row.classList.remove('rl-tabrow-tight');
  row.classList.remove('rl-tabrow-half');
  row.classList.remove('rl-tabrow-lite');
  row.classList.remove('rl-tabrow-trim');
  row.classList.add('rl-tabrow-wrap');
}
/* ---- THE ROW'S WIDTH CHANGES FOR REASONS THE WINDOW NEVER HEARS ABOUT ----
   Reported (Young, 10 Aug 2026): "whenever I expand or minimize the navigation
   panel, the clickable features should never go to a second line taking space
   away from the contract."

   The tighten-then-wrap ladder was already there and already right. What was
   missing is that it only ever re-ran on a WINDOW resize — and collapsing the
   nav rail does not resize the window, it resizes the CONTENT. So the row was
   measured once at paint, the rail moved underneath it, and whatever it had
   decided at the old width stood: expanded, it wrapped and stayed wrapped;
   collapsed again, it stayed tight with room to spare.

   ASK THE ELEMENT, NOT THE WINDOW. A ResizeObserver on the row itself catches
   every cause of a width change — the rail, a docked panel, a browser zoom,
   the next one nobody has thought of — without this function having to know
   about any of them. The window listener stays for the stages that have no
   ResizeObserver.

   IT COMPARES WIDTHS BEFORE ACTING, and that guard is load-bearing rather than
   an optimisation: this function's own classes change the row's HEIGHT, the
   observer reports height, and re-entering on our own effect is an oscillation
   between one line and two. Only a real width change re-asks the question.

   RE-ATTACHED ON EVERY PAINT because renderRedline rebuilds the row — an
   observer holding the previous element observes a node that is no longer on
   the page. */
let _rlFitRO = null, _rlFitW = -1;
function rlObserveTabRow(row){
  if (typeof ResizeObserver !== 'function' || !row) return;
  if (_rlFitRO){ try{ _rlFitRO.disconnect(); }catch(_){} _rlFitRO = null; }
  _rlFitW = Math.round(row.getBoundingClientRect().width);
  let queued = false;
  try{
    _rlFitRO = new ResizeObserver(entries => {
      const e = entries && entries[0];
      const w = Math.round((e && e.contentRect ? e.contentRect.width : 0));
      if (w === _rlFitW) return;      // height moved, and that was us
      _rlFitW = w;
      if (queued) return;
      queued = true;
      const run = () => { queued = false; rlFitTabRow(); };
      if (window.requestAnimationFrame) requestAnimationFrame(run); else setTimeout(run, 16);
    });
    _rlFitRO.observe(row);
  }catch(_){ _rlFitRO = null; }
}
function rlWireFitTabRow(){
  if (typeof document !== 'undefined')
    rlObserveTabRow(document.querySelector('.redline-page .rl-tabrow'));
  if (_rlFitWired || typeof window === 'undefined' || !window.addEventListener) return;
  _rlFitWired = true;
  let queued = false;
  window.addEventListener('resize', () => {
    if (queued) return;
    queued = true;
    const run = () => { queued = false; rlFitTabRow(); };
    if (window.requestAnimationFrame) requestAnimationFrame(run); else setTimeout(run, 16);
  });
}
function redlineRoundLabel(c){
  const n = Math.max(1, (((c && c.rounds) || []).length));
  const open = (window.unresolvedRedlines ? unresolvedRedlines(c) : 0);
  return `Round ${n}${open ? ` · ${open} open` : ''}`;
}
/* ============================================================
   THE WORKBENCH HOLDS ONE CONTRACT, AND SAYS WHICH
   ============================================================
   The bench is a single station: one agreement is on it at a time. That was
   already true — it reads state.activeId — but nothing recorded WHICH, so
   nothing could act on a change of occupant.

   redlineEvict is what acts on it. Bringing a new contract to the bench takes
   the previous one off and puts it back in Drafting, so the pipeline on the
   dashboard reads as what is actually being worked on rather than accumulating
   everything that has ever passed through.

   TWO THINGS IT WILL NOT DO, and both are the same principle: a stage is a
   claim about a contract, and moving one is only honest where the claim is
   still ours to make.

     · A SIGNED, closed, declined or expired agreement is not demoted. "Draft"
       on an executed contract is not a tidier pipeline, it is a false
       statement about a document somebody has signed — and status drives the
       register, the dashboard counts and the renewal calendar, so the lie
       would propagate into all three.
     · It is never SILENT. Every demotion is written to the audit trail with a
       reason and announced in a toast. A stage that moves on its own, with no
       record of who moved it or why, is the thing a person later cannot
       explain to their counterparty. */
let _redlineHeldId = null;
const redlineHeldId = () => _redlineHeldId;
/* ---- NOTHING IS DEMOTED FOR ARRIVING SECOND (owner-reported 23 Aug 2026) ----
   This function used to move the PREVIOUS occupant of the bench from Under
   Review back to Draft, on the premise that "the bench holds one agreement at a
   time" and the dashboard pipeline should read as what is actually being worked
   on. THE PREMISE WAS FALSE ABOUT THIS BUSINESS: this workspace runs eighteen
   live negotiations, so clicking through them demoted them one at a time, and
   the fifteen doors that open a negotiation — the list, the contract tab, the
   alerts panel, a playbook finding, the dashboard, the phone — were all
   eviction doors without saying so.

   THREE THINGS MADE IT WORSE THAN IT SOUNDS, and they are why this is a removal
   rather than a narrowing:

     · IT WAS ASYMMETRIC. Eviction demoted; arrival promoted nothing. So once a
       contract had been bumped, coming back and negotiating for an hour left it
       still calling itself Drafting.
     · IT WAS SILENT, despite being built not to be. The announcement was a BARE
       toast call, and a bare call draws nothing by design (see toast in
       js/core.js) — so the pop-up this feature rested on had never appeared
       once. Only the audit line recorded it.
     · AND THE TEST COULD NOT SEE THAT. test/world.js's toast stub records every
       call and defaults a missing kind to 'ok', so f91 asserted the message was
       SENT and passed throughout on a product that said nothing. The stub is
       the opposite of the rule the real function follows.

   A STAGE IS A CLAIM ABOUT A CONTRACT, and which page you last had open is not
   evidence for it. What moves a contract out of Drafting is somebody sending it
   to the other side — contractLeavesDrafting, one act behind both send doors.

   KEPT AS A STUB RATHER THAN DELETED, the way negoCounterLineHtml and
   actionBarHtml are kept: it is published on window and openRedlineWorkbench
   calls it, so a caller must not be able to bring the demotion back through a
   door nobody remembered. RL_DEMOTABLE went with the body and is STALE — flag
   any mention. */
function redlineEvict(){ return null; }
/* Bring a contract to the bench. The one entry point, so the eviction cannot
   be skipped by a caller that sets state.activeId and calls setView itself. */
function openRedlineWorkbench(id, opts = {}){
  const target = String(id == null ? '' : id) || (window.state && state.activeId);
  if (!target) return false;
  redlineEvict(target, opts);
  if (window.state) state.activeId = target;
  /* IT SAYS THAT IT NAMED ONE, rather than leaving the next paint to infer it
     from state.activeId — a global that outlives this page and is stale the
     moment the reader is standing on the list. See _rlDoorAsked, and the theme
     switch that reported the difference. */
  _rlDoorAsked = 'named';
  if (typeof setView === 'function') setView('redline');
  else renderRedline();
  return true;
}
/* ============================================================
   THE WORKBENCH AS A COMPONENT — one negotiation surface, both sides
   ============================================================
   renderRedline above is the OWNER's page: it owns state.activeId, the bench
   eviction, the header with Publish Round and Close Round. This is the same
   workbench as a MOUNT: give it a host, a contract and the mount's own rules,
   and it renders the document canvas, the Tracked Changes column and the
   Discussion column with the engine wired underneath — which is what lets the
   counterparty's page BE this design instead of the retired three-pane room.

   What the caller controls, because only the caller knows:
     side, readonly, canComment, messages, seenScope, by/author — the same
       contract wireNegotiationTab has always taken;
     bannerHtml   — the line above the grid. The wall speaks for the owner and
       the eye banner for the owner's preview; the counterparty's page speaks
       to the counterparty, and this mount does not guess at it;
     noAi         — no Copilot panel on this page, so no AI Assist on it;
     selMenu      — what highlighting text offers (the portal passes a no-op:
       a page with no Copilot has nothing to route a selection to);
     pendingDecisions / pendingProposals / org / onSendDecisions — the
       counterparty postbox, wired to whatever transport the page owns
       (the portal posts a response payload; the owner's preview hands over
       the turn);
     rerender     — the mount cannot know how its host rebuilds its contract
       (the portal reassembles it from the payload plus held answers), so
       repainting is the caller's verb. */
let _rlEmbedSeq = 0;
function redlineEmbed(host, c, opts = {}){
  const el = typeof host === 'string' ? document.getElementById(host) : host;
  if (!el || !c) return false;
  negoEnsureStyle();
  redlineLayoutCss();
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const o = { ...opts, side };
  /* A pin is a working preference on THIS contract's column — the same rule the
     owner's page keeps (see renderRedline). A mount is not exempt from it: the
     portal rebuilds its contract from the payload on every change, and a host
     that reused this mount for a second contract would open a card on it that
     this reader has never seen. */
  rlCardForgetPins(c && c.id);
  /* ---- THE SCROLL SURVIVES THE REPAINT HERE TOO ----
     renderRedline has kept the three scroll boxes across a rebuild for a long
     time. This mount — the counterparty's whole negotiation seat, and the only
     one they get — never did, so every decision, every card press and every
     reply dropped the contract to its title and then travelled back down to the
     clause. Same fault the owner reported, same shape on the screen, and it
     survived the owner's fix because the fix was written where the owner's page
     rebuilds rather than where the panes do.

     Scoped to this mount rather than to the document: the ids belong to the
     panes, and a host that mounts one beside anything else must not have its
     positions read off a different copy. */
  const _embedScroll = {};
  ['nego-scroll-work', 'nego-cards', 'rl-threads'].forEach(id => {
    const n = el.querySelector('#' + id);
    if (n && n.scrollTop) _embedScroll[id] = n.scrollTop;
  });
  /* .redline-page carries every rule this layout is drawn with; without it the
     mount renders as unstyled stacked divs. The height bound matters just as
     much: the panes scroll INSIDE themselves, and panes with no bounded
     ancestor grow to their content instead of scrolling. The sidebar mode is
     an attribute here exactly as on #view-redline — rlSetSideMode paints
     every .redline-page root, so the tabs need no embed-specific wiring. */
  el.innerHTML = `<div class="redline-page rl-embed" data-rl-side-mode="${rlSideMode()}"
    style="--rl-doc-type:${rlDocType()}px;--doc-scale:${rlDocScale()};display:flex;flex-direction:column;gap:var(--s-3);min-height:0;height:${_nea(o.height || 'min(880px, 84vh)')};">
    ${redlinePanesHtml(c, o)}
  </div>`;
  if (!el.id) el.id = 'rl-embed-' + (++_rlEmbedSeq);
  /* ---- THE MOUNT PUBLISHES HOW IT REPAINTS ----
     Most of this component's controls are wired per-mount and close over
     `o.rerender`, so they repaint the right page without being told. A few are
     DELEGATED listeners on the document, registered once at load — and a
     document-level listener has no mount in scope. Those had to guess, and
     they guessed the owner's two surfaces: #view-redline, else the contract
     tab. On the counterparty's link neither exists, so the state changed and
     nothing repainted — the control looked dead while working perfectly.
     (Reported by Young, 10 Aug 2026, against the whose-asks filter.)

     So the repaint is hung on the mount's own root where a delegated listener
     can find it by walking up from whatever was clicked. That is the same rule
     stated at rlWireClauseTools — "a mount repaints however its host says" —
     made reachable from outside the closure rather than restated in it. */
  const embedRoot = el.firstElementChild;
  if (embedRoot) embedRoot._rlRerender = typeof o.rerender === 'function' ? o.rerender : null;
  wireNegotiationTab(c, { ...o, hostId: el.id });
  negoAfterPaint(c, o, el);
  rlWireClauseTools(c, el, o);
  if (side === 'counterparty'){
    const back = el.querySelector('#nego-send-decisions');
    if (back && typeof o.onSendDecisions === 'function' && !back.dataset.rlWired){
      back.dataset.rlWired = '1';
      back.addEventListener('click', () => o.onSendDecisions(c));
    }
  }
  /* Last, after every pane exists and is wired — and through rlRestoreScroll,
     so the position is PUT BACK rather than travelled to. See its note: under
     scroll-behavior:smooth a bare assignment is a request to animate from the
     top, which is the second half of the same fault. */
  Object.keys(_embedScroll).forEach(id =>
    rlRestoreScroll(el.querySelector('#' + id), _embedScroll[id]));
  return true;
}

/* ---------- PUTTING A SCROLL BACK IS NOT TRAVELLING TO IT ----------
   The negotiation canvas is `scroll-behavior:smooth`, which is right for every
   scroll a reader ASKS for — pressing a change card should visibly travel to
   its clause, so the eye can follow the page rather than being teleported and
   having to re-find itself.

   It is exactly wrong for restoring a position after a repaint. A rebuilt
   scroller starts at 0, and `el.scrollTop = 1800` under a smooth rule is a
   REQUEST TO ANIMATE from 0 to 1800: the contract visibly shot to the title
   and crawled back down on every decision, every card press and every save.
   The page was not going anywhere — it was being put back — and putting
   something back should take no time at all.

   So the rule is suspended for the width of the assignment. Deliberately not
   removed from the stylesheet: the smooth rule is what makes rlLinkFocus read
   as a journey to the clause, and that is a feature this screen is built on. */
function rlRestoreScroll(el, top){
  if (!el || top == null) return;
  const prev = el.style.scrollBehavior;
  el.style.scrollBehavior = 'auto';
  el.scrollTop = top;
  /* Restored rather than left at auto: the next scroll this element makes is a
     reader's, and that one is meant to be smooth. */
  el.style.scrollBehavior = prev;
}

/* redlineRoundLine lived here: the strip's one-sentence summary of the round.
   It is gone with the line it built — see the note on .rl-head. Every fact it
   stated is still on screen (the round chip on the tab row, the two counts on
   the sidebar pills), and a builder nothing calls is how a removed feature
   comes back the next time somebody needs a sentence. */

/* ============================================================
   NEGOTIATIONS AS A PLACE — the door, the memory, the list
   ============================================================
   Negotiate came off the room's tab row (Young, 12 Aug 2026) and became a door
   in the sidebar. Everything that decision needs is here, because all of it is
   one question asked from different chairs: WHICH NEGOTIATIONS ARE THERE, and
   WHAT IS WAITING ON ME IN THEM.

   ---- ONE COUNT, FOUR SURFACES ----
   The amber number used to live on the Negotiate tab and count that contract's
   changes. It now has to answer in four places at once — the sidebar door
   (across every agreement), the round line under a contract's title, the
   Document tab's button, and the workbench's own toolbar. Four readings of one
   number is how a door saying 3 ends up over a column showing 2, so there is
   one function and they all call it.

   IT READS AND DOES NOT WRITE, which here is load-bearing rather than tidy.
   negoChanges() runs negoInit(), and negoInit() CREATES a negotiation on any
   contract that has none — so a sidebar count that asked negoChanges about all
   145 contracts would silently start a negotiation on all 145 of them. The
   changes are read off the record raw. A contract with nothing on the table
   answers zero either way, so the workbench's own toolbar loses nothing by
   asking the safe question. */
function negoNeedsYouIds(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* Not in Counterparty View. That is a window onto their page, read-only by
     decision, and "2 need you" there would be counting somebody else's work
     and offering a jump to a card with no verbs on it. */
  if (side === 'counterparty') return [];
  const all = Array.isArray(c && c.changes) ? c.changes : [];
  if (!all.length) return [];
  const wall = (typeof rlHiddenFrom === 'function') ? rlHiddenFrom(c, side) : new Set();
  const mine = (typeof rlMyCardIds === 'function') ? rlMyCardIds(c, { side, readonly: false }) : null;
  return all.filter(x => x && x.status === 'pending' && !x.withdrawn
    && x.authorSide !== side && !wall.has(x.id)
    && (!mine || mine.has(String(x.id)))).map(x => x.id);
}
/* IS THERE A NEGOTIATION ON THIS AGREEMENT AT ALL — the predicate the door, the
   list and the Document tab's button all ask, so "live" means one thing.

   A signed or declined agreement is not being argued over any more, whatever is
   still recorded against it. Reading `c.negotiation` alone was not enough: the
   record survives the deal it belonged to, and a door that reopened a finished
   argument is exactly what the design refused. */
const NEGO_DEAD_STATUS = new Set(['Signed', 'Declined']);
function negoIsLive(c){
  if (!c || !c.negotiation) return false;
  if (c.archived) return false;      // the shelf argues with nobody (WO-5)
  if (NEGO_DEAD_STATUS.has(c.status)) return false;
  return Array.isArray(c.changes) && c.changes.length > 0;
}
/* Every live negotiation this reader may see, most recently moved first.

   SCOPE IS NOT CHECKED HERE and that is deliberate: state.contracts IS the
   caller's already-scoped bootstrap — the server filtered it on the way out
   (folderScopeFor), the way every other count in this app is built. A second
   filter here would be a browser-side copy of a server rule, free to disagree
   with it. */
function negoLiveList(){
  const cs = (window.state && Array.isArray(state.contracts)) ? state.contracts : [];
  return cs.filter(negoIsLive).sort((a, b) =>
    String(b.lastAction || '').localeCompare(String(a.lastAction || '')));
}
/* How many changes are waiting on this reader across every live negotiation.
   The sidebar door's number. */
function negoNeedsYouTotal(){
  return negoLiveList().reduce((n, c) => n + negoNeedsYouIds(c).length, 0);
}
/* ---- WHICH ONE THE DOOR REOPENS ----
   Per person, per browser, and it survives closing the window — the same shape
   as every other "where was I" in this app. It never travels: which agreement
   somebody was last arguing over is nobody else's business, and a shared value
   would put two people in each other's chairs. */
const NEGO_LAST_LS = 'hati.v1.lastNegotiation';
function negoLastKey(){
  const u = (typeof window.currentUser === 'function') ? window.currentUser() : null;
  return NEGO_LAST_LS + '.' + ((u && (u.id || u.email)) || 'anon');
}
function negoRememberOpened(id){
  if (!id) return;
  try{ localStorage.setItem(negoLastKey(), String(id)); }catch(_){}
}
/* The remembered contract, ONLY if reopening it still makes sense. Signed,
   declined, deleted, or on a stream this person can no longer reach — every one
   of those falls through to the list rather than to a dead page. */
function negoLastOpened(){
  let id = '';
  try{ id = localStorage.getItem(negoLastKey()) || ''; }catch(_){ return null; }
  if (!id) return null;
  const c = (typeof getContract === 'function') ? getContract(id) : null;
  return negoIsLive(c) ? c : null;
}
/* THE DOOR. Pressing Negotiations in the sidebar (or its twin in the phone's
   bar) reopens the last negotiation; with nothing to reopen it lands on the
   list, which says so at the top. Both outcomes are the same view — renderRedline
   decides between them — so there is one route in and no way for the two to
   drift.

   ---- AND IT TAKES {list:true} (owner-asked, 12 Aug 2026) ----
   Once you are INSIDE a negotiation the sidebar is no use for reaching the
   list: it reopens the negotiation you are standing in, which is exactly what
   it is for. So the page grew a door of its own ("Live negotiations", far left
   of its control row) and it presses THIS function with one argument rather
   than routing to the list itself. A second route would be a second answer to
   "where is the list", free to drift from the first — and the list is not a
   view of its own, it is what renderRedline draws when nothing is named. */
function openNegotiations(opts){
  _rlDoorAsked = (opts && opts.list) ? 'list' : 'reopen';
  if (typeof setView === 'function') setView('redline');
  else renderRedline();
  return true;
}
/* Set by the door and consumed by the very next paint. It is the difference
   between "take me to my negotiations" (reopen the last one) and "take me to
   THIS negotiation" (openRedlineWorkbench named it), which state.activeId alone
   cannot tell apart — it still holds whatever contract the reader last opened
   anywhere in the app. 'list' is the third answer: take me to ALL of them,
   whatever is remembered. */
let _rlDoorAsked = false;
/* Whether the LIST is what this page is currently showing. Not derivable from
   _redlineHeldId, where null means both "the list is up" and "nothing has been
   painted yet" — and those want opposite answers on a bare repaint. Per sitting,
   in memory: a reload is a first paint, which resolves through the door. */
let _rlShowingList = false;

/* ---- WHOSE MOVE IS IT ON THIS AGREEMENT ----
   Three readings, one function, asked by every surface that draws the state:
   the desktop table's last column, the phone's card, and the band a row is
   filed under. Counted with negoNeedsYouIds like everything else, so a door
   reading 3 cannot sit over a list reading 2 — and, like it, it READS `c.changes`
   RAW rather than through negoChanges(), which would start a negotiation on
   every contract it was asked about. */
function negWhoseMove(c){
  const needs = negoNeedsYouIds(c).length;
  if (needs) return { k: 'you', n: needs };
  const open = (Array.isArray(c && c.changes) ? c.changes : [])
    .filter(x => x && x.status === 'pending' && !x.withdrawn).length;
  if (!open) return { k: 'clear', n: 0 };
  /* ---- AND "WITH THE OTHER SIDE" HAS TO BE TRUE TO BE SAID ----
     (owner-reported on MK-255, 13 Aug 2026.) This answered 'them' whenever
     anything was pending, without ever asking whether they could SEE it — and
     it feeds three surfaces at once: the list's bands, the row pill and the
     phone's cards. A whole agreement was banded "With the other side" while
     the counterparty held no live copy of it.

     WHERE THEY HAVE NO LIVE COPY THE MOVE IS OURS, and that is not a
     softening of the claim, it is the correct one: the thing that has to
     happen next is that somebody sends them a link. So it bands under
     "Waiting on you", where work this reader can actually do already lives,
     and carries `why` so the pill can say which kind of waiting it is rather
     than counting decisions that are not there.

     'unknown' — nobody has asked the server for this contract's links — falls
     through to the old answer untouched. See negoTheirCopy: inventing a new
     untruth to replace the old one would be no better. */
  /* ---- AND NEITHER HAS AN ASK WE HAVE NOT SENT YET ----
     (audit finding 4, 14 Aug 2026 — the SECOND route into MK-255's class.)
     The 13 Aug fix asked whether the counterparty holds a copy at all. It did
     not ask whether the pending changes have actually LEFT: `open` counts every
     pending change, ours included, and our own unpublished asks are held by
     holdUnsent until Publish Round. So one clause written and not yet sent
     banded the whole agreement under "With the other side" while nothing had
     left the building — and negoTurnBanner, reading the same contract three
     inches away, correctly said "1 change you have not sent yet".

     negoUnsentAsks is that reading and it is the one already used to say this
     elsewhere; asking it here is what makes the two agree. WHERE WE HOLD
     UNSENT WORK THE MOVE IS OURS, for the same reason the no-copy branch
     below gives: the thing that has to happen next is that we send it.

     ORDERED BEFORE the reach question deliberately. Unsent work is a fact
     about OUR side and is known for certain; whether they hold a copy is a
     reading of the share cache that can answer 'unknown'. The certain question
     goes first. */
  const unsent = (window.negoUnsentAsks ? negoUnsentAsks(c).length : 0);
  if (unsent) return { k: 'you', n: unsent, why: 'unsent' };
  const reach = (window.negoTheirCopy ? negoTheirCopy(c) : 'unknown');
  if (reach === 'none') return { k: 'you', n: open, why: 'nocopy', reach };
  return { k: 'them', n: open, reach };
}
/* ---- THE LIST BEHIND THE DOOR — IT IS THE CONTRACTS TABLE NOW ----
   Owner's decision, 12 Aug 2026, and it REVERSES the position that stood here
   for two days. This page used to be a signpost of twenty lines, and the
   argument written above it was that a filterable, sortable, searchable table
   of contracts on a second page would eventually disagree with the register
   about what a row says. That argument was not wrong; it was overruled, and the
   fear it names is answered a different way — BY REUSE. There is still exactly
   one table of contracts in this product. renderRegister builds this page:
   its filter bar, its columns, its row builder, its footer, its wiring. Nothing
   about a row is written twice, so nothing about a row can drift.

   FOUR THINGS ARE DIFFERENT, and they are the whole design:

     1  the last column is WHOSE MOVE it is — a state, not an action;
     2  the rows sit under three banded headers in a fixed order (waiting on
        you, with the other side, nothing outstanding), each carrying its own
        count. A band is the thing a flat register cannot produce and it is what
        stops this page being mistaken for Contracts;
     3  the heading carries the live count, so the number above the table is
        this page's own and never 145;
     4  the filter bar opens with a LOCKED chip reading "Live negotiations" —
        not a filter the reader chose and not one they can clear.

   AND THE ONE THING THAT DID NOT CHANGE: live negotiations only. That narrowing
   is a property of the page, applied above every filter and untouched by Clear
   — see regSetScope in js/views/register.js, which is where the reuse and the
   lock both live. */
function negoListHeadHtml(shown){
  const live = negoLiveList().length;
  const R = (window.regState ? window.regState() : null);
  /* Is anything the READER chose narrowing this? Not the live-negotiations
     scope, which is the page itself. */
  const filtered = !!(R && (String(R.query || '').trim() || R.stage !== 'all' || R.type !== 'all'
    || R.view || (R.renewal && R.renewal !== 'all') || (R.category && R.category !== 'all') || R.only));
  const n = Array.isArray(shown) ? shown.length : live;
  /* THE RESTING SUBTITLE IS GONE (owner-asked 25 Aug 2026, off a screenshot
     with it boxed: "delete the added words highlighted"). It described the
     page — "every agreement being argued over right now, grouped by whose move
     it is" — to a reader already looking at exactly that, which is the same
     call the Contracts page's own note lost a day earlier. `ngl_sub` is STALE;
     it is left inert in the dictionary rather than deleted.

     THE FILTERED SENTENCE STAYS, and it is not the same kind of thing. TWO
     COUNTS ABOUT THE SAME THING ARE ON SCREEN AT ONCE and they measure
     different units: the sidebar door counts CHANGES waiting on this person
     across every negotiation; the bands count AGREEMENTS in the view they can
     see. With a filter on, a band reading 1 under a door reading 3 is a
     contradiction, and this line is the page resolving it — which is why it
     draws only when there is a contradiction to resolve. */
  return `<header class="ngl-head ngl-head-table">
    <h2>${i18t('ng_door_title')} <span class="ngl-live">${_ne(i18tn('ngl_n_live', live, { n: live }))}</span></h2>
    ${filtered ? `<p>${_ne(i18t('ngl_sub_filtered', { n, live }))}</p>` : ''}
  </header>`;
}
function renderNegotiationsList(host){
  const el = host || document.getElementById('content');
  if (!el) return;
  const live = negoLiveList();
  /* ---- AN EMPTY GROUP IS INFORMATION; THREE OVER NOTHING IS NOT ----
     With no live negotiation anywhere, this is not a table that filtered to
     zero — it is a page with no subject, and the empty state that explains how
     one starts is the whole content. The table (with its filter bar, its bands
     and its "nothing matches · clear the filters" state) is drawn only once
     there is something for a filter to narrow. */
  if (!live.length){
    if (window.regSetScope) regSetScope(null);
    el.innerHTML = `<div class="view-enter ngl-wrap">
      <header class="ngl-head">
        <h2>${i18t('ng_door_title')}</h2>
      </header>
      <section class="ngl-empty">
        <h3>${i18t('ng_door_none')}</h3>
        <p>${i18t('ng_door_none_how')}</p>
        <button type="button" data-ngl-register class="ui-btn ui-btn-primary" style="padding:var(--s-2) var(--s-4)">${i18t('ng_open_register')}</button>
      </section>
    </div>`;
    el.querySelectorAll('[data-ngl-register]').forEach(b => b.addEventListener('click', () => {
      if (window.regSetScope) regSetScope(null);
      if (window.regState){ const R = regState(); R.stage = 'all'; R.sel = {}; }
      setView('register');
    }));
    if (typeof setActiveNav === 'function') setActiveNav('redline');
    return;
  }
  /* Through `window`, like every other cross-module call in this app: these are
     two files, and a bare name resolves only because the browser puts every
     top-level declaration in one scope. A stage without the register has no
     Negotiations page to draw — this page IS that table — so it draws nothing
     rather than a second, quietly different one. */
  if (typeof window.renderRegister !== 'function') return;
  window.renderRegister({ scope: 'negotiations', nav: 'redline',
    hostId: (el.id || 'content'), head: cs => negoListHeadHtml(cs) });
}

function renderRedline(){
  const host = document.getElementById('content');
  if (!host) return;
  /* ---- THE SCROLL SURVIVES THE REPAINT ----
     Saving a redline, adding a tag, answering a card — every one of them
     repaints this page whole, and a rebuilt scroller starts at the top:
     redline a clause six pages down and the contract shot back to the title.
     The three scroll boxes keep their ids across paints, so their positions
     are read before the rebuild and put back after the wiring. */
  const _keepScroll = {};
  ['nego-scroll-work', 'nego-cards', 'rl-threads'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.scrollTop) _keepScroll[id] = el.scrollTop;
  });
  redlineLayoutCss();
  /* ---- WHICH NEGOTIATION IS THIS ----
     FOUR ways in, and they resolve differently on purpose. Every one of them
     SAYS which it is: state.activeId cannot tell them apart, because it outlives
     this page and still holds whichever contract the reader last opened
     ANYWHERE in the app.
       'named'  — openRedlineWorkbench named a contract (a row, a notice, the
                  Document tab's button, the phone). That one wins.
       'reopen' — the sidebar door asked for "my negotiations": the one this
                  reader was last ON, which is not the same question.
       'list'   — the page's own "Live negotiations" door asked for ALL of them,
                  so what is remembered is not consulted, or the button would
                  re-open the negotiation the reader is pressing it FROM.
       nothing  — A BARE REPAINT, which is not a navigation at all and must not
                  behave like one: redraw whatever is already on the screen.

     THE FOURTH ONE IS NEW (owner-reported, 13 Aug 2026) AND IT IS WHY THE OTHER
     THREE NOW SAY THEIR NAME. A bare repaint used to fall through to
     state.activeId, which is indistinguishable from the 'named' door — so a
     reader standing on the LIST who changed the theme was thrown into some
     contract's workbench. setTheme repaints the current view (inline-styled
     chips and render-time SVG colours do not answer a class flip), the market
     switch does the same, and every self-repaint on this page goes the same
     way. None of them named anything; the page simply forgot it was showing a
     list, because "showing the list" was not a fact anybody had written down.
     _redlineHeldId is that fact, recorded on the PAINT — the contract on the
     bench, or null for the list — so a repaint has something true to read. */
  const doorAsked = _rlDoorAsked; _rlDoorAsked = false;
  const pick = id => (id && typeof getContract === 'function') ? getContract(id) : null;
  let c = null;
  if (doorAsked === 'list') c = null;
  else if (doorAsked === 'reopen') c = negoLastOpened();
  else if (doorAsked === 'named') c = pick(state.activeId);
  /* A BARE REPAINT. "Showing the list" is a fact this page has to have written
     down, and _redlineHeldId alone cannot carry it: null there means BOTH "the
     list is on screen" and "nothing has been painted yet", and the two want
     opposite answers. _rlShowingList separates them. Held first on the bench
     path, so a repaint follows the sheet the reader is looking at rather than a
     global something else may have moved under them. */
  else c = _rlShowingList ? null : pick(_redlineHeldId || state.activeId);
  /* A named contract that turns out to have nothing on the table is still that
     contract's page — the workbench is where a negotiation STARTS. Only the
     door falls through to the list. */
  if (doorAsked && !c){
    _redlineHeldId = null; _rlShowingList = true;
    renderNegotiationsList(host);
    return;
  }
  if (c && window.state) state.activeId = c.id;
  /* A pin is a working preference on THIS contract's column. Carrying it to the
     next contract would open a card the reader has never seen. */
  rlCardForgetPins(c && c.id);
  /* Recorded on the paint, not on the navigation: however the reader arrived —
     the tab, the register, a link — the bench now knows what is on it. */
  _redlineHeldId = c ? c.id : null;
  /* Recorded on the same paint and for the same reason as the line above: what
     is ON THE SCREEN, so the next repaint has something true to read. */
  _rlShowingList = !c;
  /* Arriving on a real negotiation is what the door remembers — recorded on the
     PAINT, not on the navigation, so however the reader got here (the Document
     tab, Home's decisions card, a playbook finding, the phone) the door knows
     where to put them back. */
  if (c) negoRememberOpened(c.id);
  /* A workbench with no agreement on it is not an error page any more: it is
     the list. Reached when a link, a stale session or an evicted bench leaves
     nothing named — the same place the door lands, so there is one answer to
     "nothing open" wherever it is asked. */
  if (!c){ renderNegotiationsList(host); return; }
  /* ---- THE OTHER SIDE OF EVERY THREAD, FETCHED BEFORE THE CARDS SAY "NO
     NOTES" (Young, 10 Aug 2026: "the notes from the counterparty are not
     being received"). A counterparty's reply is filed in the discussion
     channel — a public page cannot write to our contract record — and the
     cards merge the two stores through negoMergedThread. The ROOM fetched
     that channel before drawing (openNegotiationOwnerRoom) and this page
     never did, so a note posted on their portal existed on the server and
     nowhere on the owner's screen until some other view happened to load it.
     Fire-and-forget, one fetch per sitting: the page paints immediately and
     repaints when the replies land. */
  if (window.API_MODE && API_MODE() && window.api && !Array.isArray(c._messages) && !c._msgFetch){
    c._msgFetch = true;
    api('contracts/' + c.id + '/messages')
      .then(r => { c._messages = (r && r.messages) || [];
        if (document.getElementById('view-redline') && _redlineHeldId === c.id) renderRedline(); })
      .catch(() => { c._messages = c._messages || []; });
  }
  /* ---- AND WHETHER THE OTHER SIDE HOLDS A LIVE COPY ----
     Same shape, same reason, one fetch per sitting: this page decides whether
     to CLAIM that the deal is waiting on them (negoTheirCopy), and the share
     list is what that reading is made from. Without it this screen — the one
     the fault was reported from — would answer 'unknown' forever and the
     honesty would never reach the place it was asked for. The contract room
     already fills the same cache through its shares panel; this is the door
     that does not go through the room. Fire and forget: paint now, repaint
     only if the answer landed. */
  /* ONCE PER SITTING, ON THE CONTRACT — exactly as c._msgFetch above, and the
     flag is the load-bearing part rather than a tidiness. Guarding on
     "is the cache filled" instead looks equivalent and is not: where there is
     nothing to fetch (local mode, a failed request) the cache never fills, so
     every repaint would schedule another repaint and the page would spin
     forever. Caught by the browser journey, which simply stopped responding to
     a click. */
  if (window.API_MODE && API_MODE() && window.ensureSharesCached
      && window.sharesKnown && !sharesKnown(c) && !c._shareFetch){
    c._shareFetch = true;
    ensureSharesCached(c).then(() => {
      if (document.getElementById('view-redline') && _redlineHeldId === c.id) renderRedline();
    }).catch(() => {});
  }
  const side = _redlineSide === 'counterparty' ? 'counterparty' : 'owner';
  /* ---- THE COUNTERPARTY VIEW IS A PREVIEW, NOT A DIFFERENT CHAIR ----
     (owner-asked, 19 Aug 2026.) `side` still decides what the DOCUMENT and the
     cards draw — that is the whole point of the toggle. It no longer decides
     what the CONTROL ROW says. Every label on that row used to swap with the
     view (our count for theirs, "Publish Round" for "Send Response", four of
     our controls removed outright), so flipping the toggle shuffled the row
     sideways and shuffled it back — on the one control whose entire purpose is
     comparing the two views, where movement is the noise. The row is drawn
     from OUR chair either way and goes DEAD; rowSide is what pins it. */
  const seg = (v, label) => `<button data-redline-side="${v}" class="rl-seg${side === v ? ' on' : ''}">${label}</button>`;
  /* AND NEITHER ACT IS THE REVIEWER'S while their review is open. Publishing
     puts wording in front of the counterparty; closing the round makes the
     agreed wording the next baseline, which settles what was sent. A person who
     accepted a review does neither here until they have handed it back — the
     posture, not the gate. See rlActorHeld. Read HERE, at the top, because the
     row's own labels below depend on it. */
  const _rvPosture = rlActorHeld(c, { side, readonly: false });
  /* A narrowed reviewer keeps the HIDING — their controls are absent by
     permission, not by posture — so the preview flag asks that first. */
  const preview = side === 'counterparty' && !_rvPosture;
  const rowSide = preview ? 'owner' : side;
  /* The same pill, asked a different question: which of the three readings the
     document is drawn in. aria-pressed rather than a tab role — nothing is
     being switched between, one surface is being drawn differently. */
  /* ---- WHAT IS WAITING ON THIS READER ----
     The other side's live asks, in the order the document carries them, minus
     anything walled off from this seat and minus the clauses a reviewer was not
     handed. Exactly the set the queue marks "now" and the cards badge "awaiting
     you", read from the same predicates, so a toolbar saying two and a column
     showing three cannot happen. */
  /* The same arithmetic the sidebar door, the round line and the Document tab's
     button run — negoNeedsYouIds, one function, so the four cannot disagree. */
  const needsYou = negoNeedsYouIds(c, { side: rowSide });
  /* ---- THE BATCH SEND ----
     Drawn only when there is something behind the wall, and labelled with how
     much. It is a proxy onto #nego-send like Publish Round is — the same one
     act, taking the same route through the share/response flow — so pressing it
     publishes every unsent draft in one go rather than opening a queue of
     confirmations. See redlineSyncProxies for why a proxy can go dead. */
  /* ---- THE HEADER CARRIES ONE VERB, NOT THREE ----
     "Send All" and "Accept All Non-Risk" used to render here as PROXIES onto
     the engine's own controls — which ALSO rendered, both of them, at the head
     of the Tracked Changes column (the .nego-bulk pair and the .rl-sendslot
     postbox). Two copies of every batch verb crowded this strip until the
     contract dropdown clipped mid-word. The column's copies were the ones
     beside the cards they act on, so they were the ones that stayed; the
     header keeps only Publish Round — the act that closes the strip's own
     story — and Close Round when it is earned.

     THE BULK PAIR HAS SINCE GONE FROM THE COLUMN TOO, on both seats, so the
     only survivor of that argument is the hidden .rl-sendslot postbox Publish
     Round presses. The rule the argument settled still holds: a batch verb
     belongs beside the cards it acts on, and there is one of it. */
  /* ---- PUBLISH ROUND HAS LEFT THIS ROW (owner-asked 27 Aug 2026) ----
     One word was doing two jobs. "Publish Round" SENT the unsent redlines; it
     never closed anything, and the act that really ends a round sat two
     controls along wearing almost the same clothes. Meanwhile the column head
     twelve pixels below already carried "Send all N" — the same act, on the
     cards it acts on, with the count on it — so the row's one filled verb was
     the quieter, worse-placed of a matched pair.

     THE ACT IS NOT LOST AND WAS NEVER THIS BUTTON'S: rlUnsentSendHtml presses
     the same postbox (#nego-send) through the same delegated proxy listener,
     and every per-card Send still presses it too. What went is a third door
     onto one letterbox.

     WHAT WENT WITH IT, said out loud. The head printed "· N held · N in
     review" beside the verb, which was the only place those two numbers
     appeared on this row. They are not lost either — Send all's own hover
     carries the whole sentence, and the piles below it are literally called
     "Out for review" and "Held by your reviewer" with their own counts, which
     is a stronger statement of the same fact than a suffix that the fit
     ladder dropped on its second rung anyway. `.rl-send-detail` is STALE.

     `sendWho`, `sendVerb`, `sendCounts` and `sendTip` went with the button
     they existed for; `sendTarget` went with them, because the proxy target
     is chosen by the builder that draws the button. */
  /* ---- THE COUNTERPARTY VIEW IS A PREVIEW, NOT A DIFFERENT CHAIR ----
     (owner-asked, 19 Aug 2026.) Flipping the toggle used to REMOVE our own
     four controls from the row, so every remaining control jumped sideways
     and jumped back when you flipped again — on a toggle whose whole purpose
     is comparing the two views, where anything that moves is noise.

     They stay where they are and are DEAD instead: `disabled`, dimmed, and
     not pointing, with a title that says which press brings them back. That
     is not the "a verb that cannot work is not drawn" rule being broken —
     that rule is about a verb this PERSON may not use, and this person may
     use all four. It is the KPI picker's rule instead: at the ceiling the
     un-tickable rows are disabled AND dimmed AND explained, because the
     refusal has a way forward on the same screen. Here the way forward is
     one press away, on the toggle beside them.

     A REVIEWER IS UNCHANGED. _rvPosture genuinely may not do these things —
     that hiding is a permission and stays a hiding. */
  const deadAttrs = preview
    ? ` disabled aria-disabled="true" data-rl-dead="1" title="${_nea(i18t('ng_preview_dead'))}"` : '';
  /* ---- CLOSE ROUND SITS IN THE COLUMN HEAD NOW (owner-asked 27 Aug 2026) ----
     It is built by rlCloseRoundHtml and drawn beside Send all, which is where
     the round actually is. Two reasons, and the second is the one that
     mattered: the two acts of a round — send what is outstanding, then close
     it — belong on one line where a reader can see that only ever one of them
     is live; and this row was wrapping on a laptop, which is what freed the
     space to put them together.

     IT IS ALSO DRAWN EARLIER NOW. Here it appeared only once every change had
     been answered, so until that moment there was nothing on screen saying a
     round is a thing you close. It is drawn from the first change onwards and
     GREYED until the round is settled, with the reason on its hover — this
     product's own rule: grey where HaTi can know before the press, never a red
     box after it. The gate itself is unchanged: negoAdvanceRound is still what
     runs, still behind the same naming dialog, and prog.pending is still what
     decides. */
  /* ---- THE PAGE'S OWN VERBS, PLACED BY THE SHARED HEAD (owner-asked 22 Aug
     2026, off the mock-up: the negotiation head carries Publish round, Internal
     review, Share and More on one line with the title) ----

     THEY ARE STILL BUILT HERE, which is the constraint that governed the old
     arrangement and still does: "a page's own primary act must not depend on
     another page's module". roomHeadHtml's `primary` option already accepts a
     STRING for exactly this — the head PLACES what this file BUILDS. Nothing
     was moved into js/views/contract.js, and a stage that renders this page
     without the head draws no head at all, so there is nothing left to lose.

     Publish Round is this page's ONE filled act; the playbook pass and the
     review door are ordinary verbs beside it, which is the platform's button
     rule. Their order is the mock-up's: the act first, then the two things you
     might do instead of it. */
  const headVerbs = `
        ${''/* ---- THE PLAYBOOK PASS HAS MOVED INTO THE MORE MENU ----
               (owner-approved render, 22 Aug 2026.) The design's head carries
               four buttons and this row had five plus the desk chip. Of the
               five it is the one that belongs least: it runs across the WHOLE
               contract once at the start of a round, which is a job, not one of
               the acts you reach for while working the round. Its row is built
               here — same attribute, same permission rules, same dead-in-preview
               state — and PLACED by the head; see menuRow in roomHeadHtml.
               data-rl-pbreview is unchanged, so its handler and every test that
               presses it are untouched. */}
        ${''/* ALWAYS A WAY IN. This used to become "With John Wayne" the
               moment anything went out — a button that had stopped being a
               button, on the one control you need again the second you spot
               something else worth escalating. Who is holding what belongs
               on the cards, where the changes are; this row's job is to open
               the door. Its word follows the state, because the reviewer and
               the requester press the same place for opposite acts. */}
        ${(typeof canEdit !== 'function' || canEdit()) && window.reviewState ? (() => {
          const st = reviewState(c);
          const label = st.phase === 'yours' ? i18t('rv_head_return') : i18t('rv_head_ask');
          return `<button type="button" data-rl-review class="rl-pb-btn"
            data-rv-phase="${_nea(st.phase)}"${deadAttrs || ` title="${_nea(i18t('rv_head_title'))}"`}>&#128100;<span class="rl-word"> ${_ne(label)}</span></button>`;
        })() : ''}
  `;
  /* The playbook pass's row, for the head's More menu — see the note where it
     used to sit on the strip. Built here because this page owns its rules. */
  const menuRow = (!_rvPosture && (typeof canEdit !== 'function' || canEdit()))
    ? `<button type="button" data-rl-pbreview${preview ? ' disabled aria-disabled="true" data-rl-dead="1"' : ''}
        title="${_nea(preview ? i18t('ng_preview_dead') : i18t('ng_review_every_clause'))}"
      ><span aria-hidden="true">&#10022;</span>${i18t('ng_review_vs_playbook')}</button>` : '';
  host.innerHTML = `
    <!-- The reference is lg:h-full: the workbench fills the window and each of
         its three columns scrolls inside itself, rather than the page growing
         past the viewport and taking the whole thing with it. --view-h is the
         room the shell actually leaves, measured after the header renders. -->
    ${''/* ---- THE PAGE HAS NO PADDING OF ITS OWN ANY MORE (owner-approved
           render, 22 Aug 2026) ----
           The head and the control bar are WHITE BANDS that run the full width
           of the page and carry their own 24px inset; the working area below
           them carries the page measure (48px). A single padding on this
           element could not do both — it inset the bands as well, so they read
           as two floating strips rather than as the top of a page. Nothing else
           moved: --view-h, the flex column and min-height:0 are what make the
           columns scroll inside themselves and are untouched. */}
    <div id="view-redline" class="view-enter redline-page${_rlFocus ? ' rl-focus' : ''}" data-rl-side-mode="${rlSideMode()}" style="--rl-doc-type:${rlDocType()}px;--doc-scale:${rlDocScale()};height:var(--view-h);box-sizing:border-box;display:flex;flex-direction:column;gap:0;padding:0;min-height:0;">
      <!-- ---- THE SAME SHELL AS THE DOC PAGE ----
           The back arrow, the contract's name and status, and the document
           verbs (Share / Import / Compare), exactly where the Doc page puts
           them — so switching tabs moves the WORK, never the furniture. The
           actions press the workspace's own handlers; a page that redraws the
           same buttons over different code is two pages pretending. -->
      ${''/* THE ROOM'S HEAD, not a second copy of it. This drew its own back
             arrow, name, status and Share/Import/Compare row while the
             contract page drew its own — the same furniture, twice, in two
             files. Both call roomHeadHtml now. The primary is suppressed here
             because this page has its own act at the other end of the strip:
             Publish Round. */}
      ${''/* Whether this is the owner's window onto the counterparty's seat
             travels with the head, so the desk chip knows not to draw: who
             works this negotiation on our side is internal, and the preview
             exists to show what the OTHER side sees.

             Read off `side` rather than off `previewing`. They are the same
             fact, but `previewing` is declared two hundred lines below this
             string and a `const` read before its declaration is a
             ReferenceError that takes the whole page down — which is exactly
             what it did. */}
      ${''/* backToContract: this page has no tab row any more, so the head's
             arrow — and its title — are the only way off it. See roomHeadHtml. */}
      ${''/* ---- AND IF THERE IS NO HEAD, THE VERBS COME HOME ----
             The head is built by js/views/contract.js, and this page can be
             rendered without that file (some test stages do). Handing it the
             verbs is safe only if their absence is caught: without this branch
             a stage with no head would draw no Publish Round at all, which is
             precisely what the old arrangement's comment warned against —
             "a page's own primary act must not depend on another page's
             module". The verbs are built here either way; only their placement
             follows the head. */}
      ${(window.roomHeadHtml ? roomHeadHtml(c,{primary:headVerbs,primaryFirst:true,previewing:side==='counterparty',backToContract:true,menuRow}) : `<div class="room-acts">${headVerbs}</div>`)}
      ${''/* THE ROOM'S OWN TAB ROW, NOT A SECOND ONE. This page carried a
             hand-written [Docs][Negotiate] pair while the contract page
             carried its own — two switchers for one room, in two files, free
             to drift apart. Both now call roomTabsHtml in js/views/contract.js,
             so the row is written once and the five tabs appear on both.

             It sits on a LINE OF ITS OWN, above the strip that carries the
             round and the verbs. Underline tabs cannot share a wrapping row:
             each wrapped line has its own height, so a tab on the first line
             would leave its rule stranded in the middle of the strip. */}
      ${''/* ---- THE TAB ROW CARRIES THE TABS AND NOTHING ELSE ----
             It used to end with a contract switcher and a round chip. Both are
             gone on the design's call (Young, 10 Aug 2026): the switcher is a
             jump to a DIFFERENT agreement sitting on the row that names this
             one, and the round is a fact about the contract, so it reads with
             the other facts under the title — see roomHeadHtml's room-sub,
             which both this page and the contract page draw from. */}
      ${''/* ---- THE CONTROLS RIDE ON THE TAB ROW ----
             They had a strip of their own directly under it — a full-width
             band between the tabs and the contract, with the tab row's own
             right-hand half standing empty above it. Reported off exactly that
             screenshot (Young, 10 Aug 2026: "move the buttons to the top right
             as highlighted"), and it is the same complaint the Document tab
             answered a moment earlier: the space above the agreement belongs to
             the agreement.

             So the row does both jobs. Tabs on the left, a gap, then what this
             page can do — and the page gets a whole band of height back.

             THE ORDER IS THE DOCUMENT TAB'S ORDER. Ways of LOOKING first (how
             the contract reads, whose seat you are looking from), then the one
             act, filled, at the far right — where Open Negotiate sits on the
             other tab. A reader moving between the two finds the button in the
             same place.

             .rl-head keeps its name: it is still the head's controls, and half
             the test suite reaches for them through it. What it does not keep
             is room-quiet — that is a BAND's clothes, and this is not a band. */}
      ${''/* ---- AND THE ROW NO LONGER CARRIES TABS ----
             Negotiate left the room's tab row and became a door in the sidebar
             (owner's call, 12 Aug 2026), and this page is where that decision is
             felt: it is its own screen now, not a tab of the contract, so it
             draws no room tabs at all. Key terms, Signing and History are one
             press away through the head's back arrow, not zero — the price of
             the focused screen, and the reason that arrow is not optional.

             The row itself stays, spacer and all: it is what carries this page's
             own controls and its bottom rule, and the fit ladder (rlFitTabRow)
             measures it. Only roomTabsHtml's call is gone. */}
      <div class="room-tabrow rl-tabrow">
        ${''/* ---- THE ROW READS LEFT TO RIGHT: WHAT YOU ARE LOOKING AT,
               THEN HOW, THEN THE WAY OUT (owner-asked 22 Aug 2026, off the
               mock-up) ----
               The three reading tabs led the row in the design and now lead it
               here: they name what the paper below is showing, so they belong
               at the start of the line the paper begins under. The view
               controls follow, and the door to the other negotiations ends it.

               THIS IS WHERE "All negotiations" MOVED TO, and it reverses the
               12 Aug placement ("a way OUT reads at the start of a line"). That
               was right while this row began with the acts; with the tabs
               leading, a way out at the far left sits ahead of the thing it is
               a way out OF. The mock-up puts it last and so does this. Its own
               rules are untouched: same door, same count, same fold rung. */}
        ${''/* ---- HOW THE CONTRACT READS, AS THREE WORDS ----
               Not a filter and not a mode the record knows about: the same
               clauses, drawn three ways. See rlReadMode for what each one
               means and why only LIVE proposals are affected. */}
        ${rlReadSegsHtml({ n: (typeof redlineCardIds === 'function')
          ? redlineCardIds(c, { side: rowSide, countAll: true }).length : 0 })}
        <span class="rl-tabrow-gap"></span>
        <section class="rl-head">
          <div class="rl-head-id">
            ${''/* Not in Counterparty View: the playbook pass can FILE
                   proposals, and that view is a window, not a chair (see the
                   mount below). The counterparty never sees the playbook either
                   way. AND NOT THE REVIEWER'S EITHER: it runs across the WHOLE
                   contract, writes its verdicts onto the record and files an
                   audit line — an authoring act on the round, by somebody who
                   was asked to look at one clause. */}
            ${''/* THE WORD IS A SPAN so the tight row can stand it down. On a
                   ThinkPad-width window (Young, 10 Aug 2026: "the highlight
                   buttons do not descend to a second line") the row compresses
                   to glyphs before it ever wraps — the title says the rest. */}

            ${''/* ---- THE WAY INTO THE WORK ----
                   A count of what is waiting on THIS reader, and a press that
                   goes to the first of them. The number is the same set the
                   queue calls "now" and the cards badge "awaiting you", so the
                   three cannot disagree. Drawn only when it is not zero: a
                   button reading "0 need you" has nothing to do. */}
            ${needsYou.length ? `<button type="button" data-rl-needsyou="${_nea(needsYou[0])}" class="rl-needs"
              title="${_nea(i18t('ng_needs_you_title'))}"><span class="rl-needs-dot"></span>${
              i18tn('ng_needs_you', needsYou.length, { n: needsYou.length })}<span class="rl-needs-go">&rarr;</span></button>` : ''}
          </div>
          <div class="rl-actions">
            ${''/* ---- THE TEXT SIZE, WHICH THIS PAGE NEVER HAD ----
                   (owner-asked, 13 Aug 2026.) The Document tab and the
                   counterparty's page both draw this stepper; the negotiation
                   page — the screen a redline is actually worked on — drew no
                   stepper at all, because the builder lives here and was only
                   ever called by the other three screens.

                   ONE PREFERENCE, NOT A SECOND KEY. rlTypeStepHtml /
                   rlWireTypeStep / rlSetDocType are the same three functions
                   the other screens call, writing the same RL_TYPE_KEY, so a
                   size chosen here is the size the Document tab opens at and
                   the reverse. A second key would be two settings for one
                   fact, and the two would disagree the first time either was
                   used.

                   ITS READOUT FOLDS ON THE TIGHT STEP of this row's fit ladder,
                   like every other word here — by CSS, so textContent never
                   changes and the suite still reads "15px". */}
            ${window.rlTypeStepHtml ? rlTypeStepHtml() : ''}
            ${''/* A PREVIEW OF WHAT THE OTHER SIDE WILL SEE is a question about
                   the round, and the round is not the reviewer's job. It also
                   mounts a whole second surface for somebody whose task is one
                   clause. */}
            ${''/* THE WORD "VIEW" TWICE IS THE GROUP'S JOB, NOT EACH BUTTON'S.
                   "Internal View | Counterparty View" spent 260px of the row
                   saying the same word twice; the mockup's own toggle reads
                   Internal | Counterparty, and the group carries the sentence
                   that says what it switches. */}
            ${_rvPosture ? '' : `<div class="rl-segwrap" role="group" aria-label="${_nea(i18t('ng_view_group'))}"
              title="${_nea(i18t('ng_view_group'))}">${seg('owner', i18t('ng_internal_view'))}${seg('counterparty', i18t('ng_counterparty_view'))}</div>`}
            ${''/* ---- AND THE ONE ACT, AT THE FAR RIGHT ----
                   Where Open Negotiate sits on the Document tab, drawn the same
                   way: filled, because it is what this page is for.

                   THE SEND STAYS ON THIS PAGE rather than moving into the shared
                   head. The head is built by js/views/contract.js and a
                   workbench rendered without that file — which some test stages
                   do — would lose its Publish Round entirely. A page's own
                   primary act must not depend on another page's module.

                   IT IS ALSO THE ONLY BATCH SEND LEFT. The Tracked Changes
                   column used to draw its own copy beside the cards and this one
                   proxied onto it; the column's copy is gone and the engine's
                   #nego-send survives, hidden, as the control this presses. */}
        ${''/* ---- THE WAY BACK TO THE OTHER NEGOTIATIONS ----
               Owner-asked, 12 Aug 2026: once you are inside one, there is no
               door to the LIST. The sidebar's Negotiations is not it — it
               reopens the negotiation you are standing in, which is what the
               sidebar is for and is not being changed.

               FAR LEFT OF THE ROW, ahead of the spacer that pushes this page's
               own controls right: a way OUT reads at the start of a line, and
               the acts read at the end. It presses openNegotiations({list:true})
               — the sidebar's own door with one argument, never a second route
               to the list, because the list is not a view of its own.

               THE COUNT IS negoLiveList's, which is the same reading the list's
               heading prints, so the number on the button and the number above
               the table cannot disagree. And it READS WITHOUT WRITING: negoIsLive
               looks at c.changes raw. Asking negoChanges() would run negoInit()
               and start a negotiation on every contract in the workspace —
               the trap the sidebar count is already written around.

               ITS WORD FOLDS one rung BEFORE the purple buttons' — on the half
               step of the fit ladder (see .rl-tabrow-half; it used to fold with
               them, until the ladder was graded on 13 Aug 2026). The icon and
               the COUNT stay, the word stands down, the title carries the
               sentence: a door reading "3" still says what is behind it, which
               is why it can afford to lose its word before a verb can.
               textContent never changes, which is what the suite reads. */
        }${(() => {
          const liveN = (typeof negoLiveList === 'function') ? negoLiveList().length : 0;
          const tip = i18tn('ng_live_list_title', liveN, { n: liveN });
          return `<button type="button" data-rl-live-list class="rl-livelist"
            title="${_nea(tip)}" aria-label="${_nea(tip)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            ><path d="m15 18-6-6 6-6"/></svg
            ><span class="rl-word">${i18t('ng_live_list')}</span
            ><span class="rl-livelist-n">${liveN}</span></button>`;
        })()}
          </div>
        </section>
      </div>
      ${''/* ---- THE WORKING AREA IS ONE SCREENFUL; THE PANELS ARE A SCROLL
             AWAY (owner-approved render, 22 Aug 2026) ----
             #redline-host keeps height:100% of this scroller, so the contract
             and the change column still fill the window and still scroll inside
             THEMSELVES — the rule this page has always had, and the reason you
             can read the paper without losing your place in the cards. What is
             new is that the scroller carries something after them: Live threads
             and Proposals on the table, reached by scrolling the page.

             height:100% rather than flex:1 is what makes that work. As a flex
             child of a column the host would share the space with the panels
             below and both would be crushed; as a definite 100% it takes one
             screenful and the panels sit past the fold, which is where the
             render puts them. */}
      ${''/* THE WORKING AREA IS THE WINDOW, and the page below it does not
             scroll. It carries the product's page measure (48px, in the sheet)
             because #view-redline has no padding of its own any more — the head
             and the control bar above are full-width white bands with their own
             24px inset, which one padding on the page could not do both of. */}
      <div id="redline-host" style="flex:1;min-height:0;display:flex;flex-direction:column;"></div>
        ${''/* ---- THE TWO PANELS UNDER THE CONTRACT ----
               Built HERE and not in redlinePanesHtml, and the placement is the
               rule rather than a convenience: the panes are SHARED markup — the
               counterparty's own share page mounts them — and "your other live
               negotiations" is the most internal list this product holds. A
               panel built in the shared builder would have to be walled off on
               their seat; built on the owner's page it can never reach it.

               NOT IN COUNTERPARTY VIEW EITHER. That view is a window onto what
               they see, and neither panel is something they see. */}

      ${''/* The way out of focus mode. Always in the DOM, shown only by the
             .rl-focus rule, because the button that turned focus ON is inside
             the strip focus mode stands down. */}
      <button type="button" class="rl-focus-exit" data-rl-focus-exit
        title="${i18t('ng_leave_focus')}">${i18t('ng_exit_focus')}</button>
    </div>`;
  /* ---- TWO HANDLERS FOR BUTTONS THAT NO LONGER EXIST, REMOVED (23 Aug 2026) ----
     data-redline-open-doc and data-rl-back were this page's own way back to the
     agreement, and both retired when the head took the mock-up (22 Aug 2026)
     and #ws-back became the one door. NOTHING IN THE PRODUCT EMITS EITHER —
     checked across every js file and index.html — so both loops ran on every
     paint and found nothing, for ever.

     A handler bound to a selector no markup emits is not harmless: it is the
     always-false guard wearing different clothes. The next reader takes it as
     evidence that such a button exists somewhere, and goes looking. */
  /* THE WAY BACK TO THE OTHER NEGOTIATIONS — the sidebar's own door, told to
     land on the list rather than to reopen what is remembered (which is this
     page). One route, one argument; see openNegotiations. */
  host.querySelectorAll('[data-rl-live-list]').forEach(el =>
    el.addEventListener('click', () => openNegotiations({ list: true })));
  /* The tab row's wiring went with the tab row (12 Aug 2026). This page draws
     no room tabs, so a querySelector for them would have matched nothing
     forever — dead wiring that reads like a live route and outlives everyone
     who knew it was dead. The way back is the head's arrow and its title, both
     wired in wireRoomHead. */
  /* The head's own controls, wired to the SAME dialogs the contract page
     opens: one share modal, one import flow, one compare, however you arrived.
     The ids come from roomHeadHtml, so this list is the workbench saying which
     of them it can honour rather than redefining any of them. */
  if (window.wireRoomHead) wireRoomHead(c);
  const headAct = (id, fn) => host.querySelector('#' + id)?.addEventListener('click', fn);
  headAct('ws-share', () => window.openShareModal && openShareModal(c));
  headAct('ws-import', () => window.openImportModal && openImportModal(c));
  headAct('ws-compare', () => window.openCompareModal && openCompareModal(c));
  headAct('ws-pdf', () => window.exportPDF && exportPDF(c));
  headAct('ws-word', () => window.exportWordTracked && exportWordTracked(c));
  headAct('ws-pdf-record', () => window.exportPDF && exportPDF(c, { record: true }));
  headAct('ws-tpl', () => { if (window.API_MODE && API_MODE() && window.saveContractToLibrary) saveContractToLibrary(c);
    else if (window.saveContractAsTemplate) saveContractAsTemplate(c); });
  headAct('ws-focus', () => rlSetFocus(!rlFocusOn()));
  /* ws-collapse is GONE from the room's menu (owner-asked, 13 Aug 2026), so
     there is no longer a row for this page to answer. It never folded anything
     here anyway — the reply was a toast saying the header was already at its
     shortest, which is a control whose only outcome is an apology. */
  /* [data-rl-shell] went with the shell. Its three verbs are the head's own
     ids now — ws-share, ws-import, ws-compare — wired just above. */
  host.querySelectorAll('[data-redline-side]').forEach(el =>
    el.addEventListener('click', () => { _redlineSide = el.getAttribute('data-redline-side'); renderRedline(); }));
  /* The three readings are wired ONCE, by delegation on the document — see
     the listener beside rlSetReadMode. Binding them here would catch the
     toolbar's three and miss the "Back to redlined" on the floating notice,
     which is painted into the mount AFTER this function has run. */
  /* "2 need you" goes to the first of them, through the page's own link-focus —
     the same route a queue row takes, so the card opens, the clause scrolls and
     the two stay joined. */
  host.querySelectorAll('[data-rl-needsyou]').forEach(el =>
    el.addEventListener('click', () => rlLinkFocus(c, el.getAttribute('data-rl-needsyou'), 'needsyou')));
  /* THE HEAD'S REVIEW BUTTON. One control, three acts, chosen from the state
     rather than from three buttons: the requester asks, the reviewer hands
     back, and anyone looking at a review already out gets the banner's Cancel
     instead of a second way to do it. */
  host.querySelectorAll('[data-rl-review]').forEach(el =>
    el.addEventListener('click', () => {
      const st = window.reviewState ? reviewState(c) : { phase: 'none' };
      /* Owe a verdict → hand it back. Otherwise → ask, whether or not something
         else is already out with somebody. */
      /* THE ONE DOOR. With more than one review open with this person the
         picker asks which, naming each by its change tags; with one it goes
         straight through. The banner rows no longer carry a button of their
         own — see reviewBannerHtml. */
      if (st.phase === 'yours') openReviewReturnPicker(c, { after: () => renderRedline() });
      /* Otherwise the door opens on a CHOICE — assign contributors (the desk)
         or send for review (the ask). See openReviewEntryChooser for why the
         hand-back is not routed through it. Falls back to the ask dialog on a
         stage without the chooser, which is what this handler always did. */
      else if (window.openReviewEntryChooser) openReviewEntryChooser(c, { after: () => renderRedline() });
      else openReviewAskModal(c, { after: () => renderRedline() });
    }));
  /* Focus in, focus out — ONE button, toggling. A class flip, not a repaint —
     see rlSetFocus. The paint call lines the fresh button's face up with the
     mode the page came back in. */
  host.querySelectorAll('[data-rl-focus]').forEach(el =>
    el.addEventListener('click', () => rlSetFocus(!rlFocusOn())));
  host.querySelectorAll('[data-rl-focus-exit]').forEach(el =>
    el.addEventListener('click', () => rlSetFocus(false)));
  rlPaintFocusBtn();
  rlWireFocusKey();
  /* Whether the tabs and the controls fit on one line is a question about THIS
     round's controls, so it is asked on every paint, not once. */
  rlFitTabRow();
  rlWireFitTabRow();
  /* The contract jump goes through the bench's one door, same as any other
     arrival. Change only — re-picking the current contract is a no-op, not a
     repaint that would drop the reader's scroll. */
  const jump = host.querySelector('#rl-contract-jump');
  if (jump) jump.addEventListener('change', () => {
    if (jump.value && jump.value !== c.id) openRedlineWorkbench(jump.value);
  });
  host.querySelector('[data-rl-pbreview]')?.addEventListener('click', () =>
    rlOpenPlaybookReview(c, () => renderRedline()));
  /* The header's two actions are the design's, but they are not second copies
     of anything: each one presses the engine's own control, which is the only
     thing that can actually accept a change or publish a round. If the engine
     has not rendered that control — nothing pending, or the other side's turn —
     the header button disables itself rather than lying about what it can do. */
  /* The proxy listener that used to be armed at this line is now armed at
     module load — see rlWireProxyOnce above and the reasoning written there.
     It was moved because arming it HERE meant arming it on the owner's page
     only, and the band that presses it draws on both seats. */

  /* The page's OWN three columns — document, tracked changes, discussion — not
     the two-pane comparison the contract tab renders. The engine still supplies
     every piece of content and every handler: negoDocHtml draws the marked-up
     clauses, negoCardsHtml draws the change cards, and the element ids the
     wiring looks for are all present, so wireNegotiationTab binds to this
     layout exactly as it binds to its own. */
  const mount = document.getElementById('redline-host');
  negoEnsureStyle();
  /* ---- COUNTERPARTY VIEW IS A WINDOW, NOT A CHAIR ----
     It exists so the owner can check what crosses the wall before it does,
     and it is now READ-ONLY outright (Young, 08 Aug 2026 — the counterparty-
     view work order). It used to be their live seat with the side flag
     flipped: Direct Edit filed real changes in their name (stamped enteredBy),
     Accept all decided their asks, the hand-back moved the turn as them, and
     the Copilot was a drag away. Every one of those is an act the preview must
     not offer — checking what they see and acting as them are different
     things, and the second now has no route from here. The owner's own edits
     belong in Internal View; the counterparty's answers arrive from their own
     link, where filing in their name remains fully supported (the enteredBy
     machinery in negoFileChange is untouched for the routes that still
     legitimately use it — inbound links and the Word round-trip).

     The lock is layered like the executed-contract lock directly below: this
     flag is the sign on the door, and wireNegotiationTab refuses decide/file
     under readonly even if a stray path reaches them. */
  const previewing = side === 'counterparty';
  const opts = { hostId: 'redline-host', side, preview: previewing,
    /* ---------- A SEALED CONTRACT SHOWS NO VERBS ----------
       The closed banner at negoBannerHtml has fired on 'Signed' for a long
       time, and the panes underneath it went on rendering Direct Edit, Propose
       deletion and a live Save change bar — the banner said finished and the
       buttons said otherwise, and the buttons won (MK-248).

       Everything in the workbench that can act is gated on this one flag —
       canAct in the cards, the index, the action bar and the panes, editable in
       the document — so the fix is to ask the question once, here, rather than
       to hunt those gates down individually. negoExecuted, not `status ===
       'Signed'`: a contract carrying a seal or an execution stamp is executed
       whatever its status field says.

       This is the sign on the door. The lock is in negoFileChange, which
       refuses the write even if a caller reaches it another way; both ship,
       because a lock with no sign is a button that errors at a reader who
       should never have been offered it. */
    readonly: previewing || ((typeof negoExecuted === 'function') ? negoExecuted(c) : false),
    /* ---- READING IS NOT WORKING ----
       Somebody with stream access who is not on this desk keeps the whole
       document, every redline and the full history — locking the READ would
       break the register, the reports and the search, and would send people to
       the telephone, which is the fragmentation this product exists to end. It
       is the hands that close. `editable` in both card renderers and the
       document's own edit affordances already read this flag, so one answer
       here reaches all of them. */
    canEdit: rlMayRedline(c, { side, readonly: previewing }),
    /* ---- THE PREVIEW EXPLAINS ITSELF BY BEING OBVIOUS, NOT BY TALKING ----
       Counterparty View used to open a four-line grey paragraph at the top of
       the Tracked Changes column: what the view is, that nothing can be entered
       from it, where to go instead, and where their answers come from. Removed
       (Young, 10 Aug 2026).

       IT WAS ANSWERING A QUESTION NOBODY ASKS TWICE. The reader got here by
       pressing "Counterparty" on a two-state switch that is still on screen
       and still reading Counterparty; the seat is named at the top of the page
       and the verbs are visibly absent. A paragraph restating that is a note
       from the product to itself, and it cost the column its first screen —
       the cards it exists to show started below the fold.

       EXECUTED STILL SPEAKS, and the distinction is the whole rule: a sealed
       contract is a FACT about the deal that the screen cannot otherwise
       convey and that changes what the reader should do next. "You are in the
       view you just switched to" is neither. */
    readonlyWhy: ((typeof negoExecuted === 'function') && negoExecuted(c))
      ? 'This contract is executed — its wording is sealed. Record an amendment instead.'
      : null,
    messages: c._messages || [], seenScope: c.id,
    shares: (window.cachedShares ? cachedShares(c) : []), onChange(){ if (window.persist) persist(c); },
    /* ---- AN ANSWER HAS TO REACH THE PAGE IT IS AN ANSWER TO ----
       Reported exactly as it happens (Young, 10 Aug 2026): the owner accepts
       the counterparty's ask, our column says "adopted", and their link still
       shows it open with Accept all / Reject all on it.

       Their copy of the negotiation is not this one — it is the payload on
       their share link — and `decide` says so in its own words: whoever mounts
       this component is responsible for what a decision costs on the other
       side. THE ROOM SUPPLIED THESE TWO HOOKS AND THIS PAGE NEVER DID, and
       every owner route now lands here rather than in the room, so nothing was
       catching the live link up at all. That is this codebase's own
       duplication rule, walked again: a fix in one renderer is not a fix in
       the other.

       ONLY ANSWERS TRAVEL THIS WAY — a decision, or an ask taken back. Wording
       we have newly PROPOSED is not pushed down a live link (holdUnsent inside
       refreshLiveShareQuietly enforces it): what the reader is being asked to
       look at changes when somebody presses Publish Round, never as a side
       effect. Silent, and fire-and-forget: the record is right either way and
       the link catches up on the next one. */
    onDecided(){ if (window.refreshLiveShareQuietly) refreshLiveShareQuietly(c); },
    onWithdraw(){ if (window.refreshLiveShareQuietly) refreshLiveShareQuietly(c); },
    /* Highlighting wording on this page drives the SIDE PANEL, never a
       standalone popover with a dialog behind it. rlSelMenu is the only floating
       layer left here, and it is a three-item menu that dismisses itself the
       moment one is chosen — everything it hands off to lands either in the
       Copilot column or in the Discussion column.

       In Counterparty View, selecting text is just reading — the same stub the
       portal mounts, so no menu and no Copilot route opens from the preview. */
    noAi: previewing || undefined,
    selMenu: previewing ? (() => {}) : ctx => rlSelMenu({ ...ctx, c, opts, again: () => renderRedline() }),
    /* ---- ONE CLICK, NO DIALOG, WHEN WE KNOW WHERE IT GOES ----
       #nego-send has always taken the direct route when the mount supplied a
       contact and an onSendDirect — that is how the contract room sends
       without asking. This page supplied neither, so every send here fell
       through to the share dialog: a form, three fields and a Next, to do
       something the app already had everything it needed to do.

       So the same two are supplied, off the same helpers the room uses. The
       dialog is still the fallback and has to be: with no address on record
       there is nowhere to send, and the form is what collects one. That is not
       a confirmation step — it is the missing information — and it stops
       appearing the moment there is an address to remember. */
    contact: (window.counterpartyContact
      ? counterpartyContact(c, (window.cachedShares ? cachedShares(c) : [])) : null),
    /* THE EMAIL IS SET ONCE, HERE. The strip that records it renders in the
       banner slot (see redlinePanesHtml) until a contact exists, and never
       again after — every later send goes straight to the standing link. */
    onSetCounterparty(x){
      c.counterpartyEmail = String((x && x.email) || '').trim();
      if (x && x.name) c.counterpartyName = x.name;
      if (window.logAudit) logAudit(c, 'Negotiation',
        `Counterparty contact set — changes on this contract go to ${c.counterpartyEmail}`);
      if (window.persist) persist(c);
      if (window.toast) toast(`Saved — changes now go straight to ${c.counterpartyEmail}`);
      renderRedline();
    },
    async onSendDirect(){
      /* ---- SOLO OR BATCH, DECIDED BEFORE ANYTHING LEAVES ----
         Read on the first line, before the first await, because the marker
         lives only for the synchronous press that set it. A solo send holds
         every OTHER unsent draft back (negoHoldOthers — buildSharePayload
         subtracts the held set unconditionally, the same way it subtracts a
         reviewer's holds); a batch send releases any standing hold so drafts
         a solo send kept back finally travel with it. `released` is
         remembered because the turn arithmetic cannot see those drafts once
         the hold is lifted — negoHandOver is told work left anyway. */
      const solo = _rlSoloSendId; _rlSoloSendId = null;
      let released = false;
      if (solo && window.negoHoldOthers) negoHoldOthers(c, solo);
      else if (window.negoReleaseHold) released = negoReleaseHold(c);
      const to = c.counterpartyName || c.counterparty || 'the counterparty';
      const btns = [...document.querySelectorAll('#view-redline [data-rl-send], #view-redline [data-rl-blast]')];
      btns.forEach(b => { b.disabled = true; });
      try{
        const out = await reshareToLastRecipient(c, { purpose: 'negotiate' });
        /* THE TURN MOVES ONLY AFTER SOMETHING HAS LEFT. Every "Sent" this page
           draws — the badge, the amber button, the count on the toolbar — is
           read back from negoUnsentAsks, which is measured against this
           timestamp. Moving it first and sending after would put the word
           "Sent" on a card while the send was still in flight, and leave it
           there if the send failed. */
        const handed = negoHandOver(c, { to: 'counterparty',
          by: opts.by || (window.currentUser && currentUser()?.name),
          /* Drafts a solo send once held back read as SENT the moment the
             hold lifts (their createdAt predates the last turn stamp), so
             the arithmetic alone would call this batch a no-op. It was not:
             the payload above carried them. */
          sentAnyway: released });
        if (window.persist) persist(c);
        /* "It is now their turn" is only true when the turn actually moved. A
           second batch sent while it was already theirs must not claim the
           table changed hands — see negoHandOver. */
        const moved = handed ? handed.moved !== false : false;
        const turnLine = moved ? ' — it is now their turn' : '';
        /* A SECOND LIVE LINK IS SAID ON SCREEN, not only in the audit trail.
           This is the state reported on MK-255: the round published, the owner
           was told it had gone, and the counterparty reloaded the URL they
           actually held to find nothing had moved — because it was not the URL
           we had refreshed. Where the send could not reuse their copy, that is
           the whole news, so it outranks the ordinary sentence. */
        /* ---- THE THREE OUTCOMES ARE THREE STATES NOW (15 Aug 2026, OI-10) ----
           This call is the one the owner reported: publishing a round to an
           existing link came back RED, reading as a failure over an act that had
           worked. It was marked an error on purpose, because until now a toast
           that was not an error was thrown away and the sentence "send them the
           link if it was not emailed" would never have been seen.

           Delivered is DONE. Published-but-not-emailed and a stranded second
           link are both NEEDS YOU — something worked and something is left for
           the sender to do — so they are amber and they CARRY THE LINK, which
           is the thing the old sentence asked for and did not hand over. */
        const delivered = !!(out && out.delivered && !out.stranded);
        /* ---- A ROUND ON A STANDING LINK IS DELIVERED (owner-reported
           27 Aug 2026) ----
           `delivered` above is `emailSent`, and a round published onto the
           link the counterparty is already holding sends no email ON PURPOSE —
           the link was emailed once, when the negotiation began, and every
           round after that travels through the platform. So every round but
           the first came back AMBER reading "not emailed", with a Copy link
           beside it offering the owner a link the other side already has.

           THE AUDIT TRAIL HAS SAID THIS SINCE `quiet` WAS INTRODUCED, in its
           own words — "the platform is the channel" — and the toast was simply
           never told. It reads the same flag now, so the two cannot disagree
           about whether a round arrived.

           NO WARNING IS WEAKENED. A genuine mail failure — an email channel
           that tried and did not send — is not quiet, keeps its amber and
           keeps its link; so does a stranded second link, which outranks
           everything because the copy they hold has gone dead. */
        const standing = !!(out && out.quiet && !out.stranded);
        const link = (out && out.link) || null;
        /* A solo send says what it deliberately left on the desk — silence
           about the other drafts is how a partial send reads as a full one. */
        const kept = window.negoHeldBackIds ? negoHeldBackIds(c).length : 0;
        const keptLine = kept ? ` — ${kept} other draft${kept === 1 ? '' : 's'} still unsent` : '';
        if (window.toast) toast(out && out.stranded
          ? `${window.reshareStrandedLine ? reshareStrandedLine(to) : 'A NEW link was created for ' + to + '.'}${turnLine ? ' It is now their turn.' : ''}`
          : delivered
          ? `Sent to ${to}${turnLine}${keptLine}`
          : standing
          ? `${i18t('ng_round_sent_standing', { who: to })}${turnLine}${keptLine}`
          : `${i18t('ng_published_not_emailed', { who: to })}${turnLine}${keptLine}`,
          (delivered || standing) ? 'ok' : 'warn',
          (!delivered && !standing && link) ? { action: { label: i18t('ng_copy_link'),
            onClick: () => { try{ navigator.clipboard.writeText(link); }catch(e){}
              if (window.toast) toast(i18t('ng_link_copied'), 'ok'); } } } : undefined);
      }catch(err){
        btns.forEach(b => { b.disabled = false; });
        if (window.toast) toast(`Could not send to ${to} — ${(err && err.message) || err}`, 'err');
        return;
      }
      renderRedline();
    },
    /* Counterparty View no longer acts, so it has nothing waiting to send —
       the counts that used to render their postbox here (and, before that,
       stalled the six-round loop when they were missing) are gone with the
       verbs. The real counterparty's postbox lives on their own page, where
       the portal supplies these from its held state. */
    pendingProposals: 0,
    pendingDecisions: 0,
    org: window.FIRST_PARTY || 'the owner',
    /* No onSendDecisions here any more. It was negoHandOver recorded as made
       BY the counterparty — a record of the other side handing the table back
       when they had done nothing at all — and a read-only preview has nothing
       to hand back anyway. The portal supplies its own; this mount supplies
       none, so even a stray #nego-send-decisions could wire to nothing. */
    /* ---- A SHARED REPLY HAS TO LEAVE THE BUILDING ----
       negoPostComment writes it onto our record, which is what this page's
       thread reads — and on this page that was the whole of it, so an answer
       typed here reached the counterparty only when the next round happened
       to refresh their link. Found in the cross-party audit: the owner
       confirmed a point in the thread and Erik's page never showed it. It
       goes down the discussion channel as well, under the change's own
       topic, which is the store their page reads live. */
    async onComment(_c, ch, msg){
      if (!window.API_MODE || !API_MODE() || !ch) return;
      try{
        const res = await api('contracts/' + c.id + '/messages', 'POST', {
          topic: (window.negoTopicFor ? negoTopicFor(ch) : 'change:' + ch.id),
          topicLabel: `Change #${ch.id}${ch.clauseLabel ? ' · ' + ch.clauseLabel : ''}`,
          body: msg.text });
        c._messages = (res && res.messages) || c._messages || [];
        if (window.toast) toast(`Comment posted on #${ch.id} — ${c.counterparty || 'the counterparty'} sees it on the same change. The contract is unchanged.`);
      }catch(e){
        if (window.toast) toast(`Saved on the change, but it could not be sent to ${c.counterparty || 'the counterparty'}: ${(e && e.message) || 'the message channel is unavailable'}`, 'err');
      }
    },
    /* ---- THE HAND-OFF LIVES HERE NOW ----
       The readiness banner's "Issue a signing link" is wired to this hook, and
       the room that used to supply it is retired — without it the one button
       that moves an aligned negotiation to signature answered "not available
       on this screen", on the only owner surface left. Found in the
       cross-party audit. Same share dialog as every other send; the 'sign'
       purpose is what supersedes the standing negotiation link. */
    onIssueSigningLink(){
      if (typeof window.openShareModal !== 'function'){
        if (window.toast) toast(i18t('ng_sharing_unavailable'), 'err');
        return;
      }
      openShareModal(c, { purpose: 'sign',
        onSent(){
          if (window.logAudit) logAudit(c, 'Shared', 'A signing link was issued — the negotiation links on this contract are superseded and can no longer be answered');
          if (window.persist) persist(c);
          renderRedline();
        } });
    },
    rerender: () => renderRedline() };
  mount.innerHTML = redlinePanesHtml(c, opts);
  /* ---- AND THE TWO PANELS UNDER THE CONTRACT ----
     Filled HERE, from the same `opts` the panes were just built with. That is
     the "one reading" rule made structural: the proposals panel is the change
     column's own renderer, so handing it a different seat, a different wall or
     a different reviewer narrowing is not merely untidy, it would put two
     different lists of changes on one screen.
     BEFORE wireNegotiationTab, so the verbs inside are in the DOM when the
     per-paint handlers go looking for them — they are the cards' own
     attributes and are wired by the cards' own listeners. */
  wireNegotiationTab(c, opts);
  negoAfterPaint(c, opts, mount);
  /* The counterparty postbox (#nego-send-decisions) is no longer bound here:
     Counterparty View is read-only, supplies no onSendDecisions, and renders
     no postbox to bind. The portal's own mount keeps its binding. */
  /* Closing the round — the naming dialog first, because it is irreversible:
     the decided changes fold into the round history and the agreed wording
     becomes the baseline the next round is measured against. */
  host.querySelectorAll('[data-rl-close-round]').forEach(el =>
    el.addEventListener('click', async () => {
      if (window.negoConfirmCloseRound && !await negoConfirmCloseRound(c)) return;
      const r = negoAdvanceRound(c, { by: opts.by || (window.currentUser && currentUser()?.name) });
      if (!r){ if (window.toast) toast(i18t('ng_round_cannot_close'), 'err'); return; }
      if (window.persist) persist(c);
      /* 'ok' by the same test as the portal's send confirmations: closing a
         round is irreversible and moves the baseline every later change is
         measured against. See TOAST_KINDS. */
      if (window.toast) toast(`Round ${r.n} closed — the agreed wording is the new baseline for round ${negoRound(c)}`, 'ok');
      renderRedline();
    }));
  rlWireClauseTools(c, host, opts);
  redlineSyncProxies(host);
  /* The composers on this page are rebuilt by every repaint, and a textarea
     that grows is a textarea that has to be re-measured — otherwise a reply
     half-written when a card lands elsewhere comes back one line tall with the
     rest of it hidden. chatFieldWire is idempotent by design. */
  if (window.chatFieldWire) chatFieldWire(host);
  Object.keys(_keepScroll).forEach(id => {
    const el = document.getElementById(id);
    if (el) rlRestoreScroll(el, _keepScroll[id]);
  });
  /* Every decision, send and retract repaints this page — which is exactly
     when the nav's "N Open" tag and this toolbar's dropdown counts moved. */
  if (window.updateSidebarCounts) updateSidebarCounts();
  rlStartLivePoll(c);
}

/* ---------- THE BENCH STAYS CURRENT ----------
   While the Redline page is open, a light probe every few seconds asks the
   server two things it can answer without shipping the record: has the
   contract's version moved. A moved version repaints the bench with the fresh
   record and says so out loud. Silent in local mode and on the test stage — no
   server, no probe. Self-terminating: the first tick after the reader leaves
   the page clears the timer.

   IT ASKED THE SERVER TWO THINGS ONCE. The second was whether the counterparty
   was reading their copy right now, painted as a green-dot pill on the toolbar.
   That is gone (Young, 10 Aug 2026) — the pill, the painter and the server's
   presence map with it. The probe is about the RECORD moving, which is the half
   that changes what the reader sees. */
const RL_LIVE_MS = 12000;
let _rlLiveTimer = null, _rlLiveBusy = false;
/* An arrival collected while an editor was open, waiting for the editor to
   close before it is drawn. Per sitting, in memory: a reload shows the fresh
   record anyway, because the row was already replaced. */
let _rlLivePending = false;
/* Is somebody typing into a clause right now? [data-nego-editor] is the one
   marker the engine puts on the live editor holder, on the paper and in the
   clause panel alike, so this asks the same question both homes answer. */
function rlEditorOpen(){
  try{ return !!document.querySelector('[data-nego-editor]'); }catch(_){ return false; }
}
/* Draw a held-back arrival once the editor is gone. Asked at the top of each
   poll tick rather than hooked onto the editor's own close paths: those are
   several (save, file, cancel, Escape, a clause swap) and one missed hook would
   strand the page on stale wording with nothing to shake it loose. A tick that
   finds no editor and something pending simply draws it — self-healing, and
   there is nothing for a future close path to remember to call. */
function rlLiveFlush(){
  if(!_rlLivePending || rlEditorOpen()) return;
  _rlLivePending = false;
  renderRedline();
}
function rlStartLivePoll(c){
  if (typeof setInterval !== 'function' || !c || !c.id) return;
  /* The harness's off switch. The node worlds run with API_MODE() true, and
     an interval on their window is a real Node timer — one un-cleared poll
     and the whole test process refuses to exit. The stage sets this flag;
     a browser never does. */
  if (window.RL_LIVE_POLL === false) return;
  if (!(window.API_MODE && API_MODE() && window.api)) return;
  if (_rlLiveTimer){ clearInterval(_rlLiveTimer); _rlLiveTimer = null; }
  const id = c.id;
  _rlLiveTimer = setInterval(async () => {
    if (!window.state || state.view !== 'redline' || state.activeId !== id){
      clearInterval(_rlLiveTimer); _rlLiveTimer = null; return;
    }
    rlLiveFlush();          /* an arrival held back while somebody was typing */
    if (_rlLiveBusy) return;
    _rlLiveBusy = true;
    try{
      const st = await api('contracts/' + id + '/state');
      const cur = window.getContract ? getContract(id) : null;
      /* Our own saves move the version too — but persist writes the new
         version back onto the record (c._v), so only SOMEBODY ELSE's write
         leaves the two numbers apart. */
      if (st && cur && st.version != null && cur._v != null && st.version !== cur._v){
        /* ---- A BACKGROUND REPAINT MAY NOT TAKE SOMEBODY'S TYPING WITH IT ----
           This repainted unconditionally. An owner part-way through a clause —
           replacement wording typed, the "why this change" reason half written
           — lost the lot the moment the counterparty published their round or a
           colleague saved the record, with no warning and nothing recoverable.
           Nobody pressed anything; a timer did it.
           The ARRIVAL is still collected either way: the fresh record replaces
           the row, so nothing is missed and no round is lost. What waits is the
           REDRAW, until the editor is closed — by saving, filing or cancelling
           — at which point the ordinary repaint that follows shows everything
           that landed. The reader is told, so a page that has deliberately
           stopped moving under them never reads as a page that has stalled. */
        const fresh = await api('contracts/' + id);
        const i = state.contracts.findIndex(x => x && x.id === id);
        if (i >= 0) state.contracts[i] = fresh;
        if (rlEditorOpen()){
          _rlLivePending = true;
          if (window.toast) toast(i18t('ng_live_held_for_editor', { id }), 'warn');
        } else {
          renderRedline();
          if (window.toast) toast(`Updated just now — new activity on ${id}`);
        }
      }
    }catch(_){ /* transient — the next tick retries */ }
    _rlLiveBusy = false;
  }, RL_LIVE_MS);
}
/* rlPaintPresence lived here and painted #rl-presence. Removed with the
   feature — see the note on the poll above. */

/* ============================================================
   THE WORKBENCH'S THREE ACTIONS ON A PASSAGE
   ============================================================
   Standardised, and standardised down to three. The engine's NEGO_AI_ACTIONS
   is still what the contract tab and the room offer; this page offers these,
   and offers them from ONE list to both entry points — a text selection and
   the clause toolbar's AI Assist — so the two can never drift into naming
   different verbs for the same job.

   What changed is not only the count. Every one of these now ends in the
   COPILOT SIDE PANEL rather than in a floating dialog over the document:

     ✨ Rephrase with Copilot — opens the panel with the passage attached and
        asks what the rewrite is FOR. "Rephrase" is not an instruction, and the
        old action supplied one on the reader's behalf — favour my side — which
        was the wrong job about half the time. The answer typed into the panel
        is the instruction.
     ✂️ Simplify — already carries its instruction, so it goes
        straight to a proposal. Asking somebody to retype what they just
        pressed is a step for nothing.
     🏷️ Tag with internal note — not an AI action at all, and deliberately in
        the same menu: the thing a reader most often wants to do with wording
        they have just read is say something about it, and making them leave
        the selection to do that is how a note lands on the wrong clause.

   WHY THE PANEL AND NOT A POPOVER. The reader is deciding whether proposed
   wording fits the clauses either side of it. A dialog over the document makes
   that undecidable — it covers the very thing being compared against — and a
   modal makes it worse by taking the page's input as well. The panel docks
   beside the document, nothing behind it moves or reflows, and the exchange
   can go several turns without the contract ever leaving the screen. */
const RL_SEL_ACTIONS = [
  /* ---------- "REPHRASE" BECAME "EDIT", AND IT IS A RENAME, NOT AN ADDITION
     ----------
     This was "✨ Rephrase with Copilot", and the word was doing damage. The
     action has always taken its instruction in words, so half of what people
     typed into it was not a rephrase at all: "add three bullet points about
     data retention after this clause" is the second thing anybody asks of a
     drafting assistant. The model drafted the bullets, and because a proposal
     could only ever REPLACE, the splice put them on top of the sentence they
     were meant to follow. Wording nobody agreed to lose, gone, with no error
     and no warning.

     So the action can now add as well as replace (placements: true — see
     AI_PLACEMENTS in js/ai.js), and it is named for the whole job. "Edit"
     covers changing wording and adding it; "rephrase" names only the first,
     which is exactly how the wrong splice came to look like the only one.

     A FOURTH ITEM WAS THE OBVIOUS MOVE AND THE WRONG ONE. "Edit with Copilot"
     sitting beside "Rephrase with Copilot" is two entries on a three-item menu
     that read the same to anyone moving at speed — the duplicate-door problem
     this page already argued out once, over AI Assist (see the clause toolbar
     below). Rephrasing is not lost: it is what you get when your instruction
     is a rephrase.

     THE SPARKLE STAYS. ✍️ was drafted and rejected: the clause toolbar's
     Direct Edit already wears ✎, and a writing hand beside a pencil is two
     near-identical marks doing different jobs. ✨ is the established "this one
     is the Copilot" signal, and the pairing the two buttons make is worth
     having — Direct Edit is "I will type it", Edit with Copilot is "you type
     it, I will approve it". */
  { id: 'edit', label: '✨ Edit with Copilot', converse: true, placements: true,
    noteLabel: 'Edit',
    get ask(){ return `Rewrite, add to, or extend this contract wording as the drafter asks, while staying commercially reasonable and enforceable under ${jxLaw()}.`; },
    greeting: 'What would you like to add or change here?' },
  /* No placements: a shortening that inserts is not a shortening. The action
     carries its own instruction and cannot mean anything but a replacement, so
     offering the field would only invite the model to use it. */
  /* "Shorten & Simplify" said the mechanism twice; "Simplify" names the
     outcome once (Young, 03 Aug 2026). Same id, same instruction — records
     filed under the old provenance label keep it. */
  { id: 'shorten', label: '✂️ Simplify', noteLabel: 'Simplify',
    ask: 'Rewrite this contract wording more concisely and in plainer language, without changing its legal effect. Keep defined terms exactly as they are.' },
  /* ---------- "TAG WITH INTERNAL NOTE" IS GONE, AND THIS TOOK ITS PLACE ----------
     Tagging opened the Discussion panel with the visibility switch pressed to
     internal and the passage quoted — a private remark about a fragment. It
     went for two reasons. It needed a change to exist on the clause first, so
     the commonest moment to want it (reading wording nobody has touched yet)
     was the one moment it refused. And a reason for a change now belongs on
     the change itself, asked for when the change is filed, where the other
     side can read it — a private note about wording is the version of that
     nobody else ever sees.

     What replaces it answers the question a negotiator actually has with a
     clause highlighted, and it is not "let me write that down": it is "is this
     normal?". The workspace already keeps the answer — the playbook's standard
     positions and the clause library's preferred wording — and until now the
     only way to consult it was Review vs Playbook, which reads the WHOLE
     document. This is that check, aimed at the words in front of you. */
  { id: 'standard', label: '⚖️ Compare to our standard', noteLabel: 'Compare to our standard',
    standard: true }
];
/* Built at click time rather than declared above, because the standard is a
   property of THIS contract — its playbook key decides which positions apply —
   and the constant has no contract in scope. */
function rlStandardAction(c){
  const lines = (() => {
    try{
      if (typeof resolvePlaybook !== 'function' || typeof playbookKeyFor !== 'function') return '';
      const pb = resolvePlaybook(playbookKeyFor(c));
      const pos = (pb.positions || []).map(p => {
        const cl = p.clause && typeof clauseById === 'function' ? clauseById(p.clause) : null;
        const pref = cl && cl.preferred ? `: our wording is “${String(cl.preferred).slice(0, 240)}”` : '';
        return `- ${p.category}${pref || (p.note ? `: ${p.note}` : '')}`;
      });
      const rng = (pb.ranges || []).map(r =>
        `- ${r.label}: ${[r.op, r.value].filter(x => x != null).join(' ')}`.trim());
      return [...pos, ...rng].filter(Boolean).join('\n');
    }catch(_){ return ''; }
  })();
  return { id: 'standard', noteLabel: 'Compare to our standard',
    ask: `Measure this passage against the workspace's own standard positions below. Say plainly whether it MATCHES, DEVIATES, or is NOT COVERED — name the position you measured against and quote the words that decide it.

${lines || 'No standard positions are recorded for this workspace. Say exactly that rather than inventing a standard to measure against.'}

If it deviates, propose the standard wording for this passage. If it already matches, say so and return the passage unchanged rather than rewriting wording that is already right.` };
}
function rlSelActions(){ return RL_SEL_ACTIONS.slice(); }
/* What the change record says it did. A change card carries this note to the
   other side, and "Copilot — Edit" over a clause that grew three sub-paragraphs
   describes the tool rather than the act. Empty for replace, which is what a
   Copilot edit has always meant and needs no qualifier, and empty for newClause,
   where the change type already prints "New clause added". */
const RL_PLACEMENT_NOTE = { replace: '', after: ' (added after)',
  before: ' (added before)', newClause: '' };

/* Say something in the Copilot panel without asking a model anything. Used for
   every refusal on this path, because a refusal belongs in the conversation the
   reader just opened rather than in a toast that is gone in four seconds. */
function rlSayInPanel(text){
  if (window.openAI) openAI(null, { docked: true, summoned: true });
  if (window.aiPush) aiPush('assistant', { text: _ne(text) });
  if (window.renderAIFeed) renderAIFeed();
  else if (window.toast) toast(text, 'err');
}

/* ---------- THE MENU ----------
   One builder, two entry points. Floating rather than inline because it is
   anchored to a selection rectangle that can be anywhere in the clause — but it
   is a MENU, not a dialog: it holds no fields, decides nothing, and every item
   in it hands off to the side panel or the discussion column and disappears. */
function rlSelMenu(ctx){
  const { text, clauseId, rect, whole } = ctx;
  /* ---- THE OFFER NARROWS ON ONE SURFACE, AND IT IS STILL ONE MENU ----
     (owner-asked 16 Aug 2026, designing the clause panel: "Remove simplify and
     compare with company standards. Leave the feature where you can highlight a
     sentence and it allows you to edit with copilot".)

     ctx.only is a list of action ids. The clause panel passes ['edit'] and
     nothing else does, so the DOCUMENT's own selection menu still offers all
     three — deliberately left alone, and said out loud: the instruction was
     about what the panel offers, and Simplify and Compare-to-our-standard are
     acts on the clause AS IT STANDS. Inside the panel the reader is highlighting
     THEIR OWN HALF-TYPED DRAFT, where "compare this to our standard" is a
     different question and "simplify" would rewrite work in progress. Narrowing
     there is principled rather than merely obedient.

     A LIST, NOT A FORK. Same builder, same routing, same refusals — this file's
     own rule that "a second menu would be a second set of refusals to keep in
     step." An unknown id in `only` narrows to nothing, so it falls back to the
     whole list rather than opening an empty menu.

     ctx.actions + ctx.onPick (owner-asked 16 Aug 2026, the Document tab's
     Simplify / Ask Copilot): a host may supply its OWN action list and its own
     handler, and gets this builder's markup, anchoring, kill logic and one-at-
     a-time rule instead of writing a second menu. Without onPick every row
     still ends in rlAiPropose exactly as before — the negotiation surfaces
     pass neither and are untouched. */
  const custom = Array.isArray(ctx.actions) && ctx.actions.length ? ctx.actions : null;
  const want = !custom && Array.isArray(ctx.only) && ctx.only.length ? ctx.only : null;
  const all = custom || rlSelActions();
  const picked = want ? all.filter(a => want.includes(a.id)) : all;
  const actions = picked.length ? picked : all;
  const pick = action => {
    if (typeof ctx.onPick === 'function'){ ctx.onPick(action, ctx); return; }
    if (action.standard){ rlAiPropose({ ...ctx, action: rlStandardAction(ctx.c) }); return; }
    rlAiPropose({ ...ctx, action });
  };
  /* ---- ONE ACTION AND A DIRECT PRESS IS NOT A MENU ----
     A menu with a single row is a press the reader has to make twice, and the
     panel's Copilot button has no anchor to hang one on anyway (closing the
     panel hides the button before its rect can be read — the reported
     top-corner dropdown). It hands straight to rlAiPropose, which is where
     every row in this menu ends. Returns null: there is no menu to return. */
  if (ctx.direct && actions.length === 1){
    _negoKillSelMenu();
    pick(actions[0]);
    return null;
  }
  _negoKillSelMenu();
  const menu = document.createElement('div');
  menu.className = 'nego-selmenu';
  menu.setAttribute('role', 'menu');
  menu.innerHTML = `<div class="nego-selhead">${whole ? 'This clause' : 'Selected wording'}</div>
    <div class="nego-selquote">${_ne(text.length > 64 ? text.slice(0, 63) + '…' : text)}</div>
    ${actions.map(a => `<button type="button" role="menuitem" data-nego-ai="${_nea(a.id)}">${_ne(a.label)}</button>`).join('')}`;
  document.body.appendChild(menu);
  const box = menu.getBoundingClientRect();
  const at = _negoAnchor(rect, box.width, box.height);
  menu.style.left = at.left + 'px';
  menu.style.top = at.top + 'px';
  /* mousedown, not click, on the selection path: clicking collapses the
     selection first and the proposal needs the words that were chosen. The
     toolbar path has no selection to lose, so it passes `click` and a press
     of the keyboard reaches it too. */
  const evName = ctx.event || 'mousedown';
  menu.querySelectorAll('[data-nego-ai]').forEach(b => b.addEventListener(evName, ev => {
    ev.preventDefault(); ev.stopPropagation();
    const action = actions.find(a => a.id === b.getAttribute('data-nego-ai'));
    _negoKillSelMenu();
    if (!action) return;
    pick(action);
  }));
  return menu;
}

/* ---------- THE ASK, IN THE PANEL ----------
   Nothing here writes to the document. What comes back is a PROPOSAL in the
   Copilot's own stream, with Apply / Decline / Edit on it, and Apply files a
   tracked change through negoEditClause exactly like every other proposal on
   this engine — same model, same fingerprint, same chain. A suggestion that
   arrived from a model is not a different KIND of change and must not get a
   private path into the contract. */
async function rlAiPropose(ctx){
  const { c, action, text, clauseId, opts } = ctx;
  const again = typeof ctx.again === 'function' ? ctx.again : () => renderRedline();
  const side = opts && opts.side === 'counterparty' ? 'counterparty' : 'owner';
  _negoKillSelMenu(); _negoKillAiPop();
  /* THE DRAWER OPENS FIRST, before anything is asked and before anything can
     fail. Pressing a menu item has to do something visible on the same gesture;
     a control that opens a panel only once a model has answered reads as broken
     for as long as the round trip takes, and permanently if it fails.
     SUMMONED: opened for this errand, so settling the proposal closes it again
     — unless the reader had the panel open already, in which case it is theirs
     and stays (see ai.summoned, js/ai.js). */
  if (window.openAI) openAI(null, { docked: true, summoned: true });
  /* What was asked, in the reader's own stream — otherwise the panel answers a
     question it never shows, and the Copilot reads as volunteering wording
     nobody asked for. */
  if (window.aiPush) aiPush('user', { text: `${_ne(action.label)}<div style="font-size:var(--t-label);margin-top:var(--s-1);opacity:.8;font-style:italic">“${
    _ne(text.length > 140 ? text.slice(0, 139) + '…' : text)}”</div>` });
  if (window.renderAIFeed) renderAIFeed(!action.converse);

  if (!window.copilotAvailable || !copilotAvailable() || !window.copilotPropose){
    rlSayInPanel('The Copilot is not connected yet. Connect it under Team & Settings, then try again.');
    return;
  }
  const cl = window.negoClauseById ? negoClauseById(c, clauseId) : null;
  if (!cl){
    /* ---- A CLAUSE THAT IS ITSELF STILL A PROPOSAL ----
       A clause somebody has asked to ADD is on the page and reads like any
       other, but it is not in the round baseline — that is what "proposed"
       means — so there is no agreed wording under it to redline against.
       negoEditClause answers null for exactly this, and the toast that
       followed said "that wording matches the clause already", which is a
       claim about the document and is not true. Two different absences, told
       apart, because the way out of them is different. */
    const ins = (window.negoChanges ? negoChanges(c) : []).find(x =>
      x && x.clauseId === clauseId && x.changeType === 'insertClause' && x.status !== 'superseded');
    rlSayInPanel(ins
      ? 'This clause is itself still a proposal — it has not been accepted into the document yet, so there is no agreed wording to redline. Revise it from its card in Tracked Changes, or accept it first.'
      : 'This clause is no longer in the document. Select a current clause and try again.');
    return;
  }
  const passage = ctx.passage || { text, readings: [], occurrence: ctx.occurrence || 0, parts: [] };
  /* ---- A HIGHLIGHT ACROSS BLOCKS OF A DOCUMENT THAT HAS NO CLAUSES ----
     An uploaded contract that arrived as a wall of paragraphs has no headings
     to segment on, so clauseSegment falls back to one clause PER PARAGRAPH.
     Those boundaries are an artefact of the parse, not of the agreement, and
     refusing "select within a single clause" over them asked the reader to
     respect a structure their document does not have — on exactly the documents
     where a rewrite across two sentences is most often what is wanted.

     Where the covered blocks are all headingless the span is rewritten as one
     passage: the head block takes the new wording and the blocks the highlight
     consumed are proposed for deletion, each a tracked change of its own that
     somebody has to accept. A document WITH headings keeps the refusal — merging
     two numbered clauses renumbers an instrument that is cited by those numbers,
     and that is a deliberate act, not a side effect of a drag. */
  const spanParts = (ctx.spans && Array.isArray(passage.parts) && passage.parts.length > 1)
    ? passage.parts : null;
  const headingless = spanParts && spanParts.every(p => {
    const x = window.negoClauseById ? negoClauseById(c, p.clauseId) : null;
    return !!x && (x.headingless || !String(x.headingText || '').trim());
  });
  if (ctx.spans && !headingless){
    rlSayInPanel('The selection covers more than one clause. Select within a single clause — the Copilot rewrites one clause at a time.');
    return;
  }
  const parts = headingless ? spanParts : null;
  /* ---- WORDING UNDER A LIVE REDLINE IS REFUSED ON ITS OWN TERMS ----
     Said here rather than left to fall out of a failed lookup below. It used to
     BE that failure — the visible text of a clause under change mixes kept,
     inserted and struck wording and exists in no single version, so the match
     missed and the miss was reported as pending edits. That coupling is why the
     message was so often wrong: anything else that missed got the same
     accusation, and once the reading learned to see through a redline (it tries
     the clause as the round baseline holds it) the true case would have stopped
     being refused at all. Two facts, checked separately, each said only when it
     is true. */
  if (ctx.marked === true){
    rlSayInPanel('This text already has pending edits. Accept or reject the current redline first, or select a section without changes.');
    return;
  }
  /* THE SELECTION HAS TO BE FINDABLE IN THE CLAUSE, and it is checked before a
     token is spent. The old fallback for a miss was to swap the whole clause
     for whatever came back, which loses wording nobody agreed to lose. */
  const clauseText = String(cl.text || '');
  /* Tolerant of typography and of the list markers the projection prints, and
     tolerant of a clause under change — negoResolvePassage tries the wording as
     shown and as the round baseline holds it. The splice happens later at the
     REAL offsets the match reports, never against normalised text. */
  const whole = !parts && window.negoPassageIsWhole && negoPassageIsWhole(clauseText, passage);
  const findable = parts
    ? parts.every(p => {
      const x = window.negoClauseById ? negoClauseById(c, p.clauseId) : null;
      return !!x && !!negoResolvePassage(String(x.text || ''), p);
    })
    : (whole || !!negoResolvePassage(clauseText, passage));
  if (!findable){
    /* ---- WHY IT COULD NOT BE FOUND, WHERE THAT IS KNOWABLE ----
       A drag that begins in the recital and ends inside clause 1 covers one
       clause and a stretch of document that belongs to no clause at all. The
       passage genuinely cannot be matched, so the refusal is true either way —
       but "reselect and try again" sends somebody to do the identical thing
       again, and the part that has to change is the START of the drag. */
    const only = passage.parts && passage.parts.length === 1 ? passage.parts[0] : null;
    rlSayInPanel(only && only.text !== passage.text
      ? 'This selection reaches outside the clause, into wording that belongs to no clause — the title, the recital or the space between clauses. Select from the first word of the passage inside the clause and try again.'
      : 'This selection couldn\'t be matched to the clause\'s current wording. Reselect the passage and try again.');
    return;
  }
  const party = side === 'counterparty' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'us');
  const pbLine = (() => {
    try{
      const v = (((c && c.playbook) || {}).verdicts || []).filter(x => x.status === 'deviation');
      return v.length ? `Our playbook flags this contract for: ${v.map(x => x.category).join(', ')}.` : '';
    }catch(_){ return ''; }
  })();

  /* Applying files against the clause AS IT NOW STANDS. The clause object in
     this closure was read when the panel opened, and a conversation can run for
     minutes — so the live one is re-read and the passage re-checked, rather
     than writing an older copy back over whatever moved in between. */
  /* One filing, whatever it took. Every change goes through negoEditClause /
     negoDeleteClause / negoInsertClause like any other proposal — same model,
     same fingerprint, same chain — and the toast names what was actually filed
     rather than claiming a single change when a span took several.

     The NOTE is a parameter rather than a constant of this closure because it
     now records the placement as well as the action, and the placement is not
     known until Apply is pressed — the reader may have corrected it since the
     model guessed. */
  const fileAll = (jobs, note, why) => {
    Promise.all(jobs.map(j => j.kind === 'delete'
      ? negoDeleteClause(c, j.clauseId, { side, author: opts && opts.by, note, why })
      : j.kind === 'insert'
        ? negoInsertClause(c, j.clauseId, { bodyHtml: j.bodyHtml, headingText: j.headingText || '' },
          { side, author: opts && opts.by, note, why })
        : negoEditClause(c, j.clauseId, j.html, { side, author: opts && opts.by, note, why })))
      .then(chs => {
        const filed = chs.filter(Boolean);
        if (!filed.length){ if (window.toast) toast(i18t('ng_wording_matches')); return; }
        if (window.negoInvalidateVerification) negoInvalidateVerification(c);
        if (opts && opts.persist !== false && window.persist) persist(c);
        if (window.toast) toast(filed.length === 1
          ? `#${filed[0].id} filed from the Copilot — it is a proposal until the other side answers it`
          : `${filed.length} changes filed from the Copilot (${filed.map(x => '#' + x.id).join(', ')})`
            + ' — they are proposals until the other side answers them');
        again();
      })
      .catch(err => { if (window.toast) toast(`Could not file that change: ${(err && err.message) || err}`, 'err'); });
    return { ok: true };
  };
  const asHtml = t => (window.negoRichFromLines ? negoRichFromLines(t) : `<p>${_ne(t)}</p>`);
  /* ---------- INSERTING AT AN OFFSET, ON ITS OWN LINE ----------
     A clause's text carries one sub-paragraph per line, and docRichFromText
     reads those line openers back into real list markup at filing time. So new
     wording has to ARRIVE as lines or it is filed as one paragraph and the
     numbering a contract is cited by is lost.

     The trims are what stop a seam from showing. Inserting mid-paragraph
     leaves the remainder of that paragraph starting a new line — which is the
     honest rendering, since a list genuinely cannot sit inside a paragraph —
     but without them it would start with the space that used to follow the
     selected sentence, and a line beginning with a space is a line the
     document builder reads differently. */
  const insertAt = (src, at, wording) => {
    const head = String(src).slice(0, at).replace(/\s+$/, '');
    const tail = String(src).slice(at).replace(/^\s+/, '');
    return [head, String(wording).trim(), tail].filter(x => x !== '').join('\n');
  };

  const applyWording = (wording, card) => {
    /* WHERE, read off the card at the moment Apply is pressed — not off the
       model's original answer. The reader may have corrected the placement
       since, and that correction is the whole point of the control. */
    const placement = window.aiNormalizePlacement
      ? aiNormalizePlacement(card && card.placement) : 'replace';
    const noteLabel = action.noteLabel || action.label.replace(/^\S+\s/, '');
    const note = `Copilot — ${noteLabel}${RL_PLACEMENT_NOTE[placement] || ''}`;
    /* The reason typed on the proposal card, if any. Distinct from `note`
       above on purpose: note is provenance ("Copilot — Edit"), internal, and
       never crosses the table; the reason is the person's own case for the
       change, written to be read by the other side. Every other way of filing
       a redline asks this question — the Copilot's Apply was the one that did
       not, so a change drafted by the model arrived with less explanation
       than one typed by hand, which is backwards. */
    const why = String((card && card.why) || '').trim() || undefined;
    const moved = { ok: false, message: 'This text changed while the panel was open. Reselect the passage and try again.' };

    /* ---- A WHOLE NEW CLAUSE ----
       Deliberately not routed through the passage checks below, on either the
       single-clause or the span path: its anchor is the CLAUSE, not the wording
       inside it, so a selection that has since drifted is not a reason to
       refuse. What must still be true is that the clause it follows is there,
       and that was checked when the panel opened. */
    if (placement === 'newClause'){
      if (!window.negoInsertClause)
        return { ok: false, message: 'This build cannot file a new clause. Choose Replace, Add after or Add before instead.' };
      /* AFTER THE WHOLE HIGHLIGHT, not after the block the drag began in.
         `clauseId` names the selection's STARTING clause, which is the right
         anchor for a single-clause selection and the wrong one for a span:
         a highlight across three paragraphs would put the new clause after the
         first of them — inside the wording the reader had just selected, which
         is the one place "after this" cannot mean. */
      const anchorId = parts ? parts[parts.length - 1].clauseId : clauseId;
      /* AND THE ANCHOR HAS TO STILL BE THERE. Every other path on this function
         re-resolves against the live document at Apply, because the panel stays
         open for as long as the conversation lasts. This one skipped the check
         on the reasoning that a new clause does not depend on the passage — true
         of the WORDING, false of the anchor. An insert filed against a clause
         that has since gone does not fail loudly: negoDocHtml treats it as an
         orphan and drops it to the end of the document (see orphanInserts), so
         the reader gets a clause in a place nobody chose and nothing says so. */
      if (!(window.negoClauseById && negoClauseById(c, anchorId)))
        return { ok: false, message: 'The clause this would follow is no longer in the document. Reselect a current clause and try again.' };
      return fileAll([{ kind: 'insert', clauseId: anchorId, bodyHtml: asHtml(String(wording)),
        headingText: (card && card.headingText) || '' }], note, why);
    }

    /* ---- THE SPAN CASE ----
       A highlight across several headingless blocks. REPLACING it collapses
       them: the head takes the new wording and the blocks the highlight ate are
       proposed for deletion, with the tail of the last block kept and re-filed
       so a rewrite of two sentences does not silently carry off a third.

       ADDING to it deletes nothing at all. Every block the reader highlighted
       stays exactly as it is and the new wording lands at one end of the span —
       the last block for "after", the first for "before" — which is one edit
       and no collapse. Running an insert through the replace machinery would
       delete blocks the reader asked to keep, which is the same class of
       silent loss this whole feature exists to stop. */
    if (parts){
      if (placement !== 'replace'){
        const p = placement === 'after' ? parts[parts.length - 1] : parts[0];
        const x = window.negoClauseById ? negoClauseById(c, p.clauseId) : null;
        if (!x) return moved;
        const t = String(x.text || '');
        const hit = negoResolvePassage(t, p);
        if (!hit) return moved;
        return fileAll([{ kind: 'edit', clauseId: p.clauseId,
          html: asHtml(insertAt(t, placement === 'after' ? hit.end : hit.start, wording)) }], note, why);
      }
      const jobs = [];
      for (let i = 0; i < parts.length; i++){
        const p = parts[i];
        const x = window.negoClauseById ? negoClauseById(c, p.clauseId) : null;
        if (!x) return moved;
        const t = String(x.text || '');
        const hit = negoResolvePassage(t, p);
        if (!hit) return moved;
        if (i === 0){
          jobs.push({ kind: 'edit', clauseId: p.clauseId, html: asHtml(t.slice(0, hit.start) + String(wording)) });
        } else if (i === parts.length - 1){
          const rest = t.slice(hit.end);
          if (rest.trim()) jobs.push({ kind: 'edit', clauseId: p.clauseId, html: asHtml(rest.replace(/^\s+/, '')) });
          else jobs.push({ kind: 'delete', clauseId: p.clauseId });
        } else {
          jobs.push({ kind: 'delete', clauseId: p.clauseId });
        }
      }
      return fileAll(jobs, note, why);
    }

    const live = window.negoClauseById ? negoClauseById(c, clauseId) : null;
    if (!live) return { ok: false, message: 'This clause is no longer in the document. Select a current clause and try again.' };
    const nowText = String(live.text || '');
    const isWhole = window.negoPassageIsWhole && negoPassageIsWhole(nowText, passage);
    const hit = isWhole ? null : negoResolvePassage(nowText, passage);
    if (!isWhole && !hit) return moved;
    /* ---- REPLACE SWAPS, AFTER AND BEFORE KEEP ----
       The anchor is the passage's own end or start, resolved against the text
       as it reads NOW rather than as it read when the panel opened. Where the
       selection was the whole clause there is no offset to find: after means
       the end of it and before means the top. */
    const proposed = placement === 'replace'
      ? (isWhole ? String(wording)
         : nowText.slice(0, hit.start) + String(wording) + nowText.slice(hit.end))
      : placement === 'after'
        ? insertAt(nowText, isWhole ? nowText.length : hit.end, wording)
        : insertAt(nowText, isWhole ? 0 : hit.start, wording);
    if (proposed === nowText) return { ok: false, message: 'That wording matches the clause already — nothing was filed.' };
    return fileAll([{ kind: 'edit', clauseId, html: asHtml(proposed) }], note, why);
  };

  const refine = async (instruction, prev, extra) => {
    /* The placement in force travels with the ask, so the next draft is written
       for where it is actually going — three bullets read differently when they
       follow a sentence than when they stand in for it. It is NOT returned
       below: aiRefineProposal carries the reader's own placement forward, and
       letting the model re-pick every turn would quietly undo a correction they
       had already made. */
    const where = window.aiNormalizePlacement
      ? aiNormalizePlacement(prev && prev.placement) : 'replace';
    const history = [(extra && extra.history) || '',
      action.placements && where !== 'replace'
        ? `Your wording is going to be filed ${where === 'newClause'
            ? 'as a new clause following the one the passage sits in'
            : `${where} the selected passage, which is being kept`}. Draft for that placement.`
        : ''].filter(Boolean).join('\n');
    const made = await copilotPropose({ ask: action.ask, passage: text, party,
      playbook: pbLine, instruction, history, clauseLabel: negoClauseLabel(cl),
      placements: action.placements === true });
    if (!made) return null;
    return { advice: made.advice, proposedText: made.proposedText, strict: made.strict,
      placements: action.placements === true, headingText: made.headingText,
      clauseLabel: negoClauseLabel(cl), replacing: text, onApply: applyWording, onRefine: refine };
  };
  /* `history` is the exchange in the panel so far, handed over by aiSubmit. The
     first instruction in a session used to travel without it, which is how
     "combine them" reached the model as a pronoun with nothing to point at. */
  const propose = async (instruction, history) => {
    const made = await copilotPropose({ ask: action.ask, passage: text, party,
      playbook: pbLine, instruction: instruction || '', history: history || '',
      clauseLabel: negoClauseLabel(cl), placements: action.placements === true });
    if (!made) return false;
    const card = window.aiOpenProposal ? aiOpenProposal({ advice: made.advice,
      proposedText: made.proposedText, strict: made.strict,
      placements: action.placements === true, placement: made.placement,
      headingText: made.headingText,
      clauseLabel: negoClauseLabel(cl), replacing: text,
      onApply: applyWording, onRefine: refine }) : null;
    /* The session hands over once there IS a card: the next sentence typed is
       then a note about the proposal rather than a second answer to a question
       that has already been answered. */
    if (card && window.aiCloseRephraseSession) aiCloseRephraseSession();
    return true;
  };

  if (action.converse && window.aiOpenRephraseSession){
    aiOpenRephraseSession({ passage: text, clauseLabel: negoClauseLabel(cl),
      greeting: action.greeting,
      onPropose: (instruction, session, extra) => propose(instruction, (extra && extra.history) || '') });
    return;
  }
  try{
    if (!await propose('')) rlSayInPanel('The Copilot didn\'t return a usable answer. Try again.');
  }catch(err){
    rlSayInPanel(`The Copilot could not answer: ${(err && err.message) || err}. Nothing was changed.`);
  }
}

/* ---------- 🏷️ TAG WITH INTERNAL NOTE ----------
   Straight into the Discussion column's own composer, with the internal switch
   pressed and the selected wording quoted into the field. No dialog: the note
   is going to live in that panel, so that is where it is written, and the
   reader can see the thread it is joining while they write it.

   A note needs somewhere to live, and on this engine that is a CHANGE. Where
   the clause has none yet this says so rather than filing an empty change to
   hang a note on — a fingerprint nobody proposed is worse than a message that
   explains itself. */
/* ---- OPEN, SHUT, AND NOTHING IN BETWEEN ----
   A card is shut until somebody presses its head, and open until somebody
   presses it again. That is the whole rule (Young, 10 Aug 2026: "the cards you
   only open when you click on them and you click again and they disappear").

   WHAT IT REPLACED, because the reasoning is worth keeping even though the
   behaviour is not. There used to be three states — peek, pin and an automatic
   open for any card carrying a verb — built to solve a real problem: working
   through a round left a column of cards the reader had opened and now had to
   close one by one. The answer was to have the page decide, and the page
   decided badly in three ways at once. It opened cards nobody had asked to
   open, so a busy round arrived as a wall. It moved the column under a pointer
   merely crossing it. And it shut one card when you opened another, so two
   changes could not be compared.

   The exemption that made the old scheme safe — a card with something to press
   never folds — is not needed here and would in fact break the rule: it would
   mean some cards could not be closed. The safety it was protecting (a verb
   must not vanish while the hand is travelling toward it) is now structural
   instead: only the HEAD toggles, so nothing inside the body can fold the body
   away, and nothing but a press changes the state at all. */
/* ---- THE CARD POP-OUT IS RETIRED (owner-asked, 16 Aug 2026) ----
   The floating panel a card's &#10530; opened did the clause panel's job: full
   wording, the reason, the reviewer's note and the reply box, beside the card.
   The clause panel now carries every one of those — per ask, on the clause the
   ask is about — and the card has become a short routing row whose Open raises
   THAT panel instead. _rlPopId / _rlPopAt / rlPopPlace / rlPopPaint /
   rlPopWireOnce / rlPopWireDrag / rlPopMount / rlPopReturnBody, the &#10530;
   button (data-rl-pop), .rl-pop-* and .rl-card-popped are all GONE — flag any
   mention as stale. The lesson the pop-out carried — a COPY of the composer
   posts nothing, so the box must be the engine-wired original — moved with the
   composer into rlClausePanelBodyHtml, which renders the one real composer per
   change (see the note there). */
/* An open clause panel belongs to the contract it was opened on, and to this
   visit. Not persisted (a working preference is not a setting) and dropped when
   the reader moves to another contract, so the panel cannot arrive open on a
   clause the reader has never seen. */
let _rlPinnedFor = null;
/* rlTagInternalNote is gone with the two buttons that called it. It switched
   the sidebar to Discussion, nominated a change, pressed the visibility switch
   to internal and quoted the passage — a private remark about a fragment, and
   it required a change to exist on the clause first, so the commonest moment
   to want one was the moment it refused. Reasons live on the change now. The
   Discussion panel still writes notes, internal ones included. */
/* ---------- WHICH CARD IS OPEN (owner-ruled 2 Sep 2026) ----------
   *"What if the cards only had Open instead of edit, accepted etc. You then
   click open and the cards only expands and gives you all the options that are
   hidden in the dropdown including the comments for the card."*

   ONE AT A TIME, which is this page's own rule for every other thing that
   opens in place — the ask reveal and the clause panel both keep a single id —
   and for the same reason: a column of expanded cards is the wall of cards the
   piles were built to answer. Per SITTING and in memory, like both of those:
   a remembered open card would arrive expanded a week later with nothing on
   screen saying why. */
let _rlCardOpen = null;
const rlCardOpenId = () => _rlCardOpen;
function rlCardSetOpen(id){ _rlCardOpen = id ? String(id) : null; }
function rlCardForgetPins(contractId){
  const id = String(contractId == null ? '' : contractId);
  if (_rlPinnedFor === id) return;
  _rlPinnedFor = id;
  /* A card cannot arrive open on a change belonging to another contract. */
  rlCardSetOpen(null);
  /* The clause panel cannot arrive open on a clause this reader has never
     seen. (It would shut itself anyway — a fresh contract's clause ids match
     no body — but "shut on arrival" is this feature's own stated rule and is
     kept true here rather than left to a coincidence of ids.) */
  if (typeof rlCpSetOpen === 'function') rlCpSetOpen(null);
}
/* The verbs reduced to which ACTIONS are on offer, ignoring the ids inside them
   so that a clause being renamed underneath a card does not count as a state
   change. */
/* READ OFF THE VERBS, not off the status. Enumerating states here would be a
   second copy of the rule that builds the verbs a hundred lines below, and the
   two would disagree the first time either moved.

   Edit does not count: it navigates. Nor does Change decision: it has gone,
   the other side is holding it, and an escape hatch is not a move waiting on
   anybody. Everything else — Accept, Reject, Withdraw, Undo, Retract, Send —
   is a move waiting on this reader, and a move you cannot see is a move you
   do not make.

   data-rl-reopen JOINED IT (13 Aug 2026), for the reason Change decision is
   already in it: the owner's way back from a refusal they gave is an escape
   hatch, not an outstanding move. It rides beside data-nego-undo — the engine's
   handler, which this pattern must NOT swallow wholesale, because the
   counterparty's Undo is a real move on an answer that has not been sent.

   data-rl-sent LEFT THIS PATTERN WITH THE BUTTON (13 Aug 2026). The spent Send
   marker is no longer drawn at all, so nothing emits that attribute and a
   pattern matching nothing is a pattern nobody can read. THE OUTCOME IS
   UNCHANGED, and that is the thing to check rather than assume: a sent ask of
   ours now leaves exactly one verb on the card — Edit — which is inert for its
   own reason, so the card still reads as needing nothing. f100 proves that off
   the rendered card rather than off this rule. */
/* EDIT IS INERT WHICHEVER DOOR IT IS (30 Aug 2026). Since the owner shut our
   seat's doors onto the clause panel, Edit carries data-rl-cp-editor-row here
   and data-rl-edit elsewhere — the same verb, still a way INTO the wording
   rather than a move waiting on anybody. Left out, a sent ask of ours read as
   outstanding work on the one seat that had the editor. Caught by f192. */
const RL_CARD_INERT = /data-rl-edit|data-rl-cp-editor-row|data-nego-redecide|data-rl-reopen/;
function rlCardNeedsYou(verbs){
  return (verbs || []).some(v => !RL_CARD_INERT.test(String(v)));
}
/* The pop-out machinery that stood here — rlPopId, rlPopSet, rlPopPaint,
   rlPopPlace, rlPopWireDrag, rlPopWireOnce and the borrowed-body dance — is
   retired; see the note above rlCardForgetPins. The clause panel (rlCp*, and
   rlClausePanelBodyHtml for the bodies) is the one reading surface now. */

function rlLinkFocus(c, changeId, source){
  const page = document.getElementById('view-redline')
    || document.querySelector('.redline-page.rl-embed');
  const id = String(changeId == null ? '' : changeId);
  if (!page || !id) return false;
  const q = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
  page.querySelectorAll('.is-linked').forEach(n => n.classList.remove('is-linked'));
  /* [~=] — attribute word match. The anchor carries EVERY change on the
     clause, space-separated (the queue's data-rl-queue-ids pattern), so each
     card finds its clause whichever position its id holds in the list. This
     is the line that made half the cards dead when two asks shared a clause:
     an exact match against a one-id attribute that only ever named the newest. */
  const clause = page.querySelector('#rl-doc [data-nego-card-anchor~="' + q(id) + '"]');
  const card = page.querySelector('#rl-changes [data-nego-card="' + q(id) + '"]');
  /* The change's THREAD is the same thing again in the discussion panel, so
     it lights with the pair — and whichever sidebar face is showing is the
     one that gets scrolled: scrolling a display:none panel moves nothing,
     and the reader is looking at exactly one of the two. */
  const thread = page.querySelector('#rl-threads [data-rl-thread="' + q(id) + '"]');
  const mode = page.getAttribute('data-rl-side-mode') === 'disc' ? 'disc' : 'changes';
  /* THE QUEUE IS THE FOURTH END OF THIS LINK. A card, a clause and a thread
     already light together; the row that covers the same change has to move
     with them, or pressing a card leaves the queue pointing somewhere else and
     the two disagree about what the reader is doing. Guarded on a match: a
     change with no row (the queue is not mounted, or the change is behind this
     seat's wall) must not clear a ring that is still true. */
  if (rlQueueMark(page, id) && typeof rlQueueSelect === 'function'){
    const cur = (typeof negoChanges === 'function' && c) ? c : null;
    if (cur) rlQueueSelect(cur, id);
  }
  if (clause){
    clause.classList.add('is-linked');
    if (source !== 'clause' && clause.scrollIntoView)
      clause.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  if (card){
    card.classList.add('is-linked');
    if (source !== 'card' && mode === 'changes' && card.scrollIntoView)
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  if (thread){
    thread.classList.add('is-linked');
    if (source !== 'card' && mode === 'disc' && thread.scrollIntoView)
      thread.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  return !!(clause || card || thread);
}

/* ---------- JUMP TO THE CLAUSE AND EDIT IT THERE ----------
   What the Tracked Changes card's Edit button does. Not a dialog over the
   column and not an editor inside the card: the change is a change to a
   CLAUSE, and the only place its wording can be judged is between the clauses
   either side of it. So the document scrolls to it, the clause says it has
   arrived, and the engine's own inline editor opens on it — the same
   data-nego-edit path Direct Edit uses, so there is one way to edit a clause
   on this page rather than two that can disagree. */
function rlJumpToClause(clauseId, opts = {}){
  const page = document.getElementById('view-redline')
    || document.querySelector('.redline-page.rl-embed');
  if (!page) return null;
  const sel = `[data-clause="${window.CSS && CSS.escape ? CSS.escape(clauseId) : clauseId}"]`;
  const clause = page.querySelector('#rl-doc ' + sel) || page.querySelector(sel);
  if (!clause) return null;
  if (clause.scrollIntoView) clause.scrollIntoView({ block: 'center', behavior: 'smooth' });
  /* rl-arrived, NOT rl-jump: the toolbar's contract picker owns that word, and
     while this shared it the clause wore a dropdown's max-width and collapsed
     to 285px the moment a card's Edit landed on it. See the note beside the
     rule in the sheet. */
  clause.classList.remove('rl-arrived');
  /* Re-triggering the animation needs the class off for a frame; without the
     reflow read the browser coalesces remove+add into no change at all, so a
     second press of the same card's Edit lit nothing. */
  void clause.offsetWidth;
  clause.classList.add('rl-arrived');
  /* THE JUMP NO LONGER OPENS AN EDITOR, because there is none on the clause to
     open (16 Aug 2026): the tool row is retired and all writing happens in the
     clause panel. opts.edit used to choose between "take me there" and "take
     me there and start typing"; both callers now get the first, and the way
     into writing is the Edit pill on the clause this jump just lit. The opts
     shape is kept so no caller changes. */
  void opts;
  return clause;
}

/* The page's own wiring — the queue, the card jumps, the resizer, the zoom,
   the pop-out and the clause panel's repaint. (The clause TOOL ROW this
   function was named for is retired — 16 Aug 2026, all edits through the
   clause panel — and its wiring went with its buttons; the name stays because
   half the suite calls it by it.) */
function rlWireClauseTools(c, host, opts){
  /* The owner's page repaints itself; a mount repaints however its host says.
     Falling back to renderRedline from inside an embed would paint the owner's
     workbench over a page that is not the owner's. */
  const again = (opts && typeof opts.rerender === 'function') ? opts.rerender : () => renderRedline();
  /* The clause toolbar's AI Assist is GONE — the Copilot's three actions open
     from a text selection only (the engine's selMenu hook, which this page
     supplies), because highlighting the words is itself the statement of
     scope. The [data-rl-ai] wiring went with the button. */

  /* No [data-rl-note] wiring: the button it served is gone. See the clause
     toolbar for why. */

  /* ---- A QUEUE ROW TAKES YOU TO THE CLAUSE AND OPENS ITS CARD ----
     One press, both ends: the document scrolls to the wording and the change's
     card opens beside it, because deciding needs the passage and the verbs
     together and the reader has already said which change they mean.

     rlLinkFocus does the lighting and the scrolling for both panes — the same
     call the card stack makes — so the queue cannot drift from the behaviour
     of the column it points at. Source 'queue' rather than 'card' or 'clause'
     because neither of those is where the press came from, and both of them
     mean "do not scroll the end I came from".

     THE ROW POINTS AT ITS FIRST UNANSWERED CHANGE. A row can stand for several
     changes (one row per clause) and only one card can be opened; the one
     still awaiting a decision is the one the reader is being sent to do
     something about. rlQueueRows picks it as `lead`; a fully answered row
     falls back to its first change, so a settled row still navigates. */
  host.querySelectorAll('[data-rl-queue]').forEach(row => row.addEventListener('click', ev => {
    ev.preventDefault();
    const id = row.getAttribute('data-rl-queue');
    const clauseId = row.getAttribute('data-rl-queue-clause');
    /* ---- THE PRESS CLOSES THE PANEL (12 Aug 2026) ----
       A queue row is a door: it scrolls the contract to that clause and opens
       the change's card beside it. With the queue floating OVER the contract,
       a jump that left the panel standing would land the reader on a passage
       behind it — a door that opens onto a wall. So the overlay stands down on
       the press, and the reading it sent you to is the thing on screen. The
       door at the edge is one press away, still carrying the score. */
    if (typeof rlSetQueueShown === 'function' && rlQueueOpen())
      rlSetQueueShown(row.closest('.redline-page') || host, false);
    /* THE RING MOVES ON THE PRESS, BEFORE ANYTHING ELSE HAPPENS. Recorded in
       module state so a repaint keeps it, and moved in the DOM immediately so
       the answer does not wait on one — a highlight that arrives after a
       render is a highlight the reader has already stopped believing in. */
    rlQueueSelect(c, id);
    rlQueueMark(row.closest('.redline-page') || host, id);
    /* THE ROW NO LONGER FORCES A CARD OPEN. It used to unfold the card as well
       as scroll the document, because the card was where the wording and the
       verbs both were. The verbs are on the card whatever else is happening,
       the wording is in the document this press just scrolled to, and opening
       a panel over that document would cover the very thing the reader asked
       to see. */
    if (id && rlLinkFocus(c, id, 'queue')) return;
    /* No card and no anchor — a clause whose change has left the live set.
       Falling back to the clause itself still answers "take me to it", and
       edit:false because a queue row is a place to LOOK, not an invitation to
       start typing in the contract. */
    if (clauseId) rlJumpToClause(clauseId, { edit: false });
  }));

  /* THE CARD'S EDIT OPENS THE CLAUSE PANEL (owner-asked 20 Aug 2026: "when
     you click on edit in the card, it should take you to the edit side panel
     — not to the contract", both seats). The panel is where writing happens
     since the paper's editors retired, so a card verb named Edit landing the
     reader on a paper they cannot type into was a door to the wrong room.
     One mechanism — rlCpSetShown, the pill's own — never a second path; the
     jump stays FIRST so the paper still scrolls to the clause and lights it
     beside the panel. Where the panel holds no body for the clause (an
     insertClause ask), rlCpSetShown refuses to open an empty panel and the
     press remains the old jump — a door must not open onto nothing.
     Stopped from bubbling because the card itself links on click, and that
     would scroll the column back over the jump. */
  /* ---- OPEN, AND WHAT IS INSIDE IT (owner-ruled 2 Sep 2026) ----
     The row's one control. It toggles which card is open and repaints from the
     press — `rlRepaintFrom` BARE, because it is this module's own name and a
     `window.` guard on it is always false (the fault this file records twice).

     STOPPED FROM BUBBLING, like every other button on a card: the row itself
     navigates to the clause, and a press meant to open the card must not also
     scroll the column out from under the hand that pressed it. It DOES light
     the clause first, so opening a card still shows you what it is about —
     rlLinkFocus, the row's own act, never a second implementation. */
  host.querySelectorAll('[data-rl-card-open]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const id = btn.getAttribute('data-rl-card-open');
    const opening = rlCardOpenId() !== String(id);
    rlCardSetOpen(opening ? id : null);
    /* ---- THE LIGHT GOES ON AFTER THE REPAINT, NOT BEFORE ----
       rlLinkFocus marks the card and its clause by writing is-linked onto the
       elements it finds, and the repaint below REPLACES the column's markup —
       so lighting first threw the mark away in the same frame and the reader
       pressed Open, watched the paper move, and saw nothing marked. Nothing
       failed and nothing logged; it was found by measuring the painted page.
       The paper is not rebuilt by this repaint, so only the CARD's mark was
       ever at risk, which is exactly what made it easy to miss. */
    rlRepaintFrom(btn);
    if (opening){
      const ch = (negoChanges(c) || []).find(x => x && String(x.id) === String(id));
      if (ch && ch.clauseId) rlLinkFocus(c, id, 'card');
    }
  }));
  /* ---- THE COMMENTS INSIDE THE CARD ----
     The drawer's own two acts, on the card's copy of its markup: rlNpSetRoom
     for the room and rlNotesSend for the writing. Both are the SAME functions
     the Notes drawer presses, so a note written here is written the way every
     other note in this product is written — one reading of which room it is
     in, one writer, one confirm before anything crosses to the other side.
     rlNotesSend resolves its box from the host it is given, which is why the
     card's composer needs no id and cannot collide with the drawer's. */
  host.querySelectorAll('.rl-cb-notes [data-rl-np-room]').forEach(b =>
    b.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation();
      rlNpSetRoom(b.getAttribute('data-rl-np-room'));
      rlRepaintFrom(b);
    }));
  host.querySelectorAll('.rl-cb-notes').forEach(box => {
    const id = box.getAttribute('data-rl-np');
    const ch = (negoChanges(c) || []).find(x => x && String(x.id) === String(id));
    if (!ch) return;
    const send = box.querySelector('[data-rl-np-send]');
    const post = async () => {
      const ok = await rlNotesSend(box, c, ch, opts, send && send.getAttribute('data-room'));
      if (ok !== false) rlRepaintFrom(box);
    };
    if (send) send.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation(); post();
    });
    const field = box.querySelector('.rl-np-in');
    if (field){
      field.addEventListener('click', ev => ev.stopPropagation());
      field.addEventListener('keydown', ev => {
        if (window.chatFieldSubmits
          ? chatFieldSubmits(ev) : (ev.key === 'Enter' && (ev.preventDefault(), true))) post();
      });
      /* THE @ PICKER, ARMED AFTER the send's own keydown and answering BEFORE
         it — it binds in the capture phase, so while a name is being chosen
         Enter picks rather than posts, and when the menu is shut it does not
         run at all. */
      if (typeof rlNpTagWire === 'function') rlNpTagWire(box, field);
    }
  });
  host.querySelectorAll('[data-rl-edit]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const clauseId = btn.getAttribute('data-rl-edit');
    const changeId = btn.getAttribute('data-rl-edit-change');
    if (changeId) rlLinkFocus(c, changeId, 'card');
    if (!rlJumpToClause(clauseId)){
      if (window.toast) toast(i18t('ng_clause_gone'), 'err');
      return;
    }
    /* AND IF THE PANEL WILL NOT OPEN, THE PRESS SAYS SO (owner-reported
       26 Aug 2026, L-3: "if you click Edit in the card it should take you to
       the attached edit window not to the contract").

       Edit does two things — scroll the paper to the clause, then open the
       panel on it — and the second half can be refused: the panel holds a body
       per clause, and where it holds none for this one it will not slide out
       empty. Until now that refusal was silent, so the reader got the jump and
       nothing else, which is the report word for word. Nothing is invented
       here: where the panel can show the clause it opens exactly as before,
       and where it cannot the reader is told rather than left guessing whether
       they pressed it properly. */
    /* ---- ON OUR SEAT IT IS A JUMP AND NOTHING MORE (owner-reported 1 Sep
       2026: "the feature in image 5 appeared again when it is supposed to be
       completely eliminated from the internal side of the platform") ----

       This handler opened the clause panel unconditionally, and it is what the
       ⋯ menu's "Jump to the clause" row presses. So the panel the owner shut
       on 30 Aug came back through a row whose own label promises only a jump —
       two acts under one name, and the second of them retired.

       IT ASKS THE ONE READING the pencil, the card's Edit and the menu's
       Copilot row all ask, so where the editor is the door this row does
       exactly what it says and nothing else. THE FALLBACK ROW IS WHY THE
       HANDLER HAS TO ASK AS WELL AS THE GUARD: a card with no other rows at
       all still draws one, deliberately, so the guard alone cannot close this.

       THEIR SEAT IS UNTOUCHED. Their Edit carries this attribute, the panel is
       the only way their page proposes wording, and the refusal below is the
       one L-3 was built for. */
    if (rlEditorTakesIt((opts && opts.side) || 'owner')) return;
    if (!rlCpSetShown(btn.closest('.redline-page') || document, clauseId)
        && window.toast) toast(i18t('ng_cp_cannot_open'), 'warn');
  }));

  /* The origin filter and the sidebar's mode tabs were wired here. Both
     controls are gone — see RL_CARD_FILTERS and rlSideMode — so their
     handlers went with them rather than staying as listeners for elements
     nothing draws. */

  /* ---- THE SPLIT HANDLE ---- */
  rlWireResizer(host);

  /* ---- AND THE SHEET FITS THE COLUMN IT LANDED IN ----
     A first measurement for a pane that has just been built, and an observer
     so it follows every later cause — the drag, the window, the rail, the
     stacking break. See rlApplyDocZoom. */
  rlApplyDocZoom(host);
  rlObserveDocPane(host);

  /* ---- THE TEXT-SIZE STEPPER ---- */
  rlWireTypeStep(host);

  /* ---- FOLDING THE QUEUE ---- */
  rlWireQueueMin(host);

  /* ---- PRESSING A CARD TAKES YOU TO ITS CLAUSE, AND DOES NOTHING ELSE ----
     It used to do two jobs on one press: scroll the document to the change AND
     unfold the card. Navigating is the more valuable of the two — it is what a
     card IS, a handle on a passage — and unfolding is what made the column jump
     under a reader who only wanted to look at a clause. The reading matter has
     its own door now, so this press means one thing.

     STILL ONLY THE HEAD. The action bar is a sibling, so pressing Accept, Send
     or Undo does its own job and never navigates as a side effect. */
  host.querySelectorAll('#rl-changes [data-nego-card] .rl-card-head').forEach(headEl =>
    headEl.addEventListener('click', ev => {
      const card = headEl.closest('[data-nego-card]');
      if (!card) return;
      rlLinkFocus(c, card.getAttribute('data-nego-card'), 'card');
    }));

  /* The pop button's wiring stood here. The row's Open carries
     data-rl-cp-open — the clause panel's own delegated door, armed at module
     load in the capture phase — so there is nothing per-paint to wire for it:
     one door, one handler, both seats. */
  /* The clause panel is re-shown after a repaint: it borrows nothing (its
     bodies are re-rendered each paint) but the OPEN one's class went with the
     rebuild. rlCpPaint re-flips the fresh markup, or shuts the panel where the
     clause has gone entirely. Scoped to this mount, so two mounted pages do
     not fight over one panel. */
  rlCpPaint(host.closest && host.closest('.redline-page') ? host.closest('.redline-page') : host);

  /* PRESSING ANYWHERE ELSE USED TO CLOSE THEM ALL, on the reasoning that a
     press outside the column was the reader moving on. It is gone with the
     rest of the automatic state: a card the reader opened stays open until the
     reader closes it, and clicking into the document to read a clause is not a
     request to lose your place in the column. */

  /* ---- CONTRACT → CARD ----
     And the same in reverse, from the clause. Two things are deliberately not
     a click here: pressing one of the clause's own tools, and finishing a text
     selection. Both are somebody operating the clause rather than asking about
     it, and scrolling the column under them mid-gesture — or worse, moving the
     page while a phrase is being selected — is the interruption this pairing is
     supposed to save them. */
  const fromClauseControl = t => !!(t && t.closest && t.closest(
    '.nego-tool, .nego-selmenu, [data-nego-editor], .nego-edit-bar, '
    + 'button, a, input, textarea, select'));
  host.querySelectorAll('#rl-doc [data-nego-card-anchor]').forEach(sec =>
    sec.addEventListener('click', ev => {
      if (fromClauseControl(ev.target)) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && !sel.isCollapsed && String(sel.toString() || '').trim()) return;
      /* The anchor is a LIST now; a press on the clause lights the change
         whose marks are on screen — the first token, kept lead-first for
         exactly this read. */
      rlLinkFocus(c, String(sec.getAttribute('data-nego-card-anchor') || '').split(/\s+/)[0], 'clause');
    }));

  /* ---- DISCUSSION CARD → CONTRACT ----
     A thread hangs off a change, so clicking its card is the same ask as
     clicking the change's own card: light the clause and take the document
     there. The same guard as the clause's — typing a reply, pressing its
     send or flipping its visibility is operating the thread, not asking
     where it lives. */
  host.querySelectorAll('#rl-threads [data-rl-thread]').forEach(t =>
    t.addEventListener('click', ev => {
      if (fromClauseControl(ev.target)) return;
      rlLinkFocus(c, t.getAttribute('data-rl-thread'), 'card');
    }));

  /* ---- THE CARD'S SEND SENDS THAT CARD (owner-asked 16 Aug 2026, and this
     REVERSES the 11 Aug "one send, batch semantics" decision — reported as a
     bug in exactly those words: "if I click on one card to send, it sends all
     the cards"). The press still goes through the page's ONE postbox — never
     a second transport — but it marks itself a SOLO send first: onSendDirect
     reads the marker and holds every OTHER unsent draft back
     (negoHoldOthers), so the round that leaves carries exactly this change
     and the rest stay on the desk reading Draft. The batch doors — the "Send
     all N" band and Publish Round — release the hold on their way through,
     because a batch door means "send everything".

     OWNER'S SEAT ONLY. The counterparty's card Send still posts everything
     their page holds (#nego-send-decisions) — their held answers travel as
     one response envelope by design, and the button's title says so. */
  negoWireWhyClamp(host);
  host.querySelectorAll('[data-rl-send]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    /* Whose postbox a card's Send presses depends on whose card it is: the
       owner's is #nego-send, the counterparty's — on their page and on the
       owner's preview alike — is #nego-send-decisions. Scoped to this mount
       first so two workbenches on one page cannot press each other. */
    const id = (opts && opts.side) === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
    const engine = negoPick(host, id) || document.getElementById(id);
    if (engine && !engine.disabled){
      const chId = btn.getAttribute('data-rl-send');
      /* The marker lives only for this synchronous press: onSendDirect
         consumes it on its first line, and the timeout clears it in case the
         press fell through to the share dialog instead (no contact on file) —
         a lingering marker would turn the NEXT batch press into a solo one. */
      if (id === 'nego-send' && chId) _rlSoloSendId = chId;
      try{ engine.click(); } finally { setTimeout(() => { _rlSoloSendId = null; }, 0); }
      return;
    }
    if (window.toast) toast(i18t('ng_nothing_to_send'), 'err');
  }));

  /* ---- AND THE WAY OUT OF "THEY HAVE NO LIVE COPY" ----
     A proxy onto the share dialog, which is the one door a live link is made
     through. Same discipline as the Send above: never a second transport,
     never a second way of minting a link. It only exists on cards where the
     product has just declined to claim a wait, so the sentence and the verb
     are read together. */
  host.querySelectorAll('[data-rl-sendcopy]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (window.openShareModal) openShareModal(c);
    else if (window.toast) toast(i18t('ng_nothing_to_send'), 'err');
  }));

  /* The card's Retract — an unsent draft of your own comes off the table
     entirely. The engine (negoRetractDraft) holds the rules: yours, pending,
     and never handed over; anything else is refused with a reason. */
  /* The card's own "ask for a review" — the same dialog the toolbar opens, with
     this one change already picked. */
  host.querySelectorAll('[data-rl-ask-review]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    if (!window.openReviewAskModal) return;
    openReviewAskModal(c, { ids: [btn.getAttribute('data-rl-ask-review')], after: () => again() });
  }));

  host.querySelectorAll('[data-rl-retract]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const chId = btn.getAttribute('data-rl-retract');
    if (!window.negoRetractDraft) return;
    const side = (opts && opts.side) === 'counterparty' ? 'counterparty' : 'owner';
    /* THE BUTTON AND THE RULE HAVE TO ASK ONE QUESTION. This card is drawn from
       opts.unsentIds where the mount supplies them (the counterparty's page
       does), so the engine is handed the same list rather than deriving a
       second answer from the turn stamp — which is what made this button dead
       on their seat before the first hand-over. See negoRetractDraft. */
    const ch = negoRetractDraft(c, chId, { side, by: opts && opts.by,
      unsentIds: Array.isArray(opts && opts.unsentIds) ? opts.unsentIds : undefined });
    if (!ch) return;
    if (window.negoInvalidateVerification) negoInvalidateVerification(c);
    /* ---- AND THE PAGE HOLDING THE DRAFT HAS TO BE TOLD IT HAS GONE ----
       On the counterparty's link the contract is rebuilt from the share payload
       on every repaint and their own unsent asks are put back from a store this
       function cannot see. So removing the change from the copy on screen and
       repainting drew it straight back, and the button read as dead a second
       way. The mount that owns the store clears it. */
    if (opts && typeof opts.onRetract === 'function'){
      try { opts.onRetract(c, chId); } catch (_){ /* a page that cannot forget must not take the act down */ }
    }
    if (window.persist) persist(c);
    if (window.toast) toast(`#${chId} retracted — it was never sent, so nothing left your desk`);
    again();
  }));
}

/* ---------- ONE SIDEBAR, TWO MODES, NEVER BOTH ----------
   The right-hand card shows Tracked Changes OR Discussion — a strict either/
   or, switched by the tabs at its head. The choice is an attribute on the
   workbench root (data-rl-side-mode) so one CSS pair enforces the exclusivity,
   and it is applied WITHOUT a repaint: switching tabs must not eat a half-
   typed reply or throw away a scroll position, so the panels stay mounted and
   only their visibility moves.

   Remembered per browser, like the fold it replaces: a negotiator who lives
   in the discussion should land in it on every contract they open. */
const RL_SIDE_KEY = 'hati.v1.rlSideMode';
/* ---- AND NOW THERE IS ONE MODE ----
   The Discussion face is gone (see redlinePanesHtml), so this answers
   "changes" and nothing else. It is NOT reading the stored preference any
   more, deliberately: anybody whose browser holds 'disc' from before would
   otherwise land on a workbench whose CSS hid the card column to make room for
   a panel that is no longer built — an empty right-hand side, on every
   contract, until they cleared their storage. The key is left unread rather
   than deleted so nothing has to migrate. */
function rlSideMode(){ return 'changes'; }
function rlApplySideMode(root, m){
  root.setAttribute('data-rl-side-mode', m);
  /* THE [data-rl-mode] PAINT LOOP WENT WITH THE TOGGLE IT PAINTED (23 Aug
     2026). It set an `on` class and aria-selected on the Changes/Discussion
     buttons; the Discussion column left this page on 10 Aug 2026 and the pair
     went with it, so nothing has emitted that attribute since. The attribute
     ABOVE stays and still does its job: an old root left carrying
     data-rl-side-mode="disc" is corrected rather than left with its card
     column hidden. */
}
/* Setting it can only ever settle on "changes" now, and it still paints —
   an old root left carrying data-rl-side-mode="disc" is corrected rather than
   left with its card column hidden. */
function rlSetSideMode(){
  const m = 'changes';
  try { localStorage.setItem(RL_SIDE_KEY, m); } catch (e) {}
  /* Every mounted workbench root — the page or an embed. */
  document.querySelectorAll('.redline-page').forEach(root => rlApplySideMode(root, m));
  if (window.chatFieldWire) document.querySelectorAll('.redline-page').forEach(r => chatFieldWire(r));
  return m;
}
/* The old fold's name, kept as the compatibility surface: the master design
   calls rlToggleDiscussion by name from an `onclick=` attribute, so the NAME
   is part of the contract this page is held to. There is no discussion panel
   to toggle any longer, so it settles the page on the one mode there is and
   keeps its old return contract: true = discussion is not showing. */
function rlToggleDiscussion(){
  rlSetSideMode();
  return true;
}

/* ---------- THE SPLIT, DRAGGED ----------
   The Doc tab's divider, on this page: the contract takes two thirds by
   default and the handle slides the split either way, remembered per browser.
   Pixels are computed from the persisted fraction on every layout pass, and
   pixel floors win over the fraction on a narrow window — a fraction alone
   would starve one pane. The handle is absolute over the grid gap, so it
   claims no track of its own. */
const RL_FMIN = 0.45, RL_F0 = 2 / 3, RL_FMAX = 0.80, RL_GAP = 14;
const RL_LEFT_MIN = 380, RL_RIGHT_MIN = 300;
/* ---- WHERE THE DIVIDER RESTS BEFORE ANYBODY HAS MOVED IT ----
   (owner-approved render, 22 Aug 2026.) The default was two thirds of the
   grid, which on a 1500px window opens the change column at 394px; the design
   opens it at 460, which is what its cards are drawn to. A WIDTH and not a
   fraction, because 460 is a fact about the CARDS — the id, the state, the Open
   button and a two-line wording preview — and a fraction gives them a different
   number on every monitor.
   THE DIVIDER IS UNTOUCHED in every other respect: the stored fraction still
   wins wherever there is one, the two minimums and the maximum still clamp, the
   drag still writes a fraction, and the double-click still resets to RL_F0. */
const RL_RIGHT_W0 = 460;
const RL_SPLIT_KEY = 'hati.v1.rlLeftFrac';
/* null = nobody has chosen, which is a different answer from "two thirds" and
   is what lets the resting place be a width instead of a fraction. Every caller
   that wants a number falls back to RL_F0 itself. */
function _rlLeftFrac(){
  try { const v = Number(localStorage.getItem(RL_SPLIT_KEY));
    return (v >= RL_FMIN - 0.001 && v <= RL_FMAX + 0.001) ? v : null; }
  catch (e) { return null; }
}
/* WHAT THE CONTRACT COLUMN MUST KEEP. The sheet is typeset to the Doc page's
   720px measure so the two tabs set the contract to the same line length, and
   it floats on the column with a gutter either side. Below this the sheet can
   no longer hold its measure and the two tabs start disagreeing about what a
   line of the contract looks like — which is the one thing the floating sheet
   was introduced to fix.

   The number is the 720px measure plus what the column spends around it — its
   own padding and the scrollbar the canvas carries — measured in Chromium
   rather than derived, because the padding is set in the sheet below and the
   scrollbar width is the platform's. */
const RL_SHEET_COL_MIN = 772;
/* ---- TWO TRACKS AGAIN, AND THE MATHS IS RE-DERIVED RATHER THAN PATCHED ----
   This function used to solve a THREE-track layout: it read the queue's
   declared width off --rl-queue-w, subtracted it and a second gap, and gave the
   queue back width whenever the contract lost its measure. All of that is gone
   with the queue (owner-asked, 12 Aug 2026) — it is an overlay now and occupies
   no track at all.

   IT MATTERS THAT THIS WAS RE-DERIVED. The three-track version produced a real,
   reported bug: the drag measured a distance travelled and divided it by the
   TWO-column available width while the layout divided by the three-column one,
   so one pixel of pointer bought less than one pixel of column and the handle
   fell hundreds of pixels behind the cursor. Leaving a stale queue term in
   either half of that arithmetic is how the same fault comes back. There is one
   geometry now — grid width, one gap, two columns — and both halves ask for it
   the same way (see _rlAvail, which rlWireResizer's pointerFrac also calls). */
const _rlAvail = grid => grid.clientWidth - RL_GAP;
function rlLayoutResizer(host){
  const scope = (host && host.querySelector) ? host : document;
  const grid = scope.querySelector('.redline-page .rl-grid');
  const rez = grid && grid.querySelector('#rl-resizer');
  if (!grid || !rez) return;
  /* ---- THE WORKING AREA RUNS THE PAGE'S OWN WIDTH (owner-reported 22 Aug
     2026: "the tracked changes cards are leaving space on the right hand side
     so move the card to occupy the space") ----
     It used to be capped at RL_LEFT_MAX + gap + RL_RIGHT_W0 and centred, so on
     a wide window the head row and the control bar ran edge to edge and the
     working area under them stopped short. MEASURED before it was touched: the
     change column's right edge sat 58px inside the head's at a 1500 window and
     92px inside it at 1920 — a dead strip beside the cards on every screen.

     THE SURPLUS GOES TO THE CONTRACT, AND THE OWNER CHOSE THAT: the cards keep
     the 460px resting width they were approved at (RL_RIGHT_W0), the doc track
     takes whatever is over, and the SHEET centres inside it at RL_SHEET_MAX.
     So a line of the agreement still never grows past a readable measure — the
     bound moved from the TRACK to the PAGE INSIDE IT, which is what a document
     reader looks like anyway and is why RL_LEFT_MAX no longer clamps the
     split. That REVERSES 16 Aug's "the doc column stops where the sheet does",
     and the fault that decision fixed does not come back: the white it was
     removing is now inside the doc column beside the page rather than outside
     the whole working area beside nothing. RL_LEFT_MAX is no longer a clamp
     on either side of this arithmetic; see its own note.

     The divider still governs: drag it and the cards take as much as the
     reader wants, up to what RL_LEFT_MIN leaves. */
  grid.style.maxWidth = ''; grid.style.marginLeft = ''; grid.style.marginRight = '';
  const avail = _rlAvail(grid);
  /* A chosen fraction wins; with nothing chosen the change column opens at the
     width its cards are drawn to. See RL_RIGHT_W0. */
  const frac = _rlLeftFrac();
  let left = frac == null ? Math.round(avail - RL_RIGHT_W0) : Math.round(frac * avail);
  if (avail >= RL_LEFT_MIN + RL_RIGHT_MIN)
    left = Math.min(Math.max(left, RL_LEFT_MIN), avail - RL_RIGHT_MIN);
  const s = { avail, left };
  /* Unmeasured (a stage with no layout) or stacked to one column: the CSS
     fallback columns hold, and writing 0px here would break them. */
  if (s.avail < 160) return;
  grid.style.gridTemplateColumns = s.left + 'px minmax(0,1fr)';
  rez.style.left = s.left + 'px';
  /* ---- AND IT SAYS WHEN IT WILL NOT GO FURTHER ----
     The split has real limits — the contract keeps a readable measure, the
     cards keep a readable width — and reaching one is legitimate. Reaching it
     in SILENCE is not: the handle simply stopped following the cursor with
     nothing on screen to say why, so the control read as broken exactly when
     somebody was pushing hardest at it. A splitter at its limit should look
     like one. */
  const atMin = s.left <= RL_LEFT_MIN,
    atMax = s.left >= s.avail - RL_RIGHT_MIN;
  if (atMin || atMax) rez.setAttribute('data-rl-at-limit', atMin ? 'min' : 'max');
  else rez.removeAttribute('data-rl-at-limit');
  /* THE CONTRACT FOLLOWS THE DIVIDER IN THE SAME PASS. The observer below
     would catch it a frame later; doing it here is what makes the wording
     grow and shrink UNDER the cursor rather than after it. */
  rlApplyDocZoom(scope);
}
/* ---------- THE CONTRACT TEXT SIZE, STEPPED ----------
   A⁻ / readout / A⁺ on the sub-header strip. It drives --rl-doc-type — the
   one token the whole canvas is set from (clause bodies, headings, recital) —
   so a step moves the entire document together, and it is remembered per
   browser so the choice survives a repaint, a reload and the trip through the
   Docs tab (which sizes its own sheet from the same reading, one choice on
   both tabs).

   THE FLOOR IS 8, NOT 11 (owner-asked, 13 Aug 2026: "the fonts should be able
   to go low all the way to 8. Currently the smallest font is 11"). 11 was set
   as "below this a contract stops being readable" — a judgement about a
   reader, made for them. Skimming a long agreement at a glance is a real way
   to work, and the ceiling of 20 is still there for the opposite need.

   WHAT 8 MEANS ON SCREEN, because the readout is not a promise about pixels
   and never was: the sheet's type is multiplied by the width-fit zoom, so at a
   column twice the page's width the reader sees 16. That was equally true of
   11 and of 15; the arithmetic is unchanged and only the floor moved. */
const RL_TYPE_MIN = 8, RL_TYPE_MAX = 20, RL_TYPE_DEF = 15;
const RL_TYPE_KEY = 'hati.v1.rlDocType';
function rlDocType(){
  try { const v = Number(localStorage.getItem(RL_TYPE_KEY));
    return (v >= RL_TYPE_MIN && v <= RL_TYPE_MAX) ? v : RL_TYPE_DEF; }
  catch (e) { return RL_TYPE_DEF; }
}
/* The same preference as a plain RATIO against the workbench's own 15px base.
   One reading, because three screens with three different bases share one
   setting and what travels between them is the proportion, never the number.
   Returned as a string so it can be written straight into a style attribute. */
function rlDocScale(px){
  const v = Number(px) || rlDocType();
  return (v / RL_TYPE_DEF).toFixed(3);
}
function rlSetDocType(px){
  const v = Math.max(RL_TYPE_MIN, Math.min(RL_TYPE_MAX, Math.round(Number(px) || RL_TYPE_DEF)));
  try { localStorage.setItem(RL_TYPE_KEY, String(v)); } catch (e) {}
  /* Applied live to every mounted workbench root — no repaint, so scroll
     positions and half-typed replies survive a resize like they survive a
     mode switch — and the readouts and bound-stops follow the same value. */
  document.querySelectorAll('.redline-page').forEach(root => {
    root.style.setProperty('--rl-doc-type', v + 'px');
    /* And the same choice as a RATIO, for the parts of the sheet that are not
       body text — the title, the kicker, the subtitle, the parties at the
       foot. They used to follow the zoom and now follow this. */
    root.style.setProperty('--doc-scale', rlDocScale(v));
  });
  /* The line above is now the whole of it on this page — the sheet's type IS
     the preference again (13 Aug 2026). The re-fit still runs, because a
     smaller sheet is a shorter one and the pane's scrollbar can appear or go,
     which changes the room the fit is measured against. */
  rlApplyDocZoom(document);
  document.querySelectorAll('.rl-type-out').forEach(el => { el.textContent = v + 'px'; });
  document.querySelectorAll('[data-rl-type]').forEach(b => {
    const d = Number(b.getAttribute('data-rl-type'));
    b.disabled = (d < 0 && v <= RL_TYPE_MIN) || (d > 0 && v >= RL_TYPE_MAX);
  });
  /* The Doc tab and the Design step read the same preference through their own
     zoom (each multiplies by rlDocType()/default), so stepping here re-sizes
     the contract on all three screens. */
  if (window.applyDocZoom) applyDocZoom();
  if (window.dsApplyZoom) dsApplyZoom();
  return v;
}
/* ---- FIT THE SHEET TO THE COLUMN — REVERSED IN PLACE, 22 Aug 2026 ----
   This page used to do what the Document tab does: take a fixed 660px page and
   MAGNIFY it to fill whatever column the divider left it, up to 2×. The owner's
   approved render reverses that for this screen only — the sheet is fluid and
   the words hold their size — and the reasoning is worth keeping because it is
   the reason the two screens may now differ.

   THE ARGUMENT FOR MAGNIFYING was that the contract should visibly grow as you
   give it room, which is what the Document tab does and what was asked for on
   13 Aug. THE ARGUMENT AGAINST is that on THIS page the divider is a working
   control you move all day, and a control that re-sizes the words every time
   you drag it makes the reader's own text-size setting only half the answer.
   The sheet growing WIDER says the same thing without moving the type.

   RL_PAGE_W and RL_ZOOM_MAX survive as EXPORTS and nothing on this page reads
   them any more; the Document tab's own applyDocZoom keeps its own copy of the
   idea, so removing them would break a name other files can still ask for. */
const RL_PAGE_W = 660;
const RL_ZOOM_MAX = 2.0;   // the Document tab's own ceiling: past this it stops being a contract
/* ---- THE SHEET STOPS; THE COLUMN NO LONGER HAS TO ----
   RL_SHEET_MAX is the .rl-paper rule's own cap: a line of an agreement past
   860px stops being readable, so the page is that wide and CENTRES in whatever
   column it is given.
   RL_LEFT_MAX WAS the doc column's ceiling as well — 16 Aug 2026, to stop a
   wide monitor putting dead white either side of the working area. It stopped
   clamping the split on 22 Aug 2026, when the owner reported the other half of
   that same trade: with the working area bounded, the CHANGE COLUMN stopped
   short of the page and left a dead strip beside the cards (see
   rlLayoutResizer). The surplus goes to the doc track now, where the sheet's
   own cap turns it into margin beside a centred page — which is what a
   document reader looks like — instead of margin beside nothing.
   THE NAME IS KEPT rather than deleted: it is the one place this measurement
   is written down, negotiation-css.js's own note points at it, and
   paper-grows-verify reads it as the sheet's readable measure plus its
   gutters. The 40 covers the pane's padding and a classic scrollbar. */
const RL_SHEET_MAX = 860;
const RL_LEFT_MAX = RL_SHEET_MAX + 40;   // the sheet's measure + gutters; no longer clamps the split
/* ---- THE CONTRACT IS NO LONGER MAGNIFIED (owner-approved render, 22 Aug 2026)
   ----
   This used to fit a fixed 660px page into whatever column it was given, up to
   2×, so the WORDS changed size as the divider moved and a reader's chosen
   text size was only half of what decided them. The design draws the sheet
   fluid at a steady size: the paper takes its column (capped at a readable
   measure), and --rl-doc-type is the only thing that changes the type.

   IT IS PINNED RATHER THAN DELETED, and that is deliberate. `zoom` is written
   on .rl-zoom by the STYLESHEET now (zoom:1); this function stays as the one
   place that would set it otherwise, so the four callers that ask the layout to
   re-fit — the divider's own drag, the pane observer, the type stepper and the
   focus toggle — keep calling one named thing rather than each growing a
   private opinion about what the sheet should do. Deleting it would scatter
   that decision across four sites the day somebody wants a fit back.

   THE DOCUMENT TAB IS UNTOUCHED: applyDocZoom is its own function in
   js/views/contract.js and still magnifies its own sheet. This is the
   negotiation page only. */
function rlApplyDocZoom(host){
  const scope = (host && host.querySelectorAll) ? host : document;
  scope.querySelectorAll('.redline-page .rl-zoom').forEach(wrap => {
    wrap.style.setProperty('--rl-zoom', '1');
  });
}
/* ---- AND IT FOLLOWS THE COLUMN WHATEVER MOVED IT ----
   The pane's width changes for at least five reasons: the divider is dragged,
   the window is resized, the sidebar rail is collapsed, the layout stacks
   below 1023px, and the page repaints. Hunting each cause is how one of them
   gets missed, so the pane is OBSERVED instead. No feedback loop: the zoom
   changes the wrapper's size, never the pane's.

   Re-attached on every paint, because renderRedline rebuilds the pane — the
   same rule rlObserveTabRow follows a few hundred lines down. */
function rlObserveDocPane(host){
  if (typeof ResizeObserver !== 'function') return;
  const scope = (host && host.querySelectorAll) ? host : document;
  scope.querySelectorAll('.redline-page .rl-zoom').forEach(wrap => {
    const pane = wrap.parentElement;
    if (!pane || pane._rlZoomObserved) return;
    pane._rlZoomObserved = true;
    try { new ResizeObserver(() => rlApplyDocZoom(document)).observe(pane); } catch (_) {}
  });
}
/* The stepper's markup — one builder, so the Redline strip and the Doc tab's
   toolbar render the identical control. */
function rlTypeStepHtml(){
  const v = rlDocType();
  return `<div class="rl-type-step" role="group" aria-label="${i18t('ng_contract_text_size')}">
    <button type="button" data-rl-type="-1" title="${i18t('ng_smaller_text')}"${v <= RL_TYPE_MIN ? ' disabled' : ''}>A&#8315;</button>
    <span class="rl-type-out">${v}px</span>
    <button type="button" data-rl-type="1" title="${i18t('ng_larger_text')}"${v >= RL_TYPE_MAX ? ' disabled' : ''}>A&#8314;</button>
  </div>`;
}
function rlWireTypeStep(host){
  const scope = (host && host.querySelectorAll) ? host : document;
  scope.querySelectorAll('[data-rl-type]').forEach(b => {
    if (b.dataset.rlTypeWired) return;
    b.dataset.rlTypeWired = '1';
    b.addEventListener('click', () => rlSetDocType(rlDocType() + Number(b.getAttribute('data-rl-type'))));
  });
}

function rlWireResizer(host){
  const scope = (host && host.querySelector) ? host : document;
  const grid = scope.querySelector('.redline-page .rl-grid');
  const rez = grid && grid.querySelector('#rl-resizer');
  if (!grid || !rez) return;
  rlLayoutResizer(scope);
  const clamp = f => Math.max(RL_FMIN, Math.min(RL_FMAX, f));
  /* ---- THE HANDLE FOLLOWS THE POINTER, IN THE LAYOUT'S OWN GEOMETRY ----

     This measured the drag as a DISTANCE TRAVELLED and divided it by
     `clientWidth - RL_GAP`, which is the two-column available width. The layout
     divides by `clientWidth - RL_GAP*2 - queue`. With the queue open those
     differ by over 300px, so one pixel of pointer bought less than one pixel of
     column and the handle fell behind the cursor from the first move.

     Travelled-distance also creates a DEAD BAND at the limits. Drag past the
     end of the range and the stored fraction pins at RL_FMIN while the pointer
     keeps going; drag back and nothing happens until the pointer has returned
     the whole overshoot — 279px of nothing, in the measured case. The control
     reads as broken precisely when somebody is pushing it hardest.

     Both go away by asking where the pointer IS rather than how far it has
     come: the fraction is derived from the pointer's position inside the grid,
     in the same geometry rlLayoutResizer uses to place the columns. The grab
     offset is kept so taking hold of the handle anywhere along its width does
     not jump it under the cursor. */
  let grabDx = 0;
  const pointerFrac = x => {
    const r = grid.getBoundingClientRect();
    /* THE SAME GEOMETRY THE LAYOUT USES, asked for through the same function.
       That is the whole fix for the handle that fell behind the cursor: the two
       halves cannot describe different layouts if there is one description. */
    const avail = Math.max(1, _rlAvail(grid));
    const left = (x + grabDx) - r.left;
    return clamp(left / avail);
  };
  const onMove = e => {
    const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    try { localStorage.setItem(RL_SPLIT_KEY, String(pointerFrac(x))); } catch (e2) {}
    rlLayoutResizer(scope);
  };
  const onUp = () => { delete rez.dataset.drag;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp); };
  rez.addEventListener('pointerdown', e => { e.preventDefault();
    rez.dataset.drag = '1';
    /* Where the handle's own centre sits relative to the grab, so the boundary
       keeps its offset under the cursor for the whole drag. */
    const hb = rez.getBoundingClientRect();
    grabDx = (hb.left + hb.width / 2) - e.clientX;
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp); });
  /* ---- DOUBLE-CLICK PUTS THE DEFAULT BACK, AND THE DEFAULT IS NO LONGER A
     FRACTION ---- It wrote RL_F0 into the store, which was the default while
     the default WAS two thirds. The resting split is a width now (RL_RIGHT_W0),
     and "reset" has to mean the same thing as "nobody has chosen" or the
     control puts back a split the page never opens at. Clearing the key is
     that, exactly. */
  rez.addEventListener('dblclick', () => {
    try { localStorage.removeItem(RL_SPLIT_KEY); } catch (e2) {}
    rlLayoutResizer(scope); });
  /* ---- AND THE ARROWS MOVE IT ---- (25 Aug 2026, ported from ktWireSplit)
     One step is 2% of the grid — a few pixels, enough to be useful and small
     enough not to jump. Home puts the default back, which is what the
     double-click does, so the keyboard has every act the pointer has. It
     writes the SAME store the drag writes and re-runs the SAME layout, so
     there is no second opinion about where the split is. */
  rez.addEventListener('keydown', e => {
    if (e.key === 'Home' || e.key === 'Enter'){
      e.preventDefault();
      try { localStorage.removeItem(RL_SPLIT_KEY); } catch (e2) {}
      rlLayoutResizer(scope); return;
    }
    const step = e.key === 'ArrowLeft' ? -0.02 : e.key === 'ArrowRight' ? 0.02 : 0;
    if (!step) return;
    e.preventDefault();
    /* Read the split the page is ACTUALLY at, never the stored fraction: with
       nothing stored _rlLeftFrac answers null on purpose ("nobody has chosen"
       is a different answer from "two thirds"), and the resting split is a
       width. The grid's own tracks are where the truth is. */
    const avail = _rlAvail(grid);
    const doc = grid.querySelector('.nego-pane.working') || grid.firstElementChild;
    const left = doc ? doc.getBoundingClientRect().width : 0;
    const cur = (avail > 0 && left > 0) ? clamp(left / avail) : RL_F0;
    try { localStorage.setItem(RL_SPLIT_KEY, String(clamp(cur + step))); } catch (e2) {}
    rlLayoutResizer(scope);
  });
  /* ---- AND THE SPLIT FOLLOWS THE GRID, WHATEVER MOVED IT ----
     The resting split is a WIDTH now (the change column opens at RL_RIGHT_W0),
     and a width has to be recomputed from the grid's own size — where a
     fraction survived a bad first measurement, this does not. Measured on the
     counterparty's mount: the resizer ran while that page was still settling,
     read a grid 32px narrower than it ended up, and left their change column
     32px wider than the owner's for the life of the page. The zoom used to
     absorb that; nothing does now.
     A ResizeObserver on the GRID is the same answer rlObserveTabRow gives for
     the same class of problem — ask the element rather than hunting the five
     causes. No feedback loop: this writes the grid's TRACKS, never its width. */
  if (typeof ResizeObserver === 'function' && !grid._rlGridObserved){
    grid._rlGridObserved = true;
    let last = -1;
    try {
      new ResizeObserver(() => {
        const w = Math.round(grid.clientWidth);
        if (w === last) return;
        last = w;
        rlLayoutResizer(scope);
      }).observe(grid);
    } catch (_) {}
  }
  if (typeof window !== 'undefined' && !window._rlResizeBound){
    window._rlResizeBound = true;
    window.addEventListener('resize', () => rlLayoutResizer(document));
  }
}

/* ---------- THE DESIGN'S OWN MARKUP ----------
   Not the engine's HTML re-skinned. These write the design's document and its
   change cards directly, and carry the engine's data-nego-* hooks so
   wireNegotiationTab binds to them unchanged: data-nego-edit opens the propose
   dialog, data-nego-accept / data-nego-reject decide, data-nego-card focuses.
   The DATA is the engine's throughout — negoClauseList, negoChanges, the
   fingerprints and the ops diff — so nothing here invents a change, a decision
   or an id. */
const RL_REGION = { SE: 'Sweden (EU/GDPR)', KE: 'Kenya (KICA/ODPC)' };
function redlineDocHtml(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const clauses = (typeof negoClauseList === 'function') ? negoClauseList(c) : [];
  /* Through the wall. A clause whose only change is the other side's unsent
     draft renders as its untouched baseline — no marks, no ask tag, nothing
     that says "something exists here that you cannot see".

     opts.hiddenIds overrides the computed wall, and the counterparty's page
     passes [] deliberately: its copy is built from the share payload, which
     the TRANSPORT has already walled (nothing unsent is ever in it), and its
     rebuilt turn stamp cannot be trusted to re-derive the same answer. The
     computed wall is for the side holding the full live record — the owner's
     preview toggle. */
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  const live = (typeof negoChanges === 'function')
    ? negoChanges(c).filter(x => x.status !== 'superseded' && !hidden.has(x.id)) : [];
  const changes = live.filter(x => x.changeType !== 'insertClause');
  /* A LIST PER CLAUSE, NOT ONE (owner-approved 15 Aug 2026). This map used to
     hold a single change — last write wins — so a clause carrying our ask AND
     their counter drew one tag and silently dropped the other, the dropped
     card had no clause to jump to, and a decided mark vanished the moment a
     newer change landed. The round queue has always kept the list
     (data-rl-queue-ids); the paper now tells the same truth. The funnel's
     supersede-on-counter rule makes two LIVE changes rare going forward, but
     contracts written before it hold rivals, and a decided change beside a
     pending one is ordinary. Sorted by seq so the last entry is the newest —
     exactly the change the old map kept, so the drawn WORDING does not move. */
  const byClause = new Map();
  for (const ch of changes.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0))){
    const arr = byClause.get(ch.clauseId) || [];
    arr.push(ch);
    byClause.set(ch.clauseId, arr);
  }
  /* ---- A CLAUSE SOMEBODY PROPOSED TO ADD IS PART OF THE DOCUMENT ----
     This canvas used to drop every insertClause on the floor. That was harmless
     for exactly as long as nothing here could FILE one: the passage menu
     offered rephrase, shorten and tag, and none of them adds wording. Edit with
     Copilot's placements opened that door, and the clause went straight through
     it into a document that would not draw it — filed correctly, fingerprinted,
     carded in the column beside, and absent from the contract the reader was
     reading. It stayed absent after the other side ACCEPTED it, because this
     canvas is built from the round baseline and an accepted insert only reaches
     that when the round turns. So a lawyer added a clause, was told it was
     filed, scrolled the contract, could not find it, and had every reason to
     add it again.

     Drawn WHERE IT WAS PROPOSED — after the clause it names — which is the same
     rule, and deliberately the same reading of afterClauseId, that the room has
     always used (see insertsAfter in negoDocHtml). An insert whose anchor has
     gone falls to the end and only then, because the end is the one place that
     is always available and never a guess. */
  const insertsAfter = new Map();
  const orphanInserts = [];
  for (const ch of live){
    if (ch.changeType !== 'insertClause') continue;
    const anchor = ch.afterClauseId && clauses.some(cl => cl.clauseId === ch.afterClauseId)
      ? ch.afterClauseId : null;
    if (anchor){
      if (!insertsAfter.has(anchor)) insertsAfter.set(anchor, []);
      insertsAfter.get(anchor).push(ch);
    } else orphanInserts.push(ch);
  }
  const tmpl = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name) || 'Contract';
  const region = RL_REGION[(window.state && state.region) || 'KE'] || RL_REGION.KE;
  const editable = !opts.readonly && opts.canEdit !== false;
  /* ---- THE CLAUSE PANEL'S BODIES ARE BUILT HERE AND RENDERED THERE ----
     A sink, not a second reading. Everything the panel needs — which changes
     are on which clause, which of them the wall hides, whether this seat has
     hands — has already been worked out above, and asking it twice is how two
     surfaces come to disagree about one clause. redlinePanesHtml passes an
     array, gets the bodies back in it, and renders them into #rl-cp-body.

     No sink means no panel on this mount (the Word export renders this same
     canvas), and the Edit pill stands down with it: a door is drawn only where
     the room behind it exists. */
  const hasPanel = Array.isArray(opts.cpSink);
  /* ---- A DRAFT THAT IS NOT ON THE RECORD YET (owner-asked 26 Aug 2026) ----
     Edit with Copilot became this paper, and its whole point is the opposite of
     what this canvas does: you type, and you see what your typing WOULD do,
     before anything is filed. Every mark drawn below belongs to a change that
     has been filed, and this file says why in so many words — a mark drawn
     from a fresh diff would not be the mark the other side verified.

     So the seam is deliberately narrow and it is a BODY, not a diff: the caller
     hands over finished markup for exactly ONE clause and this canvas draws it
     where that clause goes. Nothing here computes it, nothing here stores it,
     and it dies with the page.

     FOUR PROPERTIES, each of them true by construction rather than by care:
       · ONE clause. `live.clauseId` is a single id; every other clause on the
         page is drawn from the record exactly as it always was.
       · NOTHING IS RE-DIFFED ON A FILED CHANGE. A filed change's marks still
         come from its own stored ops, below, untouched.
       · IT NEVER PERSISTS. This is a string on its way to innerHTML.
       · THE COUNTERPARTY CANNOT REACH IT. Their page has no editor here and
         never passes it; the refusal is in rlOpenClauseEditor and is asserted
         rather than assumed. */
  const liveId = (opts.live && opts.live.clauseId != null) ? String(opts.live.clauseId) : null;
  const liveHtml = liveId ? String(opts.live.html == null ? '' : opts.live.html) : '';
  /* The clause's NAME is part of the draft too (owner-asked 28 Aug 2026), and
     it comes through the same seam and under the same four properties: one
     clause, nothing re-diffed, never persisted, and the counterparty's page
     neither passes it nor can reach the page that does. Absent, the canvas
     draws the heading it always drew. */
  const liveHead = (liveId && opts.live.head != null) ? String(opts.live.head) : null;
  /* ONE PENCIL FOR THE WHOLE CANVAS, so the four clause branches cannot come to
     disagree about which door it opens. */
  /* ---- AND ON OUR SEAT IT OPENS THE EDITOR (owner-ruled 29 Aug 2026) ----
     *"the negotiation page stays as it is … when I click the edit symbol, it
     takes me to the edit with copilot page to begin my edit there."* The
     pencil used to open the clause panel, which then offered two writing
     buttons; those become the pencil's own job and two presses become one.
     Nothing about this page's layout, cards or columns moves.

     THE DESTINATION IS CHOSEN AT DRAW TIME, NOT BY FALLING THROUGH A REFUSAL,
     and that is the difference between this and a dead press: where the editor
     cannot take the clause the pencil never claims it will.

     TWO CASES KEEP THE PANEL, and each is a capability rather than a taste:
      · THEIR SEAT. rlOpenClauseEditor refuses a counterparty outright, and the
        panel is the ONLY way their page proposes wording. Sending their pencil
        to a page that will turn them away would take that away entirely.
      · A WINDOW UNDER 1024px, which clauseEditorFits refuses because two
        columns need room to be two columns. The panel works at every width.
      · A STAGE THAT DOES NOT LOAD THE EDITOR AT ALL. The module is asked for
        BY NAME rather than only asked whether the width suits it: the fits
        check falling through as true on a page with no editor on it is a
        pencil claiming a page nothing can open, which is the dead press this
        whole draw-time decision exists to prevent. */
  const editorTakesIt = rlEditorTakesIt(side);
  const pillFor = cl => rlClauseEditPillHtml(cl, { editable, hasPanel, pill: opts.pill,
    toEditor: editorTakesIt && !opts.pill });
  const cpPush = (cl, chs, cpOpts) => {
    if (!hasPanel) return '';
    /* The notes options ride through because the panel now renders each
       change's thread AND its reply box — the engine-wired original, moved
       here from the retired pop-out. See the note inside rlClausePanelBodyHtml. */
    opts.cpSink.push(rlClausePanelBodyHtml(c, cl, chs, side, { editable, noAi: opts.noAi,
      messages: opts.messages, org: opts.org, readonly: opts.readonly,
      canComment: opts.canComment, ...(cpOpts || {}) }));
    return '';
  };
  /* ---- THE CLAUSE TOOLBAR IS GONE FROM THE PAPER (owner-asked 16 Aug 2026:
     "there should be no ability to make edits on the contract itself ... All
     edits will happen on the side panel.") ----
     It was two hover pills at the clause's foot — ✨ Copilot and ✎ Direct
     Edit — and each had its own careful history (the Copilot came BACK to the
     clause on 04 Aug 2026 because a text selection is an invisible
     affordance). Both retired together, because the discoverability problem
     they solved is solved better by the door that is ALWAYS drawn: the green
     Edit pill at the clause's top right, which opens the panel where the ＋
     and the highlight-Copilot both live. Two edit doors on one clause — one
     hover-only at the foot, one permanent at the head — were two answers to
     one question, and the paper is for reading.

     WHAT DELIBERATELY STAYS: the SELECTION route on the paper (highlight a
     passage → rlSelMenu), because a highlight is a statement of scope, not a
     button; and the ROOM's own nego-tool row in negoDocHtml, a different
     surface with no panel to send anybody to. The engine's
     [data-nego-edit] handler also stays: the panel's ＋ (data-rl-cp-edit)
     shares it, and the room still emits the attribute.

     rl-tools / rl-tool / rl-tool-ai / rl-tool-edit are STALE on this canvas —
     flag any mention. Their rules left the sheet with them. */
  /* ---- THE HEADING THE DOCUMENT ACTUALLY CARRIES ----
     This used to be rebuilt as `${num}. ${title}` from the two halves the
     clause parser split the heading into, and rebuilding is where the document
     stopped being the document. "1.1 Definitions" came back as "1.1.
     Definitions" — a full stop nobody typed — and a clause headed "8.2(a)"
     came back as "8.2. (a)". A contract is cited by those strings. Printing a
     number the uploaded file does not contain is a renumbering, however small,
     and it is invisible to whoever uploaded it because the wording underneath
     is right.

     So the literal heading is used, exactly as the file carried it. num/title
     stay on the record for the label the index and the cards print, which is a
     summary and may be reformatted; this is the document, which may not.
     A headingless clause — the fallback for an upload that arrived as a wall of
     paragraphs — gets no heading rather than an invented "Clause". */
  /* ---- AND A HEADING CAN BE PROPOSED ON, LIKE ANY OTHER WORDING
     (owner-asked 28 Aug 2026) ----
     The clause's OWN changes are read here rather than passed in by each of
     the four call sites below, so the four cannot come to disagree about
     whether a heading moved — and so the heading and the body under it always
     tell the same change's story: both ask negoLeadChange, which is the one
     reading of which change a clause's paper draws.

     IT HONOURS THE READING, exactly as the body does. Under "As agreed" the
     clause keeps the heading it has; under "With changes" it wears the
     proposed one; only the redlined reading shows both. A SETTLED rename keeps
     its marks in every reading for the reason the body's own note gives — the
     marks are the record of what was decided, and a clean reading is about the
     questions still open rather than about erasing the answers.

     A clause with no heading of its own still draws one where a change
     proposes one: there is nothing to strike, and the new name is the whole of
     what is being asked for. */
  const heading = cl => {
    const raw = String(cl.headingText || '').trim();
    const lead = (() => {
      const chs = byClause.get(cl.clauseId) || [];
      return chs.length ? negoLeadChange(c, cl, chs) : null;
    })();
    const ask = negoHeadingAsk(cl, lead);
    if (!ask) return raw ? `<h4 class="rl-clause-h">${_ne(raw)}</h4>` : '';
    const settled = lead.status !== 'pending' || lead.withdrawn;
    const which = settled ? 'marks' : rlReadSideOf(lead, readMode);
    if (which === 'del') return raw ? `<h4 class="rl-clause-h">${_ne(ask.from)}</h4>` : '';
    if (which === 'ins') return `<h4 class="rl-clause-h">${_ne(ask.to)}</h4>`;
    return `<h4 class="rl-clause-h">${ask.from
      ? `<span class="nego-del">${_ne(ask.from)}</span> ` : ''}<span class="nego-ins">${_ne(ask.to)}</span></h4>`;
  };
  /* ---- THE BODY, WITH ITS SHAPE ON ----
     negoRichBody renders the clause's own sanitised markup — paragraphs, bold,
     lists, indents, sub-clause line breaks — the same way the contract tab and
     the room draw it. What was here before was `_ne(cl.text)` inside one <p>:
     the text projection, which flattens every one of those into a single run.
     A schedule read as a paragraph and a lettered sub-clause list read as a
     sentence, on the one page where a reader is deciding what the wording says.

     Under redline it is redlineOpsBlocksHtml, not redlineOpsHtml, for exactly
     the same reason — the block renderer regroups the STORED ops at their
     newlines without rewriting any of them, so a clause under change keeps its
     numbering and its indents instead of collapsing into one line.

     .nego-body is not decoration either: wireNegotiationTab's Direct Edit
     replaces `.nego-body` (falling back to the first `p`), so without this
     wrapper a multi-paragraph clause would have had only its first paragraph
     swapped for the editor and the rest stranded outside what got saved. */
  const richBody = cl => `<div class="nego-body">${rlHangRichHtml(
    (typeof negoRichBody === 'function') ? negoRichBody(cl) : `<p>${_ne(cl.text || '')}</p>`)}</div>`;
  /* How this page is being read — see rlReadMode. Resolved once for the whole
     document so every clause on it answers the same question. */
  const readMode = rlReadMode();
  const redlineBody = ch => {
    /* A CLEAN READING IS A CLEAN CLAUSE. Under "As agreed" or "With changes"
       the marks come off and the clause reads as ordinary wording — one side of
       the ops, chosen by rlReadSideOf. Nothing about the record moves. */
    const which = rlReadSideOf(ch, readMode);
    /* ---- WHO LAST TOUCHED THIS EDIT ----
       Carried on every marked span in the clause as a title, so hovering a
       struck or inserted phrase says whose hand it was. The record already
       knows: `author` is the hand on the live revision — negoFileChange
       overwrites it in place when the same person revises their own ask, and
       stacks a new change when a different one does — so it is the LAST
       updater by construction, not the first. */
    const who = String((ch && (ch.author || ch.by)) || '').trim();
    const when = (ch && (ch.updatedAt || ch.createdAt)) ? negoWhen(ch.updatedAt || ch.createdAt) : '';
    const tip = who ? `Last updated by ${who}${when ? ` at ${when}` : ''}` : '';
    /* A FORMATTING-ONLY ask has all-keep ops — drawn from them this clause
       would show the baseline with no marks, a proposal invisible on the page
       it is proposed on. The proposed rich body is the redline: the new
       formatting, visible, and the ask tag says what kind of ask it is. Same
       rule as negoDocHtml's fmtBody — both renderers, one behaviour, or the
       portal and the room disagree about what is being asked. */
    /* A FORMATTING-ONLY ASK UNDER A CLEAN READING. "As agreed" is the clause as
       it stands, which is the ordinary rich body; "With changes" is the
       proposed formatting, drawn plainly. Only the redlined reading needs the
       chip beside it to say the words did not move. */
    if (ch.formattingOnly && which === 'del') return null;
    if (ch.formattingOnly && ch.bodyHtml && window.sanitizeRich)
      return `<div class="nego-body${which === 'marks' ? ' nego-fmt-only' : ''}"${tip ? ` title="${_nea(tip)}"` : ''}>${sanitizeRich(ch.bodyHtml)}</div>`;
    /* ---- THE WORDS DID NOT MOVE, SO THE CLAUSE READS AS THE DOCUMENT ----
       A heading rename files all-keep ops, exactly as a formatting-only ask
       does, and drawn from those ops the clause would come back as its TEXT
       PROJECTION — one flat run where the document has a numbered list, a
       schedule or an indented sub-paragraph. The wording nobody touched would
       visibly lose its shape the moment somebody proposed a new name for it.

       So the clause is drawn as itself and the heading above carries the mark.
       Guarded on the ops actually BEING a list: a change that arrived with no
       ops at all (an older payload) keeps the fallback it has always had. */
    if (Array.isArray(ch.ops) && ch.ops.length && !ch.formattingOnly && !negoWordsMoved(ch)) return null;
    const ops = rlOpsAsSide(ch.ops, which);
    if (window.redlineOpsBlocksHtml && Array.isArray(ops) && ops.length)
      return `<div class="nego-body">${redlineOpsBlocksHtml(ops, { title: tip })}</div>`;
    if (window.redlineOpsHtml && ops)
      return `<div class="nego-body"><p>${redlineOpsHtml(ops, { title: tip })}</p></div>`;
    return `<div class="nego-body"><p>${_ne(which === 'del' ? (ch.oldText || '') : (ch.proposedText || ch.newText || ''))}</p></div>`;
  };
  /* The added clause itself. Marked as an addition and never as settled text:
     until it is accepted it is a PROPOSAL, and a reader deciding whether to
     take it must be able to see that at a glance rather than infer it from a
     column. Rendered through the same ops path as every other redline so the
     wording carries the insertion marks the rest of the document uses. */
  const insertBlock = ch => {
    /* A clause somebody PROPOSED can be the one being typed in too — the funnel
       folds a revision into the same ask rather than stacking a rival — so the
       override has to reach here as well or the editor would draw the filed
       wording under a reader who is changing it. */
    if (liveId && String(ch.clauseId) === liveId){
      const liveLabel = String(ch.headingText || '').trim();
      return `<section class="nego-clause rl-clause is-changed rl-clause-new rl-clause-live" data-clause="${_ne(ch.clauseId)}" data-nego-working="${_ne(ch.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
        <div class="rl-clause-top">
          ${liveHead != null ? liveHead
            : liveLabel ? `<h4 class="rl-clause-h">${_ne(liveLabel)}</h4>` : ''}
          ${pillFor({ clauseId: ch.clauseId })}
        </div>
        ${liveHtml}
      </section>`;
    }
    const theirs = ch.authorSide !== side;
    /* A CLAUSE NOBODY HAS AGREED TO IS NOT IN THE AGREED READING. Under "As
       agreed" a live insertion simply is not there — that is what "the wording
       as it stands" means — and under "With changes" it is there as ordinary
       text rather than as a marked-up proposal.

       ONLY WHILE IT IS LIVE. A settled insertion keeps the treatment it has
       always had, in every reading: an accepted one is drawn, a REFUSED one is
       struck through rather than dropped, because a gap in a document cannot
       be told from a clause nobody ever proposed. Reading the reading mode
       without asking that question first is exactly how a rejected clause
       vanished off the page — f96 caught it. */
    const settled = ch.status !== 'pending' || ch.withdrawn;
    const which = settled ? 'marks' : rlReadSideOf(ch, readMode);
    if (which === 'del') return '';
    if (which === 'ins'){
      const cleanText = String(ch.proposedText || ch.newText || '');
      const cleanLabel = String(ch.headingText || '').trim();
      return `<section class="nego-clause rl-clause" data-clause="${_ne(ch.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
        ${cleanLabel ? `<h4 class="rl-clause-h">${_ne(cleanLabel)}</h4>` : ''}
        <div class="nego-body"><p>${_ne(cleanText)}</p></div>
      </section>`;
    }
    const st = ch.status === 'accepted' ? ' &middot; &#10003; adopted'
      : ch.status === 'rejected' ? ' &middot; &#10007; refused' : '';
    const tagTip = ch.status === 'rejected' && ch.reply ? ` title="${_nea(ch.reply)}"` : '';
    const label = String(ch.headingText || '').trim();
    const text = String(ch.proposedText || ch.newText || '');
    /* A rejected insertion is struck rather than dropped: the clause is not in
       the agreement and the argument about it is on the record, and a reader
       scrolling past a gap cannot tell those apart. */
    const inner = window.redlineOpsBlocksHtml
      ? redlineOpsBlocksHtml([{ op: ch.status === 'rejected' ? 'del' : 'ins', text }])
      : `<p><span class="${ch.status === 'rejected' ? 'nego-del' : 'nego-ins'}">${_ne(text)}</span></p>`;
    /* ---- A CLAUSE YOU PROPOSED IS EDITABLE LIKE ANY OTHER (owner-asked
       25 Aug 2026, off a screenshot of a payment-terms clause added from the
       playbook: "standard clauses added should be editable as well") ----
       Every other clause on this paper carries the pencil; this one did not,
       because the panel behind it is built per CLAUSE and an insertClause ask
       has no clause in the baseline to build from. So the ask supplies one:
       its own heading and its own proposed wording, which is exactly what the
       panel would show. negoReviseInsert is what the editor files through, and
       the funnel folds it into this same ask rather than stacking a rival.

       OUR OWN, AND ONLY WHILE IT IS LIVE. Their proposal is answered, not
       edited — the mirror rule this page keeps everywhere — and a settled one
       is a record. Both fall through to the plain block, so nothing that used
       to draw stops drawing. */
    const me = side === 'counterparty' ? 'counterparty' : 'owner';
    const revisable = !settled && ch.authorSide === me && editable;
    const asClause = revisable ? { clauseId: ch.clauseId, headingText: label,
      text, bodyHtml: ch.bodyHtml || `<p>${_ne(text)}</p>` } : null;
    return `<section class="nego-clause rl-clause is-changed rl-clause-new" data-clause="${_ne(ch.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
      <div class="rl-clause-top">
        ${label ? `<h4 class="rl-clause-h">${_ne(label)}</h4>` : ''}
        ${asClause ? pillFor(asClause) : ''}
      </div>
      <div class="nego-body">${inner}</div>
      ${asClause ? cpPush(asClause, [ch], { newClause: true }) : ''}
    </section>`;
  };
  /* Folded to the reviewer's own clauses — see rlRvDocClauses. Null means the
     whole contract, which is every reader who is not reviewing here and any
     reviewer who has pressed the control below. */
  const _rvOnly = rlRvDocClauses(c, opts);
  const _rvHidden = _rvOnly ? clauses.filter(cl => !_rvOnly.has(String(cl.clauseId))).length : 0;
  const body = clauses.filter(cl => !_rvOnly || _rvOnly.has(String(cl.clauseId))).map(cl => {
    const after = (insertsAfter.get(cl.clauseId) || []).map(insertBlock).join('');
    const chs = byClause.get(cl.clauseId) || [];
    /* The one clause whose wording is being typed right now — see the note on
       liveId above. It is drawn is-changed because it IS changed: there is a
       draft on it, and a clause reading as untouched while somebody types into
       it is the same untruth as a clause reading as untouched after an
       adoption. Every attribute the rest of the canvas stamps stays on it, so
       rlLinkFocus and the selection helpers find it exactly as they find any
       other clause. */
    if (liveId && String(cl.clauseId) === liveId){
      const liveAnchor = _ne(chs.map(x => x.id).reverse().join(' '));
      return `<section class="nego-clause rl-clause is-changed rl-clause-live" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}"${
        liveAnchor ? ` data-nego-card-anchor="${liveAnchor}"` : ''}>
        <div class="rl-clause-top">
          ${liveHead == null ? heading(cl) : liveHead}
          ${pillFor(cl)}
        </div>
        ${liveHtml}
      </section>${after}`;
    }
    /* ---- THE PAPER MUST SHOW WHAT WAS ADOPTED (owner-reported 15 Aug 2026)
       ----
       This was `chs[chs.length - 1]` — draw the NEWEST change and give the
       rest a tag only. Reported on MK-311 with a screenshot: a sentence was
       struck out by their ask, we adopted it, and the clause on screen still
       carried the sentence in full. Reproduced before it was touched.

       WHY. The canvas is built from the ROUND BASELINE (negoClauseList), and
       adopting a change does not move the baseline — only closing the round
       does. An adopted change reaches the page only by having its own marks
       drawn. So on a clause carrying an adopted change AND a newer pending
       one, "newest wins" drew the pending one's marks over the baseline and
       the adoption was nowhere on the paper. The contract on screen was
       untrue, which is the worst thing this page can be.

       THE RULE, and it is a rule about MEASUREMENT rather than about age —
       the same reading negoMeasuredAlike gave the accept guard:
         · Prefer the newest change measured against what NOW STANDS. A change
           written on top of an adoption already contains it, so drawing that
           one shows the adopted wording in its own un-struck text. This is
           every ordinary sequential edit, and it is what was drawn before.
         · Where no change was measured against what stands — the rivals case,
           which is exactly the reported one — draw the LAST ADOPTED change
           instead. Its marks ARE the standing wording, and the rival keeps
           its tag, which opens its own wording where the detail belongs.
         · With nothing adopted, "what stands" is the baseline and every
           change qualifies, so the newest is drawn: first rounds and legacy
           two-rival clauses are untouched, byte for byte.

       WHAT IS NOT DONE HERE, deliberately: no re-diffing. The stored ops are
       inside the fingerprint and a mark drawn from a fresh diff would not be
       the mark the other side verified. This picks between changes already on
       the record; it never rewrites one. */
    const ch = negoLeadChange(c, cl, chs);
    const rest = chs.filter(x => x !== ch);
    /* Lead first: three selection helpers read this attribute expecting one id
       and take the first token, and the first token must stay the change whose
       marks are actually on screen. rlLinkFocus matches with [~=], so every
       card finds this clause whichever position its id holds. */
    const anchorIds = _ne(chs.map(x => x.id).reverse().join(' '));
    if (ch){
      const theirs = ch.authorSide !== side;
      /* ---- A CLEAN READING CARRIES NO MARKERS EITHER ----
         Under "As agreed" and "With changes" the clause loses its amber box and
         its ask tag along with its strikes. The point of those readings is a
         contract you can read as a contract; a page that removed the marks and
         kept the highlight would be pointing at wording that no longer says
         anything different. What is on the table is still said, twice over, in
         the queue and in the cards beside it.

         AND ONLY WHILE IT IS LIVE, exactly as for an inserted clause above. A
         change that has been ACCEPTED or REFUSED keeps its marks and its tag
         in every reading: those marks are the record of what was decided, and
         "· ✓ adopted" / "· ✗ refused" is the only place the page says the
         argument is over. A clean reading is about the questions still open,
         not about erasing the answers. */
      const settled = ch.status !== 'pending' || ch.withdrawn;
      const which = settled ? 'marks' : rlReadSideOf(ch, readMode);
      const marked = which === 'marks';
      const clean = redlineBody(ch);
      if (!marked){
        return `<section class="nego-clause rl-clause" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}" data-nego-card-anchor="${anchorIds}">
          <div class="rl-clause-top">
            ${heading(cl)}
            ${pillFor(cl)}
          </div>
          ${''/* A formatting-only ask read "as agreed" is simply the clause. */}
          ${clean == null ? richBody(cl) : clean}
          ${cpPush(cl, chs)}
        </section>${after}`;
      }
      /* The decision rides on the tag, because the card leaves the column once
         a change is settled: without this the document showed the marks and
         nothing said the argument about them was over. The refusal's reason —
         ch.reply, which travels — is on the tag's tooltip. EVERY change on the
         clause gets its tag, oldest first so the row reads in the order the
         asks were made and ends on the one whose marks are drawn. */
      const fmtChip = ch.formattingOnly
        ? `<span class="nego-note fmt" title="${_nea(i18t('ng_formatting_only_title'))}">${i18t('ng_formatting_only')}</span>` : '';
      return `<section class="nego-clause rl-clause is-changed" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}" data-nego-card-anchor="${anchorIds}">
        <div class="rl-clause-top">
          ${heading(cl)}
          ${''/* ---- THE ASK TAGS HAVE COME OFF THE PAPER (owner-asked 16 Aug
                 2026: "remove the pills from the contracts") ----
                 Four of them on one clause heading — "CHG-003 ✓ CHG-009 ↩
                 CHG-011 ↩ CHG-013 ?" — pushed the clause's own name off its
                 line, which is the fault the tag's own label was trimmed twice
                 to avoid. They were kept this long for one reason and it has
                 gone: a settled change leaves the change column, and the tag
                 was the only handle left on it. The clause PANEL is that handle
                 now — every ask on the clause, live and settled, with its
                 wording and its outcome, behind the Edit pill on the same row.
                 The Reopen the tag's reveal carried moved with it (see
                 mayReopen in rlClausePanelBodyHtml); a refusal whose stated
                 remedy cannot be reached is worse than no remedy, so the two
                 had to move together or neither could.

                 What is LEFT on the clause is the red rule down its right edge,
                 which says the same thing the tags said at a glance — this
                 clause has been argued over — without spending the heading on
                 it. rlAskTagHtml and rlAskRevealHtml survive as builders with
                 no caller on this canvas; negoDocHtml's own badges are a
                 different marker and are untouched. */}
          ${fmtChip}
          ${pillFor(cl)}
        </div>
        ${clean == null ? richBody(cl) : clean}
        ${cpPush(cl, chs)}
      </section>${after}`;
    }
    return `<section class="nego-clause rl-clause" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}">
      <div class="rl-clause-top">
        ${heading(cl)}
        ${pillFor(cl)}
      </div>
      ${richBody(cl)}
      ${cpPush(cl, chs)}
    </section>${after}`;
  }).join('') + orphanInserts.map(insertBlock).join('');
  /* ---- THE DOCUMENT'S OWN FRONT MATTER, NOT A LABEL ABOUT IT ----
     The Doc page opens with the contract's kicker line, its own title and the
     recital naming the parties and the key terms; the clause model calls all
     of that chrome and skips it, so this page used to open at "1." under a
     title invented from the record's display name ("… — JUNO LIMITED") — the
     same agreement reading as two different documents. clauseFrontMatter
     returns exactly what the segmentation skips, and it is read from the
     CURRENT body rather than the round baseline deliberately: the recital's
     key terms are not negotiable clauses, so what the Doc page shows today is
     what belongs here today. Where a document has no front matter of its own
     (an upload that arrived as a wall of paragraphs) the old label head
     stands, because inventing a recital would be worse than naming the file. */
  /* ---- AND IT IS PROPOSED ON LIKE ANYTHING ELSE (owner-ruled 28 Aug 2026) ----
     The front matter is a REGION the change model can address under one
     reserved id (see CLAUSE_FRONT_ID). It is deliberately not in
     negoClauseList, so no count, queue or numbering knows about it; what it
     gets is a pencil of its own, a redline over its own words, and a body in
     the clause panel.

     THE THREE READINGS ARE DRAWN AS DOCUMENTS, not as marks. A clean reading
     has real markup available on both sides — the baseline's, and the one the
     change proposes — so 'As agreed' and 'With changes' keep the title's own
     size and the recital's own shape. ONLY the redlined reading flattens the
     region to its text, which is what a redline is and is the same trade every
     clause on this page already makes.

     WHERE THE REGION DOES NOT EXIST (an upload that arrived as a wall of
     paragraphs) nothing changes at all: the old label head still stands, and
     no pencil is drawn, because clauseFrontClause answers null and the act
     cannot work there. */
  const frontCl = (typeof negoFrontClause === 'function') ? negoFrontClause(c) : null;
  const frontChs = frontCl ? (byClause.get(frontCl.clauseId) || []) : [];
  const frontCh = frontChs.length ? negoLeadChange(c, frontCl, frontChs) : null;
  const frontLive = !!(frontCl && liveId && String(frontCl.clauseId) === liveId);
  /* The region's markup for a clean reading, or null when the marks are what
     this reading wants. */
  const frontMarkup = () => {
    if (!frontCl) return null;
    if (!frontCh) return frontCl.bodyHtml;
    const settled = frontCh.status !== 'pending' || frontCh.withdrawn;
    const which = settled ? 'marks' : rlReadSideOf(frontCh, readMode);
    if (which === 'del') return frontCl.bodyHtml;
    if (which === 'ins'){
      const rich = String(frontCh.bodyHtml || '').trim();
      return rich ? (window.sanitizeRich ? sanitizeRich(rich) : rich) : null;
    }
    return null;
  };
  const frontDrawn = frontLive ? null : frontMarkup();
  const frontParts = (frontCl && frontDrawn != null && window.clauseFrontParts)
    ? clauseFrontParts(frontDrawn) : null;
  const front = frontParts || (window.clauseFrontMatter
    ? clauseFrontMatter((window.negoBodyOf ? negoBodyOf(c) : negoBaseBody(c)))
    : null) || { titleText: '', leadHtml: '', bodyHtml: '' };
  /* The pencil rides in the header, not over the paper: it is the one control
     the region has, and it opens the same panel every clause's does. */
  const frontPill = frontCl ? pillFor(frontCl) : '';
  const frontAttrs = frontCl
    ? ` data-clause="${_ne(frontCl.clauseId)}" data-nego-working="${_ne(frontCl.clauseId)}"${
      frontChs.length ? ` data-nego-card-anchor="${_ne(frontChs.map(x => x.id).reverse().join(' '))}"` : ''}`
    : '';
  const frontMarks = () => {
    if (frontLive) return liveHtml;
    if (!frontCh) return '';
    const tip = String((frontCh.author || '') || '').trim();
    const ops = rlOpsAsSide(frontCh.ops, 'marks');
    if (window.redlineOpsBlocksHtml && Array.isArray(ops) && ops.length)
      return `<div class="nego-body">${redlineOpsBlocksHtml(ops, { title: tip ? `Last updated by ${tip}` : '' })}</div>`;
    return `<div class="nego-body"><p>${_ne(frontCh.newText || '')}</p></div>`;
  };
  const head = (frontCl && frontDrawn == null)
    ? `<header class="rl-paper-head rl-front is-changed"${frontAttrs}>
      <div class="rl-front-top">${frontPill}</div>
      ${frontMarks()}
    </header>${frontCl ? cpPush(frontCl, frontChs) : ''}`
    : front.titleText
    ? `<header class="rl-paper-head${frontCl ? ' rl-front' : ''}"${frontAttrs}>
      ${frontCl ? `<div class="rl-front-top">${frontPill}</div>` : ''}
      ${front.leadHtml ? `<div class="rl-paper-kick">${front.leadHtml}</div>` : ''}
      <h3 class="rl-paper-title">${_ne(front.titleText)}</h3>
      ${front.leadHtml ? '' : `<p class="rl-paper-sub">${_ne(tmpl)} &middot; Jurisdiction: ${_ne(region)}</p>`}
    </header>
    ${front.bodyHtml ? `<div class="rl-recital" data-anchor="recital">${front.bodyHtml}</div>` : ''}${
      frontCl ? cpPush(frontCl, frontChs) : ''}`
    : `<header class="rl-paper-head">
      <h3 class="rl-paper-title">${_ne((c.name || tmpl)).toUpperCase()}</h3>
      <p class="rl-paper-sub">${_ne(tmpl)} &middot; Jurisdiction: ${_ne(region)}</p>
    </header>`;
  /* nego-doc is required, not cosmetic: the Copilot selection menu (the three
     NEGO_AI_ACTIONS — rephrase for advantage, explain legal risk, shorten
     wording) only opens when the selection sits inside
     `.nego-pane.working .nego-doc`. Without this class the AI redlining is
     silently unreachable on this page. */
  /* ---- THE SHEET RIDES IN A ZOOM WRAPPER (13 Aug 2026) ----
     Same shape as the Document tab's #doc-zoom: a fixed 660px page inside a
     block that is scaled to fill the column. rlApplyDocZoom writes --rl-zoom
     on it. The wrapper is inside the document pane and nothing measured by the
     page's own geometry is inside it — see the .rl-zoom rule for the whole
     argument. */
  return `<div class="rl-zoom" style="zoom:var(--rl-zoom,1)"><article class="nego-doc rl-paper">
    ${head}
    ${negoNumberingNoticeHtml(c, { noticeId: 'rl-gaps',
      offer: side === 'owner' && (typeof window.canEdit !== 'function' || window.canEdit()) })}
    ${rlRvDocNoticeHtml(c, opts, _rvHidden)}
    ${body || `<p class="rl-clause-p">${i18t('ng_no_clause_structure')}</p>`}
    ${rlPaperFootHtml(c)}
  </article></div>`;
}

/* ---------- WHERE THE NAMES GO ----------
   A contract ends with two ruled lines and the parties under them, and every
   agreement anybody has ever signed on paper looks like this. The sheet used
   to stop at the last clause, which read as a document that had been cut off.

   NOT A SIGNING SURFACE. Nothing here is clickable and nothing is stamped:
   signing is the Signing tab's job, with its own record and its own seal. This
   is the shape of the page — and it is drawn from the REAL parties, ours from
   the contract's own party and theirs from the contract, with a dash where a counterparty
   has not been named yet rather than an invented one.

   Shared, and deliberately so: the Document tab, the workbench, the
   counterparty's page and the phone all print the same foot. */
function rlPaperFootHtml(c){
  const us = String(_ngOurParty(c) || '').trim();
  const them = String((c && c.counterparty) || '').trim();
  if (!us && !them) return '';
  const line = who => `<div class="rl-sigline">
      <span class="rl-sigrule"></span>
      <span class="rl-sigfor">${who ? i18t('ng_signed_for', { who: _ne(who) }) : '&mdash;'}</span>
    </div>`;
  return `<div class="rl-paper-foot" aria-hidden="true">${line(us)}${line(them)}</div>`;
}

/* ---------- THE TRACKED CHANGES COLUMN ----------
   ONLY LIVE REDLINES REACH IT. The column used to list every change that was
   not superseded, which meant a contract six rounds deep opened on a stack of
   settled history — accepted wording, rejected asks — with the two things
   actually waiting on somebody buried inside it. A column headed "Tracked
   Changes" that is mostly changes nobody can act on is a column people stop
   reading, and the count above it stops meaning anything.

   So a card exists for exactly one condition: a clause carrying an ACTIVE
   redline — pending, proposed, not yet decided, not withdrawn. A clause with
   nothing on the table has no card at all. The settled ones have not gone
   anywhere: they are in the document as adopted or reverted wording, in the
   round history, and in the discussion threads that hang off them.

   Accept and Reject still appear only where the engine would allow the
   decision — the OTHER side's ask, on a copy that can still move the
   negotiation. Nobody rules on their own ask. */
const _rlIsLive = ch => !!ch && ch.status === 'pending' && !ch.withdrawn;
/* ---- AND SETTLED WORK STAYS ON THE COLUMN (owner-asked 26 Aug 2026) ----
   The owner asked for Refused, Accepted and Withdrawn to be piles of their
   own, so that no row has to print its own state at the end of its sentence.
   ONLY ONE OF THE THREE COULD EVER HAVE DRAWN: a refusal survived on the
   column's own `contestedAny`, and an accepted or withdrawn ask was filtered
   out of it entirely — so two of the three headings would have been piles
   nothing could ever land in, which is worse than not building them.

   SO THE POPULATION WIDENS BY EXACTLY THOSE TWO, and it is bounded by
   machinery that already exists: closing a round archives every decided change
   off c.changes, so what this adds is THIS ROUND'S settled work and never the
   whole history of the negotiation. SUPERSEDED IS NOT IN IT — a countered ask
   leaves the column by design and every count corrects itself by that
   omission; this reads status and withdrawn, and says nothing about it.

   ONE PREDICATE, BOTH LISTS. redlineChangeCardsHtml draws the cards and
   redlineCardIds counts the pill above them, and the two have to agree about
   the population or the pill lies about the list under it.

   AND OUR SEAT ONLY, WHICH IS THE CONDITION ON ALL OF IT. The bands are drawn
   on the owner's seat alone — that was the agreement when they were built and
   it has not moved — so a settled card on the counterparty's page would arrive
   under no heading at all and, since the status word came off with the same
   change, would say nothing about itself either. Their page keeps the rule it
   has always had: a settled change leaves their column, and the decision rides
   the clause panel. It is asked through bandOpts.banded rather than by testing
   the side here, so the population and the headings can never come to
   different answers about which seat this is. */
const _rlSettledCard = ch => !!ch && !!(ch.withdrawn || ch.status === 'accepted');

/* ---- STILL BEING ARGUED ABOUT FIRST, SETTLED AT THE BOTTOM ----
   Asked for (Young, 12 Aug 2026): on the All tab a change that was decided
   rounds ago could sit above one still waiting for an answer, because the
   column was drawn in filing order whatever state anything was in.

   THIS IS A SORT AND NOT A FILTER, and the difference is the whole safety
   argument: nothing leaves the column, nothing is hidden, and no count moves —
   the All / Mine / Theirs chips still say exactly what they said. redlineCardIds
   applies the SAME order as the card stack, so the pill above the column and
   the column itself can never disagree about the population or the order.

   THREE RANKS, read off the change RECORD so every list-builder can ask the
   same question without rebuilding the verbs first:

     0  NOBODY HAS ANSWERED IT — pending and not withdrawn; or the reader has
        answered it on a page that HOLDS decisions until they press Send, so it
        has settled nowhere yet and is still theirs to change.
     1  ANSWERED, STILL OUTSTANDING — refused and not withdrawn. Decided, so it
        belongs below anything still awaiting an answer; but NOT finished, and
        deliberately not at the very bottom: it is the one state that blocks the
        whole deal (negoAlignment), somebody has to withdraw it before either
        side can signal readiness, and burying it under a stack of adopted
        wording would hide the cause of a contract that will not move.
     2  SETTLED — adopted, withdrawn, or an answer that has already gone.

   Newest first inside each group, because that is where the work is. Ties fall
   back to the filing sequence and then to the original position, so the order
   is deterministic on a record whose timestamps collide. */
function rlCardRank(ch, held){
  if (!ch) return 2;
  if (!ch.withdrawn && ch.status === 'pending') return 0;
  if (held && held.has && held.has(ch.id)) return 0;
  if (!ch.withdrawn && ch.status === 'rejected') return 1;
  return 2;
}
/* ---------- TWO VERBS ON THE FACE, THE REST IN THE MENU ----------
   (owner-asked 25 Aug 2026, against a target picture of the finished column:
   "On the change card there should be only 2 options to click on and the rest
   are in the dropdown.")

   MEASURED before: their pending ask carried three (Accept · Reject · Edit) and
   our own draft four (Edit · Review · Retract · Send), so the row the design
   draws with two verbs and a chevron was carrying twice that.

   IT IS ONE CUT APPLIED TO THE FINISHED LIST, not fourteen edited branches.
   Every branch above still pushes the verb it has always pushed — which is
   what keeps each one's own seat rules, desk rules and review rules exactly
   where they were — and the split happens once, after. A rule per branch is
   how a state nobody thought of ends up with three verbs again.

   THE RANK IS WHAT DECIDES, AND THE BUILT ORDER IS WHAT DRAWS. The two that
   stay are the two highest-ranked; they are then drawn in the order the
   branches built them, so Edit still reads before Send on a draft rather than
   jumping about because a rank list put it second.

   WHY THIS ORDER: the decision on the other side's ask outranks everything (it
   is the only thing that moves the round); then the act that makes an answer
   real; then taking one back; then revising. Checked state by state —
   their pending ask keeps Accept and Reject, our draft keeps Edit and Send, a
   held answer keeps Send and Undo, a refusal of ours keeps Withdraw and Edit.

   ONE EXCEPTION, AND IT IS THE STANDING RULE ABOUT REFUSALS. A change a
   reviewer is HOLDING has no decision and nothing to send, and the sentence
   printed beside it says the only way forward is to ask that person again. A
   remedy named in words and then folded into a menu is the fault this codebase
   already records twice (Cancel in the review notice, Reopen behind a tag), so
   on exactly that card the ask is promoted to the front. */
const RL_FACE_MAX = 2;
/* EDIT RANKS ALIKE WHICHEVER DOOR IT IS. Since 30 Aug the card's Edit carries
   data-rl-cp-editor-row on our seat and data-rl-edit elsewhere — the same verb,
   in the same place, landing somewhere different. Left off this list the editor
   form scored as UNRANKED, which sorts LAST, so Edit quietly fell into the ⋯ on
   cards where it had always been on the face; f192 caught it by reading
   Reopen's class against the button beside it. The two entries are ADJACENT
   with nothing between them, so the two forms rank identically against every
   other verb. A verb that changes its attribute has to be re-ranked with it. */
const RL_FACE_RANK = ['data-nego-accept', 'data-nego-reject', 'data-rv-cancel',
  'data-rl-sendcopy', 'data-rl-send', 'data-nego-undo', 'data-nego-redecide',
  'data-nego-withdraw', 'data-rl-edit', 'data-rl-cp-editor-row',
  'data-rl-retract', 'data-rl-ask-review'];
function rlFaceRank(html, promoteAsk){
  const h = String(html || '');
  if (promoteAsk && h.includes('data-rl-ask-review')) return -1;
  for (let i = 0; i < RL_FACE_RANK.length; i++) if (h.includes(RL_FACE_RANK[i])) return i;
  return RL_FACE_RANK.length;
}
/* Returns {face, overflow} — both in the order the branches built them. */
function rlFaceSplit(verbs){
  const list = (verbs || []).filter(Boolean);
  if (list.length <= RL_FACE_MAX) return { face: list, overflow: [] };
  /* No decision to take and nothing to send: see the exception above. */
  const promoteAsk = !list.some(v => /data-nego-accept|data-nego-reject|data-rl-send\b/.test(v));
  const keep = list.map((v, i) => ({ v, i, r: rlFaceRank(v, promoteAsk) }))
    .sort((a, b) => (a.r - b.r) || (a.i - b.i))
    .slice(0, RL_FACE_MAX)
    .map(x => x.i);
  const keepSet = new Set(keep);
  return { face: list.filter((_, i) => keepSet.has(i)),
    overflow: list.filter((_, i) => !keepSet.has(i)) };
}

/* ---------- THE CARD'S OVERFLOW MENU (owner-asked 25 Aug 2026) ----------
   The design puts the row's quieter routes behind a ⋯ instead of beside Open,
   and EDIT WITH COPILOT LEADS IT — which is what the approved journey asked for
   from the start ("Edit with Copilot goes to the top of this menu, above Open
   in the clause panel"), and what the ✦ button beside Open was standing in for
   until the menu it belongs in existed.

   EVERY ROW IS A DOOR THE PAGE ALREADY HAS. Not one of them is a new act:
   data-rl-cp-editor-row is the clause editor, data-rl-cp-open is the clause
   panel, data-rl-ask-review is the scoped review ask, data-rl-edit is the jump.
   So the menu decides nothing — the handlers that were already bound pick these
   up exactly as they picked up the buttons — and it draws each row on the same
   terms that row's own button was drawn on. A menu that offered something the
   card would refuse is worse than no menu.

   NOTHING IN IT IS THE ONLY WAY TO ANYTHING. The card body still jumps to the
   clause, so the reader who never opens this menu loses nothing.

   THE HEAD NAMES THE CHANGE, because a menu floating over a column of six
   cards has to say which one it belongs to — the design draws that head and it
   is the reason it works. */
/* ---- EVERY ROW IN THIS MENU CARRIES A SYMBOL (owner-asked 26 Aug 2026) ----
   "they should have a symbol before the word just like review." Two of the four
   rows had one and two did not, so the menu read as two kinds of row.

   THE MARKS COME FROM THE SHELL'S SPRITE, never from glyphs invented here: one
   16 box, a hairline stroke, currentColor — so each mark takes the ink of the
   row it sits on and Reject stays red, Send stays green, Copilot stays violet
   with nothing said twice. `i-check` and `i-x` were added to that sprite for
   the two decision verbs, which had no mark in the set.

   THE VERBS ARRIVE AS FINISHED BUTTONS and are NOT rebuilt — they are the same
   markup the face draws, with the same attributes and the same handlers, so a
   verb cannot come to mean one thing on the face and another here. The icon is
   inserted after the opening tag and nothing else about the button is touched;
   `_nea` escapes '>' inside every attribute, which is what makes matching to
   the first '>' the end of the tag rather than a guess. A verb this list does
   not recognise simply keeps its own markup — a menu row with no symbol is a
   smaller fault than a row wearing the wrong one. */
const RL_MORE_ICONS = [
  [/data-nego-accept/, 'i-check'], [/data-nego-reject/, 'i-x'],
  [/data-rl-send\b/, 'i-out'], [/data-rl-retract\b|data-nego-withdraw/, 'i-left'],
  [/data-nego-undo|data-rl-reopen|data-nego-redecide/, 'i-up'],
  [/data-rl-ask-review/, 'i-people'], [/data-rl-cp-editor-row/, 'i-spark'],
  [/data-rl-cp-open/, 'i-panel'], [/data-rl-notes/, 'i-chat'], [/data-rl-edit=/, 'i-file'],
];
const rlMoreIcon = id =>
  `<svg class="rl-more-i" viewBox="0 0 16 16" aria-hidden="true"><use href="#${id}"/></svg>`;
function rlMoreWithIcon(html){
  const s = String(html || '');
  if (!s || /class="rl-more-i"/.test(s)) return s;
  const hit = RL_MORE_ICONS.find(([re]) => re.test(s));
  if (!hit) return s;
  return s.replace(/(<button\b[^>]*>)/, `$1${rlMoreIcon(hit[1])}`);
}
/* The count on a row's face. Its own builder because more than one surface
   draws this number — the row, the card's own notes drawer once Open is
   pressed, and the drawer in the shell — and a number written twice is a
   number that comes to disagree; all of them ask negoNoteCounts. Silent at
   zero. */
function rlCardNotesCountHtml(c, ch, opts = {}, side = 'owner'){
  if (typeof negoNoteCounts !== 'function') return '';
  /* ---- AND IT STANDS DOWN WHILE THE CARD IS OPEN (owner-asked 2 Sep 2026:
     "Remove the top highlighted comments sign because there is already a
     comments section at the bottom highlighted area") ----
     The count exists to say a change has been discussed WITHOUT opening it.
     Once the card is open the two rooms are twelve pixels below with their own
     counts on their own tabs, so the marker is the same fact printed twice —
     and the second printing is the one that reads as something to press.
     ON A SHUT CARD IT IS THE ONLY CARRIER and stays: nothing else on a closed
     row says a change has a conversation on it. */
  if (typeof rlCardOpenId === 'function' && ch
      && String(rlCardOpenId() || '') === String(ch.id)) return '';
  const n = negoNoteCounts(c, ch, opts, side);
  if (!n.total) return '';
  return `<button type="button" class="rl-card-notes" data-rl-notes="${_nea(ch.id)}"
    title="${_nea(i18t('ng_card_notes_n', { n: n.total }))}"
    aria-label="${_nea(i18t('ng_card_notes_n', { n: n.total }))}"
    ><svg viewBox="0 0 16 16" aria-hidden="true"><use href="#i-chat"/></svg><b>${n.total}</b></button>`;
}
/* ---------- WHAT OPEN REVEALS (owner-ruled 2 Sep 2026) ----------

   The card's face carries ONE control and this is everything behind it: the
   wording being proposed, why it was asked for, every verb — including the
   four that lived in the ⋯ — and the change's own comments.

   IT BUILDS NOTHING OF ITS OWN. The wording is rlChangeWordingHtml, the one
   builder the ask reveal and the clause panel already share; the verbs arrive
   finished from the caller, which is where every seat, desk and review rule
   that decides them lives; the notes are the drawer's own reading. A second
   copy of any of the three is how two surfaces come to disagree about one
   change, which is the fault this file opens by warning about.

   THE EXPLANATORY STRIPS COME WITH THE VERBS rather than staying on the face,
   and that keeps a standing rule rather than breaking one: an action bar with
   a hole in it and the explanation elsewhere is worse than either, so the two
   sentences that account for a MISSING verb — the desk's "instead" and the
   review hold's "what now" — sit with the bar they explain. */
function rlCardBodyHtml(c, ch, opts, side, st){
  /* ---- ONLY THE LINES THIS CHANGE TOUCHES (owner-asked 2 Sep 2026) ----
     "lets only have the sentences or bullet points that have been redlined
     show up ... if it is two bullet points out of 6 bullet points from a
     clause, only the 2 should appear."

     THE CARD IS A HANDLE ON A PASSAGE, and a clause of twelve paragraphs
     printed whole to show a change in one of them is the card's own subject
     pushed off the screen. The whole clause is never further away than the
     paper twelve pixels to the left, and the card's head names the clause.

     THIS SURFACE ONLY. rlChangeWordingHtml is shared with the ask reveal and
     the clause panel, whose job is the full reading, and the flag is off by
     default so both are byte-identical. */
  const wording = (typeof rlChangeWordingHtml === 'function')
    ? rlChangeWordingHtml(ch, { changedOnly: true }) : '';
  /* AND WHAT IS NOT SHOWN IS SAID, which is this product's standing rule: a
     cap or an omission is a FACT, never a silent trim. Counted off the SAME
     ops the wording is drawn from, so the number and the picture cannot
     disagree; silent when nothing was left out, because a note that is always
     there is one nobody reads. */
  const stats = (typeof redlineBlockStats === 'function' && typeof rlChangeOps === 'function')
    ? redlineBlockStats(rlChangeOps(ch)) : null;
  const hidden = (stats && stats.changed) ? stats.unchanged : 0;
  const omitted = hidden
    ? `<p class="rl-cb-omit" title="${_nea(i18t('ng_cb_only_changed_title'))}"
        >${_ne(i18tn('ng_cb_unchanged', hidden, { n: hidden }))}</p>`
    : '';
  const mine = ch.authorSide !== (side === 'counterparty' ? 'counterparty' : 'owner') ? false : true;
  const settled = st.settled;
  /* WHAT THE BLOCK IS CALLED depends on whose ask it is and whether it is
     still one. A settled change is a record, and "what they are asking for"
     over something nobody is asking for any more is the card stating
     something untrue about the round. */
  const lead = settled
    ? i18t(ch.status === 'accepted' ? 'ng_card_was_agreed' : 'ng_card_was_asked')
    : i18t(mine ? 'ng_card_you_propose' : 'ng_card_they_ask');
  const bits = [];
  if (wording) bits.push(`<div class="rl-cb-blk"><p class="rl-cb-k">${lead}</p>
    <div class="rl-cb-q">${wording}</div>${omitted}</div>`);
  if (st.info) bits.push(`<div class="rl-cb-blk rl-card-info">${st.info}</div>`);
  if (st.actions) bits.push(`<div class="rl-cb-acts">${st.actions}</div>`);
  /* THE COMMENTS, IN THE TWO ROOMS THEY ALREADY LIVE IN. The drawer's own
     builder, so a note reads the same here as it does in Chat and the wall
     between internal and external is the one negoRoomNotes keeps. */
  if (typeof rlCardBodyNotesHtml === 'function'){
    const notes = rlCardBodyNotesHtml(c, ch, opts, side);
    if (notes) bits.push(notes);
  }
  return bits.length ? `<div class="rl-cb">${bits.join('')}</div>` : '';
}
/* THE NOTES INSIDE A CARD. rlNotesPanelHtml's own list, tabs and composer,
   minus the header naming the change — the card above it is that header — and
   with a composer that carries no `nego-ti-` id: that id belongs to the room's
   own reply box and the drawer's, and a third element answering to it is the
   duplicate-composer fault this file records ("a copy is a reply box that
   posts nothing"). rlNotesSend resolves its box from the HOST it is given, so
   the send needs no id at all.

   IT IS `rlCardBodyNotesHtml` AND NOT `rlCardNotesHtml`, AND THAT NAME WAS
   PAID FOR. It shipped as the second, and `rlCardNotesHtml` — the
   COUNTERPARTY's card notes, 1,900 lines below — already owned it. A function
   declaration is hoisted over the whole file, so the later one silently won:
   this builder was never called, its own caller reached the counterparty's
   version, which opens `if (side !== 'counterparty') return ''`, and the notes
   simply did not draw inside an open card on our seat. NOTHING FAILED AND
   NOTHING LOGGED — an empty string is a legitimate answer here — and it was
   found by measuring the painted card, not by any test. f48 catches this
   between MODULES, on window; within one file nothing does. */
function rlCardBodyNotesHtml(c, ch, opts = {}, side = 'owner'){
  if (!c || !ch) return '';
  const tabbed = side === 'owner';
  const room = tabbed ? rlNpRoom() : 'external';
  const them = c.counterparty || i18t('ng_the_counterparty');
  const us = (window.contractParty ? contractParty(c) : null) || window.FIRST_PARTY || 'this workspace';
  const other = side === 'counterparty' ? us : them;
  const notes = negoRoomNotes(c, ch, room, opts, side);
  const n = negoNoteCounts(c, ch, opts, side);
  const ext = room === 'external';
  const tabs = tabbed ? `<div class="rl-np-tabs" role="tablist">
      ${NOTE_ROOMS.map(r => `<button type="button" role="tab" class="rl-np-tab${
        r === room ? ' on' : ''}" data-rl-np-room="${r}" aria-selected="${r === room}"
        >${i18t(r === 'external' ? 'ng_np_tab_ext' : 'ng_np_tab_int')} <i>(${
        r === 'external' ? n.external : n.internal})</i></button>`).join('')}
    </div>` : '';
  const who = ext ? i18t('ng_np_who_ext', { who: _ne(other) })
    : i18t('ng_np_who_int', { org: _ne(us), who: _ne(them) });
  const list = notes.length
    ? notes.map(m => rlNpNoteHtml(m, room, side, other)).join('')
    : `<p class="rl-cb-none">${i18t(ext ? 'ng_np_none_ext' : 'ng_np_none_int')}</p>`;
  const foot = notesMayWrite(c, opts)
    ? `<div class="rl-np-foot${ext ? ' out' : ''}">
        <textarea class="chat-field rl-np-in" rows="2"
          placeholder="${_nea(ext ? i18t('ng_np_ph_ext', { who: other }) : i18t('ng_card_note_ph'))}"
          aria-label="${_nea(i18t('ng_start_thread_aria', { id: ch.id }))}"></textarea>
        ${rlNpTagMenuHtml(c, room, opts)}
        <div class="rl-np-act">
          <button type="button" class="rl-np-send" data-rl-np-send="${_ne(ch.id)}"
            data-room="${room}">${i18t('ng_card_note_add')}</button>
        </div>
      </div>`
    : `<div class="rl-np-no">${RL_NP_LOCK}<span>${i18t('ng_np_viewer')}</span></div>`;
  return `<div class="rl-cb-notes rl-np" data-rl-np="${_nea(ch.id)}">
    ${tabs}
    ${rlNpWhoHtml(tabbed, ext, who)}
    <div class="rl-cb-list">${list}</div>
    ${foot}
  </div>`;
}
/* ---- WHERE A CLAUSE IS EDITED, DECIDED ONCE (owner-reported 1 Sep 2026) ----

   THREE COPIES OF THIS READING EXISTED AND THE ONE PLACE THAT NEEDED IT MOST
   HAD NONE. The paper's pencil, the card's Edit and the ⋯ menu's Copilot row
   each worked it out for themselves, and the [data-rl-edit] HANDLER — the
   thing that actually opens the clause panel — asked nothing at all. So the
   panel the owner had shut on 30 Aug came back through the menu's own "Jump
   to the clause" row, which carries data-rl-edit and whose handler opens it.

   ONE FUNCTION, ASKED BY ALL FOUR. A destination worked out in four places is
   four places for them to disagree, and this is what that disagreement looked
   like from the reader's chair: a row labelled "Jump to the clause" that
   opened a panel the product no longer uses.

   THE THREE QUESTIONS ARE UNCHANGED, and each keeps the panel for a reason
   that is a capability rather than a taste: THEIR SEAT (rlOpenClauseEditor
   refuses a counterparty outright, and the panel is the only way their page
   proposes wording), A WINDOW UNDER 1024px (two columns need room to be two
   columns), and A STAGE THAT DOES NOT LOAD THE EDITOR AT ALL — the module is
   asked for BY NAME rather than only whether the width suits it, because a
   fits-check falling through as true on a page with no editor is a door
   claiming a page nothing can open. */
function rlEditorTakesIt(side, opts = {}){
  if (side === 'counterparty' || opts.preview) return false;
  if (typeof window === 'undefined' || typeof window.rlOpenClauseEditor !== 'function') return false;
  return typeof window.clauseEditorFits !== 'function' || clauseEditorFits();
}
function rlCardMoreHtml(c, ch, opts = {}, side = 'owner', st = {}){
  /* ---- RETIRED 2 Sep 2026, WITH THE FACE THAT NEEDED IT ----
     The owner's ruling: *"the cards only had Open instead of edit, accepted
     etc. You then click open and the cards only expands and gives you all the
     options that are hidden in the dropdown."* Everything this menu held is in
     the expanded card now, and the row it hung off carries one control.

     A STUB RATHER THAN A DELETION, this file's own convention for a builder
     whose feature has gone: it is published and it had a caller, so a third
     caller must not be able to bring the menu back through a door nobody
     remembered. `RL_MORE_ICONS`, `rlMoreIcon`, `rlMoreWithIcon`, `rlMorePlace`,
     `RL_FACE_RANK`, `RL_FACE_MAX`, `rlFaceRank` and `rlFaceSplit` are STALE
     with it — flag any mention.

     "GO TO CLAUSE" IS NOT LOST AND IS NOT MOVED: it went because pressing the
     ROW already does it (rlLinkFocus, on the head, since the row was built),
     which is the owner's own reason — *"simply clicking on the card already
     takes you to the Clause."* A menu row for an act the whole card performs
     is the second door this rulebook refuses. */
  return '';
}

/* ---------- WHICH BAND A CHANGE SITS IN (owner-asked 25 Aug 2026) ----------
   The design groups the column under headings, each with its own count,
   instead of one run of cards in rank order. The bands are the QUESTIONS a
   negotiator actually sorts this column by:

     awaiting  what the other side has asked and nobody here has answered
     drafts    our own work that has not left the building
     review    ours, asked about and waiting on a colleague
     held      ours, and a colleague has stopped it going out
     with      our asks that have gone, waiting on them
     refused   settled, and still a sticking point
     accepted  settled, and agreed
     withdrawn taken off the table
     decided   the catch-all — a state nobody thought of, filed rather than lost

   ---- THE SETTLED PILE IS THREE PILES, AND THE REVIEW ONE IS TWO (owner-asked
   26 Aug 2026) ----
   It was ONE band, `decided`, holding two opposite outcomes — so every settled
   row had to print its own word to say which, and the owner's complaint was
   exactly that: "if it is sent, then it is in the category of With Saw Sawa so
   it is redundant ... as far as refused or accepted, they should be categories
   for them as well so there is no need to add the word at the end of the
   sentence." Split the pile and the word has nothing left to tell anybody,
   which is what took the status slot off our seat's row entirely (see
   redlineChangeCardsHtml). The same argument, made on the same day, took the
   REVIEWER'S NAME off the row — so `drafts` splits too: waiting on a colleague
   and stopped by one are different states, and a heading can name both.

   ---- AND REFUSED SITS AT THE TOP OF THE WHOLE COLUMN (owner-asked 27 Aug
   2026: "move refusals to the top of the pile") ----
   It was sixth, under five bands of work in flight, so the one thing on this
   page that can stop the deal was the thing you had to scroll to find. A
   refusal is not merely settled — it is a disagreement standing on the record,
   and it is what a negotiator opens this column to look for. Everything above
   it was work that is simply taking its course.

   IT STILL READS QUIETLY, and that is deliberate rather than an oversight:
   `refused` stays in RL_SETTLED_BANDS, so its rows keep the regular weight and
   the label ink the owner asked settled rows to have on 26 Aug. The heading is
   what leads; the rows under it are a record. Reversing that would be
   overturning a decision nobody asked about.

   REFUSED STILL SITS ABOVE ACCEPTED for its own reason, unchanged: a refusal is
   a sticking point and an acceptance is finished, which is the reasoning
   rlCardRank already uses inside a band.

   AN EMPTY BAND DRAWS NOTHING, which is what keeps nine headings honest: a
   workspace with the internal-review rule off — the default — never sees two
   of them, and a first round sees three.

   IT REFINES rlCardRank RATHER THAN REPLACING IT. The rank still decides the
   order INSIDE a band and is still what redlineCardIds and the pill count read;
   this only says which heading a card lands under, and the two agree by
   construction because both read the same three facts (pending, withdrawn,
   whose ask). Every change lands in EXACTLY ONE band — the last branch is a
   catch-all, so a state nobody thought of is filed as decided rather than
   vanishing off the bottom of the column.

   `held` is the reader's own answers on a page that holds them until Send (the
   counterparty's seat); an answer held there has settled nowhere yet, so it
   stays where it was rather than moving to decided under the reader's hand. */
const RL_CARD_BANDS = ['refused', 'awaiting', 'drafts', 'review', 'held',
  'with', 'accepted', 'withdrawn'];
/* WHICH OF THEM ARE FINISHED BUSINESS. It decides which pile a change lands in
   and what the open card calls its wording ("was agreed" rather than "they
   ask"). Naming the set here is what stops the renderer testing for one band
   and quietly missing the others beside it. */
const RL_SETTLED_BANDS = ['refused', 'accepted', 'withdrawn'];
/* ---- AND WHICH OF THEM STEP BACK ON THE ROW (owner-asked 2 Sep 2026, off a
       render: "I want to have the accepted and withdrawn clause where they are
       currently in black font to be grey") ----
   A NARROWER SET THAN THE ONE ABOVE, and deliberately so. Being finished and
   being quiet are two different questions:

   REFUSED IS FINISHED AND IS NOT QUIET. It leads this column on purpose — a
   refusal is the thing that can still stop the deal — so greying it would make
   the loudest item the quietest, which is the opposite of why it sits at the
   top. DECIDED is the catch-all and was not named either; it is left black
   with refused rather than swept in, and adding it is one word here.

   THIS IS THE MARK THE 2 Sep TYPE CHANGE SPENT, COMING BACK. A settled row used
   to be told apart by its summary going grey and regular — which became what
   every row does — and the rulebook's own note said the way back was "the
   reference in the label shade on a settled row, and it is one rule". This is
   that rule. `rl-card-done` is still stamped on all four and still means
   FINISHED; this is the smaller question of which of them recede. */
const RL_QUIET_BANDS = ['accepted', 'withdrawn'];
/* `c` is the contract, and it is OPTIONAL on purpose: only the two review
   bands need it (reviewOutFor asks the contract's own open reviews), and
   without it they simply never fire and an ask with a colleague stays under
   YOUR DRAFTS — which is exactly where it sat before this split. So a caller
   that has no contract to hand gets the old answer rather than a wrong one. */
function rlCardBand(ch, side, unsent, held, c){
  /* A CHANGE THAT IS NOT THERE IS SHOWN AS WORK, never filed as finished —
     the same direction the fallthrough below takes, and for the same reason. */
  if (!ch) return 'awaiting';
  const theirs = ch.authorSide !== (side === 'counterparty' ? 'counterparty' : 'owner');
  const live = !ch.withdrawn && ch.status === 'pending';
  if (held && held.has && held.has(ch.id)) return theirs ? 'awaiting' : 'drafts';
  if (!live){
    /* WITHDRAWN IS ASKED FIRST because it is a fact about the ask rather than
       about the answer: a withdrawn change can carry any status underneath,
       and "taken off the table" is what the reader needs to be told. */
    if (ch.withdrawn) return 'withdrawn';
    if (ch.status === 'accepted') return 'accepted';
    if (ch.status === 'rejected') return 'refused';
    /* AND THERE IS NO FIFTH PILE (owner-asked 2 Sep 2026: "Remove decided so
       there are four piles ... isn't accepted the same as decided?").
       The owner is right and it was never a real category. A change carries
       exactly one of four states — pending, accepted, rejected, superseded —
       and each of the first three has a pile of its own here, while a
       superseded ask is filtered off this column before the band is ever
       asked. So 'Decided' was a heading nothing could land in, drawn never,
       and one more word for the reader to tell apart from Accepted.

       WHAT IS LEFT FALLS THROUGH TO THE LIVE READING rather than into a
       record, and that direction is the safe one: an ask this reading cannot
       place is shown as WORK, where somebody sees it, instead of being quietly
       filed as finished. */
  }
  if (theirs) return 'awaiting';
  if (!(unsent && unsent.has && unsent.has(ch.id))) return 'with';
  /* OURS, AND STILL HERE. Which of the three drafts bands is the review's own
     reading, asked exactly as the card asks it — see rvHeld / rvOut in
     redlineChangeCardsHtml, whose flags these two lines mirror. */
  if (window.reviewHeld && reviewHeld(ch)) return 'held';
  if (c && window.reviewOutFor && reviewOutFor(c, ch)) return 'review';
  return 'drafts';
}
const _rlFiledAt = ch => Date.parse(String((ch && ch.createdAt) || '')) || 0;
function rlCardSort(list, held, band){
  const ranked = (list || []).map((ch, i) => ({ ch, i })).sort((a, b) => {
    const r = rlCardRank(a.ch, held) - rlCardRank(b.ch, held);
    if (r) return r;
    const t = _rlFiledAt(b.ch) - _rlFiledAt(a.ch);          // newest ask first
    if (t) return t;
    const s = (Number(b.ch && b.ch.seq) || 0) - (Number(a.ch && a.ch.seq) || 0);
    if (s) return s;
    return b.i - a.i;
  }).map(x => x.ch);
  /* ---- AND THE BAND IS THE OUTER KEY WHERE THE COLUMN DRAWS BANDS ----
     (owner-asked 25 Aug 2026 — see rlCardBand.) The rank above is still the
     whole order inside a band, and Array#sort is stable, so this only lifts
     each pile whole. IT LIVES HERE RATHER THAN IN THE RENDERER because
     rlCardSort is THE order: the column draws it and the Tracked Changes pill
     counts it, and a band applied in one of them would make the two lists
     agree about the population and disagree about the sequence — which is the
     exact fault the note on redlineCardIds already warns about, and which a
     first pass at the bands walked straight into. */
  if (!band || !band.banded) return ranked;
  const at = ch => RL_CARD_BANDS.indexOf(rlCardBand(ch, band.side, band.unsent, held, band.c));
  return ranked.sort((a, b) => at(a) - at(b));
}
/* ---- ONE READING OF THE BAND, FOR BOTH LISTS ----
   Whether this seat draws bands at all, and which of our asks have not left the
   building — asked by redlineChangeCardsHtml AND by redlineCardIds, so the two
   cannot come to different answers about the order they share. */
function rlBandOpts(c, opts = {}, side = 'owner'){
  const previewSeat = !!opts.preview && side === 'counterparty'
    && !((typeof negoExecuted === 'function') && negoExecuted(c));
  const unsent = Array.isArray(opts.unsentIds)
    ? new Set(opts.unsentIds)
    : previewSeat ? new Set()
    : new Set((window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).map(x => x.id));
  return { c, side, previewSeat, unsent, banded: side === 'owner' && !previewSeat };
}
/* How many redline actions sit with the OWNER seat on one contract: the other
   side's live asks awaiting a decision, plus our own drafts that have not left
   the building — the same two readings the cards and the wall are drawn from.
   Reads the record only where a negotiation already exists, because counting
   must never CREATE one: negoInit stamps clause ids into the document. */
function rlOwnerOpenActions(x){
  if (!x || !x.negotiation || !Array.isArray(x.changes)) return 0;
  const awaiting = x.changes.filter(ch => _rlIsLive(ch) && ch.authorSide === 'counterparty').length;
  const drafts = window.negoUnsentAsks ? negoUnsentAsks(x, 'owner').length : 0;
  return awaiting + drafts;
}
/* The portfolio-wide sum — the nav's "N Open" tag and the workbench's
   contract dropdown both read through here, so they cannot disagree. */
function rlOwnerOpenTotal(){
  const list = (typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  return list.reduce((n, x) => n + rlOwnerOpenActions(x), 0);
}
/* The toolbar's contract jump: every contract with redline actions awaiting,
   by NUMBER (the number is the stable handle; two drafts can share a name),
   each wearing its own count. The bench's current contract is always an
   option — a select whose value is not in its list shows a lie — and picking
   another one brings it to the bench through the one entry point, so the
   eviction rules cannot be skipped. */
function rlJumpHtml(c){
  const list = (typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  const rows = list.map(x => ({ id: x.id, n: rlOwnerOpenActions(x), cp: x.counterparty || '' }))
    .filter(e => e.n > 0 || e.id === c.id)
    .sort((a, b) => b.n - a.n || String(a.id).localeCompare(String(b.id)));
  if (!rows.some(e => e.id === c.id)) rows.unshift({ id: c.id, n: 0, cp: c.counterparty || '' });
  /* The counterparty rides last on each line — the number is still the handle,
     the name is the reminder of who is on the other side. The control is 9ch
     wider than it was to make room; whatever does not fit is clipped. */
  return `<select id="rl-contract-jump" class="rl-jump" aria-label="${i18t('ng_awaiting_action')}"
      title="${i18t('ng_every_awaiting')}">${
    rows.map(e => `<option value="${_nea(e.id)}"${e.id === c.id ? ' selected' : ''}>${_ne(e.id)} &middot; ${e.n} awaiting${e.cp ? ` &middot; ${_ne(e.cp)}` : ''}</option>`).join('')}</select>`;
}

/* ============================================================
   REVIEW VS PLAYBOOK — the whole document, one pass
   ============================================================
   The review engine (runPlaybookReview — Copilot-assisted with a key, the
   rule engine without) and the filing engine (negoEditClause /
   negoInsertClause) both exist; what never existed was the button between
   them. This pass runs every playbook position over the document and turns
   what it finds into PROPOSALS — each with the position it enforces, a risk
   level, and the playbook's own preferred and fallback wording — and a
   proposal becomes a change only when a person presses File. Nothing
   applies itself: the AI drafts, the human decides, and the fingerprint
   chain records both names. */
const _rlPbNorm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();
/* The verdict's quote is verbatim from the document, so containment finds the
   clause in the ordinary case; the word-overlap fallback covers a quote the
   review trimmed or re-punctuated. Below half overlap nothing is claimed. */
/* ---- IT REFUSES WHEN IT IS NOT SURE (owner-asked 26 Aug 2026) ----
   The cheap half of clause types, and it buys most of their safety for an
   afternoon. Containment is CERTAIN — the quote is verbatim in that clause and
   nothing else is being weighed. The fallback beneath it was a guess, and it
   was loose in three separate ways at once:

     · the bar was HALF the quote's words, which contract clauses share freely
       — payment, party, notice, days, written;
     · a word was counted by `includes`, a SUBSTRING test, so "days" scored
       against "holidays" and "payment" against "prepayment"; and
     · it returned the best clause even when the runner-up was a whisker
       behind, which is a coin toss reported as a finding.

   So: words are matched as WORDS, the bar is RL_PB_MATCH_MIN, and the winner
   must also be RL_PB_MATCH_LEAD clear of whatever came second. Two clauses that
   score alike is exactly the state that must answer "I do not know", because
   the wrong one of them looks identical to the right one. */
const RL_PB_MATCH_MIN = 0.7;    /* of the quote's own long words */
const RL_PB_MATCH_LEAD = 0.15;  /* and clear of the runner-up by this much */
const _rlPbWords = t => new Set(_rlPbNorm(t).split(/[^a-z0-9]+/).filter(Boolean));
/* ---- AND THE RULE'S OWN KIND NARROWS THE GUESS (owner-asked 26 Aug 2026) ----
   The third and last of the playbook-scan fixes. A and the matcher's refusal
   took the reported risk off the table; this is the one that stops the reading
   being statistical — a payment rule may only ever touch a payment clause.

   `category` IS THE RULE'S KIND, so there is nothing to configure: every
   playbook position already names what it governs. Absent, this function
   behaves exactly as it did before kinds existed, which is what keeps every
   older caller untouched.

   THE TWO PATHS ARE TREATED DIFFERENTLY AND THAT IS THE WHOLE SAFETY ARGUMENT:

     · CONTAINMENT IS CERTAINTY AND THE KIND MAY NOT OVERRULE IT — but it is
       certainty about ONE clause only. The same boilerplate sentence can sit
       in two, and the old single pass returned whichever came first, silently.
       So containment now collects its matches: exactly one is returned with
       the kind never consulted; several are broken by kind; and a tie the kind
       cannot break returns null rather than a coin toss, which is this
       matcher's own standing rule.
     · THE OVERLAP SCORE IS A GUESS, so the kind narrows the field before it
       runs. A clause whose kind is UNKNOWN always stays a candidate — an
       unheaded upload types as nothing, and dropping it would make a bad guess
       hide a real finding, which is the mirror of the bug this all began with.

   NARROWING TO NOTHING RETURNS NULL, and null is not lost: `landing` reads it
   as 'unplaced', the rail draws it on neither list, and the whole-document
   Playbook review names it with its quote so the reader can go and look. */
function rlPbFindClause(c, quote, category){
  const q = _rlPbNorm(quote);
  if (!q) return null;
  const clauses = (typeof negoClauseList === 'function') ? negoClauseList(c) : [];
  const want = (typeof window !== 'undefined' && window.ruleKind) ? ruleKind(category) : null;
  const kindOf = cl => (typeof window !== 'undefined' && window.clauseKind) ? clauseKind(cl) : null;

  /* pass 1 — the quote really is in this clause */
  const held = [];
  for (const cl of clauses){
    const l = _rlPbNorm(cl.text);
    if (l && (l.includes(q) || q.includes(l))) held.push(cl);
  }
  if (held.length === 1) return held[0];
  if (held.length > 1){
    if (!want) return held[0];                       /* exactly as it always was */
    const right = held.filter(cl => kindOf(cl) === want);
    return right.length === 1 ? right[0] : null;     /* a tie is still a no */
  }

  /* pass 2 — the guess, over candidates of the right kind */
  const qw = q.split(/[^a-z0-9]+/).filter(w => w.length > 3);
  if (!qw.length) return null;
  const field = !want ? clauses
    : clauses.filter(cl => { const k = kindOf(cl); return !k || k === want; });
  let best = null, bestScore = 0, runnerUp = 0;
  for (const cl of field){
    if (!_rlPbNorm(cl.text)) continue;
    const have = _rlPbWords(cl.text);
    let hit = 0;
    for (const w of qw) if (have.has(w)) hit++;
    const score = hit / qw.length;
    if (score > bestScore){ runnerUp = bestScore; bestScore = score; best = cl; }
    else if (score > runnerUp) runnerUp = score;
  }
  if (bestScore < RL_PB_MATCH_MIN) return null;
  if (bestScore - runnerUp < RL_PB_MATCH_LEAD) return null;   /* a tie is a no */
  return best;
}
/* Review result → the proposal list the modal draws. Pure — no DOM, no
   filing — so the tests can hold it to account without a screen. */
function rlPlaybookProposals(c, rev){
  const out = [];
  const lib = (window.clauseLibrary ? clauseLibrary() : []);
  for (const v of ((rev && rev.verdicts) || [])){
    if (!v || v.status === 'aligned') continue;
    const cl = v.quote ? rlPbFindClause(c, v.quote, v.category) : null;
    const libCl = lib.find(x => _rlPbNorm(x.category) === _rlPbNorm(v.category)
      || _rlPbNorm(x.name) === _rlPbNorm(v.category)) || null;
    /* ---- OUR WORDING AND THE MODEL'S ARE TWO DIFFERENT THINGS ----
       (owner-reported 26 Aug 2026, off a lease whose data-protection card
       offered to insert a GDPR paragraph.) `preferred` used to read
       `v.redline || libCl.preferred` — the MODEL'S suggestion first — and every
       surface then printed it under a button reading "Use our standard". So a
       workspace whose approved position is the Data Protection Act, 2019 was
       shown Copilot's improvisation, citing the wrong country's regime, wearing
       a label that says somebody here approved it. The reader had no way to
       tell the two apart, and the one that WAS approved sat on the quieter
       button beside it.

       THREE NAMED WORDINGS NOW, AND NOTHING IS LOST. `preferred` and
       `fallback` are the clause library's — the workspace's own, approved,
       editable in Settings — and `draft` is what Copilot wrote. Each keeps its
       own slot, so a surface can offer all three and NAME each one; what it may
       no longer do is print one under the other's name. A draft that merely
       repeats a library wording is dropped rather than drawn twice.

       `lead` is which of the three a card should PREVIEW, in that order, so the
       preview and the first button can never disagree about what a press does.
       It is deliberately not "whichever is best" — that judgement belongs to
       whoever is reading, and the three buttons are how they make it. */
    const preferred = String((libCl && libCl.preferred) || '').trim();
    let fallback = String((libCl && libCl.fallback) || '').trim();
    if (fallback && fallback === preferred) fallback = '';
    let draft = String((v && v.redline) || '').trim();
    if (draft && (draft === preferred || draft === fallback)) draft = '';
    if (!preferred && !fallback && !draft) continue;   // review-only verdict — nothing proposable
    /* ---- WHERE THIS PROPOSAL MAY LAND, and there are THREE answers ----
       A located clause is EDITED. A standard the scan found nowhere in the
       document is ADDED. And a deviation we could not place is NEITHER: we know
       the wording is in the contract and not which clause holds it, so editing
       would land on the wrong one and adding would put a second copy of a
       clause the document already has.

       That third state is not new — a quote the scan trimmed has always failed
       to match — but it used to fall through to the insert, silently. Naming it
       is what lets the rail, the review modal and the filing path all refuse
       the same thing for the same reason. */
    const landing = cl ? 'edit' : (v.status === 'missing' ? 'add' : 'unplaced');
    out.push({ v, clauseId: cl ? cl.clauseId : null,
      clauseLabel: cl && window.negoClauseLabel ? negoClauseLabel(cl) : '',
      oldText: cl ? cl.text : '',
      preferred, fallback, draft, landing,
      lead: preferred || fallback || draft,
      leadKind: preferred ? 'standard' : (fallback ? 'fallback' : 'draft'),
      risk: v.escalate ? 'high' : 'medium' });
  }
  return out;
}
/* WHOSE WORDING IS THIS — ONE NAMING, EVERY SURFACE. The clause editor's scan
   rail and the Playbook review modal both print it, and a second copy is how
   two screens come to call the same thing by two different names. A getter map
   is deliberately NOT used: this resolves at the moment it is read, so it
   follows a reader who switches language mid-sitting. */
const RL_PB_WORDING_KEY = { standard: 'pb_w_ours', fallback: 'pb_w_fallback', draft: 'pb_w_draft' };
function rlPbWordingLabel(kind){
  return i18t(RL_PB_WORDING_KEY[kind] || RL_PB_WORDING_KEY.standard);
}
/* File one proposal. A located clause is a modify through negoEditClause —
   merged into the clause's own markup — and a missing position is an insert
   at the end, both wearing a note that names the playbook position they
   enforce. The same verbs a person's own edit uses; nothing new to audit. */
async function rlFilePlaybookProposal(c, item, wording){
  const words = String(wording == null ? '' : wording).trim();
  if (!words) return null;
  /* THE WALL, not a decision about pixels. A deviation nobody could place has
     no clause to edit and must not be added, or the contract grows a second
     copy of a clause it already carries. Every surface that offers this act
     asks the same reading first; this is what holds if one forgets. */
  if (item && item.landing === 'unplaced') return null;
  const author = (window.currentUser && currentUser()?.name) || 'This workspace';
  const note = `Playbook — ${item.v.category}${item.v.escalate ? ' (escalation position)' : ''}${
    item.v.position ? ': ' + String(item.v.position).slice(0, 300) : ''}`;
  if (item.clauseId && window.negoEditClause && window.negoRichFromLines)
    return await negoEditClause(c, item.clauseId, negoRichFromLines(words), { side: 'owner', author, note });
  if (window.negoInsertClause){
    /* ---- BEFORE THE SIGNATURES, NEVER AFTER ----
       A new operative clause anchors after the LAST clause ahead of the
       execution wording — text below the signature blocks can be argued as
       outside what was signed, so "at the end" must mean the end of the
       terms, not the end of the paper. The walk stops at the FIRST clause
       carrying a signature marker anywhere in its text, because a document
       whose segmentation folded the signature lines into its final clause
       must still keep the insert ahead of them. */
    const clauses = (typeof negoClauseList === 'function') ? negoClauseList(c) : [];
    const hasBoiler = cl => /\b(signed for|in witness|witnesseth)\b|signature:\s/i
      .test(String((cl && cl.text) || '') + ' ' + String((cl && cl.headingText) || ''));
    let after = null;
    for (const cl of clauses){ if (hasBoiler(cl)) break; after = cl.clauseId; }
    if (after == null && clauses.length) after = clauses[clauses.length - 1].clauseId;
    const body = window.textToRich ? textToRich(words) : `<p>${_ne(words)}</p>`;
    /* ---- THE HEADING MATCHES THE PAPER IT IS JOINING (owner-reported 26 Aug
       2026: "the added clause has all caps in the header while the contract's
       structure is not all caps") ----
       It was `.toUpperCase()`, unconditionally, so "Liability cap" arrived as
       "LIABILITY CAP" in a contract whose own headings read "4. Liability &
       Governing Law" — the one line on the clause that announced it had been
       added by a machine.

       THE CATEGORY IS ALREADY WRITTEN SENSIBLY. It comes off the clause
       library, typed by an admin ("Payment terms", "Data protection"), so this
       is not a rewrite so much as the removal of one — what is left is a
       reading of what the DOCUMENT does with a heading, and a document with
       nothing to read answers null and the category stands exactly as typed.

       NO NUMBER IS ADDED, owner-ruled the same day. */
    const heading = window.clauseHeadingFor
      ? clauseHeadingFor(String(item.v.category || ''), clauses)
      : String(item.v.category || '');
    return await negoInsertClause(c, after, { headingText: heading, bodyHtml: body },
      { side: 'owner', author, note,
        summary: `Playbook position inserted — ${item.v.category}` });
  }
  return null;
}
/* The pass, end to end: run the review, propose, and let the reader rule. */
async function rlOpenPlaybookReview(c, again){
  if (!window.runPlaybookReview || !window.openModal){
    if (window.toast) toast(i18t('ng_playbook_not_loaded'), 'err');
    return;
  }
  const btn = document.querySelector('[data-rl-pbreview]');
  const restore = btn ? btn.innerHTML : '';
  if (btn){ btn.disabled = true; btn.innerHTML = '&#10022; Reviewing&hellip;'; }
  let rev = null, err = null;
  try{ rev = await runPlaybookReview(c); }catch(e){ err = e; }
  if (btn){ btn.disabled = false; btn.innerHTML = restore; }
  if (err || !rev || !Array.isArray(rev.verdicts)){
    if (window.toast) toast(i18t('ng_review_failed') + ((err && err.message) || 'no usable result'), 'err');
    return;
  }
  c.playbook = rev;
  if (window.logAudit) logAudit(c, 'Playbook',
    `Playbook review run from the Redline bench — ${rev.verdicts.length} position${rev.verdicts.length === 1 ? '' : 's'} checked (${rev.source === 'ai' ? 'Copilot-assisted' : 'rule-based'})`);
  if (window.persist) persist(c);
  const items = rlPlaybookProposals(c, rev);
  const aligned = rev.verdicts.filter(v => v.status === 'aligned').length;
  if (!items.length){
    /* 'ok' on the aligned case, 'warn' on the other: a bare call prints
       nothing, so the pass's BEST outcome — the contract agrees with every one
       of our own positions — was the one the reader never heard. */
    if (window.toast) toast(aligned === rev.verdicts.length
      ? i18t('ng_pb_all_aligned') : i18t('ng_pb_nothing_proposable'),
      aligned === rev.verdicts.length ? 'ok' : 'warn');
    if (again) again();
    return;
  }
  const chip = it => it.risk === 'high'
    ? `<span style="font-size:var(--t-figure);font-weight:var(--w-title);padding:2px 7px;border-radius:var(--radius);background:var(--st-ruby-bg,#fee2e2);color:var(--st-ruby-fg,var(--danger-hover))">${i18t('ng_high_risk')}</span>`
    : `<span style="font-size:var(--t-figure);font-weight:var(--w-title);padding:2px 7px;border-radius:var(--radius);background:var(--st-amber-bg,var(--st-amber-bg));color:var(--st-amber-fg,var(--st-amber-fg))">${i18t('ng_medium')}</span>`;
  const itemHtml = (it, i) => `<div id="pbr-item-${i}" style="border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-3) 14px;margin-bottom:10px;background:var(--color-surface)">
    <div style="display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap">
      <b style="font-size:var(--t-body)">${_ne(it.v.category)}</b>${chip(it)}
      <span style="font-size:var(--t-label);color:var(--color-neutral-500)">${it.v.status === 'missing'
        ? 'missing — files as a new clause at the end'
        : (it.clauseLabel ? `deviation &middot; ${_ne(it.clauseLabel)}` : 'deviation')}</span>
    </div>
    ${it.v.position ? `<div style="font-size:var(--t-meta);color:var(--color-neutral-600);margin-top:5px;line-height:1.5">${_ne(String(it.v.position))}</div>` : ''}
    ${''/* THE PREVIEW NAMES WHOSE WORDING IT IS, and it draws `lead` — the same
           order the buttons run in — so the picture and the first press can
           never describe different wording. */}
    <div style="margin-top:var(--s-2);font-size:var(--t-figure);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600)">${_ne(rlPbWordingLabel(it.leadKind))}</div>
    ${it.oldText && window.redlineStructuredHtml
      ? `<div style="margin-top:4px;font-size:var(--t-meta);line-height:1.7;border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2) 10px;max-height:150px;overflow:auto">${redlineStructuredHtml(it.oldText, it.lead)}</div>`
      : `<div style="margin-top:4px;font-size:var(--t-meta);line-height:1.6;border:1px solid var(--color-divider);border-radius:var(--radius);padding:var(--s-2) 10px;max-height:150px;overflow:auto">${_ne(it.lead)}</div>`}
    ${''/* A BUTTON IS DRAWN ONLY WHERE ITS WORDING EXISTS. The preferred one
           used to draw unconditionally, so a position the clause library has
           no entry for offered a press that files nothing. */}
    ${''/* AN UNPLACED DEVIATION IS A FINDING, NOT A PROPOSAL. Neither verb is
           safe on it, and a control whose one outcome is a refusal is
           furniture — so it draws none and says what to do instead. The quote
           above is what tells the reader where to look. */}
    ${it.landing === 'unplaced'
      ? `<div style="margin-top:9px;font-size:var(--t-meta);line-height:1.5;color:var(--color-neutral-600)">${i18t('ng_pb_unplaced')}</div>`
      : `<div style="display:flex;justify-content:flex-end;gap:6px;margin-top:9px;flex-wrap:wrap" data-pbr-verbs="${i}">
      <button data-pbr-skip="${i}" class="ui-btn" style="font-size:var(--t-label);padding:var(--s-1) 11px">${i18t('ng_skip')}</button>
      ${it.draft ? `<button data-pbr-draft="${i}" class="ui-btn" style="font-size:var(--t-label);padding:var(--s-1) 11px" title="${_nea(i18t('ng_file_draft_title'))}">${i18t('ng_file_draft')}</button>` : ''}
      ${it.fallback ? `<button data-pbr-fb="${i}" class="ui-btn" style="font-size:var(--t-label);padding:var(--s-1) 11px" title="${i18t('ng_file_fallback_title')}">${i18t('ng_file_fallback')}</button>` : ''}
      ${it.preferred ? `<button data-pbr-go="${i}" class="ui-btn ui-btn-primary" style="font-size:var(--t-label);padding:var(--s-1) 11px" title="${_nea(i18t('ng_file_preferred_title'))}">${i18t('ng_file_preferred')}</button>` : ''}
    </div>`}
  </div>`;
  openModal(`<div style="padding:20px var(--s-6);max-height:calc(100vh - 80px);overflow-y:auto">
    <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-1)">&#10022; ${i18tn('ng_playbook_review',items.length,{n:items.length})}</h2>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 14px;line-height:1.55">${aligned} position${aligned === 1 ? '' : 's'} aligned${rev.source === 'ai' ? ' &middot; Copilot-assisted review' : ' &middot; rule-based review'}. A proposal files as an ordinary fingerprinted change only when you press it — nothing applies itself. <b>${i18t('ng_preferred')}</b> ${i18t('ng_opening_position')} <b>fallback</b> ${i18t('ng_concession_allowed')} ${i18t('ng_draft_is_copilots')}</p>
    ${items.map(itemHtml).join('')}
    <div style="display:flex;justify-content:flex-end"><button id="pbr-close" class="ui-btn">${i18t('act_close')}</button></div>
  </div>`, { maxWidth: '780px' });
  const root = document.getElementById('modal-root') || document;
  const settle = (i, text, tone) => {
    const verbs = root.querySelector(`[data-pbr-verbs="${i}"]`);
    if (verbs) verbs.innerHTML = `<span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:${tone}">${text}</span>`;
  };
  const fileFrom = async (b, attr, wordingOf) => {
    const i = Number(b.getAttribute(attr));
    const it = items[i];
    if (!it) return;
    b.disabled = true;
    let ch = null;
    try{ ch = await rlFilePlaybookProposal(c, it, wordingOf(it)); }
    catch(e){ if (window.toast) toast(i18t('ng_could_not_file') + ((e && e.message) || e), 'err'); b.disabled = false; return; }
    if (!ch){ if (window.toast) toast(i18t('ng_proposal_not_filed'), 'err'); b.disabled = false; return; }
    if (window.persist) persist(c);
    settle(i, `Filed as #${_ne(ch.id)} &#10003;`, 'var(--st-green-fg,#047857)');
    if (again) again();
  };
  root.querySelectorAll('[data-pbr-go]').forEach(b =>
    b.addEventListener('click', () => fileFrom(b, 'data-pbr-go', it => it.preferred)));
  root.querySelectorAll('[data-pbr-fb]').forEach(b =>
    b.addEventListener('click', () => fileFrom(b, 'data-pbr-fb', it => it.fallback)));
  root.querySelectorAll('[data-pbr-draft]').forEach(b =>
    b.addEventListener('click', () => fileFrom(b, 'data-pbr-draft', it => it.draft)));
  root.querySelectorAll('[data-pbr-skip]').forEach(b => b.addEventListener('click', () =>
    settle(Number(b.getAttribute('data-pbr-skip')), 'Skipped', 'var(--color-neutral-500)')));
  root.querySelector('#pbr-close')?.addEventListener('click', () => { if (window.closeModal) closeModal(); });
}
/* ============================================================
   THE VIEW WALL — what each side of the toggle is allowed to see
   ============================================================
   The workbench's Internal/Counterparty toggle is a promise: Counterparty View
   is EXACTLY what they see, and nothing on that side may reveal that anything
   else exists. The reference states it in its own banner — "internal threads,
   notes and unsent drafts are not here".

   That promise was only half kept. The turn model already meant an unsent ask
   never TRAVELS (negoUnsentAsks measures against the hand-over timestamp, and
   the share payload is built from the record) — but the TOGGLE ignored it: the
   document canvas, the Tracked Changes column, the thread list and the wall
   banner all rendered the same set whichever side was looking. Flip to
   Counterparty View with a draft on the table and the draft was right there,
   marked in the document with "Your ask" beside it. The wall held at the
   transport and leaked at the preview — and the preview is the thing a person
   checks BEFORE sending, so it is exactly where the truth matters.

   These two helpers are the wall, and every renderer on this page draws
   through them:

     rlHiddenFrom(c, side)  — the change ids this side must not see: the OTHER
       side's unsent asks, read from negoUnsentAsks so the wall, the badges and
       the batch count can never disagree about what has been sent.
     rlMsgVisible(m, side)  — a thread message is visible if it is shared, or
       if it belongs to the side that is looking. Symmetric on purpose: an
       owner's internal note never shows in Counterparty View, and a note
       filed while acting as the counterparty never shows in Internal View. */
/* ---- THE WALL HID THE OTHER SIDE'S ASKS FROM THE PERSON THEY WERE SENT TO ----

   The wall's job is one thing: keep MY unsent drafts out of the preview of
   THEIR seat. It was written as "hide the other side's unsent asks", which
   sounds the same and is not, because unsent-ness is only meaningful about
   your own drafts. negoUnsentAsks reads "pending and created after the last
   hand-over" — and a counterparty ask arriving on the owner's record is
   re-filed through negoFileChange, which stamps createdAt = NOW. So it is
   always created after the hand-over.

   It survived because negoTurnBack normally advances the turn stamp on
   receipt — but ONLY when the turn is currently theirs. On the second answer
   in a row the turn is already ours, the stamp does not move, and their new
   ask is read as their unsent draft and walled off the very person it was
   sent to. Reproduced: the change is on the record with its reason, the
   Negotiate tab counts it, and no card is drawn for it anywhere.

   negoUnsentAsks already carries this reasoning in its own comment, for the
   case where there is no turn stamp at all: "a change of theirs is on our
   record only because it was sent to us, whatever the turn stamp says." That
   is true whatever the turn stamp says — including when there is one. Applied
   here rather than in the model, because the model's answer is also read by
   the batch send and the wall counts, which do mean their own side's drafts. */
function rlHiddenFrom(c, side){
  const other = side === 'counterparty' ? 'owner' : 'counterparty';
  const home = (typeof PORTAL_MODE !== 'undefined' && PORTAL_MODE) ? 'counterparty' : 'owner';
  /* Only the side whose record this IS can have unsent drafts on it. The other
     side's changes are here because they were sent. */
  if (other !== home) return new Set();
  return new Set((window.negoUnsentAsks ? negoUnsentAsks(c, other) : []).map(x => x.id));
}
const rlMsgVisible = (m, side) =>
  !!m && (m.visibility === 'shared' || (m.side || 'owner') === (side === 'counterparty' ? 'counterparty' : 'owner'));
/* ---------- THE CARD SHOWS THE CHANGE, NOT THE CLAUSE ----------
   A card used to render the whole ops array, keeps included — so a one-word
   amendment to a four-line clause arrived as four lines of unchanged wording
   with two marked words somewhere inside it. The column is called Tracked
   Changes and it was mostly tracked sameness: the reader had to find the
   delta in the card before they could judge it, which is the job the card
   exists to do for them.

   So the keeps are dropped and only the marked runs survive. Where a keep sat
   BETWEEN two marked runs it leaves an ellipsis, because two edits at opposite
   ends of a clause and two edits in the same sentence are different facts and
   a card that ran them together would assert the second. Leading and trailing
   keeps leave nothing — there is no information in "the clause continues".

   The full clause is never more than a glance away: it is on the left, framed,
   and clicking the card scrolls to it.

   Ops with no marked run at all cannot happen through negoFileChange, which
   refuses to file a no-op — but a record from an older build might, and an
   empty card would be worse than a verbose one, so that falls back whole. */
function rlDeltaOps(ops){
  const all = Array.isArray(ops) ? ops : [];
  const marked = all.filter(o => o && (o.op === 'ins' || o.op === 'del'));
  if (!marked.length) return all;
  const out = [];
  let gap = false;
  for (const o of all){
    if (!o) continue;
    if (o.op === 'keep'){ if (out.length) gap = true; continue; }
    if (gap) out.push({ op: 'keep', text: ' … ' });
    gap = false;
    out.push(o);
  }
  return out;
}
/* WHICH CHANGES GET A CARD, as one answer. The stack and the tab pill both
   read it, because a pill that counts something narrower than the list it
   labels is a pill that says "nothing arrived" over four cards. */
function redlineCardIds(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const all = (typeof negoChanges === 'function') ? negoChanges(c) : [];
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  const heldIds = new Set(opts.holdsDecisions ? (opts.heldDecisionIds || []) : []);
  const sentIds = new Set(opts.sentDecisionIds || []);
  const contestedAny = x => x && x.status === 'rejected' && !x.withdrawn;
  const mineOnly = rlMyCardIds(c, opts);
  /* READ ONCE AND SHARED WITH THE CARDS, so the pill above the column and the
     column itself cannot disagree about either the population or the order. */
  const bandOpts = rlBandOpts(c, opts, side);
  const kept = all.filter(x => (_rlIsLive(x) || heldIds.has(x.id) || contestedAny(x)
    || (bandOpts.banded && _rlSettledCard(x)) || sentIds.has(x.id)) && !hidden.has(x.id)
    && (!mineOnly || mineOnly.has(String(x.id)))
    /* The reader's own cut, applied HERE as well as in the card list — this
       function is what the count above the cards is drawn from, and a count
       that ignored the filter would label a column it was not describing.
       Not applied to a reviewer's narrowed column: opts.countAll lets the
       chips ask for the unfiltered totals they print. */
    && (opts.countAll || rlCardFilterPass(x, side)));
  /* THE SAME ORDER THE STACK DRAWS. This function is the stack's own predicate
     and it is also what the pill counts — so it sorts as well as filters, or
     the two lists would agree about the population and disagree about the
     sequence. Sorting cannot change the length, so every chip's number is
     untouched. See rlCardSort. */
  return rlCardSort(kept, heldIds, bandOpts).map(x => x.id);
}
/* ---- YOU WERE ASKED TO LOOK AT A CLAUSE, NOT TO RUN THE ROUND ----
   While a review is open with this person, nothing they do on this contract
   reaches the counterparty: no answering the other side's proposals, no sending
   a change, no publishing the round. They keep the two things the job needs —
   ruling on their own clauses and correcting that wording — and everything
   returns the moment they hand back.

   Not asked on the counterparty's own seat: that is a different company's
   reader, they have no internal review here, and reviewActorHeld would be
   answering about the wrong person entirely. */
/* ---- THE CARDS THIS READER WAS HANDED ----
   Null means "everything", which is every reader who is not reviewing anything
   here. A reviewer gets the ids in their own open reviews and nothing else: the
   round's other work is not their job and, in the case of somebody else's
   escalated clause, not their business either. Asked on all three card
   surfaces, because the tab's count and the two card renderers must agree about
   what is on the page — a pill that counts four over one card is the fault
   redlineCardIds exists to prevent. */
function rlMyCardIds(c, opts = {}){
  if (opts.side === 'counterparty' || opts.readonly) return null;
  if (typeof window.reviewMyChangeIds !== 'function') return null;
  try{ return reviewMyChangeIds(c); }catch(_){ return null; }
}
/* Which clauses this reader's document should show, or null for all of them.
   Built from the CHANGES they were handed — a clause is theirs when one of
   their changes sits on it. Returns null when they are reviewing nothing here,
   or when they have opened the whole contract. */
/* The one control. Drawn only for a reviewer, and it says how much is folded —
   a document that quietly showed one clause of forty would read as a broken
   page rather than as a focused one. */
function rlRvDocNoticeHtml(c, opts, hiddenCount){
  if (!rlMyCardIds(c, opts)) return '';
  const full = rlRvFullDoc();
  return `<div class="rl-rv-docnote" data-rv-docnote="${full ? 'full' : 'folded'}">
    <span>${_ne(full ? i18t('rv_doc_showing_all') : i18tn('rv_doc_showing_yours', hiddenCount, { n: hiddenCount }))}</span>
    <button type="button" data-rl-rv-fulldoc="${full ? '0' : '1'}">${
      _ne(full ? i18t('rv_doc_back_to_yours') : i18t('rv_doc_show_all'))}</button>
  </div>`;
}
function rlRvDocClauses(c, opts = {}){
  const ids = rlMyCardIds(c, opts);
  if (!ids || rlRvFullDoc()) return null;
  const all = (typeof negoChanges === 'function') ? negoChanges(c) : [];
  const out = new Set();
  all.forEach(x => { if (x && ids.has(String(x.id)) && x.clauseId) out.add(String(x.clauseId)); });
  return out;
}
/* ---- ONE NOTICE SLOT, AND THE MOST RESTRICTIVE THING IN IT ----
   The brief this feature was designed against (Young, 09 Aug 2026) is that
   more information must not push the contract off the page. The review banner
   already owns one band above the negotiation; the desk needed to say something
   too, and the obvious answer — a second band — is how a page ends up with five
   strips of chrome above the first word of an agreement.

   So there is ONE slot and both features draw into it, most restrictive first.
   A review hold is a refusal the reader can act on and outranks "you are only
   reading here", which is a standing state they can do one thing about. Where
   the review has something to say, the desk says nothing: a reader who is also
   holding a clause has one sentence to read, not two.

   BOTH DRAW SITES CALL THIS — the contract tab's panes and the workbench —
   because a fix in one is not a fix in the other. That is the duplication rule
   this codebase states at the top of its own map. */
function rlOneNoticeHtml(c, opts = {}){
  const rv = (window.reviewBannerHtml ? reviewBannerHtml(c, opts) : '') || '';
  if (rv) return rv;
  return (window.deskNoticeHtml ? deskNoticeHtml(c, opts) : '') || '';
}

/* ---------- AND NONE OF IT SITS ON TOP OF THE CONTRACT ----------
   Every notice this page raises used to be a full-width band above the
   document: a review handed back, a desk you are only reading, the reading
   you have switched to. Reported as exactly that (Young, 10 Aug 2026) — "these
   pop ups should never appear on top of the contract" — and it is the right
   complaint. A band is permanent furniture, it pushes the agreement down the
   screen for the whole sitting, and the thing it is announcing is usually
   news: true for a minute, then just a thing in the way.

   So they float, bottom-right, over the page rather than above it, and every
   one of them can be cleared. They are the same builders — the review's banner
   is still reviewBannerHtml, with its own ✕ and its own rules about who may
   see it — only their place on the screen has moved.

   ONE STACK, BUILT HERE rather than in renderRedline, so the counterparty's
   embed and the room get it too. Nothing in it is drawn twice: the page's own
   copy was removed when this arrived. */
/* ---- AND THE ALERTS ARRIVE FOLDED, BEHIND A BELL ----
   The next complaint in the same series (Young, 10 Aug 2026): "these alerts
   should be in a small icon on the bottom right so you can summon them or
   minimize them. They should not be sitting there visible constantly." A card
   that floats clear of the sheet still sits on the screen for the whole
   sitting, and a review that came back days ago does not need to.

   So the review's and the desk's notices fold to one small bell, bottom-right.
   Pressing the bell opens them; a Hide chip folds them again; the per-notice ✕
   (the review's and the desk's own clears) still remove one for the sitting.
   The fold is per contract, in memory, never persisted — same rules as the
   clears, and for the same reason.

   THE READING NOTICE IS NOT AN ALERT AND DOES NOT FOLD. "As agreed" quietly
   hiding the document's strikes is the most expensive thing this page could
   get wrong (see rlReadNoticeHtml — f84 pins it), it only exists because the
   reader pressed a reading button seconds ago, and it vanishes the moment they
   press back. It stays drawn whenever a non-default reading is on. */
const _rlNoticeFold = new Map();
function rlNoticesFolded(c){
  const k = String((c && c.id) || '');
  if (_rlNoticeFold.has(k)) return !!_rlNoticeFold.get(k);       // the reader has decided
  /* ---- ONE EXCEPTION TO "FOLDED UNTIL SUMMONED" (12 Aug 2026) ----
     A review that is still IN PLAY is not news; it is a job with a name on it,
     and it is the one notice carrying a control — Cancel — that its own reader
     has to be able to find. Folded behind the bell, that button existed and
     effectively nobody could reach it, and the review read as one that could
     not be called off. So while a review is open with this reader (theirs to
     rule on, or theirs to call off) the stack arrives OPEN, and the moment they
     fold it the decision above wins for the rest of the sitting.

     Everything else still arrives folded: a review that came back days ago, a
     desk notice, a readiness signal. reviewWantsAttention answers only for
     reviews still in play — see reviewInPlay, which is what "spent" is measured
     against. */
  try{ if (window.reviewWantsAttention && reviewWantsAttention(c)) return false; }catch(_){}
  return true;                                                    // folded until summoned
}
function rlSetNoticesFolded(cOrId, v){
  const k = (cOrId && typeof cOrId === 'object') ? String(cOrId.id || '') : String(cOrId || '');
  _rlNoticeFold.set(k, !!v);
}
/* ============================================================
   THE BELL GOES GREEN WHEN THEY SAY THEY ARE READY (owner-asked 23 Aug 2026)
   ============================================================
   "When the counterparty has signalled that they are ready to sign, the bell
   should loudly turn green and blink. You can click on the bell to see the
   alert then it goes back to yellow."

   TWO DIFFERENT THINGS, AND KEEPING THEM APART IS THE WHOLE DESIGN. Amber means
   THERE IS WORK — it clears when the work does, and this codebase's standing
   rule is that nothing marks an alert as seen, because a dot cleared by looking
   is how the old header dot became invisible. Green means THERE IS NEWS YOU
   HAVE NOT SEEN, and news is precisely the thing that a look does settle. So
   the green clears on a press and the amber bell, with the notice still behind
   it, does not.

   REMEMBERED AGAINST THE SIGNAL ITSELF, not against the contract (owner-chose,
   23 Aug 2026). The key carries the moment they signalled, so seeing THIS one
   silences it for good — and if the deal reopens and they later signal again,
   that is a new moment, a new key, and the bell goes green again for it. A
   per-contract flag could not tell the second signal from the first.

   IN localStorage, not in memory: "until they signal again" has to outlive a
   reload or the bell cries wolf every morning. Guarded, because a browser with
   storage disabled must still draw the page — it simply forgets, which is the
   safe direction (it goes green once more, never silently never). */
const RL_READ_SEEN_KEY = 'hati.v1.cpReadySeen';
function _rlReadySig(c){
  if (!window.negoReadySignal) return null;
  let sig = null;
  try { sig = negoReadySignal(c, 'counterparty'); } catch(_){ sig = null; }
  return (sig && !sig.stale) ? sig : null;
}
/* The signal's own identity: the contract and the moment. */
const _rlReadyKey = (c, sig) => String((c && c.id) || '') + '|' + String((sig && sig.at) || '');
function rlReadySeen(c){
  const sig = _rlReadySig(c);
  if (!sig) return true;                       // nothing to have seen
  try {
    const raw = localStorage.getItem(RL_READ_SEEN_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    return !!seen[_rlReadyKey(c, sig)];
  } catch(_){ return false; }
}
function rlMarkReadySeen(c){
  const sig = _rlReadySig(c);
  if (!sig) return;
  try {
    const raw = localStorage.getItem(RL_READ_SEEN_KEY);
    const seen = raw ? JSON.parse(raw) : {};
    seen[_rlReadyKey(c, sig)] = 1;
    /* A workspace runs for years and this map only ever grows. Trimmed to the
       most recent entries — losing an old one costs one extra green bell on a
       contract nobody has touched in months, which is the harmless direction. */
    const ks = Object.keys(seen);
    if (ks.length > 200) ks.slice(0, ks.length - 200).forEach(k => { delete seen[k]; });
    localStorage.setItem(RL_READ_SEEN_KEY, JSON.stringify(seen));
  } catch(_){}
}
/* Is the bell shouting? Only while there is an unseen, un-stale signal. */
const rlBellIsNews = c => !!_rlReadySig(c) && !rlReadySeen(c);
/* Wired ONCE, by delegation on the document — the same pattern (and reason) as
   the reading buttons above: the stack is painted into the mount after the
   page wires itself, and repainted by several paths, so an element-bound
   listener is dropped by the first of them. */
if (typeof document !== 'undefined' && !document._rlNoticeFoldWired){
  document._rlNoticeFoldWired = true;
  document.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const hit = t.closest('[data-rl-alerts-open]');
    if (hit){
      ev.preventDefault();
      /* ---- THE PANEL IS THE PRODUCT'S, NOT THIS PAGE'S ----
         openPanel is app.js's, reached through window because these are ES
         modules: a bare call would throw on the counterparty's page and on
         every node stage that mounts these panes without the shell. Where it is
         absent the press does nothing rather than half-opening something. */
      if (typeof window.openPanel !== 'function') return;
      openPanel('alerts');
      /* ---- SEEING IT IS THE PANEL'S JOB, AND THE BELL FOLLOWS ----
         renderContextPanel marks the readiness news seen as it paints, so that
         the row gets to flash exactly once — the flash is the whole point of
         opening it. By the time this line runs the fact has moved, and the bell
         has to be repainted or it holds a green it no longer means. */
      rlRepaintFrom(hit);
      return;
    }
    /* ---- AND THE PHONE STILL FOLDS, WHICH IS WHY THIS BRANCH SURVIVES ----
       mNoticeStackHtml builds its own stack with its own bell and its own Hide
       chip, and there is no alerts panel on that shell to send anybody to. The
       desktop page stopped emitting these two attributes on 23 Aug 2026; the
       phone did not, and deleting the handler with them left its bell a dead
       press — caught by room-order-and-notices-verify, which drives the real
       phone shell. */
    const open = t.closest('[data-rl-notices-open]');
    const shut = !open && t.closest('[data-rl-notices-min]');
    if (!open && !shut) return;
    ev.preventDefault();
    const cid = open ? open.getAttribute('data-rl-notices-open')
      : shut.getAttribute('data-rl-notices-min');
    /* OPENING IT IS SEEING IT — only on the way open, and only for the green
       half. The amber bell and the notice behind it are about the WORK, which
       is settled by issuing the signing link, not by looking. */
    if (open && typeof rlMarkReadySeen === 'function'){
      const c = (typeof getContract === 'function') ? getContract(cid) : null;
      if (c) rlMarkReadySeen(c);
    }
    rlSetNoticesFolded(cid, !open);
    rlRepaintFrom(open || shut);
  });
}
/* ---- WHOSE ASKS: WIRED ONCE, ON THE DOCUMENT ----
   The reading buttons' own pattern, and for the same reason: the chips are
   painted into the mount by redlinePanesHtml, after the page has wired itself,
   and several paths repaint that mount — an element-bound listener is dropped
   by the first of them. The "show me all of them" button on the filtered-empty
   state carries the same attribute, so it is the same door. */
/* ---- WHICH WAY THE ⋯ MENU OPENS, MEASURED (owner-asked 26 Aug 2026) ----
   "The dropdown always has to be fully visible. If you are at the bottom of
   the page then the dropdown should drop up so that all the choices are never
   hidden."

   IT IS MEASURED, NEVER GUESSED. A media query cannot answer this: the menu's
   height depends on how many rows that particular change earned, and the room
   below it depends on where the card sits in a column the reader has scrolled.
   Both are facts only the browser holds, and only once the menu is on screen —
   which is why this runs AFTER the unhide, on a menu whose box is real.

   THE ROOM IS THE SCROLLER'S, NOT THE WINDOW'S. The cards live in their own
   scrolling column inside the page; a menu that cleared the bottom of the
   WINDOW could still be clipped by the column two hundred pixels above it. So
   the bound is the nearest scrolling ancestor's own rect where there is one,
   and the viewport only where there is not.

   AND FLIPPING IS NOT ALWAYS ENOUGH, which is the half a first pass would
   miss: on a short window a long menu fits in neither direction, and flipping
   it there only changes WHICH rows are lost. So it also caps its own height to
   the room actually available and scrolls inside it — the owner's "never
   hidden" is the requirement, and up-or-down is only one of its two answers.
   It prefers DOWN on a tie, because that is where a menu is expected. */
function rlMorePlace(btn, menu){
  if (!btn || !menu || !menu.getBoundingClientRect) return;
  menu.classList.remove('rl-more-up');
  menu.style.removeProperty('--rl-more-max');
  const anchor = btn.getBoundingClientRect();
  /* The nearest ancestor that actually scrolls — the card column — else the
     window. `overflow` covers auto, scroll and hidden alike: a clipped box is
     just as good at hiding the last row as a scrolling one. */
  let bound = null;
  for (let el = btn.parentElement; el && el !== document.body; el = el.parentElement){
    let ov = '';
    try{ const cs = getComputedStyle(el); ov = cs.overflowY + ' ' + cs.overflow; }catch(_){ break; }
    if (/auto|scroll|hidden/.test(ov) && el.scrollHeight > el.clientHeight + 1){
      bound = el.getBoundingClientRect();
      break;
    }
  }
  const top = bound ? bound.top : 0;
  const bottom = bound ? bound.bottom : (window.innerHeight || document.documentElement.clientHeight || 0);
  const GAP = 8;                                   // never flush against the edge
  const below = bottom - anchor.bottom - GAP;
  const above = anchor.top - top - GAP;
  const want = menu.scrollHeight;
  /* Down unless it genuinely does not fit AND up is the roomier of the two. */
  const up = want > below && above > below;
  if (up) menu.classList.add('rl-more-up');
  const room = Math.max(96, Math.floor(up ? above : below));
  if (want > room) menu.style.setProperty('--rl-more-max', room + 'px');
}

/* ---- THE CARD'S OVERFLOW MENU, ARMED ONCE AT MODULE LOAD ----
   On `document`, never inside a renderer: a listener registered by the owner's
   page cannot belong to another mount, and that exact fault made the unsent
   band's Send dead on the counterparty's seat for a day (15 Aug 2026). One
   menu open at a time — a column of six with three menus hanging off it is a
   column nobody can read.

   IT DECIDES NOTHING. Every row inside carries a data attribute some other
   handler already binds, so this listener's whole job is showing and hiding;
   a press on a row falls through to the handler that owns that act, which is
   why the rows are NOT stopped here. */
if (typeof document !== 'undefined' && !document._rlMoreWired){
  document._rlMoreWired = true;
  const shut = except => document.querySelectorAll('.rl-more-menu').forEach(m => {
    if (m === except) return;
    m.hidden = true;
    const b = m.parentElement && m.parentElement.querySelector('.rl-more-btn');
    if (b) b.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const btn = t.closest('.rl-more-btn');
    if (btn){
      /* STILL STOPPED, and for a new reason. It used to be stopped so the
         press would NOT navigate ("the card's own head navigates, so this
         press must not also travel"). The owner has reversed that half — see
         below — so the stop is now only about not being handled twice: this
         handler does the navigating itself, deliberately, rather than letting
         the press fall through to the head's own listener, which would also
         re-enter this listener's shut(null) branch and close the menu it just
         opened. */
      ev.preventDefault(); ev.stopPropagation();
      const menu = btn.parentElement && btn.parentElement.querySelector('.rl-more-menu');
      if (!menu) return;
      const open = menu.hidden;
      shut(open ? menu : null);
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open){
        rlMorePlace(btn, menu);
        /* ---- THE ⋯ TAKES YOU TO THE CLAUSE TOO (owner-asked 26 Aug 2026:
               "merely selecting the 3 dots ... should also highlight the card
               and take you to the clause in the contract not only clicking the
               card") ----
               THE SAME ACT THE CARD'S HEAD PERFORMS, not a second path: one
               call to rlLinkFocus, the one function that lights the card, its
               clause, its thread and its queue row together. Reaching for the
               menu IS reaching for that change, so the paper should already be
               showing it by the time the reader reads the rows.
               'card' as the source, exactly as the head press passes, so the
               COLUMN does not scroll under the hand that is already on it —
               only the paper moves.
               THE CONTRACT IS RESOLVED HERE because this listener is armed at
               module load and closes over nothing. Null is a safe answer and
               not a broken one: rlLinkFocus guards its one use of it (the
               queue sync), so on a mount with no held contract — the
               counterparty's — the card and clause still light. */
        const held = typeof redlineHeldId === 'function' ? redlineHeldId() : null;
        const cur = (held && typeof getContract === 'function') ? getContract(held) : null;
        try{ rlLinkFocus(cur, btn.getAttribute('data-rl-more'), 'card'); }catch(_){}
      }
      return;
    }
    /* A row inside: shut the menu and let the press carry on to whichever
       handler owns that act. Anywhere else on the page: just shut. */
    shut(null);
  }, true);
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (!document.querySelector('.rl-more-menu:not([hidden])')) return;
    /* This menu is the thing on top when it is open, so it takes Escape ahead
       of the clause panel and the page behind it — and only then. */
    ev.stopPropagation();
    shut(null);
  }, true);
}
if (typeof document !== 'undefined' && !document._rlCardFilterWired){
  document._rlCardFilterWired = true;
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-cardfilter]');
    if (!b) return;
    ev.preventDefault();
    rlSetCardFilter(b.getAttribute('data-rl-cardfilter'));
    rlRepaintFrom(b);
  });
  /* ---- AND THE DROPDOWN'S OWN DOOR (24 Aug 2026) ----
     The filter is a <select> now, and a select answers to CHANGE, never to
     click — the button handler above would never have seen it. Delegated on
     document and armed once for the reason stated above: this control is
     painted into a mount that several paths repaint, so an element-bound
     listener is dropped by the first of them. The "show me all of them" button
     on the filtered-empty state still carries the ATTRIBUTE, so it stays on the
     click door and both roads reach one setter. */
  document.addEventListener('change', ev => {
    const sel = ev.target;
    if (!sel || sel.id !== 'rl-cardfilter') return;
    rlSetCardFilter(sel.value);
    rlRepaintFrom(sel);
  });
}

/* ---- SHOW MORE / SHOW LESS ON A CLAMPED NOTE ----
   A pure DOM toggle wired once by delegation, the notice fold's own pattern:
   the cards are repainted by a dozen paths, and a class flip must not cost a
   repaint that would empty the composer beside it. The labels ride on the
   button as data- attributes because a dictionary call inside this listener
   would freeze whichever language was current at load. */
if (typeof document !== 'undefined' && !document._rlNoteMoreWired){
  document._rlNoteMoreWired = true;
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-note-more]');
    if (!b) return;
    ev.preventDefault();
    ev.stopPropagation();          // the card's head toggle must not fire under it
    const p = b.previousElementSibling;
    if (!p) return;
    /* ---- ONE HANDLER, RE-POINTED (27 Aug 2026) ----
       This toggled `rl-cnote-clamp` — the card's own class, and the card no
       longer draws notes. The fold now lives in the Notes panel, which clamps
       with `rl-np-clamp` and opens by ADDING `rl-np-open` rather than by
       removing the clamp, so the class that describes the paragraph stays on it.
       A second handler was written in the panel's own wiring for one run and
       removed: two listeners on one control both fired, and the second undid
       the first's label. */
    const open = p.classList.toggle('rl-np-open');
    b.textContent = open ? (b.getAttribute('data-less') || 'Show less')
      : (b.getAttribute('data-more') || 'Show more');
  });
}

/* ---- THE ONE STACK, AND EVERY BAND NOW ARRIVES IN IT ----
   `opts.extraNotices` is how a caller hands over a notice that used to be a
   band of its own: the readiness signal on the workbench, and the room's two
   strips ("changes returned", "ready to sign") on the Document tab. They come
   in as markup because they are built by their own screens and carry their own
   colours and their own buttons — what they must NOT carry any more is a place
   at the top of the page.

   Deliberately one parameter rather than a second builder. A second notice
   system is how a message ends up on a screen nobody reads: this stack already
   folds behind one bell, clears per notice, and knows not to draw when it is
   empty, and anything joining it inherits all three. */
/* THE SHELL — the container, the fold, the bell and the Hide chip — with
   whatever cards it has been given. Pulled out so the room's tabs can reach the
   same mechanism without reaching the workbench's own notices with it: the
   Document tab has no reading mode and no review banner of its own, and a
   shared BUILDER that quietly brought both would be a change of behaviour
   wearing a refactor's clothes. One shell, two doors, no second system.
   `id` differs per door so two mounts on one page cannot collide. */
function rlNoticeStackHtml(c, alerts, note, id, opts){
  const a = String(alerts || ''), n = String(note || '');
  /* Empty means empty: an always-present container would sit over the bottom
     corner of the contract catching clicks meant for the document. No alerts
     means NO BELL either — a bell with nothing behind it is furniture. */
  if (!a && !n) return '';
  /* Their seat draws only the reading notice; with none there is nothing to
     contain, and an empty container sits over the corner of the contract
     catching clicks meant for the document. */
  if (!n && opts && opts.side === 'counterparty') return '';
  const cid = _nea(String((c && c.id) || ''));
  /* ---- ONE BELL PER PAGE, AND ON THEIR PAGE IT IS THE HEADER'S ----
     (owner-asked, 13 Aug 2026.) The counterparty's page has its own bell, in
     their header row, with an alerts panel behind it. Two bells on one page,
     both amber, both about the same contract, is worse than none at all — so
     the floating one is not drawn on that seat, and their notices are read
     through the header's panel instead. */
  const theirs = !!(opts && opts.side === 'counterparty');
  /* ---- THE BELL IS A DOOR ONTO THE ALERTS PANEL (owner-asked 23 Aug 2026) ----
     "The bell will work as designed today, but when you click on it the side
     panel alert system is what appears."

     WHAT THAT CHANGES, AND WHY THE FOLD HAD TO GO WITH IT. Until now the bell
     folded THIS CONTRACT'S notices behind itself: press it and they slid out,
     press Hide and they went away again. Pointing the same button at the
     workspace panel leaves those notices with no door at all — so they stop
     folding and draw in place, which is where the unfolded state already put
     them. Nothing is hidden that was visible, and nothing that was reachable
     has become unreachable; what is lost is the ability to sweep them all away
     for a sitting, and the one notice anybody ever wanted to sweep — the review
     banner — has carried its own ✕ since the day it was built.

     THE TWO IDEAS ARE FINALLY APART, which is the gain. A NOTICE is a statement
     about the page in front of you (which reading you are in, what this desk
     lets you do); it belongs on the page. An ALERT is something waiting on you
     across the workspace; it belongs in the panel. They were muddled precisely
     because one button served both.

     rlNoticesFolded / rlSetNoticesFolded survive and answer as before: the
     phone's own stack (mNoticeStackHtml) still folds, and it has no panel to
     open. `ng_notices_min` / `ng_notices_min_title` are STALE on this page. */
  /* ---- NOTHING FLOATS OVER THE PAGE (owner-asked 23 Aug 2026) ----
     This stack was position:fixed in the bottom-right corner, over whatever the
     reader was looking at — on the contract room that meant sitting on top of
     the Checks card and the activity feed. It draws IN FLOW now, at the top of
     the surface that mounts it, so a notice takes its own space instead of
     covering somebody else's.

     AND THE BELL GOES WITH IT. It was a floating button carrying alertCount()
     — the HEADER's own reading — so it was a second copy of a control already
     on screen, in the corner the owner is asking to clear. The header bell
     opens the same panel and says the same number. `rlAlertsBellHtml` is kept
     as a builder with no caller here rather than deleted, because the phone's
     own stack is a separate function and this one is published.

     WHAT STAYS IS WHAT IS ABOUT THIS PAGE: which reading you are in, and the
     one band that says what this desk lets you do right now. Both are
     statements about the screen in front of you, so neither can move to the
     alerts panel — and the reading notice may never simply be dropped, because
     quietly hiding the strikes is this page's most expensive mistake. */
  const body = theirs ? n : (a + n);
  if (!body) return '';
  return `<div class="rl-notices" id="${_nea(id || 'rl-notices')}">${body}</div>`;
}
/* ---- THE FLOATING BELL, AND THE NUMBER ON IT ----
   It counts what the HEADER bell counts, because it now opens the same panel,
   and a door wearing a different number from the room behind it is a door that
   lies. alertCount is asked through window and inside a try: this component is
   mounted on stages that never load the shell (the counterparty's page builds
   its own, and half the node suite mounts the panes bare), and a bare
   cross-module read throws rather than falling through.

   NOTHING WAITING, NOTHING DRAWN — the header dot's own rule. An always-present
   bell over the bottom corner of the contract is furniture, and it would sit
   there catching presses meant for the document.

   NEWS, not work — see rlBellIsNews. The class is what turns it green and sets
   it blinking; the LABEL changes with it, because a bell that has changed colour
   to say something specific and still reads "alerts" has told a screen reader
   nothing. */
function rlAlertsBellHtml(c){
  const news = (typeof rlBellIsNews === 'function') && rlBellIsNews(c);
  let n = 0;
  try { if (window.alertCount) n = alertCount() | 0; } catch (_) { n = 0; }
  if (!n && !news) return '';
  const lbl = _nea(i18t(news ? 'ng_notices_fab_ready' : 'ng_notices_fab'));
  const cid = _nea(String((c && c.id) || ''));
  return `<button type="button" class="rl-notices-fab${news ? ' is-news' : ''}" data-rl-alerts-open="${cid}"
      aria-label="${lbl}" title="${lbl}">&#128276;${
    n ? `<span class="rl-fab-dot">${n > 9 ? '9+' : n}</span>` : ''}</button>`;
}
/* ---- THE ALERTS THAT FOLD, AS THEIR OWN POPULATION (13 Aug 2026) ----
   ONE list, TWO readers. The owner's floating stack folds it behind its bell;
   the COUNTERPARTY's header panel prints it, because their page's floating
   bell stood down when they got a bell of their own (see rlNoticeStackHtml and
   portalAlertsBodyHtml). Naming the list is what stops the two drifting: a
   notice added here reaches both, and the alternative — the portal
   re-assembling the same two pieces itself — is how a notice comes to exist on
   one seat and not the other.

   The readiness signal moved INTO this list rather than riding in as
   opts.extraNotices from redlinePanesHtml. Same two pieces, one place. */
function rlSeatAlertsHtml(c, opts = {}){
  return [
    (window.rlOneNoticeHtml ? rlOneNoticeHtml(c, opts) : '') || '',
    (window.negoReadySignalHtml ? negoReadySignalHtml(c, opts) : '') || '',
    String(opts.extraNotices || ''),
  ].filter(Boolean).join('');
}
/* ---- WHAT MAY TAKE A ROW ON THIS PAGE (owner-asked 23 Aug 2026) ----
   The stack draws in flow now, so anything in it costs the contract and the
   change column real height. That makes the old question — "is this worth
   floating over the page?" — into a sharper one, and the product already has
   the answer written down: a NOTICE is a statement about the page in front of
   you and belongs on the page; an ALERT is something waiting on you across the
   workspace and belongs in the panel.

   So the owner's stack carries the two that are about THIS PAGE — which reading
   you are in, and the one band that says what this desk lets you do right now.

   THE READINESS SIGNAL LEAVES IT, and loses nothing: the head of this very page
   prints "Counterparty ready to sign" as its status word (cpReadyToSign), the
   alerts panel carries a cp-ready row FIRST in its running order, and the
   contract room's own lead button offers the act. Four surfaces for one fact
   was already three too many; the one that took a row over the work is the one
   that goes.

   rlSeatAlertsHtml IS UNTOUCHED and still carries it, because it is also the
   COUNTERPARTY's alerts-panel population (js/views/portal.js) — a panel is
   exactly where that fact belongs, and their seat never drew this stack's
   alerts half anyway. */
function rlFloatingNoticesHtml(c, opts = {}){
  const page = [
    (window.rlOneNoticeHtml ? rlOneNoticeHtml(c, opts) : '') || '',
    String(opts.extraNotices || ''),
  ].filter(Boolean).join('');
  return rlNoticeStackHtml(c, page, rlReadNoticeHtml() || '', 'rl-notices', opts);
}
/* ---- TWO REASONS THIS PERSON CANNOT REACH THE OTHER SIDE, ONE ANSWER ----
   A reviewer mid-review, and somebody who is not the lead of this negotiation.
   They are different facts with the same consequence — no publishing, no
   closing, no answering the counterparty — and the FIVE renderers that compute
   `canAct` each ask this one function, which is the only reason gating the desk
   did not mean finding those five sites again.

   Both are POSTURES rather than demotions: hand the review back, or be handed
   the lead, and everything returns. */
function rlActorHeld(c, opts = {}){
  if (opts.side === 'counterparty' || opts.readonly) return false;
  if (typeof window.deskMaySend === 'function'){
    try{ if (!deskMaySend(c)) return true; }catch(_){}
  }
  if (typeof window.reviewActorIsHeld !== 'function') return false;
  try{ return reviewActorIsHeld(c); }catch(_){ return false; }
}
/* Whether this reader may put wording into our draft at all. The reviewer's
   posture deliberately does NOT come into this — correcting the clause they
   were handed is the thing that feature exists to allow — so this asks the desk
   and nothing else. Read by the workbench's mount, which passes it as
   opts.canEdit, and `editable` in both card renderers already reads that. */
function rlMayRedline(c, opts = {}){
  if (opts.side === 'counterparty' || opts.readonly) return false;
  if (typeof window.deskMayRedline !== 'function') return true;
  try{ return deskMayRedline(c); }catch(_){ return true; }
}
/* ---------- THE NOTES ON A CHANGE ----------
   What the Discussion column used to draw, drawn on the change itself — first
   on the change's card, and since 16 Aug 2026 in the CLAUSE PANEL's row for
   that change (rlClausePanelBodyHtml), because the card became a routing row
   and the pop-out that used to show the card's hidden body is retired. Same
   engine underneath and deliberately so: the message list is negoMergedThread
   filtered by rlMsgVisible, and the composer carries the three attributes
   wireNegotiationTab binds — id="nego-ti-<id>", data-nego-send and a
   data-nego-vis marker — so nothing about posting, validating or walling a
   message is reimplemented here. IT RENDERS EXACTLY ONCE per change, in the
   panel: a second copy anywhere is a reply box that accepts typing and posts
   nothing, which is the lesson the pop-out was built around.

   THE VISIBILITY MARKER IS PRESENT AND UNPRESSABLE. It is not decoration: the
   send handler resolves visibility by finding the pressed data-nego-vis button
   for this change and DEFAULTS TO SHARED when it finds none. A card with no
   marker at all would therefore post every internal note to the counterparty —
   the exact opposite of what the line under the button promises. */
/* ============================================================
   NOTES ARE TWO ROOMS, AND THE ROOM IS THE DESTINATION
   ============================================================
   (owner-ruled 27 Aug 2026: "The buttons for internal vs external should show
   the respective sides' notes. Internal vs external notes should not be in the
   same view.")

   The note box used to carry a SWITCH — Internal / Send to them — set on the
   composer and read at the press. Two things were wrong with that and the
   owner named both: an internal aside and a reply to the other side sat in one
   list, and the destination was a setting you could leave pointing the wrong
   way.

   SO THE ROOM IS THE DESTINATION. Internal and External are TABS: each holds
   its own notes and its own box, and the box you type in belongs to the room
   you are standing in. There is nothing to set and therefore nothing to set
   wrongly — which is a stronger guarantee than any warning, and it is why the
   confirm below is the only guard left rather than the first of several.

   ONE READING OF WHICH ROOM A NOTE IS IN, asked by the list, the counts, the
   tabs and the send. `negoPostComment` is still the one writer and still
   treats anything but 'shared' as internal, so a note filed by any older path
   lands in the internal room — the safe direction, unchanged. */
const NOTE_ROOMS = ['internal', 'external'];
const negoNoteRoom = m => (m && m.visibility === 'shared') ? 'external' : 'internal';
/* The notes for ONE room, already through the side wall. rlMsgVisible is the
   existing per-message reading and is asked FIRST: a message this seat may not
   see is not in either room, and filtering by room before by seat would count
   it in a tab. */
function negoRoomNotes(c, ch, room, opts = {}, side = 'owner'){
  /* WITH NO CHANGE NAMED THIS IS THE CONTRACT'S OWN NOTES — the ones that
     belong to no redline. The fallback names the same host, so a stage without
     the model reads the right store rather than an empty one. */
  const host = ch || c;
  const all = ((window.negoMergedThread ? negoMergedThread(c, ch, opts.messages) : (host && host.thread) || []) || [])
    .filter(m => rlMsgVisible(m, side));
  return room ? all.filter(m => negoNoteRoom(m) === room) : all;
}
/* What the tabs print, and what the change's own row prints. ONE arithmetic:
   a row that counted its own notes would be a second answer to a number the
   panel is already showing. */
function negoNoteCounts(c, ch, opts = {}, side = 'owner'){
  const all = negoRoomNotes(c, ch, null, opts, side);
  const internal = all.filter(m => negoNoteRoom(m) === 'internal').length;
  return { internal, external: all.length - internal, total: all.length };
}
/* ---- WHO MAY WRITE, IN EITHER ROOM (owner-ruled 27 Aug 2026: "Any person
   that can edit the contract can send notes externally") ----
   It asks the one question the product already asks of this act and no other.
   POST /api/contracts/:id/messages — the route that has carried a note to the
   counterparty since long before this panel existed — is gated `auth, editor`:
   no owner check, no negotiation-lead check. Gating this panel any harder
   would make a note stricter than the door that already sends one.
   THE COUNTERPARTY'S SEAT ANSWERS FOR ITSELF: their page is the only channel
   they have, so it passes its own canComment and never reaches canEdit. */
function notesMayWrite(c, opts = {}){
  if (opts.readonly) return false;
  /* THE COUNTERPARTY'S SEAT ANSWERS FIRST AND FOR ITSELF. Their page passes its
     own canComment — it is the only channel they have, and canEdit is not a
     question that can be asked there at all. */
  if (opts.canComment != null) return !!opts.canComment;
  /* WHERE THERE IS NO canEdit TO ASK, this answers YES, and that is stated
     rather than left to a short-circuit: core.js is loaded on every stage that
     draws this panel, and the one seat that is not (the portal) has already
     returned above. Refusing instead would make the box silently dead on any
     stage missing core.js, which is a fault nobody would find except by
     reporting it. */
  if (typeof window === 'undefined' || typeof window.canEdit !== 'function') return true;
  return !!window.canEdit();
}
/* ---- THE CHANNEL, NAMED ONCE ----
   A note in the external room travels on the discussion channel, which is the
   store the counterparty's page reads live. This was written inline in the
   negotiation page's own onComment hook; the panel needs the same act, and two
   copies of "how a note reaches them" is how they come to disagree. */
/* ---- AND A NOTE ON THE CONTRACT TRAVELS THE SAME WAY (owner-asked 2 Sep
   2026) ---- The only thing that differs is which conversation it joins:
   negoTopicFor answers the change's topic where there is one and the contract's
   general topic where there is not. `ch` is optional here for that reason and
   for no other; every guard, every refusal and the whole ordering are the
   change path's own. */
/* ---- AND THE PERSON NAMED IS TOLD (owner-asked 2 Sep 2026) ----
   *"The person tagged should also be informed via email."*

   ONE DOOR, TWO CALLERS — the notes panel's send and the note dialog's — so a
   third way of filing a note joins here rather than growing its own copy of
   who gets told.

   IT SENDS KEYS, NEVER ADDRESSES. The route resolves each person against the
   users table and the STORED contract; a body carrying an address is refused
   outright there. The NAME travels beside the id because the counterparty
   contact on a contract has no id at all — the tag picker itself falls back to
   it — so a call keyed on ids alone would quietly never reach the commonest
   person on the other side.

   THE NOTE IS ALREADY ON THE RECORD by the time this runs, and the mail is
   best-effort by construction: a provider that is down loses a notification and
   never a note. In local mode there is no route and this answers null, which
   the caller reads as "nothing to say" rather than as a failure. */
async function negoNotifyMentions(c, ch, msg){
  const list = Array.isArray(msg && msg.mentions) ? msg.mentions : [];
  if (!c || !list.length) return null;
  if (!window.API_MODE || !API_MODE() || typeof window.api !== 'function') return null;
  const people = list.map(p => ({ id: (p && p.id) || '', name: (p && p.name) || '' }))
    .filter(p => p.id || p.name);
  if (!people.length) return null;
  try {
    return await api('contracts/' + c.id + '/mention', 'POST',
      { people, changeId: ch ? ch.id : '', note: String((msg && msg.text) || '').slice(0, 600) });
  } catch (e){ return { ok: false, told: [], skipped: [], why: (e && e.message) || '' }; }
}
/* What the one toast says about it — a clause, never a second box. Silent where
   nobody was named or where there is no mail on this server at all, because a
   line about email on every note is the furniture this rulebook warns about. */
function negoMentionLine(out){
  if (!out) return '';
  const told = (out.told || []).filter(t => t && (t.emailSent || t.outbox));
  const failed = (out.told || []).filter(t => t && !t.emailSent && !t.outbox)
    .concat(out.skipped || []);
  if (told.length && !failed.length)
    return ' ' + i18tn('ng_at_told', told.length,
      { n: told.length, who: told[0].name || '' });
  if (told.length)
    return ' ' + i18t('ng_at_some', { n: told.length, missed: failed.length });
  if (failed.length)
    return ' ' + i18tn('ng_at_none', failed.length,
      { n: failed.length, who: failed[0].name || '' });
  return '';
}
async function negoPostToChannel(c, ch, msg){
  if (!window.API_MODE || !API_MODE() || !c || !msg) return { ok: false, skipped: true };
  const res = await api('contracts/' + c.id + '/messages', 'POST', {
    topic: (window.negoTopicFor ? negoTopicFor(ch) : (ch ? 'change:' + ch.id : 'general')),
    topicLabel: ch
      ? `Change #${ch.id}${ch.clauseLabel ? ' · ' + ch.clauseLabel : ''}`
      : (window.i18t ? i18t('di_contract_generally') : 'The contract generally'),
    body: msg.text });
  c._messages = (res && res.messages) || c._messages || [];
  return { ok: true, res };
}
/* Which room is showing. PER SITTING, IN MEMORY, and it opens on INTERNAL —
   the quiet room is the one you land in, so reaching the other side is always
   a deliberate press. Keyed by nothing: one panel, one room at a time. */
let _rlNpRoom = 'internal';
const rlNpRoom = () => _rlNpRoom === 'external' ? 'external' : 'internal';
function rlNpSetRoom(r){ _rlNpRoom = r === 'external' ? 'external' : 'internal'; }
const RL_NP_LOCK = '<svg class="rl-np-i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3.5" y="7" width="9" height="6"/><path d="M5.5 7V5.2a2.5 2.5 0 015 0V7"/></svg>';
const RL_NP_GLOBE = '<svg class="rl-np-i" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M2.5 8h11M8 2.5c1.6 1.7 1.6 9.3 0 11M8 2.5c-1.6 1.7-1.6 9.3 0 11"/></svg>';
/* ---- THE TAB SAYS WHICH ROOM YOU ARE IN, SO A SENTENCE UNDER IT DOES NOT
       (owner-asked 2 Sep 2026, off a screenshot of each: "remove the
       highlighted areas. People are smart enough to know without being given
       explicit writing") ----
   It read "Stays inside X — Y never sees this tab" over the Internal room and
   "Y reads everything on this tab" over the External one, directly under a tab
   row already labelled Internal and External and already marking the live one.
   That is the standing band test failed on its first half: the screen says it
   already. THREE THINGS STILL SAY IT and none of them is a sentence — the TAB
   you pressed, the box's own PLACEHOLDER ("Add a note for {who}…" against "Add
   a note for your team…", which is where the counterparty is NAMED at the
   moment you type), and the tint and teal edge the external composer wears.
   The confirm before anything crosses names them again.

   IT IS DRAWN WHERE THERE ARE NO TABS, WHICH IS WHY THIS IS A READING RATHER
   THAN A DELETION. The counterparty's seat has one room and no tab row (see
   rlNotesPanelHtml's own note on why), so there the line is the ONLY thing
   naming it and it stays. One question — what tells this reader which room
   they are in — answered in one place, with the tabs and this line as its two
   halves; f248's "one room, and it says who reads it" is unmoved. */
function rlNpWhoHtml(tabbed, ext, who){
  if (tabbed) return '';
  return `<div class="rl-np-who${ext ? ' out' : ''}">${
    ext ? RL_NP_GLOBE : RL_NP_LOCK}<span>${who}</span></div>`;
}
/* One note. The per-note visibility badge the card used to carry is GONE and
   that is the split paying for itself: every note in a room has the same
   answer, so marking each one is the same fact printed five times. The room
   says it once, at the top. What a note still carries is who wrote it, when,
   and — in the external room only — the other side's company where the note
   came FROM them, because that is the one thing the room cannot say. */
/* ---- A TAGGED NAME IS DRAWN AS ONE, FROM THE RECORD (owner-asked 2 Sep
   2026) ----
   MARKED AFTER ESCAPING, never before: the input is somebody's typed note, so
   the escape has to happen first or a note containing markup would be marked
   into the page. That is briefMark's own rule, one screen along.
   AND ONLY THE NAMES THE RECORD HOLDS. It reads msg.mentions rather than
   hunting the text for anything after an @, so a note that merely mentions an
   email address, a price of @45, or a person nobody in this room can be tagged
   by is left exactly as it was typed. Nothing can be dressed as a mention by
   typing it. */
/* ---- AND EVERY NAME CARRIES ITS OWN INK (owner-asked 2 Sep 2026) ----
   *"every name having a different color code."* Deterministic and stable across
   sessions, machines and readers, because a colour that moved between two
   sittings would be worse than no colour at all: a small hash of the name, into
   the four inks the panel's sheet defines.

   KEYED ON THE VISIBLE NAME, lowercased, and not on the id. The id is the
   sturdier identity and is right for a RECORD; this is a scanning aid, and what
   a reader needs is that the same name they can see always looks the same. A
   counterparty contact carries no id at all, so keying on one would split some
   people into two colours and leave others uncoloured. */
const RL_TAG_INKS = 4;
function rlTagInk(name){
  const s = String(name || '').trim().toLowerCase();
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % RL_TAG_INKS;
}
function rlNpMarkMentions(escaped, m){
  const list = Array.isArray(m && m.mentions) ? m.mentions : [];
  if (!list.length) return escaped;
  let out = String(escaped);
  for (const p of list.slice().sort((a, b) =>
      String(b && b.name).length - String(a && a.name).length)){
    const raw = String((p && p.name) || '').trim();
    const nm = _ne(raw);
    if (!nm) continue;
    const needle = '@' + nm;
    const cls = 'rl-np-at rl-np-at-' + rlTagInk(raw);
    let at = out.indexOf(needle);
    while (at >= 0){
      out = out.slice(0, at) + `<span class="${cls}">${needle}</span>`
        + out.slice(at + needle.length);
      at = out.indexOf(needle, at + needle.length + 30);
    }
  }
  return out;
}
/* ---- THE @ PICKER (owner-asked 2 Sep 2026) ----
   *"have the ability to tag parties in the comments using the @ feature."*

   THE LIST IS THE ROOM'S OWN POPULATION and nothing else — negoTagPeople, the
   one reading, which the writer enforces as a wall. So the internal room can
   only ever offer colleagues and the external room only ever people at the
   other side, and a name cannot be tagged into a note that travels merely by
   being typed.

   IT IS RENDERED SHUT AND CARRIES ITS PEOPLE AS DATA, so the typing handler
   filters what is already on the page rather than asking the model on every
   keystroke — and there is nothing to keep in step, because it is the same
   list the send resolves against.

   DRAWN NOWHERE WHEN THE ROOM OFFERS NOBODY: a control whose one outcome is an
   empty list is furniture, and on a stage without js/review.js the internal
   room deliberately offers nobody at all. */
function rlNpTagMenuHtml(c, room, opts = {}){
  const people = (typeof negoTagPeople === 'function') ? negoTagPeople(c, room, opts) : [];
  if (!people.length) return '';
  return `<div class="rl-np-tags" data-rl-np-tags hidden role="listbox"
    aria-label="${_nea(i18t('ng_np_tag_aria'))}">${
    people.map(p => `<button type="button" role="option" aria-selected="false"
      class="rl-np-tag" data-rl-np-tag="${_nea(p.name)}"
      ><b>${_ne(p.name)}</b>${p.email ? `<span>${_ne(p.email)}</span>` : ''}</button>`).join('')
  }<p class="rl-np-tag-none" hidden>${i18t('ng_np_tag_none')}</p></div>`;
}
function rlNpNoteHtml(m, room, side, org){
  const t = String(m.text || '');
  const long = t.length > 220 || (t.match(/\n/g) || []).length >= 3;
  const theirs = room === 'external' && m.side && m.side !== side;
  return `<div class="rl-np-note${theirs ? ' is-them' : ''}">
    <div class="rl-np-top"><b>${_ne(m.who || 'Someone')}</b><span>${_ne(negoWhen(m.at))}</span></div>
    ${theirs && org ? `<span class="rl-np-org">${_ne(org)}</span>` : ''}
    <p${long ? ' class="rl-np-clamp"' : ''}>${rlNpMarkMentions(_ne(t), m)}</p>
    ${long ? `<button type="button" class="rl-np-more" data-rl-note-more
      data-more="${_nea(i18t('ng_note_more'))}" data-less="${_nea(i18t('ng_note_less'))}">${i18t('ng_note_more')}</button>` : ''}
  </div>`;
}
/* THE WHOLE PANEL BODY. The drawer's own header supplies the title and the way
   out — this is everything under it. */
function rlNotesPanelHtml(c, ch, opts = {}){
  if (!c || !ch) return '';
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* THEIR SEAT HAS NO TABS, and it is not a permission — it is that they have
     nowhere to keep a private note. Their page is assembled from the share
     payload and thrown away on the next paint, so an internal room there would
     be a box that accepts typing and loses it. One room, theirs. */
  const tabbed = side === 'owner';
  const room = tabbed ? rlNpRoom() : 'external';
  const them = c.counterparty || i18t('ng_the_counterparty');
  const us = (window.contractParty ? contractParty(c) : null) || window.FIRST_PARTY || 'this workspace';
  /* From their chair the other side is US. */
  const other = side === 'counterparty' ? us : them;
  const notes = negoRoomNotes(c, ch, room, opts, side);
  const n = negoNoteCounts(c, ch, opts, side);
  const mayWrite = notesMayWrite(c, opts);
  const ext = room === 'external';
  const who = ext
    ? i18t('ng_np_who_ext', { who: _ne(other) })
    : i18t('ng_np_who_int', { org: _ne(us), who: _ne(them) });
  const tabs = tabbed ? `<div class="rl-np-tabs" role="tablist">
      ${NOTE_ROOMS.map(r => `<button type="button" role="tab" class="rl-np-tab${
        r === room ? ' on' : ''}" data-rl-np-room="${r}" aria-selected="${r === room}"
        >${i18t(r === 'external' ? 'ng_np_tab_ext' : 'ng_np_tab_int')} <i>(${
        r === 'external' ? n.external : n.internal})</i></button>`).join('')}
    </div>` : '';
  const list = notes.length
    ? notes.map(m => rlNpNoteHtml(m, room, side, other)).join('')
    : `<div class="rl-np-empty">
        <b>${i18t(ext ? 'ng_np_none_ext' : 'ng_np_none_int')}</b>
        <span>${i18t('ng_np_none_sub', { id: _ne(ch.id) })}</span>
      </div>`;
  /* A refusal names itself in the product's own words for this exact case —
     the Document tab's discussion has printed this sentence for viewers since
     long before this panel, and one wording covers both. */
  const foot = mayWrite
    ? `<div class="rl-np-foot${ext ? ' out' : ''}">
        <textarea class="chat-field rl-np-in" rows="2" id="nego-ti-${_ne(ch.id)}"
          placeholder="${_nea(ext ? i18t('ng_np_ph_ext', { who: other }) : i18t('ng_card_note_ph'))}"
          aria-label="${_nea(i18t('ng_start_thread_aria', { id: ch.id }))}"></textarea>
        ${rlNpTagMenuHtml(c, room, opts)}
        <div class="rl-np-act">
          <button type="button" class="rl-np-send" data-rl-np-send="${_ne(ch.id)}"
            data-room="${room}">${i18t('ng_card_note_add')}</button>
        </div>
      </div>`
    : `<div class="rl-np-no">${RL_NP_LOCK}<span>${i18t('ng_np_viewer')}</span></div>`;
  return `<div class="rl-np" data-rl-np="${_nea(ch.id)}">
    ${''/* WHICH CHANGE THIS BELONGS TO, and a way back to the clause it is
           about — the same act the row's Go to clause performs, because the
           panel covers the column the row is in. */}
    <button type="button" class="rl-np-which" data-rl-np-clause="${_nea(ch.clauseId || '')}"
      ${ch.clauseId ? '' : 'disabled'}>
      <span class="t">
        <span class="id">${_ne(ch.id)}${ch.clauseLabel ? ` <em>· ${_ne(ch.clauseLabel)}</em>` : ''}</span>
        <span class="s">${_ne(rlAskWord ? rlAskWord(ch) : '')}</span>
      </span>
      ${ch.clauseId ? '<span class="ch" aria-hidden="true">&rsaquo;</span>' : ''}
    </button>
    ${tabs}
    ${rlNpWhoHtml(tabbed, ext, who)}
    <div class="rl-np-list">
      <div class="rl-np-scope"><i></i>${i18t('ng_np_oldest')}</div>
      ${list}
    </div>
    ${foot}
  </div>`;
}
/* ---------- CHAT: EVERY NOTE ON THIS CONTRACT (owner-ruled 31 Aug 2026) ----------

   *"means to access the notes in the side panel should have its own door called
   Chat which should be accessed via a symbol ... between copilot and alerts"*

   THE DRAWER WAS ALWAYS ONE CHANGE'S THREAD, reached from that change's own
   row. Its door has moved to the shell bar, and a door in the shell bar is
   about the CONTRACT — it is pressed from anywhere, with no change in hand — so
   this is what it draws: every note on every live change, oldest last, each row
   saying which change it is about.

   IT COUNTS AND READS NOTHING OF ITS OWN. negoRoomNotes is the one reading of
   what a seat may see and which room a note is in, negoWhen is the one clock,
   and rlNpNoteHtml draws the note exactly as the per-change panel draws it — so
   a note cannot read one way here and another way there. What this adds is the
   line above each note saying where it came from, which is the only thing a
   whole-contract list needs that a one-change list does not.

   BOTH ROOMS, IN ONE LIST. The per-change panel splits them into tabs because
   that is where you WRITE, and the room you are typing in decides who reads it;
   this is where you READ, and a reader catching up on a contract wants the
   conversation in the order it happened rather than in two halves. Each note
   still says which room it is in, so nothing is ambiguous.

   NO BOX. There is one note box per change in this product and it is on the
   change; a composer here would be a second one with no change to attach to. */
/* ---- AND THE DOOR CARRIES A MARK WHEN SOMEBODY HAS NAMED YOU ----
   (owner-asked 2 Sep 2026, off a screenshot of the shell bar with the space
   above the Chat symbol ringed: the person tagged is told "with a mark on the
   symbol".)

   IT COUNTS NOTES, NOT THREADS, and only the ones that name THIS reader: a
   thread being busy is not the same fact as somebody asking you something, and
   the bell beside it already answers the first. Read by id first and by name
   second — the reading obligationRecipient uses, for the same reason: an id
   survives a rename and a name survives an account with none.

   IT READS c.changes AND c.thread RAW, never negoChanges — that runs negoInit,
   which CREATES a negotiation on any contract it is asked about, and a badge
   that starts a negotiation merely by counting would be the trap this file
   records against the sidebar counts.

   NOBODY IS PINGED BY THEIR OWN NOTE, and "seen" is the panel's own per-browser
   store keyed by thread — the same one the change cards' unread dot has always
   used, so opening Chat clears this exactly as reading a thread clears that.
   The contract's own thread has no change id, so it is keyed by a reserved name
   that no change can take: ids are CHG-000. */
const NEGO_CONTRACT_THREAD = '__contract';
function negoMentionsMe(m, me){
  const list = Array.isArray(m && m.mentions) ? m.mentions : [];
  if (!list.length || !me) return false;
  const myId = String(me.id || ''), myName = String(me.name || '').trim().toLowerCase();
  return list.some(p => p && ((myId && String(p.id || '') === myId)
    || (myName && String(p.name || '').trim().toLowerCase() === myName)));
}
function negoMentionsWaiting(c, opts = {}){
  if (!c) return 0;
  const me = (typeof window.currentUser === 'function') ? currentUser() : null;
  if (!me) return 0;
  const scope = negoSeenScope(c, opts);
  const myId = String(me.id || ''), myName = String(me.name || '').trim().toLowerCase();
  let n = 0;
  const count = (thread, key) => {
    const list = Array.isArray(thread) ? thread : [];
    if (!list.length) return;
    const seen = negoThreadSeenAt(scope, key);
    for (const m of list){
      if (!m || !negoMentionsMe(m, me)) continue;
      if (myId && String(m.byId || '') === myId) continue;      /* your own note */
      if (!m.byId && myName && String(m.who || '').trim().toLowerCase() === myName) continue;
      if (seen && String(m.at || '') <= String(seen)) continue;
      n++;
    }
  };
  count(c.thread, NEGO_CONTRACT_THREAD);
  for (const ch of (Array.isArray(c.changes) ? c.changes : []))
    if (ch && ch.id) count(ch.thread, ch.id);
  return n;
}
/* Reading Chat is reading every conversation it drew — the panel's own rule for
   a single thread, applied to the list it stands for. Called AFTER the paint,
   so the rows are built from the state the reader is about to see. */
function negoMarkChatSeen(c, opts = {}){
  if (!c) return;
  const scope = negoSeenScope(c, opts);
  negoMarkThreadSeen(scope, NEGO_CONTRACT_THREAD);
  for (const ch of (Array.isArray(c.changes) ? c.changes : []))
    if (ch && ch.id) negoMarkThreadSeen(scope, ch.id);
}
function rlChatRows(c, opts = {}, room = null){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const live = (c && Array.isArray(c.changes)) ? c.changes : [];
  const out = [];
  /* THE CONTRACT'S OWN NOTES SIT IN THE SAME LIST (owner-asked 2 Sep 2026:
     "The redline notes and notes unrelated to the redlines should be able to
     sit in the panel"). They come first only in the sense that they are added
     first — the sort below is by TIME, so the two kinds interleave exactly as
     they were written, which is what makes this one conversation rather than
     two lists stacked. A row with no change draws no reference line; see the
     builder. */
  for (const m of negoRoomNotes(c, null, room, opts, side)) out.push({ ch: null, m });
  for (const ch of live){
    if (!ch || !ch.id) continue;
    for (const m of negoRoomNotes(c, ch, room, opts, side)) out.push({ ch, m });
  }
  return out.sort((a, b) => String(a.m.at || '').localeCompare(String(b.m.at || '')));
}
/* ---- IT WEARS THE PER-CHANGE PANEL'S OWN CLOTHES (owner-asked 1 Sep 2026:
   "revert back to the previous style of the panel shown in image 3") ----

   The first build drew a flat list of its own — a lead sentence and a run of
   rows — and the owner looked at it beside the panel it replaced and wanted the
   panel back. THAT IS THE RIGHT ANSWER FOR THE SAME REASON THE ROWS ALREADY
   BORROWED rlNpNoteHtml: two surfaces reading one conversation must not dress
   it two ways, or a reader moving between them is reading two products.

   SO IT IS `rlNotesPanelHtml`'s STRUCTURE AT CONTRACT SCOPE — the same header
   button, the same tabs with their counts, the same lock line, the same
   OLDEST FIRST scope line, the same note rule — and every one of those rules is
   the panel's own, unchanged. What Chat adds is the line above each note saying
   which change it came from, which is the one thing a whole-contract list needs
   that a one-change list does not.

   THE ROOM IS THE PANEL'S OWN STATE, deliberately shared. "Which room am I
   reading" is one question, and two stored answers is two things to keep in
   step; switching here switches there, which is what a reader expects of one
   setting drawn twice.

   NO COMPOSER. There is one note box per change and it is on the change; a box
   here would have nothing to attach to. The header names the CONTRACT and does
   not press — you are already on it — so it draws no chevron.

   THE LEAD SENTENCE IS GONE and nothing is lost: it said "each row says which
   change it is about", which is a description of the rows, and the rows say it
   themselves. `ng_chat_lead` is STALE — flag any mention; the key is left
   inert in both dictionaries. */
function rlChatPanelHtml(c, opts = {}){
  if (!c) return `<div class="rl-chat-none">${i18t('ng_chat_none')}</div>`;
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const room = rlNpRoom();
  const them = c.counterparty || i18t('ng_the_counterparty');
  const us = (window.contractParty ? contractParty(c) : null) || window.FIRST_PARTY || 'this workspace';
  const other = side === 'counterparty' ? us : them;
  const ext = room === 'external';
  const all = rlChatRows(c, opts);
  const rows = all.filter(({ m }) => negoNoteRoom(m) === room);
  const nInt = all.length - all.filter(({ m }) => negoNoteRoom(m) === 'external').length;
  const nExt = all.length - nInt;
  const who = ext
    ? i18t('ng_np_who_ext', { who: _ne(other) })
    : i18t('ng_np_who_int', { org: _ne(us), who: _ne(them) });
  /* ---- THE BOX IS BACK, AND IT WRITES A NOTE THAT BELONGS TO NO REDLINE
     (owner-asked 2 Sep 2026) ----
     *"you should also be able to tag people and add any notes internally or
     externally unrelated to a redline ... This means a need to open an open
     text field to enter notes which was the case previously but has changed
     without my ask."*

     THE BOX GOING WAS MINE. Chat shipped on 31 Aug with a note saying there is
     one note box per change and it lives on the change; the owner did not ask
     for that and it is reversed here.

     IT IS THE PER-CHANGE PANEL'S OWN FOOT, character for character — the same
     textarea class, the same tag menu, the same send button, the same viewer
     refusal — because two composers dressed two ways for one conversation is
     the drift this panel was reverted to the panel's clothes to avoid. What
     differs is only what it writes ON: no change, so the send carries no id and
     negoPostComment files it against the contract.

     THE ROOM STILL DECIDES WHO READS IT, unchanged: an internal note stays on
     this record, and an external one goes down the discussion channel exactly
     as a redline note does — and is then no longer its writer's to edit, which
     is negoNoteDelivered's rule and needs no exception here. */
  const mayWrite = notesMayWrite(c, opts);
  const foot = mayWrite
    ? `<div class="rl-np-foot${ext ? ' out' : ''}">
        <textarea class="chat-field rl-np-in" rows="2" id="nego-ti-contract"
          placeholder="${_nea(ext ? i18t('ng_np_ph_ext', { who: other }) : i18t('ng_chat_ph'))}"
          aria-label="${_nea(i18t('ng_chat_write_aria'))}"></textarea>
        ${rlNpTagMenuHtml(c, room, opts)}
        <div class="rl-np-act">
          <button type="button" class="rl-np-send" data-rl-chat-send="1"
            data-room="${room}">${i18t('ng_card_note_add')}</button>
        </div>
      </div>`
    : `<div class="rl-np-no">${RL_NP_LOCK}<span>${i18t('ng_np_viewer')}</span></div>`;
  const body = rows.length
    ? rows.map(({ ch, m }) => `<div class="rl-chat-row">
        ${''/* A NOTE THAT BELONGS TO NO REDLINE CARRIES NO REFERENCE LINE
               (owner-asked 2 Sep 2026). A door reading "the contract" on a
               panel about that contract is a press that goes nowhere, and this
               product's own rule is that a verb which cannot work is not
               drawn. What tells the two apart is the absence of the line. */}
        ${ch ? `<button type="button" class="rl-chat-on" data-rl-notes="${_nea(ch.id)}">
          ${''/* THE REFERENCE, AND NOTHING ROUND IT (owner-reported 1 Sep
                 2026: "should simply say CHG-00X"). "On CHG-001" spent two of
                 the row's scarcest characters on a word that says nothing the
                 row's own shape does not — the reference sits above the note it
                 belongs to, so what it is ON is already on screen. It is also
                 what let the label wrap; see the rule in index.html.
                 ng_chat_on is STALE and left inert in both dictionaries. */}
          <span class="id">${_ne(ch.id)}</span>
          ${ch.clauseLabel ? `<em>${_ne(ch.clauseLabel)}</em>` : ''}
        </button>` : ''}
        ${rlNpNoteHtml(m, room, side, other)}
      </div>`).join('')
    : `<div class="rl-np-empty">
        <b>${i18t(ext ? 'ng_np_none_ext' : 'ng_np_none_int')}</b>
        <span>${i18t('ng_chat_empty')}</span>
      </div>`;
  return `<div class="rl-np rl-chat" data-rl-chat="${_nea(c.id)}">
    <div class="rl-np-which is-static">
      <span class="t">
        <span class="id">${_ne(c.id)}${c.name ? ` <em>· ${_ne(c.name)}</em>` : ''}</span>
        <span class="s">${i18tn('ng_chat_n', all.length, { n: all.length })}</span>
      </span>
    </div>
    <div class="rl-np-tabs" role="tablist">
      ${NOTE_ROOMS.map(r => `<button type="button" role="tab" class="rl-np-tab${
        r === room ? ' on' : ''}" data-rl-np-room="${r}" aria-selected="${r === room}"
        >${i18t(r === 'external' ? 'ng_np_tab_ext' : 'ng_np_tab_int')} <i>(${
        r === 'external' ? nExt : nInt})</i></button>`).join('')}
    </div>
    ${''/* ALWAYS TABBED: this face draws its tab row unconditionally, so the
           room is named on screen whoever is reading and the line under it
           would be that fact twice. */}
    ${rlNpWhoHtml(true, ext, who)}
    <div class="rl-np-list">
      <div class="rl-np-scope"><i></i>${i18t('ng_np_oldest')}</div>
      ${body}
    </div>
    ${foot}
  </div>`;
}
function rlChatPanelPaint(host, c, opts = {}){
  if (!host) return;
  host.innerHTML = rlChatPanelHtml(c, opts);
  /* ---- THE COMPOSER IS THE PANEL'S OWN, ARMED THE PANEL'S OWN WAY ----
     The send, the Enter key and the @ picker are the same three bindings
     rlWireNotesPanel makes, on the same markup, through the same one send —
     rlNotesSend with no change named. Bound to fresh markup on every paint, so
     they cannot stack. */
  const send = host.querySelector('[data-rl-chat-send]');
  if (send) send.addEventListener('click', () => {
    rlNotesSend(host, c, null, opts, send.getAttribute('data-room'));
  });
  const box = host.querySelector('.rl-np-in');
  if (box) box.addEventListener('keydown', e => {
    if (window.chatFieldSubmits ? chatFieldSubmits(e) : (e.key === 'Enter' && (e.preventDefault(), true)))
      rlNotesSend(host, c, null, opts, send && send.getAttribute('data-room'));
  });
  if (box && typeof rlNpTagWire === 'function') rlNpTagWire(host, box);
  /* THE TABS ARE WIRED HERE, exactly as the per-change panel wires its own:
     the rows are [data-rl-notes] and the delegated door armed at module load
     carries those, but a room switch has to repaint THIS host and nothing else
     knows which one it is. Bound to fresh markup on every paint, so they
     cannot stack. */
  host.querySelectorAll('[data-rl-np-room]').forEach(b => b.addEventListener('click', () => {
    rlNpSetRoom(b.getAttribute('data-rl-np-room'));
    rlChatPanelPaint(host, c, opts);
  }));
  /* ---- READING CHAT IS READING IT, AND THE MARK GOES ---- (2 Sep 2026)
     AFTER the rows are on screen, never before: the panel is built from the
     state the reader is about to see, and marking first would clear the very
     thing they were told to come and look at. The door is then repainted, or
     the symbol keeps a mark over a conversation already read. */
  negoMarkChatSeen(c, opts);
  try { if (window.paintChatDoor) paintChatDoor(); } catch (_){}
}
/* Paint and re-wire in one. The panel is rebuilt on every act — a room switch,
   a note posted — so the handlers below are bound to fresh markup each time and
   cannot stack. */
function rlNotesPanelPaint(host, c, ch, opts = {}){
  if (!host) return;
  host.innerHTML = rlNotesPanelHtml(c, ch, opts);
  rlWireNotesPanel(host, c, ch, opts);
}
/* ---- THE ONE SEND, AND THE ONE GUARD ON IT ----
   Every path through here goes through negoPostComment — the product's single
   writer — with the visibility the ROOM dictates rather than a switch's state.
   The external path additionally asks, every time: it is the only act on this
   panel that cannot be undone, because nothing in HaTi deletes or edits a note. */
/* ---- TYPING @ OPENS THE PICKER, AND PICKING WRITES THE NAME ----
   ONE FUNCTION, BOTH COMPOSERS: the card's notes and the drawer's are the same
   markup by construction, so this is armed on whichever host it is given and
   there is no second implementation to drift.

   THE MATCH IS ANCHORED AT THE CARET and requires the @ to start a word, so an
   email address in the middle of a sentence never opens it — that is the one
   false positive this control would otherwise have, and it is the commonest
   thing anybody types into a note about a counterparty. */
const RL_AT = /(^|[\s(\[])@([^\s@]{0,40})$/;
function rlNpTagWire(host, box){
  const menu = host.querySelector('[data-rl-np-tags]');
  if (!menu || !box) return;
  const rows = () => [...menu.querySelectorAll('.rl-np-tag')];
  const none = menu.querySelector('.rl-np-tag-none');
  let live = -1;
  const shut = () => { menu.hidden = true; live = -1;
    rows().forEach(r => { r.classList.remove('on'); r.setAttribute('aria-selected', 'false'); }); };
  const mark = () => rows().forEach((r, i) => {
    const on = i === live && !r.hidden;
    r.classList.toggle('on', on); r.setAttribute('aria-selected', String(on));
    if (on && r.scrollIntoView) r.scrollIntoView({ block: 'nearest' });
  });
  const shown = () => rows().filter(r => !r.hidden);
  const open = q => {
    const needle = String(q || '').toLowerCase();
    let any = 0;
    for (const r of rows()){
      const hit = !needle
        || r.textContent.toLowerCase().includes(needle);
      r.hidden = !hit;
      if (hit) any++;
    }
    if (none) none.hidden = !!any;
    menu.hidden = false;
    live = any ? rows().findIndex(r => !r.hidden) : -1;
    mark();
  };
  /* WHAT THE READER IS TYPING RIGHT NOW, read off the caret rather than off
     the whole value: a note can name two people, and the one being written is
     the one the picker is about. */
  const query = () => {
    const at = box.selectionStart == null ? box.value.length : box.selectionStart;
    const m = RL_AT.exec(String(box.value).slice(0, at));
    return m ? m[2] : null;
  };
  const put = name => {
    const at = box.selectionStart == null ? box.value.length : box.selectionStart;
    const head = String(box.value).slice(0, at);
    const m = RL_AT.exec(head);
    if (!m) return;
    const start = head.length - m[0].length + m[1].length;
    box.value = head.slice(0, start) + '@' + name + ' ' + String(box.value).slice(at);
    const caret = start + name.length + 2;
    if (box.setSelectionRange) box.setSelectionRange(caret, caret);
    shut();
    if (box.focus) box.focus();
  };
  box.addEventListener('input', () => {
    const q = query();
    if (q == null) shut(); else open(q);
  });
  box.addEventListener('blur', () => setTimeout(shut, 160));
  /* IN THE CAPTURE PHASE, AND ONLY WHILE THE MENU IS UP. The composer's own
     keydown sends the note on Enter, and it is armed on this same element —
     so while a name is being chosen, Enter has to mean "pick this one" and
     must not also post. Capture is what lets this answer first; when the menu
     is shut every key falls straight through and the send is untouched. */
  box.addEventListener('keydown', ev => {
    if (menu.hidden) return;
    const list = shown();
    if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); shut(); return; }
    if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp'){
      ev.preventDefault(); ev.stopPropagation();
      if (!list.length) return;
      const all = rows();
      const cur = list.indexOf(all[live]) ;
      const nxt = ev.key === 'ArrowDown'
        ? (cur + 1) % list.length : (cur - 1 + list.length) % list.length;
      live = all.indexOf(list[nxt < 0 ? 0 : nxt]);
      mark();
      return;
    }
    if (ev.key === 'Enter' || ev.key === 'Tab'){
      const r = rows()[live];
      if (r && !r.hidden){
        ev.preventDefault(); ev.stopPropagation();
        put(r.getAttribute('data-rl-np-tag'));
      }
    }
  }, true);
  menu.querySelectorAll('.rl-np-tag').forEach(r => r.addEventListener('mousedown', ev => {
    /* mousedown, not click: the blur above would shut the menu first. */
    ev.preventDefault();
    put(r.getAttribute('data-rl-np-tag'));
  }));
}
async function rlNotesSend(host, c, ch, opts, room){
  const box = host.querySelector('.rl-np-in');
  const text = String((box && box.value) || '').trim();
  if (!text){ if (box && box.focus) box.focus(); return false; }
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const ext = room === 'external';
  const them = c.counterparty || i18t('ng_the_counterparty');
  const us = (window.contractParty ? contractParty(c) : null) || window.FIRST_PARTY || 'this workspace';
  const other = side === 'counterparty' ? us : them;
  if (ext && window.confirmDialog){
    const ok = await confirmDialog({
      title: i18t('ng_np_confirm_title', { who: other }),
      message: ch ? i18t('ng_np_confirm_msg', { id: ch.id }) : i18t('ng_chat_confirm_msg'),
      confirmLabel: i18t('ng_np_confirm_go', { who: other }),
    });
    if (!ok) return false;
  }
  const msg = negoPostComment(c, ch ? ch.id : null, text, {
    side, author: opts.author, visibility: ext ? 'shared' : 'internal' });
  if (!msg) return false;
  /* SEEN IS KEYED BY CHANGE, so a note that belongs to no change marks nothing
     — there is no thread of its own for anybody to be behind on. */
  if (ch) negoMarkThreadSeen(negoSeenScope(c, opts), ch.id);
  if (opts.persist !== false && window.persist) persist(c);
  if (box) box.value = '';
  /* WHOEVER WAS NAMED IS TOLD, and the answer rides the ONE confirmation this
     act already draws rather than a second box beside it. Awaited, because
     "sent means sent" — a cheerful toast over a mail that never left is the
     fault this rulebook records four times — and it can only ever ADD a clause:
     with nobody named, or on a stage with no route, negoMentionLine is ''. */
  const atLine = negoMentionLine(await negoNotifyMentions(c, ch, msg));
  /* THE CHANNEL IS THE ONLY WAY OUT, so an internal note simply does not take
     it: there is no filter downstream that could later be got wrong. */
  if (ext){
    try {
      const sent = await negoPostToChannel(c, ch, msg);
      if (window.toast && sent && sent.ok)
        toast((ch ? i18t('ng_np_sent', { who: other, id: ch.id })
          : i18t('ng_chat_sent', { who: other })) + atLine, 'ok');
    } catch (e){
      if (window.toast) toast(i18t('ng_np_send_failed',
        { who: other, why: (e && e.message) || '' }), 'err');
    }
  } else if (window.toast){
    toast((ch ? i18t('ng_np_filed', { org: us, id: ch.id })
      : i18t('ng_chat_filed', { org: us })) + atLine, 'ok');
  }
  /* EACH SURFACE REPAINTS ITSELF. One send, two panels: the per-change panel
     redraws that change's thread and Chat redraws the whole contract's, and
     which one this is is exactly whether a change was named. */
  if (ch) rlNotesPanelPaint(host, c, ch, opts);
  else rlChatPanelPaint(host, c, opts);
  return true;
}
function rlWireNotesPanel(host, c, ch, opts = {}){
  if (!host || !host.querySelectorAll) return;
  host.querySelectorAll('[data-rl-np-room]').forEach(b => b.addEventListener('click', () => {
    rlNpSetRoom(b.getAttribute('data-rl-np-room'));
    rlNotesPanelPaint(host, c, ch, opts);
  }));
  const send = host.querySelector('[data-rl-np-send]');
  if (send) send.addEventListener('click', () => {
    rlNotesSend(host, c, ch, opts, send.getAttribute('data-room'));
  });
  const box = host.querySelector('.rl-np-in');
  if (box) box.addEventListener('keydown', e => {
    if (window.chatFieldSubmits ? chatFieldSubmits(e) : (e.key === 'Enter' && (e.preventDefault(), true)))
      rlNotesSend(host, c, ch, opts, send && send.getAttribute('data-room'));
  });
  /* THE SAME PICKER THE CARD ARMS — one function, both composers. */
  if (box && typeof rlNpTagWire === 'function') rlNpTagWire(host, box);
  /* THE FOLD IS NOT WIRED HERE. One delegated listener on document has owned
     [data-rl-note-more] since the card carried notes, and it owns this one too —
     the markup is the same three attributes. A copy here fired BESIDE it and
     each undid the other's label, which is what a second handler for one act
     always does. */
  /* THE WAY BACK TO THE CLAUSE — rlLinkFocus is the act the row's own Edit
     performs, so this is that door reached from the panel rather than a second
     implementation of it. */
  const which = host.querySelector('[data-rl-np-clause]');
  if (which) which.addEventListener('click', () => {
    const cl = which.getAttribute('data-rl-np-clause');
    if (cl && window.rlLinkFocus) rlLinkFocus(cl, 'card');
  });
}

/* ---------- THE NOTE ON ONE CHANGE (owner-ruled 31 Aug 2026) ----------

   *"When you finish your edit of a redline ... a pop up window appears. You can
   then have options: Skip or Add Note & File. If you add note & file, this note
   is stored and can only be accessed by owner via the highlight in image 2
   where if clicked, the pop up comes up again where you can edit or delete."*

   ONE BUILDER, TWO SHAPES, AND THE SHAPE IS READ RATHER THAN PASSED. Whether
   there is already a note of yours decides the verbs — add, or save and delete
   — and how you arrived decides the lead sentence. Two dialogs would be two
   places for the wording, the wall and the store to drift apart.

   THE FILING IS ALREADY DONE WHEN THIS OPENS, and that is the whole of what
   makes it safe to dismiss. The owner's own words were "Add Note & File"; on
   that reading a dialog dismissed by Escape, by the backdrop, or by a browser
   that closed the tab would lose a change somebody had finished writing. Filing
   first and then asking costs nothing — the note is additive and there is a
   door back to it for the life of the contract — and it means no press in this
   dialog can ever be the difference between a redline existing and not.

   IT IS ITS OWN OVERLAY, appended to <body>, at a z-index between the modal
   root (70) and confirmDialog (90). Above the modal root because the clause
   editor covers the page at 54 and a dialog raised from it must be visible;
   below confirmDialog because THIS dialog raises one, for the delete.

   IT WRITES NOTHING BUT A NOTE. negoPostComment is the one writer and
   negoEditNote / negoDeleteNote are the two acts beside it; nothing here
   touches the change, its wording, its fingerprint or its status. */
function rlNoteDialogHtml(c, ch, mine, opts){
  const filed = !!opts.filed;
  const mayWrite = notesMayWrite(c, opts);
  const them = c.counterparty || i18t('ng_the_counterparty');
  /* WHAT HAS ALREADY BEEN SAID ON THIS CHANGE, quietly, above the box — so a
     reader coming back to a change does not write the same sentence twice, and
     so an explanation that has GONE is visible as a record rather than as
     something to correct. It is the panel's own note rule, unchanged. */
  const said = negoRoomNotes(c, ch, null, opts, 'owner');
  const past = said.filter(m => m !== mine);
  const lead = filed
    ? i18t('ng_note_filed_lead', { who: _ne(them) })
    : i18t('ng_note_keep_lead', { who: _ne(them) });
  const box = mayWrite
    ? `<textarea id="rl-note-in" rows="2" wrap="soft"
        placeholder="${_nea(i18t('ng_note_ph'))}"
        aria-label="${_nea(i18t('ng_note_head', { id: ch.id }))}"
        >${_ne(mine ? (mine.text || '') : '')}</textarea>`
    : `<div class="rl-np-no">${RL_NP_LOCK}<span>${i18t('ng_np_viewer')}</span></div>`;
  /* THE VERBS. Delete draws only where there is something of yours still to
     delete — a note the other side is already holding is not one. The quiet way
     out says Skip where the window arrived by itself and Close where the reader
     opened it. */
  const del = (mine && mayWrite)
    ? `<button type="button" id="rl-note-del" class="rl-note-del"
        title="${_nea(i18t('ng_note_delete'))}">${i18t('ng_note_delete')}</button>`
    : '';
  const go = mayWrite
    ? `<button type="button" id="rl-note-ok" class="ui-btn ui-btn-primary">${
        i18t(mine ? 'ng_note_save' : 'ng_note_add')}</button>`
    : '';
  return `<div class="rl-note-dlg" role="dialog" aria-modal="true"
      aria-label="${_nea(i18t('ng_note_head', { id: ch.id }))}">
    ${''/* THE FILING IS THE HEADLINE AND THE NOTE IS THE SMALL THING UNDER IT,
           which is what they are. Drawn in the tone this product uses for
           something that has just gone right. Opened from the change's own
           Notes row there is nothing to confirm, so the tick stands down and
           the heading names the change instead. */}
    <div class="rl-note-h">
      ${filed ? `<span class="tick" aria-hidden="true">${RL_NOTE_TICK}</span>` : ''}
      <h3>${filed ? i18t('ng_note_head_filed', { id: _ne(ch.id) })
        : i18t('ng_note_head', { id: _ne(ch.id) })}</h3>
    </div>
    <p class="rl-note-lead">${lead}</p>
    ${past.length ? `<div class="rl-note-past">${
      past.map(m => rlNpNoteHtml(m, negoNoteRoom(m), 'owner', them)).join('')}</div>` : ''}
    ${box}
    <div class="rl-note-acts">
      <span class="rl-note-who">${RL_NP_GLOBE}<span>${
        i18t('ng_note_who', { who: _ne(them) })}</span></span>
      ${del}
      <button type="button" id="rl-note-skip" class="ui-btn">${
        i18t(filed ? 'ng_note_skip' : 'act_close')}</button>
      ${go}
    </div>
  </div>`;
}
const RL_NOTE_TICK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5 6.4 12 13 4.6"/></svg>';
/* ---- ONE ASK PER CHANGE, ON THE FILING THAT CREATED IT ----
   (owner-ruled 31 Aug 2026, decision D: asked once, on the first filing;
   revisions file silently.)

   THE READING IS THE RECORD'S OWN AND NEEDS NOTHING THREADED THROUGH IT.
   negoFileChange gives a brand-new change `revisions: []` and pushes the
   previous wording onto that list every time it folds a second edit into a
   pending ask — so an empty revisions list IS "this press created this change",
   exactly. A caller-supplied "is this new" flag would be the same fact
   remembered in two places, and the fourth filing door added later would have
   to remember it too; this way it inherits the rule for free.

   IT IS ASKED OF EVERY KIND OF CHANGE — an edit, an inserted clause, a
   deletion. A note saying why clause 7 came out is worth exactly as much as one
   saying why clause 4 was softened, and a rule that asked on one of the three
   is a rule nobody can predict.

   OUR SEAT ONLY, and that is not a permission but a fact about where the note
   would live: `ch.thread` is on the contract record, and the counterparty's
   page is rebuilt from a share payload and thrown away on the next repaint.
   Their own notes are a later piece of work, said out loud rather than half
   built (owner: "fixing this will come at a later stage").

   IT NEVER BLOCKS THE FILING. Every caller has already filed, persisted and
   repainted before this runs, so a dismissed dialog, a stage without the door,
   or a viewer who may not write costs nothing at all. */
function rlNoteAskAfterFile(c, ch, opts = {}){
  if (!c || !ch) return Promise.resolve(null);
  if ((opts.side || 'owner') !== 'owner') return Promise.resolve(null);
  if ((ch.revisions || []).length) return Promise.resolve(null);
  if (!notesMayWrite(c, opts)) return Promise.resolve(null);
  if (typeof openChangeNoteDialog !== 'function') return Promise.resolve(null);
  return openChangeNoteDialog(c, ch, { ...opts, filed: true });
}
/* THE DOOR. Resolves the change, draws the dialog, and resolves to what
   happened so a caller can say so — 'added' / 'updated' / 'removed' / null. */
function openChangeNoteDialog(c, ch, opts = {}){
  if (!c || !ch) return Promise.resolve(null);
  return new Promise(resolve => {
    const prev = document.getElementById('rl-note-overlay');
    if (prev) prev.remove();
    const paint = () => {
      const mine = window.negoMyNote ? negoMyNote(c, ch) : null;
      ov.innerHTML = `<div class="rl-note-scrim"></div>${rlNoteDialogHtml(c, ch, mine, opts)}`;
      wire(mine);
    };
    const ov = document.createElement('div');
    ov.id = 'rl-note-overlay';
    /* openModal's Escape stands down while a top overlay is up — otherwise one
       press answers this dialog AND closes whatever is behind it, which is a
       fault this product has already paid for once. */
    ov.setAttribute('data-top-overlay', '1');
    let release = null, undrag = null;
    const done = out => {
      if (release){ try { release(); } catch (_){} release = null; }
      if (undrag){ try { undrag(); } catch (_){} undrag = null; }
      ov.remove();
      document.removeEventListener('keydown', onKey, true);
      resolve(out);
    };
    function onKey(e){
      if (e.key !== 'Escape') return;
      /* A confirm raised BY this dialog sits on top of it and owns Escape
         while it is up — the same deferral openModal makes to us. */
      if (document.getElementById('confirm-overlay')) return;
      e.preventDefault(); e.stopPropagation(); done(null);
    }
    function wire(mine){
      if (release){ try { release(); } catch (_){} release = null; }
      if (undrag){ try { undrag(); } catch (_){} undrag = null; }
      const panel = ov.querySelector('[role="dialog"]');
      if (panel && typeof trapFocus === 'function') release = trapFocus(panel, { focus: false });
      /* ---- AND IT CAN BE MOVED OUT OF THE WAY (owner-asked 1 Sep 2026) ----
         The window the owner named. Armed HERE beside the focus trap rather
         than at the mount, because this is the function paint() re-runs and a
         redraw replaces the panel both of them are armed on. Nothing calls
         paint() a second time today — saving a note closes the window — so
         this is the cheap half of being ready for one rather than a fix for
         something happening now. The helper keeps the position on the OVERLAY
         for the same reason; see dragDialog in js/core.js. */
      if (panel && window.dragDialog) undrag = window.dragDialog(panel, { frame: ov });
      const scrim = ov.querySelector('.rl-note-scrim');
      if (scrim) scrim.addEventListener('click', () => done(null));
      const skip = ov.querySelector('#rl-note-skip');
      if (skip) skip.addEventListener('click', () => done(null));
      /* ---- THE "N OTHER NOTES · OPEN CHAT" LINE IS GONE (1 Sep 2026) ----
         It existed because the window showed only YOUR note, so a reader whose
         colleagues had written three opened an empty box and was told nothing.
         The window now prints what has already been said on the change, above
         the box, so the fact is on screen rather than counted and pointed at.
         `ng_note_others_one/_other` and `ng_note_open_chat` are STALE — flag
         any mention; both keys are left inert in both dictionaries. */
      const box = ov.querySelector('#rl-note-in');
      const ok = ov.querySelector('#rl-note-ok');
      if (ok) ok.addEventListener('click', async () => {
        const text = String((box && box.value) || '').trim();
        if (!text){ if (box && box.focus) box.focus(); return; }
        let out = null, msg = mine;
        /* ---- IT IS THE EXPLANATION, AND IT GOES TO THEM (owner-ruled 1 Sep
           2026: "Make them external so that when you suggest an edit, you give
           an explanation as to why you want to change the contract. That is the
           idea.") ----

           THIS CLOSES THE LOOP THE 28 Aug RULING OPENED. That day removed the
           mandatory "why this change?" step, and this file recorded the cost in
           its own words: `why` TRAVELLED and a note did not, so the sentence
           that explained a redline to the other side had to be typed on purpose
           in a box with a switch thrown. The window is that sentence now, asked
           once, at the moment the redline is made.

           EXTERNAL IS WHICH ROOM IT IS IN AND WHO IT IS FOR; the channel is
           what DELIVERS it. Both, in that order, so a refusal leaves the note
           on the record rather than losing what the reader typed.

           NO SECOND CONFIRMATION. Every crossing note in the panel asks first,
           because there the room is a setting and a forgotten setting must not
           publish a colleague's aside. Here there is nothing to set: the window
           names the counterparty on its own face and exists for no other
           purpose, so a dialog on top of a dialog is exactly the furniture that
           rule warns about. */
        if (mine && window.negoEditNote){
          if (!negoEditNote(c, ch, mine, text)) return;
          out = 'updated';
        } else {
          msg = negoPostComment(c, ch.id, text,
            { side: 'owner', author: opts.author, visibility: 'shared' });
          if (!msg) return;
          out = 'added';
        }
        if (opts.persist !== false && window.persist) persist(c);
        /* ---- AND "SENT" MEANS SENT ----
           negoPostToChannel is the ONE act that reaches them, and it answers
           honestly: outside API mode it skips, and a provider can refuse. The
           stamp goes on only where it actually went, which is what makes
           negoNoteDelivered — and therefore whether this note is still the
           writer's to change — true rather than assumed. */
        const them = c.counterparty || i18t('ng_the_counterparty');
        let gone = false;
        try {
          const res = await negoPostToChannel(c, ch, msg);
          gone = !!(res && res.ok);
        } catch (e){
          if (window.toast) toast(i18t('ng_np_send_failed',
            { who: them, why: (e && e.message) || '' }), 'err');
        }
        if (gone){
          msg.sentAt = (window.nowISO ? window.nowISO() : new Date().toISOString());
          if (opts.persist !== false && window.persist) persist(c);
        }
        /* WHOEVER WAS NAMED IS TOLD, through the same one door the panel's
           send uses — a second copy of who gets an email is how the two would
           come to disagree. It rides this window's own confirmation. */
        const atLine = negoMentionLine(await negoNotifyMentions(c, ch, msg));
        if (window.toast) toast((gone
          ? i18t('ng_np_sent', { who: them, id: ch.id })
          : i18t(out === 'updated' ? 'ng_note_updated' : 'ng_note_added', { id: ch.id })) + atLine, 'ok');
        if (typeof opts.onDone === 'function') opts.onDone(out);
        done(out);
      });
      const del = ov.querySelector('#rl-note-del');
      if (del) del.addEventListener('click', async () => {
        if (window.confirmDialog){
          const yes = await confirmDialog({
            title: i18t('ng_note_delete_title'),
            message: i18t('ng_note_delete_msg', { id: ch.id }),
            confirmLabel: i18t('ng_note_delete'), danger: true });
          if (!yes) return;
        }
        if (!window.negoDeleteNote || !negoDeleteNote(c, ch, mine)) return;
        if (opts.persist !== false && window.persist) persist(c);
        if (window.toast) toast(i18t('ng_note_removed', { id: ch.id }), 'ok');
        if (typeof opts.onDone === 'function') opts.onDone('removed');
        done('removed');
      });
      if (box && box.focus){
        box.focus();
        /* THE CARET GOES TO THE END OF WHAT IS ALREADY THERE, not over it: a
           reader opening their own note to add a sentence must not have it
           selected and lose it to the next keystroke. */
        try { const n = box.value.length; box.setSelectionRange(n, n); } catch (_){}
      }
    }
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(ov);
    paint();
  });
}

/* ---- THE COUNTERPARTY'S SEAT ONLY, SINCE 27 Aug 2026 ----
   Our seat's notes moved into the Notes panel, which is the shell's drawer and
   draws two rooms. THE COUNTERPARTY HAS NO DRAWER: their page hides the shell
   whole, which is why their alerts have a panel of their own, and sending them
   to one that does not exist would take away the only channel they have.
   NOTHING IS LOST BY THE SPLIT NOT REACHING THEM. They have no internal notes
   and never can — their page is rebuilt from the share payload and thrown away
   on every paint, so there is nowhere to keep one. Every note on their seat is
   external by definition, which is exactly the single room the panel would draw
   them. Their switch stays because it is theirs: it opens on Send-to-them (an
   internal-only box on their page reaches nobody, F58) and the internal face is
   how they mark a note their own side keeps.
   IT REFUSES OUR SEAT OUTRIGHT, and that is what keeps the one-box rule: with
   both drawn there would be two composers for one change, and the second is a
   box that accepts typing and posts nothing. When their page grows a drawer,
   this whole function retires. */
function rlCardNotesHtml(c, ch, opts, side){
  if (side !== 'counterparty') return '';
  const canComment = opts.canComment != null ? !!opts.canComment : !opts.readonly;
  const msgs = ((window.negoMergedThread ? negoMergedThread(c, ch, opts.messages) : (ch.thread || [])) || [])
    .filter(m => rlMsgVisible(m, side));
  /* Nothing said and nothing to say with: no block at all. An empty heading
     over an empty list is a card claiming there is a conversation. */
  if (!msgs.length && !canComment) return '';
  const who = side === 'counterparty'
    ? (opts.org || window.FIRST_PARTY || i18t('ng_the_counterparty'))
    : (c.counterparty || i18t('ng_the_counterparty'));
  /* ---- A LONG NOTE FOLDS, THE CARD DOES NOT GROW ----
     Asked for directly (Young, 10 Aug 2026): "when you enter a big paragraph
     of notes, the page card should not expand. there should be a feature to
     show more or show less." A pasted paragraph used to set the card's height
     for everyone scrolling past it. Anything past a few lines clamps to three,
     with the reader's own Show more / Show less under it — a plain DOM toggle
     (one delegated listener, beside the fold's), so pressing it repaints
     nothing and loses nobody's half-typed reply. */
  const list = msgs.map(m => {
    const t = String(m.text || '');
    const long = t.length > 220 || (t.match(/\n/g) || []).length >= 3;
    return `<div class="rl-cnote${m.visibility === 'shared' ? ' is-shared' : ''}">
      <div class="rl-cnote-top"><b>${_ne(m.who || 'Someone')}</b><span>${_ne(negoWhen(m.at))}</span>${
      m.visibility === 'shared' ? '' : `<span class="rl-cnote-int">${i18t('ng_internal_only')}</span>`}</div>
      <p${long ? ' class="rl-cnote-clamp"' : ''}>${_ne(t)}</p>
      ${long ? `<button type="button" class="rl-cnote-more" data-rl-note-more
        data-more="${_nea(i18t('ng_note_more'))}" data-less="${_nea(i18t('ng_note_less'))}">${i18t('ng_note_more')}</button>` : ''}
    </div>`;
  }).join('');
  /* ---- THE SWITCH, AND IT IS THEIRS ALONE NOW ----
     It was on both seats: the counterparty always had it (their page is the
     only channel they have, and an internal-only box there reaches nobody —
     F58), and ours gained it when the asymmetry was reported as the gap it was
     (Young, 10 Aug 2026: "there is no ability to toggle between internal and
     send to them like we have in the counterparty side").
     OUR HALF IS GONE, AND ITS PROPERTY IS KEPT AND MADE STRONGER (owner-ruled
     27 Aug 2026): our seat's destination is the ROOM the reader is standing
     in, so there is no setting left to leave pointing the wrong way. This
     function refuses our seat outright — see the note above it — so the ours
     branch below is unreachable and is kept only because THEIR default is
     expressed as the other half of the same ternary. f84's claim moved with
     the box and now pins the room. */
  const theirSeat = side === 'counterparty';
  const vis = `<div class="nego-visswitch" role="group" aria-label="${_nea(i18t('ng_who_can_read'))}">
        <button type="button" class="v-int" data-nego-vis="internal" data-for="${_ne(ch.id)}" aria-pressed="${theirSeat ? 'false' : 'true'}">&#128274; Internal</button>
        <button type="button" class="v-sh" data-nego-vis="shared" data-for="${_ne(ch.id)}" aria-pressed="${theirSeat ? 'true' : 'false'}">&#127760; ${i18t('ng_send_to_them')}</button>
      </div>`;
  /* The button and the promise under it FOLLOW THE SWITCH — a button still
     reading "Add note" while the switch says Send-to-them is a lie one press
     wide. Both faces are in the markup and CSS shows the one the pressed
     switch means (see .rl-when-int / .rl-when-sh), so the send handler and
     every test that reads textContent are untouched. */
  const composer = canComment ? `
    ${vis}
    <textarea class="chat-field rl-cnote-in" rows="2" id="nego-ti-${_ne(ch.id)}"
      placeholder="${_nea(theirSeat ? i18t('ng_reply_ellipsis') : i18t('ng_card_note_ph'))}"
      aria-label="${_nea(i18t('ng_start_thread_aria',{id:ch.id}))}"></textarea>
    <div class="rl-cnote-foot">
      <button type="button" class="rl-cnote-add" data-nego-send="${_ne(ch.id)}"><span class="rl-when-int">${
        i18t('ng_card_note_add')}</span><span class="rl-when-sh">${
        i18t('ng_send_this_reply')}</span></button>
      ${theirSeat ? '' : `<span class="rl-cnote-hint"><span class="rl-when-int">${
        i18t('ng_card_note_never',{who:_ne(who)})}</span><span class="rl-when-sh">${
        i18t('ng_card_note_goes',{who:_ne(who)})}</span></span>`}
    </div>` : '';
  return `<div class="rl-cnotes">
    <div class="rl-cnotes-k">${msgs.length ? i18t('ng_card_notes_n',{n:msgs.length}) : i18t('ng_card_notes')}</div>
    ${list}${composer}
  </div>`;
}
function redlineChangeCardsHtml(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const held = rlActorHeld(c, opts);
  /* ---- THE PREVIEW DRAWS THEIR SEAT, WITH THE VERBS DEAD ----
     (owner-reported 20 Aug 2026, off two screenshots: the owner's Counterparty
     view showed bare receipt rows where the counterparty's real link shows
     full cards with Accept / Reject / Edit and the wording preview.)

     The preview mounts read-only — deliberately, it is a window and must not
     act as them — and read-only killed canAct, which killed the verbs, which
     made every card classify as a "needs nothing" receipt. So the preview
     showed LESS than their page does, on the one control whose whole purpose
     is showing exactly what they see.

     The 19 Aug control-row rule, applied to the cards: draw what their seat
     draws, and let `disabled` refuse the press. previewSeat flips the two
     DRAWING flags to the counterparty page's own answers (their live link is
     readonly:false, canEdit:true) and the finished action bar is deadened
     wholesale below — disabled + data-rl-dead, the browser refusing to
     dispatch, which is what keeps f152's files-nothing sweep true. ONLY the
     owner's named preview (opts.preview, set by renderRedline's mount and by
     nobody else) takes this branch: the portal's real counterparty mount
     carries no preview flag, and an EXECUTED contract stays verbless — their
     real page is read-only then too. */
  const bandOpts = rlBandOpts(c, opts, side);
  const previewSeat = bandOpts.previewSeat;
  /* Answering the counterparty IS reaching them: an accept settles their ask
     and travels on the next round. */
  const canAct = previewSeat || (!opts.readonly && !held);
  /* Editing is not reaching them, and a reviewer correcting the wording is the
     thing this feature was built to allow. So `editable` keeps its own answer
     and only the SEND verbs below consult the posture. */
  const editable = previewSeat || (!opts.readonly && opts.canEdit !== false);
  const all = (typeof negoChanges === 'function') ? negoChanges(c) : [];
  /* Through the wall: the other side's unsent drafts have no card on this
     side, because on this side they do not exist. opts.hiddenIds — see
     redlineDocHtml — lets the transport-walled portal pass []. */
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  /* ---- A DECISION HELD IS NOT A DECISION GONE ----
     On the owner's record a decided change is settled, and leaves the column
     for the round history. On the counterparty's page a decision is HELD —
     nothing has reached the other side until they press Send — and a card
     that vanishes the moment they press Accept tells them the opposite: that
     it is done, irreversible, filed. So in holdsDecisions mode the decided-
     but-unsent cards stay, wearing their decision and an Undo, and leave the
     column only when the decision actually leaves the page. */
  const heldIds = new Set(opts.holdsDecisions ? (opts.heldDecisionIds || []) : []);
  /* A CONTESTED ASK OF YOUR OWN STAYS ON THE TABLE. Refused and not withdrawn
     is the one state that blocks the whole deal (negoAlignment) while sitting
     in neither "live" nor "held" — and a card that vanishes leaves the person
     who could clear the deadlock with nothing to press. It carries Withdraw,
     the engine's own settlement. */
  const contestedAny = x => x && x.status === 'rejected' && !x.withdrawn;
  /* Answers this reader has already SENT stay on the table saying so. The page
     rebuilds from a payload snapshotted before the send, so without these the
     verbs came back a moment after the answer left — the send reading as
     having done nothing. Re-deciding is allowed, behind one deliberate click,
     because the other side is holding the first answer. */
  const sentIds = new Set(opts.sentDecisionIds || []);
  const redeciding = id => _negoRedeciding[id];
  const mineOnly = rlMyCardIds(c, opts);
  const changes = rlCardSort(all.filter(x => (_rlIsLive(x) || heldIds.has(x.id) || contestedAny(x)
    || (bandOpts.banded && _rlSettledCard(x)) || sentIds.has(x.id)) && !hidden.has(x.id)
    && (!mineOnly || mineOnly.has(String(x.id)))
    /* Whose asks the reader asked to see. The SAME predicate redlineCardIds
       applies, so the count above this list and the list itself cannot
       disagree — see rlCardFilterPass. */
    && rlCardFilterPass(x, side)),
    /* AND THE SAME ORDER, from the same function AND WITH THE SAME BAND
       READING: the piles first, still-open work before settled inside each.
       Passing bandOpts here is what stops the pill and this column agreeing
       about the population and disagreeing about the sequence. See
       rlCardSort. */
    heldIds, bandOpts);
  /* Named on the module so the tab pill above reads the same answer — see
     redlineCardIds directly below. */
  /* Which of OUR asks have never left the building. The engine already answers
     this — the same count the wall and the batch send are drawn from — so the
     card's Send button and the toolbar's cannot disagree about what is unsent. */
  /* READ ONCE, IN rlBandOpts, and shared with redlineCardIds — the pill counts
     the same list this column draws, and since the bands are the outer sort
     order the two must not read "unsent" differently either.

     Three answers there, and the middle one is the subtle one: the preview's
     honest answer is the EMPTY set, because nothing on OUR record is unsent on
     THEIR side — an ask that is on this record has by definition arrived, and
     their real drafts live in their browser, which their own page reports
     through opts.unsentIds and this window cannot see. The turn-stamp
     arithmetic cannot know that, and read from their chair it called an
     arrived counter-ask "unsent" — a Send verb their page would never draw
     (caught by f92 the day previewSeat landed). */
  const unsent = bandOpts.unsent;
  if (!changes.length){
    const settled = all.filter(x => x.status === 'accepted' || x.status === 'rejected').length;
    /* ---- AN EMPTY COLUMN MUST SAY WHICH EMPTINESS THIS IS ----
       "No changes on the table" over a column the READER has just narrowed is
       the exact fault the filter was removed for: a control that can lose a
       change. So a filtered-empty column says it is filtered and offers the
       way back, and only a genuinely empty one gives the how-to-start blurb. */
    if (rlCardFilter() !== 'all')
      return `<div class="rl-cards-empty">
        <b>${_ne(i18t('ng_filter_none'))}</b>
        <span>${_ne(i18t('ng_filter_none_sub'))}</span>
        <span><button type="button" class="rl-cnote-more" data-rl-cardfilter="all">${_ne(i18t('ng_filter_show_all'))}</button></span>
      </div>`;
    return `<div class="rl-cards-empty">
      <b>${i18t('ng_no_changes')}</b>
      ${''/* THE WAY IN IS THE EDIT PILL NOW (16 Aug 2026). This blurb pointed
             at Direct Edit under the clause, and that row is retired — all
             writing happens in the clause panel, whose door is the Edit pill
             on every clause. Since 20 Aug 2026 the pill is the pencil icon,
             so the blurb names the symbol beside the word. */}
      <span>${opts.noAi
        ? `Press the <b>&#9998; ${i18t('ng_cp_edit')}</b> button on any clause to open its panel, then <b>&#43;</b> to propose new wording.`
        : `Press the <b>&#9998; ${i18t('ng_cp_edit')}</b> button on any clause to open its panel — <b>&#43;</b> starts a draft, and highlighting a passage offers <b>&#10024; Copilot</b>.`} ${i18t('ng_each_ask_lands')}</span>
      ${settled ? `<span>${settled} change${settled === 1 ? ' has' : 's have'} already been decided — ${settled === 1 ? 'it is' : 'they are'} in the document and the round history, not here.</span>` : ''}
    </div>`;
  }
  /* ---- THE FOUR BANDS (owner-asked 25 Aug 2026) ----
     Drawn on OUR seat only, for the same reason the card shape is: the
     counterparty's column is unchanged, as agreed. The order is the reader's
     own — what needs you, what you are still writing, what has gone, what is
     finished — and each heading carries its own count so nothing is hidden by
     a band that happens to be long. A band with nothing in it draws NOTHING:
     four headings over an empty column is furniture, and the empty-column
     blurb above already answers that state properly. */
  const banded = bandOpts.banded;
  /* THE BAND IS THE OUTER SORT AND rlCardSort IS THE INNER ONE, and this is
     the half a first pass got wrong TWICE. rlCardSort orders by rlCardRank —
     pending, then refused, then settled — and THREE of the four bands (their
     live ask, our unsent draft, our sent ask) are all rank 0, so a column left
     in rank order interleaves them: the heading either repeats down the column
     or, worse, a card sits over a card it is not true of. The first pass
     re-sorted HERE, which fixed the column and left the Tracked Changes pill
     counting the same changes in a different sequence — the two lists agreeing
     about the population and disagreeing about the order, which is the exact
     fault the note on redlineCardIds warns about. It is inside rlCardSort now,
     so there is ONE order and both callers get it. The list arriving here is
     already narrowed by the filter and already in that order. */
  const shown = changes;
  /* ---- WHERE THIS COLUMN'S EDIT BUTTON LANDS, DECIDED ONCE ----
     (owner-ruled 30 Aug 2026, with the two doors onto the clause panel.) The
     SAME reading rlClauseEditPillHtml's destination is chosen by, so the card's
     Edit and the paper's pencil cannot come to disagree about where one clause
     is edited — which is what put the panel in front of the owner in the first
     place. Asked here rather than per card for the reason that page gives in
     its own words: a destination chosen at draw time is what stops a door
     claiming a page nothing can open.
     The MODULE is asked for by name, not merely the width: a stage that does
     not load the editor at all must keep the jump. */
  const ceTakesIt = rlEditorTakesIt(side, { preview: previewSeat });
  let lastBand = null;
  const bandHead = ch => {
    if (!banded) return '';
    const b = rlCardBand(ch, side, unsent, heldIds, c);
    if (b === lastBand) return '';
    lastBand = b;
    const n = shown.filter(x => rlCardBand(x, side, unsent, heldIds, c) === b).length;
    const label = b === 'with'
      ? i18t('ng_band_with', { who: c.counterparty || i18t('ng_the_counterparty') })
      : i18t('ng_band_' + b);
    return `<div class="rl-band" role="presentation" data-rl-band="${_nea(b)}"><span>${
      _ne(label)}</span><b>${n}</b></div>`;
  };
  /* The card itself, unchanged in every branch below. Lifted out of the map so
     the band heading can be prefixed in ORDER — bandHead remembers the band it
     last emitted, so it must be called exactly once per card and in the order
     they are drawn, which is what map guarantees and evaluation order (left to
     right) preserves in the expression below. */
  const oneCard = ch => {
    const theirs = ch.authorSide !== side;
    /* ---- DRAFT / SENT, READ FROM THE RECORD ----
       An ask of ours is unsent while it was filed after the last hand-over —
       negoUnsentAsks is the one place that decides this, and the wall, the
       toolbar's batch send and this badge are all drawn from it, so they
       cannot disagree. Nothing here sets a "sent" flag of its own: the badge
       flips because the turn moved, and the turn moves only when something
       actually left the building. */
    /* ---- AND WHETHER AN INTERNAL REVIEWER HAS HELD IT ----
       A held ask is unsent and stays unsent: the Send verb comes off the card
       and the badge says who is holding it. Reading it here, from the shared
       model, rather than deciding it in this file — the phone's card and the
       contract tab's card ask the same function the same question. */
    const rvHeld = !theirs && !!(window.reviewHeld && reviewHeld(ch)) && unsent.has(ch.id);
    /* OUT WITH A COLLEAGUE, and therefore not something to send. Same treatment
       as a hold — the Send verb comes off — but a different badge and a
       different colour, because waiting and refused are different states and
       the card has to say which. */
    const rvOut = !theirs && unsent.has(ch.id)
      && !!(window.reviewOutFor && reviewOutFor(c, ch));
    /* WHO is holding it, where this reader is entitled to the name. Null
       otherwise, and the badge falls back to the anonymous wording. */
    const rvHeldBy = rvHeld && window.reviewVerdictByFor ? reviewVerdictByFor(ch, null, c) : null;
    const rvOutNamed = rvOut && window.reviewOutNameFor ? reviewOutNameFor(c, ch) : null;
    /* OUR OWN UNSENT DRAFT, whatever a review has since done to it. mineUnsent
       below is the narrower "…and free to send"; this one is what the card
       needs to know before it can offer a way OUT of a hold. */
    const mineDraft = !theirs && unsent.has(ch.id);
    const mineUnsent = mineDraft && !rvHeld && !rvOut;
    const mineSent = !theirs && !unsent.has(ch.id) && ch.status === 'pending';
    const heldHere = heldIds.has(ch.id) && ch.status !== 'pending';
    const sentHere = sentIds.has(ch.id) && ch.status !== 'pending' && !heldHere;
    const reopen = sentHere && redeciding(ch.id);
    const contested = ch.status === 'rejected' && !ch.withdrawn && !heldHere && !sentHere;
    /* The organisation is the AUTHOR's, not the viewer's — see the meta line
       below, where the reasoning lives. Read up here because the status word
       needs it too: a name it prints goes through the same shortener. */
    const metaOrg = ch.authorSide === 'counterparty' ? (c.counterparty || 'counterparty') : (window.FIRST_PARTY || 'us');
    /* ---- A NAME ON A CARD IS A GLANCE, NOT A RECORD (13 Aug 2026) ----
       "Young Mbagaya" reads "Young M." One shared function — cardName in
       js/core.js — so the two card renderers, the counterparty's page and the
       phone cannot drift apart. The organisation rides with it so a
       counterparty filing under their own company name is not initialled into
       a different company. Every caller keeps the whole name in hover text. */
    const _short = n => (window.cardName ? cardName(n, metaOrg) : String(n == null ? '' : n));
    /* Can the counterparty actually SEE this contract right now? Three answers
       — see negoTheirCopy. Asked once per card and only used where the card is
       about to claim the wait is theirs. Never from their own seat: they are
       reading this page through a link, and our view of our own links is not
       something their copy has or should have. */
    const whoThem = c.counterparty || i18t('ng_the_counterparty');
    const theirNoCopy = side !== 'counterparty' && !opts.readonly
      && (window.negoTheirCopy ? negoTheirCopy(c) === 'none' : false);
    /* ---- THE STATUS WORD IS SHORT, AND IT IS IN THE READER'S LANGUAGE ----
       (owner-asked, 13 Aug 2026.) Every one of these used to be a phrase typed
       into this file in English: "Accepted · 🔒 held", "Refused · withdraw or
       revise", "🔒 Draft". Two faults in one, which is why they are fixed in
       one pass rather than two:

       IT WAS TOO LONG FOR THE SLOT. A status is read at a glance, off a corner
       of a 285px card, and half of these were instructions rather than states.
       They elided, and an elided instruction is worse than no instruction.

       AND IT NEVER WENT THROUGH THE DICTIONARY, so a Swedish reader — reading
       Swedish buttons, over a Swedish contract — found this one corner in
       English. Every word below is a key now, with a Swedish twin.

       A SENTENCE REMOVED FROM THE SLOT IS FINDABLE BEFORE IT GOES, which is
       the rule that makes the trimming safe. Each entry carries its own hover
       text, and the two instructions that were carrying real information are
       kept there whole: "withdraw or revise" (whose verbs, Withdraw and Edit,
       are on the same card anyway) and "waiting on them" (which the reader's
       own seat already tells them). The padlocks are gone from Draft and from
       "· held": a padlock next to a word that already says the thing is
       decoration.

       Three entries KEEP a glyph, because it is the only difference between
       two states that share a word: ⏹ for a hold and ⌛ for out with somebody.

       [tone, word, hover] — the third slot is new. */
    const badge = heldHere ? (ch.status === 'accepted'
        ? ['ok', i18t('ng_badge_accepted_held'), i18t('ng_badge_held_title')]
        : ['no', i18t('ng_badge_rejected_held'), i18t('ng_badge_held_title')])
      : sentHere ? (ch.status === 'accepted'
        ? ['ok', i18t('ng_badge_accepted'), i18t('ng_badge_answered_title')]
        : ['no', i18t('ng_badge_rejected'), i18t('ng_badge_answered_title')])
      /* ---- AND THE WAIT IS ONLY CLAIMED WHERE IT IS TRUE (13 Aug 2026) ----
         "Refused — waiting on them" is a claim about THEIR screen. Where they
         hold no live copy of this contract it is false, and on MK-255 it was:
         the change was not on their copy at all. The word in the slot does not
         change — the card has ONE status slot and "Refused" is still the
         state — but the sentence under it does, and the card grows a way out.
         See negoTheirCopy for why 'unknown' keeps the old wording. */
      : contested ? ['no', i18t('ng_badge_refused'),
        !theirs ? i18t('ng_badge_refused_ours_title')
        : theirNoCopy ? i18t('ng_badge_refused_nocopy_title', { who: whoThem })
        : i18t('ng_badge_refused_theirs_title')]
      /* ---- ONE TAG, NOT TWO ----
         This badge and the review's own chip were both drawn, both ruby, both
         saying held — reported as "you are adding more and more tags which is
         also confusing" (Young, 09 Aug 2026). The card has ONE status slot and
         this is the card's status, so the badge keeps it and names who where
         the reader is entitled to the name; the chip stands down beside it. */
      : rvHeld ? ['no', '&#9209; ' + (rvHeldBy ? i18t('rv_badge_held_by', { who: _ne(_short(rvHeldBy)) }) : i18t('rv_badge_held')),
        rvHeldBy ? i18t('rv_held_what_now', { who: rvHeldBy }) : i18t('rv_held_what_now_anon')]
      /* NAMED, AND NOTHING ELSE. It read "⌛ With Achieng Otieno"; the "With"
         was the word doing least — the hourglass already says waiting and the
         name says who. A name needs no dictionary, so this branch prints it
         raw and rv_badge_waiting_by is retired (flag it as stale). */
      : rvOut ? ['draft', '&#8987; ' + (rvOutNamed ? _ne(_short(rvOutNamed)) : i18t('rv_badge_waiting')),
        rvOutNamed ? i18t('rv_waiting_title', { who: rvOutNamed }) : i18t('rv_waiting_title_anon')]
      : mineUnsent ? ['draft', i18t('ng_badge_draft'), i18t('ng_badge_draft_title')]
      : theirs ? ['sent', i18t('ng_badge_awaiting_you'), i18t('ng_badge_awaiting_title')]
      : ['sent', i18t('ng_badge_sent'),
        i18t('ng_badge_sent_title', { who: c.counterparty || i18t('ng_the_counterparty') })];
    /* The organisation is the AUTHOR's, not the viewer's. Written seat-relative
       ("theirs → counterparty, mine → us") this line flipped depending on who
       was reading it, so the counterparty's page attributed their own ask to
       the owner's organisation — and the two sides' cards could never match. */
    /* AND SAID ONCE. Where the person's name and their organisation are the
       same string — which is what a counterparty who filed under their own
       company name produces — this line printed it twice, so a card three
       lines tall spent one of them repeating itself. */
    const metaByFull = String(ch.by || ch.author || '').trim();
    /* ---- THE ROW NAMES THE CLAUSE, AND ONLY THE CLAUSE (owner-asked, 16 Aug
       2026 — the routing-row design). The author and their organisation left
       the visible line: the panel's own row says both, the coloured left edge
       already splits mine from theirs, and a sentence removed from a slot must
       stay findable — so they moved into this line's HOVER (the tip below),
       not out of the product. */
    const who = _ne(ch.clauseLabel || ch.clauseId || '');
    /* The same tooltip the marked wording in the document carries, so hovering
       either one answers the same question with the same words. */
    /* The person who last MOVED the wording, which is the reviser where there is
       one. It used to read the author unconditionally and so claimed the
       original author had made a change somebody else made. */
    const lastBy = String((side !== 'counterparty' && ch.revisedBy) || ch.author || ch.by || '').trim();
    /* THE HOVER KEEPS THE WHOLE NAME. This is the line the shortening happens
       on, so this is where the full name has to still be reachable — a name
       cut to an initial with no way back is a name lost. It names the author
       too, not only the last mover, because the visible line now shows an
       initial for them. */
    const tip = [lastBy ? i18t('ng_last_updated_by', { who: lastBy }) : '',
      (metaByFull && metaByFull !== lastBy) ? i18t('ng_asked_by_full', { who: metaByFull }) : '',
      /* The organisation rides here since it left the visible line — see `who`. */
      metaOrg && metaOrg !== metaByFull ? metaOrg : '']
      .filter(Boolean).join(' · ');
    /* ---- THE PROVENANCE LABEL IS NOT PAINTED ----
       `ch.note` on a Copilot-filed change is provenance — "Copilot — Edit",
       "Copilot — Shorten & Simplify (added after)" — written by the machinery
       rather than by a person. It used to render here as an amber bar with a
       padlock on it, on the author's side only.

       It is off the card because it told the reader nothing they did not
       already know. They selected the passage, chose the action and pressed
       Apply thirty seconds earlier; a strip of colour restating the button
       they pressed is a second thing to read on a card whose actual content —
       the wording, the reason, the four verbs — is what the column is for.
       Amber also reads as a WARNING everywhere else in this product, so the
       most eye-catching element on a routine card was the one carrying the
       least.

       The field itself is untouched and still written on every Copilot file:
       it is provenance, and the audit trail, the change history and the
       exports are where provenance is asked for and answered. Nothing about
       what crosses to the counterparty changes — a note never did. */
    /* ---- AND THE REASON, WHICH IS THE OPPOSITE OF THAT NOTE ----
       The note above is an internal aside: shown only to the side that wrote
       it, padlocked, because "Copilot — Simplify" is nobody else's
       business. A reason is written to be read by the other side — the field
       asking for it says so — so it renders on BOTH seats, unlocked, and it is
       the thing the whole two-step save exists to collect.

       It was going onto two other card renderers and not this one, which is
       the card in the change column that people actually read. A reason
       nobody sees is a reason nobody gives. */
    /* ---- AND IT IS OFF THE CARD (owner-asked 19 Aug 2026, off a screenshot of
       a refused ask whose whole reason was the word "No": "remove the why they
       asked feature from the cards in the negotiation page") ----

       THE FACT IS NOT LOST, WHICH IS THIS FILE'S OWN CONDITION FOR REMOVING A
       SLOT: the reason is printed in the clause panel's row for this change,
       one press of Open away, beside the wording it is a reason ABOUT. That is
       the same journey the author's name, the organisation and the full wording
       already took when the fat card became a routing row.

       The FIELD is untouched — still asked for by the two-step save, still on
       the record, still fingerprinted, still travelling to the other side, and
       still drawn on the contract tab's cards and in the closed-round history,
       which are different screens and were not what was reported. */
    const whyBlock = '';
    /* ---- AND WHO PUT IT THERE, WHEN THAT IS NOT WHO IT IS FROM ----
       An ask entered from this workspace wearing the counterparty's hat is
       recorded in their name — correctly, it IS their ask — but a card saying
       only that is a card claiming they sent it. The stamp is on the change
       itself (negoFileChange sets enteredBy), so it travels into the audit
       trail and the exports; this is it on the face of the card. */
    const behalfBlock = ch.enteredBy
      ? `<div class="rl-card-behalf" title="${_nea(i18t('ng_typed_on_behalf'))} &mdash; ${
          _nea(String(ch.enteredBy))} / ${_nea(String(ch.author))}">`
        + `<span aria-hidden="true">&#9998;</span> ${i18t('ng_entered_by_on_behalf',{who:_ne(_short(ch.enteredBy)),author:_ne(_short(ch.author))})}</div>`
      : '';
    /* ---- AND WHO REWROTE IT, WHEN THAT IS NOT WHO ASKED ----
       The same idea as the stamp above, one step along: enteredBy says who
       TYPED an ask filed in somebody else's name, this says who last changed
       the WORDING of an ask that stays in its author's name. It shows up when a
       colleague reviewing a redline simply corrects it, which is the common and
       useful thing for them to do — and which, until this line existed, left
       the card attributing their words to the person who raised the change. */
    /* OUR SEAT ONLY. The name of a colleague who corrected our wording is an
       internal fact, exactly like the note the reviewer left on it — the
       payload does not carry `revisedBy` at all, so the counterparty's real
       page could never draw this, and Counterparty View is supposed to show
       what they see rather than one thing more. Caught by f158 before it
       shipped, on the preview rather than in the payload. */
    const revisedBlock = (side !== 'counterparty' && ch.revisedBy && ch.revisedBy !== ch.author)
      ? `<div class="rl-card-behalf" title="${_nea(i18t('ng_revised_title'))} &mdash; ${
          _nea(String(ch.revisedBy))} / ${_nea(String(ch.author))}">`
        + `<span aria-hidden="true">&#9998;</span> ${i18t('ng_revised_by_after',{who:_ne(_short(ch.revisedBy)),author:_ne(_short(ch.author))})}</div>`
      : '';
    /* ---- THE FOUR VERBS, AND THE COLOUR EACH ONE IS ----
       Accept green, Reject red, Edit grey, Send green. Edit is on every live
       card and not only the decidable ones: revising your own ask is the most
       common thing done in this column, and it was the one act with no button.
       It carries the clause id rather than the change id because what it opens
       is the clause in the document — see rlWireCardEdit. */
    const verbs = [];
    if (canAct && sentHere && !reopen){
      verbs.push(`<button class="rl-edit" data-nego-redecide="${_ne(ch.id)}"
        title="${i18t('ng_answered_and_sent')}">${i18t('ng_change_decision')}</button>`);
    }
    if (canAct && (reopen)){
      verbs.push(`<button class="rl-acc" data-nego-accept="${_ne(ch.id)}">${i18t('ng_accept')}</button>`);
      verbs.push(`<button class="rl-rej" data-nego-reject="${_ne(ch.id)}">${i18t('ng_reject')}</button>`);
    }
    if (canAct && contested && !theirs){ /* asker's Withdraw below */
      /* Their no, your move: withdrawing is the acknowledgement that settles a
         refused ask — without it one rejection deadlocks Ready-to-sign for
         both sides forever. data-nego-withdraw is the engine's own handler. */
      verbs.push(`<button class="rl-edit" data-nego-withdraw="${_ne(ch.id)}"
        title="${i18t('ng_let_ask_go')}">${i18t('ng_withdraw')}</button>`);
    }
    /* ---- AND THE WAY BACK FROM A REFUSAL YOU GAVE (owner-asked, 13 Aug 2026)
       Reported from the column: a card of theirs that we had refused carried
       ONE verb — Edit — so the only route back from "no" was to go and rewrite
       their clause, which is a different act with a different author on it.
       Changing your mind about your own answer had no button at all.

       The engine has always allowed it and the contract tab's card has always
       drawn it (negoLiveCardsHtml's `undoable`, which on a side that holds
       nothing is every decided change): decide(id,'pending') puts the change
       back on the table, reverts the clause and travels to their copy through
       the same onDecided the first answer used. So this is the same handler —
       data-nego-undo — on the card the answer was actually given on, not a
       second path to one act.

       OUR SEAT ONLY, and only where WE were the ones who answered: an ask of
       our own that THEY refused is not ours to reopen, and it already carries
       Withdraw one branch up. On the counterparty's page the same ground is
       covered by Undo (a held answer) and Reopen (a sent one), each with its
       own rule about what has left their page — those are untouched.

       AND IT IS THE PLAIN OUTLINED VERB, not an accent pill (owner-asked, on
       the render): rl-edit is Edit's own class. Reopening is an ordinary
       correction, and nothing on this card should shout louder than Edit.

       AND IT DOES NOT MAKE THE CARD NEED YOU. It carries data-rl-reopen beside
       the engine's handler for exactly one reason: RL_CARD_INERT reads the
       button's markup, and Undo in general IS a move waiting on somebody (the
       counterparty's held answer has not been sent). This one is not — you have
       answered, the answer stands, and an escape hatch is not an outstanding
       move. The same reasoning the pattern already applies to Change decision. */
    if (canAct && contested && theirs && side === 'owner'){
      verbs.push(`<button class="rl-edit" data-nego-undo="${_ne(ch.id)}" data-rl-reopen="${_ne(ch.id)}"
        title="${_nea(i18t('ng_reopen_refusal_title'))}">${i18t('ng_change_decision')}</button>`);
    }
    /* ---- AND AN ACCEPTED CHANGE HAS THE SAME WAY BACK (owner-ruled 30 Aug
       2026, moved here so the clause panel's doors could be shut on our seat) ----
       THIS IS THE ONE THING THE PANEL HELD THAT NOTHING ELSE DID, and it is
       load-bearing rather than a convenience: negoResolve refuses to accept a
       change whose clause already carries a DIFFERENT accepted change measured
       alike, and it refuses IN WORDS naming reopening as the way out. Its
       mirror — reopening an accepted change a later one was written on top of —
       refuses the same way and says "reopen the top of the stack first". A
       refusal whose stated remedy cannot be reached is worse than no remedy,
       which is the whole of f208's lesson, so the remedy had to move BEFORE the
       doors shut rather than after.

       IT COULD ONLY MOVE HERE BECAUSE THE COLUMN CHANGED UNDER IT. Until the
       piles of 26 Aug an accepted change was filtered off this column entirely
       and had no card to carry anything; it sits under Accepted now.

       WHAT DELIBERATELY DID NOT MOVE, said out loud: the panel also offered
       this on a refused ask of OUR OWN, and this card does not. That is not an
       oversight — Withdraw is the verb for our own refused ask and is already
       on the card one branch up, and the mirror rule is that a refusal is
       reopened by the side that GAVE it.

       SAME ENGINE, SAME MARKER. data-nego-undo is decide(id,'pending'); the
       data-rl-reopen beside it is what keeps RL_CARD_INERT from reading this
       card as a move waiting on somebody, for the reason the branch above
       states in its own words. */
    if (canAct && side === 'owner' && ch.status === 'accepted' && !ch.withdrawn){
      verbs.push(`<button class="rl-edit" data-nego-undo="${_ne(ch.id)}" data-rl-reopen="${_ne(ch.id)}"
        title="${_nea(i18t('ng_reopen_ask_title', { id: ch.id }))}">${i18t('ng_change_decision')}</button>`);
    }
    if (canAct && heldHere){
      /* ---- THE SEND IS ON THE CARD THE DECISION WAS MADE ON ----
         Asked for directly (Young, 11 Aug 2026: "the send should be a button
         in the card which is the more logical thing to do"). You pressed
         Accept HERE; the act that makes it real should not live only in a bar
         at the other end of the page. Same pattern as the owner's per-card
         Send below: data-rl-send is a PROXY onto the page's one postbox
         (#nego-send-decisions on this seat), so it sends EVERYTHING held —
         one send, batch semantics, and the title says so. A per-card send
         that sent one answer while two others stayed home would let a reader
         believe they had answered when they half had. */
      verbs.push(`<button class="rl-send" data-rl-send="${_ne(ch.id)}"
        title="${_nea(i18t('ng_send_answer_title',{who:opts.org || window.FIRST_PARTY || 'the other side'}))}">${i18t('ng_send')}</button>`);
      /* The answer has not left this page; the person who gave it can take it
         back. data-nego-undo is the engine's own re-open. */
      verbs.push(`<button class="rl-edit" data-nego-undo="${_ne(ch.id)}"
        title="${i18t('ng_take_answer_back')}">${i18t('ng_undo')}</button>`);
    }
    /* ---- AND NEVER ON AN ASK THAT HAS BEEN TAKEN BACK (26 Aug 2026) ----
       A withdrawal is recorded as a FLAG rather than as a status: `withdrawn`
       goes on beside whatever answer the change already carried, which is why
       _rlIsLive has always had to ask both. This branch asked only the status,
       so a withdrawn ask still reading 'pending' was offered Accept and Reject
       — a decision on something the other side has taken off the table.
       IT WAS UNREACHABLE UNTIL TODAY and that is the only reason it survived:
       a withdrawn change was filtered off the column entirely, so the branch
       could never run on one. Giving withdrawn work a pile of its own is what
       put it on screen, and this is the same reading _rlIsLive makes. */
    if (canAct && theirs && _rlIsLive(ch) && !heldHere){
      verbs.push(`<button class="rl-acc" data-nego-accept="${_ne(ch.id)}">${i18t('ng_accept')}</button>`);
      verbs.push(`<button class="rl-rej" data-nego-reject="${_ne(ch.id)}">${i18t('ng_reject')}</button>`);
    }
    /* ---- EDIT GOES WHERE THE PENCIL GOES (owner-ruled 30 Aug 2026) ----
       "shut the two doors that put it in front of me." This button was the one
       the owner pressed to reach the clause panel: it jumped to the clause and
       opened the panel on it, on a seat where the pencil, twelve pixels away on
       the paper, has opened the EDIT PAGE since 29 Aug. So one clause had two
       doors going to two different places, which is the drift the one-door rule
       exists to prevent — and the panel was never meant to be in front of this
       reader at all.

       DECIDED AT DRAW TIME, NOT BY FALLING THROUGH A REFUSAL, which is this
       page's own convention for exactly this and what keeps it from becoming a
       dead press: `ceTakesIt` is the same reading rlClauseEditPillHtml's
       destination is chosen by, asked once for the whole column.

       THE COUNTERPARTY'S SEAT IS UNTOUCHED and keeps the jump: the editor
       refuses them outright, so sending them to it would take away the only way
       their page has to propose wording. Same button, same class, same place —
       only where it lands differs, and only on our seat. */
    if (editable && !heldHere){
      /* ---- AND WHERE THE EDIT PAGE CANNOT TAKE THE CLAUSE, THE PANEL IS THE
             WAY IN (2 Sep 2026) ----
         This row used to be the ⋯ menu's, drawn on exactly this condition, and
         the menu has gone. It could not go with it: on a window too narrow for
         the editor's two columns, and on a stage that does not load the module
         at all, the clause panel is the ONLY way a clause is edited — the same
         capability the counterparty's seat keeps for the same reason. A door
         removed with the drawer it happened to live in would take that away
         silently, which is the one thing this rebuild must not do.
         `rlEditorTakesIt` is the one reading and both branches ask it. */
      if (!ceTakesIt && opts.cpPanel && ch.clauseId && ch.changeType !== 'insertClause')
        verbs.push(`<button type="button" class="rl-edit" data-rl-cp-open="${_nea(ch.clauseId)}"
          title="${_nea(i18t('ng_row_open_title'))}">${i18t('ng_row_open_panel')}</button>`);
      /* ---- AND IT NAMES COPILOT, IN COPILOT'S OWN COLOUR (2 Sep 2026) ----
         On the row this verb had to be one short word — a card's face has room
         for two — and the ⋯ named it in full in the violet this product uses
         for Copilot. In the body there is room, so the name and the colour come
         back rather than being lost with the menu: "Edit" alone said nothing
         about which of the two editors it opened, and the violet is how every
         other Copilot control in this product marks itself. */
      verbs.push(ceTakesIt
        ? `<button class="rl-edit rl-verb-ai" data-rl-cp-editor-row="${_nea(ch.clauseId)}" data-rl-cp-editor-change="${_nea(ch.id)}"
        title="${_nea(i18t('ng_cp_edit_title'))}">&#10022; ${i18t('ng_cp_copilot')}</button>`
        : `<button class="rl-edit" data-rl-edit="${_nea(ch.clauseId)}" data-rl-edit-change="${_nea(ch.id)}"
        title="${i18t('ng_jump_to_clause')}">${i18t('act_edit')}</button>`);
    }
    /* A draft that has never left the building can simply be taken back —
       negoRetractDraft removes the record, so nothing is withdrawn from
       anyone. Once sent, the honest verbs are Withdraw and revise, above. */
    /* ---- ASK FOR A REVIEW FROM THE CHANGE ITSELF ----
       The way in used to be the toolbar, which opens a dialog listing
       everything — fine at the end of a read, useless in the middle of one. You
       are on clause 5, you want sales to see THIS, and you should not have to
       remember it until you reach the end. Opens the same dialog scoped to this
       one change. */
    /* OUR SEAT ONLY. `mineUnsent` means "the reader's own unsent draft", which
       on the counterparty's page is THEIR draft on THEIR side — and they have
       no internal review, no colleagues here and no business being offered one.
       Caught by F100f, which reads the counterparty's verbs verbatim. */
    if (editable && mineUnsent && !rvOut && !rvHeld && window.openReviewAskModal
        && window.reviewSeatShowsReview && reviewSeatShowsReview(opts))
      verbs.push(`<button class="rl-edit" data-rl-ask-review="${_nea(ch.id)}"
        ${''/* THE PERSON EMOJI CAME OFF (owner-asked 26 Aug 2026). It was the
             only mark on any verb: bare words on the face beside four other
             bare words, and in the ⋯ menu — where every row now carries a
             sprite symbol — a SECOND mark on the one row that already had one.
             The sprite's own i-people is what this row wears there, at the
             menu's hairline weight and in the row's own ink, which a colour
             emoji could never do. */}
        title="${_nea(i18t('rv_card_ask_title'))}">${i18t('rv_card_ask')}</button>`);
    /* ---- AND THE WAY OUT OF A HOLD ----
       A held change had ONE verb on it — Edit — and no route anywhere. Send was
       gone (correctly), the ask was gone (because it tested mineUnsent, which a
       hold clears), and so was Withdraw. Reported exactly as that: "there is no
       button to resolve the situation." A rule with no way forward is a dead
       end, not a rule.

       Only the person who placed the hold can lift it, so the way forward is to
       ask them again — a fresh review, scoped to this one change, which gives
       them back the buttons. Offered only where nothing is already open on it,
       because a change sitting with somebody does not need asking twice. */
    if (editable && rvHeld && !rvOut && window.openReviewAskModal
        && window.reviewSeatShowsReview && reviewSeatShowsReview(opts)
        && !(window.reviewInOpen && reviewInOpen(c, ch)))
      verbs.push(`<button class="rl-edit" data-rl-ask-review="${_nea(ch.id)}"
        title="${_nea(i18t('rv_held_ask_again_title'))}">&#128100; ${i18t('rv_held_ask_again')}</button>`);
    /* Taking your own draft off the table is not sending it, so a hold does not
       stand in the way — and it is the other honest answer to a refusal. */
    if (editable && (mineUnsent || rvHeld)) verbs.push(`<button class="rl-rej" data-rl-retract="${_nea(ch.id)}"
        title="${_nea(i18t('ng_retract_title',{who:c.counterparty || i18t('ng_the_counterparty')}))}">${i18t('ng_retract')}</button>`);
    /* The one verb on this card that reaches the other company, so the one the
       reviewer's posture takes away. Retract above stays: taking your own draft
       back is not a send. */
    if (editable && mineUnsent && !held) verbs.push(`<button class="rl-send" data-rl-send="${_nea(ch.id)}"
        title="${_nea(i18t('ng_send_unsent_title',{who:c.counterparty || i18t('ng_the_counterparty')}))}">${i18t('ng_send')}</button>`);
    /* ---- AND WHAT THE SEND BECOMES: NOTHING AT ALL ----
       (owner-asked, 13 Aug 2026 — and this REVERSES a decision taken a day
       earlier, deliberately and with the loss weighed.)

       There were three versions of this slot in three days. It was an amber
       button saying "Sent", a centimetre under a status corner saying the same
       word. Then, on 12 Aug, it was a quiet neutral marker — a tick and "With
       them" — on the argument that a verb which vanishes on success leaves the
       reader unsure whether they pressed it, and that on a column of six cards
       there is nothing left to compare against.

       That argument is real and the owner has read it. The decision is that
       the STATUS CORNER answers it: it says Sent, in colour, one line above,
       on the same reading — neither is a flag anybody sets, both follow from
       the turn having actually moved. A second confirmation on the one card in
       the column that needs nothing from the reader was buying very little
       with a whole button's worth of the card's width.

       So the action bar draws nothing here. `mineSent` is still computed —
       the badge above is built from it — and the bar keeps whatever else
       belongs on the card, which for a sent ask of ours is Edit.

       AND A SENT CARD STILL READS AS NEEDING NOTHING. That used to be true
       because data-rl-sent was in RL_CARD_INERT; it is true now because the
       only verb left, Edit, is inert for its own reason (it navigates). The
       attribute has left the pattern with the button — see RL_CARD_INERT — and
       f100 proves the outcome from the card rather than from the rule. */
    /* ---- THE ORIGIN PILL IS GONE FROM THIS CARD (owner-asked, 12 Aug 2026) ----
       It was a green "Your ask" — or, on their asks, the counterparty's own
       name — in the card's lead group, and it had a long and careful history:
       it started as "Counterparty", which is what BOTH parties call the party
       opposite them, so on the counterparty's own page it labelled the SENDER's
       ask with the word that reader uses for themselves ("why can I change a
       decision on my own ask?"). Naming the organisation fixed that, and the
       fix was right.

       WHAT WAS WRONG WAS THE PILL, NOT THE WORDING. The head of a 285px card
       carries an id, a status badge and a round tag; the origin was a THIRD tag
       in a corner that already had two, and the question it answered is answered
       twice more within an inch of it — by the Mine / Theirs / All filter
       standing over the whole column, and by the line directly under the head,
       which names the author AND their organisation (see `who` above, which is
       read from the AUTHOR's side on either seat and so says the same thing on
       both pages). Three answers to one question is what the reader called
       tags piling up.

       WHAT DELIBERATELY STAYS, and none of it is the pill:
         · data-rl-origin on the <article>, which is what paints the COLOURED
           LEFT EDGE — the fastest fact on the card, and the one channel that
           splits eight cards into two groups without being read;
         · the ask TAGS inside the document, which mark which ask sits on which
           clause and are the only thing doing that where it actually sits;
         · the meta line naming the author and their organisation, which is
           where the counterparty's name lives now.
       Removed from BOTH card renderers on the same day, so the two cannot
       drift; the styling went with it. The PAST-ROUND card in the history
       panel keeps its own — see negoHistoryCardHtml. */
    /* The reviewer's verdict, and — on the reviewer's own screen — the buttons
       that set it. Both come from js/review.js so this card and the contract
       tab's card cannot disagree about what the boss said. */
    /* The badge above carries the review's state on this card, so the shared
       chip would be the same sentence twice. It still runs on the contract
       tab's card, which has no such badge. */
    const rvChip = (!rvHeld && !rvOut && window.reviewChipHtml) ? reviewChipHtml(ch, opts, c) : '';
    const rvNoteBlock = (() => {
      if (!window.reviewSeatShowsReview || !reviewSeatShowsReview(opts)) return '';
      const v = window.reviewOn ? reviewOn(ch) : null;
      if (!v || !v.note) return '';
      /* THE NOTE NAMES ITS AUTHOR, so it is theirs and the requester's to read.
         The chip above already drops the name for everybody else; leaving the
         note behind would have handed back both the name and the reasoning. */
      const sayBy = window.reviewVerdictByFor ? reviewVerdictByFor(ch, null, c) : v.by;
      if (!sayBy) return '';
      return `<div class="rl-card-why" style="border-left-color:var(--st-amber-line)" title="${_nea(String(sayBy))}">
        ${''/* rl-said-k, not the bare caption class: this line holds a PERSON'S
               NAME and capitals read as shouting. See the twin in negoDocHtml.
               Shortened like every other name on a card; the whole one is on
               the block's own hover. */}
        <span class="rl-card-why-k rl-said-k">${i18t('rv_reviewer_said', { who: _ne(_short(sayBy)) })}</span>
        <span class="nego-why-clamp">${_ne(v.note)}</span></div>`;
    })();
    /* ---- AND IT SAYS WHAT IS HAPPENING ----
       A tag is a state, not an explanation. This is the sentence a reader needs
       when the Send button has gone: who stopped it, that only they can lift
       it, and the two things that can be done about it. */
    /* ---- THE SENTENCE THAT REPLACES THE CLAIM, AND ITS WAY OUT ----
       A refusal of ours on an ask of theirs, with no live copy on their side:
       the card says what we actually know and offers the act that makes the
       wait real. It rides in the action bar's own stack, beside the review
       hold's "what now" — the same shape, for the same reason: an absence with
       no sentence reads as a broken page, and a sentence with no verb reads as
       a dead end. THE STATUS SLOT IS NOT DOUBLED; this is prose under it. */
    const noCopyBlock = (contested && theirs && theirNoCopy)
      ? `<div class="rl-card-why" style="border-left-color:var(--st-amber-line)">
          <span class="rl-card-why-k rl-said-k">${i18t('ng_nocopy_k')}</span>
          <span>${_ne(i18t('ng_nocopy_say', { who: whoThem }))}</span>
        </div>` : '';
    const rvStuckBlock = (rvHeld && window.reviewSeatShowsReview && reviewSeatShowsReview(opts))
      ? `<div class="rl-card-why" style="border-left-color:var(--st-ruby-line)">
          <span class="rl-card-why-k rl-said-k">${i18t('rv_held_what_now_k')}</span>
          <span>${_ne(rvHeldBy ? i18t('rv_held_what_now', { who: rvHeldBy }) : i18t('rv_held_what_now_anon'))}</span>
        </div>` : '';
    /* WHO WROTE IT, and — where a verb is missing because of the desk — whose
       decision it is. Both are built in js/desk.js so the contract tab's card
       renderer gets exactly the same two lines from the same function; a fix in
       one renderer is not a fix in the other. The "instead" line sits AFTER the
       verbs, because it is about the gap where a verb would have been. */
    const dkBy = window.deskCardByHtml ? deskCardByHtml(c, ch, opts) : '';
    const dkInstead = window.deskCardInsteadHtml ? deskCardInsteadHtml(c, ch, opts) : '';
    /* ---- THE CONVERSATION LIVES ON THE CHANGE IT IS ABOUT ----
       A thread hangs off a change. It used to be drawn in a Discussion column
       beside this one — the same list of changes, in a different order, behind
       a tab — so reading what your team said about clause 6.1 meant leaving the
       card for clause 6.1. It reads here now (Young, 10 Aug 2026), inside the
       card, where the wording and the verbs are.

       AND IT IS INTERNAL. The column it replaces carried an internal/shared
       switch, so a message could be written FOR the counterparty; this box has
       no switch and says so under the button. The hidden marker below is what
       tells the engine's send handler which it is — see the visBtn lookup in
       wireNegotiationTab, which reads the pressed state rather than assuming a
       default. Messages already on the record are still shown whichever way
       they were written, because hiding them would rewrite the history. */
    /* ---- THE WORDING IS OFF THE ROW, AND THAT REVERSES A REVERSAL ----
       (owner-asked, 16 Aug 2026 — the routing-row design.) The clamped two-line
       copy was restored on 10 Aug because the card that was left read as a
       filing reference. What has changed since is that the CLAUSE PANEL exists:
       it prints every ask's full wording on the clause it is about, and the
       marks are on the paper beside this column. Two other copies within reach
       is what makes the row honest without one of its own; Open is the door.
       The NOTES went the same way — the thread and the reply box render in the
       panel's own row now (rlClausePanelBodyHtml), where the one engine-wired
       composer actually posts. */
    /* ---- THE VERBS ARE ON THE ROW, AND NOTHING CAN HIDE THEM ----
       There is no fold and no hidden body left (16 Aug 2026), so this rule is
       now structural twice over. Two halves of it predate the row and still
       matter more than the layout:

       ONLY THE HEAD NAVIGATES. The action bar is a sibling of the head, not a
       child of it, so pressing Edit, Retract or Send does its own job and
       nothing else — a verb can never navigate the reader away underneath the
       hand reaching for it.

       A VERB IS VISIBLE PIXELS (f180). Nothing here may be reachable only
       behind another control, which is why the review verdict buttons ride in
       this bar too, and why the two sentences that explain a MISSING verb —
       the desk's "instead" line and the review hold's "what now" — come with
       them. An action bar with a hole in it and the explanation elsewhere is
       worse than either. */
    /* ---- AND THE REQUESTER'S WAY OUT OF THEIR OWN ESCALATION ----
       Cancel used to live only in the review notice, which since 10 Aug 2026
       arrives folded behind a bell — a verb that existed and could not be
       found. It rides in the action bar now, beside the status that explains
       why this change cannot be sent, which is where somebody is standing when
       they decide the ask was a mistake. Built in js/review.js so this card and
       the contract tab's card cannot disagree about who may see it, and the
       predicates go with it: requester or admin only, never the reviewer, never
       the counterparty. */
    const rvCancel = window.reviewCardCancelHtml ? reviewCardCancelHtml(c, ch, opts) : '';
    /* THE WAY OUT, ON THE SAME SCREEN — the share dialog, which is where a
       live link is made. A proxy onto the one door rather than a second
       transport, exactly like the card's Send. Never on their seat and never
       on a read-only copy: theirNoCopy already refuses both. */
    if (theirNoCopy && contested && theirs && editable)
      verbs.push(`<button type="button" class="rl-send" data-rl-sendcopy="1"
        title="${_nea(i18t('ng_send_copy_title', { who: whoThem }))}">${i18t('ng_send_copy')}</button>`);
    const rvVerbs = window.reviewVerbsHtml ? reviewVerbsHtml(c, ch, opts) : '';
    const actions = [
      noCopyBlock,
      rvStuckBlock,
      (verbs.length || rvCancel) ? `<div class="rl-card-verbs">${verbs.join('')}${rvCancel}</div>` : '',
      dkInstead,
      rvVerbs,
    ].filter(Boolean).join('');
    /* ---- WHAT STAYS VISIBLE ON THE ROW ----
       The rare, load-bearing strips only: the desk's "drafted by" caption (a
       colleague's shared draft must say whose hand wrote it — f166's claim,
       with its own seat rules in js/desk.js), who typed it on whose behalf,
       who rewrote it, the author's reason (the one thing the routing-row
       design names), and the reviewer's note (a name-drawing surface the
       review feature counts on — see reviewMaySee). Each is conditional and
       usually absent, which is what keeps the row a row. They are VISIBLE now
       rather than parked in a hidden body only the pop-out could show — the
       pop-out is retired, and a fact behind a control that no longer exists is
       a fact lost. */
    const info = [dkBy, behalfBlock, revisedBlock, whyBlock, rvNoteBlock].filter(Boolean).join('');
    /* What holds a card OPEN as a full card is narrower than what a full card
       shows: the desk's "drafted by" and the author's own reason are captions
       — on a change that needs nothing they are finished business, and both
       stay one Open away in the panel — so a sent ask carrying only those
       still shrinks to a receipt. The CAUTION strips — on-behalf, revised-by,
       the reviewer's note — keep the full card: each is a fact a reader
       should not have to go looking for. */
    const infoHold = [behalfBlock, revisedBlock, rvNoteBlock].filter(Boolean).join('');
    /* The preview's verbs are pixels, not presses — deadened WHOLESALE after
       classification, so the receipt/full-card decision and the needs-you
       reading stay exactly the counterparty page's own. See previewSeat. */
    const deaden = h => previewSeat && h
      ? h.replace(/<button /g, `<button disabled aria-disabled="true" data-rl-dead="1" `) : h;
    const actionBar = actions ? `<div class="rl-card-actions">${deaden(actions)}</div>` : '';
    /* ---- OPEN RAISES THE CLAUSE PANEL (owner-asked, 16 Aug 2026) ----
       The row's one door into the reading matter. It carries data-rl-cp-open —
       the clause panel's own delegated control, armed at module load in the
       capture phase — so pressing it opens THE panel this page already has, on
       the clause this change sits in, where the full wording, the history and
       the reply box are. Never a second panel and never a copy of the content.

       DRAWN ONLY WHERE THE ROOM BEHIND IT EXISTS: the mount must carry the
       panel (opts.cpPanel — the Word export renders these cards' canvas with
       no panel), and a proposed NEW clause has no body in it (the panel's
       bodies are built per clause on the paper), so its row keeps the body
       press alone rather than a button that opens nothing. */
    const openBtn = (opts.cpPanel && ch.clauseId && ch.changeType !== 'insertClause')
      ? `<button type="button" class="rl-open-btn" data-rl-cp-open="${_nea(ch.clauseId)}"
          title="${_nea(i18t('ng_row_open_title'))}"
          aria-label="${_nea(i18t('ng_row_open_title'))} ${_nea(ch.id)}">${i18t('ng_row_open')}</button>`
      : '';
    /* ---- AND THE SECOND DOOR ONTO THE CLAUSE EDITOR (25 Aug 2026) ----
       The approved journey puts Edit with Copilot AHEAD of the clause panel on
       every tracked change, so it LEADS this pair. It is the ✦ alone, with its
       words on the hover: this row's whole design is that a receipt stays one
       line, and a second labelled button is what would push it to two.

       IT IS NOT A SECOND ROUTE — data-rl-cp-editor-row carries the clause and
       the change, and the per-paint handler resolves it exactly as the panel's
       own Copilot button does, through rlOpenClauseEditor and nothing else.

       DRAWN ON THE SAME TERMS AS Open, plus the two this page can answer
       before the press: our own seat, and a reader who may actually redline.
       A door that can only refuse is furniture — the standing rule.

       IT DOES NOT WEAR .rl-open-btn, and that is not tidiness: that class
       MEANS the Open button — half a dozen checks resolve it by that class
       alone — and a second element answering to it makes every one of them
       pick whichever comes first in the markup. It takes the same dressing
       from the same rule instead, which is where a shared look belongs. */
    const ceBtn = (openBtn && !previewSeat && side === 'owner' && editable && window.rlOpenClauseEditor)
      ? `<button type="button" class="rl-cp-editor-btn"
          data-rl-cp-editor-row="${_nea(ch.clauseId)}" data-rl-cp-editor-change="${_nea(ch.id)}"
          title="${_nea(i18t('ng_cp_copilot'))}"
          aria-label="${_nea(i18t('ng_cp_copilot'))} ${_nea(ch.id)}">&#10022;</button>`
      : '';
    /* ---- WORK BIG, RECEIPTS SMALL (owner-asked 16 Aug 2026, Option 4 of four
       mocked renders — the routing rows "look very empty and almost useless").
       The card's SIZE follows what it needs from the reader:

       · A change with a move on it — Accept/Reject, Send, Withdraw, Undo,
         Retract, a reviewer's verdict, a way back (Reopen / Change decision),
         a cancel, or any explanatory strip — keeps the FULL card, and the full
         card gets its two-line WORDING PREVIEW back (greyed, marks and all):
         that is the work, and the work should say what it is about.

       · A change that needs NOTHING — our sent ask, an ask out with a
         reviewer — shrinks to a one-line RECEIPT: id, state, clause, Open.
         Three receipts cost less height than one old card, which is the whole
         complaint answered.

       THE RECEIPT DROPS EVEN Edit, deliberately: revising a sent ask is one
       Open away (the panel's ＋ continues a pending ask of ours rather than
       stacking a rival — it says so on its hover), and a receipt with a button
       it does not need is a card again.
       The body press still navigates to the clause, as on every card. */
    /* ================================================================
       THE OWNER'S CARD, TO THE DESIGN (owner-asked 25 Aug 2026, off a drawing
       of the whole column)
       ----------------------------------------------------------------
       ONE SHAPE FOR EVERY STATE, which is what the drawing shows and what
       replaces the receipt/full split below: a meta line naming the change and
       its clause, the summary in bold under it, and the state and the verbs at
       the right of the same block. What differs between an ask awaiting a
       decision and one already settled is WHICH verbs are there, not how tall
       the card is.

       THREE THINGS THIS REVERSES, each named because each was an owner call:

         · THE VERBS LOSE THEIR BORDERS (24 Aug 2026, "all the buttons should
           have a similar border line like share and more"). The drawing shows
           bare coloured words, and the ink is what tells them apart — accept
           accent, refuse ruby — exactly as it did before that day.
         · THE WORDING PREVIEW GOES (16 Aug 2026, restored so "a card asking
           for a decision must say what is being decided"). The SUMMARY is that
           sentence now, in bold, on its own line — it is what the change is
           for in the author's own words, and the marks are on the paper twelve
           pixels away with the full text one press into the panel.
         · AND THE ✦ BUTTON BECOMES THE MENU'S FIRST ROW. It was standing in
           for a ⋯ this page did not have; the drawing has one, and the
           approved journey always put Edit with Copilot at the top of it.

       EVERY CARD STILL SAYS WHERE IT STANDS, and that was decided against
       the obvious tidy-up. A first pass stood the word down under the two
       bands that seem to repeat it — "Draft" under YOUR DRAFTS — on the
       register's own duplicate-tag argument. Two things are wrong with it: the
       badge is this card's ONE status slot and the rule beside it in the
       stylesheet says in so many words that it keeps its identity because half
       this product and half the suite ask that slot where a change stands; and
       a card that only reads correctly UNDER ITS OWN HEADING cannot be read
       anywhere else — a filtered column, a screenshot, a row quoted in a
       message. The heading says which pile; the badge says where this one
       change stands, and on their ask those are different facts.

       THE COUNTERPARTY'S SEAT IS NOT TOUCHED, as agreed twice: this branch is
       our own seat only, and their page — and the owner's preview OF their
       page — falls through to the receipt and full shapes below, unchanged. */
    if (side === 'owner' && !previewSeat){
      const band = rlCardBand(ch, side, unsent, heldIds, c);
      /* ---- THE HEADING SAYS THE STATE, SO THE ROW SAYS NOTHING (owner-asked
             26 Aug 2026) ----
         This stood the word down under two headings and drew it under the
         rest, on the reasoning that those two were the only ones whose badge
         word IS the heading. That reasoning was right and the SPLIT above has
         now made it true of every band: Sent is WITH THEM, Refused, Accepted
         and Withdrawn are piles of their own, and a colleague's hold or ask is
         one of the two review piles. So there is nothing left for a word at
         the end of a row to tell anybody, and it comes off.

         THE OWNER'S OWN WORDS, twice on the same day: "if it is sent, then it
         is in the category of With Saw Sawa so it is redundant", and then, of
         the reviewer's name being squeezed to a single letter, "remove the
         name". What a row carries now is its reference, its wording and its
         two verbs, and nothing else at all.

         NOTHING IS LOST AND THAT IS THE CONDITION ON REMOVING IT. `badge` is
         still computed — it is what the OTHER two card shapes below draw, on
         the contract tab and the counterparty's seat, both untouched — and
         every sentence it carried is still on the row: badge[2] is the hover
         this line already had, and the reviewer's name rides in the same tip
         (see `tip` below). The clause panel names them in full.

         THE COUNTERPARTY'S SEAT IS NOT TOUCHED: this branch is our own seat
         only, and their page and the owner's preview of it fall through to the
         receipt and full shapes below, unchanged. */
      /* (The `state` constant this note is about is gone with the acts column
         it was drawn into: the row's right-hand end is one Open button now.) */
      const cardOpen = rlCardOpenId() === String(ch.id);
      const meta = [ch.id, who].filter(Boolean).join(' &middot; ');
      /* ---- AND THE SENTENCE THE BADGE CARRIED RIDES ON THE ROW ----
         Every entry in that table is [tone, word, hover], and the third slot
         is the one carrying real information — "waiting on them", "only they
         can lift it", and, on both review states, the COLLEAGUE'S NAME. The
         word is what the heading now says; the sentence is not, so it joins
         the hover this line already had rather than leaving the product. This
         is the standing rule out loud: a sentence removed from a slot has to
         be findable in another one before the slot goes. */
      const dTip = [tip, badge[2]].filter(Boolean).join(' \u00b7 ');
      const sum = String(ch.summary || '').trim();
      return `<article class="rl-card rl-card-d${
        RL_SETTLED_BANDS.includes(band) ? ' rl-card-done' : ''}${
        RL_QUIET_BANDS.includes(band) ? ' rl-card-quiet' : ''}" data-nego-card="${_ne(ch.id)}" data-rl-origin="${theirs ? 'them' : 'us'}"${
        (ch.status === 'rejected' && !ch.withdrawn) ? ` data-contested="${_ne(ch.id)}"` : ''}${
        heldHere ? ` data-unsent="${_ne(ch.id)}"` : ''}${
        rvOut ? ' data-rv-waiting="1"' : ''}${
        rvHeld ? ' data-rv-held="1"' : ''}${
        sentHere ? ` data-sent="${_ne(ch.id)}"` : ''}${
        ch.withdrawn ? ` data-withdrawn="${_ne(ch.id)}"` : ''} tabindex="0">
        ${''/* ONLY THE TEXT NAVIGATES. The head is the handle on the passage —
               pressing it lights the clause and scrolls the paper there — so
               the verbs and the menu are its SIBLINGS, never its children, and
               no verb can navigate the reader away underneath the hand
               reaching for it. */}
        <div class="rl-card-head rl-card-txt">
          ${''/* ---- HOW MANY NOTES, WITHOUT OPENING ANYTHING ----
                (owner-asked 27 Aug 2026.) It hides at zero — the alert dot's own
                rule — so a column of changes nobody has discussed carries none
                of these, and the ⋯ still has the way in.

                IT IS ON THE CHANGE'S OWN LINE, NOT IN THE ACTS COLUMN, and that
                is a measured decision rather than a placing. Every row in this
                column shares ONE width for its acts (--rl-verb-floor, the
                widest pair the column draws), so a count over there takes about
                34px from every row's wording INCLUDING the rows with no notes —
                MEASURED at a 458px column, the floor started biting where the
                declared two-thirds used to hold, and the proportion this column
                promises stopped being true at ordinary widths. Here the clause
                name gives up the room instead, and only on the rows that have
                something to give it up for. The count is flex:none so the name
                is what elides, never the number. */}
          <div class="rl-card-metarow"><div class="rl-card-meta"${dTip ? ` title="${_nea(dTip)}"` : ''}>${meta}</div>${
            rlCardNotesCountHtml(c, ch, opts, side)}</div>
          ${sum ? `<div class="rl-card-sum">${_ne(sum)}</div>` : ''}
        </div>
        ${''/* ---- ONE CONTROL ON THE FACE (owner-ruled 2 Sep 2026) ----
               *"What if the cards only had Open instead of edit, accepted etc.
               You then click open and the cards only expands and gives you all
               the options that are hidden in the dropdown including the
               comments for the card."*

               THIS RETIRES THE ⋯ AND THE TWO-ON-THE-FACE SPLIT. rlFaceSplit
               existed because a row had room for two verbs and a menu held the
               rest; with everything in the body there is nothing to rank and
               nothing to hide, so `rlCardMoreHtml` is a stub and RL_FACE_RANK
               / RL_FACE_MAX / rlFaceSplit are STALE on this seat.

               WHAT IT COSTS, SAID OUT LOUD AND ACCEPTED BY THE OWNER: accepting
               a change was one press and is now two. Everything else in the
               column gets cheaper — Copilot, the notes and a review ask were
               all two presses behind the menu and are two here, with the
               wording in front of you while you choose.

               THE COUNTERPARTY'S SEAT IS UNTOUCHED, as it was for the piles:
               this branch is our own seat only and their page falls through to
               the receipt and full shapes below. */}
        <div class="rl-card-side"><button type="button" class="rl-open-btn rl-card-open"
          data-rl-card-open="${_ne(ch.id)}" aria-expanded="${cardOpen}"
          aria-controls="rl-cb-${_nea(ch.id)}"
          ${''/* THE NAME IS OWED TO A READER WHO CANNOT SEE THE CARD. The id
                 is printed two centimetres to the left and a sighted reader
                 needs no more, but a screen reader working down a column of
                 buttons hears "Open" nine times unless the button says which
                 change it opens. The ⋯ carried this before it was retired and
                 the fact must not go with the control. */}
          aria-label="${_nea(i18t(cardOpen ? 'ng_card_close_title' : 'ng_card_open_title')
            + ' — ' + ch.id)}"
          title="${_nea(i18t(cardOpen ? 'ng_card_close_title' : 'ng_card_open_title'))}"
          >${i18t(cardOpen ? 'act_close' : 'ng_row_open')}<svg class="rl-open-cv" viewBox="0 0 16 16"
            fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"
            aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg></button></div>
        ${cardOpen ? `<div class="rl-cb-wrap" id="rl-cb-${_nea(ch.id)}">${
          rlCardBodyHtml(c, ch, opts, side, {
            info, settled: RL_SETTLED_BANDS.includes(band),
            actions: [noCopyBlock, rvStuckBlock,
              (verbs.length || rvCancel) ? `<div class="rl-card-verbs">${verbs.join('')}${rvCancel}</div>` : '',
              dkInstead, rvVerbs].filter(Boolean).join(''),
          })}</div>` : ''}
      </article>`;
    }
    const receipt = !noCopyBlock && !rvStuckBlock && !dkInstead && !rvVerbs && !rvCancel && !infoHold
      && !rlCardNeedsYou(verbs)
      && !/data-nego-redecide|data-rl-reopen/.test(verbs.join(''));
    if (receipt){
      return `<article class="rl-card rl-receipt" data-nego-card="${_ne(ch.id)}" data-rl-origin="${theirs ? 'them' : 'us'}"${
        rvOut ? ' data-rv-waiting="1"' : ''}${
        ch.withdrawn ? ` data-withdrawn="${_ne(ch.id)}"` : ''} tabindex="0">
        <div class="rl-card-head rl-receipt-line">
          <span class="rl-card-lead"><span class="rl-card-id">${_ne(ch.id)}</span></span>
          <span class="rl-badge rl-badge-${badge[0]}"${
          badge[2] ? ` title="${_nea(badge[2])}"` : ''}>${badge[1]}</span>
          <span class="rl-card-meta rl-receipt-cl"${tip ? ` title="${_nea(tip)}"` : ''}>${who}</span>
          ${ceBtn}${openBtn}
        </div>
      </article>`;
    }
    /* ---- THE PREVIEW, ON WORKING CARDS ONLY ----
       Two lines, clamped, greyed, marks and all — a summary you skim, never a
       second copy of the clause (the paper has the marks, the panel the full
       text). It came off with the routing rows and comes back HERE because a
       card asking for a decision must say what is being decided; the receipt
       above stays bare, which is what keeps the column short. */
    const diff = (() => {
      const ops = rlOpsAsSide(ch.ops, rlReadSideOf(ch, rlReadMode()));
      if (window.redlineOpsHtml && Array.isArray(ops) && ops.length)
        return `<div class="rl-card-diff">${redlineOpsHtml(ops)}</div>`;
      const t = String(ch.proposedText || ch.newText || '').trim();
      return t ? `<div class="rl-card-diff">${_ne(t)}</div>` : '';
    })();
    return `<article class="rl-card" data-nego-card="${_ne(ch.id)}" data-rl-origin="${theirs ? 'them' : 'us'}"${
      (ch.status === 'rejected' && !ch.withdrawn) ? ` data-contested="${_ne(ch.id)}"` : ''}${
      heldHere ? ` data-unsent="${_ne(ch.id)}"` : ''}${
      rvOut ? ' data-rv-waiting="1"' : ''}${
      rvHeld ? ' data-rv-held="1"' : ''}${
      sentHere ? ` data-sent="${_ne(ch.id)}"` : ''}${
      ch.withdrawn ? ` data-withdrawn="${_ne(ch.id)}"` : ''} tabindex="0">
      ${''/* ---- THE HEAD IS THE PRESS-THROUGH ----
             The row's body is a handle on a passage: pressing it lights the
             clause and scrolls the paper there (rlLinkFocus), and nothing
             else. Open — the panel door — and the verbs are its own buttons,
             so neither can navigate as a side effect. */}
      <div class="rl-card-head">
        ${''/* The lead group is the id alone. It is KEPT as a group rather
                than collapsed to the id: it is the flex item that gives width
                back to the status badge when a card is narrow, and min-width:0
                on it is what lets anything in the head elide at all. */}
        <div class="rl-card-top"><span class="rl-card-lead"><span class="rl-card-id">${_ne(ch.id)}</span></span>
          ${rvChip}<span class="rl-badge rl-badge-${badge[0]}"${
          badge[2] ? ` title="${_nea(badge[2])}"` : ''}>${badge[1]}</span>${
          ch.round ? `<span class="rl-card-round" title="${_nea(i18t('ng_proposed_in_round',{n:ch.round}))}">R${_ne(ch.round)}</span>` : ''}${ceBtn}${openBtn}</div>
        <div class="rl-card-meta"${tip ? ` title="${_nea(tip)}"` : ''}>${who}</div>
        ${negoCounterLineHtml(c, ch)}${diff}
      </div>
      ${info ? `<div class="rl-card-info">${info}</div>` : ''}
      ${actionBar}
    </article>`;
  };
  return shown.map(ch => bandHead(ch) + oneCard(ch)).join('');
}

/* The design's single banner. It replaces the engine's two (mode + turn) at the
   top of the page with one line, and every number in it is counted, not
   asserted: unsent asks come from negoUnsentAsks, internal threads from the
   discussion messages that are marked internal. When there is nothing behind
   the wall it says that instead of printing zeroes. */
function redlineWallHtml(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* Counterparty View gets the reference's EYE banner, not the wall's counts.
     The wall line says how many internal things are being held back — which
     is itself internal information, and printing it on the side that is
     supposed to be "exactly what they see" would tell that side precisely
     what it must not know: that held-back things exist, and how many. */
  if (side === 'counterparty'){
    const who = _ne(c.counterparty || 'the counterparty');
    return `<div class="rl-wall" role="status">
      <span class="rl-wall-ic">&#128065;</span>
      <span>${i18t('ng_you_are_viewing')} <b>exactly what ${who} sees</b>${i18t('ng_internal_threads_hidden')}</span>
    </div>`;
  }
  const unsent = (window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).length;
  const msgs = (c && c._messages) || [];
  const internal = window.discussIsInternal
    ? new Set(msgs.filter(m => discussIsInternal(m)).map(m => m.topic || m.id)).size : 0;
  const bits = [];
  if (internal) bits.push(`<b>${internal} internal thread${internal === 1 ? '' : 's'}</b>`);
  if (unsent) bits.push(`<b>${i18tn('ng_unsent_drafts',unsent,{n:unsent})}</b>`);
  /* ---- THE WALL BAR IS GONE FROM THE OWNER'S BENCH ----
     It was reduced once already — it used to draw even when nothing was being
     held back — and it is now removed outright: a full-width band above the
     work, restating a rule, on every paint.

     WHAT IT TOLD YOU SURVIVES WHERE IT IS ACTUALLY NEEDED. An unsent draft
     already reads as unsent on its own card, with its Send button on it, and
     the count rides on Publish Round ("Publish Round · 1 unsent") — which is
     the moment the wall matters, because that is when things cross it.

     The COUNTERPARTY's line above is untouched: "you are seeing exactly what
     they see" is a disclosure statement on a page built to prove it, not
     chrome. */
  void bits; void internal; void unsent;
  return '';
}

/* ---------- THIS ROUND'S QUEUE ----------
   The reading order for a negotiation: what has been answered, what is being
   answered now, what is still waiting. Tracked Changes already lists every
   change — this is the same set asked a different question. The column answers
   "what do I do next"; the card stack answers "what is on the table".

   ONE ROW PER CLAUSE, not one per change. The engine files changes
   individually, so two asks against Clause 12 are two records with two
   fingerprints — correct for the card stack, wrong for a queue, where the unit
   of attention is the passage you read, not the number of edits somebody made
   to it. Grouping is done here and nowhere else: no change record is merged,
   renamed or hidden, and every row still points at real change ids.

   NOTHING IS STORED. Every field below is derived on render from negoChanges,
   negoClauseList and negoRiskOf, for the same reason negoReadyToSign is a read
   rather than a flag: a stored queue could disagree with the changes it claims
   to summarise, and this column's whole value is that it cannot. */
function rlQueueRows(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* Through the wall, the same reading the card stack uses: a seat never sees
     work it is not entitled to see. */
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  /* DELIBERATELY NOT _rlIsLive. That predicate means "pending and not
     withdrawn" — the right reading for the Tracked Changes count, which asks
     what is outstanding, and the wrong one here. A queue whose answered rows
     disappear the moment they are answered is a queue that cannot show
     progress: the ticks ARE the feature, and the reader loses the account of
     what they have already settled this round. So the filter is the one
     negoProgress uses — everything on the table that has not been superseded —
     minus withdrawn asks, which are off the table by definition. */
  /* AND NARROWED TO WHAT A REVIEWER WAS HANDED, for the same reason the card
     stack is: this queue is the ROUND's work, and the round is not their job.
     Its footer counts off these rows, so narrowing here keeps "1 of 2" honest
     instead of reading "0 of 3" over two rows. */
  const mineOnly = rlMyCardIds(c, opts);
  const live = (typeof negoChanges === 'function' ? negoChanges(c) : [])
    .filter(x => x && x.status !== 'superseded' && !x.withdrawn && !hidden.has(x.id)
      && (!mineOnly || mineOnly.has(String(x.id))));

  /* DOCUMENT ORDER, read off the baseline rather than off the change list.
     Changes are filed in the order somebody happened to make them; a queue
     that does not run top-to-bottom down the contract is not a reading order. */
  const order = new Map();
  /* ---- THE FRONT MATTER IS THE TOP OF THE DOCUMENT, SO IT READS FIRST ----
     It is a REGION rather than a clause, so it is deliberately not in
     negoClauseList and its place in the reading order has to be stated rather
     than looked up. Left to the fallback it would sort LAST, which is the one
     thing this queue's own note says it must never do. */
  const _frontId = (typeof window !== 'undefined' && window.CLAUSE_FRONT_ID) || 'front';
  order.set(_frontId, -1);
  (typeof negoClauseList === 'function' ? negoClauseList(c) : [])
    .forEach((cl, i) => { if (cl && cl.clauseId) order.set(cl.clauseId, i); });

  const rows = new Map();
  for (const ch of live){
    /* A change carrying no clause id is a clause being INSERTED — it has no
       place in the baseline to be grouped against, so it gets its own row. */
    const key = ch.clauseId || ('chg:' + ch.id);
    let row = rows.get(key);
    if (!row){
      const parsed = window.clauseParseHeading
        ? clauseParseHeading(ch.clauseLabel || '') : { num: '', title: '' };
      row = { key, clauseId: ch.clauseId || null,
        num: parsed.num || '',
        /* The region is named in the reader's own language; `clauseLabel` is
           the RECORD's word and stays on the record. */
        title: key === _frontId ? i18t('ng_front_matter')
          : (parsed.title || String(ch.clauseLabel || '').trim()),
        at: order.has(key) ? order.get(key) : Number.MAX_SAFE_INTEGER,
        changes: [], pending: 0, held: 0, accepted: 0, rejected: 0, why: [], lead: null };
      rows.set(key, row);
    }
    row.changes.push(ch);
    if (ch.status === 'pending'){
      row.pending++;
      if (!row.lead) row.lead = ch;
      /* The SAME risk read that decides what "Accept All Non-Risk" holds back,
         called rather than re-implemented: a queue that disagreed with the
         batch button about what is safe would be worse than no queue. */
      const r = (typeof negoRiskOf === 'function')
        ? negoRiskOf(c, ch, side) : { risky: false, why: [] };
      if (r.risky){
        row.held++;
        for (const w of (r.why || [])) if (!row.why.includes(w)) row.why.push(w);
      }
    }
    else if (ch.status === 'rejected') row.rejected++;
    else row.accepted++;
  }

  const out = Array.from(rows.values());
  for (const row of out){
    if (!row.lead) row.lead = row.changes[0] || null;
    if (!row.num && !row.title) row.title = 'New clause';
    /* THE ROLL-UP, and the rule it is written to keep: a row must never read
       as finished while something underneath it is unanswered. So anything
       pending outranks every answer beside it, and a row whose answers
       disagree says "decided" rather than picking one of them to report. */
    row.state = row.pending
      ? (row.held === row.pending ? 'held' : 'open')
      : (row.rejected && !row.accepted) ? 'rejected'
      : (row.accepted && !row.rejected) ? 'accepted'
      : 'decided';
  }
  out.sort((a, b) => a.at - b.at
    || String(a.num).localeCompare(String(b.num), undefined, { numeric: true }));

  /* "NOW" is the first row in document order that still owes an answer — a
     held row included. Held means "this one needs a person", not "skip it";
     marking it as next is the difference between a queue that hands you the
     hard change and one that quietly buries it. */
  const now = out.find(r => r.pending > 0);
  if (now) now.now = true;

  /* ---- AND "SELECTED" IS A SEPARATE FACT FROM "NEXT" ----
     They were the same thing, and that was the bug: the box sat on the derived
     next row and would not move, so pressing #4 took you to clause 4 while the
     queue went on insisting you were on #2. A reader who presses a row has told
     you where they are, and a list that argues with that is a list you stop
     trusting.

     So the box follows the press and the word does not. "now" stays what it
     always was — the next thing owing an answer, which does not change because
     somebody looked further down the list — and the ring marks what you are
     reading. Until the first press they are the same row, which is why nothing
     looks different until you use it. */
  const selId = rlQueueSelected(c);
  const sel = (selId ? out.find(r => r.changes.some(x => x.id === selId)) : null) || now;
  if (sel) sel.sel = true;
  return out;
}

/* Which row the reader is on. Module state, like the card pin and the side
   mode — a working preference on this contract's column, never written to the
   record. Keyed by contract so opening another one does not inherit a
   selection pointing at a change it has never seen. */
let _rlQueueSel = null;
function rlQueueSelect(c, changeId){
  _rlQueueSel = { id: c && c.id, change: String(changeId == null ? '' : changeId) };
}
function rlQueueSelected(c){
  return (_rlQueueSel && _rlQueueSel.id === (c && c.id)) ? _rlQueueSel.change : null;
}
/* Move the ring without a repaint. Pressing a row must not cost a rebuild of
   the document beside it — and the DOM already holds every id each row stands
   for, so the answer is a class swap rather than a render. Returns whether
   anything matched, so a caller can tell "no such row" from "moved". */
function rlQueueMark(scope, changeId){
  const root = (scope && scope.querySelectorAll) ? scope : document;
  const id = String(changeId == null ? '' : changeId);
  if (!id) return false;
  const rows = Array.from(root.querySelectorAll('.rl-q-row'));
  const hit = rows.find(r => (r.getAttribute('data-rl-queue-ids') || '').split(' ').includes(id));
  if (!hit) return false;
  rows.forEach(r => r.classList.toggle('is-sel', r === hit));
  return true;
}

/* The word on the right of a row. A waiting row says nothing: the queue is
   read downwards, and printing "waiting" six times says only that the reader
   has not got there yet. */
function rlQueueWord(row){
  if (!row) return '';
  if (row.now) return 'now';
  if (row.state === 'held') return 'held';
  if (row.state === 'accepted') return 'accepted';
  if (row.state === 'rejected') return 'rejected';
  if (row.state === 'decided') return 'decided';
  return '';
}

function rlQueueHtml(c, opts = {}){
  const rows = rlQueueRows(c, opts);
  /* THE COUNT IS SUMMED OFF THE ROWS, not read from negoProgress. The two
     would agree on the owner's page and disagree on the counterparty's, where
     the wall hides changes that negoProgress still counts — and a footer
     reading "2 of 7" under five visible rows is the column calling itself a
     liar. Same definition as negoProgress (answered over on-the-table),
     applied to the set this seat can actually see. */
  const p = rows.reduce((a, r) => {
    a.total += r.changes.length;
    a.done += r.accepted + r.rejected;
    return a;
  }, { total: 0, done: 0 });
  const held = rows.filter(r => r.state === 'held' || (r.now && r.held));

  const body = rows.length ? rows.map(row => {
    /* ---- THE ROW IS THE CLAUSE'S NAME, AND NOTHING ELSE ----
       It used to lead with a handle: the clause's own number where the heading
       carried one, and the change FINGERPRINT where it did not — so rows read
       "CHG-005 · Confidentiality". That handle was there to keep two rows
       tellable apart, and it bought that at a price the column could not
       afford. This card is 300px wide. "CHG-005 · " ate the front of every
       unnumbered row and the name behind it truncated to nothing, so a queue
       of eight clauses showed six rows reading "CHG-00…" — the handle survived
       and the clause, which is the thing you are deciding, did not.

       The name alone now. The queue runs in document order, so position still
       says where you are, and the handle has not been thrown away: it moves to
       the row's tooltip, where two clauses that genuinely share a heading can
       still be told apart on hover without costing every other row its name. */
    const label = _ne(row.title);
    const word = rlQueueWord(row);
    const many = row.changes.length > 1;
    /* The tooltip carries what the row cannot: which clause this is where the
       name alone is ambiguous, why it is held, and how many changes the one
       line stands for. */
    const handle = row.num ? `Clause ${row.num}` : ((row.lead && row.lead.id) || '');
    const tip = [
      handle,
      many ? `${row.changes.length} changes on this clause` : '',
      row.why.length ? `Held: ${row.why.join('; ')}` : '',
    ].filter(Boolean).join(' · ');
    const done = !row.pending;
    return `<button type="button" class="rl-q-row${row.now ? ' is-now' : ''}${
      row.sel ? ' is-sel' : ''}${
      row.state === 'held' ? ' is-held' : ''}${done ? ' is-done' : ''}${
      !row.now && !done ? ' is-waiting' : ''}"
      data-rl-queue="${_ne(row.lead && row.lead.id || '')}"
      data-rl-queue-clause="${_ne(row.clauseId || '')}"
      ${''/* every id this one line stands for, so a press on a CARD can find
             the row that covers it without asking the model again */}
      data-rl-queue-ids="${_ne(row.changes.map(x => x.id).join(' '))}"
      ${row.sel ? 'aria-current="true" ' : ''}${tip ? `title="${_ne(tip)}"` : ''}>
      <span class="rl-q-mark" aria-hidden="true">${done ? '&#10003;' : ''}</span>
      <span class="rl-q-k">${label}</span>
      ${many ? `<span class="rl-q-n">${row.changes.length}</span>` : ''}
      <span class="rl-q-st">${_ne(word)}</span>
    </button>`;
  }).join('')
    /* THE EMPTY STATE MUST NOT NAME A VERB THIS SEAT HAS NOT GOT. A signing
       link and a closed round render this same column read-only, and
       "press Direct Edit" there points at a control that is deliberately not
       on the page — an invitation back into a negotiation that is over.
       f113 asserts exactly this, and caught it. */
    : (opts.readonly
      ? `<p class="rl-q-empty">${i18t('ng_no_changes_table')}</p>`
      : `<p class="rl-q-empty">No changes on the table yet. Ask for different
          wording on any clause and it lands here.</p>`);

  /* The held note names them rather than defining a word. One held row says
     which and why; several say how many and what they have in common, because
     six reasons in a 300px column is a paragraph nobody reads. */
  const note = !held.length ? '' : held.length === 1
    ? `<p class="rl-q-why">${''/* named the way its row is named — a note calling
            it "#4" over a list that calls it "Pricing & indexation" is the note
            and the queue disagreeing about the same clause */
        }${_ne(held[0].title || (held[0].num ? `Clause ${held[0].num}` : 'One clause'))} is held
        back for you${held[0].why.length ? ` &mdash; ${_ne(held[0].why[0])}` : ''}.</p>`
    : `<p class="rl-q-why">${held.length} clauses are held back for you &mdash; each trips a
        playbook, scan or review signal.</p>`;

  /* ---- THE SCORE GOES AT THE TOP, WITH A BAR UNDER IT ----
     "2 of 7 decided" lived at the FOOT of a scrolling column, so on a busy
     negotiation the one number telling you how far through you are scrolled
     out of sight behind the very rows it was counting. It heads the column
     now, and the bar says the same thing without being read. */
  const pct = p.total ? Math.round(p.done / p.total * 100) : 0;
  /* ---- IT FOLDS TO A RAIL, AND THE RAIL STILL COUNTS ----
     300px is a quarter of a laptop's window spent on a reading order, and on a
     round you have already worked through it is 300px of ticks. It folds.

     What it folds TO matters more than that it folds: a rail that went blank
     would make reopening it a guess. The count survives — "9/9" turned on its
     side, and the progress bar becomes the rail's own edge — so the one thing
     the column exists to tell you is still legible at 34px wide.

     Remembered per person, not per contract: this is how somebody works, not a
     fact about an agreement. */
  const open = rlQueueOpen();
  /* THE DOOR CARRIES THE SCORE. Everything the folded rail used to say at 34px
     is on it — the caption and "2 / 7" — so closing the panel never costs the
     one number the column exists to give, and reopening is never a guess. It
     is a VERTICAL tab against the page's own left border wall (see .rl-q-tab):
     the markup is unchanged, because the turning is done by writing-mode and
     nothing here needs to know which way the words run. */
  return `<div class="rl-q-scrim${open ? ' is-open' : ''}" id="rl-q-scrim" data-rl-q-close="1" aria-hidden="true"></div>
  <button type="button" class="rl-q-tab" id="rl-q-tab" data-rl-q-open="1"
    aria-controls="rl-queue" aria-expanded="${open ? 'true' : 'false'}"
    title="${_nea(i18t('ng_queue_open_title', { done: p.done, total: p.total }))}">
    ${_rlChev(true)}<span class="rl-q-tab-k">${i18t('ng_this_rounds_queue')}</span>
    <span class="rl-q-tab-n">${p.done}/${p.total}</span>
  </button>
  ${''/* An <aside> with a label and nothing else, exactly as the Activity panel
         is built. NOT role="dialog": it is a complementary panel a reader can
         work beside, not a modal over the wording being judged — and the page
         already refuses to put a dialog over that (f89). */}
  <aside class="rl-col rl-queue${open ? ' is-open' : ''}" id="rl-queue"
    aria-hidden="${open ? 'false' : 'true'}" aria-label="${i18t('ng_this_rounds_queue')}">
    <div class="rl-q-head">
      <button type="button" id="rl-q-min" class="rl-q-min" data-rl-q-close="1" aria-expanded="${open ? 'true' : 'false'}"
        title="${_nea(i18t('ng_queue_close_title'))}" aria-label="${_nea(i18t('ng_queue_close_title'))}">&times;</button>
      <p class="rl-q-label">${i18t('ng_this_rounds_queue')}</p>
      <div class="rl-q-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
        aria-label="${_nea(i18t('ng_decided_round_aria',{done:p.done,total:p.total}))}"><span style="width:${pct}%"></span></div>
      <div class="rl-q-foot"><b>${p.done} of ${p.total}</b> ${i18t('ng_decided_this_round')}</div>
      ${''/* Unseen, and kept: the door reads off the same progress object, so
             the two places the score appears cannot disagree. */}
      <div class="rl-q-mini" aria-hidden="true"><b>${p.done}</b><i>/</i><span>${p.total}</span></div>
    </div>
    <div class="rl-q-scroll">
      ${body}
      ${rows.length && note ? '<hr class="rl-q-split">' : ''}
      ${note}
    </div>
  </aside>`;
}
/* ---- OPEN OR SHUT, PER SITTING, SHUT BY DEFAULT ----
   The old fold was remembered per person in localStorage and defaulted to OPEN,
   which was right for a column: a first-time reader had to see it before they
   could decide they would rather not, and an open column cost the contract some
   width and nothing else. An OVERLAY that remembered "open" would slide itself
   over the contract on every arrival — the exact complaint this change answers.
   So it is in memory, per sitting, shut until asked for, and the door beside
   the page says what is behind it. */
let _rlQueueOpen = false;
function rlQueueOpen(){ return !!_rlQueueOpen; }
function rlSetQueueOpen(on){ _rlQueueOpen = !!on; }
const _rlChev = min => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${
  min ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}"/></svg>`;
/* Opening and closing, applied WITHOUT A REPAINT — the property the fold
   already had and the one worth keeping: rebuilding the workbench to show one
   panel would throw away the reader's place in the contract, which is the one
   thing they were holding on to. Two class flips and nothing else. The resizer
   is NOT re-run: the queue no longer occupies a track, so the split behind it
   has not moved. */
function rlSetQueueShown(scope, on){
  const root = (scope && scope.querySelector) ? scope : document;
  rlSetQueueOpen(on);
  root.querySelectorAll('#rl-queue').forEach(q => {
    q.classList.toggle('is-open', on); q.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  root.querySelectorAll('#rl-q-scrim').forEach(sc => sc.classList.toggle('is-open', on));
  root.querySelectorAll('#rl-q-tab').forEach(t => {
    t.classList.toggle('is-open', on); t.setAttribute('aria-expanded', on ? 'true' : 'false');
  });
  root.querySelectorAll('#rl-q-min').forEach(b => b.setAttribute('aria-expanded', on ? 'true' : 'false'));
  if (on){
    const first = root.querySelector('#rl-queue .rl-q-row.is-sel, #rl-queue .rl-q-row');
    if (first && first.focus) { try{ first.focus(); }catch(_){} }
  }
}
/* The door, the close, the scrim and Escape — the Activity panel's four ways in
   and out, on this panel. Bound once per mount, on the host rather than on each
   button, because every repaint of the page rebuilds them. */
function rlWireQueueMin(host){
  const scope = (host && host.querySelector) ? host : document;
  const root = (host && host.addEventListener) ? host : document;
  if (root._rlQWired) return;
  root._rlQWired = true;
  root.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    if (t.closest('[data-rl-q-open]')){ rlSetQueueShown(scope, true); return; }
    if (t.closest('[data-rl-q-close]')) rlSetQueueShown(scope, false);
  });
  if (typeof window !== 'undefined' && !window._rlQEsc){
    window._rlQEsc = true;
    document.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape' || !rlQueueOpen()) return;
      /* Only when this panel is the thing on top: a dialog over it owns Escape
         first, exactly as the Activity panel's own handler defers. */
      if (document.getElementById('modal-root') && document.getElementById('modal-root').innerHTML.trim()) return;
      rlSetQueueShown(document, false);
    });
  }
}

/* ---- THE CLAUSE PANEL ----
   The queue's own mechanism, mirrored on the other wall: scrim, slide-over,
   three ways out. It is ABSOLUTE inside .rl-grid for the reason the queue is —
   the grid is the positioned ancestor, so the panel lands on the working area's
   own right border on the bench, on the contract tab's embed and on the
   counterparty's page alike, each against ITS OWN wall. Fixed to the window it
   would sit over the app's furniture.

   NO DOOR TAB. The queue keeps one because its door carries the score; this
   panel's door is the Edit pill on the clause it is about, which is the only
   place the question "which clause?" has an answer.

   ONE AT A TIME, in memory, per sitting, shut on arrival — the same single
   value and the same reasoning as the ask reveal's _rlAskOpen (and as the
   retired card pop-out's _rlPopId before it). It is a reading posture: it
   never prints and never leaves the page. */
let _rlCpId = null;
function rlCpOpenId(){ return _rlCpId; }
function rlCpSetOpen(id){ _rlCpId = id || null; return _rlCpId; }
/* ---- HISTORY | + NOTES (owner-asked 16 Aug 2026: "add a button next to edit
   that shows history with notes. The default will be without notes") ----
   A two-way switch in the panel's own head, dressed like the toolbar's
   Redlined / As agreed segments so there is nothing new to learn. The DEFAULT
   face is the clean panel: every conversation block (the thread AND the reply
   box) is hidden by one CSS rule, and the "+ notes" face is one class on
   #rl-cp — a class flip, never a repaint, which is this panel's own standing
   rule and is also what keeps the ONE engine-wired composer alive in the DOM
   whichever face is showing (a composer rebuilt on toggle would drop the
   handlers wireNegotiationTab bound at paint).

   Per sitting, in memory, never persisted — a reading posture, like the fold
   and the panel itself. One value for the whole sitting rather than one per
   clause: a reader who asked for the conversation is reading conversations,
   and re-asking on every clause would make the switch a chore. Both seats get
   it, because the panel is shared markup and the counterparty's reply box
   lives behind the same face. */
let _rlCpNotes = false;
function rlCpNotesOn(){ return _rlCpNotes; }
function rlCpSetNotes(scope, on){
  _rlCpNotes = !!on;
  const root = (scope && scope.querySelectorAll) ? scope : document;
  root.querySelectorAll('#rl-cp').forEach(p => p.classList.toggle('rl-cp-notes', _rlCpNotes));
  root.querySelectorAll('[data-rl-cp-notes]').forEach(b => {
    const mine = (b.getAttribute('data-rl-cp-notes') === 'on') === _rlCpNotes;
    b.setAttribute('aria-pressed', String(mine));
    /* The FACE flips with the state — aria alone is invisible pixels, and a
       switch still wearing "History" dark after "+ notes" was pressed is the
       kind of fault a reader blames themselves for. Caught by a screenshot,
       not by the class-flip assertions. */
    b.classList.toggle('on', mine);
  });
  return _rlCpNotes;
}
/* ---- IT WEARS THE SEAT SWITCH'S OWN CLASSES (owner-asked 25 Aug 2026: "The
   history and notes buttons design should resemble the internal and
   counterparty") ----
   THE CLOTHES FOLLOW THE BUILDER, and this switch had been left behind by its
   own reference. It was dressed to match "the toolbar's reading segments" when
   those were a grey pill group; the 22 Aug redesign turned the reading control
   into tabs and gave the SEAT switch the bordered box with a filled live half,
   and nothing brought this one along. MEASURED side by side before: the seat
   switch fills accent-700 at 13px with the resting half at weight 400, this one
   filled --nav-bg (the SIDEBAR's deep green, a navigation colour inside a
   content panel) at 12px with BOTH halves at 700 — so weight, which is what
   tells the live half from the resting one over there, was doing nothing here.
   SO IT TAKES .rl-segwrap / .rl-seg RATHER THAN A COPY OF THEIR VALUES, and the
   seat switch's own rule names this head beside .rl-actions: one declaration,
   two homes, nothing to keep in step. .rl-cp-segs survives carrying LAYOUT
   only — where in the head row it sits — which is this page's own convention
   for a class that positions rather than dresses. */
function rlCpSegsHtml(){
  /* ---- A STUB: THERE IS NOTHING LEFT TO SWITCH (owner-asked 27 Aug 2026) ----
     History | + notes hid and showed the conversation blocks inside this panel.
     The note box and its thread have moved to the Notes panel, which draws two
     rooms of its own, so the "+ notes" face would now reveal nothing at all.
     A STUB rather than a deletion, this file's convention for a builder whose
     feature has gone: it is published and was called from the panel's head, and
     a third caller must not be able to bring an empty switch back.
     `.rl-cp-notes`, `data-rl-cp-notes`, rlCpNotesOn and rlCpSetNotes are STALE
     — flag any mention. The panel's row keeps a quiet line naming the count and
     opening the Notes panel, which is the one door onto that conversation. */
  return '';
}

/* ---- THE PANEL'S OWN TYPE STEPPER (owner-asked 20 Aug 2026: "Add the font
   adjuster to the redline panel which will only adjust the panel and nothing
   more") ----
   The panel deliberately does NOT follow the reader's document type — that is
   a standing rule (.rl-cp-src{--doc-scale:1}) and it is untouched. This is the
   panel's OWN preference: the toolbar stepper's exact mechanism (a stored px,
   clamped to the same 8–20 bounds, applied live with no repaint) driving a
   CSS zoom on the panel BODY alone. Zoom is the sheet's own mechanism
   (.rl-zoom), so nothing new is invented; the head's controls stay unscaled
   because they are controls, not reading matter. THE OUTPUT SPAN IS NOT
   .rl-type-out — rlSetDocType repaints every .rl-type-out on the page with
   the DOCUMENT's px, and one shared class is how the two steppers would come
   to lie about each other's value. */
const RL_CP_TYPE_DEF = 14, RL_CP_TYPE_KEY = 'hati.v1.cpType';
function rlCpTypePx(){
  try { const v = Number(localStorage.getItem(RL_CP_TYPE_KEY));
    return (v >= RL_TYPE_MIN && v <= RL_TYPE_MAX) ? v : RL_CP_TYPE_DEF; }
  catch (e) { return RL_CP_TYPE_DEF; }
}
function rlCpZoom(px){
  const v = Number(px) || rlCpTypePx();
  return (v / RL_CP_TYPE_DEF).toFixed(4);
}
function rlCpSetType(px){
  const v = Math.max(RL_TYPE_MIN, Math.min(RL_TYPE_MAX, Math.round(Number(px) || RL_CP_TYPE_DEF)));
  try { localStorage.setItem(RL_CP_TYPE_KEY, String(v)); } catch (e) {}
  /* Applied live to every mounted panel — querySelectorAll by id, exactly as
     rlCpSetNotes does, because the owner's page and a portal mount can both
     hold one. No repaint: a half-typed reply in the panel's composer survives
     a resize. */
  document.querySelectorAll('#rl-cp').forEach(p => p.style.setProperty('--cp-zoom', rlCpZoom(v)));
  document.querySelectorAll('.rl-cp-type-out').forEach(el => { el.textContent = v + 'px'; });
  document.querySelectorAll('[data-rl-cp-type]').forEach(b => {
    const d = b.getAttribute('data-rl-cp-type') === 'down' ? -1 : 1;
    b.disabled = (d < 0 && v <= RL_TYPE_MIN) || (d > 0 && v >= RL_TYPE_MAX);
  });
  return v;
}
function rlCpTypeStepHtml(){
  const v = rlCpTypePx();
  return `<div class="rl-type-step rl-cp-type">
    <button type="button" data-rl-cp-type="down" title="${_nea(i18t('ng_smaller_text'))}"${v <= RL_TYPE_MIN ? ' disabled' : ''}>A&#8315;</button>
    <span class="rl-cp-type-out">${v}px</span>
    <button type="button" data-rl-cp-type="up" title="${_nea(i18t('ng_larger_text'))}"${v >= RL_TYPE_MAX ? ' disabled' : ''}>A&#8314;</button>
  </div>`;
}
function rlClausePanelHtml(bodies){
  const open = !!rlCpOpenId();
  const src = (bodies || []).join('');
  return `${''/* NO SCRIM — see the note on .rl-cp. The contract stays lit and
         stays usable beside the panel, which is the whole point of a panel
         about one clause. */}
  ${''/* An <aside> with a label and nothing else, exactly as the queue and the
         Activity panel are built. NOT role="dialog": it is a complementary
         panel a reader works BESIDE the wording, and this page already refuses
         to put a dialog over the wording being judged (f89). */}
  <aside class="rl-col rl-cp${open ? ' is-open' : ''}" id="rl-cp"
    style="--cp-zoom:${rlCpZoom()}"
    aria-hidden="${open ? 'false' : 'true'}" aria-label="${_nea(i18t('ng_cp_open_title'))}">
    <div class="rl-cp-head">
      <button type="button" id="rl-cp-min" class="rl-cp-min" data-rl-cp-close="1"
        title="${_nea(i18t('ng_cp_close_title'))}" aria-label="${_nea(i18t('ng_cp_close_title'))}">&times;</button>
      <p class="rl-cp-label">${i18t('ng_cp_edit')}</p>
      ${rlCpSegsHtml()}
      ${rlCpTypeStepHtml()}
    </div>
    <div class="rl-cp-body" id="rl-cp-body">${src}</div>
  </aside>`;
}
/* Opening and closing, applied WITHOUT A REPAINT — the property worth keeping
   from the queue: rebuilding the workbench to show one panel would throw away
   the reader's place in the contract, which is the one thing they were holding
   on to. Every clause's body is already in the panel; this flips which one is
   on. Two class flips and nothing else. */
function rlCpSetShown(scope, clauseId){
  const root = (scope && scope.querySelector) ? scope : document;
  const want = clauseId ? String(clauseId) : null;
  /* A CLAUSE WITH NO BODY IN THE PANEL CANNOT BE OPENED. The panel would slide
     out empty, which reads as broken rather than as "nothing here". */
  const bodies = [...root.querySelectorAll('#rl-cp-body .rl-cp-src')];
  const found = want ? bodies.some(b => b.getAttribute('data-rl-cp-for') === want) : false;
  const on = !!(want && found);
  rlCpSetOpen(on ? want : null);
  bodies.forEach(b => b.classList.toggle('is-on', on && b.getAttribute('data-rl-cp-for') === want));
  root.querySelectorAll('#rl-cp').forEach(p => {
    p.classList.toggle('is-open', on); p.setAttribute('aria-hidden', on ? 'false' : 'true');
  });
  root.querySelectorAll('[data-rl-cp-open]').forEach(b => b.setAttribute('aria-expanded',
    on && b.getAttribute('data-rl-cp-open') === want ? 'true' : 'false'));
  if (on){
    /* preventScroll — see the note on .rl-grid's overflow. Moving focus into a
       panel that has not finished sliding in is what made the page lurch. */
    const close = root.querySelector('#rl-cp-min');
    if (close && close.focus){ try{ close.focus({ preventScroll: true }); }catch(_){ try{ close.focus(); }catch(_e){} } }
  }
  /* IT SAYS WHETHER IT OPENED (owner-reported 26 Aug 2026, L-3). The refusal
     above is right — a panel sliding out empty reads as broken — but it was
     SILENT, and a caller that asked for the panel and got nothing had no way
     to tell. From the reader's chair that is indistinguishable from a dead
     button: the press scrolls the paper to the clause and then stops, which is
     exactly "it takes you to the contract" as reported. The callers decide
     what to say; this only stops them having to guess. */
  return on;
}
/* A repaint rebuilds the panel from the markup, so the class the open body was
   wearing goes with it. Called LAST in the page's own wiring, after the engine
   has wired this paint. Where the clause has gone entirely — a round closed, a
   reviewer's fold narrowed the page — the panel SHUTS rather than holding over
   wording that is no longer on the paper: a panel and a document disagreeing is
   the one thing this page may not do. */
function rlCpPaint(scope){
  const id = rlCpOpenId();
  if (!id) return;
  rlCpSetShown((scope && scope.querySelector) ? scope : document, id);
}
/* The pill, the close, the scrim and Escape — the queue's four ways in and out,
   on this panel. ARMED AT MODULE LOAD, on `document`, never inside a renderer:
   a listener registered by the owner's page cannot belong to the counterparty's
   mount, and that exact fault made the unsent band's Send dead on their seat
   for a day (15 Aug 2026). */
/* ---- THE DOOR ONTO THE NOTES PANEL, ARMED ONCE AT MODULE LOAD ----
   Three surfaces press it — the count on a change's row, the Notes row in the
   ⋯ menu, and the clause panel's own line — and all three carry data-rl-notes
   and nothing else. AT MODULE LOAD rather than per paint, for the reason the
   proxy listener records: a listener armed inside a renderer belongs to
   whichever page happened to render first, and this one has to work from the
   column, from the menu and from the clause panel alike.
   IT DECIDES NOTHING. openNotesPanel is the one door and it lives in the shell,
   which owns the drawer; this is the press finding it. Read through window
   because that is another module (the ES-module rule). */
if (typeof document !== 'undefined' && !document._rlNotesWired){
  document._rlNotesWired = true;
  document.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest && ev.target.closest('[data-rl-notes]');
    if (!t) return;
    ev.preventDefault();
    ev.stopPropagation();
    const id = t.getAttribute('data-rl-notes');
    const cid = (window.redlineHeldId && redlineHeldId()) || (window.state && state.activeId);
    /* ---- ON OUR SEAT IT OPENS THE NOTE, NOT THE DRAWER (owner-ruled 31 Aug
       2026, decision C) ----
       "this note is stored and can only be accessed by owner via the highlight
       in image 2 where if clicked, the pop up comes up again where you can edit
       or delete." So the Notes row raises the SAME dialog the filing raised —
       one window for writing a note and one for reading it back, which is what
       makes it learnable.

       THE DRAWER IS NOT RETIRED AND IS NOT REACHED FROM HERE ANY MORE: it is
       Chat, which has a door of its own in the shell bar, and it shows the
       whole contract's conversation rather than one change's.

       THEIR SEAT IS UNTOUCHED, and that is deliberate rather than an oversight
       — the owner's own next sentence was that the counterparty's access "will
       come at a later stage". The dialog writes an INTERNAL note onto
       `ch.thread`, which is on the contract record; their page is rebuilt from
       a share payload and thrown away on the next repaint, so a note written
       there would be typed and lost. Their press falls through to exactly what
       it did before. */
    if (!cid || !id) return;
    const portal = !!(window.PORTAL_MODE && PORTAL_MODE());
    const c = (!portal && window.state && Array.isArray(state.contracts))
      ? state.contracts.find(x => x && String(x.id) === String(cid)) : null;
    const ch = (c && window.negoChangeById) ? negoChangeById(c, id) : null;
    if (c && ch && typeof openChangeNoteDialog === 'function'){
      openChangeNoteDialog(c, ch, { author: (window.currentUser && currentUser()?.name) || undefined })
        /* BARE, like every other caller of it in this file — a cross-module
           read is what the ES-module rule is about, and this is not one. The
           node may be detached by then (the menu closes on the press), which
           rlRepaintFrom already answers for: with no mount above it, the page's
           one mount is what repaints. */
        .then(out => { if (out) rlRepaintFrom(t); });
      return;
    }
    if (window.openNotesPanel) openNotesPanel(cid, id);
  });
}
if (typeof document !== 'undefined' && !document._rlCpWired){
  document._rlCpWired = true;
  /* ---- IN THE CAPTURE PHASE, AND THAT IS LOAD-BEARING ----
     The panel's own acts are the ENGINE's controls — data-nego-edit opens the
     inline editor and its handler calls stopPropagation, correctly, because a
     press on a clause control must not also navigate the clause. So a bubbling
     listener never saw the press: Direct edit opened the editor ON THE CLAUSE
     and left the panel standing over it, which is a door opening something the
     reader cannot see.

     Capture also settles the ORDER, which the bubble phase could not: the
     panel is shut BEFORE the editor's own repaint runs, so rlCpPaint finds
     nothing open and does not put it back up. */
  document.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    /* The panel's type stepper — a stored px applied live, never a repaint
       (see rlCpSetType). Same stop rules as every control in this head. */
    const step = t.closest('[data-rl-cp-type]');
    if (step){
      ev.preventDefault(); ev.stopPropagation();
      rlCpSetType(rlCpTypePx() + (step.getAttribute('data-rl-cp-type') === 'up' ? 1 : -1));
      return;
    }
    const opener = t.closest('[data-rl-cp-open]');
    if (opener){
      /* The pill sits inside .nego-clause, whose own press navigates. Same
         reason the ask tag stops its press: a door that also moves you is two
         acts on one press. */
      ev.preventDefault(); ev.stopPropagation();
      const id = opener.getAttribute('data-rl-cp-open');
      const scope = opener.closest('.redline-page') || document;
      rlCpSetShown(scope, rlCpOpenId() === id ? null : id);
      return;
    }
    const closer = t.closest('[data-rl-cp-close]');
    if (closer) rlCpSetShown(closer.closest('.redline-page') || document, null);
  }, true);
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || !rlCpOpenId()) return;
    /* Only when this panel is the thing on top: a dialog over it owns Escape
       first, exactly as the queue's own handler defers. */
    const mr = document.getElementById('modal-root');
    if (mr && mr.innerHTML.trim()) return;
    /* AND THE CLAUSE EDITOR OWNS IT TOO (25 Aug 2026). It is a page ON TOP of
       this panel, opened FROM it, and both handlers sit on document — so one
       Escape used to close the page and the panel behind it in the same
       press, and the reader who only wanted to leave the editor lost the
       place they came from. Caught by driving the journey in a browser; two
       listeners agreeing to fire is invisible in the source of either. */
    if (typeof window.clauseEditorOpen === 'function' && clauseEditorOpen()) return;
    rlCpSetShown(document, null);
  });
}

/* The design's grid. Everything inside it is the engine's, arranged the way the
   design arranges it rather than the way the comparison workbench does. */
function redlinePanesHtml(c, opts = {}){
  /* Which chair this is being rendered for. The panes are shared markup and
     were reading only opts.readonly, which is why the owner's risk-derived
     bulk verb rendered on the counterparty's screen (D2). */
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* Before anything reads the baseline: an UNTOUCHED negotiation re-reads it
     from the document, so key terms filled on the Doc page after the first
     paint show here too. Guarded inside the engine — one filed change, one
     archived round or one issued hash and the baseline may not move. */
  if (window.negoFreshenBaseline) negoFreshenBaseline(c);
  const p = (typeof negoProgress === 'function') ? negoProgress(c) : { done:0, total:0, pct:0, pending:0 };
  const canAct = !opts.readonly && !rlActorHeld(c, opts);   /* see rlActorHeld */
  const threadTotal = redlineThreads(c, opts).length;
  const mode = rlSideMode();
  /* The Tracked Changes tab's count: the LIVE redlines this seat can see —
     the same live-and-through-the-wall reading the card stack itself renders,
     so the pill and the stack can never disagree. */
  const tabSide = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const tabHidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, tabSide);
  /* COUNT WHAT THE STACK DRAWS. This counted live asks only, while the stack
     below also renders contested asks (refused and not withdrawn), held
     decisions and sent ones — so a column showing four cards sat under a pill
     reading 0, and the pill is what a reader checks to see whether anything
     arrived. redlineCardIds is the stack's own predicate, so the two cannot
     drift again. */
  const changeTotal = (typeof redlineCardIds === 'function')
    ? redlineCardIds(c, { ...opts, hiddenIds: [...tabHidden] }).length : 0;
  /* ---- THE DOCUMENT IS BUILT BEFORE THE PANEL, BECAUSE THE PANEL IS ITS
     OUTPUT. redlineDocHtml fills _cpBodies as it walks the clauses — one
     reading of the wall, the fold and the change grouping — and the panel is
     rendered from what came back. Built here rather than inline in the markup
     below because the panel is written EARLIER in the grid than the document
     it is about. */
  const _cpBodies = [];
  const _cpDoc = redlineDocHtml(c, { ...opts, cpSink: _cpBodies });
  /* #nego-root is not decoration: the engine declares its entire colour ramp
     on `.nego-room, #nego-root`, so without this wrapper --n-slate and friends
     are undefined and the clause tools render as transparent boxes with white
     text on a white page. */
  return `<div id="nego-root" class="rl-root">
    <div id="rl-banner">${''/* THE INTERNAL REVIEW LINE HAS LEFT THIS SLOT. It was
           drawn here, first, as a full-width band — and a band above the
           document is the one thing this page had been asked repeatedly not to
           do. It floats bottom-right now with the rest of the notices; see
           rlFloatingNoticesHtml at the foot of this builder, which is also
           where the note about the portal never learning of a review has gone.

           What is left in this slot is the WALL LINE, and it is the ONE
           deliberate exception to "no bands" (Young, 12 Aug 2026). It is not
           news: on the counterparty's page it is the sentence explaining that
           their decisions stay on this page until they press Send, and a reader
           who has not read it can start answering under a false idea of what
           their clicks do. Folding it into the bottom-right stack would put it
           behind a press — which is exactly the state it exists to prevent. It
           stays, and it stays alone. */
      }${opts.bannerHtml != null ? opts.bannerHtml : redlineWallHtml(c, opts)}${
      ''/* THE SET-ONCE EMAIL STRIP USED TO SIT HERE, and it was the last full
           width band between the top of this page and the first word of the
           contract. The address is a fact about the counterparty, so it is a
           Key terms row now — asked where their name is asked, not across a
           working surface. Nothing about sending changed: the dialog still
           collects an address at send time for a contract that has none.

           AND THE READINESS SIGNAL HAS GONE THE SAME WAY (12 Aug 2026). "They
           signalled they are ready to sign" was a full-width amber band above
           the three columns, on both sides — useful the first time it is read
           and furniture for the rest of the sitting, which is the case against
           every band this page has already lost. It is a card in the
           bottom-right stack now, with its own "Issue a signing link" button
           still on it; see rlFloatingNoticesHtml at the foot of this builder. */
    }</div>
    <div class="rl-turnwrap">${negoTurnBannerHtml(c, opts)}</div>
    <!-- nego-work is kept on the grid because the engine scopes its clause
         tooling under it (.nego-work .nego-pane …). Without it Change and
         Delete render as unlabelled empty boxes. The design's column widths are
         set by .redline-page .rl-grid, which outranks it on specificity. -->
    <!-- ---- TWO PANES, ONE HANDLE, ONE SIDEBAR ----
         The document on the left; ONE card on the right that shows Tracked
         Changes OR Discussion, never both — the tabs at its head are the only
         switch. The handle between them drags the split (the Doc tab's own
         divider, same defaults: two thirds to the contract). nego-work is kept
         on the grid because the engine scopes its clause tooling under it
         (.nego-work .nego-pane …). -->
    ${''/* ---- THE NOTICES, IN FLOW AND ABOVE THE WORK ----
           (owner-asked 23 Aug 2026: "I do not want anything floating over the
           page".) This was the LAST thing in this builder and position:fixed,
           so it hung over the bottom-right corner of the contract. It is here,
           between the turn banner and the grid, so a notice pushes the two
           columns down by its own height instead of covering them — and it
           draws NOTHING on an ordinary negotiation, where the reading has not
           been changed and no desk rule is holding the reader. */}
    ${rlFloatingNoticesHtml(c, opts)}
    <div class="rl-grid nego-work" id="rl-grid" style="--nego-f:1;--nego-c:320px">
      <!-- THE QUEUE IS AN OVERLAY, NOT A TRACK (owner-asked, 12 Aug 2026). It
           was the first of three grid columns, and it took about 300px off the
           contract to say what to answer next. It slides over the page from the
           left now, on the Activity panel's own mechanism, and the grid is two
           tracks again — so opening it changes nothing behind it. It is still
           written FIRST because it is read first, and because the edge door
           that opens it has to exist before the reader looks for it. See
           rlQueueHtml, which builds the scrim, the door and the panel. -->
      ${rlQueueHtml(c, opts)}
      <!-- keeps the nego-pane working classes: the engine's clause tools
           (Change, Delete, the fingerprint margin) are styled through them, and
           without them they render as unlabelled empty boxes -->
      ${''/* ---- THE MIDDLE COLUMN IS THE SHEET, AND NOTHING ELSE ----
             It used to open with a head reading "The contract" and a count of
             the marks on it. Both are gone (Young, 10 Aug 2026): the name was
             labelling the most self-evident object on the page, and the count
             is said better one column to the right, where the cards it counts
             actually are ("N on the table"). What is left is the paper, on the
             page, which is the whole point of the column. */}
      <section id="rl-doc" class="rl-doc nego-pane working" aria-label="${_nea(i18t('ng_doc_aria'))}">
        <div class="nego-scroll" id="nego-scroll-work">${_cpDoc}</div>
      </section>

      ${''/* A SEPARATOR NOBODY CAN REACH IS A CONTROL HALF THIS WORKSPACE DOES
             NOT HAVE. It carried role and orientation and no tab stop, so the
             arrows below had nothing to fire on. Key Terms' own divider has had
             both since it was built — ktWireSplit — and this is that, ported. */}
      <div id="rl-resizer" class="rl-resizer" role="separator" aria-orientation="vertical"
        tabindex="0" aria-label="${_nea(i18t('ng_drag_width'))}"
        title="${_nea(i18t('ng_drag_width'))}"><span></span></div>

      ${''/* ---- ONE COLUMN NOW, NOT TWO FACES OF ONE ----
             This card used to carry a [Tracked Changes | Discussion] switch, a
             filter dropdown, two bulk verbs and a second copy of the batch
             send, above the cards. All four are gone on the design's call
             (Young, 10 Aug 2026):

             - the DISCUSSION column, because a thread hangs off a change and
               now reads on that change's own card;
             - the FILTER, because the queue beside the document already answers
               "what is left" and a column of five cards does not need slicing;
             - ACCEPT ALL / REJECT ALL, because deciding the other side's
               wording in one press is the one act on this page that should cost
               a reader one press per clause;
             - the column's own SEND ALL, because Publish Round on the toolbar
               is the same act and two buttons for one act is one too many.

             What survives is the engine's own #nego-send, kept mounted and
             visually hidden: it is the control Publish Round presses. */}
      <aside class="rl-col rl-side${rlReadOnlyReading() ? ' is-reading' : ''}" id="rl-side" aria-label="${_nea(i18t('ng_tracked_changes'))}">
        ${''/* ---- THE COLUMN STANDS DOWN ON A READING (owner-asked 24 Aug
               2026) ---- On 'As agreed' and 'With changes' the paper is drawn
               without its marks, so a verb here would decide a change against a
               document the reader is not being shown. The cards still DRAW —
               greying them keeps the round's shape readable, which is the whole
               point of standing beside the clean wording — and the sentence
               names the one way back.
               IT SITS OUTSIDE THE GREYED PANE ON PURPOSE: the pane takes
               pointer-events:none, and a way forward inside it would be a
               button nobody could press. It presses data-rl-read, the tab
               row's OWN attribute, so this is the existing door rather than a
               second one. */}
        ${''/* ---- NO STRIP, AND THE COLUMN STAYS EXACTLY AS IT IS
               (owner-ruled 24 Aug 2026: "I need the card to stay the same size
               and look identical from page to page just that the last 2 need
               to be greyed out. No need to add a reason.") ----
               The strip said "Reading only — go back to Redlined to make a
               change" above the column on the two clean readings. It is gone;
               the greying is UNTOUCHED, so the column still refuses a press on
               those two readings exactly as before.
               AND REMOVING IT IS WHAT MAKES THE COLUMN IDENTICAL PAGE TO PAGE,
               which is the half of the ask that is easy to miss: the strip only
               drew on two of the three readings, so it pushed the column down
               on those two and left it at the top on the third. With it gone
               all three start at the same place.
               THE STANDING RULE THIS REVERSES, said out loud rather than
               quietly dropped: "A NON-DEFAULT READING ALWAYS SAYS SO … with the
               way back" and "THE READING NOTICE NEVER FOLDS". The owner has
               seen it and ruled that no reason is wanted. The way back is
               unchanged and one press away — the tab row above the contract.
               `.rl-idx-reading` is STALE — flag any mention. */}
        ${''/* ---- REFUSING THE POINTER IS NOT REFUSING THE KEYBOARD ---- (25 Aug 2026)
             On 'as agreed' and 'with changes' this column is inert: it draws
             faded and pointer-events:none refuses the press, because a change
             filed here would be measured against a document the reader is not
             being shown. MEASURED: Tab still walked into every verb in it and
             Enter still fired them, so the one route the greying exists to
             close was open to anybody not using a mouse — and aria-disabled
             merely SAYS so, it takes nothing away.
             `inert` is what actually takes it away: no focus, no clicks, and
             removed from the accessibility tree. It is a boolean attribute, so
             it is emitted or it is not — never inert="false", which is inert. */}
        <div class="nego-pane index" id="rl-changes-col" aria-label="${i18t('ng_tracked_changes')}" ${rlReadOnlyReading() ? 'aria-disabled="true" inert' : ''}>
          ${''/* ---- THE CHANGE INDEX (owner-approved render, 24 Aug 2026) ----
                 The head said "TRACKED CHANGES" and a count of what is OPEN,
                 which never told a reader how far through the round they were.
                 It states the whole shape now: how many are still open, a bar,
                 and "N of M decided". IT INVENTS NO ARITHMETIC — negoProgress
                 has computed done/total/pct all along and this head is where it
                 finally draws; the same numbers were already in this markup,
                 hidden, feeding the header proxies. */}
          <div class="rl-idx">
            <div class="rl-idx-top">
              ${''/* ---- THE COLUMN NAMES ITSELF, AND THE TOTAL IS IN THE NAME
                     (owner-asked 25 Aug 2026, off a drawing of the whole
                     column: "Tracked changes (7)") ----
                     It read "Change index", which named the block rather than
                     what is in it. THE NUMBER IS BORROWED, never counted here:
                     changeTotal is the same reading the pill, the filter and
                     the bands all print, and a second arithmetic on a figure
                     already on the page is how two parts of one column come to
                     disagree. `ng_idx_head` is STALE — flag any mention. */}
              ${''/* The bracketed total is the quiet half of the name and is
                     marked so the sheet can say so — one string from the
                     dictionary either way, so nothing about the words moves. */}
              ${''/* ---- IT IS CALLED REDLINES, AND IT SAYS ONE NUMBER
                     (owner-asked 27 Aug 2026) ----
                     "Tracked changes (3)" with "3 open" beside it printed the
                     same round twice on one line — and on a laptop the pair
                     plus Send all wrapped the row, which is what pushed the
                     column's own name onto a line of its own. The count in
                     brackets is the whole book; how many are still open is
                     said by the piles below, each of which carries its own
                     count and is named for exactly the state it holds.
                     `ng_tracked_head_n`, `ng_n_open` and `.rl-idx-open` are
                     STALE — the keys are left inert in both dictionaries. */}
              <span class="rl-idx-title">${
                _ne(i18t('ng_redlines_head_n', { n: changeTotal }))
                  .replace(/\s*(\(\d+\))\s*$/, ' <i>$1</i>')}</span>
              <span class="rl-idx-sp"></span>
              ${''/* ---- SEND ALL, AT THE OPPOSITE END OF THE COLUMN'S NAME
                     (owner-asked 26 Aug 2026, ringing this exact slot) ----
                     The spacer above has pushed this to the right wall since
                     the head was built and nothing has ever been drawn after
                     it. The act arrives from the deleted "N not sent" strip
                     with its rules intact; only the slot is new. */}
              ${rlUnsentSendHtml(c, opts)}
              ${''/* ---- AND CLOSE ROUND BESIDE IT (owner-asked 27 Aug 2026) ----
                     The two acts of a round, on one line, where it is plain
                     that only ever one of them is live: everything unsent has
                     to travel before a round can be closed, so Send all and
                     Close Round can never both be pressable. It came off the
                     page head, where it appeared only once the round was
                     already settled and therefore said nothing about rounds
                     until the moment you no longer needed telling. */}
              ${rlCloseRoundHtml(c, opts, p)}
            </div>
            ${p.total ? `<div class="rl-idx-bar" role="img"
              aria-label="${_nea(i18t('ng_n_of_m_decided',{done:p.done,total:p.total}))}"><i
              style="width:${p.pct}%"></i></div>
            ${''/* ---- THE "N OF M DECIDED" ROW IS DELETED (owner-asked
                   26 Aug 2026, ringing it: "delete this area completely") ----
                   It held that sentence and, until the same morning, the
                   WHOSE ASKS filter; with the filter retired the row was one
                   line of prose repeating what the line above it already says.
                   THE HEAD SAYS BOTH NUMBERS ALREADY — "Tracked changes (4)"
                   and "3 open" — so "1 of 4 decided" was the same arithmetic
                   printed a second time, twenty pixels lower.
                   THE BAR STAYS, and that is a decision rather than an
                   oversight: it was outside what the owner ringed, and it is a
                   different kind of thing — a glance at how far through the
                   round you are, not a number to read. One word removes it.
                   .rl-idx-foot and .rl-idx-sub are STALE, and so is
                   rlIdxFilterHtml's last caller — that builder is now a stub
                   with no caller at all. */}` : ''}
            ${''/* ---- THE NARROWED BAND IS GONE (owner-asked 26 Aug 2026) ----
                   It read "Showing one side only — others are hidden" with a
                   Show all changes beside it, and it was the amber row the
                   owner ringed when they set the standing rule NO NEW BANDS ON
                   THE PAGE. It fails both halves of that rule's test: the
                   dropdown TEN PIXELS ABOVE IT is labelled WHOSE ASKS and reads
                   "Mine (2)", so the screen already said it — and it was the
                   reader's own choice read back to them rather than work owed.

                   THE SAFETY PROPERTY IT CARRIED IS NOT LOST, and that was the
                   condition on removing it. This file recorded the filter's
                   three properties and this band as the third; the third is now
                   carried by two things that were already on the screen:
                     · THE CONTROL SAYS WHAT IT IS SET TO. It is a labelled
                       dropdown printing the live cut AND that cut's own count,
                       and it is drawn whenever there is any change to hide
                       (this same p.total gate) — so a narrowed column can never
                       be silent about being narrowed.
                     · A COLUMN EMPTIED BY THE FILTER STILL SAYS SO and still
                       offers the way back, in its own empty state, which is
                       untouched and is a different surface from this band.
                   The other two properties — three options only, and every
                   option carrying its own count unmoved by the filter — are
                   untouched.

                   `ng_filter_narrowed` and `.rl-idx-narrowed` are STALE; the
                   key is left inert in the dictionary and ng_filter_show_all
                   stays live on the empty-column message. */}
          </div>
          <div class="nego-index-head rl-idx-head">
          ${''/* THE COLUMN'S TITLE IS THE INDEX BLOCK'S OWN, one region up —
                 see ng_tracked_head_n there. A second heading here is the
                 duplicate this page has just been told off for. */}
          <span class="rl-idx-k" hidden>${i18t('ng_tracked_changes_head')}</span>
          ${''/* ---- THE COUNT DRAWS ONLY WHERE THE TABS DO NOT ----
                 (owner-chose Option 1, 16 Aug 2026.) "2 on the table" and the
                 filter's "All 2" said the same number twice, twelve pixels
                 apart, and the duplicate cost the head a whole row. The
                 filter's own counts are the count now — one line, caption
                 left, tabs right on the same rule. A narrowed reviewer gets
                 no filter (one-outcome control is furniture), so THEIR head
                 keeps the plain count: dropping both would leave the column
                 with no number at all. */}
          ${rlMyCardIds(c, opts) ? `<span class="rl-idx-n${changeTotal ? ' is-live' : ''}" id="rl-chg-count-wrap">${i18t('ng_on_the_table',{n:changeTotal})}</span>` : ''}
          ${''/* ---- WHOSE ASKS ----
                 Asked for by name (Young, 10 Aug 2026). Segmented rather than
                 a dropdown, and every option carries its own count, so a
                 filter can never hide a change quietly — the reason the old
                 dropdown was removed, answered rather than ignored.

                 NOT DRAWN FOR A REVIEWER whose column is already narrowed to
                 the clauses they were handed: every setting gives the same
                 answer once the column holds one person's work, and a control
                 with one outcome is furniture. That rule predates this
                 control; rlMyCardIds returning a set IS the narrowing. */}
          ${''/* THE WHOSE-ASKS FILTER MOVED UP into the index block above —
                 see rlIdxFilterHtml, and the slot it now fills. */}
          ${''/* kept for the engine's wiring and the header proxies; the design
                 carries these controls in the page header instead */}
          <span class="nego-count" id="nego-count" hidden>${p.pending || p.total}</span>
          <span class="rl-tab-n" id="rl-chg-count" hidden>${changeTotal}</span>
          <span class="rl-tab-n" id="rl-rail-count" hidden>${threadTotal}</span>
          <button class="nego-fold" id="nego-fold" hidden>${i18t('ng_hide')}</button>
          <div class="nego-track" hidden><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
          <div id="nego-progress" hidden>${i18t('ng_resolved_short',{done:p.done,total:p.total})}</div>
          ${''/* ---- N NOT SENT DOES NOT DRAW HERE ANY MORE ----
                 The strip stood between the index and the first pile and the
                 owner has taken it back for the cards. Its act is in the
                 column's head now — see rlUnsentSendHtml at .rl-idx-top. */}
          ${''/* ---- THE CO-PILOT'S FIRST PASS (W3-1) ----
                 Under the unsent band and above the cards, because it is a
                 reading OF those cards. Drawn only on our seat, only where
                 they have actually asked for something, and never for a
                 narrowed reviewer. See rlPlanBandHtml. */}
          ${''/* THE COPILOT'S FIRST PASS IS NOT DRAWN (owner-ruled 24 Aug
                 2026: "delete the copilot first pass feature completely", then
                 "just delete the strip for now"). The band is gone from the
                 page; the engine behind it, its wording in both languages and
                 its styling all stay in place, switched off, so it comes back
                 in one line if it is ever wanted. rlPlanBandHtml is a stub
                 rather than a deletion — it is published on window and a third
                 caller must not be able to bring the strip back through a door
                 nobody remembered. */}
          ${''/* ---- AND NOW THE BULK VERBS ARE GONE FROM BOTH SEATS ----
                 They left OUR column first: deciding the other side's wording
                 in one press is the act that should cost a press per clause,
                 and we have Publish Round for the batch. The counterparty's own
                 seat kept the pair a while longer under D2, on the argument
                 that they have no Publish Round and "I agree to all of it" is a
                 real answer.

                 REMOVED FROM THEIRS TOO (Young, 10 Aug 2026), with the head
                 restyled as a rule rather than a band. The argument for keeping
                 them was about their TIME, and the argument against is about
                 what the press MEANS: Accept all on their seat disposes of
                 every ask we filed in one click, from a header, with no clause
                 in front of the reader while they press it. The per-card verbs
                 are still one press each and the count in the head says how
                 many are left, so nothing is unreachable — it is six presses
                 instead of one, and six is the point.

                 Nothing else was touched. #nego-bulk-acc / #nego-bulk-rej
                 remain wired in wireNegotiationTab (they are the classic
                 negotiation tab's ids too, still rendered there), so restoring
                 this block is the whole of the way back. */}
          ${''/* A SCREEN WITH NO VERBS MUST SAY WHY IT HAS NONE — the same rule
                 the counterparty's action bar has carried for a while. An
                 executed contract used to render this column silently, which
                 reads as a page that failed to load rather than a record that
                 is closed. It outlived the bulk verbs it was written for
                 because it was never about them: it is about the whole column
                 being inert. */}
          ${!canAct && opts.readonlyWhy ? `<div class="nego-why" id="nego-readonly-why">${_ne(opts.readonlyWhy)}</div>` : ''}
          ${''/* THE POSTBOX, MOUNTED AND UNSEEN. #nego-send is the engine's one
                 send; Publish Round on the toolbar is a proxy that clicks it
                 (see redlineSyncProxies, which also reads its disabled state to
                 decide whether the proxy may act). Removing it would leave the
                 toolbar pressing nothing. */}
          <div class="rl-sendslot rl-sendslot-hidden" aria-hidden="true">${negoIndexSendHtml(c, opts)}</div>
          </div>
          <!-- TWO IDS, NESTED, BOTH LOAD-BEARING. #nego-cards is the scroll box
               the engine and the counterparty portal both reach for by name;
               #rl-changes is the design's list of cards inside it. They are
               different things — a scroller and its contents — so nesting is the
               honest arrangement rather than a trick to satisfy both. -->
          ${''/* cpPanel: this mount renders the clause panel a few lines below,
                 so the rows may draw their Open door onto it. A caller that
                 renders cards with no panel (none today) draws no door. */}
          <div class="nego-index-scroll rl-cards" id="nego-cards">${negoLinkedBarHtml()}<div id="rl-changes">${redlineChangeCardsHtml(c, { ...opts, cpPanel: true })}</div></div>
        </div>
      </aside>
      <!-- THE CLAUSE PANEL, on the other wall and on the same mechanism as the
           queue. Built here rather than on the workbench toolbar, which is what
           makes it reach every mount — the owner's bench, the contract tab's
           embed and the COUNTERPARTY's page, which renders these panes and has
           no toolbar of its own.

           WRITTEN LAST, and that is the opposite of the queue's placement for a
           reason of its own. The queue goes first because it is READ first and
           its edge door has to exist before a reader looks for it. This panel
           has no door on the page's edge — its door is the pill on the clause —
           and it holds a copy of every clause's wording, so written first it
           would answer to the sheet's own selectors before the sheet did.
           paper-grows-verify caught exactly that, measuring a 0x0 box for a
           clause tool that was really a hidden button in here. It is
           position:absolute, so where it appears is unaffected. -->
      ${rlClausePanelHtml(_cpBodies)}
    </div>
    ${''/* OVER THE PAGE, NOT ABOVE IT — see rlFloatingNoticesHtml. Last in the
           markup and position:fixed, so it floats clear of the grid rather than
           taking a row from it. The readiness signal rides in as an extra: it
           was a band in #rl-banner until 12 Aug 2026, it is a card here now, and
           it is passed rather than built inside the stack because it is this
           page's own notice with this page's own button on it. */}
  </div>`;
}

/* THE THIRD COLUMN — the threads that hang off the changes.
   Not the workspace-wide message board: the design's cards each name a change
   ("Change L-001 · 2. Payment Terms"), which is the engine's per-change thread.
   Those live on the contract, so unlike the workspace board they work in local
   mode too.
   The markup is the design's; the controls are the engine's. The reply box
   carries id="nego-ti-<change>" and data-nego-send, and the visibility switch
   carries data-nego-vis — the same attributes negoLiveCardsHtml emits — so
   wireNegotiationTab binds the send, the internal/shared choice and the
   validation without any of it being reimplemented here. */
function redlineThreads(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  /* Through the wall, twice over. A thread hangs off a change, so a change
     this side cannot see contributes no thread; and within a visible thread,
     each MESSAGE is filtered on its own visibility — an internal aside sits in
     the same thread as the shared replies, and stripping the thread whole
     would either leak the aside or eat the conversation around it. A thread
     whose every message is internal to the other side disappears entirely,
     counts included: rl-thread-count and the rail chip are both drawn from
     this list, so the numbers cannot betray what the list conceals. */
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  /* And narrowed to what a reviewer was handed, like the cards and the queue: a
     thread hangs off a change, and a change that is not their job carries a
     conversation that is not either. The tab's pill counts off this list. */
  const changes = (typeof negoChanges === 'function')
    ? negoChanges(c).filter(x => x.status !== 'superseded' && !hidden.has(x.id)
        && (!rlMyCardIds(c, opts) || rlMyCardIds(c, opts).has(String(x.id)))) : [];
  return changes.map(ch => ({
    ch,
    msgs: (window.negoMergedThread ? negoMergedThread(c, ch, opts.messages) : (ch.thread || []))
      .filter(m => rlMsgVisible(m, side)),
  })).filter(t => t.msgs.length);
}
/* THE DISCUSSION COLUMN'S RENDERER STOOD HERE — a thread card per change, a
   reply box on each, and a starter composer for every change nobody had said
   anything about yet. The column is gone (Young, 10 Aug 2026): a thread hangs
   off a change, so the conversation reads on that change's own card, built by
   rlCardNotesHtml from the same three engine attributes this one used.

   Removed rather than left uncalled. A builder nothing draws is a builder that
   quietly stops agreeing with the one that does, which is exactly the drift
   THE MAP's list of draw sites exists to prevent.

   redlineThreads above survives: it is how the page counts what has been
   said.
*/
/* A timestamp a person can read, falling back to the raw value rather than
   inventing one when the record has no parseable date. */
/* Adds Show more to any clamped reason that actually overflows its two lines.
   Measured on the painted node rather than guessed from length. A card whose
   body is hidden (shut, waiting to peek) measures 0 — those get a listener on
   the card itself and are measured the first time they become visible. */
function negoWireWhyClamp(host){
  const scope = (host && host.querySelectorAll) ? host : document;
  scope.querySelectorAll('.nego-why-clamp').forEach(el => {
    if (el.dataset.whyWired) return;
    if (!el.clientHeight){
      const card = el.closest('[data-nego-card]');
      if (card && !card.dataset.whyPeekWired){
        card.dataset.whyPeekWired = '1';
        const later = () => negoWireWhyClamp(card);
        card.addEventListener('mouseenter', later);
        card.addEventListener('focusin', later);
      }
      return;
    }
    el.dataset.whyWired = '1';
    if (el.scrollHeight <= el.clientHeight + 1) return;   // it fits — no verb
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'nego-why-more'; btn.textContent = 'Show more';
    btn.addEventListener('click', ev => {
      ev.stopPropagation();
      const open = el.classList.toggle('open');
      btn.textContent = open ? 'Show less' : 'Show more';
    });
    el.after(btn);
  });
}

function negoWhen(at){
  const t = Date.parse(at || '');
  if (isNaN(t)) return '';
  const d = new Date(t);
  return d.toLocaleTimeString(jxLocale(), { hour: '2-digit', minute: '2-digit' });
}
/* Mirror the engine's own enablement onto the header buttons, so the header
   never offers an action the workbench itself is refusing. */
function redlineSyncProxies(host){
  host.querySelectorAll('[data-redline-proxy]').forEach(el => {
    const target = document.getElementById(el.getAttribute('data-redline-proxy'));
    const usable = !!target && !target.disabled;
    el.disabled = !usable;
    /* The button's OWN title survives being usable. Blanking it was fine while
       every proxy was a bare verb, but the batch send explains what it is about
       to do to a named counterparty, and a control that only describes itself
       when it is broken is the wrong way round. Stashed on first sight so a
       repeated sync cannot overwrite it with the failure message. */
    if (el.dataset && el.dataset.rlTitle == null) el.dataset.rlTitle = el.title || '';
    const own = (el.dataset && el.dataset.rlTitle) || '';
    el.title = usable ? own : 'Not available on this round yet';
  });
}

if (typeof window !== 'undefined') Object.assign(window, {
  renderRedline, redlineRoundLabel, redlineSyncProxies,
  rlToggleDiscussion, rlSideMode, rlSetSideMode, rlLayoutResizer, rlWireResizer, rlWireClauseTools,
  rlDocType, rlDocScale, rlSetDocType, rlTypeStepHtml, rlWireTypeStep,
  rlApplyDocZoom, rlObserveDocPane, RL_PAGE_W, RL_ZOOM_MAX,
  rlFocusOn, rlSetFocus, rlResetFocus, rlWireFocusKey, rlPaintFocusBtn, rlFocusPage,
  rlReadSegsHtml, rlPaintReadSegs, rlBellIsNews, rlReadySeen, rlMarkReadySeen,
  /* The reading, for the clause editor: that page draws this same paper and
     has to ask the same three questions of it — which reading is live, does
     that reading refuse editing, and the band that says so. Read through
     window from another module, so they have to be published or the reads
     are silence rather than answers (f232's whole subject). */
  rlReadMode, rlSetReadMode, rlReadOnlyReading, rlReadNoticeHtml,
  rlAskTagHtml, rlAskRevealHtml, rlAskGlyph, rlAskWord, rlAskOpenId, rlAskSetOpen, rlAskResetOpen,
  rlChangeWordingHtml, rlClauseEditPillHtml, rlClausePanelBodyHtml, rlClausePanelHtml,
  rlHangRichHtml,
  rlCpOpenId, rlCpSetOpen, rlCpSetShown, rlCpPaint, rlCpNotesOn, rlCpSetNotes,
  rlEditorTakesIt,
  rlCpTypePx, rlCpSetType, rlCpZoom,
  rlUnsentBandHtml, rlUnsentSendHtml, rlUnsentCount, rlCloseRoundHtml,
  rlFitTabRow, rlWireFitTabRow, rlObserveTabRow,
  redlineHeldId, redlineEvict, openRedlineWorkbench,
  rlOwnerOpenActions, rlOwnerOpenTotal, rlJumpHtml,
  rlPbFindClause, rlPlaybookProposals, rlPbWordingLabel, rlFilePlaybookProposal, rlOpenPlaybookReview,
  rlHiddenFrom, rlMsgVisible, redlineEmbed, negoIsRedeciding, rlSeatAlertsHtml,
  RL_CARD_FILTERS, rlCardFilter, rlSetCardFilter, rlCardFilterPass,
  RL_CARD_BANDS,
  RL_SEL_ACTIONS, RL_PLACEMENT_NOTE, rlSelActions, rlSelMenu, rlAiPropose, rlStandardAction,
  rlPlanBandHtml, rlPlanIsOpen, rlPlanSetOpen,
  redlineCardIds, rlCardRank, rlCardSort, rlOneNoticeHtml, rlNoticeStackHtml, rlAlertsBellHtml, rlFloatingNoticesHtml, rlNoticesFolded, rlSetNoticesFolded,
  rlJumpToClause, rlLinkFocus, rlDeltaOps, rlSayInPanel,
  /* The per-card open/shut model went with the fold (12 Aug 2026), and the
     pop-out went the same way on 16 Aug 2026: rlPopId, rlPopIsOpen, rlPopSet,
     rlPopClose, rlPopPaint, rlPopPlace, rlPopAt, rlPopResetAt and rlPopFit are
     retired with it — the clause panel (rlCp*) is the one reading surface. */
  rlCardNeedsYou, rlCardForgetPins,
  rlQueueRows, rlQueueHtml, rlQueueWord, rlQueueSelect, rlQueueSelected, rlQueueMark,
  rlQueueOpen, rlSetQueueOpen, rlSetQueueShown, rlWireQueueMin,
  rlRestoreScroll,
  /* ---- THE NEGOTIATIONS DOOR ----
     Every one of these is called from ANOTHER module — the sidebar count and the
     nav router from js/app.js, the round line and the Document tab's button from
     js/views/contract.js, the bar from js/mobile.js. These files are ES modules,
     so a top-level function in one is invisible to the next; see the note below
     about rlPaperFootHtml, which was declared, called, and silently absent for a
     year because nobody put it here. */
  negoNeedsYouIds, negoNeedsYouTotal, negoIsLive, negoLiveList,
  negoLastOpened, negoRememberOpened, openNegotiations,
  renderNegotiationsList, negoListHeadHtml, negWhoseMove,
  /* ---- rlPaperFootHtml WAS NEVER ON WINDOW, SO IT NEVER DREW ----
     Found while fixing the blank read-only copy (11 Aug 2026). signatureBlock
     in js/views/contract.js reads `window.rlPaperFootHtml ? … : ''` and falls
     back to a dashed placeholder reading "Signature block — pending execution ·
     Confirm intent to sign from the panel on the right." That fallback is for a
     contract with NO parties named. It has been the only branch anybody has
     ever seen: the function is declared in this file, this file is a module,
     and nothing ever put it on window — so the two ruled lines with the parties
     under them, which THE MAP describes as drawn on four screens, have never
     appeared on any of them.

     It surfaced on the read-only copy because there the sentence is not merely
     misplaced but false: that page has no panel on the right and the reader
     cannot sign at all. Exporting it is the whole fix, and it restores the same
     ending on every screen that draws a document — which is what the shared
     builder was for. */
  rlPaperFootHtml,
  redlinePanesHtml, redlineThreads, redlineDocHtml, redlineChangeCardsHtml, rlCardNotesHtml, negoWhen,
  NOTE_ROOMS, negoNoteRoom, negoRoomNotes, negoNoteCounts, notesMayWrite,
  rlNoteDialogHtml, openChangeNoteDialog, rlNoteAskAfterFile,
  rlChatRows, rlChatPanelHtml, rlChatPanelPaint,
  negoPostToChannel, negoNotifyMentions, negoMentionLine, rlNotesPanelHtml, rlNotesPanelPaint, rlWireNotesPanel,
  rlNpTagMenuHtml, rlNpTagWire, rlNpMarkMentions, rlTagInk,
  negoMentionsMe, negoMentionsWaiting, negoMarkChatSeen, NEGO_CONTRACT_THREAD,
  rlCardNotesCountHtml,
  rlNpRoom, rlNpSetRoom,
  negoEnsureStyle, negoDocHtml, negoLeadChange, negoCardsHtml, negoStatusHtml, negoHeadHtml, negoReadyHtml,
  negoTabHtml, renderNegotiationTab, wireNegotiationTab, negoFocus, negoResetView, negoDomId,
  negoPanesHtml, negoRoomHtml, negoRoomActionsHtml, negoLayout, negoSetLayout, wireNegoLayout,
  negoHistoryHtml, negoHistoryCardHtml, negoConfirmCloseRound, negoWhoseHtml,
  negoIndexSendHtml, negoNameFieldHtml, negoRememberedName, negoRememberName, negoWireNameMemory, NEGO_NAME_KEY, negoReadySignalHtml, negoRoomHasExit, negoPick,
  negoRoomBannerHtml, negoClosedBannerHtml, negoNumberingNoticeHtml,
  negoRenumberPreviewHtml, negoRenumberOpen,
  negoTimelineScreenHtml, negoTimelineEventHtml, negoTimelineSeatIsTheirs, openHistoryTimeline,
  negoVerifyResultHtml, negoHistoryExportHtml, negoHistoryExportRun, negoHistoryPrintRun,
  openNegotiationRoom, closeNegotiationRoom, negoRoomContract, negoRoomIsOpen,
  negoComparePair, negoSetComparePair, negoPaneSelectHtml, negoCompareDocHtml,
  negoCleanView, negoSetCleanView, negoCleanDocHtml, negoCleanBarHtml,
  negoRichBody, negoFlatBody,
  negoSeenKey, negoSeenScope, negoThreadSeenAt, negoMarkThreadSeen,
  NEGO_F0, NEGO_C0, NEGO_LAYOUT_KEY });
