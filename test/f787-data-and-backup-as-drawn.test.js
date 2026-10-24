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
  /* RE-POINTED (third pass): every door saying "Data & backup" lands on its
     first tab, The trail (one name, one landing); Backup is its tab's press */
  if (opts.door === 'backup') { const b = g.q('[data-st-bk-tab="backup"]'); if (b) g.click(b); }
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
    assert.equal(g.$('st-side-word'), null, 'one window: the panel\'s head names nothing (owner, 24 Oct 2026)');
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
  /* RE-POINTED (third pass): the chip as drawn, "download Q3 as a PDF" (no
     year for this year's quarter), and Download lit by LAND ON IT's lander */
  test('4a "download Q3 as a PDF" readies the page, and downloads nothing', async () => {
    const g = data(); await settle(g);
    const chip = g.q('#st-jb-feed [data-st-tr-pdf]');
    assert.equal(chip.textContent, 'download Q3 as a PDF');
    const before = g.log.api.length;
    g.click(chip); await settle(g);
    assert.equal(g.$('st-tr-as-sel').value, 'pdf', 'the As box says PDF');
    assert.ok(g.log.landed.some(l => l.t === '#st-tr-download'), 'Download is landed on, still the reader\'s press');
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
    assert.ok(g.log.landed.some(l => l.t === '#st-tr-download'), 'Download landed on (the lander follows it through the repaint — the browser check)');
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

/* ---- THE SECOND PASS (18 Oct 2026): the checker's differences against the
   picked drawing, built. AT THE PARENT (8dc306a) every test below fails. ---- */
describe('f787 (6) Data & backup opens on The trail; Jambo counts it on either tab', () => {
  test('6a Housekeeping\'s "Data & backup ›" lands on The trail; so does every door that says Data & backup', async () => {
    const g = settingsStage({ reply: (r) => { if (r === 'trail/exports') return { exports: EXPORTS, total: 7 }; if (/^trail\/summary\?/.test(r)) return SUM; return null; } });
    g.sb.settingsGoTab('company');
    g.click(g.q('[data-st-card="house"] .st-door[data-st-page="data"]')); await settle(g);
    assert.equal(g.q('[data-st-bk-tab].is-on').getAttribute('data-st-bk-tab'), 'trail', 'The trail lit');
    assert.equal(g.q('#set-page').getAttribute('data-st-sub'), 'data', 'the page starts at its own name');
    /* RE-POINTED (third pass): the Menu's "Data & backup" (the drawer key
       'backup') lands where the card's door lands — one name, one landing */
    g.sb.settingsGoPage(''); g.sb.stDrawerOpen('backup'); await settle(g);
    assert.equal(g.q('[data-st-bk-tab].is-on').getAttribute('data-st-bk-tab'), 'trail');
  });
  test('6b on Backup, Jambo still says the trail\'s count — it is read whichever tab is in front', async () => {
    const g = data({ door: 'backup' }); await settle(g);
    assert.ok(g.$('bk-export'), 'Backup in front');
    assert.ok(g.log.api.some(a => /^trail\/summary\?/.test(a.route)), 'the count was asked');
    assert.match(g.text(g.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub')), /^The trail for Q3 2026 has 1,234 acts/);
  });
  test('6c while he counts, the ring turns; a count that cannot be read is said, never "counting" for ever', async () => {
    const wait = data({ before: sb => { sb.busyHtml = t => '<span class="ob-spin" aria-hidden="true"></span>' + t; },
      reply: r => /^trail\/summary\?/.test(r) ? new Promise(() => {}) : null });
    /* the stage's own reply answers the summary first; ask again with one that never comes */
    wait.sb.stJbDataRepaint();
    const bub = () => wait.q('#st-jb-feed [data-st-jb-hello] .st-jb-bub');
    require('node:vm').runInContext('_stTr.sum=null;_stTr.sumKey="";_stTr.sumErr="";', wait.sb); wait.sb.stJbDataRepaint();
    assert.ok(bub().querySelector('.ob-spin'), 'the turning ring');
    assert.match(wait.text(bub()), /^I am counting the trail for Q3 2026\./);
    require('node:vm').runInContext('_stTr.sumErr="x";', wait.sb); wait.sb.stJbDataRepaint();
    assert.equal(bub().querySelector('.ob-spin'), null);
    assert.match(wait.text(bub()), new RegExp('^' + S.en.st_jb_tr_failed.replace('{period}', 'Q3 2026').replace(/[.]/g, '\\.')));
  });
  test('6d the Streams box says "All you can see", in both books', async () => {
    const g = data(); await settle(g);
    assert.equal(g.text(g.q('#st-tr-stream option[value="all"]')), 'All you can see');
    assert.equal(S.sv.st_tr_all, 'Allt du kan se');
  });
});

/* ---- THE THIRD PASS (19 Oct 2026): the checker's differences after main
   moved on, built. AT THE PARENT (5aea3f2, main merged in, before this pass)
   every test below fails. ---- */
describe('f787 (7) the third pass: the chip says "Q3", Who is a plain name, one landing for Data & backup', () => {
  test('7a this year\'s quarter is "Q3" on the chip; another year\'s keeps its year', async () => {
    const g = data(); await settle(g);
    assert.equal(g.sb.stTrailPeriodWords('2026-07-01', '2026-09-30', true), 'Q3');
    assert.equal(g.sb.stTrailPeriodWords('2025-07-01', '2025-09-30', true), 'Q3 2025');
    assert.equal(g.sb.stTrailPeriodWords('2026-07-01', '2026-09-30'), 'Q3 2026', 'the table keeps the year');
    for (const lang of ['en', 'sv']) assert.equal(typeof S[lang].st_tr_quarter_short, 'string');
  });
  test('7b Downloads so far: Who in the weight of its row', () => {
    const HTML = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
    assert.match(HTML, /\.st-tr-tb \.st-ps-who\{ font-weight:var\(--w-body\); \}/);
  });
  test('7c the chip lands on Download through the one lander, and draws no glow of its own', async () => {
    const g = data(); await settle(g);
    g.click(g.q('#st-jb-feed [data-st-tr-pdf]')); await settle(g);
    assert.ok(g.log.landed.some(l => l.t === '#st-tr-download'));
    assert.ok(!g.$('st-tr-download').classList.contains('st-lit'), 'no st-lit');
  });
});
