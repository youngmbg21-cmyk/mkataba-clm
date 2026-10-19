/* ============================================================
   JAMBO'S MAP — HaTi's thirty-two commonest tasks, in the words people use
   (owner, 18 Oct 2026: "Start with MiniSearch and the map for 30 tasks";
   the same day: "add Explorer as the 31st task")
   ============================================================
   THE PROBLEM IT SOLVES. Jambo's free reader (js/copilotacts.js, caActOf)
   knows a place only by its exact word: "obligations" opens them, "what do
   we owe this month?" does not, and went to the model — which knows the
   contracts but not HaTi, and cannot take anyone anywhere. A person who does
   not know a feature's name could not reach it.

   WHAT THIS IS. One list (JM_TASKS): each task names the door HaTi ALREADY
   has for it (a place word of CA_PLACES, a door of CA_DOORS, a Menu row of
   CA_MENU, the Contracts place narrowed, or a Settings section through
   stFindGo) and the everyday ways of asking for it, in English and Svenska,
   including other products' words ("folders", "templates", "e-signature").
   MiniSearch (vendor/minisearch-7.2.0.umd.js, MIT; vendor/README.md) matches
   a typed sentence against those ways of asking, forgiving typos and partial
   words. Nothing here is a second door: every answer is an act caActOf
   already knows, said and moved by caGo, or a card that waits for a press.

   HOW SURE IT MUST BE. A sentence is taken only when it reads like "take me
   to / how do I …" and most of its own words are words of one task (JM_COVER);
   a task far ahead of the next (JM_LEAD) moves at once, two or three close
   ones are offered as a card, one press each (jmCardHtml). A question about
   what a contract SAYS, a count or a total (JM_FACT_RE), a sentence with words
   no task knows, and the Board's own words (hbParse) are left exactly as they
   were: the Board's reader or the model answers them.

   READING SPENDS NOTHING: no route, no model, nothing written. The library is
   fetched once, on idle (jmLib); until it has arrived the map answers null and
   the ask goes on as before.

   TYPING NEVER SIGNS, SENDS OR FILES (the nine flow rules, rule 7): a place
   opens, an act's card waits for its button, exactly as the exact words do.
   An admin's task (people, signing limits, who sees which stream) is offered
   only to an admin; anyone else's question goes on to Jambo, who names the
   rule and its door (AI_GOVERNANCE_RULE). */

const JM_LIB_SRC = 'vendor/minisearch-7.2.0.umd.js';
const JM_MAX = 140;          // longer than this is a question for Jambo, never a "where is"
const JM_COVER = 0.6;        // the share of the sentence's own words one task must know
const JM_LEAD = 1.5;         // how far the first task must be ahead of the second to move at once
const JM_NEAR = 0.6;         // a task this close to the first is offered beside it
const JM_PICKS = 3;          // at most this many on the "which did you mean" card
const JM_FUZZY_COUNTS = 7;   // a word matched only by a near spelling counts from this length (a typo, not another word)

/* THE THIRTY-TWO TASKS (the 32nd, a contract's brief, 19 Oct 2026). `to` is the existing door:
     place  — a CA_PLACES word (need 'one' asks which contract when none is up)
     door   — a CA_DOORS act on a contract; `home` is the place asked "which
              contract?" when none is named or up
     menu   — a CA_MENU row of the contract's Menu tab; `home` as for a door
     reg    — the Contracts place narrowed (regGoFiltered), as Home's tiles do
     st     — a Settings section (stFindGo: page:, panel:, you:)
   `admin` tasks are offered to an admin only. `w` is data in both languages:
   never read back from the books (CLAUDE.md, two languages). */
