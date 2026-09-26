/* f385 — THE COMPACT BUTTON LADDER (Young picked "Compact" on 26 Sep 2026,
   off the "HaTi Button Audit" page: "Implement compact and merge to main").

   The review measured eleven button heights (22 to 48), three label weights,
   four text sizes, text boxes at 28 to 36 beside buttons at 30, emoji and typed
   arrows standing in for icons, and dialogs whose buttons scrolled away. The
   owner chose the Compact option and the ten alignment rules under it:

     heights 22 · 28 · 32 (row · everyday · large); text boxes 28; text
     12 · 13 · 13px at ONE label weight; side padding 8 · 10 · 12; icons
     14 · 14 · 16; 6px from icon to word and 8px between buttons in a group.

   Each section pins a RELATION where the claim is a relation (a box is the
   button's height; the small rung plus its invisible edge is the minimum
   target) and the numbers only where the owner picked the numbers.

   RED AT THE PARENT (1dae14e, the commit before the ladder): the three rungs
   did not exist, the text-button look did not exist, no dialog foot was found and
   pinned, and a dozen buttons still drew emoji or typed arrows. The claims
   marked [wall] and [control] pass on both sides by design.

   Run: node --test test/f385-the-compact-ladder.test.js */
const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HTML = read('index.html');
const CORE = read('js/core.js');

/* One rule's body, found by its selector at the start of a line. */
const rule = sel => {
  const at = HTML.indexOf('\n  ' + sel + '{');
  assert.ok(at > 0, sel + ' is declared');
  return HTML.slice(at, HTML.indexOf('}', at) + 1);
};
/* A token's declared value, and how many times it is declared at all. */
const tok = name => { const m = HTML.match(new RegExp('--' + name + ':\\s*([^;]+);')); return m && m[1].trim(); };
const declared = name => (HTML.match(new RegExp('--' + name + ':', 'g')) || []).length;
const px = v => Number(String(v).replace(/px$/, ''));

/* Every JS file the desktop product draws from. The phone's own shell
   (js/mobile*.js) was not part of the ask and is left exactly as it was. */
