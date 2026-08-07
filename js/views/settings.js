// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   VIEW: TEAM & SETTINGS
   ============================================================ */
/* Parse an imported directory CSV into [{name,email,title}].
   Detects a header row (Name/Email/Title in any order); without one it assumes
   the columns are Name, Email, Title. Handles quoted fields and doubled quotes. */
function parseDirectoryCsv(text){
  const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n').filter(l=>l.trim()!=='');
  if(!lines.length) return [];
  const parseLine=l=>{ const out=[]; let cur='',q=false;
    for(let i=0;i<l.length;i++){ const ch=l[i];
      if(q){ if(ch==='"'){ if(l[i+1]==='"'){ cur+='"'; i++; } else q=false; } else cur+=ch; }
      else { if(ch==='"') q=true; else if(ch===','){ out.push(cur); cur=''; } else cur+=ch; } }
    out.push(cur); return out.map(s=>s.trim()); };
  const rows=lines.map(parseLine);
  const head=rows[0].map(h=>h.toLowerCase());
  let ni=0, ei=1, ti=2, dataStart=0;
  if(head.some(h=>/name|email|mail|title/.test(h))){
    ni=head.findIndex(h=>h.includes('name'));
    ei=head.findIndex(h=>h.includes('mail'));
    ti=head.findIndex(h=>h.includes('title'));
    dataStart=1;
  }
  const out=[];
  for(let i=dataStart;i<rows.length;i++){ const r=rows[i];
    const name=ni>=0?(r[ni]||''):'', email=ei>=0?(r[ei]||''):'', title=ti>=0?(r[ti]||''):'';
    if(!name && !email) continue;
    out.push({ name, email:email.toLowerCase(), title });
  }
  return out;
}
/* Admin-only editor: grant a member every stream, or a specific subset. Stored
   in state.settings.folderAccess and persisted through saveSettings() (both modes). */
function openFolderAccessEditor(userId){
  const u=getUsers().find(x=>x.id===userId); if(!u) return;
  const cur=(((state.settings||{}).folderAccess)||{})[userId];
  const isAll=(cur==null||cur==='*'||(Array.isArray(cur)&&!cur.length));
  const set=new Set(Array.isArray(cur)?cur:[]);
  const folders=Object.values(FOLDERS);
  const fRow=f=>`<label style="display:flex;align-items:center;gap:9px;padding:7px 9px;border:1px solid var(--color-divider);border-radius:6px;cursor:pointer;font-size:12.5px">
      <input type="checkbox" data-fa-folder="${f.id}" ${set.has(f.id)?'checked':''} style="width:15px;height:15px;accent-color:var(--color-accent);flex:none"/>
      <span style="width:9px;height:9px;border-radius:2px;background:${f.color};flex:none"></span>
      <span style="flex:1;min-width:0">${esc(f.name)}</span></label>`;
  openModal(`<div class="p-6" style="max-width:460px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('set_folder_access_for',{who:(u.name||u.email).replace(/</g,'&lt;')})}</h3>
    <p class="text-xs text-ink/60 mb-3">${i18t('set_grant_streams')}</p>
    <label style="display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--color-divider);border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;margin-bottom:10px">
      <input type="checkbox" id="fa-all" ${isAll?'checked':''} style="width:16px;height:16px;accent-color:var(--color-accent)"/> ${i18t('set_all_streams')}</label>
    <div id="fa-list" style="display:${isAll?'none':'grid'};grid-template-columns:1fr;gap:6px;max-height:300px;overflow:auto;margin-bottom:14px">${folders.map(fRow).join('')}</div>
    <div class="flex justify-end gap-2">
      <button id="fa-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="fa-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('set_save_access')}</button></div>
  </div>`);
  const allBox=document.getElementById('fa-all'), list=document.getElementById('fa-list');
  allBox.addEventListener('change',()=>{ list.style.display=allBox.checked?'none':'grid'; });
  document.getElementById('fa-cancel').addEventListener('click',closeModal);
  document.getElementById('fa-save').addEventListener('click',async()=>{
    state.settings=state.settings||{}; state.settings.folderAccess=state.settings.folderAccess||{};
    let folders;
    if(allBox.checked){ folders=null; delete state.settings.folderAccess[userId]; }
    else {
      const ids=[...document.querySelectorAll('[data-fa-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-fa-folder'));
      if(!ids.length){ toast(i18t('set_pick_one_stream'),'err'); return; }
      folders=ids; state.settings.folderAccess[userId]=ids;
    }
    /* H-3: write folder access through its own atomic endpoint, not the whole
       settings blob. This is the security-relevant map, and routing it through
       the general settings save is what let a concurrent, unrelated settings
       change silently revert a restriction. In server mode the dedicated route
       read-modify-writes just this key; static mode has no concurrency, so the
       blob save is fine there. */
    try{
      if(window.API_MODE && window.API_MODE()) await api('settings/folder-access','PUT',{ userId, folders });
      else await saveSettings();
    }catch(e){ toast(i18t('set_could_not_save_access')+e.message,'err'); return; }
    closeModal(); toast(i18t('set_t_access_updated',{who:u.name||u.email})); renderTeam();
  });
}
/* ---- onboarding allowance panel (Team & Settings) ----
   Shows the burn-down in the same shape the Migration screen shows it, so an
   admin and the person running the batch are reading the same numbers. */
function renderAllowancePanel(a){
  const host=document.getElementById('ai-allowance-state'); if(!host) return;
  const money=n=>'$'+Number(n||0).toFixed(2);
  if(!a || !a.open){
    host.innerHTML=`<span style="color:var(--color-neutral-600)">${i18t('set_no_allowance')}</span>`;
    return;
  }
  const moneyPct=a.budget>0?Math.min(100,Math.round(a.spent/a.budget*100)):0;
  const docsPct=a.docs>0?Math.min(100,Math.round(a.docsUsed/a.docs*100)):0;
  const pct=Math.max(moneyPct,docsPct);
  const bar=`<div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden;margin-top:5px">
    <div style="width:${pct}%;height:100%;background:${a.exhausted?'var(--st-ruby-fg)':pct>=80?'var(--st-amber-dot)':'var(--st-green-dot)'};transition:width .3s"></div></div>`;
  host.innerHTML=`<div>
    <span style="font-weight:600;color:${a.exhausted?'var(--st-ruby-fg)':'var(--st-green-fg)'}">${a.exhausted?'Used up':'Open'}</span>
    ${a.budget>0?` · <b>${money(a.spent)}</b> of <b>${money(a.budget)}</b>`:' · no money cap'}
    ${a.docs>0?` · <b>${a.docsUsed}</b> of <b>${a.docs}</b> documents`:''}
    ${a.openedBy?`<span style="color:var(--color-neutral-500)"> · opened by ${PB_ESC(a.openedBy)}</span>`:''}
    ${bar}
  </div>`;
  // pre-fill the top-up boxes with the current caps
  const fill=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&!n.value) n.value=v; };
  fill('ai-allow-budget',a.budget||''); fill('ai-allow-docs',a.docs||'');
}

/* ---- editable per-model rate table ---- */
function renderRateTable(rates, meta){
  const host=document.getElementById('ai-rates-table'); if(!host) return;
  const models=Object.keys(rates||{}).sort((a,b)=>a==='default'?1:b==='default'?-1:a.localeCompare(b));
  const inp='width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:3px 6px;font:inherit;font-family:var(--font-mono);font-size:11px;text-align:right;outline:none';
  host.innerHTML=models.map(m=>`
    <div data-rate-model="${PB_ATTR(m)}" style="display:flex;align-items:center;gap:8px;padding:3px 2px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent)">
      <span style="flex:1;min-width:0;font-size:11px;font-family:var(--font-mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis${m==='default'?';color:var(--color-neutral-500);font-style:italic':''}">${PB_ESC(m)}</span>
      <label style="font-size:9.5px;color:var(--color-neutral-500)">${i18t('set_rate_in')} <input data-rate="in" type="number" min="0" step="0.01" value="${Number(rates[m].in)}" style="${inp}"/></label>
      <label style="font-size:9.5px;color:var(--color-neutral-500)">${i18t('set_rate_out')} <input data-rate="out" type="number" min="0" step="0.01" value="${Number(rates[m].out)}" style="${inp}"/></label>
    </div>`).join('');
  const metaEl=document.getElementById('ai-rates-meta');
  if(metaEl) metaEl.textContent = meta && meta.verifiedOn
    ? (meta.edited ? `edited by an admin · shipped prices verified ${meta.verifiedOn}` : `verified ${meta.verifiedOn}`)
    : '';
}