const JM_TASKS = [
  { k: 'needs', to: { place: 'needs' }, w: {
    en: ['my tasks', 'my todo list', 'todo', 'what is waiting for me', 'tasks waiting for me', 'pending tasks', 'anything for me today', 'my work today', 'what is on my plate', 'outstanding items', 'action items', 'my inbox', 'things i should be doing'],
    sv: ['mina uppgifter', 'att göra-lista', 'vad väntar på mig', 'mitt arbete idag', 'vad ligger på mitt bord', 'min inkorg', 'mina ärenden', 'väntande uppgifter'] },
    /* sentences made only of the ask's frame, read whole */
    whole: ['what do i need to do', 'what do i have to do', 'what should i do', 'what should i do next', 'what do i do now', 'what do i need to do today',
      'what am i supposed to do', 'what am i supposed to do today',
      'vad behöver jag göra', 'vad måste jag göra', 'vad ska jag göra', 'vad ska jag göra nu', 'vad ska jag göra idag', 'vad behöver jag göra idag', 'har jag något att göra'] },
  { k: 'contracts', to: { place: 'contracts' }, w: {
    en: ['contracts', 'agreements', 'all contracts', 'contract list', 'list of agreements', 'contract repository', 'browse the contracts', 'look up a contract', 'every agreement we have', 'the full list'],
    sv: ['avtal', 'alla avtal', 'avtalslista', 'lista över avtal', 'avtalsarkiv', 'slå upp ett avtal', 'kontrakt'] } },
  { k: 'expiring', to: { reg: { view: 'expiring90' } }, w: {
    en: ['contracts expiring soon', 'expiring contracts', 'ending soon', 'up for renewal', 'renewals', 'contracts that end soon', 'about to expire', 'due for renewal', 'expiry dates', 'renew a contract',
      'coming up for renewal', 'about to run out', 'running out', 'ending this year', 'end before'],
    sv: ['avtal som löper ut snart', 'går ut snart', 'förnyelser', 'förnya avtal', 'slutar snart', 'utgångsdatum', 'löper ut', 'ska förnyas'] } },
  { k: 'upload', to: { place: 'upload' }, w: {
    en: ['upload a contract', 'upload a document', 'add an existing contract', 'add a contract we received', 'attach a file', 'scan a contract', 'add a pdf', 'add a word file', 'their paper', 'a contract i got by email', 'from my computer'],
    sv: ['ladda upp ett avtal', 'ladda upp ett dokument', 'lägg till ett befintligt avtal', 'bifoga en fil', 'skanna ett avtal', 'lägg in en pdf', 'ett avtal vi fått', 'en fil från datorn'] } },
  { k: 'draft', to: { place: 'draft' }, w: {
    en: ['new contract', 'write a new contract', 'start a new agreement', 'a contract from a template', 'new nda', 'prepare a contract', 'our own paper',
      'new supplier contract', 'new customer agreement', 'new employment contract', 'a service agreement', 'a fresh nda', 'drafting'],
    sv: ['nytt avtal', 'skriv ett nytt avtal', 'starta ett nytt avtal', 'ett avtal från en mall', 'nytt sekretessavtal', 'nytt kontrakt',
      'nytt leverantörsavtal', 'nytt kundavtal', 'nytt anställningsavtal'] } },
  { k: 'fill', to: { place: 'fill' }, w: {
    en: ['fill in the missing details', 'complete the details', 'missing information', 'enter the contract details', 'add the dates and value', 'fill in the blanks', 'metadata', 'missing end date', 'missing start date', 'empty fields'],
    sv: ['fyll i det som saknas', 'saknade uppgifter', 'komplettera uppgifterna', 'ange avtalets uppgifter', 'fyll i luckorna', 'saknar slutdatum'] } },
  { k: 'redline', to: { place: 'redline' }, w: {
    en: ['negotiate', 'review their changes', 'mark up the contract', 'propose changes', 'edit the wording', 'their comments on the contract', 'markup', 'tracked changes',
      'they sent back changes', 'changes from the other side', 'negotiate the terms', 'go through the redlines', 'respond to their changes'],
    sv: ['förhandla', 'granska deras ändringar', 'föreslå ändringar', 'redigera texten', 'deras kommentarer på avtalet', 'spårade ändringar', 'förhandla villkoren', 'ändringar från motparten', 'svara på deras ändringar'] } },
  { k: 'sign', to: { place: 'sign' }, w: {
    en: ['sign the contract', 'sign it', 'add my signature', 'ready to sign', 'signature', 'e-sign', 'execute the contract', 'signing the agreement'],
    sv: ['signera avtalet', 'skriva under', 'skriver under', 'min underskrift', 'redo att signera', 'e-signera'] } },
  { k: 'signlink', to: { door: 'signlink', home: 'sign' }, w: {
    en: ['send for signature', 'send it to them to sign', 'get the other side to sign', 'signing link', 'e-signature request', 'ask them to sign', 'send to sign', 'get their signature'],
    sv: ['skicka för signering', 'skicka för underskrift', 'be dem skriva under', 'signeringslänk', 'få motparten att signera', 'få deras underskrift'] } },
  { k: 'share', to: { place: 'share' }, w: {
    en: ['send to the other side', 'share with the counterparty', 'send the contract', 'email the contract', 'share it with them', 'send it to them', 'send it to the customer', 'send it to the supplier', 'forward the contract'],
    sv: ['skicka till motparten', 'dela med motparten', 'skicka avtalet', 'mejla avtalet', 'dela det med dem', 'skicka till kunden', 'dela med kunden', 'skicka till leverantören'] } },
  { k: 'approval', to: { door: 'approval', home: 'sign' }, w: {
    en: ['get approval', 'ask for approval', 'ask my manager to approve', 'internal approval', 'get it signed off', 'request sign off', 'my boss must approve', 'send it for approval', 'who has to approve'],
    sv: ['be om godkännande', 'få godkännande', 'be chefen godkänna', 'internt godkännande', 'begär godkännande', 'chefen måste godkänna', 'skicka för godkännande'] } },
  { k: 'approvals', to: { place: 'approvals' }, w: {
    en: ['things to approve', 'waiting for my approval', 'approval queue', 'pending approvals', 'approve contracts', 'my approvals'],
    sv: ['att godkänna', 'väntar på mitt godkännande', 'godkännanden som väntar', 'mina godkännanden'] } },
  { k: 'oblig', to: { place: 'oblig' }, w: {
    en: ['what do we owe', 'our obligations', 'deliverables', 'payments due', 'commitments', 'what we promised', 'duties under the contract', 'what we committed to'],
    sv: ['våra åtaganden', 'vad är vi skyldiga', 'leveranser', 'betalningar som förfaller', 'vad vi har lovat', 'vad vi åtagit oss'] } },
  { k: 'history', to: { place: 'history' }, w: {
    en: ['who changed what', 'audit trail', 'activity log', 'change log', 'what happened', 'version history', 'previous versions', 'latest changes', 'who edited it'],
    sv: ['vem ändrade vad', 'historik', 'ändringslogg', 'tidigare versioner', 'vad har hänt', 'aktivitetslogg', 'senaste ändringarna', 'ändringshistorik'] } },
  { k: 'calendar', to: { place: 'calendar' }, w: {
    en: ['deadlines', 'due dates', 'what is coming up', 'upcoming dates', 'my schedule', 'my calendar', 'key dates', 'important dates', 'reminders'],
    sv: ['kalender', 'förfallodatum', 'vad händer framöver', 'kommande datum', 'viktiga datum', 'påminnelser'] } },
  { k: 'amend', to: { door: 'amend', home: 'document' }, w: {
    en: ['change a signed contract', 'make an amendment', 'variation', 'addendum', 'extend the contract', 'update a signed agreement', 'change the terms after signing', 'add an addendum', 'change the price in a signed deal'],
    sv: ['ändra ett signerat avtal', 'göra ett tillägg', 'tilläggsavtal', 'förlänga avtalet', 'ändra villkoren efter signering', 'ändra ett undertecknat avtal'] } },
  { k: 'export', to: { menu: 'export', home: 'document' }, w: {
    en: ['download the contract', 'print the contract', 'a pdf copy', 'save as pdf', 'convert to pdf', 'a word copy', 'a copy to keep'],
    sv: ['ladda ner avtalet', 'skriv ut avtalet', 'en pdf-kopia', 'spara som pdf', 'en kopia i word'] } },
  { k: 'end', to: { menu: 'end', home: 'document' }, w: {
    en: ['terminate the contract', 'cancel the contract', 'end the contract', 'put it on hold', 'pause the contract', 'we lost the deal', 'archive a contract', 'stop the contract', 'not going ahead'],
    sv: ['säga upp avtalet', 'avsluta avtalet', 'pausa avtalet', 'avbryta affären', 'arkivera ett avtal'] } },
  { k: 'parties', to: { place: 'parties' }, w: {
    en: ['customers', 'suppliers', 'vendors', 'clients', 'counterparties', 'counterparty', 'companies we work with', 'business partners'],
    sv: ['kunder', 'leverantörer', 'motparter', 'företag vi arbetar med', 'affärspartner'] } },
  { k: 'people', to: { place: 'people' }, w: {
    en: ['colleagues', 'contacts', 'phone number', 'email address', 'staff directory', 'team members', 'address book', 'coworkers', 'employee directory', 'who to contact'],
    sv: ['kollegor', 'kontakter', 'telefonnummer', 'mejladress', 'personalkatalog', 'medarbetare', 'adressbok', 'arbetskamrater', 'hitta en kollega'] } },
  { k: 'requests', to: { place: 'requests' }, w: {
    en: ['ask legal', 'request a contract from legal', 'legal request', 'ask the lawyers', 'intake', 'legal help', 'legal advice'],
    sv: ['fråga juristen', 'begär ett avtal från juristerna', 'juridisk hjälp', 'förfrågan till juristerna', 'juridisk rådgivning'] } },
  { k: 'ourpaper', to: { place: 'ourpaper' }, w: {
    en: ['templates', 'contract templates', 'standard contracts', 'clause library', 'our standard terms', 'playbook', 'our positions', 'model contracts'],
    sv: ['mallar', 'avtalsmallar', 'standardavtal', 'klausulbibliotek', 'våra standardvillkor', 'våra positioner'] } },
  { k: 'import', to: { place: 'import' }, w: {
    en: ['import old contracts', 'bulk upload', 'migrate our contracts', 'upload many contracts at once', 'bring in our archive', 'load all our old agreements', 'from excel', 'from a spreadsheet'],
    sv: ['importera gamla avtal', 'ladda upp många avtal', 'flytta in våra avtal', 'massuppladdning', 'ta in vårt arkiv'] } },
  { k: 'board', to: { place: 'board' }, w: {
    en: ['dashboard', 'overview', 'key figures', 'kpis', 'the numbers', 'the board'],
    sv: ['översikt', 'nyckeltal', 'siffrorna', 'instrumentpanel', 'tavlan'] } },
  { k: 'insights', to: { place: 'insights' }, w: {
    en: ['reports', 'analytics', 'statistics', 'charts', 'spend analysis', 'trends', 'portfolio report'],
    sv: ['rapporter', 'analys', 'statistik', 'diagram', 'trender'] } },
  /* the 31st (owner, 18 Oct 2026: "add Explorer as the 31st task"): every
     contract as a dot on one map, grouped, coloured and sized as asked */
  { k: 'explorer', to: { place: 'explorer' }, w: {
    en: ['explore our contracts', 'all contracts on one map', 'contract map', 'see how our contracts connect', 'contracts linked to each other', 'relationships between contracts',
      'visualise the portfolio', 'visualize the portfolio', 'bird\'s eye view', 'contract landscape', 'network of contracts', 'spot the outliers', 'graph of our contracts',
      'a map of every contract', 'the big picture of our contracts',
      /* its own name and the map's (owner, 19 Oct 2026: "take me to explorer") */
      'explorer', 'the explorer', 'open the explorer', 'the map', 'the contract map'],
    sv: ['utforska avtalen', 'avtalskarta', 'alla avtal på en karta', 'hur avtalen hänger ihop', 'samband mellan avtalen', 'visualisera avtalen', 'avtalen som ett nätverk', 'hitta avvikarna', 'helhetsbilden av avtalen',
      'utforskaren', 'öppna utforskaren', 'kartan', 'avtalskartan'] } },
  /* THE 32nd (owner, 19 Oct 2026: "briefing for contracts mk 345"): a
     contract's brief, the paper's own "Read the brief" door (CA_PLACES
     'brief'); a kept brief shown free, none kept Write the brief says its cost */
  { k: 'brief', to: { place: 'brief' }, w: {
    en: ['contract brief', 'read the brief', 'the brief of this contract', 'a plain english brief', 'key points of the contract', 'what this contract is about', 'brief me on the contract', 'briefing on this agreement'],
    sv: ['avtalets sammanfattning', 'läs sammanfattningen', 'sammanfattningen av avtalet', 'kort om avtalet', 'avtalets viktigaste punkter'] } },
  { k: 'team', admin: true, to: { st: 'page:team' }, w: {
    en: ['add a user', 'invite a colleague', 'new user', 'give someone access', 'add a team member', 'remove a user', 'user accounts', 'add someone', 'revoke access for a leaver'],
    sv: ['lägg till en användare', 'bjud in en kollega', 'ny användare', 'ge någon åtkomst', 'ta bort en användare', 'användarkonton'] } },
  { k: 'signcap', admin: true, to: { st: 'panel:signcap' }, w: {
    en: ['signing limits', 'who can sign', 'signing authority', 'limit on signing', 'cap on what someone can sign', 'authority to sign'],
    sv: ['signeringsgränser', 'vem får signera', 'firmateckning', 'beloppsgräns för signering', 'rätt att signera'] } },
  { k: 'folders', admin: true, to: { st: 'panel:folders' }, w: {
    en: ['who can see what', 'permissions', 'access rights', 'folder access', 'make a folder private', 'confidential folder', 'restrict access', 'lock down a folder'],
    sv: ['vem ser vad', 'behörigheter', 'åtkomsträttigheter', 'privat mapp', 'begränsa åtkomst', 'konfidentiell mapp'] } },
  { k: 'lang', to: { st: 'you:lang' }, w: {
    en: ['change language', 'switch to swedish', 'switch to english', 'language settings', 'in swedish please'],
    sv: ['byt språk', 'byta till engelska', 'byta till svenska', 'språkinställningar', 'på engelska tack'] } },
  { k: 'away', to: { st: 'you:away' }, w: {
    en: ['out of office', 'going on holiday', 'on leave', 'a deputy while I am away', 'deputy', 'someone to cover for me', 'delegate my approvals', 'vacation'],
    sv: ['frånvaro', 'semester', 'ledig', 'ställföreträdare', 'ersättare', 'någon som täcker upp för mig', 'delegera mina godkännanden'] } },
];

