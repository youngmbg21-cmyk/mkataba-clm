# CUAD — the accuracy scorecard's contract set

Stage 1 output. The selection rules and the reasoning behind them are in
`WORKORDER-cuad-scorecard.md` at the repository root; this folder holds only the
result.

- `selection.json` — the 50 chosen contracts, machine-readable. Each row carries
  the CUAD title, the HaTi group it stands for, length, filing year, how many of
  the nine core fields the answer key marks, whether a notice period is among
  them, whether pricing is stated or redacted, and the `tier` it was admitted
  under (0 = strict rules, higher = relaxed, see the work order).
- `SELECTION-TABLE.md` — the same 50, readable.

## The corpus is not committed here

Deliberate. It is 510 third-party contracts and it is reproducible in seconds:

    git clone --depth 1 https://github.com/TheAtticusProject/cuad
    unzip cuad/data.zip

`CUADv1.json` holds all 510 with full text and the answer key. Match on the
`title` field in `selection.json`.

The 510 **PDFs** are not in that repository — they are in `CUAD_v1.zip` on
Zenodo, which this environment cannot reach. They are only needed to test the
PDF-reading and OCR chain, not the AI.

## Attribution is a condition of use

CUAD is CC BY 4.0. Free commercially, provided it is credited. **Any accuracy
figure taken from this set must name CUAD wherever it is published** — a sales
deck, a proposal, the product. That obligation attaches to the claim, not to
this folder.

> CUAD, The Atticus Project. Hendrycks et al., *CUAD: An Expert-Annotated NLP
> Dataset for Legal Contract Review*. Licensed CC BY 4.0.

These are public U.S. SEC filings, so nothing here is confidential. They are
also American — Delaware and New York law, dollars, US drafting — so no score
from this set describes how HaTi reads Kenyan or Swedish paper.

## Running it

Step-by-step directions for a non-developer are in **RUN-THE-SCORECARD.md**.
RUN-ON-RENDER.md is DELETED — Render was tested and ruled out on three counts
(the key is not there and need not be, 199 MB needed against 119 MB free, and
Render strips the git remote after deploying). The post-mortem is the last
section of RUN-THE-SCORECARD.md.


    # dry run — proves the plumbing, spends nothing, every score is zero
    node test/cuad/run.js --corpus /path/to/CUADv1.json

    # the ten-contract calibration pass SCORING.md asks for first
    ANTHROPIC_API_KEY=sk-... node test/cuad/run.js --live --n 10 --corpus ...

    # the real thing
    ANTHROPIC_API_KEY=sk-... node test/cuad/run.js --live --corpus ...

`score.js` holds the rules and is PURE — no network, no server, no AI — which
is what lets `test/f226-cuad-scoring.test.js` prove all 45 of them in
milliseconds, for nothing, in the ordinary suite. It is deliberately not
wired into `npm test` as a live run: a scorecard that spends money on every
save is one somebody will switch off.

**The product is not modified by any of this.** The three limits the run needs
(`AI_MAX_CHARS`, `AI_RATE_DEEP`, `AI_RATE_LIGHT`) are handed to a throwaway
test server as environment settings, on a temporary database, and the live
workspace never sees them.
