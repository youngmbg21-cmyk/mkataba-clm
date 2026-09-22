/* ============================================================
   f356 — the parent-to-children index

   THE FINDING THIS CLOSES, measured on a real browser at 3,000 contracts:
   drawing Home once touched 108 MILLION items in lists, 99.5% of them from
   one reading — familyChildren, which searched the WHOLE BOOK on every call,
   asked about twelve times per contract by effectiveExpiry. Home 1,035 ms,
   Contracts 1,293, Insights 958. After the index: 88, 157, 115.

   TWO THINGS HAVE TO HOLD, and this file is both halves.

   (a) THE ANSWER DOES NOT MOVE. An index is only worth having if it says
       exactly what the scan said — same children, same order, for every
       contract, and effectiveExpiry with it. A faster wrong date is worse
       than a slow right one.

   (b) IT CANNOT GO STALE. The guard is three O(1) facts (same array, same
       length, same stamp) and a stamp only a caller can raise, so every
       writer of parentId and every in-place swap of a contract object must
       raise it. The grep at the end is what holds a NEW writer to that.

   AND ONE THING THE FIRST BUILD GOT WRONG, pinned here so it cannot come
   back: that build verified the index with a checksum over every contract's
   parentId — a full pass, on every single call — so each call cost MORE than
   the scan it replaced, and Home went from 1,035 ms to 3,442. A guard that
   walks the book is not a guard.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const FAM = fs.readFileSync(path.join(__dirname, '..', 'js', 'family.js'), 'utf8');

/* One place the world is built, so every claim below is asked of the same
   stage: the family model, and a book we control. */
function stage(contracts){
  const b = buildWorld({ family:true });
  const win = b.win;
  win.state = Object.assign(win.state || {}, { contracts: contracts.slice() });
  return win;
}
const C = (id, parentId, o) => Object.assign({ id, name:id, status:'Draft', audit:[] },
  parentId ? { parentId, relation:'amendment' } : {}, o || {});

/* The book the scan used to walk: three masters, five children, one of them
   filed under a parent that is not in the book at all. */
function book(){
  return [
    C('MK-1'), C('MK-2'), C('MK-3'),
    C('MK-4','MK-1'), C('MK-5','MK-1'), C('MK-6','MK-2'),
    C('MK-7','MK-1'), C('MK-8','MK-GONE'),
  ];
}
/* The reading exactly as it was before the index, so (a) is a comparison and
   not a description of the new code. */
const scan = (win, id) => win.state.contracts.filter(c => c.parentId === id);
const kidIds = (win, id) => Array.prototype.map.call(win.familyChildren(id), k => k.id).join(',');

describe('f356 (1) the index says what the scan said', () => {
  test('1a every contract in the book, children and order alike', () => {
    const win = stage(book());
    for(const c of win.state.contracts){
      /* JOINED, NOT deepEqual: the index's array is born inside the test
         window, so its prototype is that realm's Array — two identical lists
         fail deepStrictEqual on the constructor alone. The claim is which
         children, in what order, and a joined string says exactly that. */
      const was = scan(win, c.id).map(k => k.id).join(',');
      const now = Array.prototype.map.call(win.familyChildren(c.id), k => k.id).join(',');
      assert.equal(now, was, `children of ${c.id} moved`);
    }
  });
  test('1b a childless contract answers an empty list, not a missing one', () => {
    const win = stage(book());
    const out = win.familyChildren('MK-3');
    assert.ok(Array.isArray(out), 'an absence is a list with nothing in it');
    assert.equal(out.length, 0);
  });
  test('1c a parent nobody has is still nobody', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-NOSUCH').length, 0);
    /* and the orphan is not silently adopted by anything */
    assert.equal(kidIds(win,'MK-GONE'), 'MK-8');
  });
  test('1d an empty book answers without throwing', () => {
    const win = stage([]);
    assert.equal(win.familyChildren('MK-1').length, 0);
  });
  test('1e effectiveExpiry is unmoved — the date is the point of the whole reading', () => {
    const win = stage([
      C('MK-1', null, { expiry:'2026-01-31', metadata:{ expiryDate:'2026-01-31' } }),
      C('MK-9','MK-1', { status:'Signed', expiry:'2027-06-30',
        metadata:{ expiryDate:'2027-06-30' }, audit:[{ at:'2026-02-01T00:00:00.000Z', user:'x', action:'Created' }] }),
    ]);
    const c = win.state.contracts[0];
    assert.equal(win.effectiveExpiry(c), '2027-06-30',
      'the signed amendment still moves the term');
  });
});

describe('f356 (2) the guard is O(1) — the first build was not', () => {
  test('2a no per-call checksum over the book', () => {
    assert.ok(!/famSignature/.test(FAM),
      'the checksum guard walked every contract on every call and cost more than the scan');
  });
  test('2b familyIndex holds the map and rebuilds only on a miss', () => {
    const m = FAM.match(/function familyIndex\(\)\{[\s\S]*?\n\}/);
    assert.ok(m, 'familyIndex is the one reading');
    const body = m[0];
    assert.ok(/_famSrc/.test(body) && /_famLen/.test(body) && /_famStamp/.test(body),
      'three O(1) facts: the same array, the same length, the same stamp');
    /* the early return IS the saving */
    assert.ok(/return _famIdx/.test(body), 'a hit returns the map it already has');
  });
  test('2c two readings of one book hand back the SAME array', () => {
    const win = stage(book());
    const a = win.familyChildren('MK-1');
    const b = win.familyChildren('MK-1');
    assert.equal(a, b, 'the scan built a fresh array every time — that was the cost');
  });
  test('2d the empty answer is shared and frozen, because it is shared', () => {
    const win = stage(book());
    const a = win.familyChildren('MK-3');
    const b = win.familyChildren('MK-2-NOPE');
    assert.equal(a, b);
    assert.ok(Object.isFrozen(a), 'a shared array a caller could push onto is a trap');
  });
});

