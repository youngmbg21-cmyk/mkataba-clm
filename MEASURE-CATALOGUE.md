# The measure catalogue

**Status: first draft, for Young to mark up.** Nothing here is built. This is the
document the analytics get generated from — the dashboard, the weekly report, the
onboarding and every business shape we add later all read from this list.

Mark it up however is easiest. The three marks that matter:

- **CUT** — I would not act on this. (Use freely. A shorter catalogue is a better one.)
- **KEEP** — a real owner changes what they do this week because of this.
- **MISSING** — something a customer asked you for that is not here.

---

## The idea in one page

We are not building analytics per industry. There is no meaningful difference
between a roofer and an interior designer, or between a food manufacturer's supply
agreements and a gym's memberships. The difference that matters is the **shape of
the contract**, and there are only five.

Every business is a **mix of shapes**. A roofer is mostly *project* with a little
*standing*. A food manufacturer is mostly *standing* with one *framework*. A law
firm is *standing* employment plus *project* matters. Nobody is only one shape.

That gives three layers, and only the middle one varies:

| Layer | What it is | Varies by |
|---|---|---|
| **The frame** | Five questions every business has | Never |
| **The fill** | Which measures answer them | The shape mix |
| **The order** | Which comes first | The three worries |

### The frame — five questions, every business, no exceptions

| # | Panel | The question |
|---|---|---|
| **1** | What I'm committed to | What is on my books and what is it worth? |
| **2** | What's coming | What needs a decision, and when? |
| **3** | Where my paper is thin | What is missing, one-sided or inconsistent in my own documents? |
| **4** | Who I'm exposed to | Who am I dependent on, and how concentrated is that? |
| **5** | How my paper performs | What happens when I actually use my documents? |

Those five are the dashboard panels and the report slots. They never change
position, never grow, and never shrink. A roofer and a bank see the same five.

### The five shapes

| Shape | What it does | Its natural axis | Typical holders |
|---|---|---|---|
| **Standing** | Runs until someone stops it | The renewal calendar | Suppliers, employment, leases, licences, memberships |
| **Project** | Starts, runs, completes, leaves a tail | The job lifecycle | Roofing, interiors, construction, consulting, events |
| **Framework** | Master agreement, orders underneath | Volume against tiers | Haulage, distribution, MSA + statements of work |
| **Funding** | Money in, tied to conditions | The reporting calendar | Grants, donor programmes, sponsorships |
| **One-shot** | Signed once, no lifecycle | Expiry, if any | NDAs, settlements, assignments, waivers |

---

## How to read the catalogue

Every measure has:

- **Needs** — `Contract` (read off a signed document), `HaTi` (the platform's own
  filing record), or `Mark` (someone taps a status in HaTi — the only new habit,
  and only ever one tap).
- **Panel** — which of the five it feeds.
- **Worry** — which onboarding card ranks it.
- **Volume** — does it need enough contracts to be a statistic (`n≥20`), or does it
  work on a single document (`any`)? Anything marked `any` is a *check*, and
  checks are what make HaTi useful to a business with eleven contracts.

---

# A · Universal measures

