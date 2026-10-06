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
    /* `book:true` (4 Oct 2026, f479): the Overview also draws the address
       book's rows only a mirror still names. */
    assert.ok(/participantsPanelHtml\(c,\{\s*editable:ed, reached:true, auto:true(, book:true)? \}\)/.test(CONTRACT));
  });
});

describe('f369 (4) the Document tab lands on the thread', () => {
  /* REVERSED IN PLACE 5 Oct 2026 (the Thread): there is no position to put
     back on arrival; the one facing page is up whenever the tab is. */
  test('no arrival rule, no leave hook', () => {
    assert.ok(!/_docViewAt|docViewSet\(|docViewLeave/.test(CONTRACT));
    assert.ok(!/docViewLeave/.test(APP));
    assert.ok(/docThreadPaint\(c\);/.test(code(fnBody(CONTRACT, 'applyWsTabs'))), 'the tab sweep paints the thread');
  });
});

describe('f369 (5) the X-ray map draws only the marked clauses', () => {
  test('the map\'s rows are the toned ones', () => {
    const sp = code(fnBody(CONTRACT, 'docXraySpineHtml'));
    assert.ok(/docXraySpineRows\(rows\)\.map/.test(sp));
    assert.ok(/const docXraySpineRows = rows => \(rows\|\|\[\]\)\.filter\(x => x && x\.tone\)/.test(CONTRACT));
  });
  test('nothing marked, no map', () => {
    /* RE-POINTED 5 Oct 2026 (the Thread): the strand is the Explorer's now. */
    const IG = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
    assert.ok(/sp\.hidden=!marked\.length;/.test(IG));
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

/* RE-POINTED 6 Oct 2026 (Panel Voice, Young): the 23 Sep rule is reversed —
   the clause panel keeps the panel's own sizes and only the paper grows. */
describe('f369 (8) the text size stays on the paper (Panel Voice)', () => {
  test('applyDocZoom writes no ratio on the thread', () => {
    const z = code(fnBody(CONTRACT, 'applyDocZoom'));
    assert.ok(!/th\.style\.setProperty\('--doc-scale'/.test(z));
  });
  test('no size in the thread reads it', () => {
    for (const lit of ['#doc-thread .doc-th-name{font-size:calc(var(--t-body) * var(--doc-scale,1));}',
      '#doc-thread .doc-xr-mk{font-size:calc(var(--t-micro) * var(--doc-scale,1));}',
      '#doc-thread .doc-xr-wdt{font-size:calc(var(--t-meta) * var(--doc-scale,1));}'])
      assert.ok(!INDEX.includes(lit), lit);
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
describe('f369 (6) Plain English reads any clause, one at a time', () => {
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

  /* RE-POINTED 6 Oct 2026 (Young: "the translation is supposed to be one
     clause at a time only"): each press names ONE clause. A tidied echo
     cannot fail a one-clause answer, a skipped clause is the one asked again,
     and a reading lands on the clause asked and nowhere else. */
  const ask = (id, k) => W.admin.json('/api/ai/readings', { method: 'POST', body: { id, clauses: CL, only: [k] } });
  test('an echo the model tidied — straight quotes, a space for a tab, a shortened lead-in — still pairs', async () => {
    ai.script(tu({ readings: [{ key: 'R0', heading: '48.3.2 "Acceptance Test" criteria', plain: 'The test follows the plan.' }] }),
      tu({ readings: [{ key: 'R0', heading: 'Scope of testing', plain: 'First the services are tested.' }] }));
    const a = await ask('MK-F368-1', 3);
    assert.deepEqual(a.readings.items.map(x => x.i), [3]);
    const b = await ask('MK-F368-1', 2);
    assert.deepEqual(b.readings.items.map(x => x.i).sort(), [2, 3], 'both read, each on its own clause');
    assert.equal(b.readings.unmatched, 0);
  });

  test('a clause the model skipped is asked for again by itself, and lands', async () => {
    ai.script(
      tu({ readings: [] }),
      body => {
        const p = body.messages[0].content;
        assert.ok(/\[R0\] CLAUSE 48\.3\.1/.test(p), 'the second ask carries the clause again');
        assert.ok(!/48\.2 Completion/.test(p.slice(p.indexOf('THE CONTRACT:'))), 'and nothing else');
        return tu({ readings: [{ key: 'R0', heading: CL[2].heading, plain: 'First the services are tested.' }] });
      });
    const out = await ask('MK-F368-2', 2);
    assert.deepEqual(out.readings.items.map(x => x.i), [2]);
    assert.equal(out.readings.unmatched, 0);
    assert.equal(out.readings.items[0].heading, CL[2].heading, 'filed under its own clause');
  });

  test('THE WALL STANDS: a reading is filed on the clause asked and never on another', async () => {
    ai.script(tu({ readings: [{ key: 'R0', heading: CL[3].heading, plain: 'ABOUT 48.3.1, echoed under the wrong heading' }] }));
    const out = await ask('MK-F368-3', 2);
    assert.deepEqual(out.readings.items.map(x => x.i), [2], 'only clause 48.3.1 — the one asked — carries it');
    assert.ok(!out.readings.items.some(x => x.i === 3), 'clause 48.3.2 is never handed a reading it was not asked for');
  });

  test('the judge is one function, asked only among a page\'s own rows, never of a page of one', () => {
    assert.ok(/if \(!solo && readEchoJudge\(r && r\.heading, pg\.rows, k\) === 'shift'\)/.test(SERVER));
    assert.ok(/const READ_ECHO_AGREE = 0\.6;/.test(SERVER));
  });
});
