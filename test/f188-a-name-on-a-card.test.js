/* ============================================================
   f188 — a name on a card is a glance, not a record
   ============================================================
   Owner-asked, 13 Aug 2026: wherever a person's name appears on a change
   card, it is written as first name plus the initial of the surname —
   "Young Mbagaya" reads "Young M."

   TWO THINGS ARE UNDER TEST HERE and they are different claims.

   THE SHORTENER ITSELF, and its edge shapes. There is ONE of it (cardName,
   js/negotiation.js — it lives with the change model rather than with the
   app shell, because every surface that draws a card already stands on that
   module and a shell-level helper was silently absent from every card-only
   harness). A rule copied into two renderers drifts apart the first time
   either is touched, so the tests below reach the one function.

   AND THE BOUNDARY. A card is a glance; a RECORD and a CHOOSER are not. The
   audit trail, the emails, the reviewer picker, the signing route and the
   approval chain all keep the whole name, because "Young M." in a list of
   six colleagues is a guess and in an audit line it is a gap. Those claims
   are asserted here too, from the same world, so shortening a card can never
   quietly reach one of them. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const ME = { id: 'u_me', name: 'Young Mbagaya', role: 'legal', email: 'young@hati.co.ke' };
const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@hati.co.ke' };

function contract(){
  return { id: 'MK-320', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], format: 'text',
    redlineText: ['SERVICES AGREEMENT', '1. SCOPE', '1. The Provider shall store the goods.',
      '2. PAYMENT TERMS', '2. Invoices are payable within thirty (30) days.'].join('\n') };
}
async function ask(win, c, num, body, author){
  const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
  return win.negoEditClause(c, cl.clauseId, body,
    { side: 'owner', author, by: author, summary: 'a change' });
}

/* ============================================================
   1 — THE FOUR SHAPES THAT MUST COME OUT SENSIBLY
   ============================================================ */
describe('f188 (1) — one shortener, and the shapes it must survive', () => {
  const w = () => buildWorld({}).win;

  test('the ordinary case: first name, then the surname as an initial', () => {
    assert.equal(w().cardName('Young Mbagaya'), 'Young M.');
    assert.equal(w().cardName('achieng otieno'), 'achieng O.',
      'the initial is capitalised even where the record is not');
  });

  test('a name with three parts is initialled on the LAST one', () => {
    /* The surname is the last word, not the second. Anything else would
       print a middle name's initial and call it a surname. */
    assert.equal(w().cardName('Amina Wanjiru Kamau'), 'Amina K.');
  });

  test('a single-word name comes back whole — there is no surname to cut', () => {
    assert.equal(w().cardName('Legal'), 'Legal');
    assert.equal(w().cardName('Copilot'), 'Copilot');
  });

  test('a name that is ALREADY an initial gets one dot, not two', () => {
    assert.equal(w().cardName('Young M.'), 'Young M.');
    assert.equal(w().cardName('Young M'), 'Young M.', 'and one is added where it is missing');
  });

  test('an empty name is empty — never a bare " ."', () => {
    const win = w();
    assert.equal(win.cardName(''), '');
    assert.equal(win.cardName('   '), '');
    assert.equal(win.cardName(null), '');
    assert.equal(win.cardName(undefined), '');
  });

  test('A NAME THAT IS THE COMPANY IS NOT INITIALLED', () => {
    /* A counterparty who files under their own company name puts "Nordfrakt
       Logistik AB" in the author field. "Nordfrakt L." is not a shortening
       of that — it is a different company. The caller passes the
       organisation and an equal name comes back whole. */
    const win = w();
    assert.equal(win.cardName('Nordfrakt Logistik AB', 'Nordfrakt Logistik AB'),
      'Nordfrakt Logistik AB');
    assert.equal(win.cardName('nordfrakt logistik ab', 'Nordfrakt Logistik AB'),
      'nordfrakt logistik ab', 'compared without regard to case');
    assert.equal(win.cardName('Erik Lindqvist', 'Nordfrakt Logistik AB'), 'Erik L.',
      'but a person at that company still shortens');
  });

  test('a name that is already a composed LINE comes back whole', () => {
    /* Some records carry "Erik Lindqvist · Nordfrakt Logistik AB" in the
       author field — a person and their company already joined with the same
       separator the card's own meta line uses. Initialling that reads "AB" as
       a surname and prints "Erik A.", who is nobody. */
    assert.equal(w().cardName('Erik Lindqvist · Nordfrakt Logistik AB'),
      'Erik Lindqvist · Nordfrakt Logistik AB');
  });

  test('a surname that does not start with a letter is left alone', () => {
    assert.equal(w().cardName('Young (Legal)'), 'Young (Legal)');
  });
});

