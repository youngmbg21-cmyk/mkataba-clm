/* F9 — the Word round-trip.
   Two layers, matching where the feature actually lives:

   1. The .docx extractor (js/docx.js) runs on REAL bytes — the generated
      fixtures and adversarial archives built in-test. The assertions pin the
      semantics the product depends on: tracked changes read as ACCEPTED
      (deleted wording never resurfaces), entities decode, damaged files fail
      with a human-readable reason instead of a half-read document.

   2. The server holds the signed door: an executed contract's upload (which
      now carries the Word version ledger) cannot be changed by any PUT, and
      version files referenced from c.documents are readable while the
      contract lives and swept when it is deleted. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { docxExtract, docxXmlToText } = require('../js/docx.js');

const FIX = p => new Uint8Array(fs.readFileSync(path.join(__dirname, '..', 'test-fixtures', p)));

/* ---- minimal ZIP writer (same layout the fixture generator uses) so the
   adversarial cases are built here, visible beside their assertions ---- */
function crc32(buf){ let c,t=[]; for(let n=0;n<256;n++){ c=n; for(let k=0;k<8;k++) c=c&1?0xEDB88320^(c>>>1):c>>>1; t[n]=c>>>0; }
  let crc=0^(-1); for(let i=0;i<buf.length;i++) crc=(crc>>>8)^t[(crc^buf[i])&0xFF]; return (crc^(-1))>>>0; }
function zip(files, { store=false }={}){
  const chunks=[], central=[]; let off=0;
  for(const f of files){
    const name=Buffer.from(f.name,'utf8'), data=Buffer.from(f.data);
    const comp=store?data:zlib.deflateRawSync(data), crc=crc32(data), method=store?0:8;
    const lh=Buffer.alloc(30); lh.writeUInt32LE(0x04034b50,0); lh.writeUInt16LE(20,4);
    lh.writeUInt16LE(method,8); lh.writeUInt32LE(crc,14); lh.writeUInt32LE(comp.length,18);
    lh.writeUInt32LE(data.length,22); lh.writeUInt16LE(name.length,26);
    chunks.push(lh,name,comp);
    const ch=Buffer.alloc(46); ch.writeUInt32LE(0x02014b50,0); ch.writeUInt16LE(20,4); ch.writeUInt16LE(20,6);
    ch.writeUInt16LE(method,10); ch.writeUInt32LE(crc,16); ch.writeUInt32LE(comp.length,20);
    ch.writeUInt32LE(data.length,24); ch.writeUInt16LE(name.length,28); ch.writeUInt32LE(off,42);
    central.push(ch,name);
    off+=lh.length+name.length+comp.length;
  }
  const cd=Buffer.concat(central);
  const eocd=Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50,0); eocd.writeUInt16LE(files.length,8);
  eocd.writeUInt16LE(files.length,10); eocd.writeUInt32LE(cd.length,12); eocd.writeUInt32LE(off,16);
  return new Uint8Array(Buffer.concat([...chunks,cd,eocd]));
}
const docXml = inner =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
  '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+inner+'</w:body></w:document>';
const mkDocx = (inner, opts) => zip([
  { name:'[Content_Types].xml', data:'<Types/>' },
  { name:'word/document.xml', data:docXml(inner) },
], opts);

