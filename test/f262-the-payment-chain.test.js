/* f262 — THE PAYMENT CHAIN (L)
   ========================================================================
   Owner-instructed 31 Aug 2026 off a before/after render of the two screens
   that change: *"Build based on your recommendation."*

   An obligation was a single dated promise. Four tranches of an equipment
   purchase were four items in a list with nothing linking them — so HaTi
   would email a supplier about the commissioning payment while the delivery
   payment was still unpaid. ONE NEW FIELD, `after`, buys the order, the
   held-back reminders and the committed-against-paid reading at once.

   WHAT IS PINNED, and the first is the condition on all the rest:
     1  absent means NOT IN A CHAIN — every record on file reads identically
     2  blocked is the DIRECT predecessor only, so there is no cycle to hang on
     3  a pointer at a deleted step does not block; a loop does not hang
     4  chains PARTITION, so nothing is ever drawn twice
     5  obState is untouched — the calendar and the alerts still see the date
     6  the band, the counts and the door all read ONE blocked reading
     7  the money splits four ways and the four agree with each other
     8  the tab draws chains then bands, over disjoint sets
     9  the worklist bands, filters and names the step
    10  the sweep sends NOTHING about a blocked step, and tells the owner once
    11  ONE door onto the order, and a loop is refused in words
    12  both languages */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const i18n = require('../js/i18n.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const OB = read('js/obligations.js');
const OB_CODE = strip(OB);
const SRV = strip(read('server/server.js'));
const CSS = read('index.html');

const w = buildWorld({ obligations: true, intelView: true });
const win = w.win;

/* A day offset from TODAY, never a pinned calendar date — the f183 lesson,
   which this repository has now been caught by twice. */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* The shape the whole feature was drawn for: a plant line bought in four
   tranches. One paid, one overdue, two that cannot happen yet. */
const chainContract = () => ({
  id: 'MK-B7', name: 'Plant line upgrade', counterparty: 'Rift Valley Engineering Ltd',
  status: 'Signed', value: 48000000, obligations: [
    { id: 's1', desc: 'Deposit on order',    due: day(-170), amount: 14400000, status: 'done', completedAt: day(-172) },
    { id: 's2', desc: 'On delivery to site', due: day(-64),  amount: 19200000, status: 'open', after: 's1' },
    { id: 's3', desc: 'On commissioning',    due: day(30),   amount: 9600000,  status: 'open', after: 's2' },
    { id: 's4', desc: 'Retention release',   due: day(210),  amount: 4800000,  status: 'open', after: 's3' },
    { id: 'x1', desc: 'Quarterly maintenance report', due: day(30), status: 'open', party: 'theirs' },
  ],
});

describe('f262 (1) — absent means not in a chain', () => {
  test('every obligation on file today reads exactly as it did', () => {
    /* THE CONDITION ON THE WHOLE FEATURE. There is no migration, and this is
       what says so: a record with no `after` is in no chain, blocks nothing,
       is blocked by nothing and bands where it always banded. */
    const c = { id: 'C', obligations: [
      { id: 'a', desc: 'One', due: day(-3) },
      { id: 'b', desc: 'Two', due: day(9) },
      { id: 'd', desc: 'Three', status: 'done' },
    ]};
    c.obligations.forEach(o => {
      assert.equal(win.obligationAfter(o), null);
      assert.equal(win.obligationPrev(o, c), null);
      assert.equal(win.obligationBlocked(o, c), false);
      assert.deepEqual(Array.from(win.obligationChain(o, c)), []);
      assert.equal(win.obligationStepNo(o, c), null);
    });
    assert.deepEqual(Array.from(win.obligationChains(c)), []);
    /* and the band answers identically with and without the contract */
    c.obligations.forEach(o =>
      assert.equal(win.obligationBand(o, c), win.obligationBand(o),
        'a caller written before this gets the same answer'));
  });

  test('an empty string, a stray space and a self-reference are all "no chain"', () => {
    const c = { id: 'C', obligations: [{ id: 'a', desc: 'One', after: 'a' }] };
    assert.equal(win.obligationAfter({ after: '' }), null);
    assert.equal(win.obligationAfter({ after: '   ' }), null);
    assert.equal(win.obligationAfter({ after: ' s1 ' }), 's1', 'trimmed, not rejected');
    /* A step pointing at ITSELF must not block itself for ever. */
    assert.equal(win.obligationPrev(c.obligations[0], c), null);
    assert.equal(win.obligationBlocked(c.obligations[0], c), false);
  });
});

describe('f262 (2) — blocked, and it cannot hang', () => {
  test('the direct predecessor only, and a done step blocks nothing', () => {
    const c = chainContract();
    const [s1, s2, s3, s4] = c.obligations;
    assert.equal(win.obligationBlocked(s1, c), false, 'a completed step is not blocked');
    assert.equal(win.obligationBlocked(s2, c), false, 'its predecessor is done');
    assert.equal(win.obligationBlocked(s3, c), true,  's2 is open');
    assert.equal(win.obligationBlocked(s4, c), true,  's3 is not done, so 4 waits too');
    /* AND IT IS TRANSITIVE BY CONSTRUCTION RATHER THAN BY A WALK: complete s2
       and s3 frees, while s4 stays held because ITS predecessor is still open.
       That is the whole reason there is no recursion here and therefore no
       cycle to fall into. */
    s2.status = 'done';
    assert.equal(win.obligationBlocked(s3, c), false);
    assert.equal(win.obligationBlocked(s4, c), true);
  });

  test('a pointer at a step that is not there does NOT block', () => {
    /* Deleting a step must not silently freeze everything after it — the
       survivors read as unchained rather than as waiting for ever. */
    const c = { id: 'C', obligations: [{ id: 'b', desc: 'Two', after: 'gone' }] };
    assert.equal(win.obligationPrev(c.obligations[0], c), null);
    assert.equal(win.obligationBlocked(c.obligations[0], c), false);
    assert.deepEqual(Array.from(win.obligationChain(c.obligations[0], c)), []);
  });

  test('a loop drawn by hand does not hang the page', () => {
    /* The product refuses to CREATE one (see section 11); a record hand-edited
       or imported into one must still draw something rather than spin. */
    const c = { id: 'C', obligations: [
      { id: 'a', desc: 'A', after: 'b' },
      { id: 'b', desc: 'B', after: 'a' },
    ]};
    const ch = Array.from(win.obligationChain(c.obligations[0], c));
    assert.ok(ch.length <= c.obligations.length, 'it terminates: ' + ch.length);
    assert.equal(win.obligationBlocked(c.obligations[0], c), true);
    assert.ok(Array.from(win.obligationChains(c)).length <= 1);
  });

  test('the readings work off a SPREAD COPY, which is what the worklist hands them', () => {
    /* obwRows maps `{...o, cid, ...}`, so anything matching on object identity
       would answer differently on the two screens — and a self-reference would
       find ITSELF as its predecessor and block for ever. Matched on the id. */
    const c = chainContract();
    const copy = { ...c.obligations[2], cid: c.id, cname: c.name };
    assert.equal(win.obligationBlocked(copy, c), true);
    /* READ THE FIELDS, never deepEqual: the world's objects are built in the
       jsdom realm and are never reference-equal to Node's, so a strict deep
       compare fails on two objects that are the same. */
    const st = win.obligationStepNo(copy, c);
    assert.equal(st.n, 3); assert.equal(st.of, 4);
  });
});

describe('f262 (3) — chains partition, so nothing is drawn twice', () => {
  test('the four tranches are one chain, in order, and the fifth is in none', () => {
    const c = chainContract();
    const chains = Array.from(win.obligationChains(c)).map(ch => Array.from(ch).map(o => o.id));
    assert.deepEqual(chains, [['s1', 's2', 's3', 's4']]);
    assert.equal(win.obligationStepNo(c.obligations[4], c), null, 'the report is in no chain');
  });

  test('asked from the MIDDLE of a chain it still returns the whole chain', () => {
    const c = chainContract();
    assert.deepEqual(Array.from(win.obligationChain(c.obligations[2], c)).map(o => o.id),
      ['s1', 's2', 's3', 's4']);
    const st2 = win.obligationStepNo(c.obligations[1], c);
    assert.equal(st2.n, 2); assert.equal(st2.of, 4);
  });

  test('two steps pointing at one predecessor is not drawn twice', () => {
    /* Branching is deliberately not built. What must never happen is one
       obligation appearing in two chains on the same page. */
    const c = { id: 'C', obligations: [
      { id: 'a', desc: 'A' },
      { id: 'b', desc: 'B', after: 'a' },
      { id: 'x', desc: 'X', after: 'a' },
    ]};
    const chains = Array.from(win.obligationChains(c)).map(ch => Array.from(ch).map(o => o.id));
    const seen = chains.flat();
    assert.equal(new Set(seen).size, seen.length, 'no id in two chains: ' + JSON.stringify(chains));
  });

  test('a chain of one is not a chain', () => {
    const c = { id: 'C', obligations: [{ id: 'a', desc: 'A' }] };
    assert.deepEqual(Array.from(win.obligationChain(c.obligations[0], c)), []);
  });
});

describe('f262 (4) — obState is untouched, the BAND is what moved', () => {
  test('a blocked step is still open or overdue by its own date', () => {
    /* DELIBERATE. The calendar, the alerts window and every existing count
       read obState, and changing it would ripple through all of them. What
       changes is the band, the head counts, who is chased and the door. */
    const c = chainContract();
    assert.equal(win.obState(c.obligations[2]), 'open');
    const late = { id: 'z', desc: 'Z', due: day(-5), after: 's2' };
    c.obligations.push(late);
    assert.equal(win.obState(late), 'overdue', 'obState still reads the date');
    assert.equal(win.obligationBand(late, c), 'waiting', 'the BAND knows it is held');
    assert.equal(win.obligationBand(late), 'overdue', 'and without a contract, nothing changed');
  });

  test('waiting outranks overdue, and only for a blocked step', () => {
    const c = chainContract();
    assert.equal(win.obligationBand(c.obligations[1], c), 'overdue', 's2 is genuinely late');
    assert.equal(win.obligationBand(c.obligations[2], c), 'waiting');
    assert.equal(win.obligationBand(c.obligations[0], c), 'done');
  });

  test('the band list is one list and waiting sits after later', () => {
    const keys = Array.from(win.OBLIG_BANDS).map(b => b[0]);
    assert.ok(keys.includes('waiting'));
    assert.ok(keys.indexOf('waiting') > keys.indexOf('later'),
      'a step waiting on an earlier one needs nobody: ' + keys.join(','));
    assert.ok(keys.indexOf('waiting') < keys.indexOf('done'),
      'but the money on it is still outstanding');
  });
});

describe('f262 (5) — the counts stop lying', () => {
  test('the tab separates outstanding from waiting', () => {
    const c = chainContract();
    const st = win.obligationTabState(c);
    /* s2 overdue + the maintenance report = 2 that need somebody;
       s3 and s4 are waiting; s1 is done. */
    assert.equal(st.open, 2, JSON.stringify(st));
    assert.equal(st.overdue, 1);
    assert.equal(st.waiting, 2);
    assert.equal(st.total, 5);
    assert.equal(st.open + st.waiting + 1, 5, 'and they do not overlap');
  });

  test('a contract with no chain counts exactly as it did', () => {
    const c = { id: 'C', obligations: [
      { id: 'a', desc: 'A', due: day(-1) }, { id: 'b', desc: 'B', due: day(9) },
      { id: 'd', desc: 'D', status: 'done' },
    ]};
    const st = win.obligationTabState(c);
    assert.equal(st.open, 2); assert.equal(st.overdue, 1); assert.equal(st.waiting, 0);
  });

  test('the sidebar door does not count work nobody may do', () => {
    /* The door's own standing rule is that its number matches the list behind
       it, and the worklist now bands a held-back step apart from the overdue
       ones. Read through openObligations, which is the ONE reading of what is
       outstanding across the book. */
    assert.match(OB_CODE, /function obligationsDoorCount\(\)\{[\s\S]*?obligationBlocked\(/,
      'the door asks the one blocked reading');
    assert.match(OB_CODE, /function obligationsDoorCount\(\)\{[\s\S]*?openObligations\(\)/,
      'and still borrows the one population');
  });
});

describe('f262 (6) — the money splits four ways and the four agree', () => {
  test('committed = paid + outstanding, and overdue is inside outstanding', () => {
    const c = chainContract();
    const r = win.obligationRoll(c.obligations);
    assert.equal(r.committed, 48000000, 'the four tranches are the contract value');
    assert.equal(r.paid, 14400000);
    assert.equal(r.outstanding, 33600000);
    assert.equal(r.overdue, 19200000);
    assert.equal(r.paid + r.outstanding, r.committed, 'by construction, not by luck');
    assert.ok(r.overdue <= r.outstanding);
  });

  test('an obligation with no amount is in none of the four', () => {
    const r = win.obligationRoll([{ amount: 100 }, { desc: 'no money' }, { amount: 250, status: 'done' }]);
    assert.equal(r.committed, 350); assert.equal(r.paid, 250); assert.equal(r.outstanding, 100);
  });

  test('an empty list is four zeroes, not a crash', () => {
    for (const arg of [[], null, undefined]){
      const r = win.obligationRoll(arg);
      assert.equal(r.committed, 0); assert.equal(r.paid, 0);
      assert.equal(r.outstanding, 0); assert.equal(r.overdue, 0);
    }
  });

  test('the tab head asks obligationRoll and draws nothing where there is no money', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function roomObligationsHtml'));
    assert.match(fn.slice(0, 3000), /const roll = obligationRoll\(obs\)/);
    assert.match(fn.slice(0, 3000), /money && roll\.committed/,
      'a line reading "0 paid of 0" is furniture');
  });
});

describe('f262 (7) — the tab draws chains then bands, over disjoint sets', () => {
  const draw = c => { win.canEdit = () => true; return win.roomObligationsHtml(c); };

  test('a chained step is drawn ONCE, in the chain and not in a band', () => {
    const c = chainContract();
    const html = draw(c);
    assert.ok(html.includes('obt-chain-hd'), 'the chain group draws');
    for (const o of c.obligations.slice(0, 4)) {
      const n = html.split(o.desc).length - 1;
      assert.equal(n, 1, `"${o.desc}" appears ${n} times`);
    }
    assert.ok(html.includes('Quarterly maintenance report'), 'and the unchained one still draws');
  });

  test('the chain comes BEFORE the bands on the page', () => {
    const html = draw(chainContract());
    assert.ok(html.indexOf('obt-chain-hd') < html.indexOf('obt-band'),
      'order is the reading; the bands hold what is left');
  });

  test('a held-back step says what it waits on, and is not merely tinted', () => {
    const html = draw(chainContract());
    assert.ok(html.includes('is-wait'), 'the row is set back and its connector dashed');
    assert.ok(/Waiting on step 2/.test(html), 'and it says so in words');
    assert.ok(/no reminder will be sent while step 2 is open/.test(html));
  });

  test('a contract with no chains draws no chain furniture at all', () => {
    const html = draw({ id: 'C', obligations: [{ id: 'a', desc: 'Only one', due: day(4) }] });
    assert.ok(!html.includes('obt-chain-hd'));
    assert.ok(!html.includes('obt-step'));
    assert.ok(html.includes('Only one'));
  });

  test('and an empty contract is still the empty state', () => {
    const html = draw({ id: 'C', obligations: [] });
    assert.ok(!html.includes('obt-chain-hd'));
    assert.ok(html.includes('obt-empty'));
  });
});

describe('f262 (8) — the worklist bands, filters and names the step', () => {
  test('the State filter offers the waiting cut, read off the BAND', () => {
    assert.ok(Array.from(win.OBW_STATE).some(x => x[0] === 'waiting'),
      'one more option in a control that is already there');
    const fn = OB_CODE.match(/function obwRows\(f\)\{[\s\S]*?\n\}/)[0];
    assert.match(fn, /f\.state === 'waiting' && o\.band !== 'waiting'/,
      'the cut and the heading it lands under cannot disagree');
  });

  test('the row names its step, and a held row what it waits on', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function renderObligationsList'));
    assert.match(fn, /const step = obligationStepNo\(o, o\._c\)/, 'through the one reading');
    assert.match(fn, /ob_step_n/);
    assert.match(fn, /ob_waiting_on/);
  });

  test('the foot grew from one figure to four, through the SAME homeSum', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function renderObligationsList'));
    const foot = fn.slice(fn.indexOf('const foot = (() =>'), fn.indexOf('host.innerHTML'));
    for (const k of ['ob_roll_committed', 'ob_roll_paid', 'ob_roll_outstanding', 'ob_roll_overdue'])
      assert.ok(foot.includes(k), k);
    /* Split once through one function, so paid + outstanding IS the total by
       construction rather than by three separate sums agreeing. */
    assert.equal((foot.match(/homeSum\(/g) || []).length, 4, 'one arithmetic, four cuts');
    assert.ok(foot.includes("i18t('ob_total')"),
      '"on this page" is kept — these are the rows the filters left');
    assert.ok(foot.includes('ob_total_left_out'), 'and it still says what it left out');
  });

  test('the three head counts do not overlap', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function renderObligationsList'));
    assert.match(fn, /const late = rows\.filter\(r => r\.st === 'overdue' && r\.band !== 'waiting'\)/);
    assert.match(fn, /const held = rows\.filter\(r => r\.band === 'waiting'\)/);
    assert.match(fn, /const open = rows\.filter\(r => r\.st !== 'done' && r\.band !== 'waiting'\)/);
    assert.match(fn, /ob_head_waiting/, 'and a page narrowed to waiting is headed as such');
  });
});

describe('f262 (9) — the sweep holds a blocked step', () => {
  test('the server has its own reading, off the STORED contract', () => {
    assert.match(SRV, /function srvObligationBlocked\(full, o\)/);
    /* The same shape as the browser's: direct predecessor, no walk, and a
       pointer at a step that is not there is not a block. */
    const fn = SRV.match(/function srvObligationBlocked\(full, o\) \{[\s\S]*?\n\}/)[0];
    assert.match(fn, /o\.status === 'done'/);
    assert.match(fn, /id === String\(o\.id \|\| ''\)/, 'a self-reference is not a block');
    assert.match(fn, /p\.status !== 'done'/);
    assert.ok(!/while|for \(/.test(fn), 'no walk, so no cycle can hang the sweep');
  });

  test('NONE of the four milestones fires for a held step', () => {
    const sweep = SRV.slice(SRV.indexOf('(full.obligations || []).forEach(o => {'));
    const guard = sweep.slice(0, sweep.indexOf('const who = obligationRecipient(o.assignee)'));
    assert.match(guard, /if \(srvObligationBlocked\(full, o\)\) \{/);
    assert.match(guard, /\n\s*return;\n\s*\}/, 'and it returns before any milestone');
    /* the four are BELOW the guard, so they are unreachable while it is held */
    const after = sweep.slice(sweep.indexOf('const who = obligationRecipient(o.assignee)'));
    for (const k of [':soon', ':today', ':overdue', ':escalate']) assert.ok(after.includes(k), k);
  });

  test('the owner is told ONCE, with its own dedupe key', () => {
    const sweep = SRV.slice(SRV.indexOf('if (srvObligationBlocked(full, o))'));
    const held = sweep.slice(0, sweep.indexOf('const who = obligationRecipient(o.assignee)'));
    assert.match(held, /od === 0/, 'on the day it comes due, not before');
    assert.match(held, /:held`/, 'its own key, so it is sent once');
    assert.match(held, /c\.owner && c\.owner\.name/, 'to the owner, not to whoever owes it');
    assert.match(held, /: admins/, 'and to the admins where no owner resolves');
    assert.match(held, /mail_ob_held_subject/);
  });

  test('and the mail names the step it is waiting on', () => {
    for (const lang of ['en', 'sv']) {
      const line = i18n.STRINGS[lang].mail_ob_held_line;
      assert.ok(line && line.includes('{step}'), lang + ' names the earlier step');
      assert.ok(line.includes('{desc}') && line.includes('{due}'), lang);
    }
  });
});

describe('f262 (10) — one door onto the order', () => {
  test('the form is the only place `after` is written', () => {
    /* The render drew an "Edit the order" button on the chain head as well. It
       is deliberately not built: a second door onto one act is the drift this
       rulebook opens by warning about. */
    const writes = (OB_CODE.match(/o\.after\s*=/g) || []).length;
    assert.equal(writes, 2, 'the picker and the carry-forward, both in the save');
    assert.ok(OB_CODE.includes("id=\"of-after\""), 'the picker exists');
    assert.ok(!/data-obt-chain-edit|Edit the order/.test(OB_CODE),
      'and no second door was built');
  });

  test('it never offers itself, and draws nothing with no sibling to point at', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function openObligationForm'));
    const block = fn.slice(fn.indexOf('const sibs ='), fn.indexOf("id=\"of-after\"") + 200);
    assert.match(block, /o !== \(c\.obligations \|\| \[\]\)\[seed\._i\]/, 'never itself');
    assert.match(block, /if\(!sibs\.length\) return '';/,
      'a control whose one answer is its own default is furniture');
  });

  test('a loop is refused in words, and the check is bounded', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function openObligationForm'));
    const guard = fn.slice(fn.indexOf('if(o.after){'), fn.indexOf('if(editing) c.obligations[seed._i]=o;'));
    assert.match(guard, /ob_after_loop/, 'named, not silently cleared');
    assert.match(guard, /hops-- > 0/, 'bounded, so an already-looped record cannot hang it');
    assert.match(guard, /next\.length \+ 1/);
  });

  test('setting the order is written into the contract history', () => {
    const fn = OB_CODE.slice(OB_CODE.indexOf('function openObligationForm'));
    assert.match(fn, /comes after "\$\{afterOb\.desc\|\|afterOb\.id\}"/,
      'it changes when reminders fire, so it is closer to a rule than to a note');
  });

  test('obligations still never travel to the counterparty', () => {
    /* Asserted rather than assumed, on every build that touches them. */
    const share = strip(read('js/negotiation.js'));
    const fn = share.slice(share.indexOf('function buildSharePayload'));
    assert.ok(!/obligations/.test(fn.slice(0, 6000)), 'the payload never carries them');
  });
});

describe('f262 (11) — the words, both languages', () => {
  const KEYS = ['ob_band_waiting', 'ob_chain', 'ob_chain_sub', 'ob_chain_paid', 'ob_step_n',
    'ob_waiting_on', 'ob_waiting_note', 'ob_head_waiting_one', 'ob_head_waiting_other',
    'ob_paid_of', 'ob_after', 'ob_after_none', 'ob_after_hint', 'ob_after_loop',
    'ob_f_state_waiting', 'ob_roll_committed', 'ob_roll_paid', 'ob_roll_outstanding',
    'ob_roll_overdue', 'mail_ob_held_subject', 'mail_ob_held_line'];

  for (const lang of ['en', 'sv']) {
    test(`${lang}: every new word is there and says something`, () => {
      for (const k of KEYS) {
        const v = i18n.STRINGS[lang][k];
        assert.ok(v && String(v).trim(), `${lang}.${k}`);
      }
    });
  }

  test('and the two languages do not say the same thing', () => {
    for (const k of ['ob_band_waiting', 'ob_chain', 'ob_after', 'ob_roll_outstanding'])
      assert.notEqual(i18n.STRINGS.en[k], i18n.STRINGS.sv[k], k + ' is translated');
  });

  test('every placeholder the code fills is in both dictionaries', () => {
    /* A template var only half supplied prints itself literally. */
    const pairs = [['ob_chain_sub', ['{n}', '{paid}', '{overdue}', '{waiting}']],
      ['ob_step_n', ['{n}', '{of}']], ['ob_waiting_on', ['{n}']],
      ['ob_waiting_note', ['{n}']], ['ob_paid_of', ['{paid}', '{all}']],
      ['ob_after_loop', ['{desc}']]];
    for (const lang of ['en', 'sv'])
      for (const [k, vars] of pairs)
        for (const v of vars)
          assert.ok(String(i18n.STRINGS[lang][k]).includes(v), `${lang}.${k} is missing ${v}`);
  });

  test('the chain has clothes, and a held step is not carried by colour alone', () => {
    for (const k of ['.obt-chain-hd', '.obt-step', '.obt-spine', '.obt-pip', '.obt-chip',
                     '.obt-paid', '.obt-wait', '.obw-m', '.obt-dot-wait'])
      assert.ok(CSS.includes(k), 'index.html defines ' + k);
    /* The `ui-input` lesson: a class the product writes and nothing defines. */
    assert.match(CSS, /\.obt-step\.is-wait\{[^}]*padding-left/, 'set back, not merely tinted');
    assert.match(CSS, /\.obt-step\.is-wait \.obt-spine::before\{[\s\S]*?repeating-linear-gradient/,
      'and its connector is dashed');
  });
});

describe('f262 (12) — the readings are published', () => {
  test('every name another module could reach is on the export list', () => {
    /* The rlPaperFootHtml fault, six times paid for: an unpublished name is
       unreachable and fails in SILENCE with a plausible fallback. */
    for (const n of ['obligationAfter', 'obligationPrev', 'obligationBlocked', 'obligationChain',
                     'obligationChains', 'obligationStepNo', 'obligationRoll'])
      assert.equal(typeof win[n], 'function', n + ' is on window');
  });
});

/* ================================================ 13 — THE SERVER, FOR REAL
   The section that matters most, and the one a source check cannot make. The
   whole payoff of the payment chain is a mail that DOES NOT GO OUT, and
   "nothing was sent" is exactly the shape a broken feature also has — so it is
   driven against a running server with a stand-in mail provider, with a
   CONTROL beside it: the same obligation, unchained, must still be nudged. */
const { startHatiWithMail, seedWorkspace } = require('./helpers');

describe('f262 (13) — the sweep, against a real server', () => {
  let h, W, mail;
  const MEMBER = 'Unrestricted Legal';
  const EMAIL = 'everything@example.co.ke';
  const iso = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const put = (id, obligations, v = 0, extra = {}) => W.admin.json('/api/contracts/' + id,
    { method: 'PUT', body: { baseVersion: v, contract: Object.assign({
      id, name: 'Plant line — ' + id, counterparty: 'Rift Valley Engineering Ltd',
      status: 'Signed', fields: {}, metadata: {}, obligations,
      audit: [], rounds: [], versions: [], signatures: [], comments: [] }, extra) } });
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const about = d => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(d));
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const settle = async (pred, ms = 2000) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(200);
  };

  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { await h.stop(); });

  test('THE CONTROL — the same step, unchained, IS nudged', async () => {
    /* Written FIRST and deliberately: without it, "no mail arrived" proves
       nothing, because a fixture that never reaches the sweep at all looks
       identical to a step correctly held back. */
    await put('MK-CH-1', [
      { id: 'p1', desc: 'Alpha delivery payment', due: iso(-30), status: 'open', assignee: MEMBER },
      { id: 'p2', desc: 'Alpha commissioning payment', due: iso(0), status: 'open', assignee: MEMBER },
    ]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Alpha commissioning payment').length >= 1);
    const got = about('Alpha commissioning payment');
    assert.equal(got.length, 1, 'unchained, it is nudged on the day it falls due');
    assert.equal(got[0].to, EMAIL);
  });

  test('AND THE FEATURE — chained behind an open step, it is NOT', async () => {
    /* The identical obligation, on the identical day, to the identical person.
       The ONLY difference is `after`. */
    await put('MK-CH-2', [
      { id: 'q1', desc: 'Bravo delivery payment', due: iso(-30), status: 'open', assignee: MEMBER },
      { id: 'q2', desc: 'Bravo commissioning payment', due: iso(0), status: 'open',
        assignee: MEMBER, after: 'q1' },
    ]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => mail.sent.length >= 1);
    assert.equal(about('Bravo commissioning payment').filter(m => m.to === EMAIL).length, 0,
      'nobody is chased about a step that cannot happen yet');
  });

  test('…and the silence is not silent: the owner is told, once', async () => {
    /* The held notice rides its own dedupe key, so a second sweep on the same
       day adds nothing. */
    const held = () => mail.sent.filter(m => /Held back/i.test(m.subject || ''));
    assert.equal(held().length, 1, 'exactly one held notice: '
      + JSON.stringify(mail.sent.map(m => m.subject)));
    assert.match(held()[0].text || '', /Bravo delivery payment/,
      'and it names the step being waited on');
    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(400);
    assert.equal(mail.sent.filter(m => /Held back/i.test(m.subject || '')).length, 0,
      'a second sweep the same day says nothing again');
  });

  test('once the earlier step is done, the held one is reminded about as usual', async () => {
    /* The property that makes the whole thing safe rather than merely quiet:
       holding a step DELAYS its reminders, it does not cancel them. */
    await put('MK-CH-3', [
      { id: 'r1', desc: 'Charlie delivery payment', due: iso(-30), status: 'done' },
      { id: 'r2', desc: 'Charlie commissioning payment', due: iso(0), status: 'open',
        assignee: MEMBER, after: 'r1' },
    ]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Charlie commissioning payment').length >= 1);
    const got = about('Charlie commissioning payment').filter(m => m.to === EMAIL);
    assert.equal(got.length, 1, 'the chain has moved on, so the nudge goes out');
    assert.ok(!/Held back/i.test(got[0].subject || ''), 'as an ordinary reminder');
  });

  test('a pointer at a step that is not there does not silence anything', async () => {
    /* Deleting a step must not quietly stop every reminder after it. */
    await put('MK-CH-4', [
      { id: 's2', desc: 'Delta commissioning payment', due: iso(0), status: 'open',
        assignee: MEMBER, after: 'deleted-long-ago' },
    ]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Delta commissioning payment').length >= 1);
    assert.equal(about('Delta commissioning payment').filter(m => m.to === EMAIL).length, 1,
      'unchained by construction, so it is nudged');
  });
});
