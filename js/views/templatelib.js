// HaTi — Template Library (company standard templates).
//
// Distinct from the Templates page (js/views/library.js): that screen holds
// the built-in Kenyan papers and the older settings-blob custom templates.
// This library is the structured, versioned model from the Template Library
// brief — a template is the PARENT of contracts, made of blocks and typed
// fields, published immutably, and permissioned: Admin + Legal manage,
// everyone else sees published templates and creates contracts from them.
//
// Server is the source of truth (SQLite tables, /api/templates*). This view
// keeps no local copy beyond the render cache below, so the library reads the
// same for every member of the org.

const TPLLIB_CATEGORIES = {
  sales: 'Sales', procurement: 'Procurement', employment: 'Employment',
  nda: 'NDA', other: 'Other',
};
const TPLLIB_STATUS = {
  draft:     { label: 'Draft',     bg: '#fdf3e2', fg: '#8a5a19', dot: '#c98a2b' },
  published: { label: 'Published', bg: '#e8f4ee', fg: '#1e6b4d', dot: '#2e8763' },
  archived:  { label: 'Archived',  bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-600)', dot: 'var(--color-neutral-400)' },
};
const TPLLIB_ORIGIN = {
  upload: 'Converted from an uploaded document',
  saved_from_contract: 'Saved from a contract',
  built_in_hati: 'Built in HaTi',
};

// render cache — refreshed on every visit, never persisted
let _tplLib = { list: [], canManage: false, loaded: false };
const tplLibCanManage = () => _tplLib.canManage;
/* The list loads async. If the reader has already drilled into a detail or
   the builder by the time the fetch lands, painting the list over it would
   throw their work away — the token says "this response is stale, drop it". */
let _tplLibTok = 0;
const tplLibCancelPending = () => { _tplLibTok++; };

function tplLibStatusBadge(status) {
  const s = TPLLIB_STATUS[status] || TPLLIB_STATUS.draft;
  return `<span class="badge" style="background:${s.bg};color:${s.fg}"><span class="dot" style="background:${s.dot}"></span>${s.label}</span>`;
}

/* ---------- the library screen ---------- */
function renderTemplateLibrary() {
  const host = document.getElementById('content');
  if (!API_MODE()) {
    host.innerHTML = `<div class="view-enter" style="padding:40px;text-align:center;color:var(--color-neutral-600);font-size:13px">
      The template library lives on the server, so every member sees the same library.<br>It is not available in local demo mode.</div>`;
    return;
  }
  host.innerHTML = `<div class="view-enter" style="padding:40px;text-align:center;color:var(--color-neutral-500);font-size:12.5px">Loading the library…</div>`;
  const tok = ++_tplLibTok;
  api('templates').then(d => {
    _tplLib = { list: d.templates || [], canManage: !!d.canManage, loaded: true };
    if (tok === _tplLibTok && state.view === 'tpl-library') tplLibPaint();
  }).catch(e => {
    host.innerHTML = `<div class="view-enter" style="padding:40px;text-align:center;color:#8f322b;font-size:13px">The library could not be loaded: ${esc(e.message)}</div>`;
  });
}

