// HaTi — Template Builder (Phase B of the Template Library).
//
// Edits exactly one DRAFT version of a library template: blocks (headings,
// fixed wording, field groups, signature blocks, a branding header) and the
// typed fields the wording refers to as {{placeholders}}. The server refuses
// edits to anything but a draft, so this screen can never touch a published
// version no matter what it sends.
//
// The AI upload route (Phase D) lands its output HERE — this builder is the
// one place template content is shaped, whichever door it came in through.

let _tb = null; // { tid, vid, template, versionNumber, blocks[], fields[], dirty }

const TB_BLOCK_META = {
  heading:         { label: 'Heading',          tip: 'A section title — never editable by contract creators' },
  fixed_text:      { label: 'Fixed wording',    tip: 'Clauses and boilerplate — read-only on every contract' },
  field_group:     { label: 'Wording with blanks', tip: 'Text with {{field}} placeholders users fill per deal' },
  signature_block: { label: 'Signature block',  tip: 'Name + title + signature, wired into the signing flow' },
  branding:        { label: 'Branding header',  tip: 'Logo and company details from the org profile' },
};

async function openTemplateBuilder(tid, vid) {
  if (window.tplLibCancelPending) tplLibCancelPending(); // a stale library list must not paint over the builder
  let t, v;
  try {
    t = await api('templates/' + tid);
    v = await api(`templates/${tid}/versions/${vid}`);
  } catch (e) { toast(e.message, 'err'); return; }
  if (v.version.status !== 'draft') { toast(`v${v.version.versionNumber} is ${v.version.status} — only a draft can be edited`, 'err'); return; }
  _tb = {
    tid, vid, template: t.template, versionNumber: v.version.versionNumber,
    blocks: v.blocks.map(b => ({ blockType: b.blockType, content: b.content })),
    fields: v.fields.map(f => ({
      fieldKey: f.field_key, label: f.label, section: f.section || '', fieldType: f.field_type,
      control: f.control, options: f.options || [], required: f.required,
      defaultValue: f.default_value || '', helpText: f.help_text || '',
      detectionConfidence: f.detection_confidence, humanReviewed: f.human_reviewed,
    })),
    dirty: false,
  };
  tbPaint();
}

function tbKeyFromLabel(label) {
  const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').replace(/^([0-9])/, 'f$1').slice(0, 64) || 'field';
  let key = base, n = 2;
  while (_tb.fields.some(f => f.fieldKey === key)) key = base + '_' + (n++);
  return key;
}
const tbPlaceholderUse = key => _tb.blocks.filter(b => b.content.includes(`{{${key}}}`)).length;

