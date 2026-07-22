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
    root.innerHTML=`<div style="min-height:100vh;display:grid;place-items:center;background:var(--color-bg);padding:0 16px;">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:32px;text-align:center;max-width:24rem;">
        <div style="color:#b0453c;margin-bottom:12px;display:flex;justify-content:center;">${icon('ban','w-8 h-8')}</div>
        <h1 style="font-family:var(--font-heading);font-weight:600;font-size:20px;color:var(--color-text);margin:0;">Invalid share link</h1>
        <p style="font-size:13px;color:var(--color-neutral-700);margin-top:6px;line-height:1.5;">This link is malformed or truncated. Ask the sender to generate a fresh one.</p>
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
          <div style="font-family:var(--font-mono);font-weight:600;font-size:15px;">${p.org} shared a contract for your review</div>
          <div style="font-size:11px;color:var(--color-accent-200);font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.contract.id} · shared by ${p.sharedBy} · ${fmtDT(p.at)} · via HaTi</div>
        </div>
      </div>
    </header>
    <div style="max-width:1100px;margin:0 auto;display:grid;gap:22px;padding:28px 24px;align-items:start;" class="portal-grid">
      <div class="blueprint" style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;">
        <i class="corner tl"></i><i class="corner tr"></i><i class="corner bl"></i><i class="corner br"></i>
        <article>${docBody(c)}</article>
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);padding:18px;" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:var(--color-text);margin:0 0 4px;">Respond to ${p.org}</h2>
        ${opts.responded?`<div style="margin-bottom:14px;border-radius:4px;background:var(--color-accent-100);border:1px solid var(--color-divider);padding:9px 11px;font-size:11px;color:var(--color-accent-800);display:flex;align-items:center;gap:6px;">${icon('check2','w-3.5 h-3.5')} A response was already submitted for this link.</div>`:''}
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5;">${opts.token?`Your response is delivered to ${p.sharedBy} automatically — nothing to send back.`:`Your response is packaged as a secure code — send it back to ${p.sharedBy} to record it on the contract.`}</p>
        ${input('pt-name','Full name *','e.g. Grace Njeri')}
        ${input('pt-title','Title / role','e.g. Legal Counsel')}
        ${input('pt-email','Work email','you@company.co.ke')}
        <label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Comment</span>
        <textarea id="pt-comment" rows="3" placeholder="Optional for signing; required for changes or decline…" style="${TA}"></textarea></label>
        ${isMonetary(c)?`<label style="display:block;margin-bottom:12px;"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em;">Propose a different value (optional, for change requests)</span>
        <input id="pt-proposed" type="number" placeholder="e.g. ${c.value||'2500000'}" style="${TA}min-height:36px;"/></label>`:''}
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="pt-sign" class="ui-btn ui-btn-primary" style="width:100%;padding:10px;font-size:13px;">${icon('finger','w-4 h-4')} Approve &amp; sign</button>
          <button id="pt-redline" class="ui-btn" style="width:100%;padding:8px;font-size:12px;">${icon('history','w-3.5 h-3.5')} Propose edits (redline)</button>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <button id="pt-changes" class="ui-btn" style="padding:8px;font-size:12px;">Request changes</button>
            <button id="pt-decline" class="ui-btn" style="padding:8px;font-size:12px;color:#b0453c;border-color:color-mix(in srgb,#b0453c 40%,transparent);">Decline</button>
          </div>
        </div>
        <div id="portal-redline" class="hidden" style="margin-top:12px;">
          <div style="font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:4px;font-family:var(--font-mono);">Edit the text directly</div>
          <p style="font-size:10px;color:var(--color-neutral-600);margin:0 0 6px;line-height:1.5;">Change any wording below. ${p.org} sees your edits as a tracked redline (additions and deletions highlighted) and can accept, reject or counter.</p>
          <textarea id="pt-redline-text" rows="12" style="${TA}font-size:12px;line-height:1.6;"></textarea>
          <button id="pt-redline-submit" class="ui-btn ui-btn-primary" style="margin-top:8px;width:100%;padding:8px;font-size:12px;">Submit proposed edits</button>
        </div>
        <div id="portal-result" style="margin-top:16px;"></div>
      </aside>
    </div>
  </div>
  <style>.portal-grid{grid-template-columns:1fr;}@media(min-width:1024px){.portal-grid{grid-template-columns:1fr 360px;}.portal-aside{position:sticky;top:24px;}}</style>`;
  document.getElementById('pt-sign').addEventListener('click',()=>portalRespond(p,'sign'));
  document.getElementById('pt-changes').addEventListener('click',()=>portalRespond(p,'changes'));
  document.getElementById('pt-decline').addEventListener('click',()=>portalRespond(p,'decline'));
  // E2: reveal the redline editor, pre-filled with the current document text.
  document.getElementById('pt-redline').addEventListener('click',()=>{
    const box=document.getElementById('portal-redline');
    box.classList.toggle('hidden');
    const ta=document.getElementById('pt-redline-text');
    if(!ta.value) ta.value = (c.redlineText) ? c.redlineText : normText(freezeContractHtml(c));
    ta.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  document.getElementById('pt-redline-submit').addEventListener('click',()=>portalRespond(p,'redline'));
}
async function portalRespond(p, action){
  const name=fval('pt-name'), title=fval('pt-title'), email=fval('pt-email'), comment=fval('pt-comment');
  if(!name){ toast('Enter your full name','err'); return; }
  if(action==='sign' && !email){ toast('A work email is required to sign','err'); return; }
  if(action==='changes' && !comment){ toast('Add a comment explaining your response','err'); return; }
  if(action==='decline' && !comment){ toast('Add a comment explaining your response','err'); return; }
  // Server-backed signing: verify the signer's email with a one-time code first.
  if(action==='sign' && PORTAL_OPTS.token){ return portalStartOtp(p, {name,title,email,comment}); }
  // E2: a redline is a change request carrying proposed edited text + its base.
  let proposedText=null, baseText=null, sendAction=action;
  if(action==='redline'){
    proposedText=(document.getElementById('pt-redline-text')?.value||'').trim();
    if(!proposedText){ toast('Edit the text before submitting','err'); return; }
    baseText=p.contract.redlineText || normText(freezeContractHtml(migrateContract({...p.contract, status:'Under Review', folder:p.contract.folder||'corp'})));
    sendAction='changes';
  }
  const proposedValue = (action==='changes') ? fval('pt-proposed') : '';
  const response={ v:1, kind:'hati-response', id:p.contract.id, docHash:p.docHash, action:sendAction, name, title, email, comment,
    proposedValue: proposedValue||null, proposedText, baseText, at:nowISO() };
  const label={sign:'signature',changes:'change request',decline:'decline notice'}[sendAction];
  if(PORTAL_OPTS.token){
    try{
      await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
      document.getElementById('portal-result').innerHTML=`
        <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:16px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px;">${icon('check2','w-4 h-4')} ${label[0].toUpperCase()+label.slice(1)} delivered</div>
          <p style="font-size:11px;color:var(--color-neutral-700);margin:0;">${p.sharedBy} at ${p.org} has been notified — you're all done.</p>
        </div>`;
    }catch(e){ toast(e.message,'err'); }
    return;
  }
  const code=b64e(response);
  document.getElementById('portal-result').innerHTML=`
    <div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;color:var(--color-accent-800);font-size:12px;font-weight:600;margin-bottom:6px;">${icon('check2','w-3.5 h-3.5')} Your ${label} is ready</div>
      <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5;">Copy this response code and send it back to ${p.sharedBy} at ${p.org} (email or WhatsApp). They import it in HaTi to record it on the contract.</p>
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
  box.innerHTML=`<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:13px;font-size:11px;color:var(--color-neutral-700);">Sending a one-time code to <strong>${info.email}</strong>…</div>`;
  let devCode=null;
  try{
    const r=await api('shares/'+PORTAL_OPTS.token+'/otp','POST',{ email:info.email });
    devCode=r.devCode;
  }catch(e){ toast(e.message,'err'); box.innerHTML=''; return; }
  box.innerHTML=`
    <div style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:13px;">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:4px;">${icon('key','w-3.5 h-3.5')} Verify your email to sign</div>
      <p style="font-size:11px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5;">We sent a 6-digit code to <strong>${info.email}</strong>. Enter it to complete your signature.</p>
      ${devCode?`<p style="margin:0 0 8px;font-size:11px;border-radius:4px;background:color-mix(in srgb,#b8862b 10%,transparent);border:1px solid color-mix(in srgb,#b8862b 30%,transparent);color:#7d5a14;padding:6px 10px;line-height:1.5;">Email isn’t configured on this server yet, so for testing your code is <strong style="font-family:var(--font-mono);">${devCode}</strong>.</p>`:''}
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
    name:info.name, title:info.title, email:info.email, comment:info.comment, verify, at:nowISO() };
  try{
    await api('shares/'+PORTAL_OPTS.token+'/respond','POST',response);
    document.getElementById('portal-result').innerHTML=`
      <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:16px;text-align:center;">
        <div style="display:flex;align-items:center;justify-content:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px;">${icon('check2','w-4 h-4')} Signed &amp; verified</div>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0;">Your email-verified signature has been delivered to ${p.sharedBy} at ${p.org}. You're all done.</p>
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
      <div style="border:1px solid #d4d4d7;border-radius:10px;padding:16px;margin-bottom:16px;">
        <div style="font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:15px;margin-bottom:2px;">${c.name}</div>
        <div style="font-size:11px;color:#666;margin-bottom:10px;">External document received from ${c.counterparty||'—'} · filed under ${FOLDERS[c.folder].name}</div>
        <table style="font-size:11px;border-collapse:collapse;">
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Original file</td><td style="font-weight:600;">${u.fileName||'—'} (${u.size?Math.round(u.size/1024):0} KB)</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Value</td><td style="font-weight:600;">${!isMonetary(c)?'Non-monetary':(c.value?fmtKES(c.value):'—')}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">Status</td><td style="font-weight:600;">${c.status}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#666;">File fingerprint (SHA-256)</td><td style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:9px;word-break:break-all;">${u.fileHash||'—'}</td></tr>
        </table>
      </div>
      <p style="font-size:11px;color:#444;line-height:1.6;">This is a HaTi signing certificate for an externally-supplied contract. The original document (<strong>${u.fileName||'the attached file'}</strong>) is retained in HaTi and travels with this certificate. The seal below binds this certificate to that exact file by its SHA-256 fingerprint.</p>`;
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
  document.getElementById('print-root').innerHTML=`
    <div style="font-family:'IBM Plex Sans',system-ui,sans-serif;max-width:760px;margin:0 auto;padding:32px 24px;color:#1d1f20;">
      <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #5980a6;padding-bottom:10px;margin-bottom:24px;">
        <div style="font-family:'IBM Plex Sans',sans-serif;font-weight:700;font-size:18px;">HaTi <span style="font-weight:400;font-size:11px;color:#666;">· Contract Lifecycle</span></div>
        <div style="font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;color:#666;">${c.id} · generated ${fmtDT(nowISO())}</div>
      </div>
      ${bodyHtml}
      ${c.hash&&c.hash!=='PRE-SEEDED'?`<div style="margin-top:24px;padding:12px;border:1px solid #d4d4d7;border-radius:8px;font-family:'IBM Plex Mono',ui-monospace,monospace;font-size:10px;word-break:break-all;"><strong>SHA-256 DOCUMENT SEAL</strong><br/>${c.hash}<br/><span style="color:#666;">${c.signedAt||''}</span></div>`:''}
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

Object.assign(window,{PORTAL_OPTS,exportPDF,metrics,portalEntry,portalRespond,portalStartOtp,portalVerifyAndSign,refreshStats,renderSharePortal});
