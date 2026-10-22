/* ============================================================
   NAVIGABLE BY TYPING — THE THINGS INSIDE THE PLACES (owner, 22 Oct 2026:
   "if a person can reach a place by pressing, they can reach it by asking
   Jambo — in one step, from any Jambo box on any page";
   docs/PLAN-navigable-by-typing.md)
   ============================================================
   Jambo's place words (CA_PLACES), doors (CA_DOORS), menu rows (CA_MENU),
   tasks (JM_TASKS) and the Settings finder (stFind) already reach the PLACES.
   This file reads the THINGS inside them, and lands on them through doors
   that already exist (no new doors):
     · a clause of a contract, by number or by name → the contract on Home's
       paper, the clause landed (igPaperGoClause's own way: landOn)
     · a party's folder → Parties, that party chosen and landed (cuSelectParty)
     · Contracts narrowed by stream, stage, party and "ending this quarter /
       year" → the Contracts place showing exactly those (regShowOnly)
   ONE READER, navRead(q, opts), asked FIRST by caUnderstand, so every box that
   reads through it (Home, the Board, the lists, Settings, the Calendar, the
   chat, the phone) reads these the same way. It returns the shape caGo
   already moves on — { kind:'go', place:'nav', nav, say, sayVars } — and
   caGo hands a 'nav' place to navGo. When it cannot do what was asked it
   says so in words ({ kind:'navsay', text }): a clause that is not there, a
   name nobody here has. It never presses an act, and it only ever looks at
   what this reader's own book holds (state.contracts is already walled by
   the server; a code-named deal is passed by).
   ============================================================ */
