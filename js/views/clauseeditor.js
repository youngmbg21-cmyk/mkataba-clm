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
/* ---- WHOLE-CONTRACT MODE (Young ruled it 23 Sep 2026, fix 5 of seven) ----
   The ✕ on the card lets go of what Copilot was holding — the clause, or the
   words — and the rail then answers about the WHOLE CONTRACT: the owner's own
   words, "you can ask copilot about anything across the entire contract". A
   question there is a reading; it changes no wording. Cleared the moment the
   reader works on wording again: a highlight, typing, or another clause. */
let _ceWhole = false;
let _ceRendering = false;   /* the paper is being written over — see ceRenderPaper */
let _cePlaceAt = null;      /* where the clause moved TO was on screen — see ceGoClause */
/* How much of the draft the leave warning quotes back. A confirm dialog is ONE
   paragraph — see clauseEditorLeaveAsk. */
const CE_LEAVE_SNIP = 120;
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
/* ---- IS THERE SOMETHING TO FILE? ONE READING, TWO SURFACES ----
   The foot's File button greys on exactly this, and since 31 Aug 2026 the
   pencil FILES on exactly this — so a pencil that files where the button is
   dead, or the other way round, is not a thing that can happen. It is the two
   questions the foot's own note already spells out, joined: the wording has
   moved from what STANDS, and there is something the RECORD does not already
   hold. */
