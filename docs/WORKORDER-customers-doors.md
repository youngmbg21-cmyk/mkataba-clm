# WORK ORDER — Customer folders: two doors that go somewhere, and the door after Home

**Status: NOT BUILT. Written 10 Oct 2026 from the owner's words, after Customer folders shipped in PR #205.**

**The owner's words (10 Oct 2026), off a screenshot of the Customers page with "Open customer" and "Open on Explorer" ringed:**

> "the build should be when you click on open customer, it takes you to the contracts page and only contracts for that customer will be listed there. When you click on explorer it will then take you to the explorer page with just those customers but grouped by active vs expired. Also, move the customer folder in the nav panel to be right after home."

Three parts. Build all three, in this order, as ONE change.

| Part | What the person sees after the change |
|---|---|
| A · Open customer | The Contracts page opens, listing only that customer's contracts |
| B · Open on Explorer | Explorer opens with only that customer's contracts, in two groups: Active and Expired |
| C · The menu | Customers sits second in the rail, right after Home |

---

## Where things stand (read before touching anything)

Read CLAUDE.md, then grep docs/MAP-HISTORY.md for these headings and read each in full:
"CUSTOMER FOLDERS — SHELVES, THE SAP WAY", "CONTRACTS AND NEGOTIATIONS ARE ONE TABLE", "INSIGHTS" (Explorer), "THE SHELL — RAIL, BAR, PANELS".

