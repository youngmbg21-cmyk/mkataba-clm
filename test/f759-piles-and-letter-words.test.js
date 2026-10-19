'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f759 — THE WORDS OF ROUNDS 9 AND 11 AS DRAWN, IN BOTH BOOKS (the gaps: the
   owner's "build all the gaps", 18 Oct 2026)
   (1) Every new word is in English AND Swedish, the Swedish its own (not the
       English copied), and sits BESIDE its area's keys — never appended at the
       end of a book.
   (2) The words say what the drawings say: "Waiting on you", "Lina suggests",
       "Your drafts, not yet sent", "Settled in round 1", "Here now", "Round 2 ·
       their asks came 4 days ago", "Discard last"; "Before you send", "Send
       round 2", "to Nordvik Logistik AB · MK-0382", "Your note · type here",
       "Send to Anna", "Remind Sara", "Go to clause 7", "What Anna never sees"
       and whose names stay inside.
   (3) A label that is also a record keeps English: none of these is written
       to a contract, a share or the trail (they are read by the screen only).
   AT THE BASE (8dc306a) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const I18N = R('js/i18n.js');
const { STRINGS } = require('../js/i18n.js');

const NEW = ['ng_row_you', 'ng_row_notes_w_one', 'ng_row_notes_w_other', 'ng_row_lock_editing', 'ng_band_suggest', 'ng_band_suggest_by',
  'ng_band_suggest_many', 'ng_band_suggest_mine', 'ng_band_settled_in', 'ng_band_settled_upto', 'ng_round_asks_came', 'ng_here_now', 'ng_discard_last',
  'pd_face_w_fill', 'pd_face_w_red', 'pd_face_w_signing', 'pd_face_w_amend', 'pd_face_w_send', 'dk_send_tab',
  'sh_lt_stays_held_by', 'sh_lt_stays_wait_by', 'sh_lt_stays_counter', 'sh_lt_stays_change', 'sh_lt_stays_counter_x', 'sh_lt_stays_change_x',
  'sh_lt_clause_n', 'sh_lt_remind', 'sh_lt_goto', 'sh_lt_goto_it', 'sh_lt_change', 'sh_lt_note_lbl', 'sh_lt_send_to',
  'sh_as_p_negotiate', 'sh_as_p_sign', 'sh_as_p_view', 'sh_as_p_advise', 'sh_as_p_status', 'sh_as_c_email', 'sh_as_c_whatsapp', 'sh_as_c_link', 'sh_as_c_word',
  'sh_as_l_whole', 'sh_as_l_days', 'sh_as_w_contract', 'sh_as_w_round', 'sh_as_w_history', 'sh_as_w_status',
  'sh_hd_round', 'sh_hd_contract', 'sh_hd_history', 'sh_hd_status', 'sh_hd_to'];
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));

