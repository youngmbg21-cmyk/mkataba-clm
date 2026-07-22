// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: TEAM & SETTINGS
   ============================================================ */
function renderTeam(){
  const me=currentUser(), o=getOrg();
  const roleChip=r=>({admin:'bg-ink text-white',legal:'bg-brand-50 text-brand-700',viewer:'bg-gold-500/15 text-gold-600'}[r]||'');
  const statusChipT=s=>s==='invited'?'bg-gold-500/15 text-gold-600':'bg-brand-50 text-brand-700';
  const rows=getUsers().map(x=>`
    <div class="flex items-center gap-3 px-5 py-3.5 border-b border-brand-100/40 last:border-0">
      <div class="h-9 w-9 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-[11px] font-semibold font-mono shrink-0">${x.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-600 text-ink">${x.name}${x.id===me.id?' <span class="text-[11px] font-normal text-ink/40">(you)</span>':''}</div>
        <div class="text-[11px] font-mono text-ink/65 truncate">${x.email}</div>
      </div>
      <span class="text-[11px] px-2.5 py-1 rounded-full font-600 ${roleChip(x.role)}">${ROLE_LABEL[x.role]}</span>
      <span class="hidden sm:inline text-[11px] px-2.5 py-1 rounded-full font-600 ${statusChipT(x.status)}">${x.status==='invited'?'Invited':'Active'}</span>
      ${isAdmin()&&x.id!==me.id?`
        <select data-role-for="${x.id}" title="Change role" class="text-xs rounded-lg border border-inputln bg-white px-2 py-1.5 outline-none focus:border-brand-500">
          ${['admin','legal','viewer'].map(r=>`<option value="${r}" ${x.role===r?'selected':''}>${ROLE_LABEL[r]}</option>`).join('')}
        </select>
        <button data-remove-user="${x.id}" class="text-[11px] text-rose-500 hover:text-rose-700 font-medium transition">Remove</button>`
      :`<span class="w-[52px]"></span>`}
    </div>`).join('');

  document.getElementById('content').innerHTML=`
  <div class="view-enter h-full flex flex-col">
    <header class="shrink-0 sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-hair">
      <div class="px-8 py-4 max-w-[1040px] mx-auto w-full">
        <h1 class="font-display font-700 text-[26px] tracking-tight text-ink">Team &amp; Settings</h1>
        <p class="text-[13px] text-ink/70 mt-0.5">${o.name} · workspace created ${fmtDT(o.createdAt)}</p>
      </div>
    </header>
    <div class="flex-1 min-h-0 overflow-y-auto scroll-thin"><div class="px-8 py-7 max-w-[1040px] mx-auto w-full space-y-5">

      <section class="bg-white rounded-2xl elev-2 p-5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4 min-w-0">
          <div class="h-14 w-14 rounded-2xl bg-ink grid place-items-center text-gold-400 shrink-0">${icon('building','w-6 h-6')}</div>
          <div class="min-w-0">
            <div class="font-display font-700 text-lg text-ink truncate">${o.name}</div>
            <div class="text-xs text-ink/70 font-mono">Business plan · Nairobi, Kenya · ${getUsers().length} member${getUsers().length===1?'':'s'}</div>
          </div>
        </div>
        <button id="org-export" class="flex items-center gap-1.5 rounded-xl border border-inputln text-brand-700 px-4 py-2.5 text-sm font-medium hover:bg-brand-50 transition shrink-0">${icon('download','w-4 h-4')} Export backup</button>
      </section>

      <section class="bg-white rounded-2xl elev-2 overflow-hidden">
        <div class="flex items-center gap-2 px-5 py-4 border-b border-brand-100/50">
          <span class="text-brand-500">${icon('users')}</span>
          <h2 class="font-display font-600 text-ink">Members &amp; roles</h2>
          <span class="ml-auto text-[11px] font-mono text-ink/40">${getUsers().length} member${getUsers().length===1?'':'s'}</span>
        </div>
        ${rows}
        ${isAdmin()?`
        <div class="px-5 py-4 bg-brand-50/40 border-t border-brand-100/60">
          <div class="text-xs font-semibold text-brand-900 mb-2 flex items-center gap-1.5">${icon('userplus','w-3.5 h-3.5')} Add team member</div>
          <div class="grid sm:grid-cols-2 gap-2">
            <input id="tm-name" type="text" placeholder="Full name" class="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"/>
            <input id="tm-email" type="email" placeholder="Work email" class="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"/>
            <select id="tm-role" class="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400">
              <option value="legal">Legal — edit &amp; sign</option>
              <option value="viewer">Viewer — read only</option>
              <option value="admin">Admin — full control</option>
            </select>
            <input id="tm-pass" type="password" placeholder="Temporary password (min 8)" class="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"/>
          </div>
          <button id="tm-add" class="mt-2.5 rounded-lg bg-brand-900 text-white px-4 py-2 text-sm font-medium hover:bg-brand-800 transition">Add member</button>
        </div>`:''}
      </section>

      <div class="grid lg:grid-cols-2 gap-5 items-start">
      <section class="bg-white rounded-2xl elev-2 p-6">
        <div class="flex items-center gap-2 mb-1.5"><span class="text-brand-500">${icon('shield')}</span>
          <h2 class="font-display font-600 text-ink text-[17px]">Approval rules</h2></div>
        <p class="text-[13px] text-ink/70 mb-4 leading-relaxed">IF a contract matches a condition THEN it needs the named approver before signing. Rules run in order — a lower order number approves first (e.g. Finance then Legal).</p>
        <div id="approval-rules"></div>
        ${isAdmin()?`<button id="ar-add" class="mt-3 flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-600 hover:bg-brand-50 transition">${icon('plus','w-3.5 h-3.5')} Add rule</button>`
          :`<p class="mt-2 text-[11px] text-ink/65">Only an admin can change approval rules.</p>`}
      </section>

      <section class="bg-white rounded-2xl elev-2 p-6">
        <div class="flex items-center gap-2 mb-1.5"><span class="text-gold-500">${icon('calendar','w-[18px] h-[18px]')}</span>
          <h2 class="font-display font-600 text-ink text-[17px]">Renewal reminders</h2></div>
        <p class="text-[13px] text-ink/70 mb-4 leading-relaxed">Email the contract owner ahead of every executed contract’s expiry.</p>
        <div class="flex flex-wrap gap-2">
          ${[90,60,30].map(d=>`<span class="rounded-full bg-ink text-white px-4 py-2 text-xs font-600">${d} days</span>`).join('')}
        </div>
      </section>
      </div>

      ${API_MODE()?`
      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center gap-2 mb-1"><span class="text-gold-500">${icon('sparkle','w-[18px] h-[18px]')}</span>
          <h2 class="font-display font-600 text-ink">AI engine</h2></div>
        <p class="text-xs text-ink/70 mb-3">Powers natural-language filtering and clustering on the <b>Portfolio Intelligence</b> graph. Paste an Anthropic API key (stored on your server, never in the browser). Without a key the graph falls back to the built-in interpreter.</p>
        <div id="ai-cfg-status" class="text-[11px] mb-3 text-ink/70">Checking…</div>
        ${isAdmin()?`
        <div class="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
          <label class="block"><span class="text-[12px] font-600 text-ink">Anthropic API key</span>
            <input id="ai-key" type="password" placeholder="sk-ant-…" class="mt-1.5 w-full rounded-[11px] border border-inputln bg-canvas px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-[3px] focus:ring-[rgba(11,122,95,.1)] transition"/></label>
          <button id="ai-key-save" class="rounded-xl bg-ink text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-800 transition">Save key</button>
        </div>
        <div class="flex items-center gap-3 mt-2.5">
          <button id="ai-key-clear" class="text-[11px] text-rose-500 hover:text-rose-700 font-medium">Remove key</button>
        </div>
        <div class="mt-3 pt-3 border-t border-hair">
          <div class="text-[12px] font-600 text-ink">Model routing</div>
          <p class="text-[11px] text-ink/60 mt-0.5 mb-2.5">HaTi routes each AI task to one of two tiers. Leave an override blank to use the recommended default.</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-hair p-2.5">
              <div class="text-[11px] font-600 text-ink">Fast tier</div>
              <div class="text-[10px] text-ink/55 mb-1.5">Search · graph filtering &amp; clustering · metadata extraction · template suggestions</div>
              <div class="text-[10px] text-ink/70 mb-1.5">Current: <span id="ai-model-fast-cur" class="font-mono">—</span></div>
              <input id="ai-model-fast" type="text" placeholder="default (recommended)" class="w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/>
            </div>
            <div class="rounded-lg border border-hair p-2.5">
              <div class="text-[11px] font-600 text-ink">Deep tier</div>
              <div class="text-[10px] text-ink/55 mb-1.5">Legal / playbook review · obligation extraction</div>
              <div class="text-[10px] text-ink/70 mb-1.5">Current: <span id="ai-model-deep-cur" class="font-mono">—</span></div>
              <input id="ai-model-deep" type="text" placeholder="default (recommended)" class="w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/>
            </div>
          </div>
          <details class="text-[11px] mt-2">
            <summary class="cursor-pointer text-ink/60">Advanced: override every tier</summary>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <input id="ai-model-global" type="text" placeholder="(none)" class="rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono w-64 outline-none focus:border-brand-500"/>
              <span class="text-[10px] text-ink/50">Forces this one model for both tiers (equivalent to the <span class="font-mono">ANTHROPIC_MODEL</span> env var).</span>
            </div>
          </details>
          <button id="ai-model-save" class="mt-2.5 rounded-lg bg-ink text-white px-3.5 py-2 text-[12px] font-600 hover:bg-brand-800 transition">Save model settings</button>
        </div>
        <div class="mt-3 pt-3 border-t border-hair">
          <div class="text-[12px] font-600 text-ink">Usage &amp; cost controls</div>
          <p class="text-[11px] text-ink/60 mt-0.5 mb-2">Each AI request calls Anthropic and costs money. These limits protect against runaway loops and surprise bills.</p>
          <div id="ai-usage" class="text-[11px] text-ink/75 mb-2.5">Today: —</div>
          <div class="grid gap-2.5 sm:grid-cols-2">
            <label class="block"><span class="text-[10px] text-ink/60">Light requests / 15 min · per user<br><span class="text-ink/40">search, graph, template, extract</span></span>
              <input id="ai-rate-light" type="number" min="1" class="mt-1 w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/></label>
            <label class="block"><span class="text-[10px] text-ink/60">Deep requests / 15 min · per user<br><span class="text-ink/40">playbook review, obligations</span></span>
              <input id="ai-rate-deep" type="number" min="1" class="mt-1 w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/></label>
            <label class="block"><span class="text-[10px] text-ink/60">Daily request ceiling · whole workspace<br><span class="text-ink/40">0 disables the daily backstop</span></span>
              <input id="ai-daily" type="number" min="0" class="mt-1 w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/></label>
            <label class="block"><span class="text-[10px] text-ink/60">Max characters / request<br><span class="text-ink/40">longer input is shortened first</span></span>
              <input id="ai-maxchars" type="number" min="1000" class="mt-1 w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/></label>
            <label class="block"><span class="text-[10px] text-ink/60">Max contracts / request<br><span class="text-ink/40">portfolio-wide AI calls</span></span>
              <input id="ai-maxcontracts" type="number" min="1" class="mt-1 w-full rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-brand-500"/></label>
          </div>
          <button id="ai-limits-save" class="mt-2.5 rounded-lg bg-ink text-white px-3.5 py-2 text-[12px] font-600 hover:bg-brand-800 transition">Save limits</button>
        </div>
        <div class="mt-4 pt-4 border-t border-hair">
          <div class="text-[12px] font-600 text-ink mb-1">File existing contracts</div>
          <p class="text-[11px] text-ink/65 mb-2.5">Extract structured details (counterparty, dates, value, renewal terms, governing law) from uploaded contracts that don't have them yet. Each is presented for your review before saving — nothing is written automatically.</p>
          <button id="meta-backfill" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-600 hover:bg-brand-50 transition">${icon('sparkle','w-3.5 h-3.5')} <span id="meta-backfill-lbl">Extract metadata for existing contracts</span></button>
        </div>`:`<p class="text-[11px] text-ink/65">Only an admin can configure the AI key.</p>`}
      </section>`:''}

      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center gap-2 mb-1"><span class="text-brand-500">${icon('scroll')}</span>
          <h2 class="font-display font-600 text-ink">Clause library &amp; playbook</h2></div>
        <p class="text-xs text-ink/70 mb-3">Your standard clauses (preferred and fallback wording) and the Kenya FMCG playbook that the AI review checks incoming paper against. ${isAdmin()||currentUser()?.role==='legal'?'Edit the library below; the playbook ships seeded per contract type.':'Only Admin or Legal can edit these.'}</p>
        <div id="clause-lib" class="space-y-2"></div>
        ${(isAdmin()||currentUser()?.role==='legal')?`<button id="cl-add" class="mt-3 flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-600 hover:bg-brand-50 transition">${icon('plus','w-3.5 h-3.5')} Add clause</button>`:''}
        <div id="playbook-view" class="mt-4 pt-4 border-t border-hair"></div>
      </section>

      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center gap-2 mb-1"><span class="text-brand-500">${icon('shield')}</span>
          <h2 class="font-display font-600 text-ink">Data &amp; backup</h2></div>
        <p class="text-xs text-brand-800/70 mb-3">${API_MODE()?'This workspace runs on your HaTi server — every device sees the same contracts and accounts. Export a backup any time for your records.':'This build stores everything in this browser’s local storage. Export a backup to move workspaces between machines — run the HaTi server for central storage.'}</p>
        <div class="flex flex-wrap gap-2">
          <button id="bk-export" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Export backup</button>
          ${(API_MODE()&&isAdmin())?`<a id="bk-zip" href="api/export/workspace.zip" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('download','w-3.5 h-3.5')} Export full workspace (.zip)</a>`:''}
          ${(!API_MODE()&&isAdmin())?`
          <label class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition cursor-pointer">${icon('upload','w-3.5 h-3.5')} Restore backup<input id="bk-import" type="file" accept=".json,application/json" class="hidden"/></label>
          <button id="bk-reset" class="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 px-3.5 py-2 text-xs font-medium hover:bg-rose-50 transition">${icon('ban','w-3.5 h-3.5')} Reset workspace</button>`:''}
        </div>
      </section>

      ${(API_MODE())?`
      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center gap-2 mb-1"><span class="text-brand-500">${icon('lock')}</span>
          <h2 class="font-display font-600 text-ink">Active sessions</h2></div>
        <p class="text-xs text-ink/70 mb-3">Devices signed in to your account. Revoke any you don't recognise — sessions also expire automatically after 30 days.</p>
        <div id="sessions-list" class="text-xs text-ink/65">Loading…</div>
      </section>`:''}

      ${(API_MODE()&&isAdmin())?`
      <section class="bg-white rounded-2xl elev-2 p-5">
        <div class="flex items-center gap-2 mb-1"><span class="text-brand-500">${icon('send')}</span>
          <h2 class="font-display font-600 text-brand-900">Email &amp; notifications</h2></div>
        <p class="text-xs text-brand-800/70 mb-3">Renewal reminders (90/60/30 days out), team invites, password resets and counterparty signing codes are sent by email. Set a <span class="font-mono">RESEND_API_KEY</span> on the server to turn on real delivery — until then, messages (and one-time codes) appear in the outbox below for testing.</p>
        <div class="flex flex-wrap gap-2 mb-3">
          <button id="rem-run" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('clock','w-3.5 h-3.5')} Check renewals &amp; queue reminders</button>
          <button id="ob-refresh" class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition">${icon('history','w-3.5 h-3.5')} Refresh outbox</button>
        </div>
        <div id="outbox-list" class="text-xs text-brand-800/65">Loading outbox…</div>
      </section>`:''}
    </div></div>
  </div>`;

  if(API_MODE()&&isAdmin()){
    const loadOutbox=async()=>{
      try{ const r=await api('outbox');
        const host=document.getElementById('outbox-list'); if(!host) return;
        host.innerHTML=`<div class="mb-2 text-[11px] ${r.emailConfigured?'text-brand-600':'text-gold-600'}">${r.emailConfigured?'Email delivery is configured (Resend).':'Email delivery not configured — showing queued messages & dev codes.'}</div>`+
          (r.items.length?`<div class="space-y-1.5 max-h-56 overflow-y-auto scroll-thin">${r.items.map(it=>`
            <div class="rounded-lg border border-brand-100 bg-white p-2.5">
              <div class="flex items-center gap-2"><span class="text-[11px] font-medium text-brand-900 truncate flex-1">${it.subject}</span><span class="text-[9px] uppercase tracking-wider ${it.sent?'text-brand-600':'text-gold-600'}">${it.sent?'sent':it.provider}</span></div>
              <div class="text-[10px] font-mono text-brand-800/65 truncate">→ ${it.to_addr} · ${fmtDT(it.created_at)}</div>
              ${it.dev_hint?`<div class="mt-1 text-[10px] font-mono text-gold-700 bg-gold-500/10 rounded px-1.5 py-0.5 inline-block">${it.dev_hint}</div>`:''}
            </div>`).join('')}</div>`:`<div class="text-[11px] text-brand-800/65">No messages yet.</div>`);
      }catch(e){}
    };
    setTimeout(loadOutbox,50);
    document.getElementById('ob-refresh')?.addEventListener('click',loadOutbox);
    document.getElementById('rem-run')?.addEventListener('click',async()=>{
      try{ const r=await api('reminders/run','POST',{}); toast(`Checked ${r.checked} contracts — ${r.queued} reminder${r.queued===1?'':'s'} queued`); loadOutbox(); }
      catch(e){ toast(e.message,'err'); }
    });
  }

  document.getElementById('org-export')?.addEventListener('click',()=>document.getElementById('bk-export')?.click());
  renderClauseLibrary();
  if(API_MODE()) loadSessions();
  // AI engine config
  if(API_MODE()){
    const refreshAiCfg=async()=>{ const el=document.getElementById('ai-cfg-status'); if(!el) return;
      try{ const c=await api('ai/config'); state.aiConfigured=!!c.configured;
        const fast=c.tiers?.fast?.model||c.models?.fast||c.model||'', deep=c.tiers?.deep?.model||c.models?.deep||'';
        el.innerHTML=c.configured
          ?`<span class="text-brand-600">● Configured</span> · key ${c.hint}${c.source==='env'?' (from server env)':''}`
          :`<span class="text-gold-600">● Not configured</span> — AI features fall back to the built-in interpreter.`;
        const set=(id,v)=>{ const n=document.getElementById(id); if(n) n.textContent=v||'—'; };
        set('ai-model-fast-cur',fast); set('ai-model-deep-cur',deep);
        // fill overrides without clobbering a field the admin is editing
        const fill=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n) n.value=v||''; };
        fill('ai-model-fast',c.tiers?.fast?.override); fill('ai-model-deep',c.tiers?.deep?.override); fill('ai-model-global',c.globalOverride);
        // usage + cost-control limits (admin-only fields; helpers null-check)
        const lim=c.limits||{}, use=c.usage||{};
        const uEl=document.getElementById('ai-usage');
        if(uEl){ const cap=use.dailyLimit||0;
          uEl.innerHTML=cap>0
            ?`<b>${use.count||0}</b> of <b>${cap}</b> AI requests today (${use.date||''})`
            :`<b>${use.count||0}</b> AI requests today (${use.date||''}) · daily ceiling disabled`; }
        const fillN=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&v!==undefined) n.value=v; };
        fillN('ai-rate-light',lim.rateLight); fillN('ai-rate-deep',lim.rateDeep); fillN('ai-daily',lim.dailyLimit);
        fillN('ai-maxchars',lim.maxChars); fillN('ai-maxcontracts',lim.maxContracts);
      }catch(e){ el.textContent='Could not read AI config.'; } };
    refreshAiCfg();
    // basic shape check mirroring the server (blank = clear override)
    const okModel=(s)=>s===''||(!/\s/.test(s)&&/^claude-[a-z0-9][a-z0-9.\-]*$/i.test(s));
    document.getElementById('ai-key-save')?.addEventListener('click',async()=>{
      const key=document.getElementById('ai-key').value.trim();
      if(!key){ toast('Enter a key to save','err'); return; }
      try{ await api('ai/config','PUT',{ key }); document.getElementById('ai-key').value=''; toast('AI engine key saved'); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-model-save')?.addEventListener('click',async()=>{
      const modelFast=document.getElementById('ai-model-fast').value.trim();
      const modelDeep=document.getElementById('ai-model-deep').value.trim();
      const model=document.getElementById('ai-model-global').value.trim();
      for(const m of [modelFast,modelDeep,model]) if(!okModel(m)){ toast(`Invalid model name "${m}" — expected a claude-… id with no spaces`,'err'); return; }
      try{ await api('ai/config','PUT',{ modelFast, modelDeep, model }); toast('Model settings saved'); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!confirm('Remove the stored AI key? AI features will fall back to the built-in interpreter.')) return;
      try{ await api('ai/config','PUT',{ clear:true }); toast('AI key removed'); refreshAiCfg(); }catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-limits-save')?.addEventListener('click',async()=>{
      const num=id=>{ const v=document.getElementById(id).value.trim(); return v===''?undefined:Number(v); };
      const body={ rateLight:num('ai-rate-light'), rateDeep:num('ai-rate-deep'), dailyLimit:num('ai-daily'), maxChars:num('ai-maxchars'), maxContracts:num('ai-maxcontracts') };
      for(const [k,v] of Object.entries(body)) if(v!==undefined&&(!Number.isFinite(v)||v<0||Math.floor(v)!==v)){ toast(`"${k}" must be a whole number`,'err'); return; }
      try{ await api('ai/config','PUT',body); toast('AI limits saved'); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
  }
  document.getElementById('meta-backfill')?.addEventListener('click',()=>runMetaBackfill());
  document.getElementById('tm-add')?.addEventListener('click',async()=>{
    const name=fval('tm-name'), email=fval('tm-email').toLowerCase(), role=document.getElementById('tm-role').value;
    const pass=document.getElementById('tm-pass').value;
    if(!name||!email){ toast('Name and email are required','err'); return; }
    if(pass.length<8){ toast('Temporary password must be at least 8 characters','err'); return; }
    if(getUsers().some(x=>x.email===email)){ toast('A member with that email already exists','err'); return; }
    if(API_MODE()){
      try{ const r=await api('users','POST',{ name, email, role, password:pass });
        REMOTE.users=[...REMOTE.users, r.user];
      }catch(e){ toast(e.message,'err'); return; }
    } else {
      const salt=newSalt();
      saveUsers([...getUsers(),{ id:'u'+(Date.now().toString(36)), name, email, role, salt, hash:await hashPassword(pass,salt), createdAt:nowISO() }]);
    }
    toast(`${name} added as ${ROLE_LABEL[role]}${API_MODE()?' — an invite email was queued':' — share their temporary password securely'}`);
    renderTeam();
  });
  document.querySelectorAll('[data-role-for]').forEach(sel=>sel.addEventListener('change',async()=>{
    const us=getUsers(); const u=us.find(x=>x.id===sel.getAttribute('data-role-for'));
    if(!u) return;
    if(API_MODE()){
      try{ await api('users/'+u.id,'PATCH',{ role:sel.value }); u.role=sel.value; }
      catch(e){ toast(e.message,'err'); renderTeam(); return; }
    } else { u.role=sel.value; saveUsers(us); }
    toast(`${u.name} is now ${ROLE_LABEL[u.role]}`); renderTeam();
  }));
  document.querySelectorAll('[data-remove-user]').forEach(b=>b.addEventListener('click',async()=>{
    const us=getUsers(); const u=us.find(x=>x.id===b.getAttribute('data-remove-user'));
    if(!u || !confirm(`Remove ${u.name} from the workspace?`)) return;
    if(API_MODE()){
      try{ await api('users/'+u.id,'DELETE'); REMOTE.users=REMOTE.users.filter(x=>x.id!==u.id); }
      catch(e){ toast(e.message,'err'); return; }
    } else saveUsers(us.filter(x=>x.id!==u.id));
    toast(`${u.name} removed`); renderTeam();
  }));
  renderApprovalRules();
  document.getElementById('ar-add')?.addEventListener('click',()=>openApprovalRuleEditor(-1));
  document.getElementById('bk-export')?.addEventListener('click',()=>{
    downloadFile(`hati-backup-${new Date().toISOString().slice(0,10)}.json`,
      JSON.stringify({ kind:'hati-backup', v:1, exportedAt:nowISO(), org:getOrg(), users:getUsers(),
        data:{ uid, contracts:state.contracts } },null,2));
    toast('Backup downloaded');
  });
  document.getElementById('bk-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{ try{
        const b=JSON.parse(rd.result);
        if(b.kind!=='hati-backup'||!b.org||!b.users) throw new Error('bad');
        if(!confirm('Restoring replaces this workspace, its users and contracts with the backup. Continue?')) return;
        lsSet(LS.org,b.org); saveUsers(b.users); if(b.data) lsSet(LS.data,b.data);
        localStorage.removeItem(LS.session); location.reload();
      }catch(err){ toast('That file is not a valid HaTi backup','err'); } };
    rd.readAsText(f);
  });
  document.getElementById('bk-reset')?.addEventListener('click',()=>{
    if(confirm('This permanently erases the workspace, all users and contracts stored in this browser. Continue?')){
      Object.values(LS).forEach(k=>localStorage.removeItem(k)); location.reload();
    }
  });
  setActiveNav('team');
}

