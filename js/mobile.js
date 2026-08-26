/* ============================================================================
   HaTi — THE PHONE.

   WHAT THIS FILE IS. Below 768px the desktop shell is hidden outright and this
   module draws the app instead: a bottom tab bar, a slim header, and one screen
   at a time. Above 768px it renders NOTHING — every entry point checks the
   width first — so the laptop that ships today is byte-for-byte the laptop that
   shipped yesterday.

   WHY A SECOND SHELL RATHER THAN A NARROWER FIRST ONE. The desktop shell is
   three fixed strips: a 256px sidebar, the work, and a 292px activity column,
   over a 64px header of icon buttons. There is no arrangement of those three
   strips that is worth having on a 320px screen — the earlier responsive pass
   already went as far as that idea goes, and it ends at a drawer over a page
   with no room left. So the phone gets its own arrangement over EXACTLY the
   same data.

   THE RULE THAT KEEPS BOTH HONEST. Nothing in here computes a metric, filters a
   register, decides a next action, files a change or talks to the server on its
   own. Every one of those is called out to the function the desktop already
   uses — metrics through hmDashSlices(), the register through regFiltered(),
   the next action through wsNextAction(), approvals through approvalState() and
   approveContract(). The phone is a second set of eyes on one body of logic,
   never a second body. When you find yourself about to write a rule in here,
   that is the signal it belongs upstream where both shells can read it.

   COLOUR. Every colour below is a token (--color-*, --st-*, --accent-*), never
   a literal. The design file this was drawn from writes literals; they were
   translated on the way in. That translation is what makes dark mode free: the
   tokens already know what to be under html.dark, so there is no second design
   to draw and no second set of values to keep in step. The four places where
   the design's own colour is already dark — the counterparty header, the
   passage menu, the Copilot header, the read-only watermark — are handled where
   they are written, not here.

   SIZES. Tap targets are 44px or more and body text is 14px or more, both
   enforced by the rules in M_CSS rather than remembered card by card.
   ============================================================================ */

/* One query, named once. Anything that needs to know "are we on the phone"
   asks here — a second literal 767 somewhere else is how two breakpoints end
   up half a pixel apart and nobody can say which is the real one. */
const M_QUERY = '(max-width:767px)';
function mPhone(){
  /* Guarded: this module is evaluated on the cut-down stage the node tests
     use, where matchMedia does not exist. On that stage the phone is simply
     never on, which is the right answer for a test about desktop markup. */
  try{ return !!(window.matchMedia && window.matchMedia(M_QUERY).matches); }
  catch(_){ return false; }
}

/* ---------------------------------------------------------------- STATE ----
   The phone's own bookkeeping: which screen, which tab inside the contract,
   which sheet is up. It deliberately does NOT hold a contract, a filter or a
   query — those live in `state` where the desktop keeps them, so turning the
   phone sideways onto a laptop lands on the same contract with the same
   filters still applied. */
function mS(){
  if(!state.m) state.m = { screen:'home', tab:'doc', sheet:null, hist:'all', share:'negotiate' };
  return state.m;
}

/* Which mobile screen a desktop view corresponds to. Used both ways: on the
   way in, so a session resumed on the register opens Contracts; and on the way
   out, so a phone screen with no desktop twin (Approvals, More) hands back to
   something real when the window is widened. */
const M_SCREEN_FOR_VIEW = {
  dashboard:'home', register:'contracts', folder:'contracts', workspace:'contract',
  redline:'redline', doc:'contract', reports:'more', intel:'more', calendar:'more',
  templates:'more', templatelib:'more', playbook:'more', team:'more', advice:'more',
  migration:'more', pipeline:'more', queue:'more', directory:'people',
};
const M_VIEW_FOR_SCREEN = {
  home:'dashboard', contracts:'register', contract:'workspace', redline:'redline',
  negotiations:'redline',
  approvals:'dashboard', portfolio:'reports', more:'dashboard', handoff:'dashboard',
  people:'directory',
};

/* --------------------------------------------------------------- THE MAP ---
   Everything the phone does not build. Each one keeps its door — it is listed
   under More and says, in one line, that the work is desk work. A screen with
   no door is a screen the reader assumes has been taken away; a door onto an
   honest "not here" is a screen they know where to find. */
const M_DESK = [
  { view:'intel',      get label(){ return i18t('m_insights'); },        get note(){ return i18t('m_insights_sub'); } },
  { view:'reports',    get label(){ return i18t('m_reports'); },         get note(){ return i18t('m_reports_sub'); } },
  { view:'calendar',   get label(){ return i18t('m_calendar'); },        get note(){ return i18t('m_calendar_sub'); } },
  { view:'templates',  get label(){ return i18t('m_templates'); },       get note(){ return i18t('m_templates_sub'); } },
  { view:'playbook',   get label(){ return i18t('m_our_standards'); },   get note(){ return i18t('m_standards_sub'); } },
  { view:'migration',  get label(){ return i18t('m_import_contracts'); },get note(){ return i18t('m_import_sub'); } },
  { view:'team',       get label(){ return i18t('m_settings_rules'); },get note(){ return i18t('m_settings_sub'); } },
  { view:'advice',     get label(){ return i18t('m_advice_desk'); },     get note(){ return i18t('m_advice_sub'); } },
];

/* ------------------------------------------------------------------ CSS ----
   ONE media query, injected once, and nothing in it applies above 767px. It is
   injected rather than written into index.html for one reason: a stylesheet
   that lives with the code it dresses can be read alongside it, and a mobile
   rule that leaks upward is a rule that would have to be found in a 144KB
   document instead of here.

   THE `!important` PROBLEM, STATED PLAINLY. Almost every pixel in this app is
   an inline style on the element, and an inline style beats a stylesheet.
   Overriding one from a media query therefore takes `!important` — not as a
   shortcut, but as the only mechanism available short of editing the render
   functions themselves, which is the one thing that would put the desktop at
   risk. So the phone paints over; it never rewrites. */
