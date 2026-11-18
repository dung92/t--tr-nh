/* Logic lọc – chép đúng hành vi của prototype:
   - Tìm kiếm + Trạng thái: renderTotrinh() của app Ký số (khớp “số + trích yếu” bỏ dấu; trạng thái đúng nhãn).
   - Lọc nâng cao: v23_07112026.js (autoFieldsT, matchRow, chipsOf) – trường sinh từ cột dữ liệu của bảng. */
import { COLUMNS, SEARCH_LABEL, STATUS_LABEL } from './data';
import type { AdvField, AdvValues, ToTrinhRow } from './types';

/** Bỏ dấu, đ→d, chữ thường, gom khoảng trắng (fold của v23). */
export function fold(s: unknown): string {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Lọc của app Ký số: ô “Số văn bản, trích yếu” và ô “Trạng thái”. */
export function basicFilter(rows: ToTrinhRow[], q: string, status: string): ToTrinhRow[] {
  const fq = fold(q);
  return rows.filter(r => (!fq || fold(`${r.so} ${r.trichYeu}`).includes(fq)) && (!status || r.trangThai === status));
}

/** Chữ hiển thị trong ô (v23 đọc textContent của ô để lọc). */
export function cellText(r: ToTrinhRow, column: string): string {
  switch (column) {
    case 'Số văn bản': return r.so;
    case 'Loại văn bản': return r.loai;
    case 'Trích yếu': return r.trichYeu + (r.nguon ? 'Từ: ' + r.nguon : '');
    case 'Cán bộ tạo': return r.canBoTao;
    case 'Ngày tạo': return r.ngayTao;
    case 'Lãnh đạo xử lý': return r.lanhDaoXuLy;
    case 'Lý do từ chối': return r.lyDoTuChoi || '—';
    case 'Trạng thái': return r.trangThai;
    case 'Thời hạn xử lý': return r.thoiHanXuLy || '—';
    case 'Thời điểm trình': return r.thoiDiemTrinh || '—';
    default: return '';
  }
}

const MAIN_RE = /^(trang thai|tinh trang|phan loai|vai tro|loai|chieu|muc do)/;
const DATE_RE = /^\d{1,2}\/\d{1,2}\/\d{4}/;

/** Sinh trường “Lọc nâng cao” từ cột dữ liệu (autoFieldsT), bỏ cột trùng nghĩa với ô tìm kiếm / trạng thái (adaptBar). */
export function buildAdvFields(rows: ToTrinhRow[]): AdvField[] {
  const fields: AdvField[] = [];
  COLUMNS.forEach(h => {
    if (/^(STT|Thao tác|#|Chọn)$/i.test(h)) return;
    const vals = rows.map(r => cellText(r, h)).filter(v => v && v !== '—');
    const uniq = vals.filter((v, i) => vals.indexOf(v) === i);
    const type: AdvField['type'] =
      vals.length && vals.filter(v => DATE_RE.test(v)).length >= vals.length / 2 ? 'date'
        : uniq.length >= 2 && uniq.length <= 8 && (uniq.length < Math.max(3, vals.length) || MAIN_RE.test(fold(h))) ? 'multi' : 'text';
    fields.push({ key: 'c' + fields.length, label: h, type, options: uniq });
  });
  const labs = [fold(SEARCH_LABEL), fold(STATUS_LABEL)];
  return fields.filter(fd => {
    const fl = fold(fd.label);
    return labs.indexOf(fl) < 0 && !labs.some(l => l && fl.indexOf(l + ' ') === 0) && !/^(so van ban|ten van ban|trich yeu)/.test(fl);
  });
}

const parseDMY = (s: string): Date | null => { const m = String(s || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; };
const parseISO = (s: string): Date | null => { const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const fmtISO = (s: string): string => { const d = parseISO(s); return d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : ''; };
const isEmpty = (v: AdvValues[string]): boolean => v == null || v === '' || (Array.isArray(v) && !v.filter(Boolean).length);

/** Dòng có khớp điều kiện lọc nâng cao không (matchRow). */
export function matchAdv(r: ToTrinhRow, values: AdvValues, fields: AdvField[]): boolean {
  return fields.every(fd => {
    const v = values[fd.key];
    if (isEmpty(v)) return true;
    const cv = cellText(r, fd.label);
    if (fd.type === 'text') return fold(cv).includes(fold(v as string));
    if (fd.type === 'multi') return (v as string[]).indexOf(cv) >= 0;
    const d = parseDMY(cv), [a, b] = (v as string[]).map(x => parseISO(x || ''));
    if (!d) return false;
    return (!a || d >= a) && (!b || d <= b);
  });
}

export interface Chip { key: string; text: string }
/** Chip “Điều kiện: …” (chipsOf). */
export function chipsOf(values: AdvValues, fields: AdvField[]): Chip[] {
  const out: Chip[] = [];
  fields.forEach(fd => {
    const v = values[fd.key];
    if (isEmpty(v)) return;
    let t: string;
    if (fd.type === 'multi') t = (v as string[]).join(', ');
    else if (fd.type === 'date') { const [a, b] = v as string[]; t = (a ? 'từ ' + fmtISO(a) : '') + (a && b ? ' ' : '') + (b ? 'đến ' + fmtISO(b) : ''); }
    else t = v as string;
    if (t) out.push({ key: fd.key, text: fd.label + ': ' + t });
  });
  return out;
}
