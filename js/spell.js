/* ============================================================
   THE SPELL CHECK — HaTi's own, the same on both sides of the table
   (Young picked it 28 Sep 2026, option 2 of three: "implement mirror and
   signing copy plus option 2")
   ============================================================
   The counterparty has no Copilot, and nothing in HaTi checked spelling at
   all: the browser's red underline was switched on in some writing boxes and
   off in others, spoke whatever language the reader's browser was set to, and
   only ever underlined. This is a reading of the words a person has just
   typed, against a dictionary HaTi carries itself. It calls no route, costs
   nothing and never changes a word on its own.

   WHAT IS CHECKED IS THE NEW WORDS ONLY. A word already in the standing
   clause, or in the ask the reader is answering, is not theirs to be told
   about — a typo in the other side's wording is the other side's, and a word
   the contract has used all along is a word the contract uses. So `before`
   is everything that was on the page when the reader started, and only what
   `after` adds is read.

   WHAT IS NEVER A MISTAKE:
     · a word the contract itself uses anywhere — its defined terms, the
       parties' names, the places it names (spellKnownFrom);
     · a word in HaTi's short list of legal words the dictionary lacks
       (SPELL_LEGAL);
     · a number, a word with a digit in it, a reference like 4.2(a), an
       acronym in capitals, and a capitalised word inside a sentence (a name).

   IT STANDS DOWN ON A CONTRACT THAT IS NOT IN ENGLISH. Contract text is never
   translated (TWO LANGUAGES ≠ TWO MARKETS), so a Swedish agreement is typed
   in Swedish, and every word of it would be "misspelt" against an English
   list. Where fewer than SPELL_ENGLISH_MIN of the words already on the page
   are dictionary words, the check answers with nothing to say.

   AN ABSENCE IS STATED, NEVER GUESSED. The word list is 1.2 MB and is fetched
   once, on the first press that needs it (vendor/en-words-1.txt, see
   vendor/README.md). Until it has loaded spellSuspects answers NULL — "not
   checked" — which is a different fact from [] — "checked, nothing found" —
   and each door says which.

   NO ROUTE, NO STORE, NO FIELD. Nothing here is persisted; a word the reader
   chose to leave as it is is remembered for the sitting only. */

/* The file is versioned by NAME: vendor/ is cached hard and never edited in
   place, so a new list is a new file. */
const SPELL_WORDS_SRC = 'vendor/en-words-1.txt';
/* Below this share of dictionary words, the text on the page is taken to be
   in another language and the check stands down. MEASURED on the day: the
   parity fixture's English wording reads 1.00 against this list (names and
   acronyms are left out before counting), and four sentences of an ordinary
   Swedish supply clause read 0.45 — Swedish shares short words with English
   ("under", "i", "fem"), so the bar sits well above that. */
const SPELL_ENGLISH_MIN = 0.6;
/* How many suggestions a word carries. Three is what fits beside a word on
   one line of a 360px rail. */
const SPELL_SUGGEST_MAX = 3;
/* WORDS CONTRACTS USE THAT THE DICTIONARY DOES NOT KNOW. Checked against the
   list the day it was built — each of these was missing from it. Short on
   purpose: anything a contract actually contains is also accepted from the
   contract itself, so this list only has to cover a word typed for the first
   time. Lower case; the reading folds case. */
const SPELL_LEGAL = [
  'counterparty', 'counterparties', 'indemnitor', 'indemnitee', 'indemnitees',
  'licensor', 'sublicense', 'sublicence', 'sublicensee', 'sublicensed',
  'subprocessor', 'subprocessors', 'hereinbefore',
  'mutatis', 'mutandis', 'pari', 'passu', 'alia', 'bona', 'fide',
  'majeure', 'novation', 'novate', 'novated', 'severability',
  'onboarding', 'offboarding', 'kes', 'ksh', 'kra', 'gdpr', 'odpc',
];

let _spellSet = null;          // the dictionary, a Set of lower-case words
let _spellLoading = null;      // the one fetch in flight
let _spellFailed = false;      // the fetch failed this sitting — said, not retried in a loop
const _spellLeft = new Set();  // words the reader chose to leave as they are, this sitting

