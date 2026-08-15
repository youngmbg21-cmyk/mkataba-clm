#!/usr/bin/env node
/* ============================================================
   COLLISION SWEEP — C2, SKEPTIC'S COUNTER-PROBE
   ============================================================
   The C2 finding claims the flip (two live links, contradictory answers on one
   ask) is HANDLED_BUT_SILENT: "no surface anywhere says a reversal happened",
   and that the loser "is neither told nor kept as linked history".

   The original probe measured exactly three things: c.audit strings, the toast
   log, and the change object. It never rendered a single surface a person
   actually looks at. This probe re-arms the SAME collision against a REAL
   server and then reads the surfaces:

     · the History tab            (roomHistoryHtml — the record screen)
     · the comments feed          (c.comments, drawn by renderFeed into #feed)
     · the versions pane          (roomVersionsHtml / listedVersions)
     · the negotiation timeline   (negoTimeline — the pop-out + counterparty)
     · the raw audit panel        (#audit-section — is it even drawn?)

   plus the two source claims the finding rests on:
     · negoResolve annotates "(was <prev>)" only on status==='pending'
     · nothing compares r.at with ch.resolvedAt before applying

   Run: node test/audit/collisions/c2-SKEPTIC-counter-probe.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { buildPortal, supplyContract } = require('../../portalworld');
const fs = require('node:fs');
const path = require('node:path');

let pass = 0, fail = 0;
const P = (ok, msg, extra) => {
  if (ok) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (extra ? '\n        ' + extra : '')); }
};
const NOTE = m => console.log('  ·   ' + m);
const HEAD = m => console.log('\n=== ' + m + ' ===');

function recordStage() {
  const p = buildPortal({ url: 'https://hati.test/' });
  const w = p.win;
  w.persist = () => {}; w.saveContract = () => {};
  w.renderWorkspace = () => {}; w.renderRedline = () => {}; w.setView = () => {};
  w.renderNegotiationSection = () => {}; w.renderAuditSection = () => {};
  w.renderSharesSection = () => {}; w.refreshShareOverview = () => {};
  w.promptDialog = async () => '';
  return p;
}
const strip = h => String(h || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

(async () => {
  const h = await startHati();
  try {
    const s = await seedWorkspace(h);
    const admin = s.admin;

    /* ---------- ARM: identical staging to the finding's probe ---------- */
    HEAD('ARM — one ask of ours, two durable negotiate links, two opposite answers');
    const stage = recordStage();
    const win = stage.win;
    const c = supplyContract({ id: 'MK-C2S', folder: 'proc', status: 'Under Review' });
    win.negoInit(c);
    const target = win.negoClauseList(c).find(x => /thirty \(30\) days/.test(x.text));
    if (!target) throw new Error('harness: no payment clause on the fixture');
    const ask = await win.negoFileChange(c, {
      clauseId: target.clauseId, changeType: 'modify', oldText: target.text,
      newText: target.text.replace('thirty (30) days', 'forty-five (45) days'),
    }, { side: 'owner', author: 'Wanjiru Kamau' });
    const ASK = ask.id;
    P(ask.status === 'pending' && ask.authorSide === 'owner',
      `armed: ${ASK} pending, authorSide=owner, clause ${ask.clauseId}`);

    const put = (contract, baseVersion) => admin.json('/api/contracts/' + contract.id,
      { method: 'PUT', body: { contract, baseVersion } });
    await put(JSON.parse(JSON.stringify(c)), 0);
    const stored0 = await admin.json('/api/contracts/MK-C2S');
    P(stored0.changes.length === 1 && stored0.changes[0].status === 'pending',
      `armed: server holds ${ASK} pending at version ${stored0._v}`);

    const docHash = await win.sha256(win.canonicalDoc(c));
    const mint = (who, email) => {
      const payload = win.buildSharePayload(c, docHash,
        { org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau' });
      payload.purpose = 'negotiate';
      return admin.json('/api/shares', { method: 'POST', body: {
        payload, recipient: { name: who, email }, channel: 'link',
        durable: true, purpose: 'negotiate', expiryDays: 30 } });
    };
    const A = await mint('Astrid Berg (CFO)', 'cfo@nordkust.test');
    const B = await mint('Bengt Holm (Counsel)', 'counsel@nordkust.test');
    const oA = await admin.raw('/api/shares/' + A.token);
    const oB = await admin.raw('/api/shares/' + B.token);
    P(oA.status === 200 && oB.status === 200 && A.token !== B.token,
      `armed: two distinct durable links, both answerable (${oA.status}/${oB.status})`);

    const respond = (token, name, at, status, reply) =>
      h.client('public').json('/api/shares/' + token + '/respond', { method: 'POST', body: {
        kind: 'hati-response', action: 'decisions', id: 'MK-C2S', name, at, docHash,
        negoDecisions: [{ id: ASK, status, reply }] } });
    await respond(A.token, 'Astrid Berg', '2026-08-15T09:00:00.000Z', 'accepted', 'Forty-five days is fine.');
    await respond(B.token, 'Bengt Holm', '2026-08-15T11:00:00.000Z', 'rejected', 'We cannot go past thirty.');
    const q = (await admin.json('/api/shares/pending')).filter(x => x.response && x.response.id === 'MK-C2S');
    const rA = q.find(x => x.response.name === 'Astrid Berg');
    const rB = q.find(x => x.response.name === 'Bengt Holm');
    P(!!rA && !!rB && rA.response.negoDecisions[0].status === 'accepted'
      && rB.response.negoDecisions[0].status === 'rejected',
      'armed: two unapplied responses queued, same ask, opposite verdicts',
      JSON.stringify(q.map(x => ({ id: x.responseId, by: x.response.name, at: x.response.at }))));

    const rec = await admin.json('/api/contracts/MK-C2S');
    rec._loaded = true;
    stage.log.toasts.length = 0;
    await win.applyResponse(rec, rA.response, {});
    const midWording = String(rec.redlineText || '');
    P(/forty-five/.test(midWording), 'armed: after A, the accepted wording is in the body');
    await win.applyResponse(rec, rB.response, {});
    const ch = rec.changes.find(x => x.id === ASK);
    P(ch.status === 'rejected' && /thirty \(30\)/.test(String(rec.redlineText || '')),
      `armed: after B the ask is ${ch.status} and the body is back at the baseline`);
    NOTE('the flip reproduces exactly as the finding describes');

    /* ================= THE FINDING'S OWN THREE CLAIMS ================= */
    HEAD('CLAIM 1 — no audit line names that it had already been accepted');
    const trail = (rec.audit || []).filter(a => /CHG-/.test(String(a.detail || '')));
    for (const a of trail) console.log(`      [${a.user}] ${a.action}: ${a.detail}`);
    const annot = trail.some(a => /\(was (accepted|rejected)\)|revers|overrid|previously/i.test(a.detail || ''));
    P(!annot, 'CONFIRMED: no line annotates the flip (the "(was X)" idiom is absent)');
    const src = fs.readFileSync(path.join(__dirname, '../../../js/negotiation.js'), 'utf8');
    P(/\$\{status === 'pending' \? ` \(was \$\{prev\}\)` : ''\}/.test(src),
      'CONFIRMED at source: negoResolve appends "(was <prev>)" ONLY when status===\'pending\'');

    HEAD('CLAIM 2 — the loser\'s ACT is not kept as linked history (the finding says it is not)');
    const accLines = trail.filter(a => /accepted by Astrid/.test(a.detail || ''));
    P(accLines.length >= 1,
      `REFUTES-IN-PART: the audit trail DOES keep Astrid's acceptance verbatim (${accLines.length} line(s)), `
      + 'naming her, the change id, the clause, the fingerprint and the time');
    const feed = (rec.comments || []).filter(x => x.side === 'external');
    console.log('      --- the comments feed (#feed, drawn by renderFeed) ---');
    for (const m of feed) console.log(`      ${m.author} · ${m.at} · ${m.text}`);
    P(feed.length === 2 && /Astrid/.test(feed[0].author) && /accepted/.test(feed[0].text),
      'REFUTES-IN-PART: the FEED — a visible panel in the room — carries both answers by name, '
      + 'each naming #' + ASK + ' and its outcome');
    const vs = rec.versions || [];
    const accVer = vs.filter(v => /accepted/.test(String(v.label || '')) && /forty-five/.test(String(v.text || '')));
    console.log('      --- versions written by the two decisions ---');
    for (const v of vs.slice(-4)) console.log(`      v${v.n} "${v.label}" by ${v.by} listed=${v.listed}`);
    P(accVer.length >= 1,
      `REFUTES-IN-PART: the accepted WORDING survives as a version snapshot (${accVer.length}), `
      + 'label "' + (accVer[0] || {}).label + '" by ' + (accVer[0] || {}).by);
    const listed = win.listedVersions ? win.listedVersions(rec) : vs.filter(v => v.listed !== false);
    P(!listed.some(v => /accepted/.test(String(v.label || ''))),
      'CONFIRMED: that snapshot is auto/unlisted, so the Versions pane does NOT show it',
      'listed labels: ' + JSON.stringify(listed.map(v => v.label)));
    P(!ch.reply || ch.reply === 'We cannot go past thirty.',
      `CONFIRMED: the change's ONE reply slot now reads "${ch.reply}" — Astrid's words are gone from it`);
    const anywhere = JSON.stringify(rec);
    P(!/Forty-five days is fine/.test(anywhere),
      'CONFIRMED: Astrid\'s reply text "Forty-five days is fine." survives NOWHERE on the record',
      'found at: ' + (anywhere.indexOf('Forty-five days is fine') >= 0 ? 'somewhere in the record' : 'nowhere'));

    HEAD('CLAIM 3 — the HISTORY TAB, the one screen a person reads the record on');
    const histHtml = win.roomHistoryHtml(rec, {});
    const histText = strip(histHtml);
    const evs = win.roomHistoryEvents(rec, {});
    console.log('      --- rows the History tab renders ---');
    for (const e of evs) console.log(`      [${e._k}] ${e.at} · ${e.actor} · ${e.text}`);
    const decidedRows = evs.filter(e => e._k === 'decided');
    P(decidedRows.length === 1,
      `CONFIRMED: the History tab renders ONE "decided" row for ${ASK} (Bengt's), not two`,
      JSON.stringify(decidedRows.map(e => e.text)));
    P(!/accepted by Astrid|Accepted by Astrid|Astrid Berg decided/.test(histText),
      'CONFIRMED: Astrid\'s ACCEPTANCE appears nowhere in the VISIBLE text of the History tab — '
      + 'her two audit lines are folded into Bengt\'s row (roomHistoryEvents ~3356, "folded in, not lost")',
      'visible text: ' + histText.slice(0, 400));
    NOTE('("Astrid" does appear once in the visible text — as the RECIPIENT of the share link, '
      + 'from the "Shared" audit line. That is not her verdict.)');
    const inTitle = /title="[^"]*accepted by Astrid[^"]*"/.test(histHtml);
    P(inTitle,
      'REFUTES-IN-PART: it IS reachable — the folded line rides as the title= tooltip on the '
      + 'fingerprint chip of that row (hover only)',
      'no title attribute carries it either');
    NOTE('so on the History tab the reversal is legible only by hovering a hash chip');

    HEAD('AND THE RAW TRAIL PANEL — is it drawn at all?');
    const cv = fs.readFileSync(path.join(__dirname, '../../../js/views/contract.js'), 'utf8');
    P(/<div id="audit-section" hidden><\/div>/.test(cv),
      'CONFIRMED: #audit-section (renderAuditSection, which prints every raw line) is rendered '
      + 'into a HIDDEN div in the room — the raw trail is not a screen a person reads');

    HEAD('THE POP-OUT / COUNTERPARTY TIMELINE (negoTimeline)');
    const tl = win.negoTimeline(rec, {}).filter(e => e.changeId === ASK);
    for (const e of tl) console.log(`      [${e.kind}] ${e.actor} · ${e.text}`);
    P(tl.filter(e => e.kind === 'decided').length === 1,
      'CONFIRMED: negoTimeline derives "decided" from the change\'s CURRENT slot, so it can '
      + 'only ever show the surviving verdict');

    /* ================= IS IT DELIBERATE? ================= */
    HEAD('IS THE FLIP ITSELF DELIBERATE?');
    const core = fs.readFileSync(path.join(__dirname, '../../../js/core.js'), 'utf8');
    P(/if\(docChanged && \(r\.action==='sign' \|\| r\.action==='accept' \|\| r\.action==='ready'\)\)/.test(core),
      'the doc-changed wall is DELIBERATELY scoped to BINDING actions (sign/accept/ready); '
      + "action:'decisions' is let through with an informational note (C-3 comment in core.js)");
    const toasts = stage.log.toasts.map(t => t.msg);
    console.log('      --- toasts the owner saw across both applications ---');
    for (const t of toasts) console.log('      ' + t);
    P(toasts.some(t => /document changed after/i.test(t)),
      'the owner DOES get a toast on the second answer — but it says the DOCUMENT changed after '
      + 'the link was created, not that a verdict was reversed');
    const cmd = fs.readFileSync(path.join(__dirname, '../../../CLAUDE.md'), 'utf8');
    /* Narrow patterns only. "already answered" appears in the rulebook as a
       PORTAL read-only reason and is not a rule about this. */
    const rule = /two verdicts|second verdict|reverses an earlier (answer|decision)|flips the first|contradictory answer/i.test(cmd);
    P(!rule, 'CLAUDE.md carries NO rule declaring a second link-holder\'s verdict deliberate',
      'a rule appears to exist — re-read before judging');
    NOTE('the nearest rules are (a) the funnel\'s supersede-on-counter, which governs FILING not '
      + 'DECIDING, and (b) negoResolve\'s "NO SECOND ACCEPTANCE SILENTLY DISCARDS A FIRST", which '
      + 'guards two CHANGES on one clause, not two VERDICTS on one change.');

    HEAD('THE EXPORTED RECORD — the report the ⋯ menu produces, with the integrity statement');
    const rep = await win.negoIntegrityReport(rec);
    const exp = win.negoHistoryExportHtml(rec, rep);
    const expText = strip(exp);
    P(!/accepted by Astrid|Accepted by Astrid|Astrid Berg decided/i.test(expText),
      'CONFIRMED: the EXPORT is built from negoTimeline, not from c.audit — Astrid\'s acceptance '
      + 'is absent from the standalone record an auditor reads',
      expText.slice(0, 400));
    P(/Rejected by Bengt/i.test(expText),
      'and it carries Bengt\'s rejection as the one decision on ' + ASK);
    NOTE('so the acceptance survives ONLY in c.audit: hidden div in the room, tooltip on the '
      + 'History tab, absent from the export, absent from the pop-out and the counterparty copy.');

    /* ================= THE ORDERING CLAIM (probe\'s, not the finding\'s) ============ */
    HEAD('DOES THE FLIP PERSIST? (the server\'s DECIDING-≠-RECEIVING guard)');
    const v = (await admin.json('/api/contracts/MK-C2S'))._v;
    const toSave = JSON.parse(JSON.stringify(rec));
    delete toSave._v; delete toSave._loaded;
    const saved = await admin.raw('/api/contracts/MK-C2S',
      { method: 'PUT', body: { contract: toSave, baseVersion: v } });
    P(saved.status === 200, `the flipped record SAVES (HTTP ${saved.status}) — the server does not refuse `
      + 'an inbound decision that moves a status a second time', JSON.stringify(saved.json));
    const back = await admin.json('/api/contracts/MK-C2S');
    const backCh = back.changes.find(x => x.id === ASK);
    P(backCh.status === 'rejected' && /Bengt/.test(String(backCh.resolvedBy || '')),
      `and the STORED contract now reads ${ASK}=${backCh.status} by "${backCh.resolvedBy}" — durable, not in-memory`);
    P((back.audit || []).some(a => /accepted by Astrid/.test(String(a.detail || ''))),
      'the stored trail still holds Astrid\'s acceptance line (it is not stripped on save)');

    HEAD('SIDE-CHECK — is the response timestamp client-supplied?');
    P(rA.response.at === '2026-08-15T09:00:00.000Z',
      'the `at` the probe compared is the one the CLIENT sent — the server stores it verbatim',
      'server stamped its own: ' + rA.response.at);
    NOTE('so any fix that orders on r.at would be ordering on a counterparty-supplied field; '
      + 'noted for the fix pass, it does not affect this finding');

  } finally {
    await h.stop();
  }
  console.log(`\n---- C2 SKEPTIC: ${pass} passed, ${fail} failed ----`);
  process.exit(0);
})().catch(e => { console.error('PROBE ERROR', e); process.exit(2); });
