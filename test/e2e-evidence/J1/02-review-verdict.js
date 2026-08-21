'use strict';
/* Corrected review-verdict attack. 01-role-and-scope.js's section 4 attacked
   the WRONG FIELD (ch.status/resolvedBy, which is the negotiation-decision
   mechanism) instead of ch.review (the verdict mechanism js/review.js
   actually writes — reviewMark sets live.review = {verdict, by, byId,
   hash, reviewId}). That earlier "wrong person" result is DISCARDED as an
   attack that failed to arm — recorded here as such, then redone properly:
   rv.reviewer = {id,name}, rv.by/byId, and the verdict is written into
   ch.review, which is what the server's guard at ~line 2996 actually reads. */
const assert = require('node:assert');
const { startHati, seedWorkspace } = require('../../helpers');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  try {
    console.log('=== 02: corrected review-verdict guard ===');
    const changeId = 'CHG-atk-2';
    const full = await W.unrestricted.json('/api/contracts/MK-A2');
    const baseVersion = full._v; delete full._v;
    full.changes = (full.changes || []).concat([{
      id: changeId, clauseId: 'c1', status: 'pending', authorSide: 'owner',
      author: 'Unrestricted Legal', by: 'everything@example.co.ke',
      createdAt: new Date().toISOString(), seq: 1, oldText: 'old', newText: 'new', ops: [], round: 1,
    }]);
    full.review = { requests: [{
      id: 'REV-atk-2', status: 'open', changeIds: [changeId],
      reviewer: { id: W.users.novalues.id, name: 'No Values Legal' },
      byId: W.users.unrestricted.id, by: 'Unrestricted Legal',
      at: new Date().toISOString(),
    }] };
    const r0 = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
    console.log(`SEED (properly shaped: rv.reviewer={id,name}, rv.by/byId set): status=${r0.status}`);
    assert.strictEqual(r0.status, 200, 'seed must succeed');
    const check = await W.unrestricted.json('/api/contracts/MK-A2');
    assert.strictEqual(check.review.requests[0].status, 'open');
    assert.strictEqual(check.review.requests[0].reviewer.id, W.users.novalues.id);
    console.log('ASSERTED: REV-atk-2 open, reviewer.id === novalues.id, CHG-atk-2 present with authorSide=owner (side=ours -> verdicts cleared/held)');

    // WRONG PERSON (restricted — not the named reviewer, not admin, not requester) writes ch.review
    {
      const f = await W.restricted.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      const ch = f.changes.find(c => c.id === changeId);
      ch.review = { verdict: 'held', note: 'forged hold', by: 'Restricted Legal', byId: W.users.restricted.id, at: new Date().toISOString(), hash: ch.hash || null, reviewId: 'REV-atk-2' };
      const r = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`WRONG PERSON (restricted, not the named reviewer) writes ch.review={verdict:'held',...}: status=${r.status} body=${r.text.slice(0,300)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillNoVerdict = !(after.changes.find(c => c.id === changeId).review);
      console.log(`  post-check: ch.review still absent (no forged verdict landed) = ${stillNoVerdict}`);
      console.log(`  FINDING review-verdict-wrong-person-CORRECTED: refused=${r.status >= 400} held=${stillNoVerdict}`);
    }

    // WRONG PERSON also tries admin-shaped bypass: same but role admin should succeed generally? Admin is NOT the reviewer either — does rvIsReviewer allow admin? Check code: rvIsReviewer only checks reviewer identity, NOT admin. So even ADMIN should be refused unless also named reviewer.
    {
      const f = await W.admin.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      const ch = f.changes.find(c => c.id === changeId);
      ch.review = { verdict: 'held', note: 'admin overriding', by: 'Amina Otieno', byId: null, at: new Date().toISOString(), hash: ch.hash || null, reviewId: 'REV-atk-2' };
      const r = await W.admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`ADMIN (not the named reviewer) writes ch.review verdict: status=${r.status} body=${r.text.slice(0,300)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillNoVerdict = !(after.changes.find(c => c.id === changeId).review);
      console.log(`  post-check: ch.review still absent = ${stillNoVerdict}`);
      console.log(`  FINDING review-verdict-admin-not-reviewer: refused=${r.status >= 400} held=${stillNoVerdict}`);
    }

    // RIGHT PERSON (novalues, the actually-named reviewer) succeeds
    {
      const f = await W.novalues.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      const ch = f.changes.find(c => c.id === changeId);
      ch.review = { verdict: 'held', note: 'genuine hold', by: 'No Values Legal', byId: W.users.novalues.id, at: new Date().toISOString(), hash: ch.hash || null, reviewId: 'REV-atk-2' };
      const r = await W.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`RIGHT PERSON (novalues, named reviewer) writes ch.review verdict 'held': status=${r.status} body=${r.text.slice(0,200)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const landed = after.changes.find(c => c.id === changeId).review && after.changes.find(c => c.id === changeId).review.verdict === 'held';
      console.log(`  post-check: verdict landed = ${landed}`);
      console.log(`  FINDING review-verdict-right-person-CORRECTED: accepted=${r.status<400} landed=${landed}`);
    }

    // --- Now redo cancel/return with PROPERLY shaped rv.by/byId and rv.reviewer, to get a real positive control too ---
    console.log('\n=== cancel/hand-back with a properly shaped review (positive + negative controls) ===');
    const changeId3 = 'CHG-atk-3';
    const f3 = await W.unrestricted.json('/api/contracts/MK-A2');
    const bv3 = f3._v; delete f3._v;
    f3.changes = (f3.changes || []).concat([{ id: changeId3, clauseId: 'c2', status: 'pending', authorSide: 'owner', author: 'Unrestricted Legal', by: 'everything@example.co.ke', createdAt: new Date().toISOString(), seq: 2, oldText:'o', newText:'n', ops:[], round:1 }]);
    f3.review.requests.push({ id: 'REV-atk-3', status: 'open', changeIds: [changeId3], reviewer: { id: W.users.novalues.id, name: 'No Values Legal' }, byId: W.users.unrestricted.id, by: 'Unrestricted Legal', at: new Date().toISOString() });
    const rSeed3 = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f3, baseVersion: bv3 } });
    console.log(`SEED REV-atk-3 (requester=unrestricted, reviewer=novalues): status=${rSeed3.status}`);
    assert.strictEqual(rSeed3.status, 200);

    // WRONG PERSON cancels (restricted — neither requester nor admin)
    {
      const f = await W.restricted.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      f.review.requests.find(r => r.id === 'REV-atk-3').status = 'cancelled';
      const r = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`WRONG PERSON (restricted, neither requester(unrestricted) nor admin) cancels REV-atk-3: status=${r.status} body=${r.text.slice(0,250)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const stillOpen = after.review.requests.find(r=>r.id==='REV-atk-3').status === 'open';
      console.log(`  post-check: still open = ${stillOpen}`);
    }
    // RIGHT PERSON (requester = unrestricted) cancels — positive control
    {
      const f = await W.unrestricted.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      f.review.requests.find(r => r.id === 'REV-atk-3').status = 'cancelled';
      const r = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`RIGHT PERSON (unrestricted, the actual requester, byId matches) cancels REV-atk-3: status=${r.status} body=${r.text.slice(0,250)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const cancelled = after.review.requests.find(r=>r.id==='REV-atk-3').status === 'cancelled';
      console.log(`  post-check: cancelled = ${cancelled}`);
      console.log(`  FINDING review-cancel-positive-control: accepted=${r.status<400} landed=${cancelled}`);
    }

    // hand-back: WRONG PERSON vs RIGHT PERSON (the named reviewer) on a fresh review
    const changeId4 = 'CHG-atk-4';
    const f4 = await W.unrestricted.json('/api/contracts/MK-A2');
    const bv4 = f4._v; delete f4._v;
    f4.changes.push({ id: changeId4, clauseId: 'c3', status: 'pending', authorSide: 'owner', author: 'Unrestricted Legal', by: 'everything@example.co.ke', createdAt: new Date().toISOString(), seq: 3, oldText:'o', newText:'n', ops:[], round:1 });
    f4.review.requests.push({ id: 'REV-atk-4', status: 'open', changeIds: [changeId4], reviewer: { id: W.users.novalues.id, name: 'No Values Legal' }, byId: W.users.unrestricted.id, by: 'Unrestricted Legal', at: new Date().toISOString() });
    const rSeed4 = await W.unrestricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f4, baseVersion: bv4 } });
    console.log(`\nSEED REV-atk-4: status=${rSeed4.status}`);
    assert.strictEqual(rSeed4.status, 200);
    {
      const f = await W.restricted.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      f.review.requests.find(r=>r.id==='REV-atk-4').status = 'returned';
      const r = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`WRONG PERSON (restricted, not the reviewer=novalues) hands back REV-atk-4: status=${r.status} body=${r.text.slice(0,250)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      console.log(`  post-check: still open = ${after.review.requests.find(r=>r.id==='REV-atk-4').status === 'open'}`);
    }
    {
      const f = await W.novalues.json('/api/contracts/MK-A2');
      const bv = f._v; delete f._v;
      f.review.requests.find(r=>r.id==='REV-atk-4').status = 'returned';
      const r = await W.novalues.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: f, baseVersion: bv } });
      console.log(`RIGHT PERSON (novalues, actual reviewer) hands back REV-atk-4: status=${r.status} body=${r.text.slice(0,250)}`);
      const after = await W.unrestricted.json('/api/contracts/MK-A2');
      const returned = after.review.requests.find(r=>r.id==='REV-atk-4').status === 'returned';
      console.log(`  post-check: returned = ${returned}`);
      console.log(`  FINDING review-return-positive-control: accepted=${r.status<400} landed=${returned}`);
    }

  } finally { await h.stop(); }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
