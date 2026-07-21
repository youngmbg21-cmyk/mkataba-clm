// HaTi — E2 versioning + in-document redlining. Globals window-attached
// (see components.js). Layers on top of the existing negotiation rounds and
// leaves the signing seal untouched: an accepted redline just becomes the
// text that freezeContractHtml seals, hashed exactly as before.

/* Plain text of a contract's current body — the unit versions/diffs work on. */
function docPlainText(c){
  if(isUpload(c)) return (c.upload&&c.upload.extractedText)||'';
  if(c.redlineText) return c.redlineText;                 // an accepted redline is the live text
  try{ return normText(freezeContractHtml(c)); }catch(e){ return ''; }
}

/* ---- version records (E2-T1) ---- */
function captureVersion(c, label, by){
  const text=docPlainText(c); if(!text) return null;
  c.versions=c.versions||[];
  const last=c.versions[c.versions.length-1];
  if(last && last.text===text){ return last; }            // no material change — don't spam versions
  const v={ n:c.versions.length+1, at:nowISO(), by:by||currentUser()?.name||'System', label:label||'Saved', text };
  c.versions.push(v);
  return v;
}

/* ---- word-level diff (E2-T2): LCS over whitespace tokens ---- */
function tokenize(s){ return String(s||'').split(/(\s+)/).filter(x=>x!==''); }
function wordDiff(aStr, bStr){
  const a=tokenize(aStr), b=tokenize(bStr);
  const n=a.length, m=b.length;
  // LCS length table (rolling would save memory; documents here are bounded)
  const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--) for(let j=m-1;j>=0;j--)
    dp[i][j]= a[i]===b[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);
  const out=[]; let i=0,j=0;
  const push=(t,txt)=>{ const p=out[out.length-1]; if(p&&p.t===t) p.text+=txt; else out.push({t,text:txt}); };
  while(i<n && j<m){
    if(a[i]===b[j]){ push('eq',a[i]); i++; j++; }
    else if(dp[i+1][j]>=dp[i][j+1]){ push('del',a[i]); i++; }
    else { push('add',b[j]); j++; }
  }
  while(i<n){ push('del',a[i]); i++; }
  while(j<m){ push('add',b[j]); j++; }
  return out;
}
function diffHtml(aStr, bStr){
  const esc=s=>s.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
  return wordDiff(aStr,bStr).map(p=>
    p.t==='eq' ? esc(p.text)
    : p.t==='add' ? `<ins class="bg-brand-50 text-brand-700 no-underline rounded px-0.5">${esc(p.text)}</ins>`
    : `<del class="bg-rose-50 text-rose-600 rounded px-0.5">${esc(p.text)}</del>`).join('');
}
function diffStats(aStr,bStr){ let add=0,del=0; wordDiff(aStr,bStr).forEach(p=>{ const w=p.text.trim()?p.text.trim().split(/\s+/).length:0; if(p.t==='add') add+=w; else if(p.t==='del') del+=w; }); return {add,del}; }

