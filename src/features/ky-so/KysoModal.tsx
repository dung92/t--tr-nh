import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from './icons';
import { KysoLayerContext } from './KysoWindow';

/**
 * Hộp thoại #dlg của app Ký số (modal(), confirmBox(), renderPick()…): nền tối + dialog.modal giữa khung,
 * dựng vào lớp phủ của khung (như <body> của iframe). Như showModal(): focus nút ×, Esc / bấm nền tối để đóng.
 */
export function KysoModal({ cls = '', head, children, foot, footCenter = true, onClose }: {
  /** Lớp thêm của dialog (VD “lg v18-pick v36-pick”) */
  cls?: string;
  /** Tiêu đề: chuỗi → <b>; hoặc phần tử tự dựng (VD <div><b/><small/></div>) */
  head: ReactNode;
  children: ReactNode;
  foot: ReactNode;
  /** .mf.c (nút canh giữa) – modal() thường; false cho hộp chọn có dòng đếm bên trái */
  footCenter?: boolean;
  onClose: () => void;
}) {
  const layer = useContext(KysoLayerContext);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('.mh .icb')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !e.defaultPrevented) { e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); if (prev && prev.isConnected) prev.focus({ preventScroll: true }); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const node = (
    <>
      <div className="vw-backdrop" onClick={onClose} />
      <dialog open ref={ref} className={'modal ' + cls} aria-modal="true">
        <div className="mh">{typeof head === 'string' ? <b>{head}</b> : head}<button type="button" className="icb" data-act="close" aria-label="Đóng" onClick={onClose}><IconX /></button></div>
        <div className="mb">{children}</div>
        <div className={'mf' + (footCenter ? ' c' : '')}>{foot}</div>
      </dialog>
    </>
  );
  return layer ? createPortal(node, layer) : node;
}
