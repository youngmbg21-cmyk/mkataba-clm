// HaTi — Renewal calendar & obligations agenda. Globals window-attached.
/* ============================================================================
   THE CALENDAR TAKES THE MOCK-UP (owner-approved render, 22 Aug 2026)
   ----------------------------------------------------------------------------
   Built from the owner's own HTML: a one-line head, a control bar under it,
   the month as a white card ruled by hairlines with tinted chips and a legend
   along its bottom, and a "Next 30 days" panel down the right.

   THE ONE CONSTRAINT THE OWNER SET: "the calendar should fit with the page and
   not a need to scroll within the page." The render's day boxes are a fixed
   104px, and six rows of those plus the head, the bar and the legend need more
   height than a laptop has — the old grid met the same wall and answered it
   with a clamp and two height media queries, which is a number kept true by
   hand. THE ROWS FLEX INSTEAD: .cal-weeks is six 1fr rows inside a flex:1 card,
   so the month always shows all six weeks and the cells give up height rather
   than the month giving up a week. What a short cell gives up is CHIPS, and it
   says so with "+N more"; the cell is still the door it has always been.
   The only two things that scroll inside themselves are LISTS, where there is
   no alternative: the panel's rows and the List view's own rows.

   WHAT WAS NOT BUILT, said out loud: "Add key date". The render carries one and
   the owner ruled it out (22 Aug 2026) — every date on this screen comes off a
   contract, and a date belonging to nothing would need a store of its own. The
   button is not drawn rather than drawn dead.

   THE TONES ARE HaTi'S OWN, DELIBERATELY. The render's legend has four entries
   and so does this, which is the feature; what it does NOT do is take the
   render's hue assignment, which reds the renewal decision and ambers the
   expiry. Expiry is ruby everywhere else in this product — the register's
   countdown, the dashboard, the alerts — and re-pointing one screen's colours
   at a different meaning is how two screens come to disagree about urgency.
   Four tones, HaTi's four meanings.
   ========================================================================== */

/* Per sitting, in memory. A view and a scope are working preferences, not
   settings: a reader who looked at the quarter once must not find the calendar
   on Quarter next week with no memory of asking. */
/* `days` starts NULL rather than at the constant: this object is built at load
   and CAL_AGENDA_DAYS is a const declared below it, so naming it here is a read
   inside its own temporal dead zone — the getter trap this codebase records,
   one keyword along. calAgendaDays() supplies the default. */
let calState = { ym:null, view:'week', scope:'all', days:null, wk:null, lay:{ ct:true, me:true, cp:true } };
/* ---- THREE TABS, THE DESIGN'S OWN (owner-ruled 24 Aug 2026) ----
   Month · Horizon · Obligations. 'quarter' and 'list' are RETIRED: Quarter drew
   three compact months of the same grid, which is the Month view three times
   and answers no question Month does not; List printed every date in the period
   in order, which the agenda beside the month already does for the window a
   reader can act on. What replaces them each answer something nothing in HaTi
   did — when the book runs out, and what is owed. calQuarterHtml and
   calListHtml go with them, and so does every rule that dressed them.
   OBLIGATIONS FOLLOWED THEM THE SAME EVENING (owner-ruled, 24 Aug 2026): its
   rows are still events on the month grid and in the agenda beside it, which is
   where an obligation sits next to the date it falls on.
   THE KEYS STAY READABLE FROM AN OLD BROWSER: calView() falls back to 'month'
   for anything not on this list, so a reader whose stored tab was 'list' lands
   on the month rather than on a blank page. */
/* ---- WEEK JOINS THEM (Young, 10 Oct 2026, the "HaTi Proposals" artifact,
   Part 3: "combine layers which looks at monthly view with the week planner
   to make it one calendar ... combine it with the horizon view") ----
   One calendar, three views: Month to see everything, Week to plan the
   person's own hours (js/mine.js), Horizon for the year of contracts. */
const CAL_VIEWS = ['month','week','horizon'];
/* ---- THE AGENDA'S WINDOW IS A CONTROL (owner-asked 31 Aug 2026, J-5.4) ----
   *"the highlighted area that shows the next 14 days, change that to a filter
   where you can look next 14, 30, 60, 90 days."*

   HALF OF IT WAS ALREADY BUILT: calUpcoming has always taken a window and
   every caller passed nothing, so the fortnight was simply the only value
   anybody ever handed it. What was missing is the control.

   ONE VALUE, READ BY THE READING, THE HEADING AND THE EMPTY STATE. This panel
   has been caught once already headed 30 with an empty state saying 60, and
   the correction was to make one number answer for all three — that property
   is the condition on this change, not a nicety.

   PER SITTING, IN MEMORY, on calState beside the tab and the scope switch.
   Those two are not stored and neither is this: a reader who widened to ninety
   days last Tuesday should not quietly still be on ninety a week later. */
const CAL_AGENDA_DAYS = 14;
const CAL_AGENDA_WINDOWS = [14, 30, 60, 90];
/* An unknown stored or supplied value falls back to the fortnight rather than
   drawing a blank panel — calView's own rule, one control along. */
function calAgendaDays(){
  const n = Number(calState.days);
  return CAL_AGENDA_WINDOWS.includes(n) ? n : CAL_AGENDA_DAYS;
}
function calSetAgendaDays(n){
  const v = Number(n);
  if(!CAL_AGENDA_WINDOWS.includes(v) || v === calAgendaDays()) return;
  calState.days = v; renderCalendar();
}
/* The panel draws at most this many rows. At a fortnight that ceiling is
   almost never reached; at ninety days it will be reached constantly, and a
   list that quietly stops at 40 of 137 reads as a list of 40. A CAP IS A FACT,
   NEVER A SILENT TRIM — so past it the panel says how many of how many. */
const CAL_AGENDA_ROWS = 40;

/* A REFRESH LANDS WHERE YOU WERE (Young, 28 Sep 2026): what this page keeps
   across a reload, read by placeSave and put back by placeResume (js/app.js)
   BEFORE the first paint. */
function calPlace(){ return { ...calState }; }
function calPlacePut(p){ if(p) Object.keys(calState).forEach(k=>{ if(k in p) calState[k]=p[k]; }); }
function calMonth(){ if(!calState.ym){ const d=new Date(); calState.ym={y:d.getFullYear(), m:d.getMonth()}; } return calState.ym; }
/* the calendar opens on this week by the hour and five more (round 16) */
function calView(){ return CAL_VIEWS.includes(calState.view)?calState.view:'week'; }
function calScope(){ return calState.scope==='mine'?'mine':'all'; }

/* ---- FOUR TONES, AND EACH IS A TOKEN ----
   dot/fg/bg come from the status ramp, so both themes answer for free and a
   palette change reaches this screen with everything else. The render draws
   its chips as a tinted box with a coloured left edge and coloured text, which
   is far more legible in a small cell than the dot-and-name this screen used
   to draw — that treatment is taken; the meanings are not. */
const CAL_EVENT = {
  expiry:     { dot:'var(--st-ruby-dot)',  fg:'var(--st-ruby-fg)',  bg:'var(--st-ruby-bg)',
                get label(){ return i18t('cal_expiry'); },           get short(){ return i18t('cal_k_expiry'); } },
  renewal:    { dot:'var(--st-amber-dot)', fg:'var(--st-amber-fg)', bg:'var(--st-amber-bg)',
                get label(){ return i18t('cal_renewal_decision'); }, get short(){ return i18t('cal_k_renew'); } },
  obligation: { dot:'var(--st-green-dot)', fg:'var(--st-green-fg)', bg:'var(--st-green-bg)',
                get label(){ return i18t('cal_obligation'); },       get short(){ return i18t('cal_k_oblig'); } },
  /* GRAY, NOT STEEL, AND IT WAS MEASURED. --st-steel-dot resolves to
     var(--color-accent-500) — the WORKSPACE ACCENT — so in the teal workspace
     negotiation activity and obligations drew as two shades of one colour and
     the legend answered "green" twice. The pipeline card records the same trap
     in the same words. --st-gray is a real blue-grey (#94a3b8) and is also the
     nearest thing this ramp has to the render's own #5C6B7F, so it is both the
     honest choice and the faithful one, and it holds in the navy workspace
     where the accent moves and this does not. */
  round:      { dot:'var(--st-gray-dot)',  fg:'var(--st-gray-fg)',  bg:'var(--st-gray-bg)',
                get label(){ return i18t('cal_nego_activity'); },    get short(){ return i18t('cal_k_round'); } },
};
/* THE PERSON'S OWN LAYER (10 Oct 2026): their events in the accent, a note
   to review in grey, a block Copilot proposed in the helper colour, dashed
   until it is added. */
CAL_EVENT.mine = { dot:'var(--color-accent-600)', fg:'var(--accent-ink)', bg:'var(--color-accent-50)',
  get label(){ return i18t('cal_lg_mine'); }, get short(){ return i18t('cal_k_mine'); } };
CAL_EVENT.note = { dot:'var(--color-neutral-500)', fg:'var(--color-neutral-700, var(--color-text))', bg:'var(--surface-2, var(--color-neutral-100))',
  get label(){ return i18t('cal_lg_note'); }, get short(){ return i18t('cal_k_note'); } };
CAL_EVENT.plan = { dot:'var(--cal-cp)', fg:'var(--cal-cp)', bg:'var(--cal-cp-bg)',
  get label(){ return i18t('cal_lg_plan'); }, get short(){ return i18t('cal_k_plan'); } };
// priority when a day carries more than one kind of event (drives its tint)
const CAL_PRIORITY = ['expiry','renewal','obligation','round','mine','note','plan'];

/* Gather every lifecycle event as {date, type, cid, cname, note}. */
function calendarEvents(){
  const out=[];
  state.contracts.forEach(c=>{
    if(c.status!=='Declined'&&!c.archived){
      const cref=(window.contractRef?contractRef(c):c.id);
      /* Through dateOnly, because the grid is keyed by YYYY-MM-DD: an expiry
         written "30 September 2026" matched no cell, so the event was built,
         counted and then rendered on no day at all. Same normalisation the
         decision date uses, so the two are comparable below. */
      const rawExp=(window.effectiveExpiry?effectiveExpiry(c):null)||(c.metadata&&c.metadata.expiryDate)||c.expiry;
      const exp=window.dateOnly?dateOnly(rawExp):rawExp;
      if(exp) out.push({ date:exp, type:'expiry', cid:c.id, cref, cname:c.name, note:c.counterparty||'' });
      /* ---- A RENEWAL SOMEBODY HAS ANSWERED IS NOT A DECISION OWED ----
         (16 Sep 2026.) THE RULE, WRITTEN ONCE AND READ EVERYWHERE: a surface
         counting to the DECISION date is silenced by any recorded answer; a
         surface counting to the EXPIRY is silenced only by "let it lapse"; a
         surface that merely PLOTS a date keeps it. This one's own note is
         "decide by", so it is the first kind. The expiry chip beside it stays —
         the agreement still ends on that day whatever was decided. */
      const dd=(typeof renewalDecided==='function'&&renewalDecided(c))?null:renewalDecisionDate(c);
      if(dd && dd!==exp) out.push({ date:dd, type:'renewal', cid:c.id, cref, cname:c.name, note:'decide by' });

    /* Through the same normalisation the expiry goes through. A due date filed
       as "31 March 2027" — which is what a Copilot scan and a typed migration
       sheet both produce — built an event, counted it, and then drew it on no
       day at all, while daysUntil(NaN) kept it out of the agenda as well.

       INSIDE the Declined guard, which this loop used to sit just past: a
       declined contract owes nothing, and its obligations on the agenda were
       jobs somebody would have done for a deal that never happened. */
    (c.obligations||[]).forEach(o=>{ const od=window.obligationDue?obligationDue(o):o.due;
      if(od) out.push({ date:od, type:'obligation', cid:c.id, cref, cname:c.name, note:o.desc,
        /* Carried so the agenda can act on this row without looking anything
           up. BY ID, never by position: this list is sorted by date and the
           contract's own list is not, so an index here would tick off a
           different obligation from the one that was pressed. */
        obId:o.id||null, theirs:!!(window.obligationIsTheirs&&obligationIsTheirs(o)),
        owner:(window.obligationOwner?obligationOwner(o,c):(o.assignee||'')),
        /* WHOSE DELIVERABLE IT IS. The workspace panel has always printed this
           under every obligation ("unassigned" when nobody owns it); the
           calendar — the screen somebody actually opens to ask "what is due
           this month" — carried neither the obligation's description nor its
           owner, only the contract's name. A row reading "Nandi Dairy ·
           Obligation · MK-2 · 12d" does not tell anybody what to do. */
        assignee:o.assignee||'', done:o.status==='done',
        /* A STEP HELD BACK BY AN EARLIER ONE is waiting, never late, never due
           (round 16: "Waiting on a step is never counted as late or chased") —
           the Obligations page's own reading */
        waiting:!!(window.obligationBlocked&&obligationBlocked(o,c)) }); });

    /* ---- NEGOTIATION ACTIVITY, THE RENDER'S FOURTH TONE ----
       One event per round that has actually CLOSED, dated by the round's own
       stamp, plus the live round's hand-over if there has been one. It is what
       makes "when did we last move on this?" answerable from the calendar
       rather than from four contract pages.

       READ RAW, NEVER THROUGH negoChanges: that runs negoInit and would start
       a negotiation on every contract this loop touches, on every repaint.
       This is the standing rule for every counting surface in the product.

       AND IT READS THE NEGOTIATION, NOT THE AUDIT TRAIL. In server mode
       state.contracts is the LIGHT list and HEAVY strips `audit` out of every
       row, so a calendar built on the trail would be full locally and empty in
       production — the fault this codebase already paid for twice, on the
       dashboard's "Decisions due" and on Reports. `negotiation` survives the
       light projection by construction (HEAVY spreads the record). */
    const n=c.negotiation;
    if(n){
      (Array.isArray(n.rounds)?n.rounds:[]).forEach(r=>{
        const at=window.dateOnly?dateOnly(r&&r.at):((r&&r.at)||'').slice(0,10);
        if(at) out.push({ date:at, type:'round', cid:c.id, cref, cname:c.name,
          note:i18t('cal_round_n',{n:r.n||''}), round:r.n||null });
      });
      const t=window.dateOnly?dateOnly(n.turnAt):String(n.turnAt||'').slice(0,10);
      if(t) out.push({ date:t, type:'round', cid:c.id, cref, cname:c.name,
        note:i18t('cal_round_n',{n:n.round||''}), round:n.round||null });
    }
    }
  });
  return out;
}

/* ---- WHOSE DATE IS THIS (the All dates / Mine switch) ----
   An OBLIGATION is mine when it resolves to me — the same reading the nudge
   emails use to decide who to write to. Everything else belongs to the
   CONTRACT, so it is mine when I own the contract; contractOwnedBy is the one
   answer to that and already prefers the stored owner over the audit trail.
   Nobody signed in means nothing is "mine", and the switch says so rather than
   emptying the screen without explanation. */
function calEventMine(e, u){
  const me=u||(window.currentUser?currentUser():null);
  if(!me) return false;
  if(e.type==='obligation'){
    const a=String(e.assignee||'').trim().toLowerCase();
    if(a && (a===String(me.name||'').toLowerCase() || a===String(me.email||'').toLowerCase())) return true;
    if(e.theirs) return false;
  }
  const c=(state.contracts||[]).find(x=>x.id===e.cid);
  return !!(c && window.contractOwnedBy && contractOwnedBy(c, me));
}

/* ---- THE PERIOD THE SCREEN IS SHOWING ----
   One reading, asked by the grid, the legend counts, the Export file and the
   Share summary — so what leaves the page is exactly what is on it. Month
   shows its month; Quarter and List show that month and the two after it. */
function calPeriod(){
  const {y,m}=calMonth(), view=calView();
  if(view==='week'){ const a=calWeekStart(), z=calAddDays(a,7*(CAL_WEEKS_SHOWN-1)+CAL_WEEK_DAYS-1);
    return { months:[{y:a.getFullYear(),m:a.getMonth()}], from:_isoLocal(a), to:_isoLocal(z) }; }
  const months=[{y,m}];
  if(view!=='month') for(let i=1;i<3;i++){ const d=new Date(y,m+i,1); months.push({y:d.getFullYear(),m:d.getMonth()}); }
  const last=months[months.length-1];
  const iso=(yy,mm,dd)=>`${yy}-${String(mm+1).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
  return { months, from:iso(y,m,1), to:iso(last.y,last.m,new Date(last.y,last.m+1,0).getDate()) };
}
const calInPeriod=(e,p)=>e.date>=p.from&&e.date<=p.to;

/* Everything the screen is allowed to draw: the scope filter, applied once. */
function calVisible(evs){
  if(calScope()!=='mine') return evs;
  const me=window.currentUser?currentUser():null;
  return evs.filter(e=>calEventMine(e,me));
}

/* ---- "N DECISIONS THIS WEEK" ----
   The render's own amber line beside the title. A DECISION is a renewal
   decision — the date this product exists to stop anybody missing — counted
   over the current Monday-to-Sunday week, whatever month is being looked at:
   it is a fact about today, not about the page. */
/* ---- TODAY, AS THIS GRID KEYS ITS DAYS ----
   The cells are keyed by a LOCAL calendar date, so "today" has to be built the
   same way. Two near-misses were both live here: `new Date().toISOString()` is
   UTC and puts today on yesterday's cell for every reader west of Greenwich
   after their afternoon, and `todayStr()` — which reads like the answer — is a
   DISPLAY string ("22 Aug 2026") that matched no cell at all, so today was
   simply never marked. */
const _isoLocal=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
/* The same question js/core.js's todayISO answers, and it is asked there so the
   two cannot drift; `_isoLocal(new Date())` is the identical fallback, kept
   because this file's week and month readings use _isoLocal anyway. */
function calToday(){
  try{ if(typeof window !== 'undefined' && typeof window.todayISO === 'function') return todayISO(); }catch(_){}
  return _isoLocal(new Date());
}

function calWeekBounds(d){
  const t=d?new Date(d):new Date();
  const day=(t.getDay()+6)%7;              // Monday = 0
  const mon=new Date(t.getFullYear(),t.getMonth(),t.getDate()-day);
  const sun=new Date(mon.getFullYear(),mon.getMonth(),mon.getDate()+6);
  return { from:_isoLocal(mon), to:_isoLocal(sun) };
}
function calDecisionsThisWeek(evs){
  const w=calWeekBounds();
  return evs.filter(e=>e.type==='renewal'&&e.date>=w.from&&e.date<=w.to).length;
}

const _esc=s=>String(s||'').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const _dot=(color,px)=>`<span style="width:${px}px;height:${px}px;border-radius:50%;background:${color};flex:none"></span>`;

/* The chip's own words. The render writes "Expiry · MK-311", "Renew · S&OP",
   "Insurance · Juno" — a KIND and the thing it is about, which is what fits in
   a cell a seventh of a month wide. An obligation is its own description (the
   kind adds nothing beside "quarterly report"); everything else is its kind
   and the tracking number, because a name truncated to two words is a guess
   between agreements and a tracking number never is. The full name is on the
   cell's own tooltip either way. */
function calChipText(e){
  if(e.type==='obligation') return String(e.note||CAL_EVENT.obligation.label);
  return CAL_EVENT[e.type].short+' · '+(e.cref||e.cid);
}
/* ---- WHOSE IT IS, ON EVERY CHIP (round 16 "Week by week" as drawn; the
   owner's "build all the gaps", 18 Oct 2026) ----
   The calendar colours each contract date the way the Obligations page draws
   its rows: ours in the accent (a colleague's initials after it, "Volume
   report · ES"), theirs in their own tint with their name first ("Nordvik:
   insurance cert."), late in red ("Late: …"), a renewal decision in amber
   ("Decide: Office Lease"), an end in red ("Ends: …"), nobody's in grey. ONE
   reading for the week, the five weeks after it and the month; a negotiation
   round keeps its own grey. */
function calChipLook(e){
  if(!e||e.own) return null;
  if(e.type==='obligation'){
    const desc=String(e.note||CAL_EVENT.obligation.label);
    if(e.done) return { k:'done', text:desc };
    if(e.waiting) return { k:'wait', text:i18t('cal_ck_wait',{t:desc}) };
    if(e.date<calToday()) return { k:'late', text:i18t('cal_ck_late',{t:desc}) };
    if(e.theirs){ const p=String(e.owner||'').trim().split(/\s+/)[0]||''; return { k:'theirs', text:p?p+': '+desc:desc }; }   /* "Nordvik: insurance cert." — their name first, in any language */
    const m=(typeof window.obligationReminderTo==='function')?window.obligationReminderTo({ assignee:e.assignee }):null;
    if(!m) return { k:'nobody', text:desc };
    const me=(typeof window.currentUser==='function')?window.currentUser():null;
    if(me&&String(m.id)===String(me.id)) return { k:'ours', text:desc };
    return { k:'ours', text:desc+' · '+((typeof window.obInitials==='function')?window.obInitials(m.name):'') };
  }
  if(e.type==='renewal') return { k:'decide', text:i18t('cal_ck_decide',{t:e.cname||e.cref||e.cid}) };
  if(e.type==='expiry') return { k:'ends', text:i18t('cal_ck_ends',{t:e.cname||e.cref||e.cid}) };
  return null;
}
/* THE FIVE WEEKS' CELLS SHOW WHAT THEIR HEIGHT HOLDS: every chip is drawn,
   the ones past the cell's foot hide, and "+N more" counts exactly those —
   so a tall window shows two where a short one shows one */
function calWkmFit(){
  if(typeof document==='undefined') return;
  document.querySelectorAll('.cal-wkm-d').forEach(cell=>{
    const more=cell.querySelector('[data-cal-wkm-more]'); if(!more) return;
    const xs=[...cell.querySelectorAll('[data-cal-wkm-x]')];
    xs.forEach(x=>{ x.hidden=false; });
    more.hidden=false;
    const foot=cell.getBoundingClientRect().bottom-4;
    let hid=0;
    for(let k=xs.length-1;k>=0;k--){ if(xs[k].getBoundingClientRect().bottom>foot-(more.offsetHeight||14)){ xs[k].hidden=true; hid++; } }
    more.textContent=i18t('cal_n_more',{n:hid});
    more.hidden=!hid;
  });
}
/* WHAT A CHIP'S PRESS DOES, read off its look: Chase on theirs still owed (by
   id), Decide on a renewal decision, else the contract as before */
function calChipAct(e,L){
  if(!e||!L) return '';
  if(L.k==='decide') return 'decide';
  if(e.type==='obligation'&&e.theirs&&e.obId&&!e.done&&!e.waiting&&((typeof canEdit!=='function')||canEdit())) return 'chase';
  return '';
}
function calChipGo(el){
  const cid=el.getAttribute('data-cal-ct')||el.getAttribute('data-sel'), k=el.getAttribute('data-cal-act');
  if(k==='chase'&&typeof window.obligationChase==='function'){ obligationChase(cid,el.getAttribute('data-cal-ob')); return true; }
  if(k==='decide'&&typeof window.needsYouGo==='function'){ needsYouGo('renewal',cid); return true; }
  return false;
}
/* a contract date's chip, drawn the one way (calChipLook) where it has a
   look; `tag` is span on the month and the five weeks, button on the week */
function calCtChipHtml(e, tag, cls){
  const L=calChipLook(e); if(!L) return '';
  const ev=CAL_EVENT[e.type];
  const we=e._we?`<b class="cal-we">${_esc(e._we)}</b> · `:'';
  const title=(e._we?e._we+' · ':'')+ev.label+': '+(e.note||e.cname)+' · '+(e.cref||e.cid);
  /* the week's chips keep their own door (data-sel), the month's and the five
     weeks' theirs (data-cal-ct) — the same contract either way */
  const door=tag==='button'?'data-sel':'data-cal-ct';
  /* ONE DOOR (round 16's notes): a chip does what its row does — theirs is
     the same Chase, a renewal decision the same Decide (calChipGo) */
  const act=calChipAct(e,L);
  const acts=act?` data-cal-act="${act}" data-cal-ob="${_esc(e.obId||'')}"`:'';
  const say=act==='chase'?' · '+i18t('cal_ck_chase_title'):act==='decide'?' · '+i18t('ob_wk_decide_title'):'';
  return `<${tag}${tag==='button'?' type="button"':''} class="cal-chip ${cls||''} is-ck-${L.k}${e.done?' is-done':''}" ${door}="${_esc(e.cid)}"${acts} title="${_esc(title+say)}">${we}${_esc(L.text)}</${tag}>`;
}

/* ---- THE CALENDAR FILE ----
   Plain RFC 5545, hand-written: every date here is an all-day event and this
   is a dozen lines, against a dependency for a format that has not changed
   since 1998. Folding is not attempted — the SUMMARY lines are short by
   construction (a kind, a tracking number and a name) — but every field is
   escaped, which is the part that actually breaks readers.
   UID is stable per event so re-importing corrects rather than duplicates. */
const _ics=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
function calIcsFor(evs){
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const day=d=>String(d||'').replace(/-/g,'');
  const next=d=>{ const t=new Date(d+'T00:00:00'); t.setDate(t.getDate()+1);
    return `${t.getFullYear()}${String(t.getMonth()+1).padStart(2,'0')}${String(t.getDate()).padStart(2,'0')}`; };
  const body=evs.map((e,i)=>[
    'BEGIN:VEVENT',
    `UID:hati-${_ics(e.cid)}-${e.type}-${day(e.date)}-${i}@hati`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day(e.date)}`,
    `DTEND;VALUE=DATE:${next(e.date)}`,
    `SUMMARY:${_ics(CAL_EVENT[e.type].short+' · '+e.cname)}`,
    `DESCRIPTION:${_ics(CAL_EVENT[e.type].label+(e.note?' — '+e.note:'')+' · '+(e.cref||e.cid))}`,
    'END:VEVENT'].join('\r\n')).join('\r\n');
  return ['BEGIN:VCALENDAR','PRODID:-//HaTi//Contract calendar//EN','VERSION:2.0','CALSCALE:GREGORIAN',
    body,'END:VCALENDAR'].filter(Boolean).join('\r\n')+'\r\n';
}

