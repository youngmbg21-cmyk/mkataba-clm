// HaTi — document designs (the "company standard template" layer).
// ONE module for both sides of the wire (window global in the browser,
// CommonJS on the server), because the list of designs IS the contract
// between the Design step, the org_branding storage and every render
// surface: whichever side validates a designId must agree on the catalogue.
//
// Per DESIGN-contract-designer.md: five fixed designs, no free-form editing.
// The design layer wraps the document body — it NEVER rewrites clause text,
// and it never touches the frozen execution.html (the header/footer render
// as chrome outside the body, exactly as the legacy letterhead always has,
// so sealing and verification are unaffected by construction).
//
// Every style below is INLINE. Not a shortcut: the print sheet (#print-root)
// deliberately carries none of the application's stylesheet, so a design
// that leaned on classes would print as unstyled text (see the reasoning at
// js/views/portal.js printExecutionBlock). One string, correct everywhere.

const BR_ESC = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The one logo transport the product accepts (same regex as the server route).
const BR_LOGO_OK = u => typeof u === 'string' && /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/.test(u);

const DESIGN_LOGO_POSITIONS = ['top-left', 'top-center', 'top-right', 'footer'];

/* The catalogue. Eight designs, fixed — adding a ninth is a product decision,
   not a code path. `defaultLogoPos` is a starting point; the customer's saved
   position always wins. `usesAccent` drives the Design step's colour controls
   (no point offering a colour the design will not show). Each design earns
   its place with a distinct structural device: centred rule, thin line, page
   border, horizontal band, summary box, vertical rule, centred ceremony,
   parties panel — never two flavours of the same skeleton. */
const DOC_DESIGNS = [
  { id: 'classic-letterhead', name: 'Classic Letterhead',
    blurb: 'Centred logo and company name over a double rule — traditional official letterhead.',
    bestFor: 'Established firms, banks, professional services',
    defaultLogoPos: 'top-center', usesAccent: false },
  { id: 'modern-minimal', name: 'Modern Minimal',
    blurb: 'Small logo, generous white space, one thin line in your company colour.',
    bestFor: 'Tech companies, startups, agencies',
    defaultLogoPos: 'top-left', usesAccent: true },
  { id: 'formal-legal', name: 'Formal Legal',
    blurb: 'A ruled border around the page and a formal serif header — counsel-prepared.',
    bestFor: 'Law-firm review, regulated industries, high-value deals',
    defaultLogoPos: 'top-right', usesAccent: false },
  { id: 'bold-corporate', name: 'Bold Corporate',
    blurb: 'A full-width band in your brand colour with the logo inside it.',
    bestFor: 'FMCG, retail, consumer brands',
    defaultLogoPos: 'top-left', usesAccent: true },
  { id: 'compact-executive', name: 'Compact Executive',
    blurb: 'Opens with a contract-at-a-glance box; the logo sits quietly in the footer.',
    bestFor: 'Procurement teams and busy signers',
    defaultLogoPos: 'footer', usesAccent: false },
  { id: 'modern-editorial', name: 'Modern Editorial',
    blurb: 'A slim vertical rule in your colour down the left edge, an asymmetric header and a confident title.',
    bestFor: 'Consultancies, media, design-led firms',
    defaultLogoPos: 'top-left', usesAccent: true },
  { id: 'ceremonial', name: 'Ceremonial',
    blurb: 'Centred crest, spaced capitals and an ornamented rule — treaty-grade formality, deliberately monochrome.',
    bestFor: 'High-value signings, boards, landmark deals',
    defaultLogoPos: 'top-center', usesAccent: false },
  { id: 'facing-parties', name: 'Facing Parties',
    blurb: 'Opens with both parties face-to-face in a tinted panel, the key facts on a line beneath.',
    bestFor: 'Partnerships, distribution and joint work',
    defaultLogoPos: 'top-left', usesAccent: true },
];
const docDesignById = id => DOC_DESIGNS.find(d => d.id === id) || null;

/* ---------- structures ----------

   A DESIGN dresses the document: header, footer, typeface, accent. It never
   touches the words. A STRUCTURE re-lays out the body those words sit in —
   the page architecture rather than the outfit. The two are chosen
   independently, so a customer can put counsel-grade typography on a
   two-column page without one choice dictating the other.

   THE RULE EVERY STRUCTURE OBEYS: clause text, clause numbering and field
   values are never rewritten. A structure may restyle the body and it may ADD
   navigation in front of it (a contents page). It may not reorder, reword or
   renumber what is already there — the negotiation record files changes
   against `data-clause-id` on the heading that opens a clause, and moving that
   heading re-points every change filed against it (see js/clausemodel.js).

   That rule is why four of the five below are pure CSS, keyed off
   `data-doc-structure` on the paper div exactly as the designs key off
   `data-doc-body`. Nothing about the document HTML changes, so the five render
   surfaces, the sealed copy and the PDF all pick the structure up for free.
   `contents-first` is the one that emits anything, and it only PREPENDS. */
