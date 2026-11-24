/* f1215 — NO "EDITING <CLAUSE>" TAG ON THE WRITING BAR (owner, 24 Nov 2026, with a picture of the black pill: "delete the
   highlighted item"). ceTabPaint no longer draws .ce-ttag (and takes away one left from before); its styles are gone. The
   clause stays named by the panel's heading and the page's bar. Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
test('f1215 the writing bar carries no tag', () => {
  const CE = R('js/views/clauseeditor.js').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(CE, /tag\.className = 'ce-ttag'/);
  assert.doesNotMatch(CE, /_cet\('ce_tab_editing'/);
  assert.match(CE, /oldTag = row && row\.querySelector\('\.ce-ttag'\); if \(oldTag\) oldTag\.remove\(\);/);
  assert.doesNotMatch(R('index.html'), /\.ce-ttag\{/);
});
