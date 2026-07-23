// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   INBOUND / UPLOADED CONTRACTS  ("their paper")
   A received document is stored as a file and wrapped in the same
   review → scan → sign → audit workflow as generated contracts.
   ============================================================ */
const upField=(id,label,ph,type='text')=>`<label class="block"><span class="text-xs font-medium text-brand-800/70">${label}</span><input id="${id}" type="${type}" placeholder="${ph}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400"/></label>`;

/* ---------- document text extraction (client-side, no external service) ----------
   Uses the browser's built-in DecompressionStream to inflate FlateDecode PDF
   streams, then pulls the text-showing strings. Works for standard text PDFs
   and .txt; image-only PDFs / Word fall back to the manual checklist. */
async function inflateBytes(bytes){
  for(const fmt of ['deflate','deflate-raw']){
    try{ const ds=new DecompressionStream(fmt);
      const stream=new Blob([bytes]).stream().pipeThrough(ds);
      return new Uint8Array(await new Response(stream).arrayBuffer());
    }catch(e){}
  }
  return null;
}
function pdfStringsFrom(content){
  const res=[]; const re=/\(((?:\\.|[^()\\])*)\)/g; let m;
  while((m=re.exec(content))){
    res.push(m[1].replace(/\\(\d{1,3})/g,(_,o)=>String.fromCharCode(parseInt(o,8))).replace(/\\([()\\nrt])/g,(x,c)=>({n:'\n',r:'',t:' '}[c]??c)));
  }
  return res.join(' ');
}
async function extractPdfText(buf){
  const bytes=new Uint8Array(buf);
  let bin=''; for(let i=0;i<bytes.length;i++) bin+=String.fromCharCode(bytes[i]);
  const out=[]; const re=/stream\r?\n([\s\S]*?)\r?\nendstream/g; let m;
  while((m=re.exec(bin))){
    const raw=m[1];
    const arr=Uint8Array.from(raw,ch=>ch.charCodeAt(0)&0xff);
    const inf=await inflateBytes(arr);
    let text; if(inf){ text=''; for(let i=0;i<inf.length;i++) text+=String.fromCharCode(inf[i]); } else text=raw;
    if(/\bTj\b|\bTJ\b|\bBT\b/.test(text)) out.push(pdfStringsFrom(text));
  }
  return out.join(' ').replace(/\s+/g,' ').trim();
}
/* Decode a data: URL locally — fetch(dataUrl) is blocked by the server-mode
   CSP (connect-src 'self'), so the bytes are unpacked without a request. */
