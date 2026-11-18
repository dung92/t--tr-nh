import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useDocFind, type DocFindState } from '../ky-so/useDocFind';
import { DocPaper } from './DocPaper';
import {
  IconArrowNext, IconArrowPrev, IconExpand, IconFile, IconPrint, IconSearch, IconShrink, IconV19List, IconX, IconZoomIn, IconZoomOut,
} from './icons';
import type { HoSoViewerItem } from './types';

export interface HoSoViewerProps {
  items: HoSoViewerItem[];
  /** Văn bản được bấm mở. Không có trong danh sách (VD tờ trình mẫu thuộc AK) → mở văn bản đầu tiên, như bản gốc */
  focusId: string;
  /** Văn bản đã xem – nhãn “Đã xem” / “Chưa xem · Cần xem” */
  viewed: ReadonlySet<string>;
  /** Phần “Đăng nhập: …” ở dòng phụ tiêu đề */
  loginLabel: string;
  /** Thanh tìm trong văn bản – trạng thái do màn cha giữ để còn nguyên khi mở lại trình xem */
  find: DocFindState;
  onFindChange: (find: DocFindState) => void;
  /** Văn bản vừa được hiển thị (markViewed) */
  onViewed: (id: string) => void;
  onClose: () => void;
}

/**
 * Trình xem hồ sơ “Xem hồ sơ báo cáo” mở từ Bộ hồ sơ vụ án (nút mắt, tên văn bản, số văn bản ở Mục lục).
 * Nguồn: openViewer/renderViewer của app Ký số + các lớp V19 (pop-up nửa màn hình 741px bám phải, thanh điều hướng,
 * thu phóng, toàn màn hình, in), VER20 §7 (tìm trong văn bản theo trang) và V24 (mũi tên chuyển văn bản hai bên).
 * Hộp thoại nằm trong khung cửa sổ V33 (thay cho #dlg của iframe): nền tối phủ khung, thanh tiêu đề V33 vẫn dùng được.
 */