Today (after PR #205):
- `js/views/customers.js` draws two screens on the view `customers`: the list of customers, and one customer's own page (trail, figures, Active | Expired | All tabs, groups by stream).
- "Open customer" (the side panel's filled button, and a second press on a row) calls `cuOpenCustomer(key)`, which opens that customer's own page.
- "Open on Explorer" calls `cuOpenExplorer()`. It sets `intel.groupBy = 'counterparty'` and opens Home's Explorer through `hbOpenExplorer()`. It shows EVERY customer and focuses nobody.
- The rail is Home · Contracts · Negotiations · Customers · Approvals & signing · …

Names this order touches (grep, never trust a line number):
- `js/views/customers.js`: `cuOpenCustomer`, `cuOpenExplorer`, `cuCustomerHtml`, `cuPaintContractPanel`, `cuPlace` / `cuPlacePut`, `cuBucket`, `cuFilterItems`, `cuListHtml`, `cuPaintCustomerPanel`, `CU_TABS`.
- `js/views/register.js`: `regShowOnly(ids, label)` → `regGoFiltered({ only: { ids, label } })`, the "only" chip (`#reg-only-chip`, `reg_only_title`).
- `js/views/intelligence.js`: `intel`, `addLens({ label, ids, action:'filter' })`, `intel.groupBy = 'custom'` with `intel.groups` (the compare act already builds a two-group map this way), `intelGraphApply`, `igRecipeSet`. `js/views/homeboard.js`: `hbOpenExplorer`.
- `index.html`: the `data-view="customers"` rail button and its comment.
- `js/app.js`: `PLACE_PARTS.customers`.

---

## Part A — "Open customer" lands on the Contracts page, narrowed to that customer

**What happens.** Pressing "Open customer" (or pressing a customer row twice, or Enter on it) opens the **Contracts** page. The list shows only that customer's contracts, and the "only" chip above it names the customer, e.g. "Juno Limited · 21". Pressing × on the chip shows every contract again. The stage tabs (All · Drafting · In Review · …) still work inside the narrowed list.

**How (the one door).** Use the Contracts page's existing door for "show only these": `regShowOnly(ids, customerName)`. Do NOT add a customer filter to the Contracts page. That would be a second way to narrow the same list (Six Questions 5, the one door; Flow rule 2).

**Which contracts.** The ids are the customer's contracts **as the Customers page counts them**, so the number on the row the person pressed is the number of rows they land on (Six Questions 6):
- every contract whose counterparty matches the customer (`cuKeyOf`, case-blind), archived ones left out (`cuBook`);
- with the Customers page's own filters applied (Stream, Owner) through `cuFilterItems`;
- **amendments come with their agreement**: add every contract whose `parentId` is one of those agreements, so the Contracts page draws them under their agreement as it always does.

**First fix the count mismatch the owner's screenshot showed.** With Owner = Young Mbagaya on, the row's number columns follow the filter, but the "21 contracts · 4 streams" line under the name and the side panel count every contract. Make every number on the Customers page (the row's sub-line, the side panel's facts and its Streams list) read the filtered contracts, so the row, the panel and the Contracts page all say the same number.

**What goes.** The customer's own page has no door left once Open customer goes to Contracts. Retire it rather than leave it unreachable:
- delete `cuCustomerHtml`, `cuPaintContractPanel`, the `data-cu-tab` / `data-cu-grp` handlers, the trail, `CU_TABS`, and the words used only there (`cu_tab_*`, `cu_title_*`, `cu_crumb_label`, `cu_none_expired`, `cu_none_here`, `cu_no_stream`, `cu_col_agreement`). Leave each retired word **inert in both books** (CLAUDE.md: retire a key by leaving it inert in BOTH books);
- `cuPlace` / `cuPlacePut` keep only the list's own state (find, stream, owner). A stored `cust` from an old refresh is ignored and lands on the list;
- `_cu.cust`, `_cu.tab` and `_cu.closed` go.

**The way back (Six Questions 6).** From the narrowed Contracts page, the way back is the Customers door in the rail, and × on the chip widens the list. **Do not add a "Back to Customers" link or band.** That would be a new control on the page, and the owner's rule is to ask first.

**Refresh.** A refresh on the narrowed Contracts page lands on the same narrowed list. That is the register's own place rule (`regPlace` already carries `only`). Check it holds; do not build anything new for it.

---

## Part B — "Open on Explorer" shows that customer's contracts, grouped Active | Expired

**What happens.** Pressing "Open on Explorer" in the side panel opens Home's **Explorer** map showing only the selected customer's contracts (the same set as Part A, amendments included), drawn as **two groups: Active and Expired**. Each group names itself and counts its contracts. Clearing the lens on Explorer shows the whole book again, as any Explorer lens does.

**Reading the owner's words.** "With just those customers" is read as **the customer the button belongs to**: the button sits in one customer's panel. See Question 1 below.

**How.**
- Narrow through Explorer's own lens: `addLens({ label: customerName, ids, action: 'filter' })`. No new filter mechanism.
- Group through Explorer's own custom grouping: `intel.groupBy = 'custom'`, `intel.groups` = { id → "Active" | "Expired" }. Fill it from `cuBucket(c)`, the ONE reading of active vs expired (`contractExpired` or Declined = Expired; everything else = Active). The two group names come from the book (`cu_tab_active`, `cu_tab_expired`, kept live in both books).
- Go through `hbOpenExplorer()` as today. If Explorer has a single applier for a lens plus a grouping (check `intelGraphApply` / `igRecipeSet` first), use it, so Explorer's own Undo and saved views see the change. Never set the map's state behind its back in a way its Undo cannot reverse.
- A group with nothing in it is not drawn. A customer with only active contracts shows one group.

**What it is not.** It does not ask Copilot and spends nothing (Flow rule 7). Reading writes nothing.

---

## Part C — Customers sits right after Home in the rail

Move the `data-view="customers"` button in `index.html` to sit straight after Home, before Contracts. The rail becomes:

**Home · Customers · Contracts · Negotiations · Approvals & signing · …**

- Negotiations stays **directly under Contracts**, which is the owner's 12 Aug 2026 rule, pinned by `contracts-page-verify` and `negotiations-door-verify`. Moving Customers above Contracts keeps that rule.
- Update the button's comment to say the owner moved it (10 Oct 2026), and update the CLAUDE.md MAP line ("Rail door third, under Negotiations" → "second, after Home").
- The phone menu is unchanged (Customers is not on the phone yet).

---

## Questions for the owner (answer before building, or build the stated default)

1. **"Just those customers."** Default: the one customer whose panel you pressed. If you meant **every customer currently listed** (for example, all customers matching "juno"), that would be a second "Open on Explorer" at the top of the Customers page, which is a new button and needs your yes.
2. **The customer's own page goes.** With Open customer landing on Contracts, the page with Active | Expired | All tabs and stream groups is no longer reachable, so this order removes it. Default: remove it. Say if you want to keep it some other way.

---

## Checks (what "done" means)

Six Questions: Part A and Part B use existing doors (the Contracts "only" chip, an Explorer lens), so no new door and no band. Part C changes the rail order only.

Nine Flow rules: one reading of active vs expired (`cuBucket`) serves both the Customers numbers and the Explorer groups (rule 1); every way in ends in an existing door (rule 2); Brain: no new part, but the `customers` part's flow step still stands. Run f561 and f564.

Tests to write or re-point (browser files start a real Chrome):
- `test/chromium/customers-verify.js`, re-pointed:
  - 1a the rail order is Home · Customers · Contracts · Negotiations;
  - 2d with Owner = X on, the row, its sub-line and the side panel all say the same number;
  - 3 "Open customer" lands on `register` with the "only" chip naming the customer, and the row count equals the number on the Customers row (amendments drawn under their agreement); × on the chip widens it; a refresh keeps it narrowed;
  - 4 "Open on Explorer" lands on the Explorer face with a lens of exactly those ids and two groups named Active and Expired whose counts add up to the customer's number; an all-active customer shows one group;
  - the old customer-page checks (trail, tabs, folding groups) come out WITH the page.
- `contracts-page-verify` and `negotiations-door-verify`: Negotiations still directly under Contracts.
- f399, f412 (registration lists), f561, f564 (the Brain), f148 (both books).
- Run each new check against unmodified main first: it must fail there.

Run `npm run lint` first (zero errors). Do not run the full suite in the chat; push and let GitHub's check run everything.

At the end: a short plain-English summary for the owner, update CLAUDE.md's MAP section "CUSTOMER FOLDERS" (at most four lines), append the story to docs/MAP-HISTORY.md under the same heading, and list anything touched outside this order.
