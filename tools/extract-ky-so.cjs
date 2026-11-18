/* Trích một màn của app Ký số mở trong cửa sổ V33 (từ tab Tờ trình / Đề xuất / Thẩm định của prototype V41) bằng Chrome DevTools Protocol.
   Chạy: node tools/extract-ky-so.cjs <kịch-bản> <thư-mục-ra>
   Kịch bản: bcview (bấm số văn bản / nút mắt ở bảng) · bcdx (Thêm mới → Báo cáo đề xuất)
   Ghi: frame-rules.json (CSS trong khung, kèm điều kiện lớp/thuộc tính của <html>), parent-rules.json (CSS cửa sổ V33),
        states.json (DOM #v-flow, #dlg, lớp/thuộc tính <html>, tiêu đề cửa sổ của từng trạng thái), data.json (dữ liệu mẫu), <trạng-thái>.png */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const [, , SCEN, OUT] = process.argv;
if (!SCEN || !OUT) { console.error('Cách dùng: node tools/extract-ky-so.cjs <bcview|bcdx> <thư-mục-ra>'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const PROTO = path.resolve(__dirname, '..', '..', 'prototype', 'prototypes', 'ky-so-to-trinh.html');
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 400)); return r.result.value; }
const FR = `(document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe'))`;
/* Luật CSS của tài liệu D khớp cây con của ROOTS hoặc chuỗi phần tử cha. Thử khớp sau khi bỏ pseudo động (giữ selector gốc khi ghi). */
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
  return used;
})()`;

/* ---- kịch bản: [tên trạng thái, thao tác trong khung (JS, biến d = document của khung, w = window)] ---- */
const ROW = n => `d.querySelector('#t-totrinh table.tb tbody tr:nth-child(${n}) .lnk').click();`;
const SCENARIOS = {
  bcview: [
    ['s1-thong-tin', ROW(1)],
    ['s1-tai-lieu', `d.querySelector('#v-flow [data-act="v28vt:docs"]').click();`],
    ['s1-tep', `d.querySelector('#v-flow [data-act="v18svdoc"]').click();`],
    ['s1-tep-quay-lai', `d.querySelector('#v-flow [data-act="v18svback"]').click();`],
    ['s1-lich-su', `d.querySelector('#v-flow [data-act="v28vt:hist"]').click();`],
    ['s1-ban-1', `d.querySelector('#v-flow table.v18-ver [data-act="v18sv"][data-v="1"]').click();`],
    ['s1-ban-2', `d.querySelector('#v-flow table.v18-ver [data-act="v18sv"][data-v="2"]').click();`],
    ['s1-thong-tin-2', `d.querySelector('#v-flow [data-act="v28vt:info"]').click();`],
    ['s1-thu-gon', `d.querySelector('#v-flow .sp-l section.card .col').click();`],
    ['s1-mo-lai', `d.querySelector('#v-flow .sp-l section.card .col').click();`],
    ['s1-phong-to', `d.querySelector('#v-flow .pv [data-act="zin"]').click(); d.querySelector('#v-flow .pv [data-act="zin"]').click();`],
    ['s1-thu-nho', `d.querySelector('#v-flow .pv [data-act="zout"]').click(); d.querySelector('#v-flow .pv [data-act="zout"]').click(); d.querySelector('#v-flow .pv [data-act="zout"]').click();`],
    ['s1-vua-khung', `d.querySelector('#v-flow .pv [data-act="zfit"]').click();`],
    ['s1-tim', `d.querySelector('#v-flow .pv [data-act="v20find"]').click(); const i = d.querySelector('#v-flow .v20-fb input'); i.value = 'vật chứng'; i.dispatchEvent(new Event('input', { bubbles: true }));`],
    ['s1-tim-dong', `d.querySelector('#v-flow .v20-fb [data-f="close"]').click();`],
    ['s1-tai-ve', `d.querySelector('#v-flow .pv [data-act="dl"]').click();`],
    ['s1-ho-so-vu-an', `d.querySelector('#v-flow [data-act="v28tab"]').click();`],
    ['s1-ho-so-xem', `d.querySelector('#v-flow .v28-hsp [data-act="v18view"]').click();`],
    ['s1-ho-so-quay-lai', `d.querySelector('#v-flow [data-act="v28hvx"]').click();`],
    ['s1-ho-so-dien-tu', `d.querySelector('#v-flow [data-act="v28hoso"]').click();`],
    ['s1-ve-bao-cao', `d.querySelector('#v-flow [data-act="v28ret"]').click();`],
    ['s1-quay-lai', `d.querySelector('#v-flow .v35-tb button').click();`],
    ['s2-thong-tin', `d.querySelector('#t-totrinh table.tb tbody tr:nth-child(2) .acts .icb').click();`],
    ['s2-lap-lai', `d.querySelector('#v-flow [data-act="v18lapseed"]').click();`],
  ],
  bcdx: [
    ['bcdx-thong-tin', `d.querySelector('#t-totrinh .dd > .btn').click(); d.querySelector('#t-totrinh .dd-menu [data-act="newbc:bc"]').click();`],
    ['bcdx-van-ban', `d.querySelector('#v-flow [data-act="bcxtab:drafts"]').click();`],
    ['bcdx-chon-van-ban', `d.querySelector('#v-flow [data-act="pickvb"]').click();`],
    ['bcdx-chon-2', `d.querySelectorAll('#dlg [data-act="pkrow"]')[0].click(); d.querySelectorAll('#dlg [data-act="pkrow"]')[1].click();`],
    ['bcdx-chon-xong', `d.querySelector('#dlg [data-act="pkok"]').click();`],
    ['bcdx-tai-lieu', `d.querySelector('#v-flow [data-act="bcxtab:docs"]').click();`],
    ['bcdx-bc2', `d.querySelector('#v-flow [data-act="bcxtab:bc2"]').click();`],
    ['bcdx-ho-so', `d.querySelector('#v-flow [data-act="v28tab"]').click();`],
    ['bcdx-ho-so-xem', `d.querySelector('#v-flow .v28-hsp [data-act="v18view"]').click();`],
    ['bcdx-thong-tin-2', `d.querySelector('#v-flow [data-act="bcxtab:info"]').click();`],
    ['bcdx-xem-truoc', `d.querySelector('#v-flow [data-act="bcxpv"]').click();`],
    ['bcdx-tien-trinh', `d.querySelector('#v-flow .lst [data-act="bcxtl"]').click();`],
    ['bcdx-tien-trinh-dong', `d.querySelector('#v-flow .lst [data-act="bcxtl"]').click();`],
    ['bcdx-thu-gon', `d.querySelector('#v-flow [data-act="bcxfold:1"]').click();`],
    ['bcdx-mo-gon', `d.querySelector('#v-flow [data-act="bcxfold:0"]').click();`],
    ['bcdx-mo-rong', `d.querySelector('#v-flow .v35-tb [data-v35="pv"]').click();`],
    ['bcdx-mo-rong-2', `d.querySelector('#v-flow .v35-tb [data-v35="pv"]').click();`],
    ['bcdx-thieu', `const i = d.querySelector('#v-flow [data-k="trichYeu"]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); d.querySelector('#v-flow .v35-tb [data-v35="2"]').click();`],
    ['bcdx-du', `const i = d.querySelector('#v-flow [data-k="trichYeu"]'); i.value = 'Đề xuất phê duyệt văn bản tố tụng trong vụ án VA26-000001'; i.dispatchEvent(new Event('input', { bubbles: true }));`],
    ['bcdx-luu-ky-so', `d.querySelector('#v-flow .v35-tb [data-v35="2"]').click();`],
    ['bcdx-luu-ky-so-dong', `const c = d.querySelector('#dlg [data-act="close"]'); if (c) c.click();`],
    ['bcdx-luu-nhap', `d.querySelector('#v-flow .v35-tb [data-v35="1"]').click();`],
  ],
};
(async () => {
  const steps = SCENARIOS[SCEN]; if (!steps) throw new Error('Không có kịch bản ' + SCEN);
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'exk-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: fileUrl(PROTO) }); await l;
  for (let i = 0; i < 100; i++) { if (await ev(cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.querySelector('#t-totrinh .v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  const inF = js => ev(cdp, `(() => { const d = ${FR}.contentDocument, w = ${FR}.contentWindow; ${js} })()`);
  await ev(cdp, `(() => { [...document.querySelectorAll('body > *')].forEach(e => { if (/ý kiến chỉ đạo cần xác nhận/i.test(e.textContent || '') && getComputedStyle(e).position === 'fixed') e.style.setProperty('display', 'none', 'important'); }); [...document.querySelectorAll('body > *')].forEach(e => { const cs = getComputedStyle(e); if (cs.position === 'fixed' && /rgba\\(.*0\\.\\d+\\)/.test(cs.backgroundColor) && e.getBoundingClientRect().width >= innerWidth - 2 && !e.className.toString().includes('v33')) e.style.setProperty('display', 'none', 'important'); }); })()`);
  const frameU = new Map(), parentU = new Map(), states = {};
  const addU = (map, used) => used.forEach(u => { const o = map.get(u.ord); if (!o) map.set(u.ord, Object.assign({}, u)); else if (u.sel) o.sel = [...new Set(o.sel.concat(u.sel))]; });
  for (const [name, js] of steps) {
    try { await inF(js + ' return 1;'); } catch (e) { console.log('!! ' + name + ': ' + e.message.slice(0, 160)); continue; }
    await sleep(1500);
    await inF(`w.scrollTo(0, 0); return 1;`);
    // chỉ lấy CSS khi màn đang nằm trong cửa sổ V33 (trạng thái đã quay về danh sách thuộc tab Tờ trình – đã chuyển riêng)
    if (await inF(`return d.documentElement.classList.contains('v33-full');`)) {
      addU(frameU, await ev(cdp, COLLECT(`${FR}.contentDocument`, `[${FR}.contentDocument.getElementById('v-flow'), ${FR}.contentDocument.getElementById('dlg'), ${FR}.contentDocument.getElementById('toast')]`)));
      addU(parentU, await ev(cdp, COLLECT('document', `[...document.querySelectorAll('.v33-wbar, .v33-wback, .v33-ifmini, .v33-ifph'), ${FR}]`)));
    }
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(shot.data, 'base64'));
    states[name] = await inF(`const h = d.documentElement, g = d.getElementById('dlg'), t = d.getElementById('toast');
      return { route: w.eval('S.route'), params: JSON.parse(JSON.stringify(w.eval('S.params') || {})), htmlCls: h.className, htmlAttrs: [...h.attributes].filter(a => a.name !== 'class' && a.name !== 'style').map(a => [a.name, a.value]), htmlStyle: h.getAttribute('style'), bodyCls: d.body.className,
        flow: (d.getElementById('v-flow') || {}).outerHTML || '', dlg: g && g.open ? g.outerHTML : null, toast: t && t.classList.contains('on') ? t.outerHTML : null };`);
    states[name].win = await ev(cdp, `({ on: document.body.classList.contains('v33-ifon'), title: (document.querySelector('.v33-wbar .ti') || {}).textContent || null })`);
    console.log(name.padEnd(20), '· route', states[name].route, JSON.stringify(states[name].params), '· html', states[name].htmlCls, '· cửa sổ', states[name].win.on ? JSON.stringify(states[name].win.title) : '—', states[name].dlg ? '· có hộp thoại' : '', states[name].toast ? '· thông báo' : '');
  }
  // dữ liệu mẫu cho bản React
  const data = await inF(`const j = x => { try { return JSON.parse(JSON.stringify(w.eval(x))); } catch (e) { return { __err: String(e) }; } };
    return { SEED_DET: j('window.V18_SEED'), SEED_TT: j('SEED_TT'), CASE: j('CASE'), U: j('U'), GROUPS: j('Object.fromEntries(Object.entries(GROUPS).map(([k, g]) => [k, { name: g.name }]))'), LOAI: j('window.V18_LOAI'),
      TLM: j('TLM'), UNIT_PC: j('UNIT_PC'), UNIT_CQ: j('UNIT_CQ'),
      DRAFTS: j('Object.fromEntries(Object.entries(DRAFTS).map(([k, x]) => [k, { name: x.name, mau: x.mau, signer: x.signer, ngay: x.ngay, g: x.g, hauto: x.hauto }]))'),
      FORM_BC: j('(() => { const f = newForm(null, [], "bc"); return f; })()'), FORM_TT: j('(() => { const f = newForm(null, [], "tt"); return f; })()') };`);
  fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(data, null, 1));
  const sortU = m => [...m.values()].sort((a, b) => a.ord - b.ord);
  fs.writeFileSync(path.join(OUT, 'frame-rules.json'), JSON.stringify(sortU(frameU), null, 1));
  fs.writeFileSync(path.join(OUT, 'parent-rules.json'), JSON.stringify(sortU(parentU), null, 1));
  fs.writeFileSync(path.join(OUT, 'states.json'), JSON.stringify(states, null, 1));
  console.log('luật khung:', frameU.size, '· luật trang cha:', parentU.size);
  proc.kill(); process.exit(0);
})();
