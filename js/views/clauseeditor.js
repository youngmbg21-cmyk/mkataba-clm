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
/* ---- AND THE CLAUSE'S NAME, WHICH IS PART OF THE CLAUSE (owner-asked
   28 Aug 2026: "the ability to edit the name of the header") ----
   A contract is cited by its headings, so "3. Payment Terms" proposed as
   "3. Charges" is a change to the agreement and not a caption on a screen. It
   is held beside the wording rather than in a store of its own, and it rides
   the SAME undo stack: a step is "the draft as it stood", and a draft that has
   two parts has to step back in both or Undo would put half of it back. */
let _ceHeadBase = '';       /* the heading AS IT STANDS */
let _ceHead = '';           /* the heading being proposed */
let _ceSteps = [];          /* [{label, text, head}] — Apply stacks, Undo steps back */
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
let _ceRendering = false;   /* the paper is being written over — see ceRenderPaper */
let _ceZoom = 100;          /* how big the page looks — never a font size */
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
let _ceOpenHead = '';
const clauseEditorDirty = () => clauseEditorOpen()
  && (_ceText !== _ceOpenText || _ceHead !== _ceOpenHead);

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
  /* THE HEAD IS THE STRIP NOW — no padding, no border of its own; the row
     inside it carries both. The room-head rules below dress nothing and are
     kept only so a head added here later does not have to rediscover them. */
  .ce-head{flex:none; background:var(--color-surface)}
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
  .ce-bar{display:flex; align-items:center; flex-wrap:wrap; gap:2px}
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
     mention. AND SO IS .ce-back-btn ITSELF since 28 Aug 2026: the header went
     and the way out is the filled square at the end of the strip, dressed by
     .ce-exit. The rule is deleted rather than left dressing nothing. */
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
  /* ---- THE CONTRACT ALONE (owner-reported 28 Aug 2026: the render carried
     this control and the build did not) ----
     ONE COLUMN, and the rail and the divider stand down with it. The rail is
     kept in the DOM rather than torn out, so its Copilot thread, its scan
     results and its scroll position are all still there when the reader comes
     back — and coming back is one press of the same button. */
  #clause-editor.is-wide .ce-grid{grid-template-columns:minmax(0,1fr)}
  #clause-editor.is-wide .ce-rail{display:none}
  #clause-editor.is-wide .ce-grid > .rl-resizer{display:none}
  /* A greyed tool has to LOOK greyed, or it is a live-looking button that does
     nothing — the fault this whole pass is about, in its own clothes. */
  .rb-btn:disabled,.rb-size:disabled{opacity:.38; cursor:not-allowed}
  /* ---- THE WHITE STRIP, AS THE PROTOTYPE DRAWS IT ----
     The tools, then whatever the page has to say, then the way out at the wall.
     It stops at the divider because it lives in the LEFT COLUMN — the owner's
     own instruction, and what keeps the Copilot rail running floor to
     ceiling. */
  .ce-barrow{flex:none; display:flex; align-items:center; gap:var(--s-2);
    min-height:44px; padding:5px 12px; border-bottom:1px solid var(--color-divider)}
  .ce-barg{flex:1; min-width:0}
  .ce-barrow .ce-bar{border:0; padding:0; min-height:0}
  .ce-barrow .ce-say{flex:0 1 auto; min-width:0; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap}
  .ce-exit{flex:none; width:28px; height:28px; display:inline-grid; place-items:center;
    background:var(--accent-ink); border:1px solid var(--accent-ink); color:#fff;
    cursor:pointer; padding:0; border-radius:var(--radius)}
  .ce-exit:hover{background:var(--color-accent-700); border-color:var(--color-accent-700)}
  .ce-exit:focus-visible{box-shadow:var(--focus)}
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
  /* ---- THE SAME GROUND AS THE NEGOTIATION PAGE (owner-asked 28 Aug 2026:
     "this includes the grey lighting in the sides on the panel") ----
     THAT GREY IS NOT A COLOUR ANYBODY CHOSE. .rl-doc paints nothing, so what
     shows beside a sheet capped at --doc-sheet-max is --color-bg, the page's
     own ground. This wrapper painted --color-surface over it and drew a border
     besides, which is the whole of why this page read as a different product
     from the one it opens out of. One declaration removed, not a colour added. */
  .ce-paperwrap{flex:1; min-width:0; min-height:0; display:flex; position:relative}
  .ce-paperwrap .rl-doc{flex:1; min-width:0; min-height:0}
  /* THE CLAUSE BEING TYPED IN, marked so a reader can see at a glance which of
     twenty clauses this page is about. Quiet on purpose: the paper already
     draws its own red margin rule for a clause under change, and a second loud
     marker for one fact is what this rulebook keeps warning about. */
  /* THE ZOOM SCALES THE PAPER AND NOTHING ELSE. Written on the scroller so the
     sheet inside it takes the scale and the strip, the readings row and the
     rail do not — a zoom that grew the furniture would be a text-size stepper
     wearing a percentage. */
  .ce-paperwrap .rl-doc{zoom:var(--ce-zoom, 1)}
  .ce-zoom{flex:none; display:flex; align-items:center; height:26px;
    border:1px solid var(--color-divider); background:var(--color-surface)}
  .ce-zoom button{width:24px; height:24px; background:none; border:0; padding:0;
    font:inherit; font-size:var(--t-meta); color:var(--color-text); cursor:pointer}
  .ce-zoom button[disabled]{opacity:.35; cursor:default}
  .ce-zoom .out{font-family:var(--font-mono); font-size:var(--t-micro);
    color:var(--color-neutral-600); min-width:38px; text-align:center;
    font-variant-numeric:tabular-nums}
  /* ---- NO MARGIN BAR ON THE CLAUSE BEING WORKED ON (owner-asked 29 Aug 2026,
     ringing it: "delete the green line bar on highlighted in the attached") ----
     The live clause's own rule carried a 3px accent bar in the left margin
     and this is where it was. It said WHICH clause is live, and THREE things
     already say that, which is why taking it costs nothing: the dashed frame
     round the wording, the caret sitting in it, and the fact that this page is
     about ONE clause and names it at the top.
     DELETED RATHER THAN MADE TRANSPARENT — a bar drawn in the page's own colour
     still reserves its margin and still has to be ruled out by the next reader.
     Its position:relative went with it and is not needed: the clause is
     already positioned by the redline page's own rl-clause rule in
     negotiation-css.js, and this page's wrapper IS a redline page. (NO
     BACKTICKS IN HERE — this block is CSS inside a JS template literal, and a
     pair of them ends the string and evaluates the words between. Paid a fifth
     time writing this very note, and caught by the linter in one run.)
     That is what the RED
     changed-clause bar hangs off, and that one STAYS — a different mark, saying
     the clause carries a change, drawn on every changed clause in the product
     rather than only on this page's live one. */
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
  /* ---- AND THE CLAUSE'S NAME WEARS THE SAME LINE ----
     It IS the same rule: .ce-headbox adds no colour, no fill and no size of its
     own, so the heading keeps the paper's own heading type and merely gains the
     dashed frame that says where the editable region is. The negative margins
     the wording's box uses would pull the name off the row it shares with the
     pencil, so this one insets instead — the outline sits clear of the words
     either way and nothing on the row moves when it appears. */
  .ce-paperwrap .ce-headbox{padding:2px 4px; margin:0; min-width:60px}
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

  /* ---- THE HIGHLIGHTED PASSAGE, IN THE RAIL (M-1, owner-chose Option A) ----
     It sits between the conversation and the ready-made questions, DIRECTLY
     over the ask box — which is the whole of why Option A was recommended and
     chosen: what is attached and what you are typing are read together, and a
     card pinned to the foot of the rail can neither scroll away nor be left
     attached with no way to release it.

     It takes no flex, so the conversation above it gives up the height and never
     the box below it; and it draws NOTHING when nothing is attached, so the
     ordinary rail is the rail it has always been. NO BACKTICK MAY APPEAR IN A
     COMMENT IN THIS BLOCK — the whole sheet is returned from a template literal,
     so one ends the string and the browser parses the rules after it as code.
     This file's own history records that fault twice; it was paid a third time
     writing this very note.

     THE QUOTE IS CLAMPED TO FOUR LINES and carries the whole passage on its own
     title — a sentence of contract drafting can run to sixty words and the rail
     is not where it is read; the paper twelve pixels to the left is. */
  .ce-rail #ce-scope{flex:none}
  .ce-scope{margin:0 13px 9px; padding:8px 10px;
    background:var(--color-neutral-100); border:1px solid var(--color-divider)}
  .ce-scope .eb{display:flex; align-items:center; gap:6px; font-size:var(--t-figure);
    font-weight:var(--w-title); letter-spacing:.09em; text-transform:uppercase;
    color:var(--accent-ink)}
  .ce-scope .eb b{font-weight:var(--w-title)}
  .ce-scope .eb .g{flex:1; min-width:4px}
  .ce-scope .x{flex:none; width:20px; height:20px; display:inline-grid; place-items:center; padding:0;
    font:inherit; font-size:var(--t-label); background:none; border:0;
    color:var(--color-neutral-600); cursor:pointer}
  .ce-scope .x:hover{color:var(--color-text)}
  .ce-scope q{display:block; margin-top:5px; padding-left:8px; quotes:none;
    border-left:2px solid var(--st-amber-dot);
    font-size:var(--t-label); line-height:1.55; color:var(--color-text);
    display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden}
  .ce-scope .cut{margin-top:7px; height:22px; padding:0 var(--s-2); font:inherit;
    font-size:var(--t-label); font-weight:var(--w-strong); background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--st-ruby-fg); cursor:pointer}
  .ce-scope .cut:hover{border-color:var(--st-ruby-fg)}

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
/* ---- THE CLAUSE'S OWN NAME, AND THE NAME AN ASK PROPOSES FOR IT ----
   Two readings, deliberately separate, exactly as ceStanding and ceWordingOf
   are for the wording: one answers "what does the contract call this clause"
   and the other "what is on the table". A clause with no heading of its own
   answers '' from both, and the box below is not drawn — see ceHeadEditable. */