describe('f759 (1) both books, beside their area', () => {
  test('1a every new word in English and in Swedish, the Swedish its own', () => {
    for (const k of NEW){
      assert.ok(STRINGS.en[k], k + ' en');
      assert.ok(STRINGS.sv[k], k + ' sv');
    }
    const same = NEW.filter(k => STRINGS.en[k] === STRINGS.sv[k] && !/^\{|^[A-Z]{2,}/.test(STRINGS.en[k]));
    assert.deepEqual(same, [], 'a Swedish word is a translation, not the English again');
  });
  test('1b each sits beside a key of its own area, in both books — never appended at the end', () => {
    const lines = I18N.split('\n');
    const keyAt = [];
    lines.forEach((l, i) => { const m = /^\s+([a-z][a-z0-9_]*):/.exec(l); if (m) keyAt.push({ k: m[1], i }); });
    const books = (() => { const firsts = keyAt.filter(x => x.k === 'ng_row_you').map(x => x.i); return firsts; })();
    assert.equal(books.length, 2, 'once in each book');
    for (const k of NEW){
      const at = keyAt.map((x, j) => ({ ...x, j })).filter(x => x.k === k);
      assert.equal(at.length, 2, k + ' once per book');
      const pre = k.split('_')[0] + '_';
      for (const a of at){
        /* the nearest older key above and below the new block it sits in */
        let up = a.j - 1; while (up >= 0 && NEW.includes(keyAt[up].k)) up--;
        let dn = a.j + 1; while (dn < keyAt.length && NEW.includes(keyAt[dn].k)) dn++;
        const nb = [keyAt[up], keyAt[dn]].filter(Boolean);
        assert.ok(nb.some(x => x.k.startsWith(pre)), k + ' sits among its own area\'s keys (line ' + (a.i + 1) + ': ' + nb.map(x => x.k).join(' / ') + ')');
        assert.ok(dn < keyAt.length && keyAt[dn].i - a.i < 400, k + ' is not appended at the end of its book');
      }
    }
  });
});

describe('f759 (2) the words say what the drawings say', () => {
  const en = STRINGS.en;
  test('2a Redlines (round 9)', () => {
    assert.equal(en.ng_band_awaiting, 'Waiting on you');
    assert.equal(fill(en.ng_band_suggest_by, { who: 'Lina' }), 'Lina suggests');
    assert.equal(en.ng_band_drafts, 'Your drafts, not yet sent');
    assert.equal(fill(en.ng_band_settled_in, { n: 1 }), 'Settled in round 1');
    assert.equal(en.ng_here_now, 'Here now');
    assert.equal(fill(en.ng_round_asks_came, { n: 2, ago: '4 days ago' }), 'Round 2 · their asks came 4 days ago');
    assert.equal(fill(en.ng_row_lock_editing, { who: 'Erik' }), 'Erik is editing this clause');
    assert.equal(en.ng_discard_last, 'Discard last');
    assert.equal(en.pd_face_w_red, 'Redlines');
  });
  test('2b The letter (round 11)', () => {
    assert.equal(en.pd_face_w_send, 'Before you send');
    assert.equal(fill(en.sh_hd_round, { n: 2 }) + ' ' + fill(en.sh_hd_to, { who: 'Nordvik Logistik AB', ref: 'MK-0382' }), 'Send round 2 to Nordvik Logistik AB · MK-0382');
    assert.equal(fill(en.sh_lt_from_v, { who: 'Maria Lindgren', org: 'Lindqvist & Co AB' }), 'Maria Lindgren, Lindqvist & Co AB · sent by HaTi');
    assert.equal(en.sh_lt_note_lbl, 'Your note · type here');
    assert.equal(fill(en.sh_lt_send_to, { who: 'Anna' }), 'Send to Anna');
    assert.equal(fill(en.sh_lt_remind, { who: 'Sara' }), 'Remind Sara');
    assert.equal(fill(en.sh_lt_goto, { n: 7 }), 'Go to clause 7');
    assert.equal(fill(en.sh_lt_stays_h, { clause: fill(en.sh_lt_clause_n, { n: 7 }) }), 'Clause 7 stays here');
    assert.equal(fill(en.sh_lt_never_h, { who: 'Anna' }), 'What Anna never sees');
    assert.equal(fill(en.sh_lt_never, { org: 'Lindqvist & Co' }), 'The review, your internal notes and your colleagues\' names stay inside Lindqvist & Co.');
    assert.equal(fill(en.sh_lt_stays_wait_by, { what: fill(en.sh_lt_stays_counter, { topic: 'liability cap', fig: ' (75%)' }), who: 'Sara Nyström', first: 'Sara' }),
      'Your counter on the liability cap (75%) is with Sara Nyström for internal review. Nothing under review travels; it goes in your next send once Sara clears it.');
    assert.deepEqual(['sh_as_p_negotiate', 'sh_as_c_email', 'sh_as_l_whole'].map(k => en[k]), ['a link to negotiate', 'by email', 'open for the whole negotiation']);
    assert.equal(fill(en.sh_as_w_round, { n: 2 }), 'the contract, round 2');
  });
});

describe('f759 (3) read by the screen only', () => {
  test('3a none of these words is written to a record', () => {
    const SRV = R('server/server.js');
    const writes = [R('js/negotiation.js'), R('js/review.js'), SRV].join('\n');
    for (const k of NEW){
      assert.ok(STRINGS.en[k], k + ' is a word of the screen');
      assert.ok(!new RegExp("'" + k + "'").test(writes), k + ' is not a record\'s word');
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   THE SECOND PASS (18 Oct 2026): the words of the notes in the column, the
   editor from a row, and the confirmation after Send — both books, beside
   their area, saying what the drawings say.
   AT b1ea174 (this lane's previous pass) and AT THE BASE every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const NEW2 = ['ng_fn_internal', 'ng_fn_back', 'ng_fn_back_title', 'ng_fn_clause', 'ng_fn_clause_title', 'ng_fn_ph', 'ng_fn_post', 'ng_fn_someone', 'ng_fn_notes_on',
  'sh_sent_by_email', 'sh_sent_by_email_bare', 'sh_sent_clause', 'sh_sent_note', 'sh_sent_and', 'sh_sent_history', 'sh_sent_status', 'sh_sent_stays_by', 'sh_sent_stays',
  'ce_walk_asks_of', 'ce_walk_asks_none', 'ce_row_back', 'ce_row_back_title', 'ce_row_counter', 'ce_row_edit', 'ce_row_asks_fig', 'ce_row_asks', 'ce_row_yours',
  'ce_row_lands', 'ce_row_ctx', 'ce_row_step_counter', 'ce_row_step_draft', 'ce_row_asked_h', 'ce_row_asked_none', 'ce_row_std_h', 'ce_row_std_fb',
  'ce_row_jambo_h', 'ce_row_jambo_p', 'ce_row_jambo_go', 'ce_row_jambo_plain', 'ce_row_jambo_cost'];
describe('f759 (4) the second pass\'s words, both books, beside their area', () => {
  test('4a in English and Swedish, the Swedish its own', () => {
    for (const k of NEW2){ assert.ok(STRINGS.en[k], k + ' en'); assert.ok(STRINGS.sv[k], k + ' sv'); }
    const same = NEW2.filter(k => STRINGS.en[k] === STRINGS.sv[k]);
    assert.deepEqual(same, [], 'a Swedish word is a translation, not the English again');
  });
  test('4b each sits among its own area\'s keys in both books, never appended at the end', () => {
    const keyAt = [];
    I18N.split('\n').forEach((l, i) => { const m = /^\s+([a-z][a-z0-9_]*):/.exec(l); if (m) keyAt.push({ k: m[1], i }); });
    for (const k of NEW2){
      const at = keyAt.map((x, j) => ({ ...x, j })).filter(x => x.k === k);
      assert.equal(at.length, 2, k + ' once per book');
      const pre = k.split('_')[0] + '_';
      for (const a of at){
        let up = a.j - 1; while (up >= 0 && NEW2.includes(keyAt[up].k)) up--;
        let dn = a.j + 1; while (dn < keyAt.length && NEW2.includes(keyAt[dn].k)) dn++;
        assert.ok([keyAt[up], keyAt[dn]].filter(Boolean).some(x => x.k.startsWith(pre)), k + ' among its own area\'s keys');
        assert.ok(dn < keyAt.length && keyAt[dn].i - a.i < 400, k + ' not at the end of its book');
      }
    }
  });
  test('4c the words say what the drawings say', () => {
    const en = STRINGS.en;
    assert.equal(fill(en.ng_fn_ph, { room: 'Internal' }), 'Write to Internal… type @ to name someone');
    assert.equal(en.ng_fn_post, 'Post');
    assert.equal(fill(en.ng_fn_clause, { n: 11 }), 'clause 11');
    assert.equal(fill(en.ce_walk_asks_of, { k: 1, n: 2 }), '1 of 2 of their asks');
    assert.equal(fill(en.ce_row_counter, { clause: '7. Liability cap' }), 'Counter · 7. Liability cap');
    assert.equal(fill(en.ce_row_asks_fig, { who: 'Nordvik', fig: '100%' }) + ' · ' + en.ce_row_lands, 'Nordvik asks 100% · back lands on the same row');
    assert.equal(fill(en.ce_row_ctx, { name: 'Master services agreement', ref: 'MK-0382', party: 'Nordvik Logistik AB', n: 2 }), 'Master services agreement · MK-0382 · Nordvik Logistik AB · round 2');
    /* RE-POINTED 19 Oct 2026 (third pass, main's rule): the step words are
       inert in both books; the editor says what the wording is, and only what
       is true — nothing is filed until Save */
    assert.equal(en.ce_row_is_counter, 'Your counter · nothing is filed until you save');
    assert.equal(en.ce_row_asked_h, 'What they asked');
    assert.equal(en.ce_row_jambo_p, 'For a softer version, or this clause in plain English.');
    assert.equal(en.ce_row_jambo_go, 'Ask for a softer version');
    assert.equal(en.ce_row_jambo_cost, 'about 1 Jambo call', 'in calls, never money (the owner\'s answer 4)');
    assert.equal(fill(en.sh_sent_by_email, { who: 'Anna Holm', what: fill(en.sh_sent_and, { a: fill(en.sh_sent_clause, { n: 11 }), b: en.sh_sent_note }) })
      + ' ' + fill(en.sh_sent_stays_by, { n: 7, who: 'Sara' }), 'Sent to Anna Holm by email: clause 11 and your note. Clause 7 stays here until Sara clears it.');
  });
});