**These fifteen work for every business in every shape.** If we built nothing else,
a roofer, a bank and a charity would each get a usable dashboard. This is the
spine — mark cuts here most carefully.

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| U1 | Total contracted value on the books | What is committed, in and out? | Contract | 1 | leak | any |
| U2 | Value by category | Where does the money sit? | Contract | 1 | leak | any |
| U3 | Count of live agreements | How big is my book? | Contract | 1 | — | any |
| U4 | Dates falling due in the window | What needs me in the next 30 / 90 days? | Contract | 2 | deadline | any |
| U5 | Dates that passed with nothing filed | What did we let slide? | HaTi | 2 | deadline | any |
| U6 | Agreements with no cap on what I owe | Where am I exposed without limit? | Contract | 3 | risk | any |
| U7 | Rights I hold with no filing ever made under them | What am I entitled to and not using? | HaTi | 3 | leak | any |
| U8 | Terms that differ from my own standard | Which of my documents is the odd one out? | Contract | 3 | risk | any |
| U9 | Agreements missing a clause my others have | What did we forget to include? | Contract | 3 | risk | any |
| U10 | Share held by the largest counterparty | How concentrated am I? | Contract | 4 | concentration | any |
| U11 | Share held by the top three | The number a lender asks for | Contract | 4 | concentration | any |
| U12 | Counterparties appearing under several agreements | Who am I more tangled with than I realise? | Contract | 4 | concentration | any |
| U13 | Time from first draft to signature | How long does my paper take? | HaTi | 5 | speed | n≥20 |
| U14 | Share signed on my own template vs theirs | Whose paper wins, and what does that cost? | HaTi | 5 | speed | n≥20 |
| U15 | Changes proposed and still unresolved | What is waiting on a decision from us? | HaTi | 5 | speed | any |

---

# B · Standing shape

*Runs until someone stops it. The axis is the renewal calendar.*
Suppliers, employment, leases, licences, memberships.

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| S1 | Value ending per month, 18 months ahead | What is up for renewal and when? | Contract | 2 | deadline | any |
| S2 | Notice deadlines before the renewal date | When must I actually decide, not when does it end? | Contract | 2 | deadline | any |
| S3 | Renewals that passed with no decision recorded | What renewed itself while nobody was looking? | HaTi | 2 | deadline | any |
| S4 | Agreements that renew with no decision point written in | Which ones can never be caught in time? | Contract | 3 | deadline | any |
| S5 | Increase clauses with no ceiling | Who can raise their price by anything they like? | Contract | 3 | leak | any |
| S6 | A rate on file above the ceiling in the parent agreement | Is anyone charging more than they agreed? | Contract | 3 | leak | any |
| S7 | Price-adjustment rights I hold and have never used | Where could I have raised my own prices? | HaTi | 1 | leak | any |
| S8 | Rebate or discount tiers written in, never claimed | What am I entitled to and not asking for? | HaTi | 1 | leak | any |
| S9 | Agreements I cannot leave early | Where am I locked in? | Contract | 3 | risk | any |
| S10 | Exit rights that are one-way in their favour | Where can they walk and I can't? | Contract | 3 | risk | any |
| S11 | Sole-source suppliers with no alternative named anywhere | Who could stop and leave me stuck? | Contract | 4 | concentration | any |
| S12 | Contracts ending in the same month, clustered | Is one month carrying too many decisions? | Contract | 2 | deadline | any |
| S13 | Payment terms compared across similar agreements | Am I paying some faster than others for the same thing? | Contract | 3 | leak | any |
| S14 | Terms compared against my other agreements in the same category | Is this one worse than the rest of my book? | Contract | 3 | leak | any |

---

# C · Project shape

*Starts, runs, completes, leaves a tail. The axis is the job lifecycle.*
Roofing, interiors, construction, consulting, events, installations.

