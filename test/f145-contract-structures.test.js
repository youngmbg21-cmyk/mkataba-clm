/* ============================================================
   f145 — contract structures (the second axis of the Design step)

   A DESIGN dresses a document; a STRUCTURE re-lays out the page it sits on.
   The two are chosen independently. The promise that makes structures safe to
   ship is narrow and absolute: a structure NEVER rewords, reorders or
   renumbers anything. It may restyle the body (four of the five are pure CSS,
   carried on a data-doc-structure attribute) and it may PREPEND navigation
   (Contents First). Nothing else.

   This file pins:

     · the catalogue: stable ids, and Standard Flow is the one that means
       "the layout every document already had"
     · an unknown or absent structure normalises to NULL, not to a default —
       the difference is what stops a pre-structure snapshot from overriding a
       company default, and what keeps a document with no structure rendering
       byte-for-byte as it did before the feature
     · the paper attribute is emitted for real structures only, never for
       Standard Flow
     · docStructureBodyHtml returns the IDENTICAL STRING for every CSS
       structure — not an equivalent one, the same one, so sealed bytes cannot
       drift
     · Contents First only ever prepends: the body it was given survives
       verbatim and in order, every data-clause-id with it
     · Contents First declines to draw a contents page for a document too short
       to need one, and never lists the document's own title
     · the blocked pairings are symmetric with the picker and reasoned
     · the org route round-trips structureId and refuses an unknown one (400,
       not a silent null), and a template published with a structure stamps it
       onto contracts created from it
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');
const branding = require('../js/branding.js');

describe('f145 — the structure catalogue and the body transform (pure)', () => {
  /* 'contents-first' has left this list (Young, 10 Aug 2026). It prepended a
     page and left the body alone, so it was never a layout — and being ON the
     list made it exclusive with the four that are, which meant a two-column
     booklet could not have a contents page at all. It is a flag now; the tests
     for it are in their own section below. */
  const IDS = ['standard-flow', 'margin-numbers', 'two-column', 'ruled-clauses'];

  test('stable ids, and Standard Flow is the default', () => {
    assert.deepEqual(branding.DOC_STRUCTURES.map(s => s.id), IDS);
    assert.equal(branding.DEFAULT_STRUCTURE, 'standard-flow');
    assert.equal(branding.DOC_STRUCTURES[0].id, branding.DEFAULT_STRUCTURE,
      'the default is first in the list the picker draws');
    for (const s of branding.DOC_STRUCTURES) {
      assert.ok(s.name && s.blurb && s.bestFor, s.id + ' can be described to a customer');
      /* 'prepend' has gone with the structure that was the only one to use it:
         every remaining layout is pure CSS over an untouched body, which is the
         property that lets five render surfaces share one document. */
      assert.ok(['none', 'css'].includes(s.device), s.id + ' declares how it works');
    }
  });

  test('an absent or unknown structure normalises to null, never to a default', () => {
    assert.equal(branding.normalizeDesignBranding({}).structureId, null,
      'a record from before structures existed claims nothing');
    assert.equal(branding.normalizeDesignBranding({ structureId: 'origami' }).structureId, null,
      'an id this build does not know is not guessed at');
    assert.equal(branding.normalizeDesignBranding({ structureId: 'two-column' }).structureId, 'two-column');
  });

  test('the paper attribute names a real structure, and stays silent for Standard Flow', () => {
    const attr = id => branding.docDesignPaperAttr(
      branding.normalizeDesignBranding({ designId: 'modern-minimal', structureId: id }));
    assert.ok(attr('two-column').includes('data-doc-structure="two-column"'));
    assert.ok(attr('ruled-clauses').includes('data-doc-structure="ruled-clauses"'));
    /* The retired id emits nothing — it names no layout, and the contents page
       it used to mean travels on the body, not on the paper div. */
    assert.ok(!attr('contents-first').includes('data-doc-structure'));
    assert.ok(!attr('standard-flow').includes('data-doc-structure'),
      'Standard Flow IS the absence of a structure — no attribute, no CSS');
    assert.ok(!attr(null).includes('data-doc-structure'));
    assert.ok(attr('two-column').includes('data-doc-body="modern-minimal"'),
      'the design attribute still rides along — both choices, one paper div');
  });

  const BODY = [
    '<h1>Supply Agreement</h1>',
    '<p>Made between the parties named below.</p>',
    '<h2 data-clause-id="cl_a1b2c3">1. Services</h2>',
    '<p>The Supplier shall provide the services.</p>',
    '<h2 data-clause-id="cl_d4e5f6">2. Payment</h2>',
    '<p>Invoices are payable within thirty (30) days.</p>',
    '<h2 data-clause-id="cl_g7h8i9">3. Term</h2>',
    '<p>Twelve months from the Effective Date.</p>',
  ].join('');

  test('every CSS structure returns the body IDENTICALLY — the same string, not an equivalent one', () => {
    for (const id of ['standard-flow', 'margin-numbers', 'two-column', 'ruled-clauses']) {
      const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: id });
      assert.equal(branding.docStructureBodyHtml(b, BODY), BODY, id + ' must not touch the body');
    }
    assert.equal(branding.docStructureBodyHtml(null, BODY), BODY, 'no branding at all, no transform');
    assert.equal(branding.docStructureBodyHtml(undefined, BODY), BODY);
  });

  /* ============================================================
     THE CONTENTS PAGE IS ITS OWN CHOICE (Young, 10 Aug 2026)
     ============================================================
     Asked for as: either a contents page at the front or none, chosen
     separately, OFF unless asked for. Three claims carry that, and the third
     is the one that protects customers who already published: */
  test('off unless asked for — a design that says nothing gets no contents page', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'two-column' });
    assert.equal(b.contents, null, 'a record that has not answered claims nothing');
    assert.equal(branding.docStructureBodyHtml(b, BODY), BODY, 'and no page is added');
    const off = branding.normalizeDesignBranding({ designId: 'formal-legal', contents: false });
    assert.equal(off.contents, false, 'a deliberate no is recorded as one, not as silence');
    assert.equal(branding.docStructureBodyHtml(off, BODY), BODY);
  });

  test('it composes with every layout — the thing being exclusive was the bug', () => {
    for (const id of IDS) {
      const b = branding.normalizeDesignBranding(
        { designId: 'modern-minimal', structureId: id, contents: true });
      const out = branding.docStructureBodyHtml(b, BODY);
      assert.ok(out.startsWith('<nav data-doc-contents'), id + ' can carry a contents page');
      assert.ok(out.endsWith(BODY), id + ' still gets its body verbatim');
      /* And the layout it chose is still the layout it chose — the contents
         page rides on the body, so it cannot displace the paper attribute. */
      const attr = branding.docDesignPaperAttr(b);
      assert.equal(attr.includes('data-doc-structure="' + id + '"'), id !== 'standard-flow');
    }
  });

  test('a record saved as Contents First keeps its contents page', () => {
    /* The migration, and the reason it is not optional: this id was a real
       published choice. Read as "no structure and no flag" it would be a
       document silently losing a page it went out with. */
    const b = branding.normalizeDesignBranding(
      { designId: 'formal-legal', structureId: 'contents-first' });
    assert.equal(b.contents, true, 'the old id is read as the flag it always was');
    assert.equal(b.structureId, null, 'and it claims no layout, because it never was one');
    assert.ok(branding.docStructureBodyHtml(b, BODY).startsWith('<nav data-doc-contents'));
    /* Raw, too: the sealed copy is rendered from the snapshot on the record and
       does not always come back through normalize first. */
    assert.ok(branding.docStructureBodyHtml({ structureId: 'contents-first' }, BODY)
      .startsWith('<nav data-doc-contents'), 'even un-normalised, straight off a sealed record');
  });

  test('Contents First only prepends: the document it was given survives verbatim, in order', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'contents-first' });
    const out = branding.docStructureBodyHtml(b, BODY);
    assert.ok(out.endsWith(BODY), 'the body is untouched and still last');
    assert.ok(out.startsWith('<nav data-doc-contents'), 'the contents page goes in front');
    for (const id of ['cl_a1b2c3', 'cl_d4e5f6', 'cl_g7h8i9'])
      assert.equal(out.split(id).length - 1, 1, id + ' appears exactly once — clause identity is not duplicated');
    assert.ok(out.indexOf('1. Services') < out.indexOf('2. Payment'), 'clause order is not disturbed');
  });

  test('the contents page lists the clauses, never the document\'s own title', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'contents-first' });
    const nav = branding.docStructureBodyHtml(b, BODY).split('</nav>')[0];
    for (const label of ['1. Services', '2. Payment', '3. Term'])
      assert.ok(nav.includes(label), 'contents lists ' + label);
    assert.ok(!nav.includes('Supply Agreement'), 'the title is the document, not a destination in it');
  });

  test('a document too short to need contents does not get a contents page', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'contents-first' });
    const short = '<h1>Letter of Intent</h1><h2>1. Purpose</h2><p>Short.</p><h2>2. Term</h2><p>Short.</p>';
    assert.equal(branding.docStructureBodyHtml(b, short), short,
      'two clauses is furniture, not navigation — the structure quietly does nothing');
    assert.equal(branding.docStructureBodyHtml(b, ''), '', 'an empty body stays empty');
  });

  test('headings are read whatever markup they carry, and their text is escaped', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'contents-first' });
    const body = '<h1>T</h1>' + ['<h2 data-clause-id="x1"><strong>1.</strong> Fees &amp; Charges</h2><p>a</p>',
      '<h2 id="two">2. Notice</h2><p>b</p>', '<h3>3. Waiver <em>(none)</em></h3><p>c</p>'].join('');
    const nav = branding.docStructureBodyHtml(b, body).split('</nav>')[0];
    assert.ok(nav.includes('1. Fees &amp; Charges'), 'inner markup is stripped, the escaping survives');
    assert.ok(nav.includes('2. Notice'));
    assert.ok(nav.includes('3. Waiver (none)'));
    assert.ok(!/<strong>|<em>/.test(nav), 'no markup from the heading leaks into the contents list');
  });

  test('a heading holding a script tag cannot escape into the contents page', () => {
    const b = branding.normalizeDesignBranding({ designId: 'formal-legal', structureId: 'contents-first' });
    const nasty = '<h1>T</h1><h2>1. &lt;script&gt;alert(1)&lt;/script&gt;</h2><p>a</p>'
      + '<h2>2. Ok</h2><p>b</p><h2>3. Also ok</h2><p>c</p>';
    const nav = branding.docStructureBodyHtml(b, nasty).split('</nav>')[0];
    assert.ok(!nav.includes('<script'), 'nothing executable reaches the contents page');
    assert.ok(nav.includes('&lt;script&gt;'), 'it reads as the text it is');
  });

  test('the blocked pairings name a real design, a real structure, and give a reason', () => {
    const ids = branding.DOC_STRUCTURES.map(s => s.id);
    let found = 0;
    for (const d of branding.DOC_DESIGNS) for (const s of ids) {
      const why = branding.structureBlockedReason(d.id, s);
      if (!why) continue;
      found++;
      assert.ok(why.length > 30, `${d.id} × ${s} explains itself rather than just refusing`);
      assert.notEqual(s, branding.DEFAULT_STRUCTURE, 'Standard Flow must pair with every design');
    }
    assert.ok(found > 0, 'the product does refuse some pairings');
    assert.equal(branding.structureBlockedReason('modern-minimal', 'two-column'), null, 'and allows the rest');
  });
});

