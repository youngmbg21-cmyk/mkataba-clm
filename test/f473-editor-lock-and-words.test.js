/* ============================================================
   F473 — The editor, the lock and the words (process review, 4 Oct 2026)
   ============================================================
   Five findings from the process review, built together because they share
   the clause editor and the lock:

     (1) An ask for a clause lives as long as the asker is here. It lapsed
         after the lock's two minutes while the holder's own lock never did,
         so a colleague who asked and kept reading fell silently out of the
         queue. The asker's presence beat (/here) now keeps THEIR asks fresh.
     (2) Hand over is offered on the paper too, and the holder chooses WHICH
         asker when more than one asked. Both doors press one act.
     (3) Closing the "fill the open fields first?" question without choosing
         stays where you are. Only "Open Negotiate anyway" opens it.
     (4) Pressing a verb on a parked ask WARNS and takes you to its counter.
     (5) One word per thing (both books).
   The browser half (one press to type, the paper's Hand over and its picker,
   measured) is test/chromium/editor-lock-words-verify.js. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const NEG = bare(read('js/views/negotiation.js'));
const MODEL = bare(read('js/negotiation.js'));
const CE = bare(read('js/views/clauseeditor.js'));
const SRV = read('server/server.js');
const I18N = read('js/i18n.js');
/* Every value of a key, English book first, Swedish second. */
const valsOf = key => [...I18N.matchAll(new RegExp('\\n    ' + key + ": '((?:[^'\\\\]|\\\\.)*)'", 'g'))].map(m => m[1]);
const bodyOf = (src, head) => {
  const i = src.indexOf(head); if (i < 0) return '';
  /* the body's brace, past a default parameter like `opts = {}` */
  const m = /\)\s*\{/.exec(src.slice(i)); if (!m) return '';
  let d = 0; const j = i + m.index + m[0].length - 1;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); }
  return '';
};

describe('f473 (1) — an ask lives as long as the asker is here (driven on the real server)', () => {
  let h, w;
  before(async () => { h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });

  test('the asker\'s own beat refreshes THEIR ask, and nobody else\'s beat does', async () => {
    const holder = w.admin, asker = w.unrestricted, other = w.novalues;
    const took = await holder.json('/api/contracts/MK-A2/lock', { method: 'POST', body: { clauseId: 'cl_t473' } });
    assert.ok(took.locks && took.locks.cl_t473, 'the holder took the clause');
    const asked = await asker.json('/api/contracts/MK-A2/lock', { method: 'POST', body: { clauseId: 'cl_t473', ask: true } });
    const t0 = asked.locks.cl_t473.asked[0].at;
    assert.ok(t0, 'the ask is on the lock');
    await new Promise(r => setTimeout(r, 30));
    await other.json('/api/contracts/MK-A2/here', { method: 'POST', body: {} });
    let now = await holder.json('/api/contracts/MK-A2/lock', { method: 'POST', body: { clauseId: 'cl_t473' } });
    assert.equal(now.locks.cl_t473.asked[0].at, t0, 'a colleague who never asked moves nothing');
    await asker.json('/api/contracts/MK-A2/here', { method: 'POST', body: {} });
    now = await holder.json('/api/contracts/MK-A2/lock', { method: 'POST', body: { clauseId: 'cl_t473' } });
    const t1 = now.locks.cl_t473.asked[0].at;
    assert.ok(Date.parse(t1) > Date.parse(t0), `the asker's beat kept the ask fresh (${t0} → ${t1})`);
    assert.equal(now.locks.cl_t473.by.id, took.locks.cl_t473.by.id, 'and the holder still holds it — asking takes nothing');
  });

  test('(parent: red) the refresh lives in the presence route, only for live asks on live locks', () => {
    const r = bare(SRV.slice(SRV.indexOf("app.post('/api/contracts/:id/here'"),
      SRV.indexOf('/* ---------- executed records are immutable')));
    assert.match(r, /String\(r\.id\) !== String\(me\.id\) \|\| !srvLockAlive\(r\)/, 'only mine, only live — a lapsed ask is not raised from the dead');
    assert.match(r, /!srvLockAlive\(l\)/, 'and only on a lock still alive');
    assert.ok(!/version|updated_at/.test(r), 'still json only: presence is not an edit');
  });
});

