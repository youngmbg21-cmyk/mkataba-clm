/* FOLLOW ME — walking through a contract together. Two people, two browsers.
 *
 * Young picked it by name: one leader, the others' pages follow, one press to
 * stop.
 *
 * WHAT THIS DRIVES, where each person looks:
 *   1. two colleagues on the negotiate page, each seeing the other's face;
 *   2. the follower presses a face — it lights, and says so in words;
 *   3. the leader scrolls to a clause far down the paper, and the FOLLOWER'S
 *      OWN PAGE arrives there — measured off the rendered page, not from a
 *      flag;
 *   4. and it is a destination and not a mirror: the follower's text size,
 *      their notes and their hands are untouched;
 *   5. pressing the same face again stops it, and the page stops moving;
 *   6. the leader never learns they are being followed — this is the
 *      follower's own choice about their own page.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'follow-me');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-F1', contractNo: 'MK-F1', name: 'Facilities Agreement',
  counterparty: 'Juno Limited', counterpartyEmail: 'legal@juno.example',
  folder: 'proc', value: 820000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '2 Oct 2026', expiry: '2029-08-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 820000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-4), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [], negotiation: { round: 1, rounds: [] },
  body: '<h2>4. Payment Terms</h2><p>Invoices are payable within 60 days.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 14000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const login = async (email, pass, tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email);
    await p.fill('#li-pass', pass);
    await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-F1'), null, 15000);
    return { ctx, p };
  };
  /* WHICH CLAUSE IS IN THE MIDDLE OF THIS SCREEN — the page's own reading, so
     the stage measures what the feature measures and cannot drift from it. */
  const where = p => p.evaluate(() => (window.presenceSpotNow ? presenceSpotNow() : null));
  const openBench = async (p) => {
    await p.evaluate(() => openRedlineWorkbench('MK-F1'));
    await until(p, () => !!document.querySelector('#rl-doc [data-clause]'), null, 16000);
    await p.waitForTimeout(600);
  };

  try {
    const a = await login('admin@example.co.ke', 'adminpassword1', 'a');
    const b = await login('everything@example.co.ke', 'their-own-pass-9', 'b');
    /* The clause ids are stamped on the record by the first save, which is what
       makes them the same id on both screens — the product's own rule. */
    const ids = await a.p.evaluate(async () => {
      const c = getContract('MK-F1');
      c._loaded = false; await ensureFull(c);
      const list = negoClauseList(c);
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      return list.map(x => x.clauseId);
    });
    ok('0 the contract has clauses, and their ids are on the record', ids.length >= 8, String(ids.length));
    await b.p.reload({ waitUntil: 'networkidle' });
    await until(b.p, () => typeof getContract === 'function' && !!getContract('MK-F1'), null, 15000);

    /* ===== 1. BOTH ON THE NEGOTIATE PAGE ===== */
    await openBench(a.p);
    await openBench(b.p);
    const saw = await until(b.p, () => !!document.querySelector('[data-pz-follow]'), null, 40000);
    const row = await b.p.evaluate(() => {
      const f = document.querySelector('[data-pz-follow]');
      return { btn: !!f, tag: f ? f.tagName : '', mono: f ? f.textContent.trim() : '',
        title: f ? (f.getAttribute('title') || '') : '',
        pressed: f ? f.getAttribute('aria-pressed') : null };
    });
    ok('1a the follower sees the leader\'s face on the negotiate page\'s own head',
      saw && row.btn && row.mono === 'AO', JSON.stringify(row.mono));
    ok('1b and it is a real button that says what a press does',
      row.tag === 'BUTTON' && row.pressed === 'false' && /Walk through it with Amina/.test(row.title),
      JSON.stringify(row.title.slice(0, 60)));
    await b.p.screenshot({ path: path.join(OUT, '1-the-face.png') });

    /* ===== 2. PRESSING IT LIGHTS IT ===== */
    /* GUARDED, so a tree without the face REPORTS rather than spending thirty
       seconds waiting for a button that is not there. */
    if (row.btn) await b.p.click('[data-pz-follow]');
    const lit = await b.p.evaluate(() => {
      const f = document.querySelector('[data-pz-follow]');
      const cs = f ? getComputedStyle(f) : null;
      return { on: !!(f && f.classList.contains('is-following')),
        pressed: f ? f.getAttribute('aria-pressed') : null,
        title: f ? (f.getAttribute('title') || '') : '',
        following: window.presenceFollowing ? presenceFollowing() : null,
        bg: cs ? cs.backgroundColor : '', w: f ? Math.round(f.getBoundingClientRect().width) : 0,
        bands: document.querySelectorAll('.pz-strip, .pz-band, .pz-notice').length };
    });
    ok('2a the face lights, and says it is following', lit.on && lit.pressed === 'true'
      && /Following Amina/.test(lit.title) && !!lit.following, JSON.stringify(lit.title));
    ok('2b and NO band, strip or notice appeared for the state',
      lit.bands === 0 && lit.w > 10 && lit.w < 26, JSON.stringify([lit.bands, lit.w]));

    /* ===== 3. THE LEADER MOVES AND THE FOLLOWER ARRIVES ===== */
    const startedAt = await where(b.p);
    const target = ids[Math.max(0, ids.length - 2)];
    await a.p.evaluate(cid => { if (window.rlJumpToClause) rlJumpToClause(cid); }, target);
    await a.p.waitForTimeout(900);
    const leaderAt = await where(a.p);
    ok('3a the leader is now on a clause far down the paper',
      !!leaderAt && leaderAt !== startedAt, JSON.stringify([startedAt, leaderAt]));
    /* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause before
       measuring. It travels on the beat, so it takes up to one beat. */
    const arrived = await until(b.p, want => (window.presenceSpotNow ? presenceSpotNow() : null) === want,
      leaderAt, 45000);
    const followerAt = await where(b.p);
    ok('3b and the FOLLOWER\'S OWN PAGE arrives at the same clause — measured off the page',
      arrived && followerAt === leaderAt, JSON.stringify([leaderAt, followerAt]));
    const painted = await b.p.evaluate(cid => {
      const el = document.querySelector(`#rl-doc [data-clause="${cid}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { onScreen: r.top < innerHeight && r.bottom > 0, lit: el.classList.contains('rl-arrived') };
    }, leaderAt);
    ok('3c it is really on their screen, lit the way their own press lights it',
      !!painted && painted.onScreen && painted.lit, JSON.stringify(painted));
    await b.p.screenshot({ path: path.join(OUT, '2-arrived.png') });

    /* ===== 4. A DESTINATION, NOT A MIRROR ===== */
    const theirs = await b.p.evaluate(() => ({
      scale: getComputedStyle(document.documentElement).getPropertyValue('--doc-scale').trim(),
      sel: String((window.getSelection && getSelection().toString()) || ''),
      editing: !!document.getElementById('clause-editor'),
      panel: !!document.querySelector('.rl-cp-open, [data-rl-cp-open].on') }));
    ok('4a the follower\'s own page is still theirs — no editor, no selection, no panel opened',
      !theirs.editing && !theirs.sel && !theirs.panel, JSON.stringify(theirs));
    /* THE LEADER LEARNS NOTHING: following is the follower's own choice about
       their own page, and there is nothing on the leader's screen about it. */
    const leaderSide = await a.p.evaluate(() => {
      const f = document.querySelector('[data-pz-follow]');
      return { lit: !!(f && f.classList.contains('is-following')),
        says: /[Ff]ollowing/.test(document.body.innerText) };
    });
    ok('4b and the leader is told nothing about being followed',
      leaderSide.lit === false && leaderSide.says === false, JSON.stringify(leaderSide));

    /* ===== 5. ONE PRESS TO STOP ===== */
    if (row.btn) await b.p.click('[data-pz-follow]');
    const off = await b.p.evaluate(() => {
      const f = document.querySelector('[data-pz-follow]');
      return { on: !!(f && f.classList.contains('is-following')),
        following: window.presenceFollowing ? presenceFollowing() : 'no-fn',
        title: f ? (f.getAttribute('title') || '') : '' };
    });
    ok('5a the same press stops it', off.on === false && off.following === null
      && /Walk through it with/.test(off.title), JSON.stringify(off.following));
    /* ---- AND THE PAGE STOPS MOVING, DRIVEN RATHER THAN WAITED OUT ----
       Sitting out two beats would add a minute to this stage for one claim,
       and a test whose answer depends on a sleep is one nobody runs. So the
       walk is pressed DIRECTLY with the leader's new spot: it is the one
       function the beat calls, and with nobody being followed it must move
       nothing. The same call with the follow ON is driven above, end to end,
       through the real beat. */
    const stoppedAt = await where(b.p);
    const ignored = await b.p.evaluate(a => {
      if (!window.presenceWalk) return 'no-fn';
      const moved = presenceWalk([{ id: a.lead, name: 'Amina Otieno', at: new Date().toISOString(), spot: a.to }]);
      return { moved, at: window.presenceSpotNow ? presenceSpotNow() : null };
    }, { lead: await b.p.evaluate(() => { const f = document.querySelector('[data-pz-follow]');
      return f ? f.getAttribute('data-pz-follow') : ''; }), to: ids[0] });
    ok('5b and the page stops moving — the leader walks on alone',
      ignored && ignored.moved === false && ignored.at === stoppedAt,
      JSON.stringify([stoppedAt, ignored]));

    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
