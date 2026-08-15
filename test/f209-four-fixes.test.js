/* ============================================================
   f209 — the send band, the toast kinds, the streams, and the ask tag
   ============================================================
   Four owner reports built together on 15 Aug 2026, logged as OI-9, OI-10,
   OI-11 and OI-12. Each was rendered and agreed before it was written, and
   each of the claims below fails against the code as it stood that morning.

   OI-9   Nothing told you a redline had not been sent. The only surface that
          mentioned it was a suffix on Publish Round — which never said "send",
          sat at the far end of the toolbar, and folded away on the fit ladder's
          second rung, so on an ordinary laptop it was not on screen at all.

   OI-10  Every toast was red, because toast() threw success away: its second
          line was `if(!isErr) return`. 250 of the product's 590 toast calls had
          never been seen, and the only way to make a message visible was to
          mark it an error — which is why publishing a round came back looking
          like a failure.

   OI-11  "Draft from a template" was one flat grid with no way to browse. The
          streams come first now, and anything unfiled goes to Other.

   OI-12  The tag on a clause read `CHG-006 · Their ask · ✓ adopted` — 218px of
          a heading row, four of them wanting ~694px. Colour is whose, glyph is
          where it stands, and pressing one shows what the change proposed.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const BODY =
  '<h1>Co-Packing</h1><p>Between Wanjiru Catering Ltd and Juno Limited</p>'
  + '<h2>1. Manufacturing Scope</h2><p>The Co-Packer shall manufacture the products.</p>'
  + '<h2>2. Tolling Fee</h2><p>Billed per unit, payable within thirty (30) days.</p>';
const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'y@w.co.ke' };
const contract = (over = {}) => ({ id: 'MK-311', name: 'Co-Packing',
  counterparty: 'Juno Limited', status: 'Under Review', folder: 'dist',
  fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 480000, redlineText: BODY, format: 'rich', ...over });

function world(){
  const w = buildWorld({ user: ME, negotiationView: true, contractView: true });
  w.win.state = { settings: {}, contracts: [] };
  w.win.getUsers = () => [ME];
  w.win.userById = () => ME;
  w.win.saveSettings = () => {};
  w.win.persist = () => {};
  w.toasts = [];
  w.win.toast = (m, k) => w.toasts.push({ kind: k || 'ok', text: String(m) });
  return w;
}
const clauseOf = (win, c, n) => {
  const cl = win.negoClauseList(c).find(x => x.num === n);
  assert.ok(cl, 'clause ' + n);
  return cl;
};

/* ============================================================
   OI-9 — "N NOT SENT"
   ============================================================ */
describe('f209 · the column says what has not been sent', () => {

  const withDrafts = async (w, n = 2) => {
    const c = contract();
    w.win.negoInit(c);
    for (const num of ['1', '2'].slice(0, n))
      await w.win.negoEditClause(c, clauseOf(w.win, c, num).clauseId,
        `<p>Reworded clause ${num}.</p>`, { side: 'owner', author: ME.name, summary: 'ask ' + num });
    return c;
  };

  test('the band counts our unsent asks, and says so', async () => {
    const w = world();
    const c = await withDrafts(w);
    assert.equal(w.win.rlUnsentCount(c, { side: 'owner' }), 2);
    const html = w.win.rlUnsentBandHtml(c, { side: 'owner' });
    assert.match(html, /2 not sent/, 'the count leads');
    assert.match(html, /Send all 2/, 'and the act names it too');
  });

  test('it is a PROXY onto the one postbox, never a second transport', async () => {
    const w = world();
    const c = await withDrafts(w);
    assert.match(w.win.rlUnsentBandHtml(c, { side: 'owner' }),
      /data-redline-proxy="nego-send"/, 'the same send the toolbar and the cards press');
  });

  test('with nothing unsent it draws nothing at all', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    assert.equal(w.win.rlUnsentCount(c, { side: 'owner' }), 0);
    assert.equal(w.win.rlUnsentBandHtml(c, { side: 'owner' }), '',
      'an always-on warning is furniture');
  });

  test('a sent ask stops being counted', async () => {
    const w = world();
    const c = await withDrafts(w);
    c.negotiation.turnAt = new Date(Date.now() + 60000).toISOString();  // everything is behind the hand-over
    assert.equal(w.win.rlUnsentCount(c, { side: 'owner' }), 0);
    assert.equal(w.win.rlUnsentBandHtml(c, { side: 'owner' }), '');
  });

  test('the counterparty gets the same band, counting what THEIR page holds', async () => {
    const w = world();
    const c = await withDrafts(w, 1);
    const html = w.win.rlUnsentBandHtml(c, { side: 'counterparty', org: 'Wanjiru Catering Ltd',
      pendingDecisions: 2, pendingProposals: 1 });
    assert.match(html, /3 not sent/, 'decisions and proposals together');
    assert.match(html, /data-redline-proxy="nego-send-decisions"/, 'and their own postbox');
  });

  test('a read-only copy is never asked to send anything', async () => {
    const w = world();
    const c = await withDrafts(w);
    assert.equal(w.win.rlUnsentBandHtml(c, { side: 'owner', readonly: true }), '');
  });

  test('THE COUNT LEFT THE PUBLISH BUTTON — one number, one place', () => {
    /* Two surfaces printing one figure is how they come to disagree, and this
       was the worse of the two: it folded away exactly when the column got
       narrow. Held and in-review deliberately stay on the button — they are
       work waiting on a COLLEAGUE, not unsent work waiting on you. */
    const src = read('js/views/negotiation.js');
    assert.ok(!/\$\{_goes\} unsent/.test(src), 'the suffix is gone');
    assert.match(src, /\$\{_held\} held/, 'held stays where it was');
    assert.match(src, /\$\{_wait\} in review/, 'and so does in review');
  });
});

