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
  seed=seed||{desc:'',due:'',recurring:'none',assignee:'',quote:''};
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
    if(!o.desc){ toast('Enter a description','err'); return; }
    c.obligations=c.obligations||[];
    const editing=seed._i!=null;
    if(editing) c.obligations[seed._i]=o; else c.obligations.push(o);
    logAudit(c,'Obligation',`${editing?'Updated':'Added'}: ${o.desc}${o.due?` (due ${o.due})`:''}`
      +` — ${party==='theirs'?`${c.counterparty||'the counterparty'}'s to deliver`:`ours${o.assignee?`, assigned to ${o.assignee}`:''}`}`);
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
  });
}
async function runFindObligations(c){
  const btn=document.getElementById('ob-find'); if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ob_scanning')}</span>`; }
  const found=await extractObligations(c);
  if(btn){ btn.disabled=false; }
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
function openObligationsReview(c, found){
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">${i18t('ob_proposed')}</h3></div>
      <p class="text-xs text-ink/60 mb-3">${i18t('ob_tick_to_add')} <b>ours</b> — open any one afterwards to mark it as the counterparty&rsquo;s, or to set a date and an owner. Nothing is saved until you confirm.</p>
      <div class="space-y-2 max-h-[45vh] overflow-y-auto scroll-thin mb-4">
        ${found.map((o,i)=>`<label class="flex gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 cursor-pointer">
          <input type="checkbox" data-ob-pick="${i}" checked class="mt-0.5 h-4 w-4 rounded border-brand-200 accent-brand-700"/>
          <span class="min-w-0"><span class="block text-[12.5px] font-normal text-ink">${(o.desc||'').replace(/</g,'&lt;')}</span>
          ${o.quote?`<span class="block text-[10px] text-ink/50 italic mt-0.5">“${o.quote.replace(/</g,'&lt;')}”</span>`:''}</span></label>`).join('')}
      </div>
      <div class="flex justify-end gap-2">
        <button id="or-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        <button id="or-add" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('ob_add_selected')}</button>
      </div>
    </div>`);
  document.getElementById('or-cancel').addEventListener('click',closeModal);
  document.getElementById('or-add').addEventListener('click',()=>{
    c.obligations=c.obligations||[];
    let n=0;
    document.querySelectorAll('[data-ob-pick]').forEach(cb=>{ if(cb.checked){ const o=found[Number(cb.getAttribute('data-ob-pick'))];
      c.obligations.push({ id:'ob_'+Math.random().toString(36).slice(2,8), desc:o.desc, due:o.due||'', recurring:o.recurring||'none', assignee:'', status:'open', quote:o.quote||'' }); n++; } });
    logAudit(c,'Obligation',`Added ${n} obligation${n===1?'':'s'} from Copilot scan`);
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
    toast(`Added ${n} obligation${n===1?'':'s'}`);
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
const OBLIG_BANDS = [
  ['overdue', 'ob_band_overdue'],
  ['month',   'ob_band_month'],
  ['later',   'ob_band_later'],
  ['done',    'ob_band_done'],
];
function obligationBand(o){
  const st = obState(o);
  if(st === 'done') return 'done';
  if(st === 'overdue') return 'overdue';
  const due = obligationDue(o);
  if(!due) return 'later';
  const d = new Date(due), now = new Date();
  if(isNaN(d)) return 'later';
  return (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth())
    ? 'month' : 'later';
}

/* ---- WHAT THE TAB SAYS ABOUT ITSELF ----
   The count is what is still OUTSTANDING, and it is AMBER ONLY WHEN SOMETHING
   IS OVERDUE. A count that is always coloured is a warning nobody reads — the
   sidebar's own rule, applied to a tab. */
function obligationTabState(c){
  const obs = (c && c.obligations) || [];
  let open = 0, overdue = 0;
  obs.forEach(o => { const st = obState(o); if(st === 'done') return; open++; if(st === 'overdue') overdue++; });
  return { open, overdue, total: obs.length };
}

/* ---- THE PANE ----
   ONE FULL-WIDTH CARD, laid out like the History tab rather than like Key
   terms: this is a worklist and not a document, so it wants the width and it
   wants rows ruled edge to edge. */
function roomObligationsHtml(c){
  const obs = (c && c.obligations) || [];
  const editable = (typeof canEdit === 'function') ? canEdit() : false;
  const st = obligationTabState(c);
  const rows = obs.map((o, i) => ({ o, i, band: obligationBand(o) }));

  /* "0 outstanding" over an empty state that already says nothing is tracked is
     the same fact printed twice, and the second printing is the one that reads
     like a fault. The acts stay: they are the way in. */
  const head = `<div class="obt-head">
      ${obs.length ? `<span class="obt-cap">${_obEsc(i18tn('ob_head_open', st.open, { n: st.open }))}</span>` : ''}
      ${st.overdue ? `<span class="obt-over">${_obEsc(i18tn('ob_head_overdue', st.overdue, { n: st.overdue }))}</span>` : ''}
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

  const bands = OBLIG_BANDS.map(([k, key]) => {
    const mine = rows.filter(r => r.band === k);
    /* A BAND WITH NOTHING IN IT DRAWS NOTHING — the change column's own rule.
       Four empty headings over an empty page is furniture. */
    if(!mine.length) return '';
    return `<div class="obt-band">${_obEsc(i18t(key))}<b>${mine.length}</b></div>`
      + mine.map(row).join('');
  }).join('');

  return head + bands;
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

Object.assign(window,{OBLIG_RECUR,OBLIG_BANDS,OB_NOTE_MAX,obligationNextDue,obligationSeriesId,obligationNextInstance,obligationMarkDone,obligationClearDone,obligationOnTime,obligationsReadStamp,openObligationDone,obligationReminderTo,obligationIsMine,obligationBand,obligationTabState,roomObligationsHtml,roomPaintObligations,OBLIG_PARTY,obligationParty,obligationIsTheirs,obligationOwner,obligationsOurs,obligationsTheirs,findObligation,toggleObligation,toggleObligationById,openObligations,dateOnly,isoDay,renewalDecisionDate,RENEWAL_WINDOW_DAYS,renewalWindow,renewalInForce,obligationDue,obligationSurfacesChanged,obState,contractObligations,allObligations,overdueObligationCount,renewalDecisionsDue,heuristicObligations,extractObligations,renderObligationsSection,openObligationForm,runFindObligations,openObligationsReview});