function tplLibPaint() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const canManage = tplLibCanManage();
  const list = _tplLib.list;
  const fmtDay = iso => iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const rows = list.map(t => `
    <button data-tpllib-open="${t.id}" class="w-full text-left" style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--color-divider);background:none;cursor:pointer">
      <span style="width:34px;height:34px;flex:none;display:grid;place-items:center;border-radius:10px;background:var(--tile-steel-bg);color:var(--tile-steel-fg)">${icon('copy', 'w-4 h-4')}</span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.name)}</span>
        <span style="display:block;font-size:10.5px;color:var(--color-neutral-600)">${TPLLIB_CATEGORIES[t.category] || 'Other'} · ${esc(TPLLIB_ORIGIN[t.origin] || '')}</span>
      </span>
      <span style="flex:none;font-family:var(--font-mono);font-size:11px;color:var(--color-accent-700)" title="Current published version">${t.publishedVersion ? 'v' + t.publishedVersion : (canManage ? 'v' + t.latestVersion + ' draft' : '—')}</span>
      <span style="flex:none;font-size:11px;color:var(--color-neutral-600);min-width:86px;text-align:right" title="Contracts created from this template">${t.contractsCreated} contract${t.contractsCreated === 1 ? '' : 's'}</span>
      <span style="flex:none;font-size:11px;color:var(--color-neutral-600);min-width:92px;text-align:right" title="Last used">${fmtDay(t.lastUsedAt)}</span>
      <span style="flex:none">${tplLibStatusBadge(t.status)}</span>
      <span style="flex:none;color:var(--color-neutral-400)">${icon('chevR', 'w-3.5 h-3.5')}</span>
    </button>`).join('');

  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:16px">
    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">Company standard templates</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">${list.length} in the library</span>
        <span style="flex:1"></span>
        ${canManage ? `<button id="tpllib-new" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('plus', 'w-3.5 h-3.5')} New template</button>` : ''}
      </div>
      ${list.length ? rows : `<div style="padding:34px;text-align:center;color:var(--color-neutral-500);font-size:12.5px">
        ${canManage
          ? 'No standard templates yet. Create one, save an existing contract as a template, or convert an uploaded document.'
          : 'No published templates yet — a template manager (Admin or Legal) publishes them here.'}</div>`}
    </section>
    ${canManage ? `<p style="margin:0;font-size:11px;color:var(--color-neutral-500);line-height:1.55">
      A template is never sent, filled or signed — contracts are created from its published version and stay
      independent afterwards. Publishing an edit creates a new version; contracts already created keep the
      version they were born from.</p>` : ''}
  </div>`;

  document.querySelectorAll('[data-tpllib-open]').forEach(el =>
    el.addEventListener('click', () => openTemplateLibDetail(el.getAttribute('data-tpllib-open'))));
  document.getElementById('tpllib-new')?.addEventListener('click', tplLibCreateModal);
}

/* ---------- create shell ---------- */
function tplLibCreateModal() {
  const cats = Object.entries(TPLLIB_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:460px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">New standard template</h3>
      <p style="margin:0 0 14px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        Starts as a draft only template managers can see. Add its content in the builder, then publish
        to make it available to the whole team.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Name</span>
        <input id="tpllib-name" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none" placeholder="e.g. Account Opening Form" maxlength="160"></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Category</span>
        <select id="tpllib-cat" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"><option value="other">Other</option>${cats}</select></label>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Description <span style="font-weight:400;color:var(--color-neutral-500)">(optional)</span></span>
        <textarea id="tpllib-desc" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none;min-height:60px" maxlength="2000" placeholder="What this template is for and when to use it"></textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">Cancel</button>
        <button id="tpllib-create" class="ui-btn ui-btn-primary">Create draft</button>
      </div>
    </div>`);
  document.getElementById('tpllib-create')?.addEventListener('click', async () => {
    const name = document.getElementById('tpllib-name').value.trim();
    if (!name) { toast('A template needs a name', 'err'); return; }
    try {
      const d = await api('templates', 'POST', {
        name, category: document.getElementById('tpllib-cat').value,
        description: document.getElementById('tpllib-desc').value.trim(),
      });
      closeModal();
      toast(`“${name}” created as a draft`);
      openTemplateLibDetail(d.template.id);
    } catch (e) { toast(e.message, 'err'); }
  });
}

/* ---------- save an existing contract into the library ---------- */
function saveContractToLibrary(c) {
  if (!tplLibCanManage() && !(typeof canEdit === 'function' && canEdit())) { toast('Only Admin or Legal can create templates', 'err'); return; }
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  openModal(`
    <div style="padding:20px 22px;max-width:470px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">Save as a standard template</h3>
      <p style="margin:0 0 14px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        HaTi copies this contract's wording into a new draft template. Party-specific values it can
        recognise — names, emails, amounts, dates — become empty typed fields; everything else stays
        fixed wording. You review and publish from the builder; nothing changes on ${esc(c.id)} itself.</p>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Template name</span>
        <input id="tpllib-sv-name" style="${INP}" maxlength="160" value="${esc(c.name)} — standard template"></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">Cancel</button>
        <button id="tpllib-sv-go" class="ui-btn ui-btn-primary">Create draft template</button>
      </div>
    </div>`);
  document.getElementById('tpllib-sv-go')?.addEventListener('click', async () => {
    try {
      const r = await api(`contracts/${c.id}/save-as-template`, 'POST', {
        name: document.getElementById('tpllib-sv-name').value.trim() });
      closeModal();
      toast(`Draft template created — ${r.fieldsCreated} field${r.fieldsCreated === 1 ? '' : 's'} recognised`);
      setView('tpl-library');
      openTemplateBuilder(r.templateId, r.versionId);
    } catch (e) { toast(e.message, 'err'); }
  });
}

