// HaTi — E3 obligations + renewal decisions. Globals window-attached.

const OBLIG_RECUR = [['none','One-off'],['monthly','Monthly'],['quarterly','Quarterly'],['annual','Annual']];

/* ---- A DATE FIELD IS NOT ALWAYS A DATE ----

   Everything downstream of an expiry — the calendar grid, the dashboard's
   "decisions due", the register's auto-renew filter — assumes a clean
   YYYY-MM-DD. Most of the time it is one, because the date pickers produce one.
   But an expiry can also arrive from metadata extraction, from a bulk
   migration, or from a spreadsheet a person typed by hand, and then it reads
   "30 September 2026", or a full ISO datetime, or something that is not a date
   at all.

   `new Date("30 September 2026" + "T00:00:00")` is an Invalid Date, and
   `toISOString()` on an Invalid Date THROWS. That threw out of
   renewalDecisionDate, out of renderDashboard and renderCalendar, and took the
   whole portfolio's Home and Calendar screens down — over one record. Two
   working screens, dead, because of one badly typed field on one contract.

   So the value is normalised before any arithmetic touches it: a leading
   YYYY-MM-DD is taken as-is, anything else is offered to Date.parse, and a
   value that survives neither is null. Null is a real answer here — "we do not
   know when this expires" — and every caller already handles it.

   AND Date.parse ON ITS OWN IS NOT THE TEST. Handing it any string at all was
   the second half of the same mistake, one step further down: outside the ISO
   grammar the engine falls back to a legacy parser that will find a date in
   almost anything. `Date.parse("Phase 2")` is 1 February 2001.
   `Date.parse("clause 4.2")` is 2 April 2001. So an expiry a migration left as
   "Phase 2" did not come back as "we do not know" — it came back as a
   confident calendar day twenty-five years ago, and the contract read as long
   expired, sat in the expiring buckets and drew itself on a 2001 calendar.
   A wrong date stated as fact is worse than no date, because nobody goes
   looking for it.

   Only shapes a person actually writes a date in are offered to the parser.
   Anything else is null — which is the honest answer and the handled one. */
const DATE_MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
const DATE_SHAPES = [
  /^(\d{1,2})(?:st|nd|rd|th)?[ .\-]+([A-Za-z]{3,9})\.?,?[ .\-]+(\d{4})$/,   // 30 September 2026
  /^([A-Za-z]{3,9})\.?[ .\-]+(\d{1,2})(?:st|nd|rd|th)?,?[ .\-]+(\d{4})$/,   // September 30, 2026
];
function dateOnly(v){
  if(v instanceof Date) return isNaN(v.getTime()) ? null : isoDay(v);
  const s = String(v==null?'':v).trim();
  if(!s) return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  // the same year-first date with the other separators
  if(!/^\d{4}[/.]\d{1,2}[/.]\d{1,2}$/.test(s)){
    const shape = DATE_SHAPES.map(re=>re.exec(s)).find(Boolean);
    // a month has to be a month — "Foo 30, 2026" is not a date, it is a label
    if(!shape || !DATE_MONTH_RE.test(shape[1].length>2?shape[1]:shape[2])) return null;
  }
  const t = Date.parse(s);
  if(Number.isNaN(t)) return null;
  const d = new Date(t);
  if(isNaN(d.getTime())) return null;
  return isoDay(d);
}
/* A Date as the calendar day it IS, read in the reader's own timezone.
   `toISOString()` converts to UTC first, so midnight local in Nairobi (UTC+3)
   comes back as the PREVIOUS day — a renewal deadline reported one day early,
   every time, for the market this product is built for. */
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* The date by which a renewal decision must be made: expiry minus the notice
   period (from E1 metadata). Null when we don't know both. */
function renewalDecisionDate(c){
  // family-aware: if a later amendment moved the term, the decision deadline
  // moves with it (window.effectiveExpiry — family.js loads after this module)
  const raw = (window.effectiveExpiry?effectiveExpiry(c):null) || (c&&c.metadata&&c.metadata.expiryDate) || (c&&c.expiry);
  const expiry = dateOnly(raw);
  const notice = c&&c.metadata&&Number(c.metadata.noticePeriodDays)||0;
  if(!expiry) return null;                   // not a date we can count from
  if(!notice) return expiry;                 // no notice period known — decide by expiry
  const d = new Date(expiry+'T00:00:00');
  if(isNaN(d.getTime())) return null;
  d.setDate(d.getDate()-notice);
  if(isNaN(d.getTime())) return null;        // arithmetic can still land outside the range
  return isoDay(d);
}
/* An obligation's due date, normalised — the same treatment the expiry gets,
   and for the same reason. `due` is filed from whatever the Copilot scan put in
   it ("31 March 2027" is a perfectly ordinary answer to "ISO yyyy-mm-dd if a
   concrete date is stated") or from a migration spreadsheet somebody typed.
   Nothing throws on it, which is why it went unnoticed: `daysUntil` simply
   returns NaN, every comparison against NaN is false, and the obligation was
   never overdue however long ago it was due. */
const obligationDue = o => (window.dateOnly ? dateOnly(o && o.due) : ((o && o.due) || null));
function obState(o){
  if(o.status==='done') return 'done';
  const due=obligationDue(o);
  if(due && daysUntil(due)<0) return 'overdue';
  return 'open';
}

/* ---- WHOSE DELIVERABLE IS IT? ----

   A contract's obligations are almost never all one side's. A supply agreement
   has things we must do — pay within thirty days, give sixty days' notice — and
   things they must do — deliver monthly, keep insurance current, file quarterly
   returns. The record had one field for this, `assignee`, and it offered a list
   of people in THIS workspace. There was no way to write down "the supplier
   owes us this one".

   So every screen that counted obligations counted both kinds together, and
   "six due this month" could not be read: it might mean six jobs for our team,
   or six things to chase them about. Those are different mornings.

   `party` is the answer, and it is deliberately two values and not a directory
   of people on the other side. We do not have their staff list, we are not
   going to maintain one, and the useful distinction is ours/theirs — the
   counterparty's own internal owner is their business.

   A record filed before this existed has no `party`. It reads as ours, which is
   what it was: the only assignees the form ever offered were our own people. */
const OBLIG_PARTY = [['ours','Us'],['theirs','Counterparty']];
const obligationParty = o => ((o && o.party)==='theirs' ? 'theirs' : 'ours');
const obligationIsTheirs = o => obligationParty(o)==='theirs';
/* Who to chase, in the words a person would use. Their side speaks as the
   counterparty — we hold no names over there — and ours names the colleague, or
   says plainly that nobody has it. */
function obligationOwner(o, c){
  if(obligationIsTheirs(o)) return String((c && c.counterparty) || '').trim() || 'the counterparty';
  return String((o && o.assignee) || '').trim() || 'unassigned';
}
const obligationsOurs   = list => (list||[]).filter(o=>!obligationIsTheirs(o));
const obligationsTheirs = list => (list||[]).filter(obligationIsTheirs);
function contractObligations(c){ return (c.obligations||[]); }
function allObligations(){
  const out=[];
  /* `counterparty` travels with each one so a screen listing obligations from
     several contracts can name who owes a "theirs" without looking the contract
     up again — and cannot name the wrong one. */
  state.contracts.forEach(c=>{ (c.obligations||[]).forEach(o=>out.push({...o,
    cid:c.id, cname:c.name, counterparty:c.counterparty||'' })); });
  return out;
}
/* Everything still outstanding across the portfolio, soonest first. What the
   dashboard panel reads. Declined contracts are out — a deal nobody is doing
   has no deliverables — and so is anything already done. */
function openObligations(withinDays){
  const live=new Set((state.contracts||[]).filter(c=>c.status!=='Declined'&&!c.archived).map(c=>c.id));
  return allObligations()
    .filter(o=>live.has(o.cid) && obState(o)!=='done')
    .map(o=>{ const due=obligationDue(o); return { ...o, due, days:due?daysUntil(due):null }; })
    .filter(o=>withinDays==null || o.days==null || o.days<=withinDays)
    .sort((a,b)=>{ if(a.days==null) return 1; if(b.days==null) return -1; return a.days-b.days; });
}
function overdueObligationCount(){ return allObligations().filter(o=>obState(o)==='overdue').length; }
/* ---- IS THIS AGREEMENT INSIDE ITS RENEWAL WINDOW? (W2-4) ----
   The deterministic half of the renewal adviser, and the ONE reading behind
   the card: no AI, no opinion — dates, and what they mean. Ninety days is
   the same mark the reminder sweep's first milestone uses, so the card
   appears on the screen in the same week the first email goes out.

   AN AMENDMENT NEVER RENEWS ITSELF (parentId), a DECLINED or ARCHIVED
   agreement is not up for renewal, and a term we cannot read is not a claim
   that anything is due. effectiveExpiry is family-aware, so a signed
   amendment that moved the term moves this with it. */
const RENEWAL_WINDOW_DAYS = 90;
/* ---- ONLY AN AGREEMENT IN FORCE IS UP FOR RENEWAL (owner-reported 20 Aug
   2026: a contract uploaded that morning was offered renewal choices) ----
   The gate used to be "not a draft and not declined", which let through
   everything still being negotiated — a contract you are reviewing is not one
   you are renewing, and renewal advice on it is an answer to a question nobody
   asked. IN FORCE is negoExecuted's own reading (signed, sealed, or carrying an
   execution stamp), so an uploaded record that was executed OUTSIDE HaTi — the
   commonest thing a renewal question is actually asked about — still gets the
   card, while paper still in review does not. */
function renewalInForce(c){
  if(!c) return false;
  return (typeof window!=='undefined' && typeof window.negoExecuted==='function')
    ? negoExecuted(c) : !!(c.status==='Signed' || c.hash || (c.execution && c.execution.at));
}
function renewalWindow(c){
  if(!c || c.parentId || c.archived) return null;
  if(c.status==='Declined' || c.status==='Draft') return null;
  if(!renewalInForce(c)) return null;
  const expiry = dateOnly((window.effectiveExpiry?effectiveExpiry(c):null)
    || (c.metadata&&c.metadata.expiryDate) || c.expiry);
  if(!expiry) return null;
  const decideBy = renewalDecisionDate(c);
  const days = daysUntil(decideBy||expiry);
  if(days==null || isNaN(days)) return null;
  const notice = Number(c.metadata&&c.metadata.noticePeriodDays)||0;
  const auto = (c.metadata&&c.metadata.renewalType)==='auto-renew';
  /* ---- A DEADLINE OLDER THAN THE RECORD IS NOT ONE ANYBODY HERE MISSED ----
     The notice period is read out of the wording, and subtracting six months
     from an expiry can easily land before the day the contract was filed. Told
     "you missed this 78 days ago" about a file uploaded this morning, the
     system is accusing the reader of something that was impossible. The date
     is still stated — it is a fact and it still governs — but it is reported
     as PREDATING the record rather than as a miss. `filedAt` is the contract's
     first audit entry, which is when it entered HaTi whatever its paper says. */
  const filed = dateOnly(c.createdAt || ((c.audit||[])[0]||{}).at) || null;
  const before = !!(filed && decideBy && String(decideBy) < String(filed));
  return { expiry, decideBy: decideBy||expiry, days, notice, auto, filed,
    /* PAST the decision date is still IN the window — that is when it matters
       most, and a card that vanished the day the deadline passed would take
       the bad news off the screen at exactly the wrong moment. */
    inWindow: days<=RENEWAL_WINDOW_DAYS, missed: days<0 && !before, predatesRecord: before,
    expiresDays: daysUntil(expiry) };
}
function renewalDecisionsDue(withinDays=30){
  const out=[];
  state.contracts.forEach(c=>{ if(c.status==='Declined'||c.status==='Signed'&&!c.metadata) {/*keep signed w/ renewal*/}
    const dd=renewalDecisionDate(c); if(dd){ const d=daysUntil(dd); if(d>=0&&d<=withinDays) out.push({cid:c.id, cname:c.name, decideBy:dd, days:d}); } });
  return out.sort((a,b)=>a.days-b.days);
}