const M_CSS = `
@media (max-width:767px){
  /* The desktop shell leaves the page entirely. Not narrowed, not scrolled —
     gone, so nothing inside it can be reached by a stray tab stop or measured
     by something that assumes it is on screen. */
  body.m-on #app-shell{ display:none!important; }
  body.m-on #m-root{ display:flex!important; }
  /* #panel-scrim joined this list when the Activity panel became a slide-over
     and moved out of the shell: it is a body-level element now, so "hidden
     because the shell is hidden" no longer covers it. */
  body.m-on #context-panel, body.m-on #panel-scrim, body.m-on #nav-scrim, body.m-on #side-nav{ display:none!important; }
  /* The page itself never scrolls; the screen inside does. Two scrollbars on a
     phone is how a header ends up half off the top with no way back. */
  body.m-on{ overflow:hidden; overscroll-behavior:none; }

  #m-root{
    position:fixed; inset:0; z-index:20;
    flex-direction:column; min-height:0;
    background:var(--color-bg); color:var(--color-text);
    font-family:var(--font-body,Inter,system-ui,sans-serif);
  }

  /* ---- the slim header ----
     The design this was drawn from has no header at all. It could not: it is a
     prototype of a phone that is already signed in, already in one workspace
     and already in one jurisdiction. The real app is none of those things, and
     four controls have nowhere else to live — who you are, how to leave, which
     market's law and money are in force, and light or dark. The jurisdiction is
     the one that is not cosmetic: it changes the currency on every figure and
     which statute checks run, so a phone that cannot see it is a phone that
     cannot tell you it is showing you Swedish rules. */
  .m-head{
    flex:none; display:flex; align-items:center; gap:8px;
    padding:calc(env(safe-area-inset-top,0px) + 8px) 10px 8px;
    background:var(--color-surface); border-bottom:1px solid var(--color-divider);
  }
  .m-head-mark{
    width:32px; height:32px; flex:none; border-radius:0;
    background:var(--brand-grad); color:#fff; display:grid; place-items:center;
    font-weight:700; font-size:14px; font-family:var(--font-heading,inherit);
  }
  .m-head-org{ flex:1; min-width:0; font-size:15px; font-weight:600;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .m-head-btn{
    flex:none; width:44px; height:44px; border:0; background:none; cursor:pointer;
    display:grid; place-items:center; border-radius:0; color:var(--color-neutral-600);
  }
  .m-head-btn:active{ background:var(--color-neutral-100); }
  /* The theme swatch. Bigger than the desktop's, because a thumb has to hit it
     and because it is the only thing on this row carrying colour. */
  .m-theme-sw{ width:19px; height:19px; border-radius:0; display:block;
    border:1px solid rgb(0 0 0/.16); }
  html.dark .m-theme-sw{ border-color:rgb(255 255 255/.22); }

  /* ---- the screen ---- */
  .m-screen{ flex:1; min-height:0; display:flex; flex-direction:column; }
  .m-scroll{ flex:1; min-height:0; overflow-y:auto; -webkit-overflow-scrolling:touch; }
  .m-scroll::-webkit-scrollbar{ display:none; }
  /* Room at the bottom for the Copilot pill and the tab bar to float over.
     Without it the last row of every list is a row you can see and cannot
     press, which is worse than a row that is not there. */
  .m-scroll{ scrollbar-width:none; padding-bottom:64px; }
  .m-pagehead{
    flex:none; background:var(--color-surface); border-bottom:1px solid var(--color-divider);
    padding:14px 16px;
  }
  .m-eyebrow{ font-size:15px; font-weight:600; color:var(--color-neutral-600); }
  .m-title{ font-size:22px; font-weight:600; letter-spacing:-.01em; margin-top:1px;
    font-family:var(--font-heading,inherit); color:var(--color-text); }
  .m-sub{ font-size:15px; color:var(--color-neutral-600); margin-top:2px; line-height:1.45; }

  /* ---- the card, the row, the list ---- */
  .m-card{ background:var(--color-surface); border:1px solid var(--color-divider);
    border-radius:0; box-shadow:var(--shadow-sm); overflow:hidden; }
  .m-list > *{ border-bottom:1px solid var(--color-divider); }
  .m-list > *:last-child{ border-bottom:0; }
  .m-row{
    display:flex; width:100%; align-items:center; gap:12px; text-align:left;
    background:none; border:0; cursor:pointer; padding:13px 14px; min-height:48px;
    font:inherit; color:inherit;
  }
  .m-row:active{ background:var(--color-neutral-100); }
  .m-row-name{ display:block; font-size:16px; font-weight:600; line-height:1.3; color:var(--color-text); }
  .m-row-sub{ display:block; font-size:15px; color:var(--color-neutral-600); margin-top:2px; }
  .m-chev{ flex:none; color:var(--color-neutral-400); }
  .m-note{ font-size:15px; color:var(--color-neutral-600); line-height:1.55; }
  .m-lbl{ font-size:15px; font-weight:600; color:var(--color-neutral-600); }
  .m-capline{ font-size:15px; font-weight:600; color:var(--color-neutral-600);
    letter-spacing:.04em; text-transform:uppercase; }

  /* ---- buttons ---- */
  .m-btn{
    display:block; width:100%; min-height:48px; border-radius:0; cursor:pointer;
    font:inherit; font-size:16px; font-weight:600; padding:0 14px;
    background:var(--color-surface); border:1px solid var(--color-divider); color:var(--color-text);
  }
  .m-btn-primary{ background:var(--accent-fill); border-color:var(--accent-fill); color:#fff; }
  .m-btn-danger{ background:var(--danger); border-color:var(--danger); color:#fff; }
  .m-btn-quiet{ background:var(--color-bg); }
  .m-btn:disabled{ opacity:.55; cursor:default; }

  /* ---- chips that scroll sideways ----
     Statuses first, then value streams. They scroll rather than wrap because a
     wrapped chip row grows the header downward as you filter, and the list you
     are filtering walks off the bottom of the screen while you do it. */
  .m-chips{ display:flex; gap:8px; overflow-x:auto; padding:2px 16px 12px; }
  .m-chips::-webkit-scrollbar{ display:none; }
  .m-chips{ scrollbar-width:none; }
  .m-chip{
    flex:none; display:flex; align-items:center; gap:7px; height:44px; padding:0 15px;
    border-radius:0; cursor:pointer; font:inherit; font-size:15px; font-weight:600;
    white-space:nowrap; border:1px solid var(--color-divider);
    background:var(--color-surface); color:var(--color-text);
  }
  .m-chip.on{ background:var(--color-accent-900); border-color:var(--color-accent-900); color:#fff; }
  .m-chip-dot{ width:8px; height:8px; border-radius:0; flex:none; }
  /* the chip row carries three questions now — a hairline says where one
     ends and the next begins, so the line reads as groups and not as a
     stream of unrelated words */
  .m-chip-sep{ flex:none; width:1px; align-self:stretch; margin:4px 2px;
    background:var(--color-divider); }

  /* ---- the search field ---- */
  .m-search{
    display:flex; align-items:center; gap:8px; height:44px; padding:0 12px;
    border:1px solid var(--color-divider); border-radius:0; background:var(--color-bg);
  }
  .m-search input{
    flex:1; min-width:0; height:44px; border:0; outline:none; background:transparent;
    font:inherit; font-size:16px; color:var(--color-text);
  }

  /* ---- the bottom tab bar ----
     Three tabs, because three is what a thumb can reach without looking and
     because the fourth candidate — More — belongs on Home where it can carry a
     sentence of explanation each. 28px of bottom padding is the home indicator
     on a modern handset; env() takes over where the browser reports it. */
  .m-tabs{
    flex:none; display:flex; background:var(--color-surface);
    border-top:1px solid var(--color-divider);
    padding:6px 8px calc(env(safe-area-inset-bottom,0px) + 10px);
  }
  .m-tab{
    flex:1; min-height:48px; background:none; border:0; cursor:pointer; font:inherit;
    display:flex; flex-direction:column; align-items:center; gap:3px; position:relative;
    color:var(--color-neutral-600); padding:0;
  }
  .m-tab.on{ color:var(--accent-ink-700); }
  /* ---- FOUR LABELS, AND THE FOURTH WORD HAD TO GIVE ----
     The bar carried three words at 14px with room to spare. Negotiations joined
     it (12 Aug 2026) and it is the longest word in the app's navigation, so the
     row was MEASURED rather than guessed at: four labels share ~304px on a
     320px handset, "Negotiations" wants about 88 of the 76 it gets, and it runs
     into its neighbours.

     TWO THINGS COULD GIVE — the type or the word — AND THE TYPE MAY NOT. This
     bar has a standing floor of 14px (phone-verify measures every label on
     every screen against it), and it is the right rule: a navigation label
     below 14px on a handset is a label people squint at. Stepping down to 12.5
     was tried, and phone-verify refused it on Home and Contracts, which is
     exactly what that check is for.

     So the WORD gives, and only here. The door is called Negotiations
     everywhere it has the room to say so — the sidebar, the list's own heading,
     the page the phone opens onto. On this bar it is Negotiate, the way a bar
     label is always the short form of the place it opens. Nowrap and ellipsis
     stay as a backstop for a longer translation: a label that breaks onto two
     lines lifts the whole row and shunts the page above it. */
  .m-tab span{ font-size:15px; font-weight:400; max-width:100%;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .m-tab.on span{ font-weight:600; }
  /* Something is owed on a negotiation. Amber here for the same reason it is
     amber on the desktop door and on the round line: one colour means "this is
     waiting on you" across every surface in the product. */
  .m-tab-due{ color:var(--st-amber-fg); }
  .m-tab-badge{
    position:absolute; top:0; right:20%; min-width:21px; height:21px; border-radius:0;
    background:var(--danger); color:#fff; font-size:15px; font-weight:700; line-height:1;
    display:grid; place-items:center; padding:0 5px;
  }

  /* ---- sheets ----
     Everything that is a dialog on the desktop is a sheet here: it comes up
     from the bottom, it is dismissed by the scrim, and it never covers the
     whole screen so the reader keeps their place behind it. */
  .m-sheet-wrap{ position:fixed; inset:0; z-index:45; display:flex; flex-direction:column; justify-content:flex-end; }
  .m-scrim{ position:absolute; inset:0; background:color-mix(in srgb,#020617 45%,transparent); border:0; padding:0; }
  .m-sheet{
    position:relative; background:var(--color-surface); color:var(--color-text);
    border-radius:0; padding:10px 16px calc(env(safe-area-inset-bottom,0px) + 26px);
    max-height:86%; overflow-y:auto; animation:mSheetUp .25s cubic-bezier(.22,.61,.36,1);
    box-shadow:var(--shadow-lg);
  }
  .m-sheet::-webkit-scrollbar{ display:none; }
  .m-grab{ width:36px; height:4px; border-radius:0; background:var(--color-neutral-300); margin:0 auto 10px; }
  .m-sheet-title{ font-size:18px; font-weight:600; font-family:var(--font-heading,inherit); }
  .m-sheet-note{ font-size:15px; color:var(--color-neutral-600); margin:2px 0 12px; line-height:1.45; }
  @keyframes mSheetUp{ from{ transform:translateY(48px); opacity:0 } to{ transform:none; opacity:1 } }
  @keyframes mFadeIn{ from{ opacity:0 } to{ opacity:1 } }

  /* ---- inputs ----
     16px is not a style choice: below it, iOS Safari zooms the page on focus
     and never zooms back, so the reader is left on a contract they now have to
     pan sideways to read. */
  .m-input, .m-area{
    width:100%; box-sizing:border-box; border:1px solid var(--color-divider);
    border-radius:0; padding:12px; font:inherit; font-size:16px; line-height:1.5;
    background:var(--color-surface); color:var(--color-text); outline:none;
  }
  .m-input{ height:48px; padding:0 12px; }
  .m-area{ resize:none; }
  .m-err{ font-size:15px; color:var(--danger); margin-top:5px; }

  /* ---- the status pill, at phone size ---- */
  .m-pill{
    flex:none; font-size:15px; font-weight:600; padding:3px 10px; border-radius:0;
    white-space:nowrap;
  }

  /* ---- the metric tiles ----
     Two across, always. Three would fit a figure at 390px and would not fit
     its caption at 320px, and a metric whose caption is cut in half has lost
     the part that says what the number counts. */
  .m-kpi-grid{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px; }
  .m-kpi{
    text-align:left; background:var(--color-surface); border:1px solid var(--color-divider);
    border-radius:0; padding:12px 14px; cursor:pointer; font:inherit; color:inherit;
    box-shadow:var(--shadow-sm); min-height:44px;
  }
  .m-kpi-label{ display:block; font-size:15px; color:var(--color-neutral-600);
    line-height:1.3; overflow:hidden; text-overflow:ellipsis; }
  .m-kpi-val{ display:block; font-size:20px; font-weight:700; margin-top:2px; letter-spacing:-.02em; }
  .m-kpi-sub{ display:block; font-size:15px; color:var(--color-neutral-600); margin-top:1px;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .m-kpi-gear{
    flex:none; width:44px; height:44px; border:0; background:none; cursor:pointer;
    display:grid; place-items:center; border-radius:0; color:var(--color-neutral-600);
  }

  /* ---- the + button and the register row ---- */
  .m-new{
    flex:none; width:44px; height:44px; border-radius:0; border:0; cursor:pointer;
    background:var(--accent-fill); color:#fff; display:grid; place-items:center;
  }
  .m-reg-row{
    display:block; width:100%; text-align:left; background:none; border:0; cursor:pointer;
    position:relative; padding:13px 14px 13px 20px; font:inherit; color:inherit;
  }
  .m-reg-row:active{ background:var(--color-neutral-100); }
  /* The stream stripe. It is the only thing on a phone row that says which part
     of the business a contract belongs to — the desktop has a whole column for
     it and the phone has three pixels, so they are the same three colours. */
  .m-stripe{ position:absolute; left:0; top:10px; bottom:10px; width:3px; border-radius:0; }

  /* ---- the negotiations screen's group headings ----
     The desktop's three bands in the phone's own idiom: a coloured dot, the
     name, the count. Same order, same three colours, and the name and number
     ride beside the colour so the page works in grey-scale. Not a row and not
     pressable — a heading between two stacks of cards. */
  .m-ngband{ display:flex; align-items:center; gap:9px; padding:0 16px 7px; }
  .m-ngband-dot{ width:9px; height:9px; border-radius:50%; flex:none; }
  .m-ngband-k{ font-size:13px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
    color:var(--color-neutral-600); }
  .m-ngband-n{ font-family:var(--font-mono); font-size:13px; font-weight:700;
    color:var(--color-neutral-600); background:var(--color-surface);
    border:1px solid var(--color-divider); border-radius:0; padding:0 8px; }

  /* ---- the contract screen ---- */
  /* ---- A RESTING TAB IS DARK INK, NOT A CAPTION (owner-asked 23 Aug 2026) ----
     The phone's twin of .room-tab, and it carried the same fault the laptop's
     row was corrected for on 22 Aug: a resting tab rested on the LABEL shade,
     so the three you have not chosen read as captions under the one you have.
     Only the INK moves. The 15px and the 600 are this shell's own — a touch
     target is not a pointer target — and dropping the phone out of the sweep
     because its size differs is the duplication warning in its usual
     direction: a fix in a desktop rule does not reach here. */
  .m-ctab{
    flex:1; height:44px; background:none; border:0; cursor:pointer; font:inherit;
    font-size:15px; font-weight:600; color:var(--color-text);
    border-bottom:2px solid transparent;
  }
  .m-ctab.on{ color:var(--accent-ink); border-bottom-color:var(--accent-solid); }
  .m-notice{
    display:flex; align-items:center; gap:9px; margin-bottom:12px;
    border:1px solid var(--color-divider); border-radius:0; padding:11px 13px;
  }
  /* ---- THE NOTICES, FLOATING RATHER THAN BANDING THE CONTRACT ----
     Bottom-right and clear of the Copilot launcher, which sits 96px up: this
     starts above it so a thumb reaching for one never catches the other. The
     column itself takes no pointer events, so the empty space under the last
     card does not swallow taps meant for the document. */
  .m-notices{
    position:fixed; right:16px; z-index:31; pointer-events:none;
    bottom:calc(env(safe-area-inset-bottom,0px) + 160px);
    left:16px; display:flex; flex-direction:column; align-items:flex-end; gap:10px;
  }
  .m-notices .m-notice{ pointer-events:auto; margin:0; width:100%;
    background:var(--color-surface); box-shadow:0 16px 36px -14px rgba(15,23,42,.34); }
  .m-notices-fab{
    pointer-events:auto; position:relative; width:52px; height:52px; border-radius:0;
    border:1px solid var(--st-amber-line); background:var(--st-amber-bg); color:var(--st-amber-fg);
    font-size:21px; line-height:1; display:flex; align-items:center; justify-content:center;
    box-shadow:0 8px 22px -8px rgba(15,23,42,.4); cursor:pointer;
  }
  .m-notices-dot{
    position:absolute; top:-2px; right:-2px; width:13px; height:13px; border-radius:50%;
    background:var(--st-amber-dot); border:2.5px solid var(--color-bg);
  }
  /* Coloured like a control, for the same reason the desk's is — see
     .rl-notices-min. The two shells draw their own chip and must not disagree
     about whether Hide looks pressable. */
  .m-notices-min{
    pointer-events:auto; min-height:44px; border:1px solid var(--st-steel-line); border-radius:0;
    background:var(--st-steel-bg); color:var(--st-steel-fg); padding:0 16px;
    font:inherit; font-size:15px; font-weight:700; cursor:pointer;
    box-shadow:0 8px 22px -8px rgba(15,23,42,.28);
  }
  /* The stack scrolls on its own where a contract has more to say than the
     screen has room for — it must never grow past the launcher above it. */
  .m-notices-open{ max-height:60vh; overflow-y:auto; }
  /* The paper. The document keeps a reading measure and its own surface even on
     a phone — it is the thing the reader came for, and the app's chrome should
     not be mistaken for part of it. Type comes down one step from the desktop's
     measure and no further: 15px is the floor at which a contract still reads
     as a contract rather than as a caption. */
  /* The same sheet the desktop draws, on the same tokens: warm ground, warm
     hairline, the paper lift and a 14px radius. A phone reading a contract
     should be reading the same object, not a plainer one (Young, 10 Aug 2026).
     The document BODY comes from docBody, which both shells share, so the
     centred front matter and the parties' lines at the foot arrive here for
     free. */
  .m-paper{
    background:var(--color-doc-warm,var(--color-doc-surface,var(--color-surface)));
    color:var(--color-doc-text,var(--color-text));
    border:1px solid var(--color-doc-warm-line,var(--color-divider));
    border-radius:0; box-shadow:var(--shadow-paper,var(--shadow-sm));
    padding:26px 18px 32px; font-size:15px; line-height:1.7; overflow-wrap:anywhere;
  }
  /* The title block keeps its hierarchy at phone size. The KICKER is
     deliberately left alone: the desktop sets it at 10px, and the paper's
     inherit rule above lifts it to the sheet's own 15px here, which is what
     the phone's readability floor requires. Forcing the desktop's 10px back
     was the one thing this block must not do — phone-verify catches it. */
  .m-paper .rl-paper-title{ font-size:19px!important; }
  .m-paper .rl-paper-kick{ letter-spacing:.16em; }
  /* A FLOOR ON THE DOCUMENT'S TYPE, NOT A REDESIGN OF IT.
     The document body is drawn by the same renderer the desktop uses, and it
     carries a desktop's type scale — 13px paragraphs, a 10px mono kicker, 12px
     captions — written partly as utility classes and partly as inline styles.
     None of that is readable at arm's length on a phone.
     So inside the paper everything inherits the paper's own size unless it is a
     heading, and the headings are named. The hierarchy survives; the floor is
     the paper's 15px. The important flag is there because a good half of those
     sizes are inline, and an inline style cannot be reached any other way. */
  .m-paper *:not(h1):not(h2):not(h3):not(h4):not(h5):not(h6){ font-size:inherit!important; }
  .m-paper h1{ font-size:20px!important; }
  .m-paper h2{ font-size:18px!important; }
  .m-paper h3, .m-paper h4, .m-paper h5, .m-paper h6{ font-size:16px!important; }
  .m-paper pre, .m-paper code{ font-size:15px!important; }
  /* The quick-fill fields inside a generated body are the one thing in the
     paper a finger has to hit. */
  .m-paper input, .m-paper select, .m-paper textarea, .m-paper .field{
    min-height:44px!important; font-size:16px!important; box-sizing:border-box;
  }
  .m-paper table{ display:block; overflow-x:auto; max-width:100%; }
  .m-paper pre{ overflow-x:auto; }
  .m-paper img{ max-width:100%; height:auto; }
  /* Desktop panels that ride inside the document body have no room here and no
     phone equivalent — they are hidden rather than allowed to overflow. */
  .m-paper .ws-only, .m-paper [data-desk-only]{ display:none!important; }

  /* The sticky next action. It sits on the screen rather than in the scroll,
     because the one thing a person opens a contract on a phone to do should
     never be something they have to scroll to find. */
  .m-actionbar{
    flex:none; background:var(--color-surface); border-top:1px solid var(--color-divider);
    padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 16px);
  }

  /* ---- the share sheet's three purposes ---- */
  .m-share-kind{
    display:flex; width:100%; gap:11px; text-align:left; cursor:pointer; font:inherit;
    border-radius:0; padding:13px 14px; border:1.5px solid var(--color-divider);
    background:var(--color-surface); color:inherit;
  }
  .m-share-kind.on{ border-color:var(--accent-solid); background:var(--st-steel-bg); }
  .m-radio{
    width:20px; height:20px; border-radius:50%; flex:none; margin-top:2px;
    border:1.5px solid var(--color-divider); background:var(--color-surface);
    display:grid; place-items:center;
  }
  .m-share-kind.on .m-radio{ border-color:var(--accent-solid); }
  .m-radio-dot{ width:8px; height:8px; border-radius:50%; }

  /* ---- THE NEGOTIATION WORKBENCH, ON A PHONE ----
     The one screen the phone does NOT redraw. The workbench is where wording is
     argued over, and it already collapses to a single column with its index as
     a drawer — so rebuilding it would be rebuilding the one surface whose
     behaviour is the most expensive in the app to get subtly wrong.

     Instead the phone steps aside for it: the desktop shell comes back, without
     its sidebar, its header or its activity column, under a 44px bar that says
     which contract this is and how to leave. That bar is the only thing #m-root
     draws here.

     This is also what makes tap-a-sentence real — the working pane on screen is
     the working pane, with its own selection handler listening. */
  body.m-on.m-redline #app-shell{
    display:grid!important; top:44px!important;
    grid-template-columns:0 minmax(0,1fr)!important;
    grid-template-rows:0 minmax(0,1fr)!important;
  }
  /* COLLAPSED, NOT REMOVED. The header is a grid item spanning both columns,
     and the work area's ROW is auto-placed — so display:none on the header
     slides the work area up into row 1, which this rule set to 0px, and the
     whole page renders in no height at all. Found the hard way: the pane was
     laid out, reported a sane rectangle, and could not be hit-tested anywhere
     on the screen. It keeps its grid slot and gives up its pixels instead. */
  body.m-on.m-redline #top-header{
    visibility:hidden!important; height:0!important; min-height:0!important;
    padding:0!important; border:0!important; overflow:hidden!important;
  }
  body.m-on.m-redline #page-head{ display:none!important; }
  body.m-on.m-redline #body-grid{ grid-template-columns:minmax(0,1fr)!important; }
  body.m-on.m-redline #m-root{
    inset:0 0 auto 0!important; height:44px; z-index:60;
    border-bottom:1px solid var(--color-divider); background:var(--color-surface);
  }
  /* THE WORKBENCH IS A FIXED-HEIGHT PAGE, AND A PHONE IS NOT.
     Its three panes are grid ROWS once the columns collapse, so at 390px the
     page's 800 pixels went: crumbs, banners, this round's queue and the action
     bar took 740 of them as flex:none, the grid got 207, and each pane got a
     third of that — 59px of window onto a 1171px document. Measured, not
     guessed.

     So the same move the counterparty's page already makes below 1024: the page
     gives up its fixed height, the panes give up their inner scrollers, and
     ONE scroller — the shell's own — carries the lot. The document then simply
     runs down the page, which is what a phone reads well and what makes a
     sentence tappable where it is drawn. */
  body.m-on.m-redline #content-scroll{ overflow-y:auto!important; }
  body.m-on.m-redline #view-redline,
  body.m-on.m-redline #redline-host,
  body.m-on.m-redline #nego-root{ height:auto!important; min-height:0!important; flex:none!important; }
  body.m-on.m-redline .nego-work{
    display:block!important; height:auto!important; overflow:visible!important;
  }
  body.m-on.m-redline .nego-pane{ height:auto!important; min-height:0!important; }
  /* The baseline pane is already out below 1120; saying so here keeps the block
     readable rather than relying on a rule three breakpoints away. */
  body.m-on.m-redline .nego-pane.baseline, body.m-on.m-redline .nego-rz{ display:none!important; }
  body.m-on.m-redline .nego-scroll,
  body.m-on.m-redline .nego-scroll-work,
  body.m-on.m-redline .nego-index-scroll{
    overflow:visible!important; height:auto!important; max-height:none!important;
  }
  /* The index is a drawer over the page below 760. Pinned to the window rather
     than to a container that is now as tall as the whole document. */
  body.m-on.m-redline .nego-pane.index{
    position:fixed!important; top:44px!important; bottom:0!important;
    right:0!important; left:auto!important; width:min(88vw,335px)!important;
    height:auto!important; z-index:35!important;
    transform:translateX(105%);
  }
  /* Restated because the closed transform is what keeps a drawer a drawer, and
     pinning it to the window above threw away the rule that said so. */
  body.m-on.m-redline .nego-pane.index.open{ transform:none!important; }
  body.m-on.m-redline .nego-pane.index .nego-index-scroll{ overflow-y:auto!important; }
  body.m-on.m-redline .nego-doc{ font-size:15px!important; line-height:1.7; }
  body.m-on.m-redline .nego-pane.working .nego-doc{ padding-left:14px!important; }

  .m-backbar{
    flex:none; display:flex; align-items:center; gap:6px; height:44px; padding:0 4px;
  }
  .m-backbar-name{
    flex:1; min-width:0; font-size:15px; font-weight:600;
    white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
  }

  /* ---- the toast ----
     The app's toasts are pinned to the bottom-right corner, which on a phone is
     underneath the tab bar and the Copilot pill. They move above both, and span
     the width, because a confirmation nobody can read is a confirmation that
     did not happen. */
  body.m-on #toast-root{
    left:12px!important; right:12px!important;
    bottom:calc(env(safe-area-inset-bottom,0px) + 158px)!important;
    display:flex; flex-direction:column; align-items:center; pointer-events:none;
  }
  body.m-on #toast-root > *{ max-width:100%; font-size:15px!important; }

  /* ---- the desk handoff ---- */
  .m-handoff{ margin:16px; padding:22px 18px; text-align:center; }
  .m-handoff-ic{
    width:48px; height:48px; border-radius:50%; margin:0 auto 12px; display:grid; place-items:center;
    background:var(--tile-steel-bg); color:var(--tile-steel-fg);
  }
}`;