function ceStandingHeading(){
  const cl = ceClause();
  return String((cl && cl.headingText) || '').trim();
}
function ceHeadingOf(ch){
  if (!ch) return _ceHeadBase;
  const h = String(ch.headingText == null ? '' : ch.headingText).trim();
  return h || _ceHeadBase;
}
/* ---- ONLY WHERE THE DOCUMENT ALREADY HAS ONE, AND THIS IS A REFUSAL ----
   A clause with no heading is an upload that arrived as a wall of paragraphs,
   and in that document HEADINGS DO NOT MARK THE CLAUSES — clauseSegment reads
   one clause per top-level block and the ids sit on paragraphs. Writing a
   heading into it would not rename a clause; it would change how the whole
   document segments, under a reader who asked to change a name. The model
   refuses it too: clauseReplaceHeading finds nothing to rewrite and answers
   null, so the box is simply not drawn where the act cannot work. */
const ceHeadEditable = () => !!_ceHeadBase;

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
/* THE WAY OUT OF WORK MODE, drawn as the prototype draws it: corners pointing
   in, filled, at the end of the strip. It is the only way out now the header
   has gone. */
const CE_LEAVE_ICON = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"'
  + ' stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"'
  + ' aria-hidden="true"><path d="M6 2H2v4M10 14h4v-4M2 10v4h4M14 6V2h-4"/></svg>';

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
    ${''/* ---- NO HEADER. WORK MODE OPENS STRAIGHT INTO THE CONTRACT ----
           REVERSED IN PLACE 28 Aug 2026, owner-ruled against the approved
           prototype: "work mode where all disappears apart from the contract
           and the side panels."

           WHAT STOOD HERE was the room head's own dress — a crumb, the clause
           name, a status chip, a clause dropdown, the way out, and a four-fact
           row — carried forward from the ONE-CLAUSE page this screen replaced.
           MEASURED against the prototype: 132px of header the prototype does
           not draw, so the contract began 231px down where the prototype
           begins it at 92.

           NOTHING IS LOST THAT IS NOT A PRESS AWAY: the facts, the status and
           the clause list are all on the negotiation page this opens from, and
           the way out is the button at the end of the toolbar, where the
           prototype draws it. `#ce-title`, `#ce-crumb`, `#ce-ostat`,
           `#ce-facts`, `#ce-sel`, `#ce-headacts` and `.ce-back-btn` are STALE.

           `#ce-say` STAYS and is the exception: it is where a refusal is
           spoken, and a refusal with nowhere to appear is a dead press. It sits
           on the toolbar's own row now. */}
    <div class="ce-head" id="ce-head">
    ${''/* ---- THE WRITING BAR ----
           INSIDE .ce-head, which is inside the left column — never above
           .ce-grid. A full-width row there pushes the Copilot rail down by its
           own height, which is the one thing this layout was corrected for
           repeatedly, and the comment at the top of this builder says so.
           Drawn by richBarHtml, the product's ONE shelf: the same builder the
           clause panel's inline editor draws, at its 'full' setting. */}
      <div class="ce-barrow">
        <div class="ce-bar" id="ce-bar" role="toolbar"
          aria-label="${_ceea(_cet('ce_bar_label'))}"></div>
        <span class="ce-say" id="ce-say" role="status"></span>
        <span class="ce-barg"></span>
        ${''/* THE WAY OUT, where the prototype draws it: the last thing on the
               strip, filled, corners pointing in. It is the ONLY way out now
               that the header has gone, so it is never conditional. */}
        <button type="button" class="ce-exit" data-ce-act="close"
          title="${_ceea(_cet('ce_leave_work_mode'))}"
          aria-label="${_ceea(_cet('ce_leave_work_mode'))}">${CE_LEAVE_ICON}</button>
      </div>
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
    ${''/* ---- THE STRIP IS RETIRED; THE HIGHLIGHT GOES TO THE RAIL (M-1) ----
           (owner-asked 31 Aug 2026, off three drawn options: *"Let's make it so
           that when I highlight the sentence, it appears in the Copilot screen
           on the right and I can then ask Copilot for what I want. This change
           then eliminates the pop-up strip. To manually make a change, I just
           write the change in the contract as currently designed."* Then, of
           the three: *"Build option A."*)

           WHAT STOOD HERE was a box that opened ON the contract holding the
           passage, with its own send button and its own three asks — so there
           were TWO places to ask Copilot one question about one clause, and
           the louder of them covered the sentence it was about. Its reasoning
           is kept in the rail's own note, because the useful half survives:
           one field, always holding the wording that is about to be proposed,
           whoever wrote it.

           NOTHING TAKES ITS PLACE ON THE PAPER. Replacing a sentence by hand
           is typing over it in the contract, which the contenteditable box has
           done since 26 Aug and which is what the owner asked for in the same
           breath. `.ce-inline` and its five functions are deleted; the two
           readings they rested on — ceSelection and ceReplacePassage — are
           untouched and are what the rail now presses.

           `ce_inline_ph`, `ce_inline_newline`, `ce_inline_cancel`,
           `ce_inline_replace`, `ce_inline_replace_title` and `ce_inline_where`
           are STALE — flag any mention. */}
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
            ${''/* ---- THE CHANGES TAB IS DELETED (owner-asked 28 Aug 2026:
                   "Delete changes tab") ----
                   It was built the same day from the approved prototype — every
                   live change on the record, newest first, each a door to its
                   clause — and the owner looked at it and did not want it.
                   NOTHING IS LOST, which is the condition on removing a
                   surface: every one of those changes is on the negotiation
                   page's own column, in its bands, with its verbs; and the
                   MARKS are on the paper twelve pixels to the left, which is
                   what the Redlined reading is for.
                   DELETED RATHER THAN STUBBED, following Quarter, List and
                   Obligations on the calendar: none of these was exported, so
                   there is no door a third caller could bring one back through.
                   ceFiledList, ceChangesHtml and the ce_tab_changes /
                   ce_changes_none keys are STALE — flag any mention. */}
            <button type="button" data-ce-tab="scan">${_cet('ce_tab_scan')}<span class="n" id="ce-scan-n"></span></button>
          </span>
        </div>
        <div class="ce-disc"><b>&#10022;</b><span>${_cet('ce_disclaimer')}</span></div>
        <div class="ce-lane" id="ce-lane"></div>
        ${''/* ---- WHAT IS ATTACHED, DIRECTLY OVER THE BOX YOU TYPE IN ----
               The passage the reader highlighted on the paper. Painted by
               ceRenderScope and EMPTY when nothing is attached, so this slot
               costs the ordinary rail nothing. */}
        <div id="ce-scope"></div>
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
  /* STACKED, or the contract has the page: both are layouts this function does
     not own, and an inline gridTemplateColumns written here would beat the
     rule that makes them — an inline declaration cannot be overridden by a
     stylesheet without !important, which this codebase has paid for twice. */
  if (ceStacked()){
    grid.style.gridTemplateColumns = '';
    rez.style.left = '';
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
  /* ---- AN EXPLICIT ASK TO TYPE OUTRANKS THE OPENING POSTURE ----
     Set when the reader clicked INTO another clause's words, which is that
     reader saying "type here" as plainly as a pencil press does. It is
     CONSUMED rather than stored: _ceOpts is what every later ceGoClause
     inherits, so left on it one click into the words would silently make every
     later move to another clause open typing too. */
  const wantTyping = !!(opts && opts.typing === true);
  _ceC = probeC; _ceClauseId = probeId; _ceOpts = opts || {};
  if (wantTyping){ _ceOpts = { ..._ceOpts }; delete _ceOpts.typing; }
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
  _ceHeadBase = ceStandingHeading();
  _ceLead = ceLeadChange(opts.changeId);
  _ceText = ceWordingOf(_ceLead);
  _ceHead = ceHeadingOf(_ceLead);
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase, head: _ceHeadBase }];
  if (_ceText !== _ceBase || _ceHead !== _ceHeadBase)
    _ceSteps.push({ label: (_ceLead && _ceLead.id) || _cet('ce_proposed'), text: _ceText, head: _ceHead });
  _ceStep = _ceSteps.length - 1;
  _ceOpenText = _ceText;   /* the mark clauseEditorDirty measures against */
  _ceOpenHead = _ceHead;
  _ceSavedAt = (_ceText !== _ceBase || _ceHead !== _ceHeadBase) ? ceNowHm() : null;
  /* ---- THE PAGE NEVER OPENS IN A STATE THAT HIDES MARKS THAT EXIST ----
     (owner-reported 28 Aug 2026, off a screenshot of this page on Redlined
     with a clause carrying CHG-001 and not one mark on it: "ensure when you
     are in the redlines tab you are able to see the redlines because that is
     the whole purpose of having that tab".)

     WHAT STOOD HERE, and its reasoning is still right for the case it was
     written for: the clause you came in on OPENS TYPEABLE, because this page
     was pressed to change wording and arriving on a read-only contract and
     having to find the pencil first is a step nobody asked for.

     WHAT IT COST is that a typeable box shows the DRAFT — you cannot type into
     a redline — so on a clause that already carries a filed change the reader
     landed on Redlined and the one clause they were looking at was the one
     clause with no marks. The rail beside it showed them perfectly, which is
     what made it read as a fault rather than as a posture.

     SO BOTH DECISIONS STAND, on the one question that separates them: is there
     anything to hide? A clause with nothing on it opens typeable — nothing is
     being kept from anybody and the pencil press is the step nobody asked for.
     A clause whose draft differs from what stands opens SHOWING ITS MARKS, and
     the pencil — on the clause, one press — starts typing.

     It stands down by itself on a reading that refuses editing anyway —
     ceEditableReading is asked at the paint.

     AND AN EXPLICIT ASK STILL WINS (owner-asked 29 Aug 2026). Clicking into a
     clause's words is the reader saying "type here", so it opens typing even
     on a clause carrying marks — nothing is being HIDDEN from somebody who has
     just put their cursor in it. What the rule above still governs is ARRIVAL,
     which is where it was reported. */
  _ceEditing = wantTyping || (_ceText === _ceBase && _ceHead === _ceHeadBase);
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
  /* WHERE A KEYBOARD READER LANDS. It used to be the way out — the first
     control on a page that had a header. With the header gone the way out is
     the LAST thing on the strip, and landing on it means tabbing backwards
     through every writing tool to reach the contract. The paper is what this
     page is for, so that is where arrival puts them. */
  const land = page.querySelector('#ce-doc');
  if (land && land.focus){
    try{ land.setAttribute('tabindex', '-1'); land.focus({ preventScroll: true }); }
    catch(_){ try{ land.focus(); }catch(_e){} }
  }
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
  _ceRendering = false; _ceZoom = 100;
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
  ceRenderHead(); ceRenderPaper(); ceRenderFoot(); ceRenderTabs(); ceRenderLane();
  ceRenderScope(); ceRenderChips();
}

