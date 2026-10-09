'use strict';
// Preview the landing page in the running Electron via CDP browser endpoint.
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OUT = path.join(__dirname, 'preview');
const PAGE_URL = 'file:///C:/Users/richa/anininja-landing/index.html';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const CDP_PORT = process.env.CDP_PORT || 9224;
  const ver = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}/json/version`, (res) => {
      let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve(JSON.parse(b)));
    }).on('error', reject);
  });
  const ws = new WebSocket(ver.webSocketDebuggerUrl, { maxPayload: 256 * 1024 * 1024 });
  let msgId = 0;
  const pending = new Map();
  const handlers = [];
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    else if (m.method) handlers.forEach((h) => h(m));
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++msgId;
    pending.set(id, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  await new Promise((r) => ws.on('open', r));

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cs = (method, params = {}) => send(method, params, sessionId);
  handlers.push((m) => { if (m.sessionId !== sessionId) return; });

  await cs('Page.enable');
  await cs('Runtime.enable');
  await cs('Page.navigate', { url: PAGE_URL });
  await sleep(2000);

  // Desktop
  await cs('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await sleep(1500);
  // force reveal-on-scroll elements visible (no transition) for full-page capture
  await cs('Runtime.evaluate', { expression: "document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in')); const st=document.createElement('style'); st.textContent='.reveal{transition:none!important}'; document.head.appendChild(st);" });
  const h = await cs('Runtime.evaluate', { expression: 'document.body.scrollHeight', returnByValue: true });
  if (h.result === undefined) { console.error('evaluate response:', JSON.stringify(h).slice(0, 400)); process.exit(1); }
  console.log('page height:', h.result.value);
  const full = await cs('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, 'preview-desktop-full.png'), Buffer.from(full.data, 'base64'));
  console.log('saved preview-desktop-full.png');

  // Phone
  await cs('Emulation.setDeviceMetricsOverride', { width: 360, height: 740, deviceScaleFactor: 2, mobile: true });
  await sleep(1200);
  const overflow = await cs('Runtime.evaluate', {
    expression: 'document.documentElement.scrollWidth - document.documentElement.clientWidth', returnByValue: true,
  });
  console.log('horizontal overflow px:', JSON.stringify(overflow.result.value));
  const fullM = await cs('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(OUT, 'preview-mobile-full.png'), Buffer.from(fullM.data, 'base64'));
  console.log('saved preview-mobile-full.png');
  await send('Target.closeTarget', { targetId });
  process.exit(0);
})().catch((e) => { console.error('FAILED', e); process.exit(1); });