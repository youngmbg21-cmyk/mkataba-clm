/* Clause-model fixtures — shaped like the PROTOTYPE'S OWN CONTRACT.
   ============================================================
   This file exists because of a lesson already paid for. The clause model this
   session replaces passed 664 tests while returning fourteen nameless
   fragments for a six-clause contract. It passed because its fixtures had been
   shaped to fit the implementation: single-sentence clauses, contiguous
   numbering, ALL-CAPS headings — precisely the document its heuristic could
   read, and no other.

   So these are shaped to fit the PRODUCT instead, and every property that
   broke the old model is present on purpose:

     · headings in the prototype's own house style, "Clause 4 · Payment Terms",
       which contains lowercase and therefore failed the old all-caps test
     · non-contiguous numbering — 1, 4, 5, 6, 9, 12 — as the prototype has it,
       so nothing can quietly use the number as an index
     · multi-sentence bodies, and one multi-PARAGRAPH body, so "one clause, one
       badge, one decision" is actually tested rather than assumed
     · an ALL-CAPS variant ("4. PAYMENT TERMS") — how an uploaded Word contract
       reads — that must segment to the same six clauses with the same numbers
     · a headingless document, which must not degrade to zero clauses */

/* The prototype's six clauses, verbatim from prototype.html. */
const PROTO_CLAUSES = [
  { num: '1', title: 'Scope of Services',
    text: "The Provider shall receive, store, handle, and dispatch the Client's goods at the designated facility, and shall perform related logistics services including inventory reporting, order picking, and outbound carrier coordination, in accordance with the service schedule in Annex A." },
  { num: '4', title: 'Payment Terms',
    text: 'All invoices are payable within thirty (30) days from the date of issue (Net-30). Late payments will incur a service charge of 1.5% per month on the outstanding balance. Invoices shall be issued monthly in arrears and delivered electronically.' },
  { num: '5', title: 'Storage Conditions and Duration',
    text: "Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days. After that period, the Provider reserves the right to charge additional fees or relocate the goods to an alternative facility at the Client's cost." },
  { num: '6', title: 'Liability and Insurance',
    text: "The Provider's aggregate liability for loss of or damage to stored goods shall not exceed the full replacement value of the affected goods. The Provider shall maintain warehouse legal liability insurance adequate to cover such exposure." },
  { num: '9', title: 'Termination Notice',
    text: "Either party may terminate this Agreement for convenience by giving the other party not less than sixty (60) days' written notice. Termination shall not affect fees accrued for services already rendered." },
  { num: '12', title: 'Governing Law and Disputes',
    text: 'This Agreement is governed by the laws of Kenya. Any dispute arising out of or in connection with this Agreement shall first be referred to good-faith negotiation between senior representatives of the parties before any formal proceedings.' },
];

const PROTO_TITLE = 'Warehousing and Logistics Services Agreement';
const PROTO_META = 'Between Wanjiru Catering Ltd (Nairobi, Kenya) and Nordfrakt Logistik AB '
  + '(Malmö, Sweden) · Drafted in HaTi wizard · Template WH';

/* Clause 5's body split across two paragraphs. A multi-paragraph clause is ONE
   clause — the property the old line-splitting model could not represent at
   all, because it made one clause per line. */
function _body(cl){
  if (cl.num !== '5') return `<p>${cl.text}</p>`;
  const at = cl.text.indexOf(' After that period');
  return `<p>${cl.text.slice(0, at).trim()}</p><p>${cl.text.slice(at).trim()}</p>`;
}

/* The prototype's document: <h1> title, meta line, six <h2> clauses. */
function protoRich(opts = {}){
  const only = opts.only || null;
  const cls = only ? PROTO_CLAUSES.filter(c => only.includes(c.num)) : PROTO_CLAUSES;
  return `<h1>${PROTO_TITLE}</h1><p>${PROTO_META}</p>`
    + cls.map(cl => `<h2>Clause ${cl.num} · ${cl.title}</h2>${_body(cl)}`).join('');
}

/* The same contract as an uploaded Word file reads: ALL-CAPS numbered
   headings. Six clauses, same numbers, titles in caps. */
function protoRichCaps(){
  return `<h1>${PROTO_TITLE.toUpperCase()}</h1><p>${PROTO_META}</p>`
    + PROTO_CLAUSES.map(cl => `<h2>${cl.num}. ${cl.title.toUpperCase()}</h2>${_body(cl)}`).join('');
}

/* A document with no headings at all. Must not segment to zero clauses. */
function protoRichHeadingless(){
  return PROTO_CLAUSES.map(cl => `<p>${cl.num}. ${cl.text}</p>`).join('');
}

/* Deeper structure: an <h3> sub-heading inside clause 6 belongs to clause 6's
   BODY, not to a clause of its own. */
function protoRichNested(){
  return `<h1>${PROTO_TITLE}</h1><p>${PROTO_META}</p>`
    + PROTO_CLAUSES.map(cl => cl.num === '6'
      ? `<h2>Clause 6 · ${cl.title}</h2><p>${cl.text}</p>`
        + `<h3>6.1 Excluded perils</h3><p>Nothing in this clause covers loss arising from inherent vice.</p>`
      : `<h2>Clause ${cl.num} · ${cl.title}</h2>${_body(cl)}`).join('');
}

/* The counterparty's asks, exactly as prototype.html's changes[] carries them.
   Reused by the negotiation scenarios so the two never drift. */
const PROTO_ASKS = {
  '4': { summary: 'Payment terms extended from Net-30 to Net-45',
    text: 'All invoices are payable within forty-five (45) days from the date of issue (Net-45). Late payments will incur a service charge of 1.5% per month on the outstanding balance. Invoices shall be issued monthly in arrears and delivered electronically.' },
  '5': { summary: 'Storage term reduced to 90 days with extended-stay premium',
    text: 'Stored goods may remain in the facility for a maximum of ninety (90) days. Any extension beyond 90 days will incur a 1.25% premium rate.' },
  '6': { summary: 'Liability capped at EUR 250,000 per contract year',
    text: "The Provider's aggregate liability for loss of or damage to stored goods shall not exceed EUR 250,000 in the aggregate per contract year. The Provider shall maintain warehouse legal liability insurance adequate to cover such exposure." },
  '9': { summary: 'Termination notice shortened from 60 to 30 days',
    text: "Either party may terminate this Agreement for convenience by giving the other party not less than thirty (30) days' written notice. Termination shall not affect fees accrued for services already rendered." },
};

module.exports = { PROTO_CLAUSES, PROTO_TITLE, PROTO_META, PROTO_ASKS,
  protoRich, protoRichCaps, protoRichHeadingless, protoRichNested };