/* One row of the "Next 30 days" panel, and of the Share summary. ONE builder,
   so what a colleague is emailed is what the reader was looking at. */
/* ---- FOURTEEN DAYS, NOT THIRTY (owner-asked 24 Aug 2026, "like for like") ----
   The design's agenda is "Next 14 days". Thirty was HaTi's own number and it
   made the panel a second list of the month beside the month; a fortnight is
   what a reader can act on. THE DEFAULT IS THE ONLY THING THAT MOVED — the
   parameter is untouched, so any caller naming its own window still gets it.
   The heading and its empty state read this same number rather than stating
   one of their own: two places naming a window is how they come to disagree,
   which this file has already been caught doing once (a panel headed 30 whose
   empty state said 60). */
function calUpcoming(evs, days){
  const n=days||calAgendaDays();
  return evs.filter(e=>{ const d=daysUntil(e.date); return d>=0 && d<=n && !e.done; })
    .sort((a,b)=>a.date.localeCompare(b.date));
}
/* WHAT LEAVES THE PAGE IS WHAT IS ON IT (J-5.4). This asked calUpcoming with
   no window, so a reader looking at ninety days would mail a colleague a
   fortnight of dates. The window joins the period and the scope, which this
   page already carries into both Export and Share. */
function calSummaryLines(evs, days){
  return calUpcoming(evs, days||calAgendaDays()).slice(0,CAL_AGENDA_ROWS).map(e=>{
    const d=daysUntil(e.date);
    return `${e.date} · ${CAL_EVENT[e.type].label} — ${e.cname} (${e.cref||e.cid})`
      +(e.note&&e.type==='obligation'?` · ${e.note}`:'')
      +` · ${d===0?i18t('cal_today'):i18t('cal_in_days',{n:d})}`;
  });
}

/* ---------------------------------------------------------------------------
   THE RENDER
   ------------------------------------------------------------------------- */
function calMonthName(y,m){ return new Date(y,m,1).toLocaleDateString(langLocale(),{month:'long',year:'numeric'}); }
function calDowCells(short){
  /* Monday first, like the render and like every European calendar. Built from
     the reader's own locale rather than a hardcoded list — a weekday is a WORD
     and follows the language, which is the rule this product already states
     for months. */
  const out=[];
  /* MONDAY TO FRIDAY EVERYWHERE (round 16, owner's yes, 17 Oct 2026) */
  for(let i=0;i<CAL_WEEK_DAYS;i++){
    const d=new Date(2024,0,1+i);   // 1 Jan 2024 was a Monday
    const w=d.toLocaleDateString(langLocale(),{weekday:short?'narrow':'short'});
    out.push(`<span>${_esc(w)}</span>`);
  }
  return out.join('');
}

/* A weekend date as it stands on the Friday before: "Sat 24". */
function calWeekendWord(iso){
  const d=new Date(String(iso||'').slice(0,10)+'T00:00:00');
  if(isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString(langLocale(),{weekday:'short'})} ${d.getDate()}`;
}
/* One month's 42 cells. `compact` is the Quarter view: no chips, just the day
   number and a row of dots, because a cell a twenty-first of the page wide has
   no room for words and a truncated word is worse than a dot. */
function calMonthGridHtml(y, m, byDay, opts){
  const compact=!!(opts&&opts.compact);
  const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate();
  const todayIso=calToday();
  const cells=[];
  const isoOf=dd=>{ const d=new Date(y,m,dd); return _isoLocal(d); };
  for(let i=0;i<42;i++){
    /* MONDAY TO FRIDAY (round 16, owner's yes, 17 Oct 2026): the six weeks
       draw their working days only; a Saturday's or a Sunday's dates stand on
       the Friday before, each saying its own day ("Sat 24 · …"). */
    if(i%7>=CAL_WEEK_DAYS) continue;
    const dnum=i-start+1, inMonth=dnum>=1&&dnum<=days;
    const weekend=i%7===CAL_WEEK_DAYS-1
      ? [1,2].filter(k=>dnum+k>=1&&dnum+k<=days).flatMap(k=>(byDay[isoOf(dnum+k)]||[]).map(e=>Object.assign({},e,{ _we:calWeekendWord(isoOf(dnum+k)) })))
      : [];
    if(!inMonth&&!(weekend.length&&!compact)){
      /* The days either side keep their NUMBERS, greyed — the render draws
         them and a reader counting back from the 1st needs somewhere to land.
         They carry no events and no press: this month's grid is not the place
         to act on another month's contract. */
      const d=new Date(y,m,dnum);
      cells.push(`<div class="cal-day is-mute"><span class="cal-dn">${d.getDate()}</span></div>`);
      continue;
    }
    const iso=isoOf(dnum);
    const list=(inMonth?(byDay[iso]||[]):[]).concat(weekend);
    const today=iso===todayIso;
    const dayName=new Date(y,m,dnum).toLocaleDateString(langLocale(),{day:'numeric',month:'long',year:'numeric'});
    /* ---- THE WHOLE BOX OPENS ITS WEEK, A CONTRACT OPENS ITS CONTRACT (Young,
       11 Oct 2026: "Press a day in Month to open its week ... Pressing a
       contract anywhere opens that contract") ----
       The box is the week's door (a real tab stop, Enter and Space); each
       contract chip is that contract's door, pressed before the box. The
       register narrowed to a day (data-cal-day) is STALE. */
    const attrs=compact?'':` role="button" tabindex="0" data-cal-week="${iso}" title="${_esc(i18t('cal_open_week_of',{day:dayName}))}"`;
    let inner='';
    if(compact){
      const dots=list.slice(0,4).map(e=>_dot(CAL_EVENT[e.type].dot,5)).join('');
      inner=dots?`<span class="cal-dots">${dots}</span>`:'';
    } else {
      /* AT MOST TWO CHIPS, AND THE SECOND GIVES WAY TO THE COUNT. A cell whose
         height flexes cannot promise room for a third, and a clipped chip is a
         fact half-said. "+N more" is not its own button — the cell it sits in
         already goes exactly where it promises. */
      const show=list.length>2?list.slice(0,1):list.slice(0,2);
      const more=list.length-show.length;
      inner=`<span class="cal-chips">`+show.map(e=>{
        const ev=CAL_EVENT[e.type];
        /* THE TOOLTIP FOLLOWS THE PRESS, which is the rule that came with
           making the chips spans. On a ONE-CONTRACT day the press opens that
           contract, so naming the event is honest. On any other day the press
           goes to the register narrowed to the day, and a chip promising one
           event while leading to a list of five is a label that lies — so it
           carries no title and the browser walks up to the cell's own
           ("choose from N on 30 August"), which is where the press really
           lands. */
        const t=` title="${_esc((e._we?e._we+' · ':'')+ev.label+': '+(e.note||e.cname))}"`;
        const we=e._we?`<b class="cal-we">${_esc(e._we)}</b> · `:'';
        /* the chip's reference wears the reference face (calChipText stays the text) */
        /* the drawing's chip names the contract after its reference ("Ends · MK-A6 Flour…") */
        if(e.own){
          return `<span class="cal-chip cal-own is-${e.type}${e.st==='added'?' is-added':''}" ${e.own} title="${_esc((e._we?e._we+' · ':'')+e.title)}" style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${we}${_esc(e.chip)}</span>`;
        }
        const looked=calCtChipHtml(e,'span'); if(looked) return looked;
        const chip=we+(e.type==='obligation'?_esc(calChipText(e)):_esc(CAL_EVENT[e.type].short)+' · '+(window.refHtml?refHtml(e.cref||e.cid):_esc(e.cref||e.cid))+(e.cname?' '+_esc(e.cname):''));
        return `<span class="cal-chip${e.done?' is-done':''}" data-cal-ct="${_esc(e.cid)}"${t} style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${chip}</span>`;
      }).join('')+(more>0?`<span class="cal-more">${i18t('cal_n_more',{n:more})}</span>`:'')+`</span>`;
    }
    const dn=`<span class="cal-dn">${new Date(y,m,dnum).getDate()}</span>`;
    cells.push(`<div class="cal-day${today?' is-today':''}${inMonth?'':' is-mute'}"${attrs}>${dn}${inner}</div>`);
  }
  /* id="cal-grid" is KEPT from the grid this replaces, and only the MONTH view
     carries it — three of them in the Quarter view would be three elements
     sharing one id. laptops-verify names it to make the reported defect's own
     claim ("a month that does not show its last week"), and that claim is
     still exactly what this box has to answer. */
  const gid=(opts&&opts.id)?` id="${opts.id}"`:'';
  return `<div class="cal-dow">${calDowCells(compact)}</div><div class="cal-weeks"${gid}>${cells.join('')}</div>`;
}

/* ---- THE KEY NAMES ONLY WHAT IS ON THE MONTH (SAP benchmark, batch 2) ----
   The drawing's key is "● Contract ends ● Obligation due" — the two kinds that
   month carries, each word in its own kind's ink. A key entry for a colour
   that is nowhere on the page explains nothing. `evs` is the events of the
   period on screen; with none, no key is drawn. */
function calLegendHtml(evs){
  const has=new Set((evs||[]).map(e=>e.type));
  const kinds=CAL_PRIORITY.filter(k=>has.has(k));
  /* An empty key still keeps its line (.cal-legend's min-height): a month
     with nothing on it must not be a few pixels taller than one with
     something — THE MONTH NEVER CHANGES HEIGHT (owner, 4 Oct 2026). */
  return `<div class="cal-legend">`+kinds.map(k=>
    `<span style="color:${CAL_EVENT[k].fg}"><i style="background:${CAL_EVENT[k].dot}"></i>${_esc(i18t('cal_lg_'+k))}</span>`).join('')+`</div>`;
}
/* ---- THE CARD HEADS ITSELF (owner-asked 24 Aug 2026, "like for like") ----
   The design puts the period stepper, the period's name and the four-tone key
   on ONE row at the top of the month panel. They were in two other places: the
   stepper out on the page's control bar, and the key along the card's foot,
   which put the thing that explains the colours as far from them as the card
   allows.
   ONE HOME, NOT TWO — the stepper is drawn in exactly one place, because a
   control with two homes is how the two come to disagree. The ids are
   unchanged, so every handler and every test still reaches exactly what it
   reached before.

   ---- IT MOVED INTO THE PAGE HEAD 21 Sep 2026 (Young: the calendar must look
   exactly like the artifact) ---- the reference's grid card begins with the
   weekday row and carries no bar of its own; the month it is showing is named
   in the page's own sub-line. HaTi drew BOTH, so "September 2026" was printed
   twice, sixty pixels apart, which is the one fact printed twice this product
   has a standing rule against. The arrows cannot simply go — they are the only
   way to change month — so the sub-line's month becomes the control it was
   already sitting beside: prev, the month (which is Today), next. The word
   only the arrows carried is on their titles as it always was. */


/* ---- THE HORIZON: WHEN THE BOOK RUNS OUT (owner-ruled 24 Aug 2026) ----
   Twelve months across, one row per contract, and the BAR IS TIME REMAINING —
   not a schedule of work, which is what every other view here draws. The thing
   it exists to make obvious is the shape of the cliff: four rows ending in the
   same column is a quarter with four renewals in it, and no list of dates says
   that as fast.
   IT INVENTS NO DATES. Every row reads effectiveExpiry (the family-aware term,
   so a signed amendment moves the bar) and renewalDecisionDate (the notice
   deadline), which are the same two readings the month grid, the reminder
   sweeps and the renewal card all use. A contract with no expiry has no row —
   there is nothing to draw and an em-dash bar would be a lie. */
const CAL_HORIZON_MONTHS = 12;
function calHorizonRows(){
  const today = new Date(); today.setHours(0,0,0,0);
  const rows = [];
  (state.contracts||[]).forEach(c=>{
    if(c.status==='Declined' || c.archived) return;
    const raw=(window.effectiveExpiry?effectiveExpiry(c):null)||(c.metadata&&c.metadata.expiryDate)||c.expiry;
    const exp=window.dateOnly?dateOnly(raw):raw;
    if(!exp) return;
    const d=daysUntil(exp);
    if(d==null || d<0) return;                       /* already gone: not a horizon */
    /* The BAR is time remaining and stays whatever was decided — a decided
       agreement still ends on its day. The NOTICE MARKER is the decide-by
       point, which is the question an answer settles, so it comes off. */
    const dd=(typeof renewalDecided==='function'&&renewalDecided(c))?null:renewalDecisionDate(c);
    rows.push({ c, exp, days:d, notice:(dd&&dd!==exp)?dd:null,
      value:(window.fxHomeValue?fxHomeValue(c):Number(c.value||0)) });
  });
  return rows.sort((a,b)=>a.days-b.days);
}
/* Which of the twelve columns a date lands in, as a FRACTION so a bar ends
   where the date is rather than at a month boundary. Past the twelfth month it
   is clamped and the row says "beyond" — a bar that runs off the ruler tells
   the reader nothing about how far. */
function calHorizonPos(iso){
  const t=new Date(); t.setHours(0,0,0,0);
  const d=new Date(iso+'T00:00:00');
  const months=(d.getFullYear()-t.getFullYear())*12 + (d.getMonth()-t.getMonth())
    + (d.getDate()-1)/Math.max(1,new Date(d.getFullYear(),d.getMonth()+1,0).getDate());
  return Math.max(0, Math.min(CAL_HORIZON_MONTHS, months)) / CAL_HORIZON_MONTHS;
}
const CAL_LADDER = [
  { k:'d30',  max:30,  get label(){ return i18t('cal_lad_30'); },  tone:'var(--st-ruby-fg)' },
  { k:'d60',  max:60,  get label(){ return i18t('cal_lad_60'); },  tone:'var(--st-amber-fg)' },
  { k:'d90',  max:90,  get label(){ return i18t('cal_lad_90'); },  tone:'var(--st-amber-fg)' },
  { k:'d180', max:180, get label(){ return i18t('cal_lad_180'); }, tone:'var(--color-accent-700)' },
  { k:'d365', max:365, get label(){ return i18t('cal_lad_365'); }, tone:'var(--color-accent-700)' },
];
/* ---- WHAT THE DECISION COLUMN SAYS (Young ruled 21 Sep 2026: the Horizon
   "needs to resemble what is in the artifact") ----
   The artifact draws a third column at the right reading "Renegotiate · decided
   2 Sep", "Decision open · notice by 1 Oct", "Let it end · decided" or, faint,
   "No decision yet". EVERY WORD OF IT IS BORROWED: `renewalDecisionOf` is the
   one predicate every nag on this product asks, and its answer already carries
   the word and the day; `renewalDecisionDate` is the notice deadline the rest
   of this page already draws as the ▾ nip. NOTHING IS COMPUTED HERE and
   nothing is guessed — an agreement outside its notice window has no decision
   to make yet and says so by saying nothing.

   READING MUST NOT WRITE: both functions read `c.renewalDecision` and the
   record raw, and are the same pair calHorizonRows asks one line above. */
function calHorizonDecision(r){
  const c=r.c;
  const d=(typeof renewalDecisionOf==='function')?renewalDecisionOf(c):null;
  if(d){
    const word=i18t('rn_ans_'+d.answer)||d.answer;
    /* THE DAY IS PRINTED BY THE READING THIS PAGE ALREADY PRINTS DAYS WITH —
       `regDotDate`, the same one the bar's own date note uses eight lines
       above. A raw ISO string is what a screen shows when it reaches for a
       formatter that is not on the stage. */
    const day=String(d.at||'').slice(0,10);
    const when=day?(window.regDotDate?regDotDate(day):day):'';
    return { k:'is-done', text: when? i18t('cal_hz_dec_done',{answer:word,date:when}) : word };
  }
  /* A DEADLINE IS AN OPEN QUESTION, and only where there is one: past it, or
     with no notice period recorded, the row has nothing honest to put here. */
  if(r.notice) return { k:'is-open', text:i18t('cal_hz_dec_open',{date:window.regDotDate?regDotDate(r.notice):r.notice}) };
  return { k:'is-none', text:i18t('cal_hz_dec_none') };
}
function calHorizonHtml(){
  const rows=calHorizonRows();
  const t=new Date();
  const heads=[];
  for(let i=0;i<CAL_HORIZON_MONTHS;i++){
    const d=new Date(t.getFullYear(), t.getMonth()+i, 1);
    heads.push(`<span>${_esc(d.toLocaleDateString(langLocale(),{month:'short'}))}</span>`);
  }
  /* The ladder counts EVERY row, including those past the ruler, because it is
     a count of the book rather than of what is drawn. */
  const bands=CAL_LADDER.map((b,i)=>{
    const lo=i?CAL_LADDER[i-1].max:-1;
    const inBand=rows.filter(r=>r.days>lo && r.days<=b.max);
    const val=inBand.reduce((s,r)=>s+(r.value||0),0);
    return `<div class="cal-lad" style="border-top-color:${b.tone}">
      <div class="cal-lad-k">${_esc(b.label)}</div>
      <div class="cal-lad-n" style="color:${b.tone}">${inBand.length}</div>
      <div class="cal-lad-v">${val?_esc(window.fmtMoneyShort?fmtMoneyShort(val):String(val)):'&mdash;'}</div>
    </div>`;
  }).join('');
  const body = rows.length ? rows.map(r=>{
    const end=calHorizonPos(r.exp), beyond=r.days>365;
    const tone=r.days<=30?'var(--st-ruby-fg)':r.days<=90?'var(--st-amber-fg)':'var(--color-accent-700)';
    const note=`${_esc(window.regDotDate?regDotDate(r.exp):r.exp)} · ${_esc(i18t('reg_in_days',{n:r.days}))}`;
    /* WHICH SIDE OF THE BAR'S END THE NOTE HANGS FROM — never whether it sits
       ON the bar. It used to mean exactly that, and grey text on a saturated
       fill is what the owner reported as an invisible font on 24 Aug 2026; the
       note has a line of its own under the bar now (see .cal-hz-note). All this
       decides is that a bar ending near the right wall carries its date to the
       LEFT of that end, so the date never runs off the ruler. */
    const inside = end > .55;
    const nip = r.notice ? `<i class="cal-hz-nip" style="left:${(calHorizonPos(r.notice)*100).toFixed(2)}%"
      title="${_esc(i18t('cal_hz_notice',{d:window.regDotDate?regDotDate(r.notice):r.notice}))}">&#9662;</i>` : '';
    const dec = calHorizonDecision(r);
    return `<div class="cal-hz-row" data-sel="${_esc(r.c.id)}" role="button" tabindex="0">
      <div class="cal-hz-lab">
        <span class="n">${_esc(r.c.name)}</span>
        ${''/* THE ARTIFACT'S OWN ORDER — who it is with, then the reference,
               then what it is worth. The counterparty leads because that is
               what a reader scanning a wall of expiry dates is looking for,
               and the money only where they may see it (the product's own
               rule, borrowed rather than re-asked). */}
        <span class="m">${[r.c.counterparty?_esc(r.c.counterparty):'', (window.refHtml?refHtml(r.c):_esc(r.c.id)),
          ((typeof canViewValues!=='function'||canViewValues())&&Number(r.c.value)>0)
            ? _esc(window.fmtMoneyShortOf?fmtMoneyShortOf(r.c):fmtMoneyShort(r.c.value)) : ''
          ].filter(Boolean).join(' · ')}</span>
      </div>
      <div class="cal-hz-track">
        <span class="cal-hz-bar${beyond?' is-beyond':''}" style="width:${(end*100).toFixed(2)}%;background:${tone}"></span>
        <span class="cal-hz-end" style="left:${(end*100).toFixed(2)}%"></span>
        ${nip}
        <span class="cal-hz-note ${inside?'in':'out'}" style="left:${(end*100).toFixed(2)}%">${note}${beyond?' ·&nbsp;'+_esc(i18t('cal_hz_beyond')):''}</span>
      </div>
      <div class="cal-hz-dec ${dec.k}">${_esc(dec.text)}</div>
    </div>`;
  }).join('') : `<div class="cal-empty">
      <div class="cal-empty-t">${_esc(i18t('cal_hz_none'))}</div>
      <div class="cal-empty-s">${_esc(i18t('cal_hz_none_sub'))}</div></div>`;
  /* ---- BUILT TO THE ARTIFACT (Young ruled 21 Sep 2026: "image 4 shows the
     calendar i want ... image 5 shows what is currently in hati and do not
     want") ----
     THREE THINGS MOVED, and each was measured against
     prototype/hati-redesign-reference.html before it did:
       · THE LADDER LEADS. The reference puts the five bands across the top,
         which is the shape of the question — how much is closing, then which
         agreements — and HaTi had them under a table that scrolls, where a
         reader never reaches them.
       · THE CAPTION BAR IS GONE. "Twelve-month expiry horizon · Bar length is
         time remaining" is the page explaining itself under its own title, and
         the page's sub-line already says it. The ▾'s own hover still names the
         notice date, so nothing that was explained is unexplained.
         `cal_hz_title` and `cal_hz_head` are STALE, inert in both books.
       · THE ROWS SCROLL UNDER THE RULER, which is the owner's own words for
         it. The ruler was already sticky and the CARD was not the scroller —
         the whole page moved instead, so the header went with it. The table
         has its own scroller now and the card is the height it is given. */
  return `<section class="cal-card cal-grid cal-hz-card">
    <div class="cal-ladder">${bands}</div>
    <div class="cal-hz scroll-thin">
      <div class="cal-hz-ruler"><span class="cal-hz-col">${_esc(i18t('cal_hz_agreement'))}</span><div class="cal-hz-months">${heads.join('')}</div><span class="cal-hz-col cal-hz-col-dec">${_esc(i18t('cal_hz_decision'))}</span></div>
      <div class="cal-hz-rows">${body}</div>
    </div>
  </section>`;
}

/* "Next 30 days" — the render's own panel. Its rows are doors; an obligation
   also carries Done, which is the verb people come to this screen wanting and
   which used to mean opening the contract and scrolling to its own panel. */
function calPanelHtml(evs){
  const win=calAgendaDays();
  const up=calUpcoming(evs,win);
  const rows=up.slice(0,CAL_AGENDA_ROWS).map(e=>{
    const ev=CAL_EVENT[e.type], d=daysUntil(e.date);
    const when=d===0?i18t('cal_today'):i18t('cal_in_days_long',{n:d});
    /* ---- THE DRAWING'S ROW (SAP benchmark, batch 2) ----
       Three columns: the date over how far away it is, the thing over whose
       it is, and the act. The kind is said by the words ("Contract ends") —
       no coloured edge, because the month beside it already carries the
       colours. "Mark done" is the verb spelled out. */
    const done=(e.type==='obligation'&&e.obId&&window.toggleObligationById&&(!window.canEdit||canEdit()))
      ? `<button class="ui-btn cal-upn-done" data-ob-done="${_esc(e.obId)}" data-ob-cid="${_esc(e.cid)}" title="${_esc(i18t('cal_mark_complete'))}">${_esc(i18t('cal_mark_done'))}</button>`
      : '';
    const theirs=(e.type==='obligation'&&e.theirs)
      ? `<span class="cal-theirs" title="${_esc(i18t('cal_cp_owes'))}">${_esc(i18t('cal_k_theirs'))}</span>` : '';
    const dt=new Date(e.date+'T00:00:00');
    const day=dt.toLocaleDateString(langLocale(),{day:'numeric',month:'short'});
    const title=e.type==='obligation'?(e.note||ev.label):i18t('cal_lg_'+e.type);
    const sub=e.type==='obligation'
      ? _esc(e.cname+' · '+(e.owner||i18t('cal_unassigned')))
      : _esc(e.cname)+' · '+(window.refHtml?refHtml(e.cref||e.cid):_esc(e.cref||e.cid));
    return `<div class="cal-upn">
      <span class="dt"><b>${_esc(day)}</b><i>${_esc(when)}</i></span>
      <button class="g" data-sel="${_esc(e.cid)}">
        <span class="n2">${_esc(title)}</span>
        <span class="m3">${sub}</span>
      </button>${theirs}${done}
    </div>`;
  }).join('');
  return `<section class="cal-card cal-panel">
    ${''/* ---- THE HEADING IS THE CONTROL (J-5.4) ----
           NOT a title beside a dropdown. A heading reading "Next 14 days"
           twelve pixels from a control set to 14 days is one fact printed
           twice, and the second printing is the one that reads as furniture —
           the standing rule about what may go on a page, and the reason the
           reader's own choice read back to them is never a band. The
           tracked-changes column settled the identical question the same way:
           the control is labelled, it names the live cut, and it prints that
           cut's own count, so a narrowed list states its own narrowing by
           being set to it. */}
    ${''/* ---- REVERSED IN PLACE 21 Sep 2026 (Young: the calendar must look
           exactly like the artifact) ---- the objection above is still true and
           the owner has looked at the drawing and asked for it anyway: the
           reference draws a HEADING and a segment of four numbers. What the
           select cost was a press — open it, find the row, pick it — where a
           segment is one press on the number you want, and a window a reader
           changes four times in a sitting is the wrong place to charge two.
           ONE VALUE STILL ANSWERS EVERYTHING: calAgendaDays() is read by the
           heading, the segment's lit half, the reading and the empty state, so
           the two halves cannot say different numbers. The id cal-days is KEPT
           on the row, so every handler and every test reaches what it reached
           before. */}
    <div class="cal-panel-head">
      <h5>${_esc(i18t('cal_next_30',{n:win}))}</h5>
      <span class="cal-cnt">${up.length}</span>
      <span class="g"></span>
      <span class="cal-seg cal-seg-days" id="cal-days" role="group" aria-label="${_esc(i18t('cal_window_title'))}">${
        CAL_AGENDA_WINDOWS.map(n=>`<button type="button" data-cal-days="${n}" class="${n===win?'on':''}"${
          n===win?' aria-current="true"':''} title="${_esc(i18t('cal_next_30',{n}))}">${n}</button>`).join('')}</span></div>
    ${''/* A CAP IS A FACT, NEVER A SILENT TRIM — and below the cap it says
           nothing, because a caveat that is always there is one nobody reads. */}
    ${up.length>CAL_AGENDA_ROWS?`<div class="cal-panel-cap">${_esc(i18t('cal_showing_of',{shown:CAL_AGENDA_ROWS,total:up.length}))}</div>`:''}
    ${''/* id="cal-agenda" is KEPT from the screen this panel replaces: it is
           still the agenda, and f83's four claims about it — a Done on an
           obligation and not on an expiry, a theirs row marked, no button for a
           viewer, and the Done control outside the row's own button — are all
           still true of it. An anchor moved for no reason is a test rewritten
           for no reason. */}
    <div id="cal-agenda" class="cal-upn-list scroll-thin">${rows||`<div class="cal-empty">${typeof window.emptyStateHtml==='function'
      ? window.emptyStateHtml({ title:i18t('cal_nothing_due',{n:win}), sub:i18t('cal_nothing_due_sub') })
      : `<div class="cal-empty-t">${_esc(i18t('cal_nothing_due',{n:win}))}</div>`
        + `<div class="cal-empty-s">${_esc(i18t('cal_nothing_due_sub'))}</div>`}</div>`}</div>
  </section>`;
}

/* THE CALENDAR'S NUMBER — duties due in the next 60 days. Moved here from the
   menu's counter when the door became Home's Calendar tab (11 Oct 2026), so
   the tab and any other reader count the same way. obligationDue, never a
   ten-character slice of a typed date. */
function calendarDoorCount(){
  return window.allObligations?allObligations().filter(o=>{ const due=window.obligationDue?obligationDue(o):(o.due||'').slice(0,10);
    const d=(due&&window.daysUntil)?daysUntil(due):null; return d!=null&&!isNaN(d)&&d>=0&&d<=60; }).length:0;
}
/* WHERE THE CALENDAR IS DRAWN (owner, 11 Oct 2026, WORKORDER-four-builds
   item 1): Home's Calendar tab (#hb-cal, its Copilot in Home's one panel), or
   its own page where something still opens it (the phone's desk-work door). */
function calOnScreen(){
  if(!window.state) return false;
  if(state.view==='calendar') return true;
  return state.view==='dashboard' && typeof window.hbFace==='function' && hbFace()==='calendar' && !!document.getElementById('hb-cal');
}
function renderCalendar(){
  const onHome=window.state&&state.view==='dashboard'&&typeof window.hbFace==='function'&&hbFace()==='calendar'&&!!document.getElementById('hb-cal');
  const host=onHome?document.getElementById('hb-cal'):document.getElementById('content');
  if(!host) return;
  const {y,m}=calMonth(), view=calView(), p=calPeriod();
  const all=calendarEvents();
  const evs=calVisible(all);
  /* THE LAYERS (10 Oct 2026): contract dates, my calendar (my events and my
     notes' review days), Copilot's plan — each on or off in Month and Week.
     js/mine.js is loaded once; the page repaints when it lands. */
  if(typeof mineLoaded==='function'&&!mineLoaded()&&typeof mineLoad==='function')
    mineLoad().then(()=>{ if(calOnScreen()) renderCalendar(); });
  const lay=calLayers();
  const grid=lay.ct?evs:[];
  const byDay={}; grid.concat(calOwnEvents(p.from,p.to)).forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });

  const seg=(k,label,count)=>`<a class="${view===k?'on':''}" data-cal-view="${k}" role="button" tabindex="0">${_esc(label)}${count!=null?`<span class="c">${count}</span>`:''}</a>`;
  const scopeSeg=(k,label)=>`<span class="${calScope()===k?'on':''}" data-cal-scope="${k}" role="button" tabindex="0">${_esc(label)}</span>`;

  let main='', legendEvs=[];
  if(view==='month'){
    /* ---- THE GRID IS THE WIDTH OF THE PAGE, AND THE KEY READS UNDER IT
       (Young ruled 21 Sep 2026: the calendar must look exactly like the
       artifact) ---- the reference draws the month across the whole page, a
       one-line key beneath it, and Next 14 days as a card of its own below
       that. The agenda was a 304px column beside the grid, which is why the
       month's own cells were the narrowest thing on the page. The key leaves
       the card's own bar with it: a legend inside a card head is furniture
       about the card, and under the grid it is furniture about the month. */
    main=`<div class="cal-month"><section class="cal-card cal-grid">${calMonthGridHtml(y,m,byDay,{id:'cal-grid'})}</section></div>`;
    legendEvs=evs.filter(e=>calInPeriod(e,p));
  } else if(view==='week'){
    main=`<div class="cal-month cal-weekwrap"><section class="cal-card cal-wk-card">${calWeekHtml(grid)}</section></div>`;
    legendEvs=grid.filter(e=>calInPeriod(e,p)).concat(calOwnEvents(p.from,p.to));
  } else {
    main=calHorizonHtml();
  }

  /* ---- ONE CARD: THE CALENDAR AND COPILOT BESIDE IT (Young, 11 Oct 2026:
         "build it exactly as designed" — the HaTi Proposals artifact, Part 3)
         ----
         The calendar and its Copilot are ONE card: on the left a bar with
         ‹ Today ›, the period's name and Month · Week · Horizon; under it (Month
         and Week) the layers on the left, the scope and + New event on the
         right; then the view. On the right, in EVERY view, Copilot. Next 14
         days left the page with it (Young chose "Remove it", 11 Oct 2026): the
         same dates are on the month itself and in Horizon. The page head keeps
         the name and the ⋯ (Export, Share, Print, Open register), ids kept. */
  const title=view==='month'?calMonthName(y,m):view==='week'?calWeekTitle():i18t('cal_hz_bar');
  const navOff=view==='horizon'?' disabled':'';
  /* ON HOME the page head is Home's (the greeting and the tabs), so the
     calendar draws no head of its own and its ⋯ stands at the end of its
     first bar, ids kept */
  const moreHtml=`<div class="cal-acts">
        <button class="ui-btn ws-more-btn cal-more-ic" id="cal-more" aria-haspopup="true" aria-expanded="false" title="${_esc(i18t('ct_more'))}" aria-label="${_esc(i18t('ct_more'))}">${icon('more','w-4 h-4')}</button>
        <div id="cal-more-menu" class="cal-menu" hidden>
          <button id="cal-export" title="${_esc(i18t('cal_export_title'))}">${_esc(i18t('cal_export'))}</button>
          <button id="cal-share" title="${_esc(i18t('cal_share_title'))}">${_esc(i18t('cal_share'))}</button>
          <button data-cal-act="print">${_esc(i18t('cal_print'))}</button>
          <button data-cal-act="register">${_esc(i18t('cal_open_register'))}</button>
        </div>
      </div>`;
  /* ---- THE HEAD AND THE CARD'S BAR, AS ROUND 16 DRAWS THEM (the owner's
     "build all the gaps", 18 Oct 2026) ----
     ONE white head on both homes (Home's own head is not drawn on a computer
     since main's "‹ · HA · the page's name"): the page's name and what it
     shows ("19 October – 27 November · six weeks"), then Month · Week ·
     Horizon, All dates | Mine, + New event and the ⋯ (ids kept). The card's
     bar: ‹ Today ›, what the card holds ("This week, then five more"), and the
     key — Ours · Theirs · Contract date · Mine · Jambo's plan — whose three
     parts are still the layers' switches (calKeyHtml). */
  const cardTitle=view==='week'?calWeekCardTitle():title;
  host.innerHTML=`
  <div class="view-enter cal-page${onHome?' is-home':''}">
    <style>${calStyleCss()}</style>
    <div class="cal-head">
      <span class="cal-head-l"><span class="ttl">${_esc(i18t('nav_calendar'))}</span><span class="cal-head-sub" id="cal-head-sub">${_esc(calHeadFacts())}</span></span>
      <span class="g"></span>
      <span class="cal-head-r">
        <span class="cal-seg cal-seg-view" role="group" aria-label="${_esc(i18t('cal_v_group'))}">${seg('month',i18t('cal_v_month'),null)}${seg('week',i18t('cal_v_week'),null)}${seg('horizon',i18t('cal_v_horizon'),null)}</span>
        ${view==='horizon'?'':`<span class="cal-seg cal-seg-scope">${scopeSeg('all',i18t('cal_all_dates'))}${scopeSeg('mine',i18t('cal_mine'))}</span>
        <button class="ui-btn cal-new-btn" id="cal-new">${typeof icon==='function'?icon('plus','w-3.5 h-3.5'):''}${_esc(i18t('cal_new_event_drawn'))}</button>`}
        ${moreHtml}
      </span>
    </div>
    <div class="cal-body">
      <section class="cal-stage${view==='horizon'?' is-hz':''}${onHome?' is-home':''}" id="cal-stage">
        <div class="cal-main">
          <div class="cal-bar1">
            <span class="cal-nav">
              <button type="button" class="ui-btn ui-btn-sm cal-nb" id="cal-prev"${navOff} title="${_esc(i18t(view==='week'?'cal_prev_week':'cal_prev_month'))}" aria-label="${_esc(i18t(view==='week'?'cal_prev_week':'cal_prev_month'))}">${icon('chevL','w-3.5 h-3.5')}</button>
              <button type="button" class="ui-btn ui-btn-sm" id="cal-today"${navOff}>${_esc(i18t('cal_today'))}</button>
              <button type="button" class="ui-btn ui-btn-sm cal-nb" id="cal-next"${navOff} title="${_esc(i18t(view==='week'?'cal_next_week':'cal_next_month'))}" aria-label="${_esc(i18t(view==='week'?'cal_next_week':'cal_next_month'))}">${icon('chevR','w-3.5 h-3.5')}</button>
            </span>
            <span class="cal-title" id="cal-title">${_esc(cardTitle)}</span>
            ${view==='horizon'?'':calKeyHtml(legendEvs)}
          </div>
          <div class="cal-view${view==='horizon'?' is-wide':''}">${main}</div>
        </div>
        ${onHome?'':calPlanHtml()}
      </section>
    </div>
  </div>`;

  wireCalendar(evs, byDay, p);
  /* on Home its Copilot is Home's one panel, painted (and wired) there */
  if(onHome){ if(typeof window.renderIntelDock==='function') try{ renderIntelDock(); }catch(_){ } else calWireOwn(); }
  else calWireOwn();
  setActiveNav(onHome?'dashboard':'calendar');
}

/* ---------------------------------------------------------------------------
   THE STYLESHEET — one place, written from the render's own numbers.
   Every colour is a token so both themes answer for free.
   ------------------------------------------------------------------------- */