let _mCssDone = false;
function mInjectCss(){
  if(_mCssDone) return;
  if(typeof document==='undefined' || !document.head || !document.createElement) return;
  const el = document.createElement('style');
  el.id = 'm-css';
  el.textContent = M_CSS;
  document.head.appendChild(el);
  /* THE SHEET'S OWN RULES COME FROM ONE PLACE. The phone draws the document
     with docBody, the same builder the desktop uses, so the front matter
     (.rl-paper-head) and the parties' lines at the foot (.rl-paper-foot)
     arrive here as markup — and without this call they would arrive unstyled,
     as a stack of bare text where a title block should be. Idempotent, and it
     is loaded AFTER M_CSS so the phone's own type floor still wins. */
  if (window.redlineLayoutCss) redlineLayoutCss();
  _mCssDone = true;
}

/* ------------------------------------------------------------- FRAGMENTS ---
   Small pieces used by more than one screen. They take data and return markup;
   none of them decides anything. */

const mEsc = s => (typeof esc==='function' ? esc(s) : String(s==null?'':s));

/* The chevron every forward-going row carries. */
const M_CHEV = `<svg class="m-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;

/* The status pill, reading its colours from the same STATUS_META the desktop
   chip reads — so a contract badged amber on a laptop is amber on a phone, and
   a change to that table moves both.

   ---- AND THE THREE DISPLAY OVERLAYS CARRY THEIR OWN META, AS THE DESKTOP'S DO ----
   contractStage answers 'Partially signed', 'Expired' or 'Ready to sign' before
   it ever reaches the stored status, and NONE of those three is a key in
   STATUS_META — that table holds Draft, Under Review, Signed and Declined and
   nothing else. So the lookup missed and the defensive `|| STATUS_META[c.status]`
   fallback threw the correct stage away and read the raw status instead.
   MEASURED side by side on one record: stage 'Partially signed', desktop
   "Partially signed", phone "EXECUTED" — the phone telling a reader a deal is
   done while it waits on the counterparty's signature. The same fallback hit an
   expired contract and the ready-to-sign signal.
   contractStatusChip escapes it by naming PARTIAL_META / EXPIRED_META /
   READY_META_SHORT explicitly; this now reads the same three, so one change to
   any of them still moves both shells. The fallback to the RAW STATUS is gone:
   an unknown stage takes the neutral grey rather than borrowing another
   stage's word. */
const M_STAGE_META = () => ({
  'Partially signed': (typeof PARTIAL_META!=='undefined') && PARTIAL_META,
  'Expired':          (typeof EXPIRED_META!=='undefined') && EXPIRED_META,
  'Ready to sign':    (typeof READY_META_SHORT!=='undefined') && READY_META_SHORT,
});
function mPill(c){
  const st = (typeof contractStage==='function' && contractStage(c)) || (c && c.status) || 'Draft';
  const meta = M_STAGE_META()[st]
    || ((typeof STATUS_META==='object' && STATUS_META[st]) || null);
  const label = meta ? meta.label : (typeof statusLabel==='function' ? statusLabel(st) : st);
  const bg = meta ? meta.bg : 'var(--st-gray-bg)';
  const tx = meta ? meta.tx : 'var(--st-gray-fg)';
  return `<span class="m-pill" style="background:${bg};color:${tx}">${mEsc(label)}</span>`;
}

/* Money, the way the rest of the app says it — including saying nothing when
   the reader has no right to see values at all. */
function mMoney(c){
  if(typeof isMonetary==='function' && !isMonetary(c)) return 'Non-monetary';
  if(typeof canViewValues==='function' && !canViewValues()) return '';
  const v = Number((c&&c.value)||0);
  if(!v) return '—';
  /* ---- THE SHARED COMPACT FORMATTER, NOT A SECOND ARITHMETIC ----
     W2-1's rule is right — the row states the CONTRACT's own currency and only
     the dashboards convert — and this file was carrying its own copy of it,
     which had already drifted: a foreign amount printed in FULL here
     ("EUR 4,800,000") where fmtMoneyShortOf prints "EUR 4.8M", so the phone
     and the laptop disagreed about one number and the long form did not fit a
     320px row besides. fmtMoneyShortOf is the compact twin built for exactly
     this and it answers for both cases, home and foreign, in one call. */
  if(typeof fmtMoneyShortOf==='function') return fmtMoneyShortOf(c);
  return typeof fmtMoneyShort==='function' ? fmtMoneyShort(v) : String(v);
}

/* When a contract's term ends, in the compact form a 320px row can hold. */
function mExpiry(c){
  const e = (typeof effectiveExpiry==='function') ? effectiveExpiry(c) : (c&&c.expiry);
  if(!e) return '—';
  const d = (typeof daysUntil==='function') ? daysUntil(e) : null;
  const when = new Date(e+'T00:00:00');
  const nice = isNaN(when.getTime()) ? String(e)
    : when.toLocaleDateString(langLocale(),{day:'2-digit',month:'short',year:'numeric'});
  if(d==null) return i18t('m_exp_on',{when:nice});
  if(d<0) return i18t('m_ended_on',{when:nice});
  return i18t('m_exp_on',{when:nice});
}

/* -------------------------------------------------------------- THE HEAD ---*/
function mHeadHtml(){
  const org = (typeof getOrg==='function' && getOrg()) || null;
  const name = (org && org.name) || (typeof FIRST_PARTY!=='undefined' && FIRST_PARTY) || 'HaTi';
  /* ---- THE PHONE SHOWS THE THEME, IT DOES NOT PROMISE NIGHT ----
     There are three themes now, so a moon that means "make it dark" is the
     control lying about itself on the one screen with no room to explain. The
     button is a swatch of the theme you are wearing and pressing it steps to
     the next — the same three, in the same order, as the menu on the desktop.
     Same function underneath (toggleTheme), so the two shells cannot drift. */
  const themeNow = (typeof window.themeNow === 'function') ? window.themeNow() : 'green';
  const M_THEME_SWATCH = {
    green:'linear-gradient(135deg,#0d9488,#06b6d4)',
    navy:'linear-gradient(135deg,#24488f,#3f7ac4)',
    dark:'linear-gradient(135deg,#1e293b,#0f172a)',
  };
  const themeLabel = { green:'Green', navy:'Navy', dark:'Dark' }[themeNow] || 'Green';
  const initials = String(name).trim().split(/\s+/).slice(0,2).map(w=>w[0]||'').join('').toUpperCase() || 'HT';
  return `
    <div class="m-head">
      <div class="m-head-mark">${mEsc(initials)}</div>
      <div class="m-head-org">${mEsc(name)}</div>
      <button class="m-head-btn" data-m-act="theme" aria-label="Theme — ${themeLabel}. Tap for the next one">
        <span class="m-theme-sw" style="background:${M_THEME_SWATCH[themeNow]}"></span>
      </button>
      <button class="m-head-btn" data-m-act="account" aria-label="${i18t('m_account_and_jx')}">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>
      </button>
    </div>`;
}

/* The account sheet: who you are, which jurisdiction is in force, and the way
   out. Three things with nowhere else to live on a phone. */
function mAccountSheetHtml(){
  const u = (typeof currentUser==='function' && currentUser()) || null;
  const code = (state && state.region) || 'KE';
  /* THE MARKET IS THE COMPANY'S, AND ONLY AN ADMIN MOVES IT — the same rule the
     Settings screen enforces on a laptop, and the same rule the server already
     enforces on PUT /api/org/jurisdiction. It was missed here when the market
     moved off the top bar: for a while a member who could not change the
     currency, the governing law or the risk checks from a desktop could change
     all three from a phone. A non-admin is SHOWN which market is in force,
     because that is worth knowing; they simply cannot press it. */
  const maySetMarket = (typeof isAdmin!=='function') || isAdmin();
  const tick = `<span style="flex:none;color:var(--accent-solid)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>`;
  const rows = Object.keys((typeof REGIONS==='object' && REGIONS) || {})
    .filter(k=>maySetMarket||k===code)
    .map(k=>{
      const on = k===code;
      const name = `<span class="m-row-name" style="font-weight:${on?600:500}">${mEsc(REGIONS[k].label)}</span>`;
      if(!maySetMarket) return `<div class="m-row"><span style="flex:1;min-width:0">${name}</span>${tick}</div>`;
      return `<button class="m-row" data-m-region="${k}">
        <span style="flex:1;min-width:0">${name}</span>
        ${on?tick:''}
      </button>`;
    }).join('');
  return `
    <div class="m-grab"></div>
    <div class="m-sheet-title">${mEsc((u&&u.name)||'Signed in')}</div>
    <div class="m-sheet-note">${mEsc((typeof roleName==='function'&&u?roleName(u.role):(u&&u.role))||'')}${u&&u.email?' · '+mEsc(u.email):''}</div>
    ${''/* LANGUAGE FIRST, and on the phone this is the ONLY place it lives:
           below 768 the desktop shell is hidden outright and this shell draws
           the app, so the toggle in the desktop header does not exist here at
           all. Without this row a phone user could not change language. */}
    <div class="m-capline" style="margin-bottom:6px">${i18t('m_language')}</div>
    <div class="m-card m-list">${(typeof langList==='function'?langList():[]).map(l=>{
      const on = typeof langId==='function' && langId()===l.id;
      return `<button class="m-row" data-m-lang="${l.id}">
        <span style="flex:1;min-width:0"><span class="m-row-name" style="font-weight:${on?600:500}">${mEsc(l.name)}</span></span>
        ${on?`<span style="flex:none;color:var(--accent-solid)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>`:''}
      </button>`;}).join('')}</div>
    <div class="m-note" style="margin-top:8px">${i18t('m_language_sub')}</div>

    <div class="m-capline" style="margin:14px 0 6px">${i18t('m_jurisdiction')}</div>
    <div class="m-card m-list">${rows}</div>
    <div class="m-note" style="margin-top:8px">${maySetMarket?i18t('m_jx_sub'):i18t('set_market_admin_only')}</div>

    ${''/* ---- THE REST OF "YOUR ACCOUNT", ON THE PHONE ----
           Settings & Rules is admin-only from the Aug 2026 redesign, and this
           sheet is the phone's only account surface — so everything a
           non-admin used to be able to do on that page has to be reachable
           from here or it is simply gone below 768px. The laptop's own
           account drawer is the twin; the rows are the same rows and the
           writers are the same writers. */}
    <div class="m-capline" style="margin:14px 0 6px">${i18t('st_acct_job')}</div>
    <div class="m-card" style="padding:12px">
      <input id="m-acct-title" type="text" value="${mEsc((u&&u.title)||'')}"
        placeholder="${mEsc(i18t('st_f_title'))}"
        style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:10px 12px;font:inherit;font-size:15px;color:inherit;outline:none"/>
      <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="acct-title">${i18t('act_save')}</button>
      <div class="m-note" style="margin-top:6px">${i18t('st_acct_job_sub')}</div>
    </div>

    <div class="m-capline" style="margin:14px 0 6px">${i18t('st_acct_sidebar')}</div>
    <div class="m-card m-list">
      <button class="m-row" data-m-act="acct-nav-all">
        <span style="flex:1;min-width:0"><span class="m-row-name">${i18t('set_show_everything')}</span>
        <span class="m-row-sub">${i18t('set_full_cockpit')}</span></span>
        ${(typeof navShowEverything==='function'&&navShowEverything())?tick:''}
      </button>
    </div>

    ${(typeof API_MODE==='function'&&API_MODE())?`
    <div class="m-capline" style="margin:14px 0 6px">${i18t('st_acct_sessions')}</div>
    <div class="m-card" style="padding:12px"><div id="sessions-list" class="m-note">${i18t('set_loading')}</div></div>

    ${''/* The honest read-only statement, kept exactly as it is on the laptop.
           The checkboxes it replaced were wired to nothing. */}
    <div class="m-capline" style="margin:14px 0 6px">${i18t('st_acct_email')}</div>
    <div class="m-card" style="padding:12px">
      <div style="font-size:14px;font-weight:600">${i18t('set_still_emailed')}</div>
      <div class="m-note" style="margin-top:4px">${i18t('set_three_events')}</div>
    </div>`:''}

    <button class="m-btn m-btn-quiet" style="margin-top:14px" data-m-act="acct-backup">${i18t('set_export_backup')}</button>
    <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="logout">${i18t('m_log_out')}</button>
    <button class="m-btn m-btn-quiet" style="margin-top:8px" data-m-act="close-sheet">${i18t('act_close')}</button>`;
}

