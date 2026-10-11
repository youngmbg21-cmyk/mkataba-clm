// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   SHARED: HTML escaping.
   Every user-controlled string interpolated into a template literal has to go
   through this. A contract name is user-controlled twice over — a colleague
   types it, and on a migrated contract it is derived from the uploaded file's
   name, so a maliciously named file in a shared drive is enough. Quotes are
   escaped as well as angle brackets because these values also land inside
   attribute values (title=, data-*).
   ============================================================ */
const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, ch=>ESC_MAP[ch]); }

/* ============================================================ ICONS */
const ICONS = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
  // the file above with a plus in it — a document being written, not filed
  filenew:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6M9 15h6"/>',
  folder:'<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  folderOpen:'<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  check2:'<path d="M20 6 9 17l-5-5"/>',
  seal:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z"/>',
  ban:'<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chevR:'<path d="m9 18 6-6-6-6"/>',
  list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  columns:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/>',
  calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  /* THE CHAT DOOR CAME INTO THIS FAMILY ON 20 SEP 2026, when Young moved it
     out of the shell bar and into the contract's own acts row beside the two
     checks. It had been drawing the 16x16 sprite `#i-chat`; in here it has to
     be a 24-box path like its neighbours, because `icon()` states that viewBox
     and a missing key renders an EMPTY SVG — a box with nothing in it, which
     is the sprite fault in this map's own costume. */
  chat:'<path d="M4 5h16v11h-9l-4.5 4v-4H4z"/>',
  msg:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  lock:'<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  shield:'<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1 1 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  finger:'<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
  key:'<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
  building:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
  truck:'<path d="M14 18V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h1"/><path d="M14 9h4l4 4v4a1 1 0 0 1-1 1h-1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  scroll:'<path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"/>',
  sparkle:'<path d="M9.94 14.06 8 20l-1.94-5.94L0 12l6.06-2.06L8 4l1.94 5.94L16 12z"/><path d="M18 4v4M22 6h-4M18 16v4M22 18h-4"/>',
  arrowLeft:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight:'<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  coins:'<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
  hash:'<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  alert:'<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r="0.6" fill="currentColor"/>',
  /* ---- ONE MARK, ONE MEANING (Young ruled it 19 Sep 2026) ----------------
     "Focus mode button and Copilot risk scan symbols look almost exactly the
     same. Change the Copilot risk scan into a different symbol across the
     platform." They looked the same because they WERE the same: this one glyph
     was doing both jobs, drawn from one place.
     `scan` — the viewfinder — KEEPS FOCUS MODE, where four corners round a
     subject is the natural sign for "give me just this".
     `readpaper` is the reading family's own mark: a page with a magnifier over
     it, which is what every one of those presses actually does. It is not only
     the risk scan button — the findings badge on a Contracts row, the playbook
     Run button, the machine-read line on a scanned upload and Copilot's own
     working pulse all move with it, because a badge that no longer matches the
     button that produced it is the fault this change exists to remove. */
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
  readpaper:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/><path d="M14 3v5h5"/><circle cx="16.5" cy="15.5" r="3.5"/><path d="m21.5 20.5-2.5-2.5"/>',
  chevD:'<path d="m6 9 6 6 6-6"/>',
  /* THE OTHER THREE MARKS A BUTTON USED TO TYPE (the Compact ladder, 26 Sep
     2026): an up chevron beside the down one, and the three dots of a menu
     that holds the rest. A typed "⋯" or "↑" prints at the reader's text size
     in the text face; these are drawn, so they sit at the rung's icon size in
     the same hairline as every other symbol on the button. */
  chevU:'<path d="m18 15-6-6-6 6"/>',
  chevL:'<path d="m15 18-6-6 6-6"/>',
  more:'<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  refresh:'<path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 15.4-6.4L21 8"/><path d="M21 3v5h-5"/>',
  target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  trend:'<path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/>',
  network:'<circle cx="12" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="M12 7.5V12m0 0-5.2 5m5.2-5 5.2 5"/>',
  share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/>',
  filter:'<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  sort:'<path d="M7 4v16M3 8l4-4 4 4M17 20V4M21 16l-4 4-4-4"/>',
  cog:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  printer:'<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3h12v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
  expand:'<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  close:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  userplus:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  box:'<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  factory:'<path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1M12 18h1M7 18h1"/>',
  wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.9 6.91a2.12 2.12 0 0 1-3-3l6.91-6.9a6 6 0 0 1 7.94-7.94l-3.76 3.76Z"/>',
  store:'<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20v3a2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0Z"/>',
  megaphone:'<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
  cart:'<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  briefcase:'<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/>',
  minus:'<path d="M5 12h14"/>',
  pencil:'<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
};
const icon = (n,cls='w-4 h-4',sw=1.6)=>`<svg xmlns="http://www.w3.org/2000/svg" class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]||''}</svg>`;
/* A LABEL THAT OPENS WITH A TYPED "+" (the Compact ladder, 26 Sep 2026 —
   rule 5 of the button review: drawn icons only, no typed plus signs). The
   dictionary keeps its words; the button draws the plus at the rung's icon
   size, in the same hairline as every other mark on it. Takes and returns
   HTML, so it is handed text that is already escaped. */
