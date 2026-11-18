import { FLOW_MODES } from '../data';
import type { FlowMode } from '../types';

/** “Mô phỏng luồng:” (.v18-cap) – chọn luồng ký số, kèm ghi chú của luồng đang chọn. */
export function FlowModeSwitch({ value, onChange }: { value: FlowMode; onChange: (m: FlowMode) => void }) {
  const cur = FLOW_MODES.find(m => m.value === value) ?? FLOW_MODES[0];
  return (
    <div className="v18-cap">
      <span>Mô phỏng luồng:</span>
      <div className="seg" role="radiogroup" aria-label="Mô phỏng luồng">
        {FLOW_MODES.map(m => (
          <button type="button" key={m.value} className={m.value === value ? 'on' : ''} title={m.title} role="radio" aria-checked={m.value === value} onClick={() => onChange(m.value)}>
            {m.label}
          </button>
        ))}
      </div>
      <span className="v18-caph">{cur.note}</span>
    </div>
  );
}
