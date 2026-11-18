/* Sinh src/features/bao-cao/data.ts – dữ liệu mẫu của màn Chi tiết báo cáo đề xuất / tờ trình (bản ghi s1, s2 ở tab Tờ trình):
   SEED_DET (window.V18_SEED), SEED_TT, người dùng U, đơn vị UNIT_PC, loại văn bản LOAI, tệp TLM (+ dung lượng SIZE), tên nhóm GROUPS.
   Chạy: node tools/gen-bao-cao-data.cjs <thư-mục-trích bcview> (data.json của tools/extract-ky-so.cjs bcview) */
'use strict';
const fs = require('fs'), path = require('path');
const DIR = process.argv[2], FDIR = process.argv[3]; if (!DIR) { console.error('Cách dùng: node tools/gen-bao-cao-data.cjs <thư-mục-trích bcview> [<thư-mục-trích bcdx>]'); process.exit(2); }
const d = JSON.parse(fs.readFileSync(path.join(DIR, 'data.json'), 'utf8'));
// Dữ liệu form lập báo cáo (DRAFTS, newForm mặc định) – data.json của kịch bản bcdx, hoặc form.json lấy nhanh
const fd = FDIR ? JSON.parse(fs.readFileSync(path.join(FDIR, fs.existsSync(path.join(FDIR, 'form.json')) ? 'form.json' : 'data.json'), 'utf8')) : null;
for (const k of ['SEED_DET', 'SEED_TT', 'U', 'LOAI', 'TLM', 'UNIT_PC', 'GROUPS']) if (!d[k] || d[k].__err) throw new Error('Thiếu ' + k + ': ' + JSON.stringify(d[k]));
// Dung lượng tệp: hằng SIZE trong khối V18 của app Ký số (không lộ ra window) – chép nguyên văn
const SIZE = { t1: '1,2 MB', t2: '860 KB', t3: '18,4 MB', t4: '214 KB' };
const files = Object.fromEntries(Object.entries(d.TLM).map(([k, v]) => [k, Object.assign({}, v, { size: SIZE[k] || '—' })]));
const groups = Object.fromEntries(Object.entries(d.GROUPS).map(([k, v]) => [k, v.name]));
const ts = (name, type, val, doc) => (doc ? '/** ' + doc + ' */\n' : '') + 'export const ' + name + ': ' + type + ' = ' + JSON.stringify(val, null, 2).replace(/^(\s*)"([A-Za-z_]\w*)":/gm, '$1$2:') + ';\n\n';
const out = '/* SINH TỰ ĐỘNG bởi tools/gen-bao-cao-data.cjs từ prototype V41 (app Ký số: V18_SEED, SEED_TT, U, UNIT_PC, V18_LOAI, TLM, GROUPS).\n   Không sửa tay. */\n' +
  "import type { BcForm, DraftInfo, FileInfo, LoaiInfo, SeedDetail, SeedRow, UserInfo } from './types';\n\n" +
  ts('SEED_DET', 'Record<string, SeedDetail>', d.SEED_DET, 'Chi tiết 2 bản ghi minh họa ở tab Tờ trình / Đề xuất / Thẩm định (s1 BCĐX hoàn thành, s2 tờ trình bị từ chối)') +
  ts('SEED_TT', 'SeedRow[]', d.SEED_TT, 'Dòng tương ứng ở danh sách (nhãn trạng thái trên tiêu đề màn chi tiết)') +
  ts('USERS', 'Record<string, UserInfo>', d.U, 'Cán bộ trong luồng (U)') +
  ts('UNIT_PC', '[string, string]', d.UNIT_PC, 'Đơn vị lập báo cáo (đầu tờ giấy)') +
  ts('LOAI', 'Record<string, LoaiInfo>', d.LOAI, 'Loại văn bản') +
  ts('FILES', 'Record<string, FileInfo>', files, 'Tài liệu, chứng cứ (TLM) kèm dung lượng') +
  ts('GROUPS', 'Record<string, string>', groups, 'Tên nhóm biểu mẫu (“Lập từ: …”)') +
  (fd ? ts('DRAFTS', 'Record<string, DraftInfo>', fd.DRAFTS, 'Văn bản tố tụng dự thảo của vụ án (DRAFTS) – chọn kèm báo cáo') +
    ts('FORM_DEFAULTS', 'Record<string, BcForm>', { bc: fd.FORM_BC, tt: fd.FORM_TT }, 'Giá trị mặc định khi thêm mới (newForm theo loại văn bản)') : '');
const dest = path.resolve(__dirname, '..', 'src', 'features', 'bao-cao', 'data.ts');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out);
console.log('Đã ghi ' + path.relative(process.cwd(), dest) + ' · bản ghi: ' + Object.keys(d.SEED_DET).join(', '));
