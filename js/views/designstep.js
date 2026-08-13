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
    saveDefault: !(org && org.designId),   // the first design IS the company standard (decision 1)
    posTouched: !!(org && org.designId),   // a saved default's position is a choice; keep it across design switches
    /* A saved default's LAYOUT is a choice too, and one made deliberately —
       so a workspace that already has a design keeps the right to be told when
       a style switch takes that layout away. A first-time design has no such
       choice behind it yet. */
    structureTouched: !!(org && org.designId),
    changeNote: '', onBack: opts.onBack || null,
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
  dsPaint({ resetScroll: true });
}

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
  wrap.style.setProperty('--ds-zoom', fit.toFixed(3));
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
  const CARD = 'background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:16px';
  const INP = 'width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;padding:7px 10px;font:inherit;font-size:12.5px;outline:none';
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
      border-radius:12px;padding:${sel ? '11px 13px' : '12px 14px'};margin-bottom:8px">
      <span style="display:flex;align-items:center;gap:9px">
        ${extra || ''}
        <span style="flex:1;min-width:0">
          <b style="font-size:12.5px">${esc(o.name)}</b>
          ${o.blockedWhy ? '<span style="font-size:9.5px;color:var(--color-neutral-500)"> · unavailable</span>' : ''}
        </span>
        ${sel ? `<span class="badge" style="background:var(--color-accent-700);color:#fff;font-size:9px">${i18t('ds_selected')}</span>` : ''}
      </span>
      <span style="display:block;font-size:10.5px;color:var(--color-neutral-600);line-height:1.45;margin-top:3px">${esc(o.blurb)}</span>
      <span style="display:block;font-size:9.5px;color:var(--color-neutral-500);margin-top:3px">${i18t('ds_best_for',{what:esc(o.bestFor)})}</span>
    </button>`;

  /* A miniature of the page each structure builds. Drawn in CSS rather than
     shipped as images: a layout thumbnail that cannot go stale is worth more
     than one that looks nicer. */
  const RULE = 'var(--color-neutral-300)';
  const bar = (w, mt) => `<span style="display:block;height:2px;border-radius:1px;background:${RULE};width:${w};${mt ? 'margin-top:' + mt : ''}"></span>`;
  const wire = id => {
    const box = inner => `<span style="flex:none;width:30px;height:40px;border:1px solid var(--color-divider);
      border-radius:3px;background:var(--color-doc-surface);padding:3px;display:flex;flex-direction:column;
      gap:2px;overflow:hidden">${inner}</span>`;
    if (id === 'margin-numbers') return box(
      [0, 1, 2].map(() => `<span style="display:flex;gap:2px"><span style="flex:none;width:4px;height:4px;border-radius:1px;background:var(--color-accent-700)"></span><span style="flex:1">${bar('100%')}${bar('70%', '2px')}</span></span>`).join(''));
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
      border-radius:10px;padding:${sel ? '8px 9px' : '9px 10px'}">
      <b style="display:block;font-size:11.5px">${esc(label)}</b>
      <span style="display:block;font-size:9.5px;color:var(--color-neutral-600);line-height:1.4;margin-top:3px">${esc(sub)}</span>
    </button>`;
  };
  const contentsChoice = `
    <div style="margin:0 0 13px;padding:0 0 13px;border-bottom:1px solid var(--color-divider)">
      <div style="font-family:var(--font-heading);font-size:10px;font-weight:800;letter-spacing:.09em;
        text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:7px">Contents page</div>
      <div style="display:flex;gap:7px;align-items:stretch">
        ${contentsBtn(false, 'Not included', 'Opens on the first clause.')}
        ${contentsBtn(true, 'At the front', 'Built from the clause headings.')}
      </div>
      <p style="font-size:9.5px;color:var(--color-neutral-500);line-height:1.45;margin:7px 0 0">
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
      border-radius:9px;padding:8px 10px;font-size:10.5px;line-height:1.5;margin:2px 0 10px">
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
    return `<button data-ds-pos="${p}" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${sel ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">${label}</button>`;
  }).join('');

  /* The colour control is ALWAYS drawn, on every design. It used to appear only
     on designs that display an accent, which meant a customer sitting on a
     monochrome design could not find the control at all — the colour is a
     company fact, set once, not a property of whichever design is on screen. */
  const ACCENT_PRESETS = [
    ['#0f766e', 'Teal'], ['#004c78', 'Navy'], ['#1e3a8a', 'Royal blue'],
    ['#1f5d3a', 'Forest'], ['#8e3550', 'Claret'], ['#9a4a1f', 'Rust'],
    ['#5b3a6e', 'Aubergine'], ['#37474f', 'Slate'],
  ];
  const accentNow = b.accentColor || '#37474f';
  const swatches = ACCENT_PRESETS.map(([hex, name]) => `
    <button data-ds-swatch="${hex}" title="${name}" aria-label="${name}" style="width:23px;height:23px;border-radius:6px;
      cursor:pointer;padding:0;background:${hex};border:1px solid rgba(0,0,0,.18);
      ${hex.toLowerCase() === accentNow.toLowerCase() ? 'box-shadow:0 0 0 2px var(--color-surface),0 0 0 4px var(--accent-solid)' : ''}"></button>`).join('');
  const rawPick = _ds.accentRaw || null;
  const darkened = !!(rawPick && accentLegible(rawPick) && accentLegible(rawPick).toLowerCase() !== rawPick.toLowerCase());
  const accentRow = `
    <div style="margin-top:14px">
      <span style="display:block;font-size:11px;font-weight:600;margin-bottom:5px">${i18t('ds_accent_colour')}</span>
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <button data-ds-accentsrc="logo" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${b.accentSource !== 'manual' ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">${i18t('ds_from_logo')}</button>
        <button data-ds-accentsrc="manual" class="ui-btn" style="font-size:10.5px;padding:3px 10px;${b.accentSource === 'manual' ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff;font-weight:700' : ''}">${i18t('ds_pick_my_own')}</button>
        <span style="display:inline-block;width:15px;height:15px;border-radius:4px;background:${accentNow};border:1px solid var(--color-divider)" title="${esc(accentNow)}"></span>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:9px">${swatches}</div>
      <div style="display:flex;gap:7px;align-items:center;margin-top:9px">
        <input type="color" id="ds-accent" value="${accentNow}" aria-label="${i18t('ds_choose_colour')}"
          style="width:30px;height:28px;border:1px solid var(--color-divider);border-radius:5px;padding:2px;background:var(--color-surface);cursor:pointer">
        <input id="ds-accent-hex" value="${esc((rawPick || accentNow).toUpperCase())}" maxlength="7" spellcheck="false" aria-label="${i18t('ds_brand_hex')}"
          style="width:92px;font-family:var(--font-code);font-size:11.5px;text-transform:uppercase;border:1px solid var(--color-divider);
          background:var(--color-surface);color:var(--color-text);border-radius:5px;padding:5px 8px;outline:none">
      </div>
      ${!design.usesAccent ? `<div style="font-size:10px;line-height:1.5;margin-top:8px;padding:6px 8px;border-radius:7px;
        background:var(--st-amber-bg,#fef3c7);border:1px solid var(--st-amber-line,#fcd34d);color:var(--st-amber-fg,#b45309)">
        Saved, but <b>${esc(design.name)}</b> is monochrome — this colour will not appear on the document. It shows in Modern Minimal, Bold Corporate, Modern Editorial and Facing Parties.</div>` : ''}
      ${darkened ? `<div style="font-size:10px;line-height:1.5;margin-top:8px;padding:6px 8px;border-radius:7px;
        background:var(--st-amber-bg,#fef3c7);border:1px solid var(--st-amber-line,#fcd34d);color:var(--st-amber-fg,#b45309)">
        ${esc(rawPick.toUpperCase())} is too light to read as a rule or a band on white paper, so it is darkened to <b>${esc(accentNow.toUpperCase())}</b>${i18t('ds_hue_unchanged')}</div>`
      : design.usesAccent ? `<div style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin-top:6px">${
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
    const pill = (n, label, state) => `<span style="display:flex;align-items:center;gap:7px;padding:4px 13px 4px 5px;
      border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap;${
        state === 'on' ? 'background:var(--color-accent-100);color:var(--color-accent-700)'
        : state === 'done' ? 'color:var(--color-good-fg,#047857)'
        : 'color:var(--color-neutral-500)'}">
      <span style="width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:800;flex:none;${
        state === 'on' ? 'background:var(--accent-solid);color:#fff'
        : state === 'done' ? 'background:var(--st-green-bg);color:var(--st-green-fg);border:1px solid var(--st-green-line)'
        : 'background:var(--color-neutral-100);color:var(--color-neutral-500)'}">${state === 'done' ? '&check;' : n}</span>${label}</span>`;
    const sep = '<span style="width:14px;height:1px;background:var(--color-divider);flex:none"></span>';
    return `<div style="margin-left:auto;display:flex;align-items:center;background:var(--color-surface);
      border:1px solid var(--color-divider);border-radius:999px;padding:3px;flex:none">
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
        box-shadow:var(--shadow-md);border-radius:4px;padding:30px 36px;width:${DS_PAGE_W}px;
        margin:0 auto;${docDesignPaperStyle(b)}">
        ${docDesignHeaderHtml(b, dsPreviewContract(), { bleedX: 36, bleedY: 30 })}
        <article class="doc-surface" style="background:transparent"><div class="hati-doc">${dsPreviewBody()}</div></article>
        ${docDesignFooterHtml(b, dsPreviewContract())}
      </div>
    </div>`;

  const rh = railHead();
  const stepAction = step === 1
    ? `<button id="ds-next" class="ui-btn ui-btn-primary" style="width:100%;font-size:13px;padding:8px">
         Next: choose a structure ${icon('arrowRight', 'w-3.5 h-3.5')}</button>
       <p style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0;text-align:center">${publish ? i18t('ds_step_2_then_publish') : i18t('ds_step_2_then_save')}</p>`
    : publish
      ? `<button id="ds-publish" class="ui-btn ui-btn-primary" style="width:100%;font-size:13px;padding:8px">Publish v${_ds.versionNumber}</button>
         <p style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0">Publishing freezes this version forever and makes it what the whole team creates contracts from. Contracts already created from earlier versions are not touched.</p>`
      : `<button id="ds-save" class="ui-btn ui-btn-primary" style="width:100%;font-size:13px;padding:8px">${i18t('ds_save_design')}</button>
         <p style="font-size:10px;color:var(--color-neutral-500);line-height:1.5;margin:7px 0 0">${i18t('ds_applies_future')}</p>`;

  document.getElementById('content').innerHTML = `
  <div class="view-enter ds-page${_ds.focus ? ' ds-focus' : ''}" style="${VIEW};padding:12px 16px 14px;display:flex;flex-direction:column;gap:11px">
    <div style="flex:none;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button id="ds-back" class="ui-btn" style="font-size:11.5px;padding:4px 10px">${icon('arrowLeft', 'w-3.5 h-3.5')} ${
        step === 2 ? 'Back to style' : (publish ? 'Back to builder' : 'Back to settings')}</button>
      <h3 style="margin:0;font-family:var(--font-heading);font-size:15.5px;font-weight:700">Design${publish ? ` — publish ${esc(_ds.templateName)} v${_ds.versionNumber}` : ' — your company standard'}</h3>
      <span style="font-size:11px;color:var(--color-neutral-600)">${step === 1
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
          <div data-ds-step="${rh.n}" style="display:flex;align-items:center;gap:7px;font-family:var(--font-heading);font-size:11px;
            font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--color-accent-700)">
            <span style="width:17px;height:17px;border-radius:50%;background:var(--accent-solid);color:#fff;
              display:grid;place-items:center;font-size:9.5px;font-weight:800">${rh.n}</span> ${i18t('ds_step_n_of_2',{n:rh.n})}</div>
          <h4 data-ds-step-title style="font-family:var(--font-heading);font-size:15px;margin:6px 0 3px;letter-spacing:-.015em">${rh.title}</h4>
          <p style="font-size:10.5px;color:var(--color-neutral-500);line-height:1.45;margin:0">${rh.hint}</p>
        </div>
        <div id="ds-rail" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:11px 13px 14px">
          ${step === 1 ? designCards : contentsChoice + structureCards + blockNote}
        </div>
      </section>`}

      <!-- The document on its own canvas, whole and centred. -->
      <section style="${PANE}">
        <div style="flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--color-divider)">
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-text)">${esc(design.name)}</span>
          <span style="color:var(--color-neutral-400);font-size:11px">×</span>
          <span class="badge" style="background:var(--color-neutral-100);color:var(--color-text);${step === 1 ? 'opacity:.5' : ''}">${esc(structure.name)}</span>
          ${''/* The contents page only speaks when it is ON. Off is the default
                 and the absence of a page — a chip reading "no contents page"
                 would be the strip announcing that nothing has happened. */}
          ${b.contents ? `<span class="badge" style="background:var(--color-neutral-100);color:var(--color-text);${step === 1 ? 'opacity:.5' : ''}">+ Contents</span>` : ''}
          <span style="flex:1"></span>
          <!-- The workbench's own controls, not lookalikes: one stored text-size
               preference shared with the Doc tab and the Redline canvas, so a
               size set here is the size there. -->
          ${window.rlTypeStepHtml ? rlTypeStepHtml() : ''}
          <button id="ds-focus" class="ui-btn" title="${_ds.focus ? 'Leave full screen' : 'Fill the screen with the document'}"
            aria-pressed="${_ds.focus ? 'true' : 'false'}"
            style="padding:4px 7px;${_ds.focus ? 'background:var(--color-accent-700);border-color:var(--color-accent-700);color:#fff' : ''}">
            ${icon('expand', 'w-3.5 h-3.5')}</button>
        </div>
        <div id="ds-docpane" class="scroll-thin" style="flex:1;min-height:0;padding:16px;
          background:var(--color-neutral-100);overflow:auto">${paper}</div>
        <div style="flex:none;padding:7px 14px;border-top:1px solid var(--color-divider);text-align:center;font-size:10.5px;color:var(--color-neutral-500)">
          ${publish ? 'Your live draft, not a sample' : 'A sample document, so the looks can be compared'}
        </div>
      </section>

      ${_ds.focus ? '' : `
      <section class="ds-rail-pane" style="${PANE}">
       <div class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto;padding:14px 16px">
        <h4 style="font-family:var(--font-heading);font-weight:600;font-size:12px;margin:0 0 10px;text-transform:uppercase;letter-spacing:.06em;color:var(--color-neutral-600)">${i18t('ds_company_branding')}</h4>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:86px;height:48px;border:1px dashed var(--color-divider);border-radius:8px;display:grid;place-items:center;overflow:hidden;background:var(--color-bg);flex:none">
            ${b.logoUrl ? `<img src="${b.logoUrl}" alt="logo" style="max-width:100%;max-height:100%">` : `<span style="font-size:9.5px;color:var(--color-neutral-500)">${i18t('tb_no_logo')}</span>`}
          </div>
          <div>
            <input type="file" id="ds-logo-file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style="display:none">
            <button id="ds-logo-btn" class="ui-btn" style="font-size:10.5px;padding:3px 9px">${icon('upload', 'w-3 h-3')} ${b.logoUrl ? 'Replace logo' : 'Upload logo'}</button>
            <span style="display:block;font-size:9.5px;color:var(--color-neutral-500);margin-top:3px">${i18t('ds_png_jpg')}</span>
          </div>
        </div>
        <div style="margin-top:14px">
          <span style="display:block;font-size:11px;font-weight:600;margin-bottom:5px">${i18t('ds_logo_position')}</span>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${posChips}</div>
        </div>
        ${accentRow}
        <div style="margin-top:14px;display:grid;gap:7px">
          <input id="ds-b-name" style="${INP}" placeholder="${i18t('tb_company_name')}" value="${esc(b.companyName)}">
          <input id="ds-b-reg" style="${INP}" placeholder="${i18t('tb_reg_number')}" value="${esc(b.registrationNumber)}">
          <input id="ds-b-addr" style="${INP}" placeholder="${i18t('tb_reg_address')}" value="${esc(b.address)}">
          <input id="ds-b-footer" style="${INP}" placeholder="Footer text (e.g. Registered in Kenya · C.123456)" value="${esc(b.footerText)}">
        </div>
        ${publish && step === 2 ? `
        <label style="display:block;margin-top:14px"><span style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">${i18t('ds_what_changed_why')}</span>
          <textarea id="ds-note" style="${INP};min-height:48px" maxlength="500" placeholder="e.g. Payment terms now offer 30/45/60 days">${esc(_ds.changeNote)}</textarea></label>
        <label style="display:flex;align-items:flex-start;gap:7px;margin-top:12px;font-size:11px;line-height:1.5;${_ds.orgHadDesign ? 'cursor:pointer' : 'opacity:.75'}">
          <input type="checkbox" id="ds-default" ${_ds.saveDefault ? 'checked' : ''} ${_ds.orgHadDesign ? '' : 'disabled'} style="margin-top:2px">
          <span>${_ds.orgHadDesign
            ? 'Also make this structure and style the company default for future contracts'
            : `<b>${i18t('ds_becomes_default')}</b> Your first design is saved as the standard — later contracts arrive already dressed in it.`}</span>
        </label>` : ''}
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
  return {
    logoUrl: b.logoUrl, companyName: b.companyName, registrationNumber: b.registrationNumber,
    address: b.address, defaultFooterText: b.footerText,
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
    await saveOrgBranding(dsOrgPayload());
    const design = _ds.saveDefault ? null
      : { designId: _ds.b.designId, structureId: _ds.b.structureId,
          logoPosition: _ds.b.logoPosition, accentColor: _ds.b.accentColor };
    const r = await api(`templates/${_ds.tid}/versions/${_ds.vid}/publish`, 'POST',
      { changeNote: _ds.changeNote.trim(), design });
    (r.warnings || []).forEach(w => toast(w, 'err'));
    const st = docStructureById(_ds.b.structureId);
    toast(`v${r.versionNumber} published in ${docDesignById(_ds.b.designId).name}${
      st && st.id !== DEFAULT_STRUCTURE ? ' · ' + st.name : ''} — the team can create contracts from it now`);
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
Object.assign(window, { openDesignStep, dsApplyZoom });