/* ---- heuristic obligation finder (no key): payment/notice/reporting cues ---- */
function heuristicObligations(text, c){
  const t=String(text||'').replace(/\s+/g,' '); const out=[];   // read across the document's line wrapping
  const add=(desc,quote)=>{ if(out.length<8) out.push({desc, quote:quote?quote.slice(0,160):'', due:'', recurring:'none'}); };
  const sent = t.split(/(?<=[.;])\s+/);
  sent.forEach(s=>{
    if(/\bshall\s+(pay|remit|invoice)\b/i.test(s) && out.every(o=>!/pay/i.test(o.desc))) add('Payment obligation', s);
    else if(/\b(\d{1,3})\s+days'?\s+(?:written\s+)?notice\b/i.test(s)) add('Notice / termination obligation', s);
    else if(/\b(monthly|quarterly|annual|annually|weekly)\b[^.]*\b(report|statement|forecast|return)\b/i.test(s) || /\b(report|statement|forecast)\b[^.]*\b(monthly|quarterly|annually)\b/i.test(s)) add('Reporting obligation', s);
    else if(/\b(deliver|supply|provide)\b.*\bwithin\b/i.test(s) && out.every(o=>!/deliver/i.test(o.desc))) add('Delivery obligation', s);
    else if(/\b(insurance|indemnif\w*|indemnit\w*|maintain\s+cover)\b/i.test(s) && out.every(o=>!/insurance/i.test(o.desc))) add('Insurance / indemnity obligation', s);
  });
  return out;
}
async function extractObligations(c){
  const text = isUpload(c) ? (c.upload&&c.upload.extractedText)||'' : (window.contractPlainText?contractPlainText(c):'');
  if(!text || text.length<120){ toast(i18t('ob_no_readable'),'err'); return []; }
  if(API_MODE() && state.aiConfigured){
    /* THE WHOLE CONTRACT GOES. It used to slice to 20,000 characters here AND
       again on the server, so obligations drafted at the BACK of an agreement
       — audit rights, insurance, post-termination duties — were never seen.
       Measured against CUAD, 41 of 50 real contracts are longer than that and
       the reader returned NOTHING at all on every truncated one. The ceiling
       is aiDocChars on the server now: one number, set above any real
       contract, and it tells the reader when it bites. */
    try{ const r=await api('ai/obligations','POST',{ text }); return r.obligations||[]; }
    catch(e){ toast(i18t('ob_scan_unavailable'),'err'); }
  }
  return heuristicObligations(text, c);
}

/* EVERY SURFACE THAT COUNTS OBLIGATIONS, when the obligations change.

   The sidebar badge on Calendar is "due in the next sixty days", and it is
   recomputed at the end of setView() — a SCREEN SWITCH. All three things that
   move that number (adding one, completing one, removing one) happen inside the
   workspace, which is not a screen switch. So the badge went on reading 1 over
   a portfolio with nothing due, and corrected itself silently the next time the
   reader navigated anywhere. The Calendar itself, if it is the open screen, has
   the same problem for the same reason. */
function obligationSurfacesChanged(){
  if(window.updateSidebarCounts) updateSidebarCounts();
  if(window.state && state.view==='calendar' && window.renderCalendar) renderCalendar();
  /* AND THE DASHBOARD, now that it counts them too. Same reasoning as the
     calendar above: its numbers are computed during a render, and ticking an
     obligation off is not a screen switch. */
  if(window.state && state.view==='dashboard' && window.renderDashboard) renderDashboard();
  /* AND THE CHECKS CARD, which counts them on its own row since 14 Aug 2026
     ("6 tracked"). Same reasoning again, and the reason this function exists:
     one count, many surfaces, refreshed from ONE place rather than from each of
     the four callers that can change an obligation. renderChecksCard returns
     immediately where there is no card, so this is a no-op everywhere else. */
  if(window.renderChecksCard && window.state && window.getContract){
    const c=getContract(state.activeId);
    if(c) renderChecksCard(c);
  }
  /* AND THE ROOM'S OWN TAB, which carries the outstanding count and the amber
     that says something is overdue (J-2.1). A new surface joins this funnel or
     it goes stale the first time somebody ticks something off somewhere else —
     which is the whole reason this function exists. Both are no-ops off the
     contract room. */
  if(window.state && window.getContract){
    const c=getContract(state.activeId);
    if(c){
      if(window.wsPaintTabCounts) wsPaintTabCounts(c);
      if(window.roomPaintObligations) roomPaintObligations(c);
    }
  }
}

/* ---- ONE VERB, PRESSED FROM THREE SCREENS ----

   Completing an obligation used to exist only as an inline handler inside the
   workspace panel, which is why it could only ever be done there. It is a verb
   now: the calendar and the dashboard call the same function, so there is one
   place that decides what completing means, one audit line, and one refresh of
   every surface that counts them. A second copy of this logic on the calendar
   is exactly how two screens come to disagree.

   Addressed BY ID rather than by position. The workspace lists a contract's
   obligations in their stored order, but the calendar sorts by date and the
   dashboard filters to what is due — so an index means three different things
   on three screens, and the wrong one would be ticked off. */
function findObligation(cid, obId){
  const c=window.getContract?getContract(cid):null;
  if(!c) return null;
  const list=c.obligations||[];
  const i=list.findIndex(o=>o&&String(o.id)===String(obId));
  return i<0 ? null : { c, o:list[i], i };
}
/* Is an instance of this series already open on that day? Read off the record
   rather than remembered, so it is true however the duplicate came to be —
   a reopen, a second device, an older import. The series is matched by its own
   id where both carry one, and by what a series IS otherwise: the same duty,
   on the same contract, at the same date. */
function obligationSeriesOpenAt(c, want){
  const list=(c&&c.obligations)||[];
  const sid=want&&want.seriesId, due=String((want&&want.due)||'');
  const desc=String((want&&want.desc)||'').replace(/\s+/g,' ').trim().toLowerCase();
  return list.some(x=>{
    if(!x||x.status==='done') return false;
    if(String(x.due||'')!==due) return false;
    if(sid&&x.seriesId) return String(x.seriesId)===String(sid);
    return String(x.desc||'').replace(/\s+/g,' ').trim().toLowerCase()===desc;
  });
}
function toggleObligation(c, i, opts={}){
  if(!canEdit()){ toast(i18t('ob_viewers_no_change'),'err'); return null; }
  const o=(c&&c.obligations||[])[i]; if(!o) return null;
  o.status = o.status==='done' ? 'open' : 'done';
  /* ---- COMPLETION CARRIES A DATE AND A PERSON (J-2.2) ----
     Written HERE and nowhere else, so every surface — the tab, the Checks
     panel, the Calendar, the dashboard — records the same three facts in the
     same way. A caller that supplies no date gets today, which is true: it is
     the day it was ticked. The dialog exists to move that date BACK.

     AND A REPEATING DUTY OPENS ITS NEXT INSTANCE. `recurring` was stored,
     printed on the row and read by nothing at all, so ticking a quarterly
     report off ended it for ever. EXACTLY ONE, with its own id — the reminder
     sweep's dedupe key is `${c.id}:ob:${o.id||due}:…`, so an instance minted
     without a fresh id inherits the previous one's rows and its reminders
     never fire, silently. Built by the one builder the dialog also names, so
     what was promised before the press is what is filed. */
  let next=null;
  if(o.status==='done'){
    obligationMarkDone(o, opts);
    next=obligationNextInstance(o);
    /* ---- EXACTLY ONE, AND THAT HAS TO SURVIVE A REOPEN ----
       "Exactly one" was written as one push per completion, which is only the
       same thing while nobody presses Reopen. Done → Reopen → Done pushed a
       SECOND instance with the same description, the same date and the same
       series — and because the reminder sweep dedupes on the obligation's own
       id, the two duplicates take two dedupe rows and the assignee is nudged
       twice at seven days, twice on the day and twice the day after. The
       question is asked of the LIST rather than of the press: an open instance
       of this series already standing at that date IS the next instance, so
       there is nothing to open. */
    if(next && obligationSeriesOpenAt(c, next)) next=null;
    if(next){
      /* The duty this instance belongs to, stamped on the one it came from
         too, so a series can be read from either end. */
      if(!o.seriesId) o.seriesId=obligationSeriesId(o);
      c.obligations.push(next);
    }
  } else {
    /* Reopening un-completes it. A record still carrying a completion date
       under a status of 'open' is a contradiction the on-time figure counts. */
    obligationClearDone(o);
  }
  logAudit(c,'Obligation',`${o.status==='done'?'Completed':'Reopened'}: ${o.desc}`
    +` — ${obligationIsTheirs(o)?`${c.counterparty||'the counterparty'}'s to deliver`:'ours'}`
    +(o.status==='done'&&o.completedAt?` on ${o.completedAt}`:'')
    +(opts.from?` (from the ${opts.from})`:''));
  if(next) logAudit(c,'Obligation',`Next in series opened: ${next.desc} (due ${next.due})`);
  persist(c);
  if(next && window.toast) toast(i18tn('ob_next_opened',1,{date:next.due}),'ok');
  if(window.renderObligationsSection) renderObligationsSection(c);
  obligationSurfacesChanged();
  return o;
}
/* The calendar's and the dashboard's way in. Returns the obligation so a caller
   can report what happened; null when the record has moved on underneath. */
function toggleObligationById(cid, obId, opts={}){
  const hit=findObligation(cid, obId);
  if(!hit){ toast('That obligation is no longer on the contract','err'); return null; }
  return toggleObligation(hit.c, hit.i, opts);
}

/* ---- workspace obligations section ---- */
function renderObligationsSection(c){
  const host=document.getElementById('obligations-section'); if(!host) return;
  const obs=c.obligations||[];
  /* AN EXECUTED CONTRACT IS WHERE OBLIGATIONS START, not where they stop.

     This read `canEdit() && c.status !== 'Signed'`, so the moment a deal was
     signed every control in this panel disappeared — no ticking one off, no
     adding the one the scan missed, no correcting a due date. On exactly the
     contracts whose obligations are live. The whole point of tracking a
     quarterly report is that the quarter comes round after signature.

     The 'Signed' guard belongs to the DOCUMENT: sealed wording does not change,
     and nothing here touches the wording. An obligation is a note about what
     the parties have to do, kept alongside it. It stays editable for as long as
     the contract is running. */
  const editable=canEdit();
  const dd=renewalDecisionDate(c);
  if(!obs.length && !editable && !dd){ host.innerHTML=''; return; }   // nothing to show; empty:hidden collapses it
  const chip=st=>st==='overdue'?'bg-rose-50 text-rose-600 border-rose-200':st==='done'?'bg-brand-50 text-brand-600 border-brand-200':'bg-gold-500/10 text-gold-600 border-gold-500/25';
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-brand-500">${icon('calendar')}</span>
        <h3 class="text-sm font-display font-600 text-ink">${i18t('ob_obligations')}</h3>
        <span class="ml-auto text-[10px] font-mono text-ink/60">${obs.length}</span>
      </div>
      ${dd?`<div class="mb-3 rounded-lg border ${daysUntil(dd)<0?'border-rose-200 bg-rose-50':'border-gold-500/25 bg-gold-500/8'} px-3 py-2 text-[11px]">
        <span class="font-600 text-ink">Renewal decision by ${dd}</span> <span class="text-ink/60">· ${daysUntil(dd)<0?'passed':daysUntil(dd)+' days'}${c.metadata&&c.metadata.noticePeriodDays?` (expiry ${(c.metadata.expiryDate||c.expiry)} − ${c.metadata.noticePeriodDays}d notice)`:''}</span></div>`:''}
      ${''/* ---- THE LIST IS BOUNDED, AND THE ROWS ARE LEGIBLE ----
             Both reported together (Young, 10 Aug 2026): "make the obligations
             card be a set size which obligations are scrollable within", and
             "make them readable as they are currently very faint".

             BOUNDED BY THE LIST, NOT BY THE CARD. The cap sits on the rows so
             the head, the renewal note and the two buttons stay put while the
             obligations scroll under them — a card-level max-height would put
             Add obligation below a scroll nobody knew was there. It is a
             max-height rather than a fixed one: three obligations should not
             leave a third of a card empty to prove a rule about six.

             FAINT WAS A STACK OF SMALL DECISIONS, not one. The meta line ran
             at 10px on ink/55, the quote at 10px on ink/50 and italic, and both
             sat on white — each defensible alone, and together the two lines
             carrying WHOSE it is, WHO owns it and WHAT THE CONTRACT SAYS were
             the least readable things in the panel. The quote especially: it is
             the evidence for the obligation existing at all. Sized and inked
             through .ob-* below, in tokens, so dark mode is not a second guess. */}
      ${obs.length?`<div class="ob-list scroll-thin space-y-1.5 mb-2">${obs.map((o,i)=>{ const st=obState(o); return `
        <div class="rounded-lg border border-line bg-white px-3 py-2">
          <div class="flex items-center gap-2 text-[12px]">
            <span class="inline-block rounded-full border ${chip(st)} px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide">${st}</span>
            <span class="text-ink font-600 truncate">${(o.desc||'').replace(/</g,'&lt;')}</span>
            <span class="ob-due ml-auto shrink-0 font-mono">${o.due||'no date'}</span>
          </div>
          <div class="ob-meta mt-1 flex items-center gap-2">
            ${o.recurring&&o.recurring!=='none'?`<span>${(OBLIG_RECUR.find(r=>r[0]===o.recurring)||[])[1]}</span>·`:''}
            ${''/* Ours or theirs, said on the row rather than inferred from a
                   name. "Wanjiku Kamau" reads as a job; "Kabras Sugar" beside
                   it would read as one too unless the row says which it is. */}
            <span class="inline-block rounded border px-1 py-px text-[9px] font-mono uppercase tracking-wide ${obligationIsTheirs(o)?'border-gold-500/30 bg-gold-500/10 text-gold-700':'border-brand-200 bg-brand-50 text-brand-600'}">${obligationIsTheirs(o)?'theirs':'ours'}</span>
            <span>${String(obligationOwner(o,c)).replace(/</g,'&lt;')}</span>
            ${editable?`<span class="ob-acts ml-auto flex gap-2">
              <button data-ob-toggle="${i}">${o.status==='done'?'reopen':'done'}</button>
              <button data-ob-edit="${i}">edit</button>
              <button data-ob-del="${i}" class="is-del">remove</button></span>`:''}
          </div>
          ${o.quote?`<div class="ob-quote mt-1">“${o.quote.replace(/</g,'&lt;')}”</div>`:''}
        </div>`; }).join('')}</div>`
      :`<p class="text-[11px] text-ink/60 mb-2">${i18t('ob_none_tracked')}</p>`}
      ${''/* ---- A BUTTON THAT CANNOT BE SEEN IS NOT A BUTTON ----
             Reported (Young, 10 Aug 2026): "the buttons are almost
             transparent". They were outlines only — border-brand-200 is a pale
             mint and border-gold-500/30 is amber at three-tenths — with no fill
             behind them, on a white card. At rest they read as two labels
             floating in the empty state's whitespace.

             THE FILL IS THE FIX, not a heavier border. Each takes the tint of
             its own family (accent for the manual add, amber for the Copilot
             sweep, which is the colour every AI act on this page wears), so the
             pair stays quiet against the primary actions elsewhere on the
             screen while being unmistakably pressable. Hover deepens the same
             tint rather than introducing a new one. */}
      ${editable?`<div class="flex flex-wrap gap-2">
        <button id="ob-add" class="ob-btn ob-btn-add">${icon('plus','w-3 h-3')} Add obligation</button>
        <button id="ob-find" class="ob-btn ob-btn-find">${icon('sparkle','w-3 h-3')} Find obligations</button>
      </div>`:''}
    </div>`;
  /* THE SAME DOOR AS THE TAB'S. This panel and the Obligations tab are the two
     per-contract surfaces, and one asking for a completion date while the
     other did not is precisely the drift this file's first rule warns about. */
  host.querySelectorAll('[data-ob-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const i=Number(b.getAttribute('data-ob-toggle'));
    const o=(c.obligations||[])[i];
    if(o&&o.status!=='done'&&window.openObligationDone) openObligationDone(c,i);
    else toggleObligation(c, i);
  }));
  host.querySelectorAll('[data-ob-edit]').forEach(b=>b.addEventListener('click',()=>{
    const i=Number(b.getAttribute('data-ob-edit'));
    openObligationForm(c, { ...obs[i], _i:i }); }));
  host.querySelectorAll('[data-ob-del]').forEach(b=>b.addEventListener('click',()=>{
    const o=obs[Number(b.getAttribute('data-ob-del'))];
    obs.splice(Number(b.getAttribute('data-ob-del')),1);
    if(o) logAudit(c,'Obligation',`Removed: ${o.desc}`);
    persist(c); renderObligationsSection(c); obligationSurfacesChanged(); }));
  document.getElementById('ob-add')?.addEventListener('click',()=>openObligationForm(c));
  document.getElementById('ob-find')?.addEventListener('click',()=>runFindObligations(c));
}
function openObligationForm(c, seed){
  seed=seed||{desc:'',due:'',recurring:'none',assignee:'',quote:'',amount:''};
  const members=(getUsers()||[]).map(u=>u.name);
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-3">${seed._i!=null?'Edit':'Add'} obligation</h3>
      ${''/* ---- THE DESCRIPTION WRAPS ----
              Reported (Young, 10 Aug 2026): an obligation read out of a clause
              is a sentence, and a single-line <input> showed about a third of
              it with the rest scrolled off to the right. You could not read
              what you were editing, which on the one field that IS the
              obligation is the whole control being useless.

              A TEXTAREA, THREE ROWS, AND A HANDLE. Three rows holds the common
              obligation whole — the ones the Copilot reads out of clauses run
              to about 150 characters — and the dialog still comes out SHORTER
              than the one being replaced, because the fields below it did not
              move. Beyond that the reader drags the
              corner — resize:vertical, so the width cannot be pulled out of
              the grid — and it is capped at 140px, which with the panel's own
              88vh ceiling keeps the dialog inside the size it is now, the
              condition the report attached to the fix. Past the cap the
              textarea scrolls, so a very long clause is still all reachable. */}
      <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_description')}</span>
        ${''/* Ampersand FIRST, then the angle bracket — the other order turns
                the &lt; it just wrote into &amp;lt; and a clause about "Fees &
                Charges" comes back reading its own source code. Escaped as
                element content rather than as an attribute value, which is what
                moving from <input value=""> to <textarea> changes. */}
        <textarea id="of-desc" rows="3" class="of-desc mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${(seed.desc||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')}</textarea></label>
      <div class="grid grid-cols-2 gap-3 mb-2.5">
        <label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_due_date')}</span>
          <input id="of-due" type="date" value="${seed.due||''}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
        <label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_recurring')}</span>
          <select id="of-recur" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${OBLIG_RECUR.map(([k,l])=>`<option value="${k}" ${seed.recurring===k?'selected':''}>${l}</option>`).join('')}</select></label>
      </div>
      ${''/* ---- COMES AFTER: THE ONE DOOR ONTO THE ORDER (L-5) ----
              The render drew an "Edit the order" button on the chain head as
              well. IT IS NOT BUILT: an obligation's facts are edited here, and
              a second door onto one act is the drift this rulebook opens by
              warning about. One picker, in the dialog that already owns every
              other fact about a step.
              IT OFFERS ITS SIBLINGS AND NEVER ITSELF, and a choice that would
              close a loop is refused on save rather than hidden — the reader
              is told which step they cannot point at and why.
              DRAWN ONLY WHERE THERE IS A SIBLING TO POINT AT: on a contract
              with one obligation the control's only outcome is "Nothing", and
              a control whose one answer is its own default is furniture. */}
      ${(() => {
        const sibs = ((c && c.obligations) || []).filter(o => o && o.id && (seed._i == null || o !== (c.obligations || [])[seed._i]));
        if(!sibs.length) return '';
        return `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_after')}</span>
          <select id="of-after" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">
            <option value="">${_obEsc(i18t('ob_after_none'))}</option>
            ${sibs.map(o => `<option value="${_obEsc(o.id)}"${String(seed.after || '') === String(o.id) ? ' selected' : ''}>${_obEsc(o.desc || o.id)}</option>`).join('')}
          </select>
          <span class="block text-[11px] text-ink/55 mt-1">${_obEsc(i18t('ob_after_hint'))}</span></label>`;
      })()}
      ${''/* ---- THE AMOUNT (J-5.2) ----
              A ROW OF ITS OWN, directly under Due date / Recurring, with the
              CONTRACT'S currency as a fixed prefix rather than a picker.
              NOTHING ABOVE OR BELOW IT MOVED, was renamed or was taken away —
              the first render of this dialog was redrawn from intent rather
              than from the screen and got six things wrong, the worst being
              that it dropped the "Whose obligation is this?" toggle outright.
              The only new thing on this dialog is this row.
              DRAWN ON BOTH SIDES OF THAT TOGGLE: money they owe us matters as
              much as money we owe them, so it is not hidden with Assign to.
              NOT DRAWN AT ALL for a reader without the money permission. */}
      ${obligationMoneyVisible() ? `<label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_amount')}</span>
        <span class="of-amt mt-1"><i>${_obEsc(typeof window.contractCurrency==='function'?contractCurrency(c):'')}</i><input id="of-amount" type="number" min="0" step="any" inputmode="decimal" value="${seed.amount!=null&&seed.amount!==''?String(seed.amount).replace(/"/g,'&quot;'):''}" placeholder="${_obEsc(i18t('ob_amount_ph'))}"/></span>
        <span class="block text-[11px] text-ink/55 mt-1">${_obEsc(i18t('ob_amount_hint'))}</span></label>` : ''}
      ${''/* WHOSE JOB, ASKED BEFORE WHO ON OUR SIDE. The two questions are not
              independent — "assign to" only means anything for an obligation
              that is ours — so the field that decides it comes first, and the
              one it governs is hidden when it does not apply. */}
      <div class="mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_whose')}</span>
        <div id="of-party" class="mt-1 grid grid-cols-2 gap-2">
          ${OBLIG_PARTY.map(([k,l])=>{ const on=(seed.party==='theirs'?'theirs':'ours')===k;
            return `<button type="button" data-of-party="${k}" class="rounded-lg border px-3 py-2 text-[12.5px] font-600 transition ${on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/70 hover:bg-slate-50'}">${k==='theirs'?((c.counterparty||'').replace(/</g,'&lt;')||l):l}</button>`; }).join('')}
        </div></div>
      <label id="of-assignee-wrap" class="block mb-4 ${seed.party==='theirs'?'hidden':''}"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_assign_to')}</span>
        <input id="of-assignee" list="of-members" value="${(seed.assignee||'').replace(/"/g,'&quot;')}" placeholder="Team member" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
        <datalist id="of-members">${members.map(m=>`<option value="${m}">`).join('')}</datalist></label>
      <p id="of-theirs-note" class="mb-4 text-[11px] text-ink/55 leading-relaxed ${seed.party==='theirs'?'':'hidden'}">This is something ${(c.counterparty||'the counterparty').replace(/</g,'&lt;')} owes. It appears on your calendar and dashboard as something to chase rather than something to do.</p>
      <div class="flex justify-end gap-2">
        <button id="of-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        <button id="of-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('act_save')}</button>
      </div>
    </div>`);
  let party=(seed.party==='theirs')?'theirs':'ours';
  const paintParty=()=>{
    document.querySelectorAll('[data-of-party]').forEach(b=>{
      const on=b.getAttribute('data-of-party')===party;
      b.className=`rounded-lg border px-3 py-2 text-[12.5px] font-600 transition ${on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/70 hover:bg-slate-50'}`;
    });
    document.getElementById('of-assignee-wrap')?.classList.toggle('hidden', party==='theirs');
    document.getElementById('of-theirs-note')?.classList.toggle('hidden', party!=='theirs');
  };
  document.querySelectorAll('[data-of-party]').forEach(b=>b.addEventListener('click',()=>{
    party=b.getAttribute('data-of-party')==='theirs'?'theirs':'ours'; paintParty(); }));
  document.getElementById('of-cancel').addEventListener('click',closeModal);
  document.getElementById('of-save').addEventListener('click',()=>{
    const o={ id:seed.id||('ob_'+Math.abs((Date.parse(nowISO())+(c.obligations||[]).length)).toString(36)),
      desc:document.getElementById('of-desc').value.trim(), due:document.getElementById('of-due').value,
      recurring:document.getElementById('of-recur').value,
      party,
      /* An obligation that is theirs carries no assignee of ours. Leaving a
         stale colleague's name on it would put their job in our queue. */
      assignee: party==='theirs' ? '' : document.getElementById('of-assignee').value.trim(),
      status:seed.status||'open', quote:seed.quote||'' };
    /* THE ORDER. Absent means no chain, which is what every obligation on file
       carries — so the key is only ever written when a step is actually chosen,
       and a record that never had one is byte-identical to what it was. */
    const afterSel = (document.getElementById('of-after')?.value || '').trim();
    if(afterSel) o.after = afterSel; else if(seed.after && !document.getElementById('of-after')) o.after = seed.after;
    /* NEVER A ZERO AND NEVER AN EMPTY KEY. An obligation saved without an
       amount carries no `amount` at all, which is what makes every record
       filed before this field existed read identically. A reader without the
       money permission draws no box, so the field is CARRIED FORWARD from the
       record rather than read off a control that is not there — otherwise
       opening an obligation would silently erase its figure. */
    if(!obligationMoneyVisible()){
      if(seed.amount!=null&&seed.amount!=='') o.amount=Number(seed.amount);
    } else {
      const raw=(document.getElementById('of-amount')?.value||'').trim();
      const n=Number(raw);
      if(raw!==''&&isFinite(n)&&n>0) o.amount=n;
    }
    if(!o.desc){ toast('Enter a description','err'); return; }
    c.obligations=c.obligations||[];
    const editing=seed._i!=null;
    /* ---- NO DUPLICATE OBLIGATIONS, EVER (M-4) ----
       (owner-reported 31 Aug 2026: *"never allow for addition of duplicate
       obligations."*)

       THE SCAN ALREADY REFUSED ONE and this form did not — so the one door a
       person types into was the one door with no guard, and with J-5.2 in, a
       duplicated obligation is duplicated MONEY on every figure that sums them.

       IT ASKS obligationAlreadyOn, THE ONE READING, rather than growing a
       second: description matched with whitespace collapsed and case folded,
       exactly as the scan matches, so the two doors cannot come to disagree
       about what "the same obligation" means.

       NEVER AGAINST ITSELF. Editing an obligation and saving it without
       changing its wording is not a duplicate, so the row being edited is left
       out of the comparison — otherwise every second save of an existing
       obligation would be refused.

       REFUSED IN WORDS, never silently dropped: the reader typed it and is owed
       the reason and the name of what it clashes with. */
    const others = { obligations:(c.obligations||[]).filter((_,i)=>!(editing&&i===seed._i)) };
    if(obligationAlreadyOn(others,o)){ toast(i18t('ob_dupe',{ desc:o.desc }),'err'); return; }
    /* ---- A LOOP IS REFUSED IN WORDS (L-5) ----
       Two steps pointing at each other would leave both waiting for ever with
       nothing on screen able to say why. Checked against the list AS IT WOULD
       STAND after this save, which is the only version that can be wrong, and
       named rather than silently cleared: the reader chose that step and is
       owed the reason. Bounded by the list's own length, so a record already
       hand-edited into a loop cannot hang the check either. */
    if(o.after){
      const next = (c.obligations || []).slice();
      if(editing) next[seed._i] = o; else next.push(o);
      const seen = new Set([String(o.id)]);
      let cur = o, hops = next.length + 1;
      while(hops-- > 0){
        const pid = String(cur.after || ''); if(!pid) break;
        const p = next.find(x => x && String(x.id) === pid); if(!p) break;
        if(seen.has(String(p.id))){ toast(i18t('ob_after_loop',{ desc: p.desc || p.id }),'err'); return; }
        seen.add(String(p.id)); cur = p;
      }
    }
    if(editing) c.obligations[seed._i]=o; else c.obligations.push(o);
    /* THE ORDER IS WRITTEN INTO HISTORY (ruling 3). Setting it changes when
       reminders fire, which is closer to a rule than to a note — and unlike
       completing a step, it is not otherwise recorded anywhere. */
    const afterOb = o.after ? (c.obligations || []).find(x => x && String(x.id) === String(o.after)) : null;
    logAudit(c,'Obligation',`${editing?'Updated':'Added'}: ${o.desc}${o.due?` (due ${o.due})`:''}`
      +` — ${party==='theirs'?`${c.counterparty||'the counterparty'}'s to deliver`:`ours${o.assignee?`, assigned to ${o.assignee}`:''}`}`
      +(afterOb?` — comes after "${afterOb.desc||afterOb.id}"`:''));
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
  });
}
/* ---- THE SCAN SAYS IT IS WORKING, AT EVERY DOOR (M-3) ----
   (owner-reported 31 Aug 2026, off a screenshot of the contract's Obligations
   tab: *"when you click on find obligations or scanning of obligations, it is
   not clear that something is working in the background so provide a symbol
   that a search is ongoing within the button."*)

   THE BUSY STATE EXISTED AND REACHED ONE DOOR OF TWO. runFindObligations wrote
   it onto `#ob-find` — the Checks card's door — and the contract's own
   Obligations tab draws `#obt-find`, which was never touched at all. The tab
   is the door in the screenshot, so on the screen the owner was looking at, a
   scan that takes twenty seconds said nothing whatsoever.

   ONE HELPER, EVERY DOOR, so a third one added later cannot be forgotten: it
   is a list rather than two lines, and OB_FIND_DOORS is where a new door joins.

   A SYMBOL, NOT ONLY A WORD, which is what was asked for — a spinning ring
   beside the word, defined in HaTi's own sheet and standing still under
   prefers-reduced-motion.

   THE LABEL IS REMEMBERED ON THE ELEMENT rather than rebuilt from a key: these
   two doors do not read the same word (one is a card row, one is a tab act),
   and a helper that put one word back on both would rename the other. */
