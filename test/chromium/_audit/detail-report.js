/* THE DETAIL REPORT — one HTML page out of the two audits' readings
   (detail.json from detail-audit.js, style.json from style-audit.js), for the
   owner: every finding said in plain words, grouped so one fault seen on
   three screens and four pages is ONE line, with its outlined picture.

   Run: node test/chromium/_audit/detail-report.js
   Writes detail-audit/report.html beside the pictures it points at. */
const fs = require('node:fs');
const path = require('node:path');

const DIR = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, '..', 'shots'), 'detail-audit');
const read = f => { try { return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (_) { return null; } };
const rows = read('detail.json') || [];
const style = read('style.json') || { blocks: 0, found: [] };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const SCREEN_NAME = { 'laptop-a': 'Laptop 1440', 'laptop-b': 'Laptop 1536', ipad: 'iPad' };
const KIND = {
  overlap: { name: 'Cards overlapping', say: 'A card lies on top of another card, or pokes out past the side of the card that holds it.' },
  scroll: { name: 'Scroll bars too thick', say: 'A scroll bar drawn at the browser\'s full width (with arrows) instead of the theme\'s thin bar.' },
  pill: { name: 'Pills off the theme', say: 'A rounded button, tab or chip that is taller or rounder than the theme\'s pills, or than the ones beside it.' },
  level: { name: 'Cards not level', say: 'Cards side by side whose tops (or bottoms, in a grid) do not line up.' },
  edge: { name: 'Words too close to the edge', say: 'Words sitting closer than 8px to the side of their card, or 3px to its top or bottom.' },
  trunc: { name: 'Button words cut short', say: 'A button, tab or chip whose own words are cut off with "…" because it is too narrow for them.' },
  door: { name: 'Hidden doors', say: 'Something you can press to open, with nothing on it (no "Open ›", no arrow) saying so. These are possible cases: worth a look, not all are faults.' },
};
const ORDER = ['overlap', 'scroll', 'pill', 'trunc', 'level', 'edge', 'door'];

/* ONE LINE PER FAULT: the same thing, same words, on many screens and pages */
const groups = {};
for (const r of rows) for (const f of r.found || []) {
  const key = f.kind + '|' + f.who + '|' + (f.text || '').slice(0, 30);
  const g = groups[key] || (groups[key] = { kind: f.kind, who: f.who, in: f.in, text: f.text, why: f.why, places: new Set(), screens: new Set(), shots: [] });
  g.places.add(r.name); g.screens.add(SCREEN_NAME[r.screen] || r.screen);
  if (f.shot && g.shots.length < 3) g.shots.push({ shot: f.shot, n: f.n, screen: SCREEN_NAME[r.screen] || r.screen, place: r.name });
}
const byKind = {}; for (const g of Object.values(groups)) (byKind[g.kind] = byKind[g.kind] || []).push(g);
for (const k of Object.keys(byKind)) byKind[k].sort((a, b) => b.places.size * 3 + b.screens.size - (a.places.size * 3 + a.screens.size));
const cut = rows.reduce((n, r) => n + Object.entries(r.counts || {}).reduce((m, [k, v]) => m + Math.max(0, v - (r.found || []).filter(f => f.kind === k).length), 0), 0);

const STYLE = {
  'hati/scrollbar-thick': { name: 'Scroll bars set thicker than 8px', say: 'Style rules that make a scroll bar 9px or more.' },
  'hati/control-height-off-scale': { name: 'Buttons, tabs and chips at odd heights', say: 'Controls set to a height none of the theme\'s sizes use (22 · 28 · 30 · 32 · 44).' },
  'hati/radius-off-scale': { name: 'Corners at odd roundness', say: 'Corners rounded by an amount the theme does not use (8 · 10 · 12 · 18, or fully round).' },
  'hati/font-off-scale': { name: 'Text at odd sizes', say: 'Text sizes off the theme\'s scale (10 · 11 · 12 · 13 · 14 · 16 · 20 · 26), such as 12.5px or 15px.' },
  'declaration-no-important': { name: 'Forced rules (!important)', say: 'Rules that force their way past others. Your project rules say these fights are settled another way; each is a place a later fix can silently lose.' },
  'declaration-block-no-duplicate-properties': { name: 'A rule said twice', say: 'The same setting written twice in one place; only the last counts, so the first is dead.' },
  'declaration-block-no-shorthand-property-overrides': { name: 'A setting wiped by the next line', say: 'A line that undoes the one before it, so the first does nothing.' },
};
const styleBy = {}; for (const f of style.found) (styleBy[f.rule] = styleBy[f.rule] || []).push(f);
const styleOrder = Object.keys(STYLE).filter(k => styleBy[k]).concat(Object.keys(styleBy).filter(k => !STYLE[k]));

const placesSeen = new Set(rows.map(r => r.name)).size;
const notLanded = rows.filter(r => !r.there).map(r => (SCREEN_NAME[r.screen] || r.screen) + ' · ' + r.name);
const total = Object.values(groups).length;
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* FOUND IN THE HUNT (owner, 24 Oct 2026): seen by eye on the pages, reported,
   not fixed. Kept here so every rerun of the report still carries them; a
   line leaves this list the day its fault is fixed. */
const HUNT = [
  { t: 'Jambo\'s greeting touches the panel edges', d: '“Hi! I’m Jambo…” has no margin on My notes, Import, Obligations, Requests and the Calendar. On Contracts and the Board it is spaced correctly.' },
  { t: 'Cards not level', d: 'On most pages, the main card and Jambo’s panel start 2 to 8 pixels apart in height. On Contracts, Approvals and Customers, the list also ends a few pixels above the panel’s bottom.' },
  { t: 'Calendar: a label runs over the day beside it', d: '“30 Nov – 4 Dec” runs over “Mon 30” next to it. Its page header is also a flat strip, not a card like every other page.' },
  { t: 'Jambo’s tabs squashed to one letter', d: 'On Our paper (“J…”) and New agreement (“Jam…”, “Boa…”). On New agreement, Jambo’s panel is also empty.' },
  { t: 'Key terms in the middle: square sheet narrower than its header', d: 'The same kind of fault as the Deal page.' },
  { t: 'Send screen: a line against its neighbours', d: '“Email is not set up yet…” sits against the red box above it and the panel’s edge. Its header is also a flat strip.' },
  { t: 'Thick dark rings on buttons you land on', d: '“‹ Paper”, “‹ Back to the paper”, “All 34”. Your rule says landing should not draw a ring.' },
  { t: 'Three browser checks still expect a white top bar', d: 'The Home page check, the “blue landing” check and the “brand survives a refresh” check each expect the bar to be white but measure dark green. You picked the deep green bar today (“The SAP way”), so the bar is right and these three checks are out of date: they need updating to expect green. (From GitHub’s test logs, not yet seen in a browser.)' },
  { t: 'The “⌘K” hint on the top bar is too faint', d: 'The small “⌘K” at the right end of the search box measures a contrast of 3.97 on the green bar; the accessibility rule HaTi follows asks for at least 4.5, so it is hard to read in bright light. It needs to be a little brighter. Both this and the line above started with the change to the green bar. (From GitHub’s test logs.)' },
  { t: 'My notes: “No notes yet.” touches the top of its card', small: true },
  { t: 'Import: the header card is wider than the search strip under it', small: true },
  { t: 'iPad, a redline card: Accept · Reject · Counter do not line up with the words above them', small: true },
];

const card = g => `
  <li class="f">
    <div class="f-main">
      <p class="f-why">${esc(g.why)}</p>
      <p class="f-text">${g.text ? '“' + esc(g.text) + '”' : ''}</p>
      <p class="f-where">${esc([...g.places].join(' · '))}<span class="f-scr">${esc([...g.screens].join(' · '))}</span></p>
      <details class="f-tech"><summary>For Claude</summary><code>${esc(g.who)}</code><br><code>${esc(g.in)}</code></details>
    </div>
    <div class="f-shots">${g.shots.map(s => `<a href="shots/${esc(s.shot)}" target="_blank" rel="noopener" title="${esc(s.place + ' · ' + s.screen + ' · mark ' + s.n)}"><img loading="lazy" src="shots/${esc(s.shot)}" alt="${esc(s.place)} on ${esc(s.screen)}, mark ${s.n}"><span>${esc(s.screen)} · mark ${s.n}</span></a>`).join('')}</div>
  </li>`;

const html = `<title>HaTi Detail Report</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&family=Inter:wght@400;500;600&display=swap">
<style>
/* HaTi's own look (index.html :root, "THE LEGORA LOOK"): grey ground, white cards that float, deep-green bar, ink fill. */
:root{
  --ground:#F5F5F7; --card:#FFFFFF; --ink:#1D1D1F; --sub:#4B4B50; --rule:#E3E3E8; --accent:#087363; --bar:#0F3D33; --bar-ink:#FFFFFF;
  --k-overlap:#C92A2A; --k-scroll:#6741D9; --k-pill:#C2255C; --k-level:#1971C2; --k-edge:#D9480F; --k-door:#2B8A3E; --k-trunc:#5F3DC4;
  --serif:"Source Serif 4", Georgia, serif; --sans:Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --ground:#141416; --card:#1E1E21; --ink:#F2F2F4; --sub:#B4B4BA; --rule:#34343A; --accent:#4FC3AE; --bar:#0B2A24; color-scheme:dark } }
:root[data-theme="dark"]{ --ground:#141416; --card:#1E1E21; --ink:#F2F2F4; --sub:#B4B4BA; --rule:#34343A; --accent:#4FC3AE; --bar:#0B2A24; color-scheme:dark }
body{ background:var(--ground); color:var(--ink); font:14px/1.55 var(--sans); }
.bar{ background:var(--bar); color:var(--bar-ink); padding-block:14px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); }
.bar-in, .wrap{ max-width:1080px; margin:0 auto; }
.bar b{ font:600 18px var(--serif); letter-spacing:.01em; }
.bar span{ opacity:.8; margin-left:12px; font-size:13px; }
.wrap{ padding-block:28px 64px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:grid; gap:20px; }
h1{ font:600 30px/1.2 var(--serif); margin:0; text-wrap:balance; }
h2{ font:600 21px/1.3 var(--serif); margin:0; display:flex; align-items:center; gap:10px; }
.lede{ color:var(--sub); max-width:68ch; margin:8px 0 0; }
.cardx{ background:var(--card); border-radius:18px; padding:22px 24px; box-shadow:0 1px 2px rgba(0,0,0,.05); min-width:0; }
.sum{ display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-top:16px; }
.sum a{ display:block; background:var(--ground); border-radius:12px; padding:12px 14px; color:inherit; text-decoration:none; }
.sum a:hover, .sum a:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
.sum b{ display:block; font:600 26px/1.1 var(--serif); font-variant-numeric:tabular-nums; }
.sum i{ font-style:normal; color:var(--sub); font-size:13px; }
.dot{ width:10px; height:10px; border-radius:50%; display:inline-block; flex:none; }
.sec-say{ color:var(--sub); margin:6px 0 14px; max-width:72ch; }
ol{ list-style:none; margin:0; padding:0; display:grid; gap:10px; }
.f{ display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:16px; padding:14px 0; border-top:1px solid var(--rule); }
.f-main{ min-width:0; }
.f p{ margin:0; }
.f-why{ font-weight:600; }
.f-text{ color:var(--sub); overflow-wrap:anywhere; }
.f-where{ font-size:13px; margin-top:4px !important; }
.f-scr{ color:var(--sub); margin-left:10px; }
.f-tech{ margin-top:6px; font-size:12px; color:var(--sub); }
.f-tech summary{ cursor:pointer; }
.f-tech code{ font:12px ui-monospace, Menlo, monospace; overflow-wrap:anywhere; }
.f-shots{ display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.f-shots a{ display:grid; gap:4px; width:150px; color:var(--sub); text-decoration:none; font-size:12px; }
.f-shots img{ width:150px; aspect-ratio:1440/780; object-fit:cover; object-position:top left; border-radius:8px; border:1px solid var(--rule); }
.f-shots a:hover img, .f-shots a:focus-visible img{ outline:2px solid var(--accent); }
.st{ display:grid; gap:10px; }
.st-row{ display:grid; grid-template-columns:minmax(0,1fr) auto; gap:12px; padding:12px 0; border-top:1px solid var(--rule); }
.st-row b{ font-variant-numeric:tabular-nums; font:600 20px var(--serif); }
.st-row p{ margin:2px 0 0; color:var(--sub); }
.st-row details{ grid-column:1 / -1; font-size:12px; color:var(--sub); }
.st-row details code{ display:block; font:12px ui-monospace, Menlo, monospace; overflow-wrap:anywhere; padding:2px 0; }
.next{ border-left:0; }
.hunt-small{ font:600 15px var(--sans); margin:18px 0 4px; color:var(--sub); }
.next ol{ list-style:decimal; padding-left:20px; gap:6px; }
.muted{ color:var(--sub); font-size:13px; }
@media (max-width:640px){ .f{ grid-template-columns:1fr; } .f-shots{ justify-content:flex-start; } }
@media (prefers-reduced-motion:reduce){ *{ transition:none !important; } }
</style>
<header class="bar"><div class="bar-in"><b>HaTi</b><span>Detail report · ${esc(today)}</span></div></header>
<main class="wrap">
  <section class="cardx">
    <h1>${total + HUNT.length} things that need attention to detail</h1>
    <p class="lede">I opened ${placesSeen} pages of HaTi in a real browser at your three screens (two laptops and the iPad) and measured what is painted, then read the style code with Stylelint against HaTi's own sizes. One fault seen on several pages or screens is listed once. Each picture has the fault outlined and numbered. Nothing has been fixed yet: pick what you want fixed.</p>
    <div class="sum">
      ${ORDER.map(k => `<a href="#${k}"><b>${(byKind[k] || []).length}</b><i><span class="dot" style="background:var(--k-${k})"></span> ${esc(KIND[k].name)}</i></a>`).join('')}
      <a href="#hunt"><b>${HUNT.length}</b><i>Found in the hunt</i></a>
      <a href="#style"><b>${style.found.length}</b><i>Style code departures</i></a>
    </div>
    ${cut ? `<p class="muted">Each picture outlines at most 30 of a kind; ${cut} more were counted but not outlined.</p>` : ''}
    ${notLanded.length ? `<p class="muted">Pages that did not open fully, so were measured as they landed: ${esc(notLanded.join(' · '))}.</p>` : ''}
  </section>
  ${ORDER.filter(k => (byKind[k] || []).length).map(k => `
  <section class="cardx" id="${k}">
    <h2><span class="dot" style="background:var(--k-${k})"></span>${esc(KIND[k].name)} · ${byKind[k].length}</h2>
    <p class="sec-say">${esc(KIND[k].say)}</p>
    <ol>${byKind[k].map(card).join('')}</ol>
  </section>`).join('')}
  <section class="cardx" id="hunt">
    <h2>Found in the hunt · ${HUNT.length}</h2>
    <p class="sec-say">Seen by eye on the pages, reported, not fixed. Several are kinds the measuring above does not yet catch (a greeting against its panel, a label over a label, a ring after landing), so they are listed by hand.</p>
    <ol>${HUNT.filter(h => !h.small).map(h => `<li class="f"><div class="f-main"><p class="f-why">${esc(h.t)}</p><p class="f-text">${esc(h.d)}</p></div></li>`).join('')}</ol>
    <h3 class="hunt-small">Small ones</h3>
    <ol>${HUNT.filter(h => h.small).map(h => `<li class="f"><div class="f-main"><p class="f-why">${esc(h.t)}</p></div></li>`).join('')}</ol>
  </section>
  <section class="cardx" id="style">
    <h2>In the style code · ${style.found.length}</h2>
    <p class="sec-say">Stylelint read ${style.blocks} style blocks (the generated Tailwind block is left alone). These are causes rather than things you see: fixing one can tidy several screens at once.</p>
    <div class="st">${styleOrder.map(k => { const list = styleBy[k]; const s = STYLE[k] || { name: k, say: '' };
      return `<div class="st-row"><div><strong>${esc(s.name)}</strong><p>${esc(s.say)}</p></div><b>${list.length}</b>
        <details><summary>For Claude: where</summary>${list.slice(0, 60).map(f => `<code>${esc(f.file)}:${f.line} · ${esc(f.text)} · ${esc(f.code)}</code>`).join('')}${list.length > 60 ? `<code>… and ${list.length - 60} more in style.json</code>` : ''}</details></div>`; }).join('')}</div>
  </section>
  <section class="cardx next">
    <h2>What happens next</h2>
    <ol>
      <li>Send me your four screenshots again. I fix those first, everywhere each appears.</li>
      <li>Tell me which kinds above you want fixed (for example "overlaps and scroll bars"). I fix only those, then photograph every changed page at your three screens.</li>
      <li>To run this report again later, ask me to "run the detail report".</li>
    </ol>
  </section>
</main>`;

fs.writeFileSync(path.join(DIR, 'report.html'), html);
console.log(`report.html — ${total} grouped findings, ${style.found.length} style findings — in ${DIR}`);