function calStyleCss(){ return `
  .cal-page{height:var(--view-h);box-sizing:border-box;display:flex;flex-direction:column;min-height:0;
    --cal-side-w:clamp(360px,32vw,460px);--cal-day-h:76px}
  ${''/* ---- THE HEAD IS ONE WHITE BAND, AND THE TAB ROW IS PART OF IT ----
         (owner-reported 24 Aug 2026, off a screenshot with the strip between
         the two ringed: "remove the line in the highlighted area")
         The head and the control bar are two elements and each carried its own
         bottom hairline, so a band meant to read as one white card was ruled
         across the middle. The design draws BOTH rows inside one white box with
         a single rule under the tabs, which is what the bar's own hairline
         already is. So the head draws none: no box-shadow here. */}
  /* 16px ON TOP, so this title starts on the same vertical as every other
     page's (owner-asked 25 Aug 2026). It was 9, and this band is the calendar's
     own head rather than the shared one, so it has to be told. The BOTTOM stays
     shallower than the top on purpose — this is a head, not a card, and the
     shared header is 16-top / 0-bottom for the same reason. */
  .cal-head{flex:none;background:var(--color-surface);padding:var(--page-pad-t) var(--s-6) 10px;display:flex;align-items:flex-start;
    gap:var(--s-3);flex-wrap:nowrap;min-width:0}
  .cal-head-l{display:flex;flex-direction:column;min-width:0}
  .cal-head-sub{font-size:var(--t-body);color:var(--color-neutral-600);margin-top:2px;white-space:nowrap;
    overflow:hidden;text-overflow:ellipsis}
  ${''/* THE MONTH IN THE SUB-LINE IS THE STEPPER (21 Sep 2026). It reads as
         part of the sentence it is in — the sub-line's own ink and size, so
         nothing new is announced — and it is a control, so it takes the
         pointer and darkens on hover exactly as it did in the card bar. The
         VERTICAL padding is taken back to zero here and here only: a button
         with its own padding inside a one-line sub-head grows that line, and
         the page head's top is measured (ONE HEADER TOP). Scoped, never
         !important. */}
  .cal-head-sub .cal-sel{align-self:auto;vertical-align:baseline}
  .cal-head-sub .cal-sel button{font-size:inherit;color:inherit;padding:0 4px;line-height:inherit}
  .cal-head-sub .cal-sel .cal-sel-now{font-weight:var(--w-body)}
  .cal-head .cal-acts{align-self:center}
  /* 20/700, the size Home sets and every other page head now carries
     (owner-asked 25 Aug 2026). This band is the calendar's own head rather
     than the shared one, so it has to be told; it read 15/600. */
  /* line-height stated, like every other page title — inherited it was a
     28px box on a 20px face and its glyphs sat 2px below the rest. */
  /* ---- THE TITLE SITS AT THE TOP OF THE ROW, NOT ITS MIDDLE (25 Aug 2026) ----
     This row is align-items:center and carries a 28px control group, so a
     24px title centred in it began 2px below every other page's on identical
     padding. align-self takes the title out of the centring; everything else
     on the row keeps it. See "ONE HEADER TOP" beside #page-head. */
  .cal-head .ttl{font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif);
    line-height:var(--lh-tight);align-self:flex-start;color:var(--color-text);flex:none}
  .cal-head .g{flex:1;min-width:0}
  .cal-stat{font-size:var(--t-body);font-weight:var(--w-title);white-space:nowrap;flex:none}
  .cal-stat.crit{color:var(--st-amber-fg)}
  /* ---- THE HEAD'S SUB-FACTS ARE 13px (the black ink, 24 Aug 2026) ----
     Both sit on the secondary ink at 14px, which this product's four-shades
     rule reserves for 11–13px — primary is 14 and up. The design draws its
     own calendar sub-line at 13px in that same shade, so DROPPING THE SIZE is
     what makes these compliant and the colour never has to move.
     .cal-stat.crit IS DELIBERATELY NOT IN THIS RULE: it is amber, a STATUS
     colour rather than the secondary ink, so it never broke the rule, and at
     14px/700 it is the one thing on this line that is meant to be an alarm. */
  .cal-stat.neu{font-size:var(--t-meta);color:var(--color-neutral-600);font-weight:var(--w-body)}
  .cal-when{font-size:var(--t-meta);color:var(--color-neutral-600);flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-acts{display:flex;align-items:center;gap:var(--s-1);flex:none;position:relative}
  .cal-menu{position:absolute;right:0;top:calc(100% + 4px);z-index:40;min-width:200px;
    background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);
    padding:var(--s-1);display:flex;flex-direction:column}
  .cal-menu[hidden]{display:none}
  .cal-menu button{border:0;background:none;font:inherit;font-size:var(--t-body);text-align:left;padding:var(--s-2) 10px;
    cursor:pointer;color:var(--color-text)}
  .cal-menu button:hover{background:color-mix(in srgb,var(--color-text) 6%,transparent)}
  /* ---- THE CONTROL BAR ---- */
  ${''/* THE VIEW SWITCH MOVED INTO THE ACTS ROW (21 Sep 2026) and wears the
         scope switch's own clothes, so the two segments beside each other are
         one control shape. .cal-bar is STALE — the row is gone; the rules
         below are kept whole because putting the row back is two lines. */}
  .cal-seg-view a{display:inline-flex;align-items:center;gap:6px}
  .cal-bar{flex:none;background:var(--color-surface);padding:0 var(--s-6);height:44px;display:flex;
    align-items:stretch;gap:var(--s-3);box-shadow:inset 0 -1px var(--color-divider);min-width:0}
  .cal-bar .g{flex:1;min-width:0}
  .cal-bar .views{display:flex;align-items:stretch;gap:2px;flex:none}
  .cal-bar .views a{display:flex;align-items:center;gap:7px;padding:0 14px;font-size:var(--t-body);font-weight:var(--w-body);
    color:var(--color-text);cursor:pointer;box-shadow:inset 0 -2px transparent;white-space:nowrap}
  .cal-bar .views a.on{font-weight:var(--w-title);color:var(--accent-ink);box-shadow:inset 0 -2px var(--accent-solid)}
  .cal-bar .views a .c{font-family:var(--font-mono);font-size:var(--t-label);font-weight:var(--w-body);
    font-variant-numeric:tabular-nums;color:var(--color-neutral-500)}
  .cal-bar .views a.on .c{color:var(--accent-ink)}
  ${''/* ---- THE SHADED HALF COVERS ITS WHOLE BUTTON (Young ruled 21 Sep
         2026: "the shared area needs to cover the entire button") ----
         MEASURED: the group stood 28px and its lit half 16.8px, with 5.6px of
         page showing above and below the fill — `align-items:center` sized
         each half to its own line box instead of to the group. THE BOX CLIPS
         AND THE HALVES STRETCH, which is `.doc-read-seg`'s own mechanism and
         the answer the seat switch took on 19 Sep 2026; never a second set of
         heights, which would have to be kept in step with this one for ever. */}
  .cal-seg{display:inline-flex;align-items:stretch;border:1px solid var(--btn-edge);height:var(--ctl-h);
    border-radius:var(--radius);overflow:hidden;flex:none;align-self:center}
  ${''/* The view switch's halves are anchors (the seg builder's own markup,
         so the keyboard door and the handler are unchanged); the scope
         switch's are spans. ONE rule dresses both, or the two segments
         standing beside each other would not match. */}
  .cal-seg span,.cal-seg a,.cal-seg button{display:flex;align-items:center;height:100%;padding:0 var(--pad-ctl-x);font-size:var(--t-body);
    font-weight:var(--w-label);color:var(--color-neutral-600);cursor:pointer;border:0;background:none;font-family:inherit}
  /* accent-700, not the lighter step: white on accent-600 measures 3.74:1 and
     this is 13px. The darker step reads in both workspace accents. */
  .cal-seg span.on,.cal-seg a.on,.cal-seg button.on{background:var(--accent-fill);color:#fff;font-weight:var(--w-title)}
  ${''/* ONE LIGHT GREY EDGE, AND A SEAM BETWEEN THE HALVES IN THE SAME GREY (26 Sep
         2026, the button work order's third item) — the box and the seams read
         --btn-edge like every switch beside it. The child combinator keeps the
         count inside a half from ever being taken for a half. */}
  .cal-seg > :is(span,a,button) + :is(span,a,button){border-left:1px solid var(--btn-edge)}
  .cal-seg a .c{font-size:var(--t-micro);font-variant-numeric:tabular-nums;opacity:.85}
  ${''/* THE LIT HALF'S COUNT WEARS THE LIT HALF'S INK (the owner's list, 27 Sep
         2026): it kept the resting grey on the dark fill — 1.73:1 by day,
         measured by contrast-verify. Scoped by the lit class, never !important. */}
  .cal-seg a.on .c,.cal-seg span.on .c,.cal-seg button.on .c{color:#fff;opacity:1}
  .cal-sel{display:inline-flex;align-items:center;gap:2px;flex:none;align-self:center}
  .cal-sel button{border:0;background:none;font:inherit;font-size:var(--t-body);color:var(--color-text);
    cursor:pointer;padding:0 var(--s-2);line-height:1.2;display:inline-flex;align-items:center;min-height:var(--tap-min);border-radius:var(--radius)}
  .cal-sel button:hover{background:var(--surface-2)}
  .cal-sel button:hover{color:var(--accent-ink)}
  .cal-sel-now{white-space:nowrap;font-variant-numeric:tabular-nums}
  /* ---- THE PAGE MEASURE, SHARED WITH THE BANDS ABOVE ---- */
  .cal-body{flex:1;min-height:0;padding:var(--s-4) var(--s-6) 20px;display:flex;min-width:0;overflow:auto}
  ${''/* ---- THE STACK (21 Sep 2026) ---- the reference's own column: the
         month across the page, the key under it, Next 14 days as a card
         below. The grid keeps a floor rather than a share of the height, so
         a month never squeezes to nothing when the agenda under it is long;
         the body scrolls, which is what makes the card below reachable. */}
  .cal-stack{flex:1;min-width:0;display:flex;flex-direction:column;gap:var(--s-3)}
  .cal-stack > .cal-grid{flex:1 1 auto;min-height:440px}
  ${''/* ---- THE MONTH DOES NOT CHANGE HEIGHT WHEN YOU MOVE AROUND THE PAGE
         (owner-reported 4 Oct 2026: "the height of the calendar changes when
         you navigate around the buttons in the page. This should not happen")
         ---- The panel was flex:none, which means "as tall as what is in it",
         and what is in it is the agenda — four rows on one window, fourteen on
         another. MEASURED before the fix at 1500x1000: the month card was
         480.64px tall with four rows and 440px (its own floor) with nine, the
         day boxes 74.03px then 67.27px, and at ninety days the panel reached
         814.31px and pushed the page past its own height.
         The panel now declares ONE height and the agenda scrolls inside it
         (.cal-upn-list is already the scroller), so the month keeps the same
         height whichever window, whichever month, however many rows. It may
         NOR DOES IT SHRINK. It was flex:0 1 for one run, so that a short
         laptop squeezed the panel rather than the month — and MEASURED on
         1536x734 and 1440x790 that starved it: the card clipped 13px and the
         agenda had 43px of room for a 118px row. A card that hides its own
         words is worse than a page that scrolls, and the body already
         scrolls (.cal-body is overflow:auto), which is what the stacked
         layout below 1024 does for the same reason. */}
  ${''/* ---- RE-RULED 9 Oct 2026 (SAP benchmark, batch 2) ---- the agenda is
         now a column BESIDE the month, one width written once (--cal-side-w),
         as tall as its rows and capped at the month's height; its list
         scrolls inside. The month is sized by the page alone, so the agenda
         can no longer move it — the owner's 4 Oct rule, kept by the layout
         rather than by a fixed agenda height. */}
  ${''/* THE SIDE COLUMN IS AS TALL AS THE MONTH AND NO TALLER: it adds no
         height of its own to the row (contain:size), the row is the month's
         height, and the card inside is as tall as its rows up to that. */}
  .cal-side{flex:0 0 var(--cal-side-w);contain:size;min-height:0;display:flex;flex-direction:column}
  .cal-side > .cal-panel{flex:0 1 auto;min-height:0;max-height:100%}
  .cal-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);
    display:flex;flex-direction:column;min-height:0;min-width:0;overflow:hidden}
  /* ---- THE MONTH ----
     Six 1fr rows inside a flex:1 card: the whole month always fits and the
     CELLS give up height, never the month a week. That is the owner's one
     constraint ("fit the page, no scrolling within it") answered by the layout
     rather than by a clamp and two height media queries kept true by hand. */
  ${''/* ---- THE DESIGN'S OWN GRID (owner-asked 24 Aug 2026: "implement the
         calendar like for like") ----
         THE GAP DRAWS THE RULES. The cells sat on inset shadows, which is one
         rule per cell and four of them meeting at every corner; the design puts
         a 1px gap over a --line ground so the LINE is the background showing
         through, and every rule is exactly one pixel with no doubling. It also
         means an out-of-month cell can carry its own ground without breaking
         the ruling.
         THE WEEKDAY HEADER SITS ON --surf2, the design's own tint, so the row
         of names reads as a header rather than as a seventh week. */}
  ${''/* The card's own toolbar: the stepper at the left, the period's name in
         it, and the key at the right — the design's own row, and the key is
         now beside the colours it explains rather than at the foot of the
         card. */}

  ${''/* ---- THE HORIZON ---- The ruler's gridlines are drawn by the TRACK's own
         background, not by twelve elements per row: one gradient, repeated,
         so a row costs one box however many months it spans. */}
  ${''/* THE TABLE IS THE SCROLLER, which is what makes the ruler's sticky
         really stick: sticky is relative to the nearest SCROLLING ancestor, so
         while the page scrolled instead the header travelled with the rows. */}
  .cal-hz-card{flex:1 1 auto;min-height:0}
  .cal-hz{flex:1 1 auto;min-height:0;overflow:auto}
  .cal-hz-t{font-size:var(--t-body);font-weight:var(--w-title);color:var(--color-text)}
  .cal-hz-h{font-size:var(--t-label);color:var(--color-neutral-600)}
  .cal-hz-col{padding:7px var(--s-3);font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.06em;
    color:var(--color-neutral-500)}
  .cal-hz-ruler{display:grid;grid-template-columns:300px minmax(0,1fr) 150px;position:sticky;top:0;z-index:2;
    background:var(--color-surface);box-shadow:inset 0 -1px var(--color-divider)}
  .cal-hz-months{display:grid;grid-template-columns:repeat(12,minmax(0,1fr))}
  ${''/* THE MONTHS READ AS A RULER, NOT AS TWELVE COLUMN HEADS (21 Sep 2026).
         The reference sets them in the figure face, mixed case, quiet, with no
         box around each one — the gridlines in the track below already say
         where a month begins, and drawing the boundary twice made the head a
         grid of twelve cells. */}
  .cal-hz-months span{padding:7px 6px;font-family:var(--font-mono);font-size:var(--t-micro);
    font-weight:var(--w-body);color:var(--color-neutral-500);
    white-space:nowrap;overflow:hidden}
  .cal-hz-row{display:grid;grid-template-columns:300px minmax(0,1fr) 150px;align-items:center;
    box-shadow:inset 0 -1px var(--rule);cursor:pointer}
  .cal-hz-row:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
  .cal-hz-row:focus-visible{outline:2px solid var(--accent-solid);outline-offset:-2px}
  .cal-hz-lab{padding:7px var(--s-3);min-width:0}
  .cal-hz-lab .n{display:block;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--accent-ink-700);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-hz-lab .m{display:block;font-size:var(--t-label);color:var(--color-neutral-600);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  ${''/* ---- THE NOTE NEVER SITS ON THE BAR (owner-reported 24 Aug 2026: "you
         keep using fonts that are invisible") ----
         It was placed INSIDE the bar whenever the bar was long enough to hold
         it, which put grey text on a saturated teal fill — unreadable, and the
         longer the bar the worse it got. The design's own horizon puts the note
         BELOW the bar, on the white, every time. So the track is taller, the
         bar sits at the top of it and the note has a line of its own beneath:
         one rule, no branch, and no bar length can make it disappear. */}
  .cal-hz-track{position:relative;height:56px;
    background:repeating-linear-gradient(to right,var(--rule) 0 1px,transparent 1px calc(100%/12))}
  ${''/* ---- THE BAR IS A PILL, AND A SQUARE RIGHT END MEANS "IT RUNS PAST
         HERE" (Young reported it 21 Sep 2026: "These bars are not the same.
         They do not have round endings in the end") ----
         The artifact's own bar is 8px tall with a 4px radius, which is half
         its height — a full pill. PIN THE RELATION, NOT THE NUMBER: HaTi's
         bar is 14px, so a literal 4px here would be a shallow corner rather
         than the shape the owner is pointing at. 999px is this product's own
         way of saying "as round as this box can be" (.rounded-full's rule),
         and it follows the bar if the bar is ever retuned.
         THE RIGHT END SQUARES WHERE THE AGREEMENT RUNS BEYOND THE RULER, and
         that is the artifact's rule too (it writes '4px 0 0 4px' on an over-
         run). A pill says "it ends here"; a cut end says "this is where the
         picture stops, not the agreement". The flag is the row builder's own
         beyond flag, which the note beside it already reads — one reading, two
         readers, so the shape and the words cannot disagree. */}
  ${''/* THE BAR IS THE ARTIFACT'S WEIGHT (Young, 21 Sep 2026: "the bars
         should be slightly thinner like in the artifact"). MEASURED: the
         artifact draws 8px and HaTi drew 14. The TOP moves with it so the
         bar's centre line does not — 9 + 14/2 and 12 + 8/2 are both 16, which
         is where the expiry tick and the notice nip are already placed, so
         nothing else on the row had to be re-measured. */}
  ${''/* A FLOOR OF 8px, a dot (the owner's list, 27 Sep 2026): a contract ending
         in a day or two drew a bar too thin to see, the one row that most
         needed seeing. */}
  .cal-hz-bar{position:absolute;left:0;top:12px;height:8px;min-width:8px;opacity:.9;border-radius:999px}
  .cal-hz-bar.is-beyond{border-radius:999px 0 0 999px}
  .cal-hz-end{position:absolute;top:6px;width:2px;height:20px;background:var(--color-text);
    transform:translateX(-1px)}
  .cal-hz-nip{position:absolute;top:-2px;font-style:normal;font-size:var(--t-micro);color:var(--st-amber-fg);
    transform:translateX(-50%);line-height:1}
  .cal-hz-note{position:absolute;top:30px;font-size:var(--t-micro);white-space:nowrap;
    color:var(--color-neutral-700)}
  ${''/* Right-aligned to the bar's end once the end is far enough across that a
         left-aligned note would run off the ruler. Both sit on white. */}
  .cal-hz-note.in{transform:translateX(calc(-100% - 4px))}
  .cal-hz-note.out{transform:translateX(4px)}
  /* ---- THE DECISION COLUMN (21 Sep 2026) ----
     Right-aligned, the artifact's own place for it. An OPEN question carries
     amber and the strong weight because it is the only state on this column
     that is work; a decision already taken is a fact and reads quietly; a row
     with nothing to say reads faintest of the three, which is this product's
     own treatment for an absence. */
  .cal-hz-dec{padding:7px var(--s-3);text-align:right;font-size:var(--t-label);
    color:var(--color-neutral-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cal-hz-dec.is-open{color:var(--st-amber-fg);font-weight:var(--w-strong)}
  .cal-hz-dec.is-none{color:var(--color-neutral-400)}
  .cal-hz-col-dec{text-align:right}
  ${''/* The ladder: five bands under the ruler, each keeping its own tone on a
         top edge rather than as a fill, so five cards do not read as five
         alarms. */}
  ${''/* THE LADDER LEADS, AND IT IS FIVE CARDS RATHER THAN FIVE CELLS OF ONE
         BAND — the reference's own shape, each with its tone on the top edge.
         It sits above the table now, so the rule that used to part it from the
         rows above is gone with the position. */}
  .cal-ladder{flex:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:var(--s-2);
    padding:var(--s-3) var(--s-3) 0;background:none;box-shadow:none}
  .cal-lad{background:var(--color-surface);padding:9px var(--s-3);border:1px solid var(--color-divider);
    border-top-width:3px;border-radius:var(--radius)}
  .cal-lad-k{font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-lad-n{font-size:var(--t-page);font-weight:var(--w-title);line-height:1.2;font-variant-numeric:tabular-nums}
  .cal-lad-v{font-size:var(--t-label);color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .cal-stack.is-wide{gap:0}
  .cal-cardbar{flex:none;display:flex;align-items:center;gap:10px;padding:9px var(--s-3);
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-cardbar .g{flex:1}
  ${''/* box-shadow, NOT just border — the base .cal-legend carries an inset
         top rule from the days when it sat at the card's FOOT and needed a line
         above it. In the toolbar that rule draws a faint grey line over the
         words with nothing above it to separate. Clearing `border` alone left
         it, which is why it survived the move. */}
  .cal-cardbar .cal-legend{margin:0;padding:0;border:0;box-shadow:none;flex:none}
  .cal-dow{flex:none;display:grid;grid-template-columns:repeat(${CAL_WEEK_DAYS},minmax(0,1fr));
    column-gap:var(--s-1);padding:0 var(--s-1);
    background:var(--color-neutral-100);box-shadow:inset 0 -1px var(--color-divider)}
  .cal-dow span{padding:7px var(--s-2);font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.06em;
    color:var(--color-neutral-500);white-space:nowrap;overflow:hidden}
  ${''/* ---- THE DAY BOXES ARE TILES WITH ROUNDED CORNERS (owner-asked 4 Oct
         2026: "the date boxes should have rounded corners like the cards
         across the platform") ---- They were cells: a 1px gap over a grey
         backing drew the ruled grid, so a radius on the cell would have left
         four grey wedges in every corner. BOTH halves go together — the
         backing comes off, the gap becomes a real one, and each day takes the
         ladder card's own clothes (surface, one divider edge, a radius). The
         CARD radius is --radius-lg, the one CLAUDE.md names for a card.
         The day-name band above takes the SAME column gap and side padding,
         or its seven labels no longer stand over their seven columns. */}
  .cal-weeks{flex:1;min-height:0;display:grid;grid-template-columns:repeat(${CAL_WEEK_DAYS},minmax(0,1fr));
    grid-template-rows:repeat(6,minmax(0,1fr));gap:var(--s-1);padding:var(--s-1);background:none}
  .cal-day{background:var(--color-surface);border:1px solid var(--color-divider);
    border-radius:var(--radius-lg);padding:var(--s-1) var(--s-1) 6px;display:flex;
    flex-direction:column;gap:3px;min-width:0;min-height:0;overflow:hidden}
  .cal-day.is-mute{background:var(--color-neutral-100)}
  .cal-day[data-cal-day]{cursor:pointer}
  .cal-day[data-cal-day]:hover{background:color-mix(in srgb,var(--accent-solid) 7%,transparent)}
  .cal-day[data-cal-day]:focus-visible{outline:2px solid var(--accent-solid);outline-offset:-2px}
  ${''/* THE NUMERAL IS A CHIP, so today's filled square is the same shape as
         every other day rather than a box that appears from nowhere. Tabular,
         so 9 and 30 hold one column down the week. */}
  .cal-dn{font-size:var(--t-micro);font-weight:var(--w-title);color:var(--color-text);font-variant-numeric:tabular-nums;
    flex:none;line-height:20px;min-width:20px;height:20px;display:inline-flex;
    align-items:center;justify-content:center;align-self:flex-start;padding:0 var(--s-1)}
  .cal-day.is-mute .cal-dn{color:var(--color-neutral-400)}
  .cal-day.is-today .cal-dn{background:var(--color-accent-800);color:#fff}
  .cal-chips{display:flex;flex-direction:column;gap:2px;min-height:0;overflow:hidden}
  .cal-chip{font-size:var(--t-micro);line-height:1.25;padding:2px var(--s-1);border-left:3px solid;flex:none;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-chip.is-done{opacity:.55;text-decoration:line-through}
  .cal-more{font-size:var(--t-micro);font-weight:var(--w-strong);color:var(--accent-ink-700);flex:none}
  .cal-dots{display:flex;gap:3px;flex-wrap:wrap;flex:none}
  /* ---- THE LEGEND ---- */
  .cal-legend{flex:none;display:flex;gap:18px;flex-wrap:wrap;padding:10px 14px;
    box-shadow:inset 0 1px var(--color-divider)}
  .cal-legend span{display:inline-flex;align-items:center;gap:7px;font-size:var(--t-label);color:var(--color-neutral-600)}
  .cal-legend i{width:10px;height:10px;display:block;flex:none}
  /* ---- NEXT 30 DAYS ---- */
  .cal-panel-head{flex:none;display:flex;align-items:center;gap:var(--s-2);padding:11px 14px;
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-panel-head h5{margin:0;font-family:var(--font-heading);font-size:var(--t-body);font-weight:var(--w-title);color:var(--color-text)}
  .cal-panel-head .g{flex:1}
  /* THE CONTROL WEARS THE HEADING IT REPLACED — the same size, weight and ink
     the h5 carried, so the panel's head did not change shape when it stopped
     being a title. It is the field line rather than the accent at rest: this
     narrows a list and the product's own convention is that an accent border
     means a filter is ON, which at the default fortnight it is not. */
  ${''/* .cal-days IS THE SEGMENT NOW (21 Sep 2026) and keeps its id, so every
         handler and test reaches what it reached before. The rules below are
         the select's and are STALE — kept whole, because they are what goes
         back if the heading ever becomes the control again. */}
  .cal-days:not(.cal-seg){font-family:var(--font-heading);font-size:var(--t-body);font-weight:var(--w-title);
    color:var(--color-text);background:var(--color-surface);border:1px solid var(--field-line);
    border-radius:var(--radius);padding:3px 8px;cursor:pointer;max-width:100%}
  .cal-days:not(.cal-seg):hover{border-color:var(--accent-ink)}
  /* Four numerals and nothing else, so the group is narrow enough to sit in a
     card head beside its own heading. */
  .cal-seg-days{height:var(--ctl-h-sm)}
  .cal-seg-days button{padding:0 var(--pad-ctl-x-sm);font-size:var(--t-meta);font-variant-numeric:tabular-nums}
  /* The cap, stated only while it bites. */
  .cal-panel-cap{flex:none;padding:7px 14px;font-size:var(--t-label);
    color:var(--color-neutral-600);background:var(--nav-well);
    border-bottom:1px solid var(--color-divider)}
  .cal-cnt{font-family:var(--font-mono);font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600);
    font-variant-numeric:tabular-nums}
  .cal-upn-list{flex:1;min-height:0;overflow-y:auto}
  .cal-upn{display:flex;align-items:center;gap:11px;padding:var(--s-2) var(--s-3);
    border-left:3px solid transparent;box-shadow:inset 0 -1px var(--color-divider)}
  .cal-upn:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
  .cal-upn .dt{width:44px;flex:none;display:flex;flex-direction:column;line-height:1.15;
    font-variant-numeric:tabular-nums}
  .cal-upn .dt b{font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-text)}
  ${''/* neutral-500, not 400 (Young 21 Sep 2026: "a lot of faint grey that
         makes reading a bit hard"). The month is half the date — a fact the
         reader is here to read — and the faintest step is for an absence. */}
  .cal-upn .dt i{font-size:var(--t-label);font-style:normal;color:var(--color-neutral-500)}
  .cal-upn .g{flex:1;min-width:0;border:0;background:none;font:inherit;text-align:left;cursor:pointer;
    color:inherit;padding:0}
  .cal-upn .n2{display:block;font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-upn .m3{display:block;font-size:var(--t-label);color:var(--color-neutral-600);margin-top:2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-upn .lft{margin-left:auto;font-size:var(--t-label);font-weight:var(--w-title);white-space:nowrap;flex:none}
  ${''/* "Mark done" is the platform's own button now (.ui-btn), so it wears
         the one light edge, the one height and the one ink every other
         button does — nothing of its own to keep in step. */}
  .cal-upn-done{flex:none}
  .cal-theirs{flex:none;font-size:var(--t-figure);font-weight:var(--w-title);
    padding:1px var(--s-1);background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .cal-panel-foot{flex:none;padding:11px 14px}
  .cal-link{border:0;background:none;font:inherit;font-size:var(--t-body);font-weight:var(--w-label);
    color:var(--accent-ink);cursor:pointer;padding:0 4px;min-height:var(--tap-min);display:inline-flex;align-items:center;gap:4px;border-radius:var(--radius)}
  .cal-link:hover{background:color-mix(in srgb,var(--accent-solid) 10%,transparent)}
  .cal-link > svg{width:var(--btn-ic);height:var(--btn-ic);flex:none}
  .cal-empty{padding:22px 14px;text-align:center}
  .cal-empty-t{font-size:var(--t-body);font-weight:var(--w-strong);color:var(--color-text)}
  .cal-empty-s{font-size:var(--t-label);color:var(--color-neutral-600);margin-top:3px;line-height:1.5}
  ${''/* ---- THE SAP BENCHMARK, BATCH 2 (owner said "go", 9 Oct 2026) ----
         The drawing: one head row on white with a rule under it; the month on
         the grey ground with no card round it, weekday names in sentence
         case; the key under the month; "Next 14 days" a card BESIDE the
         month, as tall as its rows and no taller.
         THE MONTH STILL NEVER CHANGES HEIGHT (owner, 4 Oct 2026): it is
         sized by the page, and the agenda beside it is its own column whose
         list scrolls inside a card capped at the month's height — the
         agenda's length cannot reach the month any more. This REVERSES the
         21 Sep stack (agenda under the month) at the owner's word that the
         drawing is the target. */}
  ${''/* The title keeps ONE HEADER TOP (pages-read-alike 8): the row stays
         top-aligned, and the stepper sits in a box exactly the title's line
         tall, its taller buttons overflowing it evenly, so the stepper is
         centred on the title without pushing it down. */}
  .cal-head{padding-bottom:var(--s-3);box-shadow:inset 0 -1px var(--color-divider)}
  .cal-head-l{flex-direction:row;align-items:flex-start;gap:var(--s-4)}
  .cal-head-sub{margin-top:0;height:calc(20px * var(--lh-tight));display:flex;align-items:center;overflow:visible}
  .cal-seg span.on,.cal-seg a.on,.cal-seg button.on{background:var(--color-accent-50);color:var(--accent-ink);font-weight:var(--w-strong)}
  .cal-seg a.on .c,.cal-seg span.on .c,.cal-seg button.on .c{color:var(--accent-ink)}
  .cal-more-ic{width:var(--ctl-h);min-width:var(--ctl-h);padding:0;justify-content:center}
  .cal-stack:not(.is-wide){flex-direction:row;align-items:stretch;align-self:flex-start;gap:var(--s-4)}
  .cal-month{flex:1 1 auto;min-width:0;align-self:stretch;display:flex;flex-direction:column;gap:var(--s-3)}
  ${''/* THE DRAWING'S DAY BOX (owner, 9 Oct 2026: "they all need to be built
         the SAP way") — a fixed height, so the month is as tall as six weeks of
         it and no taller; it no longer stretches to fill the page. REVERSES the
         22 Aug "the month fills the page" for this page; on a short window the
         page body scrolls (.cal-body is overflow:auto). It still never changes
         height: six rows of one fixed size whatever the agenda holds. */}
  .cal-month > .cal-grid{flex:none;min-height:0;background:none;border:0;border-radius:0;overflow:visible}
  .cal-month{align-self:flex-start}
  .cal-month .cal-weeks{flex:none;grid-template-rows:repeat(6,var(--cal-day-h))}
  .cal-month .cal-dow{background:none;box-shadow:none;padding:0 0 var(--s-1)}
  .cal-month .cal-dow span{text-transform:none;letter-spacing:0;font-size:var(--t-label);font-weight:var(--w-body);color:var(--color-neutral-600);padding-left:var(--s-1);padding-right:var(--s-1)}
  ${''/* the weekday's side padding is small (11 Oct 2026): on Home the month shares the width with Copilot's panel, and at 800px "Mon" was cut by 3px (swedish-verify) */}
  .cal-month .cal-weeks{padding:0}
  .cal-month .cal-legend{box-shadow:none;padding:0 2px;min-height:20px;align-items:center}
  .cal-month .cal-legend span{font-weight:var(--w-label)}
  .cal-month .cal-legend i{width:8px;height:8px;border-radius:50%}
  .cal-side > .cal-panel{border-radius:var(--radius-lg)}
  .cal-panel-head{padding:var(--s-3) var(--s-4)}
  .cal-panel-head .cal-cnt{font-family:inherit;font-size:inherit;font-weight:var(--w-body);color:var(--color-neutral-600)}
  ${''/* the drawing's "Next 14 days (3)": the brackets are dress, so the count's
         own text stays the bare number every reader of it already compares */}
  .cal-panel-head .cal-cnt::before{content:"("}
  .cal-panel-head .cal-cnt::after{content:")"}
  .cal-panel-head h5 + .cal-cnt{margin-left:-4px;font-size:var(--t-body)}
  .cal-upn{gap:var(--s-4);padding:var(--s-3) var(--s-4);border-left:0}
  .cal-upn .dt{width:84px}
  .cal-upn .dt b{font-size:var(--t-meta)}
  .cal-upn .dt i{color:var(--color-neutral-600);margin-top:2px}
  .cal-upn .n2{font-size:var(--t-body);font-weight:var(--w-label)}
  /* ---- NARROW ----
     Below the width where a 360px panel and a readable month can share a row,
     the two stack and the PAGE scrolls — two independently scrolling boxes on
     a phone is a trap, and the fit-the-page rule is about the desk, not about
     a 700px window. */
  @media (max-width:1023px){
    .cal-page{height:auto;min-height:var(--view-h)}
    ${''/* ---- AND THE SCROLLBAR CHANNEL COMES BACK WITH THE SCROLLING ----
           This page is on VIEW_OWNS_HEIGHT, which gives the reserved gutter
           back so the head band reaches the screen's edge — right while the
           page is exactly --view-h tall and cannot scroll. The line ABOVE is
           what makes that untrue down here: stacked, the page grows and really
           does scroll, and a channel that is not reserved means the content
           shifts sideways the moment the bar appears.
           IT IS WRITTEN HERE, in the calendar's own injected sheet, because
           this is the rule that causes it — and the sheet goes with the page,
           so no other view can inherit the exception. */}
    #content-scroll.view-fixed{scrollbar-gutter:stable}
    .cal-body{padding:var(--s-3) var(--s-4) 18px}
    .cal-head{padding-left:var(--s-4);padding-right:var(--s-4)}
    .cal-stack > .cal-grid{min-height:340px}
    .cal-stack:not(.is-wide){flex-direction:column;align-items:stretch}
    ${''/* AND THE PANEL GOES BACK TO ITS CONTENT'S HEIGHT DOWN HERE. The one
           height above is what stops the month resizing on a page that cannot
           scroll; stacked, the page DOES scroll, and a fixed panel would put
           a second scroller inside it — the trap this block's own note names.
           The month is not being resized by it either, because down here the
           page grows instead. */}
    .cal-side{contain:none;flex:none}
    .cal-side > .cal-panel{flex:none;max-height:none}
    .cal-card{min-height:380px}
  }
  /* ---- MY CALENDAR, THE WEEK, COPILOT'S PLAN (10 Oct 2026) ---- the week
         card is the month's height, so switching Month and Week moves
         nothing; its hours scroll inside. */
  .cal-wk-slot:focus-visible,.cal-wk-blk:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:1px}
  .cal-dn[data-cal-week]{cursor:pointer;border-radius:3px}
  .cal-dn[data-cal-week]:hover{background:var(--color-accent-50);color:var(--accent-ink)}
  .cal-chip.cal-own{cursor:pointer}
  .cal-chip.is-plan{border:1px dashed var(--cal-cp);border-left-width:3px}
  .cal-wk-card{height:calc(var(--cal-day-h) * 6 + 28px)}
  .cal-wk{display:flex;flex-direction:column;min-height:0;height:100%}
  .cal-wk-hd,.cal-wk-alls,.cal-wk-grid,.cal-wkm-row{display:grid;grid-template-columns:84px repeat(${CAL_WEEK_DAYS},minmax(0,1fr))}
  .cal-wk-lab.is-this{align-self:end;padding-bottom:8px}
  .cal-wkm{flex:none;border-top:1px solid var(--color-divider)}
  .cal-wkm-row{height:var(--cal-wkm-h,44px);border-bottom:1px solid var(--color-divider)}
  .cal-wkm-row:last-child{border-bottom:0}
  .cal-wkm-lab{display:flex;flex-direction:column;justify-content:flex-start;padding:3px 8px 0;min-width:0}
  .cal-wkm-lab b{font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-text);white-space:nowrap}
  ${''/* A WEEK ACROSS TWO MONTHS BREAKS AT ITS DASH (the detail round, 25 Oct 2026: "30 Nov – 4 Dec" ran 11px
         over "Mon 30" in its 84px column): the label may take a second line, never the next day's cell */}
  .cal-wkm-lab b{white-space:normal;text-wrap:balance;line-height:1.25}
  .cal-wkm-lab span{font-size:var(--t-micro);color:var(--color-neutral-600);white-space:nowrap}
  .cal-wkm-d [hidden]{display:none}
  .cal-wkm-d{border-left:1px solid var(--color-divider);padding:3px 4px;display:flex;flex-direction:column;gap:2px;min-width:0;overflow:hidden;cursor:pointer}
  .cal-wkm-d:hover{background:color-mix(in srgb,var(--accent-solid) 6%,transparent)}
  .cal-wkm-d:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:-2px}
  .cal-wkm-d.is-today .cal-wkm-dn{color:var(--accent-ink);font-weight:var(--w-strong)}
  .cal-wkm-dn{font-size:var(--t-micro);color:var(--color-neutral-600);line-height:1.2}
  .cal-wkm-d .cal-chip{display:block;font-size:var(--t-micro);padding:1px 5px;border-left:3px solid;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
  .cal-wkm-d .cal-more{font-size:var(--t-micro);color:var(--color-neutral-600);line-height:1.1}
  .cal-we{font-weight:var(--w-strong)}
  .cal-wk-hd{border-bottom:1px solid var(--color-divider)}
  .cal-wk-h{padding:6px 8px;font-size:var(--t-label);color:var(--color-neutral-600);border-left:1px solid var(--color-divider)}
  .cal-wk-h b{display:block;font-size:var(--t-h3, 16px);color:var(--color-text);font-weight:var(--w-strong)}
  .cal-wk-h.is-today b{color:var(--accent-ink)}
  .cal-wk-h.is-we{background:var(--surface-2, transparent)}
  .cal-wk-alls{border-bottom:1px solid var(--color-divider);background:var(--surface-2, var(--color-surface))}
  .cal-wk-lab{font-size:var(--t-micro);color:var(--color-neutral-600);padding:6px 6px 0 0;text-align:right}
  .cal-wk-all{border-left:1px solid var(--color-divider);padding:3px;display:flex;flex-direction:column;gap:2px;min-height:30px;min-width:0}
  .cal-view.is-tight .cal-day .cal-chip{padding:1px var(--s-1);line-height:1.15}
  .cal-view.is-tight .cal-day{padding-top:2px;padding-bottom:3px}
  .cal-wk-all .cal-chip{display:block;text-align:left;border:0;border-left:3px solid;font:inherit;font-size:var(--t-micro);padding:1px 5px;border-radius:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer;max-width:100%}
  .cal-wk-body{flex:1;min-height:0;overflow:auto}
  .cal-wk-times{display:flex;flex-direction:column}
  .cal-wk-t{height:var(--cal-wk-row);font-size:var(--t-micro);color:var(--color-neutral-600);text-align:right;padding:0 6px 0 0;border-top:1px solid var(--color-divider);font-variant-numeric:tabular-nums}
  .cal-wk-col{position:relative;border-left:1px solid var(--color-divider);display:flex;flex-direction:column}
  .cal-wk-col.is-today{background:color-mix(in srgb,var(--color-accent-50) 45%,transparent)}
  .cal-wk-slot{height:var(--cal-wk-row);flex:none;border:0;border-top:1px solid var(--color-divider);background:none;cursor:copy;padding:0}
  .cal-wk-slot:hover{background:var(--color-accent-50)}
  .cal-wk-blk{position:absolute;left:3px;right:3px;border:0;border-left:3px solid var(--color-accent-600);border-radius:4px;background:var(--color-accent-50);color:var(--accent-ink);text-align:left;padding:2px 5px;font:inherit;font-size:var(--t-micro);line-height:1.3;overflow:hidden;cursor:pointer;display:flex;flex-direction:column}
  .cal-wk-blk b{font-weight:var(--w-strong);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-wk-blk small{opacity:.85}
  .cal-wk-blk.is-plan{border:1.5px dashed var(--cal-cp);background:var(--cal-cp-bg);color:var(--cal-cp)}
  .cal-plan{height:100%;max-height:100%}
  .cal-plan-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px;padding:var(--s-3) var(--s-4);border-bottom:1px solid var(--color-divider)}
  .cal-plan-lv{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-label);color:var(--color-neutral-600)}
  .cal-plan-lv select{font:inherit;font-size:var(--t-label);height:var(--ctl-h-sm);border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text)}
  .cal-plan-body{flex:1;min-height:0;overflow:auto;padding:var(--s-3) var(--s-4);display:flex;flex-direction:column;gap:8px}
  .cal-plan-say{margin:0;font-size:var(--t-meta);color:var(--color-text)}
  .cal-plan-err{margin:0;font-size:var(--t-meta);color:var(--st-ruby-fg)}
  .cal-plan-busy{margin:0;display:flex;gap:8px;align-items:center;font-size:var(--t-meta);color:var(--color-neutral-600)}
  .cal-plan-cost{margin:0;padding:0 var(--s-4) var(--s-3);font-size:var(--t-label);color:var(--color-neutral-600)}
  .cal-plan-body .cal-plan-cost{padding:0}
  .cal-prop{border:1.5px dashed var(--cal-cp);background:var(--cal-cp-bg);border-radius:var(--radius);padding:7px 9px;display:flex;flex-direction:column;gap:3px;font-size:var(--t-meta)}
  .cal-prop.is-added{border-style:solid;border-color:var(--color-accent-100);background:var(--color-surface)}
  .cal-prop.is-gone{border-color:var(--color-divider);background:none;color:var(--color-neutral-600);flex-direction:row;align-items:center;justify-content:space-between}
  .cal-prop.is-lit{box-shadow:0 0 0 2px var(--cal-cp)}
  .cal-prop small{color:var(--color-neutral-700,var(--color-text))}
  .cal-prop .av{display:flex;gap:6px;margin-top:4px}
  .cal-prop button,.cal-plan-chips button,.cal-plan-ask button{height:var(--ctl-h-sm);padding:0 var(--pad-ctl-x-sm,8px);font:inherit;font-size:var(--t-meta);font-weight:var(--w-label);border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text);cursor:pointer;white-space:nowrap}
  .cal-prop button.p,.cal-plan-ask button{background:var(--accent-fill);border-color:var(--accent-fill);color:#fff}
  .cal-prop button.d{background:var(--st-ruby-bg);border-color:var(--st-ruby-line);color:var(--st-ruby-fg)}
  .cal-prop button.u{background:var(--st-amber-bg);border-color:var(--st-amber-line);color:var(--st-amber-fg)}
  .cal-prop button.is-added{background:var(--color-accent-50);border-color:var(--color-accent-100);color:var(--accent-ink);cursor:default}
  .cal-plan-chips{display:flex;flex-wrap:wrap;gap:6px;padding:var(--s-2) var(--s-4) 0}
  .cal-plan-chips button{background:var(--surface-2, var(--color-neutral-100));border-color:transparent}
  .cal-plan-ask{display:flex;gap:6px;padding:var(--s-2) var(--s-4)}
  .cal-plan-ask input{flex:1;min-width:0;height:var(--ctl-h);font:inherit;font-size:var(--t-meta);padding:0 8px;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text)}
  .cal-plan-ask button{height:var(--ctl-h)}
  .cal-evd{display:flex;flex-direction:column;gap:10px;padding:var(--s-4)}
  .cal-evd h3{margin:0;font-size:var(--t-h3, 16px)}
  .cal-evd label{display:flex;flex-direction:column;gap:4px;font-size:var(--t-label);font-weight:var(--w-label);color:var(--color-neutral-700,var(--color-text))}
  .cal-evd input[type=text],.cal-evd input[type=date],.cal-evd input[type=time],.cal-evd select{height:var(--field-h, 32px);font:inherit;font-size:var(--t-body);font-weight:400;padding:0 8px;border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);color:var(--color-text)}
  .cal-evd-row{display:flex;gap:10px;align-items:flex-end}
  .cal-evd-row[hidden]{display:none}
  .cal-evd-row label{flex:1}
  .cal-evd label.cal-evd-all{flex:none;flex-direction:row;align-items:center;padding-bottom:7px}
  .cal-evd-foot{display:flex;gap:8px;align-items:center}
  .cal-evd-foot .g{flex:1}
  .cal-evd-del{color:var(--st-ruby-fg)}
  .cal-evd-say{margin:0;min-height:1em;font-size:var(--t-label);color:var(--st-ruby-fg)}
  .cal-evd-why,.cal-evd-priv{margin:0;font-size:var(--t-label);color:var(--color-neutral-600)}
  ${''/* ---- ONE CARD, THE CALENDAR AND COPILOT (Young, 11 Oct 2026: "build it
         exactly as designed") ---- the artifact's own measures: the card is the
         page's surface with one hairline and the large radius; the calendar
         takes what is left and Copilot a fixed 340px; two bars across the
         calendar's top, 12/16 and 8/16; under 980px Copilot stacks under it.
         Copilot's colour is the design's violet, dashed while a suggestion and
         solid once added — the page's own tokens, said once here. */}
  .cal-page,.cal-cop{--cal-cp:#6B4FBB;--cal-cp-bg:#F2EEFB}
  ${''/* ON HOME (owner, 11 Oct 2026): the card is the calendar alone — its
         Copilot is Home's panel — and the page fills the tab's cover */}
  .cal-page.is-home{height:100%}
  .cal-stage.is-home{grid-template-columns:minmax(0,1fr)}
  .cal-page.is-home .cal-body{padding-top:var(--s-3)}
  ${''/* THE HEAD IS A CARD, AS EVERY PAGE'S IS (.ph-card; the detail round, 25 Oct 2026: the Calendar's head was a
         flat band edge to edge): set in on the grey as the calendar card under it, level with Jambo's panel */}
  .cal-page.is-home .cal-head{margin:var(--page-pad-t) var(--s-6) 0;padding:12px 16px;border-radius:var(--radius-lg);background:var(--color-surface);box-shadow:var(--shadow-sm)}
  @media (max-width:1023px){ .cal-page.is-home .cal-head{margin-left:var(--s-4);margin-right:var(--s-4)} }
  .cal-bar1 .cal-acts{display:inline-flex;position:relative}
  #ig-dock .cal-cop{border-left:0;flex:1;min-height:0;height:100%;background:var(--color-surface)}
  #ig-dock .cal-cop .cal-plan-head{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--color-divider)}
  #ig-dock .cal-cop .cal-plan-lv{margin-left:auto}
  .cal-page .cal-body{flex-direction:column}
  ${''/* THE CARD IS THE PAGE'S HEIGHT, NOT ITS CONTENT'S: one row of
         minmax(0,1fr), so a long Copilot answer scrolls inside its own panel
         and never makes the month taller (THE MONTH NEVER CHANGES HEIGHT, owner
         4 Oct 2026; calendar-holds-still 1b). */}
  .cal-stage{flex:1 1 0;min-height:560px;display:grid;grid-template-columns:minmax(0,1fr) 340px;grid-template-rows:minmax(0,1fr);border:1px solid var(--color-divider);
    border-radius:var(--radius-lg);background:var(--color-surface);overflow:hidden}
  .cal-main{min-width:0;display:flex;flex-direction:column}
  .cal-bar1{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:12px 16px;border-bottom:1px solid var(--color-divider)}
  .cal-nav{display:inline-flex;gap:4px;flex:none}
  .cal-nav .ui-btn{border-color:transparent}   /* the Legora look (23 Oct 2026): an act is the grey pill, no edge */
  .cal-nav .cal-nb{padding:0 9px}
  .cal-nav .ui-btn:disabled{opacity:.45;cursor:default}
  .cal-title{font-size:17px;font-weight:var(--w-title);margin-right:auto;color:var(--color-text);white-space:nowrap;font-variant-numeric:tabular-nums}
  .cal-view{flex:1;min-height:0;padding:12px 16px 16px;display:flex;flex-direction:column;overflow:auto}
  .cal-view .cal-month{flex:1;min-height:0;align-self:stretch;min-width:0}
  .cal-view .cal-month > .cal-card{flex:1 1 auto;min-width:0}
  .cal-view .cal-grid{border:0;box-shadow:none;background:none;padding:0}
  .cal-view .cal-wk-card{border:0;box-shadow:none;padding:0}
  .cal-day[data-cal-week]{cursor:pointer}
  .cal-day[data-cal-week]:hover{border-color:var(--color-accent-100)}
  .cal-day[data-cal-week]:focus-visible{outline:2px solid var(--color-accent-600);outline-offset:1px}
  .cal-chip[data-cal-ct]{cursor:pointer}
  /* Jambo */
  .cal-cop{border-left:1px solid var(--color-divider);display:flex;flex-direction:column;min-width:0;min-height:0}
  .cal-cop .cal-plan-head{padding:12px 14px}
  .cal-cop .cal-plan-head b{font-size:var(--t-body)}
  /* HIS FACE, NOT A SPARKLE (owner, 15 Oct 2026: "jambos emoji is not there just his name") — the chats wear his face */
  .cal-plan-head b{display:inline-flex;align-items:center;gap:7px}
  .cal-plan-head .cal-plan-face{flex:none;border-radius:50%}
  .cal-cop .cal-plan-lv{font-size:var(--t-meta);color:var(--color-neutral-600)}
  .cal-cop .cal-plan-lv select{border:0;background:none;font-weight:var(--w-label);color:var(--color-text);padding:0 2px;height:auto;cursor:pointer}
  .cal-cop .cal-plan-body{padding:12px 14px;gap:10px}
  .cal-plan-you{align-self:flex-end;max-width:90%;background:var(--color-accent-700);color:#fff;padding:7px 11px;border-radius:var(--radius);font-size:var(--t-meta)}
  .cal-plan-ai{display:flex;flex-direction:column;gap:8px}
  .cal-cop .cal-plan-say{font-size:var(--t-meta);line-height:1.5}
  .cal-plan-intro{color:var(--color-neutral-600)}
  .cal-props{display:flex;flex-direction:column;gap:8px}
  .cal-cop .cal-prop{padding:8px 10px;gap:6px}
  .cal-cop .cal-prop b{color:var(--color-text);font-size:var(--t-body)}
  .cal-cop .cal-prop.is-added{border-style:solid;border-color:var(--cal-cp);background:var(--cal-cp-bg)}
  .cal-cop .cal-prop.is-gone{border:1.5px dashed var(--color-divider);background:none}
  .cal-cop .cal-prop .av{margin-top:0}
  .cal-cop .cal-prop button{height:var(--ctl-h);display:inline-flex;align-items:center;gap:6px;padding:0 12px;font-size:var(--t-meta)}
  .cal-cop .cal-prop button svg{flex:none}
  .cal-cop .cal-prop button.p{background:var(--accent-fill);border-color:transparent;color:#fff}
  .cal-cop .cal-prop button.is-added{opacity:1}
  .cal-plan-read{margin:0;font-size:var(--t-label);color:var(--color-neutral-600);line-height:1.5}
  .cal-cop .cal-plan-pts{margin:4px 0 0;padding:0 0 0 18px;font-size:var(--t-meta);line-height:1.5;color:var(--color-text)}
  .cal-cop .cal-plan-pts li{margin:2px 0;overflow-wrap:anywhere}
  .cal-cop .cal-plan-left .cal-plan-pts{color:var(--color-neutral-600);font-size:var(--t-label)}
  /* ---- ROUND 16 AS DRAWN ("Week by week"; the owner's "build all the
     gaps", 18 Oct 2026): the head carries the views, the scope and + New
     event; the card's bar its key; each chip says whose it is; the six weeks
     close up under the hours; Jambo's panel is "Your week". ---- */
  .cal-head-r{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end;align-self:center}
  .cal-new-btn{display:inline-flex;align-items:center;gap:6px}
  .cal-head-sub:empty{display:none}
  .cal-key{display:inline-flex;align-items:center;gap:4px 16px;flex-wrap:wrap;margin:0 0 0 auto;padding:0;box-shadow:none;min-height:0}
  .cal-key-b{display:inline-flex;align-items:center;gap:14px;border:0;background:none;padding:2px 0;font:inherit;cursor:pointer}
  .cal-key-b span{display:inline-flex;align-items:center;gap:6px;font-size:var(--t-meta);font-weight:var(--w-body);color:var(--color-neutral-700, var(--color-text));white-space:nowrap}
  .cal-key-b[aria-pressed="false"] span{opacity:.5;text-decoration:line-through}
  .cal-key-b:focus-visible{outline:2px solid var(--accent-ink);outline-offset:2px;border-radius:2px}
  .cal-key i{width:10px;height:10px;border-radius:2px;display:block;flex:none}
  .cal-key i.is-ours{background:var(--color-accent-400)}
  .cal-key i.is-theirs{background:var(--st-violet-dot)}
  .cal-key i.is-ct{background:var(--st-amber-dot)}
  .cal-key i.is-mine{background:var(--color-accent-700);border-radius:50%;box-shadow:inset 0 0 0 1px var(--accent-ink)}
  .cal-key i.is-plan{border:1.5px dashed var(--color-accent-600);background:none}
  .cal-chip.is-ck-ours{border-left:3px solid var(--color-accent-400);background:var(--color-accent-50);color:var(--accent-ink)}
  .cal-chip.is-ck-theirs{border-left:3px solid var(--st-violet-dot);background:var(--color-surface);color:var(--st-violet-fg);box-shadow:inset 0 0 0 1px var(--st-violet-line)}
  .cal-chip.is-ck-late{border-left:3px solid var(--st-ruby-dot);background:var(--st-ruby-bg);color:var(--st-ruby-fg)}
  .cal-chip.is-ck-decide{border-left:3px solid var(--st-amber-dot);background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .cal-chip.is-ck-ends{border-left:3px solid var(--st-ruby-dot);background:var(--color-surface);color:var(--st-ruby-fg);box-shadow:inset 0 0 0 1px var(--st-ruby-line)}
  .cal-chip.is-ck-wait{border-left:3px solid var(--st-steel-dot);background:var(--st-steel-bg);color:var(--st-steel-fg)}
  .cal-chip.is-ck-nobody,.cal-chip.is-ck-done{border-left:3px solid var(--st-gray-line);background:var(--st-gray-bg);color:var(--st-gray-fg)}
  .cal-chip.is-plan{border:1px dashed var(--color-accent-600);border-left-width:3px}
  .cal-wk-hd{border-bottom:0}
  .cal-wk-h{display:flex;align-items:baseline;gap:4px;font-size:var(--t-body);color:var(--color-text);font-weight:var(--w-strong)}
  .cal-wk-h b{display:inline;font-size:var(--t-body);font-weight:var(--w-strong)}
  .cal-wk-h.is-today,.cal-wk-h.is-today b{color:var(--accent-ink)}
  .cal-wk-alls{background:none}
  .cal-wk-blk.is-mine{background:var(--color-accent-700);border-left-color:var(--color-accent-700);color:#fff}
  .cal-wk-blk.is-plan{border:1.5px dashed var(--color-accent-600);background:var(--color-surface);color:var(--accent-ink)}
  .cal-wk-slot{position:relative}
  .cal-wk-slot:hover{background:none}
  .cal-wk-slot:hover::after{content:'+ ' attr(data-cal-hint);position:absolute;inset:3px 4px;display:flex;align-items:center;padding:0 8px;border:1px dashed var(--color-accent-300, var(--color-accent-100));
    border-radius:4px;background:var(--color-surface);color:var(--accent-ink);font-size:var(--t-micro);pointer-events:none;white-space:nowrap;overflow:hidden}
  /* THE HOURS STAY WHOLE (21 Oct 2026: at 1536×730 the 16:00 row was squeezed to a sliver): the week's
     own hours never shrink; the five weeks after give way — their rows down to 38px, then scrolling
     inside their own band on a shorter screen still */
  .cal-wk-body{flex:none}
  .cal-wkm{flex:1 1 auto;min-height:0;overflow-y:auto;display:flex;flex-direction:column}
  .cal-wkm-row{flex:1 0 auto;height:auto;min-height:38px}
  .cal-cop .cal-plan-head.jl-head{padding:6px 10px 6px 8px;flex-wrap:nowrap;justify-content:flex-start}
  .cal-plan-tab{cursor:default}
  .cal-cop .cal-plan-body{padding:0;gap:0}
  .cal-cop .cal-yw{padding:14px 14px 6px}
  .cal-cop .cal-plan-talk{display:flex;flex-direction:column;gap:10px;padding:8px 14px 14px}
  .cal-cop .jl-foot{margin-top:auto}
  @media (max-width:980px){
    .cal-stage{grid-template-columns:minmax(0,1fr);grid-template-rows:auto;flex:none}
    .cal-cop{max-height:640px}
    .cal-cop{border-left:0;border-top:1px solid var(--color-divider)}
  }
  @media print{
    .cal-head .cal-acts,.cal-panel{display:none!important}
    .cal-page{height:auto}
    .cal-card{border-color:#bbb}
  }
`; }

