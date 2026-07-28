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
// The room adopts prototype.html's own visual language, not HaTi's: Georgia on
// paper for the documents, the slate #33475c bar, the cool #f2f4f7 canvas. That
// reverses an earlier reading of the brief, which took "match HaTi's real
// tokens where they genuinely conflict" as licence to restyle the whole screen
// — see BUGLOG D3, rewritten to record the decision.
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
function negoStyleHtml(){
  return `
<style id="nego-style">
  /* ---- the prototype's own tokens, SCOPED ----
     prototype.html declares these on :root. Here they are declared on the room
     and on the embedded root instead, which is the whole difference between
     adopting a look and imposing one: inside the negotiation everything reads
     exactly as the prototype draws it, and not one rule escapes to the rest of
     HaTi. Prefixed --n-* so a generic name like --line can never be confused
     with a token belonging to the app around it. */
  .nego-room, #nego-root{
    --n-slate:#33475c; --n-slate-deep:#26374a; --n-slate-soft:#456a8f;
    --n-badge-bg:#eef2f6;
    --n-ins-bg:#e4f1ea; --n-ins-fg:#1e6b4d;
    --n-del-bg:#f9ecea; --n-del-fg:#b0453c;
    --n-paper:#ffffff; --n-canvas:#f2f4f7; --n-line:#e3e8ee;
    --n-ink:#2b3440; --n-ink-soft:#66707d;
    --n-accept:#1e6b4d; --n-reject:#b0453c; --n-focus:#456a8f;
    --n-font-ui:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
    --n-font-doc:Georgia,"Times New Roman",Times,serif;
    --n-font-mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
    --n-r-sm:6px; --n-r-md:10px; --n-r-lg:14px;
    --n-shadow-card:0 1px 2px rgba(38,55,74,.06),0 4px 14px rgba(38,55,74,.07);
    --n-shadow-pop:0 8px 30px rgba(38,55,74,.18);
  }
  .nego-room *, #nego-root *{box-sizing:border-box}
  .nego-room button:focus-visible, #nego-root button:focus-visible,
  .nego-room [tabindex]:focus-visible, #nego-root [tabindex]:focus-visible{
    outline:2px solid var(--n-focus);outline-offset:2px}

  /* ---- the room ----
     A mode, not a panel. It owns the viewport so both documents are read at
     full height, which is the entire reason it exists. */
  .nego-room{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;overflow:hidden;
    background:var(--n-canvas);color:var(--n-ink);
    font-family:var(--n-font-ui);font-size:14px;line-height:1.55}

  .nego-topbar{background:var(--n-slate);color:#fff;display:flex;align-items:center;gap:16px;
    padding:0 18px;height:52px;flex:0 0 auto}
  .nego-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:.2px;flex:none}
  .nego-brand .mark{width:26px;height:26px;border-radius:7px;
    background:linear-gradient(135deg,#4d6d8f,#33475c 65%);border:1px solid rgba(255,255,255,.25);
    display:grid;place-items:center;font-size:12px;font-weight:800}
  .nego-brand small{font-weight:400;opacity:.75;font-size:11.5px;margin-left:2px}
  .nego-crumbs{display:flex;align-items:center;gap:8px;font-size:12.5px;color:rgba(255,255,255,.82);min-width:0}
  /* The way out. The prototype's "Doc" breadcrumb chip IS the exit, because it
     already reads as where you came from — a second control saying the same
     thing would be furniture. Esc does it too. */
  .nego-exit{display:inline-flex;align-items:center;gap:6px;flex:none;
    background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);color:#fff;
    border-radius:6px;padding:4px 11px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;
    transition:background .12s ease}
  .nego-exit:hover{background:rgba(255,255,255,.26)}
  .nego-crumbs .sep{opacity:.45;flex:none}
  .nego-crumbs .path{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nego-crumbs .draft-chip{flex:none;border:1px solid rgba(255,255,255,.35);border-radius:99px;
    padding:1px 8px;font-size:10.5px;letter-spacing:.4px;text-transform:uppercase;color:#dfe7ef}
  .nego-top-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none}
  .nego-tbtn{border-radius:7px;padding:6px 13px;font:inherit;font-size:12.5px;font-weight:600;
    border:1px solid transparent;cursor:pointer;transition:filter .12s ease,transform .12s ease}
  .nego-tbtn:active{transform:translateY(1px)}
  .nego-tbtn.ghost{background:transparent;color:#e6ecf2;border-color:rgba(255,255,255,.28)}
  .nego-tbtn.ghost:hover{background:rgba(255,255,255,.1)}
  .nego-tbtn.acc{background:var(--n-accept);color:#fff}
  .nego-tbtn.rej{background:var(--n-reject);color:#fff}
  .nego-tbtn.acc:hover,.nego-tbtn.rej:hover{filter:brightness(1.08)}
  /* A refused control stays ON THE SCREEN and stays legible. Hiding it until it
     works would leave the reader with no idea the step exists, still less what
     they have to do to reach it; .45 opacity on a dark bar is a control you
     cannot read the label of. It is visibly not-pressable, and the line beside
     it says why. */
  .nego-tbtn:disabled{opacity:1;cursor:not-allowed;filter:none;background:transparent;
    color:rgba(230,236,242,.62);border:1px dashed rgba(255,255,255,.34)}
  .nego-why{flex:0 1 auto;max-width:300px;font-size:10.5px;line-height:1.35;color:#c3cfda}
  .nego-readysig{display:flex;align-items:flex-start;gap:11px;flex-wrap:wrap;margin:10px 14px 0;
    border:1px solid #a8cbb8;border-left:4px solid var(--n-accept);background:#eef7f1;
    border-radius:6px;padding:10px 14px}
  .nego-readysig .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-accept);color:#fff;font-size:11px;font-weight:800}
  .nego-readysig .body{flex:1;min-width:220px;font-size:12px;line-height:1.5;color:#14503a}
  .nego-readysig .row{display:block}
  .nego-readysig .row+.row{margin-top:3px;color:var(--n-ink-soft)}
  .nego-readysig .nego-tbtn{flex:none;align-self:center}
  /* A signal the change set has moved past is not good news, and must not be
     dressed as it. Same box, the colour of an open point. */
  .nego-readysig.stale{border-color:#e0c48a;border-left-color:#b8862b;background:#fdf6e7}
  .nego-readysig.stale .tick{background:#b8862b}
  .nego-readysig.stale .body{color:#7d5a14}
  .nego-closed{display:flex;align-items:flex-start;gap:11px;margin:10px 14px 0;border-radius:6px;
    padding:10px 14px;border:1px solid var(--n-line);background:var(--n-badge-bg);
    border-left:4px solid var(--n-slate)}
  .nego-closed[data-state="signed"]{border-color:#a8cbb8;border-left-color:var(--n-accept);background:#eef7f1}
  .nego-closed[data-state="declined"]{border-color:#e3c4bf;border-left-color:var(--n-reject);background:#f9ecea}
  .nego-closed .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-slate);color:#fff;font-size:11px;font-weight:800}
  .nego-closed[data-state="signed"] .tick{background:var(--n-accept)}
  .nego-closed[data-state="declined"] .tick{background:var(--n-reject)}
  .nego-closed .body{flex:1;min-width:220px;font-size:12px;line-height:1.5;color:var(--n-ink)}
  /* Their name, in the room, because the room is their page. */
  .nego-who{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.28);
    border-radius:7px;padding:2px 4px 2px 9px;background:rgba(255,255,255,.06)}
  .nego-who .lbl{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#c3cfda}
  .nego-who input{width:150px;border:0;outline:none;background:transparent;color:#fff;
    font:inherit;font-size:12.5px;padding:5px 6px}
  .nego-who input::placeholder{color:rgba(230,236,242,.55)}
  .nego-avatar{width:28px;height:28px;border-radius:50%;flex:none;
    background:linear-gradient(135deg,#c98f5f,#8a5a3b);border:2px solid rgba(255,255,255,.5);
    display:grid;place-items:center;font-size:11px;font-weight:700;color:#fff}

  /* ---- the workbench ----
     Two documents and an index, with a draggable divider in each gap. The
     column widths are driven by --nego-f (the baseline's share of the document
     space) and --nego-c (the index), both of which the drag writes and
     localStorage remembers. min-width:0 on the grid matters as much as
     min-height:0: a grid whose columns hold a document will not otherwise
     shrink below its content and pushes the index off the screen. */
  .nego-work{flex:1;min-height:0;min-width:0;display:grid;background:var(--n-canvas);
    --nego-f:.46; --nego-c:335px;
    grid-template-columns:
      calc((100% - var(--nego-c) - 12px) * var(--nego-f)) 6px
      calc((100% - var(--nego-c) - 12px) * (1 - var(--nego-f))) 6px
      var(--nego-c)}
  /* Folded away, the index gives its whole width to the documents. */
  .nego-work.idx-off{grid-template-columns:
    calc((100% - 6px) * var(--nego-f)) 6px calc((100% - 6px) * (1 - var(--nego-f)))}
  .nego-work.idx-off .nego-pane.index,.nego-work.idx-off .nego-rz-b{display:none}

  .nego-rz{position:relative;background:var(--n-line);cursor:col-resize;
    display:flex;align-items:center;justify-content:center;touch-action:none;user-select:none}
  .nego-rz::before{content:"";width:2px;height:60px;border-radius:99px;background:#c4cfdb;transition:background .15s ease}
  .nego-rz:hover::before,.nego-rz[data-drag]::before{background:var(--n-slate-soft)}
  .nego-rz[data-drag]{background:#dbe3ec}

  .nego-pane{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--n-canvas)}
  .nego-pane-head{flex:none;display:flex;align-items:center;gap:8px;padding:10px 16px;
    background:var(--n-paper);border-bottom:1px solid var(--n-line);
    font-size:12.5px;font-weight:700;color:var(--n-ink)}
  .nego-ver{font-family:var(--n-font-mono);font-size:10.5px;font-weight:600;
    background:var(--n-badge-bg);color:var(--n-slate-soft);
    border:1px solid #d6e0ea;border-radius:5px;padding:1px 7px;flex:none}
  .nego-sub{font-weight:500;color:var(--n-ink-soft);font-size:11.5px;min-width:0;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nego-fold{margin-left:auto;flex:none;border:1px solid #d6e0ea;background:var(--n-badge-bg);
    color:var(--n-slate-soft);border-radius:5px;padding:2px 8px;font:inherit;font-size:10.5px;
    font-weight:700;cursor:pointer}
  .nego-fold:hover{background:#e3eaf2}
  .nego-scroll{flex:1;overflow-y:auto;padding:22px 20px 90px;scroll-behavior:smooth}

  /* ---- the document ----
     Serif, on paper, at the prototype's measure: a contract should read like a
     contract and not like the application around it. */
  .nego-doc{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:34px 38px 44px;max-width:720px;margin:0 auto;
    font-family:var(--n-font-doc);font-size:14.5px;line-height:1.72;color:#222a33}
  .nego-doc h1{font-size:19px;text-align:center;margin:0 0 6px;letter-spacing:.2px;line-height:1.35;
    font-family:var(--n-font-doc);font-weight:700}
  .nego-doc .nego-meta{text-align:center;font-family:var(--n-font-ui);font-size:11px;
    color:var(--n-ink-soft);margin-bottom:26px;padding-bottom:18px;border-bottom:1px solid var(--n-line)}
  .nego-clause{position:relative;margin-bottom:22px;padding:10px 12px;border-radius:8px;
    transition:background .25s ease,box-shadow .25s ease}
  .nego-clause h2{font-size:14.5px;margin:0 0 5px;font-family:var(--n-font-doc);font-weight:700}
  /* THE LINE BREAKS ARE THE DOCUMENT, and the browser was eating them.

     A clause under negotiation is drawn from richToText's projection, which is
     one line per block — a paragraph, a heading, a numbered party, a WHEREAS
     recital, a list item with its own marker. Those lines are separated by real
     newline characters, and HTML collapses a newline to a space unless it is
     told not to. So the preamble and the recitals — the part of a contract most
     densely made of short lines — arrived as one unbroken run-on blob, and a
     numbered list of parties read as a sentence.

     The projection emits no blank lines (richToText drops empty ones), so
     pre-wrap gives exactly one break where there was one break, and nothing
     doubles up. */
  .nego-clause p{margin:0;white-space:pre-wrap}
  /* ---- a clause with nothing proposed against it reads as the DOCUMENT ----
     Not as a text projection of it. The projection exists to be diffed; it is
     the substance the fingerprints bind and it is right for a clause under
     redline. It is not right for the other twenty clauses on the page, where
     it flattens a numbered sub-list into "1. … 2. …" run together and drops
     every piece of emphasis the drafter put there on purpose.

     Real markup carries its own structure, so pre-wrap is turned back OFF
     inside it: the source HTML's own indentation between tags is not content
     and must not print. */
  .nego-clause .nego-body>*{margin:0 0 9px}
  .nego-clause .nego-body>*:last-child{margin-bottom:0}
  .nego-clause .nego-body p,.nego-clause .nego-body li{white-space:normal}
  .nego-clause .nego-body ol,.nego-clause .nego-body ul{margin:7px 0 9px;padding-left:26px}
  .nego-clause .nego-body li{margin:0 0 5px}
  .nego-clause .nego-body li:last-child{margin-bottom:0}
  .nego-clause .nego-body ol ol,.nego-clause .nego-body ul ul,
  .nego-clause .nego-body ol ul,.nego-clause .nego-body ul ol{margin:5px 0 0}
  .nego-clause .nego-body strong,.nego-clause .nego-body b{font-weight:700}
  .nego-clause .nego-body em,.nego-clause .nego-body i{font-style:italic}
  .nego-clause .nego-body u{text-decoration:underline}
  .nego-clause .nego-body h1,.nego-clause .nego-body h2,.nego-clause .nego-body h3,
  .nego-clause .nego-body h4,.nego-clause .nego-body h5,.nego-clause .nego-body h6{
    font-family:var(--n-font-doc);font-size:14.5px;font-weight:700;margin:12px 0 5px}
  .nego-clause .nego-body table{border-collapse:collapse;width:100%;margin:9px 0;font-size:13px}
  .nego-clause .nego-body td,.nego-clause .nego-body th{
    border:1px solid var(--n-line);padding:5px 8px;text-align:left;vertical-align:top}
  .nego-clause .nego-body th{font-weight:700;background:var(--n-badge-bg)}
  .nego-clause .nego-body pre{white-space:pre;overflow-x:auto;
    font-family:var(--n-font-mono);font-size:12px;line-height:1.5}
  .nego-clause .nego-body blockquote{margin:8px 0 8px 18px;padding-left:12px;
    border-left:2px solid var(--n-line);color:var(--n-ink-soft)}
  .nego-clause.is-active{background:#f3f7fb;box-shadow:0 0 0 2px var(--n-slate-soft)}
  .nego-clause.flash{animation:negoFlash 1.4s ease 1}
  @keyframes negoFlash{
    0%{box-shadow:0 0 0 2px var(--n-slate-soft),0 0 0 8px rgba(69,106,143,.18)}
    100%{box-shadow:0 0 0 2px var(--n-slate-soft),0 0 0 0 rgba(69,106,143,0)}
  }

  /* Redline runs, at the prototype's values. */
  .nego-del{background:var(--n-del-bg);color:var(--n-del-fg);text-decoration:line-through;
    text-decoration-color:var(--n-del-fg);text-decoration-thickness:1.5px;border-radius:3px;padding:0 3px}
  .nego-ins{background:var(--n-ins-bg);color:var(--n-ins-fg);border-bottom:2px solid var(--n-ins-fg);
    border-radius:3px;padding:0 3px;font-weight:600}
  .nego-resolved{background:var(--n-ins-bg);border-radius:3px;padding:0 3px;transition:background 1.2s ease}
  .nego-resolved.nego-faded{background:transparent}

  /* The working pane keeps a GUTTER, because a margin-anchored badge needs
     somewhere to be. Without it the badge lands outside the pane's content box
     and the pane's overflow clips it — "#CHG-012" arrives as "G-012". */
  .nego-pane.working .nego-doc{padding-left:100px}
  .nego-badge{position:absolute;right:calc(100% + 6px);top:10px;
    font-family:var(--n-font-mono);font-size:10px;font-weight:700;letter-spacing:.2px;
    background:var(--n-badge-bg);color:var(--n-slate-soft);
    border:1.5px solid var(--n-slate-soft);border-radius:99px;padding:2px 8px;
    white-space:nowrap;user-select:none;cursor:pointer;
    transition:transform .15s ease,box-shadow .15s ease,background .2s ease,color .2s ease,border-color .2s ease}
  .nego-badge:hover{transform:scale(1.06);box-shadow:var(--n-shadow-card)}
  .nego-badge.is-active{background:var(--n-slate);border-color:var(--n-slate);color:#fff}
  .nego-badge.is-accepted{background:var(--n-ins-bg);border-color:var(--n-ins-fg);color:var(--n-ins-fg)}
  .nego-badge.is-rejected{background:var(--n-del-bg);border-color:var(--n-del-fg);color:var(--n-del-fg)}
  .nego-note{display:inline-block;font-family:var(--n-font-ui);font-size:10.5px;font-weight:700;
    border-radius:5px;padding:1px 7px;margin-left:8px;vertical-align:1px;letter-spacing:.3px}
  .nego-note.ok{background:var(--n-ins-bg);color:var(--n-ins-fg)}
  .nego-note.no{background:var(--n-del-bg);color:var(--n-del-fg)}

  /* ---- the change index ---- */
  .nego-pane.index{background:#fafbfc}
  .nego-index-head{flex:none;padding:12px 16px 10px;background:var(--n-paper);border-bottom:1px solid var(--n-line)}
  .nego-count{font-family:var(--n-font-mono);font-size:10.5px;font-weight:700;
    background:var(--n-slate);color:#fff;border-radius:99px;padding:1px 8px}
  .nego-track{height:5px;background:#e6ebf1;border-radius:99px;overflow:hidden;margin-bottom:7px}
  .nego-fill{height:100%;border-radius:99px;
    background:linear-gradient(90deg,var(--n-slate-soft),var(--n-accept));transition:width .4s ease}
  .nego-index-scroll{flex:1;overflow-y:auto;padding:12px 12px 90px}
  .nego-card{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:12px 13px;margin-bottom:11px;cursor:pointer;
    transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}
  .nego-card:hover{border-color:#c9d5e1}
  .nego-card.is-active{border-color:var(--n-slate-soft);
    box-shadow:0 0 0 2px rgba(69,106,143,.25),var(--n-shadow-pop);transform:translateY(-1px)}
  .nego-id{font-family:var(--n-font-mono);font-size:10px;font-weight:700;
    background:var(--n-badge-bg);color:var(--n-slate-soft);border:1.5px solid var(--n-slate-soft);
    border-radius:99px;padding:1px 8px}
  /* The clause tools. They were in the margin, revealed on hover — which put
     them outside the pane, so the pane clipped them, and made them invisible
     until you happened to point at the right paragraph. They are now the ONLY
     way to propose anything (the whole-document editor is gone), so hiding
     them hid the feature.

     Inside the clause block, top right, always drawn, in the room's own slate.
     Nothing can clip them because nothing extends past the clause any more. */
  /* Their own row, right-aligned, above the heading — NOT floated over it.
     Absolute positioning meant reserving horizontal space in the heading, and a
     463px text column minus 210px of reserved space wrapped "Clause 1 · Scope
     of Services" onto two lines in BOTH panes, including the one that has no
     tools at all. A row costs a little height and collides with nothing. */
  .nego-tools{display:flex;justify-content:flex-end;align-items:center;gap:6px;
    margin-bottom:7px;flex-wrap:wrap}
  /* The status pill lives in this row now, immediately before the verbs. Its
     own margin was written for sitting inside a heading; in a flex row the gap
     is the spacing and the margin would double it. */
  .nego-tools .nego-note{margin-left:0;vertical-align:baseline}
  .nego-tool{font-size:10.5px;font-weight:700;border:1px solid var(--n-slate);
    background:var(--n-slate);color:#fff;border-radius:5px;padding:3px 9px;white-space:nowrap;
    cursor:pointer;font-family:inherit;letter-spacing:.01em;
    box-shadow:0 1px 2px rgba(38,55,74,.18);transition:filter .12s ease}
  .nego-tool:hover,.nego-tool:focus-visible{filter:brightness(1.18)}
  .nego-tool.danger{background:var(--n-del-fg);border-color:var(--n-del-fg)}

  .nego-editing{outline:2px solid var(--n-focus);outline-offset:2px;background:#fff}
  .nego-editing:focus{outline:2px solid var(--n-focus)}
  .nego-edit-bar{display:flex;gap:6px;margin-top:6px}
  .nego-edit-bar button{font-size:11px;font-weight:700;border-radius:5px;padding:4px 10px;
    border:1.5px solid transparent;font-family:inherit;cursor:pointer}
  .nego-edit-bar .b-save{background:var(--n-accept);color:#fff}
  .nego-edit-bar .b-cancel{background:#fff;border-color:var(--n-line);color:var(--n-ink-soft)}
  /* The room sits above the application shell, and the shell is where HaTi's
     Copilot panel lives — which is why Ask Copilot could not simply open it.
     Raising the real panel over the room is the whole fix: it stays the app's
     own panel, with its own markup, styles and behaviour, so it looks and works
     in here exactly as it does everywhere else. A lookalike built for this one
     screen would have been a second thing to keep in step. */
  body.nego-room-open #ai-scrim{z-index:65}
  body.nego-room-open #ai-panel{z-index:70}
  .nego-vsel{font:inherit;font-size:12px;font-weight:700;color:var(--n-ink);background:var(--n-paper);
    border:1px solid var(--n-line);border-radius:6px;padding:4px 8px;max-width:min(60%,320px);cursor:pointer}
  .nego-vsel:hover{border-color:var(--n-slate-soft)}
  .nego-cmp-bar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 14px;
    border:1px solid #e0c48a;background:#fdf6e7;border-left:4px solid #b8862b;border-radius:6px;padding:9px 13px}
  .nego-cmp-tag{flex:none;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
    background:#b8862b;color:#fff;border-radius:4px;padding:2px 7px}
  .nego-cmp-txt{flex:1;min-width:220px;font-size:11.5px;line-height:1.5;color:#7d5a14}
  /* Clean read is a HYPOTHETICAL, not history — so it is the room's own slate
     rather than the amber of "you are looking at an old version". Same shape,
     because it is the same kind of thing: a mode, with its way out in it. */
  .nego-cmp-bar.clean{border-color:#c9d5e1;background:var(--n-badge-bg);border-left-color:var(--n-slate)}
  .nego-cmp-bar.clean .nego-cmp-tag{background:var(--n-slate)}
  .nego-cmp-bar.clean .nego-cmp-txt{color:var(--n-ink)}
  .nego-cmp-bar.clean .nego-cmp-exit{border-color:var(--n-slate);background:var(--n-slate)}
  /* The toggle itself, at the end of the working pane's header row. */
  .nego-clean-btn{margin-left:auto;flex:none;border:1px solid var(--n-slate);background:var(--n-paper);
    color:var(--n-slate);border-radius:6px;padding:3px 10px;font:inherit;font-size:10.5px;font-weight:700;
    white-space:nowrap;cursor:pointer;transition:background .12s ease,color .12s ease}
  .nego-clean-btn:hover{background:var(--n-badge-bg)}
  .nego-clean-btn[aria-pressed="true"]{background:var(--n-slate);color:#fff}
  /* On an amber banner a ghost button is white-on-cream and unreadable — the
     way out of a mode has to be the most legible thing in it. */
  .nego-cmp-exit{flex:none;border:1px solid #7d5a14;background:#7d5a14;color:#fff;border-radius:6px;
    padding:6px 13px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
  .nego-cmp-exit:hover{filter:brightness(1.15)}
  .nego-st{margin-left:auto;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;
    border-radius:5px;padding:2px 7px}
  .nego-st.pending{background:#fdf3e3;color:#9a6a1f}
  .nego-st.accepted{background:var(--n-ins-bg);color:var(--n-ins-fg)}
  .nego-st.rejected{background:var(--n-del-bg);color:var(--n-del-fg)}
  .nego-st.verified{background:var(--n-badge-bg);color:var(--n-slate-soft)}
  /* A withdrawn ask sits NEXT TO its status, not instead of it. "rejected ·
     withdrawn" is the whole story: they asked, we said no, they let it go.
     Replacing the status would erase the refusal from the face of the card. */
  .nego-st.withdrawn{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  .nego-st.sent{margin-left:0;background:var(--n-ins-bg);color:var(--n-ins-fg);border:1px solid #a8cbb8}
  /* ---- answered here, and nowhere else yet ----
     Amber, the colour this product already uses for something still open, and
     deliberately louder than the status beside it: the green "accepted" is the
     half of this state a reader already believes. */
  .nego-st.unsent{margin-left:0;background:#fdf6e7;color:#7d5a14;border:1px solid #e0c48a}
  /* And on the card itself, so a held answer is one glance rather than one
     read — an index of five cards shows at once which of them have gone. */
  .nego-card.is-held{border-color:#e0c48a;border-left:3px solid #b8862b;background:#fffdf7}
  .nego-card.is-held .nego-hold{display:flex}
  .nego-hold{display:none;align-items:flex-start;gap:6px;margin-top:9px;
    border-top:1px dashed #e0c48a;padding-top:8px;font-size:10.5px;line-height:1.45;color:#7d5a14}
  .nego-hold b{font-weight:700}
  /* ---- whose ask is this ----
     THE EDGE IS THE ONLY THING THAT CHANGES, and only on your own asks. Cards
     already carry colour for STATE — green accepted, red refused, amber not
     sent — so a second colour system laid over the same surfaces is how a
     screen stops being readable. One edge, one group, one meaning.

     It cannot collide with the amber edge either: "not sent yet" only ever
     lands on a decision made about the OTHER side's ask, because nobody
     decides their own. So no card is ever both. */
  /* ---- THE TWO BUTTONS THAT MOVE THE DEAL ----
     "Send to <them>" hands the turn over; "Send to Docs tab for signature"
     closes the round. Everything else in this room edits, reads or decides
     within it — these two are the only controls that move the negotiation to
     its next state, and they were rendered at the same weight as a ghost
     button beside them.

     Bigger, filled, and given a shadow so they sit ABOVE the surface rather
     than in it. This is the one place on the screen where being loud is
     correct: a reader who cannot find how to send has a contract that goes
     nowhere. */
  .nego-go{font-size:13px;font-weight:600;letter-spacing:.01em;padding:9px 20px;
    border-radius:6px;box-shadow:0 1px 2px rgba(20,42,74,.18),0 2px 8px rgba(20,42,74,.14);
    transition:transform .08s ease,box-shadow .12s ease}
  .nego-go:hover{box-shadow:0 2px 4px rgba(20,42,74,.2),0 4px 14px rgba(20,42,74,.2)}
  .nego-go:active{transform:translateY(1px)}
  .nego-card.is-mine{border-left:3px solid var(--n-mine,#1f3f6e)}
  .nego-whose{margin-left:0;font-size:9.5px;font-weight:700;letter-spacing:.04em;
    border-radius:20px;padding:2px 8px;white-space:nowrap;max-width:170px;
    overflow:hidden;text-overflow:ellipsis;
    background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  .nego-whose.mine{background:#eaf0f8;color:var(--n-mine,#1f3f6e);border-color:#b9cbe4}
  /* ---- the rounds that are over ----
     Set apart from the round in flight without being hidden: a quieter card on
     a tinted ground, folded away behind its own heading. It must never be
     mistaken for something awaiting a decision, and it must never look like
     something that has been thrown away. */
  /* ONE COLOUR MEANS ONE THING. Dark red is "this round is closed" — on the
     rows of the version selector and on the history below it, so a reader who
     learns it in one place has learned it in the other. It is deliberately not
     the red this screen already uses for a REFUSED change (--n-reject): a
     closed round is finished, not rejected, and two reds a shade apart saying
     two different things would be worse than no colour at all. */
  .nego-history{margin-top:18px;border-top:1px solid var(--n-line);padding-top:12px}
  .nego-history-head{font-size:9.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
    color:var(--n-closed,#8c2f28);margin:0 2px 8px}
  .nego-round{margin-bottom:8px;border:1px solid var(--n-line);border-radius:6px;
    background:var(--n-badge-bg);overflow:hidden}
  .nego-round-tog{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;
    background:none;border:0;padding:9px 11px;font:inherit;color:var(--n-closed,#8c2f28)}
  .nego-round-tog:hover{background:rgba(0,0,0,.03)}
  .nego-round-caret{flex:none;font-size:10px}
  .nego-round-name{font-size:12px;font-weight:700}
  .nego-round-count{font-size:10.5px;color:var(--n-ink-soft);margin-left:auto}
  /* The rows of the version selector. Browsers on a computer honour a colour on
     an option; Safari and phones draw the operating system's own menu and will
     ignore it. The "Round 1 -" on the front of every label carries the same
     meaning either way, so nothing is lost where the colour does not land. */
  .nego-vsel option.closed{color:var(--n-closed,#8c2f28)}
  .nego-vsel option.live{color:var(--n-ink)}
  .nego-round-body{display:none;padding:0 9px 9px}
  .nego-round.open .nego-round-body{display:block}
  .nego-round-note{font-size:10.5px;line-height:1.5;color:var(--n-ink-soft);
    padding:2px 2px 9px}
  .nego-card.is-past{cursor:default;background:var(--n-surface,#fff);opacity:.92}
  .nego-card.is-past:hover{border-color:var(--n-line)}
  .nego-st.past{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  .nego-past-thread{margin-top:9px;border-top:1px dashed var(--n-line);padding-top:8px}
  .nego-contested{border-left:2px solid var(--n-reject);background:var(--n-del-bg);border-radius:0 4px 4px 0;
    padding:6px 9px;margin-bottom:8px;font-size:11px;line-height:1.5;color:var(--n-ink)}
  .nego-hash{font-family:var(--n-font-mono);font-size:9.5px;color:var(--n-slate-soft);
    background:var(--n-badge-bg);border:1px solid #dde5ee;border-radius:5px;padding:4px 7px;
    margin-bottom:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nego-acts{display:flex;gap:6px}
  .nego-acts button{flex:1;border-radius:6px;padding:6px 0;font:inherit;font-size:11.5px;font-weight:700;
    border:1.5px solid transparent;background:var(--n-paper);cursor:pointer;transition:all .12s ease}
  .nego-acts .b-acc{border-color:var(--n-accept);color:var(--n-accept)}
  .nego-acts .b-acc:hover{background:var(--n-accept);color:#fff}
  .nego-acts .b-rej{border-color:var(--n-reject);color:var(--n-reject)}
  .nego-acts .b-rej:hover{background:var(--n-reject);color:#fff}
  .nego-acts .b-dis{border-color:#c9d5e1;color:var(--n-slate-soft)}
  .nego-acts .b-dis:hover{background:var(--n-badge-bg)}
  .nego-acts .b-dis.has-thread{border-color:var(--n-slate-soft)}
  /* ---- somebody is waiting on an answer ----
     The count could not say this. "Discuss (2)" reads the same whether the last
     word was theirs an hour ago or yours a moment ago, so a question addressed
     to you sat on a card looking exactly like a settled conversation. Amber is
     the colour this product already uses for an open point, and it stops the
     moment the thread is opened — a light that never goes out is a light people
     stop seeing. */
  .nego-acts .b-dis.has-unread{border-color:#b8862b;color:#7d5a14;background:#fdf6e7;
    animation:negoUnread 1.2s ease-in-out infinite}
  @keyframes negoUnread{
    0%,100%{background:#fdf6e7;box-shadow:0 0 0 0 rgba(184,134,43,0)}
    50%{background:#f7e9c8;box-shadow:0 0 0 3px rgba(184,134,43,.28)}
  }
  .nego-acts .b-undo{border-color:#c9d5e1;color:var(--n-ink-soft);flex:0 0 auto;padding:6px 12px}
  .nego-acts .b-undo:hover{background:#f2f4f7}
  /* Tertiary on purpose. Changing an answer that has already gone to the other
     side is a real thing to be able to do and a rare thing to want, so it reads
     as a link beside the verbs rather than as a third verb among them. */
  .nego-acts .b-redecide{flex:0 0 auto;border:0;background:none;padding:6px 8px;
    color:var(--n-slate-soft);text-decoration:underline;font-weight:600}
  .nego-acts .b-redecide:hover{color:var(--n-slate)}
  .nego-acts .b-wdr{border-color:var(--n-slate-soft);color:var(--n-slate);padding:6px 10px}
  .nego-acts .b-wdr:hover{background:var(--n-slate);color:#fff}
  /* ---- sending decisions, from the index ----
     The send sits with the decisions it sends, under the bulk pair, because
     that is where the decisions are made. It used to be in the top bar next to
     verbs about the whole deal, where it read as a third answer to the deal
     rather than the postbox for the answers already given. */
  .nego-index-send{margin-top:9px;border-top:1px dashed var(--n-line);padding-top:9px}
  .nego-index-send button{width:100%;border:0;border-radius:7px;padding:8px 0;font:inherit;font-size:12px;
    font-weight:700;color:#fff;background:var(--n-slate);cursor:pointer;transition:filter .12s ease}
  .nego-index-send button:hover{filter:brightness(1.12)}
  /* ---- decisions that have not left the browser ----
     Held answers are the one state on this screen with a deadline attached to
     nothing: the reader has decided, the other side has heard none of it, and
     the page looks finished. It pulses between the room's two blues until the
     button is pressed, and there is nothing to switch off afterwards — the
     control it lives on stops being rendered the moment there is nothing held.
     The .nego-pulse class is deliberately UNSCOPED: the counterparty's own
     postbox (#pt-nego-send) sits on their page rather than inside the room, and
     one animation for both is one thing to keep right. */
  .nego-pulse{animation:negoPulseBlue 1.2s ease-in-out infinite}
  @keyframes negoPulseBlue{
    0%,100%{background:#33475c;box-shadow:0 0 0 0 rgba(69,106,143,0)}
    50%{background:#5b83ad;box-shadow:0 0 0 4px rgba(69,106,143,.30)}
  }
  .nego-index-send .why{display:block;font-size:10.5px;line-height:1.45;color:var(--n-ink-soft);margin-top:5px}
  .nego-bulk{display:flex;gap:8px;margin-top:10px}
  .nego-bulk button{flex:1;border:0;border-radius:7px;padding:7px 0;font:inherit;font-size:12px;
    font-weight:700;color:#fff;cursor:pointer;transition:filter .12s ease}
  .nego-bulk .b-acc{background:var(--n-accept)}
  .nego-bulk .b-rej{background:var(--n-reject)}
  .nego-bulk button:hover{filter:brightness(1.08)}
  .nego-bulk button:disabled{opacity:.45;cursor:not-allowed;filter:none}

  /* ---- threads on a fingerprint ---- */
  .nego-thread{margin-top:10px;border-top:1px dashed var(--n-line);padding-top:10px;display:none}
  .nego-thread.open{display:block}
  .nego-thead{display:flex;align-items:center;gap:8px;margin-bottom:7px}
  .nego-tlabel{flex:1;min-width:0;font-size:10px;font-weight:800;letter-spacing:.5px;
    text-transform:uppercase;color:var(--n-ink-soft)}
  /* The way back to a card the size it was, at the top of the thread so a long
     conversation never puts it out of reach. */
  .nego-tmin{flex:none;border:1px solid var(--n-line);background:var(--n-paper);
    color:var(--n-ink-soft);border-radius:5px;padding:2px 9px;font:inherit;font-size:10.5px;
    font-weight:700;cursor:pointer;transition:background .12s ease,color .12s ease}
  .nego-tmin:hover{background:var(--n-badge-bg);color:var(--n-slate)}
  /* A CEILING ON THE CONVERSATION. Without it one change with a dozen replies
     fills the index and pushes every other change on the table off the screen.
     The thread keeps its own scroll; the card keeps its shape. */
  .nego-tbody{max-height:260px;overflow-y:auto;padding-right:2px;
    display:flex;flex-direction:column;gap:6px}
  .nego-compose{display:flex;gap:6px;margin-top:8px}
  .nego-compose input{flex:1;min-width:0;border:1px solid var(--n-line);border-radius:6px;
    padding:6px 9px;font:inherit;font-size:11.5px;background:var(--n-paper);outline:none}
  .nego-compose input:focus{outline:2px solid var(--n-focus);outline-offset:1px;border-color:transparent}
  .nego-compose button{background:var(--n-slate);color:#fff;border:0;border-radius:6px;padding:0 12px;
    font:inherit;font-size:11.5px;font-weight:700;cursor:pointer}
  .nego-compose button:hover{filter:brightness(1.12)}

  /* ---- the status bar ---- */
  .nego-status{flex:none;display:flex;align-items:center;gap:0;background:var(--n-slate-deep);
    color:#c6d2de;font-size:11px;padding:0 16px;height:30px;overflow-x:auto}
  .nego-status .seg{display:flex;align-items:center;gap:6px;padding:0 14px;
    border-right:1px solid rgba(255,255,255,.12);white-space:nowrap}
  .nego-status .seg:first-child{padding-left:0}
  .nego-status .seg:last-of-type{border-right:none}
  .nego-status .dot{width:7px;height:7px;border-radius:50%;flex:none}
  .nego-status .dot.warn{background:#e2a33c}
  .nego-status .dot.ok{background:#4caf7d}
  .nego-status .spacer{margin-left:auto}

  /* ---- embedded mode ----
     The same panes without the room's chrome, for anywhere that mounts the
     component inside an existing page. */
  #nego-root{display:flex;flex-direction:column;gap:10px;height:100%;min-height:0;
    flex:1;width:100%;min-width:0;background:var(--n-canvas);
    font-family:var(--n-font-ui);color:var(--n-ink)}
  #nego-root .nego-work{border:1px solid var(--n-line);border-radius:var(--n-r-md);overflow:hidden}

  /* ---- responsive ----
     The baseline pane is the first thing to go, then the index becomes a
     drawer — the prototype's order, and the right one: the working copy and
     the decisions matter more than the reference. */
  @media (max-width:1120px){
    .nego-work{grid-template-columns:
      calc(100% - var(--nego-c) - 6px) 6px var(--nego-c)}
    .nego-work.idx-off{grid-template-columns:100%}
    .nego-pane.baseline,.nego-rz-a{display:none}
  }
  /* Below the gutter's worth of width the badge stops being margin-anchored and
     sits above its clause instead: same fingerprint, no longer in a margin
     there is no room for. */
  @media (max-width:900px){
    .nego-pane.working .nego-doc{padding-left:38px}
    .nego-badge{position:static;display:inline-block;margin:0 0 6px}
  }
  @media (max-width:760px){
    .nego-work{grid-template-columns:100%;position:relative}
    .nego-rz{display:none}
    .nego-pane.index{position:absolute;right:0;top:0;bottom:0;width:min(88vw,335px);z-index:6;
      box-shadow:var(--n-shadow-pop);transform:translateX(105%);transition:transform .25s ease}
    .nego-pane.index.open{transform:translateX(0)}
    #nego-drawer{display:grid !important}
    .nego-crumbs .path{display:none}
  }
  #nego-drawer{display:none;position:absolute;right:14px;bottom:44px;z-index:7;width:46px;height:46px;
    border-radius:50%;place-items:center;background:var(--n-slate);color:#fff;border:0;
    font:inherit;font-size:11px;font-weight:800;box-shadow:var(--n-shadow-pop);cursor:pointer}

  /* MOTION IS THE DECORATION, NOT THE MESSAGE. With animation off, both signals
     have to survive as colour — a reader who has asked for no movement is not
     asking to be told less. */
  @media (prefers-reduced-motion:reduce){
    .nego-scroll,.nego-index-scroll{scroll-behavior:auto}
    .nego-room *,#nego-root *{transition:none !important;animation:none !important}
    .nego-pulse{animation:none !important;background:#5b83ad}
    .nego-acts .b-dis.has-unread{animation:none !important;background:#f7e9c8;
      border-color:#b8862b;color:#7d5a14}
  }
</style>`;
}

