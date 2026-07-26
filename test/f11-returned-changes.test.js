/* ============================================================
   F11 — a returned change announces itself
   ============================================================
   An open negotiation round used to be visible only in the right-hand panel of
   the workspace, and the counterparty was told nothing at all about what had
   become of a proposal they'd sent. Both sides now get a banner, and both
   banners have to clear the moment the round is resolved — a notice that never
   goes away is worse than no notice, because it stops being read.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const sandbox = () => loadViews(['js/views/portal.js'], {
  TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
});

const round = (n, over = {}) => ({ n, at: '2026-07-26T09:00:00.000Z', by: 'Guliz Cetin',
  comment: 'Volumes are lower than forecast.', proposedText: 'edited wording',
  baseText: 'original wording', status: 'open', resolution: null, ...over });

describe('F11 — the counterparty is told what happened to their proposal', () => {
  test('nothing is claimed when no round has been decided', () => {
    const s = sandbox();
    assert.equal(s.portalRoundBanner({ rounds: [] }, { org: 'Mkataba Ltd' }), '');
    assert.equal(s.portalRoundBanner({}, { org: 'Mkataba Ltd' }), '');
    // an OPEN round is the counterparty's own proposal, still unanswered —
    // announcing it back to them would be telling them what they already did
    assert.equal(s.portalRoundBanner({ rounds: [round(1)] }, { org: 'Mkataba Ltd' }), '');
  });

  test('an accepted round says so, and names who accepted it', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Young Mbagaya', at: '2026-07-26T12:00:00.000Z' } })] },
      { org: 'Mkataba Ltd' });
    assert.match(html, /Mkataba Ltd accepted your proposed changes/);
    assert.match(html, /Round 1/);
    assert.match(html, /already reflects them/, 'an accepted edit is in the text below — say so');
  });

  test('a rejected round is not dressed up as an acceptance', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'rejected', by: 'Young Mbagaya', at: '2026-07-26T12:00:00.000Z' } })] },
      { org: 'Mkataba Ltd' });
    assert.match(html, /reviewed your proposed changes/);
    assert.match(html, /not adopted/);
    assert.ok(!/already reflects them/.test(html), 'nothing was adopted, so nothing reflects it');
  });

  test('across several rounds it reports the tally, from the latest one', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [
      round(1, { status: 'closed', resolution: { decision: 'accepted', by: 'Y', at: '2026-07-26T10:00:00.000Z' } }),
      round(2, { status: 'closed', resolution: { decision: 'rejected', by: 'Y', at: '2026-07-26T11:00:00.000Z' } }),
      round(3, { status: 'closed', resolution: { decision: 'accepted', by: 'Y', at: '2026-07-26T12:00:00.000Z' } }),
    ] }, { org: 'Mkataba Ltd' });
    assert.match(html, /Round 3/, 'the latest decision is the news');
    assert.match(html, /2 of your 3 rounds accepted/);
  });

  test('an org name cannot inject markup into the banner', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Y', at: '2026-07-26T12:00:00.000Z' } })] },
      { org: '<img src=x onerror=alert(1)>' });
    assert.ok(!/<img/.test(html), 'the org name reaches a public page — it must be escaped');
    assert.match(html, /&lt;img/);
  });

  test('a missing org falls back rather than printing undefined at a counterparty', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Y', at: '2026-07-26T12:00:00.000Z' } })] }, {});
    assert.ok(!/undefined/.test(html));
    assert.match(html, /The other side accepted/);
  });

  test('the banner respects a reduced-motion preference', () => {
    const s = sandbox();
    const html = s.portalRoundBanner({ rounds: [round(1, { status: 'closed',
      resolution: { decision: 'accepted', by: 'Y', at: '2026-07-26T12:00:00.000Z' } })] },
      { org: 'Mkataba Ltd' });
    assert.match(html, /prefers-reduced-motion/,
      'a pulsing element on a page someone did not choose to open needs an opt-out');
  });
});
