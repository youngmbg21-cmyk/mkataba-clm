/* f1004 — THE JAMBO RATE LIMITS ARE OFF (the owner, 11 Nov 2026: "Remove rate limits for now").
   The 40-light / 15-deep-per-15-minutes wall was set for a demo or a busy reviewer, before the Board could
   draw; an analyst asking for ranking after ranking is heavier than that, and the wall came back looking like
   a breakdown. A limit of NOUGHT now means no limit, as the daily ceiling has always read 0, and the three
   Jambo window limits default to nought.
     (1) nought is no limit: a run of Jambo calls well past the old wall is never refused with 429
     (2) the money is still guarded: the daily request ceiling and the daily SPEND ceiling keep their numbers
     (3) a limiter with a number of its own still refuses — the sign-in guesses are untouched
     (4) an admin can type 0, and both books say what 0 does */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { startHati, seedWorkspace, Client } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SRV = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');

/* ---------- (1) NOUGHT IS NO LIMIT ---------- */
test('f1004 (1) a run of Jambo calls past the old wall is never refused — red at the parent: 429 at the 41st', async () => {
  const h = await startHati();
  try {
    await seedWorkspace(h, { contracts: [], approvalRules: [] });
    const c = new Client(h.base, 'admin');
    await c.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    /* the limiter runs before the key check, so a workspace with no AI key still proves the wall is down:
       every answer may be a refusal for want of a key — none of them may be 429 */
    const codes = [];
    for (let i = 0; i < 46; i++){
      const r = await c.raw('/api/ai/graph', { method: 'POST', body: { query: 'group by value stream' } });
      codes.push(r.status);
      if (r.status === 429) break;
    }
    assert.ok(!codes.includes(429), '46 calls, none refused for rate: ' + JSON.stringify([...new Set(codes)]));
    assert.equal(codes.length, 46);
  } finally { await h.stop(); }
});

/* ---------- (2) THE MONEY IS STILL GUARDED ---------- */
test('f1004 (2) the daily request ceiling and the daily spend ceiling keep their numbers', () => {
  assert.match(SRV, /const aiDailyLimit = \(\) => intSetting\('aiDailyLimit', 'AI_DAILY_LIMIT', (\d+)\);/);
  assert.ok(Number(SRV.match(/intSetting\('aiDailyLimit', 'AI_DAILY_LIMIT', (\d+)\)/)[1]) > 0, 'the daily request ceiling is still on');
  assert.ok(Number(SRV.match(/numSetting\('aiDailySpendLimit', 'AI_DAILY_SPEND_LIMIT', ([\d.]+)\)/)[1]) > 0, 'the daily SPEND ceiling is still on');
  /* and the three window limits are the ones that went to nought */
  for (const k of ['AI_RATE_LIGHT', 'AI_RATE_DEEP', 'AI_RATE_OCR'])
    assert.match(SRV, new RegExp("intSetting\\('aiRate\\w+', '" + k + "', 0\\)"), k + ' defaults to nought');
});

/* ---------- (3) A LIMITER WITH ITS OWN NUMBER STILL REFUSES ---------- */
test('f1004 (3) wrong sign-in guesses are still counted and still refused', async () => {
  const h = await startHati();
  try {
    const c = new Client(h.base, 'anon');
    let hit = 0, refused = false;
    for (let i = 0; i < 12; i++){
      const r = await c.raw('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'not-the-password-' + i } });
      hit++;
      if (r.status === 429){ refused = true; break; }
    }
    assert.ok(refused, 'the sign-in wall still stands after ' + hit + ' wrong guesses');
  } finally { await h.stop(); }
});

/* ---------- (4) THE ADMIN'S OWN SWITCH ---------- */
test('f1004 (4) an admin may type 0, and both books say what 0 does', () => {
  for (const f of ['aiRateLight', 'aiRateDeep', 'aiRateOcr'])
    assert.match(SRV, new RegExp("setNum\\('" + f + "', \\w+, 0\\);"), f + ' takes 0');
  const ST = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
  for (const id of ['ai-rate-light', 'ai-rate-deep', 'ai-rate-ocr']){
    const line = ST.split('\n').find(l => l.includes("stLimitField('" + id + "'"));
    assert.ok(line && /,\s*0\)\}?\s*$/.test(line.trim()), id + "'s box allows 0: " + (line || 'no line').trim());
  }
  const I = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
  for (const k of ['set_lim_light_sub', 'set_lim_deep_sub', 'set_lim_ocr_sub']){
    const lines = I.split('\n').filter(l => l.includes(k + ':'));
    assert.equal(lines.length, 2, k + ' is in both books');
    assert.match(lines[0], /0 turns it off/, k + ' says so in English');
    assert.match(lines[1], /0 stänger av den/, k + ' says so in Swedish');
  }
});
