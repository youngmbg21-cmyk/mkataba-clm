/* ============================================================
   JAMBO THE INSTRUCTOR — ROUND 1: "I'M NEW"
   (owner, 23 Nov 2026: "someone should simply say I am new and that how
   jambo knows"; the plan, end to end: docs/PLAN-jambo-instructor.md)
   ============================================================
   THE PERSON SAYS SO; JAMBO NEVER GUESSES. Typed in any Jambo box, "I'm
   new" (or "teach me", "show me around", "jag är ny"…) turns teaching ON for
   that person; "I know my way now" turns it OFF. It is their own preference
   (prefs.teach, PUT /api/me/prefs), so it follows them to every computer and
   phone and nobody else ever sees it.

   WHAT HE SAYS COSTS NOTHING. The welcome is HaTi's own words, never a model
   call: what HaTi is for in one breath, then three or four first steps that
   fit what this person may do (an editor uploads and drafts, a Viewer reads,
   an admin also adds the team). Each step is a chip that opens its Handbook
   chapter, the one book that is checked against the app (THE ONE DOOR: no
   second manual).

   THE WHOLE SENTENCE IS READ, NEVER A WORD IN IT. "I'm new to this NDA with
   Volvo" is a question about a contract, not a request to be taught, so a
   sentence counts only when nothing is left once greetings ("hi Jambo") and
   courtesy ("please", "thanks") are set aside.

   THE HINT. For a person's first TEACH_HINT_DAYS days, while they have said
   neither, the grey words in Jambo's empty box read "New here? Say "I'm new""
   (teachPh). No band, no banner: the box's own example words.

   ONE READER, EVERY BOX. Home's box (intelAsk), the shared door
   (caAskAnywhere), the conversation behind every other box (aiAskWords) and
   the Calendar's box (calBoxAsk) ask teachRead FIRST, before any reader that
   could take "new" for a new agreement. The answer is one turn of the one
   conversation (teachTurn). Reading never writes: teachRead and teachTurn
   only read; teachSay writes the preference and returns the turn.
   ============================================================ */

/* how long a new account sees the hint in the box (owner, 23 Nov 2026: "first few days") */
const TEACH_HINT_DAYS = 14;
const TEACH_STATES = ['on', 'off'];

/* the first steps offered, by what the person may do: [label key, Handbook chapter] (the first is the lead) */
const TEACH_STEPS = {
  editor: [['teach_c_upload', '2.2'], ['teach_c_new', '2.1'], ['teach_c_find', '0.6'], ['teach_c_board', '0.1']],
  viewer: [['teach_c_find', '0.6'], ['teach_c_read', '0.4'], ['teach_c_board', '0.1']],
  admin: [['teach_c_upload', '2.2'], ['teach_c_new', '2.1'], ['teach_c_find', '0.6'], ['teach_c_team', '7.1']],
};

const _thT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
const _thE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/* the sentence, lower case, curly apostrophes made plain, punctuation gone; greetings and courtesy set aside */
const TEACH_LEAD = /^(?:(?:hi|hello|hey|hiya|jambo|hej|hejsan|hallå|ok|okay|so|well|um|erm|please|snälla)\s+)+/;
const TEACH_TAIL = /(?:\s+(?:please|thanks|thank you|jambo|snälla|tack))+$/;
function teachNorm(q){
  let t = String(q || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 3; i++){ const w = t; t = t.replace(TEACH_LEAD, '').replace(TEACH_TAIL, '').trim(); if (w === t) break; }
  return t;
}
const TEACH_ON_RE = new RegExp('^(?:' + [
  /* "I'm new", "I am new here", "I'm a new user", "I'm new to HaTi" */
  "(?:i'?m|i am|im) (?:a |quite |totally |brand )?new(?: (?:here|user|member|person|starter|joiner|to hati|to this|to the app|on hati|at this))*",
  "new (?:here|user|to hati)",
  /* "teach me", "show me around", "where do I start" */
  "teach me(?: (?:hati|how hati works|how this works|how to use hati|the ropes|the basics))?",
  "show me (?:around|the ropes|the basics|how hati works|how this works)",
  "give me a tour|take me on a tour|a tour please|tour",
  "(?:where|how) do i (?:start|begin|get started)",
  "(?:getting|get me) started|help me get started|how to get started",
  "(?:it'?s )?my first (?:day|time)(?: (?:here|using hati|on hati|with hati))?|first time (?:here|using hati|on hati)",
  "i (?:have|'ve) never used (?:hati|this) before|i don'?t know how (?:to use )?(?:hati|this) works?",
  /* svenska */
  "jag är (?:helt )?ny(?: (?:här|användare|på hati|i hati))?",
  "ny här|lär mig(?: hati)?|visa mig runt|var börjar jag|hur börjar jag|hur kommer jag igång|min första dag(?: här)?",
].join('|') + ')$');
const TEACH_OFF_RE = new RegExp('^(?:' + [
  "i know my way(?: around)?(?: now)?",
  "(?:i'?m|i am|im) not new(?: any ?more)?",
  "stop (?:teaching|the lessons|lessons|the tour|showing me around)(?: me)?",
  "no more (?:lessons|teaching|tips|tours)",
  "i'?ve got (?:it|this)(?: now)?|i got (?:it|this) now",
  /* svenska */
  "jag hittar(?: själv)?(?: nu)?|jag är inte ny(?: längre)?|sluta lära mig|inga fler lektioner",
].join('|') + ')$');