export function HoSoViewer({ items, focusId, viewed, loginLabel, find, onFindChange, onViewed, onClose }: HoSoViewerProps) {
  const [curId, setCurId] = useState(() => (items.some(i => i.id === focusId) ? focusId : items[0]?.id ?? ''));
  const [listOpen, setListOpen] = useState(false);   // VW19.lo
  const [zoom, setZoom] = useState(1);               // VW19.z
  const [full, setFull] = useState(false);           // VW19.full
  const [arrowTop, setArrowTop] = useState<number>();
  const dlgRef = useRef<HTMLDialogElement>(null), docRef = useRef<HTMLDivElement>(null), paperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const idx = items.findIndex(i => i.id === curId), cur = idx >= 0 ? items[idx] : undefined;
  const groups = [...new Set(items.map(i => i.group))];
  const seen = (id: string) => viewed.has(id) || id === cur?.id;   // văn bản đang hiển thị được đánh dấu đã xem ngay
  const tags = (id: string) => (seen(id) ? <span className="bd sm n">Đã xem</span> : <span className="bd sm y">Chưa xem · Cần xem</span>);
  const go = (i: number) => { if (items[i]) { setCurId(items[i].id); setListOpen(false); } };

  useEffect(() => { if (cur) onViewed(cur.id); }, [cur, onViewed]);

  // Như showModal(): focus vào phần tử đầu tiên của hộp thoại (nút ×); đóng thì trả focus về nút đã bấm
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = dlgRef.current?.querySelector<HTMLElement>('.mh .icb');
    (first || dlgRef.current)?.focus({ preventScroll: true });
    return () => { if (prev && prev.isConnected) prev.focus({ preventScroll: true }); };
  }, []);

  // v19Zoom: tờ giấy vừa bề rộng vùng xem (tối đa 100%) × mức phóng
  useLayoutEffect(() => {
    const fit = () => {
      const pp = paperRef.current, doc = docRef.current; if (!pp || !doc) return;
      pp.style.zoom = '1';
      const base = Math.min(1, (doc.clientWidth - 32) / (pp.offsetWidth || 794));
      pp.style.zoom = (base * zoom).toFixed(3);
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [curId, zoom, full]);

  // V24 place(): mũi tên ở giữa chiều cao vùng xem – tính lại khi đổi văn bản / cỡ hộp thoại
  useLayoutEffect(() => {
    const d = dlgRef.current, doc = docRef.current; if (!d || !doc) return;
    const place = () => setArrowTop(doc.offsetTop + doc.clientHeight / 2);
    place();
    const ro = new ResizeObserver(place); ro.observe(d);
    window.addEventListener('resize', place);
    return () => { ro.disconnect(); window.removeEventListener('resize', place); };
  }, [curId, full]);

  // Tìm trong văn bản (gọi sau hiệu ứng zoom)
  const finder = useDocFind({ hostRef: docRef, paperRef, docKey: curId, find, onFindChange });

  // Phím: Esc đóng, ← → chuyển văn bản (không khi đang gõ), Ctrl+F mở thanh tìm
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); finder.openFind(true); return; }
      if (e.defaultPrevented) return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      const t = e.target as Element | null;
      if (t && typeof t.closest === 'function' && t.closest('input,textarea,select')) return;
      if (e.key === 'ArrowRight' && idx < items.length - 1) { e.preventDefault(); go(idx + 1); }
      if (e.key === 'ArrowLeft' && idx > 0) { e.preventDefault(); go(idx - 1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Mở danh sách: cuộn tới văn bản đang xem
  useEffect(() => {
    if (listOpen) listRef.current?.querySelector('.vw-i.on')?.scrollIntoView({ block: 'nearest' });
  }, [listOpen]);

  const print = () => {
    const h = document.documentElement;
    h.classList.add('v19-pr');
    setTimeout(() => { try { window.print(); } catch { /* trình duyệt chặn in */ } setTimeout(() => h.classList.remove('v19-pr'), 400); }, 30);
  };

  const title = cur ? cur.title : '';
  const sub = 'Xem hồ sơ báo cáo · ' + (items.length ? `văn bản ${idx + 1}/${items.length}` : 'chưa có văn bản') + (loginLabel ? ' · Đăng nhập: ' + loginLabel : '');
  const arrowStyle = arrowTop === undefined ? undefined : { top: arrowTop };

  return (
    <>
      <div className="vw-backdrop" onClick={onClose} />
      <dialog open ref={dlgRef} className={'modal vwr' + (full ? ' v19-full' : '')} tabIndex={-1} aria-modal="true" aria-labelledby={titleId}>
        <div className="mh">
          <div><b id={titleId} title={title}>{title || 'Xem hồ sơ báo cáo'}</b><small>{sub}</small></div>
          <button type="button" className="icb" data-act="close" aria-label="Đóng" onClick={onClose}><IconX /></button>
        </div>
        <div className={'vw' + (listOpen ? ' v19-lo' : '')}>
          <div className="vw-l" ref={listRef}>
            {groups.map(g => (
              <Fragment key={g}>
                <div className="vw-g">{g}</div>
                {items.filter(i => i.group === g).map(i => (
                  <div key={i.id} className={'vw-i' + (i.id === curId ? ' on' : '')} data-vw={i.id} role="button" tabIndex={0}
                    onClick={() => go(items.indexOf(i))} onKeyDown={e => { if (e.key === 'Enter') go(items.indexOf(i)); }}>
                    <IconFile /><div className="t">{i.title}<div className="m">{tags(i.id)}</div></div>
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
          <div className="vw-r">
            <div className="v19-vnav">
              <button type="button" className="hs" data-v19vw="list" aria-expanded={listOpen} title="Danh sách văn bản trong hồ sơ báo cáo" onClick={() => setListOpen(o => !o)}>
                <IconV19List />{`Hồ sơ báo cáo (${items.length})`}
              </button>
              <span className="pos">{`${idx + 1}/${items.length}`}</span>
              <span className="tg">{cur && tags(cur.id)}</span>
              <span className="sp" />
              <button type="button" data-act="v20find" title="Tìm trong văn bản (Ctrl+F)" aria-label="Tìm trong văn bản" onClick={finder.toggle}><IconSearch /></button>
              <button type="button" data-v19vw="zo" title="Thu nhỏ" aria-label="Thu nhỏ" onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}><IconZoomOut /></button>
              <span className="z">{Math.round(zoom * 100) + '%'}</span>
              <button type="button" data-v19vw="zi" title="Phóng to" aria-label="Phóng to" onClick={() => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))}><IconZoomIn /></button>
              <span className="sep" />
              <button type="button" data-v19vw="print" title="In văn bản" aria-label="In văn bản" onClick={print}><IconPrint /></button>
              <button type="button" data-v19vw="full" title={full ? 'Thu về nửa màn hình' : 'Toàn màn hình'} aria-label="Toàn màn hình" onClick={() => setFull(f => !f)}>{full ? <IconShrink /> : <IconExpand />}</button>
            </div>
            <div className="vw-tb"><span className="tt">{title}</span><button type="button" className="btn" data-act="close" onClick={onClose}>Đóng</button></div>
            {finder.bar}
            <div className="vw-doc" ref={docRef}>
              {cur ? <DocPaper key={cur.id} ref={paperRef} paper={cur.paper}>{finder.markers}</DocPaper> : <div className="empty">Chưa có dữ liệu</div>}
            </div>
            <button type="button" className="v24-arw prev" data-v19vw="prev" title="Văn bản trước (phím ←)" aria-label="Văn bản trước" disabled={idx <= 0} style={arrowStyle} onClick={() => go(idx - 1)}><IconArrowPrev /></button>
            <button type="button" className="v24-arw next" data-v19vw="next" title="Văn bản sau (phím →)" aria-label="Văn bản sau" disabled={idx >= items.length - 1} style={arrowStyle} onClick={() => go(idx + 1)}><IconArrowNext /></button>
          </div>
        </div>
      </dialog>
    </>
  );
}
