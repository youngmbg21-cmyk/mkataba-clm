'use strict';
/* THE ONE SET, WRITTEN OUT (round 0 of the Legora way, owner, 31 Oct 2026: "the artifact when being built
   has to strictly follow the design token"). Reads every top-level :root{} block of index.html's own
   <style> sheets, in source order (a later block wins, as it does in the browser), and writes
   docs/design/tokens.json: the file the design review room's Design tokens page and any build read.
   f965 fails when :root and the file disagree, so a token is changed in one place and re-exported:
       node test/tokens-export.js            write the file
       node test/tokens-export.js --check    exit 1 when the file is stale */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');

function readTokens(html){
  const out = {};
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/g; let sm;
  while ((sm = styleRe.exec(html))){
    const css = sm[1].replace(/\/\*[\s\S]*?\*\//g, m => ' '.repeat(m.length));
    let depth = 0;
    for (let i = 0; i < css.length; i++){
      const ch = css[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (depth === 0 && css.startsWith(':root', i) && /^:root\s*\{/.test(css.slice(i, i + 12))){
        const open = css.indexOf('{', i); let d = 0, j = open;
        for (; j < css.length; j++){ if (css[j] === '{') d++; else if (css[j] === '}'){ d--; if (!d) break; } }
        const body = css.slice(open + 1, j);
        for (const decl of body.split(';')){
          const m = /^\s*(--[a-z0-9-]+)\s*:\s*([\s\S]+?)\s*$/i.exec(decl);
          if (m) out[m[1]] = m[2].replace(/\s+/g, ' ');
        }
        i = j;
      }
    }
  }
  return out;
}
function exportTokens(){
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const t = readTokens(html);
  return { source: 'index.html :root (top-level blocks, later wins)', note: 'Written by node test/tokens-export.js. Do not edit by hand: change :root, then re-export.', count: Object.keys(t).length, tokens: t };
}
const FILE = path.join(ROOT, 'docs', 'design', 'tokens.json');
module.exports = { readTokens, exportTokens, FILE };
if (require.main === module){
  const want = JSON.stringify(exportTokens(), null, 2) + '\n';
  if (process.argv.includes('--check')){
    const have = fs.existsSync(FILE) ? fs.readFileSync(FILE, 'utf8') : '';
    if (have !== want){ console.error('docs/design/tokens.json is stale: run node test/tokens-export.js'); process.exit(1); }
    console.log('tokens.json matches :root');
  } else { fs.writeFileSync(FILE, want); console.log('wrote', path.relative(ROOT, FILE), JSON.parse(want).count, 'tokens'); }
}