/* -------------------------------------------------------------- TAB BAR ----*/
function mTabsHtml(){
  const s = mS();
  const on = k => s.screen===k ? ' on' : '';
  const n = mApprovalItems().length;
  /* Guarded: the phone's tests evaluate this file without the negotiation view
     loaded, and a bar that throws takes every screen with it. */
  const nn = (window.negoNeedsYouTotal ? (()=>{ try{ return negoNeedsYouTotal(); }catch(_){ return 0; } })() : 0);
  return `
    <div class="m-tabs">
      <button class="m-tab${on('home')}" data-m-tab="home">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        <span>${i18t('m_home')}</span>
      </button>
      <button class="m-tab${on('contracts')}" data-m-tab="contracts">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        <span>${i18t('m_contracts')}</span>
      </button>
      ${''/* NEGOTIATIONS, THE SAME WAY THE DESKTOP GOT IT (12 Aug 2026). Half
             of this design was already true here: Negotiate was never one of the
             phone's contract tabs, and the workbench already opens as its own
             screen under a back bar. The missing half was a door — the only way
             into a negotiation on a phone was to find the agreement first.

             It is a screen you go TO, so it keeps its own way back and is not in
             the `tabbed` list below; pressing it runs the same reopen-the-last
             door the sidebar does. The count is negoNeedsYouTotal, the same
             number the desktop's door shows. */}
      <button class="m-tab${on('negotiations')}${nn?' m-tab-due':''}" data-m-tab="negotiations">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.15" aria-hidden="true"><use href="#i-nego"/></svg>
        <span>${i18t('m_negotiations')}</span>
        ${nn?`<span class="m-tab-badge">${nn>99?'99+':nn}</span>`:''}
      </button>
      <button class="m-tab${on('approvals')}" data-m-tab="approvals">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.15" aria-hidden="true"><use href="#i-shield"/></svg>
        <span>${i18t('m_approvals')}</span>
        ${n?`<span class="m-tab-badge">${n>99?'99+':n}</span>`:''}
      </button>
    </div>`;
}

