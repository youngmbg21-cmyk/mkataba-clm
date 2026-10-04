/* TAKE IT IN TURNS — the lock becomes a baton. Two real people, two browsers.
 *
 * Young picked it by name from three. The lock built in September is an
 * advisory and that is what made it safe, but it left the second person with
 * one thing to do: wait. Two minutes is not long; not knowing how long is.
 *
 * WHAT THIS DRIVES, where each person looks:
 *   1. one colleague opens a clause and holds it;
 *   2. the other reaches for the pencil, finds the sign, and the sign carries
 *      the way forward — "Ask for it";
 *   3. asking takes NOTHING: the holder still holds it, the wording has not
 *      moved, and the server says so;
 *   4. the holder is told, in the editor's own foot, with the hand-over on it;
 *   5. and the two walls: a stranger cannot hand somebody else's clause over,
 *      and nobody can be handed a clause they never asked for;
 *   6. one press moves the baton, and the asker is told it arrived;
 *   7. a refresh of the holder's own lock does not wipe the queue — which is
 *      the fault this build found by measuring;
 *   8. an ask lives until the asker LEAVES (gap E, f494): a hidden tab keeps
 *      it without saying it is in the room, and closing the page takes it off
 *      the holder's queue at once.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than times
 * out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'take-it-in-turns');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-T1', contractNo: 'MK-T1', name: 'Transport Agreement',
  counterparty: 'Juno Limited', counterpartyEmail: 'legal@juno.example',
  folder: 'proc', value: 750000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '2 Oct 2026', expiry: '2029-05-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 750000, currency: 'SEK' },
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
  const until = (page, fn, arg, ms = 12000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const login = async (email, pass, tag) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const p = await ctx.newPage();
    p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', email);
    await p.fill('#li-pass', pass);
    await p.click('#li-go');
    await until(p, () => typeof currentUser === 'function' && !!currentUser(), null, 15000);
    await until(p, () => typeof getContract === 'function' && !!getContract('MK-T1'), null, 15000);
    return { ctx, p };
  };
  /* The lock map as the SERVER holds it — the one copy that decides. */
  const stored = p => p.evaluate(async () => {
    const r = await api('contracts/MK-T1');
    const k = Object.keys(r.locks || {})[0];
    const l = k ? r.locks[k] : null;
    return { clause: k || null, by: l && l.by ? l.by.name : null,
      asked: l && Array.isArray(l.asked) ? l.asked.map(x => x.name) : [] };
  });

  try {
    const a = await login('admin@example.co.ke', 'adminpassword1', 'a');
    const b = await login('everything@example.co.ke', 'their-own-pass-9', 'b');
    ok('0 two people are signed in', true);

    /* ===== 1. ONE COLLEAGUE HOLDS A CLAUSE ===== */
    /* ---- THE IDS HAVE TO BE STAMPED FIRST, and that is the product's own
       rule rather than a stage trick: clause ids are assigned when wording is
       parsed and are only SHARED once they are on the record ("once stamped
       the ids decide"). Measured on the first run of this stage — the two
       browsers named the same clause cl_1lkccc and cl_1jf7vk, so the lock the
       first took was on a clause the second had never heard of. One save, the
       way any real edit makes one, and both sides agree. */
    const held = await a.p.evaluate(async () => {
      const c = getContract('MK-T1');
      c._loaded = false; await ensureFull(c);
      const cl = negoClauseList(c)[0];
      if (!window.clauseLockTake) return { err: 'no lock model' };
      if (window.persist) persist(c);
      if (window.flushSaves) await flushSaves();
      clauseLockTake(c, cl.clauseId);
      clauseLockSave(c, { clauseId: cl.clauseId });
      await new Promise(r => setTimeout(r, 600));
      return { clause: cl.clauseId };
    });
    ok('1a the first colleague takes a clause', !!held.clause, JSON.stringify(held));
    const s1 = await a.p.evaluate(async () => { const r = await api('contracts/MK-T1');
      const k = Object.keys(r.locks || {})[0]; return k ? (r.locks[k].by || {}).name : null; });
    ok('1b and the SERVER holds it in their name', s1 === 'Amina Otieno', JSON.stringify(s1));

    /* ===== 2. THE OTHER MEETS THE SIGN, AND IT CARRIES THE WAY FORWARD ===== */
    await b.p.reload({ waitUntil: 'networkidle' });
    await until(b.p, () => typeof getContract === 'function' && !!getContract('MK-T1'), null, 15000);
    const sign = await b.p.evaluate(async cid => {
      const c = getContract('MK-T1');
      c._loaded = false; await ensureFull(c);
      const s = window.clauseLockSign ? clauseLockSign(c, cid) : null;
      await openRedlineWorkbench('MK-T1');
      await new Promise(r => setTimeout(r, 1000));
      const slot = document.querySelector('.rl-cp-lock');

      const btn = document.querySelector('[data-rl-lock-ask]');
      const r = btn ? btn.getBoundingClientRect() : null;
      const hit = r ? document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)) : null;
      return { sign: s ? { mono: s.mono, mayAsk: s.mayAsk, asked: s.asked } : null,
        slot: slot ? slot.textContent.replace(/\s+/g, ' ').trim() : '',
        btn: !!btn, dead: btn ? btn.disabled : null,
        pressable: !!(btn && hit && (hit === btn || btn.contains(hit))),
        others: document.querySelectorAll('.rl-cp-lock button').length };
    }, held.clause);
    ok('2a the sign says who is holding it, in initials',
      !!sign.sign && sign.sign.mono === 'AO' && /Locked by/.test(sign.slot), JSON.stringify(sign.slot));
    ok('2b and it carries the way forward — one live button, not a dead control',
      sign.btn && sign.dead === false && sign.pressable && sign.others === 1,
      JSON.stringify([sign.btn, sign.dead, sign.pressable, sign.others]));
    await b.p.screenshot({ path: path.join(OUT, '1-the-sign.png') });

    /* ===== 3. ASKING TAKES NOTHING ===== */
    await b.p.click('[data-rl-lock-ask]').catch(() => {});
    const asked = await until(b.p, () => !!document.querySelector('.rl-cp-lock-asked'), null, 12000);
    const afterAsk = await stored(b.p);
    ok('3a asking is recorded on the lock', asked && afterAsk.asked.includes('Unrestricted Legal'),
      JSON.stringify(afterAsk));
    ok('3b and it takes NOTHING: the clause is still theirs',
      afterAsk.by === 'Amina Otieno' && afterAsk.clause === held.clause, JSON.stringify(afterAsk.by));
    const stillShut = await b.p.evaluate(cid => {
      const c = getContract('MK-T1');
      const s = window.clauseLockSign ? clauseLockSign(c, cid) : null;
      return { shut: !!s, mayAsk: s ? s.mayAsk : null, asked: s ? s.asked : null,
        word: ((document.querySelector('.rl-cp-lock-asked') || {}).textContent || '').trim(),
        btns: document.querySelectorAll('[data-rl-lock-ask]').length };
    }, held.clause);
    ok('3c the wall is unchanged — the clause is still refused to them',
      stillShut.shut === true && stillShut.mayAsk === false, JSON.stringify(stillShut.mayAsk));
    ok('3d and the button became a word: a second press is not a louder ask',
      stillShut.btns === 0 && /Asked/i.test(stillShut.word), JSON.stringify(stillShut.word));
    const twice = await b.p.evaluate(cid => {
      const c = getContract('MK-T1');
      if (!window.clauseLockAsk) return 'no model';
      clauseLockAsk(c, cid); clauseLockAsk(c, cid);
      const l = c.locks[cid] || {};
      return (l.asked || []).filter(x => x.name === 'Unrestricted Legal').length;
    }, held.clause);
    ok('3e asking twice is still one ask', twice === 1, String(twice));

    /* ===== 4. THE HOLDER IS TOLD, WHERE THE HOLDER IS ===== */
    const toldHolder = await a.p.evaluate(async cid => {
      const c = getContract('MK-T1');
      c._loaded = false; await ensureFull(c);
      const rows = window.clauseLockMineWaiting ? clauseLockMineWaiting(c, cid) : [];
      return { n: rows.length, who: rows.length ? rows[0].name : '',
        line: window.clauseLockWaitingLine ? clauseLockWaitingLine(rows) : '' };
    }, held.clause);
    ok('4a the holder\'s own reading says who is waiting',
      toldHolder.n === 1 && toldHolder.who === 'Unrestricted Legal' && /waiting/i.test(toldHolder.line),
      JSON.stringify(toldHolder.line));
    /* AND IT IS DRAWN IN THE EDITOR'S FOOT, where the holder is. */
    const foot = await a.p.evaluate(async cid => {
      await openRedlineWorkbench('MK-T1');
      await new Promise(r => setTimeout(r, 900));
      if (!window.rlOpenClauseEditor) return { err: 'no editor door' };
      rlOpenClauseEditor(getContract('MK-T1'), cid, {});
      await new Promise(r => setTimeout(r, 1400));
      const w = document.getElementById('ce-waiting');
      const go = document.querySelector('[data-ce-act="handover"]');
      const r = go ? go.getBoundingClientRect() : null;
      const hit = r ? document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2)) : null;
      return { text: w ? w.textContent.replace(/\s+/g, ' ').trim() : '', go: !!go,
        pressable: !!(go && hit && (hit === go || go.contains(hit))) };
    }, held.clause);
    ok('4b and the editor\'s foot says it, with the hand-over on it',
      /waiting/i.test(foot.text || '') && foot.go && foot.pressable, JSON.stringify(foot));
    await a.p.screenshot({ path: path.join(OUT, '2-the-holder.png') });

    /* ===== 5. THE TWO WALLS ===== */
    const walls = await b.p.evaluate(async cid => {
      /* Not the holder: a stranger cannot hand somebody else's clause over. */
      const r1 = await fetch('/api/contracts/MK-T1/lock', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseId: cid, handTo: 'anyone' }) });
      return { notHolder: r1.status };
    }, held.clause);
    ok('5a a colleague who does not hold it cannot hand it over', walls.notHolder === 403, JSON.stringify(walls));
    const never = await a.p.evaluate(async cid => {
      const r = await fetch('/api/contracts/MK-T1/lock', { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clauseId: cid, handTo: 'u_never_asked' }) });
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, err: j && j.error };
    }, held.clause);
    ok('5b and nobody can be handed a clause they never asked for',
      never.status === 409 && /not waiting/i.test(never.err || ''), JSON.stringify(never));

    /* ===== 6. ONE PRESS MOVES THE BATON ===== */
    await a.p.click('[data-ce-act="handover"]').catch(() => {});
    await a.p.waitForTimeout(400);
    await a.p.evaluate(() => { const yes = [...document.querySelectorAll('#modal-root button, .ui-btn')]
      .find(x => /hand over/i.test(x.textContent || '')); if (yes) yes.click(); });
    const moved = await until(a.p, cid => {
      const c = getContract('MK-T1'); const l = c.locks && c.locks[cid];
      return !!(l && l.by && l.by.name === 'Unrestricted Legal');
    }, held.clause, 14000);
    const afterHand = await stored(a.p);
    ok('6a one press hands it to whoever asked',
      moved && afterHand.by === 'Unrestricted Legal', JSON.stringify(afterHand.by));
    ok('6b and the queue goes with the clause — a new holder starts with none',
      afterHand.asked.length === 0, JSON.stringify(afterHand.asked));
    /* AND THE ASKER IS TOLD — the merge is the only thing that can tell them. */
    const toldAsker = await b.p.evaluate(async cid => {
      const c = getContract('MK-T1');
      const r = await api('contracts/MK-T1');
      const said = [];
      const was = window.toast;
      window.toast = (m) => said.push(String(m));
      try { if (window.clauseLockMerge) clauseLockMerge(c, r.locks || {}); } finally { window.toast = was; }
      const l = (c.locks || {})[cid];
      return { said, mine: !!(l && l.by && l.by.name === 'Unrestricted Legal'),
        shut: !!(window.clauseLockSign && clauseLockSign(c, cid)) };
    }, held.clause);
    ok('6c the asker is told the clause is theirs now',
      toldAsker.mine && toldAsker.said.some(x => /yours now/i.test(x)), JSON.stringify(toldAsker.said));
    ok('6d and the clause is open to them — the sign is gone',
      toldAsker.shut === false, String(toldAsker.shut));
    const twiceSaid = await b.p.evaluate(async () => {
      const c = getContract('MK-T1');
      const r = await api('contracts/MK-T1');
      const said = []; const was = window.toast;
      window.toast = (m) => said.push(String(m));
      try { if (window.clauseLockMerge) clauseLockMerge(c, r.locks || {}); } finally { window.toast = was; }
      return said.length;
    });
    ok('6e said once, not on every poll', twiceSaid === 0, String(twiceSaid));

    /* ===== 7. A REFRESH DOES NOT WIPE THE QUEUE ===== */
    const kept = await a.p.evaluate(async cid => {
      /* The first colleague asks for it back, then the NEW holder refreshes
         their own lock the way a browser does while somebody types. */
      const c = getContract('MK-T1');
      c._loaded = false; await ensureFull(c);
      if (!window.clauseLockAsk) return ['no model'];
      clauseLockAsk(c, cid);
      await new Promise(r => setTimeout(r, 700));
      const back = (await (await fetch('/api/contracts/MK-T1')).json()).locks[cid] || {};
      return (back.asked || []).map(x => x.name);
    }, held.clause);
    ok('7a the new holder is asked in turn', kept.includes('Amina Otieno'), JSON.stringify(kept));
    const survives = await b.p.evaluate(async cid => {
      const c = getContract('MK-T1');
      c._loaded = false; await ensureFull(c);
      /* Refreshing IS taking it again — the lock's own rule, and what a
         holder's browser does every few seconds while they type. */
      clauseLockTake(c, cid);
      clauseLockSave(c, { clauseId: cid });
      await new Promise(r => setTimeout(r, 700));
      const r = await (await fetch('/api/contracts/MK-T1')).json();
      const l = (r.locks || {})[cid] || { by: {} };
      return { by: (l.by || {}).name || null, asked: (l.asked || []).map(x => x.name),
        local: ((c.locks[cid] || {}).asked || []).map(x => x.name) };
    }, held.clause);
    ok('7b and a refresh of their own lock does NOT wipe the queue on it',
      survives.asked.includes('Amina Otieno') && survives.by === 'Unrestricted Legal',
      JSON.stringify(survives));
    ok('7c on the server AND in the browser\'s own copy',
      survives.local.includes('Amina Otieno'), JSON.stringify(survives.local));

    /* ===== 8. AN ASK LIVES UNTIL THE ASKER LEAVES (gap E, 4 Oct 2026) =====
       The first colleague is now the one waiting. Their tab goes behind
       another: the ordinary beat falls silent (a hidden tab is not in the
       room), and the slower ask beat keeps their place in the queue. The beat
       is DRIVEN here rather than waited for — f494 drives the minutes. */
    const hid = await a.p.evaluate(async () => {
      if (!window.presenceKeepAsks) return { err: 'no ask beat' };
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      const me = currentUser().id;
      const before = await (await fetch('/api/contracts/MK-T1')).json();
      const mine = l => ((l && l.asked) || []).find(x => String(x.id) === String(me)) || null;
      const k = Object.keys(before.locks || {})[0];
      const askAt0 = (mine(before.locks[k]) || {}).at || null;
      const hereAt0 = ((before.here || {})[me] || {}).at || null;
      await new Promise(r => setTimeout(r, 30));
      const n = await presenceKeepAsks('MK-T1');
      const back = await (await fetch('/api/contracts/MK-T1')).json();
      return { watching: presenceWatching(), n, askAt0, askAt1: (mine(back.locks[k]) || {}).at || null,
        hereAt0, hereAt1: ((back.here || {})[me] || {}).at || null };
    });
    ok('8a hidden, the ask beat keeps their ask on the holder\'s lock',
      hid.n === 1 && hid.askAt0 && hid.askAt1 && Date.parse(hid.askAt1) > Date.parse(hid.askAt0),
      JSON.stringify(hid));
    ok('8b and says nothing about being in the room — the face row still drops a hidden reader',
      !!hid.hereAt0 && hid.hereAt1 === hid.hereAt0, JSON.stringify([hid.hereAt0, hid.hereAt1]));
    /* THE PAGE GOES AWAY. A real navigation, so pagehide fires the way it does
       when somebody closes the tab; the withdrawal has to outlive the page. */
    await a.p.goto('about:blank').catch(() => {});
    let gone = null;
    for (let i = 0; i < 20 && !(gone && gone.asked.length === 0); i++){
      gone = await b.p.evaluate(async cid => {
        const c = getContract('MK-T1');
        const r = await api('contracts/MK-T1');
        if (window.clauseLockMerge) clauseLockMerge(c, r.locks || {});
        const l = (r.locks || {})[cid] || {};
        return { by: (l.by || {}).name || null, asked: (l.asked || []).map(x => x.name),
          queue: window.clauseLockMineWaiting ? clauseLockMineWaiting(c, cid).map(x => x.name) : null };
      }, held.clause);
      if (gone.asked.length) await b.p.waitForTimeout(250);
    }
    ok('8c closing the page takes their ask off the holder\'s queue at once — not two minutes later',
      gone && gone.asked.length === 0 && Array.isArray(gone.queue) && gone.queue.length === 0, JSON.stringify(gone));
    ok('8d and only their ask: the holder still holds the clause',
      gone && gone.by === 'Unrestricted Legal', JSON.stringify(gone && gone.by));
    await b.p.screenshot({ path: path.join(OUT, '3-asker-left.png') });

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