function dataUrlBytes(dataUrl){
  const s=String(dataUrl||''); const i=s.indexOf(',');
  if(i<0) return new Uint8Array(0);
  const head=s.slice(0,i), body=s.slice(i+1);
  if(/;base64/i.test(head)){ const bin=atob(body); const arr=new Uint8Array(bin.length);
    for(let j=0;j<bin.length;j++) arr[j]=bin.charCodeAt(j); return arr; }
  return new TextEncoder().encode(decodeURIComponent(body));
}
async function extractDocText(dataUrl, mime){
  try{
    const bytes=dataUrlBytes(dataUrl);
    if(/text\//.test(mime)){ return new TextDecoder().decode(bytes).slice(0,40000); }
    if(/pdf/.test(mime)){ return (await extractPdfText(bytes.buffer)).slice(0,40000); }
  }catch(e){}
  return '';
}
// Heuristic clause analysis over the REAL extracted text — quotes verbatim.
function sentenceAround(text, idx){
  let s=text.lastIndexOf('.',idx); s=s<0?Math.max(0,idx-140):s+1;
  let e=text.indexOf('.',idx); e=e<0?Math.min(text.length,idx+220):e+1;
  return text.slice(s,e).replace(/\s+/g,' ').trim().slice(0,260);
}
function findingsFromText(c, text){
  const F=[]; const low=text.toLowerCase();
  const add=(id,sev,kind,title,quote,why,fix,conf)=>F.push({id,sev,kind,title,anchor:'doc',confidence:conf,
    what:quote?`The document reads: “${quote}”`:'(clause not located in the extracted text)', why, fix});
  const firstIdx=(...ks)=>{ for(const k of ks){ const i=low.indexOf(k); if(i>=0) return i; } return -1; };
  // 1) governing law — scan ALL candidate mentions and pick the one that names a
  //    jurisdiction (a ref-line like "governing law as stated below" is ignored).
  const foreign=['switzerland','geneva','england','wales','united kingdom','london','delaware','new york','singapore','dubai','u.a.e','uae','netherlands','paris','france','uganda','tanzania','rwanda','south africa'];
  const govKeys=['governing law','governed by the laws','laws of the republic','exclusive jurisdiction','jurisdiction of','arbitration seated','arbitration in','governed by'];
  const cands=[]; for(const k of govKeys){ let i=low.indexOf(k); while(i>=0){ cands.push(i); i=low.indexOf(k,i+1); } }
  let foreignSen=null,foreignHit=null,kenyaSen=null;
  for(const idx of [...new Set(cands)].sort((a,b)=>a-b)){ const sen=sentenceAround(text,idx), sl=sen.toLowerCase();
    const fh=foreign.find(f=>sl.includes(f)), hk=sl.includes('kenya');
    if(fh&&!hk&&!foreignSen){ foreignSen=sen; foreignHit=fh; }
    if(hk&&!kenyaSen) kenyaSen=sen;
  }
  if(foreignSen) add('t-law','high','risk','Foreign governing law detected',foreignSen,
    `A ${foreignHit.replace(/\b\w/g,x=>x.toUpperCase())} governing law or forum makes enforcement slow and costly for a Kenyan business and may bypass Kenyan protections.`,
    'Negotiate Kenyan governing law and forum, or budget for foreign enforcement before signing.','high');
  else if(kenyaSen) add('t-law','low','ambiguity','Governing law: Kenya (found in text)',kenyaSen,
    'Kenyan governing law keeps enforcement local and predictable.','No change needed — confirm the forum (courts vs. arbitration) suits you.','high');
  else add('t-law','med','missing','Governing law / jurisdiction not clearly stated','',
    'No clause naming a governing law or forum was found in the extracted text — every high-value or cross-border contract needs a clear governing law and forum.','Locate or add the governing-law clause and confirm it names Kenya.','low');
  // 2) payment terms
  const pm=low.match(/(?:within|net)\s*(\d{1,3})\s*days/);
  if(pm){ const i=low.indexOf(pm[0]), d=Number(pm[1]);
    add('t-pay', d>45?'med':'low', d>45?'risk':'ambiguity', `Payment terms: ${d} days`, sentenceAround(text,i),
      d>45?`${d}-day terms tie up working capital and raise exposure if the payer delays.`:'Payment terms look within a healthy range.',
      d>45?'Negotiate toward 30–45 days, or price the extended terms into the deal.':'Confirm this matches what was agreed.','high'); }
  // 3) auto-renewal
  const ar=low.search(/auto(?:matically)?[\s-]*renew|renews?\s+automatically/);
  if(ar>=0) add('t-renew','med','risk','Automatic renewal clause',sentenceAround(text,ar),
    'Auto-renewing contracts with long notice windows are a common way to get locked in.',
    'Confirm the renewal is intended and the exit notice period is workable.','high');
  // 4) termination notice
  const tn=low.match(/(\d{1,3})\s*days'?\s*(?:written\s*)?notice/);
  if(tn){ const i=low.indexOf(tn[0]); add('t-term','low','ambiguity',`Termination notice: ${tn[1]} days`,sentenceAround(text,i),
    'The exit notice period sets how quickly you can walk away.','Confirm the notice period is acceptable for your exposure.','high'); }
  // 5) liability / indemnity
  const li=firstIdx('limitation of liability','total liability','liability is limited','liability shall','indemnif');
  if(li>=0) add('t-liab','med','risk','Liability / indemnity — review carefully',sentenceAround(text,li),
    'Counterparty paper often caps their liability low and pushes broad indemnities onto you.',
    'Confirm the cap is mutual and reasonable and indemnities are limited to their fault.','medium');
  // 6) stamp duty for leases
  if((low.includes('lease')||low.includes('landlord')||low.includes('tenant')) && !low.includes('stamp duty'))
    add('t-stamp','med','risk','Lease with no stamp-duty provision','',
      'An unstamped lease is inadmissible in evidence in Kenya until duty and penalties are paid (Stamp Duty Act, Cap 480).',
      'Ensure stamp duty is assessed and paid via iTax within 30 days of execution.','medium');
  // 7) data protection for corporate/IT paper
  if(c.folder==='corp' && !/(data protection|data processing|personal data|odpc)/.test(low))
    add('t-dp','low','missing','No data-protection terms detected','',
      'Under the Data Protection Act 2019 you remain responsible for how vendors process personal data.',
      'Confirm a data-processing / DPA clause with ODPC-aligned obligations is included.','low');
  return F;
}

function openUploadModal(){
  if(!canEdit()){ toast('Viewers cannot add contracts','err'); return; }
  const folderOpts=Object.values(FOLDERS).map(f=>`<option value="${f.id}">${f.name}</option>`).join('');
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('upload')}</span>
        <h2 class="font-display font-700 text-brand-900">Upload a received contract</h2></div>
      <p class="text-xs text-brand-800/70 mb-4">Add a contract another company sent you — on their own paper. Attach the file and a few details, then review, AI-scan and sign it here, with a full audit trail and a cryptographic seal.</p>
      <label class="block mb-3">
        <span class="text-xs font-medium text-brand-800/70">Contract file <span class="text-brand-800/65">(PDF, Word, image or text · max 4 MB)</span></span>
        <input id="up-file" type="file" accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" class="mt-1 w-full text-sm rounded-lg border border-brand-100 bg-canvas p-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-900 file:text-white file:px-3 file:py-2 file:text-xs file:font-medium"/>
      </label>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        ${upField('up-name','Contract name','e.g. Supply Agreement — Acme')}
        ${upField('up-cp','Received from (counterparty)','e.g. Acme Ltd')}
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-3">
        <label class="block"><span class="text-xs font-medium text-brand-800/70">File under</span>
          <select id="up-folder" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">${folderOpts}</select></label>
        <label class="block"><span class="text-xs font-medium text-brand-800/70">Value type</span>
          <select id="up-vtype" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2.5 text-sm outline-none focus:border-brand-400">
            <option value="estimated">Estimated value</option><option value="fixed">Fixed value</option><option value="none">Non-monetary</option></select></label>
      </div>
      <div class="grid sm:grid-cols-2 gap-2 mb-4">
        ${upField('up-value','Contract value (KES)','e.g. 2500000','number')}
        ${upField('up-expiry','Expiry date (optional)','','date')}
      </div>
      <div id="up-steps" class="hidden" style="margin-bottom:4px"></div>
      <div id="up-actions" class="flex items-center gap-2 justify-end">
        <button id="up-cancel" class="rounded-lg border border-brand-200 px-4 py-2 text-sm text-brand-700 hover:bg-brand-50 transition">Cancel</button>
        <button id="up-go" class="flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition">${icon('upload','w-3.5 h-3.5')} Add contract</button>
      </div>
    </div>`);
  document.getElementById('up-cancel').addEventListener('click',closeModal);
  document.getElementById('up-go').addEventListener('click',submitUpload);
}
/* Named progress line for an upload — turns the anxious wait into visible steps
   and reinforces that a human confirms at the end. active is 1-based; steps at
   an index < active read as done, == active as in-progress, > active as pending. */
const UPLOAD_STEPS=['Reading document','Extracting details','Ready for your review'];
function renderUploadSteps(active){
  const host=document.getElementById('up-steps'); if(!host) return;
  host.classList.remove('hidden');
  host.innerHTML=`<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:10px 12px;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:8px">
    ${UPLOAD_STEPS.map((s,i)=>{ const n=i+1; const done=n<active, cur=n===active;
      const dot=done?`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:#2e8763;color:#fff">${icon('check2','w-2.5 h-2.5')}</span>`
        :cur?`<span class="scan-pulse" style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-accent);color:#fff;font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`
        :`<span style="width:16px;height:16px;flex:none;display:grid;place-items:center;border-radius:50%;background:var(--color-neutral-200);color:var(--color-neutral-600);font-size:9px;font-weight:700;font-family:var(--font-mono)">${n}</span>`;
      const col=done?'#1e6b4d':cur?'var(--color-accent-800)':'var(--color-neutral-500)';
      return `<span style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:${cur?600:500};color:${col}">${dot}${s}</span>`
        + (n<UPLOAD_STEPS.length?`<span style="color:var(--color-neutral-400);margin:0 1px">→</span>`:''); }).join('')}
  </div>`;
}
async function submitUpload(){
  const fileInput=document.getElementById('up-file');
  const file=fileInput.files&&fileInput.files[0];
  if(!file){ toast('Choose a file to upload','err'); return; }
  if(file.size>UPLOAD_MAX){ toast('File is larger than 4 MB — please compress or split it','err'); return; }
  const cp=fval('up-cp');
  const name=fval('up-name')||file.name.replace(/\.[^.]+$/,'');
  const folder=document.getElementById('up-folder').value;
  const vtype=document.getElementById('up-vtype').value;
  const value=vtype==='none'?0:Number(fval('up-value')||0);
  const expiry=fval('up-expiry')||null;
  const btn=document.getElementById('up-go'); const cancelBtn=document.getElementById('up-cancel');
  btn.disabled=true; if(cancelBtn) cancelBtn.disabled=true;
  btn.innerHTML='<span class="animate-pulse">Working…</span>';
  renderUploadSteps(1);   // Step 1 — Reading document
  const dataUrl=await new Promise((res,rej)=>{ const rd=new FileReader(); rd.onload=()=>res(rd.result); rd.onerror=()=>rej(new Error('read failed')); rd.readAsDataURL(file); }).catch(()=>null);
  if(!dataUrl){ toast('Could not read that file','err'); btn.disabled=false; if(cancelBtn) cancelBtn.disabled=false; return; }
  const fileHash=await sha256(dataUrl);
  const mime=file.type||'application/octet-stream';
  const extractedText=await extractDocText(dataUrl, mime);   // real text extraction
  const u=currentUser();
  const upload={ fileName:file.name, mime, size:file.size, fileHash, uploadedAt:nowISO(), uploadedBy:u?.name||'System',
    extractedText, textChars:extractedText.length, dataUrl };
  // API mode: store bytes on the server and keep only a reference in the synced record.
  if(API_MODE()){
    try{ const r=await api('files','POST',{ name:file.name, mime, dataUrl });
      upload.fileId=r.id; }catch(e){ /* fall back to inline bytes */ }
  }
  const c={ id:nextId(), name, counterparty:cp, value, status: cp?'Under Review':'Draft',
    template:null, source:'upload', folder, valueType:vtype,
    lastAction:todayStr(), expiry, hash:null, signedAt:null, signatory:u?.name||'Authorized signatory',
    compliance:{},
    comments:[{author:'System',role:'Automation',side:'internal',text:`Uploaded “${file.name}”, received from ${cp||'a counterparty'} and filed under ${FOLDERS[folder].name}.${extractedText.length>200?` ${extractedText.length.toLocaleString()} characters of text extracted for AI review.`:''} Review and sign to record acceptance.`,ts:fmtDT(nowISO())}],
    fields:{}, scan:null,
    audit:[{at:nowISO(),user:u?.name||'System',action:'Uploaded',detail:`Received “${file.name}” (${Math.round(file.size/1024)} KB)${extractedText.length>200?`, ${extractedText.length.toLocaleString()} chars extracted`:', no text extracted'}`}],
    signatures:[], upload };
  c._loaded=true; c._light=false; c._v=0;
  const saveContract=(metadata)=>{
    if(metadata){ applyMetadata(c, metadata); }
    state.contracts.unshift(c);
    state.activeId=c.id;
    persist(c);
    closeModal();
    toast('Contract uploaded and filed in '+FOLDERS[folder].name);
    setView('workspace');
    renderSideFolders();
  };
  // E1: extract metadata from the text, then let the human confirm before saving.
  if(extractedText && extractedText.length>200){
    renderUploadSteps(2);   // Step 2 — Extracting details
    const meta=await extractMetadata(extractedText, {counterparty:cp, value, expiry});
    renderUploadSteps(3);   // Step 3 — Ready for your review (the confirm screen)
    openMetaReview(meta, saveContract, { onCancel:()=>saveContract(null) });
  } else {
    saveContract(null);
  }
}
/* Fold confirmed metadata back into the contract's own fields + a metadata block. */
function applyMetadata(c, m){
  c.metadata = m;
  if(m.counterparty && !c.counterparty) c.counterparty=m.counterparty;
  if(m.value && !(Number(c.value)>0)){ c.value=Number(m.value)||0; if(c.valueType==='none') c.valueType='estimated'; }
  if(m.expiryDate && !c.expiry) c.expiry=m.expiryDate;
  logAudit(c,'Metadata confirmed',`Filed with ${m._source==='ai'?'AI-extracted':'pattern-matched'} details (type ${m.contractType||'—'}, renewal ${m.renewalType||'—'})`);
}

/* Working-text document body: shown once a contract carries edited wording
   (an owner edit or an accepted counterparty redline). This exact text is
   what versions/compare diff and what the seal will bind. */
function redlineDocBody(c){
  const esc=s=>String(s||'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return `
    <div class="mb-6 pb-5 border-b border-brand-100">
      <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-800/60 mb-2">${cKind(c)} · working text · ${c.id}</div>
      <h3 class="font-display font-700 text-lg tracking-tight text-brand-900">${c.name}</h3>
    </div>
    <div class="mb-4 flex items-start gap-2 rounded-[4px] px-3 py-2 text-[11px]" style="background:var(--color-accent-100);border:1px solid var(--color-accent-300);color:var(--color-accent-800)" data-anchor="recital">
      ${icon('history','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>This document carries <strong>edited working text</strong>. Use <strong>Edit</strong> to change the wording and <strong>Compare</strong> to review changes between versions — the seal binds this exact text at signing.</span>
    </div>
    <div class="text-[13.5px] leading-[1.9] text-brand-800/85 whitespace-pre-wrap" data-anchor="redline">${esc(c.redlineText)}</div>
    ${signatureBlock(c)}`;
}

/* Plain-text document editor (Admin + Legal). Saves are versioned so
   Compare shows exactly what changed; the audit trail records the edit. */
function openEditDocModal(c){
  if(!canEdit()){ toast('Viewers cannot edit documents','err'); return; }
  if(c.status==='Signed'){ toast('Executed contracts are sealed and read-only','err'); return; }
  const cur=docPlainText(c);
  if(!cur){ toast('This document has no editable text yet','err'); return; }
  const esc=s=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const firstEdit=!c.redlineText&&!isUpload(c);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('pencil','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Edit document — ${c.id}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 10px;line-height:1.5">Change any wording below and save. Every save is captured as a <b>new version</b> — review it under <b>Compare</b> and share the updated text with the counterparty as usual.${firstEdit?' <b>Note:</b> the first edit converts the drafted layout into working text; the highlighted quick-fill fields no longer apply after that.':''}</p>
      <textarea id="ed-text" rows="20" class="scroll-thin" spellcheck="false" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:12px 14px;font:inherit;font-size:12.5px;line-height:1.75;resize:vertical;outline:none;min-height:300px">${esc(cur)}</textarea>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
        <span id="ed-count" style="font-size:10.5px;color:var(--color-neutral-500)">${cur.length.toLocaleString()} characters</span>
        <span style="display:flex;gap:8px">
          <button id="ed-cancel" class="ui-btn">Cancel</button>
          <button id="ed-save" class="ui-btn ui-btn-primary">${icon('check2','w-3.5 h-3.5')} Save changes</button>
        </span>
      </div>
    </div>`, {maxWidth:'860px'});
  const ta=document.getElementById('ed-text');
  ta.addEventListener('input',()=>{ const el=document.getElementById('ed-count'); if(el) el.textContent=ta.value.length.toLocaleString()+' characters'; });
  document.getElementById('ed-cancel').addEventListener('click',closeModal);
  document.getElementById('ed-save').addEventListener('click',()=>{
    const txt=ta.value;
    if(txt.trim()===cur.trim()){ toast('No changes made'); closeModal(); return; }
    if(!txt.trim()){ toast('The document text cannot be empty','err'); return; }
    const u=currentUser();
    if(!(c.versions||[]).length) captureVersion(c,'Original text','System');
    c.redlineText=txt;
    const v=captureVersion(c,`Edited by ${u?.name||'user'}`,u?.name);
    logAudit(c,'Edited',`Document wording edited in the workspace${v?` — captured as v${v.n}`:''}`);
    c.lastAction=todayStr(); persist(c);
    closeModal(); renderWorkspace();
    toast('Changes saved — open Compare to review them');
  });
}

function uploadDocBody(c){
  const u=c.upload||{}, mime=u.mime||'';
  const isPdf=/pdf/.test(mime), isImg=/^image\//.test(mime), isText=/^text\//.test(mime);
  // a generous reading surface: fills the viewport height, with an Expand
  // control that opens the document near-fullscreen for comfortable review
  const canPreview = isPdf||isText||isImg;
  const previewHead = canPreview ? `
    <div class="flex items-center justify-between gap-2 mb-2">
      <div class="text-[11px] font-600 uppercase tracking-[0.14em] text-brand-800/60">Document preview</div>
      <button type="button" data-expand-doc class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1.5 text-[11px] font-600 text-brand-700 hover:border-brand-400 hover:text-brand-900 transition">${icon('expand','w-3.5 h-3.5')} Expand</button>
    </div>` : '';
  const preview = previewHead + ((isPdf||isText)
    ? `<iframe id="uploaded-doc-frame" src="${u.dataUrl}" class="w-full h-[calc(100vh-235px)] min-h-[560px] rounded-xl border border-brand-100 bg-white elev-1" title="Uploaded document"></iframe>`
    : isImg
    ? `<div class="rounded-xl border border-brand-100 bg-white elev-1 overflow-auto max-h-[calc(100vh-235px)] min-h-[420px] grid place-items-start"><img id="uploaded-doc-frame" src="${u.dataUrl}" class="max-w-full" alt="Uploaded document"/></div>`
    : `<div class="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-10 text-center">
         <div class="text-brand-300 mb-2 flex justify-center">${icon('file','w-8 h-8')}</div>
         <div class="text-sm font-600 text-brand-800/80">${u.fileName||'Document'}</div>
         <div class="text-xs text-brand-800/65 mt-1">Word documents can't preview in the browser — download the original to review it.</div>
       </div>`);
  const sizeKB = u.size?Math.round(u.size/1024):0;
  return `
    <div class="mb-6 pb-5 border-b border-brand-100">
      <div class="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-800/60 mb-2">External Document · received · ${c.id}</div>
      <h3 class="font-display font-700 text-lg tracking-tight text-brand-900">${c.name}</h3>
    </div>
    <div class="mb-5 flex items-start gap-2 rounded-lg bg-gold-500/10 border border-gold-500/25 px-3 py-2.5 text-[11px] text-gold-700" data-anchor="doc">
      ${icon('upload','w-3.5 h-3.5 mt-0.5 shrink-0')}<span>This is a contract <strong>received from ${c.counterparty||'a counterparty'}</strong>, on their own paper. Review it below, run the AI review, then sign to record <strong>${FIRST_PARTY}</strong>’s acceptance with a cryptographic seal.</span>
    </div>
    <div class="mb-4 grid sm:grid-cols-2 gap-2 text-[11px]">
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">Original file</div><div class="font-medium text-brand-900 truncate">${u.fileName||'—'} · ${sizeKB} KB</div></div>
      <div class="rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-0.5">Uploaded</div><div class="font-medium text-brand-900 truncate">${u.uploadedBy||'—'} · ${u.uploadedAt?fmtDT(u.uploadedAt):'—'}</div></div>
    </div>
    <div class="mb-4 flex flex-wrap items-center gap-2">
      <a href="${u.dataUrl}" download="${(u.fileName||'contract').replace(/"/g,'')}" class="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download original</a>
      <span class="inline-flex items-center gap-1.5 rounded-lg border ${u.textChars>200?'border-brand-100 bg-brand-50/50 text-brand-700':'border-gold-500/25 bg-gold-500/10 text-gold-700'} px-3 py-2 text-[11px]">${icon('scan','w-3.5 h-3.5')}${u.textChars>200?`${Number(u.textChars).toLocaleString()} characters read — AI review analyses the actual text`:'Text not machine-readable — AI review falls back to a manual checklist'}</span>
    </div>
    ${c.redlineText?`
    <div class="mb-4" data-anchor="redline">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="color:var(--color-accent)">${icon('history','w-3.5 h-3.5')}</span>
        <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.12em;color:var(--color-neutral-600)">Working text (edited)</span>
      </div>
      <div style="border:1px solid var(--color-accent-300);background:var(--color-surface);border-radius:5px;padding:12px 14px;font-size:13px;line-height:1.85;white-space:pre-wrap;color:var(--color-neutral-800)">${String(c.redlineText).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</div>
      <div style="font-size:10.5px;color:var(--color-neutral-600);margin-top:4px">This edited text is what versions, Compare and the seal operate on — the original file below is retained unchanged as the received source.</div>
    </div>`:''}
    ${preview}
    ${signatureBlock(c)}`;
}

// near-fullscreen reader for a received document — the reading surface the
// inline preview can't give inside the split workspace
function openDocReader(url, name){
  if(!url) return;
  const prev=document.getElementById('doc-reader'); if(prev) prev.remove();
  const isImg=/^data:image\//.test(url);
  const body=isImg
    ? `<div class="flex-1 min-h-0 overflow-auto bg-docbg grid place-items-start p-4"><img src="${url}" class="max-w-full mx-auto" alt="${(name||'Document').replace(/"/g,'')}"/></div>`
    : `<iframe src="${url}" class="flex-1 min-h-0 w-full bg-white" title="${(name||'Document').replace(/"/g,'')}"></iframe>`;
  const ov=document.createElement('div');
  ov.id='doc-reader';
  ov.className='fixed inset-0 z-[80] bg-ink/60 backdrop-blur-sm flex flex-col p-3 sm:p-6';
  ov.style.animation='viewIn .2s var(--ease)';
  ov.innerHTML=`
    <div class="mx-auto w-full max-w-[1100px] flex-1 min-h-0 flex flex-col bg-white rounded-2xl elev-4 overflow-hidden">
      <div class="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-hair">
        <div class="min-w-0 flex items-center gap-2.5">
          <span class="h-8 w-8 grid place-items-center rounded-lg bg-brand-50 text-brand-600 shrink-0">${icon('file','w-4 h-4')}</span>
          <div class="min-w-0"><div class="text-sm font-700 text-brand-900 truncate">${name||'Document'}</div><div class="text-[11px] text-brand-800/60">Received document · full-screen reader</div></div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a href="${url}" download="${(name||'contract').replace(/"/g,'')}" class="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-600 text-brand-700 hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Download</a>
          <button type="button" data-close-reader class="inline-flex items-center gap-1.5 rounded-lg bg-brand-900 text-white px-3 py-2 text-xs font-600 hover:bg-brand-800 transition">${icon('close','w-3.5 h-3.5')} Close</button>
        </div>
      </div>
      ${body}
    </div>`;
  document.body.appendChild(ov);
  const close=()=>ov.remove();
  ov.querySelector('[data-close-reader]').addEventListener('click',close);
  ov.addEventListener('click',e=>{ if(e.target===ov) close(); });
  document.addEventListener('keydown',function esc(e){ if(e.key==='Escape'){ close(); document.removeEventListener('keydown',esc);} });
}

function uploadScanRules(c){
  const F=[]; const add=(id,sev,kind,title,what,why,fix)=>F.push({id,sev,kind,title,anchor:'doc',what,why,fix});
  // metadata checks (always)
  if(!c.counterparty) add('u-cp','high','missing','Counterparty not recorded',
    'No counterparty name is recorded against this uploaded document.',
    'A signed contract with no recorded party is hard to enforce and clutters the register.',
    'Add the counterparty’s full registered name (as on the BRS certificate) in the deal details.');
  if(isMonetary(c) && !(Number(c.value)>0)) add('u-val','med','missing','Contract value not recorded',
    'The value field is empty for a document marked as monetary.',
    'Value drives approval thresholds, stamp-duty assessment and portfolio reporting.',
    'Record the agreed KES value, or mark the contract non-monetary if none passes.');

  const text=(c.upload&&c.upload.extractedText)||'';
  if(text.length>200){
    // real analysis over the extracted text
    findingsFromText(c, text).forEach(f=>F.push(f));
  } else {
    // image-only PDF / Word / extraction failed → honest manual checklist
    add('u-noext','low','missing','Document text could not be read automatically',
      'This file did not yield extractable text (a scanned image, or a Word file). The points below are a manual checklist, not a read of the clauses.',
      'Image-only PDFs and Word documents need OCR or conversion before automated clause review.',
      'Upload a text-based PDF for clause-level AI review, or review the document manually.');
    add('u-law','med','risk','Confirm governing law is Kenyan',
      'Confirm the governing-law and jurisdiction clause names Kenya.',
      'A foreign governing law or arbitration seat makes enforcement slow and expensive for a Kenyan business.',
      'Find the governing-law clause and confirm Kenya and a Kenyan forum; negotiate if not.');
    add('u-liab','med','risk','Check liability cap & indemnities',
      'Counterparty paper often caps their liability low and pushes broad indemnities onto you.',
      'An unbalanced liability/indemnity split can expose you well beyond the deal value.',
      'Confirm the cap is mutual and reasonable and indemnities are limited to their fault.');
    add('u-term','low','ambiguity','Confirm term, renewal & exit',
      'Check the term length, any automatic renewal, and your notice period to exit.',
      'Auto-renewing contracts with long notice periods are a common way to get locked in.',
      'Confirm renewal is acceptable and the exit notice period is workable.');
  }
  // always — honest disclaimer
  add('u-legal','low','missing','Have qualified counsel review before signing',
    'This AI review flags common issues but is not legal advice and cannot catch everything.',
    'External paper is drafted for the other side; a clause-by-clause read by a lawyer catches what heuristics miss.',
    'Obtain independent legal review before signing where the value or risk is material.');
  return F;
}

/* ============================================================
   DOC BODY + WORKSPACE
   ============================================================ */
function docBody(c){
  if(isUpload(c)) return uploadDocBody(c);
  if(c.status==='Signed' && c.execution && c.execution.html) return frozenDocBody(c);
  if(c.redlineText) return redlineDocBody(c);
  const t=TEMPLATES[c.template];
  const locked=c.status==='Signed'||PORTAL_MODE||!canEdit();
  const dis=locked?'disabled':'';
  const fDate=(id,val)=>`<input ${dis} type="date" value="${val||''}" data-field="${id}" class="field field-date"/>`;
  const fText=(id,val,ph='')=>`<input ${dis} type="text" value="${val||''}" placeholder="${ph}" data-field="${id}" class="field"/>`;
  const fNum=(id,val,ph='')=>`<input ${dis} type="number" value="${val??''}" placeholder="${ph}" data-field="${id}" class="field field-num"/>`;
  const CP=`<input ${dis} type="text" value="${(c.counterparty||'').replace(/"/g,'&quot;')}" placeholder="Counterparty name" data-sync="counterparty" class="field"/>`;
  const VAL=`<input ${dis} type="number" value="${c.value||''}" placeholder="0" data-sync="value" class="field field-num"/>`;
  // Presentational clause flags — reuse the app's EXISTING scan findings
  // (openFindings), map each to its clause anchor, keep the worst severity.
  const flags={};
  try{ (window.openFindings?openFindings(c):[]).forEach(x=>{ const a=x.anchor;
    if(/^c\d+$/.test(a||'')){ const r=(window.SEV_RANK&&SEV_RANK[x.sev])||{high:3,med:2,low:1}[x.sev]||0;
      if(!flags[a]||r>flags[a].r) flags[a]={r,sev:x.sev}; } }); }catch(e){}
  const FLAGPAL={ high:{tag:'High',bg:'#f1dcd8',fg:'#8f322b',box:'rgba(176,69,60,.05)',line:'rgba(176,69,60,.3)'},
    med:{tag:'Deviation',bg:'#f1e6cd',fg:'#7d5a14',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'},
    low:{tag:'Check',bg:'#f1e6cd',fg:'#7d5a14',box:'rgba(184,134,43,.06)',line:'rgba(184,134,43,.4)'} };
  const clause=(n,title,body)=>{
    const p=flags['c'+n]?FLAGPAL[flags['c'+n].sev]:null;
    const wrap=p?` style="background:${p.box};outline:1px solid ${p.line};border-radius:4px;padding:6px 10px;margin-bottom:14px"`:'';
    const tag=p?`<span style="font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:${p.bg};color:${p.fg};padding:1px 6px;border-radius:3px;flex:none">${p.tag}</span>`:'';
    return `<div class="${p?'py-1':'mb-5 px-2 -mx-2 py-1'}" data-anchor="c${n}"${wrap}><div style="display:flex;align-items:baseline;gap:8px;margin-bottom:4px"><h4 class="font-display font-600 text-brand-900 text-[13px]" style="margin:0">${n}. ${title}</h4>${tag}</div><p class="text-[13.5px] leading-[1.85] text-brand-800/85" style="margin:0">${body}</p></div>`;
  };
  const f=c.fields;
  const D=id=>fDate(id,f[id]);                    // date field
  const T=(id,ph)=>fText(id,f[id],ph);            // text field
  const N=(id,def,ph)=>fNum(id,(f[id]??def),ph);  // number field (with default)

  // Each builder returns { title, recital, clauses[] }. Clause 'c2' holds the
  // contract value for most types (NDA has no value; scanRules mirrors this).
  const BUILD = {
    RM:()=>({ title:'RAW MATERIAL SUPPLY AGREEMENT',
      recital:`This Raw Material Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('material','e.g. refined sugar')} into the Buyer's production facilities in Kenya.`,
      clauses:[
        clause(1,'Supply & Specification',`The Supplier shall supply an estimated ${N('volume',5000)} metric tonnes per annum meeting the agreed specification and the applicable KEBS/EAS standard, delivered DDP to the Buyer's plant.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is KES ${VAL}, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT.`),
        clause(3,'Quality & Rejection',`Consignments failing specification or Public Health / KEBS requirements may be rejected within ${N('inspectDays',3)} days of delivery, with replacement at the Supplier's cost.`),
        clause(4,'Governing Law',`This Agreement is governed by the laws of Kenya, with disputes referred to arbitration in Nairobi under the Nairobi Centre for International Arbitration.`),
      ]}),
    PK:()=>({ title:'PACKAGING SUPPLY AGREEMENT',
      recital:`This Packaging Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Buyer") and ${CP} (the "Supplier") for the supply of ${T('packType','e.g. PET bottles & preforms')} and related packaging materials.`,
      clauses:[
        clause(1,'Scope of Supply',`The Supplier shall manufacture and supply packaging to the Buyer's approved artwork and specification, against a rolling forecast, to the Buyer's plants in Kenya.`),
        clause(2,'Price & Contract Value',`The estimated annual contract value is KES ${VAL}, on agreed per-unit pricing. Any dedicated tooling is owned by the Buyer and listed in Annexure A.`),
        clause(3,'Forecast, Lead Time & Stock',`The Buyer issues a ${N('forecastWeeks',8)}-week rolling forecast; the Supplier holds ${N('safetyDays',14)} days of safety stock and honours agreed lead times.`),
        clause(4,'Intellectual Property & Governing Law',`All trademarks and artwork remain the Buyer's property. This Agreement is governed by the laws of Kenya.`),
      ]}),
    CM:()=>({ title:'CONTRACT MANUFACTURING & CO-PACKING AGREEMENT',
      recital:`This Contract Manufacturing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Brand Owner") and ${CP} (the "Co-Packer") for the manufacture of ${T('product','e.g. powdered beverages')} to the Brand Owner's specification.`,
      clauses:[
        clause(1,'Manufacturing Scope',`The Co-Packer shall manufacture, fill and pack the products to the Brand Owner's recipe and specification at its licensed facility. All formulations and recipes remain the exclusive property of the Brand Owner.`),
        clause(2,'Tolling Fee & Contract Value',`The estimated annual contract value is KES ${VAL}, billed as a per-unit conversion (tolling) fee and reconciled monthly against actual output.`),
        clause(3,'Quality, Food Safety & Licences',`The Co-Packer shall maintain FSSC 22000 / KEBS certification and valid Public Health and KRA licences, and permit the Brand Owner to audit on ${N('auditNotice',7)} days' notice.`),
        clause(4,'Liability & Governing Law',`The Co-Packer is liable for defects arising from its process, including recall costs. This Agreement is governed by the laws of Kenya.`),
      ]}),
    EQ:()=>({ title:'EQUIPMENT LEASE & MAINTENANCE AGREEMENT',
      recital:`This Equipment Lease is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Lessee") and ${CP} (the "Lessor") for the lease of ${T('equipment','e.g. a PET filling line')} installed at the Lessee's plant.`,
      clauses:[
        clause(1,'Equipment & Title',`The Lessor shall install and commission the equipment at the Lessee's premises. Title to the equipment remains with the Lessor at all times during the term.`),
        clause(2,'Lease Charges',`The Lessee shall pay a monthly lease charge of KES ${VAL}, in advance, exclusive of VAT.`),
        clause(3,'Maintenance & Uptime',`The Lessor guarantees ${N('uptime',95)}% availability with an on-site response within ${N('respHrs',24)} hours, and holds critical spares locally.`),
        clause(4,'Term, Insurance & Governing Law',`The term is ${N('termYears',3)} years. The Lessee shall insure the equipment to full replacement value with the Lessor noted as loss payee. Kenyan law governs.`),
      ]}),
    WH:()=>({ title:'WAREHOUSING & COLD-CHAIN SERVICES AGREEMENT',
      recital:`This Warehousing Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Provider") for third-party storage and handling at ${T('site','e.g. Industrial Area, Nairobi')}.`,
      clauses:[
        clause(1,'Storage & Handling',`The Provider shall store up to ${N('pallets',1200)} pallet positions, including ${T('tempRange','e.g. 2–8°C chilled')} temperature-controlled space, with inventory managed on the Client's WMS.`),
        clause(2,'Service Charge',`The monthly service charge is KES ${VAL}, based on pallet positions and throughput, exclusive of VAT.`),
        clause(3,'Stock Accuracy & Temperature SLA',`The Provider shall maintain not less than ${N('accuracy',99)}% stock accuracy and continuous temperature logging, reporting any excursion within ${N('excursionHrs',2)} hours.`),
        clause(4,'Liability & Governing Law',`The Provider is liable for loss or damage to goods in its custody up to their stock value. This Agreement is governed by the laws of Kenya.`),
      ]}),
    FF:()=>({ title:'FREIGHT & DISTRIBUTION AGREEMENT',
      recital:`This Freight & Distribution Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Carrier") for the distribution of finished goods across ${T('region','e.g. Nairobi to Coast')}.`,
      clauses:[
        clause(1,'Scope of Services',`The Carrier shall collect from the Principal's warehouse and deliver to the ${T('channel','e.g. distributors and modern trade')} within the agreed territory.`),
        clause(2,'Rates & Contract Value',`The estimated annual contract value is KES ${VAL}, billed against agreed per-drop and per-kilometre rates and reconciled monthly.`),
        clause(3,'Service Levels',`The Carrier commits to an on-time-in-full (OTIF) target of ${N('otif',98)}% with delivery within ${N('leadHrs',48)} hours of dispatch, per the KPI schedule in Annexure A.`),
        clause(4,'Liability & Governing Law',`Liability for loss in transit is capped per consignment value. This Agreement is governed by Kenyan law with arbitration seated in Nairobi.`),
      ]}),
    DA:()=>({ title:'DISTRIBUTOR AGREEMENT',
      recital:`This Distributor Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Principal") and ${CP} (the "Distributor"), appointing the Distributor for the ${T('territory','e.g. Nyanza')} territory.`,
      clauses:[
        clause(1,'Appointment & Territory',`The Principal appoints the Distributor on a non-exclusive basis to distribute its products within the territory. The Distributor shall not actively sell outside the territory without written consent.`),
        clause(2,'Targets & Contract Value',`The estimated annual purchase value is KES ${VAL}, against agreed volume targets and a ${N('margin',12)}% distributor margin.`),
        clause(3,'Credit & Payment Terms',`A credit limit of ${N('creditDays',30)} days applies, secured by a bank guarantee. Title to goods passes on delivery.`),
        clause(4,'Term, Termination & Governing Law',`The term is ${N('termYears',2)} years, terminable on ${N('noticeDays',90)} days' written notice. Kenyan law governs.`),
      ]}),
    RL:()=>({ title:'RETAIL LISTING & SUPPLY AGREEMENT',
      recital:`This Retail Listing & Supply Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Supplier") and ${CP} (the "Retailer") for the listing and supply of the Supplier's products into the Retailer's stores.`,
      clauses:[
        clause(1,'Listing & Range',`The Retailer shall list the agreed SKUs across ${N('stores',40)} stores, with planogram and shelf space per the trading terms in Annexure A.`),
        clause(2,'Trading Terms & Value',`The estimated annual supply value is KES ${VAL}, with a ${N('rebate',5)}% volume rebate and the agreed listing fees.`),
        clause(3,'Payment & Returns',`Payment falls due within ${N('payDays',60)} days of invoice. Short-dated or damaged stock is handled per the returns schedule.`),
        clause(4,'Compliance & Governing Law',`Products shall comply with KEBS labelling and Legal Metrology requirements. This Agreement is governed by the laws of Kenya.`),
      ]}),
    MK:()=>({ title:'MARKETING & TRADE PROMOTION SERVICES AGREEMENT',
      recital:`This Marketing Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Agency") for ${T('services','e.g. creative, media and activation')} services.`,
      clauses:[
        clause(1,'Scope of Services',`The Agency shall provide the services in accordance with approved campaign briefs and the Client's annual marketing calendar.`),
        clause(2,'Fees & Contract Value',`The annual retainer / working budget is KES ${VAL}, billed ${T('billing','e.g. monthly')}, exclusive of VAT and third-party pass-through costs.`),
        clause(3,'Approvals & Media',`All spend and creative require the Client's prior written approval. Any media rebates or volume bonuses are passed back to the Client in full.`),
        clause(4,'IP, Confidentiality & Governing Law',`All work product and campaign intellectual property vest in the Client upon payment. This Agreement is governed by the laws of Kenya.`),
      ]}),
    ND:()=>({ title:'MUTUAL NON-DISCLOSURE AGREEMENT',
      recital:`This Mutual Non-Disclosure Agreement is entered into on ${D('effDate')} between <strong>${FIRST_PARTY}</strong>, a company incorporated in the Republic of Kenya, and ${CP}, collectively the "Parties".`,
      clauses:[
        clause(1,'Purpose',`The Parties wish to explore a potential business relationship and, in connection therewith, may disclose confidential and proprietary information. No monetary consideration passes under this Agreement; the mutual exchange of Confidential Information constitutes sufficient consideration.`),
        clause(2,'Confidential Information',`"Confidential Information" means all non-public information disclosed by one Party to the other, including recipes, specifications, commercial terms, pricing and customer data.`),
        clause(3,'Term',`This Agreement shall remain in force for ${N('termYears',3)} years from the effective date, unless terminated earlier by written notice to the registered office in Nairobi.`),
        clause(4,'Governing Law',`This Agreement is governed by the laws of the Republic of Kenya, and the Parties submit to the exclusive jurisdiction of the Courts at Nairobi.`),
      ]}),
    LE:()=>({ title:'COMMERCIAL PROPERTY LEASE AGREEMENT',
      recital:`This Lease is made on ${D('effDate')} between ${CP} (the "Landlord") and <strong>${FIRST_PARTY}</strong> (the "Tenant") in respect of commercial premises situated at ${T('premises','e.g. Westlands, Nairobi')}.`,
      clauses:[
        clause(1,'Demised Premises',`The Landlord leases to the Tenant premises measuring ${N('sqm',420)} square metres, together with shared access to power, water and secure parking.`),
        clause(2,'Rent',`The Tenant shall pay monthly rent of KES ${VAL}, in advance on or before the 5th day of each month, exclusive of VAT at the prevailing KRA rate.`),
        clause(3,'Term & Deposit',`The lease term is ${N('termYears',6)} years, secured by a deposit of ${N('deposit',0,'deposit KES')} held against dilapidations and refundable per clause 7.`),
        clause(4,'Governing Law',`This Lease is governed by the laws of Kenya, including the Land Act (2012), with disputes referred to the Environment and Land Court at Nairobi.`),
      ]}),
    PS:()=>({ title:'PROFESSIONAL SERVICES AGREEMENT',
      recital:`This Professional Services Agreement is made on ${D('effDate')} between <strong>${FIRST_PARTY}</strong> (the "Client") and ${CP} (the "Adviser") for ${T('services','e.g. statutory audit / legal advisory')} services.`,
      clauses:[
        clause(1,'Scope of Engagement',`The Adviser shall provide the professional services described in the engagement letter / Annexure A with reasonable skill and care.`),
        clause(2,'Fees & Contract Value',`The fees for the engagement are KES ${VAL}, billed ${T('billing','e.g. on milestones')}, exclusive of VAT and disbursements.`),
        clause(3,'Standard & Independence',`The services shall be performed to professional standards and, where regulated, in line with ICPAK / LSK requirements and applicable independence rules.`),
        clause(4,'Liability, Confidentiality & Governing Law',`The Adviser's liability is capped at the fees paid, save for negligence or wilful default. This Agreement is governed by the laws of Kenya.`),
      ]}),
  };
  const built=(BUILD[c.template]||BUILD.ND)();
  const title=built.title, recital=built.recital, clauses=built.clauses;
  return `
    <div style="text-align:center;margin-bottom:18px">
      <div style="font-size:10px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.2em;color:var(--color-neutral-600);margin-bottom:6px">${t.kind} · Republic of Kenya · ${c.id}</div>
      <h3 style="text-align:center;font-size:19px;margin:0;line-height:1.2">${title}</h3>
    </div>
    <p class="text-[13px] leading-[1.7] text-brand-800/85 mb-6 px-2 -mx-2 py-1" data-anchor="recital">${recital}</p>
    ${clauses.join('')}
    ${signatureBlock(c)}`;
}
function signatureBlock(c){
  const locked=c.status==='Signed';
  if(locked){
    const hashDisplay=c.hash&&c.hash!=='PRE-SEEDED'?c.hash:('sample-'+generatePseudo(c.id).slice(0,32));
    const first=(c.signatures||[]).find(s=>s.party==='first');
    const cp=(c.signatures||[]).find(s=>s.party==='counterparty');
    const sub=s=>`<div class="text-[10px] text-brand-800/65 font-normal leading-snug">${[s.email,s.method,s.at?fmtDT(s.at):'',s.ip?'IP '+s.ip:''].filter(Boolean).join(' · ')}</div>`;
    const party=(label,ic,s,fallback)=>`<div class="rounded-lg bg-white border border-brand-100 p-2.5">
      <div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">${icon(ic,'w-3 h-3')} ${label}</div>
      ${s?`<div class="font-medium text-brand-700">${s.name}${s.title?', '+s.title:''}</div>${sub(s)}`:`<div class="text-brand-800/60 text-xs">${fallback}</div>`}</div>`;
    return `
    <div class="seal-in mt-8 rounded-2xl elev-3 bg-gradient-to-br from-brand-50 to-white p-6">
      <div class="flex items-start gap-4">
        <svg class="seal-pop shrink-0" width="62" height="62" viewBox="0 0 96 96" style="filter:drop-shadow(0 6px 14px rgba(60,40,10,.18))">
          <circle cx="48" cy="48" r="46" fill="#fff"/>
          <circle cx="48" cy="48" r="46" fill="none" stroke="#086B54" stroke-width="2"/>
          <circle cx="48" cy="48" r="38" fill="rgba(8,107,84,.10)" stroke="#C79A3E" stroke-width="1.5"/>
          <text x="48" y="45" text-anchor="middle" font-family="'IBM Plex Sans',sans-serif" font-weight="700" font-size="12.5" fill="#2e8763">SEALED</text>
          <text x="48" y="58" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="7" fill="#1e6b4d">SHA-256</text>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 warm-flip"><span class="font-display font-700 text-[17px] text-ink">Executed &amp; Sealed</span>${statusChip('Signed')}</div>
          <div class="mt-1 text-xs text-brand-800/60">Electronic signatures under the Business Laws (Amendment) Act 2020 (Kenya).</div>
          <div class="mt-3 grid sm:grid-cols-2 gap-3 text-xs">
            ${party('First party', 'finger', first||(c.signatory?{name:c.signatory,method:'session-authenticated',at:c.execution?.at}:null), 'Not recorded')}
            ${party('Counterparty', 'users', cp, 'Pending — share the document to collect a verified counter-signature')}
          </div>
          ${!isUpload(c)?`<div class="mt-3 rounded-lg bg-white border border-brand-100 p-2.5"><div class="text-brand-800/65 uppercase tracking-wider text-[10px] mb-1">Sealed text fingerprint (SHA-256)</div><div class="font-mono text-[10px] break-all text-brand-700">${c.execution?.textHash||'—'}</div></div>`:''}
          <div class="mt-3 rounded-lg bg-brand-900 p-3 font-mono text-[11px] leading-relaxed">
            <div class="flex items-center gap-1.5 text-gold-400 mb-1">${icon('hash','w-3 h-3')} DOCUMENT SEAL (SHA-256)</div>
            <div class="text-brand-100 break-all">${hashDisplay}</div>
            <div class="text-brand-300 mt-1.5">${c.signedAt||'Timestamp recorded'}</div>
          </div>
          <div class="mt-2 text-[10px] text-brand-800/60 leading-snug">Signer identity is verified by account session (first party) and email one-time code (counterparty). Government IPRS identity and CAK-accredited PKI are on the roadmap and not yet active.</div>
        </div>
      </div>
    </div>`;
  }
  return `
    <div class="mt-8 rounded-xl border border-dashed border-brand-200 bg-brand-50/30 p-5 text-center" data-anchor="sig">
      <div class="text-brand-300 mb-2 flex justify-center">${icon('finger','w-6 h-6')}</div>
      <div class="text-sm font-medium text-brand-800/70">Signature block — pending execution</div>
      <div class="text-xs text-brand-800/65 mt-0.5">Confirm intent to sign from the panel on the right.</div>
    </div>`;
}
function frozenDocBody(c){
  return `${c.execution.html}${signatureBlock(c)}`;
}

/* One clear next action per lifecycle stage — drives the sticky bar at the top
   of the open contract so the single most useful verb is never buried in the
   rich workspace. Returns {label, ic, guide, kind} or null. */
function wsNextAction(c){
  if(c.status==='Signed') return { label:'Evidence pack', ic:'download', guide:'Executed &amp; sealed.', kind:'evidence' };
  if(c.status==='Declined') return null;
  if(!canEdit()) return null;
  const hasTerms=c.counterparty&&(!isMonetary(c)||Number(c.value)>0);
  const appr=(window.approvalState?approvalState(c):{ok:true});
  if(c.status==='Draft'){
    if(!hasTerms) return { label:'Complete key terms', ic:'pencil', guide:'Add the counterparty and value to move this forward.', kind:'terms' };
    return { label:'Send for review', ic:'check2', guide:'Key terms are set — move it into review.', kind:'review' };
  }
  // Under Review
  if(!appr.ok) return { label:'Send to counterparty', ic:'share', guide:'Share the draft to negotiate or collect signature.', kind:'share' };
  if(!c.compliance.consent) return { label:'Sign', ic:'finger', guide:'Approved — confirm intent and sign below.', kind:'sign-scroll' };
  return { label:'Sign', ic:'finger', guide:'Approved and ready — apply the sealed signature.', kind:'sign' };
}

function renderWorkspace(){
  const c=getContract(state.activeId);
  const content=document.getElementById('content');
  if(!c){
    content.innerHTML=`
    <div class="view-enter grid place-items-center min-h-screen px-8">
      <div class="text-center max-w-sm">
        <div class="mx-auto h-14 w-14 grid place-items-center rounded-2xl bg-white border border-brand-100 text-brand-300 mb-4">${icon('file','w-7 h-7')}</div>
        <h2 class="font-display font-600 text-lg text-brand-900">No contract open</h2>
        <p class="text-sm text-brand-800/70 mt-1">Open a folder from the dashboard, or generate a contract from a template.</p>
        <button onclick="setView('dashboard')" class="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-brand-800 transition">${icon('grid')} Go to dashboard</button>
      </div>
    </div>`;
    setActiveNav('workspace'); return;
  }
  // load the full contract body (comments, audit, execution text, extracted text) on first open
  if(API_MODE() && !c._loaded){
    content.innerHTML=`<div class="view-enter grid place-items-center min-h-screen"><div class="text-center text-brand-800/70"><div class="mx-auto mb-3 h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-500 animate-spin"></div><div class="text-sm">Loading contract…</div></div></div>`;
    setActiveNav('workspace');
    ensureFull(c).then(()=>{ if(state.activeId===c.id) renderWorkspace(); })
      .catch(e=>{ if(state.activeId===c.id) content.innerHTML=`<div class="grid place-items-center min-h-screen text-sm text-rose-600">Could not load this contract: ${e.message}</div>`; });
    return;
  }
  const locked=c.status==='Signed';
  // Industry design-system tokens — inline styles per the design handoff.
  const CARD='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:6px';
  const H6='margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
  const KROW='display:flex;justify-content:space-between;gap:8px;padding:4px 0;border-bottom:1px solid rgba(29,31,32,.06);font-size:11.5px';
  const KKEY='color:var(--color-neutral-600);flex:none';
  const kv=(k,v)=>`<div style="${KROW}"><span style="${KKEY}">${k}</span><span style="font-weight:500;text-align:right;min-width:0">${v}</span></div>`;
  const tmplLabel=c.template?((window.TEMPLATES&&TEMPLATES[c.template]&&TEMPLATES[c.template].name)||c.template):(isUpload(c)?'Uploaded document':'—');
  // Right context panel is user-resizable by dragging its left edge: 300px
  // (default/min) → 450px (max, +50%). The chosen width is remembered.
  const DOC_PANEL_MIN=300, DOC_PANEL_MAX=450;
  const docPanelW=(()=>{ try{ const v=Number(typeof lsGet==='function'&&lsGet('hati.v1.docPanelW')); return (v>=DOC_PANEL_MIN&&v<=DOC_PANEL_MAX)?Math.round(v):DOC_PANEL_MIN; }catch(_){ return DOC_PANEL_MIN; } })();
  content.innerHTML=`
  <div class="view-enter" style="height:calc(100vh - 52px);box-sizing:border-box;padding:14px 16px 18px;display:flex;flex-direction:column">
    <div id="doc-grid" style="position:relative;flex:1;min-height:0;display:grid;grid-template-columns:1fr ${docPanelW}px;gap:14px">

      <!-- ============ LEFT: document card (own scroll) ============ -->
      <section style="${CARD};overflow:hidden;display:flex;flex-direction:column;min-height:0">
        <!-- document toolbar -->
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:11px 16px;border-bottom:1px solid var(--color-divider)">
          <button id="ws-back" title="Back to register" class="ui-btn" style="width:30px;height:30px;padding:0;flex:none">${icon('arrowLeft','w-4 h-4')}</button>
          <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:8px">
              <h3 style="font-size:17px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.name}</h3>
              <span id="ws-status" style="flex:none">${statusChip(c.status)}</span>
            </div>
            <div style="font-size:11px;color:var(--color-neutral-600);margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.id} · ${FOLDERS[c.folder].name} · updated ${c.lastAction}</div>
          </div>
          ${(canEdit()&&!locked)?`
          <button id="ws-edit" title="Edit the document wording — changes are versioned" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('pencil','w-3.5 h-3.5')} Edit</button>`:''}
          ${canEdit()?`
          <button id="ws-share" title="Share with counterparty" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('share','w-3.5 h-3.5')} Share</button>
          <button id="ws-import" title="Import counterparty response" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('upload','w-3.5 h-3.5')} Import</button>
          <button id="ws-tpl" title="Save as template" class="ui-btn" style="width:30px;height:30px;padding:0">${icon('copy','w-3.5 h-3.5')}</button>`:''}
          <button id="ws-compare" title="Compare versions &amp; review changes" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('history','w-3.5 h-3.5')} Compare</button>
          <button id="ws-pdf" title="Export as PDF" class="ui-btn" style="font-size:12px;padding:5px 10px">${icon('printer','w-3.5 h-3.5')} PDF</button>
          <button id="ws-ai" title="Ask HaTi AI" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('sparkle','w-3.5 h-3.5')} Ask AI</button>
        </div>
        <!-- document body (scrolls within the left pane) -->
        <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:20px 28px;background:var(--color-bg)">
          ${(()=>{ const na=wsNextAction(c); if(!na) return '';
            return `<div style="position:sticky;top:-20px;z-index:6;margin:-20px -28px 16px;padding:9px 16px;background:var(--color-surface);border-bottom:1px solid var(--color-divider);box-shadow:var(--shadow-sm);display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <span style="flex:none">${statusChip(c.status)}</span>
              <span style="flex:1;min-width:120px;font-size:12px;color:var(--color-neutral-700)">${na.guide}</span>
              <button id="ws-next-action" data-na="${na.kind}" class="ui-btn ui-btn-primary" style="font-size:12.5px;padding:6px 14px;flex:none">${icon(na.ic,'w-3.5 h-3.5')} ${na.label}</button>
            </div>`; })()}
          ${locked?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-900 text-brand-100 px-3 py-2 text-[11px]" style="max-width:660px;margin:0 auto 14px">${icon('lock','w-3.5 h-3.5')}<span>This document is executed and locked.${isUpload(c)?' The sealed file is bound by its SHA-256 fingerprint.':' Fields are read-only.'}</span></div>`
            :!canEdit()?`<div class="mb-5 flex items-center gap-2 rounded-[4px] px-3 py-2 text-[11px]" style="max-width:660px;margin:0 auto 14px;background:var(--color-neutral-100);border:1px solid var(--color-divider);color:var(--color-neutral-700)">${icon('lock','w-3.5 h-3.5')}<span>You have viewer access — the document is read-only for your role.</span></div>`
            :isUpload(c)?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('scan','w-3.5 h-3.5')}<span>Received document — read it below, run the AI review, then sign to record acceptance.</span></div>`
            :c.redlineText?`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('pencil','w-3.5 h-3.5')}<span>Working text — use <b>Edit</b> to change the wording and <b>Compare</b> to review changes between versions.</span></div>`
            :`<div class="mb-5 flex items-center gap-2 rounded-[4px] bg-brand-50 border border-brand-100 px-3 py-2 text-[11px] text-brand-700" style="max-width:660px;margin:0 auto 14px">${icon('sparkle','w-3.5 h-3.5')}<span>Highlighted fields are editable — changes sync live to the key terms on the right.</span></div>`}
          <div class="blueprint" style="background:#fbfbfc;box-shadow:var(--shadow-md);padding:30px 36px;max-width:660px;margin:0 auto;border-radius:4px">
            
            <article id="doc-canvas" style="background:transparent">${docBody(c)}</article>
          </div>
        </div>
      </section>

      <!-- ============ RIGHT: context stack (own scroll, pinned sign) ============ -->
      <!-- drag handle: floats in the gutter between the document and the panel
           (a direct child of the grid, so the panel's own overflow can't clip
           it). Drag left to widen the panel to +50%, double-click to reset. -->
      <div id="doc-resizer" title="Drag to resize (300–450px) · double-click to reset" style="position:absolute;top:0;bottom:0;right:${docPanelW+1}px;width:12px;z-index:6;cursor:col-resize;display:flex;align-items:center;justify-content:center;touch-action:none" onmouseover="this.firstElementChild.style.background='var(--color-accent)'" onmouseout="if(!this.dataset.drag)this.firstElementChild.style.background='var(--color-divider)'">
        <span style="width:3px;height:38px;border-radius:999px;background:var(--color-divider);transition:background .15s"></span>
      </div>

      <div id="doc-right" class="scroll-thin" style="display:flex;flex-direction:column;gap:12px;min-height:0;overflow-y:auto;padding-right:2px">

        <!-- Key terms -->
        <section style="${CARD};padding:12px">
          <h6 style="${H6};margin-bottom:8px">Key terms</h6>
          <div style="${KROW}"><span style="${KKEY}">Counterparty</span><span id="meta-cp" style="font-weight:500;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px">${c.counterparty||'—'}</span></div>
          <div style="${KROW}"><span style="${KKEY}">Value</span><span id="meta-value" style="font-weight:600;text-align:right;font-family:var(--font-mono)">${!isMonetary(c)?'Non-monetary':(c.value?fmtKES(c.value)+(c.valueType==='estimated'?' (est.)':''):'—')}</span></div>
          <div style="${KROW}"><span style="${KKEY}">Status</span><span id="meta-status">${statusChip(c.status)}</span></div>
          ${kv('Stream',(window.streamLabel?streamLabel(c):'—'))}
          ${kv('Effective',(c.fields&&c.fields.effDate)||'—')}
          ${kv('Expiry',c.expiry||'—')}
          <div style="${KROW};border-bottom:none"><span style="${KKEY}">Template</span><span style="font-weight:500;text-align:right;min-width:0">${tmplLabel}</span></div>
        </section>

        <!-- AI scan (renderScanSection) -->
        <div id="scan-section" style="${CARD};overflow:hidden"></div>

        <!-- Playbook / negotiation / versions / obligations / engagement (empty:hidden) -->
        <div id="playbook-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
        <div id="nego-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
        <div id="versions-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
        <div id="obligations-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>
        <div id="engagement-section" class="empty:hidden" style="${CARD};overflow:hidden"></div>

        <!-- Audit trail (renderAuditSection) -->
        <div id="audit-section" style="${CARD};overflow:hidden"></div>

        <!-- Activity & comments -->
        <section style="${CARD};padding:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <h6 style="${H6};flex:1">Activity &amp; comments</h6>
            <span class="flex items-center gap-1" style="font-size:10px;color:#1e6b4d;font-weight:600"><span class="live-dot" style="height:6px;width:6px;border-radius:9999px;background:#2e8763;display:inline-block"></span>live</span>
          </div>
          <div id="feed" class="space-y-3 scroll-thin" style="max-height:280px;overflow-y:auto;padding-right:4px"></div>
          <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--color-divider)">
            <div style="font-size:10px;color:var(--color-neutral-600);margin-bottom:6px">Commenting as <span style="font-weight:600;color:var(--color-neutral-800)">${currentUser()?.name||'you'}</span> · internal — counterparty replies arrive via share-link responses</div>
            <div style="display:flex;gap:6px">
              <input id="comment-input" type="text" placeholder="Add a comment on the terms…" style="flex:1;min-width:0;border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:6px 9px;font-size:12px;outline:none"/>
              <button id="comment-send" class="ui-btn ui-btn-primary" style="width:32px;height:32px;padding:0;flex:none">${icon('send','w-4 h-4')}</button>
            </div>
          </div>
        </section>

        <!-- Signer verification & consent -->
        <section style="${CARD};padding:12px">
          <h6 style="${H6};margin-bottom:8px">Signer verification &amp; consent</h6>
          <div style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:9px;margin-bottom:8px;font-size:12px">
            <div style="font-weight:600;display:flex;align-items:center;gap:6px;margin-bottom:2px">${icon('finger','w-3.5 h-3.5')} Signing as ${currentUser()?.name||'you'}</div>
            <div style="color:var(--color-neutral-700);font-family:var(--font-mono);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${currentUser()?.email||''}</div>
            <div style="color:var(--color-neutral-600);font-size:11px;margin-top:2px;line-height:1.4">Identity is established by your authenticated account session; time, device and (on the server) IP are recorded on signing.</div>
          </div>
          <label class="${(locked||!canEdit())?'opacity-70 pointer-events-none':''}" style="display:flex;align-items:flex-start;gap:10px;border:1px solid var(--color-divider);border-radius:4px;padding:10px;cursor:pointer">
            <input type="checkbox" data-comp="consent" ${c.compliance.consent?'checked':''} ${(locked||!canEdit())?'disabled':''} class="mt-0.5 h-4 w-4" style="accent-color:var(--color-accent);flex:none"/>
            <span style="font-size:12px">
              <span style="font-weight:600;display:block">I intend to sign electronically</span>
              <span style="color:var(--color-neutral-700);display:block;line-height:1.4">I agree this electronic signature is legally binding under the Business Laws (Amendment) Act 2020.</span>
            </span>
          </label>
          <div style="margin-top:8px;font-size:10px;color:var(--color-neutral-600);line-height:1.4;display:flex;align-items:flex-start;gap:4px">${icon('alert','w-3 h-3 mt-px shrink-0')}<span>Government IPRS identity and CAK-accredited PKI e-signatures are on the roadmap and not yet integrated. The counterparty verifies by email one-time code when signing.</span></div>
        </section>

        <!-- Sign action (renderSignButton) — pinned to the bottom of the panel -->
        <section style="${CARD};padding:12px;position:sticky;bottom:0;z-index:1;box-shadow:var(--shadow-md)"><div id="sign-wrap"></div></section>

      </div>
    </div>
  </div>`;

  scanUI = { running:false, filter:'all', expanded:new Set() };
  wireDocumentSync(c); renderFeed(c); wireComments(c); wireCompliance(c); renderSignButton(c); renderScanSection(c); renderPlaybookSection(c); renderNegotiationSection(c); renderVersionsSection(c); renderObligationsSection(c); loadEngagement(c); renderAuditSection(c);
  // rehydrate a server-stored uploaded file's bytes for preview/download
  if(API_MODE() && isUpload(c) && c.upload?.fileId && !c.upload?.dataUrl){
    api('files/'+c.upload.fileId).then(f=>{ c.upload.dataUrl=f.dataUrl;
      if(state.activeId===c.id){ const dc=document.getElementById('doc-canvas'); if(dc) dc.innerHTML=docBody(c); }
    }).catch(()=>{});
  }
  document.getElementById('ws-next-action')?.addEventListener('click',e=>{
    const kind=e.currentTarget.getAttribute('data-na');
    if(kind==='evidence'){ downloadEvidence(c); return; }
    if(kind==='share'){ openShareModal(c); return; }
    if(kind==='terms'){
      const first=document.querySelector('#doc-canvas [data-sync], #doc-canvas [data-field]');
      if(first){ first.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>first.focus(),300); }
      else toast('Add the counterparty and value in the key terms panel','err');
      return;
    }
    if(kind==='review'){
      if(c.status==='Draft'){ c.status='Under Review'; c.lastAction=todayStr(); logAudit(c,'Status changed','Draft → Under Review (sent for review)'); persist(c); updateStatusUI(c); renderWorkspace(); toast('Moved to review'); }
      return;
    }
    if(kind==='sign-scroll'){
      const sw=document.getElementById('sign-wrap'); if(sw) sw.scrollIntoView({behavior:'smooth',block:'center'});
      const box=document.querySelector('[data-comp="consent"]'); if(box){ const card=box.closest('label'); if(card){ card.classList.add('anchor-flash'); setTimeout(()=>card.classList.remove('anchor-flash'),1800); } }
      toast('Tick intent-to-sign, then Sign');
      return;
    }
    if(kind==='sign'){ signDocument(c); return; }
  });
  document.getElementById('ws-back').addEventListener('click',()=>{ state.folderId=c.folder; setView('folder'); });
  document.getElementById('ws-ai')?.addEventListener('click',()=>openAI(`Summarize ${c.id}`));

  // Draggable right-panel resizer: drag the left-edge handle to widen the panel
  // leftward (300–450px); the width is clamped and remembered. Live-updates the
  // grid without a re-render so edit/scan state is preserved.
  (function(){
    const grid=document.getElementById('doc-grid'), rez=document.getElementById('doc-resizer');
    if(!grid||!rez) return;
    const grip=rez.firstElementChild;
    const curW=()=>{ const m=/1fr\s+([\d.]+)px/.exec(grid.style.gridTemplateColumns||''); return m?Number(m[1]):DOC_PANEL_MIN; };
    const setW=w=>{ w=Math.max(DOC_PANEL_MIN,Math.min(DOC_PANEL_MAX,Math.round(w))); grid.style.gridTemplateColumns='1fr '+w+'px'; rez.style.right=(w+1)+'px'; return w; };
    const save=w=>{ try{ if(typeof lsSet==='function') lsSet('hati.v1.docPanelW',w); }catch(_){} };
    let startX=0, startW=DOC_PANEL_MIN;
    const onMove=e=>{ const x=(e.touches&&e.touches[0]?e.touches[0].clientX:e.clientX); setW(startW+(startX-x)); };  // drag left → wider
    const onUp=()=>{ rez.dataset.drag=''; delete rez.dataset.drag; grip.style.background='var(--color-divider)'; document.body.style.cursor=''; document.body.style.userSelect=''; window.removeEventListener('pointermove',onMove); window.removeEventListener('pointerup',onUp); save(curW()); };
    rez.addEventListener('pointerdown',e=>{ e.preventDefault(); rez.dataset.drag='1'; startX=e.clientX; startW=curW(); grip.style.background='var(--color-accent)'; document.body.style.cursor='col-resize'; document.body.style.userSelect='none'; window.addEventListener('pointermove',onMove); window.addEventListener('pointerup',onUp); });
    rez.addEventListener('dblclick',()=>{ setW(DOC_PANEL_MIN); save(DOC_PANEL_MIN); });
  })();
  document.getElementById('ws-share')?.addEventListener('click',()=>openShareModal(c));
  document.getElementById('ws-import')?.addEventListener('click',()=>openImportModal(c));
  document.getElementById('ws-compare')?.addEventListener('click',()=>openCompareModal(c));
  document.getElementById('ws-edit')?.addEventListener('click',()=>openEditDocModal(c));
  document.getElementById('ws-tpl')?.addEventListener('click',()=>saveContractAsTemplate(c));
  document.getElementById('ws-pdf')?.addEventListener('click',()=>exportPDF(c));
  document.querySelector('[data-expand-doc]')?.addEventListener('click',()=>openDocReader(c.upload?.dataUrl, c.upload?.fileName||c.name));
  setActiveNav('workspace');
}

