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
function portalRevisedBanner(){
  const ch=portalChangedText();
  if(!ch) return '';
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
    <div id="pt-revised" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid #e0c48a;background:#fdf6e7;border-left:4px solid #b8862b;border-radius:6px;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span class="pt-pip" style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#b8862b;color:#fff;font-size:14px;font-weight:700">!</span>
      <span style="flex:1;min-width:220px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#7d5a14">${headline}</span>
        <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);font-family:var(--font-mono)">${sub}</span>
      </span>
      <button id="pt-see-changes" style="flex:none;font:inherit;font-size:12.5px;font-weight:600;border:0;border-radius:5px;padding:9px 16px;cursor:pointer;background:#b8862b;color:#fff">See what changed</button>
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
  const msg=(PORTAL_OPTS.share&&PORTAL_OPTS.share.message)||'';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
            <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">What ${esc(p.org||'the sender')} changed</h3>
            <span style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;background:#fbf4e3;color:#7d5a14;border-radius:999px;padding:3px 9px">Since your copy of ${fmtDT(ch.openedAt||ch.at)}</span>
          </div>
          <p style="font-size:11.5px;color:var(--color-neutral-600);margin:7px 0 0">+${st.add} added · −${st.del} removed ·
            <span style="background:#dff0e6;color:#1e6b4d;padding:0 4px;border-radius:2px">added</span>
            <span style="background:#fbe3e1;color:#b0453c;text-decoration:line-through;padding:0 4px;border-radius:2px">removed</span></p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div style="${COL}">
          <div style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;font-size:14px;line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(ch.before,ch.after)}</div>
          ${msg?`<div style="margin-top:14px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:12px 16px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">Note from ${esc(p.sharedBy||'the sender')}</div>
            <div style="font-size:12.5px;line-height:1.6;color:var(--color-neutral-800)">${esc(msg)}</div></div>`:''}
        </div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <span style="font-size:11.5px;color:var(--color-neutral-600);min-width:150px;flex:1">Accepting records your agreement. It does not sign the contract.</span>
          <button id="pc-decline" class="ui-btn" style="border-color:color-mix(in srgb,#b0453c 40%,transparent);color:#b0453c">Decline</button>
          <button id="pc-counter" class="ui-btn">Propose further edits</button>
          <button id="pc-accept" class="ui-btn ui-btn-primary">Accept these changes</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  document.getElementById('pc-accept').addEventListener('click',()=>{ closeModal(); portalRespond(p,'accept'); });
  document.getElementById('pc-decline').addEventListener('click',()=>{ closeModal(); portalRespond(p,'decline'); });
  document.getElementById('pc-counter').addEventListener('click',()=>{ closeModal(); document.getElementById('pt-redline')?.click(); });
}
/* The counterparty's Compare — the mirror of the owner's toolbar button, and
   the answer to "how do I see what changed" when no banner happens to be up.
   Always available whenever the contract has been sent more than once; picks
   any two of the versions that travelled with the payload. */
