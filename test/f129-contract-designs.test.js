/* ============================================================
   f129 — contract designs (DESIGN-contract-designer.md)

   Five fixed document designs, a company default set once, the logo placed
   by choice, the accent colour taken from the logo. This file pins:

     · the catalogue: exactly five designs, stable ids, every id renders a
       header and a footer with the company's details escaped, not trusted
     · the accent pipeline is honest: greys and white never become a brand
       colour, an illegibly light colour is darkened before it is stored
     · only Formal Legal asks the paper for a border
     · the org branding route round-trips the design fields and refuses an
       unknown design, position or non-hex accent outright (400, not null)
     · a template published WITH a design stamps that design onto contracts
       created from it; without one, the company default is stamped
     · design writes stay manager-only (the viewer 403 of f101 still holds)
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const branding = require('../js/branding.js');

describe('f129 — the design catalogue and renderers (pure)', () => {
  const IDS = ['classic-letterhead', 'modern-minimal', 'formal-legal', 'bold-corporate', 'compact-executive',
    'modern-editorial', 'ceremonial', 'facing-parties'];

  test('exactly eight designs, stable ids, each with a default logo position the picker offers', () => {
    assert.deepEqual(branding.DOC_DESIGNS.map(d => d.id), IDS);
    for (const d of branding.DOC_DESIGNS)
      assert.ok(branding.DESIGN_LOGO_POSITIONS.includes(d.defaultLogoPos), d.id + ' default position is offerable');
  });

  test('normalize: an unknown designId reads as "no design chosen", never as a guess', () => {
    const b = branding.normalizeDesignBranding({ designId: 'gothic-castle', companyName: 'X' });
    assert.equal(b.designId, null);
    // and the org route's field name (defaultFooterText) lands in footerText
    const f = branding.normalizeDesignBranding({ designId: 'modern-minimal', defaultFooterText: 'Registered in Kenya' });
    assert.equal(f.footerText, 'Registered in Kenya');
    assert.equal(f.logoPosition, 'top-left', 'position defaults to the design’s own default');
  });

  test('every design renders a header carrying the company name — escaped, not trusted', () => {
    for (const id of IDS) {
      const b = branding.normalizeDesignBranding({ designId: id, companyName: 'Juhudi <script>alert(1)</script> Foods' });
      const h = branding.docDesignHeaderHtml(b, { counterparty: 'Kabras Sugar Ltd' });
      assert.ok(h.includes(`data-doc-design="${id}"`), id + ' announces itself');
      assert.ok(h.includes('Juhudi &lt;script&gt;'), id + ' escapes the company name');
      assert.ok(!h.includes('<script>'), id + ' lets no markup through');
    }
  });

  test('the footer carries the footer text, and the logo when the position says footer', () => {
    const png = 'data:image/png;base64,' + Buffer.from('x').toString('base64');
    const b = branding.normalizeDesignBranding({ designId: 'compact-executive', logoUrl: png,
      logoPosition: 'footer', footerText: 'Confidential' });
    const foot = branding.docDesignFooterHtml(b, {});
    assert.ok(foot.includes('Confidential'));
    assert.ok(foot.includes(png), 'footer position puts the logo in the footer');
    const head = branding.docDesignHeaderHtml(b, {});
    assert.ok(!head.includes('<img'), 'and therefore NOT in the header');
  });

  test('compact executive opens with the facts the contract actually states — and no box when it states none', () => {
    const b = branding.normalizeDesignBranding({ designId: 'compact-executive', companyName: 'J' });
    const with_ = branding.docDesignHeaderHtml(b, { counterparty: 'Kabras Sugar Ltd', expiry: '2027-06-30' });
    assert.ok(with_.includes('Kabras Sugar Ltd') && with_.includes('2027-06-30'));
    const without = branding.docDesignHeaderHtml(b, {});
    assert.ok(!without.includes('Counterparty'), 'an empty glance box does not render');
  });

  test('bold corporate bleeds only when told the paper’s padding; otherwise it stays inside it', () => {
    const b = branding.normalizeDesignBranding({ designId: 'bold-corporate', companyName: 'J', accentColor: '#c76b2e' });
    assert.ok(branding.docDesignHeaderHtml(b, {}, { bleedX: 36, bleedY: 30 }).includes('margin:-30px -36px'));
    assert.ok(!branding.docDesignHeaderHtml(b, {}).includes('margin:-'), 'no bleed given, no negative margins');
    assert.ok(branding.docDesignHeaderHtml(b, {}).includes('#c76b2e'), 'the band wears the accent');
  });

  test('only Formal Legal frames the page and only Modern Editorial rules its left edge; every design pins its accent', () => {
    for (const id of IDS) {
      const style = branding.docDesignPaperStyle(branding.normalizeDesignBranding({ designId: id, accentColor: '#1a7f6b' }));
      assert.ok(style.includes('--doc-design-accent:#1a7f6b;'), id + ' pins the accent custom property');
      if (id === 'formal-legal') assert.ok(/border:/.test(style));
      else assert.ok(!/border:/.test(style), id + ' asks for no full border');
      if (id === 'modern-editorial') assert.ok(/border-left:4px solid #1a7f6b/.test(style), 'the editorial rule wears the accent');
      else assert.ok(!/border-left/.test(style), id + ' asks for no left rule');
    }
    assert.equal(branding.docDesignPaperStyle(null), '');
  });

  test('the body typography rides an attribute the stylesheet keys on — and index.html styles every design', () => {
    const fs = require('node:fs');
    const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
    for (const id of IDS) {
      const attr = branding.docDesignPaperAttr(branding.normalizeDesignBranding({ designId: id }));
      assert.equal(attr, ` data-doc-body="${id}"`);
      /* THE CLAIM IS THAT EVERY DESIGN IS DRESSED, not the shape of the
         selector that dresses it. This pinned `[data-doc-body="x"] .doc-surface`
         as a literal and went red the day the rules learned to name the
         negotiate page's sheet as well — see f129 (9). Pin the relation. */
      assert.ok(new RegExp(`\\[data-doc-body="${id}"\\] [^,{]*\\.doc-surface`).test(html),
        id + ' has body-typography rules in index.html');
    }
    assert.equal(branding.docDesignPaperAttr(branding.normalizeDesignBranding({})), '', 'no design, no attribute — the legacy body is untouched');
    // the faces must survive print, where --font-doc is enforced with !important
    assert.match(html, /\[data-doc-body="classic-letterhead"\][^}]*font-family:Georgia[^}]*!important/s);
  });

  test('accent: greys and white are never a brand colour; a pale colour is darkened, not stored as-is', () => {
    // a 4x1 strip: white, mid-grey, and two pixels of a saturated orange
    const px = (r, g, b) => [r, g, b, 255];
    const strip = [...px(255, 255, 255), ...px(128, 128, 128), ...px(199, 107, 46), ...px(199, 107, 46)];
    // too few saturated pixels to call it a brand colour (threshold guards noise)
    assert.equal(branding.pickAccentFromPixels(strip), null);
    const many = [];
    for (let i = 0; i < 20; i++) many.push(...px(199, 107, 46), ...px(255, 255, 255), ...px(60, 60, 60));
    assert.equal(branding.pickAccentFromPixels(many), '#c76b2e');
    // an all-grey logo has no accent to offer — an honest null, not a grey
    const grey = [];
    for (let i = 0; i < 30; i++) grey.push(...px(120, 120, 120));
    assert.equal(branding.pickAccentFromPixels(grey), null);
    // legibility: a near-white yellow darkens; a dark teal passes untouched
    assert.notEqual(branding.accentLegible('#ffee88'), '#ffee88');
    assert.equal(branding.accentLegible('#0d5f58'), '#0d5f58');
    assert.equal(branding.accentLegible('nonsense'), null);
  });

  /* ---- the fringe defect ----
     A logo made of LETTERING is mostly edge: every stroke is a core of ink
     wrapped in pixels part-way to the paper behind it. Averaging the hue
     bucket whole therefore returned the ink diluted by its own anti-aliasing.
     Measured on a real customer wordmark, ink #004c78 came back #2b6b8e — a
     navy read as washed-out steel, on every contract that company sends. */
  test('a logo made of lettering returns its INK, not the ink blurred into the paper', () => {
    const ink = [0, 76, 120];                                   // the wordmark's actual navy
    const fringe = ink.map(v => Math.round(v + (255 - v) * 0.5)); // halfway to white
    const px = [];
    for (let i = 0; i < 10; i++) px.push(...ink, 255);           // a little core…
    for (let i = 0; i < 30; i++) px.push(...fringe, 255);        // …wrapped in a lot of edge
    assert.equal(branding.pickAccentFromPixels(px), '#004c78',
      'the fringe outnumbers the core three to one and must still not decide the colour');
  });

  test('a solid-block logo is left exactly where it was', () => {
    const solid = [];
    for (let i = 0; i < 40; i++) solid.push(199, 107, 46, 255);
    assert.equal(branding.pickAccentFromPixels(solid), '#c76b2e',
      'every pixel equally saturated — the subset is the whole, the answer does not move');
  });

  test('one anomalous pixel gets a vote, never a veto', () => {
    const fringe = [0, 76, 120].map(v => Math.round(v + (255 - v) * 0.5));
    const px = [];
    for (let i = 0; i < 40; i++) px.push(...fringe, 255);
    px.push(0, 80, 255, 255);                                    // a lone compression artefact
    const got = branding.pickAccentFromPixels(px);
    assert.notEqual(got, '#0050ff', 'a single stray pixel must not become the brand colour');
    assert.ok(/^#[0-9a-f]{6}$/.test(got), 'and something honest still comes back');
  });

  test('the cover page for a raw upload names the document and admits the layout below is untouched', () => {
    const b = branding.normalizeDesignBranding({ designId: 'classic-letterhead', companyName: 'Juhudi Foods Ltd' });
    const cover = branding.docDesignCoverPageHtml(b, { name: 'Warehousing Agreement', id: 'MK-140',
      counterparty: 'Siginon Group', status: 'Under Review', upload: { fileName: 'warehousing.pdf' } });
    assert.ok(cover.includes('Warehousing Agreement'));
    assert.ok(cover.includes('warehousing.pdf'));
    assert.ok(cover.includes('page-break-after:always'), 'the original starts on its own page');
    assert.ok(/unchanged/.test(cover), 'the honesty note is on the cover');
  });
});