/* WORDS THAT CARRY NOTHING: the ask's frame, never its object. Dropped from
   the map and from the sentence alike, so "where can I see our renewals?"
   is read as "renewals". */
/* "them" and "their" are NOT filler: they are the other side ("get them to sign") */
const JM_STOP = new Set(('a an the i me my mine we us our ours you your it its this that these those they there here '
  + 'to of in on at for with from by about into onto is are was be been am do does did done can could would should will shall may might must '
  + 'have has had how where what which when please want wanna need needs like show see view open find search look looking go get take bring let '
  + 'just some any all so and or then now up page screen tab hati jambo help thing things one use using already still also '
  + 'again really actually supposed first since last put make made making few several many lot lots couple bunch dozens hundreds thousands s m d t ll re ve im id ive dont '
  + 'en ett den det de jag mig min mitt mina vi oss vår vårt våra du dig din ditt dina han hon hen deras där här att och eller som '
  + 'i på av för med från om till är var vara har hade ha kan kunde ska skulle vill måste får behöver göra gör hur vad vilken vilka när visa '
  + 'visar se ser öppna öppnar hitta hittar sök söker leta letar finns gå ta lägga lägger tack snälla bara någon något några alla många '
  + 'nu redan också sidan fliken').split(/\s+/).filter(Boolean));
