/* Sinh src/features/ky-so/ky-so.css – CSS dùng chung cho mọi màn của app Ký số chạy trong cửa sổ toàn màn hình V33
   (Bộ hồ sơ vụ án, trình xem văn bản, Chi tiết báo cáo đề xuất / tờ trình, form lập báo cáo…).
   Chạy: node tools/gen-ky-so-css.cjs <thư-mục-trích> [<thư-mục-trích> …]
   Mỗi thư mục có frame-rules.json (hoặc viewer-rules.json) và có thể có parent-rules.json – kết quả của tools/extract-*.cjs.
   Vì cùng một bảng CSS của app Ký số nên các luật được gộp theo vị trí trong tài liệu gốc (ord) → giữ đúng thứ tự cascade.

   Đổi selector trong khung (gốc React .kyso-hs đóng vai <html>/<body> của iframe):
   - html/:root/body: lớp luôn có trong cửa sổ V33 (emb, v33-full) và :root bỏ đi; lớp theo màn (v18-fit, v28-view, v38-tdfit…)
     giữ thành điều kiện ở gốc (.kyso-hs.v18-fit) – màn React đặt đúng các lớp này như <html> của bản gốc;
     luật chỉ áp khi KHÔNG ở cửa sổ (:not(.emb), :not(.v33-full)) và luật html.v19-ifs bị bỏ (xem chú thích VIEWER_UA).
   - #v-flow → .v-flow, #dlg → dialog.modal, #hsq/#hsst → .hs-q/.hs-st, các #id khác → .id; dialog::backdrop → .vw-backdrop.
   - Đơn vị vh (chiều cao iframe) → var(--vpH); @media (bề rộng iframe) → @container (đặt ở .app).
   Cửa sổ V33 ở trang cha (parent-rules.json, chỉ luật .v33-*): → ".kyso-win …", font Inter → bộ TTF nhúng của V41. */
'use strict';
const fs = require('fs'), path = require('path');
const DIRS = process.argv.slice(2);
if (!DIRS.length) { console.error('Cách dùng: node tools/gen-ky-so-css.cjs <thư-mục-trích> [...]'); process.exit(2); }
const readJ = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const merge = (lists) => {
  const by = new Map();
  for (const r of lists.flat()) {
    const o = by.get(r.ord);
    if (!o) { by.set(r.ord, Object.assign({}, r)); continue; }
    // cùng vị trí phải là cùng một luật – khác nghĩa là các lần trích đánh số không khớp (trích lại bằng cùng phiên bản công cụ)
    if ((o.css || o.keyframes) !== (r.css || r.keyframes) || (o.wrap || '') !== (r.wrap || ''))
      throw new Error('Luật #' + r.ord + ' khác nhau giữa các lần trích: ' + (o.sel || []).join(',') + ' / ' + (r.sel || []).join(','));
    if (r.sel) o.sel = [...new Set(o.sel.concat(r.sel))];
  }
  return [...by.values()];
};
const frame = merge(DIRS.map(d => {
  const f = ['frame-rules.json', 'viewer-rules.json'].map(n => path.join(d, n)).filter(p => fs.existsSync(p));
  return f.flatMap(readJ);
}));
const parent = merge(DIRS.map(d => path.join(d, 'parent-rules.json')).filter(p => fs.existsSync(p)).map(readJ))
  .filter(r => r.sel && r.sel.some(s => /\.v33-/.test(s)));

const decls = css => css.split(/;\s*(?![^(]*\))/).map(x => x.trim()).filter(Boolean).map(x => '  ' + x + ';').join('\n');
const fixVh = css => css.replace(/var\(--vpH,\s*100vh\)/g, '\u0000').replace(/(\d*\.?\d+)vh\b/g, (_m, n) => +n === 100 ? 'var(--vpH)' : 'calc(var(--vpH) * ' + (+n / 100) + ')').replace(/\u0000/g, 'var(--vpH,100vh)');
const ALWAYS = /\.(emb|v33-full)(?![\w-])|:root/g;
const NEVER = /:not\(\s*\.(emb|v33-full)\s*\)|\.v19-ifs(?![\w-])/;

