// HaTi — Renewal calendar & obligations agenda. Globals window-attached.

let calState = { ym:null };   // {y, m} current month; null -> this month resolved at render

function calMonth(){ if(!calState.ym){ const d=new Date(); calState.ym={y:d.getFullYear(), m:d.getMonth()}; } return calState.ym; }
const CAL_EVENT = {
  expiry:     { dot:'#b0453c', fg:'#8f322b', label:'Expiry',           tint:'rgba(176,69,60,.13)' },
  renewal:    { dot:'#b8862b', fg:'#7d5a14', label:'Renewal decision', tint:'rgba(184,134,43,.15)' },
  obligation: { dot:'#2e8763', fg:'#1e6b4d', label:'Obligation',       tint:'rgba(46,135,99,.13)' },
};
// priority when a day carries more than one kind of event (drives its tint)
const CAL_PRIORITY = ['expiry','renewal','obligation'];
/* Gather every lifecycle event as {date, type, cid, cname, note}. */
function calendarEvents(){
  const out=[];
  state.contracts.forEach(c=>{
    if(c.status!=='Declined'){
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
    }
  });
  return out;
}

const _esc=s=>String(s||'').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const _dot=(color,px)=>`<span style="width:${px}px;height:${px}px;border-radius:50%;background:${color};flex:none"></span>`;

