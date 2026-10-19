/* ============================================================
   THE LETTER — THE EMAIL A SEND WRITES, WRITTEN ONCE
   (round 11 of the redesign: the owner picked "The letter" by name, and
   answered "1. Keep it.": the note stays the only part the sender writes,
   17 Oct 2026)
   ============================================================
   The send screen draws the email the other side will get, word for word:
   from, to, subject, the note, the invitation, their link and the foot. The
   server writes the same email when the send is pressed. Two copies of one
   letter drift — the screen would promise one sentence and the inbox receive
   another — so the words live HERE, loaded by the BROWSER and the SERVER alike
   (the js/outside.js pattern), and both hosts build from these functions.

   THIS FILE IS THE WORDING ONLY. It reads nothing, writes nothing, sends
   nothing and calls no route. Every fact arrives in its argument: who sends,
   the workspace, the contract's name, the recipient's name, the note, the
   purpose, the link and when it expires. On the screen the link does not exist
   yet (it is made by the press), so the screen passes null and draws a
   placeholder where the address will stand.

   EACH LETTER IS RETURNED TWICE: as `body`, the exact text the server mails,
   and as `parts`, the same text in pieces for the screen to draw (the note is
   a box there, and the link a mark). The body is built FROM the parts, so the
   two cannot disagree.

   Kinds of part: lead · hello · msgHead · msg · say · link · foot.
   ============================================================ */

const SHARE_MAIL_NOTE_MAX = 1000;

function _smJoin(parts){
  /* the server's own joins, kept byte for byte: each part after the lead
     starts on a blank line, the note under its heading, the link under the
     invitation */
  const out = [];
  for (const p of parts){
    if (p.k === 'lead' || p.k === 'hello') out.push(p.t);
    else if (p.k === 'msgHead') out.push(`\n${p.t}`);
    else if (p.k === 'msg') out.push(p.t);
    else if (p.k === 'link') out.push(p.t);
    else out.push(`\n${p.t}`);
  }
  return out.join('\n');
}

/* The line the note stands under in the email; the screen draws it over the
   box even while the box is empty (an empty note sends neither). */
function shareMailNoteHead(sender){ return `Message from ${sender || ''}:`; }

/* ============================================================
   THE LETTER AS DRAWN (round 11's gaps, 18 Oct 2026: the owner's "build all
   the gaps", and "1. Keep it.": the note is still the only part the sender
   writes; HaTi's part may say more, as drawn)
   ============================================================
   "Hello Anna," · the note · what this round answers ("Lindqvist & Co AB has
   answered 1 of your 2 redlines:" and a line per answer) · the button ("Open
   round 2") · what the link lets them do, and the one-time code where the
   company asks for it · the sender's sign-off ("Maria Lindgren · Legal
   counsel · Lindqvist & Co AB"). The subject names the round and who it is
   from: "Round 2 of the Master services agreement, from Lindqvist & Co AB".
   Every fact arrives in the argument; the answers are READ off the copy that
   travels (shareAnswersOf over the payload's own contract), so the screen,
   which reads the same payload, and the inbox say the same. */
const _smFirst = n => String(n || '').trim().split(/\s+/)[0] || '';
/* "the Master services agreement": a name that brings its own article keeps it */
function _smThe(name, cap, coded){
  const n = String(name || '').trim() || 'contract';
  if (coded) return n;
  const t = /^(the|a|an)\s/i.test(n) ? n.replace(/^The\s/, 'the ') : 'the ' + n;
  return cap ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}
/* THE ROUND THIS SEND OPENS: a send that hands the table over after the round
   on it was already sent once starts the next one (negoHandOver's own rule,
   negoRoundWasSent) — read off the negotiation the copy carries */
