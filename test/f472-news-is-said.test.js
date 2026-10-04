/* ============================================================
   f472 — news is said where the reader looks
   ============================================================
   THE FINDING (process review, 4 Oct 2026). A bare toast(msg) prints NOTHING
   (core.js's own rule: silence is what you get by saying nothing). Several of
   the hand-offs that change whose move it is were bare: their answer
   arriving, the page catching up ("Updated just now"), accepting or rejecting
   their ask, a review handed back, an ask for review sent. And the bell had
   no row for three colleagues waiting on the reader by name: a review that
   came back to the person who asked, a contributor's suggestion waiting on the
   lead, and a suggestion handed back to its author.

   THE RULE. Every hand-off names a kind — 'ok', or 'warn' where something is
   left to do — and the three waits are registered bell kinds, ranked with the
   other colleagues waiting by name, each clearing only when the work is done.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');

const CORE = bare(read('js/core.js'));
const VIEW = bare(read('js/views/negotiation.js'));
const REV = bare(read('js/review.js'));
const APP = read('js/app.js');
const I18N = read('js/i18n.js');

describe('f472 (1) — every hand-off is said', () => {
  test('their answer arriving names a kind, every action of it', () => {
    for (const k of ['co_arr_signed', 'co_arr_accepted', 'co_arr_ready', 'co_arr_changes'])
      assert.match(CORE, new RegExp(`toast\\(i18t\\('${k}',\\{ who:r\\.name \\}\\),'ok'\\)`), k);
    assert.match(CORE, /i18t\('co_arr_answered',\{ who:r\.name \}\),'ok'\)/, 'the decisions arrival');
    assert.ok(!/toast\(said\?/.test(CORE), 'the old bare sentence is gone');
  });

  test('the page catching up, and a decision, are said', () => {
    assert.match(VIEW, /toast\(i18t\('ng_live_updated', \{[\s\S]{0,120}?\}\), 'ok'\)/, '"Updated just now"');
    for (const k of ['ng_decided_accepted', 'ng_decided_rejected', 'ng_decided_reopened'])
      assert.match(VIEW, new RegExp(`toast\\(i18t\\('${k}', \\{ what \\}\\), 'ok'\\)`), k);
  });

  test('a review handed back, cancelled, or asked for is said', () => {
    assert.match(REV, /_rvSay\(i18t\('rv_returned_toast', \{ who: done\.by \}\), 'ok'\)/);
    assert.equal((REV.match(/_rvSay\(i18t\('rv_cancelled_toast'\), 'ok'\)/g) || []).length, 2);
    const ask = REV.slice(REV.indexOf("i18t('rv_sent_mailed'"), REV.indexOf("i18t('rv_sent_mailed'") + 400);
    assert.match(ask, /'ok' : 'warn'/, 'sent, or a mail that did not go, never silence');
  });

  test('both books carry every new sentence', () => {
    const sv = I18N.indexOf('\n  sv: {');
    const keys = ['co_arr_signed', 'co_arr_accepted', 'co_arr_answered', 'co_arr_answered_said', 'co_arr_decided',
      'co_arr_filed_one', 'co_arr_filed_other', 'co_arr_withdrew_one', 'co_arr_withdrew_other', 'co_arr_ready',
      'co_arr_changes', 'ng_a_clause', 'ng_decided_accepted', 'ng_decided_rejected', 'ng_decided_reopened',
      'ng_live_updated', 'ng_sent_their_turn', 'ng_link_their_turn', 'al_review_back', 'al_suggest_one',
      'al_suggest_other', 'al_suggest_back_one', 'al_suggest_back_other'];
    for (const k of keys){
      const en = I18N.indexOf(`    ${k}:`);
      assert.ok(en > 0 && en < sv, `${k} (English)`);
      assert.ok(I18N.indexOf(`    ${k}:`, sv) > sv, `${k} (Swedish)`);
    }
  });
});

describe('f472 (2) — the bell names three more colleagues waiting', () => {
  const kinds = (() => {
    const at = APP.indexOf('const ALERT_KINDS = [');
    return [...bare(APP.slice(at, APP.indexOf('\n];', at))).matchAll(/k:'([a-z-]+)'/g)].map(m => m[1]);
  })();
  test('registered, ranked with the other colleagues, and the pinned pairs hold', () => {
    for (const k of ['suggest', 'review-back', 'suggest-back']) assert.ok(kinds.includes(k), k);
    assert.equal(kinds.indexOf('desk-join'), kinds.indexOf('review-mine') + 1, 'f381\'s pair');
    assert.equal(kinds.indexOf('desk-quiet'), kinds.indexOf('negotiation') + 1, 'and its other pair');
    assert.ok(kinds.indexOf('suggest') > kinds.indexOf('note-mine') && kinds.indexOf('suggest-back') < kinds.indexOf('approval'),
      'after the note, before the approvals');
  });
  test('buildAlerts pushes them off the one readings', () => {
    const b = bare(APP.slice(APP.indexOf('function buildAlerts'), APP.indexOf('function alertCount')));
    assert.match(b, /reviewReturnedTo\(c\)[\s\S]*?push\('review-back'/);
    assert.match(b, /deskSuggestionsFor\(c\)[\s\S]*?push\('suggest'/);
    assert.match(b, /deskSuggestionsBackTo\(c\)[\s\S]*?push\('suggest-back'/);
    assert.match(b, /if\(!c \|\| !c\.desk\) return;/, 'counting starts no negotiation and reads no desk that is not there');
  });
});

const BODY = '<h1>Cane</h1><h2>Clause 4 · Payment Terms</h2><p>Payable within thirty (30) days.</p>';
const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'a@w.co.ke' };
const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'w@w.co.ke' };

describe('f472 (3) — a returned review waits on the person who asked, until they act', () => {
  test('reviewReturnedTo: the asker sees it, the reviewer does not, a send clears it', async () => {
    const w = buildWorld({ user: ME });
    const win = w.win;
    win.state = { settings: {}, contracts: [] };
    win.getUsers = () => [ME, BOSS];
    let t = Date.parse('2026-10-01T08:00:00.000Z');
    win.nowISO = () => new Date(t += 60000).toISOString();
    const c = { id: 'MK-N1', name: 'Cane', counterparty: 'Nordfrakt', status: 'Under Review', folder: 'dist',
      audit: [], versions: [], rounds: [], signatures: [], comments: [], redlineText: BODY, format: 'rich' };
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const a = await win.negoEditClause(c, cl.clauseId, '<p>Payable within forty-five (45) days.</p>',
      { side: 'owner', author: ME.name, summary: 'ask' });
    win.reviewAsk(c, { reviewer: BOSS });
    win.currentUser = () => BOSS;
    win.reviewMark(c, a.id, 'cleared');
    assert.ok(win.reviewReturn(c, {}), 'handed back');
    assert.equal(win.reviewReturnedTo(c).length, 0, 'the reviewer is not told about their own hand-back');
    win.currentUser = () => ME;
    assert.equal(win.reviewReturnedTo(c).length, 1, 'the person who asked is');
    win.negoHandOver(c, { to: 'counterparty', by: ME.name });
    assert.equal(win.reviewReturnedTo(c).length, 0, 'sending is the work it waited for');
  });
});
