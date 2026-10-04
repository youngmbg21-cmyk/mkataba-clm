/* F459 — FOUR BUILDS ON ONE LIST (Young, "Build it and merge to main",
 * 4 Oct 2026)
 *
 *   (A) THE MAP, TIDIED AGAIN: a big bubble only where a person asked for one
 *       (a group of one contract never), "fold all Juno contracts into one
 *       bubble" across groups without touching the grouping, customer names
 *       on the edges only when asked, the owner's phrasings read for free,
 *       Copilot's map tool carrying the same look, no sentence claiming what
 *       the map did not do, and a place kept by the older map landing on the
 *       starting view once.
 *   (B) THE SHARED SHEET: Where we are is ONE page on all three surfaces —
 *       one title, the reader's own line, one row of facts with what waits on
 *       each party, clause names never inside ids, a short foot line; the
 *       browser's and the server's readings agree on the new fields.
 *   (C) ASK COPILOT FROM THE BOARD puts the question in the panel on the
 *       page, never the chat window outside it.
 *   (D) TODAY'S INSIGHTS, THE SHELF: proposals read off the board's own
 *       questions, a let-go shape rests, a kept view is a panel, and the brief
 *       carries "Your kept views" as of the day Home counted them.
 *
 * Measured as drawn: test/chromium/map-asked-bubbles-verify.js,
 * where-we-are-verify.js, deal-stands-verify.js, status-link-verify.js and
 * insights-shelf-verify.js. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const { buildWorld } = require('./world');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"\\])\/\/[^\n]*/g, '$1');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

