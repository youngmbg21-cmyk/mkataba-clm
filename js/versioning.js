// HaTi — E2 versioning + in-document redlining. Globals window-attached
// (see components.js). Layers on top of the existing negotiation rounds and
// leaves the signing seal untouched: an accepted redline just becomes the
// text that freezeContractHtml seals, hashed exactly as before.

/* HTML → structured plain text: preserves the document's shape (headings,
   clauses, paragraphs on their own lines) instead of collapsing to one blob.
   normText stays as-is for seal hashing — this is only the WORKING copy. */
function htmlToStructuredText(html){
  const d=document.createElement('div'); d.innerHTML=html||'';
  d.querySelectorAll('script,style').forEach(n=>n.remove());
  const BLOCK=new Set(['P','DIV','H1','H2','H3','H4','H5','H6','LI','TR','TABLE','UL','OL','SECTION','ARTICLE','HEADER','FOOTER','BLOCKQUOTE','ADDRESS']);
  let out='';
  (function walk(node){
    node.childNodes.forEach(ch=>{
      if(ch.nodeType===3){ out+=ch.nodeValue.replace(/\s+/g,' '); return; }
      if(ch.nodeType!==1) return;
      if(ch.tagName==='BR'){ out+='\n'; return; }
      if(ch.tagName==='INPUT'){ out+=(ch.value||ch.getAttribute('value')||''); return; }
      const isBlock=BLOCK.has(ch.tagName);
      const anchored=ch.hasAttribute&&ch.hasAttribute('data-anchor');
      if(isBlock&&out&&!out.endsWith('\n')) out+='\n';
      walk(ch);
      if(isBlock&&!out.endsWith('\n')) out+='\n';
      if(anchored) out+='\n';   // blank line between document sections/clauses
    });
  })(d);
  return out.split('\n').map(l=>l.replace(/\s+/g,' ').trim()).join('\n')
    .replace(/\n{3,}/g,'\n\n').trim();
}

/* Plain text of a contract's current body — the unit versions/diffs work on. */
function docPlainText(c){
  if(c.redlineText) return c.redlineText;                 // edited/adopted working text is the live text
  if(isUpload(c)) return (c.upload&&c.upload.extractedText)||'';
  try{ return htmlToStructuredText(freezeContractHtml(c)); }catch(e){ return ''; }
}

/* Re-flow working text that was flattened by an older/lossy conversion (headings
   glued to bodies, e.g. "…TerritoryThe Principal…"), restoring paragraph and
   section breaks for display/editing. Non-destructive: already-structured text
   (which has real line breaks) is returned unchanged. Relies on the fact that in
   flattened text, normal in-sentence words keep their spaces, so the only glued
   lowercase→UPPERCASE junctions — and a clause number right after a word/period —
   are exactly the block boundaries that were lost. */
function reflowWorkingText(t){
  t=String(t||''); if(!t.trim()) return t;
  if(t.split('\n').filter(l=>l.trim()).length>=4) return t;   // already structured
  return t
    .replace(/([^\n])\s*(\d{1,2}\.\s+[A-Z])/g,'$1\n\n$2')      // "…consent.2. Targets" → new paragraph before each clause
    .replace(/([a-z])([A-Z])/g,'$1\n$2')                        // restore glued block joins ("Territory|The") — normal words keep their space, so only lost boundaries glue
    .replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
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
  // clear diff convention: additions emerald, deletions ruby (struck through)
  return wordDiff(aStr,bStr).map(p=>
    p.t==='eq' ? esc(p.text)
    : p.t==='add' ? `<ins style="background:#d9eae0;color:#1e6b4d;text-decoration:none;border-radius:2px;padding:0 1px">${esc(p.text)}</ins>`
    : `<del style="background:#f1dcd8;color:#8f322b;border-radius:2px;padding:0 1px">${esc(p.text)}</del>`).join('');
}
function diffStats(aStr,bStr){ let add=0,del=0; wordDiff(aStr,bStr).forEach(p=>{ const w=p.text.trim()?p.text.trim().split(/\s+/).length:0; if(p.t==='add') add+=w; else if(p.t==='del') del+=w; }); return {add,del}; }

