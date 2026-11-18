/* Icon giữ nguyên mã SVG của prototype.
   - Nhóm app Ký số: <svg class="i"> – nét vẽ lấy từ CSS (svg.i).
   - Nhóm V23 (thanh công cụ chuẩn): thuộc tính stroke khai báo ngay trên thẻ. */

const S7 = (d: React.ReactNode) => function Icon() { return <svg className="i" viewBox="0 0 24 24">{d}</svg>; };
const V23 = (d: React.ReactNode) => function Icon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
};

export const IconFolder = S7(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />);
export const IconPlus = S7(<path d="M5 12h14M12 5v14" />);
export const IconDown = S7(<path d="m6 9 6 6 6-6" />);
export const IconEye = S7(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IconFlag = S7(<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />);
export const IconPen = S7(<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z" />);
export const IconTrash = S7(<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />);
export const IconAlert = S7(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>);

export const IconSearch = V23(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconFilter = V23(<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />);
export const IconX = V23(<path d="M18 6 6 18M6 6l12 12" />);
