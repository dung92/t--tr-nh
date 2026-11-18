import { COLUMNS, EMPTY_FILTER_TEXT, EMPTY_TEXT } from '../data';
import { IconEye, IconFlag, IconPen, IconTrash } from '../icons';
import type { ToTrinhRow } from '../types';

export interface RowActions {
  onOpenRow?: (row: ToTrinhRow) => void;
  onShowProgress?: (row: ToTrinhRow) => void;
  onEditRow?: (row: ToTrinhRow) => void;
  onDeleteRow?: (row: ToTrinhRow) => void;
}

interface Props extends RowActions {
  /** Dòng sau ô Tìm kiếm / Trạng thái (đánh số STT theo danh sách này, như app gốc) */
  rows: ToTrinhRow[];
  /** id các dòng khớp Lọc nâng cao – dòng không khớp bị ẩn nhưng giữ nguyên số STT */
  visible: Set<string>;
  /** Đang có điều kiện lọc nâng cao */
  filtering: boolean;
}

/** Bảng văn bản (.tw > table.tb). */
export function DocumentTable({ rows, visible, filtering, onOpenRow, onShowProgress, onEditRow, onDeleteRow }: Props) {
  // Dòng không khớp Lọc nâng cao vẫn render nhưng ẩn (tr.v23-hide) như v23 – giữ STT và viền dòng y hệt bản gốc
  // (luật “tbody tr:last-child td { border-bottom: 0 }” vẫn áp vào dòng cuối dù dòng đó đang ẩn).
  const shownCount = rows.filter(r => visible.has(r.id)).length;
  return (
    <div className="tw">
      <table className="tb">
        <thead>
          <tr>
            {COLUMNS.map(c => <th key={c} style={c === 'STT' ? { width: 56 } : c === 'Thao tác' ? { width: 112 } : undefined}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {!rows.length && <tr><td colSpan={COLUMNS.length} className="empty">{EMPTY_TEXT}</td></tr>}
          {rows.map((r, i) => (
            <tr key={r.id} className={[r.mine ? 'mine' : '', visible.has(r.id) ? '' : 'v23-hide'].filter(Boolean).join(' ')}>
              <td>{i + 1}</td>
              <td className="nw"><button className="lnk" type="button" onClick={() => onOpenRow?.(r)}>{r.so}</button></td>
              <td><span className="bd sm n">{r.loai}</span></td>
              <td style={{ minWidth: 220 }}>
                <span className="clamp">{r.trichYeu}</span>
                {r.nguon && <span className="sub">Từ: {r.nguon}</span>}
              </td>
              <td className="nw">{r.canBoTao}</td>
              <td className="nw">{r.ngayTao}</td>
              <td className="nw">{r.lanhDaoXuLy}</td>
              <td style={{ minWidth: 140 }}>{r.lyDoTuChoi ? <span style={{ color: 'var(--red)' }}>{r.lyDoTuChoi}</span> : '—'}</td>
              <td><span className={'bd ' + r.trangThaiTone}>{r.trangThai}</span></td>
              <td className="nw">{r.thoiHanXuLy ? <span className="dl c-or">{r.thoiHanXuLy}</span> : '—'}</td>
              <td className="nw">{r.thoiDiemTrinh || '—'}</td>
              <td>
                <div className="acts">
                  <button className="icb" type="button" title="Xem" aria-label={'Xem ' + r.so} onClick={() => onOpenRow?.(r)}><IconEye /></button>
                  {r.canTrackProgress && <button className="icb" type="button" title="Tiến trình xử lý" onClick={() => onShowProgress?.(r)}><IconFlag /></button>}
                  {r.canEdit && <button className="icb" type="button" title="Sửa" onClick={() => onEditRow?.(r)}><IconPen /></button>}
                  {r.canDelete && <button className="icb red" type="button" title="Xóa" onClick={() => onDeleteRow?.(r)}><IconTrash /></button>}
                </div>
              </td>
            </tr>
          ))}
          {filtering && rows.length > 0 && !shownCount && <tr className="v23-empty"><td colSpan={COLUMNS.length}>{EMPTY_FILTER_TEXT}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
