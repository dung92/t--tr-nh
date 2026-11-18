import { SEARCH_LABEL, STATUS_LABEL, STATUS_OPTIONS, STATUS_OPTIONS_V22 } from '../data';
import { IconFilter, IconFolder, IconSearch } from '../icons';
import type { AddNewKind } from '../types';
import { AddNewMenu } from './AddNewMenu';

interface Props {
  query: string;
  onQueryChange: (q: string) => void;
  status: string;
  onStatusChange: (s: string) => void;
  advOpen: boolean;
  advCount: number;
  onToggleAdv: () => void;
  onOpenHoSo?: () => void;
  onCreate?: (kind: AddNewKind) => void;
}

/** Thanh công cụ chuẩn (.v23-tb): Tìm nhanh · Trạng thái · Lọc nâng cao | Hồ sơ tài liệu · Thêm mới. */
export function Toolbar(p: Props) {
  return (
    <div className="v23-tb">
      <div className="l">
        <label className="v23-q v23-qh" title={SEARCH_LABEL}>
          <IconSearch />
          <input className="tt-q v23-qin" placeholder={SEARCH_LABEL} aria-label={SEARCH_LABEL} value={p.query} onChange={e => p.onQueryChange(e.target.value)} />
        </label>
        <span className="v23-mainh">
          <span className={'v23-sel' + (p.status ? ' on' : '')}>
            <select className="tt-st" aria-label={STATUS_LABEL} value={p.status} onChange={e => p.onStatusChange(e.target.value)}>
              <option value="">{STATUS_LABEL}: Tất cả</option>
              {STATUS_OPTIONS.map(o => <option key={o}>{o}</option>)}
              {STATUS_OPTIONS_V22.map(o => <option key={o} data-v22="1">{o}</option>)}
            </select>
          </span>
        </span>
        <button type="button" className={'v23-advb' + (p.advCount > 0 ? ' has' : '')} aria-expanded={p.advOpen} onClick={p.onToggleAdv}>
          <IconFilter />Lọc nâng cao<span className="n">{p.advCount}</span>
        </button>
      </div>
      <div className="r">
        <button className="btn" type="button" onClick={p.onOpenHoSo}><IconFolder /> Hồ sơ tài liệu</button>
        <AddNewMenu onCreate={p.onCreate} />
      </div>
    </div>
  );
}