/* 'on' · 'off' · null: what the sentence asks, read whole */
function teachRead(q){
  const t = teachNorm(q); if (!t || t.length > 80) return null;
  if (TEACH_OFF_RE.test(t)) return 'off';
  if (TEACH_ON_RE.test(t)) return 'on';
  return null;
}

function _thUser(){ try { return (typeof currentUser === 'function') ? currentUser() : null; } catch (_){ return null; } }
/* this person's answer: 'on', 'off', or '' (never said) */
function teachState(u){
  const me = u || _thUser(); const v = me && me.prefs && me.prefs.teach;
  return TEACH_STATES.includes(v) ? v : '';
}
function teachOn(u){ return teachState(u) === 'on'; }
/* what the person may do, for the first steps: admin · editor · viewer (mayActOn, never the role read by hand) */
function teachSeat(u){
  const me = u || _thUser(); if (!me) return 'editor';
  if (me.role === 'admin') return 'admin';
  /* the app's one question (mayActOn); a host without it (the server, a test) reads the account's own seat */
  try { if (typeof mayActOn === 'function') return mayActOn(null, me) ? 'editor' : 'viewer'; } catch (_){}
  return me.role === 'viewer' ? 'viewer' : 'editor';
}
/* each first step WALKS the person through its chapter (round 2), one step at a time; the chapter is one press from it */
function teachChoices(u){
  return (TEACH_STEPS[teachSeat(u)] || TEACH_STEPS.editor)
    .map(([k, ch], i) => Object.assign({ label: _thT(k), teach: 'walk', k: ch }, i === 0 ? { lead: true } : {}));
}
/* the turn, as HTML for either host's feed; reads only */
function teachTurn(q, u){
  const ask = teachRead(q); if (!ask) return null;
  if (ask === 'off') return { ask, html: `<div>${_thE(_thT('teach_off'))}</div>`, read: { cid: null, page: '', text: '' } };
  const seat = teachSeat(u);
  const lines = [_thT('teach_hello'), _thT(seat === 'viewer' ? 'teach_what_viewer' : 'teach_what'), _thT('teach_pick'), _thT('teach_how_off')];
  /* the line under it says where it came from: the Handbook, never "Read from the Board" (jamboReadStamp keeps a read it finds) */
  return { ask, html: lines.map(l => `<div style="margin-bottom:8px">${_thE(l)}</div>`).join(''), choices: teachChoices(u), read: { cid: null, page: '', text: _thT('jov5_hbk_src') } };
}
/* the person's answer kept on their own preferences (stPrefSet: the server when there is one, else this browser) */
function teachSet(v){
  if (!TEACH_STATES.includes(v)) return Promise.resolve(false);
  const u = _thUser(); if (!u || teachState(u) === v) return Promise.resolve(true);
  if (typeof stPrefSet === 'function') return Promise.resolve(stPrefSet('teach', v)).then(ok => { teachHintSweep(); return ok; });
  u.prefs = Object.assign({}, u.prefs || {}, { teach: v }); teachHintSweep();
  return Promise.resolve(true);
}
/* the one writer the boxes call: keeps the answer, gives back the turn to draw */
function teachSay(q){
  const turn = teachTurn(q);
  if (turn){ try { teachSet(turn.ask); } catch (_){} return turn; }
  /* HaTi's own words ("what is a dossier?"), free for everyone; "what can I do here?" while teaching is on */
  const w = teachWordTurn(q) || (teachOn() && teachHereAsked(q) ? teachHereTurn() : null) || teachHowTurn(teachHowOf(q));
  if (w){ try { teachDid('ask'); } catch (_){} }
  return w;
}
/* does the sentence belong to the instructor? (the boxes ask this before any other reader) */
function teachTakes(q){ return !!(teachRead(q) || teachWordOf(q) || (teachOn() && teachHereAsked(q)) || teachHowOf(q)); }

/* THE HINT: a person's first days, while they have said neither */
function teachHintOn(u){
  if (typeof window !== 'undefined' && window.PORTAL_MODE) return false;
  const me = u || _thUser(); if (!me || teachState(me)) return false;
  const at = Date.parse(String(me.createdAt || '')); if (!isFinite(at)) return false;
  return (Date.now() - at) < TEACH_HINT_DAYS * 86400000;
}
function teachPh(ph){ return teachHintOn() ? _thT('teach_hint_ph') : ph; }
/* once said, the hint leaves every box already drawn (the boxes draw their words once) */
function teachHintSweep(){
  if (typeof document === 'undefined' || teachHintOn()) return;
  const hint = _thT('teach_hint_ph');
  document.querySelectorAll('textarea[placeholder], input[placeholder]').forEach(el => {
    if (el.getAttribute('placeholder') !== hint) return;
    const back = el.id === 'igd-input' && typeof igAskPlaceholder === 'function' ? igAskPlaceholder()
      : el.id === 'jl-q' && typeof jlPagePh === 'function' ? jlPagePh() : _thT('jl_ph_any');
    el.setAttribute('placeholder', back); if (el.getAttribute('aria-label') === hint) el.setAttribute('aria-label', back);
  });
}

/* ============================================================
   ROUNDS 2–6 (owner, 23 Nov 2026: "Do what is necessary for a user to have a seamless transition into using
   Hati so do what it takes. No need for admin switch")
   ============================================================ */
