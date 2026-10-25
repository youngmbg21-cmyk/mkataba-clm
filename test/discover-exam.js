/* ============================================================
   THE DISCOVER EXAM (owner, 25 Oct 2026: stage 0 of
   docs/PLAN-jambo-discover.md — "measure first")
   ============================================================
   Forty questions of the wording, asked of every contract in
   test/discover-world.js, the way a person asks them: the plain question,
   the short label, a yes/no, a casual one, and a few in Swedish. HELD OUT:
   no sentence here may be copied into a prompt, a word list or an example to
   make it pass; Jambo is improved by what the questions MEAN.

   Each question names the FACT whose truth grades it (the world's TRUTH) and
   its FORM: 'amount' (the answer must match the truth's pattern) or 'yesno'
   (the answer's own yes or no must match the truth's polarity; the detail is
   never read for it, so "90 days to say no" is not a "no"; an answer giving
   the amount instead, with no yes or no, is right when it matches).

   THE MARK, per question per contract (grade below):
     right         the answer is right (or "not found" where the wording is silent;
                   "no wording" where there is none)
     wrong         found where the wording is silent, not found where it speaks,
                   or the words do not match the truth
     dead          no answer came back for this contract (an error, a failed
                   read): a dead end, counted on its own
   and, beside the mark, for a found answer: whether its sentence was checked
   against the wording (quoteMissing false), and, once stage 1 gives one,
   whether its verdict ('in' / 'out' of the company's rule) is right.
   ============================================================ */

const X = [];
const ask = (fact, form, q) => X.push({ fact, form, q });

/* notice to end */
ask('notice', 'amount', 'How much notice does each side need to end the contract early?');
ask('notice', 'amount', 'Can we get out of this deal early, and on how much notice?');
ask('notice', 'amount', 'termination for convenience notice period');
ask('notice', 'amount', 'How many days warning to cancel?');
ask('notice', 'amount', 'If we want to walk away, how long do we have to give them?');
ask('notice', 'amount', 'Who can end it early, and how fast?');
ask('notice', 'amount', 'Hur lång uppsägningstid gäller?');
/* liability cap */
ask('cap', 'amount', 'Is our liability capped, and at what?');
ask('cap', 'amount', "What's the most we could owe them if things go wrong?");
ask('cap', 'amount', 'liability cap');
ask('cap', 'yesno', 'Is there a limit on damages?');
ask('cap', 'amount', 'What is the liability limit?');
ask('cap', 'amount', 'How much can they claim from us, at most?');
ask('cap', 'amount', 'Finns det ett tak för skadeståndet?');
/* governing law */
ask('law', 'amount', "Which country's law governs this contract?");
ask('law', 'amount', 'governing law');
ask('law', 'amount', 'Under whose law is this?');
ask('law', 'amount', 'What jurisdiction applies?');
ask('law', 'yesno', 'Is this under Kenyan law?');
ask('law', 'amount', 'what law');
ask('law', 'amount', 'Vilket lands lag gäller?');
/* auto-renewal */
ask('renewal', 'amount', 'Does the contract renew by itself, and how long before must we say no?');
ask('renewal', 'amount', 'auto renewal notice');
ask('renewal', 'yesno', 'Will this roll over automatically?');
ask('renewal', 'amount', 'How many days before the end must we say we are not renewing?');
ask('renewal', 'yesno', 'Does it renew automatically?');
ask('renewal', 'yesno', 'evergreen clause?');
ask('renewal', 'yesno', 'Förnyas avtalet automatiskt?');
/* personal data */
ask('data', 'amount', 'Does the other side process personal data for us, and are there processing terms?');
ask('data', 'amount', 'data protection terms');
ask('data', 'amount', "Do they handle our customers' personal information, and under what terms?");
ask('data', 'amount', 'personal data clause');
ask('data', 'amount', 'What does it say about personal data?');
ask('data', 'amount', 'Hanterar de personuppgifter åt oss?');
/* payment days */
ask('payment', 'amount', 'How long do we have to pay an invoice?');
ask('payment', 'amount', 'payment terms');
ask('payment', 'amount', 'How many days to pay?');
ask('payment', 'amount', 'When is payment due?');
ask('payment', 'amount', 'Betalningsvillkor?');
ask('payment', 'amount', 'What are the payment terms in days?');

/* THE DUE DILIGENCE PACK (the owner's first pack): the plain question of each of its five facts */
const PACK_DD = ['notice', 'cap', 'law', 'renewal', 'data'].map(f => X.find(x => x.fact === f).q);

/* yes or no, read off the words: a "no" word first (so "not capped" is no), then a "yes" word */
const NO_RE = /\b(no|nej|not|none|does not|doesn't|unlimited|uncapped|expires|inte|ingen)\b/i;
const YES_RE = /\b(yes|ja|it does|automatic(ally)?|renews|capped|limited|förnyas)\b/i;
function polarity(text){
  if (NO_RE.test(text)) return false;
  if (YES_RE.test(text)) return true;
  return null;
}

/* the mark for one answer: a = the route's answer for one contract (or undefined), truth = TRUTH[id][fact] or {noWording} */
function grade(item, truth, a){
  if (!a) return { mark: 'dead' };
  if (truth.noWording) return { mark: a.noWording ? 'right' : 'wrong', why: 'no wording' };
  if (a.noWording) return { mark: 'wrong', why: 'said no wording' };
  const text = [a.answer, a.detail].filter(Boolean).join(' · ');
  const out = { text };
  if (!truth.found) {
    /* the wording is silent: "not found" is right; a yes/no question may also be answered "no" */
    const ok = !a.found || (item.form === 'yesno' && polarity(text) === false);
    return Object.assign(out, { mark: ok ? 'right' : 'wrong', why: ok ? '' : 'found where the wording is silent' });
  }
  if (!a.found) return Object.assign(out, { mark: 'wrong', why: 'not found where the wording speaks' });
  out.quoted = a.quoteMissing === false && !!a.quote;
  if (a.verdict === 'in' || a.verdict === 'out' || a.verdict === 'norule') out.verdictRight = a.verdict === (truth.verdict || 'norule');
  let ok;
  if (item.form === 'yesno') {
    /* the yes or no is read off the ANSWER alone: a detail like "90 days to say no" is not a "no" */
    const p = polarity(a.answer || '');
    ok = p === truth.yes || (p === null && truth.re.test(text));
  } else ok = truth.re.test(text);
  return Object.assign(out, { mark: ok ? 'right' : 'wrong', why: ok ? '' : 'the words do not match' });
}

module.exports = { DISCOVER_EXAM: X, PACK_DD, grade, polarity };