/* -------- doc field sync -------- */
function wireDocumentSync(c){
  const canvas=document.getElementById('doc-canvas');
  canvas.querySelectorAll('[data-sync]').forEach(inp=>{
    inp.addEventListener('input',()=>{
      const key=inp.getAttribute('data-sync');
      if(key==='value'){
        c.value=inp.value===''?0:Number(inp.value);
        const mv=document.getElementById('meta-value');
        mv.textContent=c.value?fmtKES(c.value)+(c.valueType==='estimated'?' (est.)':''):'—';
        mv.classList.add('text-brand-500'); setTimeout(()=>mv.classList.remove('text-brand-500'),250);
      } else if(key==='counterparty'){
        c.counterparty=inp.value;
        document.getElementById('meta-cp').textContent=c.counterparty||'—';
      }
      if(c.status==='Draft'&&c.counterparty&&(!isMonetary(c)||Number(c.value)>0)){
        c.status='Under Review'; updateStatusUI(c);
        logAudit(c,'Status changed','Draft → Under Review (key terms completed)');
      }
      c.lastAction=todayStr();
      logAudit(c,'Edited',`Updated ${key==='value'?'contract value':'counterparty'}`);
      persist(c); renderAuditSection(c);
    });
  });
  canvas.querySelectorAll('[data-field]').forEach(inp=>inp.addEventListener('input',()=>{
    c.fields[inp.getAttribute('data-field')]=inp.value;
    c.lastAction=todayStr();
    logAudit(c,'Edited',`Updated field "${inp.getAttribute('data-field')}"`);
    persist(c); renderAuditSection(c);
  }));
}
function updateStatusUI(c){
  const ms=document.getElementById('meta-status'), ws=document.getElementById('ws-status');
  if(ms) ms.innerHTML=statusChip(c.status);
  if(ws) ws.innerHTML=statusChip(c.status);
}

