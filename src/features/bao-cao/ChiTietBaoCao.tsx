import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SAMPLE_CASE, SAMPLE_DOCS } from '../ho-so/data';
import { DocPaper } from '../ho-so/DocPaper';
import type { HoSoPaper } from '../ho-so/types';
import { SAMPLE_VIEWER_ITEMS } from '../ho-so/viewer-data';
import { KysoLayerContext } from '../ky-so';
import {
  IconAlert, IconArrowLeft, IconCheck, IconChevronLeft, IconClip, IconClock, IconDownload, IconEye, IconFile, IconFileText, IconFlag,
  IconFolder, IconLink, IconPlus, IconSearch, IconSign, IconUserCircle,
} from '../ky-so/icons';
import { Card, FieldView, LineStepper, PageTitle, SplitPane, usePaperZoom, useToast, ZoomControl, type ZoomMode } from '../ky-so/parts';
import { DOC_FIND_0, useDocFind, type DocFindState } from '../ky-so/useDocFind';
import { Bm01Paper, versionPaper, Watermark, type Bm01Data } from './Bm01Paper';
import { FILES, GROUPS, LOAI, SEED_DET, SEED_TT, USERS } from './data';
import { HoSoTreePanel, treeIndex } from './HoSoTreePanel';
import type { SeedDetail } from './types';

const nm = (id: string) => USERS[id]?.name ?? '';
const full = (id: string) => (USERS[id] ? USERS[id].name + (USERS[id].ma ? ' (' + USERS[id].ma + ')' : '') : '');
const extOf = (n: string) => (n.split('.').pop() || '').toLowerCase();
const IDX = treeIndex();

/** Màn chi tiết có dữ liệu cho bản ghi này không (bản ghi có sẵn s1, s2) */
export const hasChiTiet = (id: string) => !!SEED_DET[id];
const curVersion = (s: SeedDetail) => s.versions.find(v => v.cur) || s.versions[s.versions.length - 1];
/** Chữ trên thanh tiêu đề cửa sổ (textContent của <h1>: tên + số + nhãn trạng thái) */
export function chiTietTitle(id: string) {
  const s = SEED_DET[id]; if (!s) return '';
  const cv = curVersion(s), row = SEED_TT.find(r => r.id === id), badge = row?.st || cv.st;
  return `${(LOAI[s.loai] || LOAI.bc).t} ${cv.so} ${badge[0]}`;
}
/** Tờ giấy của bản ghi trong hồ sơ (seedDocB): nội dung bản ghi, số theo phiên bản hiện hành */
function seedPaper(s: SeedDetail): Bm01Data {
  return { ...versionPaper(s, curVersion(s)), ngay: s.ngay, docs: s.docs, noiDung: s.noiDung, signs: s.signs };
}
const filePaper = (id: string): HoSoPaper => ({ kind: 'file', ext: extOf(FILES[id].name).toUpperCase(), tenTep: FILES[id].name, trichYeu: FILES[id].ty });

/** anyDoc(id): tờ giấy của văn bản bất kỳ trong hồ sơ */
function AnyDoc({ id, paperRef }: { id: string; paperRef: React.Ref<HTMLDivElement> }) {
  const it = SAMPLE_VIEWER_ITEMS.find(x => x.id === id);
  if (it) return <DocPaper key={id} ref={paperRef} paper={it.paper} />;
  if (SEED_DET[id]) return <Bm01Paper key={id} ref={paperRef} b={seedPaper(SEED_DET[id])} />;
  return <div className="v18-ph"><div>Không có nội dung xem trước</div></div>;
}
/** docMeta(id): tiêu đề + dòng phụ ở khung xem tài liệu hồ sơ */
function docMeta(id: string) {
  const f = FILES[id];
  if (f) return { t: f.name, s: [f.ty, f.size, f.ngay].filter(Boolean).join(' · '), path: '' };
  const d = SAMPLE_DOCS.find(x => x.id === id);
  if (d) return { t: d.name, s: [d.so && d.so !== '—' ? d.so : '', d.ngay, d.status].filter(Boolean).join(' · '), path: IDX.path(d.folder) };
  return { t: id, s: '', path: '' };
}

type Tab = 'info' | 'docs' | 'hist';
const TAB_LABEL: Record<Tab, string> = { info: 'Thông tin', docs: 'Tài liệu', hist: 'Lịch sử & tiến trình' };
interface ViewState { tab: Tab; hs: boolean; hv: string | null; sv: number | null; doc: string | null; zoom: ZoomMode; zoomHv: ZoomMode; find: DocFindState }
/* Như bản gốc (V20.tab, V28, SV, ZM là biến toàn cục của app Ký số): tab, phiên bản, tệp đang xem, mức phóng… còn nguyên
   khi sang “Hồ sơ điện tử” rồi quay lại, hoặc mở lại cùng bản ghi. */
