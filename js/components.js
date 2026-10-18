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
  /* a code name's tag (round 13: a deal kept to its list, on the wall) */
  tag:'<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  /* the archive shelf (round 13: the Contracts place's own Archive button) */
  archive:'<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
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
   The honeyguide in glasses, drawn in 3D as a real bird — fluffed feathers,
   real eyes, his round shape kept (owner, 14 Oct 2026; drawn on the "Jambo
   Made Real" page, the garden light) — and kept here as two small pictures
   so every chat — the Jambo window, Home's panel, the phone — shows the same
   face with nothing to fetch. 'hello' beside his answers and his greeting,
   'think' while he works. Decorative: the words beside it carry the meaning,
   so alt is empty. Only the chats use it; buttons and pages keep the sparkle. */
const JAMBO_FACE = {
  hello: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAMAAAD04JH5AAADAFBMVEWimHGZnY+SaliUkHSkoI/o5et7g197gmKJe2SZlGKupJXs7LDd06rw56V/fz9+ci58cTR2fVl9fWNyd2hmmWZ7g19//3+Ie2ShkXqq/6q9wsD/AP/BrXDKu2zLuFXMmZnCsZrCs5ngva3UwFrOwq7//8EAAACTh2y0p43Z1smmlXnm49pyZ1AGBgOHd1rKx7bt6eM4NCqrm4Pi3dMoJRkYFw9ORTaKe2TDs5guKyNEOy+Tk3m5t6ZmWkl0dlfHu6ZZVUmYmYe3spsgHhR8gmR/f3/QzcJQTET///9aVDt4eGeqqan38++hjnFyamOtrKPp2oudoZFVVVRjVj02Mh3//39eZEKQi4SvpZPl1Hr//wAWFw6qqlWuqJf/qqo8PDm/v3/DrZDw5aV/fwB7gV2VmXS1qJKwqJbv4pkbGguFakqRh264qpTlxrghIhYmJBNzek9udVC4qpPFuab/AAAaGhIWFgtgTDvCs5nBspjLvLDRx7X/f3/nzcIbGxAZGAoeIBgiHg8iIhAnJRRVVQBua2NydlFzdlJ6eXOBbWKLe2aZiC2+u7nBs5rDtJrEuqfTxJQODgYA/wAjIhAuLCQ1NCtKSkVWWzdRVjNSVzVUWzhVXDlZYD1VqlVjaERwc1FwdlGLfCqZinKMknW/f3+klXukmIe2qY+1tZW1sKK+s6DPvGfItZrEt6LDtqPIu6bax2zMzJkLCwQNDQQYFwkeHiElJRUnJBIkJCQuLSQ5OQ80OTJMTU5UWjdSU1dQUk9TU1BdZU1iT0JoaGh8hmOSgk+NjXGainOOk5OSmJWgfGGtlXakmY6jmIO6qGm/sJS1tKm9sqHFnojFuaTKyrjHx8/U0b8ICAQXLhcfJCIfICA/AAAkHxIhHw4sLCE1NTUzMCk3Ni09QCc/fz9COC9APS1ERDpBQTlVTk5FSVFLTk9WXDteWFhYUEtdWVNYYjpdZDxeZT5ZYT5bYGdeYWF/AABgVUBiWEVgZkFlbkd2alRpZmBybmhzbmNva2Bua2DiPhX/AAABAHRSTlOvXRcknxJao6voHAhn/wSV/2ykwAXQAmViA/8BGXX9BUyp//+YeAD+/v/+//7+/v7//v7//v7+/v7+/v7+/v79/v7+/v0C//4D/f4E///+/v7+BP/+Avz+0P8BzQOzAwkE//8C/QtPjf+S/9Fs/5PRE8ouTQERrP9ojRIwAv8sc/1JL7IDLS+uJv/W/Qop1DL/tgFosHWxCzNKjdP9A7dKjtJEjwSLThoKrtv/Fo+x1v8FT5VR/xFPB3kOS4t9V2jQMf8YVP4NcRIy/w2p0//UKXT/axML/9MLWv8EOMEuMK7P6gQb0xqoKn3WqCucqxomToNvuAKP0lp2l016j7vPt4wLBwAAFdlJREFUeNrtWwWY49a1nlD7So+ZUVeSr6yRLEu2ZdmyZ8Y0lFmG7CYLyWazgQ1jw8xpGJqkaZM2aajM9MrMfczMzPifc69kz+zOZnab9H3v+/auPdZ6NDr/of+ccy2PGf/Ha+wwgMMADgM4DOAwgMMADgM4DOD/L4BNa9f2ejdv7U1PT/V6m77DAHrTW09Y/M701q3Ta3vfAQCbemshiUFcfNtFF7/67ItvO/uii475poZxwtqXFsA50+r1oovP/sXnmlguP5966rlnn/n62Re/hX439dIB6MHsb7votrOfeZbEVsxmpeKapllpZuupZ796FkGYekkATG2F+LOfa5I8iDXbFQAw1Wq31Qt+9eRtHCO9FxvA2uMM4+mv39qESC2Vj3w+9M3RteXUmwnvOS8mgCn4/pYLK6Qxnu0Rqb7p0yODoA+2nIo/mD7nRQMA45+1q0LamwyCjWD7NkvUEGzGoRd+sYsg9F4UALjSWRcuMrxWFgBsEz9tko4Hnko8PdpbTppeSUq8IIDeJYZxasVtm/sun/S2swWhMb2hVgt4NsAR098uAKhwy4Zms9LmWG9rF/gVFQS+LWxTCFvggNS2ySKAEStL1DecZUxPrTr++ONXHSqAaeNVP2ey94GgkpmBvU8vrLhtC1r8H9uPRYw34jwUsiutOiQAW40337oo6tVVoajS3xbRIGLRsAIB8PmITOILde5XP/PhP/vgP3wW4dg7eABvM35WRZxfqSxKd5/zb5B61TJWNZyzZwXpr2xBK7Zj/Gz5/pz3Ljrlz4/o7T8ixw7o/5MqmuyGr7kTorRadrJVlVAalvG1fJsjQcSRl53z6/+4fwTLA9h0gnFBzrU42KZykLPNNMVciEuXwzRNQ5bRFcIn2+vl05EfeY4TzO352AdOxxkf3S+CseVLvnGBC7nD/GcX6FgXczXHCSOdjVGI63tac36BC+gV+nfxV0/2jOs3O849B+MCRMwFldwAygU+kz+FlpCeMyG0Q+gtASuEJNP2IyEiEbMt0qqTmi1Kx6/0ekDwkf3kwjIALnnTm7dUKP008zENI/aFor7Ec6rwBkRFTMOweNVxUjsi6cWIFg5k17l8LpFyTphbjul9Fh6bXrEFpo0LXVKbfJCRv8mERy/Qv+ybgyTB1RMZm8wAgeNEdqSW4Edac9I5rGhOmru+abzPce5eIYDelHGhUr2izKBNTYmGA1ErO8JPkyi6AVcfpIILk0AY6BgskheE7Jar6yE8kX5Lmkf0vuE4m3srAzBtPOO2lfbcfWSlX9izdsW0ZeCEZhr56yMJI8zNz0XEhjYiccAIlBNEUnMG83RKN6zPDzacZCAVfmdFAIb2b1eGpSerObaNvBNJ1On46upzHRnT+1HZ8fisWTZDFAaOO38DnRGG9UFrwzEfcJxfWxGA3ufNzPnK91nt81XtDRwvSpvjHSGTX8bFa+vnEyJjgchISZrHqxqUqy5OOZ9OSdbPmbuuhw/evgIAW0GAUL3iZh2QTZGQdUBgt6rTldLtmFGShHT1sCU560JnSI1YMIhP8mterVabm2v5P1B2yr/ywgCmek8r75P2AnwaDQaDOZl2u12oVSX2d7rJDT45gLSt1TyJKAADSIRhCG4MU8qPtOxUGSL+qOZ1U9ESlzubz31hACcwA8a1TNioTlhBgHxLUxndQNrhJK/mQShiPUocR9oRxSMCgkIiIBcRangkFWJ91bnjhWPgJ6a/catbceMgwF/i0mEqZRThKYRpxpRvUDTtQkcoxyhrntfFSxWl0Um5WosiEkHC4OQiOkUBENXyecbxLwTgZxQFV1QAoAJtgzf80AsTKVRENlB5uuH57H6+eJUMj/8BgDmDNW75ReRigFoVwv0enwIAKE2NX1raFiwFsBYtiKlTgLXh2LMjCU2CBExc2Qbe9yjY6ep8cXiBuxLUJ2tmnJdJaeg4NV4k35NgptD53te82njVgQBMGbcg4CuV12zfrjIA2afgIOhSWLKPelN1qmktrOmrkxESMJ8t8L6WPz4OG8BVVZLOZ4TgZlDzJ3/62J80fnh5AL2pp79M1Lt9+8knb88AqAaEuq1I9r3AS1Hkk0w3uno1ZeaRVWeQAyjgDQRBrconeIAoBt2JIL7p+Z8yTlgewLRxFgm9ffuxJ598rC4AzEPEb6oDjaSHwuclimxoBaoTiECQnZmZ+XkCURhvpkX4AH5j+Sm4GSW0O3jFTWPGJQcCcBJacDbAsRszGrZVGyS4FFWoGE4gD8KqWkEQqjY0DR05Q6JJfqE0vn4C7Ug5rVEKeMiiORDlQMY3vaFnHAjALgr/7cdibaxAHLW/iDx0AULM6mog7CKu3PVYeuApFhQydcolJRziaUliDC8iZk7lQJLj0BscGMCUsQEuuP1kkv/8l6jNznv/WZEVI6iL+GIEIdEDtUHg/LJTnynk0kuvfa0rSagnQ1nvdFo4JLaaK77hAGk4jSEsB/ALavpUTQjPAGogoLJjD4AAwW/yNAAISRcVcqaUCT/ttGYTVC1RuIF00Brg186c1YIJGt9jfPdyAC4xbmGn384eeKsaB3yeg9j0KA38bFvjM+upJ4ZrKb2TLsWl9EuZ+J9vfm1WogRKWbs8o/HLB/P1HzfxB48Yxy0HYGrrFsp3v7KRAHyJ499W46eKAC70ZonIrtPqquqAQKCC4cEvzQLpflpzm/85ef7qfhUAwiDgAuLNmfPmfL2zPpX/ObWcC3rGW76sIv/YjRvJAFkPks9+9OLOqFzvWPNpXqk8zCVJ6M01T2tWttmfO2X1aimr70Ls9RGmct4yWwsLrbpldeqJ/O8TlwMwpUiA+Of5jW/dprDQwDPLsjkTZ5s51eBy5mCQVqlKSNn1AsCpiq/NFk/BKhaRdGUPFbwahAt1iCf5ljsvk7kjF80nY4tIQM8gin1sBUDoQOM53Nc8h2QbL9TNhfn1Na5JZIvAQ3UMEwgvfhLyyUE1KsZey1T6W67Zkuncfy2aDsZGG4GTKsPp09ctuC1yJ2C1Z5T8ccR7oWDVW+kEh0A5qDISWlSCtXPK1K5U09ZCS9Ster0lJtE5/M/0Mi5YO3WqWRmdfzWA2WEg2M2c67FIJwnxSMhcOpeHYRcTEA0GjYXWQt0Uk5iVuqmcu37UB4ti4NR8ElMJoHzA5KMxtAuFTHjH6rh1s+FN1MJcOsvHj2A4NnM3gmQVk4NBIw27aSKvmdovgDcZT4zs/3D18/NMmKUURKcjLNLbskqQ7tZbMWr8UPeal6+hEYKAi9FgctCQ1MDCBP+xXwscZzxmt/NB2F4yDeRhYLtkeMt13XZLDIoiyZUfka7aMx0GiBEPsdjvc7tO7WP6lyNhOJaz4FGsMLch27K9kG3UEak6SNsxZIQojuk3sRgMJotSJCOyq56q/mpN5J2s4/XDoExNJlsA/fVIFGgAvSNfuQHCKnkEUCkUdkXvgpm840CFpyiLojHZmIRFQcKNYpiZntXOSjSVyWAYigAQetTkAkDYTVLvo5+5egmAKWPMp6FD70LYpo68fM9H1dwirajYaOBnRMeyNmL3vEPAmpgoTwyJMoFkj4OBAVTDD+bd8ZgOgCdsv+kz3eUbcNr1s5l4mxGwXLwIdRCOSg8CLRxPKgEZglqfG9hAA5B4+XAWBgxg09Snvgj7s8K+2oUcYgANiKLiQrUBwY6IlD2ErHmLhEO6kj0y0wSqhdYAMGjUJqrda3QYjCkDfNrk3WaWotmImFDLBQCTQgBKQ2zEhkATKMkc4Yhotnx5YrF45AGzY81jViIT4E+8v9YmGOOt/c8Lbn9t2loT/mj+jYYAGksSSZsf6qgIJCKkCW6CfV5eqruSPxF4XBQoDzwiAg/MHV6jEDAA43E7YqNz8REjDODbo4EolAPULkjEkUDjhgyXkQ3JkE6WoViFkYizwYUA4Hn3KB+McR/gi0hvucPgsyYN5NyG59VIREuRkCEa5BGJxMQwnCwSzdN5dXWYhEAQBKokKACYncMy3vSUCcbIAD9qcqvD0jDYCmUKW5GQjgKhn0VuwmeV/SkReQEJBXrIFbgGSXB6H+QXJrUJFSEMgLgIALoB/FW9JwNwzs17eF8TPEAeiBJpj6xZMbL/GSkeWLSkXqCoouTmhLbOpOyHyeowXN0PRhcqFQCk5JUg/LhyAfqQnOhNc7YoU0+Y9lIMWj4eUrNRlNmgWDyFceCZaPloyVAk+ir9siQJNBljki4zmI8QG42hCj7OLiYAFVNgDg4iTkG1L08OILPT9EnbX8TFnI9F2WBmJuF48p6hAkB7B0mffEDJVwu1/PIEEoGjkCtDOfgTtsAm40jfZ/uTFxAA4CmR06CtGVg9tca0CSq1zvSDjnLlNQIJ8/dFCxAGoWTdpWAb0B5OVSXM7zGAaeMx01e7HyrNZJUAmBkN2Nr1EUHIjT7qfz5IdCQ0kJlJSEdRS7oz66NUuB20YmZrUJBlRUQpt+pIxY8bO4yxE4yjiQF1vENAWE6GvRAFPOc80Z9UYSA0C2H5sTJEJIXGgN7Pcgdg6qbbkqbrtoRJ/VMdQ4Hreul66ghqirjKwZ9SEcQ4qAZATkPQSlDGFako0Tuz2glRJDLjq5IkaCYyrYJfpAO/ZfpF2rsWVgk9m9tyCyXLqguXG8dCqWDNm+a81UpbAq06tJ+ggSVQafgpMgBlPM0AgmhS9iNVBQR3pLT1K6Jh8pFFIvJ2sV6y3Hocz0MGWsRxyHRVxwiRpUKHWveSRdMaUNBghLa8noa1jDSDP2YAj1VYV5/T0E6CiWqjH46UgaJYjIB8Xq9D79il+ag0TlLHh90yhI6T1njS+ACTcBNnmQuAUJ+nnp3LBiJSWeDTFQqBtmq7iyH4u8GJaOrPv0hlm6hPZQJ9IuK70Lhu0Y5YqdOxCkpuId8dQM8KE1j6uEQNNBzCAFphN3C0Bc5TRPS4EIrxycGhNxHU5BoAoP9zJ0x5jyNydVHaljXjulBbT4ikoqXkjkwMJfIA6U52oNUhI2CQMuvzqA6ZC35bARgTzMD0kVMxgX8C5G1om7O64oxwL4LcLIyPLj0nKRMoB6gYIAD8VABct4N/Lka5OqKc+lTIP133A3tERAFAJpcJfhnI1UHfzj4PFSr/VfDZtjsieCafEtWmkJKcQ1AIMgBYGGZbZn1QY/GO8473KgD37gH7EQlVbIzzMEAtqq2R1AgPWVDl/3hhhpMsM7VWOJ/UxsdLHIHjCAo4wSJXkPULBKAOGsCQDgB3v/2yd9yR6Q8AJ+6hTo+cgFq2BrEZyaDGXheqDnMWQH6bVJ5R8bYYAIklE5BYjjuLHhQDHIAkv8kABABsYLFX7r4iB3AjNZroAqJGQuRQXb1mzZqG6kKKZASiPeRg7n1tZ23oob2VzwtqcCQEHStbAEAmMGO44Ghj75INij2RIldBDigH7wuCNQF8wNrP5qVIWCNRPj50tM7AoWjCYVnMPZaCwIMcAJitVrxQf9JYuwTAd5GFwbC2JAPcbVwFAMGa4rD/Q4URlH+FzPUjwa4PSpx6HHKcf+AAMoCrDUA5WG+24rjVMrfsCwD9dYNaO8rPuwzjPQwg0jWAOpCGjIrueJ5n44vNzilgcdqz2mwASxGAyzZodizoDwuIlgkASzepfiSieiLRqpadzcejQF5FZXvYiFEGNuIRph3PMo8C3WIHlFhsoaQRlJiJyQNuhwkABiAXiHjB3HDz0p3So6idSJM++BnyjauNO2mwXK2rswIgzSEATXvZnqjeHLXUoa48nVIGQK06A4gFonBLb4kFVhn/DoYDBTvlzZfyW79JHVSitdczKBNQSYtmJCW1TVTIQ6DEBSDnHsi2RgC06+14MsZov2vxbj0s8DrjX+jTFtSGX1VvnXvnGRkAIRUTx4tijr2exR3Hfimjfc6DUgbAdTWCuokUEANYoL3L+LF99gn/UIIez3vn8M1zTy/XimK2yACoCJmF0axnAyjKUea31EEeCkP61Qjq9AngJP61zFcaS2Ngk9Gzk92j7/3GDuP0QIqsAqEUNEuLyCbnPGV7FXk6BPUqaf6h1Wy3Ef7xgLrepUnAFuj9851LPzu7AjVx2IAk/mjmFUaMz+rzM6t8OYqMf+juI+Ig2iiLza8soYFl76A4A1VR99tUhZvWUP2CdrRKPKYAzoFRA3Tckfgz2yaJxzM+ep+bedT+wNXGviYo1/SMQQA6lrXIANrTJRX8ygY5/VL1d7MgoPxT8uNYLByxz30sy1ngdVcF9HEAhqw+EPjc2mrGUXGvG6+Cyj7XKlhZDLgjq6kZCOoTgNYR+9xctuxdNO9BLtbk6v7qsM8ALN3lKH+XVLjnMci+R3uYa95RAEyTMpClQ348duJUb6UA/ulK0FGfP5/vr07qltKX2z2u9dr7OfEoIDkAFYEIv3Yr1ktMvuKofe8kOsCdVFciED0ecDFku8xyJW0EXW7UO9ai6Mt80KzTXi7lP9RvkfoifuN+7mQ60K1c5+4ul3kfHIO20FrmfWZJtx2WVRj2He4wCOB7t82xJwSScJIA7OuAF7qb7p2/FSgEYVgfRr21OOHz/2YALJbfrJu88QL+I/MLMsDrD/p+wquvCtRnELUGm3eJVBbsWqPlhztQlf4tlqsYAOuNJx636eDvqHz35oDuAcFQ645KHaFdCriRXzVJPiffCAAKwU8c4j2l777sDLXDkZjuUDwiQek7mvzM/u0mBSCiH6GntG8MCMbLjBN7h3pb73ll2vtFp5qZubS48AwjEIlH/XfTZJ2V8grAy9eeeOj3FV/Jm7BoFeuqw8zVzryeVR42fZsGgBYlnvI9qnCj8fIf/LZubL6C3ICWRX5LM+y+2lPn3yb9s+ZLTE6S5akGA8Bxy95hvMJ7y9976W6aZ01yMTJMM91w7ODPcMw2IOBhxpMN/pQq296b/MTiz4sP7e56oqVAgNxJzabqNb5lucO2q8032bdAe5MN4p1JTUNi8toD3GF9MN8vuHT3ZjRKIvbbbRXtbVeZo068i7xn6UI2WLTgT3UmxQ993979EdChfcPieBih3xCx2QTNM+G47SY6LjK9GWuDNxqxor4GI7n2wHeYH+R3TC69bPcdv88CRAy5LoNQX24w4wZ0n6QPtLTlG42dO3e+zNi740X+ls3773+00VgnCQVLbgly+QIJ5Njjx85JGODMMx+91tj0UnzN5wGW1VjXiMnQDUkZR/KxduIxGeOHaJz5yN7l7yk/ZADnGE984Qtf/P5HH8bMirl5HV5IrmzkC4eTUH7PdXtX8p2bg7fAKuGL6K8M42MPr3tIyv46tUXc76Nz00BkY+d1e+/FqTtW8AWsQwBwYyRrdx33fsP427+XEL/uIcjuA8g6/Kch1zXO/Lt/u+5abmxfmq96rbpRyPB3od4O4w/+9YEP/cWD99/3of5DDz74cF/Z4hF1Z/pL910zskB4Fx3tyL6DYdx3/71/Y9z3wHVRMfkjnDH1+pVf7n8Buwfx4bHsZDwAAAAASUVORK5CYII=',
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
/* ---- AN EMPTY BOX THAT IS OWED AN ANSWER IS AMBER (owner, 13 Oct 2026:
   "where a field needs to be filled out and it is empty, it should be amber
   ... across the platform ... so users are pulled to that field") ----
   OWED IS WHAT detailsOf COUNTS ON A CONTRACT: the other party, the value (a
   0 is no value), the start date and every one of the template's own
   questions. Who we are, their email, the end date, which side of the money
   and the stream are asked but never owed (NEED_NEVER), so they stay white.
   A builder marks the box with `needAttrs(f, value)`; ONE capture listener
   keeps its class as it is typed in, and the date picker's face follows its
   box (datePickDress paints through needMark). The amber is a custom
   property (--need-bg) because these boxes wear INLINE clothes no sheet rule
   outranks: their background reads `var(--need-bg, var(--color-surface))`.
   On the paper and in Complete the details the same amber comes from the
   record's own reading (.cd-fld.is-open), never from this. */
const NEED_NEVER = new Set(['party', 'cpemail', 'cpEmail', 'expiry', 'side', 'folder', 'stream']);
const NEED_BG = 'var(--need-bg,var(--color-surface))';
function needKind(f){
  if (!f || f.type === 'stream') return '';
  const k = String(f.maps || f.key || '');
  if (!k || NEED_NEVER.has(k) || NEED_NEVER.has(String(f.key || ''))) return '';
  return (f.type === 'num' || k === 'value') ? 'num' : '1';
}
function needIsEmpty(kind, v){
  const t = String(v == null ? '' : v).trim();
  if (!t) return true;
  return kind === 'num' ? !(Number(t.replace(/[^\d.-]/g, '')) > 0) : false;
}
/* the attributes a builder writes on an owed box; '' on any other */
function needAttrs(f, value){
  const k = needKind(f); if (!k) return '';
  return ` data-need="${k}"${needIsEmpty(k, value) ? ' class="need-empty"' : ''}`;
}
function needMark(el){
  if (!el || !el.getAttribute) return;
  const k = el.getAttribute('data-need'); if (!k) return;
  const e = needIsEmpty(k, el.value);
  el.classList.toggle('need-empty', e);
  const face = el.nextElementSibling;
  if (face && face.classList && face.classList.contains('dp-face')) face.classList.toggle('need-empty', e);
}
if (typeof document !== 'undefined' && document.addEventListener && !window._needWired) {
  window._needWired = true;
  const on = ev => { const t = ev.target; if (t && t.matches && t.matches('[data-need]')) needMark(t); };
  document.addEventListener('input', on, true);
  document.addEventListener('change', on, true);
}
Object.assign(window,{NEED_BG,needAttrs,needMark});
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