/* --------------------------------------------------------------- SCREENS ---*/

/* MORE — every door the phone does not open itself, and the one it does.
   PEOPLE IS FIRST AND IT IS NOT A HANDOFF. Everything else in this list ends
   at "open on a computer", because the work behind it is desk work. A staff
   directory is not: it is four facts a row, it is exactly what you want on a
   phone when you are trying to reach somebody, and the phone already holds the
   roster. So it gets its own screen and its row carries a › rather than the
   computer word — a row that promises a page and delivers a refusal is the
   fault this whole list was built to avoid. */
function mMoreHtml(){
  const desk = M_DESK.map(d=>`
    <button class="m-row" data-m-desk="${d.view}">
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${mEsc(d.label)}</span>
        <span class="m-row-sub">${mEsc(d.note)}</span>
      </span>
      <span style="flex:none;font-size:15px;color:var(--color-neutral-600)">${i18t('m_computer')}</span>
    </button>`).join('');
  const people = `
    <button class="m-row" data-m-go="people">
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${mEsc(i18t('nav_people'))}</span>
        <span class="m-row-sub">${mEsc(i18t('pg_people_sub'))}</span>
      </span>
      <span style="flex:none;font-size:16px;color:var(--color-neutral-500)">›</span>
    </button>`;
  return `
    <div class="m-pagehead">
      <div class="m-title">${i18t('m_more')}</div>
      <div class="m-sub">${i18t('m_rest_of_hati')}</div>
    </div>
    <div class="m-scroll">
      <div class="m-card m-list" style="margin:16px">${people}${desk}</div>
      <div class="m-note" style="margin:0 16px 24px">${i18t('m_nothing_missing')}</div>
    </div>`;
}

