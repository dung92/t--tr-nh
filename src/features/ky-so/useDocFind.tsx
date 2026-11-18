import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { clearHits, currentPage, findHits, keepPage, PAGE_H, pagesOf, scrollToHit, snippet, type Hit } from './docFind';
import { IconChevronDown, IconChevronUp, IconList, IconSearch, IconX } from './icons';

/** Thanh “Tìm trong văn bản” (VER20): như bản gốc, chữ tìm và tùy chọn được giữ lại khi đổi văn bản / mở lại. */
export interface DocFindState {
  open: boolean;
  q: string;
  /** Phân biệt hoa/thường */
  cs: boolean;
  /** Khớp đúng dấu tiếng Việt (mặc định tìm không dấu) */
  mk: boolean;
  /** Khớp nguyên từ */
  wd: boolean;
  /** Phạm vi: mọi trang / trang đang xem */
  sc: 'all' | 'cur';
  /** Hiện danh sách kết quả theo trang */
  list: boolean;
}
export const DOC_FIND_0: DocFindState = { open: false, q: '', cs: false, mk: false, wd: false, sc: 'all', list: false };

interface FindResult {
  q: string;
  hits: { pg: number; pre: string; hit: string; post: string }[];
  /** Kết quả đang chọn (-1: không có) */
  hi: number;
}

interface Options {
  /** Vùng cuộn chứa tờ giấy (.vw-doc / .pv-doc) */
  hostRef: RefObject<HTMLElement | null>;
  /** Tờ giấy (.paper) */
  paperRef: RefObject<HTMLElement | null>;
  /** Đổi khi đổi văn bản → tìm lại trên văn bản mới */
  docKey: string;
  find: DocFindState;
  onFindChange: (find: DocFindState) => void;
}

/**
 * Logic + giao diện thanh tìm của VER20 §7 (vfBar / vfRun / vfStep / vfList) dùng chung cho trình xem hồ sơ và khung xem trước.
 * Gọi SAU hiệu ứng đặt zoom tờ giấy (để tính trang theo đúng tỷ lệ). Trả về thanh tìm (đặt ngay trước vùng cuộn, như bản gốc),
 * vạch ngắt trang (nối vào cuối tờ giấy) và hàm mở/đóng cho nút tìm và Ctrl+F.
 */