/* -------- comments -------- */
function renderFeed(c){
  const feed=document.getElementById('feed');
  feed.innerHTML=c.comments.map(m=>{
    const internal=m.side==='internal';
    const avatarBg=internal?'bg-brand-100 text-brand-700':'bg-gold-500/15 text-gold-600';
    const initials=m.author.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    return `
    <div class="flex gap-2.5">
      <div class="h-7 w-7 shrink-0 grid place-items-center rounded-full text-[10px] font-semibold ${avatarBg}">${initials}</div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-xs font-medium text-brand-900">${m.author}</span>
          <span class="text-[10px] px-1.5 py-0.5 rounded ${internal?'bg-brand-50 text-brand-600':'bg-gold-500/10 text-gold-600'}">${m.role}</span>
          <span class="text-[10px] text-brand-800/60 ml-auto">${m.ts}</span>
        </div>
        <p class="text-xs text-brand-800/75 mt-0.5 leading-relaxed">${m.text}</p>
      </div>
    </div>`;
  }).join('');
  feed.scrollTop=feed.scrollHeight;
}
function wireComments(c){
  const input=document.getElementById('comment-input');
  const send=document.getElementById('comment-send');
  const post=()=>{
    const text=input.value.trim(); if(!text) return;
    const u=currentUser();
    c.comments.push({ author:u?.name||'You', role:`${ROLE_LABEL[u?.role]||'User'} (Internal)`, side:'internal', text, ts:fmtDT(nowISO()) });
    logAudit(c,'Comment','Internal comment added');
    persist(c);
    input.value=''; renderFeed(c); renderAuditSection(c);
  };
  send.addEventListener('click',post);
  input.addEventListener('keydown',e=>{if(e.key==='Enter')post();});
}

