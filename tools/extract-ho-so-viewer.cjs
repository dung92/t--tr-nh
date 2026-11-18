/* Trích trình xem văn bản (“Xem hồ sơ báo cáo” – hộp thoại #dlg.vwr) mở từ màn Bộ hồ sơ vụ án (mắt / tên văn bản) trong prototype V41.
   Chạy: node tools/extract-ho-so-viewer.cjs <thư-mục-ra>
   Ghi: viewer-rules.json (CSS áp lên #dlg và cây con, gồm ::backdrop), items.json (từng văn bản: tiêu đề, nhóm, nội dung giấy),
        states.json (DOM #dlg từng trạng thái), goc-xem-*.png (ảnh toàn khung nhìn 1600×1000). */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const OUT = process.argv[2]; if (!OUT) { console.error('Cách dùng: node tools/extract-ho-so-viewer.cjs <thư-mục-ra>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const PROTO = path.resolve(__dirname, '..', '..', 'prototype', 'prototypes');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 400)); return r.result.value; }
const FR = `(document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe'))`;
const COLLECT = (docExpr, rootsExpr) => `(() => {
  const d = ${docExpr}, roots = (${rootsExpr}).filter(Boolean);
  const anc = new Set(); roots.forEach(r => { for (let e = r.parentElement; e; e = e.parentElement) anc.add(e); });
  const DYN = /::?(hover|focus-visible|focus-within|focus|active|visited|link|placeholder-shown|placeholder|before|after|selection|marker|backdrop|-webkit-[\\w-]+|-moz-[\\w-]+|checked|disabled|enabled|invalid|valid|required|optional|read-only|read-write|indeterminate|default|empty|target|modal|open)(\\([^)]*\\))?/g;
  const splitSel = s => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const hit = base => { try { if (roots.some(r => r.matches(base) || r.querySelector(base))) return true; for (const a of anc) if (a.matches(base)) return true; } catch (e) { } return false; };
  const used = []; let seq = 0;
  const visit = (rules, wrap) => { for (const r of rules) { const ord = seq++;
    if (r.type === 1) { const keep = splitSel(r.selectorText).filter(p => hit(p.replace(DYN, '').replace(/:not\\(\\s*\\)/g, '').replace(/\\s+(?=[>+~]|$)/g, '').trim() || '*')); if (keep.length) used.push({ wrap, sel: keep, css: r.style.cssText, ord }); }
    else if (r.type === 4) visit(r.cssRules, '@media ' + r.conditionText); else if (r.type === 12) visit(r.cssRules, '@supports ' + r.conditionText);
    else if (r.cssRules && r.constructor && r.constructor.name === 'CSSContainerRule') visit(r.cssRules, '@container ' + r.conditionText);
    else if (r.type === 7) used.push({ wrap, keyframes: r.cssText, name: r.name, ord }); } };
  for (const sh of d.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } visit(rs, ''); }
  return { used };
})()`;
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'exv-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: fileUrl(path.join(PROTO, 'ky-so-to-trinh.html')) }); await l;
  for (let i = 0; i < 100; i++) { if (await ev(cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.querySelector('#t-totrinh .v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  const inF = js => ev(cdp, `(() => { const d = ${FR}.contentDocument, w = ${FR}.contentWindow; ${js} })()`);
  await ev(cdp, `(() => { [...document.querySelectorAll('body > *')].forEach(e => { if (/ý kiến chỉ đạo cần xác nhận/i.test(e.textContent || '') && getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important'); }); [...document.querySelectorAll('body > *')].forEach(e => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /rgba\\(.*0\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width >= innerWidth - 2 && !e.className.toString().includes('v33')) e.style.setProperty('display', 'none', 'important'); }); })()`);
  await inF(`d.querySelector('#t-totrinh [data-act="hoso"]').click(); return 1;`);
  for (let i = 0; i < 40; i++) { if (await ev(cdp, `document.body.classList.contains('v33-ifon') && !!document.querySelector('.v33-wbar')`).catch(() => false) === true) break; await sleep(250); }
  await sleep(1500);
  const rules = [], states = {};
  const addU = used => used.forEach(u => { const k = u.ord + '|' + (u.sel ? u.sel.join(',') : u.keyframes); if (!rules.find(x => x.k === k)) rules.push(Object.assign({ k }, u)); });
  const rows = await inF(`return [...d.querySelectorAll('#v-flow table.tb tbody tr')].map(tr => ({ id: (tr.querySelector('[data-act="hs-vw"]') || { dataset: {} }).dataset.id, name: (tr.querySelector('.lnk') || {}).textContent, seen: tr.classList.contains('seen') }));`);
  console.log('dòng danh sách:', rows.length, rows.slice(0, 4).map(r => r.id + ':' + r.name).join(' | '));
  async function snap(name, extra) {
    await sleep(450);
    const f = await ev(cdp, COLLECT(`${FR}.contentDocument`, `[${FR}.contentDocument.getElementById('dlg'), ${FR}.contentDocument.getElementById('toast')]`)); addU(f.used);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, 'goc-' + name + '.png'), Buffer.from(shot.data, 'base64'));
    states[name] = Object.assign({
      dlg: await inF(`const g = d.getElementById('dlg'); return g ? { open: g.open, cls: g.className, html: g.outerHTML, rect: (r => [r.left, r.top, r.width, r.height])(g.getBoundingClientRect()), backdrop: (cs => ({ bg: cs.backgroundColor, inset: [cs.top, cs.right, cs.bottom, cs.left].join(' ') }))(getComputedStyle(g, '::backdrop')) } : null;`),
      html: await inF(`return { cls: d.documentElement.className, style: d.documentElement.getAttribute('style'), body: d.body.getAttribute('style') };`),
      iframe: await ev(cdp, `(() => { const f = ${FR}, r = f.getBoundingClientRect(), cs = getComputedStyle(f); return { cls: f.className, style: f.getAttribute('style'), rect: [r.left, r.top, r.width, r.height], z: cs.zIndex }; })()`),
      parent: await ev(cdp, `({ bodyCls: document.body.className, htmlCls: document.documentElement.className, wbar: !!document.querySelector('.v33-wbar'), wbarZ: document.querySelector('.v33-wbar') ? getComputedStyle(document.querySelector('.v33-wbar')).zIndex : null })`),
    }, extra || {});
    console.log('snap', name, '· luật:', f.used.length, '· dlg:', states[name].dlg && states[name].dlg.rect.join(','), '· iframe:', states[name].iframe.rect.join(','), states[name].iframe.style || '');
  }
  // 1. mắt ở dòng 1
  await inF(`d.querySelector('#v-flow table.tb tbody tr:nth-child(1) .acts [data-act="hs-vw"]').click(); return 1;`); await sleep(400);
  await snap('xem-mac-dinh');
  // 2. lần lượt từng văn bản trong danh sách bên trái
  const items = [];
  const n = await inF(`return d.querySelectorAll('#dlg .vw-i').length;`);
  for (let i = 0; i < n; i++) {
    await inF(`d.querySelectorAll('#dlg .vw-i')[${i}].click(); return 1;`); await sleep(260);
    addU((await ev(cdp, COLLECT(`${FR}.contentDocument`, `[${FR}.contentDocument.getElementById('dlg')]`))).used); // CSS của từng loại giấy (dự thảo / tài liệu / đã ban hành)
    items.push(await inF(`const g = d.getElementById('dlg'), it = g.querySelectorAll('.vw-i')[${i}], grpEl = (() => { let e = it.previousElementSibling; while (e && !e.classList.contains('vw-g')) e = e.previousElementSibling; return e; })();
      const pp = g.querySelector('.vw-doc .paper');
      return { id: it.dataset.vw, group: grpEl ? grpEl.textContent : '', title: (g.querySelector('.vw-tb .tt') || {}).textContent, head: (g.querySelector('.mh b') || {}).textContent, sub: (g.querySelector('.mh small') || {}).textContent,
        tags: (it.querySelector('.m') || {}).innerHTML, acts: [...g.querySelectorAll('.vw-tb .btn')].map(b => b.outerHTML), doc: g.querySelector('.vw-doc').innerHTML, zoom: pp ? pp.style.zoom : null, paperH: pp ? pp.scrollHeight : 0 };`));
  }
  console.log('văn bản trong trình xem:', items.length, items.map(x => x.id).join(','));
  // ảnh một tài liệu (giấy dạng tệp) và một văn bản đã ban hành
  const firstOf = g => (items.find(x => x.group === g) || {}).id;
  for (const [nm, g] of [['xem-tai-lieu', 'Tài liệu, chứng cứ'], ['xem-da-ban-hanh', 'Văn bản tố tụng đã ban hành']]) {
    const id = firstOf(g); if (!id) continue;
    await inF(`d.querySelector('#dlg .vw-i[data-vw="${id}"]').click(); return 1;`); await snap(nm, { id });
  }
  await inF(`d.querySelectorAll('#dlg .vw-i')[0].click(); return 1;`); await sleep(300);
  // 3. danh sách hồ sơ báo cáo (nút “Hồ sơ báo cáo (n)”)
  await inF(`d.querySelector('#dlg [data-v19vw="list"]').click(); return 1;`); await snap('xem-danh-sach');
  await inF(`d.querySelector('#dlg [data-v19vw="list"]').click(); return 1;`); await sleep(200);
  // 4. phóng to 2 nấc
  await inF(`d.querySelector('#dlg [data-v19vw="zi"]').click(); d.querySelector('#dlg [data-v19vw="zi"]').click(); return 1;`); await snap('xem-phong-to');
  await inF(`d.querySelector('#dlg [data-v19vw="zo"]').click(); d.querySelector('#dlg [data-v19vw="zo"]').click(); return 1;`); await sleep(200);
  // 5. toàn màn hình
  await inF(`d.querySelector('#dlg [data-v19vw="full"]').click(); return 1;`); await snap('xem-toan-man-hinh');
  await inF(`d.querySelector('#dlg [data-v19vw="full"]').click(); return 1;`); await sleep(200);
  // 6. tìm trong văn bản
  await inF(`d.querySelector('#dlg [data-act="v20find"]').click(); return 1;`); await sleep(200);
  await inF(`const i = d.querySelector('#dlg .v20-fb input'); i.value = 'vụ án'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(500); await snap('xem-tim');
  await inF(`d.querySelector('#dlg .v20-fb [data-f="next"]').click(); return 1;`); await sleep(500); await snap('xem-tim-ket-qua-2');
  await inF(`d.querySelector('#dlg .v20-fb [data-f="list"]').click(); return 1;`); await sleep(300); await snap('xem-tim-danh-sach');
  await inF(`const i = d.querySelector('#dlg .v20-fb input'); i.value = 'zzzz'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(500); await snap('xem-tim-khong-thay');
  await inF(`const i = d.querySelector('#dlg .v20-fb input'); i.value = 'vụ án'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(400);
  await inF(`d.querySelector('#dlg .v20-fb [data-f="list"]').click(); return 1;`); await sleep(200);
  await inF(`d.querySelector('#dlg .v20-fb [data-f="close"]').click(); return 1;`); await sleep(200);
  // 7. văn bản sau (mũi tên phải)
  await inF(`d.querySelector('#dlg .v24-arw.next').click(); return 1;`); await snap('xem-van-ban-sau');
  // 8. Đóng → danh sách có dòng đã xem
  await inF(`d.querySelector('#dlg .vw-tb [data-act="close"]').click(); return 1;`); await sleep(500);
  const shot8 = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, 'goc-sau-khi-xem.png'), Buffer.from(shot8.data, 'base64'));
  states.sauKhiXem = { rows: await inF(`return [...d.querySelectorAll('#v-flow table.tb tbody tr')].map(tr => tr.classList.contains('seen'));`), dlgOpen: await inF(`return d.getElementById('dlg').open;`) };
  // 9. bấm tên văn bản (link) ở dòng 5
  await inF(`d.querySelector('#v-flow table.tb tbody tr:nth-child(5) .lnk[data-act="hs-vw"]').click(); return 1;`); await sleep(400); await snap('xem-tu-link');
  await inF(`d.querySelector('#dlg .mh [data-act="close"]').click(); return 1;`); await sleep(400);
  // 10. bấm nền tối để đóng
  await inF(`d.querySelector('#v-flow table.tb tbody tr:nth-child(2) .acts [data-act="hs-vw"]').click(); return 1;`); await sleep(500);
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 200, y: 500, button: 'left', clickCount: 1 }); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 200, y: 500, button: 'left', clickCount: 1 }); await sleep(400);
  states.nenToiDong = await inF(`return d.getElementById('dlg').open;`);
  // 11. mắt ở dòng không có trong trình xem (tờ trình mẫu thuộc AK)
  const itemIds = new Set(items.map(x => x.id)); const miss = rows.findIndex(r => r.id && !itemIds.has(r.id));
  if (miss >= 0) { await inF(`d.querySelectorAll('#v-flow table.tb tbody tr')[${miss}].querySelector('.acts [data-act="hs-vw"]').click(); return 1;`); await sleep(400); await snap('xem-khong-co-trong-trinh-xem', { row: rows[miss] }); await inF(`d.querySelector('#dlg .mh [data-act="close"]').click(); return 1;`); await sleep(300); }
  // 11b. nút tải xuống ở dòng 1 → thông báo của app Ký số
  await inF(`d.querySelector('#v-flow table.tb tbody tr:nth-child(1) .acts [data-act="dl"]').click(); return 1;`); await sleep(500); await snap('tai-xuong', { toast: await inF(`const t = d.getElementById('toast'); return t ? t.outerHTML : null;`) });
  await sleep(3200);
  // 12. mục lục → bấm số văn bản
  await inF(`d.querySelector('#v-flow [data-act="hs-tab:ml"]').click(); return 1;`); await sleep(500);
  await inF(`d.querySelector('#v-flow table.tb tbody tr:nth-child(1) .lnk[data-act="hs-vw"]').click(); return 1;`); await sleep(400); await snap('xem-tu-muc-luc');
  await inF(`d.querySelector('#dlg .mh [data-act="close"]').click(); return 1;`); await sleep(300);
  await inF(`d.querySelector('#v-flow [data-act="hs-tab:ds"]').click(); return 1;`); await sleep(400);
  // 13. đường dẫn “Vụ án VA26-…” trên tiêu đề
  await inF(`d.querySelector('#v-flow a.v20-case').click(); return 1;`); await sleep(2000);
  const shot13 = await cdp.send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(OUT, 'goc-lien-ket-vu-an.png'), Buffer.from(shot13.data, 'base64'));
  states.lienKetVuAn = await ev(cdp, `(() => { const on = document.querySelector('#content .tabs .tab.on, #content [role=tab][aria-selected=true], .tab-head .on'); return { hash: location.hash, v33: !!document.querySelector('.v33-wbar'), ifon: document.body.classList.contains('v33-ifon'), tabOn: on ? on.textContent.trim().slice(0, 60) : null, title: document.title }; })()`);
  rules.sort((a, b) => a.ord - b.ord);
  fs.writeFileSync(path.join(OUT, 'viewer-rules.json'), JSON.stringify(rules, null, 1));
  fs.writeFileSync(path.join(OUT, 'items.json'), JSON.stringify(items, null, 1));
  fs.writeFileSync(path.join(OUT, 'states.json'), JSON.stringify(states, null, 1));
  console.log('tổng luật:', rules.length, '· đóng bằng nền tối:', !states.nenToiDong, '· sau khi xem:', JSON.stringify(states.sauKhiXem), '· liên kết vụ án:', JSON.stringify(states.lienKetVuAn));
  proc.kill(); process.exit(0);
})();
