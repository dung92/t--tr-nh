import { forwardRef, memo, type ReactNode } from 'react';
import { DRAFTS, FILES, LOAI, UNIT_PC, USERS } from './data';
import type { SeedDetail, SeedVersion, SignInfo } from './types';

/* Tờ giấy Biểu mẫu 01 (bm01 + paperHead + sgBlock + kgHtml + kbHtml của app Ký số) – Báo cáo đề xuất / Tờ trình / Kế hoạch theo LOAI.
   Khoảng trắng giữa thẻ ({'\n    '}) giữ đúng như mã gốc vì “Tìm trong văn bản” trích đoạn từ textContent; tránh để hai nút chữ
   liền nhau (normalize() khi tìm sẽ gộp mất nút chữ React đang giữ). */

const nm = (id: string) => USERS[id]?.name ?? '';
const rk = (id: string) => (USERS[id] ? (USERS[id].rank ? USERS[id].rank + ' ' : '') + USERS[id].name : '');
const NL = '\n    ';
/** ph(): chữ gợi ý khi ô còn trống */
const ph = (v: string, t: string): ReactNode => (v ? v : <span className="ph">{t}</span>);

function SignBox({ sig, who }: { sig?: SignInfo; who: string }) {
  if (sig) return <div className="sbox ok">{'✓ ' + (sig.logic ? 'Đã ký số logic' : 'Đã ký số') + ' – ' + nm(who)}<br />{sig.at}</div>;
  return <div className="sbox">{'Vị trí ký số – ' + nm(who)}</div>;
}

/** Nội dung tờ giấy: số, ngày, tài liệu, văn bản dự thảo, nội dung, chữ ký */
export interface Bm01Data {
  loai: string; so: string; hauto: string; ngay: string; pheDuyet: string; nguoiKy: string;
  trichYeu: string; kinhGui: string; noiDung: string; kinhBao: string; docs: string[];
  /** Văn bản tố tụng dự thảo kèm theo (id DRAFTS) */
  drafts?: string[];
  signs: { lap?: SignInfo; chihuy?: SignInfo };
}
/** verPaper: nội dung một phiên bản của bản ghi có sẵn */
export function versionPaper(s: SeedDetail, v: SeedVersion): Bm01Data {
  return {
    loai: s.loai, so: v.so.split('/')[0], hauto: s.hauto, ngay: v.ngay, pheDuyet: s.pheDuyet, nguoiKy: s.nguoiKy,
    trichYeu: s.trichYeu, kinhGui: s.kinhGui, noiDung: v.noiDung || s.noiDung, kinhBao: s.kinhBao, docs: v.docs || s.docs, signs: v.signs || s.signs,
  };
}

export const Bm01Paper = memo(forwardRef<HTMLDivElement, { b: Bm01Data; children?: ReactNode }>(function Bm01Paper({ b, children }, ref) {
  const L = LOAI[b.loai] || LOAI.bc;
  const d = (b.ngay || '').split('/'), pd = USERS[b.pheDuyet]?.pd;
  const docs = b.docs.map(x => FILES[x]?.ty || FILES[x]?.name).filter(Boolean) as string[];
  const drs = (b.drafts || []).filter(x => DRAFTS[x]);
  const kb = (b.kinhBao || '').replace(/[./]+$/, '');
  const docList = docs.length > 0 && <><p>I. Danh sách tài liệu, chứng cứ kèm theo:</p>{docs.map((n, i) => <p key={'d' + i}>{`${i + 1}. ${n}`}</p>)}</>;
  const draftList = drs.length > 0 && <><p>{(docs.length ? 'II' : 'I') + '. Danh sách dự thảo văn bản tố tụng kèm theo:'}</p>
    {drs.map((x, i) => <p key={'r' + x}>{`${i + 1}. ${DRAFTS[x].name} (${DRAFTS[x].mau || 'dự thảo'}, người ký: ${USERS[DRAFTS[x].signer]?.cv}).`}</p>)}</>;
  return (
    <div className="paper bm" ref={ref}>
      <div className="mau">{'Mẫu số: ' + L.mau}</div>
      {NL}
      <div className="hd">
        <div className="l">
          <div>{UNIT_PC[0]}</div><b className="u">{UNIT_PC[1]}</b><div className="so">{`Số: ${b.so || '…'}/${b.hauto || '…'}`}</div>
          {pd && <b className="pd">PHÊ DUYỆT CỦA<br />{pd.split('<br>').map((t, i) => (i ? [<br key={i} />, t] : t))}</b>}
        </div>
        {NL}
        <div className="r"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><b className="u">Độc lập - Tự do - Hạnh phúc</b><i>{`Hà Nội, ngày ${d[0] || '…'} tháng ${d[1] || '…'} năm ${d[2] || '…'}`}</i></div>
      </div>
      {pd ? <>{NL}<div className="pdb"><SignBox sig={b.signs.chihuy} who={b.pheDuyet} /><b>{rk(b.pheDuyet)}</b></div>{NL}</> : NL + NL}
      <h2>{L.title}</h2><div className="ty">{ph(b.trichYeu, 'Nhập nội dung trích yếu')}</div>
      {NL}
      <div className="kg"><span>Kính gửi:</span><div>{b.kinhGui ? b.kinhGui.split('\n').map((t, i) => (i ? [<br key={i} />, t] : t)) : <span className="ph">…</span>}</div></div>
      <div className="nd">
        <p className="ind" style={{ whiteSpace: 'pre-wrap' }}>{ph(b.noiDung, 'Nhập nội dung báo cáo đề xuất')}</p>
        {docList && draftList ? <>{NL}{docList}{NL}{draftList}{NL}</>
          : docList ? <>{NL}{docList}{NL + NL}</>
            : draftList ? <>{NL + NL}{draftList}{NL}</>
              : NL + NL + NL}
        <p>{kb ? kb + './.' : <><span className="ph">Kính báo cáo</span>./.</>}</p>
      </div>
      {NL}
      <div className="sig">
        <div className="sg" />
        <div className="sg"><div className="r">{USERS[b.nguoiKy]?.ky}</div><SignBox sig={b.signs.lap} who={b.nguoiKy} /><div className="n">{rk(b.nguoiKy)}</div></div>
      </div>
      {children}
    </div>
  );
}));

/** Bản bị trả lại / từ chối: dấu chìm “CHỈ XEM” (verPaper) */
export function Watermark({ rejected, children }: { rejected: boolean; children: ReactNode }) {
  return <div className="v18-wmw">{children}<div className="v18-wm">{rejected ? 'BẢN BỊ TỪ CHỐI' : 'BẢN BỊ TRẢ LẠI'} · CHỈ XEM</div></div>;
}
