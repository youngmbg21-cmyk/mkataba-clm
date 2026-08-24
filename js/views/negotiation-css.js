// HaTi — the negotiation page's STYLESHEETS, lifted out of js/views/negotiation.js
// on 21 Aug 2026.
//
// WHY THESE TWO AND NOT SOMETHING ELSE. The file they came from is 14,770 lines
// and every reader of it pays for that. It was measured for a seam rather than
// cut where it looked tidy: of its 308 top-level names 111 are private helpers,
// and those are spread evenly through the whole thing, so almost any boundary
// slices through one and turns a private helper into a global by force.
//
// These two are the exception, and the measurement is the reason they are here:
// negoStyleHtml and redlineLayoutCss reference NOTHING else in that file — not
// one identifier, once comments are discounted — and are called from exactly
// three places, at runtime rather than at load. They are 3,096 lines of CSS
// string with an interface of two names. That is a seam; the rest of the file
// is a knot, and pretending otherwise is how a refactor becomes an outage.
//
// HOW THE NAMES STILL RESOLVE. Both were already published to window by that
// file, and both are still published here, so every existing bare call reaches
// them exactly as before. index.html loads this through js/app.js's import list
// AHEAD of views/negotiation.js — order matters only because a reader expects
// the sheet to be defined before the page that draws it, not because anything
// runs at load: negoEnsureStyle and the two redlineLayoutCss callers all run
// when a page is rendered.
//
// WHAT IS STILL LITERAL IN HERE is deliberate and CLAUDE.md's WHERE A COLOUR
// LIVES says which: the --n-* block is the room's own token definitions, and
// --n-paper is the contract sheet, which stays white in every theme.

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
    --n-r-sm:0; --n-r-md:0; --n-r-lg:0;
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
    font-family:var(--n-font-ui);font-size:15px;line-height:1.55}

  .nego-topbar{background:var(--n-slate);color:#fff;display:flex;align-items:center;gap:16px;
    padding:0 18px;height:52px;flex:0 0 auto}
  .nego-brand{display:flex;align-items:center;gap:10px;font-weight:700;font-size:16px;letter-spacing:.2px;flex:none}
  .nego-brand .mark{width:26px;height:26px;border-radius:0;
    background:linear-gradient(135deg,#4d6d8f,#33475c 65%);border:1px solid rgba(255,255,255,.25);
    display:grid;place-items:center;font-size:13px;font-weight:700}
  .nego-brand small{font-weight:400;opacity:.75;font-size:13px;margin-left:2px}
  .nego-crumbs{display:flex;align-items:center;gap:8px;font-size:14px;color:rgba(255,255,255,.82);min-width:0}
  /* The way out. The prototype's "Doc" breadcrumb chip IS the exit, because it
     already reads as where you came from — a second control saying the same
     thing would be furniture. Esc does it too. */
  .nego-exit{display:inline-flex;align-items:center;gap:6px;flex:none;
    background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);color:#fff;
    border-radius:0;padding:4px 11px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;
    transition:background .12s ease}
  .nego-exit:hover{background:rgba(255,255,255,.26)}
  .nego-crumbs .sep{opacity:.45;flex:none}
  .nego-crumbs .path{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nego-crumbs .draft-chip{flex:none;border:1px solid rgba(255,255,255,.35);border-radius:0;
    padding:1px 8px;font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:#dfe7ef}
  .nego-top-actions{margin-left:auto;display:flex;align-items:center;gap:8px;flex:none}
  .nego-tbtn{border-radius:0;padding:6px 13px;font:inherit;font-size:14px;font-weight:600;
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
  .nego-why{flex:0 1 auto;max-width:300px;font-size:12px;line-height:1.35;color:#c3cfda}
  /* ---- A TOKEN THAT DOES NOT REACH THE ELEMENT USING IT (23 Aug 2026) ----
     The same fault as the selection menu's transparent background, in a
     different room. --n-accept is defined on the nego-room / nego-root /
     nego-selmenu / nego-aipop group, and this readiness notice is ALSO drawn
     inside the counterparty's own alerts panel, which is none of those. There
     it resolved to nothing, so the left accent bar disappeared and the tick
     rendered WHITE ON WHITE: an invisible tick on the one notice that says the
     deal is ready.

     A FALLBACK is exactly what the second argument of var() is for, and adding
     one where there is none is not the thing this file warns against — that
     warning is about REWRITING a fallback that already answers. --st-green-fg
     is what --n-accept itself resolves to, so nothing moves where the token
     does reach. */
  .nego-readysig{display:flex;align-items:flex-start;gap:11px;flex-wrap:wrap;margin:10px 14px 0;
    border:1px solid var(--st-green-line);border-left:4px solid var(--n-accept,var(--st-green-fg));background:var(--st-green-bg);
    border-radius:0;padding:10px 14px}
  .nego-readysig .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-accept,var(--st-green-fg));color:#fff;font-size:12px;font-weight:700}
  .nego-readysig .body{flex:1;min-width:220px;font-size:13px;line-height:1.5;color:var(--st-green-fg)}
  .nego-readysig .row{display:block}
  .nego-readysig .row+.row{margin-top:3px;color:var(--n-ink-soft)}
  .nego-readysig .nego-tbtn{flex:none;align-self:center}
  /* A signal the change set has moved past is not good news, and must not be
     dressed as it. Same box, the colour of an open point. */
  .nego-readysig.stale{border-color:var(--st-amber-line);border-left-color:var(--st-amber-dot);background:var(--st-amber-bg)}
  .nego-readysig.stale .tick{background:var(--st-amber-dot)}
  .nego-readysig.stale .body{color:var(--st-amber-fg)}
  .nego-closed{display:flex;align-items:flex-start;gap:11px;margin:10px 14px 0;border-radius:0;
    padding:10px 14px;border:1px solid var(--n-line);background:var(--n-badge-bg);
    border-left:4px solid var(--n-slate)}
  .nego-closed[data-state="signed"]{border-color:var(--st-green-line);border-left-color:var(--n-accept);background:var(--st-green-bg)}
  .nego-closed[data-state="declined"]{border-color:var(--st-ruby-line);border-left-color:var(--n-reject);background:var(--st-ruby-bg)}
  .nego-closed .tick{flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;
    background:var(--n-slate);color:#fff;font-size:12px;font-weight:700}
  .nego-closed[data-state="signed"] .tick{background:var(--n-accept)}
  .nego-closed[data-state="declined"] .tick{background:var(--n-reject)}
  .nego-closed .body{flex:1;min-width:220px;font-size:13px;line-height:1.5;color:var(--n-ink)}
  /* The numbering notice. Inside the document, above the first clause, because
     it is a remark about THIS PAGE's numbering and not about where the deal
     stands — the banner slot above the panes answers that one question and
     stays answering only it. Amber while the draft can still be tidied; slate
     once the contract is executed and the gap is part of the record. */
  .nego-gaps{display:flex;align-items:flex-start;gap:10px;margin:0 0 18px;border-radius:0;
    padding:10px 13px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot)}
  .nego-gaps[data-locked="1"]{border-color:var(--n-line);background:var(--n-badge-bg);
    border-left-color:var(--n-slate)}
  .nego-gaps .mark{flex:none;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;
    background:var(--st-amber-dot);color:#fff;font-size:12px;font-weight:700;line-height:1}
  .nego-gaps[data-locked="1"] .mark{background:var(--n-slate)}
  .nego-gaps .body{flex:1;min-width:200px;font-size:13px;line-height:1.55;color:var(--n-ink)}
  .nego-gaps .body b{font-weight:700}
  .nego-gaps .why{display:block;margin-top:3px;color:var(--n-ink-soft)}
  /* The one door out of the notice (N2-T5) — drafts only; the executed notice
     never renders it at all. */
  .nego-gaps .renum{display:inline-block;margin-top:7px;font:inherit;font-size:12px;font-weight:700;
    color:var(--st-amber-fg);background:var(--n-paper);border:1px solid var(--st-amber-dot);border-radius:0;padding:4px 10px;cursor:pointer}
  .nego-gaps .renum:hover{background:var(--st-amber-dot);color:#fff}
  /* Their name, in the room, because the room is their page. */
  .nego-who{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.28);
    border-radius:0;padding:2px 4px 2px 9px;background:rgba(255,255,255,.06)}
  .nego-who .lbl{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#c3cfda}
  .nego-who input{width:150px;border:0;outline:none;background:transparent;color:#fff;
    font:inherit;font-size:14px;padding:5px 6px}
  .nego-who input::placeholder{color:rgba(230,236,242,.55)}
  .nego-avatar{width:28px;height:28px;border-radius:50%;flex:none;
    background:linear-gradient(135deg,#c98f5f,#8a5a3b);border:2px solid rgba(255,255,255,.5);
    display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}

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
  .nego-rz::before{content:"";width:2px;height:60px;border-radius:0;background:#c4cfdb;transition:background .15s ease}
  .nego-rz:hover::before,.nego-rz[data-drag]::before{background:var(--n-slate-soft)}
  .nego-rz[data-drag]{background:#dbe3ec}
  html.dark .nego-rz::before{background:var(--color-neutral-600)}
  html.dark .nego-rz[data-drag]{background:var(--color-neutral-700)}

  .nego-pane{display:flex;flex-direction:column;min-width:0;min-height:0;background:var(--n-canvas)}
  .nego-pane-head{flex:none;display:flex;align-items:center;gap:8px;padding:10px 16px;
    background:var(--n-paper);border-bottom:1px solid var(--n-line);
    font-size:14px;font-weight:700;color:var(--n-ink)}
  .nego-ver{font-family:var(--n-font-mono);font-size:12px;font-weight:600;
    background:var(--n-badge-bg);color:var(--n-slate-soft);
    border:1px solid #d6e0ea;border-radius:0;padding:1px 7px;flex:none}
  .nego-sub{font-weight:400;color:var(--n-ink-soft);font-size:13px;min-width:0;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .nego-fold{margin-left:auto;flex:none;border:1px solid #d6e0ea;background:var(--n-badge-bg);
    color:var(--n-slate-soft);border-radius:0;padding:2px 8px;font:inherit;font-size:12px;
    font-weight:700;cursor:pointer}
  .nego-fold:hover{background:#e3eaf2}
  html.dark .nego-ver,html.dark .nego-fold{border-color:var(--color-neutral-700)}
  html.dark .nego-fold:hover{background:var(--color-neutral-700)}
  .nego-scroll{flex:1;overflow-y:auto;padding:22px 20px 90px;scroll-behavior:smooth}

  /* ---- the document ----
     Serif, on paper, at the prototype's measure: a contract should read like a
     contract and not like the application around it. */
  .nego-doc{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:34px 38px 44px;max-width:720px;margin:0 auto;
    font-family:var(--n-font-doc);font-size:15px;line-height:1.72;color:#222a33}
  html.dark .nego-doc{color:var(--n-ink)}
  .nego-doc h1{font-size:19px;text-align:center;margin:0 0 6px;letter-spacing:.2px;line-height:1.35;
    font-family:var(--n-font-doc);font-weight:700}
  .nego-doc .nego-meta{text-align:center;font-family:var(--n-font-ui);font-size:12px;
    color:var(--n-ink-soft);margin-bottom:26px;padding-bottom:18px;border-bottom:1px solid var(--n-line)}
  .nego-clause{position:relative;margin-bottom:22px;padding:10px 12px;border-radius:var(--n-r-md);
    transition:background .25s ease,box-shadow .25s ease}
  .nego-clause h2{font-size:15px;margin:0 0 5px;font-family:var(--n-font-doc);font-weight:700}
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
  .nego-redline .rl-heading{font-weight:700;font-size:15px;margin:12px 0 6px;
    font-family:var(--n-font-doc)}
  .nego-redline .rl-heading:first-child{margin-top:0}
  .nego-redline .rl-hang{padding-left:2.6em;text-indent:-2.6em}
  /* ---- THE MARKER IS A GUTTER, NOT A GLYPH (owner-reported 16 Aug 2026, off a
     screenshot: "specifications and provided needs to start at the same line as
     manufacture") ----
     The hang above pulls the first line back 2.6em and indents every wrap by
     the same 2.6em — which aligns the two ONLY if the marker plus its gap is
     exactly 2.6em wide. It never was: "•" is a third of that, so the first
     line's wording started well LEFT of its own wraps and the wraps read as
     over-indented. The marker now occupies the full hanging measure as an
     inline-block, so the wording starts at the tab stop on every line, first
     and wrapped alike — one text column whatever the marker is, which is how a
     contract is set on paper. min-width, not width, so a long citation
     ("12.10.") is never clipped; text-indent:0 because an inline-block is a
     block container and would otherwise inherit the -2.6em and shove its own
     glyph out of its box. */
  .nego-redline .rl-hang .rl-marker{display:inline-block;min-width:2.6em;text-indent:0}
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
    border-radius:0;padding:0 1px;font-weight:inherit}
  .nego-room del.hati-del,.nego-room del.nego-del{
    background:var(--n-del-bg);color:var(--n-del-fg);text-decoration:line-through;
    border-radius:0;padding:0 1px}

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
    min-width:236px;padding:5px;border-radius:0;background:var(--n-paper);
    border:1px solid var(--n-line);box-shadow:0 10px 30px -8px rgba(20,32,48,.35)}
  .nego-selmenu button{display:flex;align-items:center;gap:9px;width:100%;text-align:left;
    font:inherit;font-family:var(--n-font-ui);font-size:14px;color:var(--n-ink);
    background:none;border:0;border-radius:0;padding:7px 9px;cursor:pointer}
  .nego-selmenu button:hover,.nego-selmenu button:focus-visible{background:var(--n-badge-bg)}
  .nego-selmenu .nego-selhead{font-size:11px;letter-spacing:.09em;text-transform:uppercase;
    color:var(--n-ink-soft);padding:5px 9px 4px}
  .nego-selmenu .nego-selquote{font-size:12px;color:var(--n-ink-soft);padding:0 9px 6px;
    max-width:236px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-style:italic}
  /* The reason a highlight leads nowhere. Wraps, unlike the quote above it —
     this is a sentence to be read, not a label to be recognised. */
  .nego-selmenu .nego-selnote{font-size:13px;line-height:1.55;color:var(--n-ink-soft);
    padding:0 9px 8px;max-width:248px}

  /* ---- the AI proposal popover ----
     A proposal, never an edit. Nothing has moved when this is on screen: it
     shows the redline that WOULD be filed, and closing it leaves the document
     exactly as it was. */
  /* 67, one above the selection menu and one above the scrim — see the note on
     .nego-selmenu for why the scrim is the layer that matters here. */
  .nego-aipop{position:fixed;z-index:67;width:min(460px,calc(100vw - 32px));
    border-radius:0;background:var(--n-paper);border:1px solid var(--n-line);
    box-shadow:0 18px 44px -12px rgba(20,32,48,.42);overflow:hidden}
  .nego-aipop header{display:flex;align-items:center;gap:8px;padding:11px 14px;
    border-bottom:1px solid var(--n-line);background:var(--n-canvas)}
  .nego-aipop header b{font-family:var(--n-font-ui);font-size:14px}
  .nego-aipop .nego-aibody{padding:12px 14px;max-height:44vh;overflow-y:auto;
    font-family:var(--n-font-doc);font-size:14px;line-height:1.65}
  .nego-aipop footer{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--n-line);
    background:var(--n-canvas);flex-wrap:wrap}
  .nego-aipop .nego-aiwait{display:flex;align-items:center;gap:9px;padding:16px 14px;
    font-family:var(--n-font-ui);font-size:14px;color:var(--n-ink-soft)}
  .nego-aipop .nego-aispin{width:14px;height:14px;border-radius:50%;flex:none;
    border:2px solid var(--n-line);border-top-color:var(--n-slate);animation:nego-spin .8s linear infinite}
  @keyframes nego-spin{to{transform:rotate(360deg)}}
  .nego-aipop .nego-aierr{padding:14px;font-family:var(--n-font-ui);font-size:14px;
    line-height:1.6;color:var(--st-ruby-fg)}

  /* ---- a thread singled out by its badge ---- */
  .nego-card.is-linked{box-shadow:0 0 0 3px rgba(184,134,43,.35);border-color:var(--st-amber-dot)}
  .nego-filterbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;
    font-family:var(--n-font-ui);font-size:13px;padding:7px 11px;border-radius:0;
    background:var(--st-amber-bg);border:1px solid var(--st-amber-line);color:var(--st-amber-fg);margin-bottom:9px}
  .nego-filterbar button{font:inherit;font-size:12px;font-weight:600;cursor:pointer;
    border:1px solid var(--st-amber-line);background:var(--n-paper);color:var(--st-amber-fg);border-radius:0;padding:3px 9px}

  /* ---- visibility on a comment ---- */
  .nego-vis{display:inline-flex;align-items:center;gap:4px;font-family:var(--n-font-ui);
    font-size:12px;font-weight:700;letter-spacing:.04em;border-radius:0;padding:2px 8px;white-space:nowrap}
  .nego-vis-int{background:#f4ecd8;color:var(--st-amber-fg);border:1px solid rgba(138,106,42,.3)}
  .nego-vis-sh{background:#e8f0f8;color:#2c455d;border:1px solid #b5d9fd}
  .nego-msg.is-internal{background:#fdfaf1;border-left:3px solid var(--st-amber-dot);padding-left:9px}
  .nego-visswitch{display:inline-flex;border:1px solid var(--n-line);border-radius:0;overflow:hidden}
  .nego-visswitch button{font:inherit;font-family:var(--n-font-ui);font-size:12px;font-weight:600;
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
    font-family:var(--n-font-ui);font-size:13px;padding:8px 13px;border-radius:0;
    border:1px solid var(--n-line);background:var(--n-paper)}
  .nego-mode.is-sandbox{border-left:4px solid var(--st-amber-dot);background:color-mix(in srgb,var(--st-amber-dot) 6%,var(--n-paper));color:var(--st-amber-fg)}
  .nego-mode.is-published{border-left:4px solid var(--n-slate);background:#f5f8fb;color:var(--n-ink)}
  html.dark .nego-mode.is-published{background:var(--n-badge-bg)}
  .nego-mode b{font-size:13px}
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
    font-family:var(--n-font-doc);font-size:15px;font-weight:700;margin:12px 0 5px}
  .nego-clause .nego-body table,.nego-clause .nego-editing table{
    border-collapse:collapse;width:100%;margin:9px 0;font-size:14px}
  .nego-clause .nego-body td,.nego-clause .nego-body th,
  .nego-clause .nego-editing td,.nego-clause .nego-editing th{
    border:1px solid var(--n-line);padding:5px 8px;text-align:left;vertical-align:top}
  .nego-clause .nego-body th,
  .nego-clause .nego-editing th{font-weight:700;background:var(--n-badge-bg)}
  .nego-clause .nego-body pre,.nego-clause .nego-editing pre{white-space:pre;overflow-x:auto;
    font-family:var(--n-font-mono);font-size:13px;line-height:1.5}
  .nego-clause .nego-body blockquote,
  .nego-clause .nego-editing blockquote{margin:8px 0 8px 18px;padding-left:12px;
    border-left:2px solid var(--n-line);color:var(--n-ink-soft)}
  /* ---- AND THE SAME DRESS IN THE EDITOR'S OTHER HOME (16 Aug 2026) ----
     Every twin above is scoped to .nego-clause — the editor's home when f144
     built them. Since the clause tool row retired, the editor OPENS in the
     clause panel (.rl-cp-src, over "As it stands"), and without these the
     fault came straight back through the new door: a table typed into the
     panel's editor shrank to its content and a preformatted block hung
     outside the box. Same values; fallbacks on the vars because the
     counterparty's mount can sit outside the #nego-root scope that defines
     them. */
  .rl-cp-src .nego-editing>*{margin:0 0 9px}
  .rl-cp-src .nego-editing>*:last-child{margin-bottom:0}
  .rl-cp-src .nego-editing p,.rl-cp-src .nego-editing li{white-space:normal}
  .rl-cp-src .nego-editing ol,.rl-cp-src .nego-editing ul{margin:7px 0 9px;padding-left:26px}
  .rl-cp-src .nego-editing li{margin:0 0 5px}
  .rl-cp-src .nego-editing li:last-child{margin-bottom:0}
  .rl-cp-src .nego-editing strong,.rl-cp-src .nego-editing b{font-weight:700}
  .rl-cp-src .nego-editing em,.rl-cp-src .nego-editing i{font-style:italic}
  .rl-cp-src .nego-editing u{text-decoration:underline}
  .rl-cp-src .nego-editing h1,.rl-cp-src .nego-editing h2,.rl-cp-src .nego-editing h3,
  .rl-cp-src .nego-editing h4,.rl-cp-src .nego-editing h5,.rl-cp-src .nego-editing h6{
    font-family:var(--n-font-doc,serif);font-size:15px;font-weight:700;margin:10px 0 5px}
  .rl-cp-src .nego-editing table{border-collapse:collapse;width:100%;margin:9px 0;font-size:13px}
  .rl-cp-src .nego-editing td,.rl-cp-src .nego-editing th{
    border:1px solid var(--n-line,#e2e8f0);padding:5px 8px;text-align:left;vertical-align:top}
  .rl-cp-src .nego-editing th{font-weight:700;background:var(--n-badge-bg,#f1f5f9)}
  .rl-cp-src .nego-editing pre{white-space:pre;overflow-x:auto;
    font-family:var(--n-font-mono,monospace);font-size:13px;line-height:1.5}
  .rl-cp-src .nego-editing blockquote{margin:8px 0 8px 18px;padding-left:12px;
    border-left:2px solid var(--n-line,#e2e8f0);color:var(--n-ink-soft,#475569)}
  .nego-clause.is-active{background:#f3f7fb;box-shadow:0 0 0 2px var(--n-slate-soft)}
  html.dark .nego-clause.is-active{background:rgba(127,163,200,.12)}
  .nego-clause.flash{animation:negoFlash 1.4s ease 1}
  @keyframes negoFlash{
    0%{box-shadow:0 0 0 2px var(--n-slate-soft),0 0 0 8px rgba(69,106,143,.18)}
    100%{box-shadow:0 0 0 2px var(--n-slate-soft),0 0 0 0 rgba(69,106,143,0)}
  }

  /* Redline runs, at the prototype's values. */
  .nego-del{background:var(--n-del-bg);color:var(--n-del-fg);text-decoration:line-through;
    text-decoration-color:var(--n-del-fg);text-decoration-thickness:1.5px;border-radius:0;padding:0 3px}
  /* ---- AN INSERTION IS GREEN AND NOTHING ELSE ----
     (owner-reported twice: 16 Aug 2026, "the green additions to the contract
     should just be green, not bold and not underlined", and again after the
     first pass scoped the change to the clause panel and left the paper on the
     tracked-changes convention. The paper was the half being pointed at. So the
     rule moves to the BASE, where it reaches the sheet, the room, the contract
     tab, the panel and the counterparty's copy at once — and the panel's own
     override goes, because two rules for one fact is how they come to differ.)

     The DELETION keeps its strike, and that is not an inconsistency: a struck
     phrase has to read as struck or it reads as ordinary wording, which is the
     one thing a redline may not do. Colour alone can say "added"; nothing but
     the strike can say "taken out". */
  .nego-ins{background:var(--n-ins-bg);color:var(--n-ins-fg);
    border-radius:0;padding:0 3px;text-decoration:none}
  .nego-resolved{background:var(--n-ins-bg);border-radius:0;padding:0 3px;transition:background 1.2s ease}
  .nego-resolved.nego-faded{background:transparent}

  /* The working pane keeps a GUTTER, because a margin-anchored badge needs
     somewhere to be. Without it the badge lands outside the pane's content box
     and the pane's overflow clips it — "#CHG-012" arrives as "G-012". */
  .nego-pane.working .nego-doc{padding-left:100px}
  /* The clause's own number, in the margin of the other document renderer —
     sheet furniture, so it follows the sheet's type like the tag and the chip.
     Only the TYPE scales: the badge hangs off the clause's left edge and its
     position is the margin's, not the words'. */
  .nego-badge{position:absolute;right:calc(100% + 6px);top:10px;
    font-family:var(--n-font-mono);font-size:calc(10px * var(--doc-scale,1));font-weight:700;letter-spacing:.2px;
    background:var(--n-badge-bg);color:var(--n-slate-soft);
    border:1.5px solid var(--n-slate-soft);border-radius:0;
    padding:calc(2px * var(--doc-scale,1)) calc(8px * var(--doc-scale,1));
    white-space:nowrap;user-select:none;cursor:pointer;
    transition:transform .15s ease,box-shadow .15s ease,background .2s ease,color .2s ease,border-color .2s ease}
  .nego-badge:hover{transform:scale(1.06);box-shadow:var(--n-shadow-card)}
  .nego-badge.is-active{background:var(--n-slate);border-color:var(--n-slate);color:#fff}
  .nego-badge.is-accepted{background:var(--n-ins-bg);border-color:var(--n-ins-fg);color:var(--n-ins-fg)}
  .nego-badge.is-rejected{background:var(--n-del-bg);border-color:var(--n-del-fg);color:var(--n-del-fg)}
  /* THE SAME TREATMENT AS .rl-asktag, AND FOR THE SAME REPORT. This chip is the
     OTHER document renderer's version of the marker on a clause (negoDocHtml —
     the duplication this rulebook opens by warning about), plus the
     formatting-only chip on the redline sheet itself. It is drawn inside the
     document on every screen that draws one, so it follows the document's type.
     --doc-scale is 1 wherever nothing sets it, which is every surface without a
     stepper — a print, an export, a card. */
  .nego-note{display:inline-block;font-family:var(--n-font-ui);font-size:calc(11px * var(--doc-scale,1));
    font-weight:700;border-radius:0;
    padding:calc(1px * var(--doc-scale,1)) calc(7px * var(--doc-scale,1));
    margin-left:8px;vertical-align:1px;letter-spacing:.3px}
  .nego-note.ok{background:var(--n-ins-bg);color:var(--n-ins-fg)}
  .nego-note.no{background:var(--n-del-bg);color:var(--n-del-fg)}
  /* A formatting-only ask has no strike/insert marks to wear, so the chip is
     the whole signal — slate, not red or green, because it is information
     rather than a verdict. */
  .nego-note.fmt{background:var(--n-badge-bg);color:var(--n-slate-soft);border:1px solid var(--n-slate-soft)}
  /* The refusal that stays after formatting-only edits became fileable: a save
     where truly nothing changed. Inline beside the button that was pressed —
     a corner toast made the button read as dead. */
  .nego-edit-bar .nego-nofile{font-family:var(--n-font-ui);font-size:calc(12px * var(--doc-scale,1));font-weight:600;
    color:var(--n-del-fg);align-self:center;margin-left:calc(6px * var(--doc-scale,1))}

  /* ---- the change index ---- */
  .nego-pane.index{background:var(--color-neutral-100)}
  .nego-index-head{flex:none;padding:12px 16px 10px;background:var(--n-paper);border-bottom:1px solid var(--n-line)}
  .nego-count{font-family:var(--n-font-mono);font-size:12px;font-weight:700;
    background:var(--n-slate);color:#fff;border-radius:0;padding:1px 8px}
  .nego-track{height:5px;background:#e6ebf1;border-radius:0;overflow:hidden;margin-bottom:7px}
  html.dark .nego-track{background:var(--n-line)}
  .nego-fill{height:100%;border-radius:0;
    background:linear-gradient(90deg,var(--n-slate-soft),var(--n-accept));transition:width .4s ease}
  .nego-index-scroll{flex:1;overflow-y:auto;padding:12px 12px 90px}
  .nego-card{background:var(--n-paper);border:1px solid var(--n-line);border-radius:var(--n-r-md);
    box-shadow:var(--n-shadow-card);padding:12px 13px;margin-bottom:11px;cursor:pointer;
    transition:box-shadow .2s ease,border-color .2s ease,transform .2s ease}
  .nego-card:hover{border-color:#c9d5e1}
  html.dark .nego-card:hover{border-color:var(--color-neutral-700)}
  .nego-card.is-active{border-color:var(--n-slate-soft);
    box-shadow:0 0 0 2px rgba(69,106,143,.25),var(--n-shadow-pop);transform:translateY(-1px)}
  .nego-id{font-family:var(--n-font-mono);font-size:12px;font-weight:700;
    background:var(--n-badge-bg);color:var(--n-slate-soft);border:1.5px solid var(--n-slate-soft);
    border-radius:0;padding:1px 8px}
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
  .nego-tool{font-size:12px;font-weight:700;border:1px solid var(--n-slate);
    background:var(--n-slate);color:#fff;border-radius:0;padding:3px 9px;white-space:nowrap;
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
  /* ---- THE EDITOR IS FURNITURE ON THE CLAUSE, SO IT FOLLOWS THE CLAUSE ----
     Reported 15 Aug 2026 off a screenshot: the wording inside the editor
     scaled with the type stepper and everything AROUND it did not, so at the
     floor of 8px the Save button and the format chips were larger than the
     sentence they were editing — the same fault, and the same fix, as the ask
     tag and the clause tools before them (the tool row itself has since been
     retired — 16 Aug 2026, all edits through the clause panel — but the
     scaling rule it taught stands). --doc-scale is 1 on every surface
     that sets no preference (the two-pane view scales WIDTH, not type), so
     nothing but the redline page moves. POSITIONING stays in bare pixels:
     scaling one offset without its partner walks a pair apart. */
  .nego-fmt-bar{display:flex;gap:calc(4px * var(--doc-scale,1));
    margin:0 0 calc(6px * var(--doc-scale,1));padding:calc(4px * var(--doc-scale,1));width:max-content;
    background:var(--n-well,#f1f5f9);border:1px solid var(--n-line,#e2e8f0);border-radius:0}
  .nego-fmt-bar button{width:calc(28px * var(--doc-scale,1));height:calc(28px * var(--doc-scale,1));
    display:inline-grid;place-items:center;
    background:var(--n-paper,#fff);border:1px solid var(--n-line,#e2e8f0);border-radius:0;
    font-family:inherit;font-size:calc(13px * var(--doc-scale,1));color:var(--n-ink,#1e293b);cursor:pointer;
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
    font:inherit;font-size:12px;font-weight:700;color:var(--color-accent-700,#0f766e)}
  .nego-why-more:focus-visible{outline:2px solid var(--color-accent,#0d9488);outline-offset:2px;border-radius:0}
  .nego-reason{display:block;margin-top:calc(8px * var(--doc-scale,1))}
  .nego-reason.hidden,.nego-fmt-bar.hidden{display:none}
  /* Step two: the wording is still there and still exactly where it was, but it
     is being read rather than typed in — so it loses the caret ring and stops
     looking like an open field. */
  .nego-editing.is-review{outline:1px solid var(--n-line);background:var(--n-well,#f8fafc);
    cursor:default}
  .nego-reason>span{display:block;font-size:calc(10px * var(--doc-scale,1));font-weight:700;letter-spacing:.04em;
    text-transform:uppercase;color:var(--n-ink-soft);margin-bottom:calc(3px * var(--doc-scale,1))}
  .nego-reason textarea{display:block;box-sizing:border-box;width:100%;max-width:100%;
    min-height:calc(52px * var(--doc-scale,1));resize:vertical;border:1px solid var(--n-line);border-radius:0;
    padding:calc(7px * var(--doc-scale,1)) calc(9px * var(--doc-scale,1));
    font:inherit;font-size:calc(12px * var(--doc-scale,1));line-height:1.6;
    background:var(--n-paper);color:var(--n-ink);outline:none;
    white-space:pre-wrap;overflow-wrap:anywhere}
  .nego-reason textarea:focus{border-color:var(--n-focus)}
  .nego-edit-bar{display:flex;gap:calc(6px * var(--doc-scale,1));margin-top:calc(6px * var(--doc-scale,1))}
  .nego-edit-bar button{font-size:calc(11px * var(--doc-scale,1));font-weight:700;border-radius:0;
    padding:calc(4px * var(--doc-scale,1)) calc(10px * var(--doc-scale,1));
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
  .nego-vsel{font:inherit;font-size:13px;font-weight:700;color:var(--n-ink);background:var(--n-paper);
    border:1px solid var(--n-line);border-radius:0;padding:4px 8px;max-width:min(60%,320px);cursor:pointer}
  .nego-vsel:hover{border-color:var(--n-slate-soft)}
  .nego-cmp-bar{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 14px;
    border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot);border-radius:0;padding:9px 13px}
  .nego-cmp-tag{flex:none;font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
    background:var(--st-amber-dot);color:#fff;border-radius:0;padding:2px 7px}
  .nego-cmp-txt{flex:1;min-width:220px;font-size:13px;line-height:1.5;color:var(--st-amber-fg)}
  /* Clean read is a HYPOTHETICAL, not history — so it is the room's own slate
     rather than the amber of "you are looking at an old version". Same shape,
     because it is the same kind of thing: a mode, with its way out in it. */
  .nego-cmp-bar.clean{border-color:#c9d5e1;background:var(--n-badge-bg);border-left-color:var(--n-slate)}
  html.dark .nego-cmp-bar.clean{border-color:var(--color-neutral-700)}
  .nego-cmp-bar.clean .nego-cmp-tag{background:var(--n-slate)}
  .nego-cmp-bar.clean .nego-cmp-txt{color:var(--n-ink)}
  .nego-cmp-bar.clean .nego-cmp-exit{border-color:var(--n-slate);background:var(--n-slate)}
  /* The toggle itself, at the end of the working pane's header row. */
  .nego-clean-btn{margin-left:auto;flex:none;border:1px solid var(--n-slate);background:var(--n-paper);
    color:var(--n-slate);border-radius:0;padding:3px 10px;font:inherit;font-size:12px;font-weight:700;
    white-space:nowrap;cursor:pointer;transition:background .12s ease,color .12s ease}
  .nego-clean-btn:hover{background:var(--n-badge-bg)}
  .nego-clean-btn[aria-pressed="true"]{background:var(--n-slate);color:#fff}
  /* On an amber banner a ghost button is white-on-cream and unreadable — the
     way out of a mode has to be the most legible thing in it. */
  .nego-cmp-exit{flex:none;border:1px solid var(--st-amber-fg);background:var(--st-amber-fg);color:#fff;border-radius:0;
    padding:6px 13px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .nego-cmp-exit:hover{filter:brightness(1.15)}
  .nego-st{margin-left:auto;font-size:11px;letter-spacing:.09em;font-weight:700;letter-spacing:.4px;text-transform:uppercase;
    border-radius:0;padding:2px 7px}
  .nego-st.pending{background:#fdf3e3;color:#9a6a1f}
  html.dark .nego-st.pending{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .nego-st.accepted{background:var(--n-ins-bg);color:var(--n-ins-fg)}
  .nego-st.rejected{background:var(--n-del-bg);color:var(--n-del-fg)}
  .nego-st.verified{background:var(--n-badge-bg);color:var(--n-slate-soft)}
  /* A withdrawn ask sits NEXT TO its status, not instead of it. "rejected ·
     withdrawn" is the whole story: they asked, we said no, they let it go.
     Replacing the status would erase the refusal from the face of the card. */
  .nego-st.withdrawn{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  html.dark .nego-st.withdrawn{border-color:var(--color-neutral-700);color:var(--n-ink-soft)}
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
    border-top:1px dashed var(--st-amber-line);padding-top:8px;font-size:12px;line-height:1.45;color:var(--st-amber-fg)}
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
  .nego-go{font-size:14px;font-weight:600;letter-spacing:.01em;padding:9px 20px;
    border-radius:0;box-shadow:0 1px 2px rgba(20,42,74,.18),0 2px 8px rgba(20,42,74,.14);
    transition:transform .08s ease,box-shadow .12s ease}
  .nego-go:hover{box-shadow:0 2px 4px rgba(20,42,74,.2),0 4px 14px rgba(20,42,74,.2)}
  .nego-go:active{transform:translateY(1px)}
  /* WHOSE ASK THIS IS, readable without reading. It pairs with the "Your ask"
     chip and explains why the card has no Accept on it — nobody rules on their
     own proposal. At 3px it was competing with the 1px border it sits inside
     and had to be looked for; the padding absorbs the extra so nothing shifts. */
  .nego-card.is-mine{border-left:5px solid var(--n-mine,#1f3f6e);padding-left:11px}
  .nego-whose{margin-left:0;font-size:12px;font-weight:700;letter-spacing:.04em;
    border-radius:0;padding:2px 8px;white-space:nowrap;max-width:170px;
    overflow:hidden;text-overflow:ellipsis;
    background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  .nego-whose.mine{background:#eaf0f8;color:var(--n-mine,#1f3f6e);border-color:#b9cbe4}
  html.dark .nego-whose{border-color:var(--color-neutral-700);color:var(--n-ink-soft)}
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
  .nego-history-head{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
    color:var(--n-closed,#8c2f28);margin:0 2px 8px}
  .nego-round{margin-bottom:8px;border:1px solid var(--n-line);border-radius:0;
    background:var(--n-badge-bg);overflow:hidden}
  .nego-round-tog{display:flex;align-items:center;gap:8px;width:100%;text-align:left;cursor:pointer;
    background:none;border:0;padding:9px 11px;font:inherit;color:var(--n-closed,#8c2f28)}
  .nego-round-tog:hover{background:rgba(0,0,0,.03)}
  html.dark .nego-round-tog:hover{background:rgba(255,255,255,.05)}
  .nego-round-caret{flex:none;font-size:12px}
  .nego-round-name{font-size:13px;font-weight:700}
  .nego-round-count{font-size:12px;color:var(--n-ink-soft);margin-left:auto}
  /* The rows of the version selector. Browsers on a computer honour a colour on
     an option; Safari and phones draw the operating system's own menu and will
     ignore it. The "Round 1 -" on the front of every label carries the same
     meaning either way, so nothing is lost where the colour does not land. */
  .nego-vsel option.closed{color:var(--n-closed,#8c2f28)}
  .nego-vsel option.live{color:var(--n-ink)}
  .nego-round-body{display:none;padding:0 9px 9px}
  .nego-round.open .nego-round-body{display:block}
  .nego-round-note{font-size:12px;line-height:1.5;color:var(--n-ink-soft);
    padding:2px 2px 9px}
  .nego-card.is-past{cursor:default;background:var(--n-paper);opacity:.92}
  .nego-card.is-past:hover{border-color:var(--n-line)}
  .nego-st.past{margin-left:0;background:var(--n-badge-bg);color:var(--n-slate);border:1px solid #dde5ee}
  html.dark .nego-st.past{border-color:var(--color-neutral-700);color:var(--n-ink-soft)}
  .nego-past-thread{margin-top:9px;border-top:1px dashed var(--n-line);padding-top:8px}
  .nego-counterline{font-size:12px;color:var(--n-ink-soft);margin-bottom:7px}
  .nego-contested{border-left:2px solid var(--n-reject);background:var(--n-del-bg);border-radius:0;
    padding:6px 9px;margin-bottom:8px;font-size:12px;line-height:1.5;color:var(--n-ink)}
  .nego-hash{font-family:var(--n-font-mono);font-size:12px;color:var(--n-slate-soft);
    background:var(--n-badge-bg);border:1px solid #dde5ee;border-radius:0;padding:4px 7px;
    margin-bottom:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  html.dark .nego-hash{border-color:var(--color-neutral-700)}
  .nego-acts{display:flex;gap:6px}
  .nego-acts button{flex:1;border-radius:0;padding:6px 0;font:inherit;font-size:13px;font-weight:700;
    border:1.5px solid transparent;background:var(--n-paper);cursor:pointer;transition:all .12s ease}
  .nego-acts .b-acc{border-color:var(--n-accept);color:var(--n-accept)}
  .nego-acts .b-acc:hover{background:var(--n-accept);color:#fff}
  .nego-acts .b-rej{border-color:var(--n-reject);color:var(--n-reject)}
  .nego-acts .b-rej:hover{background:var(--n-reject);color:#fff}
  .nego-acts .b-dis{border-color:#c9d5e1;color:var(--n-slate-soft)}
  html.dark .nego-acts .b-dis,html.dark .nego-acts .b-undo{border-color:var(--color-neutral-700)}
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
  .nego-index-send button{width:100%;border:0;border-radius:0;padding:8px 0;font:inherit;font-size:13px;
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
  .nego-index-send .why{display:block;font-size:12px;line-height:1.45;color:var(--n-ink-soft);margin-top:5px}
  .nego-bulk{display:flex;gap:8px;margin-top:10px}
  .nego-bulk button{flex:1;border:0;border-radius:0;padding:7px 0;font:inherit;font-size:13px;
    font-weight:700;color:#fff;cursor:pointer;transition:filter .12s ease}
  .nego-bulk .b-acc{background:var(--n-accept)}
  .nego-bulk .b-rej{background:var(--n-reject)}
  .nego-bulk button:hover{filter:brightness(1.08)}
  .nego-bulk button:disabled{opacity:.45;cursor:not-allowed;filter:none}

  /* ---- threads on a fingerprint ---- */
  .nego-thread{margin-top:10px;border-top:1px dashed var(--n-line);padding-top:10px;display:none}
  .nego-thread.open{display:block}
  .nego-thead{display:flex;align-items:center;gap:8px;margin-bottom:7px}
  .nego-tlabel{flex:1;min-width:0;font-size:11px;letter-spacing:.09em;font-weight:700;letter-spacing:.5px;
    text-transform:uppercase;color:var(--n-ink-soft)}
  /* The way back to a card the size it was, at the top of the thread so a long
     conversation never puts it out of reach. */
  .nego-tmin{flex:none;border:1px solid var(--n-line);background:var(--n-paper);
    color:var(--n-ink-soft);border-radius:0;padding:2px 9px;font:inherit;font-size:12px;
    font-weight:700;cursor:pointer;transition:background .12s ease,color .12s ease}
  .nego-tmin:hover{background:var(--n-badge-bg);color:var(--n-slate)}
  /* A CEILING ON THE CONVERSATION. Without it one change with a dozen replies
     fills the index and pushes every other change on the table off the screen.
     The thread keeps its own scroll; the card keeps its shape. */
  .nego-tbody{max-height:260px;overflow-y:auto;padding-right:2px;
    display:flex;flex-direction:column;gap:6px}
  .nego-compose{display:flex;gap:6px;margin-top:8px}
  .nego-compose input{flex:1;min-width:0;border:1px solid var(--n-line);border-radius:0;
    padding:6px 9px;font:inherit;font-size:13px;background:var(--n-paper);outline:none}
  .nego-compose input:focus{outline:2px solid var(--n-focus);outline-offset:1px;border-color:transparent}
  .nego-compose button{background:var(--n-slate);color:#fff;border:0;border-radius:0;padding:0 12px;
    font:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .nego-compose button:hover{filter:brightness(1.12)}

  /* ---- the status bar ---- */
  .nego-status{flex:none;display:flex;align-items:center;gap:0;background:var(--n-slate-deep);
    color:#c6d2de;font-size:12px;padding:0 16px;height:30px;overflow-x:auto}
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
    font:inherit;font-size:12px;font-weight:700;box-shadow:var(--n-shadow-pop);cursor:pointer}

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
  /* ONE TYPE SCALE, ONE JOB. --rl-doc-type is the document canvas — set to
     read like the Doc page's contract sheet, so switching tabs never changes
     the size of the wording being judged. Declared once so it cannot drift
     within itself. --rl-type, the card scale, RETIRED WITH ITS LAST CONSUMER
     (16 Aug 2026): the routing row carries no wording, its own sizes are the
     literal chrome sizes every card element always had, and a token nothing
     reads is a token nobody can read. */
  .redline-page{--rl-doc-type:15px}
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
  .redline-page .rl-head{display:flex;flex-wrap:nowrap;align-items:center;gap:7px;flex:none;
    align-self:stretch;padding-bottom:0}
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
  .redline-page .rl-tabrow{flex-wrap:wrap;background:var(--color-surface);margin:0;padding:0 24px;
    height:44px;gap:12px;align-items:stretch;box-shadow:inset 0 -1px var(--color-divider);
    border-bottom:0}
  /* ---- BUT BEFORE IT WRAPS, IT TIGHTENS ----
     Reported off two laptops side by side (Young, 10 Aug 2026): on a ThinkPad
     the controls dropped to a second line below the tabs, and that line comes
     straight out of the contract's height — "the space for the contract has to
     be maintained at all times". ThinkPad-class screens (1366–1536px of window)
     are the ordinary corporate laptop, not an edge case, so the second line
     cannot be the ordinary answer there.

     So rlFitTabRow tries middle steps first, where every control keeps its box
     and its press but the things that repeat what a tooltip already says stand
     down. That was ONE step and is now four — see the next comment, which is
     where the rungs and the reason for them are written out. */
  /* ---- AND IT FOLDS ONE RUNG AT A TIME (owner-reported, 13 Aug 2026) ----
     The tighten step was ALL OR NOTHING, and that is the fault as photographed
     twice, with the nav rail open and collapsed: "even though I have
     significant space where I have highlighted, the buttons should not be
     minimized."

     MEASURED, at a 1280px window: the row is 1166px wide and its contents want
     1167. One pixel. The fold then took the words off both purple buttons, the
     way-out button, Publish Round's counts and the type readout at once —
     freeing 402px, which became an empty gap in the middle of the row with
     glyphs at either end. The ladder was right and its bottom rung was a cliff.

     So the middle step is now FOUR rungs, and each one gives up exactly one
     named thing. Cumulative — trim stays on under lite, lite under half and so
     on — so each rule below is written once, on the rung where that loss
     happens:

       trim   whitespace. Nothing disappears at all.
       lite   the commentary: Publish Round's counts, the type readout. Both
              are restated in a tooltip a hover away.
       half   the way-out button's WORD. Its count stays — a door reading "3"
              still says what is behind it; a bare arrow does not.
       tight  the two purple buttons fold to their glyphs. LAST, because these
              are the words the report was about.

     Only if even tight does not fit does the row wrap, with the full words
     back — a line of its own has room for them. The words are spans precisely
     so all of this is a paint decision: textContent never changes, which is
     also why every test that reads the labels still can. */
  .redline-page .rl-glyph{display:none}
  .redline-page .rl-tabrow.rl-tabrow-trim .rl-head{gap:5px}
  .redline-page .rl-tabrow.rl-tabrow-trim .rl-seg{padding:0 7px}
  .redline-page .rl-tabrow.rl-tabrow-trim .rl-needs{padding:0 9px;gap:6px}
  /* The stepper joined this row on 13 Aug 2026 and folds like everything else
     on it: the readout stands down and the two buttons stay, because A⁻ and A⁺
     are the control and "15px" is the commentary. display:none rather than a
     rewrite — textContent never changes, which is what the suite reads. */
  .redline-page .rl-tabrow.rl-tabrow-lite .rl-send-detail{display:none}
  .redline-page .rl-tabrow.rl-tabrow-lite .rl-type-out{display:none}
  /* The way back keeps its own rules rather than sharing a selector with the
     purple buttons: it folds for the same reason and is not the same control,
     and it folds one rung EARLIER now — a door with a count on it survives
     losing its word better than a verb survives losing its. */
  .redline-page .rl-tabrow.rl-tabrow-half .rl-livelist .rl-word{display:none}
  .redline-page .rl-tabrow.rl-tabrow-half .rl-livelist{padding:6px 8px;gap:5px}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn .rl-word{display:none}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn .rl-glyph{display:inline}
  .redline-page .rl-tabrow.rl-tabrow-tight .rl-pb-btn{padding:6px 9px}
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
     index.html, because the contract page draws the same row.

     ---- THE 2px MARGIN WAS A GREY SEAM (owner-asked 23 Aug 2026) ----
     It read "the same 2px side padding the strip below it has", and that stopped
     being true when this page took the mock-up's white head on 22 Aug: the head
     above went full-bleed (measured x=256 w=1234) and this row kept margin
     0 2px 2px, so it drew at x=258 w=1230 with two pixels of page ground down
     each side and two more beneath it — a grey hairline framing the lower half
     of a band that is meant to read as one white object. The row is flush now,
     and the first tab still starts on the head's own vertical because both
     carry the same 24px padding. Set no margin here again. */
  .redline-page .rl-tabrow{margin:0;flex:none;align-items:stretch;gap:8px}
  .redline-page .rl-tabrow #rl-contract-jump{align-self:center;max-width:260px}
  /* The tab group is the only thing in this row that stretches; the round tag
     rides at its centre rather than being pulled to the row's full height. */
  .redline-page .rl-tabrow .rl-round{align-self:center}
  .redline-page .rl-round{flex:none;font-size:12px;font-weight:700;padding:2px 8px;border-radius:0;
    background:var(--st-amber-bg);color:var(--st-amber-fg);border:1px solid color-mix(in srgb,var(--st-amber-dot) 25%,transparent)}
  /* ---- THE TEXT-SIZE STEPPER ----
     A⁻ / readout / A⁺ in a slate pill (the reference's bg-slate-100 p-1
     rounded-xl border-slate-200), the buttons w-6 h-6 white. It steps
     --rl-doc-type, the one token the whole canvas is set from, and the
     readout is the live value — mono, because it is a measurement. Defined
     here and reused verbatim by the Doc tab's toolbar (contract.js calls
     redlineLayoutCss() first), so the two strips render the same control. */
  .rl-type-step{display:flex;align-items:center;gap:4px;flex:none;
    background:var(--color-neutral-100);border:1px solid var(--color-divider);padding:4px;border-radius:0}
  .rl-type-step button{width:24px;height:24px;flex:none;display:inline-grid;place-items:center;
    background:#fff;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;
    font:inherit;font-size:12px;font-weight:700;color:var(--color-neutral-700);line-height:1;
    transition:background .12s,border-color .12s}
  .rl-type-step button:hover{background:var(--color-bg);border-color:var(--color-neutral-300)}
  .rl-type-step button:disabled{opacity:.4;cursor:not-allowed}
  .rl-type-step .rl-type-out{min-width:34px;text-align:center;font-family:var(--font-mono);
    font-size:12px;font-weight:600;color:var(--color-neutral-700)}
  html.dark .rl-type-step{background:rgba(148,163,184,.14);border-color:rgba(148,163,184,.28)}
  html.dark .rl-type-step button{background:rgba(15,23,42,.5);border-color:rgba(148,163,184,.32);color:var(--color-neutral-300)}
  html.dark .rl-type-step button:hover{background:rgba(15,23,42,.75)}
  html.dark .rl-type-step .rl-type-out{color:var(--color-neutral-300)}
  /* ---- ONE SHELL FOR EVERY CONTROL ON THIS ROW ----
     34px tall, 9px radius, on the hairline. Colour is reserved for the one
     primary act (Publish Round) and for small status dots, so the strip reads
     as one object rather than as five competing buttons. The pressed face of a
     segmented pair is RAISED — white on the tray with a shadow under it —
     rather than filled with the accent: two accent fills on one row would
     compete with the act. */
  /* ---- THE CONTROL CARRIES ITS OWN CLOTHES (15 Aug 2026) ----
     These were scoped to .redline-page, which is the mounted component — right
     while every segmented control in the product sat inside one. The reading
     switch is drawn in the counterparty's page HEADER now, which is beside the
     mount and not in it, so the scoped rules did not reach it and the three
     words rendered as one run of unstyled text: "RedlinedAs agreedWith
     changes". Caught by a screenshot; jsdom resolves no cascade and would never
     have seen it.
     So the selector follows the BUILDER rather than one of its homes — one
     control, one set of clothes, wherever rlReadSegsHtml puts it. The
     .redline-page copies are kept beside them at the same specificity so
     nothing inside the mount changes weight. */
  .rl-segwrap,
  .redline-page .rl-segwrap{display:flex;align-items:center;gap:3px;background:var(--color-neutral-100);
    border:1px solid var(--color-divider);padding:3px;border-radius:0;height:34px;flex:none}
  /* 10px, not 12: five of these sit on the tab row and the four pixels each
     one gives back are what lets a 1600px laptop keep the controls up there
     instead of dropping them to a line of their own. */
  .rl-seg,
  .redline-page .rl-seg{border:0;background:none;font:inherit;font-size:13px;font-weight:400;
    height:26px;padding:0 10px;border-radius:0;cursor:pointer;color:var(--color-neutral-500);
    white-space:nowrap;transition:background .12s,color .12s}
  .rl-seg.on,
  .redline-page .rl-seg.on{background:var(--color-surface);color:var(--color-text);font-weight:600;
    box-shadow:0 1px 2px rgba(15,23,42,.08)}
  html.dark .rl-seg.on,
  html.dark .redline-page .rl-seg.on{background:var(--color-neutral-200);box-shadow:none}
  /* ---- WHAT IS WAITING ON YOU ----
     A quiet button with an amber dot: the dot is the news, the words are the
     count and the arrow says it goes somewhere. Deliberately NOT filled — it
     is a way into the work, not the act that ends the round. */
  .redline-page .rl-needs{display:flex;align-items:center;gap:8px;height:auto;flex:none;border:0;
    background:none;border-radius:0;padding:0;font:inherit;font-size:13px;font-weight:400;
    color:var(--st-amber-fg);cursor:pointer;white-space:nowrap}
  .redline-page .rl-needs:hover{border-color:var(--color-neutral-400);color:var(--st-amber-fg);
    background:none;text-decoration:underline}
  .redline-page .rl-needs-dot{width:8px;height:8px;border-radius:0;background:var(--st-amber-dot);
    flex:none;animation:none}
  .redline-page .rl-needs-go{color:var(--color-neutral-400)}
  /* ---- THE FLOATING NOTICES ----
     Bottom-right, over the page, never a band above the contract. See the note
     at the markup for why. Capped so a long sentence cannot become a panel,
     and pointer-events only on the cards themselves so the empty column below
     them does not swallow clicks on the document. */
  ${''/* ---- IN FLOW, NEVER OVER THE PAGE (owner-asked 23 Aug 2026: "I do not
         want anything floating over the page") ----
         This was position:fixed at the bottom-right, 344px wide, sitting on top
         of whatever the reader was looking at — measured on the contract room,
         over the Checks card and the activity feed, with no way to dismiss it
         since the fold was removed the day before.
         It is an ordinary block now: full width of the surface that mounts it,
         above the work rather than across it. pointer-events:none went with
         the fixed position — it existed so a mostly-empty floating layer would
         not swallow clicks meant for the document underneath, and in flow there
         is nothing underneath. The cards keep their own pointer-events:auto,
         which is now simply the default. */}
  .rl-notices{display:flex;flex-direction:column;gap:9px;margin:0 0 10px}
  .rl-notices:empty{display:none;margin:0}
  ${''/* ---- A CARD FLOATS; A ROW SITS IN FLOW ----
         The reading notice was drawn as a card — caption over a paragraph over
         a button — which is right for something floating in a corner and wrong
         the moment it takes a row above the contract: MEASURED at 109px, which
         is a band across the top of the work, and this product has an owner
         rule against exactly that (12 Aug 2026). So in the in-flow stack it
         lays out as ONE LINE: what you are reading, and the way back, side by
         side. It measures about a quarter of what it did.
         SCOPED TO THE READING NOTE. rlOneNoticeHtml's band — a review that is
         holding you, or a desk that is — genuinely has more to say than fits on
         a line, and it is rarer still; it keeps the card. */}
  .rl-notices #rl-read-note{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
    padding:7px 12px}
  .rl-notices #rl-read-note .rl-note-t{margin:0;flex:1;min-width:180px}
  .rl-notices #rl-read-note .rl-note-btn{margin-top:0;flex:none}
  .rl-note-card{pointer-events:auto;border:1px solid var(--color-divider);
    background:var(--color-surface);border-radius:0;padding:12px 14px;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .rl-note-k{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;
    letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500)}
  .rl-note-dot{width:6px;height:6px;border-radius:0;background:var(--color-neutral-400);flex:none}
  .rl-note-t{margin:6px 0 0;font-size:14px;line-height:1.5;color:var(--color-neutral-600)}
  .rl-note-btn{margin-top:10px;height:29px;border:1px solid var(--color-divider);
    border-radius:0;background:var(--color-surface);padding:0 12px;font:inherit;font-size:13px;
    font-weight:600;color:var(--color-accent-700);cursor:pointer}
  .rl-note-btn:hover{border-color:var(--color-accent-700)}
  /* ---- THE NOTICES THAT USED TO BE BANDS ----
     The review's banner and the desk's reading band are built elsewhere (
     js/review.js and js/desk.js) and carry their own colours, because those
     colours mean something — amber is waiting, ruby is a refusal, green came
     back cleared. What they do NOT carry any more is the shape of a band:
     inside this stack they are cards, so the bottom margin they used to need
     to clear the document comes off and the stack's own gap spaces them. */
  .rl-notices .rv-banner,
  .rl-notices .dk-notice{pointer-events:auto;margin:0;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  /* They were laid out as one wide row — tag, sentence, button, all on a line
     that had the width of the page. In a 344px card that line has to wrap, and
     the button belongs under the sentence rather than squeezed beside it. */
  .rl-notices .dk-notice{flex-wrap:wrap}
  .rl-notices .dk-notice .dk-notice-txt{flex:1 1 100%;min-width:0}
  .rl-notices .rv-banner [data-rv-act]{white-space:nowrap}
  /* ---- THE BELL AND THE HIDE CHIP ----
     The alerts fold to one small button (see rlFloatingNoticesHtml). Amber,
     because that is this product's "something is waiting" colour, with a dot
     riding the rim so a glance says there is news behind it. The Hide chip is
     quiet — minimising is housekeeping, not an act. Both hug the corner
     (flex-end) rather than stretching to the stack's width. */
  .rl-notices-fab{pointer-events:auto;align-self:flex-end;position:relative;
    width:42px;height:42px;border-radius:0;border:1px solid var(--st-amber-line);
    background:var(--st-amber-bg);color:var(--st-amber-fg);cursor:pointer;font-size:17px;line-height:1;
    display:flex;align-items:center;justify-content:center;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .rl-notices-fab:hover{filter:brightness(.97)}
  ${''/* ---- GREEN AND BLINKING WHILE THERE IS NEWS (owner-asked 23 Aug 2026) ----
         The bell is amber for WORK and green for NEWS YOU HAVE NOT SEEN — see
         rlBellIsNews for why those are two different things and only one of
         them is settled by looking.
         IT STOPS. Three seconds of pulse and then it holds the green: a control
         that flashes all afternoon is one the reader learns to look away from,
         which is the opposite of what it is for. The COLOUR stays until the
         bell is opened, so nothing is lost by the animation ending.
         AND IT RESPECTS THE READER'S OWN SETTING. Somebody who has asked their
         computer for reduced motion gets the green and no pulse at all — the
         signal is in the colour, and the movement is only an amplifier. */}
  .rl-notices-fab.is-news{border-color:var(--st-green-line);background:var(--st-green-bg);
    color:var(--st-green-fg);animation:rl-bell-news 1s ease-in-out 0s 3}
  .rl-notices-fab.is-news .rl-fab-dot{background:var(--st-green-dot)}
  @keyframes rl-bell-news{
    0%,100%{box-shadow:0 16px 36px -14px rgba(15,23,42,.34),0 0 0 0 color-mix(in srgb,var(--st-green-dot) 55%,transparent)}
    50%{box-shadow:0 16px 36px -14px rgba(15,23,42,.34),0 0 0 9px color-mix(in srgb,var(--st-green-dot) 0%,transparent)}
  }
  @media (prefers-reduced-motion:reduce){
    .rl-notices-fab.is-news{animation:none}
  }
  ${''/* IT CARRIES THE NUMBER SINCE 23 Aug 2026, because the bell now opens the
     workspace alerts panel and a door has to say how much is behind it. It was
     a bare 10px square — a dot that said "something", on a control whose whole
     job is now "how many". Sized off the digits with a min-width so 1 and 9+
     are the same object, and the surface-coloured ring is what keeps it legible
     over the bell's own amber or green face. */}
  .rl-fab-dot{position:absolute;top:-5px;right:-5px;min-width:17px;height:17px;padding:0 3px;
    border-radius:0;background:var(--st-amber-dot);border:2px solid var(--color-surface);
    color:#fff;font-size:11px;font-weight:700;line-height:13px;text-align:center;
    font-variant-numeric:tabular-nums}
  /* ---- AND HIDE IS A CONTROL, SO IT IS COLOURED LIKE ONE ----
     Reported (Young, 12 Aug 2026): "the hide button needs to be more visible".
     It was grey on white at the corner of a floating card and read as a caption
     rather than as something to press. It takes the accent wash the rest of the
     app's quiet controls wear — the same three tokens, not a new colour — which
     is enough to say "pressable" without competing with the amber bell it turns
     back into. */
  .rl-notices-min{pointer-events:auto;align-self:flex-end;border:1px solid var(--color-accent-300);
    background:var(--color-accent-100);border-radius:0;padding:5px 11px;font:inherit;font-size:12px;
    font-weight:700;color:var(--color-accent-800);cursor:pointer;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .rl-notices-min:hover{background:var(--color-accent-200,var(--color-accent-100));
    border-color:var(--color-accent)}
  /* Focus mode is the document and nothing else, and a floating card over it
     is the "nothing else". */
  .redline-page.rl-focus .rl-notices{display:none}
  /* ---- AND THE STRIPS THAT USED TO BAND THE TOP OF THE CONTRACT ----
     "Changes returned" and "ready to sign" were full-width bands above the
     document on the Document tab, and the readiness signal was one above the
     three columns on Negotiate. They are cards in this stack now (Young, 12 Aug
     2026: "nothing draws as a full-width band across the top of the contract").
     They keep their own colours, which mean something — amber is waiting, green
     came back cleared — and lose the band's geometry: no top and bottom rule
     across the page, no flex:none row in the page's column, and their contents
     wrap inside 344px instead of stretching on one line. The inline styles on
     the builders are the band's, so these have to outrank them. */
  .rl-notices #ready-strip,
  .rl-notices #changes-strip{display:block!important;padding:12px 14px!important;
    border:1px solid var(--color-divider)!important;border-radius:0!important;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34);pointer-events:auto}
  .rl-notices #ready-strip{border-color:var(--st-green-line)!important}
  .rl-notices #ready-strip[data-stale="1"]{border-color:var(--st-amber-line)!important}
  .rl-notices #changes-strip{border-color:var(--st-amber-line)!important}
  .rl-notices #ready-strip > span,
  .rl-notices #changes-strip > span{display:block}
  .rl-notices #ready-strip > span + span,
  .rl-notices #changes-strip > span + span{margin-top:6px}
  .rl-notices #ready-strip > span:first-child,
  .rl-notices #changes-strip > span:first-child{display:inline-block}
  .rl-notices #ready-strip button,
  .rl-notices #changes-strip button{margin-top:10px}
  /* The spacer that pushed the button to the far right of a page-wide band has
     nothing to push against in a card, and an empty flex child with flex:1
     still claims a line of its own. */
  .rl-notices #ready-strip > span[style*="flex:1"],
  .rl-notices #changes-strip > span[style*="flex:1"]{display:none}
  /* The readiness signal keeps its own clothes (it is already a bordered box)
     and only loses the margin it needed to clear the page. */
  .rl-notices .nego-readysig{margin:0!important;pointer-events:auto;
    box-shadow:0 16px 36px -14px rgba(15,23,42,.34)}
  .rl-notices .nego-readysig .nego-tbtn{align-self:flex-start}
  /* ---- THIS ROW FOLLOWS THE PLATFORM'S BUTTON RULE (owner-asked 22 Aug 2026:
     "the theme of how the buttons are designed should continue across the
     platform") ----
     Three levels, the same three .ui-btn carries in index.html: the ordinary
     verb wears an accent border on a transparent face, and exactly ONE control
     on the page is filled. This row cannot simply USE .ui-btn — its metrics are
     load-bearing, because rlFitTabRow measures the row in pixels against a
     four-rung fold ladder — so it keeps its own 11.5px/700 sizing and takes the
     platform's FACE. Change one, change the other. */
  .redline-page .rl-btn{border:1px solid color-mix(in srgb,var(--accent-solid) 45%,transparent);
    background:transparent;color:var(--color-accent-700);
    font:inherit;font-size:13px;font-weight:700;padding:6px 12px;
    border-radius:0;cursor:pointer;white-space:nowrap}
  .redline-page .rl-btn:hover:not(:disabled){background:color-mix(in srgb,var(--accent-solid) 10%,transparent);
    border-color:var(--accent-solid)}
  .redline-page .rl-btn:disabled{opacity:.45;cursor:not-allowed}
  /* The playbook pass keeps a colour of its own — it is the one control here
     that is not about THIS negotiation's traffic, and the violet is what tells
     a reader at a glance that pressing it changes nothing on the table. */
  .redline-page .rl-btn-alt{background:transparent;color:#6d28d9;
    border-color:color-mix(in srgb,#8b5cf6 45%,transparent)}
  .redline-page .rl-btn-alt:hover:not(:disabled){background:color-mix(in srgb,#8b5cf6 10%,transparent);
    border-color:#8b5cf6}
  html.dark .redline-page .rl-btn-alt{color:#c4b5fd}
  /* ---- AND THE FILL CAME OFF TOO (owner-reported 23 Aug 2026: "the publish
     round button should also not be shaded") ----
     This was the page's ONE filled act, and it is the third time that rule has
     been reversed by the same hand: the contract room's lead button gave its
     fill up on 22 Aug for the same reason. The pattern is settled now — this
     owner reads a filled face as shouting, not as leading, and every head row
     in the product is flat.
     BOTH BUTTONS THAT WEAR THIS CLASS CHANGE, not just the one in the
     screenshot: Publish Round and Close Round are both .rl-btn-go, and filling
     one while flattening the other would leave the row inconsistent in a new
     way — which is exactly the report that came back last time.
     WHAT IT KEEPS is .rl-btn's accent border and ink plus its own 700 weight,
     so the act still LEADS its row by weight and position. The glow came off
     earlier for its own reason and stays off. */
  .redline-page .rl-btn-go{background:none;color:var(--color-accent-800);
    border-color:var(--accent-solid)}
  .redline-page .rl-btn-go:hover:not(:disabled){
    background:color-mix(in srgb,var(--accent-solid) 10%,transparent);
    border-color:var(--accent-solid)}
  html.dark .redline-page .rl-btn-go{color:var(--color-accent-300)}

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
  .redline-page .rl-btn-blast:hover{background:var(--st-green-fg);animation:none}
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
    background:var(--color-surface);border-radius:0;padding:6px 8px;font:inherit;font-family:var(--font-mono);
    font-size:12px;font-weight:600;color:var(--color-text);cursor:pointer}
  .redline-page select.rl-jump:hover{border-color:var(--color-neutral-300)}
  /* THE OPEN LIST, DRESSED TOO. Browsers draw a select's popup themselves —
     the hard black edge — unless the select opts into base-select, which
     hands the picker to this stylesheet: soft grey border, rounded, the
     app's own hover and selection tints. Browsers without base-select
     ignore all of this and keep their native popup, which is the correct
     fallback: styling degrades, the control never does. */
  .redline-page select.rl-jump,
  .redline-page select.rl-jump::picker(select){appearance:base-select}
  .redline-page select.rl-jump::picker(select){border:1px solid var(--color-neutral-300);border-radius:0;
    background:var(--color-surface);padding:4px;margin-top:4px;
    box-shadow:0 8px 24px rgba(15,23,42,.14)}
  html.dark .redline-page select.rl-jump::picker(select){border-color:rgba(148,163,184,.35);
    box-shadow:0 8px 24px rgba(0,0,0,.5)}
  .redline-page select.rl-jump option{font:inherit;font-family:var(--font-mono);font-size:12px;font-weight:600;
    color:var(--color-text);padding:6px 9px;border-radius:0;cursor:pointer}
  .redline-page select.rl-jump option:hover,
  .redline-page select.rl-jump option:focus{background:var(--color-neutral-100)}
  .redline-page select.rl-jump option:checked{background:color-mix(in srgb,var(--accent-solid) 12%,transparent);
    color:var(--color-accent-600)}
  html.dark .redline-page select.rl-jump option:checked{color:var(--color-accent-400)}
  /* The playbook pass wears the Copilot's violet — an AI act, visibly not one
     of the engine's own verbs, and disabled it says it is thinking. */
  /* ---- THE WAY BACK TO THE LIST ----
     NEUTRAL, not the purple of the two buttons beside it. Those are acts on
     this negotiation; this is navigation off it, and a page and an act must
     not share a colour any more than they share a word. It carries a count
     chip rather than a bare label so the door says how many are behind it —
     one reading, negoLiveList, shared with the list's own heading.
     align-self:center because the row is align-items:stretch and a door has
     no business being as tall as the control group. */
  .redline-page .rl-livelist{flex:none;align-self:center;display:inline-flex;align-items:center;
    gap:7px;border:0;background:none;color:var(--color-accent-800);border-radius:0;padding:0;
    font:inherit;font-size:13px;font-weight:400;cursor:pointer;
    transition:background .12s,border-color .12s,color .12s}
  .redline-page .rl-livelist:hover{background:none;border-color:var(--color-neutral-400);
    color:var(--color-text);border:0;text-decoration:underline}
  .redline-page .rl-livelist .rl-livelist-n{font-family:var(--font-mono);font-size:10px;font-weight:700;
    line-height:1.7;color:var(--color-neutral-600);background:var(--color-neutral-100);
    border:1px solid var(--color-divider);border-radius:0;padding:0 6px}
  ${''/* THE PURPLE CAME OFF (owner-asked 20 Aug 2026, off a screenshot of the
        row): the two review buttons wear the "N needs you" chip's own
        neutral clothes — surface, hairline, quiet ink — and keep their bold
        word. Tokens, so the dark theme comes free and the violet dark
        override went with the violet. */}
  .redline-page .rl-pb-btn{flex:none;border:1px solid var(--color-divider);background:var(--color-surface);
    color:var(--color-neutral-700);
    border-radius:0;padding:6px 11px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;
    transition:background .12s,border-color .12s,color .12s}
  .redline-page .rl-pb-btn:not([data-rl-dead]):hover{border-color:var(--color-neutral-400);color:var(--color-text)}
  .redline-page .rl-pb-btn:disabled{opacity:.6;cursor:wait}
  /* ---- THE COUNTERPARTY PREVIEW'S DEAD FACE (19 Aug 2026) ----
     Its own marker rather than :disabled alone, because :disabled on this
     button already means "the playbook pass is running" and wears a wait
     cursor — two states, two looks, or the reader learns neither. The button
     keeps its box (that is the whole point: nothing moves when the toggle is
     flipped), loses its colour weight and its lift, and says on hover which
     press brings it back. */
  .redline-page .rl-tabrow [data-rl-dead]{opacity:.42;cursor:not-allowed;
    box-shadow:none;filter:saturate(.35)}
  /* The presence pill's rules were here — .rl-presence and its green
     .rl-live-dot. Gone with the feature (10 Aug 2026); dead rules for a removed
     control are how one comes back by accident. */
  .redline-page .rl-actions{display:flex;align-items:center;gap:10px;flex:none;flex-wrap:nowrap}
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
    background:#fff;border:1px solid var(--color-divider);border-radius:0;cursor:pointer;color:var(--color-neutral-700);
    transition:background .12s,border-color .12s}
  .redline-page .rl-focus-btn:hover{background:var(--color-bg);border-color:var(--color-neutral-300)}
  html.dark .redline-page .rl-focus-btn{background:rgba(15,23,42,.5);border-color:rgba(148,163,184,.32);color:var(--color-neutral-300)}
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
  /* ---- EXCEPT ON THEIR PAGE, WHERE #rl-banner IS THE WALL LINE ----
     (15 Aug 2026, when focus mode reached the counterparty's seat.) On the
     owner's bench that banner is furniture and standing it down is the point.
     On the counterparty's it carries the ONE sentence this rulebook already
     protects from every other fold: decisions and counter-proposals stay on
     this page until you press Send. A reading posture may hide chrome; it may
     not take a promise off the screen while the reader is deciding. Same
     exception, same reason, as the notice stack's — the wall line never folds. */
  body.pw-focused .redline-page.rl-focus #rl-banner{display:block}
  .redline-page.rl-focus{padding:8px 10px 10px}
  body.rl-focused #side-nav,
  body.rl-focused #top-header{display:none!important}
  ${''/* TWO COLUMNS, THE FIRST ONE ZERO — never one column (owner-reported
     16 Aug 2026, a screenshot of ~900px of dead white left of the contract in
     focus mode; reproduced with two sent receipts in the column). The shell's
     main column is PINNED to grid-column:2 in index.html — deliberately, so
     the floating sidebar below 1500 cannot overlap it. Collapse the template
     to ONE column and that pin pushes the content into an IMPLICIT auto-sized
     column 2, leaving the explicit 1fr column EMPTY on the left. The void's
     size then follows the content's own natural width, which is why a column
     of full cards (whose paragraphs measure wide) hid the fault and a column
     of one-line receipts exposed it. A zero first track keeps the pin
     honest: column 2 is the real 1fr and takes the whole window. */}
  body.rl-focused #app-shell{grid-template-columns:0px minmax(0,1fr)!important;
    grid-template-rows:minmax(0,1fr)!important}
  /* The way out. The button that turned it on is inside the strip that has just
     stood down — a control that hides itself cannot be pressed again — so the
     chip is the exit, and Esc still works beside it. */
  /* ---- ONE DRESS, TWO PAGES (owner-asked 23 Aug 2026) ----
     The counterparty's page has this button too now, and it must not have a
     second look: the LOOK is unscoped, and each page keeps its own rule for
     WHEN to show it — this page on .rl-focus, theirs on body.pw-focused, which
     are genuinely different postures on genuinely different shells. Written
     the other way round (the look scoped, the showing shared) their copy draws
     as an unstyled word in the corner, which is what the first attempt did. */
  .rl-focus-exit{position:fixed;right:18px;bottom:18px;z-index:70;
    align-items:center;gap:7px;border:0;border-radius:0;cursor:pointer;
    font:inherit;font-size:13px;font-weight:700;padding:9px 15px;
    background:var(--accent-solid,var(--color-accent));color:#fff;box-shadow:var(--shadow-md)}
  .redline-page.rl-focus .rl-focus-exit{display:inline-flex}
  .redline-page:not(.rl-focus) .rl-focus-exit{display:none}

  /* the wall — one line, replacing the engine's two banners */
  /* ---- THE CLOTHES FOLLOW THE BUILDER, NOT ONE OF ITS HOMES ----
     Third time in this file. .rl-wall is drawn THREE times and one of them —
     the counterparty's handover notice — sits in .pw-page, outside the
     .redline-page wrapper the other two are mounted in, so it rendered as
     completely unstyled text: no band, no border, no icon colour. The page
     scope stays (the negotiation page's own rules sit at that weight); the
     counterparty's page is named beside it rather than the rule being
     unscoped, because unscoping drops specificity and this file has already
     lost that fight once. */
  .redline-page .rl-wall, .pw-page .rl-wall{display:flex;align-items:flex-start;gap:9px;flex:none;
    background:var(--color-neutral-100);border:1px solid var(--color-divider);border-radius:0;
    padding:7px 12px;font-size:13px;line-height:1.55;color:var(--color-neutral-700)}
  .redline-page .rl-wall-ic, .pw-page .rl-wall-ic{flex:none;color:var(--st-amber-fg)}
  .redline-page .rl-wall b, .pw-page .rl-wall b{color:var(--color-text)}
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
  /* ---- AND IT SCALES TO FILL THE COLUMN, LIKE THE DOCUMENT TAB ----
     (owner-asked, 13 Aug 2026: "widening the negotiation and counterparty
     pages must make the WORDING bigger, not the margin — the thing the
     Document tab already does.")

     THIS IS THE SECOND ATTEMPT, AND THE FIRST ONE IS WORTH RECORDING because
     the reasoning was careful and still wrong. The measure was a flat 720px,
     so dragging the divider bought gutter. The first fix let the SHEET grow
     toward the column with a ceiling tied to the type — more words per line,
     same size words. The owner read it on the real page and reported the
     feature still absent, and they were right: on the Document tab the
     contract visibly GROWS AND SHRINKS as the divider moves, because that tab
     scales the whole sheet. More words per line is a different thing from
     bigger words, and it is not what was asked for.

     SO THE SHEET IS FIXED AGAIN AND THE ZOOM DOES THE WORK — the Document
     tab's own mechanism, the same 660px page, the same fit-to-width maths, the
     same CSS zoom property rather than a transform. One model on all three screens
     instead of two, which is what the earlier note called the tidier answer
     while arguing against it.

     WHAT THAT NOTE WAS AFRAID OF, and why it does not apply. It said a zoom
     layer "between fourteen rectangle readers and the viewport" is where this
     codebase has been burned. True — of the GRID. Every one of those readers
     is outside the document pane: the resizer measures the grid's own width,
     the card pop-out is placed from its card in the other column, and the
     queue overlay and its rail hang off the grid as absolute children. The
     wrapper goes INSIDE the pane, so none of them is inside the zoom at all
     and the rule "do not zoom the grid" is kept literally.

     ONE READER IS INSIDE IT: the selection menu, placed from a range rectangle
     in the paper. CSS zoom is standardised and getBoundingClientRect returns
     the scaled rectangle, so a menu placed from it lands where the words are —
     asserted in the browser rather than assumed, because that is the single
     thing this change could plausibly break.

     THE CEILING IS THE DOCUMENT TAB'S: 2x. Past that a line of contract text
     stops being a contract, and it is the number that screen has been living
     with. Below a 660px column the zoom stays at 1 and the sheet simply fills
     the width, which is what the phone and any stacked layout get. */
  /* ---- THE ZOOM LAYER, AND WHY IT IS *HERE* AND NOWHERE ELSE ----
     The wrapper is INSIDE the document pane. Everything the page measures with
     a rectangle — the resizer against the grid's width, the card pop-out from
     its card, the queue overlay and its vertical rail off the grid — lives
     OUTSIDE it and is untouched by construction. The rule "do not zoom the
     grid" is kept literally: the grid never sees this.

     THE PREFERENCE IS APPLIED EXACTLY ONCE, AND IT IS APPLIED HERE, NOT IN THE
     ZOOM (changed 13 Aug 2026, owner-asked). --rl-doc-type used to be PINNED to
     15px in this rule, with the stepper riding in the zoom instead. The two
     mechanisms were interchangeable for the TEXT — on-screen size is fit ×
     preference either way — but not for the PAGE: with the preference in the
     zoom, choosing 8 shrank the sheet to half its column and left it floating
     in white space. Asked for directly ("lower it to 8 but keep the page
     filling the column"), so the zoom now carries the FIT alone, the sheet
     always fills its column, and the reader's choice is the type inside it.
     The variable is inherited from the .redline-page root, which is where
     rlSetDocType writes it — so it is still set in one place, and pinning it
     here again would take the stepper off this page altogether.

     max-width:660 makes the wrapper min(column, 660) wide: below that the
     sheet simply fills the column at zoom 1, which is what a phone and a
     stacked layout get and what they had before. */
  ${''/* THE WRAPPER CAPS NOTHING NOW. It used to be a 660px page carrier —
         the sheet inside it was exactly that wide and this element magnified
         the pair — so its own max-width was the fixed page. With the sheet
         fluid (see .rl-paper) a 660 cap here is the OLD page width quietly
         still in force: the paper obeyed its 860 and the wrapper clipped it to
         660, which is what "the sheet fills its column" was failing on. */}
  .redline-page .rl-zoom{zoom:1;max-width:none;width:100%;margin:0 auto}
  ${''/* SQUARE CORNERS ON THE SHEET (owner-asked 16 Aug 2026, both seats): a
     contract page prints square, and the rounded sheet read as an app card
     rather than paper. The radius comes off the paper and off the clause
     panel ONLY — every other rounded control on this page keeps its own. */}
  .redline-page .rl-paper{padding:30px 56px 34px;max-width:860px;background:var(--color-doc-warm);
    border:1px solid var(--color-doc-warm-line);border-radius:0;box-shadow:none;margin:0 auto;
    width:100%}
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
  .redline-page .nego-pane.working .rl-paper{padding-left:56px;padding-right:56px}
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
  /* ---- THE FRONT MATTER FOLLOWS THE READER'S TEXT SIZE ----
     (13 Aug 2026.) These four sizes were absolute, and until the same day they
     did not need to be anything else: the reader's choice rode in the zoom, so
     the whole sheet scaled together and a fixed 20px title scaled with it. Now
     the choice is the TYPE and the page holds its width, so anything written
     in bare pixels would have stayed put while the contract under it shrank —
     a document whose title does not follow its body is not one document.

     --doc-scale is that choice as a plain ratio, 1 at the default and 1 where
     nothing sets it, so every other surface these rules dress (a print, an
     export, the Document tab before its zoom is applied) is unchanged. The
     multipliers are each size over the workbench's own 15px base, so at the
     default this rule set computes to exactly the numbers it replaced. */
  .rl-paper-title{margin:10px 0 0;font-family:var(--font-heading);
    font-size:calc(20px * var(--doc-scale,1));font-weight:600;letter-spacing:-.01em;color:var(--color-doc-text)}
  .rl-paper-sub{margin:8px 0 0;font-size:calc(13px * var(--doc-scale,1));color:var(--color-doc-muted)}
  /* The kicker above the title — the Doc page's own line, in its clothes:
     mono, uppercase, wide tracking. Rendered from the document, not invented. */
  .rl-paper-kick,.rl-paper-kick p{margin:0 0 6px;font-size:calc(10px * var(--doc-scale,1));font-weight:600;
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
  .rl-sigfor{display:block;margin-top:8px;font-size:calc(12px * var(--doc-scale,1));color:var(--color-doc-muted);
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
  /* ---- THE BOX IS THE SAME WHETHER OR NOT ANYTHING IS ON THE TABLE ----
     (owner-asked, 19 Aug 2026.) A redlined clause used to gain 14px of
     padding and a 3px rule that an unmarked clause did not have, so the
     moment a change landed the wording slid 14px right and the Edit pill —
     which hangs off the clause's own edge — jumped 17px left. Measured, both
     ways. Every clause reserves the SAME right-hand gutter now, and the rule
     is simply transparent where there is nothing to mark: the mark appears
     and disappears, the geometry never moves. The vertical air stays on the
     marked clause alone, because that is what it was for — the frame that
     says something is on the table — and it moves nothing sideways. */
  .redline-page .rl-clause{margin:0 0 16px;padding:0}
  .redline-page .rl-clause-h{margin:0 0 5px;font-size:var(--rl-doc-type);font-weight:700;
    letter-spacing:.02em;padding-right:calc(62px * var(--doc-scale,1))}
  /* ---- THE CANVAS READS LIKE THE DOC PAGE ----
     One declaration for the whole document canvas — clause bodies, marked
     lines, the recital — set from --rl-doc-type so the wording is the same
     size on both tabs (the seamlessness this scale exists for). The routing
     rows carry no wording and no scale of their own (see the token note at
     the top of this sheet). Declared on the page rather than in :root so it
     cannot leak.

     The editor is named here for the same reason it is named beside .nego-body
     in the room's rules above: it IS the clause body while it is open, and a
     writer whose wording changes size the moment they start typing is being
     shown a different document from the one they are editing. */
  .redline-page .rl-clause-p,
  .redline-page .rl-doc .nego-body,
  .redline-page .rl-doc .nego-editing,
  .redline-page .rl-doc .rl-line{margin:0;font-size:var(--rl-doc-type);line-height:1.75;color:var(--color-text)}
  /* ---- A WRAPPED LIMB HANGS UNDER ITS OWN FIRST WORD ----
     (owner-asked 16 Aug 2026: "the words when wrap texted the should not go to
     the same line as the bullet point. The should be indentation on the wrapped
     sentence or word as well so that the words in the first and second line are
     on the same vertical line.")

     THE INDENT WAS ALREADY BEING COMPUTED AND NOTHING WAS DRAWING IT.
     redlineOpsBlocksHtml has always split the opening marker off every line —
     "7.1", "(b)", "•" — and stamped the line rl-hang for exactly this; see
     RL_MARKER in js/redline.js, whose own comment says the marker sits "in the
     hanging indent's gutter". The rule that acts on it was scoped to
     .nego-redline, which is the room's class and not this page's, so on the
     redline page every wrapped sub-clause ran back to the margin and sat under
     its own number. The class was on the element the whole time.

     The measure is in em, so it follows the reader's document type with the
     wording rather than drifting away from it at either end of the stepper. */
  .redline-page .rl-doc .rl-hang{padding-left:2.6em;text-indent:-2.6em}
  /* And in the clause panel, which renders the same builder's output at its own
     size. Same measure, its own scale. */
  .redline-page .rl-cp-src .rl-hang{padding-left:2.6em;text-indent:-2.6em}
  /* ---- AND THE MARKER FILLS THE MEASURE, SO FIRST LINE AND WRAPS AGREE ----
     (owner-reported 16 Aug 2026, off a screenshot of a bulleted sub-clause:
     "specifications and provided needs to start at the same line as
     manufacture. It should be built how a proper professional contract would
     align.")
     The hang was half the geometry. It set where the WRAPS start (2.6em) and
     let the FIRST line's wording start wherever the marker's own width put it —
     so after a narrow "•" the wording began around 0.8em while its wraps sat at
     2.6em, and the wrapped lines read as indented past their own first word.
     The marker is an inline-block the full width of the hanging measure now:
     the bullet or number sits at the left edge of the gutter and the wording
     starts at the tab stop on EVERY line. min-width rather than width so a wide
     citation is never clipped, and text-indent:0 because an inline-block is a
     block container that would otherwise inherit the line's -2.6em into its own
     first line. Same rule in the panel's copy — one geometry, both homes. */
  .redline-page .rl-doc .rl-hang .rl-marker,
  .redline-page .rl-cp-src .rl-hang .rl-marker{display:inline-block;min-width:2.6em;text-indent:0}
  /* A real list gets the same shape from the browser, but only if it is allowed
     its gutter: the sheet's reset leaves ul/ol at the user-agent padding on
     some surfaces and at zero on others, and at zero the marker sits ON the
     first word. Stated once, here, for both. */
  .redline-page .rl-doc .nego-body ul,.redline-page .rl-doc .nego-body ol,
  .redline-page .rl-cp-src ul,.redline-page .rl-cp-src ol{
    margin:0 0 .5em;padding-left:2.1em;list-style-position:outside}
  .redline-page .rl-doc .nego-body li,.redline-page .rl-cp-src li{margin:0 0 .3em}
  /* the sheet keeps its auto margins — margin:0 here beat the centring rule
     (three classes to two) and pinned the paper to the left of the column */
  .redline-page .rl-doc .nego-doc{margin:0 auto;font-size:var(--rl-doc-type);line-height:1.75;color:var(--color-text)}
  .redline-page .rl-clause-p{margin:0}
  .redline-page .rl-propose{margin-top:7px;border:0;background:none;padding:0;cursor:pointer;
    font:inherit;font-size:13px;font-weight:600;color:var(--color-accent-600)}
  .redline-page .rl-propose:hover{text-decoration:underline}
  /* ---- A REDLINED CLAUSE IS MARKED IN THE MARGIN, NOT WASHED ----
     (owner-asked 16 Aug 2026: "keep the contract page white but add a thin
     redline on the right of the clause to signal a clause that has been
     redlined".) It used to be an amber tint with an amber frame, and on a
     document where most clauses are under negotiation that is most of the page
     tinted — the marker stops marking anything. A rule in the margin says the
     same thing and costs the wording nothing: the page reads as paper again,
     and the clauses that have been argued over are countable down the right
     edge without reading a word. Red, because that is what a redline is called.

     The padding is KEPT so the wording does not shift when a clause gains or
     loses its first change; only the fill and the frame go. */
  /* ---- AND THE MARK GOES IN THE MARGIN, NOT IN THE TEXT COLUMN ----
     The rule was a border on the clause, and a border takes width: a marked
     clause was 17px narrower and 14px further in than an unmarked one, so
     the first change on a clause slid its wording right and its Edit pill
     left. Measured both ways, 19 Aug 2026, and reported by the owner.

     It is a bar in the SHEET'S OWN MARGIN now — outside the text column, in
     the white the page already has — so a clause has exactly the same box
     whether or not anything is on the table, and the mark costs the wording
     nothing. Which is what "marked in the margin" said all along. */
  .redline-page .rl-clause.is-changed{background:none;border:0;border-radius:0;padding:0}
  .redline-page .rl-clause.is-changed::after{content:'';position:absolute;
    top:0;bottom:0;right:-18px;width:3px;border-radius:0;background:var(--danger)}
  html.dark .redline-page .rl-clause.is-changed::after{background:#f87171}
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
  .redline-page .rl-clause.rl-clause-new{background:color-mix(in srgb,var(--st-green-dot) 7%,transparent);
    border-color:color-mix(in srgb,var(--st-green-dot) 34%,transparent)}
  .redline-page .rl-clause-top{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
  /* ---- THE GREEN EDIT PILL (owner-asked, 16 Aug 2026) ----
     Top right of every clause, always drawn, in the emerald this page already
     wears for "your redlines travel on this colour". margin-left:auto rather
     than relying on the row's space-between: a headingless clause — the
     fallback for an upload that arrived as a wall of paragraphs — leaves the
     pill as the row's only child, and space-between would park it on the LEFT,
     which is the one place it was asked not to be.

     IT IS THE SHEET'S FURNITURE, so it follows the sheet's type — the reading
     .rl-asktag already takes (and the retired tool row took before it), and
     the third report of one fault
     (13 and 15 Aug 2026) is enough to apply it without waiting for a fourth.
     And it is CUT FROM THE SELECTION with the rest of the furniture (see
     _NEGO_SEL_CHROME): a drag from above the first word to below the last must
     not sweep the word "Edit" into the passage the Copilot is asked about. */
  ${''/* It wore the nav's own dark fill from 16 to 20 Aug 2026; the icon-only
     dress below replaced it on the owner's ask. */}
  /* ---- AND IT IS PINNED, NOT CARRIED ----
     Out of the heading's flex row and onto the clause's own box, at a fixed
     offset from the gutter above. Equal boxes alone would have aligned it;
     pinning it means no marker invented later — the linked-clause outline,
     the new-clause tint, whatever comes next — can move it either. The
     heading reserves the width (see .rl-clause-h) so no title can run under
     it. The offset is measured from the padding box, so right:0 lands the
     pill on the text column's own right edge — where it has always appeared
     on an unmarked clause, and now on every clause. */
  ${''/* ICON-ONLY SINCE 20 Aug 2026 (owner-asked): the pencil glyph in the
     workspace ACCENT on a transparent face — not too dark, still visible,
     and never neutral grey (the furniture lesson, learned three times).
     Hover puts a light accent tint behind it and deepens the ink. The nav-bg
     fill and the word are retired from the paper; the word survives as
     aria-label and title. */}
  .redline-page .rl-cp-pill{position:absolute;right:0;top:0;z-index:2;flex:none;
    display:inline-flex;align-items:center;justify-content:center;
    border:1px solid transparent;background:transparent;color:var(--accent-solid,#0d9488);
    border-radius:0;padding:calc(3px * var(--doc-scale,1)) calc(4px * var(--doc-scale,1));
    font:inherit;font-size:calc(11px * var(--doc-scale,1));font-weight:700;line-height:1;
    cursor:pointer;white-space:nowrap;-webkit-user-select:none;user-select:none;
    transition:background .15s,color .15s}
  .redline-page .rl-cp-pill svg{width:calc(15px * var(--doc-scale,1));height:calc(15px * var(--doc-scale,1));display:block}
  .redline-page .rl-cp-pill:hover{background:var(--color-accent-100,#ccfbf1);
    color:var(--color-accent-800,#115e59)}
  .redline-page .rl-cp-pill:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  /* Every clause's panel body is in the panel already; opening flips which one
     is on. ONE AT A TIME — the same single-value rule as the card pop-out and
     the ask reveal — so the panel can never show two clauses at once, and
     opening costs a class flip rather than a repaint. */
  .redline-page #rl-cp-body .rl-cp-src{display:none}
  .redline-page #rl-cp-body .rl-cp-src.is-on{display:block}
  /* ---- AND THE TAG FOLLOWS THE READER'S TEXT SIZE TOO ----
     (Owner-reported, 13 Aug 2026: "the clause number pill ... do not
     proportionally shrink and expand with the page, both in owner and
     counterparty side.")

     This is the SECOND HALF of the 13 Aug front-matter fix, and it was missed
     for exactly the reason that fix records: until the reader's choice moved
     out of the zoom, everything on the sheet scaled together and a bare 10.5px
     tag was fine. Afterwards the fit still carried the tag (drag the divider
     and it grows), so it LOOKED handled — the fault only shows on the type
     stepper, where measurement said the pill rendered at an identical
     178.6 x 35.6 at 8px, 15px and 20px while the contract's own words went from
     38.6px tall to 241.3px. At the new floor of 8 the label on a clause was
     bigger than the clause.

     --doc-scale is the same ratio the title, the kicker and the parties at the
     foot already read, 1 wherever nothing sets it — so the print, the export
     and any screen that draws this tag without a stepper are all unchanged. */
  /* ---- "N NOT SENT" (OI-9) ----
     One line and it never wraps: the count and the button are flex:none, the
     middle phrase is the only thing allowed to give and it ellipsises. Measured
     at a 300px column — the narrowest the resizer allows — where it holds one
     line at 41px. */
  ${''/* flex-basis:100%: the band lives inside the head, and since the head
     became one line (Option 1, 16 Aug 2026) a flex item without a basis
     would try to share the caption's line. The band always takes a whole
     line of its own. */}
  ${''/* ---- A THIRD SHORTER (owner-asked 23 Aug 2026, off a screenshot) ----
         MEASURED before it was touched: 50px — a 30px button with 9px of
         padding above and below it and a 1px border each side. The BUTTON was
         what set that height, so trimming the padding alone could not have
         bought a third; it is 22px now against 4px of padding, which measures
         32 and is 36% off. The type comes down one rung with it (14 to 13), or
         a 14px sentence in a 32px band sits with 2px of air above and below
         and reads as clipped rather than as compact.
         WHAT IS NOT TOUCHED: the amber, the border, the wording, the dot and
         the 12px gap to the cards below — this is a height, not a redesign, and
         the band still has to read as the one warning on the column. */}
  .redline-page .rl-unsent{display:flex;flex-basis:100%;align-items:center;gap:9px;
    margin:0 0 12px;padding:4px 8px 4px 10px;border-radius:0;
    border:1px solid var(--st-amber-line);background:var(--st-amber-bg);white-space:nowrap;
    overflow:hidden}
  .redline-page .rl-unsent-dot{width:8px;height:8px;border-radius:0;
    background:var(--st-amber-dot);flex:none}
  .redline-page .rl-unsent-n{font-size:13px;font-weight:600;color:var(--st-amber-fg);flex:none}
  .redline-page .rl-unsent-s{font-size:13px;color:var(--color-neutral-700);flex:1;min-width:0;
    overflow:hidden;text-overflow:ellipsis}
  html.dark .redline-page .rl-unsent-s{color:var(--color-neutral-600)}
  .redline-page .rl-unsent-go{flex:none;border:0;border-radius:0;cursor:pointer;
    background:var(--st-amber-fg);color:#fff;font:inherit;font-size:13px;font-weight:700;
    padding:0 10px;white-space:nowrap;height:22px;display:inline-flex;align-items:center}
  .redline-page .rl-unsent-go:hover:not(:disabled){filter:brightness(1.08)}
  /* ---- A DEAD CONTROL MUST NOT LOOK ALIVE ----
     redlineSyncProxies disables a proxy whose postbox is not on the page, and
     this button had no disabled face at all: it stayed solid amber and fully
     pointing while doing nothing, which is the state that makes a reader blame
     themselves. The standing rule on this page, stated at the KPI picker:
     disabled AND dimmed AND not pointing. */
  .redline-page .rl-unsent-go:disabled{opacity:.45;cursor:not-allowed;filter:none}
  .redline-page .rl-unsent-go:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}

  /* ---- THE CO-PILOT'S FIRST PASS (W3-1) ----
     A band, not a card: it sits in the column head with the unsent band and
     answers the same kind of question — what is in front of you — so it
     wears the same width and the same restraint. Shut it and one line
     remains; the cards below are the work and this is a reading of them.
     Every colour is a status token already in the sheet, because a
     recommendation is a verdict and the product already has three. */
  ${''/* ---- THE STEPPER DOES NOT REACH THIS BAND (owner-reported 22 Aug 2026)
     ----
     Reported off a screenshot at an 11px document setting: "the font adjuster
     should not adjust the fonts in the copilot's first pass ... it should be
     stagnant like the cards but the fonts should be bigger as it is barely
     legible." Both halves were true and they are one fault.

     EVERY SIZE IN HERE WAS calc(px * var(--doc-scale,1)), and --doc-scale is
     written on the .redline-page ROOT by the A-/A+ stepper. The CHANGE CARDS
     twelve pixels below are plain px and do not move. So the one thing on that
     column still shrinking was a reading ABOUT the cards. MEASURED at the
     reported setting (11 against a normal of 15, a scale of 0.73): the bar's
     heading rendered at 8.4px and its four chips at 7.3px, beside a card badge
     holding 12.5px; at the floor of 8 the band drops to about 5px.

     THE PAPER SCALES, THE FURNITURE DOES NOT — the rule this page already
     learned three times, and the clause panel's own pin (.rl-cp-src) is the
     precedent this copies line for line. The pin is belt and braces beside the
     plain px below: it is what stops a rule added inside this band later
     quietly reintroducing the fault.

     AND THE SIZES ARE THE CARDS' OWN, which is the second half of the report:
     the id is the card id's 11.5 mono, the chips the badge's neighbourhood,
     the reasoning the card meta's 12. The two objects finally measure alike. */}
  .redline-page .rl-plan{flex-basis:100%;margin-top:6px;--doc-scale:1}
  .redline-page .rl-plan-bar{display:flex;align-items:center;gap:6px;width:100%;
    border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);
    padding:7px 10px;cursor:pointer;font:inherit;text-align:left}
  .redline-page .rl-plan-bar:hover{border-color:var(--color-accent-300)}
  .redline-page .rl-plan-bar:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
  ${''/* ONE LINE WHILE IT IS SHUT — the band's own stated design. The title
     gives (ellipsis, whole sentence on the bar's hover) and the chips do
     not, which is the same arrangement the unsent band above it uses. */}
  .redline-page .rl-plan-title{font-size:14px;font-weight:700;flex:1;min-width:0;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .redline-page .rl-plan-caret{flex:none;font-family:var(--font-mono);font-size:14px;color:var(--color-neutral-600)}
  .redline-page .rl-plan-chip{flex:none;font-size:13px;font-weight:700;
    border-radius:0;padding:1px 7px;white-space:nowrap}
  .redline-page .rl-plan-accept{background:var(--st-green-bg);color:var(--st-green-fg)}
  .redline-page .rl-plan-push{background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .redline-page .rl-plan-escalate{background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .redline-page .rl-plan-review{background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .redline-page .rl-plan-body{border:1px solid var(--color-divider);border-top:0;
    border-radius:0;background:var(--color-surface);padding:9px 10px 11px}
  .redline-page .rl-plan-note{margin:0 0 8px;font-size:13px;
    color:var(--color-neutral-600);line-height:1.5}
  .redline-page .rl-plan-row{border-top:1px solid var(--color-divider);padding:8px 0 6px}
  .redline-page .rl-plan-row:first-of-type{border-top:0;padding-top:0}
  .redline-page .rl-plan-head{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
  .redline-page .rl-plan-id{font-family:var(--font-mono);font-size:13px;font-weight:700;
    color:var(--color-neutral-600)}
  .redline-page .rl-plan-clause{font-size:14px;font-weight:600;
    min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .redline-page .rl-plan-why{margin:5px 0 0;font-size:14px;line-height:1.5}
  .redline-page .rl-plan-prec{margin:3px 0 0;font-size:13px;
    line-height:1.5;color:var(--color-neutral-600);font-style:italic}
  .redline-page .rl-plan-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
  .redline-page .rl-plan-act{border:1px solid var(--color-divider);border-radius:0;
    background:var(--color-bg);cursor:pointer;font:inherit;font-weight:600;
    font-size:13px;color:var(--color-neutral-600);padding:4px 10px}
  .redline-page .rl-plan-act:hover{border-color:var(--color-accent-300);color:var(--color-accent-700)}

  /* ---- THE ASK TAG (OI-12) ----
     An outline pill with a coloured cap: the cap is whose, the glyph is where
     it stands. It is a BUTTON now — pressing it opens the change under the
     clause — so the reset of the app's button chrome is deliberate. The cap
     stretches with align-items:stretch, which is what makes it read as the
     change card's own left border rather than a dot. */
  .redline-page .rl-asktag{flex:none;display:inline-flex;align-items:stretch;
    font:inherit;font-size:calc(11px * var(--doc-scale,1));
    font-weight:600;letter-spacing:.04em;cursor:pointer;
    border-radius:0;white-space:nowrap;overflow:hidden;
    background:var(--color-surface);color:var(--color-neutral-700);
    border:1px solid var(--color-divider);
    transition:box-shadow .14s ease,border-color .14s ease,background .14s ease}
  .redline-page .rl-asktag-cap{width:calc(5px * var(--doc-scale,1));flex:none}
  .redline-page .rl-cap-them{background:var(--st-amber-dot)}
  .redline-page .rl-cap-us{background:var(--color-accent)}
  .redline-page .rl-asktag-lb{display:inline-flex;align-items:center;gap:calc(5px * var(--doc-scale,1));
    padding:calc(3px * var(--doc-scale,1)) calc(9px * var(--doc-scale,1))
      calc(3px * var(--doc-scale,1)) calc(7px * var(--doc-scale,1))}
  .redline-page .rl-asktag-g{font-weight:700;font-size:calc(12px * var(--doc-scale,1));line-height:1}
  .redline-page .rl-asktag:hover{border-color:var(--color-neutral-400)}
  .redline-page .rl-asktag:focus-visible{outline:2px solid var(--color-accent);outline-offset:1px}
  /* Open: the tag is the thing being read, and it carries its own way out. */
  .redline-page .rl-asktag.on{border-color:var(--color-neutral-500);color:var(--color-text);
    background:var(--color-neutral-100);box-shadow:0 0 0 2px rgba(38,55,74,.10)}
  .redline-page .rl-asktag-x{display:inline-flex;align-items:center;font-weight:700;
    padding-right:calc(8px * var(--doc-scale,1));color:var(--color-neutral-500)}
  /* ---- AND WHAT IT OPENS ----
     Beside the wording, never over it and never instead of it. Quiet ground so
     the clause stays the thing being read. */
  .redline-page .rl-askrv{display:flex;gap:calc(9px * var(--doc-scale,1));
    margin:calc(9px * var(--doc-scale,1)) 0 0;padding:calc(8px * var(--doc-scale,1)) 10px
      calc(8px * var(--doc-scale,1)) 0;border-radius:0;overflow:hidden;
    background:color-mix(in srgb,var(--color-neutral-100) 70%,transparent)}
  html.dark .redline-page .rl-askrv{background:color-mix(in srgb,var(--color-neutral-200) 45%,transparent)}
  .redline-page .rl-askrv-bar{width:3px;flex:none;border-radius:0}
  .redline-page .rl-askrv-them .rl-askrv-bar{background:var(--st-amber-dot)}
  .redline-page .rl-askrv-us .rl-askrv-bar{background:var(--color-accent)}
  .redline-page .rl-askrv-bd{flex:1;min-width:0;padding-left:calc(9px * var(--doc-scale,1))}
  .redline-page .rl-askrv-who{display:block;font-size:calc(11px * var(--doc-scale,1));
    color:var(--color-neutral-600);margin-bottom:calc(4px * var(--doc-scale,1))}
  .redline-page .rl-askrv-who b{color:var(--color-neutral-700);font-family:var(--font-mono);letter-spacing:.02em}
  .redline-page .rl-askrv-wd{font-size:calc(13px * var(--doc-scale,1));line-height:1.6}
  .redline-page .rl-askrv-why{display:block;margin-top:calc(5px * var(--doc-scale,1));
    font-size:calc(12px * var(--doc-scale,1));color:var(--st-ruby-fg);font-style:italic}
  /* The way back out of a settled decision. It rides ON the clause, so it takes
     the sheet's own scale like every other piece of furniture there — the
     lesson of 13 and 15 Aug, applied at the point of writing this time rather
     than after a third report. */
  .redline-page .rl-askrv-act{margin-top:calc(7px * var(--doc-scale,1))}
  .redline-page .rl-askrv-reopen{font:inherit;font-family:var(--font-body);
    font-size:calc(11px * var(--doc-scale,1));font-weight:600;line-height:1.4;
    padding:calc(4px * var(--doc-scale,1)) calc(10px * var(--doc-scale,1));
    border:1px solid var(--color-divider);border-radius:0;
    background:var(--color-surface);color:var(--color-neutral-700);cursor:pointer;
    transition:border-color .15s,color .15s}
  .redline-page .rl-askrv-reopen:hover{border-color:var(--color-neutral-500);color:var(--color-neutral-900)}
  .redline-page .rl-askrv-reopen:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  /* A READING POSTURE IS NOT ON THE PAPER. Print and every export take the
     contract, not what somebody had open while reading it. */
  @media print{ .redline-page .rl-askrv{display:none} }

  /* the design's change cards */
  /* No padding: the cards sit straight on the page like the sheet does, and
     a little room down the right so their shadows are not clipped by the
     scroller. */
  .redline-page .rl-cards{padding:0 16px 16px}   /* one left edge with the head above — see .rl-idx-head */
  .redline-page .rl-cards-empty{padding:6px 2px;font-size:13px;line-height:1.6;color:var(--color-neutral-500);
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
  .redline-page .rl-card{border:1px solid #e8ecf1;border-radius:0;padding:12px 14px 14px;
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
  .redline-page .rl-card-id{font-family:var(--font-mono);font-size:12px;font-weight:600;
    background:var(--color-neutral-100);color:var(--color-neutral-700);border-radius:0;
    padding:2px 8px;white-space:nowrap}
  /* The round the ask belongs to, at the far right of the head — "R3" — so a
     card carried over from an earlier round says so without being opened. */
  .redline-page .rl-card-round{font-family:var(--font-mono);font-size:12px;font-weight:700;
    color:var(--color-neutral-500);flex:none;margin-left:6px}
  /* ---- THE STATUS CORNER IS A WORD, NOT A PILL (owner-asked, 12 Aug 2026) ----
     It was a capsule: a tint, a border and 3px/9px of padding around 10.5px
     text. On a 285px card whose head already carries an id, a round tag and
     an open button, the capsule was one more enclosed shape in a row of
     enclosed shapes, and the thing the reader actually wanted — the WORD —
     was the smallest type on the card.

     So the fill, the border and the padding go and the word carries the
     colour on its own. It is larger and heavier than the pill's text was
     (11.5px/700 against 10.5px/600) because it no longer has a background to
     separate it from the card: weight is what does that job now.

     WHAT DOES NOT CHANGE, and each of these is load-bearing:
       · the ELEMENT, its .rl-badge class and its tone class. Half this
         product and half the test suite asks that slot where a change
         stands; it is the card's ONE status slot and it keeps its identity;
       · the four TONES and their meanings — amber = not gone yet, steel =
         in flight, green = agreed, ruby = refused or held — and the tokens
         they are painted from. Only the -bg and -line halves of each token
         stop being used here; the -fg half is the word.
     The review mark beside it keeps its box on purpose: after this change it
     is the only enclosed shape left in the row, which is what makes it read
     as a mark rather than as another status. Do not tidy it away. */
  .redline-page .rl-badge{font-size:14px;font-weight:700;white-space:nowrap;padding:0;border:0;
    border-radius:0;background:none;line-height:1.3}
  .redline-page .rl-badge-sent{color:var(--st-steel-fg)}
  .redline-page .rl-badge-draft{color:var(--st-amber-fg)}
  .redline-page .rl-badge-ok{color:var(--st-green-fg)}
  .redline-page .rl-badge-no{color:var(--st-ruby-fg)}
  /* DARK MODE DID SOME OF THE CONTRAST WORK IN THE FILL. The four -fg tokens
     were chosen to sit on a 15% tint of their own colour; on the bare card
     surface the two darkest of them — the amber and the steel — read thin, so
     they are lifted here and only here. The light palette needs nothing: all
     four of its -fg values are already dark saturated ink on white. */
  html.dark .redline-page .rl-badge-sent{color:var(--color-accent-200)}
  html.dark .redline-page .rl-badge-draft{color:#fcd34d}
  /* ---- THE ORIGIN PILL'S RULES WENT WITH THE PILL (12 Aug 2026) ----
     .rl-origin / .rl-origin-us / .rl-origin-them and their two dark overrides
     are DELETED, not left behind: an emerald-and-indigo pair, elided by
     flex:0 1 auto so a long company name could give width back to the status
     badge. All of it described an element no renderer draws any more, and a
     stylesheet full of rules matching nothing is a stylesheet nobody can read.
     Flag any mention of those five class names as stale.

     WHAT IS NOT DELETED is the ORIGIN ITSELF: data-rl-origin on the card is
     still stamped, and the rule a few lines above — .rl-card[data-rl-origin]
     painting the left spine amber for theirs — is the channel that survives.
     The pill said whose ask it was in words; the edge says it in colour, and
     the column's own Mine / Theirs filter and the card's meta line say it in
     words twice over. */
  /* The on-behalf stamp reads as a CAUTION, not as decoration: it is the line
     that stops a card being taken as something the other side sent. */
  /* REGULAR WEIGHT, 22 Aug 2026. It was 600, and on a two-line name ("Entered
     by Wanjiru K. on behalf of Amina Wanjiru · Nordfrakt Logistik AB") that
     made a provenance note the loudest thing on the card — louder than the
     WORDING the card exists to show. The caution is carried by the amber rule
     and the tint, which is what a caution is for; bolding every word of the
     sentence as well is the third signal for one fact this file keeps warning
     about. The claim it makes is unchanged and so is its colour. */
  .redline-page .rl-card-behalf{margin-top:6px;border-left:2px solid var(--st-amber-dot);
    background:var(--st-amber-bg);border-radius:0;padding:5px 9px;
    font-size:13px;font-weight:400;line-height:1.5;color:var(--st-amber-fg);
    overflow-wrap:anywhere}
  .redline-page .rl-card-why{margin-top:6px;border-left:2px solid var(--color-accent);
    background:color-mix(in srgb,var(--color-accent) 6%,transparent);border-radius:0;
    padding:6px 9px;font-size:14px;line-height:1.55;color:var(--color-text);
    overflow-wrap:anywhere}
  .redline-page .rl-card-why-k{display:block;font-size:11px;font-weight:700;letter-spacing:.09em;
    text-transform:uppercase;color:var(--color-accent-800);margin-bottom:2px}
  /* A caption may shout; a name may not. This one is "Achieng Otieno said". */
  .redline-page .rl-said-k{text-transform:none;letter-spacing:.01em}
  .redline-page .rl-card-meta{font-size:13px;color:var(--color-neutral-500);line-height:1.5}
  .redline-page .rl-counterline{font-size:12px;color:var(--color-neutral-500);line-height:1.5;margin-top:2px}
  /* ---- WORK BIG, RECEIPTS SMALL (owner-asked 16 Aug 2026, Option 4) ----
     The two-line greyed preview is BACK on working cards — a card asking for
     a decision must say what is being decided — and a change that needs
     nothing shrinks to a one-line receipt instead of spending a card of
     height on finished business. See the receipt branch in
     redlineChangeCardsHtml for which is which. */
  .redline-page .rl-card-diff{font-size:14px;line-height:1.6;color:var(--color-neutral-700);
    display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;
    margin-top:7px}
  .redline-page .rl-receipt{padding:9px 12px}
  .redline-page .rl-receipt-line{display:flex;align-items:center;gap:8px;min-width:0}
  .redline-page .rl-receipt-line .rl-card-lead{flex:none;min-width:0}
  .redline-page .rl-receipt-line .rl-badge{flex:none}
  ${''/* The clause takes the slack and ellipsises; margin resets because
     .rl-card-meta's own top margin was written for a stacked head. */}
  .redline-page .rl-receipt-cl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis;margin-top:0}
  .redline-page .rl-card-verbs{margin-top:8px}
  /* ---- OPEN, THE ROW'S ONE DOOR (16 Aug 2026) ----
     The routing row's word-button into the clause panel. It replaced the
     pop-out's &#10530; (.rl-pop-btn — stale, with the whole .rl-pop-* family
     and .rl-card-popped: the floating panel is retired and the clause panel is
     the reading surface). A word rather than a glyph, because the glyph was
     added to fix a caret nobody recognised as a control and a bare mark is the
     same fault one size up. */
  .redline-page .rl-open-btn{flex:none;margin-left:2px;padding:0 12px;display:inline-flex;
    align-items:center;cursor:pointer;font:inherit;font-size:14px;font-weight:400;line-height:1.6;
    border:1px solid var(--color-divider);border-radius:0;background:var(--color-surface);
    color:var(--color-neutral-600);transition:border-color .13s,color .13s,background .13s;
    height:30px}
  .redline-page .rl-open-btn:hover{border-color:var(--color-accent);color:var(--color-accent-700);
    background:var(--color-accent-100)}
  .redline-page .rl-open-btn:focus-visible{outline:2px solid var(--color-accent);outline-offset:2px}
  /* The head is the press target — it takes you to the clause — and says so. */
  .redline-page .rl-card-head{cursor:pointer}
  /* The strips that stay visible on the row — on-behalf, revised-by, the
     author's reason, the reviewer's note. They used to sit in .rl-card-body,
     hidden on the card and shown only by the pop-out; the pop-out is retired
     and a fact behind a control that no longer exists is a fact lost. */
  .redline-page .rl-card-info{cursor:default}

  /* Compact pills, right-aligned: each verb is only as wide as its word, so the
     card's information leads and the actions follow. flex:1 stretched them into
     a wall of colour that outweighed the change itself. */
  .redline-page .rl-card-verbs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px;margin-top:9px}
  ${''/* ---- EVERY BUTTON WEARS THE HEAD ROW'S OWN LINE (owner-asked 24 Aug
         2026: "all the buttons should have a similar border line like share
         and more have in the platform right now") ----
         MEASURED first: Share and More carry 1px of the accent at 45%, and
         these verbs carried border:0 — Accept and Send were filled washes,
         Reject and Edit bare coloured words. So a card offered three different
         KINDS of control where the head row offers one.
         THE SAME VALUE, WRITTEN ONCE: --rl-btn-line is declared beside the head
         row's own rule and read here, so the two cannot drift the way this
         row's three accent borders once did.
         THE INK IS UNTOUCHED and is what still tells the verbs apart — accept
         green, refuse red, edit grey. What goes is the FILL: a border the same
         colour as the fill behind it is not a border, so the outline the owner
         asked for is only visible on a flat face. */}
  .redline-page .rl-card-verbs button{border:1px solid var(--rl-btn-line);border-radius:0;
    padding:0 12px;font:inherit;
    font-size:14px;font-weight:400;line-height:1;cursor:pointer;transition:filter .15s;
    height:30px;display:inline-flex;align-items:center;background:transparent}
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
  ${''/* THE PRIMARY VERB GOES FLAT SO ITS OUTLINE CAN BE SEEN. It was a filled
         accent face with white ink; a border the colour of the fill behind it
         is not a border. It keeps its 700 — the row still says which verb
         leads — and takes --accent-ink, the token that HAS a dark answer, so
         the night theme needs no second rule. WHITE INK WOULD HAVE SURVIVED
         THE FILL: this rule scores (0,2,0) and the base (0,2,1), so the base's
         transparent background wins while color:#fff here would not have
         been beaten — white on a clear face. Caught by reading the cascade,
         not by looking. */}
  .redline-page .rl-card-verbs .rl-acc,.redline-page .rl-card-verbs .rl-send{
    background:transparent;color:var(--accent-ink);font-weight:700}
  .redline-page .rl-card-verbs .rl-acc:hover,.redline-page .rl-card-verbs .rl-send:hover{
    background:color-mix(in srgb,var(--accent-solid) 10%,transparent)}
  ${''/* ---- NO LINES ROUND THE CARD'S OWN VERBS (owner-reported 22 Aug 2026,
         off the mock-up's card: "for the cards, the bottom buttons do not have
         lines around them") ----
         This REVERSES the same day's "the outline is the verb's own ink" IN
         PLACE, and the story is worth keeping because it is this file's
         favourite trap twice over.

         These two rules were written with 'border:1px solid …' and this file's
         own comment described the result — "the no and the alternative recede
         to an outline". MEASURED that morning, both computed border-width 0:
         ".redline-page .rl-card-verbs button" sets border:0 and scores
         (0,2,1), and a bare ".redline-page .rl-rej" scores (0,2,0) and loses.
         So the outline had never once drawn, and the fix was to write them at
         the winning specificity. THE MOCK-UP AGREES WITH THE ACCIDENT, not
         with the intention: its .h-btn carries 'border:1px solid transparent'
         and only the one 'ghost' (Open) and the one filled act (Send) show an
         edge. A row of four bordered verbs at the foot of a small card is the
         fence .ui-btn-plain exists to avoid.

         SO THE BORDER GOES AND THE SPECIFICITY STAYS. The rules keep their
         three-class selector deliberately: it is what makes them win, so the
         next person who wants to give these verbs an edge gets one, and a rule
         that looks right here now really is right. What each verb keeps is its
         own INK — red for the refusal, accent for the alternative — which is
         the 17 Aug lesson (a neutral-grey control reads as furniture) and is
         untouched by this.

         redline-verify section 6 measures the computed border-width, which is
         the only place either the old fault or this decision can be seen at
         all; f89 holds the claim about what the stylesheet SAYS. */}
  ${''/* border:0 here was written when the row had none; at three classes it
         beats the base and would keep these two bare. They carry the row's own
         line now — the same variable, so nothing can drift. */}
  .redline-page .rl-card-verbs .rl-rej{background:transparent;border:1px solid var(--rl-btn-line);
    color:var(--danger-hover)}
  .redline-page .rl-card-verbs .rl-rej:hover{background:color-mix(in srgb,var(--danger-hover) 10%,transparent)}
  .redline-page .rl-card-verbs .rl-edit{background:transparent;border:1px solid var(--rl-btn-line);
    color:var(--color-accent-700)}
  .redline-page .rl-card-verbs .rl-edit:hover{background:color-mix(in srgb,var(--accent-solid) 10%,transparent)}
  html.dark .redline-page .rl-rej{color:#fda4af}
  ${''/* Accent, not the neutral it carried while it had a border to hold it
     together. A bare grey word at night IS the furniture the 17 Aug report was
     about; with the outline gone the ink is the only thing left saying this is
     a control. Dark does not redefine the accent ramp, so -300 is the step
     that reads on an almost-black panel — the same correction .rl-idx-n took
     when Render B was measured. */}
  html.dark .redline-page .rl-edit{color:var(--color-accent-300)}
  /* ---- THE SPENT SEND MARKER IS GONE FROM THE CARD (owner-asked, 13 Aug) ----
     .rl-sent, .rl-sent-tick, .rl-sent-cap and the two rules that kept the
     marker at full strength and unhovered are all DELETED — flag any mention
     of them as stale, along with the #fef3c7 amber they replaced a day
     earlier.

     THIS REVERSES A DECISION FROM A FEW COMMITS AGO. On 12 Aug the marker was
     kept, in the app's neutral tokens, on the argument that a verb vanishing
     on success leaves the reader unsure whether they pressed it. The owner has
     read that argument and decided against it: the status corner now says Sent
     in plain sight, one line above, and the loss of the second confirmation is
     weighed and accepted. So the action bar draws nothing at all where the
     Send used to be. It is not a mistake to argue with. */

  /* ---- THE LINK BETWEEN A CLAUSE AND ITS CARD ----
     Both ends light at once, whichever end was clicked, because the point of
     the pairing is that they are one thing shown twice. ON THE PAPER the mark
     is a THIN GREY DOTTED LINE (owner-asked 16 Aug 2026, off a screenshot):
     the solid accent ring read as a heavy blue box around the contract's own
     words, and the paper is the one surface that must stay quiet — an outline,
     so it costs the wording no width and moves nothing. Both seats inherit it,
     the same rule. The CARD keeps the accent ring: a row in a column is
     furniture, and there the stronger mark is what makes the pairing findable. */
  .redline-page .rl-clause.is-linked{outline:1px dotted var(--color-neutral-400);
    outline-offset:3px}
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
  ${''/* The head's text sits INSET from the column edge (owner-asked 16 Aug
     2026, off a screenshot: "too close to the edge of the page"). The inset is
     PADDING so the bottom rule still runs the column's width — a rule that
     stopped short of its own caption would read as a broken line, and that is
     still exactly why it is padding rather than margin.
     THE INSET IS 16px SINCE THE COLUMN BECAME A CARD (22 Aug 2026). It was 2,
     which was right against a transparent pane sitting on the page and wrong
     the moment there is a card edge two pixels away — the mock-up's own rail
     insets its contents 16. The cards below take the same 16 rather than their
     old 2, so the caption, the unsent band and every card share one left edge,
     which is what the mock-up draws and what makes the column read as one
     object. The head's rule still runs the card's full inner width. */}
  .redline-page .rl-idx-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px;
    background:none;border:0;border-bottom:1px solid var(--color-divider);border-radius:0;
    padding:0 16px 10px;margin:0 0 12px}
  /* The tabs carry their own bottom padding down to the rule, so the head must
     not carry it too. :has() and not a class because the filter's absence is
     decided in the renderer (a reviewer's column has no filter — see the note
     at the control) and the head should not need telling twice. Where :has()
     does not resolve, the fallback is the padding above: tabs sitting 9px
     clear of the rule rather than on it, which is a worse line and not a
     broken one. */
  .redline-page .rl-idx-head:has(.rl-fsegwrap){padding-bottom:0}
  .redline-page .rl-idx-head [hidden]{display:none!important}
  ${''/* the read-only sentence also lives inside the head; on the one-line
     head it must never share the caption's line. */}
  .redline-page .rl-idx-head .nego-why{flex-basis:100%}
  ${''/* ---- THE CAPTION SHARES THE TABS' LINE AGAIN (owner-asked 23 Aug 2026:
     "move the all, mine, their to sit next to tracked changes as opposed to
     below it") ----
     THIS REVERSES render B1 of the same day, IN PLACE. B1's reasoning was that
     "a 19px figure cannot share a line with a 12px caption without one of them
     looking like a mistake", and it is a real argument — the owner has looked
     at both and wants the line back, so the size difference is the price and it
     was named before this was built. The 19px count is UNTOUCHED, deliberately:
     shrinking it to make the row sit comfortably would be reversing a second
     decision nobody asked about, and it is one word to do later.

     flex:1 1 auto, so the caption takes what is left and the tabs (flex:none)
     are pushed to the right wall — the arrangement of 16 Aug. THE WRAP IS THE
     FALLBACK AND IS DELIBERATELY KEPT: .rl-idx-head is still flex-wrap:wrap, so
     a column dragged narrow drops the tabs to their own line rather than
     crushing the caption. That is what makes this safe at the 300px the divider
     still allows.

     THE padding-top WENT WITH THE LINE. It existed to push a caption sitting
     ABOVE the tabs down toward them; beside them the head's own
     align-items:center is what lines the two up, and the padding would push the
     caption off that centre. Its two short-window overrides went with it.

     AND IT IS BLACK. B1 is "all of it black" — the caption, the counts and the
     words. This is a DELIBERATE EXCEPTION to the four-shades rule (primary is
     14px and up; the secondary shade is where 11-13px lives), taken knowingly
     and scoped to this one row: the owner was shown B3, which keeps the caption
     and the small word grey and blacks only the 19px count, and chose B1. Do
     not sweep this outward — the captions under a signpost are not the
     signpost, and a pass that took every mid-grey to primary was reverted once
     already for exactly that. */}
  .redline-page .rl-idx-k{flex:1 1 auto;min-width:0;font-size:12px;font-weight:700;letter-spacing:.12em;
    text-transform:uppercase;color:var(--color-text)}
  .redline-page .rl-idx-n{flex:none;font-family:var(--font-mono);font-size:12px;font-weight:700;
    letter-spacing:.01em;font-variant-numeric:tabular-nums;color:var(--color-neutral-500);
    background:none;border:0;border-radius:0;padding:0;line-height:1.2}
  .redline-page .rl-idx-n.is-live{color:var(--color-accent-800)}
  ${''/* Found while measuring the row (22 Aug 2026): the dark theme does not
     redefine the accent ramp, so accent-800 is a deep green sitting on an
     almost-black panel — 2.4:1, under any readable threshold, and the live
     count all but disappeared at night. The narrowed reviewer's head is the
     one place this count still draws, so it is the one place to fix. */}
  html.dark .redline-page .rl-idx-n.is-live{color:var(--color-accent-300)}
  /* ---- WHOSE ASKS: THE THREE-WAY CUT ----
     A segmented control, not a dropdown, so all three answers and the live one
     are readable without opening anything — the difference between a filter you
     can forget you set and one you cannot.

     NO TRAY AT ALL, now that there is no band to sit it on. A tray is how you
     say "these three belong together" when they float on open ground; hung off
     the head's own rule they are already grouped by it, and a bordered tray
     inside a bordered head was one frame too many. The live cut is marked the
     way a tab is marked — a 2px accent underline overlapping the rule, so the
     hairline reads as the resting state of the control rather than as a
     separate line the control happens to sit near.

     THE TABS TAKE THEIR NATURAL WIDTH (flex:none, not flex:1). Stretched to
     thirds they read as three buttons; at their own width with a real gap they
     read as three labels, which is what a filter is.

     ONE LINE WITH THE CAPTION (owner-chose Option 1, 16 Aug 2026). This used
     to take a full line of its own (flex-basis:100%) under a caption AND a
     separate count — two rows saying one number twice. The separate count is
     gone wherever the tabs draw (All N is the count), the caption's flex:1
     pushes the tabs to the right wall, and the head is one ruled line. On a
     column too narrow for both, flex-wrap drops the tabs to a second line —
     the old arrangement, as the fallback rather than the rule. */
  ${''/* ---- THE COUNT IS THE MARKER (owner-chose Render B, 22 Aug 2026) ----
     Four renders were drawn for this row and this is the one taken. WHAT WAS
     WRONG: at 12px and 600 weight with an underline, the live cut and the two
     resting ones were nearly the same object, and the number — the thing a
     reader actually scans this row for — was set at opacity .62, which is
     about 2.5:1 on white and the faintest text on the column.

     SO THE NUMBER CARRIES THE STATE. Every count sits in its own square box:
     resting boxes are a hairline outline, the live one FILLS. The underline is
     gone entirely — the fill already says which cut is being read, and two
     marks for one fact is how they come to disagree.

     THE FILL IS accent-700, NOT --accent-solid, and the reason is measured
     rather than aesthetic: white on accent-600 is 3.74:1, under the 4.5 a
     10.5px number needs, while accent-700 is 5.5:1 in the teal workspace and
     about 11:1 in the navy one. Both themes take the same fill for the same
     reason, so there is no dark override to keep in step.

     AND THE RESTING COUNTS GOT MORE LEGIBLE, not less: opacity .62 became a
     real ink (neutral-500), which is 4.8:1 on white and 7:1 in the dark.

     WHAT DID NOT CHANGE, because it is the safety of the control: three
     options and no more, every option showing its OWN count unmoved by the
     filter, and a row of choices rather than a dropdown. */}
  .redline-page .rl-fsegwrap{flex:none;display:flex;gap:26px;padding:0;background:none;border:0;
    border-radius:0}
  ${''/* THE SIZE MOVED, THE DESIGN DID NOT (22 Aug 2026). The render bumps
         these to 14px; the Render B decisions taken six days earlier — the
         transparent underline that reserves the row's height, the hairline box
         round a resting count, the accent-700 fill on the live one — are the
         owner's own, chosen off four drawn options for measured contrast
         reasons, and were NOT part of what the render reversed. They stay. */}
  .redline-page .rl-fseg{flex:none;min-width:0;display:flex;flex-direction:column;align-items:flex-start;
    gap:1px;border:0;border-bottom:2px solid transparent;background:none;font:inherit;
    color:var(--color-text);padding:0 0 9px;margin-bottom:-1px;border-radius:0;cursor:pointer;
    white-space:nowrap;transition:color .12s,border-color .12s}
  ${''/* ONE COLOUR DECLARATION FOR THE WHOLE TAB, and the number and the word
     INHERIT it. That is what makes B1 a two-line change rather than six: the
     resting state, the hover and the live state each set 'color' once on the
     button and both children follow. Give either child a colour of its own and
     the state stops reaching it — which is exactly how Render B's live count
     and its live word came to be set in two places. */}
  .redline-page .rl-fseg:hover{color:var(--accent-ink)}
  .redline-page .rl-fseg.on{background:none;color:var(--accent-ink);
    border-bottom-color:var(--accent-solid)}
  /* A borderless button gets no focus ring from the browser worth having. */
  .redline-page .rl-fseg:focus-visible{outline:2px solid var(--color-accent);
    outline-offset:2px;border-radius:0}
  /* The count rides INSIDE its own tab: it is the thing that stops a filter
     hiding a change quietly, so it must be readable on the resting face too. */
  ${''/* ---- THE COUNT IS THE HEADLINE AND THE WORD IS ITS CAPTION ----
     Render B's own arrangement: the figure at 19px with the cut's name in
     11px underneath it. The box round each count is GONE and so is the fill on
     the live one — those were Render B-of-22-Aug's answer to a row where the
     number was the faintest thing on the column, and the number is now the
     largest thing on it, so a box round it is a second mark for a fact the size
     already carries. THE SAFETY PROPERTIES ARE UNTOUCHED, and they are the
     condition on redressing this control at all: three options and no more,
     every option showing its OWN count unmoved by the filter, and a row of
     choices rather than a dropdown.

     NO font-family HERE. It used to name --font-mono to keep the digits even;
     every face in this product resolves to Inter now, so the declaration said
     nothing, and font-variant-numeric is what actually lines the digits up. */}
  .redline-page .rl-fseg-n{flex:none;font-size:19px;font-weight:600;line-height:1.1;
    letter-spacing:-.01em;font-variant-numeric:tabular-nums;
    padding:0;background:none;border:0;border-radius:0}
  .redline-page .rl-fseg-w{flex:none;font-size:11px;font-weight:600;letter-spacing:.05em;
    text-transform:uppercase;line-height:1.35}
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
    padding:8px 12px;border-radius:0;font-size:13px;line-height:1.5;
    border:1px dashed var(--color-divider);background:var(--color-bg);color:var(--color-neutral-700)}
  .rl-rv-docnote span{flex:1;min-width:0}
  .rl-rv-docnote button{flex:none;font:inherit;font-size:12px;font-weight:700;cursor:pointer;
    border-radius:0;padding:3px 10px;border:1px solid var(--color-divider);
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
  .redline-page .rl-cnotes-k{font-size:12px;font-weight:700;letter-spacing:.08em;
    text-transform:uppercase;color:var(--color-neutral-400)}
  /* Long sentences wrap inside the card, and so does a long unbroken run — a
     URL or a word typed without spaces would otherwise set the card's width
     and push the column wider than its pane. min-width:0 on the author cell
     for the same reason: a flex child will not shrink below its content
     without it, so the timestamp was the first thing to go. */
  .redline-page .rl-cnote{margin-top:8px;min-width:0;padding:8px 10px;border-radius:0;
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
    font:inherit;font-size:12px;font-weight:700;color:var(--color-accent-700);cursor:pointer}
  .redline-page .rl-cnote-more:hover{text-decoration:underline}
  /* ---- THE BUTTON AND THE PROMISE FOLLOW THE SWITCH ----
     Each carries both faces; the pressed side of the visibility switch decides
     which one shows. Both stay in textContent, which is what the tests read. */
  .redline-page .rl-cnotes .rl-when-sh{display:none}
  .redline-page .rl-cnotes:has(.v-sh[aria-pressed="true"]) .rl-when-sh{display:inline}
  .redline-page .rl-cnotes:has(.v-sh[aria-pressed="true"]) .rl-when-int{display:none}
  .redline-page .rl-cnote-top{display:flex;align-items:baseline;gap:7px;
    font-size:13px;margin-bottom:2px;color:var(--color-neutral-400)}
  .redline-page .rl-cnote-top b{min-width:0;overflow-wrap:anywhere;font-weight:600;color:var(--color-neutral-600)}
  .redline-page .rl-cnote-int{margin-left:auto;flex:none;border:1px solid var(--color-divider);
    border-radius:0;padding:1px 7px;font-size:12px;font-weight:600;color:var(--color-neutral-500)}
  .redline-page .rl-cnote p{margin:0;font-size:14px;line-height:1.55;color:var(--color-neutral-700);
    white-space:pre-wrap;overflow-wrap:anywhere}
  .redline-page textarea.rl-cnote-in{width:100%;margin-top:9px;border:1px solid var(--color-divider);
    border-radius:0;padding:8px 10px;font:inherit;font-size:14px;line-height:1.5;
    color:inherit;background:var(--color-surface);outline:none;box-sizing:border-box}
  .redline-page textarea.rl-cnote-in:focus{border-color:var(--color-accent-500)}
  .redline-page .rl-cnote-foot{display:flex;align-items:center;gap:9px;margin-top:7px}
  .redline-page .rl-cnote-add{flex:none;border:1px solid var(--color-divider);border-radius:0;
    background:var(--color-surface);padding:5px 12px;font:inherit;font-size:14px;font-weight:400;
    color:var(--color-neutral-700);cursor:pointer}
  .redline-page .rl-cnote-add:hover{border-color:var(--color-neutral-400);color:var(--color-text)}
  /* The promise under the button. It is the whole of what this composer is,
     so it is drawn beside it rather than in a tooltip. */
  .redline-page .rl-cnote-hint{font-size:13px;color:var(--color-neutral-400);min-width:0}
  /* The shared composer look, repeated inside this page's own stylesheet
     because the workbench also mounts as an EMBED on the counterparty portal,
     which does not carry the shell's head. Same declarations as index.html. */
  .redline-page textarea.chat-field{resize:none;overflow-y:auto;max-height:7.5em;line-height:1.5;
    white-space:pre-wrap;overflow-wrap:anywhere;font-family:inherit;box-sizing:border-box}
  .redline-page .nego-visswitch{display:flex;gap:4px;margin-bottom:6px}
  .redline-page .nego-visswitch button{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:0;padding:3px 8px;font:inherit;font-size:12px;font-weight:600;cursor:pointer;
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
  ${''/* THE FALLBACK COLUMNS ARE THE RESTING SPLIT, NOT A RATIO. rlLayoutResizer
         writes pixels over these the moment it runs, but a mount it has not
         reached yet — the counterparty's own page, the first frame of a paint —
         drew a 2:1 ratio while the owner's bench opened at a fixed 460px
         change column. Two seats, two widths, on markup whose whole claim is
         that they measure alike (parity-verify). Same number, both places. */}
  .redline-page .rl-grid{flex:1;min-height:0;position:relative;display:grid;gap:14px;
    grid-template-columns:minmax(0,1fr) 460px;align-items:stretch;
    /* ---- CLIP, NOT HIDDEN, AND THAT IS WHAT STOPPED THE PAGE SHAKING ----
       (owner-reported 16 Aug 2026: "the page shakes rather than have a smooth
       transition".) Reproduced and MEASURED before it was touched: with the
       clause panel parked off the right edge the grid's scrollWidth was 2008
       against a clientWidth of 1462 — 546px of overflow nobody could see,
       because overflow:hidden shows no bar. But hidden still makes a SCROLL BOX,
       a scroll box can be scrolled by the browser: moving focus to the panel's
       close button, which happens at the instant it opens and while it is still
       parked, made Chrome scroll the grid sideways to reveal it — dragging the
       contract and the change column bodily left, then snapping them back as
       the slide finished. That is the shake, and it was never the transition.

       overflow:clip clips identically and creates NO scroll box at all, so there is
       nothing left to scroll. The focus call asks for preventScroll besides —
       two independent answers, because this is the kind of fault that comes
       back through a door nobody remembered. The queue never showed it: it
       parks off the LEFT edge, and negative overflow adds no scrollWidth. */
    overflow:clip}
  /* ...and it has to be written at THIS weight to land. The engine declares
     #nego-root .nego-work{overflow:hidden} and the grid wears both classes, so
     an id-scoped rule outranks the plain one above and the clip was silently
     ignored - measured, the computed value stayed hidden. Written against the
     same id plus the class it also carries, which beats it on specificity
     rather than on sheet order (not in this file's favour; see the note above
     .rl-paper). */
  .redline-page #rl-grid.nego-work{overflow:clip}

  /* ---- THE QUEUE IS AN OVERLAY, NOT A COLUMN (owner-asked, 12 Aug 2026) ----
     It used to be a third grid track — about 300px of it — and the comment that
     stood here argued for that: "a grid column rather than an overlay so it
     scrolls and stacks with the panes instead of floating over the contract".
     That has been overruled. The complaint was the one the argument could not
     answer: the queue was taking its width off the CONTRACT, which is the thing
     being judged, and its chevron only narrowed it to a rail that still held a
     track. Nothing but closing it gave the width back.

     SO IT USES THE ACTIVITY PANEL'S MECHANISM, not a second one invented here:
     off-screen by a transform, over a dimmed scrim, dismissed by the scrim, by
     Escape or by the control that opened it. Nothing behind it moves — the grid
     is two tracks again and never changes.

     IT SLIDES FROM THE LEFT, for two reasons. The queue has always been the
     left-hand column and is read first, so bringing it in from the right would
     move a thing the reader knows to the opposite side of the page. And the
     right-hand edge is already spoken for: the floating notices stack sits at
     bottom-right and the Copilot launcher beside it, and a panel arriving over
     both is a panel that covers the two controls a reader reaches for while
     they work.

     ---- AND IT IS ANCHORED TO THE PAGE, NOT TO THE WINDOW (owner-asked,
     12 Aug 2026). It was pinned to the viewport's own left edge, which is not
     this page's edge: the sidebar and the shell's gutter sit between them, so
     the panel and its door arrived on top of the app's furniture rather than
     against the surface they belong to.

     THE WALL IS .rl-grid, which is position:relative already (the resizer
     needs it) and is the nearest positioned ancestor of both — so absolute
     lands them on the working area's own left border: below the toolbar, down
     to the foot of the page, flush with where the contract begins. That is the
     page's inner left edge on the bench, on the contract tab's embed and on
     the counterparty's page alike — each one against ITS OWN wall, which is
     what a window-anchored panel could never do for a mount that is not
     full-screen. .redline-page is positioned too (see FOCUS MODE above); the
     grid simply wins, and it is the better of the two. */
  .redline-page .rl-queue{
    position:absolute;left:0;top:0;bottom:0;z-index:56;
    width:min(320px,88vw);min-width:0;border-radius:0;
    border:0;border-right:1px solid var(--color-divider);
    box-shadow:var(--shadow-lg);
    transform:translateX(-105%);
    /* HIDDEN WHILE SHUT, and that is not belt-and-braces. Parked off the
       WINDOW's edge there was nothing left to see; parked off the PAGE's edge
       it sits over the sidebar — on screen, in the way, and still tabbable.
       visibility takes it out of sight and out of the tab order. It is
       switched with no delay on the way IN so the slide is still watched, and
       only after the slide on the way out. */
    visibility:hidden;
    transition:transform .3s cubic-bezier(.22,.61,.36,1),visibility 0s linear .3s;
  }
  .redline-page .rl-queue.is-open{transform:none;visibility:visible;
    transition:transform .3s cubic-bezier(.22,.61,.36,1),visibility 0s}
  .redline-page .rl-q-scrim{
    position:fixed;inset:0;z-index:55;
    background:color-mix(in srgb,#020617 45%,transparent);
    opacity:0;pointer-events:none;transition:opacity .25s;
  }
  .redline-page .rl-q-scrim.is-open{opacity:1;pointer-events:auto}
  /* Motion is a preference. With it reduced the panel still arrives; it stops
     sliding. Same rule the Activity panel carries. */
  @media (prefers-reduced-motion:reduce){
    .redline-page .rl-queue{transition:none}
    .redline-page .rl-q-scrim{transition:none}
  }
  /* ---- THE CLAUSE PANEL IS THE CARDS COLUMN ----
     Owner-asked, 16 Aug 2026: "Stop it at the cards column so no words are
     covered. End at cards column but also in the position where you can expand
     it and minimize right to left with the cards and the contracts using the
     divider feature already available."

     ---- IT HAS NO WIDTH OF ITS OWN, AND THAT IS THE WHOLE DESIGN. It shipped
     with a number (520px), then with a proportion (48%), and both were the same
     mistake in different clothes: a second opinion about how wide the right of
     this page should be, standing beside the one the reader already sets with
     the divider. Two opinions drift. So the panel is placed in the grid's
     SECOND TRACK — grid-column 2, grid-row 1, inset to it — and takes whatever
     the cards column currently is. Absolutely-positioned children of a grid
     container are laid out against the grid AREA they name, so this needs no
     JavaScript and there is nothing to keep in step: drag the divider and the
     panel is already the new width, in the same frame as the contract.

     THREE THINGS FALL OUT OF IT, all of them things that were separately wrong:
     · NO WORD OF THE CONTRACT IS EVER COVERED. Its left edge is the divider.
     · THE CLAUSE PILLS STAY IN THE CLEAR, so pressing another clause's Edit
       swaps the panel straight to it. Before this the pills were under the
       panel and switching clauses meant closing first.
     · IT INHERITS THE DIVIDER'S OWN LIMITS (RL_LEFT_MIN / RL_RIGHT_MIN, and the
       amber grip that says so), so it can be neither squeezed to a sliver nor
       widened until the contract is unreadable. One control, one set of rules.

     ---- AND THERE IS NO SCRIM (owner-reported 16 Aug 2026: keep the contract
     visible, "it has to remain active"). A dimmed backdrop is right for the
     queue, which is a reading order you step through; it is wrong here, where
     the whole point is reading the panel AGAINST the wording it is about. The
     contract stays lit, stays scrollable, and stays pressable — so the pill is
     also still a way to close it, and the panel simply stays where you put it
     until you close it (the card pop-out's own rule).

     visibility follows the queue's delay rule: parked off the track's edge it
     would still be on screen and still tabbable. */
  .redline-page .rl-cp{
    position:absolute;grid-column:2;grid-row:1;
    inset:0;width:auto;min-width:0;z-index:56;border-radius:0;
    border:0;border-left:1px solid var(--color-divider);
    box-shadow:var(--shadow-lg);
    display:flex;flex-direction:column;
    transform:translateX(100%);
    visibility:hidden;
    transition:transform .3s cubic-bezier(.22,.61,.36,1),visibility 0s linear .3s;
  }
  .redline-page .rl-cp.is-open{transform:none;visibility:visible;
    transition:transform .3s cubic-bezier(.22,.61,.36,1),visibility 0s}
  @media (prefers-reduced-motion:reduce){
    .redline-page .rl-cp{transition:none}
  }
  .redline-page .rl-cp-head{display:flex;align-items:center;gap:8px;flex:none;
    padding:11px 12px;border-bottom:1px solid var(--color-divider)}
  ${''/* ---- HISTORY | + NOTES ----
     Dressed like the toolbar's reading segments — one look for one kind of
     control — and pushed right so it sits beside the ✕ (whose own order:2
     keeps it last). The conversation blocks are HIDDEN by the default face:
     one rule, one class, so the toggle costs a class flip and the one
     engine-wired composer stays alive in the DOM either way. */}
  .redline-page .rl-cp-segs{order:1;margin-left:auto;display:inline-flex;
    border:1px solid var(--color-divider);border-radius:0;overflow:hidden;flex:none}
  .redline-page .rl-cp-segs button{border:0;background:var(--color-surface);cursor:pointer;
    font:inherit;font-size:12px;font-weight:700;line-height:1.6;padding:3px 9px;
    color:var(--color-neutral-600);white-space:nowrap}
  .redline-page .rl-cp-segs button + button{border-left:1px solid var(--color-divider)}
  .redline-page .rl-cp-segs button.on{background:var(--nav-bg,#0b3d3a);color:#fff}
  .redline-page .rl-cp-segs button:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  .redline-page .rl-cp .rl-cnotes{display:none}
  .redline-page .rl-cp.rl-cp-notes .rl-cnotes{display:block}
  .redline-page .rl-cp-label{margin:0;font-size:12px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;color:var(--color-neutral-600)}
  .redline-page .rl-cp-min{order:2;margin-left:auto;border:0;background:transparent;
    font-size:18px;line-height:1;color:var(--color-neutral-600);cursor:pointer;padding:2px 4px}
  .redline-page .rl-cp-min:hover{color:var(--color-text)}
  ${''/* The body alone takes the panel's own type preference (rlCpSetType) —
     zoom, the sheet's established mechanism, so everything inside scales
     together and the head's controls stay controls. */}
  .redline-page .rl-cp-body{flex:1;min-height:0;overflow-y:auto;padding:12px 14px 22px;
    zoom:var(--cp-zoom,1)}
  ${''/* The stepper sits with the segs on the head's right; the head wraps
     rather than clipping on a narrow column. Its readout is its OWN class —
     .rl-type-out belongs to the DOCUMENT stepper and is repainted with the
     document's px. */}
  .redline-page .rl-cp-head{flex-wrap:wrap}
  .redline-page .rl-cp-type{order:1}
  .rl-type-step .rl-cp-type-out{min-width:34px;text-align:center;font-family:var(--font-mono);
    font-size:12px;font-weight:600;color:var(--color-neutral-700)}
  html.dark .rl-type-step .rl-cp-type-out{color:var(--color-neutral-300)}
  ${''/* Preview cards: the counterparty view draws their seat's verbs DEAD —
     see redlineChangeCardsHtml's previewSeat. The tab row's own dead rule is
     scoped to the tab row, so the cards need their own. */}
  .redline-page .rl-card [data-rl-dead]{opacity:.45;cursor:not-allowed}
  .redline-page .rl-cp-clname{margin:0 0 12px;font-family:var(--font-heading);
    font-size:16px;font-weight:700;color:var(--color-text)}
  .redline-page .rl-cp-sec{margin:0 0 18px}
  /* ---- THE THINGS THAT POINT AT SOMETHING ARE BLACK ----
     (owner-asked 16 Aug 2026: "the highlighted features that bring your
     attention to something should be in black font so it is not missed".)
     The section headings and the change id are the panel's signposts — the two
     things a reader scans for — and at neutral-600 they read as captions
     ABOUT the content rather than as the labels ON it. The explanatory lines
     under them stay grey, because those are the captions. */
  .redline-page .rl-cp-h{margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;color:var(--color-text)}
  .redline-page .rl-cp-note,.redline-page .rl-cp-none{margin:0 0 8px;font-size:14px;
    color:var(--color-neutral-600)}
  .redline-page .rl-cp-stands{font-size:15px;line-height:1.65;color:var(--color-text);
    border-left:2px solid var(--color-divider);padding-left:10px}
  /* A row is one ask. The cap down its left edge is the CHANGE CARD's own side
     colour — teal ours, amber theirs — so the panel speaks the language the
     column beside it already speaks rather than inventing a second one. */
  .redline-page .rl-cp-row{display:flex;gap:8px;margin:0 0 10px}
  .redline-page .rl-cp-bar{flex:none;width:3px;border-radius:0;background:var(--color-divider)}
  .redline-page .rl-cp-row-us .rl-cp-bar{background:var(--color-accent-500)}
  .redline-page .rl-cp-row-them .rl-cp-bar{background:var(--st-amber-dot)}
  .redline-page .rl-cp-rowbd{min-width:0;flex:1}
  .redline-page .rl-cp-who{display:block;font-size:13px;color:var(--color-neutral-600);
    margin-bottom:3px}
  /* The id, and only the id. The rest of the line — whose ask, where it stands,
     who from, when — is context and stays quiet; the handle you cite the change
     by is what must not be missed. */
  .redline-page .rl-cp-who b{color:var(--color-text)}
  /* The panel had its own copy of the plain-green rule while the paper still
     carried the convention. The paper does not any more (see .nego-ins), so the
     copy is gone: one fact, one rule. */
  .redline-page .rl-cp-src ins.hati-ins{font-weight:inherit}
  .redline-page .rl-cp-wd{font-size:15px;line-height:1.6;color:var(--color-text)}
  .redline-page .rl-cp-why{display:block;margin-top:4px;font-size:14px;font-style:italic;
    color:var(--color-neutral-600)}
  .redline-page .rl-cp-acts{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
  .redline-page .rl-cp-acts .rl-cp-h{flex-basis:100%}
  /* THE PANEL'S OWN BUTTONS ARE NOT THE SHEET'S FURNITURE — their own class,
     not .rl-tool (see the note beside them). Same colours, because they are the
     same two acts; fixed sizes, because the panel is not the document and does
     not follow the reader's document type. */
  .redline-page .rl-cp-act{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:0;padding:5px 12px;font:inherit;font-size:14px;font-weight:600;
    line-height:1.6;color:var(--color-neutral-600);cursor:pointer;white-space:nowrap;
    box-shadow:0 1px 2px rgba(15,23,42,.08);
    transition:border-color .15s,color .15s,background .15s}
  .redline-page .rl-cp-act:focus-visible{outline:2px solid var(--accent-solid);outline-offset:1px}
  ${''/* The ＋ wears the nav's colour for the same reason the Edit pill does —
     they are the same act's two doors, and both follow the theme through
     --nav-bg (dark green workspace → dark green, blue → navy). */}
  .redline-page .rl-cp-act.rl-cp-act-new{background:var(--nav-bg,#0b3d3a);
    border-color:var(--nav-bg,#0b3d3a);color:#fff}
  .redline-page .rl-cp-act.rl-cp-act-new:hover{background:color-mix(in srgb,var(--nav-bg,#0b3d3a) 82%,#fff);
    border-color:color-mix(in srgb,var(--nav-bg,#0b3d3a) 82%,#fff)}
  .redline-page .rl-cp-hint{flex-basis:100%;margin:6px 0 0;font-size:13px}
  /* .rl-cp-ai-note is RETIRED (19 Aug 2026) — the Copilot is a BUTTON in this
     panel again, see the note beside it. The words-without-a-pill were right
     while the paper still offered a highlight menu of its own; with that off,
     the one Copilot on this page had to be pressable. */
  /* Reopen, on a settled ask in the History. Edit's own quiet clothes, as it
     wore in the tag reveal it moved from — nothing about changing your mind
     should shout louder than the record it sits in. */
  .redline-page .rl-cp-act-row{margin-top:6px}
  .redline-page .rl-cp-reopen{border:1px solid var(--color-divider);background:var(--color-surface);
    border-radius:0;padding:3px 10px;font:inherit;font-size:12px;font-weight:600;
    color:var(--color-neutral-600);cursor:pointer}
  .redline-page .rl-cp-reopen:hover{border-color:var(--accent-solid);color:var(--color-text)}
  /* ---- THE PANEL IS WHERE YOU WRITE (owner-asked 16 Aug 2026) ----
     The engine's editor opens here on the "As it stands" block, so every rule
     it already carries applies unchanged. What it needs from this panel is
     room and a scale.

     --doc-scale IS PINNED TO 1 and that is load-bearing. Every piece of the
     editor's furniture was taught to scale on --doc-scale (15 Aug 2026, the
     third report of one fault), and --doc-scale is written on the .redline-page
     ROOT by the reader's document-type stepper. Inside the panel that would be
     the panel's toolbar and its Save button following a setting about the
     CONTRACT's type — a control shrinking because somebody made the paper
     smaller. The paper scales; the panel does not. */
  .redline-page .rl-cp-src{--doc-scale:1}
  .redline-page .rl-cp-src .nego-editing{border:1px solid var(--accent-solid);border-radius:0;
    padding:9px 11px;min-height:120px;font-size:15px;line-height:1.65;
    background:var(--color-surface);color:var(--color-text);outline:none}
  .redline-page .rl-cp-src .nego-editing.is-review{border-color:var(--color-divider);
    background:var(--color-neutral-50)}
  .redline-page .rl-cp-src .nego-fmt-bar{margin-bottom:6px}
  .redline-page .rl-cp-src .nego-reason{display:block;margin-top:9px}
  .redline-page .rl-cp-src .nego-edit-bar{margin-top:9px}
  /* While the panel is being written in, the ＋ that opened it stands down: it
     is a door the reader is already standing in, and pressing it again would
     be refused in silence (the handler returns on an open bar). */
  .redline-page .rl-cp-src.is-editing .rl-cp-acts{display:none}
  .redline-page .rl-cp-act.rl-cp-act-ai{background:#f5f3ff;border-color:#ddd6fe;color:#5b21b6}
  .redline-page .rl-cp-act.rl-cp-act-ai:hover{background:#ede9fe;border-color:#7c3aed}
  html.dark .redline-page .rl-cp-act.rl-cp-act-edit{background:rgba(5,150,105,.16);border-color:rgba(5,150,105,.45);color:#6ee7b7}
  html.dark .redline-page .rl-cp-act.rl-cp-act-ai{background:rgba(124,58,237,.18);border-color:rgba(124,58,237,.45);color:#ddd6fe}
  /* ---- AND THE SCORE SURVIVES THE CLOSE ----
     The folded rail's whole justification was that "2 of 7 decided" stayed
     legible at 34px, so reopening was never a guess. An overlay that simply
     shut would have taken that away — so the score moves onto the door. A tab
     on the page's own left border wall, vertically centred, reading downwards
     and carrying the caption and the two numbers: the way back in, and the
     reading, in one control.

     It is built inside redlinePanesHtml rather than on the workbench toolbar,
     which is what makes it reach every mount — the owner's bench, the contract
     tab's embed and the COUNTERPARTY's page, which renders these panes and has
     no toolbar of its own.

     ---- IT IS A TAB ON THE PAGE'S OWN BORDER WALL, AND IT READS DOWNWARDS
     (owner-asked, 12 Aug 2026). Two things changed together and they are one
     decision. It is ABSOLUTE, so it sits against this page's inner left border
     rather than against the window's — see the panel above. And it is VERTICAL:
     a horizontal pill on the wall of a page has to eat into the contract's
     width to carry its caption, while a tab turned on its side costs the page
     nothing but its own thickness. writing-mode is what turns it; in a vertical
     writing mode a flex row runs top-to-bottom on its own, so the caption and
     the score stack down the wall with no second rule.

     AND IT SURVIVES FOCUS MODE. There used to be a rule hiding it there, from
     when it rode the window's edge and read as app furniture. It is part of the
     page now, and focus mode is the mode in which a reader is working THROUGH
     the round — the one place the reading order matters most. Hidden, the queue
     was unreachable in it, which is the fault. */
  .redline-page .rl-q-tab{
    position:absolute;left:0;top:50%;transform:translateY(-50%);z-index:54;
    writing-mode:vertical-rl;
    display:flex;align-items:center;gap:8px;
    font:inherit;font-size:12px;font-weight:700;cursor:pointer;
    padding:13px 7px 13px 6px;border:1px solid var(--color-divider);border-left:0;
    border-radius:0;background:var(--color-surface);color:var(--color-text);
    box-shadow:var(--shadow-md);transition:background .12s,padding .12s;
  }
  /* Outward, away from the wall — padding-left would push it INTO the page's
     border, which is the one edge it is fixed to. */
  .redline-page .rl-q-tab:hover{background:var(--color-neutral-100);padding-right:11px}
  .redline-page .rl-q-tab .rl-q-tab-k{letter-spacing:.09em;text-transform:uppercase;
    font-size:11px;color:var(--color-neutral-600)}
  .redline-page .rl-q-tab .rl-q-tab-n{font-family:var(--font-mono);font-size:12px;
    font-weight:700;color:var(--color-text)}
  /* The door is a door only while it is shut — with the panel open the panel's
     own close button and the scrim are the way out. */
  .redline-page .rl-queue.is-open ~ .rl-q-tab,
  .redline-page .rl-q-tab.is-open{display:none}
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
  .redline-page .rl-q-label{margin:0 26px 8px 0;font-size:11px;font-weight:700;
    letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)}
  /* ---- THE CLOSE ----
     Same corner the fold chevron used, same id, and it is now what it always
     looked like: the way out of the panel. */
  .redline-page .rl-q-min{position:absolute;top:9px;right:6px;width:22px;height:22px;
    display:grid;place-items:center;padding:0;border:0;border-radius:0;background:none;
    color:var(--color-neutral-500);cursor:pointer;transition:background .12s,color .12s}
  .redline-page .rl-q-min:hover{background:var(--color-neutral-100);color:var(--color-text)}
  /* The stacked read-out belonged to the 34px rail, which no longer exists —
     the score reads on the door now (.rl-q-tab). Kept in the markup and unseen
     so the two numbers have exactly one source. */
  .redline-page .rl-q-mini{display:none}
  .redline-page .rl-q-bar{height:5px;border-radius:0;background:var(--color-neutral-200);overflow:hidden}
  .redline-page .rl-q-bar span{display:block;height:100%;border-radius:0;
    background:var(--accent-solid,var(--color-accent));transition:width .3s ease}
  .redline-page .rl-q-row{display:flex;align-items:center;gap:4.5px;width:100%;text-align:left;
    font:inherit;font-size:14px;color:var(--color-text);cursor:pointer;background:none;
    border:1px solid transparent;border-radius:0;padding:8px 5px;margin-bottom:2px}
  .redline-page .rl-q-row:hover{background:var(--color-neutral-100)}
  .redline-page .rl-q-k{flex:1;min-width:0;font-size:12px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .redline-page .rl-q-st{flex:none;font-size:12px;font-weight:600}
  /* The count chip appears only where a row stands for more than one change,
     so its absence is itself information: this row is one ask. */
  .redline-page .rl-q-n{flex:none;font-family:var(--font-mono);font-size:12px;font-weight:700;
    background:var(--color-neutral-100);color:var(--color-neutral-600);
    border:1px solid var(--color-divider);border-radius:0;padding:0 6px}
  /* The mark column is a fixed width on every row, answered or not, so the
     clause names line up down the list instead of stepping in and out. */
  .redline-page .rl-q-mark{flex:none;width:14px;text-align:center;font-weight:700;line-height:1}
  .redline-page .rl-q-row.is-done{color:var(--st-green-fg)}
  .redline-page .rl-q-row.is-done .rl-q-st{color:var(--st-green-fg)}
  .redline-page .rl-q-row.is-waiting{color:var(--color-neutral-400)}
  .redline-page .rl-q-row.is-waiting .rl-q-mark::before{content:"";display:block;
    width:8px;height:8px;margin:0 auto;border-radius:50%;background:var(--color-neutral-200);
    border:1px solid var(--color-neutral-400);opacity:.8}
  .redline-page .rl-q-row.is-held{color:var(--st-amber-fg)}
  .redline-page .rl-q-row.is-held .rl-q-st{font-size:11px;letter-spacing:.09em;text-transform:uppercase}
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
  .redline-page .rl-q-why{margin:0 4px;font-size:12px;line-height:1.5;color:var(--st-amber-fg)}
  .redline-page .rl-q-empty{margin:4px;font-size:13px;line-height:1.55;color:var(--color-neutral-500)}
  /* The count reads under the bar it belongs to, in the head. */
  .redline-page .rl-q-foot{margin:6px 0 0;font-size:12px;color:var(--color-neutral-500)}
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
  ${''/* The caption and the tabs carry their own vertical padding since B1
     (the caption's top, the tabs' bottom down to the rule), so trimming the
     HEAD alone no longer trims the head — both children have to give way with
     it or a short window pays 20px it has not got. */}
  @media (max-height:820px){
    .redline-page .rl-idx-head{padding:4px 12px 8px;gap:6px}
    .redline-page .rl-fseg{padding-bottom:6px}
    .redline-page .rl-paper{padding:26px 30px 30px}
  }
  @media (max-height:680px){
    .redline-page .rl-idx-head{padding:2px 12px 6px;gap:5px}
    .redline-page .rl-fseg{padding-bottom:4px}
    .redline-page .rl-paper{padding:20px 26px 24px}
  }
  /* ---- THE HANDLE ----
     Absolutely positioned over the gap (rlLayoutResizer keeps its left edge
     on the split), the Doc tab's own grip. Hidden where the panes stack. */
  .redline-page .rl-resizer{position:absolute;top:0;bottom:0;left:66%;width:14px;z-index:6;
    cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none}
  .redline-page .rl-resizer span{width:4px;height:72px;border-radius:0;
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
  .redline-page .rl-asktag,.redline-page .nego-badge{
    -webkit-user-select:none;user-select:none}
  /* ---- THE CLAUSE TOOL ROW'S RULES LEFT WITH THE ROW (16 Aug 2026) ----
     .rl-tools / .rl-tool and their hover-reveal, is-editing and hover:none
     rules all stood here. The row is retired — no edits on the paper, all
     edits through the clause panel (owner-asked; see the note where the
     builder stood in redlineDocHtml) — and rules kept for elements nothing
     draws are how a dead control comes back through a door nobody remembered.
     .rl-cp-act in the panel carries the same colour families on its own
     class, which is why nothing else changed shade. */
  .redline-page .rl-btn-ghost{background:var(--color-neutral-100);color:var(--color-neutral-600)}
  .redline-page .rl-btn-ghost[aria-pressed="true"]{background:var(--accent-solid);color:#fff;
    border-color:var(--accent-solid)}

  /* Below lg the two panes stack to one column and the page scrolls, so the
     inner panes give their scroll back to the page rather than trapping the
     gesture. A drag handle over stacked panes resizes nothing — hidden. */
  @media (max-width:1023px){
    .redline-page .rl-grid{grid-template-columns:minmax(0,1fr)!important;height:auto}
    .redline-page .rl-doc,.redline-page .rl-side{grid-column:auto;min-height:280px}
    /* THE PHONE GETS NO DESKTOP OVERLAY. The queue stacks with the panes rather
       than being dropped: it is the reading order, and it is the pane that
       matters MOST on a small screen, so it keeps its place at the top of the
       stack. It does not need 280px of it — a queue is as tall as its rows.
       Every rule the overlay adds is unwound here, including the scrim and the
       edge door, which have nothing to open on a page where the queue is
       already in flow and always visible. */
    .redline-page .rl-queue{position:static!important;transform:none!important;
      visibility:visible!important;
      width:auto!important;grid-column:auto;min-height:0;max-height:46vh;
      border:1px solid var(--color-divider)!important;border-radius:0!important;
      box-shadow:0 1px 2px rgba(15,23,42,.05)!important;z-index:auto!important}
    .redline-page .rl-q-scrim,.redline-page .rl-q-tab,
    .redline-page .rl-q-min{display:none!important}
    .redline-page .rl-resizer{display:none}
    /* ---- THE CLAUSE PANEL DOES NOT STACK, AND THAT IS THE OPPOSITE CALL FROM
       THE QUEUE'S, ON PURPOSE. The queue is the reading order and belongs at
       the top of a stacked page whatever the width. This panel is about ONE
       clause and is shut until a reader presses that clause's pill, so putting
       it in flow would print one arbitrary clause's history above the contract
       and leave the pill with nothing to open. It stays an overlay and moves
       from the PAGE's wall to the WINDOW's: below this width .rl-grid is
       height:auto and as tall as the whole stacked page, so an absolute panel
       pinned top-to-bottom inside it would run off the bottom of the screen.

       IT ALSO STOPS BEING THE CARDS COLUMN HERE, because there is no second
       track to be: the grid is one column and the divider is not drawn. So it
       takes a width of its own again, and only here — the rule it inherits
       above (be exactly the cards column) has nothing to point at. */
    .redline-page .rl-cp{position:fixed;top:0;bottom:0;right:0;left:auto;
      grid-column:auto;grid-row:auto;width:min(520px,92vw);z-index:56}
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
    border-radius:0;box-shadow:0 1px 2px rgba(15,23,42,.05);min-height:0;overflow:hidden;
    display:flex;flex-direction:column}
  ${''/* The clause panel wears .rl-col too, and this .rl-col rule sits LATER
     in the sheet than .rl-cp's own border-radius:0 at equal specificity — so
     order handed the panel the column's 14px corners. Written at three
     classes so the square corner wins on specificity, not on position
     (owner-asked 16 Aug 2026: square, both seats). */}
  .redline-page .rl-col.rl-cp{border-radius:0}
  ${''/* ---- THE CHANGE COLUMN IS ONE WHITE CARD AGAIN (owner-reported 22 Aug
         2026, off the mock-up's own rail: "tracked changes should be a large
         white card that looks like the image with change cards laid over the
         larger white card") ----
         This REVERSES two standing decisions, both of them the owner's own and
         both recorded rather than quietly dropped:
           · 10 Aug 2026 — the strip came off and "the pane stays transparent
             … the change column is not a card". The reasoning was three nested
             frames at 300px (band, card, card body) reading as heavy;
           · 22 Aug 2026 — the mock-up drew this card and it was DELIBERATELY
             not taken, on the same reasoning ("at the 300px the divider allows,
             a box round a column of boxes reads as clutter").
         The column rests at 460px now, not 300, which is the fact that moved
         under both of those arguments: the mock-up's rail is drawn at that
         width and it does not read as clutter there.

         IT IS .rl-col's OWN CARD, NOT A SECOND ONE. This rule used to switch
         .rl-col's card off for this column; it now only ADDS the rail's own
         padding, so the surface, the border and the corner all come from the
         one place the page already defines them and there is nothing to keep
         in step. overflow stays visible — the clause panel and the queue slide
         out of this column's box and clipping them would park them behind it.

         THE HEAD'S HAIRLINE SURVIVES AND STILL MEANS WHAT IT MEANT: it
         separates the caption row from the cards. What it no longer has to do
         is stand in for a box that was not there. */}
  .redline-page .rl-side{border-radius:0;overflow:visible;padding:12px 0 0}
  ${''/* radius 0, not 14: the doc column clips (overflow:hidden), so a radius
     here rounds the sheet's own corners even with no border of its own —
     see the square-corners note on .rl-paper. */}
  .redline-page .rl-doc{background:none;border:0;border-radius:0;box-shadow:none;min-height:0;
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
  .redline-page #rl-changes-col{border-radius:0}
  .redline-page #rl-changes-col h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;
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

  /* ==========================================================================
     THE MOCK-UP'S TREATMENT (owner-approved render, 22 Aug 2026)
     ==========================================================================
     Everything below restyles this page to the design the owner signed off. It
     is written as ONE BLOCK, at the end of the sheet, on purpose: the rules it
     supersedes are scattered through three thousand lines, and a reader asking
     "what did the redesign change?" can read it here instead of hunting. Every
     selector below is at LEAST as specific as the rule it beats, so it wins on
     order rather than on weight — no !important anywhere, which is the standing
     rule at .rl-rej: weight wins the fight and hides the next one.

     AND IT IS PROVED IN A BROWSER, NOT BY READING. Same rule, same reason:
     redline-verify reads the COMPUTED value of the sizes named here, because a
     declaration that loses a cascade fight looks perfectly correct in the file.

     WHAT IS DELIBERATELY NOT HERE, each because the owner ruled on it:
       · the change column is NOT boxed — the mock-up draws a white card round
         it and this page keeps the transparent column (see .rl-col's own note);
       · the Copilot band stays, folded, above the cards;
       · the divider stays and only its resting place moves (see RL_RIGHT_W0).
     ------------------------------------------------------------------------ */

  /* ---- 1 · THE HEAD IS ONE WHITE BAND ----
     Full width, its own 24px inset, a hairline under it. The page carries no
     padding of its own any more (see renderRedline), so this band and the
     control bar below it run edge to edge while the working area keeps the
     product's page measure. */
  ${''/* ---- ONE LINE, AND IT MUST NOT WRAP (owner-reported 22 Aug 2026, off a
         screenshot: "you have placed the buttons on the left side of the
         screen") ----
         The acts were not placed on the left — the head WRAPPED. .room-head is
         flex-wrap:wrap for the contract page, which needs it (its breadcrumb
         and its fact row are full-width items that take a line each); on this
         page there is neither, so a long contract name simply pushed the four
         buttons onto a second line, where they start at the left margin like
         any wrapped flex item. MEASURED on the reported name — 84 characters —
         at 1500px.
         THE TITLE IS WHAT GIVES, not the row: it already carries the ellipsis
         (see .room-head h1), and min-width:0 on the items around it is what
         lets a flex child shrink below its content at all. */}
  ${''/* WRAP IS BACK, AND THE FAULT ABOVE DOES NOT COME WITH IT (24 Aug 2026).
         This page draws the fact row now, and .room-facts is flex-basis:100% —
         a full-width item CANNOT take its own line in a nowrap row, so with
         nowrap the six facts were crushed in beside the buttons and the
         contract's name was squeezed out of the head entirely. MEASURED before
         it was touched.
         WHAT ACTUALLY FIXED THE 22 Aug REPORT IS KEPT and is the two rules
         below: the title carries the ellipsis and min-width:0 is what lets a
         flex child shrink under its content. nowrap was belt AND braces; the
         braces are what hold. Re-measured on the same 84-character name at
         1500px — the acts stay on line one and the facts take line two, which
         is exactly what the contract room has always done with this markup.
         align-items:center would centre the fact row against the title row, so
         the head aligns to its top and each row centres its own contents. */}
  .redline-page #ws-head{background:var(--color-surface);padding:9px 24px;margin:0;
    flex:none;flex-wrap:wrap;box-shadow:inset 0 -1px var(--color-divider);gap:0 12px;
    align-items:center}
  .redline-page #ws-head .room-facts{flex-basis:100%}
  ${''/* ---- THE COMPANY, THE KIND AND THE ROUND, UNDER THE TITLE ----
         Its own line, so the title line carries the agreement and the buttons
         and nothing else. Full width, so it can never be drawn into the title
         row however short it is. */}
  .redline-page #ws-head .room-headsub{flex-basis:100%;order:1;margin:1px 0 0;
    font-size:13px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;
    text-overflow:ellipsis}
  .redline-page #ws-head .room-facts{order:2}
  ${''/* ---- AND THE BUTTONS NEVER WRAP (owner-asked 24 Aug 2026) ----
         flex:none was already on .room-acts, which stops them SHRINKING; what
         let them fall to a second line was the title demanding its content
         width beside them. The title ellipsises into whatever is left (basis 0
         above, and these three properties are what actually cut the words), so
         line one always fits. The whole name is on the h1's own hover. */}
  .redline-page #ws-head .room-acts{flex:none;flex-wrap:nowrap}
  .redline-page #ws-head .room-name{min-width:0}
  .redline-page #ws-head h1{min-width:0;overflow:hidden}
  .redline-page #ws-head h1 .room-title-back{display:block;max-width:100%;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
  ${''/* flex-basis 0, NOT auto — and that one word is what lets the head both
         wrap the fact row and keep the acts on line one. With basis auto the
         name block DEMANDS its content width, so an 84-character contract name
         made line one wider than the head and the acts wrapped underneath it,
         starting at the left margin: the exact fault of 22 Aug, back the moment
         wrap returned. With basis 0 it takes only what is left over and the h1
         ellipsises into it, so line one always fits and only the full-width
         fact row ever takes a line of its own. .room-acts is already flex:none,
         so it never gives up a pixel. MEASURED on that same name at 1500, 1440
         and 1280. */}
  .redline-page #ws-head .room-id{min-width:0;flex:1 1 0;overflow:hidden}
  .redline-page #ws-head .room-name{gap:10px;flex-wrap:nowrap;min-width:0}
  /* The reference is the way back — a button wearing the render's quiet grey.
     Its hover is the only sign it is one, which is what a crumb has always
     been. */
  .redline-page #ws-head .room-name-id{flex:none;border:0;background:none;font:inherit;
    font-size:15px;font-weight:400;color:var(--color-neutral-600);padding:0;cursor:pointer;
    display:inline-flex;align-items:center;gap:6px;line-height:1.3}
  .redline-page #ws-head .room-name-id:hover{color:var(--color-accent-800)}
  .redline-page #ws-head .room-name-id i{font-style:normal;color:var(--color-neutral-400)}
  .redline-page #ws-head .room-name h1{font-size:15px;font-weight:600;letter-spacing:0;min-width:0;
    overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .redline-page #ws-head .room-name h1 .room-title-back{font-size:15px;font-weight:600}
  .redline-page #ws-head .room-stat{font-size:14px;font-weight:700}
  .redline-page #ws-head .room-round{font-size:15px;font-weight:400;color:var(--color-neutral-600);
    background:none;border:0;padding:0;letter-spacing:0}
  /* Who leads this negotiation stays — it is the one place the page says it —
     as quiet text with a hairline before the acts, which is the render's own
     treatment. It is not a chip on this page. */
  ${''/* THE CHIP'S OWN RULE MOVED TO index.html, 22 Aug 2026 (owner-reported:
         "do not put a grey box around it similar to negotiations page"). This
         page had stripped the box in a scoped rule of its own while the
         contract room kept the pill, so one contract wore two chips depending
         on which of its pages you stood on. The flat treatment — no box, the
         hairline before the acts, quiet ink — is the BASE rule now, so both
         heads read it from one place and there is nothing to keep in step. */}
  .redline-page #ws-head .room-acts{gap:6px;align-items:center;flex:none}
  ${''/* ---- ONE FILLED ACT, AND IT IS PUBLISH ROUND ----
         The render draws four buttons of which exactly one is filled — the
         platform's own button rule, which this head was breaking: the review
         door wore .rl-pb-btn's fill and read as a second primary beside the act
         that closes the round. Bordered here, filled nowhere. Scoped to this
         head so the class keeps its own clothes wherever else it draws. */}
  ${''/* ---- FOUR BUTTONS, ONE HEIGHT (owner-reported 22 Aug 2026: "the height
         of the buttons for more, internal review, share, publish round should
         be the same height") ----
         MEASURED, this row drew THREE heights: More at 34 (its own class set
         one — fixed at .ws-more-btn), Share at 28 (.ui-btn-lg's), and Publish
         Round and Internal review at **32.1875** — a fraction, because
         .rl-btn and .rl-pb-btn name no height at all and theirs fell out of
         13px type plus 6px of padding plus a border. Two of the four were also
         a size smaller than the other two.

         THE CAUSE IS THE REDESIGN'S OWN DOING and worth stating: these two
         buttons belong to the CONTROL BAR, where .rl-btn's metrics feed
         rlFitTabRow's four-rung fold ladder and must not move. The 22 Aug
         redesign moved them up into the head, where the platform's .ui-btn-lg
         governs — so they arrived wearing the wrong row's measurements.

         SO IT IS PINNED HERE, IN THE HEAD, AND NOWHERE ELSE. rlFitTabRow
         measures '.rl-tabrow' and its '.rl-head'; this selector cannot reach
         either, so the ladder is untouched — and the same classes keep their
         own metrics wherever else they draw (a narrowed reviewer's bar, the
         counterparty's mount).
         EVERY button in the row, not the two reported: a rule naming the two
         that happened to be wrong today is one the next button added here
         walks straight past.
         DISPLAY IS PART OF THE FIX — .rl-pb-btn computes 'block', and a block
         at a fixed height does not centre its own words. Colour, border, fill
         and the filled act's 700 are each button's own and are left alone. */}
  .redline-page #ws-head .room-acts button{height:28px;padding:0 11px;font-size:14px;
    line-height:1.2;display:inline-flex;align-items:center;box-sizing:border-box;
    ${''/* ONE OUTLINE FOR THE WHOLE ROW (owner-asked 23 Aug 2026: "the more
           buttons should have the same color outline like the other buttons").
           MEASURED before it was touched, this row drew THREE accent borders:
           .ui-btn's 45% mix on More and Share, .rl-pb-btn's own 50% mix on
           Internal review, and .rl-btn-go's opaque --accent-solid on Publish
           Round. Three near-identical teals is worse than one wrong one — it
           reads as a rendering fault rather than as a decision.
           IT IS SETTLED HERE RATHER THAN IN EACH CLASS because two of those
           classes also draw on the CONTROL BAR, whose metrics feed
           rlFitTabRow's fold ladder; this selector is (0,3,1) and beats all
           three, and it reaches neither .rl-tabrow nor .rl-head. Same scope,
           same reason, as the height pin it sits inside. */}
    border-color:var(--rl-btn-line)}
  ${''/* THE ROW'S LINE, AS A VALUE ANY OTHER BUTTON ON THIS PAGE CAN READ
         (owner-asked 24 Aug 2026: every button should carry the line Share and
         More carry). It was written inline here; declared on the page root it
         is one value with several readers, so the card verbs and this row can
         no longer drift the way this row's own three accent borders once did.
         Declared on .redline-page rather than :root because it is this page's
         decision, and the counterparty's mount carries that class too. */}
  .redline-page{--rl-btn-line:color-mix(in srgb,var(--accent-solid) 45%,transparent)}
  ${''/* ---- THE CHANGE INDEX (owner-approved render, 24 Aug 2026) ---- */}
  .redline-page .rl-idx{padding:12px 12px 11px;border-bottom:1px solid var(--color-divider)}
  .redline-page .rl-idx-top{display:flex;align-items:center;gap:10px}
  .redline-page .rl-idx-title{flex:1;font-size:15px;font-weight:700;color:var(--color-text);
    letter-spacing:-.01em}
  ${''/* The open count is the one dark object on this column, which is what
         makes it readable at a glance. It takes the nav's own deep ground
         rather than a new slate, so it follows the workspace brand and the
         dark theme with no second rule. */}
  .redline-page .rl-idx-open{flex:none;font-size:12px;font-weight:700;color:#fff;
    background:var(--nav-bg);padding:2px 9px}
  .redline-page .rl-idx-bar{margin-top:9px;height:8px;background:var(--color-neutral-200);
    position:relative;overflow:hidden}
  .redline-page .rl-idx-bar i{position:absolute;left:0;top:0;bottom:0;display:block;
    background:var(--accent-solid)}
  .redline-page .rl-idx-foot{display:flex;align-items:center;gap:10px;margin-top:7px}
  .redline-page .rl-idx-sub{font-size:13px;color:var(--color-neutral-600)}
  ${''/* The filter. Small, on the index's own line, and it keeps every option's
         count in its words so the split is readable without opening it. */}
  .redline-page .rl-idx-filter{font:inherit;font-size:12.5px;height:24px;
    border:1px solid var(--rl-btn-line);background:var(--color-surface);color:var(--color-text);
    padding:0 24px 0 8px;cursor:pointer;border-radius:0;appearance:none;-webkit-appearance:none;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235F6D6B' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
    background-repeat:no-repeat;background-position:right 6px center}
  ${''/* WHILE THE COLUMN IS NARROWED IT SAYS SO. This is the third of the
         filter's three safety properties, kept when the control became a
         dropdown: a collapsed control can hide changes quietly, so the column
         states the narrowing and offers the way back. The button carries
         data-rl-cardfilter, so it is the page's existing door, not a second. */}
  .redline-page .rl-idx-narrowed{display:flex;align-items:center;gap:8px;margin:10px 12px 0;
    padding:5px 9px;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);
    font-size:12.5px;color:var(--st-amber-fg)}
  .redline-page .rl-idx-narrowed button{border:0;background:none;font:inherit;font-size:12.5px;
    font-weight:700;color:var(--st-amber-fg);text-decoration:underline;cursor:pointer;padding:0}

  ${''/* ---- AND THE LAST BOLD ONE FLATTENED TOO (owner-asked 23 Aug 2026:
         "publish round should not be bold") ----
         .rl-btn-go was excluded from this rule the day the fill came off, so
         the act would still LEAD the row by weight. The owner has now taken
         the weight as well, which is the fourth time this head has been asked
         to quieten down and the same answer each time: this reader reads
         emphasis as shouting. The row leads by POSITION and by the accent
         outline alone; nothing in it is bold.
         BOTH BUTTONS WEARING THE CLASS GO, exactly as when the fill came off —
         Publish Round and Close Round are both .rl-btn-go, and flattening one
         while leaving the other is the inconsistency the last report was about.
         SCOPED TO THE HEAD, which is what keeps it safe: .rl-btn and .rl-btn-go
         also draw on the CONTROL BAR, whose metrics feed rlFitTabRow's fold
         ladder, and this selector reaches neither .rl-tabrow nor .rl-head. */}
  .redline-page #ws-head .room-acts button:not(.ui-btn-primary){font-weight:400}

  .redline-page #ws-head .rl-pb-btn{background:none;
    border:1px solid color-mix(in srgb,var(--accent-solid) 50%,transparent);
    color:var(--color-accent-800);font-weight:400;box-shadow:none}
  .redline-page #ws-head .rl-pb-btn:hover:not(:disabled){
    background:color-mix(in srgb,var(--accent-solid) 8%,transparent)}
  html.dark .redline-page #ws-head .rl-pb-btn{color:var(--color-accent-300)}

  /* ---- 2 · THE READING TABS ARE TABS ----
     Full height of the bar, an underline on the live one, and a count on
     Redlined. They were a grey pill group at 12px — the smallest control on a
     row whose job is naming what the paper below is showing.
     SCOPED TO .rl-readwrap, so the SEAT switch beside it (the same builder's
     classes) keeps its own box: two controls, two shapes, one row.

     ---- AND NOT SCOPED TO ONE PAGE (owner-asked 23 Aug 2026: "in the
     counterparty page, the redlined, agreed and with changes should be similar
     to what is in image 2 from the negotiations page") ----
     THE CLOTHES FOLLOW THE BUILDER, NOT ONE OF ITS HOMES. rlReadSegsHtml is
     the ONE builder and it has TWO homes: this page's control bar, and the
     counterparty's own .pw-id header. This block was written scoped to
     .redline-page .rl-readwrap, so their copy fell through to the base
     .rl-seg rule and drew the grey pill group these tabs replaced — MEASURED:
     13px in a bordered box with background rgb(241,245,249), the live one a
     white FILL, resting ink the label shade.

     THIS IS THE SAME TRAP, ONE LAYER ALONG. On 15 Aug the base .rl-segwrap /
     .rl-seg rules were scoped to .redline-page and their header rendered as
     one run of unstyled text; the fix then was to unscope them, and the note
     recorded it as "the clothes follow the builder". The 22 Aug redesign then
     added THIS dress and scoped it the same way, so the counterparty was left
     on the old one. Unscoped now, which is safe because .rl-readwrap wraps the
     reading switch and nothing else — the seat switch is .rl-segwrap and keeps
     its box, which is what the paragraph above is protecting.

     THE HEIGHT IS DELIBERATELY auto RATHER THAN A NUMBER, and that is what
     lets one dress fit both rows: on this page align-items:stretch takes the
     44px control bar's full height, and in their compact header it takes the
     header's. Pinning 44 here would push their header open.

     AND NO BACKTICKS IN THIS FILE'S COMMENTS: the stylesheet is returned from
     a JS template literal, so one ends the string and the file stops parsing.
     Caught by the linter the moment this note was written.

     THE WRAP IS .rl-segwrap.rl-readwrap, NOT A BARE .rl-readwrap, AND THAT IS
     THE WHOLE OF WHY THIS WORKS. Unscoping is not free: it DROPS specificity.
     The element carries both classes, and line 1266 declares the pill box
     twice — once bare and once as .redline-page .rl-segwrap. A bare
     .rl-readwrap scores the same as that first one and LESS than the second,
     so the first attempt at this fix dressed the counterparty correctly and
     handed the OWNER's tabs their grey box back. Measured, and caught by the
     browser file comparing the two pages against each other rather than
     against a typed colour. Matching on both classes scores the same as the
     scoped rule and sits later in the sheet, so it wins on both pages without
     reaching for !important — which would win this fight and hide the next. */

  .rl-segwrap.rl-readwrap{background:none;border:0;padding:0;height:auto;gap:2px;
    align-items:stretch}
  .rl-readwrap .rl-seg{height:auto;padding:0 14px;font-size:14px;font-weight:400;
    color:var(--color-text);display:flex;align-items:center;gap:7px;box-shadow:none;background:none}
  .rl-readwrap .rl-seg:hover{color:var(--color-accent-800)}
  .rl-readwrap .rl-seg.on{font-weight:700;color:var(--color-accent-800);
    background:none;box-shadow:inset 0 -2px var(--accent-solid)}
  html.dark .rl-readwrap .rl-seg.on{background:none}
  .rl-readwrap .rl-seg-n{font-family:var(--font-mono);font-size:12px;font-weight:400;
    font-variant-numeric:tabular-nums;color:var(--color-neutral-500)}
  .rl-readwrap .rl-seg.on .rl-seg-n{color:var(--color-accent-800)}

  /* ---- 3 · THE RIGHT-HAND CONTROLS QUIETEN DOWN ----
     One box for the text size, a teal-filled seat switch, and a plain link back
     to the list. "N needs you" keeps its dot and loses its box: it is a way
     INTO the work, not an act, and a bordered amber chip beside four other
     bordered things was the loudest thing on a row of quiet ones. */
  ${''/* ---- AND THE HEAD STRETCHES, WHICH IS WHAT MAKES THE FIT LADDER
         HONEST ----
         It was align-self:center, which was harmless while the row had no
         height of its own. The bar is a fixed 44px now, so a centred head sits
         6px below the row's top merely by being SHORTER than the row — and the
         ladder's "has the head dropped to a second line?" test measures exactly
         that offset. Each rung made the head shorter, which pushed it further
         down, which read as still-dropped: the row folded three rungs on a
         window with 300px to spare. Stretched, the head's top IS the row's top
         until it genuinely wraps, which is the only thing the test should ever
         be answering. Its children keep centring themselves. */}

  /* ONE BOX, NOT THREE BUTTONS. The A⁻/A⁺ presses are kept — they are the
     control, they are what the suite drives, and the Document tab and the
     counterparty's page draw the same builder — but the group now reads as the
     single 28px bordered box the render draws, with the buttons as bare glyphs
     inside it rather than three raised chips. */
  /* ---- UNSCOPED 23 Aug 2026 — THE CLOTHES FOLLOW THE BUILDER ----
     The comment above already said it in its own words: the Document tab and
     the counterparty's page draw the same builder. The RULE then said
     .redline-page, so those two homes and the design step's preview went on
     drawing the pre-redesign three-chip grey pill — one builder, two looks,
     with the note claiming otherwise. Third time this exact trap has been paid
     for in this file.

     UNSCOPING IS SAFE HERE and it is worth saying why, because it is not
     always: .rl-type-step is a single class, the base rule sits 2,350 lines
     ABOVE this one, and equal specificity is settled by source order — so this
     block wins wherever it applies, with no !important, which would win the
     fight and hide the next one. The dark pair keeps its html.dark prefix,
     which is one class heavier than the base's own dark rule and later
     besides. */
  .rl-type-step{height:28px;padding:0;gap:0;background:var(--color-surface);
    border:1px solid var(--color-divider);align-self:center}
  .rl-type-step button{width:26px;height:26px;background:none;border:0;
    color:var(--color-neutral-600);font-size:12px}
  .rl-type-step button:hover{background:var(--color-neutral-100);border:0}
  .rl-type-step .rl-type-out{font-family:inherit;font-size:13px;font-weight:400;
    color:var(--color-text);min-width:38px}
  html.dark .rl-type-step{background:var(--color-surface)}
  html.dark .rl-type-step button{background:none}
  /* The seat switch: a bordered box whose live half FILLS. It is the one
     two-state control on this row where the reader has to know at a glance
     which chair they are in — the whole page draws differently — so it is the
     one that earns the fill. accent-700, not --accent-solid: white on accent-600
     is 3.74:1 and this text is 13px. The same measurement that fixed the change
     column's count markers. */
  .redline-page .rl-actions .rl-segwrap{height:28px;padding:0;gap:0;background:var(--color-surface);
    border:1px solid var(--color-divider);align-self:center}
  .redline-page .rl-actions .rl-segwrap .rl-seg{height:26px;padding:0 12px;font-size:13px;
    box-shadow:none;background:none;color:var(--color-neutral-500)}
  .redline-page .rl-actions .rl-segwrap .rl-seg.on{background:var(--color-accent-700);color:#fff;
    font-weight:700;box-shadow:none}
  html.dark .redline-page .rl-actions .rl-segwrap .rl-seg.on{background:var(--color-accent-700);color:#fff}
  /* The way back is words, not a chip. It ends the row, so it needs no box to
     be found — and a bordered control there read as a fifth button rather than
     as the door it is. */

  .redline-page .rl-livelist-n{font-family:var(--font-mono);font-size:12px;font-weight:400;
    color:var(--color-neutral-500);background:none;border:0;padding:0}
  ${''/* ---- AND THE ACCENT INK HAS TO SURVIVE THE NIGHT ----
         The dark theme does not redefine the accent RAMP, so accent-800 is a
         deep green — fine on white, about 2.4:1 on an almost-black bar, which
         is the exact fault this page already recorded against the change
         column's live count. Every place this block puts accent-800 on a dark
         ground takes accent-300 instead. Found by photographing the page in
         dark rather than by reading the rules. */}
  html.dark .redline-page .rl-readwrap .rl-seg.on,
  html.dark .redline-page .rl-readwrap .rl-seg.on .rl-seg-n,
  html.dark .redline-page .rl-readwrap .rl-seg:hover,
  html.dark .redline-page #ws-head .room-name-id:hover,
  html.dark .redline-page .rl-livelist{color:var(--color-accent-300)}

  /* ---- 4 · ONE PAGE INSET, SHARED WITH THE BANDS ABOVE (owner-reported
     22 Aug 2026: "the tracked changes cards are leaving space on the right
     hand side so move the card to occupy the space") ----
     This was 48px either side — the render's own .h-content measure — while
     the head and the control bar above are full-width white bands inset 24.
     MEASURED, that 24px difference IS the reported strip: the change column's
     right edge sat 49px inside the head's at every width, so the cards stopped
     short of a page that carried on without them.
     IT IS 24 ON BOTH SIDES, not just the reported one. Fixing the right alone
     would leave a quieter version of the same fault on the left, and what the
     report is really about is the working area lining up with the bands above
     it — which only one shared inset can promise. The contract loses nothing:
     its sheet is capped at RL_SHEET_MAX and centres inside its own track, so
     the extra 24px becomes margin beside a centred page rather than a longer
     line of text.
     It still sits on the MOUNT rather than on the page, because the bands are
     full-width and one padding on #view-redline could not do both.
     THE WORKING AREA IS THE WINDOW and nothing scrolls past it: the contract
     and the change column fill it and each scrolls inside itself, which is the
     rule this page has always had. */
  .redline-page #redline-host{flex:1;min-height:0;display:flex;flex-direction:column;
    padding:16px 24px 26px}
  @media (max-width:900px){
    .redline-page #redline-host{padding:12px 16px 20px}
    .redline-page #ws-head,.redline-page .rl-tabrow{padding-left:16px;padding-right:16px}
  }

  /* ---- 5 · THE CONTRACT FILLS ITS COLUMN AT A STEADY SIZE ----
     The sheet was a fixed 660px page MAGNIFIED to fit its column, so the words
     changed size as the divider moved. It is fluid now: the paper takes the
     column, the reader's own text-size choice is the only thing that changes
     the words, and the margins are the render's 56px. The zoom wrapper is
     pinned at 1 in the same breath; see rlApplyDocZoom, which no longer
     computes a fit, and RL_LEFT_MAX, which now measures the sheet's own
     readable ceiling rather than 660 × 2. */

  ${''/* The paper keeps its own warm hairline — that border belongs to the
         document, not to the page furniture. What it loses is the drop shadow:
         with the sheet filling its column there is nothing for a sheet to float
         above, and the render draws a flat page. */}

  ${''/* A MIN-WIDTH, and that is not a style choice. The sheet's narrow
         padding is set by an earlier phone-width block, and this sheet is
         written later — an unconditional 56px here would beat it and squeeze
         the phone. Writing the WIDE case behind min-width leaves that block the
         last word below 1024, where it belongs. It also keeps the phone's
         queue-unwind the LAST phone-width block in this file, which is how f95
         finds it. */}
  @media (min-width:1024px){

  }
  .redline-page .nego-pane.working{padding:0}
  /* The front matter and the body take the render's own sizes. --doc-scale
     still multiplies every one of them, so the reader's stepper reaches the
     paper exactly as it did. */
  .redline-page .rl-paper-title{font-size:calc(17px * var(--doc-scale,1));font-weight:700}
  .redline-page .rl-paper-sub{font-size:calc(13px * var(--doc-scale,1))}
  .redline-page .rl-clause h1,.redline-page .rl-clause h2,
  .redline-page .rl-clause h3,.redline-page .rl-clause h4,
  .redline-page .rl-clause h5,.redline-page .rl-clause h6{
    font-size:calc(14px * var(--doc-scale,1));font-weight:700}
  .redline-page .rl-doc .rl-paper p,.redline-page .rl-doc .rl-paper li{
    font-size:calc(14px * var(--doc-scale,1));line-height:1.75}

  /* ---- 6 · THE CHANGE COLUMN GROWS UP A SIZE ----
     The caption, the filters, the amber band and the cards all take the
     render's sizes. THE COLUMN ITSELF STAYS TRANSPARENT — the mock-up boxes it
     and the owner's own earlier decision does not, because at the 300px the
     divider allows a box round a column of boxes reads as clutter. */

  .redline-page .rl-card-verbs .rl-acc,.redline-page .rl-card-verbs .rl-send{font-weight:700}

  ${''/* A RECEIPT IS A SHAPE, NOT A TYPE SCALE. It shrank its id, its state and
         its clause a size below the working card's, which read fine on the
         owner's bench and broke the one rule this markup is built on: the same
         change must measure the same on both seats, and the two seats
         legitimately classify a change differently (their unsent draft is our
         sent ask). The receipt keeps the card's type and earns its height back
         from its padding and its missing verbs. */}


  `;
  document.head.appendChild(s);
}

if (typeof window !== 'undefined') Object.assign(window, { negoStyleHtml, redlineLayoutCss });