const _thLang = () => { try { return (typeof langId === 'function' && langId() === 'sv') ? 'sv' : 'en'; } catch (_){ return 'en'; } };
const _thW = v => v == null ? '' : typeof v === 'string' ? v : String((v[_thLang()] != null ? v[_thLang()] : v.en) || '');
const _thRead = () => ({ cid: null, page: '', text: _thT('jov5_hbk_src') });
const _thLines = lines => lines.filter(Boolean).map((l, i) => `<div style="margin-bottom:8px">${i === 0 && l.b ? `<strong>${_thE(l.b)}</strong>${l.t ? ' · ' + _thE(l.t) : ''}` : _thE(l.t != null ? l.t : l)}</div>`).join('');

/* ---------- ROUND 6 · HaTi'S OWN WORDS, IN PLAIN WORDS (free, for everyone) ----------
   "What is a dossier?" is answered here, never guessed by the model: one sentence a word, the chapter it lives in
   one press away. Only these words; a sentence about a contract ("what is the stream of MK-4") is not one. */
const TEACH_WORDS = [
  { k: 'board', ch: '0.1', n: { en: ['board', 'the board'], sv: ['tavla', 'tavlan'] },
    say: { en: 'The Board is the page you land on: what needs you, the figures for your contracts, and the work Jambo prepared for you.', sv: 'Tavlan är sidan du landar på: det som behöver dig, siffrorna för era avtal och arbetet Jambo förberett åt dig.' } },
  { k: 'dossier', ch: '0.4', n: { en: ['dossier'], sv: ['akt', 'akten', 'dossier', 'dossiern'] },
    say: { en: "A contract's Dossier is its card beside the paper: where it stands, its key facts, what it still owes and the next step.", sv: 'Ett avtals akt är dess kort bredvid pappret: var det står, dess viktigaste uppgifter, vad som fortfarande saknas och nästa steg.' } },
  { k: 'redlines', ch: '3.1', n: { en: ['redlines', 'redline', 'redlining', 'tracked changes'], sv: ['markeringar', 'markering', 'spårade ändringar'] },
    say: { en: "Redlines are the tracked changes on a contract, yours and the other side's. Each one is accepted, rejected or countered until the wording is agreed.", sv: 'Markeringar är de spårade ändringarna i ett avtal, dina och motpartens. Varje ändring godtas, avvisas eller möts med ett motförslag tills texten är överenskommen.' } },
  { k: 'playbook', ch: '2.5', n: { en: ['playbook', 'the playbook', 'position', 'positions'], sv: ['spelbok', 'spelboken', 'position', 'positioner'] },
    say: { en: "The Playbook is your company's position on each clause: what you must have, what you push for, and what you never accept. HaTi checks each contract against it.", sv: 'Spelboken är företagets hållning för varje klausul: vad ni måste ha, vad ni driver och vad ni aldrig godtar. HaTi kontrollerar varje avtal mot den.' } },
  { k: 'stream', ch: '7.2', n: { en: ['stream', 'streams', 'value stream', 'contract stream'], sv: ['ström', 'strömmar', 'strömmen', 'avtalsström'] },
    say: { en: 'A stream is a group of contracts, usually by team or business area. Who can see a contract depends on its stream.', sv: 'En ström är en grupp avtal, oftast per team eller affärsområde. Vem som ser ett avtal beror på dess ström.' } },
  { k: 'needs', ch: '0.3', n: { en: ['needs you', 'needs me'], sv: ['behöver dig', 'behöver mig'] },
    say: { en: 'Needs you is the list of work waiting on you: something to approve, answer, fill in or sign. The number on it always matches the list.', sv: 'Behöver dig är listan över arbete som väntar på dig: något att godkänna, besvara, fylla i eller signera. Siffran stämmer alltid med listan.' } },
  { k: 'oblig', ch: '5.1', n: { en: ['obligations', 'obligation', 'duties', 'duty'], sv: ['åtaganden', 'åtagande'] },
    say: { en: 'Duties are what each side promised to do under a contract, with their due dates. HaTi reminds the right person before each one is due.', sv: 'Åtaganden är det varje sida lovat att göra enligt ett avtal, med förfallodagar. HaTi påminner rätt person innan något förfaller.' } },
  { k: 'ourpaper', ch: '2.4', n: { en: ['our paper', 'template', 'templates'], sv: ['vårt papper', 'mall', 'mallar'] },
    say: { en: "Our paper means your company's own templates. A new agreement started from one already has your wording.", sv: 'Vårt papper är företagets egna mallar. Ett nytt avtal som startas från en mall har redan er text.' } },
  { k: 'theirpaper', ch: '2.1', n: { en: ['their paper'], sv: ['deras papper'] },
    say: { en: 'Their paper is a contract the other side wrote and sent you. You upload it, and Jambo reads it against your Playbook.', sv: 'Deras papper är ett avtal som motparten skrivit och skickat till dig. Du laddar upp det och Jambo läser det mot er spelbok.' } },
  { k: 'explorer', ch: '6.2', n: { en: ['explorer', 'the map'], sv: ['utforskaren', 'kartan'] },
    say: { en: 'Explorer is a map of all your contracts: how they connect, grouped by party, stream or date.', sv: 'Utforskaren är en karta över alla era avtal: hur de hänger ihop, grupperade efter part, ström eller datum.' } },
  { k: 'discover', ch: '5.5', n: { en: ['discover'], sv: ['upptäck'] },
    say: { en: 'Discover asks one question of many contracts at once, for example "which contracts can we end early?", and puts the answers in a table.', sv: 'Upptäck ställer en fråga till många avtal på en gång, till exempel "vilka avtal kan vi säga upp i förtid?", och samlar svaren i en tabell.' } },
  { k: 'approvals', ch: '4.1', n: { en: ['approvals', 'approval'], sv: ['godkännanden', 'godkännande'] },
    say: { en: "An approval is a colleague's yes that your company needs before a contract can be signed.", sv: 'Ett godkännande är en kollegas ja som företaget behöver innan ett avtal kan signeras.' } },
  { k: 'executed', ch: '4.5', n: { en: ['executed', 'signed contract', 'sealed'], sv: ['undertecknat', 'verkställt', 'förseglat'] },
    say: { en: 'Executed means signed by everyone. Its wording is then sealed and cannot change; a change after that is an amendment.', sv: 'Undertecknat betyder signerat av alla. Texten förseglas då och kan inte ändras; en ändring efter det är ett tillägg.' } },
  { k: 'counterparty', ch: '5.4', n: { en: ['counterparty', 'the other side', 'party', 'parties'], sv: ['motpart', 'motparten', 'part', 'parter'] },
    say: { en: 'The counterparty is the other side: the company you are making the agreement with.', sv: 'Motparten är den andra sidan: företaget ni ingår avtalet med.' } },
  { k: 'amendment', ch: '5.3', n: { en: ['amendment', 'amendments'], sv: ['tillägg', 'ändringsavtal'] },
    say: { en: 'An amendment changes a contract that is already signed, as a new paper beside it; the signed paper itself never changes.', sv: 'Ett tillägg ändrar ett avtal som redan är signerat, som ett nytt papper bredvid det; det signerade pappret ändras aldrig.' } },
  { k: 'jambo', ch: '0.2', n: { en: ['jambo'], sv: ['jambo'] },
    say: { en: "Jambo is HaTi's assistant: he reads your contracts, answers questions, prepares work and takes you to the right page. A person always presses the button.", sv: 'Jambo är HaTis assistent: han läser era avtal, svarar på frågor, förbereder arbete och tar dig till rätt sida. En människa trycker alltid på knappen.' } },
  { k: 'handbook', ch: 'about', n: { en: ['handbook', 'the handbook', 'manual'], sv: ['handboken', 'handbok'] },
    say: { en: "The Handbook is HaTi's instruction book: one chapter for each thing you can do, with numbered steps and pictures.", sv: 'Handboken är HaTis instruktionsbok: ett kapitel för varje sak du kan göra, med numrerade steg och bilder.' } },
];
const TEACH_WORD_ASK = /^(?:what(?:'s| is| are)|whats|what does|what do|define|explain|meaning of|the meaning of|vad är|vad betyder|vad menas med|förklara)\s+(?:a |an |the |en |ett |det |den )?(.+?)(?:\s+(?:mean|means|in hati|i hati|betyder))?$/;
function teachWordOf(q){
  const m = TEACH_WORD_ASK.exec(teachNorm(q)); if (!m) return null;
  const w = m[1].replace(/'s$/, '').trim();
  return TEACH_WORDS.find(x => [].concat(x.n.en, x.n.sv).includes(w)) || null;
}
function teachWordTurn(q){
  const W = teachWordOf(q); if (!W) return null;
  const choices = [];
  if (W.ch !== 'about' && teachOn() && teachWalkSteps(teachChapter(W.ch)).length) choices.push({ label: _thT('teach_walk'), teach: 'walk', k: W.ch, lead: true });
  choices.push({ label: _thT('teach_read'), nav: { k: 'chapter', chapter: W.ch } });
  return { ask: 'word', html: _thLines([_thW(W.say)]), choices, read: _thRead() };
}

/* ---------- ROUND 3 · "WHAT CAN I DO HERE?" (free; while teaching is on) ----------
   The page in front (aiPageContext) and the chapters that cover it (hbkChaptersForPage) — the same reading Jambo is
   given for this question — said in plain words, each a walk one press away. */
const TEACH_HERE_RE = /^(?:what can i do (?:here|on this page)|what is this page|what's this page|whats this page|what does this page do|where am i|what am i looking at|help|help me|vad kan jag göra här|vad är det här för sida|vad gör den här sidan|var är jag|hjälp|hjälp mig)$/;
function teachHereAsked(q){ return TEACH_HERE_RE.test(teachNorm(q)); }
function teachHereChapters(){
  let p = null; try { p = (typeof aiPageContext === 'function') ? aiPageContext() : null; } catch (_){ p = null; }
  let chs = []; try { chs = (p && typeof hbkChaptersForPage === 'function') ? hbkChaptersForPage(p.view, p.face || '') : []; } catch (_){ chs = []; }
  return { name: (p && (p.name || p.label)) || '', chs: chs.slice(0, 3) };
}
function teachHereTurn(){
  const H = teachHereChapters();
  if (!H.chs.length) return { ask: 'here', html: _thLines([_thT('teach_here_none')]), choices: [{ label: _thT('teach_read'), nav: { k: 'chapter', chapter: 'about' } }], read: _thRead() };
  const first = s => { const t = String(s || '').replace(/\s+/g, ' ').trim(); const m = /^(.{20,220}?[.!?])(\s|$)/.exec(t); return m ? m[1] : t.slice(0, 220); };
  const lines = [H.name ? _thT('teach_here_on', { page: H.name }) : _thT('teach_here_head')]
    .concat(H.chs.map(c => '• ' + teachPlain(c.title) + ': ' + first(teachPlain(c.what))));
  const choices = H.chs.filter(c => teachWalkSteps(c).length).map((c, i) => Object.assign({ label: _thT('teach_walk_t', { t: teachPlain(c.title) }).slice(0, 70), teach: 'walk', k: c.k }, i === 0 ? { lead: true } : {}));
  return { ask: 'here', html: _thLines(lines), choices, read: _thRead() };
}

/* ---------- ROUND 2 · WALK ME THROUGH IT ----------
   ONE STEP AT A TIME from the chapter's own numbered steps — no second manual. The thing the step is about is the
   thing the chapter's own picture boxes on that step (`shots[].boxes[].sel`), so the book and the walk can never
   point at different buttons. Found on the screen, it is OUTLINED (the owner's yes, 23 Nov 2026: the one exception
   to "a page you land on shows no light", while walking only), and pressing it moves the walk on by itself.
   Not on the screen: "Take me there" moves to the page the picture was taken on, through the one mover (caGo).
   Jambo never presses anything. */
let _walk = null;
function teachChapter(k){ try { return (typeof hbkChapterOf === 'function') ? hbkChapterOf(k) : null; } catch (_){ return null; } }
function _thUiWord(kind, key){
  try {
    if (kind === 'ui') return (typeof hbkLabel === 'function') ? hbkLabel(key) : _thT(key);
    const d = (typeof hbkDoorInfo === 'function') ? hbkDoorInfo(key) : null; return (d && d.word) || key;
  } catch (_){ return key; }
}
function teachPlain(v){ try { return (typeof hbkPlainOf === 'function') ? hbkPlainOf(v, _thLang(), _thUiWord) : _thW(v); } catch (_){ return _thW(v); } }
function teachWalkSteps(c){ if (!c) return []; const how = Array.isArray(c.how) ? c.how : []; return how.length ? how : (c.what ? [c.what] : []); }
/* what step i (1-based) is about: the picture boxes on it, and the page that picture was taken on; and FIRST, what
   the picture's recipe pressed to get there (`pre`: its clicks, and the door a pop-up opener stands for), so a step
   inside a card that is not open yet outlines the button that opens it */
const TEACH_FN_DOORS = {
  pdDropDoor: ['[data-jb-way="upload"]', '[data-ca-chip="upload"]'],
  openNewAgreement: ['[data-hb-draft]', '[data-jb-way="draft"]', '[data-ca-chip="draft"]'],
};
function teachMarksOf(c, i){
  const sels = [], places = [], pre = [];
  for (const sh of (c && c.shots) || []){
    const bs = (sh.boxes || []).filter(b => b && b.step === i && b.sel); if (!bs.length) continue;
    bs.forEach(b => sels.push(b.sel));
    const g = (sh.go || []).find(a => a && typeof a.place === 'string'); if (g) places.push(g.place);
    for (const a of sh.go || []){ if (a && typeof a.click === 'string') pre.push(a.click); if (a && TEACH_FN_DOORS[a.fn]) pre.push(...TEACH_FN_DOORS[a.fn]); }
  }
  return { sels, place: places[0] || null, pre: pre.filter(x => !sels.includes(x)) };
}
function _thShown(el){ try { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest('[hidden]'); } catch (_){ return false; } }
function teachFind(sels){
  if (typeof document === 'undefined') return null;
  for (const s of sels || []){ let els = []; try { els = [...document.querySelectorAll(s)]; } catch (_){ els = []; } const el = els.find(_thShown); if (el) return el; }
  return null;
}
function teachMarkOff(){ if (typeof document !== 'undefined') document.querySelectorAll('.teach-mark').forEach(e => e.classList.remove('teach-mark')); }
function teachMarkOn(el){ teachMarkOff(); if (!el) return; el.classList.add('teach-mark'); try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (_){} }
/* ---------- THE STEP, DRAWN THE LEGORA + STRIPE WAY (owner's pick by name, 23 Nov 2026) ----------
   "show them in steps like in this guidance from the handbook … with the highlights in colour and bold letters".
   No grey bubble: a soft "Step i of n" badge and the chapter's title; the step in the chapter's OWN words, where
   the button to press (a {ui:…} or {door:…} in the book) is marked like a highlighter in green and bold, a status
   word keeps its own colour (amber in amber), and a place is in bold; a pin line says where it is; under the
   presses, a small timeline of every step of the chapter, the ones behind ticked, this one lit. Only HaTi's words
   are escaped and marked — nothing is read from the person, nothing invented. */
const TEACH_PLACES = {
  en: ['Dossier', 'Redlines', 'Board', 'Calendar', 'Handbook', 'Settings', 'Contracts', 'Explorer', 'Discover', 'Obligations', 'Approvals', 'Needs you', 'Our paper', 'Their paper', 'Requests', 'Import', 'People', 'Playbook', 'Overview'],
  sv: ['Dossier', 'Redlines', 'Tavlan', 'Kalendern', 'Handboken', 'Inställningar', 'Utforskaren', 'Behöver dig', 'Godkännanden', 'Åtaganden', 'Vårt papper', 'Deras papper', 'Förfrågningar', 'Personer', 'Översikt'],
};
const TEACH_AMBER = { en: /(?<![\p{L}])(amber)(?![\p{L}])/giu, sv: /(?<![\p{L}])(bärnstensfärgade?)(?![\p{L}])/giu };
function _thPlaceRe(lang){
  const L = TEACH_PLACES[lang] || TEACH_PLACES.en;
  return new RegExp('(?<![\\p{L}])(' + L.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(\\p{L}*)', 'gu');
}
/* one of HaTi's sentences, with its marks: buttons highlighted green, amber in amber, places in bold */
function teachRich(v){
  const lang = _thLang(), s = _thW(v), out = [];
  const plain = t => _thE(t).replace(_thPlaceRe(lang), '<b>$1$2</b>').replace(TEACH_AMBER[lang] || TEACH_AMBER.en, '<span class="teach-amb">$1</span>');
  let at = 0; const re = new RegExp(HBK_MARK_SRC, 'g'); let m;
  while ((m = re.exec(s))){ out.push(plain(s.slice(at, m.index))); out.push(`<span class="teach-btn">${_thE(_thUiWord(m[1], m[2]))}</span>`); at = m.index + m[0].length; }
  out.push(plain(s.slice(at)));
  return out.join('').replace(/\s+/g, ' ').trim();
}
const HBK_MARK_SRC = '\\{(ui|door):([a-z0-9_]+)\\}';
/* a step's short name for the timeline: its own first clause */
function teachStepShort(v){
  const t = teachPlain(v); const cut = t.split(/(?<=[.:;])\s/)[0].replace(/[.:;]$/, '');
  return cut.length > 64 ? cut.slice(0, 62).replace(/\s+\S*$/, '') + '…' : cut;
}
const TEACH_PIN = '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 14s5-4.6 5-8.5A5 5 0 0 0 3 5.5C3 9.4 8 14 8 14Z"/><circle cx="8" cy="5.5" r="1.8"/></svg>';
function teachStepHtml(c, i, steps, where){
  const n = steps.length;
  const tl = steps.map((st, j) => {
    const at = j + 1, cls = at === i ? ' is-cur' : at < i ? ' is-done' : '';
    return `<li class="teach-tl-i${cls}"${at === i ? ' aria-current="step"' : ''}><i>${at < i ? '✓' : at}</i><span>${_thE(teachStepShort(st))}</span></li>`;
  }).join('');
  return `<div class="teach-step" data-teach-step="${_thE(c.k)}:${i}">`
    + `<div class="teach-top"><span class="teach-badge">${_thE(_thT('teach_step_of', { i, n }))}</span><span class="teach-title">${_thE(teachPlain(c.title))}</span></div>`
    + `<p class="teach-say">${teachRich(steps[i - 1])}</p>`
    + (where ? `<div class="teach-where">${TEACH_PIN}<span>${_thE(where).split(_thE(_thT('teach_go'))).join(`<b>${_thE(_thT('teach_go'))}</b>`)}</span></div>` : '')
    + `<ol class="teach-tl">${tl}</ol></div>`;
}
/* ---------- "HOW DO I …?" ANSWERED IN STEPS, IN EVERY BOX (owner, 23 Nov 2026: "build both") ----------
   A how-to the Handbook answers (the same reader as the Board's: navReadHandbook — a how-to about USING HaTi, no
   contract named, no task of Jambo's map) is answered right where it was asked, free, in the chapter's own numbered
   steps drawn the Legora + Stripe way, with Walk me through it and the chapter one press away. The Contracts page's
   box used to send it to the AI, which wrote its own steps. A move ("how do I get to the calendar") stays a move. */
const TEACH_HOW_MOVE = / (get to|go to|get back to|komma till|gå till|ta mig till) /;
function teachHowOf(q){
  try {
    if (typeof navReadHandbook !== 'function' || typeof navNorm !== 'function') return null;
    const t = navNorm(q); if (TEACH_HOW_MOVE.test(t)) return null;
    const r = navReadHandbook(q, t); const k = r && r.chapter;
    return k && teachWalkSteps(teachChapter(k)).length ? k : null;
  } catch (_){ return null; }
}
function teachHowTurn(k){
  const c = k ? teachChapter(k) : null, steps = teachWalkSteps(c); if (!steps.length) return null;
  const list = steps.map((st, j) => `<li class="teach-how-i"><i>${j + 1}</i><div>${teachRich(st)}</div></li>`).join('');
  const html = `<div class="teach-step teach-how" data-teach-how="${_thE(c.k)}">`
    + `<div class="teach-top"><span class="teach-badge">${_thE(_thT('teach_how_badge', { n: steps.length }))}</span><span class="teach-title">${_thE(teachPlain(c.title))}</span></div>`
    + `<ol class="teach-how-list">${list}</ol></div>`;
  return { ask: 'how', html, read: _thRead(), choices: [
    { label: _thT('teach_walk'), teach: 'walk', k: c.k, lead: true },
    { label: _thT('teach_read'), nav: { k: 'chapter', chapter: c.k } }] };
}
function teachStepTurn(k, i, o){
  const c = teachChapter(k), steps = teachWalkSteps(c), n = steps.length; if (!n) return null;
  i = Math.max(1, Math.min(n, i | 0 || 1));
  const M = teachMarksOf(c, i), el = teachFind(M.sels), opener = el ? null : teachFind(M.pre || []);
  teachMarkOn(el || opener);
  /* pressing an opener keeps the walk on this step (the card opens, then the step's own part is outlined) */
  _walk = { k, i, n, sels: M.sels, pre: M.pre || [], opener: !!opener };
  /* `short`: the same step said again after "Take me there" — only where it is now, never the whole step twice */
  const where = el ? _thT('teach_marked') : opener ? _thT('teach_opener') : M.place ? _thT('teach_go_hint') : M.sels.length ? _thT('teach_not_here') : '';
  const html = o && o.short ? _thLines([where || _thT('teach_not_here')]) : teachStepHtml(c, i, steps, where);
  const choices = [];
  if (!el && !opener && M.place && !(o && o.short)) choices.push({ label: _thT('teach_go'), teach: 'go', k, i, place: M.place });
  choices.push(i < n ? { label: _thT('teach_next'), teach: 'step', k, i: i + 1, lead: true } : { label: _thT('teach_done'), teach: 'done', k, lead: true });
  if (i > 1) choices.push({ label: _thT('teach_back'), teach: 'step', k, i: i - 1 });
  choices.push({ label: _thT('teach_stop'), teach: 'stop' });
  return { ask: 'walk', html, choices, read: _thRead() };
}
/* the walk's end: what was learnt ticks its first step, and the next untried ones are offered */
function teachDoneTurn(k){
  teachMarkOff(); _walk = null;
  const c = teachChapter(k);
  const task = (TEACH_TASKS[teachSeat()] || []).find(t => t[2] === k); if (task) teachDid(task[0]);
  const done = teachDoneSet();
  const next = (TEACH_TASKS[teachSeat()] || []).filter(t => !done.has(t[0]) && t[2] !== k).slice(0, 3)
    .map((t, j) => Object.assign({ label: _thT(t[1]), teach: 'walk', k: t[2] }, j === 0 ? { lead: true } : {}));
  return { ask: 'done', html: _thLines([_thT('teach_done_say', { t: c ? teachPlain(c.title) : '' }), next.length ? _thT('teach_next_offer') : _thT('teach_all_offer')]),
    choices: next.length ? next : [{ label: _thT('teach_here_chip'), teach: 'here' }], read: _thRead() };
}
/* one turn into the one conversation, drawn wherever the person is (born 'ai': its presses never travel) */
function teachPush(turn){
  if (!turn || typeof window === 'undefined') return false;
  const A = window.ai; if (!A || !Array.isArray(A.history)) return false;
  A.history.push(Object.assign({ role: 'assistant', host: 'ai', text: turn.html, read: turn.read || _thRead() }, turn.choices && turn.choices.length ? { choices: turn.choices } : {}));
  teachShow(); teachMarkKeep(); return true;
}
/* the panel redraws as the turn lands, and a redraw can replace the very thing that was outlined: it is found and
   outlined again a moment later, while the walk is still on that step */
function teachMarkKeep(){
  const W = _walk; if (!W || typeof setTimeout !== 'function') return;
  [120, 500, 1200].forEach(ms => setTimeout(() => {
    if (_walk !== W || (typeof document !== 'undefined' && document.querySelector('.teach-mark'))) return;
    const el = teachFind(W.opener ? W.pre : W.sels); if (el) teachMarkOn(el);
  }, ms));
}
/* the panel in front turns to the conversation (a page's panel, Settings), then every host draws it */
function teachShow(){
  if (typeof document === 'undefined') return;
  try { if (document.querySelector('#app-shell .jl-foot') && typeof jlTalkOpen === 'function') jlTalkOpen(); } catch (_){}
  try { if (document.getElementById('st-jb-feed') && typeof stJbTalkNow === 'function') stJbTalkNow(); } catch (_){}
  try { if (typeof aiHostsRepaint === 'function') aiHostsRepaint(); } catch (_){}
  /* the ✦'s window only while it is open: drawing it otherwise takes the turns away from the panel in front */
  try { const A = window.ai; if (A && (A.open || (typeof aiPopped === 'function' && aiPopped())) && typeof renderAIFeed === 'function') renderAIFeed(); } catch (_){}
}
/* a press on one of the instructor's chips (both hosts' choice handlers hand it here) */
function teachChoicePress(c){
  if (!c || !c.teach) return false;
  /* "Start the lessons" under an answer (AI_TEACH_RULE): the same as typing "I'm new" */
  if (c.teach === 'start'){ const t = teachSay("I'm new"); return teachPush(t); }
  if (c.teach === 'walk') return teachPush(teachStepTurn(c.k, 1));
  if (c.teach === 'step') return teachPush(teachStepTurn(c.k, c.i));
  if (c.teach === 'done') return teachPush(teachDoneTurn(c.k));
  if (c.teach === 'here') return teachPush(teachHereTurn());
  if (c.teach === 'stop'){ teachMarkOff(); _walk = null; return teachPush({ html: _thLines([_thT('teach_stopped')]), read: _thRead() }); }
  if (c.teach === 'off'){ teachMarkOff(); _walk = null; teachSet('off'); return teachPush({ html: _thLines([_thT('teach_off')]), read: _thRead() }); }
  if (c.teach === 'keep') return teachPush({ html: _thLines([_thT('teach_keep')]), read: _thRead() });
  if (c.teach === 'go'){
    try { if (typeof caGo === 'function') caGo({ kind: 'go', place: c.place }); } catch (_){}
    /* once the page has drawn, the same step again — outlined now, or said plainly where it is not to be found */
    let tries = 0; const k = c.k, i = c.i, sels = teachMarksOf(teachChapter(k), i).sels;
    const M0 = teachMarksOf(teachChapter(k), i); const seen = () => teachFind(sels) || teachFind(M0.pre || []);
    const again = () => { if (seen() || ++tries > 25){ teachPush(teachStepTurn(k, i, { short: true })); return; } setTimeout(again, 160); };
    setTimeout(again, 200); return true;
  }
  return false;
}
/* pressing the outlined thing is doing the step: the walk moves on by itself */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._teachWired){
  document._teachWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const w = t.closest('[data-teach-walk]');
    if (w){ e.preventDefault(); teachPush(teachStepTurn(w.getAttribute('data-teach-walk'), 1)); return; }
    const row = t.closest('[data-teach-task]');
    if (row){ e.preventDefault(); teachPush(teachStepTurn(row.getAttribute('data-teach-task'), 1)); return; }
    const here = t.closest('[data-teach-here]');
    if (here){ e.preventDefault(); teachPush(teachHereTurn()); return; }
    const m = t.closest('.teach-mark'); if (!m || !_walk) return;
    const W = _walk; m.classList.remove('teach-mark');
    /* an opener pressed: once the card is there, the same step's own part is outlined (no new turn) */
    if (W.opener){ let n = 0; const look = () => { if (_walk !== W) return; const el = teachFind(W.sels); if (el){ teachMarkOn(el); W.opener = false; return; } if (++n < 25) setTimeout(look, 160); }; setTimeout(look, 200); return; }
    setTimeout(() => { if (_walk !== W) return; teachPush(W.i < W.n ? teachStepTurn(W.k, W.i + 1) : teachDoneTurn(W.k)); }, 700);
  }, true);
}

/* ---------- ROUND 4 · YOUR FIRST STEPS, TICKED AS YOU GO ----------
   A short list by seat, in Jambo's panel on the Board while teaching is on. Each ticks itself from a moment HaTi
   already has — a contract opened (pdOpenOnHome), one added (contractArrived), details saved (pdFormSave,
   pd2FillSave), a question asked, the Calendar opened, a person added — kept on the person's own preferences
   (teachDone). Nothing is asked or typed. All ticked: Jambo asks ONCE whether to stop the lessons. */
const TEACH_TASKS = {
  editor: [['open', 'teach_t_open', '0.6'], ['add', 'teach_t_add', '2.2'], ['fill', 'teach_t_fill', '2.3'], ['ask', 'teach_t_ask', '0.2']],
  viewer: [['open', 'teach_t_open', '0.6'], ['ask', 'teach_t_ask', '0.2'], ['week', 'teach_t_week', '5.2']],
  admin: [['open', 'teach_t_open', '0.6'], ['add', 'teach_t_add', '2.2'], ['team', 'teach_t_team', '7.1'], ['ask', 'teach_t_ask', '0.2']],
};
const TEACH_DONE_KEYS = ['open', 'add', 'fill', 'ask', 'week', 'team', 'grad'];
function teachDoneSet(u){ const me = u || _thUser(); const v = me && me.prefs && me.prefs.teachDone; return new Set(Array.isArray(v) ? v.filter(x => TEACH_DONE_KEYS.includes(x)) : []); }
function teachTasks(u){ const done = teachDoneSet(u); return (TEACH_TASKS[teachSeat(u)] || TEACH_TASKS.editor).map(([key, label, ch]) => ({ key, label: _thT(label), ch, done: done.has(key) })); }
function teachDid(key){
  if (!TEACH_DONE_KEYS.includes(key) || !teachOn()) return false;
  const u = _thUser(); const done = teachDoneSet(u); if (done.has(key)) return false;
  done.add(key); const list = [...done];
  if (typeof stPrefSet === 'function') Promise.resolve(stPrefSet('teachDone', list)).catch(() => {});
  else u.prefs = Object.assign({}, u.prefs || {}, { teachDone: list });
  /* every first step done: Jambo asks once whether to stop the lessons */
  const tasks = teachTasks(u);
  if (tasks.length && tasks.every(t => t.done) && !done.has('grad')){
    const l2 = list.concat('grad');
    if (typeof stPrefSet === 'function') Promise.resolve(stPrefSet('teachDone', l2)).catch(() => {}); else u.prefs.teachDone = l2;
    setTimeout(() => teachPush({ html: _thLines([_thT('teach_grad')]), choices: [{ label: _thT('teach_grad_off'), teach: 'off', lead: true }, { label: _thT('teach_grad_keep'), teach: 'keep' }], read: _thRead() }), 900);
  }
  return true;
}
/* the Board panel's group (jamboOverviewHtml rows): a row a step, ticked green when done, its press the walk */
function teachTasksGroup(){
  if (!teachOn()) return null;
  const T = teachTasks();
  const rows = T.map((t, i) => Object.assign(t.done ? { mark: 'check2', tone: 'green' } : { mark: '', markText: String(i + 1), tone: 'gray' },
    { t: t.label, s: t.done ? _thT('teach_t_done') : _thT('teach_t_how'), attr: `data-teach-task="${_thE(t.ch)}"` }));
  return { label: _thT('teach_tasks_h', { a: T.filter(t => t.done).length, b: T.length }), rows };
}

const TEACH_API = { TEACH_HINT_DAYS, TEACH_STATES, TEACH_STEPS, teachNorm, teachRead, teachState, teachOn, teachSeat, teachChoices, teachTurn, teachSet, teachSay, teachTakes, teachHintOn, teachPh, teachHintSweep,
  TEACH_WORDS, teachWordOf, teachWordTurn, TEACH_HERE_RE, teachHereAsked, teachHereChapters, teachHereTurn,
  TEACH_FN_DOORS, TEACH_HOW_MOVE, teachHowOf, teachHowTurn, TEACH_PLACES, teachRich, teachStepShort, teachStepHtml, teachChapter, teachPlain, teachWalkSteps, teachMarksOf, teachFind, teachMarkOn, teachMarkOff, teachStepTurn, teachDoneTurn, teachPush, teachMarkKeep, teachShow, teachChoicePress,
  TEACH_TASKS, TEACH_DONE_KEYS, teachDoneSet, teachTasks, teachDid, teachTasksGroup };
if (typeof window !== 'undefined') Object.assign(window, TEACH_API);
if (typeof module !== 'undefined' && module.exports) module.exports = TEACH_API;
