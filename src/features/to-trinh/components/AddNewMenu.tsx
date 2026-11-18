import { useEffect, useRef, useState } from 'react';
import { ADD_NEW_DISABLED, ADD_NEW_ITEMS } from '../data';
import { IconDown, IconPlus } from '../icons';
import type { AddNewKind } from '../types';

/** Nút “Thêm mới” + menu thả xuống (.dd / .dd-menu của app Ký số). */
export function AddNewMenu({ onCreate }: { onCreate?: (kind: AddNewKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const pick = (kind: AddNewKind) => { setOpen(false); onCreate?.(kind); };

  return (
    <div className={'dd' + (open ? ' open' : '')} ref={ref}>
      <button className="btn pri" type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <IconPlus /> Thêm mới <IconDown />
      </button>
      <div className="dd-menu" style={{ minWidth: 320 }} role="menu">
        {ADD_NEW_ITEMS.map(it => (
          <div key={it.kind} className="mi" role="menuitem" tabIndex={open ? 0 : -1} data-act={'newbc:' + it.kind}
            onClick={() => pick(it.kind)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(it.kind); } }}>
            <b>{it.title}{it.isNew && <> <span className="bd sm g" style={{ marginLeft: 4 }}>Mới</span></>}</b>
            <span>{it.desc}</span>
          </div>
        ))}
        <div className="sepm" role="separator" />
        {ADD_NEW_DISABLED.map(it => (
          <div key={it.title} className="mi dis" role="menuitem" aria-disabled="true">
            <b>{it.title}</b>
            <span>{it.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