describe('f145 — the structure travels: org route, publish override, contract stamp', () => {
  let h, w, viewer;

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

  test('the org route round-trips the structure alongside the design', async () => {
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Ltd', designId: 'modern-minimal', structureId: 'two-column' } });
    const b = (await viewer.json('/api/org/branding')).branding;
    assert.equal(b.structureId, 'two-column');
    assert.equal(b.designId, 'modern-minimal', 'the design is undisturbed by the new field');
  });

  test('Standard Flow stores as nothing — it is the absence of a structure', async () => {
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Ltd', designId: 'modern-minimal', structureId: 'standard-flow' } });
    assert.equal((await w.admin.json('/api/org/branding')).branding.structureId, null,
      'storing it as a value would make every pre-structure row look deliberately chosen');
  });

  test('an unknown structure is a 400, not a silent null', async () => {
    const r = await w.admin.raw('/api/org/branding', { method: 'PUT', body: {
      companyName: 'X', structureId: 'origami-fold' } });
    assert.equal(r.status, 400);
    const vb = await viewer.raw('/api/org/branding', { method: 'PUT', body: { structureId: 'two-column' } });
    assert.equal(vb.status, 403, 'structure writes stay manager-only, like design writes');
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

  test('a template published with a structure stamps it onto contracts made from it', async () => {
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Ltd', designId: 'modern-minimal', structureId: 'two-column' } });
    const { tplId, pub } = await publishTemplate({ designId: 'formal-legal', structureId: 'ruled-clauses' });
    assert.equal(pub.status, 200, JSON.stringify(pub.json));
    const c = (await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} })).contract;
    assert.equal(c.branding.structureId, 'ruled-clauses', 'the override wins over the company default');
    assert.equal(c.branding.designId, 'formal-legal');
  });

  test('published without an override: contracts wear the company structure', async () => {
    await w.admin.json('/api/org/branding', { method: 'PUT', body: {
      companyName: 'Highland Corporate Ltd', designId: 'modern-minimal', structureId: 'two-column' } });
    const { tplId, pub } = await publishTemplate(null);
    assert.equal(pub.status, 200);
    const c = (await w.admin.json(`/api/templates/${tplId}/contracts`, { method: 'POST', body: {} })).contract;
    assert.equal(c.branding.structureId, 'two-column');
  });

  test('an unknown structure on publish is refused before anything is frozen', async () => {
    const { pub } = await publishTemplate({ designId: 'formal-legal', structureId: 'origami-fold' });
    assert.equal(pub.status, 400);
  });
});
