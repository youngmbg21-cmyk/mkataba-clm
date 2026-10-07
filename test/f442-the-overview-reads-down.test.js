/* f442 — THE OVERVIEW READS DOWN (owner-picked 1 Oct 2026)

   *"create an easily readable Overview page that does not require me to jump
   from card to card ... it contains information that comes from reading the
   document and other information is entered therefore this should not
   change."* The owner picked "Read Down" from three drawn options, then asked
   for the "HaTi read this contract" strip at the top, no "In brief" paragraph,
   no contents list, and a Read the brief button at the start of the card.

   What this pins:
     · the deal is four groups, and every field of both lists lands in
       EXACTLY ONE of them — nothing that was on the card left the page
     · nothing on the sheet folds (no section carries a key)
     · each group's answer is built from the record, escapes what it quotes,
       and says nothing the record does not hold
     · Read the brief is the brief card's own door, not a new act
     · the Time Machine is drawn only off stored dates (7 Oct 2026)
     · one Edit turns both postures on and off

   Run: node --test test/f442-the-overview-reads-down.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const CONTRACT = read('js/views/contract.js');
const I18N = read('js/i18n.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return null;
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++; else if (ch === '}') depth--;
    i++;
  }
  return src.slice(m.index, i);
};

/* The same stage f351 uses: contract.js reads isMonetary and fmtMoneyOf off
   core.js, which no harness world loads. */
const ovWorld = () => {
  const w = buildWorld({ contractView: true, metadata: true });
  w.win.isMonetary = c => (c && c.valueType) !== 'none';
  w.win.fmtMoneyOf = c => 'KES ' + Number((c && c.value) || 0).toLocaleString('en');
  return w;
};
const supply = () => ({ id: 'MK-442', name: 'Cold-chain logistics', status: 'Draft',
  value: 18400000, audit: [], obligations: [], comments: [],
  fields: { effDate: '2025-03-01' }, expiry: '2027-02-28',
  metadata: { paymentTerms: '45 days from invoice', noticePeriodDays: 90 } });

describe('f442 (1) four questions, and every field answers one of them', () => {
  test('each field of both lists is in exactly one group', () => {
    const { win } = ovWorld();
    const seen = new Map();
    for (const g of win.OV_READ_GROUPS) {
      for (const k of g.deal.concat(g.also)) seen.set(k, (seen.get(k) || 0) + 1);
    }
    for (const k of win.OV_DEAL_FIELDS.concat(win.OV_ALSO_FIELDS))
      assert.equal(seen.get(k), 1, k + ' is drawn once, in one group');
    assert.equal(seen.size, win.OV_DEAL_FIELDS.length + win.OV_ALSO_FIELDS.length,
      'and no group names a field the lists do not have');
    for (const g of win.OV_READ_GROUPS) {
      for (const k of g.deal) assert.ok(win.OV_DEAL_FIELDS.includes(k), k + ' is a fixed term');
      for (const k of g.also) assert.ok(win.OV_ALSO_FIELDS.includes(k), k + ' is an occasional term');
    }
  });

  test('the groups are drawn in the order a person asks', () => {
    const { win } = ovWorld();
    assert.deepEqual(win.OV_READ_GROUPS.map(g => g.key), ['what', 'money', 'dates', 'risk']);
    const html = win.ktOverviewTermsHtml(supply(), { editable: true });
    const at = id => html.indexOf('id="' + id + '"');
    const order = ['ov-what', 'ov-money', 'ov-dates', 'ov-risk', 'ov-record'];
    order.forEach(id => assert.ok(at(id) > 0, id + ' is on the sheet'));
    for (let i = 1; i < order.length; i++)
      assert.ok(at(order[i - 1]) < at(order[i]), order[i - 1] + ' reads before ' + order[i]);
  });

  test('an occasional term is drawn only where answered, in its own group', () => {
    const { win } = ovWorld();
    const c = supply();
    let html = win.ktOverviewTermsHtml(c, { editable: false });
    assert.ok(!html.includes(win.ovMetaLabel('exclusivity')), 'unanswered, it is absent');
    c.metadata.exclusivity = 'exclusive';
    html = win.ktOverviewTermsHtml(c, { editable: false });
    /* The parties lead the essentials card since 7 Oct 2026, so Risks runs
       to The record. */
    const risk = html.slice(html.indexOf('id="ov-risk"'), html.indexOf('id="ov-record"'));
    assert.ok(risk.includes(win.ovMetaLabel('exclusivity')), 'answered, it is under Risks');
  });

  test('the edit posture still makes every field a box', () => {
    const { win } = ovWorld();
    const c = supply();
    win.ovSetEditing(`kt.${c.id}.deal`, true);
    const html = win.ktOverviewTermsHtml(c, { editable: true });
    win.ovSetEditing(`kt.${c.id}.deal`, false);
    const names = new Set((html.match(/data-kt="[a-zA-Z]+"|data-ktm="[a-zA-Z]+"/g) || [])
      .map(b => b.split('"')[1]));
    for (const k of win.OV_DEAL_FIELDS.concat(win.OV_ALSO_FIELDS)) {
      if (win.OV_DERIVED_FIELDS.has(k)) continue;
      assert.ok(names.has(k), k + ' can be typed on the sheet');
    }
  });
});