/* The list, from its text. Split out so a node test can hand it a list of its
   own without a network. */
function spellLoadFrom(text){
  const set = new Set();
  String(text || '').split(/\r?\n/).forEach(w => { const t = w.trim(); if (t) set.add(t); });
  SPELL_LEGAL.forEach(w => set.add(w));
  _spellSet = set;
  _spellFailed = false;
  return set.size;
}
function spellReady(){ return !!_spellSet; }
/* ---- WHERE THE LIST IS, READ OFF THIS FILE'S OWN ADDRESS ----
   The product loads this file as a module from the page at the site's root,
   where the plain relative path is right. A test page one or two folders down
   loads it as a classic script, and there the path is relative to THAT page —
   so a classic load resolves it against the script's own src instead, which
   is the same file wherever the page sits. Read once, at load, because
   document.currentScript only answers while the script is running. */
const _spellSrc = (() => {
  try{
    const cs = (typeof document !== 'undefined') ? document.currentScript : null;
    if (cs && cs.src && typeof URL === 'function') return new URL('../' + SPELL_WORDS_SRC, cs.src).href;
  }catch(_){}
  return SPELL_WORDS_SRC;
})();
/* ---- WHERE THE CHECK STANDS, ASKED WITHOUT WAITING ----
     ready    the list is here: a check answers at once;
     absent   this page has no way to fetch anything (a node stage) — the
              check stands down in silence, because nobody is reading;
     failed   the fetch was tried and did not arrive — the door says so once;
     loading / idle  a press has to wait for the list.
   Asked FIRST by both doors, so a Save only waits where waiting buys a check —
   every other state files in the same breath it always did. */
function spellState(){
  if (_spellSet) return 'ready';
  if (typeof fetch !== 'function') return 'absent';
  if (_spellFailed) return 'failed';
  return _spellLoading ? 'loading' : 'idle';
}
/* Fetched once, on the first press that needs it, and never before: a reader
   who never saves a change never pays for the list. A failure is remembered
   for the sitting so every Save does not wait on the same dead fetch. */
function spellLoad(){
  if (_spellSet) return Promise.resolve(true);
  if (_spellFailed) return Promise.resolve(false);
  if (_spellLoading) return _spellLoading;
  if (typeof fetch !== 'function') return Promise.resolve(false);
  _spellLoading = fetch(_spellSrc)
    .then(r => (r && r.ok) ? r.text() : Promise.reject(new Error('status ' + (r && r.status))))
    .then(t => { spellLoadFrom(t); return true; })
    .catch(() => { _spellFailed = true; return false; })
    .finally(() => { _spellLoading = null; });
  return _spellLoading;
}

/* ---- THE WORDS OF A TEXT ----
   Letters and inner apostrophes and hyphens. Each hyphenated part is its own
   word ("non-exclusive" is two words the dictionary knows). A word carries
   whether it opens a sentence, because a capital there says nothing about
   whether it is a name. */