/* ================================================================ (A) */
describe('F459 (A) — the map asks before it draws a big bubble', () => {
  const world = () => {
    const w = buildWorld({ intelView: true }).win;
    w.state = { contracts: [
      { id: 'J1', counterparty: 'Juno Logistics Ltd', folder: 'proc', status: 'Signed' },
      { id: 'J2', counterparty: 'Juno Logistics Ltd', folder: 'sales', status: 'Signed' },
      { id: 'J3', counterparty: 'Juno Logistics Ltd', folder: 'sales', status: 'Draft' },
      { id: 'N1', counterparty: 'Naivas Supermarkets', folder: 'proc', status: 'Draft' }], settings: {} };
    w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
    w.isMonetary = () => true;
    return w;
  };
  const look = (w, q) => w.igLookRead(w._igNorm ? w._igNorm(q) : q.toLowerCase());
  test('a fold the map makes itself draws no bubble; one a person asks for does — never for one contract', () => {
    const w = world();
    w.intel.folds = { 'folder|A': true, 'folder|B': w.IG_FOLD_BUBBLE, 'folder|C': w.IG_FOLD_BUBBLE };
    const hub = (key, n) => ({ folded: true, foldKey: key, kids: Array.from({ length: n }, (_, i) => ({ id: key + i })) });
    assert.equal(w.igHubBubbles(hub('folder|A', 5)), false, 'the map folded it on a crowded stage: no bubble');
    assert.equal(w.igHubBubbles(hub('folder|B', 5)), true, 'asked: a bubble');
    assert.equal(w.igHubBubbles(hub('folder|C', 1)), false, 'a group of one contract is never a big bubble');
  });
  test('every writer of a person\'s fold writes the asked mark', () => {
    const src = strip(read('js/views/intelligence.js'));
    assert.match(region(src, 'igFoldHub'), /h\.folded\?IG_FOLD_BUBBLE:false/);
    assert.match(region(src, 'igbLayout'), /all\?IG_FOLD_BUBBLE:false/);
    assert.match(region(src, 'igbLayout'), /folds\[h\.foldKey\]=!intel\.groups&&many&&h\.kids\.length<=IGB_FOLD_SMALL/, 'the map\'s own fold stays a plain true');
    assert.match(src, /if\(f<\.05\|\|!igHubBubbles\(h\)\) return;/, 'the canvas draws a group bubble only where igHubBubbles says');
  });
  test('the owner\'s phrasings are read for free', () => {
    const w = world();
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'Remove customer names'))), [{ names: { mode: 'none' } }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'show the customer names on the edges'))), [{ edgeNames: true }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'take the names off the edges'))), [{ edgeNames: false }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'The bubbles need to be small'))), [{ small: true }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'make the bubbles small'))), [{ small: true }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'remove the grouping'))), [{ ungroup: true }]);
    assert.deepEqual(JSON.parse(JSON.stringify(look(w, 'remove the big bubbles'))), [{ fold: 'none' }]);
    const b = look(w, 'fold all Juno contracts into one bubble');
    assert.ok(b && b[0] && b[0].bundle && /juno/i.test(b[0].bundle.q), JSON.stringify(b));
  });
  test('a bundle crosses the groups and leaves the grouping alone', () => {
    const w = world();
    w.intel.groupBy = 'folder';
    w.igRecipeRun({ acts: look(w, 'fold all Juno contracts into one bubble') });
    assert.equal(w.intel.groupBy, 'folder');
    assert.equal((w.intel.bundles || []).length, 1);
    w.igRecipeRun({ acts: [{ bundle: { q: 'naivas', label: 'Naivas' } }] });
    assert.equal(w.intel.bundles.length, 1, 'one contract is not a bundle — it stays a dot');
  });
  test('reset lands on the starting view, and an old place lands there once', () => {
    const w = world();
    Object.assign(w.intel, { groupBy: 'counterparty', dotScale: 2, names: { mode: 'none' }, edgeNames: true, bundles: [{ q: 'juno', label: 'Juno' }], folds: { x: 'b' } });
    w.igLandingSet();
    assert.equal(w.intel.groupBy, 'folder'); assert.equal(w.intel.dotScale, 1);
    assert.equal(w.intel.names, null); assert.equal(w.intel.edgeNames, null); assert.equal(w.intel.bundles, null);
    assert.deepEqual(JSON.parse(JSON.stringify(w.intel.folds)), {});
    w.intelPlacePut({ tab: 'map', recipe: { lenses: [], groupBy: 'counterparty', dotScale: 3 } });
    assert.equal(w.intel.groupBy, 'folder', 'a recipe with no edition is the older map: starting view');
    w.intelPlacePut({ tab: 'map', recipe: { ...w.igRecipeNow(), groupBy: 'status' } });
    assert.equal(w.intel.groupBy, 'status', 'this edition comes back as it was');
  });
  test('customer names stay off the edges until asked; other facts keep theirs', () => {
    const w = world();
    assert.equal(w.igEdgeNamesShow('counterparty'), false);
    assert.equal(w.igEdgeNamesShow('status'), true);
    w.intel.edgeNames = true;
    assert.equal(w.igEdgeNamesShow('counterparty'), true);
  });
  test('Copilot\'s look is carried out by the map\'s own acts', () => {
    const w = world();
    assert.deepEqual(JSON.parse(JSON.stringify(w.igLookActs({ names: 'none', dots: 'small', edgeNames: false }))),
      [{ names: { mode: 'none' } }, { edgeNames: false }, { small: true }]);
    assert.equal(w.IG_CLAIM_RE.test('I have hidden the customer names.'), true);
    assert.equal(w.IG_CLAIM_RE.test('Juno holds most of the value.'), false);
    const SRV = read('server/server.js');
    assert.match(SRV, /look: \{ type: 'object'/, 'the tool offers the look');
    assert.match(SRV, /look: graphLookClean\(out\.look\)/, 'and the server cleans what comes back');
    assert.match(SRV, /Never answer a look request with labelBy, sizeBy, groupBy, where or visibleIds/);
  });
});

