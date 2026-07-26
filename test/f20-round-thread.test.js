/* ============================================================
   F20 — the conversation travels with the contract
   ============================================================
   The portal could tell a counterparty THAT their round was turned down and
   never why. The reasoning lived in a parallel email thread — which is exactly
   the fragmentation the product exists to end, reappearing at the one moment
   the parties most need a shared record.

   Both halves of a round now travel in the share payload and are rendered as
   a conversation beside the document. This page has no login, so every field
   is checked for escaping as well as for presence. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const core = () => loadViews(['js/richdoc.js', 'js/core.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
const portal = () => loadViews(['js/views/portal.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });

const WHO = { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' };
const round = (n, over = {}) => ({ n, at: '2026-07-26T09:00:00.000Z', by: 'Erik Lindqvist',
  comment: 'Net-60 is our standard.', proposedText: 'THEIR WORDING', baseText: 'OUR WORDING',
  status: 'closed', resolution: { decision: 'rejected', by: 'Wanjiru Kamau',
    at: '2026-07-26T10:00:00.000Z', comment: 'Net-30 stands, or a 2% price increase.' }, ...over });

describe('F20 — the payload carries both halves', () => {
  const contract = (rounds) => ({ id: 'MK-1', name: 'Supply', counterparty: 'Nordkust',
    template: 'RM', value: 1, valueType: 'estimated', fields: {}, folder: 'proc',
    redlineText: 'WORDING', format: 'text', rounds });

  test('the counterparty’s own ask travels back to them', () => {
    const s = core();
    const p = s.buildSharePayload(contract([round(1)]), 'h', WHO);
    assert.equal(p.contract.rounds[0].comment, 'Net-60 is our standard.',
      'they wrote it — showing it back to them is what makes the page a conversation');
  });

  test('the reply travels — the half that was missing entirely', () => {
    const s = core();
    const p = s.buildSharePayload(contract([round(1)]), 'h', WHO);
    assert.equal(p.contract.rounds[0].resolution.comment, 'Net-30 stands, or a 2% price increase.');
    assert.equal(p.contract.rounds[0].resolution.decision, 'rejected');
  });

  test('the internal name of whoever ruled still stays behind', () => {
    const s = core();
    const p = s.buildSharePayload(contract([round(1)]), 'h', WHO);
    assert.equal(p.contract.rounds[0].resolution.by, undefined,
      'the organisation speaks, not a named member of staff');
    assert.ok(!JSON.stringify(p).includes('Wanjiru Kamau') || p.sharedBy === 'Wanjiru Kamau');
  });

  test('the proposed and base texts still stay behind — bulk, and already reflected', () => {
    const s = core();
    const p = s.buildSharePayload(contract([round(1)]), 'h', WHO);
    assert.equal(p.contract.rounds[0].proposedText, undefined);
    assert.equal(p.contract.rounds[0].baseText, undefined);
  });

  test('an unanswered round carries its ask and no verdict', () => {
    const s = core();
    const p = s.buildSharePayload(contract([round(1, { status: 'open', resolution: null })]), 'h', WHO);
    assert.equal(p.contract.rounds[0].comment, 'Net-60 is our standard.');
    assert.equal(p.contract.rounds[0].resolution, null);
  });
});

describe('F20 — the thread renders as a conversation', () => {
  test('both sides are shown, attributed and dated', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [round(1)] }, WHO);
    assert.match(html, /Net-60 is our standard/);
    assert.match(html, /Net-30 stands, or a 2% price increase/);
    assert.match(html, /Erik Lindqvist/);
    assert.match(html, /Wanjiru Catering Ltd/);
    assert.match(html, /Round 1/);
    assert.match(html, /Not adopted/);
  });

  test('an adopted round says so', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [round(1, {
      resolution: { decision: 'accepted', at: '2026-07-26T10:00:00.000Z', comment: 'Agreed.' } })] }, WHO);
    assert.match(html, /Adopted/);
    assert.ok(!/Not adopted/.test(html));
  });

  test('several rounds read in order', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [
      round(1, { comment: 'First ask.' }),
      round(2, { comment: 'Second ask.' }),
    ] }, WHO);
    assert.ok(html.indexOf('First ask.') < html.indexOf('Second ask.'));
  });

  test('a round nobody commented on adds nothing', () => {
    const s = portal();
    assert.equal(s.portalThreadHtml({ rounds: [
      { n: 1, status: 'closed', resolution: { decision: 'accepted' } }] }, WHO), '');
    assert.equal(s.portalThreadHtml({ rounds: [] }, WHO), '');
    assert.equal(s.portalThreadHtml({}, WHO), '');
  });

  test('nothing in a comment can execute on this page', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [round(1, {
      by: '<img src=x onerror=alert(1)>',
      comment: '<script>alert(2)</script>',
      resolution: { decision: 'rejected', comment: '<iframe src=evil></iframe>' } })] },
      { org: '<svg onload=alert(3)>' });
    /* The vector is a TAG forming, not the letters "onerror" appearing: escaped
       text may legitimately contain them and does no harm there. So the check
       is that none of the injected tags survive as tags. (The harness's own
       icon() stub emits a real <svg></svg>, which is why '<svg' is not in the
       list — it is the test's markup, not the attacker's.) */
    for (const bad of ['<img', '<script', '<iframe']) assert.ok(!html.includes(bad), bad);
    assert.match(html, /&lt;script&gt;/);
    assert.match(html, /&lt;svg onload/, 'the org name must arrive escaped, not executed');
    assert.match(html, /&lt;img src=x onerror/, 'and so must the name on the round');
  });

  test('an ampersand in a company name is not printed as &amp;amp;', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [round(1)] }, { org: 'Mwangi & Sons' });
    assert.match(html, /Mwangi &amp; Sons/);
    assert.ok(!/&amp;amp;/.test(html), 'escaping twice shows the escape to the reader');
  });

  test('a missing org does not print "undefined" at a counterparty', () => {
    const s = portal();
    const html = s.portalThreadHtml({ rounds: [round(1)] }, {});
    assert.ok(!/undefined/.test(html));
    assert.match(html, /The other side/);
  });
});