const JS = [
  ...fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && !f.startsWith('mobile')).map(f => 'js/' + f),
  ...fs.readdirSync(path.join(ROOT, 'js', 'views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f),
];

describe('f385 (1) the ladder is three rungs, said once', () => {
  test('the three heights the owner picked, each declared exactly once', () => {
    assert.equal(tok('ctl-h-sm'), '22px', 'the row rung');
    assert.equal(tok('ctl-h'), '28px', 'the everyday rung');
    assert.equal(tok('ctl-h-lg'), '32px', 'the large rung');
    for (const n of ['ctl-h-sm', 'ctl-h', 'ctl-h-lg', 'pad-ctl-x', 'pad-ctl-x-sm', 'pad-ctl-x-lg', 'btn-ic', 'btn-ic-lg', 'btn-gap', 'btn-group-gap'])
      assert.equal(declared(n), 1, '--' + n + ' is said once, so nothing can drift from it');
  });
  test('the side padding and the icons climb with the rung', () => {
    assert.deepEqual([tok('pad-ctl-x-sm'), tok('pad-ctl-x'), tok('pad-ctl-x-lg')].map(px), [8, 10, 12]);
    assert.deepEqual([tok('btn-ic'), tok('btn-ic-lg')].map(px), [14, 16]);
    assert.deepEqual([tok('btn-gap'), tok('btn-group-gap')].map(px), [6, 8], 'icon to word, and button to button');
  });
  test('a text box IS the everyday button\'s height (rule 2), by reference, not by a second number', () => {
    assert.equal(tok('field-h'), 'var(--ctl-h)');
  });
  test('the small rung plus its invisible edge is the minimum target (WCAG 2.5.8)', () => {
    /* The edge is placed against the button's PADDING box, 1px inside its
       border — so what it adds beyond the drawn box is its inset less that
       border. (Measured: -1px added nothing, and a press half a pixel under
       a row's menu landed on the cell behind it.) */
    const edge = rule('.ui-btn-sm::after');
    const inset = Number((edge.match(/inset:(-?\d+)px/) || [])[1]);
    const border = 1;
    assert.ok(Number.isFinite(inset) && -inset > border, 'the edge reaches outside the BORDER, not only to it');
    const target = px(tok('ctl-h-sm')) + 2 * (-inset - border);
    assert.ok(target >= px(tok('tap-min')), `${tok('ctl-h-sm')} drawn + 2 × ${-inset - border}px of edge = ${target} >= ${tok('tap-min')}`);
    assert.match(rule('.ui-btn-sm'), /position:relative/, 'and the edge is placed against the button itself');
  });
});

describe('f385 (2) every rung rule reads its tokens', () => {
  test('the everyday button', () => {
    const at = HTML.indexOf('.ui-btn{display:inline-flex');
    assert.ok(at > 0);
    const base = HTML.slice(at, HTML.indexOf('transition:', at));
    assert.match(base, /min-height:var\(--ctl-h\)/);
    assert.match(base, /padding:0 var\(--pad-ctl-x\)/);
    assert.match(base, /gap:var\(--btn-gap\)/);
    assert.match(base, /font-size:var\(--t-body\)/);
    assert.match(base, /font-weight:var\(--w-label\)/);
    assert.match(rule('.ui-btn > svg'), /width:var\(--btn-ic\);height:var\(--btn-ic\)/);
  });
  test('the row rung and the large rung', () => {
    const sm = rule('.ui-btn-sm');
    assert.match(sm, /min-height:var\(--ctl-h-sm\)/);
    assert.match(sm, /padding:0 var\(--pad-ctl-x-sm\)/);
    assert.match(sm, /font-size:var\(--t-meta\)/);
    const lg = rule('.ui-btn-lg');
    assert.match(lg, /min-height:var\(--ctl-h-lg\)/);
    assert.match(lg, /padding:0 var\(--pad-ctl-x-lg\)/);
    assert.match(rule('.ui-btn-lg > svg'), /width:var\(--btn-ic-lg\)/);
  });
  test('an icon alone is a square of its own rung, whichever rung', () => {
    assert.match(rule('.ui-btn-icon'), /width:var\(--ctl-h\);min-width:var\(--ctl-h\);padding:0/);
    assert.match(rule('.ui-btn-sm.ui-btn-icon'), /width:var\(--ctl-h-sm\)/);
    assert.match(rule('.ui-btn-lg.ui-btn-icon'), /width:var\(--ctl-h-lg\)/);
  });
  /* THE LARGE RUNG IS FOR THE ONE ACT: signing, a first password, an empty
     page's one invitation. So wherever it is drawn it is the filled act —
     the Sign button, which is held back until the list is settled, aside. */
  test('the large rung is spent only on an area\'s one filled act', () => {
    const uses = JS.flatMap(f => [...read(f).matchAll(/class="([^"]*\bui-btn-lg\b[^"]*)"/g)].map(m => ({ f, cls: m[1] })));
    assert.ok(uses.length > 0, 'it is used');
    const odd = uses.filter(u => !/ui-btn-primary/.test(u.cls) && !/sign-held/.test(u.cls));
    assert.deepEqual(odd, [], 'a large button that is not the filled act');
    assert.match(read('js/views/contract.js'), /class="ui-btn ui-btn-lg \$\{ready\|\|saAsk\?'ui-btn-primary':'sign-held'\}"/,
      'the Sign button is one of them');
  });
});

describe('f385 (3) one label weight', () => {
  test('the filled face says which act leads; the weight never does', () => {
    /* Two rules dress the filled face; the later one (the reference's) is the
       one that decides, and neither may state a bold weight. */
    const all = [...HTML.matchAll(/\n  \.ui-btn-primary\{[^}]*\}/g)].map(m => m[0]);
    assert.ok(all.length >= 1);
    assert.match(all[all.length - 1], /font-weight:var\(--w-label\)/);
    for (const r of all) assert.ok(!/font-weight:var\(--w-(title|strong)\)|font-weight:[67]00/.test(r), 'no filled face is bold: ' + r.trim());
    /* AND NOT ON ANY RUNG: the large filled button used to be bold on its own
       (.ui-btn-lg.ui-btn-primary at --w-title), so the Sign button read at a
       different weight from every other filled act. */
    const rungs = [...HTML.matchAll(/\n  \.ui-btn-[a-z]+\.ui-btn-primary\{[^}]*\}/g)].map(m => m[0]);
    for (const r of rungs) assert.ok(!/font-weight/.test(r), 'a rung that makes its filled face bold: ' + r.trim());
    const w = Number(tok('w-label'));
    assert.ok(w >= 500 && w < 600, 'medium, not bold: ' + w);
  });
  test('the switches beside the buttons read at the same weight, and only the lit half stands out', () => {
    assert.match(HTML, /\.doc-read-seg button\{[^}]*font-weight:var\(--w-label\)/);
    assert.match(HTML, /\.doc-read-seg button\[aria-pressed="true"\]\{[^}]*font-weight:var\(--w-title\)/);
    const nego = read('js/views/negotiation-css.js');
    assert.match(nego, /\.rl-head \.rl-segwrap:not\(\.rl-readwrap\) \.rl-seg\{\s*font-size:var\(--t-body\);font-weight:var\(--w-label\)\}/);
    assert.match(read('js/views/calendar.js'), /\.cal-seg span,\.cal-seg a,\.cal-seg button\{[^}]*font-weight:var\(--w-label\)/);
    assert.match(HTML, /\.reg-seg button\{[^}]*font-weight:var\(--w-label\)/, '[control] the Contracts switch already did');
  });
});

describe('f385 (4) text buttons have one look', () => {
  test('.ui-link: the accent, medium, no underline, a real target', () => {
    const l = rule('.ui-link');
    assert.match(l, /min-height:var\(--tap-min\)/);
    assert.match(l, /text-decoration:none/);
    assert.match(l, /color:var\(--accent-ink\)/);
    assert.match(l, /font-weight:var\(--w-label\)/);
    assert.match(rule('.ui-link > svg'), /width:var\(--btn-ic\)/, 'an arrow beside it is drawn, at the rung\'s icon size');
    assert.match(rule('.ui-link.ui-link-danger'), /color:var\(--st-ruby-fg\)/, 'a text button that throws something away takes the refusal\'s ink');
  });
  test('the ones the review named, and the ones found after it, wear it', () => {
    const want = [
      ['js/core.js', /data-sh-copy="\$\{s\.token\}" type="button" class="ui-link"/],
      ['js/core.js', /data-sh-revoke="\$\{s\.token\}" type="button" class="ui-link ui-link-danger"/],
      ['js/review.js', /id="rv-pick-all" class="ui-link"/],
      ['js/views/intelligence.js', /id="igf-ai-regen" type="button" class="ui-link"[^>]*>\$\{icon\('refresh'/],
      ['js/views/intelligence.js', /data-exp-go="unread" type="button" class="ui-link"/],
      ['js/views/register.js', /id="reg-clear-filters" type="button" class="ui-link"/],
      ['js/views/settings.js', /data-sess-revoke="\$\{s\.id\}" type="button" class="ui-link ui-link-danger"/],
      ['js/views/contract.js', /id="sign-paper" type="button" class="ui-link"/],
      ['js/views/portal.js', /id="pt-otp-resend" type="button" class="ui-link"/],
      ['js/ai.js', /data-scan-dismiss="\$\{x\.id\}" type="button" class="ui-link"/],
    ];
    for (const [f, re] of want) assert.match(read(f), re, f);
  });
});

describe('f385 (5) one filled button per area; a repeated row takes the accent\'s ink', () => {
  test('the accent face exists and is written AFTER the reference\'s white face, so it is not beaten by order', () => {
    const face = HTML.indexOf('.ui-btn{color:var(--color-text);background:var(--color-surface)');
    assert.ok(face > 0, 'the reference\'s face');
    assert.ok(HTML.indexOf('.ui-btn.ui-btn-accent:not(.ui-btn-primary){color:var(--accent-ink);}') > face, 'accent after it');
    assert.ok(HTML.indexOf('.ui-btn.ui-btn-danger:not(.ui-btn-primary){color:var(--st-ruby-fg)') > face, 'danger after it');
  });
  test('a list of rows never carries a fill on each row', () => {
    assert.match(read('js/desk.js'), /class="ui-btn ui-btn-sm ui-btn-accent" data-dk-approve=/, 'the desk\'s join requests');
    assert.match(read('js/views/migration.js'), /data-mig-review="\$\{c\.id\}" class="ui-btn ui-btn-sm ui-btn-accent"/, 'the import queue');
    const nego = read('js/views/negotiation.js');
    const card = nego.slice(nego.indexOf('data-pbr-verbs='), nego.indexOf('data-pbr-verbs=') + 3000);
    assert.ok(!/data-pbr-(go|draft|fit|fb|skip)="\$\{i\}" class="[^"]*ui-btn-primary/.test(card), 'the playbook review\'s cards');
    assert.match(read('js/views/library.js'), /ui-btn-sm ui-btn-accent tpl-btn-xs/, '[control] the templates table already did');
  });
});

describe('f385 (6) drawn icons only', () => {
  /* A typed arrow, caret, cross, tick, star or emoji standing in for an icon
     inside a button's own words. Read as a reader does: markup and ${…}
     interpolations out, what is left is what prints. An ellipsis is not in the
     set — "Set a multi-signer order…" is the convention for "opens a dialog",
     not an icon. */
  const GLYPH = /[➤✉📄👤→←↗↻▾▸▼►✕✓✔✗✖★]|&rarr;|&larr;|&times;|&#9662;|&#9656;|&#10005;/;
  /* Named exceptions, each with its reason: whole files, and single buttons
     told apart by a mark in their own markup. */
  const ALLOW_FILES = {
    'js/views/reports.js': 'Reports is not on the rail and the redesign kept it byte-identical (step 12)',
    'js/signature.js': 'the signature pad\'s tabs (★ Saved) are tabs, and the pad is the counterparty\'s too',
  };
  const ALLOW_MARKS = {
    'wz-streams-back': 'the wizard\'s streams picker is kept whole and dormant — nothing draws it',
  };
  const allowed = (f, markup) => !!ALLOW_FILES[f] || Object.keys(ALLOW_MARKS).some(k => markup.includes(k));
  test('no live button draws a typed glyph where an icon belongs', () => {
    const hits = [];
    for (const f of JS) {
      const s = read(f);
      for (const m of s.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) {
        const text = m[1].replace(/\$\{[^}]*\}/g, '').replace(/<[^>]*>/g, '').trim();
        if (text.length > 120 || !GLYPH.test(text)) continue;
        if (allowed(f, m[0])) continue;
        hits.push(f + ':' + s.slice(0, m.index).split('\n').length + ' ' + text.replace(/\s+/g, ' ').slice(0, 40));
      }
    }
    assert.deepEqual(hits, [], 'typed glyphs still in buttons:\n' + hits.join('\n'));
  });
  test('the words that carried a glyph carry none now, in both books', () => {
    const I18N = read('js/i18n.js');
    const KEYS = ['lib_show_all', 'home_go', 'int_clear_all_x', 'int_open_clause_std', 'int_try_again', 'int_open_workspace',
      'int_dep_see_list', 'ct_go_to_checks', 'ng_save_change', 'co_ch_word', 'co_change_details', 'pf_open_arrow', 'ai_show_all_one', 'ai_show_all_other'];
    for (const k of KEYS) {
      const vals = [...I18N.matchAll(new RegExp('\\n    ' + k + ": '([^']*)',", 'g'))].map(x => x[1]);
      assert.equal(vals.length, 2, k + ' in both books');
      for (const v of vals) assert.ok(!GLYPH.test(v) && !/\\u\{1F/.test(v), k + ' still carries a glyph: ' + v);
    }
  });
  test('the icons the sweep needed exist, drawn', () => {
    const C = read('js/components.js');
    for (const k of ['chevU', 'chevL', 'chevD', 'chevR', 'more', 'refresh', 'x', 'send'])
      assert.match(C, new RegExp('\\n  ' + k + ":'<"), k + ' is in the icon set');
    assert.match(read('js/richdoc.js'), /const RICH_BAR_CARET = '<svg[^']*<path d="m4 6 4 4 4-4"\/><\/svg>'/, 'the writing bar\'s caret is drawn too');
    assert.match(HTML, /\.rb-btn \.rb-car svg,\.rb-size \.rb-car svg\{width:9px;height:9px;\}/, 'at its own size, not the tools\' 18');
    assert.ok(!/&#9662;/.test(read('js/richdoc.js')), 'and the typed one is gone');
  });
});

describe('f385 (7) a dialog\'s buttons stay in view while its body scrolls', () => {
  test('a named foot is pinned, Cancel first and the act last, 8px apart', () => {
    const d = rule('.dlg-foot');
    assert.match(d, /position:sticky;bottom:0/);
    assert.match(d, /justify-content:flex-end/);
    assert.match(d, /gap:var\(--btn-group-gap\)/);
  });
  test('an unnamed foot is FOUND in every dialog openModal draws, and pinned the same way', () => {
    assert.match(CORE, /function dlgFootOf\(panel\)\{/);
    assert.match(CORE, /function dlgPinFoot\(panel\)\{/);
    const open = CORE.slice(CORE.indexOf('function openModal('), CORE.indexOf('function closeModalGuarded'));
    assert.match(open, /if\(!opts\.height\) _modalPin = dlgPinFoot\(panel\);/, 'armed by the one door every dialog comes through');
    const close = CORE.slice(CORE.indexOf('function closeModal()'), CORE.indexOf('function closeModal()') + 900);
    assert.match(close, /if\(_modalPin\)\{ try\{ _modalPin\(\); \}catch\(e\)\{\} _modalPin=null; \}/, 'and released on the way out');
    assert.match(rule('.modal-in [data-dlg-foot]'), /position:sticky;bottom:0/);
    assert.match(HTML, /\.modal-in\[data-scrolls\] \[data-dlg-foot\]\{box-shadow:0 -1px 0 var\(--color-divider\)/,
      'the hairline is drawn only while the panel scrolls');
  });
  test('the foot is found by what it is, and a dialog that names its own is left alone', () => {
    const fn = CORE.slice(CORE.indexOf('function dlgFootOf(panel){'), CORE.indexOf('function dlgPinFoot(panel){'));
    assert.match(fn, /classList\.contains\('ui-btn'\)/, 'a row that holds a button of the ladder');
    assert.match(fn, /kids\.every\(k=>isBtn\(k\)\|\|quiet\(k\)\)/, 'and nothing but buttons');
    assert.match(fn, /textContent\.trim\(\)\) return null/, 'with nothing readable after it');
    const pin = CORE.slice(CORE.indexOf('function dlgPinFoot(panel){'), CORE.indexOf('function dlgPinFoot(panel){') + 1400);
    assert.match(pin, /if\(!panel\.querySelector\('\.dlg-foot'\)\)/);
    assert.match(pin, /new MutationObserver\(soon\)/, 're-found when a dialog steps without opening again');
  });
});

describe('f385 (8) text boxes are the everyday height', () => {
  test('every shared field style reads --field-h', () => {
    assert.match(CORE, /const HATI_FLD='width:100%;height:var\(--field-h\);/);
    assert.match(read('js/review.js'), /const RV_FLD = 'width:100%;height:var\(--field-h\);/);
    assert.match(read('js/wizard.js'), /const WZ_ST='width:100%;height:var\(--field-h,28px\);/);
    assert.match(rule('.ui-fld'), /height:var\(--field-h\)/);
    assert.match(read('js/approvals.js'), /const IN='rounded-lg border border-inputln bg-white ui-fld';/, 'the signing order\'s boxes');
    assert.match(rule('.of-amt'), /height:var\(--field-h\)/, 'and a box with a currency in front of it');
  });
});

describe('f385 (9) walls', () => {
  test('[wall] the phone\'s own shell is untouched by the ladder', () => {
    for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.startsWith('mobile') && f.endsWith('.js'))) {
      const s = read('js/' + f);
      assert.ok(!/ui-link|ui-btn-accent|plusLed|--ctl-h-sm/.test(s), f + ' carries none of this change');
    }
  });
  test('[wall] the contract keeps its square corners: no button rule reaches the paper', () => {
    assert.match(HTML, /--radius:4px;/, 'controls keep the 4px corner');
    for (const sel of ['.ui-btn', '.ui-btn-sm', '.ui-btn-lg', '.ui-link', '.dlg-foot']) {
      const at = HTML.indexOf('\n  ' + sel + '{');
      if (at < 0) continue;                        /* a rule this build does not have names nothing */
      assert.ok(!/rl-paper|hati-doc|doc-surface/.test(HTML.slice(at, HTML.indexOf('}', at))), sel + ' names no paper');
    }
  });
});
