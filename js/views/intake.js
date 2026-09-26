/* ============================================================
   THE INTAKE FRONT DOOR (W2-2, WORKORDER-gap-map.md)
   ============================================================
   The screen a colleague who may NOT draft uses to ask for a contract, and
   the queue the people who may draft work from. One view, two faces,
   decided by the reader's role — the same shape the Advice Desk already
   uses for outside customers, pointed inward.

   WHY IT IS A REQUEST AND NOT A DRAFT. The obvious build is "let a viewer
   create a Draft contract"; it is wrong twice. It would put unapproved
   paper in the register, in the counts and in everybody's lists, and it
   would hand the right to write contracts to people the workspace
   deliberately did not give it to. A request is its own record: it appears
   in no contract list, it grants nothing, and when it is declined nothing
   is left behind to tidy up.

   ASKING NEVER GRANTS EDIT RIGHTS. That is the whole feature — reach
   without permission creep — and it is why every act that produces actual
   paper still runs through canEdit and the ordinary creation path.

   THE AI IS A SUGGESTION AT THE EDITOR'S ELBOW, never an author: it reads
   the request and names the template it thinks fits, and the editor presses
   the button that creates the draft. Nothing is created without a person. */

const INTAKE_STATUS = {
  open:      { get label(){ return i18t('ik_st_open'); },      tone:'amber' },
  /* ---- SOMEBODY HOLDS IT: "BEING WORKED ON", NEVER "WAITING" (Young ruled
     26 Sep 2026, the second of the three rulings) ----
     Not a status anybody sets: an OPEN request somebody has picked up is
     read as held (intakeStatusKey). The stored status stays `open`, so no
     mail is sent by picking it up — the person who asked is told when it is
     drafted or declined, which is what every screen promises them. */
  held:      { get label(){ return i18t('ik_st_held'); },      tone:'steel' },
  accepted:  { get label(){ return i18t('ik_st_accepted'); },  tone:'steel' },
  done:      { get label(){ return i18t('ik_st_done'); },      tone:'green' },
  declined:  { get label(){ return i18t('ik_st_declined'); },  tone:'ruby'  },
  withdrawn: { get label(){ return i18t('ik_st_withdrawn'); }, tone:'steel' },
};
const IK_LIVE = ['open','accepted'];
let _intake = { list:[], loaded:false };

function intakeMine(){ const me=currentUser(); return (_intake.list||[]).filter(r=>me&&r.by&&r.by.id===me.id); }
function intakeQueue(){ return (_intake.list||[]).filter(r=>IK_LIVE.includes(r.status)); }
/* ONE COUNT, and it answers for the reader's chair: an editor is told what
   is waiting to be picked up, everybody else what they themselves are still
   waiting on. A badge that counted somebody else's work would be noise. */
function intakeCount(){
  if(typeof canEdit==='function'&&canEdit()) return intakeQueue().length;
  return intakeMine().filter(r=>IK_LIVE.includes(r.status)).length;
}
async function loadIntake(){
  /* ---- THE FLAG LANDS ON EVERY PATH, INCLUDING THE ONE THAT FETCHES NOTHING ----
     renderIntake ends with `if(!_intake.loaded) loadIntake().then(renderIntake)`,
     which is a re-render chained onto a promise. In local mode API_MODE() is
     false and this returned on its first line WITHOUT setting the flag, so the
     promise resolved immediately, the render ran again, the flag was still
     false, and it chained again — an unbounded microtask loop that starves the
     event loop and FREEZES THE TAB. Measured from outside the page: responsive
     before, answering nothing at all after.
     "Loaded" here means "we have asked as far as this deployment can ask",
     which in local mode is answered the moment we know there is no server. */
  if(!(typeof API_MODE==='function'&&API_MODE())){ _intake.loaded=true; return; }
  try{ const r=await api('intake'); _intake.list=(r&&r.requests)||[]; _intake.loaded=true; }
  catch(e){ _intake.loaded=true; }
}

/* ═══ THE CLOCK (S4, 16 Sep 2026) ═════════════════════════════════════════
   *"What it does not carry is the four things that turn an inbox into a
   queue: how it was routed, who is holding it, when it was promised, and a
   way for the person who asked to find out without asking again."*

   THREE FACTS, AND THEY ARE THREE DIFFERENT KINDS OF FACT, which is why they
   are built three different ways:

     ROAD is WORKED OUT, never typed. Nobody asking for a contract knows
     whether it is routine, and asking them would be the enterprise intake
     form this product exists to avoid. It is read off the request's own words
     and this workspace's own book — and it SAYS WHAT IT READ, on the hover,
     because a routing nobody can question is a routing nobody can correct.

     WITH is a NAME somebody put there. There is no clever answer to "who is
     holding this"; somebody picks it up.

     PROMISED is a PROMISE THE TEAM SETS, never a prediction HaTi makes. This
     file computes no date. It prints the one a person typed, and how far off
     it is.

   THE CLOCK STOPS WHEN THE BALL IS THEIRS: a request that has been drafted,
   declined or withdrawn is no longer waiting on us, so its elapsed time is
   frozen at the moment it moved. */
const IK_ROADS = {
  lane:    { get label(){ return i18t('ik_road_lane'); },    tone:'green' },
  routine: { get label(){ return i18t('ik_road_routine'); }, tone:'amber' },
  standard:{ get label(){ return i18t('ik_road_standard'); },tone:'ink'   },
  close:   { get label(){ return i18t('ik_road_close'); },   tone:'ruby'  },
};
/* THE WORDS THAT MEAN "THEIR PAPER". Matched on the requester's own sentence,
   which is the only description of the job that exists at this point. A
   request that says nothing about whose paper it is falls through to the
   ordinary road rather than to the careful one — an over-cautious default
   would mark the whole queue for a close read and the column would stop
   meaning anything. */
/* UP TO TWO WORDS MAY SIT BETWEEN "their" AND THE NOUN, because that is how
   people write it: *"Their own NDA template arrived"* is the other side's
   paper and the first draft of this pattern read it as ours — measured, it
   cleared a request a lane should never have touched. Two is the ceiling on
   purpose: at three, "their side of the agreement" starts matching, and that
   is a sentence about our own paper. */
const IK_THEIR_PAPER = /\btheir (?:own\s+)?(?:\w+\s+){0,2}(?:paper|terms|form|template|contract|agreement|draft|nda|msa)\b|\bthey (?:have )?sent\b|\bsent (?:us|their)\b|\breview (?:their|the attached)\b|\bon their paper\b/i;
const IK_MONEY = /(?:KES|Ksh|USD|EUR|GBP|\$|€|£)\s?[\d,.]+|\b\d[\d,.]*\s?(?:m|million|bn|billion)\b/i;
/* Have we ever dealt with this counterparty? Asked of the book the reader can
   already see — no route, and `state.contracts` is the scoped list, so a
   counterparty in a stream this person cannot reach reads as new to them,
   which is the honest answer from their chair. */
function ikKnownCounterparty(name){
  const n=String(name||'').trim().toLowerCase();
  if(!n) return false;
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  return cs.some(c=>c&&String(c.counterparty||'').trim().toLowerCase()===n);
}
/* `{k, why}` — the road, and the sentence that explains it. The lane wins
   over everything: a rule that fired is a fact, not a judgement. */
function intakeRoad(r){
  if(!r) return { k:'standard', why:'' };
  if(r.lane) return { k:'lane', why:i18t('ik_why_lane',{name:r.lane}) };
  const text=`${r.title||''} ${r.need||''}`;
  const theirs=IK_THEIR_PAPER.test(text);
  const money=IK_MONEY.test(text);
  const known=ikKnownCounterparty(r.counterparty);
  const why=[];
  if(theirs) why.push(i18t('ik_why_their_paper'));
  if(r.counterparty && !known) why.push(i18t('ik_why_new_cp'));
  if(money) why.push(i18t('ik_why_money'));
  /* THEIR PAPER WITH A COUNTERPARTY NOBODY HAS DEALT WITH IS A CLOSE READ —
     the artifact's own example, and the two halves are asked together because
     either alone is ordinary work. */
  if(theirs && (!r.counterparty || !known)) return { k:'close', why:why.join(' · ') };
  if(theirs || money) return { k:'standard', why:why.join(' · ') };
  if(!r.counterparty || known) return { k:'routine', why:i18t('ik_why_routine') };
  return { k:'standard', why:why.join(' · ') };
}
/* WHEN THE CLOCK STOPPED, or null while it is still running. */
const IK_STOPPED = ['done','declined','withdrawn'];
function intakeStoppedAt(r){
  if(!r || !IK_STOPPED.includes(r.status)) return null;
  return r.decidedAt || r.updatedAt || null;
}
/* How long this request has taken, in minutes, or null where either end is
   missing. Never negative. */
function intakeMinutes(r){
  if(!r || !r.createdAt) return null;
  const from=Date.parse(r.createdAt); if(!from) return null;
  const toIso=intakeStoppedAt(r);
  const to=toIso?Date.parse(toIso):Date.now();
  if(!to) return null;
  return Math.max(0, Math.round((to-from)/60000));
}
/* THE MEDIAN THE TEAM ACTUALLY ACHIEVES — over requests that STOPPED this
   calendar month, in days to one decimal. Null below IK_MEDIAN_MIN, because a
   median of one is a number dressed as a statistic. */
const IK_MEDIAN_MIN = 2;
function intakeMedianDays(list){
  const now=new Date();
  const ms=(list||[]).filter(r=>{
    const at=intakeStoppedAt(r); if(!at) return false;
    const d=new Date(at); if(isNaN(d)) return false;
    return d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
  }).map(intakeMinutes).filter(n=>n!=null).sort((a,b)=>a-b);
  if(ms.length<IK_MEDIAN_MIN) return null;
  const mid=Math.floor(ms.length/2);
  const m=(ms.length%2)?ms[mid]:((ms[mid-1]+ms[mid])/2);
  return Math.round((m/1440)*10)/10;
}
/* WHAT THE PROMISED CELL SAYS. Four answers and each is a different fact:
   the request is finished (how long it took), the date has passed, it is
   close, or it is a date. Null where nobody has promised anything — an
   em-dash, never an invented date. */
function intakePromise(r){
  const stopped=intakeStoppedAt(r);
  if(stopped){
    const mins=intakeMinutes(r);
    if(mins==null) return null;
    return { k:'done', tone:'green', text: mins<60
      ? i18tn('ik_done_min',mins,{n:mins})
      : (mins<1440 ? i18tn('ik_done_hour',Math.round(mins/60),{n:Math.round(mins/60)})
                   : i18tn('ik_done_day',Math.round(mins/1440),{n:Math.round(mins/1440)})) };
  }
  if(!r || !r.promisedAt) return null;
  /* END OF THE PROMISED DAY, not its midnight start: a date promised for
     today is not late at one minute past midnight. */
  const due=Date.parse(String(r.promisedAt).slice(0,10)+'T23:59:59');
  if(!due) return null;
  const left=due-Date.now();
  if(left<0){ const d=Math.max(1,Math.round(-left/86400000));
    return { k:'over', tone:'ruby', text:i18tn('ik_over_day',d,{n:d}) }; }
  const hours=Math.round(left/3600000);
  if(hours<=24) return { k:'soon', tone:'amber', text:i18tn('ik_left_hour',hours,{n:hours}) };
  let when=''; try{ when=new Date(due).toLocaleDateString(langLocale(),{weekday:'short',day:'numeric',month:'short'}); }catch(_){ when=String(r.promisedAt).slice(0,10); }
  return { k:'ahead', tone:'ink', text:when };
}
/* Past its date, and still ours. Counted on the heading. */
function intakePastDue(list){
  return (list||[]).filter(r=>{ const p=intakePromise(r); return p && p.k==='over'; }).length;
}
/* WHERE THE PERSON WHO ASKED GOES TO FIND OUT. The server minted the token;
   this only builds the address. Null where there is none — a link that cannot
   work is not drawn. */
/* ---- WHO ANSWERS, AND HOW LONG IT USUALLY TAKES (upgrade 4, 18 Sep 2026) ----
   The refusal on "describe what you need" offers Requests, and an offer that
   cannot say what happens next is the dead end it replaced. BOTH HALVES ARE
   FACTS OFF THE RECORD, never a promise: the names are the people who have
   actually picked requests up, and the figure is intakeMedianDays, which
   REFUSES below IK_MEDIAN_MIN rather than average two requests into a claim.
   Either half may be absent and the sentence simply leaves it out; null where
   it can say nothing at all, which is the honest answer on day one. */
function intakeAnswerLine(){
  const list=(_intake&&Array.isArray(_intake.list))?_intake.list:[];
  if(!list.length) return null;
  const names=[];
  for(const r of list){ const n=r&&r.assignee&&String(r.assignee.name||'').trim();
    if(n && !names.includes(n)) names.push(n); }
  const days=intakeMedianDays(list);
  const who=names.length?names.slice(0,2).join(' & '):'';
  if(who && days!=null) return i18t('ik_answers_who_when',{who,days});
  if(who) return i18t('ik_answers_who',{who});
  if(days!=null) return i18t('ik_answers_when',{days});
  return null;
}
function intakeTrackUrl(r){
  if(!r || !r.trackToken) return null;
  try{ return location.origin + '/track/' + encodeURIComponent(r.trackToken); }
  catch(_){ return '/track/' + (r.trackToken||''); }
}

/* ═══ CLEARANCE LANES (S3, 16 Sep 2026) ═══════════════════════════════════
   *"A clearance lane is four conditions and a destination, written down and
   named on the record when it fires."* — which is the whole of it, and is
   deliberately NOT a drag-and-drop workflow builder.

   THE RULE LIVES IN SETTINGS, where HaTi keeps its rules; this file only
   READS it. A lane is {id, name, template, folder, maxValue, knownOnly} and
   every condition it does not state is a condition it does not test.

   IT NAMES ITSELF ON THE RECORD WHEN IT FIRES. A rule that cleared a request
   invisibly is a rule nobody can audit, so `lane` is written to the request
   and the row says "Cleared by a lane" with the rule's own name on the hover.

   IT DOES NOT SIGN ANYTHING. The lane produces a draft on the ordinary
   creation path; every wall between a draft and a signature — the signers,
   the approval chain, the check, the cap — is untouched. */
const intakeLanes = () => { try{ return (state.settings&&Array.isArray(state.settings.intakeLanes))?state.settings.intakeLanes:[]; }catch(_){ return []; } };
function intakeLaneFor(r){
  if(!r || r.status!=='open' || r.lane) return null;
  const text=`${r.title||''} ${r.need||''}`;
  for(const L of intakeLanes()){
    if(!L || L.on===false || !L.template) continue;
    if(L.folder && String(L.folder)!==String(r.folder||'')) continue;
    /* THEIR PAPER IS NEVER ROUTINE. No lane clears a request to review
       somebody else's wording, whatever else it says — that is the one
       condition a lane may not switch off. */
    if(IK_THEIR_PAPER.test(text)) continue;
    if(L.knownOnly && !ikKnownCounterparty(r.counterparty)) continue;
    /* A FIGURE IN THE ASK IS A FIGURE THE LANE HAS TO BE ABLE TO CLEAR. The
       request carries no value field, so a lane with a ceiling refuses any
       request that mentions money at all rather than guessing the amount. */
    if(L.maxValue!=null && L.maxValue!=='' && IK_MONEY.test(text)) continue;
    if(L.words){ try{ if(!new RegExp(L.words,'i').test(text)) continue; }catch(_){ continue; } }
    return L;
  }
  return null;
}

function ikChip(status){
  const s=INTAKE_STATUS[status]||INTAKE_STATUS.open;
  return `<span class="pill-x" style="background:var(--st-${s.tone}-bg);color:var(--st-${s.tone}-fg)">${esc(s.label)}</span>`;
}
/* THE ONE READING OF WHICH WORD A REQUEST WEARS: its stored status, except
   that an open request somebody is holding is being worked on. The tracker
   page on the server asks the same question of the same two columns. */
