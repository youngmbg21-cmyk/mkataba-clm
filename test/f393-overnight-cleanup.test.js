/* ============================================================
   F393 — THE OVERNIGHT CLEAN-UP (Young asked 26 Sep 2026: "review the entire
   platform for performance and functionality bugs that needs cleaning up …
   Check all the presses, the pops ups, the loading, among other possibilities
   … then whatever bugs you find, fix them. Also review the process flows and
   fix any processes flaws.")
   ============================================================
   One section per defect found and fixed that night. Each section names what
   the owner or the audit SAW, and pins the reading that fixes it. The pixels
   — what is drawn on top of what — are the browser files' to measure (named
   in each section); this file pins the readings and the walls, and every
   claim here is red at the parent (790b4d5) except the ones marked [wall] or
   [control].
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => { try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); } catch (_) { return ''; } };
const CT = read('js/views/contract.js');
const HTML = read('index.html');

/* The region of one top-level function, by its own boundary (never a byte
   count): from its declaration to the next top-level declaration. */
function region(src, name) {
  const m = new RegExp('(?:^|\\n)(?:async )?function ' + name + '\\(').exec(src);
  if (!m) return '';
  const from = m.index;
  const rest = src.slice(from + 1);
  const next = /\n(?:async )?function [A-Za-z_$][\w$]*\(|\nconst [A-Za-z_$][\w$]*=|\nlet [A-Za-z_$][\w$]*=|\nObject\.assign\(window/.exec(rest);
  return next ? src.slice(from, from + 1 + next.index) : src.slice(from);
}
/* Code only: a claim must never pass against a comment that describes it. */
const code = s => String(s || '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

/* ==========================================================================
   (1) PLAIN ENGLISH — NOTHING IS DRAWN ON TOP OF ANYTHING ELSE
   "when the translation to plain English comes up, the words reading still
   display beneath the translation so they are on top of each other."
   The mirror stopped at the first PAIRED clause; a later page of a long
   contract lands first, so the wording of every clause above it was copied in
   and a "Reading…" drawn over each. And a long preamble, copied into a column
   narrower than the paper, ran under the first reading.
   Pixels: plain-english-no-overlap-verify (5 of 12 red at the parent).
   ========================================================================== */
describe('f393 (1) Plain English — one walk, an honest boundary, no overlap', () => {
  const PAINT = () => code(region(CT, 'docReadPaint'));
  const FRONT = () => code(region(CT, 'docReadFront'));

  test('the mirror stops at the first clause ON THE PAPER, never the first one read', () => {
    const f = FRONT();
    assert.match(f, /function docReadFront\(c,rows\)/, 'it is handed the rows of the sheet');
    assert.match(f, /const first=Array\.isArray\(rows\)\?rows\.find\(r=>r&&r\.el\):null;/);
    assert.match(f, /const stop=first\.el;/, 'the boundary is that row\'s own element');
    assert.ok(!/pairs\[0\]/.test(f), 'and never the first PAIRED clause');
  });

  test('the painter walks the sheet ONCE and hands that walk to all four readers', () => {
    const p = PAINT();
    assert.equal((p.match(/docReadSheet\(c\)/g) || []).length, 1, 'one walk of the canvas per paint');
    assert.match(p, /const pairs=docReadAnchors\(c, docReadItems\(c\), sheet\);/, 'the pairing reads it');
    assert.match(p, /const front=docReadFront\(c,sheet\);/, 'the mirror reads it');
    assert.match(p, /sheet\.forEach\(\(row,k\)=>\{ if\(row&&row\.el&&!got\.has\(k\)\) waits\.push/, 'the clauses still to come read it');
    assert.match(p, /moved=Math\.max\(0,sheet\.filter/, 'and so does the "moved" count');
  });

  test('docReadAnchors still walks for itself when no sheet is handed over', () => {
    const a = code(region(CT, 'docReadAnchors'));
    assert.match(a, /const list=Array\.isArray\(sheet\)\?sheet:docReadSheet\(c\);/,
      'every other caller (the X-ray panel) keeps what it has always had');
  });

  test('the copied front matter is cut at a whole line above the first clause, and fades', () => {
    const p = PAINT();
    assert.match(p, /const firstTop=firstRow\?Math\.round\(firstRow\.el\.getBoundingClientRect\(\)\.top - base\):null;/,
      'the limit is the first clause\'s own top, in the column\'s coordinates');
    assert.match(p, /const limit=firstTop-4;/);
    assert.match(p, /const keep=x\.lh>0\?Math\.floor\(room\/x\.lh\)\*x\.lh:room;/, 'a WHOLE line, never half a glyph');
    assert.match(p, /x\.el\.classList\.add\('is-cut'\)/, 'and the cut is marked');
    assert.match(HTML, /\.doc-read-mirror\.is-cut\{[^}]*mask-image:linear-gradient/, 'a cut copy fades rather than stopping on a hard edge');
  });

  /* ---- AND A REPAINT NO LONGER STALLS THE PAGE ----
     MEASURED on a 300-clause contract: ~550ms a repaint, ~510ms of it the
     placing loop forcing a fresh layout for every entry; the column repaints
     every 1.5s while a reading runs. Now ~90ms. */
  test('every top and height is READ before any top is WRITTEN — one layout, not one per entry', () => {
    const p = PAINT();
    assert.ok(!/const place=/.test(p), 'the one-at-a-time placer is gone');
    const reads = p.indexOf('x.h=x.el.offsetHeight;');
    const writes = p.indexOf("seq.forEach(x=>{ x.el.style.top=x.top+'px'; });");
    assert.ok(reads > 0 && writes > reads, 'all the reads, then all the writes');
    assert.match(p, /if\(inFront&&!x\.front\)\{ inFront=false; floor=0; \}/,
      '[control] and the mirror still never pushes a reading down (the 15 Sep ruling)');
  });

  test('a row holds another exactly when it holds the NEXT one — one pass, not every pair', () => {
    const sh = code(region(CT, 'docReadSheet'));
    assert.match(sh, /rows=rows\.filter\(\(r,i\)=>!\(rows\[i\+1\]&&r\.el\.contains\(rows\[i\+1\]\.el\)\)\);/);
    assert.ok(!/rows\.some\(\(o,j\)=>j!==i&&r\.el\.contains/.test(sh), 'the every-pair check is gone');
    const fr = code(region(CT, 'docReadFront'));
    assert.match(fr, /els=els\.filter\(\(el,i\)=>!\(els\[i\+1\]&&el\.contains\(els\[i\+1\]\)\)\);/);
  });

  test('the "moved" signature is taken off the walk the painter already made', () => {
    assert.match(PAINT(), /const sig=running\?'':docReadSig\(c,sheet\);/);
    const sig = code(region(CT, 'docReadSig'));
    assert.match(sig, /const rows=Array\.isArray\(sheet\)\?sheet:docReadClauses\(c\);/,
      '[wall] and every other caller still signs exactly what is sent');
  });

  test('[wall] the reading sent to the route does not move by a byte', () => {
    const sent = code(CT.slice(CT.indexOf('const docReadClauses='), CT.indexOf('\n', CT.indexOf('const docReadClauses='))));
    assert.match(sent, /docReadSheet\(c\)\.map\(r=>\(\{num:r\.num,heading:r\.heading,text:r\.text,kind:r\.kind\}\)\)/,
      'docReadClauses is untouched, so no reading already paid for is asked again');
  });
});

/* ==========================================================================
   (2) THE SERVER'S WALLS, MET BY A REAL REQUEST
   Each of these was measured by sending the request, and each is asked the
   same way here — never by reading the route's source.
   ========================================================================== */
describe('f393 (2) the server refuses what it should, and keeps what it should', () => {
  const { before, after } = require('node:test');
  const { startHati, seedWorkspace, nameASigner } = require('./helpers');
  let h, W;
  const payloadFor = (id, name, purpose) => ({ kind: 'hati-share', purpose, purposeChosen: purpose,
    org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
    contract: { id, name, docText: 'Article 1\n\nAgreed wording.' } });
  const put = async (client, id, patch) => {
    const full = await W.admin.json('/api/contracts/' + id);
    const baseVersion = full._v; delete full._v;
    const next = typeof patch === 'function' ? patch(full) : { ...full, ...patch };
    return client.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: next, baseVersion } });
  };
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { if (h) await h.stop(); });

  test('2a a link bound to one signer is refused to another address', async () => {
    const row = await nameASigner(W.admin, 'MK-A2');
    const r = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2', 'Raw Milk Collection', 'sign'), channel: 'email',
      recipient: { name: 'Somebody Else', email: 'somebody@else.example' }, expiryDays: 30,
      durable: false, purpose: 'sign', signerId: row.id } });
    assert.equal(r.status, 409, 'the row is what a signature is recorded against: ' + r.text.slice(0, 160));
    const ok = await W.admin.raw('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2', 'Raw Milk Collection', 'sign'), channel: 'email',
      recipient: { name: row.name, email: row.email }, expiryDays: 30,
      durable: false, purpose: 'sign', signerId: row.id } });
    assert.equal(ok.status, 200, '[control] the signer\'s own address is issued: ' + ok.text.slice(0, 160));
  });

  test('2b a signature image that is not an image is refused as one, on the public route', async () => {
    const mint = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-B2', 'Retail Supply — Coast', 'negotiate'), channel: 'link',
      recipient: { name: 'Naivas', email: 'legal@naivas.example' }, durable: true, purpose: 'negotiate' } });
    const token = mint.token || String(mint.link || '').split('share=')[1].replace(/^t:/, '');
    const r = await h.client('guest').raw('/api/shares/' + token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', v: 1, id: 'MK-B2', action: 'sign', name: 'Guest', email: 'legal@naivas.example',
      at: new Date().toISOString(), signatureImage: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+' } });
    assert.equal(r.status, 400, r.text.slice(0, 160));
    assert.match(r.text, /signature image/i, 'refused for what it is, before anything else is asked');
  });

  test('2c a revoked signing link cannot make the server send a signing code', async () => {
    const row = { id: 'sg-cp-1', name: 'Grace Njeri', email: 'grace@client.co.ke' };
    const mint = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-A2', 'Raw Milk Collection', 'sign'), channel: 'email',
      recipient: { name: row.name, email: row.email }, expiryDays: 30, durable: false,
      purpose: 'sign', signerId: row.id } });
    const token = mint.token || String(mint.link || '').split('share=')[1].replace(/^t:/, '');
    await W.admin.json('/api/shares/' + token + '/revoke', { method: 'POST', body: {} });
    const r = await h.client('guest2').raw('/api/shares/' + token + '/otp', { method: 'POST', body: { email: row.email } });
    assert.equal(r.status, 410, r.text.slice(0, 160));
  });

  test('2d a browser\'s per-sitting marks are never stored on the record', async () => {
    const r = await put(W.admin, 'MK-A2', c => ({ ...c, _messages: [{ id: 'm1', text: 'hi' }], _triaging: true, _msgFetch: 1 }));
    assert.equal(r.status, 200, r.text.slice(0, 160));
    const back = await W.admin.json('/api/contracts/MK-A2');
    assert.ok(!('_messages' in back) && !('_triaging' in back) && !('_msgFetch' in back),
      'read back without them: ' + Object.keys(back).filter(k => k.startsWith('_')).join(','));
  });

  test('2e a hold on an UNSIGNED contract is refused to a member without the grant', async () => {
    const r = await put(W.unrestricted, 'MK-A2', c => ({ ...c,
      hold: { at: new Date().toISOString(), by: 'Unrestricted Legal', why: 'A dispute' } }));
    assert.equal(r.status, 403, 'the guard used to sit inside the half-signed branch only: ' + r.text.slice(0, 160));
  });

  test('2f a change an open internal review covers cannot be discarded by a save', async () => {
    const at = new Date().toISOString();
    const withReview = await put(W.admin, 'MK-A2', c => ({ ...c,
      changes: [{ id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Clause 1', changeType: 'modify', status: 'pending',
        summary: 'Narrowed', oldText: 'a', newText: 'b', author: 'Amina Otieno', authorSide: 'owner', createdAt: at }],
      review: { requests: [{ id: 'RV-1', status: 'open', changeIds: ['CHG-001'], by: 'Amina Otieno', byId: null,
        reviewer: { name: 'Unrestricted Legal' }, at }] } }));
    assert.equal(withReview.status, 200, 'STAGE: ' + withReview.text.slice(0, 160));
    const r = await put(W.admin, 'MK-A2', c => ({ ...c, changes: [] }));
    assert.equal(r.status, 403, r.text.slice(0, 200));
    assert.match(r.text, /internal review/);
  });

  test('2g a template filed under one of the company\'s own categories keeps it', async () => {
    await W.admin.json('/api/settings/filing', { method: 'PUT', body: {
      templateCategories: [{ id: 'cat-energy', name: 'Energy supply' }] } });
    const r = await W.admin.json('/api/templates', { method: 'POST', body: { name: 'Power purchase', category: 'cat-energy' } });
    const id = (r.template && r.template.id) || r.id || r.templateId;
    const list = await W.admin.json('/api/templates');
    const t = (list.templates || list || []).find(x => x && x.id === id);
    assert.ok(t, 'STAGE: the template is listed');
    assert.equal(t.category, 'cat-energy', 'it was filed as Other, silently');
  });

  test('2h the admin\'s sweep of unused files is reachable', async () => {
    await W.admin.json('/api/files', { method: 'POST', body: { name: 'loose.pdf', mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0=' } });
    const r = await W.admin.raw('/api/files/orphans');
    assert.equal(r.status, 200, 'it was answered by the file route with id "orphans": ' + r.text.slice(0, 120));
    assert.ok(Array.isArray(r.json && r.json.orphans) && r.json.orphans.length >= 1);
  });

  test('2i a document that arrives by email can be opened', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { mailroom: { key: 'k'.repeat(32) } } });
    const on = await h.client('mail').raw('/api/mailroom', { method: 'POST',
      headers: { 'x-hati-mailroom-key': 'k'.repeat(32) }, body: { from: 'a@b.example', subject: 'Contract',
        attachments: [{ filename: 'nda.pdf', contentType: 'application/pdf', content: Buffer.from('%PDF-1.4 test').toString('base64') }] } });
    assert.equal(on.status, 200, 'STAGE: the mailroom is switched on and takes the document: ' + on.text.slice(0, 160));
    const id = on.json.ids[0];
    const c = await W.admin.json('/api/contracts/' + id);
    assert.ok(c.upload && c.upload.fileId, 'the bytes are where every other upload\'s are: ' + JSON.stringify(Object.keys(c.upload || {})));
    assert.equal(c.upload.fileName, 'nda.pdf', 'and the name is where the room reads it');
    const f = await W.admin.json('/api/files/' + c.upload.fileId);
    assert.match(String(f.dataUrl || ''), /^data:application\/pdf;base64,/);
  });

  test('2j a deleted contract takes its cached Plain English edition with it', async () => {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(require('node:path').join(h.dataDir, 'hati.db'));
    db.prepare('INSERT OR REPLACE INTO clause_readings (contract_id,json,created_at) VALUES (?,?,?)')
      .run('MK-B2', '{"items":[]}', new Date().toISOString());
    const del = await W.admin.raw('/api/contracts/MK-B2', { method: 'DELETE' });
    assert.equal(del.status, 200, 'STAGE: ' + del.text.slice(0, 120));
    const left = db.prepare('SELECT COUNT(*) n FROM clause_readings WHERE contract_id=?').get('MK-B2');
    db.close();
    assert.equal(Number(left.n), 0, 'the reading of a deleted contract stayed behind');
  });
});

