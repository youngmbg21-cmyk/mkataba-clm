/* ============================================================
   THE JAMBO EXAM (owner, 22 Oct 2026: "anyone can ask Jambo anything in plain
   words, in any Jambo box on any page … Never a dead end." — "Measure
   honestly. Before building, write a held-out test of at least 200 everyday
   asks")
   ============================================================
   HELD OUT: none of these sentences is in test/nav-exam.js, and none may be
   copied into a reader's word list to make it pass. A reader is improved by
   what the asks MEAN, never by their exact words. Written BEFORE any of the
   "Jambo works like Copilot" work was built, and measured against the code as
   it stood (the "before" score); every stage reruns it unchanged.

   The world is test/nav-world.js plus test/jambo-world.js (one private note);
   the facts below are that world's facts.

   THE SPOT is test/nav-exam.js's vocabulary (page · cid · pane · clause ·
   party · filters · settings · item · reply which/none/walled), plus:
     reply 'answer'   Jambo answers in words. `says` is a list of patterns ALL
                      found in the answer (case ignored); `cites` a list of
                      contract ids of which at least ONE is cited (a card or
                      the id in the words). A dead end never passes.
     reply 'clarify'  Jambo asks one short question with 2–4 choices (or
                      "which did you mean" with its picks).
     board            on the Board: the card it opened or added holds exactly
                      `filters`' rows, or it answered with `says`.
     explorer         on Explorer: `groupBy` is what the map is grouped by;
                      `filters` the dots left showing.
   `box` and `as` as in test/nav-exam.js, plus box 'explorer'.
   A spot given as a LIST means any one of them is right.
   EVERY ask also counts as a DEAD END when Jambo answers "I wasn't able to
   finish that", "could not draw that", "something went wrong", a bare error,
   or nothing at all — reported on its own, whatever the spot.
   ============================================================ */
const { quarterEnd, inDays } = require('./nav-world');

const X = [];
let SEC = '';
const section = name => { SEC = name; };
const ask = (q, spot, o) => X.push(Object.assign({ q, spot, sec: SEC }, o || {}));
const answer = (says, cites) => ({ reply: 'answer', says: says || [], cites: cites || null });
const clarify = { reply: 'clarify' };

/* A DAY SAID ANY WAY A PERSON SAYS IT: 31 December 2026 · Dec 31 · 2026-12-31 · 31/12 */
const MON = ['jan', 'feb', 'mar', 'apr', 'ma[jy]', 'jun', 'jul', 'aug', 'sep', 'o[ck]t', 'nov', 'dec'];
function dayRe(iso){
  const [, m, d] = iso.split('-').map(Number), mo = MON[m - 1], dd = String(d);
  return `(${dd}(st|nd|rd|th)?\\.?\\s*(of\\s*)?${mo}|${mo}[a-z]*\\.?\\s*${dd}\\b|${iso}|${dd}/${m}\\b|${dd}/${String(m).padStart(2, '0')})`;
}
const NEXT_YEAR_END = `${new Date().getFullYear() + 1}-11-30`;
const M = n => `(\\b${n}\\s*(m\\b|million|mn)|${n},000,000|${n}[  ]000[  ]000|${n}\\.0\\s*m)`;

