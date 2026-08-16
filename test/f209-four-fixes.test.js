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

  test('ONE SEND ALERT — the header\'s own send stands down where the band draws', () => {
    /* Owner-reported 15 Aug 2026: "you sometimes have multiple send alerts.
       There should only be the one highlighted in yellow on top of the redline
       cards." Both were drawn, and they DISAGREED: the header counted
       decisions alone, the band counts decisions AND held proposals, so a
       reader with both saw "Send 1 decision" and "Send all 6" twelve pixels
       apart.

       PORTAL_FOOT_COMPACT is the discriminator and it is exactly right rather
       than merely convenient: renderShareWorkbench sets it and
       renderSharePortal resets it, and the signing screen has no change column
       and therefore no band — so the one screen that still needs the header's
       send is the one screen that still gets it. #pt-nego-send is NOT retired:
       it is the postbox the band proxies and the handler is still bound to it.
       f180's roll call carries the pixel claim; this is the rule. */
    const src = read('js/views/portal.js');
    assert.match(src, /n && !PORTAL_FOOT_COMPACT\s*\?\s*`<button id="pt-nego-send"/,
      'the header send is keyed on the screen, not drawn unconditionally');
    assert.match(src, /getElementById\('pt-nego-send'\)\?\.addEventListener/,
      'and it is still the postbox the handler is bound to');
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

  /* ---- CLAIM REVERSED IN PLACE, 15 Aug 2026 ----
     This used to assert that a refusal STAYS UNTIL IT IS DISMISSED (dwell:0).
     That was my decision when the three kinds were built, and the owner
     overruled it the next day off a screenshot of two red boxes parked over
     the change column: "these alerts should not stick here permanently. they
     should disappear after a few seconds as it previously was the case."

     They were right, and the argument I had made is the one that fails: a
     refusal fires on a PRESS, so the reader is already looking at what they
     pressed — leaving the box up does not make it more read, it makes it
     litter that has to be cleared by hand, and two of them stack. Before the
     three kinds existed every visible toast cleared after 3200ms and nobody
     ever asked for one to stay.

     So the claim is now the opposite, and it is the STRONGER one: no kind may
     have a dwell of zero, ever. A future kind added without one fails here. */
  test('NOTHING STAYS UNTIL DISMISSED — every kind clears itself', () => {
    const src = read('js/core.js');
    const block = src.slice(src.indexOf('const TOAST_KINDS'), src.indexOf('function toast(msg'));
    const kinds = [...block.matchAll(/(\w+):\s*\{[^}]*dwell:\s*(\d+)/g)]
      .map(m => ({ kind:m[1], dwell:Number(m[2]) }));
    assert.ok(kinds.length >= 3, 'all three kinds are in the table');
    for (const k of kinds)
      assert.ok(k.dwell > 0, `${k.kind} must clear itself — dwell was ${k.dwell}`);
    const by = Object.fromEntries(kinds.map(k => [k.kind, k.dwell]));
    assert.ok(by.err > by.ok,
      'a refusal is on screen longer than a confirmation — it has to be read');
    assert.ok(by.warn > by.ok,
      'and something still asking for you outlasts something merely confirming');
    assert.ok(by.err <= 8000, 'but "a few seconds" is the ask, not "a long time"');
    /* And the timer is unconditional at the call site: the old body only set it
       `if(dwell>0)`, which is the line that let dwell:0 pin a box to the page. */
    assert.ok(!/if\s*\(\s*dwell\s*>\s*0\s*\)\s*setTimeout/.test(src),
      'the timer is no longer conditional on a non-zero dwell');
  });

  test('the same refusal twice is one box, not two', () => {
    /* Found beside the report above. Pressing a blocked button twice stacked
       two identical messages; the second said nothing the first had not. Two
       DIFFERENT refusals still both stand — the reported screenshot had two,
       naming different clauses, and both were worth reading. */
    const { w, root } = stage();
    w.win.toast('#CHG-003 was already adopted on this clause.', 'err');
    w.win.toast('#CHG-003 was already adopted on this clause.', 'err');
    assert.equal(root.querySelectorAll('[data-toast-msg]').length, 1,
      'the repeat replaced the first rather than piling on');
    w.win.toast('#CHG-006 was already adopted on this clause.', 'err');
    assert.equal(root.querySelectorAll('[data-toast-msg]').length, 2,
      'but a different refusal is its own message');
  });

  test('every toast can be dismissed by a press', () => {
    const { w, root } = stage();
    w.win.toast('Round 2 published.', 'ok');
    root.firstChild.dispatchEvent(new w.win.MouseEvent('click', { bubbles: true }));
    assert.equal(root.firstChild.style.opacity, '0', 'it is on its way out');
  });

  test('AN ACT THAT TRAVELS CONFIRMS ITSELF — the send said nothing at all', () => {
    /* Reported as "the Send all button does not work". It worked: the wiring
       fix landed and the decisions went. What did not happen was anything on
       screen — the confirmation was a bare call, and a bare call is silent. A
       batch send that clears the cards and says nothing reads as a dead button,
       which is the same complaint arriving by a different road. */
    const portal = read('js/views/portal.js');
    assert.match(portal, /it is now their turn\.`,\s*'ok'\)/,
      'sending decisions to the other company confirms itself');
    assert.match(portal, /they will send a signing link\.`,\s*'ok'\)/,
      'and so does telling them you are ready');
    const nego = read('js/views/negotiation.js');
    assert.match(nego, /the new baseline for round \$\{negoRound\(c\)\}`, 'ok'\)/,
      'and closing a round, which is irreversible');
  });

  test('EVERY DOOR ONTO THE POSTBOX IS DELEGATED, and there is only one mechanism', () => {
    /* The proxy click was wired by scanning #content BEFORE the panes mount, so
       a proxy painted into the column got no handler at all — which is what
       made the band's Send dead. Two mechanisms would be worse than one: a
       proxy reachable by both would publish the round twice. */
    const nego = read('js/views/negotiation.js');
    assert.match(nego, /document\._rlProxyWired/, 'armed once, on the document');
    assert.ok(!/host\.querySelectorAll\('\[data-redline-proxy\]'\)\.forEach\(el =>\s*\n?\s*el\.addEventListener/.test(nego),
      'and the element-bound scan is gone, not kept alongside');
    /* ---- AND IT IS ARMED AT LOAD, NOT INSIDE THE OWNER'S PAGE (15 Aug 2026)
       ----
       The second half of the same fault, and it was CREATED by the first fix.
       Delegating to the document cured the scan but left the arming inside
       renderRedline — which the counterparty never calls; their page is
       renderShareWorkbench. So on their own browser, opening a share link and
       nothing else, the band's Send would have been dead exactly as before.
       A browser check missed it because that harness draws the owner's page
       too, which armed the listener for the whole document.

       Asserted structurally, because that is the shape of the bug: the arming
       must sit at column 0 (module scope) rather than indented inside a
       function body. */
    assert.match(nego, /^if \(typeof document !== 'undefined' && !document\._rlProxyWired\)\{/m,
      'armed at MODULE LOAD, so it belongs to no one page');
    assert.ok(!/^ +if \(typeof document !== 'undefined' && !document\._rlProxyWired\)\{/m.test(nego),
      'and never from inside a renderer — that armed it on the owner\'s seat alone');
  });

  test('THE COUNTERPARTY\'S BAND ACTUALLY POSTS, on a page that never draws ours', async () => {
    /* The claim above, measured rather than read off the source: a portal
       stage renders their workbench and nothing else, they accept, and the
       band's Send — a proxy with no id of its own — puts a decisions response
       on the wire. This is the test that caught the arming fault. */
    const { buildPortal, sharePayloadFor } = require('./portalworld');
    const rec = buildPortal();
    rec.win.promptDialog = async () => '';
    rec.win.persist = () => {}; rec.win.saveContract = () => {};
    rec.win.renderWorkspace = () => {}; rec.win.setView = () => {};
    const c = { id: 'MK-209S', name: 'Warehousing', counterparty: 'Nordfrakt AB',
      template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
      audit: [], rounds: [], versions: [], signatures: [], comments: [],
      redlineText: '1. SCOPE\n1. The Provider shall store the goods.\n'
        + '2. TERMINATION\n2. Either party may terminate on sixty (60) days notice.',
      format: 'text' };
    rec.win.negoInit(c);
    const filed = await rec.win.negoFileProposal(c,
      c.redlineText.replace('sixty (60)', 'ninety (90)'),
      { side: 'owner', author: 'Wanjiru Kamau' });

    const p = buildPortal();
    p.open(sharePayloadFor(p, { ...c }));
    const $ = s => p.win.document.querySelector(s);
    assert.equal($('.rl-unsent-go'), null, 'nothing held, so no band');
    $(`[data-nego-accept="${filed[0].id}"]`).click();
    const go = $('.rl-unsent-go');
    assert.ok(go, 'accepting draws the band on THEIR change column');
    assert.equal(go.getAttribute('data-redline-proxy'), 'nego-send-decisions',
      'aimed at their own postbox, not ours');
    p.setResponderName('Erik Lindqvist');
    await p.pressSel('.rl-unsent-go');
    const sent = p.lastSent();
    assert.ok(sent, 'THE PRESS LANDED — this is what was dead');
    assert.equal(sent.action, 'decisions');
    assert.equal(sent.negoDecisions[0].id, filed[0].id);
    assert.equal(sent.negoDecisions[0].status, 'accepted');
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

  test('and the clause PANEL names every change on the clause', async () => {
    /* REVERSED IN PLACE, 16 Aug 2026: the ask tags have come off the paper
       (owner-asked, "remove the pills from the contracts") and the panel behind
       the Edit pill is where a change is named now — live and settled alike,
       with its wording and its outcome. The population is the same; the surface
       is not. */
    const w = world();
    const { c, ch } = await staged(w);
    const cpSink = [];
    const doc = w.win.redlineDocHtml(c, { side: 'owner', cpSink });
    const panel = cpSink.join('');
    assert.equal((doc.match(/class="rl-asktag[" ]/g) || []).length, 0,
      'no tags on the paper');
    assert.ok(panel.includes(`data-rl-cp-change="${ch.id}"`),
      'and the change is named in the panel, once');
    assert.equal((panel.match(new RegExp(`data-rl-cp-change="${ch.id}"`, 'g')) || []).length, 1,
      'a live ask is on the table and nowhere else — see f210 (3)');
  });
});
