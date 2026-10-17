# Jambo's room — a proposal (17 Oct 2026; nothing built)

> *"I now want to have the Jambo chat room that is not on side panel to essentially be an extension of the board page. It's a chat room that once you click on Jambo at the top of the page, it appears in any page but it's an extension of the board where you chat with it and it brings up the same cards that would appear on the board. If you switch pages, it follows you unless you click on a minimize button which then makes it disappear to the top Jambo emoji. … You should also be able to research a contract there or review the brief etc. … prioritise value add, speed and efficiency. Propose only and no coding"*
> — the owner, 17 Oct 2026.

> *"rebuild and combine the sap way with the desk meaning the chat is not on the side panel. Also you can expand the chat bot card and move it around just like the jambo chat bot does today"*
> — the owner, 17 Oct 2026, after the first round (The SAP way · Window · Desk).

> *"side panels should always be on the right."*
> — the owner, 17 Oct 2026, on the desk drawn with the chat on the left.

- The design, live on photographs of HaTi (drag it, resize it, expand it, fold it, change pages), with this plan beneath: https://claude.ai/artifact/7TT6diMLvVgVTAW1NgV4G4
- One design now, as the owner asked: **a card you move, resize and expand into a desk, drawn the SAP way.** It is never docked on the side.

## 1. What is there today

Two Jambos who do not know each other:

- **Home's panel.** It reads Jambo's words first (a place or a job: "sign", "share", "bring up MK-B2"), then the Board's own free reader (a number, a list, a contract, a chart, "needs me"), and only then the paid model. Its answers draw the Board's cards. Its conversation is `intel.history`.
- **The window** (`#ai-panel`, js/ai.js `aiFloat*`), on every page without Jambo built in. Its own conversation (`ai.history`), its own cards, nearly everything sent to the model. It can be dragged and resized up to the expanded drawer (the owner's 11 Oct ask), steps aside where Jambo is already on the page, and Minimize closes it with a dot on the bar's face. It opens over the bar's right end.

## 2. How the card behaves

- **Opens from Jambo's face in the bar.** First time: compact on the right, under the bar. After that: where it was left, at the size it was left (per person, as today).
- **Moves by its head; resizes from any edge or corner**, as the window does today. It stays under the bar and off the rail, so the face, the bell and the rail are always free.
- **« expands it into the desk** in one press; » takes it back to the size it had. A double-click on the head does the same.
- **Wide enough, it becomes the desk** (from 820 px): the Board's cards fill the left, under a white band the SAP way ("Cards from this conversation (n)", a labelled Show box, the cards stacked newest first), and the chat stays on the right (400 px), because side panels always sit on the right (the owner's rule). The chat never jumps: « grows the card to the left and the cards fill the new room. Each answer in the chat carries a pointer (‹ Needs you) that lights its card. Narrower, the cards sit inside the conversation, under the answer that brought them, in their narrow dress.
- **▭ puts it back** to where it first opened.
- **It follows you** across pages, same spot and size.
- **– folds it into Jambo's face**; so do Esc and a second press on the face. A dot says an answer arrived while folded. The face brings it back as it was.
- **On Home it is Jambo's panel** (same conversation); it comes back when you leave Home.
- **Nothing behind it is dimmed or moved**, even at its largest.

Its sizes at 1440 × 780:

| Size | Width × height | What it shows |
|---|---|---|
| Smallest | 360 × 420 | the chat, cards inside it, narrow dress |
| Compact, first open | 460 × 708 | the same, full height under the bar |
| Desk from | 820 wide | cards left, chat right |
| Largest | 1344 × 708 | the whole page under the bar; strip and charts as on the Board |

**Two dresses for the strip**, chosen by the width it is drawn at (one builder): narrow — head, the five figures two to a row (the fifth across), the contract's life, and Key terms · Obligations · What Jambo read folded to one row each; wide (640 px and up) — exactly as on the Board.

## 3. Needs the owner's yes

