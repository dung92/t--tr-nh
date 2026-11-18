/* Icon giữ nguyên mã SVG của prototype.
   - App Ký số: <svg class="i"> (nét vẽ lấy từ CSS svg.i).
   - Thanh công cụ v35 (Quay lại): thuộc tính khai báo trực tiếp, nét 2.
   - Cửa sổ V33: nét 1.8, kích thước đặt bằng style như hàm ic(n, size) của v33_09112026.js. */

const S7 = (d: React.ReactNode) => function Icon() { return <svg className="i" viewBox="0 0 24 24">{d}</svg>; };

export const IconCopy = S7(<><rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>);
export const IconFolder = S7(<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />);
export const IconBook = S7(<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />);
export const IconEye = S7(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IconDownload = S7(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />);
export const IconLink = S7(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>);
export const IconChevronUp = S7(<path d="m18 15-6-6-6 6" />);
export const IconChevronDown = S7(<path d="m6 9 6 6 6-6" />);
export const IconX = S7(<path d="M18 6 6 18M6 6l12 12" />);
export const IconFile = S7(<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></>);
export const IconSearch = S7(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const IconList = S7(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);
export const IconCheck = S7(<path d="M20 6 9 17l-5-5" />);
export const IconFileText = S7(<><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8" /></>);
export const IconClip = S7(<path d="m15 7-6.5 6.5a1.5 1.5 0 0 0 2.1 2.1L17 9.2a3 3 0 0 0-4.2-4.2L6.3 11.5a4.5 4.5 0 0 0 6.4 6.4L19 11.6" />);
export const IconClock = S7(<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>);
export const IconFlag = S7(<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" />);
export const IconGrip = S7(<path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01" strokeWidth="3" />);
export const IconUserCircle = S7(<><circle cx="12" cy="12" r="10" /><circle cx="12" cy="10" r="3" /><path d="M7 20.66V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.66" /></>);
export const IconChevronLeft = S7(<path d="m15 18-6-6 6-6" />);
export const IconChevronRight = S7(<path d="m9 18 6-6-6-6" />);
export const IconExpandBox = S7(<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />);
export const IconChevsUp = S7(<path d="m17 11-5-5-5 5M17 18l-5-5-5 5" />);
export const IconChevsDown = S7(<path d="m7 6 5 5 5-5M7 13l5 5 5-5" />);
export const IconAlert = S7(<><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4M12 17h.01" /></>);
export const IconPlus = S7(<path d="M5 12h14M12 5v14" />);
export const IconMinus = S7(<path d="M5 12h14" />);
export const IconInfo = S7(<><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></>);
export const IconUpload = S7(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />);
export const IconTrash = S7(<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />);
export const IconShare = S7(<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></>);
export const IconEyeOff = S7(<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20M14.12 14.12a3 3 0 1 1-4.24-4.24" />);
export const IconLayL = S7(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M15 4v16" /></>);
export const IconLayC = S7(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M12 4v16" /></>);
export const IconLayR = S7(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></>);
export const IconMaxS7 = S7(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
export const IconClipboard = S7(<><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01" /></>);

/* Thanh công cụ V35 (Quay lại / Lưu & ký số…): thuộc tính khai báo trực tiếp, 16×16, nét 2 */
const V35 = (d: React.ReactNode) => function Icon() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
};
export const IconSign = V35(<><path d="M3 17c3 0 4-6 7-6s2 6 5 6 3-3 6-3" /><path d="M3 21h18" /></>);
export const IconExpandV35 = V35(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
export const IconShrinkV35 = V35(<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />);
export const IconSave = V35(<><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></>);

/* Trình xem V19 (ic19): class "i" + thuộc tính nét khai báo trực tiếp */
const V19 = (d: React.ReactNode) => function Icon() {
  return <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
};
export const IconV19List = V19(<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />);
export const IconZoomOut = V19(<path d="M5 12h14" />);
export const IconZoomIn = V19(<path d="M12 5v14M5 12h14" />);
export const IconPrint = V19(<><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></>);
export const IconExpand = V19(<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />);
export const IconShrink = V19(<path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />);

/* Mũi tên chuyển văn bản hai bên trình xem (V24) */
const V24 = (d: React.ReactNode) => function Icon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
};
export const IconArrowPrev = V24(<path d="m15 18-6-6 6-6" />);
export const IconArrowNext = V24(<path d="m9 18 6-6-6-6" />);

export function IconArrowLeft() {
  return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
}

const V33 = (d: React.ReactNode) => function Icon({ size = 16 }: { size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flex: 'none' }} aria-hidden="true">{d}</svg>;
};
export const IconDoc = V33(<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></>);
export const IconMin = V33(<path d="M5 12h14" />);
export const IconMax = V33(<rect x="5" y="5" width="14" height="14" rx="1" />);
export const IconClose = V33(<path d="M6 6l12 12M18 6 6 18" />);
