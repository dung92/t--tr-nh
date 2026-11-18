/* So các màn app Ký số trong cửa sổ V33 giữa prototype V41 và bản React – cùng chuỗi thao tác, ảnh toàn khung nhìn 1600×1000.
   Chạy: (1) npm run build && npx vite preview --port 4173 --strictPort   (2) node tools/compare-ky-so.cjs <kịch-bản> <thư-mục-ra> [url-react]
   Kịch bản: bcview (số văn bản / mắt ở bảng → Chi tiết báo cáo đề xuất / tờ trình) */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), { spawn } = require('child_process');
const [, , SCEN, OUT, R0] = process.argv; const REACT = R0 || 'http://localhost:4173/';
if (!SCEN || !OUT) { console.error('Cách dùng: node tools/compare-ky-so.cjs <kịch-bản> <thư-mục-ra> [url-react]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const PROTO = path.resolve(__dirname, '..', '..', 'prototype', 'prototypes', 'ky-so-to-trinh.html');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
/* ---- PNG ---- */
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function dec(buf) { let p = 8, w = 0, h = 0, ct = 6; const idat = []; while (p < buf.length) { const len = buf.readUInt32BE(p), t = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); if (t === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; } else if (t === 'IDAT') idat.push(d); else if (t === 'IEND') break; p += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * 4); let prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)); for (let x = 0; x < stride; x++) { const a = x >= bpp ? cur[x - bpp] : 0, b = prev[x], c = x >= bpp ? prev[x - bpp] : 0; let v = line[x]; if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1; else if (f === 4) { const q = a + b - c, pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; } cur[x] = v & 255; } for (let x = 0; x < w; x++) { const o = (y * w + x) * 4, i = x * bpp; out[o] = cur[i]; out[o + 1] = cur[i + 1]; out[o + 2] = cur[i + 2]; out[o + 3] = 255; } const t = prev; prev = cur; cur = t; } return { w, h, data: out }; }
function enc(w, h, rgba) { const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, 'ascii'); d.copy(b, 8); b.writeUInt32BE(crc32(b.subarray(4, 8 + d.length)), 8 + d.length); return b; }; const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6; const raw = Buffer.alloc(h * (w * 4 + 1)); for (let y = 0; y < h; y++) rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]); }
function diff(A, B) { const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h), out = Buffer.alloc(w * h * 4); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * A.w + x) * 4, j = (y * B.w + x) * 4, o = (y * w + x) * 4; const d = Math.max(Math.abs(A.data[i] - B.data[j]), Math.abs(A.data[i + 1] - B.data[j + 1]), Math.abs(A.data[i + 2] - B.data[j + 2]));
    if (d > 24) { n++; out[o] = 230; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } else { const g = 255 - ((255 - ((B.data[j] * 3 + B.data[j + 1] * 6 + B.data[j + 2]) / 10)) * 0.35) | 0; out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255; } }
  return { n, ratio: n / (w * h), bbox: n ? [x0, y0, x1, y1] : null, png: enc(w, h, out) }; }
/* ---- CDP ---- */
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 300)); return r.result.value; }
async function browser() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cmpks-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  return { proc, cdp };
}
const shot = async cdp => dec(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));