/* ==========================================================================
   (3) POP-UPS — ONE ESCAPE, THE RIGHT FOCUS, A QUESTION ALWAYS ANSWERED
   Measured in a browser: twenty dialogs left twenty Escape listeners; a side
   panel replaced by a guarded dialog let Escape close that dialog straight
   past its "Discard these changes?"; after "Keep editing" Escape stopped
   working; a dialog replaced by another dropped focus on <body>.
   Pixels and presses: the overnight probes (probe-popups, probe-esc-guard).
   ========================================================================== */
describe('f393 (3) pop-ups', () => {
  const CORE = read('js/core.js');
  test('the dialog layer has ONE Escape, owned by one setter', () => {
    assert.match(CORE, /function rootEscSet\(fn\)\{/);
    const om = code(region(CORE, 'openModal'));
    assert.match(om, /rootEscSet\(function\(e\)\{/, 'openModal hands its Escape to the setter');
    assert.ok(!/document\.addEventListener\('keydown'/.test(om), 'and adds no listener of its own');
    const sp = code(region(CORE, 'openSidePanel'));
    assert.match(sp, /rootEscSet\(function\(e\)\{/, 'so does the side panel, which shares the root');
    assert.match(code(region(CORE, 'closeModal')), /rootEscSet\(null\);/, 'and closing takes it off');
  });
  test('a declined "Discard these changes?" leaves Escape armed', () => {
    const om = code(region(CORE, 'openModal'));
    assert.ok(!/removeEventListener\('keydown',esc\); closeModalGuarded\(\)/.test(om),
      'the old handler took itself off BEFORE asking the question');
    assert.match(om, /if\(document\.querySelector\('\[data-top-overlay\]'\)\) return;\s*closeModalGuarded\(\);/);
  });
  test('a dialog replacing another keeps the first one\'s opener, and the trap is handed it', () => {
    const om = code(region(CORE, 'openModal'));
    const opener = om.indexOf('const opener=(replacing && _modalOpener) || document.activeElement;');
    assert.ok(opener > -1 && opener < om.indexOf('root.innerHTML='), 'read before the old panel is torn out');
    assert.match(om, /_modalRelease = trapFocus\(panel, \{ opener \}\)/);
  });
  test('a question replaced by another is answered, never left hanging', () => {
    assert.match(code(region(CORE, 'confirmDialog')), /prev\._settle\(false\)/);
    assert.match(code(region(CORE, 'promptDialog')), /prev\._settle\(null\)/);
  });
  test('a report dialog keeps its lines and offers one way out', () => {
    const cd = code(region(CORE, 'confirmDialog'));
    assert.match(cd, /opts\.cancelLabel===''\?'':/, 'an explicit empty Cancel draws none');
    assert.match(cd, /white-space:pre-line/, 'and `multiline` keeps the message\'s own breaks');
    assert.match(read('js/family.js'), /confirmLabel:i18t\('ct_close'\)\|\|'Close', cancelLabel:''/,
      'the family check asks for both under names the dialog reads');
  });
  test('every confirm names its button with the option the dialog reads', () => {
    for (const f of ['js/views/home.js', 'js/views/contract.js', 'js/family.js']) {
      const s = code(read(f));
      assert.ok(!/confirmDialog\(\{[^}]*\b(confirm|okText|confirmText|cancelText):/.test(s), f + ' passes a name confirmDialog ignores');
    }
  });
  test('Escape belongs to the top layer on the drawer too, and a phone sheet answers it', () => {
    const app = code(read('js/app.js'));
    assert.match(app, /if\(document\.querySelector\('\[data-top-overlay\]'\)\) return;/);
    const mob = read('js/mobile.js');
    assert.match(mob, /document\._mSheetEscWired=true;/);
    assert.match(code(mob), /if\(document\.querySelector\('#modal-root \[role="dialog"\]'\)\) return;\s*e\.preventDefault\(\);\s*mCloseSheet\(\);/);
  });
  test('removing a party asks a question, and its button says what it does', () => {
    const s = code(read('js/views/contract.js'));
    assert.match(s, /message:i18t\('py_remove_q',\{name:gone\.name\|\|'—'\}\), confirmLabel:i18t\('py_remove'\)/);
    const I = read('js/i18n.js');
    assert.equal((I.match(/\n    py_remove_q: '/g) || []).length, 2, 'in both books');
  });
});

/* ==========================================================================
   (4) THE OTHER SIDE'S PAGE REMEMBERS WHAT IT SENT
   Measured: accept, send, reload before the owner collects it — the card was
   "Awaiting you" again, a second, different answer went on top of the first,
   and the change ended rejected with two "decided" lines on the trail.
   ========================================================================== */
describe('f393 (4) their page', () => {
  const P = read('js/views/portal.js');
  test('sent answers and withdrawals are kept per link beside the held ones', () => {
    assert.match(P, /const PORTAL_SENT_KEY = t => `hati\.negoSent\.\$\{t\}`;/);
    assert.match(code(region(P, 'portalLoadHeld')), /portalLoadSent\(\);/, 'loaded wherever held answers are');
    assert.match(code(P), /portalDropHeld\(\);\s*portalSaveSent\(\);/, 'and written the moment they go');
  });
  test('once the server says the last answer was applied, the link IS the record', () => {
    assert.match(code(region(P, 'portalLoadSent')), /if\(lr && lr\.applied===true\)\{ localStorage\.removeItem\(PORTAL_SENT_KEY\(t\)\); return; \}/);
  });
  test('a sent answer the record now carries is let go', () => {
    assert.match(code(region(P, 'portalNegoContract')), /if\(f===undefined \|\| \(sent && f===sent\.status\)\)\{ delete PORTAL_NEGO_SENT\[id\]; moved=true; \}/);
  });
  test('the bell is repainted in the same breath as the send', () => {
    assert.match(code(P), /wirePortalNego\(fresh, p\);[^\n]*\n\s*if\(window\.portalPaintAlerts\) try\{ portalPaintAlerts\(fresh, p\); \}catch\(_\)\{\}/);
  });
  test('their decision buttons are a thumb high on a phone', () => {
    assert.match(read('js/mobile-portal.js'), /\.pw-page \.rl-card-verbs > button, \.pw-page \.rl-open-btn,\s*\n\s*\.pw-page \.rl-unsent-go, \.pw-page \.rl-send\{\s*\n\s*min-height:44px!important;/);
  });
});

/* ==========================================================================
   (5) THE CONTRACT ROOM
   ========================================================================== */
describe('f393 (5) the contract room', () => {
  test('the header follows an Overview edit — a paint, never a rebuild', () => {
    const r = code(region(CT, 'roomHeadRefresh'));
    assert.match(r, /roomHeadTitle\(c\)/);
    assert.match(r, /roomFactsHtml\(c\)/);
    assert.match(r, /if\(facts\.classList\.contains\('is-folded'\)\) nf\.classList\.add\('is-folded'\)/, 'the reader\'s fold is kept');
    const wk = code(region(CT, 'wireKeyTerms'));
    assert.equal((wk.match(/persist\(c\); renderAuditSection\(c\);\s*roomHeadRefresh\(c\);/g) || []).length, 2,
      'both of the Overview\'s writers call it');
  });
  test('removing an obligation from the Checks card asks first — the one act', () => {
    const s = code(region(read('js/obligations.js'), 'renderObligationsSection'));
    assert.match(s, /\[data-ob-del\][\s\S]*obligationRemove\(c, Number\(b\.getAttribute\('data-ob-del'\)\)\)/);
    assert.ok(!/obs\.splice\(/.test(s), 'no splice of its own');
  });
  test('the fill counter repaints in its own words and ink', () => {
    const s = code(region(CT, 'paintBlankFormCount'));
    assert.match(s, /i18t\('bf_count_of', \{ filled: all - open, all \}\)/);
    assert.ok(!/st-amber-fg/.test(s), 'not amber on the first keystroke');
  });
  test('the arrival strip does not tick "filled in" over fields still open', () => {
    const t = code(read('js/triage.js'));
    assert.match(t, /if \(fl\.ok && left > 0 && !fillNone\)\{/);
    assert.match(t, /if \(open && open\.length\) fillNone = 'form';/);
    const I = read('js/i18n.js');
    assert.ok(!/tri_fill_upload: 'This is an uploaded document — HaTi cannot read its blanks yet\.'/.test(I),
      'and the upload sentence no longer says HaTi cannot read blanks it reads');
  });
  test('the room\'s More menu and the brief card listen once, not once per paint', () => {
    assert.match(code(region(CT, 'wireRoomHead')), /document\._wsMoreOutsideWired/);
    assert.match(code(CT), /dataset\.ktBriefBound/);
  });
  test('a slow reading lands on its own contract', () => {
    assert.match(read('js/core.js'), /function contractOnScreen\(c\)\{/);
    assert.ok((code(CT).match(/contractOnScreen\(/g) || []).length >= 3, 'asked by the brief, the checks and the triage');
  });
});

/* ==========================================================================
   (6) THE READER'S OWN LANGUAGE
   ========================================================================== */
describe('f393 (6) words in the reader\'s language', () => {
  const I = read('js/i18n.js');
  const both = k => (I.match(new RegExp('\\n    ' + k + ": '", 'g')) || []).length === 2;
  test('the History tab\'s filters', () => {
    const h = code(region(CT, 'roomHistoryFiltersHtml'));
    assert.ok(!/sel\('clauseId','Clause'/.test(h) && !/'Round '\+e\.round/.test(h) && !/\['accepted','Accepted'\]/.test(h));
    for (const k of ['ct_hf_clause', 'ct_hf_person', 'ct_hf_side', 'ct_hf_outcome', 'ct_hf_withdrawn']) assert.ok(both(k), k);
  });
  test('the focus-mode chip and button', () => {
    assert.match(code(region(CT, 'wsFocusChip')), /chip\.innerHTML=i18t\('ng_exit_focus'\);/);
    assert.ok(!/'Enter focus mode'/.test(read('js/views/negotiation.js')));
  });
  test('how often an obligation repeats', () => {
    const O = read('js/obligations.js');
    assert.match(O, /function obRecurLabel\(k\)\{/);
    assert.ok(!/\(OBLIG_RECUR\.find\(r=>r\[0\]===o\.recurring\)\|\|\[\]\)\[1\]/.test(O), 'the frozen English is not printed');
    assert.ok(both('ob_recur_none'));
  });
  test('the phone\'s approvals screen', () => {
    const M = code(read('js/mobile-screens.js'));
    assert.ok(!/'Requested by'|'All caught up'|waiting on your sign-off`/.test(M));
    for (const k of ['m_appr_requested_by', 'm_since_today', 'm_all_caught_up']) assert.ok(both(k), k);
  });
  test('a ruled line\'s LABEL drops a stray bracket and a list marker; its KEY does not move', () => {
    const U = read('js/uploadblanks.js');
    const n = Number(/const UP_LEAD_WORDS = (\d+)/.exec(U)[1]);
    const name = new Function('UP_LEAD_WORDS', /function upLeadName\(before\)\{[\s\S]*?\n\}/.exec(U)[0] + ';return upLeadName;')(n);
    const lead = new Function('UP_LEAD_WORDS', /function upLead\(before\)\{[\s\S]*?\n\}/.exec(U)[0] + ';return upLead;')(n);
    assert.equal(name('the Company (registration number '), 'registration number');
    assert.equal(name('(a) Address: '), 'Address');
    assert.equal(lead('the Company (registration number '), 'the Company (registration number',
      '[wall] the key reading is untouched, so an answer already typed is found again');
  });
});

/* ==========================================================================
   (7) THE SERVER'S READINGS, FILES AND LIMITS
   ========================================================================== */
describe('f393 (7) server readings', () => {
  const S = read('server/server.js');
  test('a file read asks only the contracts that can hold the file', () => {
    const f = code(region(S, 'fileInScope'));
    assert.match(f, /SELECT json, folder FROM contracts WHERE json LIKE \?/);
    assert.match(f, /: db\.prepare\('SELECT json, folder FROM contracts'\)\.all\(\);/, 'with the whole walk kept for any other shape of id');
  });
  test('the sweep of unused files is registered before the file route', () => {
    assert.ok(S.indexOf("app.get('/api/files/orphans'") < S.indexOf("app.get('/api/files/:id'"));
  });
  test('an executed upload\'s email reads its file where a server keeps it', () => {
    const e = code(region(S, 'executedAttachment'));
    assert.match(e, /if \(!src && c\.upload\.fileId\) \{ const f = hoFileRow\(c\.upload\.fileId\);/);
    assert.match(e, /c\.upload\.fileName \|\| c\.upload\.name/);
  });
  test('the mailroom counts against the storage ceiling, and says so when full', () => {
    assert.match(S, /skipped\.push\(\{ name, why: 'document storage is full' \}\); continue; \}/);
  });
  test('a daily limit holds for a day: each bucket remembers its window, and the sweep keeps it', () => {
    assert.match(S, /const rlWindows = new Map\(\);/);
    assert.match(S, /rlNoteWindow\(bucket \+ ':', windowMs\)/);
  });
});

/* ==========================================================================
   (8) HOME AND THE APPROVALS PAGE
   ========================================================================== */
describe('f393 (8) Home', () => {
  const H = read('js/views/home.js');
  test('a review is overdue by the reader\'s own day, and the day prints as a day', () => {
    assert.ok(!/String\(x\.rv\.due\)<new Date\(\)\.toISOString\(\)\.slice\(0,10\)/.test(H), 'not the UTC day');
    assert.match(H, /tag:x\.rv\.due\?fmtDDay\(String\(x\.rv\.due\)\):i18t\('rv_home_open'\)/);
  });
  test('a contract ready to sign with nothing in the way is still on the list', () => {
    assert.match(code(read('js/views/approvalsview.js')), /i18t\('ap_pg_ready_to_sign'\)/);
    assert.match(code(H), /home_sign_row_ready/);
  });
});

/* ==========================================================================
   (9) A LOOK AT THE TRAIL MAY NOT UNDO AN EDIT, AND THE OUTBOX IS NOT A FAILURE
   The Inspector asked the server for a light row's trail — and the loader it
   used, ensureFull, copies the server's WHOLE record over the one on screen:
   a category set a moment before was gone the instant the panel asked for its
   history, and a status set a moment before read back as the stored one
   (measured: register-category-verify and home-page-verify 3c). The loader is
   the product's own inverse of the list's stripper, which fills in only what
   the list left out. And a turn notice kept in the outbox (no email provider)
   printed "EMAIL FAILED" — the outbox is honest delivery, not failure.
   Pixels: register-category-verify, home-page-verify 3c, sign-links-verify 4.
   ========================================================================== */
describe('f393 (9) the trail loaders, and the outbox', () => {
  const INS = read('js/views/inspector.js');
  const OB = read('js/obligations.js');
  const AP = read('js/approvals.js');
  test('the Inspector asks for a light row\'s trail, not "nothing recorded yet"', () => {
    assert.match(code(region(INS, 'insLatest')), /\(c\._light && !c\._loaded\)\) return null;/);
  });
  test('and loads it with restoreHeavyFields, which leaves an unsaved change alone', () => {
    const p = code(region(INS, 'insPaintPanel'));
    assert.match(p, /const load = \(typeof restoreHeavyFields === 'function'\) \? restoreHeavyFields/);
    assert.match(p, /\.then\(\(\) => load\(c\)\)/);
    assert.ok(!/\.then\(\(\) => ensureFull\(c\)\)/.test(p), 'never the loader that copies the whole record over');
  });
  test('and that loader also brings what only the single-record route carries — the brief, the edition, who approves', () => {
    /* It marks the record loaded, after which the room never asks again:
       measured, a contract chosen in the list opened with no brief. */
    const r = code(region(read('js/core.js'), 'restoreHeavyFields'));
    assert.match(r, /k\.charAt\(0\)==='_' && k!=='_v' && k!=='_light' && k!=='_loaded' && c\[k\]===undefined\) c\[k\]=full\[k\];/);
    assert.ok(r.indexOf("c[k]=full[k]") < r.indexOf('c._loaded=true'), 'copied before the record is called loaded');
  });
  test('the obligation history loads the same way', () => {
    assert.match(code(OB), /const load = \(typeof restoreHeavyFields === 'function'\) \? restoreHeavyFields/);
    assert.ok(!/\.then\(\(\) => ensureFull\(c\)\)\.then\(\(\) => paintHist\(null\)\)/.test(code(OB)));
  });
  test('a turn notice kept in the outbox is its own state, not a failure', () => {
    assert.match(code(region(AP, 'signerNoticeState')), /mine\.some\(n=>n\.outbox\) \? 'outbox' : 'notify-failed'/);
  });
  test('the route says so, and keeps the door to send it again', () => {
    const r = code(region(AP, 'signerRouteHtml'));
    assert.match(r, /nst==='outbox' \? tag\('bg-slate-100 text-ink\/50','IN OUTBOX'\)/);
    assert.match(r, /\['notified','notify-failed','untold','outbox'\]\.includes\(nst\)/);
  });
});
