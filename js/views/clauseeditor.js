/* ============================================================================
   THE CLAUSE EDITOR — a PAGE about one clause (owner-approved prototype,
   25 Aug 2026: "The Clause Journey")
   ----------------------------------------------------------------------------
   The clause panel already answers "what does this clause say and what is on
   the table". Its two acts answer "change it": PROPOSE NEW WORDING opens the
   engine's own inline editor in the panel — untouched — and EDIT WITH COPILOT
   used to hand the clause to the side Copilot drawer, which is a chat about a
   clause you cannot see. It opens THIS page instead.

   THE SHAPE, and every part of it was chosen against a render the owner
   approved rather than by eye:

     · The whole window goes to one clause. The nav column and the shell bar
       step out while you are here and come back when you leave — by being
       COVERED, not dismantled. The approved render moves the shell's own brand
       and controls into this page's two bars; that is a live DOM move of
       elements other renderers repaint, for a result a reader cannot tell from
       an opaque cover, and it is deliberately not taken. See the stylesheet's
       own note for the z-index that settles what goes over what.
     · LEFT, stacked: the wording AS IT STANDS, and under it the wording being
       PROPOSED, marked against it. The redline between them is COMPUTED from
       the two texts by js/redline.js — the product's own engine, the same one
       that files the ops — so whatever put the wording there (the Copilot, the
       playbook, or somebody typing) the marks are worked out one way.
     · RIGHT, a third of the window: Copilot, or the playbook scan for the same
       clause in the same card shape. Both hand wording to the same APPLY.
     · APPLY IS THE ONLY THING THAT MOVES THE LOWER BOX, and it moves it into
       the box — never into the contract. Nothing here files anything until the
       one act in the rail's foot is pressed.

   WHAT THIS PAGE DOES NOT DO, said out loud because each is a rule it inherits
   rather than an omission:

     · It files through negoEditClause and nothing else — the same funnel, the
       same fingerprint, the same desk rule, the same review gate. A suggestion
       that arrived from a model is not a different KIND of change.
     · It asks HaTi'S OWN REASON QUESTION, in HaTi's own words, with HaTi's own
       Skip. The prototype refused a blank reason; the product has always
       allowed one to be skipped deliberately (see the two-step note in
       js/views/negotiation.js), and one page refusing what every other page
       permits is a second rule wearing the first one's clothes.
     · It is the OWNER'S SEAT ONLY. The counterparty's page is unchanged, as
       agreed. rlOpenClauseEditor refuses a counterparty seat, a read-only mount
       and a contract whose wording has frozen.
     · It draws no phone layout. Below the width where two columns stop making
       sense the door is not offered at all — a page that cannot be used is
       worse than a page that is not there.
   ========================================================================== */

/* ---------- ESCAPING ----------
   Its own, because the negotiation view's _ne/_nea are module-local to that
   file and this one may be loaded without it (the browser harnesses build
   their own script lists — see the note in CLAUDE.md about a new file in
   js/views/). */
const _cee = s => String(s == null ? '' : s)
  .replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
