/* ============================================================
   AN NDA'S TWO FACTS — WHO KEEPS IT SECRET, AND UNTIL WHEN
   (owner picked "The tail on the life line", 17 Oct 2026; piece 4 of the
   sensitive contracts and governance plan)
   ============================================================
   An NDA's panel used to look like any other contract's: its first tile said
   "Value — No money passes", and whether one side or both must keep the
   secret, and until when, was nowhere on it. The panel now says both: the
   Value tile reads "Secret until", the life line draws the sharing period and
   then a striped "kept secret" tail with the reminder on it, and the facts
   line says "Mutual NDA: both sides keep it secret".

   THIS FILE IS THE READING, loaded by the BROWSER and the SERVER alike (the
   js/outside.js pattern). It spends nothing, writes nothing and calls no route.

   TWO FACTS, STORED ONCE (`c.nda`), AND ONLY BY A PERSON:
     · dir      'mutual' · 'ours' (we share; they keep ours secret)
                · 'theirs' (they share; we keep theirs secret)
     · ends     the ISO day secrecy ends — or `forGood`, never a made-up date
     · trade    trade secrets stay secret for as long as they are secret
     · clause   the clause it was read from, where the wording said
   READING NEVER WRITES: ndaRead reads the wording (no model, nothing spent) and
   the screens show what it found with a "confirm" mark; c.nda exists only once
   a person has confirmed or set it (ndaSet, the one writer, js/views/boardstrip.js).
   It is OUR reading of the signed paper, like the obligations: it may be
   confirmed after signature (not in EXECUTED_IMMUTABLE) and it never travels
   to the other side (buildSharePayload is an allow-list). */

const NDA_DIRS = ['mutual', 'ours', 'theirs'];
const NDA_ISO = /^\d{4}-\d{2}-\d{2}$/;
const NDA_QUOTE_MAX = 280;
/* the reminder: an ordinary obligation this long before secrecy ends */
const NDA_REMIND_MONTHS = 1;

/* IS THIS AN NDA: HaTi's own NDA standard, a contract type that says so, or a
   name that does ("Vendor NDA — ERP Implementation") */
const NDA_WORDS = /\bNDA\b|non[\s-]?disclosure|confidentiality agreement|sekretessavtal/i;
function ndaIs(c){
  if (!c) return false;
  if (String(c.template || '') === 'ND') return true;
  if (NDA_WORDS.test(String(((c.metadata || {}).contractType) || ''))) return true;
  return NDA_WORDS.test(String(c.name || ''));
}

/* a real day on the calendar: 30 February is not one (Date would roll it on) */
const ndaDayOk = s => { const t = String(s || ''); if (!NDA_ISO.test(t)) return false;
  const d = new Date(t + 'T00:00:00Z'); return !isNaN(d) && d.toISOString().slice(0, 10) === t; };
/* ONE SHAPE, both hosts: what a person confirmed, cleaned; null where nothing is said */
function ndaClean(n){
  if (!n || typeof n !== 'object') return null;
  const dir = NDA_DIRS.includes(n.dir) ? n.dir : '';
  const forGood = n.forGood === true;
  const ends = !forGood && ndaDayOk(n.ends) ? String(n.ends) : '';
  const trade = n.trade === true;
  const clause = String(n.clause == null ? '' : n.clause).replace(/[^0-9A-Za-z.()-]/g, '').slice(0, 12);
  if (!dir && !ends && !forGood) return null;
  const out = { dir, ends, forGood, trade, clause };
  const who = String(n.who == null ? '' : n.who).replace(/\s+/g, ' ').trim().slice(0, 80);
  const at = ndaDayOk(String(n.at || '').slice(0, 10)) ? String(n.at).slice(0, 30) : '';
  const ob = String(n.ob == null ? '' : n.ob).replace(/[^\w-]/g, '').slice(0, 40);
  if (who) out.who = who;
  if (at) out.at = at;
  if (ob) out.ob = ob;
  return out;
}
/* the facts alone — who and when a person said them are not the facts */
function ndaFacts(n){ const x = ndaClean(n); return x ? { dir: x.dir, ends: x.ends, forGood: x.forGood, trade: x.trade, clause: x.clause } : null; }

/* ---- READING THE WORDING ----
   A sentence about confidentiality that gives a period ("shall survive for a
   period of three (3) years following termination"), one that says it lasts
   for good, and one that keeps trade secrets as long as they stay secret; and
   who discloses. Read paragraph by paragraph so the clause it sits in can be
   named. What the wording does not say is left empty — never guessed. */