/* ============================================================
   2 — AND IT IS ON THE CARDS, ON BOTH RENDERERS
   ============================================================
   The project's own duplication rule: two components draw a change card, and
   a fix in one of them is not a fix in the other. The counterparty's page and
   the phone both mount the first of these two, so they inherit it. */
describe('f188 (2) — both card renderers write the short form', () => {
  async function staged(){
    const w = buildWorld({ user: ME, negotiationView: true });
    const c = contract(); w.win.negoInit(c);
    await ask(w.win, c, '2', '<p>Invoices are payable within forty-five (45) days.</p>', ME.name);
    return { w, c };
  }

  test('the workbench card keeps the whole name on hover, and prints none at all', async () => {
    /* CLAIM UPDATED 16 Aug 2026, one step further in the same direction: the
       card became a routing row and the AUTHOR left its visible line entirely
       — the meta line is the clause name, the coloured edge says whose side,
       and the clause panel's row names the author in full. The rule this
       block exists for still holds where a name IS printed (the contract
       tab's card below), and NOTHING IS LOST here: the whole name is one
       hover away on the row's meta line. */
    const { w, c } = await staged();
    const html = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.ok(!/Young Mbagaya<|Young Mbagaya &middot;|Young M\./.test(html),
      'no name — short or long — as visible text on the row');
    assert.match(html, /title="[^"]*Young Mbagaya/,
      'NOTHING IS LOST: the whole name is one hover away');
  });

  test('the contract tab\'s card does exactly the same, from the same function', async () => {
    const { w, c } = await staged();
    const html = w.win.negoLiveCardsHtml(c, { side: 'owner' });
    assert.match(html, /Young M\./);
    assert.match(html, /title="Young Mbagaya"/);
  });

  test('and the status word that names a reviewer is shortened too', async () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const c = contract(); w.win.negoInit(c);
    const a = await ask(w.win, c, '2', '<p>Payable within forty-five (45) days.</p>', ME.name);
    w.win.getUsers = () => [ME, BOSS];
    w.win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [a.id] });
    const html = w.win.redlineChangeCardsHtml(c, { side: 'owner' });
    assert.match(html, /Achieng O\./, 'the badge names who has it, short');
    assert.match(html, /title="[^"]*Achieng Otieno/, 'and whole on hover');
  });
});

/* ============================================================
   3 — CARDS ONLY: THE RECORD AND THE CHOOSERS KEEP THE WHOLE NAME
   ============================================================ */
describe('f188 (3) — a record and a chooser are not a glance', () => {
  test('the audit trail writes the whole name', async () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const c = contract(); w.win.negoInit(c);
    const a = await ask(w.win, c, '2', '<p>Payable within forty-five (45) days.</p>', ME.name);
    w.win.getUsers = () => [ME, BOSS];
    w.win.reviewAsk(c, { reviewer: BOSS, by: ME.name, ids: [a.id] });
    const trail = (c.audit || []).map(x => x.what || x.text || JSON.stringify(x)).join(' | ');
    assert.match(trail, /Achieng Otieno/,
      'a record that shortens a name is a record with a gap in it');
    assert.ok(!/Achieng O\.(?!tieno)/.test(trail), 'and never the card form');
  });

  test('the reviewer picker offers whole names', () => {
    const w = buildWorld({ user: ME, negotiationView: true });
    const c = contract(); w.win.negoInit(c);
    w.win.getUsers = () => [ME, BOSS];
    const people = w.win.reviewCandidates(c) || [];
    assert.ok(people.length, 'somebody must be offerable');
    assert.ok(people.every(p => !/ [A-Z]\.$/.test(String(p.name || ''))),
      'a chooser must be unambiguous — six colleagues cannot be told apart by an initial');
    assert.ok(people.some(p => p.name === 'Achieng Otieno'));
  });
});
