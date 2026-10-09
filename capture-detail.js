'use strict';
// Re-capture a distinct detail view: open the Episodes panel over the detail/player page.
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OUT = path.join(__dirname, 'assets');

(async () => {
  const targets = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9223/json/list', (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
  const page = targets.find((t) => t.type === 'page');
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

  // Pause playback so the frame isn't mid-transition, then open the episode list panel
  const res = await evalJs(`(() => {
    const v = document.querySelector('video');
    if (v) v.pause();
    const btns = [...document.querySelectorAll('button')];
    const ep = btns.find((b) => /episodes/i.test(b.textContent || ''));
    if (ep) { ep.click(); return 'clicked: ' + ep.textContent.trim(); }
    return 'no episodes button';
  })()`);
  console.log(res);
  await sleep(2500);
  await shot('shot-detail');
  process.exit(0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });