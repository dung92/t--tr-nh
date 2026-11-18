import { Fragment, useState, type ReactNode } from 'react';
import { HS_TREE, SAMPLE_CASE, SAMPLE_DOCS } from '../ho-so/data';
import type { HoSoDoc, HoSoTreeNode } from '../ho-so/types';
import { IconCheck, IconChevronRight, IconChevsDown, IconChevsUp, IconClipboard, IconExpandBox, IconEye, IconFile, IconFolder, IconSearch } from '../ky-so/icons';
import { fold } from '../to-trinh/filter';

/* Tab “Hồ sơ vụ án” trong màn chi tiết / màn lập báo cáo (V28 hsPanel + hsTreeBody của V18/V20):
   cây thư mục hồ sơ, tìm tên/số văn bản, thu gọn / mở tất cả thư mục, nhãn đã xem; bấm văn bản để xem ở khung bên phải.
   Ở màn lập báo cáo: ô đầu dòng để kèm / bỏ kèm văn bản vào báo cáo (V20). */

export interface HoSoTreeIndex { name: Record<string, string>; parent: Record<string, string>; path: (f: string) => string; inF: (d: HoSoDoc, f: string) => boolean }
export function treeIndex(tree: HoSoTreeNode[] = HS_TREE): HoSoTreeIndex {
  const name: Record<string, string> = {}, parent: Record<string, string> = {};
  tree.forEach(r => { name[r.id] = r.ten; (r.kids || []).forEach(k => { name[k.id] = k.ten; parent[k.id] = r.id; }); });
  return { name, parent, path: f => (parent[f] ? name[parent[f]] + ' › ' : '') + name[f], inF: (d, f) => f === 'all' || d.folder === f || parent[d.folder] === f };
}
const IDX = treeIndex();

/** Nhóm kèm theo trong báo cáo (V20_LB) */
export type AttachKind = '' | 'drafts' | 'docs' | 'att';
export const ATTACH_LABEL: Record<Exclude<AttachKind, ''>, string> = { drafts: 'Dự thảo trình ký', docs: 'Tài liệu, chứng cứ', att: 'Văn bản tố tụng' };
/** Kèm văn bản vào báo cáo đang lập (v20In / v20Can / v20Toggle) */
export interface AttachApi {
  kindOf: (id: string) => AttachKind;
  can: (id: string) => { ok: boolean; why?: string };
  toggle: (id: string) => void;
}

/** Đánh dấu chuỗi tìm (mq18) */
function mark(t: string, q: string): ReactNode {
  if (!q) return t;
  const i = fold(t).indexOf(q);
  if (i < 0) return t;
  return <>{t.slice(0, i)}<mark className="v18-q">{t.slice(i, i + q.length)}</mark>{t.slice(i + q.length)}</>;
}

interface Props {
  docs?: HoSoDoc[];
  /** Văn bản đang xem ở khung phải */
  current: string | null;
  viewed: ReadonlySet<string>;
  onView: (id: string) => void;
  /** Nút mở rộng → trang Bộ hồ sơ vụ án */
  onOpenHoSo: () => void;
  /** Màn lập báo cáo: kèm / bỏ kèm (bỏ trống = chỉ xem, ô chọn kèm bị CSS gốc ẩn đi) */
  attach?: AttachApi;
}

