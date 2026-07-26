// HaTi — the Word round-trip (phases 2–4). Globals window-attached like every
// module (see components.js).
//
// The flow this module owns: a received .docx goes OUT for external review
// (download + a visible soft lock), comes BACK as a returned file, and the
// return lands as an ordinary negotiation round — proposedText/baseText,
// reviewed and adopted through the SAME reviewProposedRound/acceptProposedRound
// machinery a portal redline uses. One history, whichever tool the other side
// negotiates in. The returned file itself is versioned (v2, v3…) beside the
// untouched original, and every version stays downloadable.

const DOCX_MIME='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const isWordDoc = c => !!(c && c.source==='upload' && c.upload && (c.upload.docKind==='docx' || /wordprocessingml/.test(c.upload.mime||'') || /\.docx$/i.test(c.upload.fileName||'')));
const wordReviewOut = c => !!(c && c.wordReview && c.wordReview.out);
const wordReviewDays = c => wordReviewOut(c) ? Math.max(0, Math.floor((Date.now()-new Date(c.wordReview.since).getTime())/86400000)) : 0;
// the signed door: executed records take no new versions, ever — a change to
// an executed agreement is an amendment (a new record), never an edit
const wordDoorClosed = c => !!(c && (c.status==='Signed' || c.hash || (c.execution && c.execution.at)));

/* ---- the file ledger: v1 (original) + every adopted Word return ---- */
function wordFileEntries(c){
  const u=c.upload||{};
  const out=[{ key:'v1', n:1, label:'v1 · Original', fileName:u.fileName||'contract.docx',
    mime:u.mime||DOCX_MIME, size:u.size, fileId:u.fileId, dataUrl:u.dataUrl, fileHash:u.fileHash }];
  for(const v of (u.versions||[])) out.push({ key:'v'+v.n, n:v.n,
    label:`v${v.n} · Word round ${v.roundN}`, fileName:v.fileName||('v'+v.n+'.docx'),
    mime:DOCX_MIME, size:v.size, fileId:v.fileId, dataUrl:v.dataUrl, fileHash:v.fileHash, src:v });
  return out;
}
function wordCurrentFile(c){
  const list=wordFileEntries(c);
  return list[list.length-1];
}
/* Resolve an entry's bytes. Version entries are saved as references (see
   saveContract) so the dataUrl is fetched on first use and cached on the
   in-memory record — the same rehydration pattern the v1 preview uses. */
async function wordEntryDataUrl(c, e){
  if(e.dataUrl) return e.dataUrl;
  if(e.fileId && API_MODE()){
    const f=await api('files/'+e.fileId);
    e.dataUrl=f.dataUrl; if(e.src) e.src.dataUrl=f.dataUrl;
    else if(e.key==='v1' && c.upload) c.upload.dataUrl=f.dataUrl;
    return f.dataUrl;
  }
  throw new Error('the file is not available on this record');
}
function wordTriggerDownload(dataUrl, fileName, mime){
  let url; try{ url=URL.createObjectURL(new Blob([dataUrlBytes(dataUrl)],{type:mime||DOCX_MIME})); }catch(e){ url=dataUrl; }
  const a=document.createElement('a'); a.href=url; a.download=fileName||'contract.docx';
  document.body.appendChild(a); a.click(); a.remove();
  if(url.startsWith('blob:')) setTimeout(()=>URL.revokeObjectURL(url), 60000);
}

