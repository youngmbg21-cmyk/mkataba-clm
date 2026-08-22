#!/bin/sh
# The two libraries HaTi's scanning path loads at runtime, and the English
# language data Tesseract needs. Fetched, never committed: they are a measuring
# instrument, not a dependency — the product itself loads them from a CDN (or
# from wherever a self-hosted deployment points HATI_OCR_* at), and nothing in
# `npm test` touches them.
#
#   about 30 MB, mostly the Tesseract wasm engine.
set -e
cd "$(dirname "$0")"
npm install --no-audit --no-fund \
  pdfjs-dist@4.6.82 \
  tesseract.js@5.1.1 \
  tesseract.js-core@5.1.1 \
  @tesseract.js-data/eng
echo
echo "ready — node test/scan/measure.js"
