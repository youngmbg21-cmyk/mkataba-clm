/* ============================================================================
   THE PHONE — HaTi Copilot.

   The panel already exists. This file gives it a phone layout and one new way
   in; it does not rebuild it, and it must not.

   WHAT CHANGES ON A PHONE
     · #ai-panel goes full-screen instead of a 430px drawer. There is nothing
       behind a full-screen panel to dim, so no scrim; nothing to dock beside,
       so no docked mode; and nothing to expand into, so the expand control is
       hidden rather than left to widen a panel that is already the window.
     · a launcher pill sits above the tab bar on the four screens that have one,
       carrying a [data-ai-badge] dot. The dot is the SAME dot: updateAIBadge
       drives every element with that attribute off one ai.unread / ai.minimized
       state, so reading through any door clears the indicator on all of them.
     · a tapped sentence stands in for a highlight.

   WHAT DOES NOT CHANGE, and is not re-implemented here
     · the greeting and its "guidance, not legal advice" line — openAI writes it
     · the Plain / Legal register toggle — renderAIStyleToggle
     · the absence of suggested questions — renderAISuggest is a no-op upstream
       and stays one; the chips were removed on purpose
     · nothing writes until Apply; flipping a placement never re-asks the model;
       closing drops a seeded passage and minimizing keeps it; a summoned panel
       steps back once the errand is settled — all of that is in js/ai.js and
       js/views/negotiation.js, and the phone inherits it by not touching it
     · the feed follows the conversation and the composer auto-grows —
       renderAIFeed and chatFieldWire, unchanged

   AND THE COPILOT IS WITHHELD FROM THE OTHER SIDE. There is no launcher on the
   portal, the signing page or the read-only viewer, and there cannot be: the
   phone shell only draws itself when the owner's app shell is on screen, and
   those three are a different root entirely.
   ============================================================================ */

const M_AI_SCREENS = ['home','contracts','approvals','portfolio'];

