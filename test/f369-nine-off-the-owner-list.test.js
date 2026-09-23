/* f369 — NINE JOBS OFF ONE LIST (Young, 23 Sep 2026)
   ============================================================================
   1  the dropdown list scrolls without closing
   2  our own party has an email; City is gone from the party form and row
   3  "Who else is on this agreement" stays, and fills itself with the
      colleagues who edited or approved the contract
   4  the Document tab lands on Contract View
   5  the X-ray map draws only the marked clauses
   6  Plain English translates the whole contract: the echo is a sense check,
      and a clause left without a reading is asked for again by itself
   7  "Send to counterparty" is gone — Share is the one door
   8  the text size reaches the X-ray panel
   9  "As agreed" and "With changes" are gone

   Run: node --test test/f369-nine-off-the-owner-list.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const read = p => { try{ return fs.readFileSync(path.join(__dirname, '..', p), 'utf8'); } catch(_){ return ''; } };
const CORE = read('js/core.js');
const CONTRACT = read('js/views/contract.js');
const NEGO = read('js/views/negotiation.js');
const APP = read('js/app.js');
const INDEX = read('index.html');
const SERVER = read('server/server.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const fnBody = (src, name) => {
  const m = new RegExp('function\\s+' + name + '\\s*\\([^)]*\\)\\s*\\{').exec(src);
  if (!m) return '';
  let i = m.index + m[0].length, depth = 1;
  while (i < src.length && depth > 0){ const ch = src[i]; if (ch === '{') depth++; else if (ch === '}') depth--; i++; }
  return src.slice(m.index, i);
};

describe('f369 (1) the dropdown list scrolls without closing', () => {
  test('a scroll inside the menu is not a page scroll', () => {
    const arm = code(fnBody(CORE, '_selMenuArmDoc'));
    assert.ok(/addEventListener\('scroll'/.test(arm), 'the scroll listener is still there');
    assert.ok(/_selMenuEl\.contains\(t\)/.test(arm), 'and it lets a scroll inside the menu through');
    assert.ok(!/addEventListener\('scroll',\s*selectMenuClose/.test(arm), 'it no longer shuts on every scroll');
  });
  test('the list does not hand its scroll to the dialog behind it', () => {
    assert.ok(/\.hati-selmenu\{[^}]*overscroll-behavior:contain/.test(INDEX));
  });
});

describe('f369 (2) our party has an email, and there is no City', () => {
  const world = () => {
    const w = buildWorld();
    w.win.getUsers = () => [{ id: 'u-1', name: 'Young Mbagaya', email: 'young@highland.co' }];
    return w;
  };
  test('our row carries the contract owner\'s address', () => {
    const { win } = world();
    const c = { id: 'MK-1', counterparty: 'nShift', party: 'Highland', owner: { id: 'u-1', name: 'Young Mbagaya' } };
    const us = win.contractParties(c)[0];
    assert.equal(us.email, 'young@highland.co');
  });
  test('an owner nobody knows is an honest blank, never a guess', () => {
    const { win } = world();
    const c = { id: 'MK-1', counterparty: 'nShift', owner: { id: 'u-9', name: 'Somebody' } };
    assert.equal(win.contractParties(c)[0].email, '');
  });
  test('a stored row that has one keeps its own', () => {
    const { win } = world();
    const c = { id: 'MK-1', owner: { id: 'u-1' }, parties: [
      { id: 'py_us', side: 'ours', name: 'Highland', email: 'legal@highland.co' },
      { id: 'py_t', side: 'theirs', name: 'nShift' }] };
    assert.equal(win.contractParties(c)[0].email, 'legal@highland.co');
  });
  test('the party form asks no town, and the row prints none', () => {
    const ed = code(fnBody(CONTRACT, 'openPartyEditor'));
    assert.ok(!/fld\('addr'/.test(ed), 'no address box');
    assert.ok(!/address:v\('addr'\)/.test(ed), 'and nothing reads one');
    const row = code(fnBody(CONTRACT, 'ktPartyRowHtml'));
    assert.ok(!/p\.address/.test(row), 'the row prints no town');
  });
});

describe('f369 (3) "Who else" fills itself with who edited and approved', () => {
  const users = [
    { id: 'u-1', name: 'Young Mbagaya', email: 'young@highland.co' },
    { id: 'u-2', name: 'Amina Otieno', email: 'amina@highland.co' },
    { id: 'u-3', name: 'Lars Berg', email: 'lars@highland.co' },
  ];
  const w = () => {
    const world = buildWorld({ participants: true });
    world.win.getUsers = () => users;
    world.win.currentUser = () => users[0];
    world.win.canAccessFolder = () => true;
    return world;
  };
  const c = () => ({ id: 'MK-2', folder: 'proc',
    changes: [{ id: 'CHG-1', author: 'Amina Otieno', authorSide: 'owner' },
              { id: 'CHG-2', author: 'nShift Legal', authorSide: 'counterparty' }],
    negotiation: { rounds: [{ changes: [{ id: 'CHG-0', author: 'Young Mbagaya', authorSide: 'owner' }] }] },
    audit: [{ action: 'Edited', user: 'Lars Berg' }, { action: 'Edited', user: 'System' }],
    approvalChain: [{ status: 'approved', by: 'Amina Otieno' }, { status: 'pending', by: '' }] });
  test('the colleagues who edited and approved are named, each once, with every role', () => {
    const { win } = w();
    const auto = win.participantsAuto(c());
    const byName = Object.fromEntries(auto.map(a => [a.name, a.roles.slice().sort()]));
    assert.deepEqual(byName['Amina Otieno'], ['approve', 'contribute']);
    assert.deepEqual(byName['Young Mbagaya'], ['contribute']);
    assert.deepEqual(byName['Lars Berg'], ['contribute']);
    assert.ok(!byName['nShift Legal'], 'the other side is not a colleague');
    assert.ok(!byName.System, 'and System is nobody');
    assert.equal(auto.find(a => a.name === 'Amina Otieno').email, 'amina@highland.co');
  });
  test('READING MUST NOT WRITE: nothing is stored by reading the list', () => {
    const { win } = w();
    const x = c();
    win.participantsAuto(x);
    assert.equal(x.participants, undefined);
    assert.equal(x.participantsAutoOff, undefined);
  });
  test('a role somebody already named by hand is not said twice', () => {
    const { win } = w();
    const x = c();
    x.participants = [{ id: 'pt_1', name: 'Amina Otieno', email: 'amina@highland.co', role: 'approve' }];
    const a = win.participantsAuto(x).find(r => r.name === 'Amina Otieno');
    assert.deepEqual(a.roles, ['contribute']);
  });
  test('taking one off is remembered, and only that one', () => {
    const { win } = w();
    const x = c();
    assert.equal(win.participantAutoOff(x, 'u-3'), true);
    const names = win.participantsAuto(x).map(a => a.name);
    assert.ok(!names.includes('Lars Berg'));
    assert.ok(names.includes('Young Mbagaya'));
  });
  test('the panel draws the automatic rows only where asked, marked as HaTi\'s', () => {
    const { win } = w();
    const plain = win.participantsPanelHtml(c(), { editable: true });
    assert.ok(!/data-pt-auto=/.test(plain), 'the drafting screen has nobody who worked on it yet');
    const html = win.participantsPanelHtml(c(), { editable: true, auto: true });
    assert.ok(/data-pt-auto="u-2"/.test(html));
    assert.ok(/class="pt-auto"/.test(html), 'each says HaTi added it');
    assert.ok(/data-pt-auto-remove="u-2"/.test(html), 'and can be taken off');
  });
  test('the Overview asks for them', () => {
    assert.ok(/participantsPanelHtml\(c,\{\s*editable:ed, reached:true, auto:true \}\)/.test(CONTRACT));
  });
});

describe('f369 (4) the Document tab lands on Contract View', () => {
  test('arriving on the tab puts the switch back; a repaint of the same tab does not', () => {
    const ap = code(fnBody(CONTRACT, 'applyWsTabs'));
    assert.ok(/_wsTab==='docs' && _docViewAt!==here\) docViewSet\('paper'\)/.test(ap));
    assert.ok(/_docViewAt=here/.test(ap));
  });
  test('leaving the page makes the next visit an arrival', () => {
    assert.ok(/!_sameView && typeof window\.docViewLeave==='function'/.test(APP));
    assert.ok(/function docViewLeave\(\)\{ _docViewAt=''; \}/.test(CONTRACT));
  });
});

describe('f369 (5) the X-ray map draws only the marked clauses', () => {
  test('the map\'s rows are the toned ones', () => {
    const sp = code(fnBody(CONTRACT, 'docXraySpineHtml'));
    assert.ok(/docXraySpineRows\(rows\)\.map/.test(sp));
    assert.ok(/const docXraySpineRows = rows => \(rows\|\|\[\]\)\.filter\(x => x && x\.tone\)/.test(CONTRACT));
  });
  test('nothing marked, no map', () => {
    assert.ok(/if\(!sec\|\|!docXraySpineRows\(rows\)\.length\)/.test(CONTRACT));
  });
});

describe('f369 (7) Send to counterparty is gone', () => {
  test('the head draws no button for it; the guide stays', () => {
    const next = CONTRACT.slice(CONTRACT.indexOf("if(!appr.ok) return { get label(){ return i18t('ct_send_to_cp')"));
    const branch = next.slice(0, next.indexOf('};') + 2);
    assert.ok(/kind:'share',\s*noButton:true/.test(branch), 'noButton, not null');
    assert.ok(/ct_share_draft_guide/.test(branch), 'the guide still answers what is next');
  });
});

describe('f369 (8) the text size reaches the X-ray panel', () => {
  test('applyDocZoom writes the same ratio on the panel\'s host', () => {
    const z = code(fnBody(CONTRACT, 'applyDocZoom'));
    assert.ok(/getElementById\('doc-xray'\)/.test(z));
    assert.ok(/xr\.style\.setProperty\('--doc-scale', pref\.toFixed\(3\)\)/.test(z));
  });
  test('every size in the panel reads it', () => {
    for (const lit of ['#doc-xray .doc-xr-head h4{font-size:calc(var(--t-card) * var(--doc-scale,1));}',
      '#doc-xray .doc-xr-t,#doc-xray .doc-xr-none{font-size:calc(var(--t-meta) * var(--doc-scale,1));}',
      '#doc-xray .doc-xr-k,#doc-xray .doc-xr-mk{font-size:calc(var(--t-micro) * var(--doc-scale,1));}'])
      assert.ok(INDEX.includes(lit), lit);
  });
});

describe('f369 (9) As agreed and With changes are gone', () => {
  test('the switch offers the redline alone', () => {
    const segs = code(fnBody(NEGO, 'rlReadSegsHtml'));
    assert.ok(/seg\('marks'/.test(segs));
    assert.ok(!/seg\('agreed'/.test(segs) && !/seg\('proposed'/.test(segs));
  });
  test('no control anywhere names another reading', () => {
    const js = ['js/views/negotiation.js', 'js/views/clauseeditor.js', 'js/views/portal.js', 'js/views/contract.js', 'js/mobile-contract.js']
      .map(read).map(code).join('\n');
    assert.ok(!/data-rl-read="(agreed|proposed)"/.test(js));
    assert.ok(!/seg\('(agreed|proposed)'/.test(js));
    assert.ok(/const RL_READS_OFFERED = \['marks'\]/.test(NEGO));
  });
  test('the line under a stacked clause carries no As agreed press', () => {
    assert.ok(!/data-rl-read="agreed"/.test(code(fnBody(NEGO, 'rlBaselineHtml'))));
  });
});

/* ============================================================================
   6 · THE WHOLE CONTRACT IS TRANSLATED — driven against the real route
   ==========================================================================*/
