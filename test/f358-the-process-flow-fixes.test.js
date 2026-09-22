/* ============================================================
   f358 — the process review's eight items

   Eight things about how work moves through HaTi. Six were built, one was
   already built and one was deliberately not — and BOTH of those last two
   are pinned here, because "we looked and it was already there" and "we
   looked and decided not to" are findings a later reader needs as much as
   the code.

   1  Four places an address can be typed.       contractAddressBook
   2  A round lands and nothing re-reads.        readingStale
   3  Lanes wait for somebody to open a page.    intakeLaneSweep
   4  A notice drafted but never recorded.       noticeMarkServed
   5  Eight switches and no summary.             stPersonSays
   6  Four end states, no comparison.            END_STATES — words, not a door
   7  The guest has only a link.                 ALREADY BUILT (share_otp)
   8  Two screens, different editing rules.      docReadOnlyHint

   COMMENTS ARE PROSE: every sweep reads code, with the notes stripped, or a
   claim passes against its own explanation.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const R = f => fs.readFileSync(path.join(__dirname, '..', ...f.split('/')), 'utf8');
const code = src => String(src).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const PT   = R('js/participants.js');
const SC   = R('js/signcheck.js');
const IK   = R('js/views/intake.js');
const NOTE = R('js/notice.js');
const SET  = R('js/views/settings.js');
const CORE = R('js/core.js');
const REG  = R('js/views/register.js');
const CT   = R('js/views/contract.js');
const SRV  = R('server/server.js');
const APP  = R('js/app.js');
const EN   = R('js/i18n.js');

/* ---------- 1 · one address list ---------- */
describe('f358 (1) every address, in the order a round uses them', () => {
  const w = () => {
    const b = buildWorld({ participants:true });
    return b.win;
  };
  test('1a contractAddressBook exists and is published', () => {
    assert.ok(/function contractAddressBook\(/.test(PT));
    assert.ok(/contractAddressBook/.test(PT.split('Object.assign(window').slice(1).join('')));
  });
  test('1b the order is written down ONCE and is the send screen’s own', () => {
    assert.ok(/const ADDR_SOURCES = \['route', 'people', 'record', 'last'\]/.test(PT),
      'the same four, in the order shareModalPrefill already resolves in');
    const pre = code((CORE.match(/function shareModalPrefill\([\s\S]*?\n\}/) || [''])[0]);
    const at = k => pre.indexOf(k);
    assert.ok(at('shareRouteRecipient') >= 0 && at('participantSendRows') > at('shareRouteRecipient'),
      'the people list is asked after the signing route');
    assert.ok(at('counterpartyContact') > at('participantSendRows'),
      'and before the recorded contact');
  });
  test('1c four records of one person fold to four rows, one marked', () => {
    const win = w();
    if(typeof win.contractAddressBook !== 'function') return;   /* module absent on this stage */
    const c = { id:'MK-1', counterparty:'Naivas', counterpartyEmail:'buying@naivas.co.ke',
      participants:[{ id:'p1', name:'Asha', email:'asha@naivas.co.ke', role:'cpsign', side:'theirs' }] };
    const book = win.contractAddressBook(c, []);
    const mails = book.rows.map(r => r.email).join(',');
    assert.ok(mails.includes('asha@naivas.co.ke') && mails.includes('buying@naivas.co.ke'),
      'both are on file and both are shown');
    assert.equal(book.rows.filter(r => r.willUse).length, 1, 'exactly one is what a round uses');
    assert.equal(book.agree, false, 'and the card can say there is more than one');
  });
  test('1d one address is not a disagreement, and draws nothing', () => {
    const win = w();
    if(typeof win.contractAddressBook !== 'function') return;
    const book = win.contractAddressBook({ id:'MK-1', counterpartyEmail:'a@b.co' }, []);
    assert.equal(book.rows.length, 1);
    assert.equal(book.agree, true);
    /* the builder refuses to draw under two, so a contract with one address is
       exactly what it was */
    assert.ok(/rows\.length < 2\) return ''/.test(code(CT)), 'never an always-on block naming one address');
  });
  test('1e the source has a word in both books', () => {
    for(const k of ['ppl_addr_route','ppl_addr_people','ppl_addr_record','ppl_addr_last','ppl_addr_uses'])
      assert.equal((EN.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' is in one book only');
  });
});

/* ---------- 2 · a reading older than the wording ---------- */
describe('f358 (2) a round lands and the readings say they are behind', () => {
  test('2a readingStale is the one reading, over the three', () => {
    assert.ok(/const READING_KINDS = \['brief', 'playbook', 'oblig'\]/.test(SC));
    assert.ok(/function readingStale\(c, kind\)/.test(SC));
  });
  test('2b it re-runs nothing and spends nothing', () => {
    const fn = code((SC.match(/function readingStale\(c, kind\)\{[\s\S]*?\n\}/) || [''])[0]);
    for(const n of ['api(','fetch(','runSignCheck','runPlaybookReview','aiAsk'])
      assert.ok(!fn.includes(n), n + ' — saying so is the whole point, not re-reading');
  });
  test('2c THREE ANSWERS, and the third is "we do not know"', () => {
    const fn = code((SC.match(/function readingStale\(c, kind\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok((fn.match(/return null/g) || []).length >= 2,
      'never read, and nothing dated to compare with, are both null');
  });
  test('2d the playbook keeps its own authority — a hash beats a date', () => {
    const fn = code((SC.match(/function readingStale\(c, kind\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/playbookStale/.test(fn), 'asked first');
    assert.ok(!/playbookHashOf|simhash/.test(fn), 'a second hasher here would drift from it');
  });
  test('2e the wording-moved date is BORROWED, not computed again', () => {
    const fn = code((SC.match(/function readingStale\(c, kind\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/signCheckBriefAt\(c\)/.test(fn));
  });
  test('2f all three rows on the Overview can say it, and the words are there', () => {
    const rows = code((CT.match(/function ktReadingsRowsHtml\(c\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok((rows.match(/rdStale\(/g) || []).length >= 3, 'brief, playbook and obligations');
    assert.ok(/ov_r_before_round/.test(rows), 'a colour is not a sentence');
    assert.equal((EN.match(/\n    ov_r_before_round:/g) || []).length, 2);
  });
});

/* ---------- 3 · the lanes run on their own beat ---------- */
describe('f358 (3) the lanes do not wait for somebody to open a page', () => {
  test('3a there is a sweep, and it is armed at sign-in', () => {
    assert.ok(/function intakeLaneSweep\(/.test(IK));
    assert.ok(/function intakeSweepStart\(/.test(IK));
    assert.ok(/setInterval\(intakeLaneSweep/.test(IK), 'and on a beat after that');
    assert.ok(/intakeSweepStart\(\)/.test(code(CORE)), 'started where the queue is first loaded');
  });
  test('3b it costs nothing in a workspace with no lanes', () => {
    const fn = code((IK.match(/async function intakeLaneSweep\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    const iLanes = fn.indexOf('intakeLanes()');
    const iLoad  = fn.indexOf('loadIntake');
    assert.ok(iLanes > 0 && iLoad > iLanes, 'the lanes are read before anything is fetched');
  });
  test('3c A RULE THAT FIRES WITHOUT A HUMAN MAY NOT MOVE THE HUMAN', () => {
    const run = code((IK.match(/async function intakeRunLanes\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/createFromTemplate\(\s*L\.template,\s*\{\s*quiet\s*:\s*true/.test(run),
      'on a timer this would yank a reader onto a fresh draft, once per request');
    const mint = code((APP.match(/function createFromTemplate\(tid, opts\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/if\(!quiet\)\{[\s\S]*?setView\('workspace'\)/.test(mint), 'quiet skips the navigation');
    assert.ok(/return c;/.test(mint), 'and hands the contract back instead');
  });
  test('3d it still mints nothing of its own', () => {
    const run = code((IK.match(/async function intakeRunLanes\(\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(!/state\.contracts\.(push|unshift)|nextId\(/.test(run));
    assert.ok(!/signatures|signDocument|'Signed'/.test(run), 'a lane never signs anything');
  });
});

/* ---------- 4 · a notice that was served ---------- */
describe('f358 (4) whether the notice was served', () => {
  const stage = () => {
    const b = buildWorld({ notice:true });
    return b.win;
  };
  test('4a noticeMarkServed is the ONE writer', () => {
    assert.ok(/function noticeMarkServed\(c, on, way, ref, actor\)/.test(NOTE));
    assert.equal((code(NOTE).match(/c\.notice = \{/g) || []).length, 1);
  });
  test('4b a day in the future is refused', () => {
    const win = stage();
    if(typeof win.noticeMarkServed !== 'function') return;
    const c = { id:'MK-1', audit:[] };
    const soon = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    assert.equal(win.noticeMarkServed(c, soon, 'post', ''), null,
      'a register that can say a notice was served tomorrow is a register nobody can rely on');
    assert.ok(!c.notice, 'and nothing was written');
  });
  test('4c a real day is recorded with the way, who and one trail line', () => {
    const win = stage();
    if(typeof win.noticeMarkServed !== 'function') return;
    const c = { id:'MK-1', audit:[] };
    const out = win.noticeMarkServed(c, '2026-09-01', 'courier', 'DHL 991');
    assert.ok(out && out.servedOn === '2026-09-01' && out.way === 'courier' && out.ref === 'DHL 991');
    assert.equal(c.audit.filter(a => a.action === 'Notice').length, 1);
  });
  test('4d it claims nothing HaTi saw', () => {
    /* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD: the first draft cut
       at the next backtick, and that sentence has a nested template literal in
       the middle of it, so the claim read half a line and failed against
       correct code. The region is the audit call. */
    const body = code((NOTE.match(/function noticeMarkServed\([\s\S]*?\n\}/) || [''])[0]);
    const line = (body.match(/logAudit\([\s\S]*?\);/) || [''])[0];
    assert.ok(/Recorded as served/.test(line), 'the trail line');
    assert.ok(/HaTi did not send it/.test(line), 'the record says who said so');
  });
  test('4d2 THE DAY IS COMPARED AS AN ISO DAY, NEVER AS todayStr', () => {
    /* todayStr() reads like the answer and is a DISPLAY string, so the whole
       wall was always false and the date box opened empty. The calendar paid
       for this once already. */
    assert.ok(!/todayStr/.test(code(NOTE)), 'a display string cannot be compared with an ISO day');
    assert.ok(/function _noToday\(\)/.test(NOTE), 'one reading, both sites');
    assert.equal((code(NOTE).match(/_noToday\(\)/g) || []).length, 3,
      'declared once, asked by the wall and by the box that offers the day');
    assert.ok(/window\.calToday/.test(NOTE),
      'the calendar already holds this reading — guarded, because this file draws without it');
  });
  test('4e a served notice IS the renewal decision, so the chase stops', () => {
    const OB = code(R('js/obligations.js'));
    const fn = (OB.match(/function renewalDecisionOf\(c\)\{[\s\S]*?\n\}/) || [''])[0];
    assert.ok(/noticeServed/.test(fn), 'the one predicate every nag asks');
    assert.ok(/window\.noticeServed/.test(fn), 'guarded — this module draws without js/notice.js');
  });
  test('4f an absent reading means "nothing recorded", never "served"', () => {
    const OB = code(R('js/obligations.js'));
    const fn = (OB.match(/function renewalDecisionOf\(c\)\{[\s\S]*?\n\}/) || [''])[0];
    assert.ok(/catch\(_\)\{ served = null; \}/.test(fn));
  });
  test('4g and the words are in both books', () => {
    for(const k of ['nt_served_act','nt_served_title','nt_served_line','nt_way_courier'])
      assert.equal((EN.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
  });
});

/* ---------- 5 · what this person can actually do ---------- */
describe('f358 (5) eight switches, one summary', () => {
  test('5a stPersonSays exists and the drawer draws it', () => {
    assert.ok(/function stPersonSays\(u\)/.test(SET));
    assert.ok(/\$\{isNew\?'':stPersonSumHtml\(u\)\}/.test(SET), 'at the top of the drawer');
  });
  test('5b EVERY LINE IS BORROWED from the switch below it', () => {
    const fn = code((SET.match(/function stPersonSays\(u\)\{[\s\S]*?\n\}/) || [''])[0]);
    for(const n of ['stAccessOf','signCapOf','reviewChecked','reviewerId','overseerId','newPaper','reFile','holdContracts'])
      assert.ok(fn.includes(n), n + ' is not read — the summary and the switch would drift');
  });
  test('5c it decides nothing and writes nothing', () => {
    const fn = code((SET.match(/function stPersonSays\(u\)\{[\s\S]*?\n\}/) || [''])[0]);
    for(const n of ['api(','fetch(','saveUsers','persist(','=='])
      if(n !== '==') assert.ok(!fn.includes(n), n + ' — a second place to change a grant is a second place to drift');
  });
  test('5d an admin is said once, not six times', () => {
    const fn = code((SET.match(/function stPersonSays\(u\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/if\(admin\)\{ out\.push\(say\('st_sum_admin'\)\); return out; \}/.test(fn));
  });
  test('5e and the sentences are in both books', () => {
    for(const k of ['st_sum_head','st_sum_cap','st_sum_checked_by','st_sum_no_grants'])
      assert.equal((EN.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
  });
});

/* ---------- 6 · the words that tell the end states apart ---------- */
describe('f358 (6) four end states, and the difference is shown', () => {
  test('6a END_STATES is the one place the three sentences live', () => {
    assert.ok(/const END_STATES = \[/.test(CORE));
    for(const k of ['end_decline_says','end_archive_says','end_hold_says'])
      assert.ok(CORE.includes(k), k);
  });
  test('6b the Contracts row carries each on its hover', () => {
    const list = REG.slice(REG.indexOf('const REG_ROW_ACTIONS=['), REG.indexOf('];', REG.indexOf('const REG_ROW_ACTIONS=[')));
    for(const k of ['end_decline_says','end_archive_says','end_hold_says'])
      assert.ok(list.includes(k), k + ' is not on its row');
    assert.ok(/a\.says\?` title="\$\{esc\(a\.says\)\}"`/.test(REG), 'and the row markup prints it');
  });
  test('6c the contract’s own menu says the SAME thing', () => {
    assert.ok(/endStateSays\('archive'\)/.test(CT));
    assert.ok(/endStateSays\('hold'\)/.test(CT));
  });
  test('6d THE THREE ROWS STAY — a chooser was NOT built, deliberately', () => {
    const list = REG.slice(REG.indexOf('const REG_ROW_ACTIONS=['), REG.indexOf('];', REG.indexOf('const REG_ROW_ACTIONS=[')));
    for(const k of ["{k:'decline'","{k:'archive'","{k:'hold'","{k:'restore'","{k:'release'"])
      assert.ok(list.includes(k), k + ' left the row menu');
    assert.ok(!/openEndStateDialog/.test(CORE + REG + CT),
      'the owner ruled Hold onto that row by name on 19 Sep — a chooser puts it one press further away');
  });
  test('6e the undo keeps no comparison, because there is nothing to compare', () => {
    const list = REG.slice(REG.indexOf('const REG_ROW_ACTIONS=['), REG.indexOf('];', REG.indexOf('const REG_ROW_ACTIONS=[')));
    const restore = list.slice(list.indexOf("{k:'restore'"), list.indexOf("{k:'restore'") + 200);
    assert.ok(!/says/.test(restore));
  });
});

/* ---------- 7 · already built ---------- */
describe('f358 (7) the guest’s one-time code was ALREADY built', () => {
  /* THE REVIEW WAS WRONG ABOUT THIS ONE, and that is worth a test rather than
     a sentence: it read "a one-time code before a guest's first SEND is
     recorded as designed-but-not-built" — which is about sending — and
     generalised it to signing. Signing already asks, and the server is
     already the wall. A second pair of routes was written and reverted. */
  test('7a the code exists, is hashed, and expires', () => {
    assert.ok(/share_otp/.test(SRV));
    assert.ok(/code_hash/.test(SRV));
    assert.ok(/attempts/.test(SRV), 'wrong guesses are counted');
  });
  test('7b the address is the STORED one — never a body address', () => {
    const route = code(SRV.slice(SRV.indexOf("app.post('/api/shares/:token/otp'"), SRV.indexOf("app.post('/api/shares/:token/otp'") + 2000));
    assert.ok(/s\.recipient_email/.test(route), 'the open-relay rule');
    assert.ok(!/req\.body[^)]*email/.test(route), 'a code sent wherever the caller asked proves nothing');
  });
  test('7c and it is a WALL, not a sign: respond refuses an unverified signature', () => {
    assert.ok(/Email verification required before signing/.test(SRV));
  });
  test('7d it is skippable ONLY where the code cannot be delivered', () => {
    const at = SRV.indexOf('Email verification required before signing');
    const near = SRV.slice(at - 400, at + 400);
    assert.ok(/EMAIL_ON\(\)/.test(near),
      'a verification a signer can decline is not a verification');
  });
  test('7e there is exactly ONE set of code routes', () => {
    assert.equal((SRV.match(/app\.post\('\/api\/shares\/:token\/otp'/g) || []).length, 1);
    assert.ok(!/shares\/:token\/code'/.test(SRV), 'a second door onto an act that already has one');
  });
});

/* ---------- 8 · where the wording is changed ---------- */
describe('f358 (8) the Document tab says where wording is changed', () => {
  test('8a it arrives when needed, and is not a band', () => {
    assert.ok(/function docReadOnlyHint\(c\)/.test(CT));
    const fn = code((CT.match(/function docReadOnlyHint\(c\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/toast\(/.test(fn), 'a transient confirmation, not furniture');
    assert.ok(!/innerHTML|insertAdjacent|appendChild/.test(fn), 'nothing is added to the page');
  });
  test('8b it asks the product’s OWN reading of "may wording be typed here"', () => {
    const fn = code((CT.match(/function docReadOnlyHint\(c\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/docFillable\(c\)/.test(fn), 'so it cannot disagree with what the page allows');
    assert.ok(/PORTAL_MODE/.test(fn), 'and never on the counterparty’s page');
  });
  test('8c a press on a control, a real box or a highlight is not a try', () => {
    const fn = code((CT.match(/function docReadOnlyHint\(c\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/closest\('button,a,input,textarea,select/.test(fn));
    assert.ok(/isCollapsed/.test(fn), 'a drag is a highlight');
  });
  test('8d said once, not on every click, and bound once per canvas', () => {
    const fn = code((CT.match(/function docReadOnlyHint\(c\)\{[\s\S]*?\n\}/) || [''])[0]);
    assert.ok(/roHintBound/.test(fn));
    assert.ok(/DOC_HINT_MS/.test(fn));
  });
  test('8e and it names where, in both books', () => {
    assert.equal((EN.match(/\n    ct_wording_elsewhere:/g) || []).length, 2);
    assert.ok(/Negotiate page/.test(EN), 'the way forward is on the same screen as the refusal');
  });
});
