/* SINH TỰ ĐỘNG bởi tools/gen-bao-cao-data.cjs từ prototype V41 (app Ký số: V18_SEED, SEED_TT, U, UNIT_PC, V18_LOAI, TLM, GROUPS).
   Không sửa tay. */
import type { BcForm, DraftInfo, FileInfo, LoaiInfo, SeedDetail, SeedRow, UserInfo } from './types';

/** Chi tiết 2 bản ghi minh họa ở tab Tờ trình / Đề xuất / Thẩm định (s1 BCĐX hoàn thành, s2 tờ trình bị từ chối) */
export const SEED_DET: Record<string, SeedDetail> = {
  s1: {
    loai: "bc",
    hauto: "BC-PC02",
    ngay: "15/10/2026",
    nguoiKy: "tam",
    pheDuyet: "diem",
    yk: "",
    ld: "tung",
    src: "vc",
    kinhGui: "Đồng chí Thượng tá Nguyễn Văn Điềm, Trưởng phòng Cảnh sát hình sự Công an thành phố Hà Nội",
    trichYeu: "Đề xuất xử lý vật chứng xe máy Honda Vision 29H1-123.45",
    noiDung: "Thực hiện nhiệm vụ điều tra vụ án hình sự VA26-000001, căn cứ Kết luận giám định số khung, số máy và Kết luận định giá tài sản, Điều tra viên đề xuất xử lý vật chứng là xe máy Honda Vision biển số 29H1-123.45: trả lại cho chủ sở hữu hợp pháp theo Điều 106 BLTTHS 2015.",
    kinhBao: "Kính báo cáo và xin ý kiến chỉ đạo của đồng chí",
    docs: [
      "t2",
      "t3"
    ],
    signs: {
      lap: {
        at: "08:40 15/10/2026"
      },
      chihuy: {
        at: "15:05 15/10/2026"
      }
    },
    drafts: [
      {
        name: "Quyết định xử lý vật chứng",
        mau: "Mẫu 233",
        signer: "tung",
        so: "131/QĐ-CSĐT",
        ngay: "15/10/2026",
        nhay: 2,
        kyso: true
      }
    ],
    versions: [
      {
        v: 1,
        so: "1150/BC-PC02",
        ngay: "08/10/2026",
        st: [
          "Bị trả lại",
          "r"
        ],
        ly: "Đề nghị bổ sung kết luận định giá tài sản trước khi đề xuất xử lý vật chứng",
        by: "diem",
        at: "15:20 09/10/2026",
        docs: [
          "t3"
        ],
        noiDung: "Thực hiện nhiệm vụ điều tra vụ án hình sự VA26-000001, Điều tra viên đề xuất xử lý vật chứng là xe máy Honda Vision biển số 29H1-123.45: trả lại cho chủ sở hữu hợp pháp.",
        signs: {
          lap: {
            at: "10:15 08/10/2026"
          }
        }
      },
      {
        v: 2,
        so: "1185/BC-PC02",
        ngay: "15/10/2026",
        st: [
          "Hoàn thành",
          "g"
        ],
        by: "tung",
        at: "09:12 16/10/2026",
        cur: true
      }
    ],
    steps: [
      [
        "Lập BCĐX",
        "Đã xong",
        "done",
        "08:40 15/10"
      ],
      [
        "Chỉ huy duyệt",
        "Đã xong",
        "done",
        "15:05 15/10"
      ],
      [
        "TT/PTT duyệt",
        "Đã xong",
        "done",
        "09:12 16/10"
      ],
      [
        "Ký số văn bản",
        "Đã ký 1/1 văn bản",
        "done",
        "09:20 16/10"
      ],
      [
        "Văn thư",
        "Đã phát hành",
        "done",
        "10:05 16/10"
      ]
    ],
    hist: [
      [
        "10:05",
        "16/10/2026",
        "Văn thư phát hành văn bản",
        "Quyết định xử lý vật chứng số 131/QĐ-CSĐT",
        "Văn thư Văn phòng CQCSĐT"
      ],
      [
        "09:12",
        "16/10/2026",
        "Lãnh đạo TT/PTT phê duyệt, ký số",
        "Đồng ý đề xuất xử lý vật chứng",
        "Trần Thanh Tùng"
      ],
      [
        "15:05",
        "15/10/2026",
        "Chỉ huy phê duyệt & ký số",
        "Đồng ý, trình Lãnh đạo TT/PTT",
        "Nguyễn Văn Điềm"
      ],
      [
        "08:40",
        "15/10/2026",
        "Cán bộ lập ký số Báo cáo đề xuất (phiên bản 2)",
        "Lập lại sau khi bản 1150/BC-PC02 bị trả lại",
        "Trần Thanh Tâm"
      ],
      [
        "15:20",
        "09/10/2026",
        "Chỉ huy trả lại Báo cáo đề xuất 1150/BC-PC02",
        "Đề nghị bổ sung kết luận định giá tài sản",
        "Nguyễn Văn Điềm"
      ]
    ]
  },
  s2: {
    loai: "tt",
    hauto: "TTr-PC02",
    ngay: "01/10/2026",
    nguoiKy: "tam",
    pheDuyet: "diem",
    yk: "",
    ld: "diem",
    src: null,
    kinhGui: "Đồng chí Thượng tá Nguyễn Văn Điềm, Trưởng phòng Cảnh sát hình sự Công an thành phố Hà Nội",
    trichYeu: "Tờ trình xin ý kiến chỉ đạo hướng giải quyết vụ án",
    noiDung: "Thực hiện nhiệm vụ điều tra vụ án hình sự VA26-000001, Điều tra viên kính trình đồng chí cho ý kiến chỉ đạo hướng giải quyết vụ án: đề xuất kết thúc điều tra, chuyển hồ sơ đề nghị truy tố.",
    kinhBao: "Kính báo cáo và xin ý kiến chỉ đạo của đồng chí",
    docs: [
      "t1",
      "t4"
    ],
    signs: {
      lap: {
        at: "14:30 01/10/2026"
      }
    },
    drafts: [],
    versions: [
      {
        v: 1,
        so: "1102/TTr-PC02",
        ngay: "01/10/2026",
        st: [
          "Từ chối",
          "r"
        ],
        ly: "Chưa đủ căn cứ, đề nghị bổ sung kết quả giám định",
        by: "diem",
        at: "16:45 02/10/2026",
        cur: true
      }
    ],
    steps: [
      [
        "Lập tờ trình",
        "Đã xong",
        "done",
        "14:30 01/10"
      ],
      [
        "Chỉ huy duyệt",
        "Từ chối",
        "rej",
        "16:45 02/10"
      ]
    ],
    hist: [
      [
        "16:45",
        "02/10/2026",
        "Chỉ huy từ chối Tờ trình",
        "Chưa đủ căn cứ, đề nghị bổ sung kết quả giám định",
        "Nguyễn Văn Điềm"
      ],
      [
        "14:30",
        "01/10/2026",
        "Cán bộ lập ký số, trình Tờ trình",
        "Trình Chỉ huy phê duyệt",
        "Trần Thanh Tâm"
      ]
    ]
  }
};

