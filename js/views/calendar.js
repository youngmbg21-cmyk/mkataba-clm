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
let calState = { ym:null, view:'month', scope:'all' };
const CAL_VIEWS = ['month','quarter','list'];

function calMonth(){ if(!calState.ym){ const d=new Date(); calState.ym={y:d.getFullYear(), m:d.getMonth()}; } return calState.ym; }
function calView(){ return CAL_VIEWS.includes(calState.view)?calState.view:'month'; }
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
// priority when a day carries more than one kind of event (drives its tint)
const CAL_PRIORITY = ['expiry','renewal','obligation','round'];

/* Gather every lifecycle event as {date, type, cid, cname, note}. */
function calendarEvents(){
  const out=[];
  state.contracts.forEach(c=>{
    if(c.status!=='Declined'&&!c.archived){
      /* Through dateOnly, because the grid is keyed by YYYY-MM-DD: an expiry
         written "30 September 2026" matched no cell, so the event was built,
         counted and then rendered on no day at all. Same normalisation the
         decision date uses, so the two are comparable below. */
      const rawExp=(window.effectiveExpiry?effectiveExpiry(c):null)||(c.metadata&&c.metadata.expiryDate)||c.expiry;
      const exp=window.dateOnly?dateOnly(rawExp):rawExp;
      if(exp) out.push({ date:exp, type:'expiry', cid:c.id, cname:c.name, note:c.counterparty||'' });
      const dd=renewalDecisionDate(c);
      if(dd && dd!==exp) out.push({ date:dd, type:'renewal', cid:c.id, cname:c.name, note:'decide by' });

    /* Through the same normalisation the expiry goes through. A due date filed
       as "31 March 2027" — which is what a Copilot scan and a typed migration
       sheet both produce — built an event, counted it, and then drew it on no
       day at all, while daysUntil(NaN) kept it out of the agenda as well.

       INSIDE the Declined guard, which this loop used to sit just past: a
       declined contract owes nothing, and its obligations on the agenda were
       jobs somebody would have done for a deal that never happened. */
    (c.obligations||[]).forEach(o=>{ const od=window.obligationDue?obligationDue(o):o.due;
      if(od) out.push({ date:od, type:'obligation', cid:c.id, cname:c.name, note:o.desc,
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
        assignee:o.assignee||'', done:o.status==='done' }); });

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
        if(at) out.push({ date:at, type:'round', cid:c.id, cname:c.name,
          note:i18t('cal_round_n',{n:r.n||''}), round:r.n||null });
      });
      const t=window.dateOnly?dateOnly(n.turnAt):String(n.turnAt||'').slice(0,10);
      if(t) out.push({ date:t, type:'round', cid:c.id, cname:c.name,
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
function calToday(){ return _isoLocal(new Date()); }

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
  return CAL_EVENT[e.type].short+' · '+e.cid;
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
    `DESCRIPTION:${_ics(CAL_EVENT[e.type].label+(e.note?' — '+e.note:'')+' · '+e.cid)}`,
    'END:VEVENT'].join('\r\n')).join('\r\n');
  return ['BEGIN:VCALENDAR','PRODID:-//HaTi//Contract calendar//EN','VERSION:2.0','CALSCALE:GREGORIAN',
    body,'END:VCALENDAR'].filter(Boolean).join('\r\n')+'\r\n';
}

/* One row of the "Next 30 days" panel, and of the Share summary. ONE builder,
   so what a colleague is emailed is what the reader was looking at. */
function calUpcoming(evs, days){
  const n=days||30;
  return evs.filter(e=>{ const d=daysUntil(e.date); return d>=0 && d<=n && !e.done; })
    .sort((a,b)=>a.date.localeCompare(b.date));
}
function calSummaryLines(evs){
  return calUpcoming(evs).slice(0,40).map(e=>{
    const d=daysUntil(e.date);
    return `${e.date} · ${CAL_EVENT[e.type].label} — ${e.cname} (${e.cid})`
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
  for(let i=0;i<7;i++){
    const d=new Date(2024,0,1+i);   // 1 Jan 2024 was a Monday
    const w=d.toLocaleDateString(langLocale(),{weekday:short?'narrow':'short'});
    out.push(`<span>${_esc(w)}</span>`);
  }
  return out.join('');
}

/* One month's 42 cells. `compact` is the Quarter view: no chips, just the day
   number and a row of dots, because a cell a twenty-first of the page wide has
   no room for words and a truncated word is worse than a dot. */
function calMonthGridHtml(y, m, byDay, opts){
  const compact=!!(opts&&opts.compact);
  const first=new Date(y,m,1), start=(first.getDay()+6)%7, days=new Date(y,m+1,0).getDate();
  const todayIso=calToday();
  const cells=[];
  for(let i=0;i<42;i++){
    const dnum=i-start+1, inMonth=dnum>=1&&dnum<=days;
    if(!inMonth){
      /* The days either side keep their NUMBERS, greyed — the render draws
         them and a reader counting back from the 1st needs somewhere to land.
         They carry no events and no press: this month's grid is not the place
         to act on another month's contract. */
      const d=new Date(y,m,dnum);
      cells.push(`<div class="cal-day is-mute"><span class="cal-dn">${d.getDate()}</span></div>`);
      continue;
    }
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(dnum).padStart(2,'0')}`;
    const list=byDay[iso]||[];
    const today=iso===todayIso;
    const cids=Array.from(new Set(list.map(e=>e.cid).filter(Boolean)));
    const dayName=new Date(y,m,dnum).toLocaleDateString(langLocale(),{day:'numeric',month:'long',year:'numeric'});
    /* ---- THE WHOLE BOX IS THE DOOR ----
       Pressing anything in a day cell goes to the register narrowed to that
       day's contracts; the document opens only when the day holds exactly one.
       It is CONTRACTS, not events — one contract can put two marks on one day
       (an expiry and the renewal decision that defaults to it), and sending a
       reader to a list to choose between two rows about the same agreement is
       a choice with one answer. The chips are spans and fall through to the
       cell, so the count question is asked in exactly one place. */
    const attrs=cids.length
      ? ` role="button" tabindex="0" data-cal-day="${iso}" title="${_esc(cids.length===1
          ? i18t('cal_open_this',{name:list[0].cname})
          : i18t('cal_choose_from',{n:cids.length,day:dayName}))}"`
      : '';
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
        const t=cids.length===1?` title="${_esc(ev.label+': '+(e.note||e.cname))}"`:'';
        return `<span class="cal-chip${e.done?' is-done':''}"${t} style="border-left-color:${ev.dot};background:${ev.bg};color:${ev.fg}">${_esc(calChipText(e))}</span>`;
      }).join('')+(more>0?`<span class="cal-more">${i18t('cal_n_more',{n:more})}</span>`:'')+`</span>`;
    }
    cells.push(`<div class="cal-day${today?' is-today':''}"${attrs}><span class="cal-dn">${dnum}</span>${inner}</div>`);
  }
  /* id="cal-grid" is KEPT from the grid this replaces, and only the MONTH view
     carries it — three of them in the Quarter view would be three elements
     sharing one id. laptops-verify names it to make the reported defect's own
     claim ("a month that does not show its last week"), and that claim is
     still exactly what this box has to answer. */
  const gid=(opts&&opts.id)?` id="${opts.id}"`:'';
  return `<div class="cal-dow">${calDowCells(compact)}</div><div class="cal-weeks"${gid}>${cells.join('')}</div>`;
}

