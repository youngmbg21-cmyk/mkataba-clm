/* f431 — THE REMINDER LINE (Insights · Obligations, owner-picked 28 Sep 2026)
   ========================================================================
   The owner picked "Reminder Line" by name off three drawn options and said
   "build": every open obligation is a dot on its due date, one lane per
   person carrying it on our side (and one for nobody), lanes for their side,
   a window in each lane when that person's reminder emails go out, a hollow
   dot where nobody will ever be emailed, and overdue left of a Today line.

   WHAT THIS PINS, and why each is a rule rather than a look:
   1  LANES ARE PEOPLE, not spellings — one member typed two ways is one lane;
      a name the mail cannot reach keeps its own lane, marked.
   2  THE WINDOW IS THE SWEEP'S OWN MILESTONES. The first and last day of a
      lane's window are read here off server/server.js (runOurPromises for
      ours, runReminders for theirs), so moving the sweep fails HERE rather
      than leaving a picture confidently drawing the wrong week.
   3  HOLLOW ⇔ THE SWEEP SENDS NOBODY, BY ONE PREDICATE. obReminderOf decides
      each obligation once; the headline count and the dot both take its
      answer. A second copy of the rule is how the picture and the figure
      come to disagree.
   4  OVERDUE SITS LEFT OF TODAY, measured on the drawn markup.
   5  EVERY FIGURE IS A DOOR ONTO EXACTLY WHAT IT COUNTED; a zero is not one.
   Fixture dates are OFFSETS from today, never day numbers. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const IG = strip(read('js/views/intelligence.js'));
const OB = strip(read('js/obligations.js'));
const SRV = strip(read('server/server.js'));
const I18N = read('js/i18n.js');

function bodyOf(src, name){
  const i = src.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name + ' is not declared');
  let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){
    if (src[k] === '{') d++;
    else if (src[k] === '}' && --d === 0) return src.slice(j, k + 1);
  }
  throw new Error('unbalanced braces in ' + name);
}
const day = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

/* THE SWEEP'S MILESTONES, READ OFF THE SERVER — never typed here. */
function sweepDays(){
  const ours = bodyOf(SRV, 'runOurPromises');
  const m = /const MILESTONE = \{([^}]*)\}/.exec(ours);
  assert.ok(m, 'runOurPromises names its milestones');
  const oursDays = [...m[1].matchAll(/\[?(-?\d+)\]?\s*:/g)].map(x => Number(x[1]));
  const theirs = bodyOf(SRV, 'runReminders');
  const at = theirs.indexOf("String(o.party) !== 'theirs'");
  assert.ok(at > 0, 'runReminders keeps their side');
  const tail = theirs.slice(at);
  const theirsDays = [...tail.matchAll(/od === (-?\d+) && fireTo\(/g)].map(x => Number(x[1]));
  assert.ok(oursDays.length >= 3 && theirsDays.length >= 3, 'both sweeps name their days');
  return { ours: { first: Math.max(...oursDays), last: Math.min(...oursDays) },
    theirs: { first: Math.max(...theirsDays), last: Math.min(...theirsDays) } };
}

function stage(){
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.getUsers = () => ([
    { id: 'u1', name: 'Amina Otieno', email: 'amina@example.co.ke' },
    { id: 'u2', name: 'Brian Kariuki', email: 'brian@example.co.ke' },
  ]);
  let n = 0;
  const ob = o => Object.assign({ id: 'ob' + (++n), desc: 'Duty ' + n, due: '', recurring: 'none',
    assignee: '', status: 'open' }, o);
  win.state = { contracts: [
    { id: 'MK-1', name: 'Supply', counterparty: 'Naivas', status: 'Signed', owner: { name: 'Former Colleague' },
      obligations: [
        ob({ due: day(12), assignee: 'Amina Otieno' }),
        ob({ due: day(-1), assignee: 'amina@example.co.ke' }),     // the same person, typed as an address
        ob({ due: day(-2), assignee: 'Amina Otieno' }),            // past the day-after mail: hollow
        ob({ due: day(-40), assignee: 'Amina Otieno' }),           // far past: hollow, left of today
        ob({ due: day(200), assignee: 'Amina Otieno' }),           // past the line's horizon: "later"
        ob({ due: '', assignee: 'Amina Otieno' }),                 // no date: hollow, "no date"
        ob({ due: day(20), assignee: 'Someone Who Left' }),        // not a member, owner unreachable
        ob({ due: day(8) }),                                       // nobody named, owner unreachable
        ob({ due: day(6), party: 'theirs', assignee: 'Brian Kariuki' }),
        ob({ due: day(-4), party: 'theirs', assignee: 'Brian Kariuki' }), // their last mail (admins) is today
        ob({ due: day(-5), party: 'theirs', assignee: 'Brian Kariuki' }), // one past it: hollow
        ob({ due: day(3), party: 'theirs' }),                      // nobody chasing: hollow
        ob({ due: day(-30), status: 'done', completedAt: day(-31), recurring: 'monthly' }),
      ] },
    /* our promise with nobody named, on a contract whose OWNER the mail reaches */
    { id: 'MK-2', name: 'Lease', counterparty: 'Britam', status: 'Signed', owner: { id: 'u1', name: 'Amina Otieno' },
      obligations: [ ob({ due: day(4) }) ] },
    { id: 'MK-3', name: 'Empty', counterparty: 'Kwezi', status: 'Signed', obligations: [] },
  ] };
  return { w, win, d: win.intelObligationsData() };
}
const allDots = L => [...L.dots, ...L.later, ...L.nodate];