/* ---- phase 2: OUT — download for review + the soft lock ---- */
async function startWordReview(c, btn){
  if(!canEdit()){ toast('Viewers cannot send documents for review','err'); return; }
  if(wordDoorClosed(c)){ toast('This contract is executed — record an amendment instead','err'); return; }
  const u=currentUser();
  const cur=wordCurrentFile(c);
  const restore=btn?btn.innerHTML:''; if(btn){ btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Preparing…</span>'; }
  try{
    const dataUrl=await wordEntryDataUrl(c, cur);
    wordTriggerDownload(dataUrl, cur.fileName, cur.mime);
    c.wordReview={ out:true, since:nowISO(), by:u?.name||'System', fileVersion:cur.n };
    c.lastAction=todayStr();
    logAudit(c,'Word review',`${cur.key} (“${cur.fileName}”) downloaded for external Word review by ${u?.name||'System'} — online editing paused until the returned file is uploaded or the review is cancelled`);
    persist(c); renderWorkspace();
    toast('Downloaded for Word review — editing is paused until the file comes back');
  }catch(e){
    toast('Could not prepare the download — '+e.message,'err');
    if(btn){ btn.disabled=false; btn.innerHTML=restore; }
  }
}
function cancelWordReview(c){
  if(!canEdit()){ toast('Viewers cannot change contracts','err'); return; }
  if(!wordReviewOut(c)) return;
  const u=currentUser();
  logAudit(c,'Word review',`External Word review cancelled by ${u?.name||'System'} after ${wordReviewDays(c)} day${wordReviewDays(c)===1?'':'s'} — online editing re-enabled, no file was returned`);
  c.wordReview=null; c.lastAction=todayStr();
  persist(c); renderWorkspace();
  toast('External review cancelled — editing re-enabled');
}

/* ---- phase 3: BACK — the returned file becomes a negotiation round ---- */
function openWordReturnPicker(c){
  if(!canEdit()){ toast('Viewers cannot upload documents','err'); return; }
  if(wordDoorClosed(c)){ toast('This contract is executed — record an amendment instead','err'); return; }
  const input=document.createElement('input');
  input.type='file'; input.accept='.docx';
  input.addEventListener('change',()=>{ const f=input.files&&input.files[0]; if(f) uploadWordVersion(c,f); });
  input.click();
}
async function uploadWordVersion(c, file){
  if(wordDoorClosed(c)){ toast('This contract is executed — record an amendment instead','err'); return; }
  if(file.size>UPLOAD_MAX){ toast('File is larger than 4 MB — please compress or split it','err'); return; }
  const u=currentUser();
  let dataUrl;
  try{ dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); }); }
  catch(e){ toast('Could not read that file','err'); return; }
  // the returned file must BE a .docx — sniffed on the bytes, not the name
  const kind=detectWordFile(dataUrl, file.type||'', file.name);
  if(kind!=='docx'){
    toast(kind==='doc'?'That is a legacy .doc file — ask for the .docx, or re-save it in Word':'The returned file must be a Word .docx document','err'); return;
  }
  let text, tracked;
  try{ const w=await extractWordText(dataUrl); text=w.text; tracked=w.tracked; }
  catch(e){ toast('Could not read this Word file: '+e.message,'err'); return; }
  const base=docPlainText(c);
  // a byte-identical or word-identical return is an answer, not a round: the
  // counterparty changed nothing — release the lock and say so on the record
  if(text.replace(/\s+/g,' ').trim()===base.replace(/\s+/g,' ').trim()){
    logAudit(c,'Word review',`“${file.name}” returned by ${u?.name||'System'} with no wording changes — review closed, no round opened`);
    c.wordReview=null; c.lastAction=todayStr();
    persist(c); renderWorkspace();
    toast('The returned file has no wording changes — review closed');
    return;
  }
  const fileHash=await sha256(dataUrl);
  const fileRec={ fileName:file.name, mime:DOCX_MIME, size:file.size, fileHash, tracked,
    at:nowISO(), by:u?.name||'System', dataUrl };
  if(API_MODE()){
    try{ const r=await api('files','POST',{ name:file.name, mime:DOCX_MIME, dataUrl });
      fileRec.fileId=r.id; }catch(e){ /* fall back to inline bytes */ }
  }
  // scope + lifecycle: the server reads c.documents to authorise file GETs and
  // to sweep files when the contract is deleted — every stored version file
  // must be listed there or it is unreachable on reload and orphaned on delete
  if(fileRec.fileId){
    c.documents=Array.isArray(c.documents)?c.documents:[];
    c.documents.push({ fileId:fileRec.fileId, name:file.name, mime:DOCX_MIME, size:file.size, kind:'word-version', at:fileRec.at, by:fileRec.by });
  }
  c.rounds=c.rounds||[];
  const n=c.rounds.length+1;
  const who=(c.counterparty?c.counterparty+' — ':'')+'returned Word file';
  c.rounds.push({ n, at:nowISO(), by:who, status:'open', via:'word',
    comment:`Returned “${file.name}” after external Word review.${(tracked.ins||tracked.del)?` ${trackedNote(tracked)}.`:''}`,
    baseText:base, proposedText:text, file:fileRec });
  const wasOut=wordReviewOut(c);
  c.wordReview=null;   // the document is back — the lock lifts the moment it lands
  c.lastAction=todayStr();
  logAudit(c,'Word review',`“${file.name}” (${Math.round(file.size/1024)} KB) returned${wasOut?'':' (no review was marked out)'} — filed as negotiation round ${n} with a tracked redline${(tracked.ins||tracked.del)?`; ${trackedNote(tracked).toLowerCase()}`:''}`);
  persist(c); renderWorkspace();
  toast(`Round ${n} filed from the returned Word file — review the redline`);
  // put the reviewer straight into the accept/reject moment; the round stays
  // open in the Negotiation panel if they close the modal instead
  reviewProposedRound(c, n);
}