describe('f442 (2) nothing on the sheet folds', () => {
  test('no section the Overview draws carries a fold key', () => {
    for (const fn of ['ktOverviewTermsHtml', 'renderKeyTermsSide']) {
      const b = strip(fnBody(CONTRACT, fn));
      const calls = b.split('sectionHtml({').slice(1);
      assert.ok(calls.length >= 2, fn + ' draws sections');
      for (const c of calls) assert.ok(!/^\s*key:|[,{]\s*key:/.test(c.slice(0, 160)),
        fn + ' draws a section with no fold: ' + c.slice(0, 80));
    }
  });

  test('a section with no key draws its body, so nothing is hidden', () => {
    const { win } = ovWorld();
    const html = win.sectionHtml({ title: 'T', say: 'S', body: '<i>B</i>' });
    assert.ok(html.includes('<p class="sec-ans">S</p>') && html.includes('<i>B</i>'));
    assert.ok(!/data-sec-toggle/.test(html), 'and there is nothing to press');
  });

  test('a caller that passes no sentence gets the markup it always had', () => {
    const { win } = ovWorld();
    assert.ok(!/sec-ans/.test(win.sectionHtml({ key: 'x', title: 'T', body: 'B' })));
  });

  test('the lead slot above the stack is gone', () => {
    assert.ok(!/id="kt-ov-lead"/.test(strip(CONTRACT)), 'nothing draws it');
  });
});

describe('f442 (3) each group answers from the record, and says no more', () => {
  test('money: the value and the payment terms, in one sentence', () => {
    const { win } = ovWorld();
    const say = win.ovSayOf(supply(), 'money');
    assert.ok(say.includes('<b>KES 18,400,000</b>'), 'the value, set bold: ' + say);
    assert.ok(say.includes('45 days from invoice'), 'the terms, in their own words');
  });

  test('money: an agreement with no money says so', () => {
    const { win } = ovWorld();
    const c = supply(); c.valueType = 'none';
    assert.equal(win.ovSayOf(c, 'money'), win.i18t('ov_say_no_money'));
  });

  test('a value is escaped, never read as markup', () => {
    const { win } = ovWorld();
    const c = supply(); c.metadata.paymentTerms = '<img src=x onerror=alert(1)>';
    const say = win.ovSayOf(c, 'money');
    assert.ok(!/<img/.test(say) && /&lt;img/.test(say), 'the terms are text: ' + say);
  });

  test('dates: both ends, or the one the record holds, or nothing', () => {
    const { win } = ovWorld();
    const c = supply();
    assert.ok(/<b>.+<\/b>.*<b>.+<\/b>/.test(win.ovSayOf(c, 'dates')), 'from and to');
    delete c.fields.effDate;
    assert.ok(win.ovSayOf(c, 'dates').length > 0, 'the end alone is still a sentence');
    delete c.expiry;
    assert.equal(win.ovSayOf(c, 'dates'), '', 'with neither, no sentence is guessed');
  });

  test('the other groups draw no sentence of their own', () => {
    const { win } = ovWorld();
    assert.equal(win.ovSayOf(supply(), 'risk'), '');
    assert.equal(win.ovSayOf(supply(), 'what'), '');
  });

  test('no model is asked and nothing is written', () => {
    const b = strip(fnBody(CONTRACT, 'ovSayOf') + fnBody(CONTRACT, 'ovTmData') + fnBody(CONTRACT, 'ovTmHtml') + fnBody(CONTRACT, 'ovTmPaint'));
    assert.ok(!/api\(|fetch\(|persist\(|logAudit|runContractBrief|anthropic/.test(b));
  });
});

/* RE-POINTED IN PLACE 7 Oct 2026: Young picked "Time Machine under the
   essentials card" and "Fold them in". The thin line (ovTimelineHtml) is
   STALE; the Time Machine replaces it, and every claim the line carried is
   carried here — drawn only off stored dates, every point on the track, no
   label on another, one watcher — plus what the machine adds. The track is
   the artifact's own picture (Young: built exactly as designed). The day is
   pinned, never read off the clock. */
const tmWorld = () => { const w = ovWorld(); w.win.todayISO = () => '2026-01-15'; return w; };
const utc = s => Date.parse(s + 'T00:00:00Z');

describe('f442 (4) the Time Machine', () => {
  test('drawn where the dates exist and run forwards, with both ends and today', () => {
    const { win } = tmWorld();
    const html = win.ovTmHtml(supply());
    assert.ok(/class="ov-tm"/.test(html), 'it is drawn');
    assert.ok(/ov-tm-mk is-start/.test(html) && /ov-tm-mk is-end/.test(html) && /ov-tm-mk is-now/.test(html));
    assert.ok(/class="ov-tm-pic" data-tm-svg aria-hidden="true"><svg class="ov-tm-svg"/.test(html), 'the track is a picture; the read-outs speak');
    assert.ok(/type="range"[^>]*aria-label=/.test(html), 'the drag is a labelled control');
  });

  test('not drawn on no dates or a backwards pair; drawn on a start alone', () => {
    const { win } = tmWorld();
    const a = supply(); delete a.expiry; delete a.fields.effDate;
    assert.equal(win.ovTmHtml(a), '');
    const b = supply(); b.expiry = '2024-01-01';
    assert.equal(win.ovTmHtml(b), '');
    const job = supply(); delete job.expiry;
    const html = win.ovTmHtml(job);
    assert.ok(/ov-tm-line is-open/.test(html), 'a contract with no end (employment) draws an open line');
    assert.ok(!/ov-tm-mk is-end/.test(html), 'and invents no end');
  });

  test('every point is placed on the track, never off it', () => {
    const { win } = tmWorld();
    const c = supply();
    c.obligations = [{ id: 'o1', desc: 'Quarterly report', due: '2025-06-30', status: 'done', completedAt: '2025-06-28' },
      { id: 'o2', desc: 'Insurance certificate', due: '2025-12-31', status: 'open' }];
    const svg = win.ovTmTrackSvg(win.ovTmData(c), 900);
    const xs = (svg.replace(/<g class="ov-tm-cur"[\s\S]*$/, '').match(/\bx[12]?="(-?[\d.]+)"|\bcx="(-?[\d.]+)"/g) || [])
      .map(t => Number(t.split('"')[1]));
    assert.ok(xs.length >= 10);
    for (const v of xs) assert.ok(v >= 0 && v <= 900, 'inside the picture: ' + v);
  });

  test('drawn as the artifact draws it: years, bands, line, ticks, labels with leaders, diamonds, today, cursor', () => {
    const { win } = tmWorld();
    const c = supply();
    c.obligations = [{ id: 'o1', desc: 'Report', due: '2025-06-30', status: 'open' }];
    win.renewalWindow = () => ({ notice: 90, decideBy: '2026-11-30', missed: false, auto: true });
    const T = win.ovTmData(c), svg = win.ovTmTrackSvg(T, 900);
    for (const part of ['ov-tm-yr', 'ov-tm-band is-green', 'ov-tm-band is-amber', 'ov-tm-band is-steel is-dash',
      'ov-tm-line', 'ov-tm-el', 'ov-tm-after', 'ov-tm-oc', 'ov-tm-lead', 'ov-tm-lbl is-today',
      'ov-tm-mk is-start is-green', 'ov-tm-mk is-decide is-ruby', 'ov-tm-mk is-end is-steel',
      'ov-tm-today', 'ov-tm-pulse', 'ov-tm-cur'])
      assert.ok(svg.includes('class="' + part), part + ' is drawn');
    assert.ok(T.t1 > T.end, 'an auto-renewing end shows the year it renews into');
    const job = supply(); delete job.expiry;
    const open = win.ovTmTrackSvg(win.ovTmData(job), 900);
    assert.ok(open.includes('class="ov-tm-arrow"') && open.includes('ov-tm-band is-steel'), 'no end: an open arrow, a band that runs on');
  });

  test('a duty is late only on a day already behind us; an undated duty is not on the track', () => {
    const { win } = tmWorld();
    const c = supply();
    c.obligations = [{ id: 'o1', desc: 'Late one', due: '2025-12-31', status: 'open' },
      { id: 'o2', desc: 'Coming', due: '2026-03-01', status: 'open' },
      { id: 'o3', desc: 'No day', due: '', status: 'open' }];
    const T = win.ovTmData(c);
    assert.deepEqual(T.occ.map(o => o.t), ['Late one', 'Coming'], 'the undated duty stays on the Obligations tab');
    assert.equal(win.ovTmAt(T, T.today).late, 1, 'today: the December duty is late');
    const later = win.ovTmAt(T, utc('2026-06-01'));
    assert.equal(later.late, 1, 'on a future day, a duty still to do is not called late');
    assert.equal(win.ovTmOccState(T.occ[1], utc('2026-06-01'), T.today), 'p');
    assert.equal(win.ovTmAt(T, T.today).next.t, 'Coming', 'the next deadline after the day');
  });

  test('a signed amendment is a mark from the day it was signed; an unsigned one is not', () => {
    const { win } = tmWorld();
    const c = supply();
    win.familyOrder = () => [{ doc: c }, { doc: { id: 'MK-442-A1' }, signed: '2025-09-01' }, { doc: { id: 'MK-442-A2' }, signed: '' }];
    win.contractRef = d => d.id;
    const T = win.ovTmData(c);
    assert.deepEqual(T.marks.filter(m => m.k === 'amend').map(m => m.word), ['MK-442-A1']);
    assert.equal(T.kids.length, 2, 'both are listed under "in force on this date"');
    assert.equal(T.kids[1].signed, null);
  });

  test('the renewal deadline is on the track, and its question sits under it', () => {
    const { win } = tmWorld();
    const c = supply();
    win.renewalWindow = () => ({ notice: 90, decideBy: '2026-11-30', missed: false, auto: true });
    const T = win.ovTmData(c);
    assert.ok(T.marks.some(m => m.k === 'decide' && m.at === utc('2026-11-30')));
    assert.ok(T.marks.some(m => m.k === 'end' && /renew/i.test(m.word)), 'an auto-renewing end says so');
    const html = win.ktOverviewTermsHtml(c, { editable: false });
    const card = html.slice(html.indexOf('ov-tm-card'));
    assert.ok(/id="renewal-host" class="empty:hidden" data-bare="1"/.test(card), 'the one host, in the machine');
    assert.equal((html.match(/id="renewal-host"/g) || []).length, 1, 'and only one');
  });

  test('the jump on the shown day is the pressed one', () => {
    const { win } = tmWorld();
    const html = win.ovTmHtml(supply());
    const pressed = html.match(/data-tm-j="(\d+)" aria-pressed="true"/g) || [];
    assert.equal(pressed.length, 1, 'exactly one lit at rest');
    assert.ok(pressed[0].includes(String(utc('2026-01-15'))), 'and it is Today');
    assert.ok(/aria-pressed',String\(\+b\.getAttribute\('data-tm-j'\)===d\)/.test(strip(fnBody(CONTRACT, 'ovTmWire'))),
      'every move re-lights the jump standing on the day');
    assert.ok(/\.ov-tm-ctl \.ui-btn\[aria-pressed="true"\]\{ background:var\(--color-text\)/.test(read('index.html')),
      'and the lit one is filled, so you can see which you pressed');
  });

  test('labels never sit on each other, and the picture is drawn at the track\'s width', () => {
    const { win } = tmWorld();
    const c = supply();
    win.familyOrder = () => [{ doc: c }, { doc: { id: 'A-1' }, signed: '2026-01-14' }, { doc: { id: 'A-2' }, signed: '2026-01-16' }];
    win.contractRef = d => d.id;
    const svg = win.ovTmTrackSvg(win.ovTmData(c), 400);
    const rows = {};
    for (const m of svg.matchAll(/<text class="ov-tm-lbl[^"]*" x="([\d.]+)" y="(\d+)"[^>]*><title>[^<]*<\/title>([^<]*)<\/text>/g)) {
      const w = m[3].length * 6.2 + 10, x = Number(m[1]);
      (rows[m[2]] = rows[m[2]] || []).push([x - w / 2, x + w / 2]);
    }
    for (const r of Object.values(rows)) {
      r.sort((a, b) => a[0] - b[0]);
      for (let i = 1; i < r.length; i++) assert.ok(r[i][0] >= r[i - 1][1] - 0.5, 'two labels in one row overlap');
    }
    const wire = strip(fnBody(CONTRACT, 'ovTmWire'));
    assert.ok(/ovTmTrackSvg\(T,w\)/.test(wire) && /clientWidth/.test(wire), 'redrawn at the track\'s own width');
    assert.ok(/disconnect\(\)/.test(wire), 'the old watcher stops before a new one starts');
    assert.ok(/ovTmWire\(host,c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTerms'))),
      'and the painter that drew the machine wires it');
    assert.ok(/isConnected/.test(wire), 'Play stops when the machine leaves the page');
  });
});

describe('f442 (5) Read the brief, and one Edit', () => {
  test('the button is the brief card\'s own door', () => {
    const b = strip(fnBody(CONTRACT, 'paintOvBriefBtn'));
    assert.ok(/data-kt-brief="open"/.test(b), 'Read the brief opens what the card opens');
    assert.ok(/data-kt-brief="run"/.test(b), 'with no brief, it is the card\'s Write');
    assert.ok(/wireKtBriefCard\(c,/.test(b), 'wired by the one handler, never a second');
    assert.ok(/br_open/.test(b) && /sc_brief_title/.test(b), 'its words are the card\'s, and the cost is on the hover');
  });

  test('it starts the sheet, and both painters keep it current', () => {
    const terms = strip(fnBody(CONTRACT, 'ktOverviewTermsHtml'));
    assert.ok(terms.indexOf('id="kt-ov-brief"') >= 0 &&
      terms.indexOf('id="kt-ov-brief"') < terms.indexOf('sectionHtml({'),
      'the slot is at the top of the sheet, before any group');
    assert.ok(/paintOvBriefBtn\(c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTerms'))));
    assert.ok(/paintOvBriefBtn\(c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTermsSide'))));
  });

  test('one Edit turns both postures together', () => {
    const r = strip(fnBody(CONTRACT, 'renderKeyTerms'));
    assert.ok(/k==='all'/.test(r), 'the sheet\'s Edit is handled');
    assert.ok(/ovSetEditing\(dk,on\); ovSetEditing\(rk,on\)/.test(r), 'and moves both');
    const terms = strip(fnBody(CONTRACT, 'ktOverviewTermsHtml'));
    assert.equal((terms.match(/data-ov-edit=/g) || []).length, 1, 'one Edit on the sheet');
  });
});

describe('f442 (6) every new key is in both books', () => {
  const KEYS = ['ov_g_what', 'ov_g_money', 'ov_g_dates', 'ov_g_risk', 'ov_say_worth',
    'ov_say_paid', 'ov_say_no_money', 'ov_say_runs', 'ov_say_ends', 'ov_say_started',
    'ov_say_auto', 'ov_say_notice', 'ov_tl_start', 'ov_tl_today', 'ov_tl_decide', 'ov_tl_end'];
  test('each is declared twice', () => {
    for (const k of KEYS)
      assert.equal(I18N.split(new RegExp('\\b' + k + ':')).length - 1, 2, k + ' is in both books');
  });
});

/* ============================================================================
   7 · THE BRIEF BUTTON IS COLOURED, AND IT OPENS AND SHUTS (owner-asked
   1 Oct 2026: "make the brief button more visible by making it a colored
   button. Also, when i press it once the brief appear but when i press it
   again, the brief should disappear.")
   ==========================================================================*/
describe('f442 (7) the brief button is coloured, and a second press shuts the brief', () => {
  test('both of its faces are the filled button', () => {
    const b = strip(fnBody(CONTRACT, 'paintOvBriefBtn'));
    assert.ok(/data-kt-brief="open" class="ui-btn ui-btn-sm ui-btn-primary"/.test(b), 'Read the brief is filled');
    assert.ok(/data-kt-brief="run" class="ui-btn ui-btn-sm ui-btn-primary"/.test(b), 'and so is Write the brief');
  });

  test('it stays the ONE filled button at the head of the sheet', () => {
    const top = strip(fnBody(CONTRACT, 'ktOverviewTermsHtml'));
    const head = top.slice(top.indexOf('const top='), top.indexOf('const groups='));
    assert.ok(head.length > 0, 'the head row was found');
    assert.ok(!/ui-btn-primary|ui-btn-accent/.test(head), 'Edit and Fill beside it stay plain');
  });

  test('every door onto the brief is the one toggle', () => {
    assert.ok(/briefPanelToggle\(c\)/.test(strip(fnBody(CONTRACT, 'wireKtBriefCard'))),
      'the sheet\'s button and the card\'s button');
    assert.ok(/briefPanelToggle\(c\)/.test(strip(fnBody(CONTRACT, 'paintKtTriage'))),
      'and the strip\'s tile');
  });

  test('driven: a press opens it, the next press shuts it', () => {
    const { win } = ovWorld();
    const doc = win.document;
    let opened = 0, closed = 0;
    /* The panel itself is openSidePanel's; the stage stands in for it with the
       same element the real one draws, so the toggle reads the real shape. */
    win.openCheckPanel = (c, kind) => {
      opened++;
      doc.getElementById('modal-root').innerHTML =
        `<aside id="side-panel" data-cid="${c.id}"><div id="${kind}-section"></div></aside>`;
    };
    win.closeModal = () => { closed++; doc.getElementById('modal-root').innerHTML = ''; };
    if (!doc.getElementById('modal-root')) {
      const r = doc.createElement('div'); r.id = 'modal-root'; doc.body.appendChild(r);
    }
    const c = supply();
    assert.equal(win.briefPanelOpenFor(c), false, 'shut at rest');
    assert.equal(win.briefPanelToggle(c), true);
    assert.ok(win.briefPanelOpenFor(c) && opened === 1, 'the first press opens it');
    assert.equal(win.briefPanelToggle(c), false);
    assert.ok(!win.briefPanelOpenFor(c) && closed === 1, 'the second press shuts it');
    assert.equal(win.briefPanelToggle(c), true);
    assert.ok(win.briefPanelOpenFor(c) && opened === 2, 'and a third opens it again');
  });

  test('another panel, or another contract\'s brief, is not shut by it', () => {
    const { win } = ovWorld();
    const doc = win.document;
    if (!doc.getElementById('modal-root')) {
      const r = doc.createElement('div'); r.id = 'modal-root'; doc.body.appendChild(r);
    }
    doc.getElementById('modal-root').innerHTML =
      '<aside id="side-panel" data-cid="MK-442"><div id="playbook-section"></div></aside>';
    assert.equal(win.briefPanelOpenFor(supply()), false, 'the playbook panel is not the brief');
    doc.getElementById('modal-root').innerHTML =
      '<aside id="side-panel" data-cid="MK-OTHER"><div id="brief-section"></div></aside>';
    assert.equal(win.briefPanelOpenFor(supply()), false, 'another contract\'s brief is not this one');
  });
});
