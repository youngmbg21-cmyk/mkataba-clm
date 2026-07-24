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
      <span style="flex:1;min-width:0">${f.name}</span></label>`;
  openModal(`<div class="p-6" style="max-width:460px">
    <h3 class="font-serif font-600 text-lg text-ink mb-1">Folder access — ${(u.name||u.email).replace(/</g,'&lt;')}</h3>
    <p class="text-xs text-ink/60 mb-3">Grant every value stream, or restrict this member to a specific subset. Admins always keep full access.</p>
    <label style="display:flex;align-items:center;gap:9px;padding:9px;border:1px solid var(--color-divider);border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;margin-bottom:10px">
      <input type="checkbox" id="fa-all" ${isAll?'checked':''} style="width:16px;height:16px;accent-color:var(--color-accent)"/> All streams &amp; folders</label>
    <div id="fa-list" style="display:${isAll?'none':'grid'};grid-template-columns:1fr;gap:6px;max-height:300px;overflow:auto;margin-bottom:14px">${folders.map(fRow).join('')}</div>
    <div class="flex justify-end gap-2">
      <button id="fa-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">Cancel</button>
      <button id="fa-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">Save access</button></div>
  </div>`);
  const allBox=document.getElementById('fa-all'), list=document.getElementById('fa-list');
  allBox.addEventListener('change',()=>{ list.style.display=allBox.checked?'none':'grid'; });
  document.getElementById('fa-cancel').addEventListener('click',closeModal);
  document.getElementById('fa-save').addEventListener('click',async()=>{
    state.settings=state.settings||{}; state.settings.folderAccess=state.settings.folderAccess||{};
    if(allBox.checked){ delete state.settings.folderAccess[userId]; }
    else {
      const ids=[...document.querySelectorAll('[data-fa-folder]')].filter(cb=>cb.checked).map(cb=>cb.getAttribute('data-fa-folder'));
      if(!ids.length){ toast('Pick at least one stream, or choose All streams','err'); return; }
      state.settings.folderAccess[userId]=ids;
    }
    try{ await saveSettings(); }catch(e){ toast('Could not save access: '+e.message,'err'); return; }
    closeModal(); toast(`Folder access updated for ${u.name||u.email}`); renderTeam();
  });
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
  const dangerBtn='display:inline-flex;align-items:center;gap:6px;font-family:var(--font-mono);font-weight:600;font-size:12px;padding:5px 11px;background:var(--color-surface);color:#b0453c;border:1px solid #e3c9c4;border-radius:5px;cursor:pointer';
  const tagAccent='display:inline-flex;align-items:center;font-size:10.5px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:999px;background:var(--color-accent-200);color:var(--color-accent-800)';
  const avStyle='width:24px;height:24px;border-radius:50%;background:var(--color-accent-200);color:var(--color-accent-800);display:inline-grid;place-items:center;font-size:9px;font-weight:700;flex:none;font-family:var(--font-mono)';
  const roleTag=r=>{ const map={admin:['#eef4fb','#2c455d'],legal:['#fbf4e3','#7d5a14'],viewer:['#eceae6','#5d5d60']};
    const [bg,fg]=map[r]||map.viewer;
    return `display:inline-flex;align-items:center;font-size:10px;font-weight:600;letter-spacing:.04em;padding:3px 10px;border-radius:999px;background:${bg};color:${fg}`; };

  const users=getUsers();
  const totalStreams=Object.keys(FOLDERS).length;
  const accessSummary=x=>{
    if(x.role==='admin') return 'All streams';
    const v=(((state.settings||{}).folderAccess)||{})[x.id];
    if(v==null||v==='*'||(Array.isArray(v)&&!v.length)) return 'All streams';
    return `${v.length} of ${totalStreams} streams`;
  };
  const rows=users.map(x=>{
    const ini=x.name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const isMe=x.id===me.id;
    const canManage=isAdmin()&&!isMe;
    const restricted=x.role!=='admin' && accessSummary(x)!=='All streams';
    return `<tr style="border-bottom:1px solid var(--color-divider)">
      <td style="padding:8px 10px 8px 14px">
        <span style="display:flex;align-items:center;gap:8px;min-width:0">
          <span style="${avStyle}">${ini}</span>
          <span style="min-width:0">
            <span style="display:block;font-weight:500;color:var(--color-text)">${x.name}${isMe?' <span style="font-weight:400;color:var(--color-neutral-500);font-size:11px">(you)</span>':''}</span>
            <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${x.email}</span>
          </span>
        </span>
      </td>
      <td style="padding:8px 10px"><span style="${roleTag(x.role)}">${ROLE_LABEL[x.role]}</span></td>
      <td style="padding:8px 10px;white-space:nowrap">
        <span style="font-size:11.5px;color:${restricted?'#7d5a14':'var(--color-neutral-700)'}">${accessSummary(x)}</span>
        ${(isAdmin()&&x.role!=='admin')?`<button data-access-for="${x.id}" title="Edit folder access" style="margin-left:6px;font-size:10.5px;font-weight:600;color:var(--color-accent-800);background:none;border:0;cursor:pointer">Edit</button>`:''}
      </td>
      <td style="padding:8px 10px;font-size:11.5px;color:var(--color-neutral-700);white-space:nowrap">${x.status==='invited'?'Invited':'Active'}</td>
      <td style="padding:8px 14px 8px 10px;text-align:right;white-space:nowrap">
        ${canManage?`<select data-role-for="${x.id}" title="Change role" style="font-size:11px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:3px 6px;color:inherit;font-family:inherit;outline:none">
            ${['admin','legal','viewer'].map(r=>`<option value="${r}" ${x.role===r?'selected':''}>${ROLE_LABEL[r]}</option>`).join('')}
          </select>
          <button data-remove-user="${x.id}" style="margin-left:8px;font-size:11px;font-weight:600;color:#b0453c;background:none;border:0;cursor:pointer">Remove</button>`
        :`<span style="color:var(--color-neutral-400)">—</span>`}
      </td>
    </tr>`;
  }).join('');

  const limitField=(id,label,sub,min)=>`<label style="display:block">
      <span style="display:block;font-size:10px;color:var(--color-neutral-600);line-height:1.4">${label}<br><span style="color:var(--color-neutral-400)">${sub}</span></span>
      <input id="${id}" type="number" min="${min}" style="margin-top:3px;${inputMono}"/></label>`;

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="padding:16px 18px 28px">
    <div style="display:grid;grid-template-columns:1.5fr 1fr;gap:18px;align-items:start">

      <!-- ============ LEFT · MEMBERS (blueprint) ============ -->
      <section class="blueprint" style="background:var(--color-surface);box-shadow:var(--shadow-sm);border-radius:10px;overflow:hidden">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
          <h4 style="margin:0;font-family:var(--font-heading);font-weight:600;font-size:15px;color:var(--color-text)">Members · ${users.length}</h4>
          ${isAdmin()?`<button id="tm-invite" style="font-family:var(--font-mono);font-weight:600;font-size:12px;padding:4px 10px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;cursor:pointer;color:var(--color-accent-800)">+ Invite member</button>`:''}
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px">
            <thead>
              <tr style="text-align:left;border-bottom:1px solid var(--color-divider);color:var(--color-neutral-600);font-size:10px;letter-spacing:.08em;text-transform:uppercase">
                <th style="padding:8px 10px 8px 14px;font-weight:600">Member</th>
                <th style="padding:8px 10px;font-weight:600">Role</th>
                <th style="padding:8px 10px;font-weight:600">Folder access</th>
                <th style="padding:8px 10px;font-weight:600">Status</th>
                <th style="padding:8px 14px 8px 10px;font-weight:600;text-align:right">Manage</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${isAdmin()?`
        <div style="padding:12px 14px;border-top:1px solid var(--color-divider);background:var(--color-bg)">
          <div style="font-family:var(--font-mono);font-weight:600;font-size:11px;color:var(--color-neutral-700);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Add team member</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <input id="tm-name" type="text" placeholder="Full name" style="${inputStyle}"/>
            <input id="tm-email" type="email" placeholder="Work email" style="${inputStyle}"/>
            <input id="tm-title" type="text" placeholder="Title (e.g. CFO) — optional" style="${inputStyle}"/>
            <select id="tm-role" style="${inputStyle}">
              <option value="legal">Legal — edit &amp; sign</option>
              <option value="viewer">Viewer — read only</option>
              <option value="admin">Admin — full control</option>
            </select>
            <input id="tm-pass" type="password" placeholder="Temporary password (min 8)" style="${inputStyle}"/>
          </div>
          <button id="tm-add" style="margin-top:10px;${primaryBtn}">Add member</button>
        </div>
        <div style="padding:12px 14px;border-top:1px solid var(--color-divider)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px">
            <div style="font-family:var(--font-mono);font-weight:600;font-size:11px;color:var(--color-neutral-700);text-transform:uppercase;letter-spacing:.06em">Directory · ${(((state.settings||{}).directory)||[]).length} contact${(((state.settings||{}).directory)||[]).length===1?'':'s'}</div>
            <label style="${secondaryBtn}">${icon('upload','w-3.5 h-3.5')} Import CSV<input id="dir-import" type="file" accept=".csv,text/csv" style="display:none"/></label>
          </div>
          <div style="font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">Bulk-add signer contacts so titles &amp; emails auto-fill when adding signers on a contract. CSV columns: <b>Name, Email, Title</b>.${(((state.settings||{}).directory)||[]).length?` · <button id="dir-clear" style="color:#b0453c;background:none;border:0;cursor:pointer;font-weight:600;font-size:10.5px">Clear directory</button>`:''}</div>
        </div>`:''}
      </section>

      <!-- ============ RIGHT · SETTINGS STACK ============ -->
      <div style="display:flex;flex-direction:column;gap:18px">

        <section style="${cardStyle}">
          <h4 style="${h4Style}">Approval rules</h4>
          <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">IF a contract matches a condition THEN it needs the named approver before signing. Rules run in order — a lower order number approves first.</p>
          <div id="approval-rules"></div>
          ${isAdmin()?`<button id="ar-add" style="margin-top:8px;${secondaryBtn}">${icon('plus','w-3.5 h-3.5')} Add rule</button>`
            :`<p style="margin-top:6px;font-size:11px;color:var(--color-neutral-600)">Only an admin can change approval rules.</p>`}
        </section>

        <section style="${cardStyle}">
          <h4 style="${h4Style}">Renewal reminders</h4>
          <p style="font-size:11.5px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5">Email the contract owner ahead of every executed contract’s expiry.</p>
          <div style="display:flex;gap:6px">
            ${[90,60,30].map(d=>`<span style="${tagAccent}">${d} days</span>`).join('')}
          </div>
          <p style="font-size:10.5px;color:var(--color-neutral-600);margin:8px 0 0">Delivered by email via Resend.</p>
        </section>

        <section style="${cardStyle}">
          <h4 style="${h4Style}">AI engine</h4>
          <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 8px;line-height:1.5">Powers HaTi Copilot — chat, contract briefings and comparisons — plus natural-language filtering on the Portfolio Intelligence graph. Without a key, AI features fall back to the built-in interpreter.</p>
          <div id="ai-cfg-status" style="font-size:11px;color:var(--color-neutral-700);margin-bottom:8px">Checking…</div>
          ${isAdmin()?`
          <div style="display:flex;gap:8px;align-items:flex-end">
            <label style="flex:1;min-width:0"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:4px">Anthropic API key</span>
              <input id="ai-key" type="password" placeholder="sk-ant-…" style="${inputStyle}"/></label>
            <button id="ai-key-save" style="${primaryBtn}">Save key</button>
          </div>
          <button id="ai-key-clear" style="margin-top:6px;font-size:11px;font-weight:600;color:#b0453c;background:none;border:0;cursor:pointer;padding:0">Remove key</button>
          ${API_MODE()?`
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text)">Model routing</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 8px">Leave an override blank to use the recommended default.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
              <div style="border:1px solid var(--color-divider);border-radius:4px;padding:8px">
                <div style="font-size:11px;font-weight:600;color:var(--color-text)">Fast tier</div>
                <div style="font-size:10px;color:var(--color-neutral-500);margin:2px 0 4px">Search · graph · extraction</div>
                <div style="font-size:10px;color:var(--color-neutral-700);margin-bottom:4px">Current: <span id="ai-model-fast-cur" style="font-family:var(--font-mono)">—</span></div>
                <input id="ai-model-fast" type="text" placeholder="default (recommended)" style="${inputMono}"/>
              </div>
              <div style="border:1px solid var(--color-divider);border-radius:4px;padding:8px">
                <div style="font-size:11px;font-weight:600;color:var(--color-text)">Deep tier</div>
                <div style="font-size:10px;color:var(--color-neutral-500);margin:2px 0 4px">Playbook review · obligations</div>
                <div style="font-size:10px;color:var(--color-neutral-700);margin-bottom:4px">Current: <span id="ai-model-deep-cur" style="font-family:var(--font-mono)">—</span></div>
                <input id="ai-model-deep" type="text" placeholder="default (recommended)" style="${inputMono}"/>
              </div>
            </div>
            <details style="font-size:11px;margin-top:8px">
              <summary style="cursor:pointer;color:var(--color-neutral-600)">Advanced: override every tier</summary>
              <div style="margin-top:6px;display:flex;flex-wrap:wrap;align-items:center;gap:8px">
                <input id="ai-model-global" type="text" placeholder="(none)" style="${inputMono};width:220px"/>
                <span style="font-size:10px;color:var(--color-neutral-500)">Forces this one model for both tiers (<span style="font-family:var(--font-mono)">ANTHROPIC_MODEL</span>).</span>
              </div>
            </details>
            <button id="ai-model-save" style="margin-top:8px;${primaryBtnSm}">Save model settings</button>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text)">Usage &amp; cost controls</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:2px 0 6px">Each AI request calls Anthropic and costs money. These limits guard against runaway loops and surprise bills.</p>
            <div id="ai-usage" style="font-size:11px;color:var(--color-neutral-700);margin-bottom:4px">Today: —</div>
            <div style="height:6px;background:var(--color-neutral-200);border-radius:3px;overflow:hidden;margin-bottom:10px"><div id="ai-usage-bar" style="width:0%;height:100%;background:var(--color-accent);transition:width .3s"></div></div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
              ${limitField('ai-rate-light','Light req / 15 min · per user','search, graph, template, extract',1)}
              ${limitField('ai-rate-deep','Deep req / 15 min · per user','playbook review, obligations',1)}
              ${limitField('ai-daily','Daily ceiling · workspace','0 disables the daily backstop',0)}
              ${limitField('ai-maxchars','Max characters / request','longer input is shortened first',1000)}
              ${limitField('ai-maxcontracts','Max contracts / request','portfolio-wide AI calls',1)}
            </div>
            <button id="ai-limits-save" style="margin-top:8px;${primaryBtnSm}">Save limits</button>
          </div>

          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider)">
            <div style="font-size:12px;font-weight:600;color:var(--color-text);margin-bottom:2px">File existing contracts</div>
            <p style="font-size:10.5px;color:var(--color-neutral-600);margin:0 0 8px;line-height:1.5">Extract structured details (counterparty, dates, value, renewal terms, governing law) from uploaded contracts that don't have them yet. Each is presented for your review before saving — nothing is written automatically.</p>
            <button id="meta-backfill" style="${secondaryBtn}">${icon('sparkle','w-3.5 h-3.5')} <span id="meta-backfill-lbl">Extract metadata for existing contracts</span></button>
          </div>`:`
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-divider);font-size:10.5px;color:var(--color-neutral-600);line-height:1.5">Local mode: the key is stored only in this browser, and HaTi Copilot calls Anthropic directly from this browser with it. Saving clears the input box for safety — the key is kept (see the status above). Run the HaTi server for team-shared keys, model routing and usage limits.</div>`}`
          :`<p style="font-size:11px;color:var(--color-neutral-600)">Only an admin can configure the AI key.</p>`}
        </section>

      <section style="${cardStyle}">
        <h4 style="${h4Style}">Data &amp; backup</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">${API_MODE()?'This workspace runs on your HaTi server — every device sees the same contracts and accounts. Export a backup any time for your records.':'This build stores everything in this browser’s local storage. Export a backup to move workspaces between machines — run the HaTi server for central storage.'}</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          <button id="bk-export" style="${secondaryBtn}">${icon('download','w-3.5 h-3.5')} Export backup</button>
          ${(API_MODE()&&isAdmin())?`<a id="bk-zip" href="api/export/workspace.zip" style="${secondaryBtn};text-decoration:none">${icon('download','w-3.5 h-3.5')} Full workspace (.zip)</a>`:''}
          ${(!API_MODE()&&isAdmin())?`
          <label style="${secondaryBtn};cursor:pointer">${icon('upload','w-3.5 h-3.5')} Restore backup<input id="bk-import" type="file" accept=".json,application/json" style="display:none"/></label>
          <button id="bk-reset" style="margin-left:auto;${dangerBtn}">${icon('ban','w-3.5 h-3.5')} Reset workspace</button>`:''}
        </div>
      </section>

      ${(API_MODE())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">Active sessions</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">Devices signed in to your account. Revoke any you don't recognise — sessions also expire automatically after 30 days.</p>
        <div id="sessions-list" style="font-size:12px;color:var(--color-neutral-700)">Loading…</div>
      </section>`:''}

      ${(API_MODE())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">My notifications</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">When a counterparty responds to a contract you shared (signs, requests changes or declines), you're always emailed. First-open alerts are optional:</p>
        <label style="display:flex;align-items:flex-start;gap:10px;border:1px solid var(--color-divider);border-radius:5px;padding:10px;cursor:pointer;font-size:12px">
          <input id="pref-share-opens" type="checkbox" ${me&&me.prefs&&me.prefs.notifyShareOpens?'checked':''} style="margin-top:1px;width:15px;height:15px;accent-color:var(--color-accent);flex:none"/>
          <span><span style="font-weight:600;display:block">Email me on first open</span>
          <span style="color:var(--color-neutral-600);display:block;line-height:1.4">Get one email the first time a counterparty opens a contract you shared.</span></span>
        </label>
      </section>`:''}

      ${(API_MODE()&&isAdmin())?`
      <section style="${cardStyle}">
        <h4 style="${h4Style}">Email &amp; notifications</h4>
        <p style="font-size:11px;color:var(--color-neutral-700);margin:0 0 10px;line-height:1.5">Contract share links, counterparty response alerts, share nudges (3 days unopened), renewal reminders (90/60/30 days out), team invites, password resets and counterparty signing codes are sent by email. Set a <span style="font-family:var(--font-mono)">RESEND_API_KEY</span> on the server to turn on real delivery — until then, messages (and one-time codes) appear in the outbox below for testing.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px">
          <button id="rem-run" style="${secondaryBtn}">${icon('clock','w-3.5 h-3.5')} Check renewals &amp; queue reminders</button>
          <button id="ob-refresh" style="${secondaryBtn}">${icon('history','w-3.5 h-3.5')} Refresh outbox</button>
        </div>
        <div id="outbox-list" style="font-size:12px;color:var(--color-neutral-700)">Loading outbox…</div>
      </section>`:''}
      </div>
    </div>
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

  document.getElementById('pref-share-opens')?.addEventListener('change',async e=>{
    try{
      const r=await api('me/prefs','PUT',{ notifyShareOpens:e.target.checked });
      if(REMOTE&&REMOTE.me) REMOTE.me.prefs=r.prefs;
      toast(e.target.checked?'First-open alerts on':'First-open alerts off');
    }catch(err){ toast(err.message,'err'); e.target.checked=!e.target.checked; }
  });
  document.getElementById('tm-invite')?.addEventListener('click',()=>{ const n=document.getElementById('tm-name'); if(n){ n.scrollIntoView({block:'nearest'}); n.focus(); } });
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
        const cap=use.dailyLimit||0;
        const uEl=document.getElementById('ai-usage');
        if(uEl){
          uEl.innerHTML=cap>0
            ?`<b>${use.count||0}</b> of <b>${cap}</b> AI requests today (${use.date||''})`
            :`<b>${use.count||0}</b> AI requests today (${use.date||''}) · daily ceiling disabled`; }
        const uBar=document.getElementById('ai-usage-bar');
        if(uBar){ const pct=cap>0?Math.min(100,Math.round((use.count||0)/cap*100)):0; uBar.style.width=pct+'%'; }
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
      if(!await confirmDialog({title:'Remove the stored AI key?', message:'AI features will fall back to the built-in interpreter until a new key is added.', confirmLabel:'Remove key', danger:true})) return;
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
  // local mode: no server to hold the key — persist it in this browser so the
  // field is present and remembered; AI still uses the built-in interpreter.
  if(!API_MODE() && isAdmin()){
    const st=document.getElementById('ai-cfg-status');
    const refresh=()=>{ if(!st) return; const k=lsGet('hati.v1.aikey');
      st.innerHTML=k?`<span style="color:#1e6b4d;font-weight:600">● Configured</span> · key ••••${String(k).slice(-4)} stored in this browser — Copilot is live.`
                    :`<span style="color:#7d5a14;font-weight:600">● Not configured</span> — Copilot and AI features use the built-in interpreter.`; };
    refresh();
    // reflect the key change immediately in the sidebar status + AI panel header
    const refreshAiIndicators=()=>{ if(typeof renderSideUser==='function') renderSideUser(); if(typeof updateAiBrainPill==='function') updateAiBrainPill(); };
    document.getElementById('ai-key-save')?.addEventListener('click',()=>{
      const inp=document.getElementById('ai-key'); const key=(inp?.value||'').trim();
      if(!key){ toast('Enter a key to save','err'); return; }
      lsSet('hati.v1.aikey', key); inp.value='';
      toast('Key saved (ending ••••'+key.slice(-4)+') — HaTi Copilot is now live'); refresh(); refreshAiIndicators();
    });
    document.getElementById('ai-key-clear')?.addEventListener('click',async()=>{
      if(!await confirmDialog({title:'Remove the stored AI key?', message:'HaTi Copilot and AI features will fall back to the built-in interpreter.', confirmLabel:'Remove key', danger:true})) return;
      localStorage.removeItem('hati.v1.aikey'); toast('AI key removed'); refresh(); refreshAiIndicators();
    });
  }
  document.getElementById('meta-backfill')?.addEventListener('click',()=>runMetaBackfill());
  document.getElementById('tm-add')?.addEventListener('click',async()=>{
    const name=fval('tm-name'), email=fval('tm-email').toLowerCase(), role=document.getElementById('tm-role').value;
    const title=fval('tm-title'), pass=document.getElementById('tm-pass').value;
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
    // Mirror the member into the directory (with their title) so signer fields auto-fill.
    state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
    const ex=dir.find(p=>(p.email||'').toLowerCase()===email);
    if(ex){ ex.name=name; if(title) ex.title=title; } else dir.push({ name, email, title:title||'' });
    state.settings.directory=dir; saveSettings();
    toast(`${name} added as ${ROLE_LABEL[role]}${API_MODE()?' — an invite email was queued':' — share their temporary password securely'}`);
    renderTeam();
  });
  document.querySelectorAll('[data-access-for]').forEach(b=>b.addEventListener('click',()=>openFolderAccessEditor(b.getAttribute('data-access-for'))));
  document.getElementById('dir-import')?.addEventListener('change',e=>{
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=async()=>{
      const parsed=parseDirectoryCsv(rd.result);
      if(!parsed.length){ toast('No Name/Email rows found in that CSV','err'); return; }
      state.settings=state.settings||{}; const dir=(state.settings.directory||[]).slice();
      const byEmail={}; dir.forEach(p=>{ if(p.email) byEmail[p.email.toLowerCase()]=p; });
      let added=0, updated=0;
      parsed.forEach(r=>{ const k=(r.email||'').toLowerCase();
        if(k && byEmail[k]){ const p=byEmail[k]; if(r.name)p.name=r.name; if(r.title)p.title=r.title; updated++; }
        else { const p={ name:r.name||'', email:r.email||'', title:r.title||'' }; dir.push(p); if(k)byEmail[k]=p; added++; } });
      state.settings.directory=dir;
      try{ await saveSettings(); }catch(err){ toast('Import saved locally but server sync failed: '+err.message,'err'); }
      toast(`Directory import: ${added} added${updated?`, ${updated} updated`:''}`);
      renderTeam();
    };
    rd.readAsText(f); e.target.value='';
  });
  document.getElementById('dir-clear')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:'Clear the directory?', message:'Removes all imported contacts. Team members are not affected.', confirmLabel:'Clear directory', danger:true})) return;
    state.settings=state.settings||{}; state.settings.directory=[]; await saveSettings();
    toast('Directory cleared'); renderTeam();
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
    if(!u) return;
    if(!await confirmDialog({title:`Remove ${u.name}?`, message:`${u.name} will lose access to this workspace. You can re-invite them later.`, confirmLabel:'Remove member', danger:true})) return;
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
    rd.onload=async()=>{ let b;
      try{ b=JSON.parse(rd.result); if(b.kind!=='hati-backup'||!b.org||!b.users) throw new Error('bad'); }
      catch(err){ toast('That file is not a valid HaTi backup','err'); return; }
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
          <button data-cl-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">edit</button>
          <button data-cl-del="${i}" style="background:none;border:0;cursor:pointer;color:#b0453c">remove</button></span>`:''}
      </div>
      <div style="margin-top:4px;font-size:11px;color:var(--color-neutral-600)"><b>Preferred:</b> ${(cl.preferred||'').slice(0,140).replace(/</g,'&lt;')}${(cl.preferred||'').length>140?'…':''}</div>
    </div>`).join('')||`<p style="font-size:11px;color:var(--color-neutral-500)">No clauses in the library.</p>`;
  host.querySelectorAll('[data-cl-edit]').forEach(b=>b.addEventListener('click',()=>openClauseEditor(Number(b.getAttribute('data-cl-edit')))));
  host.querySelectorAll('[data-cl-del]').forEach(b=>b.addEventListener('click',()=>{ const i=Number(b.getAttribute('data-cl-del')); const lib2=clauseLibrary().slice(); lib2.splice(i,1); saveClauseLibrary(lib2); renderClauseLibrary(); toast('Clause removed'); }));
  document.getElementById('cl-add')?.addEventListener('click',()=>openClauseEditor(-1));
  renderPlaybookView();
}
/* ---- playbook viewer + editor (Admin / Legal) ---- */
const PB_ESC = s => String(s==null?'':s).replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
const PB_ATTR = s => String(s==null?'':s).replace(/"/g,'&quot;');
// position chip — red for required/forbidden, steel for preferred; ⚑ = escalate
function pbPosChip(pos){
  const hard=pos.pos==='required'||pos.pos==='forbidden';
  return `<span style="font-size:9.5px;font-family:var(--font-mono);border-radius:999px;padding:2px 9px;${hard?'background:#fdece9;color:#8f322b':'background:#eef4fb;color:#2c455d'}">${PB_ESC(pos.category)}${pos.escalate?' ⚑':''}</span>`;
}
const pbRangeChip = rg => `<span style="font-size:9.5px;font-family:var(--font-mono);border-radius:999px;padding:2px 9px;background:#fbf4e3;color:#7d5a14">${PB_ESC(rg.label)} ${rg.op} ${rg.value}${rg.escalate?' ⚑':''}</span>`;
function renderPlaybookView(){
  const pv=document.getElementById('playbook-view'); if(!pv) return;
  const canEditPb=isAdmin()||currentUser()?.role==='legal';
  const pb=playbook();
  const base=pb._default||DEFAULT_PLAYBOOK._default;
  const card=(key,label,positions,ranges,removable,baseline)=>`
    <div style="margin-bottom:${baseline?'12px':'8px'};border:1px solid ${baseline?'var(--color-accent-300)':'var(--color-divider)'};border-left:3px solid ${baseline?'var(--color-accent)':'var(--color-divider)'};border-radius:8px;background:${baseline?'var(--color-accent-100)':'var(--color-surface)'};padding:${baseline?'11px 13px':'10px 12px'}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:${baseline?'2px':'6px'}">
        <span style="font-size:11.5px;font-weight:${baseline?700:600};color:${baseline?'var(--color-accent-900)':'var(--color-text)'}">${PB_ESC(label)}</span>
        ${baseline?`<span style="font-size:8.5px;font-family:var(--font-mono);letter-spacing:.06em;text-transform:uppercase;font-weight:700;color:#fff;background:var(--color-accent);border-radius:999px;padding:2px 8px">Applies to all</span>`:''}
        ${canEditPb?`<span style="margin-left:auto;display:flex;gap:10px;font-size:11px;font-weight:600">
          <button data-pb-edit="${key}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">edit</button>
          ${removable?`<button data-pb-del="${key}" style="background:none;border:0;cursor:pointer;color:#b0453c">remove</button>`:''}
        </span>`:''}
      </div>
      ${baseline?`<div style="font-size:10px;color:var(--color-accent-800);margin-bottom:7px">The default positions every contract inherits — change these to shift the whole portfolio.</div>`:''}
      <div style="display:flex;flex-wrap:wrap;gap:5px">${positions.map(pbPosChip).join('')}${ranges.map(pbRangeChip).join('')||(positions.length?'':'<span style="font-size:11px;color:var(--color-neutral-500)">No positions yet</span>')}</div>
    </div>`;
  const baseCard=card('_default','All contracts (baseline)', base.positions||[], base.ranges||[], false, true);
  const typeCards=Object.keys(pb).filter(k=>k!=='_default').map(k=>{ const rp=resolvePlaybook(k); return card(k, pb[k].label||k, rp.positions, rp.ranges, true); }).join('');
  pv.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:12px;font-weight:600;color:var(--color-text)">Playbook positions by contract type</span>
      ${canEditPb?`<span style="margin-left:auto;display:flex;gap:8px">
        <button id="pb-add" class="ui-btn ui-btn-primary" style="font-size:11px;padding:4px 10px">${icon('plus','w-3 h-3')} Add type</button>
        <button id="pb-reset" style="font-size:11px;font-weight:600;color:var(--color-neutral-600);background:none;border:0;cursor:pointer">Reset to defaults</button>
      </span>`:''}
    </div>
    ${baseCard}${typeCards}
    <p style="font-size:10px;color:var(--color-neutral-500);margin-top:4px">⚑ = deviation requires Legal approval. The AI review checks incoming paper against these positions.${canEditPb?' Baseline positions apply to every contract; each type adds its own on top.':''}</p>`;
  if(!canEditPb) return;
  pv.querySelectorAll('[data-pb-edit]').forEach(b=>b.addEventListener('click',()=>openPlaybookEditor(b.getAttribute('data-pb-edit'))));
  pv.querySelectorAll('[data-pb-del]').forEach(b=>b.addEventListener('click',async()=>{
    const key=b.getAttribute('data-pb-del'); const cur=playbook();
    if(!await confirmDialog({title:`Remove “${cur[key]?.label||key}”?`, message:'Contracts of this type will fall back to the baseline playbook.', confirmLabel:'Remove type', danger:true})) return;
    const pb2=JSON.parse(JSON.stringify(cur)); delete pb2[key]; savePlaybook(pb2); renderPlaybookView(); toast('Contract type removed');
  }));
  document.getElementById('pb-add')?.addEventListener('click',()=>openPlaybookEditor(null));
  document.getElementById('pb-reset')?.addEventListener('click',async()=>{
    if(!await confirmDialog({title:'Reset the playbook to defaults?', message:'This discards your custom positions, thresholds and contract types and restores the built-in Kenyan-practice playbook.', confirmLabel:'Reset playbook', danger:true})) return;
    state.settings=state.settings||{}; delete state.settings.playbook; if(typeof saveSettings==='function') saveSettings();
    renderPlaybookView(); toast('Playbook reset to defaults');
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
  const POS=[['required','Required'],['preferred','Preferred'],['forbidden','Forbidden']];
  const inp='width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:6px 8px;font:inherit;font-size:12.5px;color:inherit;outline:none';
  openModal(`<div style="padding:20px 22px">
    <h3 style="font-family:var(--font-heading);font-weight:600;font-size:16px;margin:0 0 12px">${isNew?'Add contract type':isBase?'Edit baseline positions':'Edit playbook — '+PB_ESC(e.label||key)}</h3>
    <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:3px">${isBase?'Name':'Contract type name'}</span>
      <input id="pb-f-label" value="${PB_ATTR(e.label||'')}" placeholder="${isBase?'Baseline':'e.g. Distribution & logistics'}" style="${inp}"></label>
    ${!isBase?`<label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;color:var(--color-text);margin-bottom:3px">Applies to contracts matching <span style="font-weight:400;color:var(--color-neutral-500)">(comma-separated keywords in the contract type; leave blank for the built-in types)</span></span>
      <input id="pb-f-match" value="${PB_ATTR(e.match.join(', '))}" placeholder="e.g. distribution, warehousing, freight" style="${inp}"></label>
    <div style="font-size:10.5px;color:var(--color-neutral-600);background:var(--color-bg);border:1px solid var(--color-divider);border-radius:6px;padding:7px 9px;margin-bottom:12px">Inherited from baseline: <span style="display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle">${inherited.positions.map(pbPosChip).join('')}${inherited.ranges.map(pbRangeChip).join('')}</span></div>`:''}

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:11px;font-weight:600;color:var(--color-text)">${isBase?'Positions':'Positions specific to this type'}</span><button id="pb-add-pos" style="margin-left:auto;font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">+ Add position</button></div>
    <div id="pb-pos-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px"></div>

    <div style="display:flex;align-items:center;margin:0 0 6px"><span style="font-size:11px;font-weight:600;color:var(--color-text)">Numeric limits</span><button id="pb-add-rng" style="margin-left:auto;font-size:11px;font-weight:600;color:var(--color-accent-700);background:none;border:0;cursor:pointer">+ Add limit</button></div>
    <div id="pb-rng-list" style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px"></div>

    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="pb-cancel" class="ui-btn" style="font-size:12px;padding:6px 14px">Cancel</button>
      <button id="pb-save" class="ui-btn ui-btn-primary" style="font-size:12px;padding:6px 16px">Save</button>
    </div>
  </div>`, {maxWidth:'34rem'});

  const seg=(i)=>POS.map(([v,l])=>{ const on=e.positions[i].pos===v; const hard=v==='required'||v==='forbidden';
    return `<button data-pb-pos="${i}" data-v="${v}" style="font-size:10.5px;font-weight:600;border:1px solid ${on?(hard?'#d9a59d':'var(--color-accent)'):'var(--color-divider)'};background:${on?(hard?'#fdece9':'var(--color-accent-100)'):'var(--color-surface)'};color:${on?(hard?'#8f322b':'var(--color-accent-800)'):'var(--color-neutral-600)'};padding:4px 9px;border-radius:6px;cursor:pointer">${l}</button>`; }).join('');
  const paint=()=>{
    const pl=document.getElementById('pb-pos-list');
    pl.innerHTML=e.positions.length?e.positions.map((p,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:7px;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-cat="${i}" value="${PB_ATTR(p.category||'')}" placeholder="Category e.g. Confidentiality" style="flex:1;min-width:150px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <span style="display:inline-flex;gap:3px">${seg(i)}</span>
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-esc="${i}" ${p.escalate?'checked':''} style="accent-color:var(--color-accent)">⚑ Legal</label>
        <button data-pb-rmpos="${i}" title="Remove" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500);margin:0">No specific positions${isBase?'':' — this type only inherits the baseline'}.</p>`;
    const rl=document.getElementById('pb-rng-list');
    rl.innerHTML=e.ranges.length?e.ranges.map((r,i)=>`
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;border:1px solid var(--color-divider);border-radius:7px;padding:7px 8px;background:var(--color-bg)">
        <input data-pb-rlabel="${i}" value="${PB_ATTR(r.label||'')}" placeholder="Label e.g. Payment terms" style="flex:1;min-width:120px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <select data-pb-rop="${i}" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 6px;font:inherit;font-size:12px;cursor:pointer"><option value="<=" ${r.op==='<='?'selected':''}>≤</option><option value=">=" ${r.op==='>='?'selected':''}>≥</option></select>
        <input data-pb-rval="${i}" type="number" value="${r.value}" style="width:74px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:6px;padding:5px 7px;font:inherit;font-size:12px;outline:none">
        <label style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;color:var(--color-neutral-700);white-space:nowrap"><input type="checkbox" data-pb-resc="${i}" ${r.escalate?'checked':''} style="accent-color:var(--color-accent)">⚑ Legal</label>
        <button data-pb-rmrng="${i}" title="Remove" style="background:none;border:0;cursor:pointer;color:var(--color-neutral-500);font-size:15px;line-height:1;padding:0 2px">×</button>
      </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500);margin:0">No numeric limits. Payment-terms and liability-cap limits are auto-checked by the review engine.</p>`;
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
    if(!e.label){ toast('Give this a name','err'); return; }
    e.positions=e.positions.filter(p=>p.category&&p.category.trim());
    e.ranges=e.ranges.filter(r=>r.label&&r.label.trim());
    // help the review engine enforce the common numeric limits
    e.ranges.forEach(r=>{ if(/pay/i.test(r.label)) r.key='paymentDays'; else if(/liab/i.test(r.label)) r.key='liabilityMonths'; else if(!r.key) r.key=r.label.toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,24)||'limit'; });
    if(!isBase) e.extends='_default';
    savePlaybook(pb); closeModal(); renderPlaybookView(); toast('Playbook saved');
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
    <div style="border:1px solid var(--color-divider);border-radius:8px;background:var(--color-surface);padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="width:22px;height:22px;display:inline-grid;place-items:center;border-radius:50%;background:var(--tile-steel-bg);font-size:10px;font-weight:700;color:var(--tile-steel-fg);flex:none">${r.order||1}</span>
        <span style="font-size:12px;color:var(--color-text)"><b>IF</b> ${condLabel(r.cond)} <b>THEN</b> ${approverLabelOf(r.approver)}</span>
        ${isAdmin()?`<span style="margin-left:auto;display:flex;gap:10px;font-size:11px;font-weight:600"><button data-ar-edit="${i}" style="background:none;border:0;cursor:pointer;color:var(--color-accent-700)">edit</button><button data-ar-del="${i}" style="background:none;border:0;cursor:pointer;color:#b0453c">remove</button></span>`:''}
      </div>
    </div>`).join(''):`<p style="font-size:11px;color:var(--color-neutral-500)">No approval rules — contracts can be signed without sign-off.</p>`;
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
    host.innerHTML=rows.length?`<div style="display:flex;flex-direction:column;gap:6px">${rows.map(s=>{
      const ua=(s.ua||'').replace(/</g,'&lt;'); const dev=/mobile/i.test(ua)?'Mobile':/chrome/i.test(ua)?'Chrome':/firefox/i.test(ua)?'Firefox':/safari/i.test(ua)?'Safari':'Browser';
      return `<div style="display:flex;align-items:center;gap:8px;border:1px solid var(--color-divider);border-radius:4px;background:var(--color-surface);padding:7px 10px">
        <span style="min-width:0"><span style="font-size:12px;font-weight:600;color:var(--color-text)">${dev}${s.current?' <span style="font-size:9px;font-family:var(--font-mono);color:var(--color-accent-700)">· this device</span>':''}</span>
        <span style="display:block;font-size:10px;font-family:var(--font-mono);color:var(--color-neutral-500)">${s.ip||'—'} · last seen ${s.lastSeen?fmtDT(s.lastSeen):'—'}</span></span>
        ${s.current?'':`<button data-sess-revoke="${s.id}" style="margin-left:auto;font-size:11px;font-weight:600;color:#b0453c;background:none;border:0;cursor:pointer">Revoke</button>`}
      </div>`; }).join('')}</div>`:`<p style="font-size:11px;color:var(--color-neutral-500)">No active sessions.</p>`;
    host.querySelectorAll('[data-sess-revoke]').forEach(b=>b.addEventListener('click',async()=>{
      try{ await api('sessions/'+b.getAttribute('data-sess-revoke'),'DELETE'); toast('Session revoked'); loadSessions(); }
      catch(e){ toast(e.message,'err'); }
    }));
  }catch(e){ host.innerHTML='<p style="font-size:11px;color:var(--color-neutral-500)">Could not load sessions.</p>'; }
}

Object.assign(window,{renderTeam,renderClauseLibrary,openClauseEditor,renderApprovalRules,openApprovalRuleEditor,condLabel,loadSessions});
