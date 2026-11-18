import { useCallback, useMemo, useState } from 'react';
import './to-trinh.css';
import { ChiTietBaoCao, chiTietTitle, hasChiTiet, LapBaoCao, SEED_DET, type BcForm } from '../bao-cao';
import { BoHoSoVuAn, SAMPLE_DOCS, type BoHoSoVuAnProps } from '../ho-so';
import { KysoPlaceholder, KysoWindow, type WindowMode } from '../ky-so';
import { AdvancedFilter } from './components/AdvancedFilter';
import { DocumentTable, type RowActions } from './components/DocumentTable';
import { FilterChips } from './components/FilterChips';
import { FlowModeSwitch } from './components/FlowModeSwitch';
import { Toolbar } from './components/Toolbar';
import { FOOT_NOTE, SAMPLE_ROWS } from './data';
import { basicFilter, buildAdvFields, chipsOf, matchAdv } from './filter';
import { IconAlert } from './icons';
import type { AddNewKind, AdvValues, FlowMode, Notice, ToTrinhRow } from './types';

export interface ToTrinhTabProps extends RowActions {
  /** Danh sách văn bản (mặc định: 2 bản ghi minh họa của prototype) */
  rows?: ToTrinhRow[];
  /** Luồng đang mô phỏng – truyền vào để điều khiển từ ngoài; bỏ trống thì component tự giữ */
  flowMode?: FlowMode;
  defaultFlowMode?: FlowMode;
  onFlowModeChange?: (mode: FlowMode) => void;
  /** Thông báo dưới dòng “Mô phỏng luồng” (VD: BCĐX đang trong luồng ký số) */
  notice?: Notice;
  /** Thêm mới: “Báo cáo đề xuất” mở form lập trong cửa sổ toàn màn hình; loại khác (Phiếu chuyển việc) báo ra ngoài */
  onCreate?: (kind: AddNewKind) => void;
  /** Form lập báo cáo: “Lưu nháp” */
  onSaveDraft?: (form: BcForm) => void;
  /** Form lập báo cáo: “Lưu & ký số” → Xác nhận (bước ký số do màn cha xử lý) */
  onSaveSign?: (form: BcForm) => void;
  /** Báo khi mở “Hồ sơ tài liệu” (màn Bộ hồ sơ vụ án mở trong cửa sổ toàn màn hình) */
  onOpenHoSo?: () => void;
  /** Dữ liệu và thao tác của màn Bộ hồ sơ vụ án (mặc định: dữ liệu minh họa của prototype).
   *  onOpenCase: link “Vụ án …” – cửa sổ hồ sơ đóng lại rồi mới báo ra ngoài để chuyển sang Thông tin vụ án. */
  hoSo?: Pick<BoHoSoVuAnProps, 'caseInfo' | 'tree' | 'docs' | 'viewerItems' | 'loginLabel' | 'onOpenCase' | 'onViewDocument' | 'onDownloadDocument'>;
}

/** Màn đang mở trong cửa sổ toàn màn hình: Bộ hồ sơ vụ án (from: mở từ “Hồ sơ điện tử” của bản ghi nào) / Chi tiết báo cáo */
type Screen =
  | { kind: 'hoso'; back?: Screen }
  | { kind: 'bcview'; id: string }
  | { kind: 'bcdx'; session: string; loai: string; fromSeed?: string };
let SESSION_N = 0;
/** Tiêu đề cửa sổ của V33 từ <h1> viết hoa (“THÊM MỚI BÁO CÁO ĐỀ XUẤT” → “Thêm mới báo cáo đề xuất”) */
const sentence = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

/**
 * Tab “Tờ trình / Đề xuất / Thẩm định” của Chi tiết vụ án (V41).
 * Nguồn: app Ký số (S7_KYSO_B64 – renderTotrinh, capSwitch) trong khung của tab, cộng thanh công cụ chuẩn
 * và “Lọc nâng cao” mà lớp v23_07112026.js của V41 gắn vào khung. Giao diện giữ nguyên class/CSS của prototype.
 */
