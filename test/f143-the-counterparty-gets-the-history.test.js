/* ============================================================
   f143 — the counterparty reads the history too, and can take it away
   ============================================================
   Reported (Young, 02 Aug 2026): the counterparty has no way of reviewing all
   the changes made. The data was never the problem — every change travels in
   the payload, settled ones included, and the closed rounds with them — but
   openHistoryTimeline was reachable from exactly one place, `ws-history` on the
   owner's workspace. The other half of the table had a workbench, a compare and
   no story.

   THE HISTORY IS THE OWNER'S SCREEN, MOUNTED UNCHANGED. One component, both
   chairs, exactly as the workbench already is. What keeps it safe is not a
   filter added at the portal — it is that this page's contract is rebuilt from
   the SHARE PAYLOAD, which already decided what may cross the table: internal
   notes never travelled, so nothing drawn from a note can leak here. The wall
   that cannot be got wrong is the one made of things that were never sent.

   What the payload DOES send whole is the author string, and the timeline shows
   it — as the change cards on this page always have. That is stated in the
   tests below rather than wished away, because the fix is not a redaction on
   the way out: the author sits inside the change's fingerprint, so an edited
   name leaves their copy unable to verify the chain.

   AND THE EXPORT GOES WITH IT, with the colour fault fixed. The report is a
   standalone HTML file, but its ins/del rules named var(--st-green-bg) and
   var(--st-ruby-bg) — custom properties declared in the app's stylesheet, which
   the exported file does not carry. Both resolved to nothing, so a negotiation
   history exported for a lawyer printed every redline as flat text with no
   added/removed distinction at all. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const CHANGE = {
  id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1 · Payment', changeType: 'modify',
  type: 'modify', status: 'pending',
  oldText: 'Payable within thirty (30) days.', newText: 'Payable within sixty (60) days.',
  ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }],
  summary: 'Payment terms extended to Net-60', authorSide: 'owner',
  author: 'Young Mbagaya',
  note: 'Copilot — Shorten & Simplify',
};

function contract(over = {}) {
  return { id: 'MK-500', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', status: 'Under Review', folder: 'proc', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    format: 'text', redlineText: 'Clause 1\n\nPayable within thirty (30) days.',
    changes: [CHANGE], ...over };
}

/* Their negotiation link, opened on a payload the product itself built. */
function theirPage(over = {}) {
  const p = buildPortal();
  const saved = [];
  p.win.downloadFile = (name, content, mime) => saved.push({ name, content, mime });
  const payload = sharePayloadFor(p, contract(over));
  payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
  p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik Lindqvist' } });
  const d = p.win.document;
  const click = id => {
    const el = d.getElementById(id);
    assert.ok(el, `#${id} must be on the counterparty's page`);
    el.dispatchEvent(new p.win.Event('click', { bubbles: true }));
    return el;
  };
  return { p, win: p.win, d, saved, click, html: () => d.body.innerHTML };
}
const settle = (ms = 60) => new Promise(r => setTimeout(r, ms));

describe('f143 — they can reach the history at all', () => {
  test('THE REPORTED GAP — a history button is on their page', () => {
    const v = theirPage();
    assert.ok(v.d.getElementById('pt-hist'),
      'the owner had ws-history; the other half of the table had nothing');
  });

  test('and it opens the same timeline screen the owner reads', async () => {
    const v = theirPage();
    v.click('pt-hist');
    await settle();
    assert.match(v.html(), /CHG-001/, 'their story names the same change the owner sees');
    assert.match(v.html(), /Payment terms extended/);
  });

  test('a contract with nothing proposed offers no empty history', () => {
    const v = theirPage({ changes: [] });
    assert.equal(v.d.getElementById('pt-hist'), null,
      'a button that opens an empty screen is worse than no button');
  });
});

describe('f143 — the internal note stays behind', () => {
  test('our aside never reaches their timeline, because it never reached the page', async () => {
    /* buildSharePayload walls `note` to the counterparty's own. The history is a
       new surface and inherits that for free: it can only draw what was sent. */
    const v = theirPage();
    v.click('pt-hist');
    await settle();
    assert.ok(!/Copilot — Shorten/.test(v.html()),
      'the note is an internal aside and does not cross the table');
  });

  test('and whose ask it is still reads plainly', async () => {
    const v = theirPage();
    v.click('pt-hist');
    await settle();
    assert.match(v.html(), /Young Mbagaya/,
      'a history that cannot say who asked would be a worse screen than none');
  });
});

describe('f143 — the export, and the colour fault it used to have', () => {
  async function exported() {
    const v = theirPage();
    v.click('pt-hist');
    await settle();
    v.click('ht-export');
    await settle(300);
    assert.equal(v.saved.length, 1, 'one file, handed over');
    return { file: v.saved[0], html: v.saved[0].content };
  }

  test('they can take the history away as a standalone file', async () => {
    const e = await exported();
    assert.match(e.file.name, /MK-500.*negotiation-history\.html$/);
    assert.equal(e.file.mime, 'text/html');
    assert.match(e.html, /^<!doctype html>/i, 'it stands alone, not a fragment');
  });

  test('THE COLOUR FAULT — the marks no longer reference styles the file lacks', async () => {
    const e = await exported();
    assert.ok(!/var\(--/.test(e.html),
      'a custom property declared in the app resolves to nothing in a standalone file');
    assert.match(e.html, /\.ht-redline ins\{background:#d1fae5/, 'added wording is green');
    assert.match(e.html, /\.ht-redline del\{background:#ffe4e6/, 'removed wording is red');
  });

  test('and the distinction survives a greyscale print', async () => {
    const e = await exported();
    assert.match(e.html, /line-through/, 'removed wording is struck, not merely tinted');
    assert.match(e.html, /\.ht-redline ins\{[^}]*text-decoration:underline/, 'added wording is underlined');
    assert.match(e.html, /print-color-adjust:exact/, 'and browsers are asked to keep the wash when printing');
    assert.match(e.html, /wording added/, 'with the convention stated in words');
  });

  test('the redline itself is in the file, marked up', async () => {
    const e = await exported();
    assert.match(e.html, /<ins/, 'the added wording');
    assert.match(e.html, /<del/, 'and the removed');
    assert.match(e.html, /sixty \(60\)/);
  });

  test('the file carries no internal note, and no commentary of ours', async () => {
    const e = await exported();
    assert.ok(!/Copilot — Shorten/.test(e.html), 'the internal aside stayed home');
    assert.ok(!/custom propert|self-contained has to mean/i.test(e.html),
      'our reasoning about the fix is not theirs to read');
  });

  test('it states a verification result and when that was run', async () => {
    /* The fixture's changes are hand-built and carry no real hash chain, so the
       honest verdict here is a failure — which is the point worth pinning: the
       report states what it found and WHEN it looked, rather than printing a
       reassuring line either way. An export claiming integrity without saying
       when it was checked is the "Verified" pill fakery in file form. */
    const e = await exported();
    assert.match(e.html, /class="integrity"/, 'the verdict is on the face of the report');
    assert.match(e.html, /Run \d{4}-\d{2}-\d{2}[^<]*UTC/, 'with the moment it was run');
    assert.match(e.html, /chained record/, 'and how much of the record it recomputed');
  });
});
