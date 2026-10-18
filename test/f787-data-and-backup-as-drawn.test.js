'use strict';
/* f787 — DATA & BACKUP, AS DRAWN (round 26 "The SAP way", scene b; the gaps
   of 18 Oct 2026)
     (1) the downloads so far: "Downloads so far N · each is itself in the
         trail · recorded before the file leaves"; When · Who · Period · As ·
         Acts; "PDF, sealed" or "CSV"; the acts each carried, a dash for an
         older one without a count
     (2) the count says the private streams it leaves out by the names the
         page already shows this admin ("Marketing & Brand left out: you are
         not named")
     (3) Jambo says the trail in words: the period, its acts, the streams;
         who is left out; a code-named deal by its code name only
     (4) his chips: "download Q3 2026 as a PDF" readies the page and
         downloads nothing; "what is a sealed PDF?" is answered from what
         HaTi is, spending nothing
     (5) The trail · Backup are tabs inside the page's head card, and turn
   AT THE PARENT (8dc306a) every test here fails.
   Run: node --test test/f787-data-and-backup-as-drawn.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { settingsStage, S } = require('./settingsworld.js');

const EXPORTS = [
  { at: '2026-10-02T09:00:00Z', who: 'Young Mbagaya', from: '2026-07-01', to: '2026-09-30', as: 'pdf', acts: 1234 },
  { at: '2026-04-03T09:00:00Z', who: 'Young Mbagaya', from: '2026-01-01', to: '2026-03-31', as: 'csv', acts: null },
];
const SUM = { acts: 1234, streams: 5, people: 4, leftOut: 1 };
const data = (opts = {}) => {
  const g = settingsStage({ ...opts,
    reply: (r, m, b) => { if (r === 'trail/exports') return { exports: EXPORTS, total: 7 }; if (/^trail\/summary\?/.test(r)) return SUM; return opts.reply ? opts.reply(r, m, b) : null; },
    before: sb => { sb.state.settings.privateStreams = { mktg: { on: true, people: [{ id: 'u_two' }] } }; if (opts.before) opts.before(sb); } });
  /* the trail's own door (Housekeeping's "Download the trail"), as the page
     is reached from the board */
  g.sb.stDrawerOpen(opts.door || 'trail');
  return g;
};
const settle = async g => { for (let i = 0; i < 4; i++) await g.flush(); };

describe('f787 (1) the downloads so far', () => {
  test('1a the head: its words, the count in a tag', async () => {
    const g = data(); await settle(g);
    const h = g.q('#st-tr-past .st-tr-past-h');
    assert.ok(h, 'the head');
    assert.equal(g.text(h.querySelector('.st-pill-n')), '7', 'every download so far, not only the rows listed');
    assert.match(g.text(h), new RegExp('^' + S.en.st_tr_past + ' 7 ' + S.en.st_tr_past_sub2 + '$'));
  });
  test('1b the columns, "PDF, sealed" or "CSV", the acts each carried, a dash for an older one', async () => {
    const g = data(); await settle(g);
    assert.deepEqual(g.qa('#st-tr-past thead th').map(th => g.text(th)), ['When', 'Who', 'Period', 'As', 'Acts']);
    const rows = g.qa('#st-tr-past tbody tr').map(r => [...r.querySelectorAll('td')].map(td => g.text(td)));
    assert.equal(rows.length, 2);
    assert.equal(rows[0][2], 'Q3 2026');
    assert.equal(rows[0][3], 'PDF, sealed');
    assert.match(rows[0][4], /^1[,.\s  ]?234$/);
    assert.equal(rows[1][3], 'CSV');
    assert.equal(rows[1][4], '—');
  });
});

describe('f787 (2) the count names what it leaves out', () => {
  test('2a by the names this admin already sees', async () => {
    const g = data(); await settle(g);
    const out = g.q('#st-tr-go .st-tr-out');
    assert.ok(out, 'said');
    assert.equal(g.text(out), '· Marketing & Brand left out: you are not named');
  });
});

