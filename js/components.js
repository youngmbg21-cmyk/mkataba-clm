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
  /* a saved signature's tab (round 0 of the Legora way, 31 Oct 2026: no typed mark leads a button) */
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
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
  /* one person — "for Jonas", a stand-in's answer (round 15) */
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
  /* a code name's tag (round 13: a deal kept to its list, on the wall) */
  tag:'<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  /* the archive shelf (round 13: the Contracts place's own Archive button) */
  archive:'<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  /* a request's attachments, as the Requests list counts them (round 20) */
  clip:'<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  /* a lane that sends a request on (round 20: "⇉ NDA lane") — two arrows side by side */
  lane:'<path d="M3 8h13M13 5l3 3-3 3M3 16h13M13 13l3 3-3 3"/>',
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
   The honeyguide in glasses in simple 3D, smooth shading, his round shape
   (owner, 20 Oct 2026: the feathered bird of 14 Oct blurred at the small
   sizes the panels draw him, so the simple 3D of 11 Oct is back) — and kept
   here as two small pictures
   so every chat — the Jambo window, Home's panel, the phone — shows the same
   face with nothing to fetch. 'hello' beside his answers and his greeting,
   'think' while he works. Decorative: the words beside it carry the meaning,
   so alt is empty. On a computer every face is the ✦ mark (below). */
const JAMBO_FACE = {
  hello: 'data:image/png;base64,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',
  think: 'data:image/png;base64,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',
};
/* ---- ON A COMPUTER JAMBO IS A MARK, NOT A BIRD (Chambers; the owner picked
   it by name, 20 Oct 2026, and said the mascot was negotiable) ----
   One switch for every face the desktop draws: the same signature, the same
   class names and box size, so every layout cell keeps its place, but the
   picture is the four-pointed ✦ in the accent ink. The phone keeps the bird
   (mPhone, js/mobile.js). JAMBO_MARK_PATH is the one drawing; the bar's door
   and Jambo's window head draw it too. */
const JAMBO_MARK_PATH = 'M8 1C8.5 5.2 10.8 7.5 15 8C10.8 8.5 8.5 10.8 8 15C7.5 10.8 5.2 8.5 1 8C5.2 7.5 7.5 5.2 8 1Z';
const jamboBirdHere = () => { try { return typeof window !== 'undefined' && typeof window.mPhone === 'function' && !!window.mPhone(); } catch (_){ return false; } };
const jamboMarkSvg = (size = 16, cls = '') =>
  `<svg class="jambo-mark${cls ? ' ' + cls : ''}" width="${size}" height="${size}" style="width:${size}px;height:${size}px" viewBox="-4 -4 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${JAMBO_MARK_PATH}"/></svg>`;
const jamboFaceHtml = (mood = 'hello', size = 28, cls = '') => jamboBirdHere()
  ? `<img class="jambo-face${cls ? ' ' + cls : ''}" src="${JAMBO_FACE[mood] || JAMBO_FACE.hello}" width="${size}" height="${size}" style="width:${size}px;height:${size}px" alt="" draggable="false">`
  : jamboMarkSvg(size, 'jambo-face' + (cls ? ' ' + cls : ''));
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
/* ---- AN ANSWER READS FROM ITS FIRST LINE (owner, 20 Oct 2026: "when the
   output or answer is given by jambo, the page pushes me to the bottom of the
   output and i have to scroll up to begin reading. I should start from the
   top where the answer starts then scroll down") ----
   ONE landing for every Jambo conversation: the scroller `sc` is moved so
   the newest turn `last` starts at its top (JAMBO_LAND_GAP above it); an
   answer shorter than the room simply ends at the bottom, as before. With
   `follow` (words still arriving) it only ever moves DOWN, and never past the
   answer's first line, so the reader is not pulled back once they scroll on. */
const JAMBO_LAND_GAP = 8;
function jamboFeedLand(sc, last, o = {}){
  if (!sc) return;
  if (!last){ sc.scrollTop = sc.scrollHeight; return; }
  const top = Math.max(0, Math.round(last.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - JAMBO_LAND_GAP));
  const want = Math.min(top, Math.max(0, sc.scrollHeight - sc.clientHeight));
  if (o.follow && sc.scrollTop >= want) return;
  sc.scrollTop = want;
}
/* the newest of a feed's turns, by the selector its builder draws */
function jamboFeedLast(feed, sel){
  if (!feed) return null;
  const all = feed.querySelectorAll(sel || '.ai-msg');
  return all.length ? all[all.length - 1] : null;
}
Object.assign(window,{ICONS,icon,plusLed,JAMBO_FACE,JAMBO_MARK_PATH,jamboMarkSvg,jamboFaceHtml,jamboFacePaint,busyHtml,busySet,JAMBO_LAND_GAP,jamboFeedLand,jamboFeedLast});
/* ---- LAND ON IT (owner, 18 Oct 2026: "a well crafted rule where you are
   directed towards what you are looking for exactly so you are not searching
   across the page") ----
   THE ONE LANDER every door calls once it has opened the page: it waits,
   bounded, for the thing the press named (a card, a row, a box, a button —
   never just a page), brings it into view, marks it .is-landed (which draws
   nothing since the owner's 21 Oct 2026 ruling: no light on arrival) and
   readies its main button for Enter. It PRESSES NOTHING. The
   ring stays until the reader's next press or key, and follows the thing
   through a repaint (the page drew it again under the same name), so a board
   that refills a moment later does not put it out. A thing that never shows
   is said where the reader looks (opts.missing), never a silent arrival.
   Story: MAP-HISTORY "LAND ON IT". */
const LAND_TRIES = 40, LAND_WAIT = 100, LAND_PULSE_MS = 2000, LAND_KEEP_MS = 1500;
/* the main button: the area's filled one, else its first live one */
const LAND_MAIN = '.ui-btn-primary:not([disabled]), .hb-btn.is-primary:not([disabled]), .is-primary:not([disabled])';
const LAND_ANY = 'button:not([disabled]), [href], input:not([type="hidden"]):not([disabled])';
let _land = null;   // { el, sel, at, obs }
function landOff(){
  if (!_land) return;
  try { if (_land.obs) _land.obs.disconnect(); } catch (_){}
  try { _land.el.classList.remove('is-landed', 'is-landed-held'); } catch (_){}
  _land = null;
}
function landFind(target){
  try {
    if (typeof target === 'function') return target();
    if (typeof target === 'string') return document.querySelector(target);
    return target || null;
  } catch (_){ return null; }
}
const landShown = el => !!(el && el.isConnected && el.getClientRects && el.getClientRects().length);
function landOn(target, opts = {}){
  if (typeof document === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    let n = 0;
    const tries = opts.tries || LAND_TRIES;
    const go = () => {
      const el = landFind(target);
      if (!landShown(el)){
        if (++n < tries){ setTimeout(go, opts.wait || LAND_WAIT); return; }
        if (opts.missing && typeof toast === 'function') toast(opts.missing, 'warn');
        resolve(null); return;
      }
      landOff();
      try { el.scrollIntoView({ block: opts.block || 'nearest', inline: 'nearest' }); } catch (_){}
      el.classList.add('is-landed');
      const L = _land = { el, sel: typeof target === 'string' ? target : null, find: typeof target === 'function' ? target : null, at: Date.now(), obs: null, btn: null };
      /* ITS MAIN BUTTON, READY: Enter does it. A dropdown is never focused by
         hand (on an iPad a focused select IS the system picker): fieldFocus. */
      const ready = host => {
        if (opts.focus === false || !host) return null;
        let b = null;
        try { b = opts.focus ? host.querySelector(opts.focus) : (host.matches && host.matches(LAND_ANY) ? host : (host.querySelector(LAND_MAIN) || host.querySelector(LAND_ANY))); } catch (_){ b = null; }
        if (!b) return null;
        /* through the one focuser: after a mouse or finger press the button is ready with no ring (fieldFocus) */
        if (b.tagName === 'SELECT'){ if (typeof fieldFocus === 'function') try { fieldFocus(b); } catch (_){} }
        else if (typeof fieldFocus === 'function') try { fieldFocus(b, { preventScroll: true }); } catch (_){}
        else try { b.focus({ preventScroll: true }); } catch (_){}
        return b;
      };
      L.btn = ready(el);
      /* THE RING AND THE HAND FOLLOW A REPAINT: the page that drew the target
         may draw it again under the same name, or redraw what is inside it; the
         light moves to the new one (without pulsing again once the pulse has
         had its time), and the button the keyboard was readied on is readied
         again, unless the reader has put the keyboard somewhere else. */
      if (typeof MutationObserver === 'function'){
        L.obs = new MutationObserver(() => {
          if (_land !== L) return;
          if (!L.el.isConnected){
            const nu = L.sel ? landFind(L.sel) : L.find ? landFind(L.find) : null;
            if (!nu || nu === L.el) return;
            L.el = nu; nu.classList.add('is-landed');
            if (Date.now() - L.at > LAND_PULSE_MS) nu.classList.add('is-landed-held');
          }
          /* a part drawn late above it (Discover's summary beside Contracts) may push it out of sight: in its first
             moments the landing keeps it in sight */
          if (Date.now() - L.at < LAND_KEEP_MS && L.el.isConnected){
            const r = L.el.getBoundingClientRect();
            if (r.top < 0 || r.bottom > innerHeight) try { L.el.scrollIntoView({ block: opts.block || 'nearest', inline: 'nearest' }); } catch (_){}
          }
          if (opts.focus !== false && (!L.btn || !L.btn.isConnected)){
            const a = document.activeElement;
            if (!a || a === document.body) L.btn = ready(L.el);
          }
        });
        try { L.obs.observe(document.body, { childList: true, subtree: true }); } catch (_){}
      }
      resolve(el);
    };
    setTimeout(go, opts.delay || 0);
  });
}
/* the reader's next press or key puts the light out */
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._landWired){
  document._landWired = true;
  /* the press that sent the reader here came before the light (the lander
     runs after its click), so any press now is the next one */
  document.addEventListener('pointerdown', () => { if (_land) landOff(); }, true);
  document.addEventListener('keydown', e => { if (_land && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) landOff(); }, true);
}
Object.assign(window,{LAND_TRIES,LAND_WAIT,LAND_PULSE_MS,landOn,landOff});
/* ---- AN EMPTY BOX THAT IS OWED AN ANSWER IS AMBER (owner, 13 Oct 2026:
   "where a field needs to be filled out and it is empty, it should be amber
   ... across the platform ... so users are pulled to that field") ----
   OWED IS WHAT detailsOf COUNTS ON A CONTRACT: the other party, the value (a
   0 is no value), the start date and every one of the template's own
   questions. Who we are, their email, the end date, which side of the money
   and the stream are asked but never owed (NEED_NEVER), so they stay white —
   save the New agreement form's stream box, which Create waits on and which
   its own light() marks (owner, 20 Oct 2026).
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
  /* a field inside the two-row card also takes the card's shape (one line
     until the words wrap) when the page puts words in it */
  if (el.closest && el.closest('.jb-card') && typeof jamboCardGrow === 'function') jamboCardGrow(el);
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

/* ---- THE TWO-ROW CARD: EVERY JAMBO BOX (owner picked "Two-row card", 20 Oct
   2026: "Two-row card BUT … these need to change as well", the edit page's box
   with its send outside, and Home's panel with Ask over the words) ----
   The words take the whole width; under them ONE row of controls: + (add a
   file, the one upload door) and "Asking about" on the left, a round send on
   the right. The box grows to six lines, then scrolls on a thin bar with no
   arrows. ONE builder, so Home's box, Home's panel, the lists, Import,
   Settings, the Calendar, the clause editor, the builder and the window draw
   one card. Each caller hands its OWN field and send (ids, data hooks and
   listeners untouched); `ctx` is what the box asks about. */
