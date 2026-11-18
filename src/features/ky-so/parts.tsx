import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { IconCheck, IconChevronUp, IconClock, IconFile, IconGrip, IconX } from './icons';

/* Thành phần giao diện dùng chung của các màn app Ký số (mục 7 “Thành phần giao diện dùng chung”, dynSteps, initSplit, zoomCtl). */

/** Tiêu đề trang (pageTitle): h1 + nhãn trạng thái, dòng mô tả, nút bên phải */
export function PageTitle({ title, badge, desc, right }: { title: string; badge?: [string, string]; desc?: ReactNode; right?: ReactNode }) {
  return (
    <div className="pt">
      <div className="pt-l">
        <h1>{title}{badge && <>{' '}<span className={'bd ' + badge[1]}>{badge[0]}</span></>}</h1>
        {desc && <p>{desc}</p>}
      </div>
      <div className="pt-r">{right}</div>
    </div>
  );
}

/** Thẻ nội dung (card) – nút “Thu gọn” bật/tắt lớp .closed */
export function Card({ icon = <IconFile />, title, sub, meta, right, className, foldAll, children }: {
  icon?: ReactNode; title: ReactNode; sub?: ReactNode; meta?: ReactNode; right?: ReactNode; className?: string;
  /** “Thu gọn tất cả / Mở tất cả” (bcxfold): mỗi lần n đổi thì đặt lại trạng thái thu gọn theo closed */
  foldAll?: { closed: boolean; n: number };
  children: ReactNode;
}) {
  const [closed, setClosed] = useState(false);
  useEffect(() => { if (foldAll && foldAll.n) setClosed(foldAll.closed); }, [foldAll?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className={'card' + (className ? ' ' + className : '') + (closed ? ' closed' : '')}>
      <div className="ch">
        <span className="ic">{icon}</span>
        <div className="t"><b>{title}</b>{sub && <span>{sub}</span>}</div>
        {right}
        {meta != null && <span className="meta">{meta}</span>}
        <button className="col" data-act="fold" title="Thu gọn" type="button" aria-expanded={!closed} onClick={() => setClosed(c => !c)}><IconChevronUp /></button>
      </div>
      <div className="cb">{children}</div>
    </section>
  );
}

const SPAN = { s2: 'c2', s3: 'c3', s4: 'call' } as const;
/** Ô chỉ xem (fv) */
export function FieldView({ label, value, span, cls = '', tall = false }: { label: string; value?: ReactNode; span?: keyof typeof SPAN; cls?: string; tall?: boolean }) {
  return (
    <div className={['f vf ro', cls, span ? SPAN[span] : ''].filter(Boolean).join(' ')}>
      <span className="fl">{label}</span>
      <div className={'v' + (tall ? ' tall' : '')}>{value || '—'}</div>
    </div>
  );
}

/** Một bước của thanh tiến trình: c = done | act | rej | bs | na | '' */
export interface StepItem { t: string; s: string; c: string; tm?: string }
/** Thanh bước dạng line (dynSteps): các bước đã/đang xử lý, bước tiếp theo, số bước đã xử lý */
export function LineStepper({ steps, fin = false, tl }: { steps: StepItem[]; fin?: boolean; tl?: { on: boolean; onToggle: () => void } }) {
  const DONE = ['done', 'act', 'rej', 'bs'];
  const idx = steps.map((s, i) => ({ ...s, i }));
  const shown = idx.filter(s => DONE.includes(s.c)), last = shown[shown.length - 1];
  const nx = fin ? null : idx.find(s => s.c === '' && (!last || s.i > last.i));
  const nDone = shown.filter(s => s.c === 'done').length;
  return (
    <div className="lst dyn">
      {tl && <button className={'lst-tl ' + (tl.on ? 'on' : '')} data-act="bcxtl" type="button" title={(tl.on ? 'Đóng' : 'Mở') + ' chi tiết tiến trình (lịch sử xử lý)'} onClick={tl.onToggle}><IconClip2 /></button>}
      <div className="lst-s">
        {shown.map((s, k) => (
          <Fragment key={s.i}>
            {k > 0 && <i className={'ll' + (s.c === 'rej' ? ' rj' : '')} />}
            <div className={'ls ' + s.c} title={s.t + ' · ' + s.s + (s.tm ? ' · ' + s.tm : '')}>
              <span className="lc">{s.c === 'done' ? <IconCheck /> : s.c === 'rej' ? <IconX /> : k + 1}</span>
              <div className="lt"><b>{s.t}</b><span>{s.s + (s.tm && s.c !== 'act' ? ' · ' + s.tm : '')}</span></div>
            </div>
          </Fragment>
        ))}
        {nx && (
          <>
            {shown.length > 0 && <i className="ll nx" />}
            <div className="ls nx" title="Bước tiếp theo theo luồng">
              <span className="lc"><IconClock /></span>
              <div className="lt"><b>{'Tiếp theo: ' + nx.t}</b><span>Chưa đến lượt</span></div>
            </div>
          </>
        )}
        {!shown.length && !nx && <span className="muted">Chưa có bước xử lý</span>}
      </div>
      <div className="lst-c"><b>{nDone}</b>{' bước đã xử lý'}</div>
    </div>
  );
}
function IconClip2() {
  return <svg className="i" viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01" /></svg>;
}

/**
 * Khung chia đôi kéo được (initSplit): tỷ lệ cột trái r% (20–80, mỗi bên ≥ 340px khi kéo), nhấp đúp về mặc định, phím ←/→ ±2,
 * nhớ theo tên khung (localStorage “qlva-split-<tên>” như bản gốc); lớp wide-l khi cột trái rộng hơn 760px.
 */
export function SplitPane({ name, def, className, rightClassName, onlyL = false, ratio, onRatio, left, right }: {
  name: string; def: number; className?: string; rightClassName?: string;
  /** Chỉ cột trái (tắt xem trước) – lớp only-l */
  onlyL?: boolean;
  /** Tỷ lệ cột trái điều khiển từ ngoài (nút bố cục layCtl); bỏ trống = khung tự giữ */
  ratio?: number; onRatio?: (r: number) => void;
  left: ReactNode; right: ReactNode;
}) {
  const key = 'qlva-split-' + name;
  const [own, setOwn] = useState(() => { try { const v = Number(localStorage.getItem(key)); return v ? Math.max(20, Math.min(80, v)) : def; } catch { return def; } });
  const r = ratio ?? own;
  const setR = (v: number) => { if (ratio === undefined) setOwn(v); onRatio?.(v); };
  const [wide, setWide] = useState(true);
  const [drag, setDrag] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const save = (v: number) => { const x = Math.max(20, Math.min(80, v)); setR(x); try { localStorage.setItem(key, String(x)); } catch { /* bỏ qua */ } };
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const upd = () => setWide(el.getBoundingClientRect().width * (onlyL ? 1 : r / 100) > 760);
    upd();
    const ro = new ResizeObserver(upd); ro.observe(el);
    return () => ro.disconnect();
  }, [r, onlyL]);
  useEffect(() => {
    // body.dragging của bản gốc → lớp ở gốc khung (.kyso-hs.dragging)
    const root = ref.current?.closest('.kyso-hs');
    root?.classList.toggle('dragging', drag);
  }, [drag]);
  const style = { '--a': r + 'fr', '--b': (100 - r) + 'fr' } as React.CSSProperties;
  return (
    <div ref={ref} className={'split' + (className ? ' ' + className : '') + (onlyL ? ' only-l' : '') + (wide ? ' wide-l' : '')} data-split={name} data-def={def} style={style}>
      <div className="sp-l">{left}</div>
      <div className={'sp-h' + (drag ? ' drag' : '')} role="separator" aria-orientation="vertical" tabIndex={0} title="Kéo để điều chỉnh độ rộng · Nhấp đúp để về mặc định · Phím ←/→"
        onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setDrag(true); }}
        onPointerMove={e => {
          if (!drag || !ref.current) return;
          const b = ref.current.getBoundingClientRect(), min = 340 / b.width * 100;
          setR(Math.max(20, Math.min(80, Math.max(min, Math.min(100 - min, (e.clientX - b.left) / b.width * 100)))));
        }}
        onPointerUp={() => { if (drag) { setDrag(false); save(r); } }}
        onPointerCancel={() => { if (drag) { setDrag(false); save(r); } }}
        onDoubleClick={() => save(def)}
        onKeyDown={e => { if (e.key === 'ArrowLeft') { e.preventDefault(); save(r - 2); } if (e.key === 'ArrowRight') { e.preventDefault(); save(r + 2); } }}>
        <span className="grip"><IconGrip /></span>
      </div>
      <div className={'sp-r' + (rightClassName ? ' ' + rightClassName : '')}>{right}</div>
    </div>
  );
}

