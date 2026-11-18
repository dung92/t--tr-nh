/* SINH TỰ ĐỘNG bởi tools/gen-ho-so-viewer-data.cjs từ prototype V41 (trình xem hồ sơ mở từ Bộ hồ sơ vụ án,
   hoSoItems({all:true}) + draftDoc / fileDoc / issuedDoc của app Ký số). Không sửa tay. */
import type { HoSoViewerItem } from './types';

/** 24 văn bản theo thứ tự nhóm của trình xem: dự thảo → tài liệu, chứng cứ → đã ban hành. */
export const SAMPLE_VIEWER_ITEMS: HoSoViewerItem[] = [
  {
    id: "qd5",
    group: "Văn bản tố tụng dự thảo",
    title: "Quyết định phân công bổ sung Phó Thủ trưởng Cơ quan điều tra tiến hành điều tra vụ án hình sự",
    paper: {
      kind: "draft",
      mau: "Mẫu 38",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……/QĐ-CSĐT",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "QUYẾT ĐỊNH PHÂN CÔNG BỔ SUNG PHÓ THỦ TRƯỞNG CƠ QUAN ĐIỀU TRA TIẾN HÀNH ĐIỀU TRA VỤ ÁN HÌNH SỰ",
      phu: "Dự thảo ngày 03/11/2026 · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      chucVu: "PHÓ THỦ TRƯỞNG",
      viTriKy: "Vị trí ký số – Trần Thanh Tùng",
      nguoiKy: "Đại tá Trần Thanh Tùng",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "qd6",
    group: "Văn bản tố tụng dự thảo",
    title: "Quyết định nhập vụ án hình sự",
    paper: {
      kind: "draft",
      mau: "Mẫu 12",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……/QĐ-CSĐT",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "QUYẾT ĐỊNH NHẬP VỤ ÁN HÌNH SỰ",
      phu: "Dự thảo ngày 03/11/2026 · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      chucVu: "PHÓ THỦ TRƯỞNG",
      viTriKy: "Vị trí ký số – Trần Thanh Tùng",
      nguoiKy: "Đại tá Trần Thanh Tùng",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "vc3",
    group: "Văn bản tố tụng dự thảo",
    title: "Quyết định trưng cầu người phiên dịch",
    paper: {
      kind: "draft",
      mau: "Mẫu 168",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……/QĐ-CSĐT",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "QUYẾT ĐỊNH TRƯNG CẦU NGƯỜI PHIÊN DỊCH",
      phu: "Dự thảo ngày 02/11/2026 · Vật chứng / Giám định – Danh sách quyết định",
      chucVu: "PHÓ THỦ TRƯỞNG",
      viTriKy: "Vị trí ký số – Trần Thanh Tùng",
      nguoiKy: "Đại tá Trần Thanh Tùng",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "vc4",
    group: "Văn bản tố tụng dự thảo",
    title: "Công văn đề nghị Hội đồng định giá tài sản xác định giá trị xe máy 29H1-123.45",
    paper: {
      kind: "draft",
      mau: "Công văn",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "PHÒNG CẢNH SÁT HÌNH SỰ"
      ],
      so: "Số: ……/CV-PC02",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "CÔNG VĂN ĐỀ NGHỊ HỘI ĐỒNG ĐỊNH GIÁ TÀI SẢN XÁC ĐỊNH GIÁ TRỊ XE MÁY 29H1-123.45",
      phu: "Dự thảo ngày 02/11/2026 · Vật chứng / Giám định – Danh sách quyết định",
      chucVu: "TRƯỞNG PHÒNG",
      viTriKy: "Vị trí ký số – Nguyễn Văn Điềm",
      nguoiKy: "Thượng tá Nguyễn Văn Điềm",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "hd8",
    group: "Văn bản tố tụng dự thảo",
    title: "Kế hoạch hỏi cung bị can Nguyễn Văn An",
    paper: {
      kind: "draft",
      mau: "Kế hoạch",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "PHÒNG CẢNH SÁT HÌNH SỰ"
      ],
      so: "Số: ……/KH-PC02",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "KẾ HOẠCH HỎI CUNG BỊ CAN NGUYỄN VĂN AN",
      phu: "Dự thảo ngày 03/11/2026 · Triệu tập và hỏi cung bị can",
      chucVu: "TRƯỞNG PHÒNG",
      viTriKy: "Vị trí ký số – Nguyễn Văn Điềm",
      nguoiKy: "Thượng tá Nguyễn Văn Điềm",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "hd9",
    group: "Văn bản tố tụng dự thảo",
    title: "Lệnh trích xuất bị can Nguyễn Văn An (lần 2)",
    paper: {
      kind: "draft",
      mau: "Mẫu số 200",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……/LTX-CSĐT",
      ngay: "Hà Nội, ngày … tháng … năm 2026",
      tieuDe: "LỆNH TRÍCH XUẤT BỊ CAN NGUYỄN VĂN AN (LẦN 2)",
      phu: "Dự thảo ngày 03/11/2026 · Triệu tập và hỏi cung bị can",
      chucVu: "PHÓ THỦ TRƯỞNG",
      viTriKy: "Vị trí ký số – Trần Thanh Tùng",
      nguoiKy: "Đại tá Trần Thanh Tùng",
      kyNhay: "Chưa có chữ ký nháy"
    }
  },
  {
    id: "t1",
    group: "Tài liệu, chứng cứ",
    title: "BB-kham-nghiem-hien-truong.pdf",
    paper: {
      kind: "file",
      ext: "PDF",
      tenTep: "BB-kham-nghiem-hien-truong.pdf",
      trichYeu: "Biên bản khám nghiệm hiện trường ngày 10/01/2026"
    }
  },
  {
    id: "t2",
    group: "Tài liệu, chứng cứ",
    title: "KL-giam-dinh-so-khung-so-may.pdf",
    paper: {
      kind: "file",
      ext: "PDF",
      tenTep: "KL-giam-dinh-so-khung-so-may.pdf",
      trichYeu: "Kết luận giám định số khung, số máy xe 29H1-123.45"
    }
  },
  {
    id: "t3",
    group: "Tài liệu, chứng cứ",
    title: "Anh-hien-truong.zip",
    paper: {
      kind: "file",
      ext: "ZIP",
      tenTep: "Anh-hien-truong.zip",
      trichYeu: "Ảnh hiện trường (24 ảnh)"
    }
  },
  {
    id: "t4",
    group: "Tài liệu, chứng cứ",
    title: "BB-loi-khai-nguoi-lam-chung.docx",
    paper: {
      kind: "file",
      ext: "DOCX",
      tenTep: "BB-loi-khai-nguoi-lam-chung.docx",
      trichYeu: "Biên bản lấy lời khai người làm chứng Trần Văn Cường"
    }
  },
  {
    id: "qd1",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định thay đổi Quyết định khởi tố vụ án hình sự · 120/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 120/QĐ-ĐTTH",
      ngay: "Ngày 10/01/2026",
      tieuDe: "QUYẾT ĐỊNH THAY ĐỔI QUYẾT ĐỊNH KHỞI TỐ VỤ ÁN HÌNH SỰ",
      phu: "Văn bản đã ban hành · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      dau: "Đã ban hành"
    }
  },
  {
    id: "qd2",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định bổ sung Quyết định khởi tố vụ án hình sự · 121/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 121/QĐ-ĐTTH",
      ngay: "Ngày 11/02/2026",
      tieuDe: "QUYẾT ĐỊNH BỔ SUNG QUYẾT ĐỊNH KHỞI TỐ VỤ ÁN HÌNH SỰ",
      phu: "Văn bản đã ban hành · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      dau: "Đã ban hành"
    }
  },
  {
    id: "qd3",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định hủy bỏ Quyết định khởi tố vụ án hình sự · 122/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 122/QĐ-ĐTTH",
      ngay: "Ngày 12/03/2026",
      tieuDe: "QUYẾT ĐỊNH HỦY BỎ QUYẾT ĐỊNH KHỞI TỐ VỤ ÁN HÌNH SỰ",
      phu: "Văn bản đã ban hành · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      dau: "Đã ban hành"
    }
  },
  {
    id: "qd4",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định tách vụ án hình sự · 123/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 123/QĐ-ĐTTH",
      ngay: "Ngày 31/10/2026",
      tieuDe: "QUYẾT ĐỊNH TÁCH VỤ ÁN HÌNH SỰ",
      phu: "Văn bản đã ban hành · Danh sách các quyết định khởi tố, nhập, tách vụ án",
      dau: "Đã ban hành"
    }
  },
  {
    id: "vc1",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định xử lý vật chứng · 120/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 120/QĐ-ĐTTH",
      ngay: "Ngày 10/01/2026",
      tieuDe: "QUYẾT ĐỊNH XỬ LÝ VẬT CHỨNG",
      phu: "Văn bản đã ban hành · Vật chứng / Giám định – Danh sách quyết định",
      dau: "Đã ban hành"
    }
  },
  {
    id: "vc2",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định trưng cầu giám định số khung, số máy · 121/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 121/QĐ-ĐTTH",
      ngay: "Ngày 11/02/2026",
      tieuDe: "QUYẾT ĐỊNH TRƯNG CẦU GIÁM ĐỊNH SỐ KHUNG, SỐ MÁY",
      phu: "Văn bản đã ban hành · Vật chứng / Giám định – Danh sách quyết định",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd0",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định tạm giữ tài sản, đồ vật, tài liệu · 09/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "Mẫu số 147",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 09/QĐ-ĐTTH",
      ngay: "Ngày 02/10/2026",
      tieuDe: "QUYẾT ĐỊNH TẠM GIỮ TÀI SẢN, ĐỒ VẬT, TÀI LIỆU",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd1",
    group: "Văn bản tố tụng đã ban hành",
    title: "Giấy triệu tập bị can · 15/GTT-ĐTTH",
    paper: {
      kind: "issued",
      mau: "Mẫu số 212",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 15/GTT-ĐTTH",
      ngay: "Ngày 05/10/2026",
      tieuDe: "GIẤY TRIỆU TẬP BỊ CAN",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd2",
    group: "Văn bản tố tụng đã ban hành",
    title: "Phiếu yêu cầu trích xuất · 16/PYC-ĐTTH",
    paper: {
      kind: "issued",
      mau: "Mẫu số 138",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 16/PYC-ĐTTH",
      ngay: "Ngày 05/10/2026",
      tieuDe: "PHIẾU YÊU CẦU TRÍCH XUẤT",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd3",
    group: "Văn bản tố tụng đã ban hành",
    title: "Lệnh trích xuất và áp giải · 20/LTX-ĐTTH",
    paper: {
      kind: "issued",
      mau: "Mẫu số 200",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 20/LTX-ĐTTH",
      ngay: "Ngày 05/10/2026",
      tieuDe: "LỆNH TRÍCH XUẤT VÀ ÁP GIẢI",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd4",
    group: "Văn bản tố tụng đã ban hành",
    title: "Quyết định áp giải · 18/QĐ-ĐTTH",
    paper: {
      kind: "issued",
      mau: "Mẫu số 110",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: 18/QĐ-ĐTTH",
      ngay: "Ngày 05/10/2026",
      tieuDe: "QUYẾT ĐỊNH ÁP GIẢI",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd5",
    group: "Văn bản tố tụng đã ban hành",
    title: "Biên bản áp giải",
    paper: {
      kind: "issued",
      mau: "Mẫu số 111",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……",
      ngay: "Ngày 06/10/2026",
      tieuDe: "BIÊN BẢN ÁP GIẢI",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd6",
    group: "Văn bản tố tụng đã ban hành",
    title: "Biên bản hỏi cung bị can",
    paper: {
      kind: "issued",
      mau: "Mẫu số 139",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……",
      ngay: "Ngày 06/10/2026",
      tieuDe: "BIÊN BẢN HỎI CUNG BỊ CAN",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  },
  {
    id: "hd7",
    group: "Văn bản tố tụng đã ban hành",
    title: "Biên bản hỏi cung bị can",
    paper: {
      kind: "issued",
      mau: "Mẫu số 139",
      donVi: [
        "CÔNG AN THÀNH PHỐ HÀ NỘI",
        "CƠ QUAN CẢNH SÁT ĐIỀU TRA"
      ],
      so: "Số: ……",
      ngay: "Ngày 12/10/2026",
      tieuDe: "BIÊN BẢN HỎI CUNG BỊ CAN",
      phu: "Văn bản đã ban hành · Triệu tập và hỏi cung bị can",
      dau: "Đã ban hành"
    }
  }
];
