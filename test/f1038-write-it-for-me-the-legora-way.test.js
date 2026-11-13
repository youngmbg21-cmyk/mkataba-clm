'use strict';
/* f1038 — WRITE IT FOR ME, THE LEGORA WAY (owner, 13 Nov 2026: "the draft should happen in jambo and then like in the
   clause editor page, give you options of what next like apply or redo etc… you can also steer the message"; picked
   "The Legora Way" by name). Jambo's note for the open send screen is a DRAFT on his turn in the panel beside the
   letter — never written straight into the note box. Each point carries the clause it came from (read off what this
   send carries, no AI). The one row under it: chips (Shorter · Warmer · Firmer · Leave out § · Ask for a reply) · Put
   in the note · Try again · ⋯ (Copy, Discard); put in, "✓ In your note · Undo".
   At the parent Home's panel dropped the note entirely (intelPushChatResult never read res.note): every test fails. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js'), AI = R('js/ai.js'), SRV = R('server/server.js'), I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };
const constOf = (src, name) => { const m = new RegExp('\\nconst ' + name + '=[^;]*;').exec(src); assert.ok(m, name); return m[0]; };

function stage(sends){
  const ctx = { i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), igEsc: s => String(s),
    aiSendNoteClean: v => typeof v === 'string' ? v.trim() : '', shareScreenSays: () => sends, intel: { moreOpen: null } };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext([constOf(IG, 'IG_NOTE_CHIPS'), constOf(IG, 'IG_NOTE_LEAVE_MAX'), 'function igMoreHtml(i,rows){ return "<more>"+rows.join("")+"</more>"; }',
    ...['igNoteClauses', 'igNoteTagOf', 'igNoteSentences', 'igNoteOf', 'igNoteCardHtml', 'igNoteRowParts'].map(n => fnBody(IG, n))].join('\n'), ctx);
  return ctx;
}
const SENDS = { contractId: 'MK-382', noteMax: 1000,
  goes: ['Clause 7 · Liability: we propose a cap.', 'Clause 11 · Payment terms: they accept your change.', 'Clause 14 · Termination: they keep the current wording.'] };
const NOTE = 'Thank you for the quick turnaround. We accept your forty-five days on payment terms. On liability we propose a cap of twelve months of fees. Happy to talk.';

describe('f1038 — the note is drafted in Jambo\'s panel and steered there', () => {
  test('1 a pressed "Write it for me" brings a draft on the turn, HaTi\'s own sentence over it, each point tagged', () => {
    const ctx = stage(SENDS); ctx._shNlWrite = 'MK-382';
    const n = ctx.igNoteOf({ answer: 'Note ready to go in your note box with the button under it.', note: NOTE });
    assert.equal(n.say, 'sh_nl_here', 'never the model\'s sentence about a box and a button');
    assert.equal(ctx._shNlWrite, null, 'the press is spent');
    assert.deepEqual(JSON.parse(JSON.stringify(n.draft.tags)), [null, '11', '7', null], 'payment → §11, liability → §7, nothing invented');
    const card = ctx.igNoteCardHtml({ sendNote: n.draft }, 4);
    assert.match(card, /data-ig-note="4"/);
    assert.match(card, /payment terms\. <span class="igd-note-src">§11<\/span>/);
    assert.match(card, /fees\. <span class="igd-note-src">§7<\/span>/);
    const none = stage(SENDS); none._shNlWrite = 'MK-382';
    assert.deepEqual(JSON.parse(JSON.stringify(none.igNoteOf({ answer: 'Ready.' }))), { say: 'sh_nl_none' }, 'a press with no note says so');
    assert.equal(stage(SENDS).igNoteOf({ answer: 'Hi' }), null, 'no note, no press: an ordinary answer');
    assert.equal(stage(null).igNoteOf({ answer: 'x', note: NOTE }), null, 'no send screen open: no draft');
  });

  test('2 the one row: the steers, Put in the note, Try again, and ⋯ with Copy and Discard', () => {
    const ctx = stage(SENDS);
    const d = ctx.igNoteOf({ answer: 'x', note: NOTE }).draft;
    const p = ctx.igNoteRowParts({ sendNote: d }, 4);
    const kinds = p.chips.map(c => (/data-ig-note-chip="(\w+)"(?: data-ig-note-n="(\w+)")?/.exec(c) || []).slice(1).filter(Boolean).join(':'));
    assert.deepEqual(JSON.parse(JSON.stringify(kinds)), ['shorter', 'warmer', 'firmer', 'leave:11', 'leave:7', 'reply'], 'Leave out only what the note mentions');
    assert.match(p.lead, /^<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ig-note-put="4">sh_nl_put<\/button><button type="button" class="ui-btn ui-btn-sm" data-ig-note-again="4">ce_ask_retry<\/button>$/);
    assert.equal(p.more.length, 2); assert.match(p.more[0], /data-ig-note-copy="4"/); assert.match(p.more[1], /data-ig-note-drop="4"/);
    d.put = true;
    const q = ctx.igNoteRowParts({ sendNote: d }, 4);
    assert.deepEqual([q.chips.length, q.more.length], [0, 0]);
    assert.match(q.lead, /sh_nl_in<\/span><button type="button" class="ui-link" data-ig-note-undo="4">ce_sug_undo/, 'put in: ✓ In your note · Undo');
    d.put = false; d.gone = true;
    assert.match(ctx.igNoteRowParts({ sendNote: d }, 4).lead, /sh_nl_dropped/);
    assert.equal(ctx.igNoteCardHtml({ sendNote: d }, 4), '', 'discarded: the card goes');
  });

  test('3 the panel draws the draft and its row; presses put it in, undo, steer and try again through the one box', () => {
    assert.match(fnBody(IG, 'intelPushChatResult'), /const note=igNoteOf\(res\);/);
    assert.match(fnBody(IG, 'intelPushChatResult'), /\(note&&note\.draft\)\?\{ sendNote:note\.draft \}:\{\}/);
    assert.match(fnBody(IG, 'igMsgHTML'), /\$\{\(Number\.isInteger\(i\)&&m\.sendNote\)\?igNoteCardHtml\(m,i\):''\}/);
    assert.match(fnBody(IG, 'igOneHtml'), /const np=m\.sendNote\?igNoteRowParts\(m,i\):null;/);
    const H = IG.slice(IG.indexOf("const b=t.closest('#ig-dock [data-ig-note-chip]"), IG.indexOf("const b=t.closest('#ig-dock [data-ig-note-chip]") + 3000);
    assert.match(H, /shareNoteFill\(d\.id, d\.words\)/, 'Put in the note: the box, through the screen\'s one filler');
    assert.match(H, /d\.put=true; d\.prev=prev;/);
    assert.match(H, /ta\.value=d\.prev\|\|''; ta\.dispatchEvent\(new Event\('input', \{ bubbles:true \}\)\)/, 'Undo puts back what was there');
    /* RE-POINTED 13 Nov 2026 (f1041): a steer goes straight to Jambo, never the typing reader */
    assert.match(fnBody(IG, 'igNoteAsk'), /return igAskBrain\(i18t\('sh_nl_q_with', \{ ask:words, note:d\.words \}\)\);/, 'a steer is a press straight to Jambo, carrying the draft');
    assert.doesNotMatch(fnBody(AI, 'aiSendNoteHtml').split('\nif(typeof document')[0], /shareNoteFill/, 'nothing writes the box on its own any more');
  });

  test('4 Jambo redrafts on a steer, word for word the same rule on both hosts; both books carry the words', () => {
    const srv = SRV.match(/\nconst AI_SEND_NOTE_RULE = ('.*?');\n/)[1].slice(1, -1), web = AI.match(/\nconst AI_SEND_NOTE_RULE='(.*?)';\n/)[1];
    assert.equal(srv, web);
    assert.match(web, /or to change a note you drafted for it \(shorter, warmer, firmer, leaving a point out, adding something\)/);
    assert.doesNotMatch(web, /with the button under it/);
    for (const k of ['sh_nl_here', 'sh_nl_put', 'sh_nl_in', 'sh_nl_dropped', 'sh_nl_copy', 'sh_nl_chip_shorter', 'sh_nl_chip_leave', 'sh_nl_chip_reply', 'sh_nl_q_again', 'sh_nl_q_leave'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ": '", 'g')) || []).length, 2, k + ' in both books');
  });
});