/* ---------- a clause body, as the document holds it ----------
   Used wherever a clause is shown with nothing proposed against it. Falls back
   to the text projection when there is no body to show, or when this page has
   no sanitiser — never to the raw html, because an unsanitised clause body is
   the one thing that must not reach the page and a flattened clause is a far
   smaller loss. */
const negoFlatBody = cl => `<p>${_ne((cl && cl.text) || '')}</p>`;
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
function negoDocHtml(c, opts){
  const baseline = !!opts.baseline;
  const clauses = negoClauseList(c);
  const changes = negoChanges(c).filter(x => x.status !== 'superseded');
  const byClause = new Map();
  for (const ch of changes) if (ch.changeType !== 'insertClause') byClause.set(ch.clauseId, ch);
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
  const meta = [c.counterparty ? `Between ${(window.FIRST_PARTY || 'this workspace')} and ${c.counterparty}` : null,
    c.id, baseline ? 'Baseline · the wording this round is measured against'
      : `Round ${negoRound(c)} · proposed redline`].filter(Boolean).join(' · ');

  /* Every clause carries its own heading, rebuilt from num and title on this
     render. The label is never stored and never hashed, so renumbering the
     contract changes what is printed here and nothing else. */
  const head = cl => {
    const label = negoClauseLabel(cl);
    return label ? _ne(label) : '';
  };
  /* The redline comes from the change's STORED ops, never from a diff run now.
     Two renders of one record are identical by construction, which is what
     makes "what was reviewed is what was decided on" a property rather than a
     hope. */
  const redline = ch => window.negoChangeHtml ? negoChangeHtml(ch) : _ne(ch.newText || '');
  const resolvedHtml = ch => (Array.isArray(ch.ops) && ch.ops.length)
    ? ch.ops.filter(o => o.op !== 'del').map(o => o.op === 'ins'
        ? `<span class="nego-resolved" data-fade>${_ne(o.text)}</span>` : _ne(o.text)).join('')
    : `<span class="nego-resolved" data-fade>${_ne(ch.newText)}</span>`;

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
     inside the clause's own <h2>, which put a status pill in the middle of the
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
      <button class="nego-tool" data-nego-edit="${_ne(cl.clauseId)}"
        title="Propose a change to this clause — it goes to the other side to accept or reject">Change</button>
      ${''/* "Add clause" is gone. Proposing a clause the contract does not
             have yet is a real act, but it was done through two blank prompt
             boxes — a heading, then a body, typed into a modal with no sight of
             the document around it — which is not how anybody drafts a clause.
             Removed rather than left as a control nobody could use well.
             Wording still enters through the template, through an edit, or as a
             redline from the other side. */}
      <button class="nego-tool danger" data-nego-del="${_ne(cl.clauseId)}" title="Propose deleting this clause">Delete</button>
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
  const clauseBlock = (cl, ch, domPrefix) => {
    if (baseline || !ch)
      return `<div class="nego-clause" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}">
        ${tools(cl)}${head(cl) ? `<h2>${head(cl)}</h2>` : ''}${negoRichBody(cl)}</div>`;

    let body, badgeCls = '', badgeSuffix = '', note = '';
    if (ch.status === 'pending'){
      /* A proposed DELETION strikes the clause through whole and leaves every
         word of it on the page. The text is not removed until the deletion is
         accepted — a document that quietly loses a clause while someone is
         still deciding about it is the failure this rule exists to prevent. */
      body = ch.changeType === 'deleteClause'
        ? `<p><span class="nego-del">${_ne(cl.text)}</span></p>`
        : `<p>${redline(ch)}</p>`;
    } else if (ch.status === 'accepted'){
      body = ch.changeType === 'deleteClause'
        ? `<p><span class="nego-del">${_ne(cl.text)}</span></p>`
        : `<p>${resolvedHtml(ch)}</p>`;
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
        ? `<span class="nego-note ok">#${_ne(ch.id)} accepted — clause removed</span>`
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
      ? `<span class="nego-note no" title="${_ne(ch.needsReviewWhy || '')}">#${_ne(ch.id)} needs review</span>` : '';
    const notes = note + flag;
    /* Emitted ONCE: in the tools row where there is one, in the heading where
       there is not. Rendering it in both places is the thing this change exists
       to stop. */
    const row = tools(cl, notes);
    const inHead = row ? '' : notes;
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}" data-change="${_ne(ch.id)}">
      ${row}<button class="nego-badge${active && !badgeCls ? ' is-active' : ''}${badgeCls ? ' ' + badgeCls : ''}"
        data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}" aria-label="Change ${_ne(ch.id)}, ${_ne(ch.status)}">#${_ne(ch.id)}${badgeSuffix}</button>
      ${head(cl) ? `<h2>${head(cl)}${inHead}</h2>` : inHead}${body}</div>`;
  };

  const insertBlock = ch => {
    const active = _negoActive === ch.id;
    const cls = ch.status === 'accepted' ? 'is-accepted' : ch.status === 'rejected' ? 'is-rejected' : (active ? 'is-active' : '');
    const sfx = ch.status === 'accepted' ? ' ✓' : ch.status === 'rejected' ? ' ✕' : '';
    const inner = ch.status === 'rejected'
      ? `<span class="nego-del">${_ne(ch.newText)}</span>`
      : ch.status === 'accepted' ? resolvedHtml(ch)
      : `<span class="nego-ins">${_ne(ch.newText)}</span>`;
    const note = ch.status === 'accepted' ? `<span class="nego-note ok">#${_ne(ch.id)} accepted — clause added</span>`
      : ch.status === 'rejected' ? `<span class="nego-note no">#${_ne(ch.id)} rejected — not added</span>` : '';
    const label = ch.headingText || ch.clauseLabel || 'New clause';
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="nw-${negoDomId(ch.clauseId)}" data-clause="${_ne(ch.clauseId)}" data-change="${_ne(ch.id)}">
      <button class="nego-badge${cls ? ' ' + cls : ''}" data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}"
        aria-label="New clause ${_ne(ch.id)}, ${_ne(ch.status)}">#${_ne(ch.id)}${sfx}</button>
      <h2>${_ne(label)}${note}</h2><p>${inner}</p></div>`;
  };

  const prefix = baseline ? 'nb' : 'nw';
  const body = clauses.map(cl => {
    const own = clauseBlock(cl, byClause.get(cl.clauseId), prefix);
    if (baseline) return own;
    const after = (insertsAfter.get(cl.clauseId) || []).map(insertBlock).join('');
    return own + after;
  }).join('');
  const tail = baseline ? '' : orphanInserts.map(insertBlock).join('');

  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne(meta)}</div>
    ${body || `<p style="color:var(--n-ink-soft)">This contract has no wording yet.</p>`}
    ${tail}
  </article>`;
}