const JB_SEND_ICON = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
const JB_PLUS_ICON = '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10"/></svg>';
const _jbT = k => (typeof i18t === 'function') ? i18t(k) : k;
/* the round send: the caller's own attributes, its name on the hover and to a
   screen reader (the word "Ask" no longer printed) */
function jamboSendHtml(attrs, label, o = {}){
  return `<button type="${o.submit ? 'submit' : 'button'}" class="jb-send${o.cls ? ' ' + o.cls : ''}" ${attrs || ''} aria-label="${esc(label)}"${o.title === false ? '' : ` title="${esc(o.title || label)}"`}>${JB_SEND_ICON}</button>`;
}
function jamboCardHtml(o = {}){
  const may = typeof window === 'undefined' || typeof window.pdDropMay !== 'function' || window.pdDropMay();
  const plusT = may ? _jbT('jb_add_file') : _jbT('ca_wall_head');
  const plus = o.noFile ? '' : `<button type="button" class="jb-plus" data-jb-file aria-label="${esc(plusT)}" title="${esc(plusT)}"${may ? '' : ' disabled aria-disabled="true"'}>${JB_PLUS_ICON}</button>`;
  return `<div class="jb-card${o.cls ? ' ' + o.cls : ''}"${o.id ? ` id="${o.id}"` : ''}>${o.lead || ''}${o.field || ''}<div class="jb-row">${plus}${o.ctx || ''}<span class="jb-sp"></span>${o.send || ''}</div>${o.tail || ''}</div>`;
}
/* + ADDS A FILE THROUGH THE ONE UPLOAD DOOR (pdDropDoor; the phone's pop-up
   where there is no desk). A page that keeps work is left by its own guard. */
function jamboAddFile(){
  const go = () => { if (!(typeof window.pdDropDoor === 'function' && window.pdDropDoor()) && typeof window.openUploadModal === 'function') window.openUploadModal(); };
  try{
    if (typeof window.clauseEditorOpen === 'function' && window.clauseEditorOpen() && typeof window.ceLeaveGuard === 'function'){
      window.ceLeaveGuard(() => { if (typeof window.rlCloseClauseEditor === 'function') window.rlCloseClauseEditor(); go(); }); return;
    }
    if (typeof window.tbOnScreen === 'function' && window.tbOnScreen() && typeof window.tbLeave === 'function'){ window.tbLeave(go); return; }
  }catch(_){}
  go();
}
/* the card grows with its words up to six lines (CSS caps it); a field that
   was an input keeps Enter = send (data-jb-enter): its form, else its send */
function jamboCardGrow(t){
  if (!t || !t.style) return;
  t.style.height = 'auto';
  if (!t.scrollHeight) return;
  /* ONE LINE UNTIL THE WORDS WRAP (owner, 20 Oct 2026): the card turns tall
     once the words need a second line, and stays tall until they are gone
     (so it never flips back and forth at the edge of a line) */
  const card = t.closest ? t.closest('.jb-card') : null;
  if (card){
    if (!String(t.value || '').length) card.classList.remove('is-tall');
    else if (!card.classList.contains('is-tall')){
      const cs = getComputedStyle(t);
      const lh = parseFloat(cs.lineHeight) || 21;
      const pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
      if (/\n/.test(t.value) || t.scrollHeight > lh * 1.5 + pad) card.classList.add('is-tall');
    }
    t.style.height = 'auto';
    if (!t.scrollHeight) return;
  }
  /* AN EMPTY BOX IS ONE LINE (owner, 22 Oct 2026): its height is never the
     placeholder's — Chrome counts a wrapped placeholder in scrollHeight, so a
     narrow panel's hint used to stand the empty box two or more lines tall */
  if (!String(t.value || '').length){
    const cs = getComputedStyle(t);
    const one = (parseFloat(cs.lineHeight) || 21) + (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
      + (parseFloat(cs.borderTopWidth) || 0) + (parseFloat(cs.borderBottomWidth) || 0);
    t.style.height = Math.ceil(Math.max(one, parseFloat(cs.minHeight) || 0)) + 'px';
    return;
  }
  const max = parseFloat(getComputedStyle(t).maxHeight);
  t.style.height = Math.min(t.scrollHeight, max && isFinite(max) ? max : Infinity) + 'px';
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._jbCardWired){
  document._jbCardWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-jb-file]') : null;
    if (b && !b.disabled){ e.preventDefault(); jamboAddFile(); }
  });
  document.addEventListener('input', e => { const t = e.target; if (t && t.matches && t.matches('.jb-card textarea')) jamboCardGrow(t); });
  /* a box emptied or filled by the page (a send, a prefill, a draft kept)
     takes its shape on the next frame: after a send, a focus, or a repaint */
  const refit = () => { try{ document.querySelectorAll('.jb-card > textarea').forEach(t => {
    const tall = t.parentElement.classList.contains('is-tall');
    if ((tall && !t.value) || (!tall && t.value)) jamboCardGrow(t); }); }catch(_){} };
  let _jbRefitAsked = false;
  const refitSoon = () => { if (_jbRefitAsked) return; _jbRefitAsked = true;
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : f => setTimeout(f, 16))(() => { _jbRefitAsked = false; refit(); }); };
  document.addEventListener('submit', () => setTimeout(refitSoon, 0), true);
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('.jb-send')) setTimeout(refitSoon, 0); });
  document.addEventListener('focusin', e => { if (e.target && e.target.matches && e.target.matches('.jb-card > textarea')) refitSoon(); });
  if (typeof MutationObserver === 'function' && document.documentElement){
    try{ new MutationObserver(refitSoon).observe(document.documentElement, { childList: true, subtree: true }); }catch(_){}
  }
  document.addEventListener('keydown', e => {
    const t = e.target; if (!t || !t.matches || !t.matches('textarea[data-jb-enter]') || e.defaultPrevented) return;
    if (!chatFieldSubmits(e)) return;
    setTimeout(refitSoon, 0);
    const f = t.form || (t.closest && t.closest('form'));
    if (f){ if (typeof f.requestSubmit === 'function') f.requestSubmit(); else f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })); return; }
    const s = t.closest && t.closest('.jb-card') && t.closest('.jb-card').querySelector('.jb-send'); if (s && !s.disabled) s.click();
  });
}
/* ---- THE DOORS ABOVE JAMBO'S BOX (round 1 of the Legora way, owner, 31 Oct 2026: "above the jambo entry field
   should be the doors to board and others with the green links") ----
   Read from the flow map (FLOW_MAP, js/flowmap.js): the doors of the page in front, at most five, each the word
   that opens it from any box, as a green link; a press moves through Jambo's one mover (caGo). In Jambo's panels
   (Home's and the paper's dock, every list panel, Settings) they stand just above the panel's foot, so the foot
   keeps its 56; on Home they share the counts' line (cnCountsHtml). Kept in step with the page by one sync after
   any repaint; a contract's own faces are offered only with a contract in front. Named "ways" so they never meet
   the way back above the box (.jb-door, jamboDoorHtml). Moves nothing, writes nothing. */
