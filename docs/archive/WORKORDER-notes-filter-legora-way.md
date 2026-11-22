# Work order: the notes beside the paper, The Legora Way (owner, 13 Nov 2026)

Picked by the owner from three drawn options ("The Legora Way", "The SAP Way",
"One Menu") on MK-382, then changed once in chat: *"Couldn't show and hide
notes be one button"*. The drawing, with the one button:
https://claude.ai/artifact/Lrovo2FJtcCTdDwDf3pgR7 (option "The Legora Way";
views "Redline", "Clean, notes shown", "Clean, notes hidden").

THE PICKED DESIGN IS THE AGREEMENT: every visible part below is built as drawn.
A part that cannot be built as drawn stops the round and is asked first.

---

## 1. More professional words on the Redline view

The chips above the notes and the lines inside each note are reworded. Both
books (English and Swedish) in the same change. The keys stay; only their
words change.

| Key | Today | New (English) |
|---|---|---|
| `pd2_rn_chip_all` | All | All notes |
| `pd2_rn_chip_open` | Still open | Outstanding |
| `pd2_rn_chip_done` | Answered | Resolved |
| `pd2_rn_answered` | Answered by your redline | Resolved by your redline |
| `pd2_rn_unsent` | not sent yet | not yet sent |
| `pd2_rn_sent` | sent, waiting on them | sent, awaiting their response |
| `pd2_rn_none` | no redline yet | not yet addressed |
| `pd2_rn_agreed` | agreed; Jambo checks it again | agreed; pending re-check |

- Swedish: write the same meaning in the same register (for example
  "Alla anteckningar · Utestående · Lösta"; "Löst genom din ändring";
  "inte skickad än"; "ej åtgärdad än").
- The Handbook chapter "Risks to look at" (`HANDBOOK_CHAPTERS` k '3.8') quotes
  these through `{ui:…}`, so its text follows by itself; re-read it once so the
  sentences around the labels still read well.
- Nothing else on the Redline view changes: the chips stay where they are (under
  the zoom, `pd2RedFloor`), shown only when both kinds stand.

## 2. One "Hide notes / Show notes" button on the Clean view

- On the Clean view of a negotiated paper, the notes beside the paper (the
  Dossier's own notes, `pd2Notes` → `pd2Groups`) get ONE button above them,
  where the Redline view's chips stand: under the paper's zoom control, at the
  notes' left edge (reuse `pd2RedFloor`'s measuring of the zoom).
- With notes showing, it says **Hide notes**. Pressed, the notes go
  (`pd2NotesOff` path), the paper returns to its normal width and place, and the
  button stays at the top right under the zoom, now saying **Show notes**.
  Pressed again, the notes come back (press it again and it closes).
- Same look as the Redline chips: a grey pill (`.pd2-rn-chip` style), not black;
  it is a switch, not the area's main act.
- Hiding only hides. Nothing is deleted; the Redlines panel still lists every
  risk; the Dossier tab's own list is untouched.
- **Remembered on this computer** (the drawing promised it): one key, e.g.
  `hati.v1.pd2NotesHidden`, read and written through try/catch. A contract
  opened next shows notes the way they were last left.
- The Redline view keeps its notes; there is no Hide on Redline (the owner
  picked the option without it).

## 3. Questions to ask the owner before building (not in the drawing)

1. **Plain papers.** A contract with no negotiation has no Clean · Redline ·
   Their view switch, but its Dossier tab shows the same notes beside the
   paper. Should the same Hide notes button stand there too? (Recommend: yes,
   one rule wherever the Dossier's notes stand, but it was not drawn.)
2. **The read.** "Watch the read" (`pd2WalkArrive`) shows each note as Jambo
   reaches its clause. If notes are hidden, should the read still show them
   while it plays? (Recommend: yes while it plays, then back to hidden.)

## 4. Rules that apply

- Six questions: no new band (a switch on the notes themselves); the paper does
  not move down; hiding notes gives the paper MORE room.
- One door: Hide notes is the only way in; no second toggle anywhere else.
- Handbook (rule 9d): the Clean view's button gets a line in the chapter that
  describes the notes beside the paper ('0.4' and '3.8'), both books;
  `HANDBOOK_CHECKED` moves to the build day.
- i18n: the new button's two words in both books (`pd2_notes_hide`,
  `pd2_notes_show` or similar).
- Tokens only in styles (f965).

## 5. Tests and pictures

- A new f-number test (take the next free number on main at the time): the
  reworded keys in both books; the button drawn on Clean only, with the right
  word in each state; pressing it hides and shows; the choice survives a
  repaint; nothing drawn on Redline. Must fail on unmodified main.
- `redline-notes-answered-verify`: step 2's chip words; a new step for Clean:
  Hide notes hides them and widens the paper, Show notes brings them back.
- Photos at 1440×780, 1536×730 and 1366×950: Redline, Clean with notes, Clean
  without notes.
- Before merging: the side-by-side, drawn against built, every part ticked.