function renderTeam(){
  const me=currentUser();

  // --- Industry token style fragments (inline, per design handoff) ---
  const cardStyle='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:10px;padding:16px';
  const h4Style='font-family:var(--font-mono);font-weight:600;font-size:14px;margin:0 0 6px;color:var(--color-text)';
  const inputStyle='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:6px 9px;font:inherit;font-size:12.5px;color:inherit;outline:none';
  const inputMono='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:5px 8px;font-family:var(--font-mono);font-size:11px;color:inherit;outline:none';
  const primaryBtn='font-family:var(--font-mono);font-weight:600;font-size:12.5px;padding:6px 14px;background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:5px;cursor:pointer;white-space:nowrap';
  const primaryBtnSm='font-family:var(--font-mono);font-weight:600;font-size:12px;padding:5px 12px;background:var(--color-accent);color:#fff;border:1px solid var(--color-accent);border-radius:5px;cursor:pointer';
  const secondaryBtn='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:600;font-size:12px;padding:5px 11px;background:var(--color-surface);color:var(--color-accent-800);border:1px solid var(--color-divider);border-radius:5px;cursor:pointer';
  const dangerBtn='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:600;font-size:12px;padding:5px 11px;background:var(--color-surface);color:var(--st-ruby-dot);border:1px solid var(--st-ruby-line);border-radius:5px;cursor:pointer';
  const tagAccent='display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:999px;background:var(--color-accent-200);color:var(--color-accent-800)';
  const avStyle='width:24px;height:24px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:9px;font-weight:700;flex:none;font-family:var(--font-mono)';
  const roleTag=r=>{ const map={admin:['var(--st-steel-bg)','var(--st-steel-fg)'],legal:['var(--st-amber-bg)','var(--st-amber-fg)'],viewer:['var(--st-gray-bg)','var(--st-gray-fg)']};
    const [bg,fg]=map[r]||map.viewer;
    return `display:inline-flex;align-items:center;font-size:10px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:999px;background:${bg};color:${fg}`; };

  const users=getUsers();
  const totalStreams=Object.keys(FOLDERS).length;
  /* RETURNS A SHAPE, NOT A SENTENCE. The row below used to decide whether a
     member was restricted by comparing this function's output to the words
     "All streams" — which stops being true the moment those words can be
     translated, and stops silently: every member would read as unrestricted on
     a Swedish screen and the amber warning colour would simply never appear.
     The caller now asks `.all`, and the words are only ever displayed. */
  const accessSummary=x=>{
    if(x.role==='admin') return { all:true, get text(){ return i18t('set_all_streams_short'); } };
    const v=(((state.settings||{}).folderAccess)||{})[x.id];
    if(v==null||v==='*'||(Array.isArray(v)&&!v.length))
      return { all:true, get text(){ return i18t('set_all_streams_short'); } };
    return { all:false, get text(){ return i18t('set_streams_of',{n:v.length,total:totalStreams}); } };
  };
  // Value visibility is a server-side right (users.can_view_values); admins
  // always have it, and a member created before the permission existed defaults
  // to having it, so this deploy changes nothing until an admin turns it off.
  const valuesOn=x=>x.role==='admin'||x.canViewValues!==false;
  const rows=users.map(x=>{
    const ini=x.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const isMe=x.id===me.id;
    const canManage=isAdmin()&&!isMe;
    const restricted=x.role!=='admin' && !accessSummary(x).all;
    return `<tr style="border-bottom:1px solid var(--color-divider)">
      <td style="padding:8px 10px 8px 14px">
        <span style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="${avStyle}">${ini}</span>
          <span style="min-width:0">
            <span style="display:block;font-weight:500;color:var(--color-text)">${esc(x.name)}${isMe?` <span style="font-weight:400;color:var(--color-neutral-500);font-size:11px">${i18t('set_you')}</span>`:''}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(x.email)}</span>
            <span style="display:block;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${x.title?'var(--color-neutral-700)':'var(--st-amber-fg)'}">
              ${x.title?esc(x.title):i18t('set_no_job_title')}
              ${(isAdmin()||isMe)?`<button data-title-for="${x.id}" title="${esc(i18t('set_capacity_hint'))}" style="margin-left:6px;font-size:10.5px;font-weight:600;color:var(--color-accent-800);background:none;border:0;cursor:pointer">${x.title?i18t('act_edit'):i18t('set_add')}</button>`:''}
            </span>
          </span>
        </span>
      </td>
      <td style="padding:8px 10px"><span style="${roleTag(x.role)}">${roleName(x.role)}</span></td>
      <td style="padding:8px 10px;white-space:nowrap">
        <span style="font-size:11.5px;color:${restricted?'var(--st-amber-fg)':'var(--color-neutral-700)'}">${accessSummary(x).text}</span>
        ${(isAdmin()&&x.role!=='admin')?`<button data-access-for="${x.id}" title="${esc(i18t('set_edit_folder_access'))}" style="margin-left:6px;font-size:10.5px;font-weight:600;color:var(--color-accent-800);background:none;border:0;cursor:pointer">${i18t('act_edit')}</button>`:''}
        <span style="display:block;font-size:10.5px;color:${valuesOn(x)?'var(--color-neutral-600)':'var(--st-amber-fg)'};margin-top:2px">
          ${valuesOn(x)?i18t('set_sees_values'):i18t('set_values_hidden')}
          ${(isAdmin()&&x.role!=='admin'&&!isMe&&API_MODE())?`<button data-values-for="${x.id}" data-values-to="${valuesOn(x)?'0':'1'}" title="${esc(valuesOn(x)?i18t('set_hide_values'):i18t('set_show_values'))}" style="margin-left:6px;font-size:10.5px;font-weight:600;color:var(--color-accent-800);background:none;border:0;cursor:pointer">${valuesOn(x)?i18t('set_hide'):i18t('set_show')}</button>`:''}
        </span>
      </td>
      <td style="padding:8px 10px;font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap">${x.status==='invited'?i18t('set_invited'):i18t('set_active')}</td>
      <td style="padding:8px 14px 8px 10px;text-align:right;white-space:nowrap">
        ${canManage?`<select data-role-for="${x.id}" title="${esc(i18t('set_change_role'))}" style="font-size:11px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:3px 6px;color:inherit;font-family:inherit;outline:none">
            ${['admin','legal','viewer'].map(r=>`<option value="${r}" ${x.role===r?'selected':''}>${roleName(r)}</option>`).join('')}
          </select>
          <button data-remove-user="${x.id}" style="margin-left:8px;font-size:11px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer">${i18t('act_remove')}</button>`
        :`<span style="color:var(--color-neutral-400)">—</span>`}
      </td>
    </tr>`;
  }).join('');

  const limitField=(id,label,sub,min)=>`<label style="display:block">
      <span style="display:block;font-size:10px;color:var(--color-neutral-600);line-height:1.4">${label}<br><span style="color:var(--color-neutral-400)">${sub}</span></span>
      <input id="${id}" type="number" min="${min}" style="margin-top:3px;${inputMono}"/></label>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px">
    <div class="tm-cols" style="display:grid;gap:18px;align-items:start">

      <!-- ============ LEFT · MEMBERS (blueprint) ============ -->
      <section class="blueprint" style="background:var(--color-surface);box-shadow:var(--shadow-sm);border-radius:10px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
          <h4 style="margin:0;font-family:var(--font-heading);font-weight:600;font-size:15px;color:var(--color-text)">${i18t('set_members_count',{n:users.length})}</h4>
          ${isAdmin()?`<button id="tm-invite" style="font-family:var(--font-mono);font-weight:600;font-size:12px;padding:4px 10px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;cursor:pointer;color:var(--color-accent-800)">${i18t('set_invite_member')}</button>`:''}
        </div>
        <div class="table-scroll">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px">
            <thead>
              <tr style="text-align:left;border-bottom:1px solid var(--color-divider);color:var(--color-neutral-600);font-size:10px;letter-spacing:.08em;text-transform:uppercase">
                <th style="padding:8px 10px 8px 14px;font-weight:600">${i18t('set_member')}</th>
                <th style="padding:8px 10px;font-weight:600">${i18t('set_role')}</th>
                <th style="padding:8px 10px;font-weight:600">${i18t('set_folder_access')}</th>
                <th style="padding:8px 10px;font-weight:600">${i18t('reg_col_status')}</th>
                <th style="padding:8px 14px 8px 10px;font-weight:600;text-align:right">${i18t('set_manage')}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${isAdmin()?`
        <div style="padding:12px 14px;border-top:1px solid var(--color-divider);background:var(--color-bg)">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:11px;color:var(--color-neutral-700);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${i18t('set_add_team_member')}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input id="tm-name" type="text" placeholder="${esc(i18t('set_ph_full_name'))}" style="${inputStyle}"/>
            <input id="tm-email" type="email" placeholder="${esc(i18t('set_ph_work_email'))}" style="${inputStyle}"/>
            <input id="tm-title" type="text" placeholder="${esc(i18t('set_ph_title'))}" style="${inputStyle}"/>
            <select id="tm-role" style="${inputStyle}">
              <option value="legal">${i18t('set_role_legal')}</option>
              <option value="viewer">${i18t('set_role_viewer')}</option>
              <option value="admin">${i18t('set_role_admin')}</option>
            </select>
            <input id="tm-pass" type="password" placeholder="${esc(i18t('set_ph_temp_pass'))}" style="${inputStyle}"/>
            ${''/* ACCESS IS PART OF ADDING SOMEBODY, NOT A LATER ERRAND. The form
                   used to create a member with no answer to "what may they see",
                   and the absent answer means EVERY stream — so the quietest
                   possible path through this form was also the widest grant. The
                   placeholder option carries no value, so the add button refuses
                   until an admin has actually chosen. */}
            <select id="tm-access" style="${inputStyle}">
              <option value="">${i18t('set_choose_access')}</option>
              <option value="*">${i18t('set_access_all')}</option>
              <option value="pick">${i18t('set_access_pick')}</option>
            </select>
          </div>
          <div id="tm-access-list" style="display:none;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:6px;margin-top:8px">
            ${Object.values(FOLDERS).map(f=>`<label style="display:flex;align-items:center;gap:7px;padding:6px 8px;border:1px solid var(--color-divider);border-radius:6px;cursor:pointer;font-size:11.5px">
              <input type="checkbox" data-tm-folder="${PB_ATTR(f.id)}" style="width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
              <span style="width:8px;height:8px;border-radius:2px;background:${f.color};flex:none"></span>
              <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.name)}</span></label>`).join('')}
          </div>
          <div id="tm-access-note" style="display:none;margin-top:6px;font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">${i18t('set_access_admin_note')}</div>
          <div style="margin-top:8px;font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">${i18t('set_role_help')}</div>
          <button id="tm-add" style="margin-top:10px;${primaryBtn}">${i18t('set_add_member')}</button>
        </div>
        <div style="padding:12px 14px;border-top:1px solid var(--color-divider)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <div style="font-family:var(--font-mono);font-weight:600;font-size:11px;color:var(--color-neutral-700);text-transform:uppercase;letter-spacing:.06em">${i18tn('set_directory',(((state.settings||{}).directory)||[]).length,{n:(((state.settings||{}).directory)||[]).length})}</div>
            <label style="${secondaryBtn}">${icon('upload','w-3.5 h-3.5')} ${i18t('set_import_csv')}<input id="dir-import" type="file" accept=".csv,text/csv" style="display:none"/></label>
          </div>
          <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">${i18t('set_bulk_signers')} <b>${i18t('set_csv_columns')}</b>.${(((state.settings||{}).directory)||[]).length?` · <button id="dir-clear" style="color:var(--st-ruby-dot);background:none;border:0;cursor:pointer;font-weight:600;font-size:10.5px">${i18t('set_clear_directory')}</button>`:''}</div>
        </div>`:''}
      </section>

      <!-- ============ RIGHT · SETTINGS STACK ============ -->
      <div style="display:flex;flex-direction:column;gap:18px">

        <section style="${cardStyle}">
          <h4 style="${h4Style}">${i18t('set_approval_rules')}</h4>
          <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_rules_sub')}</p>
          <div id="approval-rules"></div>
          ${isAdmin()?`<button id="ar-add" style="margin-top:8px;${secondaryBtn}">${icon('plus','w-3.5 h-3.5')} ${i18t('set_add_rule_btn')}</button>`
            :`<p style="margin-top:6px;font-size:11px;color:var(--color-neutral-600)">${i18t('set_only_admin_approval')}</p>`}
        </section>

        <section style="${cardStyle}">
          <h4 style="${h4Style}">${i18t('set_renewal_reminders')}</h4>
          <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5">${i18t('set_renewal_sub')}</p>
          <div style="display:flex;gap:6px">
            ${[90,60,30].map(d=>`<span style="${tagAccent}">${i18t('set_days_out',{n:d})}</span>`).join('')}
          </div>
          <p style="font-size:10.5px;color:var(--color-neutral-600);margin:8px 0 0">${i18t('set_delivered_resend')}</p>
        </section>

        <section style="${cardStyle}">
          <h4 style="${h4Style}">${i18t('set_copilot_engine')}</h4>
          <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5">${i18t('set_engine_sub')}</p>
          <div id="ai-cfg-status" style="font-size:11px;color:var(--color-neutral-700);margin-bottom:8px">${i18t('set_checking')}</div>
          ${isAdmin()?`
          <div style="display:flex;gap:8px;align-items:flex-end">
            <label style="flex:1;min-width:0"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:4px">${i18t('set_api_key')}</span>
              <input id="ai-key" type="password" placeholder="sk-ant-…" style="${inputStyle}"/></label>
            <button id="ai-key-save" style="${primaryBtn}">${i18t('set_save_key')}</button>
          </div>
          <button id="ai-key-clear" style="margin-top:6px;font-size:11px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer;padding:0">${i18t('set_remove_key')}</button>
          ${API_MODE()?`
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_model_routing')}</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 8px">${i18t('set_override_blank')}</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
              <div style="border:1px solid var(--color-divider);border-radius:4px;padding:8px">
                <div style="font-size:11px;font-weight:600;color:var(--color-text)">${i18t('set_fast_tier')}</div>
                <div style="font-size:10px;color:var(--color-neutral-500);margin:2px 0 4px">${i18t('set_fast_sub')}</div>
                <div style="font-size:10px;color:var(--color-neutral-700);margin-bottom:4px">${i18t('set_current')} <span id="ai-model-fast-cur" style="font-family:var(--font-mono)">—</span></div>
                <input id="ai-model-fast" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${inputMono}"/>
              </div>
              <div style="border:1px solid var(--color-divider);border-radius:4px;padding:8px">
                <div style="font-size:11px;font-weight:600;color:var(--color-text)">${i18t('set_deep_tier')}</div>
                <div style="font-size:10px;color:var(--color-neutral-500);margin:2px 0 4px">${i18t('set_deep_sub')}</div>
                <div style="font-size:10px;color:var(--color-neutral-700);margin-bottom:4px">${i18t('set_current')} <span id="ai-model-deep-cur" style="font-family:var(--font-mono)">—</span></div>
                <input id="ai-model-deep" type="text" placeholder="${esc(i18t('set_ph_default_rec'))}" style="${inputMono}"/>
              </div>
            </div>
            <details style="font-size:11px;margin-top:8px">
              <summary style="cursor:pointer;color:var(--color-neutral-600)">${i18t('set_advanced_override')}</summary>
              <div style="margin-top:6px;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
                <input id="ai-model-global" type="text" placeholder="${esc(i18t('set_ph_none'))}" style="${inputMono};width:220px"/>
                <span style="font-size:10px;color:var(--color-neutral-500)">${i18t('set_forces_one_model')}</span>
              </div>
            </details>
            <button id="ai-model-save" style="margin-top:8px;${primaryBtnSm}">${i18t('set_save_model')}</button>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_spend_controls')}</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 6px;line-height:1.5">${i18t('set_spend_governed')} ${i18t('set_spend_money')}</p>
            <div id="ai-usage" style="font-size:11.5px;color:var(--color-neutral-700);margin-bottom:4px">${i18t('set_today_dash')}</div>
            <div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden;margin-bottom:8px"><div id="ai-usage-bar" style="width:0%;height:100%;background:var(--color-accent);transition:width .3s"></div></div>
            <div id="ai-spend-breakdown" style="margin-bottom:10px"></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
              ${limitField('ai-daily-spend',i18t('set_lim_daily_spend'),i18t('set_lim_daily_spend_sub'),0)}
              ${limitField('ai-estimate-confirm',i18t('set_lim_confirm'),i18t('set_lim_confirm_sub'),0)}
              ${limitField('ai-rate-light',i18t('set_lim_light'),i18t('set_lim_light_sub'),1)}
              ${limitField('ai-rate-deep',i18t('set_lim_deep'),i18t('set_lim_deep_sub'),1)}
              ${limitField('ai-rate-ocr',i18t('set_lim_ocr'),i18t('set_lim_ocr_sub'),1)}
              ${limitField('ai-daily',i18t('set_lim_daily_req'),i18t('set_lim_daily_req_sub'),0)}
              ${limitField('ai-ocr-pages',i18t('set_lim_ocr_pages'),i18t('set_lim_ocr_pages_sub'),1)}
              ${limitField('ai-maxchars',i18t('set_lim_chars'),i18t('set_lim_chars_sub'),1000)}
              ${limitField('ai-maxcontracts',i18t('set_lim_contracts'),i18t('set_lim_contracts_sub'),1)}
            </div>
            <label style="display:flex;align-items:flex-start;gap:8px;margin-top:9px;font-size:11px;color:var(--color-neutral-700);line-height:1.45;cursor:pointer">
              <input id="ai-thorough" type="checkbox" style="margin-top:2px;width:14px;height:14px;accent-color:var(--color-accent);flex:none"/>
              <span><b>${i18t('set_thorough_extraction')}</b> ${i18t('set_thorough_body')}
              <span style="color:var(--st-amber-fg)">${i18t('set_thorough_warn')}</span> ${i18t('set_preflight')}</span></label>
            <button id="ai-limits-save" style="margin-top:9px;${primaryBtnSm}">${i18t('set_save_limits')}</button>
          </div>

          <!-- ---- onboarding allowance ---- -->
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_onboarding_allowance')}</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 8px;line-height:1.5">${i18t('set_allowance_sub')}</p>
            <div id="ai-allowance-state" style="font-size:11.5px;color:var(--color-neutral-700);margin-bottom:6px">—</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
              ${limitField('ai-allow-budget',i18t('set_lim_allow_budget'),i18t('set_lim_allow_budget_sub'),0)}
              ${limitField('ai-allow-docs',i18t('set_lim_allow_docs'),i18t('set_lim_allow_docs_sub'),0)}
            </div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button id="ai-allow-open" style="${primaryBtnSm}">${i18t('set_open_allowance')}</button>
              <button id="ai-allow-topup" style="${secondaryBtn};font-size:11.5px;padding:5px 10px">${i18t('set_top_up')}</button>
              <button id="ai-allow-close" style="${secondaryBtn};font-size:11.5px;padding:5px 10px">${i18t('act_close')}</button>
            </div>
          </div>

          <!-- ---- model rate table ---- -->
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
              <div style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_rate_table')}</div>
              <span id="ai-rates-meta" style="font-size:10px;color:var(--color-neutral-500)"></span>
            </div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 8px;line-height:1.5">${i18t('set_usd_per')} ${i18t('set_per_million')}</p>
            <div id="ai-rates-table" style="max-height:220px;overflow-y:auto" class="scroll-thin"></div>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
              <button id="ai-rates-save" style="${primaryBtnSm}">${i18t('set_save_rates')}</button>
              <button id="ai-rates-reset" style="${secondaryBtn};font-size:11.5px;padding:5px 10px">${i18t('set_reset_defaults')}</button>
            </div>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:2px">${i18t('set_file_existing')}</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5">${i18t('set_file_existing_sub')}</p>
            <button id="meta-backfill" style="${secondaryBtn}">${icon('sparkle','w-3.5 h-3.5')} <span id="meta-backfill-lbl">${i18t('set_extract_metadata')}</span></button>
          </div>`:`
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider);font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">${i18t('set_local_mode_note')}</div>`}`
          :`<p style="font-size:11px;color:var(--color-neutral-600)">${i18t('set_only_admin_key')}</p>`}
        </section>

      ${''/* WHERE THE WORKSPACE OPERATES. This lived only in the top bar, as a
             pair of flag buttons beside the search box — a workspace-level,
             admin-only setting sitting in the one strip a person's eye crosses
             a hundred times a day, while the setting they actually change
             often (their language) had nowhere to go. The market moved here,
             which is also where the server already puts the authority:
             PUT /api/org/jurisdiction is admin-gated. */}
      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_market')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_market_sub')}</p>
        ${isAdmin()?`
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <select id="set-market" style="min-width:190px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:7px 10px;font:inherit;font-size:13px;color:inherit;outline:none">
            ${jxList().map(p=>`<option value="${p.id}"${p.id===jxId()?' selected':''}>${esc(p.name)}</option>`).join('')}
          </select>
          <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.6">
            <div>${i18t('set_market_currency')}: <b>${jxCurrency()}</b> · ${i18t('set_market_law')}: <b>${esc(jxLaw())}</b></div>
            <div>${i18t('set_market_esig')}: ${esc(jxEsignatureShort())}</div>
          </div>
        </div>`
        :`<p style="font-size:11px;color:var(--color-neutral-600)">${i18t('set_market_admin_only')}</p>`}
      </section>

      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_company_design')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_design_sub')}</p>
        ${(()=>{ const ob=window.ORG_BRANDING; const d=ob&&ob.designId&&window.docDesignById?docDesignById(ob.designId):null;
          const canDesign=(currentUser()||{}).role==='admin'||(currentUser()||{}).role==='legal';
          return `
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="width:74px;height:42px;border:1px dashed var(--color-divider);border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
            ${ob&&ob.logoUrl?`<img src="${ob.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">`:`<span style="font-size:9px;color:var(--color-neutral-500)">${i18t('set_no_logo')}</span>`}
          </div>
          <div style="flex:1;min-width:150px">
            ${d?`<div style="font-size:12.5px;font-weight:700">${esc(d.name)}${(()=>{ const st=ob.structureId&&window.docStructureById?docStructureById(ob.structureId):null;
              return st&&st.id!==DEFAULT_STRUCTURE?` <span style="font-weight:500;color:var(--color-neutral-600)">· ${esc(st.name)}</span>`:''; })()}</div>
            <div style="font-size:10.5px;color:var(--color-neutral-600)">${i18t('set_logo_pos',{pos:esc({'top-left':i18t('set_pos_top_left'),'top-center':i18t('set_pos_top_center'),'top-right':i18t('set_pos_top_right'),footer:i18t('set_pos_footer')}[ob.logoPosition]||ob.logoPosition||'—')})}${d.usesAccent&&ob.accentColor?` · ${i18t('set_accent')} <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${ob.accentColor};vertical-align:-1px;border:1px solid var(--color-divider)"></span>`:''}</div>`
            :`<div style="font-size:12px;color:var(--color-neutral-600)">${i18t('set_no_design')}</div>`}
          </div>
          ${canDesign?`<button id="brand-edit" style="${secondaryBtn}">${d?i18t('set_edit_design'):i18t('set_choose_design')}</button>`
            :`<span style="font-size:10.5px;color:var(--color-neutral-600)">${i18t('set_admin_legal_change')}</span>`}
        </div>`;})()}
      </section>

      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_data_backup')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${API_MODE()?i18t('set_backup_server'):i18t('set_backup_local')}</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button id="bk-export" style="${secondaryBtn}">${icon('download','w-3.5 h-3.5')} ${i18t('set_export_backup')}</button>
          ${(API_MODE()&&isAdmin())?`<a id="bk-zip" href="api/export/workspace.zip" style="${secondaryBtn};text-decoration:none">${icon('download','w-3.5 h-3.5')} ${i18t('set_full_workspace_zip')}</a>`:''}
          ${(!API_MODE()&&isAdmin())?`
          <label style="${secondaryBtn};cursor:pointer">${icon('upload','w-3.5 h-3.5')} ${i18t('set_restore_backup')}<input id="bk-import" type="file" accept=".json,application/json" style="display:none"/></label>
          <button id="bk-reset" style="margin-left:auto;${dangerBtn}">${icon('ban','w-3.5 h-3.5')} ${i18t('set_reset_workspace')}</button>`:''}
        </div>
      </section>

      ${(API_MODE())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_active_sessions')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_sessions_sub')}</p>
        <div id="sessions-list" style="font-size:12px;color:var(--color-neutral-700)">${i18t('set_loading')}</div>
      </section>`:''}

      ${(API_MODE())?`
      <section style="${cardStyle}">
        ${''/* THE FIRST-OPEN TOGGLE IS GONE, with the email it switched on.
               A settings page that still offered the checkbox would be
               offering a switch wired to nothing. What replaces it is the
               answer to the question somebody comes to this page with — "will
               HaTi email me about this contract?" — stated once, plainly. */}
        <h4 style="${h4Style}">${i18t('set_my_notifications')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_notif_sub')}</p>
        <div style="border:1px solid var(--color-divider);border-radius:5px;padding:10px;font-size:12px;line-height:1.5;color:var(--color-neutral-700)">
          <span style="font-weight:600;display:block;color:var(--color-text)">${i18t('set_still_emailed')}</span>
          ${i18t('set_three_events')}
        </div>
      </section>`:''}

      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_my_sidebar')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_sidebar_sub')}</p>
        <label style="display:flex;align-items:flex-start;gap:10px;border:1px solid var(--color-divider);border-radius:5px;padding:10px;cursor:pointer;font-size:12px">
          <input id="pref-nav-all" type="checkbox" ${(typeof navShowEverything==='function'&&navShowEverything())?'checked':''} style="margin-top:1px;width:15px;height:15px;accent-color:var(--color-accent);flex:none"/>
          <span><span style="font-weight:600;display:block">${i18t('set_show_everything')}</span>
          <span style="color:var(--color-neutral-600);display:block;line-height:1.4">${i18t('set_full_cockpit')}</span></span>
        </label>
      </section>

      ${(API_MODE()&&isAdmin())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_pilot_activation')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_activation_sub')}</p>
        <div id="activation-funnel" style="font-size:12px;color:var(--color-neutral-700)">${i18t('set_loading')}</div>
      </section>`:''}

      ${(API_MODE()&&isAdmin())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">${i18t('set_email_notifications')}</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${i18t('set_email_sub')}</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <button id="rem-run" style="${secondaryBtn}">${icon('clock','w-3.5 h-3.5')} ${i18t('set_check_renewals')}</button>
          <button id="ob-refresh" style="${secondaryBtn}">${icon('history','w-3.5 h-3.5')} ${i18t('set_refresh_outbox')}</button>
        </div>
        <div id="outbox-list" style="font-size:12px;color:var(--color-neutral-700)">${i18t('set_loading_outbox')}</div>
      </section>`:''}
      </div>
    </div>
  </div>`;

  if(API_MODE()&&isAdmin()){
    /* WO N7: the activation funnel — four labelled steps, each with its first
       time and count, and one sentence for the north star. Words, not colour:
       "not yet" is an answer, not an absence. */
    (async()=>{
      const host=document.getElementById('activation-funnel'); if(!host) return;
      try{
        const r=await api('activation');
        const STEP={ added:i18t('set_step_added'), scanned:i18t('set_step_scanned'), sent:i18t('set_step_sent'), signed:i18t('set_step_signed') };
        host.innerHTML=`
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:10px">
            ${Object.entries(STEP).map(([k,label])=>{ const e=r.events&&r.events[k];
              return `<div style="border:1px solid var(--color-divider);border-radius:6px;padding:9px 11px;background:${e?'var(--st-green-bg)':'var(--color-bg)'}">
                <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:${e?'var(--st-green-fg)':'var(--color-neutral-600)'}">${e?icon('check2','w-3 h-3'):''}${label}</div>
                <div style="font-size:10px;font-family:var(--font-mono);color:var(--color-neutral-600);margin-top:3px">${e?`${fmtDT(e.first)} · ${e.count}×`:i18t('set_not_yet')}</div>
              </div>`; }).join('')}
          </div>
          <div style="font-size:11.5px;line-height:1.5;color:${r.northStar.withinSevenDays===true?'var(--st-green-fg)':r.northStar.withinSevenDays===false?'var(--st-amber-fg)':'var(--color-neutral-700)'}">
            ${r.northStar.firstSendDays==null
              ? i18t('set_north_star_none')
              : r.northStar.withinSevenDays
                ? `<b>${i18t('set_north_star')}</b> ${r.northStar.firstSendDays===0?i18t('set_first_send_dayone'):i18tn('set_first_send_after',r.northStar.firstSendDays,{n:r.northStar.firstSendDays})}`
                : i18t('set_first_send_late',{n:r.northStar.firstSendDays})}
          </div>`;
      }catch(e){ host.innerHTML=`<span style="color:var(--color-neutral-600)">${i18t('set_activation_failed',{err:esc(e.message)})}</span>`; }
    })();
    const loadOutbox=async()=>{
      try{ const r=await api('outbox');
        const host=document.getElementById('outbox-list'); if(!host) return;
        host.innerHTML=`<div class="mb-2 text-[11px] ${r.emailConfigured?'text-brand-600':'text-gold-600'}">${r.emailConfigured?i18t('set_email_configured'):i18t('set_email_not_configured')}</div>`+
          (r.items.length?`<div class="space-y-1.5 max-h-56 overflow-y-auto scroll-thin">${r.items.map(it=>`
            <div class="rounded-lg border border-brand-100 bg-white p-2.5">
              <div class="flex items-center gap-2"><span class="text-[11px] font-medium text-brand-900 truncate flex-1">${it.subject}</span><span class="text-[9px] uppercase tracking-wider ${it.sent?'text-brand-600':'text-gold-600'}">${it.sent?i18t('set_sent_lower'):it.provider}</span></div>
              <div class="text-[10px] font-mono text-brand-800/65 truncate">→ ${it.to_addr} · ${fmtDT(it.created_at)}</div>
              ${it.detail?`<div class="mt-1 text-[10px] text-gold-700 bg-gold-500/10 rounded px-1.5 py-1 leading-relaxed">${i18t('set_why_failed',{why:esc(it.detail)})}</div>`:''}
              ${it.dev_hint?`<div class="mt-1 text-[10px] font-mono text-gold-700 bg-gold-500/10 rounded px-1.5 py-0.5 inline-block">${it.dev_hint}</div>`:''}
            </div>`).join('')}</div>`:`<div class="text-[11px] text-brand-800/65">${i18t('set_no_messages')}</div>`);
      }catch(e){}
    };
    setTimeout(loadOutbox,50);
    document.getElementById('ob-refresh')?.addEventListener('click',loadOutbox);
    document.getElementById('rem-run')?.addEventListener('click',async()=>{
      try{ const r=await api('reminders/run','POST',{}); toast(i18tn('set_checked_queued',r.queued,{checked:r.checked,n:r.queued})); loadOutbox(); }
      catch(e){ toast(e.message,'err'); }
    });
  }

  document.getElementById('pref-nav-all')?.addEventListener('change',e=>{
    if(typeof navSetShowEverything==='function') navSetShowEverything(e.target.checked);
    toast(e.target.checked?i18t('set_sidebar_all_on'):i18t('set_sidebar_all_off'));
  });
  /* No first-open toggle to wire — the alert it switched on is gone. */
  document.getElementById('tm-invite')?.addEventListener('click',()=>{ const n=document.getElementById('tm-name'); if(n){ n.scrollIntoView({block:'nearest'}); n.focus(); } });
  document.getElementById('org-export')?.addEventListener('click',()=>document.getElementById('bk-export')?.click());
  document.getElementById('brand-edit')?.addEventListener('click',()=>openDesignStep({ mode:'settings', onBack:()=>renderTeam() }));
  /* THE MARKET. jxSet writes the local key, the org record and the server, so
     the whole screen is re-rendered afterwards rather than patched: the money,
     the governing law and the e-signature line on this very card all read from
     the pack that just changed. */
  document.getElementById('set-market')?.addEventListener('change',e=>{
    if(!window.jxSet || !jxSet(e.target.value)) return;
    if(window.setRegion && window.regionCodeFor) setRegion(regionCodeFor(jxId()),{silent:true});
    toast(i18t('set_market_saved'));
    renderTeam();
  });
  renderClauseLibrary();
  if(API_MODE()) loadSessions();
  // Copilot engine config
  if(API_MODE()){
    const refreshAiCfg=async()=>{ const el=document.getElementById('ai-cfg-status'); if(!el) return;
      try{ const c=await api('ai/config'); state.aiConfigured=!!c.configured;
        const fast=c.tiers?.fast?.model||c.models?.fast||c.model||'', deep=c.tiers?.deep?.model||c.models?.deep||'';
        el.innerHTML=c.configured
          ?`<span class="text-brand-600">${i18t('set_configured')}</span> · ${i18t('set_key')} ${c.hint}${c.source==='env'?i18t('set_key_from_env'):''}`
          :`<span class="text-gold-600">${i18t('set_not_configured')}</span>${i18t('set_falls_back')}`;
        const set=(id,v)=>{ const n=document.getElementById(id); if(n) n.textContent=v||'—'; };
        set('ai-model-fast-cur',fast); set('ai-model-deep-cur',deep);
        // fill overrides without clobbering a field the admin is editing
        const fill=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n) n.value=v||''; };
        fill('ai-model-fast',c.tiers?.fast?.override); fill('ai-model-deep',c.tiers?.deep?.override); fill('ai-model-global',c.globalOverride);
        // usage + cost-control limits (admin-only fields; helpers null-check)
        const lim=c.limits||{}, use=c.usage||{}, spend=c.spend||{};
        state.aiCfg=c;   // migration's pre-flight estimate reads rates from here
        const money=n=>'$'+Number(n||0).toFixed(2);
        const budget=Number(lim.dailySpendLimit||0);
        const spent=Number(spend.cost||0);
        const uEl=document.getElementById('ai-usage');
        if(uEl){
          const reqN=Number(spend.requests||0);
          uEl.innerHTML=budget>0
            ? `${i18tn('set_today_of',reqN,{spent:money(spent),budget:money(budget),n:reqN.toLocaleString(jxLocale())})} <span style="color:var(--color-neutral-500)">(${spend.date||''})</span>`
            : `${i18tn('set_today_free',reqN,{spent:money(spent),n:reqN.toLocaleString(jxLocale())})} <span style="color:var(--color-neutral-500)">(${spend.date||''})${i18t('set_no_daily_budget')}</span>`; }
        const uBar=document.getElementById('ai-usage-bar');
        if(uBar){ const pct=budget>0?Math.min(100,Math.round(spent/budget*100)):0;
          uBar.style.width=pct+'%'; uBar.style.background=pct>=90?'var(--st-ruby-fg)':pct>=70?'var(--st-amber-dot)':'var(--color-accent)'; }
        // per-feature breakdown — so an admin can see what is actually expensive
        const bdHost=document.getElementById('ai-spend-breakdown');
        if(bdHost){
          const rows=Object.entries(spend.byFeature||{}).map(([k,v])=>({k,...v})).sort((a,b)=>b.cost-a.cost);
          bdHost.innerHTML=rows.length?`<div style="border:1px solid var(--color-divider);border-radius:5px;overflow:hidden">
            ${rows.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid color-mix(in srgb,var(--color-text) 6%,transparent);font-size:11px">
              <span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${PB_ESC(r.label||r.k)}</span>
              <span style="color:var(--color-neutral-500);font-family:var(--font-mono);font-size:10px">${Number(r.requests||0).toLocaleString(jxLocale())} req</span>
              <span style="font-family:var(--font-mono);font-weight:600;min-width:62px;text-align:right">${'$'+Number(r.cost||0).toFixed(4)}</span>
            </div>`).join('')}</div>`
            :`<div style="font-size:10.5px;color:var(--color-neutral-500)">${i18t('set_no_spend')}</div>`;
        }
        const fillN=(id,v)=>{ const n=document.getElementById(id); if(n&&document.activeElement!==n&&v!==undefined) n.value=v; };
        fillN('ai-rate-light',lim.rateLight); fillN('ai-rate-deep',lim.rateDeep); fillN('ai-daily',lim.dailyLimit);
        fillN('ai-rate-ocr',lim.rateOcr); fillN('ai-ocr-pages',lim.ocrMaxPages);
        fillN('ai-daily-spend',lim.dailySpendLimit); fillN('ai-estimate-confirm',lim.estimateConfirmAt);
        fillN('ai-maxchars',lim.maxChars); fillN('ai-maxcontracts',lim.maxContracts);
        const th=document.getElementById('ai-thorough'); if(th&&document.activeElement!==th) th.checked=!!lim.thoroughExtract;
        renderAllowancePanel(c.allowance||{});
        renderRateTable(c.rates||{}, c.ratesMeta||{});
      }catch(e){ el.textContent='Could not read Copilot config.'; } };
    refreshAiCfg();
    // basic shape check mirroring the server (blank = clear override)
    const okModel=(s)=>s===''||(!/\s/.test(s)&&/^claude-[a-z0-9][a-z0-9.\-]*$/i.test(s));
    document.getElementById('ai-key-save')?.addEventListener('click',async()=>{
      const key=document.getElementById('ai-key').value.trim();
      if(!key){ toast(i18t('set_enter_key'),'err'); return; }
      try{ await api('ai/config','PUT',{ key }); document.getElementById('ai-key').value=''; toast(i18t('set_key_saved')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-model-save')?.addEventListener('click',async()=>{
      const modelFast=document.getElementById('ai-model-fast').value.trim();
      const modelDeep=document.getElementById('ai-model-deep').value.trim();
      const model=document.getElementById('ai-model-global').value.trim();
      for(const m of [modelFast,modelDeep,model]) if(!okModel(m)){ toast(i18t('set_t_bad_model',{m}),'err'); return; }
      try{ await api('ai/config','PUT',{ modelFast, modelDeep, model }); toast(i18t('set_model_saved')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Remove the stored Copilot key?', message:'Copilot features will fall back to the built-in interpreter until a new key is added.', confirmLabel:'Remove key', danger:true})) return;
      try{ await api('ai/config','PUT',{ clear:true }); toast(i18t('set_key_removed')); refreshAiCfg(); }catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-limits-save')?.addEventListener('click',async()=>{
      const num=id=>{ const el=document.getElementById(id); if(!el) return undefined; const v=el.value.trim(); return v===''?undefined:Number(v); };
      const whole={ rateLight:num('ai-rate-light'), rateDeep:num('ai-rate-deep'), rateOcr:num('ai-rate-ocr'),
        dailyLimit:num('ai-daily'), maxChars:num('ai-maxchars'), maxContracts:num('ai-maxcontracts'), ocrMaxPages:num('ai-ocr-pages') };
      for(const [k,v] of Object.entries(whole)) if(v!==undefined&&(!Number.isFinite(v)||v<0||Math.floor(v)!==v)){ toast(i18t('set_t_whole_number',{k}),'err'); return; }
      const cash={ dailySpendLimit:num('ai-daily-spend'), estimateConfirmAt:num('ai-estimate-confirm') };
      for(const [k,v] of Object.entries(cash)) if(v!==undefined&&(!Number.isFinite(v)||v<0)){ toast(i18t('set_t_non_negative',{k}),'err'); return; }
      const body={ ...whole, ...cash, thoroughExtract: !!document.getElementById('ai-thorough')?.checked };
      try{ await api('ai/config','PUT',body); toast(i18t('set_limits_saved')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    // ---- onboarding allowance ----
    const allowBody=()=>{
      const n=id=>{ const v=document.getElementById(id)?.value.trim(); return v===''||v==null?0:Number(v); };
      return { budget:n('ai-allow-budget'), docs:n('ai-allow-docs') };
    };
    document.getElementById('ai-allow-open')?.addEventListener('click',async()=>{
      const b=allowBody();
      if(!(b.budget>0)&&!(b.docs>0)){ toast(i18t('set_set_budget'),'err'); return; }
      if(!await confirmDialog({title:'Open an onboarding allowance?',
        message:`Bulk import and OCR will draw on ${b.budget>0?'$'+b.budget.toFixed(2):'no money cap'}${b.docs>0?` and ${b.docs} documents`:''} instead of the daily budget, until it runs out.`,
        confirmLabel:'Open allowance'})) return;
      try{ await api('ai/allowance','PUT',{ open:true, ...b }); toast(i18t('set_allowance_opened')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-allow-topup')?.addEventListener('click',async()=>{
      try{ await api('ai/allowance','PUT',allowBody()); toast(i18t('set_allowance_updated')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-allow-close')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Close the onboarding allowance?', message:'Migration and OCR will go back to drawing on the daily budget.', confirmLabel:'Close allowance', danger:true})) return;
      try{ await api('ai/allowance','PUT',{ close:true }); toast(i18t('set_allowance_closed')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    // ---- model rate table ----
    document.getElementById('ai-rates-save')?.addEventListener('click',async()=>{
      const rates={};
      document.querySelectorAll('[data-rate-model]').forEach(row=>{
        const m=row.getAttribute('data-rate-model');
        const i=Number(row.querySelector('[data-rate="in"]').value);
        const o=Number(row.querySelector('[data-rate="out"]').value);
        if(Number.isFinite(i)&&Number.isFinite(o)&&i>=0&&o>=0) rates[m]={in:i,out:o};
      });
      if(!Object.keys(rates).length){ toast(i18t('set_nothing_to_save'),'err'); return; }
      try{ await api('ai/config','PUT',{ rates }); toast(i18t('set_rate_saved')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
    document.getElementById('ai-rates-reset')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Reset the rate table?', message:'Every model goes back to the prices HaTi ships with. Past spend already recorded is not re-priced.', confirmLabel:'Reset rates', danger:true})) return;
      try{ await api('ai/config','PUT',{ rates:{} }); toast(i18t('set_rate_reset')); refreshAiCfg(); }
      catch(e){ toast(e.message,'err'); }
    });
  }
  // local mode: no server to hold the key — persist it in this browser so the
  // field is present and remembered; Copilot still uses the built-in interpreter.
  if(!API_MODE() && isAdmin()){
    const st=document.getElementById('ai-cfg-status');
    const refresh=()=>{ if(!st) return; const k=lsGet('hati.v1.aikey');
      st.innerHTML=k?`<span style="color:var(--st-green-fg);font-weight:600">● Configured</span> · key ••••${String(k).slice(-4)} stored in this browser — Copilot is live.`
                    :`<span style="color:var(--st-amber-fg);font-weight:600">● Not configured</span> — Copilot and Copilot features use the built-in interpreter.`; };
    refresh();
    // reflect the key change immediately in the sidebar status + Copilot panel header
    const refreshAiIndicators=()=>{ if(typeof renderSideUser==='function') renderSideUser(); if(typeof updateAiBrainPill==='function') updateAiBrainPill(); };
    document.getElementById('ai-key-save')?.addEventListener('click',()=>{
      const inp=document.getElementById('ai-key'); const key=(inp?.value||'').trim();
      if(!key){ toast(i18t('set_enter_key'),'err'); return; }
      lsSet('hati.v1.aikey', key); inp.value='';
      toast(i18t('set_t_key_saved',{last4:key.slice(-4)})); refresh(); refreshAiIndicators();
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Remove the stored Copilot key?', message:'HaTi Copilot and Copilot features will fall back to the built-in interpreter.', confirmLabel:'Remove key', danger:true})) return;
      localStorage.removeItem('hati.v1.aikey'); toast(i18t('set_key_removed')); refresh(); refreshAiIndicators();
    });
  }
  document.getElementById('meta-backfill')?.addEventListener('click',()=>runMetaBackfill());
  /* The access picker follows the role: an admin always holds every stream
     (userFolderAccess short-circuits on role), so asking is meaningless there —
     the row is disabled and says so rather than collecting an answer that would
     be ignored. */
  const tmSyncAccess=()=>{
    const roleSel=document.getElementById('tm-role'), accSel=document.getElementById('tm-access');
    const list=document.getElementById('tm-access-list'), note=document.getElementById('tm-access-note');
    if(!roleSel||!accSel||!list||!note) return;
    const isAdminRole=roleSel.value==='admin';
    accSel.disabled=isAdminRole;
    accSel.style.opacity=isAdminRole?'.55':'';
    note.style.display=isAdminRole?'block':'none';
    list.style.display=(!isAdminRole && accSel.value==='pick')?'grid':'none';
  };
  document.getElementById('tm-role')?.addEventListener('change',tmSyncAccess);
  document.getElementById('tm-access')?.addEventListener('change',tmSyncAccess);
  tmSyncAccess();
  document.getElementById('tm-add')?.addEventListener('click',async()=>{
    const name=fval('tm-name').trim(), email=fval('tm-email').trim().toLowerCase(), role=document.getElementById('tm-role').value;
    const title=fval('tm-title'), pass=document.getElementById('tm-pass').value;
    if(!name){ toast(i18t('set_enter_member_name'),'err'); return; }
    if(!validEmail(email)){ toast(i18t('set_enter_valid_email'),'err'); return; }
    if(pass.length<8){ toast(i18t('set_temp_password_min'),'err'); return; }
    if(getUsers().some(x=>x.email===email)){ toast(i18t('set_member_exists'),'err'); return; }
    /* Folder access is decided BEFORE the account exists. `null` means every
       stream — the same "no entry in the map" the editor writes — and it is
       reached only by picking it, never by saying nothing. */
    let folderIds=null;
    if(role!=='admin'){
      const choice=document.getElementById('tm-access')?.value||'';
      if(!choice){ toast(i18t('set_choose_access_err'),'err'); document.getElementById('tm-access')?.focus(); return; }
      if(choice==='pick'){
        folderIds=[...document.querySelectorAll('[data-tm-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-tm-folder'));
        if(!folderIds.length){ toast(i18t('set_pick_one_stream'),'err'); return; }
      }
    }
    let newId=null;
    if(API_MODE()){
      try{ const r=await api('users','POST',{ name, email, role, title, password:pass });
        REMOTE.users=[...REMOTE.users, r.user]; newId=r.user&&r.user.id;
      }catch(e){ toast(e.message,'err'); return; }
    } else {
      const salt=newSalt();
      newId='u'+(Date.now().toString(36));
      saveUsers([...getUsers(),{ id:newId, name, email, role, title, salt, hash:await hashPassword(pass,salt), createdAt:nowISO() }]);
    }
    // Restriction goes through the same atomic route the access editor uses, so
    // an unrelated settings save cannot clobber it (see H-3 above).
    if(folderIds && newId){
      state.settings=state.settings||{}; state.settings.folderAccess=state.settings.folderAccess||{};
      state.settings.folderAccess[newId]=folderIds;
      try{
        if(window.API_MODE && window.API_MODE()) await api('settings/folder-access','PUT',{ userId:newId, folders:folderIds });
        else await saveSettings();
      }catch(e){ toast(i18t('set_could_not_save_access')+e.message,'err'); }
    }
    // Mirror the member into the directory (with their title) so signer fields auto-fill.
    state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
    const ex=dir.find(p=>(p.email||'').toLowerCase()===email);
    if(ex){ ex.name=name; if(title) ex.title=title; } else dir.push({ name, email, title:title||'' });
    state.settings.directory=dir; saveSettings();
    toast(i18t('set_t_added_as',{name,role:roleName(role)})+(API_MODE()?i18t('set_t_invite_queued'):i18t('set_t_share_password')));
    renderTeam();
  });
  document.querySelectorAll('[data-title-for]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-title-for');
    const u=(getUsers()||[]).find(x=>x.id===id); if(!u) return;
    const t=await promptDialog({ title:`Job title — ${u.name}`,
      message:'The capacity this person signs contracts in, e.g. "Chief Operating Officer". This is not their permission level: a signature block that says "Admin" tells a counterparty nothing about authority to sign. Leave it empty to show no capacity at all.',
      label:'Job title', value:u.title||'', placeholder:'e.g. Chief Operating Officer', confirmLabel:'Save title' });
    if(t==null) return;
    const title=String(t).trim();
    if(API_MODE()){
      try{ const r=await api('users/'+id,'PATCH',{ title }); if(r&&r.user) Object.assign(u,r.user); else u.title=title; }
      catch(e){ toast(i18t('set_could_not_save_title')+e.message,'err'); return; }
    } else { u.title=title; saveUsers(getUsers()); }
    // keep the people directory in step, so signer fields still auto-fill
    state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
    const ex=dir.find(p=>(p.email||'').toLowerCase()===(u.email||'').toLowerCase());
    if(ex) ex.title=title; else if(u.email) dir.push({ name:u.name||'', email:u.email, title });
    state.settings.directory=dir; saveSettings();
    toast(title?`${u.name} signs as ${title}`:`Job title cleared for ${u.name}`);
    renderTeam();
  }));
  document.querySelectorAll('[data-access-for]').forEach(b=>b.addEventListener('click',()=>openFolderAccessEditor(b.getAttribute('data-access-for'))));
  document.querySelectorAll('[data-values-for]').forEach(b=>b.addEventListener('click',async()=>{
    const id=b.getAttribute('data-values-for'), to=b.getAttribute('data-values-to')==='1';
    const u=(getUsers()||[]).find(x=>x.id===id); if(!u) return;
    if(!to && !await confirmDialog({ title:`Hide contract values from ${u.name}?`,
      message:'They will stop seeing amounts on the register, on a contract, in exports, in the dashboard metrics and in anything they ask the Copilot. They keep their folder access and everything else. You can turn this back on at any time.',
      confirmLabel:'Hide values' })) return;
    try{ const r=await api('users/'+id,'PATCH',{ canViewValues:to });
      if(r&&r.user) Object.assign(u,r.user); else u.canViewValues=to;
      toast(to?`${u.name} can now see contract values`:`Contract values are now hidden from ${u.name}`);
      renderTeam();
    }catch(e){ toast(i18t('set_could_not_change_access')+e.message,'err'); }
  }));
  document.getElementById('dir-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{
      const parsed=parseDirectoryCsv(rd.result);
      if(!parsed.length){ toast(i18t('set_no_csv_rows'),'err'); return; }
      state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
      const byEmail={}; dir.forEach(p=>{ if(p.email) byEmail[p.email.toLowerCase()]=p; });
      let added=0, updated=0;
      parsed.forEach(r=>{ const k=(r.email||'').toLowerCase();
        if(k && byEmail[k]){ const p=byEmail[k]; if(r.name)p.name=r.name; if(r.title)p.title=r.title; updated++; }
        else { const p={ name:r.name||'', email:r.email||'', title:r.title||'' }; dir.push(p); if(k)byEmail[k]=p; added++; } });
      state.settings.directory=dir;
      try{ await saveSettings(); }catch(err){ toast(i18t('set_t_sync_failed',{err:err.message}),'err'); }
      toast(i18t('set_t_dir_import',{added})+(updated?i18t('set_t_dir_updated',{n:updated}):''));
      renderTeam();
    };
    rd.readAsText(f); e.target.value='';
  });
  document.getElementById('dir-clear')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:'Clear the directory?', message:'Removes all imported contacts. Team members are not affected.', confirmLabel:'Clear directory', danger:true})) return;
    state.settings=state.settings||{}; state.settings.directory=[]; await saveSettings();
    toast(i18t('set_t_dir_cleared')); renderTeam();
  });
  document.querySelectorAll('[data-role-for]').forEach(sel=>sel.addEventListener('change',async()=>{
    const us=getUsers(); const u=us.find(x=>x.id===sel.getAttribute('data-role-for'));
    if(!u) return;
    if(API_MODE()){
      try{ await api('users/'+u.id,'PATCH',{ role:sel.value }); u.role=sel.value; }
      catch(e){ toast(e.message,'err'); renderTeam(); return; }
    } else { u.role=sel.value; saveUsers(us); }
    toast(i18t('set_t_now_role',{name:u.name,role:roleName(u.role)})); renderTeam();
  }));
  document.querySelectorAll('[data-remove-user]').forEach(b=>b.addEventListener('click',async()=>{
    const us=getUsers(); const u=us.find(x=>x.id===b.getAttribute('data-remove-user'));
    if(!u) return;
    if(!await confirmDialog({title:`Remove ${u.name}?`, message:`${u.name} will lose access to this workspace. You can re-invite them later.`, confirmLabel:'Remove member', danger:true})) return;
    if(API_MODE()){
      try{ await api('users/'+u.id,'DELETE'); REMOTE.users=REMOTE.users.filter(x=>x.id!==u.id); }
      catch(e){ toast(e.message,'err'); return; }
    } else saveUsers(us.filter(x=>x.id!==u.id));
    toast(i18t('set_t_removed',{name:u.name})); renderTeam();
  }));
  renderApprovalRules();
  document.getElementById('ar-add')?.addEventListener('click',()=>openApprovalRuleEditor(-1));
  document.getElementById('bk-export')?.addEventListener('click',()=>{
    downloadFile(`hati-backup-${new Date().toISOString().slice(0,10)}.json`,
      JSON.stringify({ kind:'hati-backup', v:1, exportedAt:nowISO(), org:getOrg(), users:getUsers(),
        data:{ uid, contracts:state.contracts } },null,2));
    toast(i18t('set_t_backup_downloaded'));
  });
  document.getElementById('bk-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{ let b;
      try{ b=JSON.parse(rd.result); if(b.kind!=='hati-backup'||!b.org||!b.users) throw new Error('bad'); }
      catch(err){ toast(i18t('set_t_bad_backup'),'err'); return; }
      if(!await confirmDialog({title:'Restore from backup?', message:'Restoring replaces this workspace, its users and contracts with the backup. The current data will be overwritten.', confirmLabel:'Restore backup', danger:true})) return;
      lsSet(LS.org,b.org); saveUsers(b.users); if(b.data) lsSet(LS.data,b.data);
      localStorage.removeItem(LS.session); location.reload();
    };
    rd.readAsText(f);
  });
  document.getElementById('bk-reset')?.addEventListener('click',async()=>{
    if(await confirmDialog({title:'Erase this workspace?', message:'This permanently erases the workspace, all users and contracts stored in this browser. This cannot be undone.', confirmLabel:'Erase everything', danger:true})){
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
    <div style="border:1px solid var(--color-divider);border-radius:8px;background:var(--color-surface);padding:11px 13px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:9.5px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.06em;color:var(--color-neutral-500)">${cl.category}</span>
        <span style="font-size:12.5px;font-weight:600;color:var(--color-text)">${cl.name}</span>
        ${canEditLib?`<span style="margin-left:auto;display:flex;gap:10px;font-size:11px;font-weight:600">
          <button data-cl-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button>
          <button data-cl-del="${i}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button></span>`:''}
      </div>
      <div style="margin-top:4px;font-size:11px;color:var(--color-neutral-600)"><b>${i18t('set_preferred')}</b> ${(cl.preferred||'').slice(0,140).replace(/</g,'&lt;')}${(cl.preferred||'').length>140?'…':''}</div>
    </div>`).join('')||`<p style="font-size:11px;color:var(--color-neutral-500)">${i18t('set_no_clauses')}</p>`;
  host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>openClauseEditor(Number(b.getAttribute('data-cl-edit')))));
  host.querySelectorAll('[data-cl-del]').forEach(b=>b.addEventListener('click',()=>{ const i=Number(b.getAttribute('data-cl-del')); const lib2=clauseLibrary().slice(); lib2.splice(i,1); saveClauseLibrary(lib2); renderClauseLibrary(); toast(i18t('set_t_clause_removed')); }));
  document.getElementById('cl-add')?.addEventListener('click',()=>openClauseEditor(-1));
  renderPlaybookView();
}
/* ---- playbook viewer + editor (Admin / Legal) ---- */
const PB_ESC = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const PB_ATTR = s => String(s==null?'':s).replace(/"/g,'&quot;');
// position chip — red for required/forbidden, steel for preferred; ⚑ = escalate
function pbPosChip(pos){
  const hard=pos.pos==='required'||pos.pos==='forbidden';
  return `<span style="font-size:9.5px;font-family:var(--font-mono);border-radius:999px;padding:2px 9px;${hard?'background:var(--st-ruby-bg);color:var(--st-ruby-fg)':'background:var(--st-steel-bg);color:var(--st-steel-fg)'}">${PB_ESC(pos.category)}${pos.escalate?' ⚑':''}</span>`;
}
const pbRangeChip = rg => `<span style="font-size:9.5px;font-family:var(--font-mono);border-radius:999px;padding:2px 9px;background:var(--st-amber-bg);color:var(--st-amber-fg)">${PB_ESC(rg.label)} ${rg.op} ${rg.value}${rg.escalate?' ⚑':''}</span>`;
function renderPlaybookView(){
  const pv=document.getElementById('playbook-view'); if(!pv) return;
  const canEditPb=isAdmin()||currentUser()?.role==='legal';
  const pb=playbook();
  const base=pb._default||DEFAULT_PLAYBOOK._default;
  const card=(key,label,positions,ranges,removable,baseline)=>`
    <div style="margin-bottom:${baseline?'12px':'8px'};border:1px solid ${baseline?'var(--color-accent-300)':'var(--color-divider)'};border-left:3px solid ${baseline?'var(--color-accent)':'var(--color-divider)'};border-radius:8px;background:${baseline?'var(--color-accent-100)':'var(--color-surface)'};padding:${baseline?'11px 13px':'10px 12px'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${baseline?'2px':'6px'}">
        <span style="font-size:11.5px;font-weight:${baseline?700:600};color:${baseline?'var(--color-accent-900)':'var(--color-text)'}">${PB_ESC(label)}</span>
        ${baseline?`<span style="font-size:8.5px;font-family:var(--font-mono);letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--color-accent);border-radius:999px;padding:2px 8px">${i18t('set_applies_all')}</span>`:''}
        ${canEditPb?`<span style="margin-left:auto;display:flex;gap:10px;font-size:11px;font-weight:600">
          <button data-pb-edit="${key}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button>
          ${removable?`<button data-pb-del="${key}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button>`:''}
        </span>`:''}
      </div>
      ${baseline?`<div style="font-size:10px;color:var(--color-accent-800);margin-bottom:7px">${i18t('set_default_positions')}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:5px">${positions.map(pbPosChip).join('')}${ranges.map(pbRangeChip).join('')||(positions.length?'':`<span style="font-size:11px;color:var(--color-neutral-500)">${i18t('set_no_positions')}</span>`)}</div>
    </div>`;
  const baseCard=card('_default',i18t('set_all_contracts_baseline'), base.positions||[], base.ranges||[], false, true);
  const typeCards=Object.keys(pb).filter(k=>k!=='_default').map(k=>{ const rp=resolvePlaybook(k); return card(k, pb[k].label||k, rp.positions, rp.ranges, true); }).join('');
  pv.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:12px;font-weight:600;color:var(--color-text)">${i18t('set_playbook_by_type')}</span>
      ${canEditPb?`<span style="margin-left:auto;display:flex;gap:8px">
        <button id="pb-add" class="ui-btn ui-btn-primary" style="font-size:11px;padding:4px 10px">${icon('plus','w-3 h-3')} ${i18t('set_add_type')}</button>
        <button id="pb-reset" style="font-size:11px;font-weight:600;color:var(--color-neutral-600);background:none;border:0;cursor:pointer">${i18t('set_reset_defaults2')}</button>
      </span>`:''}
    </div>
    ${baseCard}${typeCards}
    <p style="font-size:10px;color:var(--color-neutral-500);margin-top:4px">${i18t('set_flag_legend')}${canEditPb?i18t('set_flag_legend_more'):''}</p>`;
  if(!canEditPb) return;
  pv.querySelectorAll('[data-pb-edit]').forEach(b=>b.addEventListener('click',()=>openPlaybookEditor(b.getAttribute('data-pb-edit'))));
  pv.querySelectorAll('[data-pb-del]').forEach(b=>b.addEventListener('click',async()=>{
    const key=b.getAttribute('data-pb-del'); const cur=playbook();
    if(!await confirmDialog({title:i18t('set_remove_type_q',{label:cur[key]?.label||key}), message:i18t('set_remove_type_msg'), confirmLabel:i18t('set_remove_type_btn'), danger:true})) return;
    const pb2=JSON.parse(JSON.stringify(cur)); delete pb2[key]; savePlaybook(pb2); renderPlaybookView(); toast(i18t('set_type_removed'));
  }));
  document.getElementById('pb-add')?.addEventListener('click',()=>openPlaybookEditor(null));
  document.getElementById('pb-reset')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:i18t('set_reset_pb_q'), message:i18t('set_reset_pb_msg',{pack:jxPlaybookLabel()}), confirmLabel:i18t('set_reset_pb_btn'), danger:true})) return;
    state.settings=state.settings||{}; delete state.settings.playbook; if(typeof saveSettings==='function') saveSettings();
    renderPlaybookView(); toast(i18t('set_pb_reset_done'));
  });
}
/* Modal editor for one playbook entry (key='_default' edits the baseline,
   null adds a new contract type). Positions and numeric limits are edited live
   on a working copy, then committed with Save. */