const _nvT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _nvE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
/* the words, lower case, apostrophes and possessives folded ("Juno's" → "juno"), punctuation spaced */
function navNorm(q){
  return ' ' + String(q || '').toLowerCase().replace(/[’']s\b/g, '').replace(/[’'"“”]/g, '')
    .replace(/[^\p{L}\p{N}&\- ]+/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
}
const navHas = (t, re) => re.test(t);
/* the reader's own book: what state holds, a code-named deal passed by */
function navBook(){
  const L = (typeof state !== 'undefined' && state && Array.isArray(state.contracts)) ? state.contracts : [];
  return L.filter(c => c && !c._codeNamed && !c.archived);
}

/* ---------- THE STREAMS, BY THE WORDS PEOPLE USE FOR THEM ----------
   Each stream's own name gives its words (every word of four letters or more,
   "Procurement & Raw Materials" → procurement, materials); a few everyday and
   Swedish words are added for the six built-in streams. A company's own
   streams are read by their own names. */
const NAV_STREAM_EXTRA = {
  proc: ['purchasing', 'buying', 'raw materials', 'inköp', 'inköpet'],
  mfg: ['production', 'tillverkning'],
  dist: ['distribution', 'logistics', 'warehousing', 'lager', 'distribution'],
  sales: ['sales', 'försäljning', 'försäljningen'],
  mktg: ['marketing', 'brand', 'marknadsföring'],
  corp: ['corporate', 'compliance', 'legal', 'juridik'],
};
const NAV_STREAM_SKIP = new Set(['and', 'raw', 'route', 'market', 'the']);
function navStreamWords(){
  const F = (typeof FOLDERS === 'object' && FOLDERS) || {};
  return Object.keys(F).map(fid => {
    const own = String(F[fid].name || '').toLowerCase().split(/[^\p{L}]+/u).filter(w => w.length >= 4 && !NAV_STREAM_SKIP.has(w));
    return { fid, name: F[fid].name, words: [...new Set(own.concat(NAV_STREAM_EXTRA[fid] || []))] };
  });
}
function navStreamOf(t){
  for (const s of navStreamWords()) for (const w of s.words) if (t.includes(' ' + w + ' ')) return s;
  return null;
}
/* the stage a sentence names, as the register spells it */
function navStageOf(t){
  if (/ (signed|executed|signerade|signerat) /.test(t)) return 'Signed';
  if (/ (drafts?|utkast) /.test(t)) return 'Draft';
  if (/ (under review|in review|being reviewed|granskas|under granskning) /.test(t)) return 'Under Review';
  return null;
}
/* "ending this quarter / this year / this month", read off today's own calendar */
function navEndingOf(t){
  if (/ (end|ending|ends|expire|expiring|expires|run out|running out|löper ut|går ut|slutar)\b/.test(t) || / due to end /.test(t)){
    if (/ (this|the) quarter | detta kvartal | det här kvartalet | kvartalet /.test(t)) return 'quarter';
    if (/ (this|the) month | denna månad | den här månaden /.test(t)) return 'month';
    if (/ (this|the) year | i år | detta år /.test(t)) return 'year';
  }
  return null;
}
function navEndingSpan(k){
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const pad = n => String(n).padStart(2, '0'), iso = x => `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
  const from = (typeof todayISO === 'function') ? todayISO() : iso(d);
  const to = k === 'quarter' ? iso(new Date(y, Math.floor(m / 3) * 3 + 3, 0)) : k === 'month' ? iso(new Date(y, m + 1, 0)) : `${y}-12-31`;
  return { from, to };
}

/* ---------- THE PARTIES, BY THE NAME PEOPLE USE ----------
   A party is matched by its whole name, or by its first word where that word
   is four letters or more and no other party shares it ("Juno" → Juno
   Logistics). Two parties sharing it are both offered. */
const NAV_PARTY_SKIP = new Set(['the', 'east', 'west', 'north', 'south', 'kenya', 'africa', 'group', 'global', 'international', 'limited', 'company']);
function navParties(){
  const seen = new Map();
  for (const c of navBook()){
    const name = String(c.counterparty || '').trim(); if (!name) continue;
    const key = (typeof cuKeyOf === 'function') ? cuKeyOf(name) : name.toLowerCase();
    if (!seen.has(key)) seen.set(key, { key, name });
  }
  return [...seen.values()];
}
function navPartiesIn(t){
  const P = navParties(), hits = [];
  for (const p of P){
    const full = navNorm(p.name);
    if (t.includes(full)) { hits.push({ p, full: true }); continue; }
    const first = full.trim().split(' ')[0];
    /* Swedish writes the possessive without an apostrophe: "Junos mapp" */
    if (first && first.length >= 4 && !NAV_PARTY_SKIP.has(first) && (t.includes(' ' + first + ' ') || t.includes(' ' + first + 's '))) hits.push({ p, full: false });
  }
  /* a whole name beats a first word */
  const whole = hits.filter(h => h.full); return (whole.length ? whole : hits).map(h => h.p);
}

/* ---------- WORDS THAT TELL WHAT IS ASKED FOR ---------- */
const NAV_LEAD = / (take me to|go to|open|show me|show|bring up|find|where is|where are|jump to|navigate to|ta mig till|öppna|visa|gå till|hitta) /;
const NAV_COUNT_Q = /^ (how many|how much|what is the total|total|count|number of|hur många|hur mycket|antal) /;
const NAV_PLAN = / (hours?|minutes?|time slot|slot|meeting|call|block out|book|schedule|plan my|timmar|minuter|möte|boka|planera) /;
const NAV_MOVE = / (take me to|go to|jump to|navigate to|ta mig till|gå till) /;
const NAV_CONTRACT_WORDS = / (contract|contracts|deal|deals|agreement|agreements|lease|nda|avtal|avtalet|avtalen|kontrakt|affär|affären) /;
const NAV_FOLDER_WORDS = / (folder|folders|shelf|mapp|mappen|mapp) /;
const NAV_CLAUSE_NUM = / (?:clause|section|article|klausul|avsnitt|paragraf|punkt|§) ?(\d{1,3})(?:\.\d+)? /;
/* the topics a clause is called by, and the heading words they find */
const NAV_CLAUSE_TOPICS = [
  ['payment', ['payment', 'pay', 'betalning']], ['liability', ['liability', 'ansvar']], ['confidential', ['confidentiality', 'confidential', 'sekretess']],
  ['governing law', ['governing law', 'law', 'tillämplig lag', 'lag']], ['term', ['term', 'duration', 'löptid', 'giltighet']],
  ['termination', ['termination', 'terminate', 'uppsägning']], ['definition', ['definitions', 'definition', 'definitioner']],
  ['supply', ['supply', 'leverans']], ['quality', ['quality', 'rejection', 'kvalitet']], ['rejection', ['rejection', 'reject', 'kvalitet']],
  ['notice', ['notices', 'notice', 'meddelanden']], ['force majeure', ['force majeure']], ['indemnit', ['indemnity', 'indemnification', 'skadeslöshet']],
  ['warrant', ['warranty', 'warranties', 'garanti']], ['fees', ['fees', 'price', 'pris', 'avgift']], ['delivery', ['delivery', 'leverans']],
  ['intellectual property', ['intellectual property', 'ip', 'immateriella']], ['data protection', ['data protection', 'personal data', 'dataskydd']],
];
function navClauseTopicOf(t){
  for (const [topic, words] of NAV_CLAUSE_TOPICS) for (const w of words) if (t.includes(' ' + w + ' ')) return { topic, words };
  return null;
}

/* ---------- THE ONE READER ---------- */
function navRead(q, opts = {}){
  const raw = String(q || '').trim(); if (!raw) return null;
  const t = navNorm(raw);
  /* one contract's versions, compared: its own screen, ahead of every guard below */
  { const cmp = navReadCompare(raw, t); if (cmp) return cmp; }
  /* ANSWER WHERE YOU STAND: when the screen in front reads every word (Explorer's map, the Contracts
     place) it answers there; only "take me to …" moves past it */
  /* a new paper asked for ("draft an NDA with Volvo") is the one form's, never a trip to an old one */
  try { if (!NAV_MOVE.test(t) && typeof caIsDraftAsk === 'function' && caIsDraftAsk(raw)) return null; } catch (_){}
  if (/^ (draft|write|create|make|prepare|skriv|skapa|gör|upprätta) /.test(t) && !NAV_MOVE.test(t)) return null;
  /* a yes-or-no or a why ("Can I send MK-A2 without the review?", "Why can't Legal sign the Naivas
     deal?") is answered where it is asked, never a trip */
  if (/^ (why|can|could|should|may|might|must|will|would|do|does|did|is|are|am|was|varför|kan|får|ska|måste|är) /.test(t) && !NAV_MOVE.test(t)) return null;
  /* "which contracts end this year?" is a question for Jambo, answered beside the Board, never a trip */
  if (/^ (which|what) /.test(t) && !NAV_MOVE.test(t) && !/^ what needs /.test(t)) return null;
  /* a count asked ("how many drafts do I have?") is answered, never a trip */
  if (NAV_COUNT_Q.test(t) && !NAV_MOVE.test(t)) return null;
  /* a planning question ("find me two hours this week for the lease") is the Calendar's, never a trip */
  if (NAV_PLAN.test(t) && !NAV_MOVE.test(t)) return null;
  if (!NAV_MOVE.test(t)){ let here = null; try { here = (typeof caHereRead === 'function') ? caHereRead(raw) : null; } catch (_){ here = null; } if (here) return null; }
  /* ON EXPLORER the map reads its own words (groupings, timelines, "contracts that end by …"); only
     "take me to …" leaves it */
  try { if (!NAV_MOVE.test(t) && typeof caHereScreen === 'function' && caHereScreen() === 'explorer') return null; } catch (_){}
  /* ON THE BOARD a question of lists and numbers stays the Board's; "take me to …" always moves */
  let board = false; try { board = !NAV_MOVE.test(t) && typeof caOnBoard === 'function' && !!caOnBoard(); } catch (_){ board = false; }
  if (board){ const ca = navReadContractAct(raw, t); return navReadClause(raw, t) || (ca && ca.nav && ca.nav.act !== 'open' ? ca : null) || null; }
  return navReadPage(raw, t) || navReadStandards(raw, t) || navReadClause(raw, t) || navReadContracts(raw, t, opts) || navReadContractAct(raw, t) || navReadParty(raw, t) || navReadPerson(raw, t) || (opts.box === 'settings' ? null : navReadSettings(raw, t)) || navReadRequest(raw, t) || navReadDuty(raw, t) || navReadNone(raw, t) || null;
}

/* A PAGE BY ITS EVERYDAY NAME, even with a contract open beside the reader: "all our duties" is the
   Obligations page, not this contract's; the place word's own door then moves (CA_GO) */
const NAV_PAGES = [
  ['oblig', / (all|every|our) (our )?(duties|obligations) |^ (show me )?(all )?(our )?duties $|^ alla (våra )?åtaganden $/],
  ['negotiations', /^ (take me to |open |go to |show me )?(the )?(negotiations|negotiation list|negotiations list|förhandlingar|förhandlingarna)( list| page)? $/],
  ['people', / (people directory|the directory|directory of people|personkatalog|katalogen) /],
  /* "jambo's work" is the Board's card (land-on-it 1a, the owner's door); his house by its own name */
  ['house', / (jambo s house|jambos house|jambo house|jambos hus) /],
  ['needs', /^ (what )?(needs me|needs you|is waiting on me|waits for me|väntar på mig) $/],
];
function navReadPage(raw, t){
  for (const [k, re] of NAV_PAGES) if (re.test(t)) return { kind: 'go', place: k };
  return null;
}

/* A CONTRACT AND WHAT TO OPEN BESIDE IT, where the place readers do not reach it: a contract named by
   its name's own words ("the brand campaign"), or an act whose face the reader asks for by name —
   Fill in (the checklist of what is owed), the letter Before you send (it sends nothing), the Clauses
   tab, an amendment, the Dossier. Every one through the face's own door; nothing is pressed. */
const NAV_ACTS = [
  ['fill', / (fill in|fill out|the details|details for|details of|its details|fyll i|uppgifterna|uppgifter för) /],
  ['send', / (send|share|dela|skicka) /],
  ['clauses', / (clauses|klausuler|klausulerna) /],
  ['amend', / (amend|amendment|ändra|tillägg) /],
  ['dossier', / (dossier|dossiern) /],
  ['oblig', / (obligations|duties|åtaganden) /],
  ['hist', / (history|historik|historiken) /],
];
const NAV_ACT_OWN = new Set(['fill', 'send', 'clauses', 'amend', 'dossier']);
function navReadContractAct(raw, t){
  if (/ (contracts|agreements|deals|avtalen|kontrakten) /.test(t)) return null;    // a list asked for is never one contract
  if (NAV_FOLDER_WORDS.test(t) || / (request|requests|förfrågan|förfrågningar) /.test(t)) return null;   // a party's folder, a request: their own readers'
  const act = (NAV_ACTS.find(([, re]) => re.test(t)) || ['open'])[0];
  let rest = raw;
  for (const [, re] of NAV_ACTS) rest = navNorm(rest).replace(re, ' ');
  rest = rest.replace(/ (take me to|go to|open|show me|show|the|to them|to the other side|of|for|in|on|with|its|me|please) /g, ' ').trim();
  let hit = null, shared = false;
  try { hit = (typeof caContractOf === 'function') ? caContractOf(rest) : null; } catch (_){ hit = null; }
  if (hit && hit.c) shared = true;
  else hit = navContractByName(rest, { loose: NAV_CONTRACT_WORDS.test(t) });
  if (!hit) return null;
  /* the place readers already reach a contract they can name; only the faces they do not are taken here */
  if (shared && !NAV_ACT_OWN.has(act)) return null;
  /* a send named with its purpose ("Send MK-J1 for signing") is the share reader's: it sets the letter's purpose */
  if (act === 'send' && (/ (for signing|to sign|for signature|for review|to review|för underskrift|för granskning) /.test(t))) return null;
  if (hit.picks && hit.picks.length > 1) return navWhich(hit.picks.map(c => ({ c, nav: { k: 'cact', cid: c.id, act } })));
  const c = hit.c; if (!c) return null;
  /* AI FIRST (stage 3): "open" is sure only when the sentence names the contract and nothing more — "when does
     the Westlands lease end", "cap on damages in the sugar deal" ask something OF it, and go to Jambo */
  if (act === 'open' && navLeftover(rest, c).length) return null;
  if (act === 'amend'){
    let shut = ''; try { shut = (typeof amendmentShutWhy === 'function') ? amendmentShutWhy(c) : ''; } catch (_){ shut = ''; }
    if (shut) return { kind: 'navsay', text: shut };
  }
  return { kind: 'go', place: 'nav', cid: c.id, nav: { k: 'cact', cid: c.id, act }, say: 'nav_go_act_' + act, sayVars: { ref: navRef(c), name: c.name || '' } };
}

/* what a sentence says beyond the contract it names: the words left once the contract's own name, its party,
   the words of opening and the small words are taken out */
const NAV_OPEN_SKIP = new Set(['the', 'a', 'an', 'and', 'of', 'for', 'with', 'to', 'me', 'my', 'our', 'up', 'pull', 'bring', 'open', 'show', 'see', 'take', 'go', 'please', 'now',
  'contract', 'contracts', 'agreement', 'deal', 'one', 'file', 'paper', 'document', 'draft', 'signed', 'avtal', 'utkast', 'avtalet', 'kontrakt', 'kontraktet', 'öppna', 'visa', 'det', 'den', 'med']);
function navLeftover(rest, c){
  const own = new Set(navNorm([c.name, c.counterparty, c.id, c.contractNo, c.type].filter(Boolean).join(' ')).trim().split(' '));
  return navNorm(rest).trim().split(' ').filter(w => w && w.length > 1 && !NAV_OPEN_SKIP.has(w) && !own.has(w) && !NAV_NAME_SKIP.has(w)
    && ![...own].some(o => o.length >= 4 && (w.startsWith(o) || o.startsWith(w))));
}
/* A CLAUSE OF A CONTRACT: "clause 7 of the Kabras supply deal", "the payment
   clause in MK-A1", "governing law in MK-A1", "where does MK-A1 talk about
   rejection", "klausul 7 i MK-A1" */
function navReadClause(raw, t){
  const num = (t.match(NAV_CLAUSE_NUM) || [])[1] || null;
  const clauseWord = / (clause|clauses|section|article|klausul|klausulen|avsnitt|paragraf|punkt|§) /.test(t);
  const talks = / (talk about|talks about|say about|says about|mention|mentions|deal with|deals with|cover|covers) /.test(t);
  const topic = navClauseTopicOf(t);
  if (!num && !(clauseWord && topic) && !(talks && topic)){
    /* "governing law in MK-A1": a topic and a contract's number, nothing else */
    if (!(topic && /#?\b[a-z]{2,4}-[a-z0-9]*\d/i.test(raw) && / (in|of|i) /.test(t))) return null;
  }
  if (clauseWord && !num && !topic && / (clauses) /.test(t)) return null;     // "clauses of X" is the Clauses tab, the place reader's
  /* the contract named in the rest of the sentence */
  let rest = raw.replace(/\b(?:clause|section|article|klausul|klausulen|avsnitt|paragraf|punkt)\s*\d{1,3}(?:\.\d+)?\b/ig, ' ').replace(/§\s*\d+/g, ' ');
  if (topic) for (const w of topic.words) rest = rest.replace(new RegExp('\\b' + w.replace(/\s+/g, '\\s+') + '\\b', 'ig'), ' ');
  rest = rest.replace(/\b(?:take me to|go to|open|show me|show|the|clause|where does|talk about|talks about|say about|says about|in|of|i|on|for|what)\b/ig, ' ').replace(/\s+/g, ' ').trim();
  let hit = null; try { hit = (typeof caContractOf === 'function') ? caContractOf(rest) : null; } catch (_){ hit = null; }
  if (!hit || hit.miss || (!hit.c && !hit.picks)) hit = navContractByName(rest);
  if (!hit) return null;                                                     // no contract named: not a clause ask
  if (hit.picks && hit.picks.length > 1) return navWhich(hit.picks.map(c => ({ c, nav: { k: 'clause', cid: c.id, num, topic: topic && topic.topic } })));
  const c = hit.c; if (!c) return null;
  const nav = { k: 'clause', cid: c.id, num, topic: topic ? topic.topic : null, words: topic ? topic.words : null };
  /* a number past the contract's last clause is said, not moved to (read off its own wording when it is here) */
  const n = navClauseCount(c);
  if (num && n && Number(num) > n) return { kind: 'navsay', text: _nvT('nav_no_clause', { n: num, ref: navRef(c), count: n }) };
  return { kind: 'go', place: 'nav', nav, cid: (num && !n) ? undefined : c.id, say: num ? (n ? 'nav_go_clause' : 'nav_go_clause_look') : 'nav_go_clause_topic',
    sayVars: { n: num, topic: topic ? topic.words[0] : '', ref: navRef(c), name: c.name || '' } };
}
/* A CONTRACT BY ITS NAME'S OWN WORDS, where the shared finder (caContractOf) reads none: "the sugar
   supply" is Refined Sugar Supply. Every word of the name, else two or more of its longer words; one
   contract is the answer, several are offered, none is none. */
const NAV_NAME_SKIP = new Set(['the', 'and', 'for', 'with', 'agreement', 'contract', 'deal', 'services', 'service', 'supply']);
function navContractByName(rest, opts){
  const t = navNorm(rest); if (t.trim().length < 3) return null;
  /* "the warehousing contract": one strong word of a name is enough where the sentence says it is a contract */
  const floor = (opts && opts.loose) ? 1 : 1.5;
  const words = c => navNorm(c.name).trim().split(' ').filter(w => w.length >= 3);
  /* the party's own first word counts too: "the warehousing contract with Juno" */
  const partyHit = c => { const f = navNorm(c.counterparty).trim().split(' ')[0]; return f && f.length >= 4 && (t.includes(' ' + f + ' ') || t.includes(' ' + f + 's ')); };
  const scored = navBook().map(c => {
    const W = words(c), got = W.filter(w => t.includes(' ' + w + ' '));
    const strong = got.filter(w => !NAV_NAME_SKIP.has(w));
    const named = got.length > 0 || strong.length > 0;
    return { c, all: W.length && got.length === W.length, n: strong.length + (got.length - strong.length) * 0.5 + (named && partyHit(c) ? 1 : 0) };
  }).filter(x => x.all || x.n >= floor);
  if (!scored.length) return null;
  const whole = scored.filter(x => x.all);
  const pool = whole.length ? whole : scored.filter(x => x.n === Math.max(...scored.map(y => y.n)));
  return pool.length === 1 ? { c: pool[0].c, how: 'name' } : { picks: pool.map(x => x.c) };
}
/* how many numbered clauses a contract's own wording has, where the wording is here (null when it is not) */
function navClauseCount(c){
  const text = (c && (c.redlineText || (c.negotiation && c.negotiation.baselineBody) || '')) || '';
  if (!text || typeof clauseSegment !== 'function') return null;
  try {
    const seg = clauseSegment(text) || [];
    let nums = seg.map(s => Number(String(s.num || '').split('.')[0])).filter(n => n > 0);
    /* a plain-text wording carries its numbers in the heading lines ("7. Liability") */
    if (!nums.length) nums = [...String(text).replace(/<[^>]+>/g, '\n').matchAll(/^\s*(\d{1,3})[.)]\s+\S/gm)].map(m => Number(m[1]));
    return nums.length ? Math.max(...nums) : null;
  } catch (_){ return null; }
}
const navRef = c => (typeof contractRef === 'function') ? contractRef(c) : (c && c.id);

/* CONTRACTS, NARROWED: "contracts ending this quarter in Procurement", "signed
   contracts in Sales", "drafts", "contracts with Naivas". On the Board a
   question about numbers stays the Board's; "take me to …" always moves. */
function navReadContracts(raw, t, opts){
  if (/ (how long we keep|keeping|retention|bevara|gallring) /.test(t)) return null;     // a stream's Keeping, in Settings
  const stage = navStageOf(t), stream = navStreamOf(t), ending = navEndingOf(t);
  /* "drafts" is a list; "the cold chain haulage draft" is one contract */
  const contractsWord = / (contracts|agreements|deals|avtal|avtalen|kontrakt) /.test(t) || (stage === 'Draft' && / (drafts|utkasten|alla utkast) /.test(t)) || /^ (drafts|utkast) $/.test(t);
  const parties = navPartiesIn(t);
  const party = parties.length === 1 ? parties[0] : null;
  if (!contractsWord && !(stage && stream) && !(ending && contractsWord)) return null;
  if (!stage && !stream && !ending && !party) return null;
  /* one contract named is the contract reader's ("the Kabras supply deal"), never a list */
  if (!/ (contracts|agreements|deals|avtalen|drafts) /.test(t) && !stage && !ending) return null;
  const f = { stage, stream: stream ? stream.fid : null, ending, party: party ? party.key : null };
  const span = ending ? navEndingSpan(ending) : null;
  const ids = navBook().filter(c => {
    if (f.stage && c.status !== f.stage) return false;
    if (f.stream && c.folder !== f.stream) return false;
    if (f.party && ((typeof cuKeyOf === 'function') ? cuKeyOf(c.counterparty) : String(c.counterparty || '').toLowerCase()) !== f.party) return false;
    if (span){
      if (c.parentId) return false;                                          // the agreement's own end, as amended
      let e = ''; try { e = (typeof effectiveExpiry === 'function' && effectiveExpiry(c)) || c.expiry || ''; } catch (_){ e = c.expiry || ''; }
      e = String(e || '').slice(0, 10); if (!(e >= span.from && e <= span.to)) return false;
    }
    return true;
  }).map(c => c.id);
  const label = navContractsLabel(f, stream, party);
  return { kind: 'go', place: 'nav', nav: { k: 'contracts', ids, label, f },
    say: ids.length ? 'nav_go_contracts' : 'nav_go_contracts_none', sayVars: { n: ids.length, what: label } };
}
function navContractsLabel(f, stream, party){
  const bits = [];
  if (f.stage) bits.push(_nvT('nav_l_stage_' + ({ Signed: 'signed', Draft: 'draft', 'Under Review': 'review' })[f.stage]));
  if (f.ending) bits.push(_nvT('nav_l_ending_' + f.ending));
  if (stream) bits.push(_nvT('nav_l_in', { stream: stream.name }));
  if (party) bits.push(_nvT('nav_l_with', { party: party.name }));
  return bits.join(' · ') || _nvT('nav_l_all');
}

/* A PARTY'S FOLDER: "Juno's folder", "open Juno Logistics", "take me to Juno",
   "Westlands Towers", "Junos mapp". A sentence that names a contract, or asks
   for contracts, is not a folder ask. */
function navReadParty(raw, t){
  if (NAV_CONTRACT_WORDS.test(t)) return null;
  const P = navPartiesIn(t); if (!P.length) return null;
  const folder = NAV_FOLDER_WORDS.test(t), lead = NAV_LEAD.test(t);
  /* only the name, or the name with a lead or "folder": never a sentence that only mentions them */
  const leftover = P.reduce((s, p) => s.replace(navNorm(p.name), ' ').replace(' ' + navNorm(p.name).trim().split(' ')[0] + ' ', ' '), t)
    .replace(NAV_LEAD, ' ').replace(NAV_FOLDER_WORDS, ' ').replace(/ (the|their|our|a|of|me|to|for|please|now|then|show|open) /g, ' ').trim();
  if (!folder && !lead && leftover) return null;
  if (P.length > 1) return navWhich(P.map(p => ({ label: p.name, nav: { k: 'party', key: p.key, name: p.name } })));
  const p = P[0];
  /* a party with ONE contract, named without "folder", is that contract (the place reader's, its strip) */
  if (!folder && navBook().filter(c => ((typeof cuKeyOf === 'function') ? cuKeyOf(c.counterparty) : String(c.counterparty || '').toLowerCase()) === p.key).length === 1) return null;
  return { kind: 'go', place: 'nav', nav: { k: 'party', key: p.key, name: p.name }, say: 'nav_go_party', sayVars: { name: p.name } };
}

/* "WHICH DID YOU MEAN?" — the choices as presses, each landing where it says */
function navWhich(list){
  const picks = list.slice(0, 6).map(x => ({ label: x.label || (x.c ? `${navRef(x.c)} · ${x.c.name || ''}` : ''), nav: x.nav, cid: x.c ? x.c.id : (x.nav && x.nav.cid) }));
  return { kind: 'navsay', text: _nvT('nav_which'), choices: picks.map(p => ({ label: p.label, nav: p.nav })) };
}

/* ---------- THE MOVE ---------- */
const NAV_LAND_TRIES = 50, NAV_LAND_BEAT_MS = 100;
function navGo(a){
  const n = a && a.nav; if (!n) return false;
  /* a Settings drawer left open would stand over the place this moves to: shut by its own close
     (the same as a press outside it), unless the move is to another Settings spot */
  if (!['you', 'company', 'person', 'stream'].includes(n.k) && typeof document !== 'undefined' && document.querySelector('#st-drawer.open') && typeof stDrawerClose === 'function'){
    try { stDrawerClose(); } catch (_){}
  }
  if (n.k === 'party'){
    /* THE PHONE has no Parties page: a party's folder there is its Contracts list, narrowed to them */
    if (typeof mPhone === 'function' && mPhone() && typeof regShowOnly === 'function'){
      const ids = navBook().filter(c => ((typeof cuKeyOf === 'function') ? cuKeyOf(c.counterparty) : String(c.counterparty || '').toLowerCase()) === n.key).map(c => c.id);
      regShowOnly(ids, n.name || n.key);
      return true;
    }
    return (typeof cuSelectParty === 'function') ? (cuSelectParty(n.key), true) : false;
  }
  if (n.k === 'contracts'){
    if (typeof regShowOnly !== 'function') return false;
    /* an empty list is still shown, so "none" is seen and not guessed */
    if (n.ids.length) regShowOnly(n.ids, n.label);
    else if (typeof regGoFiltered === 'function') regGoFiltered({ only: { ids: ['—'], label: n.label } });
    return true;
  }
  if (n.k === 'clause') return navGoClause(n);
  if (n.k === 'cact') return navGoAct(n);
  if (n.k === 'compare') return navGoCompare(n);
  return navGoStage2(n) || navGoStage3(n);
}
/* the contract on Home's paper, then its clause found on the paper as drawn and landed. A paper drawn
   without clause marks (a plain-text or uploaded wording) has its clauses as rows on the Clauses tab
   beside it: there the row is opened at the reading line (docThreadGoTo, the tab's own door) and landed */
const NAV_PAPER_TRIES = 15;
/* A LANDING STILL ON ITS WAY: raised from the press until the clause is landed or said not to be there,
   so a page or a check waiting for the screen to stand still can ask (navLanding) */
let _navLanding = false;
const navLanding = () => _navLanding;
function navGoClause(n){
  const c = (typeof getContract === 'function') ? getContract(n.cid) : null; if (!c) return false;
  /* THE LIGHT LIST carries no wording: a number asked of a contract whose clauses are not counted yet
     is counted off the full record first, and one past its last clause is said, not moved to */
  if (n.num && !n.counted && navClauseCount(c) == null && typeof ensureFull === 'function'){
    _navLanding = true;
    Promise.resolve(ensureFull(c)).then(full => {
      const k = navClauseCount(full || getContract(n.cid) || c);
      if (k && Number(n.num) > k){ _navLanding = false; navSayLate(_nvT('nav_no_clause', { n: n.num, ref: navRef(c), count: k })); return; }
      navGoClause(Object.assign({}, n, { counted: true }));
    }, () => navGoClause(Object.assign({}, n, { counted: true })));
    return true;
  }
  _navLanding = true;
  /* THE LETTER WAITS (round 11's gaps: "Go to clause 7 … the letter waits in its desk tab"): the
     panel's own back turns it from Before you send, the letter kept one tab away */
  try { if (typeof pdSendShows === 'function' && pdSendShows() && typeof pdSendAway === 'function') pdSendAway(); } catch (_){}
  if (typeof pdOpenOnHome === 'function') pdOpenOnHome(c.id, 'copilot');
  let tries = 0, onTab = false;
  const look = () => {
    const el = onTab ? navClauseRow(n) : navClauseEl(n);
    if (el){
      if (onTab && typeof docThreadGoTo === 'function') try { docThreadGoTo(getContract(c.id) || c, Number(el.getAttribute('data-th-row'))); } catch (_){}
      if (typeof landOn === 'function') landOn(el, { block: 'center', focus: false }); else el.scrollIntoView({ block: 'center' });
      setTimeout(() => { _navLanding = false; }, 300);   // the lander's own beat, then the screen stands
      return;
    }
    if (!onTab && tries >= NAV_PAPER_TRIES && !navPaperMarked()){
      onTab = true; tries = 0;
      if (typeof pdOpenOnHome === 'function') pdOpenOnHome(c.id, 'doc');
    }
    if (++tries < NAV_LAND_TRIES) { setTimeout(look, NAV_LAND_BEAT_MS); return; }
    _navLanding = false;
    navSayLate(n.num ? _nvT('nav_no_clause_here', { n: n.num, ref: navRef(c) }) : _nvT('nav_no_topic_here', { topic: (n.words || [n.topic])[0] || n.head || '', ref: navRef(c) }));
  };
  setTimeout(look, 0);
  return true;
}
/* the clause on the paper: its number at the head, else its heading's words, else the first clause whose words say it */
function navClauseEl(n){
  if (typeof document === 'undefined') return null;
  const host = document.getElementById('ig-paper'); if (!host || host.hidden) return null;
  const els = [...host.querySelectorAll('[data-clause], [data-pz-clause]')]; if (!els.length) return null;
  const head = el => String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120).toLowerCase();
  if (n.num){
    const re = new RegExp('^(?:clause\\s+|§\\s*)?' + n.num + '(?:[.)\\s]|$)');
    return els.find(el => re.test(head(el))) || null;
  }
  /* the passage Jambo found, by its own first words (a passage is not a clause: the clause that holds them) */
  if (n.quote){ const q = navQuoteKey(n.quote); const hit = q && els.find(el => navQuoteKey(el.textContent).includes(q)); if (hit) return hit; }
  const words = n.words || [n.topic];
  if (!words || !words[0]) return null;
  const inHead = el => { const h = head(el).slice(0, 48); return words.some(w => h.includes(w)); };
  return els.find(inHead) || els.find(el => words.some(w => head(el).includes(w))) || null;
}
/* the words of a passage to look for on the paper: letters and digits, spaced once, its first forty-odd characters */
function navQuoteKey(s){
  const t = String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  return t.length < 12 ? '' : t.slice(0, 48).replace(/\s\S*$/, '');
}
/* a contract and its face, each through its own door */
function navGoAct(n){
  const id = n.cid;
  const go = {
    fill: () => (typeof pdFillOpen === 'function') ? pdFillOpen(id) : pdOpenOnHome(id, 'copilot'),
    send: () => (typeof pdSendOpen === 'function') ? (pdOpenOnHome(id, 'copilot'), pdSendOpen(id)) : false,
    clauses: () => pdOpenOnHome(id, 'doc'),
    amend: () => (typeof pdAmendOpen === 'function') ? (pdOpenOnHome(id, 'copilot'), pdAmendOpen(id)) : false,
    dossier: () => pdOpenOnHome(id, 'copilot'),
    oblig: () => pdOpenOnHome(id, 'oblig'),
    hist: () => (typeof hbOpenView === 'function') ? hbOpenView(id, 'hist') : pdOpenOnHome(id, 'copilot'),
    /* Jambo's doors (stage 2): Before you sign, Redlines and the brief, each its own face's door; nothing pressed */
    sign: () => (typeof pdSignOpen === 'function') ? pdSignOpen(id) : false,
    redlines: () => (typeof pdRedOpen === 'function') ? pdRedOpen(id) : false,
    brief: () => (typeof caBriefOpen === 'function' && typeof getContract === 'function') ? caBriefOpen(getContract(id)) : false,
    open: () => pdOpenOnHome(id, 'open'),
  }[n.act];
  if (typeof go !== 'function' || typeof pdOpenOnHome !== 'function') return false;
  const ok = go();
  return ok !== false;
}
/* does the paper in front mark its clauses at all? */
function navPaperMarked(){
  const host = (typeof document !== 'undefined') ? document.getElementById('ig-paper') : null;
  return !!(host && host.querySelector('[data-clause], [data-pz-clause]'));
}
/* the clause's row on the Clauses tab beside the paper ("7. Liability") */
function navClauseRow(n){
  if (typeof document === 'undefined') return null;
  const rows = [...document.querySelectorAll('#ig-dock .doc-th-row[data-th-row]')]; if (!rows.length) return null;
  const head = el => String(el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120).toLowerCase();
  if (n.num){ const re = new RegExp('^(?:clause\\s+|§\\s*)?' + n.num + '(?:[.)\\s]|$)'); return rows.find(el => re.test(head(el))) || null; }
  /* a passage begins with its clause's heading: the row whose heading the passage's first words are */
  if (n.quote){
    const q = String(n.quote).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    const hit = rows.find(el => { const k = head(el).replace(/[^\p{L}\p{N}]+/gu, ' ').trim().slice(0, 40); return k.length >= 6 && q.startsWith(k); });
    if (hit) return hit;
  }
  const words = n.words || [n.topic];
  if (!words || !words[0]) return null;
  return rows.find(el => words.some(w => head(el).slice(0, 48).includes(w))) || rows.find(el => words.some(w => head(el).includes(w))) || null;
}
/* a line said after the move, where the last turn is (Home's panel) */
function navSayLate(text){
  try {
    if (typeof intel === 'object' && intel && Array.isArray(intel.history)){
      intel.history.push({ role: 'assistant', text: _nvE(text) });
      if (typeof renderIntelDock === 'function') renderIntelDock();
    } else if (typeof toast === 'function') toast(text, 'warn');
  } catch (_){}
}
/* a choice pressed under "which did you mean?" */
function navChoicePress(ch){
  if (!ch || !ch.nav) return false;
  const a = { kind: 'go', place: 'nav', nav: ch.nav, cid: ch.nav.cid };
  if (typeof caGo === 'function') return caGo(a);
  return navGo(a);
}

/* ---------- STAGE 2 · SETTINGS, A PERSON, A STREAM, OUR STANDARDS, A TEMPLATE ---------- */
/* YOUR OWN SETTINGS by their everyday names: the You sheet's own rows (stYouGo lands on the card) */
const NAV_YOU = [
  ['lang', / (my language|language|mitt språk|språk) /],
  ['told', / (daily brief|my brief|morning brief|how often i get the brief|alerts on this device|phone alerts|push alerts|notifications|how i am told|dagliga sammanfattning|aviseringar) /],
  ['safety', / (two step|two-step|two factor|2fa|tvåstegs) /],
  ['away', / (when im away|when i am away|im away|out of office|cover for me|stand in|stand-in|deputy|när jag är borta|ställföreträdare) /],
  ['who', / (my name|job title|my title|my email|mitt namn|min titel) /],
  ['data', / (copy of my data|my data|download my|min data) /],
  ['work', / (suggestions under his box|jambo suggestions|jambos suggestions|his suggestions|chips under|förslag under) /],
];
/* THE COMPANY'S PAGES AND PANELS by their everyday names: the drawer or page each opens (openSettingsAt) */
const NAV_COMPANY = [
  ['panel', 'approvals', / (approval rules|rules for approval|who approves|godkännanderegler) /],
  ['panel', 'company', / (exchange rates?|fx rates?|currency rates?|växelkurs(er)?) /],
  ['panel', 'folders', / (categories we file|filing categories|file under|the categories|kategorier) /],
  ['panel', 'engine', / (jambo spending|jambos spending|ai spending|jambo key|the jambo key|api key|ai key|jambos nyckel) /],
  ['panel', 'linkcode', / (codes? on links|link codes?|code on the link|koder på länkar) /],
  ['panel', 'review', / (internal review|review before sending|intern granskning) /],
  ['panel', 'desk', / (negotiation desk|the desk setting|förhandlingsdesk) /],
  ['page', 'team', / (add a person|add someone|invite (a|someone)|people in our workspace|our people|the team|lägg till en person) /],
  ['page', 'streams', /^ (open |show me |take me to )?(our |the )?(value )?streams( page| settings)? $|^ (våra )?strömmar $/],   // whole words only: on Explorer "value streams against …" is a grouping
];
const NAV_ADMIN_SAYS = 'nav_walled_admin';
function navIsAdmin(){ try { return typeof isAdmin === 'function' && !!isAdmin(); } catch (_){ return false; } }
function navUsersIn(t){
  let U = []; try { U = (typeof getUsers === 'function' && getUsers()) || []; } catch (_){ U = []; }
  const hits = [];
  for (const u of U){
    const full = navNorm(u.name || ''); if (!full.trim()) continue;
    const first = full.trim().split(' ')[0];
    if (t.includes(full) || (first.length >= 3 && (t.includes(' ' + first + ' ') || t.includes(' ' + first + 's ')))) hits.push(u);
  }
  return hits;
}
function navReadSettings(raw, t){
  /* a contract's words are a contract's, except "how long we keep … contracts" (the stream's Keeping) */
  const keep = / (how long we keep|keep .* contracts|keeping|retention|bevara|gallring) /.test(t);
  const access = / (who can open|who can see|access to|access for|tillgång till|vem kan öppna) /.test(t);
  const limit = / (signing limit|sign up to|signing cap|signeringsgräns) /.test(t);
  /* A PERSON: their signing limit, their access — an admin's drawer */
  if (limit || / access $/.test(t) || / profile /.test(t)){
    const U = navUsersIn(t);
    if (U.length){
      if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
      if (U.length > 1) return navWhich(U.map(u => ({ label: u.name || u.email, nav: { k: 'person', id: u.id, row: limit ? 'cap' : 'access' } })));
      if (limit || access || / access $/.test(t)) return { kind: 'go', place: 'nav', nav: { k: 'person', id: U[0].id, row: limit ? 'cap' : 'access' }, say: limit ? 'nav_go_cap' : 'nav_go_access', sayVars: { name: U[0].name || '' } };
    }
  }
  /* A STREAM: who can open it, how long we keep it */
  if (access || keep){
    const s = navStreamOf(t);
    if (s){
      if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
      return { kind: 'go', place: 'nav', nav: { k: 'stream', fid: s.fid, keep }, say: keep ? 'nav_go_keep' : 'nav_go_stream', sayVars: { stream: s.name } };
    }
  }
  if (NAV_CONTRACT_WORDS.test(t)) return null;
  if (/ (password|lösenord) /.test(t) && / (my|change|reset|mitt|byt) /.test(t)) return { kind: 'go', place: 'nav', nav: { k: 'you', key: 'password', card: 'safety' }, say: 'nav_go_you' };
  for (const [key, re] of NAV_YOU) if (re.test(t)) return { kind: 'go', place: 'nav', nav: Object.assign({ k: 'you', key }, key === 'safety' ? { card: 'safety' } : {}), say: 'nav_go_you' };
  for (const [kind, key, re] of NAV_COMPANY) if (re.test(t)){
    if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
    return { kind: 'go', place: 'nav', nav: { k: 'company', kind, key }, say: 'nav_go_setting' };
  }
  return null;
}

/* OUR STANDARDS, a book and a row: "where do I change our liability standard for NDAs" */
const NAV_STD_BOOKS = [['nda', / (nda|ndas|non disclosure|sekretessavtal) /], ['supply', / (supply|supplies|leverans) /], ['lease', / (lease|leases|hyresavtal) /], ['services', / (services|service agreements?|tjänster) /]];
const NAV_STD_ROWS = [['liability', / (liability|ansvar) /], ['payment', / (payment terms|payment|betalning) /], ['confidential', / (confidentiality|confidential|sekretess) /]];
function navReadStandards(raw, t){
  const std = / (standard|standards|playbook|standarder) /.test(t), tpl = / (template|templates|mall|mallen) /.test(t);
  if (!std && !tpl) return null;
  const book = (NAV_STD_BOOKS.find(([, re]) => re.test(t)) || [null])[0];
  if (tpl){
    if (!book) return null;                                                  // "our templates" is the place word's
    return { kind: 'go', place: 'nav', nav: { k: 'template', key: book }, say: 'nav_go_template' };
  }
  const row = (NAV_STD_ROWS.find(([, re]) => re.test(t)) || [null])[0];
  if (!book && !row) return null;                                            // "our standards" is the place word's
  return { kind: 'go', place: 'nav', nav: { k: 'std', book: book || '_default', row }, say: 'nav_go_std' };
}

/* ---------- STAGE 2 · THE MOVES ---------- */
/* land on what a door draws, once it is drawn: asked again each beat, bounded, said when it never came */
function navLandWhen(find, missing){
  _navLanding = true;
  let tries = 0;
  const look = () => {
    let el = null; try { el = find(); } catch (_){ el = null; }
    if (el){
      if (typeof landOn === 'function') landOn(el, { block: 'center', focus: false }); else el.scrollIntoView({ block: 'center' });
      /* A PAGE THAT REDRAWS ITSELF AS IT ARRIVES (Settings does) drops the mark with the old element:
         asked again for a few beats, the live element is landed on */
      let held = 0;
      const hold = () => {
        let now = null; try { now = find(); } catch (_){ now = null; }
        if (now && !now.classList.contains('is-landed') && typeof landOn === 'function') landOn(now, { block: 'nearest', focus: false });
        if (++held < NAV_HOLD_BEATS) setTimeout(hold, NAV_LAND_BEAT_MS * 2); else _navLanding = false;
      };
      setTimeout(hold, NAV_LAND_BEAT_MS * 2);
      return;
    }
    if (++tries < NAV_LAND_TRIES) { setTimeout(look, NAV_LAND_BEAT_MS); return; }
    _navLanding = false;
    if (missing) navSayLate(missing);
  };
  setTimeout(look, 0);
  return true;
}
const NAV_HOLD_BEATS = 5;
const NAV_STD_ROW_RE = { liability: /liabil|ansvar/i, payment: /payment|betaln/i, confidential: /confidential|sekretess/i };
const NAV_TPL_RE = { nda: /\bnda\b|non.?disclosure|sekretess/i, supply: /supply|leverans/i, lease: /lease|hyres/i, services: /service|tjänst/i };
function navGoStage2(n){
  if (n.k === 'you'){
    if (typeof stYouGo !== 'function') return false;
    if (typeof setView === 'function' && state.view !== 'team') setView('team');
    /* SIGNING IN lands on its card, its control ready: its own door opens a drawer that would take
       the reader past it (two-step, the password are pressed there, never by a sentence) */
    if (n.card){
      if (typeof settingsGoTab === 'function' && typeof settingsTab === 'function' && settingsTab() !== 'you') settingsGoTab('you');
      return navLandWhen(() => document.querySelector(`#set-page [data-st-you-card="${n.card}"]`));
    }
    stYouGo(n.key);
    return true;
  }
  if (n.k === 'company'){
    if (typeof openSettingsAt !== 'function') return false;
    if (n.kind === 'page'){ openSettingsAt('company'); if (typeof settingsGoPage === 'function') settingsGoPage(n.key); return true; }
    openSettingsAt('company', n.key); return true;
  }
  if (n.k === 'person'){
    if (typeof stFindGo !== 'function') return false;
    /* access is kept on the People page (the person's drawer over it); a signing limit opens where the finder's row does */
    if (n.row === 'access' && typeof openSettingsAt === 'function') openSettingsAt('people', 'person:' + n.id); else stFindGo('person:' + n.id);
    const sel = n.row === 'cap' ? '#st-drawer.open #tm-cap, #st-drawer.open #tm-cap-none, #st-drawer.open #tm-cap-says' : '#st-drawer.open #tm-access, #st-drawer.open #tm-access-note';
    return navLandWhen(() => document.querySelector(sel));
  }
  if (n.k === 'stream'){
    if (typeof openSettingsAt !== 'function' || typeof settingsGoPage !== 'function') return false;
    openSettingsAt('company'); settingsGoPage('streams');
    const sel = `#set-page .st-sw-row[data-st-sw-pick="${String(n.fid).replace(/"/g, '')}"]`;
    return navLandWhen(() => {
      const row = document.querySelector(sel); if (!row) return null;
      if (row.getAttribute('aria-selected') !== 'true') row.click();         // the row's own press chooses it
      return document.querySelector(sel);
    });
  }
  if (n.k === 'std'){
    if (typeof caOpenStandards !== 'function') return false;
    caOpenStandards(n.book);
    if (!n.row) return true;
    /* a standard named in Jambo's own words: the row that says them */
    const re = NAV_STD_ROW_RE[n.row] || new RegExp(String(n.row).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split(/\s+/).slice(0, 3).join('.*'), 'i');
    return navLandWhen(() => {
      const host = document.querySelector('#ins-panel') || document.querySelector('.sd-ins'); if (!host) return null;
      const all = [...host.querySelectorAll('li, tr, dt, dd, p, [class*="row"]')].filter(x => re.test(x.textContent || ''));
      return all.find(x => !all.some(y => y !== x && x.contains(y))) || null;   // the innermost row that says it
    });
  }
  if (n.k === 'template'){
    if (typeof setView !== 'function') return false;
    setView('templates');
    /* a template named by its id (Jambo's door): its own card, chosen by its own press */
    if (n.id) return navLandWhen(() => {
      const b = [...document.querySelectorAll('[data-tpl-pf]')].find(x => String(x.getAttribute('data-tpl-pf')).endsWith(':' + n.id));
      if (!b) return null;
      if (b.getAttribute('aria-pressed') !== 'true') b.click();
      return [...document.querySelectorAll('[data-tpl-pf]')].find(x => String(x.getAttribute('data-tpl-pf')).endsWith(':' + n.id)) || b;
    }, _nvT('nav_no_template'));
    const re = NAV_TPL_RE[n.key];
    return navLandWhen(() => {
      const b = [...document.querySelectorAll('[data-tpl-pf]')].find(x => re.test((x.querySelector('b') || x).textContent || ''));
      if (!b) return null;
      if (b.getAttribute('aria-pressed') !== 'true') b.click();              // the card's own press chooses it
      return document.querySelector(`[data-tpl-pf="${b.getAttribute('data-tpl-pf').replace(/"/g, '\\"')}"]`) || b;
    }, _nvT('nav_no_template'));
  }
  return false;
}

/* ---------- STAGE 3 · A DUTY, A REQUEST, A PERSON ---------- */
const NAV_WORD_SKIP = new Set(['the', 'and', 'for', 'with', 'from', 'our', 'their', 'open', 'show', 'take', 'find', 'request', 'requests', 'duty', 'duties', 'obligation', 'obligations', 'new', 'a', 'an', 'to', 'of', 'me', 'my']);
const navWords = s => navNorm(s).trim().split(' ').filter(w => w.length >= 3 && !NAV_WORD_SKIP.has(w));
/* how many of a name's own words the sentence says (a plural or a short form counts: "ndas", "distributor") */
function navWordHits(t, name){
  let n = 0; for (const w of navWords(name)) if (t.includes(' ' + w + ' ') || t.includes(' ' + w + 's ') || (w.length > 5 && t.includes(' ' + w.slice(0, -1)))) n++;
  return n;
}
/* A DUTY BY ITS OWN WORDS ("the deposit payment to Kabras", "the quarterly stock count"), and the
   week's duties ("duties due this week") — the Obligations page's own rows and filter */
function navReadDuty(raw, t){
  if (/^ (when|what|how|why|is|does|did|who|which|när|vad|hur|varför) /.test(t) && !NAV_MOVE.test(t)) return null;   // a question about a duty is answered, never a trip
  if (/ (duties|obligations|åtaganden) /.test(t) && / (this week|due this week|den här veckan|denna vecka) /.test(t)) return { kind: 'go', place: 'nav', nav: { k: 'duties', due: '7' }, say: 'nav_go_duties_week' };
  let best = null, top = 0, tie = false;
  for (const c of navBook()) for (const o of (c.obligations || [])){
    if (!o || !o.desc || o.status === 'done') continue;
    const n = navWordHits(t, o.desc), need = Math.min(2, navWords(o.desc).length);
    if (n >= need && n > top){ best = { c, o }; top = n; tie = false; } else if (n >= need && n === top) tie = true;
  }
  if (!best || tie) return null;
  return { kind: 'go', place: 'nav', nav: { k: 'duty', cid: best.c.id, oid: best.o.id }, say: 'nav_go_duty', sayVars: { what: best.o.desc, ref: navRef(best.c) } };
}
/* A REQUEST BY ITS WORDS ("the request for a distributor NDA") — the Requests page's own row */
function navReadRequest(raw, t){
  if (!/ (request|requests|förfrågan|förfrågningar) /.test(t)) return null;
  if (navWords(raw).length === 0) return null;                              // "requests" alone is the place word's
  return { kind: 'go', place: 'nav', nav: { k: 'request', q: raw }, say: 'nav_go_request' };
}
/* A PERSON BY NAME ("Grace's profile", "find Grace Wanjiru", "who is Amina") — the People page's own row */
function navReadPerson(raw, t){
  if (!/ (profile|who is|find|vem är|hitta|contact|kontakt) /.test(t) && !/^ \S+ \S+ $/.test(t)) return null;
  if (NAV_CONTRACT_WORDS.test(t) || / (limit|access|signing) /.test(t)) return null;
  const U = navUsersIn(t); if (!U.length) return null;
  if (U.length > 1) return navWhich(U.map(u => ({ label: u.name || u.email, nav: { k: 'personrow', id: u.id } })));
  return { kind: 'go', place: 'nav', nav: { k: 'personrow', id: U[0].id }, say: 'nav_go_person', sayVars: { name: U[0].name || '' } };
}
function navGoStage3(n){
  if (n.k === 'duties'){ if (typeof obwGoFiltered !== 'function') return false; obwGoFiltered({ due: n.due }); return true; }
  if (n.k === 'duty'){
    if (typeof obwGoFiltered !== 'function') return false;
    const key = n.cid + '::' + n.oid;
    if (typeof insSelect === 'function') insSelect('obligations', key);
    obwGoFiltered({ state: 'all' });
    const q = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(key) : key;
    return navLandWhen(() => document.querySelector(`[data-ob-key="${q}"]`) || document.querySelector(`[data-obw-key="${q}"]`));
  }
  if (n.k === 'request'){
    if (typeof setView !== 'function' || typeof intakeGoTo !== 'function') return false;
    setView('intake');
    let tries = 0; _navLanding = true;
    const pick = () => {
      const list = (typeof intakeQueue === 'function') ? (intakeQueue() || []) : [];
      if (!list.length && ++tries < NAV_LAND_TRIES) { setTimeout(pick, NAV_LAND_BEAT_MS); return; }
      const t = navNorm(n.q);
      const scored = list.map(r => ({ r, n: navWordHits(t, [r.title, r.counterparty].filter(Boolean).join(' ')) })).filter(x => x.n).sort((a, b) => b.n - a.n);
      if (!scored.length || (scored[1] && scored[1].n === scored[0].n)){ _navLanding = false; navSayLate(_nvT(scored.length ? 'nav_which' : 'nav_no_request')); return; }
      const id = scored[0].r.id;
      intakeGoTo(id);
      navLandWhen(() => document.querySelector(`tr[data-ik-row="${String(id).replace(/"/g, '')}"]`));
    };
    setTimeout(pick, 0);
    return true;
  }
  if (n.k === 'requestid'){
    if (typeof setView !== 'function' || typeof intakeGoTo !== 'function') return false;
    intakeGoTo(n.id);
    return navLandWhen(() => document.querySelector(`tr[data-ik-row="${String(n.id).replace(/"/g, '')}"]`), _nvT('nav_no_request'));
  }
  if (n.k === 'personrow'){ if (typeof dirOpenPerson !== 'function') return false; dirOpenPerson(n.id); return true; }
  return false;
}

/* ---------- STAGE 4 · SAID PLAINLY WHEN IT IS NOT THERE ---------- */
/* a name asked for that nothing in the reader's book carries: "open the Tesla contract", "Zawadi's
   folder" — said, never a silent nothing and never a guess (a code-named deal is not in navBook, so
   its real name is never confirmed) */
function navUnknownNames(raw){
  const known = navNorm(navBook().map(c => [c.name, c.counterparty, c.contractNo, c.id].join(' ')).join(' ') + ' '
    + Object.values((typeof FOLDERS === 'object' && FOLDERS) || {}).map(f => (f && f.name) || '').join(' ')
    + ' ' + (((typeof getUsers === 'function' && getUsers()) || []).map(u => u.name || '').join(' ')));
  const caps = String(raw || '').replace(/[’']s\b/g, '').split(/[^\p{L}\p{N}-]+/u)
    .filter(w => w && /^\p{Lu}/u.test(w) && !/^(NDA|MK|HaTi|Jambo|I)$/.test(w) && !NAV_WORD_SKIP.has(w.toLowerCase()) && !NAV_LEAD.test(' ' + w.toLowerCase() + ' '));
  return caps.filter(w => !known.includes(' ' + w.toLowerCase() + ' ') && !known.includes(' ' + w.toLowerCase()));
}
function navReadNone(raw, t){
  const folder = NAV_FOLDER_WORDS.test(t), contract = NAV_CONTRACT_WORDS.test(t) && !/ (contracts|agreements|deals|avtalen) /.test(t);
  if (!folder && !contract) return null;
  const unknown = navUnknownNames(raw); if (unknown.length !== 1) return null;
  const name = unknown[0];
  return { kind: 'navsay', text: _nvT(folder ? 'nav_no_party' : 'nav_no_contract', { name }) };
}

/* ---------- COMPARE A CONTRACT WITH ITS ORIGINAL (owner, 22 Oct 2026: "The screen you shared is perfect as
   the answer for comparison") ---------- */
/* "show me the differences in the original contract compared to the current approved contract", "what changed
   in the Kabras deal since the original", "jämför MK-A1 med originalet": the contract's own Compare versions
   screen (openCompareModal), opened from its first version to the current wording. Read before every
   question guard: a "what changed …" is this screen's, not a chart's and not the model's. */
const NAV_COMPARE_WORDS = / (differences?|diff|what changed|what has changed|what s changed|changes since|changed since|compared? (to|with|against)|compare|comparison|versus|vs|skillnad|skillnader|skillnaderna|vad har ändrats|ändrats sedan|jämför|jämfört med) /;
const NAV_COMPARE_SIDES = / (original|originalet|originalversionen|first version|first draft|current|latest|approved|signed|now|version|versions|ursprungliga|första versionen|nuvarande|aktuella|godkända) /;
function navReadCompare(raw, t){
  if (!NAV_COMPARE_WORDS.test(t) || !NAV_COMPARE_SIDES.test(t)) return null;
  if (/ (contracts|agreements|deals|avtalen) /.test(t)) return null;          // two or more contracts: not one contract's versions
  if (/ (week|month|quarter|year|vecka|veckan|månad|månaden|kvartal|kvartalet|år|året|today|yesterday|idag|igår) /.test(t)) return null;   // a span of time is a timeline's (Explorer's "what changed since the start of the year")
  let rest = raw.replace(/\b(show me|take me to|open|the|differences?|diff|what|has|changed|changes|since|compared?|comparison|to|with|against|between|versus|vs|in|of|and|original|first|version|versions|draft|start|current|latest|approved|signed|now|contract|agreement|deal|one|its|jämför|jämfört|med|skillnad\w*|vad|har|ändrats|sedan|originalet|ursprungliga|nuvarande|aktuella|godkända|i|mellan)\b/ig, ' ').replace(/[?.!]/g, ' ').replace(/\s+/g, ' ').trim();
  let c = null;
  if (rest){
    let hit = null; try { hit = (typeof caContractOf === 'function') ? caContractOf(rest) : null; } catch (_){ hit = null; }
    if (!hit || hit.miss || (!hit.c && !hit.picks)) hit = navContractByName(rest, { loose: true });
    if (hit && hit.picks && hit.picks.length > 1) return navWhich(hit.picks.map(x => ({ c: x, nav: { k: 'compare', cid: x.id } })));
    c = hit && hit.c ? hit.c : null;
    /* "the current Kabras contract": a party named, and its one contract (several are offered) */
    if (!c){
      const P = navPartiesIn(navNorm(rest));
      if (P.length === 1){
        const own = navBook().filter(x => ((typeof cuKeyOf === 'function') ? cuKeyOf(x.counterparty) : String(x.counterparty || '').toLowerCase()) === P[0].key);
        if (own.length > 1) return navWhich(own.map(x => ({ c: x, nav: { k: 'compare', cid: x.id } })));
        c = own[0] || null;
      }
    }
  }
  if (!c){ try { c = (typeof pdContract === 'function') ? pdContract() : null; } catch (_){ c = null; } }
  if (!c) return { kind: 'navsay', text: _nvT('nav_compare_which') };
  return { kind: 'go', place: 'nav', nav: { k: 'compare', cid: c.id }, say: 'nav_go_compare', sayVars: { ref: navRef(c), name: c.name || '' } };
}
/* the contract on Home's paper, then its own Compare versions screen, set from its first version to the
   current wording (the screen's own pickers; nothing filed, nothing snapshotted) */
function navGoCompare(n){
  const c0 = (typeof getContract === 'function') ? getContract(n.cid) : null; if (!c0 || typeof openCompareModal !== 'function') return false;
  _navLanding = true;
  if (typeof pdOpenOnHome === 'function') pdOpenOnHome(c0.id, 'copilot');
  const open = () => {
    const c = getContract(n.cid) || c0;
    try { openCompareModal(c); } catch (_){ _navLanding = false; return; }
    try {
      const a = document.getElementById('cmp-a'), b = document.getElementById('cmp-b'), go = document.getElementById('cmp-go');
      if (a && b && go){
        const cur = _nvT('ve_current_live');
        const ib = [...b.options].findIndex(o => o.textContent.trim() === cur);
        a.value = '0'; if (ib > 0) b.value = String(ib);
        go.click();
      }
    } catch (_){}
    setTimeout(() => { _navLanding = false; }, 300);
  };
  if (typeof ensureFull === 'function') Promise.resolve(ensureFull(c0)).then(open, open); else open();
  return true;
}

/* ---------- EVERY DOOR AS A TOOL (Jambo works like Copilot, stage 2, 22 Oct 2026) ----------
   The exact thing Jambo named (goto.door, checked on the server by aiDoorOf) turned into the move this
   file already makes (navGo): the same doors, the same landings, the same "not there" lines. The book
   is asked again here: a contract this browser does not hold is no door (null), never a guess. */
function navDoorOf(d){
  if (!d || typeof d !== 'object') return null;
  const book = navBook(), want = String(d.contractId || '').trim().toUpperCase();
  const byId = () => book.find(c => String(c.id).toUpperCase() === want || String(c.contractNo || '').toUpperCase() === want) || null;
  const go = (nav, say, sayVars, cid) => ({ kind: 'go', place: 'nav', nav, say, sayVars: sayVars || {}, ...(cid ? { cid } : {}) });
  const cKey = n => (typeof cuKeyOf === 'function') ? cuKeyOf(n) : String(n || '').trim().replace(/\s+/g, ' ').toLowerCase();
  if (d.kind === 'contract' || d.kind === 'clause' || d.kind === 'obligation'){
    const c = byId(); if (!c) return null;
    const v = { ref: navRef(c), name: c.name || '' };
    if (d.kind === 'obligation') return go({ k: 'duty', cid: c.id, oid: d.obligationId }, 'nav_go_duty', { what: ((c.obligations || []).find(o => o && String(o.id) === String(d.obligationId)) || {}).desc || '', ref: v.ref });
    if (d.kind === 'clause'){
      const words = d.head ? [navNorm(d.head).trim()].filter(Boolean) : null;
      return go({ k: 'clause', cid: c.id, num: d.num || null, quote: d.quote || null, head: d.head || null, topic: words ? words[0] : null, words }, d.num ? 'nav_go_clause' : 'nav_go_clause_topic',
        { n: d.num || '', topic: d.head || '', ...v }, c.id);
    }
    if (d.tab === 'compare') return go({ k: 'compare', cid: c.id }, 'nav_go_compare', v, c.id);
    const act = (NAV_ACTS.some(([k]) => k === d.tab) || ['sign', 'redlines', 'brief'].includes(d.tab)) ? d.tab : 'open';
    if (act === 'amend'){ let shut = ''; try { shut = (typeof amendmentShutWhy === 'function') ? amendmentShutWhy(c) : ''; } catch (_){ shut = ''; } if (shut) return { kind: 'navsay', text: shut }; }
    return go({ k: 'cact', cid: c.id, act }, 'nav_go_act_' + act, v, c.id);
  }
  if (d.kind === 'contracts'){
    const stream = d.stream ? (navStreamWords().find(x => x.fid === d.stream) || { fid: d.stream, name: d.stream }) : null;
    const party = d.party ? (navParties().find(p => p.key === cKey(d.party)) || { key: cKey(d.party), name: d.party }) : null;
    const f = { stage: d.stage || null, stream: stream ? stream.fid : null, ending: d.ending || null, party: party ? party.key : null };
    const span = f.ending ? navEndingSpan(f.ending) : null, only = Array.isArray(d.ids) && d.ids.length ? new Set(d.ids) : null;
    const ids = book.filter(c => {
      if (only && !only.has(c.id)) return false;
      if (f.stage && c.status !== f.stage) return false;
      if (f.stream && c.folder !== f.stream) return false;
      if (f.party && cKey(c.counterparty) !== f.party) return false;
      if (span){
        if (c.parentId) return false;
        let e = ''; try { e = (typeof effectiveExpiry === 'function' && effectiveExpiry(c)) || c.expiry || ''; } catch (_){ e = c.expiry || ''; }
        e = String(e || '').slice(0, 10); if (!(e >= span.from && e <= span.to)) return false;
      }
      return true;
    }).map(c => c.id);
    const label = navContractsLabel(f, stream, party);
    return go({ k: 'contracts', ids, label, f }, ids.length ? 'nav_go_contracts' : 'nav_go_contracts_none', { n: ids.length, what: label });
  }
  if (d.kind === 'party'){
    const key = cKey(d.name), p = navParties().find(x => x.key === key);
    return p ? go({ k: 'party', key: p.key, name: p.name }, 'nav_go_party', { name: p.name }) : null;
  }
  if (d.kind === 'you') return go(Object.assign({ k: 'you', key: d.key }, (d.key === 'safety' || d.key === 'password') ? { card: 'safety' } : {}), 'nav_go_you');
  if (d.kind === 'company'){
    if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
    const page = ['team', 'streams', 'sheet', 'roles'].includes(d.key);
    return go({ k: 'company', kind: page ? 'page' : 'panel', key: d.key }, 'nav_go_setting');
  }
  if (d.kind === 'person'){
    let U = []; try { U = (typeof getUsers === 'function' && getUsers()) || []; } catch (_){ U = []; }
    const u = U.find(x => String(x.id) === String(d.userId)); if (!u) return null;
    if (d.row === 'cap' || d.row === 'access'){
      if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
      return go({ k: 'person', id: d.userId, row: d.row }, d.row === 'cap' ? 'nav_go_cap' : 'nav_go_access', { name: u.name || '' });
    }
    return go({ k: 'personrow', id: d.userId }, 'nav_go_person', { name: u.name || '' });
  }
  if (d.kind === 'stream'){
    if (!navIsAdmin()) return { kind: 'navsay', text: _nvT(NAV_ADMIN_SAYS) };
    const st = navStreamWords().find(x => x.fid === d.streamId);
    return go({ k: 'stream', fid: d.streamId, keep: !!d.keep }, d.keep ? 'nav_go_keep' : 'nav_go_stream', { stream: st ? st.name : d.streamId });
  }
  if (d.kind === 'standard') return go({ k: 'std', book: d.book || '_default', row: d.row || null }, 'nav_go_std');
  if (d.kind === 'template') return go({ k: 'template', id: d.templateId }, 'nav_go_template');
  if (d.kind === 'request') return go({ k: 'requestid', id: d.requestId }, 'nav_go_request');
  if (d.kind === 'duties') return d.due === '7' ? go({ k: 'duties', due: '7' }, 'nav_go_duties_week') : { kind: 'go', place: 'oblig' };
  return null;
}

Object.assign(window, { navDoorOf, navLeftover, navNorm, navBook, navStreamWords, navStreamOf, navStageOf, navEndingOf, navEndingSpan, navParties, navPartiesIn,
  navClauseTopicOf, navRead, navReadClause, navClauseCount, navReadContracts, navContractsLabel, navReadParty, navWhich, navGo, navGoClause,
  navContractByName, navLanding, NAV_PAGES, navReadPage, NAV_ACTS, NAV_ACT_OWN, navReadContractAct, navGoAct, navClauseEl, navClauseRow, navPaperMarked, NAV_PAPER_TRIES, navSayLate, navChoicePress, NAV_STREAM_EXTRA, NAV_CLAUSE_TOPICS, NAV_LAND_TRIES,
  NAV_YOU, NAV_COMPANY, navReadSettings, navReadStandards, navUsersIn, navLandWhen, navGoStage2, NAV_STD_BOOKS, NAV_STD_ROWS,
  navReadDuty, navReadRequest, navReadPerson, navGoStage3, navWords, navWordHits, navReadNone, navUnknownNames, NAV_HOLD_BEATS,
  navReadCompare, navGoCompare, NAV_COMPARE_WORDS, NAV_COMPARE_SIDES });
