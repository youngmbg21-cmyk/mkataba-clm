'use strict';
/* f935 — BOTH HALVES: DRAWN AND EXPLAINED, WHATEVER THE VERB (owner picked it by name, 25 Oct 2026)

   The owner: "if you ask to tell you more about something, it should be okay to be pushed to the board and it shows
   you the charts while giving you nuanced answers." Before this, the first word decided: "show" drew and said one
   line, "tell" said words and drew nothing, only a plain question got both. Now the SUBJECT decides.
     1 · "tell me more about X" draws X when the Board can draw it; "create…" and a flat pack stay the brain's
     2 · one rule for whether a drawing is also explained: a fresh picture yes, whatever the verb; a change no
     3 · "more", "go on", "why" carry the last answer on, in the chat, with the Board as it stands
     4 · the panel asks the Board for the subject, the brain for the words as typed; next questions under the words
   At the parent every test here fails: the readers are not there.

   Run: node --test test/f935-both-halves.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HB = R('js/views/homeboard.js'), IG = R('js/views/intelligence.js');

/* a function's own text, to its closing brace (a one-line function too); braces inside regexes and strings are
   balanced in these readers */
const fnBody = (src, name) => { const i = src.indexOf(`function ${name}(`); assert.ok(i >= 0, name + ' is defined');
  let d = 0, j = src.indexOf('{', src.indexOf(')', i));
  for (; j < src.length; j++){ const ch = src[j]; if (ch === '{') d++; else if (ch === '}' && --d === 0) break; }
  return src.slice(i, j + 1) + '\n'; };
const lineOf = (src, name) => { const i = src.indexOf(`const ${name} = `); assert.ok(i >= 0, name + ' is defined'); return src.slice(i, src.indexOf('\n', i)); };
/* the Board's reader as the page runs it, with a reading of the subject given */
function world(reads){
  const ctx = { hbAskReadingOf: q => reads[String(q).trim().toLowerCase()] || { road: 'copilot', q } };
  ctx.window = ctx; vm.createContext(ctx);
  const consts = ['HB_BRAIN_VERB_RE', 'HB_CHART_WORD_RE', 'HB_FLAT_KINDS', 'HB_TELL_RE', 'HB_EXPLAIN_KINDS', 'HB_TWEAK_RE', 'HB_MORE_RE'].map(n => lineOf(HB, n));
  const fns = ['hbBrainVerb', 'hbChartWords', 'hbQuestionAsk', 'hbDrawsSomething', 'hbSubjectDraws', 'hbTellSubject', 'hbDrawWordsOf', 'hbExplainsDrawn', 'hbMoreAsk'].map(n => fnBody(HB, n));
  vm.runInContext(consts.join('\n') + '\n' + fns.join('\n') + '\nObject.assign(this, { hbTellSubject, hbDrawWordsOf, hbExplainsDrawn, hbMoreAsk });', ctx);
  return ctx;
}
const DIG = { road: 'free', kind: 'dig', r: { key: 'q:x' } };
const READS = { 'what ends this quarter': DIG, 'the overdue obligations': { road: 'free', kind: 'dig', r: { key: 'f:overdue' } },
  'where we have the highest risk': { road: 'free', kind: 'pack' }, 'juno llc payment terms': { road: 'copilot' } };

describe('f935 (1) "tell me more about X" draws X', () => {
  const w = world(READS);
  test('the lead words come off and what is left is the Board\'s', () => {
    for (const q of ['tell me more about what ends this quarter', 'Tell me a bit more about what ends this quarter?', 'can you explain what ends this quarter',
      'walk me through what ends this quarter', 'give me an overview of what ends this quarter', 'berätta mer om what ends this quarter'])
      assert.equal(w.hbTellSubject(q), 'what ends this quarter', q);
    assert.equal(w.hbTellSubject('explain the overdue obligations'), 'the overdue obligations');
    assert.equal(w.hbDrawWordsOf('tell me more about what ends this quarter'), 'what ends this quarter', 'the Board is asked the subject');
  });
  test('a subject the Board only answers flat, cannot read, or only points back at stays the brain\'s', () => {
    assert.equal(w.hbTellSubject('tell me where we have the highest risk'), null, 'a flat pack is never the drawing');
    assert.equal(w.hbTellSubject('tell me about juno llc payment terms'), null);
    assert.equal(w.hbTellSubject('tell me more about it'), null, '"it" is the last answer: hbMoreAsk\'s');
    assert.equal(w.hbTellSubject('create a table for what ends this quarter'), null, '"create…" is never drawn by the Board (CA_DRAFT_ANALYSIS)');
    assert.equal(w.hbDrawWordsOf('what ends this quarter?'), 'what ends this quarter?', 'a plain question is read as typed');
  });
  test('hbDrawAsk takes the "tell" road through it, and only for a brain verb with no chart words', () => {
    assert.match(fnBody(HB, 'hbDrawAsk'), /if \(hbBrainVerb\(t\) && !hbChartWords\(t\)\) return !!hbTellSubject\(t, onFace\);/);
  });
});

