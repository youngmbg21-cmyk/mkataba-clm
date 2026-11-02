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
  /* ---- DRAFTED, NOT YET SENT (4 Oct 2026, the process review's Requests
     stream) ----
     A request read "done" the moment a draft was MINTED, and the person who
     asked was mailed that their contract existed while it sat unsent in
     somebody's Drafting. Minting is now this: the request points at its
     contract and its clock keeps running. It closes ('done') when that
     contract LEAVES Drafting — the server closes it on the save that moves
     it (srvIntakeCloseOn), and contractLeavesDrafting tells this page — and
     the requester's mail goes then. */
  drafted:   { get label(){ return i18t('ik_st_drafted'); },   tone:'steel' },
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
/* THE WORDS THAT MEAN "THEIR PAPER", AND A FIGURE IN THE ASK, live in
   js/intakelanes.js since 4 Oct 2026 — the server's lane sweep asks the same
   two patterns, so they are written once. Matched on the requester's own
   sentence, which is the only description of the job that exists at this
   point. A request that says nothing about whose paper it is falls through to
   the ordinary road rather than to the careful one. Read through window: this
   is a module, and a stage without the shared file reads nothing as matching. */
const _ikRx = k => { const x=(typeof window!=='undefined')?window[k]:null; return (x&&typeof x.test==='function')?x:/(?!)/; };
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
  const theirs=_ikRx('IK_THEIR_PAPER').test(text);
  const money=_ikRx('IK_MONEY').test(text);
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
    /* A DECLINED OR WITHDRAWN REQUEST WAS NOT DONE (the owner's list, 27 Sep
       2026): its clock read "done in 24 hours", the same words as one drafted.
       The wide page's own words (intakePromiseSay), and no green. */
    if(r.status==='declined'||r.status==='withdrawn')
      return { k:'done', tone:'ink', text:i18t(r.status==='declined'?'ik_declined_after':'ik_withdrawn_after',{t:ikTookWords(mins)}) };
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
/* WHICH LANE WOULD CLEAR THIS REQUEST — the shared reading (js/intakelanes.js),
   asked of the book this reader can see. The SERVER runs the lanes now
   (runIntakeLanes); this page only reads the same rule. */