function shareRoundOf(neg){
  const n = neg || {};
  const round = Number(n.round) > 0 ? Number(n.round) : 1;
  const rs = Array.isArray(n.rounds) ? n.rounds : [];
  const since = String(n.roundAt || (round > 1 && rs.length ? ((rs[rs.length - 1] || {}).at || '') : '') || n.startedAt || '');
  const sent = !!n.turnAt && String(n.turnAt) > since;
  return (n.turn !== 'counterparty' && sent) ? round + 1 : round;
}
/* "Clause 11 · Payment terms" from a clause's own label ("11. Payment terms") */
function shareClauseParts(label){
  const l = String(label || '').replace(/\s+/g, ' ').trim();
  const m = /^(?:clause\s+)?(\d+(?:\.\d+)*)\s*[.):·—–-]?\s*(.+)$/i.exec(l);
  return m ? { n: m[1], name: m[2].trim() } : { n: '', name: l };
}
function shareClauseSay(label){
  const p = shareClauseParts(label);
  return p.n ? `Clause ${p.n} · ${p.name}` : (p.name || 'A clause');
}
/* THE FIGURE A CHANGE MOVES: the first number in `text` that `base` does not
   carry, with the word that follows it ("45 days", "75%"); null where none */
const _SM_FIG = /(\d+(?:[.,]\d+)?)(\s*%|\s+[A-Za-zÀ-ɏ]+)?/g;
function shareFigureOf(text, base){
  const had = new Set([...String(base || '').matchAll(_SM_FIG)].map(m => m[1]));
  for (const m of String(text || '').matchAll(_SM_FIG)){
    if (had.has(m[1])) continue;
    const u = String(m[2] || '').trim();
    return { n: m[1], unit: u === '%' ? '%' : u.toLowerCase() };
  }
  return null;
}
const _smFigSay = (f, bare) => !f ? '' : f.unit === '%' ? f.n + '%' : (f.unit && !bare) ? f.n + ' ' + f.unit : f.n;
/* WHAT THIS SEND ANSWERS, read off the copy that travels: their asks on the
   table this round (open, or decided since the table last changed hands —
   turnAt), and which of them this send answers (decided since, or countered by
   a change of ours that travels in it); and our own new asks. Nothing is
   written; the same reading on both hosts. */
/* `stored` (optional): the whole record the copy was made from. The copy that
   travels does not carry WHEN a change was decided (the payload is an
   allow-list, and that stays ours), so the day an answer was given is read
   from the record by id — the copy still decides WHAT travels. */