const DOC_STRUCTURES = [
  { id: 'standard-flow', name: 'Standard Flow',
    blurb: 'One column, top to bottom — the layout every contract uses today.',
    bestFor: 'A straight replacement for an existing paper form',
    device: 'none' },
  { id: 'margin-numbers', name: 'Margin Numbers',
    blurb: 'Clause headings hang out into a ruled left margin, so the numbers line up in their own column.',
    bestFor: 'Long agreements that get referred back to in disputes',
    device: 'css' },
  { id: 'two-column', name: 'Two Columns',
    blurb: 'The body sets in two narrow columns, the way a policy booklet reads. Usually saves a page.',
    bestFor: 'Standard terms that ride behind every order',
    device: 'css' },
  { id: 'ruled-clauses', name: 'Ruled Clauses',
    blurb: 'A rule above every clause and room around it, so no clause can be skimmed past.',
    bestFor: 'Procurement teams comparing supplier terms',
    device: 'css' },
  { id: 'contents-first', name: 'Contents First',
    blurb: 'A contents page built from the clause headings, in front of the document. It rebuilds itself if a clause is added.',
    bestFor: 'Agreements over about ten clauses',
    device: 'prepend' },
];
const docStructureById = id => DOC_STRUCTURES.find(s => s.id === id) || null;
const DEFAULT_STRUCTURE = 'standard-flow';

/* Pairings the product refuses, and the reason a customer is given. A style
   and a structure can each be sound and still fight each other on the page;
   the Design step greys the structure out and says why rather than letting a
   customer publish something that reads badly. Keyed "<designId>|<structureId>". */
const STRUCTURE_BLOCKED = {
  'ceremonial|two-column': 'Ceremonial spaces its capitals for a full-width line — two narrow columns break the words up.',
  'ceremonial|ruled-clauses': 'Ceremonial is drawn for a signing page; rules between every clause fight its ornament.',
  'compact-executive|two-column': 'Compact Executive is already tightened to fit more on a page — two columns squeeze it past reading size.',
};
const structureBlockedReason = (designId, structureId) =>
  STRUCTURE_BLOCKED[String(designId) + '|' + String(structureId)] || null;

/* ---------- accent colour ---------- */

/* Keep the accent readable as a rule/band on white paper: a colour lighter
   than the threshold is darkened proportionally, hue untouched. Pure, so the
   node test suite can pin the behaviour without a canvas. */
function accentLegible(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return null;
  let [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16));
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;   // relative-ish luminance, fine at this precision
  if (lum > 0.62) {
    const k = 0.62 / lum;
    r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
  }
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* The dominant saturated colour in an RGBA pixel array — white, black and
   greys ignored, hues bucketed so anti-aliasing noise cannot outvote the
   brand colour. Returns '#rrggbb' or null (a monochrome logo has no accent
   to offer, and that is an honest answer). Pure for the same reason. */
function pickAccentFromPixels(rgba) {
  const buckets = new Map();  // hue bucket → {n, r, g, b}
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2], a = rgba[i + 3];
    if (a < 128) continue;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const lum = (max + min) / 510;
    if (lum < 0.12 || lum > 0.92) continue;            // near-black / near-white
    const sat = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
    if (sat < 0.25) continue;                          // greys
    let h = 0;
    if (max === r) h = ((g - b) / (max - min)) % 6;
    else if (max === g) h = (b - r) / (max - min) + 2;
    else h = (r - g) / (max - min) + 4;
    const bucket = Math.round(((h * 60) + 360) % 360 / 20);
    const cur = buckets.get(bucket) || { n: 0, r: 0, g: 0, b: 0 };
    cur.n++; cur.r += r; cur.g += g; cur.b += b;
    buckets.set(bucket, cur);
  }
  let best = null;
  for (const v of buckets.values()) if (!best || v.n > best.n) best = v;
  if (!best || best.n < 8) return null;                // too few pixels to call it a brand colour
  const hex = '#' + [best.r, best.g, best.b].map(t => Math.round(t / best.n).toString(16).padStart(2, '0')).join('');
  return accentLegible(hex);
}

/* Browser-side: logo data URL → accent hex (or null). Runs once at upload
   time — the result is STORED, never recomputed per render. */
