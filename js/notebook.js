'use strict';
/* ============================================================
   THE NOTEBOOK — DOCUMENTS JAMBO MAY QUOTE (owner's pick "The Legora + Stripe way", 23 Nov 2026)
   ============================================================
   Laws (GDPR, the Data Protection Act), the company's own policies, anyone's own research.
   Two shelves: COMPANY (admins add, everyone reads) and MINE (only its writer sees it, Jambo too
   only when answering them). Both hosts read these pure parts word for word: the server cuts and
   stores, the page draws.

   A DOCUMENT IS CUT INTO SECTIONS WITHOUT AI: by its own headings ("Article 28", "Section 48",
   "§ 4.2", "4.2 …"); a paper with fewer than two headings is cut into pages ("p. 1"). Nothing is
   invented: a section's label is the paper's own number.

   STATUS IS NEVER JAMBO'S: "Up to date" = a person pressed Mark checked in the last
   NB_CHECK_MONTHS (12; owner, 23 Nov 2026); past it HaTi says "Check due" by itself; a document
   Jambo has never quoted says "Not quoted yet". */
const NB_CHECK_MONTHS = 12;
const NB_KINDS = ['law', 'policy', 'research'];
const NB_SHELVES = ['company', 'mine'];
const NB_TEXT_MAX = 200000;          // the readers' own ceiling (EXTRACT_MAX_CHARS); a cut is SAID
const NB_SECTION_MAX = 6000;         // a longer section is carried in parts, each found on its own
const NB_PAGE_CHARS = 2400;          // a paper without headings is read in pages of about this much
const NB_HEAD_RES = [
  [/^(?:article|artikel|art\.)\s*(\d+[a-z]?)\b/i, m => 'Art. ' + m[1]],
  [/^(?:section|sec\.)\s*(\d+[a-z]?)\b/i, m => 's. ' + m[1]],
  [/^§\s*(\d+(?:\.\d+){0,3}[a-z]?)\b/i, m => '§ ' + m[1]],
  [/^(\d{1,3}(?:\.\d{1,3}){0,3})[.)]?\s+(?=\S)/, m => '§ ' + m[1]],
];
/* the paper's own number for a line that opens a section, else null */
function nbHeadOf(line){
  const l = String(line || '').trim();
  if (!l || l.length > 400) return null;
  for (const [re, lab] of NB_HEAD_RES){ const m = l.match(re); if (m) return lab(m); }
  return null;
}
function nbParts(label, head, text){
  const out = [];
  for (let i = 0, k = 0; i < text.length; i += NB_SECTION_MAX, k++)
    out.push({ n: label, head, text: text.slice(i, i + NB_SECTION_MAX), part: k });
  return out.length ? out : [{ n: label, head, text: '', part: 0 }];
}
/* THE ONE CUTTER: text → [{ n, head, text, part }] in the paper's order */
function nbSections(text){
  const lines = String(text == null ? '' : text).replace(/\r/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim());
  const cut = [];
  let cur = null, top = '';
  /* a paper that names its parts (Article, Section) numbers its paragraphs INSIDE them: "3." under
     Article 28 is Art. 28(3), never a section of its own */
  const named = lines.some(l => /^(?:Art\.|s\.) /.test(nbHeadOf(l) || ''));
  for (const l of lines){
    if (!l) continue;
    let lab = nbHeadOf(l);
    if (lab && /^(?:Art\.|s\.) /.test(lab)) top = lab;
    else if (lab && named){ const m = l.match(/^(\d{1,3})[.)]?\s/); lab = (top && m) ? top + '(' + m[1] + ')' : null; }
    if (lab){ if (cur) cut.push(cur); cur = { n: lab, head: l.slice(0, 160), body: [l] }; }
    else if (cur) cur.body.push(l);
    else { cur = { n: '', head: l.slice(0, 160), body: [l] }; }
  }
  if (cur) cut.push(cur);
  const headed = cut.filter(s => s.n);
  if (headed.length >= 2){
    const out = [];
    for (const s of cut) out.push(...nbParts(s.n || 'Start', s.head, s.body.join('\n')));
    return out;
  }
  /* no headings of its own: pages, said as pages */
  const all = lines.filter(Boolean).join('\n'), out = [];
  for (let i = 0, p = 1; i < all.length; p++){
    let end = Math.min(all.length, i + NB_PAGE_CHARS);
    if (end < all.length){ const nl = all.lastIndexOf('\n', end); if (nl > i + NB_PAGE_CHARS / 2) end = nl; }
    const t = all.slice(i, end).trim();
    out.push({ n: 'p. ' + p, head: t.split('\n')[0].slice(0, 160), text: t, part: 0 });
    i = end;
  }
  return out;
}
/* the day `iso` plus NB_CHECK_MONTHS has passed by `today` (both yyyy-mm-dd…) */
function nbCheckDue(checkedAt, today){
  const d = String(checkedAt || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return true;
  const [y, m, dd] = d.split('-').map(Number);
  const due = new Date(Date.UTC(y, m - 1 + NB_CHECK_MONTHS, dd));
  const t = String(today || new Date().toISOString()).slice(0, 10);
  return due.toISOString().slice(0, 10) <= t;
}
/* THE ONE STATUS: 'due' · 'none' · 'ok' */
function nbStatusOf(doc, today){
  if (!doc) return 'none';
  if (nbCheckDue(doc.checkedAt, today)) return 'due';
  if (!(Number(doc.quoted) > 0)) return 'none';
  return 'ok';
}
/* the passage's words as quoted: the first sentence-ish run, at most n characters */
function nbQuoteOf(text, n){
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  const max = n || 160;
  if (t.length <= max) return t;
  const cut = t.slice(0, max), sp = cut.lastIndexOf(' ');
  return (sp > max / 2 ? cut.slice(0, sp) : cut) + ' …';
}

/* a section's own words without its heading's number ("§ 6 No gift…" → "No gift…"; "Article 28\nProcessor\n1. …" →
   "Processor 1. …"): the number is said beside the quote, never twice */
function nbWordsOf(text){
  return String(text || '').replace(/^\s*(?:(?:article|artikel|art\.|section|sec\.)\s*\d+[a-z]?\b|§\s*\d+(?:\.\d+){0,3}[a-z]?\b|\d{1,3}(?:\.\d{1,3}){0,3}[.)]?(?=\s))\s*/i, '').trim();
}
const NB_API = { NB_CHECK_MONTHS, NB_KINDS, NB_SHELVES, NB_TEXT_MAX, NB_SECTION_MAX, NB_PAGE_CHARS,
  nbHeadOf, nbSections, nbCheckDue, nbStatusOf, nbQuoteOf, nbWordsOf };
if (typeof window !== 'undefined') Object.assign(window, NB_API);
if (typeof module !== 'undefined' && module.exports) module.exports = NB_API;