/* ---------- the change index ---------- */
function negoCardsHtml(c, opts){
  const pair = negoComparePair();
  if (!negoIsLivePair(pair.left, pair.right)){
    /* Comparison mode. Differences between two old versions are NOT proposals:
       nobody put them forward and nobody can accept them, so this list has no
       verbs on it. Showing Accept here would invent a decision. */
    const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
    const moved = cmp ? cmp.rows.filter(r => r.state !== 'same') : [];
    if (!moved.length) return `
      <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--n-ink-soft)">
        <b style="display:block;color:var(--n-ink);margin-bottom:4px">No differences.</b>
        ${cmp ? _ne(cmp.summary) : ''}</div>`;
    return moved.map(r => `
      <div class="nego-card" data-nego-cmp-row="${_ne(r.clauseId)}" role="button" tabindex="0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-st ${r.state === 'added' ? 'accepted' : r.state === 'removed' ? 'rejected' : 'pending'}">${_ne(r.state)}</span>
        </div>
        <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(r.label || r.clauseId)}</div>
        <div style="font-size:11.5px;line-height:1.55;color:var(--n-ink)">${
          window.redlineOpsHtml ? redlineOpsHtml(r.ops) : _ne(r.newText)}</div>
      </div>`).join('');
  }
  return negoLiveCardsHtml(c, opts);
}
function negoLiveCardsHtml(c, opts){
  const side = opts.side || 'owner';
  const canAct = opts.readonly ? false : true;
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
  const changes = negoChanges(c).filter(x => x.status !== 'superseded');
  const history = negoHistoryHtml(c, opts);
  if (!changes.length) return `
    <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--n-ink-soft)">
      <b style="display:block;color:var(--n-ink);margin-bottom:4px">No changes on the table.</b>
      ${canAct
        ? 'To ask for something different, press <b>Change</b> beside any clause in the middle pane. '
          + 'Each one you make lands here as its own item, and the other side accepts or rejects them one at a time.'
        : side === 'counterparty'
          ? 'Nothing has been proposed for this round yet.'
          : 'Nothing has been proposed for this round yet. When the counterparty proposes wording, each change arrives here with its own fingerprint.'}
    </div>${history}`;

  return changes.map(ch => {
    const active = _negoActive === ch.id;
    const open = _negoThreads[ch.id];
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
      ? ` title="${_ne((msgs[msgs.length - 1] || {}).who || 'They')} has replied and is waiting on you"`
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
          <span class="nego-tlabel">Discussion on #${_ne(ch.id)} — no formal round re-draft</span>
          <button class="nego-tmin" data-nego-collapse="${_ne(ch.id)}"
            title="Collapse this discussion and put the card back the size it was">Hide</button>
        </div>
        <div class="nego-tbody">${n ? msgs.map(m => (window.discussBubbleHtml
            ? discussBubbleHtml({ author: m.who, at: m.at, body: m.text, side: m.side }, side)
            : `<div style="font-size:11.5px;margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`)).join('')
          : `<div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:8px">No comments yet — start the thread. It stays attached to this fingerprint.</div>`}</div>
        ${canComment ? `<div class="nego-compose">
          <input type="text" id="nego-ti-${_ne(ch.id)}" placeholder="Reply on this change…" aria-label="Reply on change ${_ne(ch.id)}"/>
          ${''/* "Send", because that is what it does: the comment goes to the
                  other side on the discussion channel the moment it is
                  pressed. It was briefly "Save" to keep it apart from the
                  postbox below — but a button whose word does not match its
                  act is the worse of the two problems. */}
          <button data-nego-send="${_ne(ch.id)}">Send</button>
        </div>` : ''}
      </div>`;

    const acts = decidable ? `
      <div class="nego-acts">
        <button class="b-acc" data-nego-accept="${_ne(ch.id)}">Accept</button>
        <button class="b-rej" data-nego-reject="${_ne(ch.id)}">Reject</button>
        <button class="${disCls}"${disTitle} aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="nego-thread-${_ne(ch.id)}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
      </div>`
      : `<div class="nego-acts">
        <button class="${disCls}"${disTitle} aria-expanded="${open ? 'true' : 'false'}"
          aria-controls="nego-thread-${_ne(ch.id)}" data-nego-discuss="${_ne(ch.id)}">Discuss${n ? ` (${n})` : ''}</button>
        ${undoable ? `<button class="b-undo" data-nego-undo="${_ne(ch.id)}">Undo</button>` : ''}
        ${redecidable ? `<button class="b-redecide" data-nego-redecide="${_ne(ch.id)}"
            title="You answered this and it has gone to them. Answering differently files a new decision, and that travels too.">Change decision</button>` : ''}
        ${withdrawable && !ch.withdrawn
          ? `<button class="b-wdr" data-nego-withdraw="${_ne(ch.id)}"
              title="They refused this. Take it off the table so it stops standing between you — the record keeps the ask and the refusal.">Withdraw this ask</button>` : ''}
        ${withdrawable && ch.withdrawn
          ? `<button class="b-undo" data-nego-unwithdraw="${_ne(ch.id)}"
              title="Put this ask back on the table">Put it back</button>` : ''}
      </div>`;

    return `
      <div class="nego-card${active ? ' is-active' : ''}${held ? ' is-held' : ''}${mine ? ' is-mine' : ''}" id="nego-card-${_ne(ch.id)}" data-nego-card="${_ne(ch.id)}"
           role="button" tabindex="0">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-id">#${_ne(ch.id)}</span>
          ${negoWhoseHtml(c, ch, opts, mine)}
          ${negoVerifyPill(c, ch)}
          <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
          ${sent ? `<span class="nego-st sent" data-sent="${_ne(ch.id)}"
            title="This answer has been sent. Decide it differently and the new answer travels too.">sent</span>` : ''}
        ${held ? `<span class="nego-st unsent" data-unsent="${_ne(ch.id)}"
            title="You have answered this, and it has not left this page. Press the blue Send button below the list to file it with the other side.">not sent yet</span>` : ''}
          ${ch.withdrawn ? `<span class="nego-st withdrawn" data-withdrawn="${_ne(ch.id)}"
            title="Refused, and the side that asked for it has withdrawn the ask — it is no longer outstanding between the parties">withdrawn</span>` : ''}
        </div>
        ${ch.status === 'rejected' && !ch.withdrawn ? `<div class="nego-contested" data-contested="${_ne(ch.id)}">
          <b>Still between you.</b> This was refused. It stops being outstanding when
          ${mine ? 'you withdraw it' : `${_ne(ch.author)} withdraws it`} — until then neither side can signal readiness to sign.</div>` : ''}
        <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
        ${''/* The "(your side)" italic that used to live here is gone. It was
                the only thing on the card saying whose ask this was: grey, small,
                at the bottom, next to a name that on a deal where both sides are
                you says nothing at all. It is a pill in the top row now, and the
                card carries an edge. */}
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">Author: <b style="color:var(--n-ink);font-weight:600">${_ne(ch.author)}</b></div>
        ${ch.note ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
          <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n-slate)">Why they asked</span>
          <span style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(ch.note)}</span></div>` : ''}
        ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--n-ink)"><b>Reply:</b> ${_ne(ch.reply)}</div>` : ''}
        <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
        ${acts}
        ${held ? `<div class="nego-hold" data-hold="${_ne(ch.id)}">
          <span aria-hidden="true">▲</span>
          <span><b>Not sent yet.</b> ${_ne(String(opts.org || window.FIRST_PARTY || 'The other side'))} has not seen this answer.
          Use the blue <b>Send</b> button under the list to file it.</span>
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
   screens, so the card you see as yours is the card they see as ours. */
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
    <div class="nego-history-head">Earlier rounds</div>
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
          <span class="nego-round-name">Round ${_ne(r.n)}</span>
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
            : '<div class="nego-round-note">This round closed with nothing decided.</div>'}` : ''}
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
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
      <span class="nego-id">#${_ne(ch.id)}</span>
      ${negoWhoseHtml(c, ch, opts || {}, mine)}
      <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
      ${ch.withdrawn ? '<span class="nego-st withdrawn">withdrawn</span>' : ''}
      <span class="nego-st past" data-past-round="${_ne(ch.id)}"
        title="Decided in round ${_ne(r.n)} and archived. It cannot be decided again.">round ${_ne(r.n)}</span>
    </div>
    <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
    <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
    <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">Author: <b style="color:var(--n-ink);font-weight:600">${_ne(ch.author)}</b></div>
    ${ch.note ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
      <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n-slate)">Why they asked</span>
      <span style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(ch.note)}</span></div>` : ''}
    ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--n-ink)"><b>Reply:</b> ${_ne(ch.reply)}</div>` : ''}
    <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
    ${msgs.length ? `<div class="nego-past-thread">
      <div class="nego-tlabel">Discussion on #${_ne(ch.id)} — ${msgs.length} message${msgs.length === 1 ? '' : 's'}, closed with the round</div>
      ${msgs.map(m => (window.discussBubbleHtml
        ? discussBubbleHtml({ author: m.who, at: m.at, body: m.text, side: m.side }, side)
        : `<div style="font-size:11.5px;margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`)).join('')}
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
  if (!v) return `<span class="nego-st verified" title="Recomputing this change's fingerprint from the stored wording">Checking…</span>`;
  if (v.ok) return `<span class="nego-st verified" data-verify="ok" title="${_ne(v.detail)}">Verified</span>`;
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
  return `<select class="nego-vsel" data-nego-vsel="${which}" aria-label="${which === 'left' ? 'Left' : 'Right'} pane version">
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
        ${r.label ? `<h2>${_ne(r.label)}</h2>` : ''}<p>${_ne(r.oldText)}</p></div>`;
    }
    if (r.state === 'removed')
      return `<div class="nego-clause" id="nw-${negoDomId(r.clauseId)}" data-clause="${_ne(r.clauseId)}">
        ${r.label ? `<h2>${_ne(r.label)}<span class="nego-note no">Removed</span></h2>` : ''}
        <p><span class="nego-del">${_ne(r.oldText)}</span></p></div>`;
    const note = r.state === 'added' ? `<span class="nego-note ok">Added</span>` : '';
    const inner = r.state === 'same' ? _ne(r.newText)
      : (window.redlineOpsHtml ? redlineOpsHtml(r.ops) : _ne(r.newText));
    return `<div class="nego-clause" id="nw-${negoDomId(r.clauseId)}" data-clause="${_ne(r.clauseId)}">
      ${r.label ? `<h2>${_ne(r.label)}${note}</h2>` : ''}<p>${inner}</p></div>`;
  }).join('');
  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne([c.id, v ? v.label : '', v && v.sub ? v.sub : ''].filter(Boolean).join(' · '))}</div>
    ${body || `<p style="color:var(--n-ink-soft)">This version has no wording.</p>`}
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
      ${label ? `<h2>${_ne(label)}</h2>` : ''}${negoRichBody(cl)}</div>`;
  }).join('');
  return `<article class="nego-doc">
    <h1>${_ne(title)}</h1>
    <div class="nego-meta">${_ne(meta)}</div>
    ${rows || `<p style="color:var(--n-ink-soft)">This contract has no wording yet.</p>`}
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
    <span class="nego-cmp-tag">Clean read</span>
    <span class="nego-cmp-txt">${open
      ? `Both documents read clean: removed wording is out, proposed wording is in. <b>Nothing has been accepted</b> — ${open} change${open === 1 ? ' is' : 's are'} still open and this is only what the contract would say if ${open === 1 ? 'it were' : 'they were all'} agreed.`
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
    <span class="nego-cmp-tag">Comparing versions</span>
    <span class="nego-cmp-txt">${_ne(cmp.summary)}. This is a read-only look back — these differences were never proposed, so there is nothing here to accept or reject.</span>
    <button class="nego-cmp-exit" id="nego-cmp-exit">Back to the live round</button>
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
      ${theirs ? '' : `<div class="seg"><span class="dot ${off ? 'warn' : 'ok'}"></span>Email: ${off ? 'Not Configured' : 'Configured'}${off ? ' <span style="opacity:.65">(Sharing limits apply)</span>' : ''}</div>`}
      ${theirs ? '' : `<div class="seg"><span class="dot ${seen && seen.kind !== 'unopened' ? 'ok' : 'warn'}"></span>${_ne(seenLine)}</div>`}
      <div class="seg">Negotiation: Round ${p.total ? negoRound(c) : negoRound(c)}</div>
      <div class="seg" id="nego-resolved">Resolved: ${p.done} / ${p.total}</div>
      ${negoIntegritySeg(c)}
      <span class="spacer"></span>
      <span class="seg" style="font-family:var(--n-font-mono);font-size:9.5px;opacity:.6">${_ne(String(opts.side === 'counterparty' ? 'counterparty view' : 'owner view'))} · fingerprinted redline</span>
    </div>`;
}

/* The whole history in one line, on the strip both sides read. Named, not a
   tick: "Integrity check failed" that does not say WHICH change failed is not
   an actionable statement about a legal document. */
function negoIntegritySeg(c){
  const v = window.negoVerifyCached ? negoVerifyCached(c) : null;
  if (!v) return `<div class="seg" id="nego-integrity"><span class="dot warn"></span>Fingerprints: checking…</div>`;
  if (v.ok) return `<div class="seg" id="nego-integrity"><span class="dot ok"></span>Fingerprints: ${v.checked} verified</div>`;
  return `<div class="seg" id="nego-integrity" title="${_ne(v.detail)}"><span class="dot warn"></span>Integrity check failed — first broken link ${_ne('#' + (v.failedAt || 'unknown'))}</div>`;
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
  const canAct = !opts.readonly;
  const side = opts.side || 'owner';
  return `
    <div style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;
      background:var(--n-paper);border:1px solid var(--n-line);border-radius:6px;box-shadow:var(--shadow-sm)">
      <span style="font-size:12.5px;font-weight:700;color:var(--n-ink)">Negotiation</span>
      <span class="nego-ver">Round ${negoRound(c)}</span>
      <span style="font-size:11.5px;color:var(--n-ink-soft);min-width:0;flex:1">
        ${p.total
          ? `${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved — every change carries its own fingerprint.`
          : 'No changes on the table yet. Propose wording and each change becomes a fingerprint on this list.'}
      </span>
      ${canAct && p.pending ? `
        <button id="nego-all-acc" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#1e6b4d;color:#1e6b4d">Accept all</button>
        <button id="nego-all-rej" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#b0453c;color:#b0453c">Reject all</button>` : ''}
      ${side === 'owner' ? `<button id="nego-export" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px"
        title="${p.pending ? 'Pending changes must be resolved first' : 'Export the agreed wording'}"${p.pending ? ' disabled' : ''}>Export clean PDF</button>` : ''}
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
    <div id="nego-ready" style="flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
      border:1px solid #a8cbb8;background:#eef7f1;border-left:4px solid #1e6b4d;border-radius:6px;
      padding:12px 16px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#14503a">Ready to sign — every change is resolved</span>
        <span style="display:block;font-size:11.5px;color:var(--n-ink-soft);margin-top:1px">All ${p.total} change${p.total === 1 ? '' : 's'} on the table ${p.total === 1 ? 'has' : 'have'} an answer${accepted ? ` · ${accepted} adopted into the wording` : ''}${withdrawn ? ` · ${withdrawn} ask${withdrawn === 1 ? '' : 's'} withdrawn` : ''}. Nothing is outstanding between the parties.</span>
      </span>
      ${side === 'owner'
        ? `<button id="nego-to-docs" class="ui-btn ui-btn-primary nego-go" style="flex:none">Send to Docs tab for signature</button>`
        : `<span style="flex:none;font-size:11.5px;color:var(--n-ink-soft)">${_ne((window.FIRST_PARTY || 'The other side'))} will send it for signature.</span>`}
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
  const when = c.signedAt || (c.negotiation && c.negotiation.turnAt) || '';
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
    they are ready to sign — ${_ne(when(theirs.at))}. <b>Nothing is signed yet.</b>
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
      ? `<button class="nego-tbtn acc" id="nego-issue-signing">Issue a signing link</button>` : ''}
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
  return `<div class="nego-turn" id="nego-turn" data-turn="${mine ? 'mine' : 'theirs'}"
      style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:6px;padding:9px 14px;
      border:1px solid ${mine ? '#a8cbb8' : 'var(--n-line)'};background:${mine ? '#eef7f1' : 'var(--n-badge-bg)'};
      border-left:4px solid ${mine ? 'var(--n-accept)' : 'var(--n-slate-soft)'}">
    <span style="flex:1;min-width:200px;font-size:12.5px;font-weight:600;color:${mine ? '#14503a' : 'var(--n-ink)'}">
      ${_ne(b.text)}${!mine && when ? ` <span style="font-weight:400;color:var(--n-ink-soft)">— sent ${_ne(when)}</span>` : ''}</span>
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
    ${mine && !opts.readonly && side === 'owner'
      ? `<button id="nego-send" class="ui-btn ui-btn-primary nego-go" style="flex:none">Send to ${_ne(c.counterparty || 'the counterparty')}</button>`
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
  if ((opts.side || 'owner') !== 'counterparty' || opts.readonly) return '';
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
    <button id="nego-send-decisions" class="nego-pulse">Send ${parts.join(' and ')} to ${who}</button>
    <span class="why">Held on this page until you send. Nothing has reached ${who} yet.</span>
  </div>`;
}
function negoPanesHtml(c, opts = {}){
  const p = negoProgress(c);
  const canAct = !opts.readonly;
  const L = negoLayout();
  const pair = negoComparePair();
  const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
  const comparing = !!(cmp && !cmp.live);
  /* Comparing two old versions wins over reading clean: a hypothetical outcome
     of the LIVE round says nothing about a pair of snapshots from before it. */
  const clean = _negoClean && !comparing;
  return `<div class="nego-work${L.idxOff ? ' idx-off' : ''}" id="nego-work"
      style="--nego-f:${L.f};--nego-c:${L.c}px">

    <section class="nego-pane baseline" aria-label="Original baseline, read-only">
      <div class="nego-pane-head">${negoPaneSelectHtml(c, 'left', pair.left)}<span class="nego-sub">${
        clean ? 'clean — no marks' : 'read-only reference'}</span></div>
      <div class="nego-scroll" id="nego-scroll-base">${comparing
        ? negoCompareDocHtml(c, cmp, 'left')
        : clean ? negoCleanDocHtml(c, 'left')
        : negoDocHtml(c, { ...opts, baseline: true })}</div>
    </section>

    <div class="nego-rz nego-rz-a" id="nego-rz-a" role="separator" aria-orientation="vertical"
      aria-label="Drag to resize the baseline and working panes · double-click to reset"
      title="Drag to resize · double-click to reset"></div>

    <section class="nego-pane working" aria-label="Working version with the proposed redline">
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
      aria-label="Drag to resize the change index · double-click to reset"
      title="Drag to resize · double-click to reset"></div>

    <aside class="nego-pane index" id="nego-index" aria-label="Fingerprinted change index">
      <div class="nego-index-head">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
          <h3 style="font-size:12.5px;font-weight:800;margin:0;flex:1;min-width:0">Fingerprinted Change Index</h3>
          <span class="nego-count" id="nego-count">${cmp && !cmp.live ? cmp.moved : (p.pending || p.total)}</span>
          <button class="nego-fold" id="nego-fold" title="Fold the index away and give its width to the documents">Hide</button>
        </div>
        ${cmp && !cmp.live ? `
        <div style="font-size:11px;color:var(--n-ink-soft)" id="nego-progress">Read-only comparison — the round's own changes are not shown</div>`
        : `
        <div class="nego-track"><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
        <div style="font-size:11px;color:var(--n-ink-soft)" id="nego-progress">${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved</div>
        ${canAct ? `<div class="nego-bulk">
          <button class="b-acc" id="nego-bulk-acc"${p.pending ? '' : ' disabled'}>Accept All</button>
          <button class="b-rej" id="nego-bulk-rej"${p.pending ? '' : ' disabled'}>Reject All</button>
        </div>` : ''}
        ${negoIndexSendHtml(c, opts)}`}
      </div>
      <div class="nego-index-scroll" id="nego-cards">${negoCardsHtml(c, opts)}</div>
    </aside>

    <button id="nego-drawer" aria-label="Toggle the change index">CHG</button>
  </div>
  ${L.idxOff ? `<button class="nego-fold" id="nego-unfold"
      style="position:absolute;right:14px;top:64px;z-index:8"
      title="Bring the change index back">Show index (${p.pending || p.total})</button>` : ''}`;
}

/* Embedded mode: the panes with the summary strip above and the status strip
   below, mounted inside somebody else's page. Kept because it is a smaller
   thing to reason about than the room, and every pane-level test drives it. */
function negoTabHtml(c, opts = {}){
  negoInit(c);
  return `<div id="nego-root">
    ${negoHeadHtml(c, opts)}
    ${negoTurnBannerHtml(c, opts)}
    ${negoCompareBarHtml(c)}
    ${negoCleanBarHtml(c)}
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
function negoNameFieldHtml(opts = {}){
  /* ONLY from the share's recipient. Not from opts.by, which falls back to the
     counterparty ORGANISATION when nobody is named — filling this box with
     "Nordfrakt Logistik AB" would file a company as the person who answered,
     and would do it silently because the box would look already-filled. An
     empty box asks the question; a wrong one answers it. */
  const v = String(opts.recipientName || '').trim();
  return `<label class="nego-who" title="The name recorded against your answers">
    <span class="lbl">You</span>
    <input id="nego-cp-name" type="text" value="${_ne(v)}" placeholder="Your full name"
      aria-label="Your full name, recorded against your answers"/>
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
function negoRoomActionsHtml(c, opts){
  const side = opts.side || 'owner';
  const p = negoProgress(c);
  /* While the panes are showing two OLD versions, nothing on this screen is a
     live proposal — so the bulk verbs are disabled too. Leaving them live would
     let someone reading history accept the round behind it, which is the
     "nothing here to accept" rule leaking at the top of the page. */
  const comparing = !negoIsLivePair(negoComparePair().left, negoComparePair().right);
  const canAct = !opts.readonly && !comparing;
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
      ${canShow ? `<button class="nego-tbtn ghost" id="nego-cp-decline">Decline</button>` : ''}
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
    <button class="nego-tbtn ghost" id="nego-save-draft">Save Draft</button>
    ${''/* SHARE LINK IS GONE FROM THIS BAR, because "Send to <them>" in the
            turn banner opens the very same share dialog by the very same route
            — see the send handler below, which has always said so. Two ghost
            buttons a few inches apart minting the same link is one too many,
            and the quieter of the two sat next to Save Draft where nothing
            about it said it was how the contract reaches the other party.

            Sharing is not lost: the workspace's own Share and the contracts
            list both open the same dialog, for the cases this room is not the
            right place for — a third party, a re-send, a link for signature. */}
    <button class="nego-tbtn ghost" id="nego-copilot" title="Ask about this contract — search it, or get help with the wording">✦ Ask Copilot</button>
    ${canAct ? `<button class="nego-tbtn ghost" id="nego-insert-lib" title="Insert preferred wording from your clause library — filed as a tracked change, not an edit">+ Insert clause</button>` : ''}
    <button class="nego-tbtn acc" id="nego-all-acc"${p.pending && canAct ? '' : ' disabled'}
      title="${comparing ? 'Not while you are comparing versions' : ''}">Accept All</button>
    <button class="nego-tbtn rej" id="nego-all-rej"${p.pending && canAct ? '' : ' disabled'}
      title="${comparing ? 'Not while you are comparing versions' : ''}">Reject All</button>
    <button class="nego-tbtn ghost" id="nego-export"${p.pending ? ' disabled' : ''}
      title="${p.pending ? 'Pending changes must be resolved first' : 'Export the agreed wording'}">Export Clean PDF</button>`;
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
  return `<div class="nego-room" id="nego-room" role="region" aria-label="Negotiation room">
    <header class="nego-topbar">
      <div class="nego-brand"><span class="mark">Ha</span>HaTi <small>Contract Lifecycle Management</small></div>
      <nav class="nego-crumbs" aria-label="Workspace breadcrumbs">
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
        ${negoRoomHasExit(opts) ? `<button class="nego-exit" id="nego-exit" title="Leave the negotiation room and go back to the Doc page (Esc)">
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
    else if (window.toast) toast('Saving is not available on this screen', 'err');
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
    roomId(id)?.addEventListener('click', () => {
      if (typeof opts[hook] === 'function') opts[hook](c);
      else if (window.toast) toast('That action is not available on this screen', 'err');
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
  const decide = (id, status, extra) => {
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
  const fileAndRepaint = async (fn, msg) => {
    const ch = await fn();
    if (!ch){ if (window.toast) toast('Nothing changed — no fingerprint was filed'); return; }
    _negoActive = ch.id;
    if (window.negoInvalidateVerification) negoInvalidateVerification(c);
    if (opts.persist !== false && window.persist) persist(c);
    if (window.toast) toast(msg(ch));
    again();
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
      if (window.toast) toast('The clause library is not available on this page', 'err');
      return;
    }
    openClausePicker(c, { onPick: async cl => {
      const after = _negoActive
        ? (negoChangeById(c, _negoActive) || {}).clauseId
        : null;
      const ch = await negoInsertClause(c, after || null,
        { headingText: cl.name, bodyHtml: window.textToRich ? textToRich(cl.preferred) : `<p>${_ne(cl.preferred)}</p>` },
        { side, author: opts.by,
          summary: `Preferred wording inserted from the playbook — ${cl.name}` });
      if (!ch){ if (window.toast) toast('That clause could not be inserted', 'err'); return; }
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
      if (window.toast) toast('Copilot is not available on this page', 'err');
      return;
    }
    openAI();
  });

  const send = host.querySelector('#nego-send');
  if (send) send.addEventListener('click', () => {
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
    else if (window.toast) toast('Sharing is not available on this screen', 'err');
  });

  host.querySelectorAll('[data-nego-edit]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    const clauseId = b.getAttribute('data-nego-edit');
    const block = host.querySelector(`.nego-pane.working .nego-clause[data-clause="${clauseId}"]`);
    if (!block || block.querySelector('.nego-edit-bar')) return;
    /* THE WHOLE BODY, not the first paragraph of it. A clause with nothing
       proposed against it is drawn as its own markup — `<div class="nego-body">`
       around however many paragraphs, lists and tables it has — so reaching for
       `p` found the first paragraph inside it and swapped only that, leaving the
       list and the paragraphs after it stranded below the editor and outside
       what would be saved. */
    const body = block.querySelector('.nego-body') || block.querySelector('p');
    if (!body) return;
    /* The clause is edited as the RICH content it is, in place. The old flow
       put the whole document into a <textarea>, which is why headings,
       numbering and tables did not survive being proposed on. */
    const cl = negoClauseById(c, clauseId);
    if (!cl) return;
    const holder = document.createElement('div');
    holder.className = 'nego-editing';
    holder.setAttribute('contenteditable', 'true');
    holder.setAttribute('data-nego-editor', clauseId);
    holder.innerHTML = cl.bodyHtml || `<p>${_ne(cl.text)}</p>`;
    body.replaceWith(holder);
    const bar = document.createElement('div');
    bar.className = 'nego-edit-bar';
    bar.innerHTML = `<button class="b-save" data-nego-save="${_ne(clauseId)}">Save change</button>`
      + `<button class="b-cancel" data-nego-cancel="${_ne(clauseId)}">Cancel</button>`;
    holder.after(bar);
    if (holder.focus) holder.focus();
    bar.querySelector('[data-nego-cancel]').addEventListener('click', ev => { ev.stopPropagation(); again(); });
    bar.querySelector('[data-nego-save]').addEventListener('click', ev => {
      ev.stopPropagation();
      fileAndRepaint(() => negoEditClause(c, clauseId, holder.innerHTML, { side, author: opts.by }),
        ch => `#${ch.id} filed — ${ch.summary}`);
    });
  }));

  host.querySelectorAll('[data-nego-del]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    const clauseId = b.getAttribute('data-nego-del');
    const cl = negoClauseById(c, clauseId);
    if (!cl) return;
    if (window.confirmDialog){
      const ok = await confirmDialog({ title: 'Propose deleting this clause?',
        message: `“${negoClauseLabel(cl)}” would be struck through for the other side to decide. `
          + 'The wording stays in the document until they accept the deletion.',
        confirmLabel: 'Propose deletion' });
      if (!ok) return;
    }
    fileAndRepaint(() => negoDeleteClause(c, clauseId, { side, author: opts.by }),
      ch => `#${ch.id} filed — deletion proposed, the wording stays until it is accepted`);
  }));

  host.querySelectorAll('[data-badge]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    negoFocus(c, b.getAttribute('data-badge'), 'badge');
  }));
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
    negoFocus(c, n.getAttribute('data-change'), 'clause')));

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
      why = await promptDialog({ title: 'Why are you turning this change down?',
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
      if (!text){ if (window.toast) toast('Write your reply first', 'err'); return; }
      const msg = negoPostComment(c, id, text, { side, author: opts.author });
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
      if (typeof opts.onComment === 'function' && msg){
        try { await opts.onComment(c, negoChangeById(c, id), msg); }
        catch (e){ /* the handler reports its own failure */ }
      }
      else if (window.toast) toast(`Comment sent on #${id} — the contract is unchanged and no round was opened`);
      again();
      const back = byId('nego-ti-' + id);
      if (back && back.focus) back.focus();
    };
    b.addEventListener('click', e => { e.stopPropagation(); send(); });
    const inp = byId('nego-ti-' + id);
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
  ['nego-bulk-acc', 'nego-all-acc'].forEach(id => byId(id)?.addEventListener('click', () => bulk('accepted')));
  ['nego-bulk-rej', 'nego-all-rej'].forEach(id => byId(id)?.addEventListener('click', () => bulk('rejected')));

  byId('nego-drawer')?.addEventListener('click', () =>
    byId('nego-index')?.classList.toggle('open'));

  byId('nego-export')?.addEventListener('click', () => {
    if (negoProgress(c).pending){ if (window.toast) toast('Pending changes must be resolved before a clean export', 'err'); return; }
    if (window.exportContractPdf) exportContractPdf(c);
    else if (window.toast) toast('Export is unavailable on this page', 'err');
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
    if (window.toast) toast('Agreed wording carried to the Docs tab — sign it there when you are ready');
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
function negoResetView(){ _negoActive = null; _negoThreads = {}; _negoRedeciding = {}; _negoOpenRounds = {}; _negoClean = false; negoSetComparePair('baseline', 'working'); }

if (typeof window !== 'undefined') Object.assign(window, {
  negoStyleHtml, negoEnsureStyle, negoDocHtml, negoCardsHtml, negoStatusHtml, negoHeadHtml, negoReadyHtml,
  negoTabHtml, renderNegotiationTab, wireNegotiationTab, negoFocus, negoResetView, negoDomId,
  negoPanesHtml, negoRoomHtml, negoRoomActionsHtml, negoLayout, negoSetLayout, wireNegoLayout,
  negoHistoryHtml, negoHistoryCardHtml, negoConfirmCloseRound, negoWhoseHtml,
  negoIndexSendHtml, negoNameFieldHtml, negoReadySignalHtml, negoRoomHasExit, negoPick,
  negoRoomBannerHtml, negoClosedBannerHtml,
  openNegotiationRoom, closeNegotiationRoom, negoRoomContract, negoRoomIsOpen,
  negoComparePair, negoSetComparePair, negoPaneSelectHtml, negoCompareDocHtml,
  negoCleanView, negoSetCleanView, negoCleanDocHtml, negoCleanBarHtml,
  negoRichBody, negoFlatBody,
  negoSeenKey, negoSeenScope, negoThreadSeenAt, negoMarkThreadSeen,
  NEGO_F0, NEGO_C0, NEGO_LAYOUT_KEY });