function calLegendHtml(){
  return `<div class="cal-legend">`+CAL_PRIORITY.map(k=>
    `<span><i style="background:${CAL_EVENT[k].dot}"></i>${_esc(CAL_EVENT[k].label)}</span>`).join('')+`</div>`;
}
/* ---- THE CARD HEADS ITSELF (owner-asked 24 Aug 2026, "like for like") ----
   The design puts the period stepper, the period's name and the four-tone key
   on ONE row at the top of the month panel. They were in two other places: the
   stepper out on the page's control bar, and the key along the card's foot,
   which put the thing that explains the colours as far from them as the card
   allows.
   ONE HOME, NOT TWO — the stepper is drawn here for EVERY view rather than
   here for Month and out there for the others, because a control with two
   homes is how the two come to disagree. The ids are unchanged, so every
   handler and every test still reaches exactly what it reached before. */
function calCardBarHtml(y, m){
  return `<div class="cal-cardbar">
    <span class="cal-sel">
      <button id="cal-prev" title="${_esc(i18t('cal_prev_month'))}" aria-label="${_esc(i18t('cal_prev_month'))}">&lsaquo;</button>
      <button id="cal-today" class="cal-sel-now">${_esc(calMonthName(y,m))}</button>
      <button id="cal-next" title="${_esc(i18t('cal_next_month'))}" aria-label="${_esc(i18t('cal_next_month'))}">&rsaquo;</button>
    </span>
    <span class="g"></span>
    ${calLegendHtml()}
  </div>`;
}

