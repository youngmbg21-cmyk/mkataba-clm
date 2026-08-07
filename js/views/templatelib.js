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
  draft:     { label: 'Draft',     bg: 'var(--st-amber-bg)', fg: 'var(--st-amber-fg)', dot: '#c98a2b' },
  published: { get label(){ return i18t('tl_published'); }, bg: 'var(--st-green-bg)', fg: 'var(--st-green-fg)', dot: 'var(--st-green-dot)' },
  archived:  { get label(){ return i18t('tl_archived'); },  bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-600)', dot: 'var(--color-neutral-400)' },
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

/* ---------- the Company standard templates section ----------
   The library has no page of its own any more: it renders INTO the existing
   Templates page, the one place people look for paper, next to the built-in
   HaTi templates and the older custom ones. The deep screens (detail,
   builder, upload review) still take over the content area and return to the
   Templates page when done. */
const tplLibPublished = () => (_tplLib.list || []).filter(t => t.status === 'published');
const tplLibCount = () => (_tplLib.loaded ? tplLibPublished().length : 0);
/* Refresh the cache; resolves true when the list changed (callers re-render). */
async function tplLibRefresh() {
  if (!API_MODE()) return false;
  try {
    const before = JSON.stringify((_tplLib.list || []).map(t => t.id + t.status + t.latestVersion));
    const d = await api('templates');
    _tplLib = { list: d.templates || [], canManage: !!d.canManage, loaded: true };
    if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
    return JSON.stringify(_tplLib.list.map(t => t.id + t.status + t.latestVersion)) !== before;
  } catch (_) { return false; }
}

async function renderCompanyTemplatesSection() {
  const host = document.getElementById('tpl-company-section');
  if (!host) return;
  if (!API_MODE()) { host.innerHTML = ''; return; }
  const tok = ++_tplLibTok;
  try {
    const d = await api('templates');
    _tplLib = { list: d.templates || [], canManage: !!d.canManage, loaded: true };
  } catch (e) {
    host.innerHTML = `<section style="background:var(--color-surface);border:1px solid var(--color-divider);border-radius:16px;padding:16px;font-size:12px;color:var(--st-ruby-fg)">${i18t('tl_load_failed',{err:esc(e.message)})}</section>`;
    return;
  }
  if (typeof updateSidebarCounts === 'function') updateSidebarCounts();
  // stale response, or the reader has moved into a deeper screen meanwhile
  if (tok !== _tplLibTok || !document.getElementById('tpl-company-section')) return;
  host.innerHTML = tplCompanySectionHtml();
  host.querySelectorAll('[data-tpllib-open]').forEach(el =>
    el.addEventListener('click', () => openTemplateLibDetail(el.getAttribute('data-tpllib-open'))));
  host.querySelectorAll('[data-tpllib-use]').forEach(el =>
    el.addEventListener('click', e => { e.stopPropagation(); tplLibNewContract(el.getAttribute('data-tpllib-use')); }));
  host.querySelector('#tpllib-new')?.addEventListener('click', tplLibCreateModal);
  host.querySelector('#tpllib-upload')?.addEventListener('click', tplLibUploadModal);
}

