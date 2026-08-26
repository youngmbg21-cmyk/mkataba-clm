// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ---------- counterparty portal (opened from a share link) ---------- */
window.PORTAL_OPTS={};
/* The mirror of the owner's returned-changes strip. When a counterparty has
   proposed edits and the other side has ruled on them, the reshared link used to
   arrive looking like any other first-time share — leaving them to diff two
   documents by eye to find out what happened to their proposal. */
/* The Word round-trip is gone from both sides. A counterparty reads, marks
   up and answers the contract on this page; there is no file to take away and
   none to bring back. js/docx.js still READS a .docx, because a contract can
   still ARRIVE as one — that is intake, and a different thing entirely. */
function portalVersions(){
  const p=PORTAL_OPTS.payload;
  return (p&&p.contract&&Array.isArray(p.contract.versions))?p.contract.versions:[];
}
/* The wording this reader should be compared against, best source first. The
   third is the one that matters most for inbound contracts and was missing:
   when a counterparty sends their own paper and it comes back edited, the thing
   they need to see is what was done to THEIR document. That is a first send,
   not a reshare, so neither of the other two baselines exists — and the most
   consequential change in the whole product was going unannounced. */
function portalChangedText(){
  const now=portalCurrentText();
  if(!now||!now.trim()) return null;
  const moved = before => before && before.trim() && normText(before)!==normText(now);

  const prior=PORTAL_OPTS.prior;                       // a copy they opened before
  if(prior&&prior.text){
    return moved(prior.text)
      ? { kind:'reshare', before:prior.text, after:now, at:prior.at, openedAt:prior.openedAt }
      : null;                                          // reshared, but nothing moved
  }
  const sent=portalVersions().filter(v=>v.label==='Sent to you');
  const previous=sent.length>1?sent[sent.length-2]:null;   // the snapshot of the last send
  if(previous&&moved(previous.text))
    return { kind:'reshare', before:previous.text, after:now, at:previous.at, openedAt:null };

  const p=PORTAL_OPTS.payload;                         // their own paper, as it arrived
  const filed=(p&&p.contract&&p.contract.upload&&p.contract.upload.extractedText)||'';
  if(moved(filed))
    return { kind:'yourpaper', before:filed, after:now, at:null, openedAt:null };
  return null;
}
function portalCurrentText(){
  const p=PORTAL_OPTS.payload;
  return (p&&p.contract&&p.contract.docText)||'';
}
/* ---------- HAS THIS READER SEEN THIS REVISION? ----------
   The banner is a NOTICE, not a decision: it says the sender moved the wording
   since you last opened it. A notice you cannot put down is a notice that stops
   being read — it sat above the contract on every visit with no way to say "yes,
   I have looked", so the one signal that means "something moved" became part of
   the furniture.

   KEYED ON THE WORDING, NOT ON THE FACT OF A REVISION. The next revision is a
   different text, and it must raise the banner again however recently the last
   one was put down. Hashing the text the reader is being shown is what makes
   "read" mean "read THIS", rather than "stop telling me about this contract".

   Per browser, like every other reading preference here: this is one person
   saying they have looked, and it is not the counterparty's answer to anything
   — nothing about it is written to the record or sent to the sender. */
const PT_READ_KEY='hati.v1.ptRevisionRead';
function ptReadMap(){
  try{ return JSON.parse(localStorage.getItem(PT_READ_KEY)||'{}')||{}; }catch(e){ return {}; }
}
function ptRevisionKey(ch){
  const p=PORTAL_OPTS.payload||{};
  const id=(p.contract&&p.contract.id)||'?';
  const t=String((ch&&ch.after)||'');
  let h=0; for(let i=0;i<t.length;i++){ h=(h*31+t.charCodeAt(i))|0; }
  return id+':'+((h>>>0).toString(36));
}
function ptRevisionRead(ch){ return !!(ch && ptReadMap()[ptRevisionKey(ch)]); }
function ptSetRevisionRead(ch, read){
  if(!ch) return;
  const m=ptReadMap(), k=ptRevisionKey(ch);
  if(read) m[k]=1; else delete m[k];
  try{ localStorage.setItem(PT_READ_KEY, JSON.stringify(m)); }catch(e){}
}
/* Put the notice down, or bring it back. Taking it down is a node removal —
   the page behind it must not be rebuilt for a notice — but putting it back
   needs the markup that is no longer there, so that one repaints. Marking
   something unread is the rare half of a rare control; the repaint is cheap
   where it is almost never spent. */
function portalHideRevisedBanner(){
  document.querySelectorAll('#pt-revised').forEach(n=>n.remove());
}
function portalShowRevisedBanner(p){
  if(document.getElementById('pt-revised')) return;
  if(window.renderSharePortal) renderSharePortal(PORTAL_OPTS.payload, PORTAL_OPTS);
}
/* Wired from both places the banner is drawn, through one function, because it
   IS drawn in two places (the negotiate seat and the signing seat) and a
   dismiss bound at only one of them is a dismiss that works on one screen. */
function portalWireRevisedBanner(p){
  document.getElementById('pt-see-changes')?.addEventListener('click',()=>openPortalCompare(p));
  document.getElementById('pt-revised-dismiss')?.addEventListener('click',()=>{
    ptSetRevisionRead(portalChangedText(), true);
    portalHideRevisedBanner();
    if(window.toast) toast(i18t('po_marked_read_reopen'));
  });
}

function portalRevisedBanner(){
  const ch=portalChangedText();
  /* Read means read: the notice does not come back for this wording. */
  if(!ch || ptRevisionRead(ch)) return '';
  const st=(window.diffStats?diffStats(ch.before,ch.after):{add:0,del:0});
  const when=ch.openedAt||ch.at;
  const org=esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.org)||'The sender');
  const headline=ch.kind==='yourpaper'
    ? `${org} has made changes to the document you sent`
    : `${org} has revised this contract since you last opened it`;
  const sub=ch.kind==='yourpaper'
    ? `+${st.add} added · −${st.del} removed · measured against your own paper`
    : `+${st.add} added · −${st.del} removed · your copy was dated ${fmtDT(when)}`;
  return `
    <div id="pt-revised" style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot);border-radius:0;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span class="pt-pip" style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-amber-dot);color:#fff;font-size:var(--t-card);font-weight:var(--w-title)">!</span>
      <span style="flex:1;min-width:220px;line-height:1.45">
        <span style="display:block;font-size:var(--t-card);font-weight:var(--w-strong);color:var(--st-amber-fg)">${headline}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-600);font-family:var(--font-mono)">${sub}</span>
      </span>
      <button id="pt-see-changes" style="flex:none;font:inherit;font-size:var(--t-body);font-weight:var(--w-strong);border:0;border-radius:0;padding:9px var(--s-4);cursor:pointer;background:var(--st-amber-dot);color:#fff">${i18t('po_see_what_changed')}</button>
      <button id="pt-revised-dismiss" title="${i18t('po_mark_read_wont_come_back')}"
        aria-label="${i18t('po_mark_read_dismiss')}"
        style="flex:none;width:28px;height:28px;display:grid;place-items:center;border:1px solid var(--st-amber-line);background:transparent;color:var(--st-amber-fg);border-radius:0;cursor:pointer;font:inherit;font-size:var(--t-card);line-height:1">&times;</button>
    </div>
    <style>
      @keyframes pt-pulse{0%,100%{box-shadow:0 0 0 0 rgba(184,134,43,.55)}50%{box-shadow:0 0 0 6px rgba(184,134,43,0)}}
      #pt-revised .pt-pip{animation:pt-pulse 1.9s ease-out infinite}
      @media (prefers-reduced-motion:reduce){ #pt-revised .pt-pip{animation:none} }
    </style>`;
}
/* A2 + B — the same full-window surface the owner reviews their edits in,
   pointed at the other pair of texts, and ending in the three answers a reader
   actually has: accept, counter, decline. */
function openPortalCompare(p){
  const ch=portalChangedText(); if(!ch) return;
  const st=(window.diffStats?diffStats(ch.before,ch.after):{add:0,del:0});
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  /* THE SENDER'S COVERING NOTE USED TO CLOSE THIS DIALOG, under its own
     heading at the foot. Gone (13 Aug 2026, owner-asked): the dialog is opened
     to read what changed and it now ends with the wording. The note is in
     their inbox — see renderShareWorkbench for the whole rule and the other
     three places it used to print. */
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
            <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0">What ${esc(p.org||'the sender')} changed</h3>
            <span style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;background:var(--st-amber-bg);color:var(--st-amber-fg);border-radius:0;padding:3px 9px">${i18t('po_since_your_copy',{when:fmtDT(ch.openedAt||ch.at)})}</span>
          </div>
          <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:7px 0 0">+${st.add} added · −${st.del} removed ·
            <span style="background:var(--st-green-bg);color:var(--st-green-fg);padding:0 var(--s-1);border-radius:0">added</span>
            <span style="background:var(--st-ruby-bg);color:var(--st-ruby-dot);text-decoration:line-through;padding:0 var(--s-1);border-radius:0">removed</span></p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div style="${COL}">
          <div style="background:var(--color-doc-surface);box-shadow:var(--shadow-md);border-radius:0;padding:30px 36px;font-size:var(--t-card);line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(ch.before,ch.after)}</div>
        </div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          ${''/* ---- THIS SCREEN IS FOR READING, AND IT SAYS SO ----
                 It used to end in Decline / Propose further edits / Accept
                 these changes. Those are the answers to the CONTRACT, and they
                 are all still on the page behind this one (#pt-accept,
                 #pt-decline, #pt-changes) — offering them again here made a
                 window whose only job is "show me what moved" the place a
                 negotiation could be settled by somebody who had opened it to
                 look. Two people pressing Accept from a diff viewer is one
                 accept too many.

                 What this window owes the reader is the other thing: a way to
                 put the notice down, and a way to pick it back up if they were
                 not finished. Nothing here is sent to the sender and nothing is
                 written to the record. */}
          <span style="font-size:var(--t-meta);color:var(--color-neutral-600);min-width:150px;flex:1">${i18t('po_marking_read_only')}</span>
          <button id="pc-unread" class="ui-btn">${i18t('po_mark_unread')}</button>
          <button id="pc-read" class="ui-btn ui-btn-primary">${i18t('po_mark_read')}</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  document.getElementById('pc-read').addEventListener('click',()=>{
    ptSetRevisionRead(ch, true);
    closeModal();
    portalHideRevisedBanner();
    if(window.toast) toast(i18t('po_marked_read'));
  });
  document.getElementById('pc-unread').addEventListener('click',()=>{
    ptSetRevisionRead(ch, false);
    closeModal();
    /* Bringing it back is the point of the control — a reader who opened this
       by accident, or ran out of time half way down, must be able to leave it
       standing. */
    portalShowRevisedBanner(p);
    if(window.toast) toast(i18t('po_marked_unread'));
  });
}
/* The counterparty's Compare — the mirror of the owner's toolbar button, and
   the answer to "how do I see what changed" when no banner happens to be up.
   Always available whenever the contract has been sent more than once; picks
   any two of the versions that travelled with the payload. */
/* Has anything actually happened on this contract that a history could show?
   Read from the change records the payload carried, so the button never opens
   an empty screen on a contract nobody has proposed anything on. */
function portalHasHistory(){
  const src=(PORTAL_OPTS.payload&&PORTAL_OPTS.payload.contract)||{};
  const chs=Array.isArray(src.changes)?src.changes.filter(x=>x&&x.status!=='superseded'):[];
  return chs.length>0;
}
/* IS THERE A SECOND TEXT TO MEASURE AGAINST? Compare used to be offered only
   where two versions had been sent or the wording had moved since the reader's
   last copy — so on a FIRST round, when a counterparty is looking at four asks
   and most wants to know what the document used to say, the button was not
   there at all. The original travels in the payload, so on round one it is the
   comparison, and this asks the honest question: is there anything to put
   beside what they are reading? */
function portalHasCompare(){
  const now=portalCurrentText();
  if(portalVersions().length>1 || portalChangedText()) return true;
  /* A LIVE ROUND IS THE COMMONEST CASE OF ALL, and it used to be the one with
     no button. Pending changes do not move the document — the agreed wording
     has not shifted — so the original and the current copy read word for word
     the same while three asks sit on the table, and every "is there anything to
     compare" test answered no. The owner's Compare solved this long ago by
     offering the PROPOSED state as its own comparable (js/versioning.js); the
     same is true here, so the same answer applies. */
  const src=(PORTAL_OPTS.payload&&PORTAL_OPTS.payload.contract)||{};
  const pend=(Array.isArray(src.changes)?src.changes:[])
    .filter(x=>x&&x.status==='pending'&&!x.withdrawn).length;
  if(pend) return true;
  const orig=portalOriginalText();
  return !!(orig && now && normText(orig)!==normText(now));
}
function portalCompareBar(){
  const vs=portalVersions();
  const ch=portalChangedText();
  const hist=portalHasHistory();
  const cmp=portalHasCompare();
  if(!cmp && !hist) return '';
  const line = vs.length>1
    ? `This contract has <b>${vs.length} versions</b>, numbered the same as ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.org)||'the sender')} sees them. You can compare any two.`
    : (ch&&ch.kind==='yourpaper'
        ? `The wording differs from the paper you sent. You can see exactly what was changed.`
        : ch
        ? `The wording has moved since the copy you were sent. You can see exactly what changed.`
        /* THE HISTORY AND THE COMPARISON ARE EACH A REASON FOR THIS BAR TO
           EXIST. It used to appear only where there were two versions or a
           fresh revision, so a counterparty on round one — asked to answer four
           changes — could neither read the story of how the wording got there
           nor put it beside the wording it started as. */
        : cmp && hist
        ? `Read every change in the order it happened, or put the wording beside the original.`
        : cmp
        ? `Put the wording you are reading beside the original, and see exactly what moved.`
        : `Every change proposed on this contract, in the order it happened, with what was decided.`);
  return `
    <div id="pt-history" style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:11px var(--s-4);margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;display:inline-flex;color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
      <span style="flex:1;min-width:180px;font-size:var(--t-body);color:var(--color-neutral-700);line-height:1.5">${line}</span>
      ${hist?`<button id="pt-hist" class="ui-btn pt-verb" style="flex:none;font-size:var(--t-body);padding:var(--s-2) 14px"
        title="${i18t('po_every_change_oldest')}">${
        icon('history','w-3.5 h-3.5',2)}Negotiation history</button>`:''}
      ${cmp?`<button id="pt-compare" class="ui-btn pt-verb" style="flex:none;font-size:var(--t-body);padding:var(--s-2) 14px"
        title="${i18t('po_two_versions_side')}">${
        icon('columns','w-3.5 h-3.5',2)}Compare wording</button>`:''}
    </div>`;
}
/* ---------- ONE DEFINITION OF WHAT A READING VERB LOOKS LIKE ----------
   These two buttons render from TWO functions — portalCompareBar above, for
   the signing screen, and portalReadingBtnsHtml below, for the negotiation
   workbench — and the treatment was fixed in one of them. The workbench pair
   came out tinted; the signing pair stayed white with no icon, which is the
   original complaint still shipping on the screen nobody re-checked. Measured
   rather than guessed: rgb(204,251,241) on one seat, rgb(255,255,255) on the
   other, same two verbs.

   So the look lives here, in a stylesheet both screens inject, rather than in
   whichever function somebody edits next. --color-accent-100 filled, the accent
   as the border, accent-800 for the text: loud enough to find, quiet enough not
   to read as a primary action, which neither screen has in that row. */
function portalVerbStyle(){
  if(document.getElementById('pt-verb-style')) return;
  const el=document.createElement('style'); el.id='pt-verb-style';
  /* .ui-btn.pt-verb, NOT .pt-verb — AND THAT IS THE WHOLE BUG.

     Both are one class, so they weigh the same, and a tie is settled by which
     stylesheet comes last. This one is injected when the page renders, and
     index.html's .ui-btn sits in a block that ends up after it — so .ui-btn
     won and the button went back to surface-white with --color-text on it.

     It passed every check I ran because the test harness copies index.html's
     styles in and then mounts the OWNER's screen first, which injects its own
     stylesheet before the portal ever renders. That put this sheet last and
     the tie fell the other way. The harness was not lying; it was answering a
     different question from the one production asks.

     Two classes beats one, whatever the order, so the sheet can be injected
     whenever and by whichever screen gets there first. */
  el.textContent=`
    /* ---- NO FILL: THEY MATCH THE DEAL VERBS BESIDE THEM (owner-reported
       23 Aug 2026: "the highlighted buttons should not be shaded inside and
       should resemble the ready to sign button") ----
       These carried an accent TINT while Ready to sign, Decline and Share a
       read-only copy — the deal verbs on the same row — are plain .ui-btn on a
       transparent face. So the READING controls were the loudest things on a
       row whose actual acts sat beside them unshaded, which is the weighting
       upside down.
       Flat is not grey, which is the lesson this product has learned three
       times: the border and the ink stay the workspace accent, so they are
       still plainly controls. Only the wash goes. Reaches pt-hist, pt-compare,
       pt-more and pt-bell — every button that wears this class — because a row
       where three lose the tint and one keeps it is the report coming straight
       back. */
    .ui-btn.pt-verb{color:var(--accent-ink);background:transparent;
      border-color:color-mix(in srgb,var(--accent-solid) 45%,transparent);}
    .ui-btn.pt-verb:hover{background:color-mix(in srgb,var(--accent-solid) 10%,transparent);
      border-color:var(--accent-solid);}
    .ui-btn.pt-verb svg{flex:none;}`;
  document.head.appendChild(el);
}
/* THE SAME TWO BUTTONS, WITHOUT THE CARD THEY USED TO ARRIVE IN.
   On the counterparty's workbench the reading bar was a second card stacked
   under the identity card: one sentence of explanation and two buttons, taking
   a band of height off the top of the document on a page whose whole job is to
   let somebody read a contract. The sentence is not carried up — carrying it up
   would rebuild the bulk being removed — and it was never the thing being
   clicked: each button's title says what it does, in the same words.

   The buttons sit in the identity card beside the type stepper, which is where
   a reader already looks for them.

   portalCompareBar() stays for the older signing screen, whose header is a dark
   band rather than a card with a row to join. */
/* WHY THESE ARE NOT ui-btn-secondary ANY MORE.

   That class exists for "a secondary action beside a primary" — it is
   transparent with a border at 45% opacity, and it recedes on purpose so it
   does not compete with the filled button next to it. There is no filled button
   next to it here. Nothing in this row is the main thing to do; the main thing
   is on the contract. So the pair was receding from a rival that never arrives,
   in a row of four identically-outlined pills, having lost the clock icon that
   used to sit beside them when they lived in a card of their own — no shape to
   aim at, only words. They were missed, repeatedly, by the person who put them
   there.

   Three separate ways to find them now, none of them loud: an icon, an accent
   tint, and a rule that says these two are verbs and the stepper beside them is
   not. The tint follows the Copilot launcher's own treatment (index.html
   #cmd-ai) — a colour-mix against the surface, so it holds in both themes
   rather than assuming a light one. */
function portalReadingBtnsHtml(){
  const hist=portalHasHistory();
  const cmp=portalHasCompare();
  return `
    <span class="pw-id-read">
      ${hist?`<button id="pt-hist" class="ui-btn pt-verb pw-id-verb"
        title="${i18t('po_every_change_oldest')}">${
        icon('history','w-3.5 h-3.5',2)}Negotiation history</button>`:''}
      ${cmp?`<button id="pt-compare" class="ui-btn pt-verb pw-id-verb"
        title="${i18t('po_two_versions_side')}">${
        icon('columns','w-3.5 h-3.5',2)}Compare wording</button>`:''}
      ${''/* READY TO SIGN USED TO BE MIRRORED HERE, and it is the real button
             now (owner-asked, 12 Aug 2026). The mirror existed because the act
             had two homes — a copy up here and the live one in the strip below
             — and a copy that recomputed the readiness gate would have been two
             sentences free to disagree. The strip is gone and the verbs moved
             into this row wholesale, so there is one button again, carrying its
             own gate, its own tooltip and its own handler. See
             portalNegoFootHtml, whose slot is now inside .pw-id. */}
    </span>
    <span class="pw-id-rule" aria-hidden="true"></span>`;
}

/* ---------- THEIR OWN "MORE" (owner-asked, 15 Aug 2026) ----------
   The owner's room has an overflow menu with nine rows in three groups. The
   counterparty had none, and three of those rows are things a person reading a
   contract they are being asked to sign obviously wants: a clean PDF, a Word
   file with the marks in it, and the room to read without a header.

   THREE ROWS, AND THE OTHER SIX ARE NOT OVERSIGHTS. Import their Word file
   writes to OUR record; Save as template fills OUR library; Delete this draft
   destroys OUR contract; the sealed Record row is our filing copy. Compare
   versions is the one that looks like a gap and is not — this page already
   carries Compare wording a few pixels to the left, and a second door onto one
   act is the duplication this rulebook opens with.

   IT IS A MENU AND MUST NEVER BECOME A <select>. PDF, Word and Focus mode are
   ACTS; a select would sit there afterwards wearing the last one as though it
   were a setting. Same rule, same words, as the history head's own menu.

   The .room-menu clothes are the app's, defined once in index.html — this page
   is inside the same document, so it inherits them rather than growing a
   private copy that drifts. */
function portalMoreMenuHtml(){
  const canWord=!!(window.docxExportTracked&&window.redlineDocHtml);
  return `
    <div class="pw-more-wrap">
      ${''/* ---- MORE IS WHITE INSIDE, LIKE ITS NEIGHBOURS (owner-asked 23 Aug
             2026) ---- It carried .pt-verb, which fills the face with
             --color-accent-100: MEASURED rgb(204,251,241) against the
             transparent faces of Ready to sign, Share a read-only copy and
             Decline, all three of which are plain .ui-btn. So the least
             important control in the row was the only filled one and read as
             its primary act.

             THE CLASS IS DROPPED FROM THIS BUTTON, NOT CHANGED. .pt-verb is
             the SIGNING screen's reading verbs, and it wears the workspace
             accent for a reason this rulebook records three times over — a
             neutral control there reads as furniture. Gutting the class to fix
             one button in another row would take that with it. */}
      <button id="pt-more" class="ui-btn pw-id-verb" type="button"
        aria-haspopup="true" aria-expanded="false" title="${i18t('po_more_title')}">
        <span aria-hidden="true" style="font-size:var(--t-card);line-height:1">&#8943;</span>
        <span class="pw-more-word">${i18t('ct_more')}</span>
        <span class="pw-more-caret" aria-hidden="true">${icon('chevD','w-3 h-3')}</span></button>
      <div id="pt-more-menu" class="room-menu hidden">
        <div class="mgroup">${i18t('ct_export')}</div>
        <button type="button" id="pt-pdf" title="${i18t('po_pdf_title')}">${
          icon('printer','w-3.5 h-3.5')}PDF<span class="mnote">${i18t('po_clean_copy')}</span></button>
        ${canWord?`<button type="button" id="pt-word" title="${i18t('po_word_title')}">${
          icon('file','w-3.5 h-3.5')}Word<span class="mnote">${i18t('po_tracked_changes')}</span></button>`:''}
        <hr>
        <div class="mgroup">${i18t('ct_view')}</div>
        <button type="button" id="pt-focus" data-rl-focus aria-pressed="false"
          title="${i18t('ct_focus_mode')}">${icon('scan','w-3.5 h-3.5')}${
          i18t('po_focus_mode')}<span class="mnote">${i18t('ct_esc_to_leave')}</span></button>
      </div>
    </div>`;
}
/* Opening and closing it, and the three acts. Wired from renderShareWorkbench
   beside the other header controls.

   THE OUTSIDE-PRESS LISTENER IS ARMED ONCE, on the document, and guarded on the
   menu still being there: this header is rebuilt by portalPaintAlerts and by
   every refill of the verb slot, so a listener added per paint would stack one
   per repaint — the same fault the history head's menu was fixed for, in the
   same week. */
let _ptMoreWired=false;
function wirePortalMore(c,p){
  const btn=document.getElementById('pt-more'), menu=document.getElementById('pt-more-menu');
  if(!btn||!menu) return;
  const shut=()=>{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); };
  if(!btn.dataset.ptWired){
    btn.dataset.ptWired='1';
    btn.addEventListener('click',ev=>{
      ev.stopPropagation();
      const open=menu.classList.toggle('hidden');
      btn.setAttribute('aria-expanded',open?'false':'true');
    });
    /* Every row closes the menu before it acts. A print dialog or a download
       opening over a menu still standing is a menu the reader has to dismiss
       afterwards to see the page they just acted on. */
    document.getElementById('pt-pdf')?.addEventListener('click',()=>{
      shut();
      if(window.exportPDF) exportPDF(c);
      else if(window.toast) toast(i18t('po_export_unavailable'),'err');
    });
    document.getElementById('pt-word')?.addEventListener('click',()=>{
      shut();
      if(window.exportWordTracked)
        exportWordTracked(c,{ side:'counterparty', author:portalResponderName()||(c&&c.counterparty)||'Counterparty' });
      else if(window.toast) toast(i18t('po_export_unavailable'),'err');
    });
    document.getElementById('pt-focus')?.addEventListener('click',()=>{
      shut();
      if(window.rlSetFocus) rlSetFocus(!(window.rlFocusOn&&rlFocusOn()));
    });
  }
  if(_ptMoreWired) return;
  _ptMoreWired=true;
  /* ---- THE WAY OUT OF FOCUS MODE, WIRED ONCE ON THE DOCUMENT ----
     DELEGATED, and armed inside the same once-only guard as the outside-press
     listener above, for the reason this page has already learned twice: this
     header is repainted by portalPaintAlerts and by every verb-slot refill, so
     a listener bound to the element stacks one per paint. Delegation also
     means the button works whichever render put it there.

     rlSetFocus(false) rather than a toggle: this button only ever means LEAVE.
     It cannot be pressed when focus is off, because it is not shown then, and
     a toggle here would turn focus back on if the class ever fell out of step
     with the button's visibility. */
  document.addEventListener('click',ev=>{
    const x=ev.target&&ev.target.closest&&ev.target.closest('[data-rl-focus-exit]');
    if(!x) return;
    if(window.rlSetFocus) rlSetFocus(false);
  });
  document.addEventListener('click',ev=>{
    const m=document.getElementById('pt-more-menu'), b=document.getElementById('pt-more');
    if(!m||!b||m.classList.contains('hidden')) return;
    if(ev.target&&ev.target.closest&&(ev.target.closest('#pt-more-menu')||ev.target.closest('#pt-more'))) return;
    m.classList.add('hidden'); b.setAttribute('aria-expanded','false');
  });
  document.addEventListener('keydown',ev=>{
    if(ev.key!=='Escape') return;
    const m=document.getElementById('pt-more-menu'), b=document.getElementById('pt-more');
    if(!m||m.classList.contains('hidden')) return;
    /* Escape closes the MENU first and does not fall through to focus mode's
       own Escape — one key, one effect per press, nearest layer wins. */
    ev.preventDefault();
    m.classList.add('hidden'); if(b) b.setAttribute('aria-expanded','false');
  });
}
/* ---- READY TO SIGN HAD A MIRROR HERE, AND DOES NOT NEED ONE ----
   From 12 Aug 2026 it was drawn twice: the live button in the strip under the
   header, and a copy beside Compare wording that forwarded its click to it. The
   copy held no opinion of its own on purpose — the readiness gate (negoAlignment)
   lives on the real button, and a second copy of that rule would have been free
   to disagree the day either was edited — so it rendered hidden and mirrored the
   real one's existence, disabled state, label and tooltip.

   The strip is gone (owner-asked, same day: nothing sits in a card across the
   page) and its verbs moved into the identity row wholesale, so there is ONE
   Ready to sign again, in the place the mirror used to stand, carrying its own
   gate. The mirror, its sync, its click forward and its CSS all went with the
   duplication that justified them.

   THE TRAP THIS RECORDS, because it nearly shipped: deleting the strip and
   keeping the mirror would have left NO button at all. The mirror renders
   hidden and un-hides only when it finds the real one — a deliberately safe
   default, and exactly the wrong survivor. Move the real button; delete the
   copy. */

/* ---- THE SAME HISTORY THE OWNER READS, ON THEIR SIDE OF THE GLASS ----
   openHistoryTimeline is the owner's screen and it is mounted here unchanged:
   one component, both chairs, exactly as the workbench itself already is. What
   makes that safe is not a filter added here — it is that this page's contract
   is rebuilt from the SHARE PAYLOAD, which already decided what may cross the
   table. Internal notes never travelled (buildSharePayload walls `note` to the
   counterparty's own), so nothing this screen draws from a note can leak: what
   is never sent needs no hiding.

   ONE THING IT DOES SHOW, and it is worth knowing rather than discovering: the
   AUTHOR string travels whole, and where a change was drafted with Copilot the
   tool can be named in that string. That has always been true of the change
   CARDS on this page; the history is simply another place it appears. Redacting
   it on the way out is not a free fix — the author is inside the change's
   fingerprint, so an edited name makes their copy unable to verify the chain
   and it reports the mismatch as tampering. If it is to be closed, it belongs
   at the point the name is composed, not here.

   The export rides along for the same reason as the timeline: it is a pure
   function of this same rebuilt contract, so it can carry nothing the page
   itself could not. */
function openPortalHistory(p){
  if(typeof window.openHistoryTimeline!=='function'){
    toast(i18t('po_history_unavailable2'),'err'); return;
  }
  /* Said out loud rather than left to PORTAL_MODE, which would also answer it:
     this is the counterparty's chair, so the Side filter reads Ours/Theirs from
     where THEY sit. */
  openHistoryTimeline(portalNegoContract(p), {}, { seat:'counterparty' });
}
/* THE WORDING THIS NEGOTIATION STARTED FROM. Round 1's baseline travels in the
   payload (buildSharePayload sends negotiation.baselineText), so "what has been
   done to this contract since the beginning" is answerable on their side even
   when only one version has ever been sent — which is every first round, and
   was exactly when Compare used to disappear. */
function portalOriginalText(){
  const sn=(PORTAL_OPTS.payload&&PORTAL_OPTS.payload.contract&&PORTAL_OPTS.payload.contract.negotiation)||{};
  const rounds=Array.isArray(sn.rounds)?sn.rounds:[];
  const first=rounds.length?rounds.slice().sort((a,b)=>(a.n||0)-(b.n||0))[0]:null;
  return String((first&&first.baselineText)||sn.baselineText||'').trim();
}
function openPortalVersionCompare(p){
  const vs=portalVersions().slice();
  const now=portalCurrentText();
  const items=[];
  const filed=(p&&p.contract&&p.contract.upload&&p.contract.upload.extractedText)||'';
  /* The original leads the list: it is the thing a reader most often wants to
     measure against, and on a first round it is the only other text there is. */
  const orig=portalOriginalText();
  if(orig && normText(orig)!==normText(now||'') && !vs.some(v=>normText(v.text)===normText(orig))
     && normText(orig)!==normText(filed||''))
    items.push({ get label(){ return i18t('po_original_before'); }, text:orig });
  // Same caption on both sides of the deal — "v2 · Edited by Young Mbagaya"
  // reads identically here and in HaTi, so a version can be named out loud.
  const cap=v=>{
    // "v2 · Edited by Young Mbagaya · Young Mbagaya" reads like a stutter, and
    // "· System" says nothing — only append an author the caption omits.
    const named=v.by && v.by!=='System' && !String(v.label||'').toLowerCase().includes(String(v.by).toLowerCase());
    return `v${v.n} · ${v.label}${named?` · ${v.by}`:''}`;
  };
  if(filed.trim() && !vs.some(v=>normText(v.text)===normText(filed)))
    items.push({ get label(){ return i18t('po_paper_as_arrived'); }, text:filed });
  items.push(...vs.map(v=>({ label:cap(v), text:v.text })));
  const last=vs[vs.length-1];
  if(now&&(!last||normText(last.text)!==normText(now))) items.push({ get label(){ return i18t('po_current_reading'); }, text:now });
  /* ---- WHAT THE DOCUMENT WOULD SAY IF EVERY LIVE ASK WERE ACCEPTED ----
     The owner has had this since js/versioning.js:496 and the counterparty had
     not, which is why Compare read as broken on their side exactly when it was
     most wanted: mid-round, two texts that are word-for-word identical because
     tracked changes have not moved the wording yet.

     Built by the product's own negoBuildBody over THIS page's rebuilt contract,
     so it is the same construction the owner sees rather than a second one that
     can disagree. Last in the list, which also makes it the default right-hand
     side — so opening Compare on a live round shows "where we started" against
     "what is being asked for" without touching a control. */
  try{
    if(window.negoBuildBody && window.richToText && window.negoChanges){
      const nc=portalNegoContract(p);
      const pend=negoChanges(nc).filter(x=>x&&x.status==='pending'&&!x.withdrawn).length;
      if(pend){
        const prop=richToText(negoBuildBody(nc,x=>x&&(x.status==='accepted'||(x.status==='pending'&&!x.withdrawn))));
        if(prop.trim() && normText(prop)!==normText(now||''))
          items.push({ label:`Proposed — with ${pend} pending redline${pend===1?'':'s'}`, text:prop });
      }
    }
  }catch(_){ /* one malformed change must not take Compare down */ }
  if(items.length<2) return;
  const opts=items.map((it,i)=>`<option value="${i}">${esc(it.label)}</option>`).join('');
  const SEL='font:inherit;font-size:var(--t-body);border:1px solid var(--color-divider);background:var(--color-surface);padding:7px 9px;border-radius:0;color:inherit;min-width:0;flex:1';
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-page);margin:0 0 10px">${i18t('po_compare_versions')}</h3>
          <div style="display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap">
            <select id="pv-a" style="${SEL}">${opts}</select>
            <span style="color:var(--color-neutral-500);flex:none">→</span>
            <select id="pv-b" style="${SEL}">${opts}</select>
            <button id="pv-go" class="ui-btn ui-btn-primary" style="flex:none">${i18t('po_compare')}</button>
          </div>
          <p id="pv-legend" style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:9px 0 0"></p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div id="pv-out" style="${COL};font-size:var(--t-body);color:var(--color-neutral-600)">${i18t('po_pick_two_press')} <b>${i18t('po_compare')}</b>.</div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px">
          <span style="font-size:var(--t-meta);color:var(--color-neutral-600);flex:1">${i18t('po_nothing_sends')}</span>
          <button id="pv-close" class="ui-btn">${i18t('act_close')}</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  const A=document.getElementById('pv-a'), B=document.getElementById('pv-b');
  A.value=String(Math.max(0,items.length-2)); B.value=String(items.length-1);
  const run=()=>{
    const a=items[Number(A.value)], b=items[Number(B.value)];
    if(!a||!b) return;
    if(a===b){ document.getElementById('pv-out').innerHTML=`<div style="font-size:var(--t-body);color:var(--color-neutral-600)">${i18t('po_same_version')}</div>`; return; }
    /* BOTH SIDES ARE READ IN ONE SHAPE FIRST (owner-reported 23 Aug 2026).
       The comparables on this list come from three different serialisers — the
       negotiation's baseline and the Proposed reading through richToText, a
       captured version through docPlainText, the filed paper straight out of
       the upload — and they do not agree about whether a blank line sits
       between blocks. The diff keeps whitespace runs as tokens, so a pair from
       two different writers reported every gap as a change while the counter
       above it, which ignores whitespace, said almost nothing had moved.
       diffCompareText is the shared reading; through window because it lives
       in another module, with the raw text as the fallback so a stage without
       versioning.js still compares rather than throwing. */
    const rd=window.diffCompareText||(x=>String(x==null?'':x));
    const aText=rd(a.text), bText=rd(b.text);
    const st=(window.diffStats?diffStats(aText,bText):{add:0,del:0});
    document.getElementById('pv-legend').innerHTML=`+${st.add} added · −${st.del} removed ·
      <span style="background:var(--st-green-bg);color:var(--st-green-fg);padding:0 var(--s-1);border-radius:0">added</span>
      <span style="background:var(--st-ruby-bg);color:var(--st-ruby-dot);text-decoration:line-through;padding:0 var(--s-1);border-radius:0">removed</span>`;
    document.getElementById('pv-out').innerHTML=`<div style="background:var(--color-doc-surface);box-shadow:var(--shadow-md);border-radius:0;padding:30px 36px;font-size:var(--t-card);line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(aText,bText)}</div>`;
  };
  document.getElementById('pv-go').addEventListener('click',run);
  document.getElementById('pv-close').addEventListener('click',closeModal);
  run();
}
/* Every control that submits something. Gathered in one place so a press can
   disable the lot: the buttons used to sit live and unchanged through the whole
   round trip, which reads as nothing having happened and invites a second and
   third press on a contract response. */
