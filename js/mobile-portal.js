/* ============================================================================
   THE PHONE — the other side of the table.

   Three surfaces belong to somebody who does not work here: the negotiation
   link, the signing link and the read-only viewer. They are already single
   column below 1024, so this is not a second layout — it is the phone sizing
   pass over the one that exists, plus the two structural moves a phone needs:
   the action bar becomes sticky, and the identity strip stops trying to be one
   line.

   WHY NOT A SECOND SHELL, THE WAY THE OWNER GETS ONE. Because these pages are
   already one thing at a time. The owner's app is a sidebar, a work area and an
   activity column competing for a screen; a share link is a document and one
   panel. What it needed was room and thumb-sized targets, not a rearrangement.

   THE COPILOT IS NOT HERE, AND THAT IS THE POINT. There is no launcher on any
   of these three and there is no route to one: the phone shell only draws
   itself when the owner's app shell is on screen, and these pages never start
   it. The counterparty's side of a negotiation is not a place where our
   assistant reads over their shoulder.

   WHAT STAYS EXACTLY AS IT WAS. Per-change Accept and Reject held until one
   send; a decline that will not go without a reason; the read-only copy a
   counterparty can mint for their own adviser; the bound identity on a signing
   link and its "Signer N of M"; the what-changed review; draw or type a mark;
   the frozen snapshot, its watermark and print-only viewer. Every one of those
   is upstream behaviour and none of it is touched here.
   ============================================================================ */

const M_PORTAL_CSS = `
@media (max-width:767px){
  /* ---- the page ----
     The desktop portal is a fixed-height flex column that never scrolls as a
     page, because its panes scroll inside themselves. On a phone that is how a
     document becomes a 200px window onto a contract. The page scrolls; the
     panes give up their inner scroll and grow. */
  .pw-page{
    height:auto!important; min-height:100dvh; overflow:visible!important;
    padding:8px 10px calc(env(safe-area-inset-bottom,0px) + 96px)!important;
    gap:8px!important;
  }
  /* ---- the identity strip ----
     Six things on one line at 390px is six things clipped. It wraps, the name
     gets the full width, and the reading verbs fall underneath where they are
     still 44px each. */
  .pw-id{ flex-wrap:wrap!important; padding:10px 12px!important; row-gap:8px!important; }
  .pw-id-main{ flex:1 1 100%!important; order:1; }
  .pw-id-badge{ order:0; }
  .pw-id-main h1{ font-size:17px!important; white-space:normal!important; }
  .pw-id-sub{ font-size:13.5px!important; }
  .pw-id-read{ order:2; flex:1 1 100%!important; }
  .pw-id .nego-who{ order:3; margin-left:0!important; flex:1 1 100%!important; }
  .pw-id .nego-who input{ min-width:0!important; width:100%; font-size:16px!important; min-height:44px!important; }
  .pw-id-rule{ display:none!important; }
  .ui-btn.pw-id-verb{ flex:1 1 auto!important; min-height:44px!important; font-size:14px!important; }
  .pt-focus-btn{ display:none!important; }

  /* ---- the panes ---- */
  .pw-mount{ min-height:0!important; }
  .pw-mount>*{ min-height:0!important; }
  .nego-work{ grid-template-columns:100%!important; }
  .nego-pane{ min-height:0; }
  .nego-pane .nego-doc{ padding:20px 14px!important; font-size:15px!important; line-height:1.7; }
  .nego-pane.working .nego-doc{ padding-left:14px!important; }
  .nego-doc h1{ font-size:18px!important; }
  .nego-badge{ position:static!important; display:inline-block!important; margin:0 0 6px!important; }
  .nego-pane-head{ padding:10px 12px!important; }

  /* ---- every verb on these pages ----
     The counterparty is doing something consequential on a phone they were
     handed a link on. Nothing they press should be smaller than a thumb. */
  .pw-page .ui-btn, .pv-page .ui-btn, .nego-card .ui-btn{
    min-height:44px!important; font-size:15px!important; padding:0 14px!important;
  }
  .pw-page input[type=text], .pw-page input[type=email], .pw-page textarea,
  .pv-page input, .pv-page textarea{ font-size:16px!important; }

  /* ---- the decision bar ----
     Accept and Reject per change, then ONE send. On a phone the send has to be
     reachable without scrolling to the end of a contract, so the page's action
     bar sticks to the bottom — the decisions themselves are still held until it
     is pressed, which is the rule that matters and is not changed here. */
  .pw-notes{ gap:8px!important; }
  #nego-actions, .nego-actionbar, .pt-actions{
    position:sticky!important; bottom:0; z-index:8;
    background:var(--color-surface); border-top:1px solid var(--color-divider);
    padding:10px 12px calc(env(safe-area-inset-bottom,0px) + 12px)!important;
    margin:0 -10px -12px!important;
    display:flex; flex-wrap:wrap; gap:8px;
  }
  #nego-actions .ui-btn, .nego-actionbar .ui-btn, .pt-actions .ui-btn{ flex:1 1 45%; }

  /* ---- the change cards ---- */
  .nego-card{ padding:12px 13px!important; }
  .nego-card, .nego-card *{ font-size:15px; }
  .nego-card .nego-card-head{ flex-wrap:wrap; }

  /* ---- the read-only viewer ----
     A frozen snapshot, watermarked, and printable. Nothing else — there is no
     reply channel on this page and there must not appear to be one. */
  .pv-page{ padding:14px 12px calc(env(safe-area-inset-bottom,0px) + 40px)!important; }
  .pv-sheet{ padding:22px 16px!important; font-size:15px; }
  /* The mark scales with the sheet rather than the viewport, so it stays
     readable-through rather than becoming a wall at 320px. */
  .pv-sheet::before{ font-size:clamp(20px,9vw,34px)!important; }
  .pv-banner{ padding:12px 14px!important; }
  .pv-banner .pv-sub{ font-size:13.5px!important; }
  .pv-chg-body{ font-size:15px!important; }
  .pv-note, .pv-foot, .pv-chg-state{ font-size:13.5px!important; }
  .pv-changes h2{ font-size:17px!important; }

  /* ---- the signing surface ----
     The bound identity, the step it is on, what changed, and the mark. The
     canvas keeps a real signing area: a 200px box is the smallest a finger can
     produce a signature in that its owner recognises. */
  .sig-pad, canvas.sig-canvas, [data-sig-canvas]{
    width:100%!important; height:200px!important; touch-action:none;
  }
  .sig-tabs button, [data-sig-tab]{ min-height:44px!important; font-size:15px!important; }
}`;

let _mPortalCssDone = false;
function mPortalInjectCss(){
  if(_mPortalCssDone) return;
  if(typeof document==='undefined' || !document.head || !document.createElement) return;
  const el = document.createElement('style');
  el.id = 'm-portal-css';
  el.textContent = M_PORTAL_CSS;
  document.head.appendChild(el);
  _mPortalCssDone = true;
}

if(typeof window!=='undefined' && typeof document!=='undefined' && document.addEventListener){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', mPortalInjectCss);
  else mPortalInjectCss();
}

Object.assign(window,{ mPortalInjectCss, M_PORTAL_CSS });