describe('f473 (2) — Hand over from either door, to the asker you choose', () => {
  let dom, L;
  before(() => {
    dom = new JSDOM('<!doctype html><body></body>');
    global.window = dom.window; global.document = dom.window.document;
    delete require.cache[require.resolve('../js/clauselock.js')];
    L = require('../js/clauselock.js');
  });
  after(() => { delete global.window; delete global.document; });
  const stage = askers => {
    const W = global.window, now = new Date().toISOString();
    const said = [];
    W.currentUser = () => ({ id: 'u_w', name: 'Wanjiru Kamau' });
    W.i18t = k => k; W.i18tn = k => k;
    W.toast = (m, kind) => said.push([m, kind]);
    W.persist = () => {};
    let answer;
    W.confirmDialog = () => {
      const ov = document.createElement('div'); ov.id = 'confirm-overlay';
      ov.innerHTML = '<div role="alertdialog"><p>msg</p><div><button id="cf-cancel"></button><button id="cf-ok"></button></div></div>';
      document.body.appendChild(ov);
      return new Promise(r => { answer = v => { ov.remove(); r(v); }; });
    };
    const c = { id: 'MK-1', locks: { cl1: { by: { id: 'u_w', name: 'Wanjiru Kamau' }, at: now,
      asked: askers.map(([id, name]) => ({ id, name, at: now })) } } };
    return { c, said, answer: v => answer(v) };
  };

  test('two waiting: a picker naming both, first asker chosen, and the choice is honoured', async () => {
    const s = stage([['u_a', 'Amina'], ['u_b', 'Brian']]);
    const done = L.clauseLockHandOverAsk(s.c, 'cl1');
    const sel = document.getElementById('cl-hand-to');
    assert.ok(sel, 'the confirm carries a picker');
    assert.deepEqual([...sel.options].map(o => o.value), ['u_a', 'u_b']);
    assert.equal(sel.value, 'u_a', 'first asker chosen, so a plain yes is the old act');
    sel.value = 'u_b'; sel.dispatchEvent(new window.Event('change'));
    s.answer(true);
    const got = await done;
    assert.equal(got && got.id, 'u_b');
    assert.equal(s.c.locks.cl1.by.id, 'u_b', 'the lock moved to the colleague chosen');
    assert.deepEqual(s.said.at(-1), ['cl_handed', 'ok'], 'confirmed with an ok toast');
  });

  test('one waiting: no picker; Cancel moves nothing', async () => {
    const s = stage([['u_a', 'Amina']]);
    const done = L.clauseLockHandOverAsk(s.c, 'cl1');
    assert.equal(document.getElementById('cl-hand-to'), null, 'nothing to choose between');
    s.answer(false);
    assert.equal(await done, null);
    assert.equal(s.c.locks.cl1.by.id, 'u_w', 'still the holder\'s');
  });

  test('(parent: red) both doors press the one act, and the paper draws the holder\'s sign', () => {
    const ed = CE.slice(CE.indexOf("case 'handover':"), CE.indexOf("case 'handover':") + 400);
    assert.match(ed, /clauseLockHandOverAsk\(_ceC, _ceClauseId/, 'the rail\'s Hand over');
    const doc = NEG.slice(NEG.indexOf("t.closest('[data-rl-lock-hand]')"), NEG.indexOf("t.closest('[data-rl-lock-hand]')") + 900);
    assert.match(doc, /clauseLockHandOverAsk\(cc, cid/, 'the paper\'s Hand over, delegated at module load');
    const pill = bodyOf(NEG, 'function rlClauseEditPillHtml(');
    assert.match(pill, /const mineSign = rlLockMineSignHtml\(opts\.c, cl\.clauseId\)/);
    assert.equal((pill.match(/return mineSign \+ `<button/g) || []).length, 2, 'beside the pencil, never in its place');
    const sign = bodyOf(NEG, 'function rlLockMineSignHtml(');
    assert.match(sign, /clauseLockMineWaiting\(c, clauseId\)/, 'drawn only for the holder, only with somebody waiting');
    assert.equal((sign.match(/data-rl-lock-hand=/g) || []).length, 1, 'ONE live button');
  });
});

describe('f473 (3) — closing the blanks question stays where you are', () => {
  test('(parent: red) only the go button goes; a dismissal answers stay and does not spend the question', () => {
    const ask = bodyOf(NEG, 'async function negoBlanksAsk(');
    assert.match(ask, /#confirm-overlay #cf-cancel/, 'the go button\'s own press is what says go');
    assert.match(ask, /return fill \? 'fill' : \(saidGo \? 'go' : 'stay'\)/);
    const door = bodyOf(NEG, 'function openRedlineWorkbench(');
    assert.match(door, /else if \(ans === 'stay'\) _rlBlanksAsked\.delete\(String\(target\)\)/,
      'nothing opens, and the next press asks again');
  });
});

describe('f473 (4) — a parked ask points at its counter', () => {
  test('(parent: red) a warn, the clause named, and the page taken to the counter', () => {
    const fn = bodyOf(MODEL, 'function negoResolve(');
    const br = fn.slice(fn.indexOf("if (ch.status === 'countered')"), fn.indexOf("if (ch.status === 'countered')") + 600);
    assert.match(br, /toast\(i18t\('ng_countered_go_counter', \{ clause: negoRefusalClause\(counter, ch\) \}\), 'warn'\)/);
    assert.match(br, /window\.rlLinkFocus\(c, counter\.id\)/, 'the one function that lights and scrolls a change');
    assert.match(br, /return null/, 'and the parked ask still takes no decision of its own');
  });
});

describe('f473 (5) — one word per thing, in both books', () => {
  const both = (k, test) => { const v = valsOf(k); assert.equal(v.length, 2, k + ' is in both books'); v.forEach(x => test(x, k)); };
  test('"held" is the reviewer\'s word; their unsent answers say not yet sent', () => {
    for (const k of ['ng_badge_accepted_held', 'ng_badge_rejected_held', 'pa_held_one', 'pa_held_other',
      'ng_held_until_send', 'pt_decisions_held', 'ng_send_answer_title', 'ng_held_back', 'ng_accept_nonrisk_title'])
      both(k, (v, key) => assert.ok(!/\bheld\b|hålls/i.test(v), key + ': ' + v));
    assert.match(valsOf('ng_badge_accepted_held')[0], /not yet sent/);
    assert.equal(valsOf('rv_v_held')[0], 'Held back', 'the reviewer keeps Held back');
  });
  test('the ladder counts steps, not rounds', () => {
    for (const k of ['ng_rung_plain', 'ng_rung_on_word', 'ng_base_eq_rung', 'ce_lc_accept', 'ce_lc_own', 'ng_rung_on_yours',
      'ng_rung_on_theirs', 'ng_rung_settled', 'ng_rung_refused', 'ng_rung_withdrawn', 'ng_rung_reading',
      'ng_rung_stands_on', 'ng_rung_decided_with', 'ng_rung_pick', 'ng_rung_step'])
      both(k, (v, key) => assert.ok(!/R\{[nu]\}/.test(v) && /[Ss]tep|[Ss]teg/.test(v), key + ': ' + v));
    assert.equal(valsOf('ng_rung_round')[0], 'Round {n}', 'a ROUND is still a round');
    assert.ok(!/>R\$\{|`R\$\{|R0 · /.test(NEG), 'no renderer prints R-and-a-number for a step');
  });
  test('whose ask, and the review door says its act', () => {
    assert.deepEqual(valsOf('ng_filter_mine'), ['Our asks', 'Våra förslag']);
    assert.deepEqual(valsOf('ng_filter_theirs'), ['Their asks', 'Deras förslag']);
    assert.deepEqual(valsOf('rv_head_ask'), ['Ask for review', 'Be om granskning']);
    assert.equal(valsOf('rv_head_return')[0], 'Hand back review');
  });
  test('the new words are in both books', () => {
    for (const k of ['cl_hand_to', 'cl_hand_title_many', 'ng_countered_go_counter', 'ng_rung_step'])
      assert.equal(valsOf(k).length, 2, k);
  });
});