/* WORDS THAT HELP BUT DO NOT DECIDE: the thing every task is about
   ("contract"), when ("this month") and how it is shown ("list"). They are
   matched, but a sentence is not "known" by them alone unless it has nothing
   else — so "list of our suppliers" is Parties, and "contract list" is
   Contracts. */
const JM_SOFT = new Set(('contract contracts agreement agreements document documents deal deals paper list lists clause clauses '
  + 'today tomorrow week weeks month months year years quarter next '
  + 'set change changed changes edit update create start give raise remind type load save saved saving '
  + 'monday tuesday wednesday thursday friday saturday sunday '
  + 'avtal avtalet avtalen kontrakt kontraktet dokument dokumentet affär affären lista listan klausul klausulen klausuler '
  + 'idag imorgon vecka veckan veckor månad månaden månader år året kvartal nästa '
  + 'ändra ändrar ställ uppdatera skapa starta ge spara '
  + 'måndag tisdag onsdag torsdag fredag lördag söndag').split(/\s+/).filter(Boolean));
/* the sentence asks for a fact, a count or a reading — the model's, not a
   door: "when does MK-4 expire?", "what is the value of…", "who signed it?" */
const JM_FACT_RE = /^\s*(?:how (?:many|much|long|often)|does|do (?:we|they|i) have|is|are|was|were|did|has|have we|why|explain|summari[sz]e|summary|compare|translate|(?:draft|write|compose) (?:an? |the )?(?:e-?mail|letter|message|note|reply|memo|summary)|when (?:does|do|is|did|will|was)|who (?:is|are|was|were|signed|owns|sent)|what(?:'s|s| is| are| was| were) (?:the|its|their|his|her)\b|hur (?:många|mycket|länge|ofta)|varför|förklara|sammanfatta|sammanfattning|jämför|översätt|(?:skriv|formulera) (?:ett |en )?(?:mejl|mail|brev|meddelande|svar)|finns det|har vi|är|när (?:går|löper|är|slutar|började|skrev)|vem (?:är|var|signerade|äger|skickade)|vad (?:är|var) (?:det|den|värdet|priset))\b/i;
/* "which contracts end this year?" asks for a list over a window no page
   narrows to: the model answers it with the list, not a page */
const JM_WINDOW_RE = /^\s*(?:which|what|vilka|vilket|vad)(?!\p{L}).*(?<!\p{L})(?:years?|months?|quarters?|christmas|år|året|månad|månaden|månader|kvartal|kvartalet|jul)(?!\p{L})/iu;
/* a count asked anywhere in the sentence ("list all the contracts so I can see how many") is the model's */
const JM_COUNT_RE = /(?<!\p{L})(?:how many|how much|hur många|hur mycket)(?!\p{L})/iu;
/* a whole sentence of the frame alone, as a task lists it (JM_TASKS[].whole) */
const jmNorm = s => String(s || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[\p{P}\p{S}]+/gu, ' ').replace(/\s+/g, ' ').trim();
/* a reference names a contract (MK-458), never a word of the task */
const JM_REF_RE = /#?\b([A-Za-z]{2,4}-[A-Za-z0-9]*\d[A-Za-z0-9]*)\b/g;

/* A WORD'S ENDING IS TRIMMED, the same way on both sides, so "kollegornas"
   meets "kollegor", "folders" meets "folder" and "signing" meets "sign" — a
   crude cut, but the map and the sentence are cut alike, and MiniSearch's
   prefix and one-letter forgiveness cover what it leaves */
const JM_ENDS = ['ornas', 'arnas', 'ernas', 'orna', 'arna', 'erna', 'ande', 'ing', 'ens', 'ets', 'ed', 'es', 'na', 'en', 'et', 'er', 'ar', 'or', 's'];
/* A SECOND CUT KEEPS FIVE LETTERS (owner, 19 Oct 2026: "i asked jambo to
   take me to explorer and it did not"): "explorer" was cut twice to "expl",
   which no way of asking held; it stops at "explor", the start of "explore" */
const JM_STEM_MIN2 = 5;
function jmStem(w){
  let s = w.length >= 6 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w;
  for (let n = 0; n < 2; n++){
    const e = s.length >= 6 ? JM_ENDS.find(x => s.endsWith(x) && !(x === 's' && s.endsWith('ss'))) : null;
    if (!e || s.length - e.length < (n ? JM_STEM_MIN2 : 4)) break;
    s = s.slice(0, -e.length);
    /* "scanned" → "scan", "committed" → "commit" */
    if ((e === 'ed' || e === 'ing') && /([b-df-hj-np-tv-z])\1$/.test(s)) s = s.slice(0, -1);
  }
  return s;
}
/* the sentence's words, each { w: trimmed, soft }; filler words are gone */
function jmWords(text){
  return String(text || '').toLowerCase().replace(/[’‘]/g, "'").replace(JM_REF_RE, ' ').replace(/\bto[\s-]do\b/g, 'todo')
    .split(/[\s\p{P}\p{S}]+/u).map(w => w.replace(/^'+|'+$/g, '')).filter(w => w && !JM_STOP.has(w))
    .map(w => ({ w: jmStem(w), soft: JM_SOFT.has(w) }));
}
function jmTerms(text){ return jmWords(text).map(x => x.w); }
/* a soft word is matched as it is, never by a near spelling ("contract" is not "contact") */
const JM_SOFT_STEM = new Set([...JM_SOFT].map(jmStem));

/* ---- THE LIBRARY, fetched once on idle (the vendor/ rule: served by HaTi itself) ---- */
let _jmLibP = null;
function jmLibNow(){ const g = (typeof globalThis !== 'undefined') ? globalThis : null; return (g && typeof g.MiniSearch === 'function') ? g.MiniSearch : null; }
function jmLib(){
  if (jmLibNow()) return Promise.resolve(jmLibNow());
  if (_jmLibP) return _jmLibP;
  if (typeof document === 'undefined') return Promise.resolve(null);
  _jmLibP = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = JM_LIB_SRC; s.async = true;
    s.onload = () => jmLibNow() ? resolve(jmLibNow()) : reject(new Error('MiniSearch did not load'));
    s.onerror = () => reject(new Error('MiniSearch could not be fetched'));
    document.head.appendChild(s);
  }).catch(() => { _jmLibP = null; return null; });
  return _jmLibP;
}

