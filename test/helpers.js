/* ============================================================
   HaTi — test harness
   ============================================================
   Boots a real server against a throwaway SQLite file on a free port, plus a
   local stand-in for the Anthropic API that records every request body. Nothing
   here reaches the network: no Anthropic call, no Resend call (RESEND_API_KEY is
   never set, so sendEmail queues to the outbox table exactly as it does on a
   server with no mail provider configured).

   Usage:
     const h = await startHati();
     try { … } finally { await h.stop(); }
*/
const { spawn } = require('node:child_process');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SERVER = path.join(__dirname, '..', 'server', 'server.js');

/* ---------- a client that remembers its cookie, like a browser ---------- */
class Client {
  constructor(base, label) { this.base = base; this.cookie = null; this.label = label || 'anon'; }
  async raw(pathname, { method = 'GET', body, headers = {} } = {}) {
    const h = { ...headers };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    if (this.cookie) h.Cookie = this.cookie;
    const res = await fetch(this.base + pathname, {
      method, headers: h, body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) this.cookie = setCookie.split(';')[0];
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch (_) {}
    return { status: res.status, text, json, headers: res.headers };
  }
  async json(pathname, opts) {
    const r = await this.raw(pathname, opts);
    if (r.status >= 400) {
      const e = new Error(`${opts?.method || 'GET'} ${pathname} → ${r.status}: ${r.text.slice(0, 300)}`);
      e.status = r.status; e.body = r.json; throw e;
    }
    return r.json;
  }
}

/* ---------- the Anthropic stand-in ----------
   Records every request HaTi assembles and replies with a canned tool_use of
   whatever tool the request asked for, so the endpoint's own response-shaping
   code runs for real. `calls` is what the prompt assertions read. */
function startAiStub() {
  const calls = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      calls.push({ url: req.url, body, raw });
      const toolName = (body.tool_choice && body.tool_choice.name)
        || (Array.isArray(body.tools) && body.tools.length ? body.tools[0].name : 'deliver_answer');
      const input = toolName === 'deliver_answer'
        ? { answer: 'stubbed answer', citations: [] }
        : toolName === 'render_graph' ? { note: 'stub', answer: 'stub' }
        : toolName === 'answer_portfolio' ? { answer: 'stub', matches: [] }
        : toolName === 'recommend_template' ? { ranked: [], answer: 'stub' }
        : {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_stub', type: 'message', role: 'assistant', model: body.model || 'stub',
        content: [{ type: 'tool_use', id: 'tu_stub', name: toolName, input }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }));
    });
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        base: 'http://127.0.0.1:' + server.address().port,
        calls,
        reset() { calls.length = 0; },
        /* Every character HaTi sent to the provider on the last call — prompts,
           system prompt, tool results, the lot. This is the string the
           "no folder-B contract reached the model" assertions run against. */
        lastPayloadText() { return calls.length ? calls[calls.length - 1].raw : ''; },
        allPayloadText() { return calls.map(c => c.raw).join('\n'); },
        stop() { return new Promise(r => server.close(r)); },
      });
    });
  });
}

/* ---------- a SCRIPTED Anthropic stand-in ----------
   Unlike startAiStub above (which always answers with the request's first
   tool), this one plays back exactly what each test enqueues, so a
   multi-round tool loop can be driven deterministically. `script(...turns)`
   enqueues per-call returns: an array of content blocks for a 200, a bare
   number for that HTTP status, or `{ content, stallMs }` to pause mid-stream
   (for abort tests). An empty queue answers deliver_answer with a plain
   stubbed answer.

   When the recorded request carries `stream: true`, the same scripted content
   is played back as Anthropic's SSE protocol — message_start, block starts,
   text/input_json deltas split into chunks, message_delta with usage — so the
   server's stream parser runs for real against the identical conversation. */