const JB_WAY_FEET = ['#ig-dock .igd-foot', '#app-shell .jl-foot', '.st-cr #st-jb-form'];
const JB_WAY_FACES = new Set(['document', 'brief', 'fill', 'sign', 'share', 'history', 'redline', 'next']);
function jamboWaysHere(){
  let k = null;
  try { k = (typeof window.guideHereKey === 'function') ? window.guideHereKey() : null; } catch (_){ k = null; }
  if (!k && typeof state !== 'undefined' && state && state.view) k = state.view;
  const row = (k && typeof window.flowMapRow === 'function') ? window.flowMapRow(k) : null;
  if (!row) return { k: k || '', doors: [] };
  const face = JB_WAY_FACES.has(k);
  return { k, doors: row.d.filter(d => d !== k && (face || !JB_WAY_FACES.has(d))) };
}
function jamboWayWord(k){ const w = _jbT('ca_w_' + k); return (w && w !== 'ca_w_' + k) ? w : k; }
function jamboWaysHtml(here, cls){
  /* the new look's (owner, 31 Oct 2026: built behind the switch until each page is approved) */
  if (typeof window.newLookOn === 'function' && !window.newLookOn()) return '';
  if (!here.doors.length) return '';
  return `<nav class="jb-ways${cls ? ' ' + cls : ''}" data-jb-ways="${esc(here.k)}" aria-label="${esc(_jbT('jb_doors_label'))}">${here.doors.map(d => `<button type="button" class="jb-way" data-jb-way="${esc(d)}">${esc(jamboWayWord(d))}</button>`).join('')}</nav>`;
}
function jamboWaysSync(){
  if (typeof document === 'undefined') return;
  if (typeof window.newLookOn === 'function' && !window.newLookOn()){ document.querySelectorAll('.jb-ways.is-above-foot').forEach(w => w.remove()); return; }
  const here = jamboWaysHere();
  /* the first day has nothing behind the doors yet (round 7, as drawn): none above the box */
  if (document.querySelector('#cn2-page.is-first')) here.doors = [];
  for (const sel of JB_WAY_FEET){
    document.querySelectorAll(sel).forEach(foot => {
      if (!foot.querySelector('.jb-card')) return;
      /* THE CONTRACT'S ONE ROW (the contract round, as drawn): its own next-step links stand above the box instead */
      if (!(typeof window.regFoldersUp === 'function' && window.regFoldersUp()) && foot.parentElement && foot.parentElement.querySelector('[data-ig-chips] [data-ca-chip]') && (document.querySelector('#ig-paper:not([hidden]) #ig-canvas') || document.querySelector('[data-reg-home]'))){ const w = foot.previousElementSibling; if (w && w.classList && w.classList.contains('jb-ways')) w.remove(); return; }
      const prev = foot.previousElementSibling, old = prev && prev.classList && prev.classList.contains('jb-ways') ? prev : null;
      /* a chosen row's or a face's own links (jlOwnPaint, jamboOwnWays) stand there instead, while what drew them stands */
      if (old && old.classList.contains('is-own')){ const f = old.getAttribute('data-own-for'); if (!f || document.querySelector(f)) return; }
      if (old && old.getAttribute('data-jb-ways') === here.k && old.childElementCount === here.doors.length) return;
      if (old) old.remove();
      const html = jamboWaysHtml(here, 'is-above-foot'); if (!html) return;
      foot.insertAdjacentHTML('beforebegin', html);
    });
  }
}
/* a face's own links above Jambo's box (as drawn: Before you sign's "dossier · clauses · history"), kept while `forSel` stands */
function jamboOwnWays(footSel, html, forSel){
  if (typeof document === 'undefined') return;
  const foot = document.querySelector(footSel); if (!foot) return;
  const prev = foot.previousElementSibling; if (prev && prev.classList && prev.classList.contains('jb-ways')) prev.remove();
  /* an empty row is held too (a face drawn with no links above its box keeps the page's away) */
  if (html != null) foot.insertAdjacentHTML('beforebegin', `<nav class="jb-ways is-above-foot is-own" data-jb-ways="own" data-own-for="${esc(forSel || '')}"${html ? '' : ' hidden'}>${html}</nav>`);
}
let _jbWaysQueued = false;
function jamboWaysQueue(){ if (_jbWaysQueued) return; _jbWaysQueued = true; const run = () => { _jbWaysQueued = false; try { jamboWaysSync(); } catch (_){ /* a convenience */ } };
  /* its own small task after the repaint, never inside the frame that drew it (home-speed-verify: a switch's freeze) */
  setTimeout(run, 0); }
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function'){
  /* a door's press: the one mover */
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-jb-way]'); if (!b) return;
    if (typeof window.caGo === 'function') window.caGo({ kind: 'go', place: b.getAttribute('data-jb-way'), cid: null });
  });
  /* kept in step with the page: any repaint queues one sync (bound once, at load) */
  if (typeof MutationObserver === 'function'){
    const start = () => { if (!document.body) return; new MutationObserver(muts => { for (const m of muts){ if (m.target && m.target.closest && m.target.closest('.jb-ways')) continue; jamboWaysQueue(); return; } }).observe(document.body, { childList: true, subtree: true }); jamboWaysQueue(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  }
}
Object.assign(window,{JB_SEND_ICON,jamboSendHtml,jamboCardHtml,jamboAddFile,jamboCardGrow});
Object.assign(window,{JB_WAY_FEET,jamboWaysHere,jamboWaysHtml,jamboWaysSync,jamboWayWord,jamboOwnWays});

/* ═══ THE SLIDER — ONE DIVIDER BESIDE EVERY JAMBO PANEL (owner, 19 Oct 2026:
   "all the new jambo panels do not have a slider like in the redline page.
   They should all have one.") ═════════════════════════════════════════════
   Home's divider (27 Sep 2026, the Document tab's and the Negotiate page's
   handle) made into the ONE builder and the ONE wiring every Jambo side panel
   is a client of: Home on every face (igFitSplit), the panel beside the lists
   and Import (jlFrame) and Settings (stSideHtml). THE CLOTHES FOLLOW THE
   BUILDER: one look (.ig-resizer in index.html), one drag, one clamp.
   · THE GRIP: a 14px press strip lying WHOLLY ON THE PANEL'S SIDE of the seam
     (Young, 6 Oct 2026: the page's own scrollbar beside it stays pressable),
     a 4px × 72px grip in the quiet grey, the accent under the pointer, while
     dragging and on keyboard focus, amber at a floor ([data-at-limit]).
   · THE DRAG follows the POINTER'S POSITION, never the distance travelled,
     with the grab offset kept so the handle does not jump under the finger
     (the strip's left edge is the seam); pointerup AND pointercancel let go —
     Safari may cancel a drag (a system swipe, a second finger).
   · THE KEYS: ArrowLeft widens the panel, ArrowRight narrows it, a step of
     max(8px, 2%); Home, Enter and a double-click put the resting width back
     and forget the choice.
   · THE FLOORS WIN: the panel keeps `min`, the page beside it `restMin`.
   · WHAT IS STORED is the panel's WIDTH, in this browser, under the host's
     own key; nothing stored = nobody has chosen, which is what lets the
     resting place be a width (`w0`) — the panel's own, on every monitor.
   A HOST says where its panel stands, read live at every call:
     { key, w0 (a width, or a function giving one), min, restMin, foldedW,
       avail() the room the page and the panel share, edge() the panel's far
       edge on screen, folded(), off() (stacked, hidden, not drawn),
       apply(w) the ONE writer of the width, place(rez, w)?, dragging(on)?,
       settle()? once a width has settled, pref()?/save(w)? where a host keeps
       its store its own way, resize()? its window-resize answer (bound once) }
   Story: MAP-HISTORY "THE SLIDER ON EVERY JAMBO PANEL". */
const SPLIT_GRIP = 14;
function splitHtml(o = {}){
  const label = (typeof i18t === 'function') ? i18t(o.label || 'int_drag_width') : (o.label || '');
  return `<div id="${esc(o.id || '')}" class="ig-resizer${o.cls ? ' ' + esc(o.cls) : ''}" role="separator" aria-orientation="vertical" tabindex="0" aria-valuemin="${Math.round(Number(o.min) || 0)}" aria-label="${esc(label)}" title="${esc(label)}"${o.hidden ? ' hidden' : ''}><span></span></div>`;
}
/* the reader's stored width, or null; a browser that keeps nothing keeps nothing */
function splitPref(key){
  try { const v = Number(localStorage.getItem(key)); if (v > 0 && isFinite(v)) return Math.round(v); } catch (_){ return null; }
  return null;
}
function splitSave(key, w){
  try { if (w == null) localStorage.removeItem(key); else localStorage.setItem(key, String(Math.round(w))); } catch (_){}
}
const splitRest = h => Number(typeof h.w0 === 'function' ? h.w0() : h.w0) || h.min || 0;
/* The width the panel takes in a room `avail` wide: the reader's choice or
   the resting width, clamped by both floors. Pure, so a stage can ask it. */
/* how much of the page stays in sight at the panel's widest: the page's own
   floor where the panel squeezes; where it slides over, the same strip on every
   page (SPLIT_PEEK, Home's own IG_LEFT_MIN), so a list whose table is wider
   than the mark slides under the panel like the paper does */
const SPLIT_PEEK = 420;
const splitKeep = h => (h.over === false) ? h.restMin : Math.min(Number(h.restMin) || 0, SPLIT_PEEK);
function splitClamp(want, avail, h){
  let w = Number(want) || splitRest(h);
  const keep = splitKeep(h);
  if (avail > 0){
    if (avail >= keep + h.min) w = Math.min(Math.max(w, h.min), avail - keep);
    else w = Math.max(h.min, Math.min(w, avail));
  } else w = Math.max(w, h.min);
  return Math.round(w);
}
/* PAST THE MARK THE PANEL SLIDES OVER (owner, 24 Oct 2026, over the
   signing page on the iPad: "when you slide the side panel leftwards, it does
   not squeeze the page but rather at some point begins to slide over the
   paper. All pages should do the same starting the marker where the signing
   page side panel begins to do overlay"). The signing copy keeps its A4 sheet
   whole (794px and its gutters), so once its column is narrower than that the
   panel covers the paper instead of squeezing it. Every panel now does the
   same at the same mark: the page beside it narrows until it is SPLIT_OVER_AT
   wide, then holds still and the panel's further width lies OVER it. A
   window too small to give the page the mark at the panel's resting width
   holds the page where the resting width leaves it (nothing slides over at
   rest), and the page's own floor (restMin) still wins. The host is told the
   width that lies over the page, `apply(w, over)`; one with `over: false`
   squeezes as before. Story: MAP-HISTORY "THE SLIDER ON EVERY JAMBO PANEL". */
const SPLIT_OVER_AT = 880;
function splitOver(w, avail, h){
  if (!h || h.over === false || !(avail > 0)) return 0;
  /* a host whose room starts right of the page's own left edge (Settings' board, inside its padding) says where
     the mark falls in ITS room (`overAt`), so the panel starts to slide over at the same spot on the screen as
     the lists' (owner, 28 Oct 2026: "make Customers and Settings match contacts") */
  const at = (typeof h.overAt === 'function') ? (Number(h.overAt()) || SPLIT_OVER_AT) : SPLIT_OVER_AT;
  const hold = Math.max(Number(h.restMin) || 0, Math.min(at, avail - splitRest(h)));
  return Math.max(0, Math.round(hold - (avail - w)));
}
const _splitPrefOf = h => (typeof h.pref === 'function') ? h.pref() : splitPref(h.key);
const _splitSaveOf = (h, w) => { if (typeof h.save === 'function') h.save(w); else splitSave(h.key, w); };
function splitWidth(h){
  if (h.folded()) return h.foldedW;
  return splitClamp(_splitPrefOf(h) ?? splitRest(h), h.avail(), h);
}
/* THE ONE LAYOUT PASS: the host writes the width, the grip is shown at the
   seam or stood down, its floors marked. Every door asks this and nothing
   else writes the width. */
function splitFit(rez, h){
  const w = splitWidth(h);
  const avail = h.avail();
  const over = h.folded() ? 0 : splitOver(w, avail, h);
  h.apply(w, over);
  if (rez){ if (over) rez.setAttribute('data-over', String(over)); else rez.removeAttribute('data-over'); }
  if (!rez) return w;
  if (h.folded() || (typeof h.off === 'function' && h.off()) || !(avail > 0)){ rez.hidden = true; return w; }
  rez.hidden = false;
  if (typeof h.place === 'function') h.place(rez, w);
  const keep = splitKeep(h), atMin = w <= h.min, atMax = avail >= keep + h.min && w >= avail - keep;
  if (atMin || atMax) rez.setAttribute('data-at-limit', atMin ? 'min' : 'max'); else rez.removeAttribute('data-at-limit');
  rez.setAttribute('aria-valuenow', String(w));
  return w;
}
/* THE ONE WIRING, bound once per grip element (a page drawn again draws a
   new grip, and it is bound in its turn) */
function splitWire(rez, h){
  if (!rez) return;
  splitFit(rez, h);
  if (rez.dataset.splitBound) return;
  rez.dataset.splitBound = '1';
  let grabDx = 0;
  const settle = () => { if (typeof h.settle === 'function') h.settle(); };
  const widthAt = x => splitClamp(h.edge() - (x + grabDx), h.avail(), h);
  const onMove = e => { const x = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX; _splitSaveOf(h, widthAt(x)); splitFit(rez, h); };
  const onUp = () => { delete rez.dataset.drag; if (typeof h.dragging === 'function') h.dragging(false);
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp);
    settle(); };
  rez.addEventListener('pointerdown', e => { e.preventDefault(); rez.dataset.drag = '1';
    /* the strip's LEFT edge is the seam (it lies on the panel's side) */
    const hb = rez.getBoundingClientRect(); grabDx = hb.left - e.clientX;
    /* a width transition would make the handle trail the pointer */
    if (typeof h.dragging === 'function') h.dragging(true);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp); });
  rez.addEventListener('keydown', e => {
    if (e.key === 'Home' || e.key === 'Enter'){ e.preventDefault(); _splitSaveOf(h, null); splitFit(rez, h); settle(); return; }
    const avail = h.avail();
    const step = Math.max(8, Math.round(avail * 0.02));
    const d = e.key === 'ArrowLeft' ? step : e.key === 'ArrowRight' ? -step : 0;   /* left widens the panel */
    if (!d) return;
    e.preventDefault(); _splitSaveOf(h, splitClamp(splitWidth(h) + d, avail, h)); splitFit(rez, h); settle();
  });
  rez.addEventListener('dblclick', () => { _splitSaveOf(h, null); splitFit(rez, h); settle(); });
  if (!h._splitResize && typeof h.resize === 'function' && typeof window !== 'undefined' && window.addEventListener){
    h._splitResize = true; window.addEventListener('resize', () => { try { h.resize(); } catch (_){} });
  }
}
/* ROOM TO SPREAD (owner, 28 Oct 2026: "this design should be for all pages
   with a list", after People's job title left the grey line for its own
   column; "big screen gets the extra columns, small screen keeps today's
   look"). A list's grey line under its name becomes columns of its own only
   where the list has the room for all of them AND the name its floor
   (SPREAD_NAME_MIN); else today's look, the line under the name. The page
   asks listSpread(seat, cols) at its paint (cols = every column the spread
   shape would draw, {w} fixed or none for the one that takes the rest) and
   marks the table data-spread-seat; ONE observer on the page's scroller
   repaints a page whose answer flipped (a window resized, the panel dragged).
   A spread column is <col data-spread>, never counted in the list's floor
   (jlListMin), so the panel never slides over the list to make room for it.
   jsdom measures nothing: room 0 is today's look. */