const PORTAL_ACTIONS=['pt-sign','pt-accept','pt-redline','pt-changes','pt-decline',
  'pt-redline-submit','pc-accept','pc-counter','pc-decline','pt-nego-send',
  /* The room's own controls. On a negotiation link the room IS the page, so a
     press that left THESE live while the request was in flight would look like
     nothing had happened — the exact invitation to press twice this list
     exists to remove. */
  'nego-cp-ready','nego-cp-decline','nego-send-decisions',
  /* The identity row's deal verbs. Ready to sign and Decline were reached
     through a mirror that carried this duty for them; the mirror is gone and
     the real buttons stand where it stood, so they take the duty directly. A
     door that still LOOKS live while the request is in flight is the second
     and third press this list exists to remove. */
  'pt-nego-ready','pt-nego-decline'];
function portalActionButtons(){
  return PORTAL_ACTIONS.map(id=>document.getElementById(id)).filter(Boolean);
}
function portalSetBusy(pressedId, label){
  for(const b of portalActionButtons()){
    if(!b.dataset.idle) b.dataset.idle=b.innerHTML;
    b.disabled=true; b.style.opacity='.5'; b.style.cursor='default';
    if(b.id===pressedId) b.innerHTML=esc(label||i18t('po_sending'));
  }
}
function portalSetIdle(){
  for(const b of portalActionButtons()){
    b.disabled=false; b.style.opacity=''; b.style.cursor='';
    if(b.dataset.idle){ b.innerHTML=b.dataset.idle; delete b.dataset.idle; }
  }
}
/* Answered. The controls stay visible so the page still reads as the thing they
   acted on, but they are spent and say so rather than looking ready to press. */
function portalSetDone(pressedId, label){
  for(const b of portalActionButtons()){
    b.disabled=true; b.style.cursor='default';
    if(b.id===pressedId){
      b.innerHTML=esc(label);
      b.style.opacity='1'; b.style.background='var(--color-neutral-100)';
      b.style.borderColor='var(--color-divider)'; b.style.color='var(--color-neutral-600)';
      b.style.boxShadow='none';
    } else { b.style.opacity='.4'; }
  }
  const rl=document.getElementById('pt-redline-text'); if(rl) rl.readOnly=true;
}
/* THE HEADLINE HAS TO AGREE WITH WHAT JUST HAPPENED.

   Signing left the green banner at the top of the page reading "Ready to sign —
   read the wording below, then sign or respond on the right", with the
   confirmation sitting in a box much further down beside the buttons. So the
   biggest thing on the screen went on instructing someone to do the thing they
   had just done. The buttons were correctly spent; the page still said
   otherwise, and on a page this long that is what a reader takes away. */
function portalMarkSigned(p, info){
  const band=document.getElementById('pt-agreed');
  if(!band) return;
  const who=esc((info&&info.name)||'You');
  /* ---- AND IT IS SPOKEN ---- (25 Aug 2026)
     This is the single most consequential moment on the counterparty's page —
     they have just executed a contract — and the whole confirmation was a
     BAND REPAINTED IN PLACE, which changes nothing a screen reader is told:
     the page it was reading still says "ready to sign". role="status" is what
     makes the swap an announcement. Set on the ELEMENT rather than in the
     markup, because the band draws in several states and only THIS one is an
     answer to a press. */
  band.setAttribute('role','status');
  band.setAttribute('aria-live','polite');
  band.setAttribute('aria-atomic','true');
  band.style.background='var(--st-green-bg)';
  band.style.borderLeftColor='var(--st-green-fg)';
  band.innerHTML=`
    <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-green-dot);color:#fff;font-size:var(--t-card);font-weight:var(--w-title)" aria-hidden="true">✓</span>
    <span style="flex:1;min-width:220px;line-height:1.5">
      <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;color:var(--st-green-fg)">${i18t('po_signed_this',{who})}</span>
      <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-700);margin-top:2px">${fmtDT(nowISO())} · sent to ${esc((p&&p.sharedBy)||'the sender')} at ${esc((p&&p.org)||'their organisation')}. There is nothing further for you to do here — keep this link to read the contract.</span>
    </span>`;
}
/* IS THE DEAL OVER? The one question this page could not ask.

   The server answers it live (`executed` on the share endpoint) because a
   signature that lands after the link was refreshed is exactly the case that
   matters. The payload answers it for a static-mode link, which has no server
   to ask and whose copy is all there is. Either way it is a fact about a deal
   this reader is a party to, and it is the fact that ends their round. */
function portalExecuted(){
  const srv=PORTAL_OPTS&&PORTAL_OPTS.executed;
  if(srv) return { at:(srv&&srv.at)||null };
  const pc=PORTAL_OPTS&&PORTAL_OPTS.payload&&PORTAL_OPTS.payload.contract;
  return (pc&&pc.executed) ? { at:pc.executed.at||null } : null;
}
/* Every reason this copy cannot be submitted, in one read. Three of them
   existed and were checked one at a time in five places; the fourth — the
   contract has been signed — was checked nowhere at all. */
const portalReadOnly = () => !!(PORTAL_OPTS.superseded||PORTAL_OPTS.responded||portalExecuted());
/* The deal is done, the link is answered, or the wording has moved on since it
   was sent. Any of the three means nothing on this page can be submitted, and
   the page should say so at the top rather than letting someone fill a form
   that will be refused. */
function portalClosedBanner(){
  /* Executed first. A signed contract that is ALSO an older copy is finished
     either way, and "a newer version was sent to you" would send the reader
     looking for a link that no longer has anything for them to do. */
  const done=portalExecuted();
  if(done) return `
    <div id="pt-executed" style="display:flex;align-items:flex-start;gap:var(--s-3);border:1px solid var(--st-green-line);background:var(--st-green-bg);border-left:4px solid var(--st-green-fg);border-radius:0;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--st-green-dot);color:#fff;font-size:var(--t-meta);font-weight:var(--w-title)" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:0;line-height:1.5">
        <span style="display:block;font-size:var(--t-card);font-weight:var(--w-strong);color:var(--st-green-fg)">${i18t('po_executed_sealed')}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--st-green-fg);margin-top:2px">The wording is final and read-only${done.at?` — signed ${fmtDT(done.at)}`:''}. You can still read this copy and keep this link. Nothing further can be proposed, decided or signed here; if something has to change, ask ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||'the sender')} to record an amendment.</span>
      </span>
    </div>`;
  const sup=PORTAL_OPTS.superseded;
  if(!sup) return '';
  return `
    <div id="pt-superseded" style="display:flex;align-items:flex-start;gap:var(--s-3);border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-left:4px solid var(--st-ruby-dot);border-radius:0;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;margin-top:1px;color:var(--st-ruby-fg);display:inline-flex">${icon('alert','w-4 h-4')}</span>
      <span style="flex:1;min-width:0;line-height:1.5">
        <span style="display:block;font-size:var(--t-card);font-weight:var(--w-strong);color:var(--st-ruby-fg)">${i18t('po_older_copy')}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--st-ruby-fg);margin-top:2px">A newer version of this contract was sent to you on ${fmtDT(sup.at)}. You can still read this copy and compare it, but signing or responding has to happen on the most recent link. If you cannot find it, ask ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||'the sender')} to send it again.</span>
      </span>
    </div>`;
}
function portalRoundBanner(c, p){
  const decided=(c.rounds||[]).filter(r=>r.resolution&&r.resolution.decision);
  if(!decided.length) return '';
  const latest=decided[decided.length-1];
  const accepted=decided.filter(r=>r.resolution.decision==='accepted').length;
  const org=esc((p&&p.org)||'The other side');
  const verb=latest.resolution.decision==='accepted'?'accepted your proposed changes':'reviewed your proposed changes';
  const tally=decided.length>1
    ? `${accepted} of your ${decided.length} rounds accepted`
    : (latest.resolution.decision==='accepted'?'Your edits were adopted':'Your edits were not adopted');
  return `
    <div id="pt-banner" style="display:flex;align-items:center;gap:var(--s-3);flex-wrap:wrap;border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-left:4px solid var(--st-amber-dot);border-radius:0;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span class="pt-pip" style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-amber-dot);color:#fff;font-size:var(--t-card);font-weight:var(--w-title)">!</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:var(--t-card);font-weight:var(--w-strong);color:var(--st-amber-fg)">${org} ${verb}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-600);font-family:var(--font-mono)">${i18t('po_round_tally',{n:latest.n,tally,when:fmtDT(latest.resolution.at||latest.at)})}</span>
      </span>
      ${latest.resolution.decision==='accepted'?`<span style="flex:none;font-size:var(--t-meta);color:var(--st-amber-fg)">${i18t('po_wording_reflects')}</span>`:''}
    </div>
    <style>
      @keyframes pt-pulse{0%,100%{box-shadow:0 0 0 0 rgba(184,134,43,.55)}50%{box-shadow:0 0 0 6px rgba(184,134,43,0)}}
      #pt-banner .pt-pip{animation:pt-pulse 1.9s ease-out infinite}
      @media (prefers-reduced-motion:reduce){ #pt-banner .pt-pip{animation:none} }
    </style>`;
}
/* ---- the conversation, beside the document ----
   The portal could tell a reader THAT their round was turned down and never
   why: the reasoning lived in a parallel email thread, which is exactly the
   fragmentation this product exists to end. Both halves of every round now
   travel in the share payload (buildSharePayload), and this renders them as
   what they are — a conversation about a document, next to the document.

   Everything here is counterparty-facing and every field is escaped: comments
   are typed by people on both sides, and this page has no login. */
function portalThreadHtml(c, p){
  const rounds=(c&&c.rounds)||[];
  const said=rounds.filter(r=>r.comment || (r.resolution&&r.resolution.comment));
  if(!said.length) return '';
  // raw here on purpose: bubble() escapes every field it is given, and escaping
  // twice would print "Mwangi &amp; Sons" at the counterparty
  const org=(p&&p.org)||'The other side';
  const bubble=(who,when,text,mine)=>`
    <div style="display:flex;flex-direction:column;gap:2px;align-items:${mine?'flex-end':'flex-start'}">
      <div style="font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${esc(who)}${when?` · ${fmtDT(when)}`:''}</div>
      <div style="max-width:92%;border:1px solid ${mine?'var(--color-divider)':'var(--color-accent-300)'};background:${mine?'var(--color-bg)':'var(--color-accent-100)'};border-radius:0;padding:var(--s-2) 11px;font-size:var(--t-meta);line-height:1.55;color:var(--color-neutral-800)">${esc(text)}</div>
    </div>`;
  /* What was said about individual clauses, under the round it belonged to.
     A reason attached to one change is more use than the same words in a lump
     at the top, and it is where the reader is already looking. */
  const clauseExchanges=(r,orgName)=>{
    const parts=(r.blockDecisions||[]).filter(b=>b.note||b.reply);
    if(!parts.length) return '';
    return `<div style="display:flex;flex-direction:column;gap:7px;margin-top:2px">${parts.map(b=>`
      <div style="border:1px solid var(--color-divider);border-radius:0;padding:7px 10px;background:var(--color-bg)">
        <div style="font-size:var(--t-meta);line-height:1.55;color:var(--color-neutral-800)">
          ${b.before?`<span style="text-decoration:line-through;color:var(--st-ruby-fg)">${esc(String(b.before).trim())}</span> `:''}
          ${b.after?`<span style="color:var(--st-green-fg)">${esc(String(b.after).trim())}</span>`:''}
          <span style="font-size:var(--t-label);font-weight:var(--w-title);margin-left:6px;color:${b.decision==='accept'?'var(--st-green-fg)':'var(--st-ruby-fg)'}">${b.decision==='accept'?'ADOPTED':'NOT ADOPTED'}</span>
        </div>
        ${b.note?`<div style="margin-top:var(--s-1);font-size:var(--t-label);color:var(--color-neutral-700)"><b>${i18t('po_you_said')}</b> ${esc(b.note)}</div>`:''}
        ${b.reply?`<div style="margin-top:3px;font-size:var(--t-label);color:var(--color-neutral-700)"><b>${esc(orgName)}:</b> ${esc(b.reply)}</div>`:''}
      </div>`).join('')}</div>`;
  };
  const verdict=r=>{
    if(!r.resolution||!r.resolution.decision) return '';
    const ok=r.resolution.decision==='accepted';
    return `<div style="font-size:var(--t-label);font-weight:var(--w-strong);color:${ok?'var(--st-green-fg)':'var(--st-ruby-fg)'};margin-left:2px">${ok?'Adopted':'Not adopted'}${r.resolution.at?` · ${fmtDT(r.resolution.at)}`:''}</div>`;
  };
  return `
    <div id="pt-thread" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:11px">
        <span style="flex:none;color:var(--color-accent);display:inline-flex">${icon('history','w-4 h-4')}</span>
        <span style="font-size:var(--t-body);font-weight:var(--w-strong)">${i18t('po_discussion_so_far')}</span>
        <span style="margin-left:auto;font-size:var(--t-label);color:var(--color-neutral-500);font-family:var(--font-mono)">${said.length} round${said.length===1?'':'s'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--s-3)">
        ${said.map(r=>`
          <div style="display:flex;flex-direction:column;gap:6px;border-left:2px solid var(--color-divider);padding-left:11px">
            <div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('po_round_n',{n:esc(String(r.n))})}</div>
            ${r.comment?bubble(r.by||'You', r.at, r.comment, true):''}
            ${r.resolution&&r.resolution.comment?bubble(org, r.resolution.at, r.resolution.comment, false):''}
            ${clauseExchanges(r, org)}
            ${verdict(r)}
          </div>`).join('')}
      </div>
    </div>`;
}
/* Points this reader raised that were NOT adopted, and are therefore still
   live between the parties. A rejected change that simply disappears reads as
   agreement; it is not. */
function portalOpenPointsHtml(c, p){
  const pts=(c&&c.openPoints)||[];
  if(!pts.length) return '';
  const org=esc((p&&p.org)||'The other side');
  /* A reply box on the point itself. This card carries the disagreement — it is
     where the reader meets "Net-30 stands, or a 2% price increase" — and until
     now the only thing it offered was an instruction to open a formal round.
     Answering a sentence with a sentence belongs here, not in a panel further
     down the page behind a dropdown of every clause in the contract. */
  /* NO REPLY BOX HERE ANY MORE. These boxes were wired by wirePortalDiscuss,
     which went with the discussion panel — leaving a Send button that did
     nothing, which is the exact fault this product has spent a session
     removing. The panel was deleted with no replacement, so the reply goes with
     it and the card is what it says it is: the points still open between the
     parties, for reading. Proposing wording is still the redline; answering a
     specific change is still its thread in the negotiation room. */
  const canReply=false;
  return `
    <div id="pt-openpoints" style="border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:0;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:var(--s-2);margin-bottom:9px">
        <span style="flex:none;color:var(--st-amber-dot);display:inline-flex">${icon('alert','w-4 h-4')}</span>
        <span style="font-size:var(--t-body);font-weight:var(--w-strong);color:var(--st-amber-fg)">${i18t('po_still_open_between')}</span>
        <span style="margin-left:auto;font-size:var(--t-label);color:var(--st-amber-fg);font-family:var(--font-mono)">${pts.length} point${pts.length===1?'':'s'}</span>
      </div>
      ${''/* NAME A CONTROL THAT IS ACTUALLY ON THIS SCREEN. This said "press
             Propose edits", which no button has been called since the respond
             panel was rewritten, and which does not exist at all on a link
             issued for signature — so the one card carrying the live
             disagreement pointed at nothing. */}
      <p style="margin:0 0 10px;font-size:var(--t-meta);line-height:1.55;color:var(--st-amber-fg)">${org} did not adopt ${pts.length===1?'this change':'these changes'}. The wording below is unchanged in the contract. ${
        portalIssuedForSigning(p)
          ? `This link was sent to you for signature, so the wording cannot be edited on it — press <b>${i18t('po_not_ready_sign')}</b> and tell ${org} what you want changed.`
          : `Press <b>${i18t('po_not_ready_sign')}</b> and then <b>Change the wording yourself</b> to come back on ${pts.length===1?'it':'them'}.`}</p>
      <div style="display:flex;flex-direction:column;gap:var(--s-2)">
        ${pts.map((pt,i)=>`
          <div style="border:1px solid var(--st-amber-line);background:var(--color-surface);border-radius:0;padding:9px var(--s-3);font-size:var(--t-meta);line-height:1.6">
            ${pt.before?`<div><span style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('po_contract_says')}</span>
              <div style="color:var(--color-neutral-800)">${esc(pt.before)}</div></div>`:''}
            ${pt.after?`<div style="margin-top:5px"><span style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('po_you_asked_for')}</span>
              <div style="color:var(--st-ruby-fg)">${esc(pt.after)}</div></div>`:''}
            ${pt.ask?`<div style="margin-top:5px;font-size:var(--t-meta);color:var(--color-neutral-700)"><b>${i18t('po_you_said')}</b> ${esc(pt.ask)}</div>`:''}
            ${pt.reason?`<div style="margin-top:var(--s-1);font-size:var(--t-meta);color:var(--color-neutral-700)"><b>${i18t('po_their_reply')}</b> ${esc(pt.reason)}</div>`:''}
            ${canReply?discussPointReplyHtml('point:'+pt.id, PORTAL_OPTS.messages||[], {
              idp:'pt-op-'+i, mine:'counterparty',
              label:'Still open — '+discussTrim(pt.after||pt.before,60),
              placeholder:'e.g. Would you take Net-45?' }):''}
          </div>`).join('')}
      </div>
    </div>`;
}

/* ---- talking about a point, without proposing wording ----
   The counterparty could say a great deal about this contract and only ever by
   redrafting it: every exchange had to wear the costume of a formal round. This
   is the light channel — a question, an answer, a "would you take Net-45?" —
   and it deliberately changes nothing about the document. */
function portalDiscussTopics(c){
  return window.discussTopics ? discussTopics(c, portalCurrentText() || docPlainText(c)) : [];
}
function portalDiscussHtml(c, p){
  if (!window.discussPanelHtml) return '';
  // static-mode shares have no server to carry a conversation; offering a box
  // that could not deliver would be worse than not offering one
  const live = !!PORTAL_OPTS.token;
  return discussPanelHtml({
    messages: PORTAL_OPTS.messages || [],
    topics: portalDiscussTopics(c),
    mine: 'counterparty',
    idp: 'pt-discuss',
    get title(){ return i18t('po_ask_or_reply'); },
    blurb: `Put a question to ${(p && p.org) || 'the sender'}, or answer one, without proposing new wording. Nothing here changes the contract; when you do want to change it, use Propose edits.`,
    disabled: !live,
    disabledNote: 'This copy was shared as a self-contained link, so there is no channel back for messages. Reply to the email you received.',
  });
}
function wirePortalDiscuss(c, p){
  if (!window.wireDiscussPanel || !PORTAL_OPTS.token) return;
  const topics = portalDiscussTopics(c);
  const post = async (topic, topicLabel, body) => {
    const author = fval('pt-name') || (PORTAL_OPTS.share && PORTAL_OPTS.share.recipientName) || '';
    if (!author) throw new Error('Enter your full name in the panel on the right first.');
    return api('shares/' + PORTAL_OPTS.token + '/messages', 'POST', { author, topic, topicLabel, body });
  };
  /* Both surfaces repaint together: a reply sent on an open point has to appear
     in the general thread too, or the two would tell different stories about
     the same conversation. */
  const repaint = res => {
    PORTAL_OPTS.messages = (res && res.messages) || PORTAL_OPTS.messages || [];
    const panel = document.getElementById('pt-discuss-panel');
    if (panel) panel.outerHTML = portalDiscussHtml(c, p);
    const points = document.getElementById('pt-openpoints');
    if (points) points.outerHTML = portalOpenPointsHtml(c, p);
      if (window.toast) toast(i18t('po_sent_unchanged'));
  };
  wireDiscussPanel({ idp: 'pt-discuss', topics, send: post, onSent: repaint });
  if (window.wireDiscussPoints) wireDiscussPoints({ send: post, onSent: repaint });
}

/* ---- editing a clause at a time (item 4, phase 1) ----
   The counterparty used to be handed the entire agreement as one stretch of
   plain text in a single box: scroll to find clause 4, edit it in place, and
   write one comment covering every unrelated change. It invited accidental
   deletions, and it was Erik's whole impression of the product while the
   owner's side had become clause-aware.

   The unit is the line, because the shared text is already one line per block —
   richToText emits it that way, so a heading, a paragraph and a numbered clause
   each arrive as exactly one line. Editing one line and rejoining is therefore
   EXACT: with nothing edited the reassembled text is the original, byte for
   byte, which is the property that makes this safe to do at all.

   Nothing about the wire format changes. The reassembled text goes down the
   same redline route as before, so the server, the owner's review screen and
   every existing test see precisely what they saw before. */
let PORTAL_CLAUSE_EDITS = {};
/* Phase 2: a reason per clause. One comment per round meant "we need changes to
   payment, delivery and liability" arriving as a single lump, leaving the other
   side to work out which sentence explained which edit. A reason belongs to the
   change it is about. */
let PORTAL_CLAUSE_NOTES = {};
function portalClauseUnits(text){
  return String(text==null?'':text).split('\n').map((line,i)=>({
    i, text:line, kind:(window.docLineKind?docLineKind(line):'text'),
    prefix:(window.docClausePrefix?docClausePrefix(line):'') }));
}
/* Rebuild the whole document from the units and whatever was changed. */
function portalClauseText(units, edits){
  const e=edits||{};
  return units.map(u=>Object.prototype.hasOwnProperty.call(e,u.i)?e[u.i]:u.text).join('\n');
}
function portalClauseEditorHtml(c){
  const units=portalClauseUnits(portalCurrentText()||docPlainText(c));
  const rows=units.filter(u=>u.text.trim()).map(u=>{
    const edited=Object.prototype.hasOwnProperty.call(PORTAL_CLAUSE_EDITS,u.i);
    const shown=edited?PORTAL_CLAUSE_EDITS[u.i]:u.text;
    const heading=u.kind==='heading';
    return `
      <div data-cl="${u.i}" style="border:1px solid ${edited?'var(--st-amber-dot)':'var(--color-divider)'};background:${edited?'var(--st-amber-bg)':'var(--color-surface)'};border-radius:0;padding:10px 13px">
        <div data-cl-view="${u.i}" style="display:flex;align-items:flex-start;gap:10px">
          <span style="flex:1;min-width:0;font-size:${heading?'13.5px':'13px'};line-height:1.7;${heading?'font-weight:var(--w-title);letter-spacing:.02em;':''}color:var(--color-doc-text);white-space:pre-wrap">${esc(shown)}</span>
          <button data-cl-edit="${u.i}" class="ui-btn" style="flex:none;font-size:var(--t-label);padding:var(--s-1) 10px">${edited?'Edit again':'Change'}</button>
        </div>
        ${edited?`<div style="margin-top:6px;font-size:var(--t-label);color:var(--st-amber-fg);display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span>${i18t('po_you_changed_this')}</span>
          ${PORTAL_CLAUSE_NOTES[u.i]?`<span style="color:var(--color-neutral-700);font-size:var(--t-label)">“${esc(PORTAL_CLAUSE_NOTES[u.i])}”</span>`:''}
          <button data-cl-undo="${u.i}" style="border:0;background:none;padding:0;font:inherit;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-amber-fg);cursor:pointer;text-decoration:underline">${i18t('po_undo')}</button></div>`:''}
      </div>`;
  }).join('');
  const n=Object.keys(PORTAL_CLAUSE_EDITS).length;
  return `
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:11px">
      <span style="font-size:var(--t-meta);color:var(--color-neutral-700)">${i18t('po_press')} <b>${i18t('po_change')}</b> ${i18t('po_on_any_clause')}</span>
      <span style="flex:1"></span>
      <span id="pt-cl-count" style="font-size:var(--t-meta);font-weight:var(--w-strong);color:${n?'var(--st-amber-fg)':'var(--color-neutral-500)'}">${n?`${n} change${n===1?'':'s'}`:'No changes yet'}</span>
    </div>
    <div id="pt-cl-list" style="display:flex;flex-direction:column;gap:7px">${rows}</div>`;
}
function wirePortalClauseEditor(c, p){
  const host=document.getElementById('pt-clause-editor'); if(!host) return;
  const units=portalClauseUnits(portalCurrentText()||docPlainText(c));
  const repaint=()=>{ host.innerHTML=portalClauseEditorHtml(c); wire(); };
  function wire(){
    host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>{
      const i=Number(b.getAttribute('data-cl-edit'));
      const row=host.querySelector(`[data-cl="${i}"]`); if(!row) return;
      const cur=Object.prototype.hasOwnProperty.call(PORTAL_CLAUSE_EDITS,i)?PORTAL_CLAUSE_EDITS[i]:units[i].text;
      row.innerHTML=`
        <textarea data-cl-input="${i}" spellcheck="false" style="width:100%;min-height:78px;border:1px solid var(--color-accent);border-radius:0;padding:9px 11px;font:inherit;font-size:var(--t-body);line-height:1.7;color:var(--color-doc-text);background:var(--color-surface);outline:none;resize:vertical">${esc(cur)}</textarea>
        <label style="display:block;margin-top:7px">
          <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600);margin-bottom:3px">${i18t('po_why_optional')}</span>
          <textarea data-cl-note="${i}" class="chat-field" rows="1" placeholder="e.g. Net-60 is our standard payment term." style="width:100%;border:1px solid var(--color-divider);border-radius:0;padding:7px 10px;font:inherit;font-size:var(--t-meta);background:var(--color-surface);outline:none">${esc(PORTAL_CLAUSE_NOTES[i]||'')}</textarea>
        </label>
        <div style="display:flex;gap:7px;justify-content:flex-end;margin-top:7px">
          <button data-cl-cancel="${i}" class="ui-btn" style="font-size:var(--t-label);padding:var(--s-1) 11px">${i18t('act_cancel')}</button>
          <button data-cl-save="${i}" class="ui-btn ui-btn-primary" style="font-size:var(--t-label);padding:var(--s-1) 11px">${i18t('po_keep_this_change')}</button>
        </div>`;
      const ta=row.querySelector(`[data-cl-input="${i}"]`); if(ta){ ta.focus(); }
      row.querySelector(`[data-cl-cancel="${i}"]`).addEventListener('click',repaint);
      row.querySelector(`[data-cl-save="${i}"]`).addEventListener('click',()=>{
        const v=ta?ta.value:'';
        if(window.chatFieldWire) chatFieldWire(row);
        const noteEl=row.querySelector(`[data-cl-note="${i}"]`);
        const note=noteEl?String(noteEl.value||'').trim():'';
        // a clause edited back to what it said is not a change, and carries no reason
        if(v===units[i].text){ delete PORTAL_CLAUSE_EDITS[i]; delete PORTAL_CLAUSE_NOTES[i]; }
        else { PORTAL_CLAUSE_EDITS[i]=v; if(note) PORTAL_CLAUSE_NOTES[i]=note; else delete PORTAL_CLAUSE_NOTES[i]; }
        repaint();
      });
    }));
    host.querySelectorAll('[data-cl-undo]').forEach(b=>b.addEventListener('click',()=>{
      const i=Number(b.getAttribute('data-cl-undo'));
      delete PORTAL_CLAUSE_EDITS[i]; delete PORTAL_CLAUSE_NOTES[i]; repaint();
    }));
  }
  repaint();          // render first, THEN attach — wire() alone had nothing to bind to
}
/* The per-clause reasons, in a shape the other side can match to what they see.
   The owner reviews DIFF FRAGMENTS ("thirty (30)" → "sixty (60)"), not line
   numbers, so a note keyed by line index would be meaningless there. Each note
   travels with the whole line before and after the change, which is enough for
   the review screen to line them up. */
function portalClauseNotes(c){
  const units=portalClauseUnits(portalCurrentText()||docPlainText(c));
  const out=[];
  for(const key of Object.keys(PORTAL_CLAUSE_EDITS)){
    const i=Number(key);
    const note=String(PORTAL_CLAUSE_NOTES[i]||'').trim();
    if(!note || !units[i]) continue;
    out.push({ before:units[i].text, after:PORTAL_CLAUSE_EDITS[i], note:note.slice(0,600) });
  }
  return out;
}
/* The text the counterparty is proposing, whichever surface they used. */
function portalProposedText(c){
  const ta=document.getElementById('pt-redline-text');
  if(ta && !document.getElementById('portal-plain')?.classList.contains('hidden')) return ta.value||'';
  const units=portalClauseUnits(portalCurrentText()||docPlainText(c));
  return portalClauseText(units, PORTAL_CLAUSE_EDITS);
}

/* ---- the negotiation, as the counterparty sees it --------------------------
   THE SAME COMPONENT the owner uses (js/views/negotiation.js), rendered with
   side:'counterparty'. Not a portal-shaped imitation of it — the same file, the
   same three panes, the same fingerprints, the same margin badges.

   Before this, the two sides read screens built from different code: the owner
   reviewed a redline in reviewProposedRound's modal while the counterparty was
   handed the document as clauses to retype. Both were reasonable screens and
   neither could be checked against the other, so "we are both looking at the
   same thing" was a claim rather than a property. Now it is a property, and
   f37 asserts it by diffing what the two sides render.

   Decisions taken here are held on this page until the reader sends them. There
   is no per-change write endpoint and inventing one would mean a public,
   no-login URL that mutates a contract on every click; the response route that
   already carries a redline carries the decisions too, as `negoDecisions`. */
let PORTAL_NEGO_DECISIONS = {};
/* Asks of THEIR OWN that the owner refused and they have chosen to withdraw.
   Held here for the same reason and sent on the same call: withdrawing is what
   clears the deadlock a single refusal creates, and a withdrawal that never
   left the browser is a deadlock the reader believes they have already
   cleared. */
let PORTAL_NEGO_WITHDRAWN = {};
/* Whether this reader has already signalled readiness on this page load. */
let PORTAL_READY_SENT = false;
/* DECISIONS ALREADY SENT, on this page load.

   The room repaints after a send, and it repaints from the SHARE PAYLOAD — a
   snapshot taken before the decisions existed. Clearing the held decisions
   without remembering them therefore put every card back to "pending" with
   Accept and Reject on it a moment after the reader had answered and sent it,
   which reads as the send having done nothing. The one impression this whole
   change exists to remove.

   So an answered-and-sent decision stays answered on their screen. It is not
   pretending: it is what they sent, and the next copy of the link carries it
   back from the owner's record as the real status. */
let PORTAL_NEGO_SENT = {};
let PORTAL_NEGO_WITHDRAWN_SENT = {};
/* WHAT THE RECORD ITSELF SAYS, as the link last served it.

   Held decisions are kept in the browser and the record is kept on the server,
   and the page has to be able to tell them apart — otherwise a decision that
   was sent, applied and came back on a refreshed payload is indistinguishable
   from one still sitting in this browser waiting to go. It was not
   distinguishable: reloading a link whose answers had been applied offered
   "Undo" on them, and one harmless click brought back "Send 1 decision" for an
   answer the owner was already holding.

   So the payload's own statuses are kept beside the held ones. A held decision
   that says what the record already says is not held — it is finished, and it
   is dropped. */
let PORTAL_NEGO_FILED = {};
/* CHANGES THIS READER HAS ASKED FOR, and the reason they need somewhere to go.

   The room gives the counterparty a Change button on every clause, and pressing
   it files a real fingerprinted change in their name. It then had NOWHERE TO
   GO. The postbox in the change index counted decisions only — answers to the
   owner's asks — so a counterparty who did the one thing the room exists for
   was left with a change index full of their own work, two buttons reading
   Decline and Ready to sign, and no send. Close the tab and it was gone. The
   owner's app never heard of it.

   Held here exactly as decisions are, and posted on the same response call as
   `negoProposed`. The owner's side re-files each one through negoFileChange, so
   the fingerprint and the chain are minted on the record copy rather than
   trusted from a public page. */
let PORTAL_NEGO_PROPOSED = {};
let PORTAL_NEGO_PROPOSED_SENT = {};
/* ---- THE READ-ONLY COPY THIS READER CAN HAND ON ----
   Their insurer, their counsel, their board wants to READ the deal. Until now
   the only thing they could hand over was this link — which carries the power
   to ANSWER, and answers made on it are made in their name. So the honest move
   was to forward nothing, and the dishonest one was easy.

   `POST shares/:token/derive-view` has minted a strictly weaker ticket since
   Stage 8 and nothing in any page ever called it: the route was proven by
   f123 and unreachable by a human. This is the door.

   NOTHING ABOUT IT IS HELD ON THIS PAGE ANY MORE (12 Aug 2026). A minted link
   used to be kept in a list and drawn under the verbs, so it could survive the
   repaint that answering a change causes. The panel was removed at the owner's
   ask, and the list went with it rather than lingering as state nothing reads
   and every save writes: the link is handed over once, in a dialog, at the
   moment it is minted — see openDerivedLinkDialog. The durable record of who
   holds what was never here anyway; it is the owner's own share panel, which
   lists every child link and can revoke any of them. */
/* Exactly the route's own conditions, read on this side so the button is
   absent rather than refused. A view link cannot delegate (privilege
   laundering) and a signing link's holder was asked to sign, not to
   distribute — both are 403s at the server, and a button that always fails is
   worse than no button. */
function portalCanDerive(){
  if (!PORTAL_OPTS.token || portalReadOnly()) return false;
  if (PORTAL_OPTS.viewOnly === true) return false;
  return (PORTAL_OPTS.purpose || 'negotiate') === 'negotiate';
}
/* WHO IS ANSWERING. Read from the room first, because the room is the page the
   counterparty was sent and the field is in it; then from the respond panel,
   which is where it lives on a signing link; then from the address the sender
   put on the share.

   Reading only `#pt-name` was the second of the three reasons their Send did
   nothing: that input sits on the page UNDERNEATH the full-window room, so once
   the room became the landing it was unreachable, and every send failed its own
   first line — "Enter your full name" — against a box nobody could see.

   A PERSON, never an organisation. The contract's `counterparty` is a company
   and is deliberately not in this chain: filing "Nordfrakt Logistik AB" as the
   name of whoever pressed the button would put a company where a signature
   needs a human. It is a display fallback only — see portalResponderLabel. */
function portalResponderName(){
  /* ---- THE HEADER'S NAME BOX IS GONE, AND THE CHAIN GREW A LINK ----
     #nego-cp-name stays first because the signing screen and the retired room
     still draw a box; the remembered name is what the workbench's box used to
     leave behind, and it is a PERSON, typed by them.

     share.recipientName is LAST rather than gone. It is whatever the sender
     typed into the recipient field, which on real links is regularly the
     counterparty COMPANY — and the box carried exactly that as its seed, so a
     reader who pressed Send without touching it filed the organisation anyway.
     Keeping it here therefore preserves today's behaviour rather than changing
     it; what is lost is the chance to correct it, and what replaces that is
     the remembered name above it, which the reader's own typing sets. */
  return fval('nego-cp-name') || fval('pt-name')
    || (window.negoRememberedName ? negoRememberedName() : '')
    || (PORTAL_OPTS.share&&PORTAL_OPTS.share.recipientName) || '';
}
/* ---- ASKED ONCE, WHEN IT MATTERS ----
   The box that used to stand in the header for the whole sitting collected one
   string: the person stamped on every change filed and every comment posted
   from this page. The owner asked for the box to go (12 Aug 2026); the fact it
   collected cannot go with it — portalRespond and portalNegoComment both refuse
   without it, and refusing while pointing at a box that no longer exists is the
   "a page whose Send could never succeed" fault this file already carries a
   scar from.

   So the chain above answers first — and on almost every link it does, because
   the sender addressed the link to somebody. The question is asked ONLY when
   every link in that chain is empty, which is the state that used to be a hard
   refusal pointing at a box: a dead end, and now a way forward. Remembered on
   the way through, so it is asked once per browser and not once per press.
   Returns '' when the reader cancels, and the caller refuses exactly as it did.

   NOT asked on the common path, deliberately. A modal between a reader and the
   Send they just pressed is a worse interruption than the box it replaces, and
   it would be asking a question the page can already answer. */