function openPlaybookEditor(key){
  const pb=JSON.parse(JSON.stringify(playbook()));
  const isNew=!key, isBase=key==='_default';
  if(isNew){ key='t_'+Math.random().toString(36).slice(2,7); pb[key]={label:'',extends:'_default',positions:[],ranges:[],match:[]}; }
  const e=pb[key]; e.positions=e.positions||[]; e.ranges=e.ranges||[]; e.match=e.match||[];
  const inherited=(!isBase)?resolvePlaybook('_default'):null;
  const POS=[['required',i18t('set_pos_required')],['preferred',i18t('set_pos_preferred')],['forbidden',i18t('set_pos_forbidden')]];
  const inp='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:6px 8px;font:inherit;font-size:12.5px;color:inherit;outline:none';
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:16px;margin:0 0 12px">${isNew?i18t('set_add_contract_type'):isBase?i18t('set_edit_baseline'):i18t('set_edit_playbook_for',{label:PB_ESC(e.label||key)})}</h3>
    <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:3px">${isBase?i18t('set_name'):i18t('set_type_name')}</span>
      <input id="pb-f-label" value="${PB_ATTR(e.label||'')}" placeholder="${isBase?esc(i18t('set_ph_baseline')):esc(i18t('set_ph_eg_distribution'))}" style="${inp}"></label>
    ${!isBase?`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:3px">${i18t('set_applies_matching')} <span style="font-weight:400;color:var(--color-neutral-500)">${i18t('set_comma_keywords')}</span></span>
      <input id="pb-f-match" value="${PB_ATTR(e.match.join(', '))}" placeholder="${esc(i18t('set_ph_eg_keywords'))}" style="${inp}"></label>
    <div style="font-size:10.5px;color:var(--color-neutral-600);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:6px;padding:7px 9px;margin-bottom:12px">${i18t('set_inherited_baseline')} <span style="display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle">${inherited.positions.map(pbPosChip).join('')}${inherited.ranges.map(pbRangeChip).join('')}</span></div>`:''}

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:11px;font-weight:600;color:var(--color-text)">${isBase?i18t('set_positions'):i18t('set_positions_for_type')}</span><button id="pb-add-pos" style="margin-left:auto;font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">${i18t('set_add_position')}</button></div>
    <div id="pb-pos-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px"></div>

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:11px;font-weight:600;color:var(--color-text)">${i18t('set_numeric_limits')}</span><button id="pb-add-rng" style="margin-left:auto;font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">${i18t('set_add_limit')}</button></div>
    <div id="pb-rng-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>

    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="pb-cancel" class="ui-btn" style="font-size:12px;padding:6px 14px">${i18t('act_cancel')}</button>
      <button id="pb-save" class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 16px">${i18t('act_save')}</button>
    </div>
  </div>`, {maxWidth:'34rem'});

  const seg=(i)=>POS.map(([v,l])=>{ const on=e.positions[i].pos===v; const hard=v==='required'||v==='forbidden';
    return `<button data-pb-pos="${i}" data-v="${v}" style="font-size:10.5px;font-weight:600;border:1px solid ${on?(hard?'var(--st-ruby-line)':'var(--color-accent)'):'var(--color-divider)'};background:${on?(hard?'var(--st-ruby-bg)':'var(--color-accent-100)'):'var(--color-surface)'};color:${on?(hard?'var(--st-ruby-fg)':'var(--color-accent-800)'):'var(--color-neutral-600)'};padding:4px 9px;border-radius:6px;cursor:pointer">${l}</button>`; }).join('');
  const paint=()=>{
    const pl=document.getElementById('pb-pos-list');
    pl.innerHTML=e.positions.length?e.positions.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:7px;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-cat="${i}" value="${PB_ATTR(p.category||'')}" placeholder="${esc(i18t('set_ph_category'))}" style="flex:1;min-width:150px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <span style="display:inline-flex;gap:3px">${seg(i)}</span>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-esc="${i}" ${p.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmpos="${i}" title="${i18t('act_remove')}" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500);margin:0">${isBase?i18t('set_no_specific_positions'):i18t('set_no_specific_inherits')}</p>`;
    const rl=document.getElementById('pb-rng-list');
    rl.innerHTML=e.ranges.length?e.ranges.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:7px;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-rlabel="${i}" value="${PB_ATTR(r.label||'')}" placeholder="${esc(i18t('set_ph_label_payment'))}" style="flex:1;min-width:120px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <select data-pb-rop="${i}" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 6px;font:inherit;font-size:12px;cursor:pointer"><option value="<=" ${r.op==='<='?'selected':''}>≤</option><option value=">=" ${r.op==='>='?'selected':''}>≥</option></select>
        <input data-pb-rval="${i}" type="number" value="${r.value}" style="width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-resc="${i}" ${r.escalate?'checked':''} style="accent-color:var(--color-accent)">${i18t('set_flag_legal')}</label>
        <button data-pb-rmrng="${i}" title="${i18t('act_remove')}" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500);margin:0">${i18t('set_no_numeric_limits')}</p>`;
    // wire row inputs → live working copy
    pl.querySelectorAll('[data-pb-cat]').forEach(el=>el.addEventListener('input',()=>{ e.positions[+el.dataset.pbCat].category=el.value; }));
    pl.querySelectorAll('[data-pb-esc]').forEach(el=>el.addEventListener('change',()=>{ e.positions[+el.dataset.pbEsc].escalate=el.checked; }));
    pl.querySelectorAll('[data-pb-pos]').forEach(el=>el.addEventListener('click',()=>{ e.positions[+el.dataset.pbPos].pos=el.dataset.v; paint(); }));
    pl.querySelectorAll('[data-pb-rmpos]').forEach(el=>el.addEventListener('click',()=>{ e.positions.splice(+el.dataset.pbRmpos,1); paint(); }));
    rl.querySelectorAll('[data-pb-rlabel]').forEach(el=>el.addEventListener('input',()=>{ e.ranges[+el.dataset.pbRlabel].label=el.value; }));
    rl.querySelectorAll('[data-pb-rop]').forEach(el=>el.addEventListener('change',()=>{ e.ranges[+el.dataset.pbRop].op=el.value; }));
    rl.querySelectorAll('[data-pb-rval]').forEach(el=>el.addEventListener('input',()=>{ e.ranges[+el.dataset.pbRval].value=Number(el.value)||0; }));
    rl.querySelectorAll('[data-pb-resc]').forEach(el=>el.addEventListener('change',()=>{ e.ranges[+el.dataset.pbResc].escalate=el.checked; }));
    rl.querySelectorAll('[data-pb-rmrng]').forEach(el=>el.addEventListener('click',()=>{ e.ranges.splice(+el.dataset.pbRmrng,1); paint(); }));
  };
  paint();
  document.getElementById('pb-add-pos').addEventListener('click',()=>{ e.positions.push({category:'',pos:'preferred',escalate:false}); paint(); });
  document.getElementById('pb-add-rng').addEventListener('click',()=>{ e.ranges.push({key:'',label:'',op:'<=',value:30,escalate:true}); paint(); });
  document.getElementById('pb-cancel').addEventListener('click',closeModal);
  document.getElementById('pb-save').addEventListener('click',()=>{
    e.label=document.getElementById('pb-f-label').value.trim();
    if(!isBase){ const mv=document.getElementById('pb-f-match'); e.match=(mv?mv.value:'').split(',').map(s=>s.trim()).filter(Boolean); }
    if(!e.label){ toast(i18t('set_t_give_name'),'err'); return; }
    e.positions=e.positions.filter(p=>p.category&&p.category.trim());
    e.ranges=e.ranges.filter(r=>r.label&&r.label.trim());
    // help the review engine enforce the common numeric limits
    e.ranges.forEach(r=>{ if(/pay/i.test(r.label)) r.key='paymentDays'; else if(/liab/i.test(r.label)) r.key='liabilityMonths'; else if(!r.key) r.key=r.label.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24)||'limit'; });
    if(!isBase) e.extends='_default';
    savePlaybook(pb); closeModal(); renderPlaybookView(); toast(i18t('set_t_playbook_saved'));
  });
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
    <div class="flex justify-end gap-2 mt-2"><button id="ce-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="ce-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('act_save')}</button></div>
  </div>`);
  document.getElementById('ce-cancel').addEventListener('click',closeModal);
  document.getElementById('ce-save').addEventListener('click',()=>{
    ['category','name','preferred','fallback','guidance'].forEach(k=>cl[k]=document.getElementById('ce-'+k).value.trim());
    if(!cl.name||!cl.category){ toast(i18t('set_t_cat_name_required'),'err'); return; }
    if(idx>=0) lib[idx]=cl; else lib.push(cl);
    saveClauseLibrary(lib); closeModal(); renderClauseLibrary(); toast(i18t('set_clause_saved'));
  });
}

/* ---- E5 approval rules builder (Admin) ---- */
const AR_CONDS=()=>[['value',i18t('set_cond_value',{cur:jxCurrency()})],['folder',i18t('set_cond_folder')],['kind',i18t('set_cond_kind')],['foreignLaw',i18t('set_cond_foreign')],['deviation',i18t('set_cond_deviation')]];
function condLabel(cond){
  switch(cond.type){
    case 'value': return i18t('set_cond_value_is',{op:cond.op||'>=',amount:fmtMoneyShort(cond.value)});
    case 'folder': return i18t('set_cond_folder_is',{name:(FOLDERS[cond.value]||{}).name||cond.value});
    case 'kind': return i18t('set_cond_kind_is',{value:cond.value});
    case 'foreignLaw': return i18t('set_cond_foreign');
    case 'deviation': return i18t('set_cond_deviation');
    default: return cond.type;
  }
}
function renderApprovalRules(){
  const host=document.getElementById('approval-rules'); if(!host) return;
  const rules=approvalRules().slice().sort((a,b)=>(a.order||99)-(b.order||99));
  host.innerHTML=rules.length?rules.map((r,i)=>`
    <div style="border:1px solid var(--color-divider);border-radius:8px;background:var(--color-surface);padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:22px;height:22px;display:inline-grid;place-items:center;border-radius:50%;background:var(--tile-steel-bg);font-size:10px;font-weight:700;color:var(--tile-steel-fg);flex:none">${r.order||1}</span>
        <span style="font-size:12px;color:var(--color-text)"><b>${i18t('set_if')}</b> ${condLabel(r.cond)} <b>${i18t('set_then')}</b> ${approverLabelOf(r.approver)}</span>
        ${isAdmin()?`<span style="margin-left:auto;display:flex;gap:10px;font-size:11px;font-weight:600"><button data-ar-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">${i18t('set_edit_lower')}</button><button data-ar-del="${i}" style="background:none;border:0;cursor:pointer;color:var(--st-ruby-dot)">${i18t('set_remove_lower')}</button></span>`:''}
      </div>
    </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500)">${i18t('set_no_approval_rules')}</p>`;
  host.querySelectorAll('[data-ar-edit]').forEach(b=>b.addEventListener('click',()=>openApprovalRuleEditor(Number(b.getAttribute('data-ar-edit')))));
  host.querySelectorAll('[data-ar-del]').forEach(b=>b.addEventListener('click',()=>{ const rules2=approvalRules().slice(); rules2.splice(Number(b.getAttribute('data-ar-del')),1); saveApprovalRules(rules2); renderApprovalRules(); toast(i18t('set_rule_removed')); }));
}
function openApprovalRuleEditor(idx){
  const rules=approvalRules().slice();
  const r=idx>=0?JSON.parse(JSON.stringify(rules[idx])):{ id:'r_'+Math.random().toString(36).slice(2,7), order:rules.length+1, cond:{type:'value',op:'>=',value:5000000}, approver:{kind:'role',role:'admin'} };
  const members=(getUsers()||[]);
  openModal(`<div class="p-6">
    <h3 class="font-serif font-600 text-lg text-ink mb-3">${idx>=0?i18t('set_edit_rule'):i18t('set_add_rule')}</h3>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_order_lower_first')}</span>
      <input id="ar-order" type="number" min="1" value="${r.order||1}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_condition')}</span>
      <select id="ar-cond" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${AR_CONDS().map(([k,l])=>`<option value="${k}" ${r.cond.type===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <div id="ar-condval" class="mb-2.5"></div>
    <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('set_approver')}</span>
      <select id="ar-approver" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">
        <option value="role:admin" ${r.approver.kind==='role'&&r.approver.role==='admin'?'selected':''}>${i18t('set_any_admin')}</option>
        <option value="role:legal" ${r.approver.kind==='role'&&r.approver.role==='legal'?'selected':''}>${i18t('set_any_legal')}</option>
        ${members.map(m=>`<option value="member:${m.name}" ${r.approver.kind==='member'&&r.approver.name===m.name?'selected':''}>${m.name} (${roleName(m.role)})</option>`).join('')}
      </select></label>
    <div class="flex justify-end gap-2 mt-2"><button id="ar-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
      <button id="ar-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('set_save_rule')}</button></div>
  </div>`);
  const renderCondVal=()=>{ const t=document.getElementById('ar-cond').value; const h=document.getElementById('ar-condval');
    if(t==='value') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_threshold',{cur:jxCurrency()})}</span><input id="ar-cv" type="number" value="${r.cond.type==='value'?r.cond.value:5000000}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else if(t==='folder') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_value_stream')}</span><select id="ar-cv" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm">${Object.values(FOLDERS).map(f=>`<option value="${esc(f.id)}" ${r.cond.value===f.id?'selected':''}>${esc(f.name)}</option>`).join('')}</select></label>`;
    else if(t==='kind') h.innerHTML=`<label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('set_type_contains')}</span><input id="ar-cv" value="${r.cond.type==='kind'?(r.cond.value||''):''}" placeholder="${esc(i18t('set_ph_eg_lease'))}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm"/></label>`;
    else h.innerHTML=`<p class="text-[11px] text-ink/55">${i18t('set_no_extra_value')}</p>`; };
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
    saveApprovalRules(rules); closeModal(); renderApprovalRules(); toast(i18t('set_rule_saved'));
  });
}

