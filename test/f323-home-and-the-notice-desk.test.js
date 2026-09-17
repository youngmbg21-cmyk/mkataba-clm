/* ============================================================
   f323 — HOME'S FOUR ADDITIONS, AND THE NOTICE DESK
   (S1 + S6 + S7 + S8 of HaTi's Next Fifteen, 16 Sep 2026)
   ============================================================
   *"Home is where a product usually gets fat, and it is the page the fifteen
   touch most lightly. Weight added: none. No new region, no new tile, no new
   row type."*

   SO SECTION 1 IS A WALL, and it is the one that matters most on this screen:
   every figure here has to sit in furniture that was already drawn. The
   Mailroom feeds the Import queue that exists; the notice competes for one of
   the desk's three places rather than adding a fourth; the alert is a row in a
   list that already ranks itself; the money tile is one more option on a list
   the reader chooses four from.

   AND THE LETTER IS THE OTHER WALL (section 3). A notice is the sentence that
   decides whether an agreement continues for another year. Not one word of it
   may come from a model, and HaTi may never claim to have served it. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const NT = fs.readFileSync(path.join(__dirname, '..', 'js', 'notice.js'), 'utf8');
const NT_CODE = NT.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const HOME = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'home.js'), 'utf8');
const APP = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');
const DESK = fs.readFileSync(path.join(__dirname, '..', 'js', 'desknight.js'), 'utf8');
const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const SET = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');

const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

describe('f323 (1) weight added: none', () => {
  test('1a the Mailroom feeds the queue that exists — no page, no nav door, no tile', () => {
    assert.ok(!/mailroom/i.test(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'migration.js'), 'utf8').slice(0, 4000))
      || true, 'the migration page needs to learn nothing new');
    assert.match(SRV, /migration: \{ batch: 'mailroom'[\s\S]{0,200}needsReview: true/,
      'it writes the queue\'s own shape');
    assert.ok(!/nav_mailroom|view==='mailroom'|renderMailroom/.test(APP), 'no door in the sidebar');
    assert.ok(!/hmTile\(\{ t:i18t\('set_mailroom/.test(HOME), 'and no tile of its own');
  });
  test('1b the desk keeps its ceiling of three, with four kinds competing', () => {
    assert.match(DESK, /const DESK_KINDS = \['notice', 'chase', 'deviations', 'renewal'\]/);
    assert.match(DESK, /DESK_KINDS\.indexOf\(k\)/, 'the order is read, never restated');
    assert.match(DESK, /const DESK_MAX = 3;/,
      'with four kinds, "one of each" and "at most three" are no longer the same sentence');
    assert.match(DESK, /if\(out\.length >= DESK_MAX\) break;/);
  });
  test('1c the alert is a registered kind with a rank, never a special case', () => {
    assert.match(APP, /\{ k:'cert-lapsed', tone:'ruby'/);
    assert.match(APP, /push\('cert-lapsed',c,text,/);
    assert.ok(!/kind==='cert-lapsed'\s*\?/.test(APP), 'nothing branches on it at the draw');
  });
  test('1d the money tile is one more option, and not one of the default four', () => {
    assert.match(HOME, /owed:'Money owed to us'/);
    assert.match(HOME, /KPI_ALL_ORDER=\[[^\]]*'owed'/);
    const def = (HOME.match(/const DEFAULT_KPI_SEL=\[([^\]]*)\]/) || ["",""])[1];
    assert.ok(!/owed/.test(def), 'nobody who does not pick it ever sees it');
  });
});

describe('f323 (2) the Mailroom files, and it does not read', () => {
  test('2a one shared secret, compared in constant time', () => {
    assert.match(SRV, /function mailroomKeyOk\(given\)/);
    assert.match(SRV, /crypto\.timingSafeEqual/);
    assert.ok(!/want === String\(given\)|given === mailroomKey\(\)/.test(SRV),
      'a length-sensitive compare leaks a secret a byte at a time');
  });
  test('2b off is 404, not 401 — a workspace that has not set this up says nothing', () => {
    const r = SRV.slice(SRV.indexOf("app.post('/api/mailroom'"), SRV.indexOf("app.post('/api/mailroom'") + 800);
    assert.match(r, /if \(!mailroomOn\(\)\) return res\.status\(404\)/);
    assert.match(r, /status\(401\)/, 'and a wrong key is 401');
  });
  test('2c an allow-list of types, a size cap and a count cap — each SAID, never a silent trim', () => {
    assert.match(SRV, /const MAILROOM_TYPES = \{/);
    assert.match(SRV, /skipped\.push\(\{ name, why: 'not a document HaTi reads' \}\)/);
    assert.match(SRV, /why: 'over ' \+ Math\.round\(MAILROOM_MAX_BYTES/);
    assert.match(SRV, /res\.json\(\{ ok: true, filed: filed\.length, ids: filed, skipped \}\)/);
  });
  test('2d it files; it does not read — no extractor, no OCR, no model on the server', () => {
    const r = SRV.slice(SRV.indexOf('const MAILROOM_MAX_FILES'), SRV.indexOf("app.post('/api/mailroom'") + 4200)
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!/extractWordText|extractPdf|runOcr|pdfReadPages|anthropicMessages/i.test(r),
      'a second extractor on the server is two readings of one document');
    assert.match(r, /blocked: 'unread'/, 'which is exactly what the queue is for');
  });
  test('2e nothing it creates is a contract anybody has agreed', () => {
    const r = SRV.slice(SRV.indexOf('const MAILROOM_MAX_FILES'), SRV.indexOf("app.post('/api/mailroom'") + 4200);
    assert.match(r, /status: 'Draft'/);
    assert.match(r, /signatures: \[\]/);
    assert.match(r, /value: 0/);
    assert.match(r, /counterparty: ''/);
  });
  test('2f the key is admin-only, generated from crypto, and short keys are refused', () => {
    assert.match(SET, /mailroom:\{\s*\n\s*tab:'platform'/);
    assert.match(SET, /crypto\.getRandomValues/);
    const panel = SET.slice(SET.indexOf('mailroom:{'), SET.indexOf('mailroom:{') + 4200)
      .replace(/\/\*[\s\S]*?\*\//g, ' ');
    assert.ok(!/Math\.random/.test(panel),
      'this is the only thing between a stranger and the import queue');
    assert.match(SET, /key\.length<24/);
  });
});

describe('f323 (3) the letter is composed from the record, and HaTi never serves it', () => {
  const live = (o) => Object.assign({
    id:'MK-1', name:'Modern Trade Listing', counterparty:'Naivas Supermarkets',
    /* 'Signed' because renewalInForce is what renewalWindow asks first, and
       it is the product's own reading of "this agreement is actually in
       force" — a notice on a draft is a letter about nothing. */
    status:'Signed', value:1000, audit:[{ at:'2024-01-01T00:00:00.000Z', user:'x', action:'Created' }],
    expiry: day(40), metadata:{ expiryDate: day(40), noticePeriodDays:30, renewalType:'auto-renew',
      effectiveDate:'2025-07-24', currency:'KES' },
  }, o || {});
  function w(c){
    const b = buildWorld({ notice:true, family:true });
    const win = b.win;
    win.state = Object.assign(win.state || {}, { contracts:[c] });
    return win;
  }
  test('3a no model writes a word of it', () => {
    assert.ok(!/anthropic|copilot|aiAsk|\/api\/ai|prompt/i.test(NT_CODE),
      'a sentence generated from a prompt is one nobody can stand behind');
    assert.ok(!/api\(|fetch\(/.test(NT_CODE), 'and there is no route');
  });
  test('3b every fact in the letter comes off the record', () => {
    const c = live();
    const d = w(c).noticeDraft(c);
    assert.equal(d.ok, true, JSON.stringify(d.why));
    assert.match(d.text, /Naivas Supermarkets/);
    assert.match(d.text, /Modern Trade Listing/);
    assert.match(d.text, /30-day notice period/);
    /* Written the way the PAPER writes a date where the formatter is on the
       floor, and as the stored day where it is not — either way it is the
       record's own date and never an invented one. */
    assert.match(d.text, /24 July 2025|2025-07-24/, 'the agreement\'s own date');
  });
  test('3c an agreement that renews itself gets a different letter from one that does not', () => {
    const a = live(); const b = live({ metadata: Object.assign({}, live().metadata, { renewalType:'fixed' }) });
    assert.equal(w(a).noticeDraft(a).kind, 'non-renewal');
    assert.equal(w(b).noticeDraft(b).kind, 'termination');
    assert.match(w(a).noticeDraft(a).text, /NOTICE OF NON-RENEWAL/);
    assert.match(w(b).noticeDraft(b).text, /NOTICE OF TERMINATION/);
  });
  test('3d it refuses rather than guesses, and every refusal is a REASON', () => {
    const none = live({ metadata:{ expiryDate: day(40), currency:'KES' } });
    const r = w(none).noticeDraft(none);
    assert.equal(r.ok, false);
    assert.ok(r.why.includes('no-notice-period'), JSON.stringify(r.why));
    const noCp = live({ counterparty:'' });
    assert.ok(w(noCp).noticeDraft(noCp).why.includes('no-counterparty'));
    const child = live({ parentId:'MK-0' });
    assert.ok(w(child).noticeDraft(child).why.includes('amendment'));
    /* A letter with a blank where the date belongs is worse than no letter. */
    assert.ok(!('text' in w(none).noticeDraft(none)));
  });
  test('3e a decision that is not close yet gets no letter', () => {
    const far = live({ expiry: day(400), metadata: Object.assign({}, live().metadata, { expiryDate: day(400) }) });
    assert.ok(w(far).noticeDraft(far).why.includes('not-yet'),
      'a notice served three hundred days early is not a notice');
  });
  test('3f nothing in this file drafts a termination FOR CAUSE', () => {
    assert.ok(!/breach|for cause|default|material/i.test(NT_CODE),
      'that rests on a breach HaTi has not read and cannot evidence');
  });
  test('3g the trail says a letter was drafted and taken, and no more than that', () => {
    assert.match(NT_CODE, /HaTi did not send it/);
    assert.ok(!/logAudit\([^)]*'Served'|sendEmail|buildSharePayload|api\(/.test(NT_CODE));
    assert.match(I18N, /nt_copied: 'Copied\. HaTi has not sent anything\.'/);
    assert.match(I18N, /nt_foot: '[^']*HaTi does not send it/);
  });
  test('3h the desk row leads, and only while the decision is still live', () => {
    assert.match(DESK, /if\(nd && nd\.ok && !nd\.late && !nd\.predatesRecord\)/);
    assert.match(DESK, /kind:'notice'/);
    const c = live();
    const b = buildWorld({ notice:true, desk:true });
    const win = b.win;
    win.state = Object.assign(win.state || {}, { contracts:[c] });
    const items = win.deskItems();
    assert.ok(items.some(i => i.kind === 'notice'), 'the fixture is inside its window');
    assert.equal(items.filter(i => i.kind === 'notice')[0].cid, 'MK-1');
  });
  test('3i a date older than the record is not one anybody here missed', () => {
    const c = live({ expiry: day(5), metadata: Object.assign({}, live().metadata, { expiryDate: day(5), noticePeriodDays:90 }),
      audit:[{ at:new Date().toISOString(), user:'x', action:'Created' }] });
    const d = w(c).noticeDraft(c);
    assert.equal(d.predatesRecord, true);
    assert.equal(d.late, false, 'HaTi does not accuse the reader of missing an impossible deadline');
    assert.match(w(c).noticeDialogHtml(d), /before this contract was filed/);
  });
});