function intakeLaneFor(r){
  if(typeof window==='undefined' || typeof window.intakeLaneMatch!=='function') return null;
  return window.intakeLaneMatch(r, intakeLanes(), ikKnownCounterparty);
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
/* THE ESSENTIALS THE FORM ASKS, in Create's own order, each optional. The
   counterparty and the stream keep the ids they always had (#ik-cp,
   #ik-folder) because the request stores them in columns of their own. */
const IK_FIELD_IDS = { counterparty:'ik-cp', folder:'ik-folder' };
const ikFieldId = k => IK_FIELD_IDS[k] || ('ik-e-'+k);
function intakeFormFields(pre){
  const all=(typeof window!=='undefined'&&typeof window.essentialFields==='function')?window.essentialFields()
    :[{ key:'counterparty', label:i18t('ik_f_who'), type:'text' },{ key:'folder', label:i18t('ik_f_stream'), type:'stream' }];
  const p=pre||{};
  /* Copied by descriptor, never spread — the getter trap: a label is a live
     getter, and {...f} would freeze today's language into it. */
  return all.map(f=>{
    const c=Object.defineProperties({}, Object.getOwnPropertyDescriptors(f));
    const v=p[f.key]!=null?String(p[f.key]):(f.key==='party'?String(f.def||''):'');
    Object.defineProperty(c,'def',{ value:v, enumerable:true, configurable:true, writable:true });
    return c;
  });
}
function ikFieldHtml(f, streams, FLD, LBL){
  const id=ikFieldId(f.key), v=String(f.def||'');
  const lab=`<span style="${LBL}">${esc(String(f.label||f.key))}</span>`;
  if(f.type==='stream') return `<label style="display:block"><span style="${LBL}">${esc(i18t('ik_f_stream'))}</span>
    <select id="${id}" style="${FLD}"><option value="">${esc(i18t('ik_f_stream_unsure'))}</option>
      ${(streams||[]).map(x=>`<option value="${esc(x.id)}"${v===String(x.id)?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>`;
  if(f.type==='select') return `<label style="display:block">${lab}
    <select id="${id}" style="${FLD}">${(f.opts||[]).map(o=>(typeof window.fieldOpt==='function')?window.fieldOpt(o):{ v:String(o), l:String(o) })
      .map(o=>`<option value="${esc(o.v)}"${v===o.v?' selected':''}>${esc(o.l)}</option>`).join('')}</select></label>`;
  const it=f.type==='date'?'date':(f.type==='num'?'number':(f.type==='email'?'email':'text'));
  return `<label style="display:block">${lab}
    <input id="${id}" type="${it}" value="${esc(v)}" placeholder="${esc(String(f.ph||''))}" style="${FLD}" maxlength="200"${it==='number'?' min="0"':''}/></label>`;
}
/* A TITLE FROM A SENTENCE, for the door that arrives with only a sentence
   (draft-from-a-sentence's "nothing fits"): its first line, cut at a word
   before 80 characters. The person can change it; the form no longer refuses
   them for a box they never saw empty. */
/* One box the way the drawings lay it: label over field, nothing else. */
function ikSapField(f, streams, FLD){
  const id=ikFieldId(f.key), v=String(f.def||'');
  const lab=`<label for="${id}">${esc(String(f.type==='stream'?i18t('ik_f_stream'):(f.label||f.key)))}</label>`;
  if(f.type==='stream') return `<div class="sap-f">${lab}<select id="${id}" style="${FLD}"><option value="">${esc(i18t('ik_f_stream_unsure'))}</option>
      ${(streams||[]).map(x=>`<option value="${esc(x.id)}"${v===String(x.id)?' selected':''}>${esc(x.name)}</option>`).join('')}</select></div>`;
  if(f.type==='select') return `<div class="sap-f">${lab}<select id="${id}" style="${FLD}">${(f.opts||[]).map(o=>(typeof window.fieldOpt==='function')?window.fieldOpt(o):{ v:String(o), l:String(o) })
      .map(o=>`<option value="${esc(o.v)}"${v===o.v?' selected':''}>${esc(o.l)}</option>`).join('')}</select></div>`;
  const it=f.type==='date'?'date':(f.type==='num'?'number':(f.type==='email'?'email':'text'));
  return `<div class="sap-f">${lab}<input id="${id}" type="${it}" value="${esc(v)}" placeholder="${esc(String(f.ph||''))}" style="${FLD}" maxlength="200"${it==='number'?' min="0"':''}/></div>`;
}
function intakeTitleFrom(sentence){
  const line=String(sentence||'').split(/\r?\n/).map(x=>x.trim()).find(Boolean)||'';
  if(line.length<=80) return line.replace(/[.\s]+$/,'');
  const cut=line.slice(0,80), sp=cut.lastIndexOf(' ');
  return (sp>40?cut.slice(0,sp):cut).replace(/[,;:.\s]+$/,'')+'\u2026';
}
function openIntakeForm(pre){
  const streams=(typeof visibleFolders==='function')?visibleFolders():Object.values(FOLDERS||{});
  /* READS THE ONE PAIR (25 Aug 2026). It was a local copy on its own
     padding and type; seven such copies in three flavours is how a form ends
     up two pixels off the form beside it. Through window because this is a
     module and a bare cross-module read throws. */
  const FLD=window.HATI_FLD;
  const LBL=window.HATI_LBL;
  /* AS DRAWN (SAP pop-ups, 10 Oct 2026 — the owner: "This is what i see for
     ask for a contract"): the two questions first, then the optional facts
     under their own group rule, laid two and three across — counterparty and
     their address; value, start and end; then our side's facts and the
     stream. Every box keeps its id, so the send below reads them as before. */
  const fs=intakeFormFields(pre), byKey=k=>fs.find(f=>f.key===k);
  const cell=f=>f?ikSapField(f, streams, FLD):'';
  const used=new Set(['counterparty','cpemail','value','effDate','expiry','party','side','folder']);
  const rest=fs.filter(f=>!used.has(f.key));
  const pair=(a,b)=>(a||b)?`<div class="sap-row">${cell(a)||'<span></span>'}${cell(b)||'<span></span>'}</div>`:'';
  openModal(`<div style="padding:24px">
    <h3>${i18t('ik_ask_title')}</h3>
    <p id="ik-lead">${esc(i18t('ik_lead_asker'))}</p>
    <div class="sap-body">
      <div class="sap-f"><label for="ik-title">${i18t('ik_f_title')} <span class="sap-req">*</span></label>
        <input id="ik-title" value="${esc(String((pre&&pre.title)||''))}" style="${FLD}" placeholder="${esc(i18t('ik_f_title_ph'))}" maxlength="200"/></div>
      <div class="sap-f"><label for="ik-need">${i18t('ik_f_need')} <span class="sap-req">*</span></label>
        <textarea id="ik-need" rows="3" style="${FLD};height:auto;min-height:72px;resize:vertical" placeholder="${esc(i18t('ik_f_need_ph'))}" maxlength="4000">${esc(String((pre&&pre.need)||''))}</textarea></div>
      ${''/* THE SAME ESSENTIALS CREATE ASKS (4 Oct 2026, the process review):
            CONTRACT_ESSENTIALS through essentialFields, ALL OPTIONAL — they
            ride the request (`answers`) into the drafting screen's boxes. */}
      <p class="sap-grp">${esc(i18t('ik_f_essentials'))}</p>
      ${pair(byKey('counterparty'), byKey('cpemail'))}
      ${(byKey('value')||byKey('effDate')||byKey('expiry'))?`<div class="sap-row3">${cell(byKey('value'))}${cell(byKey('effDate'))}${cell(byKey('expiry'))}</div>`:''}
      ${pair(byKey('party'), byKey('side'))}
      ${pair(byKey('folder'), rest[0])}
      ${rest.slice(1).map((f,i,a)=>i%2?'':pair(f,a[i+1])).join('')}
      ${''/* ATTACHMENTS (SAP benchmark, batch 2): stored with the request on
            the server (IK_FILES_MAX of up to IK_FILE_MAX_MB each). The
            browser's own file button is hidden behind HaTi's. */}
      <div class="sap-f"><span class="sap-lbl">${esc(i18t('ik_f_files'))}</span>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button type="button" class="ui-btn" id="ik-files-go">${icon('upload','w-4 h-4')}${esc(i18t('ik_f_attach'))}</button>
          <span id="ik-files-say" class="sap-help">${esc(i18t('ik_f_files_note',{ n:IK_FILES_MAX, mb:IK_FILE_MAX_MB }))}</span>
          <input id="ik-files" type="file" multiple accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.xlsx,.csv" hidden/>
        </div></div>
      <p id="ik-err" style="font-size:var(--t-meta);color:var(--st-ruby-fg);margin:0" hidden></p>
    </div>
    <div style="display:flex;gap:var(--s-2);justify-content:flex-end">
      <button data-dlg-cancel id="ik-cancel" class="ui-btn">${i18t('act_cancel')}</button>
      <button id="ik-send" class="ui-btn ui-btn-primary">${i18t('ik_send')}</button>
    </div>
  </div>`,{maxWidth:'600px'});
  const filesIn=document.getElementById('ik-files');
  document.getElementById('ik-files-go')?.addEventListener('click',()=>filesIn&&filesIn.click());
  filesIn?.addEventListener('change',()=>{ const say=document.getElementById('ik-files-say'); const n=filesIn.files.length;
    if(say) say.textContent=n?[...filesIn.files].map(f=>f.name).join(', '):i18t('ik_f_files_note',{ n:IK_FILES_MAX, mb:IK_FILE_MAX_MB }); });
  document.getElementById('ik-cancel')?.addEventListener('click',()=>closeModal());
  document.getElementById('ik-send')?.addEventListener('click',async()=>{
    const g=id=>(document.getElementById(id)||{value:''}).value.trim();
    const err=document.getElementById('ik-err');
    if(err){ err.hidden=true; }
    const say=m=>{ if(err){ err.textContent=m; err.hidden=false; } };
    if(!g('ik-title')||!g('ik-need')){ say(i18t('ik_need_both')); return; }
    const answers={};
    for(const f of intakeFormFields()){ if(f.key==='counterparty'||f.key==='folder') continue;
      const v=g(ikFieldId(f.key)); if(v) answers[f.key]=v; }
    if(answers.cpemail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.cpemail)){ say(i18t('ik_bad_email')); return; }
    if(answers.effDate && answers.expiry && answers.expiry<answers.effDate){ say(i18t('ik_bad_term')); return; }
    const picked=[...((document.getElementById('ik-files')||{}).files||[])];
    if(picked.length>IK_FILES_MAX){ say(i18t('ik_files_too_many',{ n:IK_FILES_MAX })); return; }
    if(picked.some(fl=>fl.size>IK_FILE_MAX_MB*1024*1024)){ say(i18t('ik_file_too_big',{ mb:IK_FILE_MAX_MB })); return; }
    const btn=document.getElementById('ik-send'); if(btn) btn.disabled=true;
    try{
      const files=await Promise.all(picked.map(fl=>new Promise((res,rej)=>{ const rd=new FileReader();
        rd.onload=()=>res({ name:fl.name, mime:fl.type||'application/octet-stream', dataUrl:String(rd.result||'') });
        rd.onerror=()=>rej(new Error(i18t('ik_file_unread',{ name:fl.name }))); rd.readAsDataURL(fl); })));
      const made=await api('intake','POST',{ title:g('ik-title'), need:g('ik-need'),
        counterparty:g('ik-cp'), folder:g('ik-folder'), answers, files });
      closeModal();
      await loadIntake();
      /* A lane may have drafted it in the same breath — read it as it lands. */
      if(made && made.request && made.request.lane) try{ intakeLaneArrivals().catch(()=>{}); }catch(_){}
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
    }catch(e){ say((e&&e.message)||i18t('ik_failed')); if(btn) btn.disabled=false; }
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

/* ---- TURNING A REQUEST INTO PAPER. The paper that fits is READ, not asked
   of a model (round 20 as drawn, owner's yes of 18 Oct 2026): ikFitOf ranks
   our shelves by the words the request shares with each paper — the ranking
   draft from a sentence uses (caDraftRank, round 4's "read without AI") — and
   Jambo's line in the panel names that paper; Start the draft opens the form
   with THAT one chosen, so what the panel says and what the form shows are one
   reading. The EDITOR presses Create; the form's own "Let Jambo fill the form"
   is where a call is spent, its cost said on it. (Until 18 Oct an AI pick,
   POST /api/ai/template, ran silently on the press — intakeSuggestTemplate,
   retired.)

   EVERY SHELF, COMPANY STANDARDS FIRST (4 Oct 2026, the process review's
   Requests stream): it named HaTi's twelve built-ins only, so a workspace
   whose own standard was the right paper was offered the wrong one. The
   candidates are draft-from-a-sentence's own (draftCandidates — standards,
   then saved, then HaTi's), as `kind:id` so a pick names its shelf. */
function ikShelfOf(){
  const all=(typeof window!=='undefined'&&typeof window.draftCandidates==='function')?window.draftCandidates()
    :Object.entries((typeof TEMPLATES!=='undefined'&&TEMPLATES)||{}).map(([id,t])=>({ kind:'builtin', id, name:t.name, blurb:t.blurb||'' }));
  return all.map(c=>({ ...c, key:`${c.kind}:${c.id}` }));
}
/* ---- DRAFT IT OPENS THE ORDINARY DRAFTING SCREEN (4 Oct 2026) ----
   It opened a one-select dialog of HaTi's built-ins and pressed
   createFromTemplate, which asks no questions — so the request's answers were
   typed again by the editor, and a company standard could not be chosen at
   all. It opens openNewAgreement now: every shelf, the suggested paper lit,
   and the request's answers already in the boxes (intakePrefillOf, the shared
   reading). Nothing new mints anything: the screen's own Create does.

   THE LINK IS HELD, NOT GUESSED. The request is held while the screen stands
   and claimed by contractArrived — the one funnel every creation site
   registers with — exactly as the people named on that screen are
   (participantsHold). A screen left without Create drops the hold; one left
   by Create keeps it a little while for the create to land. */
let _ikHold = null;
const IK_HOLD_AFTER_CREATE_MS = 60 * 1000;
function intakeHoldDraft(id){ _ikHold = id ? { id:String(id), at:Date.now() } : null; }
function intakeHeldDraft(){ return _ikHold ? _ikHold.id : null; }
async function intakeClaimDraft(c){
  if(!_ikHold || !c || !c.id) return false;
  const rid=_ikHold.id; _ikHold=null;
  const r=(_intake.list||[]).find(x=>x.id===rid)||null;
  c.intakeRequestId=rid;
  try{ logAudit(c,'Requested',`Raised from request ${rid} by ${(r&&r.by&&r.by.name)||'a colleague'}: ${(r&&r.title)||''}`); }catch(_){}
  try{ persist(c); }catch(_){}
  try{
    await api('intake/'+encodeURIComponent(rid),'PATCH',{ status:'drafted', contractId:c.id });
    await loadIntake();
    if(window.updateSidebarCounts) updateSidebarCounts();
  }catch(_){ /* the draft exists either way; the queue catches up on reload */ }
  return true;
}
async function intakeDraft(id){
  if(!canEdit()){ if(typeof draftWallToast==='function') draftWallToast(); else toast(i18t('ap_viewers_no_create'),'err'); return; }
  const r=(_intake.list||[]).find(x=>x.id===id); if(!r) return;
  /* the paper Jambo's line names (ikFitOf) — read, never asked of a model */
  const pick=ikFitOf(r);
  if(typeof openNewAgreement!=='function') return;
  const prefill=(typeof window.intakePrefillOf==='function')?window.intakePrefillOf(r):{};
  intakeHoldDraft(r.id);
  openNewAgreement({ pick:pick?{ kind:pick.kind, id:pick.id }:null, prefill, backLabel:i18t('nav_intake') });
  /* LAND ON IT: the form opens on the paper chosen, lit */
  if(pick&&typeof landOn==='function') landOn('#na-root .na-pick.on', { block:'nearest' });
  /* The hold belongs to the screen: Create keeps it long enough to land,
     every other way out drops it. */
  const root=document.getElementById('na-root');
  if(!root || typeof MutationObserver!=='function'){ return; }
  let pressed=false;
  root.addEventListener('click',e=>{ if(e.target&&e.target.closest&&e.target.closest('#na-create,#na-skip')) pressed=true; },true);
  try{
    const mr=document.getElementById('modal-root')||document.body;
    const ob=new MutationObserver(()=>{
      if(document.getElementById('na-root')===root) return;
      ob.disconnect();
      if(!pressed){ if(intakeHeldDraft()===r.id) intakeHoldDraft(null); return; }
      setTimeout(()=>{ if(intakeHeldDraft()===r.id) intakeHoldDraft(null); }, IK_HOLD_AFTER_CREATE_MS);
    });
    ob.observe(mr,{ childList:true, subtree:true });
  }catch(_){}
}
/* ---- ITS CONTRACT LEFT DRAFTING: THE REQUEST IS DONE ----
   Called by contractLeavesDrafting, the ONE act that takes a contract out of
   Draft. The SERVER closes the request on the save that carries the move
   (srvIntakeCloseOn) and mails the person who asked; this only says so on
   this page at once and re-reads the queue once that save has had time to
   land. It writes nothing. */
function intakeContractSent(c){
  if(!c || !c.id) return false;
  const r=(_intake.list||[]).find(x=>x.status==='drafted'&&(x.contractId===c.id||x.id===c.intakeRequestId));
  if(!r) return false;
  r.status='done'; r.decidedAt=new Date().toISOString();
  try{ if(window.updateSidebarCounts) updateSidebarCounts(); }catch(_){}
  try{ setTimeout(()=>{ intakeRefresh(); }, 5000); }catch(_){}
  return true;
}
/* ---- THE BELL'S DOOR: the Requests page, on that request ----
   The filters come back to rest first, so the row is in the list it lands
   on; the inspector lights it (insSelect). */
function intakeGoTo(id){
  const f=ikFilters(); Object.assign(f, IK_DEF);
  /* the list head's box says the words at rest too (a question typed there goes) */
  if(typeof lhBoxSet==='function') lhBoxSet(IK_SEAT, '');
  try{ if(typeof window.insSelect==='function') window.insSelect('intake:team', String(id)); }catch(_){}
  if(typeof setView==='function') setView('intake');
}
/* WHAT THE BELL SAYS: open requests nobody holds, raised by a colleague, for
   a reader who may draft. Borrowed off the list GET /api/intake already
   scoped to their streams. One row each, oldest first. */
function intakeAlertRows(){
  if(typeof canEdit!=='function' || !canEdit()) return [];
  const me=_ikMe();
  return (_intake.list||[]).filter(r=>r && r.status==='open' && !(r.assignee&&r.assignee.id)
      && !(me&&r.by&&r.by.id===me.id))
    .sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
}
/* ---- A DRAFT A LANE MADE FOR YOU (4 Oct 2026, the process review's last
   gaps) ----
   A lane's draft has an owner now (the lane's, intakeLaneOwner), and the
   request is held by that same person — so the bell tells them, as the
   `request` kind it already has: one row per draft, to its owner only, gone
   when the draft leaves Drafting (the request is then `done`), because
   nothing marks an alert seen except the work done. Borrowed off the list
   GET /api/intake already scoped to the reader. */
function intakeLaneDraftRows(){
  if(typeof canEdit!=='function' || !canEdit()) return [];
  const me=_ikMe(); if(!me || me.id==null) return [];
  return (_intake.list||[]).filter(r=>r && r.status==='drafted' && r.lane && r.contractId
      && r.assignee && String(r.assignee.id)===String(me.id))
    .sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')));
}
/* ---- AND COPILOT READS IT ON ARRIVAL, LIKE A DRAFT MADE BY HAND ----
   A lane mints on the SERVER, where contractArrived never runs, so Copilot's
   arrival reading waited until somebody sent the draft. The reading stays
   the browser's — triageRun presses the product's own readings, and a server
   copy would be a second opinion about what a contract says — so the server
   marks the draft `arrivalOwed`, and the first editor's browser that holds
   it CLAIMS it (POST /api/contracts/:id/arrival: one claim, ever, so two
   editors opening it at once cannot both pay) and then arrives it through
   the one door every creation uses: contractArrived with `elsewhere` (claim
   nothing this screen holds for a draft of its own) and `read:false`, then
   the one launcher, triageAndPaint, AWAITED — the readings run one contract
   at a time, never several at once (triageRun's own rule).
   ASKED WHEN THIS BROWSER FIRST HOLDS THE BOOK AND THE QUEUE (startApp), on
   the queue's own beat (intakeRefresh), and after this browser raises a
   request a lane may clear in the same breath. A lane draft the queue names
   and the book does not hold yet is taken into the book first, so it is on
   the Contracts list without a reload. */
let _ikArriving = false;
async function intakeLaneArrivals(){
  if(_ikArriving) return 0;
  if(!(typeof API_MODE==='function' && API_MODE())) return 0;
  if(typeof canEdit!=='function' || !canEdit()) return 0;
  if(typeof state==='undefined' || !Array.isArray(state.contracts)) return 0;
  _ikArriving = true;
  let read = 0, took = false;
  const inBook = id => state.contracts.find(x=>x && String(x.id)===String(id)) || null;
  try{
    for(const r of (_intake.list||[])){
      if(!r || !r.lane || !r.contractId || r.status!=='drafted' || inBook(r.contractId)) continue;
      try{
        const row=await api('contracts/'+encodeURIComponent(r.contractId),'GET',undefined,{ quiet:true });
        if(row && row.id && typeof window.contractsTakeRow==='function' && await window.contractsTakeRow(row)) took = true;
      }catch(_){ /* not ours to see, or not reachable: the next beat asks again */ }
    }
    const owed = state.contracts.filter(c=>c && c.arrivalOwed);
    for(const c of owed){
      try{ if(typeof window.ensureFull==='function') await window.ensureFull(c); }catch(_){ continue; }
      let got = null;
      try{ got = await api('contracts/'+encodeURIComponent(c.id)+'/arrival','POST',{},{ quiet:true }); }catch(_){ continue; }
      delete c.arrivalOwed;
      if(!got || !got.claimed) continue;
      try{ if(typeof window.contractArrived==='function') window.contractArrived(c,{ elsewhere:true, read:false }); }catch(_){}
      try{ if(typeof window.triageAndPaint==='function'){ await window.triageAndPaint(c); read++; } }catch(_){}
    }
  } finally { _ikArriving = false; }
  if(took){
    try{ if(window.updateSidebarCounts) updateSidebarCounts(); }catch(_){}
    try{ if((state.view==='register' || (typeof window.regPlaceUp==='function' && window.regPlaceUp())) && typeof window.regRepaint==='function') window.regRepaint(); }catch(_){}
  }
  return read;
}
/* ---- THE LANES RUN ON THE SERVER (4 Oct 2026, the process review's Requests
   stream) ----
   They ran in whatever browser had HaTi open with a person in it who may
   draft, every ten minutes, and nowhere else — so a request raised at night
   waited for somebody to open a laptop. The "no server-side catalogue"
   reason given for it was answerable: the server reads the built-in
   catalogue's facts from js/templates.js and mints the draft itself
   (runIntakeLanes, server/server.js), on the request's own POST and on its
   sweep, once per request (a cleared request carries its lane and its
   contract, and nothing clears one twice).

   WHAT IS LEFT HERE IS THE BEAT. An editor's open page re-reads the queue on
   the same ten minutes, so the Requests count and the bell's "asked for a
   contract" rows follow what colleagues raised and what the lanes cleared
   without a reload. It fetches nothing for somebody who may not draft. */
const IK_SWEEP_MS = 10 * 60 * 1000;
let _ikSweepOn = false;
async function intakeRefresh(){
  if(typeof canEdit !== 'function' || !canEdit()) return false;
  try{ await loadIntake(); }catch(_){ return false; }
  try{ if(window.updateSidebarCounts) updateSidebarCounts(); }catch(_){}
  try{ if(window.updateAlertBadge) updateAlertBadge(); }catch(_){}
  try{ if(typeof state!=='undefined' && state.view==='intake') renderIntake(); }catch(_){}
  /* A draft a lane made since the last beat is taken in and read (not awaited:
     the readings take the better part of a minute and the beat is done). */
  try{ intakeLaneArrivals().catch(()=>{}); }catch(_){}
  return true;
}
function intakeSweepStart(){
  if(_ikSweepOn) return;
  _ikSweepOn = true;
  try{ setInterval(intakeRefresh, IK_SWEEP_MS); }catch(_){}
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
      confirmLabel:i18t('ik_act_decline'), cancelLabel:i18t('act_cancel'), danger:true });
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
  /* ---- THE QUEUE, AS THE WIDE PAGE READS IT (the owner's list, 27 Sep 2026) ----
     Three faults on this page, each already answered on the wide one:
     · a request you asked for yourself was printed twice for an editor — in
       the queue and under "What you have asked for". The queue is the
       colleagues' requests (its own empty line says so); yours are below,
       with every act the row carries;
     · the queue was newest first, so one past its promised date could sit
       last. It is in the wide page's order: past its promise, then nobody
       holds it (oldest first), then being worked on (intakeStage, ikSort);
     · "Waiting to be picked up (N)" counted every open request, including
       ones somebody already holds. N is the ones nobody holds
       (intakeStatusKey), and the rest of the list is counted beside it. */
  const me=currentUser();
  const mine=intakeMine();
  const IK_RANK=IK_GROUPS.map(g=>g[0]);
  const queue=intakeQueue().filter(r=>!(me&&r.by&&r.by.id===me.id))
    .sort((a,b)=>(IK_RANK.indexOf(intakeStage(a))-IK_RANK.indexOf(intakeStage(b)))||ikSort(a,b));
  const waiting=queue.filter(r=>intakeStatusKey(r)==='open').length, held=queue.length-waiting;
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
      ${rqKindTabsHtml('contracts')}
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
        <h3 style="font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading);margin:0 0 9px">${i18t('ik_queue_head',{n:waiting})}<span style="font-weight:var(--w-body);color:var(--color-neutral-600)">${
          (()=>{ const over=intakePastDue(queue); const med=intakeMedianDays(_intake.list||[]);
            const bits=[]; if(held) bits.push(i18tn('ik_head_held',held,{n:held}));
            if(over) bits.push(i18tn('ik_past_due',over,{n:over}));
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
  host.querySelectorAll('[data-ik-open]').forEach(b=>b.addEventListener('click',()=>{ const id=b.getAttribute('data-ik-open');
    if(!(typeof pdOpenOnHome==='function'&&pdOpenOnHome(id,'open'))) openWorkspace(id); }));
  host.querySelectorAll('[data-ik-pick]').forEach(b=>b.addEventListener('click',()=>intakePick(b.getAttribute('data-ik-pick'))));
  host.querySelectorAll('[data-ik-promise]').forEach(b=>b.addEventListener('click',()=>intakePromiseAsk(b.getAttribute('data-ik-promise'))));
  host.querySelectorAll('[data-ik-track]').forEach(b=>b.addEventListener('click',()=>intakeTrackCopy(b.getAttribute('data-ik-track'))));
  rqKindTabsWire(host);
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
  /* The lanes are the server's (runIntakeLanes): nothing runs here. */
  void may;
}

/* ════════════════════════════════════════════════════════════════════════
   ADVICE IS A KIND OF REQUEST (the process review, gap F, 4 Oct 2026)
   ════════════════════════════════════════════════════════════════════════
   Two queues of one shape had two rail doors: Requests (a colleague asks
   for a contract) and the Advice Desk (a customer asks for advice, a review
   or a draft). One door now — Requests — and the kind is the page's first
   tab row: Contracts · Advice.

   A DOOR MERGE, NOT A DATA MERGE, the shape Our paper took with Our
   standards (paperTabsHtml, js/views/library.js). The Advice tab IS the
   Advice desk board, drawn by renderAdviceDesk under its own view id
   ('advice'): its records, routes, rates, the public portal and the
   customer's tracking page are exactly what they were; every
   setView('advice') still lands on it; a refresh comes back to it (the view
   is what placeSave records, so the tab needs no PLACE_PARTS pair of its
   own); and the rail lights Requests on it (NAV_HOME_FOR, js/app.js).

   THE NUMBERS. The Requests door carried intakeCount() and the Advice door
   the open advice requests; requestsDoorCount is the two added, so the
   reader sees the total they saw on the two doors, and each tab carries its
   own half — the door is the sum of the tabs it opens. Two different
   records, so nothing is counted twice. A tab at zero prints no number, as
   the views row under it does. */
const RQ_KINDS = ['contracts', 'advice'];
const RQ_KIND_VIEW = { contracts:'intake', advice:'advice' };
function rqKindCounts(){
  const ik = (typeof intakeCount === 'function') ? intakeCount() : 0;
  const ad = (typeof window !== 'undefined' && typeof window.adviceActiveCount === 'function') ? window.adviceActiveCount() : 0;
  return { contracts: Number(ik) || 0, advice: Number(ad) || 0 };
}
function requestsDoorCount(){ const n = rqKindCounts(); return n.contracts + n.advice; }
/* ---- ONE TAB ROW (SAP benchmark, batch 2 — the owner's "go", 9 Oct 2026) ----
   The drawing's Requests page has ONE row: Open · Mine · Advice · Finished
   this month · All. The kind row (Contracts · Advice) and the views row under
   it were two rows saying where you are. Advice is still its own view (a door
   merge, not a data merge — f495), so its tab is a page change; every other
   tab is a view of the contracts queue and, from the Advice page, lands back
   on Requests at that view. `lit` is 'advice' or a view key; 'contracts'
   means "the view the reader is on". Counts are the list each tab opens.

   THE ROW'S ONE READING (Part 8, the Legora way, 21 Oct 2026): ikTabViews
   is every tab with the rows its press shows and its hover — the words the
   list's own card head used to say ("Open requests · oldest waiting first").
   Requests draws it in the list head (lhTabsHtml); the Advice board and the
   narrow page draw it here, with the kind each tab opens. A tab with no rows
   is left out unless it is lit or All, on all three. */
const IK_CARD_WORDS = { open:'ik_card_open', mine:'ik_card_mine', advice:'ik_card_advice', fin:'ik_card_fin', all:'ik_card_all' };
function ikTabViews(asker, f){
  const g = f || ikFilters();
  const base = ikBase(g, asker);
  const V = asker?IK_V_ASKER:IK_V_TEAM;
  /* the team's Open list leads with the longest wait (round 20); every other
     list, and the asker's, newest first */
  const hover = k => [i18t(IK_CARD_WORDS[k]||'ik_card_all'), i18t(!asker&&k==='open'?'ik_sort_oldest':'ik_sort_newest')].join(' · ');
  /* For the team the Advice tab is a cut of this list (IK_V_TEAM carries it,
     SAP batch 2), counted like every other tab from the list behind it. For
     somebody who only asks it stays the door onto the advice desk, and its
     number is the open advice requests, the door's half. */
  const tabs = V.map(([k,key])=>({ k, kind:'contracts', label:i18t(key),
    n:base.filter(r=>ikPassView(r,k,asker)).length, keep:k==='all', title:hover(k) }));
  /* the asker's Advice tab is a DOOR to the advice desk's own page, not a
     view of this list: kept at zero, so the page is never left without its
     one way in */
  if(asker) tabs.splice(1, 0, { k:'advice', kind:'advice', label:i18t('rq_kind_advice'), n:rqKindCounts().advice, keep:true, title:i18t('ik_card_advice') });
  return tabs;
}
function rqKindTabsHtml(lit){
  const may = (typeof canEdit==='function'&&canEdit());
  const asker = !may;
  const f = ikFilters();
  const cur = lit==='advice' ? 'advice' : (lit && lit!=='contracts' ? lit : f.view);
  const tabs = ikTabViews(asker, f).filter(t=>t.n||t.keep||t.k===cur);
  /* the row says what it was drawn as (lit) and what it shows (sig), so the
     door's beat draws it again where a number moved or a tab came or went */
  const sig = tabs.map(t=>t.k+':'+t.n).join(',');
  return `<div class="reg-views rq-kinds" role="tablist" aria-label="${esc(i18t('rq_kinds_label'))}" data-rq-lit="${esc(lit||'contracts')}" data-rq-sig="${esc(sig)}">${tabs.map(t=>{
    const on = t.k===cur;
    return `<button type="button" role="tab" class="reg-vtab${on?' on':''}${!t.n&&!on?' is-zero':''}" data-rq-kind="${t.kind}"${
      t.kind==='contracts'?` data-ik-view="${esc(t.k)}"`:''} aria-selected="${on?'true':'false'}"${t.title?` title="${esc(t.title)}"`:''}>${esc(t.label)}<span class="n"${
      t.k==='advice'?' data-rq-n="advice"':''}${t.n?'':' hidden'}>${t.n}</span></button>`; }).join('')}</div>`;
}
/* The numbers move on a load or a save with no repaint of the page (the
   advice list lands after the first paint; the intake beat re-reads the
   queue) — so updateSidebarCounts, which writes the door, writes the tabs on
   the same beat, from the same reading. */
function rqPaintKindCounts(){
  if(typeof document === 'undefined') return;
  /* THE ADVICE LIST LANDS AFTER THE FIRST PAINT (lane A3's second pass: seen
     once after a reload, the tabs counted advice the list did not show): the
     team's list painted with fewer advice requests than there are now is
     painted again, so a tab's number and its list stay one reading */
  const pg = document.querySelector('.ik-ins [data-ik-adv]');
  if(pg && typeof state !== 'undefined' && state.view === 'intake' && Number(pg.getAttribute('data-ik-adv')) !== ikAdviceRows().length){
    if(typeof keepScroll === 'function') keepScroll(()=>renderIntake()); else renderIntake();
    return;
  }
  /* the list head's tab row (Requests): counted again in place, and only
     where a number moved — a recount closes a list left open on "+ Filter" */
  if(ikHeadMoved() && typeof lhHeadSync === 'function') lhHeadSync(IK_SEAT);
  /* the rows this file draws (the Advice board, the narrow page): drawn again
     where what they show has moved, a tab that came or went included (the
     team's Advice tab is a cut of the list, counted like every other tab) */
  document.querySelectorAll('.rq-kinds[data-rq-sig]').forEach(row=>{
    const box = document.createElement('div');
    box.innerHTML = rqKindTabsHtml(row.getAttribute('data-rq-lit') || 'contracts');
    const fresh = box.firstElementChild;
    if(!fresh || fresh.getAttribute('data-rq-sig') === row.getAttribute('data-rq-sig')) return;
    const host = row.parentElement;
    row.replaceWith(fresh);
    rqKindTabsWire(host);
  });
}
/* WHETHER THE LIST HEAD'S TABS STILL SAY WHAT THE LIST HOLDS: the tabs drawn,
   and their numbers, against the one reading. No head, nothing moved. */
function ikHeadMoved(){
  if(typeof document === 'undefined') return false;
  const head = document.querySelector(`[data-lh-seat="${IK_SEAT}"]`); if(!head) return false;
  const pg = (typeof LH_PAGES === 'object' && LH_PAGES) ? LH_PAGES[IK_SEAT] : null;
  if(!pg || typeof pg.tabs !== 'function') return false;
  const cur = String(typeof pg.tabNow === 'function' ? pg.tabNow() : '');
  const want = pg.tabs().filter(t=>t.n||t.keep||String(t.k)===cur).map(t=>t.k+':'+(t.n||0)).join(',');
  const drawn = [...head.querySelectorAll('[role="tab"][data-ik-view]')].map(b=>{
    const n = b.querySelector('.n'); return b.getAttribute('data-ik-view')+':'+(n?(Number(n.textContent.replace(/\D/g,''))||0):0); }).join(',');
  return want !== drawn;
}
/* A press on the other kind is a page change (the two are two views); a
   press on the lit one does nothing. Each tab is bound once: the door's beat
   may draw a row again under the same host. */
function rqKindTabsWire(root){
  const host = root || (typeof document !== 'undefined' ? document : null); if(!host) return;
  host.querySelectorAll('[data-rq-kind]').forEach(b=>{
    if(b.dataset.rqBound) return;
    b.dataset.rqBound = '1';
    b.addEventListener('click',()=>{
      const v = RQ_KIND_VIEW[b.getAttribute('data-rq-kind')];
      if(!v || (typeof state !== 'undefined' && state.view === v)) return;
      /* from the Advice page, a queue tab lands on Requests at that view */
      const iv = b.getAttribute('data-ik-view'); if(iv) ikFilters().view = iv;
      if(typeof setView === 'function') setView(v);
    });
  });
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
/* "Finished" on the tab (round 20 as drawn); the card it opens still says
   "Finished this month", the pile's own name */
const IK_V_TEAM = [['open','ik_v_open'],['mine','ik_v_mine'],['advice','rq_kind_advice'],['fin','ik_v_finished'],['all','ik_v_all']];
const IK_V_ASKER = [['open','ik_v_open'],['fin','ik_v_fin_asker'],['all','ik_v_all']];
const IK_DEF = { view:'open', who:'all', road:'all', folder:'all', q:'' };
/* THE BAND'S BOXES (round 20 as drawn): Request · Stream · With. How it is
   handled is read in its own column and no longer narrows the list, so
   `road` stays at rest ('all') and is not one of the boxes counted */
const IK_CHIPS = ['who', 'folder'];
let _ikF = null;
function ikFilters(){ if(!_ikF) _ikF={ ...IK_DEF }; return _ikF; }
/* A REFRESH LANDS AT THE SAME SPOT (the owner's rule; PLACE_PARTS.intake):
   the tab, the band's boxes and the chosen row on either seat. Put back
   before the first paint, so nothing is drawn twice; a row no longer on the
   list falls back to insPick's first row, as a filter would. */
function ikPlace(){
  const sel=k=>(typeof insSelected==='function')?insSelected(k):null;
  return { ...ikFilters(), sel:{ team:sel('intake:team'), asker:sel('intake:asker') } };
}
function ikPlacePut(p){
  if(!p||typeof p!=='object') return;
  const f=ikFilters();
  Object.keys(IK_DEF).forEach(k=>{ if(p[k]!=null) f[k]=String(p[k]); });
  /* the chosen row waits for the list (it is fetched once per sitting) */
  const s=p.sel||{};
  _ikBack={ 'intake:team':s.team?String(s.team):null, 'intake:asker':s.asker?String(s.asker):null };
}
let _ikBack=null;
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
  const opt=Object.assign({ day:'numeric', month:'short' },
    ((o&&o.long)||d.getFullYear()!==new Date().getFullYear())?{ year:'numeric' }:{});
  /* THE WEEKDAY BEFORE THE DAY, NO COMMA (round 20 as drawn: "Tue 20 Oct",
     "Sun 18 Oct"): asked as two parts and set side by side, so the market's
     own "Tue, 20 Oct" never cuts the Promised by column short */
  try{ const day=d.toLocaleDateString(langLocale(), opt);
    return (o&&o.weekday) ? `${d.toLocaleDateString(langLocale(), { weekday:'short' })} ${day}` : day; }
  catch(_){ return s.slice(0,10); }
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
  if(r && r.status==='drafted') return 'drafted';
  if(IK_STOPPED.includes(r&&r.status)) return (asker||intakeFinishedThisMonth(r))?'fin':'old';
  const p=intakePromise(r);
  if(p&&p.k==='over') return 'over';
  return intakeStatusKey(r)==='held'||(r&&r.status==='accepted')?'held':'nobody';
}
const IK_GROUPS = [
  ['over',  'ik_g_over',   'ik_g_over',          'ruby'],
  ['nobody','ik_g_nobody', 'ik_g_nobody_asker',  'amber'],
  ['held',  'ik_g_held',   'ik_g_held',          'steel'],
  ['drafted','ik_g_drafted','ik_g_drafted',       'steel'],
  ['fin',   'ik_g_fin',    'ik_g_fin_asker',     'green'],
  ['old',   'ik_g_old',    'ik_g_old',           'gray'],
];
/* ---- ADVICE REQUESTS SIT IN THE SAME LIST (SAP benchmark, batch 2 — the
   owner: "they all need to be built the SAP way") ----
   The drawing lists both kinds in one table with a Kind column, and the
   Advice tab is a cut of that list. THE RECORDS ARE NOT MERGED: an advice
   request is still js/advice.js's own record and every act on it is that
   page's (openAdviceModal, the board); this is a reading of it in the
   Requests list's shape, team only (an asker never saw the advice desk). */
const IK_ADV_DONE = ['Delivered','Closed'];
function ikAdviceRows(){
  const L=(typeof window!=='undefined'&&window.state&&Array.isArray(state.advice))?state.advice:[];
  const svc=k=>(window.ADVICE_SERVICES&&ADVICE_SERVICES[k]&&ADVICE_SERVICES[k].name)||String(k||'');
  return L.map(a=>({ _adv:true, id:a.id, title:svc(a.service), need:a.description==='Seeded as sample data'?'':(a.description||''),
    by:{ name:a.name||'' }, company:a.company||'', status:a.status, createdAt:a.submittedAt||'', eta:a.eta||'', holder:String(a.assignee||'').trim(), raw:a }));
}
function ikAdviceFinishedThisMonth(r){
  if(!IK_ADV_DONE.includes(r.status)) return false;
  const h=((r.raw&&r.raw.history)||[]).filter(x=>IK_ADV_DONE.includes(x.to)).pop();
  const d=new Date(h&&h.at||''); if(isNaN(d.getTime())) return false;
  const n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth();
}
function ikPassView(r, v, asker){
  if(r&&r._adv){
    if(v==='open') return !IK_ADV_DONE.includes(r.status);
    /* the cut's count is the open advice (the door's half), so the cut holds
       exactly those; a finished one is under Finished and All */
    if(v==='advice') return !IK_ADV_DONE.includes(r.status);
    if(v==='fin') return ikAdviceFinishedThisMonth(r);
    return v==='all';
  }
  if(v==='advice') return false;
  if(v==='open') return !IK_STOPPED.includes(r.status);
  if(v==='mine') return ikIsMine(r);
  if(v==='fin') return IK_STOPPED.includes(r.status)&&(asker||intakeFinishedThisMonth(r));
  return true;
}
function ikPassChips(r, f){
  /* AN ADVICE REQUEST under the same boxes (lane A3's second pass: the tab's
     number and the list behind it are one reading): it has no stream, so a
     stream narrows it out; With reads the advice desk's own holder (a name) */
  if(r&&r._adv){
    if(f.folder!=='all') return false;
    const me=_ikMe(), mine=!!(me&&r.holder&&r.holder===String(me.name||'').trim());
    if(f.who==='me'&&!mine) return false;
    if(f.who==='nobody'&&(r.holder||IK_ADV_DONE.includes(r.status))) return false;
    if(f.who==='other'&&!(r.holder&&!mine)) return false;
    return true;
  }
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
/* `o.face===false` (the team's list as drawn in round 20): the name alone, no
   initials beside it; "You" in the reader's own weight */
function ikWhoHtml(name, shown, o){
  if(o&&o.face===false) return `<span class="ins-who ik-who${shown&&shown!==name?' is-you':''}"><span title="${esc(name)}">${esc(shown||name)}</span></span>`;
  return `<span class="ins-who"><i class="ins-av" aria-hidden="true">${esc(ikInitials(name))}</i><span title="${esc(name)}">${esc(shown||name)}</span></span>`;
}
function ikWithCellHtml(r, asker, o){
  if(IK_STOPPED.includes(r.status)){
    if(r.status==='declined') return `<span class="ins-quiet">${esc(i18t('ik_st_declined'))}</span>`;
    if(r.status==='withdrawn') return `<span class="ins-quiet">${esc(i18t('ik_st_withdrawn'))}</span>`;
    if(r.lane) return `<span class="ins-ok">${esc(i18t('ik_with_lane'))}</span>`;
    const n=(r.assignee&&r.assignee.name)||r.decidedBy||'';
    return n?ikWhoHtml(n, '', o):`<span class="ins-quiet">—</span>`;
  }
  if(!(r.assignee&&r.assignee.id)) return `<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
  return ikWhoHtml(r.assignee.name||'', (!asker&&ikHeldByMe(r))?i18t('ik_with_you'):'', o);
}
/* WITH, AS THE TEAM'S LIST SAYS IT (round 20 of the redesign, owner picked
   "The SAP way" for Requests, 17 Oct 2026): who holds it, "You" for the
   reader, "Nobody yet" in amber — the asker's own cell, ONE builder — and,
   while it is open, the lane that sent it: a small chip with the lane's mark
   on the same line ("You ⇉ NDA lane", as drawn), the name without initials */
function ikWithListHtml(r){
  /* THE LIST LANGUAGE (owner, 27 Oct 2026, as drawn): nobody is a reading with its dot; a holder
     wears tinted initials over "holds it", the lane that sent it on that grey line */
  if(!IK_STOPPED.includes(r.status)){
    if(!(r.assignee&&r.assignee.id)){
      const w=typeof listWordHtml==='function'?listWordHtml('amber', i18t('ik_with_nobody')):`<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
      return r.lane?`${w} ${ikLaneChipHtml(r.lane)}`:w;
    }
    const name=r.assignee.name||'', tone=typeof listAvatarTone==='function'?listAvatarTone(name):'gray';
    const shown=ikHeldByMe(r)?i18t('ik_with_you'):name;
    return `<span class="ik-holder"><i class="ls-av ik-av" style="background:var(--st-${tone}-bg);color:var(--st-${tone}-fg)" aria-hidden="true">${esc(ikInitials(name))}</i><span class="ins-c2"><b title="${esc(name)}">${esc(shown)}</b><span>${esc(i18t('ik_with_holds'))}${r.lane?` ${ikLaneChipHtml(r.lane)}`:''}</span></span></span>`;
  }
  return ikWithCellHtml(r, false, { face:false });
}
/* the lane's chip — the list's With cell and the panel's head say it alike */
function ikLaneChipHtml(lane, words){
  const ic=typeof icon==='function'?icon('lane','ik-lane-ic'):'';
  return `<span class="ik-lane-chip" title="${esc(i18t('ik_why_lane',{name:lane}))}">${ic}${esc(words||i18t('ik_lane_chip',{lane}))}</span>`;
}
/* the files a request carries, as a count with the clip; none is a dash */
function ikFilesCellHtml(r){
  const n=Array.isArray(r&&r.files)?r.files.length:0;
  return n?`<span class="ik-files-n" title="${esc(i18tn('ik_files_n',n,{n}))}">${typeof icon==='function'?icon('clip','w-3.5 h-3.5'):''}${n}</span>`:`<span class="ins-quiet">—</span>`;
}
/* HOW IT IS HANDLED, READ FROM THE WORDS (round 20 as drawn: the NDA lane's
   request reads "Routine", and the lane is said where it belongs — in With).
   The road a lane's rule would win (intakeRoad's first line) is left out
   here; the rest is intakeRoad's own reading, unchanged. */
function ikRoadShown(r){ return intakeRoad(r&&r.lane?Object.assign({}, r, { lane:'' }):r); }
/* the road as a pill, in the drawing's tones: routine green, standard grey,
   a close read amber */
function ikRoadHtml(r){
  const road=ikRoadShown(r);
  const rd=IK_ROADS[road.k]||IK_ROADS.standard;
  return `<span class="ik-road is-${road.k}"${road.why?` title="${esc(road.why)}"`:''}>${esc(rd.label)}</span>`;
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
  if(g==='drafted') return { tone, html:`${esc(i18t('ik_s_drafted_unsent',{id:r.contractId||''}))}${
    r.lane?` <span class="x">· ${esc(i18t('ik_s_lane'))}</span>`:''}` };
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
  /* A REQUEST THAT BECAME A CONTRACT carries the doors every list draws
     (owner, 12 Oct 2026), Workspace filled since the Document door went
     (15 Oct 2026), in place of "Open MK-…". */
  const doorC=r.contractId&&typeof getContract==='function'?getContract(r.contractId):null;
  const doorActs=()=>doorC&&typeof insDoorActs==='function'?insDoorActs(doorC,{ lead:'ws' })
    :(r.contractId?[{ k:'open', kind:'accent', label:i18t('ik_act_open_mk',{id:r.contractId}), run:()=>openWorkspace(r.contractId) }]:[]);
  const openAct=r.contractId?true:null;
  if(asker){
    if(live&&ikIsMine(r)) acts.push({ k:'withdraw', label:i18t('ik_act_withdraw'), title:i18t('ik_withdraw_msg'), run:()=>intakeSetStatus(r.id,'withdrawn') });
    if(openAct&&(r.status==='done'||r.status==='drafted')) acts.unshift(...doorActs());
    if(track) acts.push({ k:'track', label:i18t('ik_act_copy_track'), icon:'link', title:i18t('ik_track_title'), run:()=>intakeTrackCopy(r.id) });
    return { acts, menu:'' };
  }
  /* THE DRAWING'S ROW (round 20 as drawn): "Start the draft" filled, then
     "Promise a day" and "Hand back" (the decline, with its reason — the asker
     is told why) beside it; the rest — pick up / put down / take over,
     withdraw, the tracker link — stays under ⋯ ("everything they do today
     stays", the round's own words). Every verb is the one it always was. */
  if(may&&r.status==='open') acts.push({ k:'draft', kind:'accent', label:i18t('ik_act_draft'), attrs:`data-ik-draft="${esc(r.id)}"`, run:()=>intakeDraft(r.id) });
  if(may&&live) acts.push({ k:'promise', label:r.promisedAt?i18t('ik_act_repromise'):i18t('ik_act_promise'), title:i18t('ik_promise_msg'), run:()=>intakePromiseAsk(r.id) });
  if(may&&r.status==='open') acts.push({ k:'decline', label:i18t('ik_act_hand_back'), title:i18t('ik_decline_msg'), run:()=>intakeSetStatus(r.id,'declined') });
  if(openAct&&(r.status==='done'||r.status==='drafted')) acts.unshift(...doorActs());
  if(may&&live) menu.push(insMenuItemHtml({ k:'pick', label:intakePickLabel(r) }));
  if(live&&(ikIsMine(r)||(typeof isAdmin==='function'&&isAdmin()))) menu.push(insMenuItemHtml({ k:'withdraw', label:i18t('ik_act_withdraw'), says:i18t('ik_withdraw_msg') }));
  if(track) menu.push(insMenuItemHtml({ k:'track', label:i18t('ik_act_copy_track'), icon:'link', says:i18t('ik_track_title') }));
  return { acts, menu:menu.join('') };
}
function ikHistoryHtml(r, asker){
  const h=[];
  const mine=ikIsMine(r);
  h.push({ t: mine?i18t('ik_h_asked_you'):i18t('ik_h_asked',{who:(r.by&&r.by.name)||''}), at:r.createdAt });
  const at=intakeStoppedAt(r);
  const by=String(r.decidedBy||'').trim();
  if(r.status==='drafted') h.push({ t: r.lane?i18t('ik_h_lane',{lane:r.lane,id:r.contractId||''})
    : by?i18t('ik_h_drafted_by',{id:r.contractId||'',who:by}):i18t('ik_h_drafted',{id:r.contractId||''}), at:r.decidedAt||r.updatedAt });
  if(r.status==='done') h.push({ t: r.lane?i18t('ik_h_lane',{lane:r.lane,id:r.contractId||''})
    : by?i18t('ik_h_drafted_by',{id:r.contractId||'',who:by}):i18t('ik_h_drafted',{id:r.contractId||''}), at });
  if(r.status==='declined') h.push({ t: by?i18t('ik_h_declined_by',{who:by}):i18t('ik_h_declined'), at });
  if(r.status==='withdrawn') h.push({ t:i18t('ik_h_withdrawn'), at });
  h.sort((a,b)=>String(b.at||'').localeCompare(String(a.at||'')));
  return insSecHtml(i18t('ik_sec_history'), '', `<ul class="ins-log">${h.map(l=>`<li><span class="t">${esc(l.t)}</span><span class="w">${esc(ikDay(l.at))}</span></li>`).join('')}</ul>`, 'ik-hist');
}
/* A REQUEST'S FILES — the same caps the server holds (IK_FILES_MAX,
   IK_FILE_MAX_MB in server/server.js); the server is the wall. */
const IK_FILES_MAX = 3, IK_FILE_MAX_MB = 5;
function ikFileSize(n){ const b=Number(n)||0; return b>=1048576?(Math.round(b/104857.6)/10)+' MB':Math.max(1,Math.round(b/1024))+' KB'; }
function ikFilesHtml(r, o){
  const L=Array.isArray(r&&r.files)?r.files:[];
  /* THE TEAM'S PANEL AS DRAWN (round 20): "Attachments 1 of 3", each file a
     card — its name, its size and who added it (the person who asked: a
     request's files arrive with the ask, POST /api/intake), and Open */
  if(o&&o.cards){
    const who=ikIsMine(r)?'':String((r.by&&r.by.name)||'').trim().split(/\s+/)[0];
    const sub=fl=>who?i18t('ik_file_by',{ size:ikFileSize(fl.size), who }):i18t('ik_file_by_you',{ size:ikFileSize(fl.size) });
    return insSecHtml(i18t('ik_sec_files'), i18t('ik_files_of',{ n:L.length, max:IK_FILES_MAX }), L.length?`<div class="ik-file-cards">${L.map(fl=>`<div class="ik-file">${
      typeof icon==='function'?icon('file','ik-file-ic'):''}<div class="ik-file-b"><b title="${esc(fl.name)}">${esc(fl.name)}</b><span>${esc(sub(fl))}</span></div><button type="button" class="ui-btn ui-btn-sm" data-ik-file="${esc(fl.id)}" data-ik-fname="${esc(fl.name)}">${esc(i18t('ik_file_open'))}</button></div>`).join('')}</div>`
      :`<p class="ins-note">${esc(i18t('ik_files_none'))}</p>`, 'ik-files');
  }
  return insSecHtml(i18t('ik_sec_files'), L.length||'', L.length?`<ul class="ik-file-list">${L.map(fl=>`<li><button type="button" class="ui-link" data-ik-file="${esc(fl.id)}" data-ik-fname="${esc(fl.name)}">${typeof icon==='function'?icon('file','w-3.5 h-3.5'):''}${esc(fl.name)}</button><span class="ins-quiet"> · ${esc(ikFileSize(fl.size))}</span></li>`).join('')}</ul>`
    :`<p class="ins-note">${esc(i18t('ik_files_none'))}</p>`, 'ik-files');
}
/* The file comes back through the signed-in session and is handed to the
   browser's own save. */
async function intakeFileGet(id, fid, name, o){
  /* OPEN OPENS IT (round 20 as drawn: the file card's Open): a file the
     browser can show — a PDF, a photo, plain text — opens in a tab of its
     own; anything else, or a browser that refuses the tab, is saved. The tab
     is asked for on the press itself, before the file is fetched, so no
     pop-up blocker takes it for an unasked window. */
  const tab=(o&&o.open&&typeof window.open==='function')?window.open('', '_blank'):null;
  try{
    const res=await fetch('api/intake/'+encodeURIComponent(id)+'/files/'+encodeURIComponent(fid),{ credentials:'same-origin' });
    if(!res.ok) throw new Error(i18t('ik_file_get_failed'));
    const blob=await res.blob();
    const url=URL.createObjectURL(blob);
    /* never an SVG or HTML: a file a colleague uploaded must not run as a
       page of ours (a blob URL is this site's origin) */
    if(tab && /^(application\/pdf|image\/(png|jpe?g|gif|webp)|text\/plain)(;|$)/.test(blob.type||'')){
      tab.location.href=url; setTimeout(()=>URL.revokeObjectURL(url), 60000); return;
    }
    if(tab){ try{ tab.close(); }catch(_){} }
    const a=document.createElement('a'); a.href=url; a.download=name||'file';
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }catch(e){ if(tab){ try{ tab.close(); }catch(_){} } toast((e&&e.message)||i18t('ik_file_get_failed'),'err'); }
}
/* "Sent" must mean sent: the page promises an email only where one can go. */
function ikMails(){
  return !!(typeof API_MODE==='function'&&API_MODE()
    && !(typeof emailOff==='function'&&emailOff())
    && !(typeof emailFailing==='function'&&emailFailing()));
}
/* ════════════════════════════════════════════════════════════════════════
   THE REQUEST IN JAMBO'S PANEL, AS DRAWN (round 20 of the redesign, owner
   picked "The SAP way" by name, 17 Oct 2026; every drawn part built on the
   owner's yes of 18 Oct 2026 — "build all the gaps")
   ════════════════════════════════════════════════════════════════════════
   REQ-1042 · Contract · from Sara Nyström · Sales / the title / Routine ·
   "⇉ With you · by the NDA lane" / Start the draft · Promise a day · Hand
   back / What Sara asked for (her own words, quoted) / Counterparty (and
   whether an NDA with them stands today, read from the book) · Stream · How
   it is handled (with its one line) · With · Asked · promised by /
   Attachments 1 of 3 / Jambo: the paper on our shelves that fits. EVERY
   READING IS ONE THAT ALREADY EXISTS: intakeRoad, cuNdaOf (the Parties page's
   NDA column), caDraftRank (draft from a sentence), IK_FILES_MAX. Nothing here
   asks a model and nothing writes. */
const ikFirst = n => String(n||'').trim().split(/\s+/)[0]||'';
/* AN NDA WITH THEM TODAY — the Parties page's own reading (cuNdaOf: the
   confirmed facts of a signed NDA, never the wording), in a few words */
function ikCpNdaWords(name){
  if(!name || typeof window.cuNdaOf!=='function' || typeof window.cuKeyOf!=='function') return '';
  let x=null; try{ x=cuNdaOf(cuKeyOf(name)); }catch(_){ x=null; }
  const day=iso=>(typeof regDotDate==='function')?regDotDate(iso):String(iso||'');
  if(!x || x.state==='none') return i18t('ik_cp_nda_none');
  if(x.state==='inforce') return i18t('ik_cp_nda_inforce',{ until:x.forGood?i18t('nda_for_good_lc'):i18t('nda_until',{ d:day(x.ends) }) });
  if(x.state==='ended') return i18t('ik_cp_nda_ended',{ d:day(x.ends) });
  return i18t(x.state==='unconfirmed'?'ik_cp_nda_unconfirmed':'ik_cp_nda_draft');
}
/* The counterparty's name is the door to its contracts on the Contracts place
   (cuOpenCustomer, Parties' own Open party) where the book holds any; a name
   the book has never seen is said plainly */
function ikCpHtml(r){
  const cp=String((r&&r.counterparty)||'').trim(); if(!cp) return '';
  let key='', door=false;
  try{ key=typeof window.cuKeyOf==='function'?cuKeyOf(cp):''; const v=key&&typeof window.cuCustomerOf==='function'?cuCustomerOf(key):null; door=!!(v&&v.items&&v.items.length); }catch(_){ door=false; }
  const name=door?`<button type="button" class="ik-cp-go" data-ik-cp="${esc(key)}" title="${esc(i18t('ik_cp_go',{ cp }))}">${esc(cp)}</button>`:`<span class="ik-cp-n">${esc(cp)}</span>`;
  const nda=ikCpNdaWords(cp);
  return name+(nda?` <span class="ik-cp-nda">· ${esc(nda)}</span>`:'');
}
/* With, as a sentence: "Maria Lindgren (you), sent by the NDA lane" */
function ikWithRowHtml(r){
  if(IK_STOPPED.includes(r.status)) return esc((r.assignee&&r.assignee.name)||r.decidedBy||'');
  if(!(r.assignee&&r.assignee.id)) return `<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
  const n=r.assignee.name||'';
  const who=ikHeldByMe(r)?i18t('ik_with_you_name',{ name:n }):n;
  return esc(r.lane?i18t('ik_with_sent_comma',{ who, lane:r.lane }):who);
}
/* Asked: "Sun 18 Oct · promised by —", the promise in red once it has passed;
   a finished one says how long it took */
function ikAskedHtml(r){
  const day=ikDay(r.createdAt,{ weekday:true });
  if(IK_STOPPED.includes(r.status)){ const m=intakeMinutes(r); return esc(m==null?day:i18t('ik_asked_took',{ day, t:ikTookWords(m) })); }
  const p=intakePromise(r);
  const by=r.promisedAt?ikDay(String(r.promisedAt).slice(0,10),{ weekday:true }):'—';
  return `${esc(day)} · <span class="${p&&p.k==='over'?'ins-late':''}">${esc(i18t('ik_promised_by',{ by }))}</span>`;
}
/* THE TWO PILLS UNDER THE TITLE: how it is handled, then whose it is ("With
   you · by the NDA lane"); a request past its promise says so first, in red;
   a drafted or finished one wears its pile in place of With */
function ikHeadPillsHtml(r){
  const out=[];
  const p=intakePromise(r);
  if(p&&p.k==='over') out.push(`<span class="reg-stg ins-pill is-ruby"><i aria-hidden="true"></i>${esc(i18t('ik_g_over'))}</span>`);
  out.push(ikRoadHtml(r));
  const g=intakeStage(r);
  if(g==='drafted'||g==='fin'||g==='old'){
    const G=IK_GROUPS.find(x=>x[0]===g)||[];
    out.push(`<span class="reg-stg ins-pill is-${esc(G[3]||'gray')}"><i aria-hidden="true"></i>${esc(i18t(G[1]||'ik_g_fin'))}</span>`);
    return out.join('');
  }
  if(!(r.assignee&&r.assignee.id)){ out.push(`<span class="ik-with-chip is-nobody">${esc(i18t('ik_g_nobody'))}</span>`); return out.join(''); }
  const me=ikHeldByMe(r), who=r.assignee.name||'';
  const words=me?(r.lane?i18t('ik_pill_with_you_lane',{ lane:r.lane }):i18t('ik_pill_with_you'))
    :(r.lane?i18t('ik_pill_with_lane',{ who, lane:r.lane }):i18t('ik_pill_with',{ who }));
  out.push(`<span class="ik-with-chip"${r.lane?` title="${esc(i18t('ik_why_lane',{ name:r.lane }))}"`:''}>${r.lane&&typeof icon==='function'?icon('lane','ik-lane-ic'):''}${esc(words)}</span>`);
  return out.join('');
}
/* THE PAPER THAT FITS, READ WITHOUT AI (round 20 as drawn: "Our Mutual NDA
   fits: …"): the request's title and words against every shelf of our paper
   (ikShelfOf = draftCandidates), by draft-from-a-sentence's own ranking
   (caDraftRank; round 4's "read without AI"). The best counts only where it
   shares a word with the ask — none is said as none, never guessed. Start
   the draft chooses THIS one, so the panel and the form cannot disagree. */
function ikFitOf(r){
  if(!r || typeof window.caDraftRank!=='function' || typeof window.caDraftScore!=='function') return null;
  const words=`${r.title||''}\n${r.need||''}`;
  let cands=[]; try{ cands=ikShelfOf(); }catch(_){ cands=[]; }
  if(!cands.length) return null;
  const best=caDraftRank(words, cands, null)[0];
  if(!best || caDraftScore(words, best)<=0) return null;
  /* the words said as THE ASK spells them ("plant", not the paper's "Plant") */
  const askSpelling=w=>{ const m=new RegExp('(^|[^A-Za-z0-9À-ÿ])('+String(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')(?=$|[^A-Za-z0-9À-ÿ])','i').exec(words); return m?m[2]:w; };
  const shared=((typeof window.caDraftShared==='function')?caDraftShared(words, best):[]).map(askSpelling);
  /* A FIT IS SAID ONLY WHERE THE ASK NAMES THE PAPER ITSELF: a word shared
     with the paper's own name ("NDA"), not only with its description — one
     word in common with a blurb is "the closest", never "fits" (lane A3's
     second check: "plant" made an equipment lease "fit") */
  const said=new Set((typeof window.caDraftWords==='function')?caDraftWords(words):[]);
  const strong=(typeof window.caDraftWords==='function')&&caDraftWords(best.name||'').some(w=>said.has(w));
  /* the name the New agreement form lists it under (its own row's words), so
     the panel and the form say the same name */
  const name=best.name||(typeof window.caDraftTitleOf==='function'?caDraftTitleOf(best):'');
  return { kind:best.kind==='builtin'?'tid':best.kind, id:best.id, name, shared, strong:!!strong };
}
function ikFitHtml(r){
  const fit=ikFitOf(r);
  const who=ikIsMine(r)?'':ikFirst(r.by&&r.by.name);
  const whose=who?i18t('jl_ik_whose',{ first:who }):i18t('jl_ik_whose_you');
  const MARK='\u0001';
  let html;
  if(!fit) html=esc(i18t('jl_ik_fit_none',{ who:who||i18t('jl_ik_who_you') }));
  else {
    const words=fit.shared.map(w=>i18t('ik_quote',{ t:w })).join(', ');
    const k=(fit.strong&&ikRoadShown(r).k==='routine')?'jl_ik_fit_routine':'jl_ik_fit_closest';
    const asks=who?i18t('jl_ik_asks',{ first:who }):i18t('jl_ik_asks_you');
    html=esc(i18t(k,{ name:MARK, whose, words, asks })).replace(MARK, `<b>${esc(fit.name)}</b>`);
  }
  const face=(typeof jamboFaceHtml==='function')?jamboFaceHtml('hello', 24, 'jl-say-face').replace('<img', '<img data-ink-exempt'):'';
  return insSecHtml(i18t('pd_tab_copilot'), '', `<div class="jl-say ik-fit" data-ik-fit="${esc(fit?fit.kind+':'+fit.id:'')}" title="${esc(i18t('jl_ik_fit_src'))}">${face}<div class="jl-bub">${html}</div></div>`, 'ik-fit-sec');
}
function ikTeamPanelOpts(r, o){
  const { acts, menu, first, mine, stream, stopped }=o;
  const from=mine?i18t('ik_eb_from_you'):i18t('ik_eb_from',{ name:(r.by&&r.by.name)||'' });
  const road=ikRoadShown(r);
  const rd=IK_ROADS[road.k]||IK_ROADS.standard;
  const val=r.answers&&r.answers.value!=null&&String(r.answers.value).trim()!==''?String(r.answers.value):'';
  const rows=[
    { k:'cp', label:i18t('ik_f_cp'), v:ikCpHtml(r) },
    val?{ k:'value', label:i18t('ik_f_value'), v:esc(val) }:null,
    { k:'stream', label:i18t('reg_chip_stream'), v:esc(stream) },
    { k:'road', label:i18t('ik_f_road'), v:esc(road.why?i18t('ik_road_line',{ road:rd.label, why:road.why }):rd.label) },
    { k:'with', label:i18t('ik_f_with'), v:ikWithRowHtml(r) },
    { k:'asked', label:i18t('ik_f_asked'), v:ikAskedHtml(r) } ];
  let body=insSecHtml(mine?i18t('ik_sec_need_you'):i18t('ik_sec_need',{ first }), '',
    r.need?`<blockquote class="ik-ask-q">${esc(i18t('ik_quote',{ t:r.need }))}</blockquote>`:`<p class="ins-note">${esc(i18t('ik_asked_nothing'))}</p>`, 'ik-need');
  body+=(typeof insRowsHtml==='function')?insRowsHtml(rows, 'ik-rows'):insKvHtml(rows);
  if(r.status==='declined') body+=insSecHtml(i18t('ik_sec_declined'), '', r.note?`<blockquote class="ins-q">${esc(r.note)}</blockquote>`:`<p class="ins-note">${esc(i18t('ik_no_reason'))}</p>`, 'ik-why');
  body+=ikFilesHtml(r, { cards:true });
  /* Jambo's line belongs to a request still to be drafted: it names the paper
     Start the draft will choose */
  if(!stopped&&r.status!=='drafted'&&acts.some(a=>a&&a.k==='draft')) body+=ikFitHtml(r);
  return {
    item:{ id:r.id },
    head:{ eyebrow:`<span class="ins-ref">${esc(r.id)}</span> · ${esc(i18t('ik_eb_kind'))} · ${esc(from)}${stream?' · '+esc(stream):''}`, title:r.title||'',
      pills:ikHeadPillsHtml(r), moreBesidePills:true, acts, menuHtml:menu, moreAria:i18t('reg_more_actions') },
    acts, body,
    onMenu:act=>{
      if(act==='pick') intakePick(r.id);
      else if(act==='promise') intakePromiseAsk(r.id);
      else if(act==='decline') intakeSetStatus(r.id,'declined');
      else if(act==='withdraw') intakeSetStatus(r.id,'withdrawn');
      else if(act==='track') intakeTrackCopy(r.id);
    },
  };
}
/* ---- WITH NOTHING CHOSEN, JAMBO SAYS THE PAGE (A1's shared panel, jlSay):
   counted from the list, no call; a chip is the page's own door ---- */
function ikJlSay(openRows, asker, go){
  return () => {
    const n=openRows.length;
    const lines=[];
    if(asker){
      lines.push(esc(n?i18tn('jl_ik_say_asker',n,{ n }):i18t('jl_ik_say_none')));
      return { lines:[lines.join(' ')], chips:[{ label:i18t('jl_ik_chip_ask'), run:()=>openIntakeForm() }] };
    }
    if(!n) lines.push(esc(i18t('jl_ik_say_none')));
    else {
      lines.push(esc(i18tn('jl_ik_say_open',n,{ n })));
      const unheld=r=>r._adv?!r.holder:!(r.assignee&&r.assignee.id);
      const nobody=openRows.filter(unheld);
      if(nobody.length){
        const oldest=nobody.slice().sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||'')))[0];
        lines.push(esc(i18tn('jl_ik_say_nobody',nobody.length,{ n:nobody.length, age:ikAgeWords(oldest) })));
      }
      const yours=openRows.filter(r=>!r._adv&&ikHeldByMe(r)).length;
      if(yours) lines.push(esc(i18tn('jl_ik_say_yours',yours,{ n:yours })));
      const over=intakePastDue(openRows.filter(r=>!r._adv));
      if(over) lines.push(`<span class="late">${esc(i18tn('jl_ik_say_over',over,{ n:over }))}</span>`);
    }
    const chips=[];
    if(openRows.some(r=>r._adv?!r.holder:!(r.assignee&&r.assignee.id))) chips.push({ label:i18t('jl_ik_chip_nobody'), run:()=>go('nobody') });
    chips.push({ label:i18t('jl_ik_chip_ask'), run:()=>openIntakeForm() });
    return { lines:[lines.join(' ')], chips };
  };
}
function ikPanelOpts(r, asker){
  const first=String((r.by&&r.by.name)||'').trim().split(/\s+/)[0]||'';
  const mine=ikIsMine(r);
  const st=ikStatusSay(r, asker);
  const stream=(r.folder&&window.FOLDERS&&FOLDERS[r.folder])?FOLDERS[r.folder].name:'';
  const withV=IK_STOPPED.includes(r.status)
    ? esc((r.assignee&&r.assignee.name)||'')
    : (r.assignee&&r.assignee.id)?esc(r.assignee.name||'')+(r.lane?` <span class="ins-quiet">${esc(i18t('ik_with_sent_by',{lane:r.lane}))}</span>`:''):`<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`;
  const stopped=IK_STOPPED.includes(r.status);
  /* the asker's panel, as it was (round 20 drew the team's) */
  const facts=[ { k:'with', label:i18t('ik_f_with'), v:withV },
    { k:'promised', label:i18t('ik_f_promised'), v:r.promisedAt?esc(ikDay(String(r.promisedAt).slice(0,10),{long:true})):'' },
    { k:'cp', label:i18t('ik_f_cp'), v:esc(r.counterparty||'') },
    { k:'stream', label:i18t('ins_f_stream'), v:esc(stream) } ];
  const { acts, menu }=ikActs(r, asker);
  /* THE TEAM'S PANEL, AS DRAWN (round 20, owner picked "The SAP way"; built
     whole on the owner's yes of 18 Oct 2026): the head (reference · kind ·
     who asked · stream, the title, How it is handled and With as two pills,
     the three verbs), what they asked for in their own words, the facts as
     rows, the attachments, and Jambo naming the paper that fits — read from
     the request and our paper, no call. */
  if(!asker) return ikTeamPanelOpts(r, { acts, menu, first, mine, stream, stopped });
  let body=insKvHtml(facts);
  body+=insSecHtml((asker||mine)?i18t('ik_sec_need_you'):i18t('ik_sec_need',{first}), '', `<p class="ins-p" style="white-space:pre-wrap">${esc(r.need||'')}</p>`, 'ik-need');
  body+=ikFilesHtml(r);
  if(r.status==='declined') body+=insSecHtml(i18t('ik_sec_declined'), '', r.note?`<blockquote class="ins-q">${esc(r.note)}</blockquote>`:`<p class="ins-note">${esc(i18t('ik_no_reason'))}</p>`, 'ik-why');
  if(asker && !stopped){
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
  if(asker) body+=ikHistoryHtml(r, asker);
  const eyebrow=`<span class="ins-ref">${esc(r.id)}</span>${stream?' · '+esc(stream):''}`;
  const sub=(asker||mine)?esc(i18t('ik_sub_you',{date:ikDay(r.createdAt)})):esc(i18t('ik_sub_by',{name:(r.by&&r.by.name)||'',date:ikDay(r.createdAt)}));
  return {
    item:{ id:r.id },
    head:{ eyebrow, title:r.title||'', sub, tone:st.tone, status:st.html, acts, menuHtml:menu, moreAria:i18t('reg_more_actions') },
    acts, body,
    onMenu:act=>{
      if(act==='pick') intakePick(r.id);
      else if(act==='promise') intakePromiseAsk(r.id);
      else if(act==='decline') intakeSetStatus(r.id,'declined');
      else if(act==='withdraw') intakeSetStatus(r.id,'withdrawn');
      else if(act==='track') intakeTrackCopy(r.id);
    },
  };
}
/* HOW AN ADVICE REQUEST IS HANDLED (round 20 as drawn: "Standard" in the
   column): a lawyer reads the question, every time — the standard road; its
   status is said in the panel's pill, not here */
function ikAdvRoadHtml(){
  return `<span class="ik-road is-standard" title="${esc(i18t('ik_why_advice'))}">${esc((IK_ROADS.standard||{}).label||'')}</span>`;
}
/* AN ADVICE REQUEST'S PANEL, in the contract request's shape: the drawing's
   head, the advice record's own facts, what they asked, and the two doors the
   advice desk already has — its detail (openAdviceModal, where every act on
   it lives) and its board. Nothing here writes. */
function ikAdvicePanelOpts(r){
  const a=r.raw||{};
  const st=(window.adviceStage?adviceStage(r.status):null)||{ label:r.status };
  const q=a.quote||{};
  const fee=q.rate&&typeof fmtMoneyShort==='function'?`${fmtMoneyShort(q.rate*q.hoursMin)}–${fmtMoneyShort(q.rate*q.hoursMax)}`:'';
  const left=(window.adviceDaysLeft&&r.eta)?adviceDaysLeft(r.eta):null;
  const done=IK_ADV_DONE.includes(r.status);
  const tone=done?'green':left!=null&&left<0?'ruby':left!=null&&left<=1?'amber':'steel';
  /* ROUND 20'S SHAPE, the request's own (lane A3's second pass): the
     eyebrow, the title, one row of pills (where it stands, then who holds
     it), the doors, what they asked for in their own words quoted, then the
     facts as rows — read off the advice record, nothing new */
  const holder=String(a.assignee||'').trim();
  /* the pills as the request's (round 20): how it is handled, then who holds
     it; where the advice desk has it is a fact row of its own */
  const pills=ikAdvRoadHtml()
    +(done?'':holder?`<span class="ik-with-chip">${esc(i18t('ik_pill_with',{ who:holder }))}</span>`:`<span class="ik-with-chip is-nobody">${esc(i18t('ik_g_nobody'))}</span>`);
  const first=ikFirst(r.by.name);
  const asked=esc(ikDay(r.createdAt,{ weekday:true }))+(done?'':` · <span class="${left!=null&&left<0?'ins-late':''}">${esc(i18t('ik_promised_by',{ by:r.eta?ikDay(r.eta,{ weekday:true }):'—' }))}</span>`);
  const rows=[
    { k:'stands', label:i18t('ik_f_stands'), v:`<span class="reg-stg ins-pill is-${esc(tone)}"><i aria-hidden="true"></i>${esc(st.label||r.status)}</span>` },
    { k:'cp', label:i18t('ik_f_customer'), v:esc(r.by.name||'') },
    r.company?{ k:'company', label:i18t('ik_f_company'), v:esc(r.company) }:null,
    a.contractName?{ k:'contract', label:i18t('ik_f_contract'), v:esc(a.contractName) }:null,
    fee?{ k:'fee', label:i18t('ik_f_fee'), v:esc(fee) }:null,
    { k:'road', label:i18t('ik_f_road'), v:esc(i18t('ik_road_line',{ road:(IK_ROADS.standard||{}).label||'', why:i18t('ik_why_advice') })) },
    { k:'with', label:i18t('ik_f_with'), v:holder?esc(holder):`<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>` },
    { k:'asked', label:i18t('ik_f_asked'), v:asked } ];
  let body=insSecHtml(first?i18t('ik_sec_need',{ first }):i18t('ik_sec_they_asked'), '',
    r.need?`<blockquote class="ik-ask-q">${esc(i18t('ik_quote',{ t:r.need }))}</blockquote>`:`<p class="ins-note">${esc(i18t('ik_asked_nothing'))}</p>`, 'ik-need');
  body+=(typeof insRowsHtml==='function')?insRowsHtml(rows, 'ik-rows'):insKvHtml(rows);
  const acts=[
    { k:'open', kind:'accent', label:i18t('ik_act_open_advice'), run:()=>{ if(window.openAdviceModal) openAdviceModal(r.id); } },
    { k:'board', label:i18t('ik_act_advice_board'), run:()=>setView('advice') } ];
  return { item:{ id:'adv:'+r.id },
    head:{ eyebrow:`<span class="ins-ref">${esc(r.id)}</span> · ${esc(i18t('ik_kind_advice'))} · ${esc(i18t('ik_eb_from',{ name:r.by.name||'' }))}${r.company?' · '+esc(r.company):''}`, title:r.title,
      pills, moreBesidePills:true, acts },
    acts, body };
}
/* ════ THE LIST HEAD, THE LEGORA WAY (the owner's pick, 21 Oct 2026, Part 8;
   js/views/listhead.js) ════════════════════════════════════════════════════
   Under the page's own head (its name, "N open", Ask for a contract): the
   box to search the requests or ask Jambo in, the views as tabs, then a chip
   row — Stream and With appear only once ADDED ("+ Filter"), as "Stream
   Sales ×", "With Nobody yet ×" — with Columns at its right end. It REVERSES
   round 20's band, where the find box and the two boxes stood labelled
   beside the tabs. The page keeps every reading and every kept value: the
   view, the two filters and the words are ikFilters' own keys (ikPlace keeps
   them across a refresh); each press ends in this page's writer and its own
   repaint. A question typed in the box goes to Jambo's panel beside the list
   (jlAsk, the panel's own door), never into the list. The asker, who sees
   only their own, has the box, the tabs and Columns. */
const IK_SEAT = 'intake';
/* THE COLUMNS A READER MAY HIDE OR ORDER (Columns, round 19's one builder):
   round 20's, at round 20's widths; Ref and Request always stand first */
function ikColDefs(asker){
  return asker
    ? [{ k:'with', label:i18t('ik_f_with'), w:170 }, { k:'promised', label:i18t('ik_f_promised'), w:130 }]
    : [{ k:'kind', label:i18t('ik_col_kind'), w:104 }, { k:'road', label:i18t('ik_f_road'), w:140 }, { k:'with', label:i18t('ik_f_with'), w:148 },
      { k:'promised', label:i18t('ik_f_promised'), w:136 }, { k:'files', label:i18t('ik_col_files'), w:56 }, { k:'asked', label:i18t('ik_col_asked'), w:66 }];
}
function ikRepaint(){ if(typeof keepScroll==='function') keepScroll(()=>renderIntake()); else renderIntake(); }
const ikPlaceKeep = () => { if(typeof window!=='undefined'&&typeof window.placeSave==='function') try{ placeSave(); }catch(_){} };
/* the head's box keeps the reader's caret across a repaint of the whole page
   (the list landing, the advice book landing, the ten-minute sweep) */
function ikBoxKeep(){
  if(typeof document==='undefined') return ()=>{};
  const sel=`[data-lh-seat="${IK_SEAT}"] input[data-lh-q]`;
  const a=document.activeElement;
  if(!(a&&a.matches&&a.matches(sel))) return ()=>{};
  const s=a.selectionStart, e=a.selectionEnd;
  return ()=>{ const b=document.querySelector(sel); if(!b||b===a) return;
    try{ b.focus({ preventScroll:true }); b.setSelectionRange(s,e); }catch(_){} };
}
function ikLhRegister(asker){
  if(typeof LC_PAGES==='object'&&LC_PAGES)
    LC_PAGES[IK_SEAT]={ cols:()=>ikColDefs(asker).map(c=>({ k:c.k, label:c.label })), repaint:()=>ikRepaint(), hide:['asked'] };
  if(typeof lhRegister!=='function') return null;
  /* a choice's number: the rows it would leave, the view, the other filter
     and the words held */
  const count=patch=>{ const g=Object.assign({}, ikFilters(), patch); return ikBase(g, asker).filter(r=>ikPassView(r,g.view,asker)).length; };
  return lhRegister(IK_SEAT, {
    noun:'requests',
    total:()=>(asker?intakeMine():((_intake&&_intake.list)||[]).concat(ikAdviceRows())).length,
    q:()=>ikFilters().q||'',
    setQuery:w=>{ ikFilters().q=String(w==null?'':w); ikPaintRows(); },
    boxId:'ik-q', boxAttrs:{ 'data-ik-q':true },
    tabAttr:'data-ik-view', tabsLabel:i18t('rq_kinds_label'),
    tabs:()=>ikTabViews(asker),
    tabNow:()=>ikFilters().view,
    /* the asker's Advice tab is the advice desk's own page */
    tab:k=>{ if(asker&&k==='advice'){ if(typeof setView==='function') setView('advice'); return; }
      ikFilters().view=String(k); ikRepaint(); ikPlaceKeep(); },
    filters:()=>{
      if(asker) return [];
      const f=ikFilters();
      const folders=(typeof visibleFolders==='function')?visibleFolders():Object.values(window.FOLDERS||{});
      return [
        { k:'folder', label:i18t('reg_chip_stream'), cur:f.folder, def:IK_DEF.folder,
          opts:folders.map(x=>[x.id, x.name, count({ folder:x.id })]) },
        { k:'who', label:i18t('ik_f_with'), cur:f.who, def:IK_DEF.who,
          opts:[['me',i18t('ik_with_you')],['nobody',i18t('ik_c_who_nobody')],['other',i18t('ik_c_who_colleague')]].map(o=>[o[0], o[1], count({ who:o[0] })]) },
      ];
    },
    apply:patch=>{ const f=ikFilters();
      Object.keys(patch||{}).forEach(k=>{ if(IK_CHIPS.includes(k)) f[k]=String(patch[k]); });
      ikRepaint(); ikPlaceKeep(); },
  });
}
/* THE LIST BEHIND THE TABS — ONE READING for every tab's number and the list
   under it (the number on a door matches the list behind it): the boxes,
   then the find box's words. The view is applied by the caller. */
function ikHit(r, q){
  const w=String(q||'').trim().toLowerCase();
  return !w||[r.id,r.title,r.need,r.counterparty,r.company,r.by&&r.by.name].some(x=>String(x||'').toLowerCase().includes(w));
}
function ikBase(f, asker){
  const all=asker?intakeMine():((_intake&&_intake.list)||[]);
  const base=asker?all:all.concat(ikAdviceRows()).filter(r=>ikPassChips(r,f));
  return base.filter(r=>ikHit(r,f.q));
}
/* ---- REQUESTS, AS DRAWN (the new look, round 6) ----
   "Requests · 3 open · 1 needs an editor"; the box and the tabs Open · Mine · Drafted · Advice; one table — the
   request and the asker's own words, where it stands (the paper that fits, read without AI; what it became),
   who asked and when, its lane, and its one press (Start the draft — the one form —, or Open); the foot "Advice is
   a request too". The panel reads the chosen request: what the ask says, the paper that fits, the doors. */
let _ikn = 'open';
function ikFirstLast(name){ const p = String(name || '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : (p[0] || ''); }
function iknRows(){
  const all = ((_intake && _intake.list) || []).concat(ikAdviceRows());
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const q = String(ikFilters().q || '').trim().toLowerCase();
  const on = r => _ikn === 'open' ? (!r._adv && IK_LIVE.includes(r.status) && !r.contractId) : _ikn === 'mine' ? (!r._adv && me && ((r.assignee && r.assignee.id === me.id) || (r.by && r.by.id === me.id)))
    : _ikn === 'drafted' ? (!r._adv && !!r.contractId) : _ikn === 'advice' ? !!r._adv : true;
  return { all, list: all.filter(r => ikHit(r, q) && on(r)), n: k => { const keep = _ikn; _ikn = k; const x = all.filter(r => on(r)).length; _ikn = keep; return x; } };
}
function iknStands(r){
  if (r._adv) return { t: i18t('ikn_advice', { s: String(r.status || '') }) };
  if (r.contractId){ const c = typeof getContract === 'function' ? getContract(r.contractId) : null;
    let m = null; try { m = c && typeof contractStatusMeta === 'function' ? contractStatusMeta(c) : null; } catch (_){ m = null; }
    return { t: c ? i18t('ikn_became', { name: c.name || '', ref: typeof contractRef === 'function' ? contractRef(c) : c.id, stage: String((m && m.label) || c.status || '').toLowerCase() }) : i18t('ikn_drafted') }; }
  const fit = ikFitOf(r);
  return { t: fit && fit.strong ? i18t('ikn_fits', { name: fit.name }) : i18t('ikn_open'), sub: r.assignee ? '' : i18t('ikn_needs_editor'), fit };
}
function iknRowHtml(r, may){
  const st = iknStands(r);
  const lane = [r.folder && window.FOLDERS && FOLDERS[r.folder] ? ((typeof STREAM_SHORT === 'object' && STREAM_SHORT && STREAM_SHORT[r.folder]) || FOLDERS[r.folder].name) : '', r.assignee ? String(r.assignee.name || '').split(/\s+/)[0] : (r.holder || '')].filter(Boolean).join(' \u00b7 ');
  const act = r._adv ? '' : r.contractId ? `<button type="button" class="rfp-a" data-ikn-open="${esc(r.contractId)}">${esc(i18t('ikn_open_go'))}</button>`
    : may ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm ikn-go" data-ikn-draft="${esc(r.id)}">${esc(i18t('ikn_start'))}</button>` : '';
  const sel = String(r.id) === String(_iknSel);
  return `<tr data-ikn-row="${esc(r.id)}" class="${sel ? 'is-sel' : ''}${r.contractId ? ' is-done' : ''}" tabindex="-1"><td><div class="cun-name">${esc(r.title || '')}</div>${r._adv ? `<div class="cun-sub">${esc(i18t('ikn_advice_w'))}</div>` : ''}${r.need ? `<div class="ikn-q">\u201c${esc(String(r.need).slice(0, 120))}${String(r.need).length > 120 ? '\u2026' : ''}\u201d</div>` : ''}</td>
    <td class="cun-wait">${esc(st.t)}${st.sub ? `<div class="cun-sub">${esc(st.sub)}</div>` : ''}</td>
    <td class="cun-wait">${esc([ikFirstLast(r.by && r.by.name), typeof ikAgeWords === 'function' ? ikAgeWords(r) : ''].filter(Boolean).join(' \u00b7 '))}</td><td class="cun-wait">${esc(lane || '\u2014')}</td><td class="cun-go">${act}</td></tr>`;
}
let _iknSel = null;
function iknRender(host){
  const may = (typeof canEdit === 'function' && canEdit());
  const R = iknRows();
  const open = R.n('open'), noEd = (R.all.filter(r => !r._adv && IK_LIVE.includes(r.status) && !r.contractId && !r.assignee)).length;
  if (!_iknSel || !R.list.some(r => String(r.id) === String(_iknSel))) _iknSel = R.list[0] ? R.list[0].id : null;
  const tabs = [['open', i18t('ik_v_open'), open], ['mine', i18t('ik_v_mine'), R.n('mine')], ['drafted', i18t('ikn_tab_drafted'), R.n('drafted')], ['advice', i18t('rq_kind_advice'), R.n('advice')]];
  const facts = [i18tn('ik_hf_open', open, { n: open }), noEd ? i18tn('ikn_noed', noEd, { n: noEd }) : ''].filter(Boolean).join(' \u00b7 ');
  host.innerHTML = `<div class="view-enter sap-page ap-page is-ins apn-page cun-page ikn-page" data-ins-page="intake" data-ins="1">
    <div class="ap-body is-ins"><section class="ap-card apn-card">
      <div class="cun-head"><h2 class="ctf-h">${esc(i18t('nav_intake'))}</h2><span class="ctf-hf">${esc(facts)}</span><span class="ctf-sp"></span>
        <button type="button" id="ik-new" class="ui-btn ui-btn-primary ctf-new">${typeof icon === 'function' ? icon('plus', 'w-3.5 h-3.5') : ''}${esc(i18t('ik_ask_btn'))}</button></div>
      <div class="apn-bar"><label class="apn-box">${typeof icon === 'function' ? icon('search', 'w-3.5 h-3.5') : ''}<input id="ikn-q" type="search" autocomplete="off" placeholder="${esc(i18t('lh_filter_ph'))}" value="${esc(ikFilters().q || '')}"></label><span class="apn-sp"></span>
        ${tabs.filter(t => t[2] || t[0] === 'open' || t[0] === _ikn).map(t => `<button type="button" class="apn-tab${_ikn === t[0] ? ' is-on' : ''}" data-ikn-tab="${t[0]}">${esc(t[1])} <span>${t[2]}</span></button>`).join('')}</div>
      <div class="cu-scroll"><table class="apn-table cun-table ikn-table"><colgroup><col style="width:32%"><col style="width:26%"><col style="width:15%"><col style="width:14%"><col></colgroup>
        <thead><tr><th>${esc(i18t('ikn_c_req'))}</th><th>${esc(i18t('ikn_c_stands'))}</th><th>${esc(i18t('ikn_c_by'))}</th><th>${esc(i18t('ikn_c_lane'))}</th><th></th></tr></thead>
        <tbody>${R.list.map(r => iknRowHtml(r, may)).join('') || `<tr><td colspan="5" class="apn-none">${esc(i18t('ik_queue_empty'))}</td></tr>`}</tbody></table></div>
      <div class="apn-foot rdn-foot"><span>${esc(i18tn('ikn_foot', R.list.length, { n: R.list.length }))}</span><span>${esc(i18t('ikn_foot_adv'))}</span></div>
    </section><aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ins_panel_label'))}"></aside></div></div>`;
  const r = R.list.find(x => String(x.id) === String(_iknSel)) || null;
  if (typeof insPaintPanel === 'function'){
    if (r) insPaintPanel({ seat: IK_SEAT, jlWord: i18t('jl_w_request'), item: { id: String(r.id) }, head: false, body: iknPanelHtml(r, may) });
    else insPaintPanel({ seat: IK_SEAT, empty: i18t('ik_panel_none') });
  }
  if (typeof setActiveNav === 'function') setActiveNav('intake');
  if (typeof insWatchWidth === 'function') insWatchWidth();
}
function iknPanelHtml(r, may){
  const E = esc, st = iknStands(r);
  const fit = st.fit && st.fit.strong ? st.fit : null;
  const head = r.contractId ? st.t + '.' : fit ? i18t('ikn_p_fits', { title: r.title || '', name: fit.name }) : i18t('ikn_p_open', { title: r.title || '' });
  const row = (l, v, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(v)}</b><i>${E(src || '')}</i></div>`;
  const rows = (r.counterparty ? row(i18t('cun_c_party'), r.counterparty, i18t('ikn_src_ask')) : '')
    + (r.folder && window.FOLDERS && FOLDERS[r.folder] ? row(i18t('reg_chip_stream'), FOLDERS[r.folder].name, i18t('ikn_src_ask')) : '')
    + (fit ? row(i18t('ikn_paper'), fit.name, i18t('ikn_src_fits')) : '')
    + ((r.files || []).length ? row(i18t('ikn_files'), i18tn('ikn_files_n', r.files.length, { n: r.files.length }), '') : '');
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  const doors = r._adv ? '' : r.contractId ? door(`data-ikn-open="${E(r.contractId)}"`, i18t('ikn_open_go'), i18t('pd2_ch_free'))
    : may ? door(`data-ikn-draft="${E(r.id)}"`, i18t('ikn_start'), i18t('ikn_start_cost')) : '';
  return `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${E(head)}</p>${r.need ? `<div class="pd2-ch-cap">${E(i18t('ikn_p_words'))}</div><div class="mnn-note"><p>${E(r.need)}</p></div>` : ''}
    ${rows ? `<div class="pd2-ch-cap">${E(i18t('ikn_p_read'))}</div><div class="pd2-ch-tbl">${rows}</div>` : ''}${doors ? `<div class="pd2-ch-cap">${E(i18t('pd2_ch_doors'))}</div>${doors}` : ''}</div>`;
}
if (typeof document !== 'undefined' && !document._iknWired){ document._iknWired = true;
  document.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'intake') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return; let el;
    if ((el = t.closest('[data-ikn-tab]'))){ e.preventDefault(); _ikn = el.getAttribute('data-ikn-tab'); renderIntake(); return; }
    if ((el = t.closest('[data-ikn-draft]'))){ e.preventDefault(); e.stopPropagation(); intakeDraft(el.getAttribute('data-ikn-draft')); return; }
    if ((el = t.closest('[data-ikn-open]'))){ e.preventDefault(); e.stopPropagation(); const id = el.getAttribute('data-ikn-open'); if (!(typeof pdOpenOnHome === 'function' && pdOpenOnHome(id, 'open')) && typeof openWorkspace === 'function') openWorkspace(id); return; }
    if ((el = t.closest('#ik-new')) && t.closest('.ikn-page')){ e.preventDefault(); openIntakeForm(); return; }
    if ((el = t.closest('[data-ikn-row]'))){ const id = el.getAttribute('data-ikn-row'); if (String(id) === String(_iknSel)) return; _iknSel = id; renderIntake(); }
  });
  document.addEventListener('input', e => { if (!e.target || e.target.id !== 'ikn-q' || typeof state === 'undefined' || state.view !== 'intake') return;
    ikFilters().q = e.target.value; renderIntake(); const q = document.getElementById('ikn-q'); if (q){ q.focus(); const k = q.value.length; try { q.setSelectionRange(k, k); } catch (_){} } });
}
function renderIntakeInspector(host){
  const may=(typeof canEdit==='function'&&canEdit());
  if (may && typeof window.newLookOn === 'function' && newLookOn()){ iknRender(host); return; }
  const asker=!may;
  const f=ikFilters();
  const V=asker?IK_V_ASKER:IK_V_TEAM;
  if(!V.some(v=>v[0]===f.view)) f.view='open';
  /* the road no longer narrows (no box for it): a value left from before rests */
  f.road=IK_DEF.road;
  const all=asker?intakeMine():((_intake&&_intake.list)||[]);
  /* the whole book's open requests, the boxes at rest: the head's "N open" */
  const openAll=(asker?all:all.concat(ikAdviceRows())).filter(r=>ikPassView(r,'open',asker));
  /* THE HEAD (round 20 as drawn): "Requests 4 open · what colleagues ask Legal
     for · advice too", and the one filled act */
  _ikHead.facts=asker?'':`<span class="ik-hf-n">${esc(i18tn('ik_hf_open',openAll.length,{ n:openAll.length }))}</span><span class="ik-hf-s">${esc(i18t('ik_hf_sub'))}</span>`;
  _ikHead.acts=`<button type="button" id="ik-new" class="ui-btn ui-btn-primary">${typeof icon==='function'?icon('plus','w-3.5 h-3.5'):''}${esc(i18t('ik_ask_btn'))}</button>`;
  /* THE LIST HEAD under the page's own (the box, the tabs, the chips and
     Columns), the head card's lower half; the list and its foot are painted
     by ikPaintRows, which is all the box's words repaint */
  ikLhRegister(asker);
  const keep=ikBoxKeep();
  host.innerHTML=`<div class="view-enter sap-page ins-page ik-ins" data-ins-page="intake" data-ins="1">
    ${typeof lhHtml==='function'?lhHtml(IK_SEAT,{ frame:'foot' }):''}
    <div class="ins-body"${asker?'':` data-ik-adv="${ikAdviceRows().length}"`}>
      <section class="ins-card" aria-label="${esc(i18t('nav_intake'))}">
        <div class="ins-scroll" id="ik-scroll"></div>
        <div class="ins-foot" data-ik-foot></div>
      </section>
      <aside id="ins-panel" class="ins-panel" aria-label="${esc(i18t('ik_panel_label'))}"></aside>
    </div>
  </div>`;
  ikPaintHead();
  _ikPanelK=undefined;
  ikPaintRows();
  keep();
  if(typeof insWatchWidth==='function') insWatchWidth();
}
/* THE LIST, ITS FOOT AND THE PANEL — what the box's words repaint, letter by
   letter, the head and its box left standing (the caret stays). The panel is
   painted again only when the row it shows changes. */
let _ikPanelK;
function ikPaintRows(){
  if(typeof document==='undefined') return;
  const host=document.querySelector('.ik-ins[data-ins="1"]'); if(!host) return;
  const scroll=host.querySelector('#ik-scroll'); if(!scroll) return;
  const may=(typeof canEdit==='function'&&canEdit());
  const asker=!may;
  const f=ikFilters();
  const all=asker?intakeMine():((_intake&&_intake.list)||[]);
  const narrowing=asker?[]:IK_CHIPS.filter(k=>String(f[k])!==String(IK_DEF[k]));
  const base=ikBase(f, asker);
  /* Jambo's words with nothing chosen read the whole book's open requests */
  const openAll=(asker?all:all.concat(ikAdviceRows())).filter(r=>ikPassView(r,'open',asker));
  /* THE DRAWING'S SEARCH BOX: the words a reader would use for a request —
     its title, what was asked, who asked, the counterparty, its reference. */
  const q=String(f.q||'').trim().toLowerCase();
  /* OLDEST WAITING FIRST on the team's Open list (round 20 as drawn: the
     longest wait leads; the Open tab's hover says so); every other list, and
     the asker's, newest first. A late request still says so in red in its
     own Promised by cell. */
  const oldest=!asker&&f.view==='open';
  const rows=base.filter(r=>ikPassView(r,f.view,asker))
    .sort((a,b)=>oldest?String(a.createdAt||'').localeCompare(String(b.createdAt||'')):String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  /* THE DRAWING'S COLUMNS, in the reader's own choice and order (Columns).
     The asker keeps With in the list, because "who has my request" is the
     asker's whole question; the team's eight are round 20's. Ref is wide
     enough for HaTi's own references (REQ-37E60C) to read whole. */
  const defs=ikColDefs(asker), byK=Object.fromEntries(defs.map(c=>[c.k,c]));
  const keys=(typeof lcShown==='function')?lcShown(IK_SEAT, defs.map(c=>c.k)):defs.map(c=>c.k);
  /* THE LIST LANGUAGE (owner, 27 Oct 2026: the other lists "the same way"): the reference rides the grey
     line under the request, so the Request leads; a mark says what is asked for — a pen for a contract, a
     question for advice — and the Kind is a soft chip in the same tone */
  /* ROOM TO SPREAD (owner, 28 Oct 2026): where the list has the room, the grey line under the request is
     columns of its own — Ref, who asked (or the party, for the asker), the stream, the day asked — and the
     request stands alone (listSpread) */
  const SPREAD=(asker
    ? [{ k:'ref', label:i18t('reg_col_ref'), w:112 }, { k:'party', label:i18t('cu_col_customer'), w:170 }]
    : [{ k:'ref', label:i18t('reg_col_ref'), w:112 }, { k:'by', label:i18t('ap_col_asked_by'), w:160 }, { k:'stream', label:i18t('reg_col_stream'), w:140 }])
    .concat(keys.includes('asked')?[]:[{ k:'asked', label:i18t('ik_col_asked'), w:84 }]).map(c=>Object.assign(c,{ spread:1 }));
  /* THE LIST'S COLUMNS (owner, 28 Oct 2026, listCols): the Request and Promised by always stand; where the room
     is short Files steps aside first, then Kind, How it is handled, With; Asked, when the reader chose it under
     Columns, steps aside last — the reader's own choice wins */
  const IK_RANK={ files:1, kind:2, road:3, with:4, asked:5 };
  const FIT=typeof listCols==='function'
    ? listCols(IK_SEAT,[{ k:'name' },...SPREAD,...keys.map(k=>Object.assign({},byK[k],{ rank:IK_RANK[k] }))],()=>ikRepaint())
    : { cols:[{ k:'name' },...keys.map(k=>byK[k])], spread:false };
  const SP=FIT.spread;
  SPREAD.forEach(c=>{ byK[c.k]=c; });
  keys.splice(0,keys.length,...FIT.cols.slice(1).map(c=>c.k));
  const cols=[Object.assign({ t:i18t('ik_col_request') },FIT.cols[0]), ...FIT.cols.slice(1).map(c=>Object.assign({ t:byK[c.k].label },c))];
  const quiet='<span class="ins-quiet">\u2014</span>';
  const spreadCells=(r,adv)=>({
    ref:()=>`<td class="ik-ref"><span class="ins-ref">${esc(r.id)}</span></td>`,
    by:()=>{ const who=adv?[r.by.name, r.company].filter(Boolean).join(' \u00b7 '):(ikIsMine(r)?i18t('ik_with_you'):((r.by&&r.by.name)||''));
      return `<td class="ik-by"${who?` title="${esc(who)}"`:''}>${who?esc(who):quiet}</td>`; },
    stream:()=>{ const f=(!adv&&r.folder&&window.FOLDERS&&FOLDERS[r.folder])?FOLDERS[r.folder].name:''; return `<td>${f?esc(f):quiet}</td>`; },
    party:()=>`<td${r.counterparty?` title="${esc(r.counterparty)}"`:''}>${r.counterparty?esc(r.counterparty):quiet}</td>`,
  });
  const kindPill=k=>(typeof listChipHtml==='function')?`<span class="ik-kind">${listChipHtml(k==='advice'?'violet':'steel', i18t(k==='advice'?'ik_kind_advice':'ik_kind_contract'))}</span>`
    :`<span class="ap-kind ik-kind">${esc(i18t(k==='advice'?'ik_kind_advice':'ik_kind_contract'))}</span>`;
  const kindMark=k=>(typeof listMarkHtml==='function')?listMarkHtml(k==='advice'?'violet':'steel', k==='advice'?'ask':'draft', i18t(k==='advice'?'ik_kind_advice':'ik_kind_contract')):'';
  const advCells=r=>{
    const left=(window.adviceDaysLeft&&r.eta)?adviceDaysLeft(r.eta):null;
    const late=!IK_ADV_DONE.includes(r.status)&&left!=null&&left<=0;
    return {
      kind:()=>`<td>${kindPill('advice')}</td>`,
      road:()=>`<td>${ikAdvRoadHtml()}</td>`,
      with:()=>`<td class="ik-with">${r.holder?esc(r.holder):IK_ADV_DONE.includes(r.status)?`<span class="ins-quiet">—</span>`:(typeof listWordHtml==='function'?listWordHtml('amber', i18t('ik_with_nobody')):`<span class="ins-nobody">${esc(i18t('ik_with_nobody'))}</span>`)}</td>`,
      files:()=>`<td><span class="ins-quiet">—</span></td>`,
      asked:()=>`<td class="ik-ask">${esc(ikDay(r.createdAt))}</td>`,
      promised:()=>`<td class="ik-pr">${r.eta?(left===0&&late?`<span class="ins-late">${esc(i18t('ik_pr_today_word'))}</span>`:`<span class="${late?'ins-late':''}">${esc(ikDay(r.eta,{ weekday:true }))}</span>`):IK_ADV_DONE.includes(r.status)?`<span class="ins-quiet">—</span>`:`<span class="ik-pr-none">${esc(i18t('ik_pr_none'))}</span>`}</td>`,
    };
  };
  const advTr=r=>{
    const c=Object.assign(advCells(r), SP?spreadCells(r,true):{});
    return `<tr data-ins-row data-ik-row="${esc('adv:'+r.id)}" tabindex="-1">
      <td><span class="ik-req">${kindMark('advice')}<span class="ins-c2"><b title="${esc(r.title)}">${esc(r.title)}</b>${SP?'':`<span title="${esc([r.id, r.by.name, r.company].filter(Boolean).join(' · '))}"><span class="ins-ref">${esc(r.id)}</span> · ${esc([r.by.name, r.company].filter(Boolean).join(' · '))}</span>`}</span></span></td>
      ${keys.map(k=>c[k]()).join('')}
    </tr>`;
  };
  const reqCells=r=>{
    /* ONE LINE, the drawing's: the day, in red once it is today or past;
       a finished request says the day it finished. */
    const prHtml=()=>{
      const pr=intakePromiseSay(r);
      const d=(pr&&r.promisedAt&&!IK_STOPPED.includes(r.status)&&typeof daysUntil==='function')?daysUntil(String(r.promisedAt).slice(0,10)):null;
      /* THE LIST LANGUAGE (as drawn): no promise says so; a day carries how far off it is on the grey line */
      if(!pr) return IK_STOPPED.includes(r.status)?`<span class="ins-quiet">—</span>`:`<span class="ik-pr-none">${esc(i18t('ik_pr_none'))}</span>`;
      const tone=d!=null&&d<0?'ins-late':pr.cls==='ins-soon'?'ins-soon':'';
      if(d===0) return `<span class="ins-late">${esc(i18t('ik_pr_today_word'))}</span>`;
      return `<span class="ik-pr-day${tone?' '+tone:''}">${esc(pr.day)}</span>${pr.sub&&d!=null?`<span class="ik-pr-sub${tone?' '+tone:d<=7?' ins-ok':''}">${esc(pr.sub)}</span>`:''}`;
    };
    return {
      kind:()=>`<td>${kindPill('contract')}</td>`,
      road:()=>`<td>${ikRoadHtml(r)}</td>`,
      /* the asker's own cell, and the team's (the holder, then the lane that sent it) */
      with:()=>asker?`<td>${ikWithCellHtml(r, asker)}</td>`:`<td class="ik-with">${ikWithListHtml(r)}</td>`,
      files:()=>`<td>${ikFilesCellHtml(r)}</td>`,
      asked:()=>`<td class="ik-ask">${esc(ikDay(r.createdAt))}</td>`,
      promised:()=>`<td class="ik-pr">${prHtml()}</td>`,
    };
  };
  const tr=r=>{
    if(r._adv) return advTr(r);
    const stream=(r.folder&&window.FOLDERS&&FOLDERS[r.folder])?FOLDERS[r.folder].name:'';
    const sub=asker
      ? [r.counterparty||'', i18t('ik_row_asked',{date:ikDay(r.createdAt)})].filter(Boolean).join(' · ')
      : [ikIsMine(r)?i18t('ik_with_you'):((r.by&&r.by.name)||''), stream].filter(Boolean).join(' · ');
    const c=Object.assign(reqCells(r), SP?spreadCells(r,false):{});
    return `<tr data-ins-row data-ik-row="${esc(r.id)}" tabindex="-1">
      <td><span class="ik-req">${kindMark('contract')}<span class="ins-c2"><b title="${esc(r.title||'')}">${esc(r.title||'')}</b>${SP?'':`<span title="${esc([r.id, sub, asker?'':i18t('ik_row_asked',{date:ikDay(r.createdAt)})].filter(Boolean).join(' · '))}"><span class="ins-ref">${esc(r.id)}</span> · ${esc(sub)}${asker?'':` · ${esc(i18t('ik_row_asked',{date:ikDay(r.createdAt)}))}`}</span>`}</span></span></td>
      ${keys.map(k=>c[k]()).join('')}
    </tr>`;
  };
  /* ONE LIST, without a heading row per pile — the drawing's flat list; a
     late one says so in red in its own Promised by cell. */
  let body=rows.map(tr).join('');
  if(!rows.length){
    const msg=asker?i18t('ik_mine_empty'):(narrowing.length||q)?i18t('ik_none_match'):(f.view==='open'?i18t('ik_queue_empty'):i18t('ob_none_here'));
    body=`<tr class="ins-empty"><td colspan="${cols.length}">${esc(msg)}${narrowing.length?`<br><button type="button" class="ui-link" data-ik-clear style="margin-top:8px">${esc(i18t('ob_clear_filters'))}</button>`:''}</td></tr>`;
  }
  scroll.innerHTML=`<table class="ins-lt ik-lt${asker?'':' is-team'}" data-list-seat="${esc(IK_SEAT)}"><colgroup>${cols.map(c=>typeof listColTag==='function'?listColTag(c):`<col${c.w?` style="width:${c.w}px"`:''}>`).join('')}</colgroup><thead><tr>${
    cols.map(c=>`<th${c.k&&c.k!=='name'?` data-ik-col="${esc(c.k)}"`:''}>${esc(c.t)}${typeof listGripHtml==='function'?listGripHtml(IK_SEAT,c.k):''}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
  /* THE FOOT (the list head's one foot): "1–4 of 4", every row drawn — the
     rows behind the tab, the chips and the words. The asker's own sentence
     stays after it. */
  const foot=host.querySelector('[data-ik-foot]');
  if(foot){ const html=(typeof lhFootHtml==='function')
    ? lhFootHtml(IK_SEAT, rows.length, rows.length, 0, asker?{ extra:` · <span class="ik-foot-note">${esc(i18t('ik_foot_asker'))}</span>` }:undefined)
    : '';
    /* in place, so the live region is heard when the count moves (lhFootPut) */
    const cur=foot.querySelector('[data-lh-foot]');
    if(!(cur&&typeof lhFootPut==='function'&&lhFootPut(cur, html))) foot.innerHTML=html; }
  /* the empty list's way forward: every filter and the words at rest */
  scroll.querySelectorAll('[data-ik-clear]').forEach(b=>b.addEventListener('click',()=>{
    IK_CHIPS.forEach(k=>{ f[k]=IK_DEF[k]; }); f.q='';
    if(typeof lhBoxSet==='function') lhBoxSet(IK_SEAT, '');
    ikRepaint(); ikPlaceKeep(); }));
  const seat=asker?'intake:asker':'intake:team';
  const tb=scroll.querySelector('.ik-lt tbody');
  const idOf=t=>t.getAttribute('data-ik-row');
  const keyOf=r=>r._adv?'adv:'+r.id:r.id;
  const byId=new Map(rows.map(r=>[keyOf(r),r]));
  if(_ikBack&&_intake.loaded){ const want=_ikBack[seat];
    if(want&&byId.has(want)&&typeof insSelect==='function') insSelect(seat, want);
    _ikBack[seat]=null; }
  const id=insPick(seat, rows.map(keyOf));
  if(tb) insMarkRow(tb,'[data-ins-row]',idOf,id);
  /* Jambo's own words with nothing chosen; a chip narrows to what nobody
     holds (Open, With: Nobody yet — the head draws it as its chip) and lands
     on its first row */
  const go=k=>{ if(k==='nobody'){ f.view='open'; f.who='nobody'; ikRepaint(); ikPlaceKeep(); if(typeof jlLand==='function') jlLand('first'); } };
  const paint=k=>{
    _ikPanelK=k||null;
    const r=byId.get(k);
    /* Jambo's panel says what it holds: "Request" (round 20; advice is a request) */
    if(!r){ insPaintPanel({ seat, empty:asker?i18t('ik_panel_none_asker'):i18t('ik_panel_none'), jlSay:ikJlSay(openAll, asker, go) }); return; }
    insPaintPanel(Object.assign({ seat, jlWord:i18t('jl_w_request'), jlSay:ikJlSay(openAll, asker, go) }, r._adv?ikAdvicePanelOpts(r):ikPanelOpts(r, asker)));
    const pan=document.getElementById('ins-panel'); if(!pan) return;
    pan.querySelectorAll('[data-ik-file]').forEach(b=>b.addEventListener('click',()=>intakeFileGet(r.id, b.getAttribute('data-ik-file'), b.getAttribute('data-ik-fname'), { open:true })));
    /* THE COUNTERPARTY'S NAME opens its contracts on the Contracts place
       (Parties' own Open party) and LANDS on the first of them */
    pan.querySelectorAll('[data-ik-cp]').forEach(b=>b.addEventListener('click',()=>{
      if(typeof window.cuOpenCustomer==='function'){ cuOpenCustomer(b.getAttribute('data-ik-cp')); if(typeof jlLand==='function') jlLand('list'); } }));
  };
  if(_ikPanelK===undefined||(id||null)!==_ikPanelK) paint(id);
  /* A SECOND PRESS OPENS THE CONTRACT THE REQUEST BECAME, where it became
     one; on anything else the verbs in the panel are the way on. */
  if(tb) insListWire(tb,{ rowSel:'[data-ins-row]', idOf,
    onSelect:k=>{ insSelect(seat,k); insMarkRow(tb,'[data-ins-row]',idOf,k); paint(k); },
    onOpen:k=>{ const r=byId.get(k); if(r&&r._adv){ if(window.openAdviceModal) openAdviceModal(r.id); } else if(r&&r.contractId) openWorkspace(r.contractId); } });
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
    message:i18t('ik_promise_msg'), value:String(r.promisedAt||'').slice(0,10), date:true, min:(typeof todayISO==='function')?todayISO():'',
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

Object.assign(window,{ikPlace,ikPlacePut,ikWithListHtml,ikFilesCellHtml,INTAKE_STATUS,IK_LIVE,IK_ROADS,IK_TONE,IK_MEDIAN_MIN,IK_STOPPED,
  ikKnownCounterparty,intakeRoad,intakeStoppedAt,intakeMinutes,
  intakeMedianDays,intakePromise,intakePastDue,intakeTrackUrl,intakeLanes,intakeLaneFor,
  intakeRefresh,intakeSweepStart,IK_SWEEP_MS,intakeFormFields,ikFieldHtml,ikFieldId,intakeTitleFrom,intakeHoldDraft,intakeHeldDraft,intakeClaimDraft,intakeContractSent,intakeGoTo,intakeAlertRows,intakeLaneDraftRows,intakeLaneArrivals,ikShelfOf,IK_HOLD_AFTER_CREATE_MS,ikClockHtml,ikFactHtml,intakePick,intakePromiseAsk,intakeTrackCopy,intakePatch,
  intakeMine,intakeQueue,intakeCount,loadIntake,
  intakeStatusKey,intakePickLabel,intakeTakeOver,intakeStage,intakeFinishedThisMonth,intakePromiseSay,
  ikPaintHead,ikAfterRender,renderIntakeInspector,ikPanelOpts,ikAdvicePanelOpts,ikAdviceRows,ikFilesHtml,intakeFileGet,IK_FILES_MAX,IK_FILE_MAX_MB,ikActs,ikStatusSay,ikFilters,
  IK_V_TEAM,IK_V_ASKER,IK_DEF,IK_CHIPS,IK_GROUPS,ikPassView,ikPassChips,ikSort,ikAgeWords,ikTookWords,ikDay,
  openIntakeForm,intakeAnswerLine,openIntakeTracker,intakeDraft,intakeSetStatus,renderIntake,ikRowHtml,
  ikFitOf,ikFitHtml,ikTeamPanelOpts,ikCpHtml,ikCpNdaWords,ikWithRowHtml,ikAskedHtml,ikHeadPillsHtml,ikJlSay,ikRoadShown,ikRoadHtml,ikLaneChipHtml,ikWithCellHtml,
  IK_SEAT,IK_CARD_WORDS,ikTabViews,ikHeadMoved,ikColDefs,ikLhRegister,ikPaintRows,ikRepaint,
  RQ_KINDS,RQ_KIND_VIEW,rqKindCounts,requestsDoorCount,rqKindTabsHtml,rqPaintKindCounts,rqKindTabsWire,
  _intakeState:_intake});