/* The List view: every date in the period, in order, with its own row. It is
   the one view that can say the whole sentence — kind, agreement, counterparty
   and how long there is — so it does, and it scrolls inside its own card. */
function calListHtml(evs, p){
  const rows=evs.filter(e=>calInPeriod(e,p)).sort((a,b)=>a.date.localeCompare(b.date));
  if(!rows.length) return `<div class="cal-empty">${_esc(i18t('cal_none_in_period'))}</div>`;
  let lastMonth='';
  return `<div class="cal-list">`+rows.map(e=>{
    const ev=CAL_EVENT[e.type], d=daysUntil(e.date);
    const mk=e.date.slice(0,7);
    const head=mk!==lastMonth?(lastMonth=mk, `<div class="cal-list-mh">${_esc(calMonthName(+mk.slice(0,4),+mk.slice(5,7)-1))}</div>`):'';
    const when=d<0?i18t('cal_days_ago',{n:Math.abs(d)}):(d===0?i18t('cal_today'):i18t('cal_in_days',{n:d}));
    return head+`<button class="cal-list-row" data-sel="${_esc(e.cid)}">
      <span class="dt">${_esc(window.regDotDate?regDotDate(e.date):e.date)}</span>
      ${_dot(ev.dot,7)}
      <span class="g">
        <span class="n2${e.done?' is-done':''}">${_esc(e.type==='obligation'&&e.note?e.note:e.cname)}</span>
        <span class="m3">${_esc(ev.label)} · ${_esc(e.cid)}${e.type==='obligation'?' · '+_esc(e.owner||i18t('cal_unassigned')):(e.note&&e.type==='expiry'?' · '+_esc(e.note):'')}</span>
      </span>
      <span class="lft" style="color:${ev.fg}">${_esc(when)}</span>
    </button>`;
  }).join('')+`</div>`;
}

/* "Next 30 days" — the render's own panel. Its rows are doors; an obligation
   also carries Done, which is the verb people come to this screen wanting and
   which used to mean opening the contract and scrolling to its own panel. */
function calPanelHtml(evs){
  const up=calUpcoming(evs);
  const rows=up.slice(0,40).map(e=>{
    const ev=CAL_EVENT[e.type], d=daysUntil(e.date);
    const when=d===0?i18t('cal_today'):i18t('cal_in_days',{n:d});
    const done=(e.type==='obligation'&&e.obId&&window.toggleObligationById&&(!window.canEdit||canEdit()))
      ? `<button class="cal-upn-done" data-ob-done="${_esc(e.obId)}" data-ob-cid="${_esc(e.cid)}" title="${_esc(i18t('cal_mark_complete'))}">${_esc(i18t('cal_done'))}</button>`
      : '';
    const theirs=(e.type==='obligation'&&e.theirs)
      ? `<span class="cal-theirs" title="${_esc(i18t('cal_cp_owes'))}">${_esc(i18t('cal_k_theirs'))}</span>` : '';
    return `<div class="cal-upn">
      <span class="dt">${_esc(window.regDotDate?regDotDate(e.date):e.date)}</span>
      <button class="g" data-sel="${_esc(e.cid)}">
        <span class="n2">${_esc(ev.label)} — ${_esc(e.cname)}</span>
        <span class="m3">${_esc(e.type==='obligation'?(e.note||'')+' · '+(e.owner||i18t('cal_unassigned')):(e.note||e.cid))}</span>
      </button>${theirs}${done}
      <span class="lft" style="color:${ev.fg}">${_esc(when)}</span>
    </div>`;
  }).join('');
  return `<section class="cal-card cal-panel">
    <div class="cal-panel-head"><h5>${_esc(i18t('cal_next_30'))}</h5><span class="g"></span><span class="cal-cnt">${up.length}</span></div>
    ${''/* id="cal-agenda" is KEPT from the screen this panel replaces: it is
           still the agenda, and f83's four claims about it — a Done on an
           obligation and not on an expiry, a theirs row marked, no button for a
           viewer, and the Done control outside the row's own button — are all
           still true of it. An anchor moved for no reason is a test rewritten
           for no reason. */}
    <div id="cal-agenda" class="cal-upn-list scroll-thin">${rows||`<div class="cal-empty">
      <div class="cal-empty-t">${_esc(i18t('cal_nothing_due'))}</div>
      <div class="cal-empty-s">${_esc(i18t('cal_nothing_due_sub'))}</div></div>`}</div>
    <div class="cal-panel-foot"><button class="cal-link" id="cal-open-reg">${_esc(i18t('cal_open_register'))} →</button></div>
  </section>`;
}

