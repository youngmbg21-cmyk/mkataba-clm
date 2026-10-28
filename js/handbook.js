// HaTi — THE HANDBOOK: one chapter per thing a person can do, in both books.
/* ============================================================================
   THE HANDBOOK (owner, 26 Oct 2026: "a page with a link in the guide page that
   shows instructions … the same exact instructions format [as the Discover
   user guide] … in subsections … and a rule that whenever the platform changes
   or new features are added, the guide instruction book is updated")
   ----------------------------------------------------------------------------
   This file is the BOOK: the parts (the Guide's own stages, with Getting
   around first and Settings last), and every chapter as data. The page that
   draws it is js/views/handbook.js. Nothing here touches the DOM, so node can
   read it (test/f937-every-change-updates-the-handbook.test.js) and the
   browser publishes it.

   A CHAPTER'S WORDS CARRY MARKERS, never typed labels:
     {ui:key}    a button or word as the screen prints it — the dictionary key,
                 so a renamed label follows and a retired one FAILS the test
     {door:key}  a live door: a place word (CA_PLACES), a place inside one
                 (NAV_PLACES) or 'handbook' — drawn as a chip that takes you
                 there through Jambo's one mover (caGo), greyed with why when
                 the reader may not use it
   Every text field is {en, sv}. `doors` and `acts` say which doors the
   chapter covers (the test's coverage); `words` are the everyday words a
   "how do I …" question is matched on (navReadHandbook, round 4); `shot` is
   the picture's recipe (test/chromium/handbook-verify.js takes it on the
   seeded world and draws the red boxes from the elements' own positions), or
   `noShot` says plainly why there is none.
   ========================================================================== */
/* the day a person last read the whole book against the running app (the rule's foot line) */
const HANDBOOK_CHECKED = '2026-10-28';

/* THE PARTS, in the Guide's order: a part with `gd` takes its name and its
   line from the Guide's own words (gd_s_<k>, gd_s_<k>_w: one fact, one home) */
const HANDBOOK_PARTS = [
  { k: 'around', w: 'hbk_part_around', sub: 'hbk_part_around_w' },
  { k: 'ask', gd: 'ask' },
  { k: 'draft', gd: 'draft' },
  { k: 'agree', gd: 'agree' },
  { k: 'sign', gd: 'sign' },
  { k: 'keep', gd: 'keep' },
  { k: 'see', gd: 'see' },
  { k: 'settings', w: 'gd_p_settings', sub: 'hbk_part_settings_w' },
];

const _hbkFree = { en: 'Free', sv: 'Gratis' };
const _hbkCall = (n, what) => ({ en: `${n} Jambo call${n === 1 ? '' : 's'} ${what.en}`, sv: `${n} Jambo-anrop ${what.sv}` });