const VIEW_STATE = new Map<string, ViewState>();
const initState = (id: string): ViewState => VIEW_STATE.get(id) || { tab: 'info', hs: false, hv: null, sv: null, doc: null, zoom: 'fit', zoomHv: 'fit', find: DOC_FIND_0 };

export interface ChiTietBaoCaoProps {
  /** Bản ghi (s1, s2 – SEED_DET) */
  id: string;
  /** Văn bản hồ sơ đã xem (dùng chung với Bộ hồ sơ vụ án) */
  viewed: ReadonlySet<string>;
  onMarkViewed: (id: string) => void;
  /** Quay lại / Đóng → về danh sách */
  onClose: () => void;
  /** “Hồ sơ điện tử” → trang Bộ hồ sơ vụ án (có nút quay lại báo cáo này) */
  onOpenHoSo: () => void;
  /** Bản bị từ chối: “Lập lại tờ trình / báo cáo” */
  onLapLai?: (id: string) => void;
  onOpenCase?: () => void;
  /** Vai trò người đang đăng nhập (dòng gợi ý cuối trang) */
  role?: string;
}

/**
 * Chi tiết báo cáo đề xuất / tờ trình có sẵn – mở từ số văn bản hoặc nút mắt ở bảng Tờ trình / Đề xuất / Thẩm định.
 * Nguồn: PAGES.bcview + verPaper + histCard của app Ký số (V18), tab hoá các thẻ + Hồ sơ điện tử + tab Hồ sơ vụ án (V28),
 * thanh nút V35, thanh bước dynSteps, khung chia đôi, thu phóng và tìm trong văn bản (VER20).
 */
