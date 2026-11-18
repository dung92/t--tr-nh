import { UNIT } from '../data';
import { IconFilter, IconX } from '../icons';
import type { AdvField, AdvValues } from '../types';

interface Props {
  open: boolean;
  fields: AdvField[];
  values: AdvValues;
  shown: number;
  total: number;
  onChange: (key: string, value: string | string[] | undefined) => void;
  onClear: () => void;
  onClose: () => void;
}

/** Bảng “Lọc nâng cao” (.v23-adv) – trường sinh từ cột dữ liệu, kết quả cập nhật ngay khi chọn. */
export function AdvancedFilter({ open, fields, values, shown, total, onChange, onClear, onClose }: Props) {
  const toggle = (fd: AdvField, o: string) => {
    const cur = (values[fd.key] as string[] | undefined) ?? [];
    onChange(fd.key, cur.includes(o) ? cur.filter(x => x !== o) : [...cur, o]);
  };
  const setDate = (fd: AdvField, i: 0 | 1, v: string) => {
    const cur = ((values[fd.key] as string[] | undefined) ?? ['', '']).slice();
    cur[i] = v;
    onChange(fd.key, cur);
  };

  return (
    <div className={'v23-adv' + (open ? ' on' : '')} onKeyDown={e => { if (e.key === 'Escape') onClose(); }}>
      <div className="v23-adv-h">
        <b><IconFilter />Lọc nâng cao</b>
        <span className="m">{fields.length} trường lọc theo dữ liệu bảng · kết quả cập nhật ngay khi chọn</span>
        <button type="button" className="x" title="Đóng" aria-label="Đóng lọc nâng cao" onClick={onClose}><IconX /></button>
      </div>
      <div className="v23-adv-b">
        <div className="v23-fg">
          {fields.map(fd => {
            if (fd.type === 'multi') {
              const v = (values[fd.key] as string[] | undefined) ?? [];
              return (
                <div className="v23-fd w2" key={fd.key}>
                  <span>{fd.label}</span>
                  <div className="v23-ms" role="group" aria-label={fd.label}>
                    {fd.options.map(o => (
                      <button type="button" key={o} aria-pressed={v.includes(o)} onClick={() => toggle(fd, o)}>{o}</button>
                    ))}
                  </div>
                </div>
              );
            }
            if (fd.type === 'date') {
              const v = (values[fd.key] as string[] | undefined) ?? ['', ''];
              return (
                <div className="v23-fd w2" key={fd.key}>
                  <span>{fd.label}</span>
                  <div className="v23-dr">
                    <input type="date" value={v[0] || ''} aria-label={fd.label + ' từ ngày'} onChange={e => setDate(fd, 0, e.target.value)} />
                    <i>–</i>
                    <input type="date" value={v[1] || ''} aria-label={fd.label + ' đến ngày'} onChange={e => setDate(fd, 1, e.target.value)} />
                  </div>
                </div>
              );
            }
            return (
              <label className="v23-fd" key={fd.key}>
                <span>{fd.label}</span>
                <input type="text" value={(values[fd.key] as string | undefined) ?? ''} placeholder={'Nhập ' + fd.label.toLowerCase()}
                  onChange={e => onChange(fd.key, e.target.value)} />
              </label>
            );
          })}
        </div>
      </div>
      <div className="v23-adv-f">
        <span className="pv">Kết quả: <b>{shown}</b>/{total} {UNIT}</span>
        <span className="sp" />
        <button type="button" className="v23-btn ghost" onClick={onClear}>Xóa điều kiện</button>
        <button type="button" className="v23-btn pri" onClick={onClose}>Áp dụng</button>
      </div>
    </div>
  );
}