function spellWords(text){
  const out = [];
  const s = String(text == null ? '' : text).replace(/[‘’]/g, "'");
  const re = /[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ'\-]*[A-Za-zÀ-ɏ]|[A-Za-zÀ-ɏ]/g;
  let m;
  while ((m = re.exec(s))){
    const before = s.slice(0, m.index).replace(/\s+$/, '');
    const opens = !before || /[.!?:;\n(]$/.test(before) || /(^|\s)\(?[0-9ivxlc]+[.)]$/i.test(before);
    m[0].split('-').forEach(part => {
      const w = part.replace(/^'+|'+$/g, '');
      if (w) out.push({ word: w, opens });
    });
  }
  return out;
}
/* The words of a piece of rich wording, as a reader sees them. A block's end is
   a space (so "…Kenya.</p><p>The…" is two words) and an inline tag is nothing
   (so "<b>juris</b>diction" is one); the common entities are read as the
   characters they stand for, or "&nbsp;" would be checked as a word. */
function spellPlain(html){
  return String(html == null ? '' : html)
    .replace(/<\/?(?:p|div|li|ul|ol|h[1-6]|br|tr|td|th|table|blockquote|section)\b[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (m, n) => String.fromCharCode(Number(n)));
}
/* Is this a word the check has no business with? */
function spellSkips(w, opens){
  if (!w || w.length < 2) return true;
  if (/\d/.test(w)) return true;
  if (w.length <= 6 && w === w.toUpperCase()) return true;      // an acronym: KRA, NDA, SLA
  if (!opens && /^[A-Z]/.test(w)) return true;                    // a name inside a sentence
  if (/[À-ɏ]/.test(w)) return true;                    // a word with an accent is a name or another language
  return false;
}
/* The forms a word is looked up under: itself, without a possessive, and
   without the plural/possessive s the list may not carry for a name. */
function _spellForms(w){
  const lw = w.toLowerCase();
  const out = [lw];
  if (/'s$/.test(lw)) out.push(lw.slice(0, -2));
  if (/s'$/.test(lw)) out.push(lw.slice(0, -1));
  return out;
}
/* ---- WHAT THE CONTRACT ITSELF ALREADY SAYS ----
   Every word of its wording, its parties and its name. Read RAW off the
   record — c.redlineText, c.counterparty, c.party, c.name, c.parties — and
   never through a negotiation reader, because READING MUST NOT WRITE. */
function spellKnownFrom(c, more){
  const set = new Set();
  const add = t => spellWords(t).forEach(x => _spellForms(x.word).forEach(f => set.add(f)));
  if (c){
    const strip = h => String(h || '').replace(/<[^>]*>/g, ' ');
    add(strip(c.redlineText));
    add(c.name); add(c.counterparty); add(c.party);
    if (Array.isArray(c.parties)) c.parties.forEach(p => { if (p) { add(p.name); add(p.role); } });
    if (typeof window !== 'undefined' && typeof window.FIRST_PARTY === 'string') add(window.FIRST_PARTY);
  }
  if (more) add(more);
  return set;
}
function spellIsWord(w, known){
  if (!_spellSet) return true;
  return _spellForms(w).some(f => _spellSet.has(f) || (known && known.has(f)) || _spellLeft.has(f));
}
/* ---- IS THIS TEXT IN ENGLISH AT ALL ----
   Share of its words the dictionary knows, names and acronyms left out.
   Fewer than twenty words is too few to judge, and is taken to be English —
   the check is about what is typed, and a two-word clause has no language. */
function spellLooksEnglish(text){
  if (!_spellSet) return true;
  const ws = spellWords(text).filter(x => !spellSkips(x.word, x.opens));
  if (ws.length < 20) return true;
  const hit = ws.filter(x => _spellForms(x.word).some(f => _spellSet.has(f))).length;
  return hit / ws.length >= SPELL_ENGLISH_MIN;
}
/* ---- WHAT IT MIGHT HAVE BEEN ----
   One edit away (a letter dropped, added, swapped with its neighbour or
   changed), then two for a word long enough to have two slips in it. Ranked:
   a word the contract itself uses first, then one that keeps the first
   letter, then the rest in the dictionary's order. Never more than
   SPELL_SUGGEST_MAX, and possibly none — "no suggestion" is an answer. */
const _SPELL_ABC = "abcdefghijklmnopqrstuvwxyz'";
function _spellEdits1(w){
  const out = new Set();
  for (let i = 0; i <= w.length; i++){
    const a = w.slice(0, i), b = w.slice(i);
    if (b) out.add(a + b.slice(1));
    if (b.length > 1) out.add(a + b[1] + b[0] + b.slice(2));
    for (const ch of _SPELL_ABC){
      if (b) out.add(a + ch + b.slice(1));
      out.add(a + ch + b);
    }
  }
  out.delete(w);
  return out;
}
function spellSuggest(word, known){
  if (!_spellSet) return [];
  const lw = String(word || '').toLowerCase();
  const inList = x => _spellSet.has(x) || (known && known.has(x));
  let pool = [..._spellEdits1(lw)].filter(inList);
  if (!pool.length && lw.length >= 5 && lw.length <= 16){
    const two = new Set();
    for (const e of _spellEdits1(lw)) for (const f of _spellEdits1(e)) if (inList(f)) two.add(f);
    pool = [...two];
  }
  const rank = x => (known && known.has(x) ? 0 : 2) + (x[0] === lw[0] ? 0 : 1);
  pool.sort((a, b) => rank(a) - rank(b) || Math.abs(a.length - lw.length) - Math.abs(b.length - lw.length) || (a < b ? -1 : a > b ? 1 : 0));
  /* The reader's own case comes back: "Jurisdicton" → "Jurisdiction". */
  const cased = x => /^[A-Z]/.test(word) ? x[0].toUpperCase() + x.slice(1) : x;
  return pool.slice(0, SPELL_SUGGEST_MAX).map(cased);
}
/* ---- THE ONE READING: WHICH NEW WORDS LOOK MISSPELT ----
   `before` — every word that was on the page when the reader began (the
   clause as it stands, the ask they are answering); `after` — what they are
   about to save. Answers:
     null  not checked (the list has not loaded);
     []    checked, nothing to say (or the text is not English);
     [{ word, suggestions }]  once per distinct word, in the order typed. */
function spellSuspects(before, after, c){
  if (!_spellSet) return null;
  const old = new Set(spellWords(before).map(x => x.word.toLowerCase()));
  if (!spellLooksEnglish(String(before || '') + ' ' + String(after || ''))) return [];
  const known = spellKnownFrom(c, before);
  const seen = new Set();
  const out = [];
  for (const x of spellWords(after)){
    const lw = x.word.toLowerCase();
    if (seen.has(lw) || old.has(lw)) continue;
    seen.add(lw);
    if (spellSkips(x.word, x.opens) || spellIsWord(x.word, known)) continue;
    out.push({ word: x.word, suggestions: spellSuggest(x.word, known) });
  }
  return out;
}
/* The reader looked at it and it stays: this sitting, every box. */
function spellLeave(word){ if (word) _spellLeft.add(String(word).toLowerCase()); }

/* ---- PUTTING THE SUGGESTION IN ----
   Every capitalisation of the word (the list names a word once, however it
   was typed), whole words only, and only in TEXT — never inside a tag or an attribute —
   so a word that is also a class name or a link is never touched. The first
   character's case follows the word being replaced. Two shapes of the same
   act: a string of HTML (the clause editor's draft) and a live element (the
   clause panel's box). */
function _spellWordRe(word){
  const esc = String(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z\\u00C0-\\u024F'])(${esc})(?![A-Za-z\\u00C0-\\u024F'])`, 'gi');
}
function _spellCaseLike(fix, was){
  const f = String(fix || '');
  return /^[A-Z]/.test(was) ? f.charAt(0).toUpperCase() + f.slice(1) : f;
}
function spellFixText(text, word, fix){
  return String(text == null ? '' : text).replace(_spellWordRe(word), (m, pre, w) => pre + _spellCaseLike(fix, w));
}
function spellFixHtml(html, word, fix){
  return String(html == null ? '' : html).split(/(<[^>]*>)/).map(part =>
    part.charAt(0) === '<' ? part : spellFixText(part, word, fix)).join('');
}
function spellFixNode(root, word, fix){
  if (!root || typeof document === 'undefined') return 0;
  let n = 0;
  const walk = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  while (walk.nextNode()) nodes.push(walk.currentNode);
  nodes.forEach(t => {
    const next = spellFixText(t.nodeValue, word, fix);
    if (next !== t.nodeValue){ t.nodeValue = next; n++; }
  });
  return n;
}

/* ---- THE LIST THE READER SEES ----
   One builder for both doors — the clause editor's rail and the clause
   panel's bar — so the two cannot come to say it differently. Inline state
   beside the Save button that was pressed, never a band and never a dialog
   (THE SAP RULE): it appears only when a press found something, and it goes
   the moment the reader acts. Every row is a press: a suggestion puts that
   word in, "Leave it" keeps the word for the sitting; the Save beside it now
   reads "Save as written". */
function _spellT(key, vars){
  try { if (typeof i18t === 'function') return i18t(key, vars || {}); } catch (_){}
  return String(key);
}
function _spellTn(key, n, vars){
  try { if (typeof i18tn === 'function') return i18tn(key, n, vars || {}); } catch (_){}
  return String(key);
}
function _spellEsc(s){
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function spellListHtml(sus){
  if (!Array.isArray(sus) || !sus.length) return '';
  const rows = sus.map(s => `<li class="sp-row"><b class="sp-w">${_spellEsc(s.word)}</b>${
    s.suggestions.length
      ? s.suggestions.map(f => `<button type="button" class="sp-fix" data-sp-fix="${_spellEsc(s.word)}" data-sp-to="${_spellEsc(f)}"
          title="${_spellEsc(_spellT('spl_use_title', { word: s.word, fix: f }))}">${_spellEsc(f)}</button>`).join('')
      : `<span class="sp-none">${_spellEsc(_spellT('spl_no_suggestion'))}</span>`}<button type="button" class="sp-leave" data-sp-leave="${_spellEsc(s.word)}">${
      _spellEsc(_spellT('spl_leave'))}</button></li>`).join('');
  return `<div class="sp-list" role="status" aria-live="polite"><p class="sp-h">${
    _spellEsc(_spellTn('spl_head_n', sus.length, { n: sus.length }))}</p><ul>${rows}</ul></div>`;
}
/* THE CLOTHES FOLLOW THE BUILDER: both doors draw spellListHtml, so the
   dressing is published once, here, and injected once. Tokens only — both
   doors live inside the product's own page, where :root is defined. */
function spellEnsureStyle(){
  if (typeof document === 'undefined' || document.getElementById('sp-style')) return;
  const st = document.createElement('style');
  st.id = 'sp-style';
  st.textContent = `
  .sp-list{font-family:var(--font-body); font-size:var(--t-meta); color:var(--color-text);
    border-top:1px solid var(--color-divider); padding:var(--s-2) 0 0; margin:0}
  .sp-h{margin:0 0 var(--s-1); font-weight:var(--w-strong); color:var(--st-amber-fg)}
  .sp-list ul{list-style:none; margin:0; padding:0; display:grid; gap:4px}
  .sp-row{display:flex; flex-wrap:wrap; align-items:center; gap:6px}
  .sp-w{font-weight:var(--w-strong); text-decoration:underline wavy var(--st-ruby-dot); text-underline-offset:3px}
  .sp-fix,.sp-leave{height:var(--ctl-h-sm); padding:0 8px; border-radius:var(--radius); font:inherit;
    font-size:var(--t-meta); cursor:pointer; white-space:nowrap}
  .sp-fix{border:1px solid var(--color-accent-600); background:var(--color-surface); color:var(--accent-ink)}
  .sp-leave{border:1px solid transparent; background:none; color:var(--color-neutral-600)}
  .sp-fix:focus-visible,.sp-leave:focus-visible{outline:2px solid var(--color-accent-600); outline-offset:1px}
  .sp-none{color:var(--color-neutral-600)}`;
  document.head.appendChild(st);
}

if (typeof window !== 'undefined') Object.assign(window, {
  SPELL_WORDS_SRC, SPELL_ENGLISH_MIN, SPELL_SUGGEST_MAX, SPELL_LEGAL,
  spellLoadFrom, spellReady, spellState, spellLoad, spellWords, spellPlain, spellSkips, spellKnownFrom, spellIsWord,
  spellLooksEnglish, spellSuggest, spellSuspects, spellLeave,
  spellFixText, spellFixHtml, spellFixNode, spellListHtml, spellEnsureStyle,
});
if (typeof module !== 'undefined' && module.exports) module.exports = {
  SPELL_WORDS_SRC, SPELL_ENGLISH_MIN, SPELL_SUGGEST_MAX, SPELL_LEGAL,
  spellLoadFrom, spellReady, spellState, spellLoad, spellWords, spellPlain, spellSkips, spellKnownFrom, spellIsWord,
  spellLooksEnglish, spellSuggest, spellSuspects, spellLeave,
  spellFixText, spellFixHtml, spellFixNode, spellListHtml, spellEnsureStyle,
};