/* ---- THE INDEX: one document per way of asking, built once ---- */
let _jmIndex = null;
function jmIndex(){
  if (_jmIndex) return _jmIndex;
  const MS = jmLibNow(); if (!MS) return null;
  const ix = new MS({
    fields: ['text'], storeFields: ['k', 'bare'],
    tokenize: s => jmTerms(s), processTerm: t => t,
    /* the sentence arrives already read (jmWords): split it, never trim it twice */
    searchOptions: { tokenize: s => String(s).split(' ').filter(Boolean), processTerm: t => t, combineWith: 'OR',
      boostTerm: t => (JM_SOFT_STEM.has(t) ? 0.3 : 1),
      prefix: t => !JM_SOFT_STEM.has(t) && t.length >= 4, fuzzy: t => (!JM_SOFT_STEM.has(t) && t.length >= 5 ? 0.2 : false) },
  });
  const docs = [];
  JM_TASKS.forEach(T => ['en', 'sv'].forEach(lang => (T.w[lang] || []).forEach((text, n) => docs.push({ id: `${T.k}:${lang}:${n}`, k: T.k, text,
    /* a way of asking made only of soft words ("all contracts") */
    bare: jmWords(text).every(x => x.soft) }))));
  ix.addAll(docs);
  _jmIndex = ix;
  return ix;
}

