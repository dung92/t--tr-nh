import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fold } from '../to-trinh/filter';
import { HS_TREE, SAMPLE_CASE, SAMPLE_DOCS } from './data';
import { HoSoViewer } from './HoSoViewer';
import { KysoLayerContext } from '../ky-so';
import { DOC_FIND_0 } from '../ky-so/useDocFind';
import { IconArrowLeft, IconBook, IconChevronLeft, IconChevronUp, IconCopy, IconDownload, IconEye, IconFolder, IconLink } from './icons';
import type { DocFindState, HoSoCase, HoSoDoc, HoSoTab, HoSoTreeNode, HoSoViewerItem } from './types';
import { SAMPLE_VIEWER_ITEMS } from './viewer-data';

export interface BoHoSoVuAnProps {
  caseInfo?: HoSoCase;
  tree?: HoSoTreeNode[];
  docs?: HoSoDoc[];
  /** Văn bản trong trình xem “Xem hồ sơ báo cáo” (mặc định: 24 văn bản mẫu của prototype) */
  viewerItems?: HoSoViewerItem[];
  /** Người đang đăng nhập – dòng phụ của trình xem */
  loginLabel?: string;
  /** Nút “Đóng” và “Quay lại” – về danh sách Tờ trình / Đề xuất / Thẩm định */
  onClose?: () => void;
  onBack?: () => void;
  /** Link “Vụ án VA26-…” (mở Thông tin vụ án) */
  onOpenCase?: () => void;
  /** Báo khi mở xem văn bản (tên / số văn bản hoặc nút mắt) – trình xem vẫn mở như bản gốc */
  onViewDocument?: (doc: HoSoDoc) => void;
  /** Báo khi bấm tải xuống – màn vẫn hiện thông báo “Tải xuống tệp (mô phỏng)” như bản gốc */
  onDownloadDocument?: (doc: HoSoDoc) => void;
  /** Văn bản đã xem – truyền vào để dùng chung với các màn khác trong cửa sổ (bỏ trống: màn tự giữ) */
  viewed?: ReadonlySet<string>;
  onMarkViewed?: (id: string) => void;
  /** Mở từ “Hồ sơ điện tử” của một báo cáo (V28): nút Đóng thành “← Quay lại <backLabel>” */
  backLabel?: string;
}

const FIND0: DocFindState = DOC_FIND_0;

/** Tên thư mục kèm thư mục cha (hsPath). */
function useTreeIndex(tree: HoSoTreeNode[]) {
  return useMemo(() => {
    const name: Record<string, string> = {}, parent: Record<string, string> = {};
    tree.forEach(r => { name[r.id] = r.ten; (r.kids || []).forEach(k => { name[k.id] = k.ten; parent[k.id] = r.id; }); });
    const path = (f: string) => (parent[f] ? name[parent[f]] + ' › ' : '') + name[f];
    const inF = (d: HoSoDoc, f: string) => f === 'all' || d.folder === f || parent[d.folder] === f;
    return { path, inF };
  }, [tree]);
}

/**
 * Màn “Bộ hồ sơ vụ án” – mở từ nút “Hồ sơ tài liệu” của tab Tờ trình / Đề xuất / Thẩm định.
 * Nguồn: PAGES.hoso của app Ký số (cây hồ sơ HS_TREE, lọc theo thư mục / tên-số / trạng thái, Mục lục văn bản).
 */
