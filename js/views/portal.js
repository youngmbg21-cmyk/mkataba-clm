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
/* C1 + C2 — the Word round-trip, mirrored to the counterparty.

   Nothing about this uploads a file. The .docx they send back is opened and
   read IN THEIR OWN BROWSER, and only the extracted wording is submitted — down
   the same route as text typed into the box. So a public share link gains no
   file-upload surface, no size limit to police and no new way in; the returned
   file never leaves their machine. What they get in exchange is the flow their
   counsel actually works in.

   Only offered where the contract arrived as a .docx, because HaTi has no Word
   writer: a template-drafted contract has no file to hand over. */
const portalWordFile = c => { const u=c&&c.upload;
  return (u && (u.docKind==='docx' || /wordprocessingml/.test(u.mime||'') || /\.docx$/i.test(u.fileName||''))) ? u : null; };
/* Word cannot be written by HaTi, so the .docx on record is the file that was
   uploaded — and it does NOT contain any wording edited in HaTi since. Handing
   that over silently is the worst outcome: counsel marks up a superseded draft
   in good faith. Where the wording has moved, the card says so and offers the
   CURRENT text as a document Word opens (an HTML body under a .doc name, which
   Word has always read) so the round trip is against the live wording. */
const portalFileHref = u => u && u.dataUrl ? u.dataUrl : null;
function portalUploadDiverged(c){
  const u=c&&c.upload; if(!u) return false;
  const filed=String(u.extractedText||'').replace(/\s+/g,' ').trim();
  const live=String(portalCurrentText()||'').replace(/\s+/g,' ').trim();
  return !!(filed && live && filed!==live);
}
function portalDownloadCurrentAsDoc(c){
  const text=portalCurrentText()||docPlainText(c)||'';
  const name=String(c.name||c.id||'contract').replace(/[^\w \-]/g,'').trim()||'contract';
  const body=text.split(/\n{2,}/).map(par=>
    `<p style="font-family:Calibri,Arial,sans-serif;font-size:11pt;line-height:1.5">${esc(par).replace(/\n/g,'<br/>')}</p>`).join('');
  const html=`<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(name)}</title></head><body>${body}</body></html>`;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\ufeff'+html],{type:'application/msword'}));
  a.download=name+' (current wording).doc';
  a.click(); URL.revokeObjectURL(a.href);
}
/* Any uploaded document, not only Word: a counterparty sent a PDF still needs
   the file itself, and the portal is now the only place offering it. */
function portalWordCard(c){
  const u=c&&c.upload;
  /* HaTi can now WRITE a .docx (js/docxwrite.js), so "work in Word" no longer
     depends on the contract having arrived as one. Every reader gets the
     current wording as a real Word file and can bring their marked-up copy
     back; a reader whose own paper is on file additionally gets that original.
     Before this, a counterparty reviewing a HaTi-drafted contract had no Word
     route at all — the card returned '' and they were left with the textarea. */
  if(!u||!portalFileHref(u)) return portalGeneratedWordCard(c);
  const isWord=!!portalWordFile(c);
  const diverged=portalUploadDiverged(c);
  const kb=u.size?(u.size>1048576?(u.size/1048576).toFixed(1)+' MB':Math.round(u.size/1024)+' KB'):'';
  if(!isWord) return `
    <div id="pt-word" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:13px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
      <span style="flex:none;color:var(--color-accent);display:inline-flex">${icon('file','w-4 h-4')}</span>
      <span style="flex:1;min-width:160px;font-size:12.5px;color:var(--color-neutral-700)">The original file as it was filed${diverged?' — note the wording below has been revised since':''}.
        <span style="display:block;font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-500);margin-top:2px">${esc(u.fileName||'document')}${kb?' · '+kb:''}</span></span>
      <button id="pt-word-dl" class="ui-btn" style="flex:none;font-size:12.5px;padding:8px 14px">${icon('download','w-3.5 h-3.5')} Download original</button>
    </div>`;
  return `
    <div id="pt-word" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:11px">
        <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('file','w-4 h-4')}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:13px;font-weight:600">Prefer to work in Word?</span>
          <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.55;margin-top:2px">Mark the contract up in Word with Track Changes on, and bring it back here. Your file is read on this device — only the wording is sent, exactly as if you had typed it above.</span>
        </span>
      </div>
      ${diverged?`<div style="border:1px solid #e0c48a;background:#fdf6e7;border-radius:5px;padding:9px 12px;margin:0 0 11px;font-size:11.5px;line-height:1.55;color:#7d5a14">
        <b>The .docx on file is the original.</b> The wording below has been revised since it was uploaded, and those revisions are not in that file. Work from <b>the current wording</b> unless you specifically need the original paper.</div>`:''}
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button id="pt-word-current" class="ui-btn ${diverged?'ui-btn-primary':''}" style="font-size:12.5px;padding:9px 15px">${icon('download','w-3.5 h-3.5')} Download the current wording</button>
        <button id="pt-word-dl" class="ui-btn ${diverged?'':'ui-btn-primary'}" style="font-size:12.5px;padding:9px 15px">${icon('download','w-3.5 h-3.5')} Download the original .docx</button>
        <button id="pt-word-up" class="ui-btn" style="font-size:12.5px;padding:9px 15px">${icon('upload','w-3.5 h-3.5')} Upload your marked-up copy</button>
        <input id="pt-word-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none"/>
      </div>
      <div style="margin-top:11px;font-size:11px;font-family:var(--font-mono);color:var(--color-neutral-500)">${esc(u.fileName||'contract.docx')}${kb?' · '+kb:''}</div>
      <div id="pt-word-out" style="margin-top:12px"></div>
    </div>`;
}
/* The Word card for a contract with no file of its own — everything drafted in
   HaTi. The .docx is generated from the wording on this page, so what counsel
   marks up is exactly what the reader is looking at. */