/* window.regDotDate, NEVER a bare regDotDate. The register is another module,
   and a bare read of a name that module has not published throws a
   ReferenceError rather than falling through — `x ? x() : y` still evaluates
   x. It costs nothing here and it is what lets this screen render on a stage
   that never loaded the register. (The dotted date itself is borrowed on
   purpose: the register prints dates that way and two screens inventing two
   date formats is how a reader stops trusting either.) */

/* ---------------------------------------------------------------------------
   WIRING
   ------------------------------------------------------------------------- */
function calStep(n){
  if(calView()==='week'){ calState.wk=_isoLocal(calAddDays(calWeekStart(),7*n)); renderCalendar(); return; }
  let {y,m}=calMonth();
  m+=n*(calView()==='month'?1:3);
  while(m<0){ m+=12; y--; } while(m>11){ m-=12; y++; }
  calState.ym={y,m}; renderCalendar();
}
function calSetView(v){ if(!CAL_VIEWS.includes(v)||v===calView()) return; calState.view=v; renderCalendar(); }
function calSetScope(s){ const v=s==='mine'?'mine':'all'; if(v===calScope()) return; calState.scope=v; renderCalendar(); }

/* ---- THE SIX WEEKS FIT THE WINDOW (owner picked it, 13 Oct 2026, after the
   laptop report: "the key sits on the last week") ----
   The month draws six rows of one fixed height; on a laptop's shorter page six
   rows of 76 did not fit the room under the bars, the month's box shrank and
   the key landed on the last week. The day box's height is now measured from
   the room the window leaves (CAL_DAY_MIN–CAL_DAY_MAX) and every row keeps it:
   still one size for all six, still never stretched by its contents, and the
   key lives in the filter row. Reverses, for the height only, the 9 Oct "a
   fixed height … on a short window the page body scrolls". */
