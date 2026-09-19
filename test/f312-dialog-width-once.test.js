/* ============================================================
   f312 — A DIALOG STATES ITS WIDTH ONCE, ON THE FRAME
   ============================================================
   Owner-reported 13 Sep 2026, off two screenshots: "this card is poorly
   designed with space not utilised well. Same with image 2. All pop ups
   should always have balance and centered."

   THE FAULT WAS ONE FAULT IN TWO COSTUMES. openModal paints a frame 32rem
   wide and centres it; the two dialogs painted a NARROWER box inside it
   (380px for the question, 460px for the form), and a box narrower than its
   frame sits at the frame's left edge — the blank column the owner circled
   was the difference. Fourteen dialogs carried the same second width.

   THE RULE: the frame is the one place a width is stated. A dialog passes a
   rung of DLG_W (or nothing, which is the M rung) and its box fills the
   frame. This file is the net that keeps it: it reads EVERY openModal call
   in js/ and fails the day one states a width on its inner box again.

   Plus the two dialogs the owner photographed, as they are drawn now: two
   equal tiles for the question; Category and Value stream on one row for the
   form; and "Other" listed ONCE (owner: "other is in the dropdown twice").
   ============================================================ */
const test = require('node:test');
const { describe } = test;
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
};
const JS = walk('js');
const CORE = read('js/core.js');

/* The first tag of what a call opens — `openModal(\`<div …>` — read up to the
   first `>`. A width stated there is the fault. */
