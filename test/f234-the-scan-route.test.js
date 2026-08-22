/* ============================================================
   F234 — /api/ai/ocr, called for the first time
   ============================================================
   HaTi's scanning path has three parts: DETECT that a document is a scan,
   RASTERIZE it in the browser, and RECOGNISE each page. The third part is
   this route, and until today NOTHING in the suite had ever called it —
   not once, in any form. DESIGN-ocr.md describes it in detail; the code
   was written from that description and then shipped unexercised.

   That matters more here than on most routes, because of what sits
   downstream. Text this route returns becomes the contract's wording, and
   the dates and amounts read out of it are what the renewal reminders fire
   on. DESIGN-ocr.md says so in its own words: "OCR misreads dates and
   amounts — 3 for 8, 2026 for 2028 — and those are exactly the fields the
   90/60/30 day renewal reminders fire on."

   Everything below runs against a REAL server and a provider stand-in. No
   API key, no network, no image recognition: what is under test is HaTi's
   own half — what it accepts, what it refuses, what it does with an answer
   that arrives damaged. */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

/* The smallest valid PNG data URL — a 1x1 pixel. The route only ever looks
   at the envelope (is it a data URL, what media type, how big), so a real
   page image would prove nothing this does not. */
const PX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const PAGE = (text, extra = {}) => [{ type: 'tool_use', id: 'tu_ocr', name: 'transcribe_page',
  input: { text, ...extra } }];

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const ocr = (body, client) => (client || W.admin).json('/api/ai/ocr', { method: 'POST', body });