function shareAnswersOf(contract, stored){
  const ch = Array.isArray(contract && contract.changes) ? contract.changes.filter(Boolean) : [];
  const at = String(((contract && contract.negotiation) || {}).turnAt || '');
  const byId = new Map(ch.map(x => [String(x.id), x]));
  const rec = new Map((Array.isArray(stored && stored.changes) ? stored.changes : []).filter(Boolean).map(x => [String(x.id), x]));
  const decidedAt = x => String(x.resolvedAt || (rec.get(String(x.id)) || {}).resolvedAt || '');
  const ours = x => x && x.authorSide !== 'counterparty';
  const fresh = x => !at || String(x.createdAt || '') > at;
  /* never handed over in this record (no turnAt): every answer given is this send's */
  const since = x => !!decidedAt(x) && (!at || decidedAt(x) > at);
  const theirs = ch.filter(x => x.authorSide === 'counterparty' && !x.withdrawn && x.status !== 'superseded'
    && (x.status === 'pending' || x.status === 'countered' || ((x.status === 'accepted' || x.status === 'rejected') && since(x))));
  const used = new Set();
  const lines = [];
  for (const t of theirs){
    const clause = shareClauseSay(t.clauseLabel || t.clauseId);
    if ((t.status === 'accepted' || t.status === 'rejected') && since(t)){
      lines.push({ id: t.id, clause, say: t.status === 'accepted' ? 'they accept your change.' : 'they keep the current wording.' });
      continue;
    }
    const k = t.status === 'countered' ? byId.get(String(t.counteredBy || '')) : null;
    if (k && ours(k) && k.status === 'pending' && fresh(k)){
      used.add(String(k.id));
      const mine = shareFigureOf(k.newText, t.oldText), hers = shareFigureOf(t.newText, t.oldText);
      const said = mine && hers ? `they propose ${_smFigSay(mine)} (you asked for ${_smFigSay(hers, hers.unit === mine.unit && hers.unit !== '%')}).` : 'they propose new wording.';
      lines.push({ id: t.id, clause, say: said });
    }
  }
  let asked = theirs.length;
  /* a counter that SUPERSEDED their ask carries its id (counterOf); the ask
     itself does not travel, so it is counted here */
  for (const k of ch){
    if (!ours(k) || k.status !== 'pending' || !fresh(k) || !k.counterOf || used.has(String(k.id))) continue;
    if (theirs.some(t => String(t.id) === String(k.counterOf))) continue;
    used.add(String(k.id)); asked++;
    lines.push({ id: k.counterOf, clause: shareClauseSay(k.clauseLabel || k.clauseId), say: 'they propose new wording.' });
  }
  const own = ch.filter(k => ours(k) && k.status === 'pending' && fresh(k) && !used.has(String(k.id)))
    .map(k => ({ id: k.id, clause: shareClauseSay(k.clauseLabel || k.clauseId) }));
  const num = x => { const m = /^Clause (\d+)/.exec(x.clause); return m ? Number(m[1]) : 1e9; };
  lines.sort((a, b) => num(a) - num(b)); own.sort((a, b) => num(a) - num(b));
  return { asked, lines, own };
}
/* the words a link of each kind is introduced with, opened with and promises */
const SHARE_MAIL_KIND = {
  negotiate: { subj: (o, n) => `Round ${n} of ${_smThe(o.cName)}, from ${o.org}`, btn: n => `Open round ${n}`,
    line: 'You can propose changes on your own page. Nothing can be signed on this link.' },
  sign: { subj: o => `${_smThe(o.cName, true, o.coded)} to sign, from ${o.org}`, btn: () => 'Open it to sign',
    line: 'You sign this exact wording on your own page.' },
  view: { subj: o => `${_smThe(o.cName, true, o.coded)}, from ${o.org}`, btn: () => 'Open it',
    line: 'You can read it on your own page, and nothing else can be done on this link.' },
  advise: { subj: o => `Your advice on ${_smThe(o.cName, false, o.coded)}, from ${o.org}`, btn: () => 'Open the clauses',
    line: 'You see only the clauses you were asked about, and can leave notes. Nothing can be signed or changed on this link.' },
  status: { subj: o => `Where we stand on ${_smThe(o.cName, false, o.coded)}, from ${o.org}`, btn: () => 'See where we stand',
    line: 'The page shows where the deal stands: the journey, whose move it is, what is settled and what is open. It carries no wording and nothing to press.' },
  history: { subj: o => `The negotiation history of ${_smThe(o.cName, false, o.coded)}, from ${o.org}`, btn: () => 'Open the history',
    line: 'The page is the record of the negotiation: every change proposed, by whom, and what was decided. There is nothing on it to sign.' },
  /* a link stored before its kind was asked: what every such page lets them do */
  any: { subj: o => `${_smThe(o.cName, true, o.coded)}, from ${o.org}`, btn: () => 'Open it',
    line: 'You can read it and answer on your own page.' },
};
const SHARE_MAIL_CODE = 'Before the page opens, we send a one-time code to this address.';
/* The share email (channel email) and the Word email (channel word).
   o = { channel, purpose, sender, title, org, cName, recName, message, link,
         expires, round, answers, codeOn } — `answers` is shareAnswersOf's
   reading of the copy that travels, `round` shareRoundOf's. */