function portalGeneratedWordCard(c){
  if(typeof contractDocxBytes!=='function') return '';
  if(!portalCurrentText() && !(c&&c.redlineText)) return '';
  return `
    <div id="pt-word" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:11px">
        <span style="flex:none;margin-top:1px;color:var(--color-accent)">${icon('file','w-4 h-4')}</span>
        <span style="flex:1;min-width:0">
          <span style="display:block;font-size:13px;font-weight:600">Prefer to work in Word?</span>
          <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.55;margin-top:2px">Download this contract as a Word document, mark it up with Track Changes on, and bring it back here. Your file is read on this device — only the wording is sent, exactly as if you had typed it above.</span>
        </span>
      </div>
      <div style="display:flex;gap:9px;flex-wrap:wrap">
        <button id="pt-word-gen" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:9px 15px">${icon('download','w-3.5 h-3.5')} Download as Word (.docx)</button>
        <button id="pt-word-up" class="ui-btn" style="font-size:12.5px;padding:9px 15px">${icon('upload','w-3.5 h-3.5')} Upload your marked-up copy</button>
        <input id="pt-word-file" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display:none"/>
      </div>
      <div id="pt-word-out" style="margin-top:12px"></div>
    </div>`;
}
function wireportalWord(c, p){
  const u=c&&c.upload;
  const generated=!u||!portalFileHref(u);
  if(generated && typeof contractDocxBytes!=='function') return;
  document.getElementById('pt-word-gen')?.addEventListener('click',async e=>{
    const btn=e.currentTarget, restore=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Building…</span>';
    try{ await downloadContractDocx({ ...c, redlineText:(portalCurrentText()||c.redlineText), format:c.format }); }
    catch(err){ toast('Could not build the Word file — '+err.message,'err'); }
    btn.disabled=false; btn.innerHTML=restore;
  });
  document.getElementById('pt-word-current')?.addEventListener('click',()=>portalDownloadCurrentAsDoc(c));
  document.getElementById('pt-word-dl')?.addEventListener('click',()=>{
    // wordTriggerDownload turns the data URL back into bytes; downloadFile
    // takes (name, content) and would have written the URL string as the file.
    if(typeof wordTriggerDownload!=='function'){ toast('Word download is unavailable on this page','err'); return; }
    try{ wordTriggerDownload(u.dataUrl, u.fileName||'contract.docx', u.mime); }
    catch(e){ toast('Could not start the download','err'); }
  });
  const input=document.getElementById('pt-word-file');
  document.getElementById('pt-word-up')?.addEventListener('click',()=>input&&input.click());
  input?.addEventListener('change',async()=>{
    const f=input.files&&input.files[0]; if(!f) return;
    const out=document.getElementById('pt-word-out');
    // A courtesy bound, not a security one — nothing is transmitted either way.
    if(f.size>25*1024*1024){ out.innerHTML=portalWordError('That file is larger than 25 MB. Save it again from Word and try once more.'); input.value=''; return; }
    out.innerHTML=`<div style="font-size:12px;color:var(--color-neutral-600)">Reading ${esc(f.name)}…</div>`;
    let res=null;
    try{ res=await docxExtract(new Uint8Array(await f.arrayBuffer())); }
    catch(e){ res=null; }
    input.value='';
    if(!res||!res.text||!res.text.trim()){
      out.innerHTML=portalWordError('No wording could be read out of that file. It may not be a Word .docx, or it may be a scan. You can still type your edits into the box below.');
      return;
    }
    portalWordPreview(c, p, f.name, res);
  });
}
const portalWordError = msg => `<div style="border:1px solid #e3c4bf;background:#f9ecea;border-radius:5px;padding:10px 12px;font-size:12px;line-height:1.55;color:#8f322b">${esc(msg)}</div>`;
/* C2 — what came out of their file, shown against the current wording, before
   anything is sent. The question every Word user has is whether the system
   actually picked their changes up; this answers it while they can still act. */