const _ceea = s => _cee(s).replace(/"/g, '&quot;');
const _cet = (k, v) => (typeof window !== 'undefined' && window.i18t) ? i18t(k, v) : k;
const _cetn = (k, n, v) => (typeof window !== 'undefined' && window.i18tn) ? i18tn(k, n, v) : k;

/* ---------- STATE ----------
   Per sitting, in memory. Nothing here is persisted: an editor that reopened
   itself on a reload would put a page over a contract nobody asked to see. */
let _ceC = null;            /* the contract */
let _ceClauseId = null;     /* which clause — null means the page is shut */
let _ceOpts = null;         /* the mount's opts, so filing carries the same author */
let _ceAgain = null;        /* the caller's repaint */
/* ---- THE READING IS THE PRODUCT'S, NOT THIS PAGE'S ----
   rlReadMode is one value for the whole product and this page is the third
   surface to draw it, which is right: it is the same contract and a reader who
   asks to see it clean means it. The cost is that the negotiation page
   UNDERNEATH does not repaint while this page is over it — and rlSetReadMode
   does repaint its tab row, so left alone the reader would come back to a page
   whose tabs said "As agreed" over a document still carrying its marks. That is
   precisely the fault the reading notice was written for: a document silently
   disagreeing with the control above it.
   So the reading at OPEN is remembered, and closing repaints the page below
   only when it actually moved. */
let _ceRead0 = null;
let _ceBase = '';           /* the wording AS IT STANDS (negoClauseNowById) */
let _ceText = '';           /* the wording being proposed */
let _ceSteps = [];          /* [{label, text}] — Apply stacks, Undo steps back */
let _ceStep = 0;
/* ---- IS THE CLAUSE BEING TYPED IN RIGHT NOW ----
   The two-way Redlines|Edit toggle this replaces was a reading of a BOX; with
   the paper in its place there are two different questions and they need two
   different answers. How the whole DOCUMENT is drawn is rlReadMode — the
   product's own three readings, shared with the negotiation page. Whether the
   one clause you came in on is typeable is this, and the control for it is the
   pencil already on that clause. */
let _ceEditing = false;
let _ceTab = 'chat';        /* chat | scan */
let _ceThread = [];         /* the conversation, this sitting only */
let _ceBusy = false;
let _ceSavedAt = null;
let _ceScan = null;         /* the playbook review, once run */
let _ceScanBusy = false;
/* ---- A SCAN THAT COMES BACK WITH NOTHING SAYS SO WHERE THE READER IS LOOKING
   (owner-asked 26 Aug 2026: "you should be able to run the playbook scan by
   pressing the highlighted button") ----
   The button was wired and DOES run — proved by pressing it on an ordinary
   contract. What it could not do was fail out loud: runPlaybookReview answers
   null where there is no readable wording (an upload whose text never came out
   of the file, which is the commonest shape on this screen), toasts a red line
   that fades, and this panel then redrew the SAME "not been checked yet"
   sentence and the SAME button. Nothing on screen had moved, which is exactly
   what a dead press looks like.
   THE RENEWAL CARD ANSWERED THIS EXACT SHAPE ALREADY, in its own words: a
   failure states itself where the reader is looking rather than relying on a
   toast that has already faded. This is _renewalAdviceError for the scan —
   written by the one runner, cleared the moment a review arrives. */
let _ceScanErr = null;
let _ceSayTimer = null;
let _ceSel = null;          /* the passage being rewritten in place */
let _ceLead = null;         /* the change this editor opened on, if any */

const clauseEditorOpen = () => !!_ceClauseId;
const clauseEditorClauseId = () => _ceClauseId;
const clauseEditorContract = () => _ceC;
/* ---- IS THERE UNFINISHED WORK IN HERE (owner-asked 26 Aug 2026, L-6) ----
   The shell asks this before it takes the page down on a navigation, so a
   half-written clause is never thrown away silently — and with nothing typed
   it answers false and the page closes without a word, because a guard that
   fires on an untouched editor is one everybody learns to click through.

   IT IS NOT THE FOOT'S OWN READING, and the difference cost an hour. The foot
   enables Discard and File on `_ceText !== _ceBase` — has the wording moved
   from what STANDS in the contract — which is right for those two buttons and
   wrong for this question: opening the editor on a clause that already carries
   an ask seeds the box with that ask's wording, so `moved` is TRUE from the
   first frame. Written that way the guard fired on every clean open, the nav
   press raised a confirm nobody had earned, and pressing Home appeared to do
   nothing at all — the very fault this was built to fix, in new clothes.

   THE QUESTION IS "HAS THE READER CHANGED ANYTHING SINCE IT OPENED", so it is
   measured against the text it opened WITH. Applying twice and stepping back
   twice lands on that text again and is honestly not dirty. */
let _ceOpenText = '';
const clauseEditorDirty = () => clauseEditorOpen() && _ceText !== _ceOpenText;

/* ============================================================================
   THE STYLESHEET
   ----------------------------------------------------------------------------
   Written from the approved render, in HaTi's OWN tokens throughout — every
   colour here answers differently under html.dark because the token does, so
   there is no second palette to keep in step. Two rules the product already
   holds are kept: square corners (the 20 Aug sweep), and one filled act.

   THE PAGE COVERS THE SHELL, it does not dismantle it. The prototype moved the
   shell's own brand and controls into this page's two bars; that is a live DOM
   move of elements other renderers repaint, for a result a reader cannot tell
   from an opaque cover. So this is a fixed layer at z-index 55: above the
   Copilot drawer and the activity panel, BELOW the toast root and modal-root,
   so a confirm dialog and every refusal still land on top of it.

   Note for whoever edits this next: this function returns CSS from a template
   literal, so a backtick anywhere in it — including in a comment — ends the
   string. Say "terminator" rather than spelling one out.
   ========================================================================== */
function clauseEditorCss(){
  return `<style id="ce-style">
  ${''/* ---- IT COVERS THE PAGE, NOT THE SHELL (owner-asked 25 Aug 2026, off a
         screenshot with the nav column and the top bar ringed: "the highlighted
         bars (nav panel and the top panel) have to be on screen when you are in
         the editing with copilot") ----
         THIS REVERSES "the nav column and the shell bar step out while you are
         here", and only that half of it: the render's own move of the shell's
         brand and controls INTO this page is still not taken, for the reason
         written above — it is a live DOM move of elements other renderers
         repaint. What changes is where the cover starts. MEASURED before:
         fixed at 0,0 over the whole 1500x1000 window, and probing the middle
         of the shell bar and of the nav column returned this page's own
         content, so both really were hidden rather than merely overdrawn.
         THE BOX IS MEASURED, NEVER TYPED — ceFitToShell reads #content-scroll's
         own rect and writes it here. The nav has three states (240px column,
         64px rail, and a floating layer below 1440), so a typed inset would be
         right in one of them and wrong in the other two; the scroller is the
         one element that already answers for all three.
         z-index 54, DOWN FROM 55, and that is what lets the floating nav drawer
         open OVER this page rather than under it — #side-nav is 55 below the
         float line and this page is later in the document, so at equal weight
         it would have won. Still above the Copilot drawer (50) and the activity
         panel (46), and still below modal-root and the toasts. */}
  #clause-editor{position:fixed; inset:0; z-index:54; display:flex; flex-direction:column;
    background:var(--color-bg); color:var(--color-text);
    font-family:var(--font-body, inherit)}
  #clause-editor[hidden]{display:none}
  #clause-editor *{box-sizing:border-box}
  #clause-editor button{cursor:pointer; font-family:inherit}
  #clause-editor button:disabled{cursor:default}

  /* ---- the object header: a crumb, the clause, four facts ----
     IT IS THE CONTRACT ROOM'S HEAD, and it wears that head's OWN CLASSES rather
     than a second set that agrees today (owner-asked 25 Aug 2026, off two
     screenshots: "the same exact design ... including the font sizes"). So
     .room-head, .room-id, .room-name, its h1, .room-sub, .room-facts,
     .room-facets and .room-facet's .l/.v are all doing the dressing, from
     index.html, unscoped — there is nothing here to keep in step with them and
     nothing that can drift. What is below is only the parts this page has that
     the room's head does not: the clause picker, the status mark, the passing
     message and the way back.

     THE COLLAPSE CONTROL IS GONE (same ask, "remove the collapse feature
     entirely"): .ce-fold, .ce-ohwrap and the is-folded rule are deleted rather
     than hidden. */
  .ce-head{flex:none; background:var(--color-surface);
    border-bottom:1px solid var(--color-divider); padding:10px 18px var(--s-3)}
  .ce-head .room-head{flex-wrap:nowrap}
  /* THE ONE DECLARATION THE SHARED RULES DO NOT CARRY. Image 2 is the
     NEGOTIATION page's head, and that page zeroes the global h1 tracking of
     -0.01em in a block scoped to itself — so .room-head h1 alone leaves this
     title a fraction wider than the head being copied. MEASURED: -0.15px
     against the reference's 0. Everything else about the title comes from the
     shared rule and is not restated here. */
  .ce-head .room-head h1{letter-spacing:0}
  .ce-head .room-facts{margin-top:11px}
  /* ---- THE WRITING BAR'S ROW ----
     LAYOUT ONLY. Every button in it is dressed by the unscoped rb-* rules in
     index.html, because richBarHtml has two homes and a rule scoped to one of
     them is how the same bar comes out looking like two different controls.
     It wraps rather than clipping: the divider can be dragged to 380px and a
     tool that has fallen off the end is a tool nobody can reach. */
  .ce-bar{display:flex; align-items:center; flex-wrap:wrap; gap:2px;
    margin-top:10px; padding-top:9px; border-top:1px solid var(--color-divider)}
  .ce-bar:empty{display:none}
  .ce-crumb{display:flex; align-items:center; gap:7px; flex-wrap:wrap}
  .ce-crumb .sep{color:var(--color-neutral-500)}
  .ce-sel{flex:0 1 auto; min-width:110px; max-width:280px; height:24px; padding:0 6px;
    font:inherit; font-size:var(--t-meta); font-weight:var(--w-strong); background:var(--color-surface);
    color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-ostat{display:inline-flex; align-items:center; gap:7px; font-size:var(--t-meta); font-weight:var(--w-strong);
    white-space:nowrap}
  .ce-ostat i{width:8px; height:8px; flex:none}
  .ce-ostat.wait{color:var(--st-amber-fg)} .ce-ostat.wait i{background:var(--st-amber-dot)}
  .ce-ostat.ok{color:var(--st-green-fg)}   .ce-ostat.ok i{background:var(--st-green-dot)}
  .ce-ostat.neu{color:var(--color-neutral-600)}
  .ce-ostat.neu i{background:var(--color-neutral-500)}
  .ce-head .ce-acts{flex:none; display:flex; align-items:center; gap:var(--s-3)}
  /* THE WAY BACK, DRESSED LIKE THE DOOR IT MIRRORS — the tab row's own
     #ws-to-nego, whose metrics the owner named as the model.
     NOT BOLD (owner-asked 25 Aug 2026: "Remove bold lettering from the back to
     negotiations as well … the same size font like the other buttons in the
     platform"). MEASURED against the negotiation head's own row: those are
     14px at --w-body and this was 14px at 600, so it read heavier than every
     button the owner was comparing it with. .ui-btn's base weight is 600 and
     .ui-btn-lg's is --w-body; this takes the head row's answer.
     .ce-act-plain is STALE — the row's other button has gone; flag any
     mention. */
  .ce-head .ce-acts .ce-back-btn{flex:none; font-size:var(--t-body); font-weight:var(--w-body);
    padding:7px 14px}
  .ce-say{flex:0 1 auto; min-width:0; max-width:300px; font-size:var(--t-label); color:var(--accent-ink);
    font-weight:var(--w-strong); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    opacity:0; transition:opacity var(--dur-2)}
  /* a faded-out message still occupied its width, which squeezed the clause
     name to an ellipsis for seconds after every Apply */
  .ce-say:not(.is-on){max-width:0; overflow:hidden}
  .ce-say.is-on{opacity:1}

  /* ---- what is on the table for this clause, as chips ---- */
  .ce-chip{display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 9px;
    font:inherit; font-size:var(--t-label); font-weight:var(--w-strong); background:var(--color-surface);
    color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-chip.is-on{border-color:var(--accent-solid); box-shadow:inset 0 -2px 0 var(--accent-solid)}
  .ce-chip i{width:7px; height:7px; flex:none; border-radius:50%;
    background:var(--color-neutral-500)}
  .ce-chip i.wait{background:var(--st-amber-dot)}
  .ce-chip i.ok{background:var(--st-green-dot)}
  .ce-chip i.no{background:var(--st-ruby-dot)}
  .ce-readbar .ce-chip{flex:none}

  /* ---- two columns from the very top of the working area ----
     The rail is exactly one third: 2fr beside 1fr. The 340px floor only bites
     on a window too narrow for a third to be usable at all. */
  /* ---- position:relative FOR THE DIVIDER, AND NOTHING ELSE MOVES ----
     (owner-asked 26 Aug 2026, wanting the negotiation page's draggable divider
     here.) The handle is an ABSOLUTE child of this grid — it claims no track
     and no row, which is the whole condition on adding it: a third grid child
     laid out in flow, or any strip spanning both columns, pushes the Copilot
     rail down by its own height. That is the one thing about this layout that
     was corrected repeatedly before it was built, and it looks perfectly
     correct in the source when it is wrong.

     THE COLUMNS BELOW REMAIN THE FALLBACK. ceFitSplit writes them in pixels
     once it has a measured grid; where it has not — a stage with no layout, a
     first paint — these hold, and writing 0px there would collapse a layout the
     CSS is holding perfectly well on its own. */
  .ce-grid{flex:1; min-height:0; display:grid; position:relative;
    grid-template-columns:minmax(0,2fr) minmax(340px,1fr); grid-template-rows:minmax(0,1fr)}
  /* Centred ON the seam rather than beside it: unlike the negotiation page's
     grid this one has no gap track, so the two columns touch and the grab strip
     straddles the rail's own border. Its LOOK is the negotiation page's, shared
     rather than copied — see the unscoped .rl-resizer in negotiation-css.js. */
  .ce-grid > .rl-resizer{transform:translateX(-50%)}
  .ce-col{min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden}
  .ce-rail{min-width:0; min-height:0; display:flex; flex-direction:column;
    background:var(--color-surface); border-left:1px solid var(--color-divider)}
  .ce-rail .ce-lane{flex:1; min-height:0}
  .ce-railfoot{flex:none; display:flex; align-items:center; justify-content:flex-end; gap:var(--s-2);
    padding:9px 14px; border-top:1px solid var(--color-divider); background:var(--color-surface)}
  .ce-railfoot button{height:30px; padding:0 14px; font:inherit; font-size:var(--t-meta); font-weight:var(--w-strong);
    background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-railfoot button.p{background:var(--color-accent-700); border-color:var(--accent-ink-700);
    color:#fff}
  .ce-railfoot button[disabled]{opacity:.45}

  /* ---- THE MIDDLE OF THE PAGE IS THE CONTRACT (owner-asked 26 Aug 2026) ----
     "There is no current wording vs proposed wording windows. Just one screen
     in which you can edit like you were able to edit in the proposed wording."

     So the two stacked boxes are gone and what fills the column is
     redlineDocHtml's own output — the product's ONE contract canvas, the same
     one the negotiation page and the counterparty's page draw. It is wrapped
     in .redline-page because that is where the paper's own sheet is scoped, and
     it carries .rl-doc and .nego-scroll for the same reason: this page borrows
     the paper's rules rather than growing a second set that agrees today.

     .ce-box, .ce-stands, .ce-prop, .ce-bh and .ce-seg are STALE with the boxes
     they dressed. */
  .ce-left{flex:1; min-width:0; min-height:0; display:flex; flex-direction:column;
    gap:10px; padding:12px var(--s-4) var(--s-4)}
  .ce-readbar{flex:none; display:flex; align-items:center; gap:var(--s-3); min-height:26px}
  .ce-readbar .g{flex:1; min-width:4px}
  .ce-band{flex:none}
  .ce-band:empty{display:none}
  /* The paper's own frame. position:relative because the one-sentence popup
     hangs inside it — it used to hang inside .ce-box.ce-prop, and a popup
     measured from a box that no longer exists lands in the corner. */
  .ce-paperwrap{flex:1; min-width:0; min-height:0; display:flex; position:relative;
    background:var(--color-surface); border:1px solid var(--color-divider)}
  .ce-paperwrap .rl-doc{flex:1; min-width:0; min-height:0}
  /* THE CLAUSE BEING TYPED IN, marked so a reader can see at a glance which of
     twenty clauses this page is about. Quiet on purpose: the paper already
     draws its own red margin rule for a clause under change, and a second loud
     marker for one fact is what this rulebook keeps warning about. */
  .ce-paperwrap .rl-clause-live{position:relative}
  .ce-paperwrap .rl-clause-live::before{content:""; position:absolute; left:-14px; top:-6px;
    bottom:-6px; width:3px; background:var(--accent-solid)}
  /* ---- THE CLAUSE YOU ARE TYPING IN IS STILL THE PAPER (owner-asked 26 Aug
     2026, Option A off a drawn render: "I want when you click on edit the field
     to not change color and just have a very light almost dotted line around
     the clause you want to edit. It should not look out of place.") ----
     It was a PURE WHITE fill on a cream sheet with a solid 2px accent ring —
     which is exactly how this product draws a form field, so it read as one: a
     search box dropped onto a contract. Two marks for one fact, and the louder
     of them was the one that did not belong.

     THE FILL IS GONE AND THE PAPER SHOWS THROUGH. What is left is a hairline
     dashed line, set 4px clear of the words so it frames them rather than
     touching them, and an OUTLINE rather than a border so it takes no space and
     nothing on the page moves when it appears.

     THE COLOUR IS THE DOCUMENT'S OWN INK AT A FIFTH STRENGTH, never a typed
     grey, and that is what makes one declaration right in both themes: the
     sheet is cream by day and near-black at night, and a fixed light grey that
     reads as a whisper on the cream would be invisible on the other. Mixed off
     the ink the paper is already printed in, the line follows the paper.

     WHAT CARRIES FOCUS IS THE CARET, which is the strongest indicator a text
     field has and is why this line does not need to shout: it says WHERE the
     editable region is, and the caret says you are in it. The teal bar in the
     margin is untouched and still says WHICH clause is live — it is the one
     signal here at full strength, and taking it down with the fill would have
     left the page saying nothing at all. */
  .ce-paperwrap .ce-typing{background:transparent; box-shadow:none;
    outline:1px dashed color-mix(in srgb, var(--color-doc-text) 22%, transparent);
    outline-offset:4px; padding:8px 10px; margin:-8px -10px}
  .ce-paperwrap .ce-typing:focus{outline:1px dashed color-mix(in srgb, var(--color-doc-text) 22%, transparent);
    outline-offset:4px; box-shadow:none}
  .ce-stat{font-size:var(--t-label); font-weight:var(--w-title); white-space:nowrap}
  .ce-stat .i{color:var(--st-green-fg)} .ce-stat .d{color:var(--st-ruby-fg)}
  .ce-stat .ce-none{color:var(--color-neutral-600); font-weight:var(--w-body)}

  /* ---- the foot of the left column: what is saved, and the way back ---- */
  .ce-foot{flex:none; display:flex; align-items:center; gap:10px; padding:9px 18px;
    background:var(--color-surface); border-top:1px solid var(--color-divider);
    flex-wrap:wrap; min-height:48px}
  .ce-foot .draft{font-size:var(--t-label); color:var(--color-neutral-600)}
  .ce-foot .draft b{font-weight:var(--w-title); color:var(--color-text); font-variant-numeric:tabular-nums}
  .ce-foot .undo{background:none; border:0; font:inherit; font-size:var(--t-label); font-weight:var(--w-title);
    color:var(--accent-ink); padding:2px 0}
  .ce-foot .undo[disabled]{color:var(--color-neutral-500)}
  .ce-foot .g{flex:1; min-width:8px}

  /* ---- the band over Copilot: whose words these are ----
     The reference page carries ONE brand colour and no other, so the Copilot
     label takes the workspace accent here rather than a violet of its own.
     That is a decision about THIS page: the clause panel's own Copilot button
     keeps the violet it has always worn. */
  .ce-ah{flex:none; display:flex; align-items:center; gap:18px; padding:0 14px;
    border-bottom:1px solid var(--color-divider)}
  .ce-ah .sp{display:inline-flex; align-items:center; gap:7px; font-size:var(--t-meta); font-weight:var(--w-title);
    color:var(--accent-ink); padding:var(--s-3) 0}
  .ce-tabs{display:flex; gap:18px; margin-left:auto}
  .ce-tabs button{background:none; border:0; padding:var(--s-3) 1px; font:inherit; font-size:var(--t-meta);
    color:var(--color-text); border-bottom:2px solid transparent}
  .ce-tabs button.is-on{font-weight:var(--w-title); color:var(--accent-ink);
    border-bottom-color:var(--accent-solid)}
  .ce-tabs .n{font-size:var(--t-micro); font-weight:var(--w-title); margin-left:5px; padding:1px 5px;
    background:var(--st-amber-bg); color:var(--st-amber-fg)}
  .ce-disc{flex:none; display:flex; align-items:center; gap:var(--s-2); padding:var(--s-2) 14px;
    background:var(--color-surface); border-bottom:1px solid var(--color-divider);
    font-size:var(--t-label); color:var(--color-neutral-600)}
  .ce-disc b{color:var(--accent-ink); font-weight:var(--w-title); flex:none}
  .ce-disc span{min-width:0}

  /* the chat is WHITE, like HaTi's own Copilot panel — a grey ground made the
     rail read as a sunken well rather than as the panel it is */
  .ce-lane{flex:1; min-height:0; overflow:auto; padding:14px; background:var(--color-surface)}
  .ce-you{display:flex; justify-content:flex-end; margin:0 0 var(--s-3)}
  .ce-you span{max-width:86%; background:var(--st-steel-bg); color:var(--color-text);
    padding:var(--s-2) 11px; font-size:var(--t-meta); line-height:1.5}
  .ce-ai{margin:0 0 var(--s-4); padding-left:11px;
    box-shadow:inset 2px 0 0 color-mix(in srgb, var(--accent-solid) 45%, transparent)}
  .ce-ai p.t{margin:0 0 11px; font-size:var(--t-meta); line-height:1.6}
  .ce-ai p.t:last-child{margin-bottom:0}
  .ce-work{display:flex; align-items:center; gap:var(--s-2); font-size:var(--t-label); font-weight:var(--w-strong);
    color:var(--accent-ink); margin:0 0 var(--s-3)}
  .ce-work i{width:12px; height:12px; flex:none; border:2px solid currentColor;
    border-radius:50%; border-right-color:transparent; animation:cespin .9s linear infinite}
  @keyframes cespin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){ .ce-work i{animation:none} }

  /* what Copilot read before it answered — the facts, named, so the answer
     rests on something a reader can check */
  .ce-read{margin:0 0 var(--s-4); padding:0; display:flex; flex-direction:column; gap:var(--s-2)}
  .ce-read li{list-style:none; display:flex; gap:9px; font-size:var(--t-meta); line-height:1.5}
  .ce-read li b{flex:none; width:96px; color:var(--color-neutral-600); font-weight:var(--w-title);
    font-size:var(--t-micro); letter-spacing:.05em; text-transform:uppercase; padding-top:2px}
  .ce-read li span{flex:1; min-width:0}

  /* ONE CARD SHAPE, whether it comes from the chat or from the scan. On a
     white lane a white card needs its edge to do the work the ground used to
     do, so the border stays and the fill goes very slightly off-white. */
  .ce-card{background:var(--color-neutral-100); color:var(--color-text);
    border:1px solid var(--color-divider); padding:10px 11px; margin-bottom:var(--s-2)}
  .ce-card .n{display:flex; align-items:center; gap:var(--s-2); font-size:var(--t-body); font-weight:var(--w-title)}
  .ce-card .n .g{flex:1; min-width:4px}
  .ce-card .chip{flex:none; font-size:var(--t-figure); font-weight:var(--w-title); letter-spacing:.06em;
    text-transform:uppercase; padding:2px 6px}
  .ce-card .chip.ok{background:var(--st-green-bg); color:var(--st-green-fg)}
  .ce-card .chip.no{background:var(--st-ruby-bg); color:var(--st-ruby-fg)}
  .ce-card .chip.wait{background:var(--st-amber-bg); color:var(--st-amber-fg)}
  .ce-card .l{display:block; margin-top:5px; font-size:var(--t-meta); line-height:1.5}
  .ce-card .r{display:block; margin-top:6px; font-size:var(--t-label);
    color:var(--color-neutral-600); line-height:1.45}
  /* the wording preview is white too — the same wording is white in both boxes
     on the left, and one tinted patch left over reads as a miss */
  .ce-card .pv{display:block; margin-top:var(--s-2); padding:var(--s-2) 10px; background:var(--color-surface);
    border:1px solid var(--color-divider); font-size:var(--t-meta); line-height:1.65;
    max-height:120px; overflow:auto}
  .ce-card .pv del{color:var(--st-ruby-fg); text-decoration:line-through}
  .ce-card .pv ins{color:var(--st-green-fg); text-decoration:none; font-weight:var(--w-strong)}
  .ce-card .av{display:flex; gap:var(--s-2); margin-top:9px; flex-wrap:wrap; align-items:center}
  .ce-card .av button{height:26px; padding:0 11px; font:inherit; font-size:var(--t-label); font-weight:var(--w-strong);
    background:var(--color-surface); color:var(--accent-ink); border:1px solid var(--color-divider)}
  .ce-card .av button.p{background:var(--color-accent-700); border-color:var(--accent-ink-700);
    color:#fff}
  .ce-card .av button:hover{border-color:var(--accent-solid)}
  /* a thumb is a mark on ONE suggestion, so it sits on the card that made it */
  .ce-card .av .ce-vote{width:26px; padding:0; color:var(--color-neutral-600)}
  .ce-card .av .ce-vote.is-on{color:var(--accent-ink); border-color:var(--accent-solid)}
  .ce-card .av .g{flex:1; min-width:4px}

  /* the scan reads as a list of verdicts, then the same cards */
  .ce-rule{background:var(--color-surface); border:1px solid var(--color-divider);
    border-left:3px solid var(--color-divider); padding:9px 11px; margin-bottom:var(--s-2)}
  .ce-rule.dev{border-left-color:var(--st-amber-dot)}
  .ce-rule.miss{border-left-color:var(--st-ruby-dot)}
  .ce-rule.ok{border-left-color:var(--st-green-dot)}
  .ce-rule .n{display:flex; align-items:center; gap:var(--s-2); font-size:var(--t-meta); font-weight:var(--w-title)}
  .ce-rule .l{display:block; margin-top:5px; font-size:var(--t-meta); line-height:1.5}
  .ce-rule .r{display:block; margin-top:6px; font-size:var(--t-label);
    color:var(--color-neutral-600); line-height:1.45}
  ${''/* THE TWO GROUPS ARE LABELLED, because the verb under them differs: the
         first list edits the clause you are in, the second files a NEW clause.
         The heading wears this product's own signpost dress (11px uppercase,
         .09em) and the second one carries the promise of what a press inside it
         does — which is a band saying what the page will do with what you
         press, not a narration of the screen. */}
  .ce-scan-h{margin:14px 0 var(--s-2); font-size:var(--t-micro); font-weight:var(--w-title);
    letter-spacing:.09em; text-transform:uppercase; color:var(--color-neutral-600)}
  .ce-scan-h:first-child{margin-top:0}
  .ce-scan-h .s{display:block; margin-top:3px; font-size:var(--t-label); font-weight:var(--w-body);
    letter-spacing:0; text-transform:none; color:var(--color-neutral-600); line-height:1.45}
  ${''/* The preview names whose wording it is, so a card offering three of them
         can never leave the reader guessing which one it drew. */}
  .ce-rule .pvk{display:block; margin-top:var(--s-2); font-size:var(--t-figure); font-weight:var(--w-title);
    letter-spacing:.09em; text-transform:uppercase; color:var(--color-neutral-600)}
  .ce-rule .pv{display:block; margin-top:4px; padding:var(--s-2) 10px; background:var(--color-surface);
    border:1px solid var(--color-divider); font-size:var(--t-meta); line-height:1.65;
    max-height:120px; overflow:auto}
  ${''/* WHAT THE PRESS COSTS. Quiet on purpose — see ceCostLine. Tabular figures
         so a column of these lines up rather than dancing. */}
  .ce-rule .cost{display:block; margin-top:7px; font-size:var(--t-label); line-height:1.45;
    color:var(--color-neutral-600); font-variant-numeric:tabular-nums}
  .ce-rule .cost b{font-weight:var(--w-strong); color:var(--color-text)}
  .ce-rule .filed{font-size:var(--t-label); font-weight:var(--w-strong); color:var(--st-green-fg)}
  .ce-rule .av{display:flex; gap:var(--s-2); margin-top:9px; flex-wrap:wrap}
  .ce-rule .av button{height:26px; padding:0 11px; font:inherit; font-size:var(--t-label); font-weight:var(--w-strong);
    background:var(--color-surface); color:var(--accent-ink); border:1px solid var(--color-divider)}
  .ce-rule .av button:hover{border-color:var(--accent-solid)}

  /* the ready-made questions are ONE line, always: they run across in a single
     row that scrolls sideways rather than wrapping to a second, and each chip
     keeps its own words on one line too. A mask rather than a colour, so the
     fade is the same in both themes and a chip running past the edge reads as
     "there is more" rather than as clipped. */
  .ce-chips{flex:none; display:flex; gap:7px; flex-wrap:nowrap; overflow-x:auto;
    padding:0 14px 9px; background:var(--color-surface); scrollbar-width:thin;
    -webkit-mask-image:linear-gradient(to right, #000 calc(100% - 34px), transparent);
    mask-image:linear-gradient(to right, #000 calc(100% - 34px), transparent)}
  .ce-chips::-webkit-scrollbar{height:5px}
  .ce-chips::-webkit-scrollbar-thumb{background:var(--color-neutral-200)}
  .ce-chips:empty{padding:0}
  .ce-chips button{flex:none; height:25px; padding:0 9px; font:inherit; font-size:var(--t-label);
    white-space:nowrap; background:var(--color-surface); color:var(--color-neutral-600);
    border:1px solid var(--color-divider)}
  .ce-chips button:hover{color:var(--color-text); border-color:var(--accent-solid)}

  /* the box you type in is a real box — three lines deep at rest, growing as
     you write and wrapping like any other text area */
  .ce-ask{flex:none; display:flex; gap:var(--s-2); padding:10px 14px;
    border-top:1px solid var(--color-divider); align-items:flex-end}
  .ce-ask textarea{flex:1; min-width:0; height:74px; min-height:74px; max-height:200px;
    padding:9px 11px; font:inherit; font-size:var(--t-meta); line-height:1.5; resize:none;
    white-space:pre-wrap; overflow-wrap:break-word; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-ask textarea:focus{box-shadow:var(--focus)}
  .ce-ask button{flex:none; display:inline-grid; place-items:center; width:32px; height:32px;
    padding:0; background:var(--color-accent-700); border:1px solid var(--color-accent-700);
    color:#fff}
  .ce-ask button svg{width:17px; height:17px; display:block}
  .ce-ask button:hover{background:var(--accent-ink); border-color:var(--accent-ink)}

  /* ---- the reason is asked as a STEP, in HaTi's own words ---- */
  /* ---- THE REASON PANEL'S RULES, DRESSING NOTHING ----
     Kept rather than deleted, on this file's own convention for a retired
     surface: the step went on 28 Aug 2026 (owner-asked) and nothing emits
     .ce-reason any more. If a reason box ever comes back it wants a decision,
     not a rediscovery of what it used to look like. */
  .ce-reason{flex:none; background:var(--color-surface); border:1px solid var(--accent-solid);
    padding:11px var(--s-3)}
  .ce-reason[hidden]{display:none}
  .ce-reason label{display:block; font-size:var(--t-micro); font-weight:var(--w-title); letter-spacing:.09em;
    text-transform:uppercase; color:var(--color-neutral-600); margin-bottom:7px}
  .ce-reason textarea{width:100%; min-height:52px; padding:var(--s-2) 10px; font:inherit; font-size:var(--t-meta);
    line-height:1.5; resize:vertical; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-reason textarea:focus{box-shadow:var(--focus)}
  .ce-reason .row{display:flex; align-items:center; gap:var(--s-2); margin-top:9px; flex-wrap:wrap}
  .ce-reason .g{flex:1; min-width:4px}
  .ce-reason .hint{font-size:var(--t-label); color:var(--color-neutral-600)}
  .ce-reason button{height:28px; padding:0 13px; font:inherit; font-size:var(--t-meta); font-weight:var(--w-strong);
    background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-reason button.p{background:var(--color-accent-700); border-color:var(--accent-ink-700);
    color:#fff}

  /* ---- HIGHLIGHT A PASSAGE, TYPE THE REPLACEMENT, PRESS ENTER ----
     Highlight a sentence in the contract and this strip opens under it,
     carrying that sentence. What is in the box replaces THAT passage only —
     the rest of the clause is untouched, and the redline is recomputed from
     the two texts as always.

     THE BOX GROWS WITH THE WORDING (ceInlineFit), so max-height is what bounds
     it rather than a fixed row: a replacement is a sentence, and a strip that
     shows three words of one is a strip nobody can proof-read. .ce-inline .q
     is STALE — the context line went with the prefill. */
  .ce-inline{position:absolute; z-index:6; width:min(420px, calc(100% - 24px));
    background:var(--color-surface); border:1px solid var(--accent-solid);
    box-shadow:var(--shadow-md); padding:9px 10px; display:none}
  .ce-inline.is-on{display:block}
  .ce-inline .row{display:flex; gap:7px; align-items:flex-end}
  .ce-inline textarea{flex:1; min-width:0; min-height:30px; max-height:120px; overflow-y:auto; padding:6px 9px;
    font:inherit; font-size:var(--t-meta); line-height:1.4; resize:none; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-inline textarea:focus{box-shadow:var(--focus)}
  .ce-inline .snd{flex:none; display:inline-grid; place-items:center; width:30px; height:30px;
    padding:0; background:var(--color-accent-700); border:1px solid var(--color-accent-700);
    color:#fff}
  .ce-inline .snd svg{width:15px; height:15px; display:block}
  .ce-inline .chips{display:flex; gap:6px; flex-wrap:wrap; margin-top:var(--s-2)}
  .ce-inline .chips button{height:23px; padding:0 var(--s-2); font:inherit; font-size:var(--t-label);
    background:var(--color-surface); color:var(--accent-ink);
    border:1px solid var(--color-divider)}
  .ce-inline .chips button:hover{border-color:var(--accent-solid)}
  .ce-inline .work{font-size:var(--t-label); color:var(--accent-ink); font-weight:var(--w-strong); margin-top:var(--s-2)}
  .ce-inline .bad{font-size:var(--t-label); color:var(--st-ruby-fg); font-weight:var(--w-strong); margin-top:var(--s-2)}

  .ce-empty{font-size:var(--t-meta); color:var(--color-neutral-600); line-height:1.6}

  /* BELOW THE WIDTH WHERE TWO COLUMNS STOP MAKING SENSE the page is not
     offered at all (see clauseEditorFits) — this is the belt to that braces,
     so a window dragged narrow while the page is open stacks rather than
     crushing the rail to nothing. */
  @media (max-width:1023px){
    .ce-grid{grid-template-columns:minmax(0,1fr); grid-template-rows:auto auto}
    .ce-rail{border-left:0; border-top:1px solid var(--color-divider); min-height:320px}
    #clause-editor{overflow:auto}
    /* A divider between two columns that are no longer side by side is a strip
       across the middle of the page. ceFitSplit CLEARS its inline columns here
       as well — this rule carries no !important, so an inline value written on
       a wide window and left behind would beat it and crush the stack. */
    .ce-grid > .rl-resizer{display:none}
  }
</style>`;
}

/* In the HEAD, so a repaint of the page underneath cannot strip it. */
function ceEnsureStyle(){
  if (typeof document === 'undefined') return;
  if (document.getElementById('ce-style')) return;
  const head = document.head || document.getElementsByTagName('head')[0] || document.body;
  if (!head) return;
  const holder = document.createElement('div');
  holder.innerHTML = clauseEditorCss();
  const style = holder.querySelector('style');
  if (style) head.appendChild(style);
}

/* ============================================================================
   THE READINGS
   ----------------------------------------------------------------------------
   Every one of these BORROWS the negotiation model rather than working the
   answer out again — the standing rule in this codebase, and the reason two
   surfaces here can never disagree about what a clause says or what is on it.
   Read through window, because these live in other modules.
   ========================================================================== */

/* The clause as the person typing is SHOWN it — never the round baseline. A
   clause with a change already adopted on it does not read like the baseline
   any more, and measuring an edit against the baseline anyway re-expresses the
   adopted change as though the author had just made it (MK-311). */
function ceClause(){
  if (!_ceC || !_ceClauseId) return null;
  try{ const cl = window.negoClauseNowById ? negoClauseNowById(_ceC, _ceClauseId) : null;
    if (cl) return cl; }catch(_){}
  return ceProposedClause();
}
/* ---- A CLAUSE YOU PROPOSED IS EDITABLE HERE TOO (owner-reported 26 Aug 2026:
   "when I click on edit with copilot for standard company clauses added to the
   contract i get the error ... I should be able to edit even standard company
   clauses") ----
   A clause added from the library or the playbook is an ASK, not yet part of
   the agreement, so negoClauseNowById answers null for it and this page turned
   the reader away with "That clause is no longer in the document" — a sentence
   that is not even true of it: it has never been in the document.

   THE PANEL ALREADY SOLVED THIS on 25 Aug and this page was not brought along —
   the duplication warning in its usual direction. The ask supplies the clause:
   its own heading and its own proposed wording, which is exactly what the panel
   shows. Nothing new is invented and nothing is stored.

   OUR OWN, AND ONLY WHILE IT IS LIVE, the panel's own three bounds: their
   proposal is answered rather than rewritten, and a settled one is a record.
   Anything else answers null and the page refuses exactly as it did.

   THE SEAT IS OWNER BY CONSTRUCTION — clauseEditorRefusal turns the
   counterparty away before this is ever reached, and rlOpenClauseEditor is not
   drawn on their page at all. */
function ceProposedClause(){
  const list = (_ceC && Array.isArray(_ceC.changes)) ? _ceC.changes : [];
  const ch = list.find(x => x && String(x.clauseId) === String(_ceClauseId)
    && x.changeType === 'insertClause' && x.status === 'pending'
    && !x.withdrawn && x.authorSide === 'owner');
  if (!ch) return null;
  const headingText = String(ch.headingText || '').trim();
  let head = { num: '', title: headingText };
  try{ if (headingText && window.clauseParseHeading) head = clauseParseHeading(headingText); }catch(_){}
  return { clauseId: _ceClauseId, num: head.num || '', title: head.title || headingText,
    headingText, text: String(ch.proposedText || ch.newText || ''),
    bodyHtml: ch.bodyHtml || '', _ceProposed: true };
}
/* Is the clause on this page an ask of ours rather than wording in the
   agreement? Asked once, so the door, the filing route and anything added later
   cannot come to disagree about it. */
function ceIsProposed(){
  const cl = ceClause();
  return !!(cl && cl._ceProposed);
}
function ceClauseLabel(cl){
  if (!cl) return '';
  try{ if (window.negoClauseLabel) return negoClauseLabel(cl); }catch(_){}
  return String(cl.headingText || cl.title || '').trim();
}
/* READ WITHOUT WRITING is not at stake here — this page is only ever opened on
   a contract whose negotiation is already live — but the raw read is used
   anyway, because it is the cheaper and the safer of the two. */
function ceChanges(){
  const list = (_ceC && Array.isArray(_ceC.changes)) ? _ceC.changes : [];
  return list.filter(x => x && x.clauseId === _ceClauseId);
}
function ceOnTable(){
  return ceChanges().filter(x => x.status === 'pending' && !x.withdrawn);
}
/* Which change this page opens on: the one it was asked for, otherwise the one
   the paper is drawing — so the editor and the contract agree about which of
   several rival asks is the live wording. */
function ceLeadChange(named){
  const on = ceOnTable();
  if (named){ const hit = on.find(x => x.id === named); if (hit) return hit; }
  const cl = ceClause();
  try{
    if (window.negoLeadChange && cl) return negoLeadChange(_ceC, cl, on) || null;
  }catch(_){}
  return on.length ? on[on.length - 1] : null;
}
/* The plain wording a change proposes. A change stores its own newText, which
   is exactly what was filed; falling back to the standing wording means "this
   change proposes nothing new", which the redline then shows as no marks. */
function ceWordingOf(ch){
  if (!ch) return _ceBase;
  /* bodyHtml first: it is what the change actually stores and what the funnel
     takes back. newText is its projection and is the fallback for a change
     filed before rich bodies existed. */
  const rich = String(ch.bodyHtml == null ? '' : ch.bodyHtml).trim();
  if (rich) return rich;
  const t = String(ch.newText == null ? '' : ch.newText).trim();
  return t ? ceRich(t) : _ceBase;
}
function ceStanding(){
  const cl = ceClause();
  if (!cl) return '';
  const rich = String(cl.bodyHtml == null ? '' : cl.bodyHtml).trim();
  if (rich) return window.sanitizeRich ? sanitizeRich(rich) : rich;
  return ceRich(String(cl.text || '').trim());
}
/* The playbook rules this clause is off, counted from the review the contract
   already holds. Never run on open: a scan costs money and a number nobody
   asked for is not worth spending it on. */
/* TWO GROUPS, BECAUSE THEY ARE TWO DIFFERENT ACTS (owner-reported 26 Aug 2026:
   the scan on a Lease Charges clause offered "Use our standard" on a DATA
   PROTECTION rule, and pressing it struck out the whole lease-charge sentence
   and put a data protection paragraph in its place).

   The rule this panel had was "show this clause's findings, plus the ones that
   matched no clause at all", and that INTENTION was right — a standard missing
   from the whole contract is worth knowing about while you are drafting one.
   What was wrong is that both groups were then handed the page's ONE verb,
   which replaces the clause you are looking at. A finding with no clause of its
   own has nothing to replace: it is answered by ADDING a clause, which is
   exactly what the negotiation page's own Playbook review has always done with
   it, through rlFilePlaybookProposal.

   So the reading is split at source rather than at the draw. `here` may be
   edited in place; `missing` may only be added. Neither list can reach the
   other's verb, because the verb is chosen from the list a finding is in — and
   a finding cannot be in both. */
function ceScanGroups(){
  const rev = _ceScan || (_ceC && _ceC.playbook) || null;
  if (!rev) return { here: [], missing: [] };
  let items = [];
  try{ items = window.rlPlaybookProposals ? rlPlaybookProposals(_ceC, rev) : []; }
  catch(_){ items = []; }
  const here = [], missing = [];
  for (const it of items){
    if (!it) continue;
    /* ROUTED BY WHERE IT MAY LAND, never by whether it happens to carry a
       clause id. The third landing — a deviation nobody could place — is drawn
       on NEITHER list: we know the wording is somewhere in this contract and
       not that it is here, so offering to replace this clause would be the
       reported fault again, and offering to add one would duplicate a clause
       the document already has. It is the whole-document Playbook review's to
       report, where the reader can see the quote and go and look. */
    if (it.landing === 'add') missing.push(it);
    else if (it.landing === 'edit' && it.clauseId === _ceClauseId) here.push(it);
  }
  return { here, missing };
}
/* The flat list, in the order the panel draws it — this clause first. The press
   handler resolves a card by its position in THIS list, so the two have to stay
   in step; building the flat one out of the groups is what keeps them so. */
function ceScanItems(){
  const g = ceScanGroups();
  return g.here.concat(g.missing);
}
/* Whose wording, named by the negotiation page's own helper so the rail and the
   Playbook review modal cannot come to call the same thing by two names. Read
   through window (the ES-module rule) with the plainest possible fallback. */
function ceWordingLabel(kind){
  try{ if (typeof window.rlPbWordingLabel === 'function') return rlPbWordingLabel(kind); }catch(_){}
  return _cet(kind === 'draft' ? 'pb_w_draft' : kind === 'fallback' ? 'pb_w_fallback' : 'pb_w_ours');
}
/* WHAT WAS FILED THIS SITTING, so a card that has just been added says so
   instead of offering the same press again. Per sitting and in memory, like
   every other posture on this page: the change itself is on the record, and a
   re-scan is what tells you whether the standard is still missing. */
let _ceScanFiled = {};
const ceScanKey = it => `${(it && it.v && it.v.category) || '?'}::${(it && it.v && it.v.status) || '?'}`;
const ceDeviationCount = () => ceScanItems().filter(it => it.v && it.v.status !== 'aligned').length;

/* ============================================================================
   WHAT A PRESS COSTS (owner-asked 26 Aug 2026, drawn and ruled first)
   ----------------------------------------------------------------------------
   The card draws the marks, and the marks alone do not say how much of the
   clause is going. On a lease-charges clause a playbook standard can strike out
   every word you have and put a generic paragraph in its place, and that reads
   at a glance exactly like a change of three words.

   IT COUNTS NOTHING NEW. redlineStats already counts WORDS, and it is the same
   counter behind the +36 -16 on this page's own foot — so the line and the
   figures in the header can never disagree about what a word is.

   IT IS A LABEL, NOT A LOCK, AND IT IS DRAWN QUIET (owner-ruled). Replacing a
   whole clause is often exactly right; amber on every one of those would be an
   alarm that is always on, which this rulebook records as the way the one real
   warning stops being read. The label shade, and no colour of its own.
   ========================================================================== */
/* ---------- RICH IN, WORDS OUT ----------
   This page's wording is RICH HTML — the same thing the clause and the change
   already store — because a page whose spine is a plain string throws away
   bold, a bullet and a size on every keystroke, which made the writing bar a
   set of dead buttons here.

   NOTHING NEW IS STORED AND THERE IS NO MIGRATION: a clause has carried
   `bodyHtml` beside its `text` and a change has carried `bodyHtml` beside its
   `newText` since they were built, and negoEditClause — the funnel this page
   files through — has always TAKEN rich HTML, because the clause panel's editor
   hands it `innerHTML`. This page was reading the stripped-down copy of data
   that was already rich.

   THE REDLINE STILL COMPARES WORDS, deliberately. What the other side verifies
   is the wording; the funnel already has a formatting-only path for an edit
   whose words did not move; and a mark drawn from anything else would not be
   the mark that was filed. So every reading that wants WORDS asks ceWords, and
   the one representation on the page is the rich one. */
function ceWords(v){
  const t = String(v == null ? '' : v);
  if (!/[<&]/.test(t)) return t;                     /* already plain */
  if (window.richToText){ try{ return richToText(t); }catch(_){} }
  const d = document.createElement('div');
  d.innerHTML = t;
  return (d.textContent || '');
}
/* Anything arriving from somewhere that speaks plain text — a Copilot card, a
   playbook standard, the replacement strip — becomes rich on the way in, so the
   page holds ONE representation rather than two that can drift. */
function ceRich(v){
  const t = String(v == null ? '' : v);
  if (/<(p|div|ul|ol|li|h[1-4]|blockquote|pre|table|span|strong|em|u|s|b|i)\b/i.test(t)){
    return window.sanitizeRich ? sanitizeRich(t) : t;
  }
  if (window.negoRichFromLines){ try{ return negoRichFromLines(t); }catch(_){} }
  return '<p>' + _cee(t).replace(/\n/g, '</p><p>') + '</p>';
}
function ceWordCount(t){
  const w = String(t == null ? '' : t).trim();
  return w ? w.split(/\s+/).length : 0;
}
/* null where there is nothing honest to say — the two texts are the same, or
   there is no wording to compare. The caller draws nothing rather than a line
   reading "changes 0 of 16". */
function ceCostLine(from, to){
  const a = ceWords(from), b = ceWords(to);
  const total = ceWordCount(a);
  if (!total || a === b) return null;
  const { ins, del } = ceCounts(from, to);
  if (!ins && !del) return null;
  /* PURE ADDITION — nothing of the reader's wording is at risk, so the line
     says what arrives rather than what goes. */
  if (!del) return _cetn('ce_cost_add', ins, { n: ins, total });
  if (del >= total) return _cetn('ce_cost_all', total, { total });
  return _cetn('ce_cost_some', del, { n: del, total, kept: total - del });
}

/* ---------- the redline between the two boxes ----------
   COMPUTED, never scripted, and computed by the product's own engine — the
   same redlineOps that files the marks — so whatever put the wording in the
   lower box, the marks are worked out one way. */
function ceOps(a, b){
  if (!window.redlineOps) return null;
  /* THE PROJECTION, NOT THE MARKUP. redlineOps compares wording; handed HTML it
     would diff tag soup and mark every formatting change as a word change. */
  try{ return redlineOps(ceWords(a), ceWords(b)); }
  catch(_){ return null; }
}
function ceRedlineHtml(a, b){
  const ops = ceOps(a, b);
  if (!ops) return `<p>${_cee(ceWords(b))}</p>`;
  try{
    if (window.redlineOpsBlocksHtml) return redlineOpsBlocksHtml(ops);
    if (window.redlineOpsHtml) return `<p>${redlineOpsHtml(ops)}</p>`;
  }catch(_){}
  return `<p>${_cee(ceWords(b))}</p>`;
}
function ceCounts(a, b){
  const ops = ceOps(a, b);
  if (!ops) return { ins: 0, del: 0 };
  try{
    if (window.redlineStats){ const s = redlineStats(ops); return { ins: s.ins || 0, del: s.del || 0 }; }
  }catch(_){}
  return { ins: 0, del: 0 };
}

/* ---------- WHO MAY OPEN IT ----------
   Asked in ONE place, so the door, the door's own tooltip and the refusal all
   read the same answer. Each refusal names itself, because "you cannot" with
   no reason is what makes a reader blame themselves. */
function clauseEditorRefusal(c, opts = {}){
  if (!c) return _cet('ce_no_contract');
  if (opts.side === 'counterparty') return _cet('ce_owner_only');
  if (opts.readonly) return _cet('ce_read_only');
  try{ if (window.negoWordingFrozen && negoWordingFrozen(c)) return _cet('ce_wording_frozen'); }catch(_){}
  /* THE DESK, ASKED DIRECTLY. rlMayRedline is the negotiation view's own
     reading of exactly this and is deliberately not published to window, so
     this asks the same question of the same predicate rather than reaching for
     a name that is not there — which is silence, not a refusal (f232). */
  try{ if (typeof window.deskMayRedline === 'function' && !deskMayRedline(c)) return _cet('ce_not_your_desk'); }catch(_){}
  if (!clauseEditorFits()) return _cet('ce_too_narrow');
  return null;
}
/* Two columns need room to be two columns. Asked of the WINDOW, which is the
   same question the stylesheet's own break asks. */
function clauseEditorFits(){
  if (typeof window === 'undefined' || !window.innerWidth) return true;
  return window.innerWidth >= 1024;
}

/* ============================================================================
   THE PAGE
   ========================================================================== */
const CE_SEND_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
  + ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>';

function clauseEditorHtml(){
  return `<div id="clause-editor" role="region" aria-label="${_ceea(_cet('ce_page_label'))}">
    ${''/* ---- THE GRID IS THE PAGE, AND THAT IS THE WHOLE POINT ----
           The Copilot rail runs from the very top of the window to the very
           bottom. So the crumb, the title, the facts and the chip row are
           INSIDE the left column, not above both of them: a full-width header
           pushes the rail down by its own height, which is the one thing this
           layout was corrected for, repeatedly, before it was built. Anything
           new that spans "the whole page" goes in the left column too. */}
    <div class="ce-grid">
      <div class="ce-col">
    ${''/* ---- THE ROOM HEAD'S OWN DRESS, BY WEARING ITS OWN CLASSES ----
           (owner-asked 25 Aug 2026, off two screenshots: "the highlighted part
           should be the same exact design as image 2 including the font
           sizes".) Image 2 is the contract room's head, and the way to be the
           same as it EXACTLY is to be dressed by the same rules rather than by
           a second set that agrees today — .room-head, .room-id, .room-name,
           .room-sub, .room-facts, .room-facets, .room-facet and its .l/.v are
           all defined unscoped in index.html, so this markup inherits the
           title's 15px/600, the label's 12px and the value's 15px/600 with
           nothing to keep in step.

           THE FACTS ARE THIS CLAUSE'S, not the contract's, so roomFactsHtml
           itself cannot be reused — it reads counterparty, value and term. The
           SHAPE is shared; the reading is the clause's own.

           AND THE COLLAPSE CONTROL IS GONE ENTIRELY (same ask: "remove the
           collapse feature entirely in the page with image 1"). This page is
           about one clause and its head is four short facts; a control for
           tidying away four facts on a page that has nothing else in its head
           is furniture. .ce-fold, .ce-ohwrap and the is-folded rule went with
           it rather than being hidden. */}
    <div class="ce-head" id="ce-head">
      <div class="room-head">
        <div class="room-id">
          <div class="room-name">
            <h1 id="ce-title"></h1>
            <span class="ce-ostat" id="ce-ostat"></span>
          </div>
          <div class="room-sub ce-crumb" id="ce-crumb"></div>
        </div>
        <span class="ce-say" id="ce-say" role="status"></span>
        <div class="room-acts ce-acts" id="ce-headacts"></div>
      </div>
      <div class="room-facts"><div class="room-facets" id="ce-facts"></div></div>
    ${''/* ---- THE WRITING BAR ----
           INSIDE .ce-head, which is inside the left column — never above
           .ce-grid. A full-width row there pushes the Copilot rail down by its
           own height, which is the one thing this layout was corrected for
           repeatedly, and the comment at the top of this builder says so.
           Drawn by richBarHtml, the product's ONE shelf: the same builder the
           clause panel's inline editor draws, at its 'full' setting. */}
      <div class="ce-bar" id="ce-bar" role="toolbar"
        aria-label="${_ceea(_cet('ce_bar_label'))}"></div>
    </div>
        <div class="ce-left">
    ${''/* ---- THE THREE READINGS, FROM THE PRODUCT'S OWN BUILDER ----
           Redlined / As agreed / With changes, drawn by rlReadSegsHtml — the
           same control the negotiation page and the counterparty's header
           carry, so this is its third home rather than a second control that
           agrees today. The clothes follow the builder, which is a fault this
           page has already paid for twice.

           The two-way Redlines|Edit toggle it replaces is retired with the box
           it sat in: editing is no longer a VIEW of a box, it is what the paper
           does, and the pencil on the clause is what turns it on. */}
          <div class="ce-readbar" id="ce-readbar"></div>
          <div class="ce-band" id="ce-band"></div>
          <div class="redline-page ce-paperwrap">
            <div class="rl-doc">
              <div class="nego-scroll" id="ce-doc"
                aria-label="${_ceea(_cet('ce_paper_label'))}"></div>
            </div>
    ${''/* ---- HIGHLIGHT A PASSAGE, TYPE THE REPLACEMENT, PRESS ENTER ----
           Owner-asked, off Oneflow: "you can highlight a word or sentence and
           it opens up a window and you enter the replacement redline manually
           … you get a single strip to enter your change and click and enter
           button."

           ONE STRIP AND ONE BOX, and the box always holds the PROPOSED
           WORDING — whoever wrote it. It opens carrying the passage you
           highlighted, so the common act is editing a sentence rather than
           retyping one; the three chips ask Copilot for a rewrite and the
           answer lands IN THE BOX rather than in the contract, which is what
           lets one strip serve both hands without becoming two.

           AND IT DOES NOT FILE. Enter APPLIES the wording to the draft, so the
           redline appears against what stands and the one act in the rail's
           foot is still what puts it on the record. A strip that filed would be
           a third door onto an act that already has one.

           THE CONTEXT LINE IS GONE (owner-asked, ringing it in a screenshot:
           "remove this because it takes space away"). It printed the passage
           the box is now prefilled with — the same words twice, and the second
           printing costing a row. `ce_inline_about` is STALE. */}
            <div class="ce-inline" id="ce-inline">
              <div class="row">
                <textarea id="ce-inline-ask" rows="1"
                  placeholder="${_ceea(_cet('ce_inline_ph'))}"></textarea>
                <button type="button" class="snd" data-ce-act="inline-go"
                  aria-label="${_ceea(_cet('ce_inline_replace'))}"
                  title="${_ceea(_cet('ce_inline_replace_title'))}">${CE_SEND_ICON}</button>
              </div>
              <div class="chips" id="ce-inline-chips"></div>
              <div id="ce-inline-note"></div>
            </div>
          </div>
    ${''/* THE REASON PANEL IS RETIRED (owner-asked 28 Aug 2026 — see FILING
           below). #ce-reason, #ce-why and the three reason-* acts are STALE;
           `.ce-reason` is left in the sheet, dressing nothing. */}
        </div>
        <div class="ce-foot">
          <span class="draft" id="ce-draft"></span>
          <button class="undo" type="button" data-ce-act="undo" id="ce-undo">${_cet('ce_undo')}</button>
          <span class="g"></span>
        </div>
      </div>
      <aside class="ce-rail">
        <div class="ce-ah">
          <span class="sp">&#10022; ${_cet('ce_copilot')}</span>
          <span class="ce-tabs" id="ce-tabs" role="group"
            aria-label="${_ceea(_cet('ce_tabs_group'))}">
            <button type="button" data-ce-tab="chat">${_cet('ce_tab_chat')}</button>
            <button type="button" data-ce-tab="scan">${_cet('ce_tab_scan')}<span class="n" id="ce-scan-n"></span></button>
          </span>
        </div>
        <div class="ce-disc"><b>&#10022;</b><span>${_cet('ce_disclaimer')}</span></div>
        <div class="ce-lane" id="ce-lane"></div>
        <div class="ce-chips" id="ce-chips"></div>
        <div class="ce-ask" id="ce-askrow">
          <textarea id="ce-ask" rows="1" aria-label="${_ceea(_cet('ce_ask_label'))}"
            placeholder="${_ceea(_cet('ce_ask_ph'))}"></textarea>
          <button type="button" data-ce-act="ask" aria-label="${_ceea(_cet('ce_send'))}"
            title="${_ceea(_cet('ce_send'))}">${CE_SEND_ICON}</button>
        </div>
        <div class="ce-railfoot" id="ce-railfoot"></div>
      </aside>
      ${''/* ONE picker element, three contents — ink, highlight, size. Three
             elements is three places for a stale one to be left open. */}
      <div class="rb-pop" id="ce-pop" hidden></div>
      ${''/* ---- THE DIVIDER, LAST AND ABSOLUTE ----
             A CHILD of the grid, so it is positioned against the grid's own box
             and moves with it; ABSOLUTE, so it claims no track and no row and
             the rail still runs floor to ceiling. Written last only so it paints
             over the seam.

             A SEPARATOR NOBODY CAN REACH IS A CONTROL HALF THIS WORKSPACE DOES
             NOT HAVE — role, orientation, a tab stop and the arrows in
             ceWireSplit, exactly as Key Terms and the negotiation page carry
             them. It shares their wording too, because it is the same act. */}
      <div id="ce-resizer" class="rl-resizer" role="separator" aria-orientation="vertical"
        tabindex="0" aria-label="${_ceea(_cet('ng_drag_width'))}"
        title="${_ceea(_cet('ng_drag_width'))}"><span></span></div>
    </div>
  </div>`;
}


/* ============================================================================
   THE DIVIDER
   ----------------------------------------------------------------------------
   (owner-asked 26 Aug 2026: the negotiation page's draggable divider, here, with
   the same limit going right to left — and a stated worry that a previous
   attempt at this broke the page.)

   IT IS A PORT, NOT A SECOND IMPLEMENTATION, and that is the whole of why it is
   safe. Key Terms did this same port from rlLayoutResizer / rlWireResizer and
   has held since; this is that, again, so what follows is the same five
   properties in the same order. Each was learned the hard way and each is a
   separate way for a divider to feel broken:

     1  ONE DESCRIPTION OF THE GEOMETRY, asked for by both halves. When the
        layout and the drag described the page differently, one pixel of pointer
        bought less than one pixel of column and the handle fell hundreds of
        pixels behind the cursor.
     2  THE DRAG READS WHERE THE POINTER IS, never how far it has travelled.
        Travelled distance creates a dead band at the limits — push past the end
        and drag back, and nothing happens until the whole overshoot is retraced
        (279px of nothing, measured) — so the control reads as broken precisely
        when somebody is pushing hardest at it.
     3  A GRAB OFFSET, so taking hold of the handle anywhere along its width does
        not jump the boundary under the cursor.
     4  THE GRID IS OBSERVED, not guessed at. The window, the nav opening and
        closing, the layer being re-fitted — all resize this grid and none of
        them announces it. No feedback loop: this writes the grid's TRACKS and
        never its width.
     5  AN UNMEASURED GRID IS NOT MEASURED. A width of zero is not a width, and
        writing 0px would collapse a layout the CSS is holding perfectly well.

   AND ONE THING THIS PAGE NEEDS THAT THE NEGOTIATION PAGE DOES NOT: its stacking
   rule carries no !important, so an inline column written on a wide window and
   left behind would BEAT it and crush the stacked layout. ceStacked clears them,
   which is Key Terms' own answer to its own version of this.

   THE GEOMETRY DIFFERS IN EXACTLY ONE VALUE. The negotiation grid has a 14px gap
   track and subtracts it; this grid has none — its two columns touch and the
   rail's border is the seam — so the available width IS the grid's width, and
   the handle straddles the seam rather than sitting in a gap. Subtracting a gap
   that is not there is precisely how the two halves come to disagree.
   ========================================================================== */
/* THE LEFT-HAND LIMIT IS THE NEGOTIATION PAGE'S, TO THE NUMBER — owner-asked
   ("I want the limitation in dragging right to left to be identical"). Both of
   its stops are carried, because on a wide window the FRACTION binds first and
   on a narrow one the pixel floor does, and honouring one without the other
   would match it at some widths and not others.

   THE OTHER DIRECTION IS THIS PAGE'S OWN, and it is said out loud rather than
   quietly matched: the negotiation page lets its right-hand column go to 300px
   and the Copilot rail is built to 340 — it holds a chat box, the suggestion
   chips and two buttons. Matching 300 there would squeeze a column the owner
   did not ask to change. */
const CE_FMIN = 0.45, CE_FMAX = 0.80, CE_F0 = 2 / 3;
const CE_LEFT_MIN = 380, CE_RIGHT_MIN = 340;
const CE_SPLIT_KEY = 'hati.v1.ceLeftFrac';
/* ITS OWN MEMORY, deliberately. The negotiation page's divider sets how much
   room the change column gets; this one sets how much Copilot gets. Sharing the
   key would move one page's split by working on the other. */
function _ceLeftFrac(){
  try{ const v = Number(localStorage.getItem(CE_SPLIT_KEY));
    return (v >= CE_FMIN - 0.001 && v <= CE_FMAX + 0.001) ? v : CE_F0; }
  catch(_){ return CE_F0; }
}
/* One geometry, asked for once — see property 1 above. */
const _ceAvail = grid => grid.clientWidth;
/* Stacked below 1023px, which is this page's own stylesheet number and the same
   one clauseEditorFits asks before offering the page at all. Asked of the WINDOW
   rather than inferred from a width, so the two cannot drift apart. */
function ceStacked(){
  try{ return !!(window.matchMedia && window.matchMedia('(max-width:1023px)').matches); }
  catch(_){ return false; }
}
/* COUNTING IS NOT DRAWING, and here it earns its place twice over: the LIMITS
   are the whole of what the owner asked to be identical, and a browser is the
   only place clientWidth is a number — so the arithmetic answers on its own and
   can be proved without one.

   BOTH STOPS IN BOTH DIRECTIONS. The fraction binds on a wide window and the
   pixel floor on a narrow one, and the pixel pair is applied only where there is
   room for both: on a window too narrow to give each column its minimum, a
   floor would push the other pane past its own. */
function ceSplit(avail, frac){
  const f = Math.max(CE_FMIN, Math.min(CE_FMAX,
    typeof frac === 'number' && isFinite(frac) ? frac : _ceLeftFrac()));
  let left = Math.round(f * avail);
  /* ---- WHICH STOP IT IS AT COMES OUT OF THE SAME CLAMP ----
     Found by dragging it in a real browser: read off the PIXEL floors alone the
     grip stayed grey at the 45% stop, because on a wide window the FRACTION is
     what binds and the pixel floor is nowhere near. So the divider stopped and
     said nothing — which is the one thing the negotiation page's own note says
     a splitter at its limit must not do. Both stops answer here, from the one
     arithmetic, so the mark and the position cannot disagree about where the
     end is. */
  let limit = f <= CE_FMIN ? 'min' : f >= CE_FMAX ? 'max' : null;
  if (avail >= CE_LEFT_MIN + CE_RIGHT_MIN){
    if (left <= CE_LEFT_MIN){ left = CE_LEFT_MIN; limit = 'min'; }
    else if (left >= avail - CE_RIGHT_MIN){ left = avail - CE_RIGHT_MIN; limit = 'max'; }
  }
  return { left, limit };
}
const ceSplitLeft = (avail, frac) => ceSplit(avail, frac).left;
function ceFitSplit(scope){
  const root = (scope && scope.querySelector) ? scope : document;
  const grid = root.querySelector('#clause-editor .ce-grid');
  const rez = grid && grid.querySelector('#ce-resizer');
  if (!grid || !rez) return;
  if (ceStacked()){
    grid.style.gridTemplateColumns = '';
    rez.removeAttribute('data-rl-at-limit');
    return;
  }
  const avail = _ceAvail(grid);
  if (avail < 160) return;                       /* property 5 */
  const { left, limit } = ceSplit(avail);
  grid.style.gridTemplateColumns = left + 'px minmax(0,1fr)';
  rez.style.left = left + 'px';
  /* AND IT SAYS WHEN IT WILL NOT GO FURTHER. Reaching a limit is legitimate;
     reaching it in silence is not — the handle simply stops following the
     cursor with nothing on screen to say why, and the control reads as broken
     exactly when somebody is pushing hardest at it. */
  if (limit) rez.setAttribute('data-rl-at-limit', limit);
  else rez.removeAttribute('data-rl-at-limit');
}
function ceWireSplit(){
  const grid = document.querySelector('#clause-editor .ce-grid');
  const rez = grid && grid.querySelector('#ce-resizer');
  if (!grid || !rez) return;
  ceFitSplit(document);
  /* BOUND ONCE PER ELEMENT. The page is built and removed whole, so this is
     usually a fresh handle — but a second call within one mount would drag the
     split twice per pointer move, and the flag costs nothing. */
  if (rez.dataset.ceSplitBound) return;
  rez.dataset.ceSplitBound = '1';
  const clamp = f => Math.max(CE_FMIN, Math.min(CE_FMAX, f));
  const save = f => { try{ localStorage.setItem(CE_SPLIT_KEY, String(f)); }catch(_){} };
  let grabDx = 0;
  const pointerFrac = x => {
    const r = grid.getBoundingClientRect();
    const avail = Math.max(1, _ceAvail(grid));    /* property 1 */
    return clamp(((x + grabDx) - r.left) / avail);
  };
  const onMove = e => {
    const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    save(pointerFrac(x));                          /* property 2 */
    ceFitSplit(document);
  };
  const onUp = () => { delete rez.dataset.drag;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp); };
  rez.addEventListener('pointerdown', e => { e.preventDefault();
    rez.dataset.drag = '1';
    const hb = rez.getBoundingClientRect();
    grabDx = (hb.left + hb.width / 2) - e.clientX; /* property 3 */
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp); });
  /* One step is 2% of the grid — a few pixels, enough to be useful and small
     enough not to jump. It writes the SAME store the drag writes and re-runs the
     SAME layout, so there is no second opinion about where the split is. */
  rez.addEventListener('keydown', e => {
    if (e.key === 'Home' || e.key === 'Enter'){
      e.preventDefault(); save(CE_F0); ceFitSplit(document); return;
    }
    const step = e.key === 'ArrowLeft' ? -0.02 : e.key === 'ArrowRight' ? 0.02 : 0;
    if (!step) return;
    e.preventDefault();
    save(clamp(_ceLeftFrac() + step));
    ceFitSplit(document);
  });
  rez.addEventListener('dblclick', () => { save(CE_F0); ceFitSplit(document); });
  /* Property 4. The layer's own fitter writes this page's BOX from the shell's
     scroller; this writes the grid's TRACKS. Different elements, different
     properties, no loop — and the first tells the second by resizing the grid. */
  if (typeof ResizeObserver === 'function' && !grid._ceObs){
    try{ grid._ceObs = new ResizeObserver(() => ceFitSplit(document));
      grid._ceObs.observe(grid); }catch(_){}
  }
  if (typeof window !== 'undefined' && !window._ceResizeBound){
    window._ceResizeBound = true;
    window.addEventListener('resize', () => ceFitSplit(document));
  }
}

