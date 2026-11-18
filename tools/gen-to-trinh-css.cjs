/* Sinh src/features/to-trinh/to-trinh.css từ CSS đã trích của tab "Tờ trình / Đề xuất / Thẩm định" trong prototype V41.
   Chạy: node tools/gen-to-trinh-css.cjs <thư-mục-trích-xuất>   (thư mục do tools/extract-to-trinh.cjs tạo: used-rules.json, extra-rules.json)
   - Giữ nguyên khai báo của từng luật, sắp theo đúng thứ tự trong stylesheet gốc (cascade).
   - Selector cấp :root / html / body của khung app Ký số → .kyso-tt (phần tử gốc của component); các selector khác → ".kyso-tt …".
   - #v-detail / #t-totrinh → .v-detail / .t-totrinh (component không dùng id).
   - @media (max-width) trong khung iframe tính theo bề rộng khung → đổi thành @container trên .kyso-tt để giữ đúng ngữ cảnh.
   - Bỏ: html.emb {…} (chỉ để co khung iframe theo nội dung), body.dragging (kéo thanh chia đôi – không có ở màn này). */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = process.argv[2]; if (!DIR) { console.error('Cách dùng: node tools/gen-to-trinh-css.cjs <thư-mục-trích-xuất>'); process.exit(2); }
const used = JSON.parse(fs.readFileSync(path.join(DIR, 'used-rules.json'), 'utf8'));
const extra = JSON.parse(fs.readFileSync(path.join(DIR, 'extra-rules.json'), 'utf8')).out.filter(r => !/\.v20-/.test(r.sel.join(',')));
const all = []; const seen = new Set();
used.concat(extra).sort((a, b) => a.ord - b.ord).forEach(r => { const k = r.ord + '|' + r.sel.join(','); if (!seen.has(k)) { seen.add(k); all.push(r); } });

function scope(sel) {
  let s = sel.trim().replace(/#v-detail\b/g, '.v-detail').replace(/#t-totrinh\b/g, '.t-totrinh').replace(/#ttQ\b/g, '.tt-q').replace(/#ttSt\b/g, '.tt-st');
  if (/^body\.dragging\b/.test(s)) return null;
  const m = s.match(/^(:root|html|body)([^\s>+~]*)\s*(.*)$/);
  if (m) { const rest = m[3].trim(); return rest ? '.kyso-tt ' + rest : '.kyso-tt'; }
  if (s === '*') return '.kyso-tt, .kyso-tt *';
  return '.kyso-tt ' + s;
}
const decls = css => css.split(/;\s*(?![^(]*\))/).map(x => x.trim()).filter(Boolean).map(x => '  ' + x + ';').join('\n');
let out = '/* SINH TỰ ĐỘNG bởi tools/gen-to-trinh-css.cjs từ CSS đang áp dụng cho tab “Tờ trình / Đề xuất / Thẩm định” trong prototype V41\n' +
  '   (app Ký số S7_KYSO_B64 + CSS lớp v23_07112026 mà V41 chèn vào khung). Không sửa tay – sửa nguồn rồi sinh lại.\n' +
  '   ' + all.length + ' luật, đúng thứ tự cascade gốc. Mọi selector nằm dưới .kyso-tt nên không ảnh hưởng phần khác của ứng dụng. */\n\n' +
  '.kyso-tt {\n  container-type: inline-size; /* @container dưới đây thay cho @media trong khung iframe */\n}\n\n';
let dropped = 0, n = 0;
all.forEach(r => {
  if (r.sel.length === 1 && /^html\.emb$/.test(r.sel[0].trim())) { dropped++; return; }
  const sels = [...new Set(r.sel.map(scope).filter(Boolean).flatMap(x => x.split(', ')))];
  if (!sels.length) { dropped++; return; }
  const body = sels.join(',\n') + ' {\n' + decls(r.css) + '\n}\n';
  if (r.wrap) { const w = r.wrap.replace(/^@media\s+/, '@container '); out += w + ' {\n' + body.replace(/^/gm, '  ') + '}\n\n'; }
  else out += body + '\n';
  n++;
});
const dest = path.resolve(__dirname, '..', 'src', 'features', 'to-trinh', 'to-trinh.css');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log('Đã ghi ' + n + ' luật (bỏ ' + dropped + ') → ' + path.relative(process.cwd(), dest));