/* A CODE-NAMED DEAL IS NAMED BY ITS CODE AND NUMBER (round 11's gaps, second
   pass, 18 Oct 2026, the Compare's rule in every option: "the email names only
   the code name and number, for example Subject: Round 2 of Project Falcon
   (MK-0412)"). `x.code` is the deal's code name and `x.ref` its number, passed
   by both hosts from their own reading (server cnOf, browser c._codeName);
   where they are given, the real name appears nowhere in the letter. */
function shareMailNameOf(x){
  const code = String((x && x.code) || '').trim();
  if (!code) return null;
  const ref = String((x && x.ref) || '').trim();
  return ref ? `${code} (${ref})` : code;
}
function shareMailOf(o){
  const x = o || {};
  const sender = String(x.sender || '');
  const org = x.org || 'HaTi';
  const coded = shareMailNameOf(x);
  const cName = coded || x.cName || 'a contract';
  const rec = x.recName ? `, ${x.recName}` : '';
  const msg = x.message ? String(x.message).slice(0, SHARE_MAIL_NOTE_MAX) : '';
  const link = x.link == null ? null : String(x.link);
  const parts = [];
  if (x.channel === 'word'){
    const note = () => { if (msg){ parts.push({ k: 'msgHead', t: shareMailNoteHead(sender) }); parts.push({ k: 'msg', t: msg }); } };
    const hist = x.purpose === 'history';
    parts.push({ k: 'lead', t: hist
      ? `${sender} at ${org} has sent you the negotiation history of "${cName}"${rec} as a Word file.`
      : `${sender} at ${org} has sent you "${cName}"${rec} as a Word file.` });
    note();
    if (hist) parts.push({ k: 'say', t: 'The attached document is the record of the negotiation — every change proposed, by whom, and what was decided, with its own integrity check. There is nothing on it to mark up or sign.' });
    else {
      parts.push({ k: 'say', t: 'The attached document carries their proposed changes as Word tracked changes, and their notes as Word comments.' });
      parts.push({ k: 'say', t: `Mark it up in Word and send the file back to ${sender} — they will bring your changes into HaTi.` });
    }
    parts.push({ k: 'foot', t: `Replies to this email reach ${sender} directly.` });
    const subject = hist ? `${sender} sent you the negotiation history of "${cName}"` : `${sender} sent you "${cName}" to mark up`;
    return { subject, parts, body: _smJoin(parts) };
  }
  const kind = SHARE_MAIL_KIND[x.purpose] || SHARE_MAIL_KIND.any;
  const round = Number(x.round) > 0 ? Number(x.round) : 1;
  const first = _smFirst(x.recName);
  parts.push({ k: 'hello', t: first ? `Hello ${first},` : 'Hello,' });
  if (msg) parts.push({ k: 'msg', t: msg });
  const A = (x.purpose === 'negotiate' && x.answers) ? x.answers : null;
  if (A && A.lines && A.lines.length){
    const k = A.lines.length, m = Math.max(A.asked || 0, k);
    parts.push({ k: 'say', t: m === 1 ? `${org} has answered your redline:` : `${org} has answered ${k} of your ${m} redlines:`, list: 'ans' });
    for (const l of A.lines) parts.push({ k: 'ans', t: `${l.clause}: ${l.say}`, clause: l.clause, rest: l.say });
  }
  if (A && A.own && A.own.length){
    const n = A.own.length;
    parts.push({ k: 'say', t: `${org} ${A.lines && A.lines.length ? 'also ' : ''}proposes ${n === 1 ? 'a change' : n + ' changes'} of its own:`, list: 'own' });
    for (const l of A.own) parts.push({ k: 'ans', t: `${l.clause}.`, clause: l.clause, rest: '' });
  }
  parts.push({ k: 'btn', t: kind.btn(round) });
  parts.push({ k: 'link', t: link, at: true });
  parts.push({ k: 'say', t: kind.line + (x.codeOn && x.purpose !== 'status' ? ' ' + SHARE_MAIL_CODE : '') });
  parts.push({ k: 'foot', t: [sender, String(x.title || '').trim(), org].filter(Boolean).join(' · ') });
  /* a code-named deal: the code and number only, as drawn ("Round 2 of
     Project Falcon (MK-0412)") — a proper name takes no "the" */
  const subject = coded
    ? (x.purpose === 'negotiate' ? `Round ${round} of ${coded}` : kind.subj({ cName: coded, org, coded: true }, round))
    : kind.subj({ cName, org }, round);
  return { subject, parts, body: _smLetterJoin(parts), html: _smLetterHtml(parts) };
}
/* THE LETTER'S JOINS: a blank line between its blocks; the answers under
   their line; the address under the button's words */