/* ============================================================================
   OPENING AND CLOSING
   ----------------------------------------------------------------------------
   The page is mounted on demand and removed on close: the DOM cost is zero
   when nobody is in it, and there is no half-built page for another renderer
   to walk into. The negotiation page underneath is NOT repainted on the way in
   — the reader's place in the contract is the one thing they were holding on
   to — and the clause panel they came from is still standing behind this, so
   closing lands them exactly where they started.
   ========================================================================== */
/* ---- THE PAGE IS FITTED TO THE CONTENT AREA, MEASURED (owner-asked 25 Aug
   2026 — see the stylesheet's note at #clause-editor) ----
   #content-scroll is the shell's own content box: below the top bar, right of
   whatever the nav currently is. Reading its rect is what makes this right in
   all three nav states without a number typed anywhere, and it is the pattern
   this page already uses for every other geometry (_rlAvail, regFitBandOffset,
   ktFitSplit).
   A BOX OF ZERO IS NOT A BOX — the standing rule. If the scroller has not been
   laid out yet the page keeps inset:0 and the next observation corrects it,
   which is strictly better than pinning it to nothing. */
function ceFitToShell(){
  if (typeof document === 'undefined') return;
  const page = document.getElementById('clause-editor');
  const sc = document.getElementById('content-scroll');
  if (!page || !sc || !page.style || !sc.getBoundingClientRect) return;
  const r = sc.getBoundingClientRect();
  if (!(r.width > 0 && r.height > 0)) return;
  page.style.inset = 'auto';
  page.style.left = Math.round(r.left) + 'px';
  page.style.top = Math.round(r.top) + 'px';
  page.style.width = Math.round(r.width) + 'px';
  page.style.height = Math.round(r.height) + 'px';
}
/* OBSERVED, NOT MEASURED ONCE. The rail opens and closes, the window resizes,
   and the float line moves the nav in and out of the page's flow — every one of
   those resizes the scroller and none of them tells this page. Bound ONCE on
   the element (the dataset flag), because rlOpenClauseEditor runs on every
   opening and a second observer per opening is a listener stack. */
