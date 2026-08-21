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
