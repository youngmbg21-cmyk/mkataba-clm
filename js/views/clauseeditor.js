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

/* ---------- STATE ----------
   Per sitting, in memory. Nothing here is persisted: an editor that reopened
   itself on a reload would put a page over a contract nobody asked to see. */
let _ceC = null;            /* the contract */
let _ceClauseId = null;     /* which clause — null means the page is shut */
let _ceOpts = null;         /* the mount's opts, so filing carries the same author */
let _ceAgain = null;        /* the caller's repaint */
let _ceBase = '';           /* the wording AS IT STANDS (negoClauseNowById) */
let _ceText = '';           /* the wording being proposed */
let _ceSteps = [];          /* [{label, text}] — Apply stacks, Undo steps back */
let _ceStep = 0;
let _ceView = 'redlines';   /* redlines | edit */
let _ceTab = 'chat';        /* chat | scan */
let _ceThread = [];         /* the conversation, this sitting only */
let _ceBusy = false;
let _ceSavedAt = null;
let _ceScan = null;         /* the playbook review, once run */
let _ceScanBusy = false;
let _ceSayTimer = null;
let _ceReason = false;      /* is the reason step showing */
let _ceSel = null;          /* the passage being rewritten in place */
let _ceLead = null;         /* the change this editor opened on, if any */