/* PEOPLE — the same roster the laptop draws, in the phone's own row shape.
   It DECIDES NOTHING of its own: dirPeople is the desktop's ordering, so the
   two shells cannot disagree about who is on the list or in what order —
   exactly as Contracts and Negotiations already work. What differs is the row.
   Nothing here can carry folder access, a signing limit or a review flag,
   because none of it is in a non-admin's browser at all. */
function mPeopleHtml(){
  const me = (typeof currentUser==='function' ? currentUser() : null) || {};
  const people = (typeof dirPeople==='function') ? dirPeople() : [];
  const rows = people.map(u=>{
    const mail = String(u.email||'').trim();
    const ini = String(u.name||mail||'?').split(' ').filter(Boolean).map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const role = (typeof roleName==='function') ? roleName(u.role) : (u.role||'');
    /* ---- AN ABSENCE SAYS THE SAME THING ON BOTH SHELLS ----
       The phone used to fold the title and the role into one line and fall back
       to "No job title on file" only when BOTH were empty — which never
       happens, because everybody has a role. So somebody with no title read as
       plain "Editor" here and as "No job title on file" on the laptop: two
       screens describing one person differently. The title half now carries its
       own absence, in the same words and the same grey, and the role still
       follows it. Same for the address, which the phone simply omitted. */
    const title = u.title
      ? mEsc(u.title)
      : `<span class="dir-none">${mEsc(i18t('dir_no_title'))}</span>`;
    return `<div class="m-row" data-m-person="${mEsc(u.id||'')}">
      <span class="dir-av" style="margin-right:10px">${mEsc(ini)}</span>
      <span style="flex:1;min-width:0">
        <span class="m-row-name" style="font-weight:400">${mEsc(u.name||mail||'—')}${
          u.id&&u.id===me.id?` <span style="font-weight:400;color:var(--color-neutral-500)">${mEsc(i18t('set_you'))}</span>`:''}</span>
        <span class="m-row-sub">${title}${role?' · '+mEsc(role):''}</span>
        <span class="m-row-sub">${mail
          ? `<a href="mailto:${mEsc(mail)}" style="color:var(--accent-ink-700)">${mEsc(mail)}</a>`
          : `<span class="dir-none">${mEsc(i18t('dir_no_email'))}</span>`}</span>
      </span>
    </div>`;
  }).join('');
  return `
    <div class="m-pagehead" style="display:flex;align-items:center;gap:4px;padding:8px 8px">
      <button class="m-head-btn" data-m-act="back" aria-label="${i18t('m_back')}" style="color:var(--accent-ink-700)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <div style="font-size:19px;font-weight:600;font-family:var(--font-heading,inherit)">${i18t('nav_people')}</div>
    </div>
    <div class="m-scroll">
      <div class="m-card m-list" style="margin:16px">${rows||`<div class="m-row"><span class="m-row-sub">${mEsc(i18t('dir_empty'))}</span></div>`}</div>
      <div class="m-note" style="margin:0 16px 24px">${mEsc(i18t('dir_note'))}</div>
    </div>`;
}

/* THE HANDOFF — one desk screen, named, with the one line that says why. */
function mHandoffHtml(){
  const d = M_DESK.find(x=>x.view===mS().deskView) || { get label(){ return i18t('m_this_screen'); }, note:'' };
  return `
    <div class="m-pagehead" style="display:flex;align-items:center;gap:4px;padding:8px 8px">
      <button class="m-head-btn" data-m-act="back" aria-label="${i18t('m_back')}" style="color:var(--accent-ink-700)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <div style="font-size:19px;font-weight:600;font-family:var(--font-heading,inherit)">${mEsc(d.label)}</div>
    </div>
    <div class="m-scroll">
      <div class="m-card m-handoff">
        <div class="m-handoff-ic">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
        </div>
        <div style="font-size:18px;font-weight:600">${i18t('m_open_on_computer')}</div>
        <div class="m-note" style="margin-top:6px">${mEsc(d.note)}</div>
      </div>
    </div>`;
}

/* ----------------------------------------------------------- THE PAINTER ---
   One function draws the whole phone. It is cheap — the screens are small and
   the data is already in memory — and a single paint means there is exactly one
   place where what is on screen is decided. */
function mRender(){
  if(!mPhone()) return;
  const root = document.getElementById('m-root');
  if(!root) return;
  const s = mS();

  /* ---- WHICH PAGE THE SHARED REGISTER IS ANSWERING FOR ----
     Contracts and Negotiations are the same filtered set on both shells (see
     regSetScope in js/views/register.js), and regFiltered reads a module flag
     rather than an argument — so the phone has to say which screen it is
     drawing BEFORE anything asks. Set here, in the one paint, rather than in
     each screen builder: a builder that forgot would inherit the last screen's
     scope and quietly draw the wrong book. */
  if(typeof window.regSetScope==='function')
    window.regSetScope(s.screen==='negotiations' ? 'negotiations' : null);

  /* The workbench keeps the desktop shell and takes the screen; the phone
     gives it back and draws only the bar above it. */
  const onRedline = s.screen==='redline';
  if(document.body && document.body.classList) document.body.classList.toggle('m-redline', onRedline);
  if(onRedline){
    const c = (state.activeId && typeof getContract==='function') ? getContract(state.activeId) : null;
    root.innerHTML = `<div class="m-backbar">
      <button class="m-head-btn" data-m-act="leave-redline" aria-label="${i18t('m_back_to_contract')}" style="color:var(--accent-ink-700)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      </button>
      <span class="m-backbar-name">${mEsc(c ? (c.name||c.id) : 'Negotiation')}</span>
      <button class="m-head-btn" data-m-act="copilot-open" aria-label="${i18t('m_open_copilot')}" style="color:var(--accent-ink-700);position:relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.6 4.6 4.6 1.6-4.6 1.6L12 15l-1.6-4.7L5.8 8.7l4.6-1.6L12 2.5z"/></svg>
        <span data-ai-badge class="ai-badge-dot hidden" style="position:absolute;top:6px;right:6px;width:10px;height:10px;border-radius:50%;background:var(--st-amber-dot)"></span>
      </button>
    </div>`;
    mWire();
    /* --view-h is the height of the scroll container, measured once and read by
       every view that sizes itself to the window — the workbench included. It
       was last measured while the shell was DISPLAY:NONE, so it is 0, and a
       workbench sized to 0 renders its whole document inside 24 pixels with
       overflow:visible: laid out, reporting sane rectangles, and not on screen
       anywhere. Re-measured now that the shell is back, on the next frame so
       the grid has been through layout first. */
    const remeasure = ()=>{ try{ if(window.syncViewHeight) syncViewHeight(); }catch(_){} };
    if(typeof requestAnimationFrame==='function') requestAnimationFrame(remeasure); else remeasure();
    return;
  }

  let body = '';
  if(s.screen==='contract')       body = mContractHtml();
  else if(s.screen==='contracts') body = mContractsHtml();
  else if(s.screen==='approvals') body = mApprovalsHtml();
  else if(s.screen==='portfolio') body = mPortfolioHtml();
  else if(s.screen==='more')      body = mMoreHtml();
  else if(s.screen==='people')    body = mPeopleHtml();
  else if(s.screen==='handoff')   body = mHandoffHtml();
  /* ---- THE NEGOTIATIONS SCREEN IS PHONE-SHAPED NOW ----
     It used to be the desktop's own builder drawn into this screen unchanged,
     which was right while that builder was a column of rows. It is the
     CONTRACTS TABLE now (12 Aug 2026) — eight columns, a filter bar and a
     footer — and a wide table on a 390px handset is not a list, it is a
     horizontal scroll. So the phone draws its own row shape, exactly as it
     already does for Contracts, over the same filtered set, the same three
     bands in the same order and the same pill. mNegotiationsHtml computes
     nothing of its own: regFiltered, NEGO_BANDS and negoMovePillHtml are the
     desktop's, so the two shells cannot disagree about a row. */
  else if(s.screen==='negotiations') body = (typeof mNegotiationsHtml==='function') ? mNegotiationsHtml() : '';
  else                            body = mHomeHtml();

  /* The tab bar shows on the tabbed screens only. A contract, a sheet route or
     a handoff is somewhere you went TO, and it keeps its own way back — a tab
     bar under it would offer two different backs at once. The negotiations LIST
     is a tabbed screen (it is the door's own landing); a negotiation itself is
     not, and takes the whole shell (see onRedline above). */
  const tabbed = ['home','contracts','approvals','negotiations'].includes(s.screen);
  root.innerHTML = mHeadHtml()
    + `<div class="m-screen">${body}</div>`
    + (tabbed ? mTabsHtml() : '')
    + (typeof mAiLauncherHtml==='function' ? mAiLauncherHtml() : '')
    + mSheetHtml();
  mWire();
  mSheetFocus();
}
/* ---- THE KEYBOARD STAYS IN THE SHEET ---- (25 Aug 2026)
   The phone repaints wholesale on every act, so the trap cannot be set where
   the sheet is opened — that node is gone by the next paint. It is set HERE,
   after the paint, from the one fact that decides it: is a sheet showing.
   The opener is remembered across the repaint, because the element that was
   pressed no longer exists by the time the sheet is drawn; the id is what
   survives, and it is looked up again on release.

   A PHONE STILL NEEDS THIS. A tablet at this width has a keyboard, a phone
   can have one paired, and switch access and a screen reader both walk the
   same focus order — a layer that does not hold focus reads on into the page
   behind it, which is exactly what a modal sheet is for. */