function portalWordPreview(c, p, fileName, res){
  const base=portalCurrentText()||docPlainText(c);
  const st=(window.diffStats?diffStats(base,res.text):{add:0,del:0});
  const tracked=res.tracked||{ins:0,del:0};
  const out=document.getElementById('pt-word-out');
  out.innerHTML=`
    <div style="border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:6px;padding:13px 16px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">
        <span style="flex:none;display:inline-flex;color:#1e6b4d">${icon('check2','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;color:var(--color-accent-800)">Your marked-up copy has been read</span>
      </div>
      <div style="font-size:12px;line-height:1.65;color:var(--color-neutral-800)">
        ${tracked.ins||tracked.del
          ? `HaTi found <b>${tracked.ins} tracked insertion${tracked.ins===1?'':'s'}</b> and <b>${tracked.del} tracked deletion${tracked.del===1?'':'s'}</b> in <span style="font-family:var(--font-mono);font-size:11px">${esc(fileName)}</span>.`
          : `<span style="font-family:var(--font-mono);font-size:11px">${esc(fileName)}</span> carries no Word tracked changes, so the whole document is compared as it stands.`}
        Against the wording you were sent that is <b>+${st.add} added</b> and <b>−${st.del} removed</b>.
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:11.5px;color:var(--color-neutral-700);flex:1;min-width:120px">Nothing has been sent yet.</span>
        <button id="pt-word-view" class="ui-btn" style="font-size:12px;padding:7px 13px">See the redline</button>
        <button id="pt-word-send" class="ui-btn ui-btn-primary" style="font-size:12px;padding:7px 13px">Send these edits</button>
      </div>
    </div>`;
  document.getElementById('pt-word-view').addEventListener('click',()=>portalWordDiffModal(base,res.text,fileName,st));
  document.getElementById('pt-word-send').addEventListener('click',()=>{
    const ta=document.getElementById('pt-redline-text');
    if(ta) ta.value=res.text;                       // reuse the redline route wholesale
    if(!fval('pt-comment')){
      const el=document.getElementById('pt-comment');
      if(el) el.value=`Edits returned in Word (${fileName}).`;
    }
    portalRespond(p,'redline');
  });
}
function portalWordDiffModal(base, next, fileName, st){
  const COL='width:100%;max-width:860px;margin-left:auto;margin-right:auto';
  openModal(`
    <div style="height:100%;display:flex;flex-direction:column;min-height:0">
      <div style="flex:none;padding:20px 26px 14px;border-bottom:1px solid var(--color-divider)">
        <div style="${COL}">
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Your edits, read out of ${esc(fileName)}</h3>
          <p style="font-size:11.5px;color:var(--color-neutral-600);margin:7px 0 0">+${st.add} added · −${st.del} removed ·
            <span style="background:#dff0e6;color:#1e6b4d;padding:0 4px;border-radius:2px">added</span>
            <span style="background:#fbe3e1;color:#b0453c;text-decoration:line-through;padding:0 4px;border-radius:2px">removed</span></p>
        </div>
      </div>
      <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:22px 26px;background:var(--color-bg)">
        <div style="${COL};background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;font-size:14px;line-height:1.95;color:var(--color-doc-text);white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(base,next)}</div>
      </div>
      <div style="flex:none;padding:14px 26px;border-top:1px solid var(--color-divider)">
        <div style="${COL};display:flex;align-items:center;gap:9px">
          <span style="font-size:11.5px;color:var(--color-neutral-600);flex:1">Close to go back — nothing is sent from here.</span>
          <button id="pw-close" class="ui-btn">Close</button>
        </div>
      </div>
    </div>`, {maxWidth:'min(1180px, 96vw)', height:'calc(100vh - 40px)'});
  document.getElementById('pw-close').addEventListener('click',closeModal);
}
/* A1 — the wording moved since the copy this reader last opened. The baseline
   comes from the server (the previous link they actually opened); the current
   text is what this link carries. Identical in kind to the owner's strip: a
   notice is only worth showing if it opens onto the thing it is about, so the
   button is not optional furniture. */
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
  'pt-redline-submit','pt-word-send','pc-accept','pc-counter','pc-decline'];
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
/* The link is answered, or the wording has moved on since it was sent. Either
   way nothing on this page can be submitted, and the page should say so at the
   top rather than letting someone fill a form that will be refused. */
