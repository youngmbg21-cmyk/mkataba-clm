/* ============================================================
   THE NAVIGATION EXAM (owner, 22 Oct 2026: "if a person can reach a place by
   pressing, they can reach it by asking Jambo — in one step, from any Jambo
   box on any page")
   ============================================================
   Every line is an everyday "take me to …" sentence and the EXACT spot it
   must land on, in the world of test/nav-world.js. Written BEFORE any of the
   navigation work was built, and measured against the code as it stood
   (the "before" score); every stage reruns it unchanged.

   THE SPOT, in one vocabulary (the browser check's `navWhere` reads the app
   into the same words):
     page      board · contracts · calendar · explorer · obligations ·
               approvals · negotiations · requests · templates · standards ·
               people · parties · notes · import · settings · paper · agents
     cid       a contract on Home's paper
     pane      what stands beside it: dossier · redlines · sign · fill · send ·
               oblig · hist · clauses · brief · amend
     clause    the clause number landed on the paper
     party     the party chosen on Parties (its key, lower case)
     filters   what Contracts is narrowed by: stage · stream · ending · party ·
               tab
     settings  { tab: you|company, page, row, person }
     item      the one thing chosen on its page (a template, a standards book,
               a standard, an obligation, a request, a person)
     reply     instead of moving: which (asks which was meant) · none (says it
               does not exist) · walled (says the reader may not see it)
   `box` is where it is typed (home unless named): home · chat · list ·
   settings · calendar · editor · builder · phone.
   `as` is who types it (admin unless named): admin · legal (a member, not an admin).
   A spot given as a LIST means any one of them is right (a bare word beside
   an open contract may fairly mean that contract's own).
   Every ordinary sentence starts from MK-Z9 open on Home, which no sentence
   names; the Board's own sentences start on the Board.
   ============================================================ */
const X = [];
let SEC = '';
const section = name => { SEC = name; };
const ask = (q, spot, o) => X.push(Object.assign({ q, spot, sec: SEC }, o || {}));

/* ---------- 1 · PAGES (the most used places) ---------- */
section('pages');
ask('take me to the board', { page: 'board' });
ask('go to the board', { page: 'board' });
ask('open contracts', { page: 'contracts' });
ask('show me all contracts', { page: 'contracts' });
ask('take me to the contracts list', { page: 'contracts' });
ask('open the calendar', { page: 'calendar' });
ask('my calendar', { page: 'calendar' });
ask('go to explorer', { page: 'explorer' });
ask('open the map of contracts', { page: 'explorer' });
/* a bare word beside an open contract may fairly mean that contract's own: either is right */
ask('obligations', [{ page: 'obligations' }, { page: 'paper', cid: 'MK-Z9', pane: 'oblig' }]);
ask('take me to obligations', { page: 'obligations' });
ask('show me all our duties', { page: 'obligations' });
ask('approvals', { page: 'approvals' });
ask('take me to approvals', { page: 'approvals' });
ask('what is waiting for my approval', { page: 'approvals' });
ask('negotiations', { page: 'negotiations' });
ask('open the negotiations list', { page: 'negotiations' });
ask('requests', { page: 'requests' });
ask('take me to requests', { page: 'requests' });
ask('open templates', { page: 'templates' });
ask('our templates', { page: 'templates' });
ask('our standards', { page: 'standards' });
ask('open the playbook', { page: 'standards' });
ask('people', { page: 'people' });
ask('take me to the people directory', { page: 'people' });
ask('parties', { page: 'parties' });
ask('open our customers', { page: 'parties' });
ask('my notes', { page: 'notes' });
ask('open my notes', { page: 'notes' });
ask('import', { page: 'import' });
ask('take me to import', { page: 'import' });
ask('settings', { page: 'settings' });
ask('open settings', { page: 'settings' });
ask("jambo's work", { page: 'agents' });
ask('what needs me', { page: 'board' });