/* ------------------------------------------------------------------ CSS ----*/
const M_AI_CSS = `
@media (max-width:767px){
  /* THE PANEL IS THE WINDOW.
     max-width is inline on the element (430px), so it takes an !important to
     move — see the note about inline styles at the top of js/mobile.js. */
  #ai-panel{
    max-width:none!important; width:100%!important; left:0!important;
    border-left:0!important; z-index:60!important;
  }
  /* No scrim: there is nothing behind it to see. Left in the DOM and simply
     never shown, so the desktop's own open/close bookkeeping is untouched. */
  #ai-scrim{ display:none!important; }
  /* Nothing to expand into. */
  #ai-expand{ display:none!important; }
  /* Docked mode is a drawer beside a page; a full-screen panel has no beside. */
  #ai-panel.docked{ max-width:none!important; box-shadow:none!important; }

  /* The notch and the home indicator. */
  #ai-panel > header{ padding-top:calc(env(safe-area-inset-top,0px) + 12px)!important; }
  #ai-panel > footer{ padding-bottom:calc(env(safe-area-inset-bottom,0px) + 14px)!important; }

  /* Type and targets. The panel was drawn for a mouse: 11–13px text and 32px
     buttons. Both are lifted here and only here — the desktop panel keeps its
     density, which is the right density for a 430px drawer beside a document. */
  #ai-panel .h-8.w-8{ height:44px!important; width:44px!important; }
  #ai-feed{ font-size:var(--t-card); padding-left:14px!important; padding-right:14px!important; }
  #ai-feed .ai-p, #ai-feed .ai-list li{ font-size:var(--t-card); line-height:1.55; }
  #ai-feed .ai-h{ font-size:var(--t-card); }
  #ai-feed .ai-table{ font-size:var(--t-card); }
  #ai-feed .ai-target-body{ font-size:var(--t-card); }
  #ai-feed .ai-target-head{ font-size:var(--t-meta); }
  #ai-panel #ai-input{ font-size:16px!important; padding:13px!important; }
  #ai-panel #ai-send{ height:48px!important; width:48px!important; }
  #ai-panel #ai-style button{ min-height:36px; font-size:var(--t-card)!important; padding:0 13px!important; }
  /* The "Answers" caption above the register toggle. */
  #ai-panel #ai-style, #ai-panel #ai-style ~ *{ font-size:var(--t-card); }
  #ai-panel .text-\\[10px\\]{ font-size:var(--t-meta)!important; }
  #ai-panel .px-5{ padding-left:14px!important; padding-right:14px!important; }

  /* THE PROPOSAL CARD, at phone size.
     Every part of it survives — the "Proposed wording" pill, the clause label,
     the wording or its editor, the anchor line that follows the placement, the
     placement control, the light-red optional "Why this change?" box and the
     three verbs — because a card with a part missing is a card that promises
     something it cannot do. What changes is that nothing on it is under 14px
     or under 44px any more. */
  #ai-feed .ai-proposal{ padding:13px 14px!important; gap:10px!important; }
  #ai-feed .ai-proposal > div:first-child > span:first-child{ font-size:var(--t-meta)!important; padding:3px 9px!important; }
  #ai-feed .ai-proposal > div:first-child > span:nth-child(2){ font-size:var(--t-card)!important; }
  #ai-feed .ai-proposal-text{ font-size:var(--t-card)!important; line-height:1.65!important; }
  #ai-feed .ai-suggestion-editor{ font-size:var(--t-card)!important; line-height:1.6!important; }
  #ai-feed .ai-proposal [data-ai-prop-why]{ font-size:var(--t-card)!important; min-height:48px!important; padding:9px 11px!important; }
  #ai-feed .ai-proposal label > span:first-child{ font-size:var(--t-meta)!important; }
  #ai-feed .ai-proposal .ui-btn{ min-height:44px!important; font-size:var(--t-card)!important; padding:0 14px!important; }
  #ai-feed .ai-proposal [data-ai-prop-apply]{ flex:1; min-width:130px; }
  /* The placement chips and the anchor line under them. */
  #ai-feed .ai-proposal [data-ai-placement]{ min-height:38px!important; font-size:var(--t-card)!important; padding:0 var(--s-3)!important; }
  #ai-feed .ai-proposal .ai-anchor, #ai-feed .ai-prop-anchor{ font-size:var(--t-card)!important; }

  /* THE LAUNCHER.
     A pill rather than a circle: "Copilot" said in words is the difference
     between a button people press and a button people wonder about. It sits
     clear of the tab bar so a thumb reaching for Approvals never catches it. */
  .m-ai-fab{
    position:fixed; right:16px; z-index:30;
    bottom:calc(env(safe-area-inset-bottom,0px) + 96px);
    height:52px; padding:0 18px 0 15px; border:0; border-radius:var(--radius); cursor:pointer;
    background:var(--brand-grad); color:#fff; display:flex; align-items:center; gap:var(--s-2);
    box-shadow:0 8px 22px -8px color-mix(in srgb,var(--accent-solid) 75%,transparent);
    font:inherit;
  }
  .m-ai-fab-label{ font-size:var(--t-card); font-weight:var(--w-title); font-family:var(--font-heading,inherit); }
  .m-ai-fab .ai-badge-dot{
    position:absolute; top:-2px; right:-2px; width:13px; height:13px; border-radius:50%;
    background:var(--st-amber-dot); border:2.5px solid var(--color-bg);
  }
  .m-ai-fab .ai-badge-dot.hidden{ display:none; }

  /* THE PASSAGE MENU, as a sheet.
     The desktop menu is anchored to a selection rectangle, which is the right
     answer for a cursor and the wrong one for a thumb — half the time the
     rectangle is under the finger that made it. On a phone the same three
     items come up from the bottom instead, where nothing is covering them. */
  .nego-selmenu{
    position:fixed!important; left:12px!important; right:12px!important;
    top:auto!important; bottom:calc(env(safe-area-inset-bottom,0px) + 16px)!important;
    width:auto!important; max-width:none!important; z-index:70!important;
    border-radius:var(--radius)!important; padding:var(--s-2)!important;
    box-shadow:var(--shadow-lg)!important;
  }
  .nego-selmenu button{ min-height:48px!important; font-size:16px!important; }
  .nego-selmenu .nego-selquote{ font-size:var(--t-card)!important; }
  .nego-selmenu .nego-selhead{ font-size:var(--t-meta)!important; }

  /* The sentence a tap can reach, marked so it looks reachable. Underlined
     rather than boxed: a box around every sentence turns a contract into a
     form, and the document has to go on reading like a document. */
  .m-tappable{ border-bottom:1.5px dotted var(--color-neutral-400); border-radius:var(--radius); }
  .m-tapped{ background:var(--st-steel-bg); }
}`;

let _mAiCssDone = false;
function mAiInjectCss(){
  if(_mAiCssDone) return;
  if(typeof document==='undefined' || !document.head || !document.createElement) return;
  const el = document.createElement('style');
  el.id = 'm-ai-css';
  el.textContent = M_AI_CSS;
  document.head.appendChild(el);
  _mAiCssDone = true;
}

