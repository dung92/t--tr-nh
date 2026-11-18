import { useEffect, useState } from 'react';
import { ToTrinhTab } from './features/to-trinh';

/** Trang demo: hiển thị tab “Tờ trình / Đề xuất / Thẩm định” với dữ liệu minh họa; thao tác in ra thông báo nhỏ góc dưới. */
export default function App() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 2600); return () => clearTimeout(t); }, [msg]);

  return (
    <main className="demo">
      <ToTrinhTab
        onCreate={() => setMsg('Thêm mới: Phiếu chuyển việc (màn này chưa chuyển sang React)')}
        onSaveSign={f => setMsg(`Lưu & ký số ${f.so}/${f.hauto}: bước ký số chưa chuyển sang React`)}
        onFlowModeChange={m => setMsg('Mô phỏng luồng: ' + m)}
        hoSo={{ onOpenCase: () => setMsg('Mở Thông tin vụ án VA26-000001') }}
      />
      {msg && <div className="demo-toast" role="status">{msg}</div>}
    </main>
  );
}
