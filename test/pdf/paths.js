/* Where the corpus and the two readings live. Everything under test/pdf is
   fetched or generated and none of it is committed — see README.md. */
const path = require('node:path');
const HERE = __dirname;
module.exports = {
  HERE,
  CORPUS: process.env.PDF_CORPUS || path.join(HERE, 'corpus'),
  REF: path.join(HERE, 'pdfjs.json'),
  GOT: path.join(HERE, 'hati.json'),
  PDFJS: process.env.PDFJS_DIR
    || path.join(HERE, 'node_modules', 'pdfjs-dist', 'legacy', 'build'),
};