function renderCalendar(){
  const {y,m}=calMonth(), view=calView(), p=calPeriod();
  const all=calendarEvents();
  const evs=calVisible(all);
  const byDay={}; evs.forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });
  const decisions=calDecisionsThisWeek(evs);
  const inPeriod=evs.filter(e=>calInPeriod(e,p)).length;

  const seg=(k,label,count)=>`<a class="${view===k?'on':''}" data-cal-view="${k}" role="button" tabindex="0">${_esc(label)}${count!=null?`<span class="c">${count}</span>`:''}</a>`;
  const scopeSeg=(k,label)=>`<span class="${calScope()===k?'on':''}" data-cal-scope="${k}" role="button" tabindex="0">${_esc(label)}</span>`;

  let main='';
  if(view==='month'){
    main=`<section class="cal-card cal-grid">${calCardBarHtml(y,m)}${calMonthGridHtml(y,m,byDay,{id:'cal-grid'})}</section>`;
  } else if(view==='quarter'){
    main=`<section class="cal-card cal-grid">${calCardBarHtml(y,m)}<div class="cal-q">`+p.months.map(mm=>
      `<div class="cal-q-m"><div class="cal-q-h">${_esc(calMonthName(mm.y,mm.m))}</div>`
      +calMonthGridHtml(mm.y,mm.m,byDay,{compact:true})+`</div>`).join('')
      +`</div></section>`;
  } else {
    main=`<section class="cal-card cal-grid">${calCardBarHtml(y,m)}${calListHtml(evs,p)}</section>`;
  }

  document.getElementById('content').innerHTML=`
  <div class="view-enter cal-page">
    <style>${calStyleCss()}</style>
    <div class="cal-head">
      ${''/* The NAV'S OWN WORD, not pg_calendar's "Renewal Calendar &
             Obligations" — this file's own rule two pages up: one feature
             answering to two names is one name too many for a reader trying to
             say where they were. The render draws "Calendar" and so does the
             sidebar. */}
      <span class="ttl">${_esc(i18t('nav_calendar'))}</span>
      ${decisions?`<span class="cal-stat crit">${_esc(i18tn('cal_decisions_week',decisions,{n:decisions}))}</span>`
        :`<span class="cal-stat neu">${_esc(i18t('cal_no_decisions_week'))}</span>`}
      <span class="cal-when">${_esc(view==='month'?calMonthName(y,m):i18t('cal_three_months',{from:calMonthName(y,m),to:calMonthName(p.months[2].y,p.months[2].m)}))}</span>
      <span class="g"></span>
      <div class="cal-acts">
        <button class="ui-btn ui-btn-lg" id="cal-export" title="${_esc(i18t('cal_export_title'))}">${icon('download','w-3.5 h-3.5')} ${_esc(i18t('cal_export'))}</button>
        <button class="ui-btn ui-btn-lg" id="cal-share" title="${_esc(i18t('cal_share_title'))}">${icon('share','w-3.5 h-3.5')} ${_esc(i18t('cal_share'))}</button>
        <button class="ui-btn ui-btn-lg ui-btn-plain" id="cal-more" aria-haspopup="true" aria-expanded="false">${_esc(i18t('ct_more'))} <span aria-hidden="true">▾</span></button>
        <div id="cal-more-menu" class="cal-menu" hidden>
          <button data-cal-act="print">${_esc(i18t('cal_print'))}</button>
          <button data-cal-act="register">${_esc(i18t('cal_open_register'))}</button>
        </div>
      </div>
    </div>
    <div class="cal-bar">
      <div class="views">
        ${seg('month',i18t('cal_v_month'),view==='month'?inPeriod:null)}
        ${seg('quarter',i18t('cal_v_quarter'),view==='quarter'?inPeriod:null)}
        ${seg('list',i18t('cal_v_list'),view==='list'?inPeriod:null)}
      </div>
      <span class="g"></span>
      <span class="cal-seg">${scopeSeg('all',i18t('cal_all_dates'))}${scopeSeg('mine',i18t('cal_mine'))}</span>
    </div>
    <div class="cal-body">
      <div class="cal-split">${main}${calPanelHtml(evs)}</div>
    </div>
  </div>`;

  wireCalendar(evs, byDay, p);
  setActiveNav('calendar');
}