/* ---------- template detail: versions, meta, lifecycle ---------- */
async function openTemplateLibDetail(id) {
  tplLibCancelPending();
  let d;
  try { d = await api('templates/' + id); }
  catch (e) { toast(e.message, 'err'); return; }
  const t = d.template, versions = d.versions || [], canManage = !!d.canManage;
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const fmtAt = iso => iso ? fmtDT(iso) : '—';
  const st = TPLLIB_STATUS[t.status] || TPLLIB_STATUS.draft;
  const openDraft = versions.find(v => v.status === 'draft');

  const vRows = versions.slice().reverse().map(v => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 16px;border-bottom:1px solid var(--color-divider)">
      <span style="flex:none;font-family:var(--font-mono);font-size:11.5px;font-weight:600;color:var(--color-accent-700);border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:3px;padding:1px 7px;margin-top:1px">v${v.versionNumber}</span>
      <span style="min-width:0;flex:1">
        <span style="display:block;font-size:12px">${v.status === 'published' ? `Published ${fmtAt(v.publishedAt)}${v.publishedBy ? ' by ' + esc(v.publishedBy) : ''}` : v.status === 'superseded' ? `Superseded — was published ${fmtAt(v.publishedAt)}` : 'Draft in progress'}</span>
        ${v.changeNote ? `<span style="display:block;font-size:11px;color:var(--color-neutral-600);margin-top:2px">“${esc(v.changeNote)}”</span>` : ''}
        ${v.errorNote ? `<span style="display:block;font-size:11px;color:#8f322b;margin-top:2px">${esc(v.errorNote)}</span>` : ''}
      </span>
      ${canManage && v.status === 'draft' ? `<button data-tpllib-build="${v.id}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:3.5px 10px;flex:none">${icon('pencil', 'w-3 h-3')} Open builder</button>` : ''}
      ${v.status === 'published' ? `<span class="badge" style="background:#e8f4ee;color:#1e6b4d;flex:none"><span class="dot" style="background:#2e8763"></span>Live</span>` : ''}
    </div>`).join('');

  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:14px;max-width:860px">
    <div>
      <button id="tpllib-back" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} Library</button>
    </div>
    <section style="${CARD};padding:18px">
      <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
        <div style="min-width:0;flex:1">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <h3 style="margin:0;font-family:var(--font-heading);font-size:18px;font-weight:700">${esc(t.name)}</h3>
            ${tplLibStatusBadge(t.status)}
          </div>
          <p style="margin:6px 0 0;font-size:12px;color:var(--color-neutral-600);line-height:1.55">${esc(t.description) || '<span style="color:var(--color-neutral-400)">No description yet.</span>'}</p>
          <p style="margin:8px 0 0;font-size:11px;color:var(--color-neutral-500)">
            ${TPLLIB_CATEGORIES[t.category] || 'Other'} · ${esc(TPLLIB_ORIGIN[t.origin] || '')}${t.sourceContractId ? ` (${esc(t.sourceContractId)})` : ''}
            · ${t.contractsCreated} contract${t.contractsCreated === 1 ? '' : 's'} created${t.lastUsedAt ? ` · last used ${fmtAt(t.lastUsedAt)}` : ''}</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;flex:none">
          ${canManage ? `<button id="tpllib-edit-meta" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('pencil', 'w-3 h-3')} Rename / describe</button>` : ''}
          ${canManage && t.status !== 'archived' ? `<button id="tpllib-archive" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('box', 'w-3 h-3')} Archive</button>` : ''}
          ${canManage && t.status === 'archived' ? `<button id="tpllib-restore" class="ui-btn" style="font-size:11.5px;padding:4px 10px">Restore</button>` : ''}
          ${canManage && !t.contractsCreated ? `<button id="tpllib-delete" class="ui-btn" style="font-size:11.5px;padding:4px 10px;border-color:#e6c9c1;color:#8f322b">${icon('trash', 'w-3 h-3')} Delete</button>` : ''}
        </div>
      </div>
      ${t.status === 'archived' ? `<p style="margin:12px 0 0;font-size:11px;color:var(--color-neutral-600);background:var(--color-neutral-100);border-radius:8px;padding:8px 12px">
        Archived — no new contracts can be created from it, but it stays here because ${t.contractsCreated ? 'its contracts permanently cite it' : 'its history matters'}.</p>` : ''}
      ${canManage && t.status === 'published' && !openDraft ? `<div style="margin-top:12px"><button id="tpllib-newversion" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('plus', 'w-3 h-3')} New draft version</button></div>` : ''}
    </section>
    <section style="${CARD}">
      <div style="padding:12px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13.5px;margin:0">Version history</h4>
      </div>
      ${vRows || `<div style="padding:22px;text-align:center;color:var(--color-neutral-500);font-size:12px">No versions visible yet.</div>`}
    </section>
  </div>`;

  document.getElementById('tpllib-back')?.addEventListener('click', () => setView('tpl-library'));
  document.getElementById('tpllib-edit-meta')?.addEventListener('click', () => tplLibMetaModal(t));
  document.getElementById('tpllib-archive')?.addEventListener('click', async () => {
    try {
      await api('templates/' + t.id, 'PATCH', { status: 'archived' });
      toast(`“${t.name}” archived — existing contracts keep their link to it`);
      openTemplateLibDetail(t.id);
    } catch (e) { toast(e.message, 'err'); }
  });
  document.getElementById('tpllib-restore')?.addEventListener('click', async () => {
    try { await api('templates/' + t.id, 'PATCH', { status: 'restore' }); toast(`“${t.name}” restored`); openTemplateLibDetail(t.id); }
    catch (e) { toast(e.message, 'err'); }
  });
  document.getElementById('tpllib-delete')?.addEventListener('click', async () => {
    const ok = typeof confirmDialog === 'function'
      ? await confirmDialog({ title: `Delete “${t.name}”?`, message: 'It has never spawned a contract, so nothing cites it. This cannot be undone.', confirmLabel: 'Delete template', danger: true })
      : true;
    if (!ok) return;
    try { await api('templates/' + t.id, 'DELETE'); toast(`“${t.name}” deleted`); setView('tpl-library'); }
    catch (e) { toast(e.message, 'err'); }
  });
  document.getElementById('tpllib-newversion')?.addEventListener('click', async () => {
    try { const r = await api('templates/' + t.id + '/versions', 'POST'); toast(`Draft v${r.versionNumber} created`); openTemplateLibDetail(t.id); }
    catch (e) { toast(e.message, 'err'); }
  });
  document.querySelectorAll('[data-tpllib-build]').forEach(el =>
    el.addEventListener('click', () => {
      const vid = el.getAttribute('data-tpllib-build');
      if (window.openTemplateBuilder) openTemplateBuilder(t.id, vid);
      else toast('The builder arrives in the next phase of this feature', 'err');
    }));
}