/* ---------- 1 · GOING SOMEWHERE, SAID ANOTHER WAY ---------- */
section('go');
ask('bring up the board please', { page: 'board' });
ask('I want to see every contract we have', { page: 'contracts' });
ask('can you open the contract list for me', { page: 'contracts' });
ask("what's on my calendar", [{ page: 'calendar' }, answer([])]);
ask('show the explorer map', { page: 'explorer' });
ask('where do I see all our obligations', { page: 'obligations' });
ask('list everything waiting for approval', { page: 'approvals' });
ask('where are the negotiations', { page: 'negotiations' });
ask('show incoming requests', { page: 'requests' });
ask('where do we keep templates', { page: 'templates' });
ask('show me the playbook standards', { page: 'standards' });
ask('who works here', [{ page: 'people' }, { page: 'settings', settings: { tab: 'company', page: 'people' } }]);
ask('list our customers and suppliers', { page: 'parties' });
ask('show my private notes', { page: 'notes' });
ask('where do I bring in old signed contracts', { page: 'import' });
ask('preferences', { page: 'settings' });
ask('pull up MK-D2', { page: 'paper', cid: 'MK-D2' });
ask('show me the courier contract', { page: 'paper', cid: 'MK-Z9' });
ask('open the haulage agreement with Juno', { page: 'paper', cid: 'MK-C2' });
ask('I need the Pixel Agency campaign contract', { page: 'paper', cid: 'MK-E1' });
ask('the lease for our Westlands office', { page: 'paper', cid: 'MK-D2' });
ask('the dairy contract', { page: 'paper', cid: 'MK-A2' });
ask('open the modern trade listing', { page: 'paper', cid: 'MK-B1' });
ask('what happened on the milk collection deal so far', [{ page: 'paper', cid: 'MK-A2', pane: 'hist' }, answer([], ['MK-A2'])]);
ask('who did what on MK-C1', [{ page: 'paper', cid: 'MK-C1', pane: 'hist' }, answer([], ['MK-C1'])]);
ask('what do we owe under the warehousing deal', [{ page: 'paper', cid: 'MK-C1', pane: 'oblig' }, answer(['stock count'], ['MK-C1'])]);
ask('summarise the brand campaign contract', [{ page: 'paper', cid: 'MK-E1', pane: 'brief' }, answer([], ['MK-E1'])]);
ask('start negotiating the milk contract', { page: 'paper', cid: 'MK-A2', pane: 'redlines' });
ask("let's get MK-B2 signed", { page: 'paper', cid: 'MK-B2', pane: 'sign' });
ask('send the haulage draft to Juno', { page: 'paper', cid: 'MK-C2', pane: 'send' });
ask('what details are missing on the brand campaign', [{ page: 'paper', cid: 'MK-E1', pane: 'fill' }, answer([], ['MK-E1'])]);
ask('make an amendment to the Westlands lease', { page: 'paper', cid: 'MK-D2', pane: 'amend' });
ask('Kabras Sugar, all their paperwork', [{ page: 'parties', party: 'kabras sugar' }, { page: 'paper', cid: 'MK-A1' }]);
ask('everything we have with Naivas Supermarkets', [{ page: 'parties', party: 'naivas supermarkets' }, { page: 'contracts', filters: { party: 'naivas supermarkets' } }]);
ask('list the drafts we are still writing', { page: 'contracts', filters: { stage: 'draft' } });
ask('which Distribution contracts are signed', [{ page: 'contracts', filters: { stage: 'signed', stream: 'dist' } }, answer(['MK-C1|warehousing', 'MK-Z9|courier'])]);
ask('procurement deals that end before the quarter is out', { page: 'contracts', filters: { ending: 'quarter', stream: 'proc' } });
ask('show only the marketing stream', { page: 'contracts', filters: { stream: 'mktg' } });
ask('where can I change the exchange rate', { page: 'settings', settings: { tab: 'company', page: 'fx' } });
ask('where do I set who covers me on holiday', { page: 'settings', settings: { tab: 'you', row: 'away' } });

