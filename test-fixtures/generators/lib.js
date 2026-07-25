const fs = require('fs');
const { launch: rawLaunch, shot, txt, BASE } = require('./drv.js');
const SESS = '/tmp/claude-0/-home-user-mkataba-clm/755f1890-2593-5c40-9fce-6b486bee6495/scratchpad/sessions';
fs.mkdirSync(SESS, { recursive: true });

// The server allows 10 auth attempts per IP per 15 min, so cookies are cached
// on disk between scripts rather than logging in afresh every time.
async function launch(opts = {}) {
  const r = await rawLaunch(opts);
  if (opts.as) {
    const f = SESS + '/' + opts.as.replace(/\W/g, '_') + '.json';
    if (fs.existsSync(f)) {
      try { await r.ctx.addCookies(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch (e) { }
    }
  }
  return r;
}
async function saveSession(ctx, who) {
  fs.writeFileSync(SESS + '/' + who.replace(/\W/g, '_') + '.json', JSON.stringify(await ctx.cookies()));
}
async function login(pg, email, pass, ctx) {
  await pg.goto(BASE, { waitUntil: 'networkidle' });
  await pg.waitForTimeout(900);
  if (await pg.$('#li-email')) {
    await pg.fill('#li-email', email); await pg.fill('#li-pass', pass);
    await pg.click('#li-go'); await pg.waitForTimeout(2200);
    if (ctx && !(await pg.$('#li-email'))) await saveSession(ctx, email);
  }
  const ok = !(await pg.$('#li-email'));
  if (!ok) console.log('!! LOGIN FAILED for ' + email + ' — ' + (await txt(pg)).slice(0, 200).replace(/\n+/g, ' '));
  return ok;
}
// one call: reuse the cached cookie if it still works, otherwise sign in
async function as(who, opts = {}) {
  const r = await launch({ ...opts, as: who });
  await r.pg.goto(BASE, { waitUntil: 'networkidle' });
  await r.pg.waitForTimeout(1200);
  if (await r.pg.$('#li-email')) await login(r.pg, who, process.env.HATI_PW||'Password123!', r.ctx);
  else await saveSession(r.ctx, who);
  return r;
}
async function nav(pg, view) {
  await pg.evaluate(v => window.setView ? window.setView(v) : (location.hash = '#' + v), view);
  await pg.waitForTimeout(1200);
}
// click a visible element whose text contains `s`
async function clickText(pg, s, tag = '*') {
  const ok = await pg.evaluate(([s, tag]) => {
    const els = Array.from(document.querySelectorAll(tag === '*' ? 'button,a,[onclick],[role=button],label,li,div' : tag));
    const hit = els.filter(e => e.offsetParent && (e.innerText || '').trim().includes(s))
      .sort((a, b) => (a.innerText || '').length - (b.innerText || '').length)[0];
    if (!hit) return false; hit.click(); return true;
  }, [s, tag]);
  await pg.waitForTimeout(900);
  return ok;
}
const toasts = pg => pg.evaluate(() => Array.from(document.querySelectorAll('#toast-host *, .toast, [id*=toast]')).map(e => e.innerText).filter(Boolean));
module.exports = { launch, shot, txt, BASE, login, nav, clickText, toasts, as, saveSession };
