import { useMemo } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const STORAGE_KEY = 'trainer-list-page-size'

export function readStoredPageSize() {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY))
    return PAGE_SIZE_OPTIONS.includes(value) ? value : 20
  } catch {
    return 20
  }
}

export function storePageSize(size) {
  try {
    localStorage.setItem(STORAGE_KEY, String(size))
  } catch {
    /* ignore quota / private mode */
  }
}

/** Builds a compact page list with ellipsis, e.g. 1 … 4 5 6 … 12 */
function buildPageList(page, pages) {
  if (pages <= 1) return [1]
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)

  const items = new Set([1, pages, page, page - 1, page + 1])
  const sorted = [...items].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  const out = []

  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…')
    out.push(sorted[i])
  }
  return out
}

export default function TrainerPagination({
  page,
  pages,
  total,
  pageSize,
  loading = false,
  onPageChange,
  onPageSizeChange,
}) {
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, total)
  const pageList = useMemo(() => buildPageList(page, pages), [page, pages])

  if (total === 0) return null

  return (
    <nav className="trainer-pagination" aria-label="Trainer list pagination">
      <div className="trainer-pagination-summary">
        <span className="trainer-pagination-range">
          Showing <strong>{rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}</strong> of{' '}
          <strong>{total.toLocaleString()}</strong>
        </span>

        <label className="trainer-page-size">
          <span>Per page</span>
          <select
            value={pageSize}
            disabled={loading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Records per page"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </label>
      </div>

      {pages > 1 && (
        <div className="trainer-pagination-controls">
          <button
            type="button"
            className="pg-btn pg-btn--edge"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(1)}
            aria-label="First page"
          >
            «
          </button>
          <button
            type="button"
            className="pg-btn"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>

          <div className="pg-pages" role="group" aria-label="Page numbers">
            {pageList.map((item, index) =>
              item === '…' ? (
                <span key={`gap-${index}`} className="pg-ellipsis" aria-hidden="true">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`pg-btn pg-btn--num${item === page ? ' pg-btn--active' : ''}`}
                  disabled={loading}
                  aria-current={item === page ? 'page' : undefined}
                  onClick={() => onPageChange(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            className="pg-btn"
            disabled={page >= pages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
          <button
            type="button"
            className="pg-btn pg-btn--edge"
            disabled={page >= pages || loading}
            onClick={() => onPageChange(pages)}
            aria-label="Last page"
          >
            »
          </button>
        </div>
      )}
    </nav>
  )
}