/* ---- phase 4: the controls the workspace renders ---- */
function wordLastRound(c){
  const rs=(c.rounds||[]).filter(r=>r.via==='word');
  return rs.length?rs[rs.length-1]:null;
}
function wordControlsHtml(c){
  if(!isWordDoc(c)) return '';
  const editor=canEdit(), closed=wordDoorClosed(c), out=wordReviewOut(c);
  const entries=wordFileEntries(c);
  const days=wordReviewDays(c);
  const B='display:inline-flex;align-items:center;gap:6px;border-radius:8px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s';
  const lastR=wordLastRound(c);
  const lastCard=(()=>{
    if(!lastR) return '';
    const st=diffStats(lastR.baseText||'', lastR.proposedText||'');
    const open=lastR.status==='open';
    return `<div style="border:1px solid ${open?'#f1e6cd':'var(--color-divider)'};background:${open?'#fbf4e3':'var(--color-surface)'};border-radius:8px;padding:10px 12px;margin-top:8px">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:11.5px">
        <span style="font-weight:700;color:var(--color-neutral-800)">${open?'Returned redline awaiting review':'Latest Word round'} — round ${lastR.n}</span>
        <span style="color:#1e6b4d;font-weight:600">+${st.add} added</span>
        <span style="color:#8f322b;font-weight:600">−${st.del} removed</span>
        <span style="margin-left:auto;display:flex;gap:6px">
          ${open&&editor?`<button data-word-review-round="${lastR.n}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:4px 10px">Review redline</button>`
            :`<button data-word-view-round="${lastR.n}" class="ui-btn" style="font-size:11px;padding:4px 10px">View changes</button>`}
        </span>
      </div>
      ${lastR.file&&lastR.file.tracked&&(lastR.file.tracked.ins||lastR.file.tracked.del)?`<div style="font-size:10.5px;color:var(--color-neutral-600);margin-top:4px">${trackedNote(lastR.file.tracked)}.</div>`:''}
    </div>`;
  })();
  const versionRow = entries.length>1 ? `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:8px">
      <span style="font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--color-neutral-600)">File versions</span>
      <select id="word-ver-pick" style="font:inherit;font-size:11.5px;border:1px solid var(--color-divider);background:var(--color-surface);padding:5px 8px;border-radius:5px;color:inherit">
        ${entries.map((e,i)=>`<option value="${e.key}"${i===entries.length-1?' selected':''}>${e.label} — ${e.fileName.replace(/</g,'&lt;')}</option>`).join('')}
      </select>
      <button data-word-dl class="ui-btn" style="font-size:11.5px;padding:5px 10px">${icon('download','w-3.5 h-3.5')} Download selected</button>
    </div>` : '';
  if(closed){
    // executed: the ledger stays readable, the door does not exist any more
    return `<div data-anchor="word" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:10px 14px;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--color-neutral-700)">
        <span style="color:#1e6b4d">${icon('check2','w-3.5 h-3.5')}</span>
        <span><b>Executed & sealed.</b> New Word versions are permanently disabled — a change to a signed agreement is an amendment, a new record with its own history.</span>
      </div>${versionRow}${lastCard}</div>`;
  }
  if(out){
    const since=fmtDT(c.wordReview.since);
    return `<div data-anchor="word" style="border:1px solid #f1e6cd;background:#fbf4e3;border-radius:8px;padding:11px 14px;margin-bottom:14px">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:9px;font-size:11.5px;color:#7d5a14">
        <span style="display:inline-flex;align-items:center;gap:6px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:10.5px"><span style="width:7px;height:7px;border-radius:50%;background:#b8862b"></span>Out for external Word review</span>
        <span>since ${since} (${days} day${days===1?'':'s'}) · sent out by ${(c.wordReview.by||'—').replace(/</g,'&lt;')}. Online editing is paused so the returning file can’t collide with edits made here.${days>=14?' <b>It has been two weeks — chase the counterparty or cancel the review.</b>':''}</span>
      </div>
      ${editor?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:9px">
        <button data-word-return class="ui-btn ui-btn-primary" style="${B}">${icon('upload','w-3.5 h-3.5')} Upload returned .docx</button>
        <button data-word-cancel class="ui-btn" style="${B};border-color:#dca99d;color:#8f322b">Cancel review</button>
      </div>`:''}
      ${versionRow}${lastCard}</div>`;
  }
  return `<div data-anchor="word" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:11px 14px;margin-bottom:14px">
    <div style="display:flex;align-items:flex-start;gap:8px;font-size:11.5px;color:var(--color-neutral-700)">
      <span style="color:var(--color-accent);flex:none;margin-top:1px">${icon('file','w-3.5 h-3.5')}</span>
      <span><b>Word round-trip.</b> Download the current .docx for a counterparty who negotiates in Word; when their marked-up file comes back, upload it and HaTi files the changes as a tracked negotiation round — whether or not they used Track Changes.</span>
    </div>
    ${editor?`<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:9px">
      <button data-word-out class="ui-btn ui-btn-primary" style="${B}">${icon('download','w-3.5 h-3.5')} Download .docx for Word review</button>
      <button data-word-return class="ui-btn" style="${B}">${icon('upload','w-3.5 h-3.5')} Upload returned .docx</button>
    </div>`:''}
    ${versionRow}${lastCard}</div>`;
}
function wireWordControls(c){
  document.querySelector('[data-word-out]')?.addEventListener('click',e=>startWordReview(c, e.currentTarget));
  document.querySelector('[data-word-return]')?.addEventListener('click',()=>openWordReturnPicker(c));
  document.querySelector('[data-word-cancel]')?.addEventListener('click',()=>cancelWordReview(c));
  document.querySelector('[data-word-review-round]')?.addEventListener('click',e=>reviewProposedRound(c, Number(e.currentTarget.getAttribute('data-word-review-round'))));
  document.querySelector('[data-word-view-round]')?.addEventListener('click',e=>{
    const r=(c.rounds||[]).find(x=>x.n===Number(e.currentTarget.getAttribute('data-word-view-round')));
    if(r) openDiffModal(r.baseText||'', r.proposedText||'', 'before round '+r.n, 'round '+r.n);
  });
  document.querySelector('[data-word-dl]')?.addEventListener('click',async e=>{
    const pick=document.getElementById('word-ver-pick');
    const entry=wordFileEntries(c).find(x=>x.key===(pick?pick.value:'v1'))||wordCurrentFile(c);
    const btn=e.currentTarget, restore=btn.innerHTML;
    btn.disabled=true; btn.innerHTML='<span class="animate-pulse">Fetching…</span>';
    try{ wordTriggerDownload(await wordEntryDataUrl(c, entry), entry.fileName, entry.mime); }
    catch(err){ toast('Could not fetch that version — '+err.message,'err'); }
    btn.disabled=false; btn.innerHTML=restore;
  });
}

Object.assign(window,{DOCX_MIME,isWordDoc,wordReviewOut,wordReviewDays,wordDoorClosed,wordFileEntries,wordCurrentFile,wordEntryDataUrl,wordControlsHtml,wireWordControls,startWordReview,cancelWordReview,openWordReturnPicker,uploadWordVersion,wordLastRound});
