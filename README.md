# react-v41 – chuyển prototype V41 sang React

Màn đã chuyển: **Chi tiết vụ án › tab “Tờ trình / Đề xuất / Thẩm định”**. Prototype tương ứng: `prototype/prototypes/ky-so-to-trinh.html`.

React 19 · TypeScript 5.9 (strict) · Vite 6. Không dùng thư viện giao diện; CSS lấy nguyên văn từ prototype.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # kiểm tra kiểu + build vào dist/
```

Font Inter được nạp từ Google Fonts, cùng URL với app Ký số trong prototype, nên cần mạng như bản gốc.

## Cấu trúc

```
src/features/to-trinh/
  ToTrinhTab.tsx              component chính (export qua index.ts)
  components/
    Toolbar.tsx               thanh công cụ chuẩn: tìm kiếm · trạng thái · Lọc nâng cao | Hồ sơ tài liệu · Thêm mới
    AddNewMenu.tsx            menu “Thêm mới” (BCĐX, Phiếu chuyển việc; 3 mục khoá)
    FilterChips.tsx           dòng “Điều kiện: …”, Xóa tất cả, “Hiển thị n/N văn bản”
    AdvancedFilter.tsx        bảng Lọc nâng cao (7 trường sinh từ cột dữ liệu)
    FlowModeSwitch.tsx        “Mô phỏng luồng”: PC, C · Cấp xã trình cấp trên · Cấp xã ký nội bộ
    DocumentTable.tsx         bảng 12 cột, dòng trống, dòng “không có bản ghi phù hợp”
  data.ts                     dữ liệu minh họa, danh mục trạng thái, chuỗi hiển thị
  filter.ts                   logic tìm kiếm / lọc / chip
  types.ts, icons.tsx
  to-trinh.css                CSS sinh tự động (không sửa tay)
src/features/ky-so/           phần dùng chung của các màn app Ký số mở trong cửa sổ toàn màn hình V33
  KysoWindow.tsx              cửa sổ V33 (thanh tiêu đề, thu nhỏ, dải giữ chỗ) + lớp phủ cho hộp thoại / thông báo
  KysoModal.tsx               hộp thoại #dlg (modal, confirmBox)
  parts.tsx                   tiêu đề trang, thẻ, ô chỉ xem, thanh bước, khung chia đôi kéo được, thu/phóng tờ giấy, thông báo
  useDocFind.tsx, docFind.ts  “Tìm trong văn bản” (VER20) dùng chung
  ky-so.css, fonts/           CSS sinh tự động cho mọi màn trong khung (+ Inter TTF của V41 cho cửa sổ)
src/features/ho-so/           Bộ hồ sơ vụ án + trình xem “Xem hồ sơ báo cáo”
src/features/bao-cao/         Chi tiết báo cáo đề xuất / tờ trình, form lập báo cáo, hộp chọn văn bản dự thảo
tools/                        trích xuất từ prototype, sinh CSS / dữ liệu, so ảnh; baseline/ = 11 ảnh gốc của tab
```

## Dùng component

```tsx
import { ToTrinhTab } from './features/to-trinh';

<ToTrinhTab
  rows={rows}                          // ToTrinhRow[]; bỏ trống = 2 bản ghi minh họa của prototype
  defaultFlowMode="pc"                 // hoặc flowMode + onFlowModeChange để điều khiển từ ngoài
  notice={{ text: 'BCĐX 2405/BC-PC02 đang trong luồng ký số', tone: 't' }}
  onOpenRow={row => …}                 // bấm số văn bản hoặc nút Xem
  onShowProgress={row => …}            // nút Tiến trình (row.canTrackProgress)
  onEditRow={row => …} onDeleteRow={row => …}
  onCreate={kind => …}                 // 'bc' Báo cáo đề xuất | 'gv' Phiếu chuyển việc
  onOpenHoSo={() => …}                 // nút Hồ sơ tài liệu