const NDA_NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  fifteen: 15, eighteen: 18, twenty: 20, 'twenty-four': 24, thirty: 30, 'thirty-six': 36, a: 1, an: 1 };
const NDA_ABOUT = /confidential|non-?disclosure|secrecy|secret|obligations? (?:under|of) (?:this|clause)|surviv/i;
const NDA_PERIOD = /\b(?:for|of|during)\s+(?:a\s+(?:further\s+)?(?:period|term)\s+of\s+)?(?:(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|eighteen|twenty|twenty-four|thirty|thirty-six|\d{1,3})\s*)?(?:\((\d{1,3})\)\s*)?(years?|months?)\s+(?:after|following|from|of)\s+(?:the\s+)?(?:date\s+of\s+)?(termination|expiry|expiration|end|(?:each\s+|such\s+|the\s+)?disclosure|effective\s+date|signature|execution|date\s+(?:hereof|of\s+this\s+agreement))/i;
const NDA_FOREVER = /\b(?:perpetual(?:ly)?|in perpetuity|indefinite(?:ly)?|without (?:any )?limit(?:ation)? (?:of|in|as to) time|for all time)\b/i;
const NDA_TRADE = /trade secrets?/i;
const NDA_HEAD = /^\s*(?:clause\s+|section\s+|article\s+|§\s*)?(\d{1,2}(?:\.\d{1,2}){0,2})[.)]?\s+\S/i;
const NDA_INLINE_HEAD = /(?=\b(?:(?:clause|section|article)\s+\d{1,2}(?:\.\d{1,2}){0,2}[.)]?|\d{1,2}(?:\.\d{1,2}){0,2}[.)])\s+[A-Z])/;
function ndaSentences(p){ return String(p).replace(/\s+/g, ' ').split(/(?<=[.;])\s+(?=[A-Z0-9("“])/); }
/* the sentence as the paper says it: its clause number off, and — where the
   lines ran together — the heading's own title words off ("Duration The
   obligations…" reads "The obligations…") */
function ndaQuote(s, runTogether){
  let t = String(s || '').trim().replace(/^(?:clause\s+|section\s+|article\s+|§\s*)?\d{1,2}(?:\.\d{1,2}){0,2}[.)]?\s+/i, '');
  if (runTogether) t = t.replace(/^.{0,80}?[a-z)](?=(?:The|This|Each|Either|All|Any|Neither|Both|Such)\s)/, '')
    .replace(/^(?:[A-Z][\w&'’-]*\s+){1,6}?(?=(?:The|This|Each|Either|All|Any|Neither|Both|Such|No|A|An)\s)/, '');
  /* a heading's title words run into a definition ("Confidential Information "Confidential …") */
  t = t.replace(/^(?:[A-Z][\w&'’-]*\s+){0,3}[A-Z][\w&'’-]*\s*(?=["“])/, '');
  if (t.length <= NDA_QUOTE_MAX) return t;
  const cut = t.slice(0, NDA_QUOTE_MAX), sp = cut.lastIndexOf(' ');
  return (sp > 80 ? cut.slice(0, sp) : cut) + '…';
}
const ndaNameKey = s => String(s || '').toLowerCase().replace(/\b(?:ltd|limited|plc|inc|llc|ab|the|company|co)\b\.?/g, '').replace(/[^a-z0-9åäöé]+/g, ' ').trim();
function ndaSameParty(a, b){
  const x = ndaNameKey(a), y = ndaNameKey(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y) || y.startsWith(x) || x.split(' ')[0] === y.split(' ')[0];
}
function ndaRead(text, ctx){
  const o = ctx || {};
  const out = { dir: '', period: null, forGood: false, trade: false, clause: '', quote: '', dirClause: '', dirQuote: '' };
  const t = String(text || '').replace(/\r/g, '');
  if (!t.trim()) return out;
  const flat = t.replace(/\s+/g, ' ');
  /* WHO DISCLOSES. A named party defined as the discloser (or the recipient)
     is the one-way reading; then the mutual words. A generic definition
     ("the party disclosing information (the "Disclosing Party")") names no
     party, so a mutual NDA is not mistaken for a one-way one. */
  const named = role => { const re = new RegExp('([A-Z][^"“”()\\n]{1,90}?)\\s*\\(\\s*(?:hereinafter\\s+)?(?:the\\s+)?["“]?' + role + '["”]?\\s*\\)', 'g');
    let m; while ((m = re.exec(t))){ const nm = m[1].replace(/^.*\b(?:between|and|by)\s+/i, '').trim();
      if (o.ours && ndaSameParty(nm, o.ours)) return 'ours';
      if (o.theirs && ndaSameParty(nm, o.theirs)) return 'theirs'; }
    return ''; };
  const disc = named('(?:Disclosing Party|Discloser|Disclosing Company)');
  const recp = disc ? '' : named('(?:Recipient|Receiving Party|Receiver)');
  if (disc) out.dir = disc;
  else if (recp) out.dir = recp === 'ours' ? 'theirs' : 'ours';
  else if (/\bmutual\b/i.test(flat.slice(0, 1500))
    || /\b(?:each|either) party (?:may |will |shall )?(?:disclose|receive)|disclosed by (?:one|either|each) party to the other|by one party to the other\b|both parties (?:may|will|shall) (?:disclose|exchange)|mutual exchange/i.test(flat)) out.dir = 'mutual';
  /* HOW LONG: the first confidentiality sentence with a period, in its clause */
  /* the clauses: by line where the wording keeps its lines, else split where
     a numbered heading starts mid-text ("… agreement. 5. Duration …") — a
     plain reading of a drawn paper runs every line together */
  const lines = t.split(/\n+/).filter(x => x.trim());
  const paras = lines.length >= 3 ? lines : flat.split(NDA_INLINE_HEAD);
  let clause = '';
  for (const para of paras){
    const h = NDA_HEAD.exec(para); if (h) clause = h[1];
    for (const s of ndaSentences(para)){
      if (!NDA_ABOUT.test(s)) continue;
      const tradeHere = NDA_TRADE.test(s);
      if (tradeHere && (/(?:for|so) (?:so |as )?long as|until (?:such )?(?:time as )?(?:it|they|such information) (?:cease|no longer|become)/i.test(s) || NDA_FOREVER.test(s))) out.trade = true;
      if (!out.period && !out.forGood){
        const m = NDA_PERIOD.exec(s);
        if (m){
          const w = String(m[1] || '').toLowerCase();
          const n = Number(m[2]) || Number(w) || NDA_NUM[w] || 0;
          if (n > 0 && n <= 600){
            const from = /disclosure/i.test(m[4]) ? 'disclosure' : /effective|signature|execution|hereof|this\s+agreement/i.test(m[4]) ? 'start' : 'end';
            out.period = { n, unit: /month/i.test(m[3]) ? 'month' : 'year', from };
            out.clause = clause; out.quote = ndaQuote(s, paras !== lines);
            continue;
          }
        }
        /* for good, unless the sentence only keeps trade secrets for good */
        if (NDA_FOREVER.test(s) && !(tradeHere && !/(?:all|any|the) (?:other )?confidential information/i.test(s))){
          out.forGood = true; out.clause = clause; out.quote = ndaQuote(s, paras !== lines);
        }
      }
    }
  }
  /* WHERE "WHO KEEPS IT SECRET" WAS READ (the Legora way, 20 Oct 2026): the
     first sentence that says it, in its clause, so the grid can quote it */
  /* the sentence that SAYS it, never the title that names it ("Mutual
     Non-Disclosure Agreement"): the operative words first, a bare "mutual"
     only in a sentence that agrees something */
  if (out.dir){
    const find = re => { let at = '';
      for (const para of paras){
        const h = NDA_HEAD.exec(para); if (h) at = h[1];
        for (const s of ndaSentences(para)) if (re.test(s) && NDA_DIR_VERB.test(s)) return { at, s };
      }
      return null; };
    const hit = find(NDA_DIR_SAYS) || find(/\bmutual\b/i);
    if (hit){ out.dirClause = hit.at; out.dirQuote = ndaQuote(hit.s, paras !== lines); }
  }
  return out;
}
const NDA_DIR_SAYS = /\b(?:each|either) party (?:may |will |shall )?(?:disclose|receive)|disclosed by (?:one|either|each) party to the other|by one party to the other\b|both parties (?:may|will|shall) (?:disclose|exchange)|mutual exchange|\b(?:Disclosing Party|Discloser|Disclosing Company|Recipient|Receiving Party|Receiver)\b/i;
const NDA_DIR_VERB = /\b(?:shall|will|may|means|agrees?|undertakes?|discloses?|disclosed|receives?|received|wish(?:es)?|keeps?)\b/i;
/* THE DAY a period ends, counted from the agreement's own dates: after its
   end, from its start, or — from each disclosure — at the latest after its end
   (the last day anything could be shared). '' where the date it counts from is
   not on the record. */
function ndaAddMonths(iso, n){
  if (!ndaDayOk(iso)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  t.setUTCDate(Math.min(d, last));
  return t.toISOString().slice(0, 10);
}
function ndaEndsOf(period, dates){
  if (!period || !(period.n > 0)) return '';
  const D = dates || {};
  const base = period.from === 'start' ? D.start : D.end;
  if (!ndaDayOk(base)) return '';
  return ndaAddMonths(base, period.unit === 'month' ? period.n : period.n * 12);
}
/* the reminder's day: a month before secrecy ends, never before today; ''
   where secrecy has already ended or runs for good */
function ndaRemindDay(ends, today){
  if (!ndaDayOk(ends)) return '';
  if (ndaDayOk(today) && ends < today) return '';
  const d = ndaAddMonths(ends, -NDA_REMIND_MONTHS);
  return ndaDayOk(today) && d < today ? today : d;
}

/* ---- THE ONE READING THE SCREENS DRAW (the browser's; the panel, the
   Overview's two cells and the phone all ask it) ----
   What a person confirmed wins, whole — the editor opens on the reading, so
   saving it IS confirming it. Else what the wording says, marked `read` (the
   screens wear the "confirm" mark). A private folder's NDA nobody has had
   read says `wait` (decision 2: read only on a press). Reading off the stored
   wording only: nothing spent, nothing written. */
const _ndaMemo = new Map();
function ndaOf(c){
  const out = { is: false, dir: '', ends: '', forGood: false, trade: false, clause: '', quote: '', dirClause: '', dirQuote: '', who: '',
    confirmed: false, read: false, wait: false, latest: false, period: null, start: '', end: '' };
  if (!ndaIs(c)) return out;
  out.is = true;
  const W = (typeof window !== 'undefined') ? window : {};
  const start = String(((c.fields || {}).effDate) || ((c.metadata || {}).effectiveDate) || '').slice(0, 10);
  let end = ''; try { end = String((W.effectiveExpiry ? W.effectiveExpiry(c) : '') || c.expiry || '').slice(0, 10); } catch (_){ end = String(c.expiry || '').slice(0, 10); }
  out.start = ndaDayOk(start) ? start : '';
  out.end = ndaDayOk(end) ? end : '';
  const rec = ndaClean(c.nda);
  if (rec){
    Object.assign(out, { dir: rec.dir, ends: rec.ends, forGood: rec.forGood, trade: rec.trade, clause: rec.clause, who: rec.who || '', confirmed: true });
    return out;
  }
  let wait = false; try { wait = !!(W.jamboOnPress && W.jamboOnPress(c)) && !c.triage; } catch (_){ wait = false; }
  if (wait){ out.wait = true; return out; }
  let text = ''; try { text = W.obligationsText ? String(W.obligationsText(c) || '') : ''; } catch (_){ text = ''; }
  if (!text.trim()) return out;
  let ours = ''; try { ours = W.contractParty ? String(W.contractParty(c) || '') : String(c.party || ''); } catch (_){ ours = ''; }
  const theirs = String(c.counterparty || '');
  const key = String(c.id);
  let hit = _ndaMemo.get(key);
  if (!hit || hit.text !== text || hit.ours !== ours || hit.theirs !== theirs){
    hit = { text, ours, theirs, R: ndaRead(text, { ours, theirs }) };
    _ndaMemo.set(key, hit);
  }
  const R = hit.R;
  Object.assign(out, { dir: R.dir, forGood: R.forGood, trade: R.trade, clause: R.clause, quote: R.quote, period: R.period, dirClause: R.dirClause || '', dirQuote: R.dirQuote || '' });
  if (R.period){ out.ends = ndaEndsOf(R.period, { start: out.start, end: out.end }); out.latest = R.period.from === 'disclosure'; }
  out.read = !!(R.dir || R.period || R.forGood || R.trade);
  return out;
}

const NDA_API = { NDA_DIRS, NDA_REMIND_MONTHS, ndaIs, ndaClean, ndaFacts, ndaRead, ndaEndsOf, ndaAddMonths, ndaRemindDay, ndaOf };
if (typeof window !== 'undefined') Object.assign(window, NDA_API);
if (typeof module !== 'undefined' && module.exports) module.exports = NDA_API;
