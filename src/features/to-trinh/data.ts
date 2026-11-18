import type { AddNewKind, FlowMode, ToTrinhRow } from './types';

/** Hai bản ghi minh họa của app Ký số (v18seed s1, s2) – đúng nội dung hiển thị trong prototype V41. */
export const SAMPLE_ROWS: ToTrinhRow[] = [
  {
    id: 's1',
    so: '1185/BC-PC02',
    loai: 'Báo cáo đề xuất',
    trichYeu: 'Đề xuất xử lý vật chứng xe máy Honda Vision 29H1-123.45',
    nguon: 'Vật chứng / Giám định – Danh sách quyết định',
    canBoTao: 'Trần Thanh Tâm',
    ngayTao: '15/10/2026',
    lanhDaoXuLy: 'Trần Thanh Tùng',
    trangThai: 'Hoàn thành',
    trangThaiTone: 'g',
    thoiDiemTrinh: '15/10/2026 09:12',
  },
  {
    id: 's2',
    so: '1102/TTr-PC02',
    loai: 'Tờ trình',
    trichYeu: 'Tờ trình xin ý kiến chỉ đạo hướng giải quyết vụ án',
    canBoTao: 'Trần Thanh Tâm',
    ngayTao: '01/10/2026',
    lanhDaoXuLy: 'Nguyễn Văn Điềm',
    lyDoTuChoi: 'Chưa đủ căn cứ, đề nghị bổ sung kết quả giám định',
    trangThai: 'Từ chối',
    trangThaiTone: 'r',
    thoiDiemTrinh: '01/10/2026 14:30',
  },
];

/** Ô “Trạng thái” – renderTotrinh (v18) + 3 trạng thái của Phiếu chuyển việc (v22). */
export const STATUS_OPTIONS: string[] = [
  'Đang tạo', 'Đã ký số chờ trình', 'Gửi duyệt', 'Lãnh đạo đã đồng ý', 'Yêu cầu bổ sung', 'Chờ thẩm định',
  'Hoàn tất duyệt', 'Đã phát hành', 'Lãnh đạo từ chối', 'Hoàn thành', 'Từ chối',
];
export const STATUS_OPTIONS_V22: string[] = ['Chờ phê duyệt phân công', 'Đã giao – đang thực hiện', 'Chờ duyệt kết quả'];

/** “Mô phỏng luồng” – capSwitch() của app Ký số. */
export const FLOW_MODES: { value: FlowMode; label: string; title: string; note: string }[] = [
  {
    value: 'pc', label: 'PC, C', title: 'Luồng trên PC, C: Chỉ huy, Lãnh đạo có thể yêu cầu thẩm định',
    note: 'Chỉ huy duyệt; văn bản do TT/PTT ký thì lập thêm BCĐX trình lãnh đạo. Lãnh đạo có thể yêu cầu thẩm định (chọn đơn vị theo cấp).',
  },
  {
    value: 'xa', label: 'Cấp xã · trình cấp trên', title: 'Luồng cấp xã trình cấp trên: Lãnh đạo có thể yêu cầu thẩm định',
    note: 'Trình lên Lãnh đạo cấp trên (có BCĐX trình lãnh đạo); Lãnh đạo có thể yêu cầu thẩm định.',
  },
  {
    value: 'nb', label: 'Cấp xã · ký nội bộ', title: 'Ký nội bộ trong xã: không cần BCĐX trình lãnh đạo',
    note: 'Ký nội bộ trong xã: không lập BCĐX trình lãnh đạo, Trưởng/Phó Trưởng Công an xã ký là hoàn thành.',
  },
];

/** Menu “Thêm mới” (LOAI của app Ký số, V24 chỉ mở Báo cáo đề xuất + Phiếu chuyển việc). */
export const ADD_NEW_ITEMS: { kind: AddNewKind; title: string; desc: string; isNew?: boolean }[] = [
  { kind: 'bc', title: 'Báo cáo đề xuất', desc: 'Biểu mẫu 01 · trình chỉ huy, lãnh đạo phê duyệt văn bản tố tụng' },
  { kind: 'gv', title: 'Phiếu chuyển việc', desc: 'Xin ý kiến cấp trên phân công cán bộ xử lý công việc; báo cáo kết quả trình ngược lên', isNew: true },
];
export const ADD_NEW_DISABLED: { title: string; desc: string }[] = [
  { title: 'Tờ trình', desc: 'Xin ý kiến chỉ đạo hướng giải quyết vụ án, nội dung nghiệp vụ' },
  { title: 'Kế hoạch', desc: 'Kế hoạch điều tra, kế hoạch hỏi cung… trình duyệt' },
  { title: 'Công văn / Đề nghị', desc: 'Gửi cơ quan ngoài (VKS, Tòa án…) kèm danh sách văn bản, tệp' },
];

/** Tiêu đề cột – thứ tự như bảng gốc (cũng là nguồn sinh trường “Lọc nâng cao”). */
export const COLUMNS = [
  'STT', 'Số văn bản', 'Loại văn bản', 'Trích yếu', 'Cán bộ tạo', 'Ngày tạo', 'Lãnh đạo xử lý',
  'Lý do từ chối', 'Trạng thái', 'Thời hạn xử lý', 'Thời điểm trình', 'Thao tác',
] as const;

export const SEARCH_LABEL = 'Số văn bản, trích yếu';
export const STATUS_LABEL = 'Trạng thái';
export const FOOT_NOTE =
  'Báo cáo đề xuất lập từ nút “Báo cáo đề xuất” ở các nhóm biểu mẫu (Quyết định khởi tố, nhập, tách; Vật chứng; Hoạt động điều tra) hiển thị tại đây. Bấm số văn bản để mở form xem.';
export const EMPTY_TEXT = 'Chưa có dữ liệu';
export const EMPTY_FILTER_TEXT = 'Không có bản ghi phù hợp điều kiện lọc';
export const UNIT = 'văn bản';
