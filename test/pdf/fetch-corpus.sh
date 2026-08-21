#!/bin/sh
# The corpus and the reference reader. NEITHER IS COMMITTED — the PDFs are
# somebody else's files and pdf.js is a measuring instrument, not a dependency
# of this product (see README.md).
set -e
cd "$(dirname "$0")"

if [ ! -d corpus ]; then
  echo "fetching the corpus (py-pdf/sample-files) ..."
  git clone --depth 1 https://github.com/py-pdf/sample-files.git corpus
else
  echo "corpus already here — delete test/pdf/corpus to re-fetch"
fi

if [ ! -d node_modules/pdfjs-dist ]; then
  echo "fetching pdf.js ..."
  npm install --no-save --prefix . pdfjs-dist
else
  echo "pdf.js already here"
fi

echo
echo "$(find corpus -name '*.pdf' | wc -l) PDFs ready. Now:"
echo "  node read-with-pdfjs.mjs && node read-with-hati.js && node compare.js"
