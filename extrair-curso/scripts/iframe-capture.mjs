#!/usr/bin/env node
// Captura URLs m3u8 + cookies de um iframe target. Node 22+ (WebSocket built-in).
// Uso: node capture-iframe-m3u8.mjs <iframe-target-id>

import { readFileSync } from 'fs';

const lines = readFileSync(`${process.env.HOME}/Library/Application Support/Google/Chrome/DevToolsActivePort`, 'utf8').trim().split('\n');
const [port, browserPath] = lines;
const targetId = process.argv[2];
if (!targetId) { console.error('usage: capture-iframe-m3u8.mjs <target-id>'); process.exit(1); }

const wsUrl = `ws://127.0.0.1:${port}${browserPath}`;
const ws = new WebSocket(wsUrl);
let nextId = 1;
const pending = new Map();
const m3u8s = new Set();
let sid;

function send(method, params = {}, sessionId) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    const msg = { id, method, params };
    if (sessionId) msg.sessionId = sessionId;
    ws.send(JSON.stringify(msg));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error(`Timeout: ${method}`)); } }, 15000);
  });
}

ws.onerror = (e) => { console.error('WS error:', e.message); process.exit(1); };

ws.onopen = async () => {
  try {
    const att = await send('Target.attachToTarget', { targetId, flatten: true });
    sid = att.sessionId;
    await send('Network.enable', {}, sid);

    const url = await send('Runtime.evaluate', { expression: 'location.href' }, sid);
    const iframeUrl = url.result.value;
    const origin = new URL(iframeUrl).origin;

    // Listen sem reload — preserva player state. Aluno deve dar play durante esse tempo.
    console.error('[capture] listening 20s — give play on the video now...');
    await new Promise(r => setTimeout(r, 20000));

    const cookies = await send('Network.getCookies', { urls: [origin] }, sid);
    const cookieStr = cookies.cookies.map(c => `${c.name}=${c.value}`).join('; ');

    console.log(JSON.stringify({
      iframe_url: iframeUrl,
      origin,
      m3u8_count: m3u8s.size,
      m3u8_urls: [...m3u8s],
      cookie_count: cookies.cookies.length,
      cookie_string: cookieStr,
    }, null, 2));

    ws.close();
    process.exit(0);
  } catch (e) {
    console.error('error:', e.message);
    process.exit(1);
  }
};

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(msg.error.message));
    else resolve(msg.result);
  } else if (msg.method === 'Network.requestWillBeSent') {
    const u = msg.params?.request?.url;
    if (u && (u.includes('.m3u8') || u.includes('.mpd'))) m3u8s.add(u);
  } else if (msg.method === 'Network.responseReceived') {
    const u = msg.params?.response?.url;
    if (u && (u.includes('.m3u8') || u.includes('.mpd'))) m3u8s.add(u);
  }
};

setTimeout(() => { console.error('Hard timeout 45s'); process.exit(1); }, 45000);