const CAL_DAY_MIN = 52, CAL_DAY_MAX = 76;
function calFitDays(){
  const view=document.querySelector('.cal-view'); if(!view||view.classList.contains('is-wide')) return;
  const cs=getComputedStyle(view), pad=(parseFloat(cs.paddingTop)||0)+(parseFloat(cs.paddingBottom)||0);
  const weeks=view.querySelector('.cal-weeks'), dow=view.querySelector('.cal-dow'), wk=view.querySelector('.cal-wk-card');
  const gap=weeks?(parseFloat(getComputedStyle(weeks).rowGap)||0):0, head=wk?28:((dow&&dow.offsetHeight)||0);
  const room=view.clientHeight-pad-head-(weeks?5*gap:0)-2;
  if(!(room>0)) return;
  const h=Math.max(CAL_DAY_MIN,Math.min(CAL_DAY_MAX,Math.floor(room/6)));
  view.style.setProperty('--cal-day-h',h+'px');
  view.classList.toggle('is-tight',h<70);
}
let _calFitBound=false;
function wireCalendar(evs, byDay, p){
  calFitDays();
  if(!_calFitBound&&typeof window!=='undefined'&&typeof window.addEventListener==='function'){ _calFitBound=true; window.addEventListener('resize',()=>{ try{ if(typeof calOnScreen==='function'?calOnScreen():true) calFitDays(); }catch(_){ } }); }
  const $=id=>document.getElementById(id);
  $('cal-prev')?.addEventListener('click',()=>calStep(-1));
  $('cal-next')?.addEventListener('click',()=>calStep(1));
  $('cal-today')?.addEventListener('click',()=>{ calState.ym=null; calState.wk=null; renderCalendar(); });
  const press=(el,fn)=>{ el.addEventListener('click',fn);
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fn(); } }); };
  document.querySelectorAll('[data-cal-view]').forEach(el=>press(el,()=>calSetView(el.getAttribute('data-cal-view'))));
  document.querySelectorAll('[data-cal-scope]').forEach(el=>press(el,()=>calSetScope(el.getAttribute('data-cal-scope'))));
  /* A REAL BUTTON, so it answers a press and a key by itself — press() above
     is for the spans the two segments beside it are made of. */
  document.querySelectorAll('[data-cal-days]').forEach(el=>el.addEventListener('click',
    ()=>calSetAgendaDays(el.getAttribute('data-cal-days'))));

  /* [data-sel] is the LIST's and the PANEL's row — never a day cell's chip.
     The chips are spans and fall through to the cell, which is why there is no
     stopPropagation here to keep in step. */
  document.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>{
    if(b.hasAttribute('data-cal-act')) return;   // its own act, in the one listener (calChipGo)
    selectContract(b.getAttribute('data-sel')); }));

  /* Completing goes through the shared verb in js/obligations.js, which writes
     the audit line and refreshes every surface that counts them — including
     this one. A second copy of that logic here is how two screens come to
     disagree about the same tick-box. */
  document.querySelectorAll('[data-ob-done]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const o=toggleObligationById(b.getAttribute('data-ob-cid'), b.getAttribute('data-ob-done'), { from:'calendar' });
    if(o) toast(i18t('cal_marked_complete',{what:o.desc}),'ok');
  }));

  /* ---- EXPORT: THE PERIOD ON SCREEN, AND IT SAYS SO ----
     Exactly what the grid is drawing — same period, same scope — because a
     file that quietly carries more or less than the screen is a file nobody
     can check. */
  $('cal-export')?.addEventListener('click',()=>{
    const rows=evs.filter(e=>calInPeriod(e,p));
    if(!rows.length) return toast(i18t('cal_none_in_period'),'warn');
    downloadFile(`hati-calendar-${p.from}-${p.to}.ics`, calIcsFor(rows), 'text/calendar');
    toast(i18tn('cal_exported',rows.length,{n:rows.length}),'ok');
  });
  $('cal-share')?.addEventListener('click',()=>openCalendarShare(evs));

  /* The More menu is a MENU and must never become a <select>: Print and Open
     the register are ACTS, and a select would sit there afterwards wearing the
     last act as though it were a setting. Its outside-press listener is armed
     on this render's own button, which is rebuilt on every paint. */
  const mb=$('cal-more'), mm=$('cal-more-menu');
  if(mb&&mm){
    const shut=()=>{ mm.hidden=true; mb.setAttribute('aria-expanded','false'); };
    mb.addEventListener('click',e=>{ e.stopPropagation();
      mm.hidden=!mm.hidden; mb.setAttribute('aria-expanded', mm.hidden?'false':'true'); });
    /* ARMED ONCE, and the menu resolved AT PRESS TIME. These were bound per
       render — this page repaints on every month step, every view switch and
       every scope change — so the pair stacked all sitting, and each stale
       copy went on holding a menu node that had been thrown away. The same
       lesson the negotiation page's proxy listener already carries. */
    if(!document._calMoreWired){
      document._calMoreWired=true;
      const liveShut=()=>{
        const menu=document.getElementById('cal-more-menu');
        const btn=document.getElementById('cal-more');
        if(menu){ menu.hidden=true; if(btn) btn.setAttribute('aria-expanded','false'); }
      };
      document.addEventListener('click',e=>{
        const menu=document.getElementById('cal-more-menu');
        const btn=document.getElementById('cal-more');
        if(menu&&!menu.hidden&&!menu.contains(e.target)&&e.target!==btn) liveShut();
      });
      document.addEventListener('keydown',e=>{ if(e.key==='Escape') liveShut(); });
    }
    mm.querySelectorAll('#cal-export,#cal-share').forEach(b=>b.addEventListener('click',shut));
    mm.querySelectorAll('[data-cal-act]').forEach(b=>b.addEventListener('click',()=>{
      shut();
      const a=b.getAttribute('data-cal-act');
      if(a==='print') window.print();
      else if(a==='register') setView('register');
    }));
  }
}

/* ---- SHARE: A COLLEAGUE, BY NAME, AND ONLY EVER TO THEIR OWN ADDRESS ----
   The list of dates is built HERE, by the same builder the panel draws from,
   and posted as text. That is deliberate: the server already computes renewal
   dates for its reminder sweeps, and a second copy of that arithmetic behind
   this button is the recorded defect class in this codebase. What the ROUTE
   owns is the thing that must never be the browser's to decide — WHO is
   written to. It takes a member id and looks the address up itself; a
   body-supplied address is refused outright (the open-relay rule the
   review-request route already states). */
function openCalendarShare(evs){
  const lines=calSummaryLines(evs);
  const me=window.currentUser?currentUser():null;
  const people=(window.getUsers?getUsers():[]).filter(u=>u&&u.email&&(!me||String(u.id)!==String(me.id)));
  if(!people.length) return toast(i18t('cal_share_nobody'),'warn');
  if(!lines.length) return toast(i18t('cal_share_nothing'),'warn');
  openModal(`
    <div class="rvd-head"><div class="rvd-ico">${icon('share','w-4 h-4')}</div>
      <div><div class="rvd-title">${_esc(i18t('cal_share_title_h'))}</div>
      <div class="rvd-sub">${_esc(i18tn('cal_share_sub',lines.length,{n:lines.length}))}</div></div></div>
    <div class="rvd-body">
      <label class="rvd-opt" style="display:block">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600);margin-bottom:5px">${_esc(i18t('cal_share_who'))}</span>
        <select id="cal-share-who" style="width:100%;border:1px solid var(--color-divider);border-radius:var(--radius);font:inherit;background:var(--color-surface);color:var(--color-text);height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)">
          ${people.map(u=>`<option value="${_esc(u.id)}">${_esc(u.name)} — ${_esc(u.email)}</option>`).join('')}
        </select>
      </label>
      <label style="display:block;margin-top:var(--s-3)">
        <span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);color:var(--color-neutral-600);margin-bottom:5px">${_esc(i18t('cal_share_note'))}</span>
        <textarea id="cal-share-note" rows="3" style="width:100%;padding:var(--s-2) 10px;border:1px solid var(--color-divider);border-radius:var(--radius);font:inherit;font-size:var(--t-body);resize:vertical;background:var(--color-surface);color:var(--color-text)"></textarea>
      </label>
      <div class="rvd-note" style="margin-top:10px">${_esc(i18t('cal_share_privacy'))}</div>
      <div id="cal-share-err" class="rvd-note" hidden style="color:var(--danger-hover);margin-top:var(--s-2)"></div>
    </div>
    <div class="rvd-foot">
      <button data-dlg-cancel class="ui-btn" data-close>${_esc(i18t('act_cancel'))}</button>
      <button class="ui-btn ui-btn-primary" id="cal-share-go">${_esc(i18t('cal_share_send'))}</button>
    </div>`, { maxWidth:'520px' });
  document.querySelectorAll('#modal-root [data-close]').forEach(b=>b.addEventListener('click',closeModal));
  document.getElementById('cal-share-go')?.addEventListener('click',async ()=>{
    const btn=document.getElementById('cal-share-go');
    const err=document.getElementById('cal-share-err');
    const toId=document.getElementById('cal-share-who').value;
    const note=String(document.getElementById('cal-share-note').value||'').slice(0,1000);
    btn.disabled=true; (window.busySet?busySet(btn,i18t('cal_share_sending')):(btn.textContent=i18t('cal_share_sending')));
    try{
      const r=await api('calendar/share','POST',{toId,note,lines});   // api(path, method, body) — it stringifies
      closeModal();
      /* "SENT" HAS TO MEAN SENT. The route answers with the same three-way
         shape every other mail in this product uses — it went, it queued in
         the outbox because there is no provider, or the provider refused and
         said why — and each is a different thing for the reader to do. */
      if(r&&r.emailSent) toast(i18t('cal_share_sent',{who:(r.to||'')}),'ok');
      else if(r&&r.outbox) toast(i18t('cal_share_outbox'),'warn');
      else toast(i18t('cal_share_failed',{why:(r&&r.emailError)||''}),'err');
    }catch(e){
      btn.disabled=false; btn.textContent=i18t('cal_share_send');
      if(err){ err.hidden=false; err.textContent=(e&&e.message)||i18t('cal_share_failed',{why:''}); }
    }
  });
}

/* ============================================================================
   MY CALENDAR, THE WEEK AND COPILOT'S PLAN (Young, 10 Oct 2026, the "HaTi
   Proposals" artifact, Part 3)
   ----------------------------------------------------------------------------
   The person's own events and their notes' review days live in js/mine.js,
   private to them. Contract dates stay read-only and come off the contracts;
   pressing one still opens its contract. Copilot reads both layers and
   PROPOSES blocks (POST /api/ai/plan); at "Ask me first" — the start — a block
   lands only on Add, at "Just do it" it is added at once, and every one can
   be undone. Nothing is sent to anybody.
   ========================================================================== */
function calLayers(){ const l=calState.lay||{}; return { ct:l.ct!==false, me:l.me!==false, cp:l.cp!==false }; }
const calAddDays=(d,n)=>{ const x=new Date(d); x.setDate(x.getDate()+n); return x; };
function calWeekStart(){
  const base=calState.wk?new Date(calState.wk+'T00:00:00'):new Date(calToday()+'T00:00:00');
  /* a Saturday or a Sunday opens the WORKING week ahead — the week drawn is
     Monday to Friday, so the one just finished would show none of that day */
  if(base.getDay()===6||base.getDay()===0) return calAddDays(base,base.getDay()===6?2:1);
  return calAddDays(base,-((base.getDay()+6)%7));
}
/* THE SIX WEEKS' NAME, "19 Oct – 27 Nov 2026" — the bar's title since the
   week view became this week by the hour and five more (round 16). */
const CAL_WEEK_DAYS = 5;
const CAL_WEEKS_SHOWN = 6;
function calWeekTitle(){
  const a=calWeekStart(), z=calAddDays(a,7*(CAL_WEEKS_SHOWN-1)+CAL_WEEK_DAYS-1);
  const f=(d,o)=>d.toLocaleDateString(langLocale(),o);
  return a.getMonth()===z.getMonth()?`${a.getDate()}–${f(z,{day:'numeric',month:'short',year:'numeric'})}`
    :`${f(a,{day:'numeric',month:'short'})} – ${f(z,{day:'numeric',month:'short',year:'numeric'})}`;
}
/* THE HEAD'S FACT (round 16 as drawn): the six weeks the Week view holds,
   "19 October – 27 November · six weeks"; the Month and Horizon name their
   period once, in the card's own bar. */
function calHeadFacts(){
  if(calView()!=='week') return '';
  const a=calWeekStart(), z=calAddDays(a,7*(CAL_WEEKS_SHOWN-1)+CAL_WEEK_DAYS-1);
  const yr=new Date().getFullYear();
  const f=d=>d.toLocaleDateString(langLocale(),Object.assign({day:'numeric',month:'long'},d.getFullYear()!==yr?{year:'numeric'}:{}));
  return i18t('cal_head_six',{range:`${f(a)} – ${f(z)}`});
}
/* the card's title in Week: "This week, then five more", or the week it
   starts from when the reader has stepped away from this one */
/* the Monday "this week" names: today's, or the next one on a weekend (the
   week drawn is Monday to Friday, as calWeekStart opens it) */