describe('F234 — the transcription route', () => {

  /* ---------- what it accepts ---------- */

  test('f234-1 a page comes back as text, with its provenance stamped', async () => {
    ai.reset();
    ai.script(PAGE('1. TERM\n\nThis Agreement runs for twenty-four (24) months.',
      { illegible: 0, confidence: 'high' }));
    const r = await ocr({ pages: [PX], first: true });
    assert.match(r.text, /twenty-four \(24\) months/);
    assert.equal(r.illegible, 0);
    assert.equal(r.confidence, 'high');
    assert.equal(r.pages, 1);
    assert.equal(r.source, 'ocr-ai', 'the provenance the whole honesty chain keys off');
  });

  test('f234-2 the singular `page` form is accepted too', async () => {
    /* The route documents `pages` (an array) and also reads `page`. Both are
       in the code; only one is exercised by the client, and an accepted
       shape nothing tests is a shape that quietly stops working. */
    ai.reset();
    ai.script(PAGE('SCHEDULE 1'));
    const r = await ocr({ page: PX });
    assert.match(r.text, /SCHEDULE 1/);
  });

  test('f234-3 an image the model reads as blank comes back as blank, not as a failure', async () => {
    /* DESIGN-ocr.md: "If the page is blank or contains no text at all,
       return an empty transcription." A blank separator sheet in the middle
       of a scan is ordinary, and must not abandon the document. */
    ai.reset();
    ai.script(PAGE(''));
    const r = await ocr({ pages: [PX] });
    assert.equal(r.text, '');
    assert.equal(r.source, 'ocr-ai', 'a blank page is still a page that was read');
  });

  test('f234-4 confidence and illegible are read from the model, and defaulted safely', async () => {
    ai.reset();
    ai.script(PAGE('The sum of KES [illegible] shall be paid.', { illegible: 1, confidence: 'low' }));
    let r = await ocr({ pages: [PX] });
    assert.equal(r.illegible, 1);
    assert.equal(r.confidence, 'low');

    ai.reset();
    ai.script(PAGE('clean page'));                       // model said nothing
    r = await ocr({ pages: [PX] });
    assert.equal(r.confidence, 'medium', 'an unstated confidence must not read as high');
    assert.equal(r.illegible, 0);

    ai.reset();
    ai.script(PAGE('x', { confidence: 'perfect' }));     // model said something invalid
    r = await ocr({ pages: [PX] });
    assert.equal(r.confidence, 'medium', 'an unknown confidence must not travel');
  });

  /* ---------- what it refuses, and how ---------- */

  test('f234-5 nothing to read is refused in words', async () => {
    await assert.rejects(() => ocr({}), /pages/i);
    await assert.rejects(() => ocr({ pages: [] }), /pages/i);
  });

  test('f234-6 anything that is not a page image is refused', async () => {
    /* This is the wall around a route that hands bytes to a third party. A
       `file:` URL, an `http:` URL, a PDF pretending to be an image and a
       plain string must all bounce here rather than reaching the provider. */
    const junk = [
      'file:///etc/passwd',
      'http://169.254.169.254/latest/meta-data/',
      'data:application/pdf;base64,JVBERi0=',
      'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
      'not a url at all',
      '',
    ];
    for (const p of junk) {
      ai.reset();
      await assert.rejects(() => ocr({ pages: [p] }), /base64 PNG\/JPEG|required/i,
        `accepted a page it should have refused: ${p.slice(0, 40)}`);
      assert.equal(ai.calls.length, 0, `reached the provider with: ${p.slice(0, 40)}`);
    }
  });

  test('f234-7 too many pages in one request is refused before any spend', async () => {
    ai.reset();
    await assert.rejects(() => ocr({ pages: Array(9).fill(PX) }), /at most/i);
    assert.equal(ai.calls.length, 0, 'a refused batch must cost nothing');
  });

  test('f234-8 a page image over the size cap is refused', async () => {
    ai.reset();
    const huge = 'data:image/jpeg;base64,' + 'A'.repeat(9 * 1024 * 1024);
    await assert.rejects(() => ocr({ pages: [huge] }), /too large|lower the render quality/i);
    assert.equal(ai.calls.length, 0);
  });

  test('f234-9 a provider failure is reported, never returned as an empty page', async () => {
    /* The difference that matters: "this page is blank" and "the provider
       refused" must not arrive looking the same, or a failed scan is filed
       as a contract with no words in it. */
    ai.reset();
    ai.script(500);
    await assert.rejects(() => ocr({ pages: [PX] }), /provider error/i);
  });

  test('f234-10 an answer with no transcription in it is refused', async () => {
    ai.reset();
    ai.script({ content: [{ type: 'text', text: 'I am unable to read this image.' }] });
    await assert.rejects(() => ocr({ pages: [PX] }), /no transcription/i);
  });

  /* ---------- what the provider is actually asked ---------- */

  test('f234-11 the image and the instruction both travel, and the tool is forced', async () => {
    ai.reset();
    ai.script(PAGE('ok'));
    await ocr({ pages: [PX] });
    assert.equal(ai.calls.length, 1);
    const body = ai.calls[0].body;
    const content = body.messages[0].content;
    const img = content.find(b => b.type === 'image');
    assert.ok(img, 'no image reached the provider');
    assert.equal(img.source.type, 'base64');
    assert.equal(img.source.media_type, 'image/png');
    assert.ok(!/^data:/.test(img.source.data), 'the data: prefix must be stripped, not sent');
    assert.equal(body.tool_choice.name, 'transcribe_page',
      'the tool is forced, or the answer arrives as prose');
  });

  test('f234-12 the prompt forbids the four things that would corrupt the record', async () => {
    ai.reset();
    ai.script(PAGE('ok'));
    await ocr({ pages: [PX] });
    const prompt = ai.calls[0].body.messages[0].content.map(b => b.text || '').join('\n');
    assert.match(prompt, /verbatim/i, 'the transcription must be asked for verbatim');
    assert.match(prompt, /never guess|NEVER guess/i, 'guessing at an unreadable figure must be forbidden');
    assert.match(prompt, /\[illegible\]/, 'there must be a way to say "I could not read this"');
    assert.match(prompt, /numbering/i, 'clause numbering is the citation and must be preserved');
  });

  test('f234-13 a jpeg is sent as a jpeg, and image/jpg is corrected on the way', async () => {
    ai.reset();
    ai.script(PAGE('ok'));
    await ocr({ pages: ['data:image/jpg;base64,/9j/4AAQSkZJRg=='] });
    assert.equal(ai.calls[0].body.messages[0].content[0].source.media_type, 'image/jpeg',
      'image/jpg is not a media type the provider knows');
  });

  /* ---------- who may ask ---------- */

  test('f234-14 a signed-out caller cannot transcribe', async () => {
    const anon = h.client('nobody');
    ai.reset();
    await assert.rejects(() => ocr({ pages: [PX] }, anon));
    assert.equal(ai.calls.length, 0);
  });
  /* ---------- a page cut short ----------
     f231's finding, on a route nobody had applied it to. It is worse here
     than it was there: an obligations list that comes back empty is visibly
     wrong, whereas half a transcription reads exactly like a whole one — and
     it becomes the contract's WORDING, so the bottom of the page is simply
     not in the record and nothing downstream can tell. */

  test('f234-15 a page cut short is kept, and says so', async () => {
    ai.reset();
    ai.script({ content: PAGE('1. TERM\n\nThis Agreement runs for twenty-fo'),
      stopReason: 'max_tokens' });
    const r = await ocr({ pages: [PX] });
    assert.match(r.text, /twenty-fo/, 'the readable half is thrown away');
    assert.equal(r.truncated, true, 'nothing tells the document a page is incomplete');
    assert.match(String(r.notice || ''), /cut short/i);
  });

  test('f234-16 a page cut short before it said anything is refused, not called blank', async () => {
    /* This is the pair that must not collapse. f234-3 proves a genuinely
       blank page comes back as an empty transcription and is a legitimate
       answer; this proves the failure that produces the same empty string
       does NOT. Collapsed, a scan that ran out of room is filed as a
       contract page with no words on it. */
    ai.reset();
    ai.script({ content: PAGE(''), stopReason: 'max_tokens' });
    await assert.rejects(() => ocr({ pages: [PX] }), /ran out of room/i);
  });

  test('f234-17 a complete answer carries no truncation flag at all', async () => {
    ai.reset();
    ai.script(PAGE('a whole page'));
    const r = await ocr({ pages: [PX] });
    assert.equal(r.truncated, undefined, 'an absent fact must be absent, not false');
    assert.equal(r.notice, undefined);
  });
});