**This shape's central insight: the job ends but the contract does not.** A roofer
with 60 finished jobs is quietly carrying 60 live warranty obligations, and nobody
anywhere tracks them.

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| P1 | Committed job-weeks ahead | Have I sold more work than I can staff? | Contract | 2 | deadline | any |
| P2 | Jobs starting in the next N weeks, by value | What is landing, and how big? | Contract | 2 | deadline | any |
| P3 | Jobs overrunning their stated duration | Which are late against the document, not against a guess? | Contract + Mark | 2 | deadline | any |
| P4 | Live warranty obligations from completed jobs | How many finished jobs am I still on the hook for? | Contract + Mark | 1 | risk | any |
| P5 | Warranty tails expiring in the window | What comes off my books soon? | Contract + Mark | 2 | risk | any |
| P6 | Warranty periods longer than my standard | Did we quietly give someone ten years? | Contract | 3 | risk | any |
| P7 | Retention past its release date, never claimed | Whose money am I leaving with the customer? | Contract + HaTi | 1 | leak | any |
| P8 | Jobs with no written variation procedure | How do change orders get agreed — on a handshake? | Contract | 3 | risk | any |
| P9 | Variations filed after the work they describe | The dispute factory: are we papering things afterwards? | HaTi | 3 | risk | any |
| P10 | Variation uplift as a share of original value | Do our quotes systematically under-scope? | HaTi | 5 | leak | n≥20 |
| P11 | Quote-to-signature conversion rate | Which quotes turn into work? | HaTi | 5 | speed | n≥20 |
| P12 | Days before an unsigned quote goes cold | When should I chase, and when is it dead? | HaTi | 5 | speed | n≥20 |
| P13 | Jobs with no deposit or stage-payment clause | Am I funding the customer's job out of my own pocket? | Contract | 3 | leak | any |
| P14 | Jobs with no weather / delay / access clause | Who carries the risk when the site isn't ready? | Contract | 3 | risk | any |
| P15 | Subcontractor warranty shorter than the one I gave the customer | Which years of that warranty are mine alone? | Contract | 3 | risk | any |
| P16 | Repeat customers vs one-time | Is anyone actually coming back? | Contract | 4 | concentration | any |
| P17 | Value concentration by job type | Which kind of work is my business really made of? | Contract | 4 | concentration | any |

> **P15 is the roofer's version of the charity's flow-down gap** — the same
> document-against-document comparison, in a completely different world. That
> reuse is the clearest evidence the shape architecture is right.

---

# D · Framework shape

*A master agreement with orders called off underneath.*

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| F1 | Orders called off under each framework | How much is actually flowing through it? | Contract | 1 | leak | any |
| F2 | Volume tiers written in and never reached | What discount is sitting just out of reach? | Contract | 1 | leak | any |
| F3 | Frameworks with no orders at all | Which agreements exist but do nothing? | HaTi | 1 | leak | any |
| F4 | Framework expiring before its live orders do | Will orders outlive the paper that governs them? | Contract | 2 | risk | any |
| F5 | Orders whose terms differ from the framework | Is anyone calling off on the wrong terms? | Contract | 3 | risk | any |
| F6 | Exclusivity granted and what was got for it | What did that exclusivity cost? | HaTi | 3 | risk | any |

---

# E · Funding shape

*Money in, tied to conditions and reporting.*

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| G1 | Reports due in the window | What do I owe the funder next? | Contract | 2 | compliance | any |
| G2 | Closed periods with nothing filed here | Did a report actually go in? | HaTi | 2 | compliance | any |
| G3 | Funding carrying a clawback condition | How much could be asked back? | Contract | 1 | compliance | any |
| G4 | Extension deadlines approaching | When must I ask, before the balance goes back? | Contract | 2 | deadline | any |
| G5 | Conditions not flowed down to partner agreements | Where does the chain break? | Contract | 3 | compliance | any |
| G6 | Share of funding from the largest funder | How exposed am I to one relationship ending? | Contract | 4 | concentration | any |
| G7 | Reallocation margin compared across funders | Which funder is strictest, and how strict? | Contract | 3 | compliance | any |
| G8 | Posts ending the same day as the grant funding them | Will I lose the team the day the money stops? | Contract | 4 | people | any |

---

# F · One-shot shape

*Signed once, no lifecycle. Deliberately thin — this shape does not deserve a tab.*

| # | Measure | The question it answers | Needs | Panel | Worry | Volume |
|---|---|---|---|---|---|---|
| O1 | Confidentiality periods reaching their end | What protection lapses soon? | Contract | 2 | risk | any |
| O2 | Return-or-destroy duties with no completion recorded | What am I still holding that I shouldn't be? | HaTi | 3 | compliance | any |

---

# G · Employment — a note, not a shape