function calThisMonday(){
  const t=new Date(calToday()+'T00:00:00');
  return (t.getDay()===6||t.getDay()===0)?calAddDays(t,t.getDay()===6?2:1):calAddDays(t,-((t.getDay()+6)%7));
}
function calWeekCardTitle(){
  const a=calWeekStart();
  if(_isoLocal(a)===_isoLocal(calThisMonday())) return i18t('cal_wk_card_this');
  return i18t('cal_wk_card_from',{day:a.toLocaleDateString(langLocale(),{day:'numeric',month:'long'})});
}
/* THE KEY, AS DRAWN — Ours · Theirs · Contract date · Mine · Jambo's plan —
   and still the three layers' switches: the contract dates (ours, theirs and
   the contract's own dates), my calendar, Jambo's plan. A switched-off part
   is struck through, as the layer buttons were. */
function calKeyHtml(){
  const l=calLayers();
  const it=(k,w)=>`<span><i class="is-${k}"></i>${_esc(i18t(w))}</span>`;
  const b=(lay,inner)=>`<button type="button" class="cal-key-b" data-cal-lay="${lay}" aria-pressed="${l[lay]?'true':'false'}" title="${_esc(i18t('cal_key_title'))}">${inner}</button>`;
  return `<span class="cal-legend cal-key" role="group" aria-label="${_esc(i18t('cal_lay_group'))}">${
    b('ct',it('ours','cal_key_ours')+it('theirs','cal_key_theirs')+it('ct','cal_key_ct'))}${b('me',it('mine','cal_key_mine'))}${b('cp',it('plan','cal_key_plan'))}</span>`;
}
/* THE PERSON'S OWN DATES between two days, as the grid's events. */
function calOwnEvents(from,to){
  const l=calLayers(), out=[];
  const inP=d=>d&&d>=from&&d<=to;
  if(l.me&&typeof mineList==='function'){
    mineList('event').filter(e=>inP(e.date)).forEach(e=>out.push({ date:e.date, type:'mine', id:e.id, title:e.title, start:e.start, end:e.end,
      chip:(e.start?e.start+' ':'')+e.title, own:`data-cal-mine="${_esc(e.id)}"` }));
    mineList('note').filter(n=>inP(n.reviewBy)&&!n.reviewedAt).forEach(n=>out.push({ date:n.reviewBy, type:'note', id:n.id,
      title:i18t('cal_note_review',{t:n.title}), chip:i18t('cal_note_review',{t:n.title}), own:`data-cal-note="${_esc(n.id)}"` }));
  }
  if(l.cp) _calPlan.blocks.filter(b=>b.st==='proposed'&&inP(b.date)).forEach(b=>out.push({ date:b.date, type:'plan', id:b.k,
    title:b.title, start:b.start, end:b.end, chip:'✦ '+b.start+' '+b.title, own:`data-cal-plan-go="${_esc(b.k)}"` }));
  return out.sort((a,b)=>String(a.start||'').localeCompare(String(b.start||'')));
}
const calMins=hm=>{ const [h,m]=String(hm||'0:0').split(':').map(Number); return h*60+(m||0); };
/* THE WEEK: Monday to Friday (the design's working week, 11 Oct 2026), the
   person's hours down the side, an "All day" row for contract dates and notes
   to review. An empty hour is a door to a new event at that hour. */
function calWeekHtml(contractEvs){
  const a=calWeekStart(), days=Array.from({length:CAL_WEEK_DAYS},(_,i)=>calAddDays(a,i));
  const pref=typeof minePref==='function'?minePref():{dayStart:8,dayEnd:17};
  const today=calToday(), from=_isoLocal(days[0]), to=_isoLocal(days[days.length-1]);
  const own=calOwnEvents(from,to);
  /* THE PERSON'S OWN HOURS DOWN THE SIDE, as drawn ("09" … "16" for a day of
     nine to five): no empty hours before or after on a tall window; an event
     of their own outside them widens the day to hold it */
  const timed=own.filter(e=>e.start);
  const ds=Math.max(0,Math.min(23,Number(pref.dayStart)||8)), de=Math.max(ds+1,Math.min(24,Number(pref.dayEnd)||17));
  const H0=Math.min(ds,...timed.map(e=>Math.floor(calMins(e.start)/60))), H1=Math.min(24,Math.max(de,...timed.map(e=>Math.ceil(calMins(e.end||e.start)/60)))), ROW=28;
  const head=days.map(d=>{ const iso=_isoLocal(d);
    return `<div class="cal-wk-h${iso===today?' is-today':''}${d.getDay()%6===0?' is-we':''}"><span>${_esc(d.toLocaleDateString(langLocale(),{weekday:'short'}))}</span><b>${d.getDate()}</b></div>`; }).join('');
  /* a Saturday's or a Sunday's contract dates stand on the Friday before,
     each saying its own day (Monday to Friday everywhere, round 16) */
  /* LATE WORK STANDS ON TODAY (round 16 as drawn: "Late: Brightwater
     invoice" on Monday): a promise past its day and not done is carried onto
     today's cell of this week (on a weekend, this week's Monday), as well as
     its own day */
  const lateOn=(today>=from&&today<=to)?today:(from===_isoLocal(calThisMonday())?from:'');
  const onDay=iso=>{ const d=new Date(iso+'T00:00:00');
    const we=d.getDay()===5?[1,2].map(k=>_isoLocal(calAddDays(d,k))):[];
    const late=iso===lateOn?(contractEvs||[]).filter(e=>e.type==='obligation'&&!e.done&&!e.waiting&&e.date<today&&!(e.date>=from&&e.date<=to)):[];
    return late.concat((contractEvs||[]).filter(e=>e.date===iso)).concat((contractEvs||[]).filter(e=>we.includes(e.date)).map(e=>Object.assign({},e,{ _we:calWeekendWord(e.date) }))); };
  const allDay=days.map(d=>{ const iso=_isoLocal(d);
    const c=onDay(iso).map(e=>{ const ev=CAL_EVENT[e.type];
      const looked=calCtChipHtml(e,'button','cal-wk-ct'); if(looked) return looked;
      /* the reference wears its one dress, as the month's chip does */
      const t=_esc(e._we?e._we+' · ':'')+(e.type==='obligation'?_esc(calChipText(e)):_esc(ev.short)+' · '+(window.refHtml?refHtml(e.cref||e.cid):_esc(e.cref||e.cid)));
      return `<button type="button" class="cal-chip cal-wk-ct" data-sel="${_esc(e.cid)}" title="${_esc((e._we?e._we+' · ':'')+ev.label+': '+(e.note||e.cname))}" style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${t}</button>`; });
    const o=own.filter(e=>e.date===iso&&!e.start).map(e=>{ const ev=CAL_EVENT[e.type];
      return `<button type="button" class="cal-chip cal-own is-${e.type}" ${e.own} title="${_esc(e.title)}" style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${_esc(e.chip)}</button>`; });
    return `<div class="cal-wk-all">${c.concat(o).join('')}</div>`; }).join('');
  const hours=Array.from({length:H1-H0},(_,i)=>`<div class="cal-wk-t">${String(H0+i).padStart(2,'0')}</div>`).join('');
  const cols=days.map(d=>{ const iso=_isoLocal(d);
    const slots=Array.from({length:H1-H0},(_,i)=>`<button type="button" tabindex="-1" class="cal-wk-slot" data-cal-slot="${iso}|${String(H0+i).padStart(2,'0')}:00" data-cal-hint="${_esc(i18t('cal_add_own'))}" aria-label="${_esc(i18t('cal_new_at',{day:d.toLocaleDateString(langLocale(),{weekday:'long',day:'numeric',month:'long'}),h:String(H0+i).padStart(2,'0')+':00'}))}"></button>`).join('');
    const blocks=own.filter(e=>e.date===iso&&e.start).map(e=>{
      const top=Math.max(0,(calMins(e.start)-H0*60)/60*ROW), h=Math.max(18,(calMins(e.end)-calMins(e.start))/60*ROW-2);
      return `<button type="button" class="cal-wk-blk is-${e.type}" ${e.own} style="top:${top}px;height:${h}px" title="${_esc(e.title+' · '+e.start+'–'+e.end)}">${h<34?`<b>${_esc((e.type==='plan'?'✦ ':'')+e.title)} · ${_esc(e.start)}</b>`
        :`<b>${_esc(e.type==='plan'?'✦ '+e.title:e.title)}</b><small>${_esc(e.start+'–'+e.end)}${e.type==='plan'?' · '+_esc(i18t('cal_plan_suggested')):''}</small>`}</button>`; }).join('');
    return `<div class="cal-wk-col${iso===today?' is-today':''}" style="height:${(H1-H0)*ROW}px">${slots}${blocks}</div>`; }).join('');
  return `<div class="cal-wk" id="cal-week" style="--cal-wk-row:${ROW}px">
    <div class="cal-wk-hd"><div class="cal-wk-lab is-this">${_esc(i18t('cal_wk_this'))}</div>${head}</div>
    <div class="cal-wk-alls"><div class="cal-wk-lab"><span class="sr-only">${_esc(i18t('cal_all_day'))}</span></div>${allDay}</div>
    <div class="cal-wk-body scroll-thin" id="cal-wk-body"><div class="cal-wk-grid"><div class="cal-wk-times">${hours}</div>${cols}</div></div>
    ${calMoreWeeksHtml(a,onDay)}
  </div>`;
}
/* ---- THE FIVE WEEKS AFTER IT, ONE ROW EACH (round 16, "Week by week",
   owner picked it 17 Oct 2026) ----
   Each row is a working week: its dates and how many contract dates it holds
   on the left, then Monday to Friday with what falls on each (a weekend's on
   the Friday, saying its day). A day shows its first date and "+N more"; the
   whole day box is that week's door — pressed, the week comes up by the hour.
   The person's own events ride along as on the month. */