/>
```

Toàn bộ CSS nằm dưới class `.kyso-tt`, nên không ảnh hưởng phần khác của ứng dụng.

## Nguồn trong prototype

| Phần | Nguồn |
|---|---|
| Danh sách, tìm kiếm, ô Trạng thái, mẫu dòng, menu Thêm mới | app Ký số (`S7_KYSO_B64`, xem `prototype/split/embedded/kyso-totrinh-v13.html`): `renderTotrinh` (bản gốc + bản vá v18, v22), `ttRows` |
| Mô phỏng luồng + ghi chú | app Ký số: `capSwitch` (v18cap) |
| Thanh công cụ chuẩn, Lọc nâng cao, chip điều kiện | `prototype/split/scripts/layers/v23_07112026.js`: `adaptBar`, `autoFieldsT`, `matchRow`, `chipsOf`, `renderChips` |
| CSS | 153 luật đang áp dụng cho tab: CSS của app Ký số và `css/v23_07112026.css` mà V41 chèn vào khung |

## Cách giữ giống bản gốc

- `tools/extract-to-trinh.cjs` mở prototype trong Chrome headless và lấy DOM, ảnh chụp ở 11 trạng thái. Script ghi lại đúng các luật CSS khớp với phần tử của tab, theo thứ tự cascade.
- `tools/gen-to-trinh-css.cjs` sinh `to-trinh.css` từ các luật đó, với ba điều chỉnh:
  - selector `:root`, `html`, `body` của khung được đổi thành `.kyso-tt`;
  - `#v-detail` và `#t-totrinh` được đổi thành class;
  - `@media` (vốn tính theo bề rộng iframe) được đổi thành `@container`.
- Một số hành vi được giữ nguyên như bản gốc:
  - dòng không khớp Lọc nâng cao vẫn render, chỉ bị ẩn (`tr.v23-hide`), nên STT và viền dòng giống hệt;
  - trường lọc nâng cao sinh từ toàn bộ dữ liệu, giống V23.
- Kết quả của `tools/compare-to-trinh.cjs` (cùng chuỗi thao tác, khung 1320px):
  - 8/11 trạng thái giống bản gốc từng điểm ảnh: mặc định, menu Thêm mới, tìm “1185”, lọc “Từ chối”, tìm không thấy, 3 chế độ luồng;
  - 3 trạng thái có Lọc nâng cao lệch 0,001–0,008%, chỉ là khử răng cưa vài ký tự, mắt thường không thấy.

Chạy lại kiểm tra:

```bash
npm run build && npx vite preview --port 4173 --strictPort
node tools/compare-to-trinh.cjs tools/baseline <thư-mục-ra> http://localhost:4173/
```

## Hồ sơ tài liệu → Bộ hồ sơ vụ án (`src/features/ho-so/`)

Nút **Hồ sơ tài liệu** mở cửa sổ toàn màn hình V33 chứa màn **Bộ hồ sơ vụ án** (route `hoso` của app Ký số):

- **Màn hồ sơ:**
  - cây hồ sơ, lọc tên/số và trạng thái, tab Mục lục;
  - thu nhỏ thành ô nổi góc phải và dải giữ chỗ trong tab;
  - Đóng / Quay lại / × → về danh sách.
- **Mắt, tên văn bản, số văn bản ở Mục lục** mở trình xem **“Xem hồ sơ báo cáo”** (`HoSoViewer.tsx`, theo V19 + VER20 + V24):
  - pop-up 741px bám phải, danh sách “Hồ sơ báo cáo (24)”;
  - ← → và mũi tên hai bên, thu/phóng, toàn màn hình, in;
  - tìm trong văn bản: không dấu / hoa-thường / nguyên từ / trang đang xem, danh sách kết quả theo trang;
  - Esc hoặc bấm nền tối để đóng;
  - văn bản đã mở được tô “đã xem” trong danh sách sau khi đóng trình xem.