/* ---------------------------------------------------------------------------
   THE STYLESHEET — one place, written from the render's own numbers.
   Every colour is a token so both themes answer for free.
   ------------------------------------------------------------------------- */
function calStyleCss(){ return `
  .cal-page{height:var(--view-h);box-sizing:border-box;display:flex;flex-direction:column;min-height:0}
  /* ---- THE HEAD IS ONE WHITE BAND ---- */
  .cal-head{flex:none;background:var(--color-surface);padding:9px 24px;display:flex;align-items:center;
    gap:12px;flex-wrap:nowrap;box-shadow:inset 0 -1px var(--color-divider);min-width:0}
  .cal-head .ttl{font-family:var(--font-heading);font-size:15px;font-weight:600;color:var(--color-text);flex:none}
  .cal-head .g{flex:1;min-width:0}
  .cal-stat{font-size:14px;font-weight:700;white-space:nowrap;flex:none}
  .cal-stat.crit{color:var(--st-amber-fg)}
  .cal-stat.neu{color:var(--color-neutral-600);font-weight:400}
  .cal-when{font-size:14px;color:var(--color-neutral-600);flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-acts{display:flex;align-items:center;gap:4px;flex:none;position:relative}
  .cal-menu{position:absolute;right:0;top:calc(100% + 4px);z-index:40;min-width:200px;
    background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-md);
    padding:4px;display:flex;flex-direction:column}
  .cal-menu[hidden]{display:none}
  .cal-menu button{border:0;background:none;font:inherit;font-size:14px;text-align:left;padding:8px 10px;
    cursor:pointer;color:var(--color-text)}
  .cal-menu button:hover{background:color-mix(in srgb,var(--color-text) 6%,transparent)}
  /* ---- THE CONTROL BAR ---- */
  .cal-bar{flex:none;background:var(--color-surface);padding:0 24px;height:44px;display:flex;
    align-items:stretch;gap:12px;box-shadow:inset 0 -1px var(--color-divider);min-width:0}
  .cal-bar .g{flex:1;min-width:0}
  .cal-bar .views{display:flex;align-items:stretch;gap:2px;flex:none}
  .cal-bar .views a{display:flex;align-items:center;gap:7px;padding:0 14px;font-size:14px;font-weight:400;
    color:var(--color-text);cursor:pointer;box-shadow:inset 0 -2px transparent;white-space:nowrap}
  .cal-bar .views a.on{font-weight:700;color:var(--color-accent-800);box-shadow:inset 0 -2px var(--accent-solid)}
  .cal-bar .views a .c{font-family:var(--font-mono);font-size:12px;font-weight:400;
    font-variant-numeric:tabular-nums;color:var(--color-neutral-500)}
  .cal-bar .views a.on .c{color:var(--color-accent-800)}
  html.dark .cal-bar .views a.on,html.dark .cal-bar .views a.on .c{color:var(--color-accent-300)}
  .cal-seg{display:inline-flex;align-items:center;border:1px solid var(--color-divider);height:28px;
    flex:none;align-self:center}
  .cal-seg span{display:flex;align-items:center;padding:0 12px;font-size:13px;color:var(--color-neutral-600);cursor:pointer}
  /* accent-700, not the lighter step: white on accent-600 measures 3.74:1 and
     this is 13px. The darker step reads in both workspace accents. */
  .cal-seg span.on{background:var(--color-accent-700);color:#fff;font-weight:700}
  .cal-sel{display:inline-flex;align-items:center;gap:2px;flex:none;align-self:center}
  .cal-sel button{border:0;background:none;font:inherit;font-size:14px;color:var(--color-text);
    cursor:pointer;padding:4px 8px;line-height:1.2}
  .cal-sel button:hover{color:var(--color-accent-800)}
  .cal-sel-now{white-space:nowrap;font-variant-numeric:tabular-nums}
  /* ---- THE PAGE MEASURE, SHARED WITH THE BANDS ABOVE ---- */
  .cal-body{flex:1;min-height:0;padding:16px 24px 20px;display:flex;min-width:0}
  .cal-split{flex:1;min-height:0;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:16px}
  .cal-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:0;
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
  .cal-cardbar{flex:none;display:flex;align-items:center;gap:10px;padding:9px 12px;
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-cardbar .g{flex:1}
  .cal-cardbar .cal-legend{margin:0;padding:0;border:0;flex:none}
  .cal-dow{flex:none;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));
    background:var(--color-neutral-100);box-shadow:inset 0 -1px var(--color-divider)}
  .cal-dow span{padding:7px 8px;font-size:11px;font-weight:700;letter-spacing:.06em;
    text-transform:uppercase;color:var(--color-neutral-500);white-space:nowrap;overflow:hidden}
  .cal-weeks{flex:1;min-height:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));
    grid-template-rows:repeat(6,minmax(0,1fr));gap:1px;background:var(--color-divider)}
  .cal-day{background:var(--color-surface);padding:4px 4px 6px;display:flex;
    flex-direction:column;gap:3px;min-width:0;min-height:0;overflow:hidden}
  .cal-day.is-mute{background:var(--color-neutral-100)}
  .cal-day[data-cal-day]{cursor:pointer}
  .cal-day[data-cal-day]:hover{background:color-mix(in srgb,var(--accent-solid) 7%,transparent)}
  .cal-day[data-cal-day]:focus-visible{outline:2px solid var(--accent-solid);outline-offset:-2px}
  ${''/* THE NUMERAL IS A CHIP, so today's filled square is the same shape as
         every other day rather than a box that appears from nowhere. Tabular,
         so 9 and 30 hold one column down the week. */}
  .cal-dn{font-size:11px;font-weight:700;color:var(--color-text);font-variant-numeric:tabular-nums;
    flex:none;line-height:20px;min-width:20px;height:20px;display:inline-flex;
    align-items:center;justify-content:center;align-self:flex-start;padding:0 4px}
  .cal-day.is-mute .cal-dn{color:var(--color-neutral-400)}
  .cal-day.is-today .cal-dn{background:var(--color-accent-800);color:#fff}
  .cal-chips{display:flex;flex-direction:column;gap:2px;min-height:0;overflow:hidden}
  .cal-chip{font-size:11px;line-height:1.25;padding:2px 4px;border-left:3px solid;flex:none;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-chip.is-done{opacity:.55;text-decoration:line-through}
  .cal-more{font-size:11px;font-weight:600;color:var(--color-accent-700);flex:none}
  html.dark .cal-more{color:var(--color-accent-300)}
  .cal-dots{display:flex;gap:3px;flex-wrap:wrap;flex:none}
  /* ---- QUARTER: three months, side by side ---- */
  .cal-q{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr))}
  .cal-q-m{display:flex;flex-direction:column;min-height:0;min-width:0;
    box-shadow:inset -1px 0 var(--color-divider)}
  .cal-q-m:last-child{box-shadow:none}
  .cal-q-h{flex:none;padding:8px 10px;font-size:12px;font-weight:700;color:var(--color-text);
    box-shadow:inset 0 -1px var(--color-divider);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-q .cal-dow span{padding:5px 6px;font-size:10px;letter-spacing:.04em}
  .cal-q .cal-day{padding:4px 5px}
  .cal-q .cal-dn{font-size:11px}
  .cal-q .cal-day.is-today .cal-dn{width:18px;height:18px;font-size:11px}
  /* ---- LIST ---- */
  .cal-list{flex:1;min-height:0;overflow-y:auto}
  .cal-list-mh{padding:9px 14px 7px;font-size:11px;font-weight:700;letter-spacing:.09em;
    text-transform:uppercase;color:var(--color-neutral-600);
    background:color-mix(in srgb,var(--color-text) 3%,transparent);
    box-shadow:inset 0 -1px var(--color-divider);position:sticky;top:0;z-index:1}
  .cal-list-row{display:flex;align-items:center;gap:11px;width:100%;text-align:left;font:inherit;
    border:0;background:none;cursor:pointer;color:inherit;padding:9px 14px;
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-list-row:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
  .cal-list-row .dt{width:88px;flex:none;font-size:12px;color:var(--color-neutral-600);
    font-variant-numeric:tabular-nums}
  .cal-list-row .g{flex:1;min-width:0}
  .cal-list-row .n2{display:block;font-size:14px;color:var(--color-text);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-list-row .n2.is-done{opacity:.55;text-decoration:line-through}
  .cal-list-row .m3{display:block;font-size:12px;color:var(--color-neutral-600);
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
  .cal-list-row .lft{margin-left:auto;font-size:12px;font-weight:700;white-space:nowrap;flex:none}
  /* ---- THE LEGEND ---- */
  .cal-legend{flex:none;display:flex;gap:18px;flex-wrap:wrap;padding:10px 14px;
    box-shadow:inset 0 1px var(--color-divider)}
  .cal-legend span{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--color-neutral-600)}
  .cal-legend i{width:10px;height:10px;display:block;flex:none}
  /* ---- NEXT 30 DAYS ---- */
  .cal-panel-head{flex:none;display:flex;align-items:center;gap:8px;padding:11px 14px;
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-panel-head h5{margin:0;font-family:var(--font-heading);font-size:14px;font-weight:700;color:var(--color-text)}
  .cal-panel-head .g{flex:1}
  .cal-cnt{font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--color-neutral-600);
    font-variant-numeric:tabular-nums}
  .cal-upn-list{flex:1;min-height:0;overflow-y:auto}
  .cal-upn{display:flex;align-items:center;gap:11px;padding:9px 14px;
    box-shadow:inset 0 -1px var(--color-divider)}
  .cal-upn:hover{background:color-mix(in srgb,var(--color-text) 4%,transparent)}
  .cal-upn .dt{width:78px;flex:none;font-size:12px;color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .cal-upn .g{flex:1;min-width:0;border:0;background:none;font:inherit;text-align:left;cursor:pointer;
    color:inherit;padding:0}
  .cal-upn .n2{display:block;font-size:13px;color:var(--color-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-upn .m3{display:block;font-size:12px;color:var(--color-neutral-600);margin-top:2px;
    white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cal-upn .lft{margin-left:auto;font-size:12px;font-weight:700;white-space:nowrap;flex:none}
  .cal-upn-done{flex:none;border:1px solid var(--color-divider);background:var(--color-surface);
    padding:2px 7px;font:inherit;font-size:12px;font-weight:600;color:var(--color-accent-700);cursor:pointer}
  .cal-theirs{flex:none;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    padding:1px 4px;background:var(--st-amber-bg);color:var(--st-amber-fg)}
  .cal-panel-foot{flex:none;padding:11px 14px}
  .cal-link{border:0;background:none;font:inherit;font-size:13px;font-weight:600;
    color:var(--color-accent-700);cursor:pointer;padding:0}
  html.dark .cal-link,html.dark .cal-upn-done,html.dark .cal-more{color:var(--color-accent-300)}
  .cal-empty{padding:22px 14px;text-align:center}
  .cal-empty-t{font-size:14px;font-weight:600;color:var(--color-text)}
  .cal-empty-s{font-size:12px;color:var(--color-neutral-600);margin-top:3px;line-height:1.5}
  /* ---- NARROW ----
     Below the width where a 360px panel and a readable month can share a row,
     the two stack and the PAGE scrolls — two independently scrolling boxes on
     a phone is a trap, and the fit-the-page rule is about the desk, not about
     a 700px window. */
  @media (max-width:1023px){
    .cal-page{height:auto;min-height:var(--view-h)}
    .cal-body{padding:12px 16px 18px}
    .cal-head,.cal-bar{padding-left:16px;padding-right:16px}
    .cal-split{grid-template-columns:minmax(0,1fr);height:auto}
    .cal-card{min-height:380px}
    .cal-q{grid-template-columns:minmax(0,1fr)}
  }
  @media print{
    .cal-head .cal-acts,.cal-bar,.cal-panel{display:none!important}
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
  let {y,m}=calMonth();
  m+=n*(calView()==='month'?1:3);
  while(m<0){ m+=12; y--; } while(m>11){ m-=12; y++; }
  calState.ym={y,m}; renderCalendar();
}
function calSetView(v){ if(!CAL_VIEWS.includes(v)||v===calView()) return; calState.view=v; renderCalendar(); }
function calSetScope(s){ const v=s==='mine'?'mine':'all'; if(v===calScope()) return; calState.scope=v; renderCalendar(); }

function wireCalendar(evs, byDay, p){
  const $=id=>document.getElementById(id);
  $('cal-prev')?.addEventListener('click',()=>calStep(-1));
  $('cal-next')?.addEventListener('click',()=>calStep(1));
  $('cal-today')?.addEventListener('click',()=>{ calState.ym=null; renderCalendar(); });
  const press=(el,fn)=>{ el.addEventListener('click',fn);
    el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); fn(); } }); };
  document.querySelectorAll('[data-cal-view]').forEach(el=>press(el,()=>calSetView(el.getAttribute('data-cal-view'))));
  document.querySelectorAll('[data-cal-scope]').forEach(el=>press(el,()=>calSetScope(el.getAttribute('data-cal-scope'))));

  /* THE DAY CELL. One contract opens; several go to the register narrowed to
     exactly those. Keyboard too: the cell carries role="button" and a tab
     stop, so it has to answer Enter and Space like one. */
  const openDay=iso=>{
    const here=byDay[iso]||[];
    const cids=Array.from(new Set(here.map(e=>e.cid).filter(Boolean)));
    if(!cids.length) return;
    if(cids.length===1) return selectContract(cids[0]);
    const dayName=new Date(iso+'T00:00:00').toLocaleDateString(langLocale(),{day:'numeric',month:'long',year:'numeric'});
    if(typeof regShowOnly==='function') regShowOnly(cids, i18t('cal_due_on',{day:dayName}));
    else selectContract(cids[0]);   // no register loaded (a test stage) — still go somewhere
  };
  document.querySelectorAll('[data-cal-day]').forEach(el=>press(el,()=>openDay(el.getAttribute('data-cal-day'))));

  /* [data-sel] is the LIST's and the PANEL's row — never a day cell's chip.
     The chips are spans and fall through to the cell, which is why there is no
     stopPropagation here to keep in step. */
  document.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>
    selectContract(b.getAttribute('data-sel'))));

  /* Completing goes through the shared verb in js/obligations.js, which writes
     the audit line and refreshes every surface that counts them — including
     this one. A second copy of that logic here is how two screens come to
     disagree about the same tick-box. */
  document.querySelectorAll('[data-ob-done]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const o=toggleObligationById(b.getAttribute('data-ob-cid'), b.getAttribute('data-ob-done'), { from:'calendar' });
    if(o) toast(i18t('cal_marked_complete',{what:o.desc}),'ok');
  }));
  $('cal-open-reg')?.addEventListener('click',()=>setView('register'));

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
        <span style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-600);margin-bottom:5px">${_esc(i18t('cal_share_who'))}</span>
        <select id="cal-share-who" style="width:100%;padding:8px 10px;border:1px solid var(--color-divider);border-radius:0;font:inherit;font-size:14px;background:var(--color-surface);color:var(--color-text)">
          ${people.map(u=>`<option value="${_esc(u.id)}">${_esc(u.name)} — ${_esc(u.email)}</option>`).join('')}
        </select>
      </label>
      <label style="display:block;margin-top:12px">
        <span style="display:block;font-size:12px;font-weight:600;color:var(--color-neutral-600);margin-bottom:5px">${_esc(i18t('cal_share_note'))}</span>
        <textarea id="cal-share-note" rows="3" style="width:100%;padding:8px 10px;border:1px solid var(--color-divider);border-radius:0;font:inherit;font-size:14px;resize:vertical;background:var(--color-surface);color:var(--color-text)"></textarea>
      </label>
      <div class="rvd-note" style="margin-top:10px">${_esc(i18t('cal_share_privacy'))}</div>
      <div id="cal-share-err" class="rvd-note" hidden style="color:var(--danger-hover);margin-top:8px"></div>
    </div>
    <div class="rvd-foot">
      <button class="ui-btn" data-close>${_esc(i18t('act_cancel'))}</button>
      <button class="ui-btn ui-btn-primary" id="cal-share-go">${_esc(i18t('cal_share_send'))}</button>
    </div>`, { maxWidth:'520px' });
  document.querySelectorAll('#modal-root [data-close]').forEach(b=>b.addEventListener('click',closeModal));
  document.getElementById('cal-share-go')?.addEventListener('click',async ()=>{
    const btn=document.getElementById('cal-share-go');
    const err=document.getElementById('cal-share-err');
    const toId=document.getElementById('cal-share-who').value;
    const note=String(document.getElementById('cal-share-note').value||'').slice(0,1000);
    btn.disabled=true; btn.textContent=i18t('cal_share_sending');
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

Object.assign(window,{calState,calMonth,calView,calScope,CAL_VIEWS,CAL_EVENT,CAL_PRIORITY,
  calendarEvents,calEventMine,calPeriod,calVisible,calDecisionsThisWeek,calWeekBounds,
  calToday,calChipText,calIcsFor,calUpcoming,calSummaryLines,calMonthGridHtml,calListHtml,calPanelHtml,
  calSetView,calSetScope,calStep,openCalendarShare,renderCalendar});
