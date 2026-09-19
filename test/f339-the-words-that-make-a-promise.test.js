/* f339 — THE WORDS THAT MAKE A PROMISE (Young ruled 19 Sep 2026, evening)
 *
 *   *"I was asking to highlight only the absolute action guiding key words
 *   that make a clause an obligation."*
 *
 * Then, over a render of the two options: *"Let's go with option 2 … In the
 * plain english contract has an area that says a reading not a contract. Turn
 * that area to a trigger for turning on the amber highlighting."* And on the
 * four decisions the render put to him: yes to all four — off at rest with the
 * count showing, remembered in this browser, the caption to the hover, and the
 * amber BAR stops mentioning obligations.
 *
 * WHAT THIS REVERSES, IN PLACE: the amber added that morning was a bar down
 * the whole clause — a fact about the CLAUSE, wearing the same mark a playbook
 * departure and a risk finding wear. The ask was about the WORDS. So the bar
 * keeps its two judgements, the promise moves onto the wording, and one colour
 * stops saying two things on one screen.
 *
 * WHAT MAKES IT SAFE IS THAT NO MODEL DECIDES WHICH. HaTi already reads duties
 * deterministically — heuristicObligations is what finds a contract's promises
 * when there is no Copilot key — and this borrows that vocabulary, narrowed
 * from the SENTENCE it finds to the VERB PHRASE inside it. It refuses far more
 * than it accepts, and the refusals are measured below against the 50 real
 * agreements already committed for the extraction scorecard.
 *
 * WHAT THIS FILE CANNOT SEE: whether the mark is painted, whether it costs the
 * contract a pixel, whether the switch is where the caption was. Those are
 * PAINT and are driven in five-screenshots-verify. What is pinned here is the
 * machinery and the walls.
 *
 * MEASURED AT THE PARENT (33536a7 for the 19 Sep evening additions;
 * 8cc14ca for the rest): 41 of the original 46 claims RED. The five that pass
 * are the named CONTROLS and WALLS — the corpus fixture, the figures pass this
 * one runs beside, the "no band" sweep that was already true and has to stay
 * true with a switch in that row, and the two walls that say what the route is
 * sent does not move by a byte.
 */
const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CONTRACT = read('js/views/contract.js');
const HTML = read('index.html');
const I18N = read('js/i18n.js');
const OBLIG = read('js/obligations.js');

/* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD — the lesson f213, f334
   and f335 each paid for, twice in one week. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 8);
  const end = rest.search(/\n(?:async )?function \w+\(/);
  return end < 0 ? rest : rest.slice(0, end);
};
/* Comments are prose and the sweeps below read CODE — or a retired name
   quoted in its own gravestone reads as live. */
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const ruleFor = (src, sel) => {
  const at = src.indexOf(sel);
  if (at < 0) return '';
  const open = src.indexOf('{', at);
  const close = src.indexOf('}', open);
  return open < 0 || close < 0 ? '' : src.slice(open + 1, close);
};

const world = () => {
  const w = buildWorld({ contractView: true }).win;
  w.innerWidth = 1440;
  return w;
};