export function BoHoSoVuAn({
  caseInfo = SAMPLE_CASE, tree = HS_TREE, docs = SAMPLE_DOCS, viewerItems = SAMPLE_VIEWER_ITEMS, loginLabel = 'Trần Thanh Tâm – Cán bộ lập BCĐX',
  onClose, onBack, onOpenCase, onViewDocument, onDownloadDocument, viewed: viewedProp, onMarkViewed, backLabel,
}: BoHoSoVuAnProps) {
  const [tab, setTab] = useState<HoSoTab>('ds');
  const [folder, setFolder] = useState('all');
  const [q, setQ] = useState('');          // điều kiện đã áp dụng
  const [qInput, setQInput] = useState(''); // chữ đang gõ – như bản gốc, chỉ lọc khi Enter / rời ô (sự kiện change)
  const [status, setStatus] = useState('');
  const [mlClosed, setMlClosed] = useState(false);
  const [viewerFocus, setViewerFocus] = useState<string | null>(null);
  const [ownViewed, setOwnViewed] = useState<ReadonlySet<string>>(() => new Set()); // markViewed – nhãn trong trình xem
  const viewed = viewedProp ?? ownViewed;
  const [listSeen, setListSeen] = useState<ReadonlySet<string>>(() => viewedProp ?? new Set()); // dòng tô “đã xem” – bản gốc dựng lại danh sách khi đóng trình xem
  const [find, setFind] = useState<DocFindState>(FIND0);
  const [toast, setToast] = useState({ text: '', on: false });
  const toastTimer = useRef<number>(undefined);
  const layer = useContext(KysoLayerContext);
  const { path, inF } = useTreeIndex(tree);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const statusOptions = useMemo(() => [...new Set(docs.map(d => d.status))], [docs]);
  const fq = fold(q);
  const list = docs.filter(d => inF(d, folder) && (!fq || fold(`${d.name} ${d.so} ${d.file || ''}`).includes(fq)) && (!status || d.status === status));
  const mucLuc = useMemo(() => docs.filter(d => d.cap).sort((a, b) => parseInt(a.so) - parseInt(b.so)), [docs]);
  const count = (id: string) => docs.filter(d => inF(d, id)).length;

  // hs-vw → openViewer(id, {all:true})
  const view = (d: HoSoDoc) => { setViewerFocus(d.id); onViewDocument?.(d); };
  const markViewed = useCallback((id: string) => {
    if (onMarkViewed) onMarkViewed(id); else setOwnViewed(s => (s.has(id) ? s : new Set(s).add(id)));
  }, [onMarkViewed]);
  const closeViewer = () => { setViewerFocus(null); setListSeen(viewed); };
  // ACT.dl → toast(): thông báo 2,8 giây ở đáy khung
  const download = (d: HoSoDoc) => {
    setToast({ text: 'Tải xuống tệp (mô phỏng)', on: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(t => ({ ...t, on: false })), 2800);
    onDownloadDocument?.(d);
  };
  const commitQ = () => setQ(qInput);
  const clear = () => { setQ(''); setQInput(''); setStatus(''); };

  // Trình xem + thông báo: dựng vào lớp phủ của khung (như #dlg, #toast nằm thẳng trong <body> của iframe)
  const overlay = (
    <>
      {viewerFocus !== null && (
        <HoSoViewer items={viewerItems} focusId={viewerFocus} viewed={viewed} loginLabel={loginLabel}
          find={find} onFindChange={setFind} onViewed={markViewed} onClose={closeViewer} />
      )}
      <div className={'toast' + (toast.on ? ' on' : '')} role="status" aria-live="polite">{toast.text}</div>
    </>
  );

  const node = (n: HoSoTreeNode, lv: number) => (
    <div key={n.id} className={'hs-tn ' + (folder === n.id ? 'on' : '')} role="treeitem" aria-selected={folder === n.id} tabIndex={0}
      style={{ paddingLeft: 8 + lv * 18 }} onClick={() => setFolder(n.id)} onKeyDown={e => { if (e.key === 'Enter') setFolder(n.id); }}>
      <IconFolder /><span className="t">{n.ten}{n.note && <small>{n.note}</small>}</span><span className="c">{count(n.id)}</span>
    </div>
  );

  return (
    <>
      <div className="pt">
        <div className="pt-l">
          <h1>Bộ hồ sơ vụ án<span className="count">{docs.length} văn bản</span></h1>
          <p>
            <a href="#" className="v20-case" title={'Mở Thông tin vụ án ' + caseInfo.ma} onClick={e => { e.preventDefault(); onOpenCase?.(); }}><IconLink />Vụ án {caseInfo.ma}</a>
            {' · ' + caseInfo.ten + ' · ' + caseInfo.toiDanh + (caseInfo.ghiChu ? ' · ' + caseInfo.ghiChu : '')}
          </p>
        </div>
        <div className="pt-r">
          {backLabel
            ? <button className="btn " type="button" data-act="v28ret" onClick={onClose}><IconChevronLeft />{' Quay lại ' + backLabel}</button>
            : <button className="btn" type="button" onClick={onClose}>Đóng</button>}
          <div className="v35-tb" role="toolbar" aria-label="Thao tác văn bản">
            <button type="button" className="" onClick={onBack}><IconArrowLeft />Quay lại</button>
          </div>
        </div>
      </div>

      <div className="card tabs">
        <div className="scroller" role="tablist">
          <span className={'tab ' + (tab === 'ds' ? 'on' : '')} role="tab" aria-selected={tab === 'ds'} tabIndex={0} onClick={() => setTab('ds')} onKeyDown={e => { if (e.key === 'Enter') setTab('ds'); }}>
            <IconCopy /> Danh sách văn bản <span className="n">{docs.length}</span>
          </span>
          <span className={'tab ' + (tab === 'ml' ? 'on' : '')} role="tab" aria-selected={tab === 'ml'} tabIndex={0} onClick={() => setTab('ml')} onKeyDown={e => { if (e.key === 'Enter') setTab('ml'); }}>
            <IconBook /> Mục lục văn bản <span className="n">{mucLuc.length}</span>
          </span>
        </div>
      </div>

      {tab === 'ds' ? (
        <div className="hs">
          <section className="card">
            <div className="ch">
              <span className="ic"><IconFolder /></span>
              <div className="t"><b>Cây hồ sơ</b><span>{caseInfo.ma} · {caseInfo.ten}</span></div>
            </div>
            <div className="cb" style={{ padding: 8 }} role="tree" aria-label="Cây hồ sơ">
              <div className={'hs-tn ' + (folder === 'all' ? 'on' : '')} role="treeitem" aria-selected={folder === 'all'} tabIndex={0} onClick={() => setFolder('all')} onKeyDown={e => { if (e.key === 'Enter') setFolder('all'); }}>
                <IconCopy /><span className="t">Tất cả văn bản</span><span className="c">{docs.length}</span>
              </div>
              {tree.map(r => [node(r, 0), ...(r.kids || []).map(k => node(k, 1))])}
            </div>
          </section>
          <section className="card">
            <div className="ch"><div className="t"><b>{folder === 'all' ? 'Tất cả văn bản' : path(folder)}</b><span>{list.length} văn bản</span></div></div>
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flt">
                <label className="f" style={{ flex: 1, minWidth: 240 }}>
                  <input className="hs-q" placeholder=" " value={qInput} onChange={e => setQInput(e.target.value)} onBlur={commitQ} onKeyDown={e => { if (e.key === 'Enter') commitQ(); }} />
                  <span className="fl">Tên văn bản, số văn bản</span>
                </label>
                <label className="f" style={{ width: 220 }}>
                  <select className="hs-st" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="">Tất cả</option>
                    {statusOptions.map(o => <option key={o}>{o}</option>)}
                  </select>
                  <span className="fl">Trạng thái</span>
                </label>
                <button className="btn" type="button" onClick={clear}>Xóa bộ lọc</button>
              </div>
              <div className="tw">
                <table className="tb">
                  <thead><tr><th style={{ width: 56 }}>STT</th><th>Tên văn bản</th><th>Số, ngày</th><th>Loại</th><th>Gói trình</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                  <tbody>
                    {list.length ? list.map((d, i) => (
                      <tr key={d.id} className={listSeen.has(d.id) ? 'seen' : ''}>
                        <td>{i + 1}</td>
                        <td style={{ minWidth: 240 }}>
                          <button className="lnk" type="button" onClick={() => view(d)}>{d.name}</button>
                          {d.file && <span className="sub">{d.file}</span>}
                          {(folder === 'all' || d.folder !== folder) && <span className="hs-path"><IconFolder />{path(d.folder)}</span>}
                        </td>
                        <td className="nw">{d.so}<span className="sub">{d.ngay || ''}</span></td>
                        <td><span className="bd sm n">{d.loai}</span></td>
                        <td>{d.goi ? <span className="bd sm t">{d.goi}</span> : '—'}</td>
                        <td><span className={'bd sm ' + d.tone}>{d.status}</span></td>
                        <td>
                          <div className="acts">
                            <button className="icb" type="button" title="Xem" aria-label={'Xem ' + d.name} onClick={() => view(d)}><IconEye /></button>
                            <button className="icb" type="button" title="Tải xuống" aria-label={'Tải xuống ' + d.name} onClick={() => download(d)}><IconDownload /></button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="empty">{folder !== 'all' && !q && !status ? 'Thư mục chưa có văn bản' : 'Không có văn bản phù hợp'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <section className={'card' + (mlClosed ? ' closed' : '')}>
          <div className="ch">
            <span className="ic"><IconBook /></span>
            <div className="t"><b>Mục lục văn bản</b><span>Văn bản tố tụng đã có số, sắp theo số văn bản</span></div>
            <span className="meta">{mucLuc.length} văn bản</span>
            <button className="col" type="button" title="Thu gọn" aria-expanded={!mlClosed} onClick={() => setMlClosed(c => !c)}><IconChevronUp /></button>
          </div>
          <div className="cb">
            <div className="tw">
              <table className="tb">
                <thead><tr><th style={{ width: 56 }}>STT</th><th>Số văn bản</th><th>Ngày ban hành</th><th>Tên văn bản</th><th>Người ký</th><th>Tập hồ sơ</th></tr></thead>
                <tbody>
                  {mucLuc.length ? mucLuc.map((d, i) => (
                    <tr key={d.id}>
                      <td>{i + 1}</td>
                      <td className="nw"><button className="lnk" type="button" onClick={() => view(d)}>{d.so}</button></td>
                      <td>{d.ngay}</td>
                      <td style={{ minWidth: 240 }}>{d.name}</td>
                      <td>{d.signer || ''}</td>
                      <td>{path(d.folder)}</td>
                    </tr>
                  )) : <tr><td colSpan={6} className="empty">Chưa có dữ liệu</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {layer ? createPortal(overlay, layer) : overlay}
    </>
  );
}
