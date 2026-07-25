// Rasterise the clean text PDF into an image-only ("scanned") PDF using
// Chromium + pdf.js, then print the bitmap back out as a PDF.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const OUT = '/home/user/mkataba-clm/test-fixtures';

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const pdfB64 = fs.readFileSync(OUT + '/clean-text-contract.pdf').toString('base64');
  await pg.goto('about:blank');
  await pg.addScriptTag({ path: require.resolve('/opt/node22/lib/node_modules/playwright/package.json').replace(/package.json$/, '') + 'index.js' }).catch(() => {});
  // load pdf.js from the local node_modules of the project? not present — use a
  // hand-rolled rasterisation instead: render the text to a canvas ourselves.
  const lines = fs.readFileSync(OUT + '/plain-contract.txt', 'utf8').split('\n');
  const png = await pg.evaluate(async (lines) => {
    const c = document.createElement('canvas');
    c.width = 1240; c.height = 1754; // A4 at 150dpi
    const x = c.getContext('2d');
    x.fillStyle = '#fdfdfb'; x.fillRect(0, 0, c.width, c.height);
    // paper noise so it looks like a scan and has no text layer
    const img = x.getImageData(0, 0, c.width, c.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() * 18) | 0;
      img.data[i] -= n; img.data[i + 1] -= n; img.data[i + 2] -= n;
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = '#111'; x.font = '22px monospace';
    let y = 110;
    for (const l of lines) { x.fillText(l, 96, y); y += 30; }
    x.save(); x.translate(0, 0); x.rotate(0.004); x.restore();
    return c.toDataURL('image/png');
  }, lines);
  const html = '<html><body style="margin:0"><img src="' + png + '" style="width:100%;display:block"></body></html>';
  await pg.setContent(html);
  const out = await pg.pdf({ width: '210mm', height: '297mm', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  fs.writeFileSync(OUT + '/scanned-no-text-layer.pdf', out);
  console.log('scanned pdf bytes', out.length);
  await b.close();
})();