const firstTagsOf = src => {
  const out = [];
  const re = /openModal\(\s*`\s*(<[^>]*>)/g;
  let m; while ((m = re.exec(src))) out.push(m[1]);
  return out;
};
/* And the variable-built ones — `const html = \`<div …>` handed to
   openModal(html) — resolved by name within the same file. */
const variableTagsOf = src => {
  const out = [];
  const re = /openModal\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g;
  let m; while ((m = re.exec(src))) {
    const def = new RegExp('(?:const|let|var)\\s+' + m[1].replace(/\$/g, '\\$') + '\\s*=\\s*`\\s*(<[^>]*>)');
    const d = def.exec(src); if (d) out.push(d[1]);
  }
  return out;
};

describe('f312 (1) — the ladder, and the default rung', () => {
  test('DLG_W is four frozen rungs', () => {
    assert.match(CORE, /const DLG_W = Object\.freeze\(\{ s: '400px', m: '520px', l: '640px', xl: '760px' \}\)/);
  });
  test('a dialog that states nothing gets the M rung — never 32rem', () => {
    assert.match(CORE, /const maxw=opts\.maxWidth\|\|DLG_W\.m;/);
    assert.ok(!/opts\.maxWidth\|\|'32rem'/.test(CORE), 'the old default is gone');
  });
  test('DLG_W is published, so a dialog in another module can name its rung', () => {
    const pub = /Object\.assign\(window,\s*\{[^}]*\bDLG_W\b/.test(CORE);
    assert.ok(pub, 'DLG_W is on the publish list beside openModal');
  });
});

describe('f312 (2) — no dialog states a second width on its inner box', () => {
  test('every direct openModal call opens a box with no max-width on it', () => {
    const bad = [], seen = [];
    for (const f of JS) {
      const src = read(f);
      for (const tag of firstTagsOf(src)) {
        seen.push(f);
        if (/max-width/.test(tag)) bad.push(`${f}: ${tag.slice(0, 80)}`);
      }
    }
    assert.ok(seen.length >= 40, `the sweep read ${seen.length} dialogs — an empty sweep cannot pass`);
    assert.deepEqual(bad, [], 'a width on the inner box is the blank-column fault');
  });
  test('and every variable-built one, resolved by name', () => {
    const bad = [];
    for (const f of JS) for (const tag of variableTagsOf(read(f))) if (/max-width/.test(tag)) bad.push(f);
    assert.deepEqual(bad, []);
  });
  /* The padding rule (24 on every side) is a GEOMETRY and is measured on the two
     dialogs the owner photographed in dialog-balance-verify; dialogs that never
     carried a second width keep their own padding and are not swept here. */
  test('the one dialog wider than a short form names its rung on the frame', () => {
    assert.match(read('js/approvals.js'), /<\/div>`, \{ maxWidth: DLG_W\.l \}\);/);
  });
});

/* ---- the two dialogs the owner photographed, rendered ---- */
const capture = () => { const c = { html: null, opts: null }; c.open = (html, opts) => { c.html = html; c.opts = opts || {}; }; return c; };

describe('f312 (3) — the source sheet fills its frame, and asks one question', () => {
  /* ---- RE-POINTED 18 Sep 2026, and the dialog it pinned is GONE ----
     This asked of "What kind of template?" — two tiles, our paper or theirs —
     which is a question nobody can answer before they have seen a word of the
     document. One button now asks the only thing a person knows at that
     moment: WHERE THE WORDS COME FROM, with five answers, and the kind is
     settled by the answer.

     WHAT THIS TEST IS FOR IS UNCHANGED and is still f312's own rule: a dialog
     states its width ONCE, on the frame, and the box inside states none. That
     is the fault f312 exists for — a 380px box in a 512px frame with the blank
     down one side — and it holds for whatever dialog lives here. */
  const stage = () => {
    const cap = capture();
    const w = loadViews(['js/views/library.js'], {
      state: { contracts: [], settings: {}, view: 'templates' },
      tplLibAll: () => ({ canManage: true, templates: [] }),
      openModal: cap.open, closeModal() {}, openCreateTemplateModal() {}, tplLibCreateModal() {},
    });
    w.tplNewMenu();
    return cap;
  };
  test('five sources, one shape each, and no width on the box', () => {
    const cap = stage();
    assert.ok(cap.html, 'the dialog opened');
    assert.equal((cap.html.match(/data-tpl-src="/g) || []).length, 5, 'five answers to one question');
    assert.ok(!/max-width/.test(cap.html), 'the frame states the width; the box states none');
    assert.match(cap.html, /^<div style="padding:24px">/, '24 on every side');
  });
  test('each source carries a mark, its name and its one line; Cancel is the foot’s only control', () => {
    const cap = stage();
    /* A MARK PER SOURCE, pinned as the mark and not as the mechanism: the old
       tiles hand-wrote `<use href="#i-…">` at the sprite, these call the
       product's own icon() helper, and the stage stubs that to a bare <svg>.
       Counting the svg holds for either. */
    assert.equal((cap.html.match(/<svg/g) || []).length, 5, 'a mark per source');
    assert.match(cap.html, /A document I have/); assert.match(cap.html, /blank page/);
    assert.equal((cap.html.match(/class="ui-btn"/g) || []).length, 1, 'Cancel alone in the foot');
    assert.ok(!/ui-btn-primary/.test(cap.html), 'a question has no filled verb');
  });
  test('the dialog says its name to a screen reader', () => {
    const cap = stage();
    assert.equal(cap.opts.label, 'Where do the words come from?');
  });
});

describe('f312 (4) — “New standard template” fills its frame, and “Other” is listed once', () => {
  const stage = fn => {
    const cap = capture();
    const w = loadViews(['js/views/templatelib.js'], {
      state: { contracts: [], settings: {}, view: 'templates' },
      openModal: cap.open, closeModal() {},
      tplStreamOpts: sel => `<option value="proc"${sel === 'proc' ? ' selected' : ''}>Procurement</option>`,
      api: async () => ({}),
    });
    fn(w);
    return cap;
  };
  const cat = (html, id) => { const i = html.indexOf(`id="${id}"`); return html.slice(i, html.indexOf('</select>', i)); };
  test('the create dialog: no width on the box, 24 on every side', () => {
    const cap = stage(w => w.tplLibCreateModal());
    assert.ok(cap.html, 'the dialog opened');
    assert.ok(!/max-width/.test(cap.html));
    assert.match(cap.html, /^\s*<div style="padding:24px">/);
  });
  test('Category and Value stream share one row', () => {
    const cap = stage(w => w.tplLibCreateModal());
    const row = cap.html.slice(cap.html.indexOf('grid-template-columns:repeat(auto-fit,minmax(180px,1fr))'));
    const end = row.indexOf('</div>');
    assert.ok(row.slice(0, end).includes('id="tpllib-cat"') && row.slice(0, end).includes('id="tpllib-stream"'),
      'both selects sit inside the one grid row');
  });
  /* RE-POINTED 17 Sep 2026: the picker gained the create door (`__new__`), so
     the tally is the five built-ins PLUS it. Every other claim here is the
     claim it always was — Other once, first, selected — and the door is
     asserted LAST by name, because a create option that drifted to the top
     would take the default's place. */
  test('“Other” appears ONCE, first, and is the default', () => {
    const cap = stage(w => w.tplLibCreateModal());
    const sel = cat(cap.html, 'tpllib-cat');
    assert.equal((sel.match(/value="other"/g) || []).length, 1, 'once — the owner saw it twice');
    assert.match(sel, /<option value="other" selected>Other<\/option><option value="sales">/, 'first and selected');
    assert.equal((sel.match(/<option /g) || []).length,
      Object.keys({ other: 1, sales: 1, procurement: 1, employment: 1, nda: 1 }).length + 1,
      'the five built-ins and the create door');
    assert.match(sel, /<option value="__new__">[^<]*<\/option>\s*$/,
      'the create door is last, never in the default\'s place');
  });
  test('the details dialog reads the same list: the stored category selected, Other still once and first', () => {
    const cap = stage(w => w.tplLibMetaModal({ id: 't1', name: 'N', category: 'nda', folder: 'proc', description: '' }));
    const sel = cat(cap.html, 'tpllib-m-cat');
    assert.equal((sel.match(/value="other"/g) || []).length, 1);
    assert.match(sel, /^[^>]*>\s*<option value="other">Other<\/option>/, 'Other leads, unselected');
    assert.match(sel, /<option value="nda" selected>NDA<\/option>/);
    assert.ok(!/max-width/.test(cap.html));
    assert.match(cap.html, /id="tpllib-m-stream"/, 'the stream picker is on the same row');
    /* The stream it is filed under stays chosen: the row builder hands the
       record's own folder to the one stream-options reader (tplStreamOpts is
       this module's own, so a stub cannot stand in for it here). */
    assert.match(read('js/views/templatelib.js'), /tplStreamOpts\(folder \|\| ''\)/);
    assert.match(read('js/views/templatelib.js'), /tplLibCatStreamRowHtml\('tpllib-m-cat', 'tpllib-m-stream', t\.category, t\.folder\)/);
  });
  test('the “Other” label is the translated one, so Swedish does not list Övrigt beside Other', () => {
    const src = read('js/views/templatelib.js');
    /* RE-POINTED 17 Sep 2026: the builder reads a LIST of rows now (built-ins
       plus the company's own), so the ternary names the row rather than a key.
       The claim is unchanged and is the one that matters — the word "Other" on
       that option comes from the dictionary, so a Swedish reader is not shown
       Övrigt and Other side by side. */
    assert.match(src, /c\.id === 'other' \? esc\(i18t\('tl_other_category'\)\)/, 'read through the dictionary');
    assert.ok(!/<option value="other">\$\{i18t\('tl_other_category'\)\}<\/option>\$\{cats\}/.test(src), 'the prepended duplicate is gone');
    /* AND THE COMPANY'S OWN CATEGORIES ARE NOT TRANSLATED: a name somebody
       typed is a record, and the getter trap's own rule says a label that is
       also a record keeps the words it was given. */
    assert.match(src, /: esc\(c\.name\)/, "a company's own category prints its own name");
  });
});