/* ---- E8-T3 active sessions ---- */
async function loadSessions(){
  const host=document.getElementById('sessions-list'); if(!host) return;
  try{
    const r=await api('sessions'); const rows=r.sessions||[];
    host.innerHTML=rows.length?`<div style="display:flex;flex-direction:column;gap:6px">${rows.map(s=>{
      const ua=(s.ua||'').replace(/</g,'&lt;'); /* The BROWSER NAMES are proper nouns and stay as they are; only the two
         generic words are the platform's own. */
      const dev=/mobile/i.test(ua)?i18t('set_dev_mobile'):/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':i18t('set_dev_browser');
      return `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-divider);border-radius:4px;background:var(--color-surface);padding:7px 10px">
        <span style="min-width:0"><span style="font-size:12px;font-weight:600;color:var(--color-text)">${dev}${s.current?` <span style="font-size:9px;font-family:var(--font-mono);color:var(--color-accent-700)">${i18t('set_this_device')}</span>`:''}</span>
        <span style="display:block;font-size:10px;font-family:var(--font-mono);color:var(--color-neutral-500)">${s.ip||'—'} · ${i18t('set_last_seen',{when:s.lastSeen?fmtDT(s.lastSeen):'—'})}</span></span>
        ${s.current?'':`<button data-sess-revoke="${s.id}" style="margin-left:auto;font-size:11px;font-weight:600;color:var(--st-ruby-dot);background:none;border:0;cursor:pointer">${i18t('set_revoke')}</button>`}
      </div>`; }).join('')}</div>`:`<p style="font-size:11px;color:var(--color-neutral-500)">${i18t('set_no_active_sessions')}</p>`;
    host.querySelectorAll('[data-sess-revoke]').forEach(b=>b.addEventListener('click',async()=>{
      try{ await api('sessions/'+b.getAttribute('data-sess-revoke'),'DELETE'); toast(i18t('set_t_session_revoked')); loadSessions(); }
      catch(e){ toast(e.message,'err'); }
    }));
  }catch(e){ host.innerHTML=`<p style="font-size:11px;color:var(--color-neutral-500)">${i18t('set_could_not_load_sessions')}</p>`; }
}

Object.assign(window,{renderTeam,renderAllowancePanel,renderRateTable,renderClauseLibrary,openClauseEditor,renderApprovalRules,openApprovalRuleEditor,condLabel,loadSessions});