const SPREAD_NAME_MIN = 300;   /* owner, 28 Oct 2026: "use the stricter rule" (was 240) */
const SPREAD_PAD = 34;
const _spread = new Map(), _spreadFlip = new Map();
let _spreadLater = null;
let _spreadObs = null;
/* the list's room: the page's scroller, up to the panel's edge where an open panel stands over it
   (a page whose scroller runs under the panel, or a panel slid over the page, both measure true) */
function listSpreadMeasure(){
  if (typeof document === 'undefined') return { room: 0, panel: false };
  const cs = document.getElementById('content-scroll');
  if (!cs || !(cs.clientWidth > 0)) return { room: 0, panel: false };
  const left = cs.getBoundingClientRect().left;
  let right = left + cs.clientWidth, panel = false;
  /* the list's panel, Jambo's fixed one or a page's own beside the list in its grid */
  for (const p of Array.from(document.querySelectorAll('#content .ins-panel'))){
    if (p.classList.contains('is-folded') || p.closest('[hidden]')) continue;
    const b = p.getBoundingClientRect();
    if (b.width > 0 && b.left > left && b.left < right){ right = b.left; panel = true; }
  }
  return { room: Math.max(0, Math.round(right - left - SPREAD_PAD)), panel };
}
const listSpreadRoom = () => listSpreadMeasure().room;
function listSpreadNeed(cols){
  let fixed = 0, flex = 0;
  (cols || []).forEach(c => { const w = Number(c && c.w) || 0; if (w > 0) fixed += w; else flex++; });
  return fixed + Math.max(1, flex) * SPREAD_NAME_MIN;
}
/* A PAGE THAT DRAWS ITS PANEL AGAIN WITH ITS LIST measures, mid-paint, a room with no panel in it; it
   keeps the room it last measured beside the panel instead (never more than it measures now), or the
   two answers would chase each other, one paint after another */
function listSpread(seat, cols, repaint, roomOf){
  const need = listSpreadNeed(cols);
  const prev = _spread.get(seat);
  let room, panel = false;
  if (typeof roomOf === 'function') room = roomOf();
  else { const m = listSpreadMeasure(); room = m.room; panel = m.panel;
    if (!panel && prev && prev.panel && prev.room > 0 && room > 0){ room = Math.min(room, prev.room); panel = true; } }
  const on = room > 0 && room >= need;
  _spread.set(seat, { need, on, repaint, roomOf, room, panel });
  if (!_spreadObs && typeof ResizeObserver === 'function' && typeof document !== 'undefined'){
    const cs = document.getElementById('content-scroll');
    if (cs){
      let queued = false;
      _spreadObs = new ResizeObserver(() => { if (queued) return; queued = true;
        (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f => setTimeout(f, 16)))(() => { queued = false; listSpreadCheck(); }); });
      _spreadObs.observe(cs);
    }
  }
  return on;
}
/* a page still on screen whose answer flipped draws again, in its own way — once per change of room */
function listSpreadCheck(){
  if (typeof document === 'undefined') return;
  _spread.forEach((v, seat) => {
    const t = document.querySelector(`[data-spread-seat="${String(seat).replace(/"/g, '')}"]`);
    if (!t || t.closest('[hidden]') || typeof v.repaint !== 'function') return;
    let room, panel = false;
    if (typeof v.roomOf === 'function') room = v.roomOf();
    else { const m = listSpreadMeasure(); room = m.room; panel = m.panel; }
    if (!(room > 0)) return;
    v.room = room; v.panel = panel;
    if ((room >= v.need) === v.on) return;
    /* a last net: one page never draws again for this more than once in a breath */
    const now = Date.now(), last = _spreadFlip.get(seat) || 0;
    /* inside the breath, asked again once it is over — never dropped */
    if (now - last < 600){ if (!_spreadLater){ _spreadLater = setTimeout(() => { _spreadLater = null; listSpreadCheck(); }, 620 - (now - last)); } return; }
    _spreadFlip.set(seat, now);
    try { v.repaint(); } catch (_){}
  });
}
/* ---- THE LIST'S COLUMNS, ONE RULE ON EVERY LIST (owner, 28 Oct 2026: "there should be a rule that one
   column should never take that much space"; "the side panel overlapping when it is on a laptop";
   "you are not able to adjust the size of your column. This needs to be added"; the ranking and the
   size rules agreed the same day) ----
   listCols(seat, cols, repaint) is asked by a list at its paint. cols in the order drawn, the first the
   NAME (no w); each other column {k, w, rank} — rank says when it steps aside where the room is short,
   the lowest first (none = it always stays), and the grey line's own columns {spread:1} step aside
   first, all together. The answer: the columns drawn, each with its width; the name holds at least
   SPREAD_NAME_MIN and at most LIST_NAME_MAX, the rest of the room shared evenly among the others. A
   reader's own widths (dragged at a head's edge, LIST_COLW_KEY) are kept per list and win, inside each
   column's floor and ceiling; a double press on the edge forgets one. Nothing that steps aside counts
   in the list's floor (jlListMin reads data-floor and data-spread), so at rest the panel never lies
   over a list: the list gives way first. jsdom measures nothing: room 0 draws every column, no spread. */
const LIST_NAME_MAX = 480;
const LIST_COLW_KEY = 'hati.v1.colw.';
const _listFit = new Map();
function listColWidths(seat){
  try { const v = JSON.parse(localStorage.getItem(LIST_COLW_KEY + seat) || 'null'); return v && typeof v === 'object' ? v : {}; } catch (_){ return {}; }
}
function listColWidthSet(seat, k, w){
  const all = listColWidths(seat);
  if (w == null) delete all[k]; else all[k] = Math.round(w);
  try { if (Object.keys(all).length) localStorage.setItem(LIST_COLW_KEY + seat, JSON.stringify(all)); else localStorage.removeItem(LIST_COLW_KEY + seat); } catch (_){}
}
const listColMin = c => c && c.name ? 200 : Math.max(48, Math.round((Number(c && c.w0) || 80) * 0.6));
const listColMax = c => c && c.name ? 640 : Math.round((Number(c && c.w0) || 80) * 3);
function listCols(seat, cols, repaint, quiet){
  const mine = listColWidths(seat);
  const all = (cols || []).map((c, i) => {
    const o = Object.assign({}, c, { name: i === 0 || !!c.name, w0: c.w });
    const u = Number(mine[o.k || (o.name ? 'name' : '')]);
    if (u > 0) o.w = Math.min(listColMax(o), Math.max(listColMin(o), u)), o.mine = true;
    return o;
  });
  const name = all[0];
  if (name && !name.k) name.k = 'name';
  const prev = _listFit.get(seat);
  let { room, panel } = listSpreadMeasure();
  if (!panel && prev && prev.panel && prev.room > 0 && room > 0){ room = Math.min(room, prev.room); panel = true; }
  /* A PAGE THAT DRAWS ITS PANEL AGAIN WITH ITS LIST measures mid-paint a panel not yet in its place; the room
     measured once the page stood still (after the last paint, or on a resize or a drag) is the one used while
     the window keeps its width */
  if (prev && prev.settled > 0 && prev.iw === (typeof innerWidth === 'number' ? innerWidth : 0)){ room = prev.settled; panel = !!prev.settledPanel; }
  /* the room the table really has differs from the scroller's by the page's own padding; learnt after a paint */
  const raw = room;
  if (room > 0) room += (_listOff.get(seat) || 0);
  let shown = all.slice();
  const nameNeed = () => (name && name.mine ? name.w : SPREAD_NAME_MIN);
  const need = () => shown.slice(1).reduce((a, c) => a + (Number(c.w) || 0), 0) + nameNeed();
  if (!(room > 0)) shown = shown.filter(c => !c.spread);
  else {
    if (need() > room) shown = shown.filter(c => !c.spread);
    const order = shown.filter(c => !c.name && Number.isFinite(c.rank)).sort((a, b) => a.rank - b.rank);
    while (need() > room && order.length){ const out = order.shift(); shown = shown.filter(c => c !== out); }
  }
  /* the name's ceiling: past it the room is shared evenly among the others */
  if (room > 0 && name && shown.includes(name)){
    const others = shown.slice(1), fixed = others.reduce((a, c) => a + (Number(c.w) || 0), 0);
    const nameW = name.mine ? name.w : Math.min(LIST_NAME_MAX, Math.max(SPREAD_NAME_MIN, room - fixed));
    if (name.mine || room - fixed > LIST_NAME_MAX){
      name.w = nameW;
      const spare = room - fixed - nameW;
      if (spare > 0 && others.length){ const each = Math.floor(spare / others.length); others.forEach(c => { c.w = (Number(c.w) || 0) + each; }); }
    }
  }
  const keys = shown.map(c => c.k);
  _listFit.set(seat, { room: raw, panel, sig: keys.join('|') + '|' + Math.round((name && name.w) || 0), repaint, cols,
    settled: prev && prev.settled, settledPanel: prev && prev.settledPanel, iw: prev && prev.iw });
  if (quiet) return { cols: shown, keys, has: k => keys.includes(k), spread: shown.some(c => c.spread) };
  listColsWatch();
  listColsLearn(seat, raw);
  return { cols: shown, keys, has: k => keys.includes(k), spread: shown.some(c => c.spread) };
}
const _listOff = new Map(), _listZeroOnce = new Set();
/* after the paint: the table's own room against the one measured; a difference is kept for this list and it
   draws once more — never again for the same difference */
function listColsLearn(seat, raw){
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    const t = document.querySelector(`[data-list-seat="${String(seat).replace(/"/g, '')}"]`);
    const host = t && t.parentElement; if (!host || t.closest('[hidden]')) return;
    const cs = getComputedStyle(host);
    const real = host.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    if (!(real > 0)) return;
    /* drawn before its page was in sight (no room measured): measured now, drawn once more */
    if (!(raw > 0)){
      if (!(listSpreadMeasure().room > 0) || _listZeroOnce.has(seat)) return;
      _listZeroOnce.add(seat);
      const v0 = _listFit.get(seat); if (v0 && typeof v0.repaint === 'function') try { v0.repaint(); } catch (_){}
      return;
    }
    _listZeroOnce.delete(seat);
    /* the difference is the page's own padding, measured against the room as it stands NOW (a panel drawn
       after the list changes the room, not the padding) */
    const fm = listSpreadMeasure(), fresh = fm.room; if (!(fresh > 0)) return;
    const v = _listFit.get(seat); if (!v) return;
    const was = _listOff.get(seat) || 0, off = Math.round(real - fresh);
    if (Math.abs(off - was) > 4) _listOff.set(seat, off);
    const used = raw + was, now = fresh + (_listOff.get(seat) || 0);
    /* the room as the page stands still, kept for its next paint */
    const before = v.settled;
    v.settled = fresh; v.settledPanel = fm.panel; v.iw = typeof innerWidth === 'number' ? innerWidth : 0;
    if (Math.abs(now - used) <= 4 || (before > 0 && Math.abs(before - fresh) <= 4 && Math.abs(off - was) <= 4)) return;
    if (typeof v.repaint === 'function') try { v.repaint(); } catch (_){}
  });
}
let _listFitObs = null;
function listColsWatch(){
  if (_listFitObs || typeof ResizeObserver !== 'function' || typeof document === 'undefined') return;
  const cs = document.getElementById('content-scroll'); if (!cs) return;
  let queued = false;
  _listFitObs = new ResizeObserver(() => { if (queued) return; queued = true;
    (typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (f => setTimeout(f, 16)))(() => { queued = false; listColsCheck(); }); });
  _listFitObs.observe(cs);
}
/* a list still on screen whose columns would change draws again (a window resized, the panel dragged);
   the same breath's net as the spread's: asked again after it, never dropped */