/** Dòng tương ứng ở danh sách (nhãn trạng thái trên tiêu đề màn chi tiết) */
export const SEED_TT: SeedRow[] = [
  {
    id: "s1",
    so: "1185/BC-PC02",
    ngay: "15/10/2026",
    ty: "Đề xuất xử lý vật chứng xe máy Honda Vision 29H1-123.45",
    loai: "Báo cáo đề xuất",
    src: "vc",
    lap: "tam",
    ld: "tung",
    st: [
      "Hoàn thành",
      "g"
    ],
    trinh: "15/10/2026 09:12"
  },
  {
    id: "s2",
    so: "1102/TTr-PC02",
    ngay: "01/10/2026",
    ty: "Tờ trình xin ý kiến chỉ đạo hướng giải quyết vụ án",
    loai: "Tờ trình",
    src: null,
    lap: "tam",
    ld: "diem",
    st: [
      "Từ chối",
      "r"
    ],
    lydo: "Chưa đủ căn cứ, đề nghị bổ sung kết quả giám định",
    trinh: "01/10/2026 14:30"
  }
];

/** Cán bộ trong luồng (U) */
export const USERS: Record<string, UserInfo> = {
  tam: {
    name: "Trần Thanh Tâm",
    ma: "031-795",
    rank: "Trung tá",
    cv: "Điều tra viên, Đội 2 – Phòng CSHS",
    ky: "ĐIỀU TRA VIÊN",
    role: "Cán bộ lập BCĐX"
  },
  lan: {
    name: "Đinh Hữu Lân",
    ma: "121-791",
    rank: "Trung tá",
    cv: "Phó Trưởng phòng Cảnh sát hình sự",
    ky: "PHÓ TRƯỞNG PHÒNG",
    role: "Người cần xin ý kiến"
  },
  diem: {
    name: "Nguyễn Văn Điềm",
    ma: "198-846",
    rank: "Thượng tá",
    cv: "Trưởng phòng Cảnh sát hình sự",
    ky: "TRƯỞNG PHÒNG",
    pd: "TRƯỞNG PHÒNG CẢNH SÁT HÌNH SỰ",
    role: "Chỉ huy phê duyệt"
  },
  tung: {
    name: "Trần Thanh Tùng",
    ma: "102-338",
    rank: "Đại tá",
    cv: "Phó Thủ trưởng thường trực Cơ quan CSĐT",
    ky: "PHÓ THỦ TRƯỞNG",
    pd: "PHÓ THỦ TRƯỞNG THƯỜNG TRỰC<br>CƠ QUAN CSĐT",
    role: "Lãnh đạo TT/PTT"
  },
  phuong: {
    name: "Vũ Thị Hà Phương",
    ma: "305-521",
    rank: "Trung tá",
    cv: "Đội trưởng Đội Tham mưu tổng hợp, Văn phòng CQCSĐT",
    ky: "ĐỘI TRƯỞNG",
    role: "Đội trưởng thẩm định"
  },
  nam: {
    name: "Nguyễn Quốc Nam",
    ma: "317-064",
    rank: "Thiếu tá",
    cv: "Phó Đội trưởng Đội Tham mưu tổng hợp",
    ky: "PHÓ ĐỘI TRƯỞNG",
    role: "Phó Đội trưởng thẩm định"
  },
  hoa: {
    name: "Lê Minh Hòa",
    ma: "301-112",
    rank: "Thượng tá",
    cv: "Chánh Văn phòng Cơ quan CSĐT",
    ky: "CHÁNH VĂN PHÒNG",
    role: "Thủ trưởng đơn vị thẩm định"
  },
  linh: {
    name: "Trần Khánh Linh",
    ma: "322-415",
    rank: "Đại úy",
    cv: "Cán bộ Đội Tham mưu tổng hợp",
    ky: "CÁN BỘ THẨM ĐỊNH",
    role: "Cán bộ thẩm định"
  },
  hung: {
    name: "Đỗ Minh Hùng",
    ma: "045-318",
    rank: "Đại úy",
    cv: "Điều tra viên, Đội 2 – Phòng CSHS",
    ky: "ĐIỀU TRA VIÊN",
    role: "Cán bộ ký nháy"
  },
  vanthu: {
    name: "Văn thư Văn phòng CQCSĐT",
    ma: "",
    rank: "",
    cv: "Văn thư cơ quan",
    role: "Văn thư",
    av: "V"
  }
};

