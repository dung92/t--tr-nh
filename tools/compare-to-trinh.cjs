/* So bản React của tab “Tờ trình / Đề xuất / Thẩm định” với ảnh chụp prototype V41 (cùng chuỗi thao tác, cùng vùng chụp 1320px).
   Chạy: (1) npm run build && npx vite preview --port 4173 --strictPort   (2) node tools/compare-to-trinh.cjs <thư-mục-ảnh-gốc> <thư-mục-ra> [url]
   Ảnh gốc goc-<trạng-thái>.png do tools/extract-to-trinh.cjs chụp từ prototype/prototypes/ky-so-to-trinh.html.
   Ghi react-<trạng-thái>.png và khac-<trạng-thái>.png (điểm khác tô đỏ) vào thư mục ra; in tỉ lệ điểm ảnh khác. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), { spawn } = require('child_process');
const [, , GOC, OUT, URL0] = process.argv; const TARGET = URL0 || 'http://127.0.0.1:4173/';
if (!GOC || !OUT) { console.error('Cách dùng: node tools/compare-to-trinh.cjs <thư-mục-ảnh-gốc> <thư-mục-ra> [url]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- PNG ---- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function dec(buf) {
  let p = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; p += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * 4); let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = line[x]; if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[x] = v & 255; }
    for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, i = x * bpp; out[o] = cur[i]; out[o + 1] = cur[i + 1]; out[o + 2] = cur[i + 2]; out[o + 3] = 255; }
    const t = prev; prev = cur; cur = t; }
  return { w, h, data: out };
}
function enc(w, h, rgba) {
  const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'ascii'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b; };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1)); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function diff(a, b) {
  const A = dec(a), B = dec(b), w = Math.min(A.w, B.w), h = Math.min(A.h, B.h), out = Buffer.alloc(w * h * 4); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * A.w + x) * 4, j = (y * B.w + x) * 4, o = (y * w + x) * 4;
    const d = Math.max(Math.abs(A.data[i] - B.data[j]), Math.abs(A.data[i + 1] - B.data[j + 1]), Math.abs(A.data[i + 2] - B.data[j + 2]));
    if (d > 24) { n++; out[o] = 230; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    else { const g = 255 - ((255 - ((B.data[j] * 3 + B.data[j + 1] * 6 + B.data[j + 2]) / 10)) * 0.35) | 0; out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255; }
  }
  return { n, ratio: n / (w * h), size: [A.w + '×' + A.h, B.w + '×' + B.h], bbox: n ? [x0, y0, x1, y1] : null, png: enc(w, h, out) };
}

/* ---- CDP ---- */
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 300)); return r.result.value; }
const R = '.kyso-tt';
const SETV = (sel, v, evt) => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new Event(${JSON.stringify(evt)}, { bubbles: true })); return 1; })()`;
const CLICK = sel => `(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.click(); return 1; })()`;
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cmp-react-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1320,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1320, height: 1800, deviceScaleFactor: 1, mobile: false });
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: TARGET }); await l;
  await ev(cdp, 'document.fonts.ready.then(() => 1)'); await sleep(800);
  const results = [];
  async function snap(name) {
    await sleep(400);
    const r = await ev(cdp, `(() => { const p = document.querySelector('${R} .t-totrinh').getBoundingClientRect(); return { x: p.left + scrollX, y: p.top + scrollY, w: p.width, h: p.height }; })()`);
    const shot = Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: Math.min(r.h + 220, 1600), scale: 1 }, captureBeyondViewport: false })).data, 'base64');
    fs.writeFileSync(path.join(OUT, 'react-' + name + '.png'), shot);
    const gp = path.join(GOC, 'goc-' + name + '.png'); if (!fs.existsSync(gp)) { results.push({ name, note: 'không có ảnh gốc' }); return; }
    const d = diff(fs.readFileSync(gp), shot); fs.writeFileSync(path.join(OUT, 'khac-' + name + '.png'), d.png);
    results.push({ name, ratio: d.ratio, n: d.n, size: d.size, bbox: d.bbox });
    console.log(name.padEnd(24), (d.ratio * 100).toFixed(3).padStart(7) + '% điểm ảnh khác', 'kích thước gốc/React', d.size.join(' / '), d.bbox ? 'vùng ' + d.bbox.join(',') : '');
  }
  await snap('mac-dinh');
  await ev(cdp, CLICK(`${R} .dd > .btn`)); await snap('menu-them-moi');
  await ev(cdp, `(() => { document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); return 1; })()`);
  await ev(cdp, CLICK(`${R} .v23-advb`)); await snap('loc-nang-cao');
  await ev(cdp, CLICK(`${R} .v23-ms button`)); await snap('loc-nang-cao-chon-loai');
  await ev(cdp, CLICK(`${R} .v23-adv-f .ghost`)); await ev(cdp, CLICK(`${R} .v23-adv-f .pri`));
  await ev(cdp, SETV(`${R} .tt-q`, '1185', 'input')); await snap('tim-1185');
  await ev(cdp, SETV(`${R} .tt-q`, '', 'input'));
  await ev(cdp, SETV(`${R} .tt-st`, 'Từ chối', 'change')); await snap('trang-thai-tu-choi');
  await ev(cdp, SETV(`${R} .tt-st`, '', 'change'));
  await ev(cdp, SETV(`${R} .tt-q`, 'zzzz', 'input')); await snap('rong-tim-kiem');
  await ev(cdp, SETV(`${R} .tt-q`, '', 'input'));
  await ev(cdp, CLICK(`${R} .v23-advb`)); await ev(cdp, SETV(`${R} .v23-adv input[type="text"]`, 'xyz', 'input')); await snap('rong-loc-nang-cao');
  await ev(cdp, CLICK(`${R} .v23-adv-f .ghost`)); await ev(cdp, CLICK(`${R} .v23-adv-f .pri`));
  for (const [i, m] of [[1, 'xa'], [2, 'nb'], [0, 'pc']]) { await ev(cdp, `(() => { document.querySelectorAll('${R} .seg button')[${i}].click(); return 1; })()`); await snap('che-do-' + m); }
  fs.writeFileSync(path.join(OUT, 'ket-qua.json'), JSON.stringify(results, null, 1));
  proc.kill(); process.exit(0);
})();