/* ---------- 2 · A NAMED CONTRACT AND WHAT STANDS BESIDE IT ---------- */
section('contract');
ask('open MK-A1', { page: 'paper', cid: 'MK-A1' });
ask('take me to MK-B1', { page: 'paper', cid: 'MK-B1' });
ask('open the Kabras supply deal', { page: 'paper', cid: 'MK-A1' });
ask('the refined sugar supply', { page: 'paper', cid: 'MK-A1' });
ask('open the Kabras Sugar contract', { page: 'paper', cid: 'MK-A1' });
ask('take me to the Westlands lease', { page: 'paper', cid: 'MK-D2' });
ask('open the office lease', { page: 'paper', cid: 'MK-D2' });
ask('open the NDA with Brightwater', { page: 'paper', cid: 'MK-D1' });
ask('the Brightwater NDA', { page: 'paper', cid: 'MK-D1' });
ask('open the milk collection contract', { page: 'paper', cid: 'MK-A2' });
ask('take me to the Nandi Dairy contract', { page: 'paper', cid: 'MK-A2' });
ask('open the warehousing contract with Juno', { page: 'paper', cid: 'MK-C1' });
ask('the cold chain haulage draft', { page: 'paper', cid: 'MK-C2' });
ask('the brand campaign', { page: 'paper', cid: 'MK-E1' });
ask('redlines on the Naivas coast supply', { page: 'paper', cid: 'MK-B2', pane: 'redlines' });
ask('negotiate the coast supply', { page: 'paper', cid: 'MK-B2', pane: 'redlines' });
ask('the history of MK-B1', { page: 'paper', cid: 'MK-B1', pane: 'hist' });
ask('show me the history of the Kabras deal', { page: 'paper', cid: 'MK-A1', pane: 'hist' });
ask('obligations of the warehousing contract', { page: 'paper', cid: 'MK-C1', pane: 'oblig' });
ask('the duties in MK-A1', { page: 'paper', cid: 'MK-A1', pane: 'oblig' });
ask('fill in the details of the brand campaign', { page: 'paper', cid: 'MK-E1', pane: 'fill' });
ask('details for MK-C2', { page: 'paper', cid: 'MK-C2', pane: 'fill' });
ask('signing for the coast supply', { page: 'paper', cid: 'MK-B2', pane: 'sign' });
ask('take me to sign MK-A2', { page: 'paper', cid: 'MK-A2', pane: 'sign' });
ask('send the brand campaign to them', { page: 'paper', cid: 'MK-E1', pane: 'send' });
ask('share MK-C2', { page: 'paper', cid: 'MK-C2', pane: 'send' });
ask('the brief for MK-A1', { page: 'paper', cid: 'MK-A1', pane: 'brief' });
ask('read me the brief of the Westlands lease', { page: 'paper', cid: 'MK-D2', pane: 'brief' });
ask('clauses of the Kabras deal', { page: 'paper', cid: 'MK-A1', pane: 'clauses' });
ask('amend the Kabras supply agreement', { page: 'paper', cid: 'MK-A1', pane: 'amend' });
ask('the dossier of MK-D1', { page: 'paper', cid: 'MK-D1', pane: 'dossier' });