const OB_FIND_DOORS = ['ob-find', 'obt-find'];
function obFindBusy(on){
  OB_FIND_DOORS.forEach(id => {
    const b = document.getElementById(id); if(!b) return;
    if(on){
      if(b.dataset.obWas == null) b.dataset.obWas = b.innerHTML;
      b.disabled = true; b.setAttribute('aria-busy', 'true');
      b.innerHTML = `<span class="ob-spin" aria-hidden="true"></span>${_obEsc(i18t('ob_scanning'))}`;
    } else {
      b.disabled = false; b.removeAttribute('aria-busy');
      if(b.dataset.obWas != null){ b.innerHTML = b.dataset.obWas; delete b.dataset.obWas; }
    }
  });
}
async function runFindObligations(c){
  obFindBusy(true);
  /* AND IT STOPS SPINNING WHATEVER HAPPENS. A refusal deep in the reader — no
     key, a provider saying no, a document too short — must not leave a button
     disabled and spinning for the life of the page, which is a dead screen
     wearing a working one's clothes. */
  let found = [];
  try{ found = await extractObligations(c) || []; }
  finally{ obFindBusy(false); }
  /* ---- THE CONTRACT REMEMBERS THAT IT WAS READ (J-2.2) ----
     "No obligations tracked" and "nobody has looked" were the same screen, and
     the Insights obligations page named that as one of its two blind spots.
     Stamped by the SCAN and by nothing else — a stamp written anywhere else
     would claim a reading that never happened — and WHATEVER IT FOUND,
     including nothing: a contract read and genuinely clear is exactly the case
     this fact exists to tell apart from one nobody has opened.

     NOT WHERE THERE WAS NOTHING TO READ. extractObligations refuses a document
     under 120 characters in words and returns an empty list, and a stamp there
     would record a reading of a document that could not be read. Asked the
     same way it asks — one reading, not a second copy of the test. */
  const _obText = isUpload(c) ? (c.upload&&c.upload.extractedText)||''
    : (window.contractPlainText?contractPlainText(c):'');
  if(_obText && _obText.length>=120){ obligationsReadStamp(c, _obText); persist(c); }
  renderObligationsSection(c);
  if(window.roomPaintObligations) roomPaintObligations(c);
  /* AND IT MUST SAY SO OUT LOUD, WITH A WAY FORWARD. This was a BARE toast
     call, which by this product's own rule is SILENT — so pressing Find
     obligations on a contract that returned nothing did nothing visible at
     all, and the reader had no way to tell a working scan from a broken
     button.

     THE SECOND PRESS IS OFFERED BECAUSE IT OFTEN WORKS, and that is measured
     rather than hoped: across the CUAD scorecard's five runs the same
     contract returned 12, then 20, then 0, then 0, then 0 obligations, and
     one that answered nothing on a fifty-contract run answered 24 on the
     next. Silence here is INCONSISTENCY, not blindness — it is not the
     length of the contract (measured on all fifty: silent contracts average
     36,518 characters against 37,813 for answering ones, which is nothing)
     and not its kind (maintenance, distribution, outsourcing and transport
     agreements sit on both sides).

     So the honest thing is neither to claim the contract has no obligations
     nor to hide the result: say what happened and offer the retry, because a
     refusal needs its way forward on the same screen. */
  if(!found.length){
    toast(i18t('ob_none_found'),'warn',{ action:{ label:i18t('ob_try_again'),
      onClick:()=>runFindObligations(c) } });
    return;
  }
  openObligationsReview(c, found);
}
/* ---- Find obligations, AND THE THREE THINGS WRONG WITH IT (J-5.3) ----
   Owner-reported 30 Aug 2026, off a preferred-stock charter carrying 18
   proposals: *"what is the purpose of find obligations? It seems to have a bug
   today."*

   WHAT IT IS FOR, since the screen never says: it reads the wording with
   Copilot and proposes the ongoing duties it finds — payment milestones,
   notice deadlines, deliverables, reporting — each with the verbatim clause it
   came from. The reader ticks; nothing is saved until they confirm. It exists
   so nobody reads forty pages hunting for promises.

   THE THREE:
     1  NO DEDUPE. This handler pushed every ticked proposal with a fresh
        random id and never asked whether it was already on the contract, so
        pressing it twice turned 18 into 36 into 54. With J-5.2 in, a
        duplicated list is duplicated MONEY, which is what makes it the one to
        fix first.
     2  EVERY PROPOSAL ARRIVED TICKED, which is what made (1) so easy to
        trigger — the natural press added all eighteen.
     3  THE CONFIRMATION WAS SILENT. `toast('Added N…')` is a BARE call, and by
        this product's own rule a bare toast prints nothing, so the act that
        changed the record said nothing on screen. It was hardcoded English
        besides.

   A DUPLICATE IS SHOWN, NOT HIDDEN. It arrives unticked with a word saying
   why — never silently dropped, because the reader has to be able to see that
   the scan found it AND that they already have it. */
