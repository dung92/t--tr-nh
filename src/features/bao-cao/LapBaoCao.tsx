import { useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { SAMPLE_CASE, SAMPLE_DOCS } from '../ho-so/data';
import { DocPaper } from '../ho-so/DocPaper';
import type { HoSoDoc, HoSoPaper } from '../ho-so/types';
import { SAMPLE_VIEWER_ITEMS } from '../ho-so/viewer-data';
import { KysoLayerContext } from '../ky-so';
import {
  IconAlert, IconArrowLeft, IconCheck, IconChevronDown, IconChevronLeft, IconChevsDown, IconChevsUp, IconClipboard, IconDownload,
  IconExpandV35, IconEye, IconEyeOff, IconFile, IconFileText, IconFolder, IconInfo, IconLayC, IconLayL, IconLayR, IconLink, IconMaxS7,
  IconMinus, IconPlus, IconSave, IconSearch, IconShare, IconShrinkV35, IconSign, IconTrash, IconUpload, IconX,
} from '../ky-so/icons';
import { KysoModal } from '../ky-so/KysoModal';
import { Card, LineStepper, SplitPane, usePaperZoom, useToast, ZoomControl, type StepItem, type ZoomMode } from '../ky-so/parts';
import { DOC_FIND_0, useDocFind } from '../ky-so/useDocFind';
import { Bm01Paper, type Bm01Data } from './Bm01Paper';
import { DRAFTS, FILES, FORM_DEFAULTS, GROUPS, LOAI, SEED_DET, USERS } from './data';
import { ATTACH_LABEL, HoSoTreePanel, treeIndex, type AttachKind } from './HoSoTreePanel';
import { PickDraftsDialog } from './PickDraftsDialog';
import type { BcForm, FileInfo } from './types';

const nm = (id: string) => USERS[id]?.name ?? '';
const full = (id: string) => (USERS[id] ? USERS[id].name + (USERS[id].ma ? ' (' + USERS[id].ma + ')' : '') : '');
const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();
const IDX = treeIndex();
const pad = (n: number) => String(n).padStart(2, '0');
/** now() của app Ký số: đồng hồ mô phỏng bắt đầu 08:00 04/11/2026, mỗi lần ghi lịch sử cộng 6 phút */
function clockAt(min: number) { const d = new Date(2026, 10, 4, 8, 0 + min); return { t: `${pad(d.getHours())}:${pad(d.getMinutes())}`, d: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` }; }
const ALLOW = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'], MAXB = 20 * 1048576;
const fmtSize = (b: number) => (b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB');
type Tab = 'info' | 'drafts' | 'docs' | 'bc2';
type FieldKey = 'ngay' | 'so' | 'nguoiKy' | 'pheDuyet' | 'kinhGui' | 'trichYeu' | 'noiDung' | 'kinhBao';
interface Log { t: string; d: string; title: string; desc: string; who: string }

export interface LapBaoCaoProps {
  /** Phiên lập (mỗi lần bấm Thêm mới / Lập lại một phiên): nội dung đang nhập được giữ khi sang trang hồ sơ rồi quay lại */
  session: string;
  /** Loại văn bản: 'bc' Báo cáo đề xuất (mặc định), 'tt' Tờ trình */
  loai?: string;
  /** Lập lại từ bản bị từ chối: id bản ghi có sẵn (SEED_DET) – lấy nội dung bản đó (v18lapseed) */
  fromSeed?: string;
  /** Văn bản hồ sơ đã xem (dùng chung trong cửa sổ) */
  viewed: ReadonlySet<string>;
  onMarkViewed: (id: string) => void;
  /** Quay lại (Hủy) → về danh sách, không lưu */
  onClose: () => void;
  /** Nút mở rộng trong tab Hồ sơ vụ án → trang Bộ hồ sơ vụ án */
  onOpenHoSo: () => void;
  /** Tiêu đề màn đổi (Thêm mới… → … số 2405/…) – cửa sổ V33 hiển thị theo */
  onTitle?: (h1: string) => void;
  onSaveDraft?: (form: BcForm) => void;
  /** “Xác nhận lưu” → bước ký số (luồng ký số chưa chuyển sang React) */
  onSaveSign?: (form: BcForm) => void;
  onOpenCase?: () => void;
}

/* Nội dung đang nhập theo phiên (S.form của app Ký số là biến toàn cục: còn nguyên khi sang Bộ hồ sơ vụ án rồi quay lại) */
const SESSIONS = new Map<string, { f: BcForm; tab: Tab; clock: number; hist: Log[]; draftAt: string | null; extra: Record<string, FileInfo> }>();

/** Form lập báo cáo đề xuất / tờ trình: khởi tạo như newForm (+ nội dung bản bị từ chối khi lập lại) */
function initForm(loai: string, fromSeed?: string): BcForm {
  const f: BcForm = { ...(FORM_DEFAULTS[loai] || FORM_DEFAULTS.bc), nhayBy: {} };
  const s = fromSeed ? SEED_DET[fromSeed] : undefined;
  if (s) {
    const cv = s.versions.find(v => v.cur) || s.versions[s.versions.length - 1];
    Object.assign(f, { kinhGui: s.kinhGui, trichYeu: s.trichYeu, noiDung: s.noiDung, kinhBao: s.kinhBao, docs: s.docs.slice(), prev: { so: cv.so } });
  }
  return f;
}

/**
 * Thêm mới báo cáo đề xuất (Thêm mới → Báo cáo đề xuất) / Lập lại tờ trình – PAGES.bcdx của app Ký số (bản V18) cùng các lớp
 * V20 (đính kèm từ hồ sơ), V28 (tab Hồ sơ vụ án), V35 (thanh nút trên tiêu đề), V36 (hộp chọn văn bản dự thảo).
 * Ở trong cửa sổ toàn màn hình V33. Lưu & ký số dừng ở hộp thoại “Xác nhận lưu” – bước ký số báo ra ngoài (onSaveSign).
 */
export function LapBaoCao({ session, loai = 'bc', fromSeed, viewed, onMarkViewed, onClose, onOpenHoSo, onTitle, onSaveDraft, onSaveSign, onOpenCase }: LapBaoCaoProps) {
  const kept = SESSIONS.get(session);
  const [f, setF] = useState<BcForm>(() => kept?.f ?? initForm(loai, fromSeed));
  const [errs, setErrs] = useState<ReadonlySet<string>>(new Set());
  // Như bản gốc: sửa ô nào thì ô đó hết báo lỗi
  const upd = (p: Partial<BcForm>) => {
    setF(x => ({ ...x, ...p }));
    setErrs(e => (Object.keys(p).some(k => e.has(k)) ? new Set([...e].filter(k => !(k in p))) : e));
  };
  const [tab, setTab] = useState<Tab>(() => kept?.tab ?? 'info');
  const [hs, setHs] = useState(false);                         // V28: tab Hồ sơ vụ án
  const [hv, setHv] = useState<string | null>(null);           // V28: văn bản hồ sơ đang xem
  const [view, setView] = useState<string | null>(null);       // BCX.view: văn bản / tệp đang xem ở khung phải
  const [pv, setPv] = useState(false);                         // BCX.pv: khung xem trước
  const [auto, setAuto] = useState(false);                     // BCX.auto: xem trước tạm tắt khi mở lịch sử
  const [tl, setTl] = useState(false);                         // BCX.tl: lịch sử xử lý
  const [tlOpen, setTlOpen] = useState<Record<number, boolean>>({});
  const [ratio, setRatio] = useState(56);
  const [onlyR, setOnlyR] = useState(false);
  const [clock, setClock] = useState(() => kept?.clock ?? 0);
  const [hist, setHist] = useState<Log[]>(() => kept?.hist ?? []);
  const [draftAt, setDraftAt] = useState<string | null>(() => kept?.draftAt ?? null);
  const [extra, setExtra] = useState<Record<string, FileInfo>>(() => kept?.extra ?? {});
  useEffect(() => { SESSIONS.set(session, { f, tab, clock, hist, draftAt, extra }); }, [session, f, tab, clock, hist, draftAt, extra]);
  const [dlg, setDlg] = useState<null | 'pick' | 'nodraft' | 'save' | { bad: string[] }>(null);
  const [foldAll, setFoldAll] = useState({ closed: false, n: 0 });
  const [zoomMode, setZoomMode] = useState<ZoomMode>('fit');
  const [zoomV, setZoomV] = useState<ZoomMode>('fit');
  const [zoomHv, setZoomHv] = useState<ZoomMode>('fit');
  const [find, setFind] = useState(DOC_FIND_0);
  const layer = useContext(KysoLayerContext);
  const toast = useToast();
  const upRef = useRef<HTMLInputElement>(null), formRef = useRef<HTMLDivElement>(null);
  const bcDocRef = useRef<HTMLDivElement>(null), bcPaperRef = useRef<HTMLDivElement>(null);
  const vDocRef = useRef<HTMLDivElement>(null), vPaperRef = useRef<HTMLDivElement>(null);
  const hvDocRef = useRef<HTMLDivElement>(null), hvPaperRef = useRef<HTMLDivElement>(null);

  const L = LOAI[f.loai] || LOAI.bc, lt = L.t.toLowerCase(), saved = draftAt !== null;
  const g = f.src && GROUPS[f.src] ? GROUPS[f.src] : null;
  const fileOf = (id: string) => FILES[id] || extra[id];
  const needTT = f.drafts.some(d => DRAFTS[d]?.signer === 'tung');
  const h1 = saved ? `${L.t} số ${f.so}/${f.hauto}` : `Thêm mới ${lt}`;
  useEffect(() => { onTitle?.(h1.toUpperCase()); }, [h1]); // eslint-disable-line react-hooks/exhaustive-deps

  // Hồ sơ vụ án: sau khi lưu nháp có thêm chính báo cáo này (dossierDocs: bc1)
  const dossier: HoSoDoc[] = useMemo(() => saved
    ? [...SAMPLE_DOCS.slice(0, 24), { id: 'bc1', name: 'Báo cáo đề xuất (Biểu mẫu 01)', so: `${f.so}/${f.hauto}`, ngay: f.ngay, folder: 'ak', loai: 'Báo cáo đề xuất', status: 'Đang tạo', tone: 'n' }, ...SAMPLE_DOCS.slice(24)]
    : SAMPLE_DOCS, [saved, f.so, f.hauto, f.ngay]);

  // ---- đính kèm từ hồ sơ (V20) ----
  const kindOf = (id: string): AttachKind => (f.drafts.includes(id) ? 'drafts' : f.docs.includes(id) ? 'docs' : f.att.includes(id) ? 'att' : '');
  const can = (id: string) => {
    if (['bc1', 'bc2', 'kq'].includes(id)) return { ok: false, why: 'Văn bản thuộc chính luồng báo cáo đang lập' };
    if (DRAFTS[id]) return { ok: true, k: 'drafts' as const };
    if (fileOf(id)) return { ok: true, k: 'docs' as const };
    return { ok: true, k: 'att' as const };
  };
  const toggleAttach = (id: string, on?: boolean) => {
    const cur = kindOf(id), c = can(id); const want = on ?? !cur;
    if (!want && cur) { setF(x => ({ ...x, [cur]: (x[cur] as string[]).filter(y => y !== id) })); toast.show(`Đã bỏ văn bản khỏi ${lt}`); }
    else if (want && !cur) { if (!c.ok || !('k' in c)) return toast.show(c.why || ''); const k = c.k!; setF(x => ({ ...x, [k]: [...(x[k] as string[]), id] })); toast.show(`Đã đính kèm vào ${lt} · ${ATTACH_LABEL[k]}`); }
  };

  // ---- xem trước / xem văn bản ----
  const zoomBc = usePaperZoom(bcDocRef, bcPaperRef, zoomMode, setZoomMode, [pv, onlyR, ratio, f]);
  const zoomView = usePaperZoom(vDocRef, vPaperRef, zoomV, setZoomV, [view, pv, ratio]);
  const zoomHvC = usePaperZoom(hvDocRef, hvPaperRef, zoomHv, setZoomHv, [hv, pv, ratio]);
  const finder = useDocFind({ hostRef: bcDocRef, paperRef: bcPaperRef, docKey: 'bc', find, onFindChange: setFind });
  const bm: Bm01Data = { loai: f.loai, so: f.so, hauto: f.hauto, ngay: f.ngay, pheDuyet: f.pheDuyet, nguoiKy: f.nguoiKy, trichYeu: f.trichYeu, kinhGui: f.kinhGui, noiDung: f.noiDung, kinhBao: f.kinhBao, docs: f.docs.filter(d => FILES[d]), drafts: f.drafts, signs: {} };
  const togglePv = () => { setPv(p => !p); setAuto(false); };
  const toggleTl = () => {
    if (!tl) { if (pv) { setPv(false); setAuto(true); } } else if (auto) { setPv(true); setAuto(false); }
    setTl(t => !t);
  };
  const setLay = (v: string) => { if (v === 'full') setOnlyR(o => !o); else { setOnlyR(false); setRatio(+v); } };

  // ---- kiểm tra, lưu ----
  const validate = (keys: FieldKey[]) => {
    const miss = keys.filter(k => !String(f[k] || '').trim());
    setErrs(new Set(miss));
    if (miss.length) {
      setHs(false); setHv(null); setTab('info');
      toast.show('Vui lòng nhập đủ các trường bắt buộc');
      requestAnimationFrame(() => formRef.current?.querySelector('.f.err')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
    }
    return !miss.length;
  };
  const log = (title: string, desc: string, at: number) => setHist(h => [{ ...clockAt(at), title, desc, who: nm('tam') }, ...h]);
  const saveDraft = () => {
    if (!validate(['ngay', 'so', 'pheDuyet'])) return;
    const at = clock + 12; setClock(at);            // tick() + log() của draftbc
    log(`Cán bộ lập lưu nháp ${L.t}`, `Lưu nháp BCĐX ${f.so}/${f.hauto}: ${f.docs.length} tài liệu, ${f.drafts.length} văn bản dự thảo.`, at);
    const n = clockAt(at); setDraftAt(`${n.t} ${n.d}`); setPv(false);
    toast.show(`Đã lưu nháp ${L.t}`);
    onSaveDraft?.(f);
  };
  const saveSign = () => {
    if (!validate(['ngay', 'so', 'nguoiKy', 'pheDuyet', 'kinhGui', 'trichYeu', 'noiDung', 'kinhBao'])) return;
    setDlg(f.drafts.length ? 'save' : 'nodraft');
  };

  // ---- tải tệp (addFiles) ----
  const addFiles = (list: FileList) => {
    const ok: string[] = [], bad: string[] = [], add: Record<string, FileInfo> = {}, n = clockAt(clock);
    [...list].forEach((fl, i) => {
      const e = extOf(fl.name);
      if (!ALLOW.includes(e)) { bad.push(`${fl.name}: định dạng không hỗ trợ`); return; }
      if (fl.size > MAXB) { bad.push(`${fl.name}: vượt 20 MB`); return; }
      const id = 'u' + Date.now() + i; add[id] = { name: fl.name, ty: 'Tài liệu tải lên', ngay: n.d, size: fmtSize(fl.size) }; ok.push(id);
    });
    setExtra(x => ({ ...x, ...add })); upd({ docs: [...f.docs, ...ok] });
    if (bad.length) setDlg({ bad });
    if (ok.length) toast.show(`Đã tải lên ${ok.length} tệp`);
  };

  // ---- ô nhập (fin) ----
  const input = (k: keyof BcForm, label: string, o: { req?: boolean; span?: string; ro?: boolean; max?: number; area?: boolean } = {}) => {
    const v = String(f[k] ?? '');
    const ctl = o.area
      ? <textarea data-k={k} placeholder=" " maxLength={o.max || undefined} rows={3} readOnly={o.ro} value={v} onChange={e => upd({ [k]: e.target.value } as Partial<BcForm>)} />
      : <input data-k={k} value={v} placeholder=" " maxLength={o.max || undefined} readOnly={o.ro} onChange={e => upd({ [k]: e.target.value } as Partial<BcForm>)} />;
    return (
      <label className={['f', o.ro ? 'ro' : '', o.span || '', errs.has(k) ? 'err' : ''].filter(Boolean).join(' ')}>
        {ctl}<span className="fl">{label}{o.req && <i>*</i>}</span>
        {o.max ? <span className="cnt" data-cnt={k}>{v.length + '/' + o.max}</span> : null}
      </label>
    );
  };
  const select = (k: keyof BcForm, label: string, opts: [string, string][], o: { req?: boolean; span?: string } = {}) => (
    <label className={['f', o.span || '', errs.has(k) ? 'err' : ''].filter(Boolean).join(' ')}>
      <select data-k={k} required={o.req} value={String(f[k] ?? '')} onChange={e => upd({ [k]: e.target.value } as Partial<BcForm>)}>
        {opts.map(([v, t]) => <option key={v} value={v}>{v === '' && o.req ? '' : t}</option>)}
      </select>
      <span className="fl">{label}{o.req && <i>*</i>}</span>
    </label>
  );
  const nhayOpts: [string, string][] = [['tam', nm('tam') + ' (người lập văn bản)'], ...(f.yk ? [[f.yk, nm(f.yk) + ' (người cần xin ý kiến)'] as [string, string]] : [])];

  // ---- các tab ----
  const paneInfo = (
    <>
      <Card icon={<IconFile />} title="Thông tin văn bản" sub="Các trường có dấu * là bắt buộc" foldAll={foldAll}>
        <div className="grid">
          {input('ngay', 'Ngày văn bản', { req: true })}{input('so', 'Số văn bản', { req: true })}{input('hauto', 'Hậu tố văn bản', { ro: true })}
          {select('nguoiKy', 'Người ký văn bản', [['', ''], ['tam', full('tam')]], { req: true })}
          {select('pheDuyet', 'Phê duyệt của Chỉ huy', [['', ''], ['diem', full('diem') + ' – ' + USERS.diem.cv]], { req: true, span: 'c2' })}
          {select('yk', 'Người cần xin ý kiến', [['', 'Không xin ý kiến (trình trực tiếp)'], ['lan', full('lan') + ' – ' + USERS.lan.cv]], { span: 'c2' })}
          {select('nhayDef', 'Người ký nháy văn bản dự thảo', nhayOpts, { req: true, span: 'c2' })}
          <div className="c2" style={{ display: 'flex', alignItems: 'center' }}>
            <div className={'v18-vt' + (f.vtView ? ' on' : '')}>
              <label className="v18-sw" title="Cho phép Văn thư xem nội dung hồ sơ khi cấp số, phát hành"><input type="checkbox" data-k="vtView" checked={f.vtView} onChange={e => upd({ vtView: e.target.checked })} /><i /></label>
              <span><b>Quyền xem hồ sơ của văn thư</b><small>Lựa chọn này là mặc định cho bước sau; Chỉ huy, Lãnh đạo được chọn lại</small></span>
            </div>
          </div>
        </div>
      </Card>
      <Card icon={<IconFileText />} title={'Nội dung ' + lt} foldAll={foldAll}>
        <div className="grid">
          {input('kinhGui', 'Kính gửi', { req: true, span: 'call', area: true })}
          {input('trichYeu', 'Trích yếu', { req: true, span: 'call', max: 300 })}
          {input('noiDung', 'Nội dung', { req: true, span: 'call', max: 1000, area: true })}
          {input('kinhBao', 'Kính báo cáo và xin ý kiến chỉ đạo của đồng chí', { req: true, span: 'call' })}
        </div>
      </Card>
    </>
  );
  const paneDrafts = (
    <>
      <div className="v18-bar"><button type="button" className="btn sm" data-act="pickvb" onClick={() => setDlg('pick')}><IconPlus />{' Chọn văn bản dự thảo'}</button></div>
      {f.drafts.length ? <>
        <div className="tw"><table className="tb">
          <thead><tr><th style={{ width: 48 }}>STT</th><th>Tên văn bản</th><th>Người ký</th><th style={{ width: 176 }} title="Người phải ký nháy trước khi báo cáo được trình đi">Người ký nháy</th><th style={{ width: 80 }}>Thao tác</th></tr></thead>
          <tbody>{f.drafts.map((d, i) => {
            const D = DRAFTS[d];
            return (
              <tr key={d} className={view === d ? 'v18-on' : ''}>
                <td>{i + 1}</td>
                <td style={{ minWidth: 200 }}><button type="button" className="lnk" data-act="v18view" data-id={d} title="Xem văn bản ở khung bên phải" onClick={() => setView(d)}>{D.name}</button><span className="sub">{`${D.mau || ''} · Dự thảo ${D.ngay}`}</span></td>
                <td className="nw">{nm(D.signer)}<span className="sub">{USERS[D.signer]?.role}</span></td>
                <td><label className="f v18-nhs" title="Người phải ký nháy văn bản này; để “Theo mặc định” là người chọn ở tab Thông tin chi tiết">
                  <select className="v18-nh" data-id={d} aria-label="Người ký nháy" value={f.nhayBy?.[d] || ''} onChange={e => upd({ nhayBy: { ...f.nhayBy, [d]: e.target.value } })}>
                    <option value="">{'Theo mặc định – ' + nm(f.nhayDef)}</option>
                    {nhayOpts.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select></label></td>
                <td><div className="acts">
                  <button type="button" className="icb" data-act="v18view" data-id={d} title="Xem" onClick={() => setView(d)}><IconEye /></button>
                  <button type="button" className="icb red" data-act="rmdr" data-id={d} title="Bỏ khỏi báo cáo" onClick={() => { if (view === d) setView(null); upd({ drafts: f.drafts.filter(x => x !== d) }); }}><IconX /></button>
                </div></td>
              </tr>
            );
          })}</tbody>
        </table></div>
        <div className="note t" style={{ marginTop: 10 }}><IconInfo /><span>Người ký nháy chỉ có thể là <b>người lập văn bản</b> hoặc <b>người cần xin ý kiến</b> (chọn ở tab Thông tin chi tiết); mặc định là người lập. Báo cáo chỉ trình đi khi người được chỉ định đã ký nháy; người đó được quyền trả lại văn bản để chỉnh sửa.</span></div>
      </> : <div className="v18-empty"><b>Chưa chọn văn bản dự thảo</b>Chỉ chọn được văn bản dự thảo chưa ký của vụ án.</div>}
    </>
  );
  const paneDocs = (
    <>
      <div className="v18-bar v21-bar"><button type="button" className="btn sm" data-act="v18hs" onClick={() => setHs(true)}><IconFolder />{' Chọn từ Hồ sơ tố tụng điện tử'}</button><span className="muted">hoặc tải tệp từ máy tính ở khung bên dưới</span></div>
      <div className="v18-drop" data-act="v18up" tabIndex={0} role="button" aria-label="Tải tệp lên từ máy tính" onClick={() => upRef.current?.click()} onKeyDown={e => { if (e.key === 'Enter') upRef.current?.click(); }}
        onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('over'); }} onDragLeave={e => e.currentTarget.classList.remove('over')}
        onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('over'); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}>
        <span className="ic"><IconUpload /></span>
        <div><b>Kéo thả tệp vào đây hoặc <u>chọn tệp từ máy tính</u></b><small>Chọn được nhiều tệp cùng lúc · tối đa 20 MB/tệp</small><div className="fm"><span>PDF</span><span>Word</span><span>Excel</span><span>JPG, PNG</span></div></div>
      </div>
      {f.docs.length ? (
        <div className="tw"><table className="tb">
          <thead><tr><th style={{ width: 56 }}>STT</th><th>Tên tệp</th><th style={{ width: 100 }}>Dung lượng</th><th style={{ width: 112 }}>Ngày tải lên</th><th style={{ width: 96 }}>Thao tác</th></tr></thead>
          <tbody>{f.docs.map((d, i) => {
            const x = fileOf(d) || { name: d, ty: '', ngay: '', size: '—' };
            return (
              <tr key={d} className={view === d ? 'v18-on' : ''}>
                <td>{i + 1}</td>
                <td style={{ minWidth: 220 }}><button type="button" className="lnk v18-fn" data-act="v18view" data-id={d} title="Xem tệp ở khung bên phải" onClick={() => setView(d)}><span className={'v18-ext ' + extOf(x.name)}>{extOf(x.name).toUpperCase()}</span><b>{x.name}</b></button></td>
                <td className="nw">{x.size}</td>
                <td className="nw">{x.ngay || ''}</td>
                <td><div className="acts">
                  <button type="button" className="icb" data-act="dl" title="Tải về" onClick={() => toast.show('Tải xuống tệp (mô phỏng)')}><IconDownload /></button>
                  <button type="button" className="icb red" data-act="rmdoc" data-id={d} title="Xóa" onClick={() => { if (view === d) setView(null); upd({ docs: f.docs.filter(y => y !== d) }); }}><IconTrash /></button>
                </div></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : <div className="v18-empty"><b>Chưa có tài liệu, chứng cứ</b>Tải tệp từ máy tính hoặc đính kèm từ Hồ sơ tố tụng điện tử vụ án.</div>}
      <input ref={upRef} type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={e => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }} />
    </>
  );
  const paneBc2 = (
    <Card icon={<IconShare />} title="Báo cáo đề xuất trình lãnh đạo" sub="Báo cáo trình Thủ trưởng/Phó Thủ trưởng CQĐT được ủy quyền · Biểu mẫu 02" foldAll={foldAll}>
      <div className="note t"><IconAlert /><span>{needTT
        ? 'Văn bản dự thảo có người ký là Lãnh đạo TT/PTT, bắt buộc lập Báo cáo đề xuất trình TT/PTT được ủy quyền (Biểu mẫu 02) trước khi Chỉ huy trình lên.'
        : 'Chỉ cần lập khi văn bản dự thảo do Lãnh đạo TT/PTT ký. Người ký BCĐX trình lãnh đạo mặc định là Chỉ huy phê duyệt.'}</span></div>
      <div style={{ marginTop: 12 }}><button type="button" className="btn ol" data-act="newbc2" onClick={() => toast.show('Lập Báo cáo đề xuất trình lãnh đạo (Biểu mẫu 02) sau khi lưu báo cáo này')}><IconPlus />{' Tạo báo cáo trình TT/PTT được ủy quyền'}</button></div>
    </Card>
  );
  const TABS: [Tab, string, ReactNode, string, string, ReactNode][] = [
    ['info', 'Thông tin chi tiết', '', 'Thông tin', 'Thông tin chi tiết', paneInfo],
    ['drafts', 'Văn bản tố tụng dự thảo', f.drafts.length, 'VB dự thảo', 'Văn bản dự thảo', paneDrafts],
    ['docs', 'Tài liệu, chứng cứ', f.docs.length + f.att.length, 'Tài liệu', 'Tài liệu, chứng cứ', paneDocs],
    ['bc2', 'Báo cáo đề xuất trình lãnh đạo', needTT ? 'req' : '', 'BCĐX trình lãnh đạo', 'BCĐX trình lãnh đạo', paneBc2],
  ];
  const left = (
    <section className="card bct">
      <div className="tabs">
        <div className="scroller">
          {TABS.map(([k, t, n, s2, m]) => (
            <div key={k} className={'tab ' + (!hs && k === tab ? 'on' : '')} data-act={'bcxtab:' + k} title={t} role="tab" aria-selected={!hs && k === tab} tabIndex={0}
              onClick={() => { setHs(false); setHv(null); setTab(k); }} onKeyDown={e => { if (e.key === 'Enter') { setHs(false); setHv(null); setTab(k); } }}>
              <span className="lf">{t}</span><span className="lm">{m}</span><span className="ls2">{s2}</span>{n !== '' && <>{' '}<span className="n">{n}</span></>}
            </div>
          ))}
          <div className={'tab v28-hst' + (hs ? ' on' : '')} data-act="v28tab" title="Mở lại hồ sơ vụ án để theo dõi và ra quyết định" role="tab" aria-selected={hs} tabIndex={0}
            onClick={() => setHs(true)} onKeyDown={e => { if (e.key === 'Enter') setHs(true); }}>
            <IconFolder /><span>Hồ sơ vụ án</span><span className="n">{dossier.length}</span>
          </div>
        </div>
        <div className="r v18-tools">
          <button type="button" className="icb" data-act="bcxfold:1" title="Thu gọn tất cả" aria-label="Thu gọn tất cả" onClick={() => setFoldAll(x => ({ closed: true, n: x.n + 1 }))}><IconChevsUp /></button>
          <button type="button" className="icb" data-act="bcxfold:0" title="Mở tất cả" aria-label="Mở tất cả" onClick={() => setFoldAll(x => ({ closed: false, n: x.n + 1 }))}><IconChevsDown /></button>
          {!pv && <button type="button" className="icb" data-act="bcxpv" title="Mở lại khung xem trước" aria-label="Mở xem trước" onClick={togglePv}><IconEye /></button>}
        </div>
      </div>
      <div className="bct-b" ref={formRef}>
        {TABS.map(([k, , , , , pane]) => <div key={k} className="bcp" data-pane={k} hidden={hs || k !== tab}>{pane}</div>)}
        <div className="bcp" data-pane="hs" hidden />
        {hs && <div className="bcp v28-hsp"><HoSoTreePanel docs={dossier} current={hv} viewed={viewed} onView={id => { onMarkViewed(id); setHv(id); }} onOpenHoSo={onOpenHoSo}
          attach={{ kindOf, can, toggle: id => toggleAttach(id) }} /></div>}
      </div>
    </section>
  );

  // ---- khung phải ----
  const attachBtn = (id: string) => {
    const k = kindOf(id), c = can(id);
    if (k) return <span className="v20-attd" title={ATTACH_LABEL[k]}><IconCheck />Đã kèm<button type="button" className="icb" data-act="v20att" data-id={id} title={'Bỏ khỏi ' + (f.loai === 'cv' ? 'công văn' : 'báo cáo')} aria-label="Bỏ kèm" onClick={() => toggleAttach(id, false)}><IconX /></button></span>;
    if (!c.ok) return null;
    return <button type="button" className="btn sm pri v20-attb" data-act="v20att" data-id={id} onClick={() => toggleAttach(id, true)}><IconPlus />{' Chọn kèm ' + (f.loai === 'cv' ? 'công văn' : 'báo cáo')}</button>;
  };
  const meta = (id: string) => {
    const x = fileOf(id);
    if (x) return { t: x.name, s: [x.ty, x.size, x.ngay].filter(Boolean).join(' · '), path: '' };
    const d = dossier.find(y => y.id === id);
    if (d) return { t: d.name, s: [d.so && d.so !== '—' ? d.so : '', d.ngay, d.status].filter(Boolean).join(' · '), path: IDX.path(d.folder) };
    if (DRAFTS[id]) return { t: DRAFTS[id].name, s: 'Dự thảo · ' + DRAFTS[id].ngay, path: '' };
    return { t: id, s: '', path: '' };
  };
  const anyDoc = (id: string, ref: React.Ref<HTMLDivElement>) => {
    const it = SAMPLE_VIEWER_ITEMS.find(x => x.id === id);
    if (it) return <DocPaper key={id} ref={ref} paper={it.paper} />;
    const x = fileOf(id);
    if (x) return <DocPaper key={id} ref={ref} paper={{ kind: 'file', ext: extOf(x.name).toUpperCase(), tenTep: x.name, trichYeu: x.ty } as HoSoPaper} />;
    if (id === 'bc1') return <Bm01Paper key={id} ref={ref} b={bm} />;
    return <div className="v18-ph"><div>Không có nội dung xem trước</div></div>;
  };
  const vm = view ? meta(view) : null;
  const right = view && vm ? (
    <section className="card pv v18-pv">
      <div className="ch">
        <button type="button" className="icb" data-act="v18pvback" title="Quay lại xem trước biểu mẫu" onClick={() => setView(null)}><IconChevronLeft /></button>
        <div className="t"><b title={vm.t}>{vm.t}</b><span>{vm.s}</span></div>
        <div className="tools"><ZoomControl name="v18" zoom={zoomView} />{attachBtn(view)}<button type="button" className="icb" data-act="dl" title="Tải về" onClick={() => toast.show('Tải xuống tệp (mô phỏng)')}><IconDownload /></button></div>
      </div>
      <div className="pv-doc v18Wrap" data-w="794" ref={vDocRef}>{anyDoc(view, vPaperRef)}</div>
    </section>
  ) : (
    <section className="card pv">
      <div className="ch">
        <div className="t"><b>{'Xem trước · ' + (f.loai === 'cv' ? 'Công văn' : f.loai === 'bc' ? 'Biểu mẫu 01' : L.t)}</b><span>Cập nhật theo nội dung đang nhập</span></div>
        <div className="tools">
          <ZoomControl name="bc" zoom={zoomBc} />
          <button type="button" className="icb" data-act="v20find" title="Tìm trong văn bản (Ctrl+F)" aria-label="Tìm trong văn bản" onClick={finder.toggle}><IconSearch /></button>
          <span className="lay" data-lay-for="bcdx">
            {([['62', 'Mở rộng phần nội dung', <IconLayL key="l" />], ['50', 'Chia đôi', <IconLayC key="c" />], ['38', 'Mở rộng phần xem trước', <IconLayR key="r" />], ['full', 'Toàn màn hình xem trước', <IconMaxS7 key="m" />]] as [string, string, ReactNode][])
              .map(([v, t, ic]) => <button key={v} type="button" data-lay={v} title={t} className={(v === 'full' ? onlyR : !onlyR && Math.abs(+v - ratio) < 1) ? 'on' : undefined} onClick={() => setLay(v)}>{ic}</button>)}
          </span>
          <button type="button" className="icb" data-act="bcxpv" title="Tắt xem trước, mở rộng phần nội dung" aria-label="Tắt xem trước" onClick={togglePv}><IconEyeOff /></button>
        </div>
      </div>
      {finder.bar}
      <div className="pv-doc bcWrap" data-w="794" ref={bcDocRef}><Bm01Paper ref={bcPaperRef} b={bm}>{finder.markers}</Bm01Paper></div>
    </section>
  );
  const hm = hs && hv ? meta(hv) : null;
  const hsPreview = hs && hv && hm && (
    <section className="card pv v28-pv">
      <div className="v28-pvx"><IconFolder /><span>Đang xem tài liệu hồ sơ – không phải báo cáo đề xuất</span><button type="button" className="btn sm ol" data-act="v28hvx" onClick={() => setHv(null)}><IconChevronLeft />{' Quay lại báo cáo'}</button></div>
      <div className="ch">
        <div className="t"><b title={hm.t}>{hm.t}</b><span>{[hm.s, hm.path].filter(Boolean).join(' · ')}</span></div>
        <div className="tools"><ZoomControl name="v28" zoom={zoomHvC} />{attachBtn(hv)}</div>
      </div>
      <div className="pv-doc v28Wrap" data-w="794" ref={hvDocRef}>{anyDoc(hv, hvPaperRef)}</div>
    </section>
  );

  // ---- thanh bước + lịch sử xử lý (lineStepper / tlPanel) ----
  const steps: StepItem[] = [
    { t: 'Lập ' + ({ bc: 'BCĐX', tt: 'tờ trình', kh: 'kế hoạch', cv: 'công văn' }[f.loai] || 'BCĐX'), s: 'Đang xử lý', c: 'act' },
    { t: 'Xin ý kiến', s: 'Sắp tới', c: f.yk ? '' : 'na' },
    { t: 'Chỉ huy duyệt', s: 'Sắp tới', c: '' },
    { t: 'TT/PTT duyệt', s: 'Sắp tới', c: needTT ? '' : 'na' },
    { t: 'Thẩm định (nếu có YC)', s: 'Sắp tới', c: 'na' },
    { t: 'Ký số văn bản', s: 'Sắp tới', c: f.drafts.length ? '' : 'na' },
    { t: 'Văn thư', s: 'Sắp tới', c: '' },
  ];
  const nowAt = clockAt(clock);
  const step0Open = tlOpen[0] ?? true;
  const tlp = (
    <aside className="card tlp">
      <div className="tlp-h"><IconClipboard /><b>Lịch sử xử lý</b><button type="button" className="icb" data-act="bcxtl" title="Đóng" onClick={toggleTl}><IconMinus /></button></div>
      <div className="tlp-b">
        <div className={'tls act' + (step0Open ? ' open' : '')}>
          <div className="tls-h" data-act="bcxstep:0" role="button" tabIndex={0} onClick={() => setTlOpen(o => ({ ...o, 0: !step0Open }))}><div><b>{steps[0].t}</b><span>{steps[0].s}</span></div><span className="icb"><IconChevronDown /></span></div>
          {step0Open && <div className="tls-b">
            <div className="tli now"><i /><div><span className="tm">{`${nowAt.t} · ${nowAt.d}`}</span><b>Đang soạn thảo</b><p>{`${f.docs.length} tài liệu · ${f.drafts.length} văn bản dự thảo`}</p><small>{'Cán bộ thực hiện: ' + nm('tam')}</small></div></div>
            {hist.map((x, i) => <div key={i} className="tli "><i /><div><span className="tm">{`${x.t} · ${x.d}`}</span><b>{x.title}</b>{x.desc && <p>{x.desc}</p>}<small>{'Cán bộ thực hiện: ' + x.who}</small></div></div>)}
          </div>}
        </div>
      </div>
      <div className="tlp-f"><button type="button" className="lnk" data-act="tientrinh" onClick={() => toast.show('Tiến trình xử lý đầy đủ có sau khi báo cáo được lưu')}>Xem toàn bộ tiến trình xử lý</button></div>
    </aside>
  );

  // ---- hộp thoại ----
  let dialog: ReactNode = null;
  if (dlg === 'pick') dialog = <PickDraftsDialog selected={f.drafts} onClose={() => setDlg(null)}
    onOk={ids => { upd({ drafts: ids }); setDlg(null); toast.show(`Đã chọn ${ids.length} văn bản dự thảo`); }} />;
  else if (dlg === 'nodraft' || dlg === 'save') {
    const nodraft = dlg === 'nodraft';
    dialog = (
      <KysoModal head={nodraft ? 'Xác nhận' : 'Xác nhận lưu'} onClose={() => setDlg(null)}
        foot={<><button type="button" className="btn w160" data-act="close" onClick={() => setDlg(null)}>Đóng</button>
          <button type="button" className="btn pri w160" data-act="ok" onClick={() => { if (nodraft) setDlg('save'); else { setDlg(null); onSaveSign?.(f); } }}>Xác nhận</button></>}>
        <p style={{ margin: 0 }}>{nodraft ? `${L.t} chưa có văn bản tố tụng dự thảo kèm theo. Đồng chí vẫn lưu?` : `Kiểm tra thông tin và xác nhận lưu ${L.t}. Sau khi lưu, đồng chí ký số trên Biểu mẫu 01.`}</p>
      </KysoModal>
    );
  } else if (dlg && typeof dlg === 'object') {
    dialog = (
      <KysoModal head="Một số tệp không tải lên được" onClose={() => setDlg(null)} foot={<button type="button" className="btn w160" data-act="close" onClick={() => setDlg(null)}>Đóng</button>}>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{dlg.bad.map((b, i) => <li key={i}>{b}</li>)}</ul>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>Định dạng cho phép: PDF, Word, Excel, JPG, PNG · tối đa 20 MB/tệp.</p>
      </KysoModal>
    );
  }

  return (
    <>
      <div className="emb-back"><button type="button" data-emb="back" onClick={onClose}>← Danh sách Tờ trình / Đề xuất / Thẩm định</button><span>Đang thao tác trong luồng ký số</span></div>
      <div className="pt">
        <div className="pt-l">
          <h1>{h1.toUpperCase()}</h1>
          <p>
            {draftAt && `Đã lưu nháp lúc ${draftAt} · `}
            <a href="#" className="v20-case" title={'Mở Thông tin vụ án ' + SAMPLE_CASE.ma} onClick={e => { e.preventDefault(); onOpenCase?.(); }}><IconLink />{'Vụ án ' + SAMPLE_CASE.ma}</a>
            {' · ' + SAMPLE_CASE.ten + ' · ' + SAMPLE_CASE.toiDanh + (g ? ' · Lập từ: ' + g : '') + (f.prev ? ' · Thay thế bản ' + f.prev.so + ' bị trả lại' : '')}
          </p>
        </div>
        <div className="pt-r">
          <div className="v35-tb" role="toolbar" aria-label="Thao tác văn bản">
            <button type="button" className="" data-v35="0" onClick={onClose}><IconArrowLeft />Quay lại</button>
            <button type="button" className="" data-v35="pv" onClick={togglePv}>{pv ? <><IconShrinkV35 />Thu gọn văn bản</> : <><IconExpandV35 />Mở rộng văn bản</>}</button>
            <button type="button" className="pri" data-v35="2" onClick={saveSign}><IconSign />Lưu &amp; ký số</button>
            <button type="button" className="" data-v35="1" onClick={saveDraft}><IconSave />Lưu nháp</button>
          </div>
        </div>
      </div>
      <LineStepper steps={steps} tl={{ on: tl, onToggle: toggleTl }} />
      <div className={'bcx ' + (tl ? 'tl-on' : '')}>
        {tlp}
        <SplitPane name="bcdx" def={56} onlyL={!pv && !view} className={onlyR ? 'only-r' : undefined} ratio={ratio} onRatio={setRatio}
          rightClassName={hs && hv ? 'v28-pvon' : undefined} left={left} right={<>{right}{hsPreview}</>} />
      </div>
      {'\n    '}
      <div className="footbar"><span>“Lưu &amp; ký số” khóa nội dung và mở bước ký số ngay trên trang này.</span><div className="r">
        <button type="button" className="btn w160" data-act="cancelbc" onClick={onClose}>Hủy</button>
        <button type="button" className="btn w160" data-act="draftbc" onClick={saveDraft}>Lưu nháp</button>
        <button type="button" className="btn pri w160" data-act="savebc" onClick={saveSign}>Lưu &amp; ký số</button>
      </div></div>
      {layer ? createPortal(<>{dialog}{toast.node}</>, layer) : <>{dialog}{toast.node}</>}
    </>
  );
}