let _listFitLater = null;
const _listFitFlip = new Map();
function listColsCheck(){
  if (typeof document === 'undefined') return;
  _listFit.forEach((v, seat) => {
    const t = document.querySelector(`[data-list-seat="${String(seat).replace(/"/g, '')}"]`);
    if (!t || t.closest('[hidden]') || typeof v.repaint !== 'function') return;
    const m = listSpreadMeasure(); if (!(m.room > 0)) return;
    const was = v.sig, iw = typeof innerWidth === 'number' ? innerWidth : 0;
    const before = Object.assign({}, v, { room: m.room, panel: m.panel, settled: m.room, settledPanel: m.panel, iw });
    _listFit.set(seat, Object.assign({}, before));
    listCols(seat, v.cols, v.repaint, true);
    const now = (_listFit.get(seat) || {}).sig;
    _listFit.set(seat, before);
    if (now === was) return;
    const t0 = Date.now(), last = _listFitFlip.get(seat) || 0;
    if (t0 - last < 600){ if (!_listFitLater) _listFitLater = setTimeout(() => { _listFitLater = null; listColsCheck(); }, 620 - (t0 - last)); return; }
    _listFitFlip.set(seat, t0);
    try { v.repaint(); } catch (_){}
  });
}
/* the drawing: a <col> per column (its key, its width; data-floor on the name, data-spread on one that
   steps aside), and the grip at a head's right edge */
const listColTag = c => `<col data-k="${esc(String(c.k || ''))}"${c.w ? ` style="width:${Math.round(c.w)}px"` : ''}${c.name ? ` data-floor="${SPREAD_NAME_MIN}"` : (c.spread || Number.isFinite(c.rank)) ? ' data-spread' : ''}>`;
const listGripHtml = (seat, k) => `<span class="lc-grip" data-lc-grip="${esc(String(seat))}" data-lc-k="${esc(String(k || ''))}" role="separator" aria-orientation="vertical" title="${esc(typeof i18t === 'function' ? i18t('list_col_grip') : 'Drag to widen; double-press to reset')}"></span>`;
/* THE GRIP: one listener on the document, bound at load; the column under the press is read at press time */
const LIST_GRIP_CSS = '.lc-grip{position:absolute;top:0;right:0;width:9px;height:100%;cursor:col-resize;z-index:2;touch-action:none}'
  + '.lc-grip::after{content:"";position:absolute;top:25%;bottom:25%;right:0;width:1px;background:transparent}'
  + 'th:hover>.lc-grip::after,.lc-grip.is-drag::after{background:var(--rule-strong,#c9c9cf)}'
  + 'th:has(>.lc-grip){position:relative}';
if (typeof document !== 'undefined' && document.head && !document.getElementById('lc-grip-css')){
  const st = document.createElement('style'); st.id = 'lc-grip-css'; st.textContent = LIST_GRIP_CSS; document.head.appendChild(st);
}
if (typeof document !== 'undefined' && document.addEventListener){
  document.addEventListener('pointerdown', e => {
    const g = e.target && e.target.closest && e.target.closest('.lc-grip'); if (!g) return;
    const seat = g.getAttribute('data-lc-grip'), k = g.getAttribute('data-lc-k');
    const tbl = g.closest('table'), col = tbl && tbl.querySelector(`col[data-k="${(window.CSS && CSS.escape) ? CSS.escape(k) : k}"]`);
    const th = g.closest('th'); if (!th) return;
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX, w0 = th.getBoundingClientRect().width;
    const v = _listFit.get(seat), def = v && (v.cols || []).find((c, i) => (c.k || (i === 0 ? 'name' : '')) === k);
    const spec = def ? Object.assign({}, def, { w0: def.w, name: (v.cols || []).indexOf(def) === 0 }) : { w0: w0 };
    let w = w0; g.classList.add('is-drag'); document.body.style.cursor = 'col-resize';
    const move = ev => { w = Math.min(listColMax(spec), Math.max(listColMin(spec), w0 + (ev.clientX - x0))); if (col) col.style.width = Math.round(w) + 'px'; };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      g.classList.remove('is-drag'); document.body.style.cursor = '';
      if (Math.abs(w - w0) >= 2){ listColWidthSet(seat, k, w); if (v && typeof v.repaint === 'function') try { v.repaint(); } catch (_){} } };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  }, true);
  document.addEventListener('dblclick', e => {
    const g = e.target && e.target.closest && e.target.closest('.lc-grip'); if (!g) return;
    e.preventDefault(); e.stopPropagation();
    const seat = g.getAttribute('data-lc-grip'), k = g.getAttribute('data-lc-k');
    listColWidthSet(seat, k, null);
    const v = _listFit.get(seat); if (v && typeof v.repaint === 'function') try { v.repaint(); } catch (_){}
  }, true);
  /* a press on the grip is not a press on the head (a sort) */
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('.lc-grip')){ e.preventDefault(); e.stopPropagation(); } }, true);
}
/* the <col> of a column: its width, and data-spread where it is one of the spread ones */
const listColHtml = c => `<col${c && c.w ? ` style="width:${c.w}px"` : ''}${c && c.spread ? ' data-spread' : ''}>`;
Object.assign(window,{LIST_NAME_MAX,LIST_COLW_KEY,listColWidths,listColWidthSet,listColMin,listColMax,listCols,listColsCheck,listColTag,listGripHtml,SPREAD_NAME_MIN,SPREAD_PAD,listSpreadMeasure,listSpreadRoom,listSpreadNeed,listSpread,listSpreadCheck,listColHtml});
Object.assign(window,{SPLIT_GRIP,SPLIT_OVER_AT,SPLIT_PEEK,splitKeep,splitOver,splitHtml,splitPref,splitSave,splitClamp,splitWidth,splitFit,splitWire});

/* ════ ONE GLIDE FOR LISTS (owner, 22 Oct 2026, the motion plan step 3) ════
   A list drawn again after a press (a card accepted moves to its pile) used
   to jump. Its rows now GLIDE from where they were to where they are: each
   row's place is read before the repaint (by its key) and, after it, the row
   is sent back there with a transform and let go — the browser's own motion
   on the compositor, never a layout property. A row that is new fades in. The
   Board's chart glide (hbGlideTake/hbGlidePlay) is the same idea for SVG
   pieces. Nothing moves for a reader who asked for less motion. */
const LIST_GLIDE_MS = 240;
const LIST_GLIDE_EASE = 'cubic-bezier(.2,.7,.3,1)';   /* --ease */
function listGlideOff(){ try { return typeof matchMedia !== 'function' || matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_){ return true; } }
function listGlideTake(scope, sel, attr){
  if (typeof document === 'undefined' || listGlideOff()) return null;
  const host = typeof scope === 'string' ? document.querySelector(scope) : scope; if (!host) return null;
  const was = new Map();
  host.querySelectorAll(sel).forEach(el => { const k = el.getAttribute(attr); if (k == null || !el.getClientRects().length) return;
    const r = el.getBoundingClientRect(); was.set(k, { x: r.left, y: r.top }); });
  return was.size ? was : null;
}
function listGlidePlay(scope, sel, attr, was){
  if (!was || typeof document === 'undefined') return 0;
  const host = typeof scope === 'string' ? document.querySelector(scope) : scope; if (!host) return 0;
  let n = 0;
  host.querySelectorAll(sel).forEach(el => {
    if (typeof el.animate !== 'function' || !el.getClientRects().length) return;
    const k = el.getAttribute(attr), o = was.get(k), r = el.getBoundingClientRect();
    if (!o){ el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: LIST_GLIDE_MS, easing: LIST_GLIDE_EASE }); n++; return; }
    const dx = Math.round(o.x - r.left), dy = Math.round(o.y - r.top);
    if (!dx && !dy) return;
    el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: LIST_GLIDE_MS, easing: LIST_GLIDE_EASE }); n++;
  });
  return n;
}
/* the one way a repaint is wrapped: read, repaint, glide (a repaint that
   answers later glides when it lands) */
function listGlideAround(scope, sel, attr, paint){
  const was = listGlideTake(scope, sel, attr);
  const out = paint();
  if (out && typeof out.then === 'function') return out.then(v => { listGlidePlay(scope, sel, attr, was); return v; });
  listGlidePlay(scope, sel, attr, was);
  return out;
}
/* A QUESTION ASKED WHILE JAMBO IS STILL ANSWERING WAITS ITS TURN (owner,
   22 Oct 2026: "fix the bug where Jambo drops questions while busy"). Every
   Jambo box that would have taken nothing hands the words here: they leave the
   box, a transient line says they are next, and they are asked through the
   same door, in order, the moment that host is free. Nothing is stored. */
const JB_LATER_TICK = 200;
const _jbLater = [];
function jamboAskLater(q, busy, run){
  const w = String(q == null ? '' : q).trim();
  if (!w || typeof busy !== 'function' || typeof run !== 'function') return false;
  _jbLater.push({ q: w, busy, run });
  if (typeof window.toast === 'function') window.toast(window.i18t ? window.i18t('jb_ask_later') : 'Jambo will answer that next.', 'ok');
  if (_jbLater.length === 1) setTimeout(jamboLaterTick, JB_LATER_TICK);
  return true;
}
function jamboLaterTick(){
  const h = _jbLater[0]; if (!h) return;
  let b = false; try { b = !!h.busy(); } catch (_){ b = false; }
  if (b){ setTimeout(jamboLaterTick, JB_LATER_TICK); return; }
  _jbLater.shift();
  try { h.run(h.q); } catch (_){ /* the host says its own failures */ }
  if (_jbLater.length) setTimeout(jamboLaterTick, JB_LATER_TICK);
}
function jamboLaterCount(){ return _jbLater.length; }
Object.assign(window,{JB_LATER_TICK,jamboAskLater,jamboLaterTick,jamboLaterCount});

Object.assign(window,{LIST_GLIDE_MS,LIST_GLIDE_EASE,listGlideOff,listGlideTake,listGlidePlay,listGlideAround});

/* ════ A PANEL'S FACE CROSSFADES (owner picked "Crossfade", 22 Oct 2026) ════
   When what a panel shows CHANGES (a tab, a face — said by `keyOf`), the
   face going away fades out over the face arriving, which fades in; the
   lit tab's underline glides to the tab pressed. Any other repaint of the
   same face (a typed letter, an answer arriving) is drawn as before. The
   going face is a picture of it laid over the panel — nothing pressable, no
   ids — so the repaint itself stays immediate and every caller that reads
   the new panel straight after still finds it. Nothing moves for a reader
   who asked for less motion; the panel's size is never animated. */