/** Đơn vị lập báo cáo (đầu tờ giấy) */
export const UNIT_PC: [string, string] = [
  "CÔNG AN THÀNH PHỐ HÀ NỘI",
  "PHÒNG CẢNH SÁT HÌNH SỰ"
];

/** Loại văn bản */
export const LOAI: Record<string, LoaiInfo> = {
  bc: {
    t: "Báo cáo đề xuất",
    h: "BC-PC02",
    mau: "01",
    title: "BÁO CÁO ĐỀ XUẤT",
    d: "Biểu mẫu 01 · trình chỉ huy, lãnh đạo phê duyệt văn bản tố tụng"
  },
  tt: {
    t: "Tờ trình",
    h: "TTr-PC02",
    mau: "TTr",
    title: "TỜ TRÌNH",
    d: "Xin ý kiến chỉ đạo hướng giải quyết vụ án, nội dung nghiệp vụ"
  },
  kh: {
    t: "Kế hoạch",
    h: "KH-PC02",
    mau: "KH",
    title: "KẾ HOẠCH",
    d: "Kế hoạch điều tra, kế hoạch hỏi cung… trình duyệt"
  },
  cv: {
    t: "Công văn",
    h: "CV-PC02",
    mau: "CV",
    title: "",
    d: "Gửi cơ quan ngoài (VKS, Tòa án…) kèm danh sách văn bản, tệp"
  }
};

/** Tài liệu, chứng cứ (TLM) kèm dung lượng */
export const FILES: Record<string, FileInfo> = {
  t1: {
    name: "BB-kham-nghiem-hien-truong.pdf",
    ty: "Biên bản khám nghiệm hiện trường ngày 10/01/2026",
    ngay: "10/01/2026",
    size: "1,2 MB"
  },
  t2: {
    name: "KL-giam-dinh-so-khung-so-may.pdf",
    ty: "Kết luận giám định số khung, số máy xe 29H1-123.45",
    ngay: "20/10/2026",
    size: "860 KB"
  },
  t3: {
    name: "Anh-hien-truong.zip",
    ty: "Ảnh hiện trường (24 ảnh)",
    ngay: "10/01/2026",
    size: "18,4 MB"
  },
  t4: {
    name: "BB-loi-khai-nguoi-lam-chung.docx",
    ty: "Biên bản lấy lời khai người làm chứng Trần Văn Cường",
    ngay: "14/10/2026",
    size: "214 KB"
  }
};