/* ---------- 2 · INSIDE THE WORDING: A CLAUSE BY WHAT IT MEANS ---------- */
section('clause by meaning');
ask('where does the sugar deal say how fast we pay', { page: 'paper', cid: 'MK-A1', clause: '3' });
ask('find where Kabras can be sued and under which law', { page: 'paper', cid: 'MK-A1', clause: '8' });
ask('the bit about sending back bad sugar', { page: 'paper', cid: 'MK-A1', clause: '6' });
ask('show me how much Kabras can be liable for', [{ page: 'paper', cid: 'MK-A1', clause: '7' }, answer(['twelve|12'], ['MK-A1'])]);
ask('how long does the Kabras agreement run, show me', [{ page: 'paper', cid: 'MK-A1', clause: '4' }, answer(['two years|2 years'], ['MK-A1'])]);
ask('where does it say the sugar terms are secret', { page: 'paper', cid: 'MK-A1', clause: '5' });
ask('the part of MK-A1 that defines words', { page: 'paper', cid: 'MK-A1', clause: '1' });
ask('the delivery promise in the sugar contract', { page: 'paper', cid: 'MK-A1', clause: '2' });
ask('the clause about invoices in MK-A1', { page: 'paper', cid: 'MK-A1', clause: '3' });
ask('cap on damages in the refined sugar deal', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('which contract mentions rejecting goods within seven days', answer([], ['MK-A1']));
ask('do any of our contracts say thirty days to pay', answer([], ['MK-A1']));
ask('find contracts governed by Kenyan law', answer([], ['MK-A1']));
ask('which agreements have a confidentiality clause', answer([], ['MK-A1']));
ask('search for liability capped at twelve months of fees', answer([], ['MK-A1']));
ask('where is the deposit we owe Kabras', [{ page: 'obligations', item: 'ob-dep' }, answer([dayRe(inDays(5)) + '|5 days|five days|deposit'], ['MK-A1'])]);
ask('when is the stock count due', [{ page: 'obligations', item: 'ob-count' }, answer([dayRe(inDays(12)) + '|12 days|twelve days'])]);
ask('the distributor who wants an NDA', [{ page: 'requests', item: 'NDA for a new distributor' }, answer(['coastline'])]);
ask('find my note about calling Kabras', [{ page: 'notes' }, answer(['kabras'])]);
ask('what did I write down about the deposit', [{ page: 'notes' }, answer(['deposit|kabras'])]);
ask('find Grace', { page: 'people', item: 'Grace Wanjiru' });
ask('the person called Wanjiru', [{ page: 'people', item: 'Grace Wanjiru' }, answer(['grace'])]);
ask('the standard we use for how many days to pay', { page: 'standards', item: '_default', row: 'paymentDays' });
ask('the template for a non-disclosure agreement', { page: 'templates', item: 'nda|non-disclosure' });
ask('which template should I use for a supply deal', [{ page: 'templates', item: 'supply' }, answer(['supply'])]);

/* ---------- 3 · PLAIN QUESTIONS, ANSWERED WITH THEIR SOURCE ---------- */
section('questions');
ask('how much is the Kabras deal worth', answer([M(48)], ['MK-A1']));
ask('what is MK-B1 worth', answer([M(85)], ['MK-B1']));
ask('when does the Westlands lease end', answer([dayRe(NEXT_YEAR_END)], ['MK-D2']));
ask('when does the sugar supply contract expire', answer([dayRe(quarterEnd())], ['MK-A1']));
ask('who is the other side on MK-C2', answer(['juno'], ['MK-C2']));
ask('who are we contracting with on the brand campaign', answer(['pixel'], ['MK-E1']));
ask('is the Brightwater NDA signed', answer(['signed|yes'], ['MK-D1']));
ask('what stage is the coast supply at', answer(['review'], ['MK-B2']));
ask('is the haulage contract still a draft', answer(['draft|yes'], ['MK-C2']));
ask('what are the payment terms in MK-A1', answer(['30|thirty'], ['MK-A1']));
ask('what law governs the Kabras contract', answer(['kenya'], ['MK-A1']));
ask('how long can Kabras sugar be rejected for', answer(['seven|7'], ['MK-A1']));
ask("what is each party's liability capped at under MK-A1", answer(['twelve|12'], ['MK-A1']));
ask('how many contracts do we have with Naivas', answer(['\\b2\\b|two'], ['MK-B1', 'MK-B2']));
ask('how many contracts do we have with Juno Logistics', answer(['\\b2\\b|two'], ['MK-C1', 'MK-C2']));
ask('how many drafts do we have', [answer(['\\b2\\b|two']), { page: 'contracts', filters: { stage: 'draft' } }]);
ask('how many contracts are signed', [answer(['\\b6\\b|six']), { page: 'contracts', filters: { stage: 'signed' } }]);
ask('which contracts end this quarter', [answer(['MK-A1|sugar', 'MK-C1|warehous']), { page: 'contracts', filters: { ending: 'quarter' } }]);
ask('what is our biggest contract', answer(['naivas|MK-B1|modern trade'], ['MK-B1']));
ask('what is our smallest paid contract', answer(['courier|MK-Z9|swift'], ['MK-Z9']));
ask('what is the total value of our Naivas deals', answer([M(163)]));
ask('which stream has the most contracts', answer(['distribution']));
ask('what kind of contract is MK-D2', answer(['lease'], ['MK-D2']));
ask('which contracts are under review', [answer(['MK-A2|milk|dairy', 'MK-B2|coast']), { page: 'contracts', filters: { stage: 'review' } }]);
ask('what is waiting on me today', [answer([]), { page: 'board' }]);
ask('what do we owe this week', [answer(['deposit']), { page: 'obligations', filters: { window: 'week' } }]);
ask('which of our duties are due soon', [answer(['deposit|stock count']), { page: 'obligations' }]);
ask('what requests are open', [answer(['distributor|coastline']), { page: 'requests' }]);
ask('what does Grace Wanjiru do here', [answer(['legal']), { page: 'people', item: 'Grace Wanjiru' }]);
ask('who is our admin', answer(['amina']));
ask('compare the two Naivas contracts', answer(['MK-B1|modern trade', 'MK-B2|coast']));
ask('what is the difference between the warehousing and haulage deals', answer(['warehous', 'haulage|cold chain']));
ask('what changed in the Kabras deal since the first version', [{ page: 'paper', cid: 'MK-A1', pane: 'compare' }, answer(['six|6|twelve|12'], ['MK-A1'])]);
ask('does the courier contract carry money', answer([], ['MK-Z9']));
ask('what is the Mutual NDA about', answer(['confidential|secret|non-disclosure|nda'], ['MK-D1']));
ask('which contracts are in Procurement', [answer(['MK-A1|sugar', 'MK-A2|milk|dairy']), { page: 'contracts', filters: { stream: 'proc' } }]);
ask('anything expiring next year', answer([]));
ask('what does Jambo think are the risks in MK-A1', [answer([], ['MK-A1']), { page: 'paper', cid: 'MK-A1' }]);
ask('what should I do next on the coast supply', [answer([], ['MK-B2']), { page: 'paper', cid: 'MK-B2' }]);
ask('can I sign MK-A2 now', [answer([], ['MK-A2']), { page: 'paper', cid: 'MK-A2', pane: 'sign' }]);
ask('why is the coast supply not signed yet', answer([], ['MK-B2']));
ask('who signed the office lease', answer([], ['MK-D2']));
ask('how much do we spend with Juno in total', answer([M(21)]));
ask('when did we last change the Kabras contract', answer([], ['MK-A1']));
ask('what is in clause 6 of MK-A1', [answer(['reject|specification'], ['MK-A1']), { page: 'paper', cid: 'MK-A1', clause: '6' }]);

/* ---------- 4 · ON THE BOARD ---------- */
section('board');
ask('how many live contracts do we have', { board: { says: ['\\b10\\b|ten'] } }, { box: 'board' });
ask('show the Naivas deals', { board: { filters: { party: 'naivas supermarkets' } } }, { box: 'board' });
ask('just the signed ones', { board: { filters: { stage: 'signed' } } }, { box: 'board' });
ask('only procurement please', { board: { filters: { stream: 'proc' } } }, { box: 'board' });
ask('what ends this quarter', { board: { filters: { ending: 'quarter' } } }, { box: 'board' });
ask('add a chart of value by stream', { board: { added: true } }, { box: 'board' });
ask('chart the contracts by stage', { board: { added: true } }, { box: 'board' });
ask('total value under contract', { board: { says: [M(310) + '|310'] } }, { box: 'board' });
ask('how much is in drafts', { board: { says: [M(24) + '|24'] } }, { box: 'board' });
ask('which customer is worth the most', { board: { says: ['naivas'] } }, { box: 'board' });
ask('show me the Juno contracts', { board: { filters: { party: 'juno logistics' } } }, { box: 'board' });
ask('the drafts in distribution', { board: { filters: { stage: 'draft', stream: 'dist' } } }, { box: 'board' });
ask('clear the filter', { board: { cleared: true } }, { box: 'board' });
ask('how many contracts are waiting on us', { board: { says: ['\\d'] } }, { box: 'board' });
ask('make a table of the sales contracts', { board: { filters: { stream: 'sales' } } }, { box: 'board' });
ask('how many obligations are overdue', { board: { says: ['\\b0\\b|no |none|zero'] } }, { box: 'board' });
ask('open the Kabras deal', { page: 'paper', cid: 'MK-A1' }, { box: 'board' });
ask('go to the warehousing contract', { page: 'paper', cid: 'MK-C1' }, { box: 'board' });
ask('take me to Grace in people', { page: 'people', item: 'Grace Wanjiru' }, { box: 'board' });
ask('take me to my language setting', { page: 'settings', settings: { tab: 'you', row: 'lang' } }, { box: 'board' });

/* ---------- 5 · ON EXPLORER, THE MAP ---------- */
section('explorer');
ask('group by customer', { explorer: { groupBy: 'counterparty' } }, { box: 'explorer' });
ask('group them by status', { explorer: { groupBy: 'status' } }, { box: 'explorer' });
ask('arrange the map by value', { explorer: { groupBy: 'valueBand' } }, { box: 'explorer' });
ask('cluster by contract type', { explorer: { groupBy: 'kind' } }, { box: 'explorer' });
ask('group by when they expire', { explorer: { groupBy: 'expiry' } }, { box: 'explorer' });
ask('back to value streams', { explorer: { groupBy: 'folder' } }, { box: 'explorer' });
ask('show only the Naivas dots', { explorer: { filters: { party: 'naivas supermarkets' } } }, { box: 'explorer' });
ask('filter to signed contracts', { explorer: { filters: { stage: 'signed' } } }, { box: 'explorer' });
ask('only show procurement', { explorer: { filters: { stream: 'proc' } } }, { box: 'explorer' });
ask('just the drafts', { explorer: { filters: { stage: 'draft' } } }, { box: 'explorer' });
ask('which contracts end this quarter', [{ explorer: { filters: { ending: 'quarter' } } }, answer(['MK-A1|sugar', 'MK-C1|warehous'])], { box: 'explorer' });
ask('how many contracts are on the map', answer(['\\b10\\b|ten']), { box: 'explorer' });
ask('what is the biggest dot', answer(['naivas|MK-B1|modern trade']), { box: 'explorer' });
ask('explain what I am looking at', answer([]), { box: 'explorer' });
ask('leave the map and go back to the board', { page: 'board' }, { box: 'explorer' });

/* ---------- 6 · TYPOS ---------- */
section('typos');
ask('opne MK-A1', { page: 'paper', cid: 'MK-A1' });
ask('the kabras suger deal', { page: 'paper', cid: 'MK-A1' });
ask('the westland lese', { page: 'paper', cid: 'MK-D2' });
ask('calender', { page: 'calendar' });
ask('obligatons', [{ page: 'obligations' }, { page: 'paper', cid: 'MK-Z9', pane: 'oblig' }]);
ask('naivass folder', { page: 'parties', party: 'naivas supermarkets' });
ask('clause 7 of kabbras', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('aprovals', { page: 'approvals' });
ask('templetes', { page: 'templates' });
ask('signd contracts', { page: 'contracts', filters: { stage: 'signed' } });
ask('contrcts ending this quater', { page: 'contracts', filters: { ending: 'quarter' } });
ask('whats the paymnet terms in MK-A1', answer(['30|thirty'], ['MK-A1']));
ask('grace wanjru', { page: 'people', item: 'Grace Wanjiru' });
ask('explorr', { page: 'explorer' });
ask('teh board', { page: 'board' });
ask('show me teh drafts', { page: 'contracts', filters: { stage: 'draft' } });
ask('my langauge', { page: 'settings', settings: { tab: 'you', row: 'lang' } });
ask('setings', { page: 'settings' });
ask('liabilty clause of MK-A1', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('nandi diary contract', { page: 'paper', cid: 'MK-A2' });
ask('brightwatter NDA', { page: 'paper', cid: 'MK-D1' });
ask('juno logistcs folder', { page: 'parties', party: 'juno logistics' });
ask('standrds for NDA', { page: 'standards', item: 'nda' });
ask('the warehousng contract', { page: 'paper', cid: 'MK-C1' });
ask('how mcuh is the kabras deal worth', answer([M(48)], ['MK-A1']));

/* ---------- 7 · VAGUE: ONE SHORT QUESTION WITH CHOICES, NEVER A DEAD END ---------- */
section('vague');
ask('the Juno one', [clarify, { reply: 'which' }]);
ask('the supply agreement', [clarify, { reply: 'which' }]);
ask('the draft', [clarify, { reply: 'which' }]);
ask('the Naivas deal', [clarify, { reply: 'which' }]);
ask('the one under review', [clarify, { reply: 'which' }]);
ask('the big one', [clarify, { reply: 'which' }]);
ask('the contract ending soon', [clarify, { reply: 'which' }, { page: 'contracts', filters: { ending: 'quarter' } }]);
ask('help', [clarify, answer([])]);
ask('what can you do', answer([]));
ask('I need to do something about Naivas', [clarify, { reply: 'which' }, { page: 'parties', party: 'naivas supermarkets' }]);
ask('change it', [clarify, answer([])]);
ask('the milk or sugar one', [clarify, { reply: 'which' }]);
ask('send it', [clarify, { page: 'paper', cid: 'MK-Z9', pane: 'send' }]);
ask('the limit', [clarify, { page: 'settings' }]);
ask('the NDA', [{ page: 'paper', cid: 'MK-D1' }, clarify, { reply: 'which' }]);
ask('the logistics contract', [clarify, { reply: 'which' }]);
ask('report', [clarify, answer([])]);
ask('something about payment', [clarify, answer([])]);
ask('the contract with the retailer', [clarify, { reply: 'which' }]);
ask('Grace', [{ page: 'people', item: 'Grace Wanjiru' }, clarify]);

/* ---------- 8 · SVENSKA ---------- */
section('svenska');
ask('visa alla avtal', { page: 'contracts' });
ask('öppna tavlan', { page: 'board' });
ask('ta mig till utforskaren', { page: 'explorer' });
ask('visa mina anteckningar', { page: 'notes' });
ask('öppna förfrågningar', { page: 'requests' });
ask('öppna mallarna', { page: 'templates' });
ask('vilka arbetar här', [{ page: 'people' }, { page: 'settings', settings: { tab: 'company', page: 'people' } }]);
ask('öppna inställningar', { page: 'settings' });
ask('öppna Kabras-avtalet', { page: 'paper', cid: 'MK-A1' });
ask('hyresavtalet i Westlands', { page: 'paper', cid: 'MK-D2' });
ask('betalningsklausulen i MK-A1', { page: 'paper', cid: 'MK-A1', clause: '3' });
ask('ansvarsbegränsningen i sockeravtalet', { page: 'paper', cid: 'MK-A1', clause: '7' });
ask('Naivas mapp', { page: 'parties', party: 'naivas supermarkets' });
ask('undertecknade avtal', { page: 'contracts', filters: { stage: 'signed' } });
ask('utkast i distribution', { page: 'contracts', filters: { stage: 'draft', stream: 'dist' } });
ask('hur mycket är Kabras-avtalet värt', answer([M(48)], ['MK-A1']));
ask('när löper hyresavtalet ut', answer([dayRe(NEXT_YEAR_END) + '|november|nov'], ['MK-D2']));
ask('vilken lag gäller för MK-A1', answer(['kenya'], ['MK-A1']));
ask('hur många avtal har vi med Juno', answer(['\\b2\\b|två'], ['MK-C1', 'MK-C2']));
ask('vad är betalningsvillkoren i MK-A1', answer(['30|trettio'], ['MK-A1']));
ask('mitt lösenord', { page: 'settings', settings: { tab: 'you', row: 'safety' } });
ask('växelkurser', { page: 'settings', settings: { tab: 'company', page: 'fx' } });
ask('vem är Grace', [{ page: 'people', item: 'Grace Wanjiru' }, answer(['grace'])]);
ask('Juno-avtalet', [clarify, { reply: 'which' }]);
ask('gruppera efter kund', { explorer: { groupBy: 'counterparty' } }, { box: 'explorer' });

/* ---------- 9 · WHAT DOES NOT EXIST, AND WHAT IS WALLED ---------- */
section('none / walled');
ask('open MK-Q7', { reply: 'none' });
ask('contracts with Safaricom', [{ reply: 'none' }, answer(['no |none|not find|no contracts|0'])]);
ask('clause 15 of the Kabras deal', { reply: 'none' });
ask('the Coca-Cola folder', { reply: 'none' });
ask('the employment contract with Peter', [{ reply: 'none' }, answer(['no |not find|none'])]);
ask('open the franchise template', [{ reply: 'none' }, answer(['no |not find|none|no franchise'])]);
ask("show me Amina's signing limit", { reply: 'walled' }, { as: 'legal' });
ask('change the approval rules', { reply: 'walled' }, { as: 'legal' });
ask('how much has Jambo cost us this month', { reply: 'walled' }, { as: 'legal' });
ask('set up the AI key', { reply: 'walled' }, { as: 'legal' });
ask('turn on link codes for the company', { reply: 'walled' }, { as: 'legal' });
ask('add a new user', { reply: 'walled' }, { as: 'legal' });

/* ---------- 10 · FROM EVERY BOX ---------- */
section('every box');
ask('how much is the Kabras deal worth', answer([M(48)], ['MK-A1']), { box: 'chat' });
ask('the bit about sending back bad sugar', { page: 'paper', cid: 'MK-A1', clause: '6' }, { box: 'chat' });
ask('the Juno one', [clarify, { reply: 'which' }], { box: 'chat' });
ask('when does the Westlands lease end', answer([dayRe(NEXT_YEAR_END)], ['MK-D2']), { box: 'list' });
ask('pull up MK-D2', { page: 'paper', cid: 'MK-D2' }, { box: 'list' });
ask('where do I set who covers me on holiday', { page: 'settings', settings: { tab: 'you', row: 'away' } }, { box: 'settings' });
ask('what law governs the Kabras contract', answer(['kenya'], ['MK-A1']), { box: 'settings' });
ask('when is the stock count due', [{ page: 'obligations', item: 'ob-count' }, answer([dayRe(inDays(12)) + '|12 days|twelve days'])], { box: 'calendar' });
ask('what are the payment terms in MK-A1', answer(['30|thirty'], ['MK-A1']), { box: 'editor' });
ask('show me the courier contract', { page: 'paper', cid: 'MK-Z9' }, { box: 'editor' });
ask('the template for a non-disclosure agreement', { page: 'templates', item: 'nda|non-disclosure' }, { box: 'builder' });
ask('how many contracts do we have with Naivas', answer(['\\b2\\b|two'], ['MK-B1', 'MK-B2']), { box: 'phone' });
ask('pull up MK-D2', { page: 'paper', cid: 'MK-D2' }, { box: 'phone' });

module.exports = { JAMBO_EXAM: X };
