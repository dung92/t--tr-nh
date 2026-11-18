/** Chế độ “Mô phỏng luồng” (v18cap của app Ký số): PC, C · Cấp xã trình cấp trên · Cấp xã ký nội bộ. */
export type FlowMode = 'pc' | 'xa' | 'nb';

/** Màu badge theo class của app gốc: `bd g` xanh, `bd r` đỏ, `bd n` xám, `bd y` vàng, `bd b` xanh dương, `bd o` cam, `bd t` xanh ngọc. */
export type BadgeTone = 'g' | 'r' | 'n' | 'y' | 'b' | 'o' | 't';

/** Một dòng của bảng Tờ trình / Đề xuất / Thẩm định (ttRows() của app Ký số). */
export interface ToTrinhRow {
  id: string;
  /** Số văn bản, VD “1185/BC-PC02” – bấm để mở văn bản */
  so: string;
  /** Loại văn bản: Báo cáo đề xuất, Tờ trình, Phiếu chuyển việc… */
  loai: string;
  trichYeu: string;
  /** Nhóm biểu mẫu nguồn – hiển thị dòng phụ “Từ: …” dưới trích yếu */
  nguon?: string;
  canBoTao: string;
  /** dd/mm/yyyy */
  ngayTao: string;
  lanhDaoXuLy: string;
  lyDoTuChoi?: string;
  /** Nhãn trạng thái (đúng chữ, dùng cho ô lọc Trạng thái) */
  trangThai: string;
  trangThaiTone: BadgeTone;
  /** VD “Còn 2 ngày” – hiển thị dạng chấm cam như app gốc */
  thoiHanXuLy?: string;
  /** dd/mm/yyyy hh:mm */
  thoiDiemTrinh?: string;
  /** Việc đang chờ người dùng xử lý: tô vạch xanh đầu dòng */
  mine?: boolean;
  /** Hiện nút “Tiến trình xử lý” (BCĐX đang chạy luồng) */
  canTrackProgress?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

/** Loại văn bản được phép tạo từ nút “Thêm mới”. */
export type AddNewKind = 'bc' | 'gv';

/** Trường của bảng “Lọc nâng cao” (sinh từ cột dữ liệu như v23_07112026.js). */
export interface AdvField {
  key: string;
  label: string;
  type: 'text' | 'multi' | 'date';
  options: string[];
}
/** Giá trị lọc nâng cao: text → chuỗi; multi → danh sách lựa chọn; date → [từ ngày, đến ngày] dạng yyyy-mm-dd. */
export type AdvValues = Record<string, string | string[] | undefined>;

export interface Notice {
  text: React.ReactNode;
  /** '' vàng (mặc định), 't' xanh ngọc, 'r' đỏ – theo .note / .note.t / .note.r */
  tone?: '' | 't' | 'r';
}