On 11 Oct the owner ruled the window can never be bigger than the expanded drawer (clamp(430px, 72vw, 940px), so about 940 wide on all three screens). The desk's largest size here is the whole page under the bar (1344 wide at 1440). If the old limit stays, the desk still works at 940 wide and the strip keeps its narrow dress.

## 4. What the card does (the room itself)

1. **One Jambo, one memory.** The card and Home's panel become one conversation.
2. **It thinks the way the Board thinks.** Jambo's words → the Board's free reader → the model, with the page sent along. Cheaper and faster than today's window; each answer says "Free" or what it cost.
3. **The cards are the Board's own** (Needs you, the contract's strip, charts, lists, answer packs), drawn by the Board's builders with a second host. Keep puts one on the Board; Open opens the paper on Home.
4. **What you can do there:** "needs me"; "bring up MK-B2" (the strip and its ⋯: Where we are, History, Details); "Read the brief" (one paid call, said before the press, kept); "Analyze"; numbers and charts; a narrowed list that opens the Contracts place; "sign", "share", "redline", "fill in" open their faces on Home; "/"; both languages.
5. **Typing never acts.** A card waits for the press.
6. **The phone keeps its own chat** below 768 px.

## 5. What does not change

The Board, Home's panel and its faces; the counterparty's page; the clause editor's own Jambo and the drawer a rewrite opens for one passage (the card steps aside there, as today); the server's checks; print, Word and PDF copies.

## 6. The build, step by step (each ships whole)

1. **One memory, one way of asking.** *Done when a question typed in the card gets the answer the panel would give, and the panel shows what the card said.*
2. **The Board's cards in the card**, two dresses, the Board's presses working there. *Done when "needs me" and "bring up MK-B2" draw the Board's cards, every door works, and Keep lands the card on the Board.*
3. **The desk.** Today's move, resize, expand and put-back stay; under the bar; the desk from 820 wide; the largest size with the owner's yes. *Done when photographed on all three screens (1440 × 780, 1536 × 730, iPad 1366 × 950) at smallest, compact and largest, nothing overlapping.*
4. **Follow and fold.** *Done when the card survives every page change, folds to the face, comes back where it was, and is the panel on Home.*
5. **Polish.** Swedish words; the brain (`BRAIN_PARTS`, lanes, stages); tests (jambo-pill-and-window's window checks become the card's; a new check for one memory, the cards, the desk, fold and follow; the door census presses the card's doors).

## 7. The checks that changed something

- **The standard answer**: one assistant that follows you and folds to an icon in the bar — followed. It floats instead of docking, by the owner's ask, so the page never shrinks and the cards get room on demand.
- **The cheapest channel**: no new band; answers are cards that wait, their cost said.
- **The contract's pixels**: zero on Home; elsewhere nothing moves under it.
- **Copilot's place**: free readers first; cost before a press; a cut-short answer says so.
- **The one door**: the face in the bar off Home, Home's panel on Home, one conversation. Today's window is a second door onto a second Jambo; this closes it.
- **Where you end up**: fold lands on the face; a card's door lands on Home; "‹ Back" stays.
- **Flow rules**: one conversation stored once; one way of asking; Copilot prepares, a person decides; the card sends through the panel's card and route; the brain updated in the same change.

## 8. Decided without asking — say if wrong

- The card stays under the bar and off the rail (today's window can cover the bar's right end).
- Nothing behind it is dimmed, even at its largest.
- It becomes the desk at 820 px wide.
- One fold button; today's separate × goes.
- ⋯ holds Delete conversation and the Plain or Legal switch; the Board's chips replace today's four stock questions.
- Size and spot remembered per person, as today.
- On the iPad its corner handle is larger.

## 9. The first round (kept for the record)

The first proposal offered three sittings: The SAP way (a docked column the page made room for; recommended), Window (today's window grown up) and Desk (a large sheet, chat left, cards right, page dimmed). The owner combined them: the Desk's two halves and the SAP way's look and follow-and-fold, in a card that moves and expands like today's window, never docked.
