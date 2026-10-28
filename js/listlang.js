/* ============================================================
   THE LIST LANGUAGE — one set of parts every list draws (owner, 27 Oct 2026)
   ============================================================
   A pure module: no route, no state, no DOM beyond the markup it returns, so the
   test worlds load it as they are (test/world.js). Read by every list page.
   Contracts "the Legora way", People "the SAP way", the other lists "the same way";
   docs/MAP-HISTORY.md "THE LIST LANGUAGE".
   ONE set of parts every list draws, so a mark means the same on every page:
   - listMarkHtml(tone, kind, title): the mark that leads a row: done (a ticked circle), part (half
     filled), todo (a dashed circle), late (a triangle), wait (a clock), draft (a pen), ask (a question)
   - listWordHtml(tone, text, sub): a reading in words, a dot and a few words, worst news first, with
     an optional grey line under it
   - listChipHtml(tone, text): a soft chip for a KIND (a stream, a kind of request, a rule), never a state
   - listStreamTone(key): one tone per stream, kept off green (signed) and ruby (danger)
   The tones are the house's status tones (--st-<tone>-fg/-bg/-dot) and pink. */
const LIST_MARK_PATHS = {
  done: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  part: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/>',
  todo: '<circle cx="12" cy="12" r="9" stroke-dasharray="3 3"/>',
  late: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  wait: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  draft: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  ask: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'
};
/* its own escaper: a pure module never leans on js/components.js being loaded */
const _lsE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const LIST_TONES = ['green', 'amber', 'ruby', 'steel', 'violet', 'gray', 'pink'];
function _listTone(t){ return LIST_TONES.includes(t) ? t : 'gray'; }
function listMarkHtml(tone, kind, title){
  const t = _listTone(tone), d = LIST_MARK_PATHS[kind] || LIST_MARK_PATHS.todo;
  return `<span class="ls-mark" style="color:var(--st-${t}-dot)"${title ? ` title="${_lsE(title)}"` : ''} aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg></span>`;
}
function listWordHtml(tone, text, sub){
  const t = _listTone(tone);
  return `<span class="ls-word"><span class="ls-word-v" style="color:var(--st-${t}-fg)"><i style="background:var(--st-${t}-dot)"></i>${_lsE(text)}</span>${sub ? `<span class="ls-word-m">${_lsE(sub)}</span>` : ''}</span>`;
}
function listChipHtml(tone, text){
  const t = _listTone(tone);
  return `<span class="ls-chip" style="background:var(--st-${t}-bg);color:var(--st-${t}-fg)" title="${_lsE(text)}">${_lsE(text)}</span>`;
}
const LIST_STREAM_TONES = ['violet', 'steel', 'amber', 'pink', 'gray'];
/* the house's own streams each keep one tone, so two streams side by side never share one; a company's
   own stream takes one by its key */
const LIST_STREAM_FIXED = { proc: 'violet', sales: 'steel', dist: 'amber', mktg: 'pink', corp: 'gray', mfg: 'steel' };
function listStreamTone(key){
  if (LIST_STREAM_FIXED[key]) return LIST_STREAM_FIXED[key];
  let h = 7; for (const ch of String(key || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return LIST_STREAM_TONES[h % LIST_STREAM_TONES.length];
}
/* the initials' own colour, per name, kept off amber and ruby (a person is never a warning) */
const LIST_AVATAR_TONES = ['green', 'steel', 'violet'];
function listAvatarTone(name){
  let h = 7; for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return LIST_AVATAR_TONES[h % LIST_AVATAR_TONES.length];
}
/* OUR STANDARDS, IN WORDS, for a list row: the drawing of js/standards.js's stdRowReading (which counts and
   draws nothing). Worst news first; no stored check is "Not checked yet", never clean. */
function stdRowWordsHtml(c){
  const T = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
  const Tn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v) : T(k, v);
  const r = (typeof stdRowReading === 'function') ? stdRowReading(c) : null;
  if (!r || !r.total) return `<span class="ls-quiet">${T('std_row_unchecked')}</span>`;
  if (typeof listWordHtml !== 'function') return '';
  const of = T('std_row_of', { met: r.met, total: r.total });
  if (r.miss) return listWordHtml('ruby', Tn('std_row_missing', r.miss, { n: r.miss }), (r.off ? Tn('std_row_differ', r.off, { n: r.off }) + ' \u00b7 ' : '') + of);
  if (r.off) return listWordHtml('amber', Tn('std_row_differs', r.off, { n: r.off }), of);
  return listWordHtml('green', T('std_row_all', { n: r.total }));
}
Object.assign(window, { stdRowWordsHtml, LIST_MARK_PATHS, LIST_STREAM_FIXED, listMarkHtml, listWordHtml, listChipHtml, listStreamTone, listAvatarTone });
