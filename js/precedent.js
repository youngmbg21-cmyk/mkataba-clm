/* ============================================================
   PRECEDENT MEMORY (W3-2, WORKORDER-gap-map.md)
   ============================================================
   Every negotiation this workspace has ever run is already on the record:
   what was asked, by which side, on which clause, and how it ended. Nothing
   has ever read it back. So the same argument is had from scratch every
   time, and the playbook goes on stating a position the company quietly
   stopped holding two years ago.

   This is the reading. It is DELIBERATELY DETERMINISTIC — counting is not a
   job for a model, and a recommendation about the company's own standards
   has to be checkable by the admin who is asked to confirm it. Every number
   here can be traced back to named contracts, and the panel that shows it
   names them.

   PER WORKSPACE, NEVER ACROSS CUSTOMERS. It reads state.contracts — the
   caller's own already-scoped bootstrap — and nothing else. There is no
   cross-tenant reading here and there must never be one: a customer's
   negotiating history is the most confidential thing they hold, and the
   moment it informed somebody else's playbook the product would be selling
   one customer's positions to another.

   THE TOPIC VOCABULARY IS THE PLAYBOOK'S. The categories below are the same
   strings the clause library and playbook positions use ('Payment terms',
   'Liability cap', …), so a precedent maps onto a standard without a
   translation table in the middle — and a suggestion can be written back
   into the clause library's own fallback field. */

/* THE FIGURE INSIDE THE WORDING. Legal drafting writes a number twice —
   "forty-five (45) days" — and the parenthesised numeral is the one that is
   machine-readable, so it is asked for first; a bare "45 days" is the plainer
   modern form and is asked for second. Reading only the bare form (the first
   version of this) found nothing in a document written the ordinary way,
   including HaTi's own seeded clause library, so every figure below silently
   went missing and no suggestion could ever be made. */
function precedentFigure(text, unitRe){
  const t=String(text||'');
  const paren=t.match(new RegExp('\\((\\d{1,3})\\)\\s*(?:calendar\\s+|working\\s+|business\\s+)?(?:' + unitRe + ')', 'i'));
  if(paren) return Number(paren[1]);
  const bare=t.match(new RegExp('\\b(\\d{1,3})\\s*(?:calendar\\s+|working\\s+|business\\s+)?(?:' + unitRe + ')', 'i'));
  return bare?Number(bare[1]):null;
}

const PRECEDENT_TOPICS = [
  { key:'payment',  category:'Payment terms',   clause:'cl-pay',
    re:/\b(payment|invoice|net\s*\d|days? of receipt|payable)\b/i,
    /* The number that IS the position. Payment is argued in days and
       liability in months, so a settled figure is worth more than a settled
       clause: it can be compared, ranked, and offered as a fallback. */
    num:t=>{ const n=precedentFigure(t,'days?'); if(n!=null) return n;
      const net=String(t).match(/\bnet\s*(\d{1,3})\b/i); return net?Number(net[1]):null; },
    unit:'days', dir:'higher-is-worse' },
  { key:'liability', category:'Liability cap',  clause:'cl-liab',
    re:/\b(liabilit|indemnif|cap(?:ped)? at|aggregate liability)\b/i,
    num:t=>precedentFigure(t,'months?'),
    unit:'months', dir:'lower-is-worse' },
  { key:'law',       category:'Governing law',  clause:'cl-law',
    re:/\b(govern(?:ed|ing)\s+law|jurisdiction|forum|arbitrat)\b/i, num:()=>null },
  { key:'conf',      category:'Confidentiality', clause:'cl-conf',
    re:/\b(confidential|non-disclosure|secret)\b/i,
    num:t=>precedentFigure(t,'years?'),
    unit:'years', dir:'lower-is-worse' },
  { key:'dp',        category:'Data protection', clause:'cl-dp',
    re:/\b(data protection|personal data|odpc|gdpr)\b/i, num:()=>null },
  { key:'term',      category:'Termination',    clause:'cl-term',
    re:/\b(terminat|notice period|cure period|material breach)\b/i,
    num:t=>precedentFigure(t,"days?['’]?\\s*(?:written\\s+)?notice"),
    unit:'days', dir:'lower-is-worse' },
];
const precedentTopicByKey = k => PRECEDENT_TOPICS.find(t=>t.key===k)||null;
/* Which standard a piece of wording is about. The clause LABEL is asked
   first — a heading says what a clause is for, and says it in fewer words
   than the clause does — then the wording itself. Null where nothing
   matches, which is most edits: a change to a delivery schedule is a real
   change and belongs to no standard, and inventing a topic for it would put
   noise into every count below. */
