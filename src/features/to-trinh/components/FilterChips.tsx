import { UNIT } from '../data';
import type { Chip } from '../filter';
import { IconX } from '../icons';

/** Dòng “Điều kiện: …” (.v23-cr) – chỉ hiện khi có điều kiện lọc nâng cao. */
export function FilterChips({ chips, shown, total, onRemove, onClear }: {
  chips: Chip[]; shown: number; total: number; onRemove: (key: string) => void; onClear: () => void;
}) {
  if (!chips.length) return <div className="v23-cr" />;
  return (
    <div className="v23-cr on">
      <span className="lb">Điều kiện:</span>
      {chips.map(c => (
        <span className="v23-ch" key={c.key}>
          <span>{c.text}</span>
          <button type="button" aria-label={'Bỏ điều kiện ' + c.text} onClick={() => onRemove(c.key)}><IconX /></button>
        </span>
      ))}
      <button type="button" className="clr" onClick={onClear}>Xóa tất cả</button>
      <span className="res">Hiển thị <b>{shown}</b>/{total} {UNIT}</span>
    </div>
  );
}
