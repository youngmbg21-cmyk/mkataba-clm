/* ============================================================
   HaTi CLM — backend server (MVP "real engine")
   Express + built-in node:sqlite. Serves the frontend and a JSON
   API for auth, team, contract storage and counterparty shares.
   Run:  npm install && npm start   (http://localhost:3000)
   ============================================================ */
const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.HATI_DATA || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'hati.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin','legal','viewer')),
    salt TEXT NOT NULL, hash TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, json TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS shares (
    token TEXT PRIMARY KEY, payload TEXT NOT NULL,
    response TEXT, applied INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY, name TEXT, mime TEXT, data TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS outbox (
    id TEXT PRIMARY KEY, to_addr TEXT, subject TEXT, body TEXT,
    sent INTEGER NOT NULL DEFAULT 0, provider TEXT, dev_hint TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS share_otp (
    token TEXT PRIMARY KEY, email TEXT, code_hash TEXT, verify TEXT, verified INTEGER DEFAULT 0, expires INTEGER);
  CREATE TABLE IF NOT EXISTS resets (
    id TEXT PRIMARY KEY, user_id TEXT, token_hash TEXT, expires INTEGER, used INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS reminders (rkey TEXT PRIMARY KEY, created_at TEXT);
  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY, json TEXT NOT NULL,
    name TEXT, counterparty TEXT, folder TEXT, status TEXT, value REAL, expiry TEXT, is_upload INTEGER,
    seq INTEGER, version INTEGER NOT NULL DEFAULT 1, updated_at TEXT);
  CREATE INDEX IF NOT EXISTS idx_contracts_folder ON contracts(folder);
  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_seq ON contracts(seq);
`);

const now = () => new Date().toISOString();
const rid = (n=24) => crypto.randomBytes(n).toString('hex');
const hashPw = (pw, salt) => crypto.scryptSync(String(pw), salt, 64).toString('hex');
const safeEq = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

const getSetting = k => { const r = db.prepare('SELECT json FROM settings WHERE key=?').get(k); return r ? JSON.parse(r.json) : null; };
const setSetting = (k, v) => db.prepare('INSERT INTO settings (key,json) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET json=excluded.json').run(k, JSON.stringify(v));
const getStore = k => { const r = db.prepare('SELECT json FROM store WHERE key=?').get(k); return r ? JSON.parse(r.json) : null; };
const setStore = (k, v) => db.prepare('INSERT INTO store (key,json) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET json=excluded.json').run(k, JSON.stringify(v));
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.created_at });

/* ---------- per-contract storage (scales to large portfolios) ----------
   Each contract is its own row with its own version. Lists return a light
   summary (heavy fields stripped) so a client never has to load thousands of
   full bodies; the full record loads on open, and a save touches one row. */
const HEAVY = c => { // strip the big fields for list/index responses
  const x = { ...c };
  if (x.execution) x.execution = { ...x.execution, html: undefined };
  if (x.upload) x.upload = { ...x.upload, dataUrl: undefined, extractedText: undefined };
  x.comments = undefined; x.audit = undefined;
  x._light = true;
  return x;
};
function upsertContract(c, version) {
  const j = JSON.stringify(c);
  db.prepare(`INSERT INTO contracts (id,json,name,counterparty,folder,status,value,expiry,is_upload,seq,version,updated_at)
    VALUES (@id,@json,@name,@counterparty,@folder,@status,@value,@expiry,@is_upload,@seq,@version,@updated_at)
    ON CONFLICT(id) DO UPDATE SET json=excluded.json, name=excluded.name, counterparty=excluded.counterparty,
      folder=excluded.folder, status=excluded.status, value=excluded.value, expiry=excluded.expiry,
      is_upload=excluded.is_upload, version=excluded.version, updated_at=excluded.updated_at`).run({
    id: c.id, json: j, name: c.name || '', counterparty: c.counterparty || '', folder: c.folder || '',
    status: c.status || '', value: Number(c.value) || 0, expiry: c.expiry || null, is_upload: c.source === 'upload' ? 1 : 0,
    seq: c._seq != null ? c._seq : nextSeq(), version, updated_at: now(),
  });
}
function txn(fn) { db.exec('BEGIN'); try { fn(); db.exec('COMMIT'); } catch (e) { try { db.exec('ROLLBACK'); } catch (_) {} throw e; } }
let seqCounter = null;
function nextSeq() {
  if (seqCounter == null) { const r = db.prepare('SELECT MAX(seq) m FROM contracts').get(); seqCounter = (r && r.m) || 0; }
  return ++seqCounter;
}
// One-time migration: split a legacy single-blob workspace into per-contract rows.
function migrateBlobIfNeeded() {
  const have = db.prepare('SELECT COUNT(*) n FROM contracts').get().n;
  const blob = getStore('data');
  if (have === 0 && blob && Array.isArray(blob.contracts) && blob.contracts.length) {
    let seq = 0;
    txn(() => {
      for (const c of blob.contracts) { c._seq = ++seq; upsertContract(c, 1); }
      setSetting('uid', blob.uid || 100);
      if (blob.settings) setSetting('appSettings', blob.settings);
      seqCounter = seq;
    });
  }
}
migrateBlobIfNeeded();

const app = express();
app.set('trust proxy', true);          // so req.ip reflects the client behind a proxy
app.use(express.json({ limit: '15mb' }));
const clientIp = req => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || null;
const sha = s => crypto.createHash('sha256').update(String(s)).digest('hex');
const code6 = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');

/* ---------- email (pluggable) ----------
   With RESEND_API_KEY set, transactional email is delivered via Resend.
   Without it, mail is queued to the outbox table so the flow still works and
   an admin can read what would have been sent (including dev codes) — the
   single place a key turns this from demo into production email. */
const EMAIL_ON = () => !!process.env.RESEND_API_KEY;
async function sendEmail(to, subject, body, devHint) {
  const id = 'e_' + rid(8), at = now();
  let sent = 0, provider = 'outbox';
  if (EMAIL_ON()) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || 'HaTi <onboarding@resend.dev>', to: [to], subject, text: body }),
      });
      if (r.ok) { sent = 1; provider = 'resend'; } else provider = 'resend-http-' + r.status;
    } catch (e) { provider = 'resend-error'; }
  }
  db.prepare('INSERT INTO outbox (id,to_addr,subject,body,sent,provider,dev_hint,created_at) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, to || '', subject, body, sent, provider, EMAIL_ON() ? null : (devHint || null), at);
  return { id, sent, provider };
}

/* ---------- session handling (httpOnly cookie) ---------- */
const COOKIE = 'hati_session';
function readSession(req) {
  const raw = req.headers.cookie || '';
  const m = raw.split(/;\s*/).find(c => c.startsWith(COOKIE + '='));
  if (!m) return null;
  const token = m.slice(COOKIE.length + 1);
  const s = db.prepare('SELECT * FROM sessions WHERE token=?').get(token);
  if (!s) return null;
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(s.user_id);
  return u ? { token, user: u } : null;
}
function setCookie(res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${60*60*24*30}; SameSite=Lax`);
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}
const auth = (req, res, next) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Not signed in' });
  req.user = s.user; req.token = s.token; next();
};
const editor = (req, res, next) => {
  if (req.user.role === 'viewer') return res.status(403).json({ error: 'Viewers have read-only access' });
  next();
};
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

