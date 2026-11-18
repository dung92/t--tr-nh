// Lấy thêm CSS của các trạng thái không có trong dữ liệu mẫu (tr.mine, .dl/.c-or, .icb.red, .note), icon flag/pen/trash/alert,
// và font thực tế đang dùng để vẽ chữ trong khung app Ký số.
const fs = require('fs'), path = require('path'), os = require('os'), { spawn } = require('child_process');
const OUT = process.argv[2], PROTO = 'E:/code/prototype/prototypes', CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const fileUrl = p => 'file:///' + p.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/').replace(/^([A-Za-z])%3A/, '$1:');
function connect(url) { return new Promise((res, rej) => { const ws = new WebSocket(url); let id = 0; const pend = new Map(), hs = {}; const api = { send(m, p) { return new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method: m, params: p || {} })); }); }, on(m, h) { (hs[m] = hs[m] || []).push(h); }, once(m, ms) { return new Promise((ok, no) => { const t = setTimeout(() => no(new Error('timeout ' + m)), ms); const h = p => { clearTimeout(t); hs[m] = hs[m].filter(x => x !== h); ok(p); }; api.on(m, h); }); } }; ws.onopen = () => res(api); ws.onerror = rej; ws.onmessage = ev => { const m = JSON.parse(ev.data); if (m.id) { const p = pend.get(m.id); if (p) { pend.delete(m.id); m.error ? p.no(new Error(m.error.message)) : p.ok(m.result); } } else if (m.method) (hs[m.method] || []).slice().forEach(h => h(m.params)); }; }); }
async function ev(cdp, e) { const r = await cdp.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(JSON.stringify((r.exceptionDetails.exception || {}).description || r.exceptionDetails.text).slice(0, 400)); return r.result.value; }
const FR = `(document.querySelector('#content .tab-body[data-tab="gy-bcdx"] .s7-kyso > iframe'))`;
const EXTRA = `(() => {
  const d = ${FR}.contentDocument, w = ${FR}.contentWindow, out = []; let seq = 0;
  const RE = /(tr\\.mine|\\.mine\\b|\\.dl\\b|\\.c-or\\b|\\.icb\\.red|\\.note\\b)/;
  const visit = (rules, wrap) => { for (const r of rules) { const ord = seq++;
    if (r.type === 1) { if (RE.test(r.selectorText)) out.push({ wrap, sel: r.selectorText.split(/,(?![^(]*\\))/).map(x => x.trim()), css: r.style.cssText, ord }); }
    else if (r.type === 4) visit(r.cssRules, '@media ' + r.conditionText); else if (r.type === 12) visit(r.cssRules, '@supports ' + r.conditionText); } };
  for (const sh of d.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } visit(rs, ''); }
  const icons = {}; ['flag', 'pen', 'trash', 'alert', 'eye', 'folder', 'plus', 'down'].forEach(n => { try { icons[n] = w.eval('ic(' + JSON.stringify(n) + ')'); } catch (e) { icons[n] = 'ERR ' + e.message; } });
  const fonts = { inter400: d.fonts.check('14px Inter'), inter600: d.fonts.check('600 14px Inter'), status: d.fonts.status, faces: [...d.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status).slice(0, 12) };
  return { out, icons, fonts };
})()`;
(async () => {
  const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'exx-'));
  const proc = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions', '--remote-debugging-port=0', '--user-data-dir=' + prof, '--window-size=1600,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise(ok => { let b = ''; proc.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); }); });
  const port = new URL(wsUrl).port; const page = (await (await fetch('http://127.0.0.1:' + port + '/json/list')).json()).find(t => t.type === 'page');
  const cdp = await connect(page.webSocketDebuggerUrl); await cdp.send('Page.enable'); await cdp.send('DOM.enable'); await cdp.send('CSS.enable');
  const l = cdp.once('Page.loadEventFired', 60000); await cdp.send('Page.navigate', { url: fileUrl(path.join(PROTO, 'ky-so-to-trinh.html')) }); await l;
  for (let i = 0; i < 80; i++) { if (await ev(cdp, 'window.__PROTO && __PROTO.done').catch(() => false) === true) break; await sleep(300); }
  for (let i = 0; i < 60; i++) { if (await ev(cdp, `!!(${FR} && ${FR}.contentDocument && ${FR}.contentDocument.querySelector('.v23-tb'))`).catch(() => false) === true) break; await sleep(300); }
  await sleep(2500);
  const ex = await ev(cdp, EXTRA);
  // font thật sự dùng để vẽ (CSS.getPlatformFontsForNode) cho ô tiêu đề bảng và một ô dữ liệu trong khung
  try {
    const tree = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
    const find = (n, pred) => { if (pred(n)) return n; for (const c of (n.children || []).concat(n.contentDocument ? [n.contentDocument] : [])) { const r = find(c, pred); if (r) return r; } return null; };
    const th = find(tree.root, n => n.nodeName === 'TH' && (n.children || []).some(c => c.nodeValue === 'Trích yếu'));
    const lnk = find(tree.root, n => n.nodeName === 'BUTTON' && (n.attributes || []).includes('lnk'));
    for (const [k, n] of [['th', th], ['lnk', lnk]]) if (n) ex.fonts['platform_' + k] = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId: n.nodeId })).fonts;
  } catch (e) { ex.fonts.platformErr = String(e.message); }
  fs.writeFileSync(path.join(OUT, 'extra-rules.json'), JSON.stringify(ex, null, 1));
  console.log('luật bổ sung:', ex.out.length, '· icon:', Object.entries(ex.icons).map(([k, v]) => k + (String(v).startsWith('<svg') ? '✓' : '✗')).join(' '));
  console.log('font:', JSON.stringify(ex.fonts));
  proc.kill(); process.exit(0);
})();