const plusLed = html => { const s = String(html == null ? '' : html);
  return /^\+\s*/.test(s) ? icon('plus','w-3.5 h-3.5') + s.replace(/^\+\s*/, '') : s; };
document.querySelectorAll('[data-ic]').forEach(el=>el.outerHTML=icon(el.getAttribute('data-ic'), el.getAttribute('data-ic-cls')||'w-4 h-4'));
document.querySelectorAll('[data-ic-big]').forEach(el=>el.innerHTML=icon(el.getAttribute('data-ic-big'),'w-[18px] h-[18px]'));

/* ---- JAMBO'S FACE (owner, 11 Oct 2026: Copilot is called Jambo; "only keep
   him in the Copilot chats for now") ----
   The honeyguide in glasses, drawn in 3D and kept here as two small pictures
   so every chat — the Jambo window, Home's panel, the phone — shows the same
   face with nothing to fetch. 'hello' beside his answers and his greeting,
   'think' while he works. Decorative: the words beside it carry the meaning,
   so alt is empty. Only the chats use it; buttons and pages keep the sparkle. */
const JAMBO_FACE = {
  hello: 'data:image/png;base64,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',
  think: 'data:image/png;base64,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',
};
const jamboFaceHtml = (mood = 'hello', size = 28, cls = '') =>
  `<img class="jambo-face${cls ? ' ' + cls : ''}" src="${JAMBO_FACE[mood] || JAMBO_FACE.hello}" width="${size}" height="${size}" style="width:${size}px;height:${size}px" alt="" draggable="false">`;
/* a still <img data-jambo-face="hello"> in the page's own markup takes its picture */
function jamboFacePaint(root){
  try{ (root || document).querySelectorAll('img[data-jambo-face]').forEach(img => {
    const want = JAMBO_FACE[img.getAttribute('data-jambo-face')] || JAMBO_FACE.hello;
    if (img.getAttribute('src') !== want) img.setAttribute('src', want); }); }catch(_){}
}
/* ---- WHEN SOMETHING IS LOADING, SOMETHING MOVES (owner, 11 Oct 2026: "when
   something is loading, there should be some type of movement on screen so
   you know it is loading, as a rule") ----
   ONE marker for every wait: the house's turning ring (.ob-spin, index.html)
   in front of the word that says what is happening. currentColor, so it takes
   the ink of whatever it sits in; it stands still for a reader who asked for
   less motion, and the word still says it. Use it wherever a word like
   "Reading…", "Sending…" or "Checking…" is shown while HaTi waits. */
const _busyEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const busyHtml = text => `<span class="ob-spin" aria-hidden="true"></span>${_busyEsc(text)}`;
/* a button or line that is now waiting: its ring and its word */
const busySet = (el, text) => { if (el) el.innerHTML = busyHtml(text); };
Object.assign(window,{ICONS,icon,plusLed,JAMBO_FACE,jamboFaceHtml,jamboFacePaint,busyHtml,busySet});
/* ============================================================
   SHARED: contract row (compact list item, used everywhere)
   ============================================================ */
function contractRow(c, {showFolder=false}={}){
  return `
  <button data-open="${c.id}" class="crow w-full text-left group flex items-center gap-3 px-4 py-3 transition">
    <span class="h-8 w-8 shrink-0 grid place-items-center rounded-lg border" style="${isUpload(c)?'background:var(--st-amber-bg);color:var(--st-amber-fg);border-color:var(--st-amber-line)':'background:var(--st-steel-bg);color:var(--color-accent);border-color:var(--st-steel-line)'}" ${isUpload(c)?'title="Uploaded — received from counterparty"':''}>${icon(cIcon(c))}</span>
    <span class="min-w-0 flex-1">
      <span class="block text-sm font-medium truncate group-hover:text-brand-500 transition" style="color:var(--color-text)">${esc(c.name)}</span>
      <span class="block text-[11px] font-mono truncate" style="color:var(--color-neutral-500)">${esc(c.counterparty||'No counterparty yet')}${showFolder?' · '+esc(FOLDERS[c.folder].name):''}</span>
    </span>
    ${(()=>{ const o=openFindings(c); if(!o.length) return '';
      const sm=SEV_META[worstSevOf(o)];
      return `<span class="hidden md:inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${sm.chip}" title="Open scan findings">${icon('readpaper','w-2.5 h-2.5')}${o.length}</span>`; })()}
    <span class="hidden sm:block text-xs font-mono whitespace-nowrap" style="color:${isMonetary(c)?'var(--color-text)':'var(--color-neutral-500)'}" ${!isMonetary(c)?'title="Non-monetary agreement"':''}>${!isMonetary(c)?'n/m':(c.value?(window.fmtMoneyShortOf?fmtMoneyShortOf(c):fmtMoneyShort(c.value)):'—')}</span>
    <span class="shrink-0">${window.contractStatusChip?contractStatusChip(c):statusChip(c.status)}</span>
    <span class="transition shrink-0" style="color:var(--color-neutral-400)">${icon('chevR')}</span>
  </button>`;
}
function wireOpens(root=document){
  root.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',()=>openWorkspace(el.getAttribute('data-open'))));
}

