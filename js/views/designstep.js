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

/* THE EIGHT ACCENT COLOURS, ONE LIST (the design step and How our contracts look both offer them): hex, name, word */
const DS_ACCENTS = [
  ['#0f766e', 'Teal', 'teal'], ['#004c78', 'Navy', 'navy'], ['#1e3a8a', 'Royal blue', 'blue'],
  ['#1f5d3a', 'Forest', 'green'], ['#8e3550', 'Claret', 'claret'], ['#9a4a1f', 'Rust', 'rust'],
  ['#5b3a6e', 'Aubergine', 'purple'], ['#37474f', 'Slate', 'slate'],
];
let _ds = null;   // see below
let _dsScroll = null;   // rail + document scroll, held across a repaint
// { mode:'publish'|'settings', tid, vid, versionNumber, templateName,
                //   form, b (working branding), orgHadDesign, saveDefault,
                //   posTouched, changeNote, onBack }

async function openDesignStep(opts) {
  await refreshOrgBranding();
  const org = window.ORG_BRANDING || null;
  const seed = normalizeDesignBranding(org || {}) || normalizeDesignBranding({});
  if (!seed.designId) { seed.designId = DOC_DESIGNS[0].id; seed.logoPosition = DOC_DESIGNS[0].defaultLogoPos; }
  /* Structure seeds to Standard Flow — the layout every document already has.
     Opening this screen must never silently re-lay-out a contract; the
     customer has to choose a different architecture deliberately. */
  if (!seed.structureId) seed.structureId = DEFAULT_STRUCTURE;
  _ds = {
    mode: opts.mode || 'publish',
    tid: opts.tid, vid: opts.vid, versionNumber: opts.versionNumber,
    templateName: opts.templateName || '', form: opts.form || null,
    b: seed,
    orgHadDesign: !!(org && org.designId),
    /* THE COMPANY LOOK IS SET ONLY IN SETTINGS, BY AN ADMIN (owner, 14 Nov 2026; reverses decision 1, "the first design
       IS the company standard"): publishing one paper dresses that paper alone, so the publish step saves no default */
    saveDefault: (opts.mode || 'publish') !== 'publish' && !(org && org.designId),
    posTouched: !!(org && org.designId),   // a saved default's position is a choice; keep it across design switches
    /* A saved default's LAYOUT is a choice too, and one made deliberately —
       so a workspace that already has a design keeps the right to be told when
       a style switch takes that layout away. A first-time design has no such
       choice behind it yet. */
    structureTouched: !!(org && org.designId),
    changeNote: opts.changeNote || '', onBack: opts.onBack || null,
    /* ONE CHOICE PER SCREEN — the style first, then the structure. The style
       list used to sit below five structure cards, so finding it meant
       scrolling past the choice you had already made; splitting them fixed
       that, and the order is now the one people actually work in. You decide
       what the paper LOOKS like, then how the page is laid out — and because
       style leads, a pair the product refuses is refused at the second step,
       against a choice already made, never at the first. */
    step: 1,
    focus: false,
  };
  /* What the screen opened with, so "has anything been chosen" is a
     comparison rather than a flag every control must remember to raise. */
  _ds.seedSig = JSON.stringify(seed);
  dsPaint({ resetScroll: true });
}
/* ---- LEAVING THE STEP ASKS WHEN THERE IS SOMETHING TO LOSE (the owner's
   list, 27 Sep 2026) ----
   A sidebar press left this screen and dropped the design choices without a
   word. The shell's one leave guard (viewLayersClosed, js/app.js) now asks
   this step too: open, and changed from what it opened with. Leaving closes it. */
function designStepOpen(){ return !!_ds; }
function designStepDirty(){
  if (!_ds) return false;
  try { dsHarvest(); } catch (_) {}
  return JSON.stringify(_ds.b) !== _ds.seedSig || !!String(_ds.changeNote || '').trim();
}
function designStepClose(){ _ds = null; }

/* The document the preview dresses. Publish mode renders the REAL draft —
   blocks and fields exactly as the builder holds them; settings mode shows a
   small honest sample so the five looks can be compared on something. */
