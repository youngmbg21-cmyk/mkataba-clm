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
// DESIGN
//
// Layout, interaction and visual design follow prototype.html. Where the
// prototype's own tokens conflicted with HaTi's live design system, HaTi's win
// and the deviation is recorded in BUGLOG.md — the full table is in
// INVENTORY.md §2.4. In short: IBM Plex over Georgia/system-ui, the warm
// --color-bg over the prototype's cool #f2f4f7, --color-accent-* over the
// bespoke --slate ramp, and diffHtml's #8f322b for struck-out wording so an
// accepted change looks the same in this tab as in the version-compare modal.

/* Which change is in focus, and which threads are open. Module-level rather
   than on the contract: this is where the reader is looking, not something
   about the agreement, and it must never reach storage or the share payload. */
let _negoActive = null;
let _negoThreads = {};
let _negoStyled = false;

const _ne = s => (window.esc ? esc(s) : String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));

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
   Emitted once, on first render. A <style> block is the established way to do
   this here (portalRevisedBanner does it for its keyframes): the tri-pane needs
   real CSS — margin-anchored absolute positioning, media queries and a keyframe
   — and inline styles cannot express any of the three. Every colour is a HaTi
   token, so the tab cannot drift from the rest of the product. */
function negoStyleHtml(){
  return `
<style id="nego-style">
  /* Redline runs. The insertion green is #1e6b4d in both the prototype and
     HaTi's diffHtml, so there is nothing to reconcile. The deletion red is
     diffHtml's #8f322b rather than the prototype's #b0453c, so struck-out
     wording reads identically in this tab and in the compare modal; #b0453c
     stays where the repo already uses it, on destructive controls. */
  .nego-ins{background:#d9eae0;color:#1e6b4d;border-bottom:2px solid #1e6b4d;border-radius:3px;padding:0 3px;font-weight:600}
  .nego-del{background:#f1dcd8;color:#8f322b;text-decoration:line-through;text-decoration-color:#8f322b;text-decoration-thickness:1.5px;border-radius:3px;padding:0 3px}
  .nego-resolved{background:#d9eae0;border-radius:3px;padding:0 3px;transition:background 1.2s ease}
  .nego-resolved.nego-faded{background:transparent}

  /* The workbench: baseline · working · index. */
  .nego-work{flex:1;min-height:0;display:grid;grid-template-columns:1fr 1.15fr 335px;gap:0;background:var(--color-bg);
    border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);overflow:hidden}
  .nego-pane{display:flex;flex-direction:column;min-width:0;min-height:0;border-right:1px solid var(--color-divider)}
  .nego-pane:last-child{border-right:none}
  .nego-pane-head{flex:none;display:flex;align-items:center;gap:8px;padding:10px 16px;
    background:var(--color-surface);border-bottom:1px solid var(--color-divider);
    font-size:12.5px;font-weight:700;color:var(--color-neutral-900)}
  .nego-ver{font-family:var(--font-mono);font-size:10.5px;font-weight:600;background:var(--color-accent-100);
    color:var(--color-accent-700);border:1px solid var(--color-accent-300);border-radius:5px;padding:1px 7px}
  .nego-sub{font-weight:500;color:var(--color-neutral-600);font-size:11.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nego-scroll{flex:1;overflow-y:auto;padding:22px 20px 60px;scroll-behavior:smooth}

  /* The document surface. --font-doc is HaTi's own document face, and its
     contrast ratios against #fbfbfc are the ones documented in index.html.
     The prototype nominated a serif stack instead; adopting it would put a
     second document typeface in one product, so the token wins. */
  .nego-doc{background:#fbfbfc;border:1px solid var(--color-divider);border-radius:4px;box-shadow:var(--shadow-md);
    padding:30px 36px 40px;max-width:720px;margin:0 auto;
    font-family:var(--font-doc);font-size:14px;line-height:1.85;color:var(--color-doc-text)}
  .nego-doc h1{font-size:17px;text-align:center;margin:0 0 6px;line-height:1.35;font-family:var(--font-heading);font-weight:600}
  .nego-doc .nego-meta{text-align:center;font-family:var(--font-body);font-size:11px;color:var(--color-doc-muted);
    margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid var(--color-doc-rule)}
  .nego-clause{position:relative;margin-bottom:18px;padding:10px 12px;border-radius:5px;
    transition:background .25s ease,box-shadow .25s ease}
  .nego-clause h2{font-size:13.5px;margin:0 0 5px;font-family:var(--font-heading);font-weight:600}
  .nego-clause p{margin:0}
  .nego-clause.is-active{background:var(--color-accent-100);box-shadow:0 0 0 2px var(--color-accent-700)}
  .nego-clause.flash{animation:negoFlash 1.4s ease 1}
  @keyframes negoFlash{
    0%{box-shadow:0 0 0 2px var(--color-accent-700),0 0 0 8px rgba(65,97,128,.18)}
    100%{box-shadow:0 0 0 2px var(--color-accent-700),0 0 0 0 rgba(65,97,128,0)}
  }

  /* The fingerprint pill, anchored in the document margin. */
  .nego-badge{position:absolute;right:calc(100% + 6px);top:10px;
    font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:.2px;
    background:var(--color-accent-100);color:var(--color-accent-700);
    border:1.5px solid var(--color-accent-700);border-radius:999px;padding:2px 8px;
    white-space:nowrap;user-select:none;cursor:pointer;
    transition:transform .15s ease,box-shadow .15s ease,background .2s ease,color .2s ease,border-color .2s ease}
  .nego-badge:hover{transform:scale(1.06);box-shadow:var(--shadow-sm)}
  .nego-badge.is-active{background:var(--color-accent-800);border-color:var(--color-accent-800);color:#fff}
  .nego-badge.is-accepted{background:#d9eae0;border-color:#1e6b4d;color:#1e6b4d}
  .nego-badge.is-rejected{background:#f1dcd8;border-color:#8f322b;color:#8f322b}
  .nego-note{display:inline-block;font-family:var(--font-body);font-size:10.5px;font-weight:700;
    border-radius:5px;padding:1px 7px;margin-left:8px;vertical-align:1px;letter-spacing:.3px}
  .nego-note.ok{background:#d9eae0;color:#1e6b4d}
  .nego-note.no{background:#f1dcd8;color:#8f322b}

  /* The change index. */
  .nego-index{background:var(--color-bg)}
  .nego-index-head{flex:none;padding:12px 16px 10px;background:var(--color-surface);border-bottom:1px solid var(--color-divider)}
  .nego-count{font-family:var(--font-mono);font-size:10.5px;font-weight:700;background:var(--color-accent-800);color:#fff;border-radius:999px;padding:1px 8px}
  .nego-track{height:5px;background:var(--color-neutral-200);border-radius:999px;overflow:hidden;margin-bottom:7px}
  .nego-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--color-accent-700),#1e6b4d);transition:width .4s ease}
  .nego-index-scroll{flex:1;overflow-y:auto;padding:12px 12px 60px}
  .nego-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);
    padding:12px 13px;margin-bottom:11px;cursor:pointer;
    transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}
  .nego-card:hover{border-color:var(--color-accent-400)}
  .nego-card.is-active{border-color:var(--color-accent-700);box-shadow:0 0 0 2px rgba(65,97,128,.25),var(--shadow-md);transform:translateY(-1px)}
  .nego-id{font-family:var(--font-mono);font-size:10px;font-weight:700;background:var(--color-accent-100);
    color:var(--color-accent-700);border:1.5px solid var(--color-accent-700);border-radius:999px;padding:1px 8px}
  .nego-st{margin-left:auto;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;border-radius:5px;padding:2px 7px}
  .nego-st.pending{background:#fbf4e3;color:#7d5a14}
  .nego-st.accepted{background:#d9eae0;color:#1e6b4d}
  .nego-st.rejected{background:#f1dcd8;color:#8f322b}
  .nego-st.verified{background:var(--color-accent-100);color:var(--color-accent-700)}
  .nego-hash{font-family:var(--font-mono);font-size:9.5px;color:var(--color-accent-700);background:var(--color-accent-100);
    border:1px solid var(--color-accent-300);border-radius:5px;padding:4px 7px;margin-bottom:9px;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nego-acts{display:flex;gap:6px}
  .nego-acts button{flex:1;border-radius:5px;padding:6px 0;font:inherit;font-size:11.5px;font-weight:700;
    border:1.5px solid transparent;background:var(--color-surface);cursor:pointer;transition:all .12s ease}
  .nego-acts .b-acc{border-color:#1e6b4d;color:#1e6b4d}
  .nego-acts .b-acc:hover{background:#1e6b4d;color:#fff}
  .nego-acts .b-rej{border-color:#b0453c;color:#b0453c}
  .nego-acts .b-rej:hover{background:#b0453c;color:#fff}
  .nego-acts .b-dis{border-color:var(--color-divider);color:var(--color-accent-700)}
  .nego-acts .b-dis:hover{background:var(--color-accent-100)}
  .nego-acts .b-dis.has-thread{border-color:var(--color-accent-700)}
  .nego-acts .b-undo{border-color:var(--color-divider);color:var(--color-neutral-600);flex:0 0 auto;padding:6px 12px}
  .nego-acts .b-undo:hover{background:var(--color-neutral-100)}
  .nego-bulk{display:flex;gap:8px;margin-top:10px}
  .nego-bulk button{flex:1;border:0;border-radius:5px;padding:7px 0;font:inherit;font-size:12px;font-weight:700;color:#fff;cursor:pointer;transition:filter .12s ease}
  .nego-bulk .b-acc{background:#1e6b4d}
  .nego-bulk .b-rej{background:#b0453c}
  .nego-bulk button:hover{filter:brightness(1.08)}
  .nego-bulk button:disabled{opacity:.45;cursor:not-allowed;filter:none}

  /* Threads on a fingerprint. */
  .nego-thread{margin-top:10px;border-top:1px dashed var(--color-divider);padding-top:10px;display:none}
  .nego-thread.open{display:block}
  .nego-tlabel{font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:7px}
  .nego-compose{display:flex;gap:6px;margin-top:8px}
  .nego-compose input{flex:1;min-width:0;border:1px solid var(--color-divider);border-radius:5px;padding:6px 9px;
    font:inherit;font-size:11.5px;background:var(--color-surface);outline:none}
  .nego-compose button{background:var(--color-accent-800);color:#fff;border:0;border-radius:5px;padding:0 12px;
    font:inherit;font-size:11.5px;font-weight:700;cursor:pointer}
  .nego-compose button:hover{filter:brightness(1.12)}

  /* The status strip. In the prototype this is a viewport-fixed footer; here it
     is an in-tab strip, because the workspace owns the bottom of the window. */
  .nego-status{flex:none;display:flex;align-items:center;gap:0;background:var(--color-accent-900);color:#c6d2de;
    font-size:11px;padding:0 14px;height:30px;border-radius:0 0 6px 6px;overflow-x:auto}
  .nego-status .seg{display:flex;align-items:center;gap:6px;padding:0 14px;border-right:1px solid rgba(255,255,255,.12);white-space:nowrap}
  .nego-status .seg:first-child{padding-left:0}
  .nego-status .seg:last-of-type{border-right:none}
  .nego-status .dot{width:7px;height:7px;border-radius:50%;flex:none}
  .nego-status .dot.warn{background:#e2a33c}
  .nego-status .dot.ok{background:#4caf7d}
  .nego-status .spacer{margin-left:auto}

  /* Responsive, per the prototype: the baseline pane is the first thing to go,
     then the index becomes a drawer. */
  @media (max-width:1120px){
    .nego-work{grid-template-columns:1fr 320px}
    .nego-pane.baseline{display:none}
  }
  @media (max-width:760px){
    .nego-work{grid-template-columns:1fr;position:relative}
    .nego-pane.index{position:absolute;right:0;top:0;bottom:0;width:min(88vw,335px);z-index:6;
      box-shadow:var(--shadow-lg);transform:translateX(105%);transition:transform .25s ease;background:var(--color-bg)}
    .nego-pane.index.open{transform:translateX(0)}
    #nego-drawer{display:grid !important}
  }
  #nego-drawer{display:none;position:absolute;right:14px;bottom:44px;z-index:7;width:46px;height:46px;
    border-radius:50%;place-items:center;background:var(--color-accent-800);color:#fff;border:0;
    font:inherit;font-size:11px;font-weight:800;box-shadow:var(--shadow-lg);cursor:pointer}

  @media (prefers-reduced-motion:reduce){
    .nego-scroll,.nego-index-scroll{scroll-behavior:auto}
    #nego-root *{transition:none !important;animation:none !important}
  }
</style>`;
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
function negoDocHtml(c, opts){
  const side = opts.side || 'owner';
  const baseline = !!opts.baseline;
  const base = negoBaseText(c);
  const clauses = negoClausesOf(base);
  const changes = negoChanges(c).filter(x => x.status !== 'superseded');
  const byClause = new Map();
  for (const ch of changes) byClause.set(ch.clauseId, ch);

  const title = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name)
    || c.name || 'Contract';
  const meta = [c.counterparty ? `Between ${(window.FIRST_PARTY || 'this workspace')} and ${c.counterparty}` : null,
    c.id, baseline ? 'Baseline · the wording this round is measured against'
      : `Round ${negoRound(c)} · proposed redline`].filter(Boolean).join(' · ');

  const body = clauses.map(cl => {
    const ch = byClause.get(cl.id);
    const label = negoClauseLabel(cl);
    if (baseline || !ch)
      return `<div class="nego-clause" id="${baseline ? 'nb' : 'nw'}-${negoDomId(cl.id)}" data-clause="${_ne(cl.id)}">
        ${label ? `<h2>${_ne(label)}</h2>` : ''}<p>${_ne(cl.text)}</p></div>`;

    let inner, badgeCls = '', badgeSuffix = '', note = '';
    if (ch.status === 'pending'){
      inner = ch.type === 'insert' ? `<span class="nego-ins">${_ne(ch.newText)}</span>`
        : ch.type === 'delete' ? `<span class="nego-del">${_ne(ch.oldText)}</span>`
        : negoDiffHtml(ch.oldText, ch.newText);
    } else if (ch.status === 'accepted'){
      inner = ch.type === 'delete'
        ? `<span class="nego-del">${_ne(ch.oldText)}</span>`
        : `<span class="nego-resolved" data-fade>${_ne(ch.newText)}</span>`;
      badgeCls = 'is-accepted'; badgeSuffix = ' ✓';
      note = `<span class="nego-note ok">Accepted</span>`;
    } else {
      inner = _ne(cl.text);                          // the baseline, verbatim
      badgeCls = 'is-rejected'; badgeSuffix = ' ✕';
      note = `<span class="nego-note no">Rejected — baseline kept</span>`;
    }
    const active = _negoActive === ch.id;
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="nw-${negoDomId(cl.id)}" data-clause="${_ne(cl.id)}" data-change="${_ne(ch.id)}">
      <button class="nego-badge${active && !badgeCls ? ' is-active' : ''}${badgeCls ? ' ' + badgeCls : ''}"
        data-badge="${_ne(ch.id)}" aria-label="Change ${_ne(ch.id)}, ${_ne(ch.status)}">#${_ne(ch.id)}${badgeSuffix}</button>
      ${label ? `<h2>${_ne(label)}${note}</h2>` : note}<p>${inner}</p></div>`;
  }).join('');

  /* An INSERT names a clause the baseline never had, so it has no row to sit in
     and is shown after the document rather than wedged into it. Guessing a
     position would be inventing structure neither party wrote. */
  const inserts = baseline ? '' : changes.filter(ch => ch.type === 'insert' && !clauses.some(cl => cl.id === ch.clauseId))
    .map(ch => {
      const active = _negoActive === ch.id;
      const cls = ch.status === 'accepted' ? 'is-accepted' : ch.status === 'rejected' ? 'is-rejected' : (active ? 'is-active' : '');
      const sfx = ch.status === 'accepted' ? ' ✓' : ch.status === 'rejected' ? ' ✕' : '';
      const inner = ch.status === 'rejected'
        ? `<span class="nego-del">${_ne(ch.newText)}</span>`
        : ch.status === 'accepted' ? `<span class="nego-resolved" data-fade>${_ne(ch.newText)}</span>`
        : `<span class="nego-ins">${_ne(ch.newText)}</span>`;
      const note = ch.status === 'accepted' ? `<span class="nego-note ok">Accepted</span>`
        : ch.status === 'rejected' ? `<span class="nego-note no">Rejected — not added</span>` : '';
      return `<div class="nego-clause${active ? ' is-active' : ''}" id="nw-${negoDomId(ch.clauseId)}" data-clause="${_ne(ch.clauseId)}" data-change="${_ne(ch.id)}">
        <button class="nego-badge${cls ? ' ' + cls : ''}" data-badge="${_ne(ch.id)}"
          aria-label="New clause ${_ne(ch.id)}, ${_ne(ch.status)}">#${_ne(ch.id)}${sfx}</button>
        <h2>${_ne(ch.clauseLabel || 'New clause')}${note}</h2><p>${inner}</p></div>`;
    }).join('');

  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne(meta)}</div>
    ${body || `<p style="color:var(--color-doc-muted)">This contract has no wording yet.</p>`}
    ${inserts}
  </article>`;
}

/* ---------- the change index ---------- */
function negoCardsHtml(c, opts){
  const side = opts.side || 'owner';
  const canAct = opts.readonly ? false : true;
  const changes = negoChanges(c).filter(x => x.status !== 'superseded');
  if (!changes.length) return `
    <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--color-neutral-600)">
      <b style="display:block;color:var(--color-neutral-800);margin-bottom:4px">No changes on the table.</b>
      ${side === 'counterparty'
        ? 'Nothing has been proposed for this round yet. Propose wording and each change you make becomes a fingerprint on this list.'
        : 'Nothing has been proposed for this round yet. When the counterparty proposes wording, each change arrives here with its own fingerprint.'}
    </div>`;

  return changes.map(ch => {
    const active = _negoActive === ch.id;
    const open = _negoThreads[ch.id];
    const n = (ch.thread || []).length;
    /* A side may decide the OTHER side's proposals. Nobody rules on their own
       ask: it would let one party mark their own wording adopted and tell the
       other it was agreed. They can still discuss it, and withdraw it by
       proposing something else. */
    const mine = ch.authorSide === side;
    const decidable = canAct && !mine && ch.status === 'pending';
    const undoable = canAct && !mine && ch.status !== 'pending';

    const thread = `
      <div class="nego-thread${open ? ' open' : ''}" id="nego-thread-${_ne(ch.id)}">
        <div class="nego-tlabel">Discussion on #${_ne(ch.id)} — no formal round re-draft</div>
        ${n ? (ch.thread || []).map(m => (window.discussBubbleHtml
            ? discussBubbleHtml({ author: m.who, at: m.at, body: m.text, side: m.side }, side)
            : `<div style="font-size:11.5px;margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`)).join('')
          : `<div style="font-size:11px;color:var(--color-neutral-600);margin-bottom:8px">No comments yet — start the thread. It stays attached to this fingerprint.</div>`}
        ${canAct ? `<div class="nego-compose">
          <input type="text" id="nego-ti-${_ne(ch.id)}" placeholder="Reply on this change…" aria-label="Reply on change ${_ne(ch.id)}"/>
          <button data-nego-send="${_ne(ch.id)}">Send</button>
        </div>` : ''}
      </div>`;

    const acts = decidable ? `
      <div class="nego-acts">
        <button class="b-acc" data-nego-accept="${_ne(ch.id)}">Accept</button>
        <button class="b-rej" data-nego-reject="${_ne(ch.id)}">Reject</button>
        <button class="b-dis${n ? ' has-thread' : ''}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
      </div>`
      : `<div class="nego-acts">
        <button class="b-dis${n ? ' has-thread' : ''}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
        ${undoable ? `<button class="b-undo" data-nego-undo="${_ne(ch.id)}">Undo</button>` : ''}
      </div>`;

    return `
      <div class="nego-card${active ? ' is-active' : ''}" id="nego-card-${_ne(ch.id)}" data-nego-card="${_ne(ch.id)}"
           role="button" tabindex="0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-id">#${_ne(ch.id)}</span>
          <span class="nego-st verified" title="Fingerprinted with a SHA-256 digest over this change's substance">Verified</span>
          <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
        </div>
        <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
        <div style="font-size:11px;color:var(--color-neutral-600);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
        <div style="font-size:11px;color:var(--color-neutral-600);margin-bottom:7px">Author: <b style="color:var(--color-neutral-900);font-weight:600">${_ne(ch.author)}</b>${mine ? ' <span style="font-style:italic">(your side)</span>' : ''}</div>
        ${ch.note ? `<div style="border-left:2px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
          <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-accent-800)">Why they asked</span>
          <span style="font-size:11.5px;line-height:1.5;color:var(--color-neutral-800)">${_ne(ch.note)}</span></div>` : ''}
        ${ch.reply ? `<div style="border-left:2px solid var(--color-divider);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--color-neutral-800)"><b>Reply:</b> ${_ne(ch.reply)}</div>` : ''}
        <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
        ${acts}${thread}
      </div>`;
  }).join('');
}

/* ---------- the status strip ----------
   Every field is read from the product rather than typed in: emailOff() and
   counterpartySeenState() already own their answers elsewhere in the app, and a
   strip that agreed with them only by coincidence would be worse than none. */
function negoStatusHtml(c, opts){
  const p = negoProgress(c);
  const seen = (window.counterpartySeenState ? counterpartySeenState(c, opts.shares || []) : null);
  const off = !!(window.emailOff && window.emailOff());
  const seenLine = seen
    ? (seen.kind === 'responded' ? 'Counterparty: responded'
      : seen.kind === 'opened' ? 'Last seen: opened the current wording'
      : 'Last seen: not opened yet')
    : 'Last seen: not shared yet';
  return `
    <div class="nego-status" id="nego-status">
      <div class="seg"><span class="dot ${off ? 'warn' : 'ok'}"></span>Email: ${off ? 'Not Configured' : 'Configured'}${off ? ' <span style="opacity:.65">(Sharing limits apply)</span>' : ''}</div>
      <div class="seg"><span class="dot ${seen && seen.kind !== 'unopened' ? 'ok' : 'warn'}"></span>${_ne(seenLine)}</div>
      <div class="seg">Negotiation: Round ${p.total ? negoRound(c) : negoRound(c)}</div>
      <div class="seg" id="nego-resolved">Resolved: ${p.done} / ${p.total}</div>
      <span class="spacer"></span>
      <span class="seg" style="font-family:var(--font-mono);font-size:9.5px;opacity:.6">${_ne(String(opts.side === 'counterparty' ? 'counterparty view' : 'owner view'))} · fingerprinted redline</span>
    </div>`;
}

/* ---------- the header strip ----------
   Only the contract-specific actions from the prototype's top bar. Brand,
   breadcrumbs and avatar are page chrome the workspace (or the portal) already
   provides, and repeating them would put two headers on one screen. */
function negoHeadHtml(c, opts){
  const p = negoProgress(c);
  const ready = negoReadyToSign(c);
  const canAct = !opts.readonly;
  const side = opts.side || 'owner';
  return `
    <div style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;
      background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm)">
      <span style="font-size:12.5px;font-weight:700;color:var(--color-neutral-900)">Negotiation</span>
      <span class="nego-ver">Round ${negoRound(c)}</span>
      <span style="font-size:11.5px;color:var(--color-neutral-600);min-width:0;flex:1">
        ${p.total
          ? `${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved — every change carries its own fingerprint.`
          : 'No changes on the table yet. Propose wording and each change becomes a fingerprint on this list.'}
      </span>
      ${canAct && p.pending ? `
        <button id="nego-all-acc" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#1e6b4d;color:#1e6b4d">Accept all</button>
        <button id="nego-all-rej" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#b0453c;color:#b0453c">Reject all</button>` : ''}
      ${side === 'owner' ? `<button id="nego-export" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px"
        title="${p.pending ? 'Pending changes must be resolved first' : 'Export the agreed wording'}"${p.pending ? ' disabled' : ''}>Export clean PDF</button>` : ''}
      ${canAct ? `<button id="nego-propose" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px">Propose edits</button>` : ''}
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
  return `
    <div id="nego-ready" style="flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
      border:1px solid #a8cbb8;background:#eef7f1;border-left:4px solid #1e6b4d;border-radius:6px;
      padding:12px 16px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#14503a">Ready to sign — every change is resolved</span>
        <span style="display:block;font-size:11.5px;color:var(--color-neutral-700);margin-top:1px">All ${p.total} change${p.total === 1 ? '' : 's'} on the table ${p.total === 1 ? 'has' : 'have'} an answer${accepted ? ` · ${accepted} adopted into the wording` : ''}. Nothing is outstanding between the parties.</span>
      </span>
      ${side === 'owner'
        ? `<button id="nego-to-docs" class="ui-btn ui-btn-primary" style="flex:none;font-size:12px;padding:7px 14px">Send to Docs tab for signature</button>`
        : `<span style="flex:none;font-size:11.5px;color:var(--color-neutral-700)">${_ne((window.FIRST_PARTY || 'The other side'))} will send it for signature.</span>`}
    </div>`;
}

/* ---------- the whole tab ---------- */
function negoTabHtml(c, opts = {}){
  const side = opts.side || 'owner';
  const p = negoProgress(c);
  const canAct = !opts.readonly;
  negoInit(c);
  return `${_negoStyled ? '' : negoStyleHtml()}
  <div id="nego-root" style="display:flex;flex-direction:column;gap:10px;height:100%;min-height:0">
    ${negoHeadHtml(c, opts)}
    <div style="flex:1;min-height:0;display:flex;flex-direction:column">
      <div class="nego-work">

        <section class="nego-pane baseline" aria-label="Baseline wording, read-only">
          <div class="nego-pane-head">Baseline <span class="nego-ver">v${Math.max(0, negoRound(c) - 1)}</span><span class="nego-sub">read-only reference</span></div>
          <div class="nego-scroll" id="nego-scroll-base">${negoDocHtml(c, { ...opts, baseline: true })}</div>
        </section>

        <section class="nego-pane working" aria-label="Working wording with the proposed redline">
          <div class="nego-pane-head">Working <span class="nego-ver">v${negoRound(c)}</span><span class="nego-sub">— proposed redline · fingerprints anchor in the margin</span></div>
          <div class="nego-scroll" id="nego-scroll-work">${negoDocHtml(c, { ...opts, baseline: false })}</div>
        </section>

        <aside class="nego-pane index" id="nego-index" aria-label="Fingerprinted change index">
          <div class="nego-index-head">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px">
              <h3 style="font-size:12.5px;font-weight:800;margin:0">Fingerprinted Change Index</h3>
              <span class="nego-count" id="nego-count">${p.pending || p.total}</span>
            </div>
            <div class="nego-track"><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
            <div style="font-size:11px;color:var(--color-neutral-600)" id="nego-progress">${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved</div>
            ${canAct ? `<div class="nego-bulk">
              <button class="b-acc" id="nego-bulk-acc"${p.pending ? '' : ' disabled'}>Accept All</button>
              <button class="b-rej" id="nego-bulk-rej"${p.pending ? '' : ' disabled'}>Reject All</button>
            </div>` : ''}
          </div>
          <div class="nego-index-scroll" id="nego-cards">${negoCardsHtml(c, opts)}</div>
        </aside>

        <button id="nego-drawer" aria-label="Toggle the change index">CHG</button>
      </div>
      ${negoStatusHtml(c, opts)}
    </div>
  </div>`;
}

/* ---------- rendering + wiring ----------
   One render path, called after every state change, so the three panes can
   never disagree about a change's status. Cheap enough to do wholesale: the
   document is a page, not a feed. */
function renderNegotiationTab(c, opts = {}){
  const host = document.getElementById(opts.hostId || 'nego-tab');
  if (!host) return;
  host.innerHTML = negoTabHtml(c, opts);
  _negoStyled = true;
  wireNegotiationTab(c, opts);
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
  const root = document.getElementById('nego-root');
  if (!root) return;

  root.querySelectorAll('.nego-clause').forEach(n => n.classList.remove('is-active', 'flash'));
  root.querySelectorAll('.nego-badge').forEach(n => n.classList.remove('is-active'));
  root.querySelectorAll('.nego-card').forEach(n => n.classList.remove('is-active'));

  const base = document.getElementById('nb-' + negoDomId(ch.clauseId));
  if (base){
    base.classList.add('is-active', 'flash');
    if (base.scrollIntoView) base.scrollIntoView({ block: 'center' });
  }
  const work = document.getElementById('nw-' + negoDomId(ch.clauseId));
  if (work){
    work.classList.add('is-active', 'flash');
    if (source !== 'clause' && work.scrollIntoView) work.scrollIntoView({ block: 'center' });
  }
  const badge = root.querySelector(`[data-badge="${ch.id}"]`);
  if (badge && ch.status === 'pending') badge.classList.add('is-active');
  const card = document.getElementById('nego-card-' + ch.id);
  if (card){
    card.classList.add('is-active');
    if (source !== 'card' && card.scrollIntoView) card.scrollIntoView({ block: 'nearest' });
  }
}

function wireNegotiationTab(c, opts = {}){
  const side = opts.side || 'owner';
  const host = document.getElementById(opts.hostId || 'nego-tab');
  if (!host) return;
  const again = () => {
    if (opts.onChange) opts.onChange(c);
    renderNegotiationTab(c, opts);
  };
  const decide = (id, status, extra) => {
    const ch = negoResolve(c, id, status, { side, by: opts.by, ...(extra || {}) });
    if (!ch) return;
    _negoActive = id;
    if (opts.persist !== false && window.persist) persist(c);
    if (window.toast){
      if (status === 'accepted') toast(`#${id} accepted — merged into the clean text · ${negoShortHash(ch.hash)} filed to the audit trail`);
      else if (status === 'rejected') toast(`#${id} rejected — the clause reverts to the baseline and the ask travels back as an open point`);
      else toast(`#${id} reopened — back to pending`);
    }
    again();
  };

  host.querySelectorAll('[data-badge]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    negoFocus(c, b.getAttribute('data-badge'), 'badge');
  }));
  host.querySelectorAll('[data-nego-card]').forEach(card => {
    const id = card.getAttribute('data-nego-card');
    card.addEventListener('click', () => negoFocus(c, id, 'card'));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); negoFocus(c, id, 'card'); } });
  });
  host.querySelectorAll('.nego-clause[data-change]').forEach(n => n.addEventListener('click', () =>
    negoFocus(c, n.getAttribute('data-change'), 'clause')));

  host.querySelectorAll('[data-nego-accept]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); decide(b.getAttribute('data-nego-accept'), 'accepted'); }));
  host.querySelectorAll('[data-nego-undo]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); decide(b.getAttribute('data-nego-undo'), 'pending'); }));
  host.querySelectorAll('[data-nego-reject]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    /* A refusal the other side cannot understand is a refusal they will send
       again. Ask for the reason here, while it is fresh — the same judgement
       renderNegotiationSection already makes for a whole round. */
    let why = '';
    if (window.promptDialog){
      why = await promptDialog({ title: 'Why are you turning this change down?',
        message: 'This travels back with your decision, so they know what to do next. Leave it blank to reject without a reason.',
        label: 'Reply to ' + (side === 'owner' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'the other side')),
        placeholder: 'e.g. Net-30 stands, or we can look at a 2% price increase.',
        confirmLabel: 'Reject change' });
      if (why == null) return;                    // cancelled — the change stays pending
    }
    decide(b.getAttribute('data-nego-reject'), 'rejected', { reply: why });
  }));

  host.querySelectorAll('[data-nego-discuss]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const id = b.getAttribute('data-nego-discuss');
    _negoThreads[id] = !_negoThreads[id];
    _negoActive = id;
    again();
    const inp = document.getElementById('nego-ti-' + id);
    if (inp && inp.focus) inp.focus();
  }));
  host.querySelectorAll('[data-nego-send]').forEach(b => {
    const id = b.getAttribute('data-nego-send');
    const send = () => {
      const inp = document.getElementById('nego-ti-' + id);
      const text = inp ? String(inp.value || '').trim() : '';
      if (!text){ if (window.toast) toast('Write your reply first', 'err'); return; }
      negoPostComment(c, id, text, { side, author: opts.author });
      _negoThreads[id] = true;
      _negoActive = id;
      if (opts.persist !== false && window.persist) persist(c);
      if (window.toast) toast(`Comment posted on #${id} — the contract is unchanged and no round was opened`);
      again();
      const back = document.getElementById('nego-ti-' + id);
      if (back && back.focus) back.focus();
    };
    b.addEventListener('click', e => { e.stopPropagation(); send(); });
    const inp = document.getElementById('nego-ti-' + id);
    if (inp){
      inp.addEventListener('click', e => e.stopPropagation());
      inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); send(); } });
    }
  });

  const bulk = status => {
    const done = negoResolveAll(c, status, { side, by: opts.by });
    if (!done.length){ if (window.toast) toast('Nothing pending — every change is already resolved'); return; }
    if (opts.persist !== false && window.persist) persist(c);
    if (window.toast) toast(status === 'accepted'
      ? `${done.length} change${done.length === 1 ? '' : 's'} accepted — the redlines are merged into the clean text`
      : `${done.length} change${done.length === 1 ? '' : 's'} rejected — those clauses revert to the baseline`);
    again();
  };
  ['nego-bulk-acc', 'nego-all-acc'].forEach(id => document.getElementById(id)?.addEventListener('click', () => bulk('accepted')));
  ['nego-bulk-rej', 'nego-all-rej'].forEach(id => document.getElementById(id)?.addEventListener('click', () => bulk('rejected')));

  document.getElementById('nego-drawer')?.addEventListener('click', () =>
    document.getElementById('nego-index')?.classList.toggle('open'));

  document.getElementById('nego-export')?.addEventListener('click', () => {
    if (negoProgress(c).pending){ if (window.toast) toast('Pending changes must be resolved before a clean export', 'err'); return; }
    if (window.exportContractPdf) exportContractPdf(c);
    else if (window.toast) toast('Export is unavailable on this page', 'err');
  });
  document.getElementById('nego-propose')?.addEventListener('click', () => {
    if (opts.onPropose) opts.onPropose(c);
    else if (window.toast) toast('Proposing edits is not available on this screen', 'err');
  });
  /* The hand-off. It closes the round — making the agreed wording the baseline
     — and moves the reader to the tab that owns signing. It does NOT sign, and
     deliberately builds none of that flow. */
  document.getElementById('nego-to-docs')?.addEventListener('click', () => {
    if (opts.onReadyToSign){ opts.onReadyToSign(c); return; }
    negoAdvanceRound(c, { by: opts.by });
    if (window.persist) persist(c);
    if (window.toast) toast('Agreed wording carried to the Docs tab — sign it there when you are ready');
    if (window.renderWorkspace) renderWorkspace();
  });
}

/* Reset the reader's place. Called when a different contract opens, so the tab
   does not come up focused on a fingerprint from another agreement. */
function negoResetView(){ _negoActive = null; _negoThreads = {}; }

if (typeof window !== 'undefined') Object.assign(window, {
  negoStyleHtml, negoDocHtml, negoCardsHtml, negoStatusHtml, negoHeadHtml, negoReadyHtml,
  negoTabHtml, renderNegotiationTab, wireNegotiationTab, negoFocus, negoResetView, negoDomId });