/* ---------- 3 · A CLAUSE OF A CONTRACT ---------- */
section('clause');
ask('clause 7 of the Kabras supply deal', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('take me to clause 3 of MK-A1', { page: 'paper', cid: 'MK-A1', clause: '3' });
ask('the payment clause in the Kabras contract', { page: 'paper', cid: 'MK-A1', clause: '3' });
ask('show me the liability clause of MK-A1', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('the confidentiality clause of the sugar supply', { page: 'paper', cid: 'MK-A1', clause: '5' });
ask('governing law in MK-A1', { page: 'paper', cid: 'MK-A1', clause: '8' });
ask('section 6 of the refined sugar supply', { page: 'paper', cid: 'MK-A1', clause: '6' });
ask('clause 4 in MK-A1', { page: 'paper', cid: 'MK-A1', clause: '4' });
ask('the term clause of the Kabras deal', { page: 'paper', cid: 'MK-A1', clause: '4' });
ask('where does MK-A1 talk about rejection', { page: 'paper', cid: 'MK-A1', clause: '6' });
ask('go to clause 2 of the Kabras agreement', { page: 'paper', cid: 'MK-A1', clause: '2' });
ask('clause 1 of MK-A1', { page: 'paper', cid: 'MK-A1', clause: '1' });

/* ---------- 4 · A PARTY'S FOLDER ---------- */
section('party');
ask("Juno's folder", { page: 'parties', party: 'juno logistics' });
ask('open Juno Logistics', { page: 'parties', party: 'juno logistics' });
ask('take me to the Kabras Sugar folder', { page: 'parties', party: 'kabras sugar' });
ask('the Naivas folder', { page: 'parties', party: 'naivas supermarkets' });
ask("Brightwater's folder", { page: 'parties', party: 'brightwater foods' });
/* a party with one contract may open that contract (the older rule: "bring up <one name>" is its strip) */
ask('show me Nandi Dairy', [{ page: 'parties', party: 'nandi dairy' }, { page: 'paper', cid: 'MK-A2' }]);
ask('the Pixel Agency folder', { page: 'parties', party: 'pixel agency' });
ask('Westlands Towers', [{ page: 'parties', party: 'westlands towers' }, { page: 'paper', cid: 'MK-D2' }]);
ask("open Naivas's folder", { page: 'parties', party: 'naivas supermarkets' });
ask('take me to Juno', { page: 'parties', party: 'juno logistics' });

/* ---------- 5 · CONTRACTS, NARROWED ---------- */
section('filters');
ask('contracts ending this quarter in Procurement', { page: 'contracts', filters: { ending: 'quarter', stream: 'proc' } });
ask('contracts ending this quarter', { page: 'contracts', filters: { ending: 'quarter' } });
ask('show me contracts in Procurement', { page: 'contracts', filters: { stream: 'proc' } });
ask('sales contracts', { page: 'contracts', filters: { stream: 'sales' } });
ask('the distribution contracts', { page: 'contracts', filters: { stream: 'dist' } });
ask('contracts in Corporate & Compliance', { page: 'contracts', filters: { stream: 'corp' } });
ask('signed contracts', { page: 'contracts', filters: { stage: 'signed' } });
ask('drafts', { page: 'contracts', filters: { stage: 'draft' } });
ask('show me the drafts in Distribution', { page: 'contracts', filters: { stage: 'draft', stream: 'dist' } });
ask('contracts under review', { page: 'contracts', filters: { stage: 'review' } });
ask('contracts with Naivas', { page: 'contracts', filters: { party: 'naivas supermarkets' } });
ask('all our contracts with Juno', { page: 'contracts', filters: { party: 'juno logistics' } });
ask('contracts ending this year', { page: 'contracts', filters: { ending: 'year' } });
ask('signed contracts in Sales', { page: 'contracts', filters: { stage: 'signed', stream: 'sales' } });
ask('contracts ending this quarter in Distribution', { page: 'contracts', filters: { ending: 'quarter', stream: 'dist' } });
ask('which contracts end this quarter', { page: 'contracts', filters: { ending: 'quarter' } });
ask('contracts in Marketing', { page: 'contracts', filters: { stream: 'mktg' } });
ask('under review in Sales', { page: 'contracts', filters: { stage: 'review', stream: 'sales' } });

/* ---------- 6 · SETTINGS: YOU ---------- */
section('settings: you');
ask('my language', { page: 'settings', settings: { tab: 'you', row: 'lang' } });
ask('change my language', { page: 'settings', settings: { tab: 'you', row: 'lang' } });
ask('my daily brief', { page: 'settings', settings: { tab: 'you', row: 'told' } });
ask('how often I get the brief', { page: 'settings', settings: { tab: 'you', row: 'told' } });
ask('alerts on this device', { page: 'settings', settings: { tab: 'you', row: 'told' } });
ask('turn on phone alerts', { page: 'settings', settings: { tab: 'you', row: 'told' } });
ask('two-step sign-in', { page: 'settings', settings: { tab: 'you', row: 'safety' } });
ask('change my password', { page: 'settings', settings: { tab: 'you', row: 'safety' } });
ask("when I'm away", { page: 'settings', settings: { tab: 'you', row: 'away' } });
ask('set someone to cover for me', { page: 'settings', settings: { tab: 'you', row: 'away' } });
ask('my name and job title', { page: 'settings', settings: { tab: 'you', row: 'who' } });
ask('download a copy of my data', { page: 'settings', settings: { tab: 'you', row: 'data' } });
ask("jambo's suggestions under his box", { page: 'settings', settings: { tab: 'you', row: 'work' } });

/* ---------- 7 · SETTINGS: THE COMPANY, A PERSON, A STREAM ---------- */
section('settings: company');
ask('the signing limit for Amina', { page: 'settings', settings: { tab: 'company', person: 'Amina Otieno', row: 'signcap' } });
ask("Grace's signing limit", { page: 'settings', settings: { tab: 'company', person: 'Grace Wanjiru', row: 'signcap' } });
ask('who can open Procurement', { page: 'settings', settings: { tab: 'company', page: 'streams', item: 'proc' } });
ask('access to the Sales stream', { page: 'settings', settings: { tab: 'company', page: 'streams', item: 'sales' } });
ask('approval rules', { page: 'settings', settings: { tab: 'company', page: 'approvals' } });
ask('take me to the approval rules', { page: 'settings', settings: { tab: 'company', page: 'approvals' } });
ask('add a person to HaTi', { page: 'settings', settings: { tab: 'company', page: 'people' } });
ask('the people in our workspace', { page: 'settings', settings: { tab: 'company', page: 'people' } });
ask("Grace's access", { page: 'settings', settings: { tab: 'company', page: 'people', person: 'Grace Wanjiru' } });
ask('exchange rates', { page: 'settings', settings: { tab: 'company', page: 'fx' } });
ask('the categories we file under', { page: 'settings', settings: { tab: 'company', page: 'filing' } });
ask('our value streams', { page: 'settings', settings: { tab: 'company', page: 'streams' } });
ask('how long we keep Procurement contracts', { page: 'settings', settings: { tab: 'company', page: 'keeping', item: 'proc' } });
ask("jambo's spending", { page: 'settings', settings: { tab: 'company', page: 'ai' } });
ask('the jambo key', { page: 'settings', settings: { tab: 'company', page: 'ai' } });
ask('codes on links', { page: 'settings', settings: { tab: 'company', page: 'links' } });
ask('internal review before sending', { page: 'settings', settings: { tab: 'company', page: 'review' } });
ask('the negotiation desk setting', { page: 'settings', settings: { tab: 'company', page: 'desk' } });

/* ---------- 8 · OUR STANDARDS AND TEMPLATES ---------- */
section('standards & templates');
ask('where do I change our liability standard for NDAs', { page: 'standards', item: 'nda', row: 'liabilityMonths' });
ask('our NDA standards', { page: 'standards', item: 'nda' });
ask('the standards for supply agreements', { page: 'standards', item: 'supply' });
ask('the payment terms standard', { page: 'standards', item: '_default', row: 'paymentDays' });
ask('our lease standards', { page: 'standards', item: 'lease' });
ask('the confidentiality standard for services', { page: 'standards', item: 'services', row: 'Confidentiality' });
ask('the NDA template', { page: 'templates', item: 'nda' });
ask('open the supply agreement template', { page: 'templates', item: 'supply' });
ask('our lease template', { page: 'templates', item: 'lease' });

/* ---------- 9 · OBLIGATIONS, REQUESTS, PEOPLE ---------- */
section('obligations, requests, people');
ask('the deposit payment to Kabras', { page: 'obligations', item: 'ob-dep' });
ask('the quarterly stock count', { page: 'obligations', item: 'ob-count' });
ask('duties due this week', { page: 'obligations', filters: { window: 'week' } });
ask('the request for a distributor NDA', { page: 'requests', item: 'NDA for a new distributor' });
ask('open the NDA request', { page: 'requests', item: 'NDA for a new distributor' });
ask("Grace's profile", { page: 'people', item: 'Grace Wanjiru' });
ask('find Grace Wanjiru', { page: 'people', item: 'Grace Wanjiru' });
ask('who is Amina', { page: 'people', item: 'Amina Otieno' });
ask('the approval waiting on me', { page: 'approvals' });

/* ---------- 10 · FROM EVERY BOX ---------- */
section('every box');
ask('open MK-A1', { page: 'paper', cid: 'MK-A1' }, { box: 'chat' });
ask("Juno's folder", { page: 'parties', party: 'juno logistics' }, { box: 'chat' });
ask('contracts ending this quarter in Procurement', { page: 'contracts', filters: { ending: 'quarter', stream: 'proc' } }, { box: 'chat' });
ask('the signing limit for Amina', { page: 'settings', settings: { tab: 'company', person: 'Amina Otieno', row: 'signcap' } }, { box: 'chat' });
ask('take me to the calendar', { page: 'calendar' }, { box: 'list' });
ask('open MK-B1', { page: 'paper', cid: 'MK-B1' }, { box: 'list' });
ask("Juno's folder", { page: 'parties', party: 'juno logistics' }, { box: 'list' });
ask('take me to the board', { page: 'board' }, { box: 'settings' });
ask('open the Kabras supply deal', { page: 'paper', cid: 'MK-A1' }, { box: 'settings' });
ask('take me to obligations', { page: 'obligations' }, { box: 'calendar' });
ask('open MK-C1', { page: 'paper', cid: 'MK-C1' }, { box: 'calendar' });
ask('take me to MK-B2', { page: 'paper', cid: 'MK-B2' }, { box: 'editor' });
ask('go to the contracts list', { page: 'contracts' }, { box: 'editor' });
ask('take me to MK-A2', { page: 'paper', cid: 'MK-A2' }, { box: 'builder' });
ask('go to our standards', { page: 'standards' }, { box: 'builder' });
ask('open MK-A1', { page: 'paper', cid: 'MK-A1' }, { box: 'phone' });
ask('take me to obligations', { page: 'obligations' }, { box: 'phone' });
ask("Juno's folder", { page: 'parties', party: 'juno logistics' }, { box: 'phone' });

/* ---------- 11 · ON THE BOARD, "TAKE ME TO" MOVES ---------- */
section('board moves');
ask('take me to the contracts ending this quarter', { page: 'contracts', filters: { ending: 'quarter' } }, { box: 'board' });
ask('take me to MK-A1', { page: 'paper', cid: 'MK-A1' }, { box: 'board' });
ask('take me to obligations', { page: 'obligations' }, { box: 'board' });

/* ---------- 12 · WHICH DID YOU MEAN, IT DOES NOT EXIST, IT IS WALLED ---------- */
section('which / none / walled');
ask('open the Naivas contract', { reply: 'which' });
ask('the Juno contract', { reply: 'which' });
ask('open the Tesla contract', { reply: 'none' });
ask('take me to clause 12 of MK-A1', { reply: 'none' });
ask("Zawadi's folder", { reply: 'none' });
ask('the signing limit for Amina', { reply: 'walled' }, { as: 'legal' });
ask('approval rules', { reply: 'walled' }, { as: 'legal' });
ask("jambo's spending", { reply: 'walled' }, { as: 'legal' });

/* ---------- 13 · SVENSKA ---------- */
section('svenska');
ask('öppna kalendern', { page: 'calendar' });
ask('ta mig till avtalen', { page: 'contracts' });
ask('öppna MK-A1', { page: 'paper', cid: 'MK-A1' });
ask('klausul 7 i MK-A1', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('Junos mapp', { page: 'parties', party: 'juno logistics' });
ask('avtal som löper ut detta kvartal i inköp', { page: 'contracts', filters: { ending: 'quarter', stream: 'proc' } });
ask('mitt språk', { page: 'settings', settings: { tab: 'you', row: 'lang' } });
ask('våra standarder för sekretessavtal', { page: 'standards', item: 'nda' });
ask('åtaganden', [{ page: 'obligations' }, { page: 'paper', cid: 'MK-Z9', pane: 'oblig' }]);
ask('godkännanden', { page: 'approvals' });

module.exports = { NAV_EXAM: X };
