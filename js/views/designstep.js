// HaTi — the Design step (DESIGN-contract-designer.md §3).
//
// The unskippable screen between the template builder and Publish: pick one
// of the five designs, place the logo, watch the actual document wear it,
// then publish. With a company default already saved it opens pre-dressed
// and Publish is one click — the step never slows anyone down, and nothing
// unbranded leaves HaTi.
//
// Also opened from Team & Settings ("Edit company design") to set or change
// the company default without publishing anything.
//
// Follows the openTemplateConfirm precedent: paints #content directly,
// holds its state in a module-level bag, returns to the caller's screen.

let _ds = null; // { mode:'publish'|'settings', tid, vid, versionNumber, templateName,
                //   form, b (working branding), orgHadDesign, saveDefault,
                //   posTouched, changeNote, onBack }

async function openDesignStep(opts) {
  await refreshOrgBranding();
  const org = window.ORG_BRANDING || null;
  const seed = normalizeDesignBranding(org || {}) || normalizeDesignBranding({});
  if (!seed.designId) { seed.designId = DOC_DESIGNS[0].id; seed.logoPosition = DOC_DESIGNS[0].defaultLogoPos; }
  _ds = {
    mode: opts.mode || 'publish',
    tid: opts.tid, vid: opts.vid, versionNumber: opts.versionNumber,
    templateName: opts.templateName || '', form: opts.form || null,
    b: seed,
    orgHadDesign: !!(org && org.designId),
    saveDefault: !(org && org.designId),   // the first design IS the company standard (decision 1)
    posTouched: !!(org && org.designId),   // a saved default's position is a choice; keep it across design switches
    changeNote: '', onBack: opts.onBack || null,
  };
  dsPaint();
}

/* The document the preview dresses. Publish mode renders the REAL draft —
   blocks and fields exactly as the builder holds them; settings mode shows a
   small honest sample so the five looks can be compared on something. */
function dsPreviewBody() {
  if (_ds.form && window.templateFormDocHtml) return templateFormDocHtml(_ds.form);
  return `<h1>Master Services Agreement</h1>
    <p><strong>1. Services.</strong> The Supplier shall provide the services described in Schedule A with reasonable skill and care, in accordance with this Agreement.</p>
    <p><strong>2. Term.</strong> This Agreement commences on the Effective Date and continues for twelve (12) months unless terminated earlier under clause 7.</p>
    <p><strong>3. Payment.</strong> Invoices are payable within thirty (30) days of receipt. Amounts are exclusive of VAT.</p>
    <p><strong>Signed for the Company</strong><br>Name: <span class="hati-field">full name</span><br>Title: <span class="hati-field">job title</span></p>`;
}
function dsPreviewContract() {
  return {
    name: _ds.templateName || 'Sample agreement',
    counterparty: 'Counterparty Ltd',
    effectiveDate: _ds.mode === 'settings' ? '01 Sep 2026' : null,
    branding: _ds.b, templateForm: _ds.form || undefined,
  };
}