function tplLibMetaModal(t) {
  const cats = Object.entries(TPLLIB_CATEGORIES).map(([k, v]) =>
    `<option value="${k}"${t.category === k ? ' selected' : ''}>${v}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:460px">
      <h3 style="margin:0 0 14px;font-family:var(--font-heading);font-size:16px;font-weight:700">Template details</h3>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Name</span>
        <input id="tpllib-m-name" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none" maxlength="160" value="${esc(t.name)}"></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Category</span>
        <select id="tpllib-m-cat" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none">${cats}</select></label>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Description</span>
        <textarea id="tpllib-m-desc" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none;min-height:60px" maxlength="2000">${esc(t.description)}</textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">Cancel</button>
        <button id="tpllib-m-save" class="ui-btn ui-btn-primary">Save</button>
      </div>
    </div>`);
  document.getElementById('tpllib-m-save')?.addEventListener('click', async () => {
    const name = document.getElementById('tpllib-m-name').value.trim();
    if (!name) { toast('A template needs a name', 'err'); return; }
    try {
      await api('templates/' + t.id, 'PATCH', {
        name, category: document.getElementById('tpllib-m-cat').value,
        description: document.getElementById('tpllib-m-desc').value.trim(),
      });
      closeModal(); toast('Saved'); openTemplateLibDetail(t.id);
    } catch (e) { toast(e.message, 'err'); }
  });
}

Object.assign(window, {
  renderTemplateLibrary, openTemplateLibDetail, tplLibCanManage, tplLibCancelPending,
  saveContractToLibrary, TPLLIB_CATEGORIES, TPLLIB_STATUS,
});
