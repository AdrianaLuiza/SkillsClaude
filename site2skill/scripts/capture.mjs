#!/usr/bin/env node
// Live API capture via Chrome DevTools Protocol
// Subscribes to Network events on a target tab, buffers events by requestId,
// finalizes on loadingFinished/loadingFailed, then writes a HAR-compatible
// JSON that parse_har.py already knows how to consume.
//
// Usage:
//   capture.mjs start <target-prefix> [--out <path>]   start capture (foreground)
//   capture.mjs stop                                   tell running capture to stop & write
//
// On Ctrl+C the capture also writes its output and exits.

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { homedir, tmpdir } from 'node:os';

// --- self-contained CDP client (does NOT import cdp.mjs to avoid running its CLI) ---
class CDP {
  #ws; #id = 0; #pending = new Map(); #eventHandlers = new Map();
  async connect(wsUrl) {
    return new Promise((res, rej) => {
      this.#ws = new WebSocket(wsUrl);
      this.#ws.onopen = () => res();
      this.#ws.onerror = (e) => rej(new Error('WebSocket: ' + (e.message || e.type)));
      this.#ws.onmessage = (ev) => {
        const msg = JSON.parse(ev.data);
        if (msg.id && this.#pending.has(msg.id)) {
          const { resolve, reject } = this.#pending.get(msg.id);
          this.#pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        } else if (msg.method && this.#eventHandlers.has(msg.method)) {
          for (const h of [...this.#eventHandlers.get(msg.method)]) h(msg.params || {}, msg);
        }
      };
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      const msg = { id, method, params, ...(sessionId ? { sessionId } : {}) };
      this.#ws.send(JSON.stringify(msg));
      setTimeout(() => {
        if (this.#pending.has(id)) { this.#pending.delete(id); reject(new Error('Timeout: ' + method)); }
      }, 15000);
    });
  }
  onEvent(method, handler) {
    if (!this.#eventHandlers.has(method)) this.#eventHandlers.set(method, new Set());
    this.#eventHandlers.get(method).add(handler);
  }
  close() { this.#ws.close(); }
}

function getWsUrl() {
  const home = homedir();
  const candidates = [
    process.env.CDP_PORT_FILE,
    // Perfil dedicado (chrome-debug) — prioridade máxima pra evitar attachar
    // no Chrome principal por engano. Mesmo path do cdp.mjs.
    resolve(home, '.chrome-cdp-profile/DevToolsActivePort'),
    resolve(home, 'Library/Application Support/Google/Chrome/DevToolsActivePort'),
    resolve(home, 'Library/Application Support/Google/Chrome Beta/DevToolsActivePort'),
    resolve(home, 'Library/Application Support/Chromium/DevToolsActivePort'),
    resolve(home, '.config/google-chrome/DevToolsActivePort'),
    resolve(home, '.config/chromium/DevToolsActivePort'),
  ].filter(Boolean);
  const portFile = candidates.find(p => existsSync(p));
  if (!portFile) throw new Error('No DevToolsActivePort found. Enable: chrome://inspect/#remote-debugging');
  const lines = readFileSync(portFile, 'utf8').trim().split('\n');
  return `ws://${process.env.CDP_HOST || '127.0.0.1'}:${lines[0]}${lines[1]}`;
}

// --- capture logic ---

const NOISE_RESOURCE_TYPES = new Set(['Image', 'Font', 'Media', 'Stylesheet', 'Manifest', 'Other']);
const NOISE_HOST_RE = /google-?analytics|googletagmanager|doubleclick|facebook\.net|hotjar|clarity|amplitude|segment|mixpanel|heap|intercom|hubspot|drift|crisp|tawk|cloudfront\.net.*\.png/i;

function shouldDrop(req) {
  if (req.events.requestWillBeSent) {
    const type = req.events.requestWillBeSent.type;
    if (NOISE_RESOURCE_TYPES.has(type)) return true;
  }
  const url = req.derived.url || req.events.requestWillBeSent?.request?.url || '';
  if (!url) return true;
  if (NOISE_HOST_RE.test(url)) return true;
  return false;
}

function deriveRecord(rec) {
  const rws = rec.events.requestWillBeSent;
  const rwx = rec.events.requestWillBeSentExtraInfo;
  const rrs = rec.events.responseReceived;
  const rrx = rec.events.responseReceivedExtraInfo;

  const reqHeaders = rwx?.headers || rws?.request?.headers || {};
  const resHeaders = rrx?.headers || rrs?.response?.headers || {};
  const status = rrx?.statusCode ?? rrs?.response?.status ?? null;
  const cookieHeader = reqHeaders.Cookie ?? reqHeaders.cookie ?? null;
  const setCookieRaw = resHeaders['Set-Cookie'] ?? resHeaders['set-cookie'] ?? null;

  rec.derived = {
    url: rws?.request?.url ?? null,
    method: rws?.request?.method ?? null,
    requestHeaders: reqHeaders,
    cookieHeader,
    postData: rws?.request?.postData ?? null,
    status,
    responseHeaders: resHeaders,
    setCookie: setCookieRaw ? String(setCookieRaw).split('\n') : [],
    resourceType: rws?.type ?? null,
    finished: !!(rec.events.loadingFinished || rec.events.loadingFailed),
    failed: !!rec.events.loadingFailed,
  };
}

function buildHarLikeOutput(records) {
  // Mimic enough of HAR shape so parse_har.py reads it directly.
  const entries = [];
  for (const rec of records.values()) {
    const d = rec.derived;
    if (!d.url || !d.finished) continue;
    if (shouldDrop(rec)) continue;

    const requestHeaders = Object.entries(d.requestHeaders).map(([name, value]) => ({ name, value: String(value) }));
    const responseHeaders = [];
    for (const [name, value] of Object.entries(d.responseHeaders)) {
      const lines = String(value).split('\n');
      for (const v of lines) responseHeaders.push({ name, value: v });
    }
    if (d.cookieHeader && !requestHeaders.some(h => h.name.toLowerCase() === 'cookie')) {
      requestHeaders.push({ name: 'cookie', value: d.cookieHeader });
    }

    entries.push({
      startedDateTime: new Date(rec.createdAt).toISOString(),
      request: {
        method: d.method,
        url: d.url,
        headers: requestHeaders,
        postData: d.postData ? { text: d.postData, mimeType: requestHeaders.find(h => h.name.toLowerCase() === 'content-type')?.value || '' } : undefined,
      },
      response: {
        status: d.status ?? 0,
        statusText: '',
        headers: responseHeaders,
        content: { size: 0, mimeType: d.responseHeaders['content-type'] || d.responseHeaders['Content-Type'] || '' },
      },
      _resourceType: d.resourceType,
      _failed: d.failed,
    });
  }
  return { log: { version: '1.2', creator: { name: 'capture.mjs', version: '1.0' }, pages: [], entries } };
}

async function startCapture(targetPrefix, outPath) {
  const wsUrl = getWsUrl();
  const cdp = new CDP();
  await cdp.connect(wsUrl);

  // Find target by prefix
  const { targetInfos } = await cdp.send('Target.getTargets');
  const pages = targetInfos.filter(t => t.type === 'page');
  const upper = targetPrefix.toUpperCase();
  const matches = pages.filter(p => p.targetId.toUpperCase().startsWith(upper));
  if (matches.length === 0) {
    console.error(`No page target matching "${targetPrefix}". Use cdp.mjs list to see options.`);
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`Ambiguous prefix "${targetPrefix}" — ${matches.length} matches.`);
    process.exit(1);
  }
  const target = matches[0];

  // Attach in flat-mode
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: target.targetId, flatten: true });

  // Enable Network with low buffers (we don't need response bodies)
  await cdp.send('Network.enable', {
    maxTotalBufferSize: 1024 * 1024,
    maxResourceBufferSize: 64 * 1024,
    maxPostDataSize: 64 * 1024,
  }, sessionId);

  const records = new Map();
  const ensure = (id) => {
    let r = records.get(id);
    if (!r) {
      r = {
        id, createdAt: Date.now(), lastSeen: Date.now(),
        events: { requestWillBeSent: null, requestWillBeSentExtraInfo: null,
                  responseReceived: null, responseReceivedExtraInfo: null,
                  loadingFinished: null, loadingFailed: null },
        derived: { url: null }, redirects: [],
      };
      records.set(id, r);
    }
    r.lastSeen = Date.now();
    return r;
  };

  const onEvent = (method, key) => (params, msg) => {
    if (msg.sessionId && msg.sessionId !== sessionId) return;
    const r = ensure(params.requestId);
    // Handle redirect: requestWillBeSent with redirectResponse → save current as redirect hop
    if (key === 'requestWillBeSent' && r.events.requestWillBeSent && params.redirectResponse) {
      r.redirects.push({ ...r.events });
      r.events.requestWillBeSent = null;
      r.events.requestWillBeSentExtraInfo = null;
    }
    r.events[key] = params;
    deriveRecord(r);
  };

  cdp.onEvent('Network.requestWillBeSent', onEvent('Network.requestWillBeSent', 'requestWillBeSent'));
  cdp.onEvent('Network.requestWillBeSentExtraInfo', onEvent('Network.requestWillBeSentExtraInfo', 'requestWillBeSentExtraInfo'));
  cdp.onEvent('Network.responseReceived', onEvent('Network.responseReceived', 'responseReceived'));
  cdp.onEvent('Network.responseReceivedExtraInfo', onEvent('Network.responseReceivedExtraInfo', 'responseReceivedExtraInfo'));
  cdp.onEvent('Network.loadingFinished', onEvent('Network.loadingFinished', 'loadingFinished'));
  cdp.onEvent('Network.loadingFailed', onEvent('Network.loadingFailed', 'loadingFailed'));

  // Periodic GC: drop stale records (>2min idle, never finished)
  setInterval(() => {
    const cutoff = Date.now() - 2 * 60 * 1000;
    for (const [id, r] of records) {
      if (!r.derived.finished && r.lastSeen < cutoff) records.delete(id);
    }
  }, 60 * 1000);

  console.error(`✓ Capturing on target ${target.targetId.slice(0, 8)} (${target.url})`);
  console.error(`  Output → ${outPath}`);
  console.error(`  Stop with Ctrl+C or by writing to ${stopFlagPath()}`);

  // Stop signal
  let stopping = false;
  const flush = () => {
    if (stopping) return;
    stopping = true;
    console.error(`\n⏹  Stopping. ${records.size} requests captured. Writing output…`);
    const har = buildHarLikeOutput(records);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, JSON.stringify(har, null, 2));
    console.error(`✓ Written to ${outPath} (${har.log.entries.length} api entries after filtering)`);
    cdp.close();
    process.exit(0);
  };
  process.on('SIGINT', flush);
  process.on('SIGTERM', flush);