const clauseEditorOpen = () => !!_ceClauseId;
const clauseEditorClauseId = () => _ceClauseId;
const clauseEditorContract = () => _ceC;

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
  #clause-editor{position:fixed; inset:0; z-index:55; display:flex; flex-direction:column;
    background:var(--color-bg); color:var(--color-text);
    font-family:var(--font-body, inherit)}
  #clause-editor[hidden]{display:none}
  #clause-editor *{box-sizing:border-box}
  #clause-editor button{cursor:pointer; font-family:inherit}
  #clause-editor button:disabled{cursor:default}

  /* ---- the object header: a crumb, the clause, four facts ----
     The clause name is the biggest thing on the page because the page is about
     one clause; the facts under it are what a negotiator checks before touching
     the wording, and they fold away when they are not wanted. */
  .ce-ohwrap{position:relative; flex:none}
  .ce-head{flex:none; background:var(--color-surface);
    border-bottom:1px solid var(--color-divider); padding:10px 18px 0}
  .ce-crumb{display:flex; align-items:center; gap:7px; font-size:12px;
    color:var(--color-neutral-600); flex-wrap:wrap}
  .ce-crumb button{background:none; border:0; padding:0; font:inherit; font-size:12px;
    font-weight:600; color:var(--accent-ink)}
  .ce-crumb button:hover{text-decoration:underline}
  .ce-crumb .sep{color:var(--color-neutral-500)}
  /* the reading acts must never jump to a second line: the row does not wrap,
     the clause name gives first, then the status message */
  .ce-titlerow{display:flex; align-items:center; gap:12px; margin-top:6px; flex-wrap:nowrap}
  .ce-titlerow h1{margin:0; min-width:0; font-size:22px; font-weight:700; letter-spacing:-.01em;
    color:var(--color-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis}
  .ce-titlerow .g{flex:1; min-width:8px}
  .ce-sel{flex:0 1 auto; min-width:110px; max-width:280px; height:24px; padding:0 6px;
    font:inherit; font-size:12px; font-weight:700; background:var(--color-surface);
    color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-ostat{display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:600;
    white-space:nowrap}
  .ce-ostat i{width:8px; height:8px; flex:none}
  .ce-ostat.wait{color:var(--st-amber-fg)} .ce-ostat.wait i{background:var(--st-amber-dot)}
  .ce-ostat.ok{color:var(--st-green-fg)}   .ce-ostat.ok i{background:var(--st-green-dot)}
  .ce-ostat.neu{color:var(--color-neutral-600)}
  .ce-ostat.neu i{background:var(--color-neutral-500)}
  .ce-facts{display:flex; align-items:flex-start; gap:30px; padding:11px 0 12px; flex-wrap:wrap}
  .ce-facts .k{font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--color-neutral-600)}
  .ce-facts .v{font-size:14px; font-weight:600; color:var(--color-text); margin-top:3px}
  .ce-head.is-folded .ce-facts{display:none}
  .ce-fold{position:absolute; left:50%; transform:translateX(-50%); margin-top:-1px; z-index:3;
    width:44px; height:15px; background:var(--color-surface); border:1px solid var(--color-divider);
    border-top:0; display:grid; place-items:center; color:var(--color-neutral-600); padding:0;
    font-size:9px; line-height:1}
  .ce-head.is-folded + .ce-fold{transform:translateX(-50%) rotate(180deg)}
  .ce-head .ce-acts{flex:none; display:flex; align-items:center; gap:14px}
  .ce-head .ce-acts button{background:none; border:0; padding:2px 0; font:inherit; font-size:13px;
    font-weight:600; color:var(--accent-ink)}
  .ce-head .ce-acts button:hover{text-decoration:underline}
  .ce-say{flex:0 1 auto; min-width:0; max-width:300px; font-size:12px; color:var(--accent-ink);
    font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    opacity:0; transition:opacity .2s}
  /* a faded-out message still occupied its width, which squeezed the clause
     name to an ellipsis for seconds after every Apply */
  .ce-say:not(.is-on){max-width:0; overflow:hidden}
  .ce-say.is-on{opacity:1}

  /* ---- what is on the table for this clause, as chips ---- */
  .ce-ctx{flex:none; display:flex; align-items:center; gap:7px; flex-wrap:wrap;
    padding:7px 16px; background:var(--color-bg); border-bottom:1px solid var(--color-divider)}
  .ce-chip{display:inline-flex; align-items:center; gap:6px; height:24px; padding:0 9px;
    font:inherit; font-size:12px; font-weight:600; background:var(--color-surface);
    color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-chip.is-on{border-color:var(--accent-solid); box-shadow:inset 0 -2px 0 var(--accent-solid)}
  .ce-chip i{width:7px; height:7px; flex:none; border-radius:50%;
    background:var(--color-neutral-500)}
  .ce-chip i.wait{background:var(--st-amber-dot)}
  .ce-chip i.ok{background:var(--st-green-dot)}
  .ce-chip i.no{background:var(--st-ruby-dot)}
  .ce-ctx .ce-none{font-size:12px; color:var(--color-neutral-600)}
  .ce-chip-new{color:var(--accent-ink); font-weight:700}

  /* ---- two columns from the very top of the working area ----
     The rail is exactly one third: 2fr beside 1fr. The 340px floor only bites
     on a window too narrow for a third to be usable at all. */
  .ce-grid{flex:1; min-height:0; display:grid;
    grid-template-columns:minmax(0,2fr) minmax(340px,1fr); grid-template-rows:minmax(0,1fr)}
  .ce-col{min-width:0; min-height:0; display:flex; flex-direction:column; overflow:hidden}
  .ce-rail{min-width:0; min-height:0; display:flex; flex-direction:column;
    background:var(--color-surface); border-left:1px solid var(--color-divider)}
  .ce-rail .ce-lane{flex:1; min-height:0}
  .ce-railfoot{flex:none; display:flex; align-items:center; justify-content:flex-end; gap:8px;
    padding:9px 14px; border-top:1px solid var(--color-divider); background:var(--color-surface)}
  .ce-railfoot button{height:30px; padding:0 14px; font:inherit; font-size:13px; font-weight:600;
    background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-railfoot button.p{background:var(--color-accent-700); border-color:var(--color-accent-700);
    color:#fff}
  .ce-railfoot button[disabled]{opacity:.45}

  /* the two boxes fill the column, so the foot really sits at the foot. The
     standing wording is REFERENCE and the proposed wording is where the work
     happens, so the top box takes only the height it needs — capped, so a long
     clause scrolls inside itself rather than squeezing the box below. */
  .ce-left{flex:1; min-width:0; min-height:0; display:flex; flex-direction:column;
    gap:14px; padding:14px 16px 16px}
  .ce-box{min-height:0; display:flex; flex-direction:column; background:var(--color-surface);
    border:1px solid var(--color-divider)}
  .ce-box.ce-stands{flex:0 1 auto; max-height:34%}
  .ce-box.ce-prop{flex:1 1 auto; min-height:0; position:relative}
  .ce-box .ce-bh{flex:none; display:flex; align-items:center; gap:10px; padding:8px 12px;
    border-bottom:1px solid var(--color-divider)}
  .ce-box .ce-bh .k{font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--color-neutral-600); white-space:nowrap}
  .ce-box .ce-bh .g{flex:1; min-width:4px}
  /* both boxes are white — the cream paper tint reads as a document surface,
     and on this page the wording is being WORKED on rather than read as paper */
  .ce-box .ce-bd{flex:1; min-height:0; overflow:auto; padding:14px 16px;
    background:var(--color-surface); font-size:14.5px; line-height:1.8}
  .ce-box .ce-bd:focus{outline:none; box-shadow:inset 0 0 0 2px var(--accent-solid)}
  .ce-box .ce-bd p{margin:0 0 .7em}
  .ce-box .ce-bd p:last-child{margin-bottom:0}
  .ce-box .ce-bd del{color:var(--st-ruby-fg); text-decoration:line-through}
  .ce-box .ce-bd ins{color:var(--st-green-fg); text-decoration:none; font-weight:600}
  .ce-box .ce-bd del + ins{margin-left:.3em}
  .ce-box.ce-stands .ce-bd{color:var(--color-neutral-600)}

  /* the two readings of the lower box — the product's own tab treatment */
  .ce-seg{display:flex; gap:16px}
  .ce-seg button{background:none; border:0; padding:2px 1px; font:inherit; font-size:13px;
    color:var(--color-text); border-bottom:2px solid transparent}
  .ce-seg button.is-on{font-weight:700; color:var(--accent-ink);
    border-bottom-color:var(--accent-solid)}
  .ce-stat{font-size:12px; font-weight:700; white-space:nowrap}
  .ce-stat .i{color:var(--st-green-fg)} .ce-stat .d{color:var(--st-ruby-fg)}
  .ce-stat .ce-none{color:var(--color-neutral-600); font-weight:400}

  /* ---- the foot of the left column: what is saved, and the way back ---- */
  .ce-foot{flex:none; display:flex; align-items:center; gap:10px; padding:9px 18px;
    background:var(--color-surface); border-top:1px solid var(--color-divider);
    flex-wrap:wrap; min-height:48px}
  .ce-foot .draft{font-size:12px; color:var(--color-neutral-600)}
  .ce-foot .draft b{font-weight:700; color:var(--color-text); font-variant-numeric:tabular-nums}
  .ce-foot .undo{background:none; border:0; font:inherit; font-size:12px; font-weight:700;
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
  .ce-ah .sp{display:inline-flex; align-items:center; gap:7px; font-size:13px; font-weight:700;
    color:var(--accent-ink); padding:12px 0}
  .ce-tabs{display:flex; gap:18px; margin-left:auto}
  .ce-tabs button{background:none; border:0; padding:12px 1px; font:inherit; font-size:13px;
    color:var(--color-text); border-bottom:2px solid transparent}
  .ce-tabs button.is-on{font-weight:700; color:var(--accent-ink);
    border-bottom-color:var(--accent-solid)}
  .ce-tabs .n{font-size:11px; font-weight:700; margin-left:5px; padding:1px 5px;
    background:var(--st-amber-bg); color:var(--st-amber-fg)}
  .ce-disc{flex:none; display:flex; align-items:center; gap:8px; padding:8px 14px;
    background:var(--color-surface); border-bottom:1px solid var(--color-divider);
    font-size:12px; color:var(--color-neutral-600)}
  .ce-disc b{color:var(--accent-ink); font-weight:700; flex:none}
  .ce-disc span{min-width:0}

  /* the chat is WHITE, like HaTi's own Copilot panel — a grey ground made the
     rail read as a sunken well rather than as the panel it is */
  .ce-lane{flex:1; min-height:0; overflow:auto; padding:14px; background:var(--color-surface)}
  .ce-you{display:flex; justify-content:flex-end; margin:0 0 12px}
  .ce-you span{max-width:86%; background:var(--color-accent-100); color:var(--color-text);
    padding:8px 11px; font-size:13px; line-height:1.5}
  .ce-ai{margin:0 0 16px; padding-left:11px;
    box-shadow:inset 2px 0 0 color-mix(in srgb, var(--accent-solid) 45%, transparent)}
  .ce-ai p.t{margin:0 0 11px; font-size:13px; line-height:1.6}
  .ce-ai p.t:last-child{margin-bottom:0}
  .ce-work{display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600;
    color:var(--accent-ink); margin:0 0 12px}
  .ce-work i{width:12px; height:12px; flex:none; border:2px solid currentColor;
    border-radius:50%; border-right-color:transparent; animation:cespin .9s linear infinite}
  @keyframes cespin{to{transform:rotate(360deg)}}
  @media (prefers-reduced-motion:reduce){ .ce-work i{animation:none} }

  /* what Copilot read before it answered — the facts, named, so the answer
     rests on something a reader can check */
  .ce-read{margin:0 0 16px; padding:0; display:flex; flex-direction:column; gap:8px}
  .ce-read li{list-style:none; display:flex; gap:9px; font-size:12.5px; line-height:1.5}
  .ce-read li b{flex:none; width:96px; color:var(--color-neutral-600); font-weight:700;
    font-size:11px; letter-spacing:.05em; text-transform:uppercase; padding-top:2px}
  .ce-read li span{flex:1; min-width:0}

  /* ONE CARD SHAPE, whether it comes from the chat or from the scan. On a
     white lane a white card needs its edge to do the work the ground used to
     do, so the border stays and the fill goes very slightly off-white. */
  .ce-card{background:var(--color-neutral-100); color:var(--color-text);
    border:1px solid var(--color-divider); padding:10px 11px; margin-bottom:8px}
  .ce-card .n{display:flex; align-items:center; gap:8px; font-size:13.5px; font-weight:700}
  .ce-card .n .g{flex:1; min-width:4px}
  .ce-card .chip{flex:none; font-size:10px; font-weight:700; letter-spacing:.06em;
    text-transform:uppercase; padding:2px 6px}
  .ce-card .chip.ok{background:var(--st-green-bg); color:var(--st-green-fg)}
  .ce-card .chip.no{background:var(--st-ruby-bg); color:var(--st-ruby-fg)}
  .ce-card .chip.wait{background:var(--st-amber-bg); color:var(--st-amber-fg)}
  .ce-card .l{display:block; margin-top:5px; font-size:12.5px; line-height:1.5}
  .ce-card .r{display:block; margin-top:6px; font-size:12px;
    color:var(--color-neutral-600); line-height:1.45}
  /* the wording preview is white too — the same wording is white in both boxes
     on the left, and one tinted patch left over reads as a miss */
  .ce-card .pv{display:block; margin-top:8px; padding:8px 10px; background:var(--color-surface);
    border:1px solid var(--color-divider); font-size:12.5px; line-height:1.65;
    max-height:120px; overflow:auto}
  .ce-card .pv del{color:var(--st-ruby-fg); text-decoration:line-through}
  .ce-card .pv ins{color:var(--st-green-fg); text-decoration:none; font-weight:600}
  .ce-card .av{display:flex; gap:8px; margin-top:9px; flex-wrap:wrap; align-items:center}
  .ce-card .av button{height:26px; padding:0 11px; font:inherit; font-size:12px; font-weight:600;
    background:var(--color-surface); color:var(--accent-ink); border:1px solid var(--color-divider)}
  .ce-card .av button.p{background:var(--color-accent-700); border-color:var(--color-accent-700);
    color:#fff}
  .ce-card .av button:hover{border-color:var(--accent-solid)}
  /* a thumb is a mark on ONE suggestion, so it sits on the card that made it */
  .ce-card .av .ce-vote{width:26px; padding:0; color:var(--color-neutral-600)}
  .ce-card .av .ce-vote.is-on{color:var(--accent-ink); border-color:var(--accent-solid)}
  .ce-card .av .g{flex:1; min-width:4px}

  /* the scan reads as a list of verdicts, then the same cards */
  .ce-rule{background:var(--color-surface); border:1px solid var(--color-divider);
    border-left:3px solid var(--color-divider); padding:9px 11px; margin-bottom:8px}
  .ce-rule.dev{border-left-color:var(--st-amber-dot)}
  .ce-rule.miss{border-left-color:var(--st-ruby-dot)}
  .ce-rule.ok{border-left-color:var(--st-green-dot)}
  .ce-rule .n{display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700}
  .ce-rule .l{display:block; margin-top:5px; font-size:12.5px; line-height:1.5}
  .ce-rule .r{display:block; margin-top:6px; font-size:12px;
    color:var(--color-neutral-600); line-height:1.45}
  .ce-rule .av{display:flex; gap:8px; margin-top:9px; flex-wrap:wrap}
  .ce-rule .av button{height:26px; padding:0 11px; font:inherit; font-size:12px; font-weight:600;
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
  .ce-chips button{flex:none; height:25px; padding:0 9px; font:inherit; font-size:11.5px;
    white-space:nowrap; background:var(--color-surface); color:var(--color-neutral-600);
    border:1px solid var(--color-divider)}
  .ce-chips button:hover{color:var(--color-text); border-color:var(--accent-solid)}

  /* the box you type in is a real box — three lines deep at rest, growing as
     you write and wrapping like any other text area */
  .ce-ask{flex:none; display:flex; gap:8px; padding:10px 14px;
    border-top:1px solid var(--color-divider); align-items:flex-end}
  .ce-ask textarea{flex:1; min-width:0; height:74px; min-height:74px; max-height:200px;
    padding:9px 11px; font:inherit; font-size:13px; line-height:1.5; resize:none;
    white-space:pre-wrap; overflow-wrap:break-word; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-ask textarea:focus{box-shadow:var(--focus)}
  .ce-ask button{flex:none; display:inline-grid; place-items:center; width:32px; height:32px;
    padding:0; background:var(--color-accent-700); border:1px solid var(--color-accent-700);
    color:#fff}
  .ce-ask button svg{width:17px; height:17px; display:block}
  .ce-ask button:hover{background:var(--accent-ink); border-color:var(--accent-ink)}

  /* ---- the reason is asked as a STEP, in HaTi's own words ---- */
  .ce-reason{flex:none; background:var(--color-surface); border:1px solid var(--accent-solid);
    padding:11px 12px}
  .ce-reason[hidden]{display:none}
  .ce-reason label{display:block; font-size:11px; font-weight:700; letter-spacing:.09em;
    text-transform:uppercase; color:var(--color-neutral-600); margin-bottom:7px}
  .ce-reason textarea{width:100%; min-height:52px; padding:8px 10px; font:inherit; font-size:13px;
    line-height:1.5; resize:vertical; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-reason textarea:focus{box-shadow:var(--focus)}
  .ce-reason .row{display:flex; align-items:center; gap:8px; margin-top:9px; flex-wrap:wrap}
  .ce-reason .g{flex:1; min-width:4px}
  .ce-reason .hint{font-size:12px; color:var(--color-neutral-600)}
  .ce-reason button{height:28px; padding:0 13px; font:inherit; font-size:13px; font-weight:600;
    background:var(--color-surface); color:var(--color-text); border:1px solid var(--color-divider)}
  .ce-reason button.p{background:var(--color-accent-700); border-color:var(--color-accent-700);
    color:#fff}

  /* ---- rewriting ONE passage in place ----
     Highlight a sentence in the proposed wording and a small field opens under
     it. What comes back replaces THAT passage only — the rest of the clause is
     untouched, and the redline is recomputed from the two texts as always. */
  .ce-inline{position:absolute; z-index:6; width:min(420px, calc(100% - 24px));
    background:var(--color-surface); border:1px solid var(--accent-solid);
    box-shadow:var(--shadow-md); padding:9px 10px; display:none}
  .ce-inline.is-on{display:block}
  .ce-inline .q{display:block; font-size:12px; color:var(--color-neutral-600); line-height:1.45;
    margin-bottom:8px; max-height:34px; overflow:hidden}
  .ce-inline .q b{color:var(--color-text); font-weight:600}
  .ce-inline .row{display:flex; gap:7px; align-items:flex-end}
  .ce-inline textarea{flex:1; min-width:0; min-height:30px; max-height:76px; padding:6px 9px;
    font:inherit; font-size:12.5px; line-height:1.4; resize:none; background:var(--color-surface);
    border:1px solid var(--color-divider); color:var(--color-text); outline:none}
  .ce-inline textarea:focus{box-shadow:var(--focus)}
  .ce-inline .snd{flex:none; display:inline-grid; place-items:center; width:30px; height:30px;
    padding:0; background:var(--color-accent-700); border:1px solid var(--color-accent-700);
    color:#fff}
  .ce-inline .snd svg{width:15px; height:15px; display:block}
  .ce-inline .chips{display:flex; gap:6px; flex-wrap:wrap; margin-top:8px}
  .ce-inline .chips button{height:23px; padding:0 8px; font:inherit; font-size:11.5px;
    background:var(--color-surface); color:var(--accent-ink);
    border:1px solid var(--color-divider)}
  .ce-inline .chips button:hover{border-color:var(--accent-solid)}
  .ce-inline .work{font-size:12px; color:var(--accent-ink); font-weight:600; margin-top:8px}
  .ce-inline .bad{font-size:12px; color:var(--st-ruby-fg); font-weight:600; margin-top:8px}

  .ce-empty{font-size:12.5px; color:var(--color-neutral-600); line-height:1.6}

  /* BELOW THE WIDTH WHERE TWO COLUMNS STOP MAKING SENSE the page is not
     offered at all (see clauseEditorFits) — this is the belt to that braces,
     so a window dragged narrow while the page is open stacks rather than
     crushing the rail to nothing. */
  @media (max-width:1023px){
    .ce-grid{grid-template-columns:minmax(0,1fr); grid-template-rows:auto auto}
    .ce-rail{border-left:0; border-top:1px solid var(--color-divider); min-height:320px}
    #clause-editor{overflow:auto}
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
  try{ return window.negoClauseNowById ? negoClauseNowById(_ceC, _ceClauseId) : null; }
  catch(_){ return null; }
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
  const t = String(ch.newText == null ? '' : ch.newText);
  return t || _ceBase;
}
function ceStanding(){
  const cl = ceClause();
  return String((cl && cl.text) || '').trim();
}
/* The playbook rules this clause is off, counted from the review the contract
   already holds. Never run on open: a scan costs money and a number nobody
   asked for is not worth spending it on. */
function ceScanItems(){
  const rev = _ceScan || (_ceC && _ceC.playbook) || null;
  if (!rev) return [];
  let items = [];
  try{ items = window.rlPlaybookProposals ? rlPlaybookProposals(_ceC, rev) : []; }
  catch(_){ items = []; }
  /* This clause's own rules first, then the ones that matched no clause at all
     — a standard that is MISSING from the document has no clause to sit on and
     is still the reader's business while they are writing one. */
  return items.filter(it => !it.clauseId || it.clauseId === _ceClauseId);
}
const ceDeviationCount = () => ceScanItems().filter(it => it.v && it.v.status !== 'aligned').length;

/* ---------- the redline between the two boxes ----------
   COMPUTED, never scripted, and computed by the product's own engine — the
   same redlineOps that files the marks — so whatever put the wording in the
   lower box, the marks are worked out one way. */
function ceOps(a, b){
  if (!window.redlineOps) return null;
  try{ return redlineOps(String(a == null ? '' : a), String(b == null ? '' : b)); }
  catch(_){ return null; }
}
function ceRedlineHtml(a, b){
  const ops = ceOps(a, b);
  if (!ops) return `<p>${_cee(b)}</p>`;
  try{
    if (window.redlineOpsBlocksHtml) return redlineOpsBlocksHtml(ops);
    if (window.redlineOpsHtml) return `<p>${redlineOpsHtml(ops)}</p>`;
  }catch(_){}
  return `<p>${_cee(b)}</p>`;
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
    <div class="ce-ohwrap">
      <div class="ce-head" id="ce-head">
        <div class="ce-crumb" id="ce-crumb"></div>
        <div class="ce-titlerow">
          <h1 id="ce-title"></h1>
          <span class="ce-ostat" id="ce-ostat"></span>
          <span class="g"></span>
          <span class="ce-say" id="ce-say" role="status"></span>
          <span class="ce-acts" id="ce-headacts"></span>
        </div>
        <div class="ce-facts" id="ce-facts"></div>
      </div>
      <button class="ce-fold" id="ce-fold" type="button" aria-expanded="true"
        aria-label="${_ceea(_cet('ce_fold_facts'))}">&#9652;</button>
    </div>
    <div class="ce-ctx" id="ce-ctx"></div>
        <div class="ce-left">
          <section class="ce-box ce-stands">
            <div class="ce-bh"><span class="k">${_cet('ce_as_it_stands')}</span>
              <span class="g"></span><span class="k" id="ce-stands-k"></span></div>
            <div class="ce-bd" id="ce-stands"></div>
          </section>
          <section class="ce-box ce-prop">
            <div class="ce-bh">
              <span class="k">${_cet('ce_proposed')}</span>
              <span class="g"></span>
              <span class="ce-seg" id="ce-seg" role="group"
                aria-label="${_ceea(_cet('ce_reading_group'))}">
                <button type="button" data-ce-view="redlines">${_cet('ce_view_redlines')}</button>
                <button type="button" data-ce-view="edit">${_cet('ce_view_edit')}</button>
              </span>
              <span class="ce-stat" id="ce-stat"></span>
            </div>
            <div class="ce-bd" id="ce-prop"></div>
            <div class="ce-inline" id="ce-inline">
              <span class="q" id="ce-inline-q"></span>
              <div class="row">
                <textarea id="ce-inline-ask" rows="1"
                  placeholder="${_ceea(_cet('ce_inline_ph'))}"></textarea>
                <button type="button" class="snd" data-ce-act="inline-go"
                  aria-label="${_ceea(_cet('ce_send'))}"
                  title="${_ceea(_cet('ce_send'))}">${CE_SEND_ICON}</button>
              </div>
              <div class="chips" id="ce-inline-chips"></div>
              <div id="ce-inline-note"></div>
            </div>
          </section>
          <div class="ce-reason" id="ce-reason" hidden>
            <label for="ce-why">${_cet('ng_why_this_change')}</label>
            <textarea id="ce-why" rows="2"
              placeholder="${_ceea(_cet('ng_ph_reason_example'))}"></textarea>
            <div class="row">
              <span class="hint">${_cet('ce_reason_hint')}</span>
              <span class="g"></span>
              <button type="button" data-ce-act="reason-back">${_cet('ng_back_to_wording')}</button>
              <button type="button" data-ce-act="reason-skip">${_cet('ng_skip_no_reason')}</button>
              <button type="button" class="p" data-ce-act="reason-file">${_cet('ng_file_change')}</button>
            </div>
          </div>
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
    </div>
  </div>`;
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
function rlOpenClauseEditor(c, clauseId, opts = {}){
  const refusal = clauseEditorRefusal(c, opts);
  if (refusal){ if (window.toast) toast(refusal, 'err'); return false; }
  const probeC = c, probeId = String(clauseId || '');
  if (!probeId){ if (window.toast) toast(_cet('ce_no_clause'), 'err'); return false; }
  _ceC = probeC; _ceClauseId = probeId; _ceOpts = opts || {};
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
  _ceSavedAt = _ceText !== _ceBase ? ceNowHm() : null;
  _ceView = 'redlines';
  _ceTab = opts.tab === 'scan' ? 'scan' : 'chat';
  _ceThread = []; _ceBusy = false; _ceScanBusy = false; _ceReason = false; _ceSel = null;
  _ceScan = null;

  ceEnsureStyle();
  const old = document.getElementById('clause-editor');
  if (old) old.remove();
  const holder = document.createElement('div');
  holder.innerHTML = clauseEditorHtml();
  const page = holder.firstElementChild;
  document.body.appendChild(page);
  document.body.classList.add('ce-open');
  ceWirePage(page);
  /* The greeting goes in BEFORE the first paint rather than after it — drawing
     an empty lane and then filling it is two paints for one arrival. */
  _ceThread.push({ who: 'ai', greeting: true });
  ceRenderAll();
  const back = page.querySelector('[data-ce-act="close"]');
  if (back && back.focus){ try{ back.focus({ preventScroll: true }); }catch(_){ try{ back.focus(); }catch(_e){} } }
  return true;
}

function rlCloseClauseEditor(opts = {}){
  const page = document.getElementById('clause-editor');
  if (page) page.remove();
  document.body.classList.remove('ce-open');
  const again = _ceAgain;
  _ceC = null; _ceClauseId = null; _ceOpts = null; _ceAgain = null;
  _ceThread = []; _ceSteps = []; _ceStep = 0; _ceSel = null; _ceLead = null;
  _ceBusy = false; _ceReason = false;
  clearTimeout(_ceSayTimer);
  /* A repaint only where something actually moved. Closing without filing must
     leave the page underneath exactly as it was, scroll position included. */
  if (opts.repaint && typeof again === 'function'){ try{ again(); }catch(_){} }
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
  ceRenderHead(); ceRenderBoxes(); ceRenderFoot(); ceRenderTabs(); ceRenderLane(); ceRenderChips();
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
    const name = String((_ceC && (_ceC.name || _ceC.id)) || '').trim();
    crumb.innerHTML =
      `<button type="button" data-ce-act="close">${_cet('ce_back_negotiation')}</button>`
      + `<span class="sep">&rsaquo;</span>`
      + `<span>${_cee(name)}</span>`
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
  const standsK = _ceQ('#ce-stands-k');
  if (standsK) standsK.textContent = ceClauseLabel(cl) || '';

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
  if (acts) acts.innerHTML =
    `<button type="button" data-ce-tab="scan">${_cet('ce_tab_scan')}</button>`
    + `<button type="button" data-ce-act="close">${_cet('act_close')}</button>`;

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
  if (box) box.innerHTML = facts.map(([k, v]) =>
    `<div><div class="k">${_cee(k)}</div><div class="v">${_cee(v)}</div></div>`).join('');

  const ctx = _ceQ('#ce-ctx');
  if (ctx){
    ctx.innerHTML = on.length
      ? `<span class="ce-none">${_cee(_cet('ce_on_this_clause'))}</span>` + on.map(x => {
          const tone = x.authorSide === 'counterparty' ? 'wait' : 'ok';
          return `<button type="button" class="ce-chip${
            _ceLead && _ceLead.id === x.id ? ' is-on' : ''}" data-ce-focus="${_ceea(x.id)}"><i class="${
            tone}"></i>${_cee(x.id)}</button>`;
        }).join('')
        + `<button type="button" class="ce-chip ce-chip-new${_ceLead ? '' : ' is-on'}"
            data-ce-focus="">&#43; ${_cee(_cet('ce_something_of_my_own'))}</button>`
      : `<span class="ce-none">${_cee(_cet('ce_nothing_proposed_yet'))}</span>`;
  }
}

function ceRenderBoxes(){
  if (!clauseEditorOpen()) return;
  const stands = _ceQ('#ce-stands');
  if (stands) stands.innerHTML = ceLinesHtml(_ceBase);
  const box = _ceQ('#ce-prop');
  const page = document.getElementById('clause-editor');
  if (page) page.querySelectorAll('[data-ce-view]').forEach(b =>
    b.classList.toggle('is-on', b.getAttribute('data-ce-view') === _ceView));
  if (box){
    if (_ceView === 'edit'){
      box.setAttribute('contenteditable', 'true');
      box.setAttribute('role', 'textbox');
      box.setAttribute('spellcheck', 'true');
      box.innerHTML = ceLinesHtml(_ceText);
    } else {
      box.removeAttribute('contenteditable'); box.removeAttribute('role');
      box.innerHTML = ceRedlineHtml(_ceBase, _ceText);
    }
  }
  const n = ceCounts(_ceBase, _ceText);
  const stat = _ceQ('#ce-stat');
  if (stat) stat.innerHTML = (n.ins || n.del)
    ? `<span class="i">+${n.ins}</span> <span class="d">&minus;${n.del}</span>`
    : `<span class="ce-none">${_cee(_cet('ce_no_change_yet'))}</span>`;
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
  const box = _ceQ('#ce-prop');
  if (_ceView !== 'edit' || !box) return;
  /* Block by block, so the sub-paragraph structure survives a hand edit. */
  const blocks = [...box.children].filter(el => el.tagName);
  const lines = blocks.length
    ? blocks.map(el => String(el.textContent || '').replace(/\s+/g, ' ').trim())
    : [String(box.textContent || '').replace(/\s+/g, ' ').trim()];
  const next = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (next === _ceText) return;
  ceApply(next, _cet('ce_step_typed'), { keepView: true });
}

function ceRenderFoot(){
  if (!clauseEditorOpen()) return;
  const moved = _ceText !== _ceBase;
  const draft = _ceQ('#ce-draft');
  if (draft) draft.innerHTML = moved
    ? _cet('ce_draft_saved', { at: `<b>${_cee(_ceSavedAt || ceNowHm())}</b>` })
    : _cee(_cet('ce_no_changes_yet'));
  const undo = _ceQ('#ce-undo');
  if (undo) undo.disabled = _ceStep === 0;
  const foot = _ceQ('#ce-railfoot');
  if (foot) foot.innerHTML =
    `<button type="button" data-ce-act="discard"${moved ? '' : ' disabled'}>${_cet('ce_discard')}</button>`
    + `<button type="button" class="p" data-ce-act="save"${moved ? '' : ' disabled'}>${
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
  const next = String(text);
  if (next === _ceText){ ceSay(_cet('ce_already_in_box')); return false; }
  /* The reason was written about the OLD wording — it may not travel with new
     wording nobody has read it against. */
  if (_ceReason) ceCloseReason();
  _ceSteps = _ceSteps.slice(0, _ceStep + 1);
  _ceSteps.push({ label: label || _cet('ce_step_applied'), text: next });
  _ceStep = _ceSteps.length - 1;
  _ceText = next;
  _ceSavedAt = ceNowHm();
  if (_ceView === 'edit' && !opts.keepView) _ceView = 'redlines';
  ceRenderBoxes(); ceRenderFoot(); ceRenderHead();
  if (!opts.quiet) ceSay(_cet('ce_applied'));
  return true;
}
function ceUndo(){
  if (!clauseEditorOpen()) return;
  if (_ceStep <= 0) return;
  _ceStep -= 1;
  _ceText = _ceSteps[_ceStep].text;
  if (_ceReason) ceCloseReason();
  ceRenderBoxes(); ceRenderFoot(); ceRenderHead();
  ceSay(_cet('ce_stepped_back', { label: _ceSteps[_ceStep].label }));
}
function ceDiscard(){
  if (!clauseEditorOpen()) return;
  _ceSteps = [{ label: _cet('ce_step_stands'), text: _ceBase }];
  _ceStep = 0; _ceText = _ceBase; _ceSavedAt = null;
  if (_ceReason) ceCloseReason();
  ceRenderBoxes(); ceRenderFoot(); ceRenderHead();
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
    const v = (((_ceC && _ceC.playbook) || {}).verdicts || []).filter(x => x && x.status === 'deviation');
    return v.length ? _cet('ce_pb_flags', { list: v.map(x => x.category).join(', ') }) : '';
  }catch(_){ return ''; }
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
    + `<div class="ce-rule"><div class="av"><button type="button" data-ce-act="scan-run">${
      _cet('ce_scan_run')}</button></div></div>`;
  const items = ceScanItems();
  if (!items.length) return `<p class="ce-empty">${_cee(_cet('ce_scan_clean'))}</p>`
    + `<div class="ce-rule"><div class="av"><button type="button" data-ce-act="scan-run">${
      _cet('ce_scan_again')}</button></div></div>`;
  return items.map((it, i) => {
    const v = it.v || {};
    const tone = CE_RULE_TONE[v.status] || 'dev';
    const line = window.pbVerdictLine ? String(pbVerdictLine(v)).replace(/<[^>]*>/g, '') : (v.position || '');
    const marked = it.preferred ? ceRedlineHtml(_ceText, it.preferred) : '';
    return `<div class="ce-rule ${tone}">
      <div class="n"><span>${_cee(v.category || _cet('ce_rule'))}</span></div>
      <span class="l">${_cee(line)}</span>
      ${v.quote ? `<span class="r">${_cee(_cet('ce_scan_quote', { quote: String(v.quote).slice(0, 220) }))}</span>` : ''}
      ${marked ? `<span class="pv" style="display:block;margin-top:8px;padding:8px 10px;background:var(--color-surface);border:1px solid var(--color-divider);font-size:12.5px;line-height:1.65;max-height:120px;overflow:auto">${marked}</span>` : ''}
      <div class="av">
        ${it.preferred ? `<button type="button" data-ce-scan="${i}:preferred">${_cet('ce_use_standard')}</button>` : ''}
        ${it.fallback ? `<button type="button" data-ce-scan="${i}:fallback">${_cet('ce_use_fallback')}</button>` : ''}
      </div>
    </div>`;
  }).join('');
}
async function ceRunScan(){
  if (_ceScanBusy) return;
  if (!window.runPlaybookReview){ ceSay(_cet('ce_scan_unavailable')); return; }
  _ceScanBusy = true; ceRenderLane();
  let rev = null;
  try{ rev = await runPlaybookReview(_ceC); }catch(_){ rev = null; }
  _ceScanBusy = false;
  if (!clauseEditorOpen()) return;
  if (rev) _ceScan = rev;
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
  const box = _ceQ('#ce-prop'); if (!box || typeof window.getSelection !== 'function') return null;
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
  return String(_ceText == null ? '' : _ceText).split(/\n/).map(l => l.replace(/[^\S\n]+/g, ' ').trim());
}
function ceOpenInline(sel){
  const pop = _ceQ('#ce-inline'); if (!pop || !sel) return;
  _ceSel = sel;
  const q = _ceQ('#ce-inline-q');
  if (q) q.innerHTML = _cet('ce_inline_about', {
    text: `<b>${_cee(sel.text.length > 120 ? sel.text.slice(0, 119) + '…' : sel.text)}</b>` });
  const chips = _ceQ('#ce-inline-chips');
  if (chips) chips.innerHTML = [_cet('ce_inline_shorten'), _cet('ce_inline_firmer'), _cet('ce_inline_plain')]
    .map(w => `<button type="button" data-ce-inline-chip="${_ceea(w)}">${_cee(w)}</button>`).join('');
  const note = _ceQ('#ce-inline-note'); if (note) note.innerHTML = '';
  /* POSITIONED AGAINST THE BOX IT HANGS IN, not against the scrolling area
     inside it. The popup is absolute inside .ce-box.ce-prop; measuring from
     #ce-prop — which starts under the box's own head — put it a head's height
     too high on every open. */
  const host = pop.parentElement, box = _ceQ('#ce-prop');
  if (host && box && sel.rect){
    const hb = host.getBoundingClientRect();
    const top = Math.max(6, Math.min(sel.rect.bottom - hb.top + 6, hb.height - 46));
    pop.style.top = top + 'px';
    pop.style.left = '12px';
  }
  pop.classList.add('is-on');
  const ta = _ceQ('#ce-inline-ask'); if (ta){ ta.value = ''; try{ ta.focus(); }catch(_){} }
}
function ceCloseInline(){
  const pop = _ceQ('#ce-inline'); if (pop) pop.classList.remove('is-on');
  _ceSel = null;
}
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
  /* THE REST OF THE CLAUSE IS PROVABLY UNTOUCHED: one replacement, inside the
     one line the passage was selected from, in the text we already hold. Every
     other line is carried across character for character. */
  const lines = ceLines();
  const ln = lines[sel.line];
  const at = (ln == null) ? -1 : ln.indexOf(sel.text);
  if (at < 0){
    if (note) note.innerHTML = `<p class="bad">${_cee(_cet('ce_inline_moved'))}</p>`;
    return;
  }
  lines[sel.line] = ln.slice(0, at) + wording.replace(/\s+/g, ' ').trim() + ln.slice(at + sel.text.length);
  ceCloseInline();
  ceApply(lines.join('\n'), _cet('ce_step_passage'));
}

/* ============================================================================
   FILING — HaTi'S OWN QUESTION, IN HaTi'S OWN WORDS
   ----------------------------------------------------------------------------
   Save does not file: it asks WHY first, exactly as the engine's inline editor
   does, with the same three buttons and the same wording. The reason is
   SKIPPABLE here because it is skippable everywhere else in this product — one
   page refusing what every other page permits is a second rule wearing the
   first one's clothes, and Skip is a visible button so a blank reason means
   somebody decided against giving one.

   AND IT FILES THROUGH negoEditClause AND NOTHING ELSE. Same funnel, same
   fingerprint, same desk rule, same review gate. This page has no private way
   into the contract.
   ========================================================================== */
function ceOpenReason(){
  if (_ceText === _ceBase){ ceSay(_cet('ce_nothing_to_file')); return; }
  _ceReason = true;
  const box = _ceQ('#ce-reason');
  if (box){ box.hidden = false; const ta = box.querySelector('#ce-why'); if (ta){ try{ ta.focus(); }catch(_){} } }
}
function ceCloseReason(){
  _ceReason = false;
  const box = _ceQ('#ce-reason');
  if (box) box.hidden = true;
}
async function ceFile(why){
  if (_ceBusy) return;
  if (_ceText === _ceBase){ ceSay(_cet('ce_nothing_to_file')); return; }
  const c = _ceC, clauseId = _ceClauseId;
  if (!window.negoEditClause){ if (window.toast) toast(_cet('ce_cannot_file'), 'err'); return; }
  const html = window.negoRichFromLines ? negoRichFromLines(_ceText)
    : `<p>${_cee(_ceText).replace(/\n/g, '</p><p>')}</p>`;
  const note = _cet('ce_provenance');
  _ceBusy = true;
  let ch = null, err = null;
  try{
    ch = await negoEditClause(c, clauseId, html,
      { side: 'owner', author: (_ceOpts && _ceOpts.by) || undefined,
        why: String(why || '').trim() || undefined, note });
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
  page.addEventListener('click', ev => {
    const t = ev.target;
    if (!t || !t.closest) return;
    const hit = sel => t.closest(sel);

    const view = hit('[data-ce-view]');
    if (view){ ev.preventDefault();
      cePullText();
      _ceView = view.getAttribute('data-ce-view') === 'edit' ? 'edit' : 'redlines';
      ceCloseInline(); ceRenderBoxes(); return; }

    const tab = hit('[data-ce-tab]');
    if (tab){ ev.preventDefault();
      _ceTab = tab.getAttribute('data-ce-tab') === 'scan' ? 'scan' : 'chat';
      ceRenderTabs(); ceRenderLane(); return; }

    const focus = hit('[data-ce-focus]');
    if (focus){ ev.preventDefault();
      const id = focus.getAttribute('data-ce-focus');
      _ceLead = id ? ceOnTable().find(x => x.id === id) || null : null;
      const text = ceWordingOf(_ceLead);
      ceApply(text, id || _cet('ce_step_stands'), { quiet: true });
      ceRenderHead(); return; }

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
      const words = it ? String(parts[1] === 'fallback' ? it.fallback : it.preferred || '').trim() : '';
      if (words) ceApply(words, _cet('ce_step_playbook'));
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
      case 'save': cePullText(); ceOpenReason(); break;
      case 'reason-back': ceCloseReason(); break;
      case 'reason-skip': ceCloseReason(); ceFile(''); break;
      case 'reason-file': {
        const ta = _ceQ('#ce-why');
        ceCloseReason(); ceFile(ta ? ta.value : '');
        break;
      }
      case 'ask': {
        const box = _ceQ('#ce-ask');
        if (box && box.value.trim()){ const q = box.value; box.value = ''; box.style.height = ''; ceAsk(q); }
        break;
      }
      case 'inline-go': {
        const ta = _ceQ('#ce-inline-ask');
        ceInlineGo(ta ? ta.value : '');
        break;
      }
      case 'scan-run': ceRunScan(); break;
      default: break;
    }
  });

  /* The facts fold. Title, status and acts never move — a head whose buttons
     jump when you fold it is one you stop folding. */
  const fold = page.querySelector('#ce-fold');
  if (fold) fold.addEventListener('click', () => {
    const head = page.querySelector('#ce-head'); if (!head) return;
    const now = head.classList.toggle('is-folded');
    fold.setAttribute('aria-expanded', now ? 'false' : 'true');
  });

  const which = page.querySelector('#ce-crumb');
  if (which) which.addEventListener('change', ev => {
    const sel = ev.target && ev.target.closest ? ev.target.closest('#ce-sel') : null;
    if (!sel) return;
    const c = _ceC, opts = _ceOpts;
    rlCloseClauseEditor();
    rlOpenClauseEditor(c, sel.value, opts);
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
  const inlineAsk = page.querySelector('#ce-inline-ask');
  if (inlineAsk) inlineAsk.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); ceInlineGo(inlineAsk.value); }
  });

  /* A hand edit is an Apply like any other, taken when the box loses focus —
     so the redline, the counts, the draft line and the file button all follow
     typing exactly as they follow a suggestion. */
  const prop = page.querySelector('#ce-prop');
  if (prop) prop.addEventListener('blur', () => { cePullText(); ceRenderFoot(); }, true);

  /* ONE SENTENCE AT A TIME — only in the reading, never while typing: a drag
     inside a contenteditable box is somebody selecting words to work on them. */
  page.addEventListener('mouseup', ev => {
    if (_ceView === 'edit') return;
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
    if (_ceReason){ ceCloseReason(); return; }
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
  clauseEditorOpen, clauseEditorClauseId, clauseEditorContract, clauseEditorCss,
  clauseEditorHtml, clauseEditorRefusal, clauseEditorFits,
  rlOpenClauseEditor, rlCloseClauseEditor,
  ceApply, ceUndo, ceDiscard, ceFile, ceAsk, ceRunScan, ceScanItems, ceLines,
  ceRedlineHtml, ceCounts, ceReadList, ceRenderAll,
});