/* ---- THE HEAD DRAWS NOTHING BUT THE TOOLBAR ----
   Kept as a function rather than deleted: it is called from ceRenderAll and
   from ceApply/ceUndo/ceRedo, and a page that stops calling it is a page where
   the next thing added to the head silently never paints. What it USED to draw
   — the crumb, the clause name, the status chip, the clause dropdown, the way
   out and the four facts — went on 28 Aug 2026 when the owner ruled work mode
   should open straight into the contract, as the approved prototype draws it.

   ceClauseLabel, ceDeviationCount and _ceLead all still have other readers; the
   only thing that left is this drawing of them. */
function ceRenderHead(){
  if (!clauseEditorOpen()) return;
  ceRenderBar();
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
/* ---- MOVING TO ANOTHER CLAUSE ASKS BEFORE IT THROWS A DRAFT AWAY ----
   The draft lives in memory until it is filed, so moving off the clause loses
   it — and there are three doors onto this act (the crumb's dropdown, another
   clause's pencil, and a press in another clause's words). The third made the
   gesture CHEAP, and a cheap gesture that silently destroys typing is a worse
   bug than the one it was built to fix.

   IT IS THE PRODUCT'S OWN GUARD, not a second one: clauseEditorDirty is the
   same predicate viewLayersClosed asks when the reader leaves the page
   entirely, and the words are that dialog's own — "Leave this clause?", which
   is what this act does whether or not the page goes with it. Two doors out of
   one draft answering differently is the drift this file keeps warning about.

   NOT DIRTY, NO QUESTION: a reader who has typed nothing is not asked
   anything, which is every ordinary move. */
function ceGoClause(clauseId, extra){
  if (!clauseEditorOpen() || !clauseId || clauseId === _ceClauseId) return;
  const go = () => {
    const c = _ceC, opts = _ceOpts;
    rlCloseClauseEditor();
    rlOpenClauseEditor(c, clauseId, extra ? { ...opts, ...extra } : opts);
  };
  const dirty = (typeof clauseEditorDirty === 'function') && clauseEditorDirty();
  if (!dirty || typeof window === 'undefined' || !window.confirmDialog){ go(); return; }
  confirmDialog({ title: _cet('ce_leave_title'), message: _cet('ce_leave_body'),
    confirmLabel: _cet('ce_leave_go'), cancelLabel: _cet('act_cancel'), danger: true })
    .then(ok => { if (ok) go(); }).catch(() => {});
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
   the box it belongs to is written by the paint that is still running.

   ---- AND WHERE THEY PUT IT, WHERE THAT CAN BE KNOWN (owner-asked 29 Aug
   2026: "Let me just edit like I am in google docs").

   `point` is the screen position of the press that started the typing. The
   node under it is gone by now — turning typing on repaints the paper — so the
   point is re-asked of the NEW layout rather than remembered as an offset into
   the old one, which is what makes it survive a clause that draws marks when
   it is not being typed in and plain wording when it is.

   IT DEGRADES TO THE START OF THE BOX AND NEVER TO NOTHING: an older browser
   with neither reader, a point that lands outside the box because the wording
   reflowed, or a throw of any kind, all end with the box focused. A caret in
   roughly the right place is the ask; a caret nowhere is a dead press. */
function ceFocusTyping(point){
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    const box = _ceQ('#ce-clausebody');
    if (!box || !ceIsTyping()) return;
    try{ box.focus({ preventScroll: true }); }catch(_){ try{ box.focus(); }catch(__){} }
    if (!point || typeof document === 'undefined') return;
    try{
      let range = null;
      if (typeof document.caretRangeFromPoint === 'function'){
        range = document.caretRangeFromPoint(point.x, point.y);
      } else if (typeof document.caretPositionFromPoint === 'function'){
        const pos = document.caretPositionFromPoint(point.x, point.y);
        if (pos && pos.offsetNode){
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
        }
      }
      if (!range || !range.startContainer) return;
      const node = range.startContainer;
      const el = node.nodeType === 1 ? node : node.parentNode;
      if (!el || !box.contains(el)) return;   /* the wording moved under them */
      range.collapse(true);
      const sel = window.getSelection && window.getSelection();
      if (!sel) return;
      sel.removeAllRanges(); sel.addRange(range);
    }catch(_){}
  });
}

