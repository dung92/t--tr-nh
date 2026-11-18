/* Trích tab “Tờ trình / Đề xuất / Thẩm định” từ prototype V41 (prototype/prototypes/ky-so-to-trinh.html) bằng Chrome DevTools Protocol.
   Chạy: node tools/extract-to-trinh.cjs <thư-mục-ra>  → used-rules.json, states.json, meta.json, goc-<trạng-thái>.png (ảnh gốc 1320px)
   Sau đó: node tools/extract-to-trinh-extra.cjs <thư-mục-ra> (CSS trạng thái phụ + icon) và node tools/gen-to-trinh-css.cjs <thư-mục-ra>. */
// Trích tab "Tờ trình / Đề xuất / Thẩm định" (app Ký số trong Chi tiết vụ án) từ prototype đã render:
// DOM từng trạng thái, CSS đang dùng (đúng thứ tự cascade, đã quy về gốc .kyso-tt), chuỗi phần tử cha, ảnh vùng tab.
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const PROTO = 'E:/code/prototype/prototypes', CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 400)); return r.result.value; }
const FR = `(document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe'))`;
// thu thập luật CSS khớp với cây con của pane (bỏ pseudo động / pseudo-element khi thử khớp)
const COLLECT = `(() => {
  const f = ${FR}, d = f.contentDocument, pane = d.getElementById('t-totrinh');
  const DYN = /::?(hover|focus-visible|focus-within|focus|active|visited|link|placeholder-shown|placeholder|before|after|selection|marker|-webkit-[\\w-]+|-moz-[\\w-]+|checked|disabled|enabled|invalid|valid|required|optional|read-only|read-write|indeterminate|default|empty|target)(\\([^)]*\\))?/g;
  const splitSel = s => { const out = []; let depth = 0, cur = ''; for (const ch of s) { if (ch === '(' || ch === '[') depth++; if (ch === ')' || ch === ']') depth--; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } if (cur.trim()) out.push(cur.trim()); return out; };
  const hits = el => { try { return el && (pane.matches(el) || !!pane.querySelector(el) || [...pane.querySelectorAll('*')].length === 0); } catch (e) { return false; } };
  const rootLevel = sel => /^(:root|html|body)\\b/.test(sel);
  const used = []; const seen = new Set(); let seq = 0;
  const visit = (rules, wrap) => { for (const r of rules) { const ord = seq++;
    if (r.type === 1) { // style rule
      const parts = splitSel(r.selectorText); const keep = [];
      for (const p of parts) { const base = p.replace(DYN, '').replace(/:not\\(\\s*\\)/g, '').replace(/\\s+(?=[>+~]|$)/g, '').trim() || '*';
        let ok = false;
        if (rootLevel(base)) { const m = base.match(/^(?:(:root|html|body)[^\\s>+~]*)(?:\\s*[>+~]?\\s*)([\\s\\S]*)$/); const rest = m ? m[2].trim() : ''; try { ok = (!rest ? d.documentElement.matches(base.split(/[\\s>+~]/)[0].replace(/^body/, 'body')) || base.startsWith('body') : !!pane.querySelector(base) || pane.matches(base)); } catch (e) { ok = false; } }
        else { try { ok = pane.matches(base) || !!pane.querySelector(base); } catch (e) { ok = false; } }
        if (ok) keep.push(p); }
      if (keep.length) { const t = keep.join(', ') + ' { ' + r.style.cssText + ' }'; const k = (wrap || '') + t; if (!seen.has(k)) { seen.add(k); used.push({ wrap, sel: keep, css: r.style.cssText, ord }); } }
    } else if (r.type === 4) visit(r.cssRules, '@media ' + r.conditionText);
    else if (r.type === 12) visit(r.cssRules, '@supports ' + r.conditionText);
  } };
  const sheets = [...d.styleSheets].map((s, i) => ({ i, owner: s.ownerNode ? (s.ownerNode.id || s.ownerNode.getAttribute('data-src') || s.ownerNode.tagName + '#' + i) : '?', n: (() => { try { return s.cssRules.length; } catch (e) { return -1; } })() }));
  for (const s of d.styleSheets) { let rs; try { rs = s.cssRules; } catch (e) { continue; } visit(rs, ''); }
  const vars = getComputedStyle(d.documentElement); const varNames = new Set(); used.forEach(u => (u.css.match(/var\\(--[\\w-]+/g) || []).forEach(v => varNames.add(v.slice(4))));
  const varVals = {}; varNames.forEach(n => varVals[n] = vars.getPropertyValue(n).trim());
  const chain = []; for (let e = pane; e && e !== d.documentElement; e = e.parentElement) chain.unshift({ tag: e.tagName.toLowerCase(), id: e.id, cls: e.className && e.className.baseVal === undefined ? e.className : '' });
  const hcs = getComputedStyle(d.body);
  return { used, sheets, varVals, chain, htmlClass: d.documentElement.className, htmlAttrs: [...d.documentElement.attributes].map(a => a.name + '=' + a.value), body: { font: hcs.font, color: hcs.color, bg: hcs.backgroundColor } };
})()`;
const PANE = `(() => { const d = ${FR}.contentDocument; return d.getElementById('t-totrinh').outerHTML; })()`;
const RECT = `(() => { const f = ${FR}; const r = f.getBoundingClientRect(); const d = f.contentDocument, p = d.getElementById('t-totrinh').getBoundingClientRect(); return { x: r.left + p.left, y: r.top + p.top, w: p.width, h: p.height, fw: r.width }; })()`;
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'ext-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1800, deviceScaleFactor: 1, mobile: false });
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: fileUrl(path.join(PROTO, 'ky-so-to-trinh.html')) }); await l;
  for (let i = 0; i < 80; i++) { if (await ev(cdp, 'window.__PROTO && __PROTO.done').catch(() => false) === true) break; await sleep(300); }
  for (let i = 0; i < 60; i++) { if (await ev(cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.getElementById('t-totrinh') && ${FR}.contentDocument.querySelector('.v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2000);
  // ẩn popup “ý kiến chỉ đạo cần xác nhận” + mask của nó để chụp vùng tab
  await ev(cdp, `(() => { const f = ${FR}; [...document.querySelectorAll('body *')].forEach(e => { if (e.contains(f)) return; const cs = getComputedStyle(e); if ((cs.position === 'fixed') && !e.closest('#nav')) e.style.setProperty('display', 'none', 'important'); }); })()`);;
  const states = {}, union = [];
  async function snap(name) {
    const scrolled = await ev(cdp, `(() => { const f = ${FR}, d = f.contentDocument, w = f.contentWindow, out = []; if (w.scrollX || w.scrollY) out.push('window ' + w.scrollX + ',' + w.scrollY); [d.documentElement, d.body, ...d.querySelectorAll('*')].forEach(e => { if (e.scrollLeft) { out.push((e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0]) + ' scrollLeft=' + e.scrollLeft); e.scrollLeft = 0; } }); w.scrollTo(0, 0); return out; })()`); if (scrolled.length) console.log('   [' + name + '] đã đưa về 0:', scrolled.join('; '));
    const c = await ev(cdp, COLLECT); c.used.forEach(u => { const k = (u.wrap || '') + u.sel.join(',') + u.css; if (!union.find(x => x.k === k)) union.push({ k, ...u }); });
    const r = await ev(cdp, RECT);
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: Math.min(r.h + 220, 1600), scale: 1 }, captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, 'goc-' + name + '.png'), Buffer.from(shot.data, 'base64'));
    states[name] = { html: await ev(cdp, PANE), rect: r };
    if (name === 'mac-dinh') { fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({ sheets: c.sheets, varVals: c.varVals, chain: c.chain, htmlClass: c.htmlClass, htmlAttrs: c.htmlAttrs, body: c.body }, null, 1)); }
    console.log('snap', name, '· luật dùng:', c.used.length, '· vùng', JSON.stringify(r));
  }
  const inF = js => ev(cdp, `(() => { const d = ${FR}.contentDocument, w = ${FR}.contentWindow; ${js} })()`);
  await snap('mac-dinh');
  await inF(`d.querySelector('#t-totrinh .dd > .btn').click(); return 1;`); await sleep(500); await snap('menu-them-moi');
  await inF(`d.body.click(); d.querySelectorAll('.dd.open').forEach(x => x.classList.remove('open')); return 1;`); await sleep(300);
  await inF(`d.querySelector('#t-totrinh [data-v23="adv"]').click(); return 1;`); await sleep(600); await snap('loc-nang-cao');
  await inF(`const b = d.querySelector('#t-totrinh .v23-ms button'); if (b) b.click(); return 1;`); await sleep(600); await snap('loc-nang-cao-chon-loai');
  await inF(`const x = d.querySelector('#t-totrinh [data-v23="clr"]'); if (x) x.click(); const c = d.querySelector('#t-totrinh [data-v23="advx"]'); if (c) c.click(); return 1;`); await sleep(500);
  await inF(`const q = d.getElementById('ttQ'); q.value = '1185'; q.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(800); await snap('tim-1185');
  await inF(`const q = d.getElementById('ttQ'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(600);
  await inF(`const s = d.getElementById('ttSt'); s.value = 'Từ chối'; s.dispatchEvent(new Event('change', { bubbles: true })); return 1;`); await sleep(800); await snap('trang-thai-tu-choi');
  await inF(`const s = d.getElementById('ttSt'); s.value = ''; s.dispatchEvent(new Event('change', { bubbles: true })); return 1;`); await sleep(600);
  await inF(`const q = d.getElementById('ttQ'); q.value = 'zzzz'; q.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(800); await snap('rong-tim-kiem');
  await inF(`const q = d.getElementById('ttQ'); q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(600);
  await inF(`d.querySelector('#t-totrinh [data-v23="adv"]').click(); const i = d.querySelector('#t-totrinh .v23-adv input[data-k="c3"]'); i.value = 'xyz'; i.dispatchEvent(new Event('input', { bubbles: true })); return 1;`); await sleep(900); await snap('rong-loc-nang-cao');
  await inF(`const x = d.querySelector('#t-totrinh [data-v23="clr"]'); if (x) x.click(); const c = d.querySelector('#t-totrinh [data-v23="advx"]'); if (c) c.click(); return 1;`); await sleep(500);
  for (const m of ['xa', 'nb', 'pc']) { await inF(`d.querySelector('#t-totrinh [data-act="v18cap:${m}"]').click(); return 1;`); await sleep(900); await snap('che-do-' + m); }
  fs.writeFileSync(path.join(OUT, 'states.json'), JSON.stringify(states, null, 1));
  union.sort((a, b) => a.ord - b.ord); fs.writeFileSync(path.join(OUT, 'used-rules.json'), JSON.stringify(union, null, 1));
  console.log('tổng luật (hợp các trạng thái):', union.length);
  proc.kill(); process.exit(0);
})();