describe('F20 — a rejected point stays visible instead of vanishing', () => {
  const pts = [{ id: 'b2', before: 'within thirty (30) days', after: 'within sixty (60) days',
    reason: 'Net-30 stands, or a 2% price increase.' }];

  test('it names what they asked for, what the contract still says, and why', () => {
    const s = portal();
    const html = s.portalOpenPointsHtml({ openPoints: pts }, WHO);
    assert.match(html, /within sixty \(60\) days/, 'what they asked for');
    assert.match(html, /within thirty \(30\) days/, 'what the contract still says');
    assert.match(html, /Net-30 stands/, 'and why it was turned down');
    assert.match(html, /Still open between us/);
  });

  test('nothing outstanding renders nothing', () => {
    const s = portal();
    assert.equal(s.portalOpenPointsHtml({ openPoints: [] }, WHO), '');
    assert.equal(s.portalOpenPointsHtml({}, WHO), '');
  });

  test('an open point cannot inject markup either', () => {
    const s = portal();
    const html = s.portalOpenPointsHtml({ openPoints: [{ id: 'x',
      before: '<script>a</script>', after: '<img src=x onerror=b>', reason: '<b>c</b>' }] }, WHO);
    assert.ok(!/<script/.test(html) && !/<img/.test(html));
  });
});

describe('F20 — the reply is captured where the decision is made', () => {
  test('rejecting a round records the reason on it', () => {
    const s = core();
    const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal' };
    s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
    s.toast = () => {}; s.persist = () => {}; s.renderWorkspace = () => {};
    const c = { id: 'MK-1', name: 'Supply', audit: [], status: 'Under Review',
      rounds: [{ n: 1, status: 'open', by: 'Erik Lindqvist', comment: 'Net-60.', resolution: null }] };

    s.resolveRound(c, 1, false, { comment: 'Net-30 stands, or a 2% price increase.' });
    assert.equal(c.rounds[0].resolution.decision, 'rejected');
    assert.equal(c.rounds[0].resolution.comment, 'Net-30 stands, or a 2% price increase.');
  });

  test('a decision with no reply is still a valid decision', () => {
    const s = core();
    const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal' };
    s.REMOTE = { org: 'X', me, users: [me] };
    s.toast = () => {}; s.persist = () => {}; s.renderWorkspace = () => {};
    const c = { id: 'MK-1', name: 'Supply', audit: [], status: 'Under Review',
      rounds: [{ n: 1, status: 'open', by: 'Erik', comment: 'x', resolution: null }] };
    s.resolveRound(c, 1, true);
    assert.equal(c.rounds[0].resolution.decision, 'accepted');
    assert.equal(c.rounds[0].resolution.comment, null);
  });

  test('an enormous reply is bounded before it is stored', () => {
    const s = core();
    const me = { id: 'u_w', name: 'W', role: 'legal' };
    s.REMOTE = { org: 'X', me, users: [me] };
    s.toast = () => {}; s.persist = () => {}; s.renderWorkspace = () => {};
    const c = { id: 'MK-1', name: 'S', audit: [], status: 'Under Review',
      rounds: [{ n: 1, status: 'open', by: 'Erik', comment: 'x', resolution: null }] };
    s.resolveRound(c, 1, false, { comment: 'x'.repeat(9000) });
    assert.equal(c.rounds[0].resolution.comment.length, 2000);
  });
});
