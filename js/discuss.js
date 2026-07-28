// HaTi — talking about a contract, as distinct from changing it.
// Globals are window-attached like every module (see components.js).
//
// The second-worst friction the third UX review found: the negotiation only
// spoke in formal rounds. Answering "Net-30 stands, or a 2% price increase"
// with "would you take Net-45?" meant opening the clause editor, editing the
// clause to say Net-45, attaching a reason, submitting a round, having it
// reviewed and having it decided — six steps to say one sentence. And a plain
// question about a clause nobody wanted to change ("does clause 7 include
// cold-chain transport?") had no home at all: the only ways to ask were the
// single comment box for a whole round, or a fake edit to a clause the reader
// did not actually want to touch. Price haggling is the most common exchange
// in any negotiation and it was the heaviest thing in the product.
//
// A MESSAGE is the light half of that. It is attached to a POINT — a still-open
// ask, a clause, or the contract as a whole — and it carries no proposed text,
// opens no round, moves no document state and closes nothing. Proposing wording
// stays the formal act; talking about it stops being one.
//
// Both sides render from this one module, because a conversation that reads
// differently at each end is two conversations.

/* ---------- topics ---------- */
/* What a message can be attached to. The list is built from the document the
   reader is actually looking at, so "clause 5" means the clause they can see. */
const DISCUSS_GENERAL = 'general';
function discussClauseKey(line, i){
  const pre = (window.docClausePrefix ? docClausePrefix(line) : '') || '';
  // a clause number is literal text in this product and stable across rounds,
  // which makes it a better handle than a line index that shifts the moment a
  // clause is inserted above it
  return pre ? 'clause:' + pre.replace(/\s+$/, '') : 'clause:#' + i;
}
const discussTrim = (s, n) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1) + '…' : t;
};
function discussTopics(c, text){
  const out = [{ value: DISCUSS_GENERAL, label: 'The contract generally' }];
  const points = (c && c.openPoints) || (window.openPointsFor && c ? openPointsFor(c) : []) || [];
  for (const pt of points)
    out.push({ value: 'point:' + pt.id, kind: 'point',
      label: 'Still open — ' + discussTrim(pt.after || pt.before, 60) });
  const lines = String(text || '').split('\n').filter(l => l.trim());
  for (let i = 0; i < lines.length; i++){
    if (window.docLineKind && docLineKind(lines[i]) === 'heading') continue;
    out.push({ value: discussClauseKey(lines[i], i), kind: 'clause', label: discussTrim(lines[i], 70) });
  }
  // two clauses can share a number in a malformed document; one entry each
  const seen = new Set();
  return out.filter(o => (seen.has(o.value) ? false : (seen.add(o.value), true)));
}
/* The label a message was filed against, for reading it back. Held on the
   message itself rather than looked up: the clause it was about may have been
   renegotiated away since, and "a question about something that no longer
   exists" is still a question that was asked. */
function discussTopicLabel(topics, value){
  const hit = (topics || []).find(t => t.value === value);
  return hit ? hit.label : (value === DISCUSS_GENERAL ? 'The contract generally' : value);
}

/* ---------- reading the thread ---------- */
function discussGroups(messages){
  const map = new Map();
  for (const m of (messages || [])){
    const k = m.topic || DISCUSS_GENERAL;
    if (!map.has(k)) map.set(k, { topic: k, label: m.topicLabel || null, messages: [] });
    const g = map.get(k);
    if (m.topicLabel) g.label = m.topicLabel;      // newest label wins
    g.messages.push(m);
  }
  return [...map.values()];
}
const discussUnansweredBy = (messages, side) => {
  const groups = discussGroups(messages);
  let n = 0;
  for (const g of groups){
    const last = g.messages[g.messages.length - 1];
    if (last && last.side !== side) n++;
  }
  return n;
};

/* ---------- the shared rendering ----------
   `mine` is which side is reading, so each message is attributed the way that
   reader would say it out loud. */
