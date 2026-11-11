/* f1004 — A TYPED ANSWER IS NEVER TAKEN BACK
   =========================================
   The owner, 11 Nov 2026: "fix the still owed bug too".

   THE FAULT, MEASURED ON GITHUB (owed-first-verify 2b, five runs of the night):
   "6 months" typed into the notice period was stored (one fewer owed), then a
   second later the notice period was owed again while ANOTHER box, the start
   date, had been filled. Two holders of an OLD copy of the contract wrote it
   back over the new one:
     · the arrival read (runFillBlanks → contractBlankSet / persist) began on the
       object it was handed; a refresh had swapped that object out of
       state.contracts, so its fills and its save went from the stale copy;
     · the live probe swapped a fresh server copy in while an answer typed during
       its GET was still waiting to be saved, taking it off the screen.

   WHAT IS PINNED HERE:
     1 · contractBlankSet writes the LIVE record when handed a stale copy
     2 · a quiet fill (a reading's, not a person's) never writes over a box that
         has been filled since the reading began
     3 · persist queues the LIVE record for saving, never the copy it was handed
     4 · the live probe does not swap a contract out while a save of it is pending
     5 · contractSavePending is published, so the files that ask it can

   Run: node --test test/f1004-a-typed-answer-is-never-taken-back.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const CORE = strip(read('js/core.js'));
const NEGO = strip(read('js/views/negotiation.js'));

/* the body of one function, found by name */
function fnBody(src, name) {
  const at = src.search(new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', at);
  let d = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(open, i + 1);
  }
  return '';
}

function stage() {
  const { win } = buildWorld({ blanks: true, templates: true });
  const live = { id: 'MK-900', name: 'Supply', status: 'Draft', counterparty: '', value: 0, fields: {}, audit: [], metadata: {} };
  win.state = win.state || { contracts: [], settings: {} };
  win.state.contracts = [live];
  win.getContract = id => win.state.contracts.find(x => x && x.id === id);
  win.canEdit = () => true;
  const saved = [];
  win.persist = c => { saved.push(c); };
  return { win, live, saved };
}

describe('f1004 — a typed answer is never taken back', () => {
  test('1 · a fill handed a stale copy lands on the live record', () => {
    const { win, live } = stage();
    /* a reading began on this object; a refresh has since swapped it out */
    const stale = { ...live, fields: {} };
    win.state.contracts = [live];
    assert.equal(win.contractBlankSet(stale, 'effDate', '2026-11-11', { quiet: true }), true);
    assert.equal(live.fields.effDate, '2026-11-11', 'the live record holds the fill');
  });

  test('2 · a reading never writes over a box a person has filled since it began', () => {
    const { win, live } = stage();
    const stale = { ...live, fields: {} };
    /* the person types the notice period into the live record */
    assert.equal(win.contractBlankSet(live, 'up_notice_period', '6 months'), true);
    /* the reading, deciding on what was open when it began, tries the same box */
    assert.equal(win.contractBlankSet(stale, 'up_notice_period', '3 months', { quiet: true }), false);
    assert.equal(live.fields.up_notice_period, '6 months', 'the person’s answer stands');
    /* a person's own change still goes through */
    assert.equal(win.contractBlankSet(live, 'up_notice_period', '2 months'), true);
    assert.equal(live.fields.up_notice_period, '2 months');
  });

  test('3 · persist queues the live record, never the copy it was handed', () => {
    const b = fnBody(CORE, 'persist');
    assert.ok(b, 'persist is there');
    assert.match(b, /getContract\(c\.id\)/, 'persist asks for the live record');
    assert.match(b, /dirty\.set\(c\.id,\s*live\s*\|\|\s*c\)/, 'and queues it, the handed copy only where there is none');
  });

  test('4 · the live probe waits while a save of the contract is pending', () => {
    const at = NEGO.indexOf("state.contracts[i] = fresh");
    assert.ok(at > 0, 'the probe’s swap is there');
    const region = NEGO.slice(Math.max(0, at - 900), at + 80);
    assert.match(region, /contractSavePending\(held\)/, 'it asks whether the row in hand is still being saved');
    assert.match(region, /if \(i >= 0 && !waits\)\{ state\.contracts\[i\] = fresh/, 'and swaps only when it is not');
  });

  test('5 · contractSavePending is published', () => {
    assert.match(CORE, /Object\.assign\(window,\{[^}]*[{,]contractSavePending[,}]/, 'one module publishes it');
  });
});