/* ONE READING OF "we already have this", asked at the draw and again at the
   add, so a proposal cannot slip in between the two. Matched on the DESCRIPTION
   rather than on an id: the scan mints nothing and a proposal has no identity
   of its own — its wording is the only thing it and the stored obligation
   share. Compared with whitespace collapsed and case folded, because the same
   clause read twice comes back punctuated a little differently. */
const _obKey = s => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:]+$/, '').trim();
function obligationAlreadyOn(c, proposal){
  const k = _obKey(proposal && proposal.desc);
  if(!k) return false;
  return ((c && c.obligations) || []).some(o => _obKey(o && o.desc) === k);
}
function openObligationsReview(c, found){
  const dupe = found.map(o => obligationAlreadyOn(c, o));
  const fresh = dupe.filter(d => !d).length;
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">${i18t('ob_proposed')}</h3></div>
      <p class="text-xs text-ink/60 mb-3">${i18t('ob_tick_to_add')} <b>ours</b> — open any one afterwards to mark it as the counterparty&rsquo;s, or to set a date and an owner. Nothing is saved until you confirm.</p>
      <div class="space-y-2 max-h-[45vh] overflow-y-auto scroll-thin mb-4">
        ${found.map((o,i)=>`<label class="flex gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 cursor-pointer${dupe[i]?' opacity-70':''}">
          <input type="checkbox" data-ob-pick="${i}"${dupe[i]?'':' checked'} class="mt-0.5 h-4 w-4 rounded border-brand-200 accent-brand-700"/>
          <span class="min-w-0"><span class="block text-[12.5px] font-normal text-ink">${(o.desc||'').replace(/</g,'&lt;')}</span>
          ${dupe[i]
            ? `<span class="block text-[10px] text-gold-700 mt-0.5">${_obEsc(i18t('ob_already_on'))}</span>`
            : (o.quote?`<span class="block text-[10px] text-ink/50 italic mt-0.5">&ldquo;${o.quote.replace(/</g,'&lt;')}&rdquo;</span>`:'')}</span></label>`).join('')}
      </div>
      <div class="flex justify-end gap-2">
        <button id="or-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        ${''/* THE BUTTON COUNTS WHAT WILL ACTUALLY BE ADDED, so a press on a
               second scan that finds nothing new says so before it is pressed
               rather than afterwards. Its LABEL is written by obPaintAdd and
               never here — see the note on that painter. */}
        <button id="or-add" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700 disabled:opacity-50"></button>
      </div>
    </div>`);
  /* ---- THE COUNT FOLLOWS THE TICKS, LIVE (owner-reported 1 Sep 2026) ----
     *"as I exclude or include any obligations, the count in the highlighted
     button should in live reflect the number of obligations checked only."*

     IT WAS WRITTEN ONCE, AT THE DRAW. The count was right the moment the window
     opened — it already left duplicates out, which is what J-5.3 built it for —
     and then never moved again, so untick fifteen of twenty and the button
     still offered to add twenty.

     ONE PAINTER AND NO SECOND COPY. The label is not written into the markup
     above at all: this function is the only thing that writes it, so the first
     paint and every repaint go through one reading and cannot come to disagree
     about what the number means.

     AND ZERO IS TWO DIFFERENT SENTENCES, which is why the state is read rather
     than the number alone. Nothing ticked because the scan found nothing new is
     a fact about the scan; nothing ticked because the reader untied everything
     is their own choice, and telling them "nothing new to add" over a list full
     of new proposals would be the window arguing with itself. Either way the
     button is DISABLED — this product's own rule: grey where it can be known
     before the press, rather than a refusal after it. */
  const obPicks = () => Array.prototype.slice.call(
    document.querySelectorAll('#modal-root [data-ob-pick]'));
  function obPaintAdd(){
    const btn = document.getElementById('or-add');
    if (!btn) return;
    const n = obPicks().filter(cb => cb.checked).length;
    btn.textContent = n
      ? i18tn('ob_add_n', n, { n })
      : i18t(fresh ? 'ob_add_pick' : 'ob_add_none');
    btn.disabled = !n;
  }
  obPaintAdd();
  /* ONE DELEGATED LISTENER on the window rather than one per row: the list runs
     to twenty on a real agreement, and a listener per box is twenty things to
     keep in step with a row that is redrawn. */
  const modal = document.getElementById('modal-root');
  if (modal) modal.addEventListener('change', ev => {
    if (ev.target && ev.target.closest && ev.target.closest('[data-ob-pick]')) obPaintAdd();
  });
  document.getElementById('or-cancel').addEventListener('click',closeModal);
  document.getElementById('or-add').addEventListener('click',()=>{
    c.obligations=c.obligations||[];
    /* WHAT WAS ALREADY THERE IS COUNTED OFF THE PROPOSALS, not off the boxes.
       The dialog unticks a duplicate on the reader's behalf, so counting only
       the ticked ones would report "1 added" and say nothing at all about the
       two it had set aside — which is the silent half of the reported bug
       returning in politer clothes. */
    let n=0, skipped=dupe.filter(d=>d).length;
    document.querySelectorAll('[data-ob-pick]').forEach(cb=>{ if(!cb.checked) return;
      const o=found[Number(cb.getAttribute('data-ob-pick'))];
      /* ASKED AGAIN AT THE ADD, not only at the draw. The dialog can be open
         while another surface files an obligation, and this is the wall — the
         checkbox is the sign. */
      /* And the wall: a proposal the reader ticked anyway, or one that became
         a duplicate while the dialog was open, is still not added twice. */
      if(obligationAlreadyOn(c,o)) return;
      c.obligations.push({ id:'ob_'+Math.random().toString(36).slice(2,8), desc:o.desc, due:o.due||'', recurring:o.recurring||'none', assignee:'', status:'open', quote:o.quote||'' }); n++; });
    logAudit(c,'Obligation',`Added ${n} obligation${n===1?'':'s'} from Copilot scan`
      +(skipped?` — ${skipped} already on the contract`:''));
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
    if(window.roomPaintObligations) roomPaintObligations(c);
    /* AND IT SAYS SO OUT LOUD. A bare toast prints NOTHING in this product, so
       the one act on this dialog that changes the record said nothing at all.
       'ok' because something arrived; 'warn' when nothing did, because a
       confirmation reading "0 added" is a refusal wearing a receipt's clothes. */
    /* ZERO IS A DIFFERENT SENTENCE, NOT A PLURAL FORM — tn knows only _one and
       _other, so a _zero suffix would be a key nothing ever reads. */
    toast(n === 0
      ? (skipped ? i18t('ob_added_none_dupes', { d: skipped }) : i18t('ob_added_none'))
      : (skipped ? i18tn('ob_added_n_dupes', n, { n, d: skipped }) : i18tn('ob_added_n', n, { n })),
      n ? 'ok' : 'warn');
  });
}


/* ============================================================
   THE OBLIGATIONS TAB — a home of their own (owner-asked 29 Aug 2026, J-2.1)
   ============================================================
   *"i want to first understand how obligations work in HaTi. I am not sure I
   understand how I follow up on obligations per contract"*

   THEY HAD NO HOME. A contract's promises lived behind a card called CHECKS,
   which is about the things you run BEFORE sending a contract out — the
   playbook pass, the risk scan, the brief. An obligation is the opposite: it
   starts mattering the day the paper is signed and it outlives every one of
   those checks. So the reader who asked "how do I follow up per contract" was
   being sent to a card whose own name says it is somewhere else.

   IT IS A READING AND IT ADDS NO STORE, NO ROUTE AND NO FIELD. Every figure
   here is counted off `c.obligations`, which the record already carries and
   which survives the light contract list. Nothing in this phase writes.

   AND IT BORROWS EVERY READING. `obState` for open/overdue/done,
   `obligationDue` for the date, `obligationIsTheirs` for the side,
   `obligationOwner` for who has it, and `toggleObligation` for the one act. A
   second copy of "is this overdue" is how two screens come to disagree about
   one commitment — which is the whole reason this file has those functions.
   ============================================================ */
const _obEsc = s => String(s == null ? '' : s).replace(/[&<>"]/g,
  ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));

/* ---- WHO THE REMINDER WOULD ACTUALLY REACH ----
   THE SERVER'S `obligationRecipient` IS THE AUTHORITY and this is its browser
   twin: email first, then name, case-insensitively, and only where the member
   has an address to write to. The whole roster is in every browser already —
   the reviewer picker and the approval rules need it — so this needs no route.

   IT MUST STAY ONE READING. The Insights obligations page worked this out for
   itself when it was built; that copy now asks this function, because two
   answers to "will anybody be told" is exactly how a page comes to contradict
   the sweep that sends the mail.

   NULL IS A FACT, NOT A FAILURE. An obligation whose assignee resolves to
   nobody still gets ONE admin note on day one and then silence for ever — so
   the row says so, which is the cheapest fix in this whole job. */
function obligationReminderTo(o){
  const q = String((o && o.assignee) || '').trim().toLowerCase();
  if(!q) return null;
  let mem = [];
  try{ mem = (typeof window.getUsers === 'function') ? (getUsers() || []) : []; }catch(_){ mem = []; }
  const addressed = u => /.+@.+\..+/.test(String((u && u.email) || '').trim());
  const hit = mem.find(u => addressed(u) && String(u.email).trim().toLowerCase() === q)
    || mem.find(u => addressed(u) && String((u && u.name) || '').trim().toLowerCase() === q);
  return hit || null;
}
/* Is this the reader's own? Asked of the RESOLUTION above rather than of the
   assignee string, so "wanjiku@…" and "Wanjiku Kamau" are one person here
   exactly as they are one person to the sweep. */
function obligationIsMine(o){
  let me = null;
  try{ me = (typeof currentUser === 'function') ? currentUser() : null; }catch(_){ me = null; }
  if(!me) return false;
  const to = obligationReminderTo(o);
  return !!(to && String(to.id) === String(me.id));
}

/* ---- FOUR BANDS, AND EVERY OBLIGATION LANDS IN EXACTLY ONE ----
   Overdue · due this month · later · completed. The last branch is a catch-all,
   so a record in a shape nobody thought of is drawn rather than dropped.

   AN OBLIGATION WITH NO DATE READS AS 'later' and its row says "no date". It
   is not overdue — nothing can be — and burying it under "completed" would be
   a lie; the row is where that fact belongs, not a fifth band. */
/* ---- AND A FIFTH, FOR A STEP THAT IS SOMEBODY ELSE'S TURN (L-1) ----
   AFTER 'later' AND BEFORE 'done', which is a DEPARTURE FROM THE RENDER the
   owner approved — that drew it second, under Overdue. These bands are ordered
   by what needs you FIRST, and a step waiting on an earlier one needs nobody;
   put second it would sit above work that really is yours to do. It is still
   above 'done', because the money on it is outstanding and the promise is
   live. Said out loud rather than slipped in.

   IT IS ONLY EVER REACHED WITH A CONTRACT. obligationBand takes one now, and
   without it there is no chain to read, so every caller written before this
   answers exactly as it did — which is the whole migration story. */
const OBLIG_BANDS = [
  ['overdue', 'ob_band_overdue'],
  ['month',   'ob_band_month'],
  ['later',   'ob_band_later'],
  ['waiting', 'ob_band_waiting'],
  ['done',    'ob_band_done'],
];

/* ============================================================================
   THE PAYMENT CHAIN (L-1, owner-instructed 31 Aug 2026 off the before/after
   render: "Build based on your recommendation.")

   ONE NEW FIELD ON AN OBLIGATION — `after`, the id of the step it follows —
   and everything else here is a READING of it. Absent means not in a chain,
   which is every obligation on file today, so THERE IS NO MIGRATION and
   nothing already stored reads differently on any screen.

   WHAT IT BUYS, and the third is the one that matters: the steps draw in
   order; the money on them splits into promised against paid; and a step whose
   predecessor is unpaid STOPS BEING CHASED. Before this, HaTi would email a
   supplier about the commissioning payment on a plant purchase while the
   delivery payment was still outstanding.
   ========================================================================== */
const obligationAfter = o => { const v = String((o && o.after) || '').trim(); return v || null; };
/* The step this one follows, resolved against its OWN contract's list.
   NEVER ITSELF, and a pointer at a step that is not there answers null rather
   than blocking: deleting a step must not silently freeze everything after it,
   and the survivors read as unchained. */
function obligationPrev(o, c){
  const id = obligationAfter(o);
  if(!id) return null;
  /* BY ID AND NEVER BY IDENTITY. The worklist hands these readings a SPREAD
     COPY (`{...o, cid, ...}`), so `x !== o` is true of the row's own original
     and a self-reference would find ITSELF as its predecessor and block for
     ever. Every reading below matches on the id for the same reason. */
  const self = String((o && o.id) || '');
  if(id === self) return null;
  const list = (c && c.obligations) || [];
  return list.find(x => x && String(x.id) === id) || null;
}
/* BLOCKED = the step before it exists and is not done.
   THE DIRECT PREDECESSOR ONLY, and that is not a shortcut — it is what makes
   this safe. Step 4 waits on 3 and 3 waits on 2, so 4 stays blocked for as
   long as 3 is, WITH NO WALK AND THEREFORE NO CYCLE TO FALL INTO. A completed
   step never blocks anything, including itself. */
function obligationBlocked(o, c){
  if(!o || o.status === 'done') return false;
  const p = obligationPrev(o, c);
  return !!p && obState(p) !== 'done';
}
/* THE CHAIN THIS STEP SITS IN, in order, or [] where it is in none.
   Walks BACK to the head and then FORWARD, and both walks carry a seen-set —
   a record hand-edited into a loop must draw something rather than hang the
   contract's page. A chain of one is not a chain. */
function obligationChain(o, c){
  const list = (c && c.obligations) || [];
  if(!o || !list.length) return [];
  /* Start from the STORED object with this id, never the caller's copy, so a
     chain read off a worklist row is the same chain the contract's own tab
     draws — and an obligation with no id can be in no chain at all. */
  const self = String((o && o.id) || '');
  let head = self ? list.find(x => x && String(x.id) === self) : null;
  if(!head) return [];
  const back = new Set([self]);
  for(;;){
    const p = obligationPrev(head, c);
    const pid = p ? String(p.id || '') : '';
    if(!p || !pid || back.has(pid)) break;
    back.add(pid); head = p;
  }
  const out = [head], used = new Set([String(head.id || '')]);
  for(;;){
    const id = String((out[out.length - 1] || {}).id || '');
    if(!id) break;
    const next = list.find(x => x && !used.has(String(x.id || '')) && obligationAfter(x) === id);
    if(!next) break;
    out.push(next); used.add(String(next.id || ''));
  }
  return out.length > 1 ? out : [];
}
/* EVERY CHAIN ON A CONTRACT, AS A PARTITION. Two steps pointing at the same
   predecessor is branching, which this feature deliberately does not do — so
   the second one is left where it is rather than drawn in a chain it would
   also appear in twice. An obligation is in AT MOST ONE of these lists, and
   that is what lets the tab draw the chains and then the bands over what is
   left without anything appearing on the page twice. */
function obligationChains(c){
  const list = (c && c.obligations) || [];
  const out = [], placed = new Set();
  list.forEach(o => {
    const id = String((o && o.id) || '');
    if(!id || placed.has(id)) return;
    const ch = obligationChain(o, c);
    if(!ch.length || ch.some(x => placed.has(String(x.id || '')))) return;
    ch.forEach(x => placed.add(String(x.id || '')));
    out.push(ch);
  });
  return out;
}
/* "Step 2 of 4", for a row that is not being drawn inside its own chain — the
   worklist's, where there is no room to draw the chain itself. */
function obligationStepNo(o, c){
  const ch = obligationChain(o, c);
  if(!ch.length) return null;
  const id = String((o && o.id) || '');
  const i = ch.findIndex(x => String(x.id || '') === id);
  return i < 0 ? null : { n: i + 1, of: ch.length };
}
/* WHAT IS OWED AND WHAT HAS MOVED, over one contract's own currency. THE ONE
   ARITHMETIC behind the tab's money line, and the shape the worklist's foot
   fills in home currency. `paid` is not a new state: it is what completing a
   step already records, so no figure is ever entered twice and the two can
   never disagree. */
function obligationRoll(list){
  let committed = 0, paid = 0, outstanding = 0, overdue = 0;
  (list || []).forEach(o => {
    const n = obligationAmount(o);
    if(n === null) return;
    committed += n;
    if(obState(o) === 'done'){ paid += n; return; }
    outstanding += n;
    if(obState(o) === 'overdue') overdue += n;
  });
  return { committed, paid, outstanding, overdue };
}
/* ---- AN OBLIGATION CARRIES AN AMOUNT (J-5.2) ----
   It held a description, a due date, a cadence, an owner, a side and a
   completion record, and it could not hold a NUMBER — so "Second tranche —
   KES 4,000,000" was prose that could not be added up, charted or forecast.
   Disbursement tracking is the market's word for the thing this one missing
   field prevented.

   ONE FIELD, AND NO CURRENCY BESIDE IT. The currency is the CONTRACT'S,
   read through contractCurrency, and is shown as a fixed prefix — a second
   currency stored on the obligation is a second answer that can drift from
   the contract's own. One contract, one currency.

   BLANK BY DEFAULT AND NEVER ZERO. A zero is a figure somebody typed, and an
   obligation with no money on it must read as having none rather than as
   having nothing owed. An obligation saved without one carries no `amount`
   key at all, which is why every existing record draws identically. */
const obligationAmount = o => {
  const n = Number(o && o.amount);
  return (o && o.amount != null && o.amount !== '' && isFinite(n)) ? n : null;
};
const obligationHasAmount = o => obligationAmount(o) !== null;
/* A band's own sum, and the same function the foot total asks. Rows carrying
   no amount contribute nothing rather than a zero. */
const obligationBandTotal = rows => (rows || []).reduce((sum, r) => {
  const n = obligationAmount(r && r.o ? r.o : r);
  return n === null ? sum : sum + n;
}, 0);
/* Money obeys the product's existing permission, never a new rule of this
   feature's own. Read through `window`: this module draws on stages that do
   not carry the shell, and there the honest answer is that nothing is hidden. */
const obligationMoneyVisible = () => (typeof window.canViewValues === 'function') ? !!canViewValues() : true;
/* WHAT A FIGURE PRINTS. The contract's own currency, through the product's own
   short formatter, so an obligation and the contract it sits on can never be
   written in different money. */
function obligationMoneyText(n, c){
  if(n === null || n === undefined) return '';
  if(typeof window.fmtMoneyShortIn === 'function' && typeof window.contractCurrency === 'function')
    return fmtMoneyShortIn(n, contractCurrency(c));
  if(typeof window.fmtMoneyShort === 'function') return fmtMoneyShort(n);
  return String(n);
}
function obligationBand(o, c){
  const st = obState(o);
  if(st === 'done') return 'done';
  /* ---- WAITING OUTRANKS OVERDUE (L-1) ----
     A held-back step whose date has passed IS late by the calendar and is not
     late by anybody's fault — nobody could have done it. Banding it overdue
     would put work nobody may act on at the top of the page, which is the
     count-that-lies fault this whole job exists to close. `obState` is
     deliberately NOT changed: the calendar, the alerts window and every
     existing reading still see it as open or overdue by its own date.
     WITHOUT A CONTRACT THERE IS NO CHAIN TO READ, so a caller written before
     this answers exactly as it did. */
  if(c && obligationBlocked(o, c)) return 'waiting';
  if(st === 'overdue') return 'overdue';
  const due = obligationDue(o);
  if(!due) return 'later';
  /* LOCAL MIDNIGHT, the convention every other date reading in this file uses
     (renewalDecisionDate and obligationNextDue both write it out). A bare
     `new Date('2026-08-01')` is parsed as UTC midnight, so at any negative
     offset the month comparison shifts by a day and an obligation due on the
     1st bands as `later`. This is the reading BOTH the contract's tab and the
     worklist share, so they were wrong together. */
  const d = new Date(String(due) + 'T00:00:00'), now = new Date();
  if(isNaN(d)) return 'later';
  return (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    ? 'month' : 'later';
}

/* ---- WHAT THE TAB SAYS ABOUT ITSELF ----
   The count is what is still OUTSTANDING, and it is AMBER ONLY WHEN SOMETHING
   IS OVERDUE. A count that is always coloured is a warning nobody reads — the
   sidebar's own rule, applied to a tab. */
/* ---- AND THE COUNT STOPPED LYING (L-1) ----
   "4 outstanding" over four tranches of which two were waiting their turn was
   the tab claiming four things needed somebody this month. `open` counts what
   can be ACTED ON; `waiting` is said beside it in its own words, so nothing is
   hidden — only correctly named. */
function obligationTabState(c){
  const obs = (c && c.obligations) || [];
  let open = 0, overdue = 0, waiting = 0;
  obs.forEach(o => {
    if(obState(o) === 'done') return;
    if(obligationBlocked(o, c)){ waiting++; return; }
    open++; if(obState(o) === 'overdue') overdue++;
  });
  return { open, overdue, waiting, total: obs.length };
}

/* ---- THE PANE ----
   ONE FULL-WIDTH CARD, laid out like the History tab rather than like Key
   terms: this is a worklist and not a document, so it wants the width and it
   wants rows ruled edge to edge. */
function roomObligationsHtml(c){
  const obs = (c && c.obligations) || [];
  const editable = (typeof canEdit === 'function') ? canEdit() : false;
  const st = obligationTabState(c);
  const rows = obs.map((o, i) => ({ o, i, band: obligationBand(o, c) }));
  const money = obligationMoneyVisible();

  /* "0 outstanding" over an empty state that already says nothing is tracked is
     the same fact printed twice, and the second printing is the one that reads
     like a fault. The acts stay: they are the way in. */
  /* ---- ONE MONEY LINE, IN THE HEAD (L-2) ----
     Committed against paid, and it goes HERE rather than into a card of its
     own: the head already carries the counts, so this is the cheapest channel
     that carries the fact and it costs the page no height. Drawn only where
     the reader may see money AND there is money to state — a line reading
     "0 paid of 0" is furniture. */
  const roll = obligationRoll(obs);
  const moneyLine = (money && roll.committed)
    ? `<span class="obt-paid">${_obEsc(i18t('ob_paid_of', {
        paid: obligationMoneyText(roll.paid, c), all: obligationMoneyText(roll.committed, c) }))}</span>` : '';
  const head = `<div class="obt-head">
      ${obs.length ? `<span class="obt-cap">${_obEsc(i18tn('ob_head_open', st.open, { n: st.open }))}</span>` : ''}
      ${st.overdue ? `<span class="obt-over">${_obEsc(i18tn('ob_head_overdue', st.overdue, { n: st.overdue }))}</span>` : ''}
      ${st.waiting ? `<span class="obt-wait">${_obEsc(i18tn('ob_head_waiting', st.waiting, { n: st.waiting }))}</span>` : ''}
      ${moneyLine}
      ${editable ? `<span class="obt-acts">
        <button type="button" id="obt-add" class="ui-btn">${_obEsc(i18t('ob_add'))}</button>
        <button type="button" id="obt-find" class="ui-btn">${_obEsc(i18t('ob_find'))}</button>
      </span>` : ''}
    </div>`;

  if(!obs.length)
    return head + `<div class="obt-empty">${_obEsc(i18t('ob_none_tracked'))}</div>`;

  /* THE ROW. State as a dot in its own tone, the promise, then who has it and
     when it falls due — and the acts at the right wall, which is the shape
     every list in this product uses. */
  const row = r => {
    const { o, i } = r;
    const s = obState(o);
    const due = o.due ? String(o.due) : '';
    const theirs = obligationIsTheirs(o);
    /* NOBODY IS GOING TO BE TOLD, and it is said on the row it is true of.
       Only where a reminder could still matter: a completed obligation is
       nobody's to chase, and saying so there would be noise on the one band
       that needs none. */
    const unowned = (s !== 'done' && !obligationReminderTo(o))
      ? `<span class="obt-unowned" title="${_obEsc(i18t('ob_no_owner_title'))}">${_obEsc(i18t('ob_no_owner'))}</span>` : '';
    return `<div class="obt-row" data-obt-row="${_obEsc(o.id || '')}">
      <span class="obt-dot obt-dot-${s}" aria-hidden="true"></span>
      <div class="obt-body">
        <div class="obt-what">${_obEsc(o.desc || '')}</div>
        <div class="obt-meta">
          <span class="obt-side obt-side-${theirs ? 'them' : 'us'}">${_obEsc(theirs ? i18t('ob_side_theirs') : i18t('ob_side_ours'))}</span>
          <span>${_obEsc(obligationOwner(o, c))}</span>
          ${o.recurring && o.recurring !== 'none'
            ? `<span>${_obEsc((OBLIG_RECUR.find(x => x[0] === o.recurring) || [])[1] || o.recurring)}</span>` : ''}
          ${unowned}
          ${s === 'done' && o.completedBy ? `<span>${_obEsc(i18t('ob_done_by', { who: o.completedBy }))}</span>` : ''}
        </div>
        ${s === 'done' && o.completedNote ? `<div class="obt-quote">${_obEsc(o.completedNote)}</div>` : ''}
        ${o.quote ? `<div class="obt-quote">&ldquo;${_obEsc(o.quote)}&rdquo;</div>` : ''}
      </div>
      ${''/* A COMPLETED ROW SAYS WHEN, and an older one says it does not know.
             Nothing is inferred for the obligations ticked off before this
             field existed: "completed" with no date is the truth they carry. */}
      ${''/* THE AMOUNT, right-aligned in tabular figures beside the date, and
             an em-dash where there is none. NOT DRAWN AT ALL for a reader
             without the money permission — the register's own convention, and
             the reason is that a column of dashes tells somebody a figure is
             being kept from them, which is a different message from "there is
             no figure". */}
      ${money ? `<span class="obt-amt${obligationHasAmount(o) ? '' : ' is-none'}">${
        obligationHasAmount(o) ? _obEsc(obligationMoneyText(obligationAmount(o), c)) : '&mdash;'}</span>` : ''}
      <span class="obt-due">${_obEsc(s === 'done'
        ? (o.completedAt || i18t('ob_done_unknown'))
        : (due || i18t('ob_no_date')))}</span>
      ${editable ? `<span class="obt-verbs">
        <button type="button" data-obt-toggle="${i}">${_obEsc(o.status === 'done' ? i18t('ob_reopen') : i18t('ob_done'))}</button>
        <button type="button" data-obt-edit="${i}">${_obEsc(i18t('ob_edit'))}</button>
        <button type="button" data-obt-del="${i}" class="is-del">${_obEsc(i18t('ob_remove'))}</button>
      </span>` : ''}
    </div>`;
  };

  /* ---- THE CHAINS DRAW FIRST, IN ORDER, AND THE BANDS DRAW WHAT IS LEFT ----
     (L-2) A chained step is grouped by its ORDER rather than by its date,
     which is the whole point of the feature; the four bands underneath hold
     only what is in no chain and are otherwise exactly what they were.
     NOTHING IS DRAWN TWICE, and that is by construction rather than by care:
     obligationChains partitions, so a step is in at most one chain, and the
     band pass filters those ids out. */
  const chains = obligationChains(c);
  const inChain = new Set();
  chains.forEach(ch => ch.forEach(o => inChain.add(String(o.id || ''))));

  const chainHtml = chains.map(ch => {
    const roll = obligationRoll(ch);
    let paid = 0, over = 0, wait = 0;
    ch.forEach(o => { if(obState(o) === 'done') paid++;
      else if(obligationBlocked(o, c)) wait++;
      else if(obState(o) === 'overdue') over++; });
    const head = `<div class="obt-chain-hd">
        <span class="t">${_obEsc(i18t('ob_chain'))}</span>
        <span class="s">${_obEsc(i18t('ob_chain_sub', { n: ch.length, paid, overdue: over, waiting: wait }))}</span>
        ${money && roll.committed ? `<i>${_obEsc(obligationMoneyText(roll.committed, c))}</i>` : ''}
      </div>`;
    return head + ch.map((o, n) => {
      const i = obs.indexOf(o);
      const blocked = obligationBlocked(o, c);
      const done = obState(o) === 'done';
      /* THE STATE IN ONE WORD, AND THE ROW SAYS WHAT IT WAITS ON. Colour is
         never the only carrier here: a blocked step is set back, its
         connector is dashed AND its chip names the step it waits on. */
      const chip = done
        ? `<span class="obt-chip is-done">${_obEsc(i18t('ob_chain_paid', { date: o.completedAt || i18t('ob_done_unknown') }))}</span>`
        : blocked
        ? `<span class="obt-chip is-wait">${_obEsc(i18t('ob_waiting_on', { n: n }))}</span>`
        : obState(o) === 'overdue'
        ? `<span class="obt-chip is-over">${_obEsc(i18t('ob_band_overdue'))}</span>` : '';
      return `<div class="obt-step${done ? ' is-done' : ''}${blocked ? ' is-wait' : ''}${
          obState(o) === 'overdue' && !blocked ? ' is-over' : ''}" data-obt-row="${_obEsc(o.id || '')}">
        <span class="obt-spine"><i class="obt-pip">${done ? '&#10003;' : (n + 1)}</i></span>
        <div class="obt-body">
          <div class="obt-what">${_obEsc(o.desc || '')}</div>
          <div class="obt-meta">
            <span class="obt-side obt-side-${obligationIsTheirs(o) ? 'them' : 'us'}">${
              _obEsc(obligationIsTheirs(o) ? i18t('ob_side_theirs') : i18t('ob_side_ours'))}</span>
            <span>${_obEsc(obligationOwner(o, c))}</span>
            <span>${_obEsc(i18t('ob_step_n', { n: n + 1, of: ch.length }))}</span>
            ${blocked ? `<span class="obt-quiet">${_obEsc(i18t('ob_waiting_note', { n: n }))}</span>` : ''}
          </div>
        </div>
        ${chip}
        ${money ? `<span class="obt-amt${obligationHasAmount(o) ? '' : ' is-none'}">${
          obligationHasAmount(o) ? _obEsc(obligationMoneyText(obligationAmount(o), c)) : '&mdash;'}</span>` : ''}
        <span class="obt-due">${_obEsc(done ? (o.completedAt || i18t('ob_done_unknown'))
          : (obligationDue(o) || i18t('ob_no_date')))}</span>
        ${editable && i >= 0 ? `<span class="obt-verbs">
          <button type="button" data-obt-toggle="${i}">${_obEsc(done ? i18t('ob_reopen') : i18t('ob_done'))}</button>
          <button type="button" data-obt-edit="${i}">${_obEsc(i18t('ob_edit'))}</button>
        </span>` : ''}
      </div>`;
    }).join('');
  }).join('');

  const bands = OBLIG_BANDS.map(([k, key]) => {
    const mine = rows.filter(r => r.band === k && !inChain.has(String(r.o.id || '')));
    /* A BAND WITH NOTHING IN IT DRAWS NOTHING — the change column's own rule.
       Four empty headings over an empty page is furniture. */
    if(!mine.length) return '';
    /* THE SUM RIDES THE HEADING THAT ALREADY CARRIES A COUNT — no new box, no
       new panel, no band. The cheapest channel that carries the fact. Drawn
       only where there is money in that band to sum. */
    const sum = obligationBandTotal(mine);
    return `<div class="obt-band">${_obEsc(i18t(key))}<b>${mine.length}</b>${
      money && sum ? `<i class="obt-bandsum">${_obEsc(obligationMoneyText(sum, c))}</i>` : ''}</div>`
      + mine.map(row).join('');
  }).join('');

  return head + chainHtml + bands;
}

/* Painted when the tab is selected, exactly as roomPaintHistory is: a contract
   nobody opens this tab on pays nothing for it. The handlers are bound HERE,
   where the markup is written, because this repaints on every completion and a
   listener bound elsewhere would be attached to nodes that have gone. */
function roomPaintObligations(c){
  const host = document.getElementById('ws-obligations-pane');
  if(!host || !c) return;
  host.innerHTML = roomObligationsHtml(c);
  const obs = c.obligations || [];
  /* THROUGH THE ONE VERB. toggleObligation is what the calendar, the dashboard
     and the Checks panel all press; a second way to complete an obligation is
     the fault this rulebook opens by warning about. */
  /* COMPLETING ASKS TWO QUESTIONS; REOPENING ASKS NONE. The dialog exists to
     move the date back and to leave a reference — neither of which a reopen
     has anything to say about — and it presses the same verb either way. */
  host.querySelectorAll('[data-obt-toggle]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.getAttribute('data-obt-toggle'));
    const o = (c.obligations || [])[i];
    if(o && o.status !== 'done') openObligationDone(c, i);
    else toggleObligation(c, i, { from: 'obligations tab' });
  }));
  host.querySelectorAll('[data-obt-edit]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.getAttribute('data-obt-edit'));
    openObligationForm(c, { ...obs[i], _i: i });
  }));
  host.querySelectorAll('[data-obt-del]').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.getAttribute('data-obt-del'));
    const o = obs[i];
    obs.splice(i, 1);
    if(o) logAudit(c, 'Obligation', `Removed: ${o.desc}`);
    persist(c);
    if(window.renderObligationsSection) renderObligationsSection(c);
    roomPaintObligations(c);
    obligationSurfacesChanged();
  }));
  host.querySelector('#obt-add')?.addEventListener('click', () => openObligationForm(c));
  host.querySelector('#obt-find')?.addEventListener('click', () => runFindObligations(c));
}


/* ============================================================
   COMPLETION MEANS SOMETHING (owner-asked 29 Aug 2026, J-2.2)
   ============================================================
   An obligation had two states — open and done — and nothing else. So there
   was no answer to "was it done on time", and the Insights obligations page
   said so on its own data object (`canSeeCompletedOn:false`). And a QUARTERLY
   duty ticked off ended for ever: `recurring` was stored, printed on the row
   and read by nothing at all.

   SIX FIELDS AND NO MIGRATION. Every one of them is ABSENT on every record
   written before today, and absent means UNKNOWN — never guessed. The eleven
   obligations already ticked off keep exactly the truth they have: done, on a
   day nobody wrote down. An inference dressed as a record is the fault this
   codebase has a standing rule against.
   ============================================================ */

/* ---- WHEN THE NEXT ONE FALLS DUE ----
   ONE CADENCE STEP FROM THE ONE THAT WAS DUE, never from the day it was ticked
   off. A quarterly report due on the 1st is due on the 1st next quarter
   whether it was filed early or three weeks late, and dating the next instance
   from the completion would let a series drift a month a year.

   AND IF THAT DATE IS ALREADY PAST, IT IS ALREADY PAST. The next instance
   arrives overdue, which is true — somebody is behind — and it is what the
   reader needs to see. Skipping forward to the next date in the future would
   quietly erase a missed quarter.

   THE MONTH IS CLAMPED. Adding a month to 31 January in plain JavaScript gives
   3 March; the end of February is what a person means. */
function obligationNextDue(o){
  const due = obligationDue(o);
  const every = String((o && o.recurring) || 'none');
  if(!due || every === 'none' || !OBLIG_RECUR.some(r => r[0] === every)) return null;
  const d = new Date(due + 'T00:00:00');
  if(isNaN(d)) return null;
  const months = every === 'monthly' ? 1 : every === 'quarterly' ? 3 : every === 'annual' ? 12 : 0;
  if(!months) return null;
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  const last = new Date(y, m + months + 1, 0).getDate();
  return isoDay(new Date(y, m + months, Math.min(day, last)));
}
/* An instance belongs to the duty it was minted from; the first one IS the
   duty, so it stands for itself. */
const obligationSeriesId = o => String((o && (o.seriesId || o.id)) || '');

/* ---- THE NEXT INSTANCE, BUILT BUT NOT FILED ----
   Returned rather than pushed, so the dialog can NAME IT BEFORE THE PRESS and
   the verb can file the same object it showed. Two functions building it would
   be two answers to what the next one looks like.

   ITS OWN ID IS LOAD-BEARING. The reminder sweep's dedupe key is
   `${contract}:ob:${o.id || due}:...`, so an instance minted without a fresh id
   inherits the previous one's dedupe rows and ITS REMINDERS NEVER FIRE —
   silently, which is the worst shape this could take. */
function obligationNextInstance(o){
  const due = obligationNextDue(o);
  if(!due) return null;
  return {
    id: 'ob_' + Math.abs(Date.now() + Math.floor(Math.random() * 1e6)).toString(36),
    seriesId: obligationSeriesId(o),
    desc: o.desc || '', due,
    recurring: o.recurring, party: obligationParty(o),
    assignee: obligationIsTheirs(o) ? '' : (o.assignee || ''),
    quote: o.quote || '', status: 'open',
  };
}

/* ---- THE ONE PLACE A COMPLETION IS WRITTEN ----
   Called by toggleObligation and by nothing else, so every surface — the tab,
   the Checks panel, the Calendar, the dashboard, the phone — records the same
   three facts in the same way.

   THE DATE IS A DAY, THROUGH THE NORMALISER, and it may be moved BACK but not
   forward: things are ticked off late, and a completion dated after today is a
   claim about work nobody has done yet. A wrong date makes the on-time figure
   a lie, which is the whole reason the field exists.

   REOPENING CLEARS IT. A record still carrying a completion date under a
   status of 'open' would be a contradiction the on-time figure would count. */
function obligationMarkDone(o, opts = {}){
  const today = isoDay(new Date());
  const asked = opts.at ? (window.dateOnly ? dateOnly(opts.at) : opts.at) : null;
  o.completedAt = (asked && asked <= today) ? asked : today;
  let by = '';
  try{ by = String(((typeof currentUser === 'function') && currentUser() || {}).name || ''); }catch(_){ by = ''; }
  o.completedBy = by;
  const note = String(opts.note || '').trim();
  if(note) o.completedNote = note.slice(0, OB_NOTE_MAX);
  else delete o.completedNote;
  return o;
}
const OB_NOTE_MAX = 200;
function obligationClearDone(o){
  delete o.completedAt; delete o.completedBy; delete o.completedNote;
  return o;
}
/* Was it done by the day it was due? NULL is the honest answer wherever
   either date is missing — which is every obligation completed before this
   phase, and every one that never carried a due date. The on-time figure
   counts only the ones that can answer. */
function obligationOnTime(o){
  const done = (o && o.completedAt) ? (window.dateOnly ? dateOnly(o.completedAt) : o.completedAt) : null;
  const due = obligationDue(o);
  if(!done || !due) return null;
  return done <= due;
}

/* ---- WHEN THIS CONTRACT WAS LAST READ FOR OBLIGATIONS ----
   "No obligations tracked" and "nobody has looked" were the same screen, and
   the Insights page reported that as one of its two blind spots by name. This
   is the fact that tells them apart, and it is stamped by the SCAN and by
   nothing else — a stamp written anywhere else would claim a reading that
   never happened.

   THE HASH IS OF THE WORDING THAT WAS READ, so a contract read and then
   renegotiated reads as read against text it no longer has. simhash64 is the
   product's own fingerprint and needs no new machinery; where it is absent
   (a stage without js/dedupe.js) the stamp keeps its DATE and carries no
   hash, which is a smaller fact rather than a wrong one. */
function obligationsReadStamp(c, text){
  if(!c) return null;
  c.obligationsReadAt = isoDay(new Date());
  let h = null;
  try{ h = (typeof window.simhash64 === 'function') ? simhash64(String(text || '')) : null; }catch(_){ h = null; }
  if(h) c.obligationsReadHash = String(h); else delete c.obligationsReadHash;
  return c.obligationsReadAt;
}

/* ---- THE DIALOG ----
   Two questions and one press. The date defaults to today and may be moved
   BACK; the note is optional and is one line of evidence — a filing number, a
   reference — rather than a second description.

   WHERE THE DUTY REPEATS IT NAMES THE NEXT ONE BEFORE THE PRESS, because
   opening a new instance is a thing that happens TO the reader's book and a
   product that does it silently is one that surprises them. */
function openObligationDone(c, i){
  const o = (c && c.obligations || [])[i];
  if(!o) return;
  if(typeof canEdit === 'function' && !canEdit()){ toast(i18t('ob_viewers_no_change'), 'err'); return; }
  const today = isoDay(new Date());
  const next = obligationNextInstance(o);
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-1">${i18t('ob_done_title')}</h3>
      <p class="text-[12px] text-ink/60 mb-4">${_obEsc(o.desc || '')}</p>
      <label class="block mb-3"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_done_when')}</span>
        <input id="od-at" type="date" value="${today}" max="${today}"
          class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
        <span class="mt-1 block text-[11px] text-ink/55">${i18t('ob_done_when_why')}</span></label>
      <label class="block mb-4"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_done_note')}</span>
        <input id="od-note" maxlength="${OB_NOTE_MAX}" placeholder="${_obEsc(i18t('ob_done_note_ph'))}"
          class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
      ${next ? `<p id="od-next" class="mb-4 rounded-lg border border-line bg-slate-50 px-3 py-2 text-[12px] text-ink/70">${
        _obEsc(i18t('ob_done_next', { date: next.due }))}</p>` : ''}
      <div class="flex justify-end gap-2">
        <button id="od-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        <button id="od-go" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('ob_done_go')}</button>
      </div>
    </div>`);
  document.getElementById('od-cancel')?.addEventListener('click', closeModal);
  document.getElementById('od-go')?.addEventListener('click', () => {
    const at = (document.getElementById('od-at') || {}).value || '';
    const note = (document.getElementById('od-note') || {}).value || '';
    closeModal();
    /* THROUGH THE ONE VERB. This dialog collects two answers and presses the
       same function the Calendar presses; it decides nothing of its own. */
    toggleObligation(c, i, { at, note, from: 'obligations tab' });
  });
}