async function portalEnsureResponderName(){
  const have=portalResponderName();
  if(have) return have;
  if(!window.promptDialog) return '';
  const given=await promptDialog({
    title:i18t('po_who_are_you'),
    message:i18t('po_who_are_you_why'),
    label:i18t('ng_your_full_name'),
    value:'', placeholder:i18t('ng_your_full_name'),
    confirmLabel:i18t('act_save'),
  });
  const name=String(given==null?'':given).trim();
  if(!name) return '';
  if(window.negoRememberName) negoRememberName(name);
  return name;
}
/* The same name, for showing on the screen, where an organisation is a better
   answer than a blank. Never used to attribute a response. */
const portalResponderLabel = c =>
  portalResponderName() || (c&&c.counterparty) || 'The counterparty';
/* What changed, on the landing page.
   The sender approved this list on step 1 of Share and it travelled with the
   link — so someone opening the link a week later still sees what they were
   asked to look at, rather than an unexplained document. It is shown ABOVE the
   contract because "what am I being asked about" comes before "here is
   everything". Escaped and rendered as plain lines: it is text a person typed,
   and it is never markup. */
/* ---- RETIRED, 13 Aug 2026 — THE FOURTH DRAWING OF THE SENDER'S NOTE ----
   This panel was headed "What changed" and looked like a summary the product
   had produced. It was not: it was filled from `changeSummary`, which is the
   sender's own step-1 textarea in the share dialog — the same words the
   banner and the respond-panel box printed, wearing a third title. Leaving it
   would have meant the covering note was still on the counterparty's screen,
   which is the thing being removed.

   The function is kept as a stub rather than deleted so an older payload
   still carrying the field cannot start drawing it again through some other
   caller. Nothing calls it. It draws nothing. Flag any new call as stale.
   The MINT stops writing the field at all — see doSend in js/core.js. */
function portalChangeSummaryHtml(){ return ''; }

/* ---------- WORK IN PROGRESS SURVIVES A RELOAD ----------

   Everything this reader has done and not yet sent lives in three module
   variables, and a module variable is exactly as durable as the tab. So a
   counterparty who answered four changes, closed the laptop and came back had
   answered nothing: the page rebuilt from the share payload and every card was
   undecided again. Wording they had typed into a Change went the same way, and
   that is more work to lose than a click.

   It is now kept in their own browser, against the link it belongs to. Three
   properties matter and each is deliberate:

     · IT IS NOT A RECORD. Nothing here has been agreed with anybody. It is a
       draft of a reply, and it says so on every card until it is sent.
     · IT IS KEYED BY THE LINK. A different link is a different negotiation, and
       held answers must never follow a reader from one deal to another.
     · IT EXPIRES. A draft reply nobody sent three months ago is not something
       to resurrect on a link that has moved on several rounds since.

   Every read and write is wrapped: this page runs on a no-login origin where
   localStorage can throw outright, and a convenience that cannot remember must
   never be able to take the page down. */
const PORTAL_HELD_KEY = t => `hati.negoHeld.${t}`;
const PORTAL_HELD_TTL = 30*24*60*60*1000;        // a month, then it is stale news
function portalSaveHeld(){
  const t=PORTAL_OPTS&&PORTAL_OPTS.token; if(!t) return;
  try{
    const any=Object.keys(PORTAL_NEGO_DECISIONS).length
      || Object.keys(PORTAL_NEGO_WITHDRAWN).length
      || Object.keys(PORTAL_NEGO_PROPOSED).length;
    if(!any){ localStorage.removeItem(PORTAL_HELD_KEY(t)); return; }
    localStorage.setItem(PORTAL_HELD_KEY(t), JSON.stringify({ v:1, at:Date.now(),
      decisions:PORTAL_NEGO_DECISIONS, withdrawn:PORTAL_NEGO_WITHDRAWN,
      proposed:PORTAL_NEGO_PROPOSED }));
  }catch(e){ /* a browser that will not remember is not a reason to stop */ }
}
function portalLoadHeld(){
  PORTAL_NEGO_DECISIONS={}; PORTAL_NEGO_WITHDRAWN={}; PORTAL_NEGO_PROPOSED={};
  const t=PORTAL_OPTS&&PORTAL_OPTS.token; if(!t) return;
  try{
    const raw=localStorage.getItem(PORTAL_HELD_KEY(t)); if(!raw) return;
    const held=JSON.parse(raw);
    if(!held || held.v!==1) return;
    if(!held.at || (Date.now()-held.at)>PORTAL_HELD_TTL){ localStorage.removeItem(PORTAL_HELD_KEY(t)); return; }
    PORTAL_NEGO_DECISIONS=held.decisions&&typeof held.decisions==='object'?held.decisions:{};
    PORTAL_NEGO_WITHDRAWN=held.withdrawn&&typeof held.withdrawn==='object'?held.withdrawn:{};
    PORTAL_NEGO_PROPOSED=held.proposed&&typeof held.proposed==='object'?held.proposed:{};
    /* An older blob may still carry `derived` — ignored rather than migrated.
       Those links are live on the server and listed in the owner's panel; the
       copy this page kept was only ever for drawing a panel that is gone. */
  }catch(e){ PORTAL_NEGO_DECISIONS={}; PORTAL_NEGO_WITHDRAWN={}; PORTAL_NEGO_PROPOSED={}; }
}
/* Sent, or overtaken by the record — either way it is no longer a draft. */
function portalDropHeld(){
  const t=PORTAL_OPTS&&PORTAL_OPTS.token; if(!t) return;
  try{ localStorage.removeItem(PORTAL_HELD_KEY(t)); }catch(e){}
}

/* Is this answer already somewhere other than this browser? Either it has been
   sent from this page, or the record itself already carries it. Both mean the
   answer is not waiting on anybody, and re-registering it as held is what made
   a settled decision ask to be sent again. */
function portalDecisionSettled(ch){
  const sent=PORTAL_NEGO_SENT[ch.id];
  if(sent && sent.status===ch.status) return true;
  return PORTAL_NEGO_FILED[ch.id]===ch.status;
}
function portalNegoContract(p){
  /* A contract-shaped record for the component to read. The changes and the
     baseline come from the payload, so this page cannot show a fingerprint the
     owner's copy does not have. */
  const src = (p && p.contract) || {};
  const c = migrateContract({ ...src, status:'Under Review',
    folder: src.folder || (TEMPLATES[src.template]||{}).folder || 'corp' });
  c.changes = Array.isArray(src.changes) ? src.changes.map(x=>({ ...x, thread:(x.thread||[]).slice() })) : [];
  /* THE DISCUSSION CHANNEL, ON THE RECORD THE ROOM READS — and MERGED IN, not
     merely handed over.

     A reply on a fingerprint cannot be written to this page's copy of the
     contract: the copy is rebuilt from the share payload on every repaint, and
     the payload is a snapshot taken before the reply existed. So the reply is
     filed as a message under the change's own topic, and it has to be put back
     here on the way through — exactly as PORTAL_NEGO_PROPOSED is for wording
     they have asked for, and for exactly the same reason.

     Without this, a counterparty typed an answer, saw it appear, pressed Accept
     on the same change a moment later, and watched their own words vanish. The
     reply was never lost — it was on the server the whole time — but a page
     that shows you your comment and then takes it away has told you it was
     lost, which is the same thing to the person reading it. */
  const msgs = Array.isArray(PORTAL_OPTS.messages) ? PORTAL_OPTS.messages : [];
  c._messages = msgs;
  /* baselineBody carries the durable clause ids the changes are anchored on.
     Rebuilding it from the text projection instead would re-segment the
     document and mint FRESH ids on this page, and every fingerprint the owner
     filed would then name a clause that does not exist here. */
  const sn = src.negotiation || {};
  c.negotiation = { round:sn.round||1,
    turn:sn.turn||'owner', turnAt:sn.turnAt||null,
    baselineBody:sn.baselineBody||'',
    baselineText:sn.baselineText||portalCurrentText()||docPlainText(c)||'',
    chainHead:sn.chainHead||null, chainSeq:sn.chainSeq||0,
    hashV:sn.hashV||null,
    /* Who has signalled readiness, both sides. Without it their page cannot
       tell them where the deal stands — they would reopen the link after
       saying they were ready and find no trace of having said it. */
    ready:sn.ready||undefined,
    /* THE ROUNDS THAT ARE OVER, rebuilt from the payload — see buildSharePayload.
       The round carries the ids of the changes that belonged to it and the
       changes themselves arrive once, in the payload's change list, so this is
       where the two are put back together.

       AND IT TAKES THEM OUT OF THE LIVE LIST. That list is what the index draws
       as "on the table"; before this, every change ever decided was in it, so
       something settled two rounds ago sat among this round's open questions
       looking exactly as live as they did. */
    rounds:[],
    seq:sn.seq||c.changes.length };
  const archived = new Set();
  for (const r of (Array.isArray(sn.rounds) ? sn.rounds : [])){
    const ids = Array.isArray(r.changeIds) ? r.changeIds : [];
    for (const id of ids) archived.add(id);
    c.negotiation.rounds.push({ n:r.n, at:r.at||null,
      baselineBody:r.baselineBody||'', baselineText:r.baselineText||'',
      changes:c.changes.filter(x=>x&&ids.includes(x.id)).map(x=>({ ...x })) });
  }
  if(archived.size) c.changes = c.changes.filter(x=>x&&!archived.has(x.id));
  /* Changes THIS reader asked for, put back. The payload is a snapshot taken
     before they existed, so rebuilding from it alone would make a change they
     filed a moment ago vanish on the room's next repaint. Sent ones stay too:
     they are answered from the owner's record on the next copy of the link. */
  for(const [id,src] of [...Object.entries(PORTAL_NEGO_PROPOSED_SENT).map(x=>[x[0],{...x[1],sentByMe:true}]),
                         ...Object.entries(PORTAL_NEGO_PROPOSED)])
    if(!c.changes.some(x=>x.id===id)) c.changes.push({ ...src, id });
  /* THE COUNTER HAS TO CLEAR WHAT IS ALREADY HELD, or the second ask collides
     with the first. negoNextId mints from negotiation.seq, and seq is rebuilt
     from the payload on every repaint — so a reader who asked for two changes
     got CHG-001 twice, the re-injection above saw the id already present, and
     their second ask silently replaced their first. */
  /* EVERY id this negotiation has ever used, not just the ones still on the
     table. Taking the closed rounds out of the live list above must not take
     their ids out of the counter — CHG-001 to CHG-005 archived and nothing live
     would restart the count at CHG-001, and a reader's next ask would arrive
     wearing a fingerprint that already belongs to something else. */
  const everyChange=c.changes.concat(
    ...(c.negotiation.rounds||[]).map(r=>r.changes||[]));
  const held=everyChange.map(x=>/^CHG-(\d+)$/.exec(String(x.id||'')))
    .filter(Boolean).map(m=>Number(m[1]));
  c.negotiation.seq=Math.max(c.negotiation.seq||0, everyChange.length, ...(held.length?held:[0]));
  /* AND SO DOES THE HASH CHAIN. negoIssue links each new change onto
     `chainHead` and stamps it with `++chainSeq`, both of which the payload
     answers for — as it stood before any of these existed. Rebuilding from the
     payload alone therefore gave a reader's second ask the same seq as their
     first and a prevChangeHash pointing past it, and the room told them, in
     red, that their own chain was broken. Wind both forward to the last record
     actually on this page. */
  const chain=everyChange.filter(x=>x&&x.hash&&(x.seq||0)>(c.negotiation.chainSeq||0));
  if(chain.length){
    const last=chain.reduce((a,b)=>((b.seq||0)>=(a.seq||0)?b:a));
    c.negotiation.chainHead=last.hash;
    c.negotiation.chainSeq=last.seq||c.negotiation.chainSeq;
  }
  /* Every thread, whole, on every change — including the ones this reader filed
     themselves a moment ago, which is why it runs after they have been put
     back. */
  if(window.negoMergedThread)
    for(const ch of c.changes) ch.thread = negoMergedThread(c, ch, msgs);
  /* What the record says about each change, before this page's own held
     answers are laid over it. Read from the payload, which IS the record as of
     the last time the link was caught up. */
  PORTAL_NEGO_FILED={};
  for(const x of (Array.isArray(src.changes)?src.changes:[]))
    if(x&&x.id) PORTAL_NEGO_FILED[x.id]=x.status||'pending';
  // a decision taken on this page but not yet sent is shown as taken
  for(const ch of c.changes){
    // sent first, then held — a decision taken again after sending wins
    const s=PORTAL_NEGO_SENT[ch.id];
    if(s) ch.status=s.status, ch.reply=s.reply||ch.reply||null, ch.sentByMe=true;
    let d=PORTAL_NEGO_DECISIONS[ch.id];
    /* The record has caught up with this answer, so it is not waiting on
       anything any more. Kept as a held decision it would go on offering Undo
       and asking to be sent a second time. */
    if(d && PORTAL_NEGO_FILED[ch.id]===d.status){ delete PORTAL_NEGO_DECISIONS[ch.id]; d=null; portalSaveHeld(); }
    if(d){ ch.status=d.status; ch.reply=d.reply||ch.reply||null; ch.sentByMe=false;
      /* ANSWERED HERE, NOT YET ANYWHERE ELSE. The one state on this page that
         looks finished and is not: the card says "accepted" and the other side
         has heard nothing. The component draws it; the page is the only thing
         that knows it. */
      ch.heldByMe=true; }
    // and so is an ask of their own they have taken off the table
    if(PORTAL_NEGO_WITHDRAWN[ch.id]||PORTAL_NEGO_WITHDRAWN_SENT[ch.id])
      ch.withdrawn={ by:portalResponderLabel(c), side:'counterparty', at:nowISO() };
  }
  return c;
}
/* WHICH SCREEN IS THIS LINK?

   Two, and the contract decides — not a button.

     NEGOTIATING — changes are on the table and undecided. The link IS the
     negotiation room: the same three panes, spacing and navigation the owner
     is looking at, opened as the page rather than hidden behind "Open the
     negotiation room". A counterparty who has to find a button to reach the
     thing they were sent has been sent a lobby, not a document.

     SIGNING — every change is resolved, or none was ever proposed. Then the
     room is the wrong screen: there is nothing left to redline, and what they
     need is the clean document and the signing panel. Showing three panes of
     an empty change index at that point is asking someone to read a diff of
     nothing.

   Read from the record, so it cannot claim a state the changes do not support.
   `superseded` and `responded` copies stay on the reading view either way —
   they are history, and history is not signable. */
/* Did the SENDER issue this link for signature, as against did this page work
   out that a signing screen is the sensible one to show?

   portalNegoPhase answers the second question and is right to infer — a link
   created before purposes existed still has to open on something. This answers
   the first, and never infers: purposeChosen is set only where somebody picked
   'Sign' in the share dialog. Everything else — a legacy link, a link on a
   contract with nothing proposed yet — is not a signing link and keeps every
   verb it has always had. */
function portalIssuedForSigning(p){
  return !!(p && (p.purposeChosen==='sign'
    || (PORTAL_OPTS && PORTAL_OPTS.purpose==='sign')));
}
function portalNegoPhase(p){
  const src=(p&&p.contract)||{};
  const changes=(Array.isArray(src.changes)?src.changes:[]).filter(x=>x&&x.status!=='superseded');
  const pending=changes.filter(x=>x.status==='pending').length;
  /* An executed contract joins them. It is the strongest form of the same
     fact: this copy is history, and history is not signable. */
  if(portalReadOnly()) return { phase:'read', changes:changes.length, pending };
  /* THE LINK SAYS WHAT IT IS. It used to be worked out from the change set,
     and the arithmetic made a decision that is not arithmetic's to make:
     resolve the last change — even by refusing it — and the room the
     counterparty had been negotiating in became a request for their signature,
     with nobody having said the deal was done.

     A negotiation link is the room, resolved or not, until a signing link
     supersedes it. A signing link is the document and the respond panel. Both
     are stated by the sender when the link is made.

     Where no purpose was stated — a link created before purposes existed — the
     old reading still applies, so an existing link opens on exactly the screen
     it opened on yesterday. */
  const purpose=p&&p.purpose;
  /* THE THIRD PURPOSE, and the only one that is not a seat at the table. A
     view link goes to somebody outside the deal, so it is checked before the
     other two and before any inference: a reader who may do nothing must never
     reach a screen assembled for a reader who may do something. The server
     already refuses their requests (refuseIfViewOnly); this is what stops the
     page offering them in the first place. */
  if(purpose==='view'||(p&&p.viewOnly)) return { phase:'view', changes:changes.length, pending, reason:'link-is-view-only' };
  if(purpose==='negotiate') return { phase:'negotiate', changes:changes.length, pending, reason:'link-is-a-negotiation' };
  if(purpose==='sign') return { phase:'sign', changes:changes.length, pending, reason:'link-is-for-signature' };
  if(!changes.length) return { phase:'sign', changes:0, pending:0, reason:'nothing-proposed' };
  if(!pending) return { phase:'sign', changes:changes.length, pending:0, reason:'all-resolved' };
  return { phase:'negotiate', changes:changes.length, pending };
}

function portalNegoHtml(p){
  const src=(p&&p.contract)||{};
  /* The sign branch comes FIRST, before the no-changes early return — a
     contract nobody proposed anything on is the commonest signing link there
     is, and returning '' for it would leave the reader with a document and no
     word about why they were sent it. */
  const phase=portalNegoPhase(p).phase;
  if(phase==='sign') return portalAgreedHtml(p);
  /* ON A NEGOTIATION LINK THE CARD IS NOTHING BUT A DUPLICATE.

     This used to render the whole negotiation into a card in the page column —
     a summary, a preview pane, a button marked "Open the negotiation room" and
     a second send — and then the room opened over the top of it. Everything in
     the card was unreachable behind a fixed full-window overlay, but it was
     still IN the page: a second "open the room" button and a second send that a
     keyboard could tab to, and a second element for every id the room uses,
     which is what silently rewired half the room's controls to a copy nobody
     could see.

     What survives is the pair of empty hosts. The component still mounts into
     #pt-nego — hidden — because that mount is what the parity test diffs the
     two sides against, and losing it would lose the proof that neither side is
     looking at a lesser screen.

     A negotiation link with nothing on the table is still a negotiation link,
     and still gets the room: this used to return '' for that case, so a
     counterparty invited to negotiate a clean draft landed on a signing panel
     with nowhere to propose anything. */
  if(phase==='negotiate')
    return `
    <div id="pt-nego-wrap" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;
      box-shadow:var(--shadow-sm);overflow:hidden;margin:0 0 18px">
      <div style="padding:14px 18px;border-bottom:1px solid var(--color-divider);background:var(--color-bg)">
        <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px">${i18t('po_the_negotiation')}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55;margin-top:3px">The same workbench ${esc((p&&p.org)||'the sender')} works on — the contract with every change marked, the tracked changes beside it, and the discussion beside those. Accept or reject what they have proposed, press <b>${i18t('po_direct_edit')}</b> ${i18t('po_under_clause_counter')}</span>
      </div>
      <div id="pt-nego" style="padding:var(--s-3)"></div>
      <div id="pt-nego-foot" style="padding:var(--s-3) 18px;border-top:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:center;gap:10px;flex-wrap:wrap"></div>
    </div>`;
  if(!Array.isArray(src.changes) || !src.changes.length) return '';
  return `
    <div id="pt-nego-wrap" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;
      box-shadow:var(--shadow-sm);overflow:hidden;margin:0 0 18px">
      <div style="padding:14px 18px;border-bottom:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:flex-start;gap:11px;flex-wrap:wrap">
        <span style="flex:1;min-width:200px">
          <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px">${i18t('po_the_negotiation')}</span>
          <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55;margin-top:3px">Every change on this contract, with its own fingerprint. This is the same screen ${esc((p&&p.org)||'the sender')} is looking at — same clauses, same changes, same statuses. Accept or reject the ones they have proposed, or discuss any of them without changing the contract.</span>
        </span>
        ${''/* the workbench mounts below, already visible — there is no room and no door */}
      </div>
      <div id="pt-nego" style="height:min(78vh,860px);padding:var(--s-3)"></div>
      <div id="pt-nego-foot" style="padding:var(--s-3) 18px;border-top:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:center;gap:10px;flex-wrap:wrap"></div>
    </div>`;
}
/* The banner that replaces the negotiation once there is nothing to negotiate.

   It says what was settled and how, because "ready to sign" with no account of
   what happened is a request to sign on trust. Everything it states is counted
   from the change records the link was sent with. */
function portalAgreedHtml(p){
  const src=(p&&p.contract)||{};
  const ph=portalNegoPhase(p);
  const changes=(Array.isArray(src.changes)?src.changes:[]).filter(x=>x&&x.status!=='superseded');
  const acc=changes.filter(x=>x.status==='accepted').length;
  const rej=changes.filter(x=>x.status==='rejected').length;
  const org=esc((p&&p.org)||'the sender');
  /* Read from the CHANGE SET, not from the phase's reason. The phase now
     answers "what is this link for", which a link created for signature
     answers the same way whether anything was ever proposed on it or not. What
     was actually negotiated is a different question, and this is it. */
  const line=!changes.length
    ? `No changes were proposed on this contract — ${org} has sent it to you as it stands.`
    : `All ${changes.length} change${changes.length===1?'':'s'} on this contract ${changes.length===1?'has':'have'} been resolved`
      + `${acc?` — ${acc} adopted into the wording`:''}${rej?`, ${rej} not taken`:''}. Nothing is outstanding between you.`;
  return `
    <div id="pt-agreed" style="border:1px solid var(--st-green-line);background:var(--st-green-bg);border-left:4px solid var(--st-green-fg);border-radius:0;
      padding:14px 18px;margin:0 0 18px;display:flex;align-items:flex-start;gap:var(--s-3);flex-wrap:wrap">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--st-green-dot);color:#fff;font-size:var(--t-card);font-weight:var(--w-title)" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:220px;line-height:1.5">
        ${''/* ---- IT DOES NOT SAY "READY TO SIGN" WHERE NOTHING CAN BE ----
               Where nobody has been named to sign, the amber notice beside the
               Sign button says so — and a green heading at the top of the same
               page promising the opposite is the contradiction a reader
               resolves by deciding the product is broken. The FACT this banner
               carries is still true and still worth saying: there is nothing
               outstanding between the two sides. Only the heading moves, and
               only on the state where it would be a lie. */}
        <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;color:var(--st-green-fg)">${
          (p&&p.signingOpen===false)?i18t('po_nothing_outstanding'):i18t('po_ready_to_sign')}</span>
        <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-700);margin-top:2px">${line} ${
          (p&&p.signingOpen===false)?i18t('po_read_then_respond'):i18t('po_read_then_act')}</span>
      </span>
      ${''/* ---- IT OPENS THE RECORD, NOT A SECOND WORKBENCH ----
             (owner-asked, 12 Aug 2026.) This used to unhide a read-only copy of
             the negotiation workbench in the page: the round queue, the document
             with its marks and the whole Tracked Changes column, mounted under
             the wording somebody was about to sign. What a reader wants at that
             moment is the ACCOUNT of what happened, which is the history the
             owner reads and which this page has always been able to open — so
             the door leads there instead, through openPortalHistory, the same
             one function "Negotiation history" above it calls. The space goes
             back to the wording.

             THE BUTTON IS DRAWN ONLY WHERE THERE IS SOMETHING TO SHOW, which is
             the same question portalHasHistory asks of the same records, so the
             door can never open onto an empty dialog. Wired in the signing
             screen's own wiring rather than in wirePortalNego — that function
             returns early when #pt-nego is absent, and #pt-nego is exactly what
             this branch no longer draws. */}
      ${changes.length?`<button id="pt-nego-open" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:7px 14px"
        title="${i18t('po_every_change_oldest')}">${i18t('po_review_what_changed')}</button>`:''}
    </div>`;
}

/* ---- WHERE THE DEAL VERBS ARE STANDING ----
   Two pages draw #pt-nego-foot from this one builder. On the SIGNING screen it
   is the foot of the negotiation card, with room for a sentence beside the
   buttons. On the negotiation workbench it is a group inside the identity row
   (owner-asked, 12 Aug 2026) — a header has room for verbs and none for
   paragraphs, so the words stand down there and are said where they are
   already said. Set by whichever renderer built the slot; read by the builder.
   A flag rather than a DOM probe: the builder must give the same answer
   whether or not the slot happens to be mounted when it runs. */
let PORTAL_FOOT_COMPACT=false;
/* ---- DID OUR ROUND REACH THEM? (owner-reported 23 Aug 2026, MK-349) ----
   This page has always stamped a change "Sent" off its own memory of pressing
   the button, and had no way to learn what happened next — so it went on
   saying "Sent" whether the owner had collected the round or not, and a reader
   whose acceptance was sitting uncollected could not tell.

   THREE READINGS, AND THE THIRD IS SILENCE. 'received' and 'waiting' are facts
   the server reports off the answer's own row; null is an older link whose row
   records nothing, and an unknown must not be printed as a "no" — the same
   rule negoTheirCopy states for the mirror of this question on the owner's
   side. Silence changes nothing and claims nothing.

   IT COMES BACK LIVE. The page re-fetches the share while it is open, so this
   turns over from "waiting" to "received" under the reader without a reload —
   which is the whole point: the moment their round lands is the moment they
   want to stop wondering. */
/* ---- HAVE THEY ALREADY SAID THEY ARE READY? (owner-reported 23 Aug 2026:
   "when i click ready to sign button it greys out correctly but when I refresh
   the page, the ready to sign is back to normal") ----
   The spent state was PORTAL_READY_SENT alone — a flag in THIS SITTING's
   memory, which a reload wipes. So the button came back live over a readiness
   that had already gone, and the obvious thing to do with a live button is
   press it again.

   THE RECORD IS THE DURABLE HALF, and it already travels: buildSharePayload
   carries `negotiation.ready` for BOTH sides, so their own signal comes back
   with the next copy of the link and survives any reload. The sitting's flag
   stays in front of it because the record lags — it is written when the owner
   collects the round, and between the press and that moment only this page
   knows.

   A REFUSED READINESS CORRECTLY LEAVES THE BUTTON LIVE, and that is the reason
   this reads the record rather than "did I send one": a claim that went stale
   between the press and the collection is not recorded, and the reader must be
   able to say it again once whatever was outstanding is settled. */
function portalReadySpent(){
  if(PORTAL_READY_SENT) return true;                       // this sitting, ahead of everything
  const n=(PORTAL_OPTS.payload&&PORTAL_OPTS.payload.contract&&PORTAL_OPTS.payload.contract.negotiation)||null;
  if(n && n.ready && n.ready.counterparty) return true;    // the RECORD has it — definitive
  /* IN FLIGHT. The record lags: it is written when the owner's browser collects
     the round, which on the live beat is up to forty-five seconds after the
     press. Between those two moments the server is the only thing that knows,
     and it says so on lastResponse — so a reload in that window still finds the
     button spent instead of offering the same claim a second time.

     AND `applied` IS WHAT TELLS A REFUSAL FROM A DELIVERY. Marked applied while
     the record still shows no readiness means it was read, judged and REFUSED
     (it went stale between the press and the collection). That claim was never
     recorded, so the button must come back — the reader has to be able to say
     it again once whatever was outstanding is settled. Anything else strands
     them behind a spent button over a signal nobody holds. */
  const lr=PORTAL_OPTS.lastResponse;
  return !!(lr && lr.action==='ready' && lr.applied!==true);
}
function portalDeliveryState(){
  const lr=PORTAL_OPTS && PORTAL_OPTS.lastResponse;
  if(!lr || !lr.at) return null;              // nothing sent from here yet
  if(lr.applied===true) return 'received';
  if(lr.applied===false) return 'waiting';
  return null;                                 // an older link: unknown, so nothing is said
}
function portalNegoFootHtml(p){
  const n=Object.keys(PORTAL_NEGO_DECISIONS).length;
  /* The token is NOT part of this. See renderShareWorkbench: a copy with no way
     back can still be answered — the answer leaves as a code instead of a
     request — so the verbs stay and only their destination changes. Without
     this the column offered Accept and Reject and the foot offered no Send. */
  const live=!portalReadOnly();
  /* WHY THERE ARE NO VERBS, on the page that has room to say it. In the header
     the same sentence travels to the workbench as readonlyWhy and is said
     once, where the verbs would have been — see renderShareWorkbench. */
  if(!live && PORTAL_FOOT_COMPACT) return '';
  if(!live) return `<span id="nego-readonly-why" style="font-size:var(--t-meta);color:var(--color-neutral-600)">${esc(
    portalExecuted() ? 'This contract has been executed and sealed — the wording is final.'
    : PORTAL_OPTS.superseded ? 'This copy has been superseded — a newer link was sent to you. Open that one to answer.'
    : PORTAL_OPTS.responded ? 'This link has already been answered. Ask the sender for a fresh one if you need to reply again.'
    : 'This copy has no channel back — reply to the email you received, or ask the sender for a live link.')}</span>`;
  /* ---- THE DEAL-LEVEL VERBS LIVE HERE NOW ----
     The retired room carried Ready to sign and Decline on its own bar. They
     are acts about the WHOLE deal, not about one change, so they belong to
     the page rather than to a card — and the readiness gate is the engine's
     own reading (negoReadyToSign), never inferred from an empty column:
     resolving the last change does not make anybody ready, saying so does. */
  /* The gate is ALIGNMENT, not merely every-change-answered: a refused ask
     that nobody has withdrawn is answered and still contested, and telling
     the other side you are ready over a contested point is the untruth the
     room's gate existed to prevent. Same engine reads, same answer. */
  const c=portalNegoContract(PORTAL_OPTS.payload||p);
  const held=Object.keys(PORTAL_NEGO_DECISIONS).length;
  const al=(window.negoAlignment&&c)?negoAlignment(c):{ aligned:false };
  const readyOk=!!(al&&al.aligned);
  const whyNot=(window.negoAlignmentWhy&&c)?(negoAlignmentWhy(c,'counterparty')||'Changes are still waiting on a decision.')
    :'Changes are still waiting on a decision.';
  const spent=portalReadySpent();
  /* ONE CELL FOR THE WORDS, the verbs beside it. The two sentences used to be
     siblings of the buttons with the second forced onto its own line
     (flex-basis:100%), which was three stacked rows before a reader had
     decided anything — affordable at the foot of the page, not at the top of
     it now the strip sits under the header. Stacked here instead, so the
     strip is one row of verbs with its explanation to the left. */
  /* THE TWO SENTENCES STAND DOWN IN THE HEADER, and neither is lost.
     "Your decisions are held here until you send them" is the wall line's own
     sentence, printed a second time twelve pixels above it — the workbench
     draws that wall for exactly this reader and it is the one band this page
     keeps. The count it carries when decisions are held rides on the Send
     button's own label ("Send 2 decisions"). And "1 change still waiting on a
     decision" is on the Ready button's tooltip and, larger, in the round queue
     down the left, which names the outstanding clause rather than counting it. */
  const words=PORTAL_FOOT_COMPACT?'':`
    <span style="flex:1;min-width:150px;display:grid;gap:2px">
      <span style="font-size:var(--t-meta);color:${n?'var(--st-amber-fg)':'var(--color-neutral-600)'}">
        ${n?`<b>${n} decision${n===1?'':'s'} ready to send.</b> Nothing has reached ${esc((p&&p.org)||'the sender')} yet.`
          :'Your decisions are held here until you send them. Comments send immediately and change nothing.'}
      </span>
      ${readyOk||spent?'':`<span id="pt-ready-why" style="font-size:var(--t-label);line-height:1.5;color:var(--color-neutral-600)">${esc(whyNot)}</span>`}
    </span>`;
  return `${words}
    ${''/* ---- THE BATCH SEND IS THE BAND, NOT THIS (15 Aug 2026, owner-reported) ----
           Reported as "you sometimes have multiple send alerts": with anything
           held, this header carried "Send 1 decision" while the band at the top
           of the change column carried "Send all 6" — two batch sends on one
           screen, DISAGREEING, because this one counts decisions only and the
           band counts everything that has not left the page. The band's number
           is the honest one: the postbox both of them press sends the
           counter-proposals too.
           So on the WORKBENCH this stands down and the band is the one send.
           PORTAL_FOOT_COMPACT is exactly the right discriminator — it is set by
           renderShareWorkbench and reset by renderSharePortal — because the
           SIGNING screen has no change column and therefore no band, and a
           reader holding decisions there would otherwise have no batch send at
           all. Same reasoning as the sentences this flag already stands down.
           The per-card Send is untouched on both. */}
    ${n && !PORTAL_FOOT_COMPACT?`<button id="pt-nego-send" class="ui-btn ui-btn-primary nego-pulse" style="flex:none;font-size:var(--t-body);padding:var(--s-2) 15px">${i18tn('po_send_n_decisions',n,{n})}</button>`:''}
    <button id="pt-nego-ready" class="ui-btn" ${readyOk&&!spent?'':'disabled'}
      title="${esc(spent?i18t('po_ready_spent_title'):readyOk?i18t('po_ready_tell_title'):whyNot)}"
      style="flex:none;font-size:var(--t-meta);padding:var(--s-2) 14px">${spent?i18t('po_readiness_sent'):i18t('po_ready_to_sign')}</button>
    <button id="pt-nego-decline" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:var(--s-2) 14px;color:var(--st-ruby-dot);border-color:color-mix(in srgb,var(--st-ruby-dot) 40%,transparent)">${i18t('po_decline')}</button>
    ${portalCanDerive()?`<button id="pt-derive" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:var(--s-2) 14px"
      title="${i18t('po_mint_readonly')}">${i18t('po_share_readonly')}</button>`:''}`;
}
/* ---- THE LINK IS HANDED OVER ONCE, AND THE PANEL IS GONE ----
   (owner-asked, 12 Aug 2026: remove the box at the foot of the strip entirely.)

   It used to be a standing list under the verbs — every copy this reader had
   minted, each with its own Copy button — rebuilt on every repaint so that
   answering a change could not make a link vanish before it was copied.

   REMOVING THE LIST WITHOUT REPLACING IT WOULD HAVE BROKEN THE FEATURE, not
   trimmed it: that panel was the ONLY place a minted link was ever displayed.
   The route returns it, the list drew it, and the toast said "copy it below".
   Delete the list alone and "Share a read-only copy" becomes a button that
   creates real, live, owner-revocable access to the contract and shows the
   person who pressed it nothing at all — silent access grants, which is worse
   than the button not existing.

   So the hand-over moved to the moment of minting: one dialog, the link
   selected and ready to copy, and the same sentence the panel carried about
   what the ticket IS. Once it is closed the link is not recoverable from this
   page — deliberate, and said on the dialog in as many words, because a
   promise that it can be found later is exactly what is no longer true. The
   owner still sees every child link in their own share panel and can revoke
   it, which is where the durable record always lived. */