- **Tải xuống:** hiện thông báo “Tải xuống tệp (mô phỏng)” như bản gốc.
- **Link “Vụ án VA26-…”:** đóng cửa sổ rồi gọi `hoSo.onOpenCase` để màn cha chuyển sang Thông tin vụ án.
  - Bản gốc chuyển tab nhưng để lại cửa sổ trống, bản React không giữ lỗi này.
- **Nguồn sinh tự động:**
  - `tools/extract-ho-so.cjs` và `tools/extract-ho-so-viewer.cjs` trích DOM, CSS và ảnh;
  - `tools/gen-ho-so-css.cjs` sinh `ho-so.css` (một tệp cho cả màn và trình xem, đúng thứ tự cascade);
  - `tools/gen-ho-so-viewer-data.cjs` sinh `viewer-data.ts`.
- **Kiểm tra:** `node tools/compare-ho-so.cjs <thư-mục-ra>` cho kết quả:
  - 5 trạng thái màn hồ sơ, 17 trạng thái trình xem (so vùng hộp thoại), tải xuống, thu nhỏ đều khớp 0%;
  - đóng bằng nền tối và quay về danh sách hoạt động như bản gốc.
- **Khác biệt có chủ ý:** khi mở trình xem, bản gốc đẩy trang phía sau xuống 44px.
  - Nguyên nhân: lớp V19 cho iframe phủ cả cửa sổ, nhưng trong cửa sổ V33 iframe không nới được.
  - Bản React giữ trang đứng yên.
- **Font:** chữ của cửa sổ V33 (thanh tiêu đề, ô thu nhỏ) thuộc trang V41, dùng bộ Inter TTF nhúng của V41 (`ho-so/fonts/`).
  - Phần trong khung dùng Inter của Google Fonts như app Ký số.

## Số văn bản / nút mắt → Chi tiết báo cáo đề xuất / tờ trình (`bao-cao/ChiTietBaoCao.tsx`)

Hai bản ghi có sẵn (s1, s2) mở màn chi tiết trong cửa sổ V33 như bản gốc. Nguồn: `PAGES.bcview` của app Ký số và các lớp V18, V28, V35.

- **Đầu trang:**
  - tiêu đề và nhãn trạng thái;
  - “Hồ sơ điện tử” mở Bộ hồ sơ vụ án, nút Đóng ở đó thành “← Quay lại Báo cáo đề xuất”;
  - “Quay lại” về danh sách;
  - thanh bước.
- **Tab bên trái:**
  - Thông tin: thông tin văn bản, văn bản tố tụng kèm theo;
  - Tài liệu: bấm tệp để xem bên phải;
  - Lịch sử & tiến trình: bấm một phiên bản để xem, bản bị trả lại có dấu chìm “CHỈ XEM”;
  - Hồ sơ vụ án: cây hồ sơ, tìm, thu/mở thư mục; bấm văn bản để xem bên phải.
- **Khung phải:** thu/phóng, Vừa khung, tìm trong văn bản, tải về.
- **Khung chia đôi** kéo được: nhấp đúp về mặc định, phím ←/→.
- **Tờ trình bị từ chối:** có dải cảnh báo và nút “Lập lại tờ trình”, mở form lập với nội dung bản cũ.
- **Kiểm tra:** `node tools/compare-ky-so.cjs bcview <thư-mục-ra>` – 22/22 trạng thái khớp 0%; Quay lại đóng cửa sổ như bản gốc.

## Thêm mới → Báo cáo đề xuất (`bao-cao/LapBaoCao.tsx`)

Form lập báo cáo trong cửa sổ V33. Nguồn: `PAGES.bcdx` (V18) cùng các lớp V20, V28, V35, V36.

- **Thanh bước** có nút mở “Lịch sử xử lý”. Mở lịch sử thì tạm tắt khung xem trước, đóng lại thì bật lại.
- **Tab Thông tin chi tiết:**
  - các ô nhập có kiểm tra trường bắt buộc; gõ lại vào ô thì hết báo lỗi;
  - bộ đếm ký tự, công tắc “Quyền xem hồ sơ của văn thư”.