/* ============================================================
   THE WORKLIST — every promise in the book (owner-asked 29 Aug 2026, J-2.3)
   ============================================================
   The Obligations tab answers "what does THIS contract commit us to". The
   question underneath it — *what is waiting on me this week, across everything*
   — had no screen at all: the Calendar answers "what falls in October", which
   is a different question and a worse one to work from.

   IT IS A TABLE OF OBLIGATIONS, NOT OF CONTRACTS, and that is the whole
   difference from the register. A contract with six late promises is one row
   there and six rows here, which is the shape of the morning.

   AND IT COUNTS NOTHING OF ITS OWN. `allObligations` is the one reading of the
   book, `obState` decides overdue, `obligationBand` decides which pile a row
   sits in — the SAME four the contract's own tab uses, so the two cannot
   disagree about what "due this month" means — and `toggleObligation` is the
   one verb. This file adds a page and no arithmetic.
   ============================================================ */
const OBW_KEY = 'hati.v1.obFilters';
/* Per sitting, in memory. A stored filter lands a reader on a narrowed page a
   week later with nothing on screen saying why — the register's own lesson,
   and this page has no saved-view machinery to say it with. */
let _obwF = null;
/* ---- ONE STATEMENT OF WHAT THIS PAGE SHOWS BY DEFAULT (M-6) ----
   Named rather than written into obwFilters, because "is anything narrowing
   this list?" has to be asked of the SAME answer the page opens on — and it is
   not simply "everything is set to All": the State filter opens on `open`,
   which is a cut, and a reading that compared against 'all' would report the
   page as filtered the moment it was drawn. */
