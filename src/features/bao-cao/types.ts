import type { BadgeTone } from '../to-trinh/types';

/** Chữ ký số trên tờ giấy (thời điểm ký) */
export interface SignInfo { at: string; logic?: boolean }
export type Signs = Partial<Record<'lap' | 'ykien' | 'chihuy' | 'tung', SignInfo>>;

/** Văn bản tố tụng kèm báo cáo (đã ký) */
export interface SeedDraft { name: string; mau: string; signer: string; so: string; ngay: string; nhay: number; kyso: boolean }

/** Một phiên bản của báo cáo / tờ trình (bản bị trả lại vẫn lưu để xem lại) */
export interface SeedVersion {
  v: number;
  so: string;
  ngay: string;
  st: [string, BadgeTone];
  /** Lý do trả lại / từ chối / thu hồi */
  ly?: string;
  by?: string;
  at?: string;
  /** Khác bản hiện hành: tài liệu, nội dung, chữ ký riêng của phiên bản */
  docs?: string[];
  noiDung?: string;
  signs?: Signs;
  /** Phiên bản hiện hành */
  cur?: boolean;
}

/** Chi tiết bản ghi có sẵn (SEED_DET của app Ký số) */
export interface SeedDetail {
  loai: string;
  hauto: string;
  ngay: string;
  nguoiKy: string;
  pheDuyet: string;
  yk: string;
  ld: string;
  /** Nhóm biểu mẫu lập ra báo cáo (GROUPS) */
  src: string | null;
  kinhGui: string;
  trichYeu: string;
  noiDung: string;
  kinhBao: string;
  docs: string[];
  signs: Signs;
  drafts: SeedDraft[];
  versions: SeedVersion[];
  /** Thanh bước: [tên, trạng thái, lớp (done/rej…), thời điểm] */
  steps: [string, string, string, string][];
  /** Tiến trình xử lý: [giờ, ngày, việc, nội dung, người thực hiện] */
  hist: [string, string, string, string, string][];
}

/** Dòng ở danh sách Tờ trình / Đề xuất (SEED_TT) */
export interface SeedRow { id: string; so: string; ngay: string; ty: string; loai: string; src: string | null; lap: string; ld: string; st: [string, BadgeTone]; trinh: string; lydo?: string }

export interface UserInfo { name: string; ma: string; rank: string; cv: string; ky?: string; pd?: string; role: string; av?: string }

/** Văn bản tố tụng dự thảo (DRAFTS) */
export interface DraftInfo { name: string; mau: string; signer: string; ngay: string; g: string; hauto: string }

/** Nội dung form lập báo cáo đề xuất / tờ trình (S.form của app Ký số) */
export interface BcForm {
  loai: string;
  src: string | null;
  so: string;
  ngay: string;
  hauto: string;
  nguoiKy: string;
  pheDuyet: string;
  /** Người cần xin ý kiến ('' = trình trực tiếp) */
  yk: string;
  /** Người ký nháy mặc định cho văn bản dự thảo */
  nhayDef: string;
  /** Người ký nháy riêng từng văn bản (để trống = theo mặc định) */
  nhayBy?: Record<string, string>;
  /** Cho phép Văn thư xem nội dung hồ sơ */
  vtView: boolean;
  kinhGui: string;
  trichYeu: string;
  noiDung: string;
  kinhBao: string;
  /** Tài liệu, chứng cứ (TLM / tệp tải lên) */
  docs: string[];
  /** Văn bản tố tụng dự thảo kèm theo */
  drafts: string[];
  /** Văn bản khác kèm từ hồ sơ */
  att: string[];
  signs: Record<string, never>;
  /** Lập lại từ bản bị từ chối */
  prev?: { so: string };
}
export interface LoaiInfo { t: string; h: string; mau: string; title: string; d: string }
export interface FileInfo { name: string; ty: string; ngay: string; size: string }
