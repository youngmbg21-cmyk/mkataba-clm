// HaTi — THE FLOW MAP AS DATA: how every page reaches the next (owner, 31 Oct 2026).
/* ============================================================================
   THE MAP IS PART OF THE PLATFORM (owner, 31 Oct 2026: "include the map to the
   platform … and it has to be updated as the page changes shape over time as a
   rule"; docs/PLAN-the-legora-way.md, round 0).
   ----------------------------------------------------------------------------
   ONE TABLE, FLOW_MAP: every word Jambo can open (CA_PLACES, js/copilotacts.js)
   has one row here — its stage on the contract's life, and the three ways a
   person leaves it, cheapest first:
     a  THE STEP: what HaTi opens next with no press (flow rule 4)
     d  THE DOORS: at most five green words above Jambo's box (flow rule 6)
     p  LIKELY NEXT: what Jambo predicts, read from the person's own desk
   Each is [target place, {en, sv} words]. The page (js/views/flowmap.js) draws
   this table; f964 fails when a place is not on the map, when a target is not a
   place, when a row has no stage or more than five doors.

   A CHANGE THAT ADDS, MOVES OR REMOVES A PAGE, A DOOR OR A STEP UPDATES THIS
   TABLE IN THE SAME CHANGE. A page not on the map is not finished.
   Nothing here reads or writes a record.
   ========================================================================== */
