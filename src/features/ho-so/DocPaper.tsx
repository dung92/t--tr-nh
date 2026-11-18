import { forwardRef, memo, type ReactNode } from 'react';
import type { HoSoPaper } from './types';

/* Tờ giấy mẫu trong trình xem: draftDoc / issuedDoc / fileDoc của app Ký số.
   Các khoảng trắng giữa thẻ ({'\n    '}) giữ đúng như mã gốc vì “Tìm trong văn bản” trích đoạn văn từ textContent.
   Nội dung tĩnh theo từng văn bản (component được dựng lại theo key) – phần tìm kiếm bọc kết quả bằng <mark> trực tiếp trên DOM. */

/** Dòng kẻ giả nội dung (const lines) */
function Lines() {
  return <><div className="lnl" /><div className="lnl" /><div className="lnl" /><div className="lnl s" /><div className="lnl" /><div className="lnl" /><div className="lnl s" /></>;
}

function Head({ p, gap }: { p: Extract<HoSoPaper, { kind: 'draft' | 'issued' }>; gap: string }) {
  return (
    <>
      <div className="mau">{p.mau}</div>
      <div className="hd">
        <div className="l"><div>{p.donVi[0]}</div><b className="u">{p.donVi[1]}</b><div className="so">{p.so}</div></div>
        {gap}
        <div className="r"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><b className="u">Độc lập - Tự do - Hạnh phúc</b><i>{p.ngay}</i></div>
      </div>
      {'\n    '}
      <h2>{p.tieuDe}</h2><div className="vv">{p.phu}</div><Lines />
    </>
  );
}

interface DocPaperProps {
  paper: HoSoPaper;
  /** Vạch ngắt trang (.v20-pb) khi đang tìm – nối vào cuối tờ giấy như bản gốc */
  children?: ReactNode;
}

export const DocPaper = memo(forwardRef<HTMLDivElement, DocPaperProps>(function DocPaper({ paper: p, children }, ref) {
  if (p.kind === 'file') {
    return (
      <div className="paper bm" ref={ref}>
        <div className="fileb"><div className="ext">{p.ext}</div><b>{p.tenTep}</b><span>{p.trichYeu}</span></div>
        <div style={{ marginTop: 32 }}><Lines /></div>
        {children}
      </div>
    );
  }
  if (p.kind === 'issued') {
    return (
      <div className="paper bm" ref={ref}>
        <Head p={p} gap={'\n    '} />
        <div style={{ textAlign: 'right' }}><span className="stamp-ok">{p.dau}</span></div>
        {children}
      </div>
    );
  }
  return (
    <div className="paper bm" ref={ref}>
      <Head p={p} gap={'\n      '} />
      {'\n    \n    '}
      <div className="sig">
        <div className="sg" />
        <div className="sg"><div className="r">{p.chucVu}</div><div className="sbox">{p.viTriKy}</div><div className="n">{p.nguoiKy}</div></div>
      </div>
      {'\n    '}
      <div className="nhay"><b>Ký nháy:</b>{' '}<span className="muted">{p.kyNhay}</span></div>
      {children}
    </div>
  );
}));