function dsPreviewBody() {
  return docStructureBodyHtml(_ds.b, dsPreviewBodyRaw());
}
function dsPreviewBodyRaw() {
  if (_ds.form && window.templateFormDocHtml) return templateFormDocHtml(_ds.form);
  /* Real headings, not bolded paragraphs: a structure is read off the document's
     heading structure (Contents First builds from it, Margin Numbers and Ruled
     Clauses hang off it), so a sample written as bold run-ins would show four of
     the five structures doing nothing. */
  return `<h1>Master Services Agreement</h1>
    <p>Made between the Company and the Supplier named below, on the Effective Date.</p>
    <h2>1. Services</h2>
    <p>The Supplier shall provide the services described in Schedule A with reasonable skill and care, in accordance with this Agreement.</p>
    <h2>2. Term</h2>
    <p>This Agreement commences on the Effective Date and continues for twelve (12) months unless terminated earlier under clause 7.</p>
    <h2>3. Payment</h2>
    <p>Invoices are payable within thirty (30) days of receipt. Amounts are exclusive of VAT.</p>
    <h2>4. Confidentiality</h2>
    <p>Each party shall keep confidential all information disclosed by the other and use it only for the purposes of this Agreement.</p>
    <h2>5. Liability</h2>
    <p>Neither party excludes liability for death or personal injury caused by its negligence, or for fraud.</p>
    <h2>6. Governing law</h2>
    <p>This Agreement and any dispute arising from it are governed by the laws of Kenya.</p>
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

/* The sheet's own width, in the document's own type. The zoom below scales the
   whole page; nothing rescales the words inside it, which is what keeps a
   title one line long at every size. */
const DS_PAGE_W = 680;
const DS_ZOOM_MAX = 1.8, DS_ZOOM_MIN = 0.4;

/* Fit the page to the pane, then multiply by the reader's stored text-size
   preference — the same arithmetic applyDocZoom does on the Doc tab, reading
   the same value, so one choice sizes the contract in all three places.
   Unlike the Doc tab this may scale BELOW 1: the Design step's pane is a third
   of the window, and a page that will not fit is a page you cannot judge. */
function dsApplyZoom() {
  const pane = document.getElementById('ds-docpane'), wrap = document.getElementById('ds-zoom');
  if (!pane || !wrap) return;
  const cs = getComputedStyle(pane);
  const room = pane.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 2;
  const fit = Math.min(DS_ZOOM_MAX, Math.max(DS_ZOOM_MIN, room / DS_PAGE_W));
  /* times the reader's zoom (owner, 11 Oct 2026): one zoom on every paper */
  const zoom = window.rlDocZoomFactor ? Number(rlDocZoomFactor()) : 1;
  wrap.style.setProperty('--ds-zoom', (fit * zoom).toFixed(3));
  /* The preference sizes the TYPE, not the page — the same move the other two
     screens made on 13 Aug 2026, kept identical here so one setting cannot
     mean two things in one product. The page still scales to the pane, which
     is what stops a title taking four lines; --doc-scale is the reader's
     choice as a ratio, read by .hati-doc inside the sheet. */
  const pref = (window.rlDocType ? rlDocType() : 15) / 15;
  wrap.style.setProperty('--doc-scale', pref.toFixed(3));
}

/* THE SCROLL SURVIVES THE REPAINT.

   Every pick repaints #content wholesale, so the rail returned to the top and
   the card you had just clicked went with it — on the fifth structure or the
   eighth style, the selection vanished off-screen at the moment you made it.
   Held and restored here rather than fixed by not repainting, which is the
   better answer and a larger change to this view's internals. */
function dsHoldScroll() {
  const g = id => { const el = document.getElementById(id); return el ? el.scrollTop : null; };
  return { rail: g('ds-rail'), doc: g('ds-docpane') };
}
function dsRestoreScroll(held) {
  if (!held) return;
  const put = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.scrollTop = v; };
  put('ds-rail', held.rail);
  put('ds-docpane', held.doc);
}

function dsPaint(opts) {
  _dsScroll = dsHoldScroll();
  /* The text-size stepper and its styling belong to the workbench
     (js/views/negotiation.js). Borrowed rather than restated — the Doc tab
     calls this first for the same reason, so all three strips render the one
     control and step the one stored preference. */
  if (window.redlineLayoutCss) redlineLayoutCss();
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius)';
  const INP = 'width:100%;border:var(--fld-edge);border-bottom:var(--fld-under);background:var(--fld-bg);border-radius:var(--fld-r);height:var(--field-h);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);outline:none';
  const b = _ds.b;
  const design = docDesignById(b.designId) || DOC_DESIGNS[0];
  const structure = docStructureById(b.structureId) || DOC_STRUCTURES[0];
  const publish = _ds.mode === 'publish';
  const step = _ds.step;
  /* CHANGE 1 — the panes fill the view instead of stopping short and leaving a
     band of dead space beneath them. --view-h is the shell's own measured
     scroll height (js/app.js syncViewHeight), which is how the workspace sizes
     itself; a clamp on the viewport left the panes short on a tall monitor. */
  const VIEW = 'height:var(--view-h,calc(100vh - 126px));box-sizing:border-box';
  const PANE = `${CARD};display:flex;flex-direction:column;min-height:0;overflow:hidden`;

  /* One card shape for both catalogues — a structure and a style are the same
     KIND of choice and should not look like two different controls. */
  const pickCard = (o, sel, attr, extra) => `
    <button ${attr}="${o.id}"${o.blockedWhy ? ' disabled' : ''}
      ${o.blockedWhy ? `title="${esc(o.blockedWhy)}"` : ''}
      style="display:block;width:100%;text-align:left;font:inherit;
      cursor:${o.blockedWhy ? 'not-allowed' : 'pointer'};opacity:${o.blockedWhy ? '.45' : '1'};
      background:${sel ? 'var(--color-accent-100)' : 'var(--color-surface)'};
      border:${sel ? '2px solid var(--color-accent-700)' : '1px solid var(--color-divider)'};
      border-radius:var(--radius);padding:${sel ? '11px 13px' : '12px 14px'};margin-bottom:var(--s-2)">
      <span style="display:flex;align-items:center;gap:9px">
        ${extra || ''}
        <span style="flex:1;min-width:0">
          <b style="font-size:var(--t-body)">${esc(o.name)}</b>
          ${o.blockedWhy ? '<span style="font-size:var(--t-label);color:var(--color-neutral-500)"> · unavailable</span>' : ''}
        </span>
        ${sel ? `<span class="badge" style="background:var(--color-accent-700);color:#fff;font-size:var(--t-figure)">${i18t('ds_selected')}</span>` : ''}
      </span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.45;margin-top:3px">${esc(o.blurb)}</span>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-500);margin-top:3px">${i18t('ds_best_for',{what:esc(o.bestFor)})}</span>
    </button>`;

  /* A miniature of the page each structure builds. Drawn in CSS rather than
     shipped as images: a layout thumbnail that cannot go stale is worth more
     than one that looks nicer. */
  const RULE = 'var(--color-neutral-300)';
  const bar = (w, mt) => `<span style="display:block;height:2px;border-radius:var(--radius);background:${RULE};width:${w};${mt ? 'margin-top:' + mt : ''}"></span>`;
  const wire = id => {
    const box = inner => `<span style="flex:none;width:30px;height:40px;border:1px solid var(--color-divider);
      border-radius:var(--radius);background:var(--color-doc-surface);padding:3px;display:flex;flex-direction:column;
      gap:2px;overflow:hidden">${inner}</span>`;
    if (id === 'margin-numbers') return box(
      [0, 1, 2].map(() => `<span style="display:flex;gap:2px"><span style="flex:none;width:4px;height:4px;border-radius:var(--radius);background:var(--color-accent-700)"></span><span style="flex:1">${bar('100%')}${bar('70%', '2px')}</span></span>`).join(''));
    if (id === 'two-column') return box(
      `<span style="display:flex;gap:3px;flex:1"><span style="flex:1">${bar('100%')}${bar('100%', '2px')}${bar('60%', '2px')}${bar('100%', '2px')}</span><span style="flex:1">${bar('100%')}${bar('70%', '2px')}${bar('100%', '2px')}${bar('90%', '2px')}</span></span>`);
    if (id === 'ruled-clauses') return box(
      [0, 1, 2].map(() => `<span style="display:block;border-top:1px solid ${RULE};padding-top:2px;margin-top:2px">${bar('55%')}${bar('100%', '2px')}</span>`).join(''));
    return box([0, 1, 2, 3, 4].map((_, i) => bar(i % 3 === 2 ? '65%' : '100%', i ? '2px' : 0)).join(''));
  };

  /* ---- THE CONTENTS PAGE IS A YES/NO, ABOVE THE LAYOUTS ----
     It was the fifth structure card until 10 Aug 2026, which made it exclusive
     with the other four: a contents page cost you Margin Numbers, and a
     two-column booklet could not have one at all. It prepends a page and
     leaves the body alone, so it was never the same kind of choice — see the
     note at DOC_STRUCTURES.

     DRAWN FIRST, AND AS A PAIR. Not a checkbox: "off" is a real answer here
     and the default one, and a default worth stating is worth drawing. The
     pair sits above the layout list because it is answered about the document
     as a whole, and separated by a rule so it cannot read as a sixth layout.

     "AT THE FRONT" NAMES THE PLACE, not the feature, because the place is the
     only thing the reader is deciding — there is nowhere else a contents page
     could go, and saying "Included" would invite the question.

     NO THUMBNAIL ON THESE TWO, though the layout cards below all carry one.
     The rail is 268px wide: a 30px wire plus its gap left the labels about
     90px, which wrapped "At the front" onto two lines and made the pair look
     broken. The layouts need a thumbnail because their names do not describe
     a shape; these two are a yes and a no, and the preview beside them is the
     picture. */
  const contentsOn = !!b.contents;
  const contentsBtn = (on, label, sub) => {
    const sel = contentsOn === on;
    return `<button data-ds-contents="${on ? '1' : '0'}" aria-pressed="${sel ? 'true' : 'false'}"
      style="flex:1;min-width:0;text-align:left;font:inherit;cursor:pointer;
      background:${sel ? 'var(--color-accent-100)' : 'var(--color-surface)'};
      border:${sel ? '2px solid var(--color-accent-700)' : '1px solid var(--color-divider)'};
      border-radius:var(--radius);padding:${sel ? '8px 9px' : '9px 10px'}">
      <b style="display:block;font-size:var(--t-meta)">${esc(label)}</b>
      <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.4;margin-top:3px">${esc(sub)}</span>
    </button>`;
  };
  const contentsChoice = `
    <div style="margin:0 0 13px;padding:0 0 13px;border-bottom:1px solid var(--color-divider)">
      <div style="font-family:var(--font-heading);font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;
        color:var(--color-neutral-500);margin-bottom:7px">Contents page</div>
      <div style="display:flex;gap:7px;align-items:stretch">
        ${contentsBtn(false, 'Not included', 'Opens on the first clause.')}
        ${contentsBtn(true, 'At the front', 'Built from the clause headings.')}
      </div>
      <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.45;margin:7px 0 0">
        It rebuilds itself when a clause is added, and stays off a document with fewer than three headings.
        The clause wording and numbering are untouched either way.</p>
    </div>`;

  const structureCards = DOC_STRUCTURES.map(x => {
    const why = structureBlockedReason(b.designId, x.id);
    return pickCard({ ...x, blockedWhy: why }, x.id === b.structureId, 'data-ds-structure', wire(x.id));
  }).join('');

  const blockedNow = DOC_STRUCTURES.filter(x => structureBlockedReason(b.designId, x.id));
  const blockNote = blockedNow.length ? `
    <div style="display:flex;gap:7px;align-items:flex-start;background:var(--st-amber-bg,#fef3c7);
      border:1px solid var(--st-amber-line,#fcd34d);color:var(--st-amber-fg,#b45309);
      border-radius:var(--radius);padding:var(--s-2) 10px;font-size:var(--t-label);line-height:1.5;margin:2px 0 10px">
      ${icon('alert', 'w-3 h-3')}
      <span><b>${esc(design.name)}</b> cannot take ${blockedNow.length === 1 ? 'one layout' : blockedNow.length + ' layouts'}.
        ${esc(structureBlockedReason(b.designId, blockedNow[0].id))}</span>
    </div>` : '';

  /* ---- STYLE IS THE FIRST CHOICE, SO NOTHING HERE IS REFUSED ----
     Every style used to be checked against the structure and drawn unavailable
     if the pair was blocked. That was right while structure came first: the
     refusal stood against a choice the reader had already made. Flipped, there
     is no structure yet — only a default nobody has looked at — and greying out
     a style because of it would refuse the reader's FIRST choice on the
     strength of a decision they have not taken.

     The refusal has not gone anywhere; it moved to step 2, where a structure
     this style cannot take is drawn unavailable with its reason. Same rule,
     pointed the way the steps now run. */
  const designCards = DOC_DESIGNS.map(d =>
    pickCard(d, d.id === b.designId, 'data-ds-pick')).join('');

  const posChips = DESIGN_LOGO_POSITIONS.map(p => {
    const label = { 'top-left': 'Top left', 'top-center': 'Top centre', 'top-right': 'Top right', footer: 'Footer' }[p];
    const sel = b.logoPosition === p;
    return `<button data-ds-pos="${p}" class="ui-btn ui-btn-sm" style="${sel ? 'background:var(--accent-fill);border-color:var(--accent-fill);color:#fff;font-weight:var(--w-title)' : ''}">${label}</button>`;
  }).join('');

  /* The colour control is ALWAYS drawn, on every design. It used to appear only
     on designs that display an accent, which meant a customer sitting on a
     monochrome design could not find the control at all — the colour is a
     company fact, set once, not a property of whichever design is on screen. */
  const ACCENT_PRESETS = DS_ACCENTS.map(([hex, name]) => [hex, name]);
  const accentNow = b.accentColor || '#37474f';
  const swatches = ACCENT_PRESETS.map(([hex, name]) => `
    <button data-ds-swatch="${hex}" title="${name}" aria-label="${name}" style="width:23px;height:23px;border-radius:var(--radius);
      cursor:pointer;padding:0;background:${hex};border:1px solid rgba(0,0,0,.18);
      ${hex.toLowerCase() === accentNow.toLowerCase() ? 'box-shadow:0 0 0 2px var(--color-surface),0 0 0 4px var(--accent-solid)' : ''}"></button>`).join('');
  const rawPick = _ds.accentRaw || null;
  const darkened = !!(rawPick && accentLegible(rawPick) && accentLegible(rawPick).toLowerCase() !== rawPick.toLowerCase());
  const accentRow = `
    <div style="margin-top:14px">
      <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:5px">${i18t('ds_accent_colour')}</span>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button data-ds-accentsrc="logo" class="ui-btn ui-btn-sm" style="${b.accentSource !== 'manual' ? 'background:var(--accent-fill);border-color:var(--accent-fill);color:#fff;font-weight:var(--w-title)' : ''}">${i18t('ds_from_logo')}</button>
        <button data-ds-accentsrc="manual" class="ui-btn ui-btn-sm" style="${b.accentSource === 'manual' ? 'background:var(--accent-fill);border-color:var(--accent-fill);color:#fff;font-weight:var(--w-title)' : ''}">${i18t('ds_pick_my_own')}</button>
        <span style="display:inline-block;width:15px;height:15px;border-radius:var(--radius);background:${accentNow};border:1px solid var(--color-divider)" title="${esc(accentNow)}"></span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">${swatches}</div>
      <div style="display:flex;gap:7px;align-items:center;margin-top:9px">
        <input type="color" id="ds-accent" value="${accentNow}" aria-label="${i18t('ds_choose_colour')}"
          style="width:30px;height:28px;border:1px solid var(--color-divider);border-radius:var(--radius);padding:2px;background:var(--color-surface);cursor:pointer">
        <input id="ds-accent-hex" value="${esc((rawPick || accentNow).toUpperCase())}" maxlength="7" spellcheck="false" aria-label="${i18t('ds_brand_hex')}"
          style="width:92px;font-family:var(--font-code);border:var(--fld-edge);border-bottom:var(--fld-under);background:var(--fld-bg);color:var(--color-text);border-radius:var(--fld-r);outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
      </div>
      ${!design.usesAccent ? `<div style="font-size:var(--t-label);line-height:1.5;margin-top:var(--s-2);padding:6px var(--s-2);border-radius:var(--radius);
        background:var(--st-amber-bg,#fef3c7);border:1px solid var(--st-amber-line,#fcd34d);color:var(--st-amber-fg,#b45309)">
        Saved, but <b>${esc(design.name)}</b> is monochrome — this colour will not appear on the document. It shows in Modern Minimal, Bold Corporate, Modern Editorial and Facing Parties.</div>` : ''}
      ${darkened ? `<div style="font-size:var(--t-label);line-height:1.5;margin-top:var(--s-2);padding:6px var(--s-2);border-radius:var(--radius);
        background:var(--st-amber-bg,#fef3c7);border:1px solid var(--st-amber-line,#fcd34d);color:var(--st-amber-fg,#b45309)">
        ${esc(rawPick.toUpperCase())} is too light to read as a rule or a band on white paper, so it is darkened to <b>${esc(accentNow.toUpperCase())}</b>${i18t('ds_hue_unchanged')}</div>`
      : design.usesAccent ? `<div style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin-top:6px">${
          b.accentSource !== 'manual' && !b.accentColor
            ? (b.logoUrl ? 'No strong colour found in the logo — a dark neutral is used instead.' : 'Upload a logo and HaTi picks its colour automatically.')
            : 'Colours the rule, the band and the clause headings.'}</div>` : ''}
    </div>`;

  /* CHANGE 4 — the rail says which of the two choices you are on. A number, a
     title and a description that all change between steps, so the screen never
     leaves you guessing whether these cards are layouts or looks. */
  const railHead = () => step === 1
    ? { n: 1, get title(){ return i18t('ds_choose_style'); }, get hint(){ return i18t('ds_style_sub'); } }
    : { n: 2, get title(){ return i18t('ds_choose_structure'); }, get hint(){ return i18t('ds_structure_sub'); } };

  /* The step rail. Publish is drawn as the third step because it is where the
     two choices are going, even though it is a button rather than a screen. */
  const stepRail = () => {
    const pill = (n, label, state) => `<span style="display:flex;align-items:center;gap:7px;padding:var(--s-1) 13px var(--s-1) 5px;
      border-radius:var(--radius);font-size:var(--t-meta);font-weight:var(--w-strong);white-space:nowrap;${
        state === 'on' ? 'background:var(--st-steel-bg);color:var(--st-steel-fg)'
        : state === 'done' ? 'color:var(--color-good-fg,#047857)'
        : 'color:var(--color-neutral-500)'}">
      <span style="width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-size:var(--t-label);font-weight:var(--w-title);flex:none;${
        state === 'on' ? 'background:var(--accent-fill);color:#fff'
        : state === 'done' ? 'background:var(--st-green-bg);color:var(--st-green-fg);border:1px solid var(--st-green-line)'
        : 'background:var(--color-neutral-100);color:var(--color-neutral-500)'}">${state === 'done' ? '&check;' : n}</span>${label}</span>`;
    const sep = '<span style="width:14px;height:1px;background:var(--color-divider);flex:none"></span>';
    return `<div style="margin-left:auto;display:flex;align-items:center;background:var(--color-surface);
      border:1px solid var(--color-divider);border-radius:var(--radius);padding:3px;flex:none">
      ${pill(1, 'Style', step === 1 ? 'on' : 'done')}${sep}${pill(2, 'Structure', step === 2 ? 'on' : '')}${sep}${pill(3, publish ? 'Publish' : 'Save', '')}
    </div>`;
  };

  /* The sheet is a page at its own size — DS_PAGE_W wide, with the document's
     own 13.5px type inside it — and the ZOOM wrapper scales the whole thing to
     the pane. Sizing the sheet while leaving the type alone was the defect this
     replaces: the page shrank, the words did not, and a title that belongs on
     one line took four. Scale the page and the proportion is the document's
     own, whatever size it is drawn at. Same device as the contract workspace
     (applyDocZoom), reading the same stored text-size preference, so a size set
     in one place is the size everywhere. */
  const paper = `
    <div id="ds-zoom" style="zoom:var(--ds-zoom,1)">
      <div${docDesignPaperAttr(b)} class="ds-sheet" style="background:var(--color-doc-surface);
        box-shadow:var(--shadow-md);border-radius:var(--radius);padding:30px 36px;width:${DS_PAGE_W}px;
        margin:0 auto;${docDesignPaperStyle(b)}">
        ${docDesignHeaderHtml(b, dsPreviewContract(), { bleedX: 36, bleedY: 30 })}
        <article class="doc-surface" style="background:transparent"><div class="hati-doc">${dsPreviewBody()}</div></article>
        ${docDesignFooterHtml(b, dsPreviewContract())}
      </div>
    </div>`;

  const rh = railHead();
  const stepAction = step === 1
    ? `<button id="ds-next" class="ui-btn ui-btn-primary" style="width:100%">
         Next: choose a structure ${icon('chevR', 'w-3.5 h-3.5')}</button>
       <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0;text-align:center">${publish ? i18t('ds_step_2_then_publish') : i18t('ds_step_2_then_save')}</p>`
    : publish
      ? `<button id="ds-publish" class="ui-btn ui-btn-primary" style="width:100%">Publish v${_ds.versionNumber}</button>
         <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0">Publishing freezes this version forever and makes it what the whole team creates contracts from. Contracts already created from earlier versions are not touched.</p>`
      : `<button id="ds-save" class="ui-btn ui-btn-primary" style="width:100%">${i18t('ds_save_design')}</button>
         <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0">${i18t('ds_applies_future')}</p>`;

  document.getElementById('content').innerHTML = `
  <div class="view-enter ds-page${_ds.focus ? ' ds-focus' : ''}" style="${VIEW};padding:var(--s-3) var(--s-4) 14px;display:flex;flex-direction:column;gap:11px">
    <div style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="ds-back" class="ui-btn">${icon('arrowLeft', 'w-3.5 h-3.5')} ${
        step === 2 ? 'Back to style' : (publish ? 'Back to builder' : 'Back to settings')}</button>
      <h3 style="margin:0;font-family:var(--font-heading);font-size:16px;font-weight:var(--w-title)">Design${publish ? ` — publish ${esc(_ds.templateName)} v${_ds.versionNumber}` : ' — your company standard'}</h3>
      <span style="font-size:var(--t-label);color:var(--color-neutral-600)">${step === 1
        ? 'Same document, choose how it is dressed.'
        : 'The wording and the clause numbers never change — only the layout.'}</span>
      ${stepRail()}
    </div>

    <!-- ds-focus marks the one-column focus mode so the narrow-window rules in
         index.html leave it alone — in focus mode the two rails are not
         rendered at all, so re-imposing rail columns on it would drop the
         preview into a 248px track. -->
    <div class="ds-cols${_ds.focus ? ' ds-focus' : ''}" style="display:grid;grid-template-columns:${
      _ds.focus ? 'minmax(0,1fr)' : '268px minmax(0,1fr) 292px'};gap:14px;flex:1;min-height:0">
      <!-- ONE list, ONE choice. Which choice it is, is said three ways: the
           number, the title and the step rail above. -->
      ${_ds.focus ? '' : `
      <section class="ds-rail-pane" style="${PANE}">
        <div style="flex:none;padding:13px 14px 11px;border-bottom:1px solid var(--color-divider)">
          <div data-ds-step="${rh.n}" style="display:flex;align-items:center;gap:7px;font-family:var(--font-heading);font-size:var(--t-label);
            font-weight:var(--w-title);color:var(--accent-ink-700)">
            <span style="width:17px;height:17px;border-radius:50%;background:var(--accent-fill);color:#fff;
              display:grid;place-items:center;font-size:var(--t-label);font-weight:var(--w-title)">${rh.n}</span> ${i18t('ds_step_n_of_2',{n:rh.n})}</div>
          <h4 data-ds-step-title style="font-family:var(--font-heading);font-size:var(--t-card);margin:6px 0 3px;letter-spacing:-.015em">${rh.title}</h4>
          <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.45;margin:0">${rh.hint}</p>
        </div>
        <div id="ds-rail" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:11px 13px 14px">
          ${step === 1 ? designCards : contentsChoice + structureCards + blockNote}
        </div>
      </section>`}

      <!-- The document on its own canvas, whole and centred. -->
      <section style="${PANE}">
        <div style="flex:none;display:flex;align-items:center;gap:var(--s-2);padding:var(--s-2) var(--s-3);border-bottom:1px solid var(--color-divider)">
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-text)">${esc(design.name)}</span>
          <span style="color:var(--color-neutral-400);font-size:var(--t-label)">×</span>
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-text);${step === 1 ? 'opacity:.5' : ''}">${esc(structure.name)}</span>
          ${''/* The contents page only speaks when it is ON. Off is the default
                 and the absence of a page — a chip reading "no contents page"
                 would be the strip announcing that nothing has happened. */}
          ${b.contents ? `<span class="badge" style="background:var(--color-neutral-100);color:var(--color-text);${step === 1 ? 'opacity:.5' : ''}">+ Contents</span>` : ''}
          <span style="flex:1"></span>
          <!-- The zoom is the paper's own (top right of the canvas below), one
               remembered value shared with every other paper. -->
          <button id="ds-focus" class="ui-btn ui-btn-icon" title="${_ds.focus ? 'Leave full screen' : 'Fill the screen with the document'}"
            aria-pressed="${_ds.focus ? 'true' : 'false'}"
            style="${_ds.focus ? 'background:var(--accent-fill);border-color:var(--accent-fill);color:#fff' : ''}">
            ${icon('expand', 'w-3.5 h-3.5')}</button>
        </div>
        <div id="ds-docpane" class="scroll-thin" style="flex:1;min-height:0;padding:var(--s-4);
          background:var(--color-neutral-100);overflow:auto">${''/* the zoom on the paper's own ground,
          top right (owner, 11 Oct 2026) */}${window.rlPaperZoomHtml ? rlPaperZoomHtml() : ''}${paper}</div>
        <div style="flex:none;padding:7px 14px;border-top:1px solid var(--color-divider);text-align:center;font-size:var(--t-label);color:var(--color-neutral-500)">
          ${publish ? 'Your live draft, not a sample' : 'A sample document, so the looks can be compared'}
        </div>
      </section>

      ${_ds.focus ? '' : `
      <section class="ds-rail-pane" style="${PANE}">
       <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:14px var(--s-4)">
        <h4 style="font-family:var(--font-heading);font-weight:var(--w-title);font-size:var(--t-meta);margin:0 0 10px;color:var(--color-neutral-600)">${i18t(publish ? 'ds_paper_look' : 'ds_company_branding')}</h4>
        ${publish ? '' : `
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:86px;height:48px;border:1px dashed var(--color-divider);border-radius:var(--radius);display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
            ${b.logoUrl ? `<img src="${b.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">` : `<span style="font-size:var(--t-label);color:var(--color-neutral-500)">${i18t('tb_no_logo')}</span>`}
          </div>
          <div>
            <input type="file" id="ds-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
            <button id="ds-logo-btn" class="ui-btn ui-btn-sm">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
            <span style="display:block;font-size:var(--t-label);color:var(--color-neutral-500);margin-top:3px">${i18t('ds_png_jpg')}</span>
          </div>
        </div>
        `}
        <div style="margin-top:14px">
          <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:5px">${i18t('ds_logo_position')}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${posChips}</div>
        </div>
        ${accentRow}
        ${''/* ---- THE LEGAL IDENTITY LEFT THIS STEP (14 Aug 2026) ----
               The registered name, number and address were four unlabelled
               boxes here, under the logo upload and the accent picker. A legal
               name is not a design decision — it is the same kind of fact as
               the market and the currency, something true about the company
               that happens to get printed on paper — so they live on Settings →
               Platform settings → Company & market now.

               THIS IS A MOVE, NOT A COPY. Two places to type one fact is the
               fault this codebase is built to avoid, so the boxes are gone
               rather than mirrored, and dsOrgPayload no longer sends the three
               (the route preserves what a save does not carry). The step still
               READS them — the preview overleaf prints the registered name on
               the paper exactly as it did.

               THE FOOTER TEXT STAYS. Unlike the other three it genuinely is a
               design choice about what prints at the bottom of a page. */}
        ${publish ? '' : `
        <div style="margin-top:14px;display:grid;gap:7px">
          <input id="ds-b-footer" style="${INP}" placeholder="${i18t('ds_footer_placeholder')}" value="${esc(b.footerText)}">
          <p style="font-size:var(--t-label);color:var(--color-neutral-500);line-height:1.5;margin:0">${
            esc(i18t('ds_identity_moved',{name:b.companyName||i18t('st_not_set')}))}</p>
        </div>
        `}
        ${publish && step === 2 ? `
        <label style="display:block;margin-top:14px"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('ds_what_changed_why')}</span>
          <textarea id="ds-note" style="${INP};height:auto;padding:var(--field-pad-y) var(--field-pad-x);min-height:48px" maxlength="500" placeholder="e.g. Payment terms now offer 30/45/60 days">${esc(_ds.changeNote)}</textarea></label>
        ` : ''}
       </div>
       <!-- The step's action, pinned where it can always be reached. -->
       <div style="flex:none;padding:11px 15px;border-top:1px solid var(--color-divider)">${stepAction}</div>
      </section>`}
    </div>
  </div>`;

  /* The rail keeps its place unless the step changed — a new step is a new
     list, and starting it half-way down would be its own kind of lost. */
  if (!(opts && opts.resetScroll)) dsRestoreScroll(_dsScroll);
  dsApplyZoom();
  if (window.rlWireTypeStep) rlWireTypeStep(document.getElementById('content'));
  document.getElementById('ds-focus')?.addEventListener('click', () => {
    dsHarvest(); _ds.focus = !_ds.focus; dsPaint();
  });

  document.getElementById('ds-back')?.addEventListener('click', () => {
    if (_ds.step === 2) { dsHarvest(); _ds.step = 1; dsPaint({ resetScroll: true }); return; }
    const go = _ds.onBack; _ds = null; if (go) go();
  });
  document.getElementById('ds-next')?.addEventListener('click', () => { dsHarvest(); _ds.step = 2; dsPaint({ resetScroll: true }); });
  document.querySelectorAll('[data-ds-structure]').forEach(el => el.addEventListener('click', () => {
    dsHarvest();
    _ds.structureTouched = true;
    _ds.b.structureId = el.getAttribute('data-ds-structure');
    dsPaint();
  }));
  /* Written as a real boolean, never left undefined: the reader has now
     answered, and "not said" is a different fact from "said no" everywhere
     downstream (see normalizeDesignBranding). */
  document.querySelectorAll('[data-ds-contents]').forEach(el => el.addEventListener('click', () => {
    dsHarvest();
    _ds.b.contents = el.getAttribute('data-ds-contents') === '1';
    dsPaint();
  }));
  document.querySelectorAll('[data-ds-swatch]').forEach(el => el.addEventListener('click', () => {
    dsHarvest();
    _ds.accentRaw = el.getAttribute('data-ds-swatch');
    _ds.b.accentSource = 'manual';
    _ds.b.accentColor = accentLegible(_ds.accentRaw);
    dsPaint();
  }));
  document.getElementById('ds-accent-hex')?.addEventListener('change', e => {
    const v = String(e.target.value || '').trim();
    if (!/^#?[0-9a-f]{6}$/i.test(v)) { dsPaint(); return; }   // rejected: the field snaps back
    dsHarvest();
    _ds.accentRaw = v.startsWith('#') ? v : '#' + v;
    _ds.b.accentSource = 'manual';
    _ds.b.accentColor = accentLegible(_ds.accentRaw);
    dsPaint();
  });
  document.querySelectorAll('[data-ds-pick]').forEach(el => el.addEventListener('click', () => {
    dsHarvest();
    _ds.b.designId = el.getAttribute('data-ds-pick');
    if (!_ds.posTouched) _ds.b.logoPosition = docDesignById(_ds.b.designId).defaultLogoPos;
    /* Never leave a blocked pair selected. Switching style is the customer's
       action; silently publishing a combination the product refuses is not.
       This is the backstop for the settings route too, where a saved default
       can carry a pair from before either catalogue moved.

       IT ONLY SPEAKS UP ABOUT A STRUCTURE SOMEBODY CHOSE. Style comes first
       now, so on step 1 the structure is a default the reader has not seen —
       announcing that it "is not available" names a decision they never took
       and sends them looking for a mistake they did not make. The pair is
       still corrected; the sentence waits until there is something to correct
       THEM about. */
    if (structureBlockedReason(_ds.b.designId, _ds.b.structureId)) {
      const was = docStructureById(_ds.b.structureId);
      const chosen = _ds.step === 2 || _ds.structureTouched;
      _ds.b.structureId = DEFAULT_STRUCTURE;
      if (chosen) toast(`${was.name} is not available with ${docDesignById(_ds.b.designId).name} — the layout is back to Standard Flow`, 'err');
    }
    dsPaint();
  }));
  document.querySelectorAll('[data-ds-pos]').forEach(el => el.addEventListener('click', () => {
    dsHarvest(); _ds.posTouched = true; _ds.b.logoPosition = el.getAttribute('data-ds-pos'); dsPaint();
  }));
  document.querySelectorAll('[data-ds-accentsrc]').forEach(el => el.addEventListener('click', async () => {
    dsHarvest();
    const src = el.getAttribute('data-ds-accentsrc');
    _ds.b.accentSource = src;
    if (src === 'logo') { _ds.accentRaw = null; _ds.b.accentColor = _ds.b.logoUrl ? await extractAccentFromLogo(_ds.b.logoUrl) : null; }
    dsPaint();
  }));
  document.getElementById('ds-accent')?.addEventListener('change', e => {
    dsHarvest();
    _ds.accentRaw = e.target.value;
    _ds.b.accentSource = 'manual';
    _ds.b.accentColor = accentLegible(e.target.value);
    dsPaint();
  });
  document.getElementById('ds-logo-btn')?.addEventListener('click', () => document.getElementById('ds-logo-file').click());
  document.getElementById('ds-logo-file')?.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { toast(i18t('tb_logo_500kb'), 'err'); return; }
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
  document.getElementById('ds-publish')?.addEventListener('click', dsPublish);
  document.getElementById('ds-save')?.addEventListener('click', dsSaveDefault);
}

/* Text inputs write straight into the working copy — no repaint needed (a
   repaint per keystroke would drop focus); the identity fields only show in
   the header, and the paint on the next design/position click refreshes it. */
function dsHarvestIdentity() {
  const g = id => (document.getElementById(id) || { value: null }).value;
  /* The name, number and address are not collected here any more — they moved
     to Company & market (14 Aug 2026). The guard shape is kept: it reads a box
     only where one exists, so nothing is assumed about which step is drawn. */
  if (g('ds-b-footer') != null) _ds.b.footerText = g('ds-b-footer').trim();
}
function dsHarvest() {
  dsHarvestIdentity();
  /* The note field only exists on step 2. Guarding on its presence rather than
     assigning unconditionally is what keeps a note typed on step 2 alive
     across a trip back to step 1 and forward again. */
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
  /* companyName / registrationNumber / address are DELIBERATELY ABSENT. This
     step no longer edits them, and a key this route does not receive is a key
     it does not touch — so sending the values back would be this screen
     asserting a fact it does not own, and would refuse an Editor's ordinary
     design save the moment an admin changed the name in another tab. */
  return {
    logoUrl: b.logoUrl, defaultFooterText: b.footerText,
    designId: asDefault ? b.designId : (org.designId || null),
    structureId: asDefault ? b.structureId : (org.structureId || null),
    logoPosition: asDefault ? b.logoPosition : (org.logoPosition || null),
    accentColor: asDefault ? b.accentColor : (org.accentColor || null),
    accentSource: asDefault ? b.accentSource : (org.accentSource || null),
  };
}

async function dsPublish() {
  dsHarvest();
  const btn = document.getElementById('ds-publish');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="animate-pulse">${i18t('ds_publishing')}</span>`; }
  try {
    /* publishing one paper never writes the company's look (an admin's, in Settings) */
    if (_ds.mode !== 'publish' && await lookSaveOrSend(dsOrgPayload()) === 'sent') toast(i18t('cl_ap_done_send'), 'ok');
    const design = _ds.saveDefault ? null
      : { designId: _ds.b.designId, structureId: _ds.b.structureId,
          logoPosition: _ds.b.logoPosition, accentColor: _ds.b.accentColor };
    const r = await api(`templates/${_ds.tid}/versions/${_ds.vid}/publish`, 'POST',
      { changeNote: _ds.changeNote.trim(), design });
    /* THE VERSION PUBLISHED, so a warning about it is a caution, never a
       failure — they arrived in red over a success (the owner's list, 27 Sep
       2026). And the success itself says so: a bare toast prints nothing. */
    (r.warnings || []).forEach(w => toast(w, 'warn'));
    const st = docStructureById(_ds.b.structureId);
    toast(`v${r.versionNumber} published in ${docDesignById(_ds.b.designId).name}${
      st && st.id !== DEFAULT_STRUCTURE ? ' · ' + st.name : ''} — the team can create contracts from it now`, 'ok');
    const tid = _ds.tid, tname = _ds.templateName, vn = r.versionNumber; _ds = null;
    /* PUBLISHED IS ON THE SHELF AT ONCE (26 Sep 2026, the overnight clean-up):
       the template cache the New agreement screen and "New contract" read was
       still the pre-publish copy, so the new standard was missing from the one
       and the other read its version as unpublished ("the wording could not be
       read"). Refreshed before landing, so the detail page reads it too. */
    if (typeof tplLibRefresh === 'function') { try { await tplLibRefresh(); } catch (_) { /* the page still opens */ } }
    /* published: Draft a contract from it, or Our paper (the builder's one landing) */
    if (typeof tbPublishedLand === 'function') tbPublishedLand(tid, tname, vn); else openTemplateLibDetail(tid);
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = `Publish v${_ds.versionNumber}`; }
    ((e.data && e.data.problems) || [e.message]).forEach(p => toast(p, 'err'));
  }
}

async function dsSaveDefault() {
  dsHarvest();
  _ds.saveDefault = true;   // settings mode edits the default by definition
  const btn = document.getElementById('ds-save');
  if (btn) { btn.disabled = true; btn.innerHTML = `<span class="animate-pulse">${i18t('ds_saving')}</span>`; }
  try {
    const how = await lookSaveOrSend(dsOrgPayload());
    const st2 = docStructureById(_ds.b.structureId);
    if (how === 'sent') toast(i18t('cl_ap_done_send'), 'ok');
    else toast(`${docDesignById(_ds.b.designId).name}${st2 && st2.id !== DEFAULT_STRUCTURE ? ' · ' + st2.name : ''} is now your company design`);
    const go = _ds.onBack; _ds = null; if (go) go();
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Save company design'; }
    toast(e.message, 'err');
  }
}

/* Exported so the workbench's text-size stepper can re-fit this screen when it
   steps (js/views/negotiation.js rlSetDocType), and so the shell's resize
   handler reaches it. */
if (typeof addEventListener === 'function') addEventListener('resize', () => { if (_ds) dsApplyZoom(); });

/* ═══════════ HOW OUR CONTRACTS LOOK — ONE SETTINGS PAGE, THE LEGORA WAY (owner's pick, 14 Nov 2026) ═══════════
   The company look is set once, here, by an admin (PUT /api/org/branding refuses anyone else). The sample page is the
   page: each part is named beside where it sits on the paper with its Change; a chip opens the eight styles, the four
   layouts, or who wears the look (every contract, or only some streams). Under the paper, Other looks: each stream
   with its own look and each paper published with "Design it now", with Use the company look. Which look wins: a
   paper's own, then its stream's, then the company's (server srvLookOf). The other side's paper never wears our look;
   a contract's look follows its stream until it is signed (srvLookFollowStream). Nothing is written until Save.
   One box takes a plain sentence ("use our blue and put the logo on the left"), read here without AI (clReadLook). */
const CL_ACCENTS = DS_ACCENTS.map(([hex, , word]) => [hex, word]);
let _cl = null;
const clAdmin = () => { try { const u = (typeof currentUser === 'function') ? currentUser() : null; return !!(u && u.role === 'admin'); } catch (_) { return false; } };
const clE = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
function clLookOf(src) {
  const o = src || {};
  return { designId: o.designId || DOC_DESIGNS[0].id, structureId: o.structureId || DEFAULT_STRUCTURE,
    logoPosition: o.logoPosition || null, accentColor: o.accentColor || null,
    /* round 2: the header line and the page numbers ride with the look (null = the company's, else none set) */
    pageMarks: o.pageMarks ? Object.assign({}, o.pageMarks) : null };
}
function clInit() {
  const org = window.ORG_BRANDING || {};
  _cl = { look: clLookOf(org), logoUrl: org.logoUrl || null, footer: org.footerText || org.defaultFooterText || '',
    streams: JSON.parse(JSON.stringify(window.ORG_STREAM_LOOKS || {})), applies: 'all', pick: new Set(), editing: null,
    mode: 'page', said: '', dirty: false, busy: false,
    /* round 1: the tab, each tab's chip, the part chosen (its pin lit), the stream chosen, the preview's contract and page */
    tab: (_cl && _cl.tab) || 'page', chip: 'all', whoChip: 'all', row: null, whoPick: (_cl && _cl.whoPick) || null, pv: (_cl && _cl.pv) || null, pvPage: 1,
    /* round 4: the brand kit's black logo and named colours (the company's; the first colour IS the accent) */
    logoBlackUrl: org.logoBlackUrl || null,
    palette: clPaletteFrom(org),
    /* round 6: History's chips and the change chosen */
    histChip: 'all', histWho: null, histPart: null, histPick: (_cl && _cl.histPick) || null };
}
/* the named colours as the page edits them: the stored list, else one entry for the accent the look already has */
function clPaletteFrom(org) {
  const p = Array.isArray(org.palette) && org.palette.length ? org.palette.map(x => Object.assign({}, x)) : [];
  const acc = org.accentColor || null;
  if (!p.length && acc) p.push({ name: '', hex: String(acc).toLowerCase(), use: '' });
  if (p.length && acc) p[0].hex = String(acc).toLowerCase();
  return p;
}
function clDesign() { return docDesignById(_cl.look.designId) || DOC_DESIGNS[0]; }
function clStructure() { return docStructureById(_cl.look.structureId) || DOC_STRUCTURES[0]; }
function clStreamName(fid) { const f = (typeof FOLDERS === 'object' && FOLDERS) ? FOLDERS[fid] : null; return (f && f.name) || fid; }
function clStreamIds() { return Object.values((typeof FOLDERS === 'object' && FOLDERS) || {}).filter(f => f && f.id).map(f => String(f.id)); }
/* the look the sample page wears: the working look with the company's own facts (logo, name, footer) */
function clBranding() {
  const org = window.ORG_BRANDING || {};
  return normalizeDesignBranding(Object.assign({}, org, { designId: _cl.look.designId, structureId: _cl.look.structureId,
    logoPosition: _cl.look.logoPosition, accentColor: _cl.look.accentColor, accentSource: 'manual',
    logoUrl: _cl.logoUrl, footerText: _cl.footer, pageMarks: _cl.look.pageMarks }));
}
function clSheetHtml() {
  const b = clBranding(); if (!b) return '';
  const c = { name: i18t('cl_sample_name'), counterparty: i18t('cl_sample_cp'), branding: b };
  const body = `<h1>${clE(i18t('cl_sample_name'))}</h1><p>${clE(i18t('cl_sample_lead'))}</p>
    <h2>1. ${clE(i18t('cl_sample_h1'))}</h2><p>${clE(i18t('cl_sample_p1'))}</p>
    <h2>2. ${clE(i18t('cl_sample_h2'))}</h2><p>${clE(i18t('cl_sample_p2'))}</p>
    <h2>3. ${clE(i18t('cl_sample_h3'))}</h2><p>${clE(i18t('cl_sample_p3'))}</p>`;
  return `<div class="cl-sheet-w"><div${docDesignPaperAttr(b)} class="cl-sheet" style="${docDesignPaperStyle(b)}">
    ${docDesignHeaderHtml(b, c, { bleedX: 36, bleedY: 30 })}
    <article class="doc-surface" style="background:transparent"><div class="hati-doc">${docStructureBodyHtml(b, body)}</div></article>
    ${docDesignFooterHtml(b, c)}</div></div>`;
}
const CL_POS_WORD = { 'top-left': 'cl_pos_left', 'top-center': 'cl_pos_centre', 'top-right': 'cl_pos_right', footer: 'cl_pos_footer' };
function clNote(k, t, say, act, side) {
  return `<div class="cl-note is-${side}" data-cl-note="${k}"><b>${clE(t)}</b><span>${say}</span>${act || ''}</div>`;
}
function clNotesHtml(side) {
  const admin = clAdmin(), d = clDesign(), st = clStructure(), org = window.ORG_BRANDING || {};
  const chg = (m, w) => admin ? `<button type="button" class="cl-lnk" data-cl-mode="${m}">${clE(i18t(w || 'cl_change'))}</button>` : '';
  const pos = _cl.look.logoPosition || d.defaultLogoPos || 'top-left';
  const ac = (CL_ACCENTS.find(([h]) => h === _cl.look.accentColor) || [])[1];
  if (side === 'l') return clNote('logo', i18t('cl_n_logo'), clE(_cl.logoUrl ? i18t(CL_POS_WORD[pos] || 'cl_pos_left') : i18t('cl_no_logo')), chg('g'), 'l')
    + clNote('colour', i18t('cl_n_colour'), `<i class="cl-dot" style="background:${clE(_cl.look.accentColor || CL_ACCENTS[7][0])}"></i>${clE(ac ? i18t('cl_c_' + ac) : (_cl.look.accentColor || i18t('cl_c_slate')))}${d.usesAccent === false ? ' · ' + clE(i18t('cl_mono')) : ''}`, chg('c'), 'l')
    + clNote('type', i18t('cl_n_type'), clE(i18t('cl_type_say')), '', 'l')
    + clNote('footer', i18t('cl_n_footer'), clE(_cl.footer || i18t('cl_no_footer')), chg('f', 'cl_edit'), 'l');
  return clNote('letterhead', i18t('cl_n_letterhead'), clE(org.companyName ? org.companyName : i18t('cl_no_company')),
      admin ? `<button type="button" class="cl-lnk" data-cl-company>${clE(i18t('cl_change_there'))}</button>` : '', 'r')
    + clNote('style', i18t('cl_n_style'), clE(d.name + ': ' + d.blurb), chg('s', 'cl_see_all'), 'r')
    + clNote('layout', i18t('cl_n_layout'), clE(st.name + ': ' + st.blurb), chg('l'), 'r');
}
function clPickHtml() {
  const m = _cl.mode, admin = clAdmin();
  const head = t => `<div class="cl-pk-h"><span>${clE(t)}</span><button type="button" class="cl-lnk" data-cl-mode="page">${clE(i18t('cl_done'))}</button></div>`;
  const opt = (on, attr, t, d, mini) => `<button type="button" class="cl-opt${on ? ' is-on' : ''}" ${attr}${admin ? '' : ' disabled'}>${mini || ''}<span><b>${clE(t)}${on ? ' ✓' : ''}</b><span>${clE(d)}</span></span></button>`;
  if (m === 's') return head(i18t('cl_pick_style', { n: DOC_DESIGNS.length })) + DOC_DESIGNS.map(d => opt(d.id === _cl.look.designId, `data-cl-design="${d.id}"`, d.name, d.blurb)).join('');
  if (m === 'l') return head(i18t('cl_pick_layout', { n: DOC_STRUCTURES.length })) + DOC_STRUCTURES.map(x => {
    const why = (typeof structureBlockedReason === 'function') ? structureBlockedReason(_cl.look.designId, x.id) : null;
    return opt(x.id === _cl.look.structureId, `data-cl-structure="${x.id}"${why ? ' disabled' : ''}`, x.name, why || x.blurb); }).join('')
    + `<p class="cl-pk-q">${clE(i18t('cl_layout_note'))}</p>`;
  if (m === 'g') return head(i18t('cl_n_logo')) + `<div class="cl-pk-row">${DESIGN_LOGO_POSITIONS.map(p => `<button type="button" class="cl-pill${(_cl.look.logoPosition || clDesign().defaultLogoPos) === p ? ' is-on' : ''}" data-cl-pos="${p}">${clE(i18t(CL_POS_WORD[p]))}</button>`).join('')}</div>
    <div class="cl-pk-row"><input type="file" id="cl-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden><button type="button" class="cl-pill" data-cl-logo>${clE(i18t(_cl.logoUrl ? 'cl_logo_replace' : 'cl_logo_upload'))}</button>${_cl.logoUrl ? `<button type="button" class="cl-lnk" data-cl-logo-x>${clE(i18t('cl_logo_remove'))}</button>` : ''}</div><p class="cl-pk-q">${clE(i18t('ds_png_jpg'))}</p>`;
  if (m === 'c') return head(i18t('cl_n_colour')) + `<div class="cl-pk-row">${CL_ACCENTS.map(([h, w]) => `<button type="button" class="cl-sw${_cl.look.accentColor === h ? ' is-on' : ''}" data-cl-accent="${h}" style="background:${h}" title="${clE(i18t('cl_c_' + w))}" aria-label="${clE(i18t('cl_c_' + w))}"></button>`).join('')}</div>${clDesign().usesAccent === false ? `<p class="cl-pk-q">${clE(i18t('cl_mono_note', { name: clDesign().name }))}</p>` : ''}`;
  /* round 2: words plus fields pressed as chips; the line as the previewed contract will read it */
  const fieldChips = (attr, fields, on) => `<div class="cl-pk-row cl-ls-fields"><span class="cl-pk-k">${clE(i18t('cl_ls_fields'))}</span>${fields.map(f => `<button type="button" class="cl-pill${on.includes(f) ? ' is-on' : ''}" ${attr}="${f}" aria-pressed="${on.includes(f) ? 'true' : 'false'}">${clE(i18t('cl_ls_f_' + f))}</button>`).join('')}</div>`;
  const onPaper = text => `<p class="cl-pk-q cl-ls-onpaper">${clE(i18t('cl_ls_on_paper'))} <span class="cl-ls-quote">“${clE(clFilledOn(text) || '—')}”</span></p>`;
  const pills = (attr, opts, cur) => `<div class="cl-pk-row">${opts.map(([v, w]) => `<button type="button" class="cl-pill${(cur || '') === v ? ' is-on' : ''}" ${attr}="${v}">${clE(w)}</button>`).join('')}</div>`;
  if (m === 'f') { const fs = clFieldsSplit(_cl.footer);
    return head(i18t('cl_n_footer')) + `<input type="text" id="cl-footer" class="cl-in" maxlength="500" value="${clE(fs.words)}" placeholder="${clE(i18t('ds_footer_placeholder'))}">`
      + fieldChips('data-cl-ffield', ['ref', 'title'], fs.fields) + onPaper(_cl.footer); }
  if (m === 'h') { const mk = clMarks(), hs = clFieldsSplit(mk.headerText);
    return head(i18t('cl_n_header')) + `<p class="cl-pk-q">${clE(i18t('cl_ls_head_place'))}</p>`
      + pills('data-cl-hpos', [['', i18t('cl_ls_none')], ['left', i18t('cl_ls_pos_left')], ['center', i18t('cl_ls_pos_center')], ['right', i18t('cl_ls_pos_right')]], mk.headerPos || '')
      + `<input type="text" id="cl-head-words" class="cl-in" maxlength="${typeof PAGE_HEAD_MAX === 'number' ? PAGE_HEAD_MAX : 120}" value="${clE(hs.words)}" placeholder="${clE(i18t('cl_ls_head_ph'))}">`
      + fieldChips('data-cl-hfield', ['company', 'ref', 'title'], hs.fields) + (mk.headerPos && mk.headerText ? onPaper(mk.headerText) : ''); }
  if (m === 'sg') { const mk = clMarks(), on = mk.sigLines || [];
    return head(i18t('cl_n_sigblock')) + `<p class="cl-pk-q">${clE(i18t('cl_ls_sg_lay'))}</p>`
      + pills('data-cl-sglay', [['columns', i18t('cl_ls_sg_columns')], ['stacked', i18t('cl_ls_sg_stacked')]], mk.sigLayout || 'columns')
      + `<div class="cl-pk-row cl-ls-fields"><span class="cl-pk-k">${clE(i18t('cl_ls_sg_lines'))}</span>${(typeof SIG_LINES === 'object' ? SIG_LINES : ['name', 'title', 'date', 'place']).map(k => `<button type="button" class="cl-pill${on.includes(k) ? ' is-on' : ''}" data-cl-sgline="${k}" aria-pressed="${on.includes(k) ? 'true' : 'false'}">${clE(i18t('sig_ln_' + k))}</button>`).join('')}</div>`
      + `<p class="cl-pk-q">${clE(i18t('cl_ls_sg_note'))}</p>`; }
  if (m === 'lg') { const mk = clMarks(), langs = (typeof BR_FURN_LANGS === 'object' ? BR_FURN_LANGS : ['en', 'sv']);
    return head(i18t('cl_n_lang')) + pills('data-cl-lang', [['', clLangName(null)]].concat(langs.map(l => [l, clLangName(l)])), mk.furnLang || '')
      + `<p class="cl-pk-q">${clE(i18t('cl_lg_note', { say: typeof brPageNumberSay === 'function' ? brPageNumberSay(mk.pageNumFmt, 2, 5, mk.furnLang || null) : '' }))}</p>`; }
  if (m === 'cv') { const mk = clMarks();
    return head(i18t('cl_n_cover')) + pills('data-cl-cvon', [['off', i18t('cl_ls_off')], ['on', i18t('cl_ls_on')]], mk.coverOn ? 'on' : 'off')
      + (mk.coverOn ? `<p class="cl-pk-q">${clE(i18t('cl_ls_cv_count_q'))}</p>` + pills('data-cl-cvcount', [['no', i18t('cl_ls_cv_no')], ['yes', i18t('cl_ls_cv_yes')]], mk.coverCounts ? 'yes' : 'no') : '')
      + `<p class="cl-pk-q">${clE(i18t('cl_ls_cv_note'))}</p>`; }
  if (m === 'n') { const mk = clMarks();
    return head(i18t('cl_n_pagenum')) + `<p class="cl-pk-q">${clE(i18t('cl_ls_pn_place'))}</p>`
      + pills('data-cl-npos', [['off', i18t('cl_ls_off')], ['', i18t('cl_ls_pn_inline')], ['left', i18t('cl_ls_pos_left')], ['center', i18t('cl_ls_pos_center')], ['right', i18t('cl_ls_pos_right')]], mk.pageNumPos || '')
      + (mk.pageNumPos === 'off' ? '' : `<p class="cl-pk-q">${clE(i18t('cl_ls_pn_reads'))}</p>`
        + pills('data-cl-nfmt', (typeof PAGE_NUM_FORMATS === 'object' ? PAGE_NUM_FORMATS : ['page-of', 'of', 'slash']).map(f => [f, typeof brPageNumberSay === 'function' ? brPageNumberSay(f, 2, 6, mk.furnLang || null) : f]), mk.pageNumFmt || 'page-of')); }
  if (m === 'a') {
    const own = new Set(Object.keys(_cl.streams));
    return head(i18t('cl_pick_who')) + `
      <label class="cl-opt${_cl.applies === 'all' ? ' is-on' : ''}"><input type="radio" name="cl-applies" value="all"${_cl.applies === 'all' ? ' checked' : ''}><span><b>${clE(i18t('cl_who_all'))}</b><span>${clE(i18t('cl_who_all_d'))}</span></span></label>
      <label class="cl-opt${_cl.applies === 'some' ? ' is-on' : ''}"><input type="radio" name="cl-applies" value="some"${_cl.applies === 'some' ? ' checked' : ''}><span><b>${clE(i18t('cl_who_some'))}</b><span>${clE(i18t('cl_who_some_d'))}</span></span></label>
      <div class="cl-streams"${_cl.applies === 'some' ? '' : ' hidden'}>${clStreamIds().map(fid => `<label class="cl-tick"><input type="checkbox" data-cl-stream="${clE(fid)}"${_cl.pick.has(fid) ? ' checked' : ''}><span>${clE(clStreamName(fid))}</span>${own.has(fid) && _cl.editing !== fid ? `<em>· ${clE(i18t('cl_has_own'))}</em>` : ''}</label>`).join('')}</div>`;
  }
  return '';
}
function clOthersHtml() {
  const admin = clAdmin();
  const streams = Object.entries(_cl.streams).map(([fid, v]) => `<div class="cl-orow"><span class="cl-tag is-stream">${clE(i18t('cl_tag_stream'))}</span><b>${clE(clStreamName(fid))}</b><span class="cl-q">${clE((docDesignById(v.designId) || {}).name || v.designId)}</span><span class="cl-sp"></span>${admin ? `<button type="button" class="cl-lnk" data-cl-stream-edit="${clE(fid)}">${clE(i18t('cl_change'))}</button><button type="button" class="cl-lnk" data-cl-stream-x="${clE(fid)}">${clE(i18t('cl_use_company'))}</button>` : ''}</div>`);
  const papers = (window.ORG_PAPER_LOOKS || []).map(t => `<div class="cl-orow"><span class="cl-tag">${clE(i18t('cl_tag_paper'))}</span><b>${clE(t.name)}</b><span class="cl-q">${clE((docDesignById(t.designId) || {}).name || t.designId)}</span><span class="cl-sp"></span>${admin ? `<button type="button" class="cl-lnk" data-cl-paper-x="${clE(t.id)}">${clE(i18t('cl_use_company'))}</button>` : ''}</div>`);
  const n = streams.length + papers.length;
  return `<section class="cl-others" id="cl-others"><div class="cl-oh"><span>${clE(i18t('cl_others', { n }))}</span>${admin ? `<button type="button" class="cl-lnk" data-cl-add-stream>${typeof icon === 'function' ? icon('plus', 'w-3 h-3') : ''}${clE(i18t('cl_add_stream'))}</button>` : ''}</div>
    ${n ? streams.concat(papers).join('') : `<p class="cl-q">${clE(i18t('cl_others_none'))}</p>`}
    <p class="cl-q cl-wins">${clE(i18t('cl_wins'))}</p></section>`;
}
function clChipsHtml() {
  const m = _cl.mode, n = Object.keys(_cl.streams).length + (window.ORG_PAPER_LOOKS || []).length;
  const chip = (k, t) => `<button type="button" class="cl-chip${m === k ? ' is-on' : ''}" data-cl-mode="${k}">${clE(t)}</button>`;
  const who = _cl.applies === 'some' ? i18t(_cl.pick.size === 1 ? 'cl_who_n1' : 'cl_who_n', { n: _cl.pick.size }) : i18t('cl_who_every');
  return `<div class="cl-chips">${chip('page', i18t('cl_chip_page'))}${chip('s', i18t('cl_chip_style', { name: clDesign().name }))}${chip('l', i18t('cl_chip_layout', { name: clStructure().name }))}${chip('a', i18t('cl_chip_who', { who }))}<button type="button" class="cl-chip" data-cl-others>${clE(i18t('cl_chip_others', { n }))}</button></div>`;
}
/* ===== HOW OUR CONTRACTS LOOK, ROUND 1 OF THE LEGORA + STRIPE WAY (owner's pick 24 Nov 2026: "build it in L+S, in
   rounds") =====
   The page in the drawn frame, from what HaTi already keeps — nothing new is stored. Two tabs with their counts:
   The page (every part HaTi sets, one calm table: a numbered marker, what the paper will show, a soft badge, the
   part's own door — today's pickers) and Who wears it (every stream: the look it wears, its footer, its unsigned
   contracts on our paper; today's per-stream doors, and Other looks folded in). Beside the table, THE PREVIEW: one of
   the company's own unsigned contracts on our paper drawn as the SIGNING copy (signCopySheetHtml, the builder the
   Signing tab and their signing link draw) in the look being edited, a page at a time, with numbered pins at the parts
   the table names; with none, today's sample page stands in and says so. The preview reads; it never writes the
   contract (a shallow copy carries the look). THE QUALITY CHECK (clQuality) is the panel's: a logo, a footer, the
   letterhead's facts, and the colour's contrast on white (WCAG, 4.5 : 1) where the style shows a colour.
   Later rounds (header and page numbers, clause numbers, a cover page, the signature block, a brand kit, looks per
   company and language, a second admin's yes and the History) draw nothing here yet. */
const CL_AA = 4.5;
const CL_PV_W = 306;
const CL_PIN_SIDE = { logo: 'l', header: 'r', letterhead: 'r', style: 'l', layout: 'l', colour: 'r', type: 'r', footer: 'l', pagenum: 'r', sigblock: 'l', cover: 'l' };
const CL_ST_TONE = { set: 'green', missing: 'amber', faint: 'ruby', optional: 'grey' };
/* WCAG's relative luminance and contrast against white paper */
function clHexLum(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim()); if (!m) return null;
  const ch = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function clContrastOnWhite(hex) { const L = clHexLum(hex); return L == null ? null : 1.05 / (L + 0.05); }
const clRatioSay = r => (Math.floor(r * 10) / 10).toFixed(1);
/* the colour the paper prints in this look (the stored one made legible, as normalizeDesignBranding does), or null
   where the style is black and white and shows none */
function clShownColour() {
  if (clDesign().usesAccent === false) return null;
  const raw = _cl.look.accentColor || CL_ACCENTS[7][0];
  return (typeof accentLegible === 'function' ? accentLegible(raw) : null) || raw;
}
function clColourName(hex) {
  const h = String(hex || '').toLowerCase(), a = CL_ACCENTS.find(([x]) => x.toLowerCase() === h);
  return a ? i18t('cl_c_' + a[1]) : String(hex || '');
}
function clCompanyLook() { return _cl.editing ? clLookOf(window.ORG_BRANDING || {}) : _cl.look; }
function clLetterheadFacts() {
  const org = window.ORG_BRANDING || {};
  return { name: String(org.companyName || '').trim(), number: String(org.registrationNumber || '').trim(), address: String(org.address || '').trim() };
}
/* THE PARTS OF THE PAGE HaTi SETS TODAY, in the order they sit on a page; each with its value, its status and its door */
/* ---- ROUND 2 (owner, 24 Nov 2026): THE HEADER AND THE PAGE NUMBERS ----
   A line of words is the reader's words plus the fields pressed as chips (never typed braces): stored as
   "{company} · {ref} · Confidential", shown as the words alone with the chips lit, read on the paper filled from the
   previewed contract (brFieldsFill: a field with no value says nothing). */
const CL_FIELD_RE = /\{(company|ref|title)\}/g;
const CL_POS_SAY = { left: 'cl_ls_pos_left', center: 'cl_ls_pos_center', right: 'cl_ls_pos_right' };
function clFieldsSplit(text) {
  const t = String(text || '');
  const fields = [...t.matchAll(CL_FIELD_RE)].map(m => m[1]).filter((f, i, a) => a.indexOf(f) === i);
  const words = t.replace(CL_FIELD_RE, '').replace(/(\s*[·|]\s*){2,}/g, ' · ').replace(/^\s*[·|]\s*|\s*[·|]\s*$/g, '').replace(/\s{2,}/g, ' ').trim();
  return { fields, words };
}
const clFieldsJoin = (fields, words) => fields.map(f => '{' + f + '}').concat(String(words || '').trim() ? [String(words).trim()] : []).join(' · ');
function clMarks() { return Object.assign({ headerText: '', headerPos: null, pageNumPos: null, pageNumFmt: null }, _cl.look.pageMarks || (_cl.editing ? (window.ORG_BRANDING || {}).pageMarks : null) || {}); }
function clMarksSet(patch) { _cl.look.pageMarks = Object.assign(clMarks(), patch); }
/* what a line will say on the previewed contract */
function clFilledOn(text) {
  const c = clPvContract() || { name: i18t('cl_sample_name') };
  return typeof brFieldsFill === 'function' ? brFieldsFill(text, c, window.ORG_BRANDING || {}) : String(text || '');
}
/* the title the cover page will carry: the previewed contract's own */
function clCoverTitle() { const c = clPvContract(); return c ? String(c.name || '').trim() : i18t('cl_sample_name'); }
function clNumSay(fmt) { const mk = clMarks(), cv = mk.coverOn && !mk.coverCounts && (_cl.pvPages || 1) > 1 ? 1 : 0, m = Math.max(1, (_cl.pvPages || 1) - cv); return typeof brPageNumberSay === 'function' ? brPageNumberSay(fmt, 1, m, mk.furnLang || null) : ''; }
/* ROUND 5: the language of the words HaTi prints on the pages, said by name (null = the reader's own) */
const clLangName = l => i18t(l ? 'cl_lg_' + l : 'cl_lg_reader');
function clParts() {
  const d = clDesign(), st = clStructure(), admin = clAdmin(), lh = clLetterheadFacts();
  const mk = clMarks(), headOn = !!(mk.headerPos && mk.headerText);
  const footFilled = clFilledOn(_cl.footer);
  const pos = _cl.look.logoPosition || d.defaultLogoPos || 'top-left';
  const shown = clShownColour(), ratio = shown ? clContrastOnWhite(shown) : null;
  const act = (w, attr) => admin ? { label: i18t(w), attr } : null;
  const q = s => `<span class="cl-ls-quote">“${clE(s)}”</span>`;
  const quiet = s => `<span class="cl-ls-quiet">${clE(s)}</span>`;
  const lhWords = [lh.name, lh.number, lh.address].filter(Boolean).join(' · ');
  const stored = _cl.look.accentColor || CL_ACCENTS[7][0];
  const colourWords = shown
    ? `<span class="cl-ls-col"><i class="cl-dot" style="background:${clE(shown)}"></i>${clE(clColourName(stored))}${String(shown).toLowerCase() !== String(stored).toLowerCase() ? ` <span class="cl-ls-hex">${clE(i18t('cl_ls_printed', { hex: shown }))}</span>` : ''}</span>`
    : `<span class="cl-ls-col"><i class="cl-dot" style="background:${clE(stored)}"></i>${clE(clColourName(stored))} <span class="cl-ls-quiet">· ${clE(i18t('cl_mono'))}</span></span>`;
  const rows = [
    { k: 'logo', name: i18t('cl_n_logo'), html: _cl.logoUrl ? `<span class="cl-ls-col"><img class="cl-ls-logo" src="${clE(_cl.logoUrl)}" alt="">${clE(i18t(CL_POS_WORD[pos] || 'cl_pos_left'))}</span>` : quiet(i18t('cl_ls_no_logo')),
      st: _cl.logoUrl ? 'set' : 'missing', act: act(_cl.logoUrl ? 'cl_change' : 'cl_ls_upload', 'data-cl-mode="g"') },
    { k: 'header', name: i18t('cl_n_header'), html: headOn ? `${q(clFilledOn(mk.headerText))}${quiet('· ' + i18t(CL_POS_SAY[mk.headerPos]))}` : quiet(i18t('cl_ls_none')),
      st: headOn ? 'set' : 'optional', act: act(headOn ? 'cl_change' : 'cl_ls_add', 'data-cl-mode="h"') },
    { k: 'letterhead', name: i18t('cl_n_letterhead'), html: lhWords ? q(lhWords) : quiet(i18t('cl_no_company')),
      st: lh.name ? 'set' : 'missing', act: act('cl_change_there', 'data-cl-company') },
    { k: 'style', name: i18t('cl_n_style'), html: `<b class="cl-ls-name">${clE(d.name)}</b><span class="cl-ls-blurb">${clE(d.blurb)}</span>`, st: 'set', act: act('cl_change', 'data-cl-mode="s"') },
    { k: 'layout', name: i18t('cl_n_layout'), html: `<b class="cl-ls-name">${clE(st.name)}</b><span class="cl-ls-blurb">${clE(st.blurb)}</span>`, st: 'set', act: act('cl_change', 'data-cl-mode="l"') },
    { k: 'colour', name: i18t('cl_n_colour'), html: colourWords, st: !shown ? 'optional' : (ratio < CL_AA ? 'faint' : 'set'),
      act: act(shown && ratio < CL_AA ? 'cl_ls_fix' : 'cl_change', 'data-cl-mode="c"') },
    { k: 'type', name: i18t('cl_n_type'), html: quiet(i18t('cl_type_say')), st: 'set', act: null },
    { k: 'footer', name: i18t('cl_n_footer'), html: footFilled ? q(footFilled) : quiet(i18t('cl_no_footer')),
      st: String(_cl.footer || '').trim() ? 'set' : 'missing', act: act('cl_edit', 'data-cl-mode="f"') },
    { k: 'pagenum', name: i18t('cl_n_pagenum'), html: mk.pageNumPos === 'off' ? quiet(i18t('cl_ls_off'))
      : `${q(clNumSay(mk.pageNumFmt))}${quiet('· ' + i18t(mk.pageNumPos ? CL_POS_SAY[mk.pageNumPos] : 'cl_ls_pn_inline'))}`,
      st: mk.pageNumPos === 'off' ? 'optional' : 'set', act: act('cl_change', 'data-cl-mode="n"') },
    /* round 3: the signature block (side by side or stacked, the labelled lines) and the cover page, our paper only */
    { k: 'sigblock', name: i18t('cl_n_sigblock'), html: `<span>${clE(i18t(mk.sigLayout === 'stacked' ? 'cl_ls_sg_stacked' : 'cl_ls_sg_columns'))}</span>${quiet('· ' + ((mk.sigLines || []).length ? mk.sigLines.map(x => i18t('sig_ln_' + x)).join(', ') : i18t('cl_ls_sg_noline')))}`,
      st: 'set', act: act('cl_change', 'data-cl-mode="sg"') },
    { k: 'cover', name: i18t('cl_n_cover'), html: mk.coverOn ? `${q(clCoverTitle() || '—')}${quiet('· ' + i18t(mk.coverCounts ? 'cl_ls_cv_counted' : 'cl_ls_cv_not_counted'))}` : quiet(i18t('cl_ls_off')),
      st: mk.coverOn ? (clCoverTitle() ? 'set' : 'missing') : 'optional', act: act(mk.coverOn ? 'cl_change' : 'cl_ls_add', 'data-cl-mode="cv"') },
    /* round 5: the language of the words HaTi prints on the pages */
    { k: 'lang', name: i18t('cl_n_lang'), html: `<span>${clE(clLangName(mk.furnLang))}</span>${quiet('· ' + i18t('cl_lg_never'))}`,
      st: mk.furnLang ? 'set' : 'optional', act: act('cl_change', 'data-cl-mode="lg"') },
  ];
  rows.forEach((r, i) => { r.n = i + 1; });
  return rows;
}
const clPartNeeds = r => r.st === 'missing' || r.st === 'faint';
/* THE QUALITY CHECK, the panel's: what is owed or unreadable, each with its door; what is fine said green */
function clQuality() {
  const out = [], lh = clLetterheadFacts(), shown = clShownColour();
  const go = (w, m) => ({ label: i18t(w), attr: `data-st-ls-cl="${m}"` });
  if (!_cl.logoUrl) out.push({ tone: 'amber', t: i18t('cl_no_logo'), go: go('cl_ls_upload', 'g') });
  if (!String(_cl.footer || '').trim()) out.push({ tone: 'amber', t: i18t('cl_no_footer'), go: go('cl_edit', 'f') });
  const lhMiss = [!lh.name && i18t('cl_ls_lh_name'), !lh.number && i18t('cl_ls_lh_number'), !lh.address && i18t('cl_ls_lh_address')].filter(Boolean);
  if (lhMiss.length) out.push({ tone: 'amber', t: i18t('cl_ls_q_lh', { what: lhMiss.join(', ') }), go: go('cl_ls_fix', 'company') });
  if (shown) {
    const r = clContrastOnWhite(shown);
    if (r < CL_AA) out.push({ tone: 'ruby', t: i18t('cl_ls_q_faint', { c: clColourName(_cl.look.accentColor || shown), r: clRatioSay(r) }), go: go('cl_ls_fix', 'c') });
    else out.push({ tone: 'green', t: i18t('cl_ls_q_reads', { c: clColourName(_cl.look.accentColor || shown), r: clRatioSay(r) }) });
  }
  if (clMarks().pageNumPos === 'off') out.push({ tone: 'amber', t: i18t('cl_ls_q_nonum'), go: go('cl_change', 'n') });
  /* round 4: the brand kit — a black-and-white style with only a colour logo; a named colour too faint to read */
  if (clMono() && _cl.logoUrl && !_cl.logoBlackUrl) out.push({ tone: 'amber', t: i18t('cl_kit_q_noblack'), go: go('cl_ls_upload', 'kit') });
  (_cl.palette || []).slice(1).forEach(x => { const r = clContrastOnWhite(x.hex); if (r != null && r < CL_AA) out.push({ tone: 'ruby', t: i18t('cl_kit_q_faint', { c: x.name || x.hex, r: clRatioSay(r) }), go: go('cl_ls_fix', 'kit') }); });
  if (clMarks().coverOn && !clCoverTitle()) out.push({ tone: 'amber', t: i18t('cl_ls_q_cover_notitle'), go: go('cl_change', 'cv') });
  if (_cl.logoUrl) out.push({ tone: 'green', t: i18t('cl_ls_q_logo') });
  if (String(_cl.footer || '').trim()) out.push({ tone: 'green', t: i18t('cl_ls_q_footer') });
  if (!lhMiss.length) out.push({ tone: 'green', t: i18t('cl_ls_q_lh_ok') });
  return out;
}
/* THE STREAMS AND THE PAPERS THAT WEAR A LOOK (Who wears it; Other looks folded in) */
const clUnsigned = c => !!c && !(c.source === 'upload') && !c._codeNamed && !c.execution && (c.status === 'Draft' || c.status === 'Under Review');
function clWhoRows() {
  const all = (typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  const co = clCompanyLook(), org = window.ORG_BRANDING || {};
  /* the footer as a page reads it: its fields filled from the previewed contract (a field with no value says nothing) */
  const foot = [String(org.companyName || '').trim(), clFilledOn(String(_cl.footer || '').trim())].filter(Boolean).join(' · ');
  /* round 5: each row's page-words language: its own look's, else the company's (a stream's own marks replace the company's whole) */
  const coMarks = co.pageMarks || (window.ORG_BRANDING || {}).pageMarks || {};
  const streams = clStreamIds().map(fid => {
    const own = _cl.streams[fid], look = own ? clLookOf(own) : co, pm = own && own.pageMarks ? own.pageMarks : coMarks;
    return { key: 'stream:' + fid, fid, kind: 'stream', name: clStreamName(fid), own: !!own, look, foot,
      lang: pm.furnLang || null, fmt: pm.pageNumFmt || null, numOff: pm.pageNumPos === 'off',
      unsigned: all.filter(c => clUnsigned(c) && String(c.folder) === fid).length };
  });
  const papers = (window.ORG_PAPER_LOOKS || []).map(t => ({ key: 'paper:' + t.id, id: t.id, kind: 'paper', name: t.name, own: true,
    look: clLookOf({ designId: t.designId }), foot, lang: coMarks.furnLang || null, fmt: coMarks.pageNumFmt || null, numOff: coMarks.pageNumPos === 'off', unsigned: null }));
  return streams.concat(papers);
}
/* what differs from the company look, said part by part */
function clDiffers(look) {
  const co = clCompanyLook(), out = [];
  if (look.designId !== co.designId) out.push(i18t('cl_ls_d_style', { v: (docDesignById(look.designId) || {}).name || look.designId }));
  if ((look.structureId || DEFAULT_STRUCTURE) !== (co.structureId || DEFAULT_STRUCTURE)) out.push(i18t('cl_ls_d_layout', { v: (docStructureById(look.structureId) || {}).name || look.structureId }));
  if ((look.accentColor || '') !== (co.accentColor || '') && look.accentColor) out.push(i18t('cl_ls_d_colour', { v: clColourName(look.accentColor) }));
  if ((look.logoPosition || '') !== (co.logoPosition || '') && look.logoPosition) out.push(i18t('cl_ls_d_logo', { v: i18t(CL_POS_WORD[look.logoPosition] || 'cl_pos_left') }));
  if (look.pageMarks && JSON.stringify(look.pageMarks) !== JSON.stringify(co.pageMarks || (window.ORG_BRANDING || {}).pageMarks || null)) out.push(i18t('cl_ls_d_marks'));
  return out;
}
/* THE PREVIEW'S CONTRACTS: the company's own, unsigned, on our paper (their paper is never dressed); the stream being
   edited first */
function clPvCandidates() {
  const all = (typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  const list = all.filter(clUnsigned);
  return _cl.editing ? list.filter(c => String(c.folder) === _cl.editing).concat(list.filter(c => String(c.folder) !== _cl.editing)) : list;
}
function clPvContract() {
  const list = clPvCandidates(); if (!list.length) return null;
  return list.find(c => String(c.id) === String(_cl.pv)) || list[0];
}
const clRefOf = c => (typeof contractRef === 'function' ? contractRef(c) : String(c.contractNo || c.id || ''));
function clChev() { return typeof icon === 'function' ? icon('chevD', 'cl-ls-chev') : '▾'; }
function clTabsHtml(parts) {
  const nS = clStreamIds().length, nP = (window.ORG_PAPER_LOOKS || []).length;
  const tab = (k, w, n) => `<button type="button" role="tab" class="st-ls-tab${_cl.tab === k ? ' is-on' : ''}" aria-selected="${_cl.tab === k ? 'true' : 'false'}" data-cl-tab="${k}">${clE(w)}<i>${clE(n)}</i></button>`;
  const kit = clKitParts().filter(x => x.set).length, hist = clLookChanges().length;
  return `<div class="st-ls-tabs cl-ls-tabs" id="cl-tabs" role="tablist">${tab('page', i18t('cl_ls_tab_page'), i18tn('cl_ls_n_parts', parts.length, { n: parts.length }))}${tab('kit', i18t('cl_ls_tab_kit'), String(kit))}${tab('history', i18t('cl_hist_tab'), String(hist))}${tab('who', i18t('cl_ls_tab_who'), i18tn('cl_ls_n_streams', nS, { n: nS }) + (nP ? ' · ' + i18tn('cl_ls_n_papers', nP, { n: nP }) : ''))}</div>`;
}
function clChipHtml(k, label, n, on, dot) {
  return `<button type="button" class="apn-tab is-chip${on ? ' is-on' : ''}${on && k !== 'all' && k !== 'h-all' ? ' is-narrow' : ''}" data-cl-chip="${k}">${dot ? `<i class="apn-cd is-${dot}" aria-hidden="true"></i>` : ''}${clE(label)} <span>${n}</span></button>`;
}
function clStreamChipHtml() {
  if (!clAdmin() || !clStreamIds().length) return '';
  const label = _cl.editing ? i18t('cl_ls_chip_stream_on', { name: clStreamName(_cl.editing) }) : i18t('cl_ls_chip_stream');
  const opts = [`<button type="button" role="menuitem" class="cl-menu-i${_cl.editing ? '' : ' is-on'}" data-cl-edit-as="">${clE(i18t('cl_ls_company_look'))}</button>`]
    .concat(clStreamIds().map(fid => `<button type="button" role="menuitem" class="cl-menu-i${_cl.editing === fid ? ' is-on' : ''}" data-cl-edit-as="${clE(fid)}"><span>${clE(clStreamName(fid))}</span>${_cl.streams[fid] ? `<em>${clE(i18t('cl_has_own'))}</em>` : ''}</button>`));
  return `<span class="cl-ls-chipw"><button type="button" class="apn-tab is-chip cl-ls-add${_cl.editing ? ' is-on' : ''}" data-cl-menu="stream" aria-haspopup="menu" aria-expanded="false">${clE(label)}</button><div class="cl-menu" role="menu" data-cl-menu-of="stream" hidden>${opts.join('')}</div></span>`;
}
function clPartsTableHtml(parts) {
  const fix = parts.filter(clPartNeeds).length;
  const chip = _cl.chip === 'fix' && fix ? 'fix' : 'all';
  const shown = chip === 'fix' ? parts.filter(clPartNeeds) : parts;
  const chips = `<div class="apn-bar sdd-chips st-ls-chips cl-ls-chips">${clChipHtml('all', i18t('ctf_tab_all'), parts.length, chip === 'all')}${fix ? clChipHtml('fix', i18t('cl_ls_chip_fix'), fix, chip === 'fix', 'ruby') : ''}${clStreamChipHtml()}</div>`;
  const body = shown.map(r => `<tr class="st-ls-row cl-ls-row${_cl.row === r.k ? ' is-chosen' : ''}" data-cl-part="${r.k}" tabindex="0">
      <td class="cl-ls-part"><span class="cl-mk is-${r.st}" aria-hidden="true">${r.n}</span>${clE(r.name)}</td>
      <td class="cl-ls-val">${r.html}</td>
      <td><span class="apn-st is-${CL_ST_TONE[r.st]}">${clE(i18t('cl_ls_st_' + r.st))}</span></td>
      <td class="r">${r.act ? `<button type="button" class="cl-lnk" ${r.act.attr}>${clE(r.act.label)}</button>` : ''}</td></tr>`).join('');
  return chips + `<table class="st-ls-t cl-ls-t" id="cl-parts"><thead><tr><th>${clE(i18t('cl_ls_c_part'))}</th><th>${clE(i18t('cl_ls_c_shows'))}</th><th>${clE(i18t('cl_ls_c_status'))}</th><th></th></tr></thead><tbody>${body}</tbody></table>`;
}
function clPreviewHtml() {
  const list = clPvCandidates(), c = clPvContract();
  const label = c ? `${clE(c.name || '')} <span class="cl-ls-hex">· ${clE(clRefOf(c))}</span>` : clE(i18t('cl_ls_pv_sample'));
  const menu = list.length > 1 ? `<div class="cl-menu is-pv" role="menu" data-cl-menu-of="pv" hidden>${list.slice(0, 30).map(x => `<button type="button" role="menuitem" class="cl-menu-i${c && x.id === c.id ? ' is-on' : ''}" data-cl-pv="${clE(x.id)}"><span>${clE(x.name || '')}</span><em>${clE(clRefOf(x))}</em></button>`).join('')}</div>` : '';
  const pick = list.length > 1
    ? `<button type="button" class="cl-pv-pick" data-cl-menu="pv" aria-haspopup="menu" aria-expanded="false"><span>${clE(i18t('cl_ls_pv_on'))}</span> <b>${label}</b>${clChev()}</button>`
    : `<span class="cl-pv-pick"><span>${clE(i18t('cl_ls_pv_on'))}</span> <b>${label}</b></span>`;
  return `<section class="cl-pv" id="cl-pv" aria-label="${clE(i18t('cl_ls_pv_label'))}">
    <div class="cl-pv-h"><span class="cl-ls-chipw cl-pv-w">${pick}${menu}</span><span class="cl-pv-n" id="cl-pv-n"></span></div>
    <div class="cl-pv-view" id="cl-pv-view"><div class="cl-pv-paper" id="cl-pv-paper">${typeof busyHtml === 'function' ? busyHtml('') : ''}</div><div class="cl-pins" id="cl-pins"></div></div>
    <div class="cl-pv-pages" id="cl-pv-pages"></div>
    ${c ? '' : `<p class="cl-pv-none">${clE(i18t('cl_ls_pv_none'))}</p>`}
  </section>`;
}
/* what a row's footer says on its second page: the footer's words, then the page number in the row's own language */
function clWhoFoot(r) {
  const n = r.numOff || typeof brPageNumberSay !== 'function' ? '' : brPageNumberSay(r.fmt, 2, 5, r.lang);
  return [r.foot, n].filter(Boolean).join(' · ');
}
function clWhoHtml() {
  const rows = clWhoRows(), own = rows.filter(r => r.own).length, admin = clAdmin();
  /* round 5: a chip per page-words language a row wears (none with no rows) */
  const langs = [...new Set(rows.map(r => r.lang).filter(Boolean))];
  const chipOk = k => k === 'all' || (k === 'own' && own) || (k.indexOf('lang:') === 0 && langs.includes(k.slice(5)));
  const chip = chipOk(_cl.whoChip || 'all') ? (_cl.whoChip || 'all') : 'all';
  const shown = chip === 'own' ? rows.filter(r => r.own) : chip.indexOf('lang:') === 0 ? rows.filter(r => r.lang === chip.slice(5)) : rows;
  const langChips = langs.map(l => clChipHtml('lang:' + l, clLangName(l), rows.filter(r => r.lang === l).length, chip === 'lang:' + l, 'steel')).join('');
  const org = window.ORG_BRANDING || {};
  const chips = `<div class="apn-bar sdd-chips st-ls-chips cl-ls-chips">${clChipHtml('all', i18t('ctf_tab_all'), rows.length, chip === 'all')}${own ? clChipHtml('own', i18t('cl_ls_chip_own'), own, chip === 'own', 'violet') : ''}${langChips}<span class="cl-sp"></span>${admin ? `<button type="button" class="ui-btn cl-ls-pill" data-cl-add-stream>${typeof icon === 'function' ? icon('plus', 'w-3 h-3') : ''}${clE(i18t('cl_add_stream'))}</button>` : ''}</div>`;
  const body = shown.map(r => {
    const d = docDesignById(r.look.designId) || DOC_DESIGNS[0];
    const act = !admin ? '' : r.kind === 'paper' ? `<button type="button" class="cl-lnk" data-cl-paper-x="${clE(r.id)}">${clE(i18t('cl_use_company'))}</button>`
      : r.own ? `<button type="button" class="cl-lnk" data-cl-stream-edit="${clE(r.fid)}">${clE(i18t('cl_edit'))}</button>`
      : `<button type="button" class="cl-lnk" data-cl-edit-as="${clE(r.fid)}">${clE(i18t('cl_ls_give_own'))}</button>`;
    return `<tr class="st-ls-row cl-ls-row${_cl.whoPick === r.key ? ' is-chosen' : ''}" data-cl-who="${clE(r.key)}" tabindex="0">
      <td class="cl-ls-who"><b class="cl-ls-nm">${clE(r.name)}</b><span class="cl-ls-sub">${clE([r.kind === 'paper' ? i18t('cl_tag_paper') : (org.companyName || i18t('cl_tag_stream')), clLangName(r.lang)].join(' · '))}</span></td>
      <td class="cl-ls-val"><span>${clE(d.name)} <span class="cl-ls-quiet">· ${clE(i18t(r.own ? 'cl_ls_own_look' : 'cl_ls_company_look'))}</span></span>${clWhoFoot(r) ? `<span class="cl-ls-quote">“${clE(clWhoFoot(r))}”</span>` : `<span class="cl-ls-quiet">${clE(i18t('cl_no_footer'))}</span>`}</td>
      <td><span class="apn-st is-${r.own ? 'violet' : 'green'}">${clE(i18t(r.own ? 'cl_ls_wears_own' : 'cl_ls_wears_follows'))}</span></td>
      <td class="r">${r.unsigned == null ? '<span class="cl-ls-quiet">—</span>' : clE(r.unsigned)}</td>
      <td class="r">${act}</td></tr>`;
  }).join('');
  return chips + `<table class="st-ls-t cl-ls-t" id="cl-who"><thead><tr><th>${clE(i18t('cl_ls_c_stream'))}</th><th>${clE(i18t('cl_ls_c_which'))}</th><th>${clE(i18t('cl_ls_c_wears'))}</th><th class="r">${clE(i18t('cl_ls_c_unsigned'))}</th><th></th></tr></thead><tbody>${body || `<tr><td colspan="5" class="st-ls-none">${clE(i18t('cl_others_none'))}</td></tr>`}</tbody></table>
    <p class="cl-ls-rule">${clE(i18t('cl_ls_wins'))}</p>`;
}
/* ---- ROUND 4 (owner, 24 Nov 2026): THE BRAND KIT, as drawn (kit()): logo versions, faces, colours, where it is used ----
   Only what is true: the colour logo (today's) and a black one a black-and-white style wears; the two faces HaTi serves
   itself, each saying what the sealed PDF and Word set instead; up to four named colours, the first the accent, each
   with its contrast on white and, below 4.5 : 1, one press to the nearest colour that reads. */
function clKitParts() {
  const mk = clMarks(), pal = _cl.palette || [];
  /* `need`: owed or unreadable, as the quality check says it (a face is never owed: the style's own stands) */
  const faint = pal.some(x => { const r = clContrastOnWhite(x.hex); return r != null && r < CL_AA; });
  return [{ k: 'logo', set: !!_cl.logoUrl, need: !_cl.logoUrl, name: i18t('cl_kit_logo_colour') },
    { k: 'logoBlack', set: !!_cl.logoBlackUrl, need: clMono() && !!_cl.logoUrl && !_cl.logoBlackUrl, name: i18t('cl_kit_need_black') },
    { k: 'fontTitle', set: !!mk.fontTitle, need: false }, { k: 'fontBody', set: !!mk.fontBody, need: false },
    { k: 'colours', set: pal.length > 0, need: faint, name: i18t('cl_kit_colours') }];
}
const clMono = () => clDesign().usesAccent === false;
/* the nearest colour that reads on white: the same hue, darker, a step at a time, until 4.5 : 1 */
function clNearestPassing(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return null;
  const rgb = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  for (let k = 1; k >= 0; k -= 0.01) {
    const h = '#' + rgb.map(v => Math.round(v * k).toString(16).padStart(2, '0')).join('');
    if (clContrastOnWhite(h) >= CL_AA) return h;
  }
  return '#' + '000000';
}
function clKitHtml() {
  const admin = clAdmin(), mk = clMarks(), F = (typeof BR_FONTS === 'object' && BR_FONTS) || {};
  const badge = st => `<span class="apn-st is-${CL_ST_TONE[st]}">${clE(i18t('cl_ls_st_' + st))}</span>`;
  const logoRow = (k, url, st, fileId, word) => `<div class="cl-kit-logo" data-cl-kit-logo="${k}"><span class="cl-kit-thumb${url ? '' : ' is-empty'}">${url ? `<img src="${clE(url)}" alt="">` : clE(word)}</span>${badge(st)}
      ${admin ? `<input type="file" id="${fileId}" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden><button type="button" class="cl-lnk" data-cl-kit-up="${k}">${clE(i18t(url ? 'cl_logo_replace' : 'cl_ls_upload'))}</button>${url ? `<button type="button" class="cl-lnk" data-cl-kit-x="${k}">${clE(i18t('cl_logo_remove'))}</button>` : ''}` : ''}</div>`;
  const logos = `<section class="cl-kit-col" id="cl-kit-logos"><h4>${clE(i18t('cl_kit_logos'))}</h4>
    <p class="cl-kit-k">${clE(i18t('cl_kit_logo_colour'))}</p>${logoRow('colour', _cl.logoUrl, _cl.logoUrl ? 'set' : 'missing', 'cl-kit-colour-file', i18t('cl_kit_w_colour'))}
    <p class="cl-kit-k">${clE(i18t('cl_kit_logo_black'))}</p>${logoRow('black', _cl.logoBlackUrl, _cl.logoBlackUrl ? 'set' : (clMono() && _cl.logoUrl ? 'missing' : 'optional'), 'cl-kit-black-file', i18t('cl_kit_w_black'))}
    <p class="cl-kit-q">${clE(i18t('cl_kit_logo_note', { style: clDesign().name }))}</p></section>`;
  const facePills = (k, cur) => `<div class="cl-pk-row">${[['', i18t('cl_kit_f_style')]].concat(Object.keys(F).map(id => [id, F[id].name])).map(([v, w]) =>
    `<button type="button" class="cl-pill${(cur || '') === v ? ' is-on' : ''}" data-cl-kit-font="${k}:${v}"${v ? ` style="font-family:${clE(F[v].css)}"` : ''}>${clE(w)}</button>`).join('')}</div>`;
  const faceSay = id => id && F[id] ? i18t('cl_kit_f_where', { screen: F[id].name, pdf: i18t(F[id].pdf === 'serif' ? 'cl_kit_pdf_serif' : 'cl_kit_pdf_sans'), word: F[id].word }) : i18t('cl_kit_f_default');
  const fonts = `<section class="cl-kit-col" id="cl-kit-fonts"><h4>${clE(i18t('cl_kit_fonts'))}</h4>
    <p class="cl-kit-k">${clE(i18t('cl_kit_f_title'))}</p>${admin ? facePills('fontTitle', mk.fontTitle) : ''}<p class="cl-kit-q">${clE(faceSay(mk.fontTitle))}</p>
    <p class="cl-kit-k">${clE(i18t('cl_kit_f_body'))}</p>${admin ? facePills('fontBody', mk.fontBody) : ''}<p class="cl-kit-q">${clE(faceSay(mk.fontBody))}</p></section>`;
  const pal = _cl.palette || [];
  const colRow = (x, i) => {
    const r = clContrastOnWhite(x.hex), ok = r != null && r >= CL_AA, near = ok ? null : clNearestPassing(x.hex);
    return `<div class="cl-kit-colour" data-cl-kit-col="${i}"><i class="cl-kit-sw" style="background:${clE(x.hex)}"></i>
      <span class="cl-kit-cw"><input type="text" class="cl-in cl-kit-name" data-cl-kit-name="${i}" maxlength="40" value="${clE(x.name)}" placeholder="${clE(i18t(i ? 'cl_kit_c_name_ph' : 'cl_kit_c_accent_ph'))}"${admin ? '' : ' disabled'}>
      <span class="cl-kit-meta"><input type="text" class="cl-in cl-kit-hex" data-cl-kit-hex="${i}" maxlength="7" value="${clE(x.hex)}" aria-label="${clE(i18t('cl_kit_c_hex'))}"${admin ? '' : ' disabled'}><span class="${ok ? 'cl-kit-ok' : 'cl-kit-bad'}">${r == null ? '' : clE(clRatioSay(r) + ' : 1')}</span>${i === 0 ? `<span class="apn-st is-green">${clE(i18t('cl_kit_c_on_paper'))}</span>` : ''}</span>
      <input type="text" class="cl-in cl-kit-use" data-cl-kit-use="${i}" maxlength="60" value="${clE(x.use)}" placeholder="${clE(i18t(i ? 'cl_kit_c_use_ph' : 'cl_kit_c_use0'))}"${admin ? '' : ' disabled'}>
      ${ok ? '' : `<span class="cl-kit-note">${clE(i18t('cl_kit_c_faint', { r: clRatioSay(r) }))} ${admin ? `<button type="button" class="cl-lnk" data-cl-kit-fix="${i}">${clE(i18t('cl_kit_c_use', { hex: near }))}</button>` : ''}</span>`}</span>
      ${admin && i ? `<button type="button" class="cl-lnk cl-kit-x" data-cl-kit-del="${i}" aria-label="${clE(i18t('cl_logo_remove'))}">${clE(i18t('cl_logo_remove'))}</button>` : ''}</div>`;
  };
  const colours = `<section class="cl-kit-col" id="cl-kit-colours"><h4>${clE(i18t('cl_kit_colours'))}</h4>${pal.map(colRow).join('') || `<p class="cl-kit-q">${clE(i18t('cl_kit_c_none'))}</p>`}
    ${admin && pal.length < 4 ? `<button type="button" class="ui-btn cl-ls-pill" data-cl-kit-add>${typeof icon === 'function' ? icon('plus', 'w-3 h-3') : ''}${clE(i18t('cl_kit_c_add'))}</button>` : ''}
    <p class="cl-kit-q">${clE(i18t(clMono() ? 'cl_kit_c_mono' : 'cl_kit_c_note'))}</p></section>`;
  const used = [['cl_kit_u_ours', 'cl_kit_u_ours_s', 'green', 'cl_kit_b_uses'], ['cl_kit_u_signed', 'cl_kit_u_signed_s', 'grey', 'cl_kit_b_locked'], ['cl_kit_u_theirs', 'cl_kit_u_theirs_s', 'grey', 'cl_kit_b_never']];
  return `<div class="cl-kit" id="cl-kit">${logos}${fonts}${colours}</div>
    <table class="st-ls-t cl-ls-t" id="cl-kit-used"><thead><tr><th>${clE(i18t('cl_kit_u_where'))}</th><th>${clE(i18t('cl_kit_u_what'))}</th><th>${clE(i18t('cl_ls_c_status'))}</th></tr></thead><tbody>
    ${used.map(([w, sh, tone, b]) => `<tr><td>${clE(i18t(w))}</td><td><span class="cl-ls-quote">${clE(i18t(sh))}</span></td><td><span class="apn-st is-${tone}">${clE(i18t(b))}</span></td></tr>`).join('')}</tbody></table>`;
}
/* ---- ROUND 6 (owner, 24 Nov 2026): A SECOND ADMIN'S YES, AND THE HISTORY (the Ladder's way: POST /api/look/changes,
   …/:id/decide, …/:id/withdraw, …/:id/revert) ----
   While another admin exists the black button reads Send for approval: the change waits, the live look does not move,
   any OTHER admin approves it or sends it back, and its author may withdraw it. With one admin, Save applies at once and
   is recorded as theirs. History lists every change since this round (nothing before it is invented). */
function clMe() { return (typeof currentUser === 'function' && currentUser()) || {}; }
function clAdminsN() { try { return (typeof getUsers === 'function' ? getUsers() : []).filter(u => u && u.role === 'admin').length || 1; } catch (_) { return 1; } }
function clLookChanges() { const st = (typeof state === 'object' && state && state.settings) || {}; return Array.isArray(st.lookChanges) ? st.lookChanges.slice().reverse() : []; }
function clWaitingChange() { return clLookChanges().find(c => c && c.state === 'waiting') || null; }
const clMayDecide = ch => !!ch && ch.state === 'waiting' && clMe().role === 'admin' && String(ch.byId) !== String(clMe().id);
/* A SECOND ADMIN'S YES NEEDS A SERVER: without one (the static build) there is no look/changes route, so Save saves the
   look at once, as with one admin (clLookChangesLoad's guard) */
function clYesNeeded() { return (typeof API_MODE !== 'function' || API_MODE()) && clAdminsN() > 1; }
/* THE OLDER DOORS ONTO THE LOOK (the design step's Save and Publish, the builder's branding box): while another admin
   exists PUT /api/org/branding refuses a look change (409 needsApproval). The look is then sent for approval by the
   same writer as Settings' Send for approval (POST /api/look/changes), and what is not the look (name, number,
   address) still saves. Returns 'sent' or 'saved'. CL_LOOK_KEYS mirrors the server's LOOK_KEYS. */
const CL_LOOK_KEYS = ['logoUrl', 'defaultFooterText', 'designId', 'logoPosition', 'accentColor', 'accentSource', 'structureId', 'streamLooks', 'pageMarks', 'logoBlackUrl', 'palette'];
async function lookSaveOrSend(payload) {
  try { await saveOrgBranding(payload); return 'saved'; } catch (e) {
    if (!(e && e.status === 409 && e.data && e.data.needsApproval)) throw e;
    const rest = Object.assign({}, payload || {}); CL_LOOK_KEYS.forEach(k => { delete rest[k]; });
    if (Object.keys(rest).length) await saveOrgBranding(rest);
    const r = await api('look/changes', 'POST', Object.assign({}, payload || {}, { note: '' }));
    clLookChangesSet(r && r.lookChanges);
    return 'sent';
  }
}
function clLookChangesSet(list) { if (typeof state === 'object' && state) { state.settings = state.settings || {}; state.settings.lookChanges = Array.isArray(list) ? list : []; } }
function clLookChangesLoad() {
  if (typeof api !== 'function' || (typeof API_MODE === 'function' && !API_MODE())) return Promise.resolve();
  return api('look/changes').then(r => { clLookChangesSet(r && r.lookChanges); }).catch(() => {});
}
function clDay(iso) {
  const d = new Date(String(iso || '')); if (isNaN(d)) return '';
  if (d.toDateString() === new Date().toDateString()) return i18t('cl_hist_today');
  try { return d.toLocaleDateString(typeof langLocale === 'function' ? langLocale() : undefined, { day: 'numeric', month: 'short' }); } catch (_) { return d.toISOString().slice(0, 10); }
}
/* THE PARTS A CHANGE MOVES, each with how the paper reads after it (and before it) */
const CL_HIST_KEY_PART = { logoUrl: 'cl_n_logo', logoBlackUrl: 'cl_kit_need_black', defaultFooterText: 'cl_n_footer', designId: 'cl_n_style', structureId: 'cl_n_layout',
  logoPosition: 'cl_n_logo', accentColor: 'cl_n_colour', streamLooks: 'cl_hist_p_streams', palette: 'cl_kit_colours' };
const CL_HIST_PM_PART = [[['headerText', 'headerPos'], 'cl_n_header'], [['pageNumPos', 'pageNumFmt'], 'cl_n_pagenum'], [['sigLayout', 'sigLines'], 'cl_n_sigblock'],
  [['coverOn', 'coverCounts'], 'cl_n_cover'], [['fontTitle', 'fontBody'], 'cl_kit_fonts'], [['furnLang'], 'cl_n_lang']];
function clPmSay(part, pm) {
  const m = pm || {};
  if (part === 'cl_n_header') return m.headerPos && m.headerText ? clFilledOn(m.headerText) + ' · ' + i18t(CL_POS_SAY[m.headerPos]) : i18t('cl_ls_none');
  if (part === 'cl_n_pagenum') return m.pageNumPos === 'off' ? i18t('cl_ls_off') : (typeof brPageNumberSay === 'function' ? brPageNumberSay(m.pageNumFmt, 2, 6, m.furnLang || null) : '') + ' · ' + i18t(m.pageNumPos ? CL_POS_SAY[m.pageNumPos] : 'cl_ls_pn_inline');
  if (part === 'cl_n_sigblock') return i18t(m.sigLayout === 'stacked' ? 'cl_ls_sg_stacked' : 'cl_ls_sg_columns') + ((m.sigLines || []).length ? ' · ' + m.sigLines.map(x => i18t('sig_ln_' + x)).join(', ') : '');
  if (part === 'cl_n_cover') return i18t(m.coverOn ? 'cl_ls_on' : 'cl_ls_off');
  if (part === 'cl_kit_fonts') { const F = (typeof BR_FONTS === 'object' && BR_FONTS) || {}; return [m.fontTitle, m.fontBody].map(x => x && F[x] ? F[x].name : i18t('cl_kit_f_style')).join(' / '); }
  if (part === 'cl_n_lang') return clLangName(m.furnLang || null);
  return '';
}
function clValSay(k, v) {
  if (k === 'logoUrl' || k === 'logoBlackUrl') return i18t(v ? 'cl_hist_logo_set' : 'cl_ls_none');
  if (k === 'designId') return (docDesignById(v) || {}).name || i18t('cl_ls_none');
  if (k === 'structureId') return (docStructureById(v || DEFAULT_STRUCTURE) || {}).name || '';
  if (k === 'logoPosition') return v ? i18t(CL_POS_WORD[v] || 'cl_pos_left') : i18t('cl_kit_f_style');
  if (k === 'accentColor') return v ? clColourName(v) : i18t('cl_ls_none');
  if (k === 'defaultFooterText') return v ? clFilledOn(v) : i18t('cl_no_footer');
  if (k === 'palette') return Array.isArray(v) && v.length ? v.map(x => x.name || x.hex).join(', ') : i18t('cl_ls_none');
  if (k === 'streamLooks') { const ids = Object.keys(v || {}); return ids.length ? ids.map(clStreamName).join(', ') : i18t('cl_ls_company_look'); }
  return String(v == null ? '' : v);
}
function clChangeParts(ch) {
  const out = [], seen = new Set();
  (ch.keys || []).forEach(k => {
    if (k === 'accentSource') return;
    if (k === 'pageMarks') {
      const a = (ch.before || {}).pageMarks || {}, b = (ch.after || {}).pageMarks || {};
      const nz = v => (v == null || v === '' || (Array.isArray(v) && !v.length)) ? null : v;
      CL_HIST_PM_PART.forEach(([ks, part]) => { if (ks.some(x => JSON.stringify(nz(a[x])) !== JSON.stringify(nz(b[x]))) && !seen.has(part)) {
        seen.add(part); out.push({ k, part, name: i18t(part), before: clPmSay(part, a), after: clPmSay(part, b) }); } });
      return;
    }
    const part = CL_HIST_KEY_PART[k] || k; if (seen.has(part)) return; seen.add(part);
    out.push({ k, part, name: i18t(part), before: clValSay(k, (ch.before || {})[k]), after: clValSay(k, (ch.after || {})[k]) });
  });
  return out;
}
const CL_HIST_TONE = { waiting: 'amber', approved: 'green', saved: 'green', 'sent-back': 'ruby', withdrawn: 'grey' };
function clHistBadge(ch) {
  const w = ch.state === 'waiting' ? i18t('cl_hist_st_waiting') : ch.state === 'approved' ? i18t('cl_hist_st_approved', { who: ch.decidedBy || '' })
    : ch.state === 'saved' ? i18t('cl_hist_st_saved', { who: ch.by || '' }) : ch.state === 'sent-back' ? i18t('cl_hist_st_back') : i18t('cl_hist_st_withdrawn');
  return `<span class="apn-st is-${CL_HIST_TONE[ch.state] || 'grey'}">${clE(w)}</span>`;
}
/* how many streams and contracts a change reaches: a change to streams' own looks reaches those streams; the rest
   reaches every stream that wears the company look. Unsigned contracts on our paper take it; signed ones keep theirs. */
function clChangeReach(ch) {
  const all = (typeof state === 'object' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  const ours = all.filter(c => c && c.source !== 'upload' && !c._codeNamed);
  let fids;
  if ((ch.keys || []).length === 1 && ch.keys[0] === 'streamLooks') {
    const a = (ch.before || {}).streamLooks || {}, b = (ch.after || {}).streamLooks || {};
    fids = [...new Set(Object.keys(a).concat(Object.keys(b)))].filter(f => JSON.stringify(a[f] || null) !== JSON.stringify(b[f] || null));
  } else fids = clStreamIds().filter(f => !_cl.streams[f]);
  const inF = c => fids.includes(String(c.folder));
  return { streams: fids.length, unsigned: ours.filter(c => clUnsigned(c) && inF(c)).length, signed: ours.filter(c => (c.status === 'Signed' || c.execution) && inF(c)).length };
}
function clHistRows() {
  let rows = clLookChanges();
  if (_cl.histChip === 'wait') rows = rows.filter(c => c.state === 'waiting');
  if (_cl.histWho) rows = rows.filter(c => String(c.byId) === String(_cl.histWho));
  if (_cl.histPart) rows = rows.filter(c => clChangeParts(c).some(p => p.part === _cl.histPart));
  return rows;
}
function clHistActHtml(ch) {
  const me = clMe();
  if (clMayDecide(ch)) return `<button type="button" class="cl-lnk" data-cl-ap="yes:${clE(ch.id)}">${clE(i18t('cl_hist_approve'))}</button>`;
  if (ch.state === 'waiting' && String(ch.byId) === String(me.id)) return `<button type="button" class="cl-lnk" data-cl-ap="withdraw:${clE(ch.id)}">${clE(i18t('cl_hist_withdraw'))}</button>`;
  if ((ch.state === 'approved' || ch.state === 'saved') && me.role === 'admin' && (ch.keys || []).some(k => k !== 'logoUrl' && k !== 'logoBlackUrl' && k !== 'accentSource'))
    return `<button type="button" class="cl-lnk" data-cl-ap="revert:${clE(ch.id)}">${clE(i18t('cl_hist_go_back'))}</button>`;
  return `<button type="button" class="cl-lnk" data-cl-hist-pick="${clE(ch.id)}">${clE(i18t('cl_hist_see'))}</button>`;
}
function clHistHtml() {
  const all = clLookChanges(), wait = all.filter(c => c.state === 'waiting').length, rows = clHistRows();
  const people = [...new Map(all.map(c => [String(c.byId), c.by || ''])).entries()];
  const parts = [...new Map(all.flatMap(c => clChangeParts(c)).map(p => [p.part, p.name])).entries()];
  const menu = (k, opts, cur, label) => `<span class="cl-ls-chipw"><button type="button" class="apn-tab is-chip cl-ls-add${cur ? ' is-on' : ''}" data-cl-menu="${k}" aria-haspopup="menu" aria-expanded="false">${clE(label)}</button><div class="cl-menu" role="menu" data-cl-menu-of="${k}" hidden>`
    + `<button type="button" role="menuitem" class="cl-menu-i${cur ? '' : ' is-on'}" data-cl-hist-${k}="">${clE(i18t('ctf_tab_all'))}</button>`
    + opts.map(([v, w]) => `<button type="button" role="menuitem" class="cl-menu-i${String(cur) === String(v) ? ' is-on' : ''}" data-cl-hist-${k}="${clE(v)}"><span>${clE(w)}</span></button>`).join('') + '</div></span>';
  const whoName = _cl.histWho ? ((people.find(([v]) => v === String(_cl.histWho)) || [])[1] || '') : '';
  const partName = _cl.histPart ? ((parts.find(([v]) => v === _cl.histPart) || [])[1] || '') : '';
  const chips = `<div class="apn-bar sdd-chips st-ls-chips cl-ls-chips">${clChipHtml('h-all', i18t('ctf_tab_all'), all.length, _cl.histChip !== 'wait')}${wait ? clChipHtml('h-wait', i18t('cl_hist_chip_wait'), wait, _cl.histChip === 'wait', 'amber') : ''}`
    + `${people.length > 1 || _cl.histWho ? menu('who', people, _cl.histWho, whoName ? i18t('cl_hist_who_on', { who: whoName }) : i18t('cl_hist_who')) : ''}${parts.length > 1 || _cl.histPart ? menu('part', parts, _cl.histPart, partName ? i18t('cl_hist_part_on', { part: partName }) : i18t('cl_hist_part')) : ''}`
    + `<span class="cl-sp"></span><span class="cl-ls-quiet cl-hist-order">${clE(i18t('cl_hist_newest'))}</span></div>`;
  if (!all.length) return chips + `<p class="cl-ls-rule">${clE(i18t('cl_hist_starts'))}</p>`;
  const body = rows.map(ch => { const ps = clChangeParts(ch);
    return `<tr class="st-ls-row cl-ls-row${_cl.histPick === ch.id ? ' is-chosen' : ''}" data-cl-hist="${clE(ch.id)}" tabindex="0">
      <td class="cl-hist-when">${clE(clDay(ch.at))}</td>
      <td class="cl-ls-val"><span><b class="cl-ls-name">${clE(ps.map(p => p.name).join(', ') || i18t('cl_hist_p_look'))}</b></span>${ps[0] ? `<span class="cl-ls-quote">“${clE(ps[0].after)}”</span>` : ''}</td>
      <td class="cl-hist-by">${clE(ch.by || '')}</td><td>${clHistBadge(ch)}</td><td class="r">${clHistActHtml(ch)}</td></tr>`; }).join('');
  return chips + `<table class="st-ls-t cl-ls-t" id="cl-hist"><thead><tr><th>${clE(i18t('cl_hist_c_when'))}</th><th>${clE(i18t('cl_hist_c_what'))}</th><th>${clE(i18t('cl_hist_c_by'))}</th><th>${clE(i18t('cl_ls_c_status'))}</th><th></th></tr></thead><tbody>${body || `<tr><td colspan="5" class="st-ls-none">${clE(i18t('st_ls_none'))}</td></tr>`}</tbody></table>
    <p class="cl-ls-rule">${clE(i18t(clYesNeeded() ? 'cl_hist_rule' : 'cl_hist_rule_solo'))} ${clE(i18t('cl_hist_starts'))}</p>`;
}
/* the note asked with a send or a send-back, in the one edit pop-up (lgpOpen) */
function clApNoteOpen(kind, id) {
  if (typeof lgpOpen !== 'function') return clApDo(kind, id, '');
  lgpOpen({ id: 'cl-ap-form', title: i18t(kind === 'send' ? 'cl_ap_send_t' : 'cl_ap_back_t'), sub: i18t(kind === 'send' ? 'cl_ap_send_s' : 'cl_ap_back_s'),
    rows: [{ k: i18t('cl_ap_note'), id: 'cl-ap-note', type: 'area', max: 280, ph: i18t('cl_ap_note_ph') }],
    primary: { label: i18t(kind === 'send' ? 'cl_ap_send' : 'cl_hist_send_back'), attr: `data-cl-ap-go="${clE(kind)}:${clE(id || '')}"` } });
}
function clProposeOpen() { clApNoteOpen('send', ''); }
async function clApDo(kind, id, note) {
  try {
    let r;
    if (kind === 'send') r = await api('look/changes', 'POST', Object.assign(clPayload(), { note }));
    else if (kind === 'yes' || kind === 'back') r = await api(`look/changes/${encodeURIComponent(id)}/decide`, 'POST', { yes: kind === 'yes', why: note });
    else if (kind === 'withdraw') r = await api(`look/changes/${encodeURIComponent(id)}/withdraw`, 'POST', {});
    else if (kind === 'revert') r = await api(`look/changes/${encodeURIComponent(id)}/revert`, 'POST', { note });
    clLookChangesSet(r && r.lookChanges);
    if (r && r.change) _cl.histPick = r.change.id;
    if (kind === 'yes' && typeof refreshOrgBranding === 'function') await refreshOrgBranding();
    toast(i18t('cl_ap_done_' + kind), 'ok');
    if (typeof closeModal === 'function' && document.querySelector('#modal-root #cl-ap-form')) closeModal();
    const keep = { tab: kind === 'send' || kind === 'revert' ? 'history' : _cl.tab, pick: _cl.histPick };
    clInit(); _cl.tab = keep.tab; _cl.histPick = keep.pick; clRepaint();
  } catch (e) { toast((e && e.message) || i18t('cl_save_failed'), 'err'); }
}
/* the door every Needs-you row and bell row presses: History, that change chosen */
function clHistGo(id) {
  if (!_cl) clInit();
  _cl.tab = 'history'; _cl.histPick = id || null; _cl.mode = 'page';
  if (typeof setView === 'function' && typeof state === 'object' && state && state.view !== 'team') setView('team');
  if (typeof settingsGoPage === 'function') settingsGoPage('look'); else clRepaint();
}
function clLsPageHtml() {
  const admin = clAdmin(), parts = clParts();
  if (!['who', 'kit', 'history'].includes(_cl.tab)) _cl.tab = 'page';
  const spark = (typeof icon === 'function') ? icon('mkSpark', 'sdd-spark-ic', 0) : '';
  /* round 6: with another admin, the one black button sends the change for approval */
  const acts = admin ? `<button type="button" id="cl-save" class="ui-btn ui-btn-primary"${_cl.dirty ? '' : ' disabled'}>${clE(i18t(clYesNeeded() ? 'cl_ap_send' : 'act_save'))}</button>` : '';
  const ask = admin ? `<form class="apn-ask sdd-find st-ls-find cl-ask" id="cl-ask" autocomplete="off"><span class="sdd-find-ic" aria-hidden="true">${spark}</span><input type="text" id="cl-say" maxlength="300" autocomplete="off" placeholder="${clE(i18t('cl_ask_ph'))}" aria-label="${clE(i18t('cl_ask_ph'))}" value="${clE(_cl.said)}"></form><p class="cl-said" id="cl-said" aria-live="polite"></p>`
    : `<p class="st-ls-small">${clE(i18t('cl_read_only'))}</p>`;
  /* round 6, the SAP way (inline, no band): one admin's Save applies at once; a change waiting is said where the look is */
  const wch = clWaitingChange();
  const sub = _cl.editing ? i18t('cl_editing_stream', { name: clStreamName(_cl.editing) })
    : wch ? i18t('cl_ap_waiting_line', { who: wch.by || '', day: clDay(wch.at) }) : (admin && !clYesNeeded() && _cl.dirty ? i18t('cl_ap_only') : '');
  const picking = _cl.mode !== 'page';
  const left = picking ? `<div class="cl-pick cl-ls-pick">${clPickHtml()}</div>` : _cl.tab === 'who' ? clWhoHtml() : _cl.tab === 'kit' ? clKitHtml() : _cl.tab === 'history' ? clHistHtml() : clPartsTableHtml(parts);
  const wide = (_cl.tab === 'who' || _cl.tab === 'kit' || _cl.tab === 'history') && !picking;
  return `<div class="st-pg cl-pg is-ls is-r1" data-st-pg="look">${window.stLsHeadHtml({ page: 'look', title: i18t('cl_title'), sub,
      badge: `<span class="apn-st is-grey cl-ls-badge">${clE(i18t('cl_admins_only'))}</span>`, acts, askHtml: ask + clTabsHtml(parts) })}
    <div class="cl-ls-grid${wide ? ' is-who' : ''}">
      <div class="cl-ls-left">${left}</div>
      ${wide ? '' : clPreviewHtml()}
    </div></div>`;
}
/* ---- THE PREVIEW, drawn after the page stands: the signing copy, a page at a time, shrunk to fit; pins measured off
   the painted page (a rect read after paint), so a pin sits where the part really is ---- */
function clAfterPaint() {
  const paper = document.getElementById('cl-pv-paper'); if (!paper || !_cl) return;
  const c = clPvContract();
  if (c && c._light && !c._loaded && typeof ensureFull === 'function') {
    const id = c.id;
    ensureFull(c).then(() => { const n = clPvContract(); if (_cl && n && n.id === id) clPvDraw(); }).catch(() => clPvDraw(true));
    return;
  }
  clPvDraw();
}
function clPvDraw(sampleOnly) {
  const paper = document.getElementById('cl-pv-paper'), view = document.getElementById('cl-pv-view'); if (!paper || !view) return;
  const c = sampleOnly ? null : clPvContract();
  let html = '';
  if (c && typeof signCopySheetHtml === 'function') {
    try { html = signCopySheetHtml(Object.assign({}, c, { branding: Object.assign({}, clBranding()) }), { wrapId: 'cl-pv-wrap', canvasId: '' }); } catch (_) { html = ''; }
  }
  _cl.pvPages = 1;
  if (!html) {
    paper.innerHTML = clSheetHtml().replace('class="cl-sheet-w"', 'class="cl-sheet-w is-pv"');
    const sh = paper.querySelector('.cl-sheet'); if (!sh) return;
    const foot = sh.lastElementChild; if (foot && !foot.matches('article')) foot.setAttribute('data-cl-foot', '');
    const k = CL_PV_W / (sh.offsetWidth || 680);
    sh.style.transformOrigin = '0 0'; sh.style.transform = `scale(${k})`;
    view.style.height = Math.round(sh.offsetHeight * k) + 'px';
    _cl.pvPage = 1; clPvPagesPaint(1); clPinsPaint();
    return;
  }
  paper.innerHTML = html;
  /* the working copy's "working text" note is not on the copy that is signed */
  const kick = paper.querySelector('.rl-paper-kick'); if (kick) kick.textContent = String(kick.textContent || '').split(' · ')[0];
  const sheet = paper.querySelector('.pg-sheet'); if (!sheet) return;
  const k = CL_PV_W / (window.PG_SIGN_W || 794);
  sheet.style.transformOrigin = '0 0';
  const done = info => { _cl.pvPages = (info && info.n) || 1; if (_cl.pvPage > _cl.pvPages) _cl.pvPage = 1; clPvShow(); };
  if (typeof signCopyWatch === 'function') signCopyWatch(sheet, Object.assign({}, c, { branding: Object.assign({}, clBranding()) }), done);
  if (!sheet._pgInfo) { sheet.style.transform = `scale(${k})`; view.style.height = Math.round(sheet.offsetHeight * k) + 'px'; clPinsPaint(); }
}
function clPvShow() {
  const view = document.getElementById('cl-pv-view'), sheet = view && view.querySelector('.pg-sheet'); if (!sheet) return;
  const info = sheet._pgInfo, k = CL_PV_W / (sheet.offsetWidth || 794);
  const n = (info && info.n) || 1, p = Math.min(Math.max(1, _cl.pvPage || 1), n), pg = info && info.pages[p - 1];
  const top = pg ? pg.top : 0, h = pg ? pg.h : sheet.offsetHeight;
  sheet.style.transform = `translateY(${-top * k}px) scale(${k})`;
  view.style.height = Math.round(h * k) + 'px';
  clPvPagesPaint(n); clPinsPaint();
  /* the Page numbers row says what the paper says, with the previewed contract's own page count */
  const pq = document.querySelector('#cl-parts tr[data-cl-part="pagenum"] .cl-ls-quote');
  if (pq) pq.textContent = '“' + clNumSay(clMarks().pageNumFmt) + '”';
}
function clPvPagesPaint(n) {
  const host = document.getElementById('cl-pv-pages'), say = document.getElementById('cl-pv-n');
  const p = Math.min(Math.max(1, _cl.pvPage || 1), n);
  /* round 3: a cover page is "Cover", and the pages after it count from 1 unless the look counts it */
  const cov = !!(document.querySelector('#cl-pv-view .pg-cover')), counts = !!clMarks().coverCounts;
  const num = i => cov && !counts ? i - 1 : i, of = cov && !counts ? n - 1 : n;
  const word = i => cov && i === 1 ? i18t('cl_ls_pv_cover') : i18t('cl_ls_pv_page', { n: num(i), m: of });
  if (say) say.textContent = word(p);
  if (host) host.innerHTML = n > 1 ? Array.from({ length: Math.min(n, 12) }, (_, i) => `<button type="button" class="cl-pv-thumb${i + 1 === p ? ' is-on' : ''}${cov && i === 0 ? ' is-cover' : ''}" data-cl-pv-page="${i + 1}" aria-label="${clE(word(i + 1))}">${cov && i === 0 ? clE(i18t('cl_ls_pv_cover_short')) : num(i + 1)}</button>`).join('') : '';
}
/* where each part sits on the painted page; null where the page carries none of it */
function clPinTarget(k, root) {
  const head = root.querySelector('[data-doc-design]');
  const art = root.querySelector('article') || root;
  if (k === 'logo') return root.querySelector('[data-doc-design] img') || root.querySelector('.pg-dfoot img, [data-cl-foot] img') || head;
  if (k === 'letterhead') {
    const name = clLetterheadFacts().name;
    if (head && name) { const hit = [...head.querySelectorAll('div,span')].find(e => !e.children.length && String(e.textContent || '').trim() === name); if (hit) return hit; }
    return head;
  }
  if (k === 'style') return art.querySelector('.rl-paper-title, h1');
  if (k === 'layout') return [...art.querySelectorAll('h2, h3, h4, .rl-clause-h')].find(e => !e.matches('.rl-paper-title')) || null;
  if (k === 'colour') { const hex = clShownColour(); return hex ? root.querySelector(`[style*="${hex}"]`) : null; }
  if (k === 'type') return [...art.querySelectorAll('p')].find(e => String(e.textContent || '').trim().length > 20) || null;
  if (k === 'footer' || k === 'header' || k === 'pagenum') return null;
  if (k === 'sigblock') return root.querySelector('.rl-paper-foot');
  if (k === 'cover') return root.querySelector('.pg-cover .pg-cover-title, .pg-cover');
  return null;
}
/* where the WORDS of a part sit (a centred title is not as wide as its line), else the element's own box */
function clTextRect(el) {
  try { const r = document.createRange(); r.selectNodeContents(el); const rs = [...r.getClientRects()].filter(x => x.width > 1 && x.height > 1); if (rs.length) return rs[0]; } catch (_) { /* the box below */ }
  return el.getBoundingClientRect();
}
/* a header or a number painted by CSS (its words are the element's data-l): the box where its words stand */
function clMarkRect(el, k) {
  const b = el.getBoundingClientRect();
  if (k !== 'header' && k !== 'pagenum') return b;
  if (el.matches('.pg-pnum') || k === 'pagenum') {
    const al = el.getAttribute('data-al') || (k === 'pagenum' && !el.matches('.pg-pnum') ? 'right' : 'center');
    return al === 'left' ? { left: b.left, right: b.left + 40, top: b.top, bottom: b.bottom } : al === 'right' ? { left: b.right - 40, right: b.right, top: b.top, bottom: b.bottom } : { left: b.left + b.width / 2 - 20, right: b.left + b.width / 2 + 20, top: b.top, bottom: b.bottom };
  }
  const al = el.getAttribute('data-al') || 'left';
  return al === 'right' ? { left: b.right - 60, right: b.right, top: b.top, bottom: b.bottom } : al === 'center' ? { left: b.left + b.width / 2 - 30, right: b.left + b.width / 2 + 30, top: b.top, bottom: b.bottom } : { left: b.left, right: b.left + 60, top: b.top, bottom: b.bottom };
}
function clPinsPaint() {
  const view = document.getElementById('cl-pv-view'), pins = document.getElementById('cl-pins'); if (!view || !pins || !_cl) return;
  const root = view.querySelector('.pg-sheet, .cl-sheet'); if (!root) { pins.innerHTML = ''; return; }
  const vr = view.getBoundingClientRect(), parts = clParts(), out = [];
  parts.forEach(r => {
    let el = clPinTarget(r.k, root);
    const inView = sel => [...root.querySelectorAll(sel)].find(e => { const b = e.getBoundingClientRect(); return b.top >= vr.top - 1 && b.top < vr.bottom; }) || null;
    if (r.k === 'footer') el = inView('.pg-dfoot, .pg-sfoot, [data-cl-foot]');
    /* round 2: the header line on this page; the page number on its own line, else at the end of the footer line */
    if (r.k === 'header') el = inView('.pg-run.is-mark');
    if (r.k === 'pagenum') el = r.st === 'optional' ? null : (inView('.pg-pnum') || inView('.pg-dfoot, .pg-sfoot'));
    if (!el) return;
    const b = (r.k === 'logo' || r.k === 'colour' || r.k === 'header' || r.k === 'pagenum') ? clMarkRect(el, r.k) : clTextRect(el); if (b.bottom < vr.top || b.top > vr.bottom - 4) return;
    const x = Math.max(2, Math.min(vr.width - 18, (CL_PIN_SIDE[r.k] === 'r' ? b.right + 5 : b.left - 21) - vr.left));
    const y = Math.max(2, Math.min(vr.height - 18, b.top - vr.top - 4));
    out.push(`<button type="button" class="cl-pin is-${r.st}${_cl.row === r.k ? ' is-lit' : ''}" data-cl-pin="${r.k}" style="left:${Math.round(x)}px;top:${Math.round(y)}px" title="${clE(r.name)}" aria-label="${clE(r.n + ' · ' + r.name)}">${r.n}</button>`);
  });
  pins.innerHTML = out.join('');
}
/* a row or a pin chosen: the row lights, its pin lights; a part on another page brings that page */
function clRowChoose(k) {
  _cl.row = _cl.row === k ? null : k;
  document.querySelectorAll('#cl-parts tr[data-cl-part]').forEach(tr => tr.classList.toggle('is-chosen', tr.getAttribute('data-cl-part') === _cl.row));
  const view = document.getElementById('cl-pv-view'), sheet = view && view.querySelector('.pg-sheet');
  if (_cl.row && sheet && sheet._pgInfo && _cl.row !== 'footer') {
    const el = clPinTarget(_cl.row, sheet);
    if (el) { const sr = sheet.getBoundingClientRect(), sc = sr.height / (sheet.offsetHeight || 1), y = (el.getBoundingClientRect().top - sr.top) / (sc || 1);
      let at = 1; sheet._pgInfo.pages.forEach((p, i) => { if (y >= p.top - 1) at = i + 1; });
      if (at !== _cl.pvPage) { _cl.pvPage = at; return clPvShow(); } }
  }
  clPinsPaint();
}
function clMenuClose() {
  document.querySelectorAll('[data-st-pg="look"] .cl-menu').forEach(m => { m.hidden = true; });
  document.querySelectorAll('[data-st-pg="look"] [data-cl-menu]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
/* edit the look of one stream (its own, or the company's as its start), or the company look again */
function clEditAs(fid) {
  if (!_cl || !clAdmin()) return;
  if (!fid) { _cl.look = clLookOf(window.ORG_BRANDING || {}); _cl.applies = 'all'; _cl.pick = new Set(); _cl.editing = null; }
  else { _cl.look = clLookOf(_cl.streams[fid] || window.ORG_BRANDING || {}); _cl.applies = 'some'; _cl.pick = new Set([fid]); _cl.editing = fid; }
  _cl.mode = 'page'; _cl.tab = 'page'; _cl.pv = null; _cl.pvPage = 1; clRepaint();
}
/* the panel beside the page (Settings' stLsLookPanel draws it): the look as it stands, the ring of parts set, the
   quality check; on Who wears it with a stream chosen, that stream */
function clPanelFacts() {
  if (!_cl) clInit();
  const parts = clParts();
  const ids = clStreamIds(), own = ids.filter(f => _cl.streams[f]).length;
  const out = { tab: _cl.tab, style: clDesign().name, editing: _cl.editing ? clStreamName(_cl.editing) : '', streams: ids.length, follow: ids.length - own,
    set: parts.filter(r => !clPartNeeds(r)).length + clKitParts().filter(x => !x.need).length, of: parts.length + clKitParts().length,
    owed: parts.filter(clPartNeeds).map(r => r.name).concat(clKitParts().filter(x => x.need && x.k !== 'logo').map(x => x.name)), quality: clQuality(), who: null,
    /* round 4: the brand kit's own count, for its tab's panel */
    kitSet: clKitParts().filter(x => x.set).length, kitOf: clKitParts().length,
    /* round 6: the change waiting (said on the page's panel) and, on History, the change chosen */
    waiting: (w => w ? { by: w.by || '', day: clDay(w.at) } : null)(clWaitingChange()), hist: null };
  if (_cl.tab === 'history') {
    const ch = clLookChanges().find(c => c.id === _cl.histPick) || clWaitingChange() || clLookChanges()[0] || null;
    if (ch) { const ps = clChangeParts(ch), reach = clChangeReach(ch), me = clMe();
      const deciders = (typeof getUsers === 'function' ? getUsers() : []).filter(u => u && u.role === 'admin' && String(u.id) !== String(ch.byId)).map(u => u.name || u.email);
      const trail = [{ tone: 'amber', t: i18t('cl_hist_tr_proposed', { who: ch.by || '', day: clDay(ch.at) }) }]
        .concat(ch.note ? [{ tone: 'grey', t: '“' + ch.note + '”' }] : [])
        .concat(ch.state === 'approved' ? [{ tone: 'green', t: i18t('cl_hist_tr_approved', { who: ch.decidedBy || '', day: clDay(ch.decidedAt) }) }]
          : ch.state === 'sent-back' ? [{ tone: 'ruby', t: i18t('cl_hist_tr_back', { who: ch.decidedBy || '', day: clDay(ch.decidedAt) }) }].concat(ch.decidedWhy ? [{ tone: 'grey', t: '“' + ch.decidedWhy + '”' }] : [])
          : ch.state === 'withdrawn' ? [{ tone: 'grey', t: i18t('cl_hist_tr_withdrawn', { day: clDay(ch.decidedAt) }) }]
          : ch.state === 'saved' ? [{ tone: 'green', t: i18t('cl_hist_tr_saved', { who: ch.by || '' }) }] : [{ tone: 'amber', t: i18t('cl_hist_tr_waiting') }]);
      const tagT = { waiting: 'amber', approved: 'green', saved: 'green', 'sent-back': 'red', withdrawn: 'gray' };
      out.hist = { id: ch.id, state: ch.state, badge: clHistBadge(ch), tagText: clHistBadge(ch).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'), tagTone: tagT[ch.state] || 'gray', title: ps.map(p => p.name).join(', ') || i18t('cl_hist_p_look'),
        sub: i18t('cl_hist_p_sub', { who: ch.by || '', day: clDay(ch.at), n: reach.streams }), mayDecide: clMayDecide(ch),
        mine: ch.state === 'waiting' && String(ch.byId) === String(me.id), deciders, parts: ps, reach, trail };
      out.tab = 'history'; } }
  if (_cl.tab === 'who' && _cl.whoPick) {
    const r = clWhoRows().find(x => x.key === _cl.whoPick);
    if (r) out.who = { key: r.key, kind: r.kind, fid: r.fid || '', id: r.id || '', name: r.name, own: r.own, unsigned: r.unsigned,
      company: (window.ORG_BRANDING || {}).companyName || '', style: (docDesignById(r.look.designId) || DOC_DESIGNS[0]).name, differs: r.own ? clDiffers(r.look) : [],
      /* round 5: the row's page words, as its pages say them; the wording is never translated */
      lang: r.lang ? clLangName(r.lang) : '', langLines: r.lang ? [i18t('cl_lg_d_num', { say: r.numOff ? i18t('cl_ls_off') : brPageNumberSay(r.fmt, 2, 5, r.lang) }),
        i18t('cl_lg_d_sig', { say: ['name', 'date'].map(k => brFurnT(r.lang, 'sig_ln_' + k, null, k)).join(', ') })].concat(r.foot ? [i18t('cl_lg_d_foot', { say: r.foot })] : []) : [] };
  }
  return out;
}
function clLetGo() { if (!_cl || _cl.tab !== 'who' || !_cl.whoPick) return false; _cl.whoPick = null; clRepaint(); return true; }
function clPageHtml() {
  if (!_cl) clInit();
  const admin = clAdmin(), page = _cl.mode === 'page';
  const editing = _cl.editing ? i18t('cl_editing_stream', { name: clStreamName(_cl.editing) }) : '';
  /* ROUND 1 OF THE LEGORA + STRIPE WAY (owner's pick 24 Nov 2026; replaces P-45's page of 22 Nov): Settings' own head,
     the two tabs, the table of parts beside the preview on one of our own contracts (clLsPageHtml) */
  if (typeof window.stLsOn === 'function' && window.stLsOn() && typeof window.stLsHeadHtml === 'function') return clLsPageHtml();
  const acts = admin
    ? `<span class="cl-admin">${clE(i18t('cl_admins_only'))}</span><button type="button" id="cl-save" class="ui-btn ui-btn-primary"${_cl.dirty ? '' : ' disabled'}>${clE(i18t('act_save'))}</button>`
    : `<span class="cl-admin">${clE(i18t('cl_admins_only'))}</span>`;
  return `<div class="st-pg cl-pg" data-st-pg="look">
    <section class="st-pg-card">${(typeof window.stPageHeadHtml === 'function') ? window.stPageHeadHtml(i18t('cl_title'), '', acts) : ''}
      <p class="cl-sub">${clE(editing || i18t('cl_sub'))}</p></section>
    <div class="cl-body">
      ${admin ? `<form class="cl-ask" id="cl-ask"><input type="text" id="cl-say" class="cl-in" maxlength="300" autocomplete="off" placeholder="${clE(i18t('cl_ask_ph'))}" value="${clE(_cl.said)}"><button type="submit" class="cl-go" aria-label="${clE(i18t('cl_ask_go'))}">${window.JB_SEND_ICON || '↑'}</button></form><p class="cl-said" id="cl-said" aria-live="polite"></p>` : `<p class="cl-q">${clE(i18t('cl_read_only'))}</p>`}
      ${clChipsHtml()}
      <div class="cl-desk${page ? '' : ' is-picking'}">
        ${page ? `<div class="cl-notes is-l">${clNotesHtml('l')}</div>` : ''}
        ${clSheetHtml()}
        ${page ? `<div class="cl-notes is-r">${clNotesHtml('r')}</div>` : `<div class="cl-pick">${clPickHtml()}</div>`}
      </div>
      ${clOthersHtml()}
    </div></div>`;
}
function clRepaint() {
  const pg = document.querySelector('[data-st-pg="look"]'); if (!pg) return;
  const sc = pg.closest('.scroll-thin, #content-scroll') || document.getElementById('content-scroll'); const top = sc ? sc.scrollTop : 0;
  const t = document.createElement('div'); t.innerHTML = clPageHtml(); pg.replaceWith(t.firstElementChild);
  if (sc) sc.scrollTop = top;
  /* P-45: Jambo's panel beside the page says the look as it now stands */
  if (typeof window.stLsOn === 'function' && window.stLsOn() && typeof window.stLsPanelPaint === 'function') window.stLsPanelPaint();
  clAfterPaint();
}
/* P-45: what the panel beside the page says (read here, where the look is kept), and its rows' one door: a setting's
   own Change, as the page's own link opens it */
function clFacts() {
  if (!_cl) clInit();
  const org = window.ORG_BRANDING || {};
  return { admin: clAdmin(), style: clDesign().name, layout: clStructure().name, logo: !!_cl.logoUrl, footer: !!String(_cl.footer || '').trim(),
    company: org.companyName || '', own: Object.keys(_cl.streams || {}).length, streams: clStreamIds().length };
}
function clModeGo(m) { if (!_cl) clInit(); if (!clAdmin()) return;
  /* the panel's doors (round 1): a part's picker, Company & market, a stream's own look or the company's again */
  const s = String(m || 'page');
  if (s === 'company') { if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'company'); return; }
  if (s === 'kit') { _cl.tab = 'kit'; _cl.mode = 'page'; return clRepaint(); }
  /* round 6: the panel's Approve, Send back, Withdraw and Go back to it */
  const ap = /^ap-(yes|back|withdraw|revert):(.+)$/.exec(s);
  if (ap) return ap[1] === 'back' ? clApNoteOpen('back', ap[2]) : clApDo(ap[1], ap[2], '');
  if (s.indexOf('stream:') === 0) return clEditAs(s.slice(7));
  if (s.indexOf('stream-x:') === 0) { const fid = s.slice(9); return clSet(() => { delete _cl.streams[fid]; }); }
  _cl.mode = s; clRepaint(); }
function clSet(fn) { fn(); _cl.dirty = true; clRepaint(); }
/* A LOOK TYPED IN A SENTENCE, READ WITHOUT AI: colours, the logo's place, a style or a layout named; what is not read is said */
function clReadLook(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ', got = {}, said = [], notes = [];
  const hex = t.match(/#[0-9a-f]{6}\b/);
  const col = hex ? [hex[0], hex[0]] : CL_ACCENTS.find(([, w]) => new RegExp('\\b' + w + '\\b').test(t))
    || (/\b(grey|gray)\b/.test(t) ? CL_ACCENTS[7] : null) || (/\bred\b|\bmaroon\b/.test(t) ? CL_ACCENTS[4] : null) || (/\borange\b/.test(t) ? CL_ACCENTS[5] : null);
  if (col) { got.accentColor = col[0]; said.push(i18t('cl_said_colour', { c: col[1].startsWith('#') ? col[1] : i18t('cl_c_' + col[1]) })); }
  if (/\blogo\b/.test(t)) {
    const pos = /\bleft\b/.test(t) ? 'top-left' : /\bright\b/.test(t) ? 'top-right' : /\b(centre|center|middle)\b/.test(t) ? 'top-center' : /\b(footer|bottom)\b/.test(t) ? 'footer' : null;
    if (pos) { got.logoPosition = pos; said.push(i18t('cl_said_logo', { p: i18t(CL_POS_WORD[pos]) })); }
  }
  const d = DOC_DESIGNS.find(x => t.includes(x.name.toLowerCase()) || t.includes(' ' + x.name.toLowerCase().split(' ').pop() + ' '));
  if (d) { got.designId = d.id; said.push(i18t('cl_said_style', { s: d.name })); }
  const st = DOC_STRUCTURES.find(x => t.includes(x.name.toLowerCase()) || (x.id === 'two-column' && /two[ -]colum/.test(t)) || (x.id === 'margin-numbers' && /numbers? in the margin/.test(t)));
  if (st) { got.structureId = st.id; said.push(i18t('cl_said_layout', { l: st.name })); }
  /* round 2: "page numbers bottom right", "no page numbers", "header: Confidential on the right", "no header" */
  const side = s => /\bleft\b/.test(s) ? 'left' : /\bright\b/.test(s) ? 'right' : /\b(centre|center|middle)\b/.test(s) ? 'center' : null;
  const pm = {};
  if (/\b(no|without)\s+page\s*numbers?\b|\bpage\s*numbers?\s+off\b/.test(t)) { pm.pageNumPos = 'off'; said.push(i18t('cl_said_nonum')); }
  else { const pn = t.match(/\bpage\s*numbers?\b([^,;.]*)/); if (pn) { const p = side(pn[1]); if (p) { pm.pageNumPos = p; said.push(i18t('cl_said_num', { p: i18t(CL_POS_SAY[p]) })); } } }
  if (/\bno\s+header\b|\bheader\s+off\b/.test(t)) { pm.headerPos = null; pm.headerText = ''; said.push(i18t('cl_said_nohead')); }
  else {
    const raw = ' ' + String(text || '') + ' ', hm = raw.match(/\bheader\b\s*(?:[:\-–]|saying|says|reads)?\s*["“']?([^,;"”]*?)["”']?\s*(?:\b(?:on|at|to|in)\s+the\s+(left|right|centre|center|middle)\b[^,;]*)?\s*(?=[,;]|$)/i);
    if (hm && hm[1] && hm[1].trim()) {
      const words = hm[1].replace(/[{}]/g, '').trim().slice(0, 120), p = hm[2] ? side(hm[2].toLowerCase()) : 'left';
      pm.headerText = words; pm.headerPos = p; said.push(i18t('cl_said_head', { h: words, p: i18t(CL_POS_SAY[p]) }));
    }
  }
  /* round 5: "page words in Swedish", "Swedish page numbers", "page words in English", "page words in the reader's language" */
  if (/\b(page\s+words?|page\s+numbers?|furniture)\b/.test(t)) {
    const l = /\b(swedish|svenska)\b/.test(t) ? 'sv' : /\benglish\b/.test(t) ? 'en' : /\breader'?s\b/.test(t) ? '' : null;
    if (l !== null) { pm.furnLang = l || null; said.push(i18t('cl_said_lang', { l: clLangName(l || null) })); }
  }
  /* round 3: "cover page on", "no cover page", "signatures stacked", "signatures side by side" */
  if (/\b(no|without)\s+(a\s+)?cover(\s+page)?\b|\bcover(\s+page)?\s+off\b/.test(t)) { pm.coverOn = false; said.push(i18t('cl_said_nocover')); }
  else if (/\bcover\s+page\b|\bcover\s+on\b/.test(t)) { pm.coverOn = true; said.push(i18t('cl_said_cover')); }
  if (/\bsignatures?\b[^,;.]*\bstack(ed)?\b|\bstacked\s+signatures?\b/.test(t)) { pm.sigLayout = 'stacked'; said.push(i18t('cl_said_sig_stacked')); }
  else if (/\bsignatures?\b[^,;.]*\bside\s+by\s+side\b/.test(t)) { pm.sigLayout = 'columns'; said.push(i18t('cl_said_sig_columns')); }
  if (Object.keys(pm).length) got.pageMarks = pm;
  /* THE CLAUSE NUMBERS ARE THE WORDING'S OWN (round 3): asked for, they are said honestly and nothing is changed */
  if (/\bnumbering\b|\bclause\s+numbers?\b|\b\d\.\d\b/.test(t)) notes.push(i18t('cl_said_numbering'));
  return { got, said, notes };
}
/* THE LOOK AS THE PAGE WOULD SAVE IT, one builder for Save and Send for approval (round 6) */
function clPayload() {
    /* round 2: the header and page numbers go with the look (the server cleans them, js/branding.js pageMarksClean) */
    const look = { designId: _cl.look.designId, structureId: _cl.look.structureId, logoPosition: _cl.look.logoPosition, accentColor: _cl.look.accentColor,
      pageMarks: _cl.look.pageMarks || null };
    const streams = JSON.parse(JSON.stringify(_cl.streams));
    const payload = { logoUrl: _cl.logoUrl, defaultFooterText: _cl.footer, logoBlackUrl: _cl.logoBlackUrl || null };
    /* round 4: the company's named colours, the first in step with the accent (a stream's look keeps its own accent) */
    if (_cl.applies !== 'some') { const pal = (_cl.palette || []).map(x => Object.assign({}, x)); if (pal[0] && _cl.look.accentColor) pal[0].hex = String(_cl.look.accentColor).toLowerCase(); payload.palette = pal.length ? pal : null; }
    if (_cl.applies === 'some') {
      if (_cl.editing && !_cl.pick.has(_cl.editing)) delete streams[_cl.editing];
      _cl.pick.forEach(fid => { streams[fid] = Object.assign({}, look); });
    } else Object.assign(payload, look, { accentSource: 'manual' });
    payload.streamLooks = streams;
    return payload;
}
async function clSave() {
  if (!_cl || _cl.busy || !clAdmin()) return;
  /* ROUND 6: while another admin exists, the button sends the change for approval instead (clPropose) */
  if (clYesNeeded()) return clProposeOpen();
  const btn = document.getElementById('cl-save'); _cl.busy = true;
  if (btn && typeof busySet === 'function') busySet(btn, i18t('cl_saving'));
  try {
    const payload = clPayload();
    await saveOrgBranding(payload);
    clLookChangesLoad().then(() => clRepaint());
    toast(i18t(_cl.applies === 'some' ? 'cl_saved_streams' : 'cl_saved'), 'ok');
    clInit(); clRepaint();
  } catch (e) { toast((e && e.message) || i18t('cl_save_failed'), 'err'); _cl.busy = false; if (btn) { btn.disabled = false; btn.textContent = i18t('act_save'); } }
}
function clGo() { if (typeof refreshOrgBranding === 'function') Promise.all([refreshOrgBranding(), clLookChangesLoad()]).then(() => { clInit(); clRepaint(); }).catch(() => {}); clInit(); if (typeof settingsGoPage === 'function') settingsGoPage('look'); }
if (typeof document !== 'undefined' && !window._clWired) {
  window._clWired = true;
  /* round 6: the note's sheet: its black act sends (the form lives in the dialog, outside the page) */
  document.addEventListener('submit', e => {
    const f = e.target; if (!f || f.id !== 'cl-ap-form') return; e.preventDefault();
    const go = f.querySelector('[data-cl-ap-go]'); if (!go) return;
    const [k, id] = String(go.getAttribute('data-cl-ap-go')).split(':'); const n = f.querySelector('#cl-ap-note');
    clApDo(k, id, n ? n.value : '');
  });
  document.addEventListener('click', e => {
    const t = e.target; if (!t || !t.closest) return;
    if (!_cl && t.closest('[data-cl-hist-go]')) { clHistGo(t.closest('[data-cl-hist-go]').getAttribute('data-cl-hist-go')); return; }
    if (!_cl) return;
    /* a menu (the preview's contract, the stream being edited) closes on a press anywhere but inside it */
    if (!t.closest('.cl-ls-chipw')) clMenuClose();
    /* round 6: a Needs-you or Settings row onto a waiting look change (stNeedsAll's door) */
    const hg = t.closest('[data-cl-hist-go]'); if (hg) { clHistGo(hg.getAttribute('data-cl-hist-go')); return; }
    if (!t.closest('[data-st-pg="look"]')) return;
    const at = sel => t.closest(sel);
    let x;
    if ((x = at('[data-cl-menu]'))) {
      const m = document.querySelector(`[data-st-pg="look"] [data-cl-menu-of="${x.getAttribute('data-cl-menu')}"]`); if (!m) return;
      const open = m.hidden; clMenuClose(); m.hidden = !open; x.setAttribute('aria-expanded', open ? 'true' : 'false'); return;
    }
    if ((x = at('[data-cl-tab]'))) { const k = x.getAttribute('data-cl-tab'); _cl.tab = ['who', 'kit', 'history'].includes(k) ? k : 'page'; _cl.mode = 'page'; return clRepaint(); }
    /* round 6: History's chips, menus, rows and acts */
    if ((x = at('[data-cl-chip="h-all"]'))) { _cl.histChip = 'all'; _cl.histWho = null; _cl.histPart = null; return clRepaint(); }
    if ((x = at('[data-cl-chip="h-wait"]'))) { _cl.histChip = 'wait'; return clRepaint(); }
    if ((x = at('[data-cl-hist-who]'))) { _cl.histWho = x.getAttribute('data-cl-hist-who') || null; clMenuClose(); return clRepaint(); }
    if ((x = at('[data-cl-hist-part]'))) { _cl.histPart = x.getAttribute('data-cl-hist-part') || null; clMenuClose(); return clRepaint(); }
    if ((x = at('[data-cl-ap]'))) { const [k, id] = String(x.getAttribute('data-cl-ap')).split(':'); return k === 'back' ? clApNoteOpen('back', id) : clApDo(k, id, ''); }
    if ((x = at('[data-cl-hist-pick]')) || ((x = at('tr[data-cl-hist]')) && !at('button,a,input'))) {
      const id = x.getAttribute('data-cl-hist-pick') || x.getAttribute('data-cl-hist'); _cl.histPick = _cl.histPick === id && !x.hasAttribute('data-cl-hist-pick') ? null : id;
      document.querySelectorAll('#cl-hist tr[data-cl-hist]').forEach(tr => tr.classList.toggle('is-chosen', tr.getAttribute('data-cl-hist') === _cl.histPick));
      if (typeof window.stLsPanelPaint === 'function') window.stLsPanelPaint(); return;
    }
    if ((x = at('[data-cl-chip]'))) { const k = x.getAttribute('data-cl-chip'); if (_cl.tab === 'who') { _cl.whoChip = k; _cl.whoPick = null; } else _cl.chip = k; return clRepaint(); }
    if ((x = at('[data-cl-pv]'))) { _cl.pv = x.getAttribute('data-cl-pv'); _cl.pvPage = 1; _cl.row = null; return clRepaint(); }
    if ((x = at('[data-cl-pv-page]'))) { _cl.pvPage = Number(x.getAttribute('data-cl-pv-page')) || 1; return clPvShow(); }
    if ((x = at('[data-cl-pin]'))) return clRowChoose(x.getAttribute('data-cl-pin'));
    if ((x = at('[data-cl-mode]'))) { _cl.mode = x.getAttribute('data-cl-mode'); return clRepaint(); }
    if ((x = at('tr[data-cl-part]')) && !at('button,a,input')) return clRowChoose(x.getAttribute('data-cl-part'));
    if ((x = at('tr[data-cl-who]')) && !at('button,a,input')) {
      const k = x.getAttribute('data-cl-who'); _cl.whoPick = _cl.whoPick === k ? null : k;
      document.querySelectorAll('#cl-who tr[data-cl-who]').forEach(tr => tr.classList.toggle('is-chosen', tr.getAttribute('data-cl-who') === _cl.whoPick));
      if (typeof window.stLsPanelPaint === 'function') window.stLsPanelPaint(); return;
    }
    if (at('[data-cl-others]')) { const o = document.getElementById('cl-others'); if (o && typeof landOn === 'function') landOn(o, { block: 'start' }); else if (o) o.scrollIntoView({ block: 'start' }); return; }
    if (!clAdmin()) return;
    if ((x = at('[data-cl-design]'))) return clSet(() => { const d = docDesignById(x.getAttribute('data-cl-design')); _cl.look.designId = d.id; _cl.look.logoPosition = null;
      if (typeof structureBlockedReason === 'function' && structureBlockedReason(d.id, _cl.look.structureId)) _cl.look.structureId = DEFAULT_STRUCTURE; });
    if ((x = at('[data-cl-structure]'))) return clSet(() => { _cl.look.structureId = x.getAttribute('data-cl-structure'); });
    if ((x = at('[data-cl-pos]'))) return clSet(() => { _cl.look.logoPosition = x.getAttribute('data-cl-pos'); });
    if ((x = at('[data-cl-accent]'))) return clSet(() => { _cl.look.accentColor = x.getAttribute('data-cl-accent'); if (!_cl.editing && _cl.palette && _cl.palette[0]) _cl.palette[0].hex = _cl.look.accentColor.toLowerCase(); });
    /* round 2: the header's place and fields, the page numbers' place and words, the footer's fields */
    /* round 4: the brand kit's presses */
    if ((x = at('[data-cl-kit-up]'))) { const f = document.getElementById(x.getAttribute('data-cl-kit-up') === 'black' ? 'cl-kit-black-file' : 'cl-kit-colour-file'); if (f) f.click(); return; }
    if ((x = at('[data-cl-kit-x]'))) return clSet(() => { if (x.getAttribute('data-cl-kit-x') === 'black') _cl.logoBlackUrl = null; else _cl.logoUrl = null; });
    if ((x = at('[data-cl-kit-font]'))) return clSet(() => { const [k, v] = x.getAttribute('data-cl-kit-font').split(':'); clMarksSet({ [k]: v || null }); });
    if ((x = at('[data-cl-kit-fix]'))) return clSet(() => { const i = Number(x.getAttribute('data-cl-kit-fix')), c = _cl.palette[i]; if (!c) return; c.hex = clNearestPassing(c.hex); if (i === 0) _cl.look.accentColor = c.hex; });
    if ((x = at('[data-cl-kit-del]'))) return clSet(() => { _cl.palette.splice(Number(x.getAttribute('data-cl-kit-del')), 1); });
    if (at('[data-cl-kit-add]')) return clSet(() => { if ((_cl.palette || []).length < 4) { if (!_cl.palette.length) _cl.palette.push({ name: '', hex: (_cl.look.accentColor || CL_ACCENTS[7][0]).toLowerCase(), use: '' }); else _cl.palette.push({ name: '', hex: CL_ACCENTS[7][0], use: '' }); } });
    /* round 3: the signature block's layout and lines, the cover page on or off and whether it is counted */
    if ((x = at('[data-cl-sglay]'))) return clSet(() => { clMarksSet({ sigLayout: x.getAttribute('data-cl-sglay') }); });
    if ((x = at('[data-cl-sgline]'))) return clSet(() => { const k = x.getAttribute('data-cl-sgline'), on = clMarks().sigLines || [];
      clMarksSet({ sigLines: on.includes(k) ? on.filter(y => y !== k) : on.concat(k) }); });
    if ((x = at('[data-cl-lang]'))) return clSet(() => { clMarksSet({ furnLang: x.getAttribute('data-cl-lang') || null }); });
    if ((x = at('[data-cl-cvon]'))) return clSet(() => { clMarksSet({ coverOn: x.getAttribute('data-cl-cvon') === 'on' }); _cl.pvPage = 1; });
    if ((x = at('[data-cl-cvcount]'))) return clSet(() => { clMarksSet({ coverCounts: x.getAttribute('data-cl-cvcount') === 'yes' }); });
    if ((x = at('[data-cl-hpos]'))) return clSet(() => { clMarksSet({ headerPos: x.getAttribute('data-cl-hpos') || null }); });
    if ((x = at('[data-cl-npos]'))) return clSet(() => { clMarksSet({ pageNumPos: x.getAttribute('data-cl-npos') || null }); });
    if ((x = at('[data-cl-nfmt]'))) return clSet(() => { clMarksSet({ pageNumFmt: x.getAttribute('data-cl-nfmt') }); });
    if ((x = at('[data-cl-hfield]'))) return clSet(() => { const f = x.getAttribute('data-cl-hfield'), mk = clMarks(), hs = clFieldsSplit(mk.headerText);
      const fields = hs.fields.includes(f) ? hs.fields.filter(y => y !== f) : hs.fields.concat(f);
      clMarksSet({ headerText: clFieldsJoin(fields, hs.words), headerPos: mk.headerPos || 'left' }); });
    if ((x = at('[data-cl-ffield]'))) return clSet(() => { const f = x.getAttribute('data-cl-ffield'), fs = clFieldsSplit(_cl.footer);
      _cl.footer = clFieldsJoin(fs.fields.includes(f) ? fs.fields.filter(y => y !== f) : fs.fields.concat(f), fs.words).slice(0, 500); });
    if (at('[data-cl-logo]')) { const f = document.getElementById('cl-logo-file'); if (f) f.click(); return; }
    if (at('[data-cl-logo-x]')) return clSet(() => { _cl.logoUrl = null; });
    if (at('[data-cl-company]')) { if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'company'); return; }
    if (at('[data-cl-add-stream]')) { _cl.applies = 'some'; _cl.mode = 'a'; return clRepaint(); }
    if ((x = at('[data-cl-edit-as]'))) { clMenuClose(); return clEditAs(x.getAttribute('data-cl-edit-as')); }
    if ((x = at('[data-cl-stream-edit]'))) { const fid = x.getAttribute('data-cl-stream-edit'); _cl.look = clLookOf(_cl.streams[fid]); _cl.applies = 'some'; _cl.pick = new Set([fid]); _cl.editing = fid; _cl.mode = 'page'; _cl.tab = 'page'; return clRepaint(); }
    if ((x = at('[data-cl-stream-x]'))) return clSet(() => { delete _cl.streams[x.getAttribute('data-cl-stream-x')]; });
    if ((x = at('[data-cl-paper-x]'))) {
      const id = x.getAttribute('data-cl-paper-x');
      (async () => { try { await api(`templates/${encodeURIComponent(id)}/look`, 'PUT', {}); await refreshOrgBranding(); toast(i18t('cl_paper_back'), 'ok'); clRepaint(); } catch (er) { toast(er.message, 'err'); } })();
      return;
    }
    if (at('#cl-save')) return clSave();
  });
  document.addEventListener('change', e => {
    const t = e.target; if (!_cl || !t || !t.closest || !t.closest('[data-st-pg="look"]') || !clAdmin()) return;
    if (t.name === 'cl-applies') return clSet(() => { _cl.applies = t.value; if (t.value === 'all') { _cl.pick = new Set(); } });
    if (t.hasAttribute('data-cl-stream')) return clSet(() => { const fid = t.getAttribute('data-cl-stream'); if (t.checked) _cl.pick.add(fid); else _cl.pick.delete(fid); });
    /* round 4: a colour's name, hex and use; the two logo files */
    if (t.hasAttribute('data-cl-kit-name') || t.hasAttribute('data-cl-kit-use') || t.hasAttribute('data-cl-kit-hex')) return clSet(() => {
      const i = Number(t.getAttribute('data-cl-kit-name') || t.getAttribute('data-cl-kit-use') || t.getAttribute('data-cl-kit-hex')), c = _cl.palette[i]; if (!c) return;
      if (t.hasAttribute('data-cl-kit-name')) c.name = String(t.value || '').slice(0, 40);
      else if (t.hasAttribute('data-cl-kit-use')) c.use = String(t.value || '').slice(0, 60);
      else { const v = String(t.value || '').trim().toLowerCase(), h = v.startsWith('#') ? v : '#' + v; if (/^#[0-9a-f]{6}$/.test(h)) { c.hex = h; if (i === 0) _cl.look.accentColor = h; } }
    });
    if ((t.id === 'cl-kit-colour-file' || t.id === 'cl-kit-black-file') && t.files && t.files[0]) {
      const f = t.files[0]; if (f.size > 500 * 1024) { toast(i18t('cl_logo_big'), 'warn'); return; }
      const black = t.id === 'cl-kit-black-file', r = new FileReader();
      r.onload = () => clSet(() => { if (black) _cl.logoBlackUrl = String(r.result || ''); else _cl.logoUrl = String(r.result || ''); }); r.readAsDataURL(f); return;
    }
    if (t.id === 'cl-footer') return clSet(() => { _cl.footer = clFieldsJoin(clFieldsSplit(_cl.footer).fields, String(t.value || '').replace(/[{}]/g, '')).slice(0, 500); });
    if (t.id === 'cl-head-words') return clSet(() => { const mk = clMarks(), hs = clFieldsSplit(mk.headerText), w = String(t.value || '').replace(/[{}]/g, '');
      clMarksSet({ headerText: clFieldsJoin(hs.fields, w), headerPos: mk.headerPos || (w.trim() ? 'left' : null) }); });
    if (t.id === 'cl-logo-file' && t.files && t.files[0]) {
      const f = t.files[0]; if (f.size > 500 * 1024) { toast(i18t('cl_logo_big'), 'warn'); return; }
      const r = new FileReader(); r.onload = () => clSet(() => { _cl.logoUrl = String(r.result || ''); }); r.readAsDataURL(f);
    }
  });
  document.addEventListener('keydown', e => {
    const t = e.target; if (!_cl || !t || !t.closest || !t.closest('[data-st-pg="look"]')) return;
    if (e.key === 'Escape' && document.querySelector('[data-st-pg="look"] .cl-menu:not([hidden])')) { clMenuClose(); e.stopPropagation(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && t.matches('tr[data-cl-part], tr[data-cl-who]')) { e.preventDefault(); t.click(); }
  });
  document.addEventListener('submit', e => {
    const f = e.target; if (!_cl || !f || f.id !== 'cl-ask') return; e.preventDefault(); if (!clAdmin()) return;
    const inp = document.getElementById('cl-say'); const text = inp ? inp.value : '';
    const { got, said, notes } = clReadLook(text);
    const more = (notes || []).length ? ' ' + notes.join(' ') : '';
    if (!said.length) { const s = document.getElementById('cl-said'); if (s) s.textContent = more ? more.trim() : i18t('cl_said_none'); return; }
    clSet(() => { const pm = got.pageMarks; delete got.pageMarks; Object.assign(_cl.look, got); if (pm) clMarksSet(pm); if (got.accentColor && !_cl.editing && _cl.palette && _cl.palette[0]) _cl.palette[0].hex = String(got.accentColor).toLowerCase(); _cl.said = ''; });
    const s = document.getElementById('cl-said'); if (s) s.textContent = i18t('cl_said_done', { what: said.join(', ') }) + more;
  });
}

Object.assign(window, { openDesignStep, dsApplyZoom, designStepOpen, designStepDirty, designStepClose, CL_ACCENTS, clPageHtml, clReadLook, clGo, clSave, clInit, clFacts, clModeGo,
  clAfterPaint, clPanelFacts, clLetGo, clParts, clQuality, clContrastOnWhite, clWhoRows, clHistGo, clLookChanges, clChangeParts, clLookChangesLoad,
  lookSaveOrSend });