function calMoreWeeksHtml(a,onDay){
  const rows=[];
  for(let w=1;w<CAL_WEEKS_SHOWN;w++){
    const mon=calAddDays(a,7*w), fri=calAddDays(mon,CAL_WEEK_DAYS-1);
    const own=calOwnEvents(_isoLocal(mon),_isoLocal(calAddDays(mon,6)));
    let n=0, owed=0;
    const cells=Array.from({length:CAL_WEEK_DAYS},(_,i)=>{
      const d=calAddDays(mon,i), iso=_isoLocal(d);
      const ct=onDay(iso); n+=ct.filter(e=>!e.waiting).length;
      /* "3 due" where every date is work owed (a promise or a decision), else
         "3 dates" (round 16 as drawn); a step still waiting on an earlier one
         is drawn, never counted (the Obligations page lists it apart) */
      owed+=ct.filter(e=>!e.waiting&&(e.type==='obligation'||e.type==='renewal')).length;
      const mine=own.filter(e=>e.date===iso||(i===CAL_WEEK_DAYS-1&&[1,2].some(k=>_isoLocal(calAddDays(d,k))===e.date)));
      const list=ct.concat(mine);
      /* EVERY DATE IS DRAWN; the row shows as many as its height holds and
         says the rest ("+1 more"), measured after the paint (calWkmFit) */
      const chips=list.map(e=>{
      const looked=e&&!e.own?calCtChipHtml(e.date!==iso&&!e._we?Object.assign({},e,{ _we:calWeekendWord(e.date) }):e,'span'):'';
      const chip=looked||(e?(()=>{ const ev=CAL_EVENT[e.type];
        const we=e._we||(e.date!==iso?calWeekendWord(e.date):'');
        const t=(we?we+' · ':'')+(e.own?e.chip:e.type==='obligation'?calChipText(e):ev.short+' · '+(e.cref||e.cid)+(e.cname?' '+e.cname:''));
        /* the reference wears its one dress, as the month's chip does */
        const th=e.own||e.type==='obligation'?_esc(t)
          :_esc(we?we+' · ':'')+_esc(ev.short)+' · '+(window.refHtml?refHtml(e.cref||e.cid):_esc(e.cref||e.cid))+(e.cname?' '+_esc(e.cname):'');
        return e.own
          ? `<span class="cal-chip cal-own is-${e.type}" ${e.own} title="${_esc(t)}" style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${th}</span>`
          : `<span class="cal-chip" data-cal-ct="${_esc(e.cid)}" title="${_esc((we?we+' · ':'')+ev.label+': '+(e.note||e.cname))}" style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${th}</span>`; })():'');
      return chip; });
      const chip=chips.map((h,k)=>k?h.replace(/^<(\w+) class="cal-chip/,'<$1 data-cal-wkm-x class="cal-chip'):h).join('');
      const more=list.length>1?`<span class="cal-more" data-cal-wkm-more="${list.length}">${_esc(i18t('cal_n_more',{n:list.length-1}))}</span>`:'';
      const dayName=d.toLocaleDateString(langLocale(),{day:'numeric',month:'long',year:'numeric'});
      return `<div class="cal-wkm-d${iso===calToday()?' is-today':''}" role="button" tabindex="0" data-cal-week="${iso}" title="${_esc(i18t('cal_open_week_of',{day:dayName}))}"><span class="cal-wkm-dn">${_esc(d.toLocaleDateString(langLocale(),{weekday:'short'}))} ${d.getDate()}</span>${chip}${more}</div>`;
    }).join('');
    const f=(d,o)=>d.toLocaleDateString(langLocale(),o);
    const rng=mon.getMonth()===fri.getMonth()?`${mon.getDate()}–${f(fri,{day:'numeric',month:'short'})}`:`${f(mon,{day:'numeric',month:'short'})} – ${f(fri,{day:'numeric',month:'short'})}`;
    rows.push(`<div class="cal-wkm-row" data-cal-wkm="${_isoLocal(mon)}"><div class="cal-wkm-lab"><b>${_esc(rng)}</b><span>${_esc(n?(owed===n?i18tn('cal_wk_n_due',n,{n}):i18tn('cal_wk_n_dates',n,{n})):i18t('cal_wk_none'))}</span></div>${cells}</div>`);
  }
  return `<div class="cal-wkm" id="cal-wk-more" aria-label="${_esc(i18t('cal_wk_more_label'))}">${rows.join('')}</div>`;
}

/* ---- COPILOT'S PLAN (per sitting; what is added lives in js/mine.js) ---- */
let _calPlan = { busy:false, say:'', err:'', blocks:[], dropped:0, left:[], kind:'', points:[], seq:0, ask:'', read:null };
/* how far ahead the Calendar's Jambo may look when the person names a later day (the server caps it alike, PLAN_HORIZON_DAYS) */
const CAL_PLAN_HORIZON_DAYS = 120;
const CAL_I_X='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const CAL_I_TICK='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5"/></svg>';
const CAL_I_UNDO='<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3L2 6l3 3"/><path d="M2 6h7.5a4 4 0 010 8H6"/></svg>';
/* ---- "JAMBO MAY CHANGE MY CALENDAR": ON HIS OWN · ASK ME FIRST · NEVER
   (round 16 as drawn; the owner's "build all the gaps", 18 Oct 2026) ----
   The Calendar's own setting (the person's pref row, js/mine.js), drawn the
   same in Jambo's panel beside the Calendar and beside Obligations. On his
   own adds his blocks (each undoable); Ask me first adds nothing until Add;
   NEVER: he answers in words and offers nothing to add — the server reads the
   person's own setting and lets him only answer (POST /api/ai/plan). ONE
   writer, calLevelSet → mineSave('pref'). */
const CAL_LEVELS = [['auto','cal_lv_auto'],['ask','cal_plan_ask'],['never','cal_lv_never']];
function calLevelOf(){
  const p=(typeof minePref==='function')?minePref():null;
  const v=p&&p.copilotLevel;
  return CAL_LEVELS.some(x=>x[0]===v)?v:'ask';
}
function calLevelSegHtml(){
  const cur=calLevelOf();
  return `<div class="cal-lv" data-cal-lvs><span class="cal-lv-t" id="cal-lv-t">${_esc(i18t('cal_lv_label'))}</span><span class="cal-lv-seg" role="group" aria-labelledby="cal-lv-t">${
    CAL_LEVELS.map(([k,key])=>`<button type="button" data-cal-lv="${k}" aria-pressed="${cur===k?'true':'false'}">${_esc(i18t(key))}</button>`).join('')}</span></div>`;
}
async function calLevelSet(v){
  if(!CAL_LEVELS.some(x=>x[0]===v)||v===calLevelOf()) return false;
  if(typeof mineLoaded==='function'&&!mineLoaded()&&typeof mineLoad==='function') await mineLoad();
  try{ await mineSave('pref',{ ...minePref(), copilotLevel:v }); }
  catch(e){ toast(String((e&&(e.error||e.message))||i18t('cal_plan_failed',{why:''})),'err'); return false; }
  /* mineSave repaints the Calendar where it is up; the Obligations page says
     the week again with the new offer */
  if(window.state&&state.view==='obligations'&&typeof window.obwRepaint==='function') obwRepaint();
  return true;
}
/* ---- COPILOT, BESIDE THE CALENDAR IN EVERY VIEW (the design, 11 Oct 2026) ----
   A conversation: what you asked, on the right in the accent; Copilot's
   answer under it with its suggestions, each a dashed card with Add · Discard
   (→ Added · Undo; a discarded one leaves one line with Undo); then what it
   read.
   AS DRAWN IN ROUND 16 (the owner's "build all the gaps", 18 Oct 2026): the
   panel is Jambo's "Your week", the same words the Obligations page's panel
   says (obYourWeekSentence — one reading, counted from the list, no call), his
   offer, the planner's two asks as chips saying their cost ("plan my week · 1
   Jambo call"), the setting as three buttons, then the conversation; at the
   foot his box and Ask (its cost on its hover) and the hint line. */
const CAL_TALK_KEY='cal:week';
function calTalkBack(){
  const keep=(typeof window.jamboTalkClose==='function')?jamboTalkClose():[];
  if(document.getElementById('cal-plan')){ const pb=document.getElementById('cal-plan-body'); if(pb) pb.scrollTop=0; }
  if(calOnScreen()) calPlanRepaint(); else if(typeof window.renderIntelDock==='function') renderIntelDock();
  if(typeof window.jamboScrollPut==='function') jamboScrollPut(keep);
  if(typeof window.deskBarPaint==='function') try{ deskBarPaint(); }catch(_){ }
}
if(typeof window!=='undefined'&&typeof window.jamboTalkHost==='function') jamboTalkHost('cal', calTalkBack, k=>k===CAL_TALK_KEY&&!!document.getElementById('cal-plan'));
if(typeof document!=='undefined'&&!document._calTalkWired){ document._calTalkWired=true;
  document.addEventListener('click',e=>{ const b=e.target&&e.target.closest?e.target.closest('[data-cal-talk-back]'):null; if(!b) return; e.preventDefault(); calTalkBack(); });
  /* the Jambo tab: opens the conversation as it was; pressed again, back */
  document.addEventListener('click',e=>{ const b=e.target&&e.target.closest?e.target.closest('[data-cal-talk]'):null; if(!b) return; e.preventDefault();
    if(typeof window.jamboTalkShows==='function'&&jamboTalkShows(CAL_TALK_KEY)){ calTalkBack(); return; }
    if(typeof window.jamboTalkOpen==='function') jamboTalkOpen(CAL_TALK_KEY, document.getElementById('cal-plan-body'));
    if(calOnScreen()) calPlanRepaint(); else if(typeof window.renderIntelDock==='function') renderIntelDock();
    if(typeof window.deskBarPaint==='function') try{ deskBarPaint(); }catch(_){ } }); }
/* THE TWO-ROW CARD's one builder (components.js), read where it is drawn;
   a page loaded without it (a test's one-file world) draws the bare parts */
const _calJbCard = o => (typeof jamboCardHtml === 'function') ? jamboCardHtml(o) : `${o.field || ''}${o.ctx || ''}${o.send || ''}${o.tail || ''}`;
const _calJbSend = (a, l, o = {}) => (typeof jamboSendHtml === 'function') ? jamboSendHtml(a, l, o) : `<button type="${o.submit ? 'submit' : 'button'}" ${a || ''} aria-label="${l}" title="${o.title || l}"></button>`;

function calPlanHtml(){
  const lv=calLevelOf();
  const never=lv==='never';
  const rows=_calPlan.blocks.map(b=>{
    const d=new Date(b.date+'T00:00:00').toLocaleDateString(langLocale(),{weekday:'short',day:'numeric',month:'short'});
    const when=`${d} · ${b.start}–${b.end}`;
    if(b.st==='gone') return `<div class="cal-prop is-gone"><span>${_esc(i18t('cal_plan_gone'))} ${_esc(b.title)}</span><button type="button" class="u" data-cal-plan-undo="${_esc(b.k)}">${CAL_I_UNDO}${_esc(i18t('cal_plan_undo'))}</button></div>`;
    /* NEVER: his words only — nothing offered to add */
    const acts=never&&b.st!=='added'?''
      :b.st==='added'
      ? `<button type="button" class="is-added" aria-disabled="true" disabled>${CAL_I_TICK}${_esc(i18t('cal_plan_added'))}</button><button type="button" class="u" data-cal-plan-undo="${_esc(b.k)}">${CAL_I_UNDO}${_esc(i18t('cal_plan_undo'))}</button>`
      : `<button type="button" class="p" data-cal-plan-add="${_esc(b.k)}">${_esc(i18t('cal_plan_add'))}</button><button type="button" class="d" data-cal-plan-discard="${_esc(b.k)}">${CAL_I_X}${_esc(i18t('cal_plan_discard'))}</button>`;
    return `<div class="cal-prop${b.st==='added'?' is-added':''}" data-cal-prop="${_esc(b.k)}"><b>${_esc(b.title)}</b><small>${_esc(when)}${b.why?' · '+_esc(b.why):''}</small>${acts?`<div class="av">${acts}</div>`:''}</div>`;
  }).join('');
  const r=_calPlan.read;
  const read=r?`<p class="cal-plan-read">${_esc(i18t('cal_plan_read',{ d:i18tn('cal_plan_read_d',r.d,{n:r.d}), e:i18tn('cal_plan_read_e',r.e,{n:r.e}),
    hs:String(r.hs).padStart(2,'0')+':00', he:String(r.he).padStart(2,'0')+':00' }))}</p>`:'';
  const you=_calPlan.ask?`<div class="cal-plan-you">${_esc(_calPlan.ask)}</div>`:'';
  const answer=_calPlan.busy?`<p class="cal-plan-busy" aria-busy="true"><span class="ob-spin" aria-hidden="true"></span>${_esc(i18t('cal_plan_busy'))}</p>`
    :_calPlan.err?`<p class="cal-plan-err">${_esc(_calPlan.err)}</p>`
    :_calPlan.seq&&_calPlan.kind==='answer'?`<div class="cal-plan-ai">${_calPlan.say?`<p class="cal-plan-say">${_esc(_calPlan.say)}</p>`:''}${
      _calPlan.points.length?`<ul class="cal-plan-pts">${_calPlan.points.map(x=>`<li>${_esc(x)}</li>`).join('')}</ul>`:''}${read}</div>`
    :_calPlan.seq?`<div class="cal-plan-ai">${_calPlan.say?`<p class="cal-plan-say">${_esc(_calPlan.say)}</p>`:''}${rows?`<div class="cal-props">${rows}</div>`:`<p class="cal-plan-say">${_esc(i18t('cal_plan_none'))}</p>`}${
      never&&rows?`<p class="cal-plan-read">${_esc(i18t('cal_lv_never_note'))}</p>`:''}${calPlanLeftHtml()}${read}</div>`
    :'';
  const off=_calPlan.busy?' disabled':'';
  const sayFace=(window.jamboFaceHtml?jamboFaceHtml('hello',24,'jl-say-face').replace('<img','<img data-ink-exempt'):'');
  const week=(typeof window.obYourWeekSentence==='function')?obYourWeekSentence():'';
  const offer=(typeof window.obYourWeekOffer==='function')?obYourWeekOffer():'';
  const cost=i18t('jl_ask_cost');
  /* JAMBO AS A TAB YOU FLIP TO (owner, 19 Oct 2026): the panel lands on Your
     week; an ask turns it to the conversation under the one trail line
     (jamboTrailHtml), and ‹ Overview, Esc or the bar's ‹ turn it back as left */
  /* ONE WINDOW (owner, 24 Oct 2026: "logically it makes no sense to have a window that is empty which you ask a
     question it takes you to another window"; reverses the 19 Oct "A Jambo tab" here): Your week is his words and
     the planner's setting, so the panel is ONE window — his words first, what was asked and his answer under them,
     no Overview / Jambo tabs, no word beside them, no trail */
  const talk=!!(you||answer);
  return `<aside class="cal-cop is-solo${talk?' is-talk':''}" id="cal-plan" aria-label="${_esc(i18t('ce_copilot'))}">
    <div class="cal-plan-head jl-head"><span class="pd-tab on jl-tab" title="${_esc(i18t('pd_tab_copilot'))}">${typeof window.jamboTalkTabInner==='function'?jamboTalkTabInner():_esc(i18t('pd_tab_copilot'))}</span><span class="jl-sp"></span></div>
    <div class="cal-plan-body scroll-thin" id="cal-plan-body">
      ${typeof window.jamboHelloHtml==='function'?jamboHelloHtml():''}
      <div class="jl-words cal-yw" data-jt-land>${week?`<div class="jl-say">${sayFace}<div class="jl-bub">${week}</div></div><p class="jl-src">${_esc(i18t('ob_yw_src'))}</p>`:''}${
        offer?`<div class="jl-say">${sayFace}<div class="jl-bub">${_esc(offer)}</div></div>`:''}
        <div class="jl-chips cal-yw-chips"><button type="button" class="jl-chip" data-cal-plan-q="week" title="${_esc(i18t('cal_plan_p_week'))}"${off}>${_esc(i18t('ob_yw_chip_week'))}</button><button type="button" class="jl-chip" data-cal-plan-q="due" title="${_esc(i18t('cal_plan_p_due'))}"${off}>${_esc(i18t('ob_yw_chip_due'))}</button></div>
        ${calLevelSegHtml()}</div>
      ${talk?`<div class="cal-plan-talk" id="cal-plan-talk" data-jt-talk>${you}${answer}</div>`:''}
    </div>
    <div class="jl-foot cal-plan-foot">
      ${_calJbCard({ cls: 'cal-plan-box', field: `<textarea id="cal-plan-in" rows="1" maxlength="600" enterkeyhint="send" data-ca-slash autocomplete="off" placeholder="${_esc(i18t('jl_ph_week'))}" aria-label="${_esc(i18t('jl_ph_week'))}" title="${_esc(cost)}"${off}></textarea>`, send: _calJbSend(`id="cal-plan-go"${off}`, i18t('int_ask'), { cls: 'jl-send', title: cost }) })}
    </div>
  </aside>`;
}
/* WHAT WAS LEFT OUT, AND WHY (owner, 18 Oct 2026): each suggestion the check
   did not keep is named with its reason; an older answer with only a count
   still says the count. */
function calPlanLeftHtml(){
  const left=_calPlan.left||[];
  if(!left.length) return _calPlan.dropped?`<p class="cal-plan-read">${_esc(i18tn('cal_plan_dropped',_calPlan.dropped,{n:_calPlan.dropped}))}</p>`:'';
  return `<div class="cal-plan-left"><p class="cal-plan-read">${_esc(i18t('cal_plan_left'))}</p><ul class="cal-plan-pts">${
    left.map(x=>`<li><b>${_esc(x.title||'—')}</b> — ${_esc(i18t('cal_plan_why_'+(['clash','hours','weekend','busy','window','bad','cap'].includes(x.why)?x.why:'bad')))}</li>`).join('')}</ul></div>`;
}
/* The whole page repaints (the suggestions draw on the grid too); the places
   the reader had scrolled to are kept. */
let _calSaidSeen='';
function calPlanRepaint(){
  if(!calOnScreen()||!document.getElementById('cal-plan')) return;
  const wk=document.getElementById('cal-wk-body'), pb=document.getElementById('cal-plan-body');
  const a=wk?wk.scrollTop:null, c=pb?pb.scrollTop:0;
  renderCalendar();
  const wk2=document.getElementById('cal-wk-body'), pb2=document.getElementById('cal-plan-body');
  if(wk2&&a!=null) wk2.scrollTop=a;
  /* one window: a question asked or answered brings what was said under his words into view */
  const tk=document.getElementById('cal-plan-talk');
  const said=String(_calPlan.seq)+':'+(_calPlan.busy?1:0)+':'+(_calPlan.ask||'');
  if(pb2&&tk&&said!==_calSaidSeen){ _calSaidSeen=said; pb2.scrollTop+=tk.getBoundingClientRect().top-pb2.getBoundingClientRect().top-8; }
  else if(pb2) pb2.scrollTop=c;
}
async function calPlanAsk(q, ref){
  if(_calPlan.busy) return;
  const a=calWeekStart(), from=_isoLocal(a)<calToday()?calToday():_isoLocal(a), to=_isoLocal(calAddDays(new Date(from+'T00:00:00'),13));
  const ask=q==='week'?i18t('cal_plan_p_week'):q==='due'?i18t('cal_plan_p_due'):q==='hour'?i18t('cal_plan_p_hour',{ref:ref||''}):String(q||'').trim();
  if(!ask) return;
  const said=q==='week'?i18t('cal_plan_q_week'):q==='due'?i18t('cal_plan_q_due'):q==='hour'?i18t('cal_plan_q_hour',{ref:ref||''}):ask;
  /* JAMBO FOLLOWS THE ASK (owner, 18 Oct 2026): he is told today, and reads as
     far ahead as the person may name a day (CAL_PLAN_HORIZON_DAYS) — the next
     two weeks are still where he plans when no day is named */
  const until=_isoLocal(calAddDays(new Date(from+'T00:00:00'),CAL_PLAN_HORIZON_DAYS));
  const dates=calVisible(calendarEvents()).filter(e=>e.date>=from&&e.date<=until).slice(0,200)
    .map(e=>({ date:e.date, title:(e.cref||e.cid)+' · '+(e.type==='obligation'?(e.note||CAL_EVENT[e.type].label):CAL_EVENT[e.type].label)+(e.cname?' ('+e.cname+')':''), contractId:e.cid }));
  const events=(typeof mineList==='function'?mineList('event'):[]).filter(e=>e.date>=from&&e.date<=until).slice(0,200).map(e=>({ date:e.date, start:e.start, end:e.end, title:e.title }));
  const pref=typeof minePref==='function'?minePref():{dayStart:8,dayEnd:17,copilotLevel:'ask'};
  /* the panel turns to the conversation; Your week is kept as it was left */
  _calPlan.busy=true; _calPlan.err=''; _calPlan.ask=said; _calPlan.read=null; calPlanRepaint();
  try{
    if(!(typeof API_MODE==='function'&&API_MODE())) throw Object.assign(new Error('needsKey'),{needsKey:true});
    const r=await api('ai/plan','POST',{ from, to, until, today:calToday(), ask, dates, events, dayStart:pref.dayStart, dayEnd:pref.dayEnd });
    _calPlan.seq++;
    /* an ANSWER is words (and lines), nothing to add; a PLAN is blocks, each
       left-out one with its reason */
    _calPlan.kind=(r&&r.kind)==='answer'?'answer':'plan';
    _calPlan.say=String((r&&r.say)||'');
    _calPlan.points=Array.isArray(r&&r.points)?r.points.map(String).filter(Boolean).slice(0,8):[];
    _calPlan.dropped=Number((r&&r.dropped)||0);
    _calPlan.left=Array.isArray(r&&r.left)?r.left.filter(x=>x&&x.why):[]; // every one said: a cap is a fact
    _calPlan.read={ d:dates.length, e:events.length, hs:pref.dayStart, he:pref.dayEnd };
    _calPlan.blocks=((r&&r.blocks)||[]).map((b,i)=>({ ...b, k:'b'+_calPlan.seq+'_'+i, st:'proposed', itemId:null }));
    _calPlan.busy=false;
    if(pref.copilotLevel==='auto') for(const b of _calPlan.blocks) await calPlanAdd(b.k,{quiet:true});
  }catch(e){
    _calPlan.busy=false;
    const why=String((e&&(e.error||e.message))||'');
    _calPlan.err=(e&&(e.needsKey||/needsKey|not configured/i.test(why)))?i18t('cal_plan_nokey'):i18t('cal_plan_failed',{why:why||'—'});
  }
  calPlanRepaint();
}
async function calPlanAdd(k,o){
  const b=_calPlan.blocks.find(x=>x.k===k); if(!b||b.st==='added') return;
  if(calLevelOf()==='never') return;   // the reader said Never: he adds nothing, not even on a press
  try{
    const it=await mineSave('event',{ title:b.title, date:b.date, start:b.start, end:b.end, contractId:b.contractId||'', source:'copilot', why:b.why||'' });
    b.st='added'; b.itemId=it.id;
    if(!(o&&o.quiet)) toast(i18t('cal_ev_saved'),'ok');
  }catch(e){ toast(String((e&&(e.error||e.message))||i18t('cal_plan_failed',{why:''})),'err'); }
  calPlanRepaint();
}
async function calPlanUndo(k){
  const b=_calPlan.blocks.find(x=>x.k===k); if(!b) return;
  if(b.st==='added'&&b.itemId){ try{ await mineDelete(b.itemId); }catch(_){} b.itemId=null; }
  b.st='proposed'; calPlanRepaint();
}
/* A REQUEST TO BOOK OR FIND TIME, TYPED ANYWHERE ELSE (Jambo's main box, the
   Counter), IS HANDED HERE with its words (owner, 18 Oct 2026): the Calendar
   opens on Home and its own Jambo takes the ask — the one door that can plan
   time. Not on the phone (it draws its own calendar); false when it cannot. */
function calHandOff(q){
  const t=String(q||'').trim();
  if(!t||typeof hbOpenCalendar!=='function') return false;
  if(typeof mPhone==='function'&&mPhone()) return false;
  hbOpenCalendar();
  let n=0;
  const go=()=>{ if(calOnScreen()&&document.getElementById('cal-plan')){ calPlanAsk(t); return; } if(++n<60) setTimeout(go,50); };
  setTimeout(go,0);
  return true;
}
/* ---- ONE EVENT: NEW OR EDITED (a dialog — the event's facts are a
   decision the reader is making). Private, said once at the foot. ---- */
function calEventDialog(item, seed){
  const it=item||{}, sd=seed||{};
  const date=it.date||sd.date||calToday(), start=it.start!=null?it.start:(sd.start||'09:00');
  const end=it.end!=null?it.end:(sd.start?String(Math.min(23,Number(sd.start.slice(0,2))+1)).padStart(2,'0')+':00':'10:00');
  const allDay=!!item&&!it.start;
  const opts=(state.contracts||[]).filter(c=>!c.archived).slice(0,400).map(c=>`<option value="${_esc(c.id)}"${String(it.contractId||'')===String(c.id)?' selected':''}>${_esc((c.contractNo||c.id)+' · '+(c.counterparty||c.name||''))}</option>`).join('');
  openModal(`<div class="cal-evd">
    <h3>${_esc(i18t(item?'cal_ev_title_edit':'cal_ev_title_new'))}</h3>
    <label>${_esc(i18t('cal_ev_what'))}<input id="cal-ev-title" type="text" maxlength="120" value="${_esc(it.title||'')}"></label>
    <div class="cal-evd-row"><label>${_esc(i18t('cal_ev_day'))}<input id="cal-ev-date" type="date" value="${_esc(date)}"></label>
      <label class="cal-evd-all"><input id="cal-ev-all" type="checkbox"${allDay?' checked':''}> ${_esc(i18t('cal_ev_allday'))}</label></div>
    <div class="cal-evd-row" id="cal-ev-times"${allDay?' hidden':''}><label>${_esc(i18t('cal_ev_from'))}<input id="cal-ev-start" type="time" value="${_esc(start)}"></label>
      <label>${_esc(i18t('cal_ev_to'))}<input id="cal-ev-end" type="time" value="${_esc(end)}"></label></div>
    <label>${_esc(i18t('cal_ev_contract'))}<select id="cal-ev-ct"><option value="">${_esc(i18t('cal_ev_none'))}</option>${opts}</select></label>
    ${it.source==='copilot'&&it.why?`<p class="cal-evd-why">&#10022; ${_esc(it.why)}</p>`:''}
    <p class="cal-evd-say" id="cal-ev-say" role="status"></p>
    <div class="cal-evd-foot">${item?`<button type="button" class="ui-btn ui-btn-sm cal-evd-del" id="cal-ev-del">${_esc(i18t('cal_ev_delete'))}</button>`:''}<span class="g"></span>
      <button type="button" class="ui-btn ui-btn-sm" id="cal-ev-cancel">${_esc(i18t('cal_ev_cancel'))}</button>
      <button type="button" class="ui-btn ui-btn-sm ui-btn-primary" id="cal-ev-save">${_esc(i18t('cal_ev_save'))}</button></div>
    <p class="cal-evd-priv">${_esc(i18t('cal_ev_private'))}</p>
  </div>`, { maxWidth: (window.DLG_W&&DLG_W.s)||'420px', label:i18t(item?'cal_ev_title_edit':'cal_ev_title_new') });
  const $=id=>document.getElementById(id);
  $('cal-ev-title')?.focus();
  $('cal-ev-all')?.addEventListener('change',e=>{ $('cal-ev-times').hidden=e.target.checked; });
  $('cal-ev-cancel')?.addEventListener('click',()=>closeModal());
  $('cal-ev-del')?.addEventListener('click',async()=>{ try{ await mineDelete(it.id); closeModal(); toast(i18t('cal_ev_deleted'),'ok'); }catch(e){ $('cal-ev-say').textContent=String((e&&(e.error||e.message))||''); } });
  $('cal-ev-save')?.addEventListener('click',async()=>{
    const all=$('cal-ev-all').checked;
    const body={ title:$('cal-ev-title').value.trim(), date:$('cal-ev-date').value, start:all?'':$('cal-ev-start').value, end:all?'':$('cal-ev-end').value, contractId:$('cal-ev-ct').value,
      source:it.source||'me', why:it.why||'' };
    if(!body.title){ $('cal-ev-say').textContent=i18t('cal_ev_need_title'); $('cal-ev-title').focus(); return; }
    if(!all&&(!body.start||!body.end||body.end<=body.start)){ $('cal-ev-say').textContent=i18t('cal_ev_need_times'); return; }
    try{ await mineSave('event',body,item?it.id:null); closeModal(); toast(i18t('cal_ev_saved'),'ok'); }
    catch(e){ $('cal-ev-say').textContent=String((e&&(e.error||e.message))||''); }
  });
}
/* ARMED ONCE, delegated on document, the element resolved at the press. */
function calWireOwn(){
  const inp=document.getElementById('cal-plan-in');
  /* JAMBO, THE SAME ON EVERY PAGE (owner, 18 Oct 2026): what he reads on
     Home — a page, a contract's number, a draft, a send — he does here too
     (caAskAnywhere); planning time is this box's own job, for the rest. Enter
     and the drawn Ask button ask alike (round 16). */
  const ask=()=>{ if(!inp) return; const v=inp.value; if(!String(v||'').trim()) return;
    if(typeof caAskAnywhere==='function'&&caAskAnywhere(v,{cal:true})){ inp.value=''; return; } calPlanAsk(v); };
  if(inp) inp.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); ask(); } });
  document.getElementById('cal-plan-go')?.addEventListener('click',ask);
  const body=document.getElementById('cal-wk-body');
  if(body&&body.dataset&&!body.dataset.scrolled&&typeof getComputedStyle==='function'){ body.dataset.scrolled='1';
    const first=body.querySelector('.cal-wk-blk'); const pref=typeof minePref==='function'?minePref():{dayStart:8};
    const row=parseFloat(getComputedStyle(body.parentElement).getPropertyValue('--cal-wk-row'))||40;
    const h0=Number(body.querySelector('.cal-wk-t')?.textContent)||0;
    body.scrollTop=first?Math.max(0,first.offsetTop-row):Math.max(0,((Number(pref.dayStart)||8)-h0)*row); }
  calWkmFit();
  if(document._calOwnWired) return;
  document._calOwnWired=true;
  document.addEventListener('click',e=>{
    if(!calOnScreen()) return;
    const t=e.target.closest?e.target:null; if(!t) return;
    const hit=sel=>t.closest(sel);
    let el;
    if((el=hit('[data-cal-act]'))&&calChipGo(el)){ e.preventDefault(); e.stopPropagation(); return; }
    if((el=hit('[data-cal-ct]'))){ e.preventDefault(); e.stopPropagation(); selectContract(el.getAttribute('data-cal-ct')); return; }
    if((el=hit('[data-cal-mine]'))){ e.preventDefault(); e.stopPropagation(); const it=mineGet(el.getAttribute('data-cal-mine')); if(it) calEventDialog(it); return; }
    if((el=hit('[data-cal-note]'))){ e.preventDefault(); e.stopPropagation(); if(typeof myNotesOpen==='function') myNotesOpen(el.getAttribute('data-cal-note')); return; }
    if((el=hit('[data-cal-plan-go]'))){ e.preventDefault(); e.stopPropagation(); const k=el.getAttribute('data-cal-plan-go');
      if(calView()!=='week'){ const b=_calPlan.blocks.find(x=>x.k===k); if(b) calState.wk=b.date; calState.view='week'; renderCalendar(); }
      const p=document.querySelector(`[data-cal-prop="${CSS.escape(k)}"]`); if(p){ p.scrollIntoView({block:'nearest'}); p.classList.add('is-lit'); setTimeout(()=>p.classList.remove('is-lit'),1200); } return; }
    if((el=hit('[data-cal-week]'))){ e.preventDefault(); e.stopPropagation(); calState.wk=el.getAttribute('data-cal-week'); calState.view='week'; renderCalendar(); return; }
    if((el=hit('[data-cal-slot]'))){ const [date,start]=el.getAttribute('data-cal-slot').split('|'); calEventDialog(null,{date,start}); return; }
    if((el=hit('#cal-new'))){ calEventDialog(null,{ date:calView()==='week'?_isoLocal(calWeekStart())<=calToday()&&calToday()<=_isoLocal(calAddDays(calWeekStart(),CAL_WEEK_DAYS-1))?calToday():_isoLocal(calWeekStart()):calToday() }); return; }
    if((el=hit('[data-cal-lay]'))){ const k=el.getAttribute('data-cal-lay'); calState.lay={ ...calLayers(), [k]:!calLayers()[k] }; renderCalendar(); return; }
    if((el=hit('[data-cal-plan-q]'))){ calPlanAsk(el.getAttribute('data-cal-plan-q'), el.getAttribute('data-cal-plan-ref')); return; }
    if((el=hit('[data-cal-plan-add]'))){ calPlanAdd(el.getAttribute('data-cal-plan-add')); return; }
    if((el=hit('[data-cal-plan-discard]'))){ const b=_calPlan.blocks.find(x=>x.k===el.getAttribute('data-cal-plan-discard')); if(b){ b.st='gone'; calPlanRepaint(); } return; }
    if((el=hit('[data-cal-plan-undo]'))){ calPlanUndo(el.getAttribute('data-cal-plan-undo')); return; }
  }, true);
  document.addEventListener('keydown',e=>{
    if(!calOnScreen()||(e.key!=='Enter'&&e.key!==' ')) return;
    const el=e.target&&e.target.closest?e.target.closest('[data-cal-week]'):null;
    if(el){ e.preventDefault(); e.stopPropagation(); el.click(); }
  }, true);
}
const _calPlanState=()=>_calPlan;
/* "Jambo may change my calendar": one listener for every place it is drawn
   (the Calendar's panel, the Obligations page's), armed once at load */
if(typeof document!=='undefined'&&typeof window!=='undefined'&&!window._calLvWired){
  window._calLvWired=true;
  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('[data-cal-lv]'):null; if(!b) return;
    e.preventDefault(); e.stopPropagation(); calLevelSet(b.getAttribute('data-cal-lv'));
  },true);
}

Object.assign(window,{CAL_TALK_KEY,calTalkBack,calendarDoorCount,calOnScreen,calWireOwn,calState,calPlace,calPlacePut,calMonth,calView,calScope,CAL_VIEWS,CAL_EVENT,CAL_PRIORITY,
  calendarEvents,calEventMine,calPeriod,calInPeriod,calLegendHtml,calFitDays,CAL_DAY_MIN,CAL_DAY_MAX,calVisible,calDecisionsThisWeek,calWeekBounds,
  calToday,calChipText,calIcsFor,calUpcoming,calSummaryLines,calMonthGridHtml,calPanelHtml,
  CAL_AGENDA_DAYS,CAL_AGENDA_WINDOWS,CAL_AGENDA_ROWS,calAgendaDays,calSetAgendaDays,
  calSetView,calSetScope,calStep,openCalendarShare,renderCalendar,
  calLayers,calChipAct,calChipGo,calWkmFit,calKeyHtml,calHeadFacts,calWeekCardTitle,calThisMonday,calChipLook,calCtChipHtml,calWeekStart,calWeekHtml,calMoreWeeksHtml,calWeekendWord,CAL_WEEKS_SHOWN,CAL_WEEK_DAYS,calOwnEvents,calPlanHtml,calPlanAsk,calPlanAdd,calPlanUndo,CAL_LEVELS,calLevelOf,calLevelSegHtml,calLevelSet,calEventDialog,_calPlanState,calPlanLeftHtml,CAL_PLAN_HORIZON_DAYS,calHandOff});