/* ---- who can read this ----
   A message carries a visibility, and the badge is drawn from it wherever the
   bubble is drawn — this component renders on the owner's screen, in the
   negotiation room and on the counterparty's portal, and a thread that reported
   its own privacy differently in three places would be worse than one that
   never mentioned it.

   ABSENT MEANS SHARED, and only here. Every message written before this field
   existed did travel to the other side, so reading a missing value as internal
   would relabel the entire history of every contract as private — a claim that
   is false and that a reader would reasonably act on. The safe default runs the
   other way at the WRITE end (js/negotiation.js), which is where a forgotten
   field could still cause a leak. */
const DISCUSS_SHARED = 'shared';
const DISCUSS_INTERNAL = 'internal';
const discussIsInternal = m => !!m && m.visibility === DISCUSS_INTERNAL;
function discussVisBadgeHtml(m){
  const internal = discussIsInternal(m);
  const pal = internal
    ? 'background:#f4ecd8;color:#8a6a2a;border:1px solid rgba(138,106,42,.3)'
    : 'background:var(--color-accent-100);color:var(--color-accent-800);border:1px solid var(--color-accent-300)';
  return `<span style="display:inline-flex;align-items:center;gap:4px;font-size:9.5px;font-weight:700;
    letter-spacing:.04em;border-radius:999px;padding:2px 7px;white-space:nowrap;${pal}">${
    internal ? '🔒 Internal only' : '🌐 Shared with counterparty'}</span>`;
}