function precedentTopicOf(change){
  if(!change) return null;
  const label=String(change.clauseLabel||'');
  const body=[label, change.oldText||'', change.newText||''].join(' \n ');
  for(const t of PRECEDENT_TOPICS){ if(t.re.test(label)) return t; }
  for(const t of PRECEDENT_TOPICS){ if(t.re.test(body)) return t; }
  return null;
}
/* HOW A CHANGE ENDED, from the record and not from a guess. `withdrawn` is
   its own outcome and NOT a refusal: the side that asked took it back, which
   says nothing about whether the other side would have agreed. Counting it
   as a refusal would flatter our own position every time somebody changed
   their mind. */
function precedentOutcome(ch){
  if(!ch) return null;
  if(ch.withdrawn) return 'withdrawn';
  if(ch.status==='accepted') return 'accepted';
  if(ch.status==='rejected') return 'refused';
  if(ch.status==='superseded') return 'superseded';
  return null;                                  // still pending — not precedent yet
}
const PRECEDENT_SETTLED = ['accepted','refused'];

const PRECEDENT_EXAMPLES = 6;
/* Enough history to be worth acting on. Two settled arguments is an anecdote;
   the panel says nothing until there are three, because a standard changed on
   the strength of one deal is not a standard. */
const PRECEDENT_MIN = 3;

/* THE MINING. One pass over the book, grouped by topic; every entry keeps
   the contracts it came from so the panel can name them and an admin can go
   and look. `only` narrows to one counterparty — the same arithmetic, which
   is what makes "this counterparty" and "everybody" comparable. */
function precedentMine(opts={}){
  const cs=(window.state&&Array.isArray(state.contracts))?state.contracts:[];
  const only=String(opts.counterparty||'').trim().toLowerCase();
  const out={};
  for(const t of PRECEDENT_TOPICS)
    out[t.key]={ key:t.key, category:t.category, clause:t.clause, unit:t.unit||null,
      ours:{accepted:0,refused:0}, theirs:{accepted:0,refused:0},
      numbers:{oursAccepted:[],theirsAccepted:[]}, examples:[], contracts:new Set() };
  for(const c of cs){
    if(!c||!Array.isArray(c.changes)||!c.changes.length) continue;
    if(only && String(c.counterparty||'').trim().toLowerCase()!==only) continue;
    for(const ch of c.changes){
      const outcome=precedentOutcome(ch);
      if(!PRECEDENT_SETTLED.includes(outcome)) continue;
      const t=precedentTopicOf(ch); if(!t) continue;
      const row=out[t.key];
      /* WHOSE ASK IT WAS decides which half of the ledger moves. `authorSide`
         is the record's own answer and the only one that survives a rename. */
      const side=(ch.authorSide==='counterparty')?'theirs':'ours';
      row[side][outcome]++;
      row.contracts.add(c.id);
      if(outcome==='accepted' && t.num){
        const n=t.num(ch.newText||'');
        if(n!=null&&isFinite(n)) row.numbers[side==='ours'?'oursAccepted':'theirsAccepted'].push(n);
      }
      if(row.examples.length<PRECEDENT_EXAMPLES)
        row.examples.push({ contractId:c.id, contractName:c.name||c.id,
          counterparty:c.counterparty||'', side, outcome,
          clause:ch.clauseLabel||'', at:ch.updatedAt||ch.createdAt||null,
          why:ch.why||null });
    }
  }
  for(const k of Object.keys(out)){ out[k].contracts=[...out[k].contracts]; out[k].total=
    out[k].ours.accepted+out[k].ours.refused+out[k].theirs.accepted+out[k].theirs.refused; }
  return out;
}
/* WHAT THE HISTORY SUGGESTS THE STANDARD SHOULD BE — proposals for an admin,
   never a write. Each carries its evidence: the count, the figure, and the
   contracts it was read from.

   THE ONLY SUGGESTION MADE IS ABOUT THE FALLBACK, never the preferred
   position. A preferred position is what the company wants; history cannot
   argue with an aspiration. A FALLBACK is the line it actually holds, and
   that is exactly the thing the record knows better than anybody's memory. */