export function ToTrinhTab({ rows = SAMPLE_ROWS, flowMode, defaultFlowMode = 'pc', onFlowModeChange, notice, onCreate, onSaveDraft, onSaveSign, onOpenHoSo, hoSo, onOpenRow, ...rowActions }: ToTrinhTabProps) {
  // Cửa sổ toàn màn hình V33: màn đang mở + chế độ phóng to / thu nhỏ
  const [win, setWin] = useState<{ screen: Screen; mode: WindowMode } | null>(null);
  // Văn bản hồ sơ đã xem – dùng chung giữa Bộ hồ sơ vụ án, trình xem và tab Hồ sơ vụ án của màn chi tiết (S.viewed của app Ký số)
  const [viewed, setViewed] = useState<ReadonlySet<string>>(() => new Set());
  const markViewed = useCallback((id: string) => setViewed(s => (s.has(id) ? s : new Set(s).add(id))), []);
  const show = (screen: Screen) => setWin(w => ({ screen, mode: w?.mode ?? 'max' }));
  const closeWin = () => setWin(null);
  const openHoSo = () => { show({ kind: 'hoso' }); onOpenHoSo?.(); };
  // Số văn bản / mắt: bản ghi có sẵn (s1, s2) mở màn chi tiết như bản gốc (v18seed → bcview); bản ghi khác báo ra ngoài
  const openRow = (r: ToTrinhRow) => { if (hasChiTiet(r.id)) show({ kind: 'bcview', id: r.id }); onOpenRow?.(r); };
  // Thêm mới: Báo cáo đề xuất → form lập trong cửa sổ (newbc → bcdx); Phiếu chuyển việc báo ra ngoài
  const newForm = (loai: string, fromSeed?: string) => show({ kind: 'bcdx', session: 'bcdx' + ++SESSION_N, loai, fromSeed });
  const create = (k: AddNewKind) => { if (k === 'bc') newForm('bc'); else onCreate?.(k); };
  const [formTitle, setFormTitle] = useState('');
  // Tiêu đề cửa sổ lấy như V33 (chữ của <h1> gồm cả nhãn) – bản gốc hiển thị “Bộ hồ sơ vụ án26 văn bản”
  const hoSoTitle = 'Bộ hồ sơ vụ án' + (hoSo?.docs ?? SAMPLE_DOCS).length + ' văn bản';
  const winTitle = !win ? '' : win.screen.kind === 'hoso' ? hoSoTitle : win.screen.kind === 'bcview' ? chiTietTitle(win.screen.id) : sentence(formTitle);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [adv, setAdv] = useState<AdvValues>({});
  const [ownMode, setOwnMode] = useState<FlowMode>(defaultFlowMode);
  const mode = flowMode ?? ownMode;

  // Trường lọc nâng cao sinh một lần từ toàn bộ dữ liệu (như v23 khi gắn thanh công cụ)
  const fields = useMemo(() => buildAdvFields(rows), [rows]);
  // Lớp 1 – app Ký số: tìm kiếm + trạng thái (STT đánh theo danh sách này)
  const listed = useMemo(() => basicFilter(rows, query, status), [rows, query, status]);
  // Lớp 2 – v23: lọc nâng cao ẩn dòng không khớp
  const visible = useMemo(() => new Set(listed.filter(r => matchAdv(r, adv, fields)).map(r => r.id)), [listed, adv, fields]);
  const chips = useMemo(() => chipsOf(adv, fields), [adv, fields]);

  const setField = (key: string, value: string | string[] | undefined) => setAdv(a => ({ ...a, [key]: value }));
  const removeField = (key: string) => setAdv(a => { const n = { ...a }; delete n[key]; return n; });
  const changeMode = (m: FlowMode) => { if (flowMode === undefined) setOwnMode(m); onFlowModeChange?.(m); };

  // Cửa sổ luôn ở cùng một vị trí trong cây → khi phóng to / thu nhỏ không bị dựng lại (giữ tab, bộ lọc… như iframe bị ẩn của bản gốc)
  const sc = win?.screen;
  const openCase = () => { closeWin(); hoSo?.onOpenCase?.(); };
  let winScreen: React.ReactNode = null;
  if (sc?.kind === 'hoso') {
    // Mở từ “Hồ sơ điện tử” / tab Hồ sơ vụ án (V28): Đóng / Quay lại trở về đúng màn đó
    const back = sc.back ? () => show(sc.back!) : closeWin;
    winScreen = <BoHoSoVuAn key="hoso" {...hoSo} viewed={viewed} onMarkViewed={markViewed} onClose={back} onBack={back}
      backLabel={sc.back ? (sc.back.kind === 'bcdx' ? 'màn lập báo cáo' : 'Báo cáo đề xuất') : undefined} onOpenCase={openCase} />;
  } else if (sc?.kind === 'bcview') {
    winScreen = <ChiTietBaoCao key={'bcview' + sc.id} id={sc.id} viewed={viewed} onMarkViewed={markViewed} onClose={closeWin}
      onOpenHoSo={() => show({ kind: 'hoso', back: sc })} onOpenCase={openCase} onLapLai={id => newForm(SEED_DET[id]?.loai || 'bc', id)} />;
  } else if (sc?.kind === 'bcdx') {
    winScreen = <LapBaoCao key={sc.session} session={sc.session} loai={sc.loai} fromSeed={sc.fromSeed} viewed={viewed} onMarkViewed={markViewed}
      onClose={closeWin} onOpenHoSo={() => show({ kind: 'hoso', back: sc })} onTitle={setFormTitle} onOpenCase={openCase}
      onSaveDraft={f => onSaveDraft?.(f)} onSaveSign={f => onSaveSign?.(f)} />;
  }
  const hoSoWindow = win && (
    <KysoWindow title={winTitle} mode={win.mode} rootClass={sc?.kind === 'bcview' ? 'v28-view v18-fit v38-tdfit' : sc?.kind === 'bcdx' ? 'v18-fit' : undefined}
      onMinimize={() => setWin(w => w && { ...w, mode: 'min' })} onMaximize={() => setWin(w => w && { ...w, mode: 'max' })} onClose={closeWin}>
      {winScreen}
    </KysoWindow>
  );

  const content = (
    <div className="kyso-tt">
      <section className="v-detail">
        <div className="t-totrinh tabpane on">
          <section className="card">
            <div className="cb" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Toolbar query={query} onQueryChange={setQuery} status={status} onStatusChange={setStatus}
                advOpen={advOpen} advCount={chips.length} onToggleAdv={() => setAdvOpen(o => !o)} onOpenHoSo={openHoSo} onCreate={create} />
              <FilterChips chips={chips} shown={visible.size} total={listed.length} onRemove={removeField} onClear={() => setAdv({})} />
              <AdvancedFilter open={advOpen} fields={fields} values={adv} shown={visible.size} total={listed.length}
                onChange={setField} onClear={() => setAdv({})} onClose={() => setAdvOpen(false)} />
              <FlowModeSwitch value={mode} onChange={changeMode} />
              {notice && <div className={'note' + (notice.tone ? ' ' + notice.tone : '')}><IconAlert /><span>{notice.text}</span></div>}
              <DocumentTable rows={listed} visible={visible} filtering={chips.length > 0} onOpenRow={openRow} {...rowActions} />
              <div className="muted" style={{ fontSize: 12, lineHeight: '16px' }}>{FOOT_NOTE}</div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );

  return (
    <>
      {hoSoWindow}
      {win?.mode === 'min'
        // Cửa sổ thu nhỏ: tab chỉ còn dải giữ chỗ (bản gốc ẩn khung app Ký số, chèn .v33-ifph)
        ? <KysoPlaceholder title={winTitle} onClose={closeWin} onMaximize={() => setWin(w => w && { ...w, mode: 'max' })} />
        : content}
    </>
  );
}
