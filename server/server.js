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
  if (data) setStore('data', data);
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
app.get('/api/bootstrap', auth, (req, res) => {
  res.json({
    org: getSetting('org'),
    me: publicUser(req.user),
    users: db.prepare('SELECT * FROM users ORDER BY created_at').all().map(publicUser),
    data: getStore('data'),
    version: getSetting('dataVersion') || 0,
  });
});

// Optimistic locking: reject a write based on a stale version so concurrent
// edits can't silently clobber each other.
app.put('/api/data', auth, editor, (req, res) => {
  const d = req.body || {};
  if (!Array.isArray(d.contracts)) return res.status(400).json({ error: 'contracts array required' });
  const current = getSetting('dataVersion') || 0;
  const base = Number(d.baseVersion || 0);
  if (base !== current) return res.status(409).json({ error: 'Version conflict — data changed on the server', version: current });
  const next = current + 1;
  setStore('data', { uid: d.uid, contracts: d.contracts, settings: d.settings || {} });
  setSetting('dataVersion', next);
  res.json({ ok: true, version: next });
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
  const data = getStore('data');
  if (!data || !Array.isArray(data.contracts)) return { checked: 0, queued: 0 };
  const admins = db.prepare("SELECT email FROM users WHERE role='admin'").all().map(u => u.email);
  if (!admins.length) return { checked: 0, queued: 0 };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let queued = 0;
  for (const c of data.contracts) {
    if (!c.expiry || c.status === 'Declined') continue;
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
  return { checked: data.contracts.length, queued };
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