function startScriptedAi() {
  const calls = [];
  const queue = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', d => { raw += d; });
    req.on('end', () => {
      let body = {}; try { body = JSON.parse(raw); } catch (_) {}
      calls.push({ url: req.url, body, raw });
      const next = queue.length ? queue.shift() : null;
      if (typeof next === 'number') {
        res.writeHead(next, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: { type: 'scripted', message: 'scripted provider failure' } }));
        return;
      }
      const spec = (next && !Array.isArray(next)) ? next : { content: next };
      const content = spec.content || [{ type: 'tool_use', id: 'tu_default', name: 'deliver_answer',
        input: { answer: 'stubbed answer', citations: [] } }];
      const usage = { input_tokens: 10, output_tokens: 5 };
      if (!body.stream) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: 'msg_stub', type: 'message', role: 'assistant',
          model: body.model || 'stub', content, usage }));
        return;
      }
      // --- streaming playback ---
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' });
      const ev = (name, data) => { try { res.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`); } catch (_) {} };
      const halves = s => { const mid = Math.max(1, Math.ceil(s.length / 2)); return s.length ? [s.slice(0, mid), s.slice(mid)].filter(Boolean) : []; };
      ev('message_start', { message: { usage: { input_tokens: usage.input_tokens } } });
      const rest = () => {
        content.forEach((b, i) => {
          if (b.type === 'text') {
            ev('content_block_start', { index: i, content_block: { type: 'text' } });
            for (const part of halves(b.text || '')) ev('content_block_delta', { index: i, delta: { type: 'text_delta', text: part } });
          } else {
            ev('content_block_start', { index: i, content_block: { type: 'tool_use', id: b.id, name: b.name } });
            for (const part of halves(JSON.stringify(b.input || {}))) ev('content_block_delta', { index: i, delta: { type: 'input_json_delta', partial_json: part } });
          }
          ev('content_block_stop', { index: i });
        });
        ev('message_delta', { delta: { stop_reason: 'end_turn' }, usage: { output_tokens: usage.output_tokens } });
        ev('message_stop', {});
        try { res.end(); } catch (_) {}
      };
      if (spec.stallMs) setTimeout(rest, spec.stallMs); else rest();
    });
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      resolve({
        base: 'http://127.0.0.1:' + server.address().port,
        calls,
        script(...turns) { queue.push(...turns); },
        reset() { calls.length = 0; queue.length = 0; },
        stop() { return new Promise(r => server.close(r)); },
      });
    });
  });
}

async function waitForServer(base, proc, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (proc.exitCode != null) throw new Error('server exited early (code ' + proc.exitCode + ')');
    try {
      const r = await fetch(base + '/api/status');
      if (r.ok) return;
    } catch (_) {}
    await new Promise(r => setTimeout(r, 60));
  }
  throw new Error('server did not come up in time');
}

async function startHati(env = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-test-'));
  const ai = await startAiStub();
  const proc = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      PORT: '0',                         // replaced below — express needs a real port
      HATI_DATA: dataDir,
      ANTHROPIC_BASE_URL: ai.base,
      ANTHROPIC_API_KEY: 'test-key-not-real',
      RESEND_API_KEY: '',                // never send real email
      MAPPER_TOKEN: '',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let port = null;
  const out = [];
  // If the boot below fails, close the stub too — otherwise its open socket
  // keeps the test process alive and a startup error reads as a hang.
  const bail = async (msg) => { proc.kill('SIGKILL'); await ai.stop(); throw new Error(msg); };
  proc.stdout.on('data', d => {
    const s = String(d); out.push(s);
    const m = /http:\/\/localhost:(\d+)/.exec(s);
    if (m) port = Number(m[1]);
  });
  proc.stderr.on('data', d => out.push(String(d)));
  // wait for the listening line so we learn the OS-assigned port
  const deadline = Date.now() + 20000;
  while (port == null && Date.now() < deadline) {
    if (proc.exitCode != null) await bail('server exited: ' + out.join(''));
    await new Promise(r => setTimeout(r, 40));
  }
  if (port == null) await bail('server never printed its port: ' + out.join(''));
  const base = 'http://127.0.0.1:' + port;
  try { await waitForServer(base, proc); }
  catch (e) { await bail(e.message + '\n' + out.join('')); }

  return {
    base, dataDir, ai, proc, log: () => out.join(''),
    client(label) { return new Client(base, label); },
    async stop() {
      proc.kill('SIGKILL');
      await ai.stop();
      await new Promise(r => proc.on('exit', r));
      try { fs.rmSync(dataDir, { recursive: true, force: true }); } catch (_) {}
    },
  };
}

/* ---------- fixtures ----------
   Two folders that must never bleed into each other. Folder ids match the
   product's built-in value streams (js/templates.js) so the client-side halves
   of these features can be exercised against the same data.
     A = 'proc'  — the restricted user's stream
     B = 'sales' — the stream they must never see */
const FOLDER_A = 'proc';
const FOLDER_B = 'sales';
const B_MARKERS = ['Naivas Supermarkets', 'Modern Trade Listing', 'MK-B1', 'MK-B2'];

/* `body` is optional and seeded here rather than PUT on afterwards, because a
   fixture that ships Signed can no longer be given a document body by a save —
   the executed guard refuses to let the sealed wording change, which is the
   whole point of it (f106). A test that needs an executed contract WITH a body
   must therefore be born with one. */
function fixtureContract(id, name, counterparty, folder, value, status, body) {
  return {
    id, name, counterparty, folder, value, valueType: 'standard',
    status: status || 'Under Review', template: 'RM',
    lastAction: '10 Jul 2026', expiry: '2027-06-30', hash: null, signedAt: null,
    fields: { value: String(value) }, metadata: { value, currency: 'KES' },
    ...(body ? { redlineText: body, format: 'text' } : {}),
    comments: [], audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
    signatures: [], obligations: [], rounds: [],
  };
}

/* The document body MK-A1 carries. It lives here rather than in the one test
   that reads it because a fixture's shape is the stage's business, not a
   single test's. */
const FIXTURE_BODY_A1 = [
  'SUPPLY AGREEMENT',
  '',
  'This agreement is made between Highland Corporate Ltd and Kabras Sugar,',
  'whose email for notices is procurement@kabras.co.ke.',
  '',
  'Article 1 Payment',
  '',
  'The total contract value is KES 48,000,000 payable within thirty days.',
  '',
  'Article 2 Term',
  '',
  'This agreement expires on 2027-06-30.',
  '',
  'Article 3 Confidentiality',
  '',
  'Each party shall keep the terms of this agreement confidential.',
].join('\n');

const FIXTURES = [
  { ...fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48000000, 'Signed', FIXTURE_BODY_A1),
    counterpartyEmail: 'procurement@kabras.co.ke' },
  fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', FOLDER_A, 36000000, 'Under Review'),
  fixtureContract('MK-B1', 'Modern Trade Listing', 'Naivas Supermarkets', FOLDER_B, 85000000, 'Signed'),
  fixtureContract('MK-B2', 'Retail Supply — Coast', 'Naivas Supermarkets', FOLDER_B, 78000000, 'Under Review'),
];

/* Build the standard world every acceptance test starts from:
     admin      — unrestricted, sees values
     restricted — legal, folder A only, sees values
     novalues   — legal, unrestricted folders, values hidden
   Returns the three signed-in clients plus their user records. */
async function seedWorkspace(h, { contracts = FIXTURES } = {}) {
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: {
    org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts, settings: {} },
  } });

  const mkUser = async (name, email) => {
    const created = await admin.json('/api/users', { method: 'POST', body: {
      name, email, role: 'legal', password: 'temporary-pass-1' } });
    const c = h.client(email);
    await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
    // clear mustChangePassword so the account can write, like a real member
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    return { client: c, user: created.user };
  };

  const restricted = await mkUser('Restricted Legal', 'restricted@example.co.ke');
  const novalues = await mkUser('No Values Legal', 'novalues@example.co.ke');
  const unrestricted = await mkUser('Unrestricted Legal', 'everything@example.co.ke');

  await admin.json('/api/settings', { method: 'PUT', body: {
    folderAccess: { [restricted.user.id]: [FOLDER_A] },
  } });
  await admin.json('/api/users/' + novalues.user.id, { method: 'PATCH', body: { canViewValues: false } });

  return {
    admin,
    restricted: restricted.client, novalues: novalues.client, unrestricted: unrestricted.client,
    users: { restricted: restricted.user, novalues: novalues.user, unrestricted: unrestricted.user },
  };
}

/* Does this text mention anything from folder B? Used on RAW response bodies
   and on RAW AI payloads — never on rendered UI. */
function mentionsFolderB(text) {
  const s = String(text || '');
  return B_MARKERS.filter(m => s.includes(m));
}

module.exports = { startHati, startAiStub, startScriptedAi, seedWorkspace, fixtureContract, FIXTURE_BODY_A1,
  FIXTURES, FOLDER_A, FOLDER_B, B_MARKERS, mentionsFolderB, Client };