let _mSheetTrap=null, _mSheetOpenerId=null, _mSheetKind=null;
function mSheetFocus(){
  const kind = mS().sheet || null;
  const panel = document.querySelector('.m-sheet-wrap .m-sheet');
  if(kind && panel){
    /* Same sheet, fresh markup: re-arm on the new node and keep the opener. */
    if(_mSheetTrap){ try{ _mSheetTrap(); }catch(_){} _mSheetTrap=null; }
    if(kind!==_mSheetKind){
      const a=document.activeElement;
      _mSheetOpenerId = (a && a.id) ? a.id : null;
      _mSheetKind = kind;
    }
    if(typeof window.trapFocus==='function')
      _mSheetTrap = window.trapFocus(panel, {
        opener: _mSheetOpenerId ? document.getElementById(_mSheetOpenerId) : null });
    return;
  }
  if(_mSheetTrap){ try{ _mSheetTrap(); }catch(_){} _mSheetTrap=null; }
  _mSheetKind=null; _mSheetOpenerId=null;
}

/* Is the owner's app the thing on screen at all? A share link renders the
   counterparty's page into #share-root and never starts the shell; the login
   screen hides it again. The phone must not draw itself over either of them —
   the counterparty has their own mobile treatment and the Copilot is
   deliberately withheld from it. startApp sets this display; renderAuth clears
   it, so it is the app's own signal rather than a second flag to keep in step. */
function mAppActive(){
  const shell = document.getElementById('app-shell');
  return !!(shell && shell.style && shell.style.display==='grid');
}

/* The sheet layer. Empty markup when nothing is up, so there is never a
   transparent overlay sitting on the page eating taps. */
function mSheetHtml(){
  const s = mS();
  if(!s.sheet) return '';
  let inner = '';
  if(s.sheet==='account')       inner = mAccountSheetHtml();
  else if(s.sheet==='new')      inner = mNewSheetHtml();
  else if(s.sheet==='overflow') inner = mOverflowSheetHtml();
  else if(s.sheet==='share')    inner = mShareSheetHtml();
  else if(s.sheet==='renumber') inner = mRenumberSheetHtml();
  else if(s.sheet==='signers')  inner = mSignersSheetHtml();
  else if(s.sheet==='kpis')     inner = mKpiSheetHtml();
  else return '';
  /* ---- IT SAYS IT IS A DIALOG, AND IT SAYS WHICH ONE ---- (25 Aug 2026)
     MEASURED before this: the seven sheets carried ZERO accessibility
     semantics between them — no role, no modal announcement, no name — so a
     screen reader was never told a layer had opened over the page and read
     straight on through the screen underneath. The name comes from the
     sheet's own title where it draws one, which is what a reader hears; the
     kind is the fallback, and it is a translated word rather than a key. */
  const named = /class="m-sheet-title"[^>]*>([^<]{1,80})/.exec(inner);
  const label = (named && named[1].trim()) || M_SHEET_LABEL[s.sheet] || i18t('act_close');
  return `<div class="m-sheet-wrap"><button class="m-scrim" data-m-act="close-sheet" aria-label="${i18t('act_close')}"></button>`
    + `<div class="m-sheet" role="dialog" aria-modal="true" aria-label="${mEsc(label)}" tabindex="-1">${inner}</div></div>`;
}
/* SIX OF THE SEVEN DRAW THEIR OWN TITLE and that is what a reader hears, so
   this map holds only the one that does not. A GETTER, never a plain value: an
   object literal freezes whatever language was current when this file loaded,
   which is a trap this codebase has recorded four separate times. */
const M_SHEET_LABEL = {
  get overflow(){ return i18t('ct_more'); },
};

function mOpenSheet(k, extra){ Object.assign(mS(), extra||{}, {sheet:k}); mRender(); }
function mCloseSheet(){ mS().sheet=null; mRender(); }

/* Move to a screen. The desktop's own view moves with it where there is a
   twin, so the two shells never disagree about where the reader is. */
function mGo(screen, extra){
  const s = mS();
  /* ---- THE NEGOTIATIONS DOOR OPENS THE LIST, ALWAYS (WO-17, 24 Aug 2026) ----
     The desktop's Negotiations door was changed on the owner's ask — "when i
     click on the contracts tab on the nav panel, i get a list of contracts.
     This should be the same when i click on the negotiation tab" — and THIS IS
     THE SAME DOOR ON THE OTHER SHELL. Left reopening the last negotiation, the
     two shells would answer one press two different ways, which is the
     duplication warning in its most obvious form.
     THE MEMORY IS KEPT, NOT DELETED: negoRememberOpened and negoLastOpened
     still record and still answer, so this is one argument to put back.
     CORRECTION TO THE WORK ORDER, which said the phone already landed on the
     list — it did not, and f184 is what said so.
     THERE IS NO SPECIAL CASE LEFT IN THIS FUNNEL, and that is the point: the
     screen simply draws mNegotiationsHtml, so every door onto it — the bar,
     a deep link, whatever is added next — lands on the same list without
     having to remember to. */
  Object.assign(s, extra||{}, { screen, sheet:null });
  const view = M_VIEW_FOR_SCREEN[screen];
  if(view && state.view!==view) state.view = view;
  mRender();
  if(screen==='contract') mHydrate(state.activeId);
}

/* ---- THE PHONE READS A LIGHT ROW UNLESS SOMEBODY FETCHES THE REST ----
   In server mode state.contracts is the LIGHT list: the server's HEAVY()
   projection strips audit, upload, versions and the rest off every row. The
   desktop fills them in through ensureFull, which runs from renderWorkspace —
   and the phone never calls renderWorkspace at all. It assigns state.view
   directly and paints itself, so ensureFull had NO caller on this shell and the
   uploaded document, the history tab and the contract brief were silently EMPTY
   in production while looking perfectly fine locally, where records are whole.

   In the FUNNEL rather than in the two click handlers that open a contract, so
   a third door inherits it instead of quietly shipping the same hole.

   Fire-and-forget, and the repaint is guarded on the reader still being on that
   contract: a fetch that lands after they have moved on must not drag the
   screen back. A failure leaves the light row exactly as it is today. */
async function mHydrate(id){
  if(typeof ensureFull!=='function' || !id) return;
  const c = (typeof getContract==='function') ? getContract(id) : null;
  if(!c || c._loaded) return;
  try{ await ensureFull(c); }catch(_){ return; }
  const s = mS();
  if(s && s.screen==='contract' && state.activeId===id) mRender();
}

/* ------------------------------------------------------------------ WIRE ---
   Delegated from the root: the phone repaints wholesale, so per-element
   listeners would be re-attached on every tap and leak on every paint. */