/* ---------- status & auth ---------- */
app.get('/api/status', (req, res) => {
  const org = getSetting('org');
  res.json({ mode: 'api', setup: !!org, orgName: org?.name || null, authed: !!readSession(req) });
});

app.post('/api/setup', (req, res) => {
  if (getSetting('org')) return res.status(409).json({ error: 'Workspace already exists' });
  const { org, name, email, password, data } = req.body || {};
  if (!org || !name || !email) return res.status(400).json({ error: 'Organization, name and email are required' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const salt = rid(16);
  const u = { id: 'u_' + rid(8), name, email: String(email).toLowerCase(), role: 'admin', salt, hash: hashPw(password, salt), created_at: now() };
  setSetting('org', { name: org, createdAt: now() });
  db.prepare('INSERT INTO users (id,name,email,role,salt,hash,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(u.id, u.name, u.email, u.role, u.salt, u.hash, u.created_at);
  if (data && Array.isArray(data.contracts)) {   // seed per-contract
    let seq = 0;
    txn(() => {
      for (const c of data.contracts) { c._seq = ++seq; upsertContract(c, 1); }
      setSetting('uid', data.uid || 100);
      if (data.settings) setSetting('appSettings', data.settings);
      seqCounter = seq;
    });
  }
  const token = rid();
  db.prepare('INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)').run(token, u.id, now());
  setCookie(res, token);
  res.json({ ok: true, me: publicUser(u) });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(String(email || '').toLowerCase());
  if (!u || !safeEq(hashPw(password || '', u.salt), u.hash))
    return res.status(401).json({ error: 'Email or password is incorrect' });
  const token = rid();
  db.prepare('INSERT INTO sessions (token,user_id,created_at) VALUES (?,?,?)').run(token, u.id, now());
  setCookie(res, token);
  res.json({ ok: true, me: publicUser(u) });
});

app.post('/api/logout', auth, (req, res) => {
  db.prepare('DELETE FROM sessions WHERE token=?').run(req.token);
  clearCookie(res);
  res.json({ ok: true });
});

/* ---------- bootstrap & contract data ---------- */
// Bootstrap no longer ships every full contract — just the workspace shell.
// The contract list loads separately (paginated / summary), full bodies on open.
app.get('/api/bootstrap', auth, (req, res) => {
  res.json({
    org: getSetting('org'),
    me: publicUser(req.user),
    users: db.prepare('SELECT * FROM users ORDER BY created_at').all().map(publicUser),
    uid: getSetting('uid') || 100,
    settings: getSetting('appSettings') || {},
    count: db.prepare('SELECT COUNT(*) n FROM contracts').get().n,
    aiConfigured: !!(getSetting('aiKey') || process.env.ANTHROPIC_API_KEY),
  });
});

// Portfolio-wide aggregates computed in SQL — O(1) client cost at any scale.
app.get('/api/stats', auth, (req, res) => {
  const g = db.prepare(`SELECT
      COALESCE(SUM(CASE WHEN status!='Declined' THEN value ELSE 0 END),0) totalValue,
      SUM(status='Under Review') pending, SUM(status='Signed') signed,
      SUM(status='Declined') declined, SUM(status='Draft') drafts, COUNT(*) total
    FROM contracts`).get();
  const byFolder = db.prepare(`SELECT folder, COUNT(*) n,
      COALESCE(SUM(CASE WHEN status!='Declined' THEN value ELSE 0 END),0) val,
      SUM(status='Under Review') pending FROM contracts GROUP BY folder`).all();
  res.json({ ...g, byFolder });
});

// Paginated, filterable, searchable list of SUMMARY rows (heavy fields stripped).
app.get('/api/contracts', auth, (req, res) => {
  const { folder, status, q } = req.query;
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  const offset = Math.max(0, Number(req.query.offset) || 0);
  const where = [], args = {};
  if (folder) { where.push('folder=@folder'); args.folder = folder; }
  if (status) { where.push('status=@status'); args.status = status; }
  if (q) { where.push('(lower(name) LIKE @q OR lower(counterparty) LIKE @q OR lower(id) LIKE @q)'); args.q = '%' + String(q).toLowerCase() + '%'; }
  const w = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = db.prepare(`SELECT COUNT(*) n FROM contracts ${w}`).get(args).n;
  const rows = db.prepare(`SELECT json, version FROM contracts ${w} ORDER BY seq DESC LIMIT @limit OFFSET @offset`)
    .all({ ...args, limit, offset })
    .map(r => { const c = JSON.parse(r.json); c._v = r.version; return HEAVY(c); });
  res.json({ total, offset, limit, rows });
});

app.get('/api/contracts/:id', auth, (req, res) => {
  const r = db.prepare('SELECT json, version FROM contracts WHERE id=?').get(req.params.id);
  if (!r) return res.status(404).json({ error: 'Contract not found' });
  const c = JSON.parse(r.json); c._v = r.version;
  res.json(c);
});

// Save ONE contract with its own optimistic-lock version.
app.put('/api/contracts/:id', auth, editor, (req, res) => {
  const { contract, baseVersion } = req.body || {};
  if (!contract || contract.id !== req.params.id) return res.status(400).json({ error: 'Contract id mismatch' });
  const existing = db.prepare('SELECT version FROM contracts WHERE id=?').get(req.params.id);
  const cur = existing ? existing.version : 0;
  if (Number(baseVersion || 0) !== cur) return res.status(409).json({ error: 'Version conflict — this contract changed on the server', version: cur });
  const next = cur + 1;
  const c = { ...contract }; delete c._v; delete c._light; delete c._loaded;
  if (existing) { const r = db.prepare('SELECT seq FROM contracts WHERE id=?').get(req.params.id); c._seq = r.seq; }
  else c._seq = nextSeq();
  upsertContract(c, next);
  if (req.body.uid) setSetting('uid', req.body.uid);
  res.json({ ok: true, version: next });
});

app.delete('/api/contracts/:id', auth, editor, (req, res) => {
  db.prepare('DELETE FROM contracts WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

app.put('/api/settings', auth, admin, (req, res) => {
  setSetting('appSettings', req.body || {});
  res.json({ ok: true });
});

/* ---------- AI engine (Portfolio Intelligence graph) ----------
   An admin pastes an Anthropic API key (stored server-side, never returned
   to the browser). The graph endpoint proxies to Claude and returns which
   contracts to show and how to group them. No key → the client falls back
   to its built-in interpreter. */
const aiKey = () => getSetting('aiKey') || process.env.ANTHROPIC_API_KEY || '';
const aiModel = () => getSetting('aiModel') || 'claude-haiku-4-5-20251001';
app.get('/api/ai/config', auth, (req, res) => {
  const k = aiKey();
  res.json({ configured: !!k, model: aiModel(), source: getSetting('aiKey') ? 'settings' : (process.env.ANTHROPIC_API_KEY ? 'env' : null),
    hint: k ? ('••••' + k.slice(-4)) : '' });
});
app.put('/api/ai/config', auth, admin, (req, res) => {
  const { key, model, clear } = req.body || {};
  if (clear) { setSetting('aiKey', ''); return res.json({ ok: true, configured: !!process.env.ANTHROPIC_API_KEY }); }
  if (typeof key === 'string' && key.trim()) setSetting('aiKey', key.trim());
  if (typeof model === 'string' && model.trim()) setSetting('aiModel', model.trim());
  res.json({ ok: true, configured: !!aiKey(), model: aiModel() });
});
app.post('/api/ai/graph', auth, async (req, res) => {
  const key = aiKey();
  if (!key) return res.status(400).json({ error: 'AI engine not configured', needsKey: true });
  const { query, contracts, history, activeIds } = req.body || {};
  if (!query || !Array.isArray(contracts)) return res.status(400).json({ error: 'query and contracts are required' });
  const list = contracts.slice(0, 600);
  const tool = {
    name: 'render_graph',
    description: 'Decide which contracts stay visible and how to cluster them.',
    input_schema: {
      type: 'object',
      properties: {
        visibleIds: { type: 'array', items: { type: 'string' }, description: 'Contract ids that MATCH the request. Omit or leave empty to keep every contract visible (e.g. a pure grouping request).' },
        action: { type: 'string', enum: ['filter','highlight'], description: 'filter = remove non-matches from the graph (use for "show only X" style commands). highlight = keep everything visible but dim non-matches and emphasise matches (use for analytical questions like "which expire soon?"). Default filter.' },
        badges: { type: 'object', additionalProperties: { type: 'string' }, description: 'Optional map of contract id -> very short annotation shown as a pill on the node, e.g. "ends in 143d" or "rank #1". Only for ids in visibleIds.' },
        answer: { type: 'string', description: 'A 1-3 sentence natural-language answer to the user, shown in the chat panel. Mention counts and standout contracts by name.' },
        groupBy: { type: 'string', enum: ['folder','counterparty','status','valueBand','kind','custom'], description: 'How to cluster. Use custom only when the dimension is not one of the others (e.g. by city).' },
        groups: { type: 'object', additionalProperties: { type: 'string' }, description: 'Only for groupBy=custom: map each contract id to its group label (e.g. inferred city).' },
        note: { type: 'string', description: 'Short label of what was done, e.g. "Leases · grouped by city". Used to name the pinned lens chip.' }
      },
      required: ['note']
    }
  };
  const today = new Date().toISOString().slice(0, 10);
  const hist = Array.isArray(history) ? history.slice(-8).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${String(h.text || '').slice(0, 400)}`).join('\n') : '';
  const active = Array.isArray(activeIds) && activeIds.length ? activeIds.slice(0, 600) : null;
  const prompt = `You filter and cluster a contract portfolio for a graph view.\n\nToday's date: ${today}\n\nContracts (JSON):\n${JSON.stringify(list)}\n${hist ? `\nConversation so far:\n${hist}\n` : ''}${active ? `\nCurrently selected/highlighted contract ids (the user may refer to these as "those"/"these" in follow-ups — intersect with them when they do):\n${JSON.stringify(active)}\n` : ''}\nUser request: "${query}"\n\nRules:\n- If the request narrows the set (e.g. "leases", "Naivas", "high value", "expiring"), put ONLY the matching contract ids in visibleIds.\n- Choose action: "filter" for explicit narrowing commands ("show only leases"), "highlight" for analytical questions ("which contracts end in 6 months?") so the rest of the portfolio stays visible for context.\n- For date/expiry questions, compute against today's date (${today}) using each contract's expiry field, and add a badges entry per match like "ends in 143d".\n- Write a short answer (1-3 sentences) for the chat panel.\n- If it is purely a grouping request ("group by customer", "by city"), leave visibleIds empty and set groupBy.\n- It can be both.\n- For a dimension not present in the data (city, region, sector…), set groupBy="custom" and fill groups by INFERRING the label from the counterparty/name.\n- Always return via the render_graph tool.`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: aiModel(), max_tokens: 2000, tools: [tool], tool_choice: { type: 'tool', name: 'render_graph' }, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).json({ error: 'AI provider error (' + r.status + '): ' + t.slice(0, 300) }); }
    const data = await r.json();
    const block = (data.content || []).find(b => b.type === 'tool_use');
    if (!block) return res.status(502).json({ error: 'AI returned no structured result' });
    const out = block.input || {};
    res.json({ visibleIds: Array.isArray(out.visibleIds) && out.visibleIds.length ? out.visibleIds : null,
      action: out.action === 'highlight' ? 'highlight' : 'filter',
      badges: (out.badges && typeof out.badges === 'object') ? out.badges : null,
      answer: typeof out.answer === 'string' ? out.answer : '',
      groupBy: out.groupBy || null, groups: (out.groupBy === 'custom' && out.groups) ? out.groups : null, note: out.note || '' });
  } catch (e) { res.status(502).json({ error: 'AI request failed: ' + e.message }); }
});

/* ---------- AI template advisor (two-stage) ----------
   Stage 1: the client sends candidate contracts (metadata + full clause text);
   the server re-scores on metadata and keeps at most 8 — Signed first, then by
   value and text richness. Stage 2: Claude (Sonnet — a deeper read than the
   graph model) ranks the top 3 as templates for the described new contract. */
app.post('/api/ai/template', auth, async (req, res) => {
  const key = aiKey();
  if (!key) return res.status(400).json({ error: 'AI engine not configured', needsKey: true });
  const { query, candidates } = req.body || {};
  if (!query || !Array.isArray(candidates) || !candidates.length)
    return res.status(400).json({ error: 'query and candidates are required' });
  // stage 1 — metadata shortlist, capped at 8
  const scored = candidates
    .filter(c => c && c.id)
    .map(c => ({ c, s: (c.status === 'Signed' ? 3 : 0) + (Number(c.value || 0) > 0 ? 1 : 0) + Math.min(2, String(c.text || '').length / 2000) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 8)
    .map(x => x.c);
  const today = new Date().toISOString().slice(0, 10);
  const tool = {
    name: 'recommend_template',
    description: 'Rank the best existing contracts to use as a template for the new contract the user describes.',
    input_schema: {
      type: 'object',
      properties: {
        ranked: { type: 'array', maxItems: 3, items: { type: 'object', properties: {
          id: { type: 'string', description: 'Contract id from the candidates.' },
          reason: { type: 'string', description: 'One line: why this contract works as the template (clause structure, terms, counterparty class, execution status).' }
        }, required: ['id','reason'] }, description: 'Best first. Up to 3.' },
        answer: { type: 'string', description: '1-3 sentence overall recommendation for the chat panel, naming the top pick.' }
      },
      required: ['ranked','answer']
    }
  };
  const body = scored.map(c => ({ id: c.id, name: c.name, kind: c.kind, counterparty: c.counterparty, value: c.value, status: c.status, expiry: c.expiry || '', clauses: String(c.text || '').slice(0, 6000) }));
  const prompt = `You advise which existing contract to use as the TEMPLATE for a new one.\n\nToday's date: ${today}\n\nUser request: "${query}"\n\nCandidate contracts, each with full clause text (JSON):\n${JSON.stringify(body)}\n\nJudge fit on: clause structure and completeness for the requested deal type, quality of terms, whether it was executed (Signed is battle-tested), and how close the counterparty/commercial shape is to the request. Rank the top 3 via the recommend_template tool with a one-line reason each.`;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5', max_tokens: 1200, tools: [tool], tool_choice: { type: 'tool', name: 'recommend_template' }, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) { const t = await r.text(); return res.status(502).json({ error: 'AI provider error (' + r.status + '): ' + t.slice(0, 300) }); }
    const data = await r.json();
    const block = (data.content || []).find(b => b.type === 'tool_use');
    if (!block) return res.status(502).json({ error: 'AI returned no structured result' });
    const out = block.input || {};
    const ids = new Set(scored.map(c => c.id));
    const ranked = (Array.isArray(out.ranked) ? out.ranked : []).filter(x => x && ids.has(x.id)).slice(0, 3);
    if (!ranked.length) return res.status(502).json({ error: 'AI returned no usable ranking' });
    res.json({ ranked, answer: typeof out.answer === 'string' ? out.answer : '' });
  } catch (e) { res.status(502).json({ error: 'AI request failed: ' + e.message }); }
});

// Server-stamped signing metadata (IP + authoritative time) for the evidence record.
app.post('/api/sign-meta', auth, (req, res) => {
  res.json({ ip: clientIp(req), at: now() });
});

/* ---------- team management ---------- */
app.post('/api/users', auth, admin, (req, res) => {
  const { name, email, role, password } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
  if (!['admin','legal','viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(String(email).toLowerCase()))
    return res.status(409).json({ error: 'A member with that email already exists' });
  const salt = rid(16);
  const u = { id: 'u_' + rid(8), name, email: String(email).toLowerCase(), role, salt, hash: hashPw(password, salt), created_at: now() };
  db.prepare('INSERT INTO users (id,name,email,role,salt,hash,created_at) VALUES (?,?,?,?,?,?,?)')
    .run(u.id, u.name, u.email, u.role, u.salt, u.hash, u.created_at);
  const org = getSetting('org');
  sendEmail(u.email, `You've been added to ${org?.name || 'a HaTi workspace'}`,
    `${req.user.name} added you to ${org?.name || 'the workspace'} on HaTi as ${role}.\nSign in at ${req.protocol}://${req.get('host')} with your email and the temporary password you were given, then change it.`,
    `invite: ${u.email} (${role})`);
  res.json({ ok: true, user: publicUser(u), emailSent: EMAIL_ON() });
});

app.patch('/api/users/:id', auth, admin, (req, res) => {
  const { role } = req.body || {};
  if (!['admin','legal','viewer'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role' });
  const r = db.prepare('UPDATE users SET role=? WHERE id=?').run(role, req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
});

app.delete('/api/users/:id', auth, admin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot remove yourself' });
  const r = db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  if (!r.changes) return res.status(404).json({ error: 'User not found' });
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(req.params.id);
  res.json({ ok: true });
});

/* ---------- uploaded-file storage (keeps big files out of the synced blob) ---------- */
app.post('/api/files', auth, editor, (req, res) => {
  const { name, mime, dataUrl } = req.body || {};
  if (!dataUrl || typeof dataUrl !== 'string') return res.status(400).json({ error: 'dataUrl required' });
  const id = 'f_' + rid(10);
  db.prepare('INSERT INTO files (id,name,mime,data,created_at) VALUES (?,?,?,?,?)')
    .run(id, name || '', mime || '', dataUrl, now());
  res.json({ ok: true, id });
});
app.get('/api/files/:id', auth, (req, res) => {
  const f = db.prepare('SELECT name,mime,data FROM files WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'File not found' });
  res.json({ name: f.name, mime: f.mime, dataUrl: f.data });
});

/* ---------- counterparty shares ---------- */
app.post('/api/shares', auth, editor, (req, res) => {
  const { payload } = req.body || {};
  if (!payload || payload.kind !== 'hati-share') return res.status(400).json({ error: 'Invalid share payload' });
  const token = rid(12);
  db.prepare('INSERT INTO shares (token,payload,created_at) VALUES (?,?,?)').run(token, JSON.stringify(payload), now());
  res.json({ ok: true, token });
});

app.get('/api/shares/pending', auth, (req, res) => {         // owner side: responses to apply
  // NOTE: must be registered before /api/shares/:token or it would match as a token
  const rows = db.prepare('SELECT token, response FROM shares WHERE response IS NOT NULL AND applied=0').all();
  res.json(rows.map(r => ({ token: r.token, response: JSON.parse(r.response) })));
});

app.get('/api/shares/:token', (req, res) => {                // public: counterparty portal
  const s = db.prepare('SELECT payload, response FROM shares WHERE token=?').get(req.params.token);
  if (!s) return res.status(404).json({ error: 'Share link not found or expired' });
  res.json({ payload: JSON.parse(s.payload), responded: !!s.response });
});

// Counterparty signing is verified by an email one-time code.
app.post('/api/shares/:token/otp', (req, res) => {           // public: request a code
  const s = db.prepare('SELECT token FROM shares WHERE token=?').get(req.params.token);
  if (!s) return res.status(404).json({ error: 'Share link not found or expired' });
  const email = String((req.body || {}).email || '').toLowerCase();
  if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'A valid email is required' });
  const code = code6(), expires = Date.now() + 10 * 60 * 1000;
  db.prepare('INSERT INTO share_otp (token,email,code_hash,verify,verified,expires) VALUES (?,?,?,?,0,?) ' +
    'ON CONFLICT(token) DO UPDATE SET email=excluded.email, code_hash=excluded.code_hash, verify=NULL, verified=0, expires=excluded.expires')
    .run(req.params.token, email, sha(code + req.params.token), null, expires);
  sendEmail(email, 'Your HaTi signing code', `Your one-time code to sign this contract is ${code}. It expires in 10 minutes.`, `OTP for signing: ${code}`);
  res.json({ ok: true, emailSent: EMAIL_ON(), devCode: EMAIL_ON() ? undefined : code });
});
app.post('/api/shares/:token/verify-otp', (req, res) => {    // public: verify the code
  const row = db.prepare('SELECT * FROM share_otp WHERE token=?').get(req.params.token);
  const { email, code } = req.body || {};
  if (!row || row.email !== String(email || '').toLowerCase()) return res.status(400).json({ error: 'Request a code first' });
  if (Date.now() > row.expires) return res.status(400).json({ error: 'Code expired — request a new one' });
  if (row.code_hash !== sha(String(code || '') + req.params.token)) return res.status(400).json({ error: 'Incorrect code' });
  const verify = rid(12);
  db.prepare('UPDATE share_otp SET verified=1, verify=? WHERE token=?').run(verify, req.params.token);
  res.json({ ok: true, verify });
});

app.post('/api/shares/:token/respond', (req, res) => {       // public: counterparty responds
  const s = db.prepare('SELECT token, response FROM shares WHERE token=?').get(req.params.token);
  if (!s) return res.status(404).json({ error: 'Share link not found or expired' });
  if (s.response) return res.status(409).json({ error: 'A response was already submitted for this link' });
  const r = req.body || {};
  if (r.kind !== 'hati-response' || !['sign','changes','decline'].includes(r.action) || !r.name)
    return res.status(400).json({ error: 'Invalid response' });
  if (r.action === 'sign') {   // require a verified email OTP to attribute the signature
    const otp = db.prepare('SELECT * FROM share_otp WHERE token=?').get(req.params.token);
    if (!otp || !otp.verified || !r.verify || otp.verify !== r.verify)
      return res.status(403).json({ error: 'Email verification required before signing' });
    r.email = otp.email; r.method = 'email one-time code'; r.ip = clientIp(req);
  }
  db.prepare('UPDATE shares SET response=? WHERE token=?').run(JSON.stringify(r), req.params.token);
  res.json({ ok: true });
});

/* ---------- password reset ---------- */
app.post('/api/password/reset-request', (req, res) => {
  const email = String((req.body || {}).email || '').toLowerCase();
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  let devToken;
  if (u) {
    const token = rid(16), id = 'r_' + rid(6);
    db.prepare('INSERT INTO resets (id,user_id,token_hash,expires,used) VALUES (?,?,?,?,0)').run(id, u.id, sha(token), Date.now() + 30 * 60 * 1000);
    const link = `${req.protocol}://${req.get('host')}/#reset=${id}.${token}`;
    sendEmail(email, 'Reset your HaTi password', `Open this link to set a new password (valid 30 minutes):\n${link}`, `Reset link: ${link}`);
    devToken = EMAIL_ON() ? undefined : `${id}.${token}`;
  }
  res.json({ ok: true, emailSent: EMAIL_ON(), devToken }); // never leak whether the email exists
});
app.post('/api/password/reset', (req, res) => {
  const { token, password } = req.body || {};
  const [id, raw] = String(token || '').split('.');
  const row = db.prepare('SELECT * FROM resets WHERE id=?').get(id || '');
  if (!row || row.used || Date.now() > row.expires || row.token_hash !== sha(raw || ''))
    return res.status(400).json({ error: 'This reset link is invalid or expired' });
  if (!password || String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const salt = rid(16);
  db.prepare('UPDATE users SET salt=?, hash=? WHERE id=?').run(salt, hashPw(password, salt), row.user_id);
  db.prepare('UPDATE resets SET used=1 WHERE id=?').run(id);
  db.prepare('DELETE FROM sessions WHERE user_id=?').run(row.user_id); // force re-login everywhere
  res.json({ ok: true });
});

/* ---------- outbox (admin can see what was emailed / dev codes) ---------- */
app.get('/api/outbox', auth, admin, (req, res) => {
  const rows = db.prepare('SELECT id,to_addr,subject,sent,provider,dev_hint,created_at FROM outbox ORDER BY created_at DESC LIMIT 40').all();
  res.json({ emailConfigured: EMAIL_ON(), items: rows });
});

/* ---------- renewal reminders ---------- */
function runReminders() {
  const rows = db.prepare("SELECT id,name,counterparty,expiry,status FROM contracts WHERE expiry IS NOT NULL AND status!='Declined'").all();
  const admins = db.prepare("SELECT email FROM users WHERE role='admin'").all().map(u => u.email);
  if (!admins.length) return { checked: 0, queued: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let queued = 0;
  for (const c of rows) {
    if (!c.expiry) continue;
    const days = Math.ceil((new Date(c.expiry + 'T00:00:00') - today) / 86400000);
    const milestone = [90, 60, 30].find(m => days === m);
    if (milestone == null) continue;
    const rkey = `${c.id}:${c.expiry}:${milestone}`;
    if (db.prepare('SELECT rkey FROM reminders WHERE rkey=?').get(rkey)) continue;
    db.prepare('INSERT INTO reminders (rkey,created_at) VALUES (?,?)').run(rkey, now());
    const subj = `Renewal in ${milestone} days: ${c.name}`;
    const body = `The contract "${c.name}" (${c.id}) with ${c.counterparty || 'a counterparty'} expires on ${c.expiry} — ${milestone} days away. Review it in HaTi to renew or let it lapse.`;
    admins.forEach(a => sendEmail(a, subj, body, `renewal ${milestone}d: ${c.name}`));
    queued++;
  }
  return { checked: rows.length, queued };
}
app.post('/api/reminders/run', auth, admin, (req, res) => res.json(runReminders()));
setInterval(() => { try { runReminders(); } catch (e) {} }, 12 * 60 * 60 * 1000); // twice daily

app.post('/api/shares/:token/applied', auth, editor, (req, res) => {
  db.prepare('UPDATE shares SET applied=1 WHERE token=?').run(req.params.token);
  res.json({ ok: true });
});

/* ---------- frontend ---------- */
const INDEX = path.join(__dirname, '..', 'index.html');
app.get('/', (req, res) => res.sendFile(INDEX));
app.get('/index.html', (req, res) => res.sendFile(INDEX));

app.listen(PORT, () => console.log(`HaTi CLM server running → http://localhost:${PORT}`));
