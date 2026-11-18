/* Sinh src/features/ho-so/viewer-data.ts – danh sách văn bản của trình xem hồ sơ (hoSoItems({all:true}) của app Ký số)
   kèm nội dung tờ giấy mẫu (draftDoc / fileDoc / issuedDoc), từ items.json của tools/extract-ho-so-viewer.cjs.
   Chạy: node tools/gen-ho-so-viewer-data.cjs <thư-mục-trích-trình-xem> */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = process.argv[2]; if (!DIR) { console.error('Cách dùng: node tools/gen-ho-so-viewer-data.cjs <thư-mục-trích-trình-xem>'); process.exit(2); }
const items = JSON.parse(fs.readFileSync(path.join(DIR, 'items.json'), 'utf8'));
const un = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const one = (html, re, what, id) => { const m = html.match(re); if (!m) throw new Error('Không đọc được ' + what + ' của ' + id); return un(m[1]); };
const LINES = '<div class="lnl"></div><div class="lnl"></div><div class="lnl"></div><div class="lnl s"></div><div class="lnl"></div><div class="lnl"></div><div class="lnl s"></div>';

function paper(it) {
  const h = it.doc.replace(/^<div class="paper bm" style="zoom: [\d.]+;">/, '<div class="paper bm">'), id = it.id;
  if (!h.includes(LINES)) throw new Error('Thiếu dòng kẻ mẫu ở ' + id);
  if (h.includes('class="fileb"')) {
    return { kind: 'file', ext: one(h, /<div class="ext">([^<]*)<\/div>/, 'đuôi tệp', id), tenTep: one(h, /<div class="ext">[^<]*<\/div><b>([^<]*)<\/b>/, 'tên tệp', id), trichYeu: one(h, /<\/b><span>([^<]*)<\/span><\/div>/, 'trích yếu', id) };
  }
  const head = {
    mau: one(h, /<div class="mau">([^<]*)<\/div>/, 'mẫu', id),
    donVi: [one(h, /<div class="l"><div>([^<]*)<\/div>/, 'đơn vị', id), one(h, /<div class="l"><div>[^<]*<\/div><b class="u">([^<]*)<\/b>/, 'đơn vị', id)],
    so: one(h, /<div class="so">([^<]*)<\/div>/, 'số', id),
    ngay: one(h, /<i>([^<]*)<\/i>/, 'ngày', id),
    tieuDe: one(h, /<h2>([^<]*)<\/h2>/, 'tiêu đề', id),
    phu: one(h, /<div class="vv">([^<]*)<\/div>/, 'dòng phụ', id),
  };
  if (h.includes('class="sig"')) {
    if (!h.includes('<span class="muted">')) throw new Error('Ký nháy dạng khác ở ' + id);
    return Object.assign({ kind: 'draft' }, head, {
      chucVu: one(h, /<div class="sg"><div class="r">([^<]*)<\/div>/, 'chức vụ', id),
      viTriKy: one(h, /<div class="sbox">([^<]*)<\/div>/, 'vị trí ký', id),
      nguoiKy: one(h, /<div class="n">([^<]*)<\/div>/, 'người ký', id),
      kyNhay: one(h, /<span class="muted">([^<]*)<\/span>/, 'ký nháy', id),
    });
  }
  return Object.assign({ kind: 'issued' }, head, { dau: one(h, /<span class="stamp-ok">([^<]*)<\/span>/, 'dấu', id) });
}
const out = items.map(it => ({ id: it.id, group: it.group, title: it.title, paper: paper(it) }));
const ts = '/* SINH TỰ ĐỘNG bởi tools/gen-ho-so-viewer-data.cjs từ prototype V41 (trình xem hồ sơ mở từ Bộ hồ sơ vụ án,\n' +
  '   hoSoItems({all:true}) + draftDoc / fileDoc / issuedDoc của app Ký số). Không sửa tay. */\n' +
  "import type { HoSoViewerItem } from './types';\n\n" +
  '/** ' + out.length + ' văn bản theo thứ tự nhóm của trình xem: dự thảo → tài liệu, chứng cứ → đã ban hành. */\n' +
  'export const SAMPLE_VIEWER_ITEMS: HoSoViewerItem[] = ' + JSON.stringify(out, null, 2).replace(/^(\s*)"(\w+)":/gm, '$1$2:') + ';\n';
const dest = path.resolve(__dirname, '..', 'src', 'features', 'ho-so', 'viewer-data.ts');
fs.writeFileSync(dest, ts);
console.log('Đã ghi ' + out.length + ' văn bản → ' + path.relative(process.cwd(), dest) + ' (' + ['draft', 'file', 'issued'].map(k => k + ' ' + out.filter(x => x.paper.kind === k).length).join(', ') + ')');