function ceObserveShell(){
  if (typeof document === 'undefined' || typeof ResizeObserver === 'undefined') return;
  const sc = document.getElementById('content-scroll');
  if (!sc || !sc.dataset || sc.dataset.ceFitBound) return;
  sc.dataset.ceFitBound = '1';
  try{ new ResizeObserver(() => ceFitToShell()).observe(sc); }catch(_){}
}

function rlOpenClauseEditor(c, clauseId, opts = {}){
  const refusal = clauseEditorRefusal(c, opts);
  if (refusal){ if (window.toast) toast(refusal, 'err'); return false; }
  const probeC = c, probeId = String(clauseId || '');
  if (!probeId){ if (window.toast) toast(_cet('ce_no_clause'), 'err'); return false; }
  _ceC = probeC; _ceClauseId = probeId; _ceOpts = opts || {};
  try{ _ceRead0 = window.rlReadMode ? rlReadMode() : null; }catch(_){ _ceRead0 = null; }
  _ceAgain = typeof opts.again === 'function' ? opts.again
    : (window.renderRedline ? () => renderRedline() : () => {});
  const cl = ceClause();
  if (!cl){
    _ceC = null; _ceClauseId = null;
    if (window.toast) toast(_cet('ce_clause_gone'), 'err');
    return false;
  }
  _ceBase = ceStanding();
  _ceLead = ceLeadChange(opts.changeId);
  _ceText = ceWordingOf(_ceLead);
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase }];
  if (_ceText !== _ceBase) _ceSteps.push({ label: (_ceLead && _ceLead.id) || _cet('ce_proposed'), text: _ceText });
  _ceStep = _ceSteps.length - 1;
  _ceOpenText = _ceText;   /* the mark clauseEditorDirty measures against */
  _ceSavedAt = _ceText !== _ceBase ? ceNowHm() : null;
  /* THE CLAUSE YOU CAME IN ON OPENS TYPEABLE. This page was pressed to change
     wording; arriving on a read-only contract and having to find the pencil
     first is a step nobody asked for. It stands down by itself on a reading
     that refuses editing — ceEditableReading is asked at the paint. */
  _ceEditing = true;
  _ceTab = opts.tab === 'scan' ? 'scan' : 'chat';
  _ceThread = []; _ceBusy = false; _ceScanBusy = false; _ceScanErr = null; _ceSel = null;
  _ceScan = null; _ceScanFiled = {};

  ceEnsureStyle();
  /* ---- THE PAPER'S OWN SHEET, ASKED FOR RATHER THAN ASSUMED ----
     The middle of this page is redlineDocHtml's output and its rules live in
     the negotiation page's two stylesheets, scoped to .redline-page. Both are
     injected into <head> and both are idempotent, so asking here costs nothing
     on the ordinary route (this page is reached from the negotiation page,
     which has already injected them) and is what stops a stage that mounts
     this page alone drawing a contract with no rules on it. */
  try{ if (window.negoEnsureStyle) negoEnsureStyle(); }catch(_){}
  try{ if (window.redlineLayoutCss) redlineLayoutCss(); }catch(_){}
  const old = document.getElementById('clause-editor');
  if (old) old.remove();
  const holder = document.createElement('div');
  holder.innerHTML = clauseEditorHtml();
  const page = holder.firstElementChild;
  document.body.appendChild(page);
  document.body.classList.add('ce-open');
  ceWirePage(page);
  ceFitToShell(); ceObserveShell();
  /* AFTER ceFitToShell, so the first split is measured against the box this
     page actually occupies rather than against one still at its CSS size. */
  ceWireSplit();
  /* The greeting goes in BEFORE the first paint rather than after it — drawing
     an empty lane and then filling it is two paints for one arrival. */
  _ceThread.push({ who: 'ai', greeting: true });
  ceRenderAll();
  /* THE CLAUSE YOU CAME IN ON IS WHAT THIS PAGE IS ABOUT, and on a long
     contract it can be twenty clauses down. Bringing it into view is the whole
     difference between arriving at the clause and arriving at the contract. */
  ceScrollToClause();
  const back = page.querySelector('[data-ce-act="close"]');
  if (back && back.focus){ try{ back.focus({ preventScroll: true }); }catch(_){ try{ back.focus(); }catch(_e){} } }
  return true;
}

function rlCloseClauseEditor(opts = {}){
  const page = document.getElementById('clause-editor');
  if (page) page.remove();
  document.body.classList.remove('ce-open');
  const again = _ceAgain;
  let readMoved = false;
  try{ readMoved = _ceRead0 != null && window.rlReadMode && rlReadMode() !== _ceRead0; }catch(_){}
  _ceRead0 = null;
  _ceC = null; _ceClauseId = null; _ceOpts = null; _ceAgain = null;
  _ceThread = []; _ceSteps = []; _ceStep = 0; _ceSel = null; _ceLead = null;
  _ceOpenText = '';
  _ceBusy = false;
  clearTimeout(_ceSayTimer);
  /* A repaint only where something actually moved. Closing without filing must
     leave the page underneath exactly as it was, scroll position included. */
  if ((opts.repaint || readMoved) && typeof again === 'function'){ try{ again(); }catch(_){} }
}
function ceNowHm(){
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/* ============================================================================
   THE RENDERERS
   ----------------------------------------------------------------------------
   Each paints its own region and nothing else. There is no full-page repaint
   after the first: this page holds a half-typed question in the rail and a
   half-typed reason on the left, and a rebuild would throw both away.
   ========================================================================== */
const _ceQ = sel => { const p = document.getElementById('clause-editor'); return p ? p.querySelector(sel) : null; };

function ceRenderAll(){
  ceRenderBar();
  ceRenderHead(); ceRenderPaper(); ceRenderFoot(); ceRenderTabs(); ceRenderLane(); ceRenderChips();
}

function ceRenderHead(){
  /* NOTHING DRAWS ONCE THE PAGE IS SHUT. An ask that comes back after the
     reader has left, a resize, a stray Apply — each of these reaches a
     renderer, and the ones that read the contract would throw on a null. The
     toast lesson, paid once already in this codebase: a renderer must never
     take an act down with it. */
  if (!clauseEditorOpen()) return;
  const cl = ceClause(), on = ceOnTable();
  const crumb = _ceQ('#ce-crumb');
  if (crumb){
    /* THE WAY BACK LEFT THIS LINE FOR THE RIGHT-HAND ACTS (owner-asked 25 Aug
       2026: "move the back to negotiations button to the right where I have
       highlighted and it should look like the button in image 3"). What stays
       here is what the line is for — which contract, and which clause of it. */
    const name = String((_ceC && (_ceC.name || _ceC.id)) || '').trim();
    crumb.innerHTML =
      `<span>${_cee(name)}</span>`
      + `<span class="sep">&rsaquo;</span>`
      + `<select class="ce-sel" id="ce-sel" aria-label="${_ceea(_cet('ce_which_clause'))}"></select>`;
    const sel = crumb.querySelector('#ce-sel');
    let list = [];
    try{ list = window.negoClauseList ? negoClauseList(_ceC) : []; }catch(_){ list = []; }
    if (!list.length && cl) list = [cl];
    sel.innerHTML = list.map(x => `<option value="${_ceea(x.clauseId)}"${
      x.clauseId === _ceClauseId ? ' selected' : ''}>${_cee(ceClauseLabel(x) || x.clauseId)}</option>`).join('');
  }
  const title = _ceQ('#ce-title');
  if (title) title.textContent = ceClauseLabel(cl) || _cet('ce_this_clause');

  /* Whose move, from the change record and not from a second reading of it. */
  const theirs = on.some(x => x.authorSide === 'counterparty');
  const st = _ceQ('#ce-ostat');
  if (st){
    if (!on.length){ st.className = 'ce-ostat neu'; st.innerHTML = `<i></i>${_cee(_cet('ce_nothing_on_table'))}`; }
    else { st.className = 'ce-ostat ' + (theirs ? 'wait' : 'neu');
      st.innerHTML = `<i></i>${_cee(_cet(on.length === 1 ? 'ce_n_on_table_one' : 'ce_n_on_table_other',
        { n: on.length }))}`; }
  }
  /* The acts a negotiator reaches for while READING — never the ones that
     change the wording. Those are the one act in the rail's foot. */
  const acts = _ceQ('#ce-headacts');
  /* ---- ONE WAY OUT, DRESSED LIKE THE DOOR IT MIRRORS ----
     .ui-btn with the tab-row door's own metrics, because the owner named that
     button as the model. It REPLACES the old Close: both did the same thing,
     and two controls that leave the same page is precisely the duplication
     reported on the contract room the same morning.
     ---- AND PLAYBOOK SCAN HAS GONE FROM THIS ROW (owner-asked 25 Aug 2026:
     "remove the playbook scan on the left because it is a duplicate") ----
     It carried data-ce-tab="scan" — the SAME attribute, the same handler and
     the same act as the Playbook scan tab at the top of the Copilot rail, so
     pressing it changed a panel on the far side of the screen. Nothing is lost:
     the rail's own tab is the one door and it is on screen throughout.
     `.ce-act-plain` went with it — it had no other caller — so a control cannot
     come back wearing a dress nobody remembered writing. */
  if (acts) acts.innerHTML =
    `<button type="button" class="ui-btn ce-back-btn" data-ce-act="close">${
      _cet('ce_back_negotiation')}</button>`;

  const f = _ceLead;
  let round = '';
  try{ round = window.negoRound ? String(negoRound(_ceC)) : ''; }catch(_){ round = ''; }
  const dev = ceDeviationCount();
  const facts = [
    [_cet('ce_f_proposed_by'), f ? (f.author || (f.authorSide === 'counterparty'
      ? (_ceC.counterparty || _cet('ce_other_side')) : _cet('ce_our_side'))) : _cet('ce_nobody_yet')],
    [_cet('ce_f_round'), (f && f.roundN) ? String(f.roundN) : (round || '—')],
    [_cet('ce_f_deviates'), dev ? _cet(dev === 1 ? 'ce_n_rules_one' : 'ce_n_rules_other', { n: dev })
      : _cet('ce_deviates_nothing')],
    [_cet('ce_f_whose_move'), theirs ? _cet('ce_move_yours')
      : (on.length ? (_ceC.counterparty || _cet('ce_other_side')) : _cet('ce_move_nobody'))],
  ];
  const box = _ceQ('#ce-facts');
  /* THE ROOM'S OWN FACET MARKUP, down to the em-dash class it uses for an
     absence — so the two heads cannot come to read differently. */
  if (box) box.innerHTML = facts.map(([k, v]) =>
    `<div class="room-facet"><div class="l">${_cee(k)}</div><div class="v">${
      v === '—' ? '<span class="room-facet-none">&mdash;</span>' : _cee(v)}</div></div>`).join('');

}
/* ---- WHICH ASK THIS EDITOR IS SPEAKING FOR ----
   (owner-asked 26 Aug 2026, off a drawn render: "the name of number of the edit
   plus the something of my own are taking up space from the contract. They
   would maybe go on the far right ... and give space back to the contract.")

   These chips had a full-width strip of their own directly above the paper —
   MEASURED at 40px with its rule, on a page whose middle is meant to be the
   contract. They sit at the right of the readings row now, in space that was
   already empty: measured at a 1500px window, that row had 580px spare and the
   chips need 372.

   THREE THINGS WENT WITH THE STRIP AND NONE OF THEM IS LOST:

     - "On this clause" — the page is about ONE clause and its name is two rows
       above, in the crumb and in the dropdown under it;
     - "Nothing has been proposed on this clause yet" — the crumb already says
       "Nothing on the table" and the fact row says it twice more, under
       Proposed by and Whose move. It was the same fact printed a fourth time;
     - "+ Something of my own" — OWNER-RULED, removed outright. It set this
       editor to speak for no particular ask, so the box opened on the clause as
       it stands rather than on the pending draft. DISCARD DOES EXACTLY THAT in
       one press, and was checked before the chip was deleted; filing is
       unaffected either way, because the funnel folds by side and round rather
       than by which chip is lit. `ce_something_of_my_own`, `ce_on_this_clause`,
       `ce_nothing_proposed_yet` and `.ce-chip-new` are STALE — flag any mention.

   DRAWN NOWHERE when nothing is on the clause, which is what keeps the row the
   height it has always been on the commonest screen of all. */
function ceCtxChipsHtml(){
  return ceOnTable().map(x => {
    const tone = x.authorSide === 'counterparty' ? 'wait' : 'ok';
    return `<button type="button" class="ce-chip${
      _ceLead && _ceLead.id === x.id ? ' is-on' : ''}" data-ce-focus="${_ceea(x.id)}"><i class="${
      tone}"></i>${_cee(x.id)}</button>`;
  }).join('');
}

/* ---- MOVING TO ANOTHER CLAUSE IS ONE ACT, NOT TWO ----
   The crumb's dropdown and the pencil on another clause both mean "work on
   that one instead", and both go through here — a second copy is how the two
   come to disagree about what an unfinished draft costs. Reopening is what
   resets the whole page: the wording, the step stack, the Copilot thread and
   the change this editor is speaking for. */
function ceGoClause(clauseId){
  if (!clauseEditorOpen() || !clauseId || clauseId === _ceClauseId) return;
  const c = _ceC, opts = _ceOpts;
  rlCloseClauseEditor();
  rlOpenClauseEditor(c, clauseId, opts);
}
/* Bring the clause this page is about into the reader's view. Deferred a frame
   for the same reason the caret is: the paper it scrolls inside is written by
   the paint that is still running. */
function ceScrollToClause(){
  const go = () => {
    const host = _ceQ('#ce-doc');
    const box = _ceQ('#ce-clausebody');
    if (!host || !box) return;
    try{
      const sec = box.closest ? box.closest('.rl-clause') : null;
      const target = sec || box;
      const hb = host.getBoundingClientRect(), tb = target.getBoundingClientRect();
      host.scrollTop = Math.max(0, host.scrollTop + (tb.top - hb.top) - 24);
    }catch(_){}
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go); else go();
}
/* The caret goes where the reader just asked to type. Deferred a frame because
   the box it belongs to is written by the paint that is still running. */
function ceFocusTyping(){
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    const box = _ceQ('#ce-clausebody');
    if (!box || !ceIsTyping()) return;
    try{ box.focus({ preventScroll: true }); }catch(_){ try{ box.focus(); }catch(__){} }
  });
}

/* ---- A READING THAT REFUSES EDITING (Phase 4) ----
   'As agreed' and 'With changes' draw the paper WITHOUT its marks, so anything
   typed there would be measured against a document the reader is not being
   shown. That is not a new rule — the negotiation page refuses its change
   column on exactly those two readings, for exactly that reason — and asking
   it in ONE predicate is what stops the pencil, the caret and Apply coming to
   three different answers. */
function ceEditableReading(){
  try{ return !(window.rlReadOnlyReading && rlReadOnlyReading()); }catch(_){ return true; }
}
const ceIsTyping = () => _ceEditing && ceEditableReading();

/* ---- THE PAPER ----
   ONE canvas, and it is the product's own: redlineDocHtml, the same builder the
   negotiation page and the counterparty's page draw. Nothing about a clause is
   re-read here and no mark is written by hand — what this page contributes is
   the body of ONE clause, the one being typed in, whose wording is not on the
   record yet. See the note on liveId in redlineDocHtml for the four properties
   that keeps honest. */
/* ---------- THE PICKERS ----------
   The two colour lists and the size list, in one element. Every option is read
   off RICH_MARK_* — the allowlist itself — so the picker cannot offer a colour
   or a size a stored body may not carry. That is the whole reason the bar lives
   beside the allowlist. */
function ceOpenPicker(anchor, kind){
  const pop = _ceQ('#ce-pop');
  if (!pop || !anchor) return;
  if (!pop.hidden && pop.getAttribute('data-kind') === kind){ ceClosePicker(); return; }
  const esc = _ceea;
  let html = '';
  if (kind === 'size'){
    const now = ceSizeNow();
    pop.className = 'rb-pop rb-pop-sizes';
    html = (window.RICH_SIZES || []).map(n =>
      `<button type="button" data-ce-size="${n}"${n === now ? ' class="on"' : ''}>${n}</button>`).join('');
  } else {
    const list = kind === 'hl' ? (window.RICH_MARK_HLS || []) : (window.RICH_MARK_INKS || []);
    const pre = kind === 'hl' ? 'hati-hl-' : 'hati-ink-';
    pop.className = 'rb-pop';
    html = '<div class="rb-pop-row">' + list.map(n => {
      const label = _cet((kind === 'hl' ? 'rb_hl_' : 'rb_ink_') + n);
      return `<button type="button" class="rb-pop-sw ${pre}${n}" data-ce-mark="${pre}${n}"`
        + ` title="${esc(label)}" aria-label="${esc(label)}"></button>`;
    }).join('') + '</div>'
      + `<button type="button" class="rb-pop-none" data-ce-unmark="${kind}">`
      + `${esc(_cet('rb_remove'))}</button>`;
  }
  pop.innerHTML = html;
  pop.setAttribute('data-kind', kind);
  pop.hidden = false;
  /* MEASURED, never guessed: the bar wraps, so which row a button sits on —
     and therefore where its list belongs — is not knowable from the markup. */
  try{
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - pop.offsetWidth - 8)) + 'px';
    let y = r.bottom + 6;
    if (y + pop.offsetHeight > window.innerHeight - 8) y = Math.max(8, r.top - pop.offsetHeight - 6);
    pop.style.top = y + 'px';
  }catch(_){}
}
function ceClosePicker(){
  const pop = _ceQ('#ce-pop');
  if (pop){ pop.hidden = true; pop.removeAttribute('data-kind'); }
}
/* A size with nothing selected sets the WHOLE clause, which is what a reader
   who has not highlighted anything means by it; with a selection it marks just
   those words. Both go through richMarkSelection, so neither can write a class
   the allowlist would strip. */
function ceApplyMark(cls){
  if (!ceIsTyping()){ ceSay(_cet('ce_bar_press_pencil')); return; }
  if (!ceEditableReading()){ ceSay(_cet('ce_reading_only')); return; }
  const box = _ceQ('#ce-clausebody');
  const sel = window.getSelection();
  const wide = /^hati-fs-/.test(cls) && (!sel || !sel.rangeCount || sel.isCollapsed);
  if (wide && box){
    try{
      const r = document.createRange(); r.selectNodeContents(box);
      sel.removeAllRanges(); sel.addRange(r);
    }catch(_){}
  }
  if (window.richMarkSelection && richMarkSelection(cls)) cePullText();
  else ceSay(_cet('rb_pick_first'));
  ceRenderBar();
}

/* ---------- THE BAR ----------
   Repainted with the head, because the size it shows is a fact about where the
   caret is rather than about the page. It is drawn whether or not anything is
   being typed in — a bar that appears and disappears as you move around the
   contract is one nobody can find twice — and a press with no editor open says
   so rather than doing nothing. */
function ceRenderBar(){
  const host = _ceQ('#ce-bar');
  if (!host || !window.richBarHtml) return;
  host.innerHTML = richBarHtml({ shelf: 'full', size: ceSizeNow() });
  /* GREYED WHERE THIS PAGE CAN KNOW BEFORE THE PRESS, which is this product's
     own rule for exactly that — and only these two, because every other tool's
     answer depends on what is selected at the moment it is pressed. */
  const set = (k, off) => {
    const b = host.querySelector('[data-rb="' + k + '"]');
    if (b) b.disabled = !!off;
  };
  set('undo', _ceStep <= 0);
  set('redo', _ceStep >= _ceSteps.length - 1);
}
/* What size is the caret in? The stored size nearest the selection, falling
   back to the base the paper draws its clauses at. */
function ceSizeNow(){
  if (!window.richSizeAt) return CE_SIZE_BASE;
  try{
    const sel = window.getSelection();
    const n = (sel && sel.rangeCount) ? sel.getRangeAt(0).startContainer : null;
    return richSizeAt(n, CE_SIZE_BASE);
  }catch(_){ return CE_SIZE_BASE; }
}
const CE_SIZE_BASE = 14;

function ceRenderPaper(){
  if (!clauseEditorOpen()) return;
  ceRenderReadBar();
  const host = _ceQ('#ce-doc');
  if (!host || !window.redlineDocHtml) return;
  const typing = ceIsTyping();
  /* ---- THE DRAFT ANSWERS THE READING TOO ----
     Typing shows the wording as LINES — a clause carries one sub-paragraph per
     line and that is what the document builder reads back into real numbering
     at filing time. Otherwise it is the SAME question the rest of the paper is
     answering, asked of a draft rather than of a filed change:
       · Redlined   — the draft marked against what stands.
       · As agreed  — what the clause says today. A draft nobody has filed is
                      not in the agreement, so it is simply not there.
       · With changes — the draft, read as ordinary wording.
     A first build ignored this and drew the marks in all three, so the one
     clause on the page the reader is working on was the one clause that did not
     obey the tab they had just pressed. Both clean readings go through the same
     op renderer with the two texts equal, which is how they inherit the
     hanging indents and the sub-paragraph shape the rest of the paper has. */
  let clean = null;
  if (!typing){
    const mode = (window.rlReadMode ? rlReadMode() : 'marks');
    /* THE CLEAN READINGS SHOW THE WORDING AS IT IS DRESSED, which is the whole
       point of asking for them: bold, a size and a colour are invisible in the
       marked reading (it is built from the words that moved) and this is where
       they show. rlHangRichHtml is the paper's own treatment of rendered
       markup, so the sub-paragraph shape and the hanging indents are the same
       here as everywhere else it draws. */
    const dress = h => (window.rlHangRichHtml ? rlHangRichHtml(h) : h);
    if (mode === 'agreed') clean = dress(_ceBase);
    else if (mode === 'proposed') clean = dress(_ceText);
  }
  const body = typing
    ? `<div class="nego-body ce-typing" id="ce-clausebody" contenteditable="true"
        role="textbox" spellcheck="true">${window.sanitizeRich ? sanitizeRich(_ceText) : _ceText}</div>`
    : `<div class="nego-body" id="ce-clausebody">${
        clean == null ? ceRedlineHtml(_ceBase, _ceText) : clean}</div>`;
  /* The reader's place on the page is the one thing they are holding on to, so
     a repaint on every keystroke's worth of Apply must not throw it away. */
  const keep = host.scrollTop;
  let html = '';
  try{
    html = redlineDocHtml(_ceC, {
      side: 'owner',
      canEdit: true,
      noAi: true,
      live: { clauseId: _ceClauseId, html: body },
      /* THE PENCIL IS THE PRODUCT'S OWN and this page only says what its own
         one does: here it turns typing on and off, and on another clause it
         moves the page to that clause. */
      pill: { attr: 'data-ce-pencil', pressed: typing ? _ceClauseId : '',
        label: cl => (String(cl.clauseId) !== String(_ceClauseId)) ? _cet('ce_pencil_move')
          : (typing ? _cet('ce_pencil_stop') : _cet('ce_pencil')),
        title: cl => (String(cl.clauseId) !== String(_ceClauseId)) ? _cet('ce_pencil_move')
          : (typing ? _cet('ce_pencil_stop_title') : _cet('ce_pencil_title')) },
    });
  }catch(e){ html = ''; }
  host.innerHTML = html || `<p class="rl-clause-p">${_cee(_cet('ce_this_clause'))}</p>`;
  host.scrollTop = keep;
}

/* The three readings, the band that says a reading refuses editing, and the
   count. One row, painted together because they are one statement about how
   this page is being read. */
function ceRenderReadBar(){
  const bar = _ceQ('#ce-readbar');
  if (bar && window.rlReadSegsHtml){
    const n = ceCounts(_ceBase, _ceText);
    const stat = (n.ins || n.del)
      ? `<span class="i">+${n.ins}</span> <span class="d">&minus;${n.del}</span>`
      : `<span class="ce-none">${_cee(_cet('ce_no_change_yet'))}</span>`;
    /* The chips sit INSIDE the running +N -N rather than outside it: that
       readout is where the reader's eye already goes for what their typing is
       doing, and moving it would cost more than the row gains. */
    bar.innerHTML = rlReadSegsHtml() + `<span class="g"></span>`
      + ceCtxChipsHtml()
      + `<span class="ce-stat" id="ce-stat">${stat}</span>`;
  }
  const band = _ceQ('#ce-band');
  if (band) band.innerHTML = window.rlReadNoticeHtml ? rlReadNoticeHtml({ on: true }) : '';
}
/* A clause's text carries ONE SUB-PARAGRAPH PER LINE, and that is what the
   document builder reads back into real numbering at filing time. So the
   editor shows and returns lines, never one run-together paragraph. */
function ceLinesHtml(text){
  const lines = String(text == null ? '' : text).split(/\n/);
  const out = lines.map(l => `<p>${_cee(l) || '<br>'}</p>`).join('');
  return out || '<p><br></p>';
}
function cePullText(){
  const box = _ceQ('#ce-clausebody');
  if (!ceIsTyping() || !box) return;
  /* SANITISED ON THE WAY OUT, exactly as the clause panel's editor is: what
     leaves this box is a stored body, and the allowlist is what decides what a
     stored body may carry. Reading textContent here is what used to throw the
     reader's bold and bullets away on every keystroke. */
  const raw = String(box.innerHTML || '');
  const next = window.sanitizeRich ? sanitizeRich(raw) : raw;
  if (next === _ceText) return;
  ceApply(next, _cet('ce_step_typed'), { keepView: true });
}

function ceRenderFoot(){
  if (!clauseEditorOpen()) return;
  const moved = _ceText !== _ceBase;
  /* ---- THE ACTS STAND DOWN WITH THE CARET (Phase 4) ----
     A page whose band says "This page is not editable" over a live Save button
     is a page arguing with itself. Undo, Discard and File all act on the draft,
     and the reading that refuses the caret refuses them for the same reason —
     the reader cannot see what they would be committing, because the marks are
     off. GREYED, NOT HIDDEN, with the reason on the hover: this page can know
     before the press, which is the product's own rule for exactly that, and the
     way forward is on the band directly above the paper.
     The cost is one press — go back to Redlined and file from the reading that
     shows you what you are filing — and it is the honest one. */
  const live = ceEditableReading();
  const why = live ? '' : ` title="${_ceea(_cet('ce_reading_only'))}"`;
  const off = live ? '' : ' disabled';
  const draft = _ceQ('#ce-draft');
  if (draft) draft.innerHTML = moved
    ? _cet('ce_draft_saved', { at: `<b>${_cee(_ceSavedAt || ceNowHm())}</b>` })
    : _cee(_cet('ce_no_changes_yet'));
  const undo = _ceQ('#ce-undo');
  if (undo){
    undo.disabled = _ceStep === 0 || !live;
    if (live) undo.removeAttribute('title'); else undo.setAttribute('title', _cet('ce_reading_only'));
  }
  const foot = _ceQ('#ce-railfoot');
  if (foot) foot.innerHTML =
    `<button type="button" data-ce-act="discard"${moved && live ? '' : ' disabled'}${why}>${_cet('ce_discard')}</button>`
    + `<button type="button" class="p" data-ce-act="save"${moved && live ? '' : ' disabled'}${why}>${
      _ceLead ? _cee(_cet('ce_save_to', { id: _ceLead.id })) : _cee(_cet('ce_file_as_change'))}</button>`;
}

function ceSay(msg){
  const el = _ceQ('#ce-say'); if (!el) return;
  clearTimeout(_ceSayTimer);
  el.textContent = msg; el.classList.add('is-on');
  _ceSayTimer = setTimeout(() => { try{ el.classList.remove('is-on'); }catch(_){} }, 3200);
}

/* ============================================================================
   APPLY — THE ONE WAY WORDING MOVES
   ----------------------------------------------------------------------------
   Every route into the lower box goes through here: a Copilot suggestion, a
   playbook standard, a passage rewritten in place, and the reader's own typing.
   That is what makes the redline underneath honest — it is recomputed from the
   two texts every time, so it cannot describe a route it did not take.

   IT STACKS. Applying twice and stepping back once is the whole point of
   keeping the list rather than one previous value.
   ========================================================================== */
function ceApply(text, label, opts = {}){
  if (!clauseEditorOpen()) return false;
  if (text == null) return false;
  /* ---- NOT ON A READING THAT HIDES THE MARKS (Phase 4) ----
     'As agreed' and 'With changes' draw the paper without its marks, so wording
     applied there would move under a reader who cannot see it move. The pencil
     and the caret already stand down; this is the third door into the wording —
     a Copilot card, a playbook standard, a passage rewritten in place — and a
     rule enforced in two of three places is not a rule. It REFUSES IN WORDS
     naming the way back, which is on the band directly above the paper. */
  if (!ceEditableReading()){
    ceSay(_cet('ce_reading_only'));
    if (window.toast) toast(_cet('ce_reading_only'), 'warn');
    return false;
  }
  const next = ceRich(text);
  if (next === _ceText){ ceSay(_cet('ce_already_in_box')); return false; }
  /* Two bodies that project to the same wording and differ only in dressing are
     still a change — the funnel has a formatting-only path for exactly that —
     so this compares the stored form, never the projection. */
  /* The reason was written about the OLD wording — it may not travel with new
     wording nobody has read it against. */
  _ceSteps = _ceSteps.slice(0, _ceStep + 1);
  _ceSteps.push({ label: label || _cet('ce_step_applied'), text: next });
  _ceStep = _ceSteps.length - 1;
  _ceText = next;
  _ceSavedAt = ceNowHm();
  /* Wording that arrived from somewhere else — a Copilot card, a playbook
     standard, a passage rewritten in place — drops out of typing so the marks
     it made are the first thing seen. Typing keeps the caret (keepView). */
  if (_ceEditing && !opts.keepView) _ceEditing = false;
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  if (!opts.quiet) ceSay(_cet('ce_applied'));
  return true;
}
function ceUndo(){
  if (!clauseEditorOpen()) return;
  if (_ceStep <= 0) return;
  _ceStep -= 1;
  _ceText = _ceSteps[_ceStep].text;
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  ceSay(_cet('ce_stepped_back', { label: _ceSteps[_ceStep].label }));
}
/* ---- AND FORWARD AGAIN ----
   The stack has always held the steps ahead of where the reader is standing —
   ceApply truncates them the moment something new is applied, which is what
   makes this safe — and nothing read them. A Redo on the bar with no function
   behind it would have been a dead press, which is the fault this whole change
   set exists to stop, so it is built rather than the button dropped. */
function ceRedo(){
  if (!clauseEditorOpen()) return;
  if (_ceStep >= _ceSteps.length - 1) return;
  _ceStep += 1;
  _ceText = _ceSteps[_ceStep].text;
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  ceSay(_cet('ce_stepped_forward', { label: _ceSteps[_ceStep].label }));
}
function ceDiscard(){
  if (!clauseEditorOpen()) return;
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase }];
  _ceStep = 0; _ceText = _ceBase; _ceSavedAt = null;
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  ceSay(_cet('ce_discarded'));
}

/* ============================================================================
   THE RAIL
   ========================================================================== */
function ceRenderTabs(){
  if (!clauseEditorOpen()) return;
  const page = document.getElementById('clause-editor'); if (!page) return;
  page.querySelectorAll('[data-ce-tab]').forEach(b =>
    b.classList.toggle('is-on', b.getAttribute('data-ce-tab') === _ceTab));
  const n = ceDeviationCount();
  const badge = _ceQ('#ce-scan-n');
  if (badge){ badge.textContent = n ? String(n) : ''; badge.style.display = n ? '' : 'none'; }
  /* The ask box belongs to the conversation. The scan has nothing to be asked. */
  const ask = _ceQ('#ce-askrow'), chips = _ceQ('#ce-chips');
  if (ask) ask.style.display = _ceTab === 'chat' ? '' : 'none';
  if (chips) chips.style.display = _ceTab === 'chat' ? '' : 'none';
}
function ceRenderLane(){
  if (!clauseEditorOpen()) return;
  const lane = _ceQ('#ce-lane'); if (!lane) return;
  if (_ceTab === 'scan'){ lane.innerHTML = ceScanHtml(); lane.scrollTop = 0; return; }
  lane.innerHTML = _ceThread.map(ceTurnHtml).join('')
    + (_ceBusy ? `<p class="ce-work"><i></i>${_cee(_cet('ce_thinking'))}</p>` : '');
  const last = lane.lastElementChild;
  if (last) lane.scrollTop = Math.max(0, last.offsetTop - lane.offsetTop - 4);
}
function ceTurnHtml(t, i){
  if (t.who === 'you') return `<div class="ce-you"><span>${_cee(t.text)}</span></div>`;
  if (t.greeting) return ceGreetingHtml();
  return `<div class="ce-ai">${
    t.text ? `<p class="t">${_cee(t.text)}</p>` : ''}${
    (t.read && t.read.length) ? `<ul class="ce-read">${t.read.map(r =>
      `<li><b>${_cee(r[0])}</b><span>${_cee(r[1])}</span></li>`).join('')}</ul>` : ''}${
    (t.cards || []).map((card, j) => ceCardHtml(card, i, j)).join('')}</div>`;
}
function ceGreetingHtml(){
  const cl = ceClause();
  return `<div class="ce-ai"><p class="t">${_cee(_cet('ce_greeting',
    { clause: ceClauseLabel(cl) || _cet('ce_this_clause') }))}</p></div>`;
}
/* ONE CARD SHAPE, whether it comes from the chat or from the scan, because
   both hand wording to the same Apply. What a card must always carry: what it
   rests on, the wording it proposes marked against what stands, and a way to
   say whether it was any good. */
function ceCardHtml(card, i, j){
  const marked = ceRedlineHtml(_ceText, card.text || '');
  const vote = card.vote || '';
  return `<div class="ce-card">
    <div class="n"><span>${_cee(card.name || _cet('ce_suggestion'))}</span><span class="g"></span>${
      card.chip ? `<span class="chip ${_ceea(card.chipTone || 'wait')}">${_cee(card.chip)}</span>` : ''}</div>
    ${card.line ? `<span class="l">${_cee(card.line)}</span>` : ''}
    ${card.rests ? `<span class="r">${_cee(_cet('ce_rests_on', { on: card.rests }))}</span>` : ''}
    ${card.text ? `<span class="pv">${marked}</span>` : ''}
    <div class="av">
      ${card.text ? `<button type="button" class="p" data-ce-apply="${i}:${j}">${_cet('ce_apply')}</button>` : ''}
      ${card.text ? `<button type="button" data-ce-refine="${i}:${j}">${_cet('ce_refine')}</button>` : ''}
      <span class="g"></span>
      <button type="button" class="ce-vote${vote === 'up' ? ' is-on' : ''}" data-ce-vote="${i}:${j}:up"
        aria-pressed="${vote === 'up' ? 'true' : 'false'}"
        title="${_ceea(_cet('ce_vote_up'))}" aria-label="${_ceea(_cet('ce_vote_up'))}">&#128077;</button>
      <button type="button" class="ce-vote${vote === 'down' ? ' is-on' : ''}" data-ce-vote="${i}:${j}:down"
        aria-pressed="${vote === 'down' ? 'true' : 'false'}"
        title="${_ceea(_cet('ce_vote_down'))}" aria-label="${_ceea(_cet('ce_vote_down'))}">&#128078;</button>
    </div>
  </div>`;
}
function ceRenderChips(){
  if (!clauseEditorOpen()) return;
  const box = _ceQ('#ce-chips'); if (!box) return;
  const on = ceOnTable(), theirs = on.find(x => x.authorSide === 'counterparty');
  const qs = [];
  if (theirs) qs.push(_cet('ce_q_answer', { id: theirs.id }));
  qs.push(_cet('ce_q_softer'), _cet('ce_q_our_standard'), _cet('ce_q_risk'), _cet('ce_q_plain'));
  box.innerHTML = qs.map(q => `<button type="button" data-ce-chip="${_ceea(q)}">${_cee(q)}</button>`).join('');
}

/* ============================================================================
   THE ASK
   ----------------------------------------------------------------------------
   Through copilotPropose — the product's own drafting call, the same one the
   clause panel and the selection menu use. Nothing here is a private channel
   to the model and nothing here files anything: what comes back lands on a
   card, and Apply moves it into the box.

   WHAT IT READ IS OUR OWN READING, NOT THE MODEL'S. The three facts printed
   above the card — the playbook position, what this workspace has settled
   before, what the other side actually asked — are computed here from the
   record and PASSED IN. A model naming its own sources cannot be checked; a
   list built from the record can. It is also what the card's "rests on" line
   quotes, so the basis and the wording travel together.

   ONE CARD PER ASK, and that is a deliberate difference from the approved
   render, which showed two or three ways to answer. Each alternative is a
   separate paid call to the model; asking for a firmer or a plainer version is
   one press on the chips below, so the reader spends that money when they want
   it rather than every time.
   ========================================================================== */