Object.assign(window,{esc,contractRow,wireOpens});

/* ============================================================
   A FIELD YOU CAN SEE WHAT YOU TYPED IN
   ============================================================
   Every message box in this product was an <input type="text">: one line, no
   wrapping, and content that scrolls sideways out of view as you write. Past
   about a dozen words the beginning of your own sentence is gone — on a reply
   to a counterparty, on a thread starter, on the question you are putting to
   the Copilot. You cannot re-read what you are about to send, which is exactly
   the moment re-reading matters.

   So they are textareas that grow. One line at rest, so a column of them looks
   no busier than it did; taller as you write; and past `max-height` they stop
   growing and scroll, because a composer that can push the send button off the
   bottom of the panel has traded one problem for a worse one.

   ENTER STILL SENDS. That habit is the whole reason these were inputs, and
   breaking it to gain wrapping would be a poor trade. Shift+Enter is the
   newline — the convention every chat surface uses — and it is the one thing
   here a reader has to be told, so the placeholder-adjacent hint says it where
   there is room for one.

   `chatFieldWire` is idempotent: these panels repaint constantly and a field
   wired twice would grow twice per keystroke. */
const CHAT_FIELD_CLASS = 'chat-field';
function chatFieldGrow(el){
  if (!el || !el.style) return;
  /* Measured from scratch each time: shrinking needs the height released
     first, or a field that only ever grew would never come back down after a
     delete. */
  el.style.height = 'auto';
  /* A FIELD NOBODY CAN SEE CANNOT BE MEASURED. The sidebar has two faces and
     only one is mounted at a time, so the composers on the other are inside a
     display:none subtree where scrollHeight reads 0 — and writing 0px would
     leave a zero-height box the moment that panel was shown. Left at `auto`
     instead, and re-measured when the panel appears (rlSetSideMode calls back
     in). */
  if (!el.scrollHeight) return;
  const max = parseFloat(el.dataset.chatMax || '0');
  el.style.height = Math.min(el.scrollHeight, max > 0 ? max : Infinity) + 'px';
}
function chatFieldWire(root){
  const scope = root || document;
  if (!scope.querySelectorAll) return;
  scope.querySelectorAll('textarea.' + CHAT_FIELD_CLASS).forEach(el => {
    if (el.dataset.chatWired) { chatFieldGrow(el); return; }
    el.dataset.chatWired = '1';
    if (!el.dataset.chatMax){
      const max = parseFloat(getComputedStyle(el).maxHeight);
      if (max && isFinite(max)) el.dataset.chatMax = String(max);
    }
    el.addEventListener('input', () => chatFieldGrow(el));
    /* A paste is not an input event on every browser path, and a pasted
       paragraph is the case that most needs the box to open up. */
    el.addEventListener('paste', () => setTimeout(() => chatFieldGrow(el), 0));
    chatFieldGrow(el);
  });
}
/* The keydown rule, in one place so the six composers cannot drift into
   disagreeing about what Enter does. Returns true when the caller should send.
   IME composition is excluded: mid-composition Enter commits the candidate
   word, and treating that as "send" posts a half-typed message. */
function chatFieldSubmits(ev){
  if (!ev || ev.key !== 'Enter') return false;
  if (ev.shiftKey || ev.altKey || ev.ctrlKey || ev.metaKey) return false;
  if (ev.isComposing || ev.keyCode === 229) return false;
  ev.preventDefault();
  return true;
}
/* Reset after a send: the box has to come back to one line, or the next reply
   is typed into a five-line hole where the last one was. */
function chatFieldReset(el){
  if (!el) return;
  el.value = '';
  chatFieldGrow(el);
}

Object.assign(window,{CHAT_FIELD_CLASS,chatFieldGrow,chatFieldWire,chatFieldSubmits,chatFieldReset});