function tplCompanySectionHtml() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const canManage = tplLibCanManage();
  const list = _tplLib.list;
  const fmtDay = iso => iso ? new Date(iso).toLocaleDateString(jxLocale(), { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  /* Cards, in the same grid and the same shape as Counterparty Templates further down the
     page — one Templates page should not have two visual languages for the same
     idea. The card is a DIV, not a button: the row it replaces was a <button>
     with the "New contract" <button> nested inside it, which is invalid HTML,
     and browsers repair it by closing the outer button early. That ejected the
     New-contract pill and the chevron out of the row and dropped them below it,
     which is the broken layout this replaces. Opening is now a click on the
     card body, so the buttons inside it are ordinary siblings.

     One deliberate departure from Counterparty Templates: the stripe down the left edge
     shows STATUS rather than category. Counterparty Templates colours by folder because
     that is its only classification; here, draft-versus-published is the fact
     you scan for, and a draft that looks published is the mistake worth
     designing against. */
  const st = t => TPLLIB_STATUS[t.status] || TPLLIB_STATUS.draft;
  const cards = list.map(t => `
    <div class="lift" style="${CARD};border-left:4px solid ${st(t).dot};padding:18px;display:flex;flex-direction:column;gap:7px">
      <div data-tpllib-open="${t.id}" style="display:flex;align-items:center;gap:8px;cursor:pointer" title="${esc(i18t('tl_open_named',{name:t.name}))}">
        <span style="width:32px;height:32px;flex:none;display:grid;place-items:center;border-radius:10px;background:var(--tile-steel-bg);color:var(--tile-steel-fg)">${icon('copy', 'w-3.5 h-3.5')}</span>
        <span style="min-width:0;flex:1">
          <span style="display:block;font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.name)}</span>
          <span style="display:block;font-size:10px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${TPLLIB_CATEGORIES[t.category] || 'Other'} · ${esc(TPLLIB_ORIGIN[t.origin] || '')}</span>
        </span>
        <span style="flex:none">${tplLibStatusBadge(t.status)}</span>
      </div>
      <div data-tpllib-open="${t.id}" style="font-size:10px;color:var(--color-neutral-500);cursor:pointer">Last used ${fmtDay(t.lastUsedAt)}</div>
      <div data-tpllib-open="${t.id}" style="display:flex;align-items:center;gap:6px;font-size:10px;color:var(--color-neutral-600);cursor:pointer">
        <span style="font-family:var(--font-mono);font-weight:600;color:var(--color-accent-700)" title="${i18t('tl_current_published')}">${t.publishedVersion ? 'v' + t.publishedVersion : (canManage ? 'v' + t.latestVersion + ' draft' : '—')}</span>
        <span>·</span><span title="${i18t('tl_contracts_created')}">${t.contractsCreated} contract${t.contractsCreated === 1 ? '' : 's'}</span>
      </div>
      <div style="display:flex;gap:6px;margin-top:2px;flex-wrap:wrap">
        ${t.status === 'published' && typeof canEdit === 'function' && canEdit()
          ? `<button data-tpllib-use="${t.id}" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 10px;flex:1">${icon('plus', 'w-3 h-3')} ${i18t('tl_new_contract')}</button>` : ''}
        <button data-tpllib-open="${t.id}" class="ui-btn" style="font-size:11.5px;padding:4px 10px;${t.status === 'published' && typeof canEdit === 'function' && canEdit() ? '' : 'flex:1'}">${i18t('act_open')}</button>
      </div>
    </div>`).join('');
  /* The section itself now matches Counterparty Templates too: a padded card holding a
     heading row and a grid, rather than a bordered table whose rows ran the
     full width. Same auto-filling columns and same gap, so the two sections
     line up as one page instead of two designs stacked. */
  return `
    <section style="${CARD};padding:16px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${list.length ? '12px' : '6px'}">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:15px;margin:0">${i18t('tl_company_standards')}</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">${i18tn('tl_in_library',list.length,{n:list.length})}</span>
        <span style="flex:1"></span>
        ${canManage ? `<button id="tpllib-upload" class="ui-btn ui-btn-secondary" style="font-size:12px;padding:5px 12px">${icon('upload', 'w-3.5 h-3.5')} Convert a document</button>
        <button id="tpllib-new" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 12px">${icon('plus', 'w-3.5 h-3.5')} ${i18t('lib_new_template_plain')}</button>` : ''}
      </div>
      ${cards
        ? `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px">${cards}</div>`
        : `<p style="font-size:12px;color:var(--color-neutral-600);margin:0;line-height:1.6">
        ${canManage
          ? 'No standard templates yet. Convert an uploaded Word document, save an existing contract as a template, or build one from scratch.'
          : 'No published company templates yet — a template manager (Admin or Legal) publishes them here.'}</p>`}
      ${canManage && cards ? `<p style="margin:12px 0 0;font-size:10.5px;color:var(--color-neutral-500);line-height:1.5">
        Contracts created from a published version stay independent — publishing an edit makes a new version and never changes contracts already created.</p>` : ''}
    </section>`;
}

/* ---------- upload-and-convert: a Word document becomes a draft ---------- */
function tplLibUploadModal() {
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  openModal(`
    <div style="padding:20px 22px;max-width:470px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">${i18t('tl_convert_doc')}</h3>
      <p style="margin:0 0 14px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        Upload your standard contract as a Word (.docx) or PDF file — including a scan of a paper form.
        HaTi reads it, works out which parts are fixed wording and which are blanks to fill in, and
        rebuilds it as a draft template — HaTi's layout, your branding. The original file's formatting
        is deliberately left behind. You review every detected field before anything goes further.</p>
      <input type="file" id="tpllib-up-file" accept=".docx,.pdf" style="display:block;margin-bottom:12px;font-size:12px">
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_template_name')} <span style="font-weight:400;color:var(--color-neutral-500)">${i18t('tl_defaults_filename')}</span></span>
        <input id="tpllib-up-name" style="${INP}" maxlength="160"></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">${i18t('act_cancel')}</button>
        <button id="tpllib-up-go" class="ui-btn ui-btn-primary">${i18t('tl_upload_convert')}</button>
      </div>
    </div>`);
  document.getElementById('tpllib-up-go')?.addEventListener('click', () => {
    const file = document.getElementById('tpllib-up-file').files?.[0];
    if (!file) { toast(i18t('tl_choose_file_first'), 'err'); return; }
    /* A fast, friendly no for the obvious cases. It is not the gate: the server
       checks the real file signature, the page count and whether the PDF is
       encrypted, because those decide whether we spend money on a model call
       and must not be forgeable from here. */
    if (!/\.(docx|pdf)$/i.test(file.name)) { toast(i18t('tl_docx_pdf_only'), 'err'); return; }
    if (file.size > 8 * 1024 * 1024) { toast(i18t('tl_under_8mb'), 'err'); return; }
    const btn = document.getElementById('tpllib-up-go');
    btn.disabled = true; btn.textContent = 'Reading the document…';
    const r = new FileReader();
    r.onload = async () => {
      try {
        const d = await api('templates/upload', 'POST', {
          dataUrl: String(r.result), fileName: file.name,
          name: document.getElementById('tpllib-up-name').value.trim(),
        });
        closeModal();
        if (d.notice) toast(d.notice, 'err');
        if (!d.converted) {
          toast(d.errorNote || 'The conversion did not produce a draft — the original file is stored', 'err');
          openTemplateLibDetail(d.templateId);
          return;
        }
        openTemplateConfirm(d.templateId, d.versionId);
      } catch (e) {
        btn.disabled = false; btn.textContent = 'Upload & convert';
        toast(e.message, 'err');
      }
    };
    r.readAsDataURL(file);
  });
}

/* The confirmation step — required, minimal, and unskippable: no path from
   upload to published avoids this screen, and there is no auto-approve. The
   user checks the detected fields (low confidence first), fixes, adds or
   deletes, then continues into the builder. */
let _tplConfirm = null;
async function openTemplateConfirm(tid, vid) {
  tplLibCancelPending();
  let t, v;
  try { t = await api('templates/' + tid); v = await api(`templates/${tid}/versions/${vid}`); }
  catch (e) { toast(e.message, 'err'); return; }
  _tplConfirm = {
    tid, vid, name: t.template.name,
    /* Whether the source was a scan. Carried onto the confirmation screen so
       the banner and the number-field warning appear on the one screen where a
       human is actually looking at the detected fields. */
    scanned: !!t.template.scanned,
    blocks: v.blocks.map(b => ({ blockType: b.blockType, content: b.content })),
    fields: v.fields.map(f => ({
      fieldKey: f.field_key, label: f.label, section: f.section || '', fieldType: f.field_type,
      control: f.control, options: f.options || [], required: f.required,
      defaultValue: f.default_value || '', helpText: f.help_text || '',
      detectionConfidence: f.detection_confidence,
    })),
  };
  tplConfirmPaint();
}
function tplConfirmPaint() {
  const s = _tplConfirm;
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const INP = 'border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:5px 8px;font:inherit;font-size:12px;outline:none';
  // low confidence first — those are the rows a human most needs to look at
  const rank = { low: 0, medium: 1, high: 2, manual: 3 };
  const order = s.fields.map((f, i) => i).sort((a, b) => (rank[s.fields[a].detectionConfidence] ?? 3) - (rank[s.fields[b].detectionConfidence] ?? 3));
  const types = Object.entries(window.FIELD_LIB || {});
  const rows = order.map(i => {
    const f = s.fields[i];
    const conf = f.detectionConfidence;
    const chip = conf === 'manual' ? '' : `<span class="badge" style="background:${conf === 'low' ? 'var(--st-ruby-bg)' : conf === 'medium' ? 'var(--st-amber-bg)' : 'var(--st-green-bg)'};color:${conf === 'low' ? 'var(--st-ruby-fg)' : conf === 'medium' ? 'var(--st-amber-fg)' : 'var(--st-green-fg)'}">${conf}</span>`;
    return `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--color-divider)">
      <span style="flex:none;width:64px">${chip}</span>
      <input data-tc-label="${i}" value="${esc(f.label)}" style="${INP};flex:2;min-width:120px" maxlength="200">
      <select data-tc-type="${i}" style="${INP};flex:1;min-width:110px">${types.map(([k, tt]) => `<option value="${k}"${f.fieldType === k ? ' selected' : ''}>${tt.label}</option>`).join('')}</select>
      <label style="flex:none;display:flex;align-items:center;gap:4px;font-size:11px"><input type="checkbox" data-tc-req="${i}" ${f.required ? 'checked' : ''}>required</label>
      <button data-tc-del="${i}" class="ui-btn" style="flex:none;font-size:10px;padding:2px 7px;border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${icon('x', 'w-3 h-3')}</button>
    </div>`;
  }).join('');
  const blockRows = s.blocks.map(b => `
    <div style="display:flex;gap:8px;padding:6px 14px;border-bottom:1px solid var(--color-divider);font-size:11.5px">
      <span class="badge" style="flex:none;background:var(--color-neutral-100);color:var(--color-neutral-600)">${((window.TB_BLOCK_META || {})[b.blockType] || { label: b.blockType }).label}</span>
      <span style="min-width:0;color:var(--color-neutral-700);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(b.content.slice(0, 160))}</span>
    </div>`).join('');
  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:14px;max-width:920px">
    <section style="${CARD};padding:16px 18px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:17px;font-weight:700">${i18t('tl_check_found')}</h3>
      <p style="margin:0;font-size:12px;color:var(--color-neutral-600);line-height:1.55">
        “${esc(s.name)}” — ${s.fields.length} field${s.fields.length === 1 ? '' : 's'} and ${s.blocks.length} block${s.blocks.length === 1 ? '' : 's'} detected.
        Low-confidence fields are listed first: fix their labels and types, delete anything that is not
        really a blank, add anything missed. Nothing publishes until you have been through the builder.</p>
    </section>
    ${s.scanned ? `
    <section id="tc-scan-banner" style="${CARD};padding:12px 16px;border-color:var(--st-amber-line);background:var(--st-amber-bg)">
      <p style="margin:0;font-size:12px;color:var(--st-amber-fg);line-height:1.55">
        <strong>${i18t('tl_was_scan')}</strong>
        Reading a photograph of paper involves more guesswork than reading a Word file, and digits are
        where mistakes hide — a 3 read as an 8 in an ID or KRA PIN looks perfectly normal on screen.
        Number fields from this document are never marked high confidence, however clear the scan looked.</p>
    </section>` : ''}
    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13px;margin:0;flex:1">${i18t('tl_fields_found')}</h4>
        <button id="tc-add" class="ui-btn" style="font-size:11px;padding:3px 10px">${icon('plus', 'w-3 h-3')} ${i18t('tl_add_field')}</button>
      </div>
      ${rows || `<div style="padding:20px;text-align:center;color:var(--color-neutral-500);font-size:12px">${i18t('tl_no_fields')}</div>`}
    </section>
    <section style="${CARD}">
      <div style="padding:11px 14px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13px;margin:0">${i18t('tl_blocks_found')}</h4>
      </div>
      ${blockRows}
    </section>
    <div style="display:flex;justify-content:flex-end;gap:8px">
      <button id="tc-continue" class="ui-btn ui-btn-primary" style="font-size:13px;padding:8px 18px">${i18t('tl_looks_right')}</button>
    </div>
  </div>`;
  const upd = (i, k, v2) => { s.fields[i][k] = v2; };
  document.querySelectorAll('[data-tc-label]').forEach(el => el.addEventListener('input', () => upd(Number(el.getAttribute('data-tc-label')), 'label', el.value)));
  document.querySelectorAll('[data-tc-type]').forEach(el => el.addEventListener('change', () => upd(Number(el.getAttribute('data-tc-type')), 'fieldType', el.value)));
  document.querySelectorAll('[data-tc-req]').forEach(el => el.addEventListener('change', () => upd(Number(el.getAttribute('data-tc-req')), 'required', el.checked)));
  document.querySelectorAll('[data-tc-del]').forEach(el => el.addEventListener('click', () => {
    const i = Number(el.getAttribute('data-tc-del'));
    /* Deleting the field also deletes its {{marker}} from the wording — a
       marker with no field would otherwise reach contracts as literal code. */
    const key = s.fields[i] && s.fields[i].fieldKey;
    if (key && window.templateFormStripMarker)
      s.blocks = s.blocks.map(b => ({ ...b, content: templateFormStripMarker(b.content, key) }));
    s.fields.splice(i, 1);
    tplConfirmPaint();
  }));
  document.getElementById('tc-add')?.addEventListener('click', () => {
    s.fields.push({ fieldKey: 'field_' + (s.fields.length + 1), label: '', section: '', fieldType: 'short_text',
      control: 'free', options: [], required: false, defaultValue: '', helpText: '', detectionConfidence: 'manual' });
    tplConfirmPaint();
  });
  document.getElementById('tc-continue')?.addEventListener('click', async () => {
    if (s.fields.some(f => !String(f.label).trim())) { toast(i18t('tl_every_field_label'), 'err'); return; }
    try {
      // a human has now looked at the list — that is what this screen is for
      await api(`templates/${s.tid}/versions/${s.vid}`, 'PUT', {
        blocks: s.blocks.map((b, i) => ({ orderIndex: i, blockType: b.blockType, content: b.content })),
        fields: s.fields.map((f, i) => ({ ...f, orderIndex: i, humanReviewed: true })),
      });
      openTemplateBuilder(s.tid, s.vid);
    } catch (e) { toast(e.message, 'err'); }
  });
}

/* ---------- new contract from a published template ---------- */
/* ASKED HERE TOO, AND NOT ONLY BY THE OTHER TEMPLATES.
   This path used to create the contract the moment you pressed Use and drop
   you straight into the workspace — no counterparty, no value, no dates, no
   email. The template's OWN form is still filled on the contract page, where
   it belongs; what was missing is the contract record underneath it, which is
   what the register filters on and the calendar runs off. Same form as every
   other creation path (openContractEssentials), and Skip creates exactly what
   pressing Use created before. */
function tplLibNewContract(id) {
  if (typeof openContractEssentials !== 'function') return tplLibCreate(id, null);
  const t = (_tplLib.list || []).find(x => x.id === id) || null;
  openContractEssentials({
    title: (t && t.name) || 'New contract',
    blurb: (t && t.description) ? String(t.description) : 'From your company standard template.',
    onCreate: values => tplLibCreate(id, values),
    onSkip: () => tplLibCreate(id, null),
  });
}
async function tplLibCreate(id, essentials) {
  try {
    const r = await api(`templates/${id}/contracts`, 'POST', essentials ? {
      counterparty: essentials.counterparty || '',
      counterpartyEmail: essentials.cpemail || '',
      value: essentials.value || '',
      effDate: essentials.effDate || '',
      expiry: essentials.expiry || '',
    } : {});
    if (r.uid) window.uid = r.uid; // keep the client's MK-counter in step with the server's
    const c = typeof migrateContract === 'function' ? migrateContract(r.contract) : r.contract;
    c._loaded = true;
    state.contracts.unshift(c);
    toast(`${c.id} created from “${c.templateForm ? c.templateForm.templateName : 'template'}” — company details arrived pre-filled`);
    openWorkspace(c.id);
  } catch (e) { toast(e.message, 'err'); }
}

/* ---------- create shell ---------- */
function tplLibCreateModal() {
  const cats = Object.entries(TPLLIB_CATEGORIES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:460px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">${i18t('tl_new_standard')}</h3>
      <p style="margin:0 0 14px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        Starts as a draft only template managers can see. Add its content in the builder, then publish
        to make it available to the whole team.</p>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_name')}</span>
        <input id="tpllib-name" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none" placeholder="e.g. Account Opening Form" maxlength="160"></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_category')}</span>
        <select id="tpllib-cat" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none"><option value="other">${i18t('tl_other_category')}</option>${cats}</select></label>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_description')} <span style="font-weight:400;color:var(--color-neutral-500)">(optional)</span></span>
        <textarea id="tpllib-desc" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none;min-height:60px" maxlength="2000" placeholder="${i18t('tl_what_for')}"></textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">${i18t('act_cancel')}</button>
        <button id="tpllib-create" class="ui-btn ui-btn-primary">${i18t('tl_create_draft')}</button>
      </div>
    </div>`);
  document.getElementById('tpllib-create')?.addEventListener('click', async () => {
    const name = document.getElementById('tpllib-name').value.trim();
    if (!name) { toast(i18t('tl_needs_name'), 'err'); return; }
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
  if (!tplLibCanManage() && !(typeof canEdit === 'function' && canEdit())) { toast(i18t('tl_admin_legal_only'), 'err'); return; }
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none';
  openModal(`
    <div style="padding:20px 22px;max-width:470px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">${i18t('tl_save_as_standard')}</h3>
      <p style="margin:0 0 14px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        HaTi copies this contract's wording into a new draft template. Party-specific values it can
        recognise — names, emails, amounts, dates — become empty typed fields; everything else stays
        fixed wording. You review and publish from the builder; nothing changes on ${esc(c.id)} itself.</p>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_template_name')}</span>
        <input id="tpllib-sv-name" style="${INP}" maxlength="160" value="${esc(c.name)} — standard template"></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">${i18t('act_cancel')}</button>
        <button id="tpllib-sv-go" class="ui-btn ui-btn-primary">${i18t('tl_create_draft_template')}</button>
      </div>
    </div>`);
  document.getElementById('tpllib-sv-go')?.addEventListener('click', async () => {
    try {
      const r = await api(`contracts/${c.id}/save-as-template`, 'POST', {
        name: document.getElementById('tpllib-sv-name').value.trim() });
      closeModal();
      toast(`Draft template created — ${r.fieldsCreated} field${r.fieldsCreated === 1 ? '' : 's'} recognised`);
      setView('templates');
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
        ${v.errorNote ? `<span style="display:block;font-size:11px;color:var(--st-ruby-fg);margin-top:2px">${esc(v.errorNote)}</span>` : ''}
      </span>
      ${canManage && v.status === 'draft' ? `<button data-tpllib-build="${v.id}" class="ui-btn ui-btn-primary" style="font-size:11px;padding:3.5px 10px;flex:none">${icon('pencil', 'w-3 h-3')} Open builder</button>` : ''}
      ${v.status === 'published' ? `<span class="badge" style="background:var(--st-green-bg);color:var(--st-green-fg);flex:none"><span class="dot" style="background:var(--st-green-dot)"></span>${i18t('tl_live')}</span>` : ''}
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
          <p style="margin:6px 0 0;font-size:12px;color:var(--color-neutral-600);line-height:1.55">${esc(t.description) || `<span style="color:var(--color-neutral-400)">${i18t('tl_no_description')}</span>`}</p>
          <p style="margin:8px 0 0;font-size:11px;color:var(--color-neutral-500)">
            ${TPLLIB_CATEGORIES[t.category] || 'Other'} · ${esc(TPLLIB_ORIGIN[t.origin] || '')}${t.sourceContractId ? ` (${esc(t.sourceContractId)})` : ''}
            · ${t.contractsCreated} contract${t.contractsCreated === 1 ? '' : 's'} created${t.lastUsedAt ? ` · last used ${fmtAt(t.lastUsedAt)}` : ''}</p>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;flex:none">
          ${t.status === 'published' && typeof canEdit === 'function' && canEdit() ? `<button id="tpllib-use" class="ui-btn ui-btn-primary" style="font-size:11.5px;padding:4px 12px">${icon('plus', 'w-3 h-3')} ${i18t('tl_new_contract')}</button>` : ''}
          ${canManage ? `<button id="tpllib-edit-meta" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('pencil', 'w-3 h-3')} Rename / describe</button>` : ''}
          ${canManage && t.status !== 'archived' ? `<button id="tpllib-archive" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('box', 'w-3 h-3')} Archive</button>` : ''}
          ${canManage && t.status === 'archived' ? `<button id="tpllib-restore" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${i18t('tl_restore')}</button>` : ''}
          ${canManage && !t.contractsCreated ? `<button id="tpllib-delete" class="ui-btn" style="font-size:11.5px;padding:4px 10px;border-color:var(--st-ruby-line);color:var(--st-ruby-fg)">${icon('trash', 'w-3 h-3')} Delete</button>` : ''}
        </div>
      </div>
      ${t.status === 'archived' ? `<p style="margin:12px 0 0;font-size:11px;color:var(--color-neutral-600);background:var(--color-neutral-100);border-radius:8px;padding:8px 12px">
        Archived — no new contracts can be created from it, but it stays here because ${t.contractsCreated ? 'its contracts permanently cite it' : 'its history matters'}.</p>` : ''}
      ${canManage && t.status === 'published' && !openDraft ? `<div style="margin-top:12px"><button id="tpllib-newversion" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('plus', 'w-3 h-3')} New draft version</button></div>` : ''}
    </section>
    <section style="${CARD}">
      <div style="padding:12px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13.5px;margin:0">${i18t('tl_version_history')}</h4>
      </div>
      ${vRows || `<div style="padding:22px;text-align:center;color:var(--color-neutral-500);font-size:12px">${i18t('tl_no_versions')}</div>`}
    </section>
  </div>`;

  document.getElementById('tpllib-back')?.addEventListener('click', () => setView('templates'));
  document.getElementById('tpllib-use')?.addEventListener('click', () => tplLibNewContract(t.id));
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
    try { await api('templates/' + t.id, 'DELETE'); toast(`“${t.name}” deleted`); setView('templates'); }
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
      else toast(i18t('tl_builder_next_phase'), 'err');
    }));
}

