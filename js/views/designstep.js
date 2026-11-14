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
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);height:var(--field-h);padding:0 var(--field-pad-x);font:inherit;font-size:var(--field-size);outline:none';
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
          style="width:92px;font-family:var(--font-code);border:1px solid var(--color-divider);background:var(--color-surface);color:var(--color-text);border-radius:var(--radius);outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
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
    if (_ds.mode !== 'publish') await saveOrgBranding(dsOrgPayload());
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
    await saveOrgBranding(dsOrgPayload());
    const st2 = docStructureById(_ds.b.structureId);
    toast(`${docDesignById(_ds.b.designId).name}${st2 && st2.id !== DEFAULT_STRUCTURE ? ' · ' + st2.name : ''} is now your company design`);
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
    logoPosition: o.logoPosition || null, accentColor: o.accentColor || null };
}
function clInit() {
  const org = window.ORG_BRANDING || {};
  _cl = { look: clLookOf(org), logoUrl: org.logoUrl || null, footer: org.footerText || org.defaultFooterText || '',
    streams: JSON.parse(JSON.stringify(window.ORG_STREAM_LOOKS || {})), applies: 'all', pick: new Set(), editing: null,
    mode: 'page', said: '', dirty: false, busy: false };
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
    logoUrl: _cl.logoUrl, footerText: _cl.footer }));
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
  if (m === 'f') return head(i18t('cl_n_footer')) + `<input type="text" id="cl-footer" class="cl-in" maxlength="500" value="${clE(_cl.footer)}" placeholder="${clE(i18t('ds_footer_placeholder'))}">`;
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
  return `<section class="cl-others" id="cl-others"><div class="cl-oh"><span>${clE(i18t('cl_others', { n }))}</span>${admin ? `<button type="button" class="cl-lnk" data-cl-add-stream>＋ ${clE(i18t('cl_add_stream'))}</button>` : ''}</div>
    ${n ? streams.concat(papers).join('') : `<p class="cl-q">${clE(i18t('cl_others_none'))}</p>`}
    <p class="cl-q cl-wins">${clE(i18t('cl_wins'))}</p></section>`;
}
function clChipsHtml() {
  const m = _cl.mode, n = Object.keys(_cl.streams).length + (window.ORG_PAPER_LOOKS || []).length;
  const chip = (k, t) => `<button type="button" class="cl-chip${m === k ? ' is-on' : ''}" data-cl-mode="${k}">${clE(t)}</button>`;
  const who = _cl.applies === 'some' ? i18t(_cl.pick.size === 1 ? 'cl_who_n1' : 'cl_who_n', { n: _cl.pick.size }) : i18t('cl_who_every');
  return `<div class="cl-chips">${chip('page', i18t('cl_chip_page'))}${chip('s', i18t('cl_chip_style', { name: clDesign().name }))}${chip('l', i18t('cl_chip_layout', { name: clStructure().name }))}${chip('a', i18t('cl_chip_who', { who }))}<button type="button" class="cl-chip" data-cl-others>${clE(i18t('cl_chip_others', { n }))}</button></div>`;
}
function clPageHtml() {
  if (!_cl) clInit();
  const admin = clAdmin(), page = _cl.mode === 'page';
  const editing = _cl.editing ? i18t('cl_editing_stream', { name: clStreamName(_cl.editing) }) : '';
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
}
function clSet(fn) { fn(); _cl.dirty = true; clRepaint(); }
/* A LOOK TYPED IN A SENTENCE, READ WITHOUT AI: colours, the logo's place, a style or a layout named; what is not read is said */
function clReadLook(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ', got = {}, said = [];
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
  return { got, said };
}
async function clSave() {
  if (!_cl || _cl.busy || !clAdmin()) return;
  const btn = document.getElementById('cl-save'); _cl.busy = true;
  if (btn && typeof busySet === 'function') busySet(btn, i18t('cl_saving'));
  try {
    const look = { designId: _cl.look.designId, structureId: _cl.look.structureId, logoPosition: _cl.look.logoPosition, accentColor: _cl.look.accentColor };
    const streams = JSON.parse(JSON.stringify(_cl.streams));
    const payload = { logoUrl: _cl.logoUrl, defaultFooterText: _cl.footer };
    if (_cl.applies === 'some') {
      if (_cl.editing && !_cl.pick.has(_cl.editing)) delete streams[_cl.editing];
      _cl.pick.forEach(fid => { streams[fid] = Object.assign({}, look); });
    } else Object.assign(payload, look, { accentSource: 'manual' });
    payload.streamLooks = streams;
    await saveOrgBranding(payload);
    toast(i18t(_cl.applies === 'some' ? 'cl_saved_streams' : 'cl_saved'), 'ok');
    clInit(); clRepaint();
  } catch (e) { toast((e && e.message) || i18t('cl_save_failed'), 'err'); _cl.busy = false; if (btn) { btn.disabled = false; btn.textContent = i18t('act_save'); } }
}
function clGo() { if (typeof refreshOrgBranding === 'function') refreshOrgBranding().then(() => { clInit(); clRepaint(); }).catch(() => {}); clInit(); if (typeof settingsGoPage === 'function') settingsGoPage('look'); }
if (typeof document !== 'undefined' && !window._clWired) {
  window._clWired = true;
  document.addEventListener('click', e => {
    const t = e.target; if (!_cl || !t || !t.closest || !t.closest('[data-st-pg="look"]')) return;
    const at = sel => t.closest(sel);
    let x;
    if ((x = at('[data-cl-mode]'))) { _cl.mode = x.getAttribute('data-cl-mode'); return clRepaint(); }
    if (at('[data-cl-others]')) { const o = document.getElementById('cl-others'); if (o && typeof landOn === 'function') landOn(o, { block: 'start' }); else if (o) o.scrollIntoView({ block: 'start' }); return; }
    if (!clAdmin()) return;
    if ((x = at('[data-cl-design]'))) return clSet(() => { const d = docDesignById(x.getAttribute('data-cl-design')); _cl.look.designId = d.id; _cl.look.logoPosition = null;
      if (typeof structureBlockedReason === 'function' && structureBlockedReason(d.id, _cl.look.structureId)) _cl.look.structureId = DEFAULT_STRUCTURE; });
    if ((x = at('[data-cl-structure]'))) return clSet(() => { _cl.look.structureId = x.getAttribute('data-cl-structure'); });
    if ((x = at('[data-cl-pos]'))) return clSet(() => { _cl.look.logoPosition = x.getAttribute('data-cl-pos'); });
    if ((x = at('[data-cl-accent]'))) return clSet(() => { _cl.look.accentColor = x.getAttribute('data-cl-accent'); });
    if (at('[data-cl-logo]')) { const f = document.getElementById('cl-logo-file'); if (f) f.click(); return; }
    if (at('[data-cl-logo-x]')) return clSet(() => { _cl.logoUrl = null; });
    if (at('[data-cl-company]')) { if (typeof openSettingsAt === 'function') openSettingsAt('platform', 'company'); return; }
    if (at('[data-cl-add-stream]')) { _cl.applies = 'some'; _cl.mode = 'a'; return clRepaint(); }
    if ((x = at('[data-cl-stream-edit]'))) { const fid = x.getAttribute('data-cl-stream-edit'); _cl.look = clLookOf(_cl.streams[fid]); _cl.applies = 'some'; _cl.pick = new Set([fid]); _cl.editing = fid; _cl.mode = 'page'; return clRepaint(); }
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
    if (t.id === 'cl-footer') return clSet(() => { _cl.footer = String(t.value || '').slice(0, 500); });
    if (t.id === 'cl-logo-file' && t.files && t.files[0]) {
      const f = t.files[0]; if (f.size > 500 * 1024) { toast(i18t('cl_logo_big'), 'warn'); return; }
      const r = new FileReader(); r.onload = () => clSet(() => { _cl.logoUrl = String(r.result || ''); }); r.readAsDataURL(f);
    }
  });
  document.addEventListener('submit', e => {
    const f = e.target; if (!_cl || !f || f.id !== 'cl-ask') return; e.preventDefault(); if (!clAdmin()) return;
    const inp = document.getElementById('cl-say'); const text = inp ? inp.value : '';
    const { got, said } = clReadLook(text);
    if (!said.length) { const s = document.getElementById('cl-said'); if (s) s.textContent = i18t('cl_said_none'); return; }
    clSet(() => { Object.assign(_cl.look, got); _cl.said = ''; });
    const s = document.getElementById('cl-said'); if (s) s.textContent = i18t('cl_said_done', { what: said.join(', ') });
  });
}

Object.assign(window, { openDesignStep, dsApplyZoom, designStepOpen, designStepDirty, designStepClose, CL_ACCENTS, clPageHtml, clReadLook, clGo, clSave, clInit });
