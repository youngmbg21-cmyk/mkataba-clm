# WORK ORDER — THE WRITING TOOLBAR, AND WORK MODE

Owner-asked 27 Aug 2026, in the owner's own words:

> *"I have noticed that most of the best in class CLM companies have a contract
> on screen that is like a Google Docs or word document with regards to the
> features on top of the bar to add bullet points, underline, cross the
> statement, color a statement etc. my platform lacks that completely. I want
> HaTi to have this. When in the negotiations screen, you should be able to go
> to work mode where all disappears apart from the contract and the side panels
> where you have assistant to work with copilot etc. the contract is white and
> above it is all the tools."*

Understanding was put to the owner BEFORE any code was written, as asked, and
three questions came back answered. **Those three answers are the whole shape of
this order and none of them may be quietly widened.**

## THE THREE RULINGS

1. **ONE CLAUSE AT A TIME, with a full toolbar.** Not type-anywhere. The
   Google-Docs cursor-anywhere reading was drawn and refused: every edit in this
   product is filed as a tracked change against ONE clause, carrying a
   fingerprint the other side verifies, and a free cursor across the whole
   document would have to rebuild that. **This is a decision about how much is
   built, not about how it looks** — the reader still gets a Word-like bar over
   a white page.
2. **COLOUR: A SHORT FIXED LIST.** Not a colour picker. Named colours only,
   chosen so that none of them is the green or the red the redline already uses.
3. **THE FULL BAR LIVES IN WORK MODE.** The ordinary negotiation screen keeps
   the five buttons it already has. Nothing is taken away anywhere.

## WHAT WAS ALREADY THERE, so this is a finishing job and not a new one

- The clause panel's **"Propose new wording"** editor has been rich since it was
  built: bold, italic, underline, bullets, numbering. Five buttons, and
  ⌘B/⌘I/⌘U besides. Most writers never find it.
- **Focus mode** on the negotiation page already stands the sidebar, the shell
  bar, the room head, the tab row and the round line down and gives the window
  to the paper. What it cannot do is let anybody write.
- **The clause editor page** (Edit with Copilot) is already the shape the owner
  drew: the whole window to one clause, the paper in the middle, Copilot down
  the right-hand third. It is the page this order calls WORK MODE.

## THE FINDING THAT SIZES THE JOB

**The page the owner described is the one editing surface in the product with no
formatting at all.** Its spine is a PLAIN STRING: the undo stack, the live
redline, the cost line, the word counts, the Copilot cards and the playbook
standards all pass plain text around, and `cePullText` reads `textContent` on
every keystroke — so bold typed into that box is thrown away before it can reach
anything.

So the toolbar is not a button-adding job there. That page has to learn to carry
formatted wording first.

**IT IS A NATURAL CHANGE RATHER THAN A FIGHT, and that is worth saying:** the
clause already stores `bodyHtml` beside its `text`, a filed change already
stores `bodyHtml` beside its `newText`, and `negoEditClause` — the funnel this
page files through — has always TAKEN rich HTML, because the panel's editor
hands it `innerHTML`. **The page was reading the stripped-down copy of data that
was already rich.** Nothing new is stored and there is no migration.

## THE SIX QUESTIONS

Only the answers that CHANGED what is built are written down, as the rulebook
asks.

**Q2 — the cheapest channel.** The toolbar is not a band and no band is added.
It is the control itself, which is the rung this rule points at for something a
reader presses. No new notice, strip, banner or tip anywhere in this order.

**Q3 — the contract's pixels. THIS ONE BIT, and it is why ruling 3 exists.** A
toolbar above the paper grows the distance from the top of the window to the
first line of the wording — which this rule refuses outright. In WORK MODE it
costs nothing net: the shell bar, the sidebar, the room head, the tab row and
the round line have all already stood down, so the bar is paid for many times
over out of chrome on the same screen. On the ordinary negotiation screen it
would cost about a bar's height, which is exactly why the full bar does not go
there. **Both numbers are measured in a real browser and reported.**

**Q5 — the one door. THIS ONE SHAPED THE BUILD MORE THAN ANY OTHER.** Writing
into a clause already has two ways in, and this order adds NO third editor:

- the toolbar is ONE builder with two shelves, so the panel's five buttons and
  work mode's full bar are one definition rather than two that agree today;
- that builder lives BESIDE THE ALLOWLIST that decides what formatting a
  contract may hold, deliberately — a bar offering something the allowlist
  strips is a dead press, and one file is what stops the two drifting;
- work mode's editing is the page that already exists, made rich. Not a new
  page, not a second box.

**Q1 — the standard answer.** The general practice in serious contract software
is that the drafter's own marks and the redline's marks are kept apart, because
a reader must be able to tell "somebody emphasised this" from "somebody deleted
this". That is what ruling 2 protects and it is why the palette excludes green
and red. No named product's behaviour is asserted here.

## WHAT IS BUILT

### 1. Colour, opened narrowly

The document allowlist refuses `style` on everything and permits exactly one
span class today. It grows a **fixed set of named colour and highlight classes**
and nothing else: no `style`, no arbitrary class, no picker, no hex ever
reaching storage. A colour that is not on the list does not survive a save.

**THE PALETTE EXCLUDES GREEN AND RED, and that is a safety property rather than
a taste.** On the paper, green means inserted and struck red means deleted. A
drafter who could colour a word the redline's own green would be writing a
sentence the other side reads as somebody else's edit.

### 2. One toolbar, two shelves

- **compact** — bold, italic, underline, bullets, numbering. What the side panel
  draws today, unchanged in what it offers.
- **full** — the above plus cross out, indent and outdent, text colour,
  highlight, and clear formatting.

Both from one builder, one press handler, one list of what each button does.

### 3. Work mode carries formatted wording

The clause editor page's wording becomes rich HTML — the same thing the clause
and the change already store — and the words are DERIVED from it wherever words
are what is wanted: the live redline, the counts, the cost line and the passage
handed to Copilot. Plain text arriving from a Copilot card or a playbook
standard is coerced on the way in, so there is one representation in the page
and not two that can drift.

**The redline still compares WORDS.** That is deliberate and is not a
simplification: what the other side verifies is the wording, the funnel already
has a formatting-only path for an edit whose words did not move, and a mark
drawn from anything else would not be the mark that was filed.

## WHAT IS DELIBERATELY NOT BUILT, said out loud

- **Type-anywhere across the whole document.** Ruled out above. If it is ever
  wanted it is its own order, and it starts with how a change is filed rather
  than with a toolbar.
- **A colour picker, and any colour reaching storage as a style.** Ruling 2.
- **The full bar on the ordinary negotiation screen.** Ruling 3. That screen
  keeps its five buttons.
- **Headings, tables and quote blocks on the bar.** The allowlist permits them
  and a paste can still bring them in; a clause is a clause, and a control that
  turns one into a heading is a way to break the numbering the whole
  negotiation is filed against. One word from the owner adds them.
- **A phone layout.** Work mode is not offered below the width where two
  columns stop making sense, which is the rule that page already has.
- **The counterparty's page.** Their seat keeps the editor it has today,
  including its five buttons. It is not in the ask and widening it is not this
  order's to do.