/* ---- THE MATCH (pure: no screen, no contract, nothing spent) ----
   Each task's best way of asking, and how much of the sentence it knows.
   { words, tasks: [{ k, score, cover }] } — first the strongest — or null. */
function jmMatch(q, opts = {}){
  const t = String(q || '').trim();
  if (!t || t.length > JM_MAX || JM_FACT_RE.test(t) || JM_WINDOW_RE.test(t) || JM_COUNT_RE.test(t)) return null;
  const skip = opts.skip || (() => false);
  const n = jmNorm(t);
  const whole = JM_TASKS.find(T => !skip(T.k) && (T.whole || []).includes(n));
  if (whole) return { words: [], tasks: [{ k: whole.k, score: 1, cover: 1 }] };
  const tagged = jmWords(t); if (!tagged.length) return null;
  const words = tagged.map(x => x.w);
  const ix = jmIndex(); if (!ix) return null;
  /* a sentence of soft words alone ("take me to the contracts") is known only
     by a way of asking that is itself only soft words */
  const allSoft = tagged.every(x => x.soft);
  const by = new Map();
  for (const r of ix.search(words.join(' '))){
    if (skip(r.k) || (allSoft && !r.bare)) continue;
    const b = by.get(r.k) || { k: r.k, score: 0, hit: new Set() };
    b.score = Math.max(b.score, r.score);
    /* a word KNOWN by this task: met as it is or as the start of the task's word;
       met only by a near spelling, it is known when long enough to be a typo
       ("signeture") rather than another word ("supply" is not "supplier");
       the start of a much longer word is another word ("stand" is not "standard"),
       except while the word is still being typed (⌘K: "templ" is "templates") */
    const met = w => (r.terms || []).some(t => t === w || (t.startsWith(w) && (opts.typing || t.length - w.length <= 2)));
    (r.queryTerms || []).forEach(w => { if (met(w) || w.length >= JM_FUZZY_COUNTS) b.hit.add(w); });
    by.set(r.k, b);
  }
  /* how much of the sentence a task knows: its deciding words, or every word
     where the sentence has only soft ones */
  const strong = tagged.filter(x => !x.soft).map(x => x.w);
  const counted = strong.length ? new Set(strong) : new Set(words);
  const tasks = [...by.values()].map(b => ({ k: b.k, score: b.score, cover: [...counted].filter(w => b.hit.has(w)).length / counted.size }))
    .sort((a, b) => (b.score - a.score) || (b.cover - a.cover));
  return { words, tasks };
}
/* the decision: one task to move to, two or three to offer, or nothing */
function jmPick(m){
  if (!m || !m.tasks.length) return null;
  const known = m.tasks.filter(x => x.cover >= JM_COVER);
  if (!known.length) return null;
  const top = known[0], next = known[1];
  if (!next || top.score >= JM_LEAD * next.score) return { sure: top.k };
  const picks = known.filter(x => x.score >= JM_NEAR * top.score).slice(0, JM_PICKS).map(x => x.k);
  return picks.length > 1 ? { picks } : { sure: top.k };
}