Employment is *standing* shaped, so it inherits S1–S14. But it is the one category
**every organisation on earth holds**, and its measures are the same in a roofing
firm and a bank. Worth listing so we don't lose them:

| # | Measure | Needs | Panel | Worry |
|---|---|---|---|---|
| E1 | Probation periods reaching their end date | Contract | 2 | people |
| E2 | Fixed terms reaching the end of their stated period | Contract | 2 | people |
| E3 | Contracts with no written notice period at all | Contract | 3 | people |
| E4 | Restrictive covenants longer than my own standard | Contract | 3 | people |
| E5 | Contracts pointing at a policy not held here | HaTi | 3 | people |

> **Deliberately excluded:** anything that states a legal conclusion. HaTi says
> *"this fixed term reaches its end date on 14 November"*, never *"which passes the
> statutory limit"*. The first is a fact in a document; the second is legal advice.

---

# What onboarding actually asks

Not a metrics menu — the customer cannot answer that, and asking is us pushing our
job onto them.

**Step 1 · Detect and confirm the shape mix.** The signature is unmistakable in the
documents: durations instead of end dates, dozens of near-identical customer
contracts, no notice clauses → project. HaTi proposes, the human confirms.

> *"We read 47 one-off jobs and 6 standing agreements — right?"*

**Step 2 · Three questions the documents genuinely cannot answer.**

| Question | Why it earns its place |
|---|---|
| What do you call one? | *Job · matter · project · engagement · case · booking.* This word appears ~40 times across the product. Getting it right is most of what "built for me" feels like. |
| What counts as big for you? | So the risk map knows what a large one is. A roofer's big job and a bank's big deal differ by three orders of magnitude. |
| What is your standard warranty / notice / retention? | So *"this one differs from your standard"* becomes computable — it powers U8, S14, P6 and P15. |

**Step 3 · Pick three worries.** Already designed. Sets the ranking, never hides a
deadline or a critical finding.

Five questions. Ninety seconds. No metrics menu.

---

# The rules that keep this from becoming a pile

1. **The test for every row.** *Would a real owner change what they do this week
   because of this number?* If not — cut. This is the only defence against the
   pile-up, and it is a judgement Young is better placed to make than I am.
2. **Checks before statistics.** Anything marked `any` works on one document. A
   business with eleven contracts still gets a working product; percentages unlock
   at twenty per category and say so until then.
3. **`Mark` is one tap, never a form.** Two project measures (P3, P4/P5) need a job
   marked complete in HaTi. That is the platform's own record, like filing a
   decision — not an integration, not a timesheet.
4. **Nothing from outside.** No figure in this catalogue needs the accounts, an
   ERP, an index or a market benchmark. Every one is `Contract`, `HaTi` or `Mark`.
5. **The frame never grows.** New shapes add rows to the fill. They never add a
   sixth panel.

---

# What I need from you

The catalogue is my guesswork about businesses you have actually met. Four things
would make the next draft real rather than plausible:

1. **Two or three real contract sets** — anonymised, or just described. *"A typical
   roofer has X, Y, Z."* One project-shaped and one standing-shaped is enough.
2. **Which shape your next ten customers are.** If most of the pipeline is
   project-shaped, we build that first and the standing machinery waits.
3. **The vocabulary.** What do your customers call a job, a customer, a quote?
4. **Any measure you have been asked for that is not here.** This is the highest
   value thing you can give me. I can produce plausible measures all day; I cannot
   produce the one a roofer mentioned to you in passing.

---

# Sequencing, once this is marked up

| | |
|---|---|
| **First** | The 15 universal measures + shape detection. Every business gets something real. |
| **Second** | Standing and project together. The two most different shapes — if the frame holds across both, it holds. |
| **Third** | Funding, framework, one-shot. Each is a data exercise by then, not a build. |
| **Then** | Every new shape is rows in this document. No new screens, ever. |

---

*Draft 1 — for markup. Nothing built. Every measure here is answerable from a
signed document, HaTi's own filing record, or one tap.*