const FACE_SWAP_OUT_MS = 110, FACE_SWAP_IN_MS = 180, FACE_SWAP_INK_MS = 200;
const FACE_SWAP_GHOST_MAX = 4000;   /* a panel bigger than this many elements only fades in */
function faceSwapGhost(host, keep){
  if (host.getElementsByTagName('*').length > FACE_SWAP_GHOST_MAX) return null;
  const r = host.getBoundingClientRect(); if (!r.width || !r.height) return null;
  const g = host.cloneNode(true);
  /* a picture, not a second panel: no ids, names, roles or data- markers, so
     no reader, press or check can find the old face in it */
  for (const n of [g, ...g.querySelectorAll('*')]){
    for (const at of [...n.attributes]) if (at.name === 'id' || at.name === 'name' || at.name === 'role' || at.name === 'for'
      || at.name.startsWith('data-') || (at.name.startsWith('aria-') && at.name !== 'aria-hidden')) n.removeAttribute(at.name);
  }
  if (keep) g.querySelectorAll(':scope > ' + keep).forEach(n => { n.style.visibility = 'hidden'; });
  Object.assign(g.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
    margin: '0', zIndex: '30', pointerEvents: 'none', transition: 'none', background: 'transparent' });
  g.setAttribute('aria-hidden', 'true'); g.setAttribute('inert', ''); g.classList.add('face-ghost');
  document.body.appendChild(g);
  /* the lists the reader had scrolled stay where they were in the picture */
  const a = host.querySelectorAll('*'), b = g.querySelectorAll('*');
  for (let i = 0; i < a.length && i < b.length; i++) if (a[i].scrollTop) b[i].scrollTop = a[i].scrollTop;
  return g;
}
function faceSwap(host, keyOf, paint, o = {}){
  host = typeof host === 'string' ? document.querySelector(host) : host;
  const before = host ? host._faceKey : null;
  let key = null; try { key = keyOf(); } catch (_){ key = null; }
  const go = !!(host && before != null && key != null && key !== before && !listGlideOff() && typeof host.animate === 'function' && host.getClientRects().length);
  const ink0 = go && o.ink ? host.querySelector(o.ink) : null;
  const inkWas = ink0 ? { k: ink0.getAttribute(o.inkKey || 'data-key'), r: ink0.getBoundingClientRect() } : null;
  const ghost = go ? faceSwapGhost(host, o.keep) : null;
  const out = paint();
  if (host){ try { host._faceKey = keyOf(); } catch (_){ host._faceKey = null; } }
  if (!go) return out;
  if (ghost) ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FACE_SWAP_OUT_MS, easing: 'linear', fill: 'forwards' })
    .finished.then(() => ghost.remove(), () => ghost.remove());
  [...host.children].filter(n => !(o.keep && n.matches(o.keep))).forEach(n => {
    if (typeof n.animate === 'function') n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: FACE_SWAP_IN_MS, easing: 'linear' }); });
  /* the underline glides from the tab it was under to the tab pressed */
  const ink1 = inkWas && o.ink ? host.querySelector(o.ink) : null;
  if (ink1 && ink1.getAttribute(o.inkKey || 'data-key') !== inkWas.k && typeof ink1.animate === 'function'){
    const r1 = ink1.getBoundingClientRect(), r0 = inkWas.r;
    if (r1.width && r0.width){
      const dx = Math.round(r0.left - r1.left), sx = Math.max(0.2, Math.min(5, r0.width / r1.width));
      try { ink1.animate([{ transform: `translateX(${dx}px) scaleX(${sx})`, transformOrigin: 'left center' }, { transform: 'none', transformOrigin: 'left center' }],
        { duration: FACE_SWAP_INK_MS, easing: LIST_GLIDE_EASE, pseudoElement: '::after' }); } catch (_){ /* a browser without pseudo-element motion: the line is simply there */ }
    }
  }
  return out;
}
Object.assign(window,{FACE_SWAP_OUT_MS,FACE_SWAP_IN_MS,FACE_SWAP_INK_MS,FACE_SWAP_GHOST_MAX,faceSwapGhost,faceSwap});

/* ---- JAMBO AS A TAB YOU FLIP TO, AND BACK (owner, 19 Oct 2026: "when you
   jump on a page they should be as is, with the panel on the right and an
   entry field for Jambo at the bottom. When you type on the entry field …
   it's essentially another tab for jambo where you can converse with Jambo.
   You then simply click back to go back to … the panel that supports the
   page") ----
   ONE record for whichever right-hand panel is on screen (Home's panel, the
   list panel and Import's, Settings', the Calendar's): `key` names the page
   it belongs to, `on` is the conversation view, `keep` the scrolls of the
   landing panel as it was left. A new key is a new page: the conversation
   view starts closed and fresh (each host keeps its own words and starts
   them again). The view is the panel's; nothing here draws a page.
   ONE TRAIL BUILDER (`jamboTrailHtml`) for every host: its one back first,
   named for where it goes, then where you are — "‹ Redlines  Redlines /
   Jambo" — the same line Home's faces draw (pdTrailHtml). The back is one
   step up; Esc and the bar's ‹ press the same (`jamboTalkBack`). */
/* held across a second load of this file in one page (a stage that loads it
   whole after its region): the record and the hosts' backs are kept */
var _jt = (typeof _jt !== 'undefined' && _jt) || { key: null, on: false, keep: null, fresh: true };
var JT_BACK = (typeof JT_BACK !== 'undefined' && JT_BACK) || {};          // host word -> { back, here } (registered by each host)
/* `here(key)`: the host's page for that key is the one on screen */
function jamboTalkHost(host, back, here){ if (host && typeof back === 'function') JT_BACK[host] = { back, here: typeof here === 'function' ? here : null }; }
/* the page a panel paints for: a new one starts the view closed and fresh;
   true when this call started it */
function jamboTalkLand(key){
  key = String(key || '');
  if (_jt.key === key) return false;
  _jt = { key, on: false, keep: null, fresh: true };
  return true;
}
function jamboTalkKey(){ return _jt.key; }
function jamboTalkShows(key){ return !!_jt.on && (key == null || _jt.key === String(key)); }
/* every scroller of the landing panel that holds an id, read before the view turns */
function jamboScrollKeep(root){
  const out = [];
  try { if (root && root.querySelectorAll) [root, ...root.querySelectorAll('[id]')].forEach(el => { if (el && el.id && el.scrollTop > 0) out.push({ id: el.id, top: el.scrollTop }); }); } catch (_){}
  return out;
}
function jamboScrollPut(keep){
  if (!Array.isArray(keep) || !keep.length || typeof document === 'undefined') return;
  const put = () => keep.forEach(k => { const el = document.getElementById(k.id); if (el) el.scrollTop = k.top; });
  put();
  try { requestAnimationFrame(() => { put(); requestAnimationFrame(put); }); } catch (_){}
}
/* typing turned the panel to Jambo: the landing's scrolls are kept first */
function jamboTalkOpen(key, root){
  if (key != null) jamboTalkLand(key);
  if (_jt.on) return false;
  _jt.keep = jamboScrollKeep(root);
  _jt.on = true; _jt.fresh = false;
  return true;
}
/* the view closed; what the landing's scrolls were, for the host to put back */
function jamboTalkClose(){
  const keep = _jt.keep || [];
  _jt.on = false; _jt.keep = null;
  return keep;
}
/* the conversation view is up on the page in front (the record may name a
   page left behind: then it is not) */
function jamboTalkUp(){
  if (!_jt.on) return false;
  const h = JT_BACK[String(_jt.key || '').split(':')[0]];
  if (!h) return false;
  try { return h.here ? !!h.here(_jt.key) : true; } catch (_){ return false; }
}
/* the one back: the host whose page the record is for turns its panel back */
function jamboTalkBack(){
  if (!jamboTalkUp()) return false;
  JT_BACK[String(_jt.key || '').split(':')[0]].back(); return true;
}
/* t = { back, up, path: [words], attr } — `attr` is the back's data attribute
   (Home's panel answers data-pd-back; every other host data-jt-back) */
function jamboTrailHtml(t, o){
  if (!t) return '';
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const tr = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
  const inHead = !!(o && o.inHead);
  const attr = t.attr || 'data-jt-back';
  const last = t.path.length - 1;
  const where = t.path.map((w, i) => i === last ? `<b>${e(w)}</b>` : e(w)).join('<i aria-hidden="true"> / </i>');
  const tip = tr('pd_trail_back', { to: t.up });
  const tag = inHead ? 'span' : 'div';
  return `<${tag} class="pd-trail${inHead ? ' is-in-head' : ''}${t.attr ? '' : ' jt-trail'}" data-pd-trail="${e(t.back)}"><button type="button" class="pd-back" ${attr}="${e(t.back)}" title="${e(tip)}" aria-label="${e(tip)}"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg>${e(t.up)}</button><span class="pd-trail-w">${where}</span></${tag}>`;
}
/* the trail line every host draws over its conversation */
function jamboTalkTrailHtml(host, landing){
  const jb = (typeof i18t === 'function') ? i18t('pd_tab_copilot') : 'Jambo';
  return jamboTrailHtml({ back: host, up: landing, path: [landing, jb] });
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._jtWired){
  document._jtWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-jt-back]') : null; if (!b) return;
    e.preventDefault(); jamboTalkBack();
  });
}
/* ---- ONE PANEL, TWO FACES — THE DOOR ABOVE THE BOX (owner picked "Door above the box", 28 Oct 2026: "the jambo
   tab is not visible just the overview … once you press enter the screen becomes a jambo screen but right above
   the entry fields, the word overview appear and it becomes the door back to the overview"; REVERSES 26 Oct's "an
   Overview tab, then the Jambo tab") ----
   No panel draws a Jambo tab to press. While the conversation shows, the head names him (lit, nothing to press)
   and ONE line stands right above the box: "‹ <landing>" — the one way back, the host's own back (`attr`: Home's
   data-pd-back, every other host data-jt-back) — and THE BIN at its end. Nothing is drawn on the landing. */
function jamboDoorHtml(o){
  o = o || {};
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const tr = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
  const to = o.to || tr('pd_tab_overview');
  const tip = tr('pd_trail_back', { to });
  return `<div class="jb-door" data-jb-door${o.on ? '' : ' hidden'}><button type="button" class="jb-door-back" ${o.attr || 'data-jt-back'}="${e(o.back || '')}" title="${e(tip)}" aria-label="${e(tip)}"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg><span>${e(to)}</span></button><span class="jb-door-sp"></span>${o.bin || ''}</div>`;
}
/* …AND ITS MIRROR ON THE LANDING (owner picked "\"Jambo ›\" above the box", 28 Oct 2026): once something has been
   said, the same spot above the box reads "Jambo ›" and opens the conversation as it was — free, no question asked;
   nothing is drawn while the conversation is empty. Each host registers how it opens (jamboTalkFwdHost). */
var JT_FWD = (typeof JT_FWD !== 'undefined' && JT_FWD) || {};
function jamboTalkFwdHost(host, open){ if (host && typeof open === 'function') JT_FWD[host] = open; }
function jamboFwdHtml(o){
  o = o || {};
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const tr = k => (typeof i18t === 'function') ? i18t(k) : k;
  const jb = tr('pd_tab_copilot'), tip = tr('jb_door_fwd_tip');
  return `<div class="jb-door jb-door-fwd-line" data-jb-fwd-door${o.on ? '' : ' hidden'}><button type="button" class="jb-door-back jb-door-fwd" data-jb-fwd="${e(o.host || '')}" title="${e(tip)}" aria-label="${e(tip)}"><span>${e(jb)}</span><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-right"/></svg></button></div>`;
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !(typeof window !== 'undefined' && window._jbFwdWired)){
  if (typeof window !== 'undefined') window._jbFwdWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-jb-fwd]') : null; if (!b) return;
    const go = JT_FWD[b.getAttribute('data-jb-fwd')]; if (typeof go !== 'function') return;
    e.preventDefault(); go();
  });
}
/* ---- JAMBO IS THINKING (owner, 28 Oct 2026: "while jambo is thinking there needs to be a sign that something is
   running or thinking so that you do not think the panel has frozen"; then "it should not say jambo is thinking, it
   should just be a different symbol" — owner picked "The SAP way") ----
   ONE builder for every conversation's waiting turn (Home's panel, the lists and Import, Settings, the ✦ window):
   SAP's busy indicator — three dark dots pulsing one after another in his answer's own bubble, NO WORDS on screen;
   a screen reader hears "Jambo is thinking…" (aria-label). It replaces three faint 5px dots that read as a frozen
   panel (WHEN SOMETHING LOADS, SOMETHING MOVES; the Calendar's planner says its own "reading your calendar"). */