function tplLibMetaModal(t) {
  const cats = Object.entries(TPLLIB_CATEGORIES).map(([k, v]) =>
    `<option value="${k}"${t.category === k ? ' selected' : ''}>${v}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:460px">
      <h3 style="margin:0 0 14px;font-family:var(--font-heading);font-size:16px;font-weight:700">${i18t('tl_template_details')}</h3>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_name')}</span>
        <input id="tpllib-m-name" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none" maxlength="160" value="${esc(t.name)}"></label>
      <label style="display:block;margin-bottom:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_category')}</span>
        <select id="tpllib-m-cat" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none">${cats}</select></label>
      <label style="display:block;margin-bottom:16px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('tl_description')}</span>
        <textarea id="tpllib-m-desc" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:13px;outline:none;min-height:60px" maxlength="2000">${esc(t.description)}</textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">${i18t('act_cancel')}</button>
        <button id="tpllib-m-save" class="ui-btn ui-btn-primary">${i18t('act_save')}</button>
      </div>
    </div>`);
  document.getElementById('tpllib-m-save')?.addEventListener('click', async () => {
    const name = document.getElementById('tpllib-m-name').value.trim();
    if (!name) { toast(i18t('tl_needs_name'), 'err'); return; }
    try {
      await api('templates/' + t.id, 'PATCH', {
        name, category: document.getElementById('tpllib-m-cat').value,
        description: document.getElementById('tpllib-m-desc').value.trim(),
      });
      closeModal(); toast(i18t('tl_saved')); openTemplateLibDetail(t.id);
    } catch (e) { toast(e.message, 'err'); }
  });
}

