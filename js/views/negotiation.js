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
  /* ---- WHY THE TWO FLOATING LAYERS ARE IN THIS SELECTOR ----
     .nego-selmenu and .nego-aipop are appended to document.body, deliberately:
     a popover clipped by the scrolling pane it belongs to is worse than one
     that outlives it. But that puts them OUTSIDE .nego-room and #nego-root,
     where every --n-* below is undefined — so background:var(--n-paper)
     resolved to nothing and the menu rendered with a TRANSPARENT background,
     the clause text showing straight through the words on top of it. That is
     the "washed out, muddy" selection menu, and it was never an alpha value:
     it was a token that did not reach the element using it.

     They are listed here rather than fixed with a hard-coded #fff so the two
     layers keep reading from the same ramp as the room they belong to, and
     they stay inside the component's own namespace — nothing here is declared
     on :root, which would restyle the whole product from inside a component. */
  .nego-room, #nego-root, .nego-selmenu, .nego-aipop{
    --n-slate:#33475c; --n-slate-deep:#26374a; --n-slate-soft:#456a8f;
    --n-badge-bg:#eef2f6;
    --n-ins-bg:#e4f1ea; --n-ins-fg:#1e6b4d;
    --n-del-bg:#f9ecea; --n-del-fg:#b0453c;
    --n-paper:#ffffff; --n-canvas:#f2f4f7; --n-line:#e3e8ee;
    --n-ink:#2b3440; --n-ink-soft:#66707d;
    --n-accept:#1e6b4d; --n-reject:#b0453c; --n-focus:#456a8f;
    /* Type is the platform's, colour is the room's. The room used to set its
       own three faces, so a contract changed face when you walked into it;
       a clause now reads the same here as on the Doc page and in the PDF. */
    --n-font-ui:var(--font-body);
    --n-font-doc:var(--font-doc);
    --n-font-mono:var(--font-mono);
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

  /* ---- THE REDLINE KEEPS THE SHAPE OF THE CLAUSE ----
     Each line of a clause under redline is its own block (js/redline.js,
     redlineOpsBlocksHtml), so pre-wrap is off inside one: the blocks carry the
     breaks now, and leaving it on would double every one of them.

     The hanging indent is the part that makes a numbered sub-clause read as
     one. A negative text-indent against matching padding pulls "7.1" and "(b)"
     out into the gutter and hangs the wrapped wording under the first word
     rather than under the margin, which is how a contract is set on paper. */
  .nego-redline{display:block}
  .nego-redline .rl-line{margin:0 0 7px;white-space:normal}
  .nego-redline .rl-line:last-child{margin-bottom:0}
  .nego-redline .rl-heading{font-weight:700;font-size:13.5px;margin:12px 0 6px;
    font-family:var(--n-font-doc)}
  .nego-redline .rl-heading:first-child{margin-top:0}
  .nego-redline .rl-hang{padding-left:2.6em;text-indent:-2.6em}
  .nego-redline .rl-clause{margin-top:9px}
  /* A line that arrived or went whole is marked in the margin as well as in
     its colour, so the two are still distinguishable in print and to anyone
     who cannot separate the reds from the greens. */
  .nego-redline .rl-line-ins,.nego-redline .rl-line-del{position:relative}
  .nego-redline .rl-line-ins::before{content:"+";position:absolute;left:-1.15em;
    color:var(--n-ins-fg);font-weight:700;text-indent:0}
  .nego-redline .rl-line-del::before{content:"−";position:absolute;left:-1.15em;
    color:var(--n-del-fg);font-weight:700;text-indent:0}
  .nego-redline .rl-marker{font-weight:600}

  /* ---- ins and del are ELEMENTS now ----
     The utility class names travel on them for hosts that have a utility
     framework; these rules are what actually colours them here, so a redline
     stays legible with no framework on the page at all. Scoped to the room
     like every other token in this stylesheet. */
  .nego-room ins.hati-ins,.nego-room ins.nego-ins{
    background:var(--n-ins-bg);color:var(--n-ins-fg);text-decoration:none;
    border-bottom:2px solid var(--n-ins-fg);border-radius:2px;padding:0 1px}
  .nego-room del.hati-del,.nego-room del.nego-del{
    background:var(--n-del-bg);color:var(--n-del-fg);text-decoration:line-through;
    border-radius:2px;padding:0 1px}

  /* ---- the selection menu ----
     Anchored to the selection rather than to the pointer: a person who selects
     with the keyboard, or drags right-to-left, still gets the menu on the words
     they chose. Fixed positioning because the pane it floats over scrolls.

     ---- WHY 66 AND NOT 60 ----
     Both floating layers are appended to document.body, so their z-index is
     read against the other body-level layers, and there are three of them:
     .nego-room at 60, #ai-scrim at 65 while the room is open, #ai-panel at 70.

     At 60 this menu was TIED with the room and only painted above it because
     _negoKillSelMenu re-appends it last — order-of-DOM luck, not a rule. And
     at 60/61 both layers sat UNDER the scrim, which is rgba(29,45,61,.35) with
     a 2px backdrop blur and pointer-events:auto when open. Opening the Copilot
     drawer undocked therefore dimmed and blurred the menu and the proposal
     popover — the washed-out, unclickable state — rather than the page behind
     them. Above the scrim, under the drawer: the menu stays crisp and live,
     and the drawer still wins where the two actually overlap. */
  .nego-selmenu{position:fixed;z-index:66;display:flex;flex-direction:column;gap:1px;
    min-width:236px;padding:5px;border-radius:9px;background:var(--n-paper);
    border:1px solid var(--n-line);box-shadow:0 10px 30px -8px rgba(20,32,48,.35)}
  .nego-selmenu button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;
    font:inherit;font-family:var(--n-font-ui);font-size:12.5px;color:var(--n-ink);
    background:none;border:0;border-radius:6px;padding:7px 9px;cursor:pointer}
  .nego-selmenu button:hover,.nego-selmenu button:focus-visible{background:var(--n-badge-bg)}
  .nego-selmenu .nego-selhead{font-size:10px;letter-spacing:.09em;text-transform:uppercase;
    color:var(--n-ink-soft);padding:5px 9px 4px}
  .nego-selmenu .nego-selquote{font-size:11px;color:var(--n-ink-soft);padding:0 9px 6px;
    max-width:236px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:italic}

  /* ---- the AI proposal popover ----
     A proposal, never an edit. Nothing has moved when this is on screen: it
     shows the redline that WOULD be filed, and closing it leaves the document
     exactly as it was. */
  /* 67, one above the selection menu and one above the scrim — see the note on
     .nego-selmenu for why the scrim is the layer that matters here. */
  .nego-aipop{position:fixed;z-index:67;width:min(460px,calc(100vw - 32px));
    border-radius:11px;background:var(--n-paper);border:1px solid var(--n-line);
    box-shadow:0 18px 44px -12px rgba(20,32,48,.42);overflow:hidden}
  .nego-aipop header{display:flex;align-items:center;gap:8px;padding:11px 14px;
    border-bottom:1px solid var(--n-line);background:var(--n-canvas)}
  .nego-aipop header b{font-family:var(--n-font-ui);font-size:12.5px}
  .nego-aipop .nego-aibody{padding:12px 14px;max-height:44vh;overflow-y:auto;
    font-family:var(--n-font-doc);font-size:13px;line-height:1.65}
  .nego-aipop footer{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--n-line);
    background:var(--n-canvas);flex-wrap:wrap}
  .nego-aipop .nego-aiwait{display:flex;align-items:center;gap:9px;padding:16px 14px;
    font-family:var(--n-font-ui);font-size:12.5px;color:var(--n-ink-soft)}
  .nego-aipop .nego-aispin{width:14px;height:14px;border-radius:50%;flex:none;
    border:2px solid var(--n-line);border-top-color:var(--n-slate);animation:nego-spin .8s linear infinite}
  @keyframes nego-spin{to{transform:rotate(360deg)}}
  .nego-aipop .nego-aierr{padding:14px;font-family:var(--n-font-ui);font-size:12.5px;
    line-height:1.6;color:#8f322b}

  /* ---- a thread singled out by its badge ---- */
  .nego-card.is-linked{box-shadow:0 0 0 3px rgba(184,134,43,.35);border-color:#b8862b}
  .nego-filterbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;
    font-family:var(--n-font-ui);font-size:11.5px;padding:7px 11px;border-radius:6px;
    background:#fdf6e7;border:1px solid #e0c48a;color:#7d5a14;margin-bottom:9px}
  .nego-filterbar button{font:inherit;font-size:11px;font-weight:600;cursor:pointer;
    border:1px solid #d8bd86;background:#fff;color:#7d5a14;border-radius:5px;padding:3px 9px}

  /* ---- visibility on a comment ---- */
  .nego-vis{display:inline-flex;align-items:center;gap:4px;font-family:var(--n-font-ui);
    font-size:10px;font-weight:700;letter-spacing:.04em;border-radius:999px;padding:2px 8px;white-space:nowrap}
  .nego-vis-int{background:#f4ecd8;color:#8a6a2a;border:1px solid rgba(138,106,42,.3)}
  .nego-vis-sh{background:#e8f0f8;color:#2c455d;border:1px solid #b5d9fd}
  .nego-msg.is-internal{background:#fdfaf1;border-left:3px solid #b8862b;padding-left:9px}
  .nego-visswitch{display:inline-flex;border:1px solid var(--n-line);border-radius:6px;overflow:hidden}
  .nego-visswitch button{font:inherit;font-family:var(--n-font-ui);font-size:11px;font-weight:600;
    cursor:pointer;border:0;background:var(--n-paper);color:var(--n-ink-soft);padding:4px 9px}
  .nego-visswitch button + button{border-left:1px solid var(--n-line)}
  .nego-visswitch button[aria-pressed="true"].v-int{background:#f4ecd8;color:#8a6a2a}
  .nego-visswitch button[aria-pressed="true"].v-sh{background:var(--n-slate);color:#fff}

  /* ---- which mode the room is in ---- */
  .nego-mode{display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:none;
    font-family:var(--n-font-ui);font-size:11.5px;padding:8px 13px;border-radius:6px;
    border:1px solid var(--n-line);background:var(--n-paper)}
  .nego-mode.is-sandbox{border-left:4px solid #b8862b;background:#fffdf7;color:#7d5a14}
  .nego-mode.is-published{border-left:4px solid var(--n-slate);background:#f5f8fb;color:var(--n-ink)}
  .nego-mode b{font-size:12px}
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
  /* WHOSE ASK THIS IS, readable without reading. It pairs with the "Your ask"
     chip and explains why the card has no Accept on it — nobody rules on their
     own proposal. At 3px it was competing with the 1px border it sits inside
     and had to be looked for; the padding absorbs the extra so nothing shifts. */
  .nego-card.is-mine{border-left:5px solid var(--n-mine,#1f3f6e);padding-left:11px}
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
function negoDocHtml(c, opts){
  const baseline = !!opts.baseline;
  const clauses = negoClauseList(c);
  let changes = negoChanges(c).filter(x => x.status !== 'superseded');
  /* NARROWED TO ONE, when the reader clicked a fingerprint in the margin. The
     bar above the list says so and offers the way back, so this is never a
     state somebody can be stuck in without knowing why the list got short. */
  if (_negoOnly && _negoLinked && changes.some(x => x.id === _negoLinked))
    changes = changes.filter(x => x.id === _negoLinked);
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
  /* BLOCK-AWARE, and still rendered from storage. redlineOpsBlocksHtml regroups
     the recorded ops at their newlines — it rewrites none of them — so a clause
     under redline keeps its heading, its numbered sub-clauses and its lettered
     sub-paragraphs instead of collapsing into one paragraph. That collapse was
     worst exactly where it hurt most: the clause a reader is being asked to
     decide about. */
  const redline = ch => (window.redlineOpsBlocksHtml && Array.isArray(ch.ops) && ch.ops.length)
    ? redlineOpsBlocksHtml(ch.ops)
    : (window.negoChangeHtml ? negoChangeHtml(ch) : _ne(ch.newText || ''));
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
        ? `<div class="nego-redline">${_negoStruckBlocks(cl.text)}</div>`
        : `<div class="nego-redline">${redline(ch)}</div>`;
    } else if (ch.status === 'accepted'){
      body = ch.changeType === 'deleteClause'
        ? `<div class="nego-redline">${_negoStruckBlocks(cl.text)}</div>`
        : `<div class="nego-redline">${resolvedHtml(ch)}</div>`;
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
      <b>🔒 Internal sandbox drafting</b>
      <span style="flex:1;min-width:180px">${n} ask${n === 1 ? '' : 's'} ${n === 1 ? 'is' : 'are'} still on your desk. ${_ne(other)} cannot see ${n === 1 ? 'it' : 'them'} and cannot answer until you send.</span>
    </div>`;
  return `
    <div class="nego-mode is-published" role="status">
      <b>🌐 Counterparty published round</b>
      <span style="flex:1;min-width:180px">Everything on the table has been sent to ${_ne(other)}. Nothing here is private.</span>
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
    <button id="nego-unfilter" type="button">Clear</button>
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
              : `<div style="font-size:11.5px;margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`;
            return `<div class="nego-msg${shared ? '' : ' is-internal'}">
              <div style="margin-bottom:3px">${badge}</div>${bubble}</div>`;
          }).join('')
          : `<div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:8px">No comments yet — start the thread. It stays attached to this fingerprint.</div>`}</div>
        ${canComment ? `<div class="nego-compose" style="flex-wrap:wrap">
          <div class="nego-visswitch" role="group" aria-label="Who can read this reply" style="flex:none;margin-bottom:5px">
            <button type="button" class="v-int" data-nego-vis="internal" data-for="${_ne(ch.id)}" aria-pressed="false">\uD83D\uDD12 Internal</button>
            <button type="button" class="v-sh" data-nego-vis="shared" data-for="${_ne(ch.id)}" aria-pressed="true">\uD83C\uDF10 Send to them</button>
          </div>
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
      <div class="nego-card${active ? ' is-active' : ''}${held ? ' is-held' : ''}${mine ? ' is-mine' : ''}${ch.id === _negoLinked ? ' is-linked' : ''}" id="nego-card-${_ne(ch.id)}" data-nego-card="${_ne(ch.id)}"
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
  if (v.ok) return `<div class="seg" id="nego-integrity" title="${_ne(v.detail)}"><span class="dot ok"></span>Fingerprints: ${v.checked} verified${
    v.partial ? ' in part — this copy does not carry every earlier draft' : ''}</div>`;
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
    ${negoModeHtml(c, opts)}
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
        <button id="nego-all-acc" class="ui-btn" title="Accepts only the pending changes that trip no playbook, scan or review signal — the rest are held back for you" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#1e6b4d;color:#1e6b4d">Accept all non-risk redlines</button>
        <button id="nego-all-rej" class="ui-btn" title="Rejects every pending change proposed by the other side. Your own asks are untouched." style="flex:none;font-size:11.5px;padding:5px 11px;border-color:#b0453c;color:#b0453c">Reject all counterparty redlines</button>` : ''}
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
/* WHO ARE WE NEGOTIATING WITH, asked once and then never again.

   The two sides did the same act by completely different means. The
   counterparty files an answer and a postbox appears under it: press, gone. The
   owner filed a change and got a button that opened a DIALOG — recipient,
   channel, expiry, a covering message — because the address had always been
   collected at SEND time. Collect it once, at the start, and the owner's send
   becomes what theirs already is.

   A STRIP, NOT A DIALOG. A modal that fires on opening the negotiation stands in
   the way of somebody who only wanted to read, and a "skip" button is one more
   thing to dismiss that nobody asked for. Ignore this and it waits; fill it in
   and it goes. Nothing is blocked either way — a change proposed without an
   address still has a send, it just asks at that moment (see the send handler).

   The name is already known: it is the contract's counterparty. Only the
   address is missing, which is why this is one field and not a form. */
function negoCounterpartySetupHtml(c, opts = {}){
  if ((opts.side || 'owner') !== 'owner' || opts.readonly) return '';
  if (opts.contact && opts.contact.email) return '';
  if (typeof opts.onSetCounterparty !== 'function') return '';
  const who = _ne(String(c.counterparty || 'the counterparty'));
  return `<div class="nego-turn" id="nego-cp-setup" style="flex:none;display:flex;align-items:center;gap:10px;
      flex-wrap:wrap;border-radius:6px;padding:9px 14px;border:1px solid var(--n-line);
      background:var(--n-badge-bg);border-left:4px solid var(--n-slate-soft)">
    <span style="flex:1;min-width:220px;font-size:12.5px;color:var(--n-ink)">
      Negotiating with <b>${who}</b>? Add their email and changes go straight to them.</span>
    <input id="nego-cp-email" type="email" placeholder="their email"
      style="flex:none;width:210px;border:1px solid var(--n-line);border-radius:5px;padding:6px 9px;
        font:inherit;font-size:12px;outline:none"/>
    <button id="nego-cp-save" class="ui-btn ui-btn-primary" style="flex:none;font-size:12px;padding:6px 12px">Save</button>
    <button id="nego-cp-more" class="nego-tbtn ghost" style="flex:none">More options…</button>
  </div>`;
}
function negoRoomBannerHtml(c, opts = {}, ready){
  const comparing = !negoIsLivePair(negoComparePair().left, negoComparePair().right);
  if (comparing) return '';
  const status = String(c.status || '');
  if (status === 'Signed' || status === 'Declined') return negoClosedBannerHtml(c, opts);
  const setup = negoCounterpartySetupHtml(c, opts);
  const wrap = inner => `<div style="padding:0 14px;display:flex;flex-direction:column;gap:8px">${setup}${inner}</div>`;
  const signal = negoReadySignalHtml(c, opts);
  if (signal) return setup ? wrap(signal) : signal;
  if (ready) return setup ? wrap(negoReadyHtml(c, opts)) : negoReadyHtml(c, opts);
  return wrap(negoTurnBannerHtml(c, opts));
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
    ${mine && !heldHere && !opts.readonly && side === 'owner'
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
    const n = window.negoUnsentAsks ? negoUnsentAsks(c, 'owner').length : 0;
    if (!n) return '';
    const them = _ne(String(c.counterparty || 'the counterparty'));
    return `<div class="nego-index-send">
      <button id="nego-send" class="nego-pulse">Send ${n} change${n === 1 ? '' : 's'} to ${them}</button>
      <span class="why">Held on this page until you send. Nothing has reached ${them} yet.</span>
    </div>`;
  }
  if (me !== 'counterparty') return '';
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
          <button class="b-acc" id="nego-bulk-acc"${p.pending ? '' : ' disabled'}
            title="Accepts only the pending changes that trip no playbook, scan or review signal">Accept All Non-Risk</button>
          <button class="b-rej" id="nego-bulk-rej"${p.pending ? '' : ' disabled'}
            title="Rejects every pending change from the other side. Your own asks are untouched.">Reject All Counterparty</button>
        </div>` : ''}
        ${negoIndexSendHtml(c, opts)}`}
      </div>
      <div class="nego-index-scroll" id="nego-cards">${negoLinkedBarHtml()}${negoCardsHtml(c, opts)}</div>
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
      title="${comparing ? 'Not while you are comparing versions' : 'Accepts only the pending changes that trip no playbook, scan or review signal — the rest are held back for you'}">Accept All Non-Risk</button>
    <button class="nego-tbtn rej" id="nego-all-rej"${p.pending && canAct ? '' : ' disabled'}
      title="${comparing ? 'Not while you are comparing versions' : 'Rejects every pending change proposed by the other side. Your own asks are untouched.'}">Reject All Counterparty</button>
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
    return `<li style="margin:0 0 4px"><code style="font-family:var(--font-mono);font-size:11px">#${e(ch.id)}</code> ${e(ch.clauseLabel || ch.clauseId || '')}${
      x.why ? ` <span style="color:#8f322b">— ${e(x.why.join('; '))}</span>` : ''}</li>`;
  }).join('') + (arr.length > 12 ? `<li style="color:var(--color-neutral-600)">…and ${arr.length - 12} more</li>` : '');
  const body = `
    <div style="font-size:12.5px;line-height:1.6">
      <p style="margin:0 0 8px"><b>${take.length} change${take.length === 1 ? '' : 's'}</b> will be ${kind === 'accept' ? 'accepted and merged into the wording' : 'rejected, reverting those clauses to the baseline'}.</p>
      <ul style="margin:0 0 12px;padding-left:18px">${list(take)}</ul>
      ${kind === 'accept' && split.held.length ? `
        <p style="margin:0 0 6px"><b>${split.held.length}</b> held back for you to read:</p>
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
    ask: 'Rewrite this contract wording so it is more favourable to the party I act for, while staying commercially reasonable and enforceable under Kenyan law.' },
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
  if (top + h > window.innerHeight - pad) top = Math.max(pad, rect.top - h - 8);
  return { left, top };
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
      <button type="button" data-ai-x class="ui-btn" style="font-size:11px;padding:3px 9px">Close</button></header>
    <div class="nego-aiwait"><span class="nego-aispin"></span>Reading the clause…</div>`;
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

  const cl = window.negoClauseById ? negoClauseById(c, clauseId) : null;
  const clauseText = cl ? cl.text : text;
  const pbLine = (() => {
    try{
      const v = ((c.playbook && c.playbook.verdicts) || []).filter(x => x.status === 'deviation');
      return v.length ? `Our playbook flags this contract for: ${v.map(x => x.category).join(', ')}.` : '';
    }catch(_){ return ''; }
  })();
  const messages = [{ role: 'user', content:
    `${action.ask}\n\n`
    + `You are helping negotiate a contract governed by Kenyan law. `
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
      ? 'The Copilot needs an API key before it can answer. Nothing was changed.'
      : `The Copilot could not answer: ${(err && err.message) || err}. Nothing was changed.`);
    return;
  }
  if (!pop.isConnected) return;                    // closed while it was thinking
  if (!String(raw || '').trim()){ fail('The Copilot returned nothing usable. Nothing was changed.'); return; }

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
  const found = !!replacement && clauseText.includes(text);
  if (replacement && !found){
    fail('That selection spans wording already marked as changed, so it cannot be placed back into the clause safely. Decide the pending change first, or select from a settled part of the clause. Nothing was changed.');
    return;
  }
  const proposed = found ? clauseText.replace(text, replacement) : clauseText;
  const structured = window.redlineStructuredHtml
    ? redlineStructuredHtml(clauseText, proposed) : null;
  const canApply = found && proposed !== clauseText;

  pop.querySelector('.nego-aiwait')?.remove();
  const body = document.createElement('div');
  body.className = 'nego-aibody';
  body.innerHTML = (note ? `<p style="font-family:var(--n-font-ui);font-size:12.5px;line-height:1.6;margin:0 0 10px;padding:9px 11px;background:var(--n-canvas);border-radius:6px">${e(note)}</p>` : '')
    + (canApply
      ? `<div class="nego-redline">${structured || e(proposed)}</div>`
      : `<p style="font-family:var(--n-font-ui);font-size:12.5px;color:var(--n-ink-soft);margin:0">No wording change was proposed${note ? ' — the note above is the whole answer' : ''}.</p>`);
  pop.insertBefore(body, pop.querySelector('header').nextSibling);
  const foot = document.createElement('footer');
  foot.innerHTML = `
    ${canApply ? `<button type="button" data-ai-apply class="ui-btn ui-btn-primary" style="font-size:12px">Apply redline</button>` : ''}
    <button type="button" data-ai-cancel class="ui-btn" style="font-size:12px">Cancel</button>
    <span style="flex:1"></span>
    <span style="font-family:var(--n-font-ui);font-size:10.5px;color:var(--n-ink-soft);align-self:center">Nothing has changed yet</span>`;
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
        if (window.toast) toast('That wording matches the clause already — nothing filed'); return; }
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
  negoRiskOf, negoBatchSplit, negoBatchConfirm, NEGO_AI_ACTIONS,
  negoAiPropose, negoLinkedBarHtml, negoModeHtml
});

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

  /* The setup strip. Saving records the address on the contract, so the next
     send has somewhere to go without asking; "More options…" is the whole
     dialog, because purpose, expiry and channel still matter and a signing link
     is not a negotiation link. */
  const cpSave = byId('nego-cp-save');
  if (cpSave) cpSave.addEventListener('click', () => {
    const el = byId('nego-cp-email');
    const email = String((el && el.value) || '').trim();
    if (!/.+@.+\..+/.test(email)){
      if (window.toast) toast('Enter an email address they can be reached at', 'err');
      if (el && el.focus) el.focus();
      return;
    }
    if (typeof opts.onSetCounterparty === 'function')
      opts.onSetCounterparty({ name: c.counterparty || '', email });
    again();
  });
  byId('nego-cp-more')?.addEventListener('click', () => {
    if (typeof opts.onShareLink === 'function') opts.onShareLink(c, { purpose: 'negotiate' });
    else if (typeof window.openShareModal === 'function') openShareModal(c, { purpose: 'negotiate' });
  });

  const send = host.querySelector('#nego-send');
  if (send) send.addEventListener('click', () => {
    /* WE ALREADY KNOW WHERE THIS GOES. With an address recorded, the send is a
       send — the same one-press act the counterparty's postbox has always been.
       Without one it still appears, and still works: it opens the dialog, which
       collects the address it needs. What must never happen is the press doing
       nothing, which is the dead end this whole thread began with. */
    if (side === 'owner' && opts.contact && opts.contact.email
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

  /* A BADGE IN THE MARGIN NARROWS THE INDEX TO ITS OWN CHANGE.

     Focusing already scrolled the index to the card and lit it. On a document
     with thirty changes that is not enough: the reader clicks #12, lands on
     #12, and is still looking at a column of twenty-nine other conversations
     they have to keep their place in. Clicking the badge now also FILTERS —
     one change, its thread, and a way back — and clicking the same badge again
     clears it, so the narrowing is never a state you can get stuck in. */
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
    const paneSel = '.nego-pane.working .nego-doc, .nego-doc[data-nego-working]';
    const openSelMenu = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.isCollapsed){ _negoKillSelMenu(); return; }
      const text = String(sel.toString() || '').trim();
      if (text.length < 3){ _negoKillSelMenu(); return; }
      const anchorNode = sel.anchorNode;
      const pane = anchorNode && anchorNode.nodeType === 1
        ? anchorNode.closest(paneSel)
        : (anchorNode && anchorNode.parentElement ? anchorNode.parentElement.closest(paneSel) : null);
      if (!pane || !host.contains(pane)){ _negoKillSelMenu(); return; }
      const clauseEl = (anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement)
        ?.closest('[data-clause]');
      if (!clauseEl){ _negoKillSelMenu(); return; }
      const clauseId = clauseEl.getAttribute('data-clause');
      let rect;
      try { rect = sel.getRangeAt(0).getBoundingClientRect(); } catch (e){ return; }
      if (!rect || (!rect.width && !rect.height)) return;
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
        opts.selMenu({ c, opts, text, clauseId, rect, side, again });
        return;
      }
      const menu = document.createElement('div');
      menu.className = 'nego-selmenu';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = `
        <div class="nego-selhead">Selected wording</div>
        <div class="nego-selquote">${_ne(text.length > 64 ? text.slice(0, 63) + '…' : text)}</div>
        ${NEGO_AI_ACTIONS.map(a =>
          `<button type="button" role="menuitem" data-nego-ai="${a.id}">${_ne(a.label)}</button>`).join('')}`;
      document.body.appendChild(menu);
      const box = menu.getBoundingClientRect();
      const at = _negoAnchor(rect, box.width, box.height);
      menu.style.left = at.left + 'px';
      menu.style.top = at.top + 'px';
      menu.querySelectorAll('[data-nego-ai]').forEach(b => b.addEventListener('mousedown', ev => {
        /* mousedown, not click: clicking first collapses the selection, and the
           proposal needs the words that were chosen. */
        ev.preventDefault(); ev.stopPropagation();
        const action = NEGO_AI_ACTIONS.find(a => a.id === b.getAttribute('data-nego-ai'));
        _negoKillSelMenu();
        if (action) negoAiPropose(c, { action, text, clauseId, rect, side, opts, again });
      }));
    };
    /* A MOUSEUP ON A CONTROL IS NOT A SELECTION GESTURE, and treating it as one
       made the Redline workbench's AI Assist flash and vanish. The clause
       toolbar sits inside this host, so pressing it fires this handler too;
       a tick later openSelMenu looked for a selection, found none — a click
       collapses one — and dismissed the menu the button's own click handler had
       just opened. The menu was removed by the gesture that asked for it.

       So the gesture is read first: pressing a button, a link or a field is
       somebody operating the page, not selecting words in it. The Doc Lab hit
       this and fixed it the same way (see fromControl in js/views/doclab.js);
       this is that fix on the engine the workbench actually files through. */
    const fromControl = t => !!(t && t.closest && t.closest(
      '.rl-tools, .rl-tool, .nego-tool, .nego-selmenu, .nego-aipop, #ai-panel, ' +
      '[data-nego-editor], button, a, input, textarea, select'));
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
      inp.addEventListener('keydown', e => { if (e.key === 'Enter'){ e.preventDefault(); send(); } });
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
      if (window.toast) toast('Nothing pending — every change is already resolved');
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
    if (!done){ if (window.toast) toast('Nothing moved — those changes are not yours to decide', 'err'); return; }
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
const negoIsRedeciding = id => !!_negoRedeciding[id];
function negoResetView(){ _negoActive = null; _negoThreads = {}; _negoRedeciding = {}; _negoOpenRounds = {}; _negoClean = false; negoSetComparePair('baseline', 'working'); }

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
/* THE DESIGN'S LAYOUT, APPLIED OVER THE ENGINE'S MARKUP.
   The workbench renders two documents side by side — the baseline and the
   working copy — because that is what the contract tab and the room are for,
   and a test is named for it ("both sides, one screen"). The design's Redline
   page shows the contract ONCE with the marks on it, and gives the freed width
   to the changes.
   That difference is presentational, so it is done here in CSS and scoped to
   .redline-page. negoPanesHtml is untouched, which is why the contract tab and
   the room keep both documents and their test keeps passing. The baseline is
   not lost from this page either: the working pane's own version selector still
   reaches it. */
function redlineLayoutCss(){
  if (document.getElementById('redline-layout-css')) return;
  const s = document.createElement('style');
  s.id = 'redline-layout-css';
  s.textContent = `
  /* The single type size the document canvas and the Tracked Changes column are
     both set from. It is the card size, which is the one the design sets its
     diffs at — see the note on .rl-clause-p. */
  .redline-page{--rl-type:11.5px}
  /* ---- THE HEADER IS A BAND, NOT A CARD ----
     It used to be drawn as a panel — surface fill, a 1px border, a radius and a
     card shadow — sitting inside a page that already has its own frame and
     18px of gutter. Two rounded edges a few pixels apart is the "double border"
     that reads as a box inside a box, and at the top of the page it is the
     first thing the eye lands on. The header carries a title, a round tag and
     the actions; none of that needs a container to be legible, so the container
     is gone and the row sits flat on the page beside the document below it. */
  .redline-page .rl-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;
    background:none;border:0;box-shadow:none;border-radius:0;padding:0 2px 2px;flex:none}
  .redline-page .rl-round{flex:none;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;
    background:var(--st-amber-bg);color:var(--st-amber-fg);border:1px solid color-mix(in srgb,#f59e0b 25%,transparent)}
  .redline-page .rl-segwrap{display:flex;align-items:center;gap:2px;background:var(--color-neutral-100);
    border:1px solid var(--color-divider);padding:3px;border-radius:9px}
  .redline-page .rl-seg{border:0;background:none;font:inherit;font-size:11px;font-weight:600;padding:4px 10px;
    border-radius:6px;cursor:pointer;color:var(--color-neutral-500);white-space:nowrap}
  .redline-page .rl-seg.on{background:var(--accent-solid);color:#fff;box-shadow:0 1px 3px rgba(15,23,42,.18)}
  .redline-page .rl-btn{border:1px solid transparent;font:inherit;font-size:11.5px;font-weight:700;padding:6px 12px;
    border-radius:9px;cursor:pointer;white-space:nowrap}
  .redline-page .rl-btn:disabled{opacity:.45;cursor:not-allowed}
  .redline-page .rl-btn-alt{background:color-mix(in srgb,#8b5cf6 12%,transparent);color:#6d28d9;
    border-color:color-mix(in srgb,#8b5cf6 32%,transparent)}
  html.dark .redline-page .rl-btn-alt{color:#c4b5fd}
  .redline-page .rl-btn-go{background:var(--accent-solid);color:#fff;
    box-shadow:0 4px 14px -4px color-mix(in srgb,var(--accent-solid) 60%,transparent)}

  /* ---- THE BATCH SEND, AND WHY IT FLASHES ----
     An unsent draft is the one state in this workbench that looks finished and
     is not: the change is filed, fingerprinted, sitting in the index with a
     Draft badge — and the counterparty has never seen it. The send for it used
     to live at the foot of the Tracked Changes head, below the fold on a busy
     contract. So it moves to the toolbar, it counts what is waiting, and it
     pulses until the count is zero.
     It renders ONLY when there is something unsent. A permanently flashing
     control is a control people stop seeing, and one that flashes over an empty
     queue is worse than none — it is an alarm with nothing behind it. */
  .redline-page .rl-btn-blast{background:#059669;color:#fff;border-color:#059669;
    box-shadow:0 4px 14px -4px rgba(5,150,105,.65);animation:rlBlast 1.5s ease-in-out infinite}
  .redline-page .rl-btn-blast:hover{background:#047857;animation:none}
  .redline-page .rl-btn-blast:disabled{animation:none}
  @keyframes rlBlast{
    0%,100%{box-shadow:0 4px 14px -4px rgba(5,150,105,.65);transform:translateY(0)}
    50%{box-shadow:0 0 0 4px rgba(5,150,105,.22),0 6px 18px -4px rgba(5,150,105,.8);transform:translateY(-1px)}
  }
  @media (prefers-reduced-motion:reduce){ .redline-page .rl-btn-blast{animation:none} }

  .redline-page .rl-root{flex:1;min-height:0;display:flex;flex-direction:column;gap:12px}
  .redline-page .rl-head{flex-wrap:nowrap;align-items:flex-start}
  .redline-page .rl-actions{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:nowrap}
  .redline-page .rl-btn{display:inline-flex;align-items:center;gap:6px}
  @media (max-width:1400px){ .redline-page .rl-head{flex-wrap:wrap} .redline-page .rl-actions{flex-wrap:wrap} }

  /* the wall — one line, replacing the engine's two banners */
  .redline-page .rl-wall{display:flex;align-items:flex-start;gap:9px;flex:none;
    background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:10px;
    padding:10px 14px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-700)}
  .redline-page .rl-wall-ic{flex:none;color:var(--st-amber-fg)}
  .redline-page .rl-wall b{color:var(--color-text)}
  /* the design carries one banner. The turn strip stays in the DOM but out of
     sight: it holds #nego-send, which the header's Publish Round presses. */
  .redline-page .rl-turnwrap{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

  /* ---- ONE SHEET, NOT A CARD INSIDE A CARD ----
     .rl-paper is the engine's .nego-doc, and that class draws a full panel of
     its own: paper fill, a 1px rule, a radius and a card shadow, at a 720px
     measure. Inside .rl-doc — which is already a framed, scrolling column —
     that produced a second bordered sheet floating within the first, with the
     page showing through the gutter between them.

     So the inner wrapper gives up its chrome entirely. The document is drawn
     directly onto the column: one continuous canvas from the title rule to the
     last clause, which is how the master prototype sets it — a single
     contract-page sheet, no nested frame. The column keeps the sheet's shadow,
     see .rl-doc below, so the paper still reads as paper. */
  .redline-page .rl-paper{padding:22px 24px 28px;max-width:none;
    background:none;border:0;border-radius:0;box-shadow:none;margin:0}
  /* ---- THE HUNDRED-PIXEL GUTTER DOWN THE LEFT ----
     The engine reserves it — padding-left:100px on .nego-pane.working
     .nego-doc — because in the room the fingerprint badges hang there, outside
     the text column. This page does not put them there: the design carries the
     ask inline, in .rl-asktag on the clause's own top row. So the gutter was
     holding nothing, and it was holding it asymmetrically: measured, the text
     sat 116px from the left edge of the column and 46px from the right.

     Written at four classes deep because the engine's rule is three, and this
     stylesheet is inserted BEFORE #nego-style in the head — at equal
     specificity the engine would win on order. The reference sets the sheet at
     p-6 (24px) all round; that is what this restores. */
  .redline-page .nego-pane.working .rl-paper{padding-left:24px;padding-right:24px}
  @media (max-width:1023px){
    .redline-page .nego-pane.working .rl-paper{padding-left:18px;padding-right:18px}
  }
  .redline-page .rl-paper-head{text-align:center;border-bottom:1px solid var(--color-divider);
    padding-bottom:14px;margin-bottom:18px}
  .redline-page .rl-paper-title{margin:0;font-size:19px;font-weight:700;letter-spacing:.01em}
  .redline-page .rl-paper-sub{margin:5px 0 0;font-size:11.5px;color:var(--color-neutral-500)}
  /* ---- AND A SECOND INSET INSIDE THE FIRST ----
     .rl-clause is also .nego-clause, which carries padding:10px 12px for the
     room's hover wash. Stacked on the sheet's own padding that put every line
     of the contract another 12px in from an edge it was already clear of, and
     10px of air above and below every clause on top of the margin between
     them. The reference sets an unchanged clause flush to the sheet and pads
     only the CHANGED ones — p-3, the frame that says something is on the table
     — which is what these two rules restore. */
  .redline-page .rl-clause{margin:0 0 16px;padding:0}
  .redline-page .rl-clause-h{margin:0 0 5px;font-size:var(--rl-type);font-weight:700;
    letter-spacing:.02em}
  /* ---- ONE TYPE SIZE FOR THE WHOLE WORKBENCH ----
     The contract read at one size and the Tracked Changes cards at another, so
     the SAME sentence — the clause on the left and the diff of it on the right
     — was set in two different faces of type, and the eye had to re-measure
     every time it crossed the gutter. --rl-type is the Tracked Changes card
     size, and the document canvas is now set from it: one declaration, both
     columns, and a change to it moves them together or not at all.
     Declared on the page rather than in :root so it cannot leak. */
  .redline-page .rl-clause-p,
  .redline-page .rl-doc .nego-doc,
  .redline-page .rl-doc .nego-body,
  .redline-page .rl-doc .rl-line{margin:0;font-size:var(--rl-type);line-height:1.72;color:var(--color-text)}
  .redline-page .rl-clause-p{margin:0}
  .redline-page .rl-propose{margin-top:7px;border:0;background:none;padding:0;cursor:pointer;
    font:inherit;font-size:11.5px;font-weight:600;color:var(--color-accent-600)}
  .redline-page .rl-propose:hover{text-decoration:underline}
  .redline-page .rl-clause.is-changed{background:color-mix(in srgb,#f59e0b 7%,transparent);
    border:1px solid color-mix(in srgb,#f59e0b 32%,transparent);border-radius:10px;padding:12px 14px}
  /* ---- WHERE "EDIT" LANDS YOU ----
     Pressing Edit on a card scrolls the document to that clause, and the clause
     has to say so when it arrives — a page that silently jumps has moved the
     reader somewhere without telling them which line to look at. The ring
     fades; the clause underneath it is untouched. */
  .redline-page .rl-clause.rl-jump{animation:rlJump 1.6s ease 1}
  @keyframes rlJump{
    0%{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent-solid) 55%,transparent)}
    70%{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent-solid) 30%,transparent)}
    100%{box-shadow:0 0 0 3px transparent}
  }
  @media (prefers-reduced-motion:reduce){ .redline-page .rl-clause.rl-jump{animation:none;
    box-shadow:0 0 0 2px color-mix(in srgb,var(--accent-solid) 45%,transparent)} }
  /* ---- WHO TOUCHED THIS WORDING ----
     Every marked span in the document carries a title naming the last hand on
     that edit. The cursor says the tooltip is there; without it a title is a
     thing you find by accident. */
  .redline-page .rl-doc ins[title],.redline-page .rl-doc del[title],
  .redline-page .rl-doc .nego-ins[title],.redline-page .rl-doc .nego-del[title]{cursor:help}
  .redline-page .rl-clause-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .redline-page .rl-asktag{flex:none;font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px;
    background:var(--st-amber-bg);color:var(--st-amber-fg)}

  /* the design's change cards */
  .redline-page .rl-cards{padding:12px}
  .redline-page .rl-cards-empty{padding:6px 2px;font-size:11.5px;line-height:1.6;color:var(--color-neutral-500);
    display:flex;flex-direction:column;gap:6px}
  .redline-page .rl-cards-empty b{color:var(--color-text)}
  .redline-page .rl-card{border:1px solid var(--color-divider);border-radius:10px;padding:11px 12px;
    margin-bottom:10px;background:var(--color-surface);cursor:pointer}
  .redline-page .rl-card:focus-visible{outline:2px solid var(--color-accent)}
  .redline-page .rl-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
  .redline-page .rl-card-id{font-family:var(--font-mono);font-size:11.5px;font-weight:700}
  .redline-page .rl-badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;white-space:nowrap}
  .redline-page .rl-badge-sent{background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .redline-page .rl-badge-draft{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .redline-page .rl-badge-ok{background:var(--st-green-bg);color:var(--st-green-fg)}
  .redline-page .rl-badge-no{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .redline-page .rl-card-meta{font-size:10.5px;color:var(--color-neutral-500);margin-bottom:7px;line-height:1.5}
  /* The same size as the clause it is a diff of — see --rl-type. */
  .redline-page .rl-card-diff{font-size:var(--rl-type);line-height:1.6}
  .redline-page .rl-card-note{margin-top:8px;padding:7px 9px;border-radius:7px;font-size:10.5px;line-height:1.5;
    background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .redline-page .rl-card-verbs{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px}
  .redline-page .rl-card-verbs button{flex:1;min-width:64px;border:0;border-radius:7px;padding:6px;font:inherit;
    font-size:11px;font-weight:700;cursor:pointer;transition:filter .15s}
  .redline-page .rl-card-verbs button:hover{filter:brightness(1.07)}
  /* ---- THE VERBS ARE COLOUR-CODED, AND THE CODE IS FIXED ----
     Accept is green, Reject is red, Edit is grey, Send is green. Written as
     literal hex rather than through the status tokens because those tokens
     re-map in dark mode — --st-green-fg becomes a light mint that is unreadable
     as a button fill — and a destructive verb that changes colour with the
     theme is a verb somebody presses by mistake. These four are the design's
     emerald-600 / red-600 / slate-200 / slate-800 exactly. */
  .redline-page .rl-acc,.redline-page .rl-send{background:#059669;color:#fff}
  .redline-page .rl-rej{background:#dc2626;color:#fff}
  .redline-page .rl-edit{background:#e2e8f0;color:#1e293b}
  html.dark .redline-page .rl-edit{background:#cbd5e1;color:#0f172a}
  /* Amber, past tense, inert — the send after it has gone. Full opacity
     despite being disabled: this is a STATE the reader is meant to read, not a
     control being withheld, and the browser's default greying-out would make
     the one card that has moved the hardest one to see. */
  .redline-page .rl-sent{background:#d97706;color:#fff;cursor:default}
  .redline-page .rl-card-verbs button.rl-sent:disabled{opacity:1}
  .redline-page .rl-card-verbs button.rl-sent:hover{filter:none}

  /* ---- THE LINK BETWEEN A CLAUSE AND ITS CARD ----
     Both ends light at once, whichever end was clicked, because the point of
     the pairing is that they are one thing shown twice. A ring rather than a
     fill: the clause already uses background to say "something is on the table
     here", and a second background would have two meanings competing in one
     box. */
  .redline-page .rl-clause.is-linked{box-shadow:0 0 0 2px var(--accent-solid)}
  .redline-page .rl-card.is-linked{box-shadow:0 0 0 2px var(--accent-solid);
    border-color:var(--accent-solid)}

  /* Tracked Changes head, and the discussion column */
  /* WRAPS, and two things now depend on it. It stops the title collapsing to
     zero when the row is over-subscribed, and it is what lets the send slot
     below take flex-basis:100% and break onto a line of its own — on a nowrap
     row that basis cannot break anything, it only makes the slot ask for the
     whole width and shrink back, which is the crowding it is there to end. */
  .redline-page .rl-idx-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:13px 14px;
    border-bottom:1px solid var(--color-divider)}
  .redline-page .rl-idx-head [hidden]{display:none!important}
  .redline-page .rl-disc-toggle,.redline-page .rl-disc-x{border:1px solid var(--color-divider);
    background:var(--color-neutral-100);border-radius:7px;padding:3px 8px;font:inherit;font-size:9.5px;
    font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--color-neutral-600);cursor:pointer}
  .redline-page .rl-disc-x{width:24px;height:24px;padding:0;line-height:1;font-size:13px;flex:none}
  .redline-page .rl-sendslot:empty{display:none}
  /* ---- THE SEND SLOT GETS ITS OWN LINE ----
     #nego-send is hidden on this page (the design carries that act in the page
     header as Publish Round), but the sentence underneath it — "Held on this
     page until you send. Nothing has reached <them> yet." — is not, and it is
     worth keeping: it is the only thing on the screen that says an unsent draft
     exists. margin-left:auto put that whole sentence on the title's row, where
     it squeezed "Tracked Changes" the moment there was a draft to describe.
     flex-basis:100% breaks it onto a line of its own instead. */
  .redline-page .rl-sendslot{flex-basis:100%;margin-left:0}
  /* The slot's contents come from the room, where they sit at the foot of a
     scrolling index and earn a rule and 9px of air above them. Here they are
     already a separate row under a border, so the room's spacing doubles the
     gap — and the rule itself is drawn in --n-line, a room token that does not
     resolve on this page, so it was never painting anything anyway. */
  .redline-page .rl-sendslot .nego-index-send{margin-top:0;padding-top:0;border-top:0}

  .redline-page .rl-thread{border:1px solid var(--color-divider);border-radius:10px;padding:11px 12px;
    margin-bottom:10px;background:var(--color-surface)}
  .redline-page .rl-thread.is-internal{background:color-mix(in srgb,#f59e0b 6%,transparent);
    border-color:color-mix(in srgb,#f59e0b 30%,transparent)}
  .redline-page .rl-thread-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
  .redline-page .rl-vis{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px}
  .redline-page .rl-vis.sh{background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .redline-page .rl-vis.int{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .redline-page .rl-thread-state{font-size:9.5px;font-weight:700;padding:2px 7px;border-radius:5px;
    background:var(--color-neutral-100);color:var(--color-neutral-600)}
  .redline-page .rl-thread-ref{font-size:10.5px;color:var(--color-neutral-500);margin-bottom:8px}
  .redline-page .rl-msg{margin-bottom:9px}
  .redline-page .rl-msg-top{display:flex;align-items:baseline;justify-content:space-between;gap:8px;
    font-size:11px;margin-bottom:2px}
  .redline-page .rl-msg-top span{color:var(--color-neutral-500);font-size:10px}
  .redline-page .rl-msg p{margin:0;font-size:11.5px;line-height:1.6;color:var(--color-text)}
  .redline-page .rl-reply,.redline-page .rl-starter{margin-top:9px}
  .redline-page .rl-starter{border-top:1px solid var(--color-divider);padding:11px 14px;flex:none}
  .redline-page .rl-reply-row{display:flex;align-items:center;gap:6px}
  .redline-page .rl-reply-row input{flex:1;min-width:0;border:1px solid var(--color-divider);
    background:var(--color-neutral-100);border-radius:8px;padding:6px 10px;font:inherit;font-size:11.5px;
    color:inherit;outline:none}
  .redline-page .rl-reply-row input:focus{border-color:var(--color-accent-500)}
  .redline-page .rl-reply-row button{flex:none;width:28px;height:28px;border:0;border-radius:8px;
    background:var(--accent-solid);color:#fff;cursor:pointer;font-size:13px}
  .redline-page .nego-visswitch{display:flex;gap:4px;margin-bottom:6px}
  .redline-page .nego-visswitch button{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:7px;padding:3px 8px;font:inherit;font-size:10px;font-weight:600;cursor:pointer;
    color:var(--color-neutral-600)}
  .redline-page .nego-visswitch button[aria-pressed="true"]{background:var(--accent-solid);color:#fff;
    border-color:var(--accent-solid)}
  .redline-page .rl-starter-note{margin:7px 0 0;font-size:10px;line-height:1.5;color:var(--color-neutral-500)}
  /* ---- THE DESIGN'S TWELVE COLUMNS ----
     The reference is lg:grid-cols-12 with lg:col-span-6 / 3 / 3, and the
     fold re-deals it to 8 / 4. This used to approximate that with fractions
     (1.9fr / .85fr / .9fr → 1.9fr / .95fr), which is close enough to look
     right in a screenshot and wrong under measurement: the document took .518
     of the row where the design gives it exactly .5, and the fold landed on
     .667 only by coincidence of the gap arithmetic. Twelve real columns with
     integer spans make the ratio exact at any width, and — more usefully —
     make it something a test can assert rather than eyeball.

     minmax(0,1fr) on the track, not 1fr: a grid column holding a contract will
     not otherwise shrink below its longest unbroken line, and the third column
     gets pushed off the row instead of the text wrapping. */
  .redline-page .rl-grid{flex:1;min-height:0;display:grid;gap:14px;
    grid-template-columns:repeat(12,minmax(0,1fr));align-items:stretch}
  .redline-page .rl-doc{grid-column:span 6}
  .redline-page #rl-changes-col{grid-column:span 3}
  .redline-page #rl-disc-col{grid-column:span 3}
  /* Folded away, the discussion gives its three columns to the other two —
     8 / 4, the design's own split. display:none rather than a zero span: a
     collapsed grid child still claims a track and would leave a dead gutter. */
  .redline-page.disc-off #rl-disc-col{display:none}
  .redline-page.disc-off .rl-doc{grid-column:span 8}
  .redline-page.disc-off #rl-changes-col{grid-column:span 4}
  /* Focus mode is GONE — the toggle, the state and the twelve-column override
     with it. It gave the document the whole row by hiding the other two
     columns, which is the fold's job done twice: the discussion already folds
     to 8/4, and hiding the Tracked Changes column as well leaves the workbench
     with nothing to work on. It also had to be undone from three other places
     — tagging a note, jumping to a clause, linking a card — each of which had
     to remember to switch it off before it could reach a column that focus
     mode had hidden. One less state, three fewer things to remember. */

  /* ---- THE CLAUSE TOOLBAR: AN OVERLAY, REVEALED ON HOVER ----
     The contract reads clean until the reader is over a clause; then the three
     verbs appear at its lower right corner.

     The history matters, because this rule has been wrong twice in opposite
     directions. It began as opacity:0-until-hover IN THE FLOW: invisible, but
     still occupying a measured 26px row under every clause, which was the
     empty vertical air a review rightly complained about. The fix made the
     tools permanently visible, which closed the gap and opened the opposite
     complaint: three buttons repeating under every clause is not a clean
     document.

     This version holds both requirements at once by taking the toolbar OUT of
     the flow. position:absolute costs zero height, so the clauses sit at
     their 16px gaps with nothing reserved; and because nothing is in the
     flow, revealing it moves nothing — no reflow under the pointer, no text
     jumping as the reader moves down the page.

     Revealed on :hover and on :focus-within, never on hover alone: a person
     tabbing through the page reaches the same verbs, and focusing one is
     itself what reveals the row it sits in. pointer-events is gated with the
     opacity so an invisible button can never swallow a click aimed at the
     text beneath it. */
  .redline-page .rl-clause{position:relative}
  .redline-page .rl-tools{position:absolute;right:6px;bottom:-9px;z-index:3;margin:0;
    display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;
    opacity:0;pointer-events:none;transition:opacity .15s ease}
  .redline-page .rl-clause:hover .rl-tools,
  .redline-page .rl-clause:focus-within .rl-tools{opacity:1;pointer-events:auto}
  /* On a touch screen there is no hover, so hidden tools would be unreachable
     tools — the objection test/f44 records against hover-only controls.
     There, and only there, they return to the flow and stay visible: the
     trade against a busier page is forced, the trade against unusable tools
     is not. */
  @media (hover:none){
    .redline-page .rl-tools{position:static;opacity:1;pointer-events:auto;margin-top:7px}
  }
  .redline-page .rl-tool{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:999px;padding:2px 9px;font:inherit;font-size:10px;font-weight:600;line-height:1.6;
    color:var(--color-neutral-600);cursor:pointer;white-space:nowrap;
    transition:border-color .15s,color .15s,background .15s}
  .redline-page .rl-tool:hover{border-color:var(--accent-solid);color:var(--color-text);
    background:var(--color-neutral-100)}
  .redline-page .rl-tool:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  .redline-page .rl-btn-ghost{background:var(--color-neutral-100);color:var(--color-neutral-600)}
  .redline-page .rl-btn-ghost[aria-pressed="true"]{background:var(--accent-solid);color:#fff;
    border-color:var(--accent-solid)}

  /* The design keeps all three columns from lg (1024px) up. This used to
     drop the discussion below 1500px, which hid the whole third column on a
     13" laptop — the most common screen this is read on. Below lg the design
     stacks to one column and the page scrolls, so the inner panes give their
     scroll back to the page rather than trapping the gesture. */
  @media (max-width:1023px){
    .redline-page .rl-grid{grid-template-columns:minmax(0,1fr);height:auto}
    .redline-page .rl-doc,.redline-page #rl-changes-col,.redline-page #rl-disc-col{
      grid-column:auto;min-height:280px}
    .redline-page.disc-off .rl-doc,.redline-page.disc-off #rl-changes-col{grid-column:auto}
  }
  .redline-page .rl-col{background:var(--color-surface);border:1px solid var(--color-divider);
    border-radius:12px;box-shadow:var(--shadow-sm);min-height:0;overflow:hidden;display:flex;flex-direction:column}
  /* The document column IS the sheet — the only frame around the contract text.
     No border: the prototype's contract-page is a shadowed page, not a boxed
     panel, and a rule here would put an edge line back around wording that
     already sits inside .rl-paper's own margins. */
  .redline-page .rl-doc{background:var(--color-surface);border:0;border-radius:12px;
    box-shadow:0 10px 30px rgba(15,23,42,.10);min-height:0;overflow:hidden;
    display:flex;flex-direction:column}
  html.dark .redline-page .rl-doc{box-shadow:0 10px 30px rgba(0,0,0,.45)}
  .redline-page .rl-doc .nego-scroll{flex:1;min-height:0;overflow-y:auto;padding:8px 4px}
  .redline-page #rl-changes-col{border-radius:12px}
  .redline-page #rl-changes-col h3{font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--color-neutral-500);font-weight:700}
  /* the header carries these; a second pair here would be two controls for one action */
  .redline-page .nego-bulk{display:none!important}
  .redline-page #nego-send{display:none!important}
  /* An EMBED has no header to carry them, so the bulk verbs come back to the
     column head there — "I agree to all of it" is a real answer, and on the
     counterparty's page this is the only surface it can live on. */
  .redline-page.rl-embed .nego-bulk{display:flex!important;gap:6px;flex-basis:100%}
  .redline-page.rl-embed .nego-bulk button{flex:1;border:0;border-radius:7px;padding:6px 9px;
    font:inherit;font-size:10.5px;font-weight:700;cursor:pointer}
  .redline-page.rl-embed .nego-bulk .b-acc{background:#059669;color:#fff}
  .redline-page.rl-embed .nego-bulk .b-rej{background:#e2e8f0;color:#1e293b}
  .redline-page.rl-embed .nego-bulk button:disabled{opacity:.45;cursor:not-allowed}

  .redline-page .rl-disc-head{display:flex;align-items:center;gap:8px;padding:13px 14px 9px;
    border-bottom:1px solid var(--color-divider);flex:none}
  .redline-page .rl-disc-head h3{margin:0;font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--color-neutral-500);font-weight:700}
  .redline-page .rl-disc-n{font-size:10.5px;font-weight:700;color:var(--color-accent-600)}
  /* The collapse control sits at the right edge, not wherever the thread count
     happens to end. #rl-thread-count renders empty on a contract with no
     threads yet, and without this the chevron slid left to hug the title —
     a different header on an empty contract than on a busy one. */
  .redline-page .rl-disc-head .rl-disc-x{margin-left:auto}
  .redline-page .rl-disc-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px}
  .redline-page .rl-disc-empty{padding:14px;font-size:11.5px;line-height:1.6;color:var(--color-neutral-500)}
  `;
  document.head.appendChild(s);
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
/* Statuses that are still ours to move. Anything else has left our hands. */
const RL_DEMOTABLE = new Set(['Under Review']);
function redlineEvict(nextId, opts = {}){
  const prev = _redlineHeldId;
  if (!prev || prev === nextId) return null;
  const c = (typeof getContract === 'function') ? getContract(prev) : null;
  if (!c) return null;
  if (!RL_DEMOTABLE.has(c.status)) return null;
  const from = c.status;
  c.status = 'Draft';
  c.lastAction = (window.todayStr ? todayStr() : c.lastAction);
  if (window.logAudit) logAudit(c, 'Lifecycle',
    `Moved from ${from} back to Draft — the redline workbench took on ${nextId || 'another contract'},`
    + ' and the bench holds one agreement at a time');
  if (opts.persist !== false && window.persist) persist(c);
  if (window.toast) toast(`${c.name} moved back to Draft — the workbench now holds ${
    (typeof getContract === 'function' && getContract(nextId) || {}).name || 'another contract'}`);
  return c;
}
/* Bring a contract to the bench. The one entry point, so the eviction cannot
   be skipped by a caller that sets state.activeId and calls setView itself. */
function openRedlineWorkbench(id, opts = {}){
  const target = String(id == null ? '' : id) || (window.state && state.activeId);
  if (!target) return false;
  redlineEvict(target, opts);
  if (window.state) state.activeId = target;
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
  const o = { ...opts, side, discOff: opts.discOff != null ? opts.discOff : _redlineDiscOff() };
  /* .redline-page carries every rule this layout is drawn with; without it the
     mount renders as unstyled stacked divs. The height bound matters just as
     much: the three columns scroll INSIDE themselves, and columns with no
     bounded ancestor grow to their content instead of scrolling. */
  el.innerHTML = `<div class="redline-page rl-embed${o.discOff ? ' disc-off' : ''}"
    style="display:flex;flex-direction:column;gap:12px;min-height:0;height:${_nea(o.height || 'min(880px, 84vh)')};">
    ${redlinePanesHtml(c, o)}
  </div>`;
  /* The disc-off class lives on #view-redline for the page and on the embed
     root here; rlToggleDiscussion targets #view-redline, so the embed wires
     its own fold against its own root. */
  const root = el.firstElementChild;
  el.querySelectorAll('[data-redline-disc]').forEach(b => b.addEventListener('click', () => {
    const off = !root.classList.contains('disc-off');
    try { localStorage.setItem(RL_DISC_KEY, off ? '1' : '0'); } catch (e) {}
    root.classList.toggle('disc-off', off);
    const chip = el.querySelector('#rl-disc-show');
    if (chip) chip.hidden = !off;
  }));
  if (!el.id) el.id = 'rl-embed-' + (++_rlEmbedSeq);
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
  return true;
}

function renderRedline(){
  const host = document.getElementById('content');
  if (!host) return;
  redlineLayoutCss();
  const c = (typeof getContract === 'function') ? getContract(state.activeId) : null;
  /* Recorded on the paint, not on the navigation: however the reader arrived —
     the tab, the register, a link — the bench now knows what is on it. */
  _redlineHeldId = c ? c.id : null;
  if (!c){
    host.innerHTML = `
      <div class="view-enter" style="padding:16px 18px 28px;">
        <section style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px;padding:34px;text-align:center;">
          <div style="width:44px;height:44px;margin:0 auto 12px;border-radius:12px;background:var(--tile-amber-bg);color:var(--tile-amber-fg);display:grid;place-items:center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
          </div>
          <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;">No contract open</h3>
          <p style="margin:0 0 16px;font-size:12.5px;color:var(--color-neutral-600);max-width:46ch;margin-inline:auto;line-height:1.6;">
            The redline workbench negotiates a specific agreement — open one from the register and its changes, rounds and discussion land here.
          </p>
          <button data-open-register class="ui-btn ui-btn-primary" style="padding:8px 16px;">Open the register</button>
        </section>
      </div>`;
    host.querySelectorAll('[data-open-register]').forEach(el => el.addEventListener('click', () => {
      if (window.regState){ const R = regState(); R.stage = 'all'; R.sel = {}; }
      setView('register');
    }));
    return;
  }
  const side = _redlineSide === 'counterparty' ? 'counterparty' : 'owner';
  const seg = (v, label) => `<button data-redline-side="${v}" class="rl-seg${side === v ? ' on' : ''}">${label}</button>`;
  /* ---- THE BATCH SEND ----
     Drawn only when there is something behind the wall, and labelled with how
     much. It is a proxy onto #nego-send like Publish Round is — the same one
     act, taking the same route through the share/response flow — so pressing it
     publishes every unsent draft in one go rather than opening a queue of
     confirmations. See redlineSyncProxies for why a proxy can go dead. */
  const unsentN = (window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).length;
  /* Whose postbox the batch send presses. The owner's is #nego-send; acting
     as the counterparty the engine renders #nego-send-decisions instead, and
     a proxy aimed at the wrong one is a button that dies the moment the view
     flips — which is what it did: Send All worked in Internal View and went
     dead in Counterparty View, found in the six-round simulation. */
  const sendTarget = side === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
  const sendWho = side === 'counterparty' ? (window.FIRST_PARTY || 'the owner')
    : (c.counterparty || 'the counterparty');
  /* ONE TEXT NODE, and both halves of that matter. Written on one line because
     a newline in inline text renders as a space; and the count is NOT wrapped
     in a span, because .rl-btn is an inline-flex row with gap:6px — a wrapped
     number becomes a flex item and the gap paints as "Send All ( 1 ) Redline".
     The count is read from the label rather than from a hook precisely so the
     label can stay one string. */
  const blast = unsentN ? `<button data-redline-proxy="${sendTarget}" data-rl-blast class="rl-btn rl-btn-blast"`
    + ` title="Publish every unsent redline to ${_nea(sendWho)} in one action">`
    + `&#9889; Send All (${unsentN}) Redline${unsentN === 1 ? '' : 's'}</button>` : '';
  /* ---- CLOSING THE ROUND, FROM THE PAGE THE ROUND IS WORKED ON ----
     negoAdvanceRound archives the decided changes onto the round record and
     makes the agreed wording the next baseline — the "clean public diff" a
     finished round folds down to. The only control that reached it lived in
     the ROOM (#nego-to-docs), which this page does not render, so a
     negotiation finished HERE could never be closed here: every change
     decided, and no way to finalise. Offered exactly when it is true — every
     change answered, and at least one on the table — and behind the same
     naming dialog the room uses, because closing is irreversible. */
  const prog = (typeof negoProgress === 'function') ? negoProgress(c)
    : { pending: 0, total: 0 };
  const closer = (!prog.pending && prog.total && side === 'owner')
    ? `<button data-rl-close-round class="rl-btn rl-btn-go" title="Archive this round's decisions and make the agreed wording the new baseline">&#10003; Close Round ${negoRound(c)}</button>` : '';
  host.innerHTML = `
    <!-- The reference is lg:h-full: the workbench fills the window and each of
         its three columns scrolls inside itself, rather than the page growing
         past the viewport and taking the whole thing with it. --view-h is the
         room the shell actually leaves, measured after the header renders. -->
    <div id="view-redline" class="view-enter redline-page${_redlineDiscOff() ? ' disc-off' : ''}" style="height:var(--view-h);box-sizing:border-box;display:flex;flex-direction:column;gap:14px;padding:16px 18px 18px;min-height:0;">
      <section class="rl-head">
        <div class="rl-head-id" style="min-width:0;">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;">
            <h3 style="margin:0;font-size:15px;font-weight:700;">Redline Workbench — ${esc(c.name)}</h3>
            <span class="rl-round">${esc(redlineRoundLabel(c))}</span>
          </div>
          <p style="margin:3px 0 0;font-size:11px;color:var(--color-neutral-500);">
            Negotiate wording without leaking your position — internal notes and unsent drafts never reach the counterparty.
          </p>
        </div>
        <div class="rl-actions">
          ${blast}
          <div class="rl-segwrap">${seg('owner', 'Internal View')}${seg('counterparty', 'Counterparty View')}</div>
          <button data-redline-proxy="nego-bulk-acc" class="rl-btn rl-btn-alt">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 9-9"/><path d="M15 4V2M15 10V8M11 6h2M17 6h2M19 13v-2M19 17v-2M17 15h2M21 15h-2"/><path d="m14 7-1.5 1.5a2.1 2.1 0 0 0 0 3l.5.5a2.1 2.1 0 0 0 3 0L17.5 10"/></svg>
            Accept All Non-Risk</button>
          <button data-redline-proxy="${sendTarget}" class="rl-btn rl-btn-go">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            Publish Round</button>
          ${closer}
        </div>
      </section>
      <div id="redline-host" style="flex:1;min-height:0;display:flex;flex-direction:column;"></div>
    </div>`;
  host.querySelectorAll('[data-redline-open-doc]').forEach(el =>
    el.addEventListener('click', () => { if (window.openWorkspace) openWorkspace(c.id); }));
  host.querySelectorAll('[data-redline-side]').forEach(el =>
    el.addEventListener('click', () => { _redlineSide = el.getAttribute('data-redline-side'); renderRedline(); }));
  /* The header's two actions are the design's, but they are not second copies
     of anything: each one presses the engine's own control, which is the only
     thing that can actually accept a change or publish a round. If the engine
     has not rendered that control — nothing pending, or the other side's turn —
     the header button disables itself rather than lying about what it can do. */
  host.querySelectorAll('[data-redline-proxy]').forEach(el =>
    el.addEventListener('click', () => {
      const target = document.getElementById(el.getAttribute('data-redline-proxy'));
      if (target && !target.disabled) target.click();
    }));

  /* The page's OWN three columns — document, tracked changes, discussion — not
     the two-pane comparison the contract tab renders. The engine still supplies
     every piece of content and every handler: negoDocHtml draws the marked-up
     clauses, negoCardsHtml draws the change cards, and the element ids the
     wiring looks for are all present, so wireNegotiationTab binds to this
     layout exactly as it binds to its own. */
  const mount = document.getElementById('redline-host');
  negoEnsureStyle();
  const opts = { hostId: 'redline-host', side, discOff: _redlineDiscOff(),
    messages: c._messages || [], seenScope: c.id,
    shares: (window.cachedShares ? cachedShares(c) : []), onChange(){ if (window.persist) persist(c); },
    /* Highlighting wording on this page drives the SIDE PANEL, never a
       standalone popover with a dialog behind it. rlSelMenu is the only floating
       layer left here, and it is a three-item menu that dismisses itself the
       moment one is chosen — everything it hands off to lands either in the
       Copilot column or in the Discussion column. */
    selMenu: ctx => rlSelMenu({ ...ctx, c, opts, again: () => renderRedline() }),
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
    async onSendDirect(){
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
        negoHandOver(c, { to: 'counterparty', by: opts.by || (window.currentUser && currentUser()?.name) });
        if (window.persist) persist(c);
        if (window.toast) toast(out && out.delivered
          ? `Sent to ${to} — it is now their turn`
          : `Published to ${to}'s link — it is now their turn. Send them the link if it was not emailed.`,
          out && out.delivered ? undefined : 'err');
      }catch(err){
        btns.forEach(b => { b.disabled = false; });
        if (window.toast) toast(`Could not send to ${to} — ${(err && err.message) || err}`, 'err');
        return;
      }
      renderRedline();
    },
    /* ---- ACTING AS THE COUNTERPARTY, THE TABLE STILL TURNS ----
       The engine's index renders #nego-send-decisions for the counterparty
       side only when told what is waiting (their new asks, their undecided
       answers) — this page told it nothing, so Counterparty View had no way
       to hand the contract back and the six-round loop stalled at round two.
       Both counts come off the record: asks from negoUnsentAsks, decisions
       from resolvedAt landing after the last hand-over. */
    pendingProposals: side === 'counterparty'
      ? (window.negoUnsentAsks ? negoUnsentAsks(c, 'counterparty') : []).length : 0,
    pendingDecisions: side === 'counterparty'
      ? negoChanges(c).filter(x => (x.status === 'accepted' || x.status === 'rejected')
          && x.authorSide === 'owner'
          && String(x.resolvedAt || '') > String((c.negotiation && c.negotiation.turnAt) || '')).length : 0,
    org: window.FIRST_PARTY || 'the owner',
    /* Handing back FROM the table is a turn move, not a share: both sides of
       this toggle read the same record, so the decisions and counter-asks are
       already on it — what travels is whose turn it is. The real counterparty
       page (the portal) keeps its own send, which posts a response payload;
       this one exists for the negotiation table the workbench is. */
    onSendDecisions(){
      const who = window.FIRST_PARTY || 'the owner';
      if (!negoHandOver(c, { to: 'owner', by: c.counterparty || 'Counterparty' })){
        if (window.toast) toast('It is already their turn', 'err');
        return;
      }
      if (window.persist) persist(c);
      if (window.toast) toast(`Handed back to ${who} — it is now their turn`);
      renderRedline();
    },
    rerender: () => renderRedline() };
  mount.innerHTML = redlinePanesHtml(c, opts);
  wireNegotiationTab(c, opts);
  negoAfterPaint(c, opts, mount);
  host.querySelectorAll('[data-redline-disc]').forEach(el =>
    el.addEventListener('click', () => rlToggleDiscussion()));
  /* #nego-send-decisions is wired by the ROOM's action bar, which this page
     does not mount — so the counterparty postbox is bound here, to the same
     hook the room would call. */
  if (side === 'counterparty'){
    const back = document.getElementById('nego-send-decisions');
    if (back && !back.dataset.rlWired){
      back.dataset.rlWired = '1';
      back.addEventListener('click', () => opts.onSendDecisions());
    }
  }
  /* Closing the round — the naming dialog first, because it is irreversible:
     the decided changes fold into the round history and the agreed wording
     becomes the baseline the next round is measured against. */
  host.querySelectorAll('[data-rl-close-round]').forEach(el =>
    el.addEventListener('click', async () => {
      if (window.negoConfirmCloseRound && !await negoConfirmCloseRound(c)) return;
      const r = negoAdvanceRound(c, { by: opts.by || (window.currentUser && currentUser()?.name) });
      if (!r){ if (window.toast) toast('The round cannot close with changes still pending', 'err'); return; }
      if (window.persist) persist(c);
      if (window.toast) toast(`Round ${r.n} closed — the agreed wording is the new baseline for round ${negoRound(c)}`);
      renderRedline();
    }));
  rlWireClauseTools(c, host, opts);
  redlineSyncProxies(host);
}

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
     ✂️ Shorten & Simplify — already carries its instruction, so it goes
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
  { id: 'rephrase', label: '✨ Rephrase with Copilot', converse: true,
    ask: 'Rewrite this contract wording as the drafter asks, while staying commercially reasonable and enforceable under Kenyan law.',
    greeting: 'How would you like me to help rephrase this passage?' },
  { id: 'shorten', label: '✂️ Shorten & Simplify',
    ask: 'Rewrite this contract wording more concisely and in plainer language, without changing its legal effect. Keep defined terms exactly as they are.' },
  { id: 'tag', label: '🏷️ Tag with internal note', tag: true }
];
function rlSelActions(){ return RL_SEL_ACTIONS.slice(); }

/* Say something in the Copilot panel without asking a model anything. Used for
   every refusal on this path, because a refusal belongs in the conversation the
   reader just opened rather than in a toast that is gone in four seconds. */
function rlSayInPanel(text){
  if (window.openAI) openAI(null, { docked: true });
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
  const actions = rlSelActions();
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
    if (action.tag){ rlTagInternalNote(ctx); return; }
    rlAiPropose({ ...ctx, action });
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
     for as long as the round trip takes, and permanently if it fails. */
  if (window.openAI) openAI(null, { docked: true });
  /* What was asked, in the reader's own stream — otherwise the panel answers a
     question it never shows, and the Copilot reads as volunteering wording
     nobody asked for. */
  if (window.aiPush) aiPush('user', { text: `${_ne(action.label)}<div style="font-size:11px;margin-top:4px;opacity:.8;font-style:italic">“${
    _ne(text.length > 140 ? text.slice(0, 139) + '…' : text)}”</div>` });
  if (window.renderAIFeed) renderAIFeed(!action.converse);

  if (!window.copilotAvailable || !copilotAvailable() || !window.copilotPropose){
    rlSayInPanel('The Copilot is not connected on this workspace yet, so there is nothing to ask. Connect it under Team & Settings and try again — the wording you selected is untouched.');
    return;
  }
  const cl = window.negoClauseById ? negoClauseById(c, clauseId) : null;
  if (!cl){ rlSayInPanel('That clause is no longer in the document, so there is nothing to rewrite. Nothing was changed.'); return; }
  /* THE SELECTION HAS TO BE FINDABLE IN THE CLAUSE, and it is checked before a
     token is spent. The old fallback for a miss was to swap the whole clause
     for whatever came back, which loses wording nobody agreed to lose. */
  const clauseText = String(cl.text || '');
  const whole = String(text).trim() === clauseText.trim();
  if (!whole && !clauseText.includes(text)){
    rlSayInPanel('That selection spans wording already marked as changed, so it cannot be placed back into the clause safely. Decide the pending change first, or select from a settled part of the clause. Nothing was changed.');
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
  const applyWording = wording => {
    const live = window.negoClauseById ? negoClauseById(c, clauseId) : null;
    if (!live) return { ok: false, message: 'That clause is no longer in the document. Nothing was changed.' };
    const nowText = String(live.text || '');
    const isWhole = String(text).trim() === nowText.trim();
    if (!isWhole && !nowText.includes(text))
      return { ok: false, message: 'That passage has moved since the panel opened, so the wording cannot be placed back safely. Nothing was changed.' };
    const proposed = isWhole ? String(wording)
      : nowText.slice(0, nowText.indexOf(text)) + String(wording) + nowText.slice(nowText.indexOf(text) + text.length);
    if (proposed === nowText) return { ok: false, message: 'That wording matches the clause already — nothing was filed.' };
    const html = window.negoRichFromLines ? negoRichFromLines(proposed) : `<p>${_ne(proposed)}</p>`;
    /* Awaited nowhere the card can see it, so the card settles immediately and
       the toast reports what actually happened. */
    Promise.resolve(negoEditClause(c, clauseId, html, { side, author: opts && opts.by,
      note: `Copilot — ${action.label.replace(/^\S+\s/, '')}` }))
      .then(ch => {
        if (!ch){ if (window.toast) toast('That wording matches the clause already — nothing filed'); return; }
        if (window.negoInvalidateVerification) negoInvalidateVerification(c);
        if (opts && opts.persist !== false && window.persist) persist(c);
        if (window.toast) toast(`#${ch.id} filed from the Copilot — it is a proposal until the other side answers it`);
        again();
      })
      .catch(err => { if (window.toast) toast(`Could not file that change: ${(err && err.message) || err}`, 'err'); });
    return { ok: true };
  };

  const refine = async (instruction, prev, extra) => {
    const made = await copilotPropose({ ask: action.ask, passage: text, party,
      playbook: pbLine, instruction, history: (extra && extra.history) || '' });
    if (!made) return null;
    return { advice: made.advice, proposedText: made.proposedText, strict: made.strict,
      clauseLabel: negoClauseLabel(cl), replacing: text, onApply: applyWording, onRefine: refine };
  };
  const propose = async instruction => {
    const made = await copilotPropose({ ask: action.ask, passage: text, party,
      playbook: pbLine, instruction: instruction || '' });
    if (!made) return false;
    const card = window.aiOpenProposal ? aiOpenProposal({ advice: made.advice,
      proposedText: made.proposedText, strict: made.strict,
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
      greeting: action.greeting, onPropose: instruction => propose(instruction) });
    return;
  }
  try{
    if (!await propose('')) rlSayInPanel('The Copilot returned nothing usable. Nothing was changed.');
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
function rlTagInternalNote(ctx){
  const { c, clauseId } = ctx;
  const quote = String(ctx.text || '').trim();
  const changes = (typeof negoChanges === 'function') ? negoChanges(c) : [];
  const changeId = ctx.changeId
    || (changes.find(x => x.clauseId === clauseId && _rlIsLive(x))
      || changes.find(x => x.clauseId === clauseId && x.status !== 'superseded') || {}).id;
  if (!changeId){
    if (window.toast) toast('Propose an edit on this clause first — a note attaches to a change', 'err');
    return false;
  }
  /* Unfolding first: the composer is in the discussion column, and focusing an
     input inside a display:none column silently does nothing. On the owner's
     page the fold lives on #view-redline; on a mount it lives on the embed's
     own root, and both are cleared the same way. */
  const unfold = () => {
    rlToggleDiscussion(false);
    const root = (ctx.host && ctx.host.querySelector && ctx.host.querySelector('.rl-embed'))
      || document.querySelector('.redline-page.rl-embed');
    if (root){ root.classList.remove('disc-off');
      const chip = root.querySelector('#rl-disc-show'); if (chip) chip.hidden = true; }
  };
  unfold();
  /* THE COMPOSER MAY BE AIMED AT A DIFFERENT CHANGE. A change with no thread
     yet has no reply box of its own — the column's one starter serves the
     first silent change, and this note may be about the third. Found during
     the six-round simulation: tagging a note on any silent change that was
     not silent[0] found no input and silently did nothing. So the change is
     NOMINATED and the column repainted; the starter honours the nomination
     (see redlineDiscussionHtml) and the input exists by the time it is
     focused below. */
  if (!document.getElementById('nego-ti-' + changeId)){
    _rlStarterFor = changeId;
    if (typeof ctx.rerender === 'function') ctx.rerender(); else renderRedline();
    unfold();
  }
  /* Internal, pressed for them. The visibility switch defaults to shared on a
     reply, and a note tagged from the document is by name an internal one —
     leaving the reader to notice and flip it is how a private remark reaches
     the counterparty. */
  document.querySelectorAll(`[data-nego-vis][data-for="${_nea(changeId)}"]`).forEach(b =>
    b.setAttribute('aria-pressed', String(b.getAttribute('data-nego-vis') === 'internal')));
  const input = document.getElementById('nego-ti-' + changeId);
  if (!input) return false;
  if (quote && !input.value)
    input.value = `“${quote.length > 90 ? quote.slice(0, 89) + '…' : quote}” — `;
  if (input.scrollIntoView) input.scrollIntoView({ block: 'center', behavior: 'smooth' });
  if (input.focus) input.focus();
  if (input.setSelectionRange) { try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) {} }
  return true;
}

/* ---------- THE CLAUSE AND ITS CARD ARE ONE THING SHOWN TWICE ----------
   Two columns showing the same change, and until now neither knew about the
   other: clicking a clause lit nothing in the index, and clicking a card lit
   nothing in the document. On a contract with a dozen asks that meant reading
   a card, scrolling the document by eye to find which clause it was about, and
   losing your place in the column doing it — twice, because the way back was
   the same search in reverse.

   So both ends light together, and whichever one was NOT clicked is scrolled
   to. Scrolling the one that was clicked would yank the thing under the
   reader's pointer out from under it: they can already see that one, it is
   what they just pressed.

   The engine's own negoFocus is not used here and cannot be: it finds panes by
   the `nb-`/`nw-` ids the two-pane comparison mints, and this page draws one
   document with `data-nego-card-anchor` instead. Calling it would silently do
   nothing, which is what it did. */
function rlLinkFocus(c, changeId, source){
  const page = document.getElementById('view-redline')
    || document.querySelector('.redline-page.rl-embed');
  const id = String(changeId == null ? '' : changeId);
  if (!page || !id) return false;
  const q = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
  page.querySelectorAll('.is-linked').forEach(n => n.classList.remove('is-linked'));
  const clause = page.querySelector('#rl-doc [data-nego-card-anchor="' + q(id) + '"]');
  const card = page.querySelector('#rl-changes [data-nego-card="' + q(id) + '"]');
  if (clause){
    clause.classList.add('is-linked');
    if (source !== 'clause' && clause.scrollIntoView)
      clause.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  if (card){
    card.classList.add('is-linked');
    if (source !== 'card' && card.scrollIntoView)
      card.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  return !!(clause || card);
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
  clause.classList.remove('rl-jump');
  /* Re-triggering the animation needs the class off for a frame; without the
     reflow read the browser coalesces remove+add into no change at all, so a
     second press of the same card's Edit lit nothing. */
  void clause.offsetWidth;
  clause.classList.add('rl-jump');
  if (opts.edit !== false){
    const editBtn = clause.querySelector('[data-nego-edit]');
    if (editBtn && !clause.querySelector('.nego-edit-bar')) editBtn.click();
    const box = clause.querySelector('[data-nego-editor]');
    if (box && box.focus) box.focus();
  }
  return clause;
}

/* AI Assist, Add Note/Tag, and the Tracked Changes card verbs, bound to the
   engine. AI Assist opens the same three RL_SEL_ACTIONS a text selection
   offers, because a clause-level ask and a phrase-level ask are the same ask
   over a different span of text. */
function rlWireClauseTools(c, host, opts){
  /* The owner's page repaints itself; a mount repaints however its host says.
     Falling back to renderRedline from inside an embed would paint the owner's
     workbench over a page that is not the owner's. */
  const again = (opts && typeof opts.rerender === 'function') ? opts.rerender : () => renderRedline();
  host.querySelectorAll('[data-rl-ai]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    _negoKillSelMenu();
    const clauseId = btn.getAttribute('data-rl-ai');
    /* THE MODEL'S TEXT, NOT THE SCREEN'S. This used to read the rendered
       body's textContent, and on any clause whose markup renders more than
       its text projection — template fields with placeholder chrome, block
       whitespace — the two strings differ. rlAiPropose then compares the
       passage against the model's clause text, finds no match, and refuses
       with a message about pending changes on a clause that had none: AI
       Assist dead on exactly the contracts the wizard produces, found in the
       six-round drive of the running app. A whole-clause ask has a canonical
       source — the clause record — so it is read from there, and the
       whole-clause check downstream is true by construction. The SELECTION
       path keeps reading the screen, because a selection is of the screen. */
    const cl = (typeof negoClauseById === 'function') ? negoClauseById(c, clauseId) : null;
    const sec = host.querySelector(`[data-clause="${window.CSS && CSS.escape ? CSS.escape(clauseId) : clauseId}"]`);
    const para = sec && (sec.querySelector('.nego-body') || sec.querySelector('.rl-clause-p'));
    const text = String((cl && cl.text) || (para && para.textContent) || '').trim();
    if (!text) return;
    rlSelMenu({ c, opts, text, clauseId, rect: btn.getBoundingClientRect(),
      whole: true, event: 'click', again });
  }));

  host.querySelectorAll('[data-rl-note]').forEach(btn => btn.addEventListener('click', () => {
    rlTagInternalNote({ c, clauseId: btn.getAttribute('data-rl-note'),
      changeId: btn.getAttribute('data-rl-change') || null,
      host, rerender: again });
  }));

  /* The card's Edit — light both ends, scroll the document to the clause and
     open the editor on it. Stopped from bubbling because the card itself links
     on click, and that would scroll the column back over the jump. */
  host.querySelectorAll('[data-rl-edit]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    const clauseId = btn.getAttribute('data-rl-edit');
    const changeId = btn.getAttribute('data-rl-edit-change');
    if (changeId) rlLinkFocus(c, changeId, 'card');
    if (!rlJumpToClause(clauseId) && window.toast)
      toast('That clause is no longer in the document', 'err');
  }));

  /* ---- CARD → CONTRACT ----
     Pressing anywhere on a card that is not one of its verbs. The verbs all
     stop propagation, so Accept does not also drag the document somewhere on
     its way to deciding a change. */
  host.querySelectorAll('#rl-changes [data-nego-card]').forEach(card =>
    card.addEventListener('click', () => rlLinkFocus(c, card.getAttribute('data-nego-card'), 'card')));

  /* ---- CONTRACT → CARD ----
     And the same in reverse, from the clause. Two things are deliberately not
     a click here: pressing one of the clause's own tools, and finishing a text
     selection. Both are somebody operating the clause rather than asking about
     it, and scrolling the column under them mid-gesture — or worse, moving the
     page while a phrase is being selected — is the interruption this pairing is
     supposed to save them. */
  const fromClauseControl = t => !!(t && t.closest && t.closest(
    '.rl-tools, .rl-tool, .nego-tool, .nego-selmenu, [data-nego-editor], .nego-edit-bar, '
    + 'button, a, input, textarea, select'));
  host.querySelectorAll('#rl-doc [data-nego-card-anchor]').forEach(sec =>
    sec.addEventListener('click', ev => {
      if (fromClauseControl(ev.target)) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && !sel.isCollapsed && String(sel.toString() || '').trim()) return;
      rlLinkFocus(c, sec.getAttribute('data-nego-card-anchor'), 'clause');
    }));

  /* The card's Send — the SAME act as the toolbar's batch send, because there
     is only one send: everything unsent goes in one round. A per-change send
     would let a reader believe they had published one ask while three others
     stayed home. */
  host.querySelectorAll('[data-rl-send]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    /* Whose postbox a card's Send presses depends on whose card it is: the
       owner's is #nego-send, the counterparty's — on their page and on the
       owner's preview alike — is #nego-send-decisions. Scoped to this mount
       first so two workbenches on one page cannot press each other. */
    const id = (opts && opts.side) === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
    const engine = negoPick(host, id) || document.getElementById(id);
    if (engine && !engine.disabled){ engine.click(); return; }
    if (window.toast) toast('There is nothing to send on this round yet', 'err');
  }));
}

/* ---------- THE DESIGN'S FOLD, AS ITS OWN API ----------
   The reference calls rlToggleDiscussion() from two places — the chevron in
   the discussion header and the reveal chip in the Tracked Changes header —
   and both are `onclick=` attributes, so the name is part of the contract this
   view is being held to. It is a real function here rather than an inline
   class toggle so those two controls, the persisted preference and the counts
   all move together.

   The choice is remembered per browser: a negotiator who works with the
   discussion folded away should not have to fold it again on every clause they
   open. It is written before the class is toggled so a repaint mid-session
   reads the same answer the DOM is already showing. */
const RL_DISC_KEY = 'hati.v1.rlDiscOff';
function _redlineDiscOff(){
  try { return localStorage.getItem(RL_DISC_KEY) === '1'; } catch (e) { return false; }
}
function rlToggleDiscussion(force){
  const page = document.getElementById('view-redline');
  if (!page) return false;
  const off = force == null ? !page.classList.contains('disc-off') : !!force;
  try { localStorage.setItem(RL_DISC_KEY, off ? '1' : '0'); } catch (e) {}
  page.classList.toggle('disc-off', off);
  /* The reveal chip is the only way back once the column is gone, so it is
     shown exactly when the column is not — never both, never neither. */
  const chip = document.getElementById('rl-disc-show');
  if (chip) chip.hidden = !off;
  return off;
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
  const changes = (typeof negoChanges === 'function')
    ? negoChanges(c).filter(x => x.status !== 'superseded' && x.changeType !== 'insertClause'
        && !hidden.has(x.id)) : [];
  const byClause = new Map();
  for (const ch of changes) byClause.set(ch.clauseId, ch);
  const tmpl = (window.TEMPLATES && c.template && TEMPLATES[c.template] && TEMPLATES[c.template].name) || 'Contract';
  const region = RL_REGION[(window.state && state.region) || 'KE'] || RL_REGION.KE;
  const editable = !opts.readonly && opts.canEdit !== false;
  /* ---- THE CLAUSE TOOLBAR ----
     Three verbs on every clause, and each one presses the ENGINE's control
     rather than a lookalike: Direct Edit carries data-nego-edit, which opens
     the engine's inline editor on the clause itself; AI Assist opens the three
     RL_SEL_ACTIONS against this clause's own wording, in the Copilot side
     panel; Add Note/Tag jumps to the per-change reply box in the Discussion
     column, which is where a note on a clause actually lives.

     WHY NOT THE DOC LAB'S TOOLBAR, which looks identical. The lab's buttons
     write to hati.lab.v1 — a sandbox store that by design cannot reach a
     contract. Wired onto this page they would appear to work and quietly file
     nothing against the real agreement. Same three verbs, same look, engine
     underneath: that is the whole point of the port. */
  const tools = (cl, ch) => {
    if (!editable) return '';
    const id = _ne(cl.clauseId);
    /* AI Assist is offered only where a Copilot panel exists to land in. The
       counterparty's page has none — their embed passes noAi — and a button
       whose every outcome is an apology is worse than no button. */
    const ai = opts.noAi ? '' : `<button type="button" class="rl-tool" data-rl-ai="${id}"
        title="Run an AI action on this clause">&#129668; AI Assist</button>`;
    return `<div class="rl-tools" role="group" aria-label="Tools for this clause">
      ${ai}
      <button type="button" class="rl-tool" data-rl-note="${id}"${ch ? ` data-rl-change="${_ne(ch.id)}"` : ''}
        title="Attach an internal or shared note to this clause">&#128172; Add Note/Tag</button>
      <button type="button" class="rl-tool" data-nego-edit="${id}"
        title="Edit this clause's wording directly">&#9998; Direct Edit</button>
      <button type="button" class="rl-tool" data-nego-del="${id}"
        title="Propose deleting this clause — the wording stays until the other side accepts the deletion">&#128465; Propose deletion</button>
    </div>`;
  };
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
  const heading = cl => {
    const raw = String(cl.headingText || '').trim();
    if (!raw) return '';
    return `<h4 class="rl-clause-h">${_ne(raw)}</h4>`;
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
  const richBody = cl => `<div class="nego-body">${
    (typeof negoRichBody === 'function') ? negoRichBody(cl) : `<p>${_ne(cl.text || '')}</p>`}</div>`;
  const redlineBody = ch => {
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
    if (window.redlineOpsBlocksHtml && Array.isArray(ch.ops) && ch.ops.length)
      return `<div class="nego-body">${redlineOpsBlocksHtml(ch.ops, { title: tip })}</div>`;
    if (window.redlineOpsHtml && ch.ops)
      return `<div class="nego-body"><p>${redlineOpsHtml(ch.ops, { title: tip })}</p></div>`;
    return `<div class="nego-body"><p>${_ne(ch.proposedText || ch.newText || '')}</p></div>`;
  };
  const body = clauses.map(cl => {
    const ch = byClause.get(cl.clauseId);
    if (ch){
      const theirs = ch.authorSide !== side;
      /* The decision rides on the tag, because the card leaves the column once
         a change is settled: without this the document showed the marks and
         nothing said the argument about them was over. The refusal's reason —
         ch.reply, which travels — is on the tag's tooltip. */
      const st = ch.status === 'accepted' ? ' &middot; &#10003; adopted'
        : ch.status === 'rejected' ? ' &middot; &#10007; refused' : '';
      const tagTip = ch.status === 'rejected' && ch.reply ? ` title="${_nea(ch.reply)}"` : '';
      return `<section class="nego-clause rl-clause is-changed" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
        <div class="rl-clause-top">
          ${heading(cl)}
          <span class="rl-asktag"${tagTip}>${_ne(ch.id)} · ${theirs ? 'Their ask' : 'Your ask'}${st}</span>
        </div>
        ${redlineBody(ch)}
        ${tools(cl, ch)}
      </section>`;
    }
    return `<section class="nego-clause rl-clause" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}">
      ${heading(cl)}
      ${richBody(cl)}
      ${tools(cl, null)}
    </section>`;
  }).join('');
  /* nego-doc is required, not cosmetic: the Copilot selection menu (the three
     NEGO_AI_ACTIONS — rephrase for advantage, explain legal risk, shorten
     wording) only opens when the selection sits inside
     `.nego-pane.working .nego-doc`. Without this class the AI redlining is
     silently unreachable on this page. */
  return `<article class="nego-doc rl-paper">
    <header class="rl-paper-head">
      <h3 class="rl-paper-title">${_ne((c.name || tmpl)).toUpperCase()}</h3>
      <p class="rl-paper-sub">${_ne(tmpl)} &middot; Jurisdiction: ${_ne(region)}</p>
    </header>
    ${body || '<p class="rl-clause-p">This contract has no clause structure yet.</p>'}
  </article>`;
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
function rlHiddenFrom(c, side){
  const other = side === 'counterparty' ? 'owner' : 'counterparty';
  return new Set((window.negoUnsentAsks ? negoUnsentAsks(c, other) : []).map(x => x.id));
}
const rlMsgVisible = (m, side) =>
  !!m && (m.visibility === 'shared' || (m.side || 'owner') === (side === 'counterparty' ? 'counterparty' : 'owner'));
/* Which silent change the discussion column's one starter composer is aimed
   at. Nominated by rlTagInternalNote, honoured by redlineDiscussionHtml. */
let _rlStarterFor = null;
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
function redlineChangeCardsHtml(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const canAct = !opts.readonly;
  const editable = canAct && opts.canEdit !== false;
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
  const changes = all.filter(x => (_rlIsLive(x) || heldIds.has(x.id) || contestedAny(x)
    || sentIds.has(x.id)) && !hidden.has(x.id));
  /* Which of OUR asks have never left the building. The engine already answers
     this — the same count the wall and the batch send are drawn from — so the
     card's Send button and the toolbar's cannot disagree about what is unsent. */
  const unsent = Array.isArray(opts.unsentIds)
    ? new Set(opts.unsentIds)
    : new Set((window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).map(x => x.id));
  if (!changes.length){
    const settled = all.filter(x => x.status === 'accepted' || x.status === 'rejected').length;
    return `<div class="rl-cards-empty">
      <b>No changes on the table.</b>
      <span>Press <b>Direct Edit</b> under any clause to ask for different wording. Each ask lands here with its own fingerprint, and the other side accepts or rejects them one at a time.</span>
      ${settled ? `<span>${settled} change${settled === 1 ? ' has' : 's have'} already been decided — ${settled === 1 ? 'it is' : 'they are'} in the document and the round history, not here.</span>` : ''}
    </div>`;
  }
  return changes.map(ch => {
    const theirs = ch.authorSide !== side;
    /* ---- DRAFT / SENT, READ FROM THE RECORD ----
       An ask of ours is unsent while it was filed after the last hand-over —
       negoUnsentAsks is the one place that decides this, and the wall, the
       toolbar's batch send and this badge are all drawn from it, so they
       cannot disagree. Nothing here sets a "sent" flag of its own: the badge
       flips because the turn moved, and the turn moves only when something
       actually left the building. */
    const mineUnsent = !theirs && unsent.has(ch.id);
    const mineSent = !theirs && !unsent.has(ch.id) && ch.status === 'pending';
    const heldHere = heldIds.has(ch.id) && ch.status !== 'pending';
    const sentHere = sentIds.has(ch.id) && ch.status !== 'pending' && !heldHere;
    const reopen = sentHere && redeciding(ch.id);
    const contested = ch.status === 'rejected' && !ch.withdrawn && !heldHere && !sentHere;
    const badge = heldHere ? (ch.status === 'accepted' ? ['ok', 'Accepted &middot; &#128274; held'] : ['no', 'Rejected &middot; &#128274; held'])
      : sentHere ? (ch.status === 'accepted' ? ['ok', 'Accepted &middot; sent'] : ['no', 'Rejected &middot; sent'])
      : contested ? ['no', !theirs ? 'Refused &middot; withdraw or revise' : 'Refused &middot; waiting on them']
      : mineUnsent ? ['draft', '&#128274; Draft']
      : theirs ? ['sent', 'Awaiting you'] : ['sent', 'Sent'];
    /* The organisation is the AUTHOR's, not the viewer's. Written seat-relative
       ("theirs → counterparty, mine → us") this line flipped depending on who
       was reading it, so the counterparty's page attributed their own ask to
       the owner's organisation — and the two sides' cards could never match. */
    const who = [ch.clauseLabel || ch.clauseId, ch.by || ch.author,
      ch.authorSide === 'counterparty' ? (c.counterparty || 'counterparty') : (window.FIRST_PARTY || 'us')]
      .filter(Boolean).map(_ne).join(' &middot; ');
    /* The same tooltip the marked wording in the document carries, so hovering
       either one answers the same question with the same words. */
    const lastBy = String(ch.author || ch.by || '').trim();
    const tip = lastBy ? `Last updated by ${lastBy}` : '';
    const diff = window.redlineOpsHtml && ch.ops
      ? redlineOpsHtml(rlDeltaOps(ch.ops), { title: tip })
      : _ne(ch.proposedText || ch.newText || '');
    /* A note is the AUTHOR's aside — the 🔒 on it is a promise, and the wall
       applies to the toggle too: it renders only on the side that wrote it.
       A Copilot rationale filed with an owner ask must not appear the moment
       someone flips to Counterparty View to check what they are sending. */
    const note = (ch.note && ch.authorSide === side)
      ? `<div class="rl-card-note">&#128274; ${_ne(ch.note)}</div>` : '';
    /* ---- THE FOUR VERBS, AND THE COLOUR EACH ONE IS ----
       Accept green, Reject red, Edit grey, Send green. Edit is on every live
       card and not only the decidable ones: revising your own ask is the most
       common thing done in this column, and it was the one act with no button.
       It carries the clause id rather than the change id because what it opens
       is the clause in the document — see rlWireCardEdit. */
    const verbs = [];
    if (canAct && sentHere && !reopen){
      verbs.push(`<button class="rl-edit" data-nego-redecide="${_ne(ch.id)}"
        title="You answered this and it has gone to them. Answering differently files a new decision, and that travels too.">Change decision</button>`);
    }
    if (canAct && (reopen)){
      verbs.push(`<button class="rl-acc" data-nego-accept="${_ne(ch.id)}">Accept</button>`);
      verbs.push(`<button class="rl-rej" data-nego-reject="${_ne(ch.id)}">Reject</button>`);
    }
    if (canAct && contested && !theirs){ /* asker's Withdraw below */
      /* Their no, your move: withdrawing is the acknowledgement that settles a
         refused ask — without it one rejection deadlocks Ready-to-sign for
         both sides forever. data-nego-withdraw is the engine's own handler. */
      verbs.push(`<button class="rl-edit" data-nego-withdraw="${_ne(ch.id)}"
        title="Let this ask go — the refusal is acknowledged and the point is settled">Withdraw</button>`);
    }
    if (canAct && heldHere){
      /* The answer has not left this page; the person who gave it can take it
         back. data-nego-undo is the engine's own re-open. */
      verbs.push(`<button class="rl-edit" data-nego-undo="${_ne(ch.id)}"
        title="Take this answer back — nothing has been sent yet">Undo</button>`);
    }
    if (canAct && theirs && ch.status === 'pending' && !heldHere){
      verbs.push(`<button class="rl-acc" data-nego-accept="${_ne(ch.id)}">Accept</button>`);
      verbs.push(`<button class="rl-rej" data-nego-reject="${_ne(ch.id)}">Reject</button>`);
    }
    if (editable && !heldHere) verbs.push(`<button class="rl-edit" data-rl-edit="${_nea(ch.clauseId)}" data-rl-edit-change="${_nea(ch.id)}"
        title="Jump to this clause in the contract and edit it there">Edit</button>`);
    if (editable && mineUnsent) verbs.push(`<button class="rl-send" data-rl-send="${_nea(ch.id)}"
        title="Send this and every other unsent draft to ${_nea(c.counterparty || 'the counterparty')}">Send</button>`);
    /* ---- AND WHAT THE SEND BECOMES ----
       Not the button disappearing. A verb that vanishes on success leaves the
       reader wondering whether they pressed it, and on a column of six cards
       there is nothing left to compare against. It stays where it was and
       changes state — amber, past tense, inert — so "this one has gone" is
       readable at a glance. Disabled because there is nothing further to do to
       it: the next move is theirs.

       Drawn from the same reading as the badge above it. Neither is a flag
       anybody sets; both follow from the turn having actually moved. */
    if (editable && mineSent) verbs.push(`<button type="button" class="rl-sent" data-rl-sent="${_nea(ch.id)}" disabled
        title="Sent to ${_nea(c.counterparty || 'the counterparty')} — waiting on their answer">Sent</button>`);
    return `<article class="rl-card" data-nego-card="${_ne(ch.id)}"${
      (ch.status === 'rejected' && !ch.withdrawn) ? ` data-contested="${_ne(ch.id)}"` : ''}${
      heldHere ? ` data-unsent="${_ne(ch.id)}"` : ''}${
      sentHere ? ` data-sent="${_ne(ch.id)}"` : ''}${
      ch.withdrawn ? ` data-withdrawn="${_ne(ch.id)}"` : ''} tabindex="0">
      <div class="rl-card-top"><span class="rl-card-id">${_ne(ch.id)}</span>
        <span class="rl-badge rl-badge-${badge[0]}">${badge[1]}</span></div>
      <div class="rl-card-meta"${tip ? ` title="${_nea(tip)}"` : ''}>${who}</div>
      <div class="rl-card-diff">${diff}</div>
      ${note}${verbs.length ? `<div class="rl-card-verbs">${verbs.join('')}</div>` : ''}
    </article>`;
  }).join('');
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
      <span>You are viewing <b>exactly what ${who} sees</b>. Internal threads, notes and unsent drafts are not here &mdash; and nothing on this side reveals they exist.</span>
    </div>`;
  }
  const unsent = (window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).length;
  const msgs = (c && c._messages) || [];
  const internal = window.discussIsInternal
    ? new Set(msgs.filter(m => discussIsInternal(m)).map(m => m.topic || m.id)).size : 0;
  const bits = [];
  if (internal) bits.push(`<b>${internal} internal thread${internal === 1 ? '' : 's'}</b>`);
  if (unsent) bits.push(`<b>${unsent} unsent draft${unsent === 1 ? '' : 's'}</b>`);
  const n = internal + unsent;
  const lead = bits.length
    ? `${bits.join(' &middot; ')} ${n === 1 ? 'stays' : 'stay'} behind when you share.`
    : 'Nothing is behind the wall right now.';
  return `<div class="rl-wall" role="status">
    <span class="rl-wall-ic">&#128274;</span>
    <span><b>The wall:</b> ${lead} A thread travels only if marked shared; a change only once sent.</span>
  </div>`;
}

/* The design's grid. Everything inside it is the engine's, arranged the way the
   design arranges it rather than the way the comparison workbench does. */
function redlinePanesHtml(c, opts = {}){
  const p = (typeof negoProgress === 'function') ? negoProgress(c) : { done:0, total:0, pct:0, pending:0 };
  const canAct = !opts.readonly;
  const threadTotal = redlineThreads(c, opts).length;
  /* #nego-root is not decoration: the engine declares its entire colour ramp
     on `.nego-room, #nego-root`, so without this wrapper --n-slate and friends
     are undefined and the clause tools render as transparent boxes with white
     text on a white page. */
  return `<div id="nego-root" class="rl-root">
    <div id="rl-banner">${opts.bannerHtml != null ? opts.bannerHtml : redlineWallHtml(c, opts)}${
      window.negoReadySignalHtml ? negoReadySignalHtml(c, opts) : ''}</div>
    <div class="rl-turnwrap">${negoTurnBannerHtml(c, opts)}</div>
    <!-- nego-work is kept on the grid because the engine scopes its clause
         tooling under it (.nego-work .nego-pane …). Without it Change and
         Delete render as unlabelled empty boxes. The design's column widths are
         set by .redline-page .rl-grid, which outranks it on specificity. -->
    <div class="rl-grid nego-work" id="rl-grid" style="--nego-f:1;--nego-c:320px">
      <!-- keeps the nego-pane working classes: the engine's clause tools
           (Change, Delete, the fingerprint margin) are styled through them, and
           without them they render as unlabelled empty boxes -->
      <section id="rl-doc" class="rl-doc nego-pane working" aria-label="The contract, with this round's changes marked">
        <div class="nego-scroll" id="nego-scroll-work">${redlineDocHtml(c, opts)}</div>
      </section>

      <aside class="nego-pane index rl-col" id="rl-changes-col" aria-label="Tracked changes">
        <div class="nego-index-head rl-idx-head">
        <h3 style="flex:1;min-width:0;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Tracked Changes</h3>
          <button type="button" id="rl-disc-show" class="rl-disc-toggle" data-redline-disc
            title="Show the discussion column"${opts.discOff ? '' : ' hidden'}>Discussion <span id="rl-rail-count">${threadTotal}</span></button>
          ${''/* kept for the engine's wiring and the header proxies; the design
                 carries these controls in the page header instead */}
          <span class="nego-count" id="nego-count" hidden>${p.pending || p.total}</span>
          <button class="nego-fold" id="nego-fold" hidden>Hide</button>
          <div class="nego-track" hidden><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
          <div id="nego-progress" hidden>${p.done} of ${p.total} resolved</div>
          ${canAct ? `<div class="nego-bulk">
            <button class="b-acc" id="nego-bulk-acc"${p.pending ? '' : ' disabled'}>Accept All Non-Risk</button>
            <button class="b-rej" id="nego-bulk-rej"${p.pending ? '' : ' disabled'}>Reject All Counterparty</button>
          </div>` : ''}
          <div class="rl-sendslot">${negoIndexSendHtml(c, opts)}</div>
        </div>
        <!-- TWO IDS, NESTED, BOTH LOAD-BEARING. #nego-cards is the scroll box
             the engine and the counterparty portal both reach for by name;
             #rl-changes is the design's list of cards inside it. They are
             different things — a scroller and its contents — so nesting is the
             honest arrangement rather than a trick to satisfy both. -->
        <div class="nego-index-scroll rl-cards" id="nego-cards">${negoLinkedBarHtml()}<div id="rl-changes">${redlineChangeCardsHtml(c, opts)}</div></div>
      </aside>

      <aside class="rl-col rl-disc" id="rl-disc-col" aria-label="Discussion">
        ${redlineDiscussionHtml(c, opts)}
      </aside>
    </div>
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
  const changes = (typeof negoChanges === 'function')
    ? negoChanges(c).filter(x => x.status !== 'superseded' && !hidden.has(x.id)) : [];
  return changes.map(ch => ({
    ch,
    msgs: (window.negoMergedThread ? negoMergedThread(c, ch, opts.messages) : (ch.thread || []))
      .filter(m => rlMsgVisible(m, side)),
  })).filter(t => t.msgs.length);
}
function redlineDiscussionHtml(c, opts = {}){
  const side = opts.side === 'counterparty' ? 'counterparty' : 'owner';
  const canComment = opts.canComment != null ? !!opts.canComment : !opts.readonly;
  const threads = redlineThreads(c, opts);
  const hidden = Array.isArray(opts.hiddenIds) ? new Set(opts.hiddenIds) : rlHiddenFrom(c, side);
  const changes = (typeof negoChanges === 'function')
    ? negoChanges(c).filter(x => x.status !== 'superseded' && !hidden.has(x.id)) : [];
  const head = `
    <div class="rl-disc-head">
      <h3>Discussion</h3>
      <span class="rl-disc-n" id="rl-thread-count">${
        threads.length ? `${threads.length} thread${threads.length === 1 ? '' : 's'}` : ''}</span>
      <button type="button" class="rl-disc-x" data-redline-disc title="Collapse discussion">&rsaquo;</button>
    </div>`;
  /* #rl-threads is present on both branches, empty state included: the design
     names it as the list, and wiring that only exists once there is something
     in it is wiring that breaks on the first contract anybody opens. */
  if (!changes.length) return `${head}
    <div class="rl-disc-body" id="rl-threads">
      <div class="rl-disc-empty">Threads attach to a change. Propose an edit on the left and the conversation about it lands here.</div>
    </div>`;

  const card = ({ ch, msgs }) => {
    const anyShared = msgs.some(m => m.visibility === 'shared');
    const decided = ch.status === 'accepted' || ch.status === 'rejected';
    const body = msgs.map(m => {
      const shared = m.visibility === 'shared';
      return `<div class="rl-msg${shared ? '' : ' is-internal'}">
        <div class="rl-msg-top"><b>${_ne(m.who || 'Someone')}</b><span>${_ne(negoWhen(m.at))}</span></div>
        <p>${_ne(m.text || '')}</p>
      </div>`;
    }).join('');
    return `<article class="rl-thread${anyShared ? '' : ' is-internal'}">
      <div class="rl-thread-top">
        <span class="rl-vis ${anyShared ? 'sh' : 'int'}">${anyShared ? '&#127760; Shared' : '&#128274; Internal'}</span>
        <span class="rl-thread-state">${decided ? (ch.status === 'accepted' ? 'Accepted' : 'Rejected') : 'Open'}</span>
      </div>
      <div class="rl-thread-ref">Change ${_ne(ch.id)}${ch.clauseLabel ? ' &middot; ' + _ne(ch.clauseLabel) : ''}</div>
      ${body}
      ${canComment ? `<div class="rl-reply">
        <div class="nego-visswitch" role="group" aria-label="Who can read this reply">
          <button type="button" class="v-int" data-nego-vis="internal" data-for="${_ne(ch.id)}" aria-pressed="false">&#128274; Internal</button>
          <button type="button" class="v-sh" data-nego-vis="shared" data-for="${_ne(ch.id)}" aria-pressed="true">&#127760; Send to them</button>
        </div>
        <div class="rl-reply-row">
          <input type="text" id="nego-ti-${_ne(ch.id)}" placeholder="Reply…" aria-label="Reply on change ${_ne(ch.id)}"/>
          <button data-nego-send="${_ne(ch.id)}" title="Send this reply">&uarr;</button>
        </div>
      </div>` : ''}
    </article>`;
  };

  /* Starting a thread on a change that has none yet: the design's composer at
     the foot of the column. It targets the same per-change reply the cards use,
     so a first message is filed exactly like a reply. */
  const silent = changes.filter(ch => !(window.negoMergedThread
    ? negoMergedThread(c, ch, opts.messages) : (ch.thread || []))
    .filter(m => rlMsgVisible(m, side)).length);
  /* WHICH silent change the composer aims at. It used to be silent[0], always
     — so "Tag with internal note" on any OTHER silent change found no input
     with its id and silently did nothing. rlTagInternalNote now nominates the
     change it is about (_rlStarterFor) and repaints; the starter honours the
     nomination when that change is still silent, and falls back to the first
     one when it is not. */
  const target = silent.find(ch => ch.id === _rlStarterFor) || silent[0];
  const starter = (canComment && silent.length) ? `
    <div class="rl-starter">
      <div class="nego-visswitch" role="group" aria-label="Who can read this">
        <button type="button" class="v-int" data-nego-vis="internal" data-for="${_ne(target.id)}" aria-pressed="true">&#128274; Internal</button>
        <button type="button" class="v-sh" data-nego-vis="shared" data-for="${_ne(target.id)}" aria-pressed="false">&#127760; Shared</button>
      </div>
      <div class="rl-reply-row">
        <input type="text" id="nego-ti-${_ne(target.id)}" placeholder="Start a thread on ${_ne(target.id)}…" aria-label="Start a thread on change ${_ne(target.id)}"/>
        <button data-nego-send="${_ne(target.id)}" title="Start the thread">&uarr;</button>
      </div>
      <p class="rl-starter-note">Internal is the default — a forgotten field stays home, never the other way round.</p>
    </div>` : '';

  return `${head}
    <div class="rl-disc-body" id="rl-threads">
      ${threads.length ? threads.map(card).join('')
        : `<div class="rl-disc-empty">No one has said anything yet. Start a thread below and it stays attached to that change.</div>`}
    </div>
    ${starter}`;
}
/* A timestamp a person can read, falling back to the raw value rather than
   inventing one when the record has no parseable date. */
function negoWhen(at){
  const t = Date.parse(at || '');
  if (isNaN(t)) return '';
  const d = new Date(t);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
  renderRedline, redlineRoundLabel, redlineLayoutCss, redlineSyncProxies,
  rlToggleDiscussion, rlWireClauseTools,
  redlineHeldId, redlineEvict, openRedlineWorkbench, RL_DEMOTABLE,
  rlHiddenFrom, rlMsgVisible, redlineEmbed, negoIsRedeciding,
  RL_SEL_ACTIONS, rlSelActions, rlSelMenu, rlAiPropose, rlTagInternalNote,
  rlJumpToClause, rlLinkFocus, rlDeltaOps, rlSayInPanel,
  redlinePanesHtml, redlineDiscussionHtml, redlineThreads, redlineDocHtml, redlineChangeCardsHtml, negoWhen,
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