/* ---- THE ACT: the door that already exists, for this task ---- */
function jmTask(k){ return JM_TASKS.find(x => x.k === k) || null; }
function jmIsAdmin(){ try { return !(typeof isAdmin === 'function' && !isAdmin()); } catch (_){ return false; } }
function jmContractOf(q){
  try { return (typeof caFindContract === 'function') ? caFindContract(String(q || '')) : null; } catch (_){ return null; }
}
function jmActOf(k, q){
  const T = jmTask(k); if (!T) return null;
  const to = T.to;
  const base = { state: 'ready', map: k };
  if (to.place){
    const p = (typeof CA_PLACES !== 'undefined' ? CA_PLACES : []).find(x => x.k === to.place) || {};
    const c = p.need ? jmContractOf(q) : null;
    return Object.assign({ kind: 'go', place: to.place, cid: c ? c.id : null }, p.need === 'one' && !c ? { missing: true } : {}, base);
  }
  if (to.door || to.menu){
    const c = jmContractOf(q);
    if (!c) return Object.assign({ kind: 'go', place: to.home, cid: null, missing: true }, base);
    if (to.door) return Object.assign({ kind: 'door', door: to.door, cid: c.id }, base);
    const row = (typeof CA_MENU !== 'undefined' ? CA_MENU : []).find(x => x[0] === to.menu);
    return Object.assign({ kind: 'menu', menu: to.menu, sels: row ? row[2] : [], cid: c.id }, base);
  }
  if (to.reg) return Object.assign({ kind: 'go', place: 'contracts', reg: Object.assign({}, to.reg), say: 'jm_go_' + k }, base);
  if (to.st) return Object.assign({ kind: 'go', place: 'settings', st: to.st, say: 'jm_go_' + k }, base);
  return null;
}
/* ON THE BOARD ITS OWN READER KEEPS ITS WORDS (as caPlaceOf): "show
   obligations by stream" is the Board's chart, not a page */
/* AND ON THE BOARD OR EXPLORER A QUESTION FOR A LIST OF CONTRACTS IS THEIRS
   ("Which contracts renew soon?"): they answer it with the list drawn where
   the reader is looking, which a page cannot (analyze-on-the-graph 0a) */
const JM_LIST_RE = /^\s*(?:which|what|show|list|vilka|vilket|visa)(?!\p{L}).*(?<!\p{L})(?:contracts?|agreements?|deals?|avtal\p{L}*|kontrakt\p{L}*)(?!\p{L})/iu;
function jmBoardKeeps(q){
  try {
    const face = (typeof state !== 'undefined' && state && state.view === 'dashboard' && typeof hbFace === 'function') ? hbFace() : '';
    if ((face === 'board' || face === 'explorer') && JM_LIST_RE.test(q)) return true;
    if (typeof caOnBoard !== 'function' || !caOnBoard() || typeof hbParse !== 'function') return false;
    const r = hbParse(q); return !!(r && r.act !== 'face');
  } catch (_){ return false; }
}
/* THE ONE ENTRY caActOf (and the Counter's box) call last, before the model:
   an act, a "which did you mean" card, or null */
function jmRead(q){
  const t = String(q || '').trim(); if (!t) return null;
  if (!jmLibNow()){ jmLib(); return null; }
  if (jmBoardKeeps(t)) return null;
  const admin = jmIsAdmin();
  const m = jmMatch(t, { skip: k => { const T = jmTask(k); return !!(T && T.admin && !admin); } });
  const p = jmPick(m); if (!p) return null;
  if (p.sure) return jmActOf(p.sure, t);
  const c = jmContractOf(t);
  return { kind: 'map', picks: p.picks, q: t, cid: c ? c.id : null, state: 'ready' };
}

/* ---- "WHICH DID YOU MEAN?" — two or three tasks, one press each ----
   Drawn as Jambo's other cards are (.ca-card, .ca-acts); a press is the
   task's own act, said and moved as a typed word would be. */