describe('f129 — the design travels: org route, publish override, contract stamp', () => {
  let h, w, viewer;
  const png = 'data:image/png;base64,' + Buffer.from('not-a-real-png').toString('base64');

  before(async () => {
    h = await startHati();
    w = await seedWorkspace(h);
    await w.admin.json('/api/users', { method: 'POST', body: {
      name: 'Read Only', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    viewer = h.client('viewer');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  });
  after(async () => { await h.stop(); });

  test('the org branding route round-trips the design fields and records who set them', async () => {
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      logoUrl: png, companyName: 'Highland Corporate Ltd', registrationNumber: 'C.123456',
      address: 'Riverside Drive, Nairobi', defaultFooterText: 'Registered in Kenya',
      designId: 'modern-minimal', logoPosition: 'top-left', accentColor: '#1a7f6b', accentSource: 'logo' } });
    const b = (await viewer.json('/api/org/branding')).branding;
    assert.equal(b.designId, 'modern-minimal');
    assert.equal(b.logoPosition, 'top-left');
    assert.equal(b.accentColor, '#1a7f6b');
    assert.equal(b.accentSource, 'logo');
    assert.ok(b.setBy, 'the profile records who set the design');
  });

  test('an unknown design, position or non-hex accent is a 400 — the client offering it is broken', async () => {
    for (const body of [
      { designId: 'gothic-castle' },
      { designId: 'modern-minimal', logoPosition: 'sideways' },
      { designId: 'modern-minimal', accentColor: 'reddish' },
    ]) {
      const r = await w.admin.raw('/api/org/branding', { method: 'PUT', body: { companyName: 'X', ...body } });
      assert.equal(r.status, 400, JSON.stringify(body) + ' must be refused');
    }
    const vb = await viewer.raw('/api/org/branding', { method: 'PUT', body: { designId: 'modern-minimal' } });
    assert.equal(vb.status, 403, 'design writes stay manager-only');
  });

  async function publishTemplate(design) {
    const r = await w.admin.json('/api/templates', { method: 'POST', body: { name: 'Supply Agreement', category: 'procurement' } });
    const detail = await w.admin.json('/api/templates/' + r.template.id);
    const vid = detail.versions[0].id;
    await w.admin.json(`/api/templates/${r.template.id}/versions/${vid}`, { method: 'PUT', body: {
      blocks: [
        { orderIndex: 0, blockType: 'heading', content: 'Supply Agreement' },
        { orderIndex: 1, blockType: 'field_group', content: 'This agreement is made with {{supplier_name}}.' },
        { orderIndex: 2, blockType: 'signature_block', content: 'Company' },
      ],
      fields: [{ fieldKey: 'supplier_name', label: 'Supplier name', fieldType: 'short_text', required: true }] } });
    const pub = await w.admin.raw(`/api/templates/${r.template.id}/versions/${vid}/publish`,
      { method: 'POST', body: { changeNote: 'first', design } });
    return { tplId: r.template.id, pub };
  }

  test('published with a design override: contracts from it wear the override, not the default', async () => {
    const { tplId, pub } = await publishTemplate({ designId: 'formal-legal', logoPosition: 'top-right', accentColor: null });
    assert.equal(pub.status, 200, JSON.stringify(pub.json));
    const c = (await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} })).contract;
    assert.equal(c.branding.designId, 'formal-legal');
    assert.equal(c.branding.logoPosition, 'top-right');
    assert.equal(c.branding.companyName, 'Highland Corporate Ltd', 'identity still comes from the org profile');
  });

  test('published with design:null: contracts from it wear the company default', async () => {
    const { tplId, pub } = await publishTemplate(null);
    assert.equal(pub.status, 200);
    const c = (await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} })).contract;
    assert.equal(c.branding.designId, 'modern-minimal');
    assert.equal(c.branding.accentColor, '#1a7f6b');
  });

  test('a bad design on publish is refused before anything is frozen', async () => {
    const { pub } = await publishTemplate({ designId: 'gothic-castle' });
    assert.equal(pub.status, 400);
  });
});

