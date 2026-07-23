// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   ADVICE PORTAL — the customer-facing side of the Advice Desk
   (no login, opened from #advice=new or a #advice=<token> link,
   same pattern as the counterparty share portal).
   · Intake: the published rate card per contract-support type,
     the live queue position, and a submission form.
   · Tracking: a transparent pipeline view of one request — the
     stages it has passed with timestamps, and the estimated
     feedback date promised at submission.
   ============================================================ */
const pesc = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
window.ADVICE_PORTAL={ remote:false, org:'', activeCount:0 };

async function adviceEntry(param){
  PORTAL_MODE=true;
  document.getElementById('app-shell').classList.add('hidden');
  // Server present? The public rates endpoint doubles as the mode probe.
  let remote=null;
  try{ const r=await fetch('api/advice/rates'); if(r.ok) remote=await r.json(); }catch(e){}
  if(remote){
    ADVICE_PORTAL={ remote:true, org:remote.orgName||'HaTi', activeCount:remote.queue?.active||0 };
    ADVICE_RATE_OVERRIDES=remote.rates||{};
  } else {
    hydrate(); hydrateAdvice();                       // same-browser demo (static mode)
    ADVICE_PORTAL={ remote:false, org:(getOrg()&&getOrg().name)||'HaTi', activeCount:adviceActiveCount() };
  }
  if(!param || param==='new'){ renderAdviceIntake(); return; }
  // tracking: t:<token> is a server token; a bare token is static-mode
  const token=param.startsWith('t:')?param.slice(2):param;
  if(ADVICE_PORTAL.remote){
    try{ const r=await fetch('api/advice/track/'+encodeURIComponent(token));
      const d=await r.json().catch(()=>null);
      if(!r.ok) throw new Error(d?.error||'not found');
      renderAdviceTracking(d.request); return;
    }catch(e){ renderAdviceTracking(null); return; }
  }
  renderAdviceTracking((state.advice||[]).find(x=>x.token===token)||null);
}

const advicePortalShell = inner => `
  <div style="min-height:100vh;background:var(--color-bg);">
    <header style="background:var(--color-accent-900);color:#fff;padding:14px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:12px;">
        <div style="width:34px;height:34px;background:var(--color-accent);color:#fff;display:grid;place-items:center;font-family:var(--font-mono);font-weight:600;font-size:15px;letter-spacing:.02em;border-radius:4px;flex:none;">HT</div>
        <div style="line-height:1.25;min-width:0;">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:15px;">${pesc(ADVICE_PORTAL.org)} · Legal Advice Desk</div>
          <div style="font-size:11px;color:var(--color-accent-200);font-family:var(--font-mono);">Contract advice, review &amp; drafting · transparent turnaround &amp; published rates · via HaTi</div>
        </div>
      </div>
    </header>
    <div style="max-width:1100px;margin:0 auto;padding:28px 24px;">${inner}</div>
    <p style="max-width:1100px;margin:0 auto;padding:0 24px 28px;font-size:10.5px;color:var(--color-neutral-500);line-height:1.6">
      Advice is provided by ${pesc(ADVICE_PORTAL.org)}'s legal counsel. Hourly rates and typical hours are indicative — a fixed fee estimate is
      confirmed with you at the Scoping stage before any billable work begins. Submitting a request does not by itself create an
      advocate–client relationship; that is established at engagement.
    </p>
  </div>`;