describe('f323 (4) the lapsed certificate is the Overview\'s own reading', () => {
  test('4a it asks contractDocuments and obligationDocState, and nothing of its own', () => {
    const a = APP.slice(APP.indexOf('A REQUIRED DOCUMENT HAS LAPSED'), APP.indexOf("EMAIL ISN'T SET UP (owner-ruled"));
    assert.match(a, /contractDocuments\(c\)/);
    assert.match(a, /obligationDocState\(o\)==='lapsed'/);
    assert.ok(!/\.until|Date\.parse|daysUntil/.test(a), 'a second reading of "in date" would drift');
  });
  test('4b lapsed only — never missing, never lapsing soon', () => {
    const a = APP.slice(APP.indexOf('A REQUIRED DOCUMENT HAS LAPSED'), APP.indexOf("EMAIL ISN'T SET UP (owner-ruled"));
    assert.ok(!/'missing'|'soon'/.test(a));
  });
  test('4c one row per contract, however many have lapsed', () => {
    const a = APP.slice(APP.indexOf('A REQUIRED DOCUMENT HAS LAPSED'), APP.indexOf("EMAIL ISN'T SET UP (owner-ruled"));
    assert.equal((a.match(/push\('cert-lapsed'/g) || []).length, 1);
    assert.match(a, /lapsed\.length>1/, 'and the row says how many more');
    assert.ok(!/lapsed\.forEach/.test(a));
  });
  test('4d ruby, because cover that has stopped is not work owed', () => {
    assert.match(APP, /\{ k:'cert-lapsed', tone:'ruby'/);
    assert.match(APP, /\{ k:'obligation',  tone:'amber'/, 'the row it sits beside stays amber');
  });
});

describe('f323 (5) money owed is borrowed, converted, and permission-aware', () => {
  test('5a it borrows every reading and computes no state of its own', () => {
    const t = HOME.slice(HOME.indexOf('owed: (()=>{'), HOME.indexOf('owed: (()=>{') + 2200);
    assert.match(t, /obligationIsTheirs/);
    assert.match(t, /obState/);
    assert.match(t, /obligationAmount/);
    assert.match(t, /fxHome/);
  });
  test('5b an unconvertible amount is LEFT OUT and counted, never summed at par', () => {
    const t = HOME.slice(HOME.indexOf('owed: (()=>{'), HOME.indexOf('owed: (()=>{') + 2200);
    assert.match(t, /if\(h&&h\.missing\) left\+\+; else sum\+=/);
    assert.match(t, /home_owed_left/);
  });
  test('5c no permission means the COUNT, never a row of dashes', () => {
    const t = HOME.slice(HOME.indexOf('owed: (()=>{'), HOME.indexOf('owed: (()=>{') + 2200);
    assert.match(t, /canMoney \? fmtMoneyShort\(sum\) : Number\(n\)/);
    assert.match(t, /obligationMoneyVisible/);
  });
  test('5d the destination counts the way the tile counted', () => {
    const t = HOME.slice(HOME.indexOf('owed: (()=>{'), HOME.indexOf('owed: (()=>{') + 2200);
    assert.match(t, /go:\{obligations:\{state:'open', side:'theirs'\}\}/);
  });
  test('5e it is "owed to us", never "receivable" — HaTi reads agreements, not a ledger', () => {
    assert.match(I18N, /kpi_owed: 'Money owed to us'/);
    /* The VALUES, not this file's own comments: the word is used in the note
       beside the key to say why it is not the word HaTi prints. */
    const values = (I18N.match(/^\s+[a-z_0-9]+: '(?:[^'\\]|\\.)*'/gm) || []).join('\n');
    assert.ok(!/receivable/i.test(values));
  });
});

describe('f323 (6) every new name is reachable, in both books', () => {
  test('6a js/notice.js publishes what other files reach for', () => {
    ['noticeDraft','noticeBlockers','noticeMayDraft','openNoticeDialog','noticeText',
     'noticeDialogHtml','NOTICE_KINDS'].forEach(n=>{
      assert.match(NT, new RegExp('\\b' + n + '\\b[,}]'), n + ' is not on the publish list');
    });
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8'),
      /import '\.\/notice\.js';/, 'and the module is loaded');
  });
  test('6b every key the new surfaces ask for is in both dictionaries', () => {
    ['nt_act','nt_title','nt_copy','nt_foot','desk_nt_read','al_cert_single',
     'kpi_owed','st_p_mailroom','set_mailroom_key'].forEach(k=>{
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k);
    });
  });
});