describe('f356 (3) it cannot go stale', () => {
  test('3a a child added to the book is seen (the length changed)', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-3').length, 0);
    win.state.contracts.push(C('MK-10','MK-3'));
    assert.equal(kidIds(win,'MK-3'), 'MK-10');
  });
  test('3b a child removed from the book is seen', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-2').length, 1);
    win.state.contracts = win.state.contracts.filter(c => c.id !== 'MK-6');
    assert.equal(win.familyChildren('MK-2').length, 0);
  });
  test('3c the whole book replaced is seen (the array is a different object)', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-1').length, 3);
    win.state.contracts = [C('MK-1'), C('MK-99','MK-1')];
    assert.equal(kidIds(win,'MK-1'), 'MK-99');
  });
  test('3d applyParentLink is seen — same array, same length', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-3').length, 0);
    win.applyParentLink(win.state.contracts[2 + 0] /* MK-3 is a master */, 'MK-1', 'amendment', '', { name:'x' });
    /* MK-3 has become a child of MK-1 in place: nothing about the array moved */
    assert.ok(kidIds(win,'MK-1').split(',').includes('MK-3'),
      'the stamp is what makes an in-place parentId visible');
  });
  test('3e clearParentLink is seen', () => {
    const win = stage(book());
    const kid = win.state.contracts.find(c => c.id === 'MK-6');
    assert.equal(win.familyChildren('MK-2').length, 1);
    win.clearParentLink(kid, { name:'x' });
    assert.equal(win.familyChildren('MK-2').length, 0);
  });
  test('3f a contract object swapped in place is seen once the stamp is raised', () => {
    const win = stage(book());
    assert.equal(win.familyChildren('MK-1').length, 3);
    const i = win.state.contracts.findIndex(c => c.id === 'MK-7');
    win.state.contracts[i] = C('MK-7','MK-2');       /* re-filed on the server */
    win.familyIndexDirty();
    assert.equal(win.familyChildren('MK-1').length, 2);
    assert.equal(win.familyChildren('MK-2').length, 2);
  });
});

describe('f356 (4) every writer raises the stamp', () => {
  /* THE NET. A future writer of parentId that forgets the stamp hands out a
     stale family, and the first thing that goes wrong is a wrong expiry date
     on a screen — which is the fault the index exists beside, not one it may
     introduce. So the grep is on the WRITE, not on a list of files. */
  const JS = [];
  (function walk(dir){
    for(const f of fs.readdirSync(dir)){
      const p = path.join(dir, f);
      const st = fs.statSync(p);
      if(st.isDirectory()) walk(p);
      else if(f.endsWith('.js')) JS.push(p);
    }
  })(path.join(__dirname, '..', 'js'));

  test('4a every c.parentId = write is followed by familyIndexDirty', () => {
    const misses = [];
    for(const p of JS){
      const src = fs.readFileSync(p, 'utf8');
      const lines = src.split('\n');
      lines.forEach((ln, i) => {
        if(!/\w+\.parentId\s*=[^=]/.test(ln)) return;
        const after = lines.slice(i, i + 4).join('\n');
        if(!/familyIndexDirty/.test(after)) misses.push(path.basename(p) + ':' + (i + 1) + ' ' + ln.trim());
      });
    }
    assert.deepEqual(misses, [], 'a parentId written without raising the stamp');
  });
  test('4b every delete of parentId is followed by familyIndexDirty', () => {
    const misses = [];
    for(const p of JS){
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        if(!/delete\s+\w+\.parentId/.test(ln)) return;
        const after = lines.slice(i, i + 4).join('\n');
        if(!/familyIndexDirty/.test(after)) misses.push(path.basename(p) + ':' + (i + 1));
      });
    }
    assert.deepEqual(misses, [], 'a parentId deleted without raising the stamp');
  });
  test('4c every in-place swap of a contract object raises it too', () => {
    const misses = [];
    for(const p of JS){
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      lines.forEach((ln, i) => {
        if(!/state\.contracts\[\s*\w+\s*\]\s*=[^=]/.test(ln)) return;
        const near = lines.slice(Math.max(0, i - 2), i + 4).join('\n');
        if(!/familyIndexDirty/.test(near)) misses.push(path.basename(p) + ':' + (i + 1));
      });
    }
    assert.deepEqual(misses, [], 'same array, same length — only the stamp can show this');
  });
  test('4d familyIndexDirty is published, or the other modules cannot raise it', () => {
    assert.ok(/familyIndexDirty/.test(FAM.split('Object.assign(window').pop() || ''),
      'a name missing from the publish list is unreachable from another file');
  });
});
