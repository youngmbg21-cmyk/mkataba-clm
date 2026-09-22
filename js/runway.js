/* ============================================================
   THE RUNWAY (Young ruled 22 Sep 2026)
   ============================================================
   *"The home page looks boring with mostly words"* — and the card that was
   mostly words is the one that matters most: every decision this reader owes,
   ranked by what closes first, said in forty-nine sentences.

   THE PICTURE IS ONE LINE OF TIME. Left of TODAY is how far past this
   workspace's own answering standard a thing has gone; right of it is time
   still to run. Every decision that really carries a date is a dot on it.

   AND A REDLINE HAS NO DUE DATE, which is the whole reason this file exists.
   Young asked the question directly, and the answer measured out of the
   record is: nothing on that card was ever *due*. What HaTi holds is the day
   the other side ASKED — `createdAt`, stamped on their change the moment they
   filed it — and a rule the workspace sets in Team & settings: answer within
   five working days. So "37 days" was never lateness against a deadline. It
   was elapsed time, and on the old card it sat in the same column as "in 9
   days", which is time REMAINING, so the two read as mirror images of each
   other and were not.

   THREE RULES FALL OUT OF THAT, and they are what this file is:

   1. ONE UNIT, AND IT IS CALENDAR DAYS. The staleness THRESHOLD is in working
      days — deliberately, so a Friday ask is not called stale on Monday — but
      the distance drawn is a plain difference between two days. Nothing here
      converts working days into calendar days; that would be a guess, and a
      guess is what this screen exists to stop making.
   2. THE LEFT-HAND CLOCK STARTS WHERE THE STANDARD RAN OUT, never where they
      asked. A thing is not "45 days late", it is 45 days past a promise this
      workspace made to itself, and that promise is named on the label.
   3. A ROW WITH NO DATE IS NOT PLOTTED. Your signature, an undated review, a
      contract simply sitting, a request to join — none of them carries a date
      of any kind, and putting them on a timeline would be the product
      inventing one. They are COUNTED beside the rail instead, and each count
      is a door. A CAP IS A FACT, NEVER A SILENT TRIM.

   IT IS A READING: no route, no store, no field, no spend (f359 greps for all
   of it). It reads the rows the home page has already built from its six
   sources and answers, for each, the ONE date it really carries. Every figure
   on the screen is counted off that one list, so the head, the rail and the
   column beside it cannot come to disagree about how many of anything there
   are.

   NO EXPLAINER BAND, by the owner's word on the day: *"you have explanations
   between the top card and the paper so please exclude that from the
   implementation."* The prototype carried a paragraph saying what the rail
   meant. The rail says it instead — the two end labels carry the two
   directions, and the left one carries the standard itself, which is the one
   fact the picture rests on and the one thing a reader cannot work out by
   looking. Where the standard is SET rides the hover, because Team & settings
   is the one door onto it and a second one here would drift from it.
   ============================================================ */

/* The rail's own geometry. Sixty days of debt to the left of TODAY and ninety
   days of runway to its right, which is the window the home page's own
   renewal reading already uses (decisions are filtered to 0..90). A row
   further out than either end is PINNED to that end rather than dropped: it
   is still owed, and a dot at the wall says "and beyond this" honestly. */
const RW_PAST_MAX = 60;
const RW_LEFT_MAX = 90;
const RW_TODAY_AT = 40;      /* where TODAY sits across the rail, in per cent */
const RW_STACK    = 12;      /* px between two dots landing on the same day */
const RW_STACK_MAX= 6;       /* dots high before a day stops stacking upward */

/* WHAT EACH KIND IS AND WHAT COLOUR SAYS SO. The words are keys, not English:
   a screen prints i18t(word), and the record never sees any of this. */
const RW_KINDS = {
  wait : { tone:'var(--st-ruby-dot)',       word:'rw_k_wait'  },
  renew: { tone:'var(--st-amber-dot)',      word:'rw_k_renew' },
  ask  : { tone:'var(--st-steel-dot)',      word:'rw_k_ask'   },
  sign : { tone:'var(--color-accent-600)',  word:'rw_k_sign'  },
  idle : { tone:'var(--st-gray-dot)',       word:'rw_k_idle'  },
  join : { tone:'var(--st-green-dot)',      word:'rw_k_join'  },
};
/* The order the no-clock column counts them in: the heaviest owed first. */
const RW_NONE_ORDER = ['sign','ask','idle','join'];

/* ---------- the standard ----------
   ONE READING, AND IT IS THE DESK'S OWN. The workspace already answers "how
   long may a proposal of theirs sit unanswered" — it is the number behind the
   quiet-desk flag, an admin setting on the negotiation-desk panel. Reading it
   here rather than inventing a second one means there is one promise, said in
   one place, and the flag and the rail can never disagree about it. Through
   `window` with a fallback, because js/desk.js is not on every stage. */
function rwStandardDays(){
  try{
    if (typeof window !== 'undefined' && typeof window.deskCfg === 'function'){
      const n = Number(window.deskCfg().staleDays);
      if (Number.isFinite(n) && n > 0) return n;
    }
    if (typeof window !== 'undefined' && Number(window.DESK_STALE_DAYS) > 0)
      return Number(window.DESK_STALE_DAYS);
  }catch(_){}
  return 5;
}

/* ---------- days ----------
   LOCAL, NEVER UTC. todayISO() is core.js's one reading of what day it is and
   it carries the reason: toISOString() puts today on yesterday for every
   reader west of Greenwich after their afternoon. The fallback repeats its
   arithmetic rather than reaching for toISOString. */