/* ============================================================
   OI-10 — THREE TOASTS
   ============================================================ */
describe('f209 · a toast says which of three things happened', () => {

  /* ---- THE REAL FUNCTION, IN A WINDOW OF ITS OWN ----
     Both harnesses in this repo replace `toast` with a recorder — parity.html
     with a no-op and buildWorld with a log — which is right for every other
     test and useless for the one test about what a toast DRAWS. So the source
     is lifted out of js/core.js and run against a bare document with the two
     helpers it uses. It is the shipped code, not a copy: the slice is taken
     between named landmarks and the test below fails if either moves. */
  const { JSDOM } = require('jsdom');
  const toastSource = () => {
    const src = read('js/core.js');
    const from = src.indexOf('const TOAST_KINDS');
    const to = src.indexOf('/* SHA-256, with an honest failure mode.');
    assert.ok(from > 0 && to > from, 'the toast block is still where this test reads it');
    return src.slice(from, to);
  };
  const stage = () => {
    const dom = new JSDOM('<div id="toast-root"></div>', { runScripts: 'outside-only' });
    const win = dom.window;
    win.eval('function icon(){ return "<svg></svg>"; }'
      + 'function esc(s){ return String(s == null ? "" : s); }'
      + toastSource());
    return { w: { win }, root: win.document.getElementById('toast-root') };
  };
  const kinds = root => [...root.children].map(e => e.dataset.toastKind);

  test('THE FAULT AS REPORTED: success used to be thrown away', () => {
    const src = read('js/core.js');
    const t = src.slice(src.indexOf('function toast(msg'));
    assert.ok(!/if\(!isErr\) return;/.test(t.slice(0, 600)),
      'the line that discarded every confirmation is gone');
  });

  test('all three kinds draw, and each wears its own ground', () => {
    const { w, root } = stage();
    w.win.toast('Round 2 published.', 'ok');
    w.win.toast('Not emailed.', 'warn');
    w.win.toast('Could not send.', 'err');
    assert.deepEqual(kinds(root).join(','), 'ok,warn,err');
    const bg = [...root.children].map(e => e.style.background);
    assert.equal(new Set(bg).size, 3, 'three states, three colours');
  });

  test('an unknown kind is treated as a refusal, so no existing call gets quieter', () => {
    const { w, root } = stage();
    w.win.toast('Something', 'sideways');
    assert.deepEqual(kinds(root), ['err']);
  });

  test('NEEDS-YOU CARRIES THE THING IT ASKS FOR', () => {
    /* The reported message told the reader to send a link and handed them
       nothing to press — the same fault as a refusal with no way forward. */
    const { w, root } = stage();
    let copied = 0;
    w.win.toast('Published to their link — not emailed.', 'warn',
      { action: { label: 'Copy link', onClick: () => { copied++; } } });
    const btn = root.querySelector('[data-toast-act]');
    assert.ok(btn, 'the action is on the toast');
    assert.match(btn.textContent, /Copy link/);
    btn.dispatchEvent(new w.win.MouseEvent('click', { bubbles: true }));
    assert.equal(copied, 1, 'and it runs');
  });

  test('dwell follows meaning — a refusal stays until it is dismissed', () => {
    const src = read('js/core.js');
    const block = src.slice(src.indexOf('const TOAST_KINDS'), src.indexOf('function toast(msg'));
    assert.match(block, /ok:.*dwell:\s*\d{3,4}/, 'done goes on its own');
    assert.match(block, /err:.*dwell:\s*0/, 'a refusal does not');
    const warn = /warn:.*dwell:\s*(\d+)/.exec(block);
    const ok = /ok:.*dwell:\s*(\d+)/.exec(block);
    assert.ok(Number(warn[1]) > Number(ok[1]),
      'and something still asking for you outlasts something merely confirming');
  });

  test('every toast can be dismissed by a press', () => {
    const { w, root } = stage();
    w.win.toast('Round 2 published.', 'ok');
    root.firstChild.dispatchEvent(new w.win.MouseEvent('click', { bubbles: true }));
    assert.equal(root.firstChild.style.opacity, '0', 'it is on its way out');
  });

  test('the reported publish path is amber and hands over the link', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /delivered \? 'ok' : 'warn'/,
      'published-but-not-emailed is no longer an error');
    assert.match(src, /ng_copy_link/, 'and the link goes with it');
  });
});