function openDerivedLinkDialog(d, org){
  const link=String((d&&d.link)||'');
  const who=String((d&&d.name)||'').trim();
  const ov=document.createElement('div');
  ov.id='pt-derive-dialog';
  ov.style.cssText='position:fixed;inset:0;z-index:94;display:grid;place-items:center;padding:var(--s-4)';
  ov.innerHTML=`
    <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
    <div class="modal-in" role="dialog" aria-modal="true" aria-labelledby="pt-derive-t"
      style="position:relative;width:100%;max-width:31rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:0;padding:22px var(--s-6)">
      <h3 id="pt-derive-t" style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-1);line-height:1.3">${i18t('po_readonly_created')}</h3>
      <p style="font-size:var(--t-body);color:var(--color-neutral-700);line-height:1.55;margin:0 0 14px">${
        who?`For <b>${esc(who)}</b>. `:''}${i18t('po_readonly_copy_now')}</p>
      <div style="display:flex;align-items:center;gap:var(--s-2);flex-wrap:wrap;margin-bottom:var(--s-3)">
        <input readonly value="${esc(link)}" id="pt-derived-link"
          style="flex:1;min-width:200px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;padding:7px 9px;font-size:var(--t-label);font-family:var(--font-mono);color:var(--color-text);outline:none">
        <button class="ui-btn" id="pt-derive-copy" style="flex:none;font-size:var(--t-meta);padding:7px 13px">${i18t('po_copy')}</button>
      </div>
      ${''/* The panel's own sentence, kept whole. A reader who passes a link on
             believing it private has been misled by our silence. */}
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.55;margin:0 0 var(--s-4)">
        Anyone with this link can read the contract. They cannot accept, reject, propose wording or sign.
        ${d&&d.expiresAt?`Access ends ${esc(String(d.expiresAt).slice(0,10))} at the latest, and sooner if your own link ends first. `:'Access ends when your own link does. '}
        ${esc(org||'The sender')} can see it and can withdraw it at any time.
      </p>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="pt-derive-done" class="ui-btn" style="background:var(--color-accent);border-color:var(--color-accent);color:#fff">${i18t('po_done')}</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const box=ov.querySelector('#pt-derived-link');
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',onKey); };
  function onKey(e){ if(e.key==='Escape') close(); }
  document.addEventListener('keydown',onKey);
  ov.querySelector('#pt-derive-done').addEventListener('click',close);
  ov.querySelector('#pt-derive-copy').addEventListener('click',async()=>{
    box?.select?.();
    try{ await navigator.clipboard.writeText(link); }catch(e){ try{ document.execCommand('copy'); }catch(_){} }
    toast(i18t('po_readonly_copied'),'ok');
  });
  /* NOT dismissed by a click on the backdrop, unlike confirmDialog. This is
     the one and only sight of the link; a stray click outside the card must
     not be able to throw it away. */
  try{ box?.focus(); box?.select?.(); }catch(_){}
}
/* A reply on one fingerprint, sent immediately. It is not a response — it
   changes no wording, opens no round and does not close the link — so it goes
   down the messages route rather than the respond route, exactly as the
   discussion panel's replies do. Their name is required for the same reason it
   is required everywhere else: an unattributed comment on a contract is not
   worth having.

   ONE HANDLER FOR BOTH MOUNTS. The room and the embedded tab are the same
   component, and only the room had this — so the reply box on the embedded copy
   reported "comment posted" and posted it nowhere, onto a record thrown away on
   the next repaint. */
const portalNegoComment = p => async (_c, ch, msg) => {
  if(!PORTAL_OPTS.token){ toast(i18t('po_no_channel_back'),'err'); return; }
  const author=await portalEnsureResponderName();
  if(!author){ toast(i18t('po_enter_full_name'),'err'); return; }
  try{
    const res=await api('shares/'+PORTAL_OPTS.token+'/messages','POST',
      { author, topic:(window.negoTopicFor?negoTopicFor(ch):'change:'+(ch&&ch.id)),
        topicLabel:`Change #${ch&&ch.id}${ch&&ch.clauseLabel?' · '+ch.clauseLabel:''}`,
        body:msg.text });
    PORTAL_OPTS.messages=(res&&res.messages)||PORTAL_OPTS.messages||[];
    toast(`Comment sent to ${(p&&p.org)||'the sender'} — the contract is unchanged`);
  }catch(e){ toast(e.message||'Could not send your comment','err'); }
};
function wirePortalNego(c, p){
  /* ---- THE COUNTERPARTY'S PAGE IS THE WORKBENCH ----
     One negotiation surface, both sides of the table. This used to open the
     three-pane negotiation ROOM over the page — the layout the product retired
     — so the counterparty was negotiating in a different, older product than
     the owner. The room is gone from every route; what mounts here is the same
     redlineEmbed the design ships, with this page's own rules on it:

       · answers and counter-asks are HELD (PORTAL_NEGO_DECISIONS /
         _PROPOSED) and travel only when the postbox is pressed — the same
         hold-then-send this page has always had;
       · no Copilot: this page has no panel, so no AI Assist and no selection
         menu — Direct Edit is the counter-proposal route;
       · the banner speaks to THEM, not about them: their table, their hold.

     The mount rebuilds from portalNegoContract on every change, because this
     page's copy of the contract is reassembled from the payload plus what is
     held — the same rule the room lived by. */
  if(!window.redlineEmbed) return;
  const host=document.getElementById('pt-nego');
  if(!host) return;
  const who=portalResponderLabel(c);
  /* ---- A SIGNING LINK SHOWS WHAT WAS SETTLED; IT DOES NOT REOPEN IT ----
     W6/D4. Signing on trust with no account of what was agreed is the thing
     this product exists to remove, so a signing link has always been able to
     look back. WHAT IT LOOKS BACK AT CHANGED ON 12 AUG 2026: it was a read-only
     mount of this component in the page — the round queue, the marked document
     and the Tracked Changes column, under the wording being signed — and it is
     now the Negotiation history dialog, which is the record rather than a
     second working surface. See portalAgreedHtml. This function therefore no
     longer runs on the signing screen at all: the branch draws no #pt-nego, so
     the early return above takes it.

     The guard below stays regardless, because it is the one that stops a
     signing link ever rendering Direct Edit and the send-decisions postbox — a
     quieter route back into a negotiation the sender declared finished by
     issuing this link. The link states what it is (portalIssuedForSigning reads
     the stored purpose), and the seat is derived from that rather than from
     what is left pending. */
  /* THE LINK MUST SAY SO. Not portalNegoPhase, which also INFERS a signing
     phase for a link that stated no purpose at all — every link created before
     purposes existed, and every one with nothing proposed on it yet. Those keep
     the reading they have always had, or this quietly takes the ability to
     propose edits away from links that were never meant to be signing links.
     Only a link the sender explicitly issued for signature loses the
     negotiating verbs. */
  const signing=portalIssuedForSigning(p);
  /* NO CHANNEL BACK IS NOT READ-ONLY, and treating it as one was a real fault
     (found by the re-audit, 14 Aug 2026). `live` used to require the token, so
     a reader whose copy could not reach this server was shown the negotiation
     with NO Accept and NO Reject at all — nothing to press, and a line telling
     them to reply to an email. Meanwhile the SIGNING screen in the very same
     state still offered Sign, Accept and Decline and minted a copyable response
     code. Two screens, one state, opposite answers; and the more consequential
     act was the one that still worked.
     Their answers are held on THIS PAGE either way — that is what the wall line
     has always promised and what holdsDecisions means — so being unable to
     reach us changes only how the answer travels, not whether one can be given.
     REACH is therefore its own reading, and it gates the two things that
     genuinely need the network: the discussion channel (it posts to a route)
     and minting a derived link. Deciding is not one of them. */
  const reachable=!!PORTAL_OPTS.token;
  const live=!portalReadOnly() && !signing;
  const org=(p&&p.org)||'the sender';
  const held=Object.keys(PORTAL_NEGO_DECISIONS).length;
  const prog=(window.negoProgress&&c)?negoProgress(c):{ done:0, total:0 };
  const facts=`Round ${window.negoRound?negoRound(c):1} &middot; Resolved: ${prog.done} of ${prog.total}`;
  const banner = live
    ? `<div class="rl-wall" role="status"><span class="rl-wall-ic">&#128274;</span><span><b>${i18t('po_your_table')}</b> ${
        held?`<b>${held} answer${held===1?'':'s'}</b> held here — nothing has reached ${esc(org)} yet. `:''
      }${reachable
        ? 'Decisions and counter-proposals stay on this page until you press Send. A reply travels only if marked shared.'
        /* THE PROMISE IS THE SAME; WHAT SEND DOES IS DIFFERENT, and the reader
           has to know that before they start rather than after they press it. */
        : esc(i18t('po_wall_no_channel'))
      } <span id="pt-nego-facts" style="opacity:.75">${facts}</span></span></div>`
    /* THE DELIVERY SENTENCE IS ON BOTH BRANCHES, and the read-only one is the
       branch that needs it MOST — which is why it is not an afterthought here.
       Measured: the moment the owner collects their round the negotiation can
       come into alignment, this page flips read-only, and that is exactly the
       moment the reader wants to be told their answer landed. Drawn on the
       live branch only, the sentence would appear while it still said
       "waiting" and vanish on the tick that turned it to "received".
       Whether this copy can still be answered is a different question from
       whether their last answer arrived; the fact is theirs either way. */
    : `<div class="rl-wall" role="status"><span class="rl-wall-ic">&#128274;</span><span>${esc(
        portalExecuted() ? 'This contract has been executed and sealed — the wording is final.'
        : PORTAL_OPTS.superseded ? 'This copy has been superseded — a newer link was sent to you.'
        : 'This copy is read-only.')}</span></div>`;
  redlineEmbed(host, c, {
    side:'counterparty',
    readonly:!live,
    /* Said, not merely absent — the panel a reader opened expecting to be able
       to answer must explain why it has no verbs. */
    /* THE MORE SPECIFIC REASON WINS. A link can be read-only for several
       reasons at once, and they are not equally useful: "a newer copy was sent
       to you" and "this contract is executed" tell a reader what to do next,
       while "this is a signing link" only explains the absence of buttons.
       So this one speaks only when it is the ONLY thing to say — otherwise it
       would talk over the notice the reader actually needs. */
    /* AND THE OTHER READ-ONLY REASONS COME THROUGH THE SAME LINE NOW. They used
       to be said by the strip, which stood on the page whether or not it had
       verbs on it; the strip is a group in the header and a header has no room
       for a sentence, so the reason travels here — one voice, in the place the
       verbs would have been, exactly as the note above intends. */
    readonlyWhy:(signing && !portalReadOnly() && !PORTAL_OPTS.superseded)
      ? 'This is the agreed wording, shown so you can see what changed before you sign. '
        + 'The negotiation is closed on this link — ask ' + esc(org) + ' if something still needs to change.'
      : (!live
        ? (portalExecuted() ? 'This contract has been executed and sealed — the wording is final.'
          : PORTAL_OPTS.superseded ? 'This copy has been superseded — a newer link was sent to you. Open that one to answer.'
          : PORTAL_OPTS.responded ? 'This link has already been answered. Ask the sender for a fresh one if you need to reply again.'
          /* NOT the no-channel case any more — that state is no longer read-only,
             and the wall line above says how the answer travels instead. */
          : 'This copy is read-only.')
        : undefined),
    holdsDecisions:true,
    canComment:!!PORTAL_OPTS.token && !PORTAL_OPTS.superseded,
    seenScope:PORTAL_OPTS.token||'',
    messages:PORTAL_OPTS.messages||[],
    persist:false,
    by:who, author:who,
    noAi:true,
    selMenu(){ /* no Copilot on this page; selecting text is just reading */ },
    bannerHtml:banner,
    /* THE WHOLE WINDOW, as the owner's page gives it. The cap was
       min(78vh, 860px) and it is what produced a 419px contract pane against
       the owner's 925px: the component was being asked to lay three columns
       out inside a card in a 1100px grid with a 360px aside beside it.
       renderShareWorkbench gives it the page instead. */
    org, height:'100%',
    pendingDecisions:Object.keys(PORTAL_NEGO_DECISIONS).length,
    pendingProposals:Object.keys(PORTAL_NEGO_PROPOSED).length,
    heldDecisionIds:Object.keys(PORTAL_NEGO_DECISIONS),
    /* From the counterparty's seat, a settled owner-ask in the payload IS a
       decision that has travelled — decisions on their asks are nobody
       else's to make. Held ones are excluded; they have not gone yet. */
    sentDecisionIds:[...new Set([
      ...(c.changes||[]).filter(x=>x&&x.authorSide==='owner'
        &&(x.status==='accepted'||x.status==='rejected')&&!x.heldByMe&&!x.withdrawn).map(x=>x.id),
      ...Object.keys(PORTAL_NEGO_SENT||{})])],
    unsentIds:Object.keys(PORTAL_NEGO_PROPOSED),
    /* The transport already walled this payload — nothing unsent is in it —
       and the rebuilt copy's turn stamp cannot re-derive the wall. See
       redlineDocHtml. */
    hiddenIds:[],
    onChange(rec){
      /* ---- A CHANGE THAT ARRIVED ON THE PAYLOAD HAS ALREADY BEEN SENT ----
         (owner-reported 16 Aug 2026: "The counterparty side the changes do not
         seem to be working." Reproduced, and it predates the clause panel.)

         The guard below was `!PORTAL_NEGO_PROPOSED_SENT[ch.id]`, and that store
         starts EMPTY in a fresh browser — it only fills when this reader
         presses Send. So on a link carrying asks this side had already made in
         an earlier round, the first act of any kind swept every one of them
         into "held here until you send them": a reader who redlined once was
         told six changes were not sent and offered "Send all 6", over asks the
         owner had been looking at for a week. Measured on the harness: nothing
         held before the first edit, six held straight after it.

         READ FROM THE PAYLOAD, NOT STORED. The payload IS the record of what
         has reached the other side, so asking it each time cannot go stale, and
         a refreshed link brings its own answer with it. Nothing to persist,
         nothing to migrate, and no second store to keep in step with the
         first. */
      const arrived = new Set((((p||{}).contract||{}).changes||[])
        .map(x => x && x.id).filter(Boolean));
      for(const ch of (rec.changes||[])){
        // a held decision is one that differs from what was sent — see the
        // history on portalDecisionSettled
        if(ch.status!=='pending' && ch.authorSide==='owner' && !portalDecisionSettled(ch))
          PORTAL_NEGO_DECISIONS[ch.id]={ status:ch.status, reply:ch.reply||null };
        else if(ch.status==='pending' && ch.authorSide==='owner') delete PORTAL_NEGO_DECISIONS[ch.id];
        // wording THEY have asked for, held by value until sent
        if(ch.authorSide==='counterparty' && ch.status==='pending'
          && !arrived.has(ch.id) && !PORTAL_NEGO_PROPOSED_SENT[ch.id])
          PORTAL_NEGO_PROPOSED[ch.id]={ ...ch, thread:[] };
        /* And one that HAS arrived can never be held: a stale entry from before
           this rule would otherwise sit in the store for the life of the
           browser, since nothing else ever removes it. */
        if(arrived.has(ch.id) && PORTAL_NEGO_PROPOSED[ch.id]) delete PORTAL_NEGO_PROPOSED[ch.id];
      }
      portalSaveHeld();
      const foot=document.getElementById('pt-nego-foot');
      if(foot){ foot.innerHTML=portalNegoFootHtml(p); wirePortalNegoFoot(c,p); }
      /* ONE COUNT, MANY SURFACES: the number on the bell has to move at the
         same moment the wall line's and the Send button's do, or the bell
         says 3 over a column saying 2 — which is the fault this feature would
         otherwise create. Repaint, never re-render: a reader may have the
         panel open. */
      if(window.portalPaintAlerts) portalPaintAlerts(c, p);
    },
    onWithdraw(_c, id, on){ if(on) PORTAL_NEGO_WITHDRAWN[id]=true; else delete PORTAL_NEGO_WITHDRAWN[id]; portalSaveHeld(); },
    /* A DRAFT TAKEN BACK HAS TO LEAVE THE STORE, or it is put straight back.
       portalNegoContract re-injects every entry in PORTAL_NEGO_PROPOSED on each
       repaint — that is what stops a change this reader filed a moment ago
       vanishing when the room redraws — so a retract that cleared only the
       rebuilt copy was undone by the very next paint. Reported as the button
       doing nothing. The engine's own rules ran and passed; this is the half
       only the page can do. */
    onRetract(_c, id){ delete PORTAL_NEGO_PROPOSED[id]; portalSaveHeld(); },
    onComment:portalNegoComment(p),
    onSendDecisions(){ portalRespond(p,'decisions'); },
    rerender(){ wirePortalNego(portalNegoContract(p), p); },
  });
  const foot=document.getElementById('pt-nego-foot');
  if(foot){ foot.innerHTML=portalNegoFootHtml(p); wirePortalNegoFoot(c,p); }
  /* ---- "REVIEW WHAT CHANGED" IS NOT WIRED HERE ANY MORE ----
     It used to unhide a read-only mount of this same workbench on the signing
     screen, so its listener lived at the bottom of this function — below the
     `if(!host) return` at the top. The mount is gone (see portalAgreedHtml) and
     with it that host, so a handler left here would never be attached and the
     button would be drawn, pressable and dead. It is wired where the signing
     screen wires its other reading verb, beside #pt-hist. */
}
/* ---- HANDING THE DEAL TO SOMEBODY WHO ONLY NEEDS TO READ IT ----
   The route (`shares/:token/derive-view`) does all the deciding: a view ticket
   cannot delegate, a signing ticket's holder was asked to sign rather than to
   distribute, and the child's expiry is capped at the parent's. Nothing is
   re-judged here — portalCanDerive only keeps the button off a page where the
   answer is already known, so the common case is a link and not a refusal.

   The name is asked for and optional. It is what the OWNER sees beside the
   child in their share panel, so "Nordfrakt insurers" is the difference
   between a link they can reason about and an anonymous one they may revoke
   on suspicion. */
async function portalDeriveView(c, p){
  if(!portalCanDerive()) return;
  const btn=document.getElementById('pt-derive');
  const name=await (window.promptDialog?promptDialog({
    get title(){ return i18t('po_share_readonly'); },
    message:`Who is this for? They will be able to READ this contract and nothing else — no accepting, rejecting, proposing wording or signing. ${esc((p&&p.org)||'The sender')} can see the copy and can withdraw it.`,
    placeholder:'e.g. our insurers, or outside counsel' }):Promise.resolve(''));
  /* Cancelled is not "unnamed" — promptDialog answers null for the first and
     an empty string for the second, and minting on a cancel would leave a live
     ticket somebody had just decided against. */
  if(name==null) return;
  if(btn){ btn.disabled=true; btn.textContent='Creating…'; }
  try{
    const r=await api('shares/'+PORTAL_OPTS.token+'/derive-view','POST',{ name:String(name||'').slice(0,120) });
    if(!r||!r.link) throw new Error('The link could not be created');
    /* Straight into the reader's hands. The ticket is live on the server the
       moment this returns, so the ONE screen that shows it opens before
       anything else can repaint over it. */
    openDerivedLinkDialog({ link:r.link, name:String(name||'').trim(), expiresAt:r.expiresAt||null },
      (p&&p.org)||'The sender');
  }catch(e){
    toast(e.message||'Could not create a read-only link','err');
  }
  /* Put the button back either way — on failure especially, rather than
     leaving "Creating…" standing over an act that did not happen. */
  const foot=document.getElementById('pt-nego-foot');
  if(foot){ foot.innerHTML=portalNegoFootHtml(p); wirePortalNegoFoot(c,p); }
}
function wirePortalNegoFoot(c, p){
  /* The pulse on this button is defined in the room's stylesheet — one
     animation for both postboxes rather than two that can drift. The sheet
     goes in <head> and re-adding is a no-op, so asking for it here costs
     nothing and removes the assumption that the room has already opened. */
  if(window.negoEnsureStyle) negoEnsureStyle();
  document.getElementById('pt-nego-send')?.addEventListener('click',()=>portalRespond(p,'decisions'));
  document.getElementById('pt-nego-ready')?.addEventListener('click',()=>portalRespond(p,'ready'));
  document.getElementById('pt-derive')?.addEventListener('click',()=>portalDeriveView(c,p));
  document.querySelectorAll('[data-pt-derive-copy]').forEach(b=>b.addEventListener('click',async()=>{
    const i=b.getAttribute('data-pt-derive-copy');
    const box=document.querySelector(`[data-pt-derived="${i}"]`); if(!box) return;
    box.select?.();
    try{ await navigator.clipboard.writeText(box.value); }catch(e){ try{ document.execCommand('copy'); }catch(_){} }
    toast(i18t('po_readonly_copied'),'ok');
  }));
  document.getElementById('pt-nego-decline')?.addEventListener('click',async()=>{
    /* A refusal the other side cannot understand is a refusal they will argue
       with — the reason is required, exactly as the room required it. */
    const reason=await (window.promptDialog?promptDialog({get title(){ return i18t('po_decline_contract_q'); },
      message:'This ends the negotiation on this link. Say why — they will be told, and it goes on the record.',
      placeholder:'e.g. The liability cap is below our board minimum.'}):Promise.resolve(''));
    if(reason==null) return;
    if(!String(reason).trim()){ toast(i18t('po_reason_required'),'err'); return; }
    portalRespond(p,'decline',{ comment:String(reason).trim() });
  });
}
/* The negotiation room is RETIRED. Both sides of the table use the one
   workbench now — see wirePortalNego — and the code that opened the room from
   this page is gone rather than dormant: a door that still opens is a door
   somebody walks through. */

/* ---------- THE PAGE KEEPS UP WITH THE DEAL ----------

   The owner's screen has polled for years: it picks up the other side's answers
   within a cycle, and every count and banner on it is live. This page rendered
   once, at the moment it was opened, and then never moved. So the counterparty
   sat looking at wording that had been revised, at asks that had already been
   answered, at a turn banner that still said it was their move — and had no way
   to know, because nothing on the page ever told them to reload.

   That is the last asymmetry between the two screens, and it is a read, not a
   write. The architecture note this page is built on says a public no-login URL
   must not MUTATE a contract per click, which is right and is untouched here:
   this asks the same GET the link already answers, on a slow timer.

   WHAT IT MUST NOT DO IS EAT THEIR WORK. A repaint rebuilds the whole page, and
   a reader half-way through rewriting four clauses would lose them — which is
   exactly the fault fixed one release ago in the redline editor, reintroduced
   by a timer. So a refresh that lands while they are working does not happen:
   they are told, once, and choose when. */
const PORTAL_POLL_MS = 45000;         // idle cadence
/* M-5: while the reader is actively working the page, a live back-and-forth
   should not sit up to 45s behind reality. Poll every ~10s when there has been
   recent interaction, and fall back to 45s when idle — the same "fast when
   active, slow when idle" shape the internal app uses, at no extra cost to a
   reader who has walked away. */
const PORTAL_POLL_ACTIVE_MS = 10000;
let _ptPollTimer=null, _ptPollSig=null, _ptPollToken=null, _ptPollInFlight=false;
let _ptLastActivity=0, _ptActivityWired=false;
function portalPollDelay(){ return (Date.now()-_ptLastActivity) < 120000 ? PORTAL_POLL_ACTIVE_MS : PORTAL_POLL_MS; }

/* One place that turns a server answer into render options, so the first paint
   and every refresh after it cannot drift apart. */
function portalRenderOpts(token, d){
  return { token, responded:d.responded, share:d.share||{},
    /* Whether the LAST answer this reader sent has reached the owner's record.
       See portalDeliveryState — three readings, and the third says nothing. */
    lastResponse:d.lastResponse||null,
    prior:d.prior||null, superseded:d.superseded||null,
    /* Read LIVE, not from the payload: a signature that landed after this link
       was last refreshed is precisely the case that matters. */
    executed:d.executed||null,
    emailConfigured:d.emailConfigured!==false, messages:d.messages||[],
    /* The server states it on the envelope as well as inside the payload, and
       the render reads whichever arrives — a reader who may do nothing must not
       depend on one of two flags surviving a refactor. */
    viewOnly:d.viewOnly===true||d.purpose==='view',
    /* Read on the envelope for the same reason as viewOnly above: the router
       must not depend on one of two flags surviving a refactor. A history link
       is also marked viewOnly by the server — it is a read-only pass — so this
       one is checked FIRST in renderSharePortal. */
    historyOnly:d.historyOnly===true||d.purpose==='history',
    /* The share ROW's purpose — what the sender chose, as against what the
       payload guessed. See portalIssuedForSigning. */
    purpose:d.purpose||null };
}
/* A fingerprint of everything on this page a reader would notice moving. Kept
   deliberately narrow: the engagement log ticks on every open, and a page that
   repainted because it had been looked at would never stop repainting. */
function portalSignature(d){
  if(!d) return '';
  const c=(d.payload&&d.payload.contract)||{};
  /* CONTENT ONLY, and `payload.at` is deliberately not in it. That stamp moves
     every time the owner's link is refreshed in place — which happens on their
     side for reasons this reader cannot see — and a signature watching it would
     report a change over an identical page. Everything the stamp could tell us
     is already below: the wording, the asks and their statuses, whose turn it
     is, and what has been said. */
  const parts=[
    String(c.docText||c.redlineText||''),
    (Array.isArray(c.changes)?c.changes:[]).map(x=>`${x.id}:${x.status}:${x.hash||''}:${x.withdrawn?'w':''}`).join(','),
    String((c.negotiation&&c.negotiation.turn)||''), String((c.negotiation&&c.negotiation.turnAt)||''),
    String((c.negotiation&&c.negotiation.round)||''),
    `op${(c.openPoints||[]).length}`, `v${(c.versions||[]).length}`, `rd${(c.rounds||[]).length}`,
    d.executed?`x:${d.executed.at||'1'}`:'', d.superseded?`s:${d.superseded.at||'1'}`:'',
    d.responded?'r':'', String((d.messages||[]).length),
    String((d.share&&d.share.expiresAt)||''),
    /* THE ONE EXCEPTION TO "CONTENT ONLY", and it earns it. Whether the last
       answer this reader sent has been COLLECTED is not content, but unlike
       payload.at it is a fact about THEIR OWN act, it is drawn on this page,
       and it flips exactly once per round. Left out, the sentence saying
       "waiting to be picked up" would go on saying it after it had been. */
    (d.lastResponse&&d.lastResponse.applied!=null)?`ap${d.lastResponse.applied?1:0}`:'',
  ].join('');
  let h=0; for(let i=0;i<parts.length;i++) h=(h*31+parts.charCodeAt(i))>>>0;
  return parts.length+'.'+h.toString(16);
}
/* Is the reader in the middle of something a repaint would destroy? */
function portalBusy(){
  try{
    if(Object.keys(PORTAL_CLAUSE_EDITS).length) return true;      // clauses rewritten, not sent
    if(Object.keys(PORTAL_NEGO_DECISIONS).length
      || Object.keys(PORTAL_NEGO_PROPOSED).length
      || Object.keys(PORTAL_NEGO_WITHDRAWN).length) return true;  // answers held, not sent
    const rl=document.getElementById('portal-redline');
    if(rl && !rl.classList.contains('hidden')) return true;       // the editor is open
    if(document.getElementById('confirm-overlay')) return true;
    if(document.getElementById('prompt-overlay')) return true;
    const modal=document.getElementById('modal-root');
    if(modal && String(modal.innerHTML||'').trim()) return true;
    return false;
  }catch(_){ return true; }   // cannot tell ⇒ assume they are working
}
/* What a poll that came back should do. A pure read of the two answers, so the
   rule is one thing a test can hold rather than three scattered conditions. */
function portalPollDecide(d, prevSig){
  if(!d) return 'same';
  const sig=portalSignature(d);
  if(prevSig && sig===prevSig) return 'same';
  /* THE DEAL IS OVER, OR THIS COPY IS. Repainted whatever the reader is doing —
     not to be rude, but because everything they are working on has just become
     unsendable, and letting them carry on typing into it is the worse outcome.
     The banner that replaces it says exactly what happened. */
  if(d.executed || d.superseded) return 'repaint';
  return portalBusy() ? 'notify' : 'repaint';
}
/* The quiet strip. It appears once, says what moved, and waits — it never
   reloads under somebody's hands. */
function portalUpdatedNoticeHtml(){
  return `<div id="pt-updated" role="status" style="position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:var(--s-3);
      border-bottom:1px solid var(--st-amber-line);background:var(--st-amber-bg);padding:10px var(--s-6);font-size:var(--t-body);color:var(--st-amber-fg);box-shadow:var(--shadow-sm)">
    <span style="flex:none;display:inline-flex">${icon('alert','w-4 h-4')}</span>
    <span style="flex:1;min-width:0;line-height:1.5"><b>${i18t('po_contract_updated')}</b>
      Your unsent work is still here — send it or set it aside, then refresh to see the new copy.</span>
    <button id="pt-updated-go" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:6px 13px">${i18t('po_refresh_now')}</button>
  </div>`;
}
function portalShowUpdatedNotice(){
  if(document.getElementById('pt-updated')) return;      // said once, not once a minute
  const root=document.getElementById('share-root'); if(!root) return;
  root.insertAdjacentHTML('afterbegin', portalUpdatedNoticeHtml());
  document.getElementById('pt-updated-go')?.addEventListener('click',()=>portalRefreshNow('asked'));
}
async function portalFetchShare(token){
  const r=await fetch('api/shares/'+encodeURIComponent(token));
  const d=await r.json().catch(()=>null);
  return { status:r.status, ok:r.ok, d };
}
/* Repaint from the server's current answer, keeping the reader where they were
   on the page — a refresh that jumps them back to the top reads as the page
   having reset rather than caught up. */
function portalRepaint(token, d){
  let y=0; try{ y=window.scrollY||0; }catch(_){}
  renderSharePortal(d.payload, portalRenderOpts(token, d));
  _ptPollSig=portalSignature(d);
  try{ window.scrollTo(0, y); }catch(_){}
}
async function portalRefreshNow(reason){
  if(!_ptPollToken || _ptPollInFlight) return 'skipped';
  _ptPollInFlight=true;
  try{
    const { status, ok, d }=await portalFetchShare(_ptPollToken);
    /* The link died while they held it open — withdrawn by the sender, or
       expired. That is a whole-page answer and it is shown immediately. */
    if(status===410){ portalStopPolling(); renderSharePortal(null,{ gone:(d&&d.gone)||'expired', goneMsg:d&&d.error }); return 'gone'; }
    if(!ok || !d) return 'error';
    /* Still waiting for an earlier signer. Painted once — a waiting page that
       repainted on every tick would flicker for nobody's benefit — and the
       poll carries on, because this page's whole promise is that it notices
       the turn arriving by itself. */
    if(d.dormant){
      if(!document.getElementById('pt-dormant')) renderSharePortal(null,{ dormant:d.dormant, token:_ptPollToken });
      return 'dormant';
    }
    /* The turn just arrived on a page that was dormant: repaint regardless of
       the content signature — the previous paint had no contract on it. */
    if(document.getElementById('pt-dormant')){ portalRepaint(_ptPollToken, d); return 'repaint'; }
    const what=(reason==='asked') ? 'repaint' : portalPollDecide(d, _ptPollSig);
    if(what==='repaint'){ portalRepaint(_ptPollToken, d); return 'repaint'; }
    if(what==='notify'){ portalShowUpdatedNotice(); return 'notify'; }
    return 'same';
  }catch(e){ return 'error'; }        // a dropped connection is not news; the next tick retries
  finally{ _ptPollInFlight=false; }
}
function portalStopPolling(){ if(_ptPollTimer){ clearTimeout(_ptPollTimer); _ptPollTimer=null; } }
/* M-5: a self-rescheduling timer, so each tick picks the active-or-idle delay
   afresh rather than being locked to one interval for the life of the page. */
function portalScheduleNextPoll(){
  if(_ptPollToken==null) return;
  _ptPollTimer=setTimeout(async()=>{ await portalRefreshNow('tick'); portalScheduleNextPoll(); }, portalPollDelay());
}
function portalStartPolling(token, d){
  portalStopPolling();
  _ptPollToken=token; _ptPollSig=portalSignature(d);
  _ptLastActivity=Date.now();   // opening the link is itself activity
  try{
    // Recent interaction bumps the cadence to ~10s. Wired once, not per repaint,
    // so repeated starts do not stack listeners.
    if(!_ptActivityWired){
      ['pointerdown','keydown'].forEach(ev=>document.addEventListener(ev,()=>{ _ptLastActivity=Date.now(); }, { passive:true }));
      /* Coming back to the tab is the moment somebody most wants the truth, and
         it costs one request rather than a faster timer for everybody. */
      document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ _ptLastActivity=Date.now(); portalRefreshNow('visible'); } });
      _ptActivityWired=true;
    }
    portalScheduleNextPoll();
  }catch(_){ /* a page that cannot keep a timer still renders */ }
}

async function portalEntry(encoded){
  if(encoded.startsWith('t:')){        // server-backed share token
    const token=encoded.slice(2);
    try{
      const { status, ok, d }=await portalFetchShare(token);
      if(status===410){ renderSharePortal(null,{ gone:(d&&d.gone)||'expired', goneMsg:d&&d.error }); return; }
      if(!ok) throw new Error(d?.error||'not found');
      /* A dormant bound link (W7): show the waiting page AND start polling —
         the poll is what turns it into the signing page when the earlier
         signer signs. */
      if(d.dormant){ renderSharePortal(null,{ dormant:d.dormant, token }); portalStartPolling(token, d); return; }
      renderSharePortal(d.payload, portalRenderOpts(token, d));
      portalStartPolling(token, d);
    }catch(e){ renderSharePortal(null); }
    return;
  }
  renderSharePortal(b64d(encoded));    // static-mode share (payload in the URL)
}
/* ============================================================
   THE VIEWER'S SCREEN — a read-only copy for somebody outside the deal
   ============================================================
   WP-1.4. The reader is an advisor, an insurer, a lawyer being asked whether
   this is normal. They get the wording and the marks, and no way to touch
   anything.

   BUILT SEPARATELY FROM THE OTHER TWO SCREENS, not as the negotiate page with
   its buttons hidden. Hiding controls leaves every id, every handler and every
   tab stop in the document, and the next person to add a control to the shared
   page adds it here too without knowing. This screen renders from the viewer
   payload the server assembled by allow-list, and there is nothing on it to
   hide because nothing was ever put on it.

   IT SAYS WHAT IT IS, TWICE. A banner naming who shared it and the date it was
   frozen, and a watermark that survives the reader printing it and passing the
   paper on. A read-only copy that looks like the live contract will eventually
   be read as the live contract.

   PRINT IS THE POINT. The likeliest thing an advisor does with this link is
   print it to PDF and mark it up in their own way. So the print stylesheet is
   part of the feature, not a nicety: banner and chrome off, watermark and
   marks kept. */
function portalViewerRedlineHtml(c){
  const changes=Array.isArray(c.changes)?c.changes:[];
  if(!changes.length) return '';
  const rows=changes.map(ch=>{
    const marks=(Array.isArray(ch.ops)&&ch.ops.length&&window.redlineOpsHtml)
      ? redlineOpsHtml(ch.ops)
      : (window.redlineOps&&window.redlineOpsHtml)
        ? redlineOpsHtml(redlineOps(String(ch.oldText||''),String(ch.newText||'')))
        : esc(String(ch.newText||''));
    /* Outcome as VISUAL STATE only. Who ruled on it, when, and why are the
       negotiation's story and the story belongs to the parties — the payload
       does not carry them (viewerPayload, server/server.js), so there is
       nothing here to leak even by accident. */
    const st=String(ch.status||'pending');
    const chip=st==='accepted'?'Agreed':st==='rejected'?'Not agreed':'Still open';
    return `<li class="pv-chg" data-status="${esc(st)}">
      <div class="pv-chg-head"><span class="pv-chg-where">${esc(ch.clauseLabel||'Clause')}</span>
        <span class="pv-chg-state">${chip}</span></div>
      <div class="pv-chg-body">${marks}</div></li>`;
  }).join('');
  return `<section class="pv-changes" aria-label="${i18t('po_proposed_changes')}">
    <h2>${i18t('po_proposed_changes')}</h2>
    <p class="pv-note">Struck-through text is proposed for removal; underlined text is proposed
      to be added. Whether each one was agreed is shown beside it.</p>
    <ol class="pv-list">${rows}</ol></section>`;
}