- **Tab Văn bản tố tụng dự thảo:**
  - hộp “Chọn văn bản dự thảo từ Hồ sơ điện tử” có lọc trạng thái, tìm, nhóm theo tập hồ sơ, chọn tất cả;
  - bảng có chọn người ký nháy, xem, bỏ.
- **Tab Tài liệu, chứng cứ:** kéo thả / chọn tệp (PDF, Word, Excel, JPG, PNG, tối đa 20 MB), tải về, xóa.
- **Tab BCĐX trình lãnh đạo:**
  - nhãn “req” khi có văn bản do Lãnh đạo TT/PTT ký (giữ đúng chữ hiển thị của bản gốc);
  - nút tạo Biểu mẫu 02 mới báo thông báo.
- **Tab Hồ sơ vụ án:** tích ô đầu dòng để kèm / bỏ kèm vào báo cáo.
- **Mở rộng / Thu gọn văn bản:** bật khung xem trước Biểu mẫu 01 cập nhật theo nội dung đang nhập, gồm thu/phóng, tìm, 4 nút bố cục.
- **Lưu nháp:** chỉ kiểm tra Ngày, Số, Phê duyệt. Tiêu đề đổi thành “Báo cáo đề xuất số 2405/BC-PC02”, ghi “Đã lưu nháp lúc 08:12…” theo đồng hồ mô phỏng, rồi gọi `onSaveDraft`.
- **Lưu & ký số:** kiểm tra 8 trường bắt buộc.
  - Nếu chưa kèm văn bản dự thảo thì hỏi lại trước, rồi hiện “Xác nhận lưu”.
  - Bấm Xác nhận thì gọi `onSaveSign`; **bước ký số và các màn sau trong luồng chưa chuyển**.
- **Quay lại:** về danh sách, không lưu.
- Nội dung đang nhập được giữ khi sang Bộ hồ sơ vụ án (nút mở rộng ở tab Hồ sơ vụ án) rồi quay lại.
- **Kiểm tra:** `node tools/compare-ky-so.cjs bcdx <thư-mục-ra>` – 19/22 trạng thái khớp 0%; 3 trạng thái có hộp thoại lệch 0,009–0,037%, chỉ là vài điểm ảnh khử răng cưa.
- **Khác biệt có chủ ý:**
  - Bản gốc lúc mới mở form ghi “Chuyển Văn thư xem hồ sơ”, sau mỗi lần dựng lại thì thành “Quyền xem hồ sơ của văn thư” (hai lớp cùng sửa nhãn).
  - Bản React dùng nhãn của lớp mới nhất (V32): “Quyền xem hồ sơ của văn thư”.

## Sinh lại CSS / dữ liệu

```bash
node tools/extract-ho-so.cjs <dir-hs> && node tools/extract-ho-so-viewer.cjs <dir-vw>
node tools/extract-ky-so.cjs bcview <dir-bcv> && node tools/extract-ky-so.cjs bcdx <dir-bcdx>
node tools/gen-ky-so-css.cjs <dir-hs> <dir-vw> <dir-bcv> <dir-bcdx>   # một tệp CSS, gộp theo thứ tự luật gốc
node tools/gen-ho-so-viewer-data.cjs <dir-vw> && node tools/gen-bao-cao-data.cjs <dir-bcv> <dir-bcdx>
```

## Chưa chuyển

- Thêm mới → Phiếu chuyển việc; Tiến trình xử lý (nút cờ); Sửa/Xóa dòng: vẫn là callback.
- Luồng sau khi lưu & ký số (ký số, trình duyệt, ý kiến chỉ đạo, thẩm định, văn thư) và dòng mới của báo cáo vừa lưu nháp trong danh sách.
- Khi một BCĐX đang trong luồng mà đổi “Mô phỏng luồng”, bản gốc hỏi xác nhận rồi đặt lại luồng. Component chỉ báo `onFlowModeChange`; màn cha tự quyết có đặt lại hay không.