/* ============================================================
   OI-11 — THE STREAMS COME FIRST
   ============================================================ */
describe('f209 · draft-from-template opens on the value streams', () => {

  test('a template carries a stream, and the server takes it', () => {
    const srv = read('server/server.js');
    assert.match(srv, /addColumnIfMissing\('templates', 'folder', 'TEXT'\)/,
      'existing databases gain the column');
    assert.match(srv, /folder: t\.folder \|\| null/, 'and it rides back on the row');
    assert.match(srv, /if \(b\.folder !== undefined\) \{ sets\.push\('folder=\?'\)/,
      'and the edit route writes it');
  });

  test('NULL is the honest answer and there is no backfill', () => {
    /* Every template that existed before this has no stream, which is true of
       them. The picker has a folder for exactly that rather than guessing one
       out of the five categories, which are a different vocabulary. */
    const srv = read('server/server.js');
    assert.ok(!/UPDATE templates SET folder/.test(srv), 'nothing is filed behind anybody');
    assert.match(srv, /function tplFolderOf/, 'and the value is normalised in one place');
  });

  test('the picker browses streams first, and Other is not a seventh stream', () => {
    const wz = read('js/wizard.js');
    assert.match(wz, /data-wz-stream=/, 'the folders are the first screen');
    assert.match(wz, /WZ_OTHER/, 'with a home for the unfiled');
    assert.ok(!/FOLDERS\[WZ_OTHER\]\s*=/.test(wz),
      'Other is never added to the stream map — a stream you can file into is an answer');
  });

  test('the stream order is visibleFolders\' own, so no two screens disagree', () => {
    const wz = read('js/wizard.js');
    assert.match(wz, /visibleFolders/, 'the one list every stream picker reads');
  });

  test('search stays on the front screen and looks across every stream', () => {
    const wz = read('js/wizard.js');
    assert.match(wz, /const found\s*=\s*q\s*\?\s*rows\.filter/,
      'it searches the normalised list, not one folder and not only the built-ins');
    assert.match(wz, /found\.map\(rowCard\)/, 'and hits are drawn as the same cards the folders hold');
  });

  test('FILING A TEMPLATE IS NOT ACCESS CONTROL, and the route says so', () => {
    /* Templates are patterns, not records — no counterparty, no value, no
       wording anybody agreed — so the folder-scope rules that govern contracts
       have no business here. Said out loud so the opposite is a decision. */
    const srv = read('server/server.js');
    const at = srv.indexOf("if (b.folder !== undefined)");
    assert.ok(at > 0);
    assert.match(srv.slice(at - 700, at), /NOT ACCESS CONTROL/);
  });
});

/* ============================================================
   OI-12 — THE ASK TAG
   ============================================================ */
describe('f209 · the tag on a clause, and what pressing it opens', () => {

  const staged = async (w, status) => {
    const c = contract();
    w.win.negoInit(c);
    const cl = clauseOf(w.win, c, '1');
    const ch = await w.win.negoEditClause(c, cl.clauseId, '<p>The Producer shall manufacture.</p>',
      { side: 'counterparty', author: 'Juno Limited', summary: 'their ask' });
    if (status === 'accepted') w.win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: ME.name });
    if (status === 'rejected') w.win.negoResolve(c, ch.id, 'rejected',
      { side: 'owner', by: ME.name, reply: 'The co-packer is named in the master agreement.' });
    return { c, ch };
  };

  test('the tag is an id and one glyph — the words move to the title', async () => {
    const w = world();
    const { ch } = await staged(w, 'accepted');
    const html = w.win.rlAskTagHtml(ch, 'owner');
    const text = html.replace(/<[^>]+>/g, '');
    assert.match(text, new RegExp(ch.id), 'the id is on the tag');
    assert.ok(!/Their ask|adopted/.test(text), 'and the words are not');
    assert.match(html, /title="[^"]*Their ask[^"]*adopted/, 'they are on the title');
  });

  test('all four states have a glyph, and pending is told from withdrawn', async () => {
    const w = world();
    const g = w.win.rlAskGlyph;
    assert.equal(g({ status: 'accepted' }), '&#10003;');
    assert.equal(g({ status: 'rejected' }), '&#10007;');
    assert.equal(g({ status: 'pending' }), '?');
    assert.notEqual(g({ status: 'pending', withdrawn: { by: 'x' } }), g({ status: 'pending' }),
      'a bare pill used to mean either of these');
  });

  test('COLOUR IS WHOSE, AND IT NEVER MEANS ANYTHING ELSE', async () => {
    const w = world();
    const { ch } = await staged(w, 'rejected');
    assert.match(w.win.rlAskTagHtml(ch, 'owner'), /rl-cap-them/,
      'a refusal of theirs still shows as theirs');
    assert.match(w.win.rlAskTagHtml(ch, 'counterparty'), /rl-cap-us/,
      'and reads from the other chair as ours');
    assert.ok(!/rl-cap-no|ruby/.test(w.win.rlAskTagHtml(ch, 'owner')),
      'refusal never takes the cap — two refusals would then be indistinguishable');
  });

  test('the side is in words as well as colour', async () => {
    const w = world();
    const { ch } = await staged(w);
    assert.match(w.win.rlAskTagHtml(ch, 'owner'), /title="[^"]*Their ask/);
  });

  test('pressing opens the change under the clause; pressing again closes it', async () => {
    const w = world();
    const { c, ch } = await staged(w);
    assert.equal(w.win.rlAskRevealHtml(c, ch, 'owner', {}), '', 'shut by default');
    w.win.rlAskSetOpen(ch.id);
    const open = w.win.rlAskRevealHtml(c, ch, 'owner', {});
    assert.match(open, /rl-askrv/, 'it opens');
    assert.match(open, new RegExp(ch.id), 'and names the change');
    w.win.rlAskSetOpen(ch.id);
    assert.equal(w.win.rlAskRevealHtml(c, ch, 'owner', {}), '', 'the same press closes it');
    w.win.rlAskResetOpen();
  });

  test('ONE AT A TIME, document-wide', async () => {
    const w = world();
    const c = contract();
    w.win.negoInit(c);
    const a = await w.win.negoEditClause(c, clauseOf(w.win, c, '1').clauseId, '<p>One.</p>',
      { side: 'owner', author: ME.name });
    const b = await w.win.negoEditClause(c, clauseOf(w.win, c, '2').clauseId, '<p>Two.</p>',
      { side: 'owner', author: ME.name });
    w.win.rlAskSetOpen(a.id);
    w.win.rlAskSetOpen(b.id);
    assert.equal(w.win.rlAskRevealHtml(c, a, 'owner', {}), '', 'the first closed when the second opened');
    assert.match(w.win.rlAskRevealHtml(c, b, 'owner', {}), /rl-askrv/);
    w.win.rlAskResetOpen();
  });

  test('a refusal shows what was asked for AND why it was turned down', async () => {
    const w = world();
    const { c, ch } = await staged(w, 'rejected');
    w.win.rlAskSetOpen(ch.id);
    const open = w.win.rlAskRevealHtml(c, ch, 'owner', {});
    assert.match(open, /named in the master agreement/, 'the reason is the half nothing else carries');
    w.win.rlAskResetOpen();
  });

  test('WHO RULED ON IT NEVER REACHES THE OTHER SIDE', async () => {
    /* resolvedBy is stripped from the share payload, and their page mounts this
       very renderer — so this is a real branch, not a theoretical one. The
       REASON does travel: it is the answer to their ask. */
    const w = world();
    const { c, ch } = await staged(w, 'rejected');
    ch.resolvedBy = 'Young Mbagaya';
    w.win.rlAskSetOpen(ch.id);
    const ours = w.win.rlAskRevealHtml(c, ch, 'owner', {});
    const theirs = w.win.rlAskRevealHtml(c, ch, 'counterparty', {});
    assert.match(ours, /Young Mbagaya/, 'our own seat may see who settled it');
    assert.ok(!/Young Mbagaya/.test(theirs), 'their seat never does');
    assert.match(theirs, /named in the master agreement/, 'but the reason is still owed to them');
    w.win.rlAskResetOpen();
  });

  test('the reveal is a posture, not part of the paper', () => {
    const src = read('js/views/negotiation.js');
    assert.match(src, /@media print\{ \.redline-page \.rl-askrv\{display:none\} \}/,
      'it never prints');
  });

  test('and the document draws a tag AND a reveal slot for every change on a clause', async () => {
    const w = world();
    const { c, ch } = await staged(w);
    w.win.rlAskSetOpen(ch.id);
    const doc = w.win.redlineDocHtml(c, { side: 'owner' });
    assert.equal((doc.match(/class="rl-asktag[" ]/g) || []).length, 1);
    assert.equal((doc.match(/data-rl-askrv=/g) || []).length, 1,
      'the open one, in the clause it belongs to');
    w.win.rlAskResetOpen();
  });
});
