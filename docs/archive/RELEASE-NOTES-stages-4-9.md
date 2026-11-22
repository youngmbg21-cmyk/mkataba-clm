# Release notes — Stages 4–9 (2026-07-31)

## Signing route (W7 + W8)
- Set the signing order once — each counterparty signer now gets **their own
  link**, released automatically in sequence as each signature lands. No more
  hand-typing one recipient after internal signing.
- Signatures always land on the signer's own row of the route. Signing out of
  order is refused with the next signer named.
- **BEHAVIOUR CHANGE:** the one-time signing code is now sent **only to the
  address the link was issued to**. Forwarding a signing link so a colleague
  can type their own address and sign no longer works — deliberately. Add
  them to the signing route instead; each signer gets their own link.

## Numbering
- **Renumber clauses** button on the gap notice (drafts only): full preview,
  references repointed to follow, one confirmation. Executed contracts have
  no path to it.
- Contracts created from templates now **number live**: delete a clause,
  close the round, and the numbering closes up automatically — references
  following. Existing contracts and uploads are untouched.

## History
- **History** button on every contract: the whole negotiation as one story —
  proposals with reasons, decisions with replies, signatures, renumberings —
  with combining filters. Labels read as they were when each event happened.
- **Verify integrity** recomputes every fingerprint and checks the seal,
  naming the first broken record if anything was altered.
- **Export history** produces a self-contained report for readers with no
  HaTi login, with the verification result and its run time embedded.

## Sharing
- A negotiation-link holder can mint a **read-only copy** for an advisor —
  strictly weaker, dead when the parent link dies, visible and revocable by
  the owner.