/* ============================================================
   The fill form on a contract created from a library template.
   Rendered into #tplform-section on the contract workspace. Open fields are
   typed inputs validated by the shared registry; every change autosaves
   (values + the regenerated wording) through the normal debounced save, so a
   half-finished form survives a closed tab. Fixed wording has no editor here
   or anywhere — it is the template manager's, not the deal-maker's.
   ============================================================ */
function tplFormInputHtml(f, value, idx) {
  const lib = (window.FIELD_LIB || {})[f.fieldType] || { input: 'text', hint: '' };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:6px 9px;font:inherit;font-size:12px;outline:none';
  const v = value == null ? '' : String(value);
  if (f.control === 'guided' || f.fieldType === 'select') {
    const opts = (f.options || []).map(o => `<option value="${esc(o)}"${v === o ? ' selected' : ''}>${esc(o)}</option>`).join('');
    return `<select data-tplf="${idx}" style="${INP}"><option value="">${i18t('tl_choose')}</option>${opts}</select>`;
  }
  if (lib.input === 'textarea') return `<textarea data-tplf="${idx}" style="${INP};min-height:52px;resize:vertical" placeholder="${esc(lib.hint)}">${esc(v)}</textarea>`;
  if (lib.input === 'file' || lib.input === 'image')
    return `<div style="display:flex;align-items:center;gap:8px">
      ${v ? (lib.input === 'image' ? `<img src="${v}" alt="" style="height:34px;border-radius:4px;border:1px solid var(--color-divider)">` : `<span class="badge" style="background:var(--color-neutral-100);color:var(--color-neutral-700)">attached</span>`) : ''}
      <input type="file" data-tplf-file="${idx}" accept="${lib.input === 'image' ? 'image/png,image/jpeg,image/webp' : '*/*'}" style="font-size:11px">
      ${v ? `<button data-tplf-clear="${idx}" class="ui-btn" style="font-size:10px;padding:2px 7px">Clear</button>` : ''}
    </div>`;
  const type = { email: 'email', tel: 'tel', date: 'date' }[lib.input] || 'text';
  return `<input type="${type}" data-tplf="${idx}" value="${esc(v)}" placeholder="${esc(lib.hint)}" style="${INP}">`;
}