export function useDocFind({ hostRef, paperRef, docKey, find, onFindChange }: Options) {
  const [pages, setPages] = useState(1);
  const [runQ, setRunQ] = useState(find.q);          // chữ tìm đã áp dụng (gõ xong 160 ms mới tìm)
  const [res, setRes] = useState<FindResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null), hitsRef = useRef<Hit[]>([]), focusFind = useRef(false);

  useEffect(() => {
    if (find.q === runQ) return;
    const t = setTimeout(() => setRunQ(find.q), 160);
    return () => clearTimeout(t);
  }, [find.q, runQ]);

  // vfRun: bọc kết quả, tính trang, chọn kết quả đầu
  useLayoutEffect(() => {
    const pp = paperRef.current, host = hostRef.current;
    if (!find.open || !pp || !host) return;
    setPages(pagesOf(pp));
    const q = runQ.trim();
    if (!q) { hitsRef.current = []; setRes({ q: '', hits: [], hi: -1 }); return; }
    let hits = findHits(pp, q, find);
    if (find.sc === 'cur') hits = keepPage(pp, hits, currentPage(host, pp));
    hitsRef.current = hits;
    if (hits.length) { hits[0].el.classList.add('on'); scrollToHit(host, hits[0].el, 'auto'); }
    setRes({ q, hits: hits.map(h => ({ pg: h.pg, ...snippet(h.el) })), hi: hits.length ? 0 : -1 });
    return () => { clearHits(pp); hitsRef.current = []; };
  }, [find.open, runQ, find.cs, find.mk, find.wd, find.sc, docKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // vfStep: chọn kết quả thứ i
  const select = (i: number) => {
    const H = hitsRef.current, host = hostRef.current; if (!res || !H.length || !host) return;
    const hi = ((i % H.length) + H.length) % H.length;
    H.forEach((h, k) => h.el.classList.toggle('on', k === hi));
    scrollToHit(host, H[hi].el, 'smooth');
    setRes({ ...res, hi });
  };
  const openFind = (focus: boolean) => {
    if (find.open) { if (focus) { inputRef.current?.focus(); inputRef.current?.select(); } return; }
    focusFind.current = focus;
    onFindChange({ ...find, open: true });
  };
  const closeFind = () => onFindChange({ ...find, open: false });
  const toggle = () => (find.open ? closeFind() : openFind(true));
  useLayoutEffect(() => {
    if (find.open && focusFind.current && inputRef.current) { focusFind.current = false; inputRef.current.focus(); inputRef.current.select(); }
  }, [find.open]);

  const fcText = !res || !res.q ? '' : !res.hits.length ? 'Không thấy' : `${res.hi + 1}/${res.hits.length} · trang ${res.hits[res.hi].pg}`;
  const byPage = new Map<number, number[]>();
  res?.hits.forEach((h, i) => byPage.set(h.pg, (byPage.get(h.pg) || []).concat(i)));
  const markers = find.open && pages > 1
    ? Array.from({ length: pages - 1 }, (_, k) => <div key={k} className="v20-pb" style={{ top: (k + 1) * PAGE_H }}><span>{`Trang ${k + 2}`}</span></div>)
    : null;

  const bar: ReactNode = find.open && (
    <>
      <div className="v20-fb" role="search">
        <label className="v20-fi">
          <IconSearch />
          <input ref={inputRef} type="search" placeholder="Tìm trong văn bản…" aria-label="Tìm trong văn bản" value={find.q}
            onChange={e => onFindChange({ ...find, q: e.target.value })}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); if (res) select(res.hi + (e.shiftKey ? -1 : 1)); }
              if (e.key === 'Escape') { e.preventDefault(); closeFind(); }
            }} />
        </label>
        <span className={'v20-fc' + (res && res.q && !res.hits.length ? ' no' : '')} aria-live="polite">{fcText}</span>
        <button type="button" data-f="prev" title="Kết quả trước (Shift+Enter)" aria-label="Kết quả trước" onClick={() => res && select(res.hi - 1)}><IconChevronUp /></button>
        <button type="button" data-f="next" title="Kết quả sau (Enter)" aria-label="Kết quả sau" onClick={() => res && select(res.hi + 1)}><IconChevronDown /></button>
        <span className="sep" />
        <button type="button" className="t" data-f="cs" aria-pressed={find.cs} title="Phân biệt chữ hoa/thường" onClick={() => onFindChange({ ...find, cs: !find.cs })}>Aa</button>
        <button type="button" className="t" data-f="mk" aria-pressed={find.mk} title="Khớp đúng dấu tiếng Việt (mặc định tìm không dấu)" onClick={() => onFindChange({ ...find, mk: !find.mk })}>á</button>
        <button type="button" className="t" data-f="wd" aria-pressed={find.wd} title="Khớp nguyên từ" onClick={() => onFindChange({ ...find, wd: !find.wd })}>[ab]</button>
        <select data-f="sc" aria-label="Phạm vi tìm" value={find.sc} onChange={e => onFindChange({ ...find, sc: e.target.value as DocFindState['sc'] })}>
          <option value="all">Mọi trang</option>
          <option value="cur">Trang đang xem</option>
        </select>
        <button type="button" className="t" data-f="list" aria-pressed={find.list} title="Danh sách kết quả theo từng trang" onClick={() => onFindChange({ ...find, list: !find.list })}><IconList /></button>
        <button type="button" data-f="close" title="Đóng (Esc)" aria-label="Đóng tìm kiếm" onClick={closeFind}><IconX /></button>
      </div>
      <div className="v20-fr" hidden={!find.list || !runQ.trim()}>
        {!res || !res.hits.length ? <div className="v20-fre">Không có kết quả</div> : [...byPage.keys()].sort((a, b) => a - b).map(pg => (
          <Fragment key={pg}>
            <div className="pg"><b>{`Trang ${pg}`}</b><span>{`${byPage.get(pg)!.length} kết quả`}</span></div>
            {byPage.get(pg)!.map(i => (
              <button key={i} type="button" className={'it' + (i === res.hi ? ' on' : '')} data-i={i} onClick={() => select(i)}>
                {res.hits[i].pre}<mark>{res.hits[i].hit}</mark>{res.hits[i].post}
              </button>
            ))}
          </Fragment>
        ))}
      </div>
    </>
  );

  return { bar, markers, openFind, toggle };
}
