/* f442 — THE OVERVIEW READS DOWN (owner-picked 1 Oct 2026)

   *"create an easily readable Overview page that does not require me to jump
   from card to card ... it contains information that comes from reading the
   document and other information is entered therefore this should not
   change."* The owner picked "Read Down" from three drawn options, then asked
   for the "HaTi read this contract" strip at the top, no "In brief" paragraph,
   no contents list, and a Read the brief button at the start of the card.

   What this pins (re-pointed 8 Oct 2026, the Constellation page):
     · the essentials card holds every fixed term once, in the mock-up's
       order, occasional terms only where answered, every one a box in Edit
     · nothing on the page folds (no section carries a key)
     · the map is drawn from stored facts only — value and terms, who pays
       from a duty or the roles (never guessed), each side's duties
     · the map is the mock-up's picture; its panel holds the map card's height
     · Read the brief is the brief card's own door, not a new act
     · one Edit turns both postures on and off; filing opens on the ⋯ row

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

/* RE-POINTED IN PLACE 8 Oct 2026: Young picked the Constellation ("it should
   be exactly as designed in the mock up"), then: "Bring this back" — the
   essentials card. The four groups (OV_READ_GROUPS) and their sentences
   (ovSayOf) are STALE; the terms are ONE grid on the essentials card, in the
   mock-up's order (OV_ESS_FIELDS), and every claim the groups carried —
   nothing left the page, occasional terms only where answered, every field a
   box in the edit posture — is carried here. */