const FLOW_STAGES = [
  { k: 'arrive', spine: true, en: 'Arrive', sv: 'Kommer in' },
  { k: 'read', spine: true, en: 'Read & fill', sv: 'Läs & fyll i' },
  { k: 'nego', spine: true, en: 'Negotiate', sv: 'Förhandla' },
  { k: 'sign', spine: true, en: 'Approve & sign', sv: 'Godkänn & signera' },
  { k: 'live', spine: true, en: 'Live', sv: 'Gäller' },
  { k: 'book', spine: false, en: 'The book', sv: 'Avtalsboken' },
  { k: 'house', spine: false, en: 'The house', sv: 'Huset' },
];
const _w = (en, sv) => ({ en, sv });
/* k · st (stage) · hub · a (step) · d (doors, ≤5) · p (likely next) · s (one line on what it is) */
const FLOW_MAP = [
  /* ---- ARRIVE ---- */
  { k: 'counter', st: 'arrive', s: _w('the desk: what waits on you', 'skrivbordet: det som väntar på dig'),
    a: [], d: ['board', 'contracts', 'calendar', 'explorer', 'reads'],
    p: [['document', _w('the late duty or the first thing waiting', 'den försenade plikten eller det första som väntar')], ['redline', _w('their answers to send', 'deras svar att skicka')], ['approvals', _w('an approval asked of you', 'ett godkännande du ombeds ge')]] },
  { k: 'needs', st: 'arrive', s: _w('what waits on you, on Home', 'det som väntar på dig, på Hem'),
    a: [['document', _w('a row pressed → where it waits', 'en rad → där den väntar')]], d: ['counter', 'board'], p: [] },
  { k: 'upload', st: 'arrive', s: _w('one reader, two doors', 'en läsare, två dörrar'),
    a: [['document', _w('Add → the paper with its Dossier, read on arrival', 'Lägg till → pappret med sin dossier, läst vid ankomst')]], d: ['contracts', 'import', 'ourpaper'], p: [] },
  { k: 'draft', st: 'arrive', s: _w('the one sheet: our paper or theirs', 'det enda bladet: vårt papper eller deras'),
    a: [['document', _w('Create → its Dossier, read on arrival', 'Skapa → dess dossier, läst vid ankomst')]], d: ['ourpaper', 'requests', 'contracts'],
    p: [['requests', _w('nothing fits → ask for a paper', 'inget passar → be om ett papper')]] },
  { k: 'import', st: 'arrive', s: _w('many files at once', 'många filer på en gång'),
    a: [['contracts', _w('File the N → they stand in the list', 'Arkivera N → de står i listan')]], d: ['contracts', 'calendar'],
    p: [['fill', _w('the files that need you', 'filerna som behöver dig')]] },
  { k: 'requests', st: 'arrive', s: _w('asks for a paper or advice', 'förfrågningar om papper eller råd'),
    a: [['draft', _w('Start the draft → the one form, filled', 'Börja utkastet → formuläret, ifyllt')]], d: ['draft', 'ourpaper', 'people'],
    p: [['draft', _w('the paper that fits', 'pappret som passar')]] },
  /* ---- READ & FILL ---- */
  { k: 'document', st: 'read', hub: true, s: _w('THE HUB: a contract\'s paper and Dossier; every door lands here', 'NAVET: avtalets papper och dossier; varje dörr landar här'),
    a: [], d: ['brief', 'fill', 'redline', 'sign', 'history'],
    p: [['fill', _w('fill in what is owed', 'fyll i det som saknas')], ['approvals', _w('answer the approval', 'svara på godkännandet')], ['share', _w('send what waits', 'skicka det som väntar')]] },
  { k: 'brief', st: 'read', s: _w('Jambo\'s one reading of this wording', 'Jambos enda läsning av denna text'),
    a: [['document', _w('I have read it → the Dossier, the check cleared', 'Jag har läst den → dossiern, kontrollen klar')]], d: ['document', 'history'],
    p: [['fill', _w('the blanks', 'tomrummen')], ['approvals', _w('the approval', 'godkännandet')]] },
  { k: 'fill', st: 'read', s: _w('the details owed, on the form or the paper', 'uppgifterna som saknas, i formuläret eller på pappret'),
    a: [['document', _w('Save → the Dossier, one thing fewer owed', 'Spara → dossiern, en sak mindre')]], d: ['document', 'sign'],
    p: [['approvals', _w('answer the approval', 'svara på godkännandet')], ['sign', _w('before you sign', 'innan du signerar')]] },
  { k: 'next', st: 'read', s: _w('the next steps on one contract', 'nästa steg på ett avtal'),
    a: [], d: ['document'], p: [['fill', _w('what is owed first', 'det som saknas först')]] },
  /* ---- NEGOTIATE ---- */
  { k: 'redline', st: 'nego', s: _w('their asks and your answers', 'deras önskemål och dina svar'),
    a: [['share', _w('Send all → the Send screen', 'Skicka alla → skicka-skärmen')]], d: ['document', 'history', 'negotiations'],
    p: [['share', _w('send the answers', 'skicka svaren')]] },
  { k: 'share', st: 'nego', s: _w('the letter and its walls', 'brevet och dess spärrar'),
    a: [['history', _w('Sent → the record written, said once', 'Skickat → posten skriven, sagt en gång')]], d: ['redline', 'history', 'document'], p: [] },
  { k: 'negotiations', st: 'nego', s: _w('every live round', 'alla pågående rundor'),
    a: [['redline', _w('a row → its Redlines', 'en rad → dess ändringar')]], d: ['contracts', 'approvals', 'counter'],
    p: [['redline', _w('the round that is your move', 'rundan där det är ditt drag')]] },
  /* ---- APPROVE & SIGN ---- */
  { k: 'approvals', st: 'sign', s: _w('decide and sign', 'besluta och signera'),
    a: [['sign', _w('Approve → Before you sign, for the signer', 'Godkänn → innan du signerar, för den som signerar')]], d: ['negotiations', 'contracts', 'calendar'],
    p: [['brief', _w('read the brief first', 'läs sammanfattningen först')]] },
  { k: 'sign', st: 'sign', s: _w('the one list, then the pad', 'den enda listan, sedan blocket'),
    a: [['history', _w('signed by all → the receipt, the seal, the copies sent', 'signerat av alla → kvittot, förseglingen, kopiorna skickade')], ['oblig', _w('then the duties found, to add', 'sedan pliktema som hittats, att lägga till')]],
    d: ['document', 'brief', 'approvals'], p: [['fill', _w('the blank that stops you', 'tomrummet som stoppar dig')]] },
  /* ---- LIVE ---- */
  { k: 'oblig', st: 'live', s: _w('what each side owes', 'vad varje sida är skyldig'),
    a: [], d: ['calendar', 'contracts', 'counter'], p: [['oblig', _w('the late one: mark done or chase', 'den försenade: markera klar eller påminn')]] },
  { k: 'calendar', st: 'live', s: _w('agenda, week and horizon', 'agenda, vecka och horisont'),
    a: [], d: ['oblig', 'board', 'counter'], p: [['oblig', _w('what is due this week', 'det som förfaller denna vecka')]] },
  { k: 'history', st: 'live', s: _w('the trail', 'spåret'),
    a: [], d: ['document', 'share'], p: [] },
  /* ---- THE BOOK ---- */
  { k: 'board', st: 'book', s: _w('your book, counted', 'din avtalsbok, räknad'),
    a: [], d: ['contracts', 'explorer', 'calendar', 'work'], p: [['contracts', _w('the list behind a figure', 'listan bakom en siffra')]] },
  { k: 'work', st: 'book', s: _w('what Jambo prepared, on the Board', 'det Jambo har förberett, på tavlan'),
    a: [['document', _w('a piece → where it lands', 'en del → där den landar')]], d: ['board', 'house'], p: [] },
  { k: 'explorer', st: 'book', s: _w('the map of the book', 'kartan över avtalsboken'),
    a: [], d: ['board', 'contracts'], p: [] },
  { k: 'contracts', st: 'book', s: _w('the list, by folder', 'listan, per mapp'),
    a: [['document', _w('a row → its Dossier', 'en rad → dess dossier')]], d: ['upload', 'draft', 'reads'],
    p: [['document', _w('the one that needs you', 'det som behöver dig')]] },
  { k: 'wall', st: 'book', s: _w('Contracts as cards', 'avtal som kort'),
    a: [['document', _w('a card pressed twice → its Dossier', 'ett kort två gånger → dess dossier')]], d: ['contracts', 'board'], p: [] },
  { k: 'list', st: 'book', s: _w('Contracts as a table', 'avtal som tabell'),
    a: [['document', _w('a row → its Dossier', 'en rad → dess dossier')]], d: ['contracts', 'wall'], p: [] },
  { k: 'parties', st: 'book', s: _w('one shelf per counterparty', 'en hylla per motpart'),
    a: [['contracts', _w('Open party → its deals', 'Öppna part → dess avtal')]], d: ['contracts', 'people', 'explorer'], p: [] },
  { k: 'people', st: 'book', s: _w('the people, as a table', 'personerna, som tabell'),
    a: [], d: ['settings', 'contracts'], p: [] },
  { k: 'ourpaper', st: 'book', s: _w('standards and shelves', 'standarder och hyllor'),
    a: [['draft', _w('Use it → New agreement', 'Använd → nytt avtal')]], d: ['draft', 'settings'], p: [] },
  { k: 'mynotes', st: 'book', s: _w('your private notes', 'dina privata anteckningar'),
    a: [], d: ['calendar', 'approvals'], p: [] },
  { k: 'reads', st: 'book', s: _w('kept questions and their reads', 'sparade frågor och deras läsningar'),
    a: [['contracts', _w('a read → its table', 'en läsning → dess tabell')]], d: ['contracts', 'board'], p: [] },
  { k: 'pulse', st: 'book', s: _w('the pulse board', 'pulstavlan'),
    a: [], d: ['board', 'contracts'], p: [] },
  /* ---- THE HOUSE ---- */
  { k: 'settings', st: 'house', s: _w('the control room', 'kontrollrummet'),
    a: [], d: ['people', 'ourpaper', 'handbook'], p: [] },
  { k: 'house', st: 'house', s: _w('Jambo\'s agents and their office', 'Jambos agenter och deras kontor'),
    a: [], d: ['board', 'settings'], p: [] },
  { k: 'handbook', st: 'house', s: _w('how to do each thing', 'hur man gör varje sak'),
    a: [], d: ['counter', 'settings', 'flowmap'], p: [] },
  { k: 'flowmap', st: 'house', s: _w('how every page reaches the next', 'hur varje sida når nästa'),
    a: [], d: ['counter', 'handbook', 'guide'], p: [] },
  { k: 'brain', st: 'house', s: _w('the parts and how they connect', 'delarna och hur de hänger ihop'),
    a: [], d: ['settings', 'flowmap'], p: [] },
  { k: 'guide', st: 'house', s: _w('every page by stage, in the side panel', 'varje sida per steg, i sidopanelen'),
    a: [], d: ['counter', 'handbook', 'flowmap'], p: [] },
  { k: 'alerts', st: 'house', s: _w('the bell: what needs you', 'klockan: det som behöver dig'),
    a: [['document', _w('a row → where it waits', 'en rad → där den väntar')]], d: ['counter', 'oblig', 'approvals'], p: [] },
  { k: 'activity', st: 'house', s: _w('what happened, in the side panel', 'vad som hänt, i sidopanelen'),
    a: [], d: ['history', 'counter'], p: [] },
  { k: 'help', st: 'house', s: _w('an answer from the handbook', 'ett svar ur handboken'),
    a: [], d: ['handbook', 'guide'], p: [] },
  { k: 'back', st: 'house', s: _w('the one way back', 'den enda vägen tillbaka'),
    a: [], d: [], p: [] },
];
/* the spine every contract walks, drawn faintly when nothing is chosen */
const FLOW_SPINE = [['upload', 'document'], ['draft', 'document'], ['document', 'redline'], ['redline', 'share'], ['document', 'approvals'],
  ['approvals', 'sign'], ['sign', 'history'], ['sign', 'oblig'], ['oblig', 'calendar']];
const FLOW_DOORS_MAX = 5;
function flowMapRow(k){ return FLOW_MAP.find(r => r.k === k) || null; }

Object.assign(window, { FLOW_STAGES, FLOW_MAP, FLOW_SPINE, FLOW_DOORS_MAX, flowMapRow });
