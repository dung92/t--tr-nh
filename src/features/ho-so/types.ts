import type { BadgeTone } from '../to-trinh/types';

/** Vụ án đang mở (dòng mô tả dưới tiêu đề). */
export interface HoSoCase {
  ma: string;
  ten: string;
  toiDanh: string;
  /** VD “Văn thư không được xem nội dung hồ sơ” */
  ghiChu?: string;
}

/** Nút của cây hồ sơ (HS_TREE): cấp 1 + các tập con. */
export interface HoSoTreeNode {
  id: string;
  ten: string;
  /** Dòng phụ dưới tên (VD tên bị can của Tập bị can) */
  note?: string;
  kids?: HoSoTreeNode[];
}

/** Một văn bản trong Bộ hồ sơ vụ án (dossierDocs()). */
export interface HoSoDoc {
  id: string;
  name: string;
  /** Số văn bản, “(chưa cấp số)” hoặc “—” */
  so: string;
  /** dd/mm/yyyy */
  ngay?: string;
  /** id nút cây chứa văn bản */
  folder: string;
  loai: string;
  status: string;
  tone: BadgeTone;
  /** Tên tệp đính kèm (tài liệu chứng cứ) */
  file?: string;
  /** Gói trình (VD “BCĐX 2405/BC-PC02”) */
  goi?: string;
  /** Văn bản tố tụng đã cấp số → có trong Mục lục văn bản */
  cap?: boolean;
  /** Người ký (cột Người ký của Mục lục) */
  signer?: string;
}

/** Phần đầu tờ giấy văn bản tố tụng (quốc hiệu, đơn vị, số, ngày, tên văn bản). */
interface PaperHead {
  mau: string;
  /** Cơ quan chủ quản – đơn vị ban hành */
  donVi: [string, string];
  /** VD “Số: ……/QĐ-CSĐT” */
  so: string;
  /** VD “Hà Nội, ngày … tháng … năm 2026” */
  ngay: string;
  /** Tên văn bản (in hoa) */
  tieuDe: string;
  /** Dòng dưới tên: “Dự thảo ngày … · nhóm” / “Văn bản đã ban hành · nhóm” */
  phu: string;
}
/** Nội dung tờ giấy mẫu trong trình xem (draftDoc / issuedDoc / fileDoc của app Ký số). */
export type HoSoPaper =
  | (PaperHead & { kind: 'draft'; chucVu: string; viTriKy: string; nguoiKy: string; kyNhay: string })
  | (PaperHead & { kind: 'issued'; dau: string })
  | { kind: 'file'; ext: string; tenTep: string; trichYeu: string };

/** Một văn bản trong trình xem “Xem hồ sơ báo cáo”. */
export interface HoSoViewerItem {
  /** Trùng id của HoSoDoc tương ứng */
  id: string;
  /** Nhóm trong danh sách bên trái (VD “Tài liệu, chứng cứ”) */
  group: string;
  title: string;
  paper: HoSoPaper;
}

/** Thanh “Tìm trong văn bản” (VER20) – dùng chung, xem ky-so/useDocFind.tsx */
export type { DocFindState } from '../ky-so/useDocFind';

export type HoSoTab = 'ds' | 'ml';