/* ---- START TYPING WHERE THE READER IS ----
   The pencil's own on-direction, named once so the press in the words is the
   same act rather than a second one. It REFUSES rather than toggles: this is
   reached from a click inside the wording, where turning typing OFF would be
   the opposite of what the press asked for, and the pencil beside it is still
   what turns it off. Returns whether it did anything, so a caller can fall
   through to the browser's own caret when typing is already on. */
function ceStartTyping(point){
  if (_ceEditing) return false;
  cePullText();
  _ceEditing = !_ceEditing;
  /* THE BAR FOLLOWS, for the reason the pencil's own note gives: its tools
     grey when nothing is typeable, so a start that did not repaint it would
     leave the whole shelf dressed for the state before the press. */
  ceDetachPassage(); ceRenderPaper(); ceRenderBar();
  if (ceIsTyping()) ceFocusTyping(point);
  return true;
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
  /* THE SHARED SHELF AND NOTHING ELSE. The button at the end of the strip is
     the WAY OUT and lives in the markup beside this host rather than inside it,
     because it is not a writing tool and must never grey with them. */
  host.innerHTML = richBarHtml({ shelf: 'full', size: ceSizeNow() });
  /* ---- GREYED WHERE THIS PAGE CAN KNOW BEFORE THE PRESS ----
     This product's own rule for exactly that. There is ONE thing it can know:
     whether anything is typeable at all. With the caret out of the clause —
     the pencil turned off, or a reading that draws no marks — no tool on this
     bar can do anything, and until 28 Aug 2026 each one answered with a short
     line in the head that a reader looking at the paper never saw. From their
     chair that is a dead button, which is what was reported.

     UNDO, REDO AND THE WIDE TOGGLE ARE NOT IN IT: the first two act on the
     draft stack and the third on the page, so all three still work when the
     wording does not. Everything else is a question about a selection, which
     is why only this one thing is answered here and not the rest. */
  const live = ceIsTyping();
  const why = live ? '' : _cet(ceEditableReading() ? 'ce_bar_press_pencil' : 'ce_reading_only');
  host.querySelectorAll('[data-rb],[data-rb-pick],[data-rb-size-open]').forEach(b => {
    const k = b.getAttribute('data-rb');
    if (k === 'undo' || k === 'redo') return;
    b.disabled = !live;
    if (why) b.setAttribute('title', why); else b.removeAttribute('title');
  });
  ceSyncBarSteps();
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
  /* ---- THE CLAUSE'S NAME, IN THE SAME BOX AS ITS WORDING ----
     One editor, one press: the heading is part of the clause the reader opened,
     so it is typed where it sits rather than in a control of its own somewhere
     else on the page. It wears the SAME dashed outline the wording does, which
     is the owner's own 26 Aug ruling about what an editable region on the paper
     should look like, so nothing new is introduced to the sheet's vocabulary.

     ANSWERING THE READING, exactly as the body does: 'As agreed' is the name
     the clause has, 'With changes' the name being proposed, and only the
     redlined reading shows both. Drawn only where the clause HAS a heading —
     see ceHeadEditable for why creating one is refused. */
  const headBox = !ceHeadEditable() ? null
    : typing
      ? `<h4 class="rl-clause-h ce-typing ce-headbox" id="ce-clausehead" contenteditable="true"
          role="textbox" spellcheck="true">${_cee(_ceHead)}</h4>`
      : ceHeadReadHtml();
  /* The reader's place on the page is the one thing they are holding on to, so
     a repaint on every keystroke's worth of Apply must not throw it away. */
  const keep = host.scrollTop;
  let html = '';
  try{
    html = redlineDocHtml(_ceC, {
      side: 'owner',
      canEdit: true,
      noAi: true,
      live: { clauseId: _ceClauseId, html: body,
        ...(headBox == null ? {} : { head: headBox }) },
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
  /* ---- THE WRITE IS FENCED, BECAUSE REPLACING IT BLURS WHAT IS IN IT ----
     The typing box is inside this markup, so writing over it takes the focus
     out of it and fires blur — and this page's blur handler pulls the text and
     applies it, which renders again, over markup that is halfway replaced.
     MEASURED as a real crash on Undo: "The node to be removed is no longer a
     child of this node. Perhaps it was moved in a 'blur' event handler?", and
     from the reader's chair Undo simply did nothing. The flag is what the blur
     handler asks. OWNER-REPORTED 28 Aug 2026. */
  _ceRendering = true;
  try{
    host.innerHTML = html || `<p class="rl-clause-p">${_cee(_cet('ce_this_clause'))}</p>`;
    ceRestoreScroll(host, keep);
  } finally { _ceRendering = false; }
  ceApplyZoom();
}

/* ---- PUTTING A SCROLL BACK IS NOT TRAVELLING TO IT (M-2) ----
   (owner-reported 31 Aug 2026: *"whenever I make change or click in the box,
   the contract moves up then back down to where I was."*)

   THE PAPER IS `#ce-doc`, WHICH IS A `.nego-scroll`, AND THAT RULE IS
   scroll-behavior:smooth — right for every scroll a reader ASKS for, because
   pressing a change card should visibly travel to its clause so the eye can
   follow. It is exactly wrong for restoring a position after a repaint: the
   rebuilt scroller starts at 0, so `el.scrollTop = 1800` under a smooth rule is
   a REQUEST TO ANIMATE from 0 to 1800. That is the whole report — the jump is
   the rebuild and the crawl back down is the restore being read as a journey.

   THE PRODUCT ALREADY SOLVED THIS, on the negotiation page, a fortnight before
   this page was written; its note says so in its own words. This page simply
   never called it. The smooth rule is NOT removed — it is suspended for the
   width of the assignment.

   THE FALLBACK IS THE FIX AGAIN, NEVER THE BARE ASSIGNMENT. A cross-module read
   that falls back to the broken behaviour is how a fix silently reverts, which
   is this codebase's most repeated defect; so where the name is unreachable
   these four lines do the same job rather than putting the bug back. */
function ceRestoreScroll(el, top){
  if (!el || top == null) return;
  if (typeof window !== 'undefined' && window.rlRestoreScroll){ rlRestoreScroll(el, top); return; }
  const prev = el.style.scrollBehavior;
  el.style.scrollBehavior = 'auto';
  el.scrollTop = top;
  el.style.scrollBehavior = prev;
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
      + `<span class="ce-stat" id="ce-stat">${stat}</span>`
      + ceZoomHtml();
  }
  const band = _ceQ('#ce-band');
  if (band) band.innerHTML = window.rlReadNoticeHtml ? rlReadNoticeHtml({ on: true }) : '';
}
/* ---- ZOOM, AND WHY IT IS NOT A FONT SIZE ----
   The size box on the toolbar sets the size of the WORDS and stores it in the
   contract: the other side sees it and so does the signed PDF. This changes how
   big the page looks to THIS READER and nothing in the document. Both exist in
   Word for the same reason they exist here, and the percentage is what keeps
   them apart on screen — a number of pixels beside a number of pixels would be
   two controls nobody can tell apart.

   IT IS NOT PERSISTED. A reading posture for this sitting, like the readings
   themselves; a stored zoom would follow a reader onto a contract they have
   never opened and look like a broken page. */
const CE_ZOOM_MIN = 60, CE_ZOOM_MAX = 200, CE_ZOOM_STEP = 10;
function ceZoomHtml(){
  const z = _ceZoom;
  const b = (act, lab, off) => `<button type="button" data-ce-zoom="${act}"`
    + `${off ? ' disabled' : ''} aria-label="${_ceea(_cet(lab))}"`
    + ` title="${_ceea(_cet(lab))}">${act === 'out' ? '&minus;' : '+'}</button>`;
  return `<span class="ce-zoom">${b('out', 'ce_zoom_out', z <= CE_ZOOM_MIN)}`
    + `<span class="out" id="ce-zoom-val">${z}%</span>`
    + `${b('in', 'ce_zoom_in', z >= CE_ZOOM_MAX)}</span>`;
}
/* The paper's own scale, written where the sheet reads it. A CSS variable
   rather than a repaint: the reader's place, their caret and their selection
   all survive a zoom, which is what makes it feel like Word's. */
function ceSetZoom(next){
  const z = Math.max(CE_ZOOM_MIN, Math.min(CE_ZOOM_MAX, Number(next) || 100));
  if (z === _ceZoom) return;
  _ceZoom = z;
  ceApplyZoom();
  ceRenderReadBar();
}
function ceApplyZoom(){
  /* ON THE WRAPPER, not on the scroller inside it: .rl-doc is the PARENT of
     #ce-doc, so a variable written on the child never reaches the rule that
     reads it — measured, the readout moved and the paper did not. */
  const wrap = _ceQ('.ce-paperwrap');
  if (wrap) wrap.style.setProperty('--ce-zoom', String(_ceZoom / 100));
}

/* A clause's text carries ONE SUB-PARAGRAPH PER LINE, and that is what the
   document builder reads back into real numbering at filing time. So the
   editor shows and returns lines, never one run-together paragraph. */
function ceLinesHtml(text){
  const lines = String(text == null ? '' : text).split(/\n/);
  const out = lines.map(l => `<p>${_cee(l) || '<br>'}</p>`).join('');
  return out || '<p><br></p>';
}
/* ---- THE HEADING WHEN NOBODY IS TYPING IN IT ----
   The same three answers the wording gives, so the clause's name and its words
   never disagree about which reading is on screen. Nothing is drawn where the
   draft proposes the name the clause already has — that is not a rename, and a
   struck heading over an identical one would be the page inventing a change. */
function ceHeadReadHtml(){
  const from = _ceHeadBase, to = _ceHead;
  if (!to || to === from) return `<h4 class="rl-clause-h">${_cee(from)}</h4>`;
  const mode = (window.rlReadMode ? rlReadMode() : 'marks');
  if (mode === 'agreed') return `<h4 class="rl-clause-h">${_cee(from)}</h4>`;
  if (mode === 'proposed') return `<h4 class="rl-clause-h">${_cee(to)}</h4>`;
  return `<h4 class="rl-clause-h">${from
    ? `<span class="nego-del">${_cee(from)}</span> ` : ''}<span class="nego-ins">${_cee(to)}</span></h4>`;
}
/* ---- WHAT IS IN THE BOXES, TAKEN ONTO ONE STEP ----
   IT PULLS BOTH HALVES, and that is why the heading did not get a puller of
   its own: this function is called from about ten places — the bar, the
   pencil, the reading tabs, Save, blur — and a second one would have had to be
   remembered at every one of them. A draft is the wording AND the clause's
   name; taking them onto one step is what makes Undo put the pair back
   together rather than half of it.

   THE NAME IS TEXT, NEVER MARKUP: a heading is a citation string and the
   document model writes it with textContent, so markup a paste brought in
   would be thrown away on the way to the record and the box would be lying
   about what it holds. The WORDING is sanitised rather than flattened, exactly
   as the clause panel's editor does it — reading textContent there is what used
   to throw the reader's bold and bullets away on every keystroke. */
function cePullText(){
  if (!ceIsTyping()) return;
  const box = _ceQ('#ce-clausebody');
  const headBox = _ceQ('#ce-clausehead');
  let next = _ceText;
  if (box){
    const raw = String(box.innerHTML || '');
    next = window.sanitizeRich ? sanitizeRich(raw) : raw;
  }
  const nextHead = headBox
    ? String(headBox.textContent || '').replace(/\s+/g, ' ').trim() : _ceHead;
  const headMoved = nextHead !== _ceHead;
  if (next === _ceText && !headMoved) return;
  _ceHead = nextHead;
  ceApply(next, (headMoved && next === _ceText) ? _cet('ce_step_named') : _cet('ce_step_typed'),
    { keepView: true, headMoved });
}

function ceRenderFoot(){
  if (!clauseEditorOpen()) return;
  const moved = _ceText !== _ceBase || _ceHead !== _ceHeadBase;
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
  if (next === _ceText && !opts.headMoved){ ceSay(_cet('ce_already_in_box')); return false; }
  /* Two bodies that project to the same wording and differ only in dressing are
     still a change — the funnel has a formatting-only path for exactly that —
     so this compares the stored form, never the projection. */
  /* The reason was written about the OLD wording — it may not travel with new
     wording nobody has read it against. */
  _ceSteps = _ceSteps.slice(0, _ceStep + 1);
  _ceSteps.push({ label: label || _cet('ce_step_applied'), text: next, head: _ceHead });
  _ceStep = _ceSteps.length - 1;
  _ceText = next;
  _ceSavedAt = ceNowHm();
  /* Wording that arrived from somewhere else — a Copilot card, a playbook
     standard, a passage rewritten in place — drops out of typing so the marks
     it made are the first thing seen. Typing keeps the caret (keepView). */
  if (_ceEditing && !opts.keepView) _ceEditing = false;
  /* ---- AND AN ATTACHED PASSAGE GOES WITH THE WORDING IT WAS IN (M-1) ----
     A card in the rail quoting a sentence the clause no longer holds is a stale
     statement on screen. The two acts that replace a passage detach BEFORE they
     get here, so this reaches the case that matters: a clause-level suggestion
     applied over the whole wording while something was still attached.
     UNDO, REDO AND DISCARD ARE DELIBERATELY NOT SWEPT — they move between steps
     the passage may well still be in, and throwing the reader's selection away
     on every step would cost more than it saves. Where the words really have
     moved, ceReplacePassage refuses in ceSay rather than replacing the wrong
     thing, which is the wall this leans on. */
  ceDetachPassage();
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  if (!opts.quiet) ceSay(_cet('ce_applied'));
  return true;
}
/* ---- IS THERE TYPING THE STEP STACK HAS NOT TAKEN YET? ----
   The box's text only reaches the stack on BLUR — which is right, because
   taking it on every keystroke would repaint the whole document under the
   caret. The cost is that between a keystroke and a blur the stack does not
   know about the typing, and Undo is a fact about the stack. So the two bar
   buttons ask this as well. OWNER-REPORTED 28 Aug 2026: Undo did nothing after
   typing, because it was greyed out. */
function ceBoxDirty(){
  if (!ceIsTyping()) return false;
  try{
    const headBox = _ceQ('#ce-clausehead');
    if (headBox && String(headBox.textContent || '').replace(/\s+/g, ' ').trim() !== _ceHead) return true;
    const box = _ceQ('#ce-clausebody');
    if (!box) return false;
    const raw = String(box.innerHTML || '');
    return (window.sanitizeRich ? sanitizeRich(raw) : raw) !== _ceText;
  }catch(_){ return false; }
}
/* The two buttons whose answer changes as the reader types, flipped WITHOUT a
   repaint: the bar is rebuilt with the head, and the head is not rebuilt on a
   keystroke. */
function ceSyncBarSteps(){
  const host = _ceQ('#ce-bar'); if (!host) return;
  const u = host.querySelector('[data-rb="undo"]');
  const r = host.querySelector('[data-rb="redo"]');
  if (u) u.disabled = _ceStep <= 0 && !ceBoxDirty();
  if (r) r.disabled = _ceStep >= _ceSteps.length - 1;
}
function ceUndo(){
  if (!clauseEditorOpen()) return;
  /* TAKE THE TYPING FIRST, so Undo undoes what the reader just typed rather
     than stepping over it — which is what Undo means in every writing tool
     they have used. Where nothing was typed this returns without doing
     anything and the step below is the whole act. */
  cePullText();
  if (_ceStep <= 0) return;
  _ceStep -= 1;
  ceRestoreStep();
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
  ceRestoreStep();
  ceRenderPaper(); ceRenderFoot(); ceRenderHead();
  ceSay(_cet('ce_stepped_forward', { label: _ceSteps[_ceStep].label }));
}
/* A step is the draft as it stood, and the draft has two halves — so stepping
   is restoring both. A step recorded before the heading joined the stack
   carries no `head`; it falls to the standing heading, which is what that step
   really meant. */
function ceRestoreStep(){
  const st = _ceSteps[_ceStep] || {};
  _ceText = st.text;
  _ceHead = st.head == null ? _ceHeadBase : st.head;
}
function ceDiscard(){
  if (!clauseEditorOpen()) return;
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase, head: _ceHeadBase }];
  _ceStep = 0; _ceText = _ceBase; _ceHead = _ceHeadBase; _ceSavedAt = null;
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
  /* The ask box belongs to the conversation. The scan has nothing to be asked —
     and the attached passage goes with it, because a card saying what the next
     question is about, over a tab that takes no questions, is furniture. It is
     not DETACHED, only undrawn: coming back to the conversation finds it where
     it was left. */
  const ask = _ceQ('#ce-askrow'), chips = _ceQ('#ce-chips'), scope = _ceQ('#ce-scope');
  if (ask) ask.style.display = _ceTab === 'chat' ? '' : 'none';
  if (chips) chips.style.display = _ceTab === 'chat' ? '' : 'none';
  if (scope) scope.style.display = _ceTab === 'chat' ? '' : 'none';
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
  /* ---- A CARD MARKED AGAINST WHAT IT ACTUALLY REPLACES (M-1) ----
     A passage card carries the passage it was asked about, so its preview is
     marked against THOSE words rather than against the whole clause — which
     would strike out the entire clause to insert one sentence and read as a
     rewrite of everything.
     THE PASSAGE IS ON THE CARD RATHER THAN READ OFF `_ceSel` AT PRESS TIME, so
     an answer stays applicable after the reader has let the passage go: the
     card knows what it was about, which is the honest place for that fact. */
  const marked = ceRedlineHtml(card.passage ? card.passage.text : _ceText, card.text || '');
  const vote = card.vote || '';
  return `<div class="ce-card">
    <div class="n"><span>${_cee(card.name || _cet('ce_suggestion'))}</span><span class="g"></span>${
      card.chip ? `<span class="chip ${_ceea(card.chipTone || 'wait')}">${_cee(card.chip)}</span>` : ''}</div>
    ${card.line ? `<span class="l">${_cee(card.line)}</span>` : ''}
    ${card.rests ? `<span class="r">${_cee(_cet('ce_rests_on', { on: card.rests }))}</span>` : ''}
    ${card.text ? `<span class="pv">${marked}</span>` : ''}
    <div class="av">
      ${card.text ? `<button type="button" class="p" data-ce-apply="${i}:${j}">${
        _cet(card.passage ? 'ce_apply_passage' : 'ce_apply')}</button>` : ''}
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
/* ---- THE READY-MADE QUESTIONS FOLLOW THE SCOPE (M-1) ----
   With a passage attached they are the strip's own three — shorten, firmer,
   plain English — because those are the questions a person asks about ONE
   sentence; with nothing attached they are the four this rail has always
   carried, which are questions about the whole clause.

   ONE ROW EITHER WAY, and one attribute: a chip is a question and presses
   ceAsk, which is what decides whether the answer is about the passage or the
   clause. A second attribute for "passage chip" would be a second route to one
   act, and the two would come to disagree about scope. */
function ceRenderChips(){
  if (!clauseEditorOpen()) return;
  const box = _ceQ('#ce-chips'); if (!box) return;
  const qs = [];
  if (_ceSel){
    qs.push(_cet('ce_inline_shorten'), _cet('ce_inline_firmer'), _cet('ce_inline_plain'));
  } else {
    const on = ceOnTable(), theirs = on.find(x => x.authorSide === 'counterparty');
    if (theirs) qs.push(_cet('ce_q_answer', { id: theirs.id }));
    qs.push(_cet('ce_q_softer'), _cet('ce_q_our_standard'), _cet('ce_q_risk'), _cet('ce_q_plain'));
  }
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
  /* ---- WHAT THIS ASK IS ABOUT, CAPTURED AT THE PRESS (M-1) ----
     Read once, here, rather than again when the answer lands: the reader can
     let the passage go while the model is thinking, and an answer that then
     silently became a rewrite of the whole clause is the worst thing this page
     could do. The card carries it, so it stays true whatever happens next. */
  const scope = _ceSel;
  /* The conversation so far, so a follow-up ("firmer than that") means what it
     says. Trimmed to the last few turns — the whole history of a long sitting
     is money spent restating what the model already answered. */
  const history = _ceThread.filter(t => t.text).slice(-6)
    .map(t => (t.who === 'you' ? 'Drafter: ' : 'You: ') + t.text).join('\n');
  let res = null, err = null;
  try{
    res = await copilotPropose({
      ask: _cet(scope ? 'ce_prompt_passage' : 'ce_prompt_ask'),
      passage: scope ? scope.text : (_ceText || _ceBase),
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
    cards: wording ? [{ name: _cet(scope ? 'ce_suggestion_passage' : 'ce_suggestion'),
      chip: _cet('ce_chip_copilot'), chipTone: 'wait',
      line: '', rests, text: wording, passage: scope || null }] : [] });
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
/* ---- NOTICED WHILE FIXING THE STRIP, AND DELIBERATELY NOT FIXED ----
   (29 Aug 2026.) With typing OFF, a DRAG in the wording is read as a press in
   the wording: click-to-type runs on the `click` that follows mouseup, starts
   typing and drops the caret at the point, which COLLAPSES the selection the
   drag just made. So a reader selecting words to copy off a clause that is
   showing its marks loses the selection under them.
   IT DOES NOT REACH THE REPORTED FAULT and is not fixed here: while typing —
   which is where the owner's whole report lives — the click branch is already
   excluded by its own contenteditable selector, so this cannot bite there. A
   guard was written for it and taken out again, because refusing the drag would
   partly undo the click-to-type feature of 29 Aug for the sake of a case nobody
   has reported. Logged rather than fixed on the way past. */
/* The wording as LINES, with horizontal runs collapsed and the breaks kept —
   the one reading both the selection and the replacement work in. */
function ceLines(){
  return ceWords(_ceText).split(/\n/).map(l => l.replace(/[^\S\n]+/g, ' ').trim());
}
/* ---- ATTACHING A PASSAGE TO THE RAIL (M-1) ----
   The drag on the paper is the whole gesture: what it produces is a scope on
   the Copilot rail, not a box over the contract. It DOES NOT TAKE THE CARET —
   a highlight can be made mid-sentence, and moving focus into the rail every
   time somebody selected something would take them out of the clause they are
   writing in, which is the opposite of the promise this rests on.

   THE SAME PASSAGE TWICE IS NOT A NEW ATTACHMENT: re-selecting identical words
   repaints nothing, so a stray double-click does not clear a half-typed ask. */
function ceAttachPassage(sel){
  if (!sel) return;
  if (_ceSel && _ceSel.text === sel.text && _ceSel.line === sel.line) return;
  _ceSel = sel;
  ceRenderScope(); ceRenderChips();
}
function ceDetachPassage(){
  if (!_ceSel) return;
  _ceSel = null;
  ceRenderScope(); ceRenderChips();
}
/* ---- WHAT IS ATTACHED, SAID WHERE THE READER IS ABOUT TO TYPE ----
   THE PAPER CANNOT KEEP THE MARK AND THAT IS SAID OUT LOUD. The highlight is
   the browser's own selection, and it goes the moment the reader clicks into
   the ask box — which is the very next thing they do. Wrapping the passage in
   the rendered clause would mean editing the paper's markup to draw a posture,
   on the one surface in this product that must never be edited to draw one. So
   the CARD is the statement: it quotes the passage in full on its own title,
   twelve pixels from the box the question is typed into.

   THE ASK BOX SAYS WHAT IT IS FOR, because a narrowed control states the
   narrowing by being set to it — the WHOSE ASKS rule, on a placeholder. */
function ceRenderScope(){
  if (!clauseEditorOpen()) return;
  const box = _ceQ('#ce-scope');
  const ask = _ceQ('#ce-ask');
  const sel = _ceSel;
  if (ask) ask.placeholder = _cet(sel ? 'ce_ask_ph_passage' : 'ce_ask_ph');
  if (!box) return;
  if (!sel){ box.innerHTML = ''; return; }
  const where = ceClauseLabel(ceClause()) || _cet('ce_this_clause');
  box.innerHTML = `<div class="ce-scope">
    <div class="eb"><b>&#9998; ${_cee(_cet('ce_scope_in', { where }))}</b><span class="g"></span>
      <button type="button" class="x" data-ce-act="scope-off"
        title="${_ceea(_cet('ce_scope_off'))}" aria-label="${_ceea(_cet('ce_scope_off'))}">&#10005;</button></div>
    <q title="${_ceea(sel.text)}">${_cee(sel.text)}</q>
    ${''/* ---- THE ONE VERB THE STRIP CARRIED THAT NOTHING ELSE DOES ----
           "Suggest deleting these words" was the strip's own &times; and is the
           only one-press way in the product to strike a sentence out. It is on
           the passage's own card rather than in the chips row, which is a
           DEPARTURE FROM THE APPROVED RENDER and is named here: that row holds
           questions that spend money on Copilot, and an act that changes the
           draft on the spot is a different kind of thing. */}
    <button type="button" class="cut" data-ce-act="scope-cut"
      aria-label="${_ceea(_cet('ce_inline_cut'))}"
      title="${_ceea(_cet('ce_inline_cut_title'))}">${_cee(_cet('ce_scope_cut'))}</button>
  </div>`;
}
/* ---- THE ONE REPLACEMENT ----
   The passage goes, the wording arrives, and every other line of the clause is
   carried across character for character. ONE reading, because the reader's own
   typing and a Copilot rewrite are the same act on the record and a second copy
   is how the two come to disagree about what a line break costs.

   ITS REFUSALS SPEAK THROUGH ceSay NOW, which is the toolbar's own status slot
   and this page's one place a refusal is spoken. They used to print inside the
   strip; a refusal with nowhere to appear is a dead press. */
function ceReplacePassage(sel, wording){
  const words = String(wording == null ? '' : wording).replace(/\s+/g, ' ').trim();
  if (!words){ ceSay(_cet('ce_inline_say_what')); return false; }
  const lines = ceLines();
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
  if (words === sel.text){ ceDetachPassage(); return false; }
  lines[sel.line] = ln.slice(0, at) + words + ln.slice(at + sel.text.length);
  ceDetachPassage();
  ceApply(lines.join('\n'), _cet('ce_step_passage'));
  return true;
}
/* ---- STRIKE THE HIGHLIGHTED WORDS OUT ----
   The passage goes and what is left is tidied where the cut would otherwise
   leave two spaces or a space before a full stop. It goes through the same
   lines reading as everything else, so the rest of the clause is still carried
   across character for character — and like everything else here it APPLIES
   rather than files. */
function ceCutPassage(){
  const sel = _ceSel; if (!sel) return false;
  const lines = ceLines();
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
  const cut = (ln.slice(0, at) + ln.slice(at + sel.text.length))
    .replace(/\s{2,}/g, ' ').replace(/\s+([.,;:])/g, '$1').trim();
  if (!cut){ ceSay(_cet('ce_inline_cut_all')); return false; }
  lines[sel.line] = cut;
  ceDetachPassage();
  ceApply(lines.join('\n'), _cet('ce_step_cut'));
  return true;
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
  if (_ceText === _ceBase && _ceHead === _ceHeadBase){ ceSay(_cet('ce_nothing_to_file')); return; }
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
    /* ---- THE CLAUSE'S NAME GOES WITH ITS WORDING (owner-asked 28 Aug 2026) ----
       ONE record, one press, one fingerprint. It is passed only where the
       document HAS a heading to rename (ceHeadEditable) — elsewhere an absent
       headingText is read by both funnel doors as "leave it as it is" rather
       than as "clear it", which is the behaviour every caller written before
       this one relies on. The funnel decides what a rename IS: a name equal to
       the one the clause already carries is not one, and is stored as '' so a
       reader who types the original back clears the record's own rename rather
       than leaving a stale one standing. */
    if (ceHeadEditable()) o.headingText = _ceHead;
    ch = proposed ? await negoReviseInsert(c, clauseId, { bodyHtml: html, ...(ceHeadEditable() ? { headingText: _ceHead } : {}) }, o)
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
      /* THE BAR FOLLOWS THE PENCIL. Its tools grey when nothing is typeable,
         so a pencil press that did not repaint it would leave the whole shelf
         dressed for the state before the press. */
      ceDetachPassage(); ceRenderPaper(); ceRenderBar();
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
      /* The bar greys on a reading that draws no marks, so it repaints with
         the rest of the page rather than keeping the last reading's face. */
      ceDetachPassage(); ceRenderPaper(); ceRenderFoot(); ceRenderBar(); return; }

    const tab = hit('[data-ce-tab]');
    if (tab){ ev.preventDefault();
      const want = tab.getAttribute('data-ce-tab');
      _ceTab = want === 'scan' ? 'scan' : 'chat';
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
      if (!card) return;
      /* ONE REPLACEMENT EITHER WAY. A passage card goes through
         ceReplacePassage — the same reading the reader's own typing goes
         through — so the rest of the clause is carried across character for
         character and no second copy of "what a line break costs" is written
         here. A clause card is the whole wording and applies as it always has. */
      if (card.passage) ceReplacePassage(card.passage, card.text);
      else ceApply(card.text, _cet('ce_step_copilot'));
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

    /* A ROW IS A DOOR TO ITS CLAUSE, and it is ceGoClause — the crumb's own act
       when there was a crumb, and the pencil's on another clause. A second copy
       is how the two come to disagree about what an unfinished draft costs. */
    const goCl = hit('[data-ce-goclause]');
    if (goCl){ ev.preventDefault();
      const id = goCl.getAttribute('data-ce-goclause');
      if (id && id !== _ceClauseId) ceGoClause(id); else ceScrollToClause();
      return; }

    const zoom = hit('[data-ce-zoom]');
    if (zoom){ ev.preventDefault();
      ceSetZoom(_ceZoom + (zoom.getAttribute('data-ce-zoom') === 'in'
        ? CE_ZOOM_STEP : -CE_ZOOM_STEP));
      return; }

    /* ---- CLICK IN THE WORDS AND TYPE, LIKE ANY DOCUMENT ----
       (owner-asked 29 Aug 2026: *"I hate that I have to click on a pencil for
       me to edit in the edit with copilot page … Let me just edit like I am in
       Google Docs but the platform should track which clause I am editing."*)

       THE PENCIL IS NOT RETIRED and this is not a second act: both ends run the
       same two lines this handler already had — turn typing on where the reader
       is, or move the page to the clause they pointed at. What changes is that
       the press in the WORDS now counts as that ask, so the pencil is the
       visible affordance rather than the toll gate.

       WHICH CLAUSE IS TRACKED BY THE PRESS: `data-clause` is on the section the
       press landed in, so the page follows the reader rather than the reader
       having to tell it twice.

       IT RUNS LAST, after every named control above, so a press on a button, a
       tag or a field is never read as a press in the wording — and it asks for
       a real control anyway, because the paper carries its own (the pencil, the
       ask tags) and a hit on one of those is not a hit on the words.

       ALREADY TYPING IN THIS CLAUSE: it does nothing at all, and must. The box
       is contenteditable, so the browser's own caret is the right answer and
       anything here would fight it.

       A REFUSING READING DOES NOTHING EITHER. 'As agreed' and 'With changes'
       draw the paper without its marks, so typing there would be measured
       against a document the reader is not being shown; the band already says
       so and carries the way back. One predicate, ceEditableReading, exactly as
       the pencil and Apply ask it. */
    const inDoc = hit('#ce-doc');
    if (inDoc && ceEditableReading()
        && !hit('button, a, input, textarea, select, [role="button"], [contenteditable="true"]')){
      const sec = hit('[data-clause]');
      const id = sec && sec.getAttribute('data-clause');
      if (id){
        const point = { x: ev.clientX, y: ev.clientY };
        if (id !== _ceClauseId){
          ev.preventDefault();
          cePullText();
          ceGoClause(id, { typing: true });
          ceFocusTyping(point);
          return;
        }
        if (ceStartTyping(point)){ ev.preventDefault(); return; }
      }
    }

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
      /* ---- THE TWO ACTS ON THE ATTACHED PASSAGE ----
         Letting it go, and striking it out. Both are named functions rather
         than bodies written here, because the Escape key and the paper's own
         gestures reach the same two acts and a second copy is how they come to
         disagree. `inline-cut` and `inline-go` are STALE. */
      case 'scope-off': ceDetachPassage(); break;
      case 'scope-cut': ceCutPassage(); break;
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
  /* A hand edit is an Apply like any other, taken when the box loses focus —
     so the redline, the counts, the draft line and the file button all follow
     typing exactly as they follow a suggestion. */
  /* The typing box is rebuilt by every paint, so the handler is delegated on
     the page rather than bound to an element a repaint throws away. Capture,
     because blur does not bubble. */
  page.addEventListener('blur', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausebody, #ce-clausehead')) return;
    /* NOT WHILE THE PAPER IS BEING WRITTEN OVER. A repaint blurs the box it is
       replacing, and pulling from a box that is halfway gone renders again on
       top of a half-written DOM — see the fence in ceRenderPaper. */
    if (_ceRendering) return;
    cePullText(); ceRenderFoot();
  }, true);

  /* ---- THE TWO STEP BUTTONS FOLLOW THE TYPING ----
     Cheap on purpose: two disabled flags, no repaint. Without it Undo stays
     greyed out until the box loses focus, which is a dead button at exactly
     the moment somebody reaches for it. */
  page.addEventListener('input', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausebody, #ce-clausehead')) return;
    /* ---- AND TYPING IN THE CLAUSE LETS THE PASSAGE GO, HAVING DONE NOTHING ----
       (29 Aug 2026.) A reader who highlights a sentence and then simply carries
       on writing has answered the question themselves — the passage the rail is
       holding is the passage they have just typed over. Leaving it attached
       would leave a card offering to replace wording that is no longer there,
       and ceReplacePassage would then refuse in words for a reason the reader
       never caused.
       Guarded on there BEING one, so an ordinary keystroke costs nothing. */
    if (_ceSel) ceDetachPassage();
    ceSyncBarSteps();
  });

  /* ---- A HEADING IS ONE LINE ----
     The box is contenteditable, so Enter would put a paragraph break inside a
     citation string — and the document model writes the heading with
     textContent, so that break would be silently flattened on the way to the
     record and the box would stop showing what is stored. Enter finishes the
     name instead, which is what it does in every field this reader has used.
     Escape puts the name back to what it was before this sitting's typing. */
  page.addEventListener('keydown', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausehead')) return;
    if (ev.key === 'Enter'){ ev.preventDefault(); t.blur(); return; }
    if (ev.key === 'Escape'){ ev.preventDefault(); ev.stopPropagation(); t.textContent = _ceHead; t.blur(); }
  });

  /* ---- ONE SENTENCE AT A TIME, AND THE DRAG IS THE WHOLE GESTURE ----
     (owner-reported 29 Aug 2026: "I am still clicking the pencil sign various
     times and I do not know for what reason ... highlight a sentence and a strip
     bar appears (which was there before but you seem to have deleted it)".)

     THIS HANDLER OPENED `if (ceIsTyping()) return;` AND THAT LINE WAS THE WHOLE
     REPORT. Typing and the highlight could not be live at once, so the pencil
     was one switch pointing at one of two jobs and NO NUMBER OF PRESSES REACHED
     BOTH. Its reasoning is not wrong about what a drag CAN mean — inside a
     contenteditable box it really can be somebody selecting words to embolden —
     it is wrong that it can only mean that. So a drag means BOTH: the browser's
     own selection stands and every tool on the bar still acts on it, AND the
     passage attaches to the rail beside it.

     ---- AND IT ONLY EVER ANSWERS FOR A PRESS ON THE PAPER (M-1) ----
     THIS IS THE LINE THAT MAKES OPTION A WORK, and getting it wrong would have
     made the feature unusable in one press: with the box on the paper, a press
     anywhere else that made no selection meant "the reader has moved on", and
     detaching was right. With the box in the RAIL, the very next thing a reader
     does after attaching a passage is click into the ask box to type — and that
     press is not in `#ce-doc`, makes no selection, and would have detached the
     passage they had just chosen.

     So a press outside the paper is not this handler's business at all: it
     neither attaches nor detaches. The ways to let a passage go are the card's
     own ✕, Escape, typing over it in the clause, and choosing another passage.
     Nothing else takes it away. */
  page.addEventListener('mouseup', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-doc')) return;
    setTimeout(() => {
      const sel = ceSelection();
      if (sel) ceAttachPassage(sel); else ceDetachPassage();
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
    if (_ceSel){ ceDetachPassage(); return; }
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
  ceBoxDirty,
  ceClauseDeviations, cePlaybookLine,
  ceCostLine, ceWordCount, ceLines,
  ceRedlineHtml, ceCounts, ceReadList, ceRenderAll, ceRenderPaper,
  ceAttachPassage, ceDetachPassage, ceRenderScope, ceReplacePassage, ceCutPassage, ceSelection,
  ceRestoreScroll,
  ceEditableReading, ceGoClause,
  ceFitSplit, ceWireSplit, ceStacked, ceSplit, ceSplitLeft, CE_LEFT_MIN, CE_RIGHT_MIN, CE_FMIN, CE_FMAX, CE_SPLIT_KEY,
});
