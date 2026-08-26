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
