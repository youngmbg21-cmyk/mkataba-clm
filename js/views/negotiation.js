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
    --n-ins-bg:#e4f1ea; --n-ins-fg:var(--st-green-fg);
    --n-del-bg:var(--st-ruby-bg); --n-del-fg:var(--st-ruby-dot);
    --n-paper:#ffffff; --n-canvas:#f2f4f7; --n-line:#e3e8ee;
    --n-ink:#2b3440; --n-ink-soft:#66707d;
    --n-accept:var(--st-green-fg); --n-reject:var(--st-ruby-dot); --n-focus:#456a8f;
    /* Type is the platform's, colour is the room's. The room used to set its
       own three faces, so a contract changed face when you walked into it;
       a clause now reads the same here as on the Doc page and in the PDF. */
    --n-font-ui:var(--font-body);
    --n-font-doc:var(--font-doc);
    --n-font-mono:var(--font-mono);
    /* ---- THE CARDS ARE SQUARE ----
       Asked for, and it holds up: this page stacks a lot of boxes — three
       panes, a paper, a clause block per clause, a card per change — and a
       10px radius on every one of them made a screen of soft-cornered tiles
       where the eye reads the CORNERS before the content. 2px, not 0: a 1px
       border meeting at a true right angle renders a visible dark pip at the
       join on most displays, and one hair of radius takes it off without
       reading as rounded.

       The pills, chips and buttons keep their own radii — a fully round
       Accept button is a button, and squaring it would make it a box. Only
       the CARDS change. --n-r-sm is what the small round things use, so it is
       left alone. */
    --n-r-sm:6px; --n-r-md:2px; --n-r-lg:2px;
    --n-shadow-card:0 1px 2px rgba(38,55,74,.06),0 4px 14px rgba(38,55,74,.07);
    --n-shadow-pop:0 8px 30px rgba(38,55,74,.18);
  }
  /* The room joins the theme like every other surface: same private namespace,
     dark values. The topbar slate and the accept/reject hues already read on
     both themes; only paper, canvas, ink and hairlines flip. */
  html.dark .nego-room, html.dark #nego-root, html.dark .nego-selmenu, html.dark .nego-aipop{
    --n-badge-bg:#1e293b;
    --n-ins-bg:var(--st-green-bg);
    --n-paper:#0f172a; --n-canvas:#020617; --n-line:#1e293b;
    --n-ink:#e2e8f0; --n-ink-soft:#94a3b8;
    --n-focus:#7fa3c8;
    /* The two named hues with light-only fallbacks in the rules below: "my
       ask" navy and "closed round" oxblood both vanish against dark paper,
       so the dark ramp lifts them the way it lifts the ink. */
    --n-mine:#7fa3c8; --n-closed:#d99a90;
    --n-shadow-card:0 1px 2px rgba(0,0,0,.4),0 4px 14px rgba(0,0,0,.45);
    --n-shadow-pop:0 8px 30px rgba(0,0,0,.6);
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
    border:1px solid var(--st-green-line);border-left:4px solid var(--n-accept);background:var(--st-green-bg);
    border-radius:6px;padding:10px 14px}
  .nego-readysig .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-accept);color:#fff;font-size:11px;font-weight:800}
  .nego-readysig .body{flex:1;min-width:220px;font-size:12px;line-height:1.5;color:var(--st-green-fg)}
  .nego-readysig .row{display:block}
  .nego-readysig .row+.row{margin-top:3px;color:var(--n-ink-soft)}
  .nego-readysig .nego-tbtn{flex:none;align-self:center}
  /* A signal the change set has moved past is not good news, and must not be
     dressed as it. Same box, the colour of an open point. */
  .nego-readysig.stale{border-color:var(--st-amber-line);border-left-color:var(--st-amber-dot);background:var(--st-amber-bg)}
  .nego-readysig.stale .tick{background:var(--st-amber-dot)}
  .nego-readysig.stale .body{color:var(--st-amber-fg)}
  .nego-closed{display:flex;align-items:flex-start;gap:11px;margin:10px 14px 0;border-radius:6px;
    padding:10px 14px;border:1px solid var(--n-line);background:var(--n-badge-bg);
    border-left:4px solid var(--n-slate)}
  .nego-closed[data-state="signed"]{border-color:var(--st-green-line);border-left-color:var(--n-accept);background:var(--st-green-bg)}
  .nego-closed[data-state="declined"]{border-color:var(--st-ruby-line);border-left-color:var(--n-reject);background:var(--st-ruby-bg)}
  .nego-closed .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-slate);color:#fff;font-size:11px;font-weight:800}
  .nego-closed[data-state="signed"] .tick{background:var(--n-accept)}
  .nego-closed[data-state="declined"] .tick{background:var(--n-reject)}
  .nego-closed .body{flex:1;min-width:220px;font-size:12px;line-height:1.5;color:var(--n-ink)}
  /* The numbering notice. Inside the document, above the first clause, because
     it is a remark about THIS PAGE's numbering and not about where the deal
     stands — the banner slot above the panes answers that one question and
     stays answering only it. Amber while the draft can still be tidied; slate
     once the contract is executed and the gap is part of the record. */
  .nego-gaps{display:flex;align-items:flex-start;gap:10px;margin:0 0 18px;border-radius:6px;
    padding:10px 13px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot)}
  .nego-gaps[data-locked="1"]{border-color:var(--n-line);background:var(--n-badge-bg);
    border-left-color:var(--n-slate)}
  .nego-gaps .mark{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;
    background:var(--st-amber-dot);color:#fff;font-size:11px;font-weight:800;line-height:1}
  .nego-gaps[data-locked="1"] .mark{background:var(--n-slate)}
  .nego-gaps .body{flex:1;min-width:200px;font-size:11.5px;line-height:1.55;color:var(--n-ink)}
  .nego-gaps .body b{font-weight:700}
  .nego-gaps .why{display:block;margin-top:3px;color:var(--n-ink-soft)}
  /* The one door out of the notice (N2-T5) — drafts only; the executed notice
     never renders it at all. */
  .nego-gaps .renum{display:inline-block;margin-top:7px;font:inherit;font-size:11px;font-weight:700;
    color:var(--st-amber-fg);background:var(--n-paper);border:1px solid var(--st-amber-dot);border-radius:5px;padding:4px 10px;cursor:pointer}
  .nego-gaps .renum:hover{background:var(--st-amber-dot);color:#fff}
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
  html.dark .nego-rz::before{background:#475569}
  html.dark .nego-rz[data-drag]{background:#334155}

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
  html.dark .nego-ver,html.dark .nego-fold{border-color:#334155}
  html.dark .nego-fold:hover{background:#334155}
  .nego-scroll{flex:1;overflow-y:auto;padding:22px 20px 90px;scroll-behavior:smooth}

  /* ---- the document ----
     Serif, on paper, at the prototype's measure: a contract should read like a
     contract and not like the application around it. */
  .nego-doc{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:34px 38px 44px;max-width:720px;margin:0 auto;
    font-family:var(--n-font-doc);font-size:14.5px;line-height:1.72;color:#222a33}
  html.dark .nego-doc{color:var(--n-ink)}
  .nego-doc h1{font-size:19px;text-align:center;margin:0 0 6px;letter-spacing:.2px;line-height:1.35;
    font-family:var(--n-font-doc);font-weight:700}
  .nego-doc .nego-meta{text-align:center;font-family:var(--n-font-ui);font-size:11px;
    color:var(--n-ink-soft);margin-bottom:26px;padding-bottom:18px;border-bottom:1px solid var(--n-line)}
  .nego-clause{position:relative;margin-bottom:22px;padding:10px 12px;border-radius:var(--n-r-md);
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
  /* The reason a highlight leads nowhere. Wraps, unlike the quote above it —
     this is a sentence to be read, not a label to be recognised. */
  .nego-selmenu .nego-selnote{font-size:11.5px;line-height:1.55;color:var(--n-ink-soft);
    padding:0 9px 8px;max-width:248px}

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
    line-height:1.6;color:var(--st-ruby-fg)}

  /* ---- a thread singled out by its badge ---- */
  .nego-card.is-linked{box-shadow:0 0 0 3px rgba(184,134,43,.35);border-color:var(--st-amber-dot)}
  .nego-filterbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;
    font-family:var(--n-font-ui);font-size:11.5px;padding:7px 11px;border-radius:6px;
    background:var(--st-amber-bg);border:1px solid var(--st-amber-line);color:var(--st-amber-fg);margin-bottom:9px}
  .nego-filterbar button{font:inherit;font-size:11px;font-weight:600;cursor:pointer;
    border:1px solid var(--st-amber-line);background:var(--n-paper);color:var(--st-amber-fg);border-radius:5px;padding:3px 9px}

  /* ---- visibility on a comment ---- */
  .nego-vis{display:inline-flex;align-items:center;gap:4px;font-family:var(--n-font-ui);
    font-size:10px;font-weight:700;letter-spacing:.04em;border-radius:999px;padding:2px 8px;white-space:nowrap}
  .nego-vis-int{background:#f4ecd8;color:var(--st-amber-fg);border:1px solid rgba(138,106,42,.3)}
  .nego-vis-sh{background:#e8f0f8;color:#2c455d;border:1px solid #b5d9fd}
  .nego-msg.is-internal{background:#fdfaf1;border-left:3px solid var(--st-amber-dot);padding-left:9px}
  .nego-visswitch{display:inline-flex;border:1px solid var(--n-line);border-radius:6px;overflow:hidden}
  .nego-visswitch button{font:inherit;font-family:var(--n-font-ui);font-size:11px;font-weight:600;
    cursor:pointer;border:0;background:var(--n-paper);color:var(--n-ink-soft);padding:4px 9px}
  .nego-visswitch button + button{border-left:1px solid var(--n-line)}
  .nego-visswitch button[aria-pressed="true"].v-int{background:#f4ecd8;color:var(--st-amber-fg)}
  .nego-visswitch button[aria-pressed="true"].v-sh{background:var(--n-slate);color:#fff}
  /* The creams and powder blues above are light-paper tints; on dark paper the
     same chips drop to translucent washes of their own hue, the way the
     redline page's badges do. */
  html.dark .nego-vis-int{background:var(--st-amber-bg);border-color:var(--st-amber-line)}
  html.dark .nego-vis-sh{background:rgba(125,163,200,.18);color:#a9c6e2;border-color:rgba(125,163,200,.4)}
  html.dark .nego-msg.is-internal{background:rgba(245,158,11,.07)}
  html.dark .nego-visswitch button[aria-pressed="true"].v-int{background:var(--st-amber-bg)}

  /* ---- which mode the room is in ---- */
  .nego-mode{display:flex;align-items:center;gap:10px;flex-wrap:wrap;flex:none;
    font-family:var(--n-font-ui);font-size:11.5px;padding:8px 13px;border-radius:6px;
    border:1px solid var(--n-line);background:var(--n-paper)}
  .nego-mode.is-sandbox{border-left:4px solid var(--st-amber-dot);background:color-mix(in srgb,var(--st-amber-dot) 6%,var(--n-paper));color:var(--st-amber-fg)}
  .nego-mode.is-published{border-left:4px solid var(--n-slate);background:#f5f8fb;color:var(--n-ink)}
  html.dark .nego-mode.is-published{background:var(--n-badge-bg)}
  .nego-mode b{font-size:12px}
  /* ---- a clause with nothing proposed against it reads as the DOCUMENT ----
     Not as a text projection of it. The projection exists to be diffed; it is
     the substance the fingerprints bind and it is right for a clause under
     redline. It is not right for the other twenty clauses on the page, where
     it flattens a numbered sub-list into "1. … 2. …" run together and drops
     every piece of emphasis the drafter put there on purpose.

     Real markup carries its own structure, so pre-wrap is turned back OFF
     inside it: the source HTML's own indentation between tags is not content
     and must not print.

     ---- AND THE EDITOR IS THE SAME DOCUMENT ----
     Every rule below names .nego-editing beside .nego-body, because Direct Edit
     REPLACES the body with the editor (see wireNegotiationTab) and the two used
     to be styled as though they were different kinds of thing. They are not:
     the editor holds the same clause, in the same markup, and a writer has to
     be able to see what they are changing.

     Written out longhand rather than folded into :is(.nego-body,.nego-editing).
     f36 walks this sheet selector by selector and requires every one to be
     namespaced to the component; it splits on commas, so a comma INSIDE :is()
     hands it fragments like "h2" that belong to no component. The guard is
     right and the shorthand is what has to give.

     What the divergence actually cost, measured in Chromium on one clause (the
     numbers are check 12b in test/chromium/redline-verify.js): a paragraph fell
     back to the pre-wrap above, so every newline in the stored HTML printed as
     a hard break; a table dropped from the card's full width to 126px of 648;
     a pre-formatted party block lost its overflow-x and hung outside the card;
     and the 9px between blocks went to nothing. A preamble — many paragraphs,
     a party table, a signature block — collapsed into the wall of clipped lines
     this comment exists to stop coming back. */
  .nego-clause .nego-body>*,.nego-clause .nego-editing>*{margin:0 0 9px}
  .nego-clause .nego-body>*:last-child,.nego-clause .nego-editing>*:last-child{margin-bottom:0}
  .nego-clause .nego-body p,.nego-clause .nego-body li,
  .nego-clause .nego-editing p,.nego-clause .nego-editing li{white-space:normal}
  .nego-clause .nego-body ol,.nego-clause .nego-body ul,
  .nego-clause .nego-editing ol,.nego-clause .nego-editing ul{margin:7px 0 9px;padding-left:26px}
  .nego-clause .nego-body li,.nego-clause .nego-editing li{margin:0 0 5px}
  .nego-clause .nego-body li:last-child,.nego-clause .nego-editing li:last-child{margin-bottom:0}
  .nego-clause .nego-body ol ol,.nego-clause .nego-body ul ul,
  .nego-clause .nego-body ol ul,.nego-clause .nego-body ul ol,
  .nego-clause .nego-editing ol ol,.nego-clause .nego-editing ul ul,
  .nego-clause .nego-editing ol ul,.nego-clause .nego-editing ul ol{margin:5px 0 0}
  .nego-clause .nego-body strong,.nego-clause .nego-body b,
  .nego-clause .nego-editing strong,.nego-clause .nego-editing b{font-weight:700}
  .nego-clause .nego-body em,.nego-clause .nego-body i,
  .nego-clause .nego-editing em,.nego-clause .nego-editing i{font-style:italic}
  .nego-clause .nego-body u,.nego-clause .nego-editing u{text-decoration:underline}
  .nego-clause .nego-body h1,.nego-clause .nego-body h2,.nego-clause .nego-body h3,
  .nego-clause .nego-body h4,.nego-clause .nego-body h5,.nego-clause .nego-body h6,
  .nego-clause .nego-editing h1,.nego-clause .nego-editing h2,.nego-clause .nego-editing h3,
  .nego-clause .nego-editing h4,.nego-clause .nego-editing h5,.nego-clause .nego-editing h6{
    font-family:var(--n-font-doc);font-size:14.5px;font-weight:700;margin:12px 0 5px}
  .nego-clause .nego-body table,.nego-clause .nego-editing table{
    border-collapse:collapse;width:100%;margin:9px 0;font-size:13px}
  .nego-clause .nego-body td,.nego-clause .nego-body th,
  .nego-clause .nego-editing td,.nego-clause .nego-editing th{
    border:1px solid var(--n-line);padding:5px 8px;text-align:left;vertical-align:top}
  .nego-clause .nego-body th,
  .nego-clause .nego-editing th{font-weight:700;background:var(--n-badge-bg)}
  .nego-clause .nego-body pre,.nego-clause .nego-editing pre{white-space:pre;overflow-x:auto;
    font-family:var(--n-font-mono);font-size:12px;line-height:1.5}
  .nego-clause .nego-body blockquote,
  .nego-clause .nego-editing blockquote{margin:8px 0 8px 18px;padding-left:12px;
    border-left:2px solid var(--n-line);color:var(--n-ink-soft)}
  .nego-clause.is-active{background:#f3f7fb;box-shadow:0 0 0 2px var(--n-slate-soft)}
  html.dark .nego-clause.is-active{background:rgba(127,163,200,.12)}
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
  /* A formatting-only ask has no strike/insert marks to wear, so the chip is
     the whole signal — slate, not red or green, because it is information
     rather than a verdict. */
  .nego-note.fmt{background:var(--n-badge-bg);color:var(--n-slate-soft);border:1px solid var(--n-slate-soft)}
  /* The refusal that stays after formatting-only edits became fileable: a save
     where truly nothing changed. Inline beside the button that was pressed —
     a corner toast made the button read as dead. */
  .nego-edit-bar .nego-nofile{font-family:var(--n-font-ui);font-size:11.5px;font-weight:600;
    color:var(--n-del-fg);align-self:center;margin-left:6px}

  /* ---- the change index ---- */
  .nego-pane.index{background:var(--color-neutral-100)}
  .nego-index-head{flex:none;padding:12px 16px 10px;background:var(--n-paper);border-bottom:1px solid var(--n-line)}
  .nego-count{font-family:var(--n-font-mono);font-size:10.5px;font-weight:700;
    background:var(--n-slate);color:#fff;border-radius:99px;padding:1px 8px}
  .nego-track{height:5px;background:#e6ebf1;border-radius:99px;overflow:hidden;margin-bottom:7px}
  html.dark .nego-track{background:var(--n-line)}
  .nego-fill{height:100%;border-radius:99px;
    background:linear-gradient(90deg,var(--n-slate-soft),var(--n-accept));transition:width .4s ease}
  .nego-index-scroll{flex:1;overflow-y:auto;padding:12px 12px 90px}
  .nego-card{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:12px 13px;margin-bottom:11px;cursor:pointer;
    transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}
  .nego-card:hover{border-color:#c9d5e1}
  html.dark .nego-card:hover{border-color:#334155}
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

  .nego-editing{outline:2px solid var(--n-focus);outline-offset:2px;background:var(--n-paper)}
  .nego-editing:focus{outline:2px solid var(--n-focus)}
  /* The formatting bar over the open editor. Each command is a real chip —
     white face, visible border, a touch of shadow — the same clothing the
     type stepper wears, so it reads as buttons at a glance without adding a
     single colour. Gone with the editor when it closes. */
  /* Every var carries a fallback: the counterparty portal mounts this same
     editor OUTSIDE the #nego-root scope that defines the --n-* ramp, and a
     border whose color resolves to nothing is a toolbar that vanishes on
     exactly the page the customer sees. One look, both chairs. */
  .nego-fmt-bar{display:flex;gap:4px;margin:0 0 6px;padding:4px;width:max-content;
    background:var(--n-well,#f1f5f9);border:1px solid var(--n-line,#e2e8f0);border-radius:8px}
  .nego-fmt-bar button{width:28px;height:28px;display:inline-grid;place-items:center;
    background:var(--n-paper,#fff);border:1px solid var(--n-line,#e2e8f0);border-radius:6px;
    font-family:inherit;font-size:12.5px;color:var(--n-ink,#1e293b);cursor:pointer;
    box-shadow:0 1px 2px rgba(15,23,42,.08);transition:background .12s,border-color .12s}
  .nego-fmt-bar button:hover{border-color:var(--n-ink-soft,#94a3b8);background:var(--n-well,#f8fafc)}
  .nego-fmt-bar button:active{box-shadow:none;transform:translateY(.5px)}
  /* ---- WHY THE CHANGE, ASKED WHERE THE CHANGE IS MADE ----
     The field, the storage and the display all existed already: a change
     carries a note, the card renders it under "Why they asked", and the old
     portal editor asked for one. The editor both seats actually use never did,
     so every change arrived as bare wording and the owner had to go and ask.

     WIDTH IS THE THING TO BE CAREFUL ABOUT. A textarea does not shrink to fit
     — left alone it takes its size from its cols attribute and can push its container
     wider, which is how this shaded box lost its width once before. Three
     declarations prevent that and none of them are optional: box-sizing so the
     padding is counted inside, width:100% so it tracks the clause rather than
     its own content, and max-width:100% so it can never exceed it.

     Long reasoning wraps rather than scrolling sideways: a textarea soft-wraps
     on its own, and overflow-wrap:anywhere handles the case it will not break
     by itself — a pasted reference or URL with no spaces in it. */
  /* ---- THE CARD ARRIVES SMALL, WHATEVER THE REASON'S LENGTH ----
     Agreed and then not built: the card was to show at most two lines of the
     reason, with Show more unfolding the rest, so one long note cannot push
     three cards below the fold. The mockup had it; the product did not. The
     button is added by negoWireWhyClamp ONLY when the text actually overflows
     — measured, not guessed from characters, because two lines of a narrow
     column is a different count every time the panel is resized. */
  .nego-why-clamp{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;
    overflow:hidden;overflow-wrap:anywhere}
  .nego-why-clamp.open{display:block;-webkit-line-clamp:unset;line-clamp:unset;overflow:visible}
  .nego-why-more{display:block;margin-top:3px;border:0;background:none;padding:0;cursor:pointer;
    font:inherit;font-size:10px;font-weight:700;color:var(--color-accent-700,#0f766e)}
  .nego-why-more:focus-visible{outline:2px solid var(--color-accent,#0d9488);outline-offset:2px;border-radius:3px}
  .nego-reason{display:block;margin-top:8px}
  .nego-reason.hidden,.nego-fmt-bar.hidden{display:none}
  /* Step two: the wording is still there and still exactly where it was, but it
     is being read rather than typed in — so it loses the caret ring and stops
     looking like an open field. */
  .nego-editing.is-review{outline:1px solid var(--n-line);background:var(--n-well,#f8fafc);
    cursor:default}
  .nego-reason>span{display:block;font-size:10px;font-weight:700;letter-spacing:.04em;
    text-transform:uppercase;color:var(--n-ink-soft);margin-bottom:3px}
  .nego-reason textarea{display:block;box-sizing:border-box;width:100%;max-width:100%;
    min-height:52px;resize:vertical;border:1px solid var(--n-line);border-radius:5px;
    padding:7px 9px;font:inherit;font-size:11.5px;line-height:1.6;
    background:var(--n-paper);color:var(--n-ink);outline:none;
    white-space:pre-wrap;overflow-wrap:anywhere}
  .nego-reason textarea:focus{border-color:var(--n-focus)}
  .nego-edit-bar{display:flex;gap:6px;margin-top:6px}
  .nego-edit-bar button{font-size:11px;font-weight:700;border-radius:5px;padding:4px 10px;
    border:1.5px solid transparent;font-family:inherit;cursor:pointer}
  .nego-edit-bar .b-save{background:var(--n-accept);color:#fff}
  .nego-edit-bar .b-cancel{background:var(--n-paper);border-color:var(--n-line);color:var(--n-ink-soft)}
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
    border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot);border-radius:6px;padding:9px 13px}
  .nego-cmp-tag{flex:none;font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;
    background:var(--st-amber-dot);color:#fff;border-radius:4px;padding:2px 7px}
  .nego-cmp-txt{flex:1;min-width:220px;font-size:11.5px;line-height:1.5;color:var(--st-amber-fg)}
  /* Clean read is a HYPOTHETICAL, not history — so it is the room's own slate
     rather than the amber of "you are looking at an old version". Same shape,
     because it is the same kind of thing: a mode, with its way out in it. */
  .nego-cmp-bar.clean{border-color:#c9d5e1;background:var(--n-badge-bg);border-left-color:var(--n-slate)}
  html.dark .nego-cmp-bar.clean{border-color:#334155}
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
  .nego-cmp-exit{flex:none;border:1px solid var(--st-amber-fg);background:var(--st-amber-fg);color:#fff;border-radius:6px;
    padding:6px 13px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
  .nego-cmp-exit:hover{filter:brightness(1.15)}
  .nego-st{margin-left:auto;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase;
    border-radius:5px;padding:2px 7px}
  .nego-st.pending{background:#fdf3e3;color:#9a6a1f}
  html.dark .nego-st.pending{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .nego-st.accepted{background:var(--n-ins-bg);color:var(--n-ins-fg)}
  .nego-st.rejected{background:var(--n-del-bg);color:var(--n-del-fg)}
  .nego-st.verified{background:var(--n-badge-bg);color:var(--n-slate-soft)}
  /* A withdrawn ask sits NEXT TO its status, not instead of it. "rejected ·
     withdrawn" is the whole story: they asked, we said no, they let it go.
     Replacing the status would erase the refusal from the face of the card. */
  .nego-st.withdrawn{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  html.dark .nego-st.withdrawn{border-color:#334155;color:var(--n-ink-soft)}
  .nego-st.sent{margin-left:0;background:var(--n-ins-bg);color:var(--n-ins-fg);border:1px solid var(--st-green-line)}
  /* ---- answered here, and nowhere else yet ----
     Amber, the colour this product already uses for something still open, and
     deliberately louder than the status beside it: the green "accepted" is the
     half of this state a reader already believes. */
  .nego-st.unsent{margin-left:0;background:var(--st-amber-bg);color:var(--st-amber-fg);border:1px solid var(--st-amber-line)}
  /* And on the card itself, so a held answer is one glance rather than one
     read — an index of five cards shows at once which of them have gone. */
  .nego-card.is-held{border-color:var(--st-amber-line);border-left:3px solid var(--st-amber-dot);background:color-mix(in srgb,var(--st-amber-dot) 6%,var(--n-paper))}
  .nego-card.is-held .nego-hold{display:flex}
  .nego-hold{display:none;align-items:flex-start;gap:6px;margin-top:9px;
    border-top:1px dashed var(--st-amber-line);padding-top:8px;font-size:10.5px;line-height:1.45;color:var(--st-amber-fg)}
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
  html.dark .nego-whose{border-color:#334155;color:var(--n-ink-soft)}
  html.dark .nego-whose.mine{background:rgba(127,163,200,.15);color:var(--n-mine);border-color:rgba(127,163,200,.4)}
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
  html.dark .nego-round-tog:hover{background:rgba(255,255,255,.05)}
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
  .nego-card.is-past{cursor:default;background:var(--n-paper);opacity:.92}
  .nego-card.is-past:hover{border-color:var(--n-line)}
  .nego-st.past{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  html.dark .nego-st.past{border-color:#334155;color:var(--n-ink-soft)}
  .nego-past-thread{margin-top:9px;border-top:1px dashed var(--n-line);padding-top:8px}
  .nego-contested{border-left:2px solid var(--n-reject);background:var(--n-del-bg);border-radius:0 4px 4px 0;
    padding:6px 9px;margin-bottom:8px;font-size:11px;line-height:1.5;color:var(--n-ink)}
  .nego-hash{font-family:var(--n-font-mono);font-size:9.5px;color:var(--n-slate-soft);
    background:var(--n-badge-bg);border:1px solid #dde5ee;border-radius:5px;padding:4px 7px;
    margin-bottom:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  html.dark .nego-hash{border-color:#334155}
  .nego-acts{display:flex;gap:6px}
  .nego-acts button{flex:1;border-radius:6px;padding:6px 0;font:inherit;font-size:11.5px;font-weight:700;
    border:1.5px solid transparent;background:var(--n-paper);cursor:pointer;transition:all .12s ease}
  .nego-acts .b-acc{border-color:var(--n-accept);color:var(--n-accept)}
  .nego-acts .b-acc:hover{background:var(--n-accept);color:#fff}
  .nego-acts .b-rej{border-color:var(--n-reject);color:var(--n-reject)}
  .nego-acts .b-rej:hover{background:var(--n-reject);color:#fff}
  .nego-acts .b-dis{border-color:#c9d5e1;color:var(--n-slate-soft)}
  html.dark .nego-acts .b-dis,html.dark .nego-acts .b-undo{border-color:#334155}
  .nego-acts .b-dis:hover{background:var(--n-badge-bg)}
  .nego-acts .b-dis.has-thread{border-color:var(--n-slate-soft)}
  /* ---- somebody is waiting on an answer ----
     The count could not say this. "Discuss (2)" reads the same whether the last
     word was theirs an hour ago or yours a moment ago, so a question addressed
     to you sat on a card looking exactly like a settled conversation. Amber is
     the colour this product already uses for an open point, and it stops the
     moment the thread is opened — a light that never goes out is a light people
     stop seeing. */
  .nego-acts .b-dis.has-unread{border-color:var(--st-amber-dot);color:var(--st-amber-fg);background:var(--st-amber-bg);
    animation:negoUnread 1.2s ease-in-out infinite}
  @keyframes negoUnread{
    0%,100%{background:var(--st-amber-bg);box-shadow:0 0 0 0 rgba(184,134,43,0)}
    50%{background:#f7e9c8;box-shadow:0 0 0 3px rgba(184,134,43,.28)}
  }
  /* The pulse's bright frame is a cream that would flash white on dark paper,
     so dark mode swaps the whole animation for one that peaks as a wash. */
  html.dark .nego-acts .b-dis.has-unread{animation-name:negoUnreadDark}
  @keyframes negoUnreadDark{
    0%,100%{background:var(--st-amber-bg);box-shadow:0 0 0 0 rgba(245,158,11,0)}
    50%{background:rgba(245,158,11,.3);box-shadow:0 0 0 3px rgba(245,158,11,.25)}
  }
  .nego-acts .b-undo{border-color:#c9d5e1;color:var(--n-ink-soft);flex:0 0 auto;padding:6px 12px}
  .nego-acts .b-undo:hover{background:var(--n-canvas)}
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
  /* ---- THE DECISION LIST NEEDS ROOM TO SHOW A DECISION ----
     Measured on a 1080p laptop at 150% scaling (a 590px page): the list was
     given 83px of height for a card 110px tall, so the reader saw a sliver of
     one change with the bulk buttons pressed against it. The list is the
     point of the panel; everything above it is furniture, so on a short
     window the furniture gives way first. The 90px tail on the scroller was
     the single biggest offender — it exists to clear the floating action bar,
     which is not that tall. */
  @media (max-height:820px){
    .nego-index-head{padding:9px 14px 8px}
    .nego-bulk{margin-top:7px}
    .nego-index-scroll{padding:9px 10px 56px}
  }
  @media (max-height:680px){
    .nego-index-head{padding:7px 12px 6px}
    .nego-track{margin-bottom:5px}
    .nego-bulk{margin-top:5px}
    .nego-bulk button{padding:5px 0}
    .nego-index-scroll{padding:7px 9px 40px}
  }

  @media (prefers-reduced-motion:reduce){
    .nego-scroll,.nego-index-scroll{scroll-behavior:auto}
    .nego-room *,#nego-root *{transition:none !important;animation:none !important}
    .nego-pulse{animation:none !important;background:#5b83ad}
    .nego-acts .b-dis.has-unread{animation:none !important;background:#f7e9c8;
      border-color:var(--st-amber-dot);color:var(--st-amber-fg)}
    html.dark .nego-acts .b-dis.has-unread{background:rgba(245,158,11,.3)}
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
  /* Two clicks to close the gap: this one, then the preview's confirm. */
  const door = (!locked && opts.offer)
    ? `<button type="button" class="renum" data-renumber-open="${_ne(c.id)}"
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
function negoTimelineScreenHtml(c, f = {}){
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
      .ht h3{font-family:var(--font-heading);font-weight:600;font-size:18px;color:var(--color-text);margin:0 0 2px}
      .ht .ht-sub{font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px}
      .ht .ht-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--color-divider)}
      .ht .ht-f{display:flex;flex-direction:column;gap:2px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--color-neutral-600)}
      .ht .ht-f select{font:inherit;font-size:12px;font-weight:400;text-transform:none;letter-spacing:0;border:1px solid var(--color-divider);border-radius:4px;padding:4px 6px;background:var(--color-surface);color:var(--color-text);max-width:180px}
      .ht .ht-ev{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid color-mix(in srgb,var(--color-divider) 55%,transparent)}
      .ht .ht-mark{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--color-bg);border:1px solid var(--color-divider);font-size:11px}
      .ht .ht-body{flex:1;min-width:0}
      .ht .ht-text{font-size:12.5px;line-height:1.5;color:var(--color-text)}
      .ht .ht-meta{font-size:10.5px;color:var(--color-neutral-600);margin-top:1px}
      .ht .ht-clause{font-weight:600}
      .ht .ht-redline{border:1px solid var(--color-divider);border-radius:4px;padding:7px 9px;margin-top:6px;font-size:11.5px;line-height:1.55;background:var(--color-surface)}
      .ht .ht-redline ins{background:var(--st-green-bg);text-decoration:none}
      .ht .ht-redline del{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
      .ht .ht-note{font-size:11px;color:var(--color-neutral-700);margin-top:4px;border-left:2px solid var(--color-divider);padding-left:8px}
    </style>
    <h3>Negotiation history — ${_ne(c.name || c.id)}</h3>
    <p class="ht-sub">${all.length} event${all.length === 1 ? '' : 's'}, oldest first. Labels read as they were when each event happened.</p>
    <div class="ht-filters">
      ${sel('ht-f-clauseId', 'Clause', uniq(all.map(e => [e.clauseId || '', e.clauseLabel || ''])), f.clauseId)}
      ${sel('ht-f-actor', 'Person', uniq(all.map(e => [e.actor || '', e.actor || ''])), f.actor)}
      ${sel('ht-f-side', 'Side', [['owner', 'Owner side'], ['counterparty', 'Counterparty']], f.side)}
      ${sel('ht-f-round', 'Round', uniq(all.filter(e => e.round != null && e.round !== '').map(e => [e.round, 'Round ' + e.round])), f.round)}
      ${sel('ht-f-outcome', 'Outcome', [['accepted', 'Accepted'], ['rejected', 'Rejected'], ['pending', 'Pending'], ['withdrawn', 'Withdrawn']], f.outcome)}
      <button id="ht-clear" class="ui-btn" style="align-self:flex-end;font-size:11px;padding:5px 10px">${i18t('ng_clear')}</button>
      <span style="flex:1"></span>
      <button id="ht-verify" class="ui-btn" style="align-self:flex-end;font-size:11px;padding:5px 10px" title="${i18t('ng_recompute_title')}">${i18t('ng_verify_integrity')}</button>
      <button id="ht-export" class="ui-btn" style="align-self:flex-end;font-size:11px;padding:5px 10px" title="${i18t('ng_report_title')}">${i18t('ng_export_history')}</button>
    </div>
    <div id="ht-verify-result"></div>
    <div id="ht-list">${list.length
      ? list.map(e => negoTimelineEventHtml(c, e)).join('')
      : `<div style="font-size:12px;color:var(--color-neutral-600);padding:14px 0">${i18t('ng_nothing_matches')}</div>`}</div>
  </div>`;
}
function openHistoryTimeline(c, f = {}){
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
  openModal(negoTimelineScreenHtml(c, f), { maxWidth: '820px' });
  /* Filters combine: every change re-renders the same screen with the whole
     filter state, so the two sources of truth cannot drift. */
  const read = () => {
    const g = k => { const el = document.getElementById('ht-f-' + k); return el && el.value ? el.value : ''; };
    return { clauseId: g('clauseId'), actor: g('actor'), side: g('side'), round: g('round'), outcome: g('outcome') };
  };
  document.querySelectorAll('#history-timeline [data-ht-filter]').forEach(s =>
    s.addEventListener('change', () => openHistoryTimeline(c, read())));
  document.getElementById('ht-clear')?.addEventListener('click', () => openHistoryTimeline(c, {}));
  /* WP-2.5 — the one answer, with the first broken link named. The result
     panel is written, never toasted: a verdict about the integrity of a legal
     record does not scroll away. */
  document.getElementById('ht-verify')?.addEventListener('click', async () => {
    const box = document.getElementById('ht-verify-result');
    if (!box || !window.negoIntegrityReport) return;
    box.innerHTML = `<div style="font-size:11.5px;color:var(--color-neutral-600);padding:8px 0">${i18t('ng_recomputing')}</div>`;
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
    /* Give the document its own turn to lay out before the dialog freezes it —
       print() on a document written this instant can measure nothing. */
    w.onload = () => { try { w.focus(); w.print(); } catch (e) {} };
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 350);
  } catch (e){
    try { w.close(); } catch (e2) {}
    if (window.toast) toast(i18t('ng_could_not_build_history'), 'err');
  }
}
function negoVerifyResultHtml(r){
  return r.ok
    ? `<div data-verify-ok="1" style="border:1px solid color-mix(in srgb,var(--st-green-dot) 30%,transparent);background:var(--st-green-bg);border-radius:6px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--st-green-fg)">✓ ${_ne(r.detail)}. Verified ${_ne(String(r.at).slice(0, 19).replace('T', ' '))} UTC.</div>`
    : `<div data-verify-ok="0" style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:6px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:var(--st-ruby-fg)"><b>${i18t('ng_integrity_failed')}</b> ${_ne(r.firstBroken || r.detail)}<br><span style="font-size:11px">Nothing has been changed by this check. The first broken link is named above; everything before it verified. Checked ${_ne(String(r.at).slice(0, 19).replace('T', ' '))} UTC.</span></div>`;
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

   And not colour ALONE. This is a report people print and file: browsers drop
   backgrounds when printing unless told otherwise, and a reader with a colour
   vision deficiency gets nothing from a green wash either. So the strike and
   the underline carry the meaning too, print-color-adjust asks for the wash on
   top rather than instead of them, and a legend states the convention in words.

   Everything explanatory stays HERE rather than in the emitted <style>: the
   file goes to a counterparty, and our commentary is not theirs to read. */
function negoHistoryExportHtml(c, report){
  const ev = negoTimeline(c, {});
  const sigs = (c.signatures || []).map(s =>
    `<li>${_ne(s.name || '')}${s.title ? `, ${_ne(s.title)}` : ''} — ${_ne(s.party || '')}${s.verified === false ? ' (NOT independently verified)' : s.method ? ` (${_ne(s.method)})` : ''}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Negotiation history — ${_ne(c.name || c.id)}</title>
<style>
  body{font:13px/1.55 Georgia,serif;color:#1c2126;max-width:760px;margin:32px auto;padding:0 18px}
  h1{font-size:21px;margin:0 0 2px} .sub{color:#5a6470;font-size:12px;margin:0 0 18px}
  .integrity{border:1.5px solid ${report.ok ? '#10b981' : '#f43f5e'};border-radius:6px;padding:12px 14px;margin:0 0 20px;font-size:12.5px}
  .ht-ev{display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #e3e7ea;page-break-inside:avoid}
  .ht-mark{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;border:1px solid #cdd4da;font-size:11px}
  .ht-body{flex:1;min-width:0} .ht-text{font-size:12.5px} .ht-meta{font-size:10.5px;color:#5a6470}
  .ht-clause{font-weight:600}
  .ht-redline{border:1px solid #e3e7ea;border-radius:4px;padding:7px 9px;margin-top:6px;font-size:11.5px}
  /* added wording */
  .ht-redline ins{background:#d1fae5;color:#047857;text-decoration:underline;
    text-decoration-thickness:1px;text-underline-offset:2px}
  .ht-redline del{background:#ffe4e6;color:#be123c;text-decoration:line-through}
  .ht-redline ins,.ht-redline del{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ht-key{margin:0 0 14px;font-size:11px;color:#5a6470}
  .ht-key ins,.ht-key del{padding:0 3px;border-radius:2px}
  /* OI-5: open the seam between a deletion and its replacement — display only */
  .ht-redline del+ins{margin-left:.3em}
  .ht-note{font-size:11px;color:#3c454e;margin-top:4px;border-left:2px solid #cdd4da;padding-left:8px}
  @media print{ body{margin:10mm auto} }
</style></head><body>
<h1>Negotiation history — ${_ne(c.name || c.id)}</h1>
<p class="sub">${_ne(c.id)} · between ${_ne(_ngOurParty(c) || 'the owner')} and ${_ne(c.counterparty || 'the counterparty')}
 · ${ev.length} events, oldest first · generated ${_ne(String(report.at).slice(0, 19).replace('T', ' '))} UTC by HaTi CLM</p>
<div class="integrity">
  <b>${report.ok ? '✓ Record verified' : '✗ Integrity check FAILED'}</b> — ${_ne(report.detail)}<br>
  Run ${_ne(String(report.at).slice(0, 19).replace('T', ' '))} UTC · ${report.chain.checked} chained record${report.chain.checked === 1 ? '' : 's'} recomputed${c.hash ? ` · document seal (SHA-256): <span style="font-family:monospace;font-size:10.5px;word-break:break-all">${_ne(c.hash)}</span>` : ' · not yet executed, so no seal to check'}
</div>
<p class="ht-key">${i18t('ng_in_redlines_below')} <ins>${i18t('ng_underlined_green')}</ins> and
 <del>${i18t('ng_struck_red')}</del>.</p>
${sigs ? `<p style="font-size:12px"><b>${i18t('ng_sigs_on_record')}</b></p><ul style="font-size:12px">${sigs}</ul>` : ''}
${ev.map(e => negoTimelineEventHtml(c, e)).join('')}
<p style="font-size:10.5px;color:#5a6470;margin-top:22px">This report stands alone: every sentence above was generated from the stored
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
    if (window.toast) toast(i18t('ng_nothing_to_renumber'));
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
  const meta = [c.counterparty ? `Between ${(_ngOurParty(c) || 'this workspace')} and ${c.counterparty}` : null,
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
  const clauseBlock = (cl, ch, domPrefix) => {
    if (baseline || !ch)
      return `<div class="nego-clause" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}">
        ${tools(cl)}${head(cl) ? `<h2 data-nego-chrome>${head(cl)}</h2>` : ''}${negoRichBody(cl)}</div>`;

    let body, badgeCls = '', badgeSuffix = '', note = '';
    /* A FORMATTING-ONLY change has all-keep ops — rendered from them it would
       show the baseline with no marks at all, a proposal invisible on the page
       it is proposed on. So it renders the proposed rich body itself (the new
       formatting, visible), and the chip in the notes row says what kind of
       ask it is. No rich-diff marks are invented — the words are unchanged by
       definition, and the summary and chip say so. */
    const fmtBody = (ch.formattingOnly && ch.bodyHtml && window.sanitizeRich)
      ? `<div class="nego-redline nego-fmt-only">${sanitizeRich(ch.bodyHtml)}</div>` : null;
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
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}" data-change="${_ne(ch.id)}">
      ${row}<button class="nego-badge${active && !badgeCls ? ' is-active' : ''}${badgeCls ? ' ' + badgeCls : ''}"
        data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}" aria-label="${_ne(i18t('ng_change_aria',{id:ch.id,status:ch.status}))}">#${_ne(ch.id)}${badgeSuffix}</button>
      ${head(cl) ? `<h2 data-nego-chrome>${head(cl)}${inHead}</h2>` : inHead}${body}</div>`;
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
      <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--n-ink-soft)">
        <b style="display:block;color:var(--n-ink);margin-bottom:4px">${i18t('ng_no_differences')}</b>
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
  const changes = negoChanges(c).filter(x => x.status !== 'superseded'
    && (!_mineOnly || _mineOnly.has(String(x.id))));
  const history = negoHistoryHtml(c, opts);
  if (!changes.length) return `
    <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--n-ink-soft)">
      <b style="display:block;color:var(--n-ink);margin-bottom:4px">${i18t('ng_no_changes')}</b>
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
              : `<div style="font-size:11.5px;margin-bottom:6px"><b>${_ne(m.who)}</b> ${_ne(m.text)}</div>`;
            return `<div class="nego-msg${shared ? '' : ' is-internal'}">
              <div style="margin-bottom:3px">${badge}</div>${bubble}</div>`;
          }).join('')
          : `<div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:8px">${i18t('ng_no_comments_yet')}</div>`}</div>
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
        ${undoable ? `<button class="b-undo" data-nego-undo="${_ne(ch.id)}">${i18t('ng_undo')}</button>` : ''}
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
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
          <span class="nego-id">#${_ne(ch.id)}</span>
          ${negoWhoseHtml(c, ch, opts, mine)}
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
        ${ch.status === 'rejected' && !ch.withdrawn ? `<div class="nego-contested" data-contested="${_ne(ch.id)}">
          <b>${i18t('ng_still_between_you')}</b> This was refused. It stops being outstanding when
          ${mine ? 'you withdraw it' : `${_ne(ch.author)} withdraws it`} — until then neither side can signal readiness to sign.</div>` : ''}
        <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
        ${''/* The "(your side)" italic that used to live here is gone. It was
                the only thing on the card saying whose ask this was: grey, small,
                at the bottom, next to a name that on a deal where both sides are
                you says nothing at all. It is a pill in the top row now, and the
                card carries an edge. */}
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${i18t('ng_author')} <b style="color:var(--n-ink);font-weight:600">${_ne(ch.author)}</b></div>
        ${''/* Both renderers carry it — the project's own duplication rule. */}
        ${(side !== 'counterparty' && ch.revisedBy && ch.revisedBy !== ch.author) ? `<div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px"
          title="${_ne(i18t('ng_revised_title'))}"><span aria-hidden="true">&#9998;</span> ${
          i18t('ng_revised_by_after',{who:_ne(ch.revisedBy),author:_ne(ch.author)})}</div>` : ''}
        ${(ch.why || ch.note) ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
          <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n-slate)">${i18t('ng_why_they_asked')}</span>
          <span class="nego-why-clamp" style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(ch.why || ch.note)}</span></div>` : ''}
        ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--n-ink)"><b>${i18t('ng_reply')}</b> ${_ne(ch.reply)}</div>` : ''}
        ${(() => { if (!window.reviewSeatShowsReview || !reviewSeatShowsReview(opts)) return '';
          const v = window.reviewOn ? reviewOn(ch) : null;
          /* Same rule as the workbench's twin: the note names its author. */
          const sayBy = (v && window.reviewVerdictByFor) ? reviewVerdictByFor(ch, null, c) : (v && v.by);
          return (v && v.note && sayBy) ? `<div style="border-left:2px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
            ${''/* NOT UPPERCASE, unlike the labels above it: this one holds a
                   PERSON'S NAME. "WHY THEY ASKED" is a caption and capitals
                   read as a caption; "ACHIENG OTIENO SAID" reads as shouting,
                   and a long name in caps outgrows the card. Same rule as the
                   review chip beside it. */}
            <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.01em;color:var(--st-amber-fg)">${i18t('rv_reviewer_said', { who: _ne(sayBy) })}</span>
            <span style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(v.note)}</span></div>` : ''; })()}
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
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;flex-wrap:wrap">
      <span class="nego-id">#${_ne(ch.id)}</span>
      ${negoWhoseHtml(c, ch, opts || {}, mine)}
      <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
      ${ch.withdrawn ? '<span class="nego-st withdrawn">withdrawn</span>' : ''}
      <span class="nego-st past" data-past-round="${_ne(ch.id)}"
        title="${_ne(i18t('ng_decided_archived',{n:r.n}))}">${i18t('ng_round_lower',{n:_ne(r.n)})}</span>
    </div>
    <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
    <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
    <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${i18t('ng_author')} <b style="color:var(--n-ink);font-weight:600">${_ne(ch.author)}</b></div>
    ${(ch.why || ch.note) ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
      <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n-slate)">${i18t('ng_why_they_asked')}</span>
      <span class="nego-why-clamp" style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(ch.why || ch.note)}</span></div>` : ''}
    ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--n-ink)"><b>${i18t('ng_reply')}</b> ${_ne(ch.reply)}</div>` : ''}
    <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
    ${msgs.length ? `<div class="nego-past-thread">
      <div class="nego-tlabel">${i18tn('ng_discussion_closed',msgs.length,{id:_ne(ch.id),n:msgs.length})}</div>
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
      <span class="seg" style="font-family:var(--n-font-mono);font-size:9.5px;opacity:.6">${_ne(String(opts.side === 'counterparty' ? 'counterparty view' : 'owner view'))} · fingerprinted redline</span>
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
      background:var(--n-paper);border:1px solid var(--n-line);border-radius:6px;box-shadow:var(--shadow-sm)">
      <span style="font-size:12.5px;font-weight:700;color:var(--n-ink)">${i18t('ng_negotiation')}</span>
      <span class="nego-ver">${i18t('ng_round_n',{n:negoRound(c)})}</span>
      <span style="font-size:11.5px;color:var(--n-ink-soft);min-width:0;flex:1">
        ${p.total
          ? `${p.done} of ${p.total} change${p.total === 1 ? '' : 's'} resolved — every change carries its own fingerprint.`
          : 'No changes on the table yet. Propose wording and each change becomes a fingerprint on this list.'}
      </span>
      ${canAct && p.pending ? `
        <button id="nego-all-acc" class="ui-btn" title="${i18t('ng_accept_nonrisk_title')}" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:var(--st-green-fg);color:var(--st-green-fg)">${i18t('ng_accept_all_nonrisk')}</button>
        <button id="nego-all-rej" class="ui-btn" title="${i18t('ng_reject_all_title')}" style="flex:none;font-size:11.5px;padding:5px 11px;border-color:var(--st-ruby-dot);color:var(--st-ruby-dot)">${i18t('ng_reject_all_cp')}</button>` : ''}
      ${side === 'owner' ? `<button id="nego-export" class="ui-btn" style="flex:none;font-size:11.5px;padding:5px 11px"
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
    <div id="nego-ready" style="flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
      border:1px solid var(--st-green-line);background:var(--st-green-bg);border-left:4px solid var(--st-green-fg);border-radius:6px;
      padding:12px 16px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-green-fg);color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:var(--st-green-fg)">${i18t('ng_ready_every_resolved')}</span>
        <span style="display:block;font-size:11.5px;color:var(--n-ink-soft);margin-top:1px">All ${p.total} change${p.total === 1 ? '' : 's'} on the table ${p.total === 1 ? 'has' : 'have'} an answer${accepted ? ` · ${accepted} adopted into the wording` : ''}${withdrawn ? ` · ${withdrawn} ask${withdrawn === 1 ? '' : 's'} withdrawn` : ''}. Nothing is outstanding between the parties.</span>
      </span>
      ${side === 'owner'
        ? `<button id="nego-to-docs" class="ui-btn ui-btn-primary nego-go" style="flex:none">${i18t('ng_send_to_docs')}</button>`
        : `<span style="flex:none;font-size:11.5px;color:var(--n-ink-soft)">${i18t('ng_will_send_signature',{who:_ne(window.FIRST_PARTY || i18t('ng_other_side'))})}</span>`}
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
      style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-radius:6px;padding:9px 14px;
      border:1px solid ${mine ? 'var(--st-green-line)' : 'var(--n-line)'};background:${mine ? 'var(--st-green-bg)' : 'var(--n-badge-bg)'};
      border-left:4px solid ${mine ? 'var(--n-accept)' : 'var(--n-slate-soft)'}">
    <span style="flex:1;min-width:200px;font-size:12.5px;font-weight:600;color:${mine ? 'var(--st-green-fg)' : 'var(--n-ink)'}">
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
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
          <h3 style="font-size:12.5px;font-weight:800;margin:0;flex:1;min-width:0">${i18t('ng_change_index')}</h3>
          <span class="nego-count" id="nego-count">${cmp && !cmp.live ? cmp.moved : (p.pending || p.total)}</span>
          <button class="nego-fold" id="nego-fold" title="${i18t('ng_fold_index')}">${i18t('ng_hide')}</button>
        </div>
        ${cmp && !cmp.live ? `
        <div style="font-size:11px;color:var(--n-ink-soft)" id="nego-progress">${i18t('ng_readonly_comparison')}</div>`
        : `
        <div class="nego-track"><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
        <div style="font-size:11px;color:var(--n-ink-soft)" id="nego-progress">${i18tn('ng_resolved',p.total,{done:p.done,total:p.total})}</div>
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
        ${canAct ? `<div class="nego-bulk">
          <button class="b-acc" id="nego-bulk-acc"${p.pending ? '' : ' disabled'}
            title="${side === 'owner'
              ? 'Accepts only the pending changes that trip no playbook, scan or review signal'
              : `Accepts every change ${_ne(negoOtherSideName(opts))} has proposed. Your own asks are untouched.`}"
            >${side === 'owner' ? 'Accept All Non-Risk' : 'Accept all'}</button>
          <button class="b-rej" id="nego-bulk-rej"${p.pending ? '' : ' disabled'}
            title="${_ne(i18t('ng_reject_all_who_title',{who:negoOtherSideName(opts)}))}">${side === 'owner' ? i18t('ng_reject_all_cp2') : i18t('ng_reject_all2')}</button>
        </div>` : ''}
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
    ${window.rlOneNoticeHtml ? rlOneNoticeHtml(c, opts) : ''}
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
    <button class="nego-tbtn acc" id="nego-all-acc"${p.pending && canAct ? '' : ' disabled'}
      title="${comparing ? 'Not while you are comparing versions' : 'Accepts only the pending changes that trip no playbook, scan or review signal — the rest are held back for you'}">${i18t('ng_accept_all_nonrisk_btn')}</button>
    <button class="nego-tbtn rej" id="nego-all-rej"${p.pending && canAct ? '' : ' disabled'}
      title="${comparing ? 'Not while you are comparing versions' : 'Rejects every pending change proposed by the other side. Your own asks are untouched.'}">${i18t('ng_reject_all_cp_btn')}</button>
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
      x.why ? ` <span style="color:var(--st-ruby-fg)">— ${e(x.why.join('; '))}</span>` : ''}</li>`;
  }).join('') + (arr.length > 12 ? `<li style="color:var(--color-neutral-600)">${i18t('ng_and_more',{n:arr.length - 12})}</li>` : '');
  const body = `
    <div style="font-size:12.5px;line-height:1.6">
      <p style="margin:0 0 8px"><b>${take.length} change${take.length === 1 ? '' : 's'}</b> will be ${kind === 'accept' ? 'accepted and merged into the wording' : 'rejected, reverting those clauses to the baseline'}.</p>
      <ul style="margin:0 0 12px;padding-left:18px">${list(take)}</ul>
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
  if (top + h > window.innerHeight - pad) top = Math.max(pad, rect.top - h - 8);
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
      <button type="button" data-ai-x class="ui-btn" style="font-size:11px;padding:3px 9px">${i18t('act_close')}</button></header>
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
  body.innerHTML = (note ? `<p style="font-family:var(--n-font-ui);font-size:12.5px;line-height:1.6;margin:0 0 10px;padding:9px 11px;background:var(--n-canvas);border-radius:6px">${e(note)}</p>` : '')
    + (canApply
      ? `<div class="nego-redline">${structured || e(proposed)}</div>`
      : `<p style="font-family:var(--n-font-ui);font-size:12.5px;color:var(--n-ink-soft);margin:0">${note ? i18t('ng_no_wording_note_is_all') : i18t('ng_no_wording_change')}</p>`);
  pop.insertBefore(body, pop.querySelector('header').nextSibling);
  const foot = document.createElement('footer');
  foot.innerHTML = `
    ${canApply ? `<button type="button" data-ai-apply class="ui-btn ui-btn-primary" style="font-size:12px">${i18t('ng_apply_redline')}</button>` : ''}
    <button type="button" data-ai-cancel class="ui-btn" style="font-size:12px">${i18t('act_cancel')}</button>
    <span style="flex:1"></span>
    <span style="font-family:var(--n-font-ui);font-size:10.5px;color:var(--n-ink-soft);align-self:center">${i18t('ng_nothing_changed_yet')}</span>`;
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
  negoRiskOf, negoBatchSplit, negoBatchConfirm, NEGO_AI_ACTIONS,
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
const _NEGO_SEL_CHROME = '[data-nego-chrome],.rl-tools,.rl-tool,.nego-tool,.rl-asktag,.nego-badge,'
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
    <div style="padding:18px 20px 16px">
      <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 6px">${e(i18t('rv_warn_title'))}</h2>
      <p style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-700);margin:0 0 12px">${e(warn.text)}</p>
      <ul style="list-style:none;margin:0 0 14px;padding:0;display:flex;flex-direction:column;gap:4px">
        ${warn.ids.map(id => `<li style="font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-700)">#${e(id)}</li>`).join('')}
      </ul>
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
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
      const ch = await negoInsertClause(c, after || null,
        { headingText: cl.name, bodyHtml: window.textToRich ? textToRich(cl.preferred) : `<p>${_ne(cl.preferred)}</p>` },
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

       Only PENDING. An accepted change is in the baseline already, and a
       rejected one means the baseline stands — reopening either from the
       change would edit wording the record no longer carries. A proposed
       DELETION carries no replacement wording at all, so it falls through to
       the baseline too, which is exactly what the document is still showing.
       And bodyHtml is not guaranteed on a change (one lifted from returned
       text may have only ops), so the baseline stays the floor.

       WHICH change is read off the CLAUSE ITSELF — the id the renderer wrote
       into the block it drew — rather than searched for in the record. The
       record holds changes this page is deliberately not showing: the wall
       keeps the other side's unsent drafts out of the document (see the
       hiddenIds note at negoDocHtml), and a search of c.changes would have
       walked straight past it and opened the editor on wording the reader is
       not entitled to see. Reading the block's own anchor means the editor can
       only ever open on the wording already on the screen. */
    const shownId = block.getAttribute('data-nego-card-anchor')
      || block.getAttribute('data-change');
    const onTable = shownId
      ? (typeof negoChanges === 'function' ? negoChanges(c) : [])
        .find(x => x && x.id === shownId && x.status === 'pending'
          && x.changeType !== 'deleteClause' && x.changeType !== 'insertClause')
      : null;
    const openOn = (onTable && String(onTable.bodyHtml || '').trim())
      || cl.bodyHtml || `<p>${_ne(cl.text)}</p>`;
    const holder = document.createElement('div');
    holder.className = 'nego-editing';
    holder.setAttribute('contenteditable', 'true');
    holder.setAttribute('data-nego-editor', clauseId);
    /* Sanitised on the way IN as well as on the way out. Every other surface
       that shows a clause runs its stored markup through sanitizeRich at
       render time — the rule js/richdoc.js states in its own header, because
       the counterparty portal serves people outside the workspace — and this
       one path assigned storage straight into a live element. */
    holder.innerHTML = window.sanitizeRich ? sanitizeRich(openOn) : openOn;
    body.replaceWith(holder);
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
    /* ---- SAVE IS TWO STEPS, IN THE SAME BOX ----
       A reason sitting under the wording as one more optional field is a field
       people scroll past, and the record ends up full of changes nobody can
       explain a round later. So Save leads INTO the question instead: step one
       is the wording, step two asks why, and the change is not filed until one
       of them is answered or skipped. Nothing is ever recorded without the
       question having been put.

       In the box rather than over it, deliberately. A dialog per redline is
       unmissable and it is also six dialogs in a six-clause pass — which is
       the moment somebody starts typing a full stop to get through it, and a
       full stop in the record is worse than a blank because it reads as an
       answer. Nothing covers the contract, nothing moves, and the shaded
       clause keeps its width (asserted in test/chromium/live-verify.js).

       SKIPPABLE, ON PURPOSE. The question is unavoidable; the answer is not.
       Skip is a visible button, so a blank reason means somebody decided
       against giving one — and on the counterparty's page there is no login
       and no support desk, where a required box collects punctuation. */
    const why = document.createElement('label');
    why.className = 'nego-reason hidden';
    why.innerHTML = `<span>${i18t('ng_why_this_change')}</span>`
      + `<textarea data-nego-reason="${_ne(clauseId)}" rows="2" wrap="soft" spellcheck="true"`
      + ` placeholder="${_nea(i18t('ng_ph_reason_example'))}"></textarea>`;
    holder.after(why);
    const bar = document.createElement('div');
    bar.className = 'nego-edit-bar';
    const step1 = `<button class="b-save" data-nego-next="${_ne(clauseId)}">${i18t('ng_save_change')}</button>`
      + `<button class="b-cancel" data-nego-cancel="${_ne(clauseId)}">${i18t('act_cancel')}</button>`;
    const step2 = `<button class="b-save" data-nego-save="${_ne(clauseId)}">${i18t('ng_file_change')}</button>`
      + `<button class="b-cancel" data-nego-skip="${_ne(clauseId)}">${i18t('ng_skip_no_reason')}</button>`
      + `<button class="b-cancel" data-nego-back="${_ne(clauseId)}">${i18t('ng_back_to_wording')}</button>`;
    bar.innerHTML = step1;
    why.after(bar);
    if (holder.focus) holder.focus();

    const file = () => {
      const note = String((why.querySelector('textarea') || {}).value || '').trim();
      fileAndRepaint(() => negoEditClause(c, clauseId, holder.innerHTML,
        { side, author: opts.by, why: note || undefined }),
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
      bar.querySelector('[data-nego-back]')?.addEventListener('click', ev => { ev.stopPropagation(); toStep(1); });
      bar.querySelector('[data-nego-skip]')?.addEventListener('click', ev => {
        ev.stopPropagation();
        /* Skip means file with no reason, not file with whatever half-sentence
           is sitting in the box. */
        const t = why.querySelector('textarea'); if (t) t.value = '';
        file();
      });
      bar.querySelector('[data-nego-save]')?.addEventListener('click', ev => { ev.stopPropagation(); file(); });
      bar.querySelector('[data-nego-next]')?.addEventListener('click', ev => { ev.stopPropagation(); toStep(2); });
    };
    const toStep = n => {
      const two = n === 2;
      /* The wording stays in the DOM on step two rather than being torn down
         and rebuilt: Back has to return the reader to what they typed, not to
         what the clause said before they started. */
      holder.setAttribute('contenteditable', two ? 'false' : 'true');
      holder.classList.toggle('is-review', two);
      fmt.classList.toggle('hidden', two);
      why.classList.toggle('hidden', !two);
      bar.innerHTML = two ? step2 : step1;
      wire();
      const t = why.querySelector('textarea');
      if (two && t) t.focus(); else if (holder.focus) holder.focus();
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
    const paneSel = '.nego-pane.working .nego-doc, .nego-doc[data-nego-working]';
    const openSelMenu = () => {
      const sel = window.getSelection && window.getSelection();
      if (!sel || sel.isCollapsed){ _negoKillSelMenu(); return; }
      const anchorNode = sel.anchorNode;
      const pane = anchorNode && anchorNode.nodeType === 1
        ? anchorNode.closest(paneSel)
        : (anchorNode && anchorNode.parentElement ? anchorNode.parentElement.closest(paneSel) : null);
      if (!pane || !host.contains(pane)){ _negoKillSelMenu(); return; }
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
      const changeId = clauseEl.getAttribute('data-change')
        || clauseEl.getAttribute('data-nego-card-anchor');
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
        opts.selMenu({ c, opts, text, clauseId, rect, side, again, marked, settled, spans,
          passage, clauseIds: passage.clauseIds });
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
      const changeId = clauseEl && (clauseEl.getAttribute('data-change')
        || clauseEl.getAttribute('data-nego-card-anchor'));
      const chOf = changeId && window.negoChangeById ? negoChangeById(c, changeId) : null;
      const live = !!chOf && chOf.status === 'pending' && !chOf.withdrawn;
      const hasMarks = !!(clauseEl && clauseEl.querySelector
        && [...clauseEl.querySelectorAll('ins, del, .nego-ins, .nego-del, [data-change-id]')]
          .some(n => String(n.textContent || '').trim()));
      const passage = { text, readings: [], occurrence: 0, parts: [], hasMarks,
        clauses: clauseEl ? [clauseEl] : [], clauseIds: [clauseId], multiRange: false };
      const ctx = { c, opts, text, clauseId, rect, side, again, whole: true, event: 'click',
        marked: hasMarks && live, settled: hasMarks && !live, spans: false,
        passage, clauseIds: [clauseId] };
      _negoKillSelMenu();
      if (typeof opts.selMenu === 'function'){ opts.selMenu(ctx); return; }
      defaultMenu(ctx);
    }));
    /* A MOUSEUP ON A CONTROL IS NOT A SELECTION GESTURE, and treating it as one
       made the Redline workbench's AI Assist flash and vanish. The clause
       toolbar sits inside this host, so pressing it fires this handler too;
       a tick later openSelMenu looked for a selection, found none — a click
       collapses one — and dismissed the menu the button's own click handler had
       just opened. The menu was removed by the gesture that asked for it.

       So the gesture is read first: pressing a button, a link or a field is
       somebody operating the page, not selecting words in it. */
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

  byId('nego-export')?.addEventListener('click', () => {
    if (negoProgress(c).pending){ if (window.toast) toast(i18t('ng_resolve_before_export'), 'err'); return; }
    if (window.exportContractPdf) exportContractPdf(c);
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
function negoResetView(){ _negoActive = null; _negoThreads = {}; _negoRedeciding = {}; _negoOpenRounds = {}; _negoClean = false; _rlRead = 'marks'; _rlCardFilter = 'all'; negoSetComparePair('baseline', 'working'); }

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
function rlCardFilterPass(ch, side){
  const f = rlCardFilter();
  if (f === 'all' || !ch) return true;
  const mine = ch.authorSide === (side === 'counterparty' ? 'counterparty' : 'owner');
  return f === 'mine' ? mine : !mine;
}

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
  return _rlRead;
}
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
  if (document.getElementById('view-redline') && window.renderRedline){ renderRedline(); return true; }
  if (window.renderNegotiationTab && window.getContract && window.state){
    renderNegotiationTab(getContract(state.activeId) || null, {});
    return true;
  }
  return false;
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
}

/* THE NOTICE IS OWED, NOT OPTIONAL. A document silently missing its strikes
   looks like a document with nothing on the table — the most expensive thing
   this page could get wrong — so a non-default reading always says so, and the
   way back is on the notice itself rather than only in the toolbar. */
function rlReadNoticeHtml(){
  const note = rlReadNote();
  if (!note) return '';
  return `<div class="rl-note-card" id="rl-read-note">
    <div class="rl-note-k"><span class="rl-note-dot"></span>${i18t('ng_read_note_k')}</div>
    <p class="rl-note-t">${_ne(note)}</p>
    <button type="button" data-rl-read="marks" class="rl-note-btn">${i18t('ng_read_back')}</button>
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
function rlSetFocus(on){
  _rlFocus = !!on;
  const page = document.getElementById('view-redline');
  if (page) page.classList.toggle('rl-focus', _rlFocus);
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
    if (_rlFocus && document.getElementById('view-redline')) rlSetFocus(false);
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
     taken straight out of the contract (Young, 10 Aug 2026). The tight class
     folds the repeated words down to glyphs and counts; measure again with it
     ON, because whether IT fits is the question being asked. */
  row.classList.add('rl-tabrow-tight');
  if (!dropped()) return;
  /* Genuinely too narrow even compressed — the honest second line, with the
     full words back on: a row of its own has room for them. */
  row.classList.remove('rl-tabrow-tight');
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
  /* TWO TYPE SCALES, EACH WITH ONE JOB. --rl-doc-type is the document canvas —
     set to read like the Doc page's contract sheet, so switching tabs never
     changes the size of the wording being judged. --rl-type is the sidebar's
     card scale: the cards are two-line pointers at the canvas, and pointers
     are set small. Each is declared once so neither can drift within itself. */
  .redline-page{--rl-type:11.5px;--rl-doc-type:15px}
  /* ---- THE HEADER IS A BAND, NOT A CARD ----
     It used to be drawn as a panel — surface fill, a 1px border, a radius and a
     card shadow — sitting inside a page that already has its own frame and
     18px of gutter. Two rounded edges a few pixels apart is the "double border"
     that reads as a box inside a box, and at the top of the page it is the
     first thing the eye lands on. The header carries a title, a round tag and
     the actions; none of that needs a container to be legible, so the container
     is gone and the row sits flat on the page beside the document below it.

     AND IT IS ONE ROW. The title used to sit above an explanatory sub-banner,
     with the actions wrapping onto a third band on ordinary laptop widths —
     three tiers of chrome before a word of the contract. The sub-banner is
     gone (the wall bar carries the one fact that matters), and the title
     ellipsizes rather than pushing the actions off the line, so the strip
     stays a strip at any width the three-column grid itself supports. */
  /* ONE quiet line. It wears .room-quiet's clothes (index.html) so this strip
     and the contract page's status line are visibly the same object. */
  /* ---- ONE HEIGHT, ALWAYS ----
     This row wrapped: the round sentence in it grew and shrank as the counts
     changed, taking the strip from one line to two and back, and every pane
     below it moved. The sentence is gone, and the row is now told never to
     wrap and given a floor, so it is the same height with a presence chip and
     without one, with two round verbs and with none. Nothing left in it can
     wrap — the chip is capped and ellipsised, the rest are single-line
     buttons — so nowrap costs no content. */
  /* ---- THE HEAD IS PART OF THE TAB ROW NOW ----
     It was a band of its own directly under the tabs, with the tab row's
     right-hand half standing empty above it. Both jobs share one line
     (Young, 10 Aug 2026), which gives the contract a whole band of height
     back. No margin and no minimum height: the tabs set the row's height and
     the controls sit centred in it. */
  .redline-page .rl-head{display:flex;flex-wrap:nowrap;align-items:center;gap:7px;
    flex:none;align-self:center;padding-bottom:2px}
  /* The gap that pushes them right. Its own element rather than margin-left on
     the head, so the row still reads left-to-right in the markup. */
  .redline-page .rl-tabrow-gap{flex:1;min-width:8px}
  /* ---- AND IT DROPS TO A LINE OF ITS OWN ONLY WHEN IT REALLY DOES NOT FIT ----
     This was a width rule — one number, 1700px, measured on one screen. It was
     wrong on every other one, in both directions: a contract with no "N needs
     you" and no reviewer button is 300px narrower than the one it was measured
     on and sat on two lines at 1690 for no reason, which is the fault as
     reported ("open that available space to the contract"). A single number
     cannot answer a row whose content changes with the round.

     SO THE ROW WRAPS ON CONTENT — plain flex-wrap, which is exactly the "only
     if it does not fit" rule — and the class merely RECORDS what the browser
     decided, because two things have to follow the wrap and neither is
     expressible in CSS. rlFitTabRow is the observer; it measures with the class
     off and puts it back, so it never reads its own effect.

     THE RULE UNDER THE TABS IS THE FIRST OF THE TWO. .room-tabrow carries the
     row's bottom border and the tabs pull their own underline down onto it — so
     on a wrapped row the border is under the CONTROLS and the active tab's
     underline is stranded in mid-air above them. The gap is already a
     full-width, zero-height element sitting exactly between the two lines,
     which makes it the honest place for that rule. */
  .redline-page .rl-tabrow{flex-wrap:wrap}
  /* ---- BUT BEFORE IT WRAPS, IT TIGHTENS ----
     Reported off two laptops side by side (Young, 10 Aug 2026): on a ThinkPad
     the controls dropped to a second line below the tabs, and that line comes
     straight out of the contract's height — "the space for the contract has to
     be maintained at all times". ThinkPad-class screens (1366–1536px of window)
     are the ordinary corporate laptop, not an edge case, so the second line
     cannot be the ordinary answer there.

     So rlFitTabRow tries a middle step first: .rl-tabrow-tight, where every
     control keeps its box and its press but the words that repeat what a
     tooltip already says stand down — the two purple buttons fold to their
     glyphs, Publish Round keeps the verb and drops the counts (the title
     carries the full sentence either way), and the pills give back a little
     padding. Only if the row STILL does not fit does the wrap happen, with the
     full words back — a row of its own has room for them. The words are spans
     precisely so this is a paint decision: textContent never changes, which is
     also why every test that reads the labels still can. */
  .redline-page .rl-glyph{display:none}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn .rl-word{display:none}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn .rl-glyph{display:inline}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn{padding:6px 9px}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-send-detail{display:none}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-head{gap:5px}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-seg{padding:0 7px}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-needs{padding:0 9px;gap:6px}
  .redline-page .rl-tabrow.rl-tabrow-wrap{border-bottom:0}
  .redline-page .rl-tabrow.rl-tabrow-wrap .rl-tabrow-gap{flex-basis:100%;min-width:0;height:0;
    border-bottom:1px solid var(--color-divider)}
  .redline-page .rl-tabrow.rl-tabrow-wrap .rl-head{flex-wrap:wrap;padding:9px 2px 2px;
    align-self:stretch;width:100%}
  /* The middle pane's head went with the head (see redlinePanesHtml). */
  .redline-page .rl-head-tools{display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:none}
  /* WRAPS: this strip carries tabs, round, stepper, focus, the contract jump
     and the playbook pass — on a laptop width they over-subscribe one row, and
     nowrap answered that by clipping the jump mid-word. A second line is the
     honest shape. (It carried the presence pill too, which was the widest item
     on it and the reason the wrap was written; the pill is gone and the wrap
     stays, because the remaining six still over-subscribe a 1366px row.) */
  .redline-page .rl-head-id{display:flex;align-items:center;gap:9px 8px;min-width:0;flex:1;flex-wrap:nowrap}
  /* ---- THE SHELL'S OWN STYLES HAVE GONE WITH THE SHELL ----
     This page used to draw its own title card — back arrow, name, status,
     Share/Import/Compare — and roughly forty lines of CSS dressed it. Both
     pages call roomHeadHtml now, so the markup went and the rules stayed:
     dead selectors matching nothing, which is how a stylesheet stops being
     readable. Removed. Nothing referenced them; the head is styled once, in
     index.html, where the contract page styles it too. */
  /* The room's tab row on this page. The tabs themselves are styled once, in
     index.html, because the contract page draws the same row — all this line
     does is give it the same 2px side padding the strip below it has, so the
     first tab and the first verb start on the same vertical. */
  .redline-page .rl-tabrow{margin:0 2px 2px;flex:none;align-items:stretch;gap:8px}
  .redline-page .rl-tabrow #rl-contract-jump{align-self:center;max-width:260px}
  /* The tab group is the only thing in this row that stretches; the round tag
     rides at its centre rather than being pulled to the row's full height. */
  .redline-page .rl-tabrow .rl-round{align-self:center}
  .redline-page .rl-round{flex:none;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;
    background:var(--st-amber-bg);color:var(--st-amber-fg);border:1px solid color-mix(in srgb,#f59e0b 25%,transparent)}
  /* ---- THE TEXT-SIZE STEPPER ----
     A⁻ / readout / A⁺ in a slate pill (the reference's bg-slate-100 p-1
     rounded-xl border-slate-200), the buttons w-6 h-6 white. It steps
     --rl-doc-type, the one token the whole canvas is set from, and the
     readout is the live value — mono, because it is a measurement. Defined
     here and reused verbatim by the Doc tab's toolbar (contract.js calls
     redlineLayoutCss() first), so the two strips render the same control. */
  .rl-type-step{display:flex;align-items:center;gap:4px;flex:none;
    background:#f1f5f9;border:1px solid #e2e8f0;padding:4px;border-radius:12px}
  .rl-type-step button{width:24px;height:24px;flex:none;display:inline-grid;place-items:center;
    background:#fff;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;
    font:inherit;font-size:11px;font-weight:700;color:#334155;line-height:1;
    transition:background .12s,border-color .12s}
  .rl-type-step button:hover{background:#f8fafc;border-color:#cbd5e1}
  .rl-type-step button:disabled{opacity:.4;cursor:not-allowed}
  .rl-type-step .rl-type-out{min-width:34px;text-align:center;font-family:var(--font-mono);
    font-size:11px;font-weight:600;color:#334155}
  html.dark .rl-type-step{background:rgba(148,163,184,.14);border-color:rgba(148,163,184,.28)}
  html.dark .rl-type-step button{background:rgba(15,23,42,.5);border-color:rgba(148,163,184,.32);color:#cbd5e1}
  html.dark .rl-type-step button:hover{background:rgba(15,23,42,.75)}
  html.dark .rl-type-step .rl-type-out{color:#cbd5e1}
  /* ---- ONE SHELL FOR EVERY CONTROL ON THIS ROW ----
     34px tall, 9px radius, on the hairline. Colour is reserved for the one
     primary act (Publish Round) and for small status dots, so the strip reads
     as one object rather than as five competing buttons. The pressed face of a
     segmented pair is RAISED — white on the tray with a shadow under it —
     rather than filled with the accent: two accent fills on one row would
     compete with the act. */
  .redline-page .rl-segwrap{display:flex;align-items:center;gap:3px;background:var(--color-neutral-100);
    border:1px solid var(--color-divider);padding:3px;border-radius:9px;height:34px;flex:none}
  /* 10px, not 12: five of these sit on the tab row and the four pixels each
     one gives back are what lets a 1600px laptop keep the controls up there
     instead of dropping them to a line of their own. */
  .redline-page .rl-seg{border:0;background:none;font:inherit;font-size:12px;font-weight:500;
    height:26px;padding:0 10px;border-radius:7px;cursor:pointer;color:var(--color-neutral-500);
    white-space:nowrap;transition:background .12s,color .12s}
  .redline-page .rl-seg.on{background:var(--color-surface);color:var(--color-text);font-weight:600;
    box-shadow:0 1px 2px rgba(15,23,42,.08)}
  html.dark .redline-page .rl-seg.on{background:var(--color-neutral-200);box-shadow:none}
  /* ---- WHAT IS WAITING ON YOU ----
     A quiet button with an amber dot: the dot is the news, the words are the
     count and the arrow says it goes somewhere. Deliberately NOT filled — it
     is a way into the work, not the act that ends the round. */
  .redline-page .rl-needs{display:flex;align-items:center;gap:8px;height:34px;flex:none;
    border:1px solid var(--color-divider);background:var(--color-surface);border-radius:9px;
    padding:0 13px;font:inherit;font-size:12px;font-weight:500;color:var(--color-neutral-700);
    cursor:pointer;white-space:nowrap}
  .redline-page .rl-needs:hover{border-color:var(--color-neutral-400);color:var(--color-text)}
  .redline-page .rl-needs-dot{width:7px;height:7px;border-radius:999px;background:var(--st-amber-dot);flex:none}
  .redline-page .rl-needs-go{color:var(--color-neutral-400)}
  /* ---- THE FLOATING NOTICES ----
     Bottom-right, over the page, never a band above the contract. See the note
     at the markup for why. Capped so a long sentence cannot become a panel,
     and pointer-events only on the cards themselves so the empty column below
     them does not swallow clicks on the document. */
  .redline-page .rl-notices{position:fixed;right:22px;bottom:22px;z-index:55;display:flex;
    flex-direction:column;gap:9px;width:344px;max-width:calc(100vw - 44px);pointer-events:none}
  .redline-page .rl-note-card{pointer-events:auto;border:1px solid var(--color-divider);
    background:var(--color-surface);border-radius:12px;padding:12px 14px;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .redline-page .rl-note-k{display:flex;align-items:center;gap:8px;font-size:10.5px;font-weight:700;
    letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500)}
  .redline-page .rl-note-dot{width:6px;height:6px;border-radius:999px;background:var(--color-neutral-400);flex:none}
  .redline-page .rl-note-t{margin:6px 0 0;font-size:12.5px;line-height:1.5;color:var(--color-neutral-600)}
  .redline-page .rl-note-btn{margin-top:10px;height:29px;border:1px solid var(--color-divider);
    border-radius:8px;background:var(--color-surface);padding:0 12px;font:inherit;font-size:12px;
    font-weight:600;color:var(--color-accent-700);cursor:pointer}
  .redline-page .rl-note-btn:hover{border-color:var(--color-accent-700)}
  /* ---- THE NOTICES THAT USED TO BE BANDS ----
     The review's banner and the desk's reading band are built elsewhere (
     js/review.js and js/desk.js) and carry their own colours, because those
     colours mean something — amber is waiting, ruby is a refusal, green came
     back cleared. What they do NOT carry any more is the shape of a band:
     inside this stack they are cards, so the bottom margin they used to need
     to clear the document comes off and the stack's own gap spaces them. */
  .redline-page .rl-notices .rv-banner,
  .redline-page .rl-notices .dk-notice{pointer-events:auto;margin:0;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  /* They were laid out as one wide row — tag, sentence, button, all on a line
     that had the width of the page. In a 344px card that line has to wrap, and
     the button belongs under the sentence rather than squeezed beside it. */
  .redline-page .rl-notices .dk-notice{flex-wrap:wrap}
  .redline-page .rl-notices .dk-notice .dk-notice-txt{flex:1 1 100%;min-width:0}
  .redline-page .rl-notices .rv-banner [data-rv-act]{white-space:nowrap}
  /* ---- THE BELL AND THE HIDE CHIP ----
     The alerts fold to one small button (see rlFloatingNoticesHtml). Amber,
     because that is this product's "something is waiting" colour, with a dot
     riding the rim so a glance says there is news behind it. The Hide chip is
     quiet — minimising is housekeeping, not an act. Both hug the corner
     (flex-end) rather than stretching to the stack's width. */
  .redline-page .rl-notices-fab{pointer-events:auto;align-self:flex-end;position:relative;
    width:42px;height:42px;border-radius:999px;border:1px solid var(--st-amber-line);
    background:var(--st-amber-bg);color:var(--st-amber-fg);cursor:pointer;font-size:17px;line-height:1;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .redline-page .rl-notices-fab:hover{filter:brightness(.97)}
  .redline-page .rl-fab-dot{position:absolute;top:1px;right:1px;width:10px;height:10px;
    border-radius:999px;background:var(--st-amber-dot);border:2px solid var(--color-surface)}
  .redline-page .rl-notices-min{pointer-events:auto;align-self:flex-end;border:1px solid var(--color-divider);
    background:var(--color-surface);border-radius:999px;padding:5px 11px;font:inherit;font-size:11px;
    font-weight:600;color:var(--color-neutral-600);cursor:pointer;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .redline-page .rl-notices-min:hover{color:var(--color-text);border-color:var(--color-neutral-400)}
  /* Focus mode is the document and nothing else, and a floating card over it
     is the "nothing else". */
  .redline-page.rl-focus .rl-notices{display:none}
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

  .redline-page .rl-root{flex:1;min-height:0;display:flex;flex-direction:column;gap:10px}
  /* The contract jump, dressed like the toolbar it sits in. It may shrink on
     a narrow window but never to nothing — a switch you cannot see is a
     contract you cannot reach. */
  /* 9ch wider than the pre-counterparty 220px, measured in the control's own
     11px mono figures — room for the name's first letters, nothing more.
     overflow:hidden so anything past the new edge disappears rather than
     stretching the toolbar.

     TYPED AS A SELECT, not left as a bare class. This block is a select's
     dress — a hard max-width, nowrap, clipped overflow, 11px mono — and while
     it named the class alone it reached anything on the page carrying that
     word. It reached a CLAUSE, and shrank the contract to 285px (see the
     rl-arrived note further down). The element selector costs nothing and
     means the next thing to be called rl-jump cannot be dressed as a dropdown
     by accident. */
  .redline-page select.rl-jump{flex:0 1 auto;min-width:96px;max-width:calc(220px + 9ch);overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap;border:1px solid var(--color-divider);
    background:var(--color-surface);border-radius:9px;padding:6px 8px;font:inherit;font-family:var(--font-mono);
    font-size:11px;font-weight:600;color:var(--color-text);cursor:pointer}
  .redline-page select.rl-jump:hover{border-color:var(--color-neutral-300)}
  /* THE OPEN LIST, DRESSED TOO. Browsers draw a select's popup themselves —
     the hard black edge — unless the select opts into base-select, which
     hands the picker to this stylesheet: soft grey border, rounded, the
     app's own hover and selection tints. Browsers without base-select
     ignore all of this and keep their native popup, which is the correct
     fallback: styling degrades, the control never does. */
  .redline-page select.rl-jump,
  .redline-page select.rl-jump::picker(select){appearance:base-select}
  .redline-page select.rl-jump::picker(select){border:1px solid var(--color-neutral-300);border-radius:10px;
    background:var(--color-surface);padding:4px;margin-top:4px;
    box-shadow:0 8px 24px rgba(15,23,42,.14)}
  html.dark .redline-page select.rl-jump::picker(select){border-color:rgba(148,163,184,.35);
    box-shadow:0 8px 24px rgba(0,0,0,.5)}
  .redline-page select.rl-jump option{font:inherit;font-family:var(--font-mono);font-size:11px;font-weight:600;
    color:var(--color-text);padding:6px 9px;border-radius:7px;cursor:pointer}
  .redline-page select.rl-jump option:hover,
  .redline-page select.rl-jump option:focus{background:var(--color-neutral-100)}
  .redline-page select.rl-jump option:checked{background:color-mix(in srgb,var(--accent-solid) 12%,transparent);
    color:var(--color-accent-600)}
  html.dark .redline-page select.rl-jump option:checked{color:var(--color-accent-400)}
  /* The playbook pass wears the Copilot's violet — an AI act, visibly not one
     of the engine's own verbs, and disabled it says it is thinking. */
  .redline-page .rl-pb-btn{flex:none;border:1px solid #ddd6fe;background:#f5f3ff;color:#6d28d9;
    border-radius:9px;padding:6px 11px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;
    transition:background .12s}
  .redline-page .rl-pb-btn:hover{background:#ede9fe}
  .redline-page .rl-pb-btn:disabled{opacity:.6;cursor:wait}
  html.dark .redline-page .rl-pb-btn{background:rgba(139,92,246,.15);border-color:rgba(139,92,246,.35);color:#c4b5fd}
  html.dark .redline-page .rl-pb-btn:hover{background:rgba(139,92,246,.25)}
  /* The presence pill's rules were here — .rl-presence and its green
     .rl-live-dot. Gone with the feature (10 Aug 2026); dead rules for a removed
     control are how one comes back by accident. */
  .redline-page .rl-actions{display:flex;align-items:center;gap:8px;flex:none;flex-wrap:nowrap}
  .redline-page .rl-btn{display:inline-flex;align-items:center;gap:6px}
  /* The wrap point is a fallback for genuinely narrow windows, not the
     ordinary laptop case — at 1400px this used to stack the actions into a
     second band, which is the vertical bloat the single strip removes. */
  @media (max-width:900px){ .redline-page .rl-head{flex-wrap:wrap} .redline-page .rl-actions{flex-wrap:wrap} }

  /* ---- FOCUS MODE ----
     .rl-focus on #view-redline hides the shell and the banner block — with
     display:none, never by removing them: the banner can hold the set-once
     counterparty email form, and it must survive the mode intact. The grid
     inherits the freed height through the flex column it already sits in; no
     measurements move.
     THE TOOLBAR STAYS, exactly as the Doc page's focus mode keeps its tab
     row: it holds the proxies (#nego-send is pressed through it), the type
     stepper, the contract jump — and the way OUT, which is the same button
     that came in, now pressed and wearing the dark face that says so. A
     control that hides itself cannot be pressed again. Esc still works
     beside it. */
  .redline-page{position:relative}
  .redline-page .rl-focus-btn{width:34px;height:34px;flex:none;display:inline-grid;place-items:center;
    background:#fff;border:1px solid #e2e8f0;border-radius:10px;cursor:pointer;color:#334155;
    transition:background .12s,border-color .12s}
  .redline-page .rl-focus-btn:hover{background:#f8fafc;border-color:#cbd5e1}
  html.dark .redline-page .rl-focus-btn{background:rgba(15,23,42,.5);border-color:rgba(148,163,184,.32);color:#cbd5e1}
  html.dark .redline-page .rl-focus-btn:hover{background:rgba(15,23,42,.75)}
  .redline-page .rl-focus-btn.on,
  html.dark .redline-page .rl-focus-btn.on{background:var(--color-accent-800);border-color:var(--color-accent-800);color:#fff}
  /* ---- FOCUS MODE, AND WHY IT STOPPED WORKING ----
     This named .rl-shell — the title card this page used to draw for itself.
     That card is gone: both this page and the contract page share one head now.
     So the rule matched nothing, hid a single banner, and the mode did almost
     nothing at all.

     Named properly, and taken further than before, because you asked for the
     WHOLE page: the shared head, the tab row, the round line and the app's own
     furniture — the sidebar and the top strip — all stand down, and the three
     panes take the window. body.rl-focused is set by rlSetFocus, because the
     sidebar and the strip live outside this page and cannot be reached from a
     selector rooted in it. */
  .redline-page.rl-focus .room-head,
  .redline-page.rl-focus .rl-tabrow,
  .redline-page.rl-focus .rl-head,
  .redline-page.rl-focus #rl-banner{display:none}
  .redline-page.rl-focus{padding:8px 10px 10px}
  body.rl-focused #side-nav,
  body.rl-focused #top-header{display:none!important}
  body.rl-focused #app-shell{grid-template-columns:minmax(0,1fr)!important;
    grid-template-rows:minmax(0,1fr)!important}
  /* The way out. The button that turned it on is inside the strip that has just
     stood down — a control that hides itself cannot be pressed again — so the
     chip is the exit, and Esc still works beside it. */
  .redline-page.rl-focus .rl-focus-exit{position:fixed;right:18px;bottom:18px;z-index:70;
    display:inline-flex;align-items:center;gap:7px;border:0;border-radius:9px;cursor:pointer;
    font:inherit;font-size:12px;font-weight:700;padding:9px 15px;
    background:var(--accent-solid,var(--color-accent));color:#fff;box-shadow:var(--shadow-md)}
  .redline-page:not(.rl-focus) .rl-focus-exit{display:none}

  /* the wall — one line, replacing the engine's two banners */
  .redline-page .rl-wall{display:flex;align-items:flex-start;gap:9px;flex:none;
    background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:10px;
    padding:7px 12px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-700)}
  .redline-page .rl-wall-ic{flex:none;color:var(--st-amber-fg)}
  .redline-page .rl-wall b{color:var(--color-text)}
  /* the design carries one banner. The turn strip stays in the DOM but out of
     sight: it holds #nego-send, which the header's Publish Round presses. */
  .redline-page .rl-turnwrap{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}

  /* ---- A CENTRED SHEET WITH GUTTERS, LIKE THE DOC PAGE ----
     The Doc page floats the contract as a 660px paper sheet on the page
     background, with air on both sides; this page used to draw the text
     edge-to-edge across the whole column instead, so the same agreement read
     as two different documents. The paper here now takes the Doc page's
     shape: a bounded measure, centred, white, with the sheet's own shadow —
     and the column behind it drops to the page background (see .rl-doc) so
     the gutters read as page, not as card. */
  /* ---- THE SHEET ----
     Warm ground, a warm hairline round it, a 14px radius and a long soft lift:
     paper on a desk rather than a fourth white card on a white page. The three
     values are tokens (index.html) because the Document tab, the counterparty's
     page and the phone paint the SAME sheet, and because the dark theme has to
     be able to answer differently — cream on a dark page is a stain. */
  .redline-page .rl-paper{padding:34px 40px 44px;max-width:720px;
    background:var(--color-doc-warm);border:1px solid var(--color-doc-warm-line);
    border-radius:14px;box-shadow:var(--shadow-paper);margin:0 auto}
  /* ---- THE HUNDRED-PIXEL GUTTER DOWN THE LEFT ----
     The engine reserves it — padding-left:100px on .nego-pane.working
     .nego-doc — because in the room the fingerprint badges hang there, outside
     the text column. This page does not put them there: the design carries the
     ask inline, in .rl-asktag on the clause's own top row. So the gutter was
     holding nothing, and it was holding it asymmetrically: measured, the text
     sat 116px from the left edge of the column and 46px from the right.

     Written at four classes deep because the engine's rule is three, and this
     stylesheet is inserted BEFORE #nego-style in the head — at equal
     specificity the engine would win on order. Restores the sheet's own 36px,
     matching the Doc page's paper padding. */
  .redline-page .nego-pane.working .rl-paper{padding-left:36px;padding-right:36px}
  @media (max-width:1023px){
    .redline-page .nego-pane.working .rl-paper{padding-left:20px;padding-right:20px}
  }
  /* ---- THE FRONT MATTER READS LIKE A DEED ----
     Centred, with a short rule under it rather than a full-width border: a
     line all the way across reads as a table header, a 46px rule reads as the
     flourish a printed agreement carries between its title and its first
     clause. */
  /* AT THE TOP LEVEL, not under .redline-page: the Document tab draws the same
     head from the same builder (docPaperHeadHtml) and has no .redline-page
     ancestor. contract.js loads this stylesheet, so one set of rules dresses
     the front of the sheet on both screens. */
  .rl-paper-head{text-align:center;padding-bottom:0;margin-bottom:22px}
  .rl-paper-head::after{content:"";display:block;width:46px;height:1px;
    background:var(--color-doc-rule);margin:22px auto 0}
  .rl-paper-title{margin:10px 0 0;font-family:var(--font-heading);
    font-size:20px;font-weight:600;letter-spacing:-.01em;color:var(--color-doc-text)}
  .rl-paper-sub{margin:8px 0 0;font-size:13px;color:var(--color-doc-muted)}
  /* The kicker above the title — the Doc page's own line, in its clothes:
     mono, uppercase, wide tracking. Rendered from the document, not invented. */
  .rl-paper-kick,.rl-paper-kick p{margin:0 0 6px;font-size:10px;font-weight:600;
    text-transform:uppercase;letter-spacing:.18em;
    line-height:1.5;color:var(--color-doc-muted)}
  /* The recital — the party/key-terms paragraph between the title and clause 1.
     The Doc page prints it, so this page does too, in the workbench's own type
     scale. Read-only: the terms in it are the Doc page's to edit. */
  /* ---- THE FOOT OF THE SHEET ----
     Two ruled lines and the parties under them. Defined at the top level, not
     under .redline-page, because the Document tab and the counterparty's page
     print the same foot from the same builder (rlPaperFootHtml) and contract.js
     calls redlineLayoutCss() before it draws. */
  .rl-paper-foot{display:flex;gap:40px;margin-top:52px;padding-top:22px;
    border-top:1px solid var(--color-doc-rule)}
  .rl-sigline{flex:1;min-width:0}
  .rl-sigrule{display:block;height:36px;border-bottom:1px solid var(--color-doc-rule)}
  .rl-sigfor{display:block;margin-top:8px;font-size:11.5px;color:var(--color-doc-muted);
    overflow-wrap:anywhere}
  @media (max-width:560px){ .rl-paper-foot{flex-direction:column;gap:22px} }
  .redline-page .rl-recital{margin:0 0 16px}
  .redline-page .rl-recital p{margin:0 0 8px;font-size:var(--rl-doc-type);line-height:1.75;
    color:var(--color-text)}
  /* ---- AND A SECOND INSET INSIDE THE FIRST ----
     .rl-clause is also .nego-clause, which carries padding:10px 12px for the
     room's hover wash. Stacked on the sheet's own padding that put every line
     of the contract another 12px in from an edge it was already clear of, and
     10px of air above and below every clause on top of the margin between
     them. The reference sets an unchanged clause flush to the sheet and pads
     only the CHANGED ones — p-3, the frame that says something is on the table
     — which is what these two rules restore. */
  .redline-page .rl-clause{margin:0 0 16px;padding:0}
  .redline-page .rl-clause-h{margin:0 0 5px;font-size:var(--rl-doc-type);font-weight:700;
    letter-spacing:.02em}
  /* ---- THE CANVAS READS LIKE THE DOC PAGE ----
     One declaration for the whole document canvas — clause bodies, marked
     lines, the recital — set from --rl-doc-type so the wording is the same
     size on both tabs (the seamlessness this scale exists for). The cards
     keep --rl-type: a two-line pointer is not the document, and setting the
     stack at contract size would halve how many changes fit on a screen.
     Declared on the page rather than in :root so neither can leak.

     The editor is named here for the same reason it is named beside .nego-body
     in the room's rules above: it IS the clause body while it is open, and a
     writer whose wording changes size the moment they start typing is being
     shown a different document from the one they are editing. */
  .redline-page .rl-clause-p,
  .redline-page .rl-doc .nego-body,
  .redline-page .rl-doc .nego-editing,
  .redline-page .rl-doc .rl-line{margin:0;font-size:var(--rl-doc-type);line-height:1.75;color:var(--color-text)}
  /* the sheet keeps its auto margins — margin:0 here beat the centring rule
     (three classes to two) and pinned the paper to the left of the column */
  .redline-page .rl-doc .nego-doc{margin:0 auto;font-size:var(--rl-doc-type);line-height:1.75;color:var(--color-text)}
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
     fades; the clause underneath it is untouched.

     ---- rl-arrived, AND NEVER rl-jump AGAIN ----
     This class used to be called rl-jump, which is ALSO the class on the
     contract picker in the toolbar (#rl-contract-jump). Its dress is a
     select's dress — max-width:calc(220px + 9ch), overflow:hidden,
     white-space:nowrap, 11px mono — and the rule was written as two classes,
     so it matched the CLAUSE just as happily as the select.

     What that did, reported from the field with a screenshot: press Edit on a
     Tracked Changes card and the clause you land on collapses to 285px inside
     a 626px sheet, its heading clipped mid-word with no wrap, its wording
     jammed into a column half the width of the contract around it. Measured
     on the real page, not inferred: max-width 285.307px against none on
     every other clause. It stuck, too — the class is only removed to restart
     the animation, so the clause stayed shrunk until the next repaint.

     It could not be found from the clause's own rules, because there is
     nothing wrong with them. Two unrelated parts of the page simply asked for
     the same word. Naming this one for what it means — the clause you have
     ARRIVED at — is what stops the next one. */
  .redline-page .rl-clause.rl-arrived{animation:rlJump 1.6s ease 1}
  @keyframes rlJump{
    0%{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent-solid) 55%,transparent)}
    70%{box-shadow:0 0 0 3px color-mix(in srgb,var(--accent-solid) 30%,transparent)}
    100%{box-shadow:0 0 0 3px transparent}
  }
  @media (prefers-reduced-motion:reduce){ .redline-page .rl-clause.rl-arrived{animation:none;
    box-shadow:0 0 0 2px color-mix(in srgb,var(--accent-solid) 45%,transparent)} }
  /* ---- WHO TOUCHED THIS WORDING ----
     Every marked span in the document carries a title naming the last hand on
     that edit. The cursor says the tooltip is there; without it a title is a
     thing you find by accident. */
  .redline-page .rl-doc ins[title],.redline-page .rl-doc del[title],
  .redline-page .rl-doc .nego-ins[title],.redline-page .rl-doc .nego-del[title]{cursor:help}
  /* ---- A CLAUSE THAT IS NOT IN THE AGREEMENT YET ----
     Washed green rather than amber, because it is a different KIND of ask: the
     amber frame says "this wording is under argument", and this says "this
     wording is not in the contract at all yet". A reader scrolling the document
     has to be able to tell the two apart without reading the tag. */
  .redline-page .rl-clause.rl-clause-new{background:color-mix(in srgb,#10b981 7%,transparent);
    border-color:color-mix(in srgb,#10b981 34%,transparent)}
  .redline-page .rl-clause-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  .redline-page .rl-asktag{flex:none;font-size:10.5px;font-weight:600;letter-spacing:.04em;
    padding:3px 9px;border-radius:999px;white-space:nowrap;
    background:var(--st-amber-bg);color:var(--st-amber-fg);border:1px solid var(--st-amber-line)}

  /* the design's change cards */
  /* No padding: the cards sit straight on the page like the sheet does, and
     a little room down the right so their shadows are not clipped by the
     scroller. */
  .redline-page .rl-cards{padding:0 2px 2px}
  .redline-page .rl-cards-empty{padding:6px 2px;font-size:11.5px;line-height:1.6;color:var(--color-neutral-500);
    display:flex;flex-direction:column;gap:6px}
  .redline-page .rl-cards-empty b{color:var(--color-text)}
  /* ---- AN INDEX CARD, WITH A SPINE THAT SAYS WHOSE IT IS ----
     The cards were a plain bordered box each, so a column of six read as six
     identical rectangles and whose ask a change was could only be learned by
     reading. The left edge carries that now — accent for ours, amber for
     theirs, green and grey once it is settled — which is the one fact the eye
     can take without stopping. The id is a chip rather than loose bold text,
     for the same reason a reference number on any other screen is. */
  /* ---- AND IT IS A CARD, NOT A RULED BOX ----
     12px radius and a lifted shadow, matching the queue and the paper beside
     it, so the three columns read as one set of objects (Young, 10 Aug 2026).
     The spine survives the reshape at 3px on the left — it is the fastest fact
     on the card and the radius does not soften it. */
  .redline-page .rl-card{border:1px solid #e8ecf1;border-radius:12px;padding:13px 15px;
    margin-bottom:11px;background:var(--color-surface);cursor:pointer;
    box-shadow:0 1px 2px rgba(38,55,74,.06),0 4px 14px rgba(38,55,74,.06);
    transition:box-shadow .2s ease,border-color .2s ease;
    border-left:3px solid var(--accent-solid,var(--color-accent))}
  html.dark .redline-page .rl-card{border-color:var(--color-divider);box-shadow:0 1px 2px rgba(0,0,0,.3)}
  .redline-page .rl-card[data-rl-origin="them"]{border-left-color:var(--st-amber-dot)}
  .redline-page .rl-card[data-contested]{border-left-color:var(--st-ruby-dot)}
  .redline-page .rl-card:focus-visible{outline:2px solid var(--color-accent)}
  .redline-page .rl-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:5px}
  .redline-page .rl-card-lead{display:inline-flex;align-items:center;gap:6px;min-width:0}
  .redline-page .rl-card-id{font-family:var(--font-mono);font-size:10.5px;font-weight:700;
    background:var(--color-neutral-100);color:var(--color-neutral-700);
    border-radius:5px;padding:2px 7px;white-space:nowrap}
  /* The round the ask belongs to, at the far right of the head — "R3" — so a
     card carried over from an earlier round says so without being opened. */
  .redline-page .rl-card-round{font-family:var(--font-mono);font-size:10px;font-weight:700;
    color:var(--color-neutral-500);flex:none;margin-left:6px}
  .redline-page .rl-badge{font-size:10.5px;font-weight:600;padding:3px 9px;border-radius:999px;white-space:nowrap;
    border:1px solid transparent}
  .redline-page .rl-badge-sent{background:var(--st-steel-bg);color:var(--st-steel-fg);border-color:var(--st-steel-line)}
  .redline-page .rl-badge-draft{background:var(--st-amber-bg);color:var(--st-amber-fg);border-color:var(--st-amber-line)}
  .redline-page .rl-badge-ok{background:var(--st-green-bg);color:var(--st-green-fg);border-color:var(--st-green-line)}
  .redline-page .rl-badge-no{background:var(--st-ruby-bg);color:var(--st-ruby-fg);border-color:var(--st-ruby-line)}
  /* ---- WHOSE ASK: THE ORIGIN PAIR ----
     Emerald for your side, indigo for theirs — the same families as the verbs
     each side's cards carry (your asks travel on green Sends; theirs arrive
     for a decision), and fixed hex for the same dark-mode reason the verbs
     are. The dark overrides keep the hue and drop the fill to a tint so the
     badge reads as a label, not a button. .rl-origin carries the .rl-badge
     metrics itself rather than the class — see the card markup for why. */
  /* ---- IT CARRIES A COMPANY NAME NOW, SO IT HAS TO BE ABLE TO RUN OUT ----
     The badge names the organisation that asked (see the note at the origin
     badge), and organisations are called things like "APEX LOGISTICS &
     WAREHOUSING KENYA LTD". Left at nowrap with no bound, one of those would
     push the status badge off the end of a 285px card. Bounded and elided
     instead: the first words identify the party, and the full name is in the
     title the badge already carried.

     BOUNDED BY THE ROW, not by a number. A fixed max-width was tried first and
     is worse than it looks: it elides a name that would have fitted, and it
     still cannot save a long one. flex:0 1 auto with min-width:0 lets the badge
     take its natural width whenever the head has room and give width back only
     when the id, the caret and the status badge need it — so the common name
     reads in full and only a genuinely long one is cut. min-width:0 is what
     makes that possible at all: a flex item will not shrink below its content
     without it, and the ellipsis would never appear. */
  .redline-page .rl-origin{font-size:10px;font-weight:600;padding:2px 8px;border-radius:999px;
    white-space:nowrap;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
  .redline-page .rl-origin-us{background:#d1fae5;color:#065f46;border:1px solid rgba(5,150,105,.35)}
  .redline-page .rl-origin-them{background:#e0e7ff;color:#3730a3;border:1px solid rgba(99,102,241,.4)}
  html.dark .redline-page .rl-origin-us{background:rgba(5,150,105,.18);color:#6ee7b7}
  html.dark .redline-page .rl-origin-them{background:rgba(99,102,241,.2);color:#c7d2fe}
  /* The on-behalf stamp reads as a CAUTION, not as decoration: it is the line
     that stops a card being taken as something the other side sent. */
  .redline-page .rl-card-behalf{margin-top:6px;border-left:2px solid var(--st-amber-dot);
    background:var(--st-amber-bg);border-radius:0 4px 4px 0;padding:5px 9px;
    font-size:10.5px;font-weight:600;line-height:1.5;color:var(--st-amber-fg);
    overflow-wrap:anywhere}
  .redline-page .rl-card-why{margin-top:6px;border-left:2px solid var(--color-accent);
    background:color-mix(in srgb,var(--color-accent) 6%,transparent);border-radius:0 4px 4px 0;
    padding:6px 9px;font-size:11.5px;line-height:1.55;color:var(--color-text);
    overflow-wrap:anywhere}
  .redline-page .rl-card-why-k{display:block;font-size:9px;font-weight:700;letter-spacing:.08em;
    text-transform:uppercase;color:var(--color-accent-800);margin-bottom:2px}
  /* A caption may shout; a name may not. This one is "Achieng Otieno said". */
  .redline-page .rl-said-k{text-transform:none;letter-spacing:.01em}
  .redline-page .rl-card-meta{font-size:10.5px;color:var(--color-neutral-500);line-height:1.5}
  /* ---- THE CARD NO LONGER CARRIES THE REDLINE ----
     It used to, clamped to two lines, which put the changed wording on screen
     twice: once in the document pane being read and again in a lesser copy
     beside it — cut mid-sentence, no surrounding clause, nothing to act on.
     The card is the HANDLE; the wording lives in the document, one click away
     (the click is already wired, see rlLinkFocus). .rl-card-diff is kept as a
     rule so an embed that still emits one is not left unstyled. */
  .redline-page .rl-card-diff{font-size:var(--rl-type);line-height:1.6;
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:7px}
  .redline-page .rl-card-verbs{margin-top:8px}
  /* ---- OPEN, OR A LINE ----
     A collapsed card is the head alone. The caret is the only thing saying
     there is more under it, so it is always drawn rather than revealed on
     hover — a control you have to discover by hovering is a control half the
     readers never find. It is a button in its own right because collapsing is
     its job alone: pressing the CARD means "take me to this change", and a
     reader navigating to a clause must not have the card fold up for it. */
  .redline-page .rl-caret{flex:none;border:0;background:none;padding:0 2px;margin:0;cursor:pointer;
    font-size:9px;line-height:1;color:var(--color-neutral-500);transition:transform .15s,color .15s;
    display:inline-block;transform:rotate(0deg)}
  .redline-page .rl-caret:hover{color:var(--color-text)}
  .redline-page .rl-caret-open{transform:rotate(180deg)}
  .redline-page .rl-caret:focus-visible{outline:2px solid var(--color-accent);border-radius:3px}
  /* Tighter, because a collapsed card is a row in a list rather than a panel. */
  /* ---- THE TWO REVIEW STATES, TOLD BY THE EDGE ----
     Amber: out with a colleague, still in flight. Ruby: they held it, and it is
     not going anywhere. Deliberately NOT the same colour — see the note on
     reviewChipHtml in js/review.js. The edge is drawn as an inset shadow rather
     than a border so it cannot shift the card's geometry when the state
     changes; a row that jumps two pixels on repaint is how a column of eight
     cards reads as unstable. */
  .redline-page .rl-card[data-rv-waiting]{box-shadow:inset 3px 0 0 var(--st-amber-dot)}
  .redline-page .rl-card[data-rv-held]{box-shadow:inset 3px 0 0 var(--st-ruby-dot)}
  .redline-page .rl-card-shut{padding:11px 14px}
  .redline-page .rl-card-shut .rl-card-top{margin-bottom:3px}
  /* ---- SHUT HIDES THE BODY ----
     display:none rather than height or opacity, so a hidden verb is out of the
     tab order and out of the accessibility tree as well as off the screen.

     THE PEEK IS GONE. A shut card used to open under the pointer and shut
     again a moment after it left, which meant the column moved while somebody
     was crossing it and a card could be open without anybody having asked for
     it. One press opens it now, and only a press closes it. */
  .redline-page .rl-card-shut .rl-card-body{display:none}
  /* The head is the press target, so it says so — and only the head. */
  .redline-page .rl-card-head{cursor:pointer}
  .redline-page .rl-card-body{cursor:default}
  /* .rl-card-note is gone with the amber provenance bar it painted — see the
     card renderer for why the label is no longer on the card. */
  /* Compact pills, right-aligned: each verb is only as wide as its word, so the
     card's information leads and the actions follow. flex:1 stretched them into
     a wall of colour that outweighed the change itself. */
  .redline-page .rl-card-verbs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;margin-top:9px}
  .redline-page .rl-card-verbs button{border:0;border-radius:8px;padding:6px 13px;font:inherit;
    font-size:10px;font-weight:700;line-height:1.6;cursor:pointer;transition:filter .15s}
  /* washes darken a touch on hover in light, lift in dark — a brightness
     bump on a near-white tint is invisible */
  .redline-page .rl-card-verbs button:hover{filter:brightness(.95)}
  html.dark .redline-page .rl-card-verbs button:hover{filter:brightness(1.2)}
  /* ---- THE VERBS ARE COLOUR-CODED, AND THE CODE IS FIXED ----
     Accept and Send are green, Reject and Retract are red, Edit is grey — as
     soft washes (tint background, tone text), the same clothing the status
     chips wear, because a row of solid emerald and red fills read as alarms
     on every card. Written as literal hex with explicit dark overrides rather
     than through the status tokens, because those tokens re-map in dark mode
     and a destructive verb that changes colour with the theme is a verb
     somebody presses by mistake. */
  /* ACCEPT IS THE ONE THAT LOOKS LIKE A BUTTON. Three tinted pills of equal
     weight made the reader choose between three equals, when accepting is what
     most cards are for and the other two are the exceptions. Filled accent for
     the yes; the no and the alternative recede to an outline. Fixed hex on the
     fill so it cannot re-map with the theme and be misread. */
  /* accent-700, not accent-600: white on the lighter shade
     measures 3.74:1, and these labels are 11px. The darker step is 5.5:1 and
     looks the same from a foot away. */
  .redline-page .rl-acc,.redline-page .rl-send{background:var(--color-accent-700);color:#fff;font-weight:700}
  .redline-page .rl-acc:hover,.redline-page .rl-send:hover{background:var(--color-accent-800)}
  .redline-page .rl-rej{background:none;border:1px solid var(--color-divider);color:#b91c1c}
  .redline-page .rl-rej:hover{border-color:#b91c1c}
  .redline-page .rl-edit{background:none;border:1px solid var(--color-divider);color:var(--color-neutral-700)}
  .redline-page .rl-edit:hover{border-color:var(--color-neutral-400);color:var(--color-text)}
  html.dark .redline-page .rl-rej{color:#fda4af}
  html.dark .redline-page .rl-edit{color:var(--color-neutral-700)}
  /* Amber, past tense, inert — the send after it has gone. Full opacity
     despite being disabled: this is a STATE the reader is meant to read, not a
     control being withheld, and the browser's default greying-out would make
     the one card that has moved the hardest one to see. */
  .redline-page .rl-sent{background:#fef3c7;color:#b45309;cursor:default}
  html.dark .redline-page .rl-sent{background:rgba(245,158,11,.16);color:#fcd34d}
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

  /* ---- THE COLUMN'S HEAD IS A CAPTION AND A COUNT ----
     It used to be a toolbar: a filter, two bulk verbs and a second send. All
     of those are gone, so what is left is the design's own two-part line —
     what this column is on the left, how much is in it on the right.

     DRESSED LIKE THE QUEUE'S HEAD, deliberately (reported: "on top of the
     card 'tracked changes' is not professionally designed", and then again
     for balance). The caption takes .rl-q-label's own type — 9.5px/800/.12em
     — and the head earns the hairline the queue's head carries, so the two
     columns flanking the contract read as one design rather than two attempts
     at it. The same classes render in Counterparty View and on the portal, so
     all three screens change together.

     AND THEN THE STRIP CAME OFF AGAIN (Young, 10 Aug 2026, "A · Rule — the
     quiet ledger"). It got there in three steps and all three are worth
     keeping straight, because two of them were tried and rejected.

     It began as a WHITE band lying across a grey pane — .nego-index-head
     paints var(--n-paper), the ROOM's token, which resolves white — with the
     caption jammed against one end and a heavy grey pill against the other:
     two grounds, no gutter, nobody's decision. That was the imbalance. It went
     transparent, and then an ACCENT BAND was asked for deliberately: a tinted
     box with a border, the caption and count inside it and the filter on a
     tray of its own below them.

     THE BAND IS NOW A RULE. Same two-part line, same reason for it, but the
     box is gone: a caption on the left, the count on the right, a hairline
     under both, and the filter as tabs hanging off that hairline. What the box
     was buying was separation from the cards, and a rule buys the same thing
     without putting a second bordered object in a column whose whole content
     is bordered objects — three nested frames (band, card, card body) is what
     made the head read as heavy at 300px.

     IT IS STILL AN OBJECT ABOVE THE CARDS, not the top edge of a box around
     them: the pane stays transparent and the rule stops at the head's own
     bottom. That is the rule stated at .rl-col — the change column is not a
     card — and it survives the restyle intact.

     THE COUNT IS QUIETER THAN THE CAPTION, and it was once the other way
     round: a 10.5px/600 pill outweighed the 9.5px label it was answering to.
     It is mono now rather than a chip. Mono is not decoration here — it is the
     one piece of the head that is a NUMBER, it changes under the reader as
     cards are filed and decided, and tabular figures stop "1 on the table"
     and "11 on the table" shifting the words beside them. It earns the accent
     only when there is actually something on the table. */
  .redline-page .nego-pane.index{background:transparent}
  .redline-page .rl-idx-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;
    background:none;border:0;border-bottom:1px solid var(--color-divider);
    border-radius:0;padding:0 2px 9px;margin:0 2px 10px}
  /* The tabs carry their own bottom padding down to the rule, so the head must
     not carry it too. :has() and not a class because the filter's absence is
     decided in the renderer (a reviewer's column has no filter — see the note
     at the control) and the head should not need telling twice. Where :has()
     does not resolve, the fallback is the padding above: tabs sitting 9px
     clear of the rule rather than on it, which is a worse line and not a
     broken one. */
  .redline-page .rl-idx-head:has(.rl-fsegwrap){padding-bottom:0}
  .redline-page .rl-idx-head [hidden]{display:none!important}
  .redline-page .rl-idx-k{flex:1;min-width:0;font-size:9.5px;font-weight:800;letter-spacing:.12em;
    text-transform:uppercase;color:var(--color-neutral-600)}
  .redline-page .rl-idx-n{flex:none;font-family:var(--font-mono);font-size:10px;font-weight:700;
    letter-spacing:.01em;font-variant-numeric:tabular-nums;color:var(--color-neutral-500);
    background:none;border:0;border-radius:0;padding:0;line-height:1.2}
  .redline-page .rl-idx-n.is-live{color:var(--color-accent-800)}
  /* ---- WHOSE ASKS: THE THREE-WAY CUT ----
     A segmented control, not a dropdown, so all three answers and the live one
     are readable without opening anything — the difference between a filter you
     can forget you set and one you cannot. It takes a full line of the strip
     (flex-basis:100%) because the column is narrow and a caption, a count and
     three chips do not share 300px.

     NO TRAY AT ALL, now that there is no band to sit it on. A tray is how you
     say "these three belong together" when they float on open ground; hung off
     the head's own rule they are already grouped by it, and a bordered tray
     inside a bordered head was one frame too many. The live cut is marked the
     way a tab is marked — a 2px accent underline overlapping the rule, so the
     hairline reads as the resting state of the control rather than as a
     separate line the control happens to sit near.

     THE TABS TAKE THEIR NATURAL WIDTH (flex:none, not flex:1). Stretched to
     thirds they read as three buttons; at their own width with a real gap they
     read as three labels, which is what a filter is. It still takes a full
     line of the strip — a caption, a count and three labels do not share
     300px. */
  .redline-page .rl-fsegwrap{flex-basis:100%;display:flex;gap:16px;padding:0;margin-top:3px;
    background:none;border:0;border-radius:0}
  .redline-page .rl-fseg{flex:none;min-width:0;display:flex;align-items:center;
    gap:5px;border:0;border-bottom:2px solid transparent;background:none;font:inherit;
    font-size:11px;font-weight:600;color:var(--color-neutral-500);padding:0 0 8px;
    margin-bottom:-1px;border-radius:0;cursor:pointer;white-space:nowrap;
    transition:color .12s,border-color .12s}
  .redline-page .rl-fseg:hover{color:var(--color-text)}
  .redline-page .rl-fseg.on{background:none;color:var(--color-text);font-weight:700;
    border-bottom-color:var(--accent-solid)}
  /* A borderless button gets no focus ring from the browser worth having, and
     the underline it would otherwise be confused with is the PRESSED state,
     not the focused one. */
  .redline-page .rl-fseg:focus-visible{outline:2px solid var(--color-accent);
    outline-offset:2px;border-radius:3px}
  /* The count rides INSIDE its own tab: it is the thing that stops a filter
     hiding a change quietly, so it must be readable on the resting face too. */
  .redline-page .rl-fseg-n{flex:none;font-family:var(--font-mono);font-size:9.5px;font-weight:700;
    opacity:.62}
  .redline-page .rl-fseg.on .rl-fseg-n{opacity:1;color:var(--color-accent-800)}
  /* MOUNTED, UNSEEN, AND STILL CLICKABLE. Not display:none — a hidden control
     is one the browser may refuse to focus or dispatch to, and Publish Round
     works by clicking this one. Taken out of the flow and out of the reader's
     way instead, the way a skip link is. */
  .redline-page .rl-sendslot-hidden{position:absolute;width:1px;height:1px;margin:-1px;padding:0;
    overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}
  /* The reveal chip and the collapse chevron went with the fold they drove —
     the sidebar tabs are the one switch now, so their rules go too. */
  /* ---- THE ORIGIN FILTER ----
     A select at the head of the Tracked Changes panel. It wears the accent
     when it is actually narrowing the column: a filter that looks idle while
     hiding cards is how a change gets "lost". */
  /* The reviewer's folded-document notice. Reads as a note about the page, not
     as a warning: nothing is wrong, it is simply showing less on purpose. */
  .rl-rv-docnote{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 14px;
    padding:8px 12px;border-radius:8px;font-size:11.5px;line-height:1.5;
    border:1px dashed var(--color-divider);background:var(--color-bg);color:var(--color-neutral-700)}
  .rl-rv-docnote span{flex:1;min-width:0}
  .rl-rv-docnote button{flex:none;font:inherit;font-size:11px;font-weight:700;cursor:pointer;
    border-radius:6px;padding:3px 10px;border:1px solid var(--color-divider);
    background:var(--color-surface);color:var(--color-accent-800)}
  .rl-rv-docnote button:hover{border-color:var(--color-accent-800)}
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

  /* ---- THE NOTES, INSIDE THE CARD THEY ARE ABOUT ----
     What the Discussion column's thread rules used to dress. The column is
     gone (see redlinePanesHtml); the conversation reads on the change. It is
     the last block in an open card, under a dashed rule, so a card being
     skimmed reads as wording-then-verbs and a card being worked on carries the
     argument as well. */
  .redline-page .rl-cnotes{margin-top:12px;border-top:1px dashed var(--color-divider);padding-top:10px}
  .redline-page .rl-cnotes-k{font-size:9.5px;font-weight:700;letter-spacing:.08em;
    text-transform:uppercase;color:var(--color-neutral-400)}
  /* Long sentences wrap inside the card, and so does a long unbroken run — a
     URL or a word typed without spaces would otherwise set the card's width
     and push the column wider than its pane. min-width:0 on the author cell
     for the same reason: a flex child will not shrink below its content
     without it, so the timestamp was the first thing to go. */
  .redline-page .rl-cnote{margin-top:8px;min-width:0;padding:8px 10px;border-radius:9px;
    background:var(--color-bg);border:1px solid var(--color-divider)}
  /* A message that went to the other side wears the steel wash, so the two
     kinds are tellable apart at a glance in a thread that mixes them. */
  .redline-page .rl-cnote.is-shared{background:var(--st-steel-bg);border-color:var(--st-steel-line)}
  /* ---- A LONG NOTE FOLDS TO THREE LINES ----
     The card's height belongs to the change, not to the longest paragraph
     anybody pasted under it. The toggle under a clamped note is the only way
     it opens, and it is a class flip, never a repaint. */
  .redline-page .rl-cnote p.rl-cnote-clamp{display:-webkit-box;-webkit-line-clamp:3;
    -webkit-box-orient:vertical;overflow:hidden}
  .redline-page .rl-cnote-more{display:block;margin-top:4px;border:0;background:none;padding:0;
    font:inherit;font-size:10.5px;font-weight:700;color:var(--color-accent-700);cursor:pointer}
  .redline-page .rl-cnote-more:hover{text-decoration:underline}
  /* ---- THE BUTTON AND THE PROMISE FOLLOW THE SWITCH ----
     Each carries both faces; the pressed side of the visibility switch decides
     which one shows. Both stay in textContent, which is what the tests read. */
  .redline-page .rl-cnotes .rl-when-sh{display:none}
  .redline-page .rl-cnotes:has(.v-sh[aria-pressed="true"]) .rl-when-sh{display:inline}
  .redline-page .rl-cnotes:has(.v-sh[aria-pressed="true"]) .rl-when-int{display:none}
  .redline-page .rl-cnote-top{display:flex;align-items:baseline;gap:7px;
    font-size:10.5px;margin-bottom:2px;color:var(--color-neutral-400)}
  .redline-page .rl-cnote-top b{min-width:0;overflow-wrap:anywhere;font-weight:600;color:var(--color-neutral-600)}
  .redline-page .rl-cnote-int{margin-left:auto;flex:none;border:1px solid var(--color-divider);
    border-radius:999px;padding:1px 7px;font-size:9.5px;font-weight:600;color:var(--color-neutral-500)}
  .redline-page .rl-cnote p{margin:0;font-size:11.5px;line-height:1.55;color:var(--color-neutral-700);
    white-space:pre-wrap;overflow-wrap:anywhere}
  .redline-page textarea.rl-cnote-in{width:100%;margin-top:9px;border:1px solid var(--color-divider);
    border-radius:9px;padding:8px 10px;font:inherit;font-size:11.5px;line-height:1.5;
    color:inherit;background:var(--color-surface);outline:none;box-sizing:border-box}
  .redline-page textarea.rl-cnote-in:focus{border-color:var(--color-accent-500)}
  .redline-page .rl-cnote-foot{display:flex;align-items:center;gap:9px;margin-top:7px}
  .redline-page .rl-cnote-add{flex:none;border:1px solid var(--color-divider);border-radius:8px;
    background:var(--color-surface);padding:5px 12px;font:inherit;font-size:11.5px;font-weight:500;
    color:var(--color-neutral-700);cursor:pointer}
  .redline-page .rl-cnote-add:hover{border-color:var(--color-neutral-400);color:var(--color-text)}
  /* The promise under the button. It is the whole of what this composer is,
     so it is drawn beside it rather than in a tooltip. */
  .redline-page .rl-cnote-hint{font-size:10.5px;color:var(--color-neutral-400);min-width:0}
  /* The shared composer look, repeated inside this page's own stylesheet
     because the workbench also mounts as an EMBED on the counterparty portal,
     which does not carry the shell's head. Same declarations as index.html. */
  .redline-page textarea.chat-field{resize:none;overflow-y:auto;max-height:7.5em;line-height:1.5;
    white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;box-sizing:border-box}
  .redline-page .nego-visswitch{display:flex;gap:4px;margin-bottom:6px}
  .redline-page .nego-visswitch button{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:7px;padding:3px 8px;font:inherit;font-size:10px;font-weight:600;cursor:pointer;
    color:var(--color-neutral-600)}
  .redline-page .nego-visswitch button[aria-pressed="true"]{background:var(--accent-solid);color:#fff;
    border-color:var(--accent-solid)}
  /* ---- TWO PANES AND A HANDLE ----
     The twelve-column deal is gone: the document takes the left pane (two
     thirds by default, the Doc tab's own split) and everything else lives in
     ONE right-hand card. The columns are set in pixels by rlLayoutResizer —
     the same fraction-persisted drag the Doc tab uses — and this rule is the
     resting state before the first measure and the fallback where measuring
     is impossible.

     minmax(0,·) on both tracks, not fr alone: a grid column holding a
     contract will not otherwise shrink below its longest unbroken line, and
     the sidebar gets pushed off the row instead of the text wrapping. */
  .redline-page .rl-grid{flex:1;min-height:0;position:relative;display:grid;gap:14px;
    grid-template-columns:minmax(0,2fr) minmax(0,1fr);align-items:stretch}
  /* ---- THREE COLUMNS WHEN THE QUEUE IS THERE ----
     The starting widths only. rlLayoutResizer writes the real ones inline the
     moment the page has a layout, and it reads the queue's width back off this
     rule — so the breakpoint below is the single copy of the number. */
  .redline-page .rl-grid.has-queue{--rl-queue-w:300px;
    grid-template-columns:var(--rl-queue-w) minmax(0,2fr) minmax(0,1fr)}
  /* A laptop cannot afford 300px of queue AND a readable contract, and the
     contract is what is being judged. The queue gives up the width first. */
  @media (max-width:1439px){
    .redline-page .rl-grid.has-queue{--rl-queue-w:248px}
  }

  /* ---- THE QUEUE ----
     A reading order, so it is set quiet: no card chrome inside the card, no
     verbs, no counts competing with the change stack's own. The only loud
     thing on it is the row you are meant to answer next. */
  .redline-page .rl-queue{min-width:0}
  /* ---- THE SIDE MARGINS ARE HALVED, AND THE LABEL IS THE STATUS WORD'S SIZE
     The clause name is what this column is for and it was the only thing on a
     row being squeezed: 12px of card padding plus 10px of row padding put 22px
     between the tick and the card's edge, twice over, on a 300px column. Both
     are halved (6 + 5 = 11px), the tick-to-name gap with them, and the name
     drops from 12.5px to the 10.5px the status word already uses — so the two
     read as one line rather than a heading and a footnote. All of it goes to
     the name. */
  .redline-page .rl-q-scroll{flex:1;min-height:0;overflow-y:auto;
    padding:8px 6px 16px;display:flex;flex-direction:column}
  /* The head does not scroll. The score used to sit at the foot of the
     scroller, which meant that on a busy negotiation — the only kind where it
     matters — it scrolled away behind the rows it was counting. */
  .redline-page .rl-q-head{position:relative;flex:none;padding:14px 10px 10px;
    border-bottom:1px solid var(--color-divider)}
  .redline-page .rl-q-label{margin:0 26px 8px 0;font-size:9.5px;font-weight:800;
    letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-500)}
  /* ---- THE FOLD ----
     The chevron sits in the head's own corner rather than on a toolbar of its
     own: one control, and it is where the thing it folds begins. It stays put
     when the column folds — at 34px the head IS the rail, so the button has to
     be reachable from both states without moving. */
  .redline-page .rl-q-min{position:absolute;top:9px;right:6px;width:22px;height:22px;
    display:grid;place-items:center;padding:0;border:0;border-radius:5px;background:none;
    color:var(--color-neutral-500);cursor:pointer;transition:background .12s,color .12s}
  .redline-page .rl-q-min:hover{background:var(--color-neutral-100);color:var(--color-text)}
  /* The rail's read-out: the same two numbers, stacked, because 34px has no
     room for a line of text. Hidden while the column is open — the open column
     already says it in words. */
  .redline-page .rl-q-mini{display:none}
  .redline-page .rl-queue.is-min .rl-q-scroll,
  .redline-page .rl-queue.is-min .rl-q-label,
  .redline-page .rl-queue.is-min .rl-q-foot,
  .redline-page .rl-queue.is-min .rl-q-bar{display:none}
  .redline-page .rl-queue.is-min .rl-q-head{padding:8px 4px 10px;border-bottom:0}
  .redline-page .rl-queue.is-min .rl-q-min{position:static;margin:0 auto 8px}
  .redline-page .rl-queue.is-min .rl-q-mini{display:flex;flex-direction:column;align-items:center;
    gap:1px;font-family:var(--font-mono);font-size:10px;line-height:1.15;color:var(--color-neutral-600)}
  .redline-page .rl-queue.is-min .rl-q-mini b{font-size:12px;color:var(--color-text)}
  .redline-page .rl-queue.is-min .rl-q-mini i{font-style:normal;opacity:.5}
  /* The column itself. 34px is the chevron plus its breathing room — anything
     narrower and the control it has to keep is bigger than the rail. */
  .redline-page .rl-grid.has-queue.q-min{--rl-queue-w:34px}
  .redline-page .rl-q-bar{height:5px;border-radius:999px;background:var(--color-neutral-200);overflow:hidden}
  .redline-page .rl-q-bar span{display:block;height:100%;border-radius:999px;
    background:var(--accent-solid,var(--color-accent));transition:width .3s ease}
  .redline-page .rl-q-row{display:flex;align-items:center;gap:4.5px;width:100%;text-align:left;
    font:inherit;font-size:12.5px;color:var(--color-text);cursor:pointer;background:none;
    border:1px solid transparent;border-radius:9px;padding:8px 5px;margin-bottom:2px}
  .redline-page .rl-q-row:hover{background:var(--color-neutral-100)}
  .redline-page .rl-q-k{flex:1;min-width:0;font-size:10.5px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .redline-page .rl-q-st{flex:none;font-size:10.5px;font-weight:600}
  /* The count chip appears only where a row stands for more than one change,
     so its absence is itself information: this row is one ask. */
  .redline-page .rl-q-n{flex:none;font-family:var(--font-mono);font-size:9.5px;font-weight:700;
    background:var(--color-neutral-100);color:var(--color-neutral-600);
    border:1px solid var(--color-divider);border-radius:999px;padding:0 6px}
  /* The mark column is a fixed width on every row, answered or not, so the
     clause names line up down the list instead of stepping in and out. */
  .redline-page .rl-q-mark{flex:none;width:14px;text-align:center;font-weight:800;line-height:1}
  .redline-page .rl-q-row.is-done{color:var(--st-green-fg)}
  .redline-page .rl-q-row.is-done .rl-q-st{color:var(--st-green-fg)}
  .redline-page .rl-q-row.is-waiting{color:var(--color-neutral-400)}
  .redline-page .rl-q-row.is-waiting .rl-q-mark::before{content:"";display:block;
    width:8px;height:8px;margin:0 auto;border-radius:50%;background:var(--color-neutral-200);
    border:1px solid var(--color-neutral-400);opacity:.8}
  .redline-page .rl-q-row.is-held{color:var(--st-amber-fg)}
  .redline-page .rl-q-row.is-held .rl-q-st{font-size:10px;letter-spacing:.04em;text-transform:uppercase}
  .redline-page .rl-q-row.is-held .rl-q-mark::before{content:"";display:block;
    width:8px;height:8px;margin:0 auto;border-radius:50%;background:var(--st-amber-dot);opacity:.6}
  /* TWO MARKS, TWO FACTS. The ring says WHERE YOU ARE and moves when you press
     a row; the amber dot and the word say WHAT IS NEXT and move only when a
     change is answered. Collapsing them into one mark is what made the
     highlight refuse to follow a press. */
  .redline-page .rl-q-row.is-sel{font-weight:700;border-color:#33475c;
    background:color-mix(in srgb,#456a8f 9%,transparent)}
  html.dark .redline-page .rl-q-row.is-sel{border-color:#7fa3c8}
  .redline-page .rl-q-row.is-now .rl-q-st{color:var(--st-amber-fg);font-weight:700}
  .redline-page .rl-q-row.is-now .rl-q-mark::before{content:"";display:block;
    width:9px;height:9px;margin:0 auto;border-radius:50%;background:var(--st-amber-dot);
    box-shadow:0 0 0 3px color-mix(in srgb,var(--st-amber-dot) 22%,transparent)}
  .redline-page .rl-q-split{border:0;border-top:1px dashed var(--color-divider);margin:14px 4px 12px}
  .redline-page .rl-q-why{margin:0 4px;font-size:11px;line-height:1.5;color:var(--st-amber-fg)}
  .redline-page .rl-q-empty{margin:4px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-500)}
  /* The count reads under the bar it belongs to, in the head. */
  .redline-page .rl-q-foot{margin:6px 0 0;font-size:11px;color:var(--color-neutral-500)}
  .redline-page .rl-q-foot b{color:var(--color-text)}
  /* ---- THE SIDEBAR IS ONE COLUMN NOW ----
     It used to be one card with two faces — Tracked Changes or Discussion,
     switched by a pair of tabs, with data-rl-side-mode on the workbench root
     deciding which showed. The Discussion face is gone (see redlinePanesHtml)
     and the tabs, the tray they sat in and the exclusivity pair have gone with
     it. rlSideMode still answers, permanently, "changes", so an old root
     carrying the other value cannot hide this column. */
  .redline-page .rl-side{min-width:0}
  .redline-page #rl-changes-col{flex:1;min-height:0;display:flex;flex-direction:column}

  /* ---- A SHORT WINDOW SPENDS ITS HEIGHT ON THE WORK ----
     Placed AFTER the rules it argues with: these are the same two classes
     deep, so at equal specificity the later block wins and an earlier one is
     simply ignored — which is what happened the first time this was written.

     Measured on a 1080p laptop at 150% scaling (a 590px page): the change list
     was given 83px of height for a 110px card, so the reader saw a sliver of
     one decision. The shell, the tab strip and the heading are furniture; the
     list and the contract are the page. On a short window the furniture gives
     way. Nothing is hidden. */
  @media (max-height:820px){
    .redline-page .rl-idx-head{padding:0 2px 8px;gap:6px}
    .redline-page .rl-paper{padding:26px 30px 30px}
  }
  @media (max-height:680px){
    .redline-page .rl-idx-head{padding:0 2px 6px;gap:5px}
    .redline-page .rl-paper{padding:20px 26px 24px}
  }
  /* ---- THE HANDLE ----
     Absolutely positioned over the gap (rlLayoutResizer keeps its left edge
     on the split), the Doc tab's own grip. Hidden where the panes stack. */
  .redline-page .rl-resizer{position:absolute;top:0;bottom:0;left:66%;width:14px;z-index:6;
    cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none}
  .redline-page .rl-resizer span{width:4px;height:72px;border-radius:999px;
    background:var(--color-neutral-300);transition:background .15s}
  /* At a limit: the grip goes amber so "it stopped" reads as a boundary rather
     than a broken control. */
  .redline-page .rl-resizer[data-rl-at-limit] span{background:var(--st-amber-dot)}
  .redline-page .rl-resizer:hover span,.redline-page .rl-resizer[data-drag] span{
    background:var(--color-accent)}

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
  /* ---- THE FURNITURE IS NOT THE CONTRACT ----
     The toolbar sits INSIDE the clause's box at opacity:0, and an invisible
     control is still selectable text: a drag that began above the first word
     and ended below the last swept "Add Note/Tag ✎ Direct Edit 🗑 Propose
     deletion" into the highlight, and the passage then matched nothing in the
     clause. The ask tag reads the same way — "#3 · Your ask · ✓ adopted" is the
     workbench talking about the clause, not wording anybody negotiated. Both
     are cut from the reading as well (see _NEGO_SEL_CHROME); this stops them
     joining the highlight in the first place, so what is highlighted on screen
     is what the Copilot is asked about. */
  .redline-page .rl-tools,.redline-page .rl-asktag,.redline-page .nego-badge{
    -webkit-user-select:none;user-select:none}
  .redline-page .rl-tools{position:absolute;right:6px;bottom:-9px;z-index:3;margin:0;
    display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:6px;
    opacity:0;pointer-events:none;transition:opacity .15s ease}
  .redline-page .rl-clause:hover .rl-tools,
  .redline-page .rl-clause:focus-within .rl-tools{opacity:1;pointer-events:auto}
  /* ---- BUT NOT WHILE THE CLAUSE IS BEING TYPED IN ----
     :focus-within is what reveals the row, and a caret inside the editor IS
     focus within the clause — so the moment Direct Edit opened, the three
     hover verbs latched on and stayed on. They are absolutely positioned at
     bottom:-9px, which is exactly where the editor's own Save change / Cancel
     bar sits, so "Add Note/Tag ✎ Direct Edit 🗑 Propose deletion" was painted
     on top of the two buttons the writer actually needed, at z-index 3.

     Hidden rather than moved. A clause under edit already carries its verbs —
     Save and Cancel — and offering "Direct Edit" beside them names a door the
     reader is standing in. is-editing is set by wireNegotiationTab when the
     editor opens and disappears with the repaint that closes it, so there is
     no state here that can outlive the editor. */
  .redline-page .rl-clause.is-editing .rl-tools{opacity:0;pointer-events:none}
  /* On a touch screen there is no hover, so hidden tools would be unreachable
     tools — the objection test/f44 records against hover-only controls.
     There, and only there, they return to the flow and stay visible: the
     trade against a busier page is forced, the trade against unusable tools
     is not. */
  @media (hover:none){
    .redline-page .rl-tools{position:static;opacity:1;pointer-events:auto;margin-top:7px}
    /* …and there they are in the flow, above the editor rather than over it,
       so the same rule holds: an open editor shows Save and Cancel, not a
       second Direct Edit under them. */
    .redline-page .rl-clause.is-editing .rl-tools{display:none}
  }
  .redline-page .rl-tool{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:999px;padding:3px 10px;font:inherit;font-size:10.5px;font-weight:600;line-height:1.6;
    color:var(--color-neutral-600);cursor:pointer;white-space:nowrap;
    box-shadow:0 1px 2px rgba(15,23,42,.08);
    transition:border-color .15s,color .15s,background .15s}
  .redline-page .rl-tool:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  /* ---- THE THREE VERBS, EACH IN ITS OWN COLOUR ----
     Indigo to talk, emerald to write, rose to strike — the same families the
     rest of the workbench speaks (discussion is indigo, your redlines travel
     on emerald, deletions read red). Fixed hex, dark tints, for the reason
     every colour on this page is: a verb that re-maps with the theme is a
     verb pressed by mistake. Written as .rl-tool.rl-tool-* so the pair
     outranks the base pill at every state. */
  .redline-page .rl-tool.rl-tool-note{background:#eef2ff;border-color:#c7d2fe;color:#4338ca}
  .redline-page .rl-tool.rl-tool-note:hover{background:#e0e7ff;border-color:#6366f1;color:#3730a3}
  .redline-page .rl-tool.rl-tool-edit{background:#ecfdf5;border-color:#6ee7b7;color:#065f46}
  .redline-page .rl-tool.rl-tool-edit:hover{background:#d1fae5;border-color:#059669}
  /* Violet for the Copilot, which is the colour it already wears everywhere
     else on this page — the "Review vs Playbook" button above the document and
     the Copilot column's own chrome. A reader should not have to learn a second
     signal for the same assistant. */
  .redline-page .rl-tool.rl-tool-ai{background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6}
  .redline-page .rl-tool.rl-tool-ai:hover{background:#ede9fe;border-color:#7c3aed}
  html.dark .redline-page .rl-tool.rl-tool-note{background:rgba(99,102,241,.16);border-color:rgba(99,102,241,.45);color:#c7d2fe}
  html.dark .redline-page .rl-tool.rl-tool-edit{background:rgba(5,150,105,.16);border-color:rgba(5,150,105,.45);color:#6ee7b7}
  html.dark .redline-page .rl-tool.rl-tool-ai{background:rgba(124,58,237,.18);border-color:rgba(124,58,237,.45);color:#ddd6fe}
  .redline-page .rl-btn-ghost{background:var(--color-neutral-100);color:var(--color-neutral-600)}
  .redline-page .rl-btn-ghost[aria-pressed="true"]{background:var(--accent-solid);color:#fff;
    border-color:var(--accent-solid)}

  /* Below lg the two panes stack to one column and the page scrolls, so the
     inner panes give their scroll back to the page rather than trapping the
     gesture. A drag handle over stacked panes resizes nothing — hidden. */
  @media (max-width:1023px){
    .redline-page .rl-grid{grid-template-columns:minmax(0,1fr)!important;height:auto}
    .redline-page .rl-doc,.redline-page .rl-side{grid-column:auto;min-height:280px}
    /* The queue stacks with the panes rather than being dropped: it is the
       reading order, and it is the pane that matters MOST on a small screen,
       so it keeps its place at the top of the stack. It does not need 280px of
       it — a queue is as tall as its rows. */
    .redline-page .rl-queue{grid-column:auto;min-height:0;max-height:46vh}
    .redline-page .rl-resizer{display:none}
  }
  /* ---- THIS PAGE HAS NO DRAWER BUTTON, SO IT MUST NOT HAVE A DRAWER ----
     The engine's own narrow rule turns .nego-pane.index into an off-canvas
     drawer below 760 and reveals #nego-drawer to open it again. That button is
     markup belonging to the negotiation ROOM; this page never renders it. The
     rule reached here anyway, so on a phone the tracked-changes column was
     translated off the right of the screen with nothing anywhere to bring it
     back — the decisions were simply unreachable. Written at three classes so
     it outranks the engine's two on specificity rather than on sheet order,
     which is not in this file's favour (see the note above .rl-paper). The
     column stacks under the document instead, which is what the rule directly
     above already arranges for it. */
  @media (max-width:760px){
    .redline-page .nego-pane.index{position:static;width:auto;transform:none;
      box-shadow:none;z-index:auto}
    .redline-page #nego-drawer{display:none!important}
  }
  /* ---- ONE CARD, NOT THREE ----
     The queue is a card, because it is a list of rows and rows need a surface.
     The document column and the change column are NOT: the sheet is its own
     object with its own lift, and each change card is its own object too, so
     wrapping either in a second bordered box is the box-inside-a-box the
     header gave up years ago. Both sit straight on the page (Young, 10 Aug
     2026) — which is also what finally lets the warm paper read as paper,
     since a cream sheet on a white card is just a slightly grubby card. */
  .redline-page .rl-col{background:var(--color-surface);border:1px solid var(--color-divider);
    border-radius:14px;box-shadow:0 1px 2px rgba(15,23,42,.05);min-height:0;overflow:hidden;
    display:flex;flex-direction:column}
  .redline-page .rl-side{background:none;border:0;box-shadow:none;border-radius:0;overflow:visible}
  .redline-page .rl-doc{background:none;border:0;border-radius:14px;box-shadow:none;min-height:0;
    overflow:hidden;display:flex;flex-direction:column}
  html.dark .redline-page .rl-paper{box-shadow:0 10px 30px rgba(0,0,0,.45)}
  .redline-page .rl-doc .nego-scroll{flex:1;min-height:0;overflow-y:auto;padding:4px 2px 28px}
  /* The quiet end of the toolbar: separated by a hairline so the row reads as
     "what this does" then "how it is set", rather than as one undifferentiated
     line of nine controls. */
  .redline-page .rl-setwrap{display:inline-flex;align-items:center;gap:8px;flex:none;
    padding-left:10px;margin-left:2px;border-left:1px solid var(--color-divider)}
  @media (max-width:900px){
    .redline-page .rl-setwrap{border-left:0;padding-left:0}
  }
  .redline-page #rl-changes-col{border-radius:12px}
  .redline-page #rl-changes-col h3{font-size:11px;letter-spacing:.08em;text-transform:uppercase;
    color:var(--color-neutral-500);font-weight:700}
  /* ---- THE COLUMN'S CONTROLS ARE THE CONTROLS ----
     These two used to be display:none here because the page header carried
     proxies for them — and when the proxies were removed (they crowded the
     strip until the contract dropdown clipped mid-word) the hiding rules
     stayed, so the send and the bulk verbs existed in the DOM and appeared
     NOWHERE. jsdom cannot see display:none, which is why every test stayed
     green while the screen went dark. The embed styling is now the base
     styling: one look, every mount. */
  /* ---- THE BULK PAIR'S RULES WENT WITH THE PAIR ----
     They dressed .nego-bulk on the counterparty's seat, the last place this
     page drew it. That block is gone from redlinePanesHtml (see the note
     there), so the rules would style nothing — and dead rules for a removed
     control are how a control comes back by accident. The classic negotiation
     tab still draws .nego-bulk and still has its own rules, above. */
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
    style="--rl-doc-type:${rlDocType()}px;display:flex;flex-direction:column;gap:12px;min-height:0;height:${_nea(o.height || 'min(880px, 84vh)')};">
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
  const c = (typeof getContract === 'function') ? getContract(state.activeId) : null;
  /* A pin is a working preference on THIS contract's column. Carrying it to the
     next contract would open a card the reader has never seen. */
  rlCardForgetPins(c && c.id);
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
          <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;">${i18t('ng_no_contract_open')}</h3>
          <p style="margin:0 0 16px;font-size:12.5px;color:var(--color-neutral-600);max-width:46ch;margin-inline:auto;line-height:1.6;">
            The redline workbench negotiates a specific agreement — open one from the register and its changes, rounds and discussion land here.
          </p>
          <button data-open-register class="ui-btn ui-btn-primary" style="padding:8px 16px;">${i18t('ng_open_register')}</button>
        </section>
      </div>`;
    host.querySelectorAll('[data-open-register]').forEach(el => el.addEventListener('click', () => {
      if (window.regState){ const R = regState(); R.stage = 'all'; R.sel = {}; }
      setView('register');
    }));
    return;
  }
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
  const side = _redlineSide === 'counterparty' ? 'counterparty' : 'owner';
  const seg = (v, label) => `<button data-redline-side="${v}" class="rl-seg${side === v ? ' on' : ''}">${label}</button>`;
  /* The same pill, asked a different question: which of the three readings the
     document is drawn in. aria-pressed rather than a tab role — nothing is
     being switched between, one surface is being drawn differently. */
  const readSeg = (v, label, tip) => `<button type="button" data-rl-read="${v}"
    class="rl-seg${rlReadMode() === v ? ' on' : ''}" aria-pressed="${rlReadMode() === v ? 'true' : 'false'}"
    title="${_nea(tip)}">${_ne(label)}</button>`;
  /* ---- WHAT IS WAITING ON THIS READER ----
     The other side's live asks, in the order the document carries them, minus
     anything walled off from this seat and minus the clauses a reviewer was not
     handed. Exactly the set the queue marks "now" and the cards badge "awaiting
     you", read from the same predicates, so a toolbar saying two and a column
     showing three cannot happen. */
  const needsYou = (() => {
    /* Not in Counterparty View. That is a window onto their page, read-only by
       decision, and "2 need you" there would be counting somebody else's work
       and offering a jump to a card with no verbs on it. */
    if (side === 'counterparty') return [];
    const all = (typeof negoChanges === 'function') ? negoChanges(c) : [];
    const wall = rlHiddenFrom(c, side);
    const mine = rlMyCardIds(c, { side, readonly: false });
    return all.filter(x => x && x.status === 'pending' && !x.withdrawn
      && x.authorSide !== side && !wall.has(x.id)
      && (!mine || mine.has(String(x.id)))).map(x => x.id);
  })();
  /* ---- THE BATCH SEND ----
     Drawn only when there is something behind the wall, and labelled with how
     much. It is a proxy onto #nego-send like Publish Round is — the same one
     act, taking the same route through the share/response flow — so pressing it
     publishes every unsent draft in one go rather than opening a queue of
     confirmations. See redlineSyncProxies for why a proxy can go dead. */
  /* Whose postbox the send acts for, named from the reader's chair (D2). */
  const sendTarget = side === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
  const sendWho = side === 'counterparty' ? (window.FIRST_PARTY || 'the owner')
    : (c.counterparty || 'the counterparty');
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
  /* THE COUNT RIDES ON THE BUTTON THAT ACTS ON IT. The wall bar used to
     announce "1 unsent draft stays behind when you share" as a band above the
     page; it is one word on the verb that sends them instead, at the moment
     that fact matters. */
  const _unsent = (window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).length;
  /* ---- AND WHAT AN INTERNAL HOLD DOES TO THAT COUNT ----
     A held ask is unsent and is NOT going out, so counting it as something this
     button will publish overstates what the press does. The button counts what
     would actually travel; the number the hold accounts for is said separately,
     in its own words, because "3 unsent" quietly becoming "2 unsent" after a
     reviewer looked at it reads as a change having disappeared. */
  const _held = (side === 'owner' && window.reviewHeldIds) ? reviewHeldIds(c).size : 0;
  const _wait = (side === 'owner' && window.reviewAwaiting) ? reviewAwaiting(c).length : 0;
  const _goes = Math.max(0, _unsent - _held - _wait);
  /* THE COUNT IS WHAT WILL TRAVEL. The two reasons something is staying behind
     are named separately rather than folded into one number: "held" is a person
     having said no, "in review" is a person not having answered yet, and a
     reader deciding whether to chase somebody needs to know which. */
  /* The verb and its counts are separate spans: on a tight row (a ThinkPad
     window) the counts stand down and the verb stays, with the title still
     carrying the whole sentence. Both remain in textContent either way, which
     is what the tests read. */
  const sendVerb = side === 'owner' ? 'Publish Round' : 'Send Response';
  const sendCounts = (_goes ? ` · ${_goes} unsent` : '')
    + (_held ? ` · ${_held} held` : '')
    + (_wait ? ` · ${_wait} in review` : '');
  const sendTip = side === 'owner'
    ? `Publish this round's changes to ${c.counterparty || 'the counterparty'}`
      + (_held ? ` — ${_held} held back by an internal reviewer will not travel` : '')
      + (_wait ? ` — ${_wait} still with a colleague and will not travel yet` : '')
    : `Send the answers and counter-proposals held on this page to ${sendWho}`;
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
  /* AND NEITHER ACT IS THE REVIEWER'S while their review is open. Publishing
     puts wording in front of the counterparty; closing the round makes the
     agreed wording the next baseline, which settles what was sent. A person who
     accepted a review does neither here until they have handed it back — the
     posture, not the gate. See rlActorHeld. */
  const _rvPosture = rlActorHeld(c, { side, readonly: false });
  const closer = (!prog.pending && prog.total && side === 'owner' && !_rvPosture)
    ? `<button data-rl-close-round class="rl-btn rl-btn-go" title="${_nea(i18t('ng_close_round_title'))}">&#10003; ${i18t('ng_close_round_n',{n:negoRound(c)})}</button>` : '';
  host.innerHTML = `
    <!-- The reference is lg:h-full: the workbench fills the window and each of
         its three columns scrolls inside itself, rather than the page growing
         past the viewport and taking the whole thing with it. --view-h is the
         room the shell actually leaves, measured after the header renders. -->
    <div id="view-redline" class="view-enter redline-page${_rlFocus ? ' rl-focus' : ''}" data-rl-side-mode="${rlSideMode()}" style="--rl-doc-type:${rlDocType()}px;height:var(--view-h);box-sizing:border-box;display:flex;flex-direction:column;gap:10px;padding:10px 18px 14px;min-height:0;">
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
      ${(window.roomHeadHtml ? roomHeadHtml(c,{primary:false,previewing:side==='counterparty'}) : '')}
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
      <div class="room-tabrow rl-tabrow">
        ${(window.roomTabsHtml?roomTabsHtml(c,'redline'):'')}
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
            ${side !== 'counterparty' && !_rvPosture && (typeof canEdit !== 'function' || canEdit()) ? `<button type="button" data-rl-pbreview class="rl-pb-btn"
              title="${i18t('ng_review_every_clause')}"><span class="rl-word">${i18t('ng_review_vs_playbook')}</span><span class="rl-glyph" aria-hidden="true">&#10022;</span></button>` : ''}
            ${''/* ALWAYS A WAY IN. This used to become "With John Wayne" the
                   moment anything went out — a button that had stopped being a
                   button, on the one control you need again the second you spot
                   something else worth escalating. Who is holding what belongs
                   on the cards, where the changes are; this row's job is to open
                   the door. Its word follows the state, because the reviewer and
                   the requester press the same place for opposite acts. */}
            ${side !== 'counterparty' && (typeof canEdit !== 'function' || canEdit()) && window.reviewState ? (() => {
              const st = reviewState(c);
              const label = st.phase === 'yours' ? i18t('rv_head_return') : i18t('rv_head_ask');
              return `<button type="button" data-rl-review class="rl-pb-btn"
                data-rv-phase="${_nea(st.phase)}" title="${_nea(i18t('rv_head_title'))}">&#128100;<span class="rl-word"> ${_ne(label)}</span></button>`;
            })() : ''}
            ${''/* ---- HOW THE CONTRACT READS, AS THREE WORDS ----
                   Not a filter and not a mode the record knows about: the same
                   clauses, drawn three ways. See rlReadMode for what each one
                   means and why only LIVE proposals are affected. */}
            <div class="rl-segwrap rl-readwrap" role="group" aria-label="${_nea(i18t('ng_read_group'))}"
              title="${_nea(i18t('ng_read_group'))}">${
              readSeg('marks', i18t('ng_read_marks'), i18t('ng_read_marks_title'))}${
              readSeg('agreed', i18t('ng_read_agreed'), i18t('ng_read_agreed_title'))}${
              readSeg('proposed', i18t('ng_read_proposed'), i18t('ng_read_proposed_title'))}</div>
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
            ${side === 'counterparty' || _rvPosture ? '' : `<button data-redline-proxy="${sendTarget}" class="rl-btn rl-btn-go" title="${_nea(sendTip)}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
              ${_ne(sendVerb)}<span class="rl-send-detail">${_ne(sendCounts)}</span></button>`}
            ${side === 'counterparty' ? '' : closer}
          </div>
        </section>
      </div>
      <div id="redline-host" style="flex:1;min-height:0;display:flex;flex-direction:column;"></div>
      ${''/* The way out of focus mode. Always in the DOM, shown only by the
             .rl-focus rule, because the button that turned focus ON is inside
             the strip focus mode stands down. */}
      <button type="button" class="rl-focus-exit" data-rl-focus-exit
        title="${i18t('ng_leave_focus')}">${i18t('ng_exit_focus')}</button>
    </div>`;
  host.querySelectorAll('[data-redline-open-doc]').forEach(el =>
    el.addEventListener('click', () => { if (window.openWorkspace) openWorkspace(c.id); }));
  /* The shell's controls press the WORKSPACE's own handlers — one share
     modal, one import flow, one compare, however you arrived at them. Back
     and the Docs tab are the same door: the workspace, on this contract. */
  host.querySelectorAll('[data-rl-back]').forEach(el =>
    el.addEventListener('click', () => { if (window.openWorkspace) openWorkspace(c.id); }));
  /* The tab row routes through the room's own router. Every tab but Negotiate
     is a journey back to the contract page, which roomGoTab handles by parking
     the wanted tab so the arrival lands on it. */
  host.querySelectorAll('#ws-tabs [data-ws-tab]').forEach(el =>
    el.addEventListener('click', () => {
      if (window.roomGoTab) roomGoTab(c, el.getAttribute('data-ws-tab'));
      else if (window.openWorkspace) openWorkspace(c.id);
    }));
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
  headAct('ws-collapse', () => window.toast && toast(i18t('ng_header_shortest')));
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
        const handed = negoHandOver(c, { to: 'counterparty', by: opts.by || (window.currentUser && currentUser()?.name) });
        if (window.persist) persist(c);
        /* "It is now their turn" is only true when the turn actually moved. A
           second batch sent while it was already theirs must not claim the
           table changed hands — see negoHandOver. */
        const moved = handed ? handed.moved !== false : false;
        const turnLine = moved ? ' — it is now their turn' : '';
        if (window.toast) toast(out && out.delivered
          ? `Sent to ${to}${turnLine}`
          : `Published to ${to}'s link${turnLine}. Send them the link if it was not emailed.`,
          out && out.delivered ? undefined : 'err');
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
      if (window.toast) toast(`Round ${r.n} closed — the agreed wording is the new baseline for round ${negoRound(c)}`);
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
    if (_rlLiveBusy) return;
    _rlLiveBusy = true;
    try{
      const st = await api('contracts/' + id + '/state');
      const cur = window.getContract ? getContract(id) : null;
      /* Our own saves move the version too — but persist writes the new
         version back onto the record (c._v), so only SOMEBODY ELSE's write
         leaves the two numbers apart. */
      if (st && cur && st.version != null && cur._v != null && st.version !== cur._v){
        const fresh = await api('contracts/' + id);
        const i = state.contracts.findIndex(x => x && x.id === id);
        if (i >= 0) state.contracts[i] = fresh;
        renderRedline();
        if (window.toast) toast(`Updated just now — new activity on ${id}`);
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
    if (action.standard){ rlAiPropose({ ...ctx, action: rlStandardAction(ctx.c) }); return; }
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
     for as long as the round trip takes, and permanently if it fails.
     SUMMONED: opened for this errand, so settling the proposal closes it again
     — unless the reader had the panel open already, in which case it is theirs
     and stays (see ai.summoned, js/ai.js). */
  if (window.openAI) openAI(null, { docked: true, summoned: true });
  /* What was asked, in the reader's own stream — otherwise the panel answers a
     question it never shows, and the Copilot reads as volunteering wording
     nobody asked for. */
  if (window.aiPush) aiPush('user', { text: `${_ne(action.label)}<div style="font-size:11px;margin-top:4px;opacity:.8;font-style:italic">“${
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
const _rlCardChoice = new Map();    // id -> { open, key } — what the reader opened
/* An open card belongs to the contract it was opened on, and to this visit.
   Not persisted (a working preference is not a setting) and dropped when the
   reader moves to another contract, so a card cannot arrive open on a change
   the reader has never seen. */
let _rlPinnedFor = null;
/* rlTagInternalNote is gone with the two buttons that called it. It switched
   the sidebar to Discussion, nominated a change, pressed the visibility switch
   to internal and quoted the passage — a private remark about a fragment, and
   it required a change to exist on the clause first, so the commonest moment
   to want one was the moment it refused. Reasons live on the change now. The
   Discussion panel still writes notes, internal ones included. */
function rlCardForgetPins(contractId){
  const id = String(contractId == null ? '' : contractId);
  if (_rlPinnedFor === id) return;
  _rlPinnedFor = id;
  _rlCardChoice.clear();
}
/* The verbs reduced to which ACTIONS are on offer, ignoring the ids inside them
   so that a clause being renamed underneath a card does not count as a state
   change. */
function rlCardStateKey(verbs){
  return (verbs || [])
    .map(v => (String(v).match(/data-(?:rl|nego)-[a-z]+(?:-[a-z]+)*(?==)/g) || []).join('+'))
    .sort().join('|');
}
/* READ OFF THE VERBS, not off the status. Enumerating states here would be a
   second copy of the rule that builds the verbs a hundred lines below, and the
   two would disagree the first time either moved — a held decision whose Undo
   the reader cannot see, or a settled card kept open for nothing.

   So the question is asked of the card itself: does it offer anything to DO?
   Edit and Sent do not count. Edit navigates (it opens the clause in the
   document, which pressing the card does anyway) and Sent is a disabled label.
   Everything else — Accept, Reject, Withdraw, Undo, Retract, Send — is a move
   waiting on this reader, and a move you cannot see is a move you do not make.
   Matched on the data attributes the handlers and the tests both query, so a
   new verb cannot be added without this seeing it.

   ---- AND "CHANGE DECISION" IS NOT A MOVE WAITING ON ANYBODY ----
   It used to count, so a counterparty who had answered a dozen changes and
   sent them was left with a dozen full-height cards, each still offering a
   button, on a column where nothing was outstanding. Their page stayed loud
   after the work was finished, while the owner's went quiet — the owner's
   settled changes leave the column entirely, and their own sent asks collapse
   to a line because "Sent" is inert. Same component, opposite feel, for no
   reason either reader could see.

   The distinction that matters is not "is there a button" but "is anyone
   waiting". A sent decision is finished business: it has gone, the other side
   is holding it, and Change decision is an ESCAPE HATCH rather than a task.
   Escape hatches belong behind the peek, which is exactly what the collapsed
   state is for — hover, or tab to the card, and it is there.

   UNDO IS DELIBERATELY NOT IN HERE, and it is the same reasoning rather than
   an exception to it. Undo appears on a decision that is answered and has NOT
   been sent — the one state on this screen that looks finished and is not. It
   is also the state a reader is in for the second after a click, which is when
   a mis-click is most likely and the worst possible moment to have hidden the
   way back. It collapses on its own once the round is sent. */
const RL_CARD_INERT = /data-rl-edit|data-rl-sent|data-nego-redecide/;
function rlCardNeedsYou(verbs){
  return (verbs || []).some(v => !RL_CARD_INERT.test(String(v)));
}
/* ---- A CARD IS SHUT UNTIL SOMEBODY OPENS IT, AND OPEN UNTIL THEY SHUT IT ----
   Asked for in one sentence (Young, 10 Aug 2026): "the cards you only open when
   you click on them and you click again and they disappear."

   That is a plain toggle, and it replaces three rules that between them decided
   the state for the reader:

   - cards carrying a verb OPENED THEMSELVES, on the argument that a move you
     cannot see is a move you do not make. True, and the cost was a column that
     arrived as a wall of open cards on any round with work in it — which is
     the state the fold was introduced to prevent in the first place;
   - hovering PEEKED one open, so the column moved under a pointer crossing it;
   - opening one card SHUT every other, so a reader comparing two changes could
     not hold both.

   All three are gone. The reader opens what they want open and closes it the
   same way, and nothing else on the page changes it. What they cannot see on a
   shut card, they can see in one click — and the verbs are still reachable in
   exactly the number of presses the old peek needed.

   The choice is keyed on the change id alone. It used to be keyed on the card's
   VERBS too, so a card whose buttons changed underneath the reader fell back to
   the default — which mattered when the default could be "open" and is simply
   wrong now: pressing Accept would have folded the card you were working in. */
function rlCardIsOpen(ch, verbs){
  const id = ch && ch.id;
  const choice = id ? _rlCardChoice.get(id) : null;
  return choice ? !!choice.open : false;
}
/* Pressing a card's head toggles it. Nothing else does: the verbs inside it,
   the notes composer and the caret are all inside the card, and a reader
   pressing Accept must not have the card fold up underneath them for it. */
function rlCardSetOpen(id, open, stateKey){
  if (!id) return;
  _rlCardChoice.set(id, { open: !!open, key: String(stateKey == null ? '' : stateKey) });
}
/* Whether this card is currently open, without the verbs — what the toggle
   asks before it flips. */
function rlCardOpenState(id){
  const choice = id ? _rlCardChoice.get(id) : null;
  return !!(choice && choice.open);
}
/* Close every open card. Nothing on the page calls this any more — pressing
   outside the column used to, and that was the rule that made an open card
   feel like something the page was lending you rather than something you had
   set. Kept because the paint-time reset (a different contract arriving on the
   bench) genuinely wants it: see rlCardForgetPins. */
function rlCardUnpinAll(){
  if (!_rlCardChoice.size) return false;
  _rlCardChoice.clear();
  return true;
}

function rlLinkFocus(c, changeId, source){
  const page = document.getElementById('view-redline')
    || document.querySelector('.redline-page.rl-embed');
  const id = String(changeId == null ? '' : changeId);
  if (!page || !id) return false;
  const q = v => (window.CSS && CSS.escape) ? CSS.escape(v) : v;
  page.querySelectorAll('.is-linked').forEach(n => n.classList.remove('is-linked'));
  const clause = page.querySelector('#rl-doc [data-nego-card-anchor="' + q(id) + '"]');
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
    /* THE RING MOVES ON THE PRESS, BEFORE ANYTHING ELSE HAPPENS. Recorded in
       module state so a repaint keeps it, and moved in the DOM immediately so
       the answer does not wait on one — a highlight that arrives after a
       render is a highlight the reader has already stopped believing in. */
    rlQueueSelect(c, id);
    rlQueueMark(row.closest('.redline-page') || host, id);
    /* Opening the card is a repaint, so it happens FIRST and the focus runs
       against the card that comes back — the node this handler could reach is
       about to be replaced. Mirrors the card stack's own collapsed-card path. */
    const card = id ? host.querySelector(`[data-nego-card="${window.CSS && CSS.escape ? CSS.escape(id) : id}"]`) : null;
    if (card && card.getAttribute('data-rl-open') === '0'){
      rlCardSetOpen(id, true, card.getAttribute('data-rl-state'));
      again();
    }
    if (id && rlLinkFocus(c, id, 'queue')) return;
    /* No card and no anchor — a clause whose change has left the live set.
       Falling back to the clause itself still answers "take me to it", and
       edit:false because a queue row is a place to LOOK, not an invitation to
       start typing in the contract. */
    if (clauseId) rlJumpToClause(clauseId, { edit: false });
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
      toast(i18t('ng_clause_gone'), 'err');
  }));

  /* The origin filter and the sidebar's mode tabs were wired here. Both
     controls are gone — see RL_CARD_FILTERS and rlSideMode — so their
     handlers went with them rather than staying as listeners for elements
     nothing draws. */

  /* ---- THE SPLIT HANDLE ---- */
  rlWireResizer(host);

  /* ---- THE TEXT-SIZE STEPPER ---- */
  rlWireTypeStep(host);

  /* ---- FOLDING THE QUEUE ---- */
  rlWireQueueMin(host);

  /* ---- THE CARD IS A TOGGLE, AND ONLY ITS HEAD IS ----
     One press opens it, the next shuts it (Young, 10 Aug 2026). What was here
     before decided the state for the reader three ways over — a card with a
     verb opened itself, a hover peeked one open, and opening one shut the rest
     — and all three are gone. See rlCardIsOpen for why.

     ONLY THE HEAD. The body holds the verbs and the notes composer, and a
     press on Accept, on Send, or into the note box must not fold the card up
     underneath the hand doing it. So the listener sits on .rl-card-head and
     the body is not a toggle at any depth.

     AND IT STILL NAVIGATES. Pressing a card has always meant "take me to this
     change in the contract", and that is the more valuable of the two things
     the press does — so it happens on every press, opening or shutting. */
  host.querySelectorAll('#rl-changes [data-nego-card] .rl-card-head').forEach(headEl =>
    headEl.addEventListener('click', ev => {
      const card = headEl.closest('[data-nego-card]');
      if (!card) return;
      /* The caret is inside the head and has its own handler; without this the
         two would fight and the card would flip twice for one press. */
      if (ev.target && ev.target.closest && ev.target.closest('[data-rl-caret]')) return;
      const id = card.getAttribute('data-nego-card');
      rlCardSetOpen(id, !rlCardOpenState(id), card.getAttribute('data-rl-state'));
      again();
      /* The card was re-rendered underneath us, so the focus runs against the
         new one rather than the node this handler was bound to. */
      rlLinkFocus(c, id, 'card');
    }));

  /* ---- AND THE CARET IS THE SAME TOGGLE, SAID OUT LOUD ----
     It is the affordance: the one thing on a shut card that says there is more
     under it. It stops propagation so it does not also run the head's handler,
     and it does NOT drag the document to the clause — somebody tidying a
     column is not asking to be taken anywhere. */
  host.querySelectorAll('#rl-changes [data-rl-caret]').forEach(btn =>
    btn.addEventListener('click', ev => {
      ev.preventDefault(); ev.stopPropagation();
      const id = btn.getAttribute('data-rl-caret');
      const card = btn.closest ? btn.closest('[data-nego-card]') : null;
      rlCardSetOpen(id, !rlCardOpenState(id), card && card.getAttribute('data-rl-state'));
      again();
    }));

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
    '.rl-tools, .rl-tool, .nego-tool, .nego-selmenu, [data-nego-editor], .nego-edit-bar, '
    + 'button, a, input, textarea, select'));
  host.querySelectorAll('#rl-doc [data-nego-card-anchor]').forEach(sec =>
    sec.addEventListener('click', ev => {
      if (fromClauseControl(ev.target)) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && !sel.isCollapsed && String(sel.toString() || '').trim()) return;
      rlLinkFocus(c, sec.getAttribute('data-nego-card-anchor'), 'clause');
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

  /* The card's Send — the SAME act as the toolbar's batch send, because there
     is only one send: everything unsent goes in one round. A per-change send
     would let a reader believe they had published one ask while three others
     stayed home. */
  negoWireWhyClamp(host);
  host.querySelectorAll('[data-rl-send]').forEach(btn => btn.addEventListener('click', ev => {
    ev.preventDefault(); ev.stopPropagation();
    /* Whose postbox a card's Send presses depends on whose card it is: the
       owner's is #nego-send, the counterparty's — on their page and on the
       owner's preview alike — is #nego-send-decisions. Scoped to this mount
       first so two workbenches on one page cannot press each other. */
    const id = (opts && opts.side) === 'counterparty' ? 'nego-send-decisions' : 'nego-send';
    const engine = negoPick(host, id) || document.getElementById(id);
    if (engine && !engine.disabled){ engine.click(); return; }
    if (window.toast) toast(i18t('ng_nothing_to_send'), 'err');
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
    const ch = negoRetractDraft(c, chId, { side, by: opts && opts.by });
    if (!ch) return;
    if (window.negoInvalidateVerification) negoInvalidateVerification(c);
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
  root.querySelectorAll('[data-rl-mode]').forEach(b => {
    const on = b.getAttribute('data-rl-mode') === m;
    b.classList.toggle('on', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
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
const RL_SPLIT_KEY = 'hati.v1.rlLeftFrac';
function _rlLeftFrac(){
  try { const v = Number(localStorage.getItem(RL_SPLIT_KEY));
    return (v >= RL_FMIN - 0.001 && v <= RL_FMAX + 0.001) ? v : RL_F0; }
  catch (e) { return RL_F0; }
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
/* And the narrowest the queue can be and still read: "#12 · Payment Terms"
   with a status beside it. Below this it is not a narrower queue, it is an
   unreadable one, so the sheet gives way instead. */
const RL_QUEUE_MIN = 210;

/* HOW WIDE THE QUEUE WANTS TO BE. Read off the CSS custom property rather than
   off the rendered box, deliberately: this function WRITES the rendered width
   a few lines below, so measuring the box would feed last paint's answer back
   in and the column would ratchet down a little on every resize and never grow
   back. The property is the declared intent, and the sheet keeps the only copy
   of the number — the laptop breakpoint lives there. Returns 0 when the queue
   is absent or the narrow-width fallback has stacked it, which is also the
   signal that the original two-column maths applies unchanged. */
function _rlQueueW(grid){
  const q = grid && grid.querySelector('#rl-queue');
  if (!q || q.offsetParent === null) return 0;
  const want = parseFloat(getComputedStyle(grid).getPropertyValue('--rl-queue-w'));
  if (!(want > 0)) return 0;
  /* Stacked: the fallback drops the grid to one column, so the queue is as
     wide as the grid and there is no split left to place. */
  return (q.getBoundingClientRect().width < grid.clientWidth - 80) ? want : 0;
}
function rlLayoutResizer(host){
  const scope = (host && host.querySelector) ? host : document;
  const grid = scope.querySelector('.redline-page .rl-grid');
  const rez = grid && grid.querySelector('#rl-resizer');
  if (!grid || !rez) return;
  /* THE HANDLE SITS ON A BOUNDARY, and the queue moved it. This function
     writes the grid's columns inline, so a third column has to be accounted
     for here as well as in the sheet — a CSS-only change would be overwritten
     the moment anything called this, and the handle would keep its old
     position, drawn straight down the middle of the contract. */
  let qw = _rlQueueW(grid);
  const solve = q => {
    const avail = grid.clientWidth - (q ? RL_GAP * 2 : RL_GAP) - q;
    let left = Math.round(_rlLeftFrac() * avail);
    if (avail >= RL_LEFT_MIN + RL_RIGHT_MIN)
      left = Math.min(Math.max(left, RL_LEFT_MIN), avail - RL_RIGHT_MIN);
    return { avail, left };
  };
  let s = solve(qw);
  /* ---- THE CONTRACT KEEPS ITS MEASURE; THE QUEUE GIVES UP THE WIDTH ----
     Three columns, a 720px sheet and a readable change stack do not all fit on
     a 1440px laptop, and something has to yield. It is the queue: it is a list
     of short labels and loses almost nothing by narrowing, while the contract
     column is where the wording is actually judged and a sheet that cannot
     hold its measure makes the Doc and Negotiate tabs typeset differently.
     Only down to RL_QUEUE_MIN — past that the queue would stop being readable
     to save a measure, which is trading one broken thing for another. */
  if (qw && s.left < RL_SHEET_COL_MIN){
    /* Solved, not stepped. Giving the queue's width back to the document one
       pixel for one pixel undershoots every time — the document only takes its
       own share of what is freed, so a naive subtraction lands short and the
       measure stays broken. Ask instead how much room the split needs to put
       RL_SHEET_COL_MIN on the left, and hand the queue whatever is over. */
    const need = RL_SHEET_COL_MIN / Math.max(0.01, _rlLeftFrac());
    const room = grid.clientWidth - RL_GAP * 2 - need;
    const want = Math.max(RL_QUEUE_MIN, Math.min(qw, Math.floor(room)));
    if (want < qw){ qw = want; s = solve(qw); }
  }
  /* Unmeasured (a stage with no layout) or stacked to one column: the CSS
     fallback columns hold, and writing 0px here would break them. */
  if (s.avail < 160) return;
  grid.style.gridTemplateColumns =
    (qw ? qw + 'px ' : '') + s.left + 'px minmax(0,1fr)';
  rez.style.left = (qw ? qw + RL_GAP : 0) + s.left + 'px';
  /* ---- AND IT SAYS WHEN IT WILL NOT GO FURTHER ----
     The split has real limits — the contract keeps a readable measure, the
     cards keep a readable width — and reaching one is legitimate. Reaching it
     in SILENCE is not: the handle simply stopped following the cursor with
     nothing on screen to say why, so the control read as broken exactly when
     somebody was pushing hardest at it. A splitter at its limit should look
     like one. */
  const atMin = s.left <= RL_LEFT_MIN, atMax = s.left >= s.avail - RL_RIGHT_MIN;
  if (atMin || atMax) rez.setAttribute('data-rl-at-limit', atMin ? 'min' : 'max');
  else rez.removeAttribute('data-rl-at-limit');
}
/* ---------- THE CONTRACT TEXT SIZE, STEPPED ----------
   A⁻ / readout / A⁺ on the sub-header strip. It drives --rl-doc-type — the
   one token the whole canvas is set from (clause bodies, headings, recital) —
   so a step moves the entire document together, and it is remembered per
   browser so the choice survives a repaint, a reload and the trip through the
   Docs tab (whose auto-zoom multiplies by the same preference, one reading on
   both tabs). Bounded: below 11px a contract stops being readable, above
   20px it stops being a contract. */
const RL_TYPE_MIN = 11, RL_TYPE_MAX = 20, RL_TYPE_DEF = 15;
const RL_TYPE_KEY = 'hati.v1.rlDocType';
function rlDocType(){
  try { const v = Number(localStorage.getItem(RL_TYPE_KEY));
    return (v >= RL_TYPE_MIN && v <= RL_TYPE_MAX) ? v : RL_TYPE_DEF; }
  catch (e) { return RL_TYPE_DEF; }
}
function rlSetDocType(px){
  const v = Math.max(RL_TYPE_MIN, Math.min(RL_TYPE_MAX, Math.round(Number(px) || RL_TYPE_DEF)));
  try { localStorage.setItem(RL_TYPE_KEY, String(v)); } catch (e) {}
  /* Applied live to every mounted workbench root — no repaint, so scroll
     positions and half-typed replies survive a resize like they survive a
     mode switch — and the readouts and bound-stops follow the same value. */
  document.querySelectorAll('.redline-page').forEach(root =>
    root.style.setProperty('--rl-doc-type', v + 'px'));
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
    const qw = _rlQueueW(grid);
    const avail = Math.max(1, grid.clientWidth - (qw ? RL_GAP * 2 : RL_GAP) - qw);
    const left = (x + grabDx) - r.left - (qw ? qw + RL_GAP : 0);
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
  rez.addEventListener('dblclick', () => {
    try { localStorage.setItem(RL_SPLIT_KEY, String(RL_F0)); } catch (e2) {}
    rlLayoutResizer(scope); });
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
  const byClause = new Map();
  for (const ch of changes) byClause.set(ch.clauseId, ch);
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
    /* ---- THE COPILOT IS BACK ON THE CLAUSE, AND THAT IS A REVERSAL ----
       It was removed on the argument that highlighting the words you want
       worked on is itself the statement of scope, so a whole-clause entry was a
       duplicate door. True of scope, and wrong about discoverability: a text
       selection is an invisible affordance. A reader looking at a clause and
       wanting the Copilot to redraft it saw one button, marked Direct Edit,
       and concluded the Copilot could not touch company paper at all
       (Young, 04 Aug 2026).

       It is not a second WAY of proposing — that would be the thing this page
       refuses. The button builds the same ctx a drag across the whole clause
       builds and hands it to the same rlSelMenu, so every ask still travels
       rlAiPropose → negoEditClause, with the same refusals and the same
       fingerprint. The selection route is untouched and still does finer work:
       this one is the door you can see. */
    /* "ADD NOTE/TAG" IS GONE FROM THIS TOOLBAR, with its twin in the
             selection menu. A note about wording, kept privately beside the
             wording, is the weakest version of the thing this screen is for:
             the reason a change was asked for now travels ON the change, given
             when the change is filed, where the other side can read it and
             where the history keeps it. A private remark that never leaves the
             workspace answers nobody's question in the next round.

             The capability is not lost, only its shortcut: the Discussion
             panel still composes notes and still has the shared/internal
             switch. What went is the two doors that opened it pre-set to
             internal and pointed at a fragment. */
    return `<div class="rl-tools" role="group" aria-label="${i18t('ng_tools_for_clause')}">
      ${opts.noAi ? '' : `<button type="button" class="rl-tool rl-tool-ai" data-nego-ai-clause="${id}"
        title="${i18t('ng_ai_redraft_title')}">&#10024; Copilot</button>`}
      <button type="button" class="rl-tool rl-tool-edit" data-nego-edit="${id}"
        title="${_nea(i18t('ng_direct_edit_title'))}">&#9998; ${i18t('ng_direct_edit')}</button>
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
    return `<section class="nego-clause rl-clause is-changed rl-clause-new" data-clause="${_ne(ch.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
      <div class="rl-clause-top">
        ${label ? `<h4 class="rl-clause-h">${_ne(label)}</h4>` : ''}
        <span class="rl-asktag"${tagTip}>${_ne(ch.id)} · ${theirs ? i18t('ng_their_ask') : i18t('ng_your_ask_short')} &middot; ${i18t('ng_new_clause_tag')}${st}</span>
      </div>
      <div class="nego-body">${inner}</div>
    </section>`;
  };
  /* Folded to the reviewer's own clauses — see rlRvDocClauses. Null means the
     whole contract, which is every reader who is not reviewing here and any
     reviewer who has pressed the control below. */
  const _rvOnly = rlRvDocClauses(c, opts);
  const _rvHidden = _rvOnly ? clauses.filter(cl => !_rvOnly.has(String(cl.clauseId))).length : 0;
  const body = clauses.filter(cl => !_rvOnly || _rvOnly.has(String(cl.clauseId))).map(cl => {
    const after = (insertsAfter.get(cl.clauseId) || []).map(insertBlock).join('');
    const ch = byClause.get(cl.clauseId);
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
        return `<section class="nego-clause rl-clause" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
          ${heading(cl)}
          ${''/* A formatting-only ask read "as agreed" is simply the clause. */}
          ${clean == null ? richBody(cl) : clean}
          ${tools(cl, ch)}
        </section>${after}`;
      }
      /* The decision rides on the tag, because the card leaves the column once
         a change is settled: without this the document showed the marks and
         nothing said the argument about them was over. The refusal's reason —
         ch.reply, which travels — is on the tag's tooltip. */
      const st = ch.status === 'accepted' ? ' &middot; &#10003; adopted'
        : ch.status === 'rejected' ? ' &middot; &#10007; refused' : '';
      const tagTip = ch.status === 'rejected' && ch.reply ? ` title="${_nea(ch.reply)}"` : '';
      /* Named on the tag, because this clause shows no strike/insert marks —
         the chip is the only thing saying the words did not move. */
      const fmtChip = ch.formattingOnly
        ? `<span class="nego-note fmt" title="${_nea(i18t('ng_formatting_only_title'))}">${i18t('ng_formatting_only')}</span>` : '';
      return `<section class="nego-clause rl-clause is-changed" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}" data-nego-card-anchor="${_ne(ch.id)}">
        <div class="rl-clause-top">
          ${heading(cl)}
          <span class="rl-asktag"${tagTip}>${_ne(ch.id)} · ${theirs ? 'Their ask' : 'Your ask'}${st}</span>${fmtChip}
        </div>
        ${clean == null ? richBody(cl) : clean}
        ${tools(cl, ch)}
      </section>${after}`;
    }
    return `<section class="nego-clause rl-clause" data-clause="${_ne(cl.clauseId)}" data-nego-working="${_ne(cl.clauseId)}">
      ${heading(cl)}
      ${richBody(cl)}
      ${tools(cl, null)}
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
  const front = (window.clauseFrontMatter
    ? clauseFrontMatter((window.negoBodyOf ? negoBodyOf(c) : negoBaseBody(c)))
    : null) || { titleText: '', leadHtml: '', bodyHtml: '' };
  const head = front.titleText
    ? `<header class="rl-paper-head">
      ${front.leadHtml ? `<div class="rl-paper-kick">${front.leadHtml}</div>` : ''}
      <h3 class="rl-paper-title">${_ne(front.titleText)}</h3>
      ${front.leadHtml ? '' : `<p class="rl-paper-sub">${_ne(tmpl)} &middot; Jurisdiction: ${_ne(region)}</p>`}
    </header>
    ${front.bodyHtml ? `<div class="rl-recital" data-anchor="recital">${front.bodyHtml}</div>` : ''}`
    : `<header class="rl-paper-head">
      <h3 class="rl-paper-title">${_ne((c.name || tmpl)).toUpperCase()}</h3>
      <p class="rl-paper-sub">${_ne(tmpl)} &middot; Jurisdiction: ${_ne(region)}</p>
    </header>`;
  /* nego-doc is required, not cosmetic: the Copilot selection menu (the three
     NEGO_AI_ACTIONS — rephrase for advantage, explain legal risk, shorten
     wording) only opens when the selection sits inside
     `.nego-pane.working .nego-doc`. Without this class the AI redlining is
     silently unreachable on this page. */
  return `<article class="nego-doc rl-paper">
    ${head}
    ${negoNumberingNoticeHtml(c, { noticeId: 'rl-gaps',
      offer: side === 'owner' && (typeof window.canEdit !== 'function' || window.canEdit()) })}
    ${rlRvDocNoticeHtml(c, opts, _rvHidden)}
    ${body || `<p class="rl-clause-p">${i18t('ng_no_clause_structure')}</p>`}
    ${rlPaperFootHtml(c)}
  </article>`;
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
function rlPbFindClause(c, quote){
  const q = _rlPbNorm(quote);
  if (!q) return null;
  const clauses = (typeof negoClauseList === 'function') ? negoClauseList(c) : [];
  let best = null, bestScore = 0;
  const qw = q.split(/[^a-z0-9]+/).filter(w => w.length > 3);
  for (const cl of clauses){
    const l = _rlPbNorm(cl.text);
    if (!l) continue;
    if (l.includes(q) || q.includes(l)) return cl;
    if (qw.length){
      let hit = 0;
      for (const w of qw) if (l.includes(w)) hit++;
      const score = hit / qw.length;
      if (score > bestScore){ bestScore = score; best = cl; }
    }
  }
  return bestScore >= 0.5 ? best : null;
}
/* Review result → the proposal list the modal draws. Pure — no DOM, no
   filing — so the tests can hold it to account without a screen. */
function rlPlaybookProposals(c, rev){
  const out = [];
  const lib = (window.clauseLibrary ? clauseLibrary() : []);
  for (const v of ((rev && rev.verdicts) || [])){
    if (!v || v.status === 'aligned') continue;
    const cl = v.quote ? rlPbFindClause(c, v.quote) : null;
    const libCl = lib.find(x => _rlPbNorm(x.category) === _rlPbNorm(v.category)
      || _rlPbNorm(x.name) === _rlPbNorm(v.category)) || null;
    const preferred = String(v.redline || (libCl ? libCl.preferred : '') || '').trim();
    let fallback = String((libCl && libCl.fallback) || '').trim();
    if (fallback && fallback === preferred) fallback = '';
    if (!preferred && !fallback) continue;   // review-only verdict — nothing proposable
    out.push({ v, clauseId: cl ? cl.clauseId : null,
      clauseLabel: cl && window.negoClauseLabel ? negoClauseLabel(cl) : '',
      oldText: cl ? cl.text : '',
      preferred: preferred || fallback, fallback: preferred ? fallback : '',
      risk: v.escalate ? 'high' : 'medium' });
  }
  return out;
}
/* File one proposal. A located clause is a modify through negoEditClause —
   merged into the clause's own markup — and a missing position is an insert
   at the end, both wearing a note that names the playbook position they
   enforce. The same verbs a person's own edit uses; nothing new to audit. */
async function rlFilePlaybookProposal(c, item, wording){
  const words = String(wording == null ? '' : wording).trim();
  if (!words) return null;
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
    return await negoInsertClause(c, after, { headingText: String(item.v.category || '').toUpperCase(), bodyHtml: body },
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
    if (window.toast) toast(aligned === rev.verdicts.length
      ? `Every playbook position is aligned — nothing to propose`
      : 'The review found points to watch but no proposable wording — see Draft & Review on the Doc page');
    if (again) again();
    return;
  }
  const chip = it => it.risk === 'high'
    ? `<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:var(--st-ruby-bg,#fee2e2);color:var(--st-ruby-fg,#b91c1c)">${i18t('ng_high_risk')}</span>`
    : `<span style="font-size:9px;font-weight:700;padding:2px 7px;border-radius:5px;background:var(--st-amber-bg,#fef3c7);color:var(--st-amber-fg,#b45309)">${i18t('ng_medium')}</span>`;
  const itemHtml = (it, i) => `<div id="pbr-item-${i}" style="border:1px solid var(--color-divider);border-radius:10px;padding:12px 14px;margin-bottom:10px;background:var(--color-surface)">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
      <b style="font-size:12.5px">${_ne(it.v.category)}</b>${chip(it)}
      <span style="font-size:10px;color:var(--color-neutral-500)">${it.v.status === 'missing'
        ? 'missing — files as a new clause at the end'
        : (it.clauseLabel ? `deviation &middot; ${_ne(it.clauseLabel)}` : 'deviation')}</span>
    </div>
    ${it.v.position ? `<div style="font-size:11.5px;color:var(--color-neutral-600);margin-top:5px;line-height:1.5">${_ne(String(it.v.position))}</div>` : ''}
    ${it.oldText && window.redlineStructuredHtml
      ? `<div style="margin-top:8px;font-size:12px;line-height:1.7;border:1px solid var(--color-divider);border-radius:7px;padding:8px 10px;max-height:150px;overflow:auto">${redlineStructuredHtml(it.oldText, it.preferred)}</div>`
      : `<div style="margin-top:8px;font-size:12px;line-height:1.6;border:1px solid var(--color-divider);border-radius:7px;padding:8px 10px;max-height:150px;overflow:auto">${_ne(it.preferred)}</div>`}
    <div style="display:flex;justify-content:flex-end;gap:6px;margin-top:9px" data-pbr-verbs="${i}">
      <button data-pbr-skip="${i}" class="ui-btn" style="font-size:11px;padding:4px 11px">${i18t('ng_skip')}</button>
      ${it.fallback ? `<button data-pbr-fb="${i}" class="ui-btn" style="font-size:11px;padding:4px 11px" title="${i18t('ng_file_fallback_title')}">${i18t('ng_file_fallback')}</button>` : ''}
      <button data-pbr-go="${i}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:4px 11px" title="${_nea(i18t('ng_file_preferred_title'))}">${i18t('ng_file_preferred')}</button>
    </div>
  </div>`;
  openModal(`<div style="padding:20px 24px;max-height:calc(100vh - 80px);overflow-y:auto">
    <h2 style="font-family:var(--font-heading);font-weight:600;font-size:18px;margin:0 0 4px">&#10022; ${i18tn('ng_playbook_review',items.length,{n:items.length})}</h2>
    <p style="font-size:12px;color:var(--color-neutral-600);margin:0 0 14px;line-height:1.55">${aligned} position${aligned === 1 ? '' : 's'} aligned${rev.source === 'ai' ? ' &middot; Copilot-assisted review' : ' &middot; rule-based review'}. A proposal files as an ordinary fingerprinted change only when you press it — nothing applies itself. <b>${i18t('ng_preferred')}</b> ${i18t('ng_opening_position')} <b>fallback</b> ${i18t('ng_concession_allowed')}</p>
    ${items.map(itemHtml).join('')}
    <div style="display:flex;justify-content:flex-end"><button id="pbr-close" class="ui-btn">${i18t('act_close')}</button></div>
  </div>`, { maxWidth: '780px' });
  const root = document.getElementById('modal-root') || document;
  const settle = (i, text, tone) => {
    const verbs = root.querySelector(`[data-pbr-verbs="${i}"]`);
    if (verbs) verbs.innerHTML = `<span style="font-size:11.5px;font-weight:600;color:${tone}">${text}</span>`;
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
  return all.filter(x => (_rlIsLive(x) || heldIds.has(x.id) || contestedAny(x)
    || sentIds.has(x.id)) && !hidden.has(x.id)
    && (!mineOnly || mineOnly.has(String(x.id)))
    /* The reader's own cut, applied HERE as well as in the card list — this
       function is what the count above the cards is drawn from, and a count
       that ignored the filter would label a column it was not describing.
       Not applied to a reviewer's narrowed column: opts.countAll lets the
       chips ask for the unfiltered totals they print. */
    && (opts.countAll || rlCardFilterPass(x, side))).map(x => x.id);
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
  return _rlNoticeFold.has(k) ? !!_rlNoticeFold.get(k) : true;   // folded until summoned
}
function rlSetNoticesFolded(cOrId, v){
  const k = (cOrId && typeof cOrId === 'object') ? String(cOrId.id || '') : String(cOrId || '');
  _rlNoticeFold.set(k, !!v);
}
/* Wired ONCE, by delegation on the document — the same pattern (and reason) as
   the reading buttons above: the stack is painted into the mount after the
   page wires itself, and repainted by several paths, so an element-bound
   listener is dropped by the first of them. */
if (typeof document !== 'undefined' && !document._rlNoticeFoldWired){
  document._rlNoticeFoldWired = true;
  document.addEventListener('click', ev => {
    const t = ev.target;
    const open = t && t.closest && t.closest('[data-rl-notices-open]');
    const shut = !open && t && t.closest && t.closest('[data-rl-notices-min]');
    if (!open && !shut) return;
    ev.preventDefault();
    rlSetNoticesFolded(open ? open.getAttribute('data-rl-notices-open')
      : shut.getAttribute('data-rl-notices-min'), !open);
    rlRepaintFrom(open || shut);
  });
}
/* ---- WHOSE ASKS: WIRED ONCE, ON THE DOCUMENT ----
   The reading buttons' own pattern, and for the same reason: the chips are
   painted into the mount by redlinePanesHtml, after the page has wired itself,
   and several paths repaint that mount — an element-bound listener is dropped
   by the first of them. The "show me all of them" button on the filtered-empty
   state carries the same attribute, so it is the same door. */
if (typeof document !== 'undefined' && !document._rlCardFilterWired){
  document._rlCardFilterWired = true;
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-rl-cardfilter]');
    if (!b) return;
    ev.preventDefault();
    rlSetCardFilter(b.getAttribute('data-rl-cardfilter'));
    rlRepaintFrom(b);
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
    const open = p.classList.toggle('rl-cnote-clamp') === false;
    b.textContent = open ? (b.getAttribute('data-less') || 'Show less')
      : (b.getAttribute('data-more') || 'Show more');
  });
}

function rlFloatingNoticesHtml(c, opts = {}){
  const alerts = (window.rlOneNoticeHtml ? rlOneNoticeHtml(c, opts) : '') || '';
  const note = rlReadNoticeHtml() || '';
  /* Empty means empty: an always-present container would sit over the bottom
     corner of the contract catching clicks meant for the document. No alerts
     means NO BELL either — a bell with nothing behind it is furniture. */
  if (!alerts && !note) return '';
  const cid = _nea(String((c && c.id) || ''));
  let stack;
  if (!alerts) stack = note;
  else if (rlNoticesFolded(c))
    stack = note + `<button type="button" class="rl-notices-fab" data-rl-notices-open="${cid}"
      aria-label="${_nea(i18t('ng_notices_fab'))}" title="${_nea(i18t('ng_notices_fab'))}">&#128276;<span class="rl-fab-dot"></span></button>`;
  else
    stack = `<button type="button" class="rl-notices-min" data-rl-notices-min="${cid}"
      aria-label="${_nea(i18t('ng_notices_min_title'))}" title="${_nea(i18t('ng_notices_min_title'))}">${i18t('ng_notices_min')} &#9662;</button>`
      + alerts + note;
  return `<div class="rl-notices" id="rl-notices">${stack}</div>`;
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
   What the Discussion column used to draw, drawn on the change itself. Same
   engine underneath and deliberately so: the message list is negoMergedThread
   filtered by rlMsgVisible, and the composer carries the three attributes
   wireNegotiationTab binds — id="nego-ti-<id>", data-nego-send and a
   data-nego-vis marker — so nothing about posting, validating or walling a
   message is reimplemented here.

   THE VISIBILITY MARKER IS PRESENT AND UNPRESSABLE. It is not decoration: the
   send handler resolves visibility by finding the pressed data-nego-vis button
   for this change and DEFAULTS TO SHARED when it finds none. A card with no
   marker at all would therefore post every internal note to the counterparty —
   the exact opposite of what the line under the button promises. */
function rlCardNotesHtml(c, ch, opts, side){
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
  /* ---- BOTH SEATS CHOOSE WHO READS A NOTE ----
     The counterparty always had the switch: their page is the only channel
     they have, and an internal-only box there reaches nobody (F58). Our seat
     used to be internal-only by design — the round was "how we reach them" —
     and that asymmetry was reported as the gap it is (Young, 10 Aug 2026:
     "there is no ability to toggle between internal and send to them like we
     have in the counterparty side"). So our composer carries the same switch.
     THE DEFAULTS OPPOSE EACH OTHER ON PURPOSE: theirs opens on Send-to-them
     (answering is what their page is for), ours opens on Internal (the quiet
     path must not be the one that publishes a colleague's aside — the same
     rule negoPostComment states for the model). f84 pins our default. */
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
  /* Answering the counterparty IS reaching them: an accept settles their ask
     and travels on the next round. */
  const canAct = !opts.readonly && !held;
  /* Editing is not reaching them, and a reviewer correcting the wording is the
     thing this feature was built to allow. So `editable` keeps its own answer
     and only the SEND verbs below consult the posture. */
  const editable = !opts.readonly && opts.canEdit !== false;
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
  const changes = all.filter(x => (_rlIsLive(x) || heldIds.has(x.id) || contestedAny(x)
    || sentIds.has(x.id)) && !hidden.has(x.id)
    && (!mineOnly || mineOnly.has(String(x.id)))
    /* Whose asks the reader asked to see. The SAME predicate redlineCardIds
       applies, so the count above this list and the list itself cannot
       disagree — see rlCardFilterPass. */
    && rlCardFilterPass(x, side));
  /* Named on the module so the tab pill above reads the same answer — see
     redlineCardIds directly below. */
  /* Which of OUR asks have never left the building. The engine already answers
     this — the same count the wall and the batch send are drawn from — so the
     card's Send button and the toolbar's cannot disagree about what is unsent. */
  const unsent = Array.isArray(opts.unsentIds)
    ? new Set(opts.unsentIds)
    : new Set((window.negoUnsentAsks ? negoUnsentAsks(c, side) : []).map(x => x.id));
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
      <span>${opts.noAi
        ? `Press <b>${i18t('ng_direct_edit')}</b> under any clause to ask for different wording.`
        : `Under any clause, press <b>${i18t('ng_direct_edit')}</b> to type the wording yourself, or <b>&#10024; Copilot</b> to have it drafted for you.`} ${i18t('ng_each_ask_lands')}</span>
      ${settled ? `<span>${settled} change${settled === 1 ? ' has' : 's have'} already been decided — ${settled === 1 ? 'it is' : 'they are'} in the document and the round history, not here.</span>` : ''}
    </div>`;
  }
  /* Already narrowed, up where the list was built, by the same predicate the
     count above it uses. See rlCardFilterPass. */
  const shown = changes;
  return shown.map(ch => {
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
    const badge = heldHere ? (ch.status === 'accepted' ? ['ok', 'Accepted &middot; &#128274; held'] : ['no', 'Rejected &middot; &#128274; held'])
      : sentHere ? (ch.status === 'accepted' ? ['ok', 'Accepted &middot; sent'] : ['no', 'Rejected &middot; sent'])
      : contested ? ['no', !theirs ? 'Refused &middot; withdraw or revise' : 'Refused &middot; waiting on them']
      /* ---- ONE TAG, NOT TWO ----
         This badge and the review's own chip were both drawn, both ruby, both
         saying held — reported as "you are adding more and more tags which is
         also confusing" (Young, 09 Aug 2026). The card has ONE status slot and
         this is the card's status, so the badge keeps it and names who where
         the reader is entitled to the name; the chip stands down beside it. */
      : rvHeld ? ['no', '&#9209; ' + (rvHeldBy ? i18t('rv_badge_held_by', { who: rvHeldBy }) : i18t('rv_badge_held'))]
      : rvOut ? ['draft', '&#8987; ' + (rvOutNamed ? i18t('rv_badge_waiting_by', { who: rvOutNamed }) : i18t('rv_badge_waiting'))]
      : mineUnsent ? ['draft', '&#128274; Draft']
      : theirs ? ['sent', 'Awaiting you'] : ['sent', 'Sent'];
    /* The organisation is the AUTHOR's, not the viewer's. Written seat-relative
       ("theirs → counterparty, mine → us") this line flipped depending on who
       was reading it, so the counterparty's page attributed their own ask to
       the owner's organisation — and the two sides' cards could never match. */
    /* AND SAID ONCE. Where the person's name and their organisation are the
       same string — which is what a counterparty who filed under their own
       company name produces — this line printed it twice, so a card three
       lines tall spent one of them repeating itself. */
    const metaOrg = ch.authorSide === 'counterparty' ? (c.counterparty || 'counterparty') : (window.FIRST_PARTY || 'us');
    const metaBy = String(ch.by || ch.author || '').trim();
    const who = [ch.clauseLabel || ch.clauseId, metaBy, metaBy === metaOrg ? '' : metaOrg]
      .filter(Boolean).map(_ne).join(' &middot; ');
    /* The same tooltip the marked wording in the document carries, so hovering
       either one answers the same question with the same words. */
    /* The person who last MOVED the wording, which is the reviser where there is
       one. It used to read the author unconditionally and so claimed the
       original author had made a change somebody else made. */
    const lastBy = String((side !== 'counterparty' && ch.revisedBy) || ch.author || ch.by || '').trim();
    const tip = lastBy ? `Last updated by ${lastBy}` : '';
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
    const whyBlock = ch.why
      ? `<div class="rl-card-why"><span class="rl-card-why-k">${i18t('ng_why_they_asked')}</span><span class="nego-why-clamp">${_ne(ch.why)}</span></div>`
      : '';
    /* ---- AND WHO PUT IT THERE, WHEN THAT IS NOT WHO IT IS FROM ----
       An ask entered from this workspace wearing the counterparty's hat is
       recorded in their name — correctly, it IS their ask — but a card saying
       only that is a card claiming they sent it. The stamp is on the change
       itself (negoFileChange sets enteredBy), so it travels into the audit
       trail and the exports; this is it on the face of the card. */
    const behalfBlock = ch.enteredBy
      ? `<div class="rl-card-behalf" title="${i18t('ng_typed_on_behalf')}">`
        + `<span aria-hidden="true">&#9998;</span> ${i18t('ng_entered_by_on_behalf',{who:_ne(ch.enteredBy),author:_ne(ch.author)})}</div>`
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
      ? `<div class="rl-card-behalf" title="${_nea(i18t('ng_revised_title'))}">`
        + `<span aria-hidden="true">&#9998;</span> ${i18t('ng_revised_by_after',{who:_ne(ch.revisedBy),author:_ne(ch.author)})}</div>`
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
    if (canAct && theirs && ch.status === 'pending' && !heldHere){
      verbs.push(`<button class="rl-acc" data-nego-accept="${_ne(ch.id)}">${i18t('ng_accept')}</button>`);
      verbs.push(`<button class="rl-rej" data-nego-reject="${_ne(ch.id)}">${i18t('ng_reject')}</button>`);
    }
    if (editable && !heldHere) verbs.push(`<button class="rl-edit" data-rl-edit="${_nea(ch.clauseId)}" data-rl-edit-change="${_nea(ch.id)}"
        title="${i18t('ng_jump_to_clause')}">${i18t('act_edit')}</button>`);
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
        title="${_nea(i18t('rv_card_ask_title'))}">&#128100; ${i18t('rv_card_ask')}</button>`);
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
        title="${_nea(i18t('ng_sent_waiting_title',{who:c.counterparty || i18t('ng_the_counterparty')}))}">${i18t('ng_sent')}</button>`);
    /* ---- WHOSE ASK THIS IS, SAID ON THE CARD ----
       The status badge answers "where does this stand"; this one answers
       "who put it on the table", which the meta line said only in small
       print. Seat-relative like the verbs below it — "Your Ask" from the
       counterparty's chair means theirs — and the colours are fixed hex for
       the same reason the verbs' are: an origin that changes colour with the
       theme is an origin somebody misreads. */
    /* NOT a .rl-badge: that class is the card's one STATUS badge, and half
       the product (and its tests) reads the status by querying it — a second
       element wearing it would answer "Counterparty" to "where does this
       stand". Same clothes, its own name.

       The tooltip names the AUTHOR's organisation, not the record's
       counterparty field: on the portal the viewer IS c.counterparty, and
       "the other side" there is the sender — opts.org, which is what the
       portal passes. The badge label stays seat-relative ("Counterparty" =
       the other side of your table), like the verbs beneath it. */
    /* ---- NAMED, NOT SIDED ----
       This badge used to read "Counterparty" for the other side of the
       reader's table, which is correct from one chair and misleading from the
       other: "counterparty" is what BOTH parties call the party opposite them.
       On the counterparty's own page it therefore labelled the SENDER's ask
       with the word that reader uses for themselves — reported from the field
       as "why can I change a decision on my own ask?", when the card was in
       fact the owner's ask and the decision was theirs to change.

       So the badge names the organisation that actually wrote it. "Your ask"
       stays as it is, because the one party a reader can never mistake is
       themselves, and it is the same phrasing negoWhoseHtml settled on for the
       room's cards — one wording for one idea, across the product.

       originName is the AUTHOR's organisation on either seat and is read for
       the label as well as the tooltip, so the two can never disagree. Empty
       falls through to "Their ask" rather than to an apostrophe with nothing
       in front of it: a contract with no counterparty filled in is a real
       state, not a bug to render badly. */
    const originName = String(ch.authorSide === 'counterparty'
      ? (c.counterparty || '')
      : (opts.org || window.FIRST_PARTY || '')).trim();
    const originOrg = originName
      || (ch.authorSide === 'counterparty' ? 'the counterparty' : 'the other side');
    const theirLabel = originName ? `${originName}’s ask` : 'Their ask';
    const origin = theirs
      ? `<span class="rl-origin rl-origin-them" title="Proposed by ${_nea(originOrg)}${ch.by || ch.author ? ' — ' + _nea(ch.by || ch.author) : ''}">${_ne(theirLabel)}</span>`
      : `<span class="rl-origin rl-origin-us" title="${_nea(i18t('ng_proposed_by_your_side'))}${ch.by || ch.author ? ' — ' + _nea(ch.by || ch.author) : ''}">${i18t('ng_your_ask')}</span>`;
    /* Open or a line — see rlCardIsOpen. A collapsed card keeps its head and
       nothing else; the note and the verbs are what unfold. The caret is the
       only affordance saying there is more, so it is drawn on every card that
       can collapse rather than on hover. */
    const open = rlCardIsOpen(ch, verbs);
    /* THE BODY IS ALWAYS RENDERED, and hidden by CSS when the card is shut, so
       the open/shut flip costs one class rather than a rebuild of the column. */
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
      return `<div class="rl-card-why" style="border-left-color:var(--st-amber-line)">
        ${''/* rl-said-k, not the bare caption class: this line holds a PERSON'S
               NAME and capitals read as shouting. See the twin in negoDocHtml. */}
        <span class="rl-card-why-k rl-said-k">${i18t('rv_reviewer_said', { who: _ne(sayBy) })}</span>
        <span class="nego-why-clamp">${_ne(v.note)}</span></div>`;
    })();
    /* ---- AND IT SAYS WHAT IS HAPPENING ----
       A tag is a state, not an explanation. This is the sentence a reader needs
       when the Send button has gone: who stopped it, that only they can lift
       it, and the two things that can be done about it. */
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
    /* ---- THE CARD CARRIES THE WORDING AGAIN, AND THAT IS A REVERSAL ----
       It was taken off on the argument that the document beside it already
       shows the change, so a clamped copy on the card was the same words twice.
       True, and the card that was left read as a filing reference: an id, a
       clause number and four buttons, with nothing on it about the thing being
       decided. Restored on the design's call (Young, 10 Aug 2026).

       Two lines, clamped, marks and all — it is a summary you skim down the
       column, not a place to read a clause. The full wording in its own
       surroundings is one click away and always has been (rlLinkFocus). */
    const diff = (() => {
      const ops = rlOpsAsSide(ch.ops, rlReadSideOf(ch, rlReadMode()));
      if (window.redlineOpsHtml && Array.isArray(ops) && ops.length)
        return `<div class="rl-card-diff">${redlineOpsHtml(ops)}</div>`;
      const t = String(ch.proposedText || ch.newText || '').trim();
      return t ? `<div class="rl-card-diff">${_ne(t)}</div>` : '';
    })();
    const notes = rlCardNotesHtml(c, ch, opts, side);
    const body = `<div class="rl-card-body">${dkBy}${behalfBlock}${revisedBlock}${whyBlock}${rvNoteBlock}${rvStuckBlock}${
      verbs.length ? `<div class="rl-card-verbs">${verbs.join('')}</div>` : ''}${dkInstead}${
      window.reviewVerbsHtml ? reviewVerbsHtml(c, ch, opts) : ''}${notes}</div>`;
    const caret = `<button type="button" class="rl-caret${open ? ' rl-caret-open' : ''}"
        data-rl-caret="${_nea(ch.id)}" aria-expanded="${open ? 'true' : 'false'}"
        title="${open ? 'Collapse this card' : 'Open this card'}"
        aria-label="${open ? 'Collapse' : 'Open'} ${_nea(ch.id)}">&#9662;</button>`;
    return `<article class="rl-card${open ? '' : ' rl-card-shut'}" data-nego-card="${_ne(ch.id)}" data-rl-origin="${theirs ? 'them' : 'us'}"${
      (ch.status === 'rejected' && !ch.withdrawn) ? ` data-contested="${_ne(ch.id)}"` : ''}${
      heldHere ? ` data-unsent="${_ne(ch.id)}"` : ''}${
      rvOut ? ' data-rv-waiting="1"' : ''}${
      rvHeld ? ' data-rv-held="1"' : ''}${
      sentHere ? ` data-sent="${_ne(ch.id)}"` : ''}${
      ch.withdrawn ? ` data-withdrawn="${_ne(ch.id)}"` : ''} data-rl-open="${open ? '1' : '0'}"${
      ''/* What the reader's open/shut choice was made ABOUT. The choice no
             longer turns on it — see rlCardIsOpen — but it is what the tests
             and the wiring name the card's shape by, so it is still stamped. */
      } data-rl-state="${_nea(rlCardStateKey(verbs))}" tabindex="0">
      ${''/* ---- THE HEAD IS THE TOGGLE ----
             Wrapped, so the press that opens and shuts the card has an element
             of its own and the body underneath it has none. Everything in here
             is a LABEL — the id, whose ask it is, where it stands, what is
             being asked for — and everything below is a control. */}
      <div class="rl-card-head">
        <div class="rl-card-top"><span class="rl-card-lead"><span class="rl-card-id">${_ne(ch.id)}</span>${origin}${caret}</span>
          ${rvChip}<span class="rl-badge rl-badge-${badge[0]}">${badge[1]}</span>${
          ch.round ? `<span class="rl-card-round" title="${_nea(i18t('ng_proposed_in_round',{n:ch.round}))}">R${_ne(ch.round)}</span>` : ''}</div>
        <div class="rl-card-meta"${tip ? ` title="${_nea(tip)}"` : ''}>${who}</div>
        ${diff}
      </div>
      ${body}
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
        num: parsed.num || '', title: parsed.title || String(ch.clauseLabel || '').trim(),
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
  const min = rlQueueMin();
  return `<aside class="rl-col rl-queue${min ? ' is-min' : ''}" id="rl-queue" aria-label="${i18t('ng_this_rounds_queue')}">
    <div class="rl-q-head">
      <button type="button" id="rl-q-min" class="rl-q-min" aria-expanded="${min ? 'false' : 'true'}"
        title="${min ? "Show this round's queue" : "Minimise this round's queue"}">${
        _rlChev(min)}</button>
      <p class="rl-q-label">${i18t('ng_this_rounds_queue')}</p>
      <div class="rl-q-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
        aria-label="${_nea(i18t('ng_decided_round_aria',{done:p.done,total:p.total}))}"><span style="width:${pct}%"></span></div>
      <div class="rl-q-foot"><b>${p.done} of ${p.total}</b> ${i18t('ng_decided_this_round')}</div>
      ${''/* The folded rail's own read-out. Same two numbers, off the same
             progress object, so the rail and the open column can never
             disagree about how far through the round you are. */}
      <div class="rl-q-mini" aria-hidden="${min ? 'false' : 'true'}"><b>${p.done}</b><i>/</i><span>${p.total}</span></div>
    </div>
    <div class="rl-q-scroll">
      ${body}
      ${rows.length && note ? '<hr class="rl-q-split">' : ''}
      ${note}
    </div>
  </aside>`;
}
/* Folded or not. localStorage, per signed-in person, defaulting to open — a
   first-time reader must see the queue before they can decide they would
   rather not. */
const RL_QMIN_KEY = () => { const u = (typeof currentUser === 'function') ? currentUser() : null;
  return 'hati.v1.rlQueueMin.' + ((u && u.id) || 'anon'); };
function rlQueueMin(){ try{ return !!lsGet(RL_QMIN_KEY()); }catch(_){ return false; } }
function rlSetQueueMin(on){ try{ lsSet(RL_QMIN_KEY(), !!on); }catch(_){} }
const _rlChev = min => `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
  stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${
  min ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'}"/></svg>`;
/* The fold, applied without a repaint. Rebuilding the workbench to hide one
   column would throw away the reader's scroll position in the contract, which
   is the one thing they were holding on to. Class on the aside, class on the
   grid, and the resizer re-run because the split it placed was measured
   against a column that just changed width. */
function rlWireQueueMin(host){
  const scope = (host && host.querySelector) ? host : document;
  const btn = scope.querySelector('#rl-q-min');
  if (!btn || btn._wired) return;
  btn._wired = true;
  btn.addEventListener('click', () => {
    const on = !rlQueueMin();
    rlSetQueueMin(on);
    const q = scope.querySelector('#rl-queue'), grid = scope.querySelector('#rl-grid');
    if (q) q.classList.toggle('is-min', on);
    if (grid) grid.classList.toggle('q-min', on);
    btn.setAttribute('aria-expanded', on ? 'false' : 'true');
    btn.title = on ? "Show this round's queue" : "Minimise this round's queue";
    btn.innerHTML = _rlChev(on);
    const mini = scope.querySelector('.rl-q-mini');
    if (mini) mini.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (window.rlLayoutResizer) rlLayoutResizer(host);
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

           What is left in this slot is the WALL LINE, which is not news: on the
           counterparty's page it is the sentence explaining that their
           decisions stay on the page until they press Send, and it belongs
           where they will read it before they start. */
      }${opts.bannerHtml != null ? opts.bannerHtml : redlineWallHtml(c, opts)}${
      ''/* THE SET-ONCE EMAIL STRIP USED TO SIT HERE, and it was the last full
           width band between the top of this page and the first word of the
           contract. The address is a fact about the counterparty, so it is a
           Key terms row now — asked where their name is asked, not across a
           working surface. Nothing about sending changed: the dialog still
           collects an address at send time for a contract that has none. */
    }${window.negoReadySignalHtml ? negoReadySignalHtml(c, opts) : ''}</div>
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
    <div class="rl-grid nego-work has-queue${rlQueueMin() ? ' q-min' : ''}" id="rl-grid" style="--nego-f:1;--nego-c:320px">
      <!-- THE QUEUE COMES FIRST because it is read first: what to answer next,
           then the wording, then the change record. It is a grid column rather
           than an overlay so it scrolls and stacks with the panes instead of
           floating over the contract. -->
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
        <div class="nego-scroll" id="nego-scroll-work">${redlineDocHtml(c, opts)}</div>
      </section>

      <div id="rl-resizer" class="rl-resizer" role="separator" aria-orientation="vertical"
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
      <aside class="rl-col rl-side" id="rl-side" aria-label="${_nea(i18t('ng_tracked_changes'))}">
        <div class="nego-pane index" id="rl-changes-col" aria-label="${i18t('ng_tracked_changes')}">
          <div class="nego-index-head rl-idx-head">
          <span class="rl-idx-k">${i18t('ng_tracked_changes_head')}</span>
          <span class="rl-idx-n${changeTotal ? ' is-live' : ''}" id="rl-chg-count-wrap">${i18t('ng_on_the_table',{n:changeTotal})}</span>
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
          ${rlMyCardIds(c, opts) ? '' : (() => {
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
            return `<div class="rl-fsegwrap" role="group" aria-label="${_nea(i18t('ng_filter_group'))}">${
              RL_CARD_FILTERS.map(([k, key]) => `<button type="button" data-rl-cardfilter="${k}"
                class="rl-fseg${rlCardFilter() === k ? ' on' : ''}" aria-pressed="${rlCardFilter() === k ? 'true' : 'false'}"
                title="${_nea(i18t(tip[k], { who: c.counterparty || i18t('ng_the_counterparty') }))}">${
                _ne(i18t(key))}<span class="rl-fseg-n">${n(k)}</span></button>`).join('')}</div>`;
          })()}
          ${''/* kept for the engine's wiring and the header proxies; the design
                 carries these controls in the page header instead */}
          <span class="nego-count" id="nego-count" hidden>${p.pending || p.total}</span>
          <span class="rl-tab-n" id="rl-chg-count" hidden>${changeTotal}</span>
          <span class="rl-tab-n" id="rl-rail-count" hidden>${threadTotal}</span>
          <button class="nego-fold" id="nego-fold" hidden>${i18t('ng_hide')}</button>
          <div class="nego-track" hidden><div class="nego-fill" id="nego-fill" style="width:${p.pct}%"></div></div>
          <div id="nego-progress" hidden>${i18t('ng_resolved_short',{done:p.done,total:p.total})}</div>
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
          <div class="nego-index-scroll rl-cards" id="nego-cards">${negoLinkedBarHtml()}<div id="rl-changes">${redlineChangeCardsHtml(c, opts)}</div></div>
        </div>
      </aside>
    </div>
    ${''/* OVER THE PAGE, NOT ABOVE IT — see rlFloatingNoticesHtml. Last in the
           markup and position:fixed, so it floats clear of the grid rather than
           taking a row from it. */}
    ${rlFloatingNoticesHtml(c, opts)}
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
  renderRedline, redlineRoundLabel, redlineLayoutCss, redlineSyncProxies,
  rlToggleDiscussion, rlSideMode, rlSetSideMode, rlLayoutResizer, rlWireResizer, rlWireClauseTools,
  rlDocType, rlSetDocType, rlTypeStepHtml, rlWireTypeStep,
  rlFocusOn, rlSetFocus, rlResetFocus, rlWireFocusKey, rlPaintFocusBtn,
  rlFitTabRow, rlWireFitTabRow, rlObserveTabRow,
  redlineHeldId, redlineEvict, openRedlineWorkbench, RL_DEMOTABLE,
  rlOwnerOpenActions, rlOwnerOpenTotal, rlJumpHtml,
  rlPbFindClause, rlPlaybookProposals, rlFilePlaybookProposal, rlOpenPlaybookReview,
  rlHiddenFrom, rlMsgVisible, redlineEmbed, negoIsRedeciding,
  RL_CARD_FILTERS, rlCardFilter, rlSetCardFilter, rlCardFilterPass,
  RL_SEL_ACTIONS, RL_PLACEMENT_NOTE, rlSelActions, rlSelMenu, rlAiPropose, rlStandardAction,
  redlineCardIds, rlOneNoticeHtml, rlFloatingNoticesHtml, rlNoticesFolded, rlSetNoticesFolded,
  rlJumpToClause, rlLinkFocus, rlDeltaOps, rlSayInPanel,
  rlCardIsOpen, rlCardSetOpen, rlCardNeedsYou, rlCardStateKey, rlCardUnpinAll,
  rlCardForgetPins, rlCardOpenState,
  rlQueueRows, rlQueueHtml, rlQueueWord, rlQueueSelect, rlQueueSelected, rlQueueMark,
  rlRestoreScroll,
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
  negoStyleHtml, negoEnsureStyle, negoDocHtml, negoCardsHtml, negoStatusHtml, negoHeadHtml, negoReadyHtml,
  negoTabHtml, renderNegotiationTab, wireNegotiationTab, negoFocus, negoResetView, negoDomId,
  negoPanesHtml, negoRoomHtml, negoRoomActionsHtml, negoLayout, negoSetLayout, wireNegoLayout,
  negoHistoryHtml, negoHistoryCardHtml, negoConfirmCloseRound, negoWhoseHtml,
  negoIndexSendHtml, negoNameFieldHtml, negoRememberedName, negoRememberName, negoWireNameMemory, NEGO_NAME_KEY, negoReadySignalHtml, negoRoomHasExit, negoPick,
  negoRoomBannerHtml, negoClosedBannerHtml, negoNumberingNoticeHtml,
  negoRenumberPreviewHtml, negoRenumberOpen,
  negoTimelineScreenHtml, negoTimelineEventHtml, openHistoryTimeline,
  negoVerifyResultHtml, negoHistoryExportHtml, negoHistoryExportRun, negoHistoryPrintRun,
  openNegotiationRoom, closeNegotiationRoom, negoRoomContract, negoRoomIsOpen,
  negoComparePair, negoSetComparePair, negoPaneSelectHtml, negoCompareDocHtml,
  negoCleanView, negoSetCleanView, negoCleanDocHtml, negoCleanBarHtml,
  negoRichBody, negoFlatBody,
  negoSeenKey, negoSeenScope, negoThreadSeenAt, negoMarkThreadSeen,
  NEGO_F0, NEGO_C0, NEGO_LAYOUT_KEY });