function jamboThinkingHtml(){
  const w = (typeof i18t === 'function') ? i18t('jb_thinking') : 'Jambo is thinking…';
  return `<div class="jl-bub jb-thinking" data-jb-thinking role="status" aria-live="polite" aria-busy="true" aria-label="${String(w).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]))}"><span class="jb-dot" aria-hidden="true"></span><span class="jb-dot" aria-hidden="true"></span><span class="jb-dot" aria-hidden="true"></span></div>`;
}
/* the head while the conversation shows: his name, lit, a label — never a second way back */
function jamboTalkLabelHtml(cls){
  return `<span class="pd-tab pd-tab-talk on jb-talk-label${cls ? ' ' + cls : ''}" role="tab" aria-selected="true" aria-current="true">${jamboTalkTabInner()}</span>`;
}
/* shown or hidden in place by a host painted once (the list panel, Settings) */
function jamboDoorSync(root, on){
  const d = root && root.querySelector && root.querySelector('[data-jb-door]');
  if (d) d.hidden = !on;
  /* the landing's "Jambo ›": only off the conversation, and only once something has been said */
  const f = root && root.querySelector && root.querySelector('[data-jb-fwd-door]');
  if (f) f.hidden = !!on || !jamboConvo().length;
  return d;
}
/* THE JAMBO TAB'S INSIDE (owner picked "A Jambo tab", 19 Oct 2026): the
   way back to the conversation on every right-hand panel — a chat glyph over
   the word, drawn the way the panel's other tabs are */
/* HIS OWN GREETING, at the top of a one-window panel (owner, 24 Oct 2026: "bring them back") — the words the Jambo
   tab opened on before anything was asked (int_notebook_welcome), one builder for every host */
function jamboHelloHtml(){
  const w = (typeof i18t === 'function') ? i18t('int_notebook_welcome') : '';
  return w ? `<div class="ig-welcome jb-hello text-[12.5px] text-ink/50 leading-relaxed pt-2" data-jb-hello>${w}</div>` : '';
}
function jamboTalkTabInner(){
  const jb = (typeof i18t === 'function') ? i18t('pd_tab_copilot') : 'Jambo';
  const e = String(jb).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  /* HIS FACE IS ON HIS OWN TAB (owner, 19 Oct 2026: "jambo's emoji or symbol
     is being placed on top of the overview page as opposed to its one tab that
     says Jambo"): the Jambo tab wears his face, Overview a plain mark */
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 20, 'pd-tab-face').replace('<img', '<img data-ink-exempt') : '';
  return `<span class="pd-tab-i"><span class="pd-tab-g" aria-hidden="true">${face || '<svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-chat"/></svg>'}</span></span><span class="pd-tab-w">${e}</span>`;
}
/* the Overview tab's mark on every panel (the grid the room's Overview wore) */
var JAMBO_LAND_GLYPH = '\u25A6\uFE0E';
/* ---- ONE JAMBO CONVERSATION EVERYWHERE (owner, 21 Oct 2026: "Jambo keeps ONE
   conversation across the whole app"; reverses "a new page or contract is
   fresh on Home's, a list's and Settings' panels") ----
   The one record is the side panel's (ai.history, js/ai.js); Home's
   (intel.history) reads and writes it, and Settings' turns are kept in it as
   {role:'st', st}. Every host draws EVERY turn, each with the builder of the
   host it was BORN in (aiMsgHtml · igMsgHTML · stJbTurnHtml), says what it read
   (m.read, stamped the first time any host draws it — right after it is said,
   so it names the page it was asked on), and draws it in ONE place at a time:
   a host that paints takes the turns off the others (jamboTurnsTake). A press
   in a turn drawn away from its own host that only works there travels: it
   opens that host, the conversation up, and presses the same button there
   (jamboForeignPress) — said where the reader looks if it cannot. */
function jamboConvo(){ const A = (typeof window !== 'undefined') ? window.ai : null; return (A && Array.isArray(A.history)) ? A.history : []; }
function jamboBornOf(m){ return !m ? 'ig' : m.role === 'st' ? 'st' : m.host === 'ai' ? 'ai' : 'ig'; }
function jamboReadStamp(){
  const H = jamboConvo();
  /* how far it has stamped rides the function itself (no module-level name: a stage may load this file twice) */
  if (!(jamboReadStamp._n <= H.length)) jamboReadStamp._n = 0;
  for (let i = jamboReadStamp._n; i < H.length; i++){
    const m = H[i];
    if (m && !m.read && (m.role === 'assistant' || m.role === 'st') && !m.err && typeof window.aiReadFrom === 'function'){ try { m.read = window.aiReadFrom(); } catch (_){} }
  }
  jamboReadStamp._n = H.length;
}
function jamboTurnHtml(m, i, H, host){
  const born = jamboBornOf(m);
  let inner = '';
  try {
    inner = born === 'ai' ? (typeof window.aiMsgHtml === 'function' ? window.aiMsgHtml(m, i) : '')
      : born === 'st' ? (typeof window.stJbTurnHtml === 'function' && m.st ? window.stJbTurnHtml(m.st) : '')
      : (typeof window.igMsgHTML === 'function' ? window.igMsgHTML(m, i, H) : '');
  } catch (_){ inner = ''; }
  if (!inner) return '';
  /* the side panel's builder says what it read itself; the others say it here */
  const read = (born !== 'ai' && m.read && m.read.text) ? `<div class="ai-read jb-read is-${born}" data-ai-read>${String(m.read.text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))}</div>` : '';
  return `<div class="jb-turn" data-jb-turn="${i}" data-jb-born="${born}" data-jb-host="${host}">${inner}${read}</div>`;
}
var JB_TURN_HOSTS = { ai: ['#ai-feed', '#jl-feed'], ig: ['#ig-dock [data-jb-turns]'], st: ['#st-jb-feed [data-st-jb-talk]'] };
/* ONE PLACE AT A TIME: the host painting now keeps the turns; every other
   host's drawn turns go (their charts with them), to be drawn again on its turn */
function jamboTurnsTake(keep){
  if (typeof document === 'undefined') return;
  Object.values(JB_TURN_HOSTS).flat().forEach(sel => {
    let el = null; try { el = document.querySelector(sel); } catch (_){ el = null; }
    if (!el || el === keep || (keep && (el.contains(keep) || keep.contains(el)))) return;
    el.querySelectorAll('.jb-turn, .ai-msg, .st-jb-turn').forEach(n => n.remove());
  });
}
/* after a host painted the conversation: the side panel's own presses and
   charts are bound wherever its turns are drawn */
function jamboTurnsAfter(root){
  if (!root) return;
  if (root.querySelector('[data-jb-born="ai"]') && typeof window.aiFeedWire === 'function') try { window.aiFeedWire(root); } catch (_){}
  if (typeof window.aiChartSweep === 'function') try { window.aiChartSweep(); } catch (_){}
  if (typeof window.aiHydrateCharts === 'function'){ const b = jamboConvo().flatMap(m => (m && m.blocks) || []); if (b.length) try { window.aiHydrateCharts(b); } catch (_){} }
}
/* a press in a turn drawn away from its own host: go there and press it there */
var JB_HOST_ROOT = { ig: '#ig-dock', st: '#st-jb-feed' };
function jamboPressKey(el){
  const at = [...el.attributes].filter(a => !/^(class|style|id|title|tabindex|aria-.*|role)$/.test(a.name)).map(a => a.name + '=' + a.value).sort();
  return el.tagName + '|' + at.join('|');
}
function jamboForeignPress(born, i, btn){
  const H = jamboConvo(), m = H[i]; if (!m) return false;
  const key = jamboPressKey(btn);
  const say = () => { if (typeof window.toast === 'function') window.toast(window.i18t ? window.i18t('jb_press_lost') : 'That button could not be found where it was asked.', 'warn'); };
  try {
    if (born === 'ig'){
      if (typeof window.setView === 'function') window.setView('dashboard');
      if (m.paperId && typeof window.pdOpenOnHome === 'function') window.pdOpenOnHome(m.paperId, 'copilot');
      if (typeof window.pdTalkReopen === 'function') window.pdTalkReopen();
    } else if (born === 'st'){
      if (typeof window.setView === 'function') window.setView('team');
      if (typeof window.stTalkReopen === 'function') window.stTalkReopen();
    } else return false;
  } catch (_){ say(); return true; }
  let n = 0;
  const go = () => {
    const root = document.querySelector(JB_HOST_ROOT[born]);
    const turn = root && root.querySelector(`.jb-turn[data-jb-turn="${i}"][data-jb-host="${born}"]`);
    const twin = turn && [...turn.querySelectorAll('button, a, [role="button"], [data-ca-act]')].find(b => jamboPressKey(b) === key);
    if (twin){ try { twin.scrollIntoView({ block: 'nearest' }); } catch (_){} twin.click(); return; }
    if (++n < 30){ setTimeout(go, 100); return; }
    say();
  };
  setTimeout(go, 50);
  return true;
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !document._jbForeignWired){
  document._jbForeignWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    /* popped out (or in the ✦'s window), a host's talk view says where the words are, with the way back */
    const pb = t.closest('[data-jb-popback]');
    if (pb){ e.preventDefault(); if (typeof window.aiConvoBack === 'function') window.aiConvoBack(); else if (typeof window.aiPopBack === 'function') window.aiPopBack();
      if (document.getElementById('st-jb-feed') && typeof window.stTalkReopen === 'function') window.stTalkReopen();
      else if (typeof window.renderIntelDock === 'function') window.renderIntelDock(); return; }
    const turn = t.closest('.jb-turn[data-jb-born]'); if (!turn) return;
    const born = turn.getAttribute('data-jb-born'), host = turn.getAttribute('data-jb-host');
    if (born === host || born === 'ai') return;
    const btn = t.closest('button, a, [role="button"], [data-ca-act]');
    if (!btn || !turn.contains(btn) || btn.disabled) return;
    e.preventDefault(); e.stopPropagation();
    jamboForeignPress(born, Number(turn.getAttribute('data-jb-turn')), btn);
  }, true);
}
/* ---- THE OVERVIEW, THE LEGORA WAY (owner picked it by name, 26 Oct 2026: "Build Jambo's Overview tab The
   Legora Way"; then "we will have an overview tab side panel in each page followed by the jambo tab") ----
   ONE BUILDER for every Overview tab (the list pages' panel, Settings' panel, Home's panel): nothing boxed — one
   head sentence (its first words bold, the rest in the small-text ink), a quiet list of facts (bold name, the link
   at the end of the row, the small reading under it; a reading that needs a look is amber), the source line, then
   "Ask me" and his offers one per line, the verb bold, a call's cost said in grey; the page's working tools
   (`after`: a drop area, Discover, a switch) stand under them, as they are; `before` stands first (Settings' Menu
   door). The greeting is never here: it is the Jambo tab's first words (jamboHelloHtml). Presses are delegated
   once on document and resolve the live run at press time (`slot` names the panel, so two panels never mix). */