describe('f369 (6) Plain English reads every clause', () => {
  let h, ai, W;
  const CL = [
    { num: '48.2', heading: '48.2 Completion of performance of Project Phase.', text: 'The performance of Project Phase shall be deemed to have been completed upon Supplier’s written notification.', kind: 'clause' },
    { num: '48.3', heading: '48.3 Testing phase', text: '', kind: 'section' },
    { num: '48.3.1', heading: '48.3.1 Scope of testing.', text: 'The Services and Deliverables shall first be subject to (A) an acceptance and user acceptance test.', kind: 'clause' },
    { num: '48.3.2', heading: '48.3.2 “Acceptance Test”\tcriteria', text: 'The Acceptance Test shall take place in accordance with the transition plan.', kind: 'clause' },
  ];
  const tu = input => [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input }];
  const put = id => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
    id, name: 'SaaS', counterparty: 'nShift', folder: 'proc', status: 'Draft', redlineText: '<p>x</p>',
    fields: {}, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h, { contracts: [] });
    await put('MK-F368-1'); await put('MK-F368-2'); await put('MK-F368-3');
  });
  after(async () => { await h.stop(); await ai.stop(); });

  test('an echo the model tidied — straight quotes, a space for a tab, a shortened lead-in — still pairs', async () => {
    ai.script(tu({ readings: [
      { key: 'R0', heading: '48.2 Completion of performance of Project Phase', plain: 'The project phase is finished when the supplier says so in writing.' },
      { key: 'R1', heading: '48.3 Testing Phase', plain: '' },
      { key: 'R2', heading: 'Scope of testing', plain: 'First the services are tested.' },
      { key: 'R3', heading: '48.3.2 "Acceptance Test" criteria', plain: 'The test follows the plan.' },
    ] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F368-1', clauses: CL } });
    assert.deepEqual(out.readings.items.map(x => x.i), [0, 1, 2, 3], 'every clause is read');
    assert.equal(out.readings.unmatched, 0);
    assert.equal(out.readings.partial, false);
    const c = await W.admin.json('/api/contracts/MK-F368-1');
    assert.equal(c._readings && c._readings.items.length, 4, 'and the whole edition is kept');
  });

  test('a clause the model skipped is asked for again by itself, and lands', async () => {
    ai.script(
      tu({ readings: [
        { key: 'R0', heading: CL[0].heading, plain: 'Done when the supplier says so.' },
        { key: 'R1', heading: CL[1].heading, plain: '' },
        { key: 'R3', heading: CL[3].heading, plain: 'The test follows the plan.' },
      ] }),
      body => {
        const p = body.messages[0].content;
        assert.ok(/\[R0\] CLAUSE 48\.3\.1/.test(p), 'the second ask carries only the missing clause, under a fresh key');
        assert.ok(!/48\.2 Completion/.test(p.slice(p.indexOf('THE CONTRACT:'))), 'and nothing already read');
        return tu({ readings: [{ key: 'R0', heading: CL[2].heading, plain: 'First the services are tested.' }] });
      });
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F368-2', clauses: CL } });
    assert.deepEqual(out.readings.items.map(x => x.i), [0, 1, 2, 3]);
    assert.equal(out.readings.unmatched, 0);
    assert.equal(out.readings.items.find(x => x.i === 2).heading, CL[2].heading, 'filed under its own clause');
  });

  test('THE WALL STANDS: an entry that names another clause is still refused, and never filed under the wrong one', async () => {
    ai.script(tu({ readings: [
      { key: 'R0', heading: CL[0].heading, plain: 'Done when the supplier says so.' },
      { key: 'R1', heading: CL[1].heading, plain: '' },
      { key: 'R2', heading: CL[3].heading, plain: 'ABOUT 48.3.2' },
      { key: 'R3', heading: CL[3].heading, plain: 'The test follows the plan.' },
    ] }));
    const out = await W.admin.json('/api/ai/readings', { method: 'POST', body: { id: 'MK-F368-3', clauses: CL } });
    assert.ok(!out.readings.items.find(x => x.i === 2 && /48\.3\.2/.test(x.plain)), 'the shifted reading is not filed under 48.3.1');
    assert.equal(out.readings.unmatched, 1, 'and the clause it left empty is counted');
  });

  test('the judge is one function, asked of the whole list', () => {
    assert.ok(/readEchoJudge\(r && r\.heading, list, i\) === 'shift'/.test(SERVER));
    assert.ok(/const READ_ECHO_AGREE = 0\.6;/.test(SERVER));
  });
});