function discussBubbleHtml(m, mine){
  const isMine = m.side === mine;
  const e = window.esc || (s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
  const when = window.fmtDT ? fmtDT(m.at) : String(m.at || '');
  const internal = discussIsInternal(m);
  return `
    <div style="display:flex;flex-direction:column;gap:2px;align-items:${isMine ? 'flex-end' : 'flex-start'}">
      <div style="font-size:10px;color:var(--color-neutral-500);font-family:var(--font-mono);display:flex;align-items:center;gap:6px;flex-wrap:wrap">${e(m.author)}${when ? ` · ${when}` : ''}${
        internal ? ' ' + discussVisBadgeHtml(m) : ''}</div>
      <div style="max-width:92%;border:1px solid ${internal ? 'rgba(138,106,42,.35)' : (isMine ? 'var(--color-divider)' : 'var(--color-accent-300)')};background:${internal ? '#fdfaf1' : (isMine ? 'var(--color-bg)' : 'var(--color-accent-100)')};border-radius:7px;padding:8px 11px;font-size:12px;line-height:1.55;color:var(--color-neutral-800);white-space:pre-wrap">${e(m.body)}</div>
    </div>`;
}
/* The whole panel: what has been said, grouped by what it is about, and one
   box to say the next thing. `idp` prefixes the element ids so the owner's
   copy and the counterparty's copy can never collide on one page. */
function discussPanelHtml(opts){
  const { messages, topics, mine, idp, title, blurb, disabled, disabledNote } = opts;
  const e = window.esc || (s => String(s == null ? '' : s));
  const groups = discussGroups(messages);
  const waiting = discussUnansweredBy(messages, mine);
  const body = groups.length ? `
    <div style="display:flex;flex-direction:column;gap:13px;margin-bottom:14px">
      ${groups.map(g => `
        <div data-discuss-topic="${e(g.topic)}" style="border-left:2px solid var(--color-divider);padding-left:11px;display:flex;flex-direction:column;gap:6px">
          <div style="font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500)">${e(g.label || discussTopicLabel(topics, g.topic))}</div>
          ${g.messages.map(m => discussBubbleHtml(m, mine)).join('')}
        </div>`).join('')}
    </div>` : `
    <p style="margin:0 0 13px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">Nothing here yet. Use this to ask a question or answer one — it does not change the contract and it does not open a round.</p>`;
  const options = (topics || []).map(t =>
    `<option value="${e(t.value)}">${e(t.label)}</option>`).join('');
  const composer = disabled ? `
    <div style="border:1px solid var(--color-divider);background:var(--color-bg);border-radius:5px;padding:9px 12px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">${e(disabledNote || 'This conversation is closed.')}</div>` : `
    <div style="border-top:1px solid var(--color-divider);padding-top:12px">
      <label style="display:block;margin-bottom:7px">
        <span style="display:block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:4px">What is this about?</span>
        <select id="${idp}-topic" style="width:100%;font:inherit;font-size:12px;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:7px 9px;color:inherit">${options}</select>
      </label>
      <textarea id="${idp}-body" rows="2" placeholder="e.g. Would you take Net-45?" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:5px;padding:8px 11px;font:inherit;font-size:12.5px;outline:none;resize:vertical"></textarea>
      <div style="display:flex;align-items:center;gap:9px;margin-top:8px;flex-wrap:wrap">
        <span style="flex:1;min-width:140px;font-size:11px;color:var(--color-neutral-600);line-height:1.45">This sends a message, not a change. To propose new wording, use the redline.</span>
        <button id="${idp}-send" class="ui-btn ui-btn-primary" style="flex:none;font-size:12px;padding:7px 14px">Send</button>
      </div>
      <div id="${idp}-out" style="margin-top:9px"></div>
    </div>`;
  return `
    <div id="${idp}-panel" style="border:1px solid var(--color-divider);background:var(--color-surface);border-radius:8px;padding:14px 18px;margin:0 0 18px;box-shadow:var(--shadow-sm)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:11px;flex-wrap:wrap">
        <span style="flex:none;color:var(--color-accent);display:inline-flex">${window.icon ? icon('msg', 'w-4 h-4') : ''}</span>
        <span style="font-size:13px;font-weight:600">${e(title || 'Open points — talk it through')}</span>
        ${waiting ? `<span style="font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;background:#fbf4e3;color:#7d5a14;border-radius:999px;padding:2px 9px">${waiting} awaiting your reply</span>` : ''}
        <span style="margin-left:auto;font-size:10.5px;color:var(--color-neutral-500);font-family:var(--font-mono)">${(messages || []).length} message${(messages || []).length === 1 ? '' : 's'}</span>
      </div>
      ${blurb ? `<p style="margin:0 0 11px;font-size:11.5px;line-height:1.55;color:var(--color-neutral-600)">${e(blurb)}</p>` : ''}
      ${body}
      ${composer}
    </div>`;
}
/* ---- answering where the argument is ----
   The panel above is the general channel, and on its own it was not enough. A
   reader meets a disagreement in the "Still open between us" card — "Net-30
   stands, or a 2% price increase" — and that card had no way to answer it: its
   instruction was to press Propose edits, the six-step formal route this whole
   module exists to avoid. Using the light route meant scrolling away from the
   thing being answered and finding it again in a dropdown of every clause in
   the contract, whose default was the wrong one.

   This is the same conversation as the panel — same store, same topics — put
   where the sentence is actually read. Both sides embed it in their own card,
   so neither has to rebuild what a still-open point looks like. */
function discussPointReplyHtml(topic, messages, opts){
  const { idp, mine, placeholder, disabled, disabledNote } = opts || {};
  const e = window.esc || (s => String(s == null ? '' : s));
  const on = (messages || []).filter(m => (m.topic || DISCUSS_GENERAL) === topic);
  const last = on[on.length - 1];
  const theirTurn = last && last.side !== mine;
  const thread = on.length ? `
    <div style="display:flex;flex-direction:column;gap:6px;margin:8px 0 0">
      ${on.map(m => discussBubbleHtml(m, mine)).join('')}
    </div>` : '';
  if (disabled) return thread + (disabledNote ? `
    <div style="margin-top:7px;font-size:11px;color:var(--color-neutral-600)">${e(disabledNote)}</div>` : '');
  return `${thread}
    <div style="display:flex;gap:6px;align-items:center;margin-top:8px;flex-wrap:wrap">
      <input data-point-body="${e(idp)}" type="text" placeholder="${e(placeholder || 'Reply on this point — a sentence, not a redraft')}"
        style="flex:1;min-width:150px;border:1px solid var(--color-divider);border-radius:5px;padding:7px 10px;font:inherit;font-size:11.5px;background:var(--color-surface);outline:none"/>
      <button data-point-send="${e(idp)}" data-point-topic="${e(topic)}" data-point-label="${e((opts&&opts.label)||'')}" class="ui-btn" style="flex:none;font-size:11px;padding:6px 12px">Send</button>
    </div>
    <div data-point-out="${e(idp)}" style="margin-top:6px"></div>
    ${on.length && !theirTurn ? `<div style="margin-top:5px;font-size:10.5px;color:var(--color-neutral-500)">Sent — waiting on them.</div>` : ''}`;
}
/* Wire every point card on the page at once. `send` is the same function the
   general composer uses, so a reply from here and a reply from there are the
   same kind of thing and land in the same thread. */
function wireDiscussPoints(opts){
  const { send, onSent } = opts || {};
  document.querySelectorAll('[data-point-send]').forEach(btn => {
    const idp = btn.getAttribute('data-point-send');
    btn.addEventListener('click', async () => {
      const input = document.querySelector(`[data-point-body="${idp}"]`);
      const out = document.querySelector(`[data-point-out="${idp}"]`);
      const body = String(input && input.value || '').trim();
      if (!body){ if (window.toast) toast('Write your reply first', 'err'); return; }
      const restore = btn.innerHTML;
      btn.disabled = true; btn.innerHTML = 'Sending…';
      try {
        const res = await send(btn.getAttribute('data-point-topic') || idp,
          btn.getAttribute('data-point-label') || '', body);
        if (input) input.value = '';
        if (onSent) onSent(res);
      } catch (e){
        if (out) out.innerHTML = `<div style="border:1px solid #e3c4bf;background:#f9ecea;border-radius:5px;padding:7px 10px;font-size:11px;line-height:1.5;color:#8f322b"><b>Not sent.</b> ${(window.esc ? esc(e.message) : e.message) || 'Something went wrong.'} Your reply is still in the box.</div>`;
        if (window.toast) toast(e.message || 'Could not send that reply', 'err');
      }
      btn.disabled = false; btn.innerHTML = restore;
    });
  });
}

/* Wire the composer. `send(topic, topicLabel, body)` does the posting and
   returns the refreshed message list; everything else here is the same on both
   sides, which is why it lives in one place. */
function wireDiscussPanel(opts){
  const { idp, topics, send, onSent } = opts;
  const btn = document.getElementById(idp + '-send');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const sel = document.getElementById(idp + '-topic');
    const ta = document.getElementById(idp + '-body');
    const out = document.getElementById(idp + '-out');
    const body = String(ta && ta.value || '').trim();
    if (!body){ if (window.toast) toast('Write your message first', 'err'); return; }
    const topic = sel ? sel.value : DISCUSS_GENERAL;
    const restore = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = 'Sending…';
    try {
      const res = await send(topic, discussTopicLabel(topics, topic), body);
      if (ta) ta.value = '';
      if (onSent) onSent(res);
    } catch (e){
      // nothing was recorded, so the box keeps what they wrote
      if (out) out.innerHTML = `<div style="border:1px solid #e3c4bf;background:#f9ecea;border-radius:5px;padding:9px 11px;font-size:11.5px;line-height:1.5;color:#8f322b"><b>Not sent.</b> ${(window.esc ? esc(e.message) : e.message) || 'Something went wrong.'} Your message is still in the box.</div>`;
      if (window.toast) toast(e.message || 'Could not send that message', 'err');
    }
    btn.disabled = false; btn.innerHTML = restore;
  });
}

if (typeof window !== 'undefined') Object.assign(window, {
  DISCUSS_GENERAL, DISCUSS_SHARED, DISCUSS_INTERNAL, discussIsInternal, discussVisBadgeHtml,
  discussTopics, discussTopicLabel, discussClauseKey, discussGroups,
  discussUnansweredBy, discussBubbleHtml, discussPanelHtml, wireDiscussPanel, discussTrim,
  discussPointReplyHtml, wireDiscussPoints });