function mWire(){
  const root = document.getElementById('m-root');
  if(!root || !root.querySelectorAll) return;

  root.querySelectorAll('[data-m-tab]').forEach(b=>b.addEventListener('click',()=>{
    mGo(b.getAttribute('data-m-tab'));
  }));
  root.querySelectorAll('[data-m-desk]').forEach(b=>b.addEventListener('click',()=>{
    mGo('handoff',{ deskView:b.getAttribute('data-m-desk') });
  }));
  /* A row on More that opens a REAL phone screen rather than a handoff. */
  root.querySelectorAll('[data-m-go]').forEach(b=>b.addEventListener('click',()=>{
    mGo(b.getAttribute('data-m-go'));
  }));
  /* The review notice's clear. Session-only and shared with the desk — see
     reviewClearBanner. A refresh brings it back, which is the point. */
  root.querySelectorAll('[data-m-rv-clear]').forEach(b=>b.addEventListener('click',()=>{
    const c = (typeof mContract==='function') ? mContract() : null;
    if(c && window.reviewClearBanner) reviewClearBanner(c);
    mRender();
  }));
  /* The sheet stays OPEN after a language change, unlike the market: you tick a
     language to see the app in it, and closing the sheet would hide the one
     thing you just changed. mRender redraws the whole phone shell, so the row
     you tapped comes back reading in the language you picked. */
  root.querySelectorAll('[data-m-lang]').forEach(b=>b.addEventListener('click',()=>{
    if(window.langSet) langSet(b.getAttribute('data-m-lang'),{repaint:false});
    mRender();
  }));
  /* Gated here too, not only in the markup. A non-admin's sheet draws no
     pressable row at all, but a handler that trusts the markup is a handler
     that stops being true the next time the markup changes — and the thing on
     the other side of it moves the whole company's currency and governing law. */
  root.querySelectorAll('[data-m-region]').forEach(b=>b.addEventListener('click',()=>{
    if(typeof isAdmin==='function' && !isAdmin()) return;
    const k=b.getAttribute('data-m-region');
    mCloseSheet();
    if(window.setRegion) setRegion(k);
    mRender();
  }));
  root.querySelectorAll('[data-m-act]').forEach(b=>b.addEventListener('click',e=>{
    const k = b.getAttribute('data-m-act');
    if(k==='theme'){ if(window.toggleTheme) toggleTheme(); mRender(); return; }
    if(k==='account'){ mOpenSheet('account'); return; }
    if(k==='close-sheet'){ mCloseSheet(); return; }
    /* The signer picker's Save. It hands two rows to the DESKTOP's own
       saveSignerPlan; what belongs here is only how a refusal is said. */
    if(k==='signers-save'){ if(window.mSignersSave) mSignersSave(); return; }
    if(k==='back'){ mBack(); return; }
    if(k==='logout'){ mCloseSheet(); if(window.logout) logout(); return; }
    /* ---- the account sheet's own rows ----
       Each one calls the SAME writer the laptop calls. A second copy of "save
       my job title" is a second place the people directory can fall out of
       step with the roster. */
    if(k==='acct-title'){
      const u=(typeof currentUser==='function'&&currentUser())||null; if(!u) return;
      const title=(document.getElementById('m-acct-title')||{}).value||'';
      (async()=>{
        try{
          if(typeof API_MODE==='function'&&API_MODE()){
            const r=await api('users/'+u.id,'PATCH',{ title:title.trim() });
            if(r&&r.user) Object.assign(u,r.user); else u.title=title.trim();
          } else { u.title=title.trim(); if(window.saveUsers) saveUsers(getUsers()); }
          if(window.settingsMirrorDirectory) settingsMirrorDirectory(u.name,u.email,title.trim());
          if(window.toast) toast(i18t('st_acct_saved'));
        }catch(err){ if(window.toast) toast(err.message,'err'); }
      })();
      return;
    }
    if(k==='acct-nav-all'){
      if(typeof navSetShowEverything==='function' && typeof navShowEverything==='function'){
        const on=!navShowEverything(); navSetShowEverything(on);
        if(window.toast) toast(on?i18t('set_sidebar_all_on'):i18t('set_sidebar_all_off'));
      }
      mRender(); return;
    }
    if(k==='acct-backup'){ if(window.settingsExportBackup) settingsExportBackup(); return; }
    if(k==='leave-redline'){ if(window.setView) setView('workspace'); else mGo('contract'); return; }
    mScreenAct(k, b, e);
  }));
  mWireScreen(root);
  /* The launcher's dot is repainted with the launcher, so the shared state has
     to be re-read onto it. updateAIBadge walks every [data-ai-badge] there is —
     the sidebar's, the command bar's, the document page's and now this one —
     from one ai.unread / ai.minimized, which is what makes reading through any
     one door clear the indicator on all of them. */
  if(window.updateAIBadge) try{ updateAIBadge(); }catch(_){}
  if(window.mMarkTappable) try{ mMarkTappable(); }catch(_){}
  /* The sessions list is filled from the server after the paint, exactly as it
     is on a laptop — and by the same function, so the revoke button behaves the
     same way in both places. Guarded on the host so this costs nothing on any
     other sheet or screen. */
  if(document.getElementById('sessions-list') && window.loadSessions) try{ loadSessions(); }catch(_){}
}

/* Where "back" goes from each screen. Deliberately explicit rather than a
   history stack: a stack on a phone means the third tap back lands somewhere
   the reader has forgotten, and every screen here has exactly one sensible
   parent. */
function mBack(){
  const s = mS();
  if(s.screen==='handoff'){ mGo('more'); return; }
  /* People is reached from More and goes back to it — the same way a handoff
     does, because it is the same door. */
  if(s.screen==='people'){ mGo('more'); return; }
  if(s.screen==='portfolio'){ mGo('home'); return; }
  if(s.screen==='contract'){ mGo('contracts'); return; }
  mGo('home');
}

/* --------------------------------------------------------------- THE SYNC --
   Called on load, on every resize across the breakpoint, and after every
   setView. It is the only thing that turns the phone on or off. */
function mSync(){
  const root = document.getElementById('m-root');
  const body = document.body;
  if(!root || !body || !body.classList) return;
  const on = mPhone() && mAppActive();
  const wasOn = body.classList.contains('m-on');
  body.classList.toggle('m-on', on);
  if(on){
    mInjectCss();
    root.hidden = false;
    /* Arriving from the desktop — or from a resume — the phone starts on the
       screen that matches whatever view the app thinks it is on. */
    const s = mS();
    if(!wasOn){
      const mapped = M_SCREEN_FOR_VIEW[state.view];
      if(mapped && !(s.screen==='contract' && mapped==='contract')) s.screen = mapped;
      if(mapped==='more' && M_DESK.some(d=>d.view===state.view)){ s.screen='handoff'; s.deskView=state.view; }
    }
    mRender();
  } else {
    root.hidden = true;
    root.innerHTML = '';
    if(body.classList.contains('m-redline')) body.classList.remove('m-redline');
    /* Widening the window hands the reader back to the desktop shell, on the
       nearest real view — Approvals and More have no desktop twin, so they
       land on the dashboard rather than on nothing. Only when the app is still
       the thing on screen: a logout that hid the shell wants the login form,
       not a repaint of a view nobody is signed in to. */
    if(wasOn && mAppActive() && window.setView){
      setView(M_VIEW_FOR_SCREEN[mS().screen] || state.view || 'dashboard');
      /* The shell has just come back at full size, and --view-h was last
         measured against the phone. Re-measured for the same reason it is
         re-measured on the way in. */
      try{ if(window.syncViewHeight) syncViewHeight(); }catch(_){}
    }
  }
}

/* Repaint whenever the desktop repaints. setView is the app's single
   navigation funnel, so wrapping it once catches every route in — a KPI
   drill-through, a search result, a link from the Copilot — without any of
   those call sites knowing the phone exists. */
function mHookSetView(){
  if(typeof window==='undefined' || !window.setView || window.setView._mHooked) return;
  const inner = window.setView;
  const wrapped = function(view){
    const r = inner.apply(this, arguments);
    try{
      if(mPhone()){
        const mapped = M_SCREEN_FOR_VIEW[view];
        if(mapped) mS().screen = mapped;
        if(M_DESK.some(d=>d.view===view)){ mS().screen='handoff'; mS().deskView=view; }
        /* mSync rather than mRender: this is also the call that arrives when
           somebody signs in, and at that moment the phone has not been turned
           on yet. Sync turns it on and paints; a bare paint would draw into a
           root that is still hidden. */
        mSync();
      }
    }catch(e){ try{ console.error('[hati] phone repaint failed', e); }catch(_){} }
    return r;
  };
  wrapped._mHooked = true;
  window.setView = wrapped;
}

function mBoot(){
  if(typeof window==='undefined' || typeof document==='undefined') return;
  mInjectCss();
  mHookSetView();
  try{
    const mq = window.matchMedia && window.matchMedia(M_QUERY);
    if(mq){
      /* addEventListener where it exists, addListener where it does not —
         Safari only grew the modern form in 14. */
      if(mq.addEventListener) mq.addEventListener('change', mSync);
      else if(mq.addListener) mq.addListener(mSync);
    }
  }catch(_){}
  /* Signing in shows the shell and signing out hides it, and neither goes
     through setView. Watching the one attribute that says which is true keeps
     the phone in step with both without a second flag anybody has to remember
     to set. */
  try{
    const shell = document.getElementById('app-shell');
    if(shell && window.MutationObserver){
      new MutationObserver(()=>mSync()).observe(shell, { attributes:true, attributeFilter:['style','class'] });
    }
  }catch(_){}
  mSync();
}

if(typeof window!=='undefined' && typeof document!=='undefined' && document.addEventListener){
  /* After the shell has been started, not before: mSync reads getOrg() and the
     contract list, both of which arrive with the session. */
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(mBoot,0));
  else setTimeout(mBoot,0);
}

/* mEsc and M_CHEV go on window with the rest: these files are ES modules, so a
   top-level const in one is invisible to the next, and the phone's own screens
   live in three of them. */
Object.assign(window,{ M_QUERY, mPhone, mS, mRender, mSync, mGo, mBack, mBoot, mAppActive,
  mOpenSheet, mCloseSheet, mPill, mMoney, mExpiry, mEsc, M_CHEV, mHeadHtml, mTabsHtml,
  M_DESK, M_SCREEN_FOR_VIEW, M_VIEW_FOR_SCREEN });