/* ---- version history panel in the workspace ---- */
function renderVersionsSection(c){
  const host=document.getElementById('versions-section'); if(!host) return;
  const vs=c.versions||[];
  const canSnap=canEdit()&&c.status!=='Signed';
  const H6='margin:0;font-size:10px;font-weight:600;color:var(--color-neutral-600);text-transform:uppercase;letter-spacing:.1em';
  host.innerHTML=`
    <div style="padding:12px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span style="color:var(--color-accent)">${icon('history','w-3.5 h-3.5')}</span>
        <h6 style="${H6};flex:1">Versions &amp; changes</h6>
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--color-neutral-500)">${vs.length} version${vs.length===1?'':'s'}</span>
      </div>
      ${vs.length?`<div style="display:flex;flex-direction:column;gap:5px">${vs.slice().reverse().map(v=>`
        <div style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-divider);border-radius:4px;background:var(--color-surface);padding:6px 9px;font-size:11px">
          <span style="font-family:var(--font-mono);font-weight:600;color:var(--color-accent-700)">v${v.n}</span>
          <span style="color:var(--color-neutral-800);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0">${(v.label||'').replace(/</g,'&lt;')}</span>
          <span style="margin-left:auto;color:var(--color-neutral-500);font-family:var(--font-mono);flex:none">${fmtDT(v.at)}</span>
          ${v.n>1?`<button data-ver-diff="${v.n}" style="flex:none;border:0;background:none;cursor:pointer;color:var(--color-accent);font:inherit;font-size:11px;font-weight:600;padding:0" title="Compare with previous version">diff</button>`:''}
        </div>`).join('')}</div>`
      :`<p style="font-size:11px;color:var(--color-neutral-600);line-height:1.5;margin:0">No versions captured yet. Snapshots are taken automatically when a counterparty redline is accepted and at signing — or capture one now to start tracking changes.</p>`}
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
        <button id="ver-compare" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:5px 11px">${icon('history','w-3.5 h-3.5')} Compare versions</button>
        ${canSnap?`<button id="ver-snap" class="ui-btn" style="font-size:11.5px;padding:5px 11px">${icon('plus','w-3 h-3')} Snapshot now</button>`:''}
      </div>
    </div>`;
  host.querySelectorAll('[data-ver-diff]').forEach(b=>b.addEventListener('click',()=>{ const n=Number(b.getAttribute('data-ver-diff'));
    const cur=vs.find(v=>v.n===n), prev=vs.find(v=>v.n===n-1); if(cur&&prev) openDiffModal(prev.text,cur.text,`v${prev.n}`,`v${cur.n}`); }));
  document.getElementById('ver-snap')?.addEventListener('click',()=>{ const v=captureVersion(c,'Manual snapshot'); if(v&&v.n>(vs.length)){ persist(c); renderVersionsSection(c); toast('Captured v'+v.n); } else toast('No changes since the last version'); });
  document.getElementById('ver-compare')?.addEventListener('click',()=>openCompareModal(c));
}

const _diffLegend = `<span style="display:inline-flex;align-items:center;gap:8px"><ins style="background:#d9eae0;color:#1e6b4d;text-decoration:none;border-radius:2px;padding:0 4px">added</ins><del style="background:#f1dcd8;color:#8f322b;border-radius:2px;padding:0 4px">removed</del></span>`;
const _diffBox = (a,b)=>`<div class="scroll-thin" style="border:1px solid var(--color-divider);border-radius:5px;background:var(--color-surface);padding:14px 16px;font-size:12.5px;line-height:1.85;color:var(--color-neutral-800);max-height:56vh;overflow-y:auto;white-space:pre-wrap;font-family:var(--font-body)">${diffHtml(a,b)}</div>`;
const _statLine = (st)=>`<span style="font-weight:600;color:#1e6b4d">+${st.add}</span> added · <span style="font-weight:600;color:#8f322b">−${st.del}</span> removed`;