const OBW_DEF = { whose:'all', state:'open', side:'all', folder:'all', due:'all' };
function obwFilters(){
  if(!_obwF) _obwF = { ...OBW_DEF };
  return _obwF;
}
/* WHICH FILTERS ARE NARROWING THE LIST, as a list of their own names. Asked by
   the Clear button (which counts them and stands down at zero) and by each
   control (which wears the accent when it is the one doing the narrowing) — one
   reading, so the button and the controls cannot say different things. */
function obwNarrowing(f){
  f = f || obwFilters();
  return Object.keys(OBW_DEF).filter(k => String(f[k]) !== String(OBW_DEF[k]));
}
const OBW_STATE = [['open','ob_f_state_open'],['overdue','ob_f_state_over'],['waiting','ob_f_state_waiting'],
  ['done','ob_f_state_done'],['all','ob_f_state_all']];
const OBW_WHOSE = [['all','ob_f_whose_all'],['mine','ob_f_whose_mine'],['none','ob_f_whose_none']];
const OBW_SIDE  = [['all','ob_f_side_all'],['ours','ob_side_ours'],['theirs','ob_side_theirs']];
const OBW_DUE   = [['all','ob_f_due_all'],['7','ob_f_due_7'],['30','ob_f_due_30'],['90','ob_f_due_90']];