function portalViewerStyle(){
  if(document.getElementById('pv-style')) return;
  const el=document.createElement('style'); el.id='pv-style';
  el.textContent=`
    .pv-wrap{min-height:100vh;background:var(--color-bg);}
    .pv-banner{background:var(--color-accent-900);color:#fff;padding:13px var(--s-6);}
    .pv-banner b{font-family:var(--font-mono);font-weight:var(--w-strong);}
    .pv-banner .pv-sub{display:block;font-size:var(--t-meta);color:var(--color-accent-200);margin-top:3px;line-height:1.5;}
    .pv-page{max-width:920px;margin:0 auto;padding:26px var(--s-6) 60px;}
    .pv-sheet{position:relative;background:var(--color-doc-surface);box-shadow:var(--shadow-md);border-radius:0;padding:34px var(--s-10);overflow:hidden;}
    /* The watermark is behind the words and never on top of them: a copy an
       advisor cannot read is a copy they ask to be re-sent unmarked. */
    .pv-sheet::before{content:attr(data-mark);position:absolute;inset:0;display:grid;place-items:center;
      transform:rotate(-28deg);font-family:var(--font-mono);font-size:clamp(26px,7vw,58px);
      font-weight:var(--w-title);letter-spacing:.08em;color:rgba(17,24,39,.055);white-space:pre;pointer-events:none;z-index:0;}
    .pv-sheet>*{position:relative;z-index:1;}
    .pv-changes{margin-top:22px;}
    .pv-changes h2{font-family:var(--font-heading);font-size:16px;font-weight:var(--w-strong);margin:0 0 var(--s-1);}
    .pv-note{font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.55;margin:0 0 var(--s-3);}
    .pv-list{list-style:none;margin:0;padding:0;display:grid;gap:10px;}
    .pv-chg{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;padding:11px 13px;}
    .pv-chg-head{display:flex;gap:10px;align-items:baseline;margin-bottom:5px;}
    .pv-chg-where{font-family:var(--font-mono);font-size:var(--t-meta);font-weight:var(--w-strong);}
    .pv-chg-state{font-size:var(--t-label);color:var(--color-neutral-600);}
    .pv-chg-body{font-size:var(--t-card);line-height:1.75;color:var(--color-doc-text);}
    .pv-foot{margin-top:26px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.6;}
    @media print{
      .pv-banner,.pv-foot{display:none!important;}
      .pv-wrap,.pv-page{background:#fff;padding:0;max-width:none;}
      .pv-sheet{box-shadow:none;border-radius:0;padding:0;}
      .pv-sheet::before{color:rgba(17,24,39,.09);}
      .pv-chg{break-inside:avoid;}
    }`;
  document.head.appendChild(el);
}

function renderShareViewer(p, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts; PORTAL_OPTS.payload=p;
  const root=document.getElementById('share-root');
  document.getElementById('app-shell').classList.add('hidden');
  portalViewerStyle();
  const c=(p&&p.contract)||{};
  const org=(p&&p.org)||'the sender';
  const asOf=(p&&p.asOf)?fmtDT(p.asOf):'';
  const round=(p&&p.round)||1;
  const to=(opts.share&&opts.share.recipientName)||'';
  const mark=((opts.share&&opts.share.recipientEmail)||'').trim()||'CONFIDENTIAL — VIEW ONLY';
  /* ---- THE WORDING, WHICHEVER OF THE TWO FORMS IT ARRIVES IN ----
     Reported with a screenshot of an empty white box (Young, 11 Aug 2026), on
     the first read-only link anybody sent: banner, watermark and footnote all
     drawn correctly around a hole where the contract should be.

     This read `c.redlineText` alone, which is the STORED wording — and a
     contract drafted from a template has none. Its words are rendered on
     demand from the template and the record's own fields, which is the same
     property that makes clause ids unstable on those contracts (see
     negoStampContract). An upload has no stored wording either. So the
     read-only copy was blank for every one of the twelve built-ins and for
     every migrated file, and correct only for a contract somebody had
     redlined.

     THE PAGE CANNOT RENDER A TEMPLATE ITSELF, and that is deliberate rather
     than an oversight: the server's viewerPayload strips this copy down to the
     wording and the marks, because an outside reader gets the argument and not
     the arguers. Handing it the template and every field back would undo that
     trim to solve a rendering problem. So the OWNER's side renders the body
     once, at the moment the link is made, and sends the finished document —
     see `viewBody` in buildSharePayload.

     AN EMPTY PAYLOAD SAYS SO. Every view link minted before this carries
     neither form on a template contract, and a viewer is the one screen with
     no way to report a fault: they cannot respond, and the sender never learns
     the page was blank. It asks for a fresh copy instead, which is the fix. */
  const src=c.redlineText || c.viewBody || '';
  const body=src
    ? (window.readOnlyDocHtml?readOnlyDocHtml(src):esc(src))
    : `<p style="font-size:var(--t-body);line-height:1.6;color:var(--st-ruby-fg)">${
        esc(i18t('po_view_body_failed',{ org }))}</p>`;
  root.innerHTML=`
  <div class="pv-wrap">
    <header class="pv-banner" role="status">
      <b>Read-only copy shared by ${esc(org)}${to?` with ${esc(to)}`:''}</b>
      <span class="pv-sub">${esc(c.name||'Contract')}${c.counterparty?` · with ${esc(c.counterparty)}`:''}
        &middot; Round ${esc(String(round))}${asOf?` &middot; as it stood on ${esc(asOf)}`:''}.
        You can read and print this copy. You cannot edit it, respond to it or sign it —
        send any comments to ${esc(org)} directly.</span>
    </header>
    <div class="pv-page">
      <div class="pv-sheet" data-mark="${esc(mark)}"${window.docDesignPaperAttr&&window.resolveDocBranding?docDesignPaperAttr(resolveDocBranding(c)):''} style="${window.docDesignPaperStyle&&window.resolveDocBranding?docDesignPaperStyle(resolveDocBranding(c)):''}">
        ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c,{bleedX:40,bleedY:34}):''}
        <article class="doc-surface">${window.docStructureBodyHtml&&window.resolveDocBranding?docStructureBodyHtml(resolveDocBranding(c),body):body}</article>
        ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
        ${portalViewerRedlineHtml(c)}
      </div>
      <p class="pv-foot">This is a fixed copy of the contract as it stood on ${esc(asOf||'the date it was shared')}.
        The contract may have changed since. Ask ${esc(org)} for a current copy if you need one.</p>
    </div>
  </div>`;
}

/* ============================================================
   THE COUNTERPARTY'S WORKBENCH — the same screen, at the same size
   ============================================================
   W1/W2. Their negotiation link used to mount the shared workbench as a CARD:
   a 1100px two-column grid, the component height-capped at min(78vh, 860px),
   a 360px sticky aside beside it. Measured in Chromium at 1440x940 from one
   contract, that gave them a 419px contract pane where the owner had 925px,
   a page 2761px tall against the owner's 940px, a Discussion tab clipped
   outside its own panel, and change cards breaking mid-identifier. The owner's
   renderRedline() hands the same component the whole window.

   A LESSER SCREEN FOR THE OTHER SIDE IS THE THING THIS ROOM EXISTS NOT TO BE.
   Everything needed to read, judge, propose and answer is here, at the size
   the owner reads it at.

   WRITTEN AS ITS OWN SCREEN rather than as the old page with parts hidden —
   the same reasoning as the viewer above. Hiding leaves every id, handler and
   tab stop in the document, and the duplicates this replaces were not
   incidental: #pt-doc rendered a SECOND, unmarked copy of the contract below
   the workbench, showing the wording BEFORE the counterparty's own proposal,
   with nothing to say so. Two documents on one page disagreeing about what the
   contract says is worse than either alone. #portal-redline was a third
   surface — a standalone clause editor duplicating the Direct Edit already in
   the workbench.

   WHAT THEY DO NOT GET, and why (unchanged, carried through from the embed
   options): no Copilot — it reads our whole portfolio and our playbook; no
   clause library — it IS our negotiating position; no Save Draft — our draft
   state, meaningless outside the workspace; no Share or Import — a
   counterparty who can re-share has published our contract onward; no side
   toggle — they ARE the counterparty view, permanently; no round controls —
   the owner drives rounds; and no back arrow, because there is no page behind
   theirs (negoRoomHasExit already encodes exactly that rule).

   AND NO BULK VERBS EITHER, as of 10 Aug 2026. This seat kept Accept all and
   Reject all longest, on the argument that "I agree to all of it" is a real and
   common answer and withholding the button withholds only their time. They are
   gone now: the press disposes of every ask we filed at once, from a header,
   with no clause in front of the reader. The per-card verbs are unchanged and
   the head counts what is left, so the answer is still reachable — six presses
   instead of one. See redlinePanesHtml, which is where it was drawn. */
/* ============================================================
   THE COUNTERPARTY'S OWN BELL, AND THEIR OWN ALERTS PANEL
   ============================================================
   (owner-asked, 13 Aug 2026.) The owner has a bell in the top bar: it carries
   a count, and pressing it slides an ALERTS panel in from the right listing
   everything waiting on them, each row a door to the thing itself. The
   counterparty had nothing of the kind — they get a page and are left to work
   out for themselves what is outstanding.

   THE OWNER'S BELL AND PANEL CANNOT BE REUSED, and that is the whole shape of
   this job rather than a detail. They live inside the app shell, and this page
   hides that shell completely (renderShareWorkbench adds `hidden` to
   #app-shell). Un-hiding it to get at them would drop the entire workspace —
   the sidebar, the register, every contract in the book — onto a page that
   must never show any of it. So this is its own bell and its own panel, built
   in this screen, wearing the same shape.

   EVERY COUNT IS BORROWED, NEVER INVENTED. The same standing rule the owner's
   panel follows: a bell saying 3 over a column showing 2 is the fault this
   feature would otherwise create. Each row below reads the SAME thing the page
   already prints — the held decisions come from PORTAL_NEGO_DECISIONS, which
   is what the wall line counts and what the Send button's own label says; the
   undecided changes are the cards' own population; "the wording changed" is
   portalChangedText, which is what the Compare button exists for.

   AND COUNTING MUST NOT WRITE. c.changes is read RAW. negoChanges() runs
   negoInit(), which CREATES a negotiation on any contract that has none — the
   trap the owner's own panel is already written around, and one that would be
   silent here because this page rebuilds its contract on every repaint.

   NOTHING INTERNAL EVER LEAKS. There is nothing to leak by construction: every
   reading below is about the counterparty's own work, taken from the payload
   and from what this browser is holding. No reviewer, no colleague, no roster
   and no hint that a review happened — none of those facts exist on this side
   of the wall at all. */
const PT_ALERT_TONE = { amber:'var(--st-amber-dot)', green:'var(--st-green-dot)',
  ruby:'var(--st-ruby-dot)', gray:'var(--color-neutral-400)' };
/* Days before expiry at which the link's end date stops being trivia and
   becomes something to act on. A date three weeks out is a fact nobody needs
   in an alerts list. */
const PT_EXPIRY_SOON = 10;
function portalAlerts(c, p){
  const out = [];
  const push = (kind, tone, text, go) => out.push({ kind, tone, text, go: go || null });
  /* READ-ONLY PAGES DO NOT LIST WORK. Executed, superseded, already answered:
     those are facts, not doors, and a panel offering four things to do on a
     sealed contract is worse than no panel. Said plainly and nothing else. */
  const ex = portalExecuted();
  if (ex) return [{ kind:'closed', tone:'green', text:i18t('pa_executed'), go:null }];
  if (PORTAL_OPTS.superseded) return [{ kind:'closed', tone:'amber', text:i18t('pa_superseded'), go:null }];
  if (PORTAL_OPTS.responded) return [{ kind:'closed', tone:'gray', text:i18t('pa_answered'), go:null }];

  const changes = (c && Array.isArray(c.changes)) ? c.changes : [];
  /* 1. WHAT IS WAITING ON THEIR ANSWER — the other side's live asks that this
        browser is not already holding a decision on. The same population the
        change cards draw and the round queue counts. */
  const waiting = changes.filter(x => x && x.authorSide === 'owner'
    && x.status === 'pending' && !x.withdrawn && !PORTAL_NEGO_DECISIONS[x.id]);
  if (waiting.length) push('answer', 'amber', i18tn('pa_awaiting', waiting.length, { n:waiting.length }),
    () => portalGoToChange(waiting[0].id));
  /* 2. WHAT THEY HAVE DECIDED AND NOT SENT. Exactly the number the wall line
        prints and the Send button carries — one reading, three surfaces. */
  const held = Object.keys(PORTAL_NEGO_DECISIONS).length
    + Object.keys(PORTAL_NEGO_PROPOSED).length;
  if (held) push('held', 'amber', i18tn('pa_held', held, { n:held }),
    () => portalPressSend());
  /* ---- DID OUR ROUND REACH THEM — IN THE BELL, NOT ON THE PAGE ----
     (owner-reported 23 Aug 2026: "keep the alerts in the bell ... because they
     are now popping up and staying on screen which is distracting.")

     This shipped the day before as a sentence in the wall band, which is drawn
     on every paint and never goes away — so the one thing added to this page
     was also the one thing permanently in front of the reader. It is a STATUS,
     not a standing instruction: worth a glance, worth being able to find, and
     not worth a line of the header for the life of the sitting. The bell is
     the shelf this product already keeps for exactly that.

     GREEN FOR ARRIVED, GREY FOR IN FLIGHT — never amber. Amber on this panel
     means work owed by THIS reader and neither of these is: one is good news,
     the other is somebody else's turn. portalDeliveryState still answers three
     ways and the third says nothing, so an older link adds no row at all. */
  const dlv = portalDeliveryState();
  if (dlv) push(dlv === 'received' ? 'delivered' : 'in-flight',
    dlv === 'received' ? 'green' : 'gray',
    i18t(dlv === 'received' ? 'po_answer_received' : 'po_answer_waiting',
      { who: (PORTAL_OPTS.payload && PORTAL_OPTS.payload.org) || 'the sender' }), null);
  /* 3. THE WORDING MOVED SINCE THEY LAST LOOKED — the Compare button's own
        reading, so the alert and the button cannot disagree about whether
        there is anything to compare. */
  if (portalChangedText()) push('changed', 'amber', i18t('pa_wording_changed'),
    () => { const b = document.getElementById('pt-compare'); if (b) b.click(); });
  /* 4. A REPLY ARRIVED ON A CLAUSE. negoThreadUnread is the cards' own
        predicate — the same one that puts the dot on a card's Discuss. */
  if (window.negoThreadUnread && window.negoMergedThread){
    const msgs = PORTAL_OPTS.messages || [];
    const replied = changes.filter(ch => {
      try {
        const t = negoMergedThread(c, ch, msgs);
        return negoThreadUnread(t, 'counterparty',
          window.negoThreadSeenAt ? negoThreadSeenAt(PORTAL_OPTS.token || '', ch.id) : 0);
      } catch (_) { return false; }
    });
    if (replied.length) push('reply', 'gray', i18tn('pa_reply', replied.length, { n:replied.length }),
      () => portalGoToChange(replied[0].id));
  }
  /* 5. THEY ARE WAITING FOR YOU TO SIGN — only where this page actually offers
        the act, read off the button's own gate rather than recomputed. A
        second copy of negoAlignment here would be free to disagree with the
        button an inch below it. */
  const ready = document.getElementById('pt-nego-ready');
  if (ready && !ready.disabled && !waiting.length && !held)
    push('sign', 'green', i18t('pa_ready_to_sign'), () => ready.click());
  /* 6. WHEN THE LINK DIES. A fact, stated once, and only when it is close —
        no door, because there is nothing on this page that changes it. */
  const exp = PORTAL_OPTS.share && PORTAL_OPTS.share.expiresAt;
  if (exp){
    const days = Math.ceil((Date.parse(exp) - Date.now()) / 86400000);
    if (isFinite(days) && days <= PT_EXPIRY_SOON)
      push('expiry', days <= 2 ? 'ruby' : 'gray',
        days <= 0 ? i18t('pa_expired') : i18tn('pa_expires', days, { n:days, when:String(exp).slice(0,10) }),
        null);
  }
  return out;
}
/* A ROW IS A DOOR, and a door that leaves the panel covering the thing it
   pointed at is not one — so every `go` runs with the panel already shut. */
function portalGoToChange(id){
  const card = document.querySelector(`[data-nego-card="${(window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id)}"]`);
  if (!card) return;
  card.scrollIntoView({ block:'center', behavior:'smooth' });
  try { card.focus({ preventScroll:true }); } catch (_) {}
}
/* The page's ONE postbox, pressed by proxy — never a second transport. Same
   discipline as the card's own Send. */
function portalPressSend(){
  const btn = document.querySelector('#pt-nego-foot [data-pt-send], #nego-send-decisions');
  if (btn && !btn.disabled) btn.click();
}
/* ---- THE BELL, IN THEIR HEADER ROW ----
   Beside Negotiation history and Compare wording, wearing the same treatment.
   IT COUNTS AND IT HIDES AT ZERO. The owner's old dot was hard-coded markup —
   always on, counting nothing — and an always-on badge is one people learn to
   ignore, which is exactly what had happened to it. */
function portalBellHtml(){
  return `<button id="pt-bell" class="ui-btn pt-verb pw-id-verb pt-bell" type="button"
    aria-haspopup="dialog" aria-expanded="false" aria-controls="pt-alerts"
    title="${esc(i18t('pa_bell_title'))}" aria-label="${esc(i18t('pa_bell_title'))}"
    >&#128276;<span id="pt-bell-dot" class="pt-bell-dot" hidden>0</span></button>`;
}
/* ---- AND THE PANEL, FROM THE RIGHT ----
   The owner's shape: a title saying ALERTS, a dimmed backdrop, and three ways
   out — the ✕, the backdrop and Escape. Rendered once into the page (not into
   the workbench mount, which the embed rebuilds on every change). */
function portalAlertsShellHtml(){
  return `<div id="pt-alerts-scrim" class="pt-alerts-scrim" hidden></div>
  <aside id="pt-alerts" class="pt-alerts" role="dialog" aria-modal="false"
    aria-label="${esc(i18t('pa_title'))}" aria-hidden="true">
    <header class="pt-alerts-head">
      <span class="pt-alerts-title">${esc(i18t('pa_title'))}</span>
      <button id="pt-alerts-close" class="pt-alerts-x" type="button"
        title="${esc(i18t('pa_close'))}" aria-label="${esc(i18t('pa_close'))}">&times;</button>
    </header>
    <div id="pt-alerts-body" class="pt-alerts-body"></div>
  </aside>`;
}
let PT_ALERT_ROWS = [];
/* ---- AND THE PAGE'S OWN NOTICES COME IN HERE ----
   The workbench folds its notices behind a floating amber bell. On THIS page
   that bell stood down when the header got one (two bells about one contract
   is worse than none), so the notices it used to fold are printed at the top
   of this panel instead — the header bell is the one door, and nothing it
   replaced may become unreachable. rlSeatAlertsHtml is the ONE population, so
   a notice added to the workbench's stack arrives here too rather than
   existing on one seat only.

   NOTHING INTERNAL COMES WITH THEM: on this seat rlOneNoticeHtml's two
   sources — the review banner and the desk band — both refuse before they
   draw a word, so what reaches this panel is the readiness signal and
   whatever else is explicitly meant for the counterparty. */
function portalSeatNoticesHtml(c){
  if (!window.rlSeatAlertsHtml) return '';
  try { return rlSeatAlertsHtml(c, { side:'counterparty', readonly:portalReadOnly() }) || ''; }
  catch (_) { return ''; }
}
function portalAlertsBodyHtml(rows, notices){
  const n = String(notices || '');
  const wrap = n ? `<div class="pt-alerts-notices">${n}</div>` : '';
  if (!rows.length) return wrap + `<div class="pt-alerts-empty">
    <div class="pt-alerts-tick">&#10003;</div>
    <div class="pt-alerts-none">${esc(i18t('pa_nothing'))}</div>
    <div class="pt-alerts-sub">${esc(i18t('pa_nothing_sub'))}</div>
  </div>`;
  return wrap + `<div class="pt-alerts-scope">${esc(i18t('pa_scope'))}</div>`
    + rows.map((a, i) => a.go
      ? `<button class="pt-alert" data-pt-alert="${i}" data-pt-kind="${esc(a.kind)}" type="button">
          <span class="pt-alert-dot" style="background:${PT_ALERT_TONE[a.tone] || PT_ALERT_TONE.gray}"></span>
          <span class="pt-alert-t">${esc(a.text)}</span></button>`
      /* A FACT IS NOT A DOOR. The expiry date and the read-only reasons have
         nowhere to send anybody, so they are not drawn as pressable. */
      : `<div class="pt-alert pt-alert-flat" data-pt-kind="${esc(a.kind)}">
          <span class="pt-alert-dot" style="background:${PT_ALERT_TONE[a.tone] || PT_ALERT_TONE.gray}"></span>
          <span class="pt-alert-t">${esc(a.text)}</span></div>`).join('');
}
/* The keyboard's way out, held between the open and the close. */
let PT_ALERTS_TRAP=null;
function portalAlertsOpen(on){
  const panel=document.getElementById('pt-alerts');
  const scrim=document.getElementById('pt-alerts-scrim');
  const bell=document.getElementById('pt-bell');
  if(!panel) return;
  panel.classList.toggle('open', !!on);
  panel.setAttribute('aria-hidden', on?'false':'true');
  if(scrim) scrim.hidden=!on;
  if(bell) bell.setAttribute('aria-expanded', on?'true':'false');
  /* ---- AND THE KEYBOARD STAYS INSIDE IT ---- (25 Aug 2026)
     Every row here is a door, exactly as on the owner's own panel, and Tab
     used to walk out of it into the contract behind. ONE PLACE, because this
     function is the single answer to "is the panel showing" — the bell, the
     ✕, the scrim and Escape all arrive here. Read through window: this is a
     module, and a bare cross-module read throws rather than falling through,
     which on the counterparty's page would take the whole panel down. */
  if(on && !PT_ALERTS_TRAP && typeof window.trapFocus==='function')
    PT_ALERTS_TRAP=window.trapFocus(panel);
  else if(!on && PT_ALERTS_TRAP){ try{ PT_ALERTS_TRAP(); }catch(_){} PT_ALERTS_TRAP=null; }
}
const portalAlertsClose = () => portalAlertsOpen(false);
/* Repainted rather than re-rendered, so the count and the rows follow the page
   without the panel closing under a reader who has it open. */
function portalPaintAlerts(c, p){
  const bell=document.getElementById('pt-bell');
  if(!bell) return;
  let rows=[]; try{ rows=portalAlerts(c,p)||[]; }catch(_){ rows=[]; }
  PT_ALERT_ROWS=rows;
  const notices=portalSeatNoticesHtml(c);
  const dot=document.getElementById('pt-bell-dot');
  /* THE COUNT COUNTS, AND IT HIDES AT ZERO. A read-only page's single sentence
     is not a count — there is nothing waiting on anybody — so it does not
     wear a number. */
  const n=rows.filter(r=>r.kind!=='closed').length;
  if(dot){ dot.textContent=n>9?'9+':String(n); dot.hidden=!n; }
  /* AND THE BELL ITSELF STANDS DOWN WHEN THERE IS NOTHING AT ALL, which is
     what stops it being furniture on a finished contract. */
  /* A NOTICE IS NOT A COUNT, but it is still something to read — so it keeps
     the bell on screen without putting a number on it. Hiding the bell with a
     notice behind it would make that notice unreachable, which is the one
     thing the floating bell standing down must not cost. */
  bell.hidden=!rows.length && !notices;
  const body=document.getElementById('pt-alerts-body');
  if(body) body.innerHTML=portalAlertsBodyHtml(rows, notices);
}
function wirePortalAlerts(c, p){
  portalPaintAlerts(c, p);
  const root=document.getElementById('share-root');
  if(!root || root._ptAlertsWired) return;
  root._ptAlertsWired=true;
  /* ONE DELEGATED LISTENER on the page root: the header and the panel body are
     both repainted by paths that run after this, and an element-bound handler
     is dropped by the first of them. */
  document.addEventListener('click', ev => {
    const t=ev.target;
    if(!t || !t.closest) return;
    if(t.closest('#pt-bell')){ ev.preventDefault();
      portalAlertsOpen(document.getElementById('pt-alerts')
        && !document.getElementById('pt-alerts').classList.contains('open'));
      return; }
    if(t.closest('#pt-alerts-close') || t.closest('#pt-alerts-scrim')){ portalAlertsClose(); return; }
    const row=t.closest('[data-pt-alert]');
    if(row){
      const a=PT_ALERT_ROWS[Number(row.getAttribute('data-pt-alert'))];
      /* THE PANEL CLOSES BEHIND THE DOOR, before the door is opened, so
         nothing lands under a panel that is still covering it. */
      portalAlertsClose();
      if(a && typeof a.go==='function') a.go();
    }
  });
  document.addEventListener('keydown', ev => {
    if(ev.key==='Escape') portalAlertsClose();
  });
}
function portalAlertsStyle(){
  if(document.getElementById('pt-alerts-style')) return;
  const el=document.createElement('style'); el.id='pt-alerts-style';
  el.textContent=`
    .pt-bell{position:relative;}
    .pt-bell-dot{position:absolute;top:-5px;right:-5px;min-width:16px;height:16px;padding:0 var(--s-1);
      border-radius:0;background:var(--st-amber-fg);color:var(--color-surface);
      font-family:var(--font-mono);font-size:var(--t-label);font-weight:var(--w-title);line-height:16px;text-align:center;}
    .pt-alerts-scrim{position:fixed;inset:0;background:rgba(15,23,42,.38);z-index:70;}
    .pt-alerts{position:fixed;top:0;right:0;bottom:0;width:min(360px,88vw);z-index:71;
      background:var(--color-surface);border-left:1px solid var(--color-divider);
      box-shadow:-14px 0 40px rgba(15,23,42,.18);display:flex;flex-direction:column;
      transform:translateX(102%);transition:transform var(--dur-3) ease,visibility 0s linear var(--dur-3);
      visibility:hidden;}
    .pt-alerts.open{transform:none;visibility:visible;transition:transform var(--dur-3) ease;}
    .pt-alerts-head{flex:none;display:flex;align-items:center;gap:var(--s-2);
      padding:var(--s-3) 14px;border-bottom:1px solid var(--color-divider);}
    .pt-alerts-title{flex:1;font-size:var(--t-label);font-weight:var(--w-title);letter-spacing:.12em;
      text-transform:uppercase;color:var(--color-neutral-600);}
    .pt-alerts-x{border:0;background:none;font:inherit;font-size:var(--t-page);line-height:1;cursor:pointer;
      color:var(--color-neutral-600);padding:0 var(--s-1);}
    .pt-alerts-body{flex:1;min-height:0;overflow-y:auto;padding:10px var(--s-3);}
    /* The workbench's own notice cards, printed here instead of folded behind
       a second bell. They are built for a floating stack about 320px wide, so
       they need nothing but room to be a block. */
    .pt-alerts-notices{display:grid;gap:var(--s-2);margin-bottom:10px;}
    .pt-alerts-notices>*{max-width:100%;position:static;}
    .pt-alerts-scope{font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;
      color:var(--color-neutral-600);margin-bottom:var(--s-2);}
    .pt-alert{display:flex;gap:9px;width:100%;padding:9px 2px;border:0;
      border-bottom:1px solid color-mix(in srgb,var(--color-text) 7%,transparent);
      background:none;font:inherit;text-align:left;color:inherit;cursor:pointer;align-items:flex-start;}
    .pt-alert-flat{cursor:default;}
    .pt-alert:not(.pt-alert-flat):hover{background:color-mix(in srgb,var(--color-text) 5%,transparent);}
    .pt-alert-dot{width:8px;height:8px;border-radius:50%;flex:none;margin-top:5px;}
    .pt-alert-t{flex:1;min-width:0;font-size:var(--t-meta);line-height:1.45;font-weight:var(--w-strong);}
    .pt-alerts-empty{padding:26px 6px;text-align:center;}
    .pt-alerts-tick{width:38px;height:38px;margin:0 auto 10px;display:grid;place-items:center;
      border-radius:50%;background:var(--st-green-bg);color:var(--st-green-fg);}
    .pt-alerts-none{font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text);}
    .pt-alerts-sub{font-size:var(--t-meta);color:var(--color-neutral-600);margin-top:var(--s-1);line-height:1.5;}
    /* ---- NO BELL ON THE PHONE, AND THAT IS DELIBERATE ----
       Below 768px this page draws its notices in flow and the header has no
       room for another control. The phone keeps what it has. */
    @media (max-width:767px){ .pt-bell{display:none;} .pt-alerts,.pt-alerts-scrim{display:none;} }
  `;
  document.head.appendChild(el);
}
function portalWorkbenchStyle(){
  if(document.getElementById('pw-style')) return;
  const el=document.createElement('style'); el.id='pw-style';
  el.textContent=`
    /* THE WHOLE WINDOW, MEASURED FROM THE WINDOW. --view-h is the app
       shell's content-scroll height, measured for the owner's chrome — on
       this standalone page it can resolve to a fraction of the screen, which
       cut the portal off two-thirds down and left a dead white band under
       it. The counterparty is the customer; their page fills their screen. */
    .pw-page{height:100vh;height:100dvh;box-sizing:border-box;display:flex;flex-direction:column;
      gap:9px;padding:9px var(--s-4) var(--s-3);background:var(--color-bg);min-height:0;overflow:hidden;}
    html,body{background:var(--color-bg);}
    /* ---- IT WRAPS AT EVERY WIDTH, NOT ONLY ON A PHONE (15 Aug 2026) ----
       This row wrapped below 1024 and nowhere else, which was true while it
       held a title, two reading verbs, a bell and a stepper. The reading switch
       and the More menu added about 320px to it, and at 1180 the deal verbs ran
       off the right-hand edge of the window — MEASURED, not guessed.
       Raising the breakpoint would have been a number to re-guess the next time
       something joins this row. Wrapping on content is the answer that needs no
       number: the row takes one line while one line is enough and takes a second
       when it is not. Below 1024 the verbs still claim a whole row of their own
       (see the media query) — that is a different rule, about a phone, and it
       stays. row-gap so a wrapped line is not welded to the one above it. */
    .pw-id{display:flex;align-items:center;gap:11px;row-gap:9px;flex-wrap:wrap;
      flex:none;background:var(--color-surface);
      border:1px solid var(--color-divider);border-radius:0;padding:9px 14px;box-shadow:var(--shadow-sm);}
    /* The title is what gives way first: it is the one thing in the row that can
       shorten without losing a control, and it already ellipsises. */
    .pw-id-main{flex:1 1 220px;}
    .pw-id-badge{width:30px;height:30px;flex:none;border-radius:0;background:var(--color-accent);
      color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-body);}
    .pw-id-main{min-width:0;line-height:1.3;}
    .pw-id-main h1{margin:0;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    .pw-id-sub{display:block;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
    /* THE DEAL VERBS SIT WHERE THE NAME BOX USED TO (owner-asked, 12 Aug 2026).
       The strip that carried them across the page is gone and its slot moved in
       here — same id, same builder, same wiring funnel, so every refill site
       and portalSetBusy reach it exactly as before. margin-left:auto pushes the
       group to the right-hand end, which is the corner the reader's eye already
       goes to for an act on this page. */
    .pw-id .pw-foot{margin-left:auto;}
    /* ---- THE SECOND LINE: READING ON THE LEFT, ACTS ON THE RIGHT ----
       flex-basis:100% is what makes it a LINE rather than more items in the
       wrapping run above — the pair used to arrive there only when the row
       happened to overflow, which depended on the length of the contract's
       name. See the note at the markup. */
    .pw-id-row2{flex:0 0 100%;display:flex;align-items:center;gap:10px;
      flex-wrap:wrap;row-gap:9px;min-width:0;}
    /* ---- THE OVERFLOW MENU, AND THE ROW IT HAS TO LIVE IN ----
       position:relative on the wrapper, not on .pw-id: the menu is absolutely
       placed and .pw-id is a wrapping flex row, so hanging it off the row would
       put it at the row's corner rather than under its own button once the row
       wrapped. Right-aligned because this control sits at the right-hand end of
       the reading group and a left-aligned panel would run off the edge. */
    .pw-more-wrap{position:relative;flex:none;}
    .pw-more-wrap .room-menu{right:0;left:auto;top:calc(100% + 6px);}
    .pw-more-caret{display:inline-flex;transition:transform var(--dur-1) ease;}
    #pt-more[aria-expanded="true"] .pw-more-caret{transform:rotate(180deg);}
    /* The reading switch is the owner's own control, drawn by the shared
       builder, so it needs no colours here — only the room to sit in a row
       that was built before it existed. */
    .pw-id .rl-readwrap{flex:none;}
    /* ---- FOCUS MODE ON THIS PAGE ----
       The owner's rl-focused stands down the app shell, which this page does
       not have; what has to go here is this page's own header and its notice
       stack. Kept as its own class for exactly that reason — see rlSetFocus.
       The wall line is NOT hidden: it is the sentence promising that decisions
       stay on this page until Send, and a reading posture must not take a
       promise off the screen. */
    body.pw-focused .pw-id{display:none;}
    body.pw-focused .pw-notes{display:none;}
    body.pw-focused .pw-page{padding-top:6px;}
    /* THE WAY OUT. The negotiation page shows its own copy through
       .redline-page.rl-focus; this page is not that page, so it shows the same
       button through its own posture class. The LOOK is not repeated here —
       the .rl-focus-exit rule in the negotiation stylesheet is unscoped for
       position, colour and type, so one dress serves both. Hidden by default,
       because the button lives in the DOM the whole time. */
    .rl-focus-exit{display:none;}
    body.pw-focused .rl-focus-exit{display:inline-flex;}
    /* The two reading verbs — see portalReadingBtnsHtml for why they stopped
       being ui-btn-secondary. The tint is mixed against whatever surface is
       under it, so the pair reads the same in either theme. */
    .pw-id-read{display:inline-flex;align-items:center;gap:7px;flex:none;}
    /* Size only. The COLOUR lives in portalVerbStyle (.pt-verb) because these
       same two buttons also render on the signing screen, and a treatment kept
       in one screen's stylesheet is a treatment the other screen misses. */
    /* Two classes here too, and for the same reason: .ui-btn sets its own
       font-size and padding, so a single-class rule loses the tie wherever
       this sheet happens to land. */
    .ui-btn.pw-id-verb{flex:none;font-size:var(--t-meta);padding:7px var(--s-3);min-height:32px;}
    /* Verbs on the left of it, reading controls on the right. Without this the
       row is one undifferentiated run of pills. */
    .pw-id-rule{width:1px;height:22px;flex:none;background:var(--color-divider);margin:0 1px;}
    /* The banners the old page carried in its main column — closed, revised,
       round, compare, message-from-sender. They carry facts the workbench does
       not render, so they are re-homed rather than dropped. */
    .pw-notes{flex:none;display:grid;gap:6px;}
    .pw-notes:empty{display:none;}
    /* The workbench takes everything that is left, and scrolls inside its own
       columns — which is the whole difference between this and the card. */
    .pw-mount{flex:1;min-height:0;display:flex;flex-direction:column;}
    .pw-mount>*{flex:1;min-height:0;}
    /* THE DEAL-LEVEL VERBS ARE A STRIP ON THE PAGE, AND IT IS VISIBLE. Send,
       Ready to sign and Decline live in #pt-nego-foot (portalNegoFootHtml) —
       acts about the WHOLE deal, so they belong to the page, not to a card.
       This bar shipped with [hidden] on it: correct on the day, because the
       workbench's change column still drew its own pulsing send beside the
       cards — and wrong the day the new design took that visible send away
       (the owner got Publish Round on their toolbar; this page has no
       toolbar). The counterparty's every deal verb was unreachable pixels
       while every test passed, pressing buttons no reader could see. The
       strip is styled here and NEVER hidden on this page; f180 pins it
       visible.
       It was a CARD AT THE FOOT of the page until 11 Aug 2026, when the
       owner asked for that card to go so the workbench could run to the
       bottom. The element and its id survive — every refill site, every
       test and portalSetBusy all reach it by id — it now sits under the
       header as a plain strip, no card chrome, and the workbench below it
       takes everything that is left. */
    .pw-foot{flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap;
      padding:0 3px;}
    .pw-foot:empty{display:none;}
    @media (max-width:1024px){
      /* Below the three-column width the page is allowed to grow and scroll:
         a fixed-height flex layout on a phone is how a document becomes
         unreadable rather than merely cramped. Degrading deliberately, as the
         work order asks, instead of inheriting the desktop grid. */
      .pw-page{height:auto;overflow:visible;}
      .pw-mount{min-height:70vh;}
      /* The identity row now carries the two reading buttons, the stepper AND
         every deal verb — Send, Ready to sign, Decline, Share a read-only copy.
         On a desktop that fits on one line; on a phone it must be allowed to
         fall onto a second rather than squeeze the contract's name to nothing.
         The verbs keep their own row when they wrap, which is what stops Send
         landing beside the contract's title with no gap. */
      .pw-id{flex-wrap:wrap;}
      .pw-id .pw-foot{margin-left:0;flex-basis:100%;}
      /* A group separator means nothing once the groups have wrapped onto
         different lines. */
      .pw-id-rule{display:none;}
    }`;
  document.head.appendChild(el);
}