/* ══════════════════════════════════════════════════════════════════════════
   1 — THE PATTERN REFUSES FAR MORE THAN IT ACCEPTS
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (1) — a duty is a modal and an action verb, and nothing else', () => {
  let win;
  before(() => { win = world(); });

  /* Every one of these is a sentence a commercial agreement really writes. */
  const MARKS = [
    ['The Distributor shall pay each valid invoice.', 'shall pay'],
    ['The Supplier must notify the Buyer.', 'must notify'],
    ['The Distributor shall provide a monthly sales statement.', 'shall provide'],
    ['The Distributor shall maintain product liability insurance.', 'shall maintain'],
    ['The Receiving Party shall not disclose Confidential Information.', 'shall not disclose'],
    ['The Contractor agrees to indemnify the Company.', 'agrees to indemnify'],
    ['Each party undertakes to comply with applicable law.', 'undertakes to comply'],
    ['The Distributor is required to submit quarterly forecasts.', 'is required to submit'],
    ['The Seller shall promptly deliver the Goods.', 'shall promptly deliver'],
    ['The Supplier is responsible for all customs duties.', 'is responsible for'],
    ['The Company shall be liable for direct losses only.', 'shall be liable'],
  ];
  const QUIET = [
    'This Agreement shall be governed by the laws of Kenya.',
    'Notice shall be deemed given on receipt.',
    'Clause 12 shall survive termination of this Agreement.',
    'The Buyer shall have the right to inspect the Goods.',
    'Either party may terminate this Agreement on notice.',
    'The total liability shall not exceed the Cap.',
    '"Business Day" shall mean a day other than a Saturday.',
    'This clause shall apply to all Orders.',
    'The parties will discuss the matter in good faith.',
  ];

  test('it marks the verb phrase, never the whole sentence', () => {
    for (const [s, want] of MARKS) {
      win.DOC_DUTY_RE.lastIndex = 0;
      const m = s.match(win.DOC_DUTY_RE);
      assert.ok(m, 'a duty is found in: ' + s);
      assert.equal(m[0].toLowerCase(), want, 'and it is the verb phrase alone');
      assert.ok(m[0].split(/\s+/).length <= 4,
        'a few words, never the sentence: ' + JSON.stringify(m[0]));
    }
  });

  test('and it says NOTHING where the modal creates no duty', () => {
    for (const s of QUIET) {
      win.DOC_DUTY_RE.lastIndex = 0;
      assert.ok(!win.DOC_DUTY_RE.test(s),
        'an absence is stated, never guessed: ' + s);
    }
  });

  test('"may" and "will" are absent, and the reason is written down', () => {
    /* A right is not a duty, and `will` is one of the commonest words in an
       agreement. Both would light half a contract. */
    assert.ok(!win.DOC_DUTY_HEAD.includes('will'), 'will is not a duty modal here');
    assert.ok(!win.DOC_DUTY_HEAD.includes('may'), 'nor may');
    assert.match(CONTRACT, /`will` is deliberately not a modal here/,
      'and the file says why, so it is not put back by accident');
  });

  test('"not" turns a duty into a carve-out on exactly two verbs', () => {
    /* "shall not be liable" is the OPPOSITE of a promise. "shall not disclose"
       is a promise not to do a thing. The difference is a state verb against
       an action verb, and that is why they are two lists. */
    for (const s of ['shall not be liable', 'shall not be responsible',
                     'must not be liable']) {
      win.DOC_DUTY_RE.lastIndex = 0;
      assert.ok(!win.DOC_DUTY_RE.test(s), 'a limitation is not an obligation: ' + s);
    }
    for (const s of ['shall not disclose', 'shall not assign', 'shall not permit']) {
      win.DOC_DUTY_RE.lastIndex = 0;
      assert.ok(win.DOC_DUTY_RE.test(s), 'a negative covenant still is: ' + s);
    }
    assert.deepEqual(win.DOC_DUTY_STATE.slice().sort(),
      ['be liable', 'be responsible'], 'and the state list is exactly those two');
  });

  test('the vocabulary is the product\'s own duty reader, narrowed', () => {
    /* heuristicObligations names five families — payment, notice, reporting,
       delivery, insurance — and is what finds a contract's promises with no
       Copilot key. BORROWED, NEVER INVENTED: one verb from each family has to
       be on this list or the two readings would disagree about what a duty is. */
    for (const v of ['pay', 'invoice', 'remit', 'deliver', 'supply', 'provide',
                     'report', 'notify', 'insure', 'indemnify'])
      assert.ok(win.DOC_DUTY_VERB.includes(v), 'the list carries ' + v);
    assert.match(OBLIG, /function heuristicObligations/,
      'CONTROL — and that reader is still the one this borrows from');
    assert.match(CONTRACT, /heuristicObligations/,
      'named in the note, so the borrowing is traceable');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   2 — MEASURED ON 50 REAL AGREEMENTS
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (2) — the rate on real drafting, and the one it must never mark', () => {
  let win, sents;
  before(() => {
    win = world();
    const corpus = require(path.join(__dirname, 'cuad', 'contracts.json'));
    const text = corpus.data.map(d => d.paragraphs.map(p => p.context).join('\n')).join('\n');
    sents = text.split(/(?<=[.;])\s+/)
      .map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length > 25);
  });

  test('a corpus worth measuring against', () => {
    assert.ok(sents.length > 5000, 'real drafting, not a fixture (' + sents.length + ')');
  });

  test('about one sentence in ten carries a promise — narrow, not blind', () => {
    let hit = 0;
    for (const s of sents) { win.DOC_DUTY_RE.lastIndex = 0; if (win.DOC_DUTY_RE.test(s)) hit++; }
    const pct = 100 * hit / sents.length;
    /* A BAND, not a number: the claim is that this is a narrow reading and not
       a highlighter over the page, and that it is not silent either. Measured
       at 10.2% when it was built. */
    assert.ok(pct > 4 && pct < 20,
      'a duty reading, neither silent nor a wash (' + pct.toFixed(1) + '%)');
  });

  test('"shall not be liable" is 23 hits of real drafting and NONE of them mark', () => {
    let seen = 0, marked = 0;
    for (const s of sents) {
      if (!/shall not be liable/i.test(s)) continue;
      seen++;
      win.DOC_DUTY_RE.lastIndex = 0;
      const m = s.match(win.DOC_DUTY_RE) || [];
      if (m.some(x => /not\s+be\s+liable/i.test(x))) marked++;
    }
    assert.ok(seen > 5, 'the corpus really does say it (' + seen + ')');
    assert.equal(marked, 0, 'and a limitation is never lit as a promise');
  });

  test('every phrase it finds is short, and carries no markup', () => {
    /* THE WALL. This pass runs over text the FIGURES pass has already marked
       up, so a match that could straddle a tag would emit crossing tags. */
    for (const s of sents) {
      win.DOC_DUTY_RE.lastIndex = 0;
      for (const m of (s.match(win.DOC_DUTY_RE) || [])) {
        assert.ok(!/[<>&]/.test(m), 'no markup in a match: ' + JSON.stringify(m));
        assert.ok(m.split(/\s+/).length <= 5, 'a phrase, not a clause: ' + JSON.stringify(m));
      }
    }
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   3 — THE WALL, DRIVEN: THE TWO PASSES DO NOT COLLIDE
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (3) — the mark can never straddle a tag', () => {
  let win;
  before(() => { win = world(); });

  /* THIS STAGE HAS NO js/ai.js, so docReadMark falls back to the escape alone
     and the two passes cannot be driven meeting here. That meeting is driven
     in five-screenshots-verify, on the real app, where both are loaded. What
     is asked here is the WALL under it: a letters-and-spaces pattern stops
     dead at a `<`, so a match can never span the markup the figures pass has
     already written. */
  const ok = html => {
    const stack = [];
    for (const m of html.matchAll(/<(\/?)(\w+)[^>]*>/g)) {
      if (m[1]) assert.equal(stack.pop(), m[2], 'closes what it opened: ' + html);
      else stack.push(m[2]);
    }
    assert.equal(stack.length, 0, 'and nothing is left open: ' + html);
  };

  test('a duty split by a tag is NOT found — it refuses rather than crossing', () => {
    const out = win.docDutyMark('The Buyer shall <b class="br-fig">pay</b> on demand.');
    assert.ok(!/dr-duty/.test(out), 'no mark, rather than two crossing tags');
    assert.equal(out, 'The Buyer shall <b class="br-fig">pay</b> on demand.',
      'and the markup handed in is handed straight back');
  });

  test('no pattern here can ever contain markup', () => {
    /* The first wall, stated as a property of the lists themselves. */
    for (const w of [...win.DOC_DUTY_HEAD, ...win.DOC_DUTY_VERB, ...win.DOC_DUTY_STATE])
      assert.ok(/^[a-z -]+$/.test(w), 'letters, spaces and hyphens only: ' + JSON.stringify(w));
  });

  test('and the replacer refuses a match carrying any, as the second wall', () => {
    const b = fnBody(CONTRACT, 'docDutyMark');
    assert.match(b, /\/\[<>&\]\/\.test\(m\) \? m :/,
      'a match with markup in it is left exactly as it was');
  });

  test('it marks over escaped text and stays well formed', () => {
    const out = win.docDutyMark(win.docReadMark(
      'The Supplier shall pay <script>alert(1)</script> on demand.'));
    assert.ok(!/<script/.test(out), 'the escape upstream still holds');
    assert.match(out, /class="dr-duty">shall pay</, 'and the duty still marks');
    ok(out);
  });

  test('the entries compose the two passes in that order, once', () => {
    /* The figures pass runs FIRST and escapes; the duty pass runs over its
       output. The other order would escape the duty spans. */
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /dutyOn\?docDutyMark\(docReadMark\(body\)\):docReadMark\(body\)/,
      'figures then duties, and only where the reader asked for the marks');
  });

  test('CONTROL — docReadMark itself does not mark duties', () => {
    const before = win.docReadMark('The Buyer shall pay on time.');
    assert.ok(!/dr-duty/.test(before), 'the two passes stay two passes');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4 — THE SWITCH IS THE CAPTION SLOT
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (4) — the caption slot is the trigger', () => {
  test('"a reading, not the contract" is the hover on the label, not a line', () => {
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /class="doc-read-lbl" title="\$\{esc\(i18t\('ct_read_cap'\)\)\}"/,
      'the caveat rides the label it was always about');
    assert.ok(!/<em>\$\{esc\(i18t\('ct_read_cap'\)\)\}<\/em>/.test(body),
      'and no longer takes the slot the switch needs');
  });

  test('the switch is drawn in that slot, and carries the count', () => {
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /class="doc-read-duty" data-doc-read-duty/, 'the press is there');
    assert.match(body, /aria-pressed="\$\{dutyOn\}"/, 'and says its state out loud');
    assert.match(body, /i18tn\('ct_duty_switch',dutyN,\{n:dutyN\}\)/,
      'the count is ON the face — a press whose effect you cannot predict is one nobody makes');
  });

  test('at zero it is not drawn at all', () => {
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /\$\{dutyN\?`<button type="button" class="doc-read-duty"/,
      'a verb that cannot work is not drawn — this product\'s rule everywhere');
    assert.match(body, /const dutyOn=dutyN\?docDutyOn\(\):false/,
      'and nothing reads as pressed where there is nothing to press');
  });

  test('it rides the layer\'s ONE listener, not a listener on the button', () => {
    /* The head is rebuilt with every paint, so a listener bound to the button
       dies on the first press — the fault this file would otherwise be the
       fourth to record. */
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /closest\('\[data-doc-read-duty\]'\)/, 'delegated');
    assert.match(body, /layer\.dataset\.docReadAgain/, 'on the layer, armed once');
    const at = body.indexOf("closest('[data-doc-read-duty]')");
    const armed = body.indexOf('layer.dataset.docReadAgain');
    assert.ok(armed > -1 && at > armed, 'inside that one armed block');
    assert.match(body, /docReadPaint\(layer\._docReadC\|\|c\)/,
      'and it repaints the contract painted LAST, never the one it was armed on');
  });

  test('no band, no strip, no second row', () => {
    /* NO NEW BANDS ON THE PAGE. The slot was already drawn; the switch takes
       the place of a sentence. */
    const body = strip(fnBody(CONTRACT, 'docReadPaint'));
    assert.ok(!/class="[^"]*\b(band|strip|banner|notice|callout|tip)\b/.test(body),
      'nothing new above the reading');
    assert.equal((body.match(/class="doc-read-head"/g) || []).length, 1,
      'and still exactly one head row');
  });

  /* ---- REVERSED IN PLACE, 19 Sep 2026 (Young ruled it) ----
     This asked the switch to opt OUT of the head's label treatment: the label
     SIZE, no letter-spacing, no capitals. *"Make Highlight obligations to be
     in Capital letters but Not [bold]."* It opts out of ONE declaration now —
     the weight — and takes the rest of the row, so the switch is the same
     label as PLAIN ENGLISH beside it in body weight. The quiet-press half
     (no fill, no edge) is unchanged and still asserted. */
  test('the clothes are the row\'s own label treatment, in body weight', () => {
    const r = ruleFor(HTML, '.doc-read-duty{').replace(/\s+/g, ' ');
    const em = ruleFor(HTML, '.doc-read-head em{').replace(/\s+/g, ' ');
    assert.ok(r.includes('margin-left:auto'), 'it still takes the caption\'s slot');
    assert.ok(r.includes('font:inherit'),
      'and the row\'s own font, which is what makes the rest a RELATION');
    assert.ok(r.includes('font-weight:var(--w-body)'),
      'the ONE opt-out the owner kept');
    for (const d of ['font-size:var(--t-label)', 'letter-spacing:0'])
      assert.ok(!r.includes(d), 'no longer opts out of the row\'s ' + d);
    assert.ok(!/text-transform:none/.test(r), 'and not out of its capitals');
    assert.ok(em.includes('margin-left:auto'),
      'CONTROL — and that is the slot it took, stated by the rule it replaced');
    assert.ok(/background:none/.test(r) && /border:0/.test(r),
      'a quiet press, never a filled control beside a contract');
  });

  test('INHERITANCE IS NOT A CASCADE CONTEST — the capitals are NAMED', () => {
    /* `button,select{text-transform:none}` is in the compiled Tailwind
       preflight and beats inheritance, so the head's uppercase never reached
       this button. `inherit` rather than the word, so the switch and the label
       cannot drift. The third costume of this fault in this codebase. */
    const r = ruleFor(HTML, '.doc-read-duty{').replace(/\s+/g, ' ');
    assert.ok(r.includes('text-transform:inherit'),
      'named, and named as a relation');
    assert.match(HTML, /button,select\{text-transform:none\}/,
      'CONTROL — because that is what was beating it');
  });

  test('the box is a SQUARE with a check in it, not a ring', () => {
    const t = ruleFor(HTML, '.doc-read-duty .dr-tick{').replace(/\s+/g, ' ');
    assert.ok(t, 'the tick-box has a rule');
    assert.ok(t.includes('border-radius:var(--radius)'),
      'the platform\'s own corner, which is what square means here');
    assert.ok(!/border-radius:50%/.test(t), 'never a circle again');
    assert.ok(/width:12px/.test(t) && /height:12px/.test(t), 'and it is square');
    assert.ok(!HTML.includes('.doc-read-duty .dr-ring'),
      '`.dr-ring` is gone from this switch, not left drawing beside it');
    assert.match(CONTRACT, /class="dr-tick"[^>]*><svg[^>]*><use href="#i-check"\/><\/svg>/,
      'and the mark is the product\'s OWN check symbol');
  });

  test('the check is in the markup at BOTH states, so a press moves nothing', () => {
    const t = ruleFor(HTML, '.doc-read-duty .dr-tick{').replace(/\s+/g, ' ');
    const on = ruleFor(HTML, '.doc-read-duty[aria-pressed="true"] .dr-tick{').replace(/\s+/g, ' ');
    assert.ok(t.includes('color:transparent'), 'invisible at rest');
    assert.ok(on.includes('color:#2A1B04'), 'and inked when pressed');
    /* ONE LITERAL, BORROWED: #hdr-notify-dot is the one other place this
       product puts ink on --st-amber-dot, and that token is the same colour in
       both themes, so a theme-aware token above it would be the wrong answer. */
    assert.match(HTML, /background:var\(--st-amber-dot\);\s*\n?\s*color:#2A1B04/,
      'CONTROL — the same pair #hdr-notify-dot states');
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.equal((body.match(/#i-check/g) || []).length, 1,
      'one symbol, drawn once, whatever the state');
  });

  test('the state is not colour alone', () => {
    const on = ruleFor(HTML, '.doc-read-duty[aria-pressed="true"]{').replace(/\s+/g, ' ');
    const tick = ruleFor(HTML, '.doc-read-duty[aria-pressed="true"] .dr-tick{').replace(/\s+/g, ' ');
    assert.ok(tick.includes('background:var(--st-amber-dot)'), 'the box fills');
    assert.ok(!/font-weight/.test(on),
      'and the weight never moves — a heavier word would shuffle the row under the reader\'s hand');
  });

  test('the two sheets start at one height, off ONE token', () => {
    /* Young, 19 Sep 2026: "the top edge of the contract pages do not start
       from the same point." MEASURED at the parent against the grid's own top:
       the cream sheet at 4 and this card at 0. The 4 is #doc-scroll's own
       padding-top, so the card reads that token rather than a literal, and it
       is the CARD that came down to the paper — refusal 3 by construction. */
    const at = CONTRACT.indexOf('<div id="doc-read"');
    assert.ok(at > 0, 'the card is mounted there');
    const tag = CONTRACT.slice(at, at + 220);
    assert.match(tag, /inset:var\(--s-1\) 0 0/,
      'the same token #doc-scroll pads with, never a literal 4');
    assert.ok(!/inset:0/.test(tag), 'and no longer flush with the grid');
    assert.match(CONTRACT, /padding:var\(--s-1\) 2px var\(--s-6\)/,
      'CONTROL — which is the padding it is matching');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   5 — OFF AT REST, REMEMBERED IN THIS BROWSER
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (5) — Young\'s two rulings on the switch itself', () => {
  let win;
  before(() => { win = world(); });

  test('off at rest, so the first thing a reader meets is the reading', () => {
    try { win.localStorage.removeItem(win.DOC_DUTY_KEY); } catch (_) { /* fine */ }
    assert.equal(win.docDutyOn(), false, 'nothing stored means no marks');
  });

  test('remembered in this browser, exactly as the switch above it is', () => {
    win.docDutySet(true);
    assert.equal(win.docDutyOn(), true, 'the choice sticks');
    assert.equal(win.localStorage.getItem(win.DOC_DUTY_KEY), '1');
    win.docDutySet(false);
    assert.equal(win.docDutyOn(), false, 'and comes back off');
  });

  test('it is a hati.v1 key of its own, never the reading switch\'s', () => {
    assert.match(win.DOC_DUTY_KEY, /^hati\.v1\./, 'the product\'s own namespace');
    assert.notEqual(win.DOC_DUTY_KEY, win.DOC_READ_KEY,
      'two choices, two keys — or turning the marks off would close the column');
  });

  test('a browser that refuses storage still draws the page', () => {
    /* A private window, cleared site data, a full quota: every read and write
       is wrapped, and the honest answer is "off". */
    const b = fnBody(CONTRACT, 'docDutyOn');
    assert.match(b, /try\{/, 'the read is wrapped');
    assert.match(b, /catch\(_\)\{ return false; \}/, 'and answers off rather than throwing');
    assert.match(fnBody(CONTRACT, 'docDutySet'), /try\{[\s\S]*catch\(_\)\{\}/,
      'and so is the write');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   6 — THE BAR STOPS MENTIONING OBLIGATIONS
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (6) — one colour, one meaning', () => {
  test('docReadFlags is the playbook and the scan, and nothing else', () => {
    const b = strip(fnBody(CONTRACT, 'docReadFlags'));
    assert.match(b, /ct_read_watch_pb/, 'your playbook disagreed');
    assert.match(b, /ct_read_watch_scan/, 'the risk scan flagged it');
    assert.ok(!/ct_read_watch_oblig/.test(b),
      'and a promise is no longer a fact about the clause — it is on the words');
    assert.ok(!/c\.obligations/.test(b), 'it does not read the obligations at all');
    assert.ok(!/obState/.test(b), 'nor their state');
  });

  test('the key is STALE, not deleted — inert in BOTH books', () => {
    /* A key removed from one dictionary and not the other leaves a screen half
       English. Retired by not being called. */
    assert.equal((I18N.match(/ct_read_watch_oblig:/g) || []).length, 2,
      'still in English and Swedish');
    assert.ok(!/ct_read_watch_oblig/.test(strip(CONTRACT)),
      'and called from nowhere');
  });

  test('the reason is written beside the code, so it is not put back', () => {
    assert.match(CONTRACT, /AND A PROMISE IS NOT ONE OF THEM/,
      'the ruling sits where the next reader will find it');
    assert.match(CONTRACT, /colour would be saying two things on one screen/,
      'with the reason, not just the decision');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   7 — THE PAPER IS MARKED, NEVER WRITTEN ON
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (7) — the marks are painted after the canvas and come off clean', () => {
  let win, doc;
  const PAPER = [
    '<h2>7. Payment</h2>',
    '<p>The Distributor shall pay each valid invoice within thirty (30) days of the invoice date.</p>',
    '<p>The Supplier shall not be liable for any indirect loss.</p>',
    '<h2>8. Reporting</h2>',
    '<p>The Distributor shall provide a monthly sales statement.</p>',
  ].join('');
  const stage = html => {
    let canvas = doc.getElementById('doc-canvas');
    if (!canvas) { canvas = doc.createElement('div'); canvas.id = 'doc-canvas'; doc.body.appendChild(canvas); }
    canvas.innerHTML = html;
    return canvas;
  };
  before(() => { win = world(); doc = win.document; });

  test('it marks the duty phrases on the sheet', () => {
    const canvas = stage(PAPER);
    const n = win.docDutyPaperPaint(true);
    assert.equal(n, 2, 'two promises on this paper, and the limitation is not one');
    const lit = [...canvas.querySelectorAll('span.' + win.DOC_DUTY_PAPER_CLASS)]
      .map(s => s.textContent.toLowerCase());
    assert.ok(lit.includes('shall pay'), 'the payment duty');
    assert.ok(lit.includes('shall provide'), 'the reporting duty');
    assert.ok(!lit.some(x => /not be liable/.test(x)), 'and never the limitation');
  });

  test('NOT ONE CHARACTER OF THE WORDING MOVES', () => {
    const canvas = stage(PAPER);
    const before = canvas.textContent;
    win.docDutyPaperPaint(true);
    assert.equal(canvas.textContent, before,
      'the drafter\'s paper reads exactly as it read — this is a mark, not an edit');
  });

  test('and it comes off whole, leaving the markup as it was', () => {
    const canvas = stage(PAPER);
    const before = canvas.innerHTML;
    win.docDutyPaperPaint(true);
    assert.notEqual(canvas.innerHTML, before, 'the marks really went on');
    win.docDutyPaperPaint(false);
    assert.equal(canvas.innerHTML, before,
      'and off again byte for byte — nothing is left on the paper');
  });

  test('pressing it twice does not stack marks', () => {
    const canvas = stage(PAPER);
    win.docDutyPaperPaint(true);
    const once = canvas.querySelectorAll('span.' + win.DOC_DUTY_PAPER_CLASS).length;
    win.docDutyPaperPaint(true);
    assert.equal(canvas.querySelectorAll('span.' + win.DOC_DUTY_PAPER_CLASS).length, once,
      'the clear runs first, always');
    assert.ok(!canvas.querySelector('span.' + win.DOC_DUTY_PAPER_CLASS + ' span.' + win.DOC_DUTY_PAPER_CLASS),
      'and never a mark inside a mark');
  });

  test('a mark never crosses an element boundary', () => {
    /* redlineHangHtml's own rule, for the same reason: it refuses rather than
       emitting crossing tags. A phrase split across a <strong> is not found. */
    const canvas = stage('<p>The Buyer <strong>shall</strong> pay on demand.</p>');
    win.docDutyPaperPaint(true);
    assert.equal(canvas.querySelectorAll('span.' + win.DOC_DUTY_PAPER_CLASS).length, 0,
      'found inside ONE text node or not found at all');
    assert.equal(canvas.textContent, 'The Buyer shall pay on demand.',
      'and the wording is untouched either way');
  });

  test('it never writes into a box the reader types in', () => {
    const canvas = stage('<p>The Buyer shall pay <input class="field" value="x"> on demand.</p>'
      + '<p>The Seller shall deliver the Goods.</p>');
    win.docDutyPaperPaint(true);
    const skip = win.DOC_DUTY_PAPER_SKIP || '';
    assert.ok(canvas.querySelectorAll('span.' + win.DOC_DUTY_PAPER_CLASS).length >= 1,
      'the paper around it still marks');
    assert.ok(!canvas.querySelector('input span'), 'and nothing was written into the box');
    assert.match(fnBody(CONTRACT, 'docDutyPaperPaint'), /DOC_DUTY_PAPER_SKIP/,
      'the skip list is asked by name');
    assert.ok(/input/.test(skip) && /textarea/.test(skip) && /contenteditable/.test(skip),
      'and it names every place a reader types');
  });

  test('the span\'s text is set with textContent, never innerHTML', () => {
    /* The one wall that makes writing into the drafter's own page safe. */
    const b = fnBody(CONTRACT, 'docDutyPaperPaint');
    assert.match(b, /sp\.textContent=txt\.slice\(s,e\)/, 'text in, text out');
    assert.ok(!/innerHTML/.test(b), 'nothing on the paper can introduce markup');
  });

  test('a contract with nothing to mark leaves the page alone', () => {
    const canvas = stage('<h2>3. Interpretation</h2><p>Headings do not affect interpretation.</p>');
    const before = canvas.innerHTML;
    assert.equal(win.docDutyPaperPaint(true), 0, 'nothing found');
    assert.equal(canvas.innerHTML, before, 'and nothing changed');
  });

  test('the marks come off on the way out of the layer, always and first', () => {
    const b = fnBody(CONTRACT, 'docReadPaint');
    assert.match(b, /if\(!on\)\{ docDutyPaperPaint\(false\); layer\.innerHTML=''; return; \}/,
      'leaving for another tab or another contract takes the marks with it');
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   8 — THE COUNT IS HONEST ABOUT BOTH COLUMNS
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (8) — what the number on the switch counts', () => {
  let win;
  before(() => { win = world(); });

  test('it counts clauses, not phrases', () => {
    assert.equal(win.docDutyCount([
      'The Buyer shall pay and shall provide and shall notify.',
      'Headings do not affect interpretation.',
    ]), 1, 'three promises in one clause is one clause');
  });

  test('a clause counts where EITHER column carries the promise', () => {
    /* A reading is a translation, not a transcript: "shall pay" on the paper
       may come back as "must pay" beside it. Counting one column would print
       a number the other contradicts. */
    const body = fnBody(CONTRACT, 'docReadPaint');
    assert.match(body, /const dutyN=docDutyCount\(pairs\.map\(p=>\{/, 'counted off the pairs');
    assert.match(body, /p\.el&&p\.el\.textContent/, 'the wording');
    assert.match(body, /p\.it&&p\.it\.plain/, 'and the reading');
    assert.equal(win.docDutyCount(['must pay on time \n The Buyer shall pay on time.']), 1);
    assert.equal(win.docDutyCount(['a summary with no duty \n The Buyer shall pay on time.']), 1,
      'the wording alone is enough');
  });

  test('it spends nothing and writes nothing', () => {
    const b = strip(fnBody(CONTRACT, 'docDutyCount'));
    /* A SWEEP OVER AN EMPTY STRING PASSES ON NOTHING — the vacuous green this
       codebase has been caught by four times. The reading has to be there
       before the absences in it mean anything. */
    assert.ok(b.includes('DOC_DUTY_RE'), 'the reading is there to sweep');
    for (const bad of ['api(', 'fetch(', 'persist(', 'negoInit', 'toast('])
      assert.ok(!b.includes(bad), 'a reading, and only a reading: ' + bad);
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   9 — THE WALLS THAT HAVE TO KEEP PASSING
   ══════════════════════════════════════════════════════════════════════════ */
describe('f339 (9) — what the route is sent does not move by a byte', () => {
  test('nothing in this feature touches what docReadClauses sends', () => {
    /* WALL. The reading's cache key is a hash of exactly what the route was
       handed. A mark made for the screen that reached that text would make
       every contract already read pay for an identical re-read. */
    const b = strip(fnBody(CONTRACT, 'docReadClauses'));
    for (const n of ['docDutyMark', 'docDutyOn', 'DOC_DUTY_RE', 'docDutyPaperPaint'])
      assert.ok(!b.includes(n), 'the walk does not know this feature exists: ' + n);
  });

  test('WALL — nor does the signature the reading is stamped with', () => {
    const b = strip(fnBody(CONTRACT, 'docReadSig'));
    assert.ok(b.length > 0, 'the reading is there to check');
    for (const n of ['docDuty', 'DOC_DUTY'])
      assert.ok(!b.includes(n), 'the wording signature is the wording\'s alone');
  });

  test('every new name is published, or it is unreachable', () => {
    /* f232's own rule: a top-level function is not a global. */
    const pub = CONTRACT.slice(CONTRACT.lastIndexOf('Object.assign(window'));
    for (const n of ['DOC_DUTY_HEAD', 'DOC_DUTY_VERB', 'DOC_DUTY_STATE', 'DOC_DUTY_RE',
                     'DOC_DUTY_KEY', 'docDutyOn', 'docDutySet', 'docDutyMark', 'docDutyCount',
                     'DOC_DUTY_PAPER_CLASS', 'docDutyPaperClear', 'docDutyPaperPaint'])
      assert.ok(new RegExp('\\b' + n + '\\b').test(pub), n + ' is published');
  });

  test('the new keys are in BOTH books, and say the same thing', () => {
    for (const k of ['ct_duty_switch_one', 'ct_duty_switch_other', 'ct_duty_title'])
      assert.equal((I18N.match(new RegExp(k + ':', 'g')) || []).length, 2,
        k + ' is English and Swedish');
    /* The count's shape is the same in both, or one language prints a number
       the other does not. */
    const en = I18N.match(/ct_duty_switch_other: '([^']*)'/g) || [];
    assert.equal(en.length, 2);
    for (const line of en) assert.match(line, /\{n\}/, 'both carry the count');
  });

  test('the mark is ONE rule for its two homes', () => {
    /* THE CLOTHES FOLLOW THE BUILDER: the reading's span and the one painted
       onto the paper are the same claim and must not drift into two ambers. */
    assert.match(HTML, /\.doc-read-note \.dr-duty, #doc-canvas \.dr-duty-p\{/,
      'one selector, both homes');
    const r = ruleFor(HTML, '.doc-read-note .dr-duty, #doc-canvas .dr-duty-p{').replace(/\s+/g, ' ');
    assert.ok(r.includes('background:var(--st-amber-bg)'), 'the product\'s own amber');
    /* IT COSTS NO LAYOUT, and that is a requirement: the paper half is written
       into the drafter's own text nodes. */
    for (const bad of ['padding', 'margin', 'font-weight', 'font-size', 'border:'])
      assert.ok(!r.includes(bad), 'nothing that moves the wording: ' + bad);
  });
});
