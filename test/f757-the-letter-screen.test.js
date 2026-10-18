'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f757 — THE LETTER, AS DRAWN: THE SCREEN (round 11's gaps: the owner's "build
   all the gaps", 18 Oct 2026; the picked option "The letter")
   (1) The head: "Send round N" with "to Nordvik Logistik AB · MK-…" under it,
       and a place for Send and Cancel beside it.
   (2) To, as the email says it: a recipient HaTi already knows is ONE line,
       "Anna Holm · anna.holm@…", with Change; Change opens the same two boxes.
       Send names who it goes to: "Send to Anna".
   (3) Sent as: four small choices — what the link is for, how it goes, how
       long it stays open, what goes — each opening its own list of the SAME
       controls the screen always had; a choice made closes the list and the
       chip says it.
   (4) What stays here: "Clause 7 stays here", the counter and its figure, the
       reviewer named ONLY where the review's own wall lets this reader see
       who reviews (reviewMaySee), "Remind Sara" only where the review lets
       this reader remind (reviewMayCancel, the review's own reminder), "Go to
       clause 7"; and "What Anna never sees", whose names stay inside.
   AT THE BASE (8dc306a) every test here FAILS.
   The browser half: test/chromium/the-letter-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');
const F = require('./clausefixtures.js');

function contract(over = {}){
  return { id: 'MK-757', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: F.protoRich(), format: 'rich', ...over };
}
async function openShare(c, { known = true, tweak } = {}){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  win.API_MODE = () => true;
  win.api = async () => ({ ok: true });
  win.state.contracts = [c]; win.state.selectedId = c.id;
  const user = { id: 'u_m', name: 'Maria Lindgren', role: 'legal', email: 'm@co.example' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.contractShares = async () => (known ? [{ recipientName: 'Anna Holm', recipientEmail: 'anna.holm@nordvik.example', channel: 'email', token: 't1', createdAt: '2026-10-10T09:00:00Z' }] : []);
  if (tweak) tweak(win);
  win.negoInit(c);
  await win.openShareModal(c, { purpose: 'negotiate' });
  const root = win.document.getElementById('modal-root');
  const click = el => el.dispatchEvent(new win.MouseEvent('click', { bubbles: true }));
  return { win, root, click, $: s => root.querySelector(s), txt: s => ((root.querySelector(s) || {}).textContent || '').replace(/\s+/g, ' ').trim() };
}

describe('f757 (1) the head', () => {
  test('1a "Send the contract" (or "Send round N" once a round carries changes), then whom to and which contract, and a place for its two acts', async () => {
    const m = await openShare(contract());
    const h = m.$('#share-lead-title');
    assert.ok(h, 'the head is drawn');
    assert.equal(h.childNodes[0].textContent.trim(), 'Send the contract', 'nothing changed yet: the contract');
    assert.match(m.win.shareLeadTitle({ id: 'MK-1', counterparty: 'Nordvik Logistik AB', negotiation: { round: 2, turn: 'counterparty' } }, { lines: [{}] }, 'negotiate'),
      /^Send round 2 <span class="sh-hd-to">to Nordvik Logistik AB · MK-1<\/span>$/, 'a round with changes: its number');
    assert.equal(m.txt('#share-lead-title .sh-hd-to'), 'to Nordvik Logistik AB · MK-757');
    assert.ok(m.$('.sh-hd .sh-hd-acts'), 'Send and Cancel stand in the head where the screen is a page');
  });
});

describe('f757 (2) To, as the email says it', () => {
  test('2a a known recipient is one line with Change; Change opens the same two boxes', async () => {
    const m = await openShare(contract());
    assert.equal(m.$('#sh-letter').getAttribute('data-sh-to'), 'folded');
    assert.ok(!m.$('#sh-lt-tosay').classList.contains('hidden'), 'the line is shown');
    assert.equal(m.txt('#sh-lt-towho'), 'Anna Holm · anna.holm@nordvik.example');
    assert.ok(m.$('.sh-lt-who').classList.contains('hidden'), 'the boxes wait behind Change');
    m.click(m.$('#sh-lt-change'));
    assert.equal(m.$('#sh-letter').getAttribute('data-sh-to'), 'open');
    assert.ok(!m.$('.sh-lt-who').classList.contains('hidden') && m.$('#sh-email').value === 'anna.holm@nordvik.example', 'the same boxes, filled');
  });
  test('2b nobody known: the boxes from the start; Send names the first name once there is one', async () => {
    const m = await openShare(contract(), { known: false });
    assert.equal(m.$('#sh-letter').getAttribute('data-sh-to'), 'open');
    const name = m.$('#sh-name'); name.value = 'Anna Holm'; name.dispatchEvent(new m.win.Event('input', { bubbles: true }));
    assert.equal(m.txt('#share-send'), 'Send to Anna');
  });
});

describe('f757 (3) Sent as: four small choices, each the same controls', () => {
  test('3a the four chips say the choice, and each opens its own list of the screen\'s own controls', async () => {
    const m = await openShare(contract());
    const chips = [...m.root.querySelectorAll('#sh-as-chips [data-sh-as]')];
    assert.deepEqual(chips.map(x => x.getAttribute('data-sh-as')), ['purpose', 'ch', 'link', 'what']);
    const w = k => m.txt(`[data-sh-as-w="${k}"]`);
    assert.equal(w('purpose'), 'a link to negotiate');
    assert.equal(w('ch'), 'by email');
    assert.equal(w('what'), 'the contract, round 1');
    assert.ok(m.$('[data-sh-as="purpose"] .sh-as-pop #share-purpose-wrap'), 'the purpose segments live in the first list');
    assert.ok(m.$('[data-sh-as="ch"] .sh-as-pop #share-tabs'), 'the channel segments in the second');
    assert.ok(m.$('[data-sh-as="link"] .sh-as-pop #sh-link-opts'), 'the link\'s settings in the third');
    assert.deepEqual([...m.root.querySelectorAll('[data-sh-as="what"] [data-sh-as-what]')].map(b => b.getAttribute('data-sh-as-what')), ['contract', 'history', 'status']);
  });
  test('3b a chip opens its list; a choice in it closes the list and the chip says the new choice', async () => {
    const m = await openShare(contract());
    const box = m.$('[data-sh-as="purpose"]'), go = box.querySelector('[data-sh-as-go]');
    m.click(go);
    assert.ok(box.classList.contains('is-open') && go.getAttribute('aria-expanded') === 'true');
    m.click(m.$('[data-sh-as="ch"] [data-sh-as-go]'));
    assert.ok(!box.classList.contains('is-open'), 'one list open at a time');
    m.click(go);
    m.click(m.$('[data-share-purpose="view"]'));
    await new Promise(r => setTimeout(r, 5));
    assert.ok(!box.classList.contains('is-open'), 'the choice closes it');
    assert.equal(m.txt('[data-sh-as-w="purpose"]'), 'a link to read');
    m.click(go); m.click(go);
    assert.ok(!box.classList.contains('is-open'), 'pressed again, it closes');
  });
});

describe('f757 (4) what stays here, and what they never see', () => {
  const held = (win, { see, remind }) => {
    win.reviewWithheldIds = () => new Set(['CH-9']);
    win.negoUnsentAsks = () => [{ id: 'CH-9', clauseId: 'k7', clauseLabel: '7. Liability cap', newText: 'capped at 75% of the fees' }];
    win.reviewHeld = () => false;
    win.reviewOpenFor = () => ({ id: 'rv1', reviewer: { name: 'Sara Nyström' } });
    win.reviewMaySee = () => see;
    win.reviewMayCancel = () => remind;
  };
  const c7 = () => contract({ changes: [{ id: 'CH-7', authorSide: 'counterparty', status: 'countered', counteredBy: 'CH-9', clauseLabel: '7. Liability cap',
    oldText: 'capped at 50% of the fees', newText: 'capped at 100% of the fees' }] });
  test('4a the reviewer named, Remind and Go to clause, where the review lets this reader see and remind', async () => {
    const m = await openShare(contract());
    held(m.win, { see: true, remind: true });
    const h = m.win.shareStaysHtml(c7());
    assert.match(h, /<h4>[^]*Clause 7 stays here<\/h4>/);
    assert.match(h, /Your counter on the liability cap \(75%\) is with Sara Nyström for internal review\. Nothing under review travels; it goes in your next send once Sara clears it\./);
    assert.match(h, /data-sh-lt-remind="rv1"[^>]*>Remind Sara</);
    assert.match(h, /data-sh-lt-goto="k7"[^>]*>Go to clause 7</);
  });
  test('4b no name and no Remind where the review keeps its people to itself', async () => {
    const m = await openShare(contract());
    held(m.win, { see: false, remind: true });
    const h = m.win.shareStaysHtml(c7());
    assert.ok(!/Sara/.test(h), 'no name');
    assert.ok(!/data-sh-lt-remind/.test(h), 'no Remind for a person not named');
    assert.match(h, /Your counter on the liability cap \(75%\) is out for internal review\./);
  });
  test('4c what Anna never sees, by name; whose names stay inside', async () => {
    const m = await openShare(contract());
    assert.equal(m.txt('#sh-lt-never-h'), 'What Anna never sees');
    assert.match(m.root.textContent, /The review, your internal notes and your colleagues' names stay inside /);
    assert.equal(m.txt('#sh-summary-label'), 'Your note · type here', 'and the one part she reads that you write');
  });
});