function _smLetterJoin(parts){
  const out = [];
  for (const p of parts){
    const t = p.t == null ? '' : p.t;
    if (p.k === 'ans' || p.k === 'link') out.push('\n' + t);
    else if (p.k === 'btn') out.push((out.length ? '\n\n' : '') + t + ':');
    else out.push((out.length ? '\n\n' : '') + t);
  }
  return out.join('');
}
/* AND THE SAME LETTER AS HTML, for the inbox that draws one: the button a
   button. A standalone document carries no :root — literal values only. */
function _smLetterHtml(parts){
  const e = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const link = (parts.find(p => p.k === 'link') || {}).t;
  const out = [];
  for (let i = 0; i < parts.length; i++){
    const p = parts[i];
    if (p.k === 'link') continue;
    if (p.k === 'ans'){
      const run = [];
      while (i < parts.length && parts[i].k === 'ans'){ run.push(parts[i]); i++; }
      i--;
      out.push(`<div style="margin:0 0 14px;padding:2px 0 2px 12px;border-left:3px solid #d0d5dd">${run.map(r =>
        `<p style="margin:0 0 4px"><b>${e(r.clause)}${r.rest ? ':' : '.'}</b>${r.rest ? ' ' + e(r.rest) : ''}</p>`).join('')}</div>`);
    } else if (p.k === 'btn'){
      out.push(link ? `<p style="margin:0 0 14px"><a href="${e(link)}" style="display:inline-block;background:#0b7a5f;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:6px;font-weight:600">${e(p.t)}</a></p>`
        : `<p style="margin:0 0 14px"><b>${e(p.t)}</b></p>`);
    } else if (p.k === 'msg'){
      out.push(`<p style="margin:0 0 14px;white-space:pre-wrap">${e(p.t)}</p>`);
    } else if (p.k === 'foot'){
      out.push(`<p style="margin:18px 0 0;color:#667085">${e(p.t)}</p>`);
    } else out.push(`<p style="margin:0 0 ${p.list ? 6 : 14}px">${e(p.t)}</p>`);
  }
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#1f2933;max-width:600px">${out.join('')}</div>`;
}

/* The text a WhatsApp send opens with (the browser composes it; the server
   mails nothing on that channel). o = { sender, org, cName, message, link,
   expires } — expires may be null. Its own joins: blank lines between. */
function shareWaTextOf(o){
  const x = o || {};
  const parts = [{ k: 'lead', t: `${x.sender || ''} at ${x.org || ''} shared "${x.cName || ''}" for your review.` }];
  if (x.message) parts.push({ k: 'msg', t: String(x.message) });
  parts.push({ k: 'say', t: 'Open it here — review, sign, request changes or decline, no account needed:' });
  parts.push({ k: 'link', t: x.link == null ? null : String(x.link), at: true });
  if (x.expires) parts.push({ k: 'foot', t: `This link expires on ${String(x.expires).slice(0, 10)}.` });
  const body = parts[0].t
    + (x.message ? `\n\n${String(x.message)}` : '')
    + `\n\n${parts.find(p => p.k === 'say').t}\n${x.link == null ? '' : String(x.link)}`
    + (x.expires ? `\n\n${parts[parts.length - 1].t}` : '');
  return { subject: '', parts, body };
}