describe('f431 (1) — a lane per person carrying it', () => {
  test('ours: one lane per member however the name was typed, one for a lost name, one for nobody', () => {
    const { d } = stage();
    const names = d.lanes.ours.map(L => L.named ? L.name : '(nobody)');
    assert.equal(names.filter(x => x === 'Amina Otieno').length, 1, 'the typed name and the address are one lane');
    const am = d.lanes.ours.find(L => L.name === 'Amina Otieno');
    assert.equal(am.n, 6, 'every one of Amina’s six open promises is on her lane');
    assert.equal(am.owned, true);
    const lost = d.lanes.ours.find(L => L.name === 'Someone Who Left');
    assert.ok(lost && lost.owned === false, 'a name the mail cannot reach keeps its own lane, marked');
    const nobody = d.lanes.ours.find(L => !L.named);
    assert.equal(nobody.n, 2, 'nobody named: one on each contract');
    assert.equal(nobody.viaOwner, 1, 'and the one whose contract owner is a member goes to the owner');
  });

  test('theirs: a lane per colleague watching it, and one for nobody chasing', () => {
    const { d } = stage();
    const br = d.lanes.theirs.find(L => L.name === 'Brian Kariuki');
    assert.ok(br && br.n === 3 && br.owned);
    assert.ok(d.lanes.theirs.some(L => !L.named && L.n === 1));
    assert.ok(!d.lanes.ours.some(L => L.name === 'Brian Kariuki'), 'a side is its own group');
  });

  test('the drawing’s order: people the mail reaches, then nobody, then names it cannot reach', () => {
    const { d } = stage();
    const rank = L => L.owned ? 0 : (!L.named ? 1 : 2);
    const r = [...d.lanes.ours].map(rank);
    assert.deepEqual(r, [...r].sort((a, b) => a - b));
  });

  test('every open obligation is on exactly one lane', () => {
    const { d } = stage();
    const onLanes = [...d.lanes.ours, ...d.lanes.theirs].reduce((s, L) => s + allDots(L).length, 0);
    assert.equal(onLanes, d.open);
  });
});

describe('f431 (2) — the window is the sweep’s own milestones', () => {
  test('read off server.js, and the predicate carries exactly those days', () => {
    const S = sweepDays();
    const { win } = stage();
    const c = win.state.contracts[0];
    const ours = win.obReminderOf(c.obligations[0], c);
    const theirs = win.obReminderOf(c.obligations[8], c);
    assert.equal(ours.first, S.ours.first, 'our first mail is runOurPromises’ first milestone');
    assert.equal(-ours.last, -S.ours.last, 'our last mail is runOurPromises’ last milestone');
    assert.equal(theirs.first, S.theirs.first, 'their first mail is runReminders’ first milestone');
    assert.equal(theirs.last, S.theirs.last, 'their last mail is runReminders’ last (the admins’ day four)');
  });

  test('a lane draws that window only where everyone on it is reached', () => {
    const S = sweepDays();
    const { d } = stage();
    const am = d.lanes.ours.find(L => L.name === 'Amina Otieno');
    assert.deepEqual({ ...am.band }, S.ours);
    const br = d.lanes.theirs.find(L => L.name === 'Brian Kariuki');
    assert.deepEqual({ ...br.band }, S.theirs);
    assert.equal(d.lanes.ours.find(L => !L.named).band, null, 'a hollow dot never sits in a window');
    assert.equal(d.lanes.ours.find(L => L.name === 'Someone Who Left').band, null);
  });

  test('the drawn window spans those days on the line', () => {
    const S = sweepDays();
    const { win, d } = stage();
    const html = win.intelObligationsHtml();
    const H = d.horizon, X = off => Math.round(((off + H) / (2 * H) * 100) * 100) / 100;
    const m = /class="ob-rl-win" style="left:([\d.]+)%;width:([\d.]+)%"/.exec(html);
    assert.ok(m, 'a window is drawn');
    assert.equal(Number(m[1]), X(S.ours.last), 'it opens on the last mail');
    assert.ok(Math.abs(Number(m[1]) + Number(m[2]) - X(S.ours.first)) < 0.02, 'and closes on the first');
  });
});