function portalClosedBanner(){
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
  return `
    <div id="pt-openpoints" style="border:1px solid #e0c48a;background:#fdf6e7;border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px">
        <span style="flex:none;color:#b8862b;display:inline-flex">${icon('alert','w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;color:#7d5a14">Still open between us</span>
        <span style="margin-left:auto;font-size:10.5px;color:#7d5a14;font-family:var(--font-mono)">${pts.length} point${pts.length===1?'':'s'}</span>
      </div>
      <p style="margin:0 0 10px;font-size:11.5px;line-height:1.55;color:#7d5a14">${org} did not adopt ${pts.length===1?'this change':'these changes'}. The wording below is unchanged in the contract — press <b>Propose edits</b> if you want to come back on ${pts.length===1?'it':'them'}.</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${pts.map(pt=>`
          <div style="border:1px solid #e8d5ad;background:var(--color-surface);border-radius:6px;padding:9px 12px;font-size:12px;line-height:1.6">
            ${pt.before?`<div><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">Contract says</span>
              <div style="color:var(--color-neutral-800)">${esc(pt.before)}</div></div>`:''}
            ${pt.after?`<div style="margin-top:5px"><span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--color-neutral-500)">You asked for</span>
              <div style="color:#8f322b">${esc(pt.after)}</div></div>`:''}
            ${pt.reason?`<div style="margin-top:5px;font-size:11.5px;color:var(--color-neutral-700)"><b>Their reply:</b> ${esc(pt.reason)}</div>`:''}
          </div>`).join('')}
      </div>
    </div>`;
}

