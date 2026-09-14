import styles from "../../styles/AdminReports.module.css";
export function pageRows(rows, page, size) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.max(1, Math.min(page, pages));
  return { rows: rows.slice((current - 1) * size, current * size), page: current, pages };
}
export default function Pagination({ page, pages, total, size = 10, onPage, onSize, disabled }) {
  return <div className={styles.pagination}><span>{total} records</span><div>
    {onSize && <label>Rows <select aria-label="Rows per page" value={size} onChange={(event) => { onSize(Number(event.target.value)); onPage(1); }}>{[10,20,50].map((value) => <option key={value}>{value}</option>)}</select></label>}
    <button disabled={disabled || page <= 1} aria-label="Previous page" onClick={() => onPage(page - 1)}>←</button>
    <span>Page {page} of {pages}</span><button disabled={disabled || page >= pages} aria-label="Next page" onClick={() => onPage(page + 1)}>→</button>
  </div></div>;
}