function tbPaint() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
  const t = _tb.template;

  const blockRows = _tb.blocks.map((b, i) => {
    const meta = TB_BLOCK_META[b.blockType] || TB_BLOCK_META.fixed_text;
    const editor = b.blockType === 'branding'
      ? `<div style="font-size:11px;color:var(--color-neutral-600);padding:6px 0">Logo + company details render here from the org profile (set them in the Branding panel below).</div>`
      : b.blockType === 'signature_block'
        ? `<input data-tb-content="${i}" value="${esc(b.content)}" placeholder="Who signs here — e.g. Company, Counterparty, Director" style="${INP}">`
        : `<textarea data-tb-content="${i}" style="${INP};min-height:${b.blockType === 'heading' ? 34 : 64}px;resize:vertical" placeholder="${b.blockType === 'heading' ? 'Section title' : 'Wording — use {{field_key}} where a blank sits'}">${esc(b.content)}</textarea>`;
    return `
    <div style="display:flex;gap:8px;padding:10px 14px;border-bottom:1px solid var(--color-divider);align-items:flex-start" data-tb-row="${i}">
      <div style="flex:none;display:flex;flex-direction:column;gap:2px;padding-top:2px">
        <button data-tb-up="${i}" class="ui-btn" style="padding:1px 6px;font-size:10px" ${i === 0 ? 'disabled' : ''} title="Move up">↑</button>
        <button data-tb-down="${i}" class="ui-btn" style="padding:1px 6px;font-size:10px" ${i === _tb.blocks.length - 1 ? 'disabled' : ''} title="Move down">↓</button>
      </div>
      <div style="min-width:0;flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-neutral-600)" title="${esc(meta.tip)}">${meta.label}</span>
          ${b.blockType === 'field_group' && !/\{\{[a-z0-9_]+\}\}/.test(b.content) ? `<span style="font-size:10px;color:#8a5a19">no {{placeholder}} yet</span>` : ''}
          <span style="flex:1"></span>
          <button data-tb-del="${i}" class="ui-btn" style="padding:2px 7px;font-size:10px;border-color:#e6c9c1;color:#8f322b" title="Remove block">${icon('x', 'w-3 h-3')}</button>
        </div>
        ${editor}
      </div>
    </div>`;
  }).join('');

  const fieldRows = _tb.fields.map((f, i) => {
    const lib = (window.FIELD_LIB || {})[f.fieldType] || { label: f.fieldType };
    const uses = tbPlaceholderUse(f.fieldKey);
    const conf = f.detectionConfidence !== 'manual' && !f.humanReviewed
      ? `<span class="badge" style="background:${f.detectionConfidence === 'low' ? '#fbeaea' : '#fdf3e2'};color:${f.detectionConfidence === 'low' ? '#8f322b' : '#8a5a19'}" title="Detected by the converter — not yet reviewed">${f.detectionConfidence} confidence</span>` : '';
    return `
    <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-bottom:1px solid var(--color-divider)">
      <span style="min-width:0;flex:1">
        <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <b style="font-size:12px">${esc(f.label || f.fieldKey)}</b>
          ${f.required ? '<span style="color:#8f322b;font-size:11px" title="Required">*</span>' : ''}
          ${conf}
        </span>
        <span style="display:block;font-size:10px;color:var(--color-neutral-600);font-family:var(--font-mono)">{{${esc(f.fieldKey)}}} · ${esc(lib.label)}${f.control === 'guided' ? ` · guided (${f.options.length})` : ''}${f.defaultValue ? ' · default set' : ''} · ${uses ? `in ${uses} block${uses === 1 ? '' : 's'}` : '<span style="color:#8a5a19">unplaced</span>'}</span>
      </span>
      <button data-tb-fcopy="${i}" class="ui-btn" style="font-size:10px;padding:2px 8px" title="Copy the placeholder to paste into a block">${icon('copy', 'w-3 h-3')}</button>
      <button data-tb-fedit="${i}" class="ui-btn" style="font-size:10px;padding:2px 8px">Edit</button>
      <button data-tb-fdel="${i}" class="ui-btn" style="font-size:10px;padding:2px 7px;border-color:#e6c9c1;color:#8f322b">${icon('x', 'w-3 h-3')}</button>
    </div>`;
  }).join('');

  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:14px;max-width:980px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="tb-back" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} ${esc(t.name)}</button>
      <span style="font-family:var(--font-mono);font-size:11.5px;font-weight:600;color:var(--color-accent-700);border:1px solid var(--color-accent-300);background:var(--color-accent-100);border-radius:3px;padding:1px 7px">v${_tb.versionNumber} draft</span>
      <span id="tb-dirty" style="font-size:11px;color:var(--color-neutral-500)">${_tb.dirty ? 'Unsaved changes' : ''}</span>
      <span style="flex:1"></span>
      <button id="tb-save" class="ui-btn" style="font-size:12px;padding:5px 13px">${icon('check2', 'w-3.5 h-3.5')} Save draft</button>
      <button id="tb-publish" class="ui-btn ui-btn-primary" style="font-size:12px;padding:5px 13px">Publish v${_tb.versionNumber}</button>
    </div>

    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13.5px;margin:0">Document blocks</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">in the order they appear on the contract</span>
        <span style="flex:1"></span>
        <select id="tb-addtype" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:4px 8px;font:inherit;font-size:11.5px">
          ${Object.entries(TB_BLOCK_META).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('')}
        </select>
        <button id="tb-addblock" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('plus', 'w-3 h-3')} Add block</button>
      </div>
      ${blockRows || '<div style="padding:26px;text-align:center;color:var(--color-neutral-500);font-size:12px">No blocks yet — add a heading or paste your standard wording as fixed text.</div>'}
    </section>

    <section style="${CARD}">
      <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--color-divider)">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13.5px;margin:0">Fields</h4>
        <span style="font-size:10.5px;color:var(--color-neutral-600)">the blanks a contract creator fills — place them in wording as {{field_key}}</span>
        <span style="flex:1"></span>
        <button id="tb-addfield" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('plus', 'w-3 h-3')} Add field</button>
      </div>
      ${fieldRows || '<div style="padding:26px;text-align:center;color:var(--color-neutral-500);font-size:12px">No fields yet — every blank a user should fill per deal is a field.</div>'}
    </section>

    <section style="${CARD};padding:14px 16px" id="tb-branding"></section>
  </div>`;

  document.getElementById('tb-back')?.addEventListener('click', () => tbLeave());
  document.getElementById('tb-save')?.addEventListener('click', () => tbSave());
  document.getElementById('tb-publish')?.addEventListener('click', () => tbPublish());
  document.getElementById('tb-addblock')?.addEventListener('click', () => {
    const type = document.getElementById('tb-addtype').value;
    if (type === 'branding' && _tb.blocks.some(b => b.blockType === 'branding')) { toast('There is already a branding header', 'err'); return; }
    _tb.blocks.push({ blockType: type, content: type === 'signature_block' ? 'Company' : '' });
    _tb.dirty = true; tbPaint();
  });
  document.getElementById('tb-addfield')?.addEventListener('click', () => tbFieldModal(null));
  document.querySelectorAll('[data-tb-content]').forEach(el => el.addEventListener('input', () => {
    _tb.blocks[Number(el.getAttribute('data-tb-content'))].content = el.value;
    _tb.dirty = true;
    const d = document.getElementById('tb-dirty'); if (d) d.textContent = 'Unsaved changes';
  }));
  document.querySelectorAll('[data-tb-up]').forEach(el => el.addEventListener('click', () => tbMove(Number(el.getAttribute('data-tb-up')), -1)));
  document.querySelectorAll('[data-tb-down]').forEach(el => el.addEventListener('click', () => tbMove(Number(el.getAttribute('data-tb-down')), +1)));
  document.querySelectorAll('[data-tb-del]').forEach(el => el.addEventListener('click', () => {
    _tb.blocks.splice(Number(el.getAttribute('data-tb-del')), 1); _tb.dirty = true; tbPaint();
  }));
  document.querySelectorAll('[data-tb-fedit]').forEach(el => el.addEventListener('click', () => tbFieldModal(Number(el.getAttribute('data-tb-fedit')))));
  document.querySelectorAll('[data-tb-fcopy]').forEach(el => el.addEventListener('click', () => {
    const f = _tb.fields[Number(el.getAttribute('data-tb-fcopy'))];
    const ph = `{{${f.fieldKey}}}`;
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ph);
    toast(`${ph} copied — paste it into a wording block`);
  }));
  document.querySelectorAll('[data-tb-fdel]').forEach(el => el.addEventListener('click', async () => {
    const i = Number(el.getAttribute('data-tb-fdel'));
    const f = _tb.fields[i];
    const uses = tbPlaceholderUse(f.fieldKey);
    if (uses) {
      const ok = typeof confirmDialog === 'function'
        ? await confirmDialog({ title: `Remove “${f.label || f.fieldKey}”?`, message: `Its placeholder {{${f.fieldKey}}} still sits in ${uses} block${uses === 1 ? '' : 's'} and would render as literal text.`, confirmLabel: 'Remove field', danger: true })
        : true;
      if (!ok) return;
    }
    _tb.fields.splice(i, 1); _tb.dirty = true; tbPaint();
  }));
  tbPaintBranding();
}

function tbMove(i, d) {
  const j = i + d;
  if (j < 0 || j >= _tb.blocks.length) return;
  const [b] = _tb.blocks.splice(i, 1);
  _tb.blocks.splice(j, 0, b);
  _tb.dirty = true; tbPaint();
}

function tbLeave() {
  const go = () => openTemplateLibDetail(_tb.tid);
  if (!_tb.dirty) return go();
  (typeof confirmDialog === 'function'
    ? confirmDialog({ title: 'Leave without saving?', message: 'The edits since your last save will be lost.', confirmLabel: 'Leave', danger: true })
    : Promise.resolve(true)).then(ok => { if (ok) go(); });
}

async function tbSave(quiet) {
  try {
    await api(`templates/${_tb.tid}/versions/${_tb.vid}`, 'PUT', {
      blocks: _tb.blocks.map((b, i) => ({ orderIndex: i, blockType: b.blockType, content: b.content })),
      fields: _tb.fields.map((f, i) => ({ ...f, orderIndex: i, humanReviewed: true })),
    });
    _tb.dirty = false;
    if (!quiet) { toast('Draft saved'); const d = document.getElementById('tb-dirty'); if (d) d.textContent = ''; }
    return true;
  } catch (e) { toast(e.message, 'err'); return false; }
}

async function tbPublish() {
  if (!await tbSave(true)) return;
  openModal(`
    <div style="padding:20px 22px;max-width:460px">
      <h3 style="margin:0 0 4px;font-family:var(--font-heading);font-size:16px;font-weight:700">Publish v${_tb.versionNumber}</h3>
      <p style="margin:0 0 12px;font-size:11.5px;color:var(--color-neutral-600);line-height:1.5">
        Publishing freezes this version forever and makes it what the whole team creates contracts from.
        Contracts already created from earlier versions are not touched.</p>
      <label style="display:block;margin-bottom:14px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">What changed, and why?</span>
        <textarea id="tb-note" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none;min-height:52px" maxlength="500" placeholder="e.g. Payment terms now offer 30/45/60 days"></textarea></label>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button class="ui-btn" onclick="closeModal()">Cancel</button>
        <button id="tb-pub-go" class="ui-btn ui-btn-primary">Publish</button>
      </div>
    </div>`);
  document.getElementById('tb-pub-go')?.addEventListener('click', async () => {
    try {
      const r = await api(`templates/${_tb.tid}/versions/${_tb.vid}/publish`, 'POST', {
        changeNote: document.getElementById('tb-note').value.trim() });
      closeModal();
      (r.warnings || []).forEach(w => toast(w, 'err'));
      toast(`v${r.versionNumber} published — the team can create contracts from it now`);
      openTemplateLibDetail(_tb.tid);
    } catch (e) {
      closeModal();
      ((e.data && e.data.problems) || [e.message]).forEach(p => toast(p, 'err'));
    }
  });
}

/* ---------- field editor modal ---------- */
function tbFieldModal(index) {
  const f = index != null ? { ..._tb.fields[index] } : {
    fieldKey: '', label: '', section: '', fieldType: 'short_text', control: 'free',
    options: [], required: false, defaultValue: '', helpText: '',
    detectionConfidence: 'manual', humanReviewed: true,
  };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
  const types = Object.entries(window.FIELD_LIB || {}).map(([k, v]) =>
    `<option value="${k}"${f.fieldType === k ? ' selected' : ''}>${v.label}</option>`).join('');
  openModal(`
    <div style="padding:20px 22px;max-width:520px">
      <h3 style="margin:0 0 14px;font-family:var(--font-heading);font-size:16px;font-weight:700">${index != null ? 'Edit field' : 'Add field'}</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <label><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Label</span>
          <input id="tbf-label" style="${INP}" maxlength="200" value="${esc(f.label)}" placeholder="e.g. KRA PIN"></label>
        <label><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Type</span>
          <select id="tbf-type" style="${INP}">${types}</select></label>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <label><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Answers</span>
          <select id="tbf-control" style="${INP}">
            <option value="free"${f.control === 'free' ? ' selected' : ''}>Free — user types anything valid</option>
            <option value="guided"${f.control === 'guided' ? ' selected' : ''}>Guided — pick from approved options</option>
          </select></label>
        <label style="display:flex;align-items:flex-end;gap:7px;padding-bottom:8px">
          <input type="checkbox" id="tbf-required" ${f.required ? 'checked' : ''}>
          <span style="font-size:12px">Required</span></label>
      </div>
      <label id="tbf-optwrap" style="display:${f.control === 'guided' ? 'block' : 'none'};margin-top:10px">
        <span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Approved options <span style="font-weight:400;color:var(--color-neutral-500)">(one per line — users cannot invent others)</span></span>
        <textarea id="tbf-options" style="${INP};min-height:64px">${esc(f.options.join('\n'))}</textarea></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
        <label><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Default value <span style="font-weight:400;color:var(--color-neutral-500)">(supports {{org.…}})</span></span>
          <input id="tbf-default" style="${INP}" maxlength="2000" value="${esc(f.defaultValue)}" placeholder="e.g. {{org.company_name}}"></label>
        <label><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Section <span style="font-weight:400;color:var(--color-neutral-500)">(groups the form)</span></span>
          <input id="tbf-section" style="${INP}" maxlength="200" value="${esc(f.section)}" placeholder="e.g. Company information"></label>
      </div>
      <label style="display:block;margin-top:10px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">Help text</span>
        <input id="tbf-help" style="${INP}" maxlength="1000" value="${esc(f.helpText)}" placeholder="Shown under the input"></label>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:16px">
        <span style="font-size:10.5px;color:var(--color-neutral-500);font-family:var(--font-mono)" id="tbf-keyprev">${f.fieldKey ? `{{${esc(f.fieldKey)}}}` : ''}</span>
        <div style="display:flex;gap:8px">
          <button class="ui-btn" onclick="closeModal()">Cancel</button>
          <button id="tbf-save" class="ui-btn ui-btn-primary">${index != null ? 'Save field' : 'Add field'}</button>
        </div>
      </div>
    </div>`);
  document.getElementById('tbf-control')?.addEventListener('change', e => {
    document.getElementById('tbf-optwrap').style.display = e.target.value === 'guided' ? 'block' : 'none';
  });
  document.getElementById('tbf-label')?.addEventListener('input', e => {
    if (index == null) document.getElementById('tbf-keyprev').textContent = '{{' + tbKeyFromLabel(e.target.value) + '}}';
  });
  document.getElementById('tbf-save')?.addEventListener('click', () => {
    const label = document.getElementById('tbf-label').value.trim();
    if (!label) { toast('A field needs a label', 'err'); return; }
    const control = document.getElementById('tbf-control').value;
    const options = document.getElementById('tbf-options').value.split('\n').map(s => s.trim()).filter(Boolean);
    if (control === 'guided' && !options.length) { toast('A guided field needs at least one approved option', 'err'); return; }
    const next = {
      ...f, label, control, options: control === 'guided' ? options : [],
      fieldType: document.getElementById('tbf-type').value,
      required: document.getElementById('tbf-required').checked,
      defaultValue: document.getElementById('tbf-default').value.trim(),
      section: document.getElementById('tbf-section').value.trim(),
      helpText: document.getElementById('tbf-help').value.trim(),
      humanReviewed: true,
    };
    if (index == null) next.fieldKey = tbKeyFromLabel(label);
    if (index != null) _tb.fields[index] = next; else _tb.fields.push(next);
    _tb.dirty = true; closeModal(); tbPaint();
  });
}

/* ---------- branding panel (org-level, rendered on every template) ---------- */
async function tbPaintBranding() {
  const host = document.getElementById('tb-branding');
  if (!host) return;
  let b = null;
  try { b = (await api('org/branding')).branding; } catch (_) {}
  b = b || { logoUrl: null, companyName: '', registrationNumber: '', address: '', defaultFooterText: '' };
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
  host.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
      <h4 style="font-family:var(--font-heading);font-weight:600;font-size:13.5px;margin:0">Branding</h4>
      <span style="font-size:10.5px;color:var(--color-neutral-600)">org-wide — renders in the header/footer of every contract created from library templates</span>
    </div>
    <div style="display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:none;display:flex;flex-direction:column;gap:6px;align-items:center">
        <div style="width:120px;height:64px;border:1px dashed var(--color-divider);border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--color-bg)">
          ${b.logoUrl ? `<img src="${b.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">` : `<span style="font-size:10px;color:var(--color-neutral-500)">No logo</span>`}
        </div>
        <input type="file" id="tb-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
        <button id="tb-logo-btn" class="ui-btn" style="font-size:10.5px;padding:3px 9px">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
      </div>
      <div style="min-width:260px;flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <input id="tb-b-name" style="${INP}" placeholder="Company name" value="${esc(b.companyName)}">
        <input id="tb-b-reg" style="${INP}" placeholder="Registration number" value="${esc(b.registrationNumber)}">
        <input id="tb-b-addr" style="${INP};grid-column:1/-1" placeholder="Registered address" value="${esc(b.address)}">
        <input id="tb-b-footer" style="${INP};grid-column:1/-1" placeholder="Footer text (e.g. Registered in Kenya · C.123456)" value="${esc(b.defaultFooterText)}">
        <div style="grid-column:1/-1;display:flex;justify-content:flex-end">
          <button id="tb-b-save" class="ui-btn" style="font-size:11px;padding:4px 11px">Save branding</button>
        </div>
      </div>
    </div>`;
  const save = async (logoUrl) => {
    try {
      await api('org/branding', 'PUT', {
        logoUrl: logoUrl !== undefined ? logoUrl : b.logoUrl,
        companyName: document.getElementById('tb-b-name').value.trim(),
        registrationNumber: document.getElementById('tb-b-reg').value.trim(),
        address: document.getElementById('tb-b-addr').value.trim(),
        defaultFooterText: document.getElementById('tb-b-footer').value.trim(),
      });
      toast('Branding saved'); tbPaintBranding();
    } catch (e) { toast(e.message, 'err'); }
  };
  document.getElementById('tb-b-save')?.addEventListener('click', () => save());
  document.getElementById('tb-logo-btn')?.addEventListener('click', () => document.getElementById('tb-logo-file').click());
  document.getElementById('tb-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast('Keep the logo under 500 KB', 'err'); return; }
    const r = new FileReader();
    r.onload = () => save(String(r.result));
    r.readAsDataURL(file);
  });
}

Object.assign(window, { openTemplateBuilder, TB_BLOCK_META });
