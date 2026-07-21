// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ---------- counterparty portal (opened from a share link) ---------- */
window.PORTAL_OPTS={};
async function portalEntry(encoded){
  if(encoded.startsWith('t:')){        // server-backed share token
    try{
      const r=await fetch('api/shares/'+encodeURIComponent(encoded.slice(2)));
      const d=await r.json().catch(()=>null);
      if(!r.ok) throw new Error(d?.error||'not found');
      renderSharePortal(d.payload,{ token:encoded.slice(2), responded:d.responded });
    }catch(e){ renderSharePortal(null); }
    return;
  }
  renderSharePortal(b64d(encoded));    // static-mode share (payload in the URL)
}
function renderSharePortal(p, opts={}){
  PORTAL_MODE=true; PORTAL_OPTS=opts;
  const root=document.getElementById('share-root');
  document.getElementById('app-shell').classList.add('hidden');
  const validDoc = p && p.kind==='hati-share' && p.contract && (p.contract.source==='upload' || TEMPLATES[p.contract.template]);
  if(!validDoc){
    root.innerHTML=`<div class="min-h-screen grid place-items-center bg-brand-900 px-4">
      <div class="bg-white rounded-2xl p-8 text-center max-w-sm">
        <div class="text-rose-500 mb-3 flex justify-center">${icon('ban','w-8 h-8')}</div>
        <h1 class="font-display font-700 text-brand-900">Invalid share link</h1>
        <p class="text-sm text-brand-800/70 mt-1">This link is malformed or truncated. Ask the sender to generate a fresh one.</p>
      </div></div>`;
    return;
  }
  FIRST_PARTY=p.org;
  const c=migrateContract({ ...p.contract, status:'Under Review',
    folder:p.contract.folder || (TEMPLATES[p.contract.template]||{}).folder || 'corp' });
  const input=(id,label,ph)=>`
    <label class="block mb-2.5"><span class="text-[11px] font-medium text-brand-800/70">${label}</span>
    <input id="${id}" type="text" placeholder="${ph}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"/></label>`;
  root.innerHTML=`
  <div class="min-h-screen bg-canvas">
    <header class="bg-brand-900 text-white px-6 py-4">
      <div class="max-w-[1100px] mx-auto flex items-center gap-3">
        <div class="h-9 w-9 rounded-lg bg-gold-500 grid place-items-center text-brand-900 shrink-0">${icon('scroll','w-5 h-5',2.2)}</div>
        <div class="leading-tight min-w-0">
          <div class="font-display font-600">${p.org} shared a contract for your review</div>
          <div class="text-[11px] text-brand-300 font-mono truncate">${p.contract.id} · shared by ${p.sharedBy} · ${fmtDT(p.at)} · via HaTi</div>
        </div>
      </div>
    </header>
    <div class="max-w-[1100px] mx-auto grid lg:grid-cols-[1fr_360px] gap-6 px-6 py-8 items-start">
      <article class="bg-white rounded-2xl border border-brand-100 shadow-sm p-7 lg:p-9">${docBody(c)}</article>
      <aside class="bg-white rounded-2xl border border-brand-100 p-5 lg:sticky lg:top-6">
        <h2 class="font-display font-600 text-brand-900 mb-1">Respond to ${p.org}</h2>
        ${opts.responded?`<div class="mb-4 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2.5 text-[11px] text-brand-700 flex items-center gap-1.5">${icon('check2','w-3.5 h-3.5')} A response was already submitted for this link.</div>`:''}
        <p class="text-[11px] text-brand-800/70 mb-4">${opts.token?`Your response is delivered to ${p.sharedBy} automatically — nothing to send back.`:`Your response is packaged as a secure code — send it back to ${p.sharedBy} to record it on the contract.`}</p>
        ${input('pt-name','Full name *','e.g. Grace Njeri')}
        ${input('pt-title','Title / role','e.g. Legal Counsel')}
        ${input('pt-email','Work email','you@company.co.ke')}
        <label class="block mb-3"><span class="text-[11px] font-medium text-brand-800/70">Comment</span>
        <textarea id="pt-comment" rows="3" placeholder="Optional for signing; required for changes or decline…" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"></textarea></label>
        ${isMonetary(c)?`<label class="block mb-3"><span class="text-[11px] font-medium text-brand-800/70">Propose a different value (optional, for change requests)</span>
        <input id="pt-proposed" type="number" placeholder="e.g. ${c.value||'2500000'}" class="mt-1 w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"/></label>`:''}
        <div class="space-y-2">
          <button id="pt-sign" class="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-900 text-white py-3 text-sm font-semibold hover:bg-brand-800 transition">${icon('finger','w-4 h-4')} Approve &amp; sign</button>
          <div class="grid grid-cols-2 gap-2">
            <button id="pt-changes" class="rounded-xl border border-brand-200 text-brand-700 py-2.5 text-xs font-medium hover:bg-brand-50 transition">Request changes</button>
            <button id="pt-decline" class="rounded-xl border border-rose-200 text-rose-600 py-2.5 text-xs font-medium hover:bg-rose-50 transition">Decline</button>
          </div>
        </div>
        <div id="portal-result" class="mt-4"></div>
      </aside>
    </div>
  </div>`;
  document.getElementById('pt-sign').addEventListener('click',()=>portalRespond(p,'sign'));
  document.getElementById('pt-changes').addEventListener('click',()=>portalRespond(p,'changes'));
  document.getElementById('pt-decline').addEventListener('click',()=>portalRespond(p,'decline'));
}
async function portalRespond(p, action){
  const name=fval('pt-name'), title=fval('pt-title'), email=fval('pt-email'), comment=fval('pt-comment');
  if(!name){ toast('Enter your full name','err'); return; }
  if(action==='sign' && !email){ toast('A work email is required to sign','err'); return; }
  if(action!=='sign' && !comment){ toast('Add a comment explaining your response','err'); return; }
  // Server-backed signing: verify the signer's email with a one-time code first.
  if(action==='sign' && PORTAL_OPTS.token){ return portalStartOtp(p, {name,title,email,comment}); }
  const proposedValue = action==='changes' ? fval('pt-proposed') : '';
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action, name, title, email, comment,
    proposedValue: proposedValue||null, at:nowISO() };
  const label={sign:'signature',changes:'change request',decline:'decline notice'}[action];
  if(PORTAL_OPTS.token){
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      document.getElementById('portal-result').innerHTML=`
        <div class="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
          <div class="flex items-center justify-center gap-1.5 text-brand-700 text-sm font-semibold mb-1">${icon('check2','w-4 h-4')} ${label[0].toUpperCase()+label.slice(1)} delivered</div>
          <p class="text-[11px] text-brand-800/70">${p.sharedBy} at ${p.org} has been notified — you're all done.</p>
        </div>`;
    }catch(e){ toast(e.message,'err'); }
    return;
  }
  const code=b64e(response);
  document.getElementById('portal-result').innerHTML=`
    <div class="rounded-xl border border-brand-200 bg-brand-50 p-3.5">
      <div class="flex items-center gap-1.5 text-brand-700 text-xs font-semibold mb-1.5">${icon('check2','w-3.5 h-3.5')} Your ${label} is ready</div>
      <p class="text-[11px] text-brand-800/70 mb-2">Copy this response code and send it back to ${p.sharedBy} at ${p.org} (email or WhatsApp). They import it in HaTi to record it on the contract.</p>
      <textarea id="pt-code" readonly rows="4" class="w-full rounded-lg border border-brand-100 bg-white p-2.5 text-[10px] font-mono outline-none break-all">${code}</textarea>
      <button id="pt-copy" class="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-brand-900 text-white py-2 text-xs font-medium hover:bg-brand-800 transition">${icon('copy','w-3 h-3')} Copy response code</button>
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
  box.innerHTML=`<div class="rounded-xl border border-brand-200 bg-brand-50 p-3.5 text-[11px] text-brand-800/60">Sending a one-time code to <strong>${info.email}</strong>…</div>`;
  let devCode=null;
  try{
    const r=await api('shares/'+PORTAL_OPTS.token+'/otp','POST',{ email:info.email });
    devCode=r.devCode;
  }catch(e){ toast(e.message,'err'); box.innerHTML=''; return; }
  box.innerHTML=`
    <div class="rounded-xl border border-brand-200 bg-white p-3.5">
      <div class="text-xs font-semibold text-brand-900 mb-1 flex items-center gap-1.5">${icon('key','w-3.5 h-3.5')} Verify your email to sign</div>
      <p class="text-[11px] text-brand-800/60 mb-2">We sent a 6-digit code to <strong>${info.email}</strong>. Enter it to complete your signature.</p>
      ${devCode?`<p class="mb-2 text-[11px] rounded-lg bg-gold-500/10 border border-gold-500/25 text-gold-700 px-2.5 py-1.5">Email isn’t configured on this server yet, so for testing your code is <strong class="font-mono">${devCode}</strong>.</p>`:''}
      <input id="pt-otp" inputmode="numeric" maxlength="6" placeholder="______" class="w-full rounded-lg border border-brand-100 bg-canvas px-3 py-2 text-center text-lg font-mono tracking-[0.4em] outline-none focus:border-brand-400"/>
      <button id="pt-otp-go" class="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-brand-900 text-white py-2.5 text-sm font-semibold hover:bg-brand-800 transition">${icon('finger','w-4 h-4')} Verify &amp; sign</button>
      <button id="pt-otp-resend" class="mt-1.5 w-full text-[11px] text-brand-800/65 hover:text-brand-700 transition">Resend code</button>
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
    name:info.name, title:info.title, email:info.email, comment:info.comment, verify, at:nowISO() };
  try{
    await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
    document.getElementById('portal-result').innerHTML=`
      <div class="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
        <div class="flex items-center justify-center gap-1.5 text-brand-700 text-sm font-semibold mb-1">${icon('check2','w-4 h-4')} Signed &amp; verified</div>
        <p class="text-[11px] text-brand-800/70">Your email-verified signature has been delivered to ${p.sharedBy} at ${p.org}. You're all done.</p>
      </div>`;
  }catch(e){ toast(e.message,'err'); }
}