function cePlaybookLine(){
  try{
    const v = ceClauseDeviations();
    return v.length ? _cet('ce_pb_flags', { list: v.map(x => x.category).join(', ') }) : '';
  }catch(_){ return ''; }
}
/* WHICH DEVIATIONS ARE ABOUT THE CLAUSE IN FRONT OF THE READER (owner-asked
   26 Aug 2026, after the commentary bug — see COMMENTARY IS NOT WORDING in
   THE MAP for how it surfaced).

   This read EVERY deviation on the whole contract and handed the categories to
   the model while the reader was editing ONE clause. The sentence was true —
   it said "this contract" — and it was still the wrong thing to say here: on
   Clause 2 the model was shown a Clause 5 concern, noticed the mismatch, and
   wrote that observation where the wording goes. It was right and the product
   had handed it a confusing question.

   THE OTHER TWO FACTS ON THIS LIST WERE ALREADY CLAUSE-SCOPED — cePrecedentLine
   reads this clause's lead change and ceTheirAsk reads this clause's asks — so
   the playbook line was the odd one out rather than this being a new rule.

   IT ASKS rlPbFindClause, THE ONE MATCHER, and never a second copy of "which
   clause is this rule about": the rail beside it locates its findings the same
   way, so the two can never disagree about what belongs here. A deviation the
   matcher cannot place is left out — after the 26 Aug tightening it refuses
   when it is not sure, and attributing an unplaced rule to whichever clause
   happens to be open is the reported fault in quieter clothes.

   WHAT IT COSTS, SAID OUT LOUD: a reader who asks Copilot a whole-contract
   question from inside this page no longer has the other clauses' flags in
   front of it. The Playbook scan tab in the same rail still shows all of them,
   and being told about a rule that is not about this clause is what produced
   the report. */
function ceClauseDeviations(){
  const all = (((_ceC && _ceC.playbook) || {}).verdicts || [])
    .filter(x => x && x.status === 'deviation');
  if (!all.length || !_ceClauseId) return [];
  if (!window.rlPbFindClause) return [];
  return all.filter(v => {
    if (!v.quote) return false;
    try{ const cl = rlPbFindClause(_ceC, v.quote, v.category); return !!cl && cl.clauseId === _ceClauseId; }
    catch(_){ return false; }
  });
}
function cePrecedentLine(){
  const on = ceOnTable(), lead = _ceLead || on[0];
  if (!lead) return '';
  try{
    if (!window.precedentForChange || !window.precedentLine) return '';
    const p = precedentForChange(_ceC, lead);
    return p ? String(precedentLine(p) || '').replace(/<[^>]*>/g, '').trim() : '';
  }catch(_){ return ''; }
}
function ceTheirAsk(){
  const theirs = ceOnTable().find(x => x.authorSide === 'counterparty');
  if (!theirs) return '';
  const why = String(theirs.why || '').trim();
  return why ? _cet('ce_their_ask_why', { id: theirs.id, why }) : _cet('ce_their_ask', { id: theirs.id });
}
function ceReadList(){
  const out = [];
  const pb = cePlaybookLine();
  out.push([_cet('ce_read_playbook'), pb || _cet('ce_read_playbook_none')]);
  const pc = cePrecedentLine();
  if (pc) out.push([_cet('ce_read_precedent'), pc]);
  const ta = ceTheirAsk();
  if (ta) out.push([_cet('ce_read_theirs'), ta]);
  out.push([_cet('ce_read_wording'), _cet('ce_read_wording_v', {
    clause: ceClauseLabel(ceClause()) || _cet('ce_this_clause') })]);
  return out;
}

async function ceAsk(question, opts = {}){
  const q = String(question == null ? '' : question).trim();
  if (!q || _ceBusy) return;
  if (!opts.silent) _ceThread.push({ who: 'you', text: q });
  _ceBusy = true;
  ceRenderLane();

  if (!window.copilotAvailable || !copilotAvailable() || !window.copilotPropose){
    _ceBusy = false;
    _ceThread.push({ who: 'ai', text: _cet('ce_not_connected') });
    ceRenderLane();
    return;
  }
  const cl = ceClause();
  const read = ceReadList();
  /* The conversation so far, so a follow-up ("firmer than that") means what it
     says. Trimmed to the last few turns — the whole history of a long sitting
     is money spent restating what the model already answered. */
  const history = _ceThread.filter(t => t.text).slice(-6)
    .map(t => (t.who === 'you' ? 'Drafter: ' : 'You: ') + t.text).join('\n');
  let res = null, err = null;
  try{
    res = await copilotPropose({
      ask: _cet('ce_prompt_ask'),
      passage: _ceText || _ceBase,
      instruction: q,
      clauseLabel: ceClauseLabel(cl),
      party: (window.contractParty ? contractParty(_ceC) : (window.FIRST_PARTY || '')) || '',
      law: window.jxLaw ? jxLaw() : '',
      playbook: [cePlaybookLine(), cePrecedentLine(), ceTheirAsk()].filter(Boolean).join('\n'),
      history,
    });
  }catch(e){ err = e; }
  _ceBusy = false;
  if (!clauseEditorOpen()) return;      /* the reader left while it was thinking */
  if (err || !res){
    _ceThread.push({ who: 'ai', text: err ? _cet('ce_ask_failed', { why: (err && err.message) || String(err) })
      : _cet('ce_ask_nothing') });
    ceRenderLane();
    return;
  }
  const wording = String(res.proposedText || '').trim();
  const rests = [cePlaybookLine(), cePrecedentLine()].filter(Boolean)[0] || '';
  _ceThread.push({ who: 'ai',
    text: String(res.advice || '').trim(),
    read,
    cards: wording ? [{ name: _cet('ce_suggestion'), chip: _cet('ce_chip_copilot'), chipTone: 'wait',
      line: '', rests, text: wording }] : [] });
  ceRenderLane();
}

/* ============================================================================
   THE PLAYBOOK SCAN, IN THE SAME PANEL
   ----------------------------------------------------------------------------
   The SAME reading the Playbook review panel draws — runPlaybookReview for the
   run, rlPlaybookProposals for what is proposable — narrowed to this clause and
   drawn in this rail's card shape, handing its standards to the same Apply. A
   rule that is MET offers nothing to apply, which is the honest rendering: an
   Apply button that would change nothing is a press that reads as broken.
   ========================================================================== */
const CE_RULE_TONE = { deviation: 'dev', missing: 'miss', aligned: 'ok' };
function ceScanHtml(){
  const rev = _ceScan || (_ceC && _ceC.playbook) || null;
  if (_ceScanBusy) return `<p class="ce-work"><i></i>${_cee(_cet('ce_scan_running'))}</p>`;
  if (!rev) return `<p class="ce-empty">${_cee(_cet('ce_scan_none'))}</p>`
    + ceScanErrHtml()
    + `<div class="ce-rule"><div class="av"><button type="button" data-ce-act="scan-run">${
      _cet(_ceScanErr ? 'ce_scan_again' : 'ce_scan_run')}</button></div></div>`;
  const items = ceScanItems();
  if (!items.length) return `<p class="ce-empty">${_cee(_cet('ce_scan_clean'))}</p>`
    + `<div class="ce-rule"><div class="av"><button type="button" data-ce-act="scan-run">${
      _cet('ce_scan_again')}</button></div></div>`;
  const g = ceScanGroups();
  const head = (key, sub) => `<div class="ce-scan-h">${_cee(_cet(key))}${
    sub ? `<span class="s">${_cee(_cet(sub))}</span>` : ''}</div>`;
  let html = '';
  if (g.here.length)
    html += head('ce_scan_here') + g.here.map((it, k) => ceScanCardHtml(it, k, 'here')).join('');
  if (g.missing.length)
    html += head('ce_scan_missing', 'ce_scan_missing_sub')
      + g.missing.map((it, k) => ceScanCardHtml(it, g.here.length + k, 'missing')).join('');
  return html;
}
/* WHICH WORDINGS A CARD OFFERS, AND WHAT A PRESS DOES WITH ONE. The verb is the
   only difference between the two groups, and it is decided here — once, from
   the group — rather than at each button. A card in `here` fills the box; a card
   in `missing` files a new clause. */
const CE_SCAN_VERBS = {
  here:    { preferred: 'ce_use_standard', fallback: 'ce_use_fallback', draft: 'ce_use_draft' },
  missing: { preferred: 'ce_add_standard', fallback: 'ce_add_fallback', draft: 'ce_add_draft' },
};
function ceScanCardHtml(it, i, group){
  const v = it.v || {};
  const tone = CE_RULE_TONE[v.status] || 'dev';
  /* pbVerdictWords, NEVER pbVerdictLine. This slot takes plain text and the
     line is markup; stripping its tags leaves the entities behind, which is how
     the separator came to be printed here as the five characters "&middot;". */
  const line = window.pbVerdictWords ? String(pbVerdictWords(v)) : String(v.position || '');
  /* ONLY A LOCATED RULE IS DRAWN AS A REDLINE. A rule that matched no clause has
     nothing in this document to mark up, so marking it against whichever clause
     happens to be open is a picture of an edit nobody proposed — which is the
     whole of what was reported. It prints its wording plainly instead. */
  const preview = !it.lead ? ''
    : (group === 'here' ? ceRedlineHtml(_ceText, it.lead) : `<p>${_cee(it.lead)}</p>`);
  /* ONLY WHERE SOMETHING OF THIS CLAUSE IS AT RISK. A rule in the missing group
     replaces nothing — it files a new clause — so a line about what it takes
     away would be a sentence about an act that does not happen. */
  const cost = (group === 'here' && it.lead) ? ceCostLine(_ceText, it.lead) : null;
  const verbs = CE_SCAN_VERBS[group] || CE_SCAN_VERBS.here;
  /* EACH BUTTON CARRIES ITS OWN COST ON ITS HOVER. The visible line under the
     preview describes the wording being SHOWN; a card offering three of them
     would otherwise make the reader press one to find out what it takes. The
     hover is where a control may say more than its name can — the register
     row's own rule — and it costs the card no height. */
  const btn = (kind, words) => {
    if (!words) return '';
    const own = group === 'here' ? ceCostLine(_ceText, words) : null;
    return `<button type="button" data-ce-scan="${i}:${kind}"${
      own ? ` title="${_ceea(own)}"` : ''}>${_cet(verbs[kind])}</button>`;
  };
  const filed = !!_ceScanFiled[ceScanKey(it)];
  return `<div class="ce-rule ${tone}">
    <div class="n"><span>${_cee(v.category || _cet('ce_rule'))}</span></div>
    <span class="l">${_cee(line)}</span>
    ${v.quote ? `<span class="r">${_cee(_cet('ce_scan_quote', { quote: String(v.quote).slice(0, 220) }))}</span>` : ''}
    ${preview ? `<span class="pvk">${_cee(ceWordingLabel(it.leadKind))}</span><span class="pv">${preview}</span>` : ''}
    ${cost ? `<span class="cost">${_cee(cost)}</span>` : ''}
    <div class="av">${filed
      ? `<span class="filed">${_cee(_cet('ce_scan_added_row'))}</span>`
      : btn('preferred', it.preferred) + btn('fallback', it.fallback) + btn('draft', it.draft)}</div>
  </div>`;
}
/* ADDING A MISSING STANDARD IS A REAL FILING, and it goes through the
   negotiation page's own rlFilePlaybookProposal rather than growing a second
   filing path here. That function already knows the two things this page does
   not: where a new clause may land (ahead of the execution wording, never after
   it — text below the signatures can be argued as outside what was signed) and
   what note it carries. Nothing else about this page changes: its own Save
   still goes through negoEditClause on the clause it is open on.

   IT IS A DIFFERENT WEIGHT OF ACT FROM EVERYTHING ELSE ON THIS RAIL, and it
   says so rather than being asked about — every other press here only fills a
   box the reader can still undo, and this one puts a tracked change on the
   record. So the card settles into "Added as a new clause" and the page says
   what happened; the change is a PROPOSAL like any other and is withdrawn from
   the change column if it was a mistake. */
async function ceAddMissingClause(it, words, btn){
  if (!clauseEditorOpen() || !it || it.clauseId) return false;
  if (typeof window.rlFilePlaybookProposal !== 'function'){
    ceSay(_cet('ce_scan_add_unavailable')); return false; }
  if (btn) btn.disabled = true;
  let ch = null;
  try{ ch = await rlFilePlaybookProposal(_ceC, it, words); }
  catch(_){ ch = null; }
  if (!ch){
    if (btn) btn.disabled = false;
    ceSay(_cet('ce_scan_add_failed'));
    return false;
  }
  try{ if (window.persist) persist(_ceC); }catch(_){}
  _ceScanFiled[ceScanKey(it)] = true;
  ceRenderLane();
  ceSay(_cet('ce_scan_added', { name: String((it.v && it.v.category) || '') }));
  return true;
}
/* The one sentence, and it does NOT re-derive why. runPlaybookReview owns the
   reading of whether there is wording to check, and a second copy of that test
   here is the twin-formula fault this codebase records. So the panel reports
   what it can stand behind — the scan came back with nothing — and names the
   usual cause and the way forward as prose rather than as a second verdict. */
function ceScanErrHtml(){
  if (!_ceScanErr) return '';
  return `<p class="ce-empty" role="status"><b>${_cee(_cet('ce_scan_nothing'))}</b><br>${
    _cee(_cet('ce_scan_nothing_why'))}</p>`;
}
async function ceRunScan(){
  if (_ceScanBusy) return;
  if (!window.runPlaybookReview){ ceSay(_cet('ce_scan_unavailable')); return; }
  _ceScanBusy = true; _ceScanErr = null; ceRenderLane();
  let rev = null;
  try{ rev = await runPlaybookReview(_ceC); }catch(_){ rev = null; }
  _ceScanBusy = false;
  if (!clauseEditorOpen()) return;
  /* A review arriving clears the note; nothing arriving IS the note. */
  if (rev) { _ceScan = rev; _ceScanErr = null; }
  else _ceScanErr = 'empty';
  ceRenderLane(); ceRenderTabs(); ceRenderHead();
}

/* ============================================================================
   ONE SENTENCE AT A TIME
   ----------------------------------------------------------------------------
   Highlight a passage in the lower box and a small field opens under it. What
   comes back replaces THAT passage only. The narrowing is done here, on the
   text, and the result goes through the same Apply — so the redline is still
   computed from the two whole texts and the rest of the clause is provably
   untouched.
   ========================================================================== */
function ceSelection(){
  const box = _ceQ('#ce-clausebody'); if (!box || typeof window.getSelection !== 'function') return null;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  if (!box.contains(r.commonAncestorContainer)) return null;
  const text = String(sel.toString() || '').replace(/[^\S\n]+/g, ' ').replace(/\n+/g, ' ').trim();
  if (text.length < 3) return null;
  /* ---- IT HAS TO SIT INSIDE ONE SUB-PARAGRAPH ----
     A clause's text carries one sub-paragraph per LINE and those line breaks
     are what the document builder reads back into real numbering. A passage
     dragged across two of them cannot be replaced without deciding what
     happens to the break between, so it is refused here rather than silently
     run together — the same reasoning that refuses a highlight across two
     clauses on the paper. */
  const lines = ceLines();
  let li = -1, at = -1, seen = 0;
  lines.forEach((ln, i) => {
    const k = ln.indexOf(text);
    if (k < 0) return;
    seen += 1;
    if (li < 0){ li = i; at = k; }
    if (ln.indexOf(text, k + 1) >= 0) seen += 1;
  });
  if (li < 0) return null;
  if (seen > 1 && text.length < 40) return null;   /* ambiguous */
  let rect = null;
  try{ rect = r.getBoundingClientRect(); }catch(_){ rect = null; }
  return { text, rect, line: li, at };
}
/* The wording as LINES, with horizontal runs collapsed and the breaks kept —
   the one reading both the selection and the replacement work in. */
function ceLines(){
  return ceWords(_ceText).split(/\n/).map(l => l.replace(/[^\S\n]+/g, ' ').trim());
}
function ceOpenInline(sel){
  const pop = _ceQ('#ce-inline'); if (!pop || !sel) return;
  _ceSel = sel;
  const chips = _ceQ('#ce-inline-chips');
  if (chips) chips.innerHTML = [_cet('ce_inline_shorten'), _cet('ce_inline_firmer'), _cet('ce_inline_plain')]
    .map(w => `<button type="button" data-ce-inline-chip="${_ceea(w)}">${_cee(w)}</button>`).join('');
  const note = _ceQ('#ce-inline-note'); if (note) note.innerHTML = '';
  /* POSITIONED AGAINST THE FRAME IT HANGS IN, not against the scrolling area
     inside it. The popup is absolute inside .ce-paperwrap; measuring from the
     scroller — which starts inside the frame — put it out by the frame's own
     inset on every open, and measuring from a box that no longer exists put it
     in the corner. */
  const host = pop.parentElement, box = _ceQ('#ce-doc');
  if (host && box && sel.rect){
    const hb = host.getBoundingClientRect();
    const top = Math.max(6, Math.min(sel.rect.bottom - hb.top + 6, hb.height - 46));
    pop.style.top = top + 'px';
    pop.style.left = '12px';
  }
  pop.classList.add('is-on');
  /* THE BOX OPENS CARRYING THE PASSAGE, selected, so the first keystroke either
     replaces it outright or the reader edits in place — which is what a person
     does with a sentence they want changed rather than removed. */
  const ta = _ceQ('#ce-inline-ask');
  if (ta){
    ta.value = sel.text;
    ta.style.height = '';
    try{ ta.focus(); ta.select(); }catch(_){}
    ceInlineFit(ta);
  }
}
/* The box grows with the wording rather than scrolling inside a one-line slot:
   a replacement is a sentence, and a strip that shows three words of it is one
   nobody can proof-read. Capped by the sheet's own max-height. */
function ceInlineFit(ta){
  if (!ta) return;
  try{ ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }catch(_){}
}
function ceCloseInline(){
  const pop = _ceQ('#ce-inline'); if (pop) pop.classList.remove('is-on');
  _ceSel = null;
}
/* ---- THE ONE REPLACEMENT ----
   The passage goes, the wording arrives, and every other line of the clause is
   carried across character for character. ONE reading, because the reader's own
   typing and a Copilot rewrite are the same act on the record and a second copy
   is how the two come to disagree about what a line break costs. */
function ceReplacePassage(sel, wording){
  const note = _ceQ('#ce-inline-note');
  const words = String(wording == null ? '' : wording).replace(/\s+/g, ' ').trim();
  if (!words){ if (note) note.innerHTML = `<p class="bad">${_cee(_cet('ce_inline_say_what'))}</p>`; return false; }
  const lines = ceLines();
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){
    if (note) note.innerHTML = `<p class="bad">${_cee(_cet('ce_inline_moved'))}</p>`;
    return false;
  }
  if (words === sel.text){ ceCloseInline(); return false; }
  lines[sel.line] = ln.slice(0, at) + words + ln.slice(at + sel.text.length);
  ceCloseInline();
  ceApply(lines.join('\n'), _cet('ce_step_passage'));
  return true;
}
/* THE READER'S OWN HAND: what is in the box IS the wording. It does not file —
   the redline appears against what stands and the one act in the rail's foot
   still puts it on the record. */