/* ---- E4 clause library editor + playbook viewer (Admin/Legal) ---- */
function saveClauseLibrary(lib){ state.settings=state.settings||{}; state.settings.clauseLibrary=lib; saveSettings(); }
function renderClauseLibrary(){
  const host=document.getElementById('clause-lib'); if(!host) return;
  const canEditLib=isAdmin()||currentUser()?.role==='legal';
  const lib=clauseLibrary();
  host.innerHTML=lib.map((cl,i)=>`
    <div class="rounded-lg border border-line bg-white p-3">
      <div class="flex items-center gap-2">
        <span class="text-[10px] font-mono uppercase tracking-wide text-ink/45">${cl.category}</span>
        <span class="text-[12.5px] font-600 text-ink">${cl.name}</span>
        ${canEditLib?`<span class="ml-auto flex gap-2 text-[11px] font-600">
          <button data-cl-edit="${i}" class="text-brand-600 hover:text-brand-800">edit</button>
          <button data-cl-del="${i}" class="text-rose-500 hover:text-rose-700">remove</button></span>`:''}
      </div>
      <div class="mt-1 text-[11px] text-ink/60"><b>Preferred:</b> ${(cl.preferred||'').slice(0,140).replace(/</g,'&lt;')}${(cl.preferred||'').length>140?'…':''}</div>
    </div>`).join('')||`<p class="text-[11px] text-ink/55">No clauses in the library.</p>`;
  host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>openClauseEditor(Number(b.getAttribute('data-cl-edit')))));
  host.querySelectorAll('[data-cl-del]').forEach(b=>b.addEventListener('click',()=>{ const i=Number(b.getAttribute('data-cl-del')); const lib2=clauseLibrary().slice(); lib2.splice(i,1); saveClauseLibrary(lib2); renderClauseLibrary(); toast('Clause removed'); }));
  document.getElementById('cl-add')?.addEventListener('click',()=>openClauseEditor(-1));
  // playbook viewer
  const pv=document.getElementById('playbook-view');
  if(pv){ const pb=playbook();
    pv.innerHTML=`<div class="text-[12px] font-600 text-ink mb-2">Playbook positions by contract type</div>`+
      Object.entries(pb).filter(([k])=>k!=='_default').map(([k,p])=>{ const rp=resolvePlaybook(k);
        return `<div class="mb-2 rounded-lg border border-line bg-white p-2.5">
          <div class="text-[11.5px] font-600 text-ink mb-1">${p.label||k}</div>
          <div class="flex flex-wrap gap-1">${rp.positions.map(pos=>`<span class="text-[9.5px] font-mono rounded px-1.5 py-0.5 ${pos.pos==='required'?'bg-rose-50 text-rose-600':pos.pos==='forbidden'?'bg-rose-50 text-rose-600':'bg-brand-50 text-brand-600'}">${pos.category}${pos.escalate?' ⚑':''}</span>`).join('')}
          ${rp.ranges.map(rg=>`<span class="text-[9.5px] font-mono rounded px-1.5 py-0.5 bg-gold-500/12 text-gold-600">${rg.label} ${rg.op} ${rg.value}</span>`).join('')}</div>
        </div>`; }).join('')+`<p class="text-[10px] text-ink/50 mt-1">⚑ = deviation requires Legal approval. The AI review checks incoming paper against these positions.</p>`;
  }
}
function openClauseEditor(idx){
  const lib=clauseLibrary().slice();
  const cl=idx>=0?{...lib[idx]}:{ id:'cl_'+Math.random().toString(36).slice(2,7), category:'', name:'', preferred:'', fallback:'', guidance:'' };
  const fld=(k,label,ta)=>ta
    ? `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${label}</span><textarea id="ce-${k}" rows="2" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${(cl[k]||'').replace(/</g,'&lt;')}</textarea></label>`
    : `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${label}</span><input id="ce-${k}" value="${(cl[k]||'').replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>`;
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?'Edit':'Add'} clause</h3>
    ${fld('category','Category')}${fld('name','Name')}${fld('preferred','Preferred wording',true)}${fld('fallback','Fallback wording',true)}${fld('guidance','Guidance',true)}
    <div class="flex justify-end gap-2 mt-2"><button id="ce-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
      <button id="ce-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save</button></div>
  </div>`);
  document.getElementById('ce-cancel').addEventListener('click',closeModal);
  document.getElementById('ce-save').addEventListener('click',()=>{
    ['category','name','preferred','fallback','guidance'].forEach(k=>cl[k]=document.getElementById('ce-'+k).value.trim());
    if(!cl.name||!cl.category){ toast('Category and name are required','err'); return; }
    if(idx>=0) lib[idx]=cl; else lib.push(cl);
    saveClauseLibrary(lib); closeModal(); renderClauseLibrary(); toast('Clause saved');
  });
}

/* ---- E5 approval rules builder (Admin) ---- */
const AR_CONDS=[['value','Value ≥ (KES)'],['folder','Value stream is'],['kind','Type contains'],['foreignLaw','Foreign governing law'],['deviation','Playbook deviation present']];
function condLabel(cond){
  switch(cond.type){
    case 'value': return `Value ${cond.op||'>='} ${fmtKESshort(cond.value)}`;
    case 'folder': return `Folder = ${(FOLDERS[cond.value]||{}).name||cond.value}`;
    case 'kind': return `Type contains “${cond.value}”`;
    case 'foreignLaw': return 'Foreign governing law';
    case 'deviation': return 'Playbook deviation present';
    default: return cond.type;
  }
}
function renderApprovalRules(){
  const host=document.getElementById('approval-rules'); if(!host) return;
  const rules=approvalRules().slice().sort((a,b)=>(a.order||99)-(b.order||99));
  host.innerHTML=rules.length?rules.map((r,i)=>`
    <div class="rounded-lg border border-line bg-white p-3 mb-2">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 grid place-items-center rounded-full bg-slate-100 text-[10px] font-700 text-ink/60">${r.order||1}</span>
        <span class="text-[12.5px] text-ink"><b>IF</b> ${condLabel(r.cond)} <b>THEN</b> ${approverLabelOf(r.approver)}</span>
        ${isAdmin()?`<span class="ml-auto flex gap-2 text-[11px] font-600"><button data-ar-edit="${i}" class="text-brand-600 hover:text-brand-800">edit</button><button data-ar-del="${i}" class="text-rose-500 hover:text-rose-700">remove</button></span>`:''}
      </div>
    </div>`).join(''):`<p class="text-[11px] text-ink/55">No approval rules — contracts can be signed without sign-off.</p>`;
  host.querySelectorAll('[data-ar-edit]').forEach(b=>b.addEventListener('click',()=>openApprovalRuleEditor(Number(b.getAttribute('data-ar-edit')))));
  host.querySelectorAll('[data-ar-del]').forEach(b=>b.addEventListener('click',()=>{ const rules2=approvalRules().slice(); rules2.splice(Number(b.getAttribute('data-ar-del')),1); saveApprovalRules(rules2); renderApprovalRules(); toast('Rule removed'); }));
}
function openApprovalRuleEditor(idx){
  const rules=approvalRules().slice();
  const r=idx>=0?JSON.parse(JSON.stringify(rules[idx])):{ id:'r_'+Math.random().toString(36).slice(2,7), order:rules.length+1, cond:{type:'value',op:'>=',value:5000000}, approver:{kind:'role',role:'admin'} };
  const members=(getUsers()||[]);
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?'Edit':'Add'} approval rule</h3>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">Order (lower approves first)</span>
      <input id="ar-order" type="number" min="1" value="${r.order||1}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">Condition</span>
      <select id="ar-cond" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${AR_CONDS.map(([k,l])=>`<option value="${k}" ${r.cond.type===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <div id="ar-condval" class="mb-2.5"></div>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">Approver</span>
      <select id="ar-approver" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">
        <option value="role:admin" ${r.approver.kind==='role'&&r.approver.role==='admin'?'selected':''}>Any Admin</option>
        <option value="role:legal" ${r.approver.kind==='role'&&r.approver.role==='legal'?'selected':''}>Any Legal (or Admin)</option>
        ${members.map(m=>`<option value="member:${m.name}" ${r.approver.kind==='member'&&r.approver.name===m.name?'selected':''}>${m.name} (${ROLE_LABEL[m.role]})</option>`).join('')}
      </select></label>
    <div class="flex justify-end gap-2 mt-2"><button id="ar-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
      <button id="ar-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save rule</button></div>
  </div>`);
  const renderCondVal=()=>{ const t=document.getElementById('ar-cond').value; const h=document.getElementById('ar-condval');
    if(t==='value') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">Threshold (KES)</span><input id="ar-cv" type="number" value="${r.cond.type==='value'?r.cond.value:5000000}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else if(t==='folder') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">Value stream</span><select id="ar-cv" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${Object.values(FOLDERS).map(f=>`<option value="${f.id}" ${r.cond.value===f.id?'selected':''}>${f.name}</option>`).join('')}</select></label>`;
    else if(t==='kind') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">Type contains</span><input id="ar-cv" value="${r.cond.type==='kind'?(r.cond.value||''):''}" placeholder="e.g. lease" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else h.innerHTML=`<p class="text-[11px] text-ink/55">No extra value needed for this condition.</p>`; };
  document.getElementById('ar-cond').addEventListener('change',renderCondVal); renderCondVal();
  document.getElementById('ar-cancel').addEventListener('click',closeModal);
  document.getElementById('ar-save').addEventListener('click',()=>{
    const t=document.getElementById('ar-cond').value; const cv=document.getElementById('ar-cv');
    const cond={type:t}; if(t==='value'){ cond.op='>='; cond.value=Number(cv.value||0); } else if(t==='folder'||t==='kind'){ cond.value=cv.value.trim?cv.value.trim():cv.value; }
    const ap=document.getElementById('ar-approver').value.split(':');
    r.order=Math.max(1,Number(document.getElementById('ar-order').value||1)); r.cond=cond;
    r.approver = ap[0]==='member'?{kind:'member',name:ap.slice(1).join(':')}:{kind:'role',role:ap[1]};
    r.name = condLabel(cond);
    if(idx>=0) rules[idx]=r; else rules.push(r);
    saveApprovalRules(rules); closeModal(); renderApprovalRules(); toast('Rule saved');
  });
}