/* THE ONE POPULATION, AND EVERY FILTER NARROWS IT. Read off allObligations —
   which carries the contract's id, name and counterparty on each row, so a
   list spanning contracts can name who owes a "theirs" without looking the
   contract up again and cannot name the wrong one. */
function obwRows(f){
  f = f || obwFilters();
  const live = new Set((state.contracts || [])
    .filter(c => c && c.status !== 'Declined' && !c.archived).map(c => c.id));
  const scoped = new Set((state.contracts || [])
    .filter(c => !window.canAccessFolder || canAccessFolder(c.folder)).map(c => c.id));
  return allObligations()
    .filter(o => live.has(o.cid) && scoped.has(o.cid))
    /* THE CONTRACT RIDES ALONG (J-5.2). An amount is stated in the CONTRACT'S
       own currency and converted through the CONTRACT'S own record, so this
       page needs the record rather than the id — and looking it up per row per
       repaint is the same lookup done four times. Underscored because it is
       transport: nothing writes it back, and it is stripped by the spread
       every consumer already does. */
    .map(o => ({ ...o, st: obState(o), band: obligationBand(o, (state.contracts || []).find(x => x.id === o.cid)),
      _c: (state.contracts || []).find(x => x.id === o.cid) || null,
      days: obligationDue(o) ? daysUntil(obligationDue(o)) : null }))
    .filter(o => {
      if(f.state === 'open' && o.st === 'done') return false;
      if(f.state === 'overdue' && o.st !== 'overdue') return false;
      if(f.state === 'done' && o.st !== 'done') return false;
      /* ---- ONE MORE OPTION IN A CONTROL THAT IS ALREADY THERE (L-3) ----
         "What is held up across the whole book?" had no answer and needed no
         new page to get one. Read off the BAND rather than re-deriving it, so
         the cut and the heading it lands under cannot disagree. */
      if(f.state === 'waiting' && o.band !== 'waiting') return false;
      if(f.side === 'ours' && obligationIsTheirs(o)) return false;
      if(f.side === 'theirs' && !obligationIsTheirs(o)) return false;
      if(f.whose === 'mine' && !obligationIsMine(o)) return false;
      if(f.whose === 'none' && !!obligationReminderTo(o)) return false;
      if(f.folder !== 'all'){
        const c = (state.contracts || []).find(x => x.id === o.cid);
        if(!c || c.folder !== f.folder) return false;
      }
      if(f.due !== 'all'){
        /* A DATELESS OBLIGATION IS NOT IN A DUE WINDOW. Nothing is ever sent
           about one and no window can contain it; dropping it here is what
           makes "due in 7 days" mean the same thing on this page as it does
           in the bell. */
        if(o.days == null || o.days > Number(f.due)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const r = OBLIG_BANDS.findIndex(x => x[0] === a.band) - OBLIG_BANDS.findIndex(x => x[0] === b.band);
      if(r) return r;
      if(a.days == null) return 1; if(b.days == null) return -1;
      return a.days - b.days;
    });
}
/* What the sidebar's own count says: how much is LATE across the book. Amber,
   like every other count that means work owed, and hidden at zero. */
function obligationsDoorCount(){
  /* THROUGH openObligations, which is the ONE reading of what is still
     outstanding across the book — it drops Declined and archived contracts
     itself. Counting off allObligations instead would put a dead deal's
     promises on the sidebar, which is the reading this page and the alerts
     panel both already refuse. */
  /* AND A HELD-BACK STEP IS NOT LATE WORK (L-1). The door's own rule is that
     its number matches the list behind it, and the worklist now bands a
     blocked step apart from the overdue ones. A number counting work nobody
     may do is the fault this feature exists to remove. */
  try{
    const byId = new Map((state.contracts || []).map(c => [c.id, c]));
    return openObligations().filter(o => o.days != null && o.days < 0
      && !obligationBlocked(o, byId.get(o.cid))).length;
  }
  catch(_){ return 0; }
}

/* ---- A DOOR NARROWS TO WHAT ITS OWN NUMBER COUNTED ----
   Home's card counts the dated obligations due inside thirty days and the
   sidebar counts what is LATE, and both landed on this page at its default
   narrowing — every open obligation, dated or not, at any horizon. So a card
   reading 2 opened a list of 4, and a door reading 1 opened the same 4. The
   standing rule is that the number on a door matches the list behind it.

   IT IS ALSO WHAT RESETS THE PAGE. `_obwF` is per sitting and was never
   cleared on arrival, so a named door could land a reader on whatever
   narrowing they had left behind an hour earlier with nothing saying why.
   Every door goes through here and states the whole set, so there is nothing
   stale to inherit. */
function obwGoFiltered(patch){
  _obwF = { whose:'all', state:'open', side:'all', folder:'all', due:'all', ...(patch || {}) };
  if(typeof setView === 'function') setView('obligations');
  else renderObligationsList();
}
/* ---- A CONTROL THAT IS NARROWING THE LIST SAYS SO (M-6) ----
   (owner-reported 31 Aug 2026: *"it is never clear if there is a filter on so
   you can click clear."*)

   The register settled this question on 25 Aug — an active filter takes
   `--accent-ink`, and the accent is kept for the active one alone — so this
   page takes that answer rather than inventing a second vocabulary. `is-on` is
   set against OBW_DEF, never against 'all', because State opens on a cut.

   ONE more thing on the same row answers it too: the Clear button counts them,
   so the reader learns BOTH which control is narrowing and how many are. */
function obwSelect(id, opts, cur){
  const on = String(cur) !== String(OBW_DEF[id]);
  return `<label class="obw-f${on ? ' is-on' : ''}"><span>${_obEsc(i18t('ob_f_' + id))}</span>
    <select data-obw-f="${id}">${opts.map(([k, key]) =>
      `<option value="${k}"${k === cur ? ' selected' : ''}>${_obEsc(i18t(key))}</option>`).join('')}</select></label>`;
}

/* ---- A FILTER MAY NOT THROW THE READER TO THE TOP ----
   The standing rule: a press that NAVIGATES may land at the top; a press that
   FILTERS, PAGES, SORTS or TOGGLES may not move the reader's place. This page
   replaces `#content` wholesale and is not on VIEW_OWNS_HEIGHT, so the shell's
   own scroller is what scrolls it — the markup goes, the height collapses to
   zero, the browser clamps scrollTop, and the reader is at the top of a list
   they were halfway down. `keepScroll` exists for exactly this and is
   published; the funnel is here so every press that merely re-reads the same
   page arrives at it, which is what the rule needs to hold. */
function obwRepaint(){
  if(typeof keepScroll === 'function') keepScroll(() => renderObligationsList());
  else renderObligationsList();
}
function renderObligationsList(){
  const host = document.getElementById('content');
  if(!host) return;
  const f = obwFilters();
  const rows = obwRows(f);
  const folders = (window.visibleFolders ? visibleFolders() : (window.FOLDERS || []));
  const narrowing = obwNarrowing(f);
  /* THE THREE COUNTS THE HEAD PRINTS, AND THEY DO NOT OVERLAP (L-3).
     `late` is what is overdue AND actionable — a held-back step whose date has
     passed is counted as waiting, never as late, which is the same reading the
     bands below use and the same one the sidebar's door now counts. */
  const late = rows.filter(r => r.st === 'overdue' && r.band !== 'waiting').length;
  const held = rows.filter(r => r.band === 'waiting').length;
  const open = rows.filter(r => r.st !== 'done' && r.band !== 'waiting').length;

  const row = o => {
    const theirs = obligationIsTheirs(o);
    const step = obligationStepNo(o, o._c);
    const unowned = (o.st !== 'done' && !obligationReminderTo(o))
      ? `<span class="obt-unowned" title="${_obEsc(i18t('ob_no_owner_title'))}">${_obEsc(i18t('ob_no_owner'))}</span>` : '';
    /* CHASING IS ONE ACT ON A THEIRS OBLIGATION and is drawn nowhere else: on
       ours there is nobody to chase, and on a finished one there is nothing to
       chase about. A verb that cannot work is not drawn. */
    const chase = (theirs && o.st !== 'done' && (typeof canEdit !== 'function' || canEdit()))
      ? `<button type="button" data-obw-chase="${_obEsc(o.id)}" data-obw-cid="${_obEsc(o.cid)}">${_obEsc(i18t('ob_chase'))}</button>` : '';
    return `<tr data-obw-row="${_obEsc(o.id)}" data-obw-cid="${_obEsc(o.cid)}">
      ${''/* ---- A CHAINED ROW NAMES ITS PLACE (L-3) ----
             There is no room to draw the chain itself here, so the row says
             where in one it sits — and a held-back row says what it waits on,
             which is why it is in the band it is in. Both read through the ONE
             chain reading; this page derives nothing of its own. */}
      ${''/* ---- THE OBLIGATION IS CLAMPED, AND IT IS THE DOOR (M-6) ----
             (owner-reported 31 Aug 2026: *"the overdue column needs to be the
             same size in every line therefore shorten the obligation. User can
             click the obligation and it takes them to the contract in
             question's obligation page for the full writing."*)

             A clause read out of a charter can run to forty words, and this
             column let it wrap to six lines — so the row was six lines tall,
             every row a different height, and the date beside it sat at the top
             of whatever height its own row happened to be. Clamped to TWO, so
             every row is one height and the date column holds one vertical.

             NOTHING IS HIDDEN SILENTLY: the whole wording is on the row's own
             title, and one press away in full on the contract's own tab — which
             is where the press has always gone and which nothing on the row
             said. The description carries the underline on hover now, so the
             door the row has always been is visible.

             THE DOT MOVED OUT OF THE TEXT FLOW into a flex row beside it: as an
             inline-block inside a clamped box it would have counted as one of
             the two lines. */}
      <td class="obw-c"><span class="obw-cw">
        <span class="obw-dot obt-dot obt-dot-${o.band === 'waiting' ? 'wait' : o.st}"></span>
        <span class="obw-txt">
          <span class="obw-what${o.band === 'waiting' ? ' is-wait' : ''}"
            title="${_obEsc(o.desc || '')}">${_obEsc(o.desc || '')}</span>
          <span class="obw-meta">${_obEsc(o.cname || o.cid)} &middot; ${_obEsc(o.cid)}${
            step ? ' &middot; ' + _obEsc(i18t('ob_step_n', { n: step.n, of: step.of })) : ''}${
            o.band === 'waiting' && step ? ' &middot; ' + _obEsc(i18t('ob_waiting_on', { n: step.n - 1 })) : ''}</span>
        </span></span></td>
      <td class="obw-side"><span class="obt-side obt-side-${theirs ? 'them' : 'us'}">${
        _obEsc(theirs ? i18t('ob_side_theirs') : i18t('ob_side_ours'))}</span></td>
      <td class="obw-who">${_obEsc(theirs ? (o.counterparty || i18t('ob_side_theirs')) : (o.assignee || ''))}${unowned}</td>
      ${''/* THE AMOUNT (J-5.2). Its width comes off the DESCRIPTION column,
             so the table still sums to 100% and nothing else on the row moves.
             A CROSS-CONTRACT list converts, because two rows here can be in two
             currencies — see the foot, which says what it left out. Per ROW the
             figure is stated in its own contract's money, which is what the
             contract's own page says. */}
      ${money ? `<td class="obw-amt${obligationHasAmount(o) ? '' : ' is-none'}">${
        obligationHasAmount(o) ? _obEsc(obligationMoneyText(obligationAmount(o), o._c || o)) : '&mdash;'}</td>` : ''}
      <td class="obw-when">${_obEsc(o.st === 'done'
        ? (o.completedAt || i18t('ob_done_unknown'))
        : (o.due || i18t('ob_no_date')))}${
        o.chasedAt ? `<span class="obw-chased" title="${_obEsc(i18t('ob_chased_on', { date: o.chasedAt, who: o.chasedBy || '' }))}">${_obEsc(i18t('ob_chased'))}</span>` : ''}</td>
      <td class="obw-acts">${chase}<button type="button" data-obw-open="${_obEsc(o.cid)}">${_obEsc(i18t('ob_open_contract'))}</button></td>
    </tr>`;
  };

  const money = obligationMoneyVisible();
  /* ---- A CROSS-CONTRACT TOTAL CONVERTS, AND SAYS WHAT IT LEFT OUT ----
     Two rows on this page can be in two currencies, so a bare sum would add
     shillings to euros. Converted through fxHomeValue like every other total
     in the product, and where a rate is missing the row is LEFT OUT and the
     figure says so — the standing rule that a silent trim on a money headline
     is the fault the insights panels were rebuilt to stop. */
  const homeSum = list => {
    let sum = 0, missing = {};
    for(const o of list){
      const n = obligationAmount(o);
      if(n === null) continue;
      if(typeof window.fxHome === 'function' && o._c){
        const h = fxHome({ ...o._c, value: n });
        if(h && h.missing){ missing[h.code || '?'] = (missing[h.code || '?'] || 0) + 1; continue; }
        sum += (h && typeof h.v === 'number') ? h.v : n;
      } else sum += n;
    }
    return { sum, missing };
  };
  const banded = OBLIG_BANDS.map(([k, key]) => {
    const mine = rows.filter(r => r.band === k);
    if(!mine.length) return '';
    const h = money ? homeSum(mine) : null;
    return `<tr class="obw-band"><td colspan="${money ? 6 : 5}">${_obEsc(i18t(key))}<b>${mine.length}</b>${
      h && h.sum ? `<i class="obw-bandsum">${_obEsc(window.fmtMoneyShort ? fmtMoneyShort(h.sum) : String(h.sum))}</i>` : ''}</td></tr>`
      + mine.map(row).join('');
  }).join('');
  /* ONE TOTAL AT THE FOOT, over every row on the page. Drawn only where there
     is money to state; a foot reading nothing is furniture. */
  const foot = (() => {
    if(!money) return '';
    const h = homeSum(rows);
    const left = Object.entries(h.missing);
    if(!h.sum && !left.length) return '';
    /* ---- COMMITTED AGAINST PAID, AND IT IS THIS LINE GROWN (L-3) ----
       This foot already said "Total on this page" over converted money and
       already stated what it left out for want of a rate. So the whole
       committed-against-paid reading needed NO new screen, no panel and no
       band — only three more figures on a line that was already here, which
       is the cheapest channel that carries the fact.
       SPLIT THROUGH THE SAME homeSum, so the four cannot disagree with each
       other or with the band sums above them: paid + outstanding IS the total,
       by construction, because they are the same rows partitioned once.
       "ON THIS PAGE" IS KEPT AND IS LOAD-BEARING — these are the rows the
       filters left, not the whole book, and the wording has always said so. */
    const money4 = window.fmtMoneyShort ? fmtMoneyShort : String;
    const paid = homeSum(rows.filter(r => r.st === 'done')).sum;
    const over = homeSum(rows.filter(r => r.band === 'overdue')).sum;
    const out  = homeSum(rows.filter(r => r.st !== 'done')).sum;
    return `<div class="obw-total">
      <span>${_obEsc(i18t('ob_total'))}</span>
      <span class="obw-m"><i>${_obEsc(i18t('ob_roll_committed'))}</i><b>${_obEsc(money4(h.sum))}</b></span>
      <span class="obw-m"><i>${_obEsc(i18t('ob_roll_paid'))}</i><b class="is-ok">${_obEsc(money4(paid))}</b></span>
      <span class="obw-m"><i>${_obEsc(i18t('ob_roll_outstanding'))}</i><b>${_obEsc(money4(out))}</b></span>
      ${over ? `<span class="obw-m"><i>${_obEsc(i18t('ob_roll_overdue'))}</i><b class="is-bad">${_obEsc(money4(over))}</b></span>` : ''}
      ${left.length ? `<i class="obw-left">${_obEsc(i18tn('ob_total_left_out', left.reduce((a, [, n]) => a + n, 0),
        { n: left.reduce((a, [, n]) => a + n, 0), codes: left.map(([code]) => code).join(', ') }))}</i>` : ''}</div>`;
  })();

  host.innerHTML = `<div class="obw-page">
    <div class="obw-card">
      <div class="obw-head">
        ${''/* THE HEADLINE NAMES WHAT IT IS COUNTING. `ob_head_open` reads
             "N outstanding" and was computed off the filtered rows whatever
             the state filter said, so a list narrowed to Completed was headed
             "2 outstanding" over two finished obligations — the page stating
             something untrue about the rows directly beneath it. The count is
             the same count; only the word follows the cut. */}
        ${''/* THE WORD FOLLOWS THE CUT — and the waiting cut needed its own,
               or a page narrowed to held-back steps would be headed "N
               outstanding" over rows that are precisely NOT outstanding: the
               page stating something untrue about what is beneath it, which
               is the fault this head has already been corrected for once. */}
        <span class="obt-cap">${_obEsc(f.state === 'done'
          ? i18tn('ob_head_done', rows.length, { n: rows.length })
          : f.state === 'overdue'
          ? i18tn('ob_head_overdue', rows.length, { n: rows.length })
          : f.state === 'waiting'
          ? i18tn('ob_head_waiting', rows.length, { n: rows.length })
          : i18tn('ob_head_open', open, { n: open }))}</span>
        ${late && f.state !== 'overdue' ? `<span class="obt-over">${_obEsc(i18tn('ob_head_overdue', late, { n: late }))}</span>` : ''}
        ${held && f.state !== 'waiting' ? `<span class="obt-wait">${_obEsc(i18tn('ob_head_waiting', held, { n: held }))}</span>` : ''}
      </div>
      <div class="obw-filters">
        ${obwSelect('whose', OBW_WHOSE, f.whose)}
        ${obwSelect('state', OBW_STATE, f.state)}
        ${obwSelect('side', OBW_SIDE, f.side)}
        <label class="obw-f${f.folder !== OBW_DEF.folder ? ' is-on' : ''}"><span>${_obEsc(i18t('ob_f_folder'))}</span>
          <select data-obw-f="folder"><option value="all"${f.folder === 'all' ? ' selected' : ''}>${_obEsc(i18t('ob_f_folder_all'))}</option>${
            folders.map(x => `<option value="${_obEsc(x.id)}"${f.folder === x.id ? ' selected' : ''}>${_obEsc(x.name)}</option>`).join('')}</select></label>
        ${obwSelect('due', OBW_DUE, f.due)}
        ${''/* ---- CLEAR STATES ITSELF (M-6) ----
               It was a live button whatever the page was showing, so a reader
               could not tell a narrowed list from a whole one by looking at it
               — and pressing it on a whole one did nothing, which reads as a
               broken control. Dead and quiet with nothing narrowing, counting
               and accented when something is; the reason on the hover either
               way, which is this product's rule for what it can know before the
               press. */}
        <button type="button" id="obw-clear" class="ui-btn${narrowing.length ? ' is-on' : ''}"${
          narrowing.length ? '' : ' disabled'} title="${_obEsc(narrowing.length
            ? i18tn('ob_clear_on', narrowing.length, { n: narrowing.length })
            : i18t('ob_clear_none'))}">${_obEsc(i18t('reg_clear'))}${
          narrowing.length ? ` <b>${narrowing.length}</b>` : ''}</button>
      </div>
      ${''/* ---- THE TABLE NAMES ITS COLUMNS (M-6) ----
             (owner-reported 31 Aug 2026: *"the table has no column headers."*)

             It never had any: the bands were the only thing above a row, so a
             reader met six columns of facts with nothing saying what any of
             them was — the amount and the date in particular, which are two
             right-aligned numbers side by side.

             ON THE WIDTHS THE TABLE ALREADY DECLARES, and drawn from the same
             `money` reading as the cells, so the head and the body cannot come
             to disagree about how many columns there are. The last column is
             deliberately unnamed: it holds verbs, and a heading over a verb
             column names nothing a reader needs. */}
      ${rows.length ? `<table class="obw-table"><thead><tr>
          <th class="obw-c">${_obEsc(i18t('ob_col_what'))}</th>
          <th class="obw-side">${_obEsc(i18t('ob_col_side'))}</th>
          <th class="obw-who">${_obEsc(i18t('ob_col_who'))}</th>
          ${money ? `<th class="obw-amt">${_obEsc(i18t('ob_amount'))}</th>` : ''}
          <th class="obw-when">${_obEsc(i18t('ob_col_when'))}</th>
          <th class="obw-acts"><span class="sr-only">${_obEsc(i18t('ob_col_acts'))}</span></th>
        </tr></thead><tbody>${banded}</tbody></table>${foot}`
        : `<div class="obt-empty">${_obEsc(i18t('ob_none_match'))}</div>`}
    </div></div>`;

  host.querySelectorAll('[data-obw-f]').forEach(sel => sel.addEventListener('change', () => {
    f[sel.getAttribute('data-obw-f')] = sel.value;
    obwRepaint();
  }));
  host.querySelector('#obw-clear')?.addEventListener('click', () => { _obwF = null; obwRepaint(); });
  /* WHERE THE READER ENDS UP: the contract, on the tab this row is about. A row
     that opened the Document tab would make them hunt for what they pressed. */
  const go = cid => { if(window.openWorkspace){ openWorkspace(cid);
    const c = window.getContract ? getContract(cid) : null;
    if(c && window.roomGoTab) try{ roomGoTab(c, 'oblig'); }catch(_){} } };
  host.querySelectorAll('[data-obw-open]').forEach(b => b.addEventListener('click', ev => {
    ev.stopPropagation(); go(b.getAttribute('data-obw-open')); }));
  host.querySelectorAll('[data-obw-row]').forEach(tr => tr.addEventListener('click', () =>
    go(tr.getAttribute('data-obw-cid'))));
  host.querySelectorAll('[data-obw-chase]').forEach(b => b.addEventListener('click', ev => {
    ev.stopPropagation();
    obligationChase(b.getAttribute('data-obw-cid'), b.getAttribute('data-obw-chase'));
  }));
  if(window.setActiveNav) setActiveNav('obligations');
}

/* ---- CHASING THEM (J-2.3) ----
   THE RECORD IS WRITTEN FIRST AND WHATEVER THE MAIL DOES. That the other side
   was chased, and when, is the half that pays off at renewal; a fact that
   depends on a provider being up is not a record. The message is the knock on
   the door and the route is the only thing that knows whether it landed.

   IT ASKS BEFORE IT SENDS, because this is the one act on this page that
   leaves the building — the standing rule for anything that reaches the
   counterparty. */
async function obligationChase(cid, obId){
  const hit = findObligation(cid, obId);
  if(!hit){ toast(i18t('ob_gone'), 'err'); return null; }
  const { c, o } = hit;
  if(typeof canEdit === 'function' && !canEdit()){ toast(i18t('ob_viewers_no_change'), 'err'); return null; }
  if(!obligationIsTheirs(o)){ toast(i18t('ob_chase_ours'), 'err'); return null; }
  const ok = await confirmDialog({
    title: i18t('ob_chase_title'),
    message: i18t('ob_chase_body', { who: c.counterparty || i18t('ob_side_theirs'), desc: o.desc || '' }),
    confirmLabel: i18t('ob_chase_go') });
  if(!ok) return null;
  o.chasedAt = isoDay(new Date());
  let by = '';
  try{ by = String(((typeof currentUser === 'function') && currentUser() || {}).name || ''); }catch(_){ by = ''; }
  o.chasedBy = by;
  logAudit(c, 'Obligation', `Chased: ${o.desc} — ${c.counterparty || 'the counterparty'}`);
  persist(c);
  obligationSurfacesChanged();
  if(state.view === 'obligations') obwRepaint();
  /* AND THEN THE MESSAGE, WHICH MAY OR MAY NOT GO. Three honest answers, the
     shape every other mail in this product reports: it went, it is in the
     outbox, or it was refused and here is why. */
  if(!window.API_MODE || !API_MODE()){ toast(i18t('ob_chased_local'), 'warn'); return o; }
  try{
    const r = await api(`contracts/${encodeURIComponent(cid)}/chase`, 'POST', { obligationId: obId });
    if(r && r.emailSent) toast(i18t('ob_chase_sent', { to: r.to || '' }), 'ok');
    else if(r && r.outbox) toast(i18t('ob_chase_outbox'), 'warn');
    else toast(String((r && r.emailError) || i18t('ob_chase_failed')), 'warn');
  }catch(e){ toast(String((e && e.message) || i18t('ob_chase_failed')), 'warn'); }
  return o;
}

/* THE CHAIN'S READINGS ARE PUBLISHED. A name this module defines and another
   reaches through `window` is unreachable unless it is on this list — the
   rlPaperFootHtml fault, which this codebase has paid for six times and which
   fails in SILENCE with a plausible fallback. f232 sweeps for it. */
Object.assign(window,{obligationAfter,obligationPrev,obligationBlocked,obligationChain,obligationChains,obligationStepNo,obligationRoll,
  obligationAlreadyOn,obFindBusy,OB_FIND_DOORS,obligationAmount,obligationHasAmount,obligationBandTotal,obligationMoneyVisible,obligationMoneyText,
  OBLIG_RECUR,OBLIG_BANDS,OB_NOTE_MAX,OBW_WHOSE,OBW_STATE,OBW_SIDE,OBW_DUE,obwFilters,obwRows,obwGoFiltered,obligationsDoorCount,renderObligationsList,obwRepaint,obligationSeriesOpenAt,obligationChase,obligationNextDue,obligationSeriesId,obligationNextInstance,obligationMarkDone,obligationClearDone,obligationOnTime,obligationsReadStamp,openObligationDone,obligationReminderTo,obligationIsMine,obligationBand,obligationTabState,roomObligationsHtml,roomPaintObligations,OBLIG_PARTY,obligationParty,obligationIsTheirs,obligationOwner,obligationsOurs,obligationsTheirs,findObligation,toggleObligation,toggleObligationById,openObligations,dateOnly,isoDay,renewalDecisionDate,RENEWAL_WINDOW_DAYS,renewalWindow,renewalInForce,obligationDue,obligationSurfacesChanged,obState,contractObligations,allObligations,overdueObligationCount,renewalDecisionsDue,heuristicObligations,extractObligations,renderObligationsSection,openObligationForm,runFindObligations,openObligationsReview});
