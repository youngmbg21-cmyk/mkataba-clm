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
     · the timeline is drawn only where both dates exist and run forwards
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
    const risk = html.slice(html.indexOf('id="ov-risk"'), html.indexOf('id="ov-parties"') > 0
      ? html.indexOf('id="ov-parties"') : html.indexOf('id="ov-record"'));
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
    const b = strip(fnBody(CONTRACT, 'ovSayOf') + fnBody(CONTRACT, 'ovTimelineHtml'));
    assert.ok(!/api\(|fetch\(|persist\(|logAudit|runContractBrief|anthropic/.test(b));
  });
});

describe('f442 (4) the timeline', () => {
  test('drawn where both dates exist and run forwards', () => {
    const { win } = ovWorld();
    const html = win.ovTimelineHtml(supply());
    assert.ok(/class="ov-tl"/.test(html), 'it is drawn');
    assert.ok(/ov-tl-pt is-start/.test(html) && /ov-tl-pt is-end/.test(html), 'with both ends');
    assert.ok(/aria-hidden="true"/.test(html), 'a picture of facts the grid prints');
  });

  test('not drawn on a missing or backwards date', () => {
    const { win } = ovWorld();
    const a = supply(); delete a.expiry;
    assert.equal(win.ovTimelineHtml(a), '');
    const b = supply(); b.expiry = '2024-01-01';
    assert.equal(win.ovTimelineHtml(b), '');
    const c = supply(); c.fields.effDate = 'not a date';
    assert.equal(win.ovTimelineHtml(c), '');
  });

  test('every point is placed on the line, never off it', () => {
    const { win } = ovWorld();
    const lefts = (win.ovTimelineHtml(supply()).match(/left:(-?[\d.]+)%/g) || [])
      .map(x => Number(x.slice(5, -1)));
    assert.ok(lefts.length >= 4);
    for (const l of lefts) assert.ok(l >= 0 && l <= 100, 'inside the line: ' + l);
  });

  test('labels are moved after the paint, by measuring, and one watcher at a time', () => {
    const settle = strip(fnBody(CONTRACT, 'ovTimelineSettle'));
    assert.ok(/getBoundingClientRect/.test(settle), 'it measures');
    const watch = strip(fnBody(CONTRACT, 'ovTimelineWatch'));
    assert.ok(/disconnect\(\)/.test(watch), 'the old watcher stops before a new one starts');
    assert.ok(/ovTimelineWatch\(host\)/.test(strip(fnBody(CONTRACT, 'renderKeyTerms'))),
      'and the painter that drew the line settles it');
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
