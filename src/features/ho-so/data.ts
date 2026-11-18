/* Dữ liệu minh họa của màn “Bộ hồ sơ vụ án” – đúng nội dung prototype V41 (dossierDocs() + HS_TREE của app Ký số, vụ án mẫu VA26-000001). */
import type { HoSoCase, HoSoDoc, HoSoTreeNode } from './types';

export const SAMPLE_CASE: HoSoCase = {
  ma: 'VA26-000001',
  ten: 'Vụ trộm cắp tài sản xảy ra ngày 01/11/2026 tại 90 đường Giáp Hải, xã Bát Tràng, thành phố Hà Nội',
  toiDanh: 'Trộm cắp tài sản',
  ghiChu: 'Văn thư không được xem nội dung hồ sơ',
};

/** HS_TREE – cây hồ sơ (cấp 1 + tập con). */
export const HS_TREE: HoSoTreeNode[] = [
  { id: 'hstt', ten: 'Hồ sơ tố tụng', kids: [
    { id: 't_chung', ten: 'Tập tố tụng chung' },
    { id: 't_bc', ten: 'Tập bị can', note: 'Nguyễn Văn An' },
    { id: 't_bpdt', ten: 'Tập biện pháp điều tra' },
    { id: 't_cc', ten: 'Tài liệu chứng cứ' },
  ] },
  { id: 'ak', ten: 'Hồ sơ nghiệp vụ (AK)', note: 'Báo cáo đề xuất, tờ trình, kết quả thẩm định' },
  { id: 'khac', ten: 'Văn bản khác' },
];

/** 26 văn bản của hồ sơ (thứ tự như danh sách gốc). cap = văn bản tố tụng đã cấp số → có trong Mục lục. */
export const SAMPLE_DOCS: HoSoDoc[] = [
  { id: "qd5", name: "Quyết định phân công bổ sung Phó Thủ trưởng Cơ quan điều tra tiến hành điều tra vụ án hình sự", so: "(chưa cấp số)", ngay: "03/11/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "qd6", name: "Quyết định nhập vụ án hình sự", so: "(chưa cấp số)", ngay: "03/11/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "vc3", name: "Quyết định trưng cầu người phiên dịch", so: "(chưa cấp số)", ngay: "02/11/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "vc4", name: "Công văn đề nghị Hội đồng định giá tài sản xác định giá trị xe máy 29H1-123.45", so: "(chưa cấp số)", ngay: "02/11/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "hd8", name: "Kế hoạch hỏi cung bị can Nguyễn Văn An", so: "(chưa cấp số)", ngay: "03/11/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "hd9", name: "Lệnh trích xuất bị can Nguyễn Văn An (lần 2)", so: "(chưa cấp số)", ngay: "03/11/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Dự thảo", tone: "y" },
  { id: "qd1", name: "Quyết định thay đổi Quyết định khởi tố vụ án hình sự", so: "120/QĐ-ĐTTH", ngay: "10/01/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thủ trưởng CQĐT" },
  { id: "qd2", name: "Quyết định bổ sung Quyết định khởi tố vụ án hình sự", so: "121/QĐ-ĐTTH", ngay: "11/02/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thủ trưởng CQĐT" },
  { id: "qd3", name: "Quyết định hủy bỏ Quyết định khởi tố vụ án hình sự", so: "122/QĐ-ĐTTH", ngay: "12/03/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Phó Thủ trưởng CQĐT" },
  { id: "qd4", name: "Quyết định tách vụ án hình sự", so: "123/QĐ-ĐTTH", ngay: "31/10/2026", folder: "t_chung", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Phó Thủ trưởng CQĐT" },
  { id: "vc1", name: "Quyết định xử lý vật chứng", so: "120/QĐ-ĐTTH", ngay: "10/01/2026", folder: "t_bpdt", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thủ trưởng CQĐT" },
  { id: "vc2", name: "Quyết định trưng cầu giám định số khung, số máy", so: "121/QĐ-ĐTTH", ngay: "11/02/2026", folder: "t_bpdt", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thủ trưởng CQĐT" },
  { id: "hd0", name: "Quyết định tạm giữ tài sản, đồ vật, tài liệu", so: "09/QĐ-ĐTTH", ngay: "02/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Đại úy Đỗ Minh Hùng" },
  { id: "hd1", name: "Giấy triệu tập bị can", so: "15/GTT-ĐTTH", ngay: "05/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Đại úy Đỗ Minh Hùng" },
  { id: "hd2", name: "Phiếu yêu cầu trích xuất", so: "16/PYC-ĐTTH", ngay: "05/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thượng úy Vũ Quang Khải" },
  { id: "hd3", name: "Lệnh trích xuất và áp giải", so: "20/LTX-ĐTTH", ngay: "05/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Đại úy Đỗ Minh Hùng" },
  { id: "hd4", name: "Quyết định áp giải", so: "18/QĐ-ĐTTH", ngay: "05/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g", cap: true, signer: "Thượng úy Vũ Quang Khải" },
  { id: "hd5", name: "Biên bản áp giải", so: "—", ngay: "06/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g" },
  { id: "hd6", name: "Biên bản hỏi cung bị can", so: "—", ngay: "06/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g" },
  { id: "hd7", name: "Biên bản hỏi cung bị can", so: "—", ngay: "12/10/2026", folder: "t_bc", loai: "Văn bản tố tụng", status: "Đã ban hành", tone: "g" },
  { id: "t1", name: "Biên bản khám nghiệm hiện trường ngày 10/01/2026", so: "—", ngay: "10/01/2026", folder: "t_cc", loai: "Tài liệu", status: "Đã lưu", tone: "n", file: "BB-kham-nghiem-hien-truong.pdf" },
  { id: "t2", name: "Kết luận giám định số khung, số máy xe 29H1-123.45", so: "—", ngay: "20/10/2026", folder: "t_cc", loai: "Tài liệu", status: "Đã lưu", tone: "n", file: "KL-giam-dinh-so-khung-so-may.pdf" },
  { id: "t3", name: "Ảnh hiện trường (24 ảnh)", so: "—", ngay: "10/01/2026", folder: "t_cc", loai: "Tài liệu", status: "Đã lưu", tone: "n", file: "Anh-hien-truong.zip" },
  { id: "t4", name: "Biên bản lấy lời khai người làm chứng Trần Văn Cường", so: "—", ngay: "14/10/2026", folder: "t_cc", loai: "Tài liệu", status: "Đã lưu", tone: "n", file: "BB-loi-khai-nguoi-lam-chung.docx" },
  { id: "s1", name: "Đề xuất xử lý vật chứng xe máy Honda Vision 29H1-123.45", so: "1185/BC-PC02", ngay: "15/10/2026", folder: "ak", loai: "Báo cáo đề xuất", status: "Hoàn thành", tone: "g" },
  { id: "s2", name: "Tờ trình xin ý kiến chỉ đạo hướng giải quyết vụ án", so: "1102/TTr-PC02", ngay: "01/10/2026", folder: "ak", loai: "Tờ trình", status: "Từ chối", tone: "r" },
];