  // Watch for stop flag file (so `capture.mjs stop` can signal us)
  setInterval(() => {
    if (existsSync(stopFlagPath())) {
      try { unlinkSync(stopFlagPath()); } catch {}
      flush();
    }
  }, 500);

  // Keep the process alive
  await new Promise(() => {});
}

function stopFlagPath() {
  return resolve(tmpdir(), 'capture-mjs-stop.flag');
}

async function sendStop() {
  writeFileSync(stopFlagPath(), String(Date.now()));
  console.error(`✓ Stop signal sent to running capture (flag: ${stopFlagPath()})`);
}

// --- CLI ---
const [cmd, ...args] = process.argv.slice(2);

if (cmd === 'start') {
  const targetPrefix = args[0];
  if (!targetPrefix) { console.error('Usage: capture.mjs start <target-prefix> [--out path]'); process.exit(1); }
  const outIdx = args.indexOf('--out');
  const outPath = outIdx >= 0 ? args[outIdx + 1] : `/tmp/capture-${Date.now()}.json`;
  await startCapture(targetPrefix, outPath);
} else if (cmd === 'stop') {
  await sendStop();
} else {
  console.error(`Usage:
  capture.mjs start <target-prefix> [--out <path>]
  capture.mjs stop

Run cdp.mjs list first to find target prefixes.
Default output: /tmp/capture-<timestamp>.json (HAR-compatible, feed to parse_har.py).`);
  process.exit(1);
}
