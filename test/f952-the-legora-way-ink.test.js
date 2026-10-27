/* f952 — THE LEGORA WAY: EVERY WORD 12PX AND UP IS THE INK; ONLY THE SMALL PRINT KEEPS THE GREY (owner's pick, 27 Oct
   2026: "I need to get it darker with regards to regular fonts but the small fonts that are more of note, reminder and
   such can stay grey"; of the three drawn, "Go with The Legora Way")
     1 · the text greys ARE the ink: --color-neutral-500/600, --hb-ink-2 and --hb-mute are #1D1D1F; the small print's
         grey has its own name, --color-quiet / --hb-quiet, #4B4B50 (8.7 to 1 on white, unchanged)
     2 · no rule that sets a small size (11.5px or under, or --t-micro) still colours its words with a text grey token —
         the small print wears --color-quiet, so flipping the greys to ink did not take its grey away
   At the parent (1) fails (the greys were #4B4B50) and (2) fails on 164 rules.
   Run: node --test test/f952-the-legora-way-ink.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const GREY = /var\(--color-neutral-(?:500|600)(?:,\s*#[0-9A-Fa-f]{3,6})?\)|var\(--hb-ink-2\)|var\(--hb-mute\)/;
const small = b => { const m = /font-size\s*:\s*([0-9.]+)px/.exec(b); return (m && Number(m[1]) <= 11.5) || b.includes('var(--t-micro)'); };

test('1 · the text greys are the ink; the small print has its own grey', () => {
  for (const t of ['--color-neutral-500', '--color-neutral-600', '--hb-ink-2', '--hb-mute']) assert.match(INDEX, new RegExp(t + ':#1D1D1F'), t);
  assert.match(INDEX, /--color-quiet:#4B4B50/); assert.match(INDEX, /--hb-quiet:#4B4B50/);
});
test('2 · no small-print rule colours its words with a text grey token (index.html and the views\' own sheets)', () => {
  const files = ['index.html'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f),
    fs.readdirSync(path.join(ROOT, 'js/views')).filter(f => f.endsWith('.js')).map(f => 'js/views/' + f));
  const bad = [];
  for (const f of files){
    const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    for (const m of src.matchAll(/([.#\[a-z][^{}`$\n]*?)\{([^{}`$]*)\}/g)) if (small(m[2]) && GREY.test(m[2])) bad.push(f + ': ' + m[1].trim().slice(0, 60));
  }
  assert.deepEqual(bad, [], bad.slice(0, 12).join('\n'));
});