function intakeStatusKey(r){
  if(r && r.status==='open' && r.assignee && r.assignee.id) return 'held';
  return (r && r.status) || 'open';
}
function ikRowHtml(r, opts={}){
  const when=(()=>{ try{ return new Date(r.createdAt).toLocaleDateString(langLocale(),{day:'numeric',month:'short'}); }catch(_){ return ''; } })();
  const may=(typeof canEdit==='function'&&canEdit());
  const me=currentUser();
  const isMine=!!(me&&r.by&&r.by.id===me.id);
  const acts=[];
  if(may&&r.status==='open') acts.push(`<button class="ui-btn ui-btn-sm" data-ik-draft="${esc(r.id)}">${i18t('ik_act_draft')}</button>`);
  /* S4's two doors, and they only exist for somebody who could act on it.
     "Pick it up" puts the presser's own name on the row — never a picker of
     colleagues, because holding a request is something you do, not something
     you assign to somebody else. */
  if(may&&IK_LIVE.includes(r.status)) acts.push(`<button class="ui-btn ui-btn-sm" data-ik-pick="${esc(r.id)}">${
    esc(intakePickLabel(r))}</button>`);
  if(may&&IK_LIVE.includes(r.status)) acts.push(`<button class="ui-btn ui-btn-sm" data-ik-promise="${esc(r.id)}">${
    esc(r.promisedAt?i18t('ik_act_repromise'):i18t('ik_act_promise'))}</button>`);
  if(may&&r.status==='open') acts.push(`<button class="ui-btn ui-btn-sm" data-ik-decline="${esc(r.id)}">${i18t('ik_act_decline')}</button>`);
  if(r.contractId) acts.push(`<button class="ui-btn ui-btn-sm" data-ik-open="${esc(r.contractId)}">${i18t('ik_act_open')}</button>`);
  if(isMine&&IK_LIVE.includes(r.status)) acts.push(`<button class="ui-btn ui-btn-sm" data-ik-withdraw="${esc(r.id)}">${i18t('ik_act_withdraw')}</button>`);
  return `<article class="ik-row" style="border:1px solid var(--color-divider);border-radius:var(--radius);background:var(--color-surface);padding:var(--s-3) 14px;display:grid;grid-template-columns:minmax(0,1fr) max-content;gap:6px 18px;align-items:start">
    <div style="grid-column:1;display:flex;flex-direction:column;gap:6px;min-width:0">
      <div style="display:flex;align-items:baseline;gap:9px;flex-wrap:wrap">
        <span style="font-family:var(--font-mono);font-size:var(--t-label);color:var(--color-neutral-500)">${esc(r.id)}</span>
        <span style="font-size:var(--t-card);font-weight:var(--w-strong);flex:1;min-width:0">${esc(r.title)}</span>
        ${ikChip(intakeStatusKey(r))}
      </div>
      <p style="margin:0;font-size:var(--t-meta);line-height:1.55;color:var(--color-neutral-700);white-space:pre-wrap">${esc(r.need)}</p>
      <div style="font-size:var(--t-label);color:var(--color-neutral-600)">
        ${esc(i18t('ik_asked_by',{name:(r.by&&r.by.name)||'—',date:when}))}${r.counterparty?' · '+esc(r.counterparty):''}${r.folder&&FOLDERS[r.folder]?' · '+esc(FOLDERS[r.folder].name):''}
        ${r.note?`<div style="margin-top:3px;font-style:italic">${esc(r.note)}</div>`:''}
      </div>
      ${acts.length?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">${acts.join('')}</div>`:''}
    </div>
    ${ikClockHtml(r)}
  </article>`;
}
/* ---- THE THREE FACTS, ON THE RIGHT OF A ROW THAT HAD ROOM FOR THEM ----
   Label above value, the product's own grammar for a fact, and an EM-DASH
   where nobody has said — never a guess and never a blank. The tracker link
   sits beside them because it is the fourth thing the queue was missing and
   it belongs to the same question: where has this got to. */
const IK_TONE = { green:'var(--st-green-fg)', amber:'var(--st-amber-fg)',
  ruby:'var(--st-ruby-fg)', ink:'var(--color-text)' };
function ikFactHtml(label, value, tone, title){
  return `<div style="min-width:78px">
    <div style="font-size:var(--t-label);color:var(--color-neutral-600);white-space:nowrap">${esc(label)}</div>
    <div ${title?`title="${esc(title)}"`:''} style="font-size:var(--t-meta);font-weight:var(--w-strong);white-space:nowrap;color:${IK_TONE[tone]||IK_TONE.ink}">${value||'&mdash;'}</div>
  </div>`;
}
function ikClockHtml(r){
  const road=intakeRoad(r);
  const rd=IK_ROADS[road.k]||IK_ROADS.standard;
  const p=intakePromise(r);
  const url=intakeTrackUrl(r);
  return `<div class="ik-clock" style="grid-column:2;display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
    ${ikFactHtml(i18t('ik_f_road'), esc(rd.label), rd.tone, road.why)}
    ${ikFactHtml(i18t('ik_f_with'), r.assignee&&r.assignee.name?esc(r.assignee.name):'', 'ink')}
    ${ikFactHtml(i18t('ik_f_promised'), p?esc(p.text):'', p?p.tone:'ink')}
    ${url?`<button data-ik-track="${esc(r.id)}" title="${esc(i18t('ik_track_title'))}"
      class="ui-link" style="margin-top:15px">${esc(i18t('ik_track'))}</button>`:''}
  </div>`;
}

/* ---- THE ASK. Plain words, one line and a paragraph: a form that demanded
   contract type, value and dates would be the enterprise intake form this
   product exists to avoid, and the person filling it in does not know those
   answers — that is WHY they are asking. Two optional facts (who it is with,
   which stream) because they are the two the requester always does know. */
/* ---- IT TAKES WHAT THE READER ALREADY SAID (upgrade 4, 18 Sep 2026) ----
   "Describe what you need" answers "nothing fits" more often than anything
   else for a business signing thirty contracts a year, and it sent them back
   to the picker holding the same problem they arrived with. The honest next
   step is Requests, which already takes the ask as its own record and grants
   nothing by taking it — so the refusal carries a door to THIS form, with the
   sentence they typed already in the box. Additive: every older caller passes
   nothing and draws exactly what it drew before. */
function openIntakeForm(pre){
  const streams=(typeof visibleFolders==='function')?visibleFolders():Object.values(FOLDERS||{});
  /* READS THE ONE PAIR (25 Aug 2026). It was a local copy on its own
     padding and type; seven such copies in three flavours is how a form ends
     up two pixels off the form beside it. Through window because this is a
     module and a bare cross-module read throws. */
  const FLD=window.HATI_FLD;
  const LBL=window.HATI_LBL;
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-1)">${i18t('ik_ask_title')}</h3>
    ${''/* THE HELPING SENTENCE LIVES WHERE THE ASKING HAPPENS (Young ruled
          26 Sep 2026, the third of the three rulings). It sat on the page,
          above a list, where the person it was written for had not yet
          pressed anything; it is read now at the one moment it helps. */}
    <p id="ik-lead" style="margin:0 0 14px;font-size:var(--t-body);color:var(--color-neutral-600);line-height:1.5">${esc(i18t('ik_lead_asker'))}</p>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('ik_f_title')}</span>
      <input id="ik-title" value="${esc(String((pre&&pre.title)||''))}" style="${FLD}" placeholder="${esc(i18t('ik_f_title_ph'))}" maxlength="200"/></label>
    <label style="display:block;margin-bottom:10px"><span style="${LBL}">${i18t('ik_f_need')}</span>
      <textarea id="ik-need" rows="5" style="${FLD};height:auto;resize:vertical" placeholder="${esc(i18t('ik_f_need_ph'))}" maxlength="4000">${esc(String((pre&&pre.need)||''))}</textarea></label>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <label style="flex:1;min-width:170px"><span style="${LBL}">${i18t('ik_f_who')}</span>
        <input id="ik-cp" style="${FLD}" maxlength="200"/></label>
      <label style="flex:1;min-width:170px"><span style="${LBL}">${i18t('ik_f_stream')}</span>
        <select id="ik-folder" style="${FLD}">
          <option value="">${esc(i18t('ik_f_stream_unsure'))}</option>
          ${streams.map(f=>`<option value="${esc(f.id)}">${esc(f.name)}</option>`).join('')}
        </select></label>
    </div>
    <p id="ik-err" style="font-size:var(--t-meta);color:var(--st-ruby-fg);min-height:16px;margin:var(--s-2) 0 0"></p>
    <div style="display:flex;gap:var(--s-2);justify-content:flex-end;margin-top:10px">
      <button id="ik-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="ik-send" class="ui-btn ui-btn-primary">${i18t('ik_send')}</button>
    </div>
  </div>`,{maxWidth:'560px'});
  document.getElementById('ik-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('ik-send')?.addEventListener('click',async()=>{
    const g=id=>(document.getElementById(id)||{value:''}).value.trim();
    const err=document.getElementById('ik-err');
    if(!g('ik-title')||!g('ik-need')){ if(err) err.textContent=i18t('ik_need_both'); return; }
    const btn=document.getElementById('ik-send'); if(btn) btn.disabled=true;
    try{
      const made=await api('intake','POST',{ title:g('ik-title'), need:g('ik-need'),
        counterparty:g('ik-cp'), folder:g('ik-folder') });
      closeModal();
      await loadIntake();
      /* ---- AND IT HANDS BACK THE TRACKER (upgrade 4) ----
         The asker can follow it without a seat and without asking anybody. The
         link is the record's own (intakeTrackUrl); where the server did not
         mint a token the toast is exactly what it always was. */
      const id=(made&&(made.id||(made.request&&made.request.id)))||null;
      const row=id?((_intake.list||[]).find(r=>String(r.id)===String(id))||null):null;
      const url=row?intakeTrackUrl(row):null;
      if(url && window.openIntakeTracker) openIntakeTracker(url);
      else toast(i18t('ik_sent'),'ok');
      if(state.view==='intake') renderIntake();
      if(window.updateSidebarCounts) updateSidebarCounts();
    }catch(e){ if(err) err.textContent=(e&&e.message)||i18t('ik_failed'); if(btn) btn.disabled=false; }
  });
}

/* The link back, as a receipt rather than a page: one line, the link itself,
   and Copy. Nothing else happened, so nothing else is said. */