function extractAccentFromLogo(dataUrl) {
  return new Promise(resolve => {
    if (typeof document === 'undefined' || !BR_LOGO_OK(dataUrl)) return resolve(null);
    const img = new Image();
    img.onload = () => {
      try {
        const w = 48, h = 48;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
        const cx = cv.getContext('2d');
        cx.drawImage(img, 0, 0, w, h);
        resolve(pickAccentFromPixels(cx.getImageData(0, 0, w, h).data));
      } catch (e) { resolve(null); }   // tainted canvas / bad image — no accent, not an error
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/* ---------- the branding record ---------- */

/* Coerce whatever arrives (org route, snapshot, static-mode settings) into
   one honest shape. Unknown designId → null designId: the renderers then
   fall back to the legacy letterhead rather than guessing a design. */
function normalizeDesignBranding(b) {
  if (!b || typeof b !== 'object') return null;
  const design = docDesignById(b.designId);
  /* NULL, not 'standard-flow', when the record names no structure or names one
     this build does not know. Two reasons, both load-bearing:
       · null emits no attribute and no transform, so a document with no
         structure renders byte-for-byte as it did before this feature — the
         same promise designId already makes;
       · brCompact() below carries only non-null snapshot fields over the org
         default. Defaulting here would make every pre-structure snapshot claim
         "standard flow" and silently override a company default of, say, Two
         Columns on every draft shared before today. */
  const structure = docStructureById(b.structureId);
  return {
    designId: design ? design.id : null,
    structureId: structure ? structure.id : null,
    logoUrl: BR_LOGO_OK(b.logoUrl) ? b.logoUrl : null,
    companyName: String(b.companyName || '').slice(0, 200),
    registrationNumber: String(b.registrationNumber || '').slice(0, 100),
    address: String(b.address || '').slice(0, 500),
    footerText: String(b.footerText != null ? b.footerText : (b.defaultFooterText || '')).slice(0, 500),
    logoPosition: DESIGN_LOGO_POSITIONS.includes(b.logoPosition) ? b.logoPosition
      : (design ? design.defaultLogoPos : 'top-left'),
    accentColor: accentLegible(b.accentColor) || null,
    accentSource: b.accentSource === 'manual' ? 'manual' : 'logo',
  };
}

/* Which look does THIS document wear?  Sealed documents froze their snapshot
   at execution (finalizeExecution stamps it); a snapshot that carries a
   designId was chosen deliberately and wins; anything else follows the
   company default live — so setting the default dresses every draft in the
   portfolio without touching what was already executed. Returns null when
   there is nothing to dress with (no design chosen anywhere), which is the
   signal to keep the legacy letterhead behaviour byte-for-byte. */
function resolveDocBranding(c) {
  const snap = c && c.branding ? normalizeDesignBranding(c.branding) : null;
  /* Sealed = frozen. The snapshot on the record is the whole answer — a
     sealed document must never pick up a later change of company default,
     and one sealed before any design existed stays exactly as it was. */
  if (c && (c.execution || c.status === 'Signed')) return snap && snap.designId ? snap : null;
  if (snap && snap.designId) {
    // deliberate per-document choice — but identity gaps fill from the org default
    const org = typeof window !== 'undefined' && window.ORG_BRANDING ? window.ORG_BRANDING : null;
    return org ? { ...org, ...brCompact(snap) } : snap;
  }
  const org = typeof window !== 'undefined' && window.ORG_BRANDING ? window.ORG_BRANDING : null;
  if (org && org.designId) return snap ? { ...org, ...brCompactIdentity(snap) } : org;
  return null;
}
// snapshot fields that are actually set (so org defaults can fill the rest)
function brCompact(b) {
  const o = {};
  for (const k of Object.keys(b)) if (b[k] !== null && b[k] !== '') o[k] = b[k];
  return o;
}
// identity only — an old snapshot's company details, never its (absent) design
function brCompactIdentity(b) {
  const o = {};
  for (const k of ['logoUrl', 'companyName', 'registrationNumber', 'address', 'footerText'])
    if (b[k]) o[k] = b[k];
  return o;
}

/* The snapshot to stamp onto a contract (share payloads, finalizeExecution).
   Undefined when no design is in play — callers pass it through `|| undefined`
   so pre-design payloads keep their exact current shape. */
function orgBrandingSnapshot() {
  const org = typeof window !== 'undefined' && window.ORG_BRANDING ? window.ORG_BRANDING : null;
  return org && org.designId ? { ...org } : null;
}

/* ---------- rendering ---------- */

const BR_SERIF = "Georgia,'Times New Roman',Times,serif";
const BR_SANS = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const BR_INK = '#212b30';
const BR_SOFT = '#6b7780';
const BR_RULE = '#37474f';
const brAccent = b => b.accentColor || BR_RULE;

function brLogoImg(b, maxH) {
  if (!b.logoUrl) return '';
  return `<img src="${b.logoUrl}" alt="" style="max-height:${maxH}px;max-width:170px;display:inline-block;vertical-align:middle">`;
}
const brIdentityLine = b => [b.registrationNumber, b.address].filter(Boolean).map(BR_ESC).join(' · ');

/* Contract-at-a-glance facts for Compact Executive. Reads only what the
   contract already states; an empty portfolio of facts renders nothing —
   an empty box would be a claim that there was nothing worth knowing. */
function brGlanceFacts(c) {
  if (!c) return [];
  const facts = [];
  const money = typeof window !== 'undefined' && window.isMonetary && window.fmtMoney;
  if (c.counterparty) facts.push(['Counterparty', c.counterparty]);
  if (money && isMonetary(c) && c.value) facts.push(['Contract value', fmtMoney(c.value)]);
  const eff = c.effectiveDate || (c.fields && c.fields.effDate);
  if (eff) facts.push(['Effective date', String(eff)]);
  if (c.expiry) facts.push(['Expires', String(c.expiry)]);
  return facts.slice(0, 4);
}

/* The header chrome for a design. `opts.bleed` lets the Bold Corporate band
   run flush to the paper edge: each surface passes its own padding, because
   the screen paper (30/36) and the print sheet (32/24) are padded differently
   and a band that overshoots prints clipped. No bleed → a rounded band, still
   correct. */
function docDesignHeaderHtml(b, c, opts = {}) {
  const d = docDesignById(b.designId);
  if (!d) return '';
  const pos = b.logoPosition;
  const logoTop = pos !== 'footer' ? brLogoImg(b, d.id === 'classic-letterhead' ? 54 : 40) : '';
  const name = BR_ESC(b.companyName);
  const ident = brIdentityLine(b);

  if (d.id === 'classic-letterhead') {
    const align = pos === 'top-left' ? 'left' : pos === 'top-right' ? 'right' : 'center';
    return `<div data-doc-design="classic-letterhead" style="text-align:${align};padding-bottom:12px;margin-bottom:22px;border-bottom:4px double ${BR_RULE};font-family:${BR_SERIF};color:${BR_INK}">
      ${logoTop ? `<div style="margin-bottom:7px">${logoTop}</div>` : ''}
      ${name ? `<div style="font-size:17px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">${name}</div>` : ''}
      ${ident ? `<div style="font-size:10px;color:${BR_SOFT};letter-spacing:.05em;margin-top:2px">${ident}</div>` : ''}
    </div>`;
  }

  if (d.id === 'modern-minimal') {
    const row = pos === 'top-right'
      ? `<span style="flex:1;min-width:0"></span>${logoTop}`
      : pos === 'top-center'
        ? `<span style="flex:1"></span>${logoTop}<span style="flex:1"></span>`
        : `${logoTop}<span style="flex:1;min-width:0"></span>`;
    return `<div data-doc-design="modern-minimal" style="margin-bottom:26px;font-family:${BR_SANS};color:${BR_INK}">
      <div style="display:flex;align-items:flex-start;gap:14px">
        ${row}
        <div style="text-align:right;flex:none">
          ${name ? `<div style="font-size:12.5px;font-weight:600">${name}</div>` : ''}
          ${ident ? `<div style="font-size:9.5px;color:${BR_SOFT};line-height:1.5">${ident}</div>` : ''}
        </div>
      </div>
      <div style="width:46px;height:3px;background:${brAccent(b)};border-radius:2px;margin-top:14px"></div>
    </div>`;
  }

  if (d.id === 'formal-legal') {
    const left = pos === 'top-left' ? logoTop
      : `<span style="font-size:9.5px;letter-spacing:.22em;color:${BR_SOFT};text-transform:uppercase">${name || '&nbsp;'}</span>`;
    const right = pos === 'top-left'
      ? `<span style="font-size:9.5px;letter-spacing:.22em;color:${BR_SOFT};text-transform:uppercase">${name || '&nbsp;'}</span>`
      : (logoTop || `<span style="font-size:9.5px;letter-spacing:.22em;color:${BR_SOFT}">&nbsp;</span>`);
    const centered = pos === 'top-center' && logoTop ? `<div style="text-align:center;margin-bottom:8px">${logoTop}</div>` : '';
    return `<div data-doc-design="formal-legal" style="margin-bottom:20px;font-family:${BR_SERIF};color:${BR_INK}">
      ${centered}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:9px;border-bottom:1px solid ${BR_RULE}">
        ${pos === 'top-center' ? `<span style="font-size:9.5px;letter-spacing:.22em;color:${BR_SOFT};text-transform:uppercase">${name || '&nbsp;'}</span><span style="font-size:9.5px;letter-spacing:.22em;color:${BR_SOFT}">${ident || '&nbsp;'}</span>` : `${left}${right}`}
      </div>
      ${pos !== 'top-center' && ident ? `<div style="font-size:9.5px;color:${BR_SOFT};margin-top:4px;letter-spacing:.04em">${ident}</div>` : ''}
    </div>`;
  }

  if (d.id === 'bold-corporate') {
    const bleedX = Number(opts.bleedX) || 0, bleedY = Number(opts.bleedY) || 0;
    const margin = bleedX || bleedY ? `margin:-${bleedY}px -${bleedX}px 24px;` : 'margin:0 0 24px;border-radius:6px;';
    const pad = bleedX || bleedY ? `padding:18px ${bleedX}px 16px;` : 'padding:18px 22px 16px;';
    const chip = logoTop ? `<span style="display:inline-block;background:#fff;border-radius:5px;padding:5px 8px;line-height:0">${logoTop}</span>` : '';
    const justify = pos === 'top-right' ? 'row-reverse' : 'row';
    return `<div data-doc-design="bold-corporate" style="${margin}${pad}background:${brAccent(b)};color:#fff;font-family:${BR_SANS}">
      <div style="display:flex;flex-direction:${justify};align-items:center;gap:14px;${pos === 'top-center' ? 'justify-content:center;text-align:center;' : ''}">
        ${chip}
        <div style="min-width:0">
          ${name ? `<div style="font-size:15px;font-weight:800;letter-spacing:.01em">${name}</div>` : ''}
          ${ident ? `<div style="font-size:9.5px;opacity:.85;margin-top:1px">${ident}</div>` : ''}
        </div>
      </div>
    </div>`;
  }

  if (d.id === 'compact-executive') {
    const facts = brGlanceFacts(c);
    const factsBox = facts.length ? `<div style="display:grid;grid-template-columns:repeat(${Math.min(facts.length, 4)},1fr);gap:8px;background:#eef1f0;border-radius:6px;padding:10px 14px;margin-top:12px">
      ${facts.map(([k, v]) => `<div style="min-width:0"><div style="font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;color:${BR_SOFT}">${BR_ESC(k)}</div><div style="font-size:11.5px;font-weight:700;color:${BR_INK};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${BR_ESC(v)}</div></div>`).join('')}
    </div>` : '';
    const headLogo = pos !== 'footer' ? brLogoImg(b, 30) : '';
    return `<div data-doc-design="compact-executive" style="margin-bottom:20px;font-family:${BR_SANS};color:${BR_INK}">
      <div style="display:flex;align-items:center;gap:12px;${pos === 'top-right' ? 'flex-direction:row-reverse;' : ''}${pos === 'top-center' ? 'justify-content:center;' : ''}">
        ${headLogo}
        <div style="min-width:0;${pos === 'top-center' ? 'text-align:center;' : ''}">
          ${name ? `<div style="font-size:12px;font-weight:700">${name}</div>` : ''}
          ${ident ? `<div style="font-size:9px;color:${BR_SOFT}">${ident}</div>` : ''}
        </div>
      </div>
      ${factsBox}
    </div>`;
  }

  if (d.id === 'modern-editorial') {
    /* The vertical rule is the paper's (docDesignPaperStyle); the header is an
       asymmetric two-sider: identity one side, a quiet document tag the other. */
    const tag = `<span style="font-size:9px;letter-spacing:.22em;color:${brAccent(b)};text-transform:uppercase;border:1px solid ${BR_SOFT}40;border-radius:2px;padding:4px 10px;white-space:nowrap;align-self:flex-start">Commercial Agreement</span>`;
    const identity = `<div style="min-width:0">
        ${name ? `<div style="font-size:14.5px;font-weight:700;letter-spacing:.01em">${name}</div>` : ''}
        ${ident ? `<div style="font-size:9.5px;color:${BR_SOFT};margin-top:2px">${ident}</div>` : ''}
      </div>`;
    const centered = pos === 'top-center' && logoTop ? `<div style="text-align:center;margin-bottom:10px">${logoTop}</div>` : '';
    const row = pos === 'top-right'
      ? `${identity}<span style="flex:1"></span>${logoTop}${logoTop ? '' : tag}`
      : `${logoTop ? logoTop : ''}${identity}<span style="flex:1"></span>${tag}`;
    return `<div data-doc-design="modern-editorial" style="margin-bottom:22px;font-family:${BR_SANS};color:${BR_INK}">
      ${centered}
      <div style="display:flex;align-items:flex-start;gap:14px;padding-bottom:16px;border-bottom:1px solid #e2e8ea">${row}</div>
    </div>`;
  }

  if (d.id === 'ceremonial') {
    /* Centred ceremony. The crest position holds the logo when there is one
       and a monogram ring when there is not — an empty circle would read as a
       missing image, and a missing image on a treaty is a wound. */
    const initial = (b.companyName || '').trim().charAt(0).toUpperCase();
    const crest = logoTop
      ? `<div style="margin:2px 0 12px">${logoTop}</div>`
      : initial ? `<div style="width:46px;height:46px;border:1.5px solid ${BR_INK};border-radius:50%;margin:2px auto 12px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700">${BR_ESC(initial)}</div>` : '';
    const between = c && c.counterparty && b.companyName
      ? `<div style="font-size:11px;letter-spacing:.06em;color:${BR_SOFT};margin-top:16px;line-height:2">entered into between<br>
          <b style="color:${BR_INK};letter-spacing:.1em;text-transform:uppercase">${name}</b><br>and<br>
          <b style="color:${BR_INK};letter-spacing:.1em;text-transform:uppercase">${BR_ESC(c.counterparty)}</b></div>` : '';
    return `<div data-doc-design="ceremonial" style="text-align:center;margin-bottom:22px;font-family:${BR_SERIF};color:${BR_INK}">
      ${crest}
      ${name ? `<div style="font-size:15px;font-weight:700;letter-spacing:.26em;text-transform:uppercase">${name}</div>` : ''}
      ${ident ? `<div style="font-size:9.5px;letter-spacing:.14em;color:${BR_SOFT};margin-top:5px;text-transform:uppercase">${ident}</div>` : ''}
      <div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-top:14px">
        <span style="height:1px;width:150px;background:${BR_INK}"></span>
        <span style="width:7px;height:7px;border:1px solid ${BR_INK};transform:rotate(45deg)"></span>
        <span style="height:1px;width:150px;background:${BR_INK}"></span>
      </div>
      ${between}
    </div>`;
  }

  if (d.id === 'facing-parties') {
    /* Both parties face-to-face — the one header where the counterparty is an
       equal on page one. Facts on the meta line follow the compact-executive
       rule: only what the contract actually states, nothing invented. */
    const facts = [];
    if (c) {
      const eff = c.effectiveDate || (c.fields && c.fields.effDate);
      if (eff) facts.push(['Effective', String(eff)]);
      if (c.id) facts.push(['Ref', String(c.id)]);
      if (c.expiry) facts.push(['Expires', String(c.expiry)]);
    }
    const metaLine = facts.length ? `<div style="display:flex;gap:22px;margin-top:12px;padding-top:10px;border-top:1px dashed #cfd8dc;font-size:9.5px;color:${BR_SOFT}">
        ${facts.map(([k, v]) => `<span>${BR_ESC(k)} <b style="color:${brAccent(b)}">${BR_ESC(v)}</b></span>`).join('')}
      </div>` : '';
    const cp = c && c.counterparty ? BR_ESC(c.counterparty) : '';
    const above = logoTop ? `<div style="margin-bottom:10px;${pos === 'top-right' ? 'text-align:right' : pos === 'top-center' ? 'text-align:center' : ''}">${logoTop}</div>` : '';
    return `<div data-doc-design="facing-parties" style="margin-bottom:22px;font-family:${BR_SANS};color:${BR_INK}">
      ${above}
      <div style="background:#f1f4f5;border:1px solid #e2e8ea;border-left:4px solid ${brAccent(b)};border-radius:6px;padding:15px 19px">
        <div style="font-size:8.5px;letter-spacing:.2em;color:${BR_SOFT};text-transform:uppercase;margin-bottom:10px">Agreement between</div>
        <div style="display:flex;gap:18px;align-items:center">
          <div style="flex:1;min-width:0">
            ${name ? `<div style="font-size:13.5px;font-weight:700">${name}</div>` : ''}
            ${ident ? `<div style="font-size:9.5px;color:${BR_SOFT};margin-top:3px;line-height:1.5">${ident}</div>` : ''}
          </div>
          ${cp ? `<div style="flex:none;width:30px;height:30px;border-radius:50%;background:${brAccent(b)};color:#fff;display:flex;align-items:center;justify-content:center;font-size:8.5px;letter-spacing:.05em;font-weight:700">AND</div>
          <div style="flex:1;min-width:0;text-align:right">
            <div style="font-size:13.5px;font-weight:700">${cp}</div>
            <div style="font-size:9.5px;color:${BR_SOFT};margin-top:3px">as per the signature page</div>
          </div>` : ''}
        </div>
        ${metaLine}
      </div>
    </div>`;
  }
  return '';
}

function docDesignFooterHtml(b, c) {
  const d = docDesignById(b.designId);
  if (!d) return '';
  const foot = BR_ESC(b.footerText);
  const logoFoot = b.logoPosition === 'footer' ? brLogoImg(b, 24) : '';
  if (!foot && !logoFoot && !b.companyName) return '';
  const line = [b.companyName ? BR_ESC(b.companyName) : '', foot].filter(Boolean).join(' · ');

  if (d.id === 'classic-letterhead')
    return `<div style="margin-top:26px;padding-top:10px;border-top:1px solid ${BR_RULE};text-align:center;font-family:${BR_SERIF};font-size:9.5px;color:${BR_SOFT}">${logoFoot ? logoFoot + '<br>' : ''}${line}</div>`;
  if (d.id === 'formal-legal')
    return `<div style="margin-top:26px;padding-top:9px;border-top:1px solid ${BR_RULE};text-align:center;font-family:${BR_SERIF};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:${BR_SOFT}">${logoFoot ? logoFoot + '<br>' : ''}${line}</div>`;
  if (d.id === 'bold-corporate')
    return `<div style="margin-top:26px;padding-top:10px;border-top:3px solid ${brAccent(b)};display:flex;align-items:center;gap:10px;font-family:${BR_SANS};font-size:9.5px;color:${BR_SOFT}">${logoFoot}<span style="flex:1">${line}</span></div>`;
  if (d.id === 'ceremonial')
    return `<div style="margin-top:30px;text-align:center;font-family:${BR_SERIF};font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:${BR_SOFT}"><span style="display:block;width:150px;height:1px;background:${BR_INK};margin:0 auto 10px"></span>${logoFoot ? logoFoot + '<br>' : ''}${line}</div>`;
  if (d.id === 'facing-parties')
    return `<div style="margin-top:26px;padding-top:9px;border-top:2px solid ${brAccent(b)};display:flex;align-items:center;gap:10px;font-family:${BR_SANS};font-size:9px;color:${BR_SOFT}">${logoFoot}<span style="flex:1">${line}</span></div>`;
  // modern-minimal + compact-executive + modern-editorial: quiet left-aligned rule
  return `<div style="margin-top:26px;padding-top:9px;border-top:1px solid #d5dbd9;display:flex;align-items:center;gap:10px;font-family:${BR_SANS};font-size:9px;color:${BR_SOFT}">${logoFoot}<span style="flex:1">${line}</span></div>`;
}

/* Extra inline CSS the paper div itself needs. Formal Legal asks for the
   ruled page border; every design pins its accent onto a custom property so
   the body-typography rules (index.html, [data-doc-body=…]) can colour
   headings without a per-org stylesheet. Appended to the surface's existing
   style attribute, so it must end with a semicolon. */
function docDesignPaperStyle(b) {
  if (!b || !b.designId) return '';
  const accent = `--doc-design-accent:${brAccent(b)};`;
  if (b.designId === 'formal-legal')
    return `${accent}border:1px solid ${BR_RULE};box-shadow:inset 0 0 0 3px var(--color-doc-surface),inset 0 0 0 4px ${BR_RULE};`;
  // Modern Editorial's device is the paper's own left edge, in the accent.
  if (b.designId === 'modern-editorial')
    return `${accent}border-left:4px solid ${brAccent(b)};`;
  return accent;
}

/* The attributes the paper div carries, for BOTH choices:

     data-doc-body="<designId>"        typeface, heading treatment, justification
     data-doc-structure="<structureId>" the page architecture

   The stylesheet in index.html restyles .doc-surface underneath each. An
   attribute rather than inline styles because the body's own classes
   (.doc-surface, .hati-doc) must be out-specified in print, where --font-doc
   is enforced with !important.

   Both attributes ride on one function on purpose: every surface that draws a
   contract already calls this once for the paper div, so a structure reaches
   the screen, the portal, the print sheet, the PDF and the sealed copy without
   five separate edits and the drift that invites. No structure, no attribute,
   no CSS — the document renders exactly as it did before the feature. */
function docDesignPaperAttr(b) {
  if (!b) return '';
  const design = b.designId ? ` data-doc-body="${b.designId}"` : '';
  const structure = b.structureId && b.structureId !== DEFAULT_STRUCTURE && docStructureById(b.structureId)
    ? ` data-doc-structure="${b.structureId}"` : '';
  return design + structure;
}

/* The one structure that emits markup rather than restyling. Everything else
   in the catalogue is CSS, so this function returns the body untouched for
   them — and untouched means the SAME STRING, not an equivalent one, so a
   sealed document's bytes cannot drift.

   Contents First PREPENDS a contents page. It never reorders, rewords or
   renumbers the body, which is what keeps `data-clause-id` — and every
   negotiation change filed against it — pointing where it always did.

   The headings are read with a boundary regex rather than a DOM parse because
   this module is dual-host: the server renders the executed copy in Node,
   where there is no document. The input is always our own sanitised fragment
   (js/richdoc.js allowlist) or templateFormDocHtml output, so the markup is
   well-formed and the tags are known. */
const BR_HEADING_RE = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
/* Tags out, entities LEFT ALONE. The heading's inner HTML arrives already
   escaped — it came through the sanitiser or through templateFormDocHtml,
   both of which escape text before they emit it. Running BR_ESC over it again
   would double-encode, so "Fees &amp; Charges" would reach the contents page
   as "Fees &amp;amp; Charges" and a customer would read the ampersand's source
   code. Stripping the markup leaves escaped text, which is exactly what is
   safe to interpolate. */
const brStripTags = s => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

function docStructureBodyHtml(b, bodyHtml) {
  const html = bodyHtml == null ? '' : String(bodyHtml);
  if (!b || b.structureId !== 'contents-first') return html;

  const heads = [];
  let m;
  BR_HEADING_RE.lastIndex = 0;
  while ((m = BR_HEADING_RE.exec(html)) !== null) {
    const label = brStripTags(m[2]);
    if (label) heads.push({ rank: Number(m[1]), label });
  }
  /* The document's own title is the first heading and is not a destination.
     Drop it only when it really is a lone top-rank heading at the front. */
  if (heads.length && heads[0].rank === 1) heads.shift();
  /* A contents page for two clauses is furniture, not navigation. Below the
     threshold the structure quietly does nothing rather than adding a page
     that helps no one. */
  if (heads.length < 3) return html;

  const rows = heads.map(h => `<li style="display:flex;align-items:baseline;gap:.5em;margin:0 0 .45em;${
    h.rank > 2 ? 'padding-left:1.4em;' : ''}">
      <span style="min-width:0">${h.label}</span>
      <span style="flex:1;border-bottom:1px dotted var(--color-doc-rule,#c9ccd1);height:.6em"></span>
    </li>`).join('');

  return `<nav data-doc-contents="1" style="page-break-after:always;break-after:page;margin:0 0 1.6em">
    <div style="font-size:.82em;font-weight:700;letter-spacing:.13em;text-transform:uppercase;
      color:var(--doc-design-accent,var(--color-doc-muted,#4a4f54));padding-bottom:.35em;
      margin-bottom:.7em;border-bottom:1px solid var(--color-doc-rule,#c9ccd1)">Contents</div>
    <ol style="list-style:none;margin:0;padding:0">${rows}</ol>
  </nav>${html}`;
}

/* The branded cover page for a raw upload whose layout is baked in (print
   only — DESIGN §5's "stapled in front"). The design header runs above it,
   so this block is the title block plus the honesty note. */
function docDesignCoverPageHtml(b, c) {
  const d = docDesignById(b && b.designId);
  if (!d || !c) return '';
  const serif = d.id === 'classic-letterhead' || d.id === 'formal-legal';
  const font = serif ? BR_SERIF : BR_SANS;
  const u = c.upload || {};
  const between = [b.companyName, c.counterparty].filter(Boolean).map(BR_ESC).join(' &amp; ');
  return `<div data-doc-design-cover="1" style="page-break-after:always;font-family:${font};color:${BR_INK};padding-top:60px;text-align:center">
    <div style="font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:${BR_SOFT};margin-bottom:18px">Contract record</div>
    <div style="font-size:24px;font-weight:700;line-height:1.3;max-width:540px;margin:0 auto">${BR_ESC(c.name || 'Contract')}</div>
    ${between ? `<div style="font-size:12px;color:${BR_SOFT};margin-top:10px">between ${between}</div>` : ''}
    <div style="width:52px;height:3px;background:${brAccent(b)};margin:26px auto"></div>
    <table style="margin:0 auto;border-collapse:collapse;font-size:11px;text-align:left">
      ${c.id ? `<tr><td style="padding:3px 14px 3px 0;color:${BR_SOFT}">Reference</td><td style="font-weight:600">${BR_ESC(c.id)}</td></tr>` : ''}
      ${u.fileName ? `<tr><td style="padding:3px 14px 3px 0;color:${BR_SOFT}">Original file</td><td style="font-weight:600">${BR_ESC(u.fileName)}</td></tr>` : ''}
      ${c.status ? `<tr><td style="padding:3px 14px 3px 0;color:${BR_SOFT}">Status</td><td style="font-weight:600">${BR_ESC(c.status)}</td></tr>` : ''}
    </table>
    <p style="font-size:9.5px;color:${BR_SOFT};margin-top:34px;max-width:440px;margin-left:auto;margin-right:auto;line-height:1.6">This cover page was added by ${BR_ESC(b.companyName || 'the contract owner')}. The document that follows is reproduced from the file as it was received — its own layout and formatting are unchanged.</p>
  </div>`;
}

if (typeof module !== 'undefined' && module.exports)
  module.exports = { DOC_DESIGNS, DESIGN_LOGO_POSITIONS, docDesignById, normalizeDesignBranding,
    accentLegible, pickAccentFromPixels, docDesignHeaderHtml, docDesignFooterHtml,
    docDesignPaperStyle, docDesignPaperAttr, docDesignCoverPageHtml,
    DOC_STRUCTURES, DEFAULT_STRUCTURE, docStructureById, structureBlockedReason, docStructureBodyHtml };
if (typeof window !== 'undefined')
  Object.assign(window, { DOC_DESIGNS, DESIGN_LOGO_POSITIONS, docDesignById, normalizeDesignBranding,
    accentLegible, pickAccentFromPixels, extractAccentFromLogo, resolveDocBranding, orgBrandingSnapshot,
    docDesignHeaderHtml, docDesignFooterHtml, docDesignPaperStyle, docDesignPaperAttr, docDesignCoverPageHtml,
    DOC_STRUCTURES, DEFAULT_STRUCTURE, docStructureById, structureBlockedReason, docStructureBodyHtml });