/* ================================================================ (B) */
describe('F459 (B) — the shared sheet', () => {
  const C = { id: 'MK-9', name: 'Supply', party: 'Highland Ltd', counterparty: 'Nordbygg AB',
    changes: [{ id: 'CHG-1', clauseLabel: '4. Payment Terms', status: 'accepted', authorSide: 'counterparty' },
      { id: 'CHG-2', clauseLabel: '9. Liability Cap', status: 'pending', authorSide: 'owner' },
      { id: 'CHG-3', clauseId: 'cl_7f', status: 'pending', authorSide: 'counterparty' }], negotiation: { round: 2 } };
  test('one title, one row of facts with what waits on each party, no disclaimer', () => {
    const w = buildWorld({}).win;
    const html = w.standsHtml(C, { mine: '<div class="ds-mine">X</div>', you: 'Nordbygg AB' });
    assert.equal((html.match(/<h2/g) || []).length, 1, 'one title');
    assert.match(html, /class="ds-facts"/);
    assert.match(html, /Waiting on Highland Ltd<\/span><b>1<\/b>/);
    assert.match(html, /Waiting on you<\/span><b class="ds-warn">1<\/b>/, 'the reader\'s own figure, where the surface knows the reader');
    assert.ok(!/never shows|Built from the record|ds-move|ds-eyebrow/.test(html), 'the disclaimer and the old rows are gone');
    assert.match(html, /The same page every party sees/);
    assert.ok(html.indexOf('ds-mine') < html.indexOf('ds-facts'), 'the reader\'s line sits in the head, above the facts');
  });
  test('a clause is named by its label; an inside id is said as "a clause"', () => {
    const w = buildWorld({}).win;
    const D = w.dealStands(C);
    assert.ok(D.points.some(p => p.clause === ''), 'the reading says nothing for cl_7f');
    const html = w.standsHtml(C, {});
    assert.ok(!/cl_7f|CHG-/.test(html));
    assert.match(html, /a clause/);
  });
  test('the browser and the server read the new fields alike', () => {
    const SRV = read('server/server.js'), DS = read('js/dealstands.js');
    assert.equal((DS.match(/DS_INSIDE_ID = (\/.*\/i);/) || [])[1], (SRV.match(/SRV_DS_INSIDE_ID = (\/.*\/i);/) || [])[1], 'one inside-id rule, both hosts');
    assert.match(SRV, /points, settledPoints, waiting, lately,/);
    assert.match(SRV, /fact\('Settled', `\$\{D\.settled\} of \$\{D\.total\}`\)/, 'the public page draws the same facts row');
    const S2 = strip(SRV);
    assert.ok(!/Whose move/.test(S2.slice(S2.indexOf('function dealPageHtml'), S2.indexOf("app.get('/deal/:token'"))), 'the public page no longer says "Whose move"');
  });
  test('our own tab names every party — no seat word on a page every party reads', () => {
    const src = strip(read('js/dealstands.js'));
    assert.ok(!/you:/.test(region(src, 'paintStandsPane')), 'paintStandsPane passes no `you`');
  });
  test('their page IS the sheet, with their own line inside it', () => {
    const P = strip(read('js/views/portal.js'));
    const r = region(P, 'portalWhereHtml');
    assert.match(r, /standsHtml\(c,\{ data:D, you, lately:false, stepSub, mine:portalWhereMineHtml\(c, p, D\) \}\)/);
    assert.ok(!/pw-where-grid|pw-shrule|pw-journey/.test(r));
  });
});