/* ============================================================
   f129 (9) — THE NEGOTIATE PAGE WEARS THE DOCUMENT'S OWN DESIGN
   ============================================================
   Young ruled it 11 Sep 2026 — *"Make the Negotiate page use the document's
   style"* — after asking why the same contract looked different on the two
   pages, *"especially the font"*.

   IT WAS NEVER A DECISION. Every rule in the design block named `.doc-surface`
   and nothing else, and that class is the DOCUMENT TAB's article; the
   negotiate page's paper is `.rl-paper` and had no `data-doc-body` ancestor at
   all. MEASURED on one contract set to `formal-legal`, on both pages, before a
   line was written: Times New Roman and justified on one, IBM Plex Sans and
   ragged on the other.

   DESIGN ONLY, NEVER STRUCTURE — see docDesignBodyAttr. Two of the three
   claims about that are WALLS: they pass before and after, and their job is to
   fail the day somebody hands this page a `data-doc-structure`.

   What DRAWS is in test/chromium/negotiate-design-verify.js; the two files
   name each other. */
describe('f129 (9) the negotiate page wears the document’s design', () => {
  const rd = f => require('node:fs').readFileSync(
    require('node:path').join(__dirname, '..', f), 'utf8');

  test('the design half is its own reading, so one surface can take it alone', () => {
    const src = rd('js/branding.js');
    assert.match(src, /function docDesignBodyAttr\(b\) \{\s*\n\s*return b && b\.designId \? ` data-doc-body="\$\{b\.designId\}"` : '';/,
      'the design attribute, and nothing about the structure');
    /* ONE READING, TWO CALLERS: the whole-paper attribute is built FROM it, so
       the two can never come to disagree about what a design attribute is. */
    assert.match(src, /const design = docDesignBodyAttr\(b\);/,
      'docDesignPaperAttr composes it rather than repeating it');
    assert.match(src, /docDesignBodyAttr/, 'and it is published');
  });

  test('the negotiate paper carries the hook, and the sheet carries the dressing', () => {
    const neg = rd('js/views/negotiation.js');
    assert.match(neg, /const _dAttr=\(_brand&&window\.docDesignBodyAttr\)\?docDesignBodyAttr\(_brand\):'';/,
      'the design half only');
    assert.match(neg, /<div class="rl-zoom"\$\{_dAttr\}/,
      'the attribute goes on the WRAPPER — the rules read it as an ancestor');
    assert.match(neg, /<article class="nego-doc rl-paper"\$\{_dStyle\?` style="\$\{_dStyle\}"`:''\}>/,
      'and the border and accent go on the sheet they draw round');
  });

  test('WALL — the negotiate page is never handed a structure', () => {
    const neg = rd('js/views/negotiation.js');
    assert.doesNotMatch(neg, /docDesignPaperAttr/,
      'the whole-paper attribute carries data-doc-structure and must not be used here');
    assert.doesNotMatch(neg, /data-doc-structure/,
      'two columns, a margin counter or a prepended contents page would each be wrong here');
  });

  test('the rules name both sheets, and :is() changes no weight', () => {
    const css = rd('index.html');
    const a = css.indexOf('/* ============ document designs — body typography');
    const b = css.indexOf('/* ============ document structures — page architecture');
    assert.ok(a > 0 && b > a, 'the design block was found');
    /* THE RULES, NOT THE PROSE. A first writing of this swept the whole block
       and matched the comment above it, which names .doc-surface four times
       while explaining why no rule does. Comments out first. */
    const block = css.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/\.doc-surface/.test(block.replace(/:is\(\.doc-surface,\.rl-paper\)/g, '')),
      'no design rule still names .doc-surface on its own');
    /* Eight designs, each with a face rule (two selectors) and its own heading
       rules — every one of them widened, or a contract in that design is
       dressed on one page and not the other. */
    assert.ok(block.split(':is(.doc-surface,.rl-paper)').length - 1 >= 30,
      'every selector in the block names both sheets');
  });

  test('WALL — the structures are NOT widened', () => {
    const css = rd('index.html');
    const b = css.indexOf('/* ============ document structures — page architecture');
    const rest = css.slice(b, b + 4000);
    assert.doesNotMatch(rest, /\[data-doc-structure="[a-z-]+"\] :is\(/,
      'a structure may not reach the negotiate paper');
    assert.match(rest, /\[data-doc-structure="two-column"\] \.doc-surface\{column-count:2/,
      'and they still dress the Document tab exactly as they did');
  });

  test('the paper wears the design; the furniture does not', () => {
    const css = rd('index.html');
    assert.match(css,
      /\[data-doc-body\] \.rl-paper :is\(\.rl-cp-pill,\.rl-lock-mono,\.nego-fmt-bar,\.nego-reason,\.nego-edit-bar\):not\(\.rl-clause-h\)/,
      'the clause pencil, the lock monogram and the editor’s bars keep the product’s face');
    assert.match(css,
      /\[data-doc-body\] \.rl-paper :is\([^)]*\) \*:not\(\.rl-clause-h\)\{\s*\n?\s*font-family:var\(--font-body\)!important;\}/,
      'and so does everything inside them — the pencil’s own icon included');
    /* THE HEADING IS NEVER FURNITURE. It shares .rl-clause-top with the pencil
       and is the drafter's own words; the qualifier that says so is also what
       carries this rule over the design rule's (0,3,2). */
    assert.ok(css.includes(':not(.rl-clause-h)'), 'the clause heading is excluded by name');
  });
});