function ceInlineApply(wording){
  const sel = _ceSel; if (!sel) return false;
  return ceReplacePassage(sel, wording);
}
/* A CHIP ASKS COPILOT AND ANSWERS INTO THE BOX, never into the contract: the
   reader reads the suggestion, edits it if they want to, and presses Enter.
   That is what keeps ONE strip honest — the box always holds the wording that
   is about to be proposed, whoever wrote it. */
async function ceInlineGo(instruction){
  const sel = _ceSel; if (!sel) return;
  const q = String(instruction == null ? '' : instruction).trim();
  const note = _ceQ('#ce-inline-note');
  if (!q){ if (note) note.innerHTML = `<p class="bad">${_cee(_cet('ce_inline_say_what'))}</p>`; return; }
  if (!window.copilotAvailable || !copilotAvailable() || !window.copilotPropose){
    if (note) note.innerHTML = `<p class="bad">${_cee(_cet('ce_not_connected'))}</p>`;
    return;
  }
  if (note) note.innerHTML = `<p class="work">${_cee(_cet('ce_thinking'))}</p>`;
  let res = null, err = null;
  try{
    res = await copilotPropose({
      ask: _cet('ce_prompt_passage'),
      passage: sel.text,
      instruction: q,
      clauseLabel: ceClauseLabel(ceClause()),
      party: (window.contractParty ? contractParty(_ceC) : (window.FIRST_PARTY || '')) || '',
      law: window.jxLaw ? jxLaw() : '',
      playbook: cePlaybookLine(),
    });
  }catch(e){ err = e; }
  if (!clauseEditorOpen() || _ceSel !== sel) return;
  const wording = res ? String(res.proposedText || '').trim() : '';
  if (err || !wording){
    if (note) note.innerHTML = `<p class="bad">${_cee(err
      ? _cet('ce_ask_failed', { why: (err && err.message) || String(err) })
      : _cet('ce_ask_nothing'))}</p>`;
    return;
  }
  /* INTO THE BOX, NOT INTO THE CONTRACT. The strip stays open on the same
     passage, so the reader can read what came back, change it, and press
     Enter — or highlight something else and start again. */
  const ta = _ceQ('#ce-inline-ask');
  if (ta){
    ta.value = wording.replace(/\s+/g, ' ').trim();
    try{ ta.focus(); }catch(_){}
    ceInlineFit(ta);
  }
  if (note) note.innerHTML = `<p class="work">${_cee(_cet('ce_inline_suggested'))}</p>`;
}

/* ============================================================================
   FILING — ONE PRESS
   ----------------------------------------------------------------------------
   REVERSED IN PLACE 28 Aug 2026, owner-asked: "we need to remove the mandate
   for adding why this change for every change. Users can use the notes feature
   to add notes on changes."

   WHAT STOOD HERE: Save did not file — it opened a panel asking "why this
   change?" with Back, Skip and File change, quoting the engine's inline editor
   button for button so one page could not refuse what another permitted. That
   MATCHING is what stands; the two paths still agree, and both are one press
   now. The ANSWER was always skippable; it was the QUESTION that was
   unavoidable, and a pass over a whole contract paid for it once per clause.

   WHAT IS LOST IS SAID OUT LOUD in the engine's own editor beside this one:
   `why` travels to the counterparty and a note does not, so the sentence that
   explained a redline at the moment it was made now has to be typed on purpose
   in the clause panel's note box with the switch thrown to "Send to them". The
   Copilot proposal card keeps its own optional reason field, which is what
   keeps `why` writable at all.

   AND IT FILES THROUGH negoEditClause AND NOTHING ELSE. Same funnel, same
   fingerprint, same desk rule, same review gate. This page has no private way
   into the contract.
   ========================================================================== */
async function ceFile(why){
  if (_ceBusy) return;
  if (_ceText === _ceBase){ ceSay(_cet('ce_nothing_to_file')); return; }
  const c = _ceC, clauseId = _ceClauseId;
  /* ---- ONE EDITOR, TWO KINDS OF ASK ----
     A clause somebody PROPOSED is revised through negoReviseInsert, which files
     the SAME clauseId back through the same funnel: the ask keeps its id, its
     author and its place, its previous wording goes onto revisions[] and a new
     fingerprint is issued. Everything else about this page — the two steps, the
     reason, the Skip, every guard the funnel carries — is the same code either
     way, which is the whole reason it routes here rather than growing a second
     filing path. The panel's own editor branches in exactly these words. */
  const proposed = ceIsProposed();
  const need = proposed ? window.negoReviseInsert : window.negoEditClause;
  if (!need){ if (window.toast) toast(_cet('ce_cannot_file'), 'err'); return; }
  /* Already rich, and already sanitised on its way out of the box — the funnel
     sanitises again on the way in, which is this codebase's standing rule. */
  const html = _ceText;
  const note = _cet('ce_provenance');
  _ceBusy = true;
  let ch = null, err = null;
  try{
    const o = { side: 'owner', author: (_ceOpts && _ceOpts.by) || undefined,
      why: String(why || '').trim() || undefined, note };
    /* The HEADING is not passed: this page writes wording and never the label,
       and negoReviseInsert reads an absent headingText as "leave it as it is"
       rather than as "clear it". */
    ch = proposed ? await negoReviseInsert(c, clauseId, { bodyHtml: html }, o)
      : await negoEditClause(c, clauseId, html, o);
  }catch(e){ err = e; }
  _ceBusy = false;
  if (err){ if (window.toast) toast(_cet('ce_file_failed', { why: (err && err.message) || String(err) }), 'err'); return; }
  if (!ch){
    /* Said IN the page, beside the button that was pressed — a refusal
       delivered off-screen is how a live button reads as a dead one. */
    ceSay(_cet('ce_nothing_changed'));
    if (window.toast) toast(_cet('ng_nothing_changed_no_fp'), 'warn');
    return;
  }
  try{ if (window.negoInvalidateVerification) negoInvalidateVerification(c); }catch(_){}
  try{ if ((!_ceOpts || _ceOpts.persist !== false) && window.persist) persist(c); }catch(_){}
  if (window.toast) toast(_cet('ce_filed', { id: ch.id }), 'ok');
  /* BACK WHERE YOU STARTED: the editor closes and the page underneath repaints
     with the change on it — the column, the contract and the clause panel the
     reader came from, which rlCpPaint puts back up on the same clause. */
  rlCloseClauseEditor({ repaint: true });
  try{ if (window.rlCpSetShown) rlCpSetShown(document, clauseId); }catch(_){}
}

/* ============================================================================
   WIRING
   ----------------------------------------------------------------------------
   Bound to the page's own element when it is built, because the page is built
   and removed as a whole — there is no repaint that could drop a handler and
   no second mount that could claim one. Escape and the window resize are the
   two that must live on document, and they are armed ONCE at module load.
   ========================================================================== */
function ceWirePage(page){
  /* ---- THE WRITING BAR ----
     MOUSEDOWN, PREVENTED. A click would take the selection away before the act
     could reach it — the same reason the clause panel's own bar has used
     mousedown since it was written.

     THE ACTS ARE richBarPress's, not this page's: bold, the lists, the indents,
     the quote and clear-formatting all belong to the shared bar, so the panel's
     editor and this one cannot come to disagree about what a button does. What
     this page keeps is what only it can answer — undo and redo act on ITS draft
     stack, and a press with no editor open needs ITS way forward. */
  const bar = page.querySelector('#ce-bar');
  if (bar) bar.addEventListener('mousedown', ev => {
    const b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    if (b.hasAttribute('data-rb-size-open')){ ceOpenPicker(b, 'size'); return; }
    const pick = b.getAttribute('data-rb-pick');
    if (pick){ ceOpenPicker(b, pick); return; }
    ceClosePicker();
    const k = b.getAttribute('data-rb');
    if (k === 'undo'){ ceUndo(); return; }
    if (k === 'redo'){ ceRedo(); return; }
    if (!ceIsTyping()){ ceSay(_cet('ce_bar_press_pencil')); return; }
    if (!ceEditableReading()){ ceSay(_cet('ce_reading_only')); return; }
    if (window.richBarPress && richBarPress(k)) cePullText();
  });

  /* The picker's own presses. mousedown for the same reason the bar uses it —
     the selection the mark is about must still be there when the mark is made. */
  const pop = page.querySelector('#ce-pop');
  if (pop) pop.addEventListener('mousedown', ev => {
    const b = ev.target && ev.target.closest ? ev.target.closest('button') : null;
    if (!b) return;
    ev.preventDefault(); ev.stopPropagation();
    ceClosePicker();
    const size = b.getAttribute('data-ce-size');
    if (size){ ceApplyMark('hati-fs-' + size); return; }
    const mark = b.getAttribute('data-ce-mark');
    if (mark){ ceApplyMark(mark); return; }
    const un = b.getAttribute('data-ce-unmark');
    if (un){
      const box = _ceQ('#ce-clausebody');
      if (box && window.richUnmark && richUnmark(box, un)) cePullText();
      ceRenderBar();
    }
  });
  /* A picker left open over a page the reader has moved on from is furniture. */
  page.addEventListener('mousedown', ev => {
    if (!ev.target || !ev.target.closest) return;
    if (!ev.target.closest('#ce-pop') && !ev.target.closest('#ce-bar')) ceClosePicker();
  }, true);

  page.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const hit = sel => t.closest(sel);

    /* ---- THE PENCIL ON THE CLAUSE ----
       The product's own control, in its second home. On the clause you are
       working on it turns typing on and off; on any other clause it moves the
       page to that clause, which is what the crumb's dropdown does and is
       deliberately the same act rather than a second one. */
    const pencil = hit('[data-ce-pencil]');
    if (pencil){ ev.preventDefault();
      const id = pencil.getAttribute('data-ce-pencil');
      if (id && id !== _ceClauseId){ ceGoClause(id); return; }
      cePullText();
      _ceEditing = !_ceEditing;
      ceCloseInline(); ceRenderPaper();
      if (ceIsTyping()) ceFocusTyping();
      return; }

    /* ---- THE THREE READINGS ----
       stopPropagation is load-bearing: this attribute is also handled by a
       delegated listener on `document` (the negotiation page's), which would
       set the mode a second time and then repaint the page UNDERNEATH this one
       from a press made on top of it. This page is a body-level layer, so a
       listener on the page itself runs first and can stop it there. */
    const read = hit('[data-rl-read]');
    if (read){ ev.preventDefault(); ev.stopPropagation();
      cePullText();
      if (window.rlSetReadMode) rlSetReadMode(read.getAttribute('data-rl-read'));
      ceCloseInline(); ceRenderPaper(); ceRenderFoot(); return; }

    const tab = hit('[data-ce-tab]');
    if (tab){ ev.preventDefault();
      _ceTab = tab.getAttribute('data-ce-tab') === 'scan' ? 'scan' : 'chat';
      ceRenderTabs(); ceRenderLane(); return; }

    const focus = hit('[data-ce-focus]');
    if (focus){ ev.preventDefault();
      const id = focus.getAttribute('data-ce-focus');
      _ceLead = ceOnTable().find(x => x.id === id) || null;
      ceApply(ceWordingOf(_ceLead), id || _cet('ce_step_stands'), { quiet: true });
      /* The chips live on the READINGS row now, so the row that draws them has
         to be told as well — repainting the head alone left the pressed chip
         unlit. */
      ceRenderHead(); ceRenderReadBar(); return; }

    const chip = hit('[data-ce-chip]');
    if (chip){ ev.preventDefault(); ceAsk(chip.getAttribute('data-ce-chip')); return; }

    const apply = hit('[data-ce-apply]');
    if (apply){ ev.preventDefault();
      const card = ceCardAt(apply.getAttribute('data-ce-apply'));
      if (card) ceApply(card.text, _cet('ce_step_copilot'));
      return; }

    const refine = hit('[data-ce-refine]');
    if (refine){ ev.preventDefault();
      const box = _ceQ('#ce-ask');
      if (box){ try{ box.focus(); }catch(_){} }
      ceSay(_cet('ce_refine_hint')); return; }

    const vote = hit('[data-ce-vote]');
    if (vote){ ev.preventDefault();
      const parts = String(vote.getAttribute('data-ce-vote')).split(':');
      const card = ceCardAt(parts[0] + ':' + parts[1]);
      if (card){ card.vote = card.vote === parts[2] ? '' : parts[2]; ceRenderLane(); }
      return; }

    const scan = hit('[data-ce-scan]');
    if (scan){ ev.preventDefault();
      const parts = String(scan.getAttribute('data-ce-scan')).split(':');
      const it = ceScanItems()[Number(parts[0])];
      if (!it) return;
      const words = String((parts[1] === 'fallback' ? it.fallback
        : parts[1] === 'draft' ? it.draft : it.preferred) || '').trim();
      if (!words) return;
      /* THE VERB FOLLOWS THE FINDING, never the button that was pressed. A rule
         that located THIS clause fills the box and files nothing; a rule that
         located no clause at all has nothing here to replace, so it files a new
         clause instead. One decision, taken from the finding's own clauseId. */
      if (it.clauseId) ceApply(words, _cet('ce_step_playbook'));
      else ceAddMissingClause(it, words, scan);
      return; }

    const inlineChip = hit('[data-ce-inline-chip]');
    if (inlineChip){ ev.preventDefault(); ceInlineGo(inlineChip.getAttribute('data-ce-inline-chip')); return; }

    const act = hit('[data-ce-act]');
    if (!act) return;
    ev.preventDefault();
    switch (act.getAttribute('data-ce-act')){
      case 'close': rlCloseClauseEditor(); break;
      case 'undo': ceUndo(); break;
      case 'discard': ceDiscard(); break;
      /* ONE PRESS FILES. The act keeps its name — every check and both
         browser files reach this button by it — and what changed is where it
         goes. `reason-back`, `reason-skip` and `reason-file` are STALE. */
      case 'save': cePullText(); ceFile(); break;
      case 'ask': {
        const box = _ceQ('#ce-ask');
        if (box && box.value.trim()){ const q = box.value; box.value = ''; box.style.height = ''; ceAsk(q); }
        break;
      }
      /* THE ARROW IS THE ENTER KEY'S TWIN — it applies what is in the box. */
      case 'inline-go': {
        const ta = _ceQ('#ce-inline-ask');
        ceInlineApply(ta ? ta.value : '');
        break;
      }
      case 'scan-run': ceRunScan(); break;
      default: break;
    }
  });

  const which = page.querySelector('#ce-crumb');
  if (which) which.addEventListener('change', ev => {
    const sel = ev.target && ev.target.closest ? ev.target.closest('#ce-sel') : null;
    if (!sel) return;
    ceGoClause(sel.value);
  });

  const ask = page.querySelector('#ce-ask');
  if (ask){
    ask.addEventListener('input', () => {
      ask.style.height = 'auto';
      ask.style.height = Math.max(74, Math.min(200, ask.scrollHeight)) + 'px';
    });
    ask.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && !ev.shiftKey){
        ev.preventDefault();
        if (ask.value.trim()){ const q = ask.value; ask.value = ''; ask.style.height = ''; ceAsk(q); }
      }
    });
  }
  /* ENTER APPLIES THE WORDING; SHIFT+ENTER MAKES A LINE. Bound to the element
     rather than delegated because this box is written into the page once and is
     never rebuilt by a paint — and it is the one control on this page whose
     press is a keystroke rather than a button. */
  const inlineAsk = page.querySelector('#ce-inline-ask');
  if (inlineAsk){
    inlineAsk.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); ceInlineApply(inlineAsk.value); }
    });
    inlineAsk.addEventListener('input', () => ceInlineFit(inlineAsk));
  }

  /* A hand edit is an Apply like any other, taken when the box loses focus —
     so the redline, the counts, the draft line and the file button all follow
     typing exactly as they follow a suggestion. */
  /* The typing box is rebuilt by every paint, so the handler is delegated on
     the page rather than bound to an element a repaint throws away. Capture,
     because blur does not bubble. */
  page.addEventListener('blur', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausebody')) return;
    cePullText(); ceRenderFoot();
  }, true);

  /* ONE SENTENCE AT A TIME — only in the reading, never while typing: a drag
     inside a contenteditable box is somebody selecting words to work on them. */
  page.addEventListener('mouseup', ev => {
    if (ceIsTyping()) return;
    if (ev.target && ev.target.closest && ev.target.closest('#ce-inline')) return;
    setTimeout(() => {
      const sel = ceSelection();
      if (sel) ceOpenInline(sel); else ceCloseInline();
    }, 0);
  });
}
function ceCardAt(key){
  const parts = String(key || '').split(':');
  const turn = _ceThread[Number(parts[0])];
  return (turn && turn.cards) ? turn.cards[Number(parts[1])] || null : null;
}

if (typeof document !== 'undefined' && !document._ceWired){
  document._ceWired = true;
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || !clauseEditorOpen()) return;
    /* A dialog over this page owns Escape first, exactly as the clause panel
       and the round queue defer. */
    const mr = document.getElementById('modal-root');
    if (mr && mr.innerHTML.trim()) return;
    if (_ceSel){ ceCloseInline(); return; }
    rlCloseClauseEditor();
  });
  /* A window dragged below the width where two columns stop making sense: the
     stylesheet stacks them, and this says so once rather than leaving a reader
     to wonder why the page changed shape. */
  window.addEventListener('resize', () => {
    if (!clauseEditorOpen()) return;
    const page = document.getElementById('clause-editor');
    if (page) page.classList.toggle('is-narrow', !clauseEditorFits());
  });
}

Object.assign(window, {
  clauseEditorOpen, clauseEditorClauseId, clauseEditorContract, clauseEditorDirty, clauseEditorCss,
  clauseEditorHtml, clauseEditorRefusal, clauseEditorFits,
  rlOpenClauseEditor, rlCloseClauseEditor,
  ceApply, ceUndo, ceDiscard, ceFile, ceAsk, ceRunScan, ceScanItems, ceScanGroups, ceAddMissingClause,
  ceClauseDeviations, cePlaybookLine,
  ceCostLine, ceWordCount, ceLines,
  ceRedlineHtml, ceCounts, ceReadList, ceRenderAll, ceRenderPaper,
  ceEditableReading, ceGoClause,
  ceFitSplit, ceWireSplit, ceStacked, ceSplit, ceSplitLeft, CE_LEFT_MIN, CE_RIGHT_MIN, CE_FMIN, CE_FMAX, CE_SPLIT_KEY,
});