/** Tên nhóm biểu mẫu (“Lập từ: …”) */
export const GROUPS: Record<string, string> = {
  qd: "Danh sách các quyết định khởi tố, nhập, tách vụ án",
  vc: "Vật chứng / Giám định – Danh sách quyết định",
  "hd0-0": "Triệu tập và hỏi cung bị can",
  "hd1-0": "Lấy lời khai người làm chứng, bị hại, đương sự",
  "hd1-1": "Đối chất",
  "hd1-2": "Nhận dạng",
  "hd1-3": "Nhận biết giọng nói",
  "hd2-0": "Khám xét người, chỗ ở, chỗ làm việc, địa điểm, phương tiện",
  "hd2-1": "Thu giữ thư tín, điện tín, bưu kiện, bưu phẩm",
  lt: "Tài liệu liên thông (Gửi đi)"
};

/** Văn bản tố tụng dự thảo của vụ án (DRAFTS) – chọn kèm báo cáo */
export const DRAFTS: Record<string, DraftInfo> = {
  qd5: {
    name: "Quyết định phân công bổ sung Phó Thủ trưởng Cơ quan điều tra tiến hành điều tra vụ án hình sự",
    mau: "Mẫu 38",
    signer: "tung",
    ngay: "03/11/2026",
    g: "qd",
    hauto: "QĐ-CSĐT"
  },
  qd6: {
    name: "Quyết định nhập vụ án hình sự",
    mau: "Mẫu 12",
    signer: "tung",
    ngay: "03/11/2026",
    g: "qd",
    hauto: "QĐ-CSĐT"
  },
  vc3: {
    name: "Quyết định trưng cầu người phiên dịch",
    mau: "Mẫu 168",
    signer: "tung",
    ngay: "02/11/2026",
    g: "vc",
    hauto: "QĐ-CSĐT"
  },
  vc4: {
    name: "Công văn đề nghị Hội đồng định giá tài sản xác định giá trị xe máy 29H1-123.45",
    mau: "Công văn",
    signer: "diem",
    ngay: "02/11/2026",
    g: "vc",
    hauto: "CV-PC02"
  },
  hd8: {
    name: "Kế hoạch hỏi cung bị can Nguyễn Văn An",
    mau: "Kế hoạch",
    signer: "diem",
    ngay: "03/11/2026",
    g: "hd0-0",
    hauto: "KH-PC02"
  },
  hd9: {
    name: "Lệnh trích xuất bị can Nguyễn Văn An (lần 2)",
    mau: "Mẫu số 200",
    signer: "tung",
    ngay: "03/11/2026",
    g: "hd0-0",
    hauto: "LTX-CSĐT"
  }
};

/** Giá trị mặc định khi thêm mới (newForm theo loại văn bản) */
export const FORM_DEFAULTS: Record<string, BcForm> = {
  bc: {
    src: null,
    so: "2405",
    ngay: "04/11/2026",
    hauto: "BC-PC02",
    nguoiKy: "tam",
    pheDuyet: "diem",
    yk: "lan",
    kinhGui: "Đồng chí Thượng tá Nguyễn Văn Điềm, Trưởng phòng Cảnh sát hình sự Công an thành phố Hà Nội",
    trichYeu: "Đề xuất phê duyệt văn bản tố tụng trong vụ án VA26-000001",
    noiDung: "Thực hiện nhiệm vụ điều tra vụ án hình sự VA26-000001 (Vụ trộm cắp tài sản xảy ra ngày 01/11/2026 tại 90 đường Giáp Hải, xã Bát Tràng, thành phố Hà Nội), tội trộm cắp tài sản, Điều tra viên đã dự thảo các văn bản tố tụng. Kính đề xuất đồng chí xem xét, phê duyệt để trình người có thẩm quyền ký ban hành theo quy định.",
    kinhBao: "Kính báo cáo và xin ý kiến chỉ đạo của đồng chí",
    docs: [
      "t1"
    ],
    drafts: [],
    vtView: false,
    signs: {},
    loai: "bc",
    att: [],
    nhayDef: "tam"
  },
  tt: {
    src: null,
    so: "2405",
    ngay: "04/11/2026",
    hauto: "TTr-PC02",
    nguoiKy: "tam",
    pheDuyet: "diem",
    yk: "lan",
    kinhGui: "Đồng chí Thượng tá Nguyễn Văn Điềm, Trưởng phòng Cảnh sát hình sự Công an thành phố Hà Nội",
    trichYeu: "Tờ trình xin ý kiến chỉ đạo hướng giải quyết vụ án VA26-000001",
    noiDung: "Thực hiện nhiệm vụ điều tra vụ án hình sự VA26-000001 (Vụ trộm cắp tài sản xảy ra ngày 01/11/2026 tại 90 đường Giáp Hải, xã Bát Tràng, thành phố Hà Nội), Điều tra viên kính trình đồng chí xem xét, cho ý kiến chỉ đạo hướng giải quyết vụ án.",
    kinhBao: "Kính báo cáo và xin ý kiến chỉ đạo của đồng chí",
    docs: [
      "t1"
    ],
    drafts: [],
    vtView: false,
    signs: {},
    loai: "tt",
    att: [],
    nhayDef: "tam"
  }
};

