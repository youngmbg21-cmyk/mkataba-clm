/* ============================================================
   THE REDLINE CO-PILOT (W3-1, WORKORDER-gap-map.md)
   ============================================================
   When the other side sends a round back, somebody has to answer every
   change in it — and the answer to most of them is already written down.
   The playbook says what this company accepts; the precedent memory says
   what it has actually accepted before. This reads both and proposes a
   first-pass answer per change: take it, push back, or escalate.

   THREE RULES THAT SHAPE THE WHOLE THING:

   1. IT DECIDES NOTHING. Every row's buttons carry the SAME data
      attributes the change cards carry — data-nego-accept,
      data-rl-ask-review, data-rl-cp-open — so the existing wiring picks
      them up and the press runs through the ordinary funnel: the desk
      rule, the review gate, the accept guard, and the live-link catch-up
      that tells the counterparty. There is no second decision path here,
      which is the only reason this feature is safe to add at all.

   2. IT IS DETERMINISTIC. A recommendation a person is asked to trust has
      to be explainable, and every verdict below names the position or the
      figure it rests on. Where the playbook is silent it says so and
      recommends nothing — 'review' is an honest answer and a guess is not.
      The model's role stays what it already was: drafting the push-back
      WORDING, through rlAiPropose, when a human asks for it.

   3. IT ANSWERS ONLY THEIR ASKS. Our own pending drafts are ours to send
      or revise; proposing that we accept our own wording is nonsense, and
      proposing that we push back on ourselves is worse. */

const RLP_VERDICTS = {
  accept:   { key:'accept',   tone:'green', get label(){ return i18t('rp_v_accept'); } },
  push:     { key:'push',     tone:'amber', get label(){ return i18t('rp_v_push'); } },
  escalate: { key:'escalate', tone:'ruby',  get label(){ return i18t('rp_v_escalate'); } },
  review:   { key:'review',   tone:'steel', get label(){ return i18t('rp_v_review'); } },
};
/* The playbook range that governs a topic, by the key the playbook uses.
   Null where this workspace's playbook says nothing about it — which is a
   real state and the reason 'review' exists. */
function rlpRangeFor(c, topicKey){
  try{
    if(typeof resolvePlaybook!=='function'||typeof playbookKeyFor!=='function') return null;
    const pb=resolvePlaybook(playbookKeyFor(c));
    const want=topicKey==='payment'?'paymentDays':topicKey==='liability'?'liabilityMonths':null;
    if(!want) return null;
    return (pb.ranges||[]).find(r=>r.key===want)||null;
  }catch(_){ return null; }
}
function rlpPositionFor(c, category){
  try{
    if(typeof resolvePlaybook!=='function'||typeof playbookKeyFor!=='function') return null;
    const pb=resolvePlaybook(playbookKeyFor(c));
    return (pb.positions||[]).find(p=>p.category===category)||null;
  }catch(_){ return null; }
}
/* ONE CHANGE, ONE RECOMMENDATION, AND THE REASON IT RESTS ON.
   The order below is the order a person reasons in: what standard is this
   about, what does the standard say, does their wording sit inside it, and
   have we been here before. */
function rlpJudge(c, ch){
  const topic=(typeof precedentTopicOf==='function')?precedentTopicOf(ch):null;
  const why=[];
  if(!topic)
    return { verdict:'review', why:[i18t('rp_why_no_standard')], topic:null };
  const range=rlpRangeFor(c, topic.key);
  const pos=rlpPositionFor(c, topic.category);
  const asked=topic.num?topic.num(ch.newText||''):null;

  /* A FORBIDDEN POSITION IS NEVER A JUDGEMENT CALL. The playbook has already
     said this one goes to a person, so the co-pilot's job is to route it,
     not to weigh it. */
  if(pos&&pos.pos==='forbidden')
    return { verdict:'escalate', topic:topic.key,
      why:[i18t('rp_why_forbidden',{category:topic.category})] };

  if(range&&asked!=null){
    const ok=range.op==='<='?asked<=Number(range.value):asked>=Number(range.value);
    const stated=`${range.label||topic.category} ${range.op} ${range.value}${topic.unit?' '+topic.unit:''}`;
    if(ok){
      why.push(i18t('rp_why_within',{asked,unit:topic.unit||'',stated}));
      return { verdict:'accept', topic:topic.key, why, figure:asked, stated };
    }
    why.push(i18t('rp_why_outside',{asked,unit:topic.unit||'',stated}));
    /* THE PLAYBOOK'S OWN ESCALATE FLAG DECIDES WHO ANSWERS. Outside the
       range is a push-back; outside a range the playbook marked escalate is
       somebody else's call, and the product already has the door for it —
       the internal review. */
    return { verdict:range.escalate?'escalate':'push', topic:topic.key, why,
      figure:asked, stated };
  }
  /* GOVERNING LAW IS THE ONE POSITION WITH A HOME. Moving it abroad is the
     deviation the playbook flags hardest, and it is readable without a
     number. */
  if(topic.key==='law'&&typeof jxForeignMarkers==='function'){
    const seats=jxForeignMarkers()||[];
    const t=String(ch.newText||'');
    if(seats.some(s=>new RegExp('laws?\\s+of\\s+'+String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(t)))
      return { verdict:'escalate', topic:topic.key, why:[i18t('rp_why_foreign_law')] };
  }
  if(pos)
    return { verdict:'review', topic:topic.key,
      why:[i18t('rp_why_no_figure',{category:topic.category})] };
  return { verdict:'review', topic:topic.key, why:[i18t('rp_why_no_standard')] };
}
/* THE PLAN: their pending asks, each with a recommendation, the reason, and
   what our own history says about that standard. Ordered worst-first, so
   the things somebody must actually think about are read before the ones
   they can wave through. */
const RLP_ORDER = { escalate:0, push:1, review:2, accept:3 };
function redlinePlan(c){
  if(!c||!Array.isArray(c.changes)) return [];
  const rows=[];
  for(const ch of c.changes){
    if(!ch||ch.status!=='pending'||ch.withdrawn) continue;
    if(ch.authorSide!=='counterparty') continue;      // only their asks
    const j=rlpJudge(c,ch);
    const p=(typeof precedentForChange==='function')?precedentForChange(c,ch):null;
    rows.push({ id:ch.id, clauseId:ch.clauseId||'', clause:ch.clauseLabel||'', summary:ch.summary||'',
      verdict:j.verdict, why:j.why||[], topic:j.topic||null, figure:j.figure,
      stated:j.stated||null,
      precedent:(p&&typeof precedentLine==='function')?precedentLine(p):'' });
  }
  rows.sort((a,b)=>(RLP_ORDER[a.verdict]-RLP_ORDER[b.verdict])||String(a.id).localeCompare(String(b.id)));
  return rows;
}
const rlpCounts = plan => plan.reduce((m,r)=>{ m[r.verdict]=(m[r.verdict]||0)+1; return m; },{});

Object.assign(window,{RLP_VERDICTS,RLP_ORDER,rlpRangeFor,rlpPositionFor,rlpJudge,redlinePlan,rlpCounts});