/* ---------- intake ---------- */
function renderAdviceIntake(){
  const root=document.getElementById('share-root');
  const inputStyle='width:100%;min-height:36px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 11px;font-size:13px;font-family:var(--font-body);color:var(--color-text);outline:none';
  const field=(id,label,ph,type='text')=>`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em">${label}</span><input id="${id}" type="${type}" placeholder="${ph}" style="${inputStyle}"/></label>`;
  const svcCard=s=>{
    const r=adviceRateFor(s.id);
    return `
    <label data-svc="${s.id}" style="display:block;border:1.5px solid var(--color-divider);border-radius:7px;background:var(--color-surface);padding:13px 14px;cursor:pointer;transition:border-color .12s ease, box-shadow .12s ease">
      <input type="radio" name="adv-svc" value="${s.id}" style="position:absolute;opacity:0"/>
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:30px;height:30px;flex:none;display:grid;place-items:center;border-radius:5px;background:var(--color-accent-100);color:var(--color-accent-800)">${icon(s.ic,'w-4 h-4')}</span>
        <span style="font-size:13px;font-weight:600;line-height:1.25;min-width:0">${s.name}</span>
        <span style="margin-left:auto;flex:none;font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--color-accent-800);white-space:nowrap">${fmtKES(r.rate)}<span style="font-weight:400;color:var(--color-neutral-500)">/hr</span></span>
      </div>
      <p style="font-size:11px;color:var(--color-neutral-600);margin:7px 0 8px;line-height:1.5">${s.blurb}</p>
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:10px">
        <span style="background:var(--color-bg);border:1px solid var(--color-divider);border-radius:999px;padding:2px 8px;color:var(--color-neutral-700);font-variant-numeric:tabular-nums">typically ${r.hoursMin}–${r.hoursMax} hrs · ${fmtKESshort(r.rate*r.hoursMin)}–${fmtKESshort(r.rate*r.hoursMax)}</span>
        <span style="background:#e8f4ee;border:1px solid #cfe7d9;border-radius:999px;padding:2px 8px;color:#1e6b4d;font-variant-numeric:tabular-nums">feedback in ~${r.days} business day${r.days===1?'':'s'}</span>
      </div>
    </label>`;
  };
  root.innerHTML=advicePortalShell(`
    <div style="display:grid;gap:22px;align-items:start" class="portal-grid">
      <div>
        <h1 style="font-family:var(--font-heading);font-weight:600;font-size:22px;margin:0 0 4px;color:var(--color-text)">What do you need help with?</h1>
        <p style="font-size:12.5px;color:var(--color-neutral-700);margin:0 0 16px;line-height:1.55">Pick a service — the hourly rate, typical effort and turnaround are published up front. After you submit, you get a tracking link that shows exactly where your request sits in the pipeline.</p>
        <div id="adv-queue-note" style="margin-bottom:14px;border:1px solid var(--color-divider);border-radius:6px;background:var(--color-accent-100);padding:10px 13px;font-size:11.5px;color:var(--color-accent-800);line-height:1.5;display:flex;align-items:center;gap:8px">${icon('clock','w-4 h-4')}<span id="adv-queue-text">Select a service to see your estimated feedback date.</span></div>
        <div style="display:grid;grid-template-columns:1fr;gap:10px" class="adv-svc-grid">${Object.values(ADVICE_SERVICES).map(svcCard).join('')}</div>
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);padding:18px" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:16px;color:var(--color-text);margin:0 0 4px">Submit your request</h2>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 14px;line-height:1.5">${ADVICE_PORTAL.remote?'Your request goes straight to the legal team — no account needed.':'Demo mode — this request is stored in this browser only.'}</p>
        ${field('ap-name','Full name *','e.g. Grace Njeri')}
        ${field('ap-email','Work email *','you@company.co.ke','email')}
        ${field('ap-company','Company','e.g. Tamu Beverages Ltd')}
        ${field('ap-contract','Contract concerned','e.g. Distribution Agreement — Coast Region')}
        <label style="display:block;margin-bottom:12px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-neutral-700);margin-bottom:4px;font-family:var(--font-mono);letter-spacing:.02em">Describe what you need *</span>
          <textarea id="ap-desc" rows="4" placeholder="e.g. We received this distribution agreement and need to know the termination and exclusivity risks before we sign…" style="${inputStyle}min-height:0"></textarea></label>
        <label style="display:flex;align-items:flex-start;gap:9px;font-size:11.5px;color:var(--color-neutral-700);margin-bottom:14px;line-height:1.45"><input id="ap-priority" type="checkbox" style="width:15px;height:15px;accent-color:var(--color-accent);margin-top:1px"/><span><strong>Priority</strong> — +25% on the hourly rate, turnaround halved.</span></label>
        <button id="ap-go" class="ui-btn ui-btn-primary" style="width:100%;padding:10px;font-size:13px">${icon('send','w-4 h-4')} Submit request</button>
        <div id="ap-result" style="margin-top:14px"></div>
      </aside>
    </div>
    <style>
      .portal-grid{grid-template-columns:1fr}
      @media(min-width:1024px){.portal-grid{grid-template-columns:1fr 360px}.portal-aside{position:sticky;top:24px}}
      @media(min-width:720px){.adv-svc-grid{grid-template-columns:1fr 1fr!important}}
      [data-svc].sel{border-color:var(--color-accent)!important;box-shadow:var(--shadow-md)}
    </style>`);
  const queueText=()=>{
    const sid=document.querySelector('input[name="adv-svc"]:checked')?.value;
    const el=document.getElementById('adv-queue-text'); if(!el) return;
    const n=ADVICE_PORTAL.activeCount;
    if(!sid){ el.textContent='Select a service to see your estimated feedback date.'; return; }
    const urgency=document.getElementById('ap-priority').checked?'priority':'standard';
    const eta=adviceEta(sid, urgency, n, nowISO());
    el.innerHTML=`${n===0?'The pipeline is clear':`<strong>${n}</strong> request${n===1?' is':'s are'} currently in the pipeline`} — submit today and expect feedback by <strong>${fmtDay(eta)}</strong>.`;
  };
  document.querySelectorAll('[data-svc]').forEach(card=>card.addEventListener('click',()=>{
    document.querySelectorAll('[data-svc]').forEach(c=>c.classList.remove('sel'));
    card.classList.add('sel');
    card.querySelector('input').checked=true;
    queueText();
  }));
  document.getElementById('ap-priority').addEventListener('change',queueText);
  document.getElementById('ap-go').addEventListener('click',async()=>{
    const sid=document.querySelector('input[name="adv-svc"]:checked')?.value;
    if(!sid){ toast('Pick a service first','err'); return; }
    const p={ service:sid, urgency:document.getElementById('ap-priority').checked?'priority':'standard',
      name:fval('ap-name'), email:fval('ap-email'), company:fval('ap-company'),
      contractName:fval('ap-contract'), description:fval('ap-desc') };
    if(!p.name||!p.email||!p.description){ toast('Name, email and a description are required','err'); return; }
    let req;
    try{
      if(ADVICE_PORTAL.remote){
        const r=await fetch('api/advice/requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
        const d=await r.json().catch(()=>null);
        if(!r.ok) throw new Error(d?.error||'Submission failed');
        req=d.request;
      } else req=await createAdviceRequest(p);
    }catch(e){ toast(e.message,'err'); return; }
    const link=location.origin+location.pathname+'#advice='+(ADVICE_PORTAL.remote?'t:':'')+req.token;
    document.getElementById('ap-result').innerHTML=`
      <div style="border:1px solid color-mix(in srgb,#2e8763 30%,transparent);background:#d9eae0;border-radius:6px;padding:14px">
        <div style="display:flex;align-items:center;gap:6px;color:#1e6b4d;font-size:13px;font-weight:600;margin-bottom:4px">${icon('check2','w-4 h-4')} Request ${pesc(req.id)} submitted</div>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5">Estimated feedback by <strong>${fmtDay(req.eta)}</strong>. Follow every stage on your tracking page:</p>
        <textarea id="ap-link" readonly rows="2" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:9px;font-size:10.5px;font-family:var(--font-mono);color:var(--color-text);outline:none;word-break:break-all">${link}</textarea>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <button id="ap-copy" class="ui-btn" style="padding:8px;font-size:12px">${icon('copy','w-3 h-3')} Copy link</button>
          <button id="ap-open" class="ui-btn ui-btn-primary" style="padding:8px;font-size:12px">Open tracking</button>
        </div>
      </div>`;
    document.getElementById('ap-copy').addEventListener('click',async()=>{ try{ await navigator.clipboard.writeText(link); }catch(e){ document.getElementById('ap-link').select(); document.execCommand('copy'); } toast('Tracking link copied — keep it safe'); });
    document.getElementById('ap-open').addEventListener('click',()=>{ location.hash='#advice='+(ADVICE_PORTAL.remote?'t:':'')+req.token; location.reload(); });
    document.getElementById('ap-go').disabled=true;
  });
}

/* ---------- tracking (the transparent pipeline, customer view) ---------- */
function renderAdviceTracking(r){
  const root=document.getElementById('share-root');
  if(!r){
    root.innerHTML=advicePortalShell(`
      <div style="display:grid;place-items:center;padding:40px 0">
        <div style="background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:7px;padding:32px;text-align:center;max-width:24rem">
          <div style="color:#b0453c;margin-bottom:12px;display:flex;justify-content:center">${icon('ban','w-8 h-8')}</div>
          <h1 style="font-family:var(--font-heading);font-weight:600;font-size:20px;color:var(--color-text);margin:0">Request not found</h1>
          <p style="font-size:13px;color:var(--color-neutral-700);margin-top:6px;line-height:1.5">This tracking link is invalid or the request was removed. Check the link, or contact the legal team.</p>
        </div>
      </div>`);
    return;
  }
  const svc=ADVICE_SERVICES[r.service]||{name:r.service,ic:'msg',blurb:''};
  const q=r.quote||{};
  const closed=r.status==='Closed';
  const path=['Submitted','Scoping','In Progress','Delivered'];
  const reached=k=>(r.history||[]).find(h=>h.to===k);
  const curIdx=closed?-1:Math.max(0,path.indexOf(r.status));
  const left=adviceDaysLeft(r.eta);
  const steps=path.map((k,i)=>{
    const s=adviceStage(k), hit=reached(k);
    const state_=hit?(i===curIdx&&k!=='Delivered'?'now':'done'):'todo';
    const dotBg=state_==='todo'?'var(--color-surface)':s.color;
    const dotBd=state_==='todo'?'var(--color-divider)':s.color;
    return `
      <div style="display:flex;gap:12px;position:relative">
        <div style="display:flex;flex-direction:column;align-items:center;flex:none">
          <span style="width:15px;height:15px;border-radius:50%;background:${dotBg};border:2px solid ${dotBd};display:grid;place-items:center;flex:none;z-index:1">${state_==='done'?`<span style="color:#fff;display:inline-flex">${icon('check2','w-2.5 h-2.5')}</span>`:state_==='now'?'<span class="live-ping" style="width:5px;height:5px;border-radius:50%;background:#fff"></span>':''}</span>
          ${i<path.length-1?`<span style="width:2px;flex:1;min-height:26px;background:${reached(path[i+1])?adviceStage(path[i+1]).color:'var(--color-divider)'}"></span>`:''}
        </div>
        <div style="padding-bottom:${i<path.length-1?'18px':'0'};min-width:0">
          <div style="font-size:13px;font-weight:600;color:${state_==='todo'?'var(--color-neutral-500)':'var(--color-text)'}">${s.label}${state_==='now'?` <span style="font-size:10px;font-weight:600;color:${s.color}">· current stage</span>`:''}</div>
          <div style="font-size:11px;color:var(--color-neutral-600);line-height:1.45">${s.desc}</div>
          ${hit?`<div style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);margin-top:2px">${fmtDT(hit.at)}</div>`:''}
        </div>
      </div>`;
  }).join('');
  const row=(k,v)=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid rgba(29,31,32,.06);font-size:12px"><span style="color:var(--color-neutral-600);flex:none">${k}</span><span style="font-weight:500;text-align:right;min-width:0">${v}</span></div>`;
  const etaBanner = closed
    ? `<div style="border:1px solid #f5d4cd;background:#fdece9;border-radius:6px;padding:12px 14px;font-size:12px;color:#8f322b;line-height:1.5">This request was closed without delivery${reached('Closed')?` on ${fmtDay(reached('Closed').at)}`:''}. Contact the legal team if that's unexpected.</div>`
    : r.status==='Delivered'
    ? `<div style="border:1px solid #cfe7d9;background:#e8f4ee;border-radius:6px;padding:12px 14px;font-size:12px;color:#1e6b4d;line-height:1.5"><strong>Delivered${reached('Delivered')?' '+fmtDay(reached('Delivered').at):''}.</strong> Your feedback is with you — reply to the team if anything needs a follow-up.</div>`
    : `<div style="border:1px solid var(--color-divider);background:var(--color-accent-100);border-radius:6px;padding:12px 14px;font-size:12px;color:var(--color-accent-800);line-height:1.5">Estimated feedback by <strong>${fmtDay(r.eta)}</strong>${left!=null?(left<0?` — running ${-left} day${-left===1?'':'s'} over, the team is on it`:left===0?' — that’s today':` — ${left} day${left===1?'':'s'} away`):''}.</div>`;
  root.innerHTML=advicePortalShell(`
    <div style="display:grid;gap:22px;align-items:start" class="portal-grid">
      <div style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:7px;box-shadow:var(--shadow-sm);padding:22px 24px">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:14px">
          <span style="width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:6px;background:var(--color-accent-100);color:var(--color-accent-800)">${icon(svc.ic,'w-4 h-4')}</span>
          <div style="min-width:0">
            <h1 style="font-family:var(--font-heading);font-weight:600;font-size:19px;margin:0;line-height:1.25;color:var(--color-text)">${pesc(svc.name)}</h1>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-600)">${pesc(r.id)} · submitted ${fmtDay(r.submittedAt)}</div>
          </div>
          <span style="margin-left:auto;flex:none">${adviceStageChip(r.status)}</span>
        </div>
        ${etaBanner}
        <h3 style="font-size:10px;color:var(--color-neutral-600);letter-spacing:.1em;text-transform:uppercase;margin:18px 0 12px">Where your request is</h3>
        ${steps}
      </div>
      <aside style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:6px;box-shadow:var(--shadow-sm);padding:18px" class="portal-aside">
        <h2 style="font-family:var(--font-heading);font-weight:600;font-size:15px;color:var(--color-text);margin:0 0 8px">Your fee estimate</h2>
        ${row('Hourly rate', q.rate?fmtKES(q.rate)+' / hr':'—')}
        ${row('Typical effort', q.rate?`${q.hoursMin}–${q.hoursMax} hrs`:'—')}
        ${row('Estimate range', q.rate?`${fmtKESshort(q.rate*q.hoursMin)}–${fmtKESshort(q.rate*q.hoursMax)}`:'—')}
        ${row('Urgency', r.urgency==='priority'?'Priority':'Standard')}
        ${r.contractName?row('Contract', pesc(r.contractName)):''}
        <p style="font-size:10.5px;color:var(--color-neutral-500);margin:10px 0 0;line-height:1.55">The final fee is confirmed with you at Scoping before billable work starts — you will never be invoiced beyond what is agreed there.</p>
        <button id="at-new" class="ui-btn" style="width:100%;margin-top:14px;padding:8px;font-size:12px">${icon('plus','w-3.5 h-3.5')} Submit another request</button>
      </aside>
    </div>
    <style>.portal-grid{grid-template-columns:1fr}@media(min-width:1024px){.portal-grid{grid-template-columns:1fr 340px}.portal-aside{position:sticky;top:24px}}</style>`);
  document.getElementById('at-new').addEventListener('click',()=>{ location.hash='#advice=new'; location.reload(); });
}

Object.assign(window,{adviceEntry,renderAdviceIntake,renderAdviceTracking});