function openIntakeTracker(url){
  const e=s=>String(s==null?'':s).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:17px;margin:0 0 6px">${i18t('ik_sent')}</h3>
    <p style="margin:0 0 12px;font-size:var(--t-meta);color:var(--color-neutral-600);line-height:1.5">${i18t('ik_track_lead')}</p>
    <input id="ik-track-url" readonly value="${e(url)}" style="${window.HATI_FLD};font-family:var(--font-mono);font-size:var(--t-label)"/>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px">
      <button id="ik-track-copy" class="ui-btn">${i18t('ik_track_copy')}</button>
      <button id="ik-track-done" class="ui-btn ui-btn-primary">${i18t('act_done')}</button>
    </div></div>`,{ maxWidth:(window.DLG_W&&DLG_W.m)||'520px' });
  document.getElementById('ik-track-done')?.addEventListener('click',closeModal);
  document.getElementById('ik-track-copy')?.addEventListener('click',()=>{
    const el=document.getElementById('ik-track-url'); if(!el) return;
    el.select(); try{ navigator.clipboard.writeText(el.value); }catch(_){ try{ document.execCommand('copy'); }catch(__){} }
    toast(i18t('ik_track_copied'),'ok');
  });
}

/* ---- TURNING A REQUEST INTO PAPER. The AI reads the request and names the
   template it thinks fits; the EDITOR presses the button. Where Copilot is
   not connected the picker still opens on the full list, so the door works
   without it — the AI shortens the choice, it does not own it. */
async function intakeSuggestTemplate(r){
  const cands=Object.entries(TEMPLATES||{}).map(([id,t])=>({ id, name:t.name, kind:t.kind,
    folder:(FOLDERS[t.folder]||{}).name||'', blurb:t.blurb||'' }));
  if(!cands.length) return null;
  if(!(typeof API_MODE==='function'&&API_MODE())||!state.aiConfigured) return null;
  try{
    const res=await api('ai/template','POST',{ query:`${r.title}\n\n${r.need}`, candidates:cands });
    const top=(res&&Array.isArray(res.ranked)&&res.ranked[0])||null;
    return top&&top.id&&TEMPLATES[top.id] ? { id:top.id, why:top.why||res.answer||'' } : null;
  }catch(_){ return null; }
}
async function intakeDraft(id){
  if(!canEdit()){ toast(i18t('ap_viewers_no_create'),'err'); return; }
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const btnBusy=document.querySelector(`[data-ik-draft="${CSS.escape(id)}"]`);
  if(btnBusy){ btnBusy.disabled=true; btnBusy.textContent=i18t('ct_working'); }
  const pick=await intakeSuggestTemplate(r);
  const ids=Object.keys(TEMPLATES||{});
  const FLD=window.HATI_FLD;
  openModal(`<div style="padding:24px">
    <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:18px;margin:0 0 var(--s-1)">${i18t('ik_draft_title')}</h3>
    <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 var(--s-3);line-height:1.55">${esc(r.title)}</p>
    ${pick?`<p style="font-size:var(--t-meta);line-height:1.55;margin:0 0 10px;padding:9px 11px;background:var(--st-green-bg);color:var(--st-green-fg);border-radius:var(--radius)">
      ${esc(i18t('ik_suggested',{name:TEMPLATES[pick.id].name}))}${pick.why?' '+esc(pick.why):''}</p>`
      :`<p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 10px">${esc(i18t('ik_no_suggestion'))}</p>`}
    <label style="display:block;margin-bottom:var(--s-3)"><span style="display:block;font-size:var(--t-label);font-weight:var(--w-strong);margin-bottom:var(--s-1)">${i18t('ik_pick_template')}</span>
      <select id="ik-tpl" style="${FLD}">
        ${ids.map(t=>`<option value="${esc(t)}"${pick&&pick.id===t?' selected':''}>${esc(TEMPLATES[t].name)}</option>`).join('')}
      </select></label>
    <div style="display:flex;gap:var(--s-2);justify-content:flex-end">
      <button id="ik-d-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="ik-d-go" class="ui-btn ui-btn-primary">${i18t('ik_create_draft')}</button>
    </div>
  </div>`,{maxWidth:'560px'});
  const restore=()=>{ const b=document.querySelector(`[data-ik-draft="${CSS.escape(id)}"]`); if(b){ b.disabled=false; b.textContent=i18t('ik_act_draft'); } };
  document.getElementById('ik-d-cancel')?.addEventListener('click',()=>{ closeModal(); restore(); });
  document.getElementById('ik-d-go')?.addEventListener('click',async()=>{
    const tid=(document.getElementById('ik-tpl')||{}).value;
    if(!tid||!TEMPLATES[tid]) return;
    closeModal();
    /* THE ORDINARY CREATION PATH, with the request's own facts carried in.
       createFromTemplate is the door every other template-made contract goes
       through — it stamps the owner, registers the open-on-Key-terms intent
       and files the audit line — so a requested contract is in no way a
       different kind of record from a drafted one. */
    createFromTemplate(tid);
    const c=getContract(state.activeId);
    if(c){
      if(r.counterparty&&!c.counterparty) c.counterparty=r.counterparty;
      if(r.folder&&FOLDERS[r.folder]) c.folder=r.folder;
      logAudit(c,'Requested',`Raised from request ${r.id} by ${(r.by&&r.by.name)||'a colleague'}: ${r.title}`);
      c.intakeRequestId=r.id;
      persist(c);
      try{
        await api('intake/'+encodeURIComponent(r.id),'PATCH',{ status:'done', contractId:c.id });
        await loadIntake();
        if(window.updateSidebarCounts) updateSidebarCounts();
      }catch(_){ /* the draft exists either way; the queue catches up on reload */ }
      toast(i18t('ik_drafted',{id:(window.contractRef?contractRef(c):c.id)}),'ok');
    }
  });
}
/* ---- A LANE FIRES, AND SAYS SO (S3) ----
   It runs when a person who may draft loads this page, and only then. THAT IS
   SAID OUT LOUD rather than dressed up as automation: HaTi has no server-side
   template catalogue, and building one so a lane could fire on a timer would
   be a second place contracts are minted from — the fault class this codebase
   pays for most. The clock the row prints is the REAL elapsed time either
   way, so nothing here claims a speed it did not achieve.

   IT PRESSES THE ORDINARY CREATION PATH. `createFromTemplate` is the same
   door intakeDraft uses, so a lane-cleared contract is in no way a different
   kind of record; the only difference is that `lane` is written on the
   request, which is what makes the row say who decided and lets an
   administrator audit the rule afterwards.

   ONE AT A TIME, NEWEST LAST, and it stops at the first failure — a lane that
   half-fired across a queue would be worse than one that did not fire. */
/* ---- THE LANES DO NOT WAIT FOR SOMEBODY TO OPEN THIS PAGE (21 Sep 2026,
   the process review's third item) ----

   They fired when a person who may draft LOADED the Requests page, and
   nothing ran them on a timer — so a request a rule would have cleared in
   seconds sat in the queue until a human happened to look, while the person
   who asked had been promised a date by a clock that was already running.
   The whole point of a lane is that it does not need a human.

   THE SERVER CANNOT DO THIS, and that is why it does not: the template
   catalogue lives in the browser, and giving the server one would make it a
   SECOND place contracts are minted from. So the sweep runs in whatever
   browser has HaTi open and a person in it who may draft — the same
   condition as before, without the page.

   IT COSTS NOTHING IN A WORKSPACE WITH NO LANES: the list of lanes is read
   first, and where there are none it returns before loading anything. */
const IK_SWEEP_MS = 10 * 60 * 1000;
let _ikSweepOn = false;
async function intakeLaneSweep(){
  if(typeof canEdit !== 'function' || !canEdit()) return 0;
  if(!intakeLanes().length) return 0;
  try{ if(!_intake.loaded) await loadIntake(); }catch(_){ return 0; }
  let n = 0;
  try{ n = await intakeRunLanes(); }catch(_){ return 0; }
  if(n){
    try{ if(window.updateSidebarCounts) updateSidebarCounts(); }catch(_){}
    try{ if(typeof state!=='undefined' && state.view==='intake') renderIntake(); }catch(_){}
  }
  return n;
}
function intakeSweepStart(){
  if(_ikSweepOn) return;
  _ikSweepOn = true;
  intakeLaneSweep();
  try{ setInterval(intakeLaneSweep, IK_SWEEP_MS); }catch(_){}
}
let _ikLanesRunning = false;
async function intakeRunLanes(){
  if(_ikLanesRunning) return 0;
  if(typeof canEdit!=='function' || !canEdit()) return 0;
  if(typeof createFromTemplate!=='function') return 0;
  const lanes = intakeLanes();
  if(!lanes.length) return 0;
  const todo = (_intake.list||[]).filter(r=>!!intakeLaneFor(r));
  if(!todo.length) return 0;
  _ikLanesRunning = true;
  let n = 0;
  try{
    for(const r of todo){
      const L = intakeLaneFor(r); if(!L) continue;
      if(!(typeof TEMPLATES!=='undefined' && TEMPLATES[L.template])) continue;
      /* QUIET: a lane fires without a human, so it may not take the human
         anywhere. It returns the contract it made rather than leaving the
         caller to read state.activeId back — which is also what made this
         safe to run on a timer. */
      const c = createFromTemplate(L.template, { quiet:true });
      if(!c) break;
      if(r.counterparty && !c.counterparty) c.counterparty = r.counterparty;
      if(r.folder && typeof FOLDERS!=='undefined' && FOLDERS[r.folder]) c.folder = r.folder;
      c.intakeRequestId = r.id;
      logAudit(c,'Requested',`Cleared by the "${L.name||L.id}" lane from request ${r.id}: ${r.title}`);
      persist(c);
      try{
        await api('intake/'+encodeURIComponent(r.id),'PATCH',
          { status:'done', contractId:c.id, lane:String(L.name||L.id||'').slice(0,80) });
        n++;
      }catch(_){ break; }
    }
    if(n){ await loadIntake(); if(window.updateSidebarCounts) updateSidebarCounts(); }
  } finally { _ikLanesRunning = false; }
  if(n) toast(i18tn('ik_lane_cleared',n,{n}),'ok');
  return n;
}
async function intakeSetStatus(id,status,opts={}){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  let note='';
  if(status==='declined'){
    /* THE DIALOG SAYS WHERE THE WORDS GO, and only where that is true: the
       route emails the requester their reason, so the person typing it
       should know — but a workspace with no mail provider, or one whose
       provider is refusing, must not be promised a delivery. Same rule as
       everywhere else in this product: "sent" has to mean sent. */
    const mails = typeof API_MODE==='function' && API_MODE()
      && !(typeof emailOff==='function' && emailOff())
      && !(typeof emailFailing==='function' && emailFailing());
    const said=await promptDialog({ title:i18t('ik_decline_title'),
      message:i18t('ik_decline_msg')+(mails?' '+i18t('ik_decline_emails'):''),
      confirmLabel:i18t('ik_act_decline'), cancelLabel:i18t('act_cancel') });
    if(said==null) return;
    note=String(said||'').trim();
  } else if(status==='withdrawn'){
    if(!await confirmDialog({ title:i18t('ik_withdraw_title'), message:i18t('ik_withdraw_msg'),
      confirmLabel:i18t('ik_act_withdraw') })) return;
  }
  try{
    await api('intake/'+encodeURIComponent(id),'PATCH',{ status, note });
    await loadIntake();
    renderIntake();
    if(window.updateSidebarCounts) updateSidebarCounts();
    toast(status==='declined'?i18t('ik_declined_toast'):i18t('ik_withdrawn_toast'),'ok');
  }catch(e){ toast((e&&e.message)||i18t('ik_failed'),'err'); }
}

function renderIntake(){
  const host=document.getElementById('content'); if(!host) return;
  const may=(typeof canEdit==='function'&&canEdit());
  /* THE INSPECTOR WHERE THE WIDTH HOLDS IT (26 Sep 2026). Below INS_MIN_W
     the page below is drawn exactly as it was. */
  if(typeof window.insFits==='function'&&insFits()&&typeof window.insPaintPanel==='function'){
    renderIntakeInspector(host);
    ikAfterRender(may);
    return;
  }
  _ikHead={ facts:'', acts:'' }; ikPaintHead();
  const mine=intakeMine(), queue=intakeQueue();
  /* ONE SHAPE FOR "NOTHING HERE" (25 Aug 2026) — it was a bare paragraph, one
     of seven different treatments of the same state across the product.
     Read through window: this is a module. */
  const empty=t=>(typeof window.emptyStateHtml==='function'
    ? window.emptyStateHtml({ icon:'list', title:t })
    : `<p style="font-size:var(--t-body);color:var(--color-neutral-600);line-height:1.6;margin:0">${esc(t)}</p>`);
  host.innerHTML=`
    ${''/* ---- THE PAGE HAS A MARGIN (owner-reported 19 Aug 2026, off a
           screenshot with the left edge ringed: "space is needed between the
           content and the edge of the page to look more professional") ----
           This drew at padding:0, so the heading, the lead and every row sat
           flush against the sidebar. 16px 18px 28px is this product's own page
           measure — the same one Templates, Reports and the template library
           use — rather than a number picked for this screen. */}
    <div class="view-enter" style="padding:var(--page-pad);display:flex;flex-direction:column;gap:22px;max-width:894px" data-ins-page="intake" data-ins="0">
      <section style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap">
        <div style="flex:1;min-width:220px">
          ${''/* The asker's helping sentence moved into the Ask window (Young
                ruled 26 Sep 2026); the editor's line about the queue stays. */}
          ${may?`<p style="font-size:var(--t-body);color:var(--color-neutral-600);line-height:1.6;margin:0">${esc(i18t('ik_lead_editor'))}</p>`:''}
        </div>
        <button id="ik-new" class="ui-btn ui-btn-primary" style="flex:none">${i18t('ik_ask_btn')}</button>
      </section>
      ${may?`<section>
        ${''/* ---- THE HEADING CARRIES THE CLOCK (S4) ----
              *"the heading says the median the team actually achieves beside
              the number waiting"*. Both figures are BORROWED: the count past
              its date is intakePastDue over the same queue this heading names,
              and the median is over what actually finished this month. A
              median below IK_MEDIAN_MIN draws nothing — a middle value of one
              is a number dressed as a statistic. */}
        <h3 style="font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading);margin:0 0 9px">${i18t('ik_queue_head',{n:queue.length})}<span style="font-weight:var(--w-body);color:var(--color-neutral-600)">${
          (()=>{ const over=intakePastDue(queue); const med=intakeMedianDays(_intake.list||[]);
            const bits=[]; if(over) bits.push(i18tn('ik_past_due',over,{n:over}));
            if(med!=null) bits.push(i18t('ik_median',{n:med}));
            return bits.length?' · '+bits.map(esc).join(' · '):''; })()}</span></h3>
        <div style="display:flex;flex-direction:column;gap:9px">${queue.length?queue.map(r=>ikRowHtml(r)).join(''):empty(i18t('ik_queue_empty'))}</div>
      </section>`:''}
      <section>
        <h3 style="font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading);margin:0 0 9px">${i18t('ik_mine_head')}</h3>
        <div style="display:flex;flex-direction:column;gap:9px">${mine.length?mine.map(r=>ikRowHtml(r)).join(''):empty(i18t('ik_mine_empty'))}</div>
      </section>
    </div>`;
  host.querySelector('#ik-new')?.addEventListener('click',()=>openIntakeForm());
  host.querySelectorAll('[data-ik-draft]').forEach(b=>b.addEventListener('click',()=>intakeDraft(b.getAttribute('data-ik-draft'))));
  host.querySelectorAll('[data-ik-decline]').forEach(b=>b.addEventListener('click',()=>intakeSetStatus(b.getAttribute('data-ik-decline'),'declined')));
  host.querySelectorAll('[data-ik-withdraw]').forEach(b=>b.addEventListener('click',()=>intakeSetStatus(b.getAttribute('data-ik-withdraw'),'withdrawn')));
  host.querySelectorAll('[data-ik-open]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-ik-open'))));
  host.querySelectorAll('[data-ik-pick]').forEach(b=>b.addEventListener('click',()=>intakePick(b.getAttribute('data-ik-pick'))));
  host.querySelectorAll('[data-ik-promise]').forEach(b=>b.addEventListener('click',()=>intakePromiseAsk(b.getAttribute('data-ik-promise'))));
  host.querySelectorAll('[data-ik-track]').forEach(b=>b.addEventListener('click',()=>intakeTrackCopy(b.getAttribute('data-ik-track'))));
  ikAfterRender(may);
}
/* What every paint of this page does once its markup is down, in either
   shape: say where the reader is, and load or run what has not happened. */
function ikAfterRender(may){
  if(typeof setActiveNav==='function') setActiveNav('intake');
  /* The list is fetched once per sitting and repainted here when it lands —
     the same shape the Advice Desk uses, and the reason the empty state is a
     real sentence rather than a spinner. */
  if(!_intake.loaded) loadIntake().then(()=>{ if(state.view==='intake') renderIntake(); });
  /* THE LANES RUN ONCE THE QUEUE IS ON THE FLOOR, never before it: a rule
     cannot clear a request the page has not loaded. It repaints itself if
     anything fired, and answers 0 the rest of the time, which is every time
     for a workspace that has written no lanes. */
  else if(may) intakeRunLanes().then(n=>{ if(n && state.view==='intake') renderIntake(); });
}

/* ════════════════════════════════════════════════════════════════════════
   THE INSPECTOR ON THE REQUESTS PAGE (Young chose it by name, 26 Sep 2026,
   and ruled three things with it: a request a colleague holds is TAKEN OVER
   and that asks first; a held request reads "being worked on"; the helping
   sentence moves into the Ask window)
   ════════════════════════════════════════════════════════════════════════
   The page used a third of the screen: a column of cards 894px wide. It is
   the list and the panel now, full width, from two chairs — the team that
   drafts (every request in its streams, finished ones included, with who
   holds it, the road and the date promised) and the colleague who asked (only
   their own, and what happens next). EVERY VERB IS THE ONE IT ALWAYS WAS:
   Draft it (intakeDraft), Pick it up / Put it down / Take it over
   (intakePick), Promise a date (intakePromiseAsk), Decline and Withdraw
   (intakeSetStatus), Copy the tracker link (intakeTrackCopy). NOTHING HERE
   CALLS A MODEL: looking at a request costs nothing. */
const IK_V_TEAM = [['open','ik_v_open'],['mine','ik_v_mine'],['fin','ik_v_fin'],['all','ik_v_all']];
const IK_V_ASKER = [['open','ik_v_open'],['fin','ik_v_fin_asker'],['all','ik_v_all']];
const IK_DEF = { view:'open', who:'all', road:'all', folder:'all' };
const IK_CHIPS = ['who', 'road', 'folder'];
let _ikF = null;
function ikFilters(){ if(!_ikF) _ikF={ ...IK_DEF }; return _ikF; }
let _ikHead = { facts:'', acts:'' };
function ikPaintHead(){
  if(typeof document==='undefined') return;
  const f=document.getElementById('page-head-facts'); if(f) f.innerHTML=_ikHead.facts;
  const a=document.getElementById('page-head-acts'); if(a){ a.innerHTML=_ikHead.acts;
    a.querySelector('#ik-new')?.addEventListener('click',()=>openIntakeForm()); }
}
const _ikMe = () => { try{ return (typeof currentUser==='function')?currentUser():null; }catch(_){ return null; } };
const ikIsMine = r => { const me=_ikMe(); return !!(me&&r&&r.by&&r.by.id===me.id); };
const ikHeldByMe = r => { const me=_ikMe(); return !!(me&&r&&r.assignee&&r.assignee.id===me.id); };
/* A DAY AS A READER SAYS IT, in their own language. */
function ikDay(iso, o){
  const s=String(iso||''); if(!s) return '';
  const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(s)?s+'T00:00:00':s);
  if(isNaN(d.getTime())) return '';
  const opt=Object.assign({ day:'numeric', month:'short' }, (o&&o.weekday)?{ weekday:'short' }:{},
    ((o&&o.long)||d.getFullYear()!==new Date().getFullYear())?{ year:'numeric' }:{});
  try{ return d.toLocaleDateString(langLocale(), opt); }catch(_){ return s.slice(0,10); }
}
/* How long, in the largest unit that is honest: minutes, hours, days. */
function ikTookWords(min){
  const m=Math.max(0,Number(min)||0);
  if(m<60) return i18tn('ik_t_min',m,{n:m});
  if(m<20*60){ const h=Math.round(m/60); return i18tn('ik_t_hour',h,{n:h}); }
  const d=Math.max(1,Math.round(m/1440)); return i18tn('ik_t_day',d,{n:d});
}
function ikAgeWords(r){
  const t=Date.parse(String((r&&r.createdAt)||''));
  if(!isFinite(t)) return '';
  const days=Math.max(0,Math.floor((Date.now()-t)/86400000));
  if(days===0) return i18t('ik_age_today');
  if(days===1) return i18t('ik_age_yesterday');
  return i18tn('ik_age_days',days,{n:days});
}
/* ---- WHICH PILE A REQUEST SITS IN — one reading for the groups, the head's
   counts, the status line and the views ----
   Past its promise leads (a date somebody gave is late), then nobody holds
   it, then being worked on, then finished. The team's finished pile is THIS
   MONTH's (the page is a worklist, and the month is what the median above it
   is measured over); an older one is its own pile, reached through All. */
function intakeFinishedThisMonth(r){
  const at=intakeStoppedAt(r); if(!at) return false;
  const d=new Date(at); if(isNaN(d.getTime())) return false;
  const n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth();
}
function intakeStage(r, asker){
  if(IK_STOPPED.includes(r&&r.status)) return (asker||intakeFinishedThisMonth(r))?'fin':'old';
  const p=intakePromise(r);
  if(p&&p.k==='over') return 'over';
  return intakeStatusKey(r)==='held'||(r&&r.status==='accepted')?'held':'nobody';
}
const IK_GROUPS = [
  ['over',  'ik_g_over',   'ik_g_over',          'ruby'],
  ['nobody','ik_g_nobody', 'ik_g_nobody_asker',  'amber'],
  ['held',  'ik_g_held',   'ik_g_held',          'steel'],
  ['fin',   'ik_g_fin',    'ik_g_fin_asker',     'green'],
  ['old',   'ik_g_old',    'ik_g_old',           'gray'],
];
function ikPassView(r, v, asker){
  if(v==='open') return !IK_STOPPED.includes(r.status);
  if(v==='mine') return ikIsMine(r);
  if(v==='fin') return IK_STOPPED.includes(r.status)&&(asker||intakeFinishedThisMonth(r));
  return true;
}
function ikPassChips(r, f){
  if(f.who==='me'&&!ikHeldByMe(r)) return false;
  if(f.who==='nobody'&&((r.assignee&&r.assignee.id)||IK_STOPPED.includes(r.status))) return false;
  if(f.who==='other'&&!(r.assignee&&r.assignee.id&&!ikHeldByMe(r))) return false;
  if(f.road!=='all'&&intakeRoad(r).k!==f.road) return false;
  if(f.folder!=='all'&&String(r.folder||'')!==String(f.folder)) return false;
  return true;
}
/* THE ORDER INSIDE A PILE: the oldest ask first where nobody holds it, the
   nearest promise first where somebody does, the latest finish first. */
function ikSort(a, b){
  const ga=intakeStage(a), gb=intakeStage(b);
  if(ga==='nobody'&&gb==='nobody') return String(a.createdAt||'').localeCompare(String(b.createdAt||''));
  if((ga==='fin'||ga==='old')&&(gb==='fin'||gb==='old')) return String(intakeStoppedAt(b)||'').localeCompare(String(intakeStoppedAt(a)||''));
  const pa=a.promisedAt?String(a.promisedAt):'9999', pb=b.promisedAt?String(b.promisedAt):'9999';
  return pa.localeCompare(pb)||String(a.createdAt||'').localeCompare(String(b.createdAt||''));
}
/* THE PROMISED CELL: the day in bold and what it means today under it; a
   finished request says when it finished and how long it took. */
function intakePromiseSay(r){
  if(IK_STOPPED.includes(r.status)){
    const at=intakeStoppedAt(r), mins=intakeMinutes(r);
    const t=mins==null?'':ikTookWords(mins);
    const sub=!t?'':r.status==='declined'?i18t('ik_declined_after',{t}):r.status==='withdrawn'?i18t('ik_withdrawn_after',{t}):i18t('ik_took',{t});
    return { day: at?ikDay(at):'—', sub, cls: r.status==='done'?'ins-ok':'ins-quiet' };
  }
  if(!r.promisedAt) return null;
  const iso=String(r.promisedAt).slice(0,10);
  const d=(typeof daysUntil==='function')?daysUntil(iso):null;
  const day=ikDay(iso,{ weekday:true });
  if(d==null||!isFinite(d)) return { day, sub:'', cls:'' };
  if(d<0) return { day, sub:i18tn('ik_over_day',-d,{n:-d}), cls:'ins-late' };
  if(d===0) return { day, sub:i18t('ik_pr_today'), cls:'ins-soon' };
  if(d===1) return { day, sub:i18t('ik_pr_tomorrow'), cls:'ins-soon' };
  return { day, sub:i18tn('ik_pr_in',d,{n:d}), cls: d<=3?'ins-soon':'' };
}
function ikInitials(name){ return String(name||'').trim().split(/\s+/).filter(Boolean).map(w=>w[0]).join('').slice(0,2).toUpperCase(); }
function ikWhoHtml(name, shown){
  return `<span class="ins-who"><i class="ins-av" aria-hidden="true">${esc(ikInitials(name))}</i><span title="${esc(name)}">${esc(shown||name)}</span></span>`;
}
function ikWithCellHtml(r, asker){
  if(IK_STOPPED.includes(r.status)){
    if(r.status==='declined') return `<span class="ins-quiet">${esc(i18t('ik_st_declined'))}</span>`;
    if(r.status==='withdrawn') return `<span class="ins-quiet">${esc(i18t('ik_st_withdrawn'))}</span>`;
    if(r.lane) return `<span class="ins-ok">${esc(i18t('ik_with_lane'))}</span>`;
    const n=(r.assignee&&r.assignee.name)||r.decidedBy||'';
    return n?ikWhoHtml(n):`<span class="ins-quiet">—</span>`;
  }
  if(!(r.assignee&&r.assignee.id)) return `<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
  return ikWhoHtml(r.assignee.name||'', (!asker&&ikHeldByMe(r))?i18t('ik_with_you'):'');
}
function ikRoadHtml(r){
  const road=intakeRoad(r);
  const rd=IK_ROADS[road.k]||IK_ROADS.standard;
  return `<span class="ins-road-${road.k}"${road.why?` title="${esc(road.why)}"`:''}>${esc(rd.label)}</span>`;
}
/* ---- THE PANEL: what they asked for, where it has got to, and the verbs ---- */
function ikStatusSay(r, asker){
  const g=intakeStage(r, asker);
  const tone=(IK_GROUPS.find(x=>x[0]===g)||[])[3]||'gray';
  const p=intakePromise(r);
  if(g==='over') return { tone, html:`<span class="ins-late">${esc(i18t('ik_s_over',{when:p?p.text:''}))}</span> <span class="x">· ${esc(ikHeldByMe(r)&&!asker?i18t('ik_s_held_you'):i18t('ik_s_with',{who:(r.assignee&&r.assignee.name)||''}))}</span>` };
  if(g==='nobody') return { tone, html:`${esc(i18t(asker?'ik_s_nobody_asker':'ik_s_nobody'))} <span class="x">· ${esc(i18t('ik_s_asked',{age:ikAgeWords(r)}))}</span>` };
  if(g==='held') return { tone, html:`${esc(ikHeldByMe(r)&&!asker?i18t('ik_s_you_work'):i18t('ik_s_they_work',{who:(r.assignee&&r.assignee.name)||''}))}${
    r.promisedAt?` <span class="x">· ${esc(i18t('ik_s_promised',{day:ikDay(String(r.promisedAt).slice(0,10),{weekday:true})}))}</span>`:''}` };
  const at=intakeStoppedAt(r), mins=intakeMinutes(r), t=mins==null?'':ikTookWords(mins);
  if(r.status==='declined') return { tone:'gray', html:`${esc(i18t('ik_s_declined',{date:ikDay(at)}))}${t?` <span class="x">· ${esc(i18t('ik_s_after',{t}))}</span>`:''}` };
  if(r.status==='withdrawn') return { tone:'gray', html:esc(i18t('ik_s_withdrawn',{date:ikDay(at)})) };
  return { tone:'green', html:`<span class="ins-ok">${esc(r.contractId?i18t('ik_s_drafted',{id:r.contractId}):i18t('ik_st_done'))}</span>${
    (r.lane||t)?` <span class="x">· ${esc([r.lane?i18t('ik_s_lane'):'', t?i18t('ik_s_took',{t}):''].filter(Boolean).join(' · '))}</span>`:''}` };
}
function ikActs(r, asker){
  const may=(typeof canEdit==='function'&&canEdit());
  const live=IK_LIVE.includes(r.status);
  const acts=[], menu=[];
  const track=!!intakeTrackUrl(r);
  const openAct=r.contractId?{ k:'open', kind:'accent', label:i18t('ik_act_open_mk',{id:r.contractId}), run:()=>openWorkspace(r.contractId) }:null;
  if(asker){
    if(live&&ikIsMine(r)) acts.push({ k:'withdraw', label:i18t('ik_act_withdraw'), title:i18t('ik_withdraw_msg'), run:()=>intakeSetStatus(r.id,'withdrawn') });
    if(openAct&&r.status==='done') acts.unshift(openAct);
    if(track) acts.push({ k:'track', label:i18t('ik_act_copy_track'), icon:'link', title:i18t('ik_track_title'), run:()=>intakeTrackCopy(r.id) });
    return { acts, menu:'' };
  }
  if(may&&r.status==='open') acts.push({ k:'draft', kind:'accent', label:i18t('ik_act_draft'), icon:'pencil', attrs:`data-ik-draft="${esc(r.id)}"`, run:()=>intakeDraft(r.id) });
  if(may&&live) acts.push({ k:'pick', label:intakePickLabel(r), run:()=>intakePick(r.id) });
  if(may&&live) acts.push({ k:'promise', label:r.promisedAt?i18t('ik_act_repromise'):i18t('ik_act_promise'), title:i18t('ik_promise_msg'), run:()=>intakePromiseAsk(r.id) });
  if(openAct&&r.status==='done') acts.unshift(openAct);
  if(may&&r.status==='open') menu.push(insMenuItemHtml({ k:'decline', label:i18t('ik_act_decline'), ruby:true, says:i18t('ik_decline_msg') }));
  if(live&&(ikIsMine(r)||(typeof isAdmin==='function'&&isAdmin()))) menu.push(insMenuItemHtml({ k:'withdraw', label:i18t('ik_act_withdraw'), says:i18t('ik_withdraw_msg') }));
  if(track) menu.push(insMenuItemHtml({ k:'track', label:i18t('ik_act_copy_track'), icon:'link', says:i18t('ik_track_title') }));
  return { acts, menu:menu.join('') };
}
function ikBookHtml(r){
  const cp=String(r.counterparty||'').trim();
  if(!cp) return '';
  const n=cp.toLowerCase();
  const cs=((window.state&&state.contracts)||[]).filter(c=>c&&String(c.counterparty||'').trim().toLowerCase()===n);
  if(!cs.length) return insSecHtml(cp, '', `<p class="ins-p">${esc(i18t('ik_new_cp',{cp}))}</p>`, 'ik-book');
  const shown=cs.slice(0,6);
  const kind=c=>{ try{ return (typeof cKind==='function')?cKind(c):''; }catch(_){ return ''; } };
  const st=c=>{ try{ return (typeof contractStatusMeta==='function'&&contractStatusMeta(c)&&contractStatusMeta(c).label)||c.status||''; }catch(_){ return c.status||''; } };
  return insSecHtml(i18t('ik_sec_book',{cp}), cs.length, `<ul class="ins-gl">${shown.map(c=>`<li><button type="button" class="ins-gi" data-ik-cgo="${esc(c.id)}"><b>${
    esc((window.contractRef?contractRef(c):c.id)+' · '+(c.name||''))}</b><span>${esc(kind(c))}</span><span class="r">${esc(st(c))}</span></button></li>`).join('')}</ul>${
    cs.length>shown.length?`<p class="ins-note" style="margin-top:6px">${esc(i18tn('ik_book_more',cs.length-shown.length,{n:cs.length-shown.length}))}</p>`:''}`, 'ik-book');
}
function ikHistoryHtml(r, asker){
  const h=[];
  const mine=ikIsMine(r);
  h.push({ t: mine?i18t('ik_h_asked_you'):i18t('ik_h_asked',{who:(r.by&&r.by.name)||''}), at:r.createdAt });
  const at=intakeStoppedAt(r);
  const by=String(r.decidedBy||'').trim();
  if(r.status==='done') h.push({ t: r.lane?i18t('ik_h_lane',{lane:r.lane,id:r.contractId||''})
    : by?i18t('ik_h_drafted_by',{id:r.contractId||'',who:by}):i18t('ik_h_drafted',{id:r.contractId||''}), at });
  if(r.status==='declined') h.push({ t: by?i18t('ik_h_declined_by',{who:by}):i18t('ik_h_declined'), at });
  if(r.status==='withdrawn') h.push({ t:i18t('ik_h_withdrawn'), at });
  h.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  return insSecHtml(i18t('ik_sec_history'), '', `<ul class="ins-log">${h.map(l=>`<li><span class="t">${esc(l.t)}</span><span class="w">${esc(ikDay(l.at))}</span></li>`).join('')}</ul>`, 'ik-hist');
}
/* "Sent" must mean sent: the page promises an email only where one can go. */
function ikMails(){
  return !!(typeof API_MODE==='function'&&API_MODE()
    && !(typeof emailOff==='function'&&emailOff())
    && !(typeof emailFailing==='function'&&emailFailing()));
}
function ikPanelOpts(r, asker){
  const first=String((r.by&&r.by.name)||'').trim().split(/\s+/)[0]||'';
  const mine=ikIsMine(r);
  const st=ikStatusSay(r, asker);
  const stream=(r.folder&&window.FOLDERS&&FOLDERS[r.folder])?FOLDERS[r.folder].name:'';
  const pr=intakePromiseSay(r);
  const withV=IK_STOPPED.includes(r.status)
    ? esc((r.assignee&&r.assignee.name)||'')
    : (r.assignee&&r.assignee.id)?esc(r.assignee.name||''):`<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
  const road=intakeRoad(r);
  const rd=IK_ROADS[road.k]||IK_ROADS.standard;
  const stopped=IK_STOPPED.includes(r.status);
  const facts=asker
    ? [ { k:'with', label:i18t('ik_f_with'), v:withV },
        { k:'promised', label:i18t('ik_f_promised'), v:r.promisedAt?esc(ikDay(String(r.promisedAt).slice(0,10),{long:true})):'' },
        { k:'cp', label:i18t('ik_f_cp'), v:esc(r.counterparty||'') },
        { k:'stream', label:i18t('ins_f_stream'), v:esc(stream) } ]
    : [ { k:'road', label:i18t('ik_f_road'), v:`<span class="ins-road-${road.k}">${esc(rd.label)}</span>` },
        { k:'with', label:i18t('ik_f_with'), v:withV },
        { k:'promised', label:i18t('ik_f_promised'), v:r.promisedAt?esc(ikDay(String(r.promisedAt).slice(0,10),{long:true})):'' },
        stopped ? { k:'took', label:i18t('ik_f_took'), v:(pr&&pr.sub)?esc(ikTookWords(intakeMinutes(r)||0)):'' }
                : { k:'asked', label:i18t('ik_f_asked'), v:esc(ikAgeWords(r)) },
        { k:'cp', label:i18t('ik_f_cp'), v:esc(r.counterparty||'') },
        { k:'stream', label:i18t('ins_f_stream'), v:esc(stream) } ];
  let body=insKvHtml(facts);
  body+=insSecHtml((asker||mine)?i18t('ik_sec_need_you'):i18t('ik_sec_need',{first}), '', `<p class="ins-p" style="white-space:pre-wrap">${esc(r.need||'')}</p>`, 'ik-need');
  if(r.status==='declined') body+=insSecHtml(i18t('ik_sec_declined'), '', r.note?`<blockquote class="ins-q">${esc(r.note)}</blockquote>`:`<p class="ins-note">${esc(i18t('ik_no_reason'))}</p>`, 'ik-why');
  if(!asker){
    const says=road.k==='lane'?(road.why?road.why+'.':''):i18t('ik_road_'+road.k+'_says');
    body+=insSecHtml(i18t('ik_sec_road'), '', `<p class="ins-p"><span class="ins-road-${road.k}">${esc(rd.label)}.</span> ${esc(says)}</p>${
      road.k!=='lane'&&road.why?`<p class="ins-note" style="margin-top:6px">${esc(i18t('ik_road_read',{why:road.why}))}</p>`:''}`, 'ik-road');
    body+=ikBookHtml(r);
    if(!mine&&!stopped){
      const url=intakeTrackUrl(r);
      body+=insSecHtml(i18t('ik_sec_inform',{first}), '', `<p class="ins-p">${esc(ikMails()?i18t('ik_inform',{first}):i18t('ik_inform_nomail',{first}))}</p>${
        url?`<button type="button" class="ui-link" data-ik-track-sec style="margin-top:6px">${typeof icon==='function'?icon('link','w-3.5 h-3.5'):''}${esc(i18t('ik_act_copy_track'))}</button>`:''}`, 'ik-inform');
    }
  } else if(!stopped){
    const holder=String((r.assignee&&r.assignee.name)||'').trim(), hf=holder.split(/\s+/)[0]||holder;
    const p=intakePromise(r);
    const day=r.promisedAt?ikDay(String(r.promisedAt).slice(0,10),{weekday:true}):'';
    /* WHOLE SENTENCES, one per case — a sentence glued from halves does not
       survive translation. */
    const lead=!holder ? i18t('ik_next_nobody')
      : !day ? i18t('ik_next_held',{first:hf})
      : (p&&p.k==='over') ? i18t('ik_next_over',{first:hf,day})
      : i18t('ik_next_promised',{first:hf,day});
    body+=insSecHtml(i18t('ik_sec_next'), '', `<p class="ins-p">${esc(lead)}${ikMails()?' '+esc(i18t('ik_next_mail')):''}</p>`, 'ik-next');
  }
  body+=ikHistoryHtml(r, asker);
  const { acts, menu }=ikActs(r, asker);
  const eyebrow=`<span class="ins-ref">${esc(r.id)}</span>${stream?' · '+esc(stream):''}`;
  const sub=(asker||mine)?esc(i18t('ik_sub_you',{date:ikDay(r.createdAt)})):esc(i18t('ik_sub_by',{name:(r.by&&r.by.name)||'',date:ikDay(r.createdAt)}));
  return {
    item:{ id:r.id },
    head:{ eyebrow, title:r.title||'', sub, tone:st.tone, status:st.html, acts, menuHtml:menu, moreAria:i18t('reg_more_actions') },
    acts, body,
    onMenu:act=>{
      if(act==='decline') intakeSetStatus(r.id,'declined');
      else if(act==='withdraw') intakeSetStatus(r.id,'withdrawn');
      else if(act==='track') intakeTrackCopy(r.id);
    },
  };
}
function renderIntakeInspector(host){
  const may=(typeof canEdit==='function'&&canEdit());
  const asker=!may;
  const f=ikFilters();
  const V=asker?IK_V_ASKER:IK_V_TEAM;
  if(!V.some(v=>v[0]===f.view)) f.view='open';
  const all=asker?intakeMine():((_intake&&_intake.list)||[]);
  const base=asker?all:all.filter(r=>ikPassChips(r,f));
  const rows=base.filter(r=>ikPassView(r,f.view,asker)).sort(ikSort);
  const narrowing=asker?[]:IK_CHIPS.filter(k=>String(f[k])!==String(IK_DEF[k]));
  /* THE HEAD: what the queue looks like right now, and the one filled act. */
  const live=all.filter(r=>!IK_STOPPED.includes(r.status));
  if(asker){
    const n=live.length;
    _ikHead.facts=esc(n?i18tn('ik_head_asker',n,{n}):i18t('ik_head_asker_none'))+(ikMails()?' · '+esc(i18t('ik_head_asker_mail')):'');
  } else {
    const nob=live.filter(r=>intakeStage(r)==='nobody').length, over=live.filter(r=>intakeStage(r)==='over').length;
    const med=intakeMedianDays(all);
    _ikHead.facts=[ esc(i18tn('ik_head_open',live.length,{n:live.length})),
      nob?esc(i18tn('ik_head_nobody',nob,{n:nob})):'',
      over?`<span class="ins-late">${esc(i18tn('ik_head_over',over,{n:over}))}</span>`:'',
      med!=null?esc(i18t('ik_median',{n:med})):'' ].filter(Boolean).join(' · ');
  }
  _ikHead.acts=`<button type="button" id="ik-new" class="ui-btn ui-btn-primary">${typeof icon==='function'?icon('plus','w-3.5 h-3.5'):''}${esc(i18t('ik_ask_btn'))}</button>`;
  const views=insViewTabsHtml({ attr:'data-ik-view', cur:f.view, label:i18t('ik_views_label'),
    views:V.map(([k,key])=>({ k, label:i18t(key), n:base.filter(r=>ikPassView(r,k,asker)).length })) });
  const folders=(typeof visibleFolders==='function')?visibleFolders():Object.values(window.FOLDERS||{});
  const chips=asker?'':[
    insChipHtml({ attr:'data-ik-f', key:'who', label:i18t('ik_c_who'), cur:f.who, def:IK_DEF.who,
      opts:[['all',i18t('ik_c_who_all')],['me',i18t('ik_c_who_me')],['nobody',i18t('ik_c_who_nobody')],['other',i18t('ik_c_who_colleague')]] }),
    insChipHtml({ attr:'data-ik-f', key:'road', label:i18t('ik_f_road'), cur:f.road, def:IK_DEF.road,
      opts:[['all',i18t('ik_c_road_all')],...['close','standard','routine','lane'].map(k=>[k,IK_ROADS[k].label])] }),
    insChipHtml({ attr:'data-ik-f', key:'folder', label:i18t('ins_f_stream'), cur:f.folder, def:IK_DEF.folder,
      opts:[['all',i18t('ob_f_folder_all')],...folders.map(x=>[x.id,x.name])] }),
  ].join('')+(narrowing.length?`<button type="button" class="ui-link" data-ik-clear>${esc(i18tn('ob_clear_n',narrowing.length,{n:narrowing.length}))}</button>`:'');
  const cols=asker
    ? [{ t:i18t('ik_col_request') }, { t:i18t('ik_f_with'), w:170 }, { t:i18t('ik_f_promised'), w:140 }]
    : [{ t:i18t('ik_col_request') }, { t:i18t('ik_f_road'), w:120 }, { t:i18t('ik_f_with'), w:156 }, { t:i18t('ik_f_promised'), w:132 }];
  const tr=r=>{
    const sub=asker
      ? [r.counterparty||'', i18t('ik_row_asked',{date:ikDay(r.createdAt)})].filter(Boolean).join(' · ')
      : [ikIsMine(r)?i18t('ik_with_you'):((r.by&&r.by.name)||''), r.counterparty||'', ikAgeWords(r)].filter(Boolean).join(' · ');
    const pr=intakePromiseSay(r);
    const prHtml=pr?`<span class="ins-c2"><b>${esc(pr.day)}</b><span class="${pr.cls}">${esc(pr.sub)}</span></span>`:`<span class="ins-quiet">—</span>`;
    return `<tr data-ins-row data-ik-row="${esc(r.id)}" tabindex="-1">
      <td><span class="ins-c2"><b title="${esc(r.title||'')}">${esc(r.title||'')}</b><span>${esc(sub)}</span></span></td>
      ${asker?'':`<td>${ikRoadHtml(r)}</td>`}
      <td>${ikWithCellHtml(r, asker)}</td>
      <td>${prHtml}</td>
    </tr>`;
  };
  let body='';
  IK_GROUPS.forEach(([k,team,ask,tone])=>{
    const g=rows.filter(r=>intakeStage(r,asker)===k);
    if(!g.length) return;
    body+=`<tr class="ins-grp" data-ik-grp="${k}"><td colspan="${cols.length}"><span class="ins-g"><i class="ins-dot2 is-${tone}" aria-hidden="true"></i>${esc(i18t(asker?ask:team))}<span class="n">${g.length}</span></span></td></tr>`+g.map(tr).join('');
  });
  if(!rows.length){
    const msg=asker?i18t('ik_mine_empty'):narrowing.length?i18t('ik_none_match'):(f.view==='open'?i18t('ik_queue_empty'):i18t('ob_none_here'));
    body=`<tr class="ins-empty"><td colspan="${cols.length}">${esc(msg)}${narrowing.length?`<br><button type="button" class="ui-link" data-ik-clear style="margin-top:8px">${esc(i18t('ob_clear_filters'))}</button>`:''}</td></tr>`;
  }
  const table=`<table class="ins-lt ik-lt"><colgroup>${cols.map(c=>`<col${c.w?` style="width:${c.w}px"`:''}>`).join('')}</colgroup><thead><tr>${
    cols.map(c=>`<th>${esc(c.t)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
  host.innerHTML=`<div class="view-enter ins-page ik-ins" data-ins-page="intake" data-ins="1">
    ${views}
    <div class="ins-body">
      <section class="ins-card" aria-label="${esc(i18t('nav_intake'))}">
        ${chips?`<div class="ins-bar reg-filterbar">${chips}</div>`:''}
        <div class="ins-scroll" id="ik-scroll">${table}</div>
        <div class="ins-foot"><span>${esc(asker?i18t('ik_foot_asker'):i18t('ik_showing',{n:rows.length,of:all.length}))}</span></div>
      </section>
      <aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ik_panel_label'))}"></aside>
    </div>
  </div>`;
  ikPaintHead();
  const again=()=>{ if(typeof keepScroll==='function') keepScroll(()=>renderIntake()); else renderIntake(); };
  host.querySelectorAll('[data-ik-view]').forEach(b=>b.addEventListener('click',()=>{ f.view=b.getAttribute('data-ik-view'); again(); }));
  host.querySelectorAll('[data-ik-f]').forEach(s=>s.addEventListener('change',()=>{ f[s.getAttribute('data-ik-f')]=s.value; again(); }));
  host.querySelectorAll('[data-ik-clear]').forEach(b=>b.addEventListener('click',()=>{ IK_CHIPS.forEach(k=>{ f[k]=IK_DEF[k]; }); again(); }));
  const seat=asker?'intake:asker':'intake:team';
  const tb=host.querySelector('.ik-lt tbody');
  const idOf=t=>t.getAttribute('data-ik-row');
  const byId=new Map(rows.map(r=>[r.id,r]));
  const id=insPick(seat, rows.map(r=>r.id));
  if(tb) insMarkRow(tb,'[data-ins-row]',idOf,id);
  const paint=k=>{
    const r=byId.get(k);
    if(!r){ insPaintPanel({ empty:asker?i18t('ik_panel_none_asker'):i18t('ik_panel_none') }); return; }
    insPaintPanel(ikPanelOpts(r, asker));
    const pan=document.getElementById('ins-panel'); if(!pan) return;
    pan.querySelector('[data-ik-track-sec]')?.addEventListener('click',()=>intakeTrackCopy(r.id));
    pan.querySelectorAll('[data-ik-cgo]').forEach(b=>b.addEventListener('click',()=>openWorkspace(b.getAttribute('data-ik-cgo'))));
  };
  paint(id);
  /* A SECOND PRESS OPENS THE CONTRACT THE REQUEST BECAME, where it became
     one; on anything else the verbs in the panel are the way on. */
  if(tb) insListWire(tb,{ rowSel:'[data-ins-row]', idOf,
    onSelect:k=>{ insSelect(seat,k); insMarkRow(tb,'[data-ins-row]',idOf,k); paint(k); },
    onOpen:k=>{ const r=byId.get(k); if(r&&r.contractId) openWorkspace(r.contractId); } });
  if(typeof insWatchWidth==='function') insWatchWidth();
}

/* ---- THE TWO ACTS, AND THE LINK ---- */
async function intakePatch(id, body){
  try{
    await api('intake/'+encodeURIComponent(id),'PATCH',body);
    await loadIntake(); renderIntake();
    return true;
  }catch(e){ toast((e&&e.message)||i18t('ik_failed'),'err'); return false; }
}
/* HOLDING A REQUEST IS SOMETHING YOU DO. Pressing it again puts it back down,
   so the one control is both halves and there is no way to leave a row held by
   somebody who has stopped working on it without a way to say so. The STATUS
   is carried through unchanged — this call is about who holds it, not about
   where it has got to. */
async function intakePick(id){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const me=currentUser(); if(!me) return;
  const mine=!!(r.assignee&&r.assignee.id===me.id);
  /* ---- A REQUEST A COLLEAGUE HOLDS IS TAKEN OVER, AND THAT ASKS FIRST
     (Young ruled 26 Sep 2026, the first of the three rulings) ----
     "Pick it up" on a row somebody else was holding moved it to the presser
     in silence — the colleague found out, if at all, from the queue. It is
     named for what it does now, and it asks. */
  if(!mine && r.assignee && r.assignee.id) return intakeTakeOver(id);
  if(await intakePatch(id,{ status:r.status, assignee: mine?'':me.id }))
    toast(mine?i18t('ik_dropped'):i18t('ik_picked'),'ok');
}
/* THE WORD ON THE ONE CONTROL: pick it up, put it down, or take it over. One
   reading, asked by the row and by the panel. */
function intakePickLabel(r){
  const me=(typeof currentUser==='function')?currentUser():null;
  if(r&&r.assignee&&r.assignee.id&&me&&r.assignee.id===me.id) return i18t('ik_act_drop');
  if(r&&r.assignee&&r.assignee.id) return i18t('ik_act_take');
  return i18t('ik_act_pick');
}
async function intakeTakeOver(id){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const me=currentUser(); if(!me) return;
  const holder=String((r.assignee&&r.assignee.name)||'').trim();
  const first=holder.split(/\s+/)[0]||holder;
  const ok=(typeof confirmDialog!=='function')?true:await confirmDialog({
    title:i18t('ik_take_title',{first}),
    message:i18t('ik_take_msg',{holder,title:r.title||''}),
    confirmLabel:i18t('ik_act_take') });
  if(!ok) return;
  if(await intakePatch(id,{ status:r.status, assignee:me.id }))
    toast(i18t('ik_taken',{first}),'ok');
}
/* A PROMISED DATE IS A PROMISE, so a person types it. HaTi proposes nothing
   here — not a working-day estimate, not a median, not a road-based guess —
   because the moment it did, the column would stop being a commitment and
   start being a forecast somebody else has to live with. */
async function intakePromiseAsk(id){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const said=await promptDialog({ title:i18t('ik_promise_title'),
    message:i18t('ik_promise_msg'), value:r.promisedAt||'',
    confirmLabel:i18t('ik_act_promise'), cancelLabel:i18t('act_cancel') });
  if(said==null) return;
  const d=String(said||'').trim();
  if(d && !/^\d{4}-\d{2}-\d{2}$/.test(d)){ toast(i18t('ik_promise_bad'),'err'); return; }
  if(await intakePatch(id,{ status:r.status, promisedAt:d }))
    toast(d?i18t('ik_promised'):i18t('ik_promise_cleared'),'ok');
}
/* The link is COPIED rather than opened: the person who needs it is not the
   person pressing the button. */
async function intakeTrackCopy(id){
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  const url=intakeTrackUrl(r);
  if(!url){ toast(i18t('ik_track_none'),'warn'); return; }
  try{ await navigator.clipboard.writeText(url); toast(i18t('ik_track_copied'),'ok'); }
  catch(_){ try{ window.open(url,'_blank'); }catch(__){ toast(url,'warn'); } }
}

Object.assign(window,{INTAKE_STATUS,IK_LIVE,IK_ROADS,IK_TONE,IK_MEDIAN_MIN,IK_STOPPED,
  IK_THEIR_PAPER,IK_MONEY,ikKnownCounterparty,intakeRoad,intakeStoppedAt,intakeMinutes,
  intakeMedianDays,intakePromise,intakePastDue,intakeTrackUrl,intakeLanes,intakeLaneFor,
  intakeRunLanes,intakeLaneSweep,intakeSweepStart,IK_SWEEP_MS,ikClockHtml,ikFactHtml,intakePick,intakePromiseAsk,intakeTrackCopy,intakePatch,
  intakeMine,intakeQueue,intakeCount,loadIntake,
  intakeStatusKey,intakePickLabel,intakeTakeOver,intakeStage,intakeFinishedThisMonth,intakePromiseSay,
  ikPaintHead,ikAfterRender,renderIntakeInspector,ikPanelOpts,ikActs,ikStatusSay,ikFilters,
  IK_V_TEAM,IK_V_ASKER,IK_DEF,IK_CHIPS,IK_GROUPS,ikPassView,ikPassChips,ikSort,ikAgeWords,ikTookWords,ikDay,
  openIntakeForm,intakeAnswerLine,openIntakeTracker,intakeDraft,intakeSetStatus,renderIntake,ikRowHtml,intakeSuggestTemplate,
  _intakeState:_intake});
