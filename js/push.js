/* ============================================================
   ALERTS ON YOUR PHONE — THE BROWSER'S HALF (round 4 of Jambo's journey,
   docs/PLAN-jambo-journey.md; the owner, 22 Oct 2026: browser push, "option
   2" — the urgent ones as they happen, the rest in one morning summary)
   ============================================================
   ONE READING of where this device stands (pushState) and ONE press each way
   (pushOn, pushOff), drawn by the computer's Settings › You and the phone's
   account sheet alike. The server keeps who gets alerts (POST
   /api/push/subscribe, /unsubscribe); this file only asks the browser.
   "ON" MEANS IT ARRIVED: turning on sends the first alert at once, and the
   answer says whether the push service took it (`delivered`). */
const PUSH_SW_URL = '/sw.js';
const _puT = (k, v) => (typeof i18t === 'function') ? i18t(k, v) : k;
/* an iPhone or iPad: Apple gives a web app alerts only once it is on the Home Screen */
function pushIsApple(){
  try { return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
  catch (_){ return false; }
}
function pushStandalone(){
  try { return !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
  catch (_){ return false; }
}
function pushSupported(){
  try { return typeof window !== 'undefined' && !!window.isSecureContext && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  catch (_){ return false; }
}
async function pushRegistration(){
  try { return await navigator.serviceWorker.getRegistration('/'); } catch (_){ return null; }
}
/* THE ONE READING: 'noserver' · 'apple' (add to the Home Screen first) · 'unsupported' · 'blocked' · 'on' · 'off' */
async function pushState(){
  if (!(typeof API_MODE === 'function' && API_MODE())) return 'noserver';
  if (!pushSupported()) return (pushIsApple() && !pushStandalone()) ? 'apple' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  const reg = await pushRegistration();
  let sub = null; try { sub = reg && reg.pushManager ? await reg.pushManager.getSubscription() : null; } catch (_){ sub = null; }
  return sub ? 'on' : 'off';
}
/* what each state says to the reader, in one place */
function pushStateSaid(st){ return _puT('push_st_' + (st || 'off')); }
const pushKeyBytes = b64 => { const s = String(b64 || '').replace(/-/g, '+').replace(/_/g, '/'); const raw = atob(s + '='.repeat((4 - s.length % 4) % 4)); return Uint8Array.from(raw, ch => ch.charCodeAt(0)); };
/* TURN ON: the browser's own question first (a person's press asks it), then the subscription, then the server */
async function pushOn(){
  if (!pushSupported()) return { state: await pushState() };
  const asked = await Notification.requestPermission();
  if (asked !== 'granted') return { state: asked === 'denied' ? 'blocked' : 'off' };
  const reg = await navigator.serviceWorker.register(PUSH_SW_URL, { scope: '/' });
  await navigator.serviceWorker.ready;
  const k = await api('push/key');
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: pushKeyBytes(k.key) });
  const r = await api('push/subscribe', 'POST', sub.toJSON());
  return { state: 'on', delivered: !!(r && r.delivered), devices: r && r.devices };
}
/* TURN OFF: this device only; the server forgets it first, then the browser */
async function pushOff(){
  const reg = await pushRegistration();
  const sub = reg && reg.pushManager ? await reg.pushManager.getSubscription() : null;
  if (sub){
    await api('push/unsubscribe', 'POST', { endpoint: sub.endpoint });
    try { await sub.unsubscribe(); } catch (_){}
  }
  return { state: 'off' };
}
/* a press, with its outcome said where the reader looks (a toast) and the row redrawn by the caller */
async function pushToggle(want){
  try {
    const r = want ? await pushOn() : await pushOff();
    if (typeof toast === 'function'){
      if (r.state === 'on') toast(_puT(r.delivered ? 'push_on_ok' : 'push_on_unsent'), r.delivered ? 'ok' : 'warn');
      else if (want) toast(pushStateSaid(r.state), 'warn');
      else toast(_puT('push_off_ok'), 'ok');
    }
    return r;
  } catch (e){
    if (typeof toast === 'function') toast(_puT('push_err', { why: String((e && e.message) || '').slice(0, 160) || '—' }), 'err');
    return { state: await pushState(), error: true };
  }
}
/* a tap on an alert where the worker could not move the open window itself */
if (typeof navigator !== 'undefined' && navigator.serviceWorker && !window._puMsgWired){
  window._puMsgWired = true;
  navigator.serviceWorker.addEventListener('message', e => {
    const u = e && e.data && e.data.hatiGo; if (!u) return;
    try { const x = new URL(u, location.origin); if (x.origin === location.origin) location.href = x.href; } catch (_){}
  });
}

Object.assign(window, { PUSH_SW_URL, pushIsApple, pushStandalone, pushSupported, pushRegistration, pushState, pushStateSaid, pushKeyBytes, pushOn, pushOff, pushToggle });
