/* f1030 — THE REDLINES TAB'S NUMBER IS THE HEAD'S (owner, 13 Nov 2026: "fix the Redlines tab count so it matches
   the head"; seen in the owner's own screenshot of MK-382: the tab said "Redlines 2" over a column whose head read
   "Redlines 6 · 5 not sent")
   ============================================================================
   On our seat the tab counted the Dossier's negotiation rows owed by you (their asks waiting, a send owed), while
   the column's head counted the rows it draws with the settled fold shut (rlOpenCardCount). Their view already
   counted its column (f881 (19), owner's list item 19, 25 Oct 2026); our seat now asks the same reading.

     (1) THE NUMBERS AGREE — the real column is drawn with the face's own options and its head read; the tab says
         the same, with our drafts, their ask, our sent change and a settled one folded away;
     (2) THE TONE SAYS WHOSE MOVE — amber while anything there waits on you, grey when all of it waits on them;
     (3) NOTHING IN THE COLUMN, NO NUMBER;
     (4) THEIR VIEW is unchanged: their column, quiet;
     (5) COUNTING NEVER CREATES A NEGOTIATION: a contract nobody has redlined gets no number and is not written.

   AT THE PARENT (a931117) (1) and (2) fail: the tab said the owed rows' count in amber. (5) fails on this
   branch's first push (92f08c6), which read the column's count on every contract.
   Run: node --test test/f1030-the-redlines-tab-matches-its-head.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld, supplyContract } = require('./world');

const PD = fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8');
function fnSrc(src, name){
  const at = src.search(new RegExp('function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && --d === 0) return src.slice(at, i + 1);
  }
  return '';
}

const RICH = '<h1>SERVICES</h1>'
  + '<h2>1. Services</h2><p>AIT shall provide warehousing services.</p>'
  + '<h2>2. Pricing</h2><p>The Customer shall pay the rates in the schedule.</p>'
  + '<h2>3. Payment</h2><p>Invoices fall due within thirty (30) days.</p>'
  + '<h2>4. Liability</h2><p>Each party is liable for direct loss only.</p>'
  + '<h2>5. Governing Law</h2><p>This Agreement is governed by the laws of Norway.</p>'
  + '<h2>6. Notices</h2><p>Notices are sent by post.</p>';

/* the stage: the real column (js/views/negotiation.js), and the real tab count from js/paperdesk.js with the
   Dossier's reading stood in by `owed` (the rows of the negotiation stage the Dossier would list) */
async function stage(build, owed, o = {}){
  const w = buildWorld({ negotiationView: true, contractView: true, playbook: true });
  const { win } = w;
  win.promptDialog = async () => '';
  win.confirmDialog = async () => true;
  win.toast = () => {};
  const c = supplyContract({ redlineText: RICH });
  if (!o.received) win.negoInit(c);
  win.state = Object.assign({}, win.state, { contracts: [c], activeId: c.id, view: 'dashboard' });
  win.getContract = id => (id === c.id ? c : null);
  const cl = re => win.negoClauseList(c).find(x => re.test(String(x.heading || x.headingText || '') + ' ' + x.text));
  await build(win, c, cl);
  /* the face's options, as the face builds them (rlBenchOpts on our seat; pdRedOpts adds only dress) */
  let theirs = false;
  win.pdRedTheirs = () => theirs;
  win.pdRedOpts = cc => Object.assign({}, win.rlBenchOpts(cc, { side: theirs ? 'counterparty' : 'owner', hostId: 'pd-redface', again: () => {}, scope: '#pd-redface' }),
    { cpPanel: false, noProgress: true, waitingInPile: true, dealDoor: true });
  win.DOSSIER_STAGE_OF = { ask: 'nego', share: 'nego', fill: 'fill' };
  win.dossierRowN = r => Number(r.n) || 1;
  win.dossierOf = () => ({ owed: owed || [] });
  win.eval(fnSrc(PD, 'pdTabCount'));
  const head = () => {
    const html = win.rlColumnHtml(c, win.pdRedOpts(c));
    const t = win.document.createElement('template'); t.innerHTML = html;
    const el = t.content.querySelector('.rl-idx-title');
    const m = el ? String(el.textContent).match(/(\d+)\s*$/) : null;
    return m ? Number(m[1]) : 0;
  };
  return { win, c, head, tab: () => { const r = win.pdTabCount('red', c); return r ? { n: r.n, tone: r.tone } : null; }, setTheirs: v => { theirs = v; } };
}

