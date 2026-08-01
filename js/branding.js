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

/* The catalogue. Five designs, fixed — adding a sixth is a product decision,
   not a code path. `defaultLogoPos` is a starting point; the customer's saved
   position always wins. `usesAccent` drives the Design step's colour controls
   (no point offering a colour the design will not show). */
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
];
const docDesignById = id => DOC_DESIGNS.find(d => d.id === id) || null;

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
  return {
    designId: design ? design.id : null,
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
  // modern-minimal + compact-executive: quiet left-aligned rule
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
  if (b.designId !== 'formal-legal') return accent;
  return `${accent}border:1px solid ${BR_RULE};box-shadow:inset 0 0 0 3px #fbfbfc,inset 0 0 0 4px ${BR_RULE};`;
}

/* The attribute that turns a design's BODY typography on: the paper div
   carries data-doc-body="<designId>" and the stylesheet in index.html
   restyles .doc-surface underneath it — typeface, heading treatment,
   justification. An attribute rather than inline styles because the body's
   own classes (.doc-surface, .hati-doc) must be out-specified in print,
   where --font-doc is enforced with !important. */
function docDesignPaperAttr(b) {
  return b && b.designId ? ` data-doc-body="${b.designId}"` : '';
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
    docDesignPaperStyle, docDesignPaperAttr, docDesignCoverPageHtml };
if (typeof window !== 'undefined')
  Object.assign(window, { DOC_DESIGNS, DESIGN_LOGO_POSITIONS, docDesignById, normalizeDesignBranding,
    accentLegible, pickAccentFromPixels, extractAccentFromLogo, resolveDocBranding, orgBrandingSnapshot,
    docDesignHeaderHtml, docDesignFooterHtml, docDesignPaperStyle, docDesignPaperAttr, docDesignCoverPageHtml });
