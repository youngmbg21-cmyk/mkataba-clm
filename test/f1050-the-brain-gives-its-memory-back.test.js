'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f1050 — THE BRAIN GIVES ITS MEMORY BACK (owner-reported 14 Nov 2026: on the
   Brain page "the whole platform breaks", then Render's 502 Bad Gateway)

   GET /api/brain reads HaTi's own code on the first visit after a start. Read
   on the server's own thread, that left about 100 MB in the process for good
   (the kept map's names were cut from the files, and a cut name holds its
   whole file) — on a 512 MB host, enough to be stopped and restarted. A worker
   now reads the code, hands back the answer as text and ends.

   (1) THE SERVER DOES NOT KEEP THE READ: after the Brain is opened and things
       settle, the server's memory has grown by less than KEEP_MB. At the
       parent it grew ~98 MB; after, ~28 MB. Measured off /proc, so it is
       asked only where /proc exists (GitHub's machines have it).
   (2) THE ANSWER IS UNCHANGED: parts, links, the count of published names and
       the line count equal a plain reading of the same files.
   (3) TWO PEOPLE AT ONCE SHARE ONE READ, and the second visit is from memory.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const B = require('../js/brainmap.js');

const KEEP_MB = 60;

function codeFiles(){
  const out = {};
  const walk = rel => {
    for (const e of fs.readdirSync(path.join(ROOT, rel), { withFileTypes: true })){
      const r = rel + '/' + e.name;
      if (e.isDirectory()) walk(r);
      else if (e.name.endsWith('.js')) out[r] = fs.readFileSync(path.join(ROOT, r), 'utf8');
    }
  };
  walk('js'); walk('server');
  return out;
}
const rssMB = pid => { try { return Number(/VmRSS:\s+(\d+)/.exec(fs.readFileSync('/proc/' + pid + '/status', 'utf8'))[1]) / 1024; } catch (_) { return null; } };
const settle = ms => new Promise(r => setTimeout(r, ms));

describe('f1050 the Brain gives its memory back', () => {
  test('(1) the read is not kept, (2) the answer is unchanged, (3) one read is shared', { timeout: 120000 }, async () => {
    const { startHati, Client } = require('./helpers');
    const h = await startHati({ HATI_DATA: fs.mkdtempSync(path.join(os.tmpdir(), 'hati-brainmem-')) });
    try {
      const admin = new Client(h.base, 'admin');
      await admin.json('/api/setup', { method: 'POST', body: { org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke', password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
      await admin.json('/api/status');
      await settle(300);
      const before = rssMB(h.proc.pid);

      const [r, r2] = await Promise.all([admin.json('/api/brain'), admin.json('/api/brain')]);
      await settle(1500);
      const after = rssMB(h.proc.pid);

      /* (2) */
      const files = codeFiles();
      const want = B.brainRead(files);
      assert.deepEqual(r.parts, want.parts, 'every part where a plain reading finds it');
      assert.deepEqual(r.edges, want.edges, 'every link a plain reading makes');
      assert.deepEqual(r.flowGaps, want.flowGaps);
      assert.equal(r.published, want.published.length, 'the published names are counted, as before');
      let lines = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').split('\n').length;
      for (const f in files) lines += files[f].split('\n').length;
      assert.equal(r.stack.lines, lines, 'the lines are counted by the same reader, and add up the same');

      /* (3) */
      assert.deepEqual(r2.parts, r.parts, 'two people opening the Brain together get one answer');
      assert.equal(r2.builds.length, 1, 'and one reading is kept, not two');
      const t0 = Date.now(); await admin.json('/api/brain');
      assert.ok(Date.now() - t0 < 1000, 'the second visit is answered from memory');
      assert.ok(!/reading here instead/.test(h.log()), 'the reader beside the server did the work: ' + h.log().slice(-400));

      /* (1) */
      if (before != null && after != null)
        assert.ok(after - before < KEEP_MB, 'opening the Brain left ' + Math.round(after - before) + ' MB in the server (limit ' + KEEP_MB + ' MB): the code\'s text is being kept');
    } finally { await h.stop(); }
  });
});