const HANDBOOK_CHAPTERS = [
  /* ======================= PART 0 — GETTING AROUND ======================= */
  { k: '0.1', part: 'around', round: 1,
    title: { en: 'Home: what needs you, your book, the Board', sv: 'Hem: vad som behöver dig, din bok, Tavlan' },
    eyebrow: { en: 'The first screen', sv: 'Första skärmen' },
    what: { en: 'On a computer HaTi opens on Home. Jambo\'s box is at the top, Needs you under it (everything waiting on you, the contract\'s number first on every row), then your book: the Board, your contracts, the Calendar and the Explorer.',
      sv: 'På en dator öppnar HaTi på Hem. Jambos ruta överst, Behöver dig under den (allt som väntar på dig, avtalets nummer först på varje rad), sedan din bok: Tavlan, dina avtal, Kalendern och Utforskaren.' },
    when: [{ en: 'Every morning: what is waiting, and whose move it is.', sv: 'Varje morgon: vad som väntar, och vems drag det är.' },
      { en: 'When you are lost: the bar\'s HaTi mark always brings you back here.', sv: 'När du tappat bort dig: HaTi-märket i listen tar dig alltid hit.' }],
    path: ['door:counter', { en: 'or press HaTi in the bar', sv: 'eller tryck HaTi i listen' }],
    how: [{ en: 'Read Needs you. Each row has one button with one word ({ui:nd_btn_sign}, {ui:nd_btn_review}, {ui:nd_btn_fill} …): press it and you land on that act.', sv: 'Läs Behöver dig. Varje rad har en knapp med ett ord ({ui:nd_btn_sign}, {ui:nd_btn_review}, {ui:nd_btn_fill} …): tryck och du landar på den handlingen.' },
      { en: 'Jambo\'s ready pieces come first; "Show all N" opens the whole desk on the Board.', sv: 'Jambos färdiga stycken kommer först; "Visa alla N" öppnar hela disken på Tavlan.' },
      { en: 'Under it, your book: {door:board} for the figures, {door:contracts} for every contract, {door:calendar} and {door:explorer}.', sv: 'Under det, din bok: {door:board} för siffrorna, {door:contracts} för alla avtal, {door:calendar} och {door:explorer}.' }],
    tip: { en: 'There is no menu on the left. Every page is a word: type it in Jambo\'s box, or type / and pick from the list.', sv: 'Det finns ingen meny till vänster. Varje sida är ett ord: skriv det i Jambos ruta, eller skriv / och välj i listan.' },
    cost: _hbkFree, doors: ['counter', 'needs', 'board', 'work'], acts: [],
    words: { en: ['home', 'start page', 'first screen', 'needs you', 'needs me', 'what is waiting'], sv: ['hem', 'startsidan', 'behöver mig', 'vad väntar'] },
    shots: [
      { go: [{ place: 'counter' }], boxes: [{ sel: '#cn-needs .nd-btn', step: 1 }, { sel: '[data-nd-all="jambo"]', step: 2 }], cap: { en: 'Each row of Needs you has one button with one word (1); Jambo\'s ready pieces come first, with Show all (2).', sv: 'Varje rad i Behöver dig har en knapp med ett ord (1); Jambos färdiga stycken kommer först, med Visa alla (2).' } },
      { go: [{ place: 'counter' }], boxes: [{ sel: '#cn-chips', step: 3 }], cap: { en: 'Under the box, the doors to your book: the Board, contracts, the calendar, a new agreement (3).', sv: 'Under rutan, dörrarna till din bok: Tavlan, avtal, kalendern, ett nytt avtal (3).' } }] },

  { k: '0.2', part: 'around', round: 1,
    title: { en: 'Ask Jambo, or type "/"', sv: 'Fråga Jambo, eller skriv "/"' },
    eyebrow: { en: 'Every box', sv: 'Varje ruta' },
    what: { en: 'One box, on every page, with one placeholder: "{ui:jl_ph_any}". A page\'s one name takes you there, free. Anything else you type goes to Jambo, and the panel turns into his conversation. On the Board what can be drawn is drawn first, then explained.',
      sv: 'En ruta, på varje sida, med en text: "{ui:jl_ph_any}". En sidas namn, ett ord, tar dig dit, gratis. Allt annat du skriver går till Jambo, och panelen blir hans samtal. På Tavlan ritas det som kan ritas först, sedan förklaras det.' },
    when: [{ en: '"obligations", "approvals", "the Kabras contract": to get somewhere.', sv: '"åtaganden", "godkännanden", "Kabras-avtalet": för att komma någonstans.' },
      { en: '"which contracts end this year?": to get an answer with a chart.', sv: '"vilka avtal löper ut i år?": för ett svar med ett diagram.' },
      { en: '"how do I send this for review?": to get the Handbook\'s chapter.', sv: '"hur skickar jag det här på granskning?": för Handbokens kapitel.' }],
    path: [{ en: 'The box at the top of Home, or at the foot of Jambo\'s panel on every page', sv: 'Rutan överst på Hem, eller längst ned i Jambos panel på varje sida' }],
    how: [{ en: 'Type a page\'s name, or / and pick it. Jambo moves you and presses nothing else.', sv: 'Skriv en sidas namn, eller / och välj. Jambo flyttar dig och trycker inget annat.' },
      { en: 'Type a question. Jambo\'s brain answers it, one call. Where no AI key is set, his free readings (counts, lists, dates) still answer, so the box is never dead.', sv: 'Skriv en fråga. Jambos hjärna besvarar den, ett anrop. Där ingen AI-nyckel är satt svarar hans fria avläsningar (antal, listor, datum) ändå, så rutan är aldrig död.' },
      { en: 'Say "them" or "these" for the last answer\'s set: "show them on the board".', sv: 'Säg "dem" eller "dessa" för förra svarets mängd: "visa dem på tavlan".' },
      { en: 'Every page\'s panel opens on {ui:pd_tab_overview}, and there is no Jambo tab to press. {ui:pd_tab_overview} says what the page holds: one sentence, its facts (each with its link at the end of the row), then "{ui:jov_ask_me}" with what he can do for you, a call\'s cost said beside it. Beside a contract the {ui:pd_tab_dossier} is its Overview.', sv: 'Varje sidas panel öppnar på {ui:pd_tab_overview}, och det finns ingen Jambo-flik att trycka på. {ui:pd_tab_overview} säger vad sidan rymmer: en mening, dess fakta (var och en med sin länk i slutet av raden), sedan "{ui:jov_ask_me}" med vad han kan göra åt dig, ett anrops kostnad sagd bredvid. Bredvid ett avtal är {ui:pd_tab_dossier} dess översikt.' },
      { en: 'Ask him something and the same panel turns into his conversation: {ui:pd_tab_copilot} heads it, his greeting first, then his answers; while he works on one, three dark dots pulse in turn where his answer will appear, so you know he has not frozen. Right above the box, "‹ {ui:pd_tab_overview}" (beside a contract "‹ {ui:pd_tab_dossier}") takes you back to the page\'s links in one press, so you never scroll up through the talk to find them. Back on {ui:pd_tab_overview}, "{ui:pd_tab_copilot} ›" stands in the same spot once something has been said, and opens the conversation where it was, free.', sv: 'Fråga honom något så blir samma panel hans samtal: {ui:pd_tab_copilot} står överst, hans hälsning först, sedan hans svar; medan han arbetar på ett pulserar tre mörka prickar i tur och ordning där hans svar kommer, så du vet att han inte har fastnat. Precis ovanför rutan tar "‹ {ui:pd_tab_overview}" (bredvid ett avtal "‹ {ui:pd_tab_dossier}") dig tillbaka till sidans länkar med ett tryck, så du skrollar aldrig upp genom samtalet för att hitta dem. Tillbaka på {ui:pd_tab_overview} står "{ui:pd_tab_copilot} ›" på samma plats när något har sagts, och öppnar samtalet där det var, gratis.' },
      { en: 'The bin at the end of that line ({ui:int_clear_conversation}) empties the conversation. It is one conversation, so it empties it everywhere.', sv: 'Papperskorgen i slutet av den raden ({ui:int_clear_conversation}) tömmer samtalet. Det är ett samtal, så den tömmer det överallt.' },
      { en: 'One word that is a page\'s name ("settings", "approvals", "calendar") moves you there at once, free, in every Jambo box: a page\'s panel, the box at the top of Home and Jambo\'s window (the ✦ in the top bar). Anything else you type goes to Jambo\'s brain, one call each: another single word, a question, or the long way of asking to move ("take me to settings"), which he reads whole and can take you to any page or setting. He also works the page in front of you with its own buttons: on a list he searches it, picks a tab, sets a filter or opens a saved view ("only the overdue ones", "find Naivas") and says under his answer what he pressed; on the Board he draws a chart when you ask for one ("chart value by stream"), with Undo; in the Calendar he plans your time and hands anything else to the chat. Home\'s chips, the "{ui:jov_ask_me}" offers and the "/" list still move you, free.', sv: 'Ett ord som är en sidas namn ("inställningar", "godkännanden", "kalender") flyttar dig dit direkt, gratis, i varje Jambo-ruta: en sidas panel, rutan överst på Hem och Jambos fönster (✦ i listen överst). Allt annat du skriver går till Jambos hjärna, ett anrop var: ett annat enstaka ord, en fråga, eller det långa sättet att be om att flytta ("ta mig till inställningar"), som han läser helt och kan ta dig till vilken sida eller inställning som helst. Han sköter också sidan framför dig med dess egna knappar: i en lista söker han, väljer en flik, sätter ett filter eller öppnar en sparad vy ("bara de försenade", "hitta Naivas") och säger under svaret vad han tryckte på; på Tavlan ritar han ett diagram när du ber om det ("diagram över värde per ström"), med Ångra; i Kalendern planerar han din tid och lämnar allt annat till chatten. Hems knappar, erbjudandena under "{ui:jov_ask_me}" och "/"-listan flyttar dig fortfarande, gratis.' },
      { en: 'Ask about HaTi itself on any page ("what can I do here?", "who can change the rates?", "what is the Handbook about?"): Jambo answers from this book, in steps, with the chapter as a button under the answer. You stay where you asked.', sv: 'Fråga om HaTi självt på vilken sida som helst ("vad kan jag göra här?", "vem kan ändra kurserna?", "vad handlar Handboken om?"): Jambo svarar ur den här boken, steg för steg, med kapitlet som en knapp under svaret. Du stannar där du frågade.' }],
    tip: { en: 'Typing never acts. A send, a signature or a change always waits for your press, with its cost said first.', sv: 'Att skriva utför aldrig något. Ett utskick, en signatur eller en ändring väntar alltid på ditt tryck, med kostnaden sagd först.' },
    cost: { en: 'Free to move by a page\'s one name, "/" or a chip; anything else typed is one call to the brain', sv: 'Gratis att flytta med en sidas namn, "/" eller en knapp; allt annat du skriver är ett anrop till hjärnan' }, doors: ['help', 'back', 'next', 'insights'], acts: [],
    words: { en: ['ask jambo', 'jambo box', 'slash', 'type a place', 'talk to jambo', 'chat'], sv: ['fråga jambo', 'jambos ruta', 'snedstreck', 'chatta'] },
    shots: [
      { go: [{ place: 'counter' }, { type: '/' }], boxes: [{ sel: '#cn-q', step: 1 }, { sel: '#cn-pop', step: 1 }], cap: { en: 'Type / and the places you use most are listed (1).', sv: 'Skriv / så listas platserna du använder mest (1).' } },
      { go: [{ place: 'oblig' }], boxes: [{ sel: '#ins-panel [data-jl-home]', step: 4 }, { sel: '#jl-q', step: 7 }], cap: { en: 'Every panel opens on Overview, with no Jambo tab (4); a page\'s one name typed in the box moves you there, free (7).', sv: 'Varje panel öppnar på Översikt, utan Jambo-flik (4); en sidas namn i rutan flyttar dig dit, gratis (7).' } },
      { go: [{ place: 'oblig' }, { eval: "ai.history.push({ role: 'user', text: 'What is due this week?' }, { role: 'assistant', text: 'Two duties are due this week: a payment to Kabras Sugar on Thursday and a report to Naivas on Friday.' }); jlTalkPress();" }], boxes: [{ sel: '#ins-panel [data-jl-talk]', step: 5 }, { sel: '#ins-panel .jl-foot [data-jb-door] .jb-door-back', step: 5 }, { sel: '#ins-panel .jl-foot [data-jb-door] [data-jb-bin]', step: 6 }], cap: { en: 'Asked something, the panel is his conversation (5); "‹ Overview" right above the box goes back, the bin at its end empties the talk (6).', sv: 'När du frågat är panelen hans samtal (5); "‹ Översikt" precis ovanför rutan går tillbaka, papperskorgen i slutet tömmer samtalet (6).' } }] },

  { k: '0.3', part: 'around', round: 1,
    title: { en: 'The bell and Needs you: one list', sv: 'Klockan och Behöver dig: en lista' },
    eyebrow: { en: 'Top right', sv: 'Uppe till höger' },
    what: { en: 'The bell counts exactly what Needs you lists: the same rows, the same number. News (things that ask nothing of you) is never counted.',
      sv: 'Klockan räknar precis det Behöver dig listar: samma rader, samma siffra. Nyheter (sådant som inte ber dig om något) räknas aldrig.' },
    when: [{ en: 'A number on the bell: something waits on you.', sv: 'En siffra på klockan: något väntar på dig.' },
      { en: 'You were told by email: the bell has the same thing, with its door.', sv: 'Du fick ett mejl: klockan har samma sak, med sin dörr.' }],
    path: ['door:alerts', { en: 'the bell, or the Alerts tab of the right-hand panel', sv: 'klockan, eller fliken Aviseringar i högerpanelen' }],
    how: [{ en: 'Press the bell. Needs you is first; News under it.', sv: 'Tryck på klockan. Behöver dig först; Nyheter under.' },
      { en: 'Press {ui:act_open} on a row and you land on the contract, on the act it asks for.', sv: 'Tryck {ui:act_open} på en rad och du landar på avtalet, på handlingen den ber om.' }],
    tip: { en: 'A thing you are owed is said to you once, where you look: here, on Home, and on your phone if alerts are on. Other pages point here.', sv: 'Något som väntar på dig sägs en gång, där du tittar: här, på Hem och i telefonen om aviseringar är på. Andra sidor pekar hit.' },
    cost: _hbkFree, doors: ['alerts', 'news'], acts: [],
    words: { en: ['bell', 'alerts', 'notifications', 'news'], sv: ['klockan', 'aviseringar', 'notiser', 'nyheter'] },
    shots: [
      { go: [{ place: 'counter' }], boxes: [{ sel: '#hdr-notify', step: 1 }], cap: { en: 'The bell, top right, counts what Needs you lists (1).', sv: 'Klockan, uppe till höger, räknar det Behöver dig listar (1).' } },
      { go: [{ place: 'counter' }, { panel: 'alerts' }], boxes: [{ sel: '[data-pt-face="alerts"]', step: 1 }, { sel: '#panel-body .nd-btn', step: 2 }], cap: { en: 'The bell\'s list (1); each row\'s button lands on what it asks (2).', sv: 'Klockans lista (1); varje rads knapp landar på det den ber om (2).' } }] },

  { k: '0.4', part: 'around', round: 1,
    title: { en: 'A contract\'s Dossier', sv: 'Ett avtals Dossier' },
    eyebrow: { en: 'Beside the paper', sv: 'Bredvid papperet' },
    what: { en: 'Open a contract and its paper stands in the middle, with Jambo\'s panel beside it. The panel has three tabs: {ui:pd_tab_dossier} (the six stages down one line, what is owed under each), {ui:pd_tab_clauses} (the deep read, clause by clause) and {ui:pd_face_w_red} (their changes and yours).',
      sv: 'Öppna ett avtal och dess papper står i mitten, med Jambos panel bredvid. Panelen har tre flikar: {ui:pd_tab_dossier} (de sex stegen på en rad, det som väntar under varje), {ui:pd_tab_clauses} (djupläsningen, klausul för klausul) och {ui:pd_face_w_red} (deras ändringar och dina).' },
    when: [{ en: 'Any time you open a contract: start here.', sv: 'Varje gång du öppnar ett avtal: börja här.' },
      { en: 'To see at a glance which stage it is in and what still blocks it.', sv: 'För att på en gång se vilket steg det är i och vad som fortfarande hindrar.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: 'Dossier', sv: 'Dossier' }],
    how: [{ en: 'Read the spine: six stages down one line, the current one marked, the work owed under it.', sv: 'Läs ryggraden: sex steg på en rad, det aktuella markerat, arbetet som väntar under.' },
      { en: 'Press a line. What it opens comes to the middle, where the paper was; the Dossier never moves. "‹ Paper" or Esc brings the paper back.', sv: 'Tryck på en rad. Det den öppnar kommer till mitten, där papperet var; Dossiern flyttar sig aldrig. "‹ Papper" eller Esc tar papperet tillbaka.' },
      { en: 'Under the stages: Obligations, the stage\'s acts (Amend, Review, Send …), links last.', sv: 'Under stegen: Åtaganden, stegets handlingar (Ändra, Granska, Skicka …), länkar sist.' }],
    tip: { en: 'The paper itself is never edited by hand. Changes go through Redlines, so every change is a record.', sv: 'Papperet redigeras aldrig för hand. Ändringar går genom Ändringar, så varje ändring är en post.' },
    cost: _hbkFree, doors: ['document', 'history', 'brief'], acts: ['paper', 'dossier', 'hist', 'where', 'family', 'opened', 'clauses'],
    words: { en: ['dossier', 'open a contract', 'the paper', 'contract panel', 'stages', 'spine'], sv: ['dossier', 'öppna ett avtal', 'papperet', 'stegen'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'copilot' }, { waitFor: 'button[data-ds-focus="fill"]' }], boxes: [{ sel: 'button[data-ds-focus="fill"]', step: 1 }, { sel: '[data-pd-ds-fill]', step: 2 }], cap: { en: 'The spine, the current stage marked (1); a line that opens what it says (2).', sv: 'Ryggraden, det aktuella steget markerat (1); en rad som öppnar det den säger (2).' } },
      { go: [{ open: 'MK-A1', face: 'copilot' }], boxes: [{ sel: '[data-ds-at="ob"]', step: 3 }, { sel: '[data-pd-mn-go="#ws-m-amend"]', step: 3 }, { sel: '[data-pd-ds-page="hist"]', step: 3 }], cap: { en: 'Under the stages: Obligations, the stage\'s acts and the links (3).', sv: 'Under stegen: Åtaganden, stegets handlingar och länkarna (3).' } }] },

  { k: '0.5', part: 'around', round: 1,
    title: { en: 'The right-hand panel: Guide · Alerts · Notes · Activity', sv: 'Högerpanelen: Guide · Aviseringar · Anteckningar · Aktivitet' },
    eyebrow: { en: 'Top right', sv: 'Uppe till höger' },
    what: { en: 'One panel, four faces. {ui:gd_tab} is the map of every page in the order a contract lives; {ui:sh_alerts} is the bell; {ui:ng_card_notes} is greyed until a contract is in front, and then opens its notes; {ui:sh_activity} is what happened lately.',
      sv: 'En panel, fyra ansikten. {ui:gd_tab} är kartan över varje sida i den ordning ett avtal lever; {ui:sh_alerts} är klockan; {ui:ng_card_notes} är grå tills ett avtal är framför, och öppnar då dess anteckningar; {ui:sh_activity} är vad som hänt nyligen.' },
    when: [{ en: 'You do not know where a page is: the Guide lists them all, and says "You are here".', sv: 'Du vet inte var en sida finns: Guiden listar alla, och säger "Du är här".' },
      { en: 'You want this book: it is the Guide\'s last row but one.', sv: 'Du vill ha den här boken: den är Guidens näst sista rad.' }],
    path: ['door:guide', { en: 'or type "guide"', sv: 'eller skriv "guide"' }],
    how: [{ en: 'Open the panel on any tab; press another tab to switch. A press on the tab in front does nothing.', sv: 'Öppna panelen på valfri flik; tryck på en annan för att byta. Ett tryck på fliken framför gör inget.' },
      { en: 'On the Guide, press a page and the panel lets go and takes you there. A number on a row is that page\'s own count.', sv: 'I Guiden, tryck på en sida och panelen släpper och tar dig dit. En siffra på en rad är sidans egen räkning.' },
      { en: 'Jambo\'s box is at the foot of every face.', sv: 'Jambos ruta finns längst ned i varje ansikte.' }],
    tip: { en: 'The Guide is where things ARE. This Handbook is how to DO them. The Guide\'s row "{ui:gd_p_handbook}" opens it.', sv: 'Guiden visar var saker FINNS. Handboken visar hur man GÖR dem. Guidens rad "{ui:gd_p_handbook}" öppnar den.' },
    cost: _hbkFree, doors: ['guide', 'activity', 'handbook', 'recent'], acts: [],
    words: { en: ['guide', 'right panel', 'side panel', 'activity', 'handbook', 'instructions', 'manual'], sv: ['guide', 'högerpanel', 'sidopanel', 'aktivitet', 'handbok', 'instruktioner'] },
    shots: [
      { go: [{ place: 'counter' }, { panel: 'guide' }], boxes: [{ sel: '#panel-tabs', step: 1 }, { sel: '[data-gd-go="requests"]', step: 2 }], cap: { en: 'The panel\'s tabs (1); a page\'s row on the Guide, with its own count (2).', sv: 'Panelens flikar (1); en sidas rad i Guiden, med sin egen räkning (2).' } },
      { go: [{ place: 'counter' }, { panel: 'guide' }], boxes: [{ sel: '[data-gd-go="handbook"]', step: 2 }, { sel: '#panel-ask', step: 3 }], cap: { en: 'The Handbook\'s own row (2); Jambo\'s box at the foot of every face (3).', sv: 'Handbokens egen rad (2); Jambos ruta längst ned i varje ansikte (3).' } }] },

  { k: '0.6', part: 'around', round: 1,
    title: { en: 'Finding a contract', sv: 'Hitta ett avtal' },
    eyebrow: { en: 'Contracts', sv: 'Avtal' },
    what: { en: 'Contracts is a place on Home: a wall of papers or a list, with one head: a search box, tabs and filter chips. A press chooses, a second press opens, Esc lets go.',
      sv: 'Avtal är en plats på Hem: en vägg av papper eller en lista, med ett huvud: en sökruta, flikar och filterchips. Ett tryck väljer, ett andra öppnar, Esc släpper.' },
    when: [{ en: '"The Kabras contract", "contracts ending this quarter in Sales": type it in Jambo\'s box and the list narrows.', sv: '"Kabras-avtalet", "avtal som löper ut detta kvartal i Sälj": skriv det i Jambos ruta och listan smalnar.' },
      { en: 'You opened it recently: the page name in the bar opens Recent.', sv: 'Du öppnade det nyligen: sidnamnet i listen öppnar Senaste.' }],
    path: ['door:contracts', { en: 'List or Wall', sv: 'Lista eller Vägg' }],
    how: [{ en: 'Read a row: the mark that leads it says where the contract stands (a ticked circle signed, a half circle in progress, a dashed circle a draft); the grey line under the title says the party, the reference, the stage and when it last moved; Stream is a soft chip, and Our standards says the worst news first ("2 missing", "All 8 met", or "Not checked yet").', sv: 'Läs en rad: märket först säger var avtalet står (en bockad cirkel signerat, en halv cirkel pågår, en streckad cirkel ett utkast); den grå raden under titeln säger parten, referensen, steget och när det senast rörde sig; Värdeflöde är en mjuk bricka, och Våra standarder säger den värsta nyheten först ("2 saknas", "Alla 8 uppfyllda" eller "Inte kontrollerat än").' },
      { en: 'Press {door:list} or {door:wall} in the head to change how it is shown.', sv: 'Tryck {door:list} eller {door:wall} i huvudet för att byta visning.' },
      { en: 'Type in the box to narrow. The tabs and chips only offer choices that give rows.', sv: 'Skriv i rutan för att smalna. Flikarna och chipsen erbjuder bara val som ger rader.' },
      { en: 'The archive is its own view: type "{door:archived}".', sv: 'Arkivet är en egen vy: skriv "{door:archived}".' },
      { en: 'Beside the list, Jambo\'s {ui:pd_tab_overview} counts what it holds (what is expiring, what owes details), then Discover, the questions kept for every contract, then the drop area for a new file.', sv: 'Bredvid listan räknar Jambos {ui:pd_tab_overview} vad den rymmer (vad som löper ut, vad som saknar uppgifter), sedan Upptäck, frågorna som sparats för alla avtal, sedan släppytan för en ny fil.' }],
    tip: { en: 'A contract in a private stream shows only to the people named on it, admins too. A code-named deal shows its code name to everyone outside its list.', sv: 'Ett avtal i en privat ström syns bara för dem som är namngivna, även admins. Ett kodnamnat avtal visar sitt kodnamn för alla utanför listan.' },
    cost: _hbkFree, doors: ['contracts', 'list', 'wall', 'archived', 'recent'], acts: [],
    words: { en: ['find a contract', 'search contracts', 'contracts list', 'the wall', 'archive', 'recent'], sv: ['hitta ett avtal', 'sök avtal', 'avtalslistan', 'väggen', 'arkiv'] },
    shots: [
      { go: [{ place: 'contracts' }], boxes: [{ sel: '.ct-seg', step: 1 }, { sel: '#ct-q', step: 2 }], cap: { en: 'List or Wall (1); the box narrows the list (2).', sv: 'Lista eller Vägg (1); rutan smalnar listan (2).' } },
      { go: [{ place: 'contracts' }], boxes: [{ sel: '[data-ct-archive]', step: 3 }, { sel: '[data-reg-view="expiring90"]', step: 2 }], cap: { en: 'A tab narrows to what it counts (2); the archive is one press away (3).', sv: 'En flik smalnar till det den räknar (2); arkivet är ett tryck bort (3).' } },
      { go: [{ place: 'contracts' }], boxes: [{ sel: '#ig-dock .jov-facts', step: 4 }, { sel: '#ac-disc', step: 4 }], cap: { en: 'Beside the list: Jambo\'s Overview counts it, then Discover (4).', sv: 'Bredvid listan: Jambos översikt räknar den, sedan Upptäck (4).' } }] },

  /* ======================= PART 1 — SOMEONE ASKS ======================= */
  { k: '1.1', part: 'ask', round: 2,
    title: { en: 'Requests: ask legal for a contract or advice', sv: 'Förfrågningar: be juristerna om ett avtal eller råd' },
    eyebrow: { en: 'Requests page', sv: 'Förfrågningar' },
    what: { en: 'A colleague who needs a contract, or a legal answer, raises a request. It lands with the stream\'s editors, is tracked until answered, and the paper that fits is found without Jambo\'s brain.',
      sv: 'En kollega som behöver ett avtal, eller ett juridiskt svar, lägger en förfrågan. Den hamnar hos strömmens redaktörer, följs tills den är besvarad, och papperet som passar hittas utan Jambos hjärna.' },
    when: [{ en: 'Sales needs an NDA with a new supplier.', sv: 'Sälj behöver ett sekretessavtal med en ny leverantör.' },
      { en: 'Somebody needs advice on a clause, not a new paper: advice is a request too.', sv: 'Någon behöver råd om en klausul, inte ett nytt papper: råd är också en förfrågan.' }],
    path: ['door:requests'],
    how: [{ en: 'Read a row: a pen marks a request for a contract, a question mark a request for advice; the reference, who asked, the stream and the day asked are on the grey line under it. With shows who holds it, their initials over "holds it", or "Nobody yet" in amber; Promised by gives the day and how far off it is, or "Not promised yet".', sv: 'Läs en rad: en penna märker en förfrågan om ett avtal, ett frågetecken en förfrågan om råd; referensen, vem som frågade, värdeflödet och dagen står på den grå raden under. Hos visar vem som har den, initialerna över "har den", eller "Ingen ännu" i bärnsten; Utlovad senast ger dagen och hur långt bort den är, eller "Inget datum lovat".' },
      { en: 'Press the new-request button, say what is needed and for whom; attach up to 3 files of 5 MB.', sv: 'Tryck på knappen för ny förfrågan, säg vad som behövs och för vem; bifoga upp till 3 filer på 5 MB.' },
      { en: 'The editors are emailed and the request shows on their Needs you. Each tab\'s number is the list behind it.', sv: 'Redaktörerna mejlas och förfrågan visas på deras Behöver dig. Varje fliks siffra är listan bakom den.' },
      { en: 'Open a request: the paper that fits is already suggested. Press {ui:ik_act_draft} and the one New agreement sheet opens with it.', sv: 'Öppna en förfrågan: papperet som passar är redan föreslaget. Tryck {ui:ik_act_draft} så öppnas det enda Nytt avtal-arket med det.' }],
    tip: { en: 'A person who may not make new paper is sent here instead: their refusal names who lifts it, with Ask an admin. An admin can set up request lanes in Settings that draft a plain request by themselves; a lane with a value limit shows it on its row.', sv: 'En person som inte får skapa nytt papper skickas hit i stället: avslaget säger vem som lyfter det, med Fråga en admin. En admin kan ställa in förfrågningsspår i Inställningar som skriver ut en enkel förfrågan av sig själva; ett spår med en värdegräns visar den på sin rad.' },
    cost: _hbkFree, doors: ['requests'], acts: [],
    words: { en: ['request', 'ask legal', 'raise a request', 'advice', 'intake'], sv: ['förfrågan', 'be juristerna', 'råd'] },
    shots: [
      { go: [{ place: 'requests' }], boxes: [{ sel: '[data-ik-view="open"]', step: 2 }, { sel: '[data-ins-act="draft"]', step: 3 }], cap: { en: 'Each tab\'s number is the list behind it (2); Start the draft (3).', sv: 'Varje fliks siffra är listan bakom den (2); Påbörja utkastet (3).' } },
      { go: [{ place: 'requests' }], boxes: [{ sel: '#ins-panel .ik-fit-sec', step: 3 }], cap: { en: 'The paper that fits, found without Jambo\'s brain (3).', sv: 'Papperet som passar, hittat utan Jambos hjärna (3).' } }] },

  { k: '1.2', part: 'ask', round: 2,
    title: { en: 'Import: bring in the contracts you already have', sv: 'Import: ta in avtalen du redan har' },
    eyebrow: { en: 'Import page', sv: 'Import' },
    what: { en: 'Drop a folder of old contracts and HaTi reads each file into a record: a name, the parties, the dates. One table, the ones that need you first; a press chooses, the form beside it is the one place to correct and file.',
      sv: 'Släpp en mapp med gamla avtal så läser HaTi varje fil till en post: ett namn, parterna, datumen. En tabell, de som behöver dig först; ett tryck väljer, formuläret bredvid är det enda stället att rätta och arkivera.' },
    when: [{ en: 'You are moving to HaTi and have a drive of signed PDFs and Word files.', sv: 'Ni flyttar till HaTi och har en disk med signerade PDF:er och Word-filer.' },
      { en: 'A batch of contracts arrived from an acquisition.', sv: 'En bunt avtal kom från ett förvärv.' }],
    path: ['door:import'],
    how: [{ en: 'Drop the files, or a whole folder. Several files at once always go through Import, never the single Upload.', sv: 'Släpp filerna, eller en hel mapp. Flera filer på en gång går alltid genom Import, aldrig den enskilda Uppladdningen.' },
      { en: 'Press a row to choose it; correct what the reader got wrong in the form beside; press {ui:mig_file_it}.', sv: 'Tryck på en rad för att välja; rätta det läsaren fick fel i formuläret bredvid; tryck {ui:mig_file_it}.' },
      { en: '{ui:mig_check_all_other} walks every file\'s words so you check them one after another.', sv: '{ui:mig_check_all_other} går igenom varje fils ord så du kontrollerar dem en efter en.' }],
    tip: { en: 'A file that looks unsigned is parked, never sealed as signed. A contract that renews by itself gets a yearly obligation with its notice day.', sv: 'En fil som ser osignerad ut parkeras, förseglas aldrig som signerad. Ett avtal som förnyas av sig självt får ett årligt åtagande med sin uppsägningsdag.' },
    cost: { en: 'Free; Jambo\'s read of a file says its cost', sv: 'Gratis; Jambos läsning av en fil säger sin kostnad' }, doors: ['import'], acts: [],
    words: { en: ['import', 'bring in old contracts', 'migrate', 'drop a folder', 'bulk upload'], sv: ['import', 'ta in gamla avtal', 'migrera', 'släpp en mapp'] },
    shots: [
      { go: [{ place: 'import' }], boxes: [{ sel: '#mig-drop', step: 1 }], cap: { en: 'Drop the files, or a whole folder, here (1).', sv: 'Släpp filerna, eller en hel mapp, här (1).' } },
      { go: [{ place: 'import' }], boxes: [{ sel: '#mig-status', step: 1 }, { sel: '#mig-folder', step: 1 }], cap: { en: 'Say how they stand and which stream they go to, before they are read (1).', sv: 'Säg hur de står och vilken ström de hör till, innan de läses (1).' } }] },

  /* ======================= PART 2 — DRAFT IT ======================= */
  { k: '2.1', part: 'draft', round: 1,
    title: { en: 'New agreement: the one sheet', sv: 'Nytt avtal: det enda arket' },
    eyebrow: { en: 'From anywhere', sv: 'Varifrån som helst' },
    what: { en: 'Every way of starting a contract opens the same sheet beside Jambo: a box to say what you need, then {ui:na_tab_ours} (a template) or {ui:na_tab_theirs} (their file). The details you typed (party, value, dates) are read into the form without Jambo\'s brain, each saying where it came from.',
      sv: 'Varje sätt att starta ett avtal öppnar samma ark bredvid Jambo: en ruta för vad du behöver, sedan {ui:na_tab_ours} (en mall) eller {ui:na_tab_theirs} (deras fil). Uppgifterna du skrev (part, värde, datum) läses in i formuläret utan Jambos hjärna, var och en med sin källa.' },
    when: [{ en: '"an NDA with Volvo, mutual, two years": the closest paper is picked and the facts filled.', sv: '"ett sekretessavtal med Volvo, ömsesidigt, två år": närmaste papper väljs och uppgifterna fylls i.' },
      { en: 'The other side sent their paper: drop it on the sheet instead.', sv: 'Motparten skickade sitt papper: släpp det på arket i stället.' }],
    path: ['door:draft', { en: 'or the + on Home', sv: 'eller + på Hem' }],
    how: [{ en: 'Say what you need in a sentence. The three closest papers are offered; when one is clearly closest it is chosen.', sv: 'Säg vad du behöver i en mening. De tre närmaste papperen erbjuds; när ett är klart närmast väljs det.' },
      { en: 'Check the rows: Term · What it says · Where it came from. Change anything.', sv: 'Kontrollera raderna: Term · Vad det säger · Varifrån det kom. Ändra vad som helst.' },
      { en: 'Pick a stream. {ui:act_create} stays grey until there is a paper AND a stream. Nothing is minted before you press it.', sv: 'Välj en ström. {ui:act_create} är grå tills det finns ett papper OCH en ström. Inget skapas innan du trycker.' }],
    tip: { en: 'Nothing fits? The sheet sends you to Requests so legal can draft it. Easily confused papers ask one question first. Going to another page puts the sheet away; if you typed something, it asks first.', sv: 'Inget passar? Arket skickar dig till Förfrågningar så juristerna kan skriva det. Papper som är lätta att blanda ihop ställer en fråga först. Går du till en annan sida läggs arket undan; har du skrivit något frågar det först.' },
    cost: { en: 'Free; Jambo\'s read of their file says its cost', sv: 'Gratis; Jambos läsning av deras fil säger sin kostnad' }, doors: ['draft'], acts: [],
    words: { en: ['new agreement', 'new contract', 'draft a contract', 'start a contract', 'create a contract', 'draft from a sentence'], sv: ['nytt avtal', 'skapa avtal', 'skriv ett avtal', 'börja ett avtal'] },
    shots: [
      { go: [{ place: 'counter' }, { fn: 'openNewAgreement' }], boxes: [{ sel: '#dr-say', step: 1 }, { sel: '#na-closest', step: 1 }], cap: { en: 'Say it in a sentence; the three closest papers are offered (1).', sv: 'Säg det i en mening; de tre närmaste papperen erbjuds (1).' } },
      { go: [{ place: 'counter' }, { fn: 'openNewAgreement' }, { click: '[data-wz-tid="ND"]' }], boxes: [{ sel: '#na-card-name', step: 2 }, { sel: '#na-form .na-kt-h', step: 2 }], cap: { en: 'A paper chosen: its rows, Term · What it says · Where it came from (2).', sv: 'Ett papper valt: dess rader, Villkor · Vad det säger · Var det kom ifrån (2).' } },
      { go: [{ place: 'counter' }, { fn: 'openNewAgreement' }], boxes: [{ sel: '#na-file-seg', step: 3 }, { sel: '#na-file-need', step: 3 }], cap: { en: 'Pick a stream; Create waits until there is one (3).', sv: 'Välj en ström; Skapa väntar tills det finns en (3).' } }] },

  { k: '2.2', part: 'draft', round: 1,
    title: { en: 'Upload a document', sv: 'Ladda upp ett dokument' },
    eyebrow: { en: 'Jambo\'s panel', sv: 'Jambos panel' },
    what: { en: 'Drop one Word or PDF file on Jambo\'s panel and it opens as the paper. On arrival Jambo reads it: the brief, a check against Our standards, the risk scan and the blanks, with the cost said before he starts.',
      sv: 'Släpp en Word- eller PDF-fil på Jambos panel så öppnas den som papperet. Vid ankomst läser Jambo den: sammanfattningen, en kontroll mot Våra standarder, riskskanningen och luckorna, med kostnaden sagd innan han börjar.' },
    when: [{ en: 'The other side sent their draft.', sv: 'Motparten skickade sitt utkast.' },
      { en: 'A signed paper arrived that is not in HaTi yet (one file; many go through Import).', sv: 'Ett signerat papper kom som inte finns i HaTi än (en fil; många går genom Import).' }],
    path: ['door:upload', { en: 'or drop the file on Jambo\'s panel', sv: 'eller släpp filen på Jambos panel' }],
    how: [{ en: 'Drop the file. "{ui:pd_drop_t}" is the area; {ui:pd_drop_pick} opens the picker.', sv: 'Släpp filen. "{ui:pd_drop_t}" är ytan; {ui:pd_drop_pick} öppnar väljaren.' },
      { en: 'The file becomes a name and a paper with its clauses. Numbering is read off the file, never invented.', sv: 'Filen blir ett namn och ett papper med sina klausuler. Numreringen läses från filen, hittas aldrig på.' },
      { en: 'Jambo speaks first in his panel: what he read and the doors that follow. Then fill in the details.', sv: 'Jambo talar först i sin panel: vad han läste och dörrarna som följer. Fyll sedan i uppgifterna.' }],
    tip: { en: 'One file at a time. A file with no structure stores no body. A contract in a private stream is read only when you press.', sv: 'En fil i taget. En fil utan struktur lagrar ingen text. Ett avtal i en privat ström läses bara när du trycker.' },
    cost: { en: 'The read\'s cost is said before it runs', sv: 'Läsningens kostnad sägs innan den körs' }, doors: ['upload'], acts: [],
    words: { en: ['upload', 'upload a document', 'upload a file', 'drop a file', 'their draft', 'pdf', 'word file'], sv: ['ladda upp', 'ladda upp ett dokument', 'släpp en fil', 'deras utkast'] },
    shots: [
      { go: [{ place: 'contracts' }], boxes: [{ sel: '#pd-drop [data-pd-drop-pick]', step: 1 }, { sel: '#pd-drop-stream', step: 1 }], cap: { en: 'The drop area under Discover: Choose a file, and its stream asked first (1).', sv: 'Släppytan under Upptäck: Välj en fil, och dess ström frågas först (1).' } }] },

  { k: '2.3', part: 'draft', round: 1,
    title: { en: 'Fill in the details', sv: 'Fyll i uppgifterna' },
    eyebrow: { en: 'The Dossier', sv: 'Dossiern' },
    what: { en: 'One reading of what a contract still owes: the parties, value, dates, stream, signers. It is answered in place on the Dossier; Key terms open in the middle. An empty box that is owed is amber.',
      sv: 'En avläsning av vad ett avtal fortfarande saknar: parterna, värdet, datumen, strömmen, undertecknarna. Det besvaras på plats i Dossiern; Nyckelvillkor öppnas i mitten. En tom ruta som saknas är gul.' },
    when: [{ en: 'A contract shows "N details owed" on Needs you.', sv: 'Ett avtal visar "N uppgifter saknas" på Behöver dig.' },
      { en: 'Before sending or signing: an owed detail blocks the signature.', sv: 'Innan utskick eller signering: en saknad uppgift blockerar signaturen.' }],
    path: ['door:fill', { en: 'or the Dossier\'s owed lines', sv: 'eller Dossierns rader som saknas' }],
    how: [{ en: 'Press {ui:dos_go_fill_in} on the Dossier, or the amber line itself.', sv: 'Tryck {ui:dos_go_fill_in} i Dossiern, eller den gula raden själv.' },
      { en: 'Answer in the box; it saves on its own. {ui:og_kt_title} opens in the middle for the whole list.', sv: 'Svara i rutan; den sparas av sig själv. {ui:og_kt_title} öppnas i mitten för hela listan.' },
      { en: 'Money is in the contract\'s own currency; a missing exchange rate is said, never guessed.', sv: 'Pengar är i avtalets egen valuta; en saknad växelkurs sägs, gissas aldrig.' }],
    tip: { en: 'The blanks in the wording ("[Company]", "[date]") are read off the paper and filled from the record; Jambo suggests, you confirm.', sv: 'Luckorna i texten ("[Bolag]", "[datum]") läses från papperet och fylls från posten; Jambo föreslår, du bekräftar.' },
    cost: _hbkFree, doors: ['fill'], acts: ['fill', 'terms', 'value', 'counterparty', 'category', 'stream', 'rename', 'nda'],
    words: { en: ['fill in', 'fill in the details', 'details', 'key terms', 'value', 'dates', 'blanks'], sv: ['fyll i', 'fyll i uppgifterna', 'uppgifter', 'nyckelvillkor', 'värde'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'copilot' }], boxes: [{ sel: '[data-pd-ds-fill]', step: 1 }], cap: { en: 'Fill › on the Dossier, where something is owed (1).', sv: 'Fyll i › i Dossiern, där något saknas (1).' } },
      { go: [{ open: 'MK-A2', face: 'copilot' }, { click: '[data-pd-ds-fill]' }], boxes: [{ sel: '[data-pd-ck-row="effDate"]', step: 2 }, { sel: '[data-pd-og-saveall]', step: 2 }], cap: { en: 'The owed box, answered in place, and Save (2).', sv: 'Den saknade rutan, besvarad på plats, och Spara (2).' } }] },

  { k: '2.4', part: 'draft', round: 2,
    title: { en: 'Our paper: templates and the builder', sv: 'Vårt papper: mallar och byggaren' },
    eyebrow: { en: 'Our paper page', sv: 'Vårt papper' },
    what: { en: 'The company\'s templates, shelved beside the chosen paper. A template\'s own page is one line: name, status, version, {ui:act_edit}, and {ui:tl_new_contract}. A new standard is built in the builder, section by section.',
      sv: 'Företagets mallar, på hyllor bredvid det valda papperet. En malls egen sida är en rad: namn, status, version, {ui:act_edit} och {ui:tl_new_contract}. En ny standard byggs i byggaren, avsnitt för avsnitt.' },
    when: [{ en: 'You want to see what paper the company has before drafting.', sv: 'Du vill se vilket papper företaget har innan du skriver.' },
      { en: 'Legal wants a new standard NDA.', sv: 'Juristerna vill ha ett nytt standard-sekretessavtal.' }],
    path: ['door:ourpaper'],
    how: [{ en: 'Press a template: its page opens with Jambo beside it, saying what it is for.', sv: 'Tryck på en mall: dess sida öppnas med Jambo bredvid, som säger vad den är till för.' },
      { en: '{ui:tl_new_contract} opens the one New agreement sheet with this paper chosen.', sv: '{ui:tl_new_contract} öppnar det enda Nytt avtal-arket med detta papper valt.' },
      { en: 'A new standard: press the new-standard button and the builder opens. A section moves whole ({ui:tb_move_up} · {ui:tb_move_down}); a note is never wording.', sv: 'En ny standard: tryck på knappen för ny standard så öppnas byggaren. Ett avsnitt flyttas helt ({ui:tb_move_up} · {ui:tb_move_down}); en anteckning är aldrig avtalstext.' }],
    tip: { en: 'A template\'s form fills the wording only when you press {ui:pd_doc_form_go}; until then the form\'s answers are owed and block the signature.', sv: 'En malls formulär fyller texten först när du trycker {ui:pd_doc_form_go}; tills dess saknas formulärets svar och blockerar signaturen.' },
    cost: _hbkFree, doors: ['ourpaper'], acts: [],
    words: { en: ['templates', 'our paper', 'template builder', 'new standard', 'new template'], sv: ['mallar', 'vårt papper', 'mallbyggaren', 'ny standard'] },
    shots: [
      { go: [{ place: 'ourpaper' }], boxes: [{ sel: '[data-tpl-pf="builtin:RM"]', step: 1 }, { sel: '[data-tpl-pf-act="1"]', step: 2 }], cap: { en: 'A template pressed (1); Draft from it opens the one sheet with it chosen (2).', sv: 'En mall tryckt (1); Utkast från den öppnar det enda arket med den vald (2).' } },
      { go: [{ place: 'ourpaper' }], boxes: [{ sel: '#tpl-new', step: 3 }], cap: { en: 'A new standard opens the builder (3).', sv: 'En ny standard öppnar byggaren (3).' } }] },

  { k: '2.5', part: 'draft', round: 2,
    title: { en: 'Our standards: how firm we are', sv: 'Våra standarder: hur fasta vi är' },
    eyebrow: { en: 'Our paper › standards', sv: 'Vårt papper › standarder' },
    what: { en: 'For each kind of clause, the company\'s position: aligned, a deviation, missing, or not applicable. Jambo checks every contract against it and learns from settled rounds. "{ui:std_change_position}" is the admin\'s door to the position.',
      sv: 'För varje slags klausul, företagets position: i linje, en avvikelse, saknas, eller ej tillämplig. Jambo kontrollerar varje avtal mot den och lär av avslutade rundor. "{ui:std_change_position}" är adminens dörr till positionen.' },
    when: [{ en: 'A clause in their paper departs from what you usually accept.', sv: 'En klausul i deras papper avviker från vad ni brukar godta.' },
      { en: 'You want Jambo to propose our wording for a weak clause: "{ui:ng_prepare}" files a proposal and sends nothing.', sv: 'Du vill att Jambo föreslår vår text för en svag klausul: "{ui:ng_prepare}" registrerar ett förslag och skickar inget.' }],
    path: ['door:ourpaper', { en: 'Our standards', sv: 'Våra standarder' }],
    how: [{ en: 'Open a standard; its rows say the company\'s rule and how firm it is.', sv: 'Öppna en standard; raderna säger företagets regel och hur fast den är.' },
      { en: 'On a contract, the check lists every standard as met, a deviation or missing. "Every standard is met" is said only over a finished check.', sv: 'På ett avtal listar kontrollen varje standard som uppfylld, en avvikelse eller saknad. "Alla standarder uppfyllda" sägs bara efter en färdig kontroll.' },
      { en: 'When a round settles, Jambo proposes a learned position; an admin applies it or not.', sv: 'När en runda avslutas föreslår Jambo en inlärd position; en admin tillämpar den eller inte.' }],
    tip: { en: 'The smallest change wins: Jambo splices our wording into their clause rather than replacing it.', sv: 'Den minsta ändringen vinner: Jambo fogar in vår text i deras klausul i stället för att byta ut den.' },
    cost: { en: 'The check against standards says its cost', sv: 'Kontrollen mot standarder säger sin kostnad' }, doors: [], acts: [],
    words: { en: ['standards', 'our standards', 'playbook', 'position', 'how firm', 'deviation'], sv: ['standarder', 'våra standarder', 'spelbok', 'position', 'avvikelse'] },
    shots: [
      { go: [{ place: 'ourpaper' }, { fn: 'caOpenStandards' }], boxes: [{ sel: '#ins-panel .sd-ask', step: 1 }, { sel: '[data-ins-act="pos"]', step: 1 }], cap: { en: 'A standard: what we ask for, and Set how firm we are (1).', sv: 'En standard: vad vi begär, och Ange hur fasta vi är (1).' } },
      { go: [{ place: 'ourpaper' }, { fn: 'caOpenStandards' }], boxes: [{ sel: '#ins-panel .sd-settled', step: 3 }, { sel: '#ins-panel .sd-where', step: 2 }], cap: { en: 'Where contracts depart (2) and what you have settled for, which Jambo learns from (3).', sv: 'Var avtal avviker (2) och vad ni har nöjt er med, som Jambo lär sig av (3).' } }] },

  /* ======================= PART 3 — AGREE THE WORDS ======================= */
  { k: '3.1', part: 'agree', round: 1,
    title: { en: 'Their changes: Counter · Accept · More', sv: 'Deras ändringar: Motbud · Godta · Mer' },
    eyebrow: { en: 'Redlines tab', sv: 'Fliken Ändringar' },
    what: { en: 'Every change the other side asked for is a row in the Redlines column: one line in paper order, Waiting on you first, settled ones folded. The row carries the whole decision: {ui:ng_counter} leads as the row\'s one filled button, {ui:ng_accept} beside it, and the other ways to answer — {ui:ng_reject} (red), a colleague, the ladder — wait behind {ui:rl_more}. Under it, Jambo\'s read: the verdict in bold, the reason under, from the playbook first and then what you agreed before.',
      sv: 'Varje ändring motparten bett om är en rad i Ändringar-kolumnen: en rad i papperets ordning, Väntar på dig först, avgjorda hopfällda. Raden bär hela beslutet: {ui:ng_counter} leder som radens enda fyllda knapp, {ui:ng_accept} bredvid, och de andra sätten att svara — {ui:ng_reject} (röd), en kollega, stegen — väntar bakom {ui:rl_more}. Under den, Jambos läsning: domen i fetstil, skälet under, från spelboken först och sedan vad ni gått med på förut.' },
    when: [{ en: 'A round came back and Needs you says "N changes waiting on you".', sv: 'En runda kom tillbaka och Behöver dig säger "N ändringar väntar på dig".' },
      { en: 'You want to know what happened the last time they asked for this: the memory line under the verdict says it.', sv: 'Du vill veta vad som hände sist de bad om detta: minnesraden under domen säger det.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, 'door:redline'],
    how: [{ en: 'On the Negotiations list the mark says whose move it is (a half circle in amber is yours, a clock is theirs), the grey line carries the reference, the round and who leads, and Clauses in play names the clauses with a change still open.', sv: 'På listan Förhandlingar säger märket vems drag det är (en halv cirkel i gult är ditt, en klocka är deras), den grå raden bär referensen, rundan och vem som leder, och Klausuler i spel namnger klausulerna med en ändring som fortfarande är öppen.' },
      { en: 'Read the row: §N and the words that moved. Press the row and the paper glides to the clause.', sv: 'Läs raden: §N och orden som flyttats. Tryck på raden så glider papperet till klausulen.' },
      { en: 'Press {ui:ng_counter} (the filled button) to answer in the editor on top of their ask, so what you keep of theirs is said; {ui:ng_accept} takes it as it stands; {ui:rl_more} opens {ui:ng_reject} (red) and the other ways.', sv: 'Tryck {ui:ng_counter} (den fyllda knappen) för att svara i redigeraren ovanpå deras begäran, så det du behåller av deras sägs; {ui:ng_accept} tar den som den står; {ui:rl_more} öppnar {ui:ng_reject} (röd) och de andra sätten.' },
      { en: 'Nothing is sent by deciding. Your decisions wait as "N not sent" until {ui:ng_unsent_send}.', sv: 'Inget skickas genom att besluta. Dina beslut väntar som "N inte skickade" tills {ui:ng_unsent_send}.' },
      { en: '"{ui:rl_read_more}" opens the clause editor on this change and asks its Jambo why, with the card\'s reading as his first line — one Jambo call.', sv: '"{ui:rl_read_more}" öppnar klausredigeraren på denna ändring och frågar dess Jambo varför, med kortets bedömning som hans första rad — ett Jambo-anrop.' }],
    read: { key: [{ tone: 'ok', en: 'inside our rule', sv: 'inom vår regel' }, { tone: 'warn', en: 'one-sided or unusual', sv: 'ensidig eller ovanlig' }, { tone: 'risk', en: 'outside our rule', sv: 'utanför vår regel' }, { tone: 'none', en: 'no advice yet (no rule, no precedent)', sv: 'inget råd än (ingen regel, inget prejudikat)' }],
      en: 'One proposal stands per clause: a counter measured against the standing text replaces the rival, and the list shows the lead first.', sv: 'Ett förslag står per klausul: ett motbud mätt mot gällande text ersätter rivalen, och listan visar det ledande först.' },
    tip: { en: 'Once anyone has signed, the wording is frozen: no change can be filed. A refusal names the clause.', sv: 'När någon har signerat är texten fryst: ingen ändring kan registreras. Ett avslag namnger klausulen.' },
    cost: { en: 'Free; "Ask Jambo more" says its cost', sv: 'Gratis; "Fråga Jambo mer" säger sin kostnad' }, doors: ['redline', 'negotiations'], acts: ['ladder'],
    words: { en: ['redlines', 'their changes', 'accept a change', 'reject a change', 'counter', 'negotiation memory', 'what they asked for'], sv: ['ändringar', 'deras ändringar', 'godta', 'avslå', 'motbud', 'förhandlingsminne'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-pile="awaiting"]', step: 1 }, { sel: '[data-nego-accept="hb-ch2"]', step: 2 }], cap: { en: 'Their asks, one row each, waiting on you (1); Counter leads with Accept beside it, the rest behind More (2).', sv: 'Deras önskemål, en rad var, som väntar på dig (1); Motbud leder med Godta bredvid, resten bakom Mer (2).' } },
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-ig-red="1"]', step: 1 }, { sel: 'section.rl-clause[data-clause]', step: 1 }], cap: { en: 'The paper shows their changes in place, clause by clause (1).', sv: 'Papperet visar deras ändringar på plats, klausul för klausul (1).' } }] },

  { k: '3.2', part: 'agree', round: 1,
    title: { en: 'Your changes: Edit with Jambo, the ladder, Send all', sv: 'Dina ändringar: Redigera med Jambo, stegen, Skicka alla' },
    eyebrow: { en: 'Redlines tab › Edit', sv: 'Fliken Ändringar › Redigera' },
    what: { en: 'On a computer you never write on the paper. {ui:ng_cp_copilot} opens the clause editor as a full page: the box IS the redline (struck and inserted words), one panel for the Playbook, the Risks and the Ladder with {ui:ce_apply} · Discard → Applied · Undo, and one foot ‹ k of n › + Save.',
      sv: 'På en dator skriver du aldrig på papperet. {ui:ng_cp_copilot} öppnar klausulredigeraren som en hel sida: rutan ÄR ändringen (strukna och insatta ord), en panel för Spelboken, Riskerna och Stegen med {ui:ce_apply} · Förkasta → Tillämpad · Ångra, och en fot ‹ k av n › + Spara.' },
    when: [{ en: 'You want to change a clause before the first send.', sv: 'Du vill ändra en klausul innan första utskicket.' },
      { en: 'You are countering their ask and want Jambo\'s wording from the playbook.', sv: 'Du bemöter deras begäran och vill ha Jambos text från spelboken.' }],
    path: ['door:redline', { en: 'a row\'s Edit, or the clause\'s menu', sv: 'en rads Redigera, eller klausulens meny' }],
    how: [{ en: 'Press {ui:act_edit} on your row, or {ui:ng_cp_copilot} on the clause. The editor opens; the trail says "‹ Redlines  Jambo / Redlines / …".', sv: 'Tryck {ui:act_edit} på din rad, eller {ui:ng_cp_copilot} på klausulen. Redigeraren öppnas; spåret säger "‹ Ändringar  Jambo / Ändringar / …".' },
      { en: 'Write, or press {ui:ce_apply} on a card. The foot walks their asks one by one; {ui:ce_save_to} files the change. Every way out asks before dropping an unsaved edit.', sv: 'Skriv, eller tryck {ui:ce_apply} på ett kort. Foten går igenom deras begäranden en efter en; {ui:ce_save_to} registrerar ändringen. Varje väg ut frågar innan en osparad ändring släpps.' },
      { en: 'The row\'s {ui:ng_row_ladder} shows every rung so far on this clause: what each side asked, in order. It invents no walk-away.', sv: 'Radens {ui:ng_row_ladder} visar varje steg hittills på denna klausul: vad varje sida bett om, i ordning. Den hittar inte på någon smärtgräns.' },
      { en: 'When you are done, {ui:ng_unsent_send} sends every unsent change in one letter. A single row\'s Send sends only that card.', sv: 'När du är klar skickar {ui:ng_unsent_send} varje oskickad ändring i ett brev. En enskild rads Skicka skickar bara det kortet.' }],
    tip: { en: 'Spelling: Save lists the new words it does not know, with a wavy underline where it would. Contract words and names pass.', sv: 'Stavning: Spara listar de nya ord den inte känner, med en vågig understrykning där den skulle. Avtalsord och namn passerar.' },
    cost: { en: 'Free; a Jambo card in the editor says its cost', sv: 'Gratis; ett Jambo-kort i redigeraren säger sin kostnad' }, doors: [], acts: [],
    words: { en: ['edit a clause', 'edit with jambo', 'clause editor', 'ladder', 'send all', 'my changes', 'change the wording'], sv: ['redigera en klausul', 'redigera med jambo', 'klausulredigeraren', 'stegen', 'skicka alla', 'ändra texten'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-cp-editor-change="hb-ch1"]', step: 1 }], cap: { en: 'Counter opens the editor on that clause, on top of their ask (1).', sv: 'Motbud öppnar redigeraren på den klausulen, ovanpå deras önskemål (1).' } },
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-ladder="c2"]', step: 3 }], cap: { en: 'Ladder on a row: every rung so far on this clause, in order (3).', sv: 'Stege på en rad: varje steg hittills på klausulen, i ordning (3).' } }] },

  { k: '3.3', part: 'agree', round: 1,
    title: { en: 'Send it: the send screen is the letter', sv: 'Skicka: utskicksskärmen är brevet' },
    eyebrow: { en: 'Any contract', sv: 'Vilket avtal som helst' },
    what: { en: 'Every send door opens the same screen: {ui:sh_lt_from} · {ui:sh_lt_to} · {ui:sh_lt_subject} · {ui:sh_lt_as} · the words, with "{ui:sh_lt_before}" beside. Nothing leaves until you press Send, and "sent" in the history means the mail really went.',
      sv: 'Varje utskicksdörr öppnar samma skärm: {ui:sh_lt_from} · {ui:sh_lt_to} · {ui:sh_lt_subject} · {ui:sh_lt_as} · orden, med "{ui:sh_lt_before}" bredvid. Inget lämnar förrän du trycker Skicka, och "skickat" i historiken betyder att mejlet verkligen gick.' },
    when: [{ en: 'Sending the other side your changes, or the paper for the first time.', sv: 'Skicka motparten dina ändringar, eller papperet för första gången.' },
      { en: 'Sending a colleague the contract with a note: a colleague is a purpose on the same screen.', sv: 'Skicka en kollega avtalet med en anteckning: en kollega är ett syfte på samma skärm.' },
      { en: 'Giving an outside adviser a few clauses only.', sv: 'Ge en extern rådgivare bara några klausuler.' }],
    path: ['door:share', { en: 'or {ui:ng_unsent_send}, or the Dossier\'s Send line', sv: 'eller {ui:ng_unsent_send}, eller Dossierns Skicka-rad' }],
    how: [{ en: 'Press {ui:dos_go_send} wherever you see it. The letter opens.', sv: 'Tryck {ui:dos_go_send} var du än ser det. Brevet öppnas.' },
      { en: 'Check {ui:sh_lt_to}: the other side\'s named person, or colleagues picked from your own people (a colleague who may not open the stream is greyed with why).', sv: 'Kontrollera {ui:sh_lt_to}: motpartens namngivna person, eller kollegor valda bland era egna (en kollega som inte får öppna strömmen är grå med skäl).' },
      { en: 'Choose {ui:sh_lt_as}: a review link, a signing link, a link for a colleague, or an adviser\'s link to chosen clauses.', sv: 'Välj {ui:sh_lt_as}: en granskningslänk, en signeringslänk, en länk till en kollega, eller en rådgivarlänk till valda klausuler.' },
      { en: 'Read "{ui:sh_lt_before}": what is held back (a change waiting on internal review), what is owed, what the link can do.', sv: 'Läs "{ui:sh_lt_before}": vad som hålls kvar (en ändring som väntar på intern granskning), vad som saknas, vad länken kan göra.' },
      { en: 'Press {ui:act_send}. The history records it; a mail that did not go says so.', sv: 'Tryck {ui:act_send}. Historiken registrerar det; ett mejl som inte gick säger det.' }],
    tip: { en: 'A held change never travels, whichever door you send from. The Dossier\'s Send and {ui:ng_send_all} are one door, and the letter names every change of yours that goes with it, a change kept back from an earlier send too. An adviser\'s link lasts 14 days and never carries a Word file.', sv: 'En kvarhållen ändring reser aldrig, oavsett dörr. Dossierns Skicka och {ui:ng_send_all} är en dörr, och brevet nämner varje ändring av dina som följer med, även en som hölls kvar vid ett tidigare utskick. En rådgivarlänk gäller 14 dagar och bär aldrig en Word-fil.' },
    cost: _hbkFree, doors: ['share'], acts: ['send'],
    words: { en: ['send', 'send it', 'share', 'send for review', 'send to the other side', 'send to a colleague', 'adviser link', 'the letter'], sv: ['skicka', 'dela', 'skicka på granskning', 'skicka till motparten', 'skicka till en kollega', 'rådgivarlänk', 'brevet'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'copilot' }], boxes: [{ sel: '#ws-share', step: 1 }], cap: { en: 'Share on the paper\'s strip opens the letter (1).', sv: 'Dela på papperets list öppnar brevet (1).' } },
      { go: [{ open: 'MK-A2', face: 'copilot' }, { fn: 'openShareModal', ref: 'MK-A2', arg: 'c' }], boxes: [{ sel: '#share-readiness', step: 4 }, { sel: '#sh-lt-else', step: 3 }], cap: { en: 'Before you send: what is owed first (4); something else to send instead (3).', sv: 'Innan du skickar: det som saknas först (4); något annat att skicka i stället (3).' } }] },

  { k: '3.4', part: 'agree', round: 1,
    title: { en: 'What the other side sees', sv: 'Vad motparten ser' },
    eyebrow: { en: 'Their page', sv: 'Deras sida' },
    what: { en: 'The link you send opens their own page: {ui:po_tab_where} · {ui:po_tab_redlines} · {ui:po_tab_history} · Signing. They read the paper, answer each change ({ui:po_send_accept} · {ui:po_send_reject} · {ui:po_send_counter}), write notes in their room and, when the route reaches them, sign. They never see your review, your notes, your money or any colleague\'s name.',
      sv: 'Länken du skickar öppnar deras egen sida: {ui:po_tab_where} · {ui:po_tab_redlines} · {ui:po_tab_history} · Signering. De läser papperet, besvarar varje ändring ({ui:po_send_accept} · {ui:po_send_reject} · {ui:po_send_counter}), skriver anteckningar i sitt rum och, när turen når dem, signerar. De ser aldrig er granskning, era anteckningar, era pengar eller någon kollegas namn.' },
    when: [{ en: 'They ask "what do I see when I open this?": press Their view on the Redlines tab.', sv: 'De frågar "vad ser jag när jag öppnar detta?": tryck Deras vy på fliken Ändringar.' },
      { en: 'You want one page every party can read about where the deal stands: send the status link.', sv: 'Du vill ha en sida alla parter kan läsa om var affären står: skicka statuslänken.' }],
    path: ['door:redline', { en: 'Their view', sv: 'Deras vy' }],
    how: [{ en: 'On the Redlines tab, Their view draws their column read-only, exactly as they get it.', sv: 'På fliken Ändringar ritar Deras vy deras kolumn skrivskyddad, precis som de får den.' },
      { en: 'A guest\'s link can ask who is opening it: one code by email, one proof, two gates (opening and signing). An admin switches it on.', sv: 'En gästs länk kan fråga vem som öppnar den: en kod per mejl, ett bevis, två grindar (öppna och signera). En admin slår på det.' },
      { en: 'Where the deal stands (the status link) shows only what every party may see, with whose move it is said as a party, never a person.', sv: 'Var affären står (statuslänken) visar bara det alla parter får se, med vems drag det är sagt som en part, aldrig en person.' }],
    tip: { en: 'A link that cannot reach the server can still be answered by a pasted code; a code is not a delivery, and the history says which it was.', sv: 'En länk som inte når servern kan ändå besvaras med en inklistrad kod; en kod är inte en leverans, och historiken säger vilket det var.' },
    cost: _hbkFree, doors: [], acts: ['where'],
    words: { en: ['their view', 'what the other side sees', 'counterparty page', 'portal', 'status link', 'where the deal stands'], sv: ['deras vy', 'vad motparten ser', 'motpartens sida', 'statuslänk', 'var affären står'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }, { click: '[data-ig-red="theirs"]' }], boxes: [{ sel: '[data-ig-red="theirs"]', step: 1 }, { sel: '[data-rl-pile="with"]', step: 1 }], cap: { en: 'Their view: their column, read-only, as they get it (1).', sv: 'Deras vy: deras kolumn, skrivskyddad, som de får den (1).' } }] },

  { k: '3.5', part: 'agree', round: 2,
    title: { en: 'Internal review before sending', sv: 'Intern granskning före utskick' },
    eyebrow: { en: 'Settings · admins', sv: 'Inställningar · admins' },
    what: { en: 'An admin can require that a named colleague checks changes before they go out. Review gates SENDING only: a held change never travels, every send door says so, and the other side never learns a review exists.',
      sv: 'En admin kan kräva att en namngiven kollega granskar ändringar innan de skickas. Granskning gäller bara UTSKICK: en kvarhållen ändring reser aldrig, varje utskicksdörr säger det, och motparten får aldrig veta att en granskning finns.' },
    when: [{ en: 'Junior colleagues redline, a senior one signs off before anything leaves.', sv: 'Juniora kollegor gör ändringar, en senior godkänner innan något lämnar.' },
      { en: 'Only above a value: the setting has a threshold.', sv: 'Bara över ett värde: inställningen har en tröskel.' }],
    path: ['door:settings', { en: 'Company', sv: 'Företag' }, { en: '{ui:rv_set_title}', sv: '{ui:rv_set_title}' }],
    how: [{ en: 'Admin: switch on "{ui:rv_set_on}", set the threshold; who is checked is set on each person under People.', sv: 'Admin: slå på "{ui:rv_set_on}", sätt tröskeln; vem som granskas sätts på varje person under Personer.' },
      { en: 'A checked person presses {ui:rv_ask_btn} on their row; the reviewer sees it on Needs you and answers it.', sv: 'En granskad person trycker {ui:rv_ask_btn} på sin rad; granskaren ser det på Behöver dig och svarar.' },
      { en: 'Until answered, the send screen lists the change as held.', sv: 'Tills det är besvarat listar utskicksskärmen ändringen som kvarhållen.' }],
    tip: { en: 'Review gates sending, approvals gate signing, the desk gates redlining. Three different rules.', sv: 'Granskning gäller utskick, godkännanden gäller signering, disken gäller ändringar. Tre olika regler.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['internal review', 'review before sending', 'held change', 'ask for review'], sv: ['intern granskning', 'granskning före utskick', 'kvarhållen ändring', 'be om granskning'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'openSettingsAt', args: ['platform', 'review'] }], boxes: [{ sel: '#rv-gate-panel', step: 1 }], cap: { en: 'Internal review: the admin\'s switch (1).', sv: 'Intern granskning: adminens brytare (1).' } },
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-review-go="MK-A2"]', step: 2 }], cap: { en: 'Ask for review on the Redlines face (2).', sv: 'Be om granskning i Ändringar-ansiktet (2).' } }] },

  { k: '3.6', part: 'agree', round: 2,
    title: { en: 'Working as a team on one negotiation', sv: 'Arbeta som ett lag på en förhandling' },
    eyebrow: { en: 'Redlines tab', sv: 'Fliken Ändringar' },
    what: { en: 'Four things keep colleagues from treading on each other: the desk (Lead · Contributor · Reader, an admin\'s rule, off by default), the clause lock (a baton: whoever edits a clause holds it, you can {ui:cl_ask} and they {ui:cl_hand_over}), who is in the room (faces on the paper), and Follow me (press a face and your paper goes where they read).',
      sv: 'Fyra saker hindrar kollegor från att trampa på varandra: disken (Ledare · Bidragare · Läsare, en adminregel, av som standard), klausullåset (en stafettpinne: den som redigerar en klausul håller den, du kan {ui:cl_ask} och de {ui:cl_hand_over}), vem som är i rummet (ansikten på papperet) och Följ mig (tryck på ett ansikte så går ditt papper dit de läser).' },
    when: [{ en: 'Two of you are on the same contract at the same time.', sv: 'Två av er är på samma avtal samtidigt.' },
      { en: 'A contributor proposes a change: the lead adopts it or hands it back with a reason.', sv: 'En bidragare föreslår en ändring: ledaren tar upp den eller lämnar tillbaka den med ett skäl.' }],
    path: ['door:redline', { en: 'the faces at the top of the paper', sv: 'ansiktena överst på papperet' }],
    how: [{ en: 'A clause someone else is editing says "Locked by …". Press {ui:cl_ask}; they get your name and press {ui:cl_hand_over}.', sv: 'En klausul någon annan redigerar säger "Låst av …". Tryck {ui:cl_ask}; de får ditt namn och trycker {ui:cl_hand_over}.' },
      { en: 'With the desk rule on, a Reader sees the Reading banner with {ui:dk_ask_to_join}; the Lead is the only one who reaches the other side.', sv: 'Med diskregeln på ser en Läsare bannern Läser med {ui:dk_ask_to_join}; Ledaren är den enda som når motparten.' },
      { en: 'Press a colleague\'s face to follow them; press it again to stop. Nothing is stored.', sv: 'Tryck på en kollegas ansikte för att följa dem; tryck igen för att sluta. Inget lagras.' }],
    tip: { en: 'The desk never gates signing. A suggestion from a contributor does not travel until the lead adopts it.', sv: 'Disken gäller aldrig signering. Ett förslag från en bidragare reser inte förrän ledaren tar upp det.' },
    cost: _hbkFree, doors: [], acts: ['people'],
    words: { en: ['desk', 'lead', 'contributor', 'clause lock', 'locked by', 'follow me', 'who is in the room', 'ask to join', 'team'], sv: ['disken', 'ledare', 'bidragare', 'klausullås', 'låst av', 'följ mig', 'vem är i rummet', 'be att få vara med'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }, { waitFor: '.rl-card-lock' }], boxes: [{ sel: '.rl-card-lock', step: 1 }], cap: { en: 'A colleague is editing this clause: Ask for it, and they hand it over (1).', sv: 'En kollega redigerar klausulen: Be om den, så lämnar de över den (1).' } },
      { go: [{ open: 'MK-A2', face: 'red' }, { waitFor: '[data-pz-slot] .pz-face' }], boxes: [{ sel: '[data-pz-slot] .pz-face', step: 3 }], cap: { en: 'Who is in the room: press a colleague\'s face to follow them (3).', sv: 'Vem är i rummet: tryck på en kollegas ansikte för att följa dem (3).' } }] },

  { k: '3.7', part: 'agree', round: 2,
    title: { en: 'Notes and comments', sv: 'Anteckningar och kommentarer' },
    eyebrow: { en: 'Notes drawer', sv: 'Anteckningslådan' },
    what: { en: 'A note is one message, anchored to a clause and a quote, in a room: {ui:ng_fn_internal} (your side only) or one room per outside party. The drawer opens over the paper with a pin; its marks sit on the clauses.',
      sv: 'En anteckning är ett meddelande, fäst vid en klausul och ett citat, i ett rum: {ui:ng_fn_internal} (bara er sida) eller ett rum per extern part. Lådan öppnas över papperet med en nål; dess märken sitter på klausulerna.' },
    when: [{ en: 'Ask a colleague "can we live with 60 days here?" without the other side seeing.', sv: 'Fråga en kollega "kan vi leva med 60 dagar här?" utan att motparten ser.' },
      { en: 'Explain a counter to the other side in their room.', sv: 'Förklara ett motbud för motparten i deras rum.' }],
    path: ['door:redline', { en: 'Notes, or {ui:ng_sel_comment} on selected words', sv: 'Anteckningar, eller {ui:ng_sel_comment} på markerade ord' }],
    how: [{ en: 'Select words on the paper and press {ui:ng_sel_comment}; or open the Notes tab of the right-hand panel.', sv: 'Markera ord på papperet och tryck {ui:ng_sel_comment}; eller öppna fliken Anteckningar i högerpanelen.' },
      { en: 'Pick the room, write, press {ui:ng_fn_post}. @-mention a colleague and they are told.', sv: 'Välj rummet, skriv, tryck {ui:ng_fn_post}. @-nämn en kollega så får de veta.' },
      { en: 'A note can be edited or deleted only until it is delivered.', sv: 'En anteckning kan redigeras eller tas bort bara tills den är levererad.' }],
    tip: { en: 'The server is the wall: a party\'s room is never sent to another party. A note given to you shows on your checklist and bell until seen.', sv: 'Servern är muren: en parts rum skickas aldrig till en annan part. En anteckning given till dig visas på din checklista och klocka tills den är sedd.' },
    cost: _hbkFree, doors: [], acts: ['notes'],
    words: { en: ['notes', 'comments', 'comment on a clause', 'internal note', 'mention a colleague'], sv: ['anteckningar', 'kommentarer', 'kommentera en klausul', 'intern anteckning', 'nämna en kollega'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-notes-all="MK-A2"]', step: 1 }], cap: { en: 'Notes on the Redlines face opens this contract\'s notes (1).', sv: 'Anteckningar i Ändringar-ansiktet öppnar avtalets anteckningar (1).' } }] },

  { k: '3.8', part: 'agree', round: 2,
    title: { en: 'Risks to look at', sv: 'Risker att titta på' },
    eyebrow: { en: 'Redlines tab', sv: 'Fliken Ändringar' },
    what: { en: 'One list of what could hurt you in this paper, worst first: the local risk scan plus the brief\'s watch-outs. Each is a soft amber card with the WHY first. {ui:rk_edit_ce} opens Edit with Jambo on that clause with his suggestion ready.',
      sv: 'En lista över vad som kan skada er i detta papper, värst först: den lokala riskskanningen plus sammanfattningens varningar. Var och en är ett mjukt gult kort med VARFÖR först. {ui:rk_edit_ce} öppnar Redigera med Jambo på den klausulen med hans förslag klart.' },
    when: [{ en: 'Their paper arrived and you want the dangerous clauses first.', sv: 'Deras papper kom och du vill ha de farliga klausulerna först.' },
      { en: 'Before you send a counter: have you dealt with the worst one?', sv: 'Innan du skickar ett motbud: har du hanterat den värsta?' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: 'Dossier › Risks › Open', sv: 'Dossier › Risker › Öppna' }],
    how: [{ en: 'On the Dossier, Risks › Open lands on the risk cards under the Redlines column.', sv: 'I Dossiern landar Risker › Öppna på riskkorten under Ändringar-kolumnen.' },
      { en: 'Read the why. Press {ui:rk_edit_ce} to open the editor on that clause; the next risk is one step away in the foot.', sv: 'Läs varför. Tryck {ui:rk_edit_ce} för att öppna redigeraren på den klausulen; nästa risk är ett steg bort i foten.' },
      { en: 'A risk at or after the signatures is never edited.', sv: 'En risk vid eller efter signaturerna redigeras aldrig.' }],
    tip: { en: 'Risks never travel to the other side.', sv: 'Risker reser aldrig till motparten.' },
    cost: _hbkFree, doors: [], acts: ['risks'],
    words: { en: ['risks', 'risk scan', 'risky clauses', 'what could hurt us', 'watch-outs'], sv: ['risker', 'riskskanning', 'riskabla klausuler', 'varningar'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '#rl-risks', step: 1 }, { sel: '[data-rk-act="run"]', step: 1 }], cap: { en: 'Risks to look at, under the change cards; Run it reads them (1).', sv: 'Risker att titta på, under ändringskorten; Kör läser dem (1).' } }] },

  { k: '3.9', part: 'agree', round: 2,
    title: { en: 'The Deal: the close plan', sv: 'Affären: planen för att stänga' },
    eyebrow: { en: 'Redlines tab › Deal', sv: 'Fliken Ändringar › Affären' },
    what: { en: '"N points to close before they can sign", with the road beside it and every point under Room to give · Hold firm · Needs a rule · Waiting on them · Agreed. Read off the playbook and the rounds, no Jambo brain. A point they asked on opens to both wordings whole.',
      sv: '"N punkter att stänga innan de kan signera", med vägen bredvid och varje punkt under Utrymme att ge · Stå fast · Behöver en regel · Väntar på dem · Överens. Avläst från spelboken och rundorna, ingen Jambo-hjärna. En punkt de bett om öppnas till båda texterna helt.' },
    when: [{ en: 'Before a call with the other side: what is still open and what you can give.', sv: 'Före ett samtal med motparten: vad som fortfarande är öppet och vad ni kan ge.' },
      { en: 'A point needs a rule nobody has set: {ui:ng_plan_ask_admin} is the door.', sv: 'En punkt behöver en regel ingen satt: {ui:ng_plan_ask_admin} är dörren.' }],
    path: ['door:redline', { en: '{ui:pd_tab_deal}', sv: '{ui:pd_tab_deal}' }],
    how: [{ en: 'Press {ui:pd_tab_deal} at the head of the Redlines face. The plan opens in the middle.', sv: 'Tryck {ui:pd_tab_deal} i huvudet på Ändringar-ansiktet. Planen öppnas i mitten.' },
      { en: 'Press a point\'s name to compare both wordings, moved words marked. {ui:ng_deal_open} goes to the clause; {ui:ng_plan_chase} opens the letter.', sv: 'Tryck på en punkts namn för att jämföra båda texterna, flyttade ord markerade. {ui:ng_deal_open} går till klausulen; {ui:ng_plan_chase} öppnar brevet.' },
      { en: '‹ Dossier or Esc closes it.', sv: '‹ Dossier eller Esc stänger den.' }],
    tip: { en: 'The memo under the plan can be sent to a colleague; it is built from the same reading.', sv: 'Promemorian under planen kan skickas till en kollega; den byggs från samma avläsning.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['deal', 'close plan', 'points to close', 'what is still open', 'deal board', 'memo'], sv: ['affären', 'stängningsplan', 'punkter att stänga', 'vad är öppet', 'promemoria'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }], boxes: [{ sel: '[data-rl-deal="MK-A2"]', step: 1 }], cap: { en: 'Deal at the head of the Redlines face (1).', sv: 'Affär överst i Ändringar-ansiktet (1).' } },
      { go: [{ open: 'MK-A2', face: 'red' }, { click: '[data-rl-deal="MK-A2"]' }, { waitFor: '#deal-road' }], boxes: [{ sel: '.deal-plan-h', step: 1 }, { sel: '#deal-road', step: 1 }], cap: { en: 'The close plan: the points to close, and the road (1).', sv: 'Stängningsplanen: punkterna att stänga, och vägen (1).' } },
      { go: [{ open: 'MK-A2', face: 'red' }, { click: '[data-rl-deal="MK-A2"]' }, { waitFor: '#deal-road' }], boxes: [{ sel: '[data-deal-toggle="c1"]', step: 2 }, { sel: '[data-deal-open="c1"]', step: 2 }, { sel: '[data-pd-deal-back="deal"]', step: 3 }], cap: { en: 'A point\'s name opens both wordings; Open clause goes to it (2); the way back (3).', sv: 'En punkts namn öppnar båda formuleringarna; Öppna klausul går dit (2); vägen tillbaka (3).' } }] },

  /* ======================= PART 4 — SIGN ======================= */
  { k: '4.1', part: 'sign', round: 1,
    title: { en: 'Approvals: approve or refuse, with the facts in front of you', sv: 'Godkännanden: godkänn eller avslå, med fakta framför dig' },
    eyebrow: { en: 'Approvals & signing', sv: 'Godkännanden & signering' },
    what: { en: 'One worklist of everything waiting for a yes before a signature: who it waits on, since when, and how late. Press a row and Jambo\'s card "{ui:apw_h}" leads the panel: the contract in plain words, the money, where it departs from your standards, what happens if nobody acts.',
      sv: 'En arbetslista över allt som väntar på ett ja före en signatur: vem det väntar på, sedan när, och hur sent. Tryck på en rad så leder Jambos kort "{ui:apw_h}" panelen: avtalet i klarspråk, pengarna, var det avviker från era standarder, vad som händer om ingen agerar.' },
    when: [{ en: 'Needs you says "N approvals waiting on you".', sv: 'Behöver dig säger "N godkännanden väntar på dig".' },
      { en: 'You are the backup while the approver is away: the stand-in answers approvals, never signing.', sv: 'Du är ersättare medan godkännaren är borta: ersättaren besvarar godkännanden, aldrig signering.' }],
    path: ['door:approvals', { en: 'press a row', sv: 'tryck på en rad' }],
    how: [{ en: 'Read a row: a triangle marks a late one; the rule that asks for the yes is the chip under Why it waits, with who decides under it, and Our standards says how the contract measures before you decide.', sv: 'Läs en rad: en triangel märker en sen; regeln som kräver ja:et är brickan under Varför det väntar, med vem som beslutar under den, och Våra standarder säger hur avtalet mäter sig innan du beslutar.' },
      { en: 'Press the row. The card opens on the right.', sv: 'Tryck på raden. Kortet öppnas till höger.' },
      { en: 'No plain-words summary yet? Press {ui:apw_brief_ask}: 1 Jambo call, then kept and free for everyone.', sv: 'Ingen klarspråkssammanfattning än? Tryck {ui:apw_brief_ask}: 1 Jambo-anrop, sedan sparad och gratis för alla.' },
      { en: 'Press {ui:pd_approve} or {ui:pd_refuse} at the bottom. A refusal asks why; the reason goes back to the asker. Undo is offered for a moment.', sv: 'Tryck {ui:pd_approve} eller {ui:pd_refuse} längst ned. Ett avslag frågar varför; skälet går tillbaka till den som frågade. Ångra erbjuds en stund.' }],
    tip: { en: 'Any approver of that contract can ask for the summary. The counterparty never learns an approval exists.', sv: 'Vilken godkännare som helst av det avtalet kan be om sammanfattningen. Motparten får aldrig veta att ett godkännande finns.' },
    cost: { en: 'Free + optional 1 call for the plain words', sv: 'Gratis + valfritt 1 anrop för klarspråket' }, doors: ['approvals'], acts: [],
    words: { en: ['approvals', 'approve', 'refuse', 'what you are approving', 'approval before signing', 'sign off'], sv: ['godkännanden', 'godkänna', 'avslå', 'vad du godkänner', 'godkännande före signering'] },
    shots: [
      { go: [{ place: 'approvals' }], boxes: [{ sel: '[data-ap-view="yours"]', step: 1 }, { sel: '#ins-panel .ap-what', step: 2 }], cap: { en: 'Yours to answer (1); What you are approving, in Jambo\'s card (2).', sv: 'Dina att besvara (1); Vad du godkänner, i Jambos kort (2).' } },
      { go: [{ place: 'approvals' }], boxes: [{ sel: '[data-ins-act="approve"]', step: 3 }, { sel: '[data-ins-act="refuse"]', step: 3 }], cap: { en: 'Approve or Refuse at the foot of the card (3).', sv: 'Godkänn eller Avslå längst ned i kortet (3).' } }] },

  { k: '4.2', part: 'sign', round: 1,
    title: { en: 'Before you sign: the road, what still blocks, the signing copy', sv: 'Innan du signerar: vägen, vad som hindrar, signeringskopian' },
    eyebrow: { en: 'The Dossier › Before you sign', sv: 'Dossiern › Innan du signerar' },
    what: { en: 'Jambo\'s face for signing: the road with its stops (details, approvals, a named person\'s yes, the signers in order), each stop ticked or saying what blocks it, and the signing copy of the paper (A4, exactly what is sealed). Sign shows only in your own stop.',
      sv: 'Jambos ansikte för signering: vägen med sina stopp (uppgifter, godkännanden, en namngiven persons ja, undertecknarna i ordning), varje stopp ibockat eller med vad som hindrar, och papperets signeringskopia (A4, exakt det som förseglas). Signera visas bara i ditt eget stopp.' },
    when: [{ en: 'The words are agreed and it is time to sign.', sv: 'Orden är överenskomna och det är dags att signera.' },
      { en: 'Something blocks the signature and you want to know what, in one list.', sv: 'Något hindrar signaturen och du vill veta vad, i en lista.' }],
    path: ['door:sign', { en: 'or the Dossier\'s Sign stage', sv: 'eller Dossierns steg Signera' }],
    how: [{ en: 'Open {ui:pd_sf_title}. Read the road top to bottom; a blocked stop says what to do and carries its door.', sv: 'Öppna {ui:pd_sf_title}. Läs vägen uppifrån och ned; ett blockerat stopp säger vad som ska göras och bär sin dörr.' },
      { en: 'When it is your stop, press {ui:ct_sign}. The pad asks you to confirm you mean it; the mark is painted on the copy after it is sealed.', sv: 'När det är ditt stopp, tryck {ui:ct_sign}. Plattan ber dig bekräfta att du menar det; märket målas på kopian efter förseglingen.' },
      { en: 'Signed, the face becomes the receipt: who signed, when, and the executed copies sent.', sv: 'Signerat blir ansiktet kvittot: vem som signerade, när, och de verkställda kopiorna som skickats.' }],
    tip: { en: 'The signing check is an admin\'s setting: off, advise, or require. An open ask on the contract refuses the signature until answered. Once anyone signs, the wording is frozen.', sv: 'Signeringskontrollen är en admininställning: av, råd eller krav. En öppen fråga på avtalet vägrar signaturen tills den är besvarad. När någon signerar fryses texten.' },
    cost: _hbkFree, doors: ['sign'], acts: [],
    words: { en: ['sign', 'before you sign', 'signing', 'what blocks signing', 'the road', 'signing copy', 'receipt'], sv: ['signera', 'innan du signerar', 'signering', 'vad hindrar signering', 'vägen', 'signeringskopia', 'kvitto'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'copilot' }, { fn: 'pdSignOpen', ref: 'MK-A2', arg: 'id' }], boxes: [{ sel: '[data-sc-row="bl:negotiation"]', step: 1 }, { sel: '[data-sc-nego="1"]', step: 1 }], cap: { en: 'The road: a blocked stop says what to do, with its door (1).', sv: 'Vägen: ett stopp som hindrar säger vad du ska göra, med sin dörr (1).' } },
      { go: [{ open: 'MK-A2', face: 'copilot' }, { fn: 'pdSignOpen', ref: 'MK-A2', arg: 'id' }], boxes: [{ sel: '#sc-run', step: 1 }, { sel: '[data-sc-row="standards-read"]', step: 1 }], cap: { en: 'Has anyone read this version? Run all 3 reads what is unread (1).', sv: 'Har någon läst den här versionen? Kör alla 3 läser det olästa (1).' } }] },

  { k: '4.3', part: 'sign', round: 2,
    title: { en: 'Who signs, in what order', sv: 'Vem signerar, i vilken ordning' },
    eyebrow: { en: 'The Dossier › Signers', sv: 'Dossiern › Undertecknare' },
    what: { en: 'The signer plan is a timeline: who on each side, in order, with sign links. A signer on each side opens the route; once anyone has signed it is shut. A per-person rule can require a named colleague\'s yes before that person signs, and a signing cap can hold a signature above a value.',
      sv: 'Undertecknarplanen är en tidslinje: vem på varje sida, i ordning, med signeringslänkar. En undertecknare på varje sida öppnar rutten; när någon signerat är den stängd. En regel per person kan kräva en namngiven kollegas ja innan personen signerar, och ett signeringstak kan hålla en signatur över ett värde.' },
    when: [{ en: 'Setting up who signs before the first send.', sv: 'Sätta upp vem som signerar före första utskicket.' },
      { en: 'The signing cap stopped you: the road says who may sign instead.', sv: 'Signeringstaket stoppade dig: vägen säger vem som får signera i stället.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: '{ui:pd_signers}', sv: '{ui:pd_signers}' }],
    how: [{ en: 'Open {ui:pd_signers} from the Dossier. Add a person on each side; the order is the timeline.', sv: 'Öppna {ui:pd_signers} från Dossiern. Lägg till en person på varje sida; ordningen är tidslinjen.' },
      { en: 'A named person\'s yes: press {ui:sa_ask_btn}; they get it on Needs you and by email, answer {ui:sa_card_approve} or refuse with a reason. It lapses if the wording, value or parties change.', sv: 'En namngiven persons ja: tryck {ui:sa_ask_btn}; de får det på Behöver dig och per mejl, svarar {ui:sa_card_approve} eller avslår med ett skäl. Det förfaller om text, värde eller parter ändras.' },
      { en: 'A review link cannot sign; a Sign link binds to the stored route. Our own staff get the app\'s address, never a secret in the mail.', sv: 'En granskningslänk kan inte signera; en signeringslänk binds till den lagrade rutten. Vår egen personal får appens adress, aldrig en hemlighet i mejlet.' }],
    tip: { en: 'A signature is a MARK painted on the copy after sealing; marks on the paper (where to sign) are not signing and never travel.', sv: 'En signatur är ett MÄRKE målat på kopian efter försegling; märken på papperet (var man signerar) är inte signering och reser aldrig.' },
    cost: _hbkFree, doors: [], acts: ['signers'],
    words: { en: ['signers', 'who signs', 'signing order', 'signing route', 'sign link', 'signing cap', 'named approver'], sv: ['undertecknare', 'vem signerar', 'signeringsordning', 'signeringsrutt', 'signeringslänk', 'signeringstak'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'copilot' }, { fn: 'openSignerPlanEditor', ref: 'MK-A2', arg: 'c' }], boxes: [{ sel: '[data-sr-step="1"]', step: 1 }, { sel: '[data-sp-add="new"]', step: 1 }], cap: { en: 'The signing route, top step first; add a person or a step (1).', sv: 'Signeringsvägen, översta steget först; lägg till en person eller ett steg (1).' } },
      { go: [{ open: 'MK-A2', face: 'copilot' }, { fn: 'openSignerPlanEditor', ref: 'MK-A2', arg: 'c' }], boxes: [{ sel: '[data-sr-step="2"]', step: 1 }, { sel: '#sp-save', step: 1 }], cap: { en: 'The other side\'s step: who signs for them and their email; Save route (1).', sv: 'Motpartens steg: vem som signerar för dem och deras e-post; Spara vägen (1).' } }] },

  { k: '4.4', part: 'sign', round: 2,
    title: { en: 'Signing outside HaTi: redline here, sign there', sv: 'Signera utanför HaTi: ändra här, signera där' },
    eyebrow: { en: 'The paper\'s menu', sv: 'Papperets meny' },
    what: { en: 'Some deals are signed in another tool or on paper. The handover freezes the wording and the route while the file is out; filing the signed copy needs every signature. Words that differ from what left need the approver or an admin with a reason; a filled blank is not a change.',
      sv: 'Vissa affärer signeras i ett annat verktyg eller på papper. Överlämningen fryser texten och rutten medan filen är ute; att arkivera den signerade kopian kräver varje signatur. Ord som skiljer sig från det som lämnade kräver godkännaren eller en admin med ett skäl; en ifylld lucka är ingen ändring.' },
    when: [{ en: 'The other side insists on DocuSign, or wet ink.', sv: 'Motparten kräver DocuSign, eller bläck.' },
      { en: 'A signed PDF came back and must be filed against the record.', sv: 'En signerad PDF kom tillbaka och ska arkiveras mot posten.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: '⋯ › {ui:ct_sign}ing outside', sv: '⋯ › signering utanför' }],
    how: [{ en: 'Choose the outside route in the signing stage; export the file. While out, nobody can file a change.', sv: 'Välj den yttre rutten i signeringssteget; exportera filen. Medan den är ute kan ingen registrera en ändring.' },
      { en: 'When it comes back, add the signed copy from the paper\'s menu. HaTi compares the words; their numbering is never a difference.', sv: 'När den kommer tillbaka, lägg till den signerade kopian från papperets meny. HaTi jämför orden; deras numrering är aldrig en skillnad.' },
      { en: 'Filed, the duties read the signed words, and the printed reference stays the contract\'s number.', sv: 'Arkiverad läser åtagandena de signerade orden, och den tryckta referensen förblir avtalets nummer.' }],
    tip: { en: 'An unsigned copy is parked, never sealed.', sv: 'En osignerad kopia parkeras, förseglas aldrig.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['sign outside', 'docusign', 'wet ink', 'signed copy', 'add the signed copy', 'handover'], sv: ['signera utanför', 'bläck', 'signerad kopia', 'lägg till den signerade kopian', 'överlämning'] },
    shots: [
      { go: [{ open: 'MK-HB4', face: 'signing' }, { waitFor: '[data-ho-route-card]' }], boxes: [{ sel: '[data-ho-route-card]', step: 1 }], cap: { en: 'Who runs the signing: they do, outside HaTi (1).', sv: 'Vem sköter signeringen: de gör det, utanför HaTi (1).' } },
      { go: [{ open: 'MK-HB4', face: 'signing' }, { waitFor: '#ho-wait' }], boxes: [{ sel: '#ho-wait .ho-chip', step: 1 }, { sel: '#ho-wait [data-ho-act="check"]', step: 2 }], cap: { en: 'Out for signature: how long it has been with them (1), and the check when their copy comes back (2).', sv: 'Ute för signering: hur länge den varit hos dem (1), och kontrollen när deras kopia kommer tillbaka (2).' } }] },

  { k: '4.5', part: 'sign', round: 2,
    title: { en: 'After the signature', sv: 'Efter signaturen' },
    eyebrow: { en: 'The Dossier', sv: 'Dossiern' },
    what: { en: 'The server seals the paper: the sealed text is what everyone reads from now on, the executed copies go out by email, and the wording, the terms and the signatures are frozen. Jambo says once what comes next: the obligations, the renewal, the calendar.',
      sv: 'Servern förseglar papperet: den förseglade texten är vad alla läser från och med nu, de verkställda kopiorna skickas per mejl, och texten, villkoren och signaturerna är frysta. Jambo säger en gång vad som kommer: åtagandena, förnyelsen, kalendern.' },
    when: [{ en: 'The last signature landed.', sv: 'Sista signaturen landade.' },
      { en: 'You need the sealed record or the executed copy later: the paper\'s menu.', sv: 'Du behöver den förseglade posten eller den verkställda kopian senare: papperets meny.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: 'Dossier', sv: 'Dossier' }],
    how: [{ en: 'Read the receipt on the Before you sign face.', sv: 'Läs kvittot på ansiktet Innan du signerar.' },
      { en: 'Open Obligations: the duties read the signed words. Set who owes each and when.', sv: 'Öppna Åtaganden: åtagandena läser de signerade orden. Sätt vem som ansvarar för varje och när.' },
      { en: 'The history keeps every send, signature and copy, in one table.', sv: 'Historiken behåller varje utskick, signatur och kopia, i en tabell.' }],
    tip: { en: 'A sealed record answers to nobody\'s edit. Changing the deal later is an amendment: a new draft that files itself against this one.', sv: 'En förseglad post lyder ingen redigering. Att ändra affären senare är ett tillägg: ett nytt utkast som arkiveras mot detta.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['after signing', 'sealed', 'executed copy', 'signed contract', 'frozen'], sv: ['efter signering', 'förseglad', 'verkställd kopia', 'signerat avtal', 'fryst'] },
    shots: [
      { go: [{ open: 'MK-B1', face: 'copilot' }, { fn: 'pdSignOpen', ref: 'MK-B1', arg: 'id' }], boxes: [{ sel: '#sign-seal-acts', step: 1 }, { sel: '#sign-wrap', step: 1 }], cap: { en: 'The receipt: the seal to verify, and the copies sent (1).', sv: 'Kvittot: sigillet att verifiera, och kopiorna som skickats (1).' } },
      { go: [{ open: 'MK-B1', face: 'copilot' }], boxes: [{ sel: '[data-ds-at="ob"]', step: 2 }, { sel: '[data-pd-ds-page="hist"]', step: 3 }], cap: { en: 'Obligations on the Dossier (2); the History (3).', sv: 'Åtaganden i Dossiern (2); Historiken (3).' } }] },

  /* ======================= PART 5 — KEEP IT ALIVE ======================= */
  { k: '5.1', part: 'keep', round: 1,
    title: { en: 'Obligations, week by week', sv: 'Åtaganden, vecka för vecka' },
    eyebrow: { en: 'Obligations page', sv: 'Åtaganden' },
    what: { en: 'Every promise in your contracts, laid out by the week it falls due, one act per row: what, who, when, and one word you can press. Mark it done, chase the person who owes it, or review a contract\'s duties in one sitting from its Dossier.',
      sv: 'Varje löfte i era avtal, uppställt efter veckan det förfaller, en handling per rad: vad, vem, när, och ett ord du kan trycka. Markera det klart, påminn den som ansvarar, eller gå igenom ett avtals åtaganden i ett svep från dess Dossier.' },
    when: [{ en: 'Monday morning: what is due this week, and whose it is.', sv: 'Måndag morgon: vad som förfaller denna vecka, och vems det är.' },
      { en: 'A payment or a report the other side owes you is late.', sv: 'En betalning eller en rapport motparten är skyldig er är sen.' },
      { en: 'A new contract arrived and its duties need a person and a date.', sv: 'Ett nytt avtal kom och dess åtaganden behöver en person och ett datum.' }],
    path: ['door:oblig', { en: 'or the Guide › Keep it alive › Obligations', sv: 'eller Guiden › Håll det levande › Åtaganden' }],
    how: [{ en: 'Read a row: the mark says where the duty stands (a half circle due this week, a triangle late, a clock theirs); Kind says Payment or Decision where the record says so, and Amount the money on it.', sv: 'Läs en rad: märket säger var åtagandet står (en halv cirkel förfaller denna vecka, en triangel sen, en klocka deras); Sort säger Betalning eller Beslut där posten säger det, och Belopp pengarna på det.' },
      { en: 'Open Obligations. This week is first; the weeks after follow.', sv: 'Öppna Åtaganden. Denna vecka först; veckorna efter följer.' },
      { en: 'Press {ui:ob_mark_done} when it is met. A repeating duty rolls on to its next date by itself.', sv: 'Tryck {ui:ob_mark_done} när det är uppfyllt. Ett återkommande åtagande rullar vidare till nästa datum av sig självt.' },
      { en: 'Press {ui:ob_chase} to remind the person who owes it. HaTi records the chase.', sv: 'Tryck {ui:ob_chase} för att påminna den som ansvarar. HaTi registrerar påminnelsen.' },
      { en: 'On a contract\'s Dossier, open its Obligations line to review all its duties together. Nothing is ticked for you.', sv: 'I ett avtals Dossier, öppna dess Åtaganden-rad för att gå igenom alla dess åtaganden tillsammans. Inget bockas i åt dig.' }],
    tip: { en: 'The person who owes a duty is nudged a week before, on the day, and the day after. Duties from a template are the template\'s own list, never guessed.', sv: 'Den som ansvarar påminns en vecka före, på dagen och dagen efter. Åtaganden från en mall är mallens egen lista, aldrig gissade.' },
    cost: _hbkFree, doors: ['oblig'], acts: ['oblig', 'renewal'],
    words: { en: ['obligations', 'duties', 'what is due', 'mark done', 'chase', 'week by week', 'promises'], sv: ['åtaganden', 'skyldigheter', 'vad förfaller', 'markera klart', 'påminn', 'vecka för vecka'] },
    shots: [
      { go: [{ place: 'oblig' }], boxes: [{ sel: '[data-obw-card="w0"]', step: 1 }, { sel: '[data-obw-act="done"]', step: 2 }], cap: { en: 'This week first (1); one act per row, here Mark done (2).', sv: 'Denna vecka först (1); en handling per rad, här Markera klar (2).' } },
      { go: [{ open: 'MK-C1', face: 'copilot' }], boxes: [{ sel: '[data-ds-at="ob"]', step: 4 }], cap: { en: 'On a contract\'s Dossier, its Obligations line (4).', sv: 'I ett avtals Dossier, dess rad Åtaganden (4).' } }] },

  { k: '5.2', part: 'keep', round: 2,
    title: { en: 'Calendar and the plan', sv: 'Kalendern och planen' },
    eyebrow: { en: 'Calendar', sv: 'Kalender' },
    what: { en: 'A tab of Home: Monday to Friday, this week and five more, with every contract date as a chip (renewals, notices, duties, your notes due). Jambo can plan your week around them, at a level you set: ask me first, or just do it.',
      sv: 'En flik på Hem: måndag till fredag, denna vecka och fem till, med varje avtalsdatum som ett chip (förnyelser, uppsägningar, åtaganden, dina anteckningar). Jambo kan planera din vecka kring dem, på en nivå du sätter: fråga mig först, eller gör det bara.' },
    when: [{ en: '"Find me two hours this week for the lease": the plan.', sv: '"Hitta två timmar denna vecka för hyresavtalet": planen.' },
      { en: 'What ends next month?', sv: 'Vad löper ut nästa månad?' }],
    path: ['door:calendar'],
    how: [{ en: 'Press a chip and you land on that contract\'s act.', sv: 'Tryck på ett chip så landar du på det avtalets handling.' },
      { en: 'Ask Jambo to plan; the blocks are offered, {ui:cal_plan_add} puts them in, {ui:cal_plan_undo} takes them out. {ui:cal_plan_ask} is the starting level.', sv: 'Be Jambo planera; blocken erbjuds, {ui:cal_plan_add} lägger in dem, {ui:cal_plan_undo} tar bort dem. {ui:cal_plan_ask} är startnivån.' },
      { en: 'Your own events live only with you; a booking goes to your own calendar.', sv: 'Dina egna händelser finns bara hos dig; en bokning går till din egen kalender.' },
      { en: 'Jambo\'s panel beside it opens on {ui:pd_tab_overview}: your week, his two plan asks and how far he may change your calendar. Ask and the panel turns into his conversation with the plan; "‹ {ui:pd_tab_overview}" right above the box brings your week back.', sv: 'Jambos panel bredvid öppnas på {ui:pd_tab_overview}: din vecka, hans två planfrågor och hur långt han får ändra din kalender. Fråga så blir panelen hans samtal med planen; "‹ {ui:pd_tab_overview}" precis ovanför rutan tar tillbaka din vecka.' }],
    tip: { en: 'A typed day is read, never guessed. Weekends are said as a word, not drawn.', sv: 'En skriven dag läses, gissas aldrig. Helger sägs som ett ord, ritas inte.' },
    cost: { en: 'Free; the plan says its cost', sv: 'Gratis; planen säger sin kostnad' }, doors: ['calendar', 'week'], acts: [],
    words: { en: ['calendar', 'my week', 'plan my week', 'what ends', 'dates'], sv: ['kalender', 'min vecka', 'planera min vecka', 'vad löper ut', 'datum'] },
    shots: [
      { go: [{ place: 'calendar' }], boxes: [{ sel: '[data-sel="MK-A1"]', step: 1 }, { sel: '#cal-new', step: 3 }], cap: { en: 'A chip lands on its contract\'s act (1); your own event (3).', sv: 'En bricka landar på sitt avtals handling (1); din egen händelse (3).' } },
      { go: [{ place: 'calendar' }], boxes: [{ sel: '[data-cal-plan-q="week"]', step: 2 }, { sel: '[data-cal-lv="ask"]', step: 4 }], cap: { en: 'Plan my week, its cost said (2); how far Jambo may change your calendar (4).', sv: 'Planera min vecka, med kostnaden sagd (2); hur mycket Jambo får ändra din kalender (4).' } }] },

  { k: '5.3', part: 'keep', round: 2,
    title: { en: 'Amendments and renewals; end or pause', sv: 'Tillägg och förnyelser; avsluta eller pausa' },
    eyebrow: { en: 'The Dossier', sv: 'Dossiern' },
    what: { en: 'An amendment is written here: Create mints a draft and files it against the parent; the amended deal is read as one (its end date, its term, "as amended"). A renewal is a decision with its own act. Ending or pausing a contract is one question.',
      sv: 'Ett tillägg skrivs här: Skapa präglar ett utkast och arkiverar det mot moderavtalet; det ändrade avtalet läses som ett (slutdatum, löptid, "i ändrad lydelse"). En förnyelse är ett beslut med sin egen handling. Att avsluta eller pausa ett avtal är en fråga.' },
    when: [{ en: 'The price changes mid-term.', sv: 'Priset ändras mitt i löptiden.' },
      { en: 'The renewal window opens and somebody must decide.', sv: 'Förnyelsefönstret öppnas och någon måste besluta.' },
      { en: 'A supplier is gone: end it.', sv: 'En leverantör är borta: avsluta det.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: '{ui:pd_face_w_amend} · {ui:end_door}', sv: '{ui:pd_face_w_amend} · {ui:end_door}' }],
    how: [{ en: 'Press {ui:pd_face_w_amend}. One reason can shut the door (a draft, a child, expired) and it is said on the door.', sv: 'Tryck {ui:pd_face_w_amend}. Ett skäl kan stänga dörren (ett utkast, ett barn, utgånget) och det sägs på dörren.' },
      { en: 'The renewal line on the Dossier\'s Obligations panel asks: {ui:cal_k_renew}, decline, or let it run.', sv: 'Förnyelseraden på Dossierns Åtaganden-panel frågar: {ui:cal_k_renew}, avböj, eller låt det löpa.' },
      { en: '{ui:end_door} asks one question: what is happening with this deal?', sv: '{ui:end_door} ställer en fråga: vad händer med denna affär?' }],
    tip: { en: 'A child contract is never "missing" a standard its parent carries.', sv: 'Ett barnavtal "saknar" aldrig en standard som moderavtalet bär.' },
    cost: _hbkFree, doors: [], acts: ['amend', 'family', 'renewal'],
    words: { en: ['amendment', 'amend', 'renewal', 'renew', 'end a contract', 'pause', 'terminate', 'decline the renewal'], sv: ['tillägg', 'ändra', 'förnyelse', 'förnya', 'avsluta ett avtal', 'pausa', 'säga upp'] },
    shots: [
      { go: [{ open: 'MK-B1', face: 'copilot' }], boxes: [{ sel: '[data-pd-mn-go="#ws-m-amend"]', step: 1 }], cap: { en: 'Create an amendment, the stage\'s own act (1).', sv: 'Skapa ett tillägg, stegets egen handling (1).' } },
      { go: [{ open: 'MK-C1', face: 'copilot' }], boxes: [{ sel: '[data-pd-acts-all]', step: 3 }], cap: { en: 'All the acts, where End or pause stands (3).', sv: 'Alla handlingar, där Avsluta eller pausa finns (3).' } }] },

  { k: '5.4', part: 'keep', round: 1,
    title: { en: 'Parties: a party\'s shelf, its facts, and Before the call', sv: 'Parter: en parts hylla, dess fakta och Före samtalet' },
    eyebrow: { en: 'Parties page', sv: 'Parter' },
    what: { en: 'A shelf per counterparty, a reading of your contracts: status is the party\'s standing, the NDA column says whether one covers them today, and what is waiting on you. A party\'s own facts (city, organisation number) have one home. "{ui:cu_br_h}" is the two-minute summary before you speak to them.',
      sv: 'En hylla per motpart, en avläsning av era avtal: status är partens ställning, kolumnen NDA säger om ett täcker dem i dag, och vad som väntar på dig. En parts egna fakta (stad, organisationsnummer) har ett hem. "{ui:cu_br_h}" är tvåminuterssammanfattningen innan du talar med dem.' },
    when: [{ en: 'Before a meeting, a call or a renewal talk with a customer or supplier.', sv: 'Före ett möte, ett samtal eller ett förnyelsesamtal med en kund eller leverantör.' },
      { en: '"Everything we have with Naivas": the party\'s contracts.', sv: '"Allt vi har med Naivas": partens avtal.' }],
    path: ['door:parties', { en: 'press a party', sv: 'tryck på en part' }],
    how: [{ en: 'Read a row: the grey line says how many agreements and since when; Stream is a soft chip, Standing says Live, In negotiation or Ended, and Next to end says how close it is in amber within 90 days.', sv: 'Läs en rad: den grå raden säger hur många avtal och sedan när; Värdeflöde är en mjuk bricka, Ställning säger Aktiv, I förhandling eller Avslutad, och Nästa att löpa ut säger hur nära i gult inom 90 dagar.' },
      { en: 'Press the party\'s row. The facts show straight away, for free; {ui:cu_open_customer} lists its contracts.', sv: 'Tryck på partens rad. Fakta visas direkt, gratis; {ui:cu_open_customer} listar dess avtal.' },
      { en: 'Press {ui:cu_br_write} for a short write-up in Jambo\'s card: 1 call, kept until something about the party changes. Every number is checked against your records; one that cannot be found is said in amber.', sv: 'Tryck {ui:cu_br_write} för en kort text i Jambos kort: 1 anrop, sparad tills något om parten ändras. Varje siffra kontrolleras mot era poster; en som inte hittas sägs i gult.' },
      { en: 'Web search on the other side is one door, with cited lines only and the fee booked.', sv: 'Webbsökning om motparten är en dörr, med bara citerade rader och avgiften bokförd.' }],
    tip: { en: 'A code-named deal is left off the shelves.', sv: 'En kodnamnad affär lämnas utanför hyllorna.' },
    cost: { en: 'Free + optional 1 call for the brief', sv: 'Gratis + valfritt 1 anrop för sammanfattningen' }, doors: ['parties'], acts: ['counterparty'],
    words: { en: ['parties', 'party', 'customers', 'suppliers', 'before the call', 'counterparty', 'two-minute brief'], sv: ['parter', 'part', 'kunder', 'leverantörer', 'före samtalet', 'motpart'] },
    shots: [
      { go: [{ place: 'parties' }, { fn: 'cuSelectParty', args: ['siginon group'] }], boxes: [{ sel: '#ins-panel [data-ins-act="open"]', step: 1 }, { sel: '[data-cu-ag="DV-02"]', step: 1 }], cap: { en: 'A party pressed: Open party, and its agreements (1).', sv: 'En part tryckt: Öppna part, och dess avtal (1).' } },
      { go: [{ place: 'parties' }, { fn: 'cuSelectParty', args: ['siginon group'] }], boxes: [{ sel: '[data-cu-pr-edit="siginon group"]', step: 1 }], cap: { en: 'A party\'s own facts, kept once: Add the city (1).', sv: 'En parts egna fakta, sparade en gång: Lägg till staden (1).' } }] },

  { k: '5.5', part: 'keep', round: 1,
    title: { en: 'Discover: one question asked of many contracts', sv: 'Discover: en fråga ställd till många avtal' },
    eyebrow: { en: 'Contracts list', sv: 'Avtalslistan' },
    what: { en: '{ui:ac_btn} asks one question of every contract shown; each answer is a new column: a coloured light and the answer in a few words. Discover keeps the questions worth keeping; a pack (due diligence) asks five at once; the whole table shows every answer side by side; a Company fact runs on every new contract and can be watched; "Unusual for you" tells you on the Dossier when a contract differs from your usual.',
      sv: '{ui:ac_btn} ställer en fråga till varje visat avtal; varje svar är en ny kolumn: en färgad lampa och svaret i några ord. Discover behåller frågorna värda att behålla; ett paket (due diligence) ställer fem på en gång; hela tabellen visar varje svar sida vid sida; ett Företagsfaktum körs på varje nytt avtal och kan bevakas; "Ovanligt för er" säger på Dossiern när ett avtal avviker från ert vanliga.' },
    when: [{ en: '"How much notice does each side need to end the contract?", "Is our liability capped?"', sv: '"Hur lång uppsägningstid behöver varje sida?", "Är vårt ansvar begränsat?"' },
      { en: 'Before an audit or a sale of the business: the pack.', sv: 'Före en revision eller en försäljning av bolaget: paketet.' },
      { en: 'Every new contract should be checked against a company rule: a Company fact (admins).', sv: 'Varje nytt avtal ska kontrolleras mot en företagsregel: ett Företagsfaktum (admins).' }],
    path: ['door:contracts', { en: '{ui:ac_btn} (top right of the list) · Jambo\'s panel › {ui:ac_disc_h}', sv: '{ui:ac_btn} (uppe till höger i listan) · Jambos panel › {ui:ac_disc_h}' }],
    how: [{ en: 'Narrow the list first if you want: Jambo reads only the contracts shown. Press {ui:ac_btn}, type the question, read the cost line, press Ask.', sv: 'Smalna listan först om du vill: Jambo läser bara visade avtal. Tryck {ui:ac_btn}, skriv frågan, läs kostnadsraden, tryck Fråga.' },
      { en: 'The read goes out in tens so it can be stopped: {ui:ac_stop} keeps every answer read and offers the rest with its cost ({ui:ac_carry_on_other}).', sv: 'Läsningen går ut i tiotal så den kan stoppas: {ui:ac_stop} behåller varje läst svar och erbjuder resten med sin kostnad ({ui:ac_carry_on_other}).' },
      { en: 'Press any answer: the panel reads it out in full, the words it came from, the clause, your rule, and a tick that a person has checked it.', sv: 'Tryck på vilket svar som helst: panelen läser upp det helt, orden det kom från, klausulen, er regel, och en bock att en person kontrollerat det.' },
      { en: '{ui:ac_keep_on} keeps a question in Discover; {ui:ac_del} removes it and its answers (asks first). {ui:ac_pack_all} opens the whole table; {ui:ac_chip_copy} takes it to a mail or a spreadsheet.', sv: '{ui:ac_keep_on} behåller en fråga i Discover; {ui:ac_del} tar bort den och dess svar (frågar först). {ui:ac_pack_all} öppnar hela tabellen; {ui:ac_chip_copy} tar den till ett mejl eller ett kalkylark.' },
      { en: 'Admins: Settings › Company › {ui:fa_title}: add a kept question as a fact with its rule. On the fact\'s column, "{ui:ac_watch_on}" tells you on the bell when a new contract breaks it.', sv: 'Admins: Inställningar › Företag › {ui:fa_title}: lägg till en behållen fråga som ett faktum med sin regel. På faktumets kolumn säger "{ui:ac_watch_on}" till på klockan när ett nytt avtal bryter mot den.' }],
    read: { key: [{ tone: 'ok', en: 'usual, or inside our rule', sv: 'vanligt, eller inom vår regel' }, { tone: 'warn', en: 'one-sided or unusual', sv: 'ensidigt eller ovanligt' }, { tone: 'risk', en: 'a risk, or outside our rule', sv: 'en risk, eller utanför vår regel' }, { tone: 'none', en: 'not found', sv: 'hittades inte' }],
      en: 'The column\'s head says how many are at risk. Answers are kept: asking again reads only contracts whose wording changed.', sv: 'Kolumnens huvud säger hur många som är i riskzonen. Svar sparas: att fråga igen läser bara avtal vars text ändrats.' },
    tip: { en: 'A column asks the wording. A counting question ("how many contracts have no redlines") is about your work and goes to Jambo instead; it is never kept as a column. Editors ask; viewers see the answers. Contracts in a private stream are never read automatically.', sv: 'En kolumn frågar texten. En räknefråga ("hur många avtal saknar ändringar") handlar om ert arbete och går till Jambo i stället; den sparas aldrig som en kolumn. Redaktörer frågar; läsare ser svaren. Avtal i en privat ström läses aldrig automatiskt.' },
    cost: { en: '1 Jambo call per contract (a pack: one read per contract for all its questions); the rest free', sv: '1 Jambo-anrop per avtal (ett paket: en läsning per avtal för alla dess frågor); resten gratis' }, doors: ['watches'], acts: [],
    words: { en: ['ask a column', 'discover', 'due diligence', 'company facts', 'watch', 'unusual for you', 'ask many contracts'], sv: ['fråga en kolumn', 'discover', 'due diligence', 'företagsfakta', 'bevaka', 'ovanligt för er', 'fråga många avtal'] },
    shots: [
      { go: [{ place: 'contracts' }], boxes: [{ sel: '[data-ac-open]', step: 1 }, { sel: '#ac-disc', step: 4 }], cap: { en: 'Ask a column at the top right of the list (1); Discover in Jambo\'s panel (4).', sv: 'Fråga en kolumn uppe till höger i listan (1); Upptäck i Jambos panel (4).' } }] },

  /* ---- DISCOVER, CHAPTER BY CHAPTER (owner, 26 Oct 2026: "bring back the Discover guide's eleven chapters as their
     own sub-chapters with their own pictures"; the guide of 25–26 Oct, its words kept) ---- */
  { k: '5.5.1', part: 'keep', round: 2,
    title: { en: 'Ask a column', sv: 'Fråga en kolumn' },
    eyebrow: { en: 'Contracts list', sv: 'Avtalslistan' },
    what: { en: 'Ask one question of every contract on the list. Each answer appears as a new column: a coloured light and the answer in a few words, on one line.', sv: 'Ställ en fråga till varje avtal på listan. Varje svar blir en ny kolumn: en färgad lampa och svaret i några ord, på en rad.' },
    when: [{ en: '"How much notice does each side need to end the contract?"', sv: '"Hur lång uppsägningstid behöver varje sida?"' },
      { en: '"Is our liability capped, and at what?"', sv: '"Är vårt ansvar begränsat, och till vad?"' },
      { en: 'Any time you would otherwise open contracts one by one to find the same thing.', sv: 'Varje gång du annars skulle öppna avtal ett i taget för att hitta samma sak.' }],
    path: ['door:contracts', { en: '{ui:ac_btn} (top right of the list)', sv: '{ui:ac_btn} (uppe till höger i listan)' }],
    how: [{ en: 'Narrow the list first if you want. Jambo only reads the contracts shown.', sv: 'Smalna listan först om du vill. Jambo läser bara visade avtal.' },
      { en: 'Press {ui:ac_btn}. The form opens in Jambo\'s panel on the right.', sv: 'Tryck {ui:ac_btn}. Formuläret öppnas i Jambos panel till höger.' },
      { en: 'Type your question. The column name is optional.', sv: 'Skriv din fråga. Kolumnens namn är valfritt.' },
      { en: 'Read the cost line, then press Ask N contracts. Press any answer and the panel reads it out in full.', sv: 'Läs kostnadsraden och tryck sedan Fråga N avtal. Tryck på vilket svar som helst så läser panelen upp det helt.' }],
    read: { key: [{ tone: 'ok', en: 'usual, or inside our rule', sv: 'vanligt, eller inom vår regel' }, { tone: 'warn', en: 'one-sided or unusual', sv: 'ensidigt eller ovanligt' }, { tone: 'risk', en: 'a risk, or outside our rule', sv: 'en risk, eller utanför vår regel' }, { tone: 'none', en: 'not found', sv: 'hittades inte' }],
      en: 'The column\'s head says how many are at risk. Pressed, an answer shows the words it came from, the clause, your rule, and a tick to mark that a person has checked it.', sv: 'Kolumnens huvud säger hur många som är i riskzonen. Tryckt visar ett svar orden det kom från, klausulen, er regel, och en bock för att markera att en person kontrollerat det.' },
    tip: { en: 'Answers are kept. Asking the same question again only reads contracts whose wording has changed. Editors can ask; viewers see the answers.', sv: 'Svar sparas. Att ställa samma fråga igen läser bara avtal vars text har ändrats. Redaktörer kan fråga; läsare ser svaren.' },
    cost: { en: '1 Jambo call per contract', sv: '1 Jambo-anrop per avtal' }, doors: [], acts: [],
    words: { en: ['ask a column', 'one question many contracts', 'column of answers'], sv: ['fråga en kolumn', 'en fråga många avtal'] },
    shots: [
      { go: [{ place: 'contracts' }, { click: '[data-ac-open]' }, { waitFor: '#ac-q' }], boxes: [{ sel: '[data-ac-open]', step: 2 }, { sel: '#ac-q', step: 3 }, { sel: '[data-ac-ask]', step: 4 }], cap: { en: 'Ask a column (2): the question (3) and the cost on the button (4).', sv: 'Fråga en kolumn (2): frågan (3) och kostnaden på knappen (4).' } },
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ac-disc [data-ac-bring]' }, { click: '#ac-disc [data-ac-bring]' }, { waitFor: 'td.ac-cell .ac-ans:not(.is-wait)' }], boxes: [{ sel: '[data-ac-th]', step: 4 }, { sel: 'td.ac-cell', step: 4 }], cap: { en: 'The answers: one light and the answer, the column\'s head counting what is at risk (4).', sv: 'Svaren: en lampa och svaret, kolumnens huvud räknar det som är i riskzonen (4).' } },
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ac-disc [data-ac-bring]' }, { click: '#ac-disc [data-ac-bring]' }, { waitFor: 'td.ac-cell .ac-ans:not(.is-wait)' }, { click: 'td.ac-cell:has(.ac-ans:not(.is-wait))' }, { waitFor: '[data-ac-ck]' }], boxes: [{ sel: '[data-ac-ck]', step: 4 }, { sel: '[data-ac-go]', step: 4 }], cap: { en: 'An answer pressed: read out in full, the tick, and the clause it came from (4).', sv: 'Ett svar tryckt: uppläst helt, bocken, och klausulen det kom från (4).' } }] },
  { k: '5.5.2', part: 'keep', round: 2,
    title: { en: 'Stop', sv: 'Stoppa' },
    eyebrow: { en: 'While he reads', sv: 'Medan han läser' },
    what: { en: 'While Jambo reads, the line counts what has landed and carries a {ui:ac_stop}. Stopping keeps every answer already read, and offers the rest with its own cost.', sv: 'Medan Jambo läser räknar raden vad som har landat och bär ett {ui:ac_stop}. Att stoppa behåller varje svar som redan lästs, och erbjuder resten med sin egen kostnad.' },
    when: [{ en: 'You pressed by mistake, or on the wrong list.', sv: 'Du tryckte av misstag, eller på fel lista.' },
      { en: 'Three answers in, you realise the question was wrong.', sv: 'Tre svar in inser du att frågan var fel.' },
      { en: 'You only wanted a taste of a long list.', sv: 'Du ville bara smaka på en lång lista.' }],
    path: [{ en: 'The reading line in Jambo\'s panel, while he reads', sv: 'Läsraden i Jambos panel, medan han läser' }],
    how: [{ en: 'Press {ui:ac_stop} on the reading line.', sv: 'Tryck {ui:ac_stop} på läsraden.' },
      { en: 'The card tells you what was read and kept, and what was not.', sv: 'Kortet säger vad som lästes och sparades, och vad som inte gjorde det.' },
      { en: 'Press {ui:ac_carry_on_other} to read the rest, with the cost named, or leave it.', sv: 'Tryck {ui:ac_carry_on_other} för att läsa resten, med kostnaden nämnd, eller låt det vara.' }],
    tip: { en: 'Nothing is lost by stopping. Calls already spent are not refunded, which is why the count is there.', sv: 'Inget går förlorat genom att stoppa. Anrop som redan använts återbetalas inte, därför finns räkningen där.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['stop the read', 'stop reading', 'carry on'], sv: ['stoppa läsningen', 'fortsätt'] },
    shots: [
      { go: [{ place: 'contracts' }, { eval: "askColOpen({ question: 'Does this agreement name a court or an arbitrator for disputes?', name: 'Disputes', force: true })" }, { waitFor: '#ac-q' }, { aiSlow: 700 }, { click: '#ig-dock [data-ac-ask]' }, { waitFor: '#ig-dock [data-ac-stop]', ms: 20000 }], boxes: [{ sel: '#ig-dock [data-ac-stop]', step: 1 }], cap: { en: 'While he reads: the count, and Stop (1).', sv: 'Medan han läser: räkningen, och Stoppa (1).' } },
      { go: [{ place: 'contracts' }, { eval: "askColOpen({ question: 'Does this agreement name a court or an arbitrator for disputes?', name: 'Disputes', force: true })" }, { waitFor: '#ac-q' }, { aiSlow: 700 }, { click: '#ig-dock [data-ac-ask]' }, { waitFor: '#ig-dock [data-ac-stop]', ms: 20000 }, { click: '#ig-dock [data-ac-stop]' }, { waitFor: '#ig-dock #ac-stopped', ms: 20000 }], boxes: [{ sel: '#ig-dock #ac-stopped', step: 2 }, { sel: '[data-ac-carry]', step: 3 }], cap: { en: 'After Stop: what was kept (2), and Carry on with its cost (3).', sv: 'Efter Stoppa: det som sparades (2), och Fortsätt med sin kostnad (3).' } }] },
  { k: '5.5.3', part: 'keep', round: 2,
    title: { en: 'Discover: the questions your team keeps', sv: 'Upptäck: frågorna ert lag behåller' },
    eyebrow: { en: 'Jambo\'s panel beside Contracts', sv: 'Jambos panel bredvid Avtal' },
    what: { en: 'The questions your team keeps. Press one to put its answers back on the list, free, because the answers are already kept.', sv: 'Frågorna ert lag behåller. Tryck på en för att lägga tillbaka dess svar på listan, gratis, eftersom svaren redan sparats.' },
    when: [{ en: 'Someone already asked what you want to know.', sv: 'Någon har redan frågat det du vill veta.' },
      { en: 'You want to tidy the list of questions.', sv: 'Du vill städa listan med frågor.' }],
    path: ['door:contracts', { en: 'Jambo\'s panel › {ui:ac_disc_h}', sv: 'Jambos panel › {ui:ac_disc_h}' }],
    how: [{ en: 'Press a kept question: its answers come back on the list, free.', sv: 'Tryck på en sparad fråga: dess svar kommer tillbaka på listan, gratis.' },
      { en: 'A question joins by one press: {ui:ac_keep_on}, on the column\'s card. Company facts and a pack\'s questions are kept by themselves.', sv: 'En fråga ansluter med ett tryck: {ui:ac_keep_on}, på kolumnens kort. Företagsfakta och ett pakets frågor sparas av sig själva.' },
      { en: 'Everything else waits behind one line; open it and each carries {ui:ac_keep_on} and {ui:ac_del}. Delete asks first and cannot be undone.', sv: 'Allt annat väntar bakom en rad; öppna den så bär var och en {ui:ac_keep_on} och {ui:ac_del}. Ta bort frågar först och kan inte ångras.' }],
    tip: { en: 'Only the person who asked a question, the person who kept it, or an admin can take it off the list or delete it. Keeping takes nobody\'s permission.', sv: 'Bara den som ställde en fråga, den som sparade den, eller en admin kan ta bort den från listan eller radera den. Att spara kräver ingens tillåtelse.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['discover', 'kept questions', 'bring back answers'], sv: ['upptäck', 'sparade frågor'] },
    shots: [
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ac-disc [data-ac-bring]' }], boxes: [{ sel: '#ac-disc [data-ac-bring]', step: 1 }], cap: { en: 'Discover: a kept question, one press to bring its answers back (1).', sv: 'Upptäck: en sparad fråga, ett tryck för att ta tillbaka dess svar (1).' } }] },
  { k: '5.5.4', part: 'keep', round: 2,
    title: { en: 'Due diligence pack', sv: 'Due diligence-paket' },
    eyebrow: { en: 'Discover', sv: 'Upptäck' },
    what: { en: 'Five standard questions answered in one go: notice to end, liability cap, governing law, auto-renewal and personal data. You can run only the ones you want.', sv: 'Fem standardfrågor besvarade på en gång: uppsägning, ansvarstak, tillämplig lag, automatisk förnyelse och personuppgifter. Du kan köra bara de du vill.' },
    when: [{ en: 'Before an audit, a sale of the business or a funding round.', sv: 'Före en revision, en försäljning av bolaget eller en finansieringsrunda.' },
      { en: 'When you take over a set of contracts and need a quick picture.', sv: 'När du tar över en uppsättning avtal och behöver en snabb bild.' }],
    path: ['door:contracts', { en: 'Jambo\'s panel › {ui:ac_disc_h} › Due diligence', sv: 'Jambos panel › {ui:ac_disc_h} › Due diligence' }],
    how: [{ en: 'Press Due diligence · 5 questions.', sv: 'Tryck Due diligence · 5 frågor.' },
      { en: 'Untick any you don\'t want. The head counts them and the cost follows.', sv: 'Bocka ur de du inte vill ha. Huvudet räknar dem och kostnaden följer.' },
      { en: 'Check the cost: Jambo reads each contract once for all the ticked questions. Then press Ask N contracts.', sv: 'Kontrollera kostnaden: Jambo läser varje avtal en gång för alla bockade frågor. Tryck sedan Fråga N avtal.' }],
    tip: { en: '12 contracts is about 12 calls, not 60: one read per contract answers every question ticked.', sv: '12 avtal är ungefär 12 anrop, inte 60: en läsning per avtal besvarar varje bockad fråga.' },
    cost: { en: '1 Jambo call per contract for all the questions ticked', sv: '1 Jambo-anrop per avtal för alla bockade frågor' }, doors: [], acts: [],
    words: { en: ['due diligence', 'pack', 'five questions'], sv: ['due diligence', 'paket', 'fem frågor'] },
    shots: [
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ig-dock [data-ac-pack]' }, { click: '#ig-dock [data-ac-pack]' }, { waitFor: '#ig-dock [data-ac-pack-form]' }], boxes: [{ sel: '#ig-dock [data-ac-pick]', step: 2 }, { sel: '#ig-dock [data-ac-ask]', step: 3 }], cap: { en: 'Each question has its tick (2); the cost follows what you choose (3).', sv: 'Varje fråga har sin bock (2); kostnaden följer det du väljer (3).' } }] },
  { k: '5.5.5', part: 'keep', round: 2,
    title: { en: 'The whole table', sv: 'Hela tabellen' },
    eyebrow: { en: 'From the column\'s card', sv: 'Från kolumnens kort' },
    what: { en: 'Every answer to every question, side by side, as its own page: one framed table built to be read, copied and sent.', sv: 'Varje svar på varje fråga, sida vid sida, som en egen sida: en inramad tabell gjord för att läsas, kopieras och skickas.' },
    when: [{ en: 'After a pack: to see all five answers for every contract at once.', sv: 'Efter ett paket: för att se alla fem svar för varje avtal på en gång.' },
      { en: 'To send the answers to someone in a mail or a spreadsheet.', sv: 'För att skicka svaren till någon i ett mejl eller ett kalkylark.' }],
    path: [{ en: 'A pack\'s card › {ui:ac_pack_all}', sv: 'Ett pakets kort › {ui:ac_pack_all}' }],
    how: [{ en: 'Press {ui:ac_pack_all} on the pack\'s card. The table opens as its own page.', sv: 'Tryck {ui:ac_pack_all} på paketets kort. Tabellen öppnas som en egen sida.' },
      { en: 'Read across: the contract column stays still while the answers scroll; each column\'s head says how many are at risk.', sv: 'Läs tvärs: avtalskolumnen står still medan svaren rullar; varje kolumns huvud säger hur många som är i riskzonen.' },
      { en: '{ui:ac_chip_copy} takes it to a mail or a spreadsheet; the back button returns to the list.', sv: '{ui:ac_chip_copy} tar den till ett mejl eller ett kalkylark; tillbaka-knappen återgår till listan.' }],
    tip: { en: 'Each cell holds the light, the answer, the clause, then the words it was read from.', sv: 'Varje cell rymmer lampan, svaret, klausulen och sedan orden det lästes från.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['whole table', 'all answers', 'copy the table'], sv: ['hela tabellen', 'alla svar', 'kopiera tabellen'] },
    shots: [
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ig-dock [data-ac-pack]' }, { click: '#ig-dock [data-ac-pack]' }, { waitFor: '#ig-dock [data-ac-pack-form]' }, { click: '#ig-dock [data-ac-ask]' }, { waitFor: '#ig-dock [data-ac-table]', ms: 40000 }], boxes: [{ sel: '#ig-dock [data-ac-table]', step: 1 }], cap: { en: 'On the pack\'s card: See all the answers (1).', sv: 'På paketets kort: Se alla svar (1).' } },
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ig-dock [data-ac-pack]' }, { click: '#ig-dock [data-ac-pack]' }, { waitFor: '#ig-dock [data-ac-pack-form]' }, { click: '#ig-dock [data-ac-ask]' }, { waitFor: '#ig-dock [data-ac-table]', ms: 40000 }, { click: '#ig-dock [data-ac-table]' }, { waitFor: '#ac-table-page .ac-tt-card' }], boxes: [{ sel: '#ac-tt-back', step: 3 }, { sel: '#ac-tt-copy', step: 3 }], cap: { en: 'The whole table as its own page: copy it, or go back to the list (3).', sv: 'Hela tabellen som en egen sida: kopiera den, eller gå tillbaka till listan (3).' } }] },
  { k: '5.5.6', part: 'keep', round: 2,
    title: { en: 'Company facts', sv: 'Företagsfakta' },
    eyebrow: { en: 'Settings · admins', sv: 'Inställningar · admins' },
    what: { en: 'Turn a question into a standing company check. Jambo answers it for every new contract as it arrives, and marks it against your company\'s rule.', sv: 'Gör en fråga till en stående företagskontroll. Jambo besvarar den för varje nytt avtal när det kommer in, och markerar det mot företagets regel.' },
    when: [{ en: 'For things the company always wants to know: the liability cap, the notice period, the governing law.', sv: 'För sådant företaget alltid vill veta: ansvarstaket, uppsägningstiden, tillämplig lag.' },
      { en: 'When there is a clear rule, such as "Capped at no more than one year of fees".', sv: 'När det finns en tydlig regel, som "Begränsat till högst ett års avgifter".' }],
    path: [{ en: 'Settings › Company › Jambo › {ui:fa_title}', sv: 'Inställningar › Företag › Jambo › {ui:fa_title}' }],
    how: [{ en: 'Ask the question once with {ui:ac_btn}, and keep it in Discover.', sv: 'Ställ frågan en gång med {ui:ac_btn}, och spara den i Upptäck.' },
      { en: 'In {ui:fa_title}, press it under Add a fact.', sv: 'I {ui:fa_title}, tryck på den under Lägg till ett faktum.' },
      { en: 'Write the rule — what breaks it — and leave the switch on.', sv: 'Skriv regeln — vad som bryter mot den — och låt brytaren vara på.' },
      { en: 'Optionally read the contracts already here, to answer the older ones too.', sv: 'Läs om du vill avtalen som redan finns, för att besvara de äldre också.' }],
    tip: { en: 'Only admins can switch a fact on. Contracts in a private stream are never read automatically. Changing a rule clears the old answers so they are judged again.', sv: 'Bara admins kan slå på ett faktum. Avtal i en privat ström läses aldrig automatiskt. Att ändra en regel rensar de gamla svaren så att de bedöms igen.' },
    cost: { en: 'About 1 Jambo call per new contract', sv: 'Ungefär 1 Jambo-anrop per nytt avtal' }, doors: [], acts: [],
    words: { en: ['company facts', 'standing check', 'fact rule'], sv: ['företagsfakta', 'stående kontroll'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'openSettingsAt', args: ['platform', 'facts'] }, { waitFor: '#fa-panel' }], boxes: [{ sel: '#fa-panel [data-fa-tog]', step: 3 }, { sel: '[data-fa-readall]', step: 4 }], cap: { en: 'A fact\'s switch (3), and read the contracts already here (4).', sv: 'Ett faktums brytare (3), och läs avtalen som redan finns (4).' } }] },
  { k: '5.5.7', part: 'keep', round: 2,
    title: { en: 'Watches', sv: 'Bevakningar' },
    eyebrow: { en: 'Company facts', sv: 'Företagsfakta' },
    what: { en: 'Ask to be told when a new contract answers a company fact at risk. You get one alert on the bell and in Needs you, with a link straight to the contract.', sv: 'Be att få veta när ett nytt avtal besvarar ett företagsfaktum i riskzonen. Du får en avisering på klockan och i Behöver dig, med en länk direkt till avtalet.' },
    when: [{ en: 'You own a rule and want to hear when a new contract breaks it.', sv: 'Du äger en regel och vill höra när ett nytt avtal bryter mot den.' }],
    path: ['door:contracts', { en: 'a company fact\'s column › "{ui:ac_watch_on}"', sv: 'ett företagsfaktums kolumn › "{ui:ac_watch_on}"' }],
    how: [{ en: 'Open the company fact\'s column from Discover.', sv: 'Öppna företagsfaktumets kolumn från Upptäck.' },
      { en: 'Press "{ui:ac_watch_on}". Discover tags it watched.', sv: 'Tryck "{ui:ac_watch_on}". Upptäck märker den som bevakad.' },
      { en: 'When it fires, press Open on the bell to land on that contract.', sv: 'När den slår till, tryck Öppna på klockan för att landa på avtalet.' }],
    tip: { en: 'Watches work only on company facts, and they are free: Jambo is already reading those contracts as they arrive.', sv: 'Bevakningar fungerar bara på företagsfakta, och de är gratis: Jambo läser redan de avtalen när de kommer in.' },
    cost: _hbkFree, doors: ['watches'], acts: [],
    words: { en: ['watch', 'tell me when', 'alert on a fact'], sv: ['bevaka', 'säg till när'] },
    shots: [
      { go: [{ place: 'contracts' }, { eval: 'return askColSummary(true).then(() => renderIntelDock())' }, { waitFor: '#ac-disc [data-ac-bring]' }, { click: '#ac-disc [data-ac-bring]' }, { waitFor: 'td.ac-cell .ac-ans:not(.is-wait)' }], boxes: [{ sel: '#ig-dock [data-ac-watch]', step: 2 }], cap: { en: 'On a company fact\'s card: Tell me when a new contract answers at risk (2).', sv: 'På ett företagsfaktums kort: Säg till när ett nytt avtal svarar i riskzonen (2).' } }] },
  { k: '5.5.8', part: 'keep', round: 2,
    title: { en: 'Unusual for you', sv: 'Ovanligt för er' },
    eyebrow: { en: 'The contract\'s Dossier', sv: 'Avtalets Dossier' },
    what: { en: 'When a contract says something different from your other contracts of the same kind, the Dossier tells you. Press Show the N to see the ones it is compared with.', sv: 'När ett avtal säger något annat än era andra avtal av samma slag säger Dossiern till. Tryck Visa de N för att se dem det jämförs med.' },
    when: [{ en: 'You don\'t need to do anything: it appears by itself when you open a contract.', sv: 'Du behöver inte göra något: det visas av sig självt när du öppnar ett avtal.' },
      { en: 'Read it before you approve, sign or renew.', sv: 'Läs det innan du godkänner, signerar eller förnyar.' }],
    path: [{ en: 'Open a contract › Dossier › Unusual for you', sv: 'Öppna ett avtal › Dossier › Ovanligt för er' }],
    how: [{ en: 'Open the contract; read the line if it is there.', sv: 'Öppna avtalet; läs raden om den finns.' },
      { en: 'Press Show the N to see the contracts it is compared with.', sv: 'Tryck Visa de N för att se avtalen det jämförs med.' }],
    tip: { en: 'It only speaks when there are at least 3 similar contracts to compare with, so it is never a guess. It uses answers you already have, so it is free.', sv: 'Det säger bara något när det finns minst 3 liknande avtal att jämföra med, så det är aldrig en gissning. Det använder svar ni redan har, så det är gratis.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['unusual for you', 'different from usual'], sv: ['ovanligt för er'] },
    shots: [
      { go: [{ open: 'DV-04', face: 'copilot' }, { waitFor: '.ac-odd-row' }], boxes: [{ sel: '.ac-odd-row', step: 1 }, { sel: '[data-ac-odd-show]', step: 2 }], cap: { en: 'Unusual for you on the Dossier (1), and Show the 3 it is compared with (2).', sv: 'Ovanligt för er i Dossiern (1), och Visa de 3 det jämförs med (2).' } }] },
  { k: '5.5.9', part: 'keep', round: 2,
    title: { en: 'Negotiation memory', sv: 'Förhandlingsminne' },
    eyebrow: { en: 'Redlines tab', sv: 'Fliken Ändringar' },
    what: { en: 'When the other side asks for a change, their card tells you what happened the last time this came up, either with them or across your contracts.', sv: 'När motparten ber om en ändring säger deras kort vad som hände förra gången det kom upp, antingen med dem eller över era avtal.' },
    when: [{ en: 'Every time you decide whether to Counter, Accept or Reject their change.', sv: 'Varje gång du bestämmer om du ska ge Motbud, Godta eller Avslå deras ändring.' }],
    path: [{ en: 'Open a contract › Redlines › their change\'s card', sv: 'Öppna ett avtal › Ändringar › deras ändrings kort' }],
    how: [{ en: 'Read the line under Jambo\'s verdict on their change: what was agreed before.', sv: 'Läs raden under Jambos omdöme om deras ändring: vad som avtalades förut.' },
      { en: 'It shows after 1 earlier round with the same party, or after 3 rounds across your contracts.', sv: 'Den visas efter 1 tidigare runda med samma part, eller efter 3 rundor över era avtal.' },
      { en: 'Press Counter: the editor shows What worked before with the wording you agreed last time. Apply only fills the box; nothing is sent until you save.', sv: 'Tryck Motbud: redigeraren visar Vad som fungerade förut med formuleringen ni avtalade förra gången. Tillämpa fyller bara rutan; inget skickas förrän du sparar.' }],
    tip: { en: 'Only your side sees it. The other party never does.', sv: 'Bara er sida ser det. Motparten gör det aldrig.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['negotiation memory', 'what worked before', 'last time'], sv: ['förhandlingsminne', 'vad som fungerade förut'] },
    shots: [
      { go: [{ open: 'MK-A2', face: 'red' }, { waitFor: '[data-rl-row-memory]' }], boxes: [{ sel: '[data-rl-row-memory]', step: 1 }], cap: { en: 'On their change\'s card: what was agreed with them before (1).', sv: 'På deras ändrings kort: vad som avtalades med dem förut (1).' } }] },
  { k: '5.5.10', part: 'keep', round: 2,
    title: { en: 'What you are approving', sv: 'Vad du godkänner' },
    eyebrow: { en: 'Approvals page', sv: 'Godkännanden' },
    what: { en: 'A short summary for the approver, in Jambo\'s own card so it can\'t be missed: what the contract says in plain words, the money, where it departs from your standards, and what happens if nobody acts.', sv: 'En kort sammanfattning för den som godkänner, i Jambos eget kort så att den inte kan missas: vad avtalet säger med enkla ord, pengarna, var det avviker från era standarder, och vad som händer om ingen gör något.' },
    when: [{ en: 'Before you approve or refuse.', sv: 'Innan du godkänner eller avslår.' }],
    path: ['door:approvals', { en: 'press a row › What you are approving', sv: 'tryck på en rad › Vad du godkänner' }],
    how: [{ en: 'Press the contract\'s row. The card opens on the right.', sv: 'Tryck på avtalets rad. Kortet öppnas till höger.' },
      { en: 'No plain-words summary yet? Press {ui:apw_brief_ask}: 1 Jambo call, then kept and free for everyone.', sv: 'Ingen sammanfattning med enkla ord än? Tryck {ui:apw_brief_ask}: 1 Jambo-anrop, sedan sparat och gratis för alla.' },
      { en: 'Then choose {ui:pd_approve} or {ui:pd_refuse} at the bottom.', sv: 'Välj sedan {ui:pd_approve} eller {ui:pd_refuse} längst ned.' }],
    tip: { en: 'Any approver of that contract can ask for the summary. The same card stands on the approval step of Before you sign.', sv: 'Varje godkännare av avtalet kan be om sammanfattningen. Samma kort står på godkännandesteget i Innan du signerar.' },
    cost: { en: 'Free; the summary 1 Jambo call once', sv: 'Gratis; sammanfattningen 1 Jambo-anrop en gång' }, doors: [], acts: [],
    words: { en: ['what you are approving', 'approver summary', 'plain words'], sv: ['vad du godkänner', 'sammanfattning för godkännare'] },
    shots: [
      { go: [{ place: 'approvals' }], boxes: [{ sel: '[data-ap-what-brief]', step: 2 }], cap: { en: 'No plain words yet: Put it in plain words, 1 call, then kept for everyone (2).', sv: 'Inga enkla ord än: Säg det med enkla ord, 1 anrop, sedan sparat för alla (2).' } }] },
  { k: '5.5.11', part: 'keep', round: 2,
    title: { en: 'Before the call', sv: 'Före samtalet' },
    eyebrow: { en: 'Parties page', sv: 'Parter' },
    what: { en: 'A two-minute summary of a party before you speak to them: how past negotiations went, your company facts side by side, and a short written brief in Jambo\'s card.', sv: 'En tvåminuterssammanfattning av en part innan du talar med dem: hur tidigare förhandlingar gick, era företagsfakta sida vid sida, och en kort skriven brief i Jambos kort.' },
    when: [{ en: 'Before a meeting, a call or a renewal talk with a customer or supplier.', sv: 'Före ett möte, ett samtal eller ett förnyelsesamtal med en kund eller leverantör.' }],
    path: ['door:parties', { en: 'press a party › Before the call', sv: 'tryck på en part › Före samtalet' }],
    how: [{ en: 'Press the party\'s row. The facts show straight away, for free.', sv: 'Tryck på partens rad. Fakta visas direkt, gratis.' },
      { en: 'Press {ui:cu_br_write} for a short write-up. It costs 1 Jambo call and is kept for you until something about the party changes.', sv: 'Tryck {ui:cu_br_write} för en kort sammanställning. Den kostar 1 Jambo-anrop och sparas åt dig tills något om parten ändras.' }],
    tip: { en: 'Jambo checks every number in the brief against your records. If one can\'t be found, he says so inside the same card, in amber.', sv: 'Jambo kontrollerar varje siffra i briefen mot era register. Om någon inte kan hittas säger han det i samma kort, i bärnsten.' },
    cost: { en: 'Free; the brief 1 Jambo call', sv: 'Gratis; briefen 1 Jambo-anrop' }, doors: [], acts: [],
    words: { en: ['before the call', 'party brief', 'two-minute brief'], sv: ['före samtalet', 'partbrief'] },
    shots: [
      { go: [{ place: 'parties' }, { fn: 'cuSelectParty', args: ['siginon group'] }], boxes: [{ sel: '[data-cu-brief]', step: 2 }], cap: { en: 'Before the call: Write the two-minute brief (2).', sv: 'Före samtalet: Skriv tvåminutersbriefen (2).' } }] },

  { k: '5.6', part: 'keep', round: 2,
    title: { en: 'My notes', sv: 'Mina anteckningar' },
    eyebrow: { en: 'My notes page', sv: 'Mina anteckningar' },
    what: { en: 'Your private ledger: a note may name a contract and words in it, and a day to look again. On that day it is on your calendar and your bell. Nobody else sees it: never on the contract, a share or the history.',
      sv: 'Din privata liggare: en anteckning kan nämna ett avtal och ord i det, och en dag att se över igen. Den dagen finns den i din kalender och på din klocka. Ingen annan ser den: aldrig på avtalet, en delning eller historiken.' },
    when: [{ en: '"Check the price clause again before the renewal."', sv: '"Kolla prisklausulen igen före förnyelsen."' },
      { en: 'A thought while reading, kept beside the contract.', sv: 'En tanke under läsningen, sparad bredvid avtalet.' }],
    path: ['door:mynotes', { en: 'or a contract\'s ⋯ › private note', sv: 'eller ett avtals ⋯ › privat anteckning' }],
    how: [{ en: 'Press {ui:mn_new_btn}; the form opens in the panel. {ui:mn_save} stays grey until the note has words.', sv: 'Tryck {ui:mn_new_btn}; formuläret öppnas i panelen. {ui:mn_save} är grå tills anteckningen har ord.' },
      { en: 'Set a review day. On the day, {ui:mn_mark_reviewed} closes it, {ui:mn_snooze} moves it on.', sv: 'Sätt en granskningsdag. På dagen stänger {ui:mn_mark_reviewed} den, {ui:mn_snooze} flyttar den vidare.' },
      { en: 'Tabs: All · Due today · Later · Reviewed, each with its count.', sv: 'Flikar: Alla · Förfaller i dag · Senare · Granskade, var och en med sitt antal.' }],
    tip: { en: 'Jambo reads your notes only when you ask him to.', sv: 'Jambo läser dina anteckningar bara när du ber honom.' },
    cost: _hbkFree, doors: ['mynotes'], acts: [],
    words: { en: ['my notes', 'private note', 'reminder', 'note to self', 'review again'], sv: ['mina anteckningar', 'privat anteckning', 'påminnelse', 'granska igen'] },
    shots: [
      { go: [{ place: 'mynotes' }], boxes: [{ sel: '#mn-new', step: 1 }, { sel: '#ins-panel .jov', step: 1 }], cap: { en: 'New note, and the ledger said in Jambo\'s Overview (1).', sv: 'Ny anteckning, och liggaren sagd i Jambos översikt (1).' } }] },

  { k: '5.7', part: 'keep', round: 2,
    title: { en: 'Archive, legal hold, code names', sv: 'Arkiv, rättsligt stopp, kodnamn' },
    eyebrow: { en: 'The paper\'s menu', sv: 'Papperets meny' },
    what: { en: 'Three ways a contract is set apart. Archive takes it off the lists but keeps it searchable. Legal hold freezes it against every change until someone who may hold releases it. A code name hides the real name from everyone outside a list, in every place the name is printed and in every mail.',
      sv: 'Tre sätt ett avtal sätts åt sidan. Arkiv tar bort det från listorna men behåller det sökbart. Rättsligt stopp fryser det mot varje ändring tills någon som får hålla det släpper. Ett kodnamn döljer det riktiga namnet för alla utanför en lista, överallt där namnet skrivs och i varje mejl.' },
    when: [{ en: 'A deal ended years ago and clutters the list: archive it.', sv: 'En affär slutade för år sedan och skräpar ned listan: arkivera den.' },
      { en: 'A dispute: put it on hold so nothing can change.', sv: 'En tvist: sätt stopp så inget kan ändras.' },
      { en: 'An acquisition only three people may know about: a code name.', sv: 'Ett förvärv bara tre personer får känna till: ett kodnamn.' }],
    path: ['door:contracts', { en: 'press a contract', sv: 'tryck på ett avtal' }, { en: '⋯ › {ui:ct_archive} · {ui:st_kp_legal_hold} · {ui:cn_dlg_title}', sv: '⋯ › {ui:ct_archive} · {ui:st_kp_legal_hold} · {ui:cn_dlg_title}' }],
    how: [{ en: '{ui:ct_archive}: the contract leaves the lists; "{door:archived}" shows them again; {ui:reg_restore} brings one back.', sv: '{ui:ct_archive}: avtalet lämnar listorna; "{door:archived}" visar dem igen; {ui:reg_restore} tar ett tillbaka.' },
      { en: 'Legal hold: a grant per person; while held, every save is refused with the reason.', sv: 'Rättsligt stopp: en behörighet per person; medan det hålls vägras varje sparning med skälet.' },
      { en: '{ui:cn_dlg_title}: name it, name who knows the real name. The real name never leaves the server for anyone else.', sv: '{ui:cn_dlg_title}: namnge det, namnge vem som känner det riktiga namnet. Det riktiga namnet lämnar aldrig servern för någon annan.' }],
    tip: { en: 'Money in a private stream adds to no total anywhere; every open of a private contract is kept.', sv: 'Pengar i en privat ström läggs inte till någon summa någonstans; varje öppning av ett privat avtal sparas.' },
    cost: _hbkFree, doors: ['archived'], acts: ['codename'],
    words: { en: ['archive', 'archived', 'legal hold', 'hold', 'code name', 'hide the name', 'private deal'], sv: ['arkiv', 'arkivera', 'rättsligt stopp', 'kodnamn', 'dölj namnet', 'privat affär'] },
    shots: [
      { go: [{ open: 'MK-B1', face: 'copilot' }], boxes: [{ sel: '#ig-actions', step: 1 }], cap: { en: 'Actions on the paper\'s strip holds Archive, the hold and the code name (1).', sv: 'Åtgärder på papperets list rymmer Arkiv, stoppet och kodnamnet (1).' } }] },

  /* ======================= PART 6 — SEE THE WHOLE BOOK ======================= */
  { k: '6.1', part: 'see', round: 2,
    title: { en: 'The Board: every number a door', sv: 'Tavlan: varje siffra en dörr' },
    eyebrow: { en: 'Home › Board', sv: 'Hem › Tavlan' },
    what: { en: 'Today\'s figures: value, what ends, whose move, by stream, by party, and under your book all of Needs you. Every number is a door to the list behind it, so a number never disagrees with its list. Jambo draws what can be drawn, then explains it; "{ui:hb_dd_btn}" asks why.',
      sv: 'Dagens siffror: värde, vad som löper ut, vems drag, per ström, per part, och under din bok hela Behöver dig. Varje siffra är en dörr till listan bakom, så en siffra motsäger aldrig sin lista. Jambo ritar det som kan ritas, sedan förklarar han; "{ui:hb_dd_btn}" frågar varför.' },
    when: [{ en: '"Which contracts end this quarter?": drawn, then explained.', sv: '"Vilka avtal löper ut detta kvartal?": ritat, sedan förklarat.' },
      { en: 'A number looks wrong: press it and read the list.', sv: 'En siffra ser fel ut: tryck på den och läs listan.' }],
    path: ['door:board'],
    how: [{ en: 'Press any figure: the list opens beside it; "them on the board" draws the last answer\'s set.', sv: 'Tryck på vilken siffra som helst: listan öppnas bredvid; "dem på tavlan" ritar förra svarets mängd.' },
      { en: 'Ask a question in the box. The chart comes first, free; "{ui:hb_dd_btn}" and "{ui:hb_dd_far}" ask Jambo\'s brain with the cost said.', sv: 'Ställ en fråga i rutan. Diagrammet kommer först, gratis; "{ui:hb_dd_btn}" och "{ui:hb_dd_far}" frågar Jambos hjärna med kostnaden sagd.' },
      { en: 'Every chart has ⋯ at its top right for its tools, and × beside it: on the Board the × takes the chart off ("{ui:hb_p_x}"), on an opened chart it takes you back to the Board; on one of today\'s insights it lets that picture go for 30 days.', sv: 'Varje diagram har ⋯ uppe till höger för sina verktyg, och × bredvid: på Tavlan tar × bort diagrammet ("{ui:hb_p_x}"), på ett öppnat diagram tar det dig tillbaka till Tavlan; på en av dagens insikter släpper det bilden i 30 dagar.' },
      { en: 'Saved views are the Board\'s chips; "{door:present}" shows it full screen for a meeting.', sv: 'Sparade vyer är Tavlans chips; "{door:present}" visar den i helskärm för ett möte.' },
      { en: 'Jambo\'s panel beside the Board opens on {ui:pd_tab_overview}: his reading of your book and its links. Ask and the panel turns into his conversation; "‹ {ui:pd_tab_overview}" right above the box is one press away.', sv: 'Jambos panel bredvid Tavlan öppnas på {ui:pd_tab_overview}: hans läsning av din bok och dess länkar. Fråga så blir panelen hans samtal; "‹ {ui:pd_tab_overview}" precis ovanför rutan är ett tryck bort.' }],
    tip: { en: 'Every figure Jambo quotes is checked against the records; one that cannot be found is said so.', sv: 'Varje siffra Jambo citerar kontrolleras mot posterna; en som inte hittas sägs.' },
    cost: { en: 'Free; Dig deeper says its cost', sv: 'Gratis; Gräv djupare säger sin kostnad' }, doors: ['board', 'savedviews', 'present', 'health', 'weekly'], acts: [],
    words: { en: ['board', 'dashboard', 'figures', 'numbers', 'dig deeper', 'saved views', 'present', 'health report', 'weekly report'], sv: ['tavlan', 'siffror', 'gräv djupare', 'sparade vyer', 'presentera', 'hälsorapport', 'veckorapport'] },
    shots: [
      { go: [{ place: 'board' }], boxes: [{ sel: '[data-hb-dig="f:ending"]', step: 1 }, { sel: '[data-hb-why="board:all"]', step: 2 }], cap: { en: 'Every figure is a door (1); Summarise my board, its cost on the button (2).', sv: 'Varje siffra är en dörr (1); Sammanfatta min tavla, kostnaden på knappen (2).' } },
      { go: [{ place: 'board' }, { click: '[data-hb-dig="f:ending"]' }], boxes: [{ sel: '#reg-only-chip', step: 1 }], cap: { en: 'A figure pressed: its list, named on the chip (1).', sv: 'En siffra tryckt: dess lista, namngiven på brickan (1).' } },
      { go: [{ place: 'board' }], boxes: [{ sel: '#ig-dock .jov-facts', step: 4 }], cap: { en: 'Beside the Board, Jambo\'s Overview of your book (4).', sv: 'Bredvid Tavlan, Jambos översikt av din bok (4).' } }] },

  { k: '6.2', part: 'see', round: 2,
    title: { en: 'Explorer: the map', sv: 'Utforskaren: kartan' },
    eyebrow: { en: 'Home › Explorer', sv: 'Hem › Utforskaren' },
    what: { en: 'Every contract and party as a map that faces you and stands still (its dots still jiggle). Group it by stream, party, stage or end; Needs attention is one list; "then and now" compares two days. Jambo explains what the map drew, free, with every figure checked.',
      sv: 'Varje avtal och part som en karta som vänder sig mot dig och står stilla (prickarna vickar ändå). Gruppera efter ström, part, steg eller slut; Behöver uppmärksamhet är en lista; "då och nu" jämför två dagar. Jambo förklarar vad kartan ritade, gratis, med varje siffra kontrollerad.' },
    when: [{ en: 'You want the shape of the whole book, not a list.', sv: 'Du vill se hela bokens form, inte en lista.' },
      { en: 'Which parties hold most of our value?', sv: 'Vilka parter har mest av vårt värde?' }],
    path: ['door:explorer'],
    how: [{ en: 'Press {ui:hb_group_by} and choose. Past the room, one "Other (N more)".', sv: 'Tryck {ui:hb_group_by} och välj. Utanför rummet, ett "Övriga (N till)".' },
      { en: 'Press a dot: the contract\'s Dossier. Type a day to see the book as it was then.', sv: 'Tryck på en prick: avtalets Dossier. Skriv en dag för att se boken som den var då.' },
      { en: 'Findings are kept on the map ("{door:findings}"); the Guide tab beside the map says what is on this view.', sv: 'Fynd sparas på kartan ("{door:findings}"); fliken Guide bredvid kartan säger vad som finns i denna vy.' }],
    tip: { en: 'Turning is greyed with why: the owner ruled the grid stands upright. A count prints only if it is drawn.', sv: 'Vridning är grå med skäl: ägaren beslöt att rutnätet står upprätt. En siffra skrivs bara om den ritas.' },
    cost: _hbkFree, doors: ['explorer', 'findings'], acts: [],
    words: { en: ['explorer', 'the map', 'group by', 'then and now', 'findings', 'needs attention'], sv: ['utforskaren', 'kartan', 'gruppera', 'då och nu', 'fynd'] },
    shots: [
      { go: [{ place: 'explorer' }], boxes: [{ sel: '#ig-group', step: 1 }], cap: { en: 'Group by, at the map\'s top left (1).', sv: 'Gruppera efter, uppe till vänster på kartan (1).' } },
      { go: [{ place: 'explorer' }], boxes: [{ sel: '[data-pd-tab="findings"]', step: 3 }, { sel: '[data-pd-tab="guide"]', step: 3 }], cap: { en: 'Findings and the Guide, beside the map (3).', sv: 'Fynd och Guiden, bredvid kartan (3).' } }] },

  { k: '6.3', part: 'see', round: 2,
    title: { en: 'Jambo\'s agents: what he did on his own', sv: 'Jambos agenter: vad han gjorde själv' },
    eyebrow: { en: 'Jambo\'s agents page', sv: 'Jambos agenter' },
    what: { en: 'Jambo\'s office: each agent (chasing, reading, drafting replies, preparing links) and every piece it prepared, as a trip through its rooms. Each piece is one row: {ui:nd_btn_look} in place, {ui:desk_discard} last. Each person sets how far an agent goes: {ui:st_agents_lv_ask} (the start) or {ui:st_agents_lv_auto}; only an admin may set Just do it, and only downwards for each person.',
      sv: 'Jambos kontor: varje agent (påminner, läser, skriver svar, förbereder länkar) och varje stycke den förberett, som en resa genom dess rum. Varje stycke är en rad: {ui:nd_btn_look} på plats, {ui:desk_discard} sist. Varje person sätter hur långt en agent går: {ui:st_agents_lv_ask} (starten) eller {ui:st_agents_lv_auto}; bara en admin får sätta Gör det bara, och bara nedåt för varje person.' },
    when: [{ en: 'What did Jambo prepare overnight?', sv: 'Vad förberedde Jambo i natt?' },
      { en: 'You want an agent to stop asking and just do it (admins).', sv: 'Du vill att en agent slutar fråga och bara gör det (admins).' }],
    path: ['door:house'],
    how: [{ en: 'The log is the first tab. Press a piece to see its trip; {ui:nd_btn_look} opens it where it lives.', sv: 'Loggen är första fliken. Tryck på ett stycke för att se dess resa; {ui:nd_btn_look} öppnar det där det finns.' },
      { en: 'Decide on the piece where it waits (Needs you, the Board\'s card); {ui:desk_discard} with Undo.', sv: 'Besluta om stycket där det väntar (Behöver dig, Tavlans kort); {ui:desk_discard} med Ångra.' }],
    tip: { en: 'No agent ever sends to the other side. Every run is recorded.', sv: 'Ingen agent skickar någonsin till motparten. Varje körning registreras.' },
    cost: { en: 'Each run says its cost', sv: 'Varje körning säger sin kostnad' }, doors: ['house', 'work'], acts: [],
    words: { en: ['agents', "jambo's agents", 'jambo house', 'what jambo did', 'ask me first', 'just do it', 'automation'], sv: ['agenter', 'jambos agenter', 'jambos hus', 'vad jambo gjorde', 'fråga mig först', 'gör det bara'] },
    shots: [
      { go: [{ place: 'house' }], boxes: [{ sel: '#jh-log', step: 1 }, { sel: '[data-jh-tab="jobs"]', step: 1 }], cap: { en: 'The work log, and the jobs (1).', sv: 'Arbetsloggen, och jobben (1).' } }] },

  { k: '6.4', part: 'see', round: 2,
    title: { en: 'Insights and the Brain', sv: 'Insikter och Hjärnan' },
    eyebrow: { en: 'Insights · the Brain (admins)', sv: 'Insikter · Hjärnan (admins)' },
    what: { en: 'Insights counts the book (exposure, renewals, who waits on whom) and draws each count as a tile that is a door. The Brain is HaTi\'s map of itself: every part, every flow, the lanes, and a stack view of what is running; every change to HaTi names its part there.',
      sv: 'Insikter räknar boken (exponering, förnyelser, vem som väntar på vem) och ritar varje antal som en platta som är en dörr. Hjärnan är HaTis karta över sig själv: varje del, varje flöde, banorna, och en stackvy av vad som körs; varje ändring i HaTi namnger sin del där.' },
    when: [{ en: 'A board meeting wants the exposure by stream.', sv: 'Ett styrelsemöte vill ha exponeringen per ström.' },
      { en: 'You want to know how a thing in HaTi is wired (admins).', sv: 'Du vill veta hur något i HaTi är kopplat (admins).' }],
    path: ['door:insights', { en: '·', sv: '·' }, 'door:brain'],
    how: [{ en: 'Press a tile: the contracts behind it.', sv: 'Tryck på en platta: avtalen bakom.' },
      { en: 'In the Brain, press a part for its body and what hands to it; the lanes view is a process map.', sv: 'I Hjärnan, tryck på en del för dess innehåll och vad som lämnar till den; banvyn är en processkarta.' }],
    tip: { en: 'Counting is not drawing: a number is read once and every tile reads it.', sv: 'Att räkna är inte att rita: en siffra läses en gång och varje platta läser den.' },
    cost: _hbkFree, doors: ['insights', 'brain'], acts: [],
    words: { en: ['insights', 'exposure', 'the brain', 'how hati works', 'process map'], sv: ['insikter', 'exponering', 'hjärnan', 'hur hati fungerar', 'processkarta'] },
    shots: [
      { go: [{ place: 'insights' }], boxes: [{ sel: '[data-pf-go="book"]', step: 1 }, { sel: '[data-pf-go="soon"]', step: 1 }], cap: { en: 'Each tile opens the contracts behind it (1).', sv: 'Varje platta öppnar avtalen bakom den (1).' } },
      { go: [{ place: 'brain' }], boxes: [{ sel: '[data-br-flow="upload"]', step: 2 }, { sel: '[data-br-view="3"]', step: 2 }], cap: { en: 'The Brain: a flow to follow, and the Lanes view (2).', sv: 'Hjärnan: ett flöde att följa, och vyn Banor (2).' } }] },

  /* ======================= PART 7 — SETTINGS & RULES ======================= */
  { k: '7.1', part: 'settings', round: 2,
    title: { en: 'People, roles and the grants per person', sv: 'Personer, roller och behörigheter per person' },
    eyebrow: { en: 'Settings › Company › People · admins', sv: 'Inställningar › Företag › Personer · admins' },
    what: { en: 'Every colleague, their role and what they may do. Grants are per person and off by default: a signing cap, whether their changes are checked (review), approval before signing, who may make new paper, re-file a contract, or put one on hold. They are asked when a person is added, by role.',
      sv: 'Varje kollega, deras roll och vad de får göra. Behörigheter är per person och av som standard: ett signeringstak, om deras ändringar granskas, godkännande före signering, vem som får skapa nytt papper, flytta ett avtal, eller sätta stopp. De frågas när en person läggs till, per roll.' },
    when: [{ en: 'A new colleague starts: a viewer first.', sv: 'En ny kollega börjar: läsare först.' },
      { en: 'Someone keeps signing above what they should: a cap.', sv: 'Någon signerar ständigt över vad de borde: ett tak.' }],
    path: ['door:settings', { en: 'Company', sv: 'Företag' }, { en: 'People', sv: 'Personer' }],
    how: [{ en: 'On the People page each row says the person\'s side in its own column: "Our side" with a tick, "Their side" with a half circle; their job title has its own column beside the name, and a colleague\'s role here reads under the name.', sv: 'På sidan Personer säger varje rad personens sida i en egen kolumn: "Vår sida" med en bock, "Deras sida" med en halv cirkel; befattningen har en egen kolumn bredvid namnet, och en kollegas roll här står under namnet.' },
      { en: 'Add the person; the grant rows for their role are asked at once.', sv: 'Lägg till personen; behörighetsraderna för rollen frågas direkt.' },
      { en: 'Open a person to change a grant. Admins are never capped.', sv: 'Öppna en person för att ändra en behörighet. Admins har aldrig tak.' },
      { en: '"{door:roles}" lists the business roles; "{door:access}" is the access review, refused while anyone is undecided.', sv: '"{door:roles}" listar affärsrollerna; "{door:access}" är behörighetsgranskningen, vägrad medan någon är obestämd.' }],
    tip: { en: 'A member who is not an admin reads only their own settings. Ask an admin is a record, answered where admins look.', sv: 'En medlem som inte är admin läser bara sina egna inställningar. Fråga en admin är en post, besvarad där admins tittar.' },
    cost: _hbkFree, doors: ['settings', 'people', 'roles', 'access', 'profile'], acts: [],
    words: { en: ['people', 'roles', 'grants', 'signing cap', 'add a person', 'permissions', 'access review', 'who holds what'], sv: ['personer', 'roller', 'behörigheter', 'signeringstak', 'lägg till en person', 'behörighetsgranskning'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'settingsGoTab', args: ['company'] }], boxes: [{ sel: '[data-st-card="people"]', step: 1 }], cap: { en: 'People & access on the Company page (1).', sv: 'Personer & åtkomst på Företagssidan (1).' } },
      { go: [{ view: 'team' }, { fn: 'settingsGoPage', args: ['team'] }], boxes: [{ sel: '#st-add-person', step: 1 }, { sel: '#st-people-q', step: 2 }], cap: { en: 'The team: Add member (1), and find a person to open (2).', sv: 'Laget: Lägg till medlem (1), och hitta en person att öppna (2).' } }] },

  { k: '7.2', part: 'settings', round: 2,
    title: { en: 'Streams, private streams and the filing lists', sv: 'Strömmar, privata strömmar och arkiveringslistorna' },
    eyebrow: { en: 'Settings › Company › Streams · admins', sv: 'Inställningar › Företag › Strömmar · admins' },
    what: { en: 'A stream is a shelf with its own people: the server filters every list by it. A private stream shows only to the people named on it, admins too, and its money adds nowhere. Category and stream are the company\'s lists, asked at every creation door. Keeping (how long we keep contracts) is set per stream.',
      sv: 'En ström är en hylla med egna personer: servern filtrerar varje lista efter den. En privat ström syns bara för dem som är namngivna, även admins, och dess pengar läggs inte till någonstans. Kategori och ström är företagets listor, frågade vid varje skapandedörr. Bevarande (hur länge vi behåller avtal) sätts per ström.' },
    when: [{ en: 'Sales should not see Legal\'s employment contracts.', sv: 'Sälj ska inte se Juridiks anställningsavtal.' },
      { en: 'An acquisition: a private stream for the five people on it.', sv: 'Ett förvärv: en privat ström för de fem personerna på det.' }],
    path: ['door:settings', { en: 'Company', sv: 'Företag' }, 'door:privstreams'],
    how: [{ en: 'Open a stream; name who may open it. A new member is a viewer.', sv: 'Öppna en ström; namnge vem som får öppna den. En ny medlem är läsare.' },
      { en: 'Private streams: one writer; every open is kept in the trail.', sv: 'Privata strömmar: en skrivare; varje öppning sparas i spåret.' },
      { en: 'Re-filing a contract to another stream is an admin\'s act, delegable per person.', sv: 'Att flytta ett avtal till en annan ström är en admins handling, delegerbar per person.' }],
    tip: { en: 'The server is the wall: the browser only shows what the server already filtered.', sv: 'Servern är muren: webbläsaren visar bara det servern redan filtrerat.' },
    cost: _hbkFree, doors: ['privstreams', 'keeping', 'company'], acts: [],
    words: { en: ['streams', 'private streams', 'who can see', 'filing', 'categories', 'retention', 'keeping'], sv: ['strömmar', 'privata strömmar', 'vem kan se', 'arkivering', 'kategorier', 'bevarande', 'gallring'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'settingsGoPage', args: ['streams'] }], boxes: [{ sel: '[data-st-panel="stream:new"]', step: 1 }, { sel: '#st-sw-tb', step: 1 }], cap: { en: 'The streams, and a new one (1).', sv: 'Strömmarna, och en ny (1).' } }] },

  { k: '7.3', part: 'settings', round: 2,
    title: { en: 'The switches: review, the desk, a code on a guest\'s link, two-step sign-in, away', sv: 'Brytarna: granskning, disken, en kod på en gästs länk, tvåstegsinloggning, borta' },
    eyebrow: { en: 'Settings · admins and You', sv: 'Inställningar · admins och Du' },
    what: { en: 'Company switches, each off by default: "{ui:rv_set_on}" (sending), "{ui:dk_set_on}" (the desk: redlining and sending, never signing), a code on a named guest\'s link (opening and signing), and {ui:ts_title} for staff. On You: Away names a stand-in who answers your approvals and reviews, never your signing.',
      sv: 'Företagsbrytare, var och en av som standard: "{ui:rv_set_on}" (utskick), "{ui:dk_set_on}" (disken: ändringar och utskick, aldrig signering), en kod på en namngiven gästs länk (öppna och signera), och {ui:ts_title} för personal. Under Du: Borta namnger en ersättare som besvarar dina godkännanden och granskningar, aldrig din signering.' },
    when: [{ en: 'A guest\'s link was forwarded to someone it was not meant for: the code.', sv: 'En gästs länk vidarebefordrades till någon den inte var avsedd för: koden.' },
      { en: 'You are on leave next week: {ui:st_aw_set}.', sv: 'Du är ledig nästa vecka: {ui:st_aw_set}.' }],
    path: ['door:settings', { en: 'Company (switches) · You (Away, two-step)', sv: 'Företag (brytare) · Du (Borta, tvåsteg)' }],
    how: [{ en: 'Admin: open the Company page and flip the switch; the finder box finds any setting by name.', sv: 'Admin: öppna Företagssidan och slå om brytaren; sökrutan hittar vilken inställning som helst på namn.' },
      { en: 'Away: {ui:st_aw_set}, choose the colleague and the days. "{ui:st_aw_never_sign}"', sv: 'Borta: {ui:st_aw_set}, välj kollegan och dagarna. "{ui:st_aw_never_sign}"' },
      { en: 'Two-step sign-in: on for you under You; an admin can clear it for a colleague, never for themselves.', sv: 'Tvåstegsinloggning: på för dig under Du; en admin kan nollställa den för en kollega, aldrig för sig själv.' }],
    tip: { en: 'The sign-in limiter counts wrong guesses, not attempts.', sv: 'Inloggningsbegränsaren räknar fel gissningar, inte försök.' },
    cost: _hbkFree, doors: [], acts: [],
    words: { en: ['switches', 'two-step', 'link code', 'guest code', 'away', 'stand-in', 'out of office', 'desk rule', 'language'], sv: ['brytare', 'tvåsteg', 'länkkod', 'gästkod', 'borta', 'ersättare', 'frånvaro', 'språk'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'settingsGoTab', args: ['company'] }], boxes: [{ sel: '[data-st-card="agreement"]', step: 1 }, { sel: '[data-st-card="links"]', step: 1 }], cap: { en: 'The switches live on the Company page\'s cards (1).', sv: 'Brytarna finns på Företagssidans kort (1).' } },
      { go: [{ view: 'team' }, { click: '[data-st-tab="you"]' }, { waitFor: '[data-st-rform="me:away"]' }], boxes: [{ sel: '[data-st-rform="me:away"]', step: 2 }, { sel: '[data-st-rform="me:twostep"]', step: 3 }], cap: { en: 'Under You: when you\'re away (2) and two-step sign-in (3).', sv: 'Under Du: när du är borta (2) och tvåstegsinloggning (3).' } }] },

  { k: '7.4', part: 'settings', round: 2,
    title: { en: 'Money: currencies and rates', sv: 'Pengar: valutor och kurser' },
    eyebrow: { en: 'Settings › Company › {ui:st_fx} · admins', sv: 'Inställningar › Företag › {ui:st_fx} · admins' },
    what: { en: 'A contract states its own currency and is never rewritten. Anything that adds converts to the home currency through a rate an admin set on a date; no rate is ever guessed: a missing one is said and the contract left out of the total. Pay (a salary) is never deal value.',
      sv: 'Ett avtal anger sin egen valuta och skrivs aldrig om. Allt som summerar räknar om till hemvalutan genom en kurs en admin satt på ett datum; ingen kurs gissas någonsin: en som saknas sägs och avtalet lämnas utanför summan. Lön är aldrig affärsvärde.' },
    when: [{ en: 'The Board says "N contracts left out: no rate for USD".', sv: 'Tavlan säger "N avtal utelämnade: ingen kurs för USD".' }],
    path: ['door:settings', { en: 'Company', sv: 'Företag' }, { en: '{ui:st_fx}', sv: '{ui:st_fx}' }],
    how: [{ en: 'Press {ui:st_fx_add}, type the code and "{ui:st_fx_rate}". The date is kept with it.', sv: 'Tryck {ui:st_fx_add}, skriv koden och "{ui:st_fx_rate}". Datumet sparas med.' },
      { en: '{ui:st_fx_remove} takes it away; its contracts leave the converted totals again.', sv: '{ui:st_fx_remove} tar bort den; dess avtal lämnar de omräknade summorna igen.' }],
    tip: { en: '"{ui:st_fx_note}"', sv: '"{ui:st_fx_note}"' },
    cost: _hbkFree, doors: [], acts: ['value'],
    words: { en: ['currency', 'currencies', 'exchange rate', 'rates', 'fx', 'convert'], sv: ['valuta', 'valutor', 'växelkurs', 'kurser', 'omräkna'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'settingsGoTab', args: ['company'] }], boxes: [{ sel: '[data-st-card="standards"]', step: 1 }], cap: { en: 'Your standards: the company, its market and money (1).', sv: 'Era standarder: företaget, dess marknad och pengar (1).' } }] },

  { k: '7.5', part: 'settings', round: 2,
    title: { en: 'Jambo\'s settings: spend, company facts, navigation, agent levels', sv: 'Jambos inställningar: kostnad, företagsfakta, navigering, agentnivåer' },
    eyebrow: { en: 'Settings › Company › Jambo · admins', sv: 'Inställningar › Företag › Jambo · admins' },
    what: { en: 'What Jambo may spend and has spent (dollars to admins only), the company facts he checks every new contract against, whether he may take people to a page when they ask ("the AI takes you there"), and how far each agent may go for each person.',
      sv: 'Vad Jambo får spendera och har spenderat (dollar bara för admins), företagsfakta han kontrollerar varje nytt avtal mot, om han får ta folk till en sida när de ber ("AI:n tar dig dit"), och hur långt varje agent får gå för varje person.' },
    when: [{ en: 'The month\'s spend is climbing: a budget.', sv: 'Månadens kostnad stiger: en budget.' },
      { en: 'A standing question for every new contract: a company fact.', sv: 'En stående fråga för varje nytt avtal: ett företagsfaktum.' }],
    path: ['door:settings', { en: 'Company', sv: 'Företag' }, 'door:budget'],
    how: [{ en: '"{door:budget}" shows spend today and the limit; judgement questions run on the stronger model from the first step, and the answer says so.', sv: '"{door:budget}" visar dagens kostnad och gränsen; bedömningsfrågor körs på den starkare modellen från första steget, och svaret säger det.' },
      { en: '{ui:fa_title}: add a kept question with its rule; a changed rule drops its old answers so they are judged again.', sv: '{ui:fa_title}: lägg till en behållen fråga med sin regel; en ändrad regel släpper sina gamla svar så de bedöms igen.' },
      { en: 'Agent levels: {ui:st_agents_lv_ask} for everyone to start; Just do it is the admin\'s, and only for the link-only agent.', sv: 'Agentnivåer: {ui:st_agents_lv_ask} för alla till att börja med; Gör det bara är adminens, och bara för länkagenten.' }],
    tip: { en: 'Jambo guides through the rules, never around them: he says the rule, who lifts it and the proper step.', sv: 'Jambo leder genom reglerna, aldrig runt dem: han säger regeln, vem som lyfter den och rätt steg.' },
    cost: _hbkFree, doors: ['budget', 'webhooks'], acts: [],
    words: { en: ['jambo settings', 'spend', 'budget', 'ai cost', 'company facts', 'navigation', 'agent levels', 'webhooks'], sv: ['jambos inställningar', 'kostnad', 'budget', 'företagsfakta', 'navigering', 'agentnivåer'] },
    shots: [
      { go: [{ view: 'team' }, { fn: 'settingsGoTab', args: ['company'] }], boxes: [{ sel: '[data-st-panel="copilot"]', step: 1 }, { sel: '[data-st-panel="facts"]', step: 2 }, { sel: '[data-st-panel="agents"]', step: 3 }], cap: { en: 'Jambo\'s card: his spend (1), Company facts (2), the agents (3).', sv: 'Jambos kort: hans kostnad (1), Företagsfakta (2), agenterna (3).' } },
      { go: [{ view: 'team' }, { fn: 'openSettingsAt', args: ['platform', 'facts'] }, { waitFor: '#fa-panel .fa-q' }], boxes: [{ sel: '#fa-panel .fa-q', step: 2 }, { sel: '[data-fa-go]', step: 2 }], cap: { en: 'Company facts: each kept question and its rule; read the ones already here (2).', sv: 'Företagsfakta: varje sparad fråga och dess regel; läs de som redan finns (2).' } }] },
];

/* ---------- READERS (no DOM) ---------- */
const hbkPartOf = k => HANDBOOK_PARTS.find(p => p.k === k) || null;
const hbkChapterOf = k => HANDBOOK_CHAPTERS.find(c => c.k === String(k || '')) || null;
const hbkChaptersOf = part => HANDBOOK_CHAPTERS.filter(c => c.part === part);
/* every door and act the book names (the test's coverage) */
function hbkDoorsNamed(){
  const doors = new Set(), acts = new Set();
  for (const c of HANDBOOK_CHAPTERS){
    (c.doors || []).forEach(d => doors.add(d)); (c.acts || []).forEach(a => acts.add(a));
    for (const m of hbkMarkersOf(c)) if (m.kind === 'door') doors.add(m.key);
  }
  return { doors, acts };
}
/* every {ui:key} and {door:key} marker a chapter carries, in any of its texts */
const HBK_MARK_RE = /\{(ui|door):([a-z0-9_]+)\}/g;
function hbkTextsOf(c){
  const out = [];
  const take = v => { if (!v) return; if (typeof v === 'string') out.push(v); else if (Array.isArray(v)) v.forEach(take); else if (typeof v === 'object'){ if (v.en != null || v.sv != null){ out.push(String(v.en || ''), String(v.sv || '')); } Object.keys(v).forEach(k => { if (k !== 'en' && k !== 'sv') take(v[k]); }); } };
  ['title', 'eyebrow', 'what', 'when', 'path', 'how', 'read', 'tip', 'cost', 'noShot'].forEach(f => take(c[f]));
  return out;
}
function hbkMarkersOf(c){
  const out = [];
  for (const t of hbkTextsOf(c)) for (const m of t.matchAll(HBK_MARK_RE)) out.push({ kind: m[1], key: m[2] });
  return out;
}
/* "how do I …" matched on a chapter's words: the chapter whose words the question holds, the longest word
   winning; null when no chapter's word is in it (navReadHandbook, round 4) */
function hbkFind(q, lang){
  const t = ' ' + String(q || '').toLowerCase().replace(/[’‘]/g, "'").replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  let best = null;
  for (const c of HANDBOOK_CHAPTERS){
    const words = (c.words && c.words[lang]) || [];
    for (const w of words){ const ww = ' ' + String(w).toLowerCase() + ' '; if (t.includes(ww) && (!best || ww.length > best.len)) best = { c, len: ww.length, word: w }; }
  }
  return best ? { k: best.c.k, word: best.word } : null;
}

/* ---------- THE BOOK IN PLAIN WORDS, FOR JAMBO TO READ (owner, 26 Oct 2026: "the goal is to have jambo be the
   cure to all question related to the platform") ----------
   Asked "what is the handbook about?", Jambo summarised the contracts: the brain had never read this book. Now
   both hosts read it through these readers — the server puts every chapter in the ONE search (kind 'guide',
   hsIndexKind), the browser's own search does the same when there is no server — so a question about HaTi is
   answered from the chapter that was checked against the app, and a chapter written tomorrow is read tomorrow.
   `word(kind, key, lang)` turns a marker into the screen's word (kind 'ui' a dictionary key, 'door' a place);
   each host passes its own dictionary. Nothing here is translated: every field is already {en, sv}. */
const HBK_ABOUT = 'about';
function hbkWord(word, kind, key, lang){
  let w = ''; try { w = typeof word === 'function' ? String(word(kind, key, lang) || '') : ''; } catch (_){ w = ''; }
  /* a label's own placeholders ({n}, {cur}) are said as "…", as the page draws them (hbkLabel) */
  return w && w !== key ? w.replace(/\{[a-z]+\}/gi, '…').replace(/&amp;/g, '&') : String(key).replace(/_/g, ' ');
}
/* one field, in one language, its markers as the screen's words */
function hbkPlainOf(v, lang, word){
  const s = v == null ? '' : typeof v === 'string' ? v : String((v[lang] != null ? v[lang] : v.en) || '');
  return s.replace(HBK_MARK_RE, (m, kind, key) => hbkWord(word, kind, key, lang)).replace(/\s+/g, ' ').trim();
}
/* a part's name and line: the Guide's own words for the six stages, its own for the two ends */
function hbkPartPlain(p, lang, word){
  if (!p) return { w: '', sub: '' };
  return p.gd ? { w: hbkWord(word, 'ui', 'gd_s_' + p.gd, lang), sub: hbkWord(word, 'ui', 'gd_s_' + p.gd + '_w', lang) }
    : { w: hbkWord(word, 'ui', p.w, lang), sub: hbkWord(word, 'ui', p.sub, lang) };
}
const HBK_PLAIN_HEADS = {
  en: { part: 'Part', what: 'What it is', when: 'When to use it', path: 'Where', how: 'How', read: 'Reading it', tip: 'Good to know', cost: 'Cost' },
  sv: { part: 'Del', what: 'Vad det är', when: 'När du använder det', path: 'Var', how: 'Hur', read: 'Så läser du det', tip: 'Bra att veta', cost: 'Kostnad' } };
/* one chapter as Jambo reads it: its title, then what, when, where, how (numbered), the reading key, the tip, the cost */
function hbkChapterPlain(c, lang, word){
  if (!c) return '';
  const L = HBK_PLAIN_HEADS[lang] || HBK_PLAIN_HEADS.en, P = x => hbkPlainOf(x, lang, word);
  const part = hbkPartPlain(hbkPartOf(c.part), lang, word);
  const lines = [`${c.k} ${P(c.title)}`, `${L.part}: ${part.w}${c.eyebrow ? ' · ' + P(c.eyebrow) : ''}`];
  if (c.what) lines.push(`${L.what}: ${P(c.what)}`);
  if (Array.isArray(c.when) && c.when.length) lines.push(`${L.when}: ` + c.when.map(P).join(' '));
  if (Array.isArray(c.path) && c.path.length) lines.push(`${L.path}: ` + c.path.map(x => typeof x === 'string' && x.startsWith('door:') ? hbkWord(word, 'door', x.slice(5), lang) : P(x)).join(' › '));
  if (Array.isArray(c.how) && c.how.length) lines.push(`${L.how}: ` + c.how.map((x, i) => `${i + 1}. ${P(x)}`).join(' '));
  if (c.read) lines.push(`${L.read}: ${P(c.read)}` + (Array.isArray(c.read.key) ? ' ' + c.read.key.map(P).join('; ') + '.' : ''));
  if (c.tip) lines.push(`${L.tip}: ${P(c.tip)}`);
  if (c.cost) lines.push(`${L.cost}: ${P(c.cost)}`);
  return lines.join('\n');
}
/* the book itself ("what is the handbook about?"): what it is, then every part with its chapters */
function hbkAboutPlain(lang, word){
  const head = lang === 'sv'
    ? `Handboken är HaTis egen instruktionsbok: ${HANDBOOK_CHAPTERS.length} kapitel i ${HANDBOOK_PARTS.length} delar, i den ordning ett avtal lever. Varje kapitel säger vad en sak är, när du använder den, var den finns, hur du gör steg för steg och vad den kostar. Den öppnas från Guiden eller genom att skriva "handbok". Kontrollerad mot appen ${HANDBOOK_CHECKED}.`
    : `The Handbook is HaTi's own instruction book: ${HANDBOOK_CHAPTERS.length} chapters in ${HANDBOOK_PARTS.length} parts, in the order a contract lives. Each chapter says what a thing is, when to use it, where it is, how to do it step by step, and what it costs. It opens from the Guide or by typing "handbook". Checked against the app on ${HANDBOOK_CHECKED}.`;
  return [head].concat(HANDBOOK_PARTS.map((p, i) => { const w = hbkPartPlain(p, lang, word);
    return `${i}. ${w.w}${w.sub ? ' (' + w.sub + ')' : ''}: ` + hbkChaptersOf(p.k).map(c => `${c.k} ${hbkPlainOf(c.title, lang, word)}`).join('; '); })).join('\n');
}
/* every chapter, and the book itself, as search documents: both languages in one body, the everyday words as tags */
function hbkSearchDocs(word){
  const docs = [{ k: HBK_ABOUT, part: '', title: 'The Handbook: instructions for using HaTi · Handboken', body: 'handbook · instructions · user guide · manual · how to use HaTi · handboken · instruktioner\n' + hbkAboutPlain('en', word) + '\n\n' + hbkAboutPlain('sv', word).split('\n')[0],
    tags: 'handbook handboken manual instructions user guide instruction book what is the handbook about bruksanvisning' }];
  for (const c of HANDBOOK_CHAPTERS){
    const w = c.words || {};
    docs.push({ k: c.k, part: c.part, title: `${hbkPlainOf(c.title, 'en', word)} · ${hbkPlainOf(c.title, 'sv', word)}`,
      /* the chapter's everyday words lead its body too: they are the words people ask with ("playbook", "ask jambo") */
      body: [].concat(w.en || [], w.sv || []).join(' · ') + '\n' + hbkChapterPlain(c, 'en', word) + '\n\n' + hbkChapterPlain(c, 'sv', word),
      tags: [].concat(w.en || [], w.sv || []).join(' ') });
  }
  return docs;
}
/* what Jambo is handed for one chapter ('about' = the book itself), in the reader's language */
function hbkPlainFor(k, lang, word){
  const L = lang === 'sv' ? 'sv' : 'en';
  if (k === HBK_ABOUT) return hbkAboutPlain(L, word);
  const c = hbkChapterOf(k); return c ? hbkChapterPlain(c, L, word) : '';
}

/* WHICH CHAPTERS COVER THE PAGE IN FRONT (the owner, 26 Oct 2026: "we are looking to address the issue across
   HaTi, not just the handbook"): every page names the place words its chapters carry in `doors`, so Jambo on ANY
   page — Obligations, Settings, a contract — is told which chapters describe what he is looking at, and "what can
   I do here?" is answered from them. A view is the app's state.view; Home's faces have their own. A page with no
   chapter is a GAP the Handbook owes (test/f938's gap list), never a guess. */
const HBK_VIEW_DOORS = {
  dashboard: ['counter', 'needs'], register: ['contracts', 'list', 'wall'], folder: ['contracts', 'list'], workspace: ['document'],
  redline: ['negotiations', 'redline'], intel: ['insights'], reports: ['insights'], obligations: ['oblig', 'week'],
  approvals: ['approvals'], pipeline: ['approvals'], customers: ['parties'], agents: ['house'], jambo: ['house'], brain: ['brain'],
  calendar: ['calendar'], mynotes: ['mynotes'], handbook: ['handbook'], templates: ['ourpaper'], playbook: ['ourpaper'],
  intake: ['requests'], advice: ['requests'], directory: ['people'], team: ['settings', 'company'], migration: ['import'] };
const HBK_FACE_DOORS = { board: ['board'], paper: ['document'], calendar: ['calendar'], explorer: ['explorer'] };
function hbkChaptersForPage(view, face){
  const first = (face && HBK_FACE_DOORS[face]) || [], then = HBK_VIEW_DOORS[view] || [];
  const doors = new Set([].concat(first, then));
  if (!doors.size) return [];
  const pathDoors = c => (c.path || []).filter(x => typeof x === 'string' && x.startsWith('door:')).map(x => x.slice(5));
  const named = c => new Set([].concat(c.doors || [], pathDoors(c), hbkMarkersOf(c).filter(m => m.kind === 'door').map(m => m.key)));
  /* how closely a chapter is about the page: it owns Home's face (its `doors`, 0) or starts there (1), it owns the
     page (2) or starts there (3), it only mentions it (4); a tie goes to the chapter owning more of the page */
  const has = (list, set) => list.some(d => set.includes(d));
  const rank = c => { const p0 = pathDoors(c)[0], cd = c.doors || [];
    return has(cd, first) ? 0 : first.includes(p0) ? 1 : has(cd, then) ? 2 : then.includes(p0) ? 3 : 4; };
  const width = c => (c.doors || []).filter(d => doors.has(d)).length;
  return HANDBOOK_CHAPTERS.filter(c => [...named(c)].some(d => doors.has(d)))
    .map((c, i) => ({ c, r: rank(c), w: width(c), i })).sort((a, b) => a.r - b.r || b.w - a.w || a.i - b.i).map(x => x.c).slice(0, 4);
}

const HBK_API = { HANDBOOK_CHECKED, HANDBOOK_PARTS, HANDBOOK_CHAPTERS, HBK_MARK_RE, hbkPartOf, hbkChapterOf, hbkChaptersOf, hbkDoorsNamed, hbkTextsOf, hbkMarkersOf, hbkFind,
  HBK_ABOUT, hbkPlainOf, hbkPartPlain, hbkChapterPlain, hbkAboutPlain, hbkSearchDocs, hbkPlainFor, HBK_VIEW_DOORS, HBK_FACE_DOORS, hbkChaptersForPage };
if (typeof window !== 'undefined') Object.assign(window, HBK_API);
if (typeof module !== 'undefined' && module.exports) module.exports = HBK_API;