async function portalEntry(encoded){
  if(encoded.startsWith('t:')){        // server-backed share token
    try{
      const r=await fetch('api/shares/'+encodeURIComponent(encoded.slice(2)));
      const d=await r.json().catch(()=>null);
      if(r.status===410){ renderSharePortal(null,{ gone:(d&&d.gone)||'expired', goneMsg:d&&d.error }); return; }
      if(!r.ok) throw new Error(d?.error||'not found');
      renderSharePortal(d.payload,{ token:encoded.slice(2), responded:d.responded, share:d.share||{}, prior:d.prior||null, superseded:d.superseded||null });
    }catch(e){ renderSharePortal(null); }
    return;
  }
  renderSharePortal(b64d(encoded));    // static-mode share (payload in the URL)
}
function renderSharePortal(p, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts; PORTAL_OPTS.payload=p;
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
  const c=migrateContract({ ...p.contract, status:'Under Review',
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
        ${portalOpenPointsHtml(c,p)}
        ${portalThreadHtml(c,p)}
        ${portalWordCard(c)}
        <div id="pt-doc" class="blueprint" style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;">

          <article class="doc-surface">${readOnlyDocHtml(docBody(c))}</article>
        </div>
        <!-- Rewriting a contract used to happen in a twelve-row box inside the
             360px column on the right. It happens here now, at the size of the
             document it replaces. -->
        <div id="portal-redline" class="hidden" style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-md);overflow:hidden">
          <div style="padding:16px 22px;border-bottom:1px solid var(--color-divider);display:flex;align-items:flex-start;gap:12px;background:var(--color-bg)">
            <span style="flex:1;min-width:0">
              <span style="display:block;font-family:var(--font-heading);font-weight:600;font-size:16px;">Propose your edits</span>
              <span style="display:block;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5;margin-top:3px;">Change any wording below. ${esc(p.org)} sees your edits as a tracked redline — additions and deletions highlighted — and can accept, reject or counter.</span>
            </span>
            <button id="pt-redline-cancel" class="ui-btn" style="flex:none;font-size:12px;padding:7px 14px">Cancel</button>
          </div>
          <textarea id="pt-redline-text" class="scroll-thin" spellcheck="false" style="display:block;width:100%;height:min(62vh,620px);border:0;outline:none;resize:vertical;padding:26px 32px;font:inherit;font-size:15px;line-height:1.95;color:var(--color-doc-text);background:#fbfbfc;"></textarea>
          <div style="padding:14px 22px;border-top:1px solid var(--color-divider);display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:var(--color-bg)">
            <span id="pt-redline-count" style="font-size:11.5px;color:var(--color-neutral-600)">Your name is taken from the panel on the right.</span>
            <span style="flex:1"></span>
            <button id="pt-redline-submit" class="ui-btn ui-btn-primary" style="font-size:13px;padding:10px 20px">Submit proposed edits</button>
          </div>
        </div>
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);padding:18px;" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:var(--color-text);margin:0 0 4px;">Respond to ${esc(p.org)}</h2>
        ${opts.share&&opts.share.message?`<div style="margin-bottom:12px;border-left:3px solid var(--color-accent);border-radius:4px;background:var(--color-accent-100);padding:9px 11px;font-size:11.5px;color:var(--color-neutral-800);line-height:1.5;"><span style="display:block;font-size:10px;font-weight:600;color:var(--color-accent-800);font-family:var(--font-mono);margin-bottom:2px;">Message from ${esc(p.sharedBy)}</span>${esc(opts.share.message)}</div>`:''}
        ${opts.responded?`<div style="margin-bottom:14px;border-radius:4px;background:var(--color-accent-100);border:1px solid var(--color-divider);padding:9px 11px;font-size:11px;color:var(--color-accent-800);display:flex;align-items:center;gap:6px;">${icon('check2','w-3.5 h-3.5')} A response was already submitted for this link.</div>`:''}
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5;">${opts.token?`Your response is delivered to ${esc(p.sharedBy)} automatically — nothing to send back.`:`Your response is packaged as a secure code — send it back to ${esc(p.sharedBy)} to record it on the contract.`}</p>
        ${input('pt-name','Full name *','e.g. Grace Njeri')}
        ${input('pt-title','Title / role','e.g. Legal Counsel')}
        ${input('pt-email','Work email','you@company.co.ke')}
        <label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Comment</span>
        <textarea id="pt-comment" rows="3" placeholder="Optional for signing; required for changes or decline…" style="${TA}"></textarea></label>
        ${isMonetary(c)?`<label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Propose a different value (optional, for change requests)</span>
        <input id="pt-proposed" type="number" placeholder="e.g. ${c.value||'2500000'}" style="${TA}min-height:36px;"/></label>`:''}
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="pt-sign" class="ui-btn ui-btn-primary" style="width:100%;padding:10px;font-size:13px;">${icon('finger','w-4 h-4')} Approve &amp; sign</button>
          <!-- B: agreeing to the wording and executing the contract are two
               different acts. Until now the only way to say the first was to do
               the second. -->
          <button id="pt-accept" class="ui-btn" style="width:100%;padding:8px;font-size:12px;">${icon('check2','w-3.5 h-3.5')} Accept the wording (without signing)</button>
          <button id="pt-redline" class="ui-btn" style="width:100%;padding:8px;font-size:12px;">${icon('history','w-3.5 h-3.5')} Propose edits (redline)</button>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button id="pt-changes" class="ui-btn" style="padding:8px;font-size:12px;">Request changes</button>
            <button id="pt-decline" class="ui-btn" style="padding:8px;font-size:12px;color:#b0453c;border-color:color-mix(in srgb,#b0453c 40%,transparent);">Decline</button>
          </div>
        </div>
        <div id="portal-result" style="margin-top:16px;"></div>
      </aside>
    </div>
  </div>
  <style>.portal-grid{grid-template-columns:1fr;}@media(min-width:1024px){.portal-grid{grid-template-columns:1fr 360px;}.portal-aside{position:sticky;top:24px;}}</style>`;
  document.getElementById('pt-sign').addEventListener('click',()=>portalRespond(p,'sign'));
  document.getElementById('pt-changes').addEventListener('click',()=>portalRespond(p,'changes'));
  document.getElementById('pt-accept').addEventListener('click',()=>portalRespond(p,'accept'));
  document.getElementById('pt-see-changes')?.addEventListener('click',()=>openPortalCompare(p));
  document.getElementById('pt-compare')?.addEventListener('click',()=>openPortalVersionCompare(p));
  wireportalWord(c, p);
  if(PORTAL_OPTS.superseded||PORTAL_OPTS.responded){
    for(const b of portalActionButtons()){ b.disabled=true; b.style.opacity='.4'; b.style.cursor='default'; }
    const rl=document.getElementById('pt-redline-text'); if(rl) rl.readOnly=true;
  }
  document.getElementById('pt-decline').addEventListener('click',()=>portalRespond(p,'decline'));
  // E2: the redline editor takes over the main column, so the document being
  // rewritten and the box you rewrite it in are the same size.
  const showRedline=on=>{
    document.getElementById('portal-redline').classList.toggle('hidden',!on);
    document.getElementById('pt-doc').classList.toggle('hidden',on);
    const ta=document.getElementById('pt-redline-text');
    if(on && !ta.value) ta.value = docPlainText(c);
    document.getElementById('pt-main').scrollIntoView({behavior:'smooth',block:'start'});
    if(on) setTimeout(()=>ta.focus(),260);
  };
  document.getElementById('pt-redline').addEventListener('click',()=>
    showRedline(document.getElementById('portal-redline').classList.contains('hidden')));
  document.getElementById('pt-redline-cancel').addEventListener('click',()=>showRedline(false));
  document.getElementById('pt-redline-submit').addEventListener('click',()=>portalRespond(p,'redline'));
  // prefill the recipient's details from the share (they can still edit them)
  if(opts.share){
    const setIf=(id,v)=>{ const el=document.getElementById(id); if(el&&v&&!el.value) el.value=v; };
    setIf('pt-name',opts.share.recipientName); setIf('pt-email',opts.share.recipientEmail);
  }
}
async function portalRespond(p, action){
  const name=fval('pt-name'), title=fval('pt-title'), email=fval('pt-email'), comment=fval('pt-comment');
  if(!name){ toast('Enter your full name','err'); return; }
  if(action==='sign' && !email){ toast('A work email is required to sign','err'); return; }
  if(action==='changes' && !comment){ toast('Add a comment explaining your response','err'); return; }
  if(action==='decline' && !comment){ toast('Add a comment explaining your response','err'); return; }
  // Capture the counterparty's signature mark (free choice: draw / type / upload).
  let sig=null;
  if(action==='sign' && typeof openSignaturePad==='function'){
    sig=await openSignaturePad({ name });
    if(!sig) return;   // signer cancelled the pad
  }
  // Server-backed signing: verify the signer's email with a one-time code first.
  if(action==='sign' && PORTAL_OPTS.token){ return portalStartOtp(p, {name,title,email,comment,sig}); }
  // E2: a redline is a change request carrying proposed edited text + its base.
  let proposedText=null, baseText=null, sendAction=action;
  if(action==='redline'){
    proposedText=(document.getElementById('pt-redline-text')?.value||'').trim();
    if(!proposedText){ toast('Edit the text before submitting','err'); return; }
    // the base must be the same TEXT the counterparty edited, not the markup
    // behind it, or the returned redline diffs against tags
    baseText=p.contract.redlineText
      ? ((window.isRich&&isRich(p.contract.format)) ? richToText(p.contract.redlineText) : p.contract.redlineText)
      : normText(freezeContractHtml(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'})));
    sendAction='changes';
  }
  const proposedValue = (action==='changes') ? fval('pt-proposed') : '';
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:sendAction, name, title, email, comment,
    proposedValue: proposedValue||null, proposedText, baseText, at:nowISO(),
    signatureForm:sig?sig.form:null, signatureImage:sig?sig.image:null, signatureImageHash:sig?sig.imageHash:null,
    signatureTypedName:sig?sig.typedName:null, signatureFont:sig?sig.font:null };
  const label={sign:'signature',accept:'acceptance',changes:'change request',decline:'decline notice'}[sendAction];
  // Which control the reader actually pressed, so it is the one that reports back.
  const pressed={sign:'pt-sign',accept:'pt-accept',redline:'pt-redline-submit',
    changes:'pt-changes',decline:'pt-decline'}[action]
    || (document.getElementById('pt-word-send')?'pt-word-send':null);
  const doneLabel={sign:'Signed and sent',accept:'Acceptance sent',
    changes:'Change request sent',decline:'Decline sent'}[sendAction]||'Sent';
  if(PORTAL_OPTS.token){
    portalSetBusy(pressed,'Sending…');
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      portalSetDone(pressed, doneLabel);
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
    signatureForm:info.sig?info.sig.form:null, signatureImage:info.sig?info.sig.image:null, signatureImageHash:info.sig?info.sig.imageHash:null,
    signatureTypedName:info.sig?info.sig.typedName:null, signatureFont:info.sig?info.sig.font:null };
  try{
    await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
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
      <p class="doc-muted" style="font-size:9px;margin-top:10px;line-height:1.5;">Text extracted from <strong>${u.fileName||'the uploaded file'}</strong>${c.redlineText?' and edited in HaTi':''}. Signatures, stamps and page layout are not reproduced — the stored original file remains the authoritative document, identified by the fingerprint above.</p>
    </div>`;
}
function exportPDF(c){
  let bodyHtml;
  if(isUpload(c)){
    // The original file is a separate attachment; print a signing certificate.
    const u=c.upload||{};
    bodyHtml=`
      <div style="border:1px solid #d4d4d7;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:15px;margin-bottom:2px;">${esc(c.name)}</div>
        <div style="font-size:11px;color:#666;margin-bottom:10px;">External document received from ${c.counterparty||'—'} · filed under ${FOLDERS[c.folder].name}</div>
        <table style="font-size:11px;border-collapse:collapse;">
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Original file</td><td style="font-weight:600;">${u.fileName||'—'} (${u.size?Math.round(u.size/1024):0} KB)</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Value</td><td style="font-weight:600;">${!isMonetary(c)?'Non-monetary':(c.value?fmtKES(c.value):'—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Status</td><td style="font-weight:600;">${c.status}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">File fingerprint (SHA-256)</td><td style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:9px;word-break:break-all;">${u.fileHash||'—'}</td></tr>
        </table>
      </div>
      <p style="font-size:11px;color:#444;line-height:1.6;">${isExternallyExecuted(c)
        ? `This is a HaTi <strong>filing record</strong> for a contract executed outside HaTi and migrated in. No electronic signature was taken in HaTi — the signatures are on the original document (<strong>${u.fileName||'the attached file'}</strong>), which is retained here and travels with this record. The fingerprint below identifies that exact file; it is not a signature.`
        : `This is a HaTi signing certificate for an externally-supplied contract. The original document (<strong>${u.fileName||'the attached file'}</strong>) is retained in HaTi and travels with this certificate. The seal below binds this certificate to that exact file by its SHA-256 fingerprint.`}</p>
      ${uploadedTextForPrint(c)}`;
  } else {
    const holder=document.createElement('div');
    holder.innerHTML=docBody(c);
    holder.querySelectorAll('input').forEach(inp=>{
      const span=document.createElement('span');
      span.style.cssText="font-family:'IBM Plex Mono',ui-monospace,monospace;font-weight:600;border-bottom:1px solid #999;padding:0 3px;";
      span.textContent=inp.value||inp.getAttribute('value')||'________';
      inp.replaceWith(span);
    });
    bodyHtml=holder.innerHTML;
  }
  const audit=(c.audit||[]).map(e=>`
    <tr><td style="padding:3px 10px 3px 0;white-space:nowrap;color:#666;">${fmtDT(e.at)}</td>
    <td style="padding:3px 10px 3px 0;font-weight:600;">${e.action}</td>
    <td style="padding:3px 0;">${e.detail} <span style="color:#888;">(${e.user})</span></td></tr>`).join('');
  // The HaTi masthead and the audit trail are INTERFACE and stay on IBM Plex;
  // the contract itself is a document surface and carries the document faces
  // and the document ink, exactly as it does on screen. Without that the PDF
  // would look like a different product from the page it was exported from.
  document.getElementById('print-root').innerHTML=`
    <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 24px;color:#1d1f20;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #5980a6;padding-bottom:10px;margin-bottom:24px;">
        <div style="font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:18px;">HaTi <span style="font-weight:400;font-size:11px;color:#666;">· Contract Lifecycle</span></div>
        <div style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;color:#666;">${c.id} · generated ${fmtDT(nowISO())}</div>
      </div>
      <div class="doc-surface">${bodyHtml}</div>
      ${c.hash&&c.hash!=='PRE-SEEDED'?`<div style="margin-top:24px;padding:12px;border:1px solid #d4d4d7;border-radius:8px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;word-break:break-all;"><strong>${isExternallyExecuted(c)?'SHA-256 ORIGINAL FILE FINGERPRINT':'SHA-256 DOCUMENT SEAL'}</strong><br/>${isExternallyExecuted(c)?((c.upload&&c.upload.fileHash)||'—'):c.hash}<br/><span style="color:#666;">${c.signedAt||''}${isExternallyExecuted(c)?' · executed outside HaTi':''}</span></div>`:''}
      ${audit?`<div style="margin-top:24px;page-break-inside:avoid;"><div style="font-family:'IBM Plex Sans',sans-serif;font-weight:600;font-size:13px;border-bottom:1px solid #d4d4d7;padding-bottom:6px;margin-bottom:8px;">Audit trail</div><table style="font-size:10px;border-collapse:collapse;width:100%;">${audit}</table></div>`:''}
      <div style="margin-top:24px;font-size:9px;color:#999;text-align:center;">Generated by HaTi CLM · ${FIRST_PARTY}</div>
    </div>`;
  logAudit(c,'Exported','PDF export generated'); persist(c); renderAuditSection(c);
  window.print();
}

function metrics(){
  // Prefer server-computed aggregates (accurate at any scale, even when the
  // client only holds a capped working set); fall back to the in-memory set.
  const s=state.serverStats;
  if(s) return { totalValue:s.totalValue||0, pending:s.pending||0, signed:s.signed||0, declined:s.declined||0, drafts:s.drafts||0 };
  const cs=state.contracts, active=cs.filter(c=>c.status!=='Declined');
  return {
    totalValue:active.reduce((s,c)=>s+Number(c.value||0),0),
    pending:cs.filter(c=>c.status==='Under Review').length,
    signed:cs.filter(c=>c.status==='Signed').length,
    declined:cs.filter(c=>c.status==='Declined').length,
    drafts:cs.filter(c=>c.status==='Draft').length,
  };
}
async function refreshStats(){
  if(!API_MODE()) return;
  try{ state.serverStats=await api('stats'); if(state.view==='dashboard') renderDashboard(); }catch(e){}
}

Object.assign(window,{PORTAL_OPTS,portalGeneratedWordCard,portalWordCard,portalThreadHtml,portalOpenPointsHtml,exportPDF,metrics,uploadedTextForPrint,portalEntry,portalRespond,portalStartOtp,portalVerifyAndSign,refreshStats,renderSharePortal});