function rwIsoOf(d){
  if (!d || isNaN(d.getTime())) return null;
  const p = n => String(n).padStart(2,'0');
  return d.getFullYear() + '-' + p(d.getMonth()+1) + '-' + p(d.getDate());
}
function rwToday(){
  try{ if (typeof window !== 'undefined' && typeof window.todayISO === 'function') return window.todayISO(); }catch(_){}
  return rwIsoOf(new Date());
}
function rwDay(v){
  const s = String(v || '').slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
/* Calendar days from a to b. Both are DAYS, so this is a plain difference and
   no clock time can leak into it. */
function rwDayDiff(a, b){
  const x = rwDay(a), y = rwDay(b);
  if (!x || !y) return null;
  const dx = new Date(x + 'T00:00:00'), dy = new Date(y + 'T00:00:00');
  if (isNaN(dx.getTime()) || isNaN(dy.getTime())) return null;
  return Math.round((dy - dx) / 86400000);
}
/* THE DAY THE STANDARD RAN OUT. The exact inverse of the walk js/desk.js
   counts staleness with — one day at a time, weekends skipped — so the day
   this answers is the day that walk would have reached. f359 pins the pair
   against each other rather than pinning either number, because the two
   drifting apart is the only way this can be wrong. */
function rwAddWorkingDays(iso, n){
  const day = rwDay(iso);
  if (!day) return null;
  const d = new Date(day + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  let left = Math.max(0, Math.floor(Number(n) || 0));
  let guard = 0;
  while (left > 0 && guard++ < 4000){
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) left--;
  }
  return rwIsoOf(d);
}

/* ---------- the one clock a row carries ----------
   The home page hands every decision row a `rw` object holding the RAW facts
   its own source knows: the day they asked, a due date a colleague typed, the
   days a renewal has left, or how long the thing has simply sat. Turning
   those into a side and a distance happens HERE and nowhere else, so the
   picture and any reading of it cannot disagree.

   A row carries at most one of them; the order below is a net, not a
   priority argument. */
function rwClock(it){
  const r = (it && it.rw) || {};
  const today = rwToday();
  if (r.since){
    const ran = rwAddWorkingDays(r.since, rwStandardDays());
    const n = rwDayDiff(ran, today);
    if (n != null) return n >= 0 ? { side:'past', n } : { side:'left', n:-n };
  }
  if (r.due){
    const n = rwDayDiff(today, r.due);
    if (n != null) return n >= 0 ? { side:'left', n } : { side:'past', n:-n };
  }
  if (r.left != null && Number.isFinite(Number(r.left))){
    const n = Math.round(Number(r.left));
    return n >= 0 ? { side:'left', n } : { side:'past', n:-n };
  }
  /* NO CLOCK. `sat` is how long it has been with this reader — elapsed time,
     which is a fact and is NOT a deadline, so it is printed beside the count
     and never plotted. */
  const sat = Number(r.sat);
  return { side:'none', n:null, sat: Number.isFinite(sat) && sat >= 0 ? sat : null };
}

/* The kind of work a row is, defaulting to the quietest tone rather than
   throwing: a kind added to the home page tomorrow draws grey and is counted,
   which is wrong only in colour. */
function rwKind(it){
  const k = it && it.rk;
  return Object.prototype.hasOwnProperty.call(RW_KINDS, k) ? k : 'idle';
}

/* ---------- the whole population, cut once ----------
   ONE PASS, and every figure any surface prints comes off it. */
function rwSplit(items){
  const out = { past:[], left:[], none:[], rows:[], noneBy:{} };
  (items || []).forEach(it => {
    const c = rwClock(it);
    const row = { it, cid: it && it.cid, kind: rwKind(it), side: c.side, n: c.n, sat: c.sat };
    out.rows.push(row);
    if (c.side === 'past') out.past.push(row);
    else if (c.side === 'left') out.left.push(row);
    else {
      out.none.push(row);
      (out.noneBy[row.kind] = out.noneBy[row.kind] || []).push(row);
    }
  });
  out.plotted = out.past.length + out.left.length;
  return out;
}
/* The no-clock column: one line per kind that has anything, in a stated
   order, worst-sat first inside each. A kind with nothing draws nothing. */
function rwNoneGroups(split){
  const by = (split && split.noneBy) || {};
  const seen = {};
  const out = [];
  RW_NONE_ORDER.forEach(k => {
    seen[k] = true;
    if (by[k] && by[k].length) out.push({ kind:k, n:by[k].length, rows:by[k] });
  });
  /* A kind that is not on the stated order is still counted — see rwKind. */
  Object.keys(by).forEach(k => { if (!seen[k] && by[k].length) out.push({ kind:k, n:by[k].length, rows:by[k] }); });
  return out;
}

/* WHERE A ROW SITS ACROSS THE RAIL, in per cent. TODAY is at RW_TODAY_AT:
   everything left of it is debt, everything right of it is runway, and the
   two scales differ because the two questions do — which is why the ends are
   labelled with their own numbers rather than sharing one ruler. */
function rwX(row){
  if (!row || row.side === 'none') return null;
  if (row.side === 'past'){
    const d = Math.min(Math.max(row.n, 0), RW_PAST_MAX);
    return RW_TODAY_AT * (1 - d / RW_PAST_MAX);
  }
  const d = Math.min(Math.max(row.n, 0), RW_LEFT_MAX);
  return RW_TODAY_AT + (d / RW_LEFT_MAX) * (100 - RW_TODAY_AT);
}

if (typeof window !== 'undefined') Object.assign(window, {
  RW_PAST_MAX, RW_LEFT_MAX, RW_TODAY_AT, RW_STACK, RW_STACK_MAX, RW_KINDS, RW_NONE_ORDER,
  rwStandardDays, rwIsoOf, rwToday, rwDay, rwDayDiff, rwAddWorkingDays,
  rwClock, rwKind, rwSplit, rwNoneGroups, rwX,
});
