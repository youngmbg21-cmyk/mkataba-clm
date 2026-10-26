/* THE HANDBOOK EXAM (owner, 26 Oct 2026: "the goal is to have jambo be the cure to all question related to the
   platform but it is not closing the gap"; "we are looking to address the issue across HaTi, not just the handbook")
   ============================================================
   Questions a person asks about HaTi ITSELF, in their own words, from every part of the app, each with the chapter(s)
   that answer it. Scored through Jambo's one search exactly as the chat calls it (search_hati with kinds ["guide"]):
   a question passes when an answering chapter is among the first three found. The model is handed the person's
   words alone here — in the chat he adds the app's words too, so this is the floor, not the ceiling.
   Used by test/f938-jambo-reads-the-handbook.test.js (HBK_EXAM_FLOOR) and run alone to print the gaps:
     node test/handbook-exam.js */
const HBK_EXAM = [
  /* the book itself — the owner's own question */
  ['what is the handbook about?', ['about']],
  ['where are the instructions for hati', ['about', '0.5']],
  /* 0 · getting around */
  ['what does the home page show me', ['0.1']],
  ['how do I get back to the start page', ['0.1']],
  ['how do I ask jambo something', ['0.2']],
  ['what happens when I type a slash', ['0.2']],
  ['what does the number on the bell mean', ['0.3']],
  ['where do I see my notifications', ['0.3']],
  ['what is the dossier', ['0.4']],
  ['what are the six stages of a contract', ['0.4']],
  ['what is the guide in the side panel', ['0.5']],
  ['how do I find a contract', ['0.6']],
  /* 1 · someone asks */
  ['how do I ask legal for a new contract', ['1.1']],
  ['how do I raise a request for advice', ['1.1']],
  ['how do I bring in our old contracts', ['1.2']],
  ['can I import a folder of signed contracts', ['1.2']],
  /* 2 · draft it */
  ['how do I start a new contract', ['2.1']],
  ['how do I draft an agreement from a sentence', ['2.1']],
  ['how do I upload a document', ['2.2']],
  ['where do I fill in the key terms', ['2.3']],
  ['how do I make a new template', ['2.4']],
  ['what is our paper', ['2.4']],
  ['where do I set our standard positions', ['2.5']],
  ['what is the playbook', ['2.5']],
  /* 3 · agree the words */
  ['how do I accept or reject their changes', ['3.1']],
  ['how do I counter a change from the other side', ['3.1']],
  ['how do I edit a clause with jambo', ['3.2']],
  ['what is the ladder', ['3.2']],
  ['how do I send the contract to the other side', ['3.3']],
  ['what does the counterparty see', ['3.4']],
  ['how do I ask a colleague to review before sending', ['3.5']],
  ['what is the negotiation desk and who is the lead', ['3.6']],
  ['how do I leave a comment on a clause', ['3.7']],
  ['where are the risky clauses', ['3.8']],
  ['what is the close plan', ['3.9']],
  /* 4 · sign */
  ['how do I approve a contract', ['4.1']],
  ['what still blocks signing', ['4.2']],
  ['how do I sign a contract', ['4.2']],
  ['how do I choose who signs and in what order', ['4.3']],
  ['can I sign with docusign or on paper', ['4.4']],
  ['what happens after everyone has signed', ['4.5']],
  /* 5 · keep it alive */
  ['how do I mark an obligation as done', ['5.1']],
  ['what is due this week', ['5.1', '5.2']],
  ['how do I plan my week in the calendar', ['5.2']],
  ['how do I amend a signed contract', ['5.3']],
  ['how do I renew or end a contract', ['5.3']],
  ['where do I see everything about one supplier', ['5.4']],
  ['how do I ask one question across many contracts', ['5.5']],
  ['how do I keep a private note to myself', ['5.6']],
  ['how do I archive a contract', ['5.7']],
  ['what is a legal hold', ['5.7']],
  ['what is a code name on a contract', ['5.7']],
  /* 6 · see the whole book */
  ['what do the numbers on the board mean', ['6.1']],
  ['how do I use the explorer map', ['6.2']],
  ['what has jambo done on his own', ['6.3']],
  ['what is the brain', ['6.4']],
  /* 7 · settings and rules */
  ['how do I add a person and give them a role', ['7.1']],
  ['how do I set a signing limit for someone', ['7.1']],
  ['who can see a private stream', ['7.2']],
  ['how do I turn on two-step sign-in', ['7.3']],
  ['how do I add an exchange rate', ['7.4']],
  ['who can change the currency rates', ['7.4']],
  ['how much does jambo cost and where is the budget', ['7.5']],
];
module.exports = { HBK_EXAM };

if (require.main === module) {
  (async () => {
    const { startHati, seedWorkspace } = require('./helpers');
    const h = await startHati(); const W = await seedWorkspace(h);
    let ok = 0; const miss = [];
    for (const [q, want] of HBK_EXAM) {
      const r = await W.admin.json('/api/hati-search?kinds=guide&limit=3&q=' + encodeURIComponent(q));
      const got = (r.hits || []).map(x => x.chapter || x.ref);
      if (got.some(k => want.includes(k))) ok++; else miss.push(`${q}  → wanted ${want.join('/')}, got ${got.join(', ') || 'nothing'}`);
    }
    console.log(`${ok} of ${HBK_EXAM.length} (${Math.round(ok / HBK_EXAM.length * 100)}%)`);
    miss.forEach(m => console.log('  MISS ' + m));
    await h.stop();
  })();
}
