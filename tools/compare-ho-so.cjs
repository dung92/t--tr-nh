/* So màn “Bộ hồ sơ vụ án” (nút Hồ sơ tài liệu) giữa prototype V41 và bản React – chạy cả hai trong cùng lượt, cùng chuỗi thao tác.
   Chạy: (1) npm run build && npx vite preview --port 4173 --strictPort   (2) node tools/compare-ho-so.cjs <thư-mục-ra> [url-react]
   Trạng thái phóng to: so nguyên khung nhìn 1600×1000. Trạng thái thu nhỏ: cắt vùng ô nổi (.v33-ifmini) và dải giữ chỗ (.v33-ifph) ở mỗi bên. */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), zlib = require('zlib'), { spawn } = require('child_process');
const [, , OUT, R0] = process.argv; const REACT = R0 || 'http://localhost:4173/';
if (!OUT) { console.error('Cách dùng: node tools/compare-ho-so.cjs <thư-mục-ra> [url-react]'); process.exit(2); }
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
const crop = (img, x, y, w, h) => { const out = Buffer.alloc(w * h * 4); for (let j = 0; j < h; j++) img.data.copy(out, j * w * 4, ((y + j) * img.w + x) * 4, ((y + j) * img.w + x + w) * 4); return { w, h, data: out }; };
function diff(A, B) { const w = Math.min(A.w, B.w), h = Math.min(A.h, B.h), out = Buffer.alloc(w * h * 4); let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * A.w + x) * 4, j = (y * B.w + x) * 4, o = (y * w + x) * 4; const d = Math.max(Math.abs(A.data[i] - B.data[j]), Math.abs(A.data[i + 1] - B.data[j + 1]), Math.abs(A.data[i + 2] - B.data[j + 2]));
    if (d > 24) { n++; out[o] = 230; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; } else { const g = 255 - ((255 - ((B.data[j] * 3 + B.data[j + 1] * 6 + B.data[j + 2]) / 10)) * 0.35) | 0; out[o] = out[o + 1] = out[o + 2] = g; out[o + 3] = 255; } }
  return { n, ratio: n / (w * h), size: A.w + '×' + A.h + ' / ' + B.w + '×' + B.h, bbox: n ? [x0, y0, x1, y1] : null, png: enc(w, h, out) }; }
/* ---- CDP ---- */
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 300)); return r.result.value; }
async function browser() {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'cmphs-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  return { proc, cdp };
}
const shot = async cdp => dec(Buffer.from((await cdp.send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
const rectOf = (cdp, sel) => ev(cdp, `(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })()`);
const SETV = (doc, sel, v, evt) => `(() => { const d = ${doc}; const el = d.querySelector(${JSON.stringify(sel)}); const proto = el.tagName === 'SELECT' ? d.defaultView.HTMLSelectElement.prototype : d.defaultView.HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(v)}); el.dispatchEvent(new d.defaultView.Event(${JSON.stringify(evt)}, { bubbles: true })); return 1; })()`;
const CLICK = (doc, sel, text) => `(() => { const d = ${doc}; const el = [...d.querySelectorAll(${JSON.stringify(sel)})].find(e => !${JSON.stringify(text || '')} || (e.textContent || '').includes(${JSON.stringify(text || '')})); el.click(); return 1; })()`;
(async () => {
  const FR = `document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe')`, FD = `(${FR}).contentDocument`;
  // ---- bản gốc ----
  const A = await browser(); let l = A.cdp.once('Page.loadEventFired', 60000); await A.cdp.send('Page.navigate', { url: fileUrl(PROTO) }); await l;
  for (let i = 0; i < 100; i++) { if (await ev(A.cdp, `!!(${FR} && ${FD} && ${FD}.querySelector('#t-totrinh .v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  await ev(A.cdp, `(() => { [...document.querySelectorAll('body > *')].forEach(e => { if (/ý kiến chỉ đạo cần xác nhận/i.test(e.textContent || '') && getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important'); }); [...document.querySelectorAll('body > *')].forEach(e => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /rgba\\(.*0\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width >= innerWidth - 2 && !e.className.toString().includes('v33')) e.style.setProperty('display', 'none', 'important'); }); })()`);
  // ---- React ----
  const B = await browser(); l = B.cdp.once('Page.loadEventFired', 60000); await B.cdp.send('Page.navigate', { url: REACT }); await l; await ev(B.cdp, 'document.fonts.ready.then(() => 1)'); await sleep(600);
  const steps = [
    ['mo', () => ev(A.cdp, CLICK(FD, '#t-totrinh [data-act="hoso"]')), () => ev(B.cdp, CLICK('document', '.kyso-tt .v23-tb .r .btn', 'Hồ sơ tài liệu'))],
  ];
  const results = [];
  async function both(name, fa, fb, mode) {
    await fa(); await fb(); await sleep(1300);
    await ev(A.cdp, `(() => { try { ${FR}.contentWindow.scrollTo(0, 0); } catch (e) { } return 1; })()`);
    const a = await shot(A.cdp), b = await shot(B.cdp);
    let pairs = [[name, a, b]];
    if (mode === 'min') {
      pairs = [];
      for (const [label, sel] of [['o-thu-nho', '.v33-ifmini'], ['dai-giu-cho', '.v33-ifph']]) {
        const ra = await rectOf(A.cdp, sel), rb = await rectOf(B.cdp, sel);
        if (!ra || !rb) { results.push({ name: name + '/' + label, note: 'không thấy phần tử' }); continue; }
        pairs.push([name + '-' + label, crop(a, ...ra), crop(b, ...rb)]);
      }
    }
    cmpPairs(pairs);
  }
  function cmpPairs(pairs) {
    for (const [n, x, y] of pairs) {
      const d = diff(x, y); fs.writeFileSync(path.join(OUT, 'goc-' + n + '.png'), enc(x.w, x.h, x.data)); fs.writeFileSync(path.join(OUT, 'react-' + n + '.png'), enc(y.w, y.h, y.data)); fs.writeFileSync(path.join(OUT, 'khac-' + n + '.png'), d.png);
      results.push({ name: n, ratio: d.ratio, size: d.size, bbox: d.bbox });
      console.log(n.padEnd(36), (d.ratio * 100).toFixed(3).padStart(7) + '% điểm ảnh khác', d.size, d.bbox ? 'vùng ' + d.bbox.join(',') : '');
    }
  }
  /* ---- trình xem văn bản: thao tác như nhau ở hai bên rồi so ----
     Bản gốc: khi có hộp thoại, lớp V19 đẩy trang phía sau xuống 44px (iframe trong cửa sổ V33 không nới được) – bản React giữ trang
     đứng yên, nên so riêng vùng hộp thoại; ảnh toàn khung chỉ để tham khảo. */
  const clk = async (selA, selB, iA = 0, iB = iA) => {
    await ev(A.cdp, `(() => { ${FD}.querySelectorAll(${JSON.stringify(selA)})[${iA}].click(); return 1; })()`);
    await ev(B.cdp, `(() => { document.querySelectorAll(${JSON.stringify(selB)})[${iB}].click(); return 1; })()`);
  };
  const typ = async (selA, selB, v) => { await ev(A.cdp, SETV(FD, selA, v, 'input')); await ev(B.cdp, SETV('document', selB, v, 'input')); };
  const DLG_A = `(() => { const f = ${FR}, fr = f.getBoundingClientRect(), g = f.contentDocument.getElementById('dlg'); if (!g || !g.open) return null; const r = g.getBoundingClientRect(); return [Math.round(fr.left + r.left), Math.round(fr.top + r.top), Math.round(r.width), Math.round(r.height)]; })()`;
  async function snapDlg(name) {
    await sleep(700);
    const a = await shot(A.cdp), b = await shot(B.cdp);
    const ra = await ev(A.cdp, DLG_A), rb = await rectOf(B.cdp, '.kyso-hs dialog.modal');
    if (!ra || !rb) { console.log(name, 'không thấy hộp thoại', ra, rb); results.push({ name, note: 'không thấy hộp thoại' }); return; }
    if (ra.join() !== rb.join()) console.log(name, '· khung hộp thoại khác: gốc', ra.join(','), '/ React', rb.join(','));
    cmpPairs([[name + '-hop-thoai', crop(a, ...ra), crop(b, ...rb)], [name + '-toan-khung', a, b]]);
  }
  async function snapAll(name) { await sleep(700); cmpPairs([[name, await shot(A.cdp), await shot(B.cdp)]]); }
  async function viewerSteps() {
    const ROW_A = n => `#v-flow table.tb tbody tr:nth-child(${n})`, ROW_B = n => `.kyso-hs table.tb tbody tr:nth-child(${n})`;
    const D_A = s => '#dlg ' + s, D_B = s => '.kyso-hs dialog.modal ' + s;
    const both2 = (s, i) => clk(D_A(s), D_B(s), i);
    await clk(ROW_A(1) + ' .acts [data-act="hs-vw"]', ROW_B(1) + ' .acts .icb[title="Xem"]'); await snapDlg('xem-mac-dinh');
    const nA = await ev(A.cdp, `${FD}.querySelectorAll('#dlg .vw-i').length`), nB = await ev(B.cdp, `document.querySelectorAll('.kyso-hs dialog .vw-i').length`);
    console.log('Văn bản trong trình xem: gốc', nA, '/ React', nB);
    for (let i = 0; i < nA; i++) { await both2('.vw-i', i); await sleep(120); }
    await both2('.vw-i[data-vw="t1"]'); await snapDlg('xem-tai-lieu');
    await both2('.vw-i[data-vw="qd1"]'); await snapDlg('xem-da-ban-hanh');
    await both2('.vw-i', 0); await sleep(300);
    await both2('[data-v19vw="list"]'); await snapDlg('xem-danh-sach');
    await both2('[data-v19vw="list"]'); await sleep(200);
    await both2('[data-v19vw="zi"]'); await both2('[data-v19vw="zi"]'); await snapDlg('xem-phong-to');
    await both2('[data-v19vw="zo"]'); await both2('[data-v19vw="zo"]'); await sleep(200);
    await both2('[data-v19vw="full"]'); await snapDlg('xem-toan-man-hinh');
    await both2('[data-v19vw="full"]'); await sleep(200);
    await both2('[data-act="v20find"]'); await sleep(200);
    await typ(D_A('.v20-fb input'), D_B('.v20-fb input'), 'vụ án'); await snapDlg('xem-tim');
    await both2('.v20-fb [data-f="next"]'); await snapDlg('xem-tim-ket-qua-2');
    await both2('.v20-fb [data-f="list"]'); await snapDlg('xem-tim-danh-sach');
    await typ(D_A('.v20-fb input'), D_B('.v20-fb input'), 'zzzz'); await snapDlg('xem-tim-khong-thay');
    await typ(D_A('.v20-fb input'), D_B('.v20-fb input'), 'vụ án'); await sleep(400);
    await both2('.v20-fb [data-f="list"]'); await sleep(200); await both2('.v20-fb [data-f="close"]'); await sleep(200);
    await both2('.v24-arw.next'); await snapDlg('xem-van-ban-sau');
    await both2('.vw-tb [data-act="close"]'); await snapAll('sau-khi-xem');
    await clk(ROW_A(5) + ' .lnk[data-act="hs-vw"]', ROW_B(5) + ' .lnk'); await snapDlg('xem-tu-link');
    await both2('.mh [data-act="close"]'); await sleep(400);
    // bấm nền tối → đóng
    await clk(ROW_A(2) + ' .acts [data-act="hs-vw"]', ROW_B(2) + ' .acts .icb[title="Xem"]'); await sleep(600);
    for (const X of [A, B]) { await X.cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 200, y: 500, button: 'left', clickCount: 1 }); await X.cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 200, y: 500, button: 'left', clickCount: 1 }); }
    await sleep(500);
    const closedA = await ev(A.cdp, `!${FD}.getElementById('dlg').open`), closedB = await ev(B.cdp, `!document.querySelector('.kyso-hs dialog.modal')`);
    console.log('Bấm nền tối → đóng: gốc', closedA, '/ React', closedB); results.push({ name: 'nen-toi-dong', a: closedA, b: closedB });
    // mắt ở dòng không có trong trình xem (tờ trình mẫu thuộc AK) → mở văn bản đầu
    const miss = await ev(A.cdp, `(() => { const ids = new Set([...${FD}.querySelectorAll('#dlg .vw-i')].map(e => e.dataset.vw)); return [...${FD}.querySelectorAll('#v-flow table.tb tbody tr')].findIndex(tr => { const b = tr.querySelector('.acts [data-act="hs-vw"]'); return b && !['qd5','qd6','vc3','vc4','hd8','hd9','t1','t2','t3','t4','qd1','qd2','qd3','qd4','vc1','vc2','hd0','hd1','hd2','hd3','hd4','hd5','hd6','hd7'].includes(b.dataset.id); }); })()`);
    if (miss >= 0) { await clk(ROW_A(miss + 1) + ' .acts [data-act="hs-vw"]', ROW_B(miss + 1) + ' .acts .icb[title="Xem"]'); await snapDlg('xem-khong-co-trong-trinh-xem'); await both2('.mh [data-act="close"]'); await sleep(400); }
    // tải xuống → thông báo
    await clk(ROW_A(1) + ' .acts [data-act="dl"]', ROW_B(1) + ' .acts .icb[title="Tải xuống"]'); await snapAll('tai-xuong'); await sleep(3200);
    // Mục lục → bấm số văn bản
    await clk('#v-flow [data-act="hs-tab:ml"]', '.kyso-hs .tab', 0, 1); await sleep(500);
    await clk(ROW_A(1) + ' .lnk[data-act="hs-vw"]', ROW_B(1) + ' .lnk'); await snapDlg('xem-tu-muc-luc');
    await both2('.mh [data-act="close"]'); await sleep(300);
    await clk('#v-flow [data-act="hs-tab:ds"]', '.kyso-hs .tab', 0); await sleep(400);
  }
  await both('mac-dinh', steps[0][1], steps[0][2]);
  await both('cay-tap-bi-can', () => ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-f"][data-id="t_bc"]')), () => ev(B.cdp, CLICK('document', '.kyso-hs .hs-tn', 'Tập bị can')));
  await ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-f"][data-id="all"]')); await ev(B.cdp, CLICK('document', '.kyso-hs .hs-tn', 'Tất cả văn bản'));
  await both('tim-trich-xuat', () => ev(A.cdp, SETV(FD, '#hsq', 'trích xuất', 'input')), () => ev(B.cdp, SETV('document', '.kyso-hs .hs-q', 'trích xuất', 'input')));
  await ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-clear"]')); await ev(B.cdp, CLICK('document', '.kyso-hs .flt .btn', 'Xóa bộ lọc'));
  await both('trang-thai-da-ban-hanh', () => ev(A.cdp, SETV(FD, '#hsst', 'Đã ban hành', 'change')), () => ev(B.cdp, SETV('document', '.kyso-hs .hs-st', 'Đã ban hành', 'change')));
  await ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-clear"]')); await ev(B.cdp, CLICK('document', '.kyso-hs .flt .btn', 'Xóa bộ lọc'));
  await both('muc-luc', () => ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-tab:ml"]')), () => ev(B.cdp, CLICK('document', '.kyso-hs .tab', 'Mục lục')));
  await ev(A.cdp, CLICK(FD, '#v-flow [data-act="hs-tab:ds"]')); await ev(B.cdp, CLICK('document', '.kyso-hs .tab', 'Danh sách'));
  await sleep(500);
  await viewerSteps();
  await ev(B.cdp, `(() => { document.querySelector('main.demo').style.width = '1320px'; return 1; })()`); // dải giữ chỗ rộng bằng vùng tab của V41
  await both('thu-nho', () => ev(A.cdp, CLICK('document', '.v33-wbar [data-v33w="min"]')), () => ev(B.cdp, CLICK('document', '.v33-wbar [data-v33w="min"]')), 'min');
  // phóng to lại rồi đóng – kiểm tra quay về danh sách
  await ev(A.cdp, CLICK('document', '.v33-ifmini [data-v33w="max"]')); await ev(B.cdp, CLICK('document', '.v33-ifmini .wb', '')); await sleep(900);
  const restoredB = await ev(B.cdp, `document.querySelector('.kyso-hs .tab.on') ? document.querySelector('.kyso-hs .tab.on').textContent.trim() : null`);
  await ev(A.cdp, CLICK('document', '.v33-wbar [data-v33w="close"]')); await ev(B.cdp, CLICK('document', '.v33-wbar .x')); await sleep(1200);
  const afterA = await ev(A.cdp, `!!${FD}.querySelector('#t-totrinh .v23-tb') && !document.body.classList.contains('v33-ifon')`), afterB = await ev(B.cdp, `!!document.querySelector('.kyso-tt .v23-tb') && !document.querySelector('.kyso-win .v33-wbar')`);
  console.log('Phóng to lại (React) – tab đang chọn:', restoredB, '· Đóng → về danh sách: gốc', afterA, '/ React', afterB);
  fs.writeFileSync(path.join(OUT, 'ket-qua.json'), JSON.stringify({ results, restoredB, afterA, afterB }, null, 1));
  A.proc.kill(); B.proc.kill(); process.exit(0);
})();
