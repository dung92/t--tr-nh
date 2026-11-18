import { createContext, useState } from 'react';
import { createPortal } from 'react-dom';
import './ky-so.css';
import { IconClose, IconDoc, IconMax, IconMin } from './icons';

/** Phóng to (toàn màn hình) / thu nhỏ (ô nổi góc phải dưới) */
export type WindowMode = 'max' | 'min';

/**
 * Lớp phủ trong khung nội dung (tương ứng <body> của iframe app Ký số): hộp thoại, thông báo… dựng vào đây,
 * ngoài khối cuộn của trang, nên position:fixed bám theo khung cửa sổ như trong iframe (khung .v33-iff là khối chứa).
 */
export const KysoLayerContext = createContext<HTMLElement | null>(null);

/* Biến CSS mà V41 / app Ký số gắn lên <html> của iframe (tính theo khung iframe; trong cửa sổ V33 khung = cửa sổ trừ thanh tiêu đề 44px):
   --vpH/--vpTop chiều cao, đỉnh khung · --vpFit vùng nội dung (gopy_v18 kysoFit) · --fbl/--fbw/--fbb vị trí thanh nút cuối trang. */
const FRAME_VARS = {
  '--vpH': 'calc(100vh - 44px)', '--vpTop': '0px', '--vpFit': 'calc(100vh - 88px)',
  '--fbl': '20px', '--fbw': 'calc(100vw - 40px)', '--fbb': '10px',
} as React.CSSProperties;

interface WindowProps {
  /** Chữ trên thanh tiêu đề – như V33: textContent của <h1> màn đang mở */
  title: string;
  mode: WindowMode;
  /** Lớp của <html> iframe ở màn đang mở (VD “v28-view v18-fit v38-tdfit” ở màn chi tiết báo cáo) – CSS theo màn dựa vào đây */
  rootClass?: string;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Cửa sổ toàn màn hình của V33 (v33_09112026.js – “BCĐX / Phiếu chuyển việc: pop-up toàn màn hình”):
 * thanh tiêu đề tối (thu nhỏ / đóng) + khung nội dung thay cho khung app Ký số; thu nhỏ → ô nổi góc phải dưới.
 * Nội dung vẫn giữ trong DOM khi thu nhỏ (như iframe bị ẩn) nên bộ lọc, tab… không bị mất.
 */
export function KysoWindow({ title, mode, rootClass, onMinimize, onMaximize, onClose, children }: WindowProps) {
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  return createPortal(
    <div className="kyso-win">
      {mode === 'max' && <div className="v33-wback" />}
      {mode === 'max' && (
        <div className="v33-wbar" role="toolbar" aria-label="Cửa sổ soạn thảo">
          <span className="ti"><IconDoc size={16} /><span>{title}</span><small>· Tờ trình / Đề xuất / Thẩm định</small></span>
          <button type="button" data-v33w="min" title="Thu nhỏ" aria-label="Thu nhỏ" onClick={onMinimize}><IconMin size={16} /></button>
          <button type="button" className="x" title="Đóng" aria-label="Đóng" onClick={onClose}><IconClose size={16} /></button>
        </div>
      )}
      <div className={'v33-iff' + (mode === 'min' ? ' v33-ifhide' : '')} role="dialog" aria-modal={mode === 'max'} aria-label={title}>
        <div className={'kyso-hs' + (rootClass ? ' ' + rootClass : '')} style={FRAME_VARS}>
          <div className="app"><div className="main"><main className="page">
            <section className="view on v-flow">
              <KysoLayerContext.Provider value={layer}>{children}</KysoLayerContext.Provider>
            </section>
          </main></div></div>
          <div className="kyso-hs-layer" ref={setLayer} />
        </div>
      </div>
      {mode === 'min' && (
        <div className="v33-ifmini" role="dialog" aria-label="Văn bản đang thu nhỏ">
          <div className="v33-mw">
            <span className="ic"><IconDoc size={16} /></span>
            <button type="button" className="tt" title="Phóng to" onClick={onMaximize}><b>{title}</b><small>Đang soạn thảo · đã thu nhỏ</small></button>
            <button type="button" className="wb" title="Phóng to" aria-label="Phóng to" onClick={onMaximize}><IconMax size={14} /></button>
            <button type="button" className="wb x" title="Đóng" aria-label="Đóng" onClick={onClose}><IconClose size={15} /></button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

/** Dải giữ chỗ hiện trong tab khi cửa sổ đang thu nhỏ (.v33-ifph) – thay cho nội dung của tab như bản gốc. */
export function KysoPlaceholder({ title, onClose, onMaximize }: { title: string; onClose: () => void; onMaximize: () => void }) {
  return (
    <div className="kyso-win">
      <div className="v33-ifph">
        <IconDoc size={18} /><span><b>{title}</b> đang được thu nhỏ ở góc dưới bên phải.</span><span className="sp" />
        <button type="button" onClick={onClose}>Đóng</button>
        <button type="button" className="pri" onClick={onMaximize}>Phóng to</button>
      </div>
    </div>
  );
}
