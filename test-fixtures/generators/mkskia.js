// Faithful Google-Docs/Skia-style PDFs, built on the REAL Adobe Helvetica AFM
// advance widths so the geometry in the file matches what a renderer would
// actually produce. Three variants, so the failure (if any) can be pinned to a
// specific producer habit rather than to a sloppy fixture.
const fs = require('fs');

// Adobe Helvetica AFM widths (units/1000 em) for the ASCII range.
const HELV = {
  32: 278, 33: 278, 34: 355, 35: 556, 36: 556, 37: 889, 38: 667, 39: 191, 40: 333, 41: 333,
  42: 389, 43: 584, 44: 278, 45: 333, 46: 278, 47: 278, 48: 556, 49: 556, 50: 556, 51: 556,
  52: 556, 53: 556, 54: 556, 55: 556, 56: 556, 57: 556, 58: 278, 59: 278, 60: 584, 61: 584,
  62: 584, 63: 556, 64: 1015, 65: 667, 66: 667, 67: 722, 68: 722, 69: 667, 70: 611, 71: 778,
  72: 722, 73: 278, 74: 500, 75: 667, 76: 556, 77: 833, 78: 722, 79: 778, 80: 667, 81: 778,
  82: 722, 83: 667, 84: 611, 85: 722, 86: 667, 87: 944, 88: 667, 89: 667, 90: 611, 91: 278,
  92: 278, 93: 278, 94: 469, 95: 556, 96: 333, 97: 556, 98: 556, 99: 500, 100: 556, 101: 556,
  102: 278, 103: 556, 104: 556, 105: 222, 106: 222, 107: 500, 108: 222, 109: 833, 110: 556,
  111: 556, 112: 556, 113: 556, 114: 333, 115: 500, 116: 278, 117: 556, 118: 500, 119: 722,
  120: 500, 121: 500, 122: 500, 123: 334, 124: 260, 125: 334, 126: 584,
};
const wOf = ch => (HELV[ch.charCodeAt(0)] || 556) / 1000;
const runW = (s, size) => s.split('').reduce((a, c) => a + wOf(c), 0) * size;
const esc = s => s.replace(/[\\()]/g, c => '\\' + c);

// variant: 'word-tm'  each word gets its own Tm at a real x (Skia's habit)
//          'glyph-tj' every glyph placed by TJ kerning numbers, no space glyph
//          'word-tm-widths' as word-tm but the font declares /Widths
function buildSkia(lines, variant, size = 11) {
  const declareWidths = variant === 'word-tm-widths';
  const objs = {};
  const FONT = 3, PAGE = 4, CONTENT = 5, INFO = 6;
  let stream = '';
  let y = 780;
  for (const line of lines) {
    if (line.trim() === '') { y -= 16; continue; }
    const indent = line.length - line.replace(/^\s+/, '').length;
    let x = 56 + indent * wOf(' ') * size;
    const words = line.trim().split(/\s+/);
    if (variant === 'glyph-tj') {
      // one BT/ET per line; every glyph its own string, separated by the exact
      // TJ displacement that a space would occupy — no space glyph is emitted.
      stream += `BT /F1 ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm [`;
      words.forEach((w, i) => {
        if (i) stream += ` ${(-wOf(' ') * 1000).toFixed(0)} `;
        stream += w.split('').map(c => `(${esc(c)})`).join(' ');
      });
      stream += '] TJ ET\n';
    } else {
      for (const w of words) {
        stream += `BT /F1 ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${esc(w)}) Tj ET\n`;
        x += runW(w, size) + wOf(' ') * size;
      }
    }
    y -= 16;
  }
  let widthsDict = '';
  if (declareWidths) {
    const arr = []; for (let c = 32; c <= 126; c++) arr.push(HELV[c] || 556);
    widthsDict = ` /FirstChar 32 /LastChar 126 /Widths [${arr.join(' ')}]`;
  }
  objs[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objs[2] = `<< /Type /Pages /Kids [${PAGE} 0 R] /Count 1 >>`;
  objs[FONT] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding${widthsDict} >>`;
  objs[PAGE] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${FONT} 0 R >> >> /Contents ${CONTENT} 0 R >>`;
  objs[CONTENT] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}endstream`;
  objs[INFO] = '<< /Producer (Skia/PDF m132 Google Docs Renderer) /Creator (Skia/PDF m132) >>';
  let pdf = '%PDF-1.4\n'; const off = {};
  for (let i = 1; i <= INFO; i++) { off[i] = Buffer.byteLength(pdf); pdf += `${i} 0 obj\n${objs[i]}\nendobj\n`; }
  const xr = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${INFO + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= INFO; i++) pdf += String(off[i]).padStart(10, '0') + ' 00000 n \n';
  pdf += `trailer\n<< /Size ${INFO + 1} /Root 1 0 R /Info ${INFO} 0 R >>\nstartxref\n${xr}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
module.exports = { buildSkia };
if (require.main === module) {
  const OUT = '/home/user/mkataba-clm/test-fixtures';
  const BODY = fs.readFileSync(OUT + '/plain-contract.txt', 'utf8').split('\n');
  fs.writeFileSync(OUT + '/gdocs-skia-contract.pdf', buildSkia(BODY, 'word-tm'));
  fs.writeFileSync(OUT + '/gdocs-skia-widths.pdf', buildSkia(BODY, 'word-tm-widths'));
  fs.writeFileSync(OUT + '/gdocs-skia-glyphs.pdf', buildSkia(BODY, 'glyph-tj'));
  console.log('skia fixtures rebuilt on real Helvetica metrics');
}