function precedentSuggestions(mined){
  const M=mined||precedentMine();
  const out=[];
  for(const t of PRECEDENT_TOPICS){
    const row=M[t.key]; if(!row||!t.num||!t.unit) continue;
    const settled=row.numbers.oursAccepted.concat(row.numbers.theirsAccepted)
      .filter(n=>n!=null&&isFinite(n));
    if(settled.length<PRECEDENT_MIN) continue;
    /* The line actually held: the worst figure this workspace has agreed to
       more than once. Not the average (which is a number nobody ever signed)
       and not the extreme (which may be the one deal everybody regrets). */
    const counts=new Map();
    for(const n of settled) counts.set(n,(counts.get(n)||0)+1);
    const repeated=[...counts.entries()].filter(([,n])=>n>1).map(([v])=>v);
    if(!repeated.length) continue;
    const held=(t.dir==='lower-is-worse')?Math.min(...repeated):Math.max(...repeated);
    const lib=(typeof clauseById==='function')?clauseById(t.clause):null;
    const current=lib?String(lib.fallback||''):'';
    const currentNum=t.num(current);
    if(currentNum!=null && currentNum===held) continue;     // already says so
    out.push({ key:t.key, category:t.category, clause:t.clause,
      figure:held, unit:t.unit, seen:counts.get(held)||0, settled:settled.length,
      current:current||null, currentFigure:currentNum,
      contracts:row.contracts.slice(0,PRECEDENT_EXAMPLES) });
  }
  return out;
}
/* "Last three times this counterparty pushed here…" — the sentence a person
   wants mid-negotiation, and the reason this feature is worth building at
   all. Null where there is no history, because silence is better than a
   line saying nothing happened. */
function precedentForChange(c, ch){
  const t=precedentTopicOf(ch); if(!t) return null;
  const who=String((c&&c.counterparty)||'').trim();
  const mineAll=precedentMine();
  const row=mineAll[t.key];
  const withThem=who?precedentMine({counterparty:who})[t.key]:null;
  const totalAll=row?row.total:0;
  const totalThem=withThem?withThem.total:0;
  if(!totalAll && !totalThem) return null;
  return { topic:t.key, category:t.category, unit:t.unit||null,
    withThem: withThem&&totalThem?{ counterparty:who, ...withThem }:null,
    everyone: row&&totalAll?row:null };
}
/* The sentence itself, built where the numbers are so the phrasing cannot
   drift between the surfaces that print it. Reads from the seat of the
   person looking: THEIR asks are what we conceded or held against. */
function precedentLine(p){
  if(!p) return '';
  const src=p.withThem||p.everyone; if(!src) return '';
  const them=src.theirs.accepted+src.theirs.refused;
  const who=p.withThem?p.withThem.counterparty:null;
  if(!them) return '';
  const held=src.theirs.refused, gave=src.theirs.accepted;
  const nums=src.numbers.theirsAccepted.filter(n=>n!=null);
  const at=nums.length?` (settled at ${Math.max(...nums)}${p.unit?' '+p.unit:''})`:'';
  const subject=who?who:'Counterparties';
  if(gave&&held) return `${subject} pushed on ${p.category} ${them} times: you agreed ${gave}, held ${held}${at}.`;
  if(gave) return `${subject} pushed on ${p.category} ${them} times and you agreed each time${at}.`;
  return `${subject} pushed on ${p.category} ${them} times and you held every time.`;
}

Object.assign(window,{PRECEDENT_TOPICS,precedentFigure,PRECEDENT_MIN,PRECEDENT_EXAMPLES,PRECEDENT_SETTLED,
  precedentTopicByKey,precedentTopicOf,precedentOutcome,precedentMine,
  precedentSuggestions,precedentForChange,precedentLine});