describe('f935 (2) one rule: is a drawing also explained', () => {
  const w = world(READS);
  test('a fresh picture is explained whatever the verb', () => {
    assert.equal(w.hbExplainsDrawn('show me what ends this quarter', DIG), true, 'show');
    assert.equal(w.hbExplainsDrawn('chart value by stream', DIG), true, 'chart');
    assert.equal(w.hbExplainsDrawn('what ends this quarter?', DIG), true, 'a question');
    assert.equal(w.hbExplainsDrawn('tell me more about what ends this quarter', DIG), true, 'tell me more');
    assert.equal(w.hbExplainsDrawn('and by counterparty?', { road: 'free', kind: 'follow' }), true, 'a follow-up asked as a question');
    assert.equal(w.hbExplainsDrawn('top 10', { road: 'free', kind: 'panel' }), true);
  });
  test('a change to what is drawn, a flat pack, or nothing drawn: one line', () => {
    for (const q of ['sort by value', 'make it monthly', 'only Naivas', 'undo', 'by counterparty', 'group by stream', 'open contracts'])
      assert.equal(w.hbExplainsDrawn(q, DIG), false, q);
    assert.equal(w.hbExplainsDrawn('make it monthly', { road: 'free', kind: 'follow' }), false);
    assert.equal(w.hbExplainsDrawn('what is our exposure', { road: 'free', kind: 'pack' }), false);
    assert.equal(w.hbExplainsDrawn('show me MK-1', { road: 'free', kind: 'card' }), false, 'a contract\'s strip has its own words');
    assert.equal(w.hbExplainsDrawn('what ends this quarter', { road: 'copilot' }), false);
  });
  test('igAskThenExplain asks this one rule (the engine still has to be there)', () => {
    const body = fnBody(IG, 'igAskThenExplain');
    assert.ok(body.indexOf("if(!(window.caAiFirst&&caAiFirst())) return false;") < body.indexOf("if(typeof window.hbExplainsDrawn==='function') return hbExplainsDrawn(q, A);"));
  });
});

describe('f935 (3) "more" carries the last answer on', () => {
  const w = world(READS);
  test('the words that ask for more of the same', () => {
    for (const q of ['more', 'More please', 'tell me more', 'go on', 'keep going', 'why?', 'and why', 'elaborate', 'expand on that', 'mer', 'berätta mer', 'varför?'])
      assert.equal(w.hbMoreAsk(q), true, q);
    for (const q of ['more contracts with Juno', 'why does the board say 851', 'tell me more about what ends this quarter', 'go to approvals'])
      assert.equal(w.hbMoreAsk(q), false, q);
  });
  test('on the Board they are the chat\'s, with the Board as it stands (never the map\'s guess)', () => {
    const i = IG.indexOf('async function intelAsk('); const body = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.ok(body.includes("||(typeof window.hbMoreAsk==='function'&&hbMoreAsk(q)));"), 'boardWords counts them');
  });
});

describe('f935 (4) do, say, offer — in one turn', () => {
  const i = IG.indexOf('async function intelAsk('); const body = IG.slice(i, IG.indexOf('\n}\n', i));
  test('the Board draws the subject, the brain is asked the words as typed', () => {
    assert.ok(body.includes("const drawQ=(boardDraw&&typeof window.hbDrawWordsOf==='function')?hbDrawWordsOf(q):q;"));
    assert.ok(body.includes('A=(typeof window.hbAskReadingOf===\'function\')?hbAskReadingOf(drawQ):null;') && body.includes('said=hbAsk(drawQ);'));
    assert.ok(body.includes('await intelChatAsk(q, { explain:true }); }catch(_){} igNextUnderWords(at);'), 'explained with the words typed, then the next questions move under them');
    assert.ok(body.includes('if(boardQ) igNextUnderWords(h0);'), 'a chat answer on the Board offers the open chart\'s next questions too');
  });
  test('the next questions stand under the words, once, and only while their chart is open', () => {
    const run = (hist, open) => {
      const ctx = { intel: { history: hist }, hbOpenListKey: () => open }; ctx.window = ctx; vm.createContext(ctx);
      vm.runInContext(fnBody(IG, 'igNextUnderWords') + fnBody(IG, 'igNextLive') + 'Object.assign(this,{ igNextUnderWords, igNextLive });', ctx);
      return ctx;
    };
    const h = [{ role: 'user', text: 'show me what ends this quarter' }, { role: 'assistant', text: 'Drawn.', reading: { key: 'q:x' } }, { role: 'assistant', text: 'Three end in March…' }];
    const w = run(h, 'q:x');
    w.igNextUnderWords(2);
    assert.equal(h[2].nextKey, 'q:x'); assert.equal(h[1].nextMoved, true, 'the Board\'s line gives its row up');
    assert.equal(w.igNextLive(2), true);
    h.push({ role: 'assistant', text: 'Drawn.', reading: { key: 'q:y' } });
    assert.equal(w.igNextLive(2), false, 'a later drawing takes the next questions');
    assert.equal(run(h.slice(0, 3), 'q:z').igNextLive(2), false, 'the chart was closed');
    const draw = IG.slice(IG.indexOf('hbReadingHtml(m.reading,hbReadingLive(i)'), IG.indexOf('hbReadingHtml(m.reading,hbReadingLive(i)') + 260);
    assert.ok(draw.includes('{ noNext:!!m.nextMoved }') && draw.includes('igNextLive(i)') && draw.includes('hbNextHtml(m.nextKey)'));
    assert.match(fnBody(HB, 'hbReadingHtml'), /\$\{opts && opts\.noNext \? '' : hbNextHtml\(rd\.key\)\}/);
  });
  test('the readers are published', () => {
    assert.ok(/HB_TELL_RE, HB_EXPLAIN_KINDS, hbSubjectDraws, hbTellSubject, hbDrawWordsOf, HB_TWEAK_RE, hbExplainsDrawn, HB_MORE_RE, hbMoreAsk \}\);/.test(HB));
    assert.ok(IG.includes('Object.assign(window,{ igMapNow, igAskThenExplain, igNextUnderWords, igNextLive });'));
  });
});