/* The email a signing link bound to one of THEIR signers sends — their turn,
   in their language (the server's langForEmail, else the sender's). The words
   are the books' (mail_*), so `t(key, vars)` is the host's translator for
   that language; `codeOn` is whether this server can send the one-time code;
   `stepOf(row)` is the host's signing step (srvSignStep · signStepOf).
   o = { signer, plan, cName, org, them, link, expiresAt, t, codeOn, stepOf } */
function signerTurnMailOf(o){
  const x = o || {};
  const t = typeof x.t === 'function' ? x.t : (k => k);
  const stepOf = typeof x.stepOf === 'function' ? x.stepOf : (r => Number(r && r.order) || 0);
  const signer = x.signer || {};
  const cName = x.cName || 'a contract';
  const org = x.org || 'the sender';
  const plan = Array.isArray(x.plan) ? x.plan : [];
  const total = plan.length;
  const posText = signer.order && total ? t('mail_turn_pos', { n: signer.order, total }) : '';
  /* THE WHOLE ORDER, NAMED (7 Oct 2026, O-28): who signs before and after
     them, for which side, so nobody opens a link expecting to sign and finds
     somebody else's turn. Names and sides only; never an address. */
  const them = x.them || '';
  const rows = plan.slice().sort((a, b) => stepOf(a) - stepOf(b) || (a.order || 0) - (b.order || 0));
  const order = rows.length > 1 ? t('mail_turn_order', { list: rows.map((r, i) =>
    `${i + 1}. ${String(r.id) === String(signer.id) ? t('mail_turn_you') : (r.name || '—')}`
    + ` (${r.party === 'counterparty' ? (them || '—') : org})`).join(' · ') }) : '';
  const parts = [{ k: 'hello', t: `${t('mail_hello')}${signer.name ? ' ' + signer.name : ''},` },
    { k: 'say', t: t('mail_turn_body', { name: cName, org, pos: posText }) }];
  if (order) parts.push({ k: 'say', t: order, order: true });
  parts.push({ k: 'say', t: t('mail_open_link'), open: true });
  parts.push({ k: 'link', t: x.link == null ? null : String(x.link), at: true });
  /* ONLY WHAT IS TRUE (B9, 8 Oct 2026): the code is sent only where this
     server can send mail (the respond route asks for it exactly then). */
  parts.push({ k: 'say', t: t(x.codeOn ? 'mail_code_note' : 'mail_link_personal') });
  if (x.expiresAt) parts.push({ k: 'foot', t: t('mail_link_expires', { date: String(x.expiresAt).slice(0, 10) }) });
  parts.push({ k: 'foot', t: t('mail_automated_notice') });
  const P = k => parts.find(p => p.k === k);
  const say = parts.filter(p => p.k === 'say');
  const feet = parts.filter(p => p.k === 'foot');
  const body = `${P('hello').t}\n\n`
    + say[0].t
    + (order ? '\n\n' + order : '')
    + `\n\n${say.find(p => p.open).t}\n${x.link == null ? '' : String(x.link)}\n\n`
    + say[say.length - 1].t
    + (x.expiresAt ? `\n\n${feet[0].t}` : '')
    + `\n\n${feet[feet.length - 1].t}`;
  return { subject: t('mail_turn_subject', { name: cName }), parts, body };
}

const SHARE_MAIL_API = { SHARE_MAIL_NOTE_MAX, shareMailNoteHead, shareMailNameOf, shareMailOf, shareWaTextOf, signerTurnMailOf,
  shareRoundOf, shareClauseParts, shareClauseSay, shareFigureOf, shareAnswersOf, SHARE_MAIL_KIND, SHARE_MAIL_CODE };
if (typeof window !== 'undefined') Object.assign(window, SHARE_MAIL_API);
if (typeof module !== 'undefined' && module.exports) module.exports = SHARE_MAIL_API;
