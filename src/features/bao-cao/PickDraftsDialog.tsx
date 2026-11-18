import { Fragment, useState } from 'react';
import { SAMPLE_CASE, SAMPLE_DOCS } from '../ho-so/data';
import { IconFolder, IconInfo } from '../ky-so/icons';
import { KysoModal } from '../ky-so/KysoModal';
import { fold } from '../to-trinh/filter';
import { DRAFTS, USERS } from './data';
import { treeIndex } from './HoSoTreePanel';

const IDX = treeIndex();
/** Trạng thái ký của văn bản dự thảo chưa đưa vào luồng (draftSt): dự thảo */
const ST = (_id: string): [string, string] => ['Dự thảo', 'y'];
const STATES = ['Dự thảo', 'Trình ký', 'Đã ký nháy'];

/**
 * “Chọn văn bản dự thảo từ Hồ sơ điện tử” (renderPick + V36): lọc theo trạng thái, tìm theo tên/người ký,
 * nhóm theo tập hồ sơ, chọn nhiều dòng / chọn tất cả; “Chọn” trả về danh sách theo thứ tự DRAFTS.
 */
export function PickDraftsDialog({ selected, onOk, onClose }: { selected: string[]; onOk: (ids: string[]) => void; onClose: () => void }) {
  const [sel, setSel] = useState<Set<string>>(() => new Set(selected));
  const [st, setSt] = useState('all');
  const [q, setQ] = useState('');
  const all = Object.keys(DRAFTS);
  const fq = fold(q.trim());
  const doc = (id: string) => SAMPLE_DOCS.find(d => d.id === id);
  const vis = all.filter(id => (st === 'all' || ST(id)[0] === st) && (!fq || fold(`${DRAFTS[id].name} ${USERS[DRAFTS[id].signer]?.name ?? ''}`).includes(fq)));
  const groups = [...new Set(vis.map(id => doc(id)?.folder || ''))];
  const allOn = vis.length > 0 && vis.every(id => sel.has(id));
  const toggle = (id: string) => setSel(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const toggleAll = () => setSel(s => { const n = new Set(s); vis.forEach(id => (allOn ? n.delete(id) : n.add(id))); return n; });
  return (
    <KysoModal cls="lg v18-pick v36-pick" onClose={onClose} footCenter={false}
      head={<div><b>Chọn văn bản dự thảo từ Hồ sơ điện tử</b><small>{`Hồ sơ tố tụng điện tử vụ án ${SAMPLE_CASE.ma} · văn bản có trạng thái từ Chưa ký trở xuống`}</small></div>}
      foot={<>
        <span className="muted">Đã chọn <b style={{ color: 'var(--tx)' }}>{sel.size}</b> văn bản</span>
        <div className="r">
          <button type="button" className="btn w160" data-act="close" onClick={onClose}>Đóng</button>
          <button type="button" className="btn pri w160" data-act="pkok" onClick={() => onOk(all.filter(id => sel.has(id)))}>Chọn</button>
        </div>
      </>}>
      <div className="flt">
        <div className="seg">
          {['all', ...STATES].map(k => (
            <button key={k} type="button" className={st === k ? 'on' : ''} data-act={'pk36st:' + k} onClick={() => setSt(k)}>
              {(k === 'all' ? 'Tất cả' : k) + ' '}<i className="n">{k === 'all' ? all.length : all.filter(id => ST(id)[0] === k).length}</i>
            </button>
          ))}
        </div>
        <label className="f" style={{ width: 300, marginLeft: 'auto' }}>
          <input className="pkQ" placeholder=" " value={q} autoComplete="off" onChange={e => setQ(e.target.value)} />
          <span className="fl">Tìm theo tên văn bản, người ký</span>
        </label>
      </div>
      <div className="v36-note"><IconInfo /><span>Văn bản đã <b>ký số</b>, đã cấp số hoặc đã ban hành không hiển thị (không trình ký lại).</span></div>
      <div className="tw"><table className="tb">
        <thead><tr>
          <th style={{ width: 44 }}><input type="checkbox" data-act="pkall" checked={allOn} onChange={toggleAll} aria-label="Chọn tất cả" /></th>
          <th>Tên văn bản</th><th style={{ width: 120 }}>Số văn bản</th><th style={{ width: 104 }}>Ngày</th><th>Người ký</th><th style={{ width: 116 }}>Trạng thái</th>
        </tr></thead>
        <tbody>
          {groups.map(g => {
            const ids = vis.filter(id => (doc(id)?.folder || '') === g);
            return (
              <Fragment key={g}>
                <tr className="grp"><td colSpan={6}><IconFolder />{` ${IDX.path(g)} · ${ids.length} văn bản`}</td></tr>
                {ids.map(id => {
                  const D = DRAFTS[id], on = sel.has(id), s = ST(id);
                  return (
                    <tr key={id} className={'click' + (on ? ' sel' : '')} data-act="pkrow" data-id={id} onClick={() => toggle(id)}>
                      <td><input type="checkbox" tabIndex={-1} checked={on} readOnly /></td>
                      <td style={{ minWidth: 260 }}>{D.name}<span className="sub">{D.mau}</span></td>
                      <td className="nw">{doc(id)?.so || '(chưa cấp số)'}</td>
                      <td className="nw">{D.ngay}</td>
                      <td className="nw">{USERS[D.signer]?.name}<span className="sub">{USERS[D.signer]?.role}</span></td>
                      <td className="nw"><span className={'bd sm ' + s[1]}>{s[0]}</span></td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
          {!vis.length && <tr><td colSpan={6} className="empty">Chưa có dữ liệu</td></tr>}
        </tbody>
      </table></div>
    </KysoModal>
  );
}