function portalCompareBar(){
  const vs=portalVersions();
  const ch=portalChangedText();
  if(vs.length<2 && !ch) return '';
  const line = vs.length>1
    ? `This contract has <b>${vs.length} versions</b>, numbered the same as ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.org)||'the sender')} sees them. You can compare any two.`
    : (ch&&ch.kind==='yourpaper'
        ? `The wording differs from the paper you sent. You can see exactly what was changed.`
        : `The wording has moved since the copy you were sent. You can see exactly what changed.`);
  return `
    <div id="pt-history" style="display:flex;align-items:center;gap:11px;flex-wrap:wrap;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:11px 16px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;display:inline-flex;color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
      <span style="flex:1;min-width:180px;font-size:12.5px;color:var(--color-neutral-700);line-height:1.5">${line}</span>
      <button id="pt-compare" class="ui-btn" style="flex:none;font-size:12.5px;padding:8px 14px">Compare versions</button>
    </div>`;
}
function openPortalVersionCompare(p){
  const vs=portalVersions().slice();
  const now=portalCurrentText();
  const items=[];
  const filed=(p&&p.contract&&p.contract.upload&&p.contract.upload.extractedText)||'';
  // Same caption on both sides of the deal — "v2 · Edited by Young Mbagaya"
  // reads identically here and in HaTi, so a version can be named out loud.
  const cap=v=>{
    // "v2 · Edited by Young Mbagaya · Young Mbagaya" reads like a stutter, and
    // "· System" says nothing — only append an author the caption omits.
    const named=v.by && v.by!=='System' && !String(v.label||'').toLowerCase().includes(String(v.by).toLowerCase());
    return `v${v.n} · ${v.label}${named?` · ${v.by}`:''}`;
  };
  if(filed.trim() && !vs.some(v=>normText(v.text)===normText(filed)))
    items.push({ label:'The paper you sent, as it arrived', text:filed });
  items.push(...vs.map(v=>({ label:cap(v), text:v.text })));
  const last=vs[vs.length-1];
  if(now&&(!last||normText(last.text)!==normText(now))) items.push({ label:'Current — the copy you are reading', text:now });
  if(items.length<2) return;
  const opts=items.map((it,i)=>`<option value="${i}">${esc(it.label)}</option>`).join('');
  const SEL='font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);padding:7px 9px;border-radius:4px;color:inherit;min-width:0;flex:1';
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0 0 10px">Compare versions</h3>
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <select id="pv-a" style="${SEL}">${opts}</select>
            <span style="color:var(--color-neutral-500);flex:none">→</span>
            <select id="pv-b" style="${SEL}">${opts}</select>
            <button id="pv-go" class="ui-btn ui-btn-primary" style="flex:none">Compare</button>
          </div>
          <p id="pv-legend" style="font-size:11.5px;color:var(--color-neutral-600);margin:9px 0 0"></p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div id="pv-out" style="${COL};font-size:12.5px;color:var(--color-neutral-600)">Pick two versions and press <b>Compare</b>.</div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px">
          <span style="font-size:11.5px;color:var(--color-neutral-600);flex:1">Nothing here sends anything — close when you are done.</span>
          <button id="pv-close" class="ui-btn">Close</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  const A=document.getElementById('pv-a'), B=document.getElementById('pv-b');
  A.value=String(Math.max(0,items.length-2)); B.value=String(items.length-1);
  const run=()=>{
    const a=items[Number(A.value)], b=items[Number(B.value)];
    if(!a||!b) return;
    if(a===b){ document.getElementById('pv-out').innerHTML='<div style="font-size:12.5px;color:var(--color-neutral-600)">Those are the same version — pick two different ones.</div>'; return; }
    const st=(window.diffStats?diffStats(a.text,b.text):{add:0,del:0});
    document.getElementById('pv-legend').innerHTML=`+${st.add} added · −${st.del} removed ·
      <span style="background:#dff0e6;color:#1e6b4d;padding:0 4px;border-radius:2px">added</span>
      <span style="background:#fbe3e1;color:#b0453c;text-decoration:line-through;padding:0 4px;border-radius:2px">removed</span>`;
    document.getElementById('pv-out').innerHTML=`<div style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;font-size:14px;line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(a.text,b.text)}</div>`;
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
  'nego-cp-ready','nego-cp-decline','nego-send-decisions'];
function portalActionButtons(){
  return PORTAL_ACTIONS.map(id=>document.getElementById(id)).filter(Boolean);
}
function portalSetBusy(pressedId, label){
  for(const b of portalActionButtons()){
    if(!b.dataset.idle) b.dataset.idle=b.innerHTML;
    b.disabled=true; b.style.opacity='.5'; b.style.cursor='default';
    if(b.id===pressedId) b.innerHTML=esc(label||'Sending…');
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
  band.style.background='#d9eae0';
  band.style.borderLeftColor='#1e6b4d';
  band.innerHTML=`
    <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
    <span style="flex:1;min-width:220px;line-height:1.5">
      <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:15.5px;color:#14503a">${who} signed this contract</span>
      <span style="display:block;font-size:11.5px;color:var(--color-neutral-700);margin-top:2px">${fmtDT(nowISO())} · sent to ${esc((p&&p.sharedBy)||'the sender')} at ${esc((p&&p.org)||'their organisation')}. There is nothing further for you to do here — keep this link to read the contract.</span>
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
    <div id="pt-executed" style="display:flex;align-items:flex-start;gap:12px;border:1px solid #cfe7d9;background:#e8f4ee;border-left:4px solid #1e6b4d;border-radius:6px;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:12px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:0;line-height:1.5">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#14503a">This contract is executed and sealed</span>
        <span style="display:block;font-size:12px;color:#14503a;margin-top:2px">The wording is final and read-only${done.at?` — signed ${fmtDT(done.at)}`:''}. You can still read this copy and keep this link. Nothing further can be proposed, decided or signed here; if something has to change, ask ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||'the sender')} to record an amendment.</span>
      </span>
    </div>`;
  const sup=PORTAL_OPTS.superseded;
  if(!sup) return '';
  return `
    <div id="pt-superseded" style="display:flex;align-items:flex-start;gap:12px;border:1px solid #e3c4bf;background:#f9ecea;border-left:4px solid #b0453c;border-radius:6px;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span style="flex:none;margin-top:1px;color:#8f322b;display:inline-flex">${icon('alert','w-4 h-4')}</span>
      <span style="flex:1;min-width:0;line-height:1.5">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#8f322b">This is an older copy — it can no longer be answered</span>
        <span style="display:block;font-size:12px;color:#8f322b;margin-top:2px">A newer version of this contract was sent to you on ${fmtDT(sup.at)}. You can still read this copy and compare it, but signing or responding has to happen on the most recent link. If you cannot find it, ask ${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||'the sender')} to send it again.</span>
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
    <div id="pt-banner" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;border:1px solid #e0c48a;background:#fdf6e7;border-left:4px solid #b8862b;border-radius:6px;padding:13px 17px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <span class="pt-pip" style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#b8862b;color:#fff;font-size:14px;font-weight:700">!</span>
      <span style="flex:1;min-width:200px;line-height:1.45">
        <span style="display:block;font-size:13.5px;font-weight:600;color:#7d5a14">${org} ${verb}</span>
        <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);font-family:var(--font-mono)">Round ${latest.n} · ${tally} · ${fmtDT(latest.resolution.at||latest.at)}</span>
      </span>
      ${latest.resolution.decision==='accepted'?`<span style="flex:none;font-size:11.5px;color:#7d5a14">The wording below already reflects them.</span>`:''}
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
      <div style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono)">${esc(who)}${when?` · ${fmtDT(when)}`:''}</div>
      <div style="max-width:92%;border:1px solid ${mine?'var(--color-divider)':'var(--color-accent-300)'};background:${mine?'var(--color-bg)':'var(--color-accent-100)'};border-radius:7px;padding:8px 11px;font-size:12px;line-height:1.55;color:var(--color-neutral-800)">${esc(text)}</div>
    </div>`;
  /* What was said about individual clauses, under the round it belonged to.
     A reason attached to one change is more use than the same words in a lump
     at the top, and it is where the reader is already looking. */
  const clauseExchanges=(r,orgName)=>{
    const parts=(r.blockDecisions||[]).filter(b=>b.note||b.reply);
    if(!parts.length) return '';
    return `<div style="display:flex;flex-direction:column;gap:7px;margin-top:2px">${parts.map(b=>`
      <div style="border:1px solid var(--color-divider);border-radius:5px;padding:7px 10px;background:var(--color-bg)">
        <div style="font-size:11.5px;line-height:1.55;color:var(--color-neutral-800)">
          ${b.before?`<span style="text-decoration:line-through;color:#8f322b">${esc(String(b.before).trim())}</span> `:''}
          ${b.after?`<span style="color:#1e6b4d">${esc(String(b.after).trim())}</span>`:''}
          <span style="font-size:10px;font-weight:700;margin-left:6px;color:${b.decision==='accept'?'#1e6b4d':'#8f322b'}">${b.decision==='accept'?'ADOPTED':'NOT ADOPTED'}</span>
        </div>
        ${b.note?`<div style="margin-top:4px;font-size:11px;color:var(--color-neutral-700)"><b>You said:</b> ${esc(b.note)}</div>`:''}
        ${b.reply?`<div style="margin-top:3px;font-size:11px;color:var(--color-neutral-700)"><b>${esc(orgName)}:</b> ${esc(b.reply)}</div>`:''}
      </div>`).join('')}</div>`;
  };
  const verdict=r=>{
    if(!r.resolution||!r.resolution.decision) return '';
    const ok=r.resolution.decision==='accepted';
    return `<div style="font-size:10.5px;font-weight:600;color:${ok?'#1e6b4d':'#8f322b'};margin-left:2px">${ok?'Adopted':'Not adopted'}${r.resolution.at?` · ${fmtDT(r.resolution.at)}`:''}</div>`;
  };
  return `
    <div id="pt-thread" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:11px">
        <span style="flex:none;color:var(--color-accent);display:inline-flex">${icon('history','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600">The discussion so far</span>
        <span style="margin-left:auto;font-size:10.5px;color:var(--color-neutral-500);font-family:var(--font-mono)">${said.length} round${said.length===1?'':'s'}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${said.map(r=>`
          <div style="display:flex;flex-direction:column;gap:6px;border-left:2px solid var(--color-divider);padding-left:11px">
            <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500)">Round ${esc(String(r.n))}</div>
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
    <div id="pt-openpoints" style="border:1px solid #e0c48a;background:#fdf6e7;border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
        <span style="flex:none;color:#b8862b;display:inline-flex">${icon('alert','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;color:#7d5a14">Still open between us</span>
        <span style="margin-left:auto;font-size:10.5px;color:#7d5a14;font-family:var(--font-mono)">${pts.length} point${pts.length===1?'':'s'}</span>
      </div>
      <p style="margin:0 0 10px;font-size:11.5px;line-height:1.55;color:#7d5a14">${org} did not adopt ${pts.length===1?'this change':'these changes'}. The wording below is unchanged in the contract. ${canReply?`Answer ${pts.length===1?'it':'them'} right here — that changes nothing in the contract — or press <b>Propose edits</b> when you have new wording to put forward.`:`Press <b>Propose edits</b> if you want to come back on ${pts.length===1?'it':'them'}.`}</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${pts.map((pt,i)=>`
          <div style="border:1px solid #e8d5ad;background:var(--color-surface);border-radius:6px;padding:9px 12px;font-size:12px;line-height:1.6">
            ${pt.before?`<div><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">Contract says</span>
              <div style="color:var(--color-neutral-800)">${esc(pt.before)}</div></div>`:''}
            ${pt.after?`<div style="margin-top:5px"><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">You asked for</span>
              <div style="color:#8f322b">${esc(pt.after)}</div></div>`:''}
            ${pt.ask?`<div style="margin-top:5px;font-size:11.5px;color:var(--color-neutral-700)"><b>You said:</b> ${esc(pt.ask)}</div>`:''}
            ${pt.reason?`<div style="margin-top:4px;font-size:11.5px;color:var(--color-neutral-700)"><b>Their reply:</b> ${esc(pt.reason)}</div>`:''}
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
    title: 'Ask or reply — no formal round needed',
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
      if (window.toast) toast('Sent — the contract is unchanged');
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
      <div data-cl="${u.i}" style="border:1px solid ${edited?'#b8862b':'var(--color-divider)'};background:${edited?'#fdf6e7':'var(--color-surface)'};border-radius:6px;padding:10px 13px">
        <div data-cl-view="${u.i}" style="display:flex;align-items:flex-start;gap:10px">
          <span style="flex:1;min-width:0;font-size:${heading?'13.5px':'13px'};line-height:1.7;${heading?'font-weight:700;letter-spacing:.02em;':''}color:var(--color-doc-text);white-space:pre-wrap">${esc(shown)}</span>
          <button data-cl-edit="${u.i}" class="ui-btn" style="flex:none;font-size:11px;padding:4px 10px">${edited?'Edit again':'Change'}</button>
        </div>
        ${edited?`<div style="margin-top:6px;font-size:10.5px;color:#7d5a14;display:flex;align-items:center;gap:7px;flex-wrap:wrap">
          <span>You changed this.</span>
          ${PORTAL_CLAUSE_NOTES[u.i]?`<span style="color:var(--color-neutral-700);font-size:11px">“${esc(PORTAL_CLAUSE_NOTES[u.i])}”</span>`:''}
          <button data-cl-undo="${u.i}" style="border:0;background:none;padding:0;font:inherit;font-size:10.5px;font-weight:600;color:#7d5a14;cursor:pointer;text-decoration:underline">Undo</button></div>`:''}
      </div>`;
  }).join('');
  const n=Object.keys(PORTAL_CLAUSE_EDITS).length;
  return `
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:11px">
      <span style="font-size:12px;color:var(--color-neutral-700)">Press <b>Change</b> on any clause you want to alter. Everything else stays exactly as it is.</span>
      <span style="flex:1"></span>
      <span id="pt-cl-count" style="font-size:11.5px;font-weight:600;color:${n?'#7d5a14':'var(--color-neutral-500)'}">${n?`${n} change${n===1?'':'s'}`:'No changes yet'}</span>
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
        <textarea data-cl-input="${i}" spellcheck="false" style="width:100%;min-height:78px;border:1px solid var(--color-accent);border-radius:5px;padding:9px 11px;font:inherit;font-size:13px;line-height:1.7;color:var(--color-doc-text);background:var(--color-surface);outline:none;resize:vertical">${esc(cur)}</textarea>
        <label style="display:block;margin-top:7px">
          <span style="display:block;font-size:10.5px;font-weight:600;color:var(--color-neutral-600);margin-bottom:3px">Why? (optional — shown next to this change)</span>
          <input data-cl-note="${i}" type="text" value="${esc(PORTAL_CLAUSE_NOTES[i]||'').replace(/"/g,'&quot;')}" placeholder="e.g. Net-60 is our standard payment term." style="width:100%;border:1px solid var(--color-divider);border-radius:5px;padding:7px 10px;font:inherit;font-size:12px;background:var(--color-surface);outline:none"/>
        </label>
        <div style="display:flex;gap:7px;justify-content:flex-end;margin-top:7px">
          <button data-cl-cancel="${i}" class="ui-btn" style="font-size:11px;padding:4px 11px">Cancel</button>
          <button data-cl-save="${i}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:4px 11px">Keep this change</button>
        </div>`;
      const ta=row.querySelector(`[data-cl-input="${i}"]`); if(ta){ ta.focus(); }
      row.querySelector(`[data-cl-cancel="${i}"]`).addEventListener('click',repaint);
      row.querySelector(`[data-cl-save="${i}"]`).addEventListener('click',()=>{
        const v=ta?ta.value:'';
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
  return fval('nego-cp-name') || fval('pt-name')
    || (PORTAL_OPTS.share&&PORTAL_OPTS.share.recipientName) || '';
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
function portalChangeSummaryHtml(p){
  const raw=String((p&&p.contract&&p.contract.changeSummary)||'').trim();
  if(!raw) return '';
  const lines=raw.split('\n').map(l=>l.trim()).filter(Boolean);
  if(!lines.length) return '';
  return `<div id="pt-change-summary" style="margin-bottom:12px;border:1px solid var(--color-divider);border-left:3px solid var(--color-accent);border-radius:4px;background:var(--color-surface);padding:10px 12px;">
    <span style="display:block;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-accent-800);font-family:var(--font-mono);margin-bottom:5px;">What changed</span>
    ${lines.map(l=>{
      const bullet=/^[•\-*]\s*/.test(l);
      return `<div style="font-size:11.5px;line-height:1.55;color:var(--color-neutral-800);${bullet?'padding-left:10px;':'font-weight:600;margin-bottom:3px;'}">${esc(l.replace(/^[•\-*]\s*/,bullet?'• ':''))}</div>`;
    }).join('')}
  </div>`;
}

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
    <div id="pt-nego-wrap" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;
      box-shadow:var(--shadow-sm);overflow:hidden;margin:0 0 18px">
      <div style="padding:14px 18px;border-bottom:1px solid var(--color-divider);background:var(--color-bg)">
        <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:16px">The negotiation</span>
        <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.55;margin-top:3px">The same workbench ${esc((p&&p.org)||'the sender')} works on — the contract with every change marked, the tracked changes beside it, and the discussion beside those. Accept or reject what they have proposed, press <b>Direct Edit</b> under a clause to counter-propose, or discuss without changing anything.</span>
      </div>
      <div id="pt-nego" style="padding:12px"></div>
      <div id="pt-nego-foot" style="padding:12px 18px;border-top:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:center;gap:10px;flex-wrap:wrap"></div>
    </div>`;
  if(!Array.isArray(src.changes) || !src.changes.length) return '';
  return `
    <div id="pt-nego-wrap" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;
      box-shadow:var(--shadow-sm);overflow:hidden;margin:0 0 18px">
      <div style="padding:14px 18px;border-bottom:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:flex-start;gap:11px;flex-wrap:wrap">
        <span style="flex:1;min-width:200px">
          <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:16px">The negotiation</span>
          <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.55;margin-top:3px">Every change on this contract, with its own fingerprint. This is the same screen ${esc((p&&p.org)||'the sender')} is looking at — same clauses, same changes, same statuses. Accept or reject the ones they have proposed, or discuss any of them without changing the contract.</span>
        </span>
        ${''/* the workbench mounts below, already visible — there is no room and no door */}
      </div>
      <div id="pt-nego" style="height:min(78vh,860px);padding:12px"></div>
      <div id="pt-nego-foot" style="padding:12px 18px;border-top:1px solid var(--color-divider);background:var(--color-bg);display:flex;align-items:center;gap:10px;flex-wrap:wrap"></div>
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
    <div id="pt-agreed" style="border:1px solid #a8cbb8;background:#eef7f1;border-left:4px solid #1e6b4d;border-radius:8px;
      padding:14px 18px;margin:0 0 18px;display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
      <span style="flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:#1e6b4d;color:#fff;font-size:14px;font-weight:700" aria-hidden="true">✓</span>
      <span style="flex:1;min-width:220px;line-height:1.5">
        <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:15.5px;color:#14503a">Ready to sign</span>
        <span style="display:block;font-size:11.5px;color:var(--color-neutral-700);margin-top:2px">${line} Read the wording below, then sign or respond on the right.</span>
      </span>
      ${changes.length?`<button id="pt-nego-open" class="ui-btn" style="flex:none;font-size:12px;padding:7px 14px">Review what changed</button>`:''}
    </div>
    ${''/* The hosts exist only so the room has somewhere to render when they
           press "Review what changed". A contract nobody proposed anything on
           has nothing to review, so it gets neither — an empty negotiation is
           not a panel worth showing, hidden or otherwise. */}
    ${changes.length?`<div id="pt-nego" class="hidden"></div><div id="pt-nego-foot" class="hidden"></div>`:''}`;
}

function portalNegoFootHtml(p){
  const n=Object.keys(PORTAL_NEGO_DECISIONS).length;
  const live=!!PORTAL_OPTS.token && !portalReadOnly();
  if(!live) return `<span id="nego-readonly-why" style="font-size:11.5px;color:var(--color-neutral-600)">${esc(
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
  const spent=PORTAL_READY_SENT;
  return `
    <span style="flex:1;min-width:150px;font-size:11.5px;color:${n?'#7d5a14':'var(--color-neutral-600)'}">
      ${n?`<b>${n} decision${n===1?'':'s'} ready to send.</b> Nothing has reached ${esc((p&&p.org)||'the sender')} yet.`
        :'Your decisions are held here until you send them. Comments send immediately and change nothing.'}
    </span>
    ${n?`<button id="pt-nego-send" class="ui-btn ui-btn-primary nego-pulse" style="flex:none;font-size:12.5px;padding:8px 15px">Send ${n} decision${n===1?'':'s'}</button>`:''}
    ${readyOk||spent?'':`<span id="pt-ready-why" style="flex-basis:100%;font-size:11px;line-height:1.5;color:var(--color-neutral-600)">${esc(whyNot)}</span>`}
    <button id="pt-nego-ready" class="ui-btn" ${readyOk&&!spent?'':'disabled'}
      title="${esc(spent?'You have told them you are ready — they issue the signing link.':readyOk?'Tell them you are ready to sign':whyNot)}"
      style="flex:none;font-size:12px;padding:8px 14px">${spent?'Readiness sent &#10003;':'Ready to sign'}</button>
    <button id="pt-nego-decline" class="ui-btn" style="flex:none;font-size:12px;padding:8px 14px;color:#b0453c;border-color:color-mix(in srgb,#b0453c 40%,transparent)">Decline</button>`;
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
  if(!PORTAL_OPTS.token){ toast('This copy has no channel back — reply to the email you received','err'); return; }
  const author=portalResponderName();
  if(!author){
    toast('Enter your full name — the box is at the top of this page','err');
    try{ document.getElementById('nego-cp-name')?.focus(); }catch(_){}
    return;
  }
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
  const live=!!PORTAL_OPTS.token && !portalReadOnly();
  const org=(p&&p.org)||'the sender';
  const held=Object.keys(PORTAL_NEGO_DECISIONS).length;
  const prog=(window.negoProgress&&c)?negoProgress(c):{ done:0, total:0 };
  const facts=`Round ${window.negoRound?negoRound(c):1} &middot; Resolved: ${prog.done} of ${prog.total}`;
  const banner = live
    ? `<div class="rl-wall" role="status"><span class="rl-wall-ic">&#128274;</span><span><b>Your table:</b> ${
        held?`<b>${held} answer${held===1?'':'s'}</b> held here — nothing has reached ${esc(org)} yet. `:''
      }Decisions and counter-proposals stay on this page until you press Send. A reply travels only if marked shared. <span id="pt-nego-facts" style="opacity:.75">${facts}</span></span></div>`
    : `<div class="rl-wall" role="status"><span class="rl-wall-ic">&#128274;</span><span>${esc(
        portalExecuted() ? 'This contract has been executed and sealed — the wording is final.'
        : PORTAL_OPTS.superseded ? 'This copy has been superseded — a newer link was sent to you.'
        : 'This copy is read-only.')}</span></div>`;
  redlineEmbed(host, c, {
    side:'counterparty',
    readonly:!live,
    holdsDecisions:true,
    canComment:!!PORTAL_OPTS.token && !PORTAL_OPTS.superseded,
    seenScope:PORTAL_OPTS.token||'',
    messages:PORTAL_OPTS.messages||[],
    persist:false,
    by:who, author:who,
    noAi:true,
    selMenu(){ /* no Copilot on this page; selecting text is just reading */ },
    bannerHtml:banner,
    org, height:'min(78vh, 860px)',
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
      for(const ch of (rec.changes||[])){
        // a held decision is one that differs from what was sent — see the
        // history on portalDecisionSettled
        if(ch.status!=='pending' && ch.authorSide==='owner' && !portalDecisionSettled(ch))
          PORTAL_NEGO_DECISIONS[ch.id]={ status:ch.status, reply:ch.reply||null };
        else if(ch.status==='pending' && ch.authorSide==='owner') delete PORTAL_NEGO_DECISIONS[ch.id];
        // wording THEY have asked for, held by value until sent
        if(ch.authorSide==='counterparty' && ch.status==='pending' && !PORTAL_NEGO_PROPOSED_SENT[ch.id])
          PORTAL_NEGO_PROPOSED[ch.id]={ ...ch, thread:[] };
      }
      portalSaveHeld();
      const foot=document.getElementById('pt-nego-foot');
      if(foot){ foot.innerHTML=portalNegoFootHtml(p); wirePortalNegoFoot(c,p); }
    },
    onWithdraw(_c, id, on){ if(on) PORTAL_NEGO_WITHDRAWN[id]=true; else delete PORTAL_NEGO_WITHDRAWN[id]; portalSaveHeld(); },
    onComment:portalNegoComment(p),
    onSendDecisions(){ portalRespond(p,'decisions'); },
    rerender(){ wirePortalNego(portalNegoContract(p), p); },
  });
  const foot=document.getElementById('pt-nego-foot');
  if(foot){ foot.innerHTML=portalNegoFootHtml(p); wirePortalNegoFoot(c,p); }
  /* "Review what changed" on a signing link unhides this same mount, readonly
     — the one workbench again, never a second surface. */
  document.getElementById('pt-nego-open')?.addEventListener('click',()=>{
    document.getElementById('pt-nego')?.classList.remove('hidden');
    document.getElementById('pt-nego-foot')?.classList.remove('hidden');
  },{ once:true });
}
function wirePortalNegoFoot(c, p){
  /* The pulse on this button is defined in the room's stylesheet — one
     animation for both postboxes rather than two that can drift. The sheet
     goes in <head> and re-adding is a no-op, so asking for it here costs
     nothing and removes the assumption that the room has already opened. */
  if(window.negoEnsureStyle) negoEnsureStyle();
  document.getElementById('pt-nego-send')?.addEventListener('click',()=>portalRespond(p,'decisions'));
  document.getElementById('pt-nego-ready')?.addEventListener('click',()=>portalRespond(p,'ready'));
  document.getElementById('pt-nego-decline')?.addEventListener('click',async()=>{
    /* A refusal the other side cannot understand is a refusal they will argue
       with — the reason is required, exactly as the room required it. */
    const reason=await (window.promptDialog?promptDialog({title:'Decline this contract?',
      message:'This ends the negotiation on this link. Say why — they will be told, and it goes on the record.',
      placeholder:'e.g. The liability cap is below our board minimum.'}):Promise.resolve(''));
    if(reason==null) return;
    if(!String(reason).trim()){ toast('A reason is required to decline','err'); return; }
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
const PORTAL_POLL_MS = 45000;
let _ptPollTimer=null, _ptPollSig=null, _ptPollToken=null, _ptPollInFlight=false;

/* One place that turns a server answer into render options, so the first paint
   and every refresh after it cannot drift apart. */
function portalRenderOpts(token, d){
  return { token, responded:d.responded, share:d.share||{},
    prior:d.prior||null, superseded:d.superseded||null,
    /* Read LIVE, not from the payload: a signature that landed after this link
       was last refreshed is precisely the case that matters. */
    executed:d.executed||null,
    emailConfigured:d.emailConfigured!==false, messages:d.messages||[] };
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
  return `<div id="pt-updated" role="status" style="position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:12px;
      border-bottom:1px solid #e0c48a;background:#fdf6e7;padding:10px 24px;font-size:12.5px;color:#7d5a14;box-shadow:var(--shadow-sm)">
    <span style="flex:none;display:inline-flex">${icon('alert','w-4 h-4')}</span>
    <span style="flex:1;min-width:0;line-height:1.5"><b>This contract has been updated.</b>
      Your unsent work is still here — send it or set it aside, then refresh to see the new copy.</span>
    <button id="pt-updated-go" class="ui-btn" style="flex:none;font-size:12px;padding:6px 13px">Refresh now</button>
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
    const what=(reason==='asked') ? 'repaint' : portalPollDecide(d, _ptPollSig);
    if(what==='repaint'){ portalRepaint(_ptPollToken, d); return 'repaint'; }
    if(what==='notify'){ portalShowUpdatedNotice(); return 'notify'; }
    return 'same';
  }catch(e){ return 'error'; }        // a dropped connection is not news; the next tick retries
  finally{ _ptPollInFlight=false; }
}
function portalStopPolling(){ if(_ptPollTimer){ clearInterval(_ptPollTimer); _ptPollTimer=null; } }
function portalStartPolling(token, d){
  portalStopPolling();
  _ptPollToken=token; _ptPollSig=portalSignature(d);
  try{
    _ptPollTimer=setInterval(()=>{ portalRefreshNow('tick'); }, PORTAL_POLL_MS);
    /* Coming back to the tab is the moment somebody most wants the truth, and
       it costs one request rather than a faster timer for everybody. */
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) portalRefreshNow('visible'); });
  }catch(_){ /* a page that cannot keep a timer still renders */ }
}

async function portalEntry(encoded){
  if(encoded.startsWith('t:')){        // server-backed share token
    const token=encoded.slice(2);
    try{
      const { status, ok, d }=await portalFetchShare(token);
      if(status===410){ renderSharePortal(null,{ gone:(d&&d.gone)||'expired', goneMsg:d&&d.error }); return; }
      if(!ok) throw new Error(d?.error||'not found');
      renderSharePortal(d.payload, portalRenderOpts(token, d));
      portalStartPolling(token, d);
    }catch(e){ renderSharePortal(null); }
    return;
  }
  renderSharePortal(b64d(encoded));    // static-mode share (payload in the URL)
}
function renderSharePortal(p, opts={}){
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
    root.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:0 16px;">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:32px;text-align:center;max-width:24rem;">
        <div style="color:${gone?'#b8862b':'#b0453c'};margin-bottom:12px;display:flex;justify-content:center;">${icon(gone?'clock':'ban','w-8 h-8')}</div>
        <h1 style="font-family:var(--font-heading);font-weight:600;font-size:20px;color:var(--color-text);margin:0;">${gone==='revoked'?'Link withdrawn':gone==='expired'?'Link expired':'Invalid share link'}</h1>
        <p style="font-size:13px;color:var(--color-neutral-700);margin-top:6px;line-height:1.5;">${opts.goneMsg||(gone?'This share link is no longer active. Ask the sender to reshare the contract.':'This link is malformed or truncated. Ask the sender to generate a fresh one.')}</p>
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
  const c=migrateContract({ ...p.contract, status:portalExecuted()?'Signed':'Under Review',
    folder:p.contract.folder || (TEMPLATES[p.contract.template]||{}).folder || 'corp' });
  const input=(id,label,ph)=>`
    <label style="display:block;margin-bottom:10px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">${label}</span>
    <input id="${id}" type="text" placeholder="${ph}" style="width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;"/></label>`;
  const TA='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:8px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none;';
  root.innerHTML=`
  <div style="min-height:100vh;background:var(--color-bg);">
    <header style="background:var(--color-accent-900);color:#fff;padding:14px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:12px;">
        <div style="width:34px;height:34px;background:var(--color-accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:600;font-size:15px;letter-spacing:.02em;border-radius:4px;flex:none;">HT</div>
        <div style="line-height:1.25;min-width:0;">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:15px;">${esc(p.org)} shared a contract for your review</div>
          <div style="font-size:11px;color:var(--color-accent-200);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(p.contract.id)} · shared by ${esc(p.sharedBy)} · ${fmtDT(p.at)}${opts.share&&opts.share.expiresAt?` · link expires ${String(opts.share.expiresAt).slice(0,10)}`:''} · via HaTi</div>
        </div>
      </div>
    </header>
    <div style="max-width:1100px;margin:0 auto;display:grid;gap:22px;padding:28px 24px;align-items:start;" class="portal-grid">
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
        <div id="pt-doc" class="blueprint" style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;">
          ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c):''}
          <article class="doc-surface">${readOnlyDocHtml(docBody(c))}</article>
          ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
        </div>
        <!-- Rewriting a contract used to happen in a twelve-row box inside the
             360px column on the right. It happens here now, at the size of the
             document it replaces. -->
        <div id="portal-redline" class="hidden" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-md);overflow:hidden">
          <div style="padding:16px 22px;border-bottom:1px solid var(--color-divider);display:flex;align-items:flex-start;gap:12px;background:var(--color-bg)">
            <span style="flex:1;min-width:0">
              <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:16px;">Propose your edits</span>
              <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;margin-top:3px;">Change the clauses you want to change. ${esc(p.org)} sees your edits as a tracked redline — additions and deletions highlighted — and can accept or reject each one on its own. The document's headings, numbering and layout are kept; you are editing the words, not the formatting.</span>
            </span>
            <button id="pt-redline-cancel" class="ui-btn" style="flex:none;font-size:12px;padding:7px 14px">Cancel</button>
          </div>
          <div id="pt-clause-editor" class="scroll-thin" style="padding:18px 22px;max-height:min(62vh,620px);overflow-y:auto;background:#fbfbfc"></div>
          <div id="portal-plain" class="hidden">
            <textarea id="pt-redline-text" class="scroll-thin" spellcheck="false" style="display:block;width:100%;height:min(62vh,620px);border:0;outline:none;resize:vertical;padding:26px 32px;font:inherit;font-size:15px;line-height:1.95;color:var(--color-doc-text);background:#fbfbfc;"></textarea>
          </div>
          <div style="padding:14px 22px;border-top:1px solid var(--color-divider);display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--color-bg)">
            <span id="pt-redline-count" style="font-size:11.5px;color:var(--color-neutral-600)">Your name is taken from the panel on the right.</span>
            <button id="pt-plain-toggle" style="border:0;background:none;padding:0;font:inherit;font-size:11.5px;color:var(--color-accent-700);cursor:pointer;text-decoration:underline">Edit the whole document instead</button>
            <span style="flex:1"></span>
            <button id="pt-redline-submit" class="ui-btn ui-btn-primary" style="font-size:13px;padding:10px 20px">Submit proposed edits</button>
          </div>
        </div>
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);padding:18px;" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:var(--color-text);margin:0 0 4px;">Respond to ${esc(p.org)}</h2>
        ${opts.share&&opts.share.message?`<div style="margin-bottom:12px;border-left:3px solid var(--color-accent);border-radius:4px;background:var(--color-accent-100);padding:9px 11px;font-size:11.5px;color:var(--color-neutral-800);line-height:1.5;"><span style="display:block;font-size:10px;font-weight:600;color:var(--color-accent-800);font-family:var(--font-mono);margin-bottom:2px;">Message from ${esc(p.sharedBy)}</span>${esc(opts.share.message)}</div>`:''}
        ${portalChangeSummaryHtml(p)}
        ${opts.responded?`<div style="margin-bottom:14px;border-radius:4px;background:var(--color-accent-100);border:1px solid var(--color-divider);padding:9px 11px;font-size:11px;color:var(--color-accent-800);display:flex;align-items:center;gap:6px;">${icon('check2','w-3.5 h-3.5')} A response was already submitted for this link.</div>`:''}
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5;">${opts.token?`Your response is delivered to ${esc(p.sharedBy)} automatically — nothing to send back.`:`Your response is packaged as a secure code — send it back to ${esc(p.sharedBy)} to record it on the contract.`}</p>
        ${input('pt-name','Full name *','e.g. Grace Njeri')}
        ${input('pt-title','Title / role','e.g. Legal Counsel')}
        ${input('pt-email','Work email','you@company.co.ke')}
        <label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Comment</span>
        <textarea id="pt-comment" rows="3" placeholder="Optional for signing; required for changes or decline…" style="${TA}"></textarea></label>
        ${isMonetary(c)?`<label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Propose a different value (optional, for change requests)</span>
        <input id="pt-proposed" type="number" placeholder="e.g. ${c.value||'2500000'}" style="${TA}min-height:36px;"/></label>`:''}
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
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="pt-sign" class="ui-btn ui-btn-primary" style="width:100%;padding:11px;font-size:13.5px;">${icon('finger','w-4 h-4')} Sign this contract</button>
          <button id="pt-other-toggle" aria-expanded="false" aria-controls="pt-other"
            style="width:100%;background:none;border:0;padding:6px 0;font:inherit;font-size:12px;color:var(--color-accent-700);cursor:pointer;text-align:center;text-decoration:underline">Not ready to sign?</button>
          <div id="pt-other" class="hidden" style="display:flex;flex-direction:column;gap:9px;border-top:1px solid var(--color-divider);padding-top:11px">
            ${[['pt-redline','history','Change the wording yourself','Edit the clauses you want changed. They see exactly what you altered and accept or reject each one.'],
               ['pt-changes','alert','Tell them what you want changed','Describe it in the comment box above. The wording stays as it is for now.'],
               ['pt-accept','check2','Agree to the wording — but don’t sign yet','Tells them you are happy with the text. Nothing is signed and nothing is binding.']]
              .map(([id,ic,label,why])=>`<div>
                <button id="${id}" class="ui-btn" style="width:100%;padding:9px;font-size:12.5px;text-align:left;display:flex;align-items:center;gap:7px">${icon(ic,'w-3.5 h-3.5')} ${label}</button>
                <span style="display:block;font-size:11px;line-height:1.5;color:var(--color-neutral-600);margin:4px 2px 0">${why}</span>
              </div>`).join('')}
            <div style="border-top:1px solid var(--color-divider);padding-top:9px">
              <button id="pt-decline" class="ui-btn" style="width:100%;padding:9px;font-size:12.5px;color:#b0453c;border-color:color-mix(in srgb,#b0453c 40%,transparent);">Decline this contract</button>
              <span style="display:block;font-size:11px;line-height:1.5;color:var(--color-neutral-600);margin:4px 2px 0">Ends the deal. You will be asked why, and they will be told.</span>
            </div>
          </div>
        </div>
        <div id="portal-result" style="margin-top:16px;"></div>
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
  document.getElementById('pt-see-changes')?.addEventListener('click',()=>openPortalCompare(p));
  document.getElementById('pt-compare')?.addEventListener('click',()=>openPortalVersionCompare(p));
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
      document.getElementById('pt-plain-toggle').textContent='Back to editing clause by clause';
      setTimeout(()=>ta.focus(),120);
    } else {
      plain.classList.add('hidden'); clauses.classList.remove('hidden');
      document.getElementById('pt-plain-toggle').textContent='Edit the whole document instead';
    }
  });
  document.getElementById('pt-redline').addEventListener('click',()=>
    showRedline(document.getElementById('portal-redline').classList.contains('hidden')));
  /* CANCEL IS A DISCARD, so it says so and asks first — but only when there is
     something to lose. Closing an editor nobody typed into is not a decision
     worth a dialog. */
  document.getElementById('pt-redline-cancel').addEventListener('click',async()=>{
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
  document.getElementById('pt-redline-submit').addEventListener('click',()=>portalRespond(p,'redline'));
  // prefill the recipient's details from the share (they can still edit them)
  if(opts.share){
    const setIf=(id,v)=>{ const el=document.getElementById(id); if(el&&v&&!el.value) el.value=v; };
    setIf('pt-name',opts.share.recipientName); setIf('pt-email',opts.share.recipientEmail);
  }
}
async function portalRespond(p, action, extra){
  const name=portalResponderName(), title=fval('pt-title'), email=fval('pt-email');
  /* The comment box lives on the respond panel, which is on the page
     UNDERNEATH the full-window room — the same trap that made the name check
     unpassable. Declining requires a reason, so a decline pressed in the room
     failed on a box nobody could reach. The room asks for it and passes it in
     here, and everything reached from the panel still reads the panel. */
  const comment=(extra&&extra.comment!=null)?String(extra.comment):fval('pt-comment');
  if(!name){
    /* Say where the box is. The room can be the whole window, so "enter your
       name" without pointing at a field is an instruction with no object — and
       putting the cursor in it is faster than describing it. */
    const inRoom=document.getElementById('nego-cp-name');
    toast('Enter your full name — the box is at the top of this page','err');
    try{ (inRoom||document.getElementById('pt-name'))?.focus(); }catch(_){}
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
    const proposed=Object.keys(PORTAL_NEGO_PROPOSED).map(id=>{
      const x=PORTAL_NEGO_PROPOSED[id];
      return { id, clauseId:x.clauseId, changeType:x.changeType||'modify',
        oldText:x.oldText||'', newText:x.newText||'', bodyHtml:x.bodyHtml||null,
        headingText:x.headingText||null, afterClauseId:x.afterClauseId||null,
        clauseLabel:x.clauseLabel||null, note:x.note||null };
    });
    if(action==='decisions' && !decisions.length && !withdrawn.length && !proposed.length){
      toast('Nothing to send — ask for a change or decide one first','err'); return; }
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
    if(!PORTAL_OPTS.token){ toast('This copy has no channel back — reply to the email you received','err'); return; }
    /* Whichever control was actually pressed reports back on itself. The send
       lives in the change index on a negotiation link and in the foot of the
       card on a signing link, so both are offered and the one on the page
       wins. */
    const pressed=action==='ready'
      ? (document.getElementById('pt-nego-ready') ? 'pt-nego-ready' : 'nego-cp-ready')
      : (document.getElementById('nego-send-decisions') ? 'nego-send-decisions' : 'pt-nego-send');
    portalSetBusy(pressed, action==='ready'?'Sending…':'Sending…');
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
      if(np) sentBits.push(`${np} change${np===1?'':'s'} you asked for`);
      if(n) sentBits.push(`${n} decision${n===1?'':'s'}`);
      const sentWhat=sentBits.join(' and ')||'your answer';
      if(action==='ready'){
        portalSetDone(pressed,'Sent — they know you are ready');
        toast(`${p.org||'The sender'} has been told you are ready to sign`
          +`${sentBits.length?` — ${sentWhat} sent with it`:''}. Nothing is signed yet; they will send a signing link.`);
      } else {
        portalSetDone(pressed,`${sentWhat} sent`);
        toast(`${sentWhat} sent to ${p.org||'the sender'} — it is now their turn.`);
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
  if(action==='sign' && !email){ toast('A work email is required to sign','err'); return; }
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
  if(action==='changes' && !comment){ toast('Add a comment explaining your response','err'); return; }
  if(action==='decline' && !comment){ toast('Add a comment explaining your response','err'); return; }
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
    if(!proposedText){ toast('Edit the text before submitting','err'); return; }
    const beforeText=String(portalCurrentText()||docPlainText(cRec)||'').trim();
    if(proposedText===beforeText){ toast('Nothing has been changed yet — press Change on a clause first','err'); return; }
    // the base must be the same TEXT the counterparty edited, not the markup
    // behind it, or the returned redline diffs against tags
    baseText=p.contract.redlineText
      ? ((window.isRich&&isRich(p.contract.format)) ? richToText(p.contract.redlineText) : p.contract.redlineText)
      : normText(freezeContractHtml(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'})));
    sendAction='changes';
  }
  const proposedValue = (action==='changes') ? fval('pt-proposed') : '';
  const clauseNotes = (action==='redline')
    ? portalClauseNotes(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'}))
    : null;
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:sendAction, name, title, email, comment,
    proposedValue: proposedValue||null, proposedText, baseText, at:nowISO(),
    templateValues:portalTemplateValues(p),
    clauseNotes: (clauseNotes&&clauseNotes.length)?clauseNotes:null,
    signatureForm:sig?sig.form:null, signatureImage:sig?sig.image:null, signatureImageHash:sig?sig.imageHash:null,
    signatureTypedName:sig?sig.typedName:null, signatureFont:sig?sig.font:null };
  const label={sign:'signature',accept:'acceptance',changes:'change request',decline:'decline notice'}[sendAction];
  // Which control the reader actually pressed, so it is the one that reports back.
  const pressed={sign:'pt-sign',accept:'pt-accept',redline:'pt-redline-submit',
    changes:'pt-changes',decline:'pt-decline'}[action] || null;
  const doneLabel={sign:'Signed and sent',accept:'Acceptance sent',
    changes:'Change request sent',decline:'Decline sent'}[sendAction]||'Sent';
  if(PORTAL_OPTS.token){
    portalSetBusy(pressed,'Sending…');
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      portalSetDone(pressed, doneLabel);
      /* SENT IS THE MOMENT THE DRAFT STOPS BEING A DRAFT. Cleared here, and
         only here, because the editor no longer wipes itself on open — see
         showRedline. Cleared on failure would be worse than the bug it
         replaced: nothing was recorded, and their wording would be gone. */
      if(action==='redline'){ PORTAL_CLAUSE_EDITS={}; PORTAL_CLAUSE_NOTES={}; }
      document.getElementById('portal-result').innerHTML=`
        <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:16px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px;">${icon('check2','w-4 h-4')} ${label[0].toUpperCase()+label.slice(1)} delivered</div>
          <p style="font-size:11px;color:var(--color-neutral-700);margin:0;">${esc(p.sharedBy)} at ${esc(p.org)} has been notified — you're all done.</p>
        </div>`;
    }catch(e){
      // Nothing was recorded, so the controls come back — a spent-looking
      // button on a failed send is worse than no feedback at all.
      portalSetIdle();
      toast(e.message,'err');
      const box=document.getElementById('portal-result');
      if(box) box.innerHTML=`<div style="border:1px solid #e3c4bf;background:#f9ecea;border-radius:6px;padding:12px 14px;font-size:12px;line-height:1.55;color:#8f322b"><b>Not sent.</b> ${esc(e.message||'Something went wrong.')}</div>`;
    }
    return;
  }
  portalSetDone(pressed, doneLabel);
  const code=b64e(response);
  document.getElementById('portal-result').innerHTML=`
    <div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;color:var(--color-accent-800);font-size:12px;font-weight:600;margin-bottom:6px;">${icon('check2','w-3.5 h-3.5')} Your ${label} is ready</div>
      <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5;">Copy this response code and send it back to ${esc(p.sharedBy)} at ${esc(p.org)} (email or WhatsApp). They import it in HaTi to record it on the contract.</p>
      <textarea id="pt-code" readonly rows="4" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:10px;font-size:10px;font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all;">${code}</textarea>
      <button id="pt-copy" class="ui-btn ui-btn-primary" style="margin-top:8px;width:100%;padding:8px;font-size:12px;">${icon('copy','w-3 h-3')} Copy response code</button>
    </div>`;
  document.getElementById('pt-copy').addEventListener('click',async()=>{
    const ta=document.getElementById('pt-code'); ta.select();
    try{ await navigator.clipboard.writeText(ta.value); }catch(e){ document.execCommand('copy'); }
    toast('Response code copied');
  });
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
  const INP='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
  const required=fields.filter(f=>f.required);
  const filled=required.filter(f=>String(values[f.fieldKey]||'').trim()!=='');
  const inputFor=(f,idx)=>{
    const lib=(window.FIELD_LIB||{})[f.fieldType]||{input:'text',hint:''};
    const v=values[f.fieldKey]==null?'':String(values[f.fieldKey]);
    if(f.control==='guided'||f.fieldType==='select'){
      const opts=(f.options||[]).map(o=>`<option value="${esc(o)}"${v===o?' selected':''}>${esc(o)}</option>`).join('');
      return `<select data-ptf="${idx}" style="${INP}" ${editable?'':'disabled'}><option value="">Choose…</option>${opts}</select>`;
    }
    if(lib.input==='textarea') return `<textarea data-ptf="${idx}" style="${INP};min-height:48px;resize:vertical" placeholder="${esc(lib.hint)}" ${editable?'':'disabled'}>${esc(v)}</textarea>`;
    if(lib.input==='file'||lib.input==='image')
      return `<div style="display:flex;align-items:center;gap:8px">${v?`<span class="badge" style="background:var(--color-neutral-100);color:var(--color-neutral-700)">attached</span>`:''}<input type="file" data-ptf-file="${idx}" accept="${lib.input==='image'?'image/png,image/jpeg,image/webp':'*/*'}" style="font-size:11px" ${editable?'':'disabled'}></div>`;
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
  <div id="pt-tplform" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);margin-bottom:18px;overflow:hidden">
    <div style="display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
      <span style="font-family:var(--font-heading);font-weight:600;font-size:13px;flex:1">Fill in your details</span>
      <span style="font-size:10.5px;color:${filled.length===required.length?'#1e6b4d':'#8a5a19'};font-weight:600">${filled.length}/${required.length} required</span>
      <span id="pt-tplform-state" style="font-size:10px;color:var(--color-neutral-500)"></span>
    </div>
    <div style="padding:12px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
      ${groups.map(g=>`
        ${g.name?`<div style="grid-column:1/-1;font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-500)">${esc(g.name)}</div>`:''}
        ${g.fields.map(f=>{
          const idx=form.fields.indexOf(f);
          return `<label style="display:block;min-width:0">
            <span style="display:block;font-size:11px;font-weight:600;margin-bottom:3px">${esc(f.label||f.fieldKey)}${f.required?' <span style="color:#8f322b">*</span>':''}</span>
            ${inputFor(f,idx)}
            ${f.helpText?`<span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:2px">${esc(f.helpText)}</span>`:''}
            <span data-ptf-err="${idx}" style="display:none;font-size:10.5px;color:#8f322b;margin-top:2px"></span>
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
      if(file.size>500*1024){ toast('Keep attachments under 500 KB','err'); return; }
      const r=new FileReader();
      r.onload=()=>commit(Number(el.getAttribute('data-ptf-file')),String(r.result));
      r.readAsDataURL(file);
    }));
}

async function portalSignUnverified(p, info){
  const box=document.getElementById('portal-result');
  box.innerHTML=`
    <div style="border:1px solid #e0c48a;background:#fdf6e7;border-radius:6px;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#7d5a14;margin-bottom:5px;">${icon('alert','w-3.5 h-3.5')} Signing without an email check</div>
      <p style="font-size:11.5px;color:#7d5a14;margin:0 0 10px;line-height:1.55;">This sender's HaTi cannot send verification codes, so we cannot confirm that <strong>${esc(info.email)}</strong> is yours. Your signature is still binding, and the contract's record will show that it was <strong>not independently verified</strong>.</p>
      <button id="pt-unver-go" class="ui-btn ui-btn-primary" style="width:100%;padding:9px;font-size:13px;">${icon('finger','w-4 h-4')} Sign anyway</button>
      <button id="pt-unver-cancel" style="margin-top:6px;width:100%;background:none;border:0;font-size:11px;color:var(--color-neutral-600);cursor:pointer;font-family:var(--font-body);">Cancel</button>
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
        <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:16px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px;">${icon('check2','w-4 h-4')} Signed</div>
          <p style="font-size:11px;color:var(--color-neutral-700);margin:0;">Your signature has been delivered to ${esc(p.sharedBy)} at ${esc(p.org)}. It is recorded as not independently verified, because this server cannot send verification codes.</p>
        </div>`;
    }catch(e){ portalSetIdle(); toast(e.message,'err'); box.innerHTML=''; }
  });
}

/* two-step counterparty signing with email one-time code (server mode) */
async function portalStartOtp(p, info){
  const box=document.getElementById('portal-result');
  box.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:13px;font-size:11px;color:var(--color-neutral-700);">Sending a one-time code to <strong>${esc(info.email)}</strong>…</div>`;
  let emailSent=true;
  try{
    const r=await api('shares/'+PORTAL_OPTS.token+'/otp','POST',{ email:info.email });
    emailSent=r.emailSent!==false;
  }catch(e){ toast(e.message,'err'); box.innerHTML=''; return; }
  box.innerHTML=`
    <div style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:4px;">${icon('key','w-3.5 h-3.5')} Verify your email to sign</div>
      <p style="font-size:11px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5;">We sent a 6-digit code to <strong>${esc(info.email)}</strong>. Enter it to complete your signature.</p>
      ${(PORTAL_OPTS.share&&PORTAL_OPTS.share.recipientEmail&&PORTAL_OPTS.share.recipientEmail.toLowerCase()!==String(info.email||'').toLowerCase())?`<p style="margin:0 0 8px;font-size:10.5px;border-radius:4px;background:color-mix(in srgb,#b8862b 10%,transparent);border:1px solid color-mix(in srgb,#b8862b 30%,transparent);color:#7d5a14;padding:6px 10px;line-height:1.5;">Note: this contract was sent to <strong>${esc(PORTAL_OPTS.share.recipientEmail)}</strong>. Signing with a different address is allowed (e.g. a colleague signs) and the verified address will be recorded on the signature.</p>`:''}
      ${emailSent?'':`<p style="margin:0 0 8px;font-size:11px;border-radius:4px;background:color-mix(in srgb,#b8862b 10%,transparent);border:1px solid color-mix(in srgb,#b8862b 30%,transparent);color:#7d5a14;padding:6px 10px;line-height:1.5;">Email delivery is not configured on this server, so the code could not be sent to you. Ask <strong>${esc((PORTAL_OPTS.payload&&PORTAL_OPTS.payload.sharedBy)||'the sender')}</strong> for it — they can read it in HaTi under Team &amp; Settings.</p>`}
      <input id="pt-otp" inputmode="numeric" maxlength="6" placeholder="______" style="width:100%;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:8px 11px;text-align:center;font-size:18px;font-family:var(--font-mono);letter-spacing:.4em;color:var(--color-text);outline:none;"/>
      <button id="pt-otp-go" class="ui-btn ui-btn-primary" style="margin-top:8px;width:100%;padding:9px;font-size:13px;">${icon('finger','w-4 h-4')} Verify &amp; sign</button>
      <button id="pt-otp-resend" style="margin-top:6px;width:100%;background:none;border:0;font-size:11px;color:var(--color-neutral-600);cursor:pointer;font-family:var(--font-body);">Resend code</button>
    </div>`;
  document.getElementById('pt-otp-go').addEventListener('click',()=>portalVerifyAndSign(p, info));
  document.getElementById('pt-otp-resend').addEventListener('click',()=>portalStartOtp(p, info));
  document.getElementById('pt-otp').focus();
}
async function portalVerifyAndSign(p, info){
  const codeVal=fval('pt-otp');
  if(!/^\d{6}$/.test(codeVal)){ toast('Enter the 6-digit code','err'); return; }
  let verify;
  try{ const v=await api('shares/'+PORTAL_OPTS.token+'/verify-otp','POST',{ email:info.email, code:codeVal }); verify=v.verify; }
  catch(e){ toast(e.message,'err'); return; }
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:'sign',
    name:info.name, title:info.title, email:info.email, comment:info.comment, verify, at:nowISO(),
    templateValues:portalTemplateValues(p),
    signatureForm:info.sig?info.sig.form:null, signatureImage:info.sig?info.sig.image:null, signatureImageHash:info.sig?info.sig.imageHash:null,
    signatureTypedName:info.sig?info.sig.typedName:null, signatureFont:info.sig?info.sig.font:null };
  try{
    await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
    portalSetDone('pt-sign','Signed and sent');
    portalMarkSigned(p, info);
    document.getElementById('portal-result').innerHTML=`
      <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:16px;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px;">${icon('check2','w-4 h-4')} Signed &amp; verified</div>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0;">Your email-verified signature has been delivered to ${esc(p.sharedBy)} at ${esc(p.org)}. You're all done.</p>
      </div>`;
  }catch(e){ toast(e.message,'err'); }
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
    <p style="font-size:11px;color:#8f322b;line-height:1.6;">No machine-readable text could be extracted from this file, so the wording cannot be printed here. Refer to the original document (<strong>${u.fileName||'attached file'}</strong>).</p>`;
  const body=rich
    ? renderDocHtml(raw, RICH_FORMAT)
    : (window.documentTextHtml)
    ? documentTextHtml(raw,{size:'11px', lh:'1.55'})
    : `<div style="white-space:pre-wrap;font-size:11px;line-height:1.55">${raw.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>`;
  return `
    <div style="margin-top:22px;">
      <div style="font-family:var(--font-doc);font-weight:600;font-size:13px;border-bottom:1px solid var(--color-doc-rule);padding-bottom:6px;margin-bottom:10px;color:var(--color-doc-text);">
        Contract text${c.redlineText?' (working text)':''}
      </div>
      ${body}
      <p class="doc-muted" style="font-size:9px;margin-top:10px;line-height:1.5;">Text extracted from <strong>${u.fileName||'the uploaded file'}</strong>${c.redlineText?' and edited in HaTi':''}. Signatures, stamps and page layout are not reproduced — the stored original file remains the authoritative document.</p>
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
      <div style="border:1px solid #d4d4d7;border-radius:8px;padding:9px 11px;">
        <div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-bottom:3px;">${esc(partyLabel(s))}</div>
        ${s.image?`<img src="${s.image}" alt="" style="height:38px;max-width:190px;object-fit:contain;display:block;margin:2px 0 5px;"/>`:''}
        <div style="font-weight:600;font-size:12px;">${esc(s.name||'—')}${cap(s)?', '+esc(cap(s)):''}</div>
        <div style="font-size:9.5px;color:#666;line-height:1.5;">${esc([s.email,s.form?s.form+' signature':s.method,s.at?fmtDT(s.at):''].filter(Boolean).join(' · '))}</div>
      </div>
    </td>`;
  const rows=[];
  for(let i=0;i<sigs.length;i+=2) rows.push(`<tr>${cell(sigs[i])}${sigs[i+1]?cell(sigs[i+1]):'<td></td>'}</tr>`);
  const sigTable=sigs.length
    ? `<table style="width:100%;border-collapse:collapse;margin-top:10px;">${rows.join('')}</table>`
    : `<div style="margin-top:10px;border:1px solid #d4d4d7;border-radius:8px;padding:9px 11px;font-size:11px;color:#666;">${c.signatory?('Signed by '+esc(c.signatory)):'Signatories not recorded'}</div>`;
  return `
    <div style="margin-top:26px;page-break-inside:avoid;border:1px solid ${external?'#8fa8c2':'#a8cbb8'};border-radius:12px;padding:16px 18px;background:${external?'#f2f6fa':'#f2f8f4'};">
      <table style="width:100%;border-collapse:collapse;"><tr>
        <td style="width:70px;vertical-align:top;">
          <svg width="62" height="62" viewBox="0 0 96 96" aria-hidden="true">
            <circle cx="48" cy="48" r="46" fill="#fff"/>
            <circle cx="48" cy="48" r="46" fill="none" stroke="${external?'#5980a6':'#086B54'}" stroke-width="2"/>
            <circle cx="48" cy="48" r="38" fill="${external?'rgba(89,128,166,.10)':'rgba(8,107,84,.10)'}" stroke="${external?'#8fa8c2':'#C79A3E'}" stroke-width="1.5"/>
            <text x="48" y="45" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="12" fill="${external?'#3f6087':'#2e8763'}">${external?'ON FILE':'SEALED'}</text>
            <text x="48" y="58" text-anchor="middle" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="7" fill="${external?'#5980a6':'#1e6b4d'}">${external?'MIGRATED':'SHA-256'}</text>
          </svg>
        </td>
        <td style="vertical-align:top;">
          <div style="font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:16px;">${external?'Executed outside HaTi':'Executed &amp; Sealed'}</div>
          <div style="font-size:10.5px;color:#666;margin-top:2px;line-height:1.5;">${external
            ? 'Signed before it was migrated into HaTi. <strong>No electronic signature was taken here</strong> — the signatures are on the original document.'
            : jxEsignatureShort()}</div>
          ${external?'':sigTable}
          ${(!external&&!isUpload(c))?`<div style="margin-top:10px;border:1px solid #d4d4d7;border-radius:8px;padding:9px 11px;">
            <div style="font-size:9px;letter-spacing:.08em;text-transform:uppercase;color:#666;margin-bottom:3px;">Sealed text fingerprint (SHA-256)</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9.5px;word-break:break-all;">${esc((c.execution&&c.execution.textHash)||'—')}</div>
          </div>`:''}
          <div style="margin-top:10px;border-radius:8px;padding:10px 12px;background:#1d1f20;color:#f4f5f6;">
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;letter-spacing:.08em;color:#c79a3e;margin-bottom:3px;">${external?'ORIGINAL FILE FINGERPRINT (SHA-256)':'DOCUMENT SEAL (SHA-256)'}</div>
            <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;word-break:break-all;">${esc(hash)}</div>
            <div style="font-size:9.5px;color:#b9bec4;margin-top:4px;">${esc(c.signedAt||'Timestamp recorded')}</div>
          </div>
        </td>
      </tr></table>
    </div>`;
}

function exportPDF(c){
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
      <div style="border:1px solid #d4d4d7;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:15px;margin-bottom:2px;">${esc(c.name)}</div>
        <div style="font-size:11px;color:#666;margin-bottom:10px;">External document received from ${c.counterparty||'—'} · filed under ${FOLDERS[c.folder].name}</div>
        <table style="font-size:11px;border-collapse:collapse;">
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Original file</td><td style="font-weight:600;">${u.fileName||'—'} (${u.size?Math.round(u.size/1024):0} KB)</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Value</td><td style="font-weight:600;">${!isMonetary(c)?'Non-monetary':(c.value?fmtMoney(c.value):'—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Status</td><td style="font-weight:600;">${c.status}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">File fingerprint (SHA-256)</td><td style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;word-break:break-all;">${u.fileHash||'—'}</td></tr>
        </table>
      </div>
      <p style="font-size:11px;color:#444;line-height:1.6;">${isExternallyExecuted(c)
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
    holder.querySelectorAll('input').forEach(inp=>{
      const span=document.createElement('span');
      span.style.cssText="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:600;border-bottom:1px solid #999;padding:0 3px;";
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
  const marks=printIsHatiExecuted(c);
  const audit=(c.audit||[]).map(e=>`
    <tr><td style="padding:3px 10px 3px 0;white-space:nowrap;color:#666;">${fmtDT(e.at)}</td>
    <td style="padding:3px 10px 3px 0;font-weight:600;">${e.action}</td>
    <td style="padding:3px 0;">${e.detail} <span style="color:#888;">(${e.user})</span></td></tr>`).join('');
  // The masthead, the audit trail and the contract now share one family — the
  // platform runs on the design's two faces throughout. The contract is still a
  // document surface and still carries the document ink, measure and leading,
  // exactly as it does on screen, so the PDF matches the page it came from.
  document.getElementById('print-root').innerHTML=`
    <div style="font-family:Inter,system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 24px;color:#1d1f20;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #5980a6;padding-bottom:10px;margin-bottom:24px;">
        <div style="font-family:Inter,system-ui,sans-serif;font-weight:700;font-size:18px;">HaTi <span style="font-weight:400;font-size:11px;color:#666;">· Contract Lifecycle</span></div>
        <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:#666;">${c.id} · generated ${fmtDT(nowISO())}</div>
      </div>
      ${window.templateBrandingHeaderHtml?templateBrandingHeaderHtml(c):''}
      <div class="doc-surface">${bodyHtml}</div>
      ${window.templateBrandingFooterHtml?templateBrandingFooterHtml(c):''}
      ${execBlock}
      ${marks&&(!execBlock)&&c.hash&&c.hash!=='PRE-SEEDED'?`<div style="margin-top:24px;padding:12px;border:1px solid #d4d4d7;border-radius:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;word-break:break-all;"><strong>${isExternallyExecuted(c)?'SHA-256 ORIGINAL FILE FINGERPRINT':'SHA-256 DOCUMENT SEAL'}</strong><br/>${isExternallyExecuted(c)?((c.upload&&c.upload.fileHash)||'—'):c.hash}<br/><span style="color:#666;">${c.signedAt||''}${isExternallyExecuted(c)?' · executed outside HaTi':''}</span></div>`:''}
      ${marks&&audit?`<div style="margin-top:24px;page-break-inside:avoid;"><div style="font-family:Inter,system-ui,sans-serif;font-weight:600;font-size:13px;border-bottom:1px solid #d4d4d7;padding-bottom:6px;margin-bottom:8px;">Audit trail</div><table style="font-size:10px;border-collapse:collapse;width:100%;">${audit}</table></div>`:''}
      <div style="margin-top:24px;font-size:9px;color:#999;text-align:center;">Generated by HaTi CLM · ${FIRST_PARTY}</div>
    </div>`;
  logAudit(c,'Exported','PDF export generated'); persist(c); renderAuditSection(c);
  window.print();
}

function metrics(){
  // Prefer server-computed aggregates (accurate at any scale, even when the
  // client only holds a capped working set); fall back to the in-memory set.
  const s=state.serverStats;
  if(s) return { totalValue:s.totalValue||0, pending:s.pending||0, signed:s.signed||0,
    declined:s.declined||0, drafts:s.drafts||0, expired:s.expired||0, expiredValue:s.expiredValue||0 };
  const cs=state.contracts;
  /* ACTIVE VALUE IS THE VALUE OF WHAT IS STILL RUNNING. This counted every
     contract that was not Declined, so a supply agreement that ended in 2023
     went on contributing its whole face value to the headline figure on the
     dashboard for ever. See contractExpired in js/core.js — the same read the
     status chip and the calendar use, so the number and the badges agree. */
  const gone=c=>!!(window.contractExpired&&contractExpired(c));
  const active=cs.filter(c=>c.status!=='Declined'&&!gone(c));
  const expired=cs.filter(gone);
  return {
    totalValue:active.reduce((s,c)=>s+Number(c.value||0),0),
    pending:cs.filter(c=>c.status==='Under Review').length,
    signed:cs.filter(c=>c.status==='Signed').length,
    declined:cs.filter(c=>c.status==='Declined').length,
    drafts:cs.filter(c=>c.status==='Draft').length,
    expired:expired.length,
    expiredValue:expired.reduce((s,c)=>s+Number(c.value||0),0),
  };
}
async function refreshStats(){
  if(!API_MODE()) return;
  try{ state.serverStats=await api('stats'); if(state.view==='dashboard') renderDashboard(); }catch(e){}
}

Object.assign(window,{PORTAL_POLL_MS,portalRenderOpts,portalSignature,portalBusy,portalPollDecide,portalUpdatedNoticeHtml,portalShowUpdatedNotice,portalRefreshNow,portalStartPolling,portalStopPolling,portalExecuted,portalReadOnly,printExecutionBlock,printIsHatiExecuted,portalChangeSummaryHtml,portalNegoHtml,portalNegoContract,portalNegoFootHtml,wirePortalNego,wirePortalNegoFoot,PORTAL_OPTS,portalSignUnverified,portalDiscussHtml,wirePortalDiscuss,portalDiscussTopics,portalClauseNotes,portalClauseUnits,portalClauseText,portalClauseEditorHtml,wirePortalClauseEditor,portalProposedText,portalThreadHtml,portalOpenPointsHtml,exportPDF,metrics,uploadedTextForPrint,portalEntry,portalRespond,portalStartOtp,portalVerifyAndSign,refreshStats,renderSharePortal});