describe('f787 (3) Jambo says the trail', () => {
  test('3a the period, its acts, the streams; who is left out', async () => {
    const g = data(); await settle(g);
    const said = g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub'));
    assert.match(said, /^The trail for Q3 2026 has 1[,.\s  ]?234 acts in the 5 streams you can see\. Marketing & Brand is left out, because you are not named on it\.$/);
    assert.equal(g.text(g.$('st-side-word')), S.en.st_p_backup, 'the panel\'s head says what it holds');
  });
  test('3c an empty period is said as empty, never "0 acts in the 0 streams"', async () => {
    const g = settingsStage({ reply: r => r === 'trail/exports' ? { exports: [], total: 0 } : /^trail\/summary\?/.test(r) ? { acts: 0, streams: 0, people: 0, leftOut: 0 } : null });
    g.sb.stDrawerOpen('trail'); await settle(g);
    assert.equal(g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub')), 'The trail for Q3 2026 is empty: nothing was done in the streams you can see.');
  });
  test('3b a code-named deal travels by its code name only — said', async () => {
    const g = data({ before: sb => { sb.state.contracts = [{ id: 'MK-9', _codeNamed: true, code: 'Falcon' }]; } }); await settle(g);
    assert.match(g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub')), new RegExp(S.en.st_jb_tr_code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  });
});

describe('f787 (4) his chips', () => {
  test('4a "download Q3 2026 as a PDF" readies the page, and downloads nothing', async () => {
    const g = data(); await settle(g);
    const chip = g.q('#st-jb-feed [data-st-tr-pdf]');
    assert.equal(chip.textContent, 'download Q3 2026 as a PDF');
    const before = g.log.api.length;
    g.click(chip); await settle(g);
    assert.equal(g.$('st-tr-as-sel').value, 'pdf', 'the As box says PDF');
    assert.ok(g.$('st-tr-download').classList.contains('st-lit'), 'Download is lit, still the reader\'s press');
    assert.ok(!g.log.api.slice(before).some(a => /export/.test(a.route)), 'nothing downloaded');
    const bubs = g.qa('#st-jb-feed .st-jb-bub').map(b => g.text(b));
    assert.equal(bubs[bubs.length - 1], S.en.st_jb_tr_pdf_ready);
  });
  test('4c from the Backup tab, the chip turns the page to The trail first', async () => {
    const g = data({ door: 'backup' }); await settle(g);
    assert.ok(g.$('bk-export'), 'Backup in front');
    g.click(g.q('#st-jb-feed [data-st-tr-pdf]')); await settle(g);
    assert.ok(g.q('[data-st-bk-tab="trail"].is-on'));
    assert.equal(g.$('st-tr-as-sel').value, 'pdf');
    assert.ok(g.$('st-tr-download').classList.contains('st-lit'), 'still lit after the count is drawn again');
  });
  test('4b "what is a sealed PDF?" is answered from what HaTi is, spending nothing', async () => {
    const g = data(); await settle(g);
    const chip = g.q('#st-jb-feed [data-st-jb-say="sealed"]');
    assert.equal(chip.textContent, 'what is a sealed PDF?');
    const before = g.log.api.length;
    g.click(chip); await settle(g);
    assert.ok(!g.log.api.slice(before).some(a => /^ai\//.test(a.route)), 'no AI route');
    const bubs = g.qa('#st-jb-feed .st-jb-bub').map(b => g.text(b));
    assert.equal(bubs[bubs.length - 1], S.en.st_jb_sealed_say);
  });
});

describe('f787 (5) the tabs inside the head card', () => {
  test('5a The trail · Backup, in the page\'s card, turning', async () => {
    const g = data(); await settle(g);
    const card = g.q('[data-st-pg="data"] .st-pg-card');
    const tabs = [...card.querySelectorAll('[data-st-bk-tab]')];
    assert.deepEqual(tabs.map(t => t.getAttribute('data-st-bk-tab')), ['trail', 'backup']);
    g.click(tabs[1]); await settle(g);
    assert.ok(g.$('bk-export'), 'Backup is in front');
    assert.ok(g.q('[data-st-pg="data"] .st-pg-card [data-st-bk-tab="backup"].is-on'), 'its tab lit, still in the card');
    g.click(g.q('[data-st-pg="data"] .st-pg-card [data-st-bk-tab="trail"]')); await settle(g);
    assert.ok(g.$('st-tr-past'), 'The trail is back');
  });
});