/* Kịch bản: [tên, thao tác trên bản gốc (d = document của khung app Ký số), thao tác trên React (d = document)] – null: chỉ thao tác, không chụp */
const Q = (root, sel, i = 0) => `[...d.querySelectorAll(${JSON.stringify(root + sel)})][${i}]`;
const BOTH = (sel, js = '.click()', iA = 0, iB = iA) => [Q('#v-flow ', sel, iA) + js + ';', Q('.kyso-hs ', sel, iB) + js + ';'];
const TYPE = (sel, v) => { const set = `{ const el = %; Object.getOwnPropertyDescriptor(d.defaultView.HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new d.defaultView.Event('input', { bubbles: true })); }`; return [set.replace('%', Q('#v-flow ', sel)), set.replace('%', Q('.kyso-hs ', sel))]; };
const SCENARIOS = {
  bcview: [
    ['s1-thong-tin', `${Q('#t-totrinh ', 'table.tb tbody tr:nth-child(1) .lnk')}.click();`, `${Q('.kyso-tt ', 'table.tb tbody tr:nth-child(1) .lnk')}.click();`],
    ['s1-tai-lieu', ...BOTH('[data-act="v28vt:docs"]')],
    ['s1-tep', ...BOTH('[data-act="v18svdoc"]')],
    ['s1-tep-quay-lai', ...BOTH('[data-act="v18svback"]')],
    ['s1-lich-su', ...BOTH('[data-act="v28vt:hist"]')],
    ['s1-ban-1', ...BOTH('table.v18-ver [data-act="v18sv"][data-v="1"]')],
    ['s1-ban-2', ...BOTH('table.v18-ver [data-act="v18sv"][data-v="2"]')],
    ['s1-thong-tin-2', ...BOTH('[data-act="v28vt:info"]')],
    ['s1-thu-gon', ...BOTH('.sp-l section.card .col')],
    ['s1-mo-lai', ...BOTH('.sp-l section.card .col')],
    ['s1-phong-to', ...BOTH('.pv [data-act="zin"]').map(x => x + x)],
    ['s1-thu-nho', ...BOTH('.pv [data-act="zout"]').map(x => x + x + x)],
    ['s1-vua-khung', ...BOTH('.pv [data-act="zfit"]')],
    ['', ...BOTH('.pv [data-act="v20find"]')],
    ['s1-tim', ...TYPE('.v20-fb input', 'vật chứng')],
    ['s1-tim-dong', ...BOTH('.v20-fb [data-f="close"]')],
    ['s1-tai-ve', ...BOTH('.pv [data-act="dl"]')],
    ['s1-ho-so-vu-an', ...BOTH('[data-act="v28tab"]')],
    ['s1-ho-so-xem', ...BOTH('.v28-hsp [data-act="v18view"]')],
    ['s1-ho-so-quay-lai', ...BOTH('[data-act="v28hvx"]')],
    ['s1-ho-so-dien-tu', ...BOTH('[data-act="v28hoso"]')],
    ['s1-ve-bao-cao', ...BOTH('[data-act="v28ret"]')],
    // Quay lại → về danh sách: trang gốc có cả khung V41 (menu, đầu trang) nên chỉ kiểm tra cửa sổ đã đóng
    ['?s1-quay-lai', ...BOTH('.v35-tb button')],
    ['s2-thong-tin', `${Q('#t-totrinh ', 'table.tb tbody tr:nth-child(2) .acts .icb')}.click();`, `${Q('.kyso-tt ', 'table.tb tbody tr:nth-child(2) .acts .icb')}.click();`],
  ],
  // Thêm mới → Báo cáo đề xuất. Tên bắt đầu “#”: có hộp thoại – so vùng hộp thoại (bản gốc đẩy trang phía sau xuống 44px)
  bcdx: [
    ['bcdx-thong-tin', `${Q('#t-totrinh ', '.dd > .btn')}.click(); ${Q('#t-totrinh ', '.dd-menu [data-act="newbc:bc"]')}.click();`, `${Q('.kyso-tt ', '.dd-menu .mi')}.click();`],
    ['bcdx-van-ban', ...BOTH('[data-act="bcxtab:drafts"]')],
    ['#bcdx-chon-van-ban', ...BOTH('[data-act="pickvb"]')],
    ['#bcdx-chon-2', `${Q('#dlg ', '[data-act="pkrow"]', 0)}.click(); ${Q('#dlg ', '[data-act="pkrow"]', 1)}.click();`, `${Q('.kyso-hs dialog ', '[data-act="pkrow"]', 0)}.click(); ${Q('.kyso-hs dialog ', '[data-act="pkrow"]', 1)}.click();`],
    ['bcdx-chon-xong', `${Q('#dlg ', '[data-act="pkok"]')}.click();`, `${Q('.kyso-hs dialog ', '[data-act="pkok"]')}.click();`],
    ['bcdx-tai-lieu', ...BOTH('[data-act="bcxtab:docs"]')],
    ['bcdx-bc2', ...BOTH('[data-act="bcxtab:bc2"]')],
    ['bcdx-ho-so', ...BOTH('[data-act="v28tab"]')],
    ['bcdx-ho-so-xem', ...BOTH('.v28-hsp [data-act="v18view"]')],
    ['bcdx-thong-tin-2', ...BOTH('[data-act="bcxtab:info"]')],
    ['bcdx-xem-truoc', ...BOTH('[data-act="bcxpv"]')],
    ['bcdx-tien-trinh', ...BOTH('.lst [data-act="bcxtl"]')],
    ['bcdx-tien-trinh-dong', ...BOTH('.lst [data-act="bcxtl"]')],
    ['bcdx-thu-gon', ...BOTH('[data-act="bcxfold:1"]')],
    ['bcdx-mo-gon', ...BOTH('[data-act="bcxfold:0"]')],
    ['bcdx-mo-rong', ...BOTH('.v35-tb [data-v35="pv"]')],
    ['bcdx-mo-rong-2', ...BOTH('.v35-tb [data-v35="pv"]')],
    ['', ...TYPE('[data-k="trichYeu"]', '')],
    ['bcdx-thieu', ...BOTH('.v35-tb [data-v35="2"]')],
    ['bcdx-du', ...TYPE('[data-k="trichYeu"]', 'Đề xuất phê duyệt văn bản tố tụng trong vụ án VA26-000001')],
    ['#bcdx-luu-ky-so', ...BOTH('.v35-tb [data-v35="2"]')],
    ['bcdx-luu-ky-so-dong', `${Q('#dlg ', '[data-act="close"]')}.click();`, `${Q('.kyso-hs dialog ', '[data-act="close"]')}.click();`],
    ['bcdx-luu-nhap', ...BOTH('.v35-tb [data-v35="1"]')],
  ],
};
(async () => {
  const steps = SCENARIOS[SCEN]; if (!steps) throw new Error('Không có kịch bản ' + SCEN);
  const FR = `document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe')`;
  const A = await browser(); let l = A.cdp.once('Page.loadEventFired', 60000); await A.cdp.send('Page.navigate', { url: fileUrl(PROTO) }); await l;
  for (let i = 0; i < 100; i++) { if (await ev(A.cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.querySelector('#t-totrinh .v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  await ev(A.cdp, `(() => { [...document.querySelectorAll('body > *')].forEach(e => { if (/ý kiến chỉ đạo cần xác nhận/i.test(e.textContent || '') && getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important'); }); [...document.querySelectorAll('body > *')].forEach(e => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /rgba\\(.*0\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width >= innerWidth - 2 && !e.className.toString().includes('v33')) e.style.setProperty('display', 'none', 'important'); }); })()`);
  const B = await browser(); l = B.cdp.once('Page.loadEventFired', 60000); await B.cdp.send('Page.navigate', { url: REACT }); await l; await ev(B.cdp, 'document.fonts.ready.then(() => 1)'); await sleep(600);
  const results = [];
  for (const [name, jsA, jsB] of steps) {
    try { await ev(A.cdp, `(() => { const d = (${FR}).contentDocument; ${jsA} return 1; })()`); } catch (e) { console.log('!! gốc ' + name + ': ' + e.message.slice(0, 160)); }
    try { await ev(B.cdp, `(() => { const d = document; ${jsB} return 1; })()`); } catch (e) { console.log('!! React ' + name + ': ' + e.message.slice(0, 160)); }
    await sleep(name ? 1500 : 400);
    if (!name) continue;
    if (name[0] === '?') {   // chỉ kiểm tra cửa sổ đã đóng ở cả hai bên
      const ca = await ev(A.cdp, `!document.body.classList.contains('v33-ifon')`), cb = await ev(B.cdp, `!document.querySelector('.kyso-win .v33-wbar')`);
      results.push({ name: name.slice(1), closed: [ca, cb] }); console.log(name.slice(1).padEnd(22), 'cửa sổ đã đóng: gốc', ca, '/ React', cb); continue;
    }
    await ev(B.cdp, 'document.fonts.ready.then(() => 1)');
    let a = await shot(A.cdp), b = await shot(B.cdp), nm = name;
    if (name[0] === '#') {   // so vùng hộp thoại
      nm = name.slice(1);
      const ra = await ev(A.cdp, `(() => { const f = ${FR}, fr = f.getBoundingClientRect(), g = f.contentDocument.getElementById('dlg'); if (!g || !g.open) return null; const r = g.getBoundingClientRect(); return [Math.round(fr.left + r.left), Math.round(fr.top + r.top), Math.round(r.width), Math.round(r.height)]; })()`);
      const rb = await ev(B.cdp, `(() => { const g = document.querySelector('.kyso-hs dialog.modal'); if (!g) return null; const r = g.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()`);
      if (!ra || !rb) { console.log(nm.padEnd(22), 'không thấy hộp thoại', ra, rb); results.push({ name: nm, note: 'không thấy hộp thoại' }); continue; }
      if (ra.join() !== rb.join()) console.log('   khung hộp thoại: gốc', ra.join(','), '/ React', rb.join(','));
      const crop = (img, x, y, w, h) => { const out = Buffer.alloc(w * h * 4); for (let j = 0; j < h; j++) img.data.copy(out, j * w * 4, ((y + j) * img.w + x) * 4, ((y + j) * img.w + x + w) * 4); return { w, h, data: out }; };
      a = crop(a, ...ra); b = crop(b, ...rb);
    }
    const d = diff(a, b);
    fs.writeFileSync(path.join(OUT, 'goc-' + nm + '.png'), enc(a.w, a.h, a.data)); fs.writeFileSync(path.join(OUT, 'react-' + nm + '.png'), enc(b.w, b.h, b.data)); fs.writeFileSync(path.join(OUT, 'khac-' + nm + '.png'), d.png);
    results.push({ name: nm, ratio: d.ratio, bbox: d.bbox });
    console.log((name[0] === '#' ? nm + ' (hộp thoại)' : nm).padEnd(22), (d.ratio * 100).toFixed(3).padStart(7) + '% điểm ảnh khác', d.bbox ? 'vùng ' + d.bbox.join(',') : '');
  }
  fs.writeFileSync(path.join(OUT, 'ket-qua.json'), JSON.stringify(results, null, 1));
  A.proc.kill(); B.proc.kill(); process.exit(0);
})();