function renderShareWorkbench(p, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts; PORTAL_OPTS.payload=p;
  /* The verbs stand in the identity row on this page, so the builder drops the
     paragraph that used to sit beside them. See portalNegoFootHtml. */
  PORTAL_FOOT_COMPACT=true;
  portalLoadHeld();          // before the room is built — the room is built FROM these
  portalWorkbenchStyle();
  portalVerbStyle();   // renderShareWorkbench is also reached directly, not only via renderSharePortal
  const root=document.getElementById('share-root');
  document.getElementById('app-shell').classList.add('hidden');
  FIRST_PARTY=p.org;
  const c=portalNegoContract(p);
  const org=(p&&p.org)||'the sender';
  /* ---- THE SENDER'S COVERING NOTE IS AN EMAIL, NOT A PAGE ELEMENT ----
     (owner-asked, 13 Aug 2026.) An envelope strip reading "Message from
     <name>: …" sat across the top of this page, above the wall line. It is
     gone, and so are the three other places this page reproduced the same
     typed words: the box in the respond panel, the block at the foot of the
     Compare wording dialog, and the "What changed" panel — which wore a
     different title but was filled from the sender's own textarea in the
     share dialog.

     THE NOTE ITSELF IS NOT LOST AND WAS NEVER PRIMARILY HERE. It travels in
     the EMAIL, word for word, under "Message from <name>", and in the
     WhatsApp text; both are untouched. What the reader opens the link for is
     the contract, and the covering note belongs in the covering letter.

     THE SERVER STOPS SENDING IT TOO, which is what makes this true of links
     already sitting in somebody's inbox rather than only of new ones — see
     GET /api/shares/:token. Nothing has to be migrated.

     TWO THINGS THAT LOOK LIKE THIS AND ARE NOT:
       · the per-clause DISCUSSION channel, which is a conversation between
         the two sides stored separately and still reads on its own cards;
       · the one COURTESY sentence when the person handling our side hands
         over (leadNotice, immediately below). That is a fact about who they
         are dealing with, not a covering note, and it stays.
     AND THE WALL LINE STAYS, AND STAYS FIRST. The message banner sat above
     it; only the message goes. */

  /* ---- THE CONTACT ON OUR SIDE HAS CHANGED, AND THEY ARE TOLD ----
     One sentence, on the round the handover happened and no other. It is the
     ONLY thing about our internal arrangements that ever reaches this page:
     they learn that the person they have been dealing with has handed the file
     on, which is ordinary courtesy, and nothing about who else works it, who
     drafted a clause, or that a desk exists at all.
     Discovering a new name at the top of a page with no explanation is how a
     counterparty comes to feel handled; this is the difference. */
  const handover=(p&&p.leadNotice)
    ? `<div class="rl-wall" role="status"><span class="rl-wall-ic">&#128100;</span><span>${esc(p.leadNotice)}</span></div>` : '';
  root.innerHTML=`
  <div class="pw-page" id="pw-page">
    ${''/* ---- THE WAY OUT OF FOCUS MODE (owner-asked 23 Aug 2026) ----
           Focus mode stands this page's header down, and the header is where
           the More menu that turned it on lives — so a reader who pressed it
           had NO visible way back, only Escape, which nobody would guess.
           MEASURED before: .rl-focus-exit did not exist on this page at all.

           THE SAME BUTTON THE NEGOTIATION PAGE USES — same class, same data
           attribute — so it inherits that page's dressing and its handler
           rather than growing a second way to leave one posture. It is always
           in the DOM and shown only while focus is on, for the reason the
           negotiation page states: the control that turns focus ON is inside
           the strip focus mode hides.

           BOTTOM RIGHT, owner-chosen off three options: match the negotiation
           page exactly rather than give the two pages different corners.
           Nothing else is pinned there on this page — the floating notices
           stack draws no bell on the counterparty's seat. */}
    <button type="button" class="rl-focus-exit" data-rl-focus-exit
      title="${i18t('ng_leave_focus')}">${i18t('ng_exit_focus')}</button>
    <section class="pw-id">
      <span class="pw-id-badge">HT</span>
      <span class="pw-id-main">
        <h1>${esc(c.name||'Contract')}</h1>
        <span class="pw-id-sub">${esc(c.id||'')}${c.counterparty?` &middot; with ${esc(c.counterparty)}`:''}
          &middot; shared by ${esc(p.sharedBy||org)}${opts.share&&opts.share.expiresAt
            ?` &middot; link expires ${esc(String(opts.share.expiresAt).slice(0,10))}`:''}</span>
      </span>
      ${''/* THE NAME BOX HAS GONE (owner-asked, 12 Aug 2026), AND THE FACT IT
             COLLECTED HAS NOT. It stood in this row for the whole sitting to
             collect one string — the person stamped on every change they file
             and every comment they post. It is asked at the moment of sending
             now, once, and remembered: see portalEnsureResponderName, which
             also explains why NOT asking would have been the wrong kind of
             tidy (the box arrived pre-filled with whatever the sender addressed
             the link to, which on a real link was the counterparty COMPANY —
             a person's box answered with an organisation, and now with nowhere
             to correct it). */}
      ${''/* Negotiation history and Compare wording — the reading verbs, on
             the row with the other reading controls. See portalReadingBtnsHtml. */}
      ${portalReadingBtnsHtml()}
      ${''/* ---- AND THEIR OWN BELL (owner-asked, 13 Aug 2026) ----
             The owner has one in the top bar with a count and a panel behind
             it; the counterparty had nothing, and was left to work out for
             themselves what was outstanding. The owner's cannot be reused —
             it lives in the app shell, which this page hides completely — so
             this is its own, wearing the same shape. See portalAlerts. */}
      ${portalBellHtml()}
      ${''/* The same reading control the owner's bench carries — the
             counterparty is the customer, and squinting at 11px wording is
             not a seat-relative fact. The stepper is the shared component
             (rlSetDocType updates every mounted .redline-page, this embed
             included). */}
      ${window.rlTypeStepHtml ? rlTypeStepHtml() : ''}
      ${''/* Their own overflow: a clean PDF, a Word file with the marks, and
             focus mode. See portalMoreMenuHtml for the six rows it deliberately
             does not carry. */}
      ${portalMoreMenuHtml()}
      ${''/* ---- AND EVERY DEAL VERB, WHERE THE NAME BOX USED TO BE ----
             Send / Ready to sign / Decline / Share a read-only copy. They were
             a strip across the page under this row until the owner asked for
             that card to go so the contract could have the space (12 Aug 2026)
             — the second such move: it was a card at the FOOT of the page until
             11 Aug.

             THE SLOT MOVED, NOTHING ELSE DID. Same id, same builder
             (portalNegoFootHtml), same wiring funnel (wirePortalNegoFoot), so
             every refill site, portalSetBusy and f180 reach it exactly as
             before, and the signing screen's own #pt-nego-foot — a different
             page, inside its own card — is untouched. NEVER hidden: see the
             .pw-foot note in portalWorkbenchStyle for the week this bar spent
             as [hidden] and what that cost. */}
      ${''/* ---- HOW THE CONTRACT READS, ON ITS OWN LINE (owner-reported
             23 Aug 2026: "the redlined, as agreed and with changes should move
             to the highlighted area just like how it is in the negotiations
             page") ----
             Redlined / As agreed / With changes is the owner's own switch
             through the one shared builder (rlReadSegsHtml) — never a second
             copy — and their document renderer has always honoured the setting.
             It used to sit up among the identity row's controls; the deal verbs
             wrapped to a second line beneath and left that line empty on its
             left. So the two now share that line the way the negotiation page's
             control bar does: how you are READING on the left, what you can DO
             on the right.
             ONE ROW ELEMENT, so the pair cannot come apart: flex-basis:100%
             forces the break rather than relying on the identity row happening
             to wrap, which depended on how long the contract's name was.
             #pt-nego-foot keeps its id, its class and its builder — every
             refill site, portalSetBusy and f180's roll call reach it exactly as
             before; only its parent changed. */}
      <div class="pw-id-row2">
        ${window.rlReadSegsHtml ? rlReadSegsHtml() : ''}
        <div id="pt-nego-foot" class="pw-foot"></div>
      </div>
    </section>
    <div class="pw-notes">
      ${portalClosedBanner()}
      ${portalRevisedBanner()}
      ${portalRoundBanner(c,p)}
      ${handover}
    </div>
    <div class="pw-mount"><div id="pt-nego"></div></div>
  </div>
  ${''/* The panel is a LAYER over the page, rendered beside .pw-page rather
         than inside the workbench mount — the embed rebuilds that mount on
         every change, and a panel inside it would close under a reader who
         had it open. */}
  ${portalAlertsShellHtml()}`;
  portalAlertsStyle();
  /* The reading control: the stepper presses the shared rlSetDocType, which
     updates every mounted workbench root, this embed included. */
  if(window.rlWireTypeStep) rlWireTypeStep(root);
  /* The reading bar's own controls. They are rendered by portalCompareBar into
     this screen as well as the signing one, and were only ever WIRED on the
     signing screen — so on the negotiation link, which is where a reader most
     needs them, both buttons were dead markup. */
  document.getElementById('pt-compare')?.addEventListener('click',()=>openPortalVersionCompare(p));
  document.getElementById('pt-hist')?.addEventListener('click',()=>openPortalHistory(p));
  portalWireRevisedBanner(p);
  /* The shared component, wired exactly as the old page wired it. Same
     function, same options — this changes the room the workbench stands in,
     never the workbench. */
  wirePortalNego(c, p);
  /* ---- AND THE BELL, AFTER THE WORKBENCH ----
     Wired LAST, deliberately: two of its readings are taken off the page the
     workbench has just drawn — the Ready-to-sign button's own disabled gate,
     and the change cards it counts — so painting before the mount exists
     would read an empty page and hide a bell that should be lit. */
  wirePortalAlerts(c, p);
  /* Their overflow menu. After the header is on the page, and it wires its own
     rows plus one document-level listener that is armed exactly once — see
     wirePortalMore. The reading switch beside it needs no wiring at all: its
     presses are already delegated on `document` by the component. */
  wirePortalMore(c, p);
  /* Focus mode's Escape is the component's own, armed once, and it is what
     takes a reader back out of the mode this menu can now put them into. It is
     idempotent by design. */
  if(window.rlWireFocusKey) rlWireFocusKey();
  /* Polling is NOT started here. portalEntry owns it — it holds the token and
     the fetched envelope, which is what portalStartPolling actually takes.
     Starting it from the renderer passed the wrong arguments AND left a live
     interval behind on every render, which under the test harness is a node
     process that never exits. */
}

/* ---- W7: THE WAITING PAGE A DORMANT SIGNING LINK OPENS TO ----
   A bound link before its turn serves no contract at all — the server answers
   a `dormant` envelope instead of a payload, so there is nothing on this page
   to hide and nothing on it to press. It is deliberately NOT the gone/expired
   card: the link is real and will work, and a signer told "invalid link"
   phones the sender, while one told "you are after the MD" waits — or chases
   the right person. The page keeps polling and comes alive by itself the
   moment the turn arrives. */
function renderShareDormant(d, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts;
  const root=document.getElementById('share-root');
  document.getElementById('app-shell').classList.add('hidden');
  const who = d.waitingOnParty==='counterparty'
    ? `<strong>${esc(d.waitingOn||'an earlier signer')}</strong> signs before you on the agreed order`
    : `${esc(d.org||'the sender')}'s own signatures are not yet complete`;
  root.innerHTML=`<div id="pt-dormant" style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:0 var(--s-4);">
    <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:0;padding:var(--s-8);text-align:center;max-width:26rem;">
      <div style="color:var(--st-amber-dot);margin-bottom:var(--s-3);display:flex;justify-content:center;">${icon('clock','w-8 h-8')}</div>
      <h1 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:20px;color:var(--color-text);margin:0;">${i18t('po_not_your_turn')}</h1>
      <p style="font-size:var(--t-body);color:var(--color-neutral-700);margin-top:var(--s-2);line-height:1.6;">This is your personal signing link${d.contractName?` for <strong>“${esc(d.contractName)}”</strong>`:''}${d.org?` from ${esc(d.org)}`:''}${d.order&&d.total?` — you are signer ${d.order} of ${d.total}`:''}. ${who}.</p>
      <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin-top:10px;line-height:1.6;">Keep this link. This page checks automatically and will come alive the moment it is your turn — nothing is needed from you until then.${d.expiresAt?` The link expires on ${esc(String(d.expiresAt).slice(0,10))}.`:''}</p>
    </div></div>`;
}

/* ---------- THE HISTORY LINK'S WHOLE SCREEN ----------
   Not a modal over an empty page: the history IS the page here, so closing it
   would have to close nothing. The timeline itself is the product's own
   component (negoTimelineScreenHtml), the same one both seats already read, so
   there is one history in this product and not a second one written for
   outsiders — which is what would drift.

   What differs from the owner's copy is the DATA, not the screen, and the
   server decided it: historyPayload carries the changes and the round shape
   and leaves the agreement, the uploaded file and the round baselines behind.
   Nothing on this page can leak the document, because the document was never
   sent to it.

   Verify integrity and Export history are wired the same way the owner's modal
   wires them, against the same functions. A reader with no account can check
   the record has not been altered, which is the point of handing somebody a
   history rather than a paragraph claiming what it says. */
function renderShareHistory(p, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts; PORTAL_OPTS.payload=p;
  const root=document.getElementById('share-root');
  document.getElementById('app-shell')?.classList.add('hidden');
  const c=portalNegoContract(p);
  const org=(p&&p.org)||'the sender';
  const expires=opts.share&&opts.share.expiresAt
    ? ` &middot; link expires ${esc(String(opts.share.expiresAt).slice(0,10))}` : '';
  const paint=(f={})=>{
    root.innerHTML=`
      <div style="min-height:100vh;background:var(--color-bg);padding:14px var(--s-4) 28px;">
        <div style="max-width:860px;margin:0 auto;display:flex;flex-direction:column;gap:10px;">
          <section style="display:flex;align-items:center;gap:11px;background:var(--color-surface);
            border:1px solid var(--color-divider);border-radius:0;padding:9px 14px;box-shadow:var(--shadow-sm);">
            <span style="width:30px;height:30px;flex:none;border-radius:0;background:var(--color-accent);
              color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-body);">HT</span>
            <span style="min-width:0">
              <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.name||'Contract')}</span>
              <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);font-family:var(--font-mono);
                white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.id||'')}${
                c.counterparty?` &middot; with ${esc(c.counterparty)}`:''} &middot; shared by ${esc(p.sharedBy||org)}${expires}</span>
            </span>
          </section>
          ${''/* Says what this link is BEFORE the reader starts looking for the
                 contract on it. A record with no document is a surprise worth
                 spending two lines on. */}
          <div class="rl-wall" role="status"><span class="rl-wall-ic">&#128220;</span><span>
            <b>${i18t('po_record_not_contract')}</b> Every change proposed on
            ${esc(c.id||'this contract')}, in the order it happened, with what was decided. This link
            is read-only and the agreement itself does not travel with it &mdash; there is nothing
            here to answer or sign.</span></div>
          <div style="background:var(--color-surface);border:1px solid var(--color-divider);
            border-radius:0;box-shadow:var(--shadow-sm);overflow:hidden;">
            ${''/* The seat is the ONE thing this page says differently: the
                   Side filter reads "Ours"/"Theirs" from THEIR chair, so
                   'owner' is labelled Theirs here. Nothing else about the
                   component changes, and no event's side value moves. */}
            <div id="pt-hist-mount">${window.negoTimelineScreenHtml
              ? negoTimelineScreenHtml(c, f, { seat:'counterparty' })
              : `<div style="padding:20px;font-size:var(--t-body);color:var(--color-neutral-600)">${i18t('po_history_unavailable')}</div>`}</div>
          </div>
        </div>
      </div>`;
    /* The filters re-render the mount rather than the page, so the header and
       the wall do not flicker on every change of a dropdown. */
    root.querySelectorAll('[data-ht-filter]').forEach(s=>s.addEventListener('change',()=>{
      const g=k=>{ const el=document.getElementById('ht-f-'+k); return el&&el.value?el.value:''; };
      paint({ clauseId:g('clauseId'), actor:g('actor'), side:g('side'),
        round:g('round'), outcome:g('outcome') });
    }));
    document.getElementById('ht-clear')?.addEventListener('click',()=>paint({}));
    document.getElementById('ht-verify')?.addEventListener('click',async()=>{
      const box=document.getElementById('ht-verify-result'); if(!box) return;
      if(typeof window.negoIntegrityReport!=='function'){
        box.innerHTML=`<div style="font-size:var(--t-meta);color:var(--color-neutral-600);padding:var(--s-2) 0">${i18t('po_verification_unavailable')}</div>`;
        return; }
      const r=await negoIntegrityReport(c);
      box.innerHTML=window.negoVerifyResultHtml?negoVerifyResultHtml(r):'';
    });
    document.getElementById('ht-export')?.addEventListener('click',async()=>{
      if(typeof window.negoIntegrityReport!=='function'||!window.negoHistoryExportHtml) return;
      const r=await negoIntegrityReport(c);
      const html=negoHistoryExportHtml(c, r);
      if(window.downloadFile) downloadFile(`${c.id||'contract'}-negotiation-history.html`, html, 'text/html');
    });
  };
  paint({});
}