describe('f431 (3) — hollow ⇔ the sweep sends nobody, by one predicate', () => {
  test('every dot’s fill is the predicate’s answer, and the hollow ones ARE the headline', () => {
    const { win, d } = stage();
    const byKey = new Map();
    win.state.contracts.forEach(c => (c.obligations || []).forEach((o, i) => byKey.set(win.obKeyOf(c.id, o, i), { o, c })));
    let hollow = 0;
    [...d.lanes.ours, ...d.lanes.theirs].forEach(L => allDots(L).forEach(dt => {
      const { o, c } = byKey.get(dt.key);
      assert.equal(dt.told, !win.obReminderOf(o, c).quiet, dt.desc);
      if (!dt.told) hollow++;
    }));
    assert.equal(hollow, d.silent, 'the hollow dots and the headline are one count');
    assert.deepEqual([...d.keys.silent].sort(),
      [...d.lanes.ours, ...d.lanes.theirs].flatMap(L => allDots(L)).filter(x => !x.told).map(x => x.key).sort());
  });

  test('the milestones decide it: told through the last mail, hollow the day after', () => {
    const S = sweepDays();
    const { win } = stage();
    const c = win.state.contracts[0];
    const at = (o, off) => win.obReminderOf(Object.assign({}, o, { due: day(off) }), c).quiet;
    const ours = c.obligations[0], theirs = c.obligations[8];
    assert.equal(at(ours, S.ours.first), false);
    assert.equal(at(ours, S.ours.last), false, 'the day of our last mail still reaches Amina');
    assert.equal(at(ours, S.ours.last - 1), true, 'the day after it, nothing more is sent');
    assert.equal(at(theirs, S.theirs.last), false);
    assert.equal(at(theirs, S.theirs.last - 1), true);
  });

  test('ONE predicate: the counter asks obReminderOf and keeps no copy of the rule', () => {
    const data = bodyOf(IG, 'intelObligationsData');
    assert.match(data, /obReminderOf\(o,\s*c\)/);
    assert.ok(!/OB_LAST_/.test(data), 'the counter compares against no milestone of its own');
    assert.ok(!/obligationReminderTo|obligationOwnerTo/.test(data), 'nor resolves a recipient itself');
    const html = bodyOf(IG, 'intelObligationsHtml');
    assert.ok(!/OB_LAST_|obReminderOf|obligationReminderTo/.test(html), 'the renderer decides nothing');
    assert.match(html, /dt\.told\?'is-told':'is-silent'/, 'the dot’s fill is the data’s answer');
    const p = bodyOf(IG, 'obReminderOf');
    assert.match(p, /obligationReminderTo\(/, 'the assignee resolves as the sweep’s obligationRecipient');
    assert.match(p, /obligationOwnerTo\(/, 'and ours falls back to the owner, as runOurPromises does');
  });

  test('the drawn hollow dots match the data', () => {
    const { win, d } = stage();
    const html = win.intelObligationsHtml();
    const drawnHollow = (html.match(/class="ob-rl-dot is-silent"/g) || []).length;
    const dataHollow = [...d.lanes.ours, ...d.lanes.theirs].flatMap(L => L.dots).filter(x => !x.told).length;
    assert.equal(drawnHollow, dataHollow);
  });

  test('a silent dot’s hover says why in words, never a code', () => {
    const { win } = stage();
    const html = win.intelObligationsHtml();
    const tips = [...html.matchAll(/class="ob-rl-dot is-silent"[^>]*title="([^"]*)"/g)].map(m => m[1]);
    assert.ok(tips.length > 0);
    tips.forEach(t => {
      assert.ok(!/\b(nodate|noowner|unreadable|spent)\b/.test(t), 'a reason code leaked: ' + t);
      assert.ok(/:/.test(t) && t.length > 40, 'the reason is a sentence: ' + t);
    });
  });
});

describe('f431 (4) — overdue sits left of today', () => {
  test('every dot’s place against the Today line follows its date', () => {
    const { win, d } = stage();
    const html = win.intelObligationsHtml();
    const now = Number(/class="ob-rl-now" style="left:([\d.]+)%"/.exec(html)[1]);
    const dots = [...html.matchAll(/class="ob-rl-dot[^"]*" style="left:([\d.]+)%;[^"]*"\s*data-ob-rl-key="([^"]+)"/g)]
      .map(m => ({ x: Number(m[1]), key: m[2].replace(/&#58;|&colon;/g, ':') }));
    const od = new Map([...d.lanes.ours, ...d.lanes.theirs].flatMap(L => L.dots).map(x => [x.key, x.od]));
    assert.equal(dots.length, od.size, 'every dot with a day in range is drawn once');
    dots.forEach(p => {
      const o = od.get(p.key);
      assert.ok(o != null, 'drawn dot is a counted one: ' + p.key);
      if (o < 0) assert.ok(p.x < now, `${p.key} is ${-o} days late and must sit left of today`);
      else assert.ok(p.x >= now, `${p.key} falls due in ${o} days and must not sit left of today`);
    });
  });
});

describe('f431 (5) — every figure is a door onto what it counted', () => {
  test('the tiles carry the counted sets, and a zero is not a door', () => {
    const { win, d } = stage();
    win.obwGoFiltered = win.obwGoFiltered || (() => {});
    win.regShowOnly = win.regShowOnly || (() => {});
    const html = win.intelObligationsHtml();
    assert.match(html, /data-ob-rl-door="silent"/);
    assert.match(html, /data-ob-rl-door="late"/);
    assert.equal(d.keys.silent.length, d.silent);
    assert.equal(d.keys.overdue.length, d.overdue);
    assert.equal(d.keys.ahead.length, d.ahead);
    assert.equal(d.coverIds.length, d.cover.none);
    assert.equal(/data-ob-rl-door="ontime"/.test(html), d.keys.ontime.length > 0);
    /* A ZERO IS NOT A DOOR: a lane column with nothing in it is an em-dash. */
    const lanes = [...d.lanes.ours, ...d.lanes.theirs];
    const laterDoors = (html.match(/data-ob-rl-door="lane:[a-z]+:\d+:later"/g) || []).length;
    assert.equal(laterDoors, lanes.filter(L => L.later.length).length);
    assert.ok(lanes.some(L => !L.later.length), 'the fixture has a lane with nothing later');
  });

  test('the list narrows to exactly those keys', () => {
    const { win, d } = stage();
    const book = win.obwBook();
    const f = { whose:'all', state:'open', side:'all', folder:'all', due:'all', only:{ keys:d.keys.silent.slice(), label:'x' } };
    assert.equal(book.filter(o => win.obwPass(o, f)).length, d.silent);
    assert.ok(win.obwNarrowing(f).includes('only'), 'the narrowing is counted, so Clear lights');
  });

  test('a dot opens its obligation in its own place', () => {
    const html = bodyOf(IG, 'intelObligationsWire');
    assert.match(html, /obOpenContract\(dot\.getAttribute\('data-ob-rl-cid'\),\s*dot\.getAttribute\('data-ob-rl-key'\)\)/);
    const open = bodyOf(OB, 'obOpenContract');
    assert.match(open, /insSelect\('oblig:'\s*\+\s*cid,\s*key\)/, 'the row is picked on the tab before it paints');
  });
});

describe('f431 (6) — both languages', () => {
  test('every ob_rl_ key used is in both books, and translated', () => {
    const used = [...new Set([...(read('js/views/intelligence.js') + read('js/obligations.js'))
      .matchAll(/i18tn?\('(ob_rl_[a-z_0-9]*)'/g)].map(m => m[1]))];
    assert.ok(used.length > 40, 'the line carries its own words: ' + used.length);
    const vals = k => [...I18N.matchAll(new RegExp('^    ' + k + ": '([^']*)'", 'gm'))].map(m => m[1]);
    used.forEach(k => {
      const one = vals(k), plural = [vals(k + '_one'), vals(k + '_other')];
      const ok = one.length === 2 || (plural[0].length === 2 && plural[1].length === 2);
      assert.ok(ok, k + ' is not in both books');
      if (one.length === 2 && !/^(\{who\} · |\{n\} )/.test(one[0])) assert.notEqual(one[0], one[1], k + ' is untranslated');
    });
  });
});