export function HoSoTreePanel({ docs = SAMPLE_DOCS, current, viewed, onView, onOpenHoSo, attach }: Props) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const fq = fold(q.trim());
  const setAll = (v: boolean) => setOpen(Object.fromEntries(Object.keys(IDX.name).map(k => [k, v])));

  const fileRow = (d: HoSoDoc, lv: number, path: boolean) => {
    const seen = viewed.has(d.id), k = attach?.kindOf(d.id) || '', c = attach ? attach.can(d.id) : { ok: true }, dis = !k && !c.ok;
    return (
      <div key={d.id} className={'v18-hf v20-hf' + (current === d.id ? ' on' : '') + (k ? ' att' : '') + (seen ? ' v28-seen' : '')}
        style={{ '--pl': 12 + lv * 16 + 'px' } as React.CSSProperties}
        data-act="v18view" data-id={d.id} title={d.name} role="button" tabIndex={0}
        onClick={() => onView(d.id)} onKeyDown={e => { if (e.key === 'Enter') onView(d.id); }}>
        <button type="button" className={'v20-ck' + (k ? ' on' : '')} data-act="v20att" role="checkbox" aria-checked={!!k} aria-disabled={dis}
          tabIndex={attach ? 0 : -1} title={k ? 'Bỏ khỏi báo cáo' : dis ? c.why : 'Chọn kèm vào báo cáo'} aria-label={(k ? 'Bỏ kèm ' : 'Chọn kèm ') + d.name}
          onClick={e => { e.stopPropagation(); attach?.toggle(d.id); }}><IconCheck /></button>
        <IconFile />
        <span className="t">{mark(d.name, fq)}<small>{[d.so && d.so !== '—' ? d.so : '', d.ngay].filter(Boolean).join(' · ')}</small>
          {path && <span className="v18-path"><IconFolder />{IDX.path(d.folder)}</span>}
          {k && <span className={'v20-tg ' + k}><IconClipboard />{'Đã kèm · ' + ATTACH_LABEL[k]}</span>}</span>
        <span className="v28-sb">{seen ? <><IconCheck />Đã xem</> : <><IconEye />Chưa xem</>}</span>
      </div>
    );
  };
  const node = (n: HoSoTreeNode, lv: number): ReactNode => {
    const isOpen = open[n.id] !== false, inFolder = docs.filter(d => d.folder === n.id), count = docs.filter(d => IDX.inF(d, n.id)).length;
    const a = attach ? docs.filter(d => IDX.inF(d, n.id) && attach.kindOf(d.id)).length : 0;
    return (
      <div key={n.id} className={'v18-hn' + (isOpen ? ' open' : '')}>
        <div className="v18-hh" style={{ paddingLeft: 6 + lv * 16 }} data-act="v18hn" data-id={n.id} role="button" tabIndex={0} aria-expanded={isOpen}
          onClick={() => setOpen(o => ({ ...o, [n.id]: !isOpen }))} onKeyDown={e => { if (e.key === 'Enter') setOpen(o => ({ ...o, [n.id]: !isOpen })); }}>
          <IconChevronRight /><IconFolder /><span className="t">{n.ten}</span>
          {a > 0 && <span className="v20-fa" title={a + ' văn bản trong thư mục đã kèm báo cáo'}><IconCheck />{a}</span>}
          <span className="c">{count}</span>
        </div>
        {isOpen && <div className="v18-hb">{(n.kids || []).map(k => node(k, lv + 1))}{inFolder.map(d => fileRow(d, lv + 1, false))}</div>}
      </div>
    );
  };
  let body: ReactNode;
  if (fq) {
    const hit = docs.filter(d => fold(`${d.name} ${d.so || ''} ${d.file || ''}`).includes(fq));
    body = hit.length
      ? <><div className="muted" style={{ fontSize: 12, padding: '2px 8px 6px' }}>{hit.length + ' kết quả'}</div>{hit.map(d => fileRow(d, 0, true))}</>
      : <div className="v18-empty">Không tìm thấy văn bản phù hợp</div>;
  } else body = HS_TREE.map(r => <Fragment key={r.id}>{node(r, 0)}</Fragment>);

  return (
    <div className="v28-hsw">
      <div className="v28-hsh">
        <IconFolder />
        <div className="t"><b>{'Hồ sơ vụ án ' + SAMPLE_CASE.ma}</b><span>{docs.length + ' văn bản trong hồ sơ'}</span></div>
        <button type="button" className="icb" data-act="v28hoso" aria-label="Mở trang Bộ hồ sơ vụ án" data-tip="Mở trang Bộ hồ sơ vụ án" onClick={onOpenHoSo}><IconExpandBox /></button>
      </div>
      <div className="v28-hsq">
        <label className="v21-in"><IconSearch /><input className="v18hq" type="search" placeholder="Tìm tên, số văn bản trong hồ sơ" value={q} autoComplete="off" aria-label="Tìm trong hồ sơ vụ án" onChange={e => setQ(e.target.value)} /></label>
        <button type="button" className="icb" data-act="bcxfold:1" title="Thu gọn tất cả thư mục" onClick={() => setAll(false)}><IconChevsUp /></button>
        <button type="button" className="icb" data-act="bcxfold:0" title="Mở tất cả thư mục" onClick={() => setAll(true)}><IconChevsDown /></button>
      </div>
      <div className="v18-tr v28-tr v18tree">{body}</div>
    </div>
  );
}