function renderTemplateFormSection(c) {
  const host = document.getElementById('tplform-section');
  if (!host) return;
  const form = c.templateForm;
  if (!form) { host.innerHTML = ''; return; }
  const locked = c.status === 'Signed' || (c.execution && c.execution.at) || !!c.hash;
  const editable = !locked && typeof canEdit === 'function' && canEdit();
  /* Repair on open. A contract created before delete-time marker cleanup can
     hold literal {{code}} in its stored wording; the form copy it carries
     makes a clean re-render deterministic. Executed records are never
     touched — their wording is sealed. */
  if (!locked && /\{\{/.test(String(c.redlineText || '')) && window.templateFormDocHtml) {
    c.redlineText = templateFormDocHtml(form);
    const canvas = document.getElementById('doc-canvas');
    if (canvas && window.renderDocHtml) canvas.innerHTML = renderDocHtml(c.redlineText, window.RICH_FORMAT || 'rich');
    if (editable) persist(c);
  }
  const fields = (form.fields || []).filter(f => f.fieldType !== 'signature_name_title');
  const values = form.values || {};
  const problems = window.templateFormProblems ? templateFormProblems(form) : [];
  const problemOf = k => { const p = problems.find(x => x.fieldKey === k); return p ? p.problem : null; };
  const required = fields.filter(f => f.required);
  const filled = required.filter(f => String(values[f.fieldKey] || '').trim() !== '');

  const bySection = [];
  for (const f of fields) {
    const name = f.section || '';
    let g = bySection.find(x => x.name === name);
    if (!g) { g = { name, fields: [] }; bySection.push(g); }
    g.fields.push(f);
  }

  host.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid var(--color-divider)">
      <h6 style="font-family:var(--font-heading);font-weight:600;font-size:12px;margin:0;flex:1">Contract form
        <span style="font-weight:400;color:var(--color-neutral-500)">${i18t('tl_from_template_v',{name:esc(form.templateName || '')})}${form.versionNumber || ''}</span></h6>
      <span style="font-size:10px;color:${filled.length === required.length ? 'var(--st-green-fg)' : 'var(--st-amber-fg)'};font-weight:600">${filled.length}/${required.length} required filled</span>
    </div>
    <div style="padding:10px 14px;display:flex;flex-direction:column;gap:10px">
      ${locked ? `<div style="font-size:11px;color:var(--color-neutral-600)">${i18t('tl_executed_sealed')}</div>` : ''}
      ${bySection.map(g => `
        ${g.name ? `<div style="font-size:10px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:var(--color-neutral-500);margin-top:2px">${esc(g.name)}</div>` : ''}
        ${g.fields.map(f => {
          const idx = form.fields.indexOf(f);
          const problem = String(values[f.fieldKey] || '').trim() !== '' ? problemOf(f.fieldKey) : null;
          return `<label style="display:block">
            <span style="display:block;font-size:11px;font-weight:600;margin-bottom:3px">${esc(f.label || f.fieldKey)}${f.required ? ' <span style="color:var(--st-ruby-fg)">*</span>' : ''}</span>
            ${editable ? tplFormInputHtml(f, values[f.fieldKey], idx)
              : `<span style="display:block;font-size:12px;color:var(--color-neutral-800)">${esc(values[f.fieldKey] || '—')}</span>`}
            ${f.helpText ? `<span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:2px">${esc(f.helpText)}</span>` : ''}
            <span data-tplf-err="${idx}" style="display:${problem ? 'block' : 'none'};font-size:10.5px;color:var(--st-ruby-fg);margin-top:2px">${esc(problem || '')}</span>
          </label>`;
        }).join('')}`).join('')}
    </div>`;
  if (!editable) return;

  const commit = (idx, value) => tplFormCommit(c, idx, value);
  host.querySelectorAll('[data-tplf]').forEach(el => {
    el.addEventListener('change', () => commit(Number(el.getAttribute('data-tplf')), el.value));
  });
  host.querySelectorAll('[data-tplf-file]').forEach(el => {
    el.addEventListener('change', () => {
      const file = el.files && el.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) { toast(i18t('tl_attachments_500kb'), 'err'); return; }
      const r = new FileReader();
      r.onload = () => commit(Number(el.getAttribute('data-tplf-file')), String(r.result));
      r.readAsDataURL(file);
    });
  });
  host.querySelectorAll('[data-tplf-clear]').forEach(el => {
    el.addEventListener('click', () => commit(Number(el.getAttribute('data-tplf-clear')), ''));
  });

  /* The blanks in the document take clicks too — the workspace repaints
     #content wholesale, so the canvas node (and this listener) is fresh on
     every render and never doubles up. */
  const canvas = document.getElementById('doc-canvas');
  if (canvas && !canvas._tplFormWired) {
    canvas._tplFormWired = true;
    canvas.addEventListener('click', e => {
      const span = e.target.closest?.('.hati-field[data-field-key]');
      if (span) tplFormBlankClick(c, span);
    });
  }
}

/* One commit for every door into a field — the side panel, the in-document
   popover, whatever comes later. Values land on the form, the wording
   regenerates (the document IS the rendering of the form), the debounced
   autosave runs, and the panel repaints its progress. */
function tplFormCommit(c, idx, value) {
  const form = c.templateForm;
  const f = form && form.fields[idx];
  if (!f) return;
  const s = value == null ? '' : String(value).trim();
  form.values = form.values || {};
  if (s === '') delete form.values[f.fieldKey]; else form.values[f.fieldKey] = s;
  if (window.templateFormDocHtml) {
    c.redlineText = templateFormDocHtml(form);
    const canvas = document.getElementById('doc-canvas');
    if (canvas && window.renderDocHtml) canvas.innerHTML = renderDocHtml(c.redlineText, window.RICH_FORMAT || 'rich');
  }
  c.lastAction = (typeof todayStr === 'function') ? todayStr() : c.lastAction;
  persist(c); // debounced autosave — a closed tab loses nothing past 400ms
  renderTemplateFormSection(c);
  /* The Checks card sits directly under this form and counts what is still
     empty. Filling the last required field has to clear its notice in the same
     breath, or the card goes on asking for work that is finished. Guarded:
     this file is loaded on pages that have no Checks card at all. */
  if (window.renderChecksCard) renderChecksCard(c);
}

/* Click a blank in the document: typed input right there. Signatures route
   to the signing flow (never typed), file/stamp fields route to the panel
   (a floating file input helps nobody) — everything else gets a popover. */
function tplFormBlankClick(c, span) {
  const form = c.templateForm;
  if (!form) return;
  const locked = c.status === 'Signed' || (c.execution && c.execution.at) || !!c.hash;
  if (locked || !(typeof canEdit === 'function' && canEdit())) return;
  const key = span.getAttribute('data-field-key');
  const idx = (form.fields || []).findIndex(f => f.fieldKey === key);
  if (idx < 0) return;
  const f = form.fields[idx];
  if (f.fieldType === 'signature_name_title' || f.fieldType === 'stamp_image') {
    toast(i18t('tl_signatures_in_signing'));
    return;
  }
  const lib = (window.FIELD_LIB || {})[f.fieldType] || { input: 'text' };
  if (lib.input === 'file' || lib.input === 'image') { tplFormFlashRow(idx); return; }
  tplFormPopover(c, idx, span);
  tplFormFlashRow(idx, { quiet: true });
}
function tplFormFlashRow(idx, opts = {}) {
  const host = document.getElementById('tplform-section');
  const input = host && (host.querySelector(`[data-tplf="${idx}"]`) || host.querySelector(`[data-tplf-file="${idx}"]`));
  if (!input) return;
  try { input.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (_) {}
  input.style.outline = '2px solid var(--accent-solid)';
  input.style.outlineOffset = '1px';
  setTimeout(() => { input.style.outline = ''; input.style.outlineOffset = ''; }, 1600);
  if (!opts.quiet) { try { input.focus(); } catch (_) {} }
}
function tplFormPopover(c, idx, anchor) {
  document.getElementById('tplf-pop')?.remove();
  const form = c.templateForm;
  const f = form.fields[idx];
  const r = anchor.getBoundingClientRect();
  const pop = document.createElement('div');
  pop.id = 'tplf-pop';
  pop.style.cssText = `position:fixed;z-index:80;top:${Math.round(r.bottom + 6)}px;left:${Math.round(Math.min(Math.max(8, r.left), (window.innerWidth || 1200) - 296))}px;width:284px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:10px;box-shadow:var(--shadow-md);padding:10px 12px`;
  pop.innerHTML = `
    <div style="font-size:11px;font-weight:600;margin-bottom:5px">${esc(f.label || f.fieldKey)}${f.required ? ' <span style="color:var(--st-ruby-fg)">*</span>' : ''}</div>
    ${tplFormInputHtml(f, (form.values || {})[f.fieldKey], idx)}
    ${f.helpText ? `<div style="font-size:10px;color:var(--color-neutral-500);margin-top:4px">${esc(f.helpText)}</div>` : ''}
    <div data-tplf-pop-err style="display:none;font-size:10.5px;color:var(--st-ruby-fg);margin-top:4px"></div>`;
  document.body.appendChild(pop);
  const input = pop.querySelector('[data-tplf]');
  let done = false; // Enter commits, then the focused input's blur fires change — one door only
  const away = e => { if (!pop.contains(e.target)) close(); };
  const close = () => { done = true; pop.remove(); document.removeEventListener('mousedown', away, true); };
  document.addEventListener('mousedown', away, true);
  const commitPop = () => {
    if (done) return;
    const v = input ? input.value : '';
    const s2 = String(v || '').trim();
    if (s2 && window.fieldLibValidate) {
      const problem = fieldLibValidate({ label: f.label, field_key: f.fieldKey, field_type: f.fieldType,
        control: f.control, options: f.options, required: f.required }, s2);
      if (problem) {
        const err = pop.querySelector('[data-tplf-pop-err]');
        err.textContent = problem; err.style.display = 'block';
        return; // an invalid value never leaves the popover
      }
    }
    close();
    tplFormCommit(c, idx, v);
  };
  input?.addEventListener('change', commitPop);
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') commitPop(); if (e.key === 'Escape') close(); });
  try { input?.focus(); } catch (_) {}
}

Object.assign(window, {
  /* The whole cached list, drafts included, for surfaces that render company
     templates as rows of their own (the Templates page's library table)
     rather than through renderCompanyTemplatesSection's card grid. */
  tplLibAll: () => ({ list: _tplLib.list.slice(), canManage: _tplLib.canManage, loaded: _tplLib.loaded }),
  tplLibUploadModal, tplLibCreateModal,
  renderCompanyTemplatesSection, tplLibPublished, tplLibCount, tplLibRefresh,
  openTemplateLibDetail, tplLibCanManage, tplLibCancelPending,
  saveContractToLibrary, tplLibNewContract, renderTemplateFormSection, openTemplateConfirm,
  tplFormCommit, tplFormBlankClick,
  TPLLIB_CATEGORIES, TPLLIB_STATUS,
});