function dsPaint() {
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
  const b = _ds.b;
  const design = docDesignById(b.designId) || DOC_DESIGNS[0];
  const publish = _ds.mode === 'publish';

  const designCards = DOC_DESIGNS.map(d => {
    const sel = d.id === b.designId;
    return `
    <button data-ds-pick="${d.id}" style="display:block;width:100%;text-align:left;cursor:pointer;font:inherit;
      background:${sel ? 'var(--color-accent-100)' : 'var(--color-surface)'};
      border:${sel ? '2px solid var(--color-accent-700)' : '1px solid var(--color-divider)'};
      border-radius:12px;padding:${sel ? '11px 13px' : '12px 14px'};margin-bottom:8px">
      <span style="display:flex;align-items:center;gap:8px">
        <b style="font-size:12.5px;flex:1">${esc(d.name)}</b>
        ${sel ? `<span class="badge" style="background:var(--color-accent-700);color:#fff;font-size:9px">Selected</span>` : ''}
      </span>
      <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);line-height:1.45;margin-top:3px">${esc(d.blurb)}</span>
      <span style="display:block;font-size:9.5px;color:var(--color-neutral-500);margin-top:3px">Best for: ${esc(d.bestFor)}</span>
    </button>`;
  }).join('');

  const posChips = DESIGN_LOGO_POSITIONS.map(p => {
    const label = { 'top-left': 'Top left', 'top-center': 'Top centre', 'top-right': 'Top right', footer: 'Footer' }[p];
    const sel = b.logoPosition === p;
    return `<button data-ds-pos="${p}" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${sel ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">${label}</button>`;
  }).join('');

  const accentRow = design.usesAccent ? `
    <div style="margin-top:14px">
      <span style="display:block;font-size:11px;font-weight:600;margin-bottom:5px">Accent colour</span>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button data-ds-accentsrc="logo" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${b.accentSource !== 'manual' ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">From logo</button>
        <button data-ds-accentsrc="manual" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${b.accentSource === 'manual' ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">Pick my own</button>
        ${b.accentSource === 'manual' ? `<input type="color" id="ds-accent" value="${b.accentColor || '#37474f'}" style="width:34px;height:26px;border:1px solid var(--color-divider);border-radius:4px;padding:1px;background:var(--color-surface);cursor:pointer">` : ''}
        <span style="display:inline-block;width:15px;height:15px;border-radius:4px;background:${b.accentColor || '#37474f'};border:1px solid var(--color-divider)" title="Current accent"></span>
      </div>
      ${b.accentSource !== 'manual' && !b.accentColor ? `<span style="display:block;font-size:10px;color:var(--color-neutral-500);margin-top:4px">${b.logoUrl ? 'No strong colour found in the logo — a dark neutral is used instead.' : 'Upload a logo and HaTi picks its colour automatically.'}</span>` : ''}
    </div>` : `
    <div style="margin-top:14px;font-size:10px;color:var(--color-neutral-500);line-height:1.5">${esc(design.name)} is deliberately monochrome — the accent colour shows in Modern Minimal and Bold Corporate.</div>`;

  const paper = `
    <div style="background:#fbfbfc;box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;max-width:680px;margin:0 auto;${docDesignPaperStyle(b)}">
      ${docDesignHeaderHtml(b, dsPreviewContract(), { bleedX: 36, bleedY: 30 })}
      <article class="doc-surface" style="background:transparent"><div class="hati-doc">${dsPreviewBody()}</div></article>
      ${docDesignFooterHtml(b, dsPreviewContract())}
    </div>`;

  document.getElementById('content').innerHTML = `
  <div class="view-enter" style="padding:16px 18px 28px;display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="ds-back" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} ${publish ? 'Back to builder' : 'Back to settings'}</button>
      <h3 style="margin:0;font-family:var(--font-heading);font-size:15.5px;font-weight:700">Design${publish ? ` — publish ${esc(_ds.templateName)} v${_ds.versionNumber}` : ' — your company standard'}</h3>
      <span style="font-size:11px;color:var(--color-neutral-600)">${publish
        ? 'Every contract from this template will wear the design you pick here. The wording never changes — only the look.'
        : 'Every contract the team publishes or shares wears this design. The wording never changes — only the look.'}</span>
    </div>

    <div style="display:grid;grid-template-columns:250px minmax(0,1fr) 290px;gap:14px;align-items:start">
      <section style="${CARD};padding:12px 12px 6px">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:12px;margin:0 0 9px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-neutral-600)">Choose a design</h4>
        ${designCards}
      </section>

      <section style="padding:6px 0">${paper}</section>

      <section style="${CARD};padding:14px 16px">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-neutral-600)">Company branding</h4>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:86px;height:48px;border:1px dashed var(--color-divider);border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
            ${b.logoUrl ? `<img src="${b.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">` : `<span style="font-size:9.5px;color:var(--color-neutral-500)">No logo</span>`}
          </div>
          <div>
            <input type="file" id="ds-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
            <button id="ds-logo-btn" class="ui-btn" style="font-size:10.5px;padding:3px 9px">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
            <span style="display:block;font-size:9.5px;color:var(--color-neutral-500);margin-top:3px">PNG or JPG, under 500 KB</span>
          </div>
        </div>
        <div style="margin-top:14px">
          <span style="display:block;font-size:11px;font-weight:600;margin-bottom:5px">Logo position</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${posChips}</div>
        </div>
        ${accentRow}
        <div style="margin-top:14px;display:grid;gap:7px">
          <input id="ds-b-name" style="${INP}" placeholder="Company name" value="${esc(b.companyName)}">
          <input id="ds-b-reg" style="${INP}" placeholder="Registration number" value="${esc(b.registrationNumber)}">
          <input id="ds-b-addr" style="${INP}" placeholder="Registered address" value="${esc(b.address)}">
          <input id="ds-b-footer" style="${INP}" placeholder="Footer text (e.g. Registered in Kenya · C.123456)" value="${esc(b.footerText)}">
        </div>
        ${publish ? `
        <label style="display:block;margin-top:14px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">What changed, and why?</span>
          <textarea id="ds-note" style="${INP};min-height:48px" maxlength="500" placeholder="e.g. Payment terms now offer 30/45/60 days">${esc(_ds.changeNote)}</textarea></label>
        <label style="display:flex;align-items:flex-start;gap:7px;margin-top:12px;font-size:11px;line-height:1.5;${_ds.orgHadDesign ? 'cursor:pointer' : 'opacity:.75'}">
          <input type="checkbox" id="ds-default" ${_ds.saveDefault ? 'checked' : ''} ${_ds.orgHadDesign ? '' : 'disabled'} style="margin-top:2px">
          <span>${_ds.orgHadDesign
            ? 'Also make this the company default for future contracts'
            : '<b>This becomes your company default.</b> Your first design is saved as the standard — later contracts arrive already dressed in it.'}</span>
        </label>
        <button id="ds-publish" class="ui-btn ui-btn-primary" style="width:100%;margin-top:12px;font-size:13px;padding:8px">Publish v${_ds.versionNumber}</button>
        <p style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin:8px 0 0">Publishing freezes this version forever and makes it what the whole team creates contracts from. Contracts already created from earlier versions are not touched.</p>`
      : `
        <button id="ds-save" class="ui-btn ui-btn-primary" style="width:100%;margin-top:16px;font-size:13px;padding:8px">Save company design</button>
        <p style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin:8px 0 0">Applies to future documents and anything not yet executed. Signed contracts keep the look they were sealed with.</p>`}
      </section>
    </div>
  </div>`;

  document.getElementById('ds-back')?.addEventListener('click', () => { const go = _ds.onBack; _ds = null; if (go) go(); });
  document.querySelectorAll('[data-ds-pick]').forEach(el => el.addEventListener('click', () => {
    dsHarvest();
    _ds.b.designId = el.getAttribute('data-ds-pick');
    if (!_ds.posTouched) _ds.b.logoPosition = docDesignById(_ds.b.designId).defaultLogoPos;
    dsPaint();
  }));
  document.querySelectorAll('[data-ds-pos]').forEach(el => el.addEventListener('click', () => {
    dsHarvest(); _ds.posTouched = true; _ds.b.logoPosition = el.getAttribute('data-ds-pos'); dsPaint();
  }));
  document.querySelectorAll('[data-ds-accentsrc]').forEach(el => el.addEventListener('click', async () => {
    dsHarvest();
    const src = el.getAttribute('data-ds-accentsrc');
    _ds.b.accentSource = src;
    if (src === 'logo') _ds.b.accentColor = _ds.b.logoUrl ? await extractAccentFromLogo(_ds.b.logoUrl) : null;
    dsPaint();
  }));
  document.getElementById('ds-accent')?.addEventListener('change', e => {
    dsHarvest(); _ds.b.accentColor = accentLegible(e.target.value); dsPaint();
  });
  document.getElementById('ds-logo-btn')?.addEventListener('click', () => document.getElementById('ds-logo-file').click());
  document.getElementById('ds-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast('Keep the logo under 500 KB', 'err'); return; }
    const r = new FileReader();
    r.onload = async () => {
      dsHarvest();
      _ds.b.logoUrl = String(r.result);
      if (_ds.b.accentSource !== 'manual') _ds.b.accentColor = await extractAccentFromLogo(_ds.b.logoUrl);
      dsPaint();
    };
    r.readAsDataURL(file);
  });
  ['ds-b-name', 'ds-b-reg', 'ds-b-addr', 'ds-b-footer'].forEach(id =>
    document.getElementById(id)?.addEventListener('input', () => dsHarvestIdentity()));
  document.getElementById('ds-default')?.addEventListener('change', e => { _ds.saveDefault = e.target.checked; });
  document.getElementById('ds-publish')?.addEventListener('click', dsPublish);
  document.getElementById('ds-save')?.addEventListener('click', dsSaveDefault);
}

/* Text inputs write straight into the working copy — no repaint needed (a
   repaint per keystroke would drop focus); the identity fields only show in
   the header, and the paint on the next design/position click refreshes it. */
function dsHarvestIdentity() {
  const g = id => (document.getElementById(id) || { value: null }).value;
  if (g('ds-b-name') != null) _ds.b.companyName = g('ds-b-name').trim();
  if (g('ds-b-reg') != null) _ds.b.registrationNumber = g('ds-b-reg').trim();
  if (g('ds-b-addr') != null) _ds.b.address = g('ds-b-addr').trim();
  if (g('ds-b-footer') != null) _ds.b.footerText = g('ds-b-footer').trim();
}
function dsHarvest() {
  dsHarvestIdentity();
  const note = document.getElementById('ds-note');
  if (note) _ds.changeNote = note.value;
}

/* Identity and the logo are the company's facts and ALWAYS save to the org
   profile; the design choice saves as default only when asked (or on first
   use, where the first design becomes the standard — decision 1). A design
   chosen for this template alone rides the publish call as an override. */
function dsOrgPayload() {
  const b = _ds.b, org = window.ORG_BRANDING || {};
  const asDefault = _ds.saveDefault;
  return {
    logoUrl: b.logoUrl, companyName: b.companyName, registrationNumber: b.registrationNumber,
    address: b.address, defaultFooterText: b.footerText,
    designId: asDefault ? b.designId : (org.designId || null),
    logoPosition: asDefault ? b.logoPosition : (org.logoPosition || null),
    accentColor: asDefault ? b.accentColor : (org.accentColor || null),
    accentSource: asDefault ? b.accentSource : (org.accentSource || null),
  };
}

async function dsPublish() {
  dsHarvest();
  const btn = document.getElementById('ds-publish');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="animate-pulse">Publishing…</span>'; }
  try {
    await saveOrgBranding(dsOrgPayload());
    const design = _ds.saveDefault ? null
      : { designId: _ds.b.designId, logoPosition: _ds.b.logoPosition, accentColor: _ds.b.accentColor };
    const r = await api(`templates/${_ds.tid}/versions/${_ds.vid}/publish`, 'POST',
      { changeNote: _ds.changeNote.trim(), design });
    (r.warnings || []).forEach(w => toast(w, 'err'));
    toast(`v${r.versionNumber} published in ${docDesignById(_ds.b.designId).name} — the team can create contracts from it now`);
    const tid = _ds.tid; _ds = null;
    openTemplateLibDetail(tid);
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = `Publish v${_ds.versionNumber}`; }
    ((e.data && e.data.problems) || [e.message]).forEach(p => toast(p, 'err'));
  }
}

async function dsSaveDefault() {
  dsHarvest();
  _ds.saveDefault = true;   // settings mode edits the default by definition
  const btn = document.getElementById('ds-save');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="animate-pulse">Saving…</span>'; }
  try {
    await saveOrgBranding(dsOrgPayload());
    toast(`${docDesignById(_ds.b.designId).name} is now your company design`);
    const go = _ds.onBack; _ds = null; if (go) go();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save company design'; }
    toast(e.message, 'err');
  }
}

Object.assign(window, { openDesignStep });