/** Mức phóng tờ giấy (ZM): 'fit' = vừa khung, hoặc số */
export type ZoomMode = 'fit' | number;
/**
 * applyZoom: đặt zoom tờ giấy trong vùng xem (bề rộng chuẩn 794px). Vừa khung = (bề rộng vùng xem − 32) / 794, trong 40–125%.
 * Trả về mức đang dùng để hiển thị “89%”.
 */
export function usePaperZoom(hostRef: React.RefObject<HTMLElement | null>, paperRef: React.RefObject<HTMLElement | null>, mode: ZoomMode, setMode: (m: ZoomMode) => void, deps: unknown[]) {
  const [z, setZ] = useState(1);
  const cur = useRef(1);   // curZ(): mức đang dùng – cập nhật ngay khi bấm để bấm liên tiếp vẫn cộng dồn
  useLayoutEffect(() => {
    const apply = () => {
      const w = hostRef.current, p = paperRef.current; if (!w || !p || !w.offsetParent) return;
      const fit = Math.max(0.4, Math.min(1.25, (w.clientWidth - 32) / 794)), v = mode === 'fit' ? fit : mode;
      p.style.zoom = String(v); cur.current = v; setZ(v);
    };
    apply();
    const ro = new ResizeObserver(apply); if (hostRef.current) ro.observe(hostRef.current);
    return () => ro.disconnect();
  }, [mode, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (d: number) => { const v = Math.max(0.4, Math.min(2, Math.round((cur.current + d) * 10) / 10)); cur.current = v; setMode(v); };
  return { z, mode, zin: () => step(0.1), zout: () => step(-0.1), zfit: () => setMode('fit') };
}
export type PaperZoom = ReturnType<typeof usePaperZoom>;

/** Nút thu/phóng (zoomCtl): − 89% + Vừa khung */
export function ZoomControl({ name, zoom }: { name: string; zoom: PaperZoom }) {
  return (
    <span className="zoom" data-zoom={name}>
      <button type="button" data-act="zout" title="Thu nhỏ" onClick={zoom.zout}>−</button>
      <span>{Math.round(zoom.z * 100) + '%'}</span>
      <button type="button" data-act="zin" title="Phóng to" onClick={zoom.zin}>+</button>
      <button type="button" className={'fit' + (zoom.mode === 'fit' ? ' on' : '')} data-act="zfit" onClick={zoom.zfit}>Vừa khung</button>
    </span>
  );
}

/** Thông báo ở đáy khung (toast() của app Ký số): 2,8 giây */
export function useToast() {
  const [t, setT] = useState({ text: '', on: false });
  const timer = useRef<number>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = (text: string) => {
    setT({ text, on: true });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setT(x => ({ ...x, on: false })), 2800);
  };
  const node = <div className={'toast' + (t.on ? ' on' : '')} role="status" aria-live="polite">{t.text}</div>;
  return { show, node };
}