/* one store on the window, so a second load of this file (a test's world) shares the listener's runs */
var _jovRuns = (typeof window !== 'undefined' && (window._jovRunsAll || (window._jovRunsAll = {}))) || {};
var _jovE = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
var _jovT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
/* an offer said as one label ("plan my week · 1 Jambo call") → its verb, the rest and the cost */
function jamboAskOf(label){
  const parts = String(label || '').split(/\s+·\s+/);
  const cost = parts.length > 1 && /\b(call|calls|anrop)\b/i.test(parts[parts.length - 1]) ? parts.pop() : '';
  const words = parts.join(' · ').trim();
  const m = /^(\S+)(\s+[\s\S]*)?$/.exec(words) || [words, words, ''];
  const verb = m[1] ? m[1].charAt(0).toUpperCase() + m[1].slice(1) : '';
  return { verb, rest: (m[2] || '').trim(), cost };
}
function jamboOverviewHtml(o, slot){
  o = o || {}; slot = String(slot || 'ov');
  const runs = _jovRuns[slot] = [];
  const reg = fn => { if (typeof fn !== 'function') return -1; runs.push(fn); return runs.length - 1; };
  /* `attr`: a press the page already listens for (Settings' data-st-jb-ask, data-st-side) — its own door, dressed here */
  const lnk = (i, html, title, cls, attr) => attr ? `<button type="button" class="jov-lnk${cls ? ' ' + cls : ''}" ${attr}${title ? ` title="${_jovE(title)}"` : ''}>${html}</button>`
    : i < 0 ? `<span class="jov-lnk is-dead">${html}</span>`
    : `<button type="button" class="jov-lnk${cls ? ' ' + cls : ''}" data-jov="${_jovE(slot)}:${i}"${title ? ` title="${_jovE(title)}"` : ''}>${html}</button>`;
  /* the head's first words bold, as drawn: a sentence handed in plain has its first sentence (or what stands before
     its colon) put in bold; one that brings its own bold is left as it is */
  const boldFirst = h => { h = String(h || ''); if (/<b[\s>]/i.test(h)) return h;
    const m = /^([^<]*?[.:!?])(\s[\s\S]*|)$/.exec(h); return m ? `<b>${m[1]}</b>${m[2] ? ' ' + m[2].trim() : ''}` : h; };
  const head = o.head ? (o.head.html != null ? boldFirst(o.head.html)
    : `<b>${_jovE(o.head.b || '')}</b>${o.head.s ? ' ' + _jovE(o.head.s) : ''}`) : '';
  const facts = (o.facts || []).filter(f => f && (f.k || f.v || f.html));
  const factHtml = facts.map((f, i) => {
    const link = f.link ? lnk(f.attr ? -1 : reg(f.run), _jovE(f.link), f.title, '', f.attr) : '';
    return `<div class="jov-fact${i === facts.length - 1 ? ' is-last' : ''}${f.k ? '' : ' is-line'}">${f.k ? `<b class="jov-k">${_jovE(f.k)}</b>` : ''}${link}`
      + `<span class="jov-v${f.need ? ' is-need' : ''}">${f.html != null ? f.html : _jovE(f.v || '')}</span></div>`;
  }).join('');
  const asks = (o.asks || []).map(a => a && a.label && !a.verb ? Object.assign(jamboAskOf(a.label), { run: a.run, title: a.title, attr: a.attr }) : a).filter(a => a && a.verb);
  const askHtml = asks.length ? `<p class="jov-eyebrow">${_jovE(_jovT('jov_ask_me'))}</p><div class="jov-asks">${asks.map(a =>
    lnk(a.attr ? -1 : reg(a.run), `<b>${_jovE(a.verb)}</b>${a.rest ? ' ' + _jovE(a.rest) : ''}${a.cost ? `<span class="jov-cost">· ${_jovE(a.cost)}</span>` : ''}`, a.title, 'is-ask', a.attr)).join('')}</div>` : '';
  return `<div class="jov" data-jov-slot="${_jovE(slot)}">${o.before || ''}${head ? `<p class="jov-head"${o.headAttr ? ' ' + o.headAttr : ''}>${head}</p>` : ''}`
    + `${factHtml ? `<div class="jov-facts">${factHtml}</div>` : ''}${o.srcHtml ? `<p class="jov-src">${o.srcHtml}</p>` : o.src ? `<p class="jov-src">${_jovE(o.src)}</p>` : ''}${askHtml}`
    + `${o.after ? `<div class="jov-after">${o.after}</div>` : ''}</div>`;
}
/* ---- THE BIN ON EVERY JAMBO TAB (owner, 27 Oct 2026: "in settings there is no trash button to clear history …
   review all the pages") ----
   ONE CONVERSATION, ONE BIN: Home's panel had the only one; every panel's Jambo tab now carries it, drawn here and
   pressed here, and it empties the one conversation (aiConvoClear) wherever it is shown. Drawn while the Jambo tab
   is up and something has been said (`on`); a host whose head is painted once toggles it with jamboBinSync. Home's
   keeps its id (#igd-history-clear) and its own press, which also puts away the paper the conversation opened. */
function jamboBinHtml(on, id){
  const t = _jovT('int_clear_conversation');
  const ic = (typeof window !== 'undefined' && typeof window.icon === 'function') ? window.icon('trash', 'w-3.5 h-3.5') : '\u{1F5D1}';
  return `<button type="button" ${id ? `id="${_jovE(id)}"` : 'data-jb-bin'} class="ui-btn ui-btn-plain ui-btn-sm ui-btn-icon jb-bin" title="${_jovE(t)}" aria-label="${_jovE(t)}"${on ? '' : ' hidden'}>${ic}</button>`;
}
function jamboBinSync(root, talking){
  const b = root && root.querySelector && root.querySelector('[data-jb-bin]');
  if (b) b.hidden = !(talking && jamboConvo().length);
}
function jamboBinPress(){
  if (typeof window.aiConvoClear === 'function') window.aiConvoClear(); else if (window.ai) window.ai.history = [];
  if (typeof window.aiHostsRepaint === 'function') try { window.aiHostsRepaint(); } catch (_){}
  if (typeof window.renderAIFeed === 'function') try { window.renderAIFeed(); } catch (_){}
  if (typeof window.calPlanRepaint === 'function') try { window.calPlanRepaint(); } catch (_){}
  if (typeof document !== 'undefined') document.querySelectorAll('[data-jb-bin]').forEach(b => { b.hidden = true; });
  if (typeof window.toast === 'function') window.toast(_jovT('int_conversation_deleted'), 'ok');
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !(typeof window !== 'undefined' && window._jbBinWired)){
  if (typeof window !== 'undefined') window._jbBinWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-jb-bin]'); if (!b) return;
    e.preventDefault(); e.stopPropagation(); jamboBinPress();
  });
}
/* a page that still says itself as { lines, chips, src, after } is drawn in the same shape, nothing lost: its first
   line is the head, the others quiet lines of the list, its chips the offers */
function jamboOverviewOf(say){
  say = say || {};
  /* a page that names its facts (head · facts · asks) keeps its chips as the offers and its `after` */
  if (say.head || say.facts || say.asks) return Object.assign({ asks: (say.chips || []).filter(c => c && c.label && (typeof c.run === 'function' || c.attr)) }, say,
    { head: say.head || ((say.lines || [])[0] ? { html: typeof say.lines[0] === 'string' ? say.lines[0] : say.lines[0].html } : null), src: say.src === false ? '' : (say.src || '') });
  const lines = (say.lines || []).map(l => typeof l === 'string' ? l : (l && l.html) || '').filter(Boolean);
  return { head: lines.length ? { html: lines[0] } : null, facts: lines.slice(1).map(h => ({ html: h })),
    src: say.src === false ? '' : (say.src || ''), asks: (say.chips || []).filter(c => c && c.label && typeof c.run === 'function'),
    after: say.after || '', before: say.before || '' };
}
if (typeof document !== 'undefined' && typeof document.addEventListener === 'function' && !(typeof window !== 'undefined' && window._jovWired)){
  if (typeof window !== 'undefined') window._jovWired = true;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-jov]'); if (!b) return;
    const v = String(b.getAttribute('data-jov')), at = v.lastIndexOf(':'), slot = v.slice(0, at), i = v.slice(at + 1);
    const fn = (_jovRuns[slot] || [])[Number(i)];
    if (typeof fn === 'function'){ e.preventDefault(); try { fn(); } catch (err){ if (typeof toast === 'function') toast((err && err.message) || String(err), 'err'); } }
  });
}
Object.assign(window,{jamboThinkingHtml,jamboDoorHtml,jamboFwdHtml,jamboTalkFwdHost,JT_FWD,jamboTalkLabelHtml,jamboDoorSync,jamboBinHtml,jamboBinSync,jamboBinPress,jamboOverviewHtml,jamboOverviewOf,jamboAskOf,jamboHelloHtml,jamboConvo,jamboBornOf,jamboReadStamp,jamboTurnHtml,JB_TURN_HOSTS,jamboTurnsTake,jamboTurnsAfter,jamboPressKey,jamboForeignPress,JAMBO_LAND_GLYPH,jamboTalkTabInner,JT_BACK,jamboTalkHost,jamboTalkUp,jamboTalkLand,jamboTalkKey,jamboTalkShows,jamboScrollKeep,jamboScrollPut,jamboTalkOpen,jamboTalkClose,jamboTalkBack,jamboTrailHtml,jamboTalkTrailHtml});

/* ---- JAMBO'S SAY-CARD: HIS WORDS, IMPOSSIBLE TO MISS ----
   (The owner picked "Jambo's card", 26 Oct 2026, of the approver's "In plain
   words" and the party's "The two minutes": "the output should be in a
   highlighted area or card so they are not missed.") Both ran as plain
   paragraphs under a small grey heading, in the same type as the facts around
   them, and read as more of the same. They wear the ONE soft grey card every
   answer of his already wears — 18px corners, 16px inside, no edge — with a
   line on top saying it is Jambo's and what it was read from. It is the only
   card on the panel, so the eye lands on it; the facts around it stay plain
   rows, which is what makes it carry.
   ONE BUILDER, BOTH HOSTS (the clothes follow the builder): the approver's
   panel and the party's panel draw this and nothing of their own. */
function jamboSayCardHtml(o = {}){
  const E = (typeof esc === 'function') ? esc : (s => String(s == null ? '' : s));
  const T = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
  /* whose words, then what they are: "Jambo · In plain words" (the drawing the
     owner picked, 26 Oct 2026) — his name first, so the card says at a glance
     that this is him and not another fact of the record */
  const who = [T('jb_say_who'), o.who].filter(Boolean).join(' · ');
  const when = o.when ? `<span class="jb-say-when">${E(o.when)}</span>` : '';
  const body = o.html || (o.text ? `<p>${E(o.text)}</p>` : '');
  const foot = o.foot ? `<div class="jb-say-f">${o.foot}</div>` : '';
  return `<div class="jb-say"${o.id ? ` id="${E(o.id)}"` : ''}${o.attrs || ''}>
    <div class="jb-say-h"><b><span class="jb-say-i" aria-hidden="true">&#10022;</span>${E(who)}</b>${when}</div>
    <div class="jb-say-b">${body}</div>${foot}</div>`;
}
/* the same card before his words exist: what it will cost, and the one press */
function jamboSayAskHtml(o = {}){
  const E = (typeof esc === 'function') ? esc : (s => String(s == null ? '' : s));
  return `<div class="jb-say is-ask"${o.id ? ` id="${E(o.id)}"` : ''}${o.attrs || ''}>
    <div class="jb-say-b">${o.body || ''}</div>${o.foot ? `<div class="jb-say-f">${o.foot}</div>` : ''}</div>`;
}
Object.assign(window, { jamboSayCardHtml, jamboSayAskHtml });