function renderCalendar(){
  const {y,m}=calMonth();
  const first=new Date(y,m,1), start=first.getDay(), days=new Date(y,m+1,0).getDate();
  const monthName=first.toLocaleDateString('en-KE',{month:'long',year:'numeric'});
  const evs=calendarEvents();
  const byDay={}; evs.forEach(e=>{ (byDay[e.date]=byDay[e.date]||[]).push(e); });
  const todayIso=new Date().toISOString().slice(0,10);

  const cell=(dnum)=>{
    const inMonth=dnum>=1&&dnum<=days;
    if(!inMonth) return `<div style="min-height:62px;min-width:0;background:transparent;border:1px solid transparent;border-radius:7px"></div>`;
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(dnum).padStart(2,'0')}`;
    const today=iso===todayIso;
    const list=byDay[iso]||[], es=list.slice(0,3), more=list.length-es.length;
    // dominant event kind drives the cell tint + border so days with an
    // expiry / renewal / obligation read as coloured boxes at a glance
    const kind=CAL_PRIORITY.find(t=>list.some(e=>e.type===t&&!e.done)) || CAL_PRIORITY.find(t=>list.some(e=>e.type===t));
    const ev=kind?CAL_EVENT[kind]:null;
    const bg=today?'rgba(89,128,166,.1)':(ev?ev.tint:'var(--color-bg)');
    const bd=today?'var(--color-accent)':(ev?ev.dot:'var(--color-divider)');
    /* min-width:0 and overflow:hidden, or the cell's min-content width is the
       longest contract name inside it and the column stretches to hold it. */
    const cellStyle=`min-height:62px;min-width:0;overflow:hidden;padding:4px 5px;display:flex;flex-direction:column;gap:2px;cursor:default;border-radius:7px;`+
      `background:${bg};border:1px solid ${bd}`;
    const numStyle=`font-family:var(--font-mono);font-size:10px;color:${today?'var(--color-accent-800)':(ev?ev.fg:'var(--color-neutral-500)')};font-weight:${today||ev?700:400}`;
    const chips=es.map(e=>{
      const ev=CAL_EVENT[e.type];
      return `<button data-sel="${e.cid}" title="${ev.label}: ${_esc(e.note)}" style="display:flex;align-items:center;gap:4px;width:100%;min-width:0;padding:0;border:0;background:none;cursor:pointer;font:inherit;text-align:left;color:inherit;font-size:9.5px;line-height:1.25;overflow:hidden;${e.done?'opacity:.45;text-decoration:line-through':''}">`+
        _dot(ev.dot,6)+`<span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.cname)}</span></button>`;
    }).join('');
    const moreLine=more>0?`<span style="font-size:9px;color:var(--color-neutral-500);padding-left:2px">+${more} more</span>`:'';
    return `<div class="cal-day" style="${cellStyle}"><span style="${numStyle}">${dnum}</span>${chips}${moreLine}</div>`;
  };
  const cells=[]; for(let i=0;i<42;i++) cells.push(cell(i-start+1));

  // agenda: upcoming events across the whole portfolio, next 60 days
  const agenda=evs.filter(e=>{ const d=daysUntil(e.date); return d>=-3 && d<=60 && !e.done; }).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,40);

  const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div>${d}</div>`).join('');

  const agendaRows=agenda.length?agenda.map(e=>{
    const ev=CAL_EVENT[e.type], d=daysUntil(e.date);
    const inTxt=d<0?Math.abs(d)+'d ago':d+'d';
    /* An obligation says WHAT is due and who owns it; an expiry or a renewal
       decision is about the contract itself, and its own name is the subject. */
    const kind=e.type==='obligation'
      ? _esc(e.note||ev.label)+' · '+_esc(e.owner||'unassigned')
      : ev.label+' · '+_esc(e.cid);
    /* THE ROW BECAME A ROW, not a button.

       It used to be one <button> wrapping everything, which is why nothing on
       this screen could ever be acted on: there was nowhere to put a second
       control, because a button inside a button is not a thing. An obligation
       row now carries "Done" beside it — the verb people come to this screen
       wanting, and which until now meant clicking through to the contract,
       scrolling to its Obligations panel and ticking it there.

       Only obligations get it. An expiry or a renewal deadline is a date, not a
       task; there is nothing to complete. */
    const doneBtn = (e.type==='obligation' && e.obId && window.toggleObligationById
        && (!window.canEdit || canEdit()))
      ? `<button data-ob-done="${_esc(e.obId)}" data-ob-cid="${_esc(e.cid)}" title="Mark this obligation complete"
           style="flex:none;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:4px;
             padding:2px 7px;font:inherit;font-size:10px;font-weight:600;color:var(--color-accent-700);cursor:pointer">Done</button>`
      : '';
    const theirsChip = (e.type==='obligation' && e.theirs)
      ? `<span title="The counterparty owes this — chase it" style="flex:none;font-size:8.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;border-radius:3px;padding:1px 4px;background:rgba(184,134,43,.15);color:#7d5a14">theirs</span>`
      : '';
    return `<div style="display:flex;align-items:center;gap:8px;width:100%;border-bottom:1px solid rgba(29,31,32,.07)" onmouseover="this.style.background='rgba(29,31,32,.04)'" onmouseout="this.style.background='none'">`+
      `<button data-sel="${e.cid}" style="display:flex;align-items:center;gap:8px;flex:1;min-width:0;padding:6px 2px;border:0;background:none;cursor:pointer;font:inherit;text-align:left;color:inherit">`+
        _dot(ev.dot,7)+
        `<span style="flex:1;min-width:0">`+
          `<span style="display:block;font-size:11.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${_esc(e.cname)}</span>`+
          `<span style="display:block;font-size:10px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${kind}</span>`+
        `</span>`+
      `</button>`+
      theirsChip+doneBtn+
      `<span style="font-size:10px;font-weight:600;font-family:var(--font-mono);color:${ev.fg};flex:none;padding-right:2px">${inTxt}</span>`+
    `</div>`;
  }).join(''):`<div style="text-align:center;padding:22px 8px">
      <div style="width:40px;height:40px;margin:0 auto 10px;display:grid;place-items:center;border-radius:8px;background:var(--color-bg);color:var(--color-neutral-500)">${icon('calendar','w-5 h-5')}</div>
      <div style="font-size:12.5px;font-weight:600;color:var(--color-text)">Nothing due in the next 60 days</div>
      <div style="font-size:11px;color:var(--color-neutral-600);margin:3px 0 12px;line-height:1.5">Expiry and renewal dates on your contracts show up here automatically.</div>
      <button id="cal-empty-reg" style="font-size:11.5px;font-weight:600;color:var(--color-accent-700);background:none;border:1px solid var(--color-divider);border-radius:4px;padding:6px 12px;cursor:pointer">Open the register</button>
    </div>`;

  /* THE REFERENCE'S NAVIGATION, which sits in the page header beside the title
     rather than inside the month card. 32px squares with an 8px radius. */
  const btnBase='width:32px;height:32px;display:grid;place-items:center;border:1px solid var(--color-divider);background:var(--color-surface);box-shadow:var(--shadow-sm);border-radius:8px;cursor:pointer;font-size:14px;color:var(--color-neutral-700);line-height:1';

  document.getElementById('content').innerHTML=`
  <div class="view-enter" style="height:var(--view-h);box-sizing:border-box;padding:14px 16px 18px;display:flex;flex-direction:column;gap:14px">
    <style>
      .cal-day{transition:box-shadow .14s ease,border-color .14s ease;position:relative}
      .cal-day:hover{border-color:var(--color-accent)!important;box-shadow:0 0 0 2px rgba(89,128,166,.32),0 4px 14px rgba(43,43,45,.16);z-index:2}
      /* ---- THE REFERENCE'S TWO-TO-ONE SPLIT ----
         Twelve-column thinking again: lg:grid-cols-3 with the month taking
         col-span-2 and the agenda the last third. Below the design's lg
         breakpoint the two stack, and the page — not an inner pane — scrolls,
         because two independently scrolling boxes on a phone is a trap. */
      .cal-split{flex:1;min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;align-items:stretch}
      .cal-split > *{min-height:0}
      .cal-month-card{grid-column:span 2}
      .cal-card{background:var(--color-surface);border:1px solid var(--color-divider);
        box-shadow:var(--shadow-sm);border-radius:16px;padding:20px;display:flex;
        flex-direction:column;min-height:0}
      .cal-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;font-size:10px;
        font-weight:700;letter-spacing:.08em;text-transform:uppercase;
        color:var(--color-neutral-500);text-align:center;margin-bottom:4px;flex:none}
      @media (max-width:1023px){
        .cal-split{grid-template-columns:minmax(0,1fr);height:auto}
        .cal-month-card{grid-column:auto}
        .cal-card{min-height:420px}
      }
    </style>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex:none;flex-wrap:wrap">
      <h4 id="cal-month" style="margin:0;font-family:var(--font-heading);font-size:17px;font-weight:700;color:var(--color-text)">${monthName}</h4>
      <div style="display:flex;gap:8px;flex:none">
        <button id="cal-prev" style="${btnBase}" title="Previous month">‹</button>
        <button id="cal-next" style="${btnBase}" title="Next month">›</button>
        <button id="cal-today" style="height:32px;padding:0 12px;border:1px solid var(--color-divider);background:var(--color-surface);box-shadow:var(--shadow-sm);border-radius:8px;cursor:pointer;font:inherit;font-size:11.5px;font-weight:600;color:var(--color-neutral-700)">Today</button>
      </div>
    </div>
    <div class="cal-split">
      <section class="cal-card cal-month-card">
        <div class="cal-wk">${weekdays}</div>
        <!-- minmax(0,1fr), NOT 1fr. A bare 1fr is minmax(auto,1fr): the track
             floor is the content's min-content width, so one long contract name
             ("Mutual Non-Disclosure Agreement — Juno Limited") pushed its column
             to 250px while the other six sat at 94px. Seven equal weeks is the
             whole point of a month grid. -->
        <div id="cal-grid" style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:repeat(6,1fr);gap:4px">${cells.join('')}</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid var(--color-divider);font-size:10px;color:var(--color-neutral-500);flex:none">
          ${Object.values(CAL_EVENT).map(v=>`<span style="display:flex;align-items:center;gap:6px">${_dot(v.dot,8)}${v.label}</span>`).join('')}
        </div>
      </section>
      <section class="cal-card">
        <h4 style="font-family:var(--font-heading);font-size:15px;font-weight:700;margin:0 0 10px;color:var(--color-text);flex:none">Next 60 Days</h4>
        <div id="cal-agenda" class="scroll-thin" style="flex:1;min-height:0;overflow-y:auto">${agendaRows}</div>
      </section>
    </div>
  </div>`;

  document.getElementById('cal-prev').addEventListener('click',()=>{ let {y,m}=calMonth(); m--; if(m<0){m=11;y--;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-next').addEventListener('click',()=>{ let {y,m}=calMonth(); m++; if(m>11){m=0;y++;} calState.ym={y,m}; renderCalendar(); });
  document.getElementById('cal-today').addEventListener('click',()=>{ calState.ym=null; renderCalendar(); });
  document.querySelectorAll('[data-sel]').forEach(b=>b.addEventListener('click',()=>selectContract(b.getAttribute('data-sel'))));
  /* Completing goes through the shared verb in js/obligations.js, which writes
     the audit line and refreshes every surface that counts them — including
     this one. A second copy of that logic here is how two screens come to
     disagree about the same tick-box. */
  document.querySelectorAll('[data-ob-done]').forEach(b=>b.addEventListener('click',e=>{
    e.stopPropagation();
    const o=toggleObligationById(b.getAttribute('data-ob-cid'), b.getAttribute('data-ob-done'), { from:'calendar' });
    if(o) toast(`Marked complete: ${o.desc}`);
  }));
  document.getElementById('cal-empty-reg')?.addEventListener('click',()=>setView('register'));
  setActiveNav('calendar');
}

Object.assign(window,{calState,calMonth,calendarEvents,renderCalendar});