/* --------------------------------------------------------- THE LAUNCHER ----*/
function mAiLauncherHtml(){
  const s = (typeof mS==='function') ? mS() : null;
  if(!s || !M_AI_SCREENS.includes(s.screen)) return '';
  /* The panel being open is the one state with no launcher: a button offering
     to open what is already covering the screen. */
  if(typeof ai==='object' && ai && ai.open) return '';
  return `
    <button class="m-ai-fab" data-m-act="copilot-open" aria-label="${i18t('m_open_copilot')}">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.6 4.6 4.6 1.6-4.6 1.6L12 15l-1.6-4.7L5.8 8.7l4.6-1.6L12 2.5zM18.5 14l.9 2.5 2.6.9-2.6.9-.9 2.6-.9-2.6-2.5-.9 2.5-.9.9-2.5z"/></svg>
      <span class="m-ai-fab-label">${i18t('m_copilot')}</span>
      <span data-ai-badge class="ai-badge-dot hidden"></span>
    </button>`;
}

/* ------------------------------------------------- SENTENCE → THE COPILOT ---
   THE MOBILE STAND-IN FOR HIGHLIGHTING.

   Long-press selection inside a scrolling document is unreliable on touch: the
   press competes with the scroll, the handles land under the finger, and half
   the attempts end with the page moved and nothing selected. So a tap does it.

   What a tap does NOT do is take a private route into the Copilot. It builds
   the same DOM Range a drag would have built — the sentence around the point
   touched — installs it as the document's selection, and then lets the page's
   own mouseup handler run. Everything after that is the path that already
   exists: negoReadPassage reads the range, the front-matter refusal still
   refuses, the live-redline refusal still refuses, the three-item menu is
   rlSelMenu's, and the ask goes through rlAiPropose untouched.

   That is the whole point. A second way to select wording is acceptable; a
   second way to propose wording is not. */
const M_PANE_SEL = '.nego-pane.working .nego-doc, .nego-doc[data-nego-working]';

/* Sentence boundaries, found in the text node under the finger. Deliberately
   simple: a full stop, question mark or semicolon followed by a space, plus the
   ends of the node. A clause is not prose and an over-clever splitter that cut
   "Clause 3.1" in half at the stop would be worse than a blunt one. */
function mSentenceRange(node, offset){
  if(!node || node.nodeType!==3) return null;
  const t = node.nodeValue || '';
  if(!t.trim()) return null;
  let start = 0, end = t.length;
  for(let i = Math.min(offset, t.length-1); i > 0; i--){
    if(/[.?;]/.test(t[i-1]) && /\s/.test(t[i])){ start = i+1; break; }
  }
  for(let i = Math.max(offset,0); i < t.length-1; i++){
    if(/[.?;]/.test(t[i]) && /\s/.test(t[i+1])){ end = i+1; break; }
  }
  while(start < end && /\s/.test(t[start])) start++;
  if(end - start < 3) return null;
  const r = document.createRange();
  r.setStart(node, start);
  r.setEnd(node, end);
  return r;
}

/* Where the finger landed, in document terms. Two spellings of the same API. */
function mCaretAt(x, y){
  if(document.caretRangeFromPoint){
    const r = document.caretRangeFromPoint(x, y);
    return r ? { node:r.startContainer, offset:r.startOffset } : null;
  }
  if(document.caretPositionFromPoint){
    const p = document.caretPositionFromPoint(x, y);
    return p ? { node:p.offsetNode, offset:p.offset } : null;
  }
  return null;
}

function mWireSentenceTap(){
  if(typeof document==='undefined' || !document.addEventListener) return;
  if(mWireSentenceTap._done) return;
  mWireSentenceTap._done = true;

  document.addEventListener('click', e => {
    if(typeof mPhone!=='function' || !mPhone()) return;
    const t = e.target;
    if(!t || !t.closest) return;
    /* Controls keep their own jobs. The same guard list the desktop selection
       handler uses, so a tap on a tool is a tap on a tool on both. */
    if(t.closest('.nego-tool, .nego-selmenu, .nego-aipop, #ai-panel, [data-nego-editor], button, a, input, textarea, select')) return;
    const pane = t.closest(M_PANE_SEL);
    if(!pane) return;
    /* Only where a change could actually be filed. An executed contract's pane
       renders read-only and offers no verbs; opening a menu over it would be
       offering one. */
    if(pane.closest('[data-nego-readonly]')) return;

    const at = mCaretAt(e.clientX, e.clientY);
    if(!at) return;
    const range = mSentenceRange(at.node, at.offset);
    if(!range) return;

    const sel = window.getSelection && window.getSelection();
    if(!sel) return;
    try{ sel.removeAllRanges(); sel.addRange(range); }catch(_){ return; }

    /* Hand it to the page's own handler, exactly as a finished drag would.
       Dispatched on the tapped element so it bubbles to the host that is
       listening, and after the selection is in place so the handler finds it. */
    try{
      t.dispatchEvent(new MouseEvent('mouseup', { bubbles:true, cancelable:true,
        clientX:e.clientX, clientY:e.clientY }));
    }catch(_){}
  }, false);
}