const _jmE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _jmT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
function jmCardHtml(a, i){
  if (!a || a.kind !== 'map') return '';
  if (a.state === 'done') return `<div class="ca-card" data-ca-card="${i}" data-jm-card><div class="ca-ct">${_jmE(_jmT('jm_pick_title'))}</div>
    <p class="ca-said is-ok">${_jmE(_jmT('jm_pick_done', { what: _jmT('jm_t_' + a.chose) }))}</p></div>`;
  const btns = (a.picks || []).map((k, n) => `<button type="button" class="ui-btn ui-btn-sm${n === 0 ? ' ui-btn-primary' : ''}" data-ca-act="jm:${_jmE(k)}" data-ca-turn="${i}">${_jmE(_jmT('jm_t_' + k))}</button>`).join('');
  return `<div class="ca-card" data-ca-card="${i}" data-jm-card><div class="ca-ct">${_jmE(_jmT('jm_pick_title'))}</div><div class="ca-acts">${btns}</div></div>`;
}
function jmCardPress(i, act){
  let m = null; try { m = intel.history[i] || null; } catch (_){ m = null; }
  const a = m && m.act; if (!a || a.kind !== 'map' || a.state !== 'ready' || !String(act).startsWith('jm:')) return;
  const k = String(act).slice(3); if (!(a.picks || []).includes(k)) return;
  const next = jmActOf(k, a.q); if (!next) return;
  a.state = 'done'; a.chose = k;
  const said = next.kind === 'go' && typeof caGoSay === 'function' ? caGoSay(next) : _jmT('ca_intro_job');
  try { intel.history.push({ role: 'assistant', text: said, act: next }); } catch (_){}
  if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
  if (next.kind === 'go' && typeof caGo === 'function') caGo(next);
}

/* ---- ⌘K AND THE TOP BAR'S BOX (owner, 18 Oct 2026: "wire the map into the
   top search bar and ⌘K") ----
   ⌘K draws up to JM_PALETTE_MAX tasks as rows beside the place words and the
   Settings finder's rows (commandPaletteResults), never one of theirs twice:
   a task whose door is a place word already listed, or a Settings section the
   finder already found, is left out. The top bar's box keeps searching
   contracts as it is typed; Enter on words no contract matches is a request,
   and goes where Jambo's box would take it (jmRunAct). */
const JM_PALETTE_MAX = 3;
function jmPaletteRows(q, opts = {}){
  const t = String(q || '').trim(); if (!t) return [];
  if (!jmLibNow()){ jmLib(); return []; }
  const admin = jmIsAdmin(), places = new Set(opts.places || []), settings = new Set(opts.settings || []);
  const skip = k => { const T = jmTask(k);
    return !T || (T.admin && !admin) || (!!T.to.place && places.has(T.to.place)) || (!!T.to.st && settings.has(T.to.st)); };
  const m = jmMatch(t, { skip, typing: true }); if (!m) return [];
  return m.tasks.filter(x => x.cover >= JM_COVER).slice(0, JM_PALETTE_MAX).map(x => {
    const T = jmTask(x.k);
    return { kind: 'task', id: x.k, title: _jmT('jm_t_' + x.k), sub: _jmT('jm_s_' + x.k), tag: _jmT('jm_tag'), ic: T.to.st ? 'cog' : 'chevR' };
  });
}
/* AN ACT FROM OUTSIDE JAMBO'S BOX, said and moved as if it had been typed
   there: a page opens at once (caGo); anything that waits for a press — an
   act's card, "which contract?", "which did you mean?", share, draft — is
   Jambo's, beside the Board, where his cards live */
const JM_CARD_PLACES = ['share', 'draft', 'help', 'next'];
function jmRunAct(a, q){
  if (!a) return false;
  const view = (typeof state !== 'undefined' && state) ? state.view : '';
  const card = a.kind !== 'go' || !!a.missing || JM_CARD_PLACES.includes(a.place);
  if (!card && view !== 'dashboard') return (typeof caGo === 'function') ? caGo(a) : false;
  const say = () => {
    const line = (a.kind === 'go' && typeof caGoSay === 'function') ? caGoSay(a) : _jmT('ca_intro_job');
    const asked = String(q || '').trim() || (a.map ? _jmT('jm_t_' + a.map) : '');
    try { intel.history.push({ role: 'user', text: asked }, { role: 'assistant', text: line, act: a }); } catch (_){}
    if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_){}
    if (a.kind === 'go' && typeof caGo === 'function') caGo(a);
  };
  if (view !== 'dashboard' && typeof setView === 'function'){ setView('dashboard'); setTimeout(say, 0); return true; }
  say(); return true;
}
function jmRun(k, q){ return jmRunAct(jmActOf(k, q), q); }

/* THE LIBRARY IS ASKED FOR AT START-UP (owner, 19 Oct 2026: "supported by
   Minisearch"; was on idle, so the first ask after a load found no map): the
   script is fetched as the app starts, from HaTi itself (86 KB, cached hard) */
if (typeof window !== 'undefined' && typeof document !== 'undefined'){
  try { jmLib(); } catch (_){}
}

if (typeof window !== 'undefined') Object.assign(window, { JM_LIB_SRC, JM_MAX, JM_COVER, JM_LEAD, JM_NEAR, JM_PICKS, JM_FUZZY_COUNTS, JM_TASKS, JM_STOP, JM_SOFT, JM_FACT_RE, JM_WINDOW_RE, JM_COUNT_RE, JM_LIST_RE,
  jmNorm, JM_STEM_MIN2, jmStem, jmTerms, jmLibNow, jmLib, jmIndex, jmMatch, jmPick, jmTask, jmActOf, jmBoardKeeps, jmRead, jmCardHtml, jmCardPress,
  JM_PALETTE_MAX, jmPaletteRows, JM_CARD_PLACES, jmRunAct, jmRun });