export function ChiTietBaoCao({ id, viewed, onMarkViewed, onClose, onOpenHoSo, onLapLai, onOpenCase, role = 'Cán bộ lập BCĐX' }: ChiTietBaoCaoProps) {
  const s = SEED_DET[id];
  const [st, setSt] = useState<ViewState>(() => initState(id));
  const set = (p: Partial<ViewState>) => setSt(x => ({ ...x, ...p }));
  useEffect(() => { VIEW_STATE.set(id, st); }, [id, st]);
  const layer = useContext(KysoLayerContext);
  const toast = useToast();
  const pvDocRef = useRef<HTMLDivElement>(null), paperRef = useRef<HTMLDivElement>(null);
  const hvDocRef = useRef<HTMLDivElement>(null), hvPaperRef = useRef<HTMLDivElement>(null);

  const L = LOAI[s.loai] || LOAI.bc, lt = L.t.toLowerCase();
  const vs = s.versions, curV = curVersion(s), sel = vs.find(v => v.v === st.sv) || curV, prev = vs.filter(v => !v.cur);
  const row = SEED_TT.find(r => r.id === id), rej = curV.st[0] === 'Từ chối';
  const seenN = SAMPLE_DOCS.filter(d => viewed.has(d.id)).length;
  const hsShown = st.hs && !!st.hv;

  // Thu phóng: khung xem báo cáo (v18s) và khung xem tài liệu hồ sơ (v28)
  const zoom = usePaperZoom(pvDocRef, paperRef, st.zoom, m => set({ zoom: m }), [sel.v, st.doc, hsShown]);
  const zoomHv = usePaperZoom(hvDocRef, hvPaperRef, st.zoomHv, m => set({ zoomHv: m }), [st.hv]);
  const finder = useDocFind({ hostRef: pvDocRef, paperRef, docKey: sel.v + '|' + (st.doc || ''), find: st.find, onFindChange: f => set({ find: f }) });

  // Ctrl+F: mở thanh tìm ở khung xem (vfHosts của VER20)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); finder.openFind(true); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const download = () => toast.show('Tải xuống tệp (mô phỏng)');
  // “Hồ sơ điện tử”: như bản gốc, quay lại thì tab Hồ sơ vụ án đã đóng (tab, phiên bản, mức phóng… giữ nguyên)
  const openHoSo = () => { VIEW_STATE.set(id, { ...st, hs: false, hv: null }); onOpenHoSo(); };
  const viewVersion = (v: number) => set({ sv: v, doc: null });
  const viewHs = (hid: string) => { onMarkViewed(hid); set({ hv: hid }); };
  const tabs: Tab[] = ['info', 'docs', 'hist'];

  // ---- cột trái: các thẻ, gom theo tab (v28Tabs) ----
  const infoCard = (
    <Card icon={<IconFile />} title={'Thông tin ' + lt} sub="Đã ký số, chỉ xem">
      <div className="grid d">
        <FieldView label="Ngày văn bản" value={curV.ngay} />
        <FieldView label="Số văn bản" value={curV.so.split('/')[0]} />
        <FieldView label="Hậu tố văn bản" value={s.hauto} />
        <FieldView label="Người ký văn bản" value={full(s.nguoiKy)} />
        <FieldView label="Phê duyệt của Chỉ huy" value={full(s.pheDuyet)} span="s2" />
        <FieldView label="Lãnh đạo xử lý" value={full(s.ld)} span="s2" />
        {prev.length > 0 && (
          <div className="f vf ro call v18-verf"><span className="fl">Phiên bản trước bị trả lại</span>
            <div className="v">{prev.map(v => <button key={v.v} type="button" className="lnk" data-act="v18sv" data-v={v.v} onClick={() => viewVersion(v.v)}>{`${v.so} · ${v.st[0]} ${v.at || ''}`}</button>)}</div>
          </div>
        )}
        <FieldView label="Kính gửi" value={s.kinhGui} span="s4" tall />
        <FieldView label="Trích yếu" value={s.trichYeu} span="s4" />
        <FieldView label="Nội dung" value={s.noiDung} span="s4" tall />
        {curV.ly && <FieldView label={'Lý do từ chối (' + nm(curV.by || '') + ')'} value={curV.ly} span="s4" cls="bad" />}
      </div>
    </Card>
  );
  const draftsCard = s.drafts.length > 0 && (
    <Card icon={<IconFileText />} title="Văn bản tố tụng kèm theo" meta={s.drafts.length + ' văn bản'}>
      <div className="tw"><table className="tb">
        <thead><tr><th style={{ width: 56 }}>STT</th><th>Tên văn bản</th><th>Người ký</th><th>Tình trạng ký</th></tr></thead>
        <tbody>{s.drafts.map((d, i) => (
          <tr key={i}>
            <td>{i + 1}</td>
            <td>{d.name}<span className="sub">{d.mau}</span></td>
            <td className="nw">{nm(d.signer)}<span className="sub">{USERS[d.signer]?.role}</span></td>
            <td><div className="v18-sg"><span className="bd sm t"><IconCheck />{' Ký nháy ' + d.nhay}</span><span className="bd sm g"><IconCheck />{' Đã ký số'}</span><span className="bd sm b">{'Số ' + d.so}</span></div></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
  const docsCard = (
    <Card icon={<IconClip />} title="Tài liệu, chứng cứ kèm theo" meta={s.docs.length + ' tệp'}>
      <div className="tw"><table className="tb">
        <thead><tr><th style={{ width: 56 }}>STT</th><th>Tên tệp</th><th style={{ width: 100 }}>Dung lượng</th><th style={{ width: 96 }}>Thao tác</th></tr></thead>
        <tbody>{s.docs.map((d, i) => (
          <tr key={d}>
            <td>{i + 1}</td>
            <td><button type="button" className="lnk v18-fn" data-act="v18svdoc" data-id={d} onClick={() => set({ doc: d })}><span className={'v18-ext ' + extOf(FILES[d].name)}>{extOf(FILES[d].name).toUpperCase()}</span><b>{FILES[d].name}</b></button></td>
            <td className="nw">{FILES[d].size}</td>
            <td><div className="acts">
              <button type="button" className="icb" data-act="v18svdoc" data-id={d} title="Xem" onClick={() => set({ doc: d })}><IconEye /></button>
              <button type="button" className="icb" data-act="dl" title="Tải về" onClick={download}><IconDownload /></button>
            </div></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
  const histCard = (
    <Card icon={<IconClock />} title="Lịch sử báo cáo đề xuất" sub="Các phiên bản đã lập, kể cả bản bị trả lại (đã ký số, chỉ xem)" meta={vs.length + ' phiên bản'}>
      <div className="tw"><table className="tb v18-ver">
        <thead><tr><th style={{ width: 84 }}>Phiên bản</th><th>Số văn bản</th><th>Ngày lập</th><th>Trạng thái</th><th>Lý do trả lại / từ chối / thu hồi</th><th>Người xử lý</th><th style={{ width: 72 }}>Xem</th></tr></thead>
        <tbody>{vs.map(v => (
          <tr key={v.v} className={v === sel ? 'cur' : ''}>
            <td>{'Bản ' + v.v}{v.cur && <>{' '}<span className="bd sm t">Hiện hành</span></>}</td>
            <td className="nw"><button type="button" className="lnk" data-act="v18sv" data-v={v.v} onClick={() => viewVersion(v.v)}>{v.so}</button></td>
            <td className="nw">{v.ngay}</td>
            <td><span className={'bd sm ' + v.st[1]}>{v.st[0]}</span></td>
            <td style={{ minWidth: 200 }}>{v.ly ? <span className="why">{v.ly}</span> : '—'}</td>
            <td className="nw">{v.by ? nm(v.by) : '—'}<span className="sub">{v.at || ''}</span></td>
            <td><button type="button" className="icb" data-act="v18sv" data-v={v.v} title="Xem phiên bản này" onClick={() => viewVersion(v.v)}><IconEye /></button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
  const procCard = (
    <Card icon={<IconFlag />} title="Tiến trình xử lý" sub="Người thực hiện, thời gian của từng mốc">
      <div className="tl">{s.hist.map((x, i) => (
        <div key={i} className="tl-r">
          <div className="tl-t">{x[0]}<span>{x[1]}</span></div>
          <div className="tl-d"><i /></div>
          <div className="tl-c"><b>{x[2]}</b>{x[3] && <p>{x[3]}</p>}<small>{'Người thực hiện: ' + x[4]}</small></div>
        </div>
      ))}</div>
    </Card>
  );
  const panes: Record<Tab, React.ReactNode> = { info: <>{infoCard}{draftsCard}</>, docs: docsCard, hist: <>{histCard}{procCard}</> };
  const left = (
    <section className={'card bct v20-bct v28-bct' + (st.hs ? ' v28-hs-on' : '')}>
      <div className="tabs"><div className="scroller">
        {tabs.map(k => (
          <div key={k} className={'tab ' + (k === st.tab && !st.hs ? 'on' : '')} data-act={'v28vt:' + k} role="tab" aria-selected={k === st.tab && !st.hs} tabIndex={0}
            onClick={() => set({ tab: k, hs: false, hv: null })} onKeyDown={e => { if (e.key === 'Enter') set({ tab: k, hs: false, hv: null }); }}>
            <span className="lf">{TAB_LABEL[k]}</span><span className="lm">{TAB_LABEL[k]}</span><span className="ls2">{TAB_LABEL[k]}</span>
          </div>
        ))}
        <div className={'tab v28-hst' + (st.hs ? ' on' : '')} data-act="v28tab" title="Mở lại hồ sơ vụ án để theo dõi và ra quyết định" role="tab" aria-selected={st.hs} tabIndex={0}
          onClick={() => set({ hs: true })} onKeyDown={e => { if (e.key === 'Enter') set({ hs: true }); }}>
          <IconFolder /><span>Hồ sơ vụ án</span><span className="n">{SAMPLE_DOCS.length}</span>
        </div>
      </div></div>
      <div className="bct-b">
        {tabs.map(k => <div key={k} className="bcp" data-pane={k} hidden={st.hs || k !== st.tab}>{panes[k]}</div>)}
        {st.hs && <div className="bcp v28-hsp ro"><HoSoTreePanel current={st.hv} viewed={viewed} onView={viewHs} onOpenHoSo={openHoSo} /></div>}
      </div>
    </section>
  );

  // ---- cột phải: xem báo cáo (phiên bản đang chọn / tệp đính kèm) + xem tài liệu hồ sơ (V28) ----
  const doc = st.doc ? FILES[st.doc] : null;
  const preview = (
    <section className="card pv v18-pv">
      <div className="ch">
        {doc && <button type="button" className="icb" data-act="v18svback" title="Quay lại văn bản" onClick={() => set({ doc: null })}><IconChevronLeft /></button>}
        <div className="t">
          <b>{doc ? doc.name : `${L.t} ${sel.so} · Bản ${sel.v}`}</b>
          <span>{doc ? doc.size : sel.cur ? 'Phiên bản hiện hành' : 'Phiên bản đã bị ' + (sel.st[0] === 'Từ chối' ? 'từ chối' : 'trả lại') + ' – lưu để xem lại'}</span>
        </div>
        <div className="tools">
          <ZoomControl name="v18s" zoom={zoom} />
          <button type="button" className="icb" data-act="v20find" title="Tìm trong văn bản (Ctrl+F)" aria-label="Tìm trong văn bản" onClick={finder.toggle}><IconSearch /></button>
          {!doc && <button type="button" className="icb" data-act="dl" title="Tải về" onClick={download}><IconDownload /></button>}
        </div>
      </div>
      {finder.bar}
      <div className="pv-doc v18sWrap" data-w="794" ref={pvDocRef}>
        {doc
          ? <DocPaper key={'f' + st.doc} ref={paperRef} paper={filePaper(st.doc!)}>{finder.markers}</DocPaper>
          : sel.cur
            ? <Bm01Paper key={'v' + sel.v} ref={paperRef} b={versionPaper(s, sel)}>{finder.markers}</Bm01Paper>
            : <Watermark rejected={sel.st[0] === 'Từ chối'}><Bm01Paper key={'v' + sel.v} ref={paperRef} b={versionPaper(s, sel)}>{finder.markers}</Bm01Paper></Watermark>}
      </div>
    </section>
  );
  const hvMeta = hsShown ? docMeta(st.hv!) : null;
  const hsPreview = hsShown && hvMeta && (
    <section className="card pv v28-pv">
      <div className="v28-pvx"><IconFolder /><span>Đang xem tài liệu hồ sơ – không phải báo cáo đề xuất</span>
        <button type="button" className="btn sm ol" data-act="v28hvx" onClick={() => set({ hv: null })}><IconChevronLeft />{' Quay lại báo cáo'}</button></div>
      <div className="ch">
        <div className="t"><b title={hvMeta.t}>{hvMeta.t}</b><span>{[hvMeta.s, hvMeta.path].filter(Boolean).join(' · ')}</span></div>
        <div className="tools"><ZoomControl name="v28" zoom={zoomHv} /></div>
      </div>
      <div className="pv-doc v28Wrap" data-w="794" ref={hvDocRef}><AnyDoc id={st.hv!} paperRef={hvPaperRef} /></div>
    </section>
  );

  const lapLaiLabel = 'Lập lại ' + lt;
  return (
    <>
      <div className="emb-back"><button type="button" data-emb="back" onClick={onClose}>← Danh sách Tờ trình / Đề xuất / Thẩm định</button><span>Đang thao tác trong luồng ký số</span></div>
      <PageTitle title={`${L.t} ${curV.so}`} badge={row?.st || curV.st}
        desc={<>
          <a href="#" className="v20-case" title={'Mở Thông tin vụ án ' + SAMPLE_CASE.ma} onClick={e => { e.preventDefault(); onOpenCase?.(); }}><IconLink />{'Vụ án ' + SAMPLE_CASE.ma}</a>
          {' · ' + SAMPLE_CASE.ten + ' · ' + SAMPLE_CASE.toiDanh + (s.src && GROUPS[s.src] ? ' · Lập từ: ' + GROUPS[s.src] : '')}
        </>}
        right={<>
          <button type="button" className="btn v28-hsb" data-act="v28hoso" title="Mở Bộ hồ sơ vụ án (giữ nguyên chức năng nút ở danh sách); “Quay lại” trở về báo cáo này" onClick={openHoSo}>
            <IconFolder /><span>Hồ sơ điện tử</span><span className="n">{SAMPLE_DOCS.length}</span>
          </button>
          <div className="v35-tb" role="toolbar" aria-label="Thao tác văn bản">
            <button type="button" className="" data-v35="0" onClick={onClose}><IconArrowLeft />Quay lại</button>
            {rej && <button type="button" className="pri" data-v35="1" onClick={() => onLapLai?.(id)}><IconSign />{lapLaiLabel}</button>}
          </div>
        </>} />
      <LineStepper steps={s.steps.map(([t, sx, c, tm]) => ({ t, s: sx, c, tm }))} fin />
      {rej && (
        <div className="banner"><IconAlert /><span>{`${L.t} đã bị từ chối và đã ký số nên không sửa được. Bấm `}<b>{lapLaiLabel}</b>{' để tạo phiên bản mới từ nội dung bản này; bản cũ được lưu trong “Lịch sử báo cáo đề xuất”.'}</span></div>
      )}
      <SplitPane name="bcview" def={52} left={left} right={<>{preview}{hsPreview}</>} rightClassName={hsShown ? 'v28-pvon' : undefined} />
      <div className="footbar v28-fb">
        <span className="v28-hint"><IconUserCircle />{' Đồng chí xử lý với vai trò '}<b>{role}</b>{' · đã xem '}<b>{seenN}</b>{'/' + SAMPLE_DOCS.length + ' văn bản hồ sơ'}</span>
        <div className="r">
          <button type="button" className="btn w160" data-act="nav:detail/totrinh" onClick={onClose}>Đóng</button>
          {rej && <button type="button" className="btn pri w160" data-act="v18lapseed" onClick={() => onLapLai?.(id)}><IconPlus />{' ' + lapLaiLabel}</button>}
        </div>
      </div>
      {layer ? createPortal(toast.node, layer) : toast.node}
    </>
  );
}