describe('f442 (1) the essentials card holds every term, once', () => {
  test('each fixed term is in the essentials order exactly once', () => {
    const { win } = ovWorld();
    const seen = new Map();
    for (const k of win.OV_ESS_FIELDS) seen.set(k, (seen.get(k) || 0) + 1);
    for (const k of win.OV_DEAL_FIELDS) assert.equal(seen.get(k), 1, k + ' is drawn once');
    assert.equal(seen.size, win.OV_DEAL_FIELDS.length, 'and no term the list does not have');
  });

  test('the order is the mock-up\'s: what it is and its law, then dates, then money, then exposure', () => {
    const { win } = ovWorld();
    assert.deepEqual(win.OV_ESS_FIELDS.slice(0, 3), ['contractType', 'governingLaw', 'disputes']);
    assert.ok(win.OV_ESS_FIELDS.indexOf('effDate') < win.OV_ESS_FIELDS.indexOf('value'));
    assert.ok(win.OV_ESS_FIELDS.indexOf('paymentTerms') < win.OV_ESS_FIELDS.indexOf('liabilityCapped'));
    const html = win.ktOverviewTermsHtml(supply(), { editable: true });
    const at = id => html.indexOf('id="' + id + '"');
    ['kt-ov-brief', 'ov-ess', 'ov-parties', 'ov-facts'].forEach(id => assert.ok(at(id) >= 0, id + ' is drawn'));
    assert.ok(at('kt-ov-brief') < at('ov-ess') && at('ov-parties') < at('ov-facts'),
      'Read the brief first, then the parties beside the terms');
  });

  /* RE-POINTED IN PLACE 8 Oct 2026 (the Overview redesign; Young: "the terms
     should be exactly like the highlighted area and nothing more"): AT REST the
     Terms column draws the eight and nothing else — an occasional term, even
     answered, waits in Edit; a field a check holds is never hidden. */
  test('at rest the terms are the eight, in the redesign\'s order, and nothing else', () => {
    const { win } = ovWorld();
    assert.deepEqual(win.OV_ESS_REST, ['contractType', 'governingLaw', 'disputes', 'value', 'term', 'renewalType', 'paymentTerms', 'liabilityCapped']);
    const c = supply();
    c.metadata.exclusivity = 'exclusive';
    const html = win.ktOverviewTermsHtml(c, { editable: false });
    const facts = html.slice(html.indexOf('id="ov-facts"'));
    assert.ok(!facts.includes(win.ovMetaLabel('exclusivity')), 'an answered occasional term is not on the resting card');
    assert.equal((win.ovEssRestHtml(c, null).match(/class="sec-f-l"/g) || []).length, 8, 'eight cells');
    assert.ok(!/ov-reads|what-copilot-read/i.test(facts), 'no readings table');
  });

  test('the renewal cell says the notice and its day; Edit and Fill ride the top row', () => {
    const { win } = ovWorld();
    win.todayISO = () => '2026-10-08';
    const c = supply(); c.metadata.renewalType = 'auto-renew';
    const cell = win.ovEssRestHtml(c, null);
    assert.ok(cell.includes(win.i18t('ov_f_renewal')));
    assert.ok(/90/.test(cell), 'the notice period is in the renewal cell');
    const html = win.ktOverviewTermsHtml(c, { editable: true, readable: true });
    const top = html.slice(0, html.indexOf('id="ov-ess"'));
    assert.ok(/data-ov-edit="all"/.test(top) && /id="kt-fill"/.test(top), 'Edit and Fill are on the top row');
    const head = html.slice(html.indexOf('id="ov-facts"'), html.indexOf('id="kt-rows"'));
    assert.ok(!/data-ov-edit|kt-fill/.test(head), 'the Terms heading holds only its caption and the hold chip');
  });

  test('more parties scroll inside their column; the card never grows', () => {
    const { win } = ovWorld();
    const c = supply();
    c.parties = [{ id: 'a', side: 'ours', name: 'A' }, { id: 'b', side: 'theirs', name: 'B' }, { id: 'c', side: 'theirs', name: 'C' }, { id: 'd', side: 'theirs', name: 'D' }];
    const html = win.ktOverviewTermsHtml(c, { editable: false });
    const list = html.slice(html.indexOf('class="ov-pty-list"'));
    assert.equal((list.slice(0, list.indexOf('id="ov-facts"')).match(/class="ov-pty"/g) || []).length, 4, 'all four are in the list');
    assert.match(read('index.html'), /\.ov-pty-list\{ flex:1 1 0; min-height:136px; contain:size; overflow-y:auto;/, 'the list is kept out of the row\'s height and scrolls');
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
      assert.ok(names.has(k), k + ' can be typed on the card');
    }
  });

  test('the filing rows open only when asked (the ⋯ row, Edit, or a field the signing list points at)', () => {
    const { win } = ovWorld();
    const c = supply();
    assert.ok(!/id="ov-record"/.test(win.ktOverviewTermsHtml(c, { editable: true })), 'at rest the filing is not on the page');
    win.ovSetEditing(`kt.${c.id}.record`, true);
    const html = win.ktOverviewTermsHtml(c, { editable: true });
    win.ovSetEditing(`kt.${c.id}.record`, false);
    assert.ok(/id="ov-record"/.test(html) && /id="kt-rows-record"/.test(html), 'opened, its rows are there');
    const open = strip(fnBody(CONTRACT, 'ovOpenFiling'));
    assert.ok(/ovSetEditing\(OV_KEY\(c,'record'\), true\)/.test(open) && /roomGoTab\(c,'terms'\)/.test(open),
      'the ⋯ row turns the same posture on and goes to the Overview');
    assert.ok(/id="ws-filing"/.test(CONTRACT) && /ws-filing'\)\?\.addEventListener\('click',\(\)=>ovOpenFiling\(c\)\)/.test(CONTRACT),
      'the row is on the room\'s ⋯ menu');
    assert.ok(/headAct\('ws-filing'/.test(read('js/views/negotiation.js')), 'and answered on the negotiate page too');
  });
});

describe('f442 (2) nothing on the sheet folds', () => {
  test('no section the Overview draws carries a fold key', () => {
    for (const fn of ['ktOverviewTermsHtml', 'renderKeyTermsSide']) {
      const b = strip(fnBody(CONTRACT, fn));
      const calls = b.split('sectionHtml({').slice(1);
      assert.ok(calls.length >= 1, fn + ' draws sections');
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

/* ============================================================================
   (3)(4) THE CONSTELLATION (8 Oct 2026). Every line on the map is a stored
   fact: the value and terms (where money passes), who pays read from a duty
   to pay and then from the parties' roles — never guessed — and each side's
   recorded duties. The panel beside the map holds the map card's height.
   ==========================================================================*/
const mapWorld = () => { const w = ovWorld(); w.win.todayISO = () => '2026-01-15'; return w; };
const withParties = (c, us, them) => Object.assign(c, { counterparty: them.name,
  parties: [Object.assign({ id: 'py_us', side: 'ours' }, us), Object.assign({ id: 'py_th', side: 'theirs' }, them)] });

/* RE-POINTED IN PLACE 8 Oct 2026 (the Overview redesign): the Constellation's
   money lines and people are STALE; the map is the DUTIES map — our ring of
   duties, the first outside party, the contract between, an arc for what we
   owe and a dashed arc for what they owe — and its panel reads the renewal,
   our duties or theirs. */
describe('f442 (3) the map is drawn from stored facts', () => {
  test('duties: each side\'s recorded duties, their states, and the next open one', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'Highland' }, { name: 'Juno' });
    c.obligations = [{ id: 'o1', desc: 'Send the forecast', due: '2026-02-01', party: 'ours', status: 'open' },
      { id: 'o2', desc: 'Deliver stock', due: '2025-12-01', party: 'theirs', status: 'open' },
      { id: 'o3', desc: 'Old report', due: '2025-06-01', party: 'theirs', status: 'done' }];
    const D = win.ovMapData(c);
    assert.equal(D.duties.ours.length, 1); assert.equal(D.duties.theirs.length, 2);
    assert.equal(D.next.ours.t, 'Send the forecast');
    assert.equal(D.duties.ours[0].st, 'a', 'due within 21 days is due soon');
    assert.equal(D.parties[1].worst, 'r', 'a duty past its day is late');
    assert.ok(!('flows' in D), 'no money line is read any more');
  });

  test('due soon is the same 21 days Overview 2 counts', () => {
    assert.match(CONTRACT, /const OV_MAP_SOON_DAYS=21;/);
  });

  test('the renewal is read off the record: end, notice by, type, and the wording HaTi read', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'A' }, { name: 'B' });
    c.metadata.renewalType = 'auto-renew';
    c.metadata.sourceSpans = { renewalType: 'This Agreement shall automatically renew.' };
    const R = win.ovMapRenewal(c);
    assert.equal(R.end, '2027-02-28'); assert.equal(R.next, '2027-03-01'); assert.equal(R.notice, 90);
    assert.ok(R.by, 'a notice day'); assert.ok(R.auto);
    assert.equal(R.quote, 'This Agreement shall automatically renew.');
    delete c.metadata.sourceSpans;
    assert.equal(win.ovMapRenewal(c).quote, '', 'no wording kept, none invented');
  });

  test('the signer under each party is read from the signing plan', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'Highland' }, { name: 'Juno' });
    c.signerPlan = [{ id: 's1', party: 'internal', name: 'Wanjiru', signed: true, at: '2026-01-10' },
      { id: 's2', party: 'counterparty', name: 'Daniel' }];
    const D = win.ovMapData(c);
    assert.deepEqual(D.parties[0].signs.map(r => r.n), ['Wanjiru']);
    assert.ok(D.parties[0].signs[0].signed);
    assert.deepEqual(D.parties[1].signs.map(r => r.n), ['Daniel']);
  });

  test('no model is asked and nothing is written', () => {
    const b = strip(fnBody(CONTRACT, 'ovMapData') + fnBody(CONTRACT, 'ovMapSvg') + fnBody(CONTRACT, 'ovMapPane') + fnBody(CONTRACT, 'ovMapRenewal'));
    assert.ok(!/api\(|fetch\(|persist\(|logAudit|runContractBrief|anthropic/.test(b));
  });
});

describe('f442 (4) the map is drawn as the redesign draws it', () => {
  /* RE-POINTED IN PLACE 9 Oct 2026 (Young: the map a third smaller, the circles
     half as small, the lines live): a 600x310 stage at the old scale. */
  test('one 600x310 picture: our node, theirs, the contract, an arc above and a dashed arc below', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'Highland Corporate Ltd' }, { name: 'Juno Limited' });
    c.obligations = [{ id: 'o1', desc: 'Pay', due: '2026-02-15', party: 'ours', status: 'open' }];
    const svg = win.ovMapSvg(win.ovMapData(c));
    assert.ok(svg.includes('viewBox="0 0 600 310"'));
    assert.ok(/translate\(150 160\)/.test(svg) && /translate\(450 160\)/.test(svg), 'the two nodes, a third closer');
    assert.ok(/<circle r="32" class="ov-map-us-c"/.test(svg) && /<circle r="33" class="ov-map-them-c"/.test(svg), 'the circles half their old size (64, 66)');
    assert.ok(svg.includes('M196 128 Q300 52 404 128') && svg.includes('M404 192 Q300 268 196 192'), 'the two arcs, ending clear of the rings: we owe runs us → them, they owe them → us');
    assert.equal((svg.match(/class="ov-map-mote is-/g) || []).length, 1, 'one moving dot per duty');
    assert.ok(/<animateMotion[^>]*><mpath href="#ov-map-p-ours"\/>/.test(svg) && /id="ov-map-p-ours"/.test(svg), 'it travels our curve');
    assert.equal((svg.match(/data-ov-map="ours"/g) || []).length, 2, 'our node and the upper arc both read our duties');
    assert.equal((svg.match(/data-ov-map="theirs"/g) || []).length, 2, 'their node and the lower arc read theirs');
    assert.equal((svg.match(/data-ov-map="renewal"/g) || []).length, 1, 'the contract reads the renewal');
    c.parties.push({ id: 'py_3', side: 'theirs', name: 'Kivu Retail' });
    assert.ok(!/Kivu/.test(win.ovMapSvg(win.ovMapData(c))), 'a third party has no node: duties name only us and the first outside party');
  });

  test('our ring has one piece per duty, coloured by state, with a badge only when one is late', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'A' }, { name: 'B' });
    c.obligations = [
      { id: 'o1', desc: 'Pay', due: '2020-01-01', party: 'ours', status: 'open' },
      { id: 'o2', desc: 'Report', due: '2020-01-01', party: 'ours', status: 'done' },
    ];
    let svg = win.ovMapSvg(win.ovMapData(c));
    assert.equal((svg.match(/class="ov-map-seg is-/g) || []).length, 2);
    assert.ok(/ov-map-seg is-r/.test(svg) && /ov-map-seg is-g/.test(svg));
    assert.ok(/ov-map-badge is-r/.test(svg), 'a late duty raises the badge');
    /* RE-POINTED IN PLACE 9 Oct 2026 (work order Part 9): with no duties
       recorded no curve, ring or "0 duties" is drawn; the map's own line
       says so, with a door to the Obligations tab. */
    c.obligations = [];
    svg = win.ovMapSvg(win.ovMapData(c));
    assert.ok(!/ov-map-track|ov-map-badge|ov-map-ln|0 duties/.test(svg), 'no duties: no ring, no badge, no curves, no "0 duties"');
    const html = win.ovMapHtml(c);
    assert.ok(html.includes(win.i18t('ov_map_empty')) && /data-ov-map-oblig/.test(html), 'and one quiet line with the door to Obligations');
  });

  /* RE-POINTED IN PLACE 9 Oct 2026: the map takes two thirds of its old width,
     the panel the rest; the stage keeps the old picture's height (Young: "the
     card height should stay the same") — measured in duties-map-verify (7). */
  test('the panel beside the map holds the map card\'s height and scrolls', () => {
    const html = read('index.html');
    assert.match(html, /\.ov-map-grid\{ display:grid; grid-template-columns:calc\(\(100% - 352px\) \* 2 \/ 3\) minmax\(0,1fr\); gap:12px; align-items:stretch; \}/);
    assert.match(html, /#ov-map \.ov-map-stage\{ flex:none; height:calc\(\(100cqw - 354px\) \* 310 \/ 900\); \}/, 'the old full-width picture\'s height');
    assert.match(html, /\.ov-map-side\{[^}]*contain:size;/, 'its words never stretch the row');
    assert.match(html, /\.ov-map-pane\{[^}]*overflow-y:auto;/, 'it scrolls');
    assert.match(html, /\.ov-map-side\{ contain:none; height:420px; \}/, 'stacked, it keeps one height');
    assert.ok(/pane\.scrollTop=0/.test(strip(fnBody(CONTRACT, 'ovMapWire'))), 'each new reading starts at its top');
  });

  test('the renewal panel carries the renewal question, and the page wires the map where it paints it', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'A' }, { name: 'B' });
    const D = win.ovMapData(c);
    const pane = win.ovMapPane(c, D, 'renewal');
    /* RE-POINTED IN PLACE 9 Oct 2026 (Part 9): ONE renewal section — the
       facts first, then the decision card drawn compact, after them */
    assert.ok(/id="renewal-host" class="empty:hidden ov-map-decide" data-bare="1" data-compact="1"/.test(pane));
    assert.ok(pane.indexOf(win.i18t('ov_map_rn_ends_k')) < pane.indexOf('id="renewal-host"'), 'the facts come before the decision');
    assert.ok(pane.includes(win.i18t('ov_map_rn_ends_k')), 'when it ends');
    assert.ok(win.ovMapPane(c, D, 'ours').includes(win.i18t('ov_map_ours_h')));
    assert.ok(win.ovMapPane(c, D, 'theirs').includes(win.i18t('ov_map_theirs_h')));
    const wire = strip(fnBody(CONTRACT, 'ovMapWire'));
    assert.ok(/renderRenewalSection\(c\)/.test(wire), 'filled when the renewal is read');
    assert.ok(/'renewal'/.test(wire), 'the renewal is the default reading');
    assert.ok(/ovMapWire\(host,c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTerms'))));
  });

  test('Related agreements is the column under the map, alone', () => {
    const side = strip(fnBody(CONTRACT, 'renderKeyTermsSide'));
    assert.equal((side.match(/sectionHtml\(\{/g) || []).length, 1);
    assert.ok(/id:'ov-related'/.test(side) && /id="family-section"/.test(side));
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
      terms.indexOf('id="kt-ov-brief"') < terms.indexOf('id="ov-ess"'),
      'the slot is at the top of the page, before the essentials card');
    assert.ok(/paintOvBriefBtn\(c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTerms'))));
    assert.ok(/paintOvBriefBtn\(c\)/.test(strip(fnBody(CONTRACT, 'renderKeyTermsSide'))));
  });

  test('one Edit turns both postures together', () => {
    const r = strip(fnBody(CONTRACT, 'renderKeyTerms'));
    assert.ok(/k==='all'/.test(r), 'the sheet\'s Edit is handled');
    assert.ok(/ovSetEditing\(dk,on\); ovSetEditing\(rk,on\)/.test(r), 'and moves both');
    const terms = strip(fnBody(CONTRACT, 'ktOverviewTermsHtml'));
    assert.equal((terms.match(/data-ov-edit="all"/g) || []).length, 1, 'one Edit on the page');
  });
});

describe('f442 (6) every new key is in both books', () => {
  const KEYS = ['ov_map_note', 'ov_ess_terms', 'ov_filing', 'ov_filing_close', 'ct_menu_filing',
    'ov_map_this', 'ov_map_between', 'ov_map_flows_h', 'ov_map_duties_h', 'ov_map_who_pays_unknown',
    'ov_map_owe_ours_one', 'ov_map_owe_theirs_other', 'ov_map_signed_by', 'ov_map_signs', 'ov_map_k_money', 'ov_map_k_duty'];
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

/* work order Part 9 (the owner's screenshot, 8 Oct 2026): in Safari the pop-in
   animation's CSS transform replaced a node's SVG transform, and both
   companies' circles fell into the top-left corner. */
describe('f442 (9) the duties map stands in every browser, and says what is to be paid', () => {
  test('no element carries both a place (an SVG transform) and the pop-in class', () => {
    const { win } = mapWorld();
    const c = withParties(supply(), { name: 'A' }, { name: 'B' });
    c.obligations = [{ id: 'o1', desc: 'Pay', due: '2020-01-01', party: 'ours', status: 'open' }];
    const svg = win.ovMapSvg(win.ovMapData(c));
    const bad = (svg.match(/<[a-z]+[^>]*>/g) || []).filter(t => /\btransform="translate/.test(t) && /class="[^"]*\bov-map-nd\b/.test(t));
    assert.deepEqual(bad, [], 'the place is on the outer group, the animation on the inner');
    assert.ok((svg.match(/class="ov-map-hitg[^"]*"[^>]*transform="translate\((150|450) 160\)"/g) || []).length === 2, 'both nodes placed on their outer group');
  });

  test('the amounts still to pay ride the curve labels and the panel (option A)', () => {
    const { win } = mapWorld();
    win.obligationAmount = o => Number(o.amount) || null;
    win.fmtMoneyShortIn = (v, cur) => (cur || 'KES') + ' ' + v;
    const c = withParties(supply(), { name: 'A' }, { name: 'B' });
    c.obligations = [{ id: 'o1', desc: 'Pay the invoice', due: '2026-02-01', party: 'ours', status: 'open', amount: 300 },
      { id: 'o2', desc: 'Paid already', due: '2025-02-01', party: 'ours', status: 'done', amount: 900 }];
    const D = win.ovMapData(c);
    assert.equal(D.pay.ours, 300, 'only open duties count');
    assert.ok(/300/.test(win.ovMapSvg(D)), 'the curve label says what is to be paid');
    assert.ok(/ov-map-amt/.test(win.ovMapPane(c, D, 'ours')), 'and the panel lists the amount');
    c.valueType = 'none';
    assert.equal(win.ovMapData(c).pay.ours, 0, 'no money passes, nothing to pay is said');
  });
});