function scopeFrame(sel) {
  let s = sel.trim().replace(/#v-flow\b/g, '.v-flow').replace(/#hsq\b/g, '.hs-q').replace(/#hsst\b/g, '.hs-st').replace(/#dlg\b/g, 'dialog.modal')
    .replace(/#([A-Za-z][\w-]*)/g, '.$1');
  if (/::backdrop$/.test(s)) return '.kyso-hs .vw-backdrop';
  // tách phần gốc: html… body… ở đầu selector
  const m = s.match(/^((?:html|:root|body)[^\s>+~]*)((?:\s*[>]?\s*body[^\s>+~]*)?)\s*(.*)$/);
  if (m) {
    const q = (m[1] + (m[2] || '')).replace(/^(html|:root|body)/, '').replace(/\s*>?\s*body/, '');
    if (NEVER.test(q)) return null;
    const cond = q.replace(ALWAYS, '');
    let rest = m[3].trim().replace(/^>\s*/, '> ');
    return '.kyso-hs' + cond + (rest ? ' ' + rest : '');
  }
  if (NEVER.test(s)) return null;
  if (s === '*') return '.kyso-hs, .kyso-hs *';
  return '.kyso-hs ' + s;
}
function scopeParent(sel) {
  let s = sel.trim().replace(/^body\.v33-ifon\s+/, '').replace(/\.s7-kyso\s*>\s*iframe\.v33-iff/g, '.v33-iff').replace(/iframe\.v33-iff/g, '.v33-iff');
  if (/^(\.s7-kyso|iframe)\b/.test(s)) return null;
  return '.kyso-win ' + s;
}
function emit(rules, scope, label, vh, font) {
  let out = '/* ===== ' + label + ' ===== */\n\n', n = 0;
  rules.forEach(r => {
    if (r.note) out += '/* ' + r.note + ' */\n';
    if (r.raw) { out += r.raw + '\n\n'; n++; return; }
    if (r.keyframes) { out += r.keyframes + '\n\n'; n++; return; }
    const sels = [...new Set(r.sel.map(scope).filter(Boolean).flatMap(x => x.split(', ')))];
    if (!sels.length) return;
    let css = vh ? fixVh(r.css) : r.css;
    if (font) css = font(css);
    const body = sels.join(',\n') + ' {\n' + decls(css) + '\n}\n';
    // @media của iframe → @container kyso-vp (container có tên ở .app = bề rộng khung); @container gốc của app Ký số giữ nguyên
    const wrap = r.wrap && r.wrap.replace(/^@media\s+(?:screen\s+and\s+)?/, '@container kyso-vp ');
    out += wrap ? wrap + ' {\n' + body.replace(/^/gm, '  ') + '}\n\n' : body + '\n';
    n++;
  });
  return { out, n };
}
const extra = (list, base) => list.map(([s, c, note], i) => ({ sel: [s], css: c, note, ord: base + i }));
// Thẻ thu gọn (ACT.fold → .closed) và dòng đã xem (tr.seen) – nguyên văn CSS app Ký số, phòng khi trạng thái chưa có trong ảnh chụp
const CLOSED = extra([['.card.closed .cb', 'display: none'], ['.card.closed .ch', 'border-bottom: 0'], ['.card.closed .col svg', 'transform: rotate(180deg)'], ['.tb tr.seen td', 'background: var(--pri-light)']], 1e9);
// Trình xem: showModal() trong iframe đặt hộp thoại ở “top layer” → bản React dựng hộp thoại thường trong .v33-iff
// (khối chứa của position:fixed, xem luật .v33-iff bên dưới) nên cần phần UA của dialog:modal và thứ tự lớp.
const VIEWER_UA = extra([
  ['.vw-backdrop', 'position: fixed; inset: 0; z-index: 100', 'Thay cho dialog::backdrop (UA: position fixed, phủ khung)'],
  ['dialog.modal', 'position: fixed; inset-block: 0; overflow: auto; z-index: 101; max-width: calc(100% - 6px - 2em); max-height: calc(100% - 6px - 2em)', 'UA dialog:modal (position, inset-block, overflow, max-width/height); z-index thay cho top layer'],
  ['dialog.modal:focus', 'outline: none', 'Hộp thoại nhận focus để bắt phím (Esc, ←, →, Ctrl+F)'],
  ['dialog.modal', 'transform: translateZ(0)', 'Như bản gốc: khi mở hộp thoại, V19 cho <body> của iframe translateZ(0) → hộp thoại nằm trên lớp tổng hợp riêng (chữ khử răng cưa xám, vùng cuộn vẫn LCD). Không dùng will-change: tắt LCD cả vùng cuộn'],
], -10);
// Vạch ngắt trang khi tìm (văn bản mẫu chỉ 1 trang nên không có trong ảnh chụp) – nguyên văn VER20 §7; bản in của V19
const VIEWER_EXTRA = extra([
  ['.v20-pb', 'position: absolute; left: -1px; right: -1px; height: 0; border-top: 2px dashed #C9D3DD; pointer-events: none; z-index: 1', 'Vạch ngắt trang (VER20 §7) – nguyên văn'],
  ['.v20-pb span', 'position: absolute; right: 8px; top: -10px; background: #fff; border: 1px solid var(--bd); border-radius: 10px; padding: 0 8px; font: 600 11px/18px Inter, Arial, sans-serif; color: var(--tx2)'],
], 2e9).concat([{ ord: 2e9 + 10, note: 'In văn bản (V19) – nguyên văn, đổi selector theo phạm vi .kyso-hs', raw:
  '@media print {\n  html.v19-pr body * { visibility: hidden !important; }\n' +
  '  html.v19-pr .kyso-hs dialog.vwr .vw-doc .paper,\n  html.v19-pr .kyso-hs dialog.vwr .vw-doc .paper * { visibility: visible !important; }\n' +
  '  html.v19-pr .kyso-hs dialog.vwr .vw-doc .paper { position: fixed; left: 0; top: 0; zoom: 1 !important; }\n}' }]);
const a = emit(VIEWER_UA.concat(frame, CLOSED, VIEWER_EXTRA).sort((x, y) => x.ord - y.ord), scopeFrame, 'Trong khung app Ký số (.kyso-hs = <html>/<body> của iframe)', true);
// Chữ của cửa sổ V33 thuộc trang V41 (không thuộc iframe): bộ Inter TTF nhúng của V41, khác Inter của Google Fonts ở dấu tiếng Việt chồng
const FONTS = { ord: -1, note: 'Bộ Inter TTF nhúng của trang V41 (styles/global.css) – chỉ dùng cho cửa sổ V33', raw:
  [400, 500, 600, 700].map(w => `@font-face { font-family: 'Inter V41'; src: url(./fonts/inter-${w}.ttf) format('truetype'); font-weight: ${w}; }`).join('\n') };
// Khung nội dung thay cho iframe = “viewport” của iframe: khối chứa cho position:fixed bên trong (hộp thoại, thông báo, thanh nút cuối)
const IFF = [{ sel: ['.v33-iff'], css: 'contain: layout', note: 'Khung nội dung = “viewport” của iframe: khối chứa cho position:fixed bên trong', ord: 1e9 }];
const b = emit([FONTS].concat(parent, IFF).sort((x, y) => x.ord - y.ord), s => s === '.v33-iff' ? '.kyso-win .v33-iff' : scopeParent(s), 'Cửa sổ toàn màn hình V33 (trang cha)', false,
  css => css.replace(/\bInter\b/g, "'Inter V41'"));
const head = '/* SINH TỰ ĐỘNG bởi tools/gen-ky-so-css.cjs từ CSS đang áp dụng cho các màn app Ký số trong cửa sổ V33 của prototype V41\n' +
  '   (app Ký số S7_KYSO_B64 + CSS cửa sổ v33_09112026). Không sửa tay – sửa nguồn rồi sinh lại. ' + (a.n + b.n) + ' luật, đúng thứ tự cascade gốc.\n' +
  '   Nguồn: ' + DIRS.map(d => path.basename(d)).join(', ') + ' */\n\n' +
  '/* @container kyso-vp dưới đây thay cho @media trong khung iframe (đặt tên vì app Ký số có container riêng, VD .bct).\n' +
  '   Đặt ở .app (không đặt ở .kyso-hs): container kéo theo layout containment, nếu đặt ở .kyso-hs – khối cuộn – thì hộp thoại /\n' +
  '   thông báo position:fixed (lớp .kyso-hs-layer) sẽ trôi theo trang khi cuộn. */\n' +
  '.kyso-hs .app {\n  container: kyso-vp / inline-size;\n}\n\n';
const dest = path.resolve(__dirname, '..', 'src', 'features', 'ky-so', 'ky-so.css');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, head + a.out + b.out);
console.log('Đã ghi ' + a.n + ' luật khung + ' + b.n + ' luật cửa sổ → ' + path.relative(process.cwd(), dest));
