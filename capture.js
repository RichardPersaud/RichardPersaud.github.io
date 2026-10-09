'use strict';
// Capture landing-page screenshots from the running AniNinja app via CDP.
// Requires the app launched with --remote-debugging-port=9223.
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OUT = process.argv[2] || path.join(__dirname, 'assets');

(async () => {
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json/list', (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { maxPayload: 64 * 1024 * 1024 });
  let msgId = 0;
  const pending = new Map();
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((resolve) => {
    const id = ++msgId;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evalJs = async (expr, awaitPromise = false) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise });
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.result.data, 'base64'));
    console.log('saved', name);
  };
  await new Promise((r) => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');
  fs.mkdirSync(OUT, { recursive: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);

  // 0. Privacy: hide the signed-in user's profile avatar everywhere
  await evalJs(`(() => {
    let n = 0;
    document.querySelectorAll('img').forEach((img) => {
      const s = (img.className + ' ' + img.id + ' ' + (img.alt || '') + ' ' + (img.src || '')).toLowerCase();
      if (s.includes('avatar') || s.includes('profile') || s.includes('googleusercontent')) { img.style.visibility = 'hidden'; n++; }
    });
    return 'hidden ' + n;
  })()`);

  // 1. Home view, populated, no overlays
  await evalJs(`(() => {
    const dd = document.querySelector('.suggestions, #suggestions, .suggest');
    if (dd) dd.style.display = 'none';
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
    if (typeof showView === 'function') showView('homeView');
    return 'ok';
  })()`);
  await sleep(4000);
  await shot('shot-home');

  // 2. Detail view
  await evalJs(`(async () => {
    const card = document.querySelector('#homeView .card, #homeView .poster, [data-id]');
    if (card) { card.click(); return 'clicked card'; }
    return 'no card found';
  })()`, true);
  await sleep(5000);
  await evalJs(`(() => { const dd = document.querySelector('.suggestions, #suggestions'); if (dd) dd.style.display='none'; return 'ok'; })()`);
  await sleep(1000);
  await shot('shot-detail');

  // 3. Player mid-playback
  await evalJs(`(async () => {
    const ep = document.querySelector('#episodes button, #episodes .ep, #episodeList button');
    if (ep) { ep.click(); return 'clicked ep'; }
    return 'no episode found';
  })()`, true);
  await sleep(9000);
  await shot('shot-player');

  process.exit(0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });