/* Trích màn “Bộ hồ sơ vụ án” (nút “Hồ sơ tài liệu” của tab Tờ trình / Đề xuất / Thẩm định) từ prototype V41 bằng Chrome DevTools Protocol.
   Chạy: node tools/extract-ho-so.cjs <thư-mục-ra>
   Ghi: frame-rules.json (CSS trong khung app Ký số, gồm cả luật áp lên phần tử cha của #v-flow), parent-rules.json (CSS cửa sổ V33 ở trang cha),
        states.json (DOM từng trạng thái), meta.json, goc-<trạng-thái>.png (ảnh toàn khung nhìn 1600×1000). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const OUT = process.argv[2]; if (!OUT) { console.error('Cách dùng: node tools/extract-ho-so.cjs <thư-mục-ra>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const PROTO = path.resolve(__dirname, '..', '..', 'prototype', 'prototypes');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 400)); return r.result.value; }
const FR = `(document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe'))`;
/* Thu luật CSS của tài liệu D khớp với cây con của các gốc ROOTS hoặc với chính chuỗi phần tử cha của chúng (đến <html>). */
const COLLECT = (docExpr, rootsExpr) => `(() => {
  const d = ${docExpr}, roots = (${rootsExpr}).filter(Boolean);
  const anc = new Set(); roots.forEach(r => { for (let e = r.parentElement; e; e = e.parentElement) anc.add(e); });
  const DYN = /::?(hover|focus-visible|focus-within|focus|active|visited|link|placeholder-shown|placeholder|before|after|selection|marker|-webkit-[\\w-]+|-moz-[\\w-]+|checked|disabled|enabled|invalid|valid|required|optional|read-only|read-write|indeterminate|default|empty|target)(\\([^)]*\\))?/g;
  const splitSel = s => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const hit = base => { try { if (roots.some(r => r.matches(base) || r.querySelector(base))) return true; for (const a of anc) if (a.matches(base)) return true; } catch (e) { } return false; };
  const used = []; let seq = 0;
  const visit = (rules, wrap) => { for (const r of rules) { const ord = seq++;
    if (r.type === 1) { const keep = splitSel(r.selectorText).filter(p => hit(p.replace(DYN, '').replace(/:not\\(\\s*\\)/g, '').replace(/\\s+(?=[>+~]|$)/g, '').trim() || '*')); if (keep.length) used.push({ wrap, sel: keep, css: r.style.cssText, ord }); }
    else if (r.type === 4) visit(r.cssRules, '@media ' + r.conditionText); else if (r.type === 12) visit(r.cssRules, '@supports ' + r.conditionText);
    else if (r.cssRules && r.constructor && r.constructor.name === 'CSSContainerRule') visit(r.cssRules, '@container ' + r.conditionText);
    else if (r.type === 7) used.push({ wrap, keyframes: r.cssText, ord }); } };
  for (const sh of d.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } visit(rs, ''); }
  const chain = roots.length ? (() => { const c = []; for (let e = roots[0]; e; e = e.parentElement) c.unshift({ tag: e.tagName.toLowerCase(), id: e.id, cls: typeof e.className === 'string' ? e.className : '', style: e.getAttribute('style') || '' }); return c; })() : [];
  return { used, chain };
})()`;
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'exh-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: fileUrl(path.join(PROTO, 'ky-so-to-trinh.html')) }); await l;
  for (let i = 0; i < 100; i++) { if (await ev(cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.querySelector('#t-totrinh .v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  const inF = js => ev(cdp, `(() => { const d = ${FR}.contentDocument, w = ${FR}.contentWindow; ${js} })()`);
  // bỏ popup “ý kiến chỉ đạo cần xác nhận” (xuất hiện ở lần mở đầu) – không thuộc màn này
  await ev(cdp, `(() => { [...document.querySelectorAll('body > *')].forEach(e => { if (/ý kiến chỉ đạo cần xác nhận/i.test(e.textContent || '') && getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important'); }); [...document.querySelectorAll('body > *')].forEach(e => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /rgba\\(.*0\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width >= innerWidth - 2 && !e.className.toString().includes('v33')) e.style.setProperty('display', 'none', 'important'); }); })()`);
  await inF(`d.querySelector('#t-totrinh [data-act="hoso"]').click(); return 1;`);
  for (let i = 0; i < 40; i++) { if (await ev(cdp, `document.body.classList.contains('v33-ifon') && !!document.querySelector('.v33-wbar')`).catch(() => false) === true) break; await sleep(250); }
  await sleep(1500);
  const states = {}, frameU = [], parentU = [];
  const addU = (arr, used) => used.forEach(u => { const k = u.ord + '|' + (u.sel ? u.sel.join(',') : u.keyframes); if (!arr.find(x => x.k === k)) arr.push(Object.assign({ k }, u)); });
  async function snap(name) {
    await sleep(500);
    await inF(`w.scrollTo(0, 0); return 1;`);
    const f = await ev(cdp, COLLECT(`${FR}.contentDocument`, `[${FR}.contentDocument.getElementById('v-flow')]`)); addU(frameU, f.used);
    const p = await ev(cdp, COLLECT('document', `[...document.querySelectorAll('.v33-wbar, .v33-wback, .v33-ifmini, .v33-ifph'), ${FR}]`)); addU(parentU, p.used);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, 'goc-' + name + '.png'), Buffer.from(shot.data, 'base64'));
    states[name] = {
      flow: await inF(`const v = d.getElementById('v-flow'); return v ? v.outerHTML : '';`),
      parent: await ev(cdp, `[...document.querySelectorAll('.v33-wbar, .v33-wback, .v33-ifmini, .v33-ifph')].map(e => e.outerHTML)`),
      htmlClass: await inF(`return d.documentElement.className + ' | ' + d.documentElement.getAttribute('style');`),
      iframe: await ev(cdp, `(() => { const f = ${FR}, cs = getComputedStyle(f), r = f.getBoundingClientRect(); return { cls: f.className, rect: [r.left, r.top, r.width, r.height], position: cs.position, inset: [cs.top, cs.right, cs.bottom, cs.left].join(' '), z: cs.zIndex, bg: cs.backgroundColor, border: cs.border, display: cs.display, visibility: cs.visibility }; })()`),
      chain: f.chain,
    };
    console.log('snap', name, '· luật khung:', f.used.length, '· luật trang cha:', p.used.length);
  }
  await snap('mac-dinh');
  await inF(`d.querySelector('#v-flow [data-act="hs-f"][data-id="t_bc"]').click(); return 1;`); await snap('cay-tap-bi-can');
  await inF(`d.querySelector('#v-flow [data-act="hs-f"][data-id="all"]').click(); return 1;`); await sleep(500);
  await inF(`const q = d.getElementById('hsq'); q.value = 'trích xuất'; q.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(700); await snap('tim-trich-xuat');
  await inF(`d.querySelector('#v-flow [data-act="hs-clear"]').click(); return 1;`); await sleep(500);
  await inF(`const s = d.getElementById('hsst'); s.value = 'Đã ban hành'; s.dispatchEvent(new Event('change', { bubbles: true })); return 1;`); await sleep(700); await snap('trang-thai-da-ban-hanh');
  await inF(`d.querySelector('#v-flow [data-act="hs-clear"]').click(); return 1;`); await sleep(500);
  await inF(`d.querySelector('#v-flow [data-act="hs-tab:ml"]').click(); return 1;`); await snap('muc-luc');
  await inF(`d.querySelector('#v-flow [data-act="hs-tab:ds"]').click(); return 1;`); await sleep(500);
  await ev(cdp, `(() => { document.querySelector('.v33-wbar [data-v33w="min"]').click(); return 1; })()`); await snap('thu-nho');
  await ev(cdp, `(() => { document.querySelector('.v33-ifmini [data-v33w="max"]').click(); return 1; })()`); await sleep(800);
  await ev(cdp, `(() => { document.querySelector('.v33-wbar [data-v33w="close"]').click(); return 1; })()`); await sleep(1000);
  states.sauKhiDong = await inF(`return { route: w.eval('S.route'), ifon: parent.document.body.classList.contains('v33-ifon'), list: !!d.querySelector('#t-totrinh .v23-tb') };`);
  frameU.sort((a, b) => a.ord - b.ord); parentU.sort((a, b) => a.ord - b.ord);
  fs.writeFileSync(path.join(OUT, 'frame-rules.json'), JSON.stringify(frameU, null, 1));
  fs.writeFileSync(path.join(OUT, 'parent-rules.json'), JSON.stringify(parentU, null, 1));
  fs.writeFileSync(path.join(OUT, 'states.json'), JSON.stringify(states, null, 1));
  console.log('tổng luật khung:', frameU.length, '· trang cha:', parentU.length, '· sau khi Đóng:', JSON.stringify(states.sauKhiDong));
  proc.kill(); process.exit(0);
})();