function openDiffModal(aText, bText, labelA, labelB){
  const st=diffStats(aText,bText);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Compare ${labelA} → ${labelB}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">${_statLine(st)} · ${_diffLegend}</p>
      ${_diffBox(aText,bText)}
      <div style="display:flex;justify-content:flex-end;margin-top:14px"><button id="dm-close" class="ui-btn ui-btn-primary">Close</button></div>
    </div>`, {maxWidth:'860px'});
  document.getElementById('dm-close').addEventListener('click',closeModal);
}

// Compare any two comparables. Comparables = every captured version PLUS the
// live document text (so a diff is always available once the doc has changed),
// which fixes the old silent no-op when fewer than two versions existed.
function openCompareModal(c){
  const vs=c.versions||[];
  const live=docPlainText(c);
  const items=vs.map(v=>({label:`v${v.n} · ${(v.label||'').replace(/"/g,'')}`, short:`v${v.n}`, text:v.text}));
  const lastText=vs.length?vs[vs.length-1].text:null;
  if(!vs.length || live!==lastText) items.push({label:'Current (live document)', short:'Current', text:live});
  const canSnap=canEdit()&&c.status!=='Signed';

  if(items.length<2){
    openModal(`
      <div style="padding:20px 22px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
          <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Compare versions</h3></div>
        <p style="font-size:12.5px;color:var(--color-neutral-700);line-height:1.6;margin:0">There's only one version of this contract so far, so there's nothing to compare yet. New versions are captured automatically when a <b>counterparty redline is accepted</b> and at <b>signing</b>. ${canSnap?'Capture a snapshot now, make your edits, then compare to see exactly what changed.':''}</p>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px">
          ${canSnap?`<button id="cmp-snap" class="ui-btn ui-btn-primary">${icon('plus','w-3 h-3')} Snapshot current version</button>`:''}
          <button id="cmp-close" class="ui-btn">Close</button>
        </div>
      </div>`);
    document.getElementById('cmp-close').addEventListener('click',closeModal);
    document.getElementById('cmp-snap')?.addEventListener('click',()=>{ const v=captureVersion(c,'Manual snapshot'); persist(c); closeModal(); renderVersionsSection(c); toast(v?('Captured v'+v.n):'Snapshot taken'); });
    return;
  }

  const opts=items.map((it,i)=>`<option value="${i}">${it.label}</option>`).join('');
  const selStyle='font:inherit;font-size:12.5px;border:1px solid var(--color-divider);background:var(--color-surface);padding:6px 8px;border-radius:4px;color:inherit;min-width:0;flex:1';
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><span style="color:var(--color-accent)">${icon('history','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Compare versions</h3></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <select id="cmp-a" style="${selStyle}">${opts}</select>
        <span style="color:var(--color-neutral-500);flex:none">→</span>
        <select id="cmp-b" style="${selStyle}">${opts}</select>
        <button id="cmp-go" class="ui-btn ui-btn-primary" style="flex:none">Compare</button>
      </div>
      <div id="cmp-legend" style="font-size:11.5px;color:var(--color-neutral-600);margin-bottom:10px"></div>
      <div id="cmp-out" style="font-size:12px;color:var(--color-neutral-500)">Pick two versions and press <b>Compare</b> to see the changes.</div>
    </div>`, {maxWidth:'860px'});
  document.getElementById('cmp-a').value=String(items.length-2);
  document.getElementById('cmp-b').value=String(items.length-1);
  const run=()=>{
    const a=items[Number(document.getElementById('cmp-a').value)], b=items[Number(document.getElementById('cmp-b').value)];
    if(!a||!b) return;
    if(a.text===b.text){ document.getElementById('cmp-legend').innerHTML=''; document.getElementById('cmp-out').innerHTML=`<div style="font-size:12px;color:var(--color-neutral-500)">These two versions are identical — no changes between <b>${a.short}</b> and <b>${b.short}</b>.</div>`; return; }
    const st=diffStats(a.text,b.text);
    document.getElementById('cmp-legend').innerHTML=`${_statLine(st)} · ${_diffLegend}`;
    document.getElementById('cmp-out').innerHTML=_diffBox(a.text,b.text);
  };
  document.getElementById('cmp-go').addEventListener('click',run);
  run();   // show the default (previous → latest) comparison immediately
}

/* ---- owner review of a counterparty's proposed edit (E2-T4) ---- */
function reviewProposedRound(c, n){
  const r=(c.rounds||[]).find(x=>x.n===n); if(!r||!r.proposedText) return;
  const base=r.baseText || (c.versions&&c.versions.length?c.versions[c.versions.length-1].text:docPlainText(c));
  const st=diffStats(base, r.proposedText);
  openModal(`
    <div style="padding:20px 22px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="color:#b8862b">${icon('history','w-4 h-4')}</span>
        <h3 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0">Proposed edits — round ${n}</h3></div>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 2px">by ${(r.by||'counterparty')} · ${fmtDT(r.at)}</p>
      <p style="font-size:11.5px;color:var(--color-neutral-600);margin:0 0 12px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">${_statLine(st)} · ${_diffLegend}</p>
      ${r.comment?`<div style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:4px;padding:8px 10px;font-size:12px;color:var(--color-neutral-700);margin-bottom:12px">“${(r.comment||'').replace(/</g,'&lt;')}”</div>`:''}
      ${_diffBox(base, r.proposedText)}
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:14px">
        <button id="pr-reject" class="ui-btn" style="border-color:#e6c9c1;color:#8f322b">Reject</button>
        <button id="pr-accept" class="ui-btn ui-btn-primary">Accept — adopt as new version</button>
      </div>
    </div>`, {maxWidth:'860px'});
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

Object.assign(window,{docPlainText,htmlToStructuredText,reflowWorkingText,captureVersion,wordDiff,diffHtml,diffStats,tokenize,renderVersionsSection,openDiffModal,openCompareModal,reviewProposedRound,acceptProposedRound,unresolvedRedlines});