function renderSharePortal(p, opts={}){
  /* The signing screen draws the verbs at the foot of a card, which has room
     for the sentence beside them. Reset here rather than only set on the
     workbench, because one browser reaches both screens in one sitting —
     "Review what changed" and back. */
  PORTAL_FOOT_COMPACT=false;
  /* Before any branch below picks a screen: every one of them can render the
     reading verbs, and each used to depend on whichever stylesheet its own
     screen happened to inject. See portalVerbStyle. */
  portalVerbStyle();
  /* A dormant bound link routes out even ahead of the view link: the server
     sent no payload at all, so every branch below would read as an invalid
     link when the truth is "not yet". */
  if(opts&&opts.dormant) return renderShareDormant(opts.dormant, opts);
  /* ---- THE VIEW LINK LEAVES HERE, BEFORE ANYTHING IS ASSEMBLED ----
     First statement in the function, ahead of portalLoadHeld and the whole
     page build. A view link has no held decisions to restore, no respond
     panel, no send. Routing it out at the top rather than branching inside the
     page is what makes "there is nothing on that screen to hide" true rather
     than aspirational — the negotiate page's controls are never constructed at
     all, so no future addition to them can leak onto a reader's copy. */
  /* ---- A HISTORY LINK LEAVES FIRST, AHEAD OF THE VIEW LINK ----
     Ahead, because the server marks a history payload viewOnly as well — it is
     a read-only pass and every write route must treat it as one — and the view
     branch below would otherwise swallow it and render a contract screen for a
     payload that deliberately has no contract in it. Most specific first. */
  if((opts&&opts.historyOnly)||(p&&(p.historyOnly||p.purpose==='history')))
    return renderShareHistory(p, opts);
  if((opts&&opts.viewOnly)||(p&&(p.viewOnly||p.purpose==='view')))
    return renderShareViewer(p, opts);
  /* ---- AND THE NEGOTIATION SEAT GETS ITS OWN FULL-WINDOW SCREEN ----
     Same reason, one step further in: the negotiate page's duplicates are not
     hidden here, they are never built. What is left below this line is the
     SIGNING screen and the invalid/expired states. */
  try{
    if(p && p.kind==='hati-share' && p.contract
      && portalNegoPhase(p).phase==='negotiate') return renderShareWorkbench(p, opts);
  }catch(_){ /* fall through to the page below rather than showing nothing */ }
  PORTAL_MODE=true; PORTAL_OPTS=opts; PORTAL_OPTS.payload=p;
  /* Whatever this reader had answered and not sent, put back — see
     portalLoadHeld. Before the room is built, because the room is built FROM
     these. */
  portalLoadHeld();
  const root=document.getElementById('share-root');
  document.getElementById('app-shell').classList.add('hidden');
  // Is there actually a document to render? Three ways there can be:
  // an uploaded file, a built-in template the portal can regenerate, or the
  // contract's OWN body (redlineText) — which is how every contract created
  // from a custom template carries its wording. That third case was missing,
  // so those contracts were reported to the counterparty as an invalid link.
  const validDoc = p && p.kind==='hati-share' && p.contract &&
    (p.contract.source==='upload' || !!p.contract.redlineText || !!TEMPLATES[p.contract.template]);
  if(!validDoc){
    const gone=opts.gone;   // 'expired' | 'revoked' — the link was real but is no longer active
    root.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:0 var(--s-4);">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:0;padding:var(--s-8);text-align:center;max-width:24rem;">
        <div style="color:${gone?'var(--st-amber-dot)':'var(--st-ruby-dot)'};margin-bottom:var(--s-3);display:flex;justify-content:center;">${icon(gone?'clock':'ban','w-8 h-8')}</div>
        <h1 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:20px;color:var(--color-text);margin:0;">${gone==='revoked'?'Link withdrawn':gone==='expired'?'Link expired':'Invalid share link'}</h1>
        <p style="font-size:var(--t-body);color:var(--color-neutral-700);margin-top:6px;line-height:1.5;">${opts.goneMsg||(gone?'This share link is no longer active. Ask the sender to reshare the contract.':'This link is malformed or truncated. Ask the sender to generate a fresh one.')}</p>
      </div></div>`;
    return;
  }
  FIRST_PARTY=p.org;
  /* THE STATUS THIS PAGE GIVES THE CONTRACT IT BUILDS.
     It was 'Under Review', unconditionally, because the payload carried no
     status and a contract needs one to render. That was harmless right up to
     the moment the deal was signed: every guard in the shared Negotiation
     component that closes a finished negotiation reads `c.status === 'Signed'`,
     so on this page not one of them could ever fire. The executed fact now
     travels (see buildSharePayload) and the server reports it live, so the
     record this page builds can tell the truth about which of the two it is. */
  /* What is left below this line renders the SIGNING screen and the
     read-only/expired states — the negotiate seat left at the top of this
     function (renderShareWorkbench). So "propose your edits" has no business
     here: a signing link is issued when the sender has declared the wording
     final, and a standalone clause editor on it is a second route back into a
     negotiation that was closed. W6. */
  const signingSeat=portalIssuedForSigning(p);   // chosen, never inferred
  const c=migrateContract({ ...p.contract, status:portalExecuted()?'Signed':'Under Review',
    folder:p.contract.folder || (TEMPLATES[p.contract.template]||{}).folder || 'corp' });
  /* Display-side repair: a copy shared before delete-time marker cleanup can
     carry literal {{code}} in its wording — the form the payload also carries
     makes a clean re-render deterministic. Executed copies are left alone. */
  if(c.templateForm && !portalExecuted() && /\{\{/.test(String(c.redlineText||'')) && window.templateFormDocHtml)
    c.redlineText=templateFormDocHtml(c.templateForm);
  const input=(id,label,ph)=>`
    <label style="display:block;margin-bottom:10px;"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-mono);letter-spacing:.02em;">${label}</span>
    <input id="${id}" type="text" placeholder="${ph}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:7px 11px;font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`;
  const TA='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:var(--s-2) 11px;font-size:var(--t-body);font-family:var(--font-body);color:var(--color-text);outline:none;';
  root.innerHTML=`
  <div style="min-height:100vh;background:var(--color-bg);">
    <header style="background:var(--color-accent-900);color:#fff;padding:14px var(--s-6);">
      <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:var(--s-3);">
        <div style="width:34px;height:34px;background:var(--color-accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-card);letter-spacing:.02em;border-radius:0;flex:none;">HT</div>
        <div style="line-height:1.25;min-width:0;">
          <div style="font-family:var(--font-mono);font-weight:var(--w-strong);font-size:var(--t-card);">${i18t('po_shared_for_review',{org:esc(p.org)})}</div>
          <div style="font-size:var(--t-label);color:var(--color-accent-200);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.contract.id)} · shared by ${esc(p.sharedBy)} · ${fmtDT(p.at)}${opts.share&&opts.share.expiresAt?` · link expires ${String(opts.share.expiresAt).slice(0,10)}`:''} · via HaTi</div>
        </div>
      </div>
    </header>
    <div style="max-width:1100px;margin:0 auto;display:grid;gap:22px;padding:28px var(--s-6);align-items:start;" class="portal-grid">
      <div id="pt-main" style="min-width:0">
        ${portalClosedBanner()}
        ${portalRevisedBanner()}
        ${portalRoundBanner(c,p)}
        ${portalCompareBar()}
        ${portalNegoHtml(p)}
        ${portalOpenPointsHtml(c,p)}
        ${''/* THE "TALK IT THROUGH" PANEL IS GONE, on both sides.

               It was a general message box sitting beside a negotiation whose
               whole point is that every exchange attaches to a specific
               fingerprinted change. Two channels for the same conversation is
               how the two drift apart, and the panel was the one that could not
               say WHICH clause anybody meant.

               Removed rather than hidden. The message route it used still
               exists and still carries the per-change threads in the room. */}
        ${portalThreadHtml(c,p)}
        ${portalTemplateFormHtml(c,p)}
        <div id="pt-doc" class="blueprint"${window.docDesignPaperAttr&&window.resolveDocBranding?docDesignPaperAttr(resolveDocBranding(c)):''} style="background:var(--color-doc-surface);box-shadow:var(--shadow-md);border-radius:0;padding:30px 36px;${window.docDesignPaperStyle&&window.resolveDocBranding?docDesignPaperStyle(resolveDocBranding(c)):''}">
          ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c,{bleedX:36,bleedY:30}):''}
          <article class="doc-surface">${window.docStructureBodyHtml&&window.resolveDocBranding?docStructureBodyHtml(resolveDocBranding(c),readOnlyDocHtml(docBody(c))):readOnlyDocHtml(docBody(c))}</article>
          ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
        </div>
        <!-- Rewriting a contract used to happen in a twelve-row box inside the
             360px column on the right. It happens here now, at the size of the
             document it replaces. -->
        ${signingSeat ? '' : `
        <div id="portal-redline" class="hidden" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;box-shadow:var(--shadow-md);overflow:hidden">
          <div style="padding:var(--s-4) 22px;border-bottom:1px solid var(--color-divider);display:flex;align-items:flex-start;gap:var(--s-3);background:var(--color-bg)">
            <span style="flex:1;min-width:0">
              <span style="display:block;font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;">${i18t('po_propose_your_edits')}</span>
              <span style="display:block;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5;margin-top:3px;">Change the clauses you want to change. ${esc(p.org)} sees your edits as a tracked redline — additions and deletions highlighted — and can accept or reject each one on its own. The document's headings, numbering and layout are kept; you are editing the words, not the formatting.</span>
            </span>
            <button id="pt-redline-cancel" class="ui-btn" style="flex:none;font-size:var(--t-meta);padding:7px 14px">${i18t('act_cancel')}</button>
          </div>
          <div id="pt-clause-editor" class="scroll-thin" style="padding:18px 22px;max-height:min(62vh,620px);overflow-y:auto;background:var(--color-doc-surface)"></div>
          <div id="portal-plain" class="hidden">
            <textarea id="pt-redline-text" class="scroll-thin" spellcheck="false" style="display:block;width:100%;height:min(62vh,620px);border:0;outline:none;resize:vertical;padding:26px var(--s-8);font:inherit;font-size:var(--t-card);line-height:1.95;color:var(--color-doc-text);background:var(--color-doc-surface);"></textarea>
          </div>
          <div style="padding:14px 22px;border-top:1px solid var(--color-divider);display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--color-bg)">
            <span id="pt-redline-count" style="font-size:var(--t-meta);color:var(--color-neutral-600)">${i18t('po_name_from_panel')}</span>
            <button id="pt-plain-toggle" style="border:0;background:none;padding:0;font:inherit;font-size:var(--t-meta);color:var(--accent-ink-700);cursor:pointer;text-decoration:underline">${i18t('po_edit_whole_doc')}</button>
            <span style="flex:1"></span>
            <button id="pt-redline-submit" class="ui-btn ui-btn-primary" style="font-size:var(--t-body);padding:10px 20px">${i18t('po_submit_edits')}</button>
          </div>
        </div>
        `}
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;box-shadow:var(--shadow-sm);padding:18px;" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;color:var(--color-text);margin:0 0 var(--s-1);">${i18t('po_respond_to',{org:esc(p.org)})}</h2>
        ${''/* The sender's covering note was reproduced here too, headed
                "Message from <name>". Gone with the other three drawings of it
                (13 Aug 2026) — it is in their inbox, under that same heading.
                portalChangeSummaryHtml went with it: the "What changed" panel
                wore a different title but was filled from the sender's own
                textarea in the share dialog, so leaving it would have meant
                the note was still on their screen. */}
        ${opts.responded?`<div style="margin-bottom:14px;border-radius:0;background:var(--st-steel-bg);border:1px solid var(--color-divider);padding:9px 11px;font-size:var(--t-label);color:var(--st-steel-fg);display:flex;align-items:center;gap:6px;">${icon('check2','w-3.5 h-3.5')} A response was already submitted for this link.</div>`:''}
        <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5;">${opts.token?`Your response is delivered to ${esc(p.sharedBy)} automatically — nothing to send back.`:`Your response is packaged as a secure code — send it back to ${esc(p.sharedBy)} to record it on the contract.`}</p>
        ${input('pt-name','Full name *','e.g. Grace Njeri')}
        ${input('pt-title','Title / role','e.g. Legal Counsel')}
        ${input('pt-email','Work email','you@company.co.ke')}
        <label style="display:block;margin-bottom:var(--s-3);"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-700);margin-bottom:var(--s-1);font-family:var(--font-mono);letter-spacing:.02em;">${i18t('po_comment')}</span>
        <textarea id="pt-comment" rows="3" placeholder="${i18t('po_optional_for_signing')}" style="${TA}"></textarea></label>
        ${''/* ---- "PROPOSE A DIFFERENT VALUE" IS GONE (removed 2026-08-11, on
               request, for every contract) ----
               It sat at the top level of this panel, between the reader's own
               details and the Sign button, so it read as part of signing. It
               never was: portalRespond only ever looked at it on the `changes`
               route, which lives behind "Not ready to sign?", and a figure
               typed here before pressing Sign was silently discarded.

               It was also the wrong shape for the job. A price is agreed in
               the wording — the value clause is a clause like any other, and
               changing it through the redline gives it a fingerprint, a round
               and a decision. This box changed a NUMBER ON THE RECORD beside a
               document that still said something else.

               THE READING SIDE STAYS. A round already stored with a
               proposedValue still shows it, and "Accept & apply value" still
               works on those — history is not rewritten because the way of
               making more of it was closed. */}
        ${''/* ONE ACT, THEN THE OTHERS BEHIND A DOOR.

               Five buttons used to sit here as equals: Approve & sign, Accept
               the wording (without signing), Propose edits (redline), Request
               changes, Decline. Three of them overlap in a first-time reader's
               head — "request changes" and "propose edits" are the same
               sentence in English — and every one of them was named after what
               the SYSTEM does rather than what the PERSON does. A procurement
               manager who signs forty contracts a year can work it out. A
               caterer opening her first one cannot, and this is the screen
               where getting it wrong is most expensive.

               The link already knows what it is for (see the purpose picker on
               the sender's side), and on a signing link the answer is: sign.
               So that is the button. The other four keep their ids, their
               handlers and their behaviour — they move behind one line of
               plain English, and each is relabelled to describe the act rather
               than the mechanism. */}
        ${''/* ---- FOR REVIEW ONLY, SAID BEFORE THE BUTTON RATHER THAN AFTER ----
               Nobody on the sender's side has named who signs, so nothing here
               can be signed (see signingRouteOpen; the server is the wall).

               THE BUTTON STAYS AND STILL REFUSES IN WORDS. That is what the
               owner asked for — "when you click the sign feature, the error
               appears that this contract is for review only" — and it is the
               right shape anyway: a reader who came here to sign needs to be
               TOLD, and a button that has quietly vanished tells them nothing.
               What this notice adds is that they learn it before typing their
               name and their title into three boxes.

               It says what still works, because almost everything does. "You
               cannot sign" on its own reads as a broken page; "you cannot sign,
               and here is everything you can do" reads as a stage of a
               negotiation, which is what it is. */}
        ${(p&&p.signingOpen===false)?`<div style="margin:0 0 var(--s-3);border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:0;padding:10px var(--s-3);">
          <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-meta);font-weight:var(--w-title);color:var(--st-amber-fg);margin-bottom:5px">${icon('alert','w-3.5 h-3.5')} ${i18t('po_review_only')}</div>
          <p style="margin:0;font-size:var(--t-meta);line-height:1.55;color:var(--st-amber-fg)">${esc(i18t('po_no_signers_yet',{org:(p&&p.org)||'the sender'}))}</p>
        </div>`:''}
        <div style="display:flex;flex-direction:column;gap:var(--s-2);">
          <button id="pt-sign" class="ui-btn ui-btn-primary" style="width:100%;padding:11px;font-size:var(--t-card);">${icon('finger','w-4 h-4')} ${i18t('po_sign_this_contract')}</button>
          <button id="pt-other-toggle" aria-expanded="false" aria-controls="pt-other"
            style="width:100%;background:none;border:0;padding:6px 0;font:inherit;font-size:var(--t-meta);color:var(--accent-ink-700);cursor:pointer;text-align:center;text-decoration:underline">${i18t('po_not_ready_sign')}</button>
          <div id="pt-other" class="hidden" style="display:flex;flex-direction:column;gap:9px;border-top:1px solid var(--color-divider);padding-top:11px">
            ${''/* ---- A BUTTON THAT OPENS NOTHING IS WORSE THAN NO BUTTON ----
                   "Change the wording yourself" opens #portal-redline, and W6
                   deliberately stops that editor being built on a link the
                   sender ISSUED for signature — a signing link states the
                   wording is final, and f113 pins that it carries no redline
                   surface. The button was left behind when the panel went, so
                   on every signing link it threw on a null element and did
                   nothing at all: the one control a reader presses when they
                   want changes, silently broken, on the screen where being
                   stuck is most expensive.

                   It is drawn where it works and not where it does not, and the
                   route that IS open says what happens next — which is the
                   owner's own process: they tell us, we send them a negotiation
                   link, they redline on that. */}
            ${[...(signingSeat ? [] : [['pt-redline','history','Change the wording yourself',
                 'Edit the clauses you want changed. They see exactly what you altered and accept or reject each one.']]),
               ['pt-changes','alert','Tell them what you want changed',
                 signingSeat
                   ? `Describe it in the comment box above. This link was sent to you for signature, so the wording cannot be edited on it — ${esc((p&&p.org)||'the sender')} will send you a link you can redline on.`
                   : 'Describe it in the comment box above. The wording stays as it is for now.'],
               ['pt-accept','check2','Agree to the wording — but don’t sign yet','Tells them you are happy with the text. Nothing is signed and nothing is binding.']]
              .map(([id,ic,label,why])=>`<div>
                <button id="${id}" class="ui-btn" style="width:100%;padding:9px;font-size:var(--t-body);text-align:left;display:flex;align-items:center;gap:7px">${icon(ic,'w-3.5 h-3.5')} ${label}</button>
                <span style="display:block;font-size:var(--t-label);line-height:1.5;color:var(--color-neutral-600);margin:var(--s-1) 2px 0">${why}</span>
              </div>`).join('')}
            <div style="border-top:1px solid var(--color-divider);padding-top:9px">
              <button id="pt-decline" class="ui-btn" style="width:100%;padding:9px;font-size:var(--t-body);color:var(--st-ruby-dot);border-color:color-mix(in srgb,var(--st-ruby-dot) 40%,transparent);">${i18t('po_decline_contract')}</button>
              <span style="display:block;font-size:var(--t-label);line-height:1.5;color:var(--color-neutral-600);margin:var(--s-1) 2px 0">${i18t('po_ends_the_deal')}</span>
            </div>
          </div>
        </div>
        <div id="portal-result" style="margin-top:var(--s-4);"></div>
      </aside>
    </div>
  </div>
  <style>.portal-grid{grid-template-columns:1fr;}@media(min-width:1024px){.portal-grid{grid-template-columns:1fr 360px;}.portal-aside{position:sticky;top:24px;}}</style>`;
  /* The door to the other four. It opens in place and stays open — somebody who
     has decided they are not signing today should not have to find it twice. */
  document.getElementById('pt-other-toggle')?.addEventListener('click',e=>{
    const box=document.getElementById('pt-other');
    const open=box.classList.toggle('hidden')===false;
    e.currentTarget.setAttribute('aria-expanded',open?'true':'false');
    e.currentTarget.textContent=open?'Hide the other options':'Not ready to sign?';
  });
  document.getElementById('pt-sign').addEventListener('click',()=>portalRespond(p,'sign'));
  document.getElementById('pt-changes').addEventListener('click',()=>portalRespond(p,'changes'));
  document.getElementById('pt-accept').addEventListener('click',()=>portalRespond(p,'accept'));
  portalWireRevisedBanner(p);
  document.getElementById('pt-compare')?.addEventListener('click',()=>openPortalVersionCompare(p));
  document.getElementById('pt-hist')?.addEventListener('click',()=>openPortalHistory(p));
  /* ---- TWO DOORS, DIFFERENT WORDS, ONE FUNCTION ----
     "Negotiation history" sits in the reading bar, where a reader looks for the
     record whatever state the deal is in. "Review what changed" sits inside the
     green banner that has just told them how many changes were settled and how,
     and it answers the question that sentence raises. Both are kept — each is
     worded from where it stands — and both call openPortalHistory, so there is
     one screen and one refusal (a missing timeline module says so in a toast,
     rather than doing nothing). */
  document.getElementById('pt-nego-open')?.addEventListener('click',()=>openPortalHistory(p));
  // the shared Negotiation component, rendered for this side
  wirePortalNego(portalNegoContract(p), p);
  wirePortalTemplateForm(p);
  if(portalReadOnly()){
    for(const b of portalActionButtons()){ b.disabled=true; b.style.opacity='.4'; b.style.cursor='default'; }
    const rl=document.getElementById('pt-redline-text'); if(rl) rl.readOnly=true;
  }
  document.getElementById('pt-decline').addEventListener('click',()=>portalRespond(p,'decline'));
  // E2: the redline editor takes over the main column, so the document being
  // rewritten and the box you rewrite it in are the same size.
  /* HOW MANY CLAUSES THEY HAVE REWRITTEN AND NOT SENT. */
  const stagedEdits=()=>Object.keys(PORTAL_CLAUSE_EDITS).length;
  /* THE EDITOR DOES NOT EAT WORK ON THE WAY IN.

     This reset PORTAL_CLAUSE_EDITS on every open, unconditionally. The editor
     is not a modal — it is a panel that hides the document and is hidden by the
     same button that shows it, and the room's "Propose a change" clicks that
     button too. So the ordinary path through a negotiation destroyed the work:
     rewrite four clauses, press "Review what changed" to check them against the
     other side's asks, come back, and all four were gone. Nothing asked, nothing
     warned, and the panel reopened looking like the document had never been
     touched — which reads as the edits having been sent rather than binned.

     Opening now keeps whatever is staged. The reset belongs to the two moments
     that genuinely end a draft: it was sent (portalRespond clears it), or its
     author said to throw it away — which is asked for below rather than
     assumed. */
  const showRedline=(on,opts={})=>{
    document.getElementById('portal-redline').classList.toggle('hidden',!on);
    document.getElementById('pt-doc').classList.toggle('hidden',on);
    if(opts.fresh){ PORTAL_CLAUSE_EDITS={}; PORTAL_CLAUSE_NOTES={}; }
    if(on) wirePortalClauseEditor(c, p);
    try{ document.getElementById('pt-main')?.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){}
  };
  /* The escape hatch. Clause-at-a-time is right for the ordinary case — change
     the payment term, change the delivery window — but a counterparty who
     wants to restructure the document wholesale should not have to fight it. */
  document.getElementById('pt-plain-toggle')?.addEventListener('click',()=>{
    const plain=document.getElementById('portal-plain');
    const clauses=document.getElementById('pt-clause-editor');
    const toPlain=plain.classList.contains('hidden');
    const ta=document.getElementById('pt-redline-text');
    if(toPlain){
      // carry whatever they have already changed across, rather than losing it
      ta.value=portalProposedText(c);
      plain.classList.remove('hidden'); clauses.classList.add('hidden');
      const _pt=document.getElementById('pt-plain-toggle'); if(_pt) _pt.textContent='Back to editing clause by clause';
      setTimeout(()=>ta.focus(),120);
    } else {
      plain.classList.add('hidden'); clauses.classList.remove('hidden');
      const _pt=document.getElementById('pt-plain-toggle'); if(_pt) _pt.textContent='Edit the whole document instead';
    }
  });
  document.getElementById('pt-redline')?.addEventListener('click',()=>{
    /* Belt as well as braces: the button is no longer drawn where the panel is
       not built, and if a fourth route ever draws it anyway this refuses in
       words rather than throwing on a null and looking like a dead product. */
    const panel=document.getElementById('portal-redline');
    if(!panel){ toast('This link was sent to you for signature — ask '
      +((p&&p.org)||'the sender')+' for a link you can propose wording on.','err'); return; }
    showRedline(panel.classList.contains('hidden'));
  });
  /* CANCEL IS A DISCARD, so it says so and asks first — but only when there is
     something to lose. Closing an editor nobody typed into is not a decision
     worth a dialog. */
  document.getElementById('pt-redline-cancel')?.addEventListener('click',async()=>{
    const n=stagedEdits();
    if(!n){ showRedline(false); return; }
    let ok=true;
    if(typeof window.confirmDialog==='function'){
      ok=await window.confirmDialog({ title:`Discard ${n} rewritten clause${n===1?'':'s'}?`,
        message:`You have rewritten ${n} clause${n===1?'':'s'} and not sent ${n===1?'it':'them'} yet. Discarding throws the wording away; closing the editor instead keeps it here until you send it.`,
        confirmLabel:'Discard them', cancelLabel:'Keep editing', danger:true });
    }
    if(!ok) return;
    showRedline(false,{ fresh:true });
  });
  document.getElementById('pt-redline-submit')?.addEventListener('click',()=>portalRespond(p,'redline'));
  // prefill the recipient's details from the share (they can still edit them)
  const setIf=(id,v)=>{ const el=document.getElementById(id); if(el&&v&&!el.value) el.value=v; };
  if(opts.share){
    setIf('pt-name',opts.share.recipientName); setIf('pt-email',opts.share.recipientEmail);
  }
  /* ---- AND THE NAME THIS BROWSER ALREADY GAVE ----
     Under the share's own name, never over it: the sender addressed this to
     somebody, and that is who it is for. Below that, a reader who has typed
     their name here before does not get asked again on every refresh — which
     is what a page you work through a round of changes on has to stop doing.
     The other box, #nego-cp-name in the room, is seeded and kept by
     negoNameFieldHtml; this is the same fact on the page underneath it. */
  if(window.negoRememberedName) setIf('pt-name', negoRememberedName());
  /* Keeping what is typed is negoWireNameMemory's job — one delegated
     listener covering this box and the room's, so the two cannot disagree
     about what was remembered. */
  if(window.negoWireNameMemory) negoWireNameMemory();
}
async function portalRespond(p, action, extra){
  /* THE SAME REFUSAL THE SERVER MAKES, one layer earlier — the wall is on the
     server (POST /api/shares/:token/respond), and this is here so a reader who
     somehow reaches a signing control on a review link is told why in words
     rather than watching a request fail. A negotiate link is the room, not the
     signature; the sender said so when they made it. */
  if(action==='sign' && p && p.purpose==='negotiate'){
    toast(i18t('po_review_link_no_sign'),'err');
    return;
  }
  /* AND THE SAME FOR A CONTRACT NOBODY HAS BEEN NAMED TO SIGN. The wall is the
     server's (see the respond route); this is the sentence, said before the
     request rather than after it. Only an explicit false refuses: a payload
     built before this field existed carries nothing, and guessing on their
     behalf would refuse signatures the sender fully intended. */
  if(action==='sign' && p && p.signingOpen===false){
    toast(i18t('po_no_signers_toast',{org:(p&&p.org)||'the sender'}),'err');
    return;
  }
  const name=await portalEnsureResponderName(), title=fval('pt-title'), email=fval('pt-email');
  /* The comment box lives on the respond panel, which is on the page
     UNDERNEATH the full-window room — the same trap that made the name check
     unpassable. Declining requires a reason, so a decline pressed in the room
     failed on a box nobody could reach. The room asks for it and passes it in
     here, and everything reached from the panel still reads the panel. */
  const comment=(extra&&extra.comment!=null)?String(extra.comment):fval('pt-comment');
  if(!name){
    /* They were ASKED and said no — portalEnsureResponderName put the question
       in front of them rather than pointing at a box somewhere on the page,
       which is what this used to do and what stopped being possible when the
       box left the header. Nothing to focus, so nothing is claimed about it. */
    toast(i18t('po_enter_full_name'),'err');
    return;
  }
  /* Decisions on the other side's fingerprinted changes. This is not a change
     request and not an acceptance of the whole document — it is an answer to
     each specific ask, which is the unit the Negotiation tab works in. It rides
     the same response route as everything else, so the server, the import path
     and every existing test see the shape they already saw. */
  if(action==='decisions' || action==='ready'){
    const decisions=Object.keys(PORTAL_NEGO_DECISIONS)
      .map(id=>({ id, status:PORTAL_NEGO_DECISIONS[id].status, reply:PORTAL_NEGO_DECISIONS[id].reply||null }));
    const withdrawn=Object.keys(PORTAL_NEGO_WITHDRAWN);
    /* Wording they have asked for, travelling with the decisions. Sent as a
       DRAFT rather than as a finished change: the owner's copy re-files each
       one through negoFileChange, so the fingerprint and its place in the chain
       are minted on the record rather than trusted from a no-login page. */
    /* ---- THE REASON TRAVELS, AND IT DID NOT ----
       This hand-picks the fields that cross, and `why` was not among them. The
       workbench on this page asks the reader "why?" in a two-step save, files
       it on the change, holds it here by value in PORTAL_NEGO_PROPOSED — and
       then dropped it at the moment of sending. So a counterparty explained
       every ask, pressed Send, and the owner's cards arrived bare: the reason
       was collected on a public page and thrown away one line before the wire.
       `note` stays too — it is provenance and is a different thing. */
    const proposed=Object.keys(PORTAL_NEGO_PROPOSED).map(id=>{
      const x=PORTAL_NEGO_PROPOSED[id];
      return { id, clauseId:x.clauseId, changeType:x.changeType||'modify',
        oldText:x.oldText||'', newText:x.newText||'', bodyHtml:x.bodyHtml||null,
        headingText:x.headingText||null, afterClauseId:x.afterClauseId||null,
        clauseLabel:x.clauseLabel||null, why:x.why||null, note:x.note||null };
    });
    if(action==='decisions' && !decisions.length && !withdrawn.length && !proposed.length){
      toast(i18t('po_nothing_to_send'),'err'); return; }
    /* READINESS AND THE DECISIONS TRAVEL TOGETHER, in one request.

       They used to be two: answer the changes, press Send, then separately say
       you were done. Forgetting the middle step lost the round — the owner got
       a readiness signal about a change set that had not moved, and the reader
       had no way to tell their answers were still sitting in their browser.
       "Did I remember to press Send?" is not a question a negotiation should
       be able to fail on. */
    const res={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action,
      name, title, email, comment, negoDecisions:decisions,
      negoWithdrawn:withdrawn.length?withdrawn:undefined,
      negoProposed:proposed.length?proposed:undefined, at:nowISO() };
    /* NO WAY BACK IS NOT NO ANSWER. This branch used to refuse here — "reply to
       the email you received" — and drop `res` on the floor, so a reader whose
       copy could not reach this server had no way to answer the asks in front
       of them. The signing branch below has always minted a copyable code for
       exactly this state, and the OWNER's import box says in so many words that
       it accepts one. The negotiation half simply never got it.
       Their answers are held on their own page either way (PORTAL_NEGO_*), so
       nothing is cleared here — the code IS the send, and until the owner
       imports it the reader's page should go on showing what they decided. */
    if(!PORTAL_OPTS.token){
      const noWayBack=action==='ready' ? i18t('po_readiness_lower') : i18t('po_answers_lower');
      portalSetDone(action==='ready'
        ? (document.getElementById('pt-nego-ready') ? 'pt-nego-ready' : 'nego-cp-ready')
        : (document.getElementById('nego-send-decisions') ? 'nego-send-decisions' : 'pt-nego-send'),
        i18t('po_code_ready_short'));
      portalOfferResponseCode(p, res, noWayBack);
      return;
    }
    /* Whichever control was actually pressed reports back on itself. The send
       lives in the change index on a negotiation link and in the foot of the
       card on a signing link, so both are offered and the one on the page
       wins. */
    const pressed=action==='ready'
      ? (document.getElementById('pt-nego-ready') ? 'pt-nego-ready' : 'nego-cp-ready')
      : (document.getElementById('nego-send-decisions') ? 'nego-send-decisions' : 'pt-nego-send');
    portalSetBusy(pressed, i18t('po_sending'));
    try{
      /* THE RESPONSE IS THE BODY, as it is for every other action on this
         route — the server reads req.body.kind directly. This one call wrapped
         it as { response: … }, so even once the action whitelist accepted
         'decisions' the server saw a body with no `kind` and answered 400
         Invalid response. Two bugs in one line, and the second was hidden
         behind the first. */
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',res);
      /* Remembered, not discarded — see PORTAL_NEGO_SENT. */
      for(const d of decisions) PORTAL_NEGO_SENT[d.id]={ status:d.status, reply:d.reply||null };
      for(const id of withdrawn) PORTAL_NEGO_WITHDRAWN_SENT[id]=true;
      for(const pr of proposed) PORTAL_NEGO_PROPOSED_SENT[pr.id]={ ...PORTAL_NEGO_PROPOSED[pr.id] };
      PORTAL_NEGO_DECISIONS={}; PORTAL_NEGO_WITHDRAWN={}; PORTAL_NEGO_PROPOSED={};
      portalDropHeld();                        // it has gone; it is not a draft any more
      if(action==='ready') PORTAL_READY_SENT=true;
      const n=decisions.length, np=proposed.length;
      /* What actually went, named. "2 decisions sent" was the only sentence
         this could produce, so a reader who had sent nothing but their own
         proposed wording was told a number that did not describe it. */
      const sentBits=[];
      if(np) sentBits.push(i18tn('po_n_proposals',np,{n:np}));
      if(n) sentBits.push(i18tn('po_n_decisions',n,{n}));
      const sentWhat=sentBits.join(` ${i18t('po_and')} `)||i18t('po_your_answer');
      /* ---- 'ok', NOT A BARE CALL (15 Aug 2026, OI-10) ----
         These two confirm an act that has LEFT THIS PAGE and reached the other
         company, which is the test for whether a toast is owed: it travels and
         it cannot be taken back. Bare, they were silent — and the reader had
         just pressed Send on a batch, watched the cards clear and been told
         nothing, which reads as a button that did not work. Reported as exactly
         that. The button's own label changes too (portalSetDone), but a label
         on the control you pressed is not a confirmation you notice. */
      if(action==='ready'){
        portalSetDone(pressed,i18t('po_ready_done'));
        toast(i18t('po_ready_toast',{ org:p.org||i18t('po_the_sender_generic'),
          extra:sentBits.length?i18t('po_ready_toast_extra',{what:sentWhat}):'' }),'ok');
      } else {
        portalSetDone(pressed,i18t('po_answer_done',{what:sentWhat}));
        toast(i18t('po_answer_toast',{what:sentWhat,org:p.org||i18t('po_the_sender_generic')}),'ok');
      }
      /* Repaint, so the room shows the decisions as sent rather than still
         waiting to be. The room is their page — there is nowhere else for the
         outcome to appear. */
      wirePortalNego(portalNegoContract(p), p);   // repaint the workbench with the fresh record
    }catch(e){
      portalSetIdle();
      toast(e.message||(action==='ready'?'Could not send':'Could not send your decisions'),'err');
    }
    return;
  }
  if(action==='sign' && !email){ toast(i18t('po_work_email_required'),'err'); return; }
  /* A template contract signs only over a complete, valid form — the same
     gate the owner's screen applies, refused here before the signature pad
     opens rather than after the server bounces it. */
  if(action==='sign' && portalTemplateForm(p) && window.templateFormProblems){
    const probs=templateFormProblems(portalTemplateForm(p));
    if(probs.length){
      toast(`Not signed yet — ${probs.length} field${probs.length===1?' needs':'s need'} filling first: ${probs.slice(0,3).map(x=>x.label).join(', ')}${probs.length>3?'…':''}`,'err');
      return;
    }
  }
  if(action==='changes' && !comment){ toast(i18t('po_add_comment_explaining'),'err'); return; }
  if(action==='decline' && !comment){ toast(i18t('po_add_comment_explaining'),'err'); return; }
  // Capture the counterparty's signature mark (free choice: draw / type / upload).
  let sig=null;
  if(action==='sign' && typeof openSignaturePad==='function'){
    sig=await openSignaturePad({ name });
    if(!sig) return;   // signer cancelled the pad
  }
  /* Server-backed signing normally verifies the signer's email with a one-time
     code. Where the server has no mail provider the code cannot reach them, so
     they sign without it — and the page says so before they do, rather than
     leaving them to discover it as a failure. */
  if(action==='sign' && PORTAL_OPTS.token){
    if(PORTAL_OPTS.emailConfigured===false) return portalSignUnverified(p, {name,title,email,comment,sig});
    return portalStartOtp(p, {name,title,email,comment,sig});
  }
  // E2: a redline is a change request carrying proposed edited text + its base.
  let proposedText=null, baseText=null, sendAction=action;
  if(action==='redline'){
    // whichever surface they used — clause by clause, or the whole document
    const cRec=migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'});
    proposedText=String(portalProposedText(cRec)||'').trim();
    if(!proposedText){ toast(i18t('po_edit_before_submit'),'err'); return; }
    const beforeText=String(portalCurrentText()||docPlainText(cRec)||'').trim();
    if(proposedText===beforeText){ toast(i18t('po_press_change_first'),'err'); return; }
    // the base must be the same TEXT the counterparty edited, not the markup
    // behind it, or the returned redline diffs against tags
    baseText=p.contract.redlineText
      ? ((window.isRich&&isRich(p.contract.format)) ? richToText(p.contract.redlineText) : p.contract.redlineText)
      : normText(freezeContractHtml(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'})));
    sendAction='changes';
  }
  /* The field this read is gone (see the note where it was drawn), so this is
     always ''. Kept as a named constant rather than deleted from the response
     shape: the payload's `proposedValue` is read by the owner's round card and
     by versioning's accept-and-apply, and a key that stops being sent is a
     harder change to reason about than one that is reliably null. */
  const proposedValue = '';
  const clauseNotes = (action==='redline')
    ? portalClauseNotes(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'}))
    : null;
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:sendAction, name, title, email, comment,
    proposedValue: proposedValue||null, proposedText, baseText, at:nowISO(),
    templateValues:portalTemplateValues(p),
    clauseNotes: (clauseNotes&&clauseNotes.length)?clauseNotes:null,
    signatureForm:sig?sig.form:null, signatureImage:sig?sig.image:null, signatureImageHash:sig?sig.imageHash:null,
    signatureTypedName:sig?sig.typedName:null, signatureFont:sig?sig.font:null };
  const label={sign:i18t('po_lab_signature'),accept:i18t('po_lab_acceptance'),
    changes:i18t('po_lab_change_request'),decline:i18t('po_lab_decline_notice')}[sendAction];
  // Which control the reader actually pressed, so it is the one that reports back.
  const pressed={sign:'pt-sign',accept:'pt-accept',redline:'pt-redline-submit',
    changes:'pt-changes',decline:'pt-decline'}[action] || null;
  const doneLabel={sign:i18t('po_done_signed_sent'),accept:i18t('po_done_acceptance_sent'),
    changes:i18t('po_done_changes_sent'),decline:i18t('po_done_decline_sent')}[sendAction]||i18t('po_done_sent');
  if(PORTAL_OPTS.token){
    portalSetBusy(pressed,i18t('po_sending'));
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      portalSetDone(pressed, doneLabel);
      /* SENT IS THE MOMENT THE DRAFT STOPS BEING A DRAFT. Cleared here, and
         only here, because the editor no longer wipes itself on open — see
         showRedline. Cleared on failure would be worse than the bug it
         replaced: nothing was recorded, and their wording would be gone. */
      if(action==='redline'){ PORTAL_CLAUSE_EDITS={}; PORTAL_CLAUSE_NOTES={}; }
      document.getElementById('portal-result').innerHTML=`
        <div style="border:1px solid color-mix(in srgb,var(--st-green-dot) 30%,transparent);background:var(--st-green-bg);border-radius:0;padding:var(--s-4);text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:var(--st-green-fg);font-size:var(--t-body);font-weight:var(--w-strong);margin-bottom:var(--s-1);">${icon('check2','w-4 h-4')} ${i18t('po_delivered',{what:label[0].toUpperCase()+label.slice(1)})}</div>
          <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0;">${i18t('po_notified_done',{who:esc(p.sharedBy),org:esc(p.org)})}</p>
        </div>`;
    }catch(e){
      // Nothing was recorded, so the controls come back — a spent-looking
      // button on a failed send is worse than no feedback at all.
      portalSetIdle();
      toast(e.message,'err');
      const box=document.getElementById('portal-result');
      if(box) box.innerHTML=`<div style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:0;padding:var(--s-3) 14px;font-size:var(--t-meta);line-height:1.55;color:var(--st-ruby-fg)"><b>${i18t('po_not_sent')}</b> ${esc(e.message||i18t('po_something_went_wrong'))}</div>`;
    }
    return;
  }
  portalSetDone(pressed, doneLabel);
  portalOfferResponseCode(p, response, label);
}
/* ---------- THE RESPONSE CODE — ONE BUILDER, TWO SCREENS ----------
   A share link that cannot reach this server still has to be answerable, and
   the code is how: the reader copies it, sends it back by email or WhatsApp,
   and the owner pastes it into "Import their Word file". The owner's box says
   so in those words.

   IT WAS BUILT FOR ONE OF THE TWO SCREENS. The signing screen minted a code
   whenever there was no token; the NEGOTIATION screen — answering each of the
   other side's asks — refused instead, with "This copy has no channel back —
   reply to the email you received", and threw the fully-built response away.
   So a counterparty could sign a contract with no route home, but could not
   say "yes to clause 3, no to clause 7", which is the commoner act and the one
   a negotiation link exists for. Meanwhile the owner's import box went on
   offering to receive a code that half the product could not produce.

   ONE BUILDER, and the SLOT is what differs, because the two screens are
   genuinely different shapes: the signing screen has a result column and fills
   it (unchanged, to the pixel); the negotiation workbench has no such slot —
   it is a document and a change column — so the code arrives in a dialog of its
   own. That is the same answer openDerivedLinkDialog gives for the same reason,
   and for the same reason it is NOT dismissable by a backdrop click: this is
   the one showing, and losing it loses the reader's answers. */
function portalOfferResponseCode(p, response, label){
  const code=b64e(response);
  const who=esc((p&&p.sharedBy)||i18t('po_the_sender'));
  const org=esc((p&&p.org)||'');
  const slot=document.getElementById('portal-result');
  const head=i18t('po_your_x_ready',{what:label});
  const lead=i18t('po_code_send_back',{who,org});
  if(slot){
    slot.innerHTML=`
      <div style="border:1px solid var(--color-divider);background:var(--st-steel-bg);border-radius:0;padding:13px;">
        <div style="display:flex;align-items:center;gap:6px;color:var(--accent-ink);font-size:var(--t-meta);font-weight:var(--w-strong);margin-bottom:6px;">${icon('check2','w-3.5 h-3.5')} ${head}</div>
        <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0 0 var(--s-2);line-height:1.5;">${lead}</p>
        <textarea id="pt-code" readonly rows="4" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:10px;font-size:var(--t-label);font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all;">${code}</textarea>
        <button id="pt-copy" class="ui-btn ui-btn-primary" style="margin-top:var(--s-2);width:100%;padding:var(--s-2);font-size:var(--t-meta);">${icon('copy','w-3 h-3')} ${i18t('po_copy_response_code')}</button>
      </div>`;
    document.getElementById('pt-copy').addEventListener('click',async()=>{
      const ta=document.getElementById('pt-code'); ta.select();
      try{ await navigator.clipboard.writeText(ta.value); }catch(e){ document.execCommand('copy'); }
      toast(i18t('po_response_code_copied'),'ok');
    });
    return code;
  }
  const ov=document.createElement('div');
  ov.id='pt-code-dialog';
  ov.style.cssText='position:fixed;inset:0;z-index:94;display:grid;place-items:center;padding:var(--s-4)';
  ov.innerHTML=`
    <div style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
    <div class="modal-in" role="dialog" aria-modal="true" aria-labelledby="pt-code-t"
      style="position:relative;width:100%;max-width:33rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:0;padding:22px var(--s-6)">
      <h3 id="pt-code-t" style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-section);margin:0 0 var(--s-1);line-height:1.3">${head}</h3>
      <p style="font-size:var(--t-body);color:var(--color-neutral-700);line-height:1.55;margin:0 0 var(--s-3)">${lead}</p>
      <textarea id="pt-code" readonly rows="5" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;padding:10px;font-size:var(--t-label);font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all;">${code}</textarea>
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.55;margin:10px 0 var(--s-4)">${i18t('po_code_only_showing')}</p>
      <div style="display:flex;justify-content:flex-end;gap:var(--s-2)">
        <button id="pt-copy" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta);padding:7px 13px">${icon('copy','w-3 h-3')} ${i18t('po_copy_response_code')}</button>
        <button id="pt-code-done" class="ui-btn" style="font-size:var(--t-meta);padding:7px 13px">${i18t('po_done')}</button>
      </div>
    </div>`;
  document.body.appendChild(ov);
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',onKey); };
  function onKey(e){ if(e.key==='Escape') close(); }
  document.addEventListener('keydown',onKey);
  ov.querySelector('#pt-code-done').addEventListener('click',close);
  ov.querySelector('#pt-copy').addEventListener('click',async()=>{
    const ta=ov.querySelector('#pt-code'); ta.select();
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ try{ document.execCommand('copy'); }catch(_){} }
    toast(i18t('po_response_code_copied'),'ok');
  });
  /* Deliberately no backdrop-click close — see the note above. */
  return code;
}
/* Signing where no verification code can be sent. The signature is real and
   binding; what is missing is HaTi's independent check that the signer holds
   that email address. Saying so here, on the record and on the certificate, is
   the difference between a weaker proof and a false one. */
/* ---------- the template form, on the counterparty's page ----------
   A contract created from a library template arrives with its form: blocks,
   field definitions, and the values filled so far. Open fields render as
   typed inputs — validated by the same registry as the owner's screen — and
   every change autosaves to the share (POST template-values), so a
   half-finished form survives a closed tab. Fixed wording has no editor here:
   the only door this page has into the document is the fields. */
function portalTemplateForm(p){ return (p && p.contract && p.contract.templateForm) || null; }
function portalTemplateValues(p){
  const form=portalTemplateForm(p);
  if(!form || !form.values || !Object.keys(form.values).length) return undefined;
  return { ...form.values };
}
function portalTemplateFormHtml(c,p){
  const form=portalTemplateForm(p);
  if(!form) return '';
  const fields=(form.fields||[]).filter(f=>f.fieldType!=='signature_name_title');
  if(!fields.length) return '';
  const values=form.values||{};
  const editable=!portalExecuted()&&!portalReadOnly();
  const INP='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
  const required=fields.filter(f=>f.required);
  const filled=required.filter(f=>String(values[f.fieldKey]||'').trim()!=='');
  const inputFor=(f,idx)=>{
    const lib=(window.FIELD_LIB||{})[f.fieldType]||{input:'text',hint:''};
    const v=values[f.fieldKey]==null?'':String(values[f.fieldKey]);
    if(f.control==='guided'||f.fieldType==='select'){
      const opts=(f.options||[]).map(o=>`<option value="${esc(o)}"${v===o?' selected':''}>${esc(o)}</option>`).join('');
      return `<select data-ptf="${idx}" style="${INP}" ${editable?'':'disabled'}><option value="">${i18t('po_choose')}</option>${opts}</select>`;
    }
    if(lib.input==='textarea') return `<textarea data-ptf="${idx}" style="${INP};min-height:48px;resize:vertical" placeholder="${esc(lib.hint)}" ${editable?'':'disabled'}>${esc(v)}</textarea>`;
    if(lib.input==='file'||lib.input==='image')
      return `<div style="display:flex;align-items:center;gap:var(--s-2)">${v?`<span class="badge" style="background:var(--color-neutral-100);color:var(--color-neutral-700)">attached</span>`:''}<input type="file" data-ptf-file="${idx}" accept="${lib.input==='image'?'image/png,image/jpeg,image/webp':'*/*'}" style="font-size:var(--t-label)" ${editable?'':'disabled'}></div>`;
    const type={email:'email',tel:'tel',date:'date'}[lib.input]||'text';
    return `<input type="${type}" data-ptf="${idx}" value="${esc(v)}" placeholder="${esc(lib.hint)}" style="${INP}" ${editable?'':'disabled'}>`;
  };
  const groups=[];
  for(const f of fields){
    const name=f.section||'';
    let g=groups.find(x=>x.name===name);
    if(!g){ g={name,fields:[]}; groups.push(g); }
    g.fields.push(f);
  }
  return `
  <div id="pt-tplform" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;box-shadow:var(--shadow-sm);margin-bottom:18px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:var(--s-2);padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)">
      <span style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:var(--t-body);flex:1">${i18t('po_fill_details')}</span>
      <span style="font-size:var(--t-label);color:${filled.length===required.length?'var(--st-green-fg)':'var(--st-amber-fg)'};font-weight:var(--w-strong)">${filled.length}/${required.length} required</span>
      <span id="pt-tplform-state" style="font-size:var(--t-label);color:var(--color-neutral-500)"></span>
    </div>
    <div style="padding:var(--s-3) var(--s-4);display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
      ${groups.map(g=>`
        ${g.name?`<div style="grid-column:1/-1;font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(g.name)}</div>`:''}
        ${g.fields.map(f=>{
          const idx=form.fields.indexOf(f);
          return `<label style="display:block;min-width:0">
            <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:3px">${esc(f.label||f.fieldKey)}${f.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}</span>
            ${inputFor(f,idx)}
            ${f.helpText?`<span style="display:block;font-size:var(--t-label);color:var(--color-neutral-500);margin-top:2px">${esc(f.helpText)}</span>`:''}
            <span data-ptf-err="${idx}" style="display:none;font-size:var(--t-label);color:var(--st-ruby-fg);margin-top:2px"></span>
          </label>`; }).join('')}`).join('')}
    </div>
  </div>`;
}
function wirePortalTemplateForm(p){
  const box=document.getElementById('pt-tplform');
  if(!box) return;
  const form=portalTemplateForm(p);
  const stateEl=()=>document.getElementById('pt-tplform-state');
  const commit=async(idx,value)=>{
    const f=form.fields[idx]; if(!f) return;
    const s=value==null?'':String(value).trim();
    const err=box.querySelector(`[data-ptf-err="${idx}"]`);
    if(s && window.fieldLibValidate){
      const problem=fieldLibValidate({label:f.label,field_key:f.fieldKey,field_type:f.fieldType,
        control:f.control,options:f.options,required:f.required}, s);
      if(err){ err.textContent=problem||''; err.style.display=problem?'block':'none'; }
      if(problem) return;                    // an invalid value never leaves the input
    } else if(err){ err.style.display='none'; }
    form.values=form.values||{};
    if(s==='') delete form.values[f.fieldKey]; else form.values[f.fieldKey]=s;
    // the document below is the rendering of this form — keep the two in step
    if(window.templateFormDocHtml){
      p.contract.redlineText=templateFormDocHtml(form);
      const doc=document.querySelector('#pt-doc article');
      if(doc && window.readOnlyDocHtml && window.renderDocHtml)
        doc.innerHTML=readOnlyDocHtml(renderDocHtml(p.contract.redlineText, window.RICH_FORMAT||'rich'));
    }
    if(PORTAL_OPTS.token){
      const el=stateEl(); if(el) el.textContent='Saving…';
      try{
        await api('shares/'+PORTAL_OPTS.token+'/template-values','POST',{ values:{ [f.fieldKey]: s } });
        const el2=stateEl(); if(el2) el2.textContent='Saved — closing this tab loses nothing';
      }catch(e){ const el2=stateEl(); if(el2) el2.textContent='Could not save: '+(e.message||''); }
    }
  };
  box.querySelectorAll('[data-ptf]').forEach(el=>
    el.addEventListener('change',()=>commit(Number(el.getAttribute('data-ptf')),el.value)));
  box.querySelectorAll('[data-ptf-file]').forEach(el=>
    el.addEventListener('change',()=>{
      const file=el.files&&el.files[0]; if(!file) return;
      if(file.size>500*1024){ toast(i18t('po_attachments_500kb'),'err'); return; }
      const r=new FileReader();
      r.onload=()=>commit(Number(el.getAttribute('data-ptf-file')),String(r.result));
      r.readAsDataURL(file);
    }));

  /* The grey blanks in the document take clicks too: a typed input opens
     right where the reader is looking, validated and autosaved through the
     same commit as the panel above. Signature blanks route to the Sign
     button; file/stamp blanks route to the panel's file input. */
  const doc=document.getElementById('pt-doc');
  if(doc && !doc._tplWired){
    doc._tplWired=true;
    doc.addEventListener('click', e=>{
      const span=e.target.closest?.('.hati-field[data-field-key]');
      if(!span || portalExecuted() || portalReadOnly()) return;
      const key=span.getAttribute('data-field-key');
      const idx=(form.fields||[]).findIndex(f=>f.fieldKey===key);
      if(idx<0) return;
      const f=form.fields[idx];
      const flashPanel=()=>{
        const input=box.querySelector(`[data-ptf="${idx}"]`)||box.querySelector(`[data-ptf-file="${idx}"]`);
        if(!input) return;
        try{ input.scrollIntoView({block:'center',behavior:'smooth'}); }catch(_){}
        input.style.outline='2px solid var(--accent-solid)'; input.style.outlineOffset='1px';
        setTimeout(()=>{ input.style.outline=''; input.style.outlineOffset=''; },1600);
        try{ input.focus(); }catch(_){}
      };
      if(f.fieldType==='signature_name_title'||f.fieldType==='stamp_image'){
        toast(i18t('po_sigs_on_press_sign'));
        return;
      }
      const lib=(window.FIELD_LIB||{})[f.fieldType]||{input:'text',hint:''};
      if(lib.input==='file'||lib.input==='image'){ flashPanel(); return; }
      // in-place popover, same validation and autosave as the panel
      document.getElementById('ptf-pop')?.remove();
      const r=span.getBoundingClientRect();
      const pop=document.createElement('div');
      pop.id='ptf-pop';
      pop.style.cssText=`position:fixed;z-index:80;top:${Math.round(r.bottom+6)}px;left:${Math.round(Math.min(Math.max(8,r.left),(window.innerWidth||1200)-296))}px;width:284px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;box-shadow:var(--shadow-md);padding:10px var(--s-3)`;
      const INP='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:7px 10px;font:inherit;font-size:var(--t-body);outline:none';
      const v=(form.values||{})[f.fieldKey]==null?'':String(form.values[f.fieldKey]);
      const inputHtml=(f.control==='guided'||f.fieldType==='select')
        ? `<select data-ptf-pop style="${INP}"><option value="">${i18t('po_choose')}</option>${(f.options||[]).map(o=>`<option value="${esc(o)}"${v===o?' selected':''}>${esc(o)}</option>`).join('')}</select>`
        : lib.input==='textarea'
          ? `<textarea data-ptf-pop style="${INP};min-height:52px">${esc(v)}</textarea>`
          : `<input type="${({email:'email',tel:'tel',date:'date'})[lib.input]||'text'}" data-ptf-pop value="${esc(v)}" placeholder="${esc(lib.hint||'')}" style="${INP}">`;
      pop.innerHTML=`
        <div style="font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:5px">${esc(f.label||f.fieldKey)}${f.required?' <span style="color:var(--st-ruby-fg)">*</span>':''}</div>
        ${inputHtml}
        ${f.helpText?`<div style="font-size:var(--t-label);color:var(--color-neutral-500);margin-top:var(--s-1)">${esc(f.helpText)}</div>`:''}
        <div data-ptf-pop-err style="display:none;font-size:var(--t-label);color:var(--st-ruby-fg);margin-top:var(--s-1)"></div>`;
      document.body.appendChild(pop);
      const input=pop.querySelector('[data-ptf-pop]');
      let done=false; // Enter commits, then the focused input's blur fires change — one door only
      const away=ev=>{ if(!pop.contains(ev.target)) closePop(); };
      const closePop=()=>{ done=true; pop.remove(); document.removeEventListener('mousedown',away,true); };
      document.addEventListener('mousedown',away,true);
      const commitPop=()=>{
        if(done) return;
        const val=input?input.value:'';
        const s2=String(val||'').trim();
        if(s2 && window.fieldLibValidate){
          const problem=fieldLibValidate({label:f.label,field_key:f.fieldKey,field_type:f.fieldType,
            control:f.control,options:f.options,required:f.required}, s2);
          if(problem){ const err=pop.querySelector('[data-ptf-pop-err]'); err.textContent=problem; err.style.display='block'; return; }
        }
        closePop();
        commit(idx, val);
        const panel=box.querySelector(`[data-ptf="${idx}"]`);
        if(panel) panel.value=s2;
      };
      input?.addEventListener('change',commitPop);
      input?.addEventListener('keydown',ev=>{ if(ev.key==='Enter') commitPop(); if(ev.key==='Escape') closePop(); });
      try{ input?.focus(); }catch(_){}
    });
  }
}

async function portalSignUnverified(p, info){
  const box=document.getElementById('portal-result');
  box.innerHTML=`
    <div style="border:1px solid var(--st-amber-line);background:var(--st-amber-bg);border-radius:0;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-amber-fg);margin-bottom:5px;">${icon('alert','w-3.5 h-3.5')} Signing without an email check</div>
      <p style="font-size:var(--t-meta);color:var(--st-amber-fg);margin:0 0 10px;line-height:1.55;">${i18t('po_cannot_verify',{email:esc(info.email),how:i18t('po_not_independently_verified')})}</p>
      <button id="pt-unver-go" class="ui-btn ui-btn-primary" style="width:100%;padding:9px;font-size:var(--t-body);">${icon('finger','w-4 h-4')} ${i18t('po_sign_anyway')}</button>
      <button id="pt-unver-cancel" style="margin-top:6px;width:100%;background:none;border:0;font-size:var(--t-label);color:var(--color-neutral-600);cursor:pointer;font-family:var(--font-body);">${i18t('act_cancel')}</button>
    </div>`;
  document.getElementById('pt-unver-cancel').addEventListener('click',()=>{ box.innerHTML=''; portalSetIdle(); });
  document.getElementById('pt-unver-go').addEventListener('click',async()=>{
    const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:'sign',
      name:info.name, title:info.title, email:info.email, comment:info.comment, at:nowISO(),
      templateValues:portalTemplateValues(p),
      signatureForm:info.sig?info.sig.form:null, signatureImage:info.sig?info.sig.image:null,
      signatureImageHash:info.sig?info.sig.imageHash:null,
      signatureTypedName:info.sig?info.sig.typedName:null, signatureFont:info.sig?info.sig.font:null };
    portalSetBusy('pt-sign','Signing…');
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      portalSetDone('pt-sign','Signed and sent');
      portalMarkSigned(p, info);
      box.innerHTML=`
        <div style="border:1px solid color-mix(in srgb,var(--st-green-dot) 30%,transparent);background:var(--st-green-bg);border-radius:0;padding:var(--s-4);text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:var(--st-green-fg);font-size:var(--t-body);font-weight:var(--w-strong);margin-bottom:var(--s-1);">${icon('check2','w-4 h-4')} Signed</div>
          <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0;">Your signature has been delivered to ${esc(p.sharedBy)} at ${esc(p.org)}. It is recorded as not independently verified, because this server cannot send verification codes.</p>
        </div>`;
    }catch(e){ portalSetIdle(); toast(e.message,'err'); box.innerHTML=''; }
  });
}

/* two-step counterparty signing with email one-time code (server mode)

   W8: the code goes to the address the OWNER invited — the server reads it
   off the share record and ignores anything typed on this page. The old copy
   here said "signing with a different address is allowed (e.g. a colleague
   signs)"; that handover is exactly what W8 removes, because a code sent to
   a typed address proves control of A mailbox, not the RIGHT one. A
   colleague who should sign gets their own link on the signing route. */
let _ptLastOtpSend=0;   // L1: resend cooldown
async function portalStartOtp(p, info){
  const box=document.getElementById('portal-result');
  _ptLastOtpSend=Date.now();
  const invited=(PORTAL_OPTS.share&&PORTAL_OPTS.share.recipientEmail)||'';
  box.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--st-steel-bg);border-radius:0;padding:13px;font-size:var(--t-label);color:var(--color-neutral-700);">${i18t('po_sending_code_to')} <strong>${esc(invited||'the address this link was issued to')}</strong>…</div>`;
  let emailSent=true, sentTo=invited, emailWhy='';
  try{
    const r=await api('shares/'+PORTAL_OPTS.token+'/otp','POST',{});
    emailSent=r.emailSent!==false;
    sentTo=r.sentTo||invited;
    /* ---- THE REAL REASON, NOT ALWAYS "NOT CONFIGURED" ----
       The banner below blamed configuration whatever had happened. The route
       answers with mailReportPublic, which distinguishes "no provider on this
       server" from "the provider refused it" — the commonest real failure — and
       that sentence was being thrown away, so a workspace WITH email set up was
       told it had none. */
    emailWhy=r.emailError||'';
  }catch(e){
    /* The one refusal with no way forward on this page: the link records no
       address to verify against. Said in full, with the way out, rather than
       as a toast that scrolls away. */
    box.innerHTML=`<div style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:0;padding:var(--s-3) 14px;font-size:var(--t-meta);line-height:1.55;color:var(--st-ruby-fg)"><b>${i18t('po_cannot_send_code')}</b> ${esc(e.message||'')}</div>`;
    portalSetIdle();
    return;
  }
  box.innerHTML=`
    <div style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:0;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text);margin-bottom:var(--s-1);">${icon('key','w-3.5 h-3.5')} ${i18t('po_verify_to_sign')}</div>
      <p style="font-size:var(--t-label);color:var(--color-neutral-600);margin:0 0 var(--s-2);line-height:1.5;">${i18t('po_sent_code_to',{email:esc(sentTo)})}</p>
      ${(sentTo&&info.email&&sentTo.toLowerCase()!==String(info.email||'').toLowerCase())?`<p style="margin:0 0 var(--s-2);font-size:var(--t-label);border-radius:0;background:color-mix(in srgb,var(--st-amber-dot) 10%,transparent);border:1px solid color-mix(in srgb,var(--st-amber-dot) 30%,transparent);color:var(--st-amber-fg);padding:6px 10px;line-height:1.5;">${i18t('po_code_goes_only_to_full',{email:esc(sentTo)})}</p>`:''}
      ${emailSent?'':`<p style="margin:0 0 var(--s-2);font-size:var(--t-label);border-radius:0;background:color-mix(in srgb,var(--st-amber-dot) 10%,transparent);border:1px solid color-mix(in srgb,var(--st-amber-dot) 30%,transparent);color:var(--st-amber-fg);padding:6px 10px;line-height:1.5;">${esc(emailWhy||i18t('po_code_not_sent_generic'))} ${i18t('po_ask_sender_for_code',{who:esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||i18t('po_the_sender'))})}</p>`}
      <input id="pt-otp" inputmode="numeric" maxlength="6" placeholder="______" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:0;padding:var(--s-2) 11px;text-align:center;font-size:18px;font-family:var(--font-mono);letter-spacing:.4em;color:var(--color-text);outline:none;"/>
      <button id="pt-otp-go" class="ui-btn ui-btn-primary" style="margin-top:var(--s-2);width:100%;padding:9px;font-size:var(--t-body);">${icon('finger','w-4 h-4')} ${i18t('po_verify_and_sign')}</button>
      <button id="pt-otp-resend" style="margin-top:6px;width:100%;background:none;border:0;font-size:var(--t-label);color:var(--color-neutral-600);cursor:pointer;font-family:var(--font-body);">${i18t('po_resend_code')}</button>
    </div>`;
  document.getElementById('pt-otp-go').addEventListener('click',()=>portalVerifyAndSign(p, info));
  /* L1: a 30-second cooldown on Resend, with a live countdown, so rapid taps do
     not fire repeated sends (each of which silently resets the code and the
     input) and the signer gets an acknowledgement rather than nothing. */
  const resendBtn=document.getElementById('pt-otp-resend');
  const RESEND_COOLDOWN=30000;
  let _cd=null;
  const tickCooldown=()=>{
    const left=Math.ceil((RESEND_COOLDOWN-(Date.now()-_ptLastOtpSend))/1000);
    if(left>0){ resendBtn.disabled=true; resendBtn.style.opacity='.55'; resendBtn.style.cursor='default'; resendBtn.textContent=i18t('po_resend_code_in',{n:left}); }
    else { resendBtn.disabled=false; resendBtn.style.opacity=''; resendBtn.style.cursor='pointer'; resendBtn.textContent=i18t('po_resend_code'); if(_cd){ clearInterval(_cd); _cd=null; } }
  };
  tickCooldown(); _cd=setInterval(tickCooldown, 1000);
  resendBtn.addEventListener('click',()=>{
    if(Date.now()-_ptLastOtpSend < RESEND_COOLDOWN) return;
    if(_cd){ clearInterval(_cd); _cd=null; }
    portalStartOtp(p, info);
  });
  document.getElementById('pt-otp').focus();
}
async function portalVerifyAndSign(p, info){
  const codeVal=fval('pt-otp');
  if(!/^\d{6}$/.test(codeVal)){ toast(i18t('po_enter_6_digit'),'err'); return; }
  let verify;
  // no email in the body: the server verified the address IT chose (W8), and
  // possession of the code is the whole proof
  try{ const v=await api('shares/'+PORTAL_OPTS.token+'/verify-otp','POST',{ code:codeVal }); verify=v.verify; }
  catch(e){ toast(e.message,'err'); return; }
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:'sign',
    name:info.name, title:info.title, email:info.email, comment:info.comment, verify, at:nowISO(),
    templateValues:portalTemplateValues(p),
    signatureForm:info.sig?info.sig.form:null, signatureImage:info.sig?info.sig.image:null, signatureImageHash:info.sig?info.sig.imageHash:null,
    signatureTypedName:info.sig?info.sig.typedName:null, signatureFont:info.sig?info.sig.font:null };
  /* U-3: submit as a retryable step. A failure AFTER the code verified is the
     most expensive place in the whole product to lose feedback — a first-time
     counterparty cannot tell a success from a failure on a binding act. On
     error, an inline card with an explicit "Try signing again" is rendered into
     #portal-result (the verify token is still valid, so the retry re-sends the
     already-verified signature), instead of a toast that scrolls away while the
     success panel never appears. */
  const submitSigned=async()=>{
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      portalSetDone('pt-sign','Signed and sent');
      portalMarkSigned(p, info);
      document.getElementById('portal-result').innerHTML=`
        <div style="border:1px solid color-mix(in srgb,var(--st-green-dot) 30%,transparent);background:var(--st-green-bg);border-radius:0;padding:var(--s-4);text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:var(--st-green-fg);font-size:var(--t-body);font-weight:var(--w-strong);margin-bottom:var(--s-1);">${icon('check2','w-4 h-4')} Signed &amp; verified</div>
          <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0;">${i18t('po_verified_delivered',{who:esc(p.sharedBy),org:esc(p.org)})}</p>
        </div>`;
    }catch(e){
      const out=document.getElementById('portal-result');
      if(out){
        out.innerHTML=`
          <div style="border:1px solid var(--st-ruby-line);background:var(--st-ruby-bg);border-radius:0;padding:14px;">
            <div style="display:flex;align-items:center;gap:6px;color:var(--st-ruby-fg);font-size:var(--t-body);font-weight:var(--w-strong);margin-bottom:var(--s-1);">${icon('alert','w-4 h-4')} ${i18t('po_signature_failed')}</div>
            <p style="font-size:var(--t-label);color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5;">${esc(e.message||'The connection dropped before your signature was recorded.')} You’re already verified — you can try again without a new code.</p>
            <button id="pt-sign-retry" class="ui-btn ui-btn-primary" style="width:100%;padding:9px;font-size:var(--t-body);">${icon('finger','w-4 h-4')} Try signing again</button>
          </div>`;
        document.getElementById('pt-sign-retry')?.addEventListener('click',submitSigned);
      } else toast(e.message,'err');
    }
  };
  await submitSigned();
}

/* ---------- PDF export (print pipeline) ---------- */
/* The contract text itself, for an uploaded/migrated document. The export used
   to print only the certificate and the audit trail, on the reasoning that the
   original file is a separate attachment — but a PDF of a contract that doesn't
   contain the contract is not much use. Print the extracted text, labelled for
   what it is: a transcription. The stored file stays the authoritative copy. */
function uploadedTextForPrint(c){
  const u=c.upload||{};
  // a rich working text prints as the document it is, sanitised at render
  const rich=!!(window.isRich && isRich(c.format) && c.redlineText);
  const raw=String((c.redlineText||u.extractedText||'')).trim();
  const text=rich?richToText(raw):raw;
  if(!text) return `
    <p style="font-size:var(--t-label);color:var(--st-ruby-fg);line-height:1.6;">No machine-readable text could be extracted from this file, so the wording cannot be printed here. Refer to the original document (<strong>${u.fileName||'attached file'}</strong>).</p>`;
  const body=rich
    ? renderDocHtml(raw, RICH_FORMAT)
    : (window.documentTextHtml)
    ? documentTextHtml(raw,{size:'11px', lh:'1.55'})
    : `<div style="white-space:pre-wrap;font-size:var(--t-label);line-height:1.55">${raw.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`;
  return `
    <div style="margin-top:22px;">
      <div style="font-family:var(--font-doc);font-weight:var(--w-strong);font-size:var(--t-body);border-bottom:1px solid var(--color-doc-rule);padding-bottom:6px;margin-bottom:10px;color:var(--color-doc-text);">
        Contract text${c.redlineText?' (working text)':''}
      </div>
      ${body}
      <p class="doc-muted" style="font-size:var(--t-figure);margin-top:10px;line-height:1.5;">${i18t('po_text_extracted_from')} <strong>${u.fileName||'the uploaded file'}</strong>${c.redlineText?' and edited in HaTi':''}. Signatures, stamps and page layout are not reproduced — the stored original file remains the authoritative document.</p>
    </div>`;
}
/* THE EXECUTION BLOCK, FOR PRINT.

   A signed contract's page carries the seal roundel, who signed and how, the
   sealed text fingerprint and the document seal. The printed copy carried none
   of it: exportPDF took its body from docBody(), which only folds the block in
   when `c.status === 'Signed' && c.execution.html` — a frozen body captured at
   signing. A contract signed without one, or an uploaded document (whose body
   is the file, not HTML), printed with the wording, a lone SHA-256 box and an
   audit trail: no signatures, no "Executed & Sealed", nothing to show it had
   been executed at all. The one page that most needs to prove it was signed was
   the one that did not.

   Rendered here explicitly rather than hoped for, and written in INLINE styles
   because the print sheet does not carry the application's stylesheet — the
   page's own block is built from utility classes that print as unstyled text.
   The wording and the values are the page's; only the styling is restated. */
/* DID HATI TAKE THIS SIGNATURE?

   The only question that decides whether a printed page carries HaTi's marks.
   A contract executed on paper, or in somebody else's system, and then filed
   here was not signed by us and is not ours to stamp — printing it must give
   back what was filed and nothing more. Adding a seal, a fingerprint or an
   audit trail to a document somebody else executed is HaTi asserting a part in
   an act it had no part in.

   Same for a document merely uploaded and never signed here: there is no
   execution to attest, so there is nothing to attest to. */
const printIsHatiExecuted = c =>
  String(c.status||'')==='Signed' && !isExternallyExecuted(c)
  && (Array.isArray(c.signatures) ? c.signatures.length > 0 : false);

function printExecutionBlock(c){
  if(!printIsHatiExecuted(c)) return '';
  const external=false;
  const u=c.upload||{};
  const hash=external?(u.fileHash||'—'):((c.hash&&c.hash!=='PRE-SEEDED')?c.hash:'—');
  const sigs=Array.isArray(c.signatures)?c.signatures:[];
  const partyLabel=s=>s.party==='counterparty'?'Counterparty':s.party==='first'?'First party':(s.role||'Signer');
  const cap=s=>(window.signatureCapacity?signatureCapacity(s):'')||'';
  const cell=s=>`
    <td style="vertical-align:top;padding:0 10px 10px 0;width:50%;">
      <div style="border:1px solid var(--color-divider);border-radius:0;padding:9px 11px;">
        <div style="font-size:var(--t-figure);letter-spacing:.08em;text-transform:uppercase;color:#5F6D6B;margin-bottom:3px;">${esc(partyLabel(s))}</div>
        ${s.image?`<img src="${s.image}" alt="" style="height:38px;max-width:190px;object-fit:contain;display:block;margin:2px 0 5px;"/>`:''}
        <div style="font-weight:var(--w-strong);font-size:var(--t-meta);">${esc(s.name||'—')}${cap(s)?', '+esc(cap(s)):''}</div>
        <div style="font-size:var(--t-label);color:#5F6D6B;line-height:1.5;">${esc([s.email,s.form?s.form+' signature':s.method,s.at?fmtDT(s.at):''].filter(Boolean).join(' · '))}</div>
      </div>
    </td>`;
  const rows=[];
  for(let i=0;i<sigs.length;i+=2) rows.push(`<tr>${cell(sigs[i])}${sigs[i+1]?cell(sigs[i+1]):'<td></td>'}</tr>`);
  const sigTable=sigs.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:10px;">${rows.join('')}</table>`
    : `<div style="margin-top:10px;border:1px solid var(--color-divider);border-radius:0;padding:9px 11px;font-size:var(--t-label);color:#5F6D6B;">${c.signatory?('Signed by '+esc(c.signatory)):'Signatories not recorded'}</div>`;
  return `
    <div style="margin-top:26px;page-break-inside:avoid;border:1px solid ${external?'#8fa8c2':'var(--st-green-line)'};border-radius:0;padding:var(--s-4) 18px;background:${external?'#f2f6fa':'#f2f8f4'};">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td style="width:70px;vertical-align:top;">
          <svg width="62" height="62" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r="46" fill="#fff"/>
            <circle cx="48" cy="48" r="46" fill="none" stroke="${external?'var(--color-accent)':'#086B54'}" stroke-width="2"/>
            <circle cx="48" cy="48" r="38" fill="${external?'color-mix(in srgb,var(--color-accent) 11%,transparent)':'rgba(8,107,84,.10)'}" stroke="${external?'#8fa8c2':'#C79A3E'}" stroke-width="1.5"/>
            <text x="48" y="45" text-anchor="middle" font-family="Inter, system-ui, Arial, Helvetica, sans-serif" font-weight="700" font-size="12" fill="${external?'#3f6087':'var(--st-green-dot)'}">${external?'ON FILE':'SEALED'}</text>
            <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" fill="${external?'var(--color-accent)':'var(--st-green-fg)'}">${external?'MIGRATED':'SHA-256'}</text>
          </svg>
        </td>
        <td style="vertical-align:top;">
          <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:var(--w-title);font-size:16px;">${external?'Executed outside HaTi':'Executed &amp; Sealed'}</div>
          <div style="font-size:var(--t-label);color:#5F6D6B;margin-top:2px;line-height:1.5;">${external
            ? `Signed before it was migrated into HaTi. <strong>${i18t('po_no_esig_here')}</strong> — the signatures are on the original document.`
            : ((c.execution&&c.execution.esignature)||jxEsignatureShort())}</div>
          ${external?'':sigTable}
          ${(!external&&!isUpload(c))?`<div style="margin-top:10px;border:1px solid var(--color-divider);border-radius:0;padding:9px 11px;">
            <div style="font-size:var(--t-figure);letter-spacing:.08em;text-transform:uppercase;color:#5F6D6B;margin-bottom:3px;">${i18t('po_sealed_fingerprint')}</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-label);word-break:break-all;">${esc((c.execution&&c.execution.textHash)||'—')}</div>
          </div>`:''}
          <div style="margin-top:10px;border-radius:0;padding:10px var(--s-3);background:#1d1f20;color:#f4f5f6;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-figure);letter-spacing:.08em;color:#c79a3e;margin-bottom:3px;">${external?'ORIGINAL FILE FINGERPRINT (SHA-256)':'DOCUMENT SEAL (SHA-256)'}</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-label);word-break:break-all;">${esc(hash)}</div>
            <div style="font-size:var(--t-label);color:#b9bec4;margin-top:var(--s-1);">${esc(c.signedAt||'Timestamp recorded')}</div>
          </div>
        </td>
      </tr></table>
    </div>`;
}

/* Two exports, because a signed contract gets sent to people and also gets
   filed, and those want opposite things.

   The DISTRIBUTION copy is what leaves the building: the customer's letterhead,
   the wording, the signatures. Nothing that says which software produced it.
   HaTi's masthead used to print above the customer's own branding on their own
   contract, and "Generated by HaTi CLM" used to sit under it — neither was ever
   a decision, they were simply always on, and on a document going to a
   counterparty they read as somebody else's advertising on your paper.

   The RECORD copy is what you keep: the same document plus HaTi's attestation
   of the part it played — the seal and the audit trail. That evidence is worth
   having the first time a counterparty argues about when they signed, which is
   why the answer here is to separate the two rather than delete one. It is the
   same split DocuSign draws between the agreement and its certificate.

   The audit trail was already gated on HaTi having actually executed the
   contract (printIsHatiExecuted) — a document signed on paper or in someone
   else's system never carried it. That gate is untouched; `record` narrows it
   further to the copy that asked for it. */
function exportPDF(c, opts){
  const record = !!(opts && opts.record);
  let bodyHtml;
  if(isUpload(c) && !printIsHatiExecuted(c)){
    /* A document that came in from outside and was not signed here prints as
       the wording it arrived with, and nothing else. The certificate card that
       used to head it — file name, size, value, status, fingerprint — is HaTi's
       filing metadata, and stapling it to somebody else's executed contract
       makes the print a HaTi artefact rather than a copy of the agreement. */
    bodyHtml=uploadedTextForPrint(c);
  } else if(isUpload(c)){
    // Signed HERE, on an uploaded base: the original file is a separate
    // attachment, so the print is the certificate for the signature we took.
    const u=c.upload||{};
    bodyHtml=`
      <div style="border:1px solid var(--color-divider);border-radius:0;padding:var(--s-4);margin-bottom:var(--s-4);">
        <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:var(--w-title);font-size:var(--t-card);margin-bottom:2px;">${esc(c.name)}</div>
        <div style="font-size:var(--t-label);color:#5F6D6B;margin-bottom:10px;">${i18t('po_external_received',{who:c.counterparty||'—',folder:FOLDERS[c.folder].name})}</div>
        <table style="font-size:var(--t-label);border-collapse:collapse;">
          <tr><td style="padding:2px var(--s-3) 2px 0;color:#5F6D6B;">${i18t('po_original_file')}</td><td style="font-weight:var(--w-strong);">${u.fileName||'—'} (${u.size?Math.round(u.size/1024):0} KB)</td></tr>
          <tr><td style="padding:2px var(--s-3) 2px 0;color:#5F6D6B;">${i18t('po_value')}</td><td style="font-weight:var(--w-strong);">${!isMonetary(c)?'Non-monetary':(c.value?(window.fmtMoneyOf?fmtMoneyOf(c):fmtMoney(c.value)):'—')}</td></tr>
          <tr><td style="padding:2px var(--s-3) 2px 0;color:#5F6D6B;">Status</td><td style="font-weight:var(--w-strong);">${c.status}</td></tr>
          <tr><td style="padding:2px var(--s-3) 2px 0;color:#5F6D6B;">${i18t('po_file_fingerprint')}</td><td style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-figure);word-break:break-all;">${u.fileHash||'—'}</td></tr>
        </table>
      </div>
      <p style="font-size:var(--t-label);color:#1B2A28;line-height:1.6;">${isExternallyExecuted(c)
        ? `This is a HaTi <strong>filing record</strong> for a contract executed outside HaTi and migrated in. No electronic signature was taken in HaTi — the signatures are on the original document (<strong>${u.fileName||'the attached file'}</strong>), which is retained here and travels with this record. The fingerprint below identifies that exact file; it is not a signature.`
        : `This is a HaTi signing certificate for an externally-supplied contract. The original document (<strong>${u.fileName||'the attached file'}</strong>) is retained in HaTi and travels with this certificate. The seal below binds this certificate to that exact file by its SHA-256 fingerprint.`}</p>
      ${uploadedTextForPrint(c)}`;
  } else {
    const holder=document.createElement('div');
    /* docBody folds the page's own execution block into a frozen body. That
       block is built from the application's utility classes, which the print
       sheet does not carry, so it prints as a heap of unstyled text — and the
       print-styled block below would then be the second copy. Take the wording
       only, and let printExecutionBlock render the execution once, properly. */
    holder.innerHTML=docBody(c);
    holder.querySelectorAll('.seal-in, [data-anchor="sig"]').forEach(n=>n.remove());
    /* An unfilled blank prints as a paper form's blank line — an underscore
       run, never the on-screen grey box and never the field's label. */
    holder.querySelectorAll('.hati-field').forEach(n=>{
      const line=document.createElement('span');
      line.style.cssText='display:inline-block;min-width:130px;border-bottom:1px solid #5F6D6B;';
      line.innerHTML='&nbsp;';
      n.replaceWith(line);
    });
    holder.querySelectorAll('input').forEach(inp=>{
      const span=document.createElement('span');
      span.style.cssText="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:var(--w-strong);border-bottom:1px solid #A9B3B1;padding:0 3px;";
      span.textContent=(window.fieldDisplayValue?fieldDisplayValue(inp):(inp.value||inp.getAttribute('value')||''))||'________';
      inp.replaceWith(span);
    });
    bodyHtml=holder.innerHTML;
  }
  /* Built once, and it decides whether the bare seal box below is needed: the
     execution block already carries the seal, and printing both put the same
     fingerprint on the page twice — which on a document about provenance reads
     like two different seals. */
  const execBlock=printExecutionBlock(c);
  /* Whether this page may carry HaTi's marks at all. Everything below the
     document — the seal box, the audit trail — is HaTi describing its own part
     in the contract, and on a document we did not execute we had none. */
  const marks=printIsHatiExecuted(c) && record;
  const audit=(c.audit||[]).map(e=>`
    <tr><td style="padding:3px 10px 3px 0;white-space:nowrap;color:#5F6D6B;">${fmtDT(e.at)}</td>
    <td style="padding:3px 10px 3px 0;font-weight:var(--w-strong);">${e.action}</td>
    <td style="padding:3px 0;">${e.detail} <span style="color:#5F6D6B;">(${e.user})</span></td></tr>`).join('');
  // The masthead, the audit trail and the contract now share one family — the
  // platform runs on the design's two faces throughout. The contract is still a
  // document surface and still carries the document ink, measure and leading,
  // exactly as it does on screen, so the PDF matches the page it came from.
  /* The design travels to paper too: the same inline-styled header/footer the
     screen shows, the ruled page border where the design has one, and — for a
     raw upload whose own layout is baked into the file — the branded cover
     page in front of the transcription (DESIGN-contract-designer.md §5).
     The band bleeds to the sheet edge only on the DISTRIBUTION copy: the
     record copy stacks HaTi's masthead above the letterhead, and a bled band
     would print over it. */
  const printDesign=window.resolveDocBranding?resolveDocBranding(c):null;
  const printCover=(printDesign&&printDesign.designId&&isUpload(c)&&!record&&window.docDesignCoverPageHtml)?docDesignCoverPageHtml(printDesign,c):'';
  document.getElementById('print-root').innerHTML=`
    <div${printDesign&&window.docDesignPaperAttr?docDesignPaperAttr(printDesign):''} style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;max-width:760px;margin:0 auto;padding:var(--s-8) var(--s-6);color:#1d1f20;${printDesign&&window.docDesignPaperStyle?docDesignPaperStyle(printDesign):''}">
      ${record?`<div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid var(--color-accent);padding-bottom:10px;margin-bottom:var(--s-6);">
        <div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:var(--w-title);font-size:18px;">HaTi <span style="font-weight:var(--w-body);font-size:var(--t-label);color:#5F6D6B;">${i18t('po_contract_lifecycle')}</span></div>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-label);color:#5F6D6B;">${c.id} · generated ${fmtDT(nowISO())}</div>
      </div>`:''}
      ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c,record?{}:{bleedX:24,bleedY:32}):''}
      ${printCover}
      <div class="doc-surface">${printDesign&&window.docStructureBodyHtml?docStructureBodyHtml(printDesign,bodyHtml):bodyHtml}</div>
      ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
      ${execBlock}
      ${marks&&(!execBlock)&&c.hash&&c.hash!=='PRE-SEEDED'?`<div style="margin-top:var(--s-6);padding:var(--s-3);border:1px solid var(--color-divider);border-radius:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:var(--t-label);word-break:break-all;"><strong>${isExternallyExecuted(c)?'SHA-256 ORIGINAL FILE FINGERPRINT':'SHA-256 DOCUMENT SEAL'}</strong><br/>${isExternallyExecuted(c)?((c.upload&&c.upload.fileHash)||'—'):c.hash}<br/><span style="color:#5F6D6B;">${c.signedAt||''}${isExternallyExecuted(c)?' · executed outside HaTi':''}</span></div>`:''}
      ${marks&&audit?`<div style="margin-top:var(--s-6);page-break-inside:avoid;"><div style="font-family:Inter,system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-weight:var(--w-strong);font-size:var(--t-body);border-bottom:1px solid var(--color-divider);padding-bottom:6px;margin-bottom:var(--s-2);">${i18t('po_audit_trail')}</div><table style="font-size:var(--t-label);border-collapse:collapse;width:100%;">${audit}</table></div>`:''}
      ${record?`<div style="margin-top:var(--s-6);font-size:var(--t-figure);color:#A9B3B1;text-align:center;">Generated by HaTi CLM · ${FIRST_PARTY}</div>`:''}
    </div>`;
  /* ---- A READER'S OWN COPY IS NOT AN ENTRY IN OUR RECORD (15 Aug 2026) ----
     The counterparty can print from their link now, and this is the one
     function that does it. Their page holds a contract rebuilt from a share
     payload: it is not the record, nothing they do to it may be written to the
     record, and persist() from that seat would push a reconstruction back over
     the real one. renderAuditSection is not on their page at all.
     THE PRINT ITSELF IS UNCHANGED — same wording, same branding, same seal
     block; only what we write down about it differs by seat. Our own exports go
     on being audited exactly as before. */
  if (!(typeof window!=='undefined' && window.PORTAL_MODE)){
    logAudit(c,'Exported',record?'Full record exported (seal and audit trail)':'PDF export generated');
    persist(c); renderAuditSection(c);
  }
  window.print();
}

function metrics(){
  // Prefer server-computed aggregates (accurate at any scale, even when the
  // client only holds a capped working set); fall back to the in-memory set.
  const s=state.serverStats;
  if(s) return { totalValue:s.totalValue||0, pending:s.pending||0, signed:s.signed||0,
    declined:s.declined||0, drafts:s.drafts||0, expired:s.expired||0, expiredValue:s.expiredValue||0 };
  const cs=(state.contracts||[]).filter(c=>!c.archived);   // the shelf is off the books (WO-5)
  /* ACTIVE VALUE IS THE VALUE OF WHAT IS STILL RUNNING. This counted every
     contract that was not Declined, so a supply agreement that ended in 2023
     went on contributing its whole face value to the headline figure on the
     dashboard for ever. See contractExpired in js/core.js — the same read the
     status chip and the calendar use, so the number and the badges agree. */
  const gone=c=>!!(window.contractExpired&&contractExpired(c));
  const active=cs.filter(c=>c.status!=='Declined'&&!gone(c));
  const expired=cs.filter(gone);
  return {
    totalValue:active.reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0),
    pending:cs.filter(c=>c.status==='Under Review').length,
    signed:cs.filter(c=>c.status==='Signed').length,
    declined:cs.filter(c=>c.status==='Declined').length,
    drafts:cs.filter(c=>c.status==='Draft').length,
    expired:expired.length,
    expiredValue:expired.reduce((s,c)=>s+(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)),0),
  };
}
async function refreshStats(){
  if(!API_MODE()) return;
  try{ state.serverStats=await api('stats'); if(state.view==='dashboard') renderDashboard(); }catch(e){}
}

Object.assign(window,{portalDeliveryState,portalReadySpent,portalAlerts,portalSeatNoticesHtml,portalBellHtml,portalAlertsShellHtml,portalAlertsBodyHtml,
  portalAlertsOpen,portalAlertsClose,portalPaintAlerts,wirePortalAlerts,portalAlertsStyle,
  portalGoToChange,portalPressSend,PT_READ_KEY,ptReadMap,ptRevisionKey,ptRevisionRead,ptSetRevisionRead,portalHideRevisedBanner,portalShowRevisedBanner,portalWireRevisedBanner,portalRevisedBanner,portalChangedText,openPortalCompare,PORTAL_POLL_MS,portalRenderOpts,portalSignature,portalBusy,portalPollDecide,portalUpdatedNoticeHtml,portalShowUpdatedNotice,portalRefreshNow,portalStartPolling,portalStopPolling,portalExecuted,portalReadOnly,printExecutionBlock,printIsHatiExecuted,portalChangeSummaryHtml,portalNegoHtml,portalNegoContract,portalNegoFootHtml,wirePortalNego,wirePortalNegoFoot,PORTAL_OPTS,portalSignUnverified,portalDiscussHtml,wirePortalDiscuss,portalDiscussTopics,portalClauseNotes,portalClauseUnits,portalClauseText,portalClauseEditorHtml,wirePortalClauseEditor,portalProposedText,portalThreadHtml,portalOpenPointsHtml,exportPDF,metrics,uploadedTextForPrint,portalEntry,portalRespond,portalStartOtp,portalVerifyAndSign,refreshStats,renderSharePortal,renderShareDormant,renderShareViewer,renderShareHistory,portalViewerRedlineHtml,renderShareWorkbench,portalIssuedForSigning,portalCanDerive,portalDeriveView,openDerivedLinkDialog,portalReadingBtnsHtml,portalEnsureResponderName});
