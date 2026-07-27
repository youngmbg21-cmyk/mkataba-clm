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
  .nego-tbtn:disabled{opacity:.45;cursor:not-allowed;filter:none}
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
  .nego-clause p{margin:0}
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
  .nego-tools{display:flex;justify-content:flex-end;gap:4px;margin-bottom:7px}
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
  .nego-acts .b-undo{border-color:#c9d5e1;color:var(--n-ink-soft);flex:0 0 auto;padding:6px 12px}
  .nego-acts .b-undo:hover{background:#f2f4f7}
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
  .nego-tlabel{font-size:10px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;
    color:var(--n-ink-soft);margin-bottom:7px}
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

  @media (prefers-reduced-motion:reduce){
    .nego-scroll,.nego-index-scroll{scroll-behavior:auto}
    .nego-room *,#nego-root *{transition:none !important;animation:none !important}
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
  const tools = cl => editable ? `<div class="nego-tools">
      <button class="nego-tool" data-nego-edit="${_ne(cl.clauseId)}" title="Edit this clause">Edit</button>
      <button class="nego-tool" data-nego-add-after="${_ne(cl.clauseId)}" title="Add a clause after this one">Add clause</button>
      <button class="nego-tool danger" data-nego-del="${_ne(cl.clauseId)}" title="Propose deleting this clause">Delete</button>
    </div>` : '';

  const clauseBlock = (cl, ch, domPrefix) => {
    if (baseline || !ch)
      return `<div class="nego-clause" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}">
        ${tools(cl)}${head(cl) ? `<h2>${head(cl)}</h2>` : ''}<p>${_ne(cl.text)}</p></div>`;

    let inner, badgeCls = '', badgeSuffix = '', note = '';
    if (ch.status === 'pending'){
      /* A proposed DELETION strikes the clause through whole and leaves every
         word of it on the page. The text is not removed until the deletion is
         accepted — a document that quietly loses a clause while someone is
         still deciding about it is the failure this rule exists to prevent. */
      inner = ch.changeType === 'deleteClause'
        ? `<span class="nego-del">${_ne(cl.text)}</span>`
        : redline(ch);
    } else if (ch.status === 'accepted'){
      inner = ch.changeType === 'deleteClause'
        ? `<span class="nego-del">${_ne(cl.text)}</span>`
        : resolvedHtml(ch);
      badgeCls = 'is-accepted'; badgeSuffix = ' ✓';
      note = ch.changeType === 'deleteClause'
        ? `<span class="nego-note ok">Accepted — clause removed</span>`
        : `<span class="nego-note ok">Accepted</span>`;
    } else {
      inner = _ne(cl.text);                          // the baseline, verbatim
      badgeCls = 'is-rejected'; badgeSuffix = ' ✕';
      note = `<span class="nego-note no">Rejected — baseline kept</span>`;
    }
    const active = _negoActive === ch.id;
    const flag = ch.needsReview
      ? `<span class="nego-note no" title="${_ne(ch.needsReviewWhy || '')}">Needs review</span>` : '';
    return `<div class="nego-clause${active ? ' is-active' : ''}" id="${domPrefix}-${negoDomId(cl.clauseId)}" data-clause="${_ne(cl.clauseId)}" data-change="${_ne(ch.id)}">
      ${tools(cl)}<button class="nego-badge${active && !badgeCls ? ' is-active' : ''}${badgeCls ? ' ' + badgeCls : ''}"
        data-badge="${_ne(ch.id)}" title="${_ne(ch.hash || '')}" aria-label="Change ${_ne(ch.id)}, ${_ne(ch.status)}">#${_ne(ch.id)}${badgeSuffix}</button>
      ${head(cl) ? `<h2>${head(cl)}${note}${flag}</h2>` : (note + flag)}<p>${inner}</p></div>`;
  };

  const insertBlock = ch => {
    const active = _negoActive === ch.id;
    const cls = ch.status === 'accepted' ? 'is-accepted' : ch.status === 'rejected' ? 'is-rejected' : (active ? 'is-active' : '');
    const sfx = ch.status === 'accepted' ? ' ✓' : ch.status === 'rejected' ? ' ✕' : '';
    const inner = ch.status === 'rejected'
      ? `<span class="nego-del">${_ne(ch.newText)}</span>`
      : ch.status === 'accepted' ? resolvedHtml(ch)
      : `<span class="nego-ins">${_ne(ch.newText)}</span>`;
    const note = ch.status === 'accepted' ? `<span class="nego-note ok">Accepted — clause added</span>`
      : ch.status === 'rejected' ? `<span class="nego-note no">Rejected — not added</span>` : '';
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
  const changes = negoChanges(c).filter(x => x.status !== 'superseded');
  if (!changes.length) return `
    <div style="padding:18px 6px;font-size:12px;line-height:1.6;color:var(--n-ink-soft)">
      <b style="display:block;color:var(--n-ink);margin-bottom:4px">No changes on the table.</b>
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
          : `<div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:8px">No comments yet — start the thread. It stays attached to this fingerprint.</div>`}
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
          ${negoVerifyPill(c, ch)}
          <span class="nego-st ${_ne(ch.status)}">${_ne(ch.status)}</span>
        </div>
        <div style="font-size:12.5px;font-weight:600;line-height:1.45;margin-bottom:4px">${_ne(ch.summary)}</div>
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">${_ne(ch.clauseLabel || ch.clauseId)}</div>
        <div style="font-size:11px;color:var(--n-ink-soft);margin-bottom:7px">Author: <b style="color:var(--n-ink);font-weight:600">${_ne(ch.author)}</b>${mine ? ' <span style="font-style:italic">(your side)</span>' : ''}</div>
        ${ch.note ? `<div style="border-left:2px solid var(--n-slate-soft);background:var(--n-badge-bg);border-radius:0 4px 4px 0;padding:6px 9px;margin-bottom:8px">
          <span style="display:block;font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--n-slate)">Why they asked</span>
          <span style="font-size:11.5px;line-height:1.5;color:var(--n-ink)">${_ne(ch.note)}</span></div>` : ''}
        ${ch.reply ? `<div style="border-left:2px solid var(--n-line);padding:6px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.5;color:var(--n-ink)"><b>Reply:</b> ${_ne(ch.reply)}</div>` : ''}
        <div class="nego-hash" title="${_ne(ch.hash || '')}"><span aria-hidden="true">🔒</span> SHA-256: ${_ne(negoShortHash(ch.hash))}</div>
        ${acts}${thread}
      </div>`;
  }).join('');
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
  const opts = window.negoVersionOptions ? negoVersionOptions(c) : [];
  return `<select class="nego-vsel" data-nego-vsel="${which}" aria-label="${which === 'left' ? 'Left' : 'Right'} pane version">
    ${opts.map(o => `<option value="${_ne(o.key)}"${o.key === current ? ' selected' : ''}>${_ne(o.label)}</option>`).join('')}
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
  const ready = negoReadyToSign(c);
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
  return `
    <div id="nego-ready" style="flex:none;display:flex;align-items:center;gap:12px;flex-wrap:wrap;
      border:1px solid #a8cbb8;background:#eef7f1;border-left:4px solid #1e6b4d;border-radius:6px;
      padding:12px 16px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#14503a">Ready to sign — every change is resolved</span>
        <span style="display:block;font-size:11.5px;color:var(--n-ink-soft);margin-top:1px">All ${p.total} change${p.total === 1 ? '' : 's'} on the table ${p.total === 1 ? 'has' : 'have'} an answer${accepted ? ` · ${accepted} adopted into the wording` : ''}. Nothing is outstanding between the parties.</span>
      </span>
      ${side === 'owner'
        ? `<button id="nego-to-docs" class="ui-btn ui-btn-primary" style="flex:none;font-size:12px;padding:7px 14px">Send to Docs tab for signature</button>`
        : `<span style="flex:none;font-size:11.5px;color:var(--n-ink-soft)">${_ne((window.FIRST_PARTY || 'The other side'))} will send it for signature.</span>`}
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
    ${mine && !opts.readonly
      ? `<button id="nego-send" class="ui-btn ui-btn-primary" style="flex:none;font-size:12px;padding:6px 13px">Send to ${_ne(side === 'owner' ? (c.counterparty || 'the counterparty') : (window.FIRST_PARTY || 'the owner'))}</button>`
      : ''}
  </div>`;
}

/* ---------- the whole tab ---------- */
/* ---------- the workbench ----------
   The three panes and the two dividers between them, shared by the room and by
   the embedded mode so there is exactly one of these to get right. Labels are
   the prototype's own words. */
function negoPanesHtml(c, opts = {}){
  const p = negoProgress(c);
  const canAct = !opts.readonly;
  const L = negoLayout();
  const pair = negoComparePair();
  const cmp = window.negoCompareVersions ? negoCompareVersions(c, pair.left, pair.right) : null;
  return `<div class="nego-work${L.idxOff ? ' idx-off' : ''}" id="nego-work"
      style="--nego-f:${L.f};--nego-c:${L.c}px">

    <section class="nego-pane baseline" aria-label="Original baseline, read-only">
      <div class="nego-pane-head">${negoPaneSelectHtml(c, 'left', pair.left)}<span class="nego-sub">read-only reference</span></div>
      <div class="nego-scroll" id="nego-scroll-base">${cmp && !cmp.live
        ? negoCompareDocHtml(c, cmp, 'left')
        : negoDocHtml(c, { ...opts, baseline: true })}</div>
    </section>

    <div class="nego-rz nego-rz-a" id="nego-rz-a" role="separator" aria-orientation="vertical"
      aria-label="Drag to resize the baseline and working panes · double-click to reset"
      title="Drag to resize · double-click to reset"></div>

    <section class="nego-pane working" aria-label="Working version with the proposed redline">
      <div class="nego-pane-head">${negoPaneSelectHtml(c, 'right', pair.right)}<span class="nego-sub">${cmp && !cmp.live
        ? '— read-only comparison' : '— Proposed Redline · fingerprints anchor in the margin'}</span></div>
      <div class="nego-scroll" id="nego-scroll-work">${cmp && !cmp.live
        ? negoCompareDocHtml(c, cmp, 'right')
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
        </div>` : ''}`}
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
       be. Everything needed to read, judge, propose and answer is here. */
    const n = (opts.pendingDecisions || 0);
    return `
      ${n ? `<button class="nego-tbtn acc" id="nego-send-decisions">Send ${n} decision${n === 1 ? '' : 's'}</button>` : ''}
      ${canAct ? `<button class="nego-tbtn ghost" id="nego-cp-accept">Accept wording</button>` : ''}
      ${canAct ? `<button class="nego-tbtn ghost" id="nego-cp-decline">Decline</button>` : ''}
      ${canAct ? `<button class="nego-tbtn acc" id="nego-cp-sign">Approve &amp; sign</button>` : ''}
`;
  }
  return `
    <button class="nego-tbtn ghost" id="nego-save-draft">Save Draft</button>
    <button class="nego-tbtn ghost" id="nego-share-link">Share Link</button>
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
  const ready = negoReadyToSign(c);
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
        <button class="nego-exit" id="nego-exit" title="Leave the negotiation room and go back to the Doc page (Esc)">
          <span aria-hidden="true">←</span> Doc
        </button>
        <span class="sep" aria-hidden="true">›</span>
        <span class="path">${side === 'counterparty' ? '' : 'Contract Workspace '}${_ne(path)}</span>
        <span class="draft-chip">${_ne(statusChip)}</span>
      </nav>
      <div class="nego-top-actions">
        ${negoRoomActionsHtml(c, opts)}
        <div class="nego-avatar" title="${_ne(who || org)}">${_ne(initials)}</div>
      </div>
    </header>
    ${ready ? negoReadyHtml(c, opts) : ''}
    <div style="padding:0 14px">${negoTurnBannerHtml(c, opts)}</div>
    ${negoCompareBarHtml(c)}
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
  const work = document.getElementById('nego-work');
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
  drag(document.getElementById('nego-rz-a'),
    (dx, start, box) => {
      const docs = Math.max(1, box.width - negoLayout().c - 12);
      negoSetLayout({ f: start.f + dx / docs });
    },
    () => negoSetLayout({ f: NEGO_F0 }));
  drag(document.getElementById('nego-rz-b'),
    (dx, start) => negoSetLayout({ c: start.c - dx }),   // drag left widens the index
    () => negoSetLayout({ c: NEGO_C0 }));

  const refold = () => { if (opts.rerender) opts.rerender(); };
  document.getElementById('nego-fold')?.addEventListener('click', () => { negoSetLayout({ idxOff: true }); refold(); });
  document.getElementById('nego-unfold')?.addEventListener('click', () => { negoSetLayout({ idxOff: false }); refold(); });
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
  if (shell && !_negoRoomOpen){ shell.dataset.negoHidden = '1'; shell.classList.add('hidden'); }
  _negoRoomOpen = true;
  _negoRoomC = c;
  document.body.classList.add('nego-room-open');
  host.innerHTML = negoRoomHtml(c, opts);
  const rerender = () => openNegotiationRoom(c, opts);
  wireNegotiationTab(c, { ...opts, hostId: 'nego-room-root', rerender });
  wireNegoLayout({ rerender });
  document.getElementById('nego-exit')?.addEventListener('click', () => closeNegotiationRoom(opts));
  document.getElementById('nego-save-draft')?.addEventListener('click', () => {
    if (opts.onSaveDraft) opts.onSaveDraft(c);
    else if (window.toast) toast('Saving is not available on this screen', 'err');
  });
  document.getElementById('nego-share-link')?.addEventListener('click', () => {
    if (opts.onShareLink) opts.onShareLink(c, {});
    else if (window.toast) toast('Sharing is not available on this screen', 'err');
  });
  /* The counterparty's verbs. Each one hands back to the page that owns it —
     the room renders them, it does not implement signing or declining. */
  for (const [id, hook] of [['nego-cp-sign', 'onSign'], ['nego-cp-accept', 'onAcceptWording'],
    ['nego-cp-decline', 'onDecline'],
    ['nego-send-decisions', 'onSendDecisions']]){
    document.getElementById(id)?.addEventListener('click', () => {
      if (typeof opts[hook] === 'function') opts[hook](c);
      else if (window.toast) toast('That action is not available on this screen', 'err');
    });
  }
  if (!_negoEscHandler){
    _negoEscHandler = e => { if (e.key === 'Escape' && _negoRoomOpen) closeNegotiationRoom(opts); };
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
  const root = document.getElementById('nego-root') || document.getElementById('nego-room');
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
    _negoActive = id;
    if (opts.persist !== false && window.persist) persist(c);
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
  /* A comparison row scrolls both panes to the clause, which is the only verb
     this mode has. */
  host.querySelectorAll('[data-nego-cmp-row]').forEach(row => {
    const go = () => {
      const id = row.getAttribute('data-nego-cmp-row');
      for (const prefix of ['nb-', 'nw-']){
        const el = document.getElementById(prefix + negoDomId(id));
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
    const body = block.querySelector('p');
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

  host.querySelectorAll('[data-nego-add-after]').forEach(b => b.addEventListener('click', async e => {
    e.stopPropagation();
    const afterId = b.getAttribute('data-nego-add-after');
    let heading = '';
    if (window.promptDialog){
      heading = await promptDialog({ title: 'Add a clause',
        message: 'It is inserted after the clause you clicked, and travels to the other side as a proposal.',
        label: 'Clause heading', placeholder: 'e.g. Clause 7 · Force Majeure',
        confirmLabel: 'Add clause' });
      if (heading == null) return;
    }
    let body = '';
    if (window.promptDialog){
      body = await promptDialog({ title: 'The clause wording',
        message: 'What the new clause says.', label: 'Wording',
        placeholder: 'Neither party shall be liable for failure to perform caused by…',
        confirmLabel: 'Add clause' });
      if (body == null) return;
    }
    if (!String(body).trim()){ if (window.toast) toast('A new clause needs wording', 'err'); return; }
    fileAndRepaint(() => negoInsertClause(c, afterId,
      { headingText: String(heading || '').trim(), bodyHtml: `<p>${_ne(String(body).trim())}</p>` },
      { side, author: opts.by }),
      ch => `#${ch.id} filed — new clause proposed`);
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
function negoResetView(){ _negoActive = null; _negoThreads = {}; negoSetComparePair('baseline', 'working'); }

if (typeof window !== 'undefined') Object.assign(window, {
  negoStyleHtml, negoEnsureStyle, negoDocHtml, negoCardsHtml, negoStatusHtml, negoHeadHtml, negoReadyHtml,
  negoTabHtml, renderNegotiationTab, wireNegotiationTab, negoFocus, negoResetView, negoDomId,
  negoPanesHtml, negoRoomHtml, negoRoomActionsHtml, negoLayout, negoSetLayout, wireNegoLayout,
  openNegotiationRoom, closeNegotiationRoom, negoRoomContract, negoRoomIsOpen,
  negoComparePair, negoSetComparePair, negoPaneSelectHtml, negoCompareDocHtml,
  NEGO_F0, NEGO_C0, NEGO_LAYOUT_KEY });
