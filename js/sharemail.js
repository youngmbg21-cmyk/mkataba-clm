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

/* The share email (channel email) and the Word email (channel word).
   o = { channel, purpose, sender, org, cName, recName, message, link, expires } */
function shareMailOf(o){
  const x = o || {};
  const sender = String(x.sender || '');
  const org = x.org || 'HaTi';
  const cName = x.cName || 'a contract';
  const rec = x.recName ? `, ${x.recName}` : '';
  const msg = x.message ? String(x.message).slice(0, SHARE_MAIL_NOTE_MAX) : '';
  const link = x.link == null ? null : String(x.link);
  const parts = [];
  const note = () => { if (msg){ parts.push({ k: 'msgHead', t: shareMailNoteHead(sender) }); parts.push({ k: 'msg', t: msg }); } };
  let subject;
  if (x.channel === 'word'){
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
    subject = hist ? `${sender} sent you the negotiation history of "${cName}"` : `${sender} sent you "${cName}" to mark up`;
  } else {
    const neg = x.purpose === 'negotiate';
    parts.push({ k: 'lead', t: `${sender} at ${org} has shared "${cName}" with you for review${rec}.` });
    note();
    /* The invitation matches the link. A negotiation link opens the room,
       where the verbs are per-change decisions and "ready to sign" — telling
       its recipient to "approve & sign" describes a screen they will not see. */
    parts.push({ k: 'say', t: neg
      ? 'Open the link to work through the proposed changes clause by clause — accept, refuse or discuss each one, and propose your own wording. Nothing is signed there. No account is needed:'
      : 'Open the contract to review it and respond — approve & sign, propose changes, or decline. No account is needed:' });
    parts.push({ k: 'link', t: link, at: true });
    parts.push({ k: 'foot', t: `This link expires on ${String(x.expires || '').slice(0, 10)}. Replies to this email reach ${sender} directly.` });
    subject = neg ? `${sender} sent you "${cName}" to negotiate` : `${sender} shared "${cName}" for your review`;
  }
  return { subject, parts, body: _smJoin(parts.map(p => p.k === 'link' && p.t == null ? { ...p, t: '' } : p)) };
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

const SHARE_MAIL_API = { SHARE_MAIL_NOTE_MAX, shareMailNoteHead, shareMailOf, shareWaTextOf, signerTurnMailOf };
if (typeof window !== 'undefined') Object.assign(window, SHARE_MAIL_API);
if (typeof module !== 'undefined' && module.exports) module.exports = SHARE_MAIL_API;