describe('F9a — the .docx extractor reads real Word bytes', () => {

  test('the generated fixture extracts its full agreement text', async () => {
    const r = await docxExtract(FIX('contract.docx'));
    assert.ok(r.text.includes('PACKAGING SUPPLY AGREEMENT'));
    assert.ok(r.text.includes('MWANGI FOODS LIMITED'));
    assert.ok(r.text.includes('Payment shall be made within 45 days'));
    assert.deepEqual(r.tracked, { ins:0, del:0 });
  });

  test('tracked changes read as ACCEPTED: insertions in, deletions gone, counts reported', async () => {
    const r = await docxExtract(FIX('contract-v2-redline.docx'));
    // the stretched payment term reads as the NEW wording…
    assert.ok(r.text.includes('within 90 days of a valid invoice, subject to reconciliation'));
    // …and the struck-out "45" does not resurface anywhere in that sentence
    assert.ok(!r.text.includes('within 45 days'));
    // the halved liability cap likewise
    assert.ok(r.text.includes('capped at fifty percent (50%) of the total'));
    assert.ok(!/capped at the total/.test(r.text));
    assert.equal(r.tracked.ins, 3);
    assert.equal(r.tracked.del, 2);
  });

  test('a STORED (uncompressed) archive reads the same as a deflated one', async () => {
    const inner='<w:p><w:r><w:t xml:space="preserve">Stored entry text</w:t></w:r></w:p>';
    const r = await docxExtract(mkDocx(inner, { store:true }));
    assert.equal(r.text, 'Stored entry text');
  });

  test('entities decode and tabs/breaks keep the document shape', async () => {
    const inner='<w:p><w:r><w:t xml:space="preserve">Mwangi &amp; Sons &lt;Kenya&gt;</w:t></w:r>'
      +'<w:r><w:tab/><w:t xml:space="preserve">KES 1&#44;000</w:t></w:r></w:p>'
      +'<w:p><w:r><w:t>line one</w:t><w:br/><w:t>line two</w:t></w:r></w:p>';
    const r = await docxExtract(mkDocx(inner));
    assert.ok(r.text.includes('Mwangi & Sons <Kenya>\tKES 1,000'));
    assert.ok(r.text.includes('line one\nline two'));
  });

  test('field codes (w:instrText) are plumbing, not content', () => {
    const { text } = docxXmlToText(docXml(
      '<w:p><w:r><w:instrText xml:space="preserve"> PAGEREF _Toc123 </w:instrText></w:r>'
      +'<w:r><w:t>Real wording</w:t></w:r></w:p>'));
    assert.equal(text, 'Real wording');
  });

  test('random bytes fail with a human-readable reason, not a half-read document', async () => {
    const junk=new Uint8Array(4096).map((_,i)=>(i*7+13)&0xff);
    await assert.rejects(docxExtract(junk), /not a readable \.docx/);
  });

  test('a ZIP with no word/document.xml is named as not-a-Word-file', async () => {
    const notWord=zip([{ name:'hello.txt', data:'not a contract' }]);
    await assert.rejects(docxExtract(notWord), /not a Word \.docx/);
  });

  test('a zero-byte file is refused cleanly', async () => {
    await assert.rejects(docxExtract(new Uint8Array(0)), /not a readable \.docx/);
  });

  test('an empty document (no readable text) is refused, not filed as an empty shell', async () => {
    await assert.rejects(docxExtract(mkDocx('<w:p><w:r><w:t></w:t></w:r></w:p>')), /no readable text/);
  });
});

describe('F9b — the server holds the signed door and the version-file lifecycle', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  const uploadBlock = () => ({
    fileName:'agreement.docx',
    mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    docKind:'docx', size:2048, fileHash:'abc123', extractedText:'the sealed wording',
    versions:[{ n:2, roundN:1, fileName:'agreement-v2.docx', size:2100, fileHash:'def456', adoptedAs:2 }],
  });

  test('an executed contract rejects ANY change to its upload — the Word version ledger included', async () => {
    const c = fixtureContract('MK-W1', 'Executed With Word History', 'Nampak Kenya', FOLDER_A, 1800000, 'Signed');
    c.source='upload';
    c.upload=uploadBlock();
    c.execution={ at:new Date().toISOString(), by:'Amina Otieno' };
    let r = await W.admin.raw('/api/contracts/MK-W1', { method:'PUT', body:{ contract:c, baseVersion:0 } });
    assert.equal(r.status, 200);
    // …now try to push a NEW Word version onto the executed record
    const tampered=JSON.parse(JSON.stringify(c));
    tampered.upload.versions.push({ n:3, roundN:2, fileName:'sneaky-v3.docx', size:999, fileHash:'bad' });
    r = await W.admin.raw('/api/contracts/MK-W1', { method:'PUT', body:{ contract:tampered, baseVersion:1 } });
    assert.equal(r.status, 409);
    assert.match(r.json.error, /executed/);
    assert.ok(r.json.immutable.includes('upload'));
    // …and the stored record still has exactly one version entry
    const back = await W.admin.raw('/api/contracts/MK-W1');
    assert.equal(back.json.upload.versions.length, 1);
  });

  test('a version file referenced from c.documents is readable while the contract lives, gone when it is deleted', async () => {
    // store the returned file's bytes the way the client does
    const up = await W.admin.raw('/api/files', { method:'POST', body:{
      name:'returned-v2.docx',
      mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      dataUrl:'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBA==',
    } });
    assert.equal(up.status, 200);
    const fileId = up.json.id;
    const c = fixtureContract('MK-W2', 'Live With Word Round', 'Nampak Kenya', FOLDER_A, 1800000, 'Under Review');
    c.source='upload';
    c.upload={ ...uploadBlock(), versions:[{ n:2, roundN:1, fileName:'returned-v2.docx', size:8, fileHash:'xyz', fileId }] };
    c.documents=[{ fileId, name:'returned-v2.docx', kind:'word-version' }];
    let r = await W.admin.raw('/api/contracts/MK-W2', { method:'PUT', body:{ contract:c, baseVersion:0 } });
    assert.equal(r.status, 200);
    r = await W.admin.raw('/api/files/'+fileId);
    assert.equal(r.status, 200);
    assert.ok(r.json.dataUrl.startsWith('data:'));
    // deleting the contract sweeps the version file with it — no orphan bytes
    r = await W.admin.raw('/api/contracts/MK-W2', { method:'DELETE' });
    assert.equal(r.status, 200);
    assert.equal(r.json.filesDeleted, 1);
    r = await W.admin.raw('/api/files/'+fileId);
    assert.equal(r.status, 404);
  });
});
