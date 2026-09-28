# vendor/ — third-party code HaTi serves itself

Files here are **not ours** and are **not edited**. They are committed as bytes,
for the same reason `fonts/` is: the platform must render and work identically
offline, behind a corporate proxy, and inside a customer network that does not
let a browser reach the open internet.

**NOTHING IN HERE IS SWEPT BY OUR OWN SOURCE CHECKS**, and that is why it is a
top level directory rather than `js/vendor/`. Six tests walk `js/` recursively
(f148, f232 among them) on the assumption that everything under it is a HaTi
module somebody here wrote; a 205KB minified bundle under that roof is a trap
for every one of them, and for the next sweep somebody adds. `js/` means our
source. This does not.

## chart.umd.min.js — Chart.js 4.4.1, MIT

- **Where it came from:** the `chart.js@4.4.1` npm package, `dist/chart.umd.js`
  — byte-identical to the file cdnjs served, which is what this replaced.
- **What was changed:** one line removed, the trailing `sourceMappingURL`
  comment, because the `.map` file is not shipped and the browser would ask for
  it and get a 404 on every chart.
- **Licence:** MIT, stated in the banner at the top of the file. Free to embed
  and serve, nothing owed on screen.
- **Who loads it:** `js/aichart.js` fetches it on first use — a `<script>` tag,
  not an import — so a session that never opens a chart never pays the 205KB.
  It sets `window.Chart`, which is what `aiChartLib()` waits for.
- **Reached at `/vendor/chart.umd.min.js`**, served by the route beside `/fonts`
  in server/server.js. Cached hard: a version bump changes the file, and a file
  here is never edited in place.

### To upgrade it

    npm pack chart.js@<version> --pack-destination /tmp
    tar xzf /tmp/chart.js-<version>.tgz -C /tmp package/dist/chart.umd.js
    sed '/^\/\/# sourceMappingURL=/d' /tmp/package/dist/chart.umd.js > vendor/chart.umd.min.js

Then run `node test/chromium/analytics-verify.js` — it draws a real chart
against the real server, so it is what proves the new bytes work.

## en-words-1.txt — the spell check's English word list (28 Sep 2026)

- **What it is:** every word form of two Hunspell dictionaries, British and
  American English together, lower-cased, one per line, sorted — 124,325 words,
  1.2 MB. Both spellings are accepted on purpose: a contract that writes
  "licence" and one that writes "license" are both spelt correctly.
- **Where it came from:** the `dictionary-en-gb@3.0.0` and `dictionary-en@4.0.0`
  npm packages (wooorm/dictionaries, built from SCOWL). Their `index.aff`
  prefix/suffix rules were applied to every `index.dic` stem; a stem flagged
  only-in-compound (`1th`, `2th`) was left out, and only words made of letters
  and apostrophes were kept.
- **What was changed:** nothing in any word. The list is the two dictionaries'
  forms, merged.
- **Licence:** (MIT AND BSD), the packages' own; free to serve, nothing owed on
  screen.
- **Who loads it:** `js/spell.js` fetches it on the first Save that has new
  words to check — never on page load, so a reader who never saves a change
  never pays for it. Reached at `/vendor/en-words-1.txt`, cached hard like
  everything here; a new list is a NEW NAME (`en-words-2.txt`), never an edit.
- **Words it lacks that contracts use** (counterparty, indemnitee, majeure…)
  are the short `SPELL_LEGAL` list in `js/spell.js`, not an edit to this file.

### To rebuild it

    npm pack dictionary-en-gb@3.0.0 dictionary-en@4.0.0
    # untar both, then for each: read index.aff's PFX/SFX blocks, apply every
    # rule whose condition matches to every index.dic stem (prefixes also to the
    # suffixed forms where the rule says cross-product), lower-case, keep
    # /^[a-z][a-z']*$/, merge the two sets, sort, write one per line.

Then run `node --test test/f422-their-side-mirrors-ours.test.js`, which reads it.