/* ---------- PDF export (print pipeline) ---------- */
function exportPDF(c){
  let bodyHtml;
  if(isUpload(c)){
    // The original file is a separate attachment; print a signing certificate.
    const u=c.upload||{};
    bodyHtml=`
      <div style="border:1px solid #D6CFBF;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:15px;margin-bottom:2px;">${c.name}</div>
        <div style="font-size:11px;color:#666;margin-bottom:10px;">External document received from ${c.counterparty||'—'} · filed under ${FOLDERS[c.folder].name}</div>
        <table style="font-size:11px;border-collapse:collapse;">
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Original file</td><td style="font-weight:600;">${u.fileName||'—'} (${u.size?Math.round(u.size/1024):0} KB)</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Value</td><td style="font-weight:600;">${!isMonetary(c)?'Non-monetary':(c.value?fmtKES(c.value):'—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Status</td><td style="font-weight:600;">${c.status}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">File fingerprint (SHA-256)</td><td style="font-family:'JetBrains Mono',monospace;font-size:9px;word-break:break-all;">${u.fileHash||'—'}</td></tr>
        </table>
      </div>
      <p style="font-size:11px;color:#444;line-height:1.6;">This is a HaTi signing certificate for an externally-supplied contract. The original document (<strong>${u.fileName||'the attached file'}</strong>) is retained in HaTi and travels with this certificate. The seal below binds this certificate to that exact file by its SHA-256 fingerprint.</p>`;
  } else {
    const holder=document.createElement('div');
    holder.innerHTML=docBody(c);
    holder.querySelectorAll('input').forEach(inp=>{
      const span=document.createElement('span');
      span.style.cssText="font-family:'JetBrains Mono',monospace;font-weight:600;border-bottom:1px solid #999;padding:0 3px;";
      span.textContent=inp.value||inp.getAttribute('value')||'________';
      inp.replaceWith(span);
    });
    bodyHtml=holder.innerHTML;
  }
  const audit=(c.audit||[]).map(e=>`
    <tr><td style="padding:3px 10px 3px 0;white-space:nowrap;color:#666;">${fmtDT(e.at)}</td>
    <td style="padding:3px 10px 3px 0;font-weight:600;">${e.action}</td>
    <td style="padding:3px 0;">${e.detail} <span style="color:#888;">(${e.user})</span></td></tr>`).join('');
  document.getElementById('print-root').innerHTML=`
    <div style="font-family:'DM Sans',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 24px;color:#0A3B32;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #0B7A5F;padding-bottom:10px;margin-bottom:24px;">
        <div style="font-family:'DM Sans',sans-serif;font-weight:700;font-size:18px;">HaTi <span style="font-weight:400;font-size:11px;color:#666;">· Contract Lifecycle</span></div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#666;">${c.id} · generated ${fmtDT(nowISO())}</div>
      </div>
      ${bodyHtml}
      ${c.hash&&c.hash!=='PRE-SEEDED'?`<div style="margin-top:24px;padding:12px;border:1px solid #D6CFBF;border-radius:8px;font-family:'JetBrains Mono',monospace;font-size:10px;word-break:break-all;"><strong>SHA-256 DOCUMENT SEAL</strong><br/>${c.hash}<br/><span style="color:#666;">${c.signedAt||''}</span></div>`:''}
      ${audit?`<div style="margin-top:24px;page-break-inside:avoid;"><div style="font-family:'DM Sans',sans-serif;font-weight:600;font-size:13px;border-bottom:1px solid #D6CFBF;padding-bottom:6px;margin-bottom:8px;">Audit trail</div><table style="font-size:10px;border-collapse:collapse;width:100%;">${audit}</table></div>`:''}
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

Object.assign(window,{PORTAL_OPTS,exportPDF,metrics,portalEntry,portalRespond,portalStartOtp,portalVerifyAndSign,refreshStats,renderSharePortal});
