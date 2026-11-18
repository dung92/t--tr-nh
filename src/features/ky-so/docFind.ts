/* “Tìm trong văn bản theo từng trang” – chuyển nguyên thuật toán VER20 §7 của app Ký số (vfFold, vfRun, vfSnip…).
   Làm việc trực tiếp trên DOM của tờ giấy như bản gốc (giống Ctrl+F): bọc kết quả bằng <mark class="v20-hit">,
   bỏ bọc + normalize() khi tìm lại / đóng thanh tìm. Tờ giấy là nội dung tĩnh nên React không đụng tới các nút chữ đã tách. */

/** V20.pg – chiều cao một trang A4 trên màn hình (px) */
export const PAGE_H = 1123;

export interface FindOptions {
  cs: boolean;
  mk: boolean;
  wd: boolean;
}

export interface Hit {
  el: HTMLElement;
  /** Trang chứa kết quả (1…) */
  pg: number;
}

/** Bỏ dấu (trừ khi khớp đúng dấu) và chữ hoa (trừ khi phân biệt hoa/thường) */
export function foldText(s: string, o: FindOptions) {
  let t = String(s);
  if (!o.mk) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
  if (!o.cs) t = t.toLowerCase();
  return t;
}

export const zoomOf = (p: HTMLElement) => { const z = parseFloat(p.style.zoom || '1'); return z > 0 ? z : 1; };
export const pagesOf = (p: HTMLElement) => Math.max(1, Math.ceil((p.scrollHeight - 4) / PAGE_H));

/** Trang đang xem: trang chứa điểm 35% chiều cao vùng cuộn */
export function currentPage(host: HTMLElement, p: HTMLElement) {
  const z = zoomOf(p), hr = host.getBoundingClientRect(), pr = p.getBoundingClientRect();
  return Math.min(pagesOf(p), Math.max(1, Math.floor((hr.top - pr.top + host.clientHeight * 0.35) / (PAGE_H * z)) + 1));
}

const unwrap = (m: Element) => m.replaceWith(document.createTextNode(m.textContent || ''));

export function clearHits(p: HTMLElement) {
  p.querySelectorAll('mark.v20-hit').forEach(unwrap);
  p.normalize();
}

const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);

/** Bọc mọi kết quả trong tờ giấy (bỏ qua nhãn vạch ngắt trang), trả về theo thứ tự trong văn bản kèm số trang. */
export function findHits(p: HTMLElement, q: string, o: FindOptions): Hit[] {
  const fq = foldText(q, o);
  if (!fq) return [];
  const wk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.parentElement && n.parentElement.closest('.v20-pb') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const nodes: Text[] = [];
  while (wk.nextNode()) nodes.push(wk.currentNode as Text);
  const marks: HTMLElement[] = [];
  nodes.forEach(n => {
    const t = n.nodeValue || '';
    // chuỗi đã gập + bản đồ vị trí về chuỗi gốc (một ký tự gốc có thể gập thành 0..n ký tự)
    let f = '';
    const map: number[] = [];
    for (let i = 0; i < t.length; i++) { const ch = foldText(t[i], o); for (let j = 0; j < ch.length; j++) { f += ch[j]; map.push(i); } }
    const segs: [number, number][] = [];
    let at = f.indexOf(fq);
    while (at >= 0) {
      const s = map[at], e = map[at + fq.length - 1] + 1;
      if (!o.wd || (!isWordChar(t[s - 1]) && !isWordChar(t[e]))) segs.push([s, e]);
      at = f.indexOf(fq, at + fq.length);
    }
    const loc: HTMLElement[] = [];
    for (let k = segs.length - 1; k >= 0; k--) {
      const r = document.createRange();
      r.setStart(n, segs[k][0]); r.setEnd(n, segs[k][1]);
      const m = document.createElement('mark'); m.className = 'v20-hit';
      try { r.surroundContents(m); loc.unshift(m); } catch { /* như bản gốc: bỏ qua đoạn không bọc được */ }
    }
    marks.push(...loc);
  });
  const z = zoomOf(p), pr = p.getBoundingClientRect();
  return marks.map(el => ({ el, pg: Math.floor((el.getBoundingClientRect().top - pr.top) / z / PAGE_H) + 1 }));
}

/** Phạm vi “Trang đang xem”: bỏ bọc các kết quả ở trang khác */
export function keepPage(p: HTMLElement, hits: Hit[], page: number) {
  hits.filter(h => h.pg !== page).forEach(h => unwrap(h.el));
  p.normalize();
  return hits.filter(h => h.pg === page);
}

/** Đoạn trích quanh kết quả cho danh sách kết quả (36 ký tự trước, 46 ký tự sau) */
export function snippet(m: HTMLElement) {
  const blk = (m.closest('p,div,td,li') as HTMLElement | null) || (m.parentElement as HTMLElement);
  const t = blk.textContent || '', full = m.textContent || '';
  let i = 0;
  const pre = document.createRange();
  try { pre.setStart(blk, 0); pre.setEnd(m, 0); i = pre.toString().length; } catch { i = t.indexOf(full); }
  const a = Math.max(0, i - 36), b = Math.min(t.length, i + full.length + 46);
  return { pre: (a > 0 ? '…' : '') + t.slice(a, i), hit: full, post: t.slice(i + full.length, b) + (b < t.length ? '…' : '') };
}

/** Cuộn vùng xem để kết quả nằm giữa */
export function scrollToHit(host: HTMLElement, m: HTMLElement, behavior: ScrollBehavior) {
  const r = m.getBoundingClientRect(), hr = host.getBoundingClientRect();
  host.scrollTo({ top: host.scrollTop + (r.top - hr.top) - host.clientHeight / 2, behavior });
}