/* five of ours not sent, one of theirs waiting, one of ours sent, one settled (accepted) */
async function mixed(win, c, cl){
  const own = (re, words) => win.negoEditClause(c, cl(re).clauseId, '<p>' + words + '</p>', { side: 'owner', author: 'Young' });
  await own(/Services/, 'AIT shall provide warehousing and transport services.');
  await own(/Pricing/, 'The Customer shall pay the rates in the schedule, reviewed yearly.');
  await own(/Liability/, 'Each party is liable for direct loss only, capped at the annual fees.');
  await own(/Notices/, 'Notices are sent by post or email.');
  const theirs = await win.negoEditClause(c, cl(/Governing/).clauseId, '<p>This Agreement is governed by the laws of Kenya.</p>', { side: 'counterparty', author: 'Erik' });
  const settled = await win.negoEditClause(c, cl(/Payment/).clauseId, '<p>Invoices fall due within forty-five (45) days.</p>', { side: 'counterparty', author: 'Erik' });
  await win.negoResolve(c, settled.id, 'accepted', { side: 'owner', author: 'Young' });
  return { theirs };
}

describe('f1030 (1) the tab says the head\'s number', () => {
  test('a mix of rows: drafts, their ask, a settled one folded away — tab = head', async () => {
    const S = await stage(mixed, [{ kind: 'ask', n: 1 }, { kind: 'share', n: 4 }]);
    const h = S.head();
    assert.ok(h >= 5, 'the stage drew a real column with its rows in sight: head says ' + h);
    assert.deepEqual(S.tab(), { n: h, tone: 'warn' });
  });
  test('the Dossier\'s owed rows no longer set the number: 2 owed, 6 in sight, the tab says 6', async () => {
    const S = await stage(mixed, [{ kind: 'ask', n: 2 }]);
    assert.equal(S.tab().n, S.head());
    assert.notEqual(S.tab().n, 2);
  });
});

describe('f1030 (2) the tone says whose move it is', () => {
  test('rows in sight but nothing of the negotiation owed by you: the number, in grey', async () => {
    const S = await stage(mixed, [{ kind: 'fill', n: 3 }]);
    assert.deepEqual(S.tab(), { n: S.head(), tone: 'quiet' });
  });
});

describe('f1030 (3) nothing in the column, no number', () => {
  test('a contract with no changes carries no number on the tab', async () => {
    const S = await stage(async () => {}, []);
    assert.equal(S.head(), 0);
    assert.equal(S.tab(), null);
  });
});

describe('f1030 (5) counting never creates a negotiation (reading must not write)', () => {
  /* CAUGHT ON GITHUB, 13 Nov 2026 (upload-blanks-verify 8h, "the received document is not rewritten"): the
     column's count reads through negoChanges, which calls negoInit and stamps clause ids into the document; the tab
     is painted on every contract, so a contract nobody had redlined was rewritten by looking at it */
  test('a received contract with no negotiation: no number, and nothing on it is written', async () => {
    const S = await stage(async () => {}, [], { received: true });
    const before = JSON.stringify({ n: S.c.negotiation, ch: S.c.changes, body: S.c.redlineText });
    assert.equal(S.tab(), null);
    assert.equal(JSON.stringify({ n: S.c.negotiation, ch: S.c.changes, body: S.c.redlineText }), before, 'the record is as it was');
    assert.equal(S.c.negotiation, undefined, 'no negotiation was created');
  });
});

describe('f1030 (4) Their view is unchanged', () => {
  test('their column\'s own count, from their seat, quiet', async () => {
    const S = await stage(mixed, [{ kind: 'ask', n: 1 }]);
    S.setTheirs(true);
    const r = S.tab();
    const hid = [...S.win.rlHiddenFrom(S.c, 'counterparty')];
    const want = S.win.rlOpenCardCount(S.c, Object.assign({}, S.win.pdRedOpts(S.c), { hiddenIds: hid }));
    assert.deepEqual(r, want ? { n: want, tone: 'quiet' } : null);
  });
});