/* ================================================================ (C) */
describe('F459 (C) — Ask Copilot from the board asks the panel on the page', () => {
  test('the card\'s button puts its question in the panel, never the window outside', () => {
    const HB = strip(read('js/views/homeboard.js'));
    assert.match(HB, /\[data-hb-ai\]'\)\)\)\{ hbAskInPanel\(/);
    assert.ok(!/openAI\(/.test(HB), 'the board opens no outside chat');
    assert.match(region(HB, 'hbAskInPanel'), /intelAskReady\(text\)/);
  });
  test('a question put ready is a reading question: the board\'s free reader does not re-read it', () => {
    const IG = strip(read('js/views/intelligence.js'));
    const r = region(IG, 'intelAsk');
    assert.ok(r.indexOf('if(readied)') < r.indexOf('hbAsk('), 'the readied question goes before the board\'s reader');
    assert.match(r, /await intelChatAsk\(q\)/);
    assert.match(region(IG, 'intelAskReady'), /had\.trim\(\) && had\.trim\(\)!==_igReadyAsk/, 'typed words are never overwritten');
  });
});

/* ================================================================ (D) */
describe('F459 (D) — today\'s insights', () => {
  const read2 = read;
  function world(){
    const w = buildWorld({ intelView: true }).win;
    const cs = [];
    /* eight past months of signings, three a month, each faster: 40 → 26 days */
    for (let k = 0; k < 8; k++) for (let j = 0; j < 3; j++){
      const days = 40 - 2 * k, signed = mon(k - 8, 10 + j), raised = new Date(Date.parse(signed + 'T00:00:00') - days * 864e5);
      cs.push({ id: 'S' + k + j, name: 'Signed ' + k + j, counterparty: 'Kevian Kenya Ltd', status: 'Signed', value: 1e6, expiry: mon(k + 20),
        signedAt: signed, _raisedAt: raised.toISOString(), folder: 'proc', audit: [], metadata: { paymentTerms: '30 days' } });
    }
    w.state = { contracts: cs, settings: {}, view: 'dashboard' };
    w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' } };
    w.cKind = () => 'Contract';
    w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
    w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
    w.paySide = () => null;
    w.contractExpired = () => false;
    w.currentUser = () => ({ id: 'u_ins', name: 'Test', role: 'legal' });
    w.eval(read2('js/views/homeboard.js'));
    w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
    return w;
  }
  test('a drift the board can chart is offered in HaTi\'s own words, with the chart\'s own numbers', () => {
    const w = world();
    const c = w.hbInsCandidate('sign');
    assert.ok(c, 'signing got faster by a third: offered');
    assert.equal(c.title, 'Contracts are being signed faster');
    assert.match(c.say, /^\d+ days → \d+ days over \d+ months$/);
    assert.equal(w.hbInsCandidate('pay'), null, 'payment days did not move: nothing offered');
  });
  test('three at most a day, and a shape let go rests for 30 days', () => {
    const w = world();
    const s = w.hbS(); s.ins = null; s.insOff = { sign: w.hbToday() };
    const I = w.hbInsightsToday();
    assert.ok(I.length <= w.HB_INS_MAX);
    assert.ok(!I.some(x => x.shape === 'sign'), 'resting');
    assert.equal(w.hbInsResting('sign'), true);
  });
  /* Young, 4 Oct 2026: "i do not see the graphs … maybe there could be a way
     to run them if they are not on screen?" — a place nothing moved enough to
     fill takes a plain view, named by what it shows, never as a finding. */
  test('places nothing moved enough to fill are filled with plain views, named by what they show', () => {
    const w = world();
    const s = w.hbS(); s.ins = null; s.insOff = {};
    const I = w.hbInsightsToday();
    const sign = I.find(x => x.shape === 'sign'), pay = I.find(x => x.shape === 'pay');
    assert.ok(sign && !sign.plain, 'the drift is still a finding');
    assert.ok(pay && pay.plain, 'payment days did not move: a plain view fills the place');
    assert.equal(pay.title, 'Payment days by month signed');
    assert.ok(!/longer|shorter|faster/.test(pay.title));
    assert.equal(w.hbS().ins.list.indexOf('sign') < w.hbS().ins.list.indexOf('pay'), true, 'findings come first');
  });
  test('a picture is one press: the thumbnail carries no doors', () => {
    const w = world();
    const c = w.hbInsCandidate('sign');
    const t = w.hbInsThumb(c.C.R);
    assert.ok(!/data-hb-dig|tabindex|role="button"/.test(t));
    assert.match(w.hbShelfHtml([c]), /data-hb-ins="keep"[\s\S]*data-hb-ins="open"[\s\S]*data-hb-ins="why"[\s\S]*data-hb-ins="go"/);
  });
  test('Keep makes a kept view: a panel that counts again, named so it stays true', () => {
    const w = world();
    const s = w.hbS(); s.panels = [];
    w.hbAddView('sign');
    assert.equal(s.panels.length, 1);
    assert.equal(s.panels[0].kind, 'view');
    assert.equal(w.hbPanelWord(s.panels[0]), 'Days to sign by month signed');
    assert.match(w.hbViewPanelHtml(s.panels[0], 'all'), /hb-cols/, 'the kept view draws the board\'s own chart');
  });
  test('proposals are the board\'s own questions — no second reader, no model', () => {
    const HB = strip(read('js/views/homeboard.js'));
    const r = region(HB, 'hbInsChart');
    assert.match(r, /hbDigData\(key, 'all'\)/);
    assert.ok(!/\bapi\(|intelAsk|copilotAsk/.test(region(HB, 'hbInsCandidate')), 'it spends nothing');
    assert.match(read('js/brainmap.js'), /\['insights', 'hbInsightsToday', 'see', 1\]/, 'named in the Brain');
  });
});

describe('F459 (D) — the daily brief carries your kept views', () => {
  const { startHatiWithMail, seedWorkspace, FOLDER_A } = require('./helpers');
  let h, W, mail;
  const isoDay = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { if (h) await h.stop(); });
  test('a board keeps at most eight, and an address is never taken', async () => {
    const r = await W.admin.raw('/api/home/kept', { method: 'PUT', body: { views: Array.from({ length: 9 }, (_, i) => ({ title: 'V' + i })) } });
    assert.equal(r.status, 400);
  });
  test('the brief that goes anyway says what Home last counted, and when', async () => {
    const ok = await W.admin.json('/api/home/kept', { method: 'PUT', body: { views: [{ title: 'Payment days by month signed', say: '30 days → 55 days over 6 months', at: isoDay(0) }] } });
    assert.equal(ok.ok, true);
    /* something the admin must hear about today, so a brief goes */
    await W.admin.json('/api/contracts/MK-KV-1', { method: 'PUT', body: { contract: { id: 'MK-KV-1', name: 'Cold store lease', counterparty: 'Savannah Ltd',
      folder: FOLDER_A, status: 'Draft', fields: {}, metadata: { expiryDate: isoDay(20) }, obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
    await W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
    const t0 = Date.now(); let m = null;
    while (Date.now() - t0 < 3000 && !(m = mail.sent.find(x => x.to === 'admin@example.co.ke' && /kept views/i.test(x.text || x.body || '')))) await new Promise(r => setTimeout(r, 50));
    assert.ok(m, 'the admin\'s brief carries the section');
    const body = m.text || m.body || '';
    assert.match(body, /Payment days by month signed — 30 days → 55 days over 6 months/);
    assert.match(body, new RegExp('\\(as of ' + isoDay(0) + '\\)'));
  });
});

/* ================================================================ (E) */
describe('F459 (E) — a line break written out as text is a line break', () => {
  /* Young's screenshot, 4 Oct 2026: an answer on Home's panel printed
     "changes.\n\nYour options:" — every Copilot answer passes mdParse. */
  const { aiRichText } = require('../js/aimd.js');
  const BS = String.fromCharCode(92);
  test('escaped breaks become paragraphs and a list', () => {
    const html = aiRichText('It was signed.' + BS + 'n' + BS + 'n**Your options:**' + BS + 'n' + BS + 'n1. **Renew it**' + BS + 'n2. Archive.');
    assert.ok(!html.includes(BS + 'n'), html);
    assert.match(html, /<ol class="ai-list"><li><strong>Renew it<\/strong><\/li><li>Archive\.<\/li><\/ol>/);
  });
  test('a doubled backslash is left alone', () => {
    assert.match(aiRichText('C:' + BS + BS + 'new'), /C:\\\\new/);
  });
});