/* Mark the sentences so they look like something a finger can aim at. Run
   after each redline paint; cheap, and idempotent by construction — a node
   already wrapped carries the class and is skipped. */
function mMarkTappable(){
  if(typeof mPhone!=='function' || !mPhone()) return;
  if(typeof document==='undefined' || !document.querySelectorAll) return;
  /* Split on the comma before appending the descendant part. `a, b` + ` c`
     reads as `a` OR `b c` — the first branch loses its descendant and matches
     the whole pane instead of the clauses inside it. */
  const sel = M_PANE_SEL.split(',').map(s => s.trim() + ' [data-clause]').join(', ');
  document.querySelectorAll(sel).forEach(el=>{
    if(el.classList && !el.classList.contains('m-tappable')) el.classList.add('m-tappable');
  });
}

/* ----------------------------------------------------------- THE PANEL -----
   Two things the phone has to do to a panel it otherwise leaves alone: never
   let it open docked (there is no beside), and keep the feed at the bottom
   after a paint the way every chat surface does. */
function mAiHookPanel(){
  if(typeof window==='undefined' || !window.openAI || window.openAI._mHooked) return;
  const inner = window.openAI;
  const wrapped = function(prefill, opts){
    const o = Object.assign({}, opts||{});
    /* Docked is a drawer that shares the screen with a page. At this width
       there is no page beside it, and a docked full-screen panel would leave
       the scrim bookkeeping saying a scrim is up when none is. */
    if(mPhone()) o.docked = false;
    const r = inner.call(this, prefill, o);
    if(mPhone()){
      /* The launcher goes away while the panel is up, and comes back when it
         is not — one repaint of the phone shell covers both. */
      try{ if(typeof mRender==='function') mRender(); }catch(_){}
      mAiFeedToBottom();
    }
    return r;
  };
  wrapped._mHooked = true;
  window.openAI = wrapped;

  ['closeAI','minimizeAI'].forEach(k=>{
    if(!window[k] || window[k]._mHooked) return;
    const f = window[k];
    const w = function(){ const r = f.apply(this, arguments);
      if(mPhone()){ try{ if(typeof mRender==='function') mRender(); }catch(_){} }
      return r; };
    w._mHooked = true;
    window[k] = w;
  });

  /* Every repaint of the feed ends at the newest message. An answer that lands
     below the fold is an answer nobody reads — and on a phone the fold is four
     lines up. */
  if(window.renderAIFeed && !window.renderAIFeed._mHooked){
    const rf = window.renderAIFeed;
    const w = function(){ const r = rf.apply(this, arguments); if(mPhone()) mAiFeedToBottom(); return r; };
    w._mHooked = true;
    window.renderAIFeed = w;
  }
}

function mAiFeedToBottom(){
  const feed = document.getElementById('ai-feed');
  if(!feed) return;
  const put = ()=>{ try{ feed.scrollTop = feed.scrollHeight; }catch(_){} };
  put();
  if(typeof requestAnimationFrame==='function') requestAnimationFrame(put);
}

/* The phone's own actions that belong to the Copilot. Reached through the
   shell's data-m-act dispatch, so there is one place actions are named. */
function mCopilotAct(k){
  if(k==='copilot-open'){ if(window.openAI) openAI(); return true; }
  return false;
}

function mAiBoot(){
  mAiInjectCss();
  mAiHookPanel();
  mWireSentenceTap();
}

if(typeof window!=='undefined' && typeof document!=='undefined' && document.addEventListener){
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>setTimeout(mAiBoot,0));
  else setTimeout(mAiBoot,0);
}

Object.assign(window,{ mAiLauncherHtml, mAiInjectCss, mAiHookPanel, mWireSentenceTap,
  mMarkTappable, mAiFeedToBottom, mCopilotAct, mSentenceRange, mCaretAt, M_AI_SCREENS });
