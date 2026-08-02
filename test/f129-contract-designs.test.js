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
      assert.ok(html.includes(`[data-doc-body="${id}"] .doc-surface`), id + ' has body-typography rules in index.html');
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
