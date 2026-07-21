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
          <h2 class="font-display font-600 text-ink text-[17px]">Approval gate</h2></div>
        <p class="text-[13px] text-ink/70 mb-4 leading-relaxed">Contracts at or above this value need sign-off before they can be signed. Set the threshold to 0 to disable approvals.</p>
        ${(()=>{ const cfg=getApprovalCfg(); return `
        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block"><span class="text-[12px] font-600 text-ink/70">Approval threshold (KES)</span>
            <input id="ap-threshold" type="number" value="${cfg.threshold}" ${isAdmin()?'':'disabled'} class="mt-1.5 w-full rounded-xl border border-inputln bg-canvas px-3.5 py-2.5 text-sm tnum outline-none focus:border-brand-600 ${isAdmin()?'':'opacity-60'}"/></label>
          <label class="block"><span class="text-[12px] font-600 text-ink/70">Who can approve</span>
            <select id="ap-role" ${isAdmin()?'':'disabled'} class="mt-1.5 w-full rounded-xl border border-inputln bg-canvas px-3.5 py-2.5 text-sm outline-none focus:border-brand-600 ${isAdmin()?'':'opacity-60'}">
              <option value="admin" ${cfg.approverRole==='admin'?'selected':''}>Admins only</option>
              <option value="legal" ${cfg.approverRole==='legal'?'selected':''}>Admins &amp; Legal</option>
            </select></label>
        </div>
        ${isAdmin()?`<button id="ap-save" class="mt-4 rounded-xl bg-ink text-white px-4 py-2.5 text-sm font-600 hover:bg-brand-800 transition">Save approval policy</button>`
          :`<p class="mt-2 text-[11px] text-ink/65">Only an admin can change the approval policy. Current: ${cfg.threshold>0?`sign-off required at ≥ ${fmtKESshort(cfg.threshold)} by ${cfg.approverRole==='legal'?'admins & legal':'admins'}`:'approvals disabled'}.</p>`}`; })()}
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
          <label class="text-[11px] text-ink/60 flex items-center gap-1.5">Model
            <input id="ai-model" type="text" placeholder="claude-haiku-4-5-20251001" class="rounded-lg border border-inputln bg-white px-2.5 py-1.5 text-[11px] font-mono w-64 outline-none focus:border-brand-500"/></label>
          <button id="ai-key-clear" class="text-[11px] text-rose-500 hover:text-rose-700 font-medium">Remove key</button>
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
          ${(!API_MODE()&&isAdmin())?`
          <label class="flex items-center gap-1.5 rounded-lg border border-brand-200 text-brand-700 px-3.5 py-2 text-xs font-medium hover:bg-brand-50 transition cursor-pointer">${icon('upload','w-3.5 h-3.5')} Restore backup<input id="bk-import" type="file" accept=".json,application/json" class="hidden"/></label>
          <button id="bk-reset" class="ml-auto flex items-center gap-1.5 rounded-lg border border-rose-200 text-rose-600 px-3.5 py-2 text-xs font-medium hover:bg-rose-50 transition">${icon('ban','w-3.5 h-3.5')} Reset workspace</button>`:''}
        </div>
      </section>

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
  // AI engine config
  if(API_MODE()){
    const refreshAiCfg=async()=>{ const el=document.getElementById('ai-cfg-status'); if(!el) return;
      try{ const c=await api('ai/config'); state.aiConfigured=!!c.configured;
        el.innerHTML=c.configured?`<span class="text-brand-600">● Configured</span> · model <span class="font-mono">${c.model}</span> · key ${c.hint}${c.source==='env'?' (from server env)':''}`
          :`<span class="text-gold-600">● Not configured</span> — the graph uses the built-in interpreter.`;
        const mi=document.getElementById('ai-model'); if(mi&&!mi.value) mi.value=c.model||''; }catch(e){ el.textContent='Could not read AI config.'; } };
    refreshAiCfg();
    document.getElementById('ai-key-save')?.addEventListener('click',async()=>{
      const key=document.getElementById('ai-key').value.trim(), model=document.getElementById('ai-model').value.trim();
      if(!key&&!model){ toast('Enter a key to save','err'); return; }
      try{ await api('ai/config','PUT',{ key, model }); document.getElementById('ai-key').value=''; toast('AI engine key saved'); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!confirm('Remove the stored AI key? The graph will fall back to the built-in interpreter.')) return;
      try{ await api('ai/config','PUT',{ clear:true }); toast('AI key removed'); refreshAiCfg(); }catch(e){ toast(e.message,'err'); }
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
  document.getElementById('ap-save')?.addEventListener('click',()=>{
    const threshold=Math.max(0, Number(document.getElementById('ap-threshold').value||0));
    const approverRole=document.getElementById('ap-role').value;
    state.settings=state.settings||{};
    state.settings.approval={ threshold, approverRole };
    saveSettings();
    toast(threshold>0?`Approval required at ≥ ${fmtKESshort(threshold)}`:'Approvals disabled');
  });
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

Object.assign(window,{renderTeam,renderClauseLibrary,openClauseEditor});