const ceCanFile = () => (_ceText !== _ceBase || _ceHead !== _ceHeadBase) && clauseEditorDirty();

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
   from an opaque cover. So this is a fixed layer, BELOW the toast root and
   modal-root so a confirm dialog and every refusal still land on top of it —
   and, since 2 Sep 2026, below the two slide-over panels as well, so the
   shell's own doors are live here. See the rule's own note for the ladder.

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
  ${''/* ---- AND NOW 38, BELOW BOTH SLIDE-OVERS (owner-asked 2 Sep 2026, off a
         screenshot with the shell bar's four doors ringed: "the sliding panels
         should not be hidden or muted when in the editor page") ----

         THIS REVERSES ONE HALF OF THE NOTE ABOVE — "still above the Copilot
         drawer and the activity panel" — and only that half. Below the nav
         (55), below modal-root (70) and the toasts: all unchanged.

         IT IS THE HONEST FIX RATHER THAN UN-GREYING THE DOORS. Those doors
         were greyed on 1 Sep precisely because a panel opening at 46 behind a
         page at 54 is a live control that does nothing — and the Copilot door,
         which was never greyed, was doing exactly that in silence. Un-greying
         them alone would have put the dead press back; moving the page under
         the panels is what makes the press WORK.

         38 IS BELOW THE WHOLE PANEL STACK and above everything in the content
         area: #ai-scrim 40, #panel-scrim 45, #context-panel 46, #ai-panel 50.
         So a panel dims and covers this page exactly as it does every other
         page in the product, which is what a slide-over is for. Nothing in the
         content area sits between 6 and 40 — measured, not assumed. */}
  #clause-editor{position:fixed; inset:0; z-index:38; display:flex; flex-direction:column;
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
  /* ---- THE SAY LINE MAY ONLY TAKE FREE SPACE (Young reported it 11 Sep 2026:
     "the first time it does not work and then i have to click on it a second
     time") ----
     MEASURED with the mouse button HELD on the pencil: the row was 45px before
     the press and 81px during it, and the pencil sat 36px lower than where the
     button went down. The mousedown blurs the box; the blur spoke into this
     span; the span took up to 300px from the tools beside it; the tools wrapped
     onto a second line and pushed the paper down under the reader's hand, so
     the mouseup landed on a paragraph and the browser never called it a click.
     A basis of ZERO is the guarantee: a flex item with no basis can only grow
     into space nobody else is using, so this line can never take width from
     the tools, and the row's height with the line on is its height with the
     line off, by construction. Where there is no free space the sentence goes
     out through the toast instead — see ceSay. */
  .ce-barrow .ce-say{flex:999 1 0; min-width:0; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap}
  /* the spacer yields to the sentence: 999 against 1 leaves the way-out at the
     wall and gives the line every free pixel up to its cap */
  /* ---- THE WAY OUT WEARS ITS WORD ----
     It was a 28px square holding the symbol alone. The box grows to fit the
     word rather than the word being squeezed into the box, so nothing else on
     the strip moves: .ce-barg is the flex:1 spacer between the tools and this,
     and it gives up exactly what the label takes. THE HEIGHT IS UNCHANGED at
     28, deliberately — the ask was about being READABLE, not about being
     bigger, and this control's own height is a decision somebody else made.
     BOLD BECAUSE IT IS FILLED, which is the owner's own rule for a control row
     (10 Sep 2026: "Only the shaded buttons should bold"). */
  .ce-exit{flex:none; height:var(--ctl-h); display:inline-flex; align-items:center; gap:var(--btn-gap);
    background:var(--accent-ink); border:1px solid var(--accent-ink); color:#fff;
    cursor:pointer; padding:0 var(--pad-ctl-x); border-radius:var(--radius); font:inherit;
    font-size:var(--t-body); font-weight:var(--w-label); line-height:1}
  ${''/* MEDIUM, LIKE EVERY OTHER BUTTON (the Compact ladder, 26 Sep 2026):
         the fill says it is the way out; the weight no longer has to. The
         10 Sep ruling "only the shaded buttons should bold" is about the lit
         half of a two-way switch, and those still bold. */}
  .ce-exit > svg{width:var(--btn-ic); height:var(--btn-ic); flex:none}
  /* ONE LINE, WHATEVER THE LANGUAGE. Swedish is the longer word and the strip
     is a nowrap row, so a label allowed to break would grow the bar's height
     rather than the button's width. */
  .ce-exit-word{white-space:nowrap}
  .ce-exit:hover{background:var(--color-accent-700); border-color:var(--color-accent-700)}
  .ce-exit:focus-visible{box-shadow:var(--focus)}
  .ce-col{min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden}
  /* position: the rung's wording card (rlRungPeekHtml) mounts here when the
     ladder is drawn on this rail, and hangs off its left edge into the paper's
     own track. Costs no layout — nothing here is absolutely positioned but
     that card. */
  .ce-rail{min-width:0; min-height:0; display:flex; flex-direction:column; position:relative;
    background:var(--color-surface); border-left:1px solid var(--color-divider)}
  .ce-rail .ce-lane{flex:1; min-height:0}
  .ce-railfoot{flex:none; display:flex; align-items:center; justify-content:flex-end; gap:var(--s-2);
    padding:9px 14px; border-top:1px solid var(--color-divider); background:var(--color-surface)}
  .ce-railfoot button{height:var(--ctl-h); padding:0 var(--pad-ctl-x); font:inherit; font-size:var(--t-body); font-weight:var(--w-label);
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
  .ce-zoom{flex:none; display:flex; align-items:center; height:var(--ctl-h); box-sizing:border-box;
    border:1px solid var(--color-divider); background:var(--color-surface)}
  .ce-zoom button{width:var(--ctl-h-sm); height:var(--ctl-h-sm); background:none; border:0; padding:0;
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
     dashed line, set clear of the words so it frames them rather than touching
     them, and an OUTLINE rather than a border so it takes no space and nothing
     on the page moves when it appears. (WHERE it is drawn moved on 1 Sep 2026 —
     one frame round the whole clause rather than one per box; see the note
     below. That owner ruling changed the shape, not any of this.)

     THE COLOUR IS THE DOCUMENT'S OWN INK AT A FIFTH STRENGTH, never a typed
     grey, and that is what makes one declaration right in both themes: the
     sheet is cream by day and near-black at night, and a fixed light grey that
     reads as a whisper on the cream would be invisible on the other. Mixed off
     the ink the paper is already printed in, the line follows the paper.

     WHAT CARRIES FOCUS IS THE CARET, which is the strongest indicator a text
     field has and is why this line does not need to shout: it says WHERE the
     editable region is, and the caret says you are in it. THE TEAL MARGIN BAR
     THIS NOTE USED TO LEAN ON IS GONE (29 Aug 2026, ringed by the owner — see
     the note above), so the frame and the caret are now the whole of what says
     which clause is live, together with the page naming it at the top. That is
     why the frame may be quiet and may not be absent. */
  /* ---- ONE FRAME ROUND THE WHOLE CLAUSE, NOT ONE PER BOX (owner-reported
     1 Sep 2026, off a screenshot with both ringed: "when you click on a pencil
     you can an outline for the clause header and an outline for the clause. I
     want the outline to be one outline that encompasses both") ----
     The name and the wording are two editable boxes, so each drew the frame
     above and the clause read as two fields stacked rather than as the one
     region you are working in. The frame is on the CLAUSE now — the one element
     that already contains both — and the boxes draw none.

     THE has() SELECTOR IS THE READING AND IT IS EXACT. rl-clause-live marks the
     clause this page is about whether or not typing is on, so a frame keyed to
     it alone would draw on a clause showing its marks; ce-typing exists only
     while the clause is typeable. "The live clause that CONTAINS an editable
     box" is the state, said once, with nothing new stamped on the markup for
     anybody to keep in step.

     THE PENCIL IS INSIDE IT, unavoidably and on purpose: the name shares a row
     with the pencil, so ANY single rectangle round the name and the wording
     contains it. It is the control that closes the region, which is a fair
     thing to find inside the region's own frame. */
  ${''/* ---- AND ON 15 SEP 2026 THE FRAME WENT (Young ruled it) ----
     "I do not want to have the dotted line or any line around a clause when I
     go to edit. It should just seem like nothing has changed."

     THIS REVERSES THE 26 AUG RULING ABOVE AND THE 1 SEP ONE THAT RESHAPED IT.
     Both are kept in the note above because the REASONING still holds and is
     what makes this safe to take: the frame was already down to the quietest
     mark the sheet could carry, and the note itself says what the other
     indicator is. WHAT CARRIES FOCUS IS THE CARET - the strongest indicator a
     text field has, present the whole time, and now the whole of it, together
     with the page naming the clause at its top and the Done pencil on the
     clause's own heading row. Nothing else on the sheet changes, which is the
     ruling: entering a clause must not be a visible event.

     The rule stays, with no outline in it, because the selector is what
     carries "the live clause that contains an editable box" and the geometry
     rules under it are keyed to the same state. */}
  ${''/* ---- AND THE INSET IS TAKEN BACK BY A RULE THAT CAN ACTUALLY WIN ----
         (15 Sep 2026, measured, and it had been wrong since the day it was
         written.) The declaration said margin:-8px -10px and the browser
         computed margin:0px: the paper's own
         ".redline-page .rl-doc .nego-body" scores (0,3,0) and sets margin to
         zero, and this rule scored (0,2,0). So the padding pushed the wording
         ten pixels right and eight down every time somebody started typing,
         with nothing taking it back - a clause that jumped under the reader's
         finger, which is half of what Young reported.

         NOTHING LOOKED WRONG IN THE SOURCE, which is this codebase's own
         standing lesson about a rule that loses a cascade fight: measure the
         computed value in a browser before believing a declaration. FIXED BY
         SCOPE and never by !important - four classes, all of them real
         ancestors of both boxes, so it outranks the paper's rule on the one
         element that needs it and changes nothing else on the sheet.

         AND THE INSET IS HORIZONTAL ONLY, for the same reason it is on the
         name box beside it: a vertical inset has to be handed back by a
         negative margin, a negative margin-top collapses with the heading's
         own margin-bottom, and the wording came out five pixels high - still a
         clause that moves when a cursor enters it, just by less. Measured
         both ways. Nothing vertical is stated here, so the clause's own
         spacing holds by construction.

         AND IT IS WRITTEN AS LONGHANDS, which is the whole of the last five
         pixels: this rule also matches the HEADING while it is typeable, and
         the margin SHORTHAND set that heading's own margin-bottom - its 5px
         gap above the wording - back to zero. A shorthand states four values
         whether you meant to or not. */}
  .ce-paperwrap .rl-doc .rl-clause .ce-typing{background:transparent; box-shadow:none;
    outline:none; padding:0 10px; margin-left:-10px; margin-right:-10px}
  /* THE MARKS UNDER THE BOX (rule 2): the paper's own reading, parted from the
     typing box by the dashed frame's own vocabulary — no fill, no words. */
  .ce-paperwrap .ce-twin{padding-top:8px; margin-top:14px;
    border-top:1px dashed color-mix(in srgb, var(--color-doc-text) 22%, transparent); cursor:default}
  .ce-paperwrap .ce-typing:focus{outline:none; box-shadow:none}
  /* TYPING IN THE MARKS (14 Sep 2026): a struck run is an ATOM the caret steps
     over and nothing types into, drawn in the sheet's own del/ins clothes; a
     run struck across a line break keeps its break. */
  .ce-paperwrap .ce-typing [data-ce-mark="del"]{white-space:pre-wrap; cursor:default}
  /* ---- AND THE CLAUSE'S NAME KEEPS ITS OWN GEOMETRY ----
     .ce-headbox adds no colour, no fill and no size of its own, so the heading
     keeps the paper's own heading type. The negative margins the wording's box
     uses would pull the name off the row it shares with the pencil, so this one
     insets instead, and the min-width is what keeps an empty name pressable.

     AND THE INSET IS HORIZONTAL ONLY (15 Sep 2026). A vertical inset of its
     own had to be given back by a negative margin-BOTTOM, which is the same
     shorthand that carries the 5px gap this heading keeps under itself - so
     cancelling the padding cancelled the gap, and the wording jumped five
     pixels up the moment the box opened. Measured. Nothing vertical is stated
     here now, so the heading's own spacing is untouched by construction and
     there is nothing to keep in step. */
  ${''/* AND ITS INSET IS CANCELLED (15 Sep 2026, "nothing on the page should
         move ... just because I entered a cursor in the clause"). The note
         above is right that the wording's own negative margins would pull the
         NAME off the row it shares with the pencil - vertically. Horizontally
         they do no such thing, and padding with nothing taking it back moved
         the name 4px right and 2px down the moment the box opened, measured on
         a real page. The inset is kept (an empty name needs something to
         press) and cancelled exactly, the way the wording's box does it. */}
  ${''/* AT THE SAME WEIGHT AS THE RULE ABOVE, and written after it, because
         the name box states its own smaller inset and would otherwise be
         overruled by the wording box's. */}
  .ce-paperwrap .rl-doc .rl-clause .ce-headbox{padding:0 4px; margin-left:-4px; margin-right:-4px; min-width:60px}
  .ce-stat{font-size:var(--t-label); font-weight:var(--w-title); white-space:nowrap}
  .ce-stat .i{color:var(--st-green-fg)} .ce-stat .d{color:var(--st-ruby-fg)}
  .ce-stat .ce-none{color:var(--color-neutral-600); font-weight:var(--w-body)}

  /* ---- the foot of the left column: what is saved, and the way back ---- */
  .ce-foot{flex:none; display:flex; align-items:center; gap:10px; padding:9px 18px;
    background:var(--color-surface); border-top:1px solid var(--color-divider);
    flex-wrap:wrap; min-height:48px}
  .ce-foot .draft{font-size:var(--t-label); color:var(--color-neutral-600)}
  .ce-foot .draft b{font-weight:var(--w-title); color:var(--color-text); font-variant-numeric:tabular-nums}
  .ce-foot .undo{background:none; border:0; font:inherit; font-size:var(--t-label); font-weight:var(--w-label);
    color:var(--accent-ink); padding:0 4px; margin:0 -4px; min-height:var(--tap-min); display:inline-flex; align-items:center;
    border-radius:var(--radius); cursor:pointer}
  .ce-foot .undo:hover:not([disabled]){background:color-mix(in srgb,var(--accent-solid) 10%,transparent)}
  .ce-foot .undo[disabled]{color:var(--color-neutral-500)}
  .ce-foot .g{flex:1; min-width:8px}

  /* ---- the band over Copilot: whose words these are ----
     The reference page carries ONE brand colour and no other, so the Copilot
     label takes the workspace accent here rather than a violet of its own.
     That is a decision about THIS page: the clause panel's own Copilot button
     keeps the violet it has always worn. */
  .ce-ah{flex:none; display:flex; align-items:center; gap:18px; padding:0 14px; flex-wrap:nowrap;
    border-bottom:1px solid var(--color-divider)}
  /* THE RAIL'S OWN LABEL DOES NOT WRAP EITHER. Two words at 50px wrapped to
     two lines and the head stood at 58px while the tabs beside it had already
     been made to hold still — the same squeeze, one element along. Between
     the label and the tabs there is exactly ONE thing on this row that may
     give, and it is the clause name, which elides and keeps the whole of
     itself on its hover. */
  .ce-ah .sp{display:inline-flex; align-items:center; gap:7px; font-size:var(--t-meta); font-weight:var(--w-title);
    color:var(--accent-ink); padding:var(--s-3) 0; flex:none; white-space:nowrap}
  /* The clause the rail is about: the page's own ink at the title weight, so
     it reads as the SUBJECT beside Copilot's accent label rather than as a
     second heading. It takes the row's slack and gives it all back to the tabs
     when it has to (min-width:0 is what lets it shrink below its text). */
  /* IT MAY NOT GROW THE ROW, and MEASURED it did: 44px → 61px, because a
     plain span takes the row's own line-height where .sp beside it is an
     inline-flex that makes its own line box. It carries NO vertical padding
     and centres itself, so the head's height stays whatever .sp and the tabs
     make it and this name is a passenger — the rule that keeps chrome off a
     full-window page's paper. */
  .ce-ah-cl{min-width:0; flex:0 1 auto; align-self:center; overflow:hidden; text-overflow:ellipsis;
    white-space:nowrap; line-height:var(--lh-tight);
    font-size:var(--t-meta); font-weight:var(--w-title); color:var(--color-text)}
  /* THE TABS KEEP THEIR WIDTH AND THE NAME GIVES WAY. Without flex:none the
     name took 132px off the row, the four tabs wrapped to two lines and the
     head grew 44px → 61px — a label pushing CONTROLS onto a second line,
     which is the wrong way round. The tabs are controls and hold their
     natural width; the name is a label and elides, with the whole of it on
     its hover. MEASURED back to 44px. */
  .ce-tabs{display:flex; gap:18px; margin-left:auto; flex:none}
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
  /* ---- THE LADDER CARD AND THE TWO NEW TABS (14 Sep 2026) ---- */
  .ce-lcard .k{font-size:var(--t-micro); font-weight:var(--w-title); letter-spacing:.06em; text-transform:uppercase;
    color:var(--color-neutral-500); margin:10px 0 3px}
  .ce-lcard .k:first-child{margin-top:0}
  .ce-lcard .said{font-style:italic; color:var(--color-neutral-600)}
  .ce-lcard .cost{font-size:var(--t-label); color:var(--color-neutral-600); margin-top:8px}
  .ce-lcard .acts{display:flex; gap:8px; margin-top:10px; flex-wrap:wrap}
  .ce-ladder-lane{padding:0}
  .ce-ladder-lane .rl-cp-sec{margin:0 0 18px}
  .ce-ladder-lane .rl-cp-h{margin:0 0 var(--s-1); font-size:var(--t-label); font-weight:var(--w-title); letter-spacing:.06em;
    text-transform:uppercase; color:var(--color-neutral-500)}
  .ce-fig-note{font-size:var(--t-meta); color:var(--color-neutral-600); margin:8px 0 0}
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
  .ce-card .av button{height:var(--ctl-h-sm); padding:0 var(--pad-ctl-x-sm); font:inherit; font-size:var(--t-meta); font-weight:var(--w-label);
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
  ${''/* ---- AND THE BOX OPENS (Young, 21 Sep 2026: "I should be able to
         expand the window to read better") ----
         A proposed clause is the one thing on this rail a reader has to read
         in full before pressing anything, and it was shown through a 120px
         window with its own scrollbar. The cap stays as the RESTING shape —
         four cards each running the length of a clause is a rail nobody can
         scan — and the press drops it. The control is drawn only where there
         is really more to see, measured after the paint (ceScanFitPv), so a
         two-line preview grows no dead button. */}
  .ce-rule .pv{display:block; margin-top:4px; padding:var(--s-2) 10px; background:var(--color-surface);
    border:1px solid var(--color-divider); font-size:var(--t-meta); line-height:1.65;
    max-height:120px; overflow:auto}
  .ce-rule .pv.is-open{max-height:none; overflow:visible}
  .ce-rule .pv-more{display:none; margin-top:5px; padding:0; border:0; background:none; font:inherit;
    font-size:var(--t-label); font-weight:var(--w-strong); color:var(--accent-ink); cursor:pointer}
  .ce-rule .pv-more.is-live{display:inline-block}
  .ce-rule .pv-more:hover{text-decoration:underline}
  ${''/* WHAT THE PRESS COSTS. Quiet on purpose — see ceCostLine. Tabular figures
         so a column of these lines up rather than dancing. */}
  .ce-rule .cost{display:block; margin-top:7px; font-size:var(--t-label); line-height:1.45;
    color:var(--color-neutral-600); font-variant-numeric:tabular-nums}
  .ce-rule .cost b{font-weight:var(--w-strong); color:var(--color-text)}
  ${''/* The card's own sentence where no adjustment could be worked out — a
         fact about this clause, in the quiet ink, never a band. */}
  .ce-rule .nofit{display:block; margin-top:var(--s-2); font-size:var(--t-label); line-height:1.5;
    color:var(--color-neutral-600)}
  .ce-rule .filed{font-size:var(--t-label); font-weight:var(--w-strong); color:var(--st-green-fg)}
  .ce-rule .av{display:flex; gap:var(--s-2); margin-top:9px; flex-wrap:wrap}
  .ce-rule .av button{height:var(--ctl-h-sm); padding:0 var(--pad-ctl-x-sm); font:inherit; font-size:var(--t-meta); font-weight:var(--w-label);
    background:var(--color-surface); color:var(--accent-ink); border:1px solid var(--color-divider)}
  .ce-rule .av button:hover{border-color:var(--accent-solid)}

  /* THE CHIPS WRAP (the redesign's second pass, 21 Sep 2026 — the reference
     frame draws them on two rows). They used to run on ONE line that scrolled
     sideways under a fade mask, so the third and fourth question were off the
     edge of a 340px rail and reachable only by a horizontal scroll nobody
     makes. Each chip still keeps its own words on one line. */
  .ce-chips{flex:none; display:flex; gap:6px; flex-wrap:wrap;
    padding:0 14px 9px; background:var(--color-surface)}
  .ce-chips:empty{padding:0}
  .ce-chips button{flex:none; height:var(--ctl-h-sm); padding:0 var(--pad-ctl-x-sm); font:inherit; font-size:var(--t-meta); font-weight:var(--w-label);
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
  .ce-ask button{flex:none; display:inline-grid; place-items:center; width:var(--ctl-h); height:var(--ctl-h);
    padding:0; background:var(--color-accent-700); border:1px solid var(--color-accent-700);
    color:#fff}
  .ce-ask button svg{width:var(--btn-ic); height:var(--btn-ic); display:block}
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

  /* ---- THE PASSAGE GOES TO THE COPILOT RAIL (M-1, 31 Aug 2026) ----
     The strip that used to open over the paper is gone on the owner's ruling;
     what is left here is the mark it left on the sentence, which the rail still
     needs. See ceAttachPassage, and THE HIGHLIGHT GOES TO COPILOT in THE MAP.

     THE CARD IS DRESSED HERE and it sits between the conversation and the
     ready-made questions, DIRECTLY over the ask box. It takes no flex, so the
     conversation above gives up the height and never the box below; and it
     draws NOTHING when nothing is attached. NO BACKTICK MAY APPEAR IN A COMMENT
     IN THIS BLOCK — the sheet is returned from a template literal, so one ends
     the string and the browser parses the rules after it as code. */
  /* ---- THE SENTENCE THE RAIL IS HOLDING (owner-approved render, 30 Aug 2026;
     KEPT AND RE-POINTED 31 Aug 2026 by M-1) ----
     A document has ONE selection, so the moment the caret moves anywhere else —
     into the strip, when there was one; into the rail's ask box now — the
     browser stops painting the reader's own highlight, and the sentence being
     worked on would go invisible at the exact moment its replacement is being
     asked for. This is the mark that keeps it visible, and the owner ruled on
     it as a mark on the contract rather than as a detail.

     IT IS WHY OPTION A DID NOT HAVE TO GIVE UP THE LIT PASSAGE. The render that
     chose the rail named the lost highlight as a cost; this mark, built the day
     before for the strip, pays it. See ceMarkHeld for why it can never reach
     the record.

     THE WORKSPACE ACCENT, DELIBERATELY: it is the same colour as the card's own
     quote rule in the rail, which is what ties the two together — this sentence
     and that card are one thing shown twice. Drawn as a background and an INSET
     shadow, so it occupies no space and no word moves when it appears or goes;
     and mixed against the accent rather than typed as a colour, so it follows
     the workspace's own brand and needs no answer of its own at night. */
  .ce-paperwrap .ce-held{
    background:color-mix(in srgb, var(--accent-solid) 16%, transparent);
    box-shadow:inset 0 -2px 0 var(--accent-solid);
  }
  .ce-rail #ce-scope{flex:none}
  .ce-scope{margin:0 13px 9px; padding:8px 10px;
    background:var(--color-neutral-100); border:1px solid var(--color-divider)}
  .ce-scope .eb{display:flex; align-items:center; gap:6px; font-size:var(--t-figure);
    font-weight:var(--w-title); letter-spacing:.09em; text-transform:uppercase;
    color:var(--accent-ink)}
  .ce-scope .eb b{font-weight:var(--w-title)}
  .ce-scope .eb .g{flex:1; min-width:4px}
  .ce-scope .x{flex:none; width:var(--ctl-h-sm); height:var(--ctl-h-sm); display:inline-grid; place-items:center; padding:0; border-radius:var(--radius);
    font:inherit; font-size:var(--t-label); background:none; border:0;
    color:var(--color-neutral-600); cursor:pointer}
  .ce-scope .x:hover{color:var(--color-text)}
  .ce-card.ce-ans q.aq{display:block; margin:6px 0 2px; padding-left:8px; quotes:none; white-space:pre-line;
    border-left:2px solid var(--accent-fill); font-style:italic; color:var(--color-text)}
  .ce-scope q{display:block; margin-top:5px; padding-left:8px; quotes:none;
    border-left:2px solid var(--accent-solid);
    font-size:var(--t-label); line-height:1.55; color:var(--color-text);
    display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden}
  .ce-scope .cut{margin-top:7px; height:22px; padding:0 var(--s-2); font:inherit;
    font-size:var(--t-label); font-weight:var(--w-strong); background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--st-ruby-fg); cursor:pointer}
  .ce-scope .cut:hover{border-color:var(--st-ruby-fg)}
  ${''/* ---- ONE CARD, FOUR SHAPES (fix 5, 23 Sep 2026) ----
     The approved drawing's own: a question in Copilot's violet, the whole
     contract in steel, a small line under the quote saying what the card
     holds. Colours are the ones those meanings already wear on this page. */}
  .ce-scope.is-asking .eb{color:#6d28d9}
  html.dark .ce-scope.is-asking .eb{color:#c4b5fd}
  .ce-scope.is-asking q{border-left-color:#6d28d9}
  html.dark .ce-scope.is-asking q{border-left-color:#c4b5fd}
  .ce-scope.is-whole .eb{color:var(--st-steel-fg)}
  .ce-scope.is-clause q{-webkit-line-clamp:3}
  .ce-scope .sm{margin:6px 0 0; font-size:var(--t-label); line-height:1.5; color:var(--color-neutral-600)}

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
/* Presented: this is a name on its way to a SCREEN — the greeting, the reading
   line, the scope line and the leave warning — and the page reads in the
   product's one format whatever case the paper shouted in. The RECORD is not
   touched: clauseLabel still builds the stamped name, and this only changes
   what is printed. */
function ceClauseLabel(cl){
  if (!cl) return '';
  let raw = '';
  try{ if (window.negoClauseLabel) raw = negoClauseLabel(cl); }catch(_){}
  if (!raw) raw = String(cl.headingText || cl.title || '').trim();
  return window.negoClauseName ? negoClauseName(raw) : raw;
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
/* ---- WHICH ASK THIS PAGE IS WRITING ON (13 Sep 2026) ----
   The lead change where it is the OTHER side's live proposal on this clause:
   the box was seeded from its wording, so a filing is a counter written on it
   and files `onTop`. Null where the lead is ours (a revision of our own ask),
   an insertion (revised through negoReviseInsert), or absent. */
function ceStacksOn(){
  const on = _ceLead;
  if (!on || on.status !== 'pending' || on.withdrawn || on.changeType === 'insertClause') return null;
  if (on.authorSide !== 'owner') return on;
  /* THE LEAD IS OUR OWN COUNTER, STANDING ON THEIR PARKED ASK: a further edit
     is a revision of that counter and is still measured against THEIR wording
     — or the stack would fall apart at the first revision (the fold rewrites
     oldText from what the draft was measured against). rlStackUnder is the
     paper's own reading of what a counter stands on. */
  try{
    const under = window.rlStackUnder ? rlStackUnder(_ceC, on) : null;
    if (under && under.authorSide !== 'owner' && under.changeType !== 'insertClause') return under;
  }catch(_){}
  return null;
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

/* WHAT A CHANGE STORES, WITH NO FALLBACK. bodyHtml first: it is what the change
   actually holds and what the funnel takes back. newText is its projection and
   is the fallback for a change filed before rich bodies existed. Empty means
   the change stored no wording of its own — which is a different fact from
   "it proposes the wording that stands", and telling the two apart is what the
   reading below is for. */
function ceProposedOf(ch){
  const rich = String((ch && ch.bodyHtml) == null ? '' : ch.bodyHtml).trim();
  const t = String((ch && ch.newText) == null ? '' : ch.newText).trim();
  /* THE WORDS ARE THE RECORD (13 Sep 2026). newText is what the funnel hashed,
     what travels and what the ops rebuild; the rich body is its dress. A
     revision filed without a body (a text-only route over a rich ask) leaves
     the OLD body beside the NEW words, and seeding from that body would open
     this page on wording the record no longer claims — and mark the difference
     as the reader's own. Where the two disagree, the words win. */
  if (rich && t){
    const same = s => String(s || '').replace(/\s+/g, ' ').trim();
    if (same(ceWords(rich)) !== same(t)) return ceRich(t);
  }
  if (rich) return rich;
  return t ? ceRich(t) : '';
}
/* ---- AN ASK THAT LEAVES NO WORDING ---- (owner-reported 10 Sep 2026)
   "Press ✦ Edit with Copilot and the clause editor opens on an EMPTY editable
   box with +0 −103 above it. Nothing on the page says what is being removed."

   ONE READING, because a proposed deletion reaches this page in TWO shapes and
   testing the type in one place and the body in another is how they would come
   to disagree about the same ask:

     A · a TRUE deleteClause stores bodyHtml:null and newText:'' — so the old
         ceWordingOf fell through both and answered with the STANDING wording,
         and the page then drew the clause in full, clean, and (because the
         draft equalled the baseline) opened TYPEABLE. The deletion was invisible
         and nothing on the page even hinted at it. MEASURED: 0 del marks.
     B · a MODIFY whose body is empty markup — `<p><br></p>`, which is exactly
         what a browser leaves when you select all and delete in a contenteditable
         box. It survives sanitising, seeds the draft as that markup, and drew an
         empty box. THAT IS THE REPORTED SCREEN.

   A CHANGE WHOSE PROPOSED BODY RENDERS TO NOTHING IS A PROPOSAL TO REMOVE THE
   WORDING, WHATEVER ITS changeType SAYS. That is the reading, and it is the one
   the page never had.

   IT REQUIRES SOMETHING TO HAVE BEEN STORED, and that narrowing is deliberate.
   A change holding no body and no newText at all stored NOTHING rather than
   stored emptiness — the funnel refuses a modify that proposes nothing, so it
   should not exist — and reading it as "remove the clause" would be this page
   inventing an ask. It falls through to what it always did. */
function ceRemovesWording(ch){
  if (!ch) return false;
  if (ch.changeType === 'deleteClause') return true;
  const body = ceProposedOf(ch);
  if (!body) return false;
  return !String(ceWords(body) || '').trim();
}
/* Is the clause on this page under a proposal to remove it? Read off the LEAD
   change, which is the one the paper is drawing — so the editor and the
   contract agree about which of several rival asks the page is answering. */
const ceUnderDeletion = () => ceRemovesWording(_ceLead);

function ceWordingOf(ch){
  if (!ch) return _ceBase;
  /* EMPTY, so the marks measure the whole clause OUT. ceRedlineHtml then draws
     the standing wording struck through — the deletion's own reading, through
     the page's own op renderer, so it inherits the same hanging indents and
     sub-paragraph shape as every other clause. Nothing is re-diffed: what is
     compared is the two texts the record already holds. */
  if (ceRemovesWording(ch)) return '';
  return ceProposedOf(ch) || _ceBase;
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
/* HOW MANY FINDINGS THIS CLAUSE HAS OF ITS OWN — the one reading behind the
   opening tab. It reads the review already on the record and spends nothing;
   a contract with no review answers 0 and the rail opens on the greeting, as
   it always did. */
function ceClauseFindings(){
  try{ return ceScanGroups().here.length; }catch(_){ return 0; }
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
const ceDeviationCount = () => ceScanItems().filter(it => it.v
  && (window.pbVerdictOpen ? pbVerdictOpen(it.v) : !/^(aligned|ok|na)$/.test(String(it.v.status || '')))).length;

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
/* ---- THE CLAUSE KEEPS ITS SHAPE ON THIS PAGE TOO (Young ruled 15 Sep 2026) ----
   *"when you press the pencil button and you move to the editor page, the
   fonts of the contract change in some case they become bold. The contract
   should never change from one screen to another."*

   THE PENCIL IS WHERE THE READER SAW IT, so this is where the fix has to be
   asked for as well — the negotiate page's own canvas asks rlClauseShape at
   the draw, and a page that did not would be the two screens disagreeing
   again, one fix later. ONE READING, THROUGH window: js/views/negotiation.js
   publishes it, this file reads it by name, and a stage without that file
   simply gets the shape it always got. */
function ceShapeMap(){
  if (!window.rlClauseShape || !_ceC || !_ceClauseId) return null;
  try{
    const cl = window.negoClauseNowById ? negoClauseNowById(_ceC, _ceClauseId) : null;
    return cl ? rlClauseShape(cl) : null;
  }catch(_){ return null; }
}
function ceRedlineHtml(a, b){
  const ops = ceOps(a, b);
  if (!ops) return `<p>${_cee(ceWords(b))}</p>`;
  try{
    /* THE DRAFT IS OURS: this page is our seat's by construction, so a mark
       drawn here wears the accent (14 Sep 2026). */
    if (window.redlineOpsBlocksHtml) return redlineOpsBlocksHtml(ops, { who: 'us', shape: ceShapeMap() });
    if (window.redlineOpsHtml) return `<p>${redlineOpsHtml(ops, { who: 'us' })}</p>`;
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

/* ---- THE MARKED READING IS LAYERED (Young ruled 13 Sep 2026 — "the Large
   option") ----
   Where the box was seeded from THEIR pending ask, the draft is a counter
   written on it, and the picture of it is two layers on one paragraph: their
   marks against what stands (their STORED ops, never re-diffed) in the other
   side's colour, and ours against their wording in ours. The negotiation page
   draws a filed stack the same way (rlLayeredHtml); this is the same reading
   for a draft that has not been filed yet, so the page the reader types on and
   the page the record is drawn on cannot disagree about what a counter looks
   like. A rewrite whose marks would outnumber its words draws as a REPLACEMENT
   — one struck block, one inserted block, the line saying what it stands on —
   exactly as the filed one will. Where there is no ask to stand on, or their
   ops do not rebuild the wording the draft was written on, the draft is marked
   against what stands, as it always was. */
function ceMarkedHtml(text){
  const draft = text == null ? _ceText : text;
  const on = ceStacksOn();
  if (on && Array.isArray(on.ops) && on.ops.length && window.redlineLayerOps && window.redlineOpsBlocksHtml){
    try{
      const theirs = ceWords(on.newText), ours = ceWords(draft);
      if (window.redlineWholesale && window.redlineReplacementHtml && ours !== theirs && redlineWholesale(theirs, ours)){
        return redlineReplacementHtml(theirs, ours, { under: 'them', over: 'us',
          stands: _cet('ng_repl_stands', { ids: '#' + on.id }) });
      }
      const overOps = window.redlineOpsStructured ? redlineOpsStructured(theirs, ours)
        : (window.redlineOps ? redlineOps(theirs, ours) : null);
      const ops = overOps ? redlineLayerOps(on.ops, overOps, { under: 'them', over: 'us' }) : null;
      if (ops) return redlineOpsBlocksHtml(ops, { shape: ceShapeMap() });
    }catch(_){ /* falls through to the one-layer reading */ }
  }
  return ceRedlineHtml(_ceBase, draft);
}
/* ---- MAY THIS CLAUSE BE TYPED IN, RIGHT NOW — THE ONE READING (13 Sep 2026) ----
   With no pencil at rest (rule 1 of the layered redline: click into a clause
   and type), the absent pencil is no longer the signal that a clause cannot
   be written in. The refusal is SPOKEN when the click lands, in the sentences
   that already exist, and a caret never blinks in a clause the person cannot
   change. Asked by the press in the wording and by nothing else that decides
   for itself: every branch below is a wall the product already had. */
function ceTypingRefusal(){
  if (!_ceC) return _cet('ce_no_contract');
  if (ceUnderDeletion()) return _cet('ce_under_deletion');
  if (!ceEditableReading()) return _cet('ce_reading_only');
  try{
    const held = window.clauseLockHeldByOther ? clauseLockHeldByOther(_ceC, _ceClauseId) : null;
    if (held) return _cet('cl_locked_refuse',
      { who: String((held.by && held.by.name) || '').trim() || _cet('cl_a_colleague') });
  }catch(_){}
  try{
    const door = clauseEditorRefusal(_ceC, { side: 'owner', readonly: !!(_ceOpts && _ceOpts.readonly) });
    if (door) return door;
  }catch(_){}
  return null;
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
               that the header has gone, so it is never conditional.

               ---- AND IT SAYS THE WORD (owner-reported 10 Sep 2026: "the exit
               button is not so clear it is an exit button in the negotiations
               page. Maybe it should be a button that says exit.") ----
               It was the symbol alone, and the symbol is the prototype's own —
               four corners pointing in, which reads as "make this smaller" as
               readily as it reads as "leave". THE ONLY WAY OUT OF A FULL-WINDOW
               PAGE MAY NOT BE A GUESS: this page covers the shell, so a reader
               who cannot place this control has nothing else to press.

               THE SYMBOL STAYS BESIDE THE WORD rather than being replaced by
               it — it is what makes the control findable at a glance once you
               know it, and the word is what teaches it the first time.

               THE HOVER KEEPS THE LONGER SENTENCE. The label is the act in one
               word and the title says which mode is being left; a control whose
               name and whose hover are the same string tells the reader nothing
               twice. */}
        <button type="button" class="ce-exit" data-ce-act="close"
          title="${_ceea(_cet('ce_leave_work_mode'))}"
          aria-label="${_ceea(_cet('ce_leave_work_mode'))}">${CE_LEAVE_ICON}<span
          class="ce-exit-word">${_cee(_cet('ce_exit'))}</span></button>
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
           were TWO places to ask Copilot one question about one clause, and the
           louder of them covered the sentence it was about.

           NOTHING TAKES ITS PLACE ON THE PAPER, except the MARK: the held
           sentence keeps the accent wash built for the strip the day before,
           which is what lets the rail hold a passage without the reader losing
           sight of it. Replacing a sentence by hand is typing over it in the
           contract, which the contenteditable box has done since 26 Aug and
           which is what the owner asked for in the same breath.

           `.ce-inline` and its five functions are deleted; the two readings
           they rested on — ceSelection and ceReplacePassage — are untouched and
           are what the rail now presses. `ce_inline_ph`, `ce_inline_newline`,
           `ce_inline_cancel`, `ce_inline_replace`, `ce_inline_replace_title`
           and `ce_inline_where` are STALE. */}
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
          ${''/* ---- THE RAIL NAMES THE CLAUSE IT IS WORKING ON (Young ruled it
                 21 Sep 2026: "it is not clear which clause copilot is working
                 on") ----
                 MEASURED on the owner's own screen: the rail was discussing
                 Quality & Rejection while the paper beside it showed Governing
                 Law, and the only other place the clause is named is the shell
                 crumb — a different colour, in a different bar, forty pixels
                 up and out of the eye's path once a reader is deep in a
                 conversation about wording.
                 THROUGH `ceClauseLabel`, the one presenting reading this page
                 already has (it goes through clauseNameShown), so the rail
                 cannot spell a clause differently from the column, the paper
                 or the crumb. READ AT THE BUILD, which is enough because
                 ceGoClause closes and re-opens the page — the name cannot go
                 stale under a reader who moves to another clause.
                 IT ELIDES RATHER THAN WRAPS: this row also carries three tabs
                 and a count, and the whole name is on the hover. */}
          <span class="ce-ah-cl" title="${_ceea(ceClauseLabel(ceClause()) || _cet('ce_this_clause'))}">${_ceea(ceClauseLabel(ceClause()) || _cet('ce_this_clause'))}</span>
          <span class="ce-tabs" id="ce-tabs" role="group"
            aria-label="${_ceea(_cet('ce_tabs_group'))}">
            <button type="button" data-ce-tab="chat">${_cet('ce_tab_chat')}</button>
            <button type="button" data-ce-tab="ladder">${_cet('ce_tab_ladder')}</button>
            <button type="button" data-ce-tab="figure" id="ce-tab-figure">${_cet('ce_tab_figure')}</button>
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

/* ---- WHAT THE DRAFT IS, READ OFF THE RECORD ----
   ONE reading, TWO callers: the door seeds the page with it, and filing re-seeds
   with it, because after a change lands the record has moved and everything on
   this page is a statement about the record. A second copy of these nine lines
   is how the two would come to disagree about what the reader is looking at —
   which step stack, which lead ask, which baseline the marks are drawn against.

   IT SETS NO POSTURE. Whether the reader is typing, which tab the rail is on
   and where they are scrolled are all facts about the SITTING rather than about
   the record, and filing must not disturb any of them. */
function ceSeedDraft(changeId){
  _ceBase = ceStanding();
  _ceHeadBase = ceStandingHeading();
  _ceLead = ceLeadChange(changeId);
  _ceText = ceWordingOf(_ceLead);
  _ceHead = ceHeadingOf(_ceLead);
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase, head: _ceHeadBase }];
  if (_ceText !== _ceBase || _ceHead !== _ceHeadBase)
    _ceSteps.push({ label: (_ceLead && _ceLead.id) || _cet('ce_proposed'), text: _ceText, head: _ceHead });
  _ceStep = _ceSteps.length - 1;
  _ceOpenText = _ceText;   /* the mark clauseEditorDirty measures against */
  _ceOpenHead = _ceHead;
  _ceSavedAt = (_ceText !== _ceBase || _ceHead !== _ceHeadBase) ? ceNowHm() : null;
}
/* ---- THE LOCK IS KEPT WHILE THE PAGE IS OPEN ----
   A reader can write for twenty minutes without blurring the box, and a lock
   that lapsed under them would let a colleague in and then have the SERVER
   refuse the filing they had been writing all that time. So one interval, at
   well under half the window, so a missed tick can never cost the clause.

   IT COSTS ONE SMALL SAVE A MINUTE while an editor is open, and that is what
   makes the lock visible to anybody but its holder — a lock held in one tab is
   a note to yourself. Started at the door and STOPPED AT THE DOOR OUT, before
   the release, or a page that closed would go on holding a clause it had let
   go of. */
const CE_LOCK_BEAT_MS = 45000;
let _ceLockBeat = null;
function ceLockBeat(stop){
  if (_ceLockBeat){ clearInterval(_ceLockBeat); _ceLockBeat = null; }
  if (stop) return;
  _ceLockBeat = setInterval(() => {
    if (!clauseEditorOpen()){ ceLockBeat(true); return; }
    try{
      if (window.clauseLockKeep && clauseLockKeep(_ceC, _ceClauseId) && window.clauseLockSave) clauseLockSave(_ceC, { clauseId: _ceClauseId });
    }catch(_){}
  }, CE_LOCK_BEAT_MS);
}

function rlOpenClauseEditor(c, clauseId, opts = {}){
  const refusal = clauseEditorRefusal(c, opts);
  if (refusal){ if (window.toast) toast(refusal, 'err'); return false; }
  const probeC = c, probeId = String(clauseId || '');
  if (!probeId){ if (window.toast) toast(_cet('ce_no_clause'), 'err'); return false; }
  /* ---- ONE CLAUSE, ONE PAIR OF HANDS ---- (Young asked 10 Sep 2026)
     THE PENCIL IS THE SIGN AND THIS IS THE WALL, which is what makes the lock
     a rule rather than a decoration: the paper's pencil stands down where a
     colleague holds a clause, and FOUR other doors reach this page without
     passing it — the card's Edit, the sparkle on a tracked change, the clause
     panel's Copilot button, and the clause dropdown at the top of this page.
     A rule kept at one of five is not a rule.

     ASKED ON THE PROBE, BEFORE ANY STATE IS SET, so a refusal leaves nothing
     half-open behind it. */
  const heldBy = window.clauseLockHeldByOther ? clauseLockHeldByOther(probeC, probeId) : null;
  if (heldBy){
    /* 'warn' RATHER THAN 'err': nothing failed and nothing was refused that
       will not be permitted in a minute — this is somebody else's turn, not a
       mistake of the reader's. */
    if (window.toast) toast(_cet('cl_locked_refuse',
      { who: String((heldBy.by && heldBy.by.name) || '').trim() || _cet('cl_a_colleague') }), 'warn');
    return false;
  }
  /* ---- AN EXPLICIT ASK TO TYPE OUTRANKS THE OPENING POSTURE ----
     Set when the reader clicked INTO another clause's words, which is that
     reader saying "type here" as plainly as a pencil press does. It is
     CONSUMED rather than stored: _ceOpts is what every later ceGoClause
     inherits, so left on it one click into the words would silently make every
     later move to another clause open typing too. */
  const wantTyping = !!(opts && opts.typing === true);
  /* CONSUMED HERE, exactly as the typing ask beside it is: read once into a
     local and cleared, so an open that returns early below cannot leave it
     standing for the next arrival to obey. */
  const placeAt = _cePlaceAt; _cePlaceAt = null;
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
  /* TAKEN ONCE THE CLAUSE IS REALLY THERE, never at the press: a lock on a
     clause this page then refuses to open would be held by nobody who could
     let it go. It is refreshed on every pull and released at every door out. */
  try{
    if (window.clauseLockTake && clauseLockTake(_ceC, _ceClauseId) && window.clauseLockSave) clauseLockSave(_ceC, { clauseId: _ceClauseId });
  }catch(_){}
  ceLockBeat();
  ceSeedDraft(opts.changeId);
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
  /* ---- AND A PROPOSED DELETION OUTRANKS THE ASK TO TYPE ---- (10 Sep 2026)
     The rule above is "is there anything to hide?", and on a clause the other
     side wants removed there is: the whole of it. The ✦ on a change, the
     paper's pencil and the panel's Copilot button all ask for typing, and all
     three of them are the doors a reader reaches this state through — so an
     ask to type must not be what hides the ask being read. It opens SHOWING
     THE STRIKE-THROUGH, every time.

     AND TYPING IS NOT OFFERED ON IT AT ALL, which is the honest interim answer
     to a question that is the owner's: what SHOULD typing mean on a clause
     under deletion? It is a real act — counter-proposing wording, which the
     funnel already handles by superseding rivals — but "Save to CHG-005" is
     the wrong name for it and would read as editing an ask that proposes
     nothing. Until that is ruled on, every door into the wording asks
     ceUnderDeletion and stands down: the pencil is not drawn, Apply refuses in
     words, and a card carries no Apply. */
  _ceEditing = !ceUnderDeletion()
    && (wantTyping || (_ceText === _ceBase && _ceHead === _ceHeadBase));
  _ceThread = []; _ceBusy = false; _ceScanBusy = false; _ceScanErr = null; _ceSel = null; _ceWhole = false;
  _ceScan = null; _ceScanFiled = {};
  /* ---- THE RAIL OPENS ON THE FINDING IT IS ALREADY HOLDING ----
     (owner-approved 13 Sep 2026, group 1 of the build plan.)

     It opened on an empty greeting box even where its OWN Playbook tab, two
     inches away, already listed this clause's standards with a verb on each.
     The reader had to know to press a tab to be shown a finding the page had
     in its hand.

     THIS IS A DEFAULT AND NOTHING ELSE. No new reading, no second telling of
     the playbook (Prepare redlines files one redline per gap across the whole
     contract, and this tab states the position per clause — a third statement
     is the duplication this codebase pays most for), and NO SPEND: the groups
     are read off the review already on the record.

     SCOPED TO `here`, NEVER `missing`. `here` is this clause's own located
     findings; `missing` is a standard found nowhere in the document, which is
     true of every clause at once — opening the tab on that would open it on
     every clause of a contract that is short one standard, which is not "this
     clause has findings".

     AN EXPLICIT ASK WINS EITHER WAY: a caller naming a tab gets that tab, so
     the four doors that open this page can still say where to land.

     ORDER MATTERS: the reset above has to run first, or the groups are read
     through the PREVIOUS sitting's scan. */
  /* THE PENCIL KEEPS SUGGESTIONS (Young, 13 Sep 2026, with the page on
     screen: "when i click on the pencil, it takes me to the playbook scan
     page when i should remain in the suggestions"). This reverses the
     auto-open above the same day it shipped: the rail opens on the greeting
     unless a caller NAMES the Playbook tab. ceClauseFindings stays as a
     reading with no caller here; the Playbook tab's own count still shows
     the findings without moving anybody onto it. */
  _ceTab = opts.tab === 'scan' ? 'scan' : 'chat';

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
  /* THE SHELL BAR'S THREE PANEL DOORS ARE DEAD WHILE THIS PAGE COVERS THE
     WINDOW — Chat, the bell and Activity all open the same drawer, which sits
     at z-index 46 against this page's 54, so every one of those presses would
     put a panel up behind it. Painted here rather than on a view change,
     because opening this page is not one.

     WIDENED 1 Sep 2026 (owner-asked) from the Chat door alone to all three:
     panelSuppressed answers for this page now, and paintShellDoors is the one
     call that re-asks it — including applyPanelLayout, so a drawer that was
     already open goes away rather than sitting behind the page.

     BEFORE THE PAGE TAKES FOCUS, deliberately: releasing an open drawer's
     focus trap hands the caret back to whatever opened it, and the landing
     below has to be the last word on where the reader ends up. */
  try{ if (window.paintShellDoors) paintShellDoors(); }catch(_){}
  ceWirePage(page);
  ceFitToShell(); ceObserveShell();
  /* AFTER ceFitToShell, so the first split is measured against the box this
     page actually occupies rather than against one still at its CSS size. */
  ceWireSplit();
  /* The greeting goes in BEFORE the first paint rather than after it — drawing
     an empty lane and then filling it is two paints for one arrival. */
  _ceThread.push({ who: 'ai', greeting: true });
  ceRenderAll();
  /* The paper's Ask Copilot names the words it was pressed on; they go to
     the rail once the page is drawn. */
  /* THE NEGOTIATE PAGE'S HIGHLIGHT IS THE THIRD PICK DOOR (12 Sep 2026): its
     menu picks on mousedown and opens this page with the words in hand; the
     mouse-up then lands on THIS paper before the deferred attach below has
     run. Stamped at the open, so that mouse-up ends the press that opened
     the page rather than clearing what the attach is about to hold. */
  if (opts && opts.passage){ ceStampPick(); setTimeout(() => { try { ceAttachWords(opts.passage, opts.passageMode); } catch (e){} }, 0); }
  /* THE CLAUSE YOU CAME IN ON IS WHAT THIS PAGE IS ABOUT, and on a long
     contract it can be twenty clauses down. Bringing it into view is the whole
     difference between arriving at the clause and arriving at the contract. */
  ceScrollToClause(placeAt);
  /* the bar's third crumb names this clause (second pass, 21 Sep 2026) */
  try{ if (window.shellCrumbLayer) shellCrumbLayer(i18t('ce_crumb_edit', { clause: ceClauseLabel(ceClause()) || _ceClauseId })); }catch(_){}
  /* AN ASK TO TYPE THAT THE CLAUSE REFUSES IS SAID, NOT SWALLOWED (13 Sep
     2026): a click into a clause the other side wants removed arrives here
     with typing asked for, opens showing the strike-through, and says why. */
  if (wantTyping && !_ceEditing){ const why = ceTypingRefusal(); if (why) ceSay(why); }
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
  try{ if (window.shellCrumbLayer) shellCrumbLayer(null); }catch(_){}
  /* LETTING GO IS THE FIRST THING THE CLOSE DOES, and only ever our own lock —
     clauseLockRelease refuses somebody else's, which is what stops a browser
     that lost a race taking a clause off the colleague who won it. Before the
     state is cleared, because the release needs to know which clause. */
  ceLockBeat(true);
  try{
    if (window.clauseLockRelease && clauseLockRelease(_ceC, _ceClauseId) && window.clauseLockSave) clauseLockSave(_ceC, { clauseId: _ceClauseId, release: true });
  }catch(_){}
  const page = document.getElementById('clause-editor');
  if (page) page.remove();
  document.body.classList.remove('ce-open');
  const again = _ceAgain;
  let readMoved = false;
  try{ readMoved = _ceRead0 != null && window.rlReadMode && rlReadMode() !== _ceRead0; }catch(_){}
  _ceRead0 = null;
  _ceC = null; _ceClauseId = null; _ceOpts = null; _ceAgain = null;
  _ceThread = []; _ceSteps = []; _ceStep = 0; _ceSel = null; _ceLead = null; _ceWhole = false;
  _ceRendering = false; _ceZoom = 100;
  _ceOpenText = '';
  _ceBusy = false;
  clearTimeout(_ceSayTimer);
  /* A repaint only where something actually moved. Closing without filing must
     leave the page underneath exactly as it was, scroll position included. */
  if ((opts.repaint || readMoved) && typeof again === 'function'){ try{ again(); }catch(_){} }
  /* And the shell bar's three panel doors come back, with the drawer the reader
     had open. AFTER the state is cleared, not before: clauseEditorOpen reads
     _ceClauseId, and panelSuppressed reads clauseEditorOpen, so a paint taken
     beside page.remove() still answers "the editor is open" and leaves all
     three dead for the rest of the sitting. Both halves together, and both in
     the right order. */
  try{ if (window.paintShellDoors) paintShellDoors(); }catch(_){}
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
/* ---- AND THEY ARE GONE (owner-asked 1 Sep 2026: "delete ever having the CHG
   pills on the screen") ----
   Everything above is the record of where they lived and why, kept because the
   reasoning is the useful part. DELETED RATHER THAN STUBBED, following Quarter,
   List and Obligations on the calendar: this was never exported, so there is no
   door a third caller could bring it back through.

   WHAT GOES WITH THEM, said out loud rather than absorbed: on a clause carrying
   several asks you can no longer switch, from inside this page, which one the
   editor is speaking for. Nothing is unreachable — the page is OPENED from a
   change (the card's Edit, the ✦ on a tracked change, the paper's pencil), so
   the reader arrives on the one they meant, and answering a different ask is
   the same journey they already took to get here. `_ceLead` is untouched: it is
   still set at the door and is still what the foot's "Save to CHG-006" names.
   `.ce-chip` and `data-ce-focus` are STALE — flag any mention. */

/* ---- MOVING TO ANOTHER CLAUSE IS ONE ACT, NOT TWO ----
   The crumb's dropdown and the pencil on another clause both mean "work on
   that one instead", and both go through here — a second copy is how the two
   come to disagree about what an unfinished draft costs. Reopening is what
   resets the whole page: the wording, the step stack, the Copilot thread and
   the change this editor is speaking for. */
/* ---- ONE GUARD, EVERY DOOR OUT OF ONE DRAFT (owner-asked 3 Sep 2026) ----
   *"Close them"*, of the two doors that did not ask. Every way out of this page
   warned before throwing away wording the record had never seen EXCEPT two —
   the "Leave work mode" button and Escape — which called the close directly. So
   one draft had doors answering differently, which is the drift this file opens
   by warning about, and the two that stayed silent are the two a reader reaches
   for when they mean to stop.

   IT IS THE PRODUCT'S OWN GUARD, LIFTED RATHER THAN COPIED. The dirty reading,
   the words and the two buttons were written out inside ceGoClause; a third and
   fourth copy is how they come to disagree about what an unfiled draft costs.
   ceLeaveGuard is that ask, said once, and the doors hand it what to do next.

   AND IT SITS AT THE DOORS, NEVER INSIDE rlCloseClauseEditor. That function is
   also called by this page's own move-to-another-clause and by the shell's
   viewLayersClosed, and BOTH have already asked by the time they reach it — a
   guard written inside the close would ask twice on exactly the two paths that
   were already right.

   NOT DIRTY, NO QUESTION: a reader who has typed nothing, or who has filed what
   they typed, is asked nothing at all, which is every ordinary close. */
function ceLeaveGuard(go){
  /* ---- READ THE BOX BEFORE ASKING WHETHER THERE IS ANYTHING IN IT ----
     _ceText only follows the box on BLUR, so a reader who is still typing when
     they reach for a door has a draft the guard cannot see. Pressing a BUTTON
     blurs the box on the way and would have got away with it; Escape does not
     blur anything at all, so without this the door I have just closed would
     open again silently on exactly the gesture it was closed for. And the
     pencil on ANOTHER clause reaches ceGoClause without pulling either.

     ONE PULL, IN THE GUARD, so a fourth door cannot forget it — and it is what
     every other door on this page already does before it acts (the pencil, the
     foot's File, the writing bar). Free where nothing is typeable: cePullText
     returns on its own first line. */
  cePullText();
  const dirty = (typeof clauseEditorDirty === 'function') && clauseEditorDirty();
  if (!dirty || typeof window === 'undefined' || !window.confirmDialog){ go(); return; }
  const ask = clauseEditorLeaveAsk();
  confirmDialog({ title: ask.title, message: ask.message,
    confirmLabel: _cet('ce_leave_go'), cancelLabel: _cet('act_cancel'), danger: true })
    .then(ok => { if (ok) go(); }).catch(() => {});
}
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
/* ---- THE CLAUSE YOU ASKED FOR STAYS WHERE IT IS (owner-reported 1 Sep 2026)
   ----
   *"when I click on the pencil the clause being edited should stay where it is
   as opposed to being pushed all the way to the top of the page ... I should
   always make the decision to scroll and not be moved without my choosing to do
   so."*

   MEASURED, and it is one line: moving between clauses CLOSES AND REOPENS this
   page, and arrival ends by placing the clause 24px below the top of the pane.
   That placement is right for a page that did not exist a frame ago — there is
   no position of the reader's to keep — and wrong every time it runs on a move
   INSIDE the page, where there very much is one.

   THE ANCHOR IS THE TARGET CLAUSE'S OWN TOP, not the scroller's number, and
   that is not a refinement: the clause being LEFT stops being typed in, so its
   marks come back and it grows; the clause being ENTERED starts being typed in,
   so its marks go and it shrinks. Everything below the first one therefore
   moves, and a remembered offset would land the reader somewhere else.
   Re-measuring the target after the render is the only reading that survives
   both.

   AND ONLY WHERE IT IS ON SCREEN TO BEGIN WITH. A jump from the clause list to
   something twenty clauses away has no place to keep — the reader is asking to
   be taken somewhere — so that falls through to the arrival placement, which is
   what it has always done. */
function ceGoClause(clauseId, extra){
  if (!clauseEditorOpen() || !clauseId || clauseId === _ceClauseId) return;
  ceLeaveGuard(() => {
    const c = _ceC, opts = _ceOpts;
    _cePlaceAt = ceClauseTopNow(clauseId);
    rlCloseClauseEditor();
    rlOpenClauseEditor(c, clauseId, extra ? { ...opts, ...extra } : opts);
  });
}
/* ---- THE WARNING SAYS WHICH CLAUSE AND WHAT IS AT RISK (owner-reported
   1 Sep 2026) ----
   *"The attached alert does not give you an indication of which clause or which
   wordings are in question and I therefore cannot track back to where i left
   off."*

   IT NAMED NEITHER. "Leave this clause?" over "the wording you have written
   here has not been filed" is true of every clause in the contract, and it is
   raised from a full-window page that carries no header — so at the moment the
   reader most needs to know where they are, nothing on screen says.

   ONE READING, TWO RAISERS. This page raises the guard when you move between
   clauses; the shell raises the same guard when you leave the page altogether
   (viewLayersClosed). A sentence written out at each would be two answers to
   one question, so it is written here — where the clause and the draft are —
   and the shell asks for it.

   THE CLAUSE IS NAMED BY clauseLabel, the product's own answer to "which clause
   is this", which the change cards and the Chat rows already print. It falls
   back to a snippet of the clause's own wording where there is no number and no
   heading, so it always says something.

   AND THE SNIPPET IS THE DRAFT ITSELF, read through richToText — the one text
   projection this codebase has — bounded, because a confirm dialog is one
   paragraph and a clause is not. It is there to be RECOGNISED rather than read:
   what the reader needs is to know which piece of work they are about to lose.

   THE FALLBACK IS ALWAYS THE OLD SENTENCE, never nothing: a guard that says
   less because a lookup failed is worse than the guard that prompted this. */
function clauseEditorLeaveAsk(){
  const tail = _cet('ce_leave_body');
  const bits = [];
  try{
    const cl = ceClause();
    const name = ceClauseLabel(cl);
    if (name) bits.push(_cet('ce_leave_on', { clause: name }));
  }catch(_){}
  try{
    const raw = (window.richToText ? richToText(_ceText || '') : '')
      .replace(/\s+/g, ' ').trim();
    if (raw.length > 3){
      const cut = raw.length > CE_LEAVE_SNIP ? raw.slice(0, CE_LEAVE_SNIP - 1).trim() + '\u2026' : raw;
      bits.push(_cet('ce_leave_lost', { words: cut }));
    }
  }catch(_){}
  bits.push(tail);
  return { title: _cet('ce_leave_title'), message: bits.join(' ') };
}
/* Bring the clause this page is about into the reader's view. Deferred a frame
   for the same reason the caret is: the paper it scrolls inside is written by
   the paint that is still running. */
/* ---- LANDING ON THE CLAUSE IS NOT A JOURNEY TO IT (owner-reported 31 Aug 2026)
   ---- *"The contracts still jumps around when you are trying to make edits.
   The contracts should stay firm where it is unless you are scrolling."*

   MEASURED, and it is the whole report: this wrote host.scrollTop BARE, and
   #ce-doc is a `.nego-scroll` carrying scroll-behavior:smooth — so opening a
   clause was a 28-frame ANIMATED GLIDE from the top of the contract down to it,
   0 → 728 on an ordinary agreement. The reader presses the pencil to edit one
   clause and watches half the contract fly past first.

   THE SAME CLASS AS THE 31 Aug FIX, ONE FUNCTION ALONG: a position change drawn
   as a journey. What was fixed then was putting the reader BACK where they were;
   this is putting them AT the clause they asked for, and neither is a trip.

   BOTH CALLERS LAND RATHER THAN TRAVEL, deliberately:
     · ARRIVING — the page is a full-window layer that did not exist a frame
       ago, so there is no position the reader was looking at to travel FROM.
       Animating from the top animates from a state that existed for one frame.
     · MOVING TO ANOTHER CLAUSE — ceGoClause re-seeds the draft and re-renders
       the paper first, so the glide would be an animation between two unrelated
       documents rather than a journey across one.

   WHAT KEEPS ITS JOURNEY, and this is why the stylesheet rule is not touched:
   the reader's own scrolling, and the negotiation page's rlLinkFocus, where
   pressing a change card really is a trip to its clause across a document that
   has not moved. */
function ceScrollToClause(placeAt){
  const go = () => {
    const host = _ceQ('#ce-doc');
    const box = _ceQ('#ce-clausebody');
    if (!host || !box) return;
    try{
      const sec = box.closest ? box.closest('.rl-clause') : null;
      const target = sec || box;
      const hb = host.getBoundingClientRect(), tb = target.getBoundingClientRect();
      /* THE READER'S OWN PLACE WINS WHERE THERE IS ONE — see ceGoClause. The
         24px is the ARRIVAL placement and is reached only on a first opening,
         or on a move to a clause that was not on screen to keep a place on. */
      const want = (placeAt == null) ? 24 : placeAt;
      /* Through the ONE thing on this page that moves the paper, so there is a
         single answer to "does the contract animate" rather than one per
         caller. */
      ceRestoreScroll(host, Math.max(0, host.scrollTop + (tb.top - hb.top) - want));
    }catch(_){}
    /* ---- AND ONLY NOW DOES THE CARET GO WHERE THE PRESS WENT (15 Sep 2026)
       ---- A press in ANOTHER clause closes this page and re-opens it on that
       clause, so there is no call site on that journey that could put the
       caret in the box — which is what made it cost a second press.

       IT HAS TO BE HERE, AFTER THE LANDING, and that was measured rather than
       reasoned: hung off the paint instead, the point resolved against a page
       that had not finished scrolling yet and the caret went to the top of the
       clause — pressed at (485, 299) and landed at (125, 289). The scroll is
       the last thing that moves the words under the reader's finger, so it is
       the first moment the pixel they pressed means anything.

       The point is consumed once and expires, so an arrival nobody clicked
       into — the pencil, the clause list, the door from the negotiate page —
       finds nothing here and behaves exactly as it always did. */
    if (_ceClickPt) ceFocusTyping();
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go); else go();
}
/* Where this clause's top sits inside the pane RIGHT NOW, or null where it is
   not drawn or not on screen. NULL IS THE HONEST ANSWER rather than a number: a
   clause above the fold or below it has no place to keep, and pretending it
   does would scroll the reader somewhere they had never been. */
function ceClauseTopNow(clauseId){
  try{
    const host = _ceQ('#ce-doc');
    if (!host || !clauseId) return null;
    const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(clauseId) : clauseId;
    const sec = host.querySelector('[data-clause="' + q + '"]');
    if (!sec) return null;
    const hb = host.getBoundingClientRect(), tb = sec.getBoundingClientRect();
    const top = tb.top - hb.top;
    return (top >= 0 && top <= hb.height) ? top : null;
  }catch(_){ return null; }
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
/* ---- ONE CLICK, AND THE CARET LANDS WHERE YOU PRESSED (Young ruled
   15 Sep 2026) ----
   *"I also do not want to click twice on any word or any location before I
   start doing anything ... Just put your cursor wherever you want once and
   start typing."*

   IT REALLY WAS TWO PRESSES, and for two different reasons depending on which
   clause you were in. On the clause already open, the first press turned
   typing on, repainted the clause and focused the BOX - which parks the caret
   at whichever end the browser picks, never where the finger went - so the
   second press was the one that placed it. On any other clause the page closed
   and re-opened on that clause and NOTHING took focus at all, so the first
   press only got you there.

   THE POINT IS WHAT IS REMEMBERED, NOT AN OFFSET. A character offset would
   have to be measured against the wording before the repaint and re-found
   after it, through a paint that wraps runs in ins and del and re-flows the
   marks - three readings of one clause, any of which can disagree. The screen
   point cannot disagree with itself: the browser is asked, after the paint,
   which character is under that pixel. It is only trustworthy because of the
   OTHER half of the same ruling - nothing on the page may move when a cursor
   enters a clause - so the pixel the reader pressed still has the same word
   under it afterwards. The two halves hold each other up.

   IT IS CONSUMED ONCE AND IT EXPIRES. The paper repaints on a timer while you
   type (the marks), and a point that outlived its press would haul the caret
   back to where the sentence started. Stale, or landing anywhere but inside
   the typing box, and this falls back to exactly what it did before. */
let _ceClickPt = null;
const CE_CLICK_PT_MS = 1500;
function ceHoldClickPoint(ev){
  if (!ev || typeof ev.clientX !== 'number') return;
  /* ---- HELD AGAINST THE CLAUSE, NOT AGAINST THE WINDOW ----
     A press in the clause already open needs nothing more than the pixel: the
     other half of this ruling says the clause does not move. A press in
     ANOTHER clause closes this page and re-opens it, and the clause lands back
     at its own old top rather than at the same window coordinate - so a point
     measured against the window is a point measured against a page that has
     been rebuilt under it, and the caret came down a line away. MEASURED:
     pressed at (485, 300), landed at (354, 312).

     The offset from the clause's own top-left survives all of it, because it
     is the clause's own geometry that the landing restores. */
  const sec = ev.target && ev.target.closest ? ev.target.closest('.rl-clause[data-clause]') : null;
  const r = sec ? sec.getBoundingClientRect() : null;
  _ceClickPt = { x: ev.clientX, y: ev.clientY, at: Date.now(),
    clause: sec ? sec.getAttribute('data-clause') : null,
    dx: r ? ev.clientX - r.left : null, dy: r ? ev.clientY - r.top : null };
}
/* Where that press is NOW, which is the offset put back on the clause's own
   corner wherever the paint has left it. Falls back to the raw pixel where the
   clause is not on the page (it was pressed and then closed, or the markup
   never carried a clause). */
function ceClickPointNow(pt){
  if (!pt) return null;
  if (!pt.clause || pt.dx == null) return { x: pt.x, y: pt.y };
  try{
    const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(pt.clause) : pt.clause;
    const sec = document.querySelector('#ce-doc .rl-clause[data-clause="' + q + '"]');
    if (!sec) return { x: pt.x, y: pt.y };
    const r = sec.getBoundingClientRect();
    return { x: r.left + pt.dx, y: r.top + pt.dy };
  }catch(_){ return { x: pt.x, y: pt.y }; }
}
function ceTakeClickPoint(){
  const pt = _ceClickPt;
  _ceClickPt = null;
  if (!pt || Date.now() - pt.at > CE_CLICK_PT_MS) return null;
  return pt;
}
/* The browser's own reading of "which character is under this pixel", asked
   for in both spellings because the two engines never agreed on one. */
function ceRangeAtPoint(x, y){
  try{
    if (typeof document.caretRangeFromPoint === 'function') return document.caretRangeFromPoint(x, y);
    if (typeof document.caretPositionFromPoint === 'function'){
      const p = document.caretPositionFromPoint(x, y);
      if (!p || !p.offsetNode) return null;
      const r = document.createRange();
      r.setStart(p.offsetNode, p.offset); r.collapse(true);
      return r;
    }
  }catch(_){}
  return null;
}
function ceFocusTyping(pt){
  if (typeof requestAnimationFrame !== 'function') return;
  const want = pt || ceTakeClickPoint();
  requestAnimationFrame(() => {
    const box = _ceQ('#ce-clausebody');
    if (!box || !ceIsTyping()) return;
    /* preventScroll, ALWAYS: focusing an element inside a scroller is one of
       the ways a browser moves a page on its own, and the reader's place is the
       one thing they are holding on to. */
    try{ box.focus({ preventScroll: true }); }catch(_){ try{ box.focus(); }catch(__){} }
    if (!want) return;
    /* A STRUCK RUN IS NOT A PLACE TO TYPE (the 14 Sep atom rule), so a point
       landing inside one puts the caret beside it rather than in it - the same
       answer the keyboard already gives at an atom's edge. */
    const at = ceClickPointNow(want);
    if (!at) return;
    const r = ceRangeAtPoint(at.x, at.y);
    if (!r || !r.startContainer) return;
    const node = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
    if (!node || !node.closest || !box.contains(node)) return;
    const atom = node.closest('[data-ce-mark="del"]');
    try{
      const sel = window.getSelection && window.getSelection();
      if (!sel) return;
      if (atom && atom.parentNode){
        const out = document.createRange();
        out.setStartAfter(atom); out.collapse(true);
        sel.removeAllRanges(); sel.addRange(out);
        return;
      }
      sel.removeAllRanges(); sel.addRange(r);
    }catch(_){}
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

/* ---- PUTTING THE READER BACK MUST NOT BE A JOURNEY ----
   (owner-reported 31 Aug 2026: "whenever I make change or click in the box, the
   contract moves up then back down to where i was. Remove this bug.")

   THE PAPER SCROLLS SMOOTHLY ON PURPOSE. `.nego-scroll` — which is what #ce-doc
   is — carries `scroll-behavior:smooth`, so a jump to a clause glides rather
   than teleporting, and that is right for a jump somebody asked for. It is
   wrong for putting the reader back where they already were: a repaint that
   rebuilds the paper resets the offset to zero, and the bare assignment that
   restores it is then ANIMATED — measured on this very element as a glide
   through 0, 2, 8, 18, 32 … 500 over about half a second. From the reader's
   chair that is the contract jumping to the top and travelling back down, which
   is exactly what was reported.

   SUSPENDED FOR THE WIDTH OF THE ASSIGNMENT, never turned off: the property is
   read back and put straight, so a jump the reader asks for a moment later
   still glides. It borrows the negotiation page's own rlRestoreScroll where
   that module is loaded, so the two pages cannot come to disagree about what
   restoring a position costs; the fallback is the same three lines, because
   this page must not depend on a module a stage may not carry (a bare
   cross-module read throws, and a guarded one would silently take the animated
   branch — the fault this codebase has recorded six times). */
function ceRestoreScroll(el, top){
  if (!el || top == null) return;
  if (typeof window !== 'undefined' && window.rlRestoreScroll){ rlRestoreScroll(el, top); return; }
  const prev = el.style.scrollBehavior;
  el.style.scrollBehavior = 'auto';
  el.scrollTop = top;
  el.style.scrollBehavior = prev;
}

function ceRenderPaper(){
  if (!clauseEditorOpen()) return;
  /* ---- A REBUILT PAPER TAKES THE STRIP WITH IT ----
     The strip holds a passage that is ON SCREEN, and its mark is a wrapper
     inside the box this is about to replace. Left open over fresh markup it
     would be holding a sentence whose element no longer exists, and its own
     "the wording has moved" refusal would then fire for a reason the reader
     never caused. The paths that rebuild deliberately — a Copilot card, a
     playbook standard, a reading change — are all cases where the passage may
     genuinely have moved. Typing does NOT rebuild (see ceApply), so the strip
     survives the one thing it has to survive. */
  ceDetachPassage();
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
  /* THE CLEAN READINGS SHOW THE WORDING AS IT IS DRESSED, which is the whole
     point of asking for them: bold, a size and a colour are invisible in the
     marked reading (it is built from the words that moved) and this is where
     they show. rlHangRichHtml is the paper's own treatment of rendered markup,
     so the sub-paragraph shape and the hanging indents are the same here as
     everywhere else it draws. */
  const dress = h => (window.rlHangRichHtml ? rlHangRichHtml(h) : h);
  let clean = null;
  if (!typing){
    const mode = (window.rlReadMode ? rlReadMode() : 'marks');
    if (mode === 'agreed') clean = dress(_ceBase);
    else if (mode === 'proposed') clean = dress(_ceText);
  }
  /* ---- AND THE BOX BEING TYPED IN KEEPS ITS GUTTER (Young asked 10 Sep 2026:
     the tools and the contract must speak one language) ----
     The typing branch handed the wording over undressed, so the clause the
     reader had just pressed the pencil on was the one clause on the page with
     its numbers flush against the margin — it lost its shape the moment they
     started and snapped back when they stopped. MEASURED on an uploaded
     services agreement: 2.2 and its (a)/(b) limbs hung correctly until the
     pencil, then jumped left by a full gutter.

     IT CANNOT REACH THE RECORD. The marker span carries a class the sanitiser
     does not admit, so anything read back out of the box is unwrapped on the
     way — and ceBoxHtml takes it off the copy it compares, so a pull never
     reports the box as corrected and nothing repaints under the caret. */
  /* ---- MARKS NEVER DISAPPEAR, BECAUSE YOU TYPE AMONG THEM (Young ruled
     14 Sep 2026 — reverses the 13 Sep twin) ----
     The box holds the draft, and the marks are PAINTED INTO IT once it is
     mounted (ceMarksMount, below the write): their strikes as atoms the caret
     steps over, every added run wrapped in the sheet's own ins, coloured by
     author exactly as the clause draws at rest. The 13 Sep answer — the marked
     reading drawn UNDER the box — was the wrong shape for what the owner
     meant ("redline in the redlined section"), and survives only as the
     fallback for a clause the painter cannot own (a table or a pre in the
     body): there the reading is still drawn under the box, so no clause ever
     types with its marks off the screen. */
  const body = typing
    ? `<div class="nego-body ce-typing" id="ce-clausebody" contenteditable="true"
        role="textbox" spellcheck="true">${dress(window.sanitizeRich ? sanitizeRich(_ceText) : _ceText)}</div>`
    : `<div class="nego-body" id="ce-clausebody">${
        clean == null ? ceMarkedHtml(_ceText) : clean}</div>`;
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
        /* Whether the draft has moved off what stands — the canvas draws the
           ruby bar only then (11 Sep 2026). */
        moved: _ceText !== _ceBase || _ceHead !== _ceHeadBase,
        ...(headBox == null ? {} : { head: headBox }) },
      /* THE PENCIL IS THE PRODUCT'S OWN and this page only says what its own
         one does: here it turns typing on and off, and on another clause it
         moves the page to that clause. */
      pill: { attr: 'data-ce-pencil', pressed: typing ? _ceClauseId : '',
        /* ---- NO PENCIL TO START; THE PENCIL MEANS FINISHED (Young ruled
           13 Sep 2026, rule 1 of the layered redline) ----
           The way IN is a click in the wording (see the paper's click branch
           in ceWirePage), so at rest no clause draws a pencil — and a
           colleague's lock sign stays at rest where the pencil used to be,
           which is how a clause is seen to be held BEFORE the click. The
           pencil appears on the one clause being typed in and says "done":
           it files what was written and asks for the note. Not on a clause
           under a proposed deletion (there is no wording to type, and the
           press in the wording speaks that refusal). */
        skip: cl => String(cl.clauseId) !== String(_ceClauseId) || !typing || ceUnderDeletion(),
        label: () => _cet('ce_pencil_done'),
        title: () => _cet('ce_pencil_done_title') },
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
    /* THE NOTE MARKS ARE FURNITURE ON THE CANVAS, painted after it and never
       inside the typing box (rlPaintNoteMarks skips the clause being typed). */
    try { if (window.rlPaintNoteMarks && _ceC) rlPaintNoteMarks(host, _ceC, { side: 'owner' }); } catch (e){}
    /* THE MARKS GO INTO THE BOX (14 Sep 2026), after it is in the document —
       the paint splits live text nodes, which markup cannot express. */
    if (typing) ceMarksMount({ fresh: true });
    ceRestoreScroll(host, keep);
  } finally { _ceRendering = false; }
  ceApplyZoom();
}

/* The three readings, the band that says a reading refuses editing, and the
   count. One row, painted together because they are one statement about how
   this page is being read. */
/* ---- THE RUNNING COUNT, BUILT ONCE ----
   The readings row draws it as part of itself and the typing pull paints it
   alone (see ceApply, which rebuilds nothing while the caret is in the box).
   Two places printing what the draft has done is how they come to disagree
   about it, so there is one builder and two callers. */
function ceStatHtml(draft){
  const n = ceCounts(_ceBase, draft == null ? _ceText : draft);
  return (n.ins || n.del)
    ? `<span class="i">+${n.ins}</span> <span class="d">&minus;${n.del}</span>`
    : `<span class="ce-none">${_cee(_cet('ce_no_change_yet'))}</span>`;
}
/* ---- THE MARKS UNDER THE BOX (rule 2 of the layered redline, 13 Sep 2026) ----
   The same reading the clause shows at rest, drawn under the typing box so
   that nothing on the table leaves the screen because a cursor went down.
   Nothing where there is nothing to keep — a clause with no ask under it and a
   draft still equal to what stands would be a copy of the box above the box.
   ceTwinPaint follows the typing: the box is READ (never written), the
   reading is recomputed and the twin alone is patched — or created, or taken
   down — a beat after the keystroke. */
const CE_TWIN_MS = 300;
let _ceTwinTimer = null;
function ceTwinHtml(text){
  const draft = text == null ? _ceText : text;
  if (!ceStacksOn() && ceWords(draft) === ceWords(_ceBase)) return '';
  return `<div class="nego-body ce-twin" id="ce-twin">${ceMarkedHtml(draft)}</div>`;
}
function ceTwinPaint(){
  if (!clauseEditorOpen() || !ceIsTyping()) return;
  const box = _ceQ('#ce-clausebody');
  if (!box) return;
  let draft = _ceText;
  try{ const raw = ceBoxHtml(box); draft = window.sanitizeRich ? sanitizeRich(raw) : raw; }catch(_){ draft = _ceText; }
  const html = ceTwinHtml(draft);
  const twin = _ceQ('#ce-twin');
  if (!html){ if (twin) twin.remove(); return; }
  if (twin){ twin.innerHTML = html.replace(/^<div[^>]*>/, '').replace(/<\/div>$/, ''); return; }
  try{ box.insertAdjacentHTML('afterend', html); }catch(_){}
}
function ceTwinSchedule(){
  if (_ceTwinTimer) clearTimeout(_ceTwinTimer);
  _ceTwinTimer = setTimeout(() => { _ceTwinTimer = null; try{ ceTwinPaint(); }catch(_){} }, CE_TWIN_MS);
}

/* ============================================================================
   TYPING IN THE MARKS (Young ruled 14 Sep 2026: "I want to be able to redline
   in the redlined section … I would delete whatever I disagree with and enter
   what I want as the new clause and when I finish I click the pencil and the
   new redlines appear on top of the previous redlines")
   ----------------------------------------------------------------------------
   The typing box holds the DRAFT — the rich wording the record will be handed
   — and the marks are PAINTED INTO IT. A run of the draft the other side added,
   or that this draft adds, is wrapped in the sheet's own <ins>; a run somebody
   struck is not in the draft at all, so it is put back where it was taken out
   as an ATOM — a <del> the caret steps over and nothing can type into. Read
   back through ceBoxHtml the paint comes off and the draft is exactly what the
   reader typed, dressing and all: the box never stopped being rich, which is
   why the writing bar keeps working and why nothing here can reach the record
   (the pull strips it, the sanitiser would refuse it, and f245 pins both).

   ONE PROJECTION, ONE MAP. The marks are ops over the wording's TEXT projection
   (richToText's), and that projection is built here off the live box by the
   very walk richFromTextEdit reads it with (_lineUnits, which records the text
   nodes each line owns), so every op offset lands on a DOM character or is
   known not to — a list's regenerated number is in the projection and not in
   the DOM, and a mark on it is skipped. The walk re-folds whitespace exactly as
   that reader does and REFUSES if the two projections differ by a character:
   a mark drawn one word out is worse than no mark, so the marked reading is
   then drawn under the box instead (ceTwinPaint, the 13 Sep answer, kept as
   the fallback for that and for a table or a <pre> the walk cannot own).

   REPAINTED A BEAT AFTER EACH KEYSTROKE, the caret put back by its count of
   LIVE characters — a number the paint cannot move, because wrappers only
   split text nodes and atoms carry text the draft does not have. A struck run
   the reader selects and deletes is back at the next paint: it was never theirs
   to remove; the record holds it.
   ========================================================================== */
const CE_MARK_ATTR = 'data-ce-mark';
const CE_MARKS_MS = 300;
let _ceMarksTimer = null;
const _ceIsAtom = n => !!(n && n.nodeType === 1 && n.getAttribute && n.getAttribute(CE_MARK_ATTR) === 'del');
/* The text nodes a reader can type in — everything in the box but the atoms.
   The one walk the passage finders and the caret bookkeeping share. */
function ceLiveTextNodes(root){
  const out = [];
  if (!root || typeof document === 'undefined' || !document.createTreeWalker) return out;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  let nd;
  while ((nd = walker.nextNode())){
    const p = nd.parentElement;
    if (p && p.closest && p.closest(`[${CE_MARK_ATTR}="del"]`)) continue;
    out.push(nd);
  }
  return out;
}
/* The paint comes off: atoms go, wrappers unwrap, the split text nodes are
   joined again so a raw character index means one thing. */
function ceMarksClear(box){
  if (!box || !box.querySelectorAll) return;
  box.querySelectorAll(`[${CE_MARK_ATTR}="del"]`).forEach(n => n.remove());
  box.querySelectorAll(`[${CE_MARK_ATTR}="ins"]`).forEach(w => {
    const p = w.parentNode; if (!p) return;
    while (w.firstChild) p.insertBefore(w.firstChild, w);
    w.remove();
  });
  try{ box.normalize(); }catch(_){}
}
/* Where the caret is, as a count of live characters before it; null where
   the caret is not in the box. */
function ceCaretSave(box){
  try{
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !box.contains(sel.focusNode)) return null;
    const pt = document.createRange();
    pt.setStart(sel.focusNode, sel.focusOffset); pt.collapse(true);
    let n = 0;
    for (const t of ceLiveTextNodes(box)){
      const len = t.data.length;
      if (pt.comparePoint(t, len) <= 0){ n += len; continue; }
      if (pt.comparePoint(t, 0) <= 0){
        let k = 0;
        while (k < len && pt.comparePoint(t, k + 1) <= 0) k++;
        n += k;
      }
      return n;
    }
    return n;
  }catch(_){ return null; }
}
/* The caret put back at the same count — only where the box still holds the
   focus, so a reader who has moved to the ask box is not pulled back. */
function ceCaretRestore(box, n){
  if (n == null || typeof n !== 'number') return;
  try{
    if (document.activeElement !== box && !box.contains(document.activeElement)) return;
    const nodes = ceLiveTextNodes(box);
    let left = n, at = null;
    for (const t of nodes){
      if (left <= t.data.length){ at = { node: t, off: left }; break; }
      left -= t.data.length;
    }
    if (!at){ const last = nodes[nodes.length - 1]; at = last ? { node: last, off: last.data.length } : { node: box, off: box.childNodes.length }; }
    const r = document.createRange(); r.setStart(at.node, at.off); r.collapse(true);
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }catch(_){}
}
/* What the picture is made of, for this draft (`ours` is the box's own
   projection): the two layers over their ask, a REPLACEMENT where the marks
   would outnumber the words, one layer against what stands where there is no
   ask to stand on — or null where the draft is what stands. The same three
   answers ceMarkedHtml gives the clause at rest, so the box being typed in
   and the clause beside it cannot disagree about what a counter looks like. */
function ceMarksOps(ours){
  const on = ceStacksOn();
  if (on && Array.isArray(on.ops) && on.ops.length && window.redlineLayerOps && window.redlineOpsStructured){
    const theirs = ceWords(on.newText);
    if (window.redlineWholesale && ours !== theirs && redlineWholesale(theirs, ours)) return { wholesale: true, theirs };
    try{
      const ops = redlineLayerOps(on.ops, redlineOpsStructured(theirs, ours), { under: 'them', over: 'us' });
      if (ops) return { ops };
    }catch(_){}
  }
  const base = ceWords(_ceBase);
  if (ours === base) return null;
  try{
    const ops = window.redlineOpsStructured ? redlineOpsStructured(base, ours)
      : (window.redlineOps ? redlineOps(base, ours) : null);
    /* Stamped 'us' so the atoms and wrappers the walk draws wear our colour
       on a lone draft as they do on a stack (14 Sep 2026). */
    return ops ? { ops: ops.map(o => (o && o.op !== 'keep' && !o.who) ? Object.assign({}, o, { who: 'us' }) : o) } : null;
  }catch(_){ return null; }
}
/* The walk. Every projected character is matched to the op that owns it; a
   struck op has no character of its own and becomes an atom at the point it
   was taken out; an added run becomes a wrapper round the characters it owns.
   The DOM is not touched until the whole walk has agreed with the projection
   — a disagreement anywhere draws nothing (false), never half a picture. */
function ceMarksDraw(box, units, plan){
  const doc = box.ownerDocument;
  const INS = window.REDLINE_INS_CLASS || 'hati-ins nego-ins';
  const DEL = window.REDLINE_DEL_CLASS || 'hati-del nego-del';
  const wrapper = who => { const el = doc.createElement('ins'); el.className = INS + (who ? ' rl-' + who : '');
    el.setAttribute(CE_MARK_ATTR, 'ins'); return el; };
  const atom = (text, who, under) => {
    const d = doc.createElement('del'); d.className = DEL + (who ? ' rl-' + who : ''); d.textContent = text;
    let el = d;
    if (under){ el = doc.createElement('ins'); el.className = INS + ' rl-' + under; el.appendChild(d); }
    el.setAttribute(CE_MARK_ATTR, 'del');
    return el;
  };
  const nodesOf = u => (u.nodes || []).filter(t => t && t.parentNode);
  /* ---- A REMOVED PARAGRAPH IS A REMOVED PARAGRAPH (Young reported it 15 Sep
     2026, twice: "when you press inside a clause with redlines, the paragraphs
     slightly separate from each other when they should not move at all") ----
     MEASURED on a clause of three sub-paragraphs with their ask striking the
     first. AT REST the sheet draws three blocks: the struck 8.1, then 8.2, then
     8.3. IN THE BOX the whole struck paragraph was landing INSIDE the next
     paragraph's marker gutter —

       <p class="rl-hang"><span class="rl-marker"><del>8.1 Term …\n</del>8.2 </span>Termination …

     — two blocks instead of three, with a paragraph of wording stuffed into a
     2.6em gutter. That is why the hanging indent collapsed, the wrapped lines
     went flush left and everything below the caret re-flowed: not a margin, a
     paragraph in the wrong element.
     THE CAUSE IS THE INSERTION POINT. A struck run is put back "where it was
     taken out", and where it was taken out is the start of a line, whose first
     text node is the marker span's. A run carrying a NEWLINE is not inline
     wording at all — it is one or more whole lines — so it is drawn as its own
     block, exactly as the at-rest renderer draws it, and the block count on
     screen is the same before the press and during it. */
  const BLOCKS = /^(P|LI|H1|H2|H3|H4|H5|H6|PRE|BLOCKQUOTE|DIV)$/;
  const blockOf = node => {
    let el = node && node.parentNode;
    while (el && el !== box && !BLOCKS.test(el.tagName || '')) el = el.parentNode;
    return (el && el !== box) ? el : null;
  };
  const delBlock = (text, who, under) => {
    const p = doc.createElement('p');
    const sp = (typeof window.redlineSplitMarker === 'function')
      ? redlineSplitMarker(text) : { marker: '', rest: text };
    p.className = 'rl-line rl-clause rl-line-del' + (sp.marker ? ' rl-hang' : '');
    if (sp.marker){
      const g = doc.createElement('span'); g.className = 'rl-marker';
      g.appendChild(atom(sp.marker + ' ', who, under));
      p.appendChild(g);
      p.appendChild(atom(String(sp.rest || '').replace(/^\s+/, ''), who, under));
    } else p.appendChild(atom(text, who, under));
    p.setAttribute(CE_MARK_ATTR, 'del');
    return p;
  };
  /* A rewrite: everything in the box is ours, and their wording, struck, stands
     above it — the shape redlineReplacementHtml draws once it is filed. */
  if (plan.wholesale){
    const events = [];
    for (const u of units) for (const t of nodesOf(u)) if (t.data.trim()) events.push({ node: t, k: 0, k2: t.data.length, kind: 'wrap', el: wrapper('us'), seq: events.length });
    ceMarksApply(box, events);
    const blk = doc.createElement('p'); blk.className = 'rl-line rl-line-del';
    blk.appendChild(atom(plan.theirs, 'them'));
    blk.setAttribute(CE_MARK_ATTR, 'del');
    box.insertBefore(blk, box.firstChild);
    return true;
  }
  const ops = (plan.ops || []).filter(o => o && o.text);
  let oi = 0, off = 0, seq = 0;
  const events = [];
  const dels = () => { const out = []; while (oi < ops.length && ops[oi].op === 'del'){ out.push(ops[oi]); oi++; off = 0; } return out; };
  const take = () => {
    if (oi >= ops.length) return null;
    const o = ops[oi]; off++;
    if (off >= o.text.length){ oi++; off = 0; }
    return o;
  };
  const atomsAt = (node, k, edge) => {
    for (const d of dels()){
      if (edge && /\n/.test(d.text)){
        const anchor = blockOf(node);
        const lines = String(d.text).split('\n').filter(x => x.trim());
        if (anchor && lines.length){
          for (const ln of lines)
            events.push({ kind: 'block', anchor, edge, el: delBlock(ln, d.who, d.under), seq: seq++ });
          continue;
        }
      }
      events.push({ node, k, kind: 'atom', el: atom(d.text, d.who, d.under), seq: seq++ });
    }
  };
  for (let ui = 0; ui < units.length; ui++){
    const u = units[ui];
    const nodes = nodesOf(u);
    if (!nodes.length) return false;
    /* The line's raw characters, and which of them the projection keeps: the
       reader's folding — every whitespace run one space, none at either end. */
    const raw = [];
    for (const t of nodes) for (let k = 0; k < t.data.length; k++) raw.push({ t, k, ws: /\s/.test(t.data[k]), emit: false });
    let seenWord = false, inRun = false;
    for (const ch of raw){
      if (ch.ws){ if (!inRun && seenWord) ch.emit = true; inRun = true; }
      else { ch.emit = true; seenWord = true; inRun = false; }
    }
    for (let i = raw.length - 1; i >= 0 && raw[i].ws; i--) raw[i].emit = false;
    const emitted = raw.filter(ch => ch.emit);
    const line = emitted.map(ch => ch.ws ? ' ' : ch.t.data[ch.k]).join('');
    if (line !== u.text) return false;
    const first = emitted[0] || raw[0] || null;
    /* The regenerated marker of a list item: projected, not in the DOM. */
    for (let i = 0; i < u.prefix.length; i++){
      atomsAt(first.t, first.k, 'start');
      if (!take()) return false;
    }
    let curOp = null, runStart = null, runEnd = null;
    const closeRun = () => {
      if (curOp && curOp.op === 'ins' && runStart)
        events.push({ node: runStart.t, k: runStart.k, k2: runEnd.k + 1, kind: 'wrap', el: wrapper(curOp.who), seq: seq++ });
      curOp = null; runStart = null; runEnd = null;
    };
    let atStart = true;
    for (const ch of raw){
      if (ch.emit){
        atomsAt(ch.t, ch.k, atStart ? 'start' : null);
        atStart = false;
        const o = take(); if (!o) return false;
        if (!curOp || o !== curOp || ch.t !== runStart.t){ closeRun(); curOp = o; runStart = ch; }
      }
      if (curOp && ch.t === runStart.t) runEnd = ch;
    }
    closeRun();
    /* The break after this line: a struck run due there sits after the line's
       last character. */
    const last = raw[raw.length - 1];
    if (ui < units.length - 1){
      atomsAt(last.t, last.k + 1, 'end');
      if (!take()) return false;
    } else {
      atomsAt(last.t, last.k + 1, 'end');
    }
  }
  if (oi < ops.length) return false;
  ceMarksApply(box, events);
  return true;
}
/* The events land last-first, so an index into a text node still means what
   it meant when the walk recorded it: a split at k leaves [0,k) where it was.
   At one index a wrapper is made BEFORE an atom is placed, and the atom then
   goes before the wrapper — the old wording before the new, the order the
   ops keep. */
function ceMarksApply(box, events){
  /* A REMOVED PARAGRAPH IS ITS OWN BLOCK, and it is placed against the block it
     stood beside rather than against a text node — nothing here splits or
     renumbers a text node, so the per-node walk below still means what it meant
     when it was recorded. Several removed lines against one anchor keep their
     order; at a line's END they follow the block, at a line's START they lead
     it, which is where they stood in the wording. */
  const blocks = events.filter(ev => ev.kind === 'block');
  const after = new Map();
  for (const ev of blocks){
    const a = ev.anchor; if (!a || !a.parentNode) continue;
    if (ev.edge === 'end'){
      const at = after.get(a) || a;
      a.parentNode.insertBefore(ev.el, at.nextSibling);
      after.set(a, ev.el);
    } else a.parentNode.insertBefore(ev.el, a);
  }
  const byNode = new Map();
  for (const ev of events){
    if (ev.kind === 'block') continue;
    if (!byNode.has(ev.node)) byNode.set(ev.node, []);
    byNode.get(ev.node).push(ev);
  }
  byNode.forEach((list, node) => {
    list.sort((a, b) => (b.k - a.k) || ((a.kind === 'wrap' ? 0 : 1) - (b.kind === 'wrap' ? 0 : 1)) || (a.seq - b.seq));
    const wrappedAt = new Map();
    for (const ev of list){
      if (!node.parentNode) return;
      if (ev.kind === 'wrap'){
        let mid = node;
        if (ev.k2 < node.data.length) node.splitText(ev.k2);
        if (ev.k > 0) mid = node.splitText(ev.k);
        mid.parentNode.insertBefore(ev.el, mid); ev.el.appendChild(mid);
        wrappedAt.set(ev.k, ev.el);
        continue;
      }
      const w = wrappedAt.get(ev.k);
      if (w){ w.parentNode.insertBefore(ev.el, w); continue; }
      if (ev.k >= node.data.length){ node.parentNode.insertBefore(ev.el, node.nextSibling); continue; }
      const tail = ev.k > 0 ? node.splitText(ev.k) : node;
      tail.parentNode.insertBefore(ev.el, tail);
    }
  });
}
/* The paint, whole: the caret remembered, the old paint taken off, the
   projection read off the box, the picture drawn, the caret put back. True
   where the box now shows its marks (or has none to show); false where the
   painter could not own the box and the caller must draw the reading under it. */
function ceMarksPaint(o = {}){
  if (!clauseEditorOpen() || !ceIsTyping()) return false;
  const box = _ceQ('#ce-clausebody');
  if (!box || typeof window._lineUnits !== 'function') return false;
  const caret = o.fresh ? null : ceCaretSave(box);
  ceMarksClear(box);
  let drawn = false;
  try{
    const units = _lineUnits(box);
    if (units.length && !units.some(u => u.opaque)){
      const ours = units.map(u => u.line).join('\n');
      const plan = ceMarksOps(ours);
      drawn = !plan ? true : ceMarksDraw(box, units, plan);
      if (!drawn) ceMarksClear(box);
    }
  }catch(_){ ceMarksClear(box); drawn = false; }
  ceCaretRestore(box, caret);
  return drawn;
}
/* Marks into the box where the painter can own it; the reading under the box
   where it cannot. One call for the mount and for every beat after a keystroke. */
function ceMarksMount(o){
  let ok = false;
  try{ ok = ceMarksPaint(o || {}); }catch(_){ ok = false; }
  if (!ok){ ceTwinPaint(); return; }
  const twin = _ceQ('#ce-twin');
  if (twin) twin.remove();
}
function ceMarksSchedule(){
  if (_ceMarksTimer) clearTimeout(_ceMarksTimer);
  _ceMarksTimer = setTimeout(() => {
    _ceMarksTimer = null;
    try{ ceMarksMount(); }catch(_){}
    try{ cePaintStat(ceDraftNow()); }catch(_){}
  }, CE_MARKS_MS);
}
/* ---- A STRUCK RUN IS NOT NON-EDITABLE, AND THAT IS DELIBERATE ----
   A contenteditable="false" island inside an editable box is what the browser
   drags as an OBJECT when a press lands on it, so a highlight begun on a
   struck word never became a highlight at all (measured on clause-editor-verify
   21: the drag from the paragraph's edge started on the atom and selected
   nothing), and a writing-bar press wrote its marker INTO the island (19c).
   The atoms are ordinary elements the caret crosses and a drag selects; what
   keeps them the record's rather than the reader's is the beforeinput wall
   below and the key step here. A struck run a selection swallows is back at
   the next paint — the record holds it. */
/* Which struck run the point sits in, if any. */
function ceAtomAt(node){
  const el = node ? (node.nodeType === 1 ? node : node.parentElement) : null;
  return (el && el.closest) ? el.closest(`[${CE_MARK_ATTR}="del"]`) : null;
}
/* Backspace before a struck run and Delete after it step the caret across it,
   as Word does; a caret INSIDE one steps out on the side the key deletes
   towards. True where the key was spent on the step. */
function ceAtomSkip(dir){
  const box = _ceQ('#ce-clausebody');
  const sel = (typeof window.getSelection === 'function') ? window.getSelection() : null;
  if (!box || !sel || !sel.rangeCount || !sel.isCollapsed || !box.contains(sel.anchorNode)) return false;
  const node = sel.anchorNode, off = sel.anchorOffset;
  const inside = ceAtomAt(node);
  if (inside && box.contains(inside)){
    try{
      const r = document.createRange();
      if (dir < 0) r.setStartBefore(inside); else r.setStartAfter(inside);
      r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
      return true;
    }catch(_){ return false; }
  }
  const side = n => (dir < 0 ? n.previousSibling : n.nextSibling);
  let nb = null;
  if (node.nodeType === 3){
    if (dir < 0 ? off > 0 : off < node.data.length) return false;
    let n = node;
    while (n && n !== box && !side(n)) n = n.parentNode;
    if (!n || n === box) return false;
    nb = side(n);
  } else {
    nb = dir < 0 ? node.childNodes[off - 1] : node.childNodes[off];
    if (!nb){
      let n = node;
      while (n && n !== box && !side(n)) n = n.parentNode;
      if (!n || n === box) return false;
      nb = side(n);
    }
  }
  let leaf = nb;
  while (leaf && leaf.nodeType === 1 && !_ceIsAtom(leaf) && leaf.childNodes.length) leaf = dir < 0 ? leaf.lastChild : leaf.firstChild;
  const atom = _ceIsAtom(leaf) ? leaf
    : (leaf && leaf.parentElement && leaf.parentElement.closest ? leaf.parentElement.closest(`[${CE_MARK_ATTR}="del"]`) : null);
  if (!atom || !box.contains(atom)) return false;
  try{
    const r = document.createRange();
    if (dir < 0) r.setStartBefore(atom); else r.setStartAfter(atom);
    r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
  }catch(_){ return false; }
  return true;
}
/* The draft as the box says it now — the live wording while typing, the
   record's draft otherwise. What every reading of "the lines" compares a
   highlight against (the 14 Sep fault: a highlight of words just typed was
   refused against the draft as it stood at the last pull). */
function ceDraftNow(){
  if (!ceIsTyping()) return _ceText;
  const box = _ceQ('#ce-clausebody');
  if (!box) return _ceText;
  try{ const raw = ceBoxHtml(box); return window.sanitizeRich ? sanitizeRich(raw) : raw; }catch(_){ return _ceText; }
}
function cePaintStat(draft){
  const el = _ceQ('#ce-stat');
  if (el) el.innerHTML = ceStatHtml(draft);
}
function ceRenderReadBar(){
  const bar = _ceQ('#ce-readbar');
  if (bar && window.rlReadSegsHtml){
    const stat = ceStatHtml();
    /* The chips sit INSIDE the running +N -N rather than outside it: that
       readout is where the reader's eye already goes for what their typing is
       doing, and moving it would cost more than the row gains. */
    bar.innerHTML = rlReadSegsHtml() + `<span class="g"></span>`
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
/* `opts.repaint` FORCES the paper to be rebuilt. The sanitiser's own signal
   below catches a paste; it cannot catch a press of the writing bar's four
   SHAPE tools, because what those move is a marker and a step class that the
   allow-list keeps exactly as written — nothing to correct, and the paper still
   owes the reader the marker in its gutter. */
function cePullText(opts){
  if (!ceIsTyping()) return;
  /* SOMEBODY IS TYPING IN THIS CLAUSE, so the lock's stamp moves with them.
     IN MEMORY ONLY and therefore free — the beat above is what carries it to
     the other browser, and a save on every blur would be a save on every
     keystroke's worth of hesitation. */
  try{ if (window.clauseLockKeep) clauseLockKeep(_ceC, _ceClauseId); }catch(_){}
  const box = _ceQ('#ce-clausebody');
  const headBox = _ceQ('#ce-clausehead');
  let next = _ceText;
  /* ---- DID THE SANITISER HAVE TO CORRECT THE BOX? ----
     Almost never, and that is what makes it a useful signal. MEASURED in a real
     browser: a freshly rendered box is already clean, and stays clean through
     ordinary typing INCLUDING pressing Enter for a new paragraph. It goes true
     when somebody pastes markup the allow-list will not keep — and that is
     exactly the case where the box on screen is showing something the record
     will not, so the paper is owed a repaint. Everywhere else the repaint is
     pure cost, and see ceApply for what that cost turned out to be. */
  let corrected = false;
  if (box){
    const raw = ceBoxHtml(box);
    next = window.sanitizeRich ? sanitizeRich(raw) : raw;
    corrected = next !== raw;
  }
  const nextHead = headBox
    ? String(headBox.textContent || '').replace(/\s+/g, ' ').trim() : _ceHead;
  const headMoved = nextHead !== _ceHead;
  if (next === _ceText && !headMoved) return;
  _ceHead = nextHead;
  /* QUIET (11 Sep 2026): the reader typed these words themselves, and
     "Applied to the wording below" was their own act read back to them — and
     it was spoken on the BLUR a mousedown causes, which is what grew the
     toolbar row under the pencil (see .ce-say). Every other speaker of that
     sentence — a card's Apply, a playbook standard, a passage rewritten in
     place — is untouched. */
  ceApply(next, (headMoved && next === _ceText) ? _cet('ce_step_named') : _cet('ce_step_typed'),
    { keepView: true, headMoved, repaint: corrected || !!(opts && opts.repaint), quiet: true });
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
  if (!foot) return;
  /* ---- PATCHED IN PLACE, NEVER REWRITTEN (owner-reported 30 Aug 2026) ----
     "I have to click multiple times in order for the redlines to be filed."
     REPRODUCED in a real browser before it was touched: type in the clause,
     press File as a change ONCE, and nothing happens; press it again and it
     files. The cause is here. A press is a mousedown and a mouseup, and the
     browser only calls it a click if both land on the same element — so
     rewriting this row on the blur that the mousedown itself causes replaced
     the button under the reader's finger, and the mouseup landed on a button
     that had never been pressed. Nothing failed and nothing logged; from the
     reader's chair it is simply a dead button.

     So this row keeps its two buttons for the life of the page and only their
     state moves. It is the settings page's own rule — that screen answers a
     selection by patching in place rather than re-rendering — applied to the
     one row on this page that is pressed while the caret is still in the text.
     THE LABEL IS WRITTEN AS textContent rather than as markup: it is a name,
     never a fragment, and that is also what keeps the element identity the fix
     rests on. */
  let discard = foot.querySelector('[data-ce-act="discard"]');
  let save = foot.querySelector('[data-ce-act="save"]');
  if (!discard || !save){
    foot.innerHTML = '<button type="button" data-ce-act="discard"></button>'
      + '<button type="button" class="p" data-ce-act="save"></button>';
    discard = foot.querySelector('[data-ce-act="discard"]');
    save = foot.querySelector('[data-ce-act="save"]');
  }
  const label = _ceLead ? _cet('ce_save_to', { id: _ceLead.id }) : _cet('ce_file_as_change');
  /* ---- THE TWO BUTTONS ANSWER TWO DIFFERENT QUESTIONS ----
     DISCARD asks "has the wording moved from what STANDS in the contract" —
     that is what it puts back, so that is what it is live for.
     FILE asks "is there anything the RECORD does not already hold", which is
     clauseEditorDirty's own question. They were both on `moved`, which was
     right while filing closed the page: with the page staying open a
     just-filed draft still differs from what stands, so File would have sat
     there live over a press the funnel refuses as proposing nothing. Now it
     greys the moment the record catches up with the box, which is the same
     rule this product applies everywhere — grey where it can know before the
     press. */
  const anyToFile = ceCanFile();
  [[discard, _cet('ce_discard'), moved], [save, label, anyToFile]].forEach(([b, word, on]) => {
    if (!b) return;
    b.disabled = !(on && live);
    /* THE NOTE COMES AT SAVE, and the control says so (round four, item 7,
       the owner's (b)): a Copilot card's Apply moves wording into the box;
       Save is the one act that files, and the note drawer opens on the
       filing. Said on the control's hover, no band. */
    if (!live) b.setAttribute('title', _cet('ce_reading_only'));
    else if (b === save) b.setAttribute('title', _cet('ce_save_opens_note'));
    else b.removeAttribute('title');
    if (b.textContent !== word) b.textContent = word;
  });
}

/* Below this the say span is showing an ellipsis and a letter or two, which is
   not a sentence — about eight characters of the label size. See ceSay. */
const CE_SAY_MIN_W = 60;
function ceSay(msg){
  const el = _ceQ('#ce-say'); if (!el) return;
  clearTimeout(_ceSayTimer);
  el.textContent = msg; el.classList.add('is-on');
  _ceSayTimer = setTimeout(() => { try{ el.classList.remove('is-on'); }catch(_){} }, 3200);
  /* ---- AND WHERE THE ROW HAS NO ROOM, THE SENTENCE STILL REACHES THE READER
     (11 Sep 2026) ----
     The span may only take FREE space on the toolbar row (see .ce-say in the
     sheet), so on a window where the tools already fill the row it measures
     nothing at all — and a refusal spoken into a zero-width span is a dead
     press, which is the fault this page's own rule exists to refuse. The order
     asked for a reserved row under the toolbar there; that row would stand
     between the toolbar and the wording at every width where it is drawn,
     which is exactly the growth refusal 3 forbids. The TOAST is the rung that
     moves nothing: a transient line, gone by itself, the same words. Chosen by
     MEASUREMENT of this span rather than by a breakpoint, so a font, a zoom or
     a longer word set cannot put the sentence in the wrong place. */
  let w = 0;
  try{ w = el.getBoundingClientRect().width; }catch(_){ w = 0; }
  if (w < CE_SAY_MIN_W && typeof toast === 'function') toast(msg, 'warn');
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
  /* ---- NOT ON A CLAUSE THE OTHER SIDE WANTS REMOVED ---- (10 Sep 2026)
     The third door into the wording, and the one that is still pressable once
     the pencil has stood down — a Copilot card's Apply, a playbook standard, a
     passage rewritten in place. Wording applied here would become a
     counter-proposal filed under a button reading "Save to CHG-005", which is
     the wrong name for it; what typing SHOULD mean on a clause under deletion
     is the owner's to rule on. Said IN the page, beside the press, because a
     refusal delivered off-screen is how a live button reads as a dead one. */
  if (ceUnderDeletion()){ ceSay(_cet('ce_under_deletion')); return false; }
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
  /* ---- NOTHING IS REBUILT UNDER THE READER'S FINGER ----
     (owner-reported 30 Aug 2026, with ceRenderFoot's own note.) Every blur
     rebuilt FOUR regions of this page — the readings row, the paper, the rail
     foot and the writing bar — and a press that causes the blur lands on
     whichever of them it was aimed at. That is why the pencil and File as a
     change each needed pressing twice, and it was equally true of the reading
     tabs, the zoom and every tool on the bar; the owner reported the two they
     met most.

     keepView means the caret is still in the box, which is to say the pull:
     cePullText is its only caller and returns early unless the reader is
     typing. In that state NONE of the four needs rebuilding — the box already
     shows the words, the bar's greying asks a question whose answer has not
     moved, and the readings and the zoom are untouched. What genuinely moves is
     the running count and the foot, and both are painted in place.

     THE PAPER IS STILL REBUILT WHERE IT IS OWED, which is when the sanitiser
     had to correct the box: there the screen is showing something the record
     will not keep, and a repaint is the only thing that tells the truth. */
  if (opts.keepView && !opts.repaint){ cePaintStat(); ceRenderFoot(); ceMarksMount(); }
  else { ceRenderPaper(); ceRenderFoot(); ceRenderHead(); }
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
    const raw = ceBoxHtml(box);
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
/* ============================================================
   THE RAIL'S LADDER CARD, LADDER TAB AND FIGURE TAB (Young ruled 14 Sep
   2026: build the artifact's rail)
   ============================================================
   Everything here is worked out from the playbook, precedent and this
   clause's ladder, and the card says so. NO MODEL IS CALLED: the numbers
   are the record's own and the sentence about them is deterministic — a
   model is asked only when the reader types a question, as before. */
let _ceHeldNote = '';
let _ceLadderReply = null;
function ceLadderRow(){
  if (!_ceC || !_ceClauseId || typeof window.ladderStand !== 'function') return null;
  try{ return ladderStand(_ceC, String(_ceClauseId), 'owner'); }catch(_){ return null; }
}
function ceFigureTopic(){ const r = ceLadderRow(); return (r && r.topic && typeof r.topic.num === 'function' && r.unit) ? r.topic : null; }
function ceLadderCardHtml(){
  const row = ceLadderRow();
  if (!row) return '';
  const theirs = row.theirs;
  const clauseName = ceClauseLabel(ceClause()) || _cet('ce_this_clause');
  const unit = row.unit || '';
  /* WHAT MOVED */
  let moved = '';
  if (theirs){
    const under = (typeof window.ladderUnder === 'function') ? ladderUnder(row.rungs, theirs) : null;
    const from = under ? ladderFigure(row.topic, under.text) : ladderFigure(row.topic, ladderBaseText(row.rungs));
    const to = row.theirFig;
    moved = (from != null && to != null && from !== to)
      ? `${clauseName}: ${from} → ${to} ${unit}`
      : String(theirs.summary || '');
  } else {
    moved = _cet('ce_lc_nothing', { what: row.top ? _cet('ce_lc_own', { n: row.top.n }) : _cet('ce_lc_agreed') });
  }
  /* ON YOUR LADDER */
  const fb = (row.topic && typeof window.ladderFallback === 'function') ? ladderFallback(row.topic) : null;
  const fbN = fb ? fb.figure : null;
  const stdN = row.standard ? row.standard.value : null;
  const opWord = row.standard ? (row.standard.op === '<=' ? '≤ ' : row.standard.op === '>=' ? '≥ ' : '') : '';
  let ladder = '', acceptable = false, reply = null;
  if (row.topic && theirs && row.theirFig != null && (stdN != null || fbN != null)){
    const inFb = (fbN != null && typeof window.ladderWithin === 'function') ? ladderWithin(row.topic, row.theirFig, fbN) : null;
    const inStd = (stdN != null && typeof window.ladderWithin === 'function') ? ladderWithin(row.topic, row.theirFig, stdN) : null;
    if (inFb === true || (fbN == null && inStd === true)){
      ladder = _cet('ce_lc_within', { n: row.theirFig, f: fbN != null ? fbN : stdN });
      acceptable = theirs === row.top;
    } else {
      ladder = fbN != null
        ? _cet('ce_lc_outside', { s: (opWord + (stdN != null ? stdN : '—')).trim(), f: fbN })
        : _cet('ce_lc_outside_std', { s: (opWord + (stdN != null ? stdN : '—')).trim() });
      /* The reply is the fallback where the playbook holds one with a figure,
         else the standard itself — the one figure the playbook does hold. */
      reply = fbN != null ? fbN : stdN;
    }
  } else if (row.topic && (stdN != null || fbN != null)){
    ladder = _cet('ce_lc_between', { s: (opWord + (stdN != null ? stdN : '—')).trim(), f: fbN != null ? fbN : '—' });
  } else {
    ladder = _cet('ce_lc_nostd');
  }
  /* WHAT YOU HAVE SETTLED FOR */
  let prec = '';
  if (row.topic && typeof window.ladderSettledFigure === 'function'){
    const p = ladderSettledFigure(row.topic.key);
    if (p) prec = _cet('ce_lc_prec_fig', { n: p.figure, unit: p.unit || unit, seen: p.seen, of: p.of });
  }
  if (!prec) prec = cePrecedentLine() || _cet('ce_lc_noprec');
  /* SUGGESTED REPLY — the fallback figure written into THEIR wording, so
     everything else they asked for is kept. */
  let replyHtml = '', acts = '';
  _ceLadderReply = null;
  if (reply != null && theirs && typeof window.ladderWriteFigure === 'function'){
    const text = ladderWriteFigure(ceWords(theirs.text), reply, unit);
    if (text !== ceWords(theirs.text)){
      const words = (typeof window.ladderWords === 'function') ? ladderWords(reply) : String(reply);
      const note = _cet('ce_lc_note_fig', { words, n: reply, unit, clause: clauseName.toLowerCase() });
      _ceLadderReply = { text, note };
      replyHtml = `<div class="k">${_cee(_cet('ce_lc_reply'))}</div><div><b>${_cee(_cet('ce_lc_reply_fig', { words, n: reply, unit }))}</b></div>
        <div class="k">${_cee(_cet('ce_lc_note'))}</div><div class="said">“${_cee(note)}”</div>`;
      acts = `<div class="acts"><button type="button" class="ui-btn ui-btn-primary" data-ce-act="ladder-apply">${_cee(_cet('ce_lc_apply'))}</button>
        <button type="button" class="ui-btn" data-ce-act="ladder-note">${_cee(_cet('ce_lc_keep_note'))}</button></div>`;
    }
  } else if (acceptable && theirs){
    replyHtml = `<div class="k">${_cee(_cet('ce_lc_reply'))}</div><div>${_cee(_cet('ce_lc_accept_line'))}</div>`;
    acts = `<div class="acts"><button type="button" class="ui-btn ui-btn-primary" data-ce-act="ladder-accept" data-id="${_ceea(theirs.id)}">${_cee(_cet('ce_lc_accept', { n: theirs.n }))}</button></div>`;
  }
  return `<div class="ce-card ce-lcard">
    <div class="k">${_cee(_cet('ce_lc_moved'))}</div><div>${_cee(moved)}</div>
    <div class="k">${_cee(_cet('ce_lc_ladder'))}</div><div>${_cee(ladder)}</div>
    <div class="k">${_cee(_cet('ce_lc_settled'))}</div><div>${_cee(prec)}</div>
    ${replyHtml}${acts}
    <div class="cost">${_cee(_cet('ce_lc_cost'))}</div>
  </div>`;
}
/* The Ladder tab: the clause panel's own ladder and its tail, drawn in the
   rail. Wrapped in the negotiate page's own class so the same rules dress
   it; the read-as-it-stood and counter verbs are not offered here (this page
   IS the counter, and the paper it shows is the box). */
function ceLadderLaneHtml(){
  const cl = ceClause();
  if (!cl || !_ceC || typeof window.rlLadderSectionHtml !== 'function') return `<p class="ce-scan-none">${_cee(_cet('ce_lc_noladder'))}</p>`;
  const sec = rlLadderSectionHtml(_ceC, cl, 'owner', { editor: true });
  const tail = (typeof window.rlLadderTailHtml === 'function') ? rlLadderTailHtml(_ceC, cl, ceOnTable(), 'owner', { noFigure: true, noNotes: true }) : '';
  return `<div class="redline-page rl-cp-src ce-ladder-lane">${sec || `<p class="ce-scan-none">${_cee(_cet('ce_lc_noladder'))}</p>`}${tail}</div>`;
}
function ceFigureLaneHtml(){
  const cl = ceClause();
  if (!cl || !_ceC || typeof window.rlFigureSecHtml !== 'function') return '';
  const sec = rlFigureSecHtml(_ceC, cl.clauseId, 'owner', { act: 'editor' });
  return `<div class="redline-page rl-cp-src ce-ladder-lane">${sec}<p class="ce-fig-note">${_cee(_cet('ng_fig_write_title'))}</p></div>`;
}
/* Write the figure from the tab into the box. The draft's own wording is what
   is written on — never the record's — so a figure typed twice moves once. */
function ceFigureWrite(){
  const topic = ceFigureTopic(); if (!topic) return;
  const box = _ceQ('#ce-fig');
  const n = box ? parseInt(box.value, 10) : NaN;
  if (!Number.isFinite(n)){ ceSay(_cet('ng_fig_nan')); return; }
  const now = ceWords(ceDraftNow() || _ceText);
  const next = ladderWriteFigure(now, n, topic.unit);
  if (next === now){ ceSay(_cet('ng_fig_same')); return; }
  ceApply(next, _cet('ce_step_figure'));
  _ceTab = 'chat'; ceRenderTabs(); ceRenderLane();
}

function ceRenderTabs(){
  if (!clauseEditorOpen()) return;
  const page = document.getElementById('clause-editor'); if (!page) return;
  page.querySelectorAll('[data-ce-tab]').forEach(b =>
    b.classList.toggle('is-on', b.getAttribute('data-ce-tab') === _ceTab));
  const n = ceDeviationCount();
  /* The Figure tab is drawn only where the clause is argued in a number. */
  const ft = _ceQ('#ce-tab-figure');
  if (ft) ft.hidden = !ceFigureTopic();
  const badge = _ceQ('#ce-scan-n');
  if (badge){ badge.textContent = n ? String(n) : ''; badge.style.display = n ? '' : 'none'; }
  /* The ask box belongs to the conversation. The scan has nothing to be asked.
     THE PASSAGE CARD GOES WITH IT: it is the subject of the next question, and
     over a list of playbook findings it would be a card about nothing. The
     passage is NOT let go — coming back to the conversation finds it still
     held, because a tab is a reading and not a decision. */
  const ask = _ceQ('#ce-askrow'), chips = _ceQ('#ce-chips'), scope = _ceQ('#ce-scope');
  if (ask) ask.style.display = _ceTab === 'chat' ? '' : 'none';
  if (chips) chips.style.display = _ceTab === 'chat' ? '' : 'none';
  if (scope) scope.style.display = _ceTab === 'chat' ? '' : 'none';
}
/* ---- A CONTROL DRAWN ONLY WHERE THERE IS REALLY MORE TO SEE (21 Sep 2026) ----
   Asked of the BROWSER after the paint, never of the character count: whether
   a preview overflows its 120px window depends on the rail's width, the
   reader's own text size and where the wording wraps, and a guess at it draws
   a dead button on a short card and none on a long one. The product's own
   idiom — rowsThatFit and ptFitTable ask the same question the same way. A
   class flip, never a repaint. */
function ceScanFitPv(lane){
  if (!lane) return;
  lane.querySelectorAll('.ce-rule .pv').forEach(pv => {
    const btn = pv.parentNode && pv.parentNode.querySelector('.pv-more');
    if (!btn) return;
    if (pv.scrollHeight > pv.clientHeight + 2) btn.classList.add('is-live');
  });
}
/* The press: the box gives up its cap and the word turns round. Per sitting
   and in the DOM alone — nothing about which previews a reader opened is worth
   storing, and a rescan draws fresh cards anyway. */
function ceScanPvToggle(i){
  const btn = _ceQ(`[data-ce-pv="${i}"]`); if (!btn) return;
  const pv = btn.parentNode && btn.parentNode.querySelector('.pv'); if (!pv) return;
  const open = pv.classList.toggle('is-open');
  btn.textContent = _cet(open ? 'ce_pv_less' : 'ce_pv_more');
}
function ceRenderLane(){
  if (!clauseEditorOpen()) return;
  const lane = _ceQ('#ce-lane'); if (!lane) return;
  if (_ceTab === 'scan'){ lane.innerHTML = ceScanHtml(); lane.scrollTop = 0; ceScanFitPv(lane); return; }
  if (_ceTab === 'ladder'){ lane.innerHTML = ceLadderLaneHtml(); lane.scrollTop = 0; return; }
  if (_ceTab === 'figure'){
    lane.innerHTML = ceFigureLaneHtml(); lane.scrollTop = 0;
    const rg = _ceQ('#ce-fig-range'), fi = _ceQ('#ce-fig');
    /* The two boxes follow each other; assigned handlers, because the box's
       own input listener is what f245 (19) reads by name. */
    if (rg && fi){ rg.oninput = () => { fi.value = rg.value; }; fi.oninput = () => { rg.value = fi.value; }; }
    return;
  }
  /* THE LADDER CARD LEADS THE CONVERSATION (14 Sep 2026): what moved, where
     it sits on our ladder, what we settled for, and the reply that follows —
     worked out, not asked for. */
  lane.innerHTML = ceLadderCardHtml() + _ceThread.map(ceTurnHtml).join('')
    + (_ceBusy ? `<p class="ce-work"><i></i>${_cee(_cet('ce_thinking'))}</p>` : '');
  const last = lane.lastElementChild;
  if (last) lane.scrollTop = Math.max(0, last.offsetTop - lane.offsetTop - 4);
}
function ceTurnHtml(t, i){
  if (t.who === 'you') return `<div class="ce-you"><span>${_cee(t.text)}</span></div>`;
  if (t.greeting) return ceGreetingHtml();
  /* AN ANSWER, NOT A PROPOSAL: the words it was about, the reading, and the
     one way on — Edit with this. No Apply, no Refine, no vote on wording. */
  if (t.asking) return `<div class="ce-ai">${
    t.text ? `<p class="t">${_cee(t.text)}</p>` : ''}${
    (t.read && t.read.length) ? `<ul class="ce-read">${t.read.map(r =>
      `<li><b>${_cee(r[0])}</b><span>${_cee(r[1])}</span></li>`).join('')}</ul>` : ''}
    <div class="ce-card ce-ans">
      <div class="n"><span>${_cee(_cet('ce_answer'))}</span><span class="g"></span></div>
      ${t.passage ? `<q class="aq" title="${_ceea(t.passage.text)}">${_cee(t.passage.text)}</q>` : ''}
      <div class="av"><span class="g"></span>
        ${''/* Edit with this re-attaches the SAME words under the edit verb, so
               it is drawn only where there are words one clause holds: never
               on the whole contract, never on words across two clauses. */}
        ${(ceUnderDeletion() || !t.passage || t.passage.loose) ? '' : `<button type="button" class="p" data-ce-edit-with="${i}">${_cet('ce_edit_with_this')}</button>`}
      </div>
    </div></div>`;
  return `<div class="ce-ai">${
    t.text ? `<p class="t">${_cee(t.text)}</p>` : ''}${
    (t.read && t.read.length) ? `<ul class="ce-read">${t.read.map(r =>
      `<li><b>${_cee(r[0])}</b><span>${_cee(r[1])}</span></li>`).join('')}</ul>` : ''}${
    (t.cards || []).map((card, j) => ceCardHtml(card, i, j)).join('')}</div>`;
}
/* ---- THE GREETING CARRIES WHAT NOTHING ELSE ON THE PAGE SAYS ----
   (owner-approved 13 Sep 2026, group 1 of the build plan.)

   TWO FACTS, AND DELIBERATELY NOT A THIRD. The playbook's position is stated
   twice already — by Prepare redlines, which files a redline for every gap,
   and by this rail's own Playbook tab — so printing it here would be the third
   telling. What NOTHING states until you ask a question is what we settled
   with this counterparty before, and what they have asked for on this clause.
   Both were already computed and handed to the model; they were simply never
   shown to the reader.

   IT SPENDS NOTHING and adds no element: the rows are ceReadList's own markup,
   in the lane the greeting already occupies. A clause with neither fact draws
   exactly the sentence it drew before. */
function ceGreetingHtml(){
  const cl = ceClause();
  const rows = [];
  const pc = cePrecedentLine();
  if (pc) rows.push([_cet('ce_read_precedent'), pc]);
  const ta = ceTheirAsk();
  if (ta) rows.push([_cet('ce_read_theirs'), ta]);
  /* ---- THE GREETING SENTENCE IS GONE (Young ruled it 23 Sep 2026, fix 5:
     "the greeting that filled the top of the panel goes") ----
     The card at the foot now says what Copilot is working on, so a sentence
     at the top saying the same was the fact printed twice. THE TWO FACTS
     STAY where there are any — they are the reason this function exists (13
     Sep 2026) and nothing else on the page states them. */
  void cl;
  return rows.length ? `<div class="ce-ai"><ul class="ce-read">${rows.map(r =>
      `<li><b>${_cee(r[0])}</b><span>${_cee(r[1])}</span></li>`).join('')}</ul></div>` : '';
}
/* ONE CARD SHAPE, whether it comes from the chat or from the scan, because
   both hand wording to the same Apply. What a card must always carry: what it
   rests on, the wording it proposes marked against what stands, and a way to
   say whether it was any good. */
function ceCardHtml(card, i, j){
  /* ---- MARKED AGAINST WHAT IT WOULD REPLACE ----
     A card about a held passage proposes wording for THOSE WORDS, so marking it
     against the whole clause would strike out every sentence around it and read
     as a proposal to delete the clause. Marked against the passage it names, it
     reads as the change it is. */
  const marked = ceRedlineHtml(card.passage ? card.passage.text : _ceText, card.text || '');
  const vote = card.vote || '';
  /* ---- ON A CLAUSE UNDER DELETION A CARD IS A READING ---- (10 Sep 2026)
     Copilot may still advise — that is the whole of what this page owes the
     reader there — but its answer cannot be moved into the wording, because
     Apply is refused. So the two verbs that would put it there are not drawn:
     a verb that cannot work is not drawn, and a card offering Refine over an
     Apply that refuses is the same dead press one step further away. */
  const offerWording = !!card.text && !ceUnderDeletion() && card.mode !== 'ask';
  return `<div class="ce-card">
    <div class="n"><span>${_cee(card.name || _cet('ce_suggestion'))}</span><span class="g"></span>${
      card.chip ? `<span class="chip ${_ceea(card.chipTone || 'wait')}">${_cee(card.chip)}</span>` : ''}</div>
    ${card.line ? `<span class="l">${_cee(card.line)}</span>` : ''}
    ${card.rests ? `<span class="r">${_cee(_cet('ce_rests_on', { on: card.rests }))}</span>` : ''}
    ${card.text ? `<span class="pv">${marked}</span>` : ''}
    <div class="av">
      ${offerWording ? `<button type="button" class="p" data-ce-apply="${i}:${j}">${_cet('ce_apply')}</button>` : ''}
      ${offerWording ? `<button type="button" data-ce-refine="${i}:${j}">${_cet('ce_refine')}</button>` : ''}
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
  const qs = [];
  /* ---- THE READY-MADE QUESTIONS FOLLOW THE SCOPE ----
     With a passage held they are THE STRIP'S OWN THREE, word for word and key
     for key — shorten it, make it firmer, plain English — which are the three
     things anybody asks about one sentence and are already written in both
     languages. With nothing held they are the clause's own four or five.

     THE SAME CHIPS, NOT A SECOND SET: each is a question typed into the same
     box and pressed through the same ceAsk, so what narrows the ask is the
     PASSAGE rather than which chip was pressed. One attribute, one row, one
     line that draws it either way. */
  if (_ceSel && _ceSel.mode === 'ask'){
    /* ASK: questions, not rewrites — nothing here can end in an Apply. */
    qs.push(_cet('ce_q_words_mean'), _cet('ce_q_words_standard'), _cet('ce_q_words_risk'));
  } else if (!_ceSel && _ceWhole){
    /* THE WHOLE CONTRACT (fix 5): questions about any part of it. */
    qs.push(_cet('ce_q_contract_risks'), _cet('ce_q_contract_missing'), _cet('ce_q_contract_end'));
  } else if (_ceSel){
    qs.push(_cet('ce_inline_shorten'), _cet('ce_inline_firmer'), _cet('ce_inline_plain'));
  } else {
    const on = ceOnTable(), theirs = on.find(x => x.authorSide === 'counterparty');
    if (theirs) qs.push(_cet('ce_q_answer', { id: theirs.id }));
    /* ---- AND ONE OF THEM CANNOT BE ASKED ON A DELETION ---- (10 Sep 2026)
       "Give me a softer version" asks for replacement wording, and on a clause
       the other side wants removed there is nothing to soften and nowhere for
       the answer to go — Apply is refused there. The other three still stand:
       how to answer the ask, what our playbook says, what the risk is, and what
       the clause says in plain English are all questions about a clause you may
       be about to lose. */
    if (!ceUnderDeletion()) qs.push(_cet('ce_q_softer'));
    qs.push(_cet('ce_q_our_standard'), _cet('ce_q_risk'), _cet('ce_q_plain'));
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
/* ---- WHAT THE OTHER SIDE HAS ACTUALLY ASKED FOR ---- (10 Sep 2026)
   It named the change and its reason and NEVER THE ASK, so on a deletion it
   handed Copilot a clause and no proposal — which is why the rail had nothing
   to say about the one thing on the page. It says the ask now.

   IT STATES A FACT OFF THE RECORD AND ASKS FOR NOTHING NEW: no extra call, no
   extra spend. The clause's own wording already reaches the model through
   copilotPropose's `passage`, which on a deletion falls back to the standing
   wording — so what was missing was the sentence saying it is the wording that
   would go, and that is what this adds. */
function ceTheirAsk(){
  const theirs = ceOnTable().find(x => x.authorSide === 'counterparty');
  if (!theirs) return '';
  const why = String(theirs.why || '').trim();
  if (ceRemovesWording(theirs))
    return why ? _cet('ce_their_ask_del_why', { id: theirs.id, why })
      : _cet('ce_their_ask_del', { id: theirs.id });
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

/* ---- WHAT "THE WHOLE CONTRACT" IS WHEN IT IS ASKED ABOUT (fix 5) ----
   The wording as it stands — the round's baseline with every adopted change
   in it — which is what the paper beside the rail reads as. Its own reading,
   never a second one: negoResolvedText is what the round close writes. */
function ceWholeText(){
  try{ if (window.negoResolvedText){ const t = String(negoResolvedText(_ceC) || ''); if (t.trim()) return t; } }catch(_){}
  try{ if (window.playbookText) return String(playbookText(_ceC) || ''); }catch(_){}
  return '';
}
/* The ask carries the whole contract as ONE message; the context says so, and
   the chat route lets that one message reach the document ceiling rather than
   the per-turn one (a question is short; a contract is not). */
function ceWholeContext(){
  let ctx = null;
  try{ ctx = (typeof window.buildAssistantContext === 'function') ? buildAssistantContext() : null; }catch(_){ ctx = null; }
  return Object.assign({}, ctx || {}, { wholeDoc: true });
}
async function ceAsk(question, opts = {}){
  const q = String(question == null ? '' : question).trim();
  if (!q || _ceBusy) return;
  /* ---- WHAT THIS QUESTION IS ABOUT, TAKEN NOW ---- (owner-ruled 31 Aug 2026)
     A held passage narrows the question to those words and the answer to a
     replacement for them. TAKEN AT THE PRESS rather than read again when the
     answer lands: the model takes seconds, and a reader who highlights
     something else meanwhile must not have the first answer applied to the
     second passage. It rides ON THE CARD for the same reason — Apply may be
     pressed minutes later, and a card that asked about one sentence may never
     replace another. */
  const scope = _ceSel;
  /* THE WHOLE CONTRACT (fix 5, 23 Sep 2026) is a question too: Copilot is
     given the whole contract and answers, naming the clause for each point;
     it changes no wording from there. */
  const whole = !scope && _ceWhole;
  /* ASK IS A QUESTION (Young, 11 Sep 2026, evening: "ask copilot simply
     allows you to ask a question but not edit"). Under an 'ask' passage the
     prompt asks for an explanation, the answer is drawn as a reading with no
     Apply anywhere, nothing is recorded as proposed, and the one way on is
     Edit with this on the answer card (ceEditWith). */
  const asking = whole || !!(scope && scope.mode === 'ask');
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
      /* ONE CALL, TWO SCOPES. The prompt says which, so an answer meant to
         replace one sentence is never written as a whole clause. */
      ask: _cet(whole ? 'ce_prompt_contract' : asking ? 'ce_prompt_question' : scope ? 'ce_prompt_passage' : 'ce_prompt_ask'),
      passage: whole ? ceWholeText() : scope ? scope.text : (_ceText || _ceBase),
      instruction: q,
      /* No clause label on the whole contract: that line tells the model the
         passage is ONE clause, which is exactly what it is not here. */
      clauseLabel: whole ? '' : ceClauseLabel(cl),
      party: (window.contractParty ? contractParty(_ceC) : (window.FIRST_PARTY || '')) || '',
      law: window.jxLaw ? jxLaw() : '',
      playbook: whole ? '' : [cePlaybookLine(), cePrecedentLine(), ceTheirAsk()].filter(Boolean).join('\n'),
      history,
      context: whole ? ceWholeContext() : undefined,
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
  if (asking){
    const advice = String(res.advice || '').trim();
    /* NO READING LIST UNDER A QUESTION (Young, 11 Sep 2026, late: "not
       necessary when I am simply asking a question. When I want to edit then
       include it"): the three rows rest wording that is about to move. */
    _ceThread.push({ who: 'ai', text: advice || wording, read: [], asking: true, passage: scope, whole,
      /* Wording the model volunteered anyway is HELD, not offered: Edit with
         this turns it into a card with Apply; until then it is nowhere. Never
         on the whole contract or on loose words, which nothing edits. */
      held: (wording && advice && scope && !scope.loose && wording !== scope.text) ? wording : '' });
    ceRenderLane();
    return;
  }
  const rests = [cePlaybookLine(), cePrecedentLine()].filter(Boolean)[0] || '';
  /* ---- THE PROPOSAL GOES ON THE RECORD THE MOMENT IT IS MADE (idea 22) ----
     RECORDED AT ARRIVAL, NOT AT THE PRESS, and that is the whole reason this
     surface can answer "how much of what Copilot offered was actually used".
     A card is one paid answer to one question; the reader either takes it or
     does not, and a proposal recorded only when it is APPLIED can never report
     the ones nobody wanted. Everything else in this file already treats a card
     as a one-shot offer.

     IT RECORDS AND IT DOES NOT DECIDE. The outcome starts at `proposed` and is
     settled by the funnel when something is filed; a card nobody presses stays
     `proposed` for good, which the two readers print as "not taken" rather than
     folding into a refusal — the rulebook's own rule that a call which never
     got an answer is not a wrong answer.

     THE ID RIDES ON THE CARD for the same reason the passage does: Apply may be
     pressed minutes later, after other answers have landed, and the entry this
     press settles must be the entry this card was written from. */
  let _trace = null;
  if (wording && window.aiTraceNote){
    try{
      _trace = aiTraceNote(_ceC, { feature: 'redline', kind: 'wording',
        clauseId: _ceClauseId, clauseLabel: ceClauseLabel(cl),
        what: wording, rested: rests });
      if (window.aiTraceSave) aiTraceSave(_ceC);
    }catch(_){ _trace = null; }
  }
  _ceThread.push({ who: 'ai',
    text: String(res.advice || '').trim(),
    read,
    cards: wording ? [{ name: _cet(scope ? 'ce_suggestion_passage' : 'ce_suggestion'),
      chip: _cet('ce_chip_copilot'), chipTone: 'wait',
      line: '', rests, text: wording, passage: scope || null, trace: _trace }] : [] });
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
/* ---- AND THE FOURTH WORDING, WHICH ONLY A LOCATED CLAUSE CAN HAVE ----
   (Young's go on "The Nuanced Redline", 15 Sep 2026.) `fit` is our figure
   written into THEIR sentence — see pbFitWording. It is on the `here` list
   alone because there is nothing to narrow to on a clause the contract does
   not yet carry, and it is named here rather than guessed at the card so this
   rail and the Playbook review window offer the same four presses under the
   same four names. */
const CE_SCAN_VERBS = {
  here:    { preferred: 'ce_use_standard', fallback: 'ce_use_fallback', draft: 'ce_use_draft',
             fit: 'ce_use_fit' },
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
  /* ---- THE SIGN, WHERE IT CAN BE KNOWN BEFORE THE PRESS (owner-asked 10 Sep
     2026) ----
     negoAddNamedClause is the WALL and refuses in words; this is the product's
     own other half — grey a control that cannot work rather than refuse after
     it is pressed. Only the MISSING group can duplicate: a rule in the `here`
     group edits a clause that is already located and adds nothing.

     IT ASKS THE ONE READING through window with no fallback past it: where the
     model is not loaded there is nothing to compare against and the card draws
     exactly as it did. The heading is built the way the filing will build it,
     or the sign would be answering about a different name from the wall.

     AND IT READS WITHOUT WRITING: negoClauseList calls negoInit, which CREATES
     a negotiation and stamps clause ids into the stored wording, so DRAWING a
     card would start one. Asked only where a negotiation already exists —
     which costs nothing here (this page is the negotiation's own editor) and
     costs nothing anywhere, because negoDupClauseStop's own reading is guarded
     the same way and answers null there too. */
  const stop = (group === 'missing' && !filed && window.negoDupClauseStop && _ceC)
    ? negoDupClauseStop(_ceC, window.clauseHeadingFor
        ? clauseHeadingFor(String(v.category || ''),
            (_ceC.negotiation && typeof negoClauseList === 'function')
              ? negoClauseList(_ceC) : [])
        : String(v.category || ''))
    : null;
  return `<div class="ce-rule ${tone}">
    <div class="n"><span>${_cee(v.category || _cet('ce_rule'))}</span></div>
    <span class="l">${_cee(line)}</span>
    ${v.quote ? `<span class="r">${_cee(_cet('ce_scan_quote', { quote: String(v.quote).slice(0, 220) }))}</span>` : ''}
    ${''/* NO LEAD IS AN ANSWER on a clause we already have — see the lead's
           own note in rlPlaybookProposals. The named wordings are still
           offered below; what is not drawn is a picture of a whole-clause
           replacement under the words "the smallest change". */}
    ${preview ? `<span class="pvk">${_cee(ceWordingLabel(it.leadKind))}</span><span class="pv">${preview}</span>
      <button type="button" class="pv-more" data-ce-pv="${i}">${_cet('ce_pv_more')}</button>`
      : (group === 'here' ? `<span class="nofit">${_cee(_cet('ng_pb_nofit'))}</span>` : '')}
    ${cost ? `<span class="cost">${_cee(cost)}</span>` : ''}
    <div class="av">${filed
      ? `<span class="filed">${_cee(_cet('ce_scan_added_row'))}</span>`
      : stop
      ? `<span class="filed" title="${_ceea(stop.message)}">${_cee(_cet(
          stop.hit.where === 'document' ? 'ng_dup_clause_here_doc' : 'ng_dup_clause_here_table'))}</span>`
      : btn('preferred', it.preferred) + btn('fallback', it.fallback) + btn('draft', it.draft)
        + ((it.fit && it.fit.kind === 'figure') ? btn('fit', it.fit.text) : '')}</div>
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
  /* THE CARD SETTLES FIRST, then the whole page is repainted: ceFiled draws the
     rail among the rest, so marking it filed after the repaint would leave the
     card offering the add again until the next paint. */
  _ceScanFiled[ceScanKey(it)] = true;
  /* ---- AND IT FINISHES THE WAY A FILING FINISHES ---- (owner-reported 10 Sep 2026)
     This used to persist and draw the RAIL and nothing else, so the card settled
     into "Added as a new clause" over a contract with no new clause on it and a
     column still reading "Redlines (0)". The record was right and both screens
     were stale, which is why a refresh appeared to fix it.

     NO ceSeedDraft: see the note at ceFiled. The standard lands at the end of
     the terms and the reader is still on the clause they opened, so their draft
     and their place on the page are untouched — ceRenderPaper keeps the scroll
     and ceApply is what owns the box. */
  ceFiled(_ceC);
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
  /* ---- ONE SAVED CHECK, WHICHEVER DOOR RAN IT (fix 3, 23 Sep 2026) ----
     This scan was held in memory for the sitting, so the Checks card, Prepare
     redlines and this rail could each be reading a different check of one
     contract — and did. It is filed on the record the way the Checks card's
     own press files it, before the page-open test, because a check that ran
     is a fact about the contract whether or not this page is still up. */
  if (rev && _ceC){
    _ceC.playbook = rev;
    if (window.logAudit) logAudit(_ceC, 'Playbook',
      `Playbook review run from the clause editor — ${rev.verdicts.length} position${rev.verdicts.length === 1 ? '' : 's'} checked (${rev.source === 'ai' ? 'Copilot-assisted' : 'rule-based'})`);
    if (window.persist) persist(_ceC);
  }
  if (!clauseEditorOpen()) return;
  /* A review arriving clears the note; nothing arriving IS the note. The
     record now holds it, so the rail reads the record like every other door. */
  if (rev) { _ceScan = null; _ceScanErr = null; }
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
/* ---- ONE READING, TWO READERS (31 Aug 2026) ----
   ceSelectionRead answers the whole question — the passage, or the reason
   there is not one — and the two thin wrappers under it are what everything
   else calls. Split because a refusal on this page used to be SILENT: the
   handler got null, drew nothing and said nothing, so a gesture the product
   had decided against was indistinguishable from a broken page. That is this
   codebase's own most repeated defect, and it is the half of the ✕ report that
   would have made the other half findable in seconds.

   NEVER TWO COPIES OF THE READING. A second function working out "why not"
   beside one working out "what" is how the two come to disagree about which
   passages are allowed. */
function ceSelectionRead(){
  const box = _ceQ('#ce-clausebody');
  if (!box || typeof window.getSelection !== 'function') return { why: null };
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return { why: null };
  const r = sel.getRangeAt(0);
  if (!box.contains(r.commonAncestorContainer)) return { why: null };
  /* ---- READ THE RANGE WITH ITS BREAKS, NOT THE STRING IT PRINTS TO ----
     (Young, 11 Sep 2026, evening: "When i highlight the whole area or
     multiple lines, I am unable to edit with copilot.") The paper's own
     reader (_negoNodeText, through window) puts a newline at every block, in
     every browser alike; Selection.toString does so only in some. Runs of
     spaces fold to one, a break stays a break. */
  /* ---- STRUCK WORDS ARE ON THE PAGE AND NOT IN THE DRAFT (14 Sep 2026) ----
     The marks live in the box now (see TYPING IN THE MARKS), so a highlight
     that takes in a struck run is the ordinary case, not a mistake: read in the
     paper's own 'current' mode the struck runs fall away and what is left is
     the passage — the words that are staying, which is what the reader meant.
     A marker span keeps the gap the gutter draws, so a whole-line highlight
     reads "1. Either" and not "1.Either". */
  let raw = '';
  try{
    const frag = r.cloneContents();
    try{ frag.querySelectorAll('.rl-marker').forEach(m => { if (!/\s$/.test(m.textContent || '')) m.appendChild(document.createTextNode(' ')); }); }catch(_){}
    raw = (typeof window._negoNodeText === 'function') ? _negoNodeText(frag, 'current') : String(sel.toString() || '');
  }
  catch(_){ raw = String(sel.toString() || ''); }
  const text = ceWordsKeepBreaks(raw);
  /* A CLICK IS NOT A REFUSAL: an empty reading answers null rather than naming
     a reason nobody needs.
     A SHORT WORD IS STILL A WORD (Young reported it 15 Sep 2026: "sometimes
     when i highlight a word the 3 options do not appear"). The floor was three
     characters here and on the negotiation paper, so "by", "to", "of" and a
     bare figure were refused in silence. One character is a highlight; nothing
     at all is a click. */
  if (!text.length) return { why: null };
  const lines = ceLines();
  /* ---- SEVERAL SUB-PARAGRAPHS ARE ONE PASSAGE (reverses the 31 Aug rule) ----
     A clause's text carries one sub-paragraph per LINE. A selection across
     two or more of them is found as a run of consecutive lines — the tail of
     the first, whole middles, the head of the last — and carried with its
     first and last line, so the ONE replacement (ceReplacePassage) splices the
     run and keeps every break the reader did not touch. The 31 Aug refusal
     ("that runs across two sub-paragraphs") is gone; ce_sel_two_paras is
     inert in both books. */
  const parts = text.split('\n');
  if (parts.length > 1){
    /* THE DRAFT CARRIES A LIST'S NUMBERS AS TEXT ("2. Termination…") where the
       box draws them as list styling, so a line may begin with a short marker
       the range never contained: a middle line ENDS with its part, and the
       last part is found within a marker's width of its line's start. The
       passage is then carried in the DRAFT'S OWN FORM (markers included) —
       what the one replacement will find verbatim. */
    const last = parts.length - 1;
    const MARK = 8;
    let li = -1, kEnd = -1;
    for (let i = 0; i + last < lines.length; i++){
      if (!lines[i].endsWith(parts[0])) continue;
      let ok = true;
      for (let k = 1; k < last; k++) if (!lines[i + k].endsWith(parts[k])){ ok = false; break; }
      if (!ok) continue;
      const k0 = lines[i + last].indexOf(parts[last]);
      if (k0 >= 0 && k0 <= MARK){ li = i; kEnd = k0 + parts[last].length; break; }
    }
    if (li < 0) return { why: 'ce_sel_not_in_draft' };
    const le = li + last;
    const at = lines[li].length - parts[0].length;
    const canon = [lines[li].slice(at)].concat(lines.slice(li + 1, le), [lines[le].slice(0, kEnd)]).join('\n');
    let mrect = null;
    try{ mrect = r.getBoundingClientRect(); }catch(_){ mrect = null; }
    return { sel: { text: canon, rect: mrect, line: li, at, lineEnd: le, multi: true, range: r } };
  }
  let li = -1, at = -1, seen = 0;
  lines.forEach((ln, i) => {
    const k = ln.indexOf(text);
    if (k < 0) return;
    seen += 1;
    if (li < 0){ li = i; at = k; }
    if (ln.indexOf(text, k + 1) >= 0) seen += 1;
  });
  /* NOT IN THE DRAFT AT ALL. Two honest causes and they want different words:
     the passage runs across a line break (the sub-paragraph rule above), or it
     takes in wording that is on the paper and not in the draft — struck-out
     words in the redlined reading are exactly that. */
  if (li < 0) return { why: 'ce_sel_not_in_draft' };
  if (seen > 1 && text.length < 40) return { why: 'ce_sel_twice' };   /* ambiguous */
  let rect = null;
  try{ rect = r.getBoundingClientRect(); }catch(_){ rect = null; }
  /* THE RANGE TRAVELS WITH IT, so the held mark is drawn over exactly what the
     reader dragged rather than over the first copy of those words in the box. */
  return { sel: { text, rect, line: li, at, range: r } };
}
function ceSelection(){ return ceSelectionRead().sel || null; }
/* The passage the rail is HOLDING (null where none) — distinct from the live
   selection, which the caret leaves behind once a verb puts it in the ask box
   (round four). Tests and the Apply path read the held one. */
function ceHeldPassage(){ return _ceSel || null; }
/* Wording with its paragraph breaks kept and everything else folded — the one
   shape a multi-line passage and its replacement are read in. */
/* The pattern that finds a passage in the box's text: words joined by any
   whitespace or none (two sub-paragraphs' text nodes touch), and a token that
   looks like a list marker ("2.", "(b)", "iii)") made optional, because the
   draft carries it as text where the box draws it as list styling. */
function ceWordsPattern(text){
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return String(text || '').split(/\s+/).filter(Boolean)
    .map(t => /^\(?[0-9a-z]{1,4}[.)]$/i.test(t) ? '(?:' + esc(t) + '\\s*)?' : esc(t))
    .join('\\s*');
}
function ceWordsKeepBreaks(w){
  return String(w == null ? '' : w).replace(/\r/g, '').replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
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
  return ceWords(ceDraftNow()).split(/\n/).map(l => l.replace(/[^\S\n]+/g, ' ').trim());
}
/* ============================================================================
   THE SENTENCE THE STRIP IS HOLDING (owner-approved render, 30 Aug 2026)
   ----------------------------------------------------------------------------
   The strip takes the caret now, and a document has ONE selection: the moment
   the caret moves into the box, the browser stops painting the highlight in the
   clause. So the sentence being replaced would go invisible at the exact moment
   its replacement is being typed, which is the one thing the strip exists to
   make easy. This is the mark that keeps it visible, and the owner ruled on it
   as a mark on the contract rather than as a detail.

   IT CAN NEVER REACH THE RECORD, and that is guaranteed three times over rather
   than remembered once:
     1. the pull reads a CLONE of the box with the mark unwrapped (ceBoxHtml);
     2. sanitizeRich unwraps any span whose class is not on its own allow-list,
        and this class deliberately is not on it — see richSpanClassOk;
     3. the mark is cleared outright whenever the strip closes.
   The first two are structural: neither depends on anybody remembering to call
   anything. f245 asserts all three.

   IT IS A WRAPPER RATHER THAN AN OVERLAY because a wrapper follows the words —
   through a scroll, a re-wrap, a zoom and the reader's own text-size setting —
   where an overlay would have to be told about each of them. It changes no
   layout: a background and an inset shadow occupy no space. */
const CE_HELD_CLASS = 'ce-held';
function ceMarkHeld(range){
  const box = _ceQ('#ce-clausebody');
  if (!box || !range || !document.createElement) return false;
  ceClearHeld(box);
  /* ---- ONE MARK PER TEXT PIECE, NEVER ONE SPAN ROUND THE LOT (11 Sep 2026)
     ---- A passage across two sub-paragraphs cannot be surrounded by one span
     (surroundContents throws, and extract-and-reinsert would pull the second
     paragraph's words INTO the first), so each text node the range touches is
     wrapped on its own. The wording does not move by a character; the marks
     come off exactly as before (ceClearHeld unwraps every one). */
  const pieces = [];
  try{
    for (const nd of ceLiveTextNodes(box)){
      if (!range.intersectsNode(nd)) continue;
      const a = nd === range.startContainer ? range.startOffset : 0;
      const b = nd === range.endContainer ? range.endOffset : nd.data.length;
      if (a < b) pieces.push({ nd, a, b });
    }
  }catch(_){ pieces.length = 0; }
  if (!pieces.length){
    const span = document.createElement('span');
    span.className = CE_HELD_CLASS;
    try{ range.surroundContents(span); }
    catch(_){
      try{ span.appendChild(range.extractContents()); range.insertNode(span); }
      catch(e){ return false; }
    }
    return true;
  }
  const spans = [];
  for (const { nd, a, b } of pieces){
    let n = nd;
    if (b < n.data.length) n.splitText(b);
    if (a > 0) n = n.splitText(a);
    const span = document.createElement('span');
    span.className = CE_HELD_CLASS;
    n.parentNode.insertBefore(span, n);
    span.appendChild(n);
    spans.push(span);
  }
  /* THE SELECTION SURVIVES THE MARK. Splitting the text nodes the reader's
     range sits in can collapse the browser's own selection; it is put back
     over exactly the held pieces, which is what the rail reads and what the
     writing bar acts on. */
  try{
    const s = window.getSelection && window.getSelection();
    if (s && spans.length){
      const r2 = document.createRange();
      r2.setStartBefore(spans[0]); r2.setEndAfter(spans[spans.length - 1]);
      s.removeAllRanges(); s.addRange(r2);
    }
  }catch(_){}
  return true;
}
function ceClearHeld(scope){
  const box = scope || _ceQ('#ce-clausebody');
  if (!box || !box.querySelectorAll) return;
  box.querySelectorAll('.' + CE_HELD_CLASS).forEach(sp => {
    const p = sp.parentNode; if (!p) return;
    while (sp.firstChild) p.insertBefore(sp.firstChild, sp);
    sp.remove();
    /* The unwrap leaves the line split across two text nodes, and the next
       reader of this box is a Range walk. Put it back the way it was. */
    try{ p.normalize(); }catch(_){}
  });
}
/* WHAT THE BOX SAYS, WITH THE PAINT TAKEN OFF — the one reading both the pull
   and the dirty check use, so neither can mistake a mark HaTi drew for the
   reader's own work. The live DOM keeps both; only this copy loses them.

   TWO THINGS COME OFF, for the same reason and by the same means. The held
   passage's wash, and — since 10 Sep 2026, when the typing box was given the
   contract's own gutter — the marker span the gutter hangs the number in.
   Neither is wording. Leaving the marker on would make every pull report the
   box as CORRECTED (the sanitiser unwraps a span whose class it does not
   admit), and a corrected box repaints the paper, which is the one thing that
   may not happen under a caret. */
const CE_PAINT_SEL = '.' + CE_HELD_CLASS + ',.rl-marker,[data-ce-mark]';
function ceBoxHtml(box){
  if (!box) return '';
  if (!box.querySelector || !box.querySelector(CE_PAINT_SEL)) return String(box.innerHTML || '');
  try{
    const clone = box.cloneNode(true);
    /* THE MARKS COME OFF FIRST (14 Sep 2026): an atom carries wording the draft
       does not have and goes whole; a wrapper is unwrapped and its characters
       stay. Neither may reach the record — the pull is the funnel's door. */
    ceMarksClear(clone);
    ceClearHeld(clone);
    /* The span goes and its characters stay: the marker IS part of the clause's
       wording, and a pull that dropped it would file a change striking the
       number out. */
    clone.querySelectorAll('.rl-marker').forEach(sp => {
      const par = sp.parentNode;
      if (!par) return;
      while (sp.firstChild) par.insertBefore(sp.firstChild, sp);
      par.removeChild(sp);
    });
    return String(clone.innerHTML || '');
  }catch(_){ return String(box.innerHTML || ''); }
}
/* ---- ATTACHING A PASSAGE TO THE RAIL (M-1, owner-chose Option A) ----
   The drag on the paper is the whole gesture: what it produces is a scope on
   the Copilot rail, not a box over the contract.

   IT DOES NOT TAKE THE CARET, and that REVERSES the 30 Aug rule in place — a
   rule written for a strip that had a box of its own to type into. With the
   box in the rail there is nothing on the paper to focus, and taking the caret
   would move the reader out of the clause they are writing in every time they
   selected something. THE 30 Aug REASONING SURVIVES WHERE IT MATTERED: it was
   about a strip that opened ready and was not, and the answer to that here is
   that the ask box is one press away and says what it is for.

   THE MARK IS WHY THIS COSTS THE READER NOTHING. ceMarkHeld wraps the passage
   in the accent wash built the day before, so the sentence stays visible the
   moment the caret moves into the ask box and the browser drops the reader's
   own highlight — the one cost the render that chose Option A had to name.

   THE SAME PASSAGE TWICE IS NOT A NEW ATTACHMENT: re-selecting identical words
   repaints nothing, so a stray double-click does not clear a half-typed ask. */
/* ---- THE HIGHLIGHT OFFERS TWO THINGS (Young ruled 11 Sep 2026) ----
   *"when you highlight, you get a pop like image 2, but you only have ask
   copilot and comment. If you choose ask copilot it brings you to copilot as
   it does today ... if you choose comment, you are brought to the sliding
   comments / chat panel."*

   THIS COSTS ONE PRESS on the way to Copilot — a drag used to attach the
   passage to the rail by itself — and buys the second door, which a selection
   meant for a comment never had. The menu is the product's own (rlSelMenu,
   through window), pressed on mousedown so the browser's selection stands;
   nothing here takes the caret, so the writing bar still acts on the held
   sentence. Where the menu is not on this stage the drag attaches as before. */
/* When the rail last TOOK a passage or a menu last picked a verb (ms since
   epoch), and how long a mouse-up after that still counts as ending the press
   that did it rather than a new drag. Stamped at the ONE attach and at BOTH
   pick doors — the editor's own menu and the paper's offer (shared with the
   negotiate page), whose hand-over across clauses re-mounts the page and
   attaches a tick later, so the mouse-up can land before the attach. */
let _ceMenuPickAt = 0;
const CE_MENU_PICK_MS = 600;
function ceStampPick(){ _ceMenuPickAt = Date.now(); }
function ceOfferPassage(sel){
  if (!sel) return;
  const menu = (typeof window !== 'undefined') ? window.rlSelMenu : null;
  const c = _ceC, cid = _ceClauseId;
  const mayNote = !!(c && window.rlNoteFromSelection
    && (typeof window.notesMayWrite !== 'function' || notesMayWrite(c, {})));
  if (typeof menu !== 'function' || !sel.rect){ ceAttachPassage(sel, 'edit'); return; }
  /* ---- THREE VERBS (Young, 11 Sep 2026, evening) ----
     Ask Copilot is a QUESTION about the words and touches nothing; Edit with
     Copilot is what Ask used to be — the words in the rail with the rewrite
     chips and Apply live; Comment is the drawer. The verb decides whether
     Copilot may touch the wording (see ceAsk's `asking`). */
  const acts = [{ id: 'ask', label: _cet('ng_sel_ask') }, { id: 'edit', label: _cet('ng_sel_edit') }];
  if (mayNote) acts.push({ id: 'comment', label: _cet('ng_sel_comment') });
  const kill = () => document.querySelectorAll('.nego-selmenu').forEach(n => n.remove());
  kill();
  menu({ text: sel.text, clauseId: cid, rect: sel.rect, actions: acts, onPick: a => {
    kill();
    /* ---- THE MOUSE-UP THAT ENDS A MENU PRESS IS NOT A DRAG ON THE WORDING
       (12 Sep 2026, the owner: "edit with copilot is now missing the feature
       with apply") ---- The menu picks on MOUSEDOWN and is gone by the
       mouse-up, which therefore lands on the paper underneath, inside #ce-doc.
       The paper's handler (below) reads the selection a tick later — and the
       verb has just moved the caret into the ask box, so it finds nothing and
       clears the passage the rail took a moment ago. MEASURED: the rail held
       the words at mouse-up and had lost them 300ms later; the answer came
       back as a whole-clause suggestion. Stamped as a TIME, not a flag, so a
       pick made by keyboard (no mouse-up follows) cannot swallow the next
       real drag. */
    ceStampPick();
    if (a.id === 'comment'){
      ceDetachPassage();
      rlNoteFromSelection(c, { clauseId: cid, quote: sel.text },
        { side: 'owner', author: (_ceOpts && _ceOpts.by) || undefined });
      return;
    }
    ceAttachPassage(sel, a.id === 'ask' ? 'ask' : 'edit');
  } });
  /* Shut by the next press anywhere else — the page has no room to arm it. */
  const shut = ev => {
    if (ev.target && ev.target.closest && ev.target.closest('.nego-selmenu')) return;
    kill(); document.removeEventListener('mousedown', shut, true);
  };
  document.addEventListener('mousedown', shut, true);
}
/* The paper's own Ask Copilot arrives here with WORDS rather than a range:
   the editor has just opened on the clause and the reader's selection is
   gone. The words are found in the box, selected, and read back through the
   ONE selection reading — so the rail holds exactly what a drag would have
   given it, refusals included. Nothing where the words are not in the draft. */
function ceAttachWords(text, mode){
  /* A QUESTION ABOUT WORDS THIS CLAUSE DOES NOT HOLD — a highlight across two
     clauses, fix 4 (23 Sep 2026) — is held LOOSE: asked about, never marked or
     edited. Every door that hands words over asks this one function, so the
     rule is kept once. An EDIT of words the box does not hold is still
     nothing, as it always was. */
  const found = ceAttachWordsIn(text, mode);
  return found || (mode === 'ask' ? ceAttachLoose(text) : false);
}
function ceAttachWordsIn(text, mode){
  const box = _ceQ('#ce-clausebody');
  const q = String(text || '').replace(/\s+/g, ' ').trim();
  if (!box || !q || !document.createTreeWalker || !window.getSelection) return false;
  const nodes = ceLiveTextNodes(box);
  let full = ''; const starts = [];
  for (const t of nodes){ starts.push(full.length); full += t.data; }
  /* Whitespace-blind across a break, and a list marker the box does not
     draw is optional — see ceWordsPattern (11 Sep 2026). */
  let re; try { re = new RegExp(ceWordsPattern(q), 'i'); } catch (e){ return false; }
  const m = re.exec(full);
  if (!m) return false;
  const at = (pos) => {
    for (let i = 0; i < nodes.length; i++){
      const ns = starts[i], ne = ns + nodes[i].data.length;
      if (pos >= ns && (pos < ne || (pos === ne && i === nodes.length - 1))) return { node: nodes[i], off: pos - ns };
    }
    return null;
  };
  const a = at(m.index), b = at(m.index + m[0].length);
  if (!a || !b) return false;
  try {
    const r = document.createRange();
    r.setStart(a.node, a.off); r.setEnd(b.node, b.off);
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(r);
  } catch (e){ return false; }
  const read = ceSelectionRead();
  if (!read.sel) return false;
  ceAttachPassage(read.sel, mode);
  return true;
}
/* `mode` is the verb the passage arrived under: 'ask' (a question, Copilot
   touches nothing) or 'edit' (the rewrite chips and Apply). Absent reads as
   'edit', which is what every older caller meant. */
function ceAttachPassage(sel, mode){
  if (!sel) return;
  _ceWhole = false;
  const m = mode === 'ask' ? 'ask' : 'edit';
  if (_ceSel && _ceSel.text === sel.text && _ceSel.line === sel.line && (_ceSel.mode || 'edit') === m) return;
  sel.mode = m;
  _ceSel = sel;
  ceStampPick();
  /* MARKED FROM THE RANGE THE READER JUST MADE, before anything else can
     collapse it. */
  if (sel.range) ceMarkHeld(sel.range);
  ceRenderScope(); ceRenderChips();
  /* ---- THE VERB PUTS THE CARET IN THE ASK BOX (round four, 11 Sep 2026:
     "the cursor should take you to the entry field in copilot ... You should
     not have to click into them") ---- Reverses round two's "attaching never
     takes the caret": the words are held on the paper by the mark, so the
     selection has nothing left to protect. The writing bar still acts on the
     held sentence wherever the caret is. */
  ceFocusAsk();
}
function ceFocusAsk(){
  const box = _ceQ('#ce-ask');
  if (!box || !box.focus) return;
  try { box.focus({ preventScroll: true }); } catch (e){ try { box.focus(); } catch (_){} }
}
/* Words held as a question and nothing else: no range, no mark, no line in
   this clause's box — they may not be in it at all (fix 4, a highlight across
   two clauses). The card says what they are; the answer is a reading. */
function ceAttachLoose(text){
  const t = String(text == null ? '' : text).replace(/[^\S\n]+/g, ' ').trim();
  if (!t) return false;
  _ceWhole = false;
  _ceSel = { text: t, mode: 'ask', loose: true };
  ceStampPick();
  ceRenderScope(); ceRenderChips(); ceFocusAsk();
  return true;
}
/* The ✕ on the card, and nothing else, turns the rail to the whole contract. */
function ceSetWhole(on){
  _ceWhole = !!on;
  ceRenderScope(); ceRenderChips();
  if (_ceWhole) ceFocusAsk();
}
function ceDetachPassage(){
  if (!_ceSel) return;
  const had = _ceSel;
  _ceSel = null;
  /* THE MARK GOES WITH IT. It says what the rail is holding, so it may not
     outlive it — and this is the third of the three nets that keep it off the
     record (see ceMarkHeld). */
  ceClearHeld();
  /* ---- AND SO DOES THE BROWSER'S OWN SELECTION (owner-reported 31 Aug 2026)
     ---- *"when I click the highlighted x in the card, I am unable to highlight
     a sentence in the same clause and get a copilot to edit again."*

     REPRODUCED, AND THE ✕ IS THE TRIGGER RATHER THAN THE CAUSE. Letting the
     passage go took away the card and the mark and left the SELECTION standing
     — and pressing the ✕ moves focus out of the box, at which point the browser
     stops painting that selection. So from the reader's chair nothing is
     selected while the document says otherwise.

     WHAT THAT COSTS IS THE WHOLE REPORT: a mousedown inside an existing
     selection in a contenteditable box starts a native DRAG OF THE TEXT rather
     than a new selection, so the browser swallows the mouseup and this page's
     handler never runs at all. MEASURED: two mousedowns, one mouseup. It is
     that clause only, because that is where the stale selection is, and it
     clears itself after one press elsewhere — which is what makes it read as
     intermittent.

     ONLY WHERE THE SELECTION IS STILL OURS, and that is what makes this safe
     rather than merely effective: this runs on every path that lets a passage
     go, including a rebuild and a refusal, and collapsing a selection the
     reader has just made themselves would be the same rudeness pointing the
     other way. Compared on the normalised text, because ceSelection normalises
     and the live selection does not. */
  try{
    const s = window.getSelection && window.getSelection();
    if (s && !s.isCollapsed && had && had.text
        && String(s.toString() || '').replace(/[^\S\n]+/g, ' ').replace(/\n+/g, ' ').trim() === had.text)
      s.removeAllRanges();
  }catch(_){}
  ceRenderScope(); ceRenderChips();
}
/* ---- WHAT IS ATTACHED, SAID WHERE THE READER IS ABOUT TO TYPE ----
   The card quotes the passage in full on its own title, twelve pixels from the
   box the question is typed into, and the mark on the paper says which words
   they are. THE ASK BOX SAYS WHAT IT IS FOR, because a narrowed control states
   the narrowing by being set to it — the WHOSE ASKS rule, on a placeholder. */
function ceRenderScope(){
  if (!clauseEditorOpen()) return;
  const box = _ceQ('#ce-scope');
  const ask = _ceQ('#ce-ask');
  const sel = _ceSel;
  const asking = !!(sel && sel.mode === 'ask');
  /* ---- ONE CARD, FOUR THINGS IT CAN SAY (Young ruled it 23 Sep 2026, fix 5)
     ---- The pencil used to open a greeting and a highlight a card, so one
     Copilot wore two looks and a reader could not tell what it was working
     on. The card now ALWAYS says: the whole clause (the pencil), your words
     (Edit with Copilot), a question about words (Ask Copilot), or the whole
     contract (after the ✕). */
  const state = sel ? (asking ? 'ask' : 'edit') : (_ceWhole ? 'contract' : 'clause');
  if (ask) ask.placeholder = _cet({ ask: 'ce_ask_ph_question', edit: 'ce_ask_ph_passage',
    contract: 'ce_ask_ph_contract', clause: 'ce_ask_ph_clause' }[state]);
  /* The rail's own clause label says the same: in whole-contract mode it is
     not about this clause any more. */
  const lab = _ceQ('.ce-ah-cl');
  if (lab){
    const name = state === 'contract' ? _cet('ce_whole_contract') : (ceClauseLabel(ceClause()) || _cet('ce_this_clause'));
    lab.textContent = name; lab.title = name;
  }
  if (!box) return;
  const where = (sel && sel.loose) ? _cet('ce_scope_words') : (ceClauseLabel(ceClause()) || _cet('ce_this_clause'));
  const off = `<button type="button" class="x" data-ce-act="scope-off"
        title="${_ceea(_cet('ce_scope_to_contract'))}" aria-label="${_ceea(_cet('ce_scope_to_contract'))}">${window.icon ? icon('x','w-3.5 h-3.5') : '&#10005;'}</button>`;
  if (state === 'contract'){
    const name = String((_ceC && _ceC.name) || '').trim();
    box.innerHTML = `<div class="ce-scope is-whole">
      <div class="eb"><b>&#128214; ${_cee(_cet('ce_scope_contract', { name: name || _cet('ce_this_contract') }))}</b></div>
      <p class="sm">${_cee(_cet('ce_scope_contract_line'))}</p>
    </div>`;
    return;
  }
  if (state === 'clause'){
    /* The clause's WORDS, never its markup: the draft is stored as a rich
       body, and a card quoting "<p>" is a card quoting nothing a reader wrote. */
    const raw = String(_ceText || _ceBase || '');
    const words = String(window.richToText ? richToText(raw) : raw.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
    box.innerHTML = `<div class="ce-scope is-clause">
      <div class="eb"><b>&#9998; ${_cee(_cet('ce_scope_in', { where }))}</b><span class="g"></span>${off}</div>
      ${words ? `<q title="${_ceea(words)}">${_cee(words)}</q>` : ''}
      <p class="sm">${_cee(_cet('ce_scope_whole_clause'))}</p>
    </div>`;
    return;
  }
  box.innerHTML = `<div class="ce-scope${asking ? ' is-asking' : ''}">
    <div class="eb"><b>${asking ? '&#10024;' : '&#9998;'} ${_cee(_cet(asking ? 'ce_scope_asking' : 'ce_scope_in', { where }))}</b><span class="g"></span>
      ${off}</div>
    <q title="${_ceea(sel.text)}">${_cee(sel.text)}</q>
    ${asking ? `<p class="sm">${_cee(_cet('ce_scope_asking_line'))}</p>` : ''}
    ${''/* ---- THE ONE VERB THE STRIP CARRIED THAT NOTHING ELSE DOES ----
           "Suggest deleting these words" was the strip's own &times; and is the
           only one-press way in the product to strike a sentence out. It is on
           the passage's own card rather than in the chips row, which is a
           DEPARTURE FROM THE APPROVED RENDER and is named here: that row holds
           questions that spend money on Copilot, and an act that reaches the
           record is a different kind of thing. */}
    ${asking ? '' : `<button type="button" class="cut" data-ce-act="scope-cut"
      aria-label="${_ceea(_cet('ce_inline_cut'))}"
      title="${_ceea(_cet('ce_inline_cut_title'))}">${_cee(_cet('ce_scope_cut'))}</button>`}
  </div>`;
}
/* ---- THE BAR ACTS ON THE SENTENCE YOU HIGHLIGHTED, WHEREVER THE CARET IS ----
   (owner-approved render, 30 Aug 2026.) This is the price of the strip taking
   the caret, and the whole of it: a document has one selection, so with the
   caret in the strip every tool on the writing bar had nothing in the clause
   left to act on and would have gone silently dead — the exact fault this run
   is fixing two of elsewhere.

   ONE RULE RATHER THAN TWO. Not "the bar acts on the strip when the caret is in
   the strip", which cannot work: the strip is a plain box whose value goes to
   the record as WORDING, so bold inside it has nowhere to live. The held
   sentence is what the bar acts on, which is also the only thing a reader could
   mean by pressing B while a sentence is held.

   THE MARK IS WHAT MAKES IT POSSIBLE. It is a real element wrapping exactly the
   passage, so the range is read off it rather than searched for — no second
   reading of "which words were those", and nothing to go stale. The caret is
   handed straight back to the strip, so the gesture the reader is in the middle
   of is not interrupted. */
/* Which presses move a paragraph's SHAPE rather than its dressing — asked of
   richdoc's own list, never a second copy of four names here. */
const ceBarMovesShape = k => !!(window.RICH_SHAPE_KEYS && window.RICH_SHAPE_KEYS.has(k));
function ceBarOnHeld(k){
  const box = _ceQ('#ce-clausebody');
  const spans = box && box.querySelectorAll ? box.querySelectorAll('.' + CE_HELD_CLASS) : [];
  const sel = (typeof window !== 'undefined' && window.getSelection) ? window.getSelection() : null;
  if (!box || !spans.length || !sel || !window.richBarPress) return false;
  /* THIS OUTLIVES THE PRESS ON PURPOSE. The pull below can rebuild the paper,
     which clears _ceSel — so what the reader was holding is taken now and
     handed back afterwards. (The typed text used to be carried with it; there
     is no box on the paper to carry any more, and the rail's own ask box is
     never rebuilt by a paint.) */
  const held = _ceSel;
  let ran = false;
  try{
    const r = document.createRange();
    /* THE PAINT COMES OFF FIRST (14 Sep 2026): the bar writes into whatever
       text node is under the range, and a struck run's is not the draft's. */
    ceMarksClear(box);
    /* From the first held piece to the last — one span or several. */
    r.setStartBefore(spans[0]); r.setEndAfter(spans[spans.length - 1]);
    try{ box.focus({ preventScroll: true }); }catch(_){ box.focus(); }
    sel.removeAllRanges(); sel.addRange(r);
    ran = !!richBarPress(k);
  }catch(_){ ran = false; }
  if (!ran) return false;
  /* ---- AND THE PAPER IS USUALLY REBUILT BY THIS, WHICH IS RIGHT ----
     MEASURED: the browser writes <b> where the record keeps <strong>, so almost
     every press of this bar leaves the box holding markup the sanitiser has to
     correct — and an indent writes a style the record will not keep at all,
     which is a real difference the reader must not be shown. So the repaint is
     owed and the reader is put back after it rather than the repaint being
     skipped. The text of the passage does not move under a dressing change,
     which is what makes finding it again honest. */
  cePullText({ repaint: ceBarMovesShape(k) });
  ceReopenHeld(held);
  return true;
}
/* WHERE THOSE WORDS ARE NOW. A walk of the box's text, because after a rebuild
   the element the mark was on has gone — the words have not.
   IT MATCHES THE FIRST OCCURRENCE, which is safe here rather than merely
   convenient: ceSelection has already refused a passage it found twice unless
   it is long enough to be unambiguous, so anything the strip is holding is
   either unique or long. The worst a wrong match could do is draw the mark in
   the wrong place; it cannot reach the record. */
function ceRangeForText(text){
  const box = _ceQ('#ce-clausebody');
  const want = String(text == null ? '' : text);
  if (!box || !want || !document.createTreeWalker) return null;
  const nodes = []; let flat = '';
  try{
    for (const n of ceLiveTextNodes(box)){ nodes.push({ n, at: flat.length }); flat += n.nodeValue || ''; }
  }catch(_){ return null; }
  /* Whitespace-blind, so a passage that spans two sub-paragraphs (whose text
     nodes touch with no space between) is found exactly as a one-line one. */
  let m = null;
  try{ m = new RegExp(ceWordsPattern(want)).exec(flat); }catch(_){ m = null; }
  if (!m) return null;
  const at = m.index, len = m[0].length;
  const find = pos => {
    for (let i = nodes.length - 1; i >= 0; i--){
      if (nodes[i].at <= pos) return { node: nodes[i].n, off: pos - nodes[i].at };
    }
    return null;
  };
  const s = find(at), e = find(at + len);
  if (!s || !e) return null;
  try{
    const r = document.createRange();
    r.setStart(s.node, s.off); r.setEnd(e.node, e.off);
    return r;
  }catch(_){ return null; }
}
/* PUT THE READER BACK: the same passage held, marked where it now sits. The
   mark is a real element and a rebuild takes it with the box, so it is found
   again by its WORDS and re-wrapped. Where the passage genuinely cannot be
   found any more — a list or an indent can move it — the rail lets it go rather
   than holding a card over wording it can no longer place.

   IT RE-ATTACHES RATHER THAN RE-MARKING, so the card and the mark are put back
   by the one act that draws them both and cannot come apart. The guard in
   ceAttachPassage would refuse an identical passage as a no-op, so _ceSel is
   cleared first — the card is being redrawn against a NEW range. */
function ceReopenHeld(held){
  if (!held) return;
  const r = ceRangeForText(held.text);
  if (!r){ ceDetachPassage(); return; }
  let rect = null;
  try{ rect = r.getBoundingClientRect(); }catch(_){ rect = held.rect || null; }
  _ceSel = null;
  ceAttachPassage({ ...held, rect, range: r }, held.mode);
}
/* ---- THE ONE REPLACEMENT ----
   The passage goes, the wording arrives, and every other line of the clause is
   carried across character for character. ONE reading, because the reader's own
   typing and a Copilot rewrite are the same act on the record and a second copy
   is how the two come to disagree about what a line break costs. */
function ceReplacePassage(sel, wording, o = {}){
  const multi = !!(sel && sel.multi);
  /* keepView holds the reader IN the wording — the reader's own hand; a card's
     Apply passes false and the clause shows its marks (round three). */
  const keepView = o.keepView !== false;
  const words = multi ? ceWordsKeepBreaks(wording)
    : String(wording == null ? '' : wording).replace(/\s+/g, ' ').trim();
  /* ---- A REFUSAL IS SPOKEN WHERE EVERY OTHER REFUSAL ON THIS PAGE IS ----
     These two used to write into the strip's own note line, which was the only
     place a reader looking at a strip would see them. With the strip gone there
     is no second channel and none is wanted: ceSay is the page's one refusal
     line and the writing bar, Apply and Discard all already speak through it. */
  if (!words){ ceSay(_cet('ce_inline_say_what')); return false; }
  const lines = ceLines();
  if (multi){
    /* THE RUN OF LINES IS SPLICED AS ONE BLOCK: the passage is found across
       its breaks, replaced, and the block is put back as lines — every break
       the reader did not touch is carried across untouched (11 Sep 2026). */
    const le = Math.min(Number(sel.lineEnd), lines.length - 1);
    const block = lines.slice(sel.line, le + 1).join('\n');
    const at = block.indexOf(sel.text);
    if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
    if (words === sel.text){ ceDetachPassage(); return false; }
    const next = block.slice(0, at) + words + block.slice(at + sel.text.length);
    lines.splice(sel.line, le - sel.line + 1, ...next.split('\n'));
    ceDetachPassage();
    ceApply(lines.join('\n'), _cet('ce_step_passage'), { keepView, repaint: true });
    return true;
  }
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
  if (words === sel.text){ ceDetachPassage(); return false; }
  lines[sel.line] = ln.slice(0, at) + words + ln.slice(at + sel.text.length);
  ceDetachPassage();
  /* ---- READY FOR THE NEXT SENTENCE (owner-ruled 30 Aug 2026) ----
     keepView holds the reader IN the wording. Wording that arrives from
     somewhere else — a Copilot card, a playbook standard — drops out of typing
     so the marks it made are the first thing seen, and that rule is untouched
     for those. This one is the reader's own hand, mid-flow, and the press that
     follows it is the next highlight: dropping out would cost a second press of
     the pencil for every sentence after the first, which is the ceiling the
     owner set.
     repaint because the WORDS moved — keepView says nothing about the paper,
     and a passage replaced without a rebuild would leave the box showing the
     sentence that has just gone. */
  ceApply(lines.join('\n'), _cet('ce_step_passage'), { keepView, repaint: true });
  return true;
}
/* ---- STRIKE THE HIGHLIGHTED WORDS OUT ----
   The one verb the strip carried that nothing else in the product does, moved
   onto the passage's own card in the rail. The passage goes and what is left is
   tidied where the cut would otherwise leave two spaces or a space before a
   full stop; it goes through ceReplacePassage like every other change to this
   clause, so the rest of the wording is carried across character for character.

   ---- AND IT FILES (owner-asked 30 Aug 2026), WHICH THE STRIP'S REMOVAL DOES
   NOT REVERSE ---- "press send and it is filed immediately." The strip's send
   is gone with the strip — a replacement is typed into the paper now, and the
   one act in the rail's foot files it — but the CUT has no such twin: it is a
   single press with nothing to type, and dropping the filing would make it the
   one act on this page that costs two presses instead of one.

   IT IS NOT A SECOND FILING PATH, and that is the whole condition on it: ceFile
   is the same one act the foot presses, so every guard the funnel carries — the
   desk rule, the review gate, the executed-wording freeze — applies without
   being repeated here.

   ONLY WHERE SOMETHING MOVED: ceApply answers false when the draft already says
   what the cut would say, and a filing on that would be a revision proposing
   nothing. */
function ceCutPassage(){
  const sel = _ceSel;
  if (!sel) return false;
  const lines = ceLines();
  const tidy = s => s.replace(/[^\S\n]{2,}/g, ' ').replace(/[^\S\n]+([.,;:])/g, '$1').trim();
  if (sel.multi){
    const le = Math.min(Number(sel.lineEnd), lines.length - 1);
    const block = lines.slice(sel.line, le + 1).join('\n');
    const at = block.indexOf(sel.text);
    if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
    const left = (block.slice(0, at) + block.slice(at + sel.text.length)).split('\n').map(tidy).filter(Boolean);
    if (!left.length && lines.length === le - sel.line + 1){ ceSay(_cet('ce_inline_cut_all')); return false; }
    lines.splice(sel.line, le - sel.line + 1, ...left);
    ceDetachPassage();
    if (!ceApply(lines.join('\n'), _cet('ce_step_cut'), { keepView: true, repaint: true })) return false;
    ceFile();
    return true;
  }
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){ ceSay(_cet('ce_inline_moved')); return false; }
  const cut = tidy(ln.slice(0, at) + ln.slice(at + sel.text.length));
  /* ---- A WHOLE SENTENCE THAT IS ITS OWN LINE GOES AS A LINE (round four,
     11 Sep 2026: "suggest deleting does not work") ---- MEASURED: the owner
     selected one paragraph whole; the line emptied, and the refusal written
     for "you have struck the whole clause" fired on a clause with eight other
     lines. The refusal is right only where nothing would be left. */
  if (!cut && lines.length <= 1){ ceSay(_cet('ce_inline_cut_all')); return false; }
  if (!cut) lines.splice(sel.line, 1);
  else lines[sel.line] = cut;
  ceDetachPassage();
  if (!ceApply(lines.join('\n'), _cet('ce_step_cut'), { keepView: true, repaint: true })) return false;
  ceFile();
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
/* ---- WHAT HAPPENS AFTER A CHANGE LANDS ON THE RECORD ----
   (owner-reported 10 Sep 2026: "Add our standard" filed correctly and the paper
   and the Redlines column behind it stayed as they were until the page was
   refreshed.)

   ONE reading, because there are TWO doors onto "a change has been filed from
   this page" and there was no shared answer between them: File as a change did
   all five of these and Add our standard did one. A third door would have
   forgotten them again, which is exactly what the second one did.

   THE FIVE, AND EACH IS OWED FOR ITS OWN REASON — EXCEPT THE FIRST, WHICH IS
   NOT, AND IS KEPT ANYWAY WITH THE REASON SAID OUT LOUD. negoIssue is what
   stamps a change's hash and it already clears _chainVerify and rebuilds it
   from the new chain before it returns, so by the time either door here is
   reached the cache is not stale. It is kept because it is what File as a
   change has always done, dropping it would be a change to a door nobody
   reported, and clearing a cache that will be rebuilt on the next read costs
   nothing. It is not the reason this reading exists.
     · the verification cache — as above;
     · the record has moved, so it is saved — under _ceOpts.persist, because a
       caller that says it will save is a caller that must not be saved over;
     · this page reads the record, so the paper, the foot, the tabs and the rail
       are stale;
     · the page UNDERNEATH reads it too — the change column, the contract and
       the counts — so it is repainted behind this one rather than on the way
       out of it;
     · and the paper may have grown a clause, so the shell is re-measured.

   THE SEED IS NOT IN IT, deliberately. Re-reading the draft is owed only where
   the change landed on the clause the reader is EDITING — the standard goes in
   at the end of the terms and the reader is still on the clause they were on,
   so re-seeding there would move them onto wording they never asked to edit.
   Each door does its own seeding before it calls this. */
function ceFiled(c){
  try{ if (window.negoInvalidateVerification) negoInvalidateVerification(c); }catch(_){}
  try{ if ((!_ceOpts || _ceOpts.persist !== false) && window.persist) persist(c); }catch(_){}
  ceRenderAll();
  try{ if (typeof _ceAgain === 'function') _ceAgain(); }catch(_){}
  try{ ceFitToShell(); }catch(_){}
}
async function ceFile(why){
  /* A note kept from the ladder card rides the filing as its reason. */
  if (!why && _ceHeldNote) why = _ceHeldNote;
  if (_ceBusy) return null;
  if (_ceText === _ceBase && _ceHead === _ceHeadBase){ ceSay(_cet('ce_nothing_to_file')); return null; }
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
  if (!need){ if (window.toast) toast(_cet('ce_cannot_file'), 'err'); return null; }
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
    /* ---- THE COUNTER IS WRITTEN ON THEIR ASK (Young ruled 13 Sep 2026) ----
       The box was seeded from the lead change; where that is THEIR pending
       proposal, this filing is measured against it, and the funnel stacks the
       two — their marks stay on the paper under ours and the pair is decided
       together. ceStacksOn is the one reading of "which ask is this written
       on", asked here and by the layered picture above the box. */
    const on = ceStacksOn();
    if (on) o.onTop = on.id;
    ch = proposed ? await negoReviseInsert(c, clauseId, { bodyHtml: html, ...(ceHeadEditable() ? { headingText: _ceHead } : {}) }, o)
      : await negoEditClause(c, clauseId, html, o);
  }catch(e){ err = e; }
  _ceBusy = false;
  if (err){ if (window.toast) toast(_cet('ce_file_failed', { why: (err && err.message) || String(err) }), 'err'); return null; }
  if (!ch){
    /* Said IN the page, beside the button that was pressed — a refusal
       delivered off-screen is how a live button reads as a dead one. */
    ceSay(_cet('ce_nothing_changed'));
    if (window.toast) toast(_cet('ng_nothing_changed_no_fp'), 'warn');
    return null;
  }
  /* ---- THE RECORD HAS MOVED, SO THE PAGE IS RE-READ FROM IT ----
     The same seeding the door uses, which is what makes the foot name the
     change that now exists and the marks measure against the right baseline.
     The POSTURE is untouched: typing stays on, the rail stays where it was, and
     the reader's place in the contract is the one thing they were holding on to.

     IT IS TAKEN BEFORE THE NOTE IS ASKED FOR, which is a move rather than a
     reorder: ceSeedDraft reads the record and writes module state only — it
     touches no element — and the note dialog reads the contract and the change
     and none of what the seed writes. So the DOM sequence is what it always
     was, and both filing doors can then run one identical tail. */
  ceSeedDraft(ch.id);
  /* ---- AND THEN IT ASKS FOR A NOTE (owner-ruled 31 Aug 2026) ----
     The dialog's own lead sentence begins "Filed." and its heading names the
     change, so where it opens the toast STANDS DOWN: two boxes twelve pixels
     apart saying one thing is exactly the furniture this rulebook keeps warning
     about, and the louder of the two would be the one that says less.

     rlNoteAskAfterFile is the ONE reading of whether to ask — first filing,
     our seat, a reader who may write — so this door and the engine's own inline
     editor cannot come to disagree about when the question is put. Read
     through window, the ES-module rule; absent, the toast is what it always
     was. */
  const _noteAsk = window.rlNoteAskAfterFile
    ? rlNoteAskAfterFile(c, ch, { side: 'owner', author: (_ceOpts && _ceOpts.by) || undefined,
        persist: (_ceOpts && _ceOpts.persist) })
    : null;
  /* THE CONFIRMATION IS BRIEF AND ALWAYS (11 Sep 2026): the receipt window
     that carried "filed" as its headline is retired; the drawer that opens
     instead pins the change and asks for the note. */
  if (window.toast) toast(_cet('ce_filed', { id: ch.id }), 'ok');
  /* ---- FILING NEVER CLOSES THE PAGE (owner-ruled 30 Aug 2026) ----
     THIS REVERSES "BACK WHERE YOU STARTED", which closed the editor and put the
     reader back on the negotiation page with the change on it. That was right
     while filing was a once-per-visit act at the end of a clause; it is wrong
     now that the strip files, because changing three sentences in one clause
     meant being thrown out and going back in twice. Asked and ruled: "stay on
     the page."

     ONE RULE, BOTH DOORS. The strip's send and the rail foot's File as a change
     behave identically — filing files, and leaving is its own button. Two
     filing doors with two different ideas of where the reader ends up is
     exactly the drift this codebase opens by warning about.

     WHAT THE PRESS COSTS, and it is what was promised: the first change in a
     clause is two presses (the pencil, then send) and every one after it is
     one, because the page the reader is already on is the page they carry on
     in. */
  ceFiled(c);
  /* A note lands on the change, and the column behind this page prints the
     change's own note count — so the page underneath is repainted again once
     the reader has answered, and not at all where they had nothing to answer. */
  if (_noteAsk) _noteAsk.then(out => {
    if (!out) return;
    try{ if (typeof _ceAgain === 'function') _ceAgain(); }catch(_){}
  });
  /* ---- IT ANSWERS WHETHER IT FILED (owner-ruled 31 Aug 2026) ----
     Every path above returns null where nothing landed on the record. The
     pencil is the caller that needs this: it turns typing off, and turning it
     off over wording the funnel has just REFUSED would hide the reader's own
     unfiled work behind a read-only view. No caller written before this reads
     the value, so it is additive and nothing else behaves differently. */
  return ch;
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
    /* A HELD SENTENCE IS WHAT THE BAR ACTS ON, asked first because it is the
       state the caret is in whenever the strip is open. Everywhere else the
       bar reads the reader's own selection in the clause, exactly as it did. */
    if (_ceSel && ceBarOnHeld(k)) return;
    if (window.richBarPress){
      /* THE PAINT COMES OFF FIRST (14 Sep 2026): the bar's shape tools write a
         marker at the block's first text node, and a struck run's is not the
         draft's. The pull repaints; a press that moved nothing gets its marks
         back here. */
      const box = _ceQ('#ce-clausebody');
      /* The reader's selection is a LIVE range and follows the unwrap; it is
         not rebuilt (a rebuilt one once landed in a whitespace node between
         two paragraphs and the bar found no block to act on). */
      if (box) ceMarksClear(box);
      if (richBarPress(k)) cePullText({ repaint: ceBarMovesShape(k) });
      if (box && !box.querySelector(`[${CE_MARK_ATTR}]`)) ceMarksMount();
    }
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
    /* ---- AND A PRESS ON THE PENCIL MAY NOT BLUR THE BOX (15 Sep 2026) ----
       THE THIRD COSTUME OF A FAULT THIS PAGE HAS PAID FOR TWICE (30 Aug, the
       rail's foot; 11 Sep, the writing bar's row): a control that is not the
       same element on mouse-up as it was on mouse-down gets no click at all,
       and the press reads as dead.

       TRACED WITH A REAL MOUSE rather than reasoned: mousedown on the pencil,
       blur on the typing box, the paper rebuilt, mouseup on a pencil that is
       no longer the same node — and no click event between them. The blur is
       the first link in that chain, and a press on this control has no need of
       it: the pencil's own handler calls cePullText() before it does anything,
       so the box is read either way.

       preventDefault on MOUSEDOWN is what keeps focus where it is; the button
       still answers the keyboard, because Enter and Space raise a click
       without a pointer ever being involved. Narrow on purpose - this one
       control, and only where a press would move focus. */
    if (ev.target.closest('[data-ce-pencil]')) ev.preventDefault();
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
      /* ---- ON ANOTHER CLAUSE IT MOVES YOU AND STARTS EDITING, IN ONE PRESS
         (owner-ruled 1 Sep 2026) ----
         A pencil means "edit this" wherever it is, so making it mean merely "go
         there" on a clause you are not standing on would be two rules for one
         button. And with the press in the wording retired (see the note further
         down) this is the gesture that reaches another clause, so two presses
         here would be two presses for what one press does on the clause you are
         already on. The clause LIST at the top is the door that moves without
         editing. */
      if (id && id !== _ceClauseId){ ceGoClause(id, { typing: true }); return; }
      /* THE WALL BEHIND THE SIGN. The pencil is not drawn on a clause under a
         proposed deletion, so this branch is only reached where the paper is
         drawing one it should not — a stale paint, or a caller supplying its
         own markup. Refusing here is what makes "typing is not offered" a rule
         rather than a drawing decision. */
      if (ceUnderDeletion()){ ceSay(_cet('ce_under_deletion')); return; }
      cePullText();
      /* ---- THE PENCIL FILES WHEN THERE IS SOMETHING TO FILE ----
         (owner-ruled 31 Aug 2026, decision B: "click the pencil indicating you
         are done after making a redline (only if redline has been done)".)

         PRESSING IT TO STOP TYPING SAYS "I HAVE FINISHED THIS CLAUSE", and
         until now that put the reader back on a read-only page still carrying
         wording the record had never seen — work that looked filed and was
         not. So the one gesture that means "done" now means done.

         ONLY WHERE THERE IS SOMETHING TO FILE, and ceCanFile is what says so —
         the same reading the foot's own File button greys on, so a pencil that
         files where that button is dead is not a thing that can happen. On a
         clause the reader only READ, this branch does not run at all and the
         pencil is the plain toggle it has always been.

         TYPING GOES OFF AFTER THE RECORD MOVES, NOT BEFORE, and only where it
         moved: ceFile answers null on every refusal, and turning the box
         read-only over wording the funnel has just refused would hide the
         reader's own work behind a page drawing the marks of a change that
         does not exist. Where it refused, nothing moves and the refusal is
         already on screen beside the control that was pressed.

         AND FILING KEEPS TYPING ON EVERYWHERE ELSE — the 30 Aug rule is
         untouched. What this adds is the one gesture that asks for the
         opposite; the rail's File, the strip's send and the cut all still
         leave the reader writing. */
      if (_ceEditing && ceCanFile()){
        Promise.resolve(ceFile()).then(ch => {
          if (!ch) return;
          _ceEditing = false;
          ceDetachPassage(); ceRenderPaper(); ceRenderBar();
        });
        return;
      }
      /* THE PENCIL ONLY EXISTS WHILE TYPING (13 Sep 2026), so with nothing
         to file the press means "I have finished reading this clause": typing
         goes off and the marks come back. The way IN is a click in the
         wording, never this control. */
      _ceEditing = false;
      /* THE BAR FOLLOWS THE PENCIL. Its tools grey when nothing is typeable,
         so a pencil press that did not repaint it would leave the whole shelf
         dressed for the state before the press. */
      ceDetachPassage(); ceRenderPaper(); ceRenderBar();
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
      _ceTab = ['scan', 'ladder', 'figure'].includes(want) ? want : 'chat';
      ceRenderTabs(); ceRenderLane(); return; }


    const chip = hit('[data-ce-chip]');
    if (chip){ ev.preventDefault(); ceAsk(chip.getAttribute('data-ce-chip')); return; }

    const ew = hit('[data-ce-edit-with]');
    if (ew){ ev.preventDefault(); ceEditWith(_ceThread[Number(ew.getAttribute('data-ce-edit-with'))]); return; }

    const apply = hit('[data-ce-apply]');
    if (apply){ ev.preventDefault();
      const card = ceCardAt(apply.getAttribute('data-ce-apply'));
      if (!card) return;
      /* ---- A CARD REPLACES WHAT IT WAS ASKED ABOUT ----
         The passage it was asked about, if there was one, and the whole clause
         otherwise. ONE READING EITHER WAY: ceReplacePassage is the same one
         replacement the reader's own hand and the cut both go through, so a
         line break costs the same whoever wrote the wording. And it APPLIES
         rather than files, like every other card on this rail — the one act in
         the foot is still what puts it on the record. */
      /* APPLY ENDS TYPING (Young, 11 Sep 2026, late: "when I click apply on
         copilot edit, i should not have to go back and click the pencil again
         to close the edit"): wording that arrives from a card drops out of
         typing so its marks are the first thing seen — the whole-clause card's
         own rule, now the passage card's too. */
      if (card.passage) ceReplacePassage(card.passage, card.text, { keepView: false });
      else ceApply(card.text, _cet('ce_step_copilot'));
      /* WHAT THE DRAFT BECAME, so the funnel can later say whether the reader
         changed it before filing. Stamped AFTER the apply and read off the
         draft itself rather than off the card — a passage replacement puts
         Copilot's words inside a clause the reader wrote the rest of, and it is
         the filed thing the comparison has to be made against. */
      try{ if (card.trace && window.aiTraceApplied){
        aiTraceApplied(_ceC, card.trace, _ceText);
        if (window.aiTraceSave) aiTraceSave(_ceC);
      } }catch(_){}
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

    /* The preview's own opener — a class flip on the card it sits in, never a
       repaint, so a rail the reader has scrolled stays where it is. */
    const pvm = hit('[data-ce-pv]');
    if (pvm){ ev.preventDefault(); ceScanPvToggle(pvm.getAttribute('data-ce-pv')); return; }

    const scan = hit('[data-ce-scan]');
    if (scan){ ev.preventDefault();
      const parts = String(scan.getAttribute('data-ce-scan')).split(':');
      const it = ceScanItems()[Number(parts[0])];
      if (!it) return;
      const words = String((parts[1] === 'fallback' ? it.fallback
        : parts[1] === 'draft' ? it.draft
        : parts[1] === 'fit' ? (it.fit && it.fit.text) : it.preferred) || '').trim();
      if (!words) return;
      /* THE SMALLEST CHANGE GOES IN AS THE CLAUSE'S OWN MARKUP. ceRich already
         tells markup from plain lines, so handing it the fitted body is what
         keeps every OTHER block of the clause exactly as it is — rebuilt from
         lines they would all arrive as bare paragraphs and Save would file a
         formatting change across wording nobody touched. */
      /* ---- ADDRESS FIRST, SEATBELT SECOND (Young ruled 15 Sep 2026) ----
         *"why would a suggestion try and delete clauses nobody complained
         about?"* — it never meant to. THREE OF THESE FOUR VERBS CARRY A
         FRAGMENT: a paragraph with no address on it. Applied whole they
         replaced a six-part clause with one sentence, which is the clause 7
         fault in its second home — the wall built for it in September guards
         the playbook's own filing door and never guarded this one.

         SO THE ADDRESS IS READ HERE TOO. pbFitInto puts the fragment in the
         block the finding quoted — the same reading the figure path has always
         used — and every other part of the clause comes through byte for byte.
         `fit` is exempt because it already IS a fitted body; slotting a whole
         body into one block would nest the clause inside itself.

         WHERE NO ADDRESS READS the fragment still replaces the clause, and that
         is the one case the question below is for. */
      const fitInto = (parts[1] !== 'fit' && it.clauseId && window.pbFitInto)
        ? pbFitInto(it.oldHtml, it.v && it.v.quote, words) : null;
      const fitHtml = (parts[1] === 'fit' && it.fit) ? it.fit.html
        : (fitInto ? fitInto.html : null);
      /* ---- ONLY THE DRAFT IS COPILOT'S WORDING (idea 22) ----
         rlPlaybookProposals names THREE wordings on a finding and only `draft`
         is the model's: `preferred` and `fallback` are the clause library's,
         approved in this workspace and editable in Settings. So a reader who
         presses "Use our standard" has taken the COMPANY'S words, not
         Copilot's — counting that as a Copilot proposal accepted would be this
         product taking credit for its customer's own drafting.

         WHICH MAKES IT A REFUSAL, precisely and honestly: Copilot's draft was
         on the card, in front of them, and they used our own wording instead.
         Where the finding carries no draft at all Copilot proposed no wording
         here and nothing is recorded — there is no proposal to have an outcome.

         RECORDED AT THE PRESS rather than when the scan runs, and that is a
         deliberate difference from the Copilot cards above. A playbook finding
         is not a one-shot answer: it STANDS on the card until it is dealt with,
         so a reader who has not got to it yet is visible there — recording it
         here as well would count the same not-yet twice, once on a card and
         once as a statistic. */
      const _pbDraft = String((it && it.draft) || '').trim();
      let _pbTrace = null;
      if (_pbDraft && window.aiTraceNote){
        try{
          _pbTrace = aiTraceNote(_ceC, { feature: 'playbook', kind: 'wording',
            clauseId: it.clauseId || null,
            clauseLabel: it.clauseLabel || (it.v && it.v.category) || '',
            what: _pbDraft, rested: (it.v && it.v.category) || '',
            /* A new clause is filed by the press itself, so its hash has to be
               on the record before rlFilePlaybookProposal reaches the funnel. */
            hash: (parts[1] === 'draft' && !it.clauseId && window.aiTraceHash)
              ? aiTraceHash(words) : null });
          if (parts[1] !== 'draft') aiTraceRefuse(_ceC, _pbTrace, _cet('ce_trace_used_ours'));
          if (window.aiTraceSave) aiTraceSave(_ceC);
        }catch(_){ _pbTrace = null; }
      }
      /* THE VERB FOLLOWS THE FINDING, never the button that was pressed. A rule
         that located THIS clause fills the box and files nothing; a rule that
         located no clause at all has nothing here to replace, so it files a new
         clause instead. One decision, taken from the finding's own clauseId. */
      /* THE SEATBELT, and it is SECOND on purpose: with an address nothing is
         lost, pbUnquotedLoss counts zero and there is nothing to ask. The
         sentence, the title and the count are the review window's OWN keys —
         two doors describing one act in one set of words, because two doors
         that word it differently is how they come to mean different things. */
      const applyScan = async () => {
        if (!it.clauseId){ ceAddMissingClause(it, words, scan); return true; }
        if (!fitHtml && window.pbUnquotedLoss){
          let gone = 0;
          try{ gone = pbUnquotedLoss(it.oldHtml, it.v && it.v.quote, words); }catch(_){ gone = 0; }
          if (gone > 0){
            const name = (window.clauseNameShown && it.clauseLabel)
              ? clauseNameShown(it.clauseLabel) : (it.clauseLabel || _cet('ng_this_clause'));
            let ok = true;
            if (window.confirmDialog) ok = await confirmDialog({
              title: _cet('ng_pb_broad_title'),
              message: _cet('ng_pb_broad_ask', { n: gone, clause: name }),
              confirmLabel: _cet('ng_pb_broad_go') });
            if (!ok) return false;
          }
        }
        return ceApply(fitHtml || words, _cet('ce_step_playbook')) !== false;
      };
      applyScan().then(done => {
        try{ if (done && _pbTrace && it.clauseId && parts[1] === 'draft' && window.aiTraceApplied){
          aiTraceApplied(_ceC, _pbTrace, _ceText);
          if (window.aiTraceSave) aiTraceSave(_ceC);
        } }catch(_){}
      });
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

    /* ---- THE PENCIL IS THE ONLY WAY IN (owner-ruled 1 Sep 2026) ----
       *"I am reversing this ... and essentially saying only after clicking on
       the pencil can you have the ability to edit."*

       THIS REVERSES CLICK-IN-THE-WORDS-AND-TYPE, asked for on 29 Aug, and its
       reasoning is kept here because it is the useful part. A press anywhere in
       the wording turned typing on, so that a contract would behave like any
       document. WHAT IT COST is that the same press ALSO took that clause's
       redlines off the screen — you cannot type into a redline — so the gesture
       that felt like putting a cursor down was quietly the gesture that hid the
       marks, on a clause the reader had only pointed at.

       THE RULE NOW HAS ONE SHAPE: the pencil is the only thing that clears a
       clause's marks and lets it be typed in. A press in the wording does
       NOTHING AT ALL — not even move the page to that clause, which the owner
       ruled on by name: a click that silently re-points this page at another
       clause changes what the crumb says, what File would file and what Copilot
       is answering about, with nothing on screen inviting it.

       NOTHING IS LOST. Two doors still move you — the pencil on another clause
       (ONE press: it goes there AND starts editing, because a pencil means edit
       wherever it is) and the clause list at the top, which moves you without
       editing. And once typing IS on, a press inside the box places the caret:
       that is the browser's own behaviour on a text box rather than a way in,
       and it is untouched.

       `ceStartTyping` went with this branch — one definition, one caller, never
       published, so there is no door a third caller could bring it back
       through. */

    /* ---- CLICK INTO A CLAUSE AND TYPE (Young ruled 13 Sep 2026 — rule 1 of
       the layered redline) ----
       REVERSES THE PENCIL IS THE ONLY WAY IN (1 Sep 2026). It sits AFTER every
       control drawn on the paper has answered and BEFORE the strip's own acts
       (`[data-ce-act]`, whose branch returns on anything that is not one), so
       what reaches it is a press in the wording itself.

       WHAT GOT THIS GESTURE RETIRED WAS THAT IT HID THE MARKS — you cannot
       type into a redline, so the press that felt like putting a cursor down
       was the press that took a clause's marks off the screen. Rule 2 removes
       that objection: the marked reading stays above the box (ceTwinHtml /
       ceTwinPaint), so a cursor costs the reader nothing they were looking at.

       · A DRAG IS A HIGHLIGHT, not a press: the selection stands and the
         mouseup handler has already offered its verbs.
       · ANOTHER CLAUSE: the page moves there and starts typing — through
         ceGoClause, which asks before a draft is thrown away, and through the
         door, which speaks its own refusals (a colleague's lock, a clause the
         other side wants removed).
       · THIS CLAUSE: the refusal is SPOKEN where the click landed
         (ceTypingRefusal — the sentences that already exist), and a caret
         never blinks in a clause the person cannot change. Otherwise typing
         goes on and the box takes the caret.
       · ALREADY TYPING: the browser's own caret is the right answer and this
         page does not fight it; a press on the marks under the box puts the
         caret back in the box. */
    if (hit('#ce-doc') && !hit('button, a, [data-ce-pencil], [data-rl-note-open], .rl-note-mk, .rl-cp-lock, .rl-cp-pill, .rl-repl-on')){
      const sel = (typeof window.getSelection === 'function') ? window.getSelection() : null;
      if (sel && !sel.isCollapsed && String(sel).trim()) return;
      if (Date.now() - _ceMenuPickAt < CE_MENU_PICK_MS) return;
      const sec = t.closest('[data-clause]');
      const id = sec ? sec.getAttribute('data-clause') : null;
      if (!id) return;
      /* WHERE THE FINGER WENT, held for the paint that is about to happen —
         set on BOTH branches below, because both of them used to cost a second
         press (15 Sep 2026). */
      ceHoldClickPoint(ev);
      if (String(id) !== String(_ceClauseId)){ ceGoClause(id, { typing: true }); return; }
      if (ceIsTyping()){ if (hit('#ce-twin')) ceFocusTyping(); return; }
      const why = ceTypingRefusal();
      if (why){ ceSay(why); if (window.toast) toast(why, 'warn'); return; }
      /* On because nothing refused it — the wall is the line above, and the
         28 Aug rule about ARRIVAL is untouched (this is a press). */
      _ceEditing = !why;
      /* Typing in the clause is working on the clause: the rail follows it. */
      _ceWhole = false;
      ceDetachPassage(); ceRenderPaper(); ceRenderBar();
      ceFocusTyping();
      return;
    }
    const act = hit('[data-ce-act]');
    if (!act) return;
    ev.preventDefault();
    switch (act.getAttribute('data-ce-act')){
      /* THE WAY OUT ASKS FIRST. It is the last thing on the strip and the
         one control here whose whole job is stopping, so it is the door a
         reader most often reaches for with a draft still in the box. */
      case 'close': ceLeaveGuard(() => rlCloseClauseEditor()); break;
      case 'undo': ceUndo(); break;
      case 'discard': ceDiscard(); break;
      /* ONE PRESS FILES. The act keeps its name — every check and both
         browser files reach this button by it — and what changed is where it
         goes. `reason-back`, `reason-skip` and `reason-file` are STALE. */
      case 'save': cePullText(); ceFile(); break;
      case 'ladder-apply': {
        if (_ceLadderReply && _ceLadderReply.text){
          ceApply(_ceLadderReply.text, _cet('ce_step_copilot'));
          if (_ceLadderReply.note) _ceHeldNote = _ceLadderReply.note;
        }
        break; }
      case 'ladder-note': {
        if (_ceLadderReply && _ceLadderReply.note){ _ceHeldNote = _ceLadderReply.note; ceSay(_cet('ce_lc_kept')); }
        break; }
      case 'ladder-accept': {
        /* THE CARD'S OWN ACCEPT, pressed on the page behind: one door. */
        const aid = act.getAttribute('data-id');
        const btn = aid ? document.querySelector(`.redline-page [data-nego-accept="${CSS.escape(aid)}"]`) : null;
        ceLeaveGuard(() => { rlCloseClauseEditor(); if (btn) btn.click(); });
        break; }
      case 'fig-write': ceFigureWrite(); break;
      case 'ask': {
        const box = _ceQ('#ce-ask');
        if (box && box.value.trim()){ const q = box.value; box.value = ''; box.style.height = ''; ceAsk(q); }
        break;
      }
      /* THE PASSAGE'S OWN CARD IN THE RAIL CARRIES BOTH: the way to let it go,
         and the one verb that strikes it out. */
      /* THE ✕ LETS GO AND TURNS TO THE WHOLE CONTRACT (fix 5), on every card
         that carries one — the clause, the words or the question. */
      case 'scope-off': ceDetachPassage(); ceSetWhole(true); break;
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
    /* ---- AND TYPING CLOSES THE STRIP, HAVING DONE NOTHING ----
       (29 Aug 2026.) With the strip live during typing, a reader who highlights
       a sentence and then simply carries on writing has answered the question
       themselves — the passage the strip was holding is the passage they have
       just typed over. Leaving it open would leave a box offering to replace
       wording that is no longer there, and ceReplacePassage would then refuse
       in words for a reason the reader never caused.
       Guarded on there BEING one, so an ordinary keystroke costs nothing. */
    if (_ceSel) ceDetachPassage();
    ceSyncBarSteps();
    /* THE MARKS FOLLOW THE TYPING, a beat behind, the caret put back where it was. */
    ceMarksSchedule();
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
  /* ---- A STRUCK RUN IS STEPPED OVER, NEVER DELETED (14 Sep 2026) ----
     The browser would take a non-editable element whole on the Backspace
     before it; the record would put it straight back. The caret steps across
     it instead, which is what Word does and what the reader expects. */
  page.addEventListener('keydown', ev => {
    if (ev.key !== 'Backspace' && ev.key !== 'Delete') return;
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausebody')) return;
    if (ceAtomSkip(ev.key === 'Backspace' ? -1 : 1)) ev.preventDefault();
  });
  /* ---- NOTHING IS TYPED INTO A STRUCK RUN (the wall behind the step) ----
     A caret that has come to rest inside one — a click, an arrow — steps out
     to the run's end and the keystroke lands there; a deletion aimed inside
     one is refused. The run is the record's; the reader's own words go beside
     it. */
  page.addEventListener('beforeinput', ev => {
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-clausebody')) return;
    const box = _ceQ('#ce-clausebody');
    const sel = (typeof window.getSelection === 'function') ? window.getSelection() : null;
    if (!box || !sel || !sel.rangeCount || !sel.isCollapsed) return;
    const atom = ceAtomAt(sel.anchorNode);
    if (!atom || !box.contains(atom)) return;
    try{
      const r = document.createRange(); r.setStartAfter(atom); r.collapse(true);
      sel.removeAllRanges(); sel.addRange(r);
    }catch(_){ return; }
    if (/^delete/.test(String(ev.inputType || ''))){ ev.preventDefault(); return; }
    if (ev.inputType === 'insertText' && ev.data != null){
      ev.preventDefault();
      try{ document.execCommand('insertText', false, ev.data); }catch(_){}
    }
  });

  /* ---- ONE SENTENCE AT A TIME, AND IT NO LONGER WAITS ITS TURN ----
     (owner-reported 29 Aug 2026: "I am still clicking the pencil sign various
     times and I do not know for what reason ... highlight a sentence and a strip
     bar appears (which was there before but you seem to have deleted it)".)

     THIS HANDLER OPENED `if (ceIsTyping()) return;` AND THAT LINE WAS THE WHOLE
     REPORT. Typing and the highlight could not be live at once, so the pencil
     was one switch pointing at one of two jobs and NO NUMBER OF PRESSES REACHED
     BOTH. A drag means BOTH now: the browser's own selection stands and every
     tool on the writing bar still acts on it, AND the passage goes to the rail.

     THE RAIL WAITS RATHER THAN TAKING OVER, which is the promise that makes one
     gesture safe for two jobs and is the whole of what the 31 Aug ruling
     changed. It never takes the caret — nothing here focuses anything, so the
     reader carries on typing where they were, which is the fault the strip was
     reported for. The next keystroke in the clause lets the passage go, having
     done nothing (the input handler above). */
  page.addEventListener('mouseup', ev => {
    /* ---- THE DRAG HAS TO END IN THE WORDING (31 Aug 2026) ----
       This used to exclude CONTROLS and take everything else, because the strip
       was the only other thing on the page that acted on a held passage. The
       rail is now a card the reader reads, edits an ask beside, and presses —
       and a press ANYWHERE in it that is not a control (the quoted passage, the
       card's own body, a stray drag over its text) came back here a frame later
       with no selection in the clause and tore the card down under the hand
       that was using it. MEASURED as the ask box losing its passage the moment
       the reader clicked into it.

       So it asks the DOCUMENT rather than the page: a gesture that did not end
       inside the wording is not a gesture about the wording. A drag that starts
       in the clause and ends past its edge still lands, because ceSelection
       reads the SELECTION rather than the pointer — what this refuses is a
       press that never touched the paper at all. */
    const t = ev.target;
    if (!t || !t.closest || !t.closest('#ce-doc')) return;
    /* A menu pick a moment ago: this mouse-up ends THAT press, not a drag
       (see ceOfferPassage). Without it the deferred read below tears down the
       passage the verb just attached. */
    if (Date.now() - _ceMenuPickAt < CE_MENU_PICK_MS) return;
    setTimeout(() => {
      const read = ceSelectionRead();
      if (read.sel){ ceOfferPassage(read.sel); return; }
      /* ---- THE EDITOR'S PAPER OFFERS ON EVERY CLAUSE, NOT ONLY THE ONE IN
         THE BOX (Young, 11 Sep 2026, late: "when i highlight several
         sentences without click the pencil first, i do not get the drop down
         options") ---- A drag on this canvas outside the typing box is read
         exactly as the negotiation page reads its paper (rlPaperOfferFromRange,
         through window): one clause offers the three verbs and the two Copilot
         verbs MOVE this page to that clause with the words in hand (ceGoClause,
         which asks before a draft is thrown away); wider than one clause, Ask
         goes to the panel and Comment to the drawer. */
      if (!read.why && ceOfferOnPaper()) return;
      ceDetachPassage();
      /* ---- AND A REFUSAL SAYS WHY (31 Aug 2026) ----
         This branch used to do nothing at all, so a passage the product had
         decided against looked exactly like a page that had stopped working —
         and there was no way for the reader to tell which. ceSay is the page's
         one refusal line, which the writing bar, Apply and Discard already
         speak through. A plain click answers no reason and stays silent. */
      if (read.why) ceSay(_cet(read.why));
    }, 0);
  });
}
function ceOfferOnPaper(){
  if (typeof window.rlPaperOfferFromRange !== 'function' || typeof window.negoReadPassage !== 'function') return false;
  const s = (typeof window.getSelection === 'function') ? window.getSelection() : null;
  const doc = _ceQ('#ce-doc');
  if (!s || s.isCollapsed || !s.rangeCount || !doc) return false;
  const r = s.getRangeAt(0);
  const pane = doc.querySelector('.nego-doc') || doc;
  const box = _ceQ('#ce-clausebody');
  if (!pane.contains(r.commonAncestorContainer)) return false;
  if (box && box.contains(r.commonAncestorContainer)) return false;
  let rect = null;
  try{ rect = r.getBoundingClientRect(); }catch(_){ rect = null; }
  const passage = negoReadPassage(r, pane);
  /* ONE FLOOR, AND IT IS EMPTINESS — see ceSelectionRead. */
  if (!passage || !String(passage.text || '').trim().length) return false;
  ceDetachPassage();
  return !!rlPaperOfferFromRange({ c: _ceC, opts: { by: _ceOpts && _ceOpts.by }, side: 'owner',
    passage, text: passage.text, rect,
    openEditor: (id, o) => {
      /* THE PAPER'S OWN OFFER IS THE SECOND PICK DOOR (12 Sep 2026, the owner:
         "if i simply highlight without clicking on the pencil first, it
         flashes and disappears"): same mousedown pick, same mouse-up on the
         paper a moment later, same tear-down — see ceOfferPassage. */
      ceStampPick();
      if (String(id) === String(_ceClauseId)) return ceAttachWords(o && o.passage, o && o.passageMode);
      ceGoClause(id, o);
      return true;
    } });
}
/* ---- EDIT WITH THIS (owner's "Yes", 11 Sep 2026, evening) ----
   A question can become an edit without re-highlighting: the same words are
   re-attached under the 'edit' verb (found again in the box, since the rail
   may have let them go), the chips and the scope turn into the editing shape,
   and wording the model volunteered with its answer becomes a card with Apply
   — recorded as proposed only now, because only now is it offered. */
function ceEditWith(t){
  if (!clauseEditorOpen() || !t || !t.passage) return false;
  if (ceUnderDeletion()){ ceSay(_cet('ce_under_deletion')); return false; }
  const want = String(t.passage.text || '');
  if (_ceSel && _ceSel.text === want){
    _ceSel.mode = 'edit'; ceRenderScope(); ceRenderChips();
  } else if (!ceAttachWords(want, 'edit')){
    ceSay(_cet('ce_inline_moved')); return false;
  }
  if (t.held){
    let trace = null;
    try{
      if (window.aiTraceNote){
        trace = aiTraceNote(_ceC, { feature: 'redline', kind: 'wording',
          clauseId: _ceClauseId, clauseLabel: ceClauseLabel(ceClause()), what: t.held, rested: '' });
        if (window.aiTraceSave) aiTraceSave(_ceC);
      }
    }catch(_){ trace = null; }
    _ceThread.push({ who: 'ai', text: '', cards: [{ name: _cet('ce_suggestion_passage'),
      chip: _cet('ce_chip_copilot'), chipTone: 'wait', line: '', rests: '',
      text: t.held, passage: _ceSel, mode: 'edit', trace }] });
  }
  ceRenderLane();
  const box = _ceQ('#ce-ask');
  if (box){ try{ box.focus(); }catch(_){} }
  return true;
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
       and the round queue defer. TWO KINDS OF LAYER, and the second was missing
       until 3 Sep 2026: openModal draws INTO #modal-root, and confirmDialog,
       promptDialog and the note window each append an overlay of their own and
       mark it data-top-overlay — which is the product's ONE reading of "a layer
       above me owns this key" and is what openModal's own Escape asks.

       IT HAD TO GO IN WITH THE GUARD BELOW, or the guard would fight itself:
       this listener is registered at module load and a confirm's is registered
       when it opens, so THIS one runs first — Escape over the leave dialog
       would have raised a second leave dialog on top of the one being answered.
       The note dialog defers to a confirm it raises for exactly this reason. */
    const mr = document.getElementById('modal-root');
    if (mr && mr.innerHTML.trim()) return;
    if (document.querySelector('[data-top-overlay]')) return;
    if (_ceSel){ ceDetachPassage(); return; }
    ceLeaveGuard(() => rlCloseClauseEditor());
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
  ceStacksOn, ceTypingRefusal, ceMarkedHtml, ceTwinHtml, ceTwinPaint,
  clauseEditorOpen, clauseEditorClauseId, clauseEditorContract, clauseEditorDirty, ceCanFile, clauseEditorCss,
  clauseEditorLeaveAsk,
  clauseEditorHtml, clauseEditorRefusal, clauseEditorFits,
  rlOpenClauseEditor, rlCloseClauseEditor, ceAttachLoose, ceSetWhole,
  ceApply, ceUndo, ceDiscard, ceFile, ceAsk, ceRunScan, ceScanItems, ceScanGroups, ceClauseFindings, ceAddMissingClause,
  ceBoxDirty,
  ceHeldPassage, ceSelection, ceSelectionRead, ceAttachPassage, ceDetachPassage, ceOfferPassage, ceAttachWords, ceRenderScope, ceRenderChips,
  ceReplacePassage, ceCutPassage, ceRestoreScroll,
  ceClauseDeviations, cePlaybookLine,
  ceCostLine, ceWordCount, ceLines,
  ceRedlineHtml, ceCounts, ceReadList, ceRenderAll, ceRenderPaper,
  ceEditableReading, ceGoClause,
  ceFitSplit, ceWireSplit, ceStacked, ceSplit, ceSplitLeft, CE_LEFT_MIN, CE_RIGHT_MIN, CE_FMIN, CE_FMAX, CE_SPLIT_KEY,
  ceLadderCardHtml, ceLadderLaneHtml, ceFigureLaneHtml, ceFigureWrite, ceFigureTopic, ceLadderRow,
  ceMarksPaint, ceMarksClear, ceMarksOps, ceMarksMount, ceLiveTextNodes, ceCaretSave, ceCaretRestore, ceAtomSkip, ceAtomAt, ceDraftNow, CE_MARK_ATTR, CE_MARKS_MS, CE_PAINT_SEL,
});