/* ---- version history panel in the workspace ---- */
function renderVersionsSection(c){
  const host=document.getElementById('versions-section'); if(!host) return;
  const vs=c.versions||[];
  const canSnap=canEdit()&&c.status!=='Signed';
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-brand-500">${icon('history')}</span>
        <h3 class="text-sm font-display font-600 text-ink">Versions</h3>
        <span class="ml-auto text-[10px] font-mono text-ink/60">${vs.length} version${vs.length===1?'':'s'}</span>
      </div>
      ${vs.length?`<div class="space-y-1.5">${vs.slice().reverse().map(v=>`
        <div class="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-[11px]">
          <span class="font-mono font-600 text-brand-700">v${v.n}</span>
          <span class="text-ink/75 truncate">${(v.label||'').replace(/</g,'&lt;')}</span>
          <span class="ml-auto text-ink/50 font-mono shrink-0">${fmtDT(v.at)}</span>
          ${v.n>1?`<button data-ver-diff="${v.n}" class="shrink-0 text-brand-600 hover:text-brand-800 font-600" title="Compare with previous">diff</button>`:''}
        </div>`).join('')}</div>`
      :`<p class="text-[11px] text-ink/60">No versions captured yet.</p>`}
      ${canSnap?`<button id="ver-snap" class="mt-2.5 flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3 py-1.5 text-[11px] font-600 hover:bg-brand-50 transition">${icon('plus','w-3 h-3')} Snapshot current version</button>`:''}
      ${vs.length>1?`<button id="ver-compare" class="mt-2.5 ml-2 text-[11px] text-brand-600 hover:text-brand-800 font-600">Compare any two…</button>`:''}
    </div>`;
  host.querySelectorAll('[data-ver-diff]').forEach(b=>b.addEventListener('click',()=>{ const n=Number(b.getAttribute('data-ver-diff'));
    const cur=vs.find(v=>v.n===n), prev=vs.find(v=>v.n===n-1); if(cur&&prev) openDiffModal(prev.text,cur.text,`v${prev.n}`,`v${cur.n}`); }));
  document.getElementById('ver-snap')?.addEventListener('click',()=>{ const v=captureVersion(c,'Manual snapshot'); if(v){ persist(c); renderVersionsSection(c); toast('Captured v'+v.n); } else toast('No changes since the last version'); });
  document.getElementById('ver-compare')?.addEventListener('click',()=>openCompareModal(c));
}

function openDiffModal(aText, bText, labelA, labelB){
  const st=diffStats(aText,bText);
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-brand-500">${icon('history','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">Compare ${labelA} → ${labelB}</h3></div>
      <p class="text-xs text-ink/60 mb-3"><span class="text-brand-700 font-600">+${st.add}</span> added · <span class="text-rose-600 font-600">−${st.del}</span> removed · <ins class="bg-brand-50 text-brand-700 no-underline rounded px-0.5">additions</ins> <del class="bg-rose-50 text-rose-600 rounded px-0.5">deletions</del></p>
      <div class="rounded-xl border border-line bg-white p-4 text-[12.5px] leading-relaxed text-ink/85 max-h-[55vh] overflow-y-auto scroll-thin whitespace-pre-wrap">${diffHtml(aText,bText)}</div>
      <div class="flex justify-end mt-4"><button id="dm-close" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Close</button></div>
    </div>`);
  document.getElementById('dm-close').addEventListener('click',closeModal);
}
function openCompareModal(c){
  const vs=c.versions||[]; if(vs.length<2) return;
  const opts=vs.map(v=>`<option value="${v.n}">v${v.n} · ${(v.label||'').replace(/"/g,'')}</option>`).join('');
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-3">Compare versions</h3>
      <div class="flex items-center gap-2 mb-4 text-sm">
        <select id="cmp-a" class="rounded-lg border border-inputln bg-white px-2.5 py-2">${opts}</select>
        <span class="text-ink/50">→</span>
        <select id="cmp-b" class="rounded-lg border border-inputln bg-white px-2.5 py-2">${opts}</select>
        <button id="cmp-go" class="ml-auto rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Compare</button>
      </div>
      <div id="cmp-out" class="text-[11px] text-ink/50">Pick two versions and compare.</div>
    </div>`);
  document.getElementById('cmp-a').value=String(Math.max(1,vs.length-1));
  document.getElementById('cmp-b').value=String(vs.length);
  document.getElementById('cmp-go').addEventListener('click',()=>{
    const a=vs.find(v=>v.n===Number(document.getElementById('cmp-a').value)), b=vs.find(v=>v.n===Number(document.getElementById('cmp-b').value));
    if(a&&b) openDiffModal(a.text,b.text,`v${a.n}`,`v${b.n}`);
  });
}

/* ---- owner review of a counterparty's proposed edit (E2-T4) ---- */
function reviewProposedRound(c, n){
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||!r.proposedText) return;
  const base=r.baseText || (c.versions&&c.versions.length?c.versions[c.versions.length-1].text:docPlainText(c));
  const st=diffStats(base, r.proposedText);
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('history','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">Proposed edits — round ${n}</h3></div>
      <p class="text-xs text-ink/60 mb-1">by ${(r.by||'counterparty')} · ${fmtDT(r.at)}</p>
      <p class="text-xs text-ink/60 mb-3"><span class="text-brand-700 font-600">+${st.add}</span> added · <span class="text-rose-600 font-600">−${st.del}</span> removed</p>
      ${r.comment?`<div class="rounded-lg bg-canvas border border-line px-3 py-2 text-[12px] text-ink/75 mb-3">“${(r.comment||'').replace(/</g,'&lt;')}”</div>`:''}
      <div class="rounded-xl border border-line bg-white p-4 text-[12.5px] leading-relaxed text-ink/85 max-h-[48vh] overflow-y-auto scroll-thin whitespace-pre-wrap">${diffHtml(base, r.proposedText)}</div>
      <div class="flex justify-end gap-2 mt-4">
        <button id="pr-reject" class="rounded-lg border border-rose-200 text-rose-600 px-4 py-2 text-sm font-600 hover:bg-rose-50">Reject</button>
        <button id="pr-accept" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Accept — adopt as new version</button>
      </div>
    </div>`);
  document.getElementById('pr-accept').addEventListener('click',()=>{ closeModal(); acceptProposedRound(c,n); });
  document.getElementById('pr-reject').addEventListener('click',()=>{ closeModal(); resolveRound(c,n,false); });
}
function acceptProposedRound(c, n){
  if(!canEdit()){ toast('Viewers cannot resolve rounds','err'); return; }
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||!r.proposedText) return;
  const u=currentUser();
  // ensure the pre-redline text is captured, then adopt the proposed text
  if(!c.versions||!c.versions.length) captureVersion(c,'Before redline','System');
  c.redlineText=r.proposedText;
  captureVersion(c, `Round ${n} accepted (redline from ${r.by||'counterparty'})`, u.name);
  r.status='closed'; r.resolution={ decision:'accepted', by:u.name, at:nowISO() };
  if(r.proposedValue!=null){ c.value=Number(r.proposedValue); c.approval=null; }
  logAudit(c,'Redline',`Round ${n} proposed edits accepted by ${u.name} — adopted as v${c.versions.length}`);
  persist(c); renderWorkspace();
  toast(`Round ${n} accepted — adopted as new version`);
}

/* Guard used by signDocument: any open round carrying proposed edits? */
function unresolvedRedlines(c){ return (c.rounds||[]).filter(r=>r.status==='open' && r.proposedText).length; }

Object.assign(window,{docPlainText,captureVersion,wordDiff,diffHtml,diffStats,tokenize,renderVersionsSection,openDiffModal,openCompareModal,reviewProposedRound,acceptProposedRound,unresolvedRedlines});