/* -------- compliance + signing -------- */
function wireCompliance(c){
  document.querySelectorAll('[data-comp]').forEach(cb=>cb.addEventListener('change',()=>{
    const key=cb.getAttribute('data-comp');
    c.compliance[key]=cb.checked;
    if(key==='consent') logAudit(c,'Consent',`Intent-to-sign ${cb.checked?'confirmed':'withdrawn'} by ${currentUser()?.name||'user'}`);
    persist(c); renderSignButton(c); renderAuditSection(c);
  }));
}
function renderSignButton(c){
  const wrap=document.getElementById('sign-wrap'); if(!wrap) return;
  if(c.status==='Signed'){
    wrap.innerHTML=`
      <div class="flex items-center justify-center gap-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 py-3 text-sm font-medium">${icon('check2')} Executed &amp; sealed</div>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button id="verify-seal" class="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('shield','w-3.5 h-3.5')} Verify seal</button>
        <button id="evidence-dl" class="flex items-center justify-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Evidence pack</button>
      </div>`;
    document.getElementById('verify-seal').addEventListener('click',()=>verifySeal(c));
    document.getElementById('evidence-dl').addEventListener('click',()=>downloadEvidence(c));
    return;
  }
  if(!canEdit()){
    wrap.innerHTML=`<div class="text-center text-[11px] text-brand-800/65 py-2">Viewer access — signing is disabled for your role.</div>`;
    return;
  }
  const appr=approvalState(c);
  const ns=nextSigner(c), planned=signerPlan(c).length>0;
  // With a signer plan, the in-app button only acts when it's an internal
  // signer's turn; counterparty turns are collected via the share link.
  const signerReady = !planned || (ns && ns.party==='internal');
  const ready=c.counterparty&&(!isMonetary(c)||Number(c.value)>0)&&c.compliance.consent&&appr.ok&&signerReady;
  const missing=[];
  if(!c.counterparty)missing.push('counterparty name');
  if(isMonetary(c)&&!(Number(c.value)>0))missing.push('contract value');
  if(!c.compliance.consent)missing.push('intent-to-sign consent');
  if(!appr.ok)missing.push('approvals');
  const signLabel = planned&&ns ? `Sign as ${ns.name}` : 'Sign Document';
  wrap.innerHTML=`
    ${approvalPanelHtml(c)}
    <button id="sign-btn" ${ready?'':'disabled'} class="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition ${ready?'bg-brand-900 text-white hover:bg-brand-800 shadow-lg shadow-brand-900/20':'bg-brand-100 text-brand-800/60 cursor-not-allowed'}">
      ${icon('finger','w-[18px] h-[18px]')} ${signLabel}
    </button>
    ${!planned&&canEdit()&&c.status!=='Signed'?`<button id="sp-setup" class="mt-2 w-full text-[11px] text-brand-600 hover:text-brand-800 font-600">Set a multi-signer order…</button>`:''}
    ${ready?`<p class="mt-2 text-[11px] text-center text-brand-800/65">Freezes the exact text, applies a tamper-evident SHA-256 seal${planned?' when the last signer signs':''}.</p>`
           :`<p class="mt-2 text-[11px] text-center text-brand-800/65">${planned&&ns&&ns.party==='counterparty'?`Next signer is <b>${ns.name}</b> (counterparty) — share the link to collect their signature.`:`Complete: <span class="text-gold-600 font-medium">${missing.join(', ')||'approval'}</span>`}</p>`}
    ${(()=>{ const oh=openFindings(c).filter(x=>x.sev==='high').length;
      return oh?`<p class="mt-1.5 text-[11px] text-center text-rose-600 font-medium flex items-center justify-center gap-1">${icon('alert','w-3 h-3')} ${oh} high-severity finding${oh===1?'':'s'} still open</p>`:''; })()}`;
  if(ready) document.getElementById('sign-btn').addEventListener('click',()=>signDocument(c));
  document.getElementById('sp-setup')?.addEventListener('click',()=>openSignerPlanEditor(c));
  wireApprovalPanel(c);
}
async function signDocument(c){
  if(!canEdit()){ toast('Viewers cannot sign documents','err'); return; }
  if(!c.compliance.consent){ toast('Tick the intent-to-sign box first','err'); return; }
  if(!approvalState(c).ok){ toast('This contract needs approval before signing','err'); return; }
  // E2-T5: don't seal over unresolved proposed edits. Admin/Legal may override.
  const openRedlines=unresolvedRedlines(c);
  if(openRedlines){
    const u=currentUser();
    const canOverride = u && (u.role==='admin' || u.role==='legal');
    const msg=`${openRedlines} proposed edit${openRedlines===1?'':'s'} from the counterparty ${openRedlines===1?'is':'are'} still open. Signing now seals the current text and leaves ${openRedlines===1?'it':'them'} unresolved.`;
    if(!canOverride){ toast(msg+' Resolve the redline(s) first, or ask an Admin/Legal approver.','err'); return; }
    if(!await confirmDialog({title:'Sign with open redlines?', message:msg+' This will be recorded as an Admin/Legal override.', confirmLabel:'Sign anyway', danger:true})) return;
    logAudit(c,'Override',`Signed with ${openRedlines} unresolved redline(s) — override by ${u.name} (${ROLE_LABEL[u.role]})`);
  }
  const btn=document.getElementById('sign-btn');
  const u=currentUser(), at=nowISO();
  // capture server-stamped IP + time where available (honest attribution)
  let meta={ ip:null, at };
  if(API_MODE()){ try{ meta=await api('sign-meta','POST',{}); }catch(e){} }
  // E5-T3 multi-signer: if a signing order exists and this internal signer is
  // not the last, record their signature and advance — seal only on the last.
  const plan=signerPlan(c), ns=nextSigner(c);
  if(plan.length && ns){
    if(ns.party!=='internal'){ toast(`Next signer is ${ns.name} (counterparty) — share the link to collect their signature`,'err'); return; }
    ns.signed=true; ns.at=at; ns.by=u.name;
    c.signatures=c.signatures||[];
    c.signatures.push({ party:'internal-planned', name:ns.name||u.name, email:u.email, role:ROLE_LABEL[u.role], at, method:'session-authenticated', ip:meta.ip||null, ua:navigator.userAgent });
    logAudit(c,'Signature',`${ns.name} signed (signer ${ns.order} of ${plan.length})`);
    if(!allSigned(c)){ persist(c); renderSignButton(c); renderAuditSection(c); toast(`Recorded — ${plan.filter(s=>!s.signed).length} signer(s) remaining`); return; }
    // last signer — fall through to freeze + seal below
  }
  btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">Sealing…</span>`;
  const exec={ at, method:'session-authenticated', consent:true, ua:navigator.userAgent, ip:meta.ip||null };
  if(!isUpload(c)){ exec.html=freezeContractHtml(c); exec.textHash=await sha256(normText(exec.html)); }
  c.execution=exec;
  c.signedAt=fmtDT(at)+' EAT';
  c.lastAction=todayStr();
  c.signatory=`${u.name} (${ROLE_LABEL[u.role]})`;
  c.hash=await sha256(sealString(c));
  c.signatures=c.signatures||[];
  c.signatures.push({ party:'first', name:u.name, email:u.email, role:ROLE_LABEL[u.role], at,
    method:'session-authenticated', ip:meta.ip||null, ua:navigator.userAgent, docHash:c.hash });
  c.status='Signed';
  if(!isUpload(c)) captureVersion(c,'Signed & sealed',u.name);   // final version = the sealed text
  logAudit(c,'Signed',`Sealed by ${u.name} (${u.email}) — ${isUpload(c)?'file':'text'} hash ${(exec.textHash||c.upload?.fileHash||'').slice(0,16)}…`);
  persist(c);
  document.getElementById('doc-canvas').innerHTML=docBody(c);
  updateStatusUI(c); renderSignButton(c); renderAuditSection(c);
  toast('Signed & sealed — the exact text is frozen and fingerprinted');
}



Object.assign(window,{applyMetadata,dataUrlBytes,docBody,extractDocText,extractPdfText,findingsFromText,frozenDocBody,inflateBytes,openDocReader,openEditDocModal,openUploadModal,pdfStringsFrom,redlineDocBody,renderFeed,renderSignButton,renderWorkspace,sentenceAround,signDocument,signatureBlock,submitUpload,upField,updateStatusUI,uploadDocBody,uploadScanRules,wireComments,wireCompliance,wireDocumentSync,wsNextAction});