/* ---- E8-T3 active sessions ---- */
async function loadSessions(){
  const host=document.getElementById('sessions-list'); if(!host) return;
  try{
    const r=await api('sessions'); const rows=r.sessions||[];
    host.innerHTML=rows.length?`<div class="space-y-1.5">${rows.map(s=>{
      const ua=(s.ua||'').replace(/</g,'&lt;'); const dev=/mobile/i.test(ua)?'Mobile':/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':'Browser';
      return `<div class="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2">
        <span class="min-w-0"><span class="text-[12px] font-600 text-ink">${dev}${s.current?' <span class="text-[9px] font-mono text-brand-600">· this device</span>':''}</span>
        <span class="block text-[10px] font-mono text-ink/50">${s.ip||'—'} · last seen ${s.lastSeen?fmtDT(s.lastSeen):'—'}</span></span>
        ${s.current?'':`<button data-sess-revoke="${s.id}" class="ml-auto text-[11px] font-600 text-rose-500 hover:text-rose-700">Revoke</button>`}
      </div>`; }).join('')}</div>`:`<p class="text-[11px] text-ink/55">No active sessions.</p>`;
    host.querySelectorAll('[data-sess-revoke]').forEach(b=>b.addEventListener('click',async()=>{
      try{ await api('sessions/'+b.getAttribute('data-sess-revoke'),'DELETE'); toast('Session revoked'); loadSessions(); }
      catch(e){ toast(e.message,'err'); }
    }));
  }catch(e){ host.innerHTML='<p class="text-[11px] text-ink/55">Could not load sessions.</p>'; }
}

Object.assign(window,{renderTeam,renderClauseLibrary,openClauseEditor,renderApprovalRules,openApprovalRuleEditor,condLabel,loadSessions});
