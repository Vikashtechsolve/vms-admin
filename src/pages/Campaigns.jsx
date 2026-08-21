import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCampaigns, deleteCampaign, duplicateCampaign } from '../services/api.js'

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'processing', label: 'Sending' },
  { value: 'queued', label: 'Queued' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const PAGE_SIZE = 30

function StatusBadge({ status }) {
  const label = status === 'processing' ? 'Sending' : status.replace('_', ' ')
  return <span className={`comm-status comm-status--${status}`}>{label}</span>
}

function formatShortDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function CampaignMenu({ campaign, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [open])

  return (
    <div className="comm-menu-wrap" ref={ref}>
      <button
        type="button"
        className="comm-menu-btn comm-menu-btn--sm"
        aria-expanded={open}
        aria-label="Campaign actions"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
      {open && (
        <div className="comm-menu-dropdown comm-menu-dropdown--align-end" role="menu">
          <button type="button" className="comm-menu-item" onClick={(e) => { e.stopPropagation(); onDuplicate(campaign.id); setOpen(false) }}>
            Duplicate
          </button>
          {campaign.status === 'draft' && (
            <button type="button" className="comm-menu-item comm-menu-item--danger" onClick={(e) => { e.stopPropagation(); onDelete(campaign); setOpen(false) }}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function Campaigns() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [meta, setMeta] = useState({ total: 0, pages: 1 })

  useEffect(() => {
    setLoading(true)
    const params = { page, limit: PAGE_SIZE }
    if (statusFilter) params.status = statusFilter
    getCampaigns(params)
      .then((data) => {
        setItems(data.items || [])
        setMeta({ total: data.total || 0, pages: data.pages || 1 })
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  const handleDelete = async (campaign) => {
    if (!window.confirm('Delete this draft campaign?')) return
    await deleteCampaign(campaign.id)
    setPage(1)
    const data = await getCampaigns({ page: 1, limit: PAGE_SIZE, status: statusFilter || undefined })
    setItems(data.items || [])
    setMeta({ total: data.total || 0, pages: data.pages || 1 })
  }

  const handleDuplicate = async (id) => {
    const copy = await duplicateCampaign(id)
    navigate(`/campaigns/${copy.id}/edit`)
  }

  const pageSent = items.reduce((n, c) => n + (c.channelStats?.email?.sentCount || 0), 0)
  const pageFailed = items.reduce((n, c) => n + (c.channelStats?.email?.failedCount || 0), 0)

  return (
    <div className="comm-page">
      <header className="comm-page-header">
        <div className="comm-page-header-text">
          <div className="comm-page-icon comm-page-icon--campaign" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
          <div>
            <h2 className="comm-page-title">Campaigns</h2>
            <p className="comm-page-desc">
              {meta.total} campaign{meta.total !== 1 ? 's' : ''}
              {items.length > 0 && (
                <span className="comm-page-desc-meta">
                  · {pageSent} sent on this page · {pageFailed} failed
                </span>
              )}
            </p>
          </div>
        </div>
        <Link to="/campaigns/new" className="btn btn-primary comm-page-cta">
          <span className="comm-cta-icon">+</span>
          New Campaign
        </Link>
      </header>

      <div className="comm-toolbar comm-toolbar--compact">
        <div className="comm-filter-pills" role="tablist" aria-label="Filter by status">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              role="tab"
              aria-selected={statusFilter === f.value}
              className={`comm-filter-pill ${statusFilter === f.value ? 'active' : ''}`}
              onClick={() => { setStatusFilter(f.value); setPage(1) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="comm-loading comm-loading--compact">
          <div className="comm-loading-spinner" />
          <p>Loading campaigns…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="comm-empty">
          <div className="comm-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <h3>No campaigns found</h3>
          <p>
            {statusFilter
              ? 'Try a different filter or create a new campaign.'
              : 'Create your first campaign to notify trainers about college requirements.'}
          </p>
          <Link to="/campaigns/new" className="btn btn-primary">Create campaign</Link>
        </div>
      ) : (
        <div className="comm-table-wrap comm-campaign-table-wrap">
          <table className="comm-campaign-table">
            <thead>
              <tr>
                <th className="comm-th-subject">Subject</th>
                <th>Status</th>
                <th>Created</th>
                <th className="comm-th-num">Recipients</th>
                <th className="comm-th-num">Sent</th>
                <th className="comm-th-num">Failed</th>
                <th className="comm-th-actions" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const emailStats = c.channelStats?.email || {}
                const isLive = ['queued', 'processing'].includes(c.status)
                return (
                  <tr
                    key={c.id}
                    className="comm-campaign-row"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="comm-td-subject">
                      <span className="comm-campaign-subject">{c.subject || 'Untitled campaign'}</span>
                      {c.createdBy && (
                        <span className="comm-campaign-by">{c.createdBy}</span>
                      )}
                    </td>
                    <td>
                      <div className="comm-campaign-status-cell">
                        <StatusBadge status={c.status} />
                        {isLive && <span className="comm-live-dot" title="Sending in progress" />}
                      </div>
                    </td>
                    <td className="comm-td-muted">{formatShortDate(c.createdAt)}</td>
                    <td className="comm-td-num">{emailStats.totalRecipients || 0}</td>
                    <td className="comm-td-num comm-td-success">{emailStats.sentCount || 0}</td>
                    <td className="comm-td-num comm-td-danger">{emailStats.failedCount || 0}</td>
                    <td className="comm-td-actions">
                      <div className="comm-campaign-row-actions">
                        {c.status === 'draft' && (
                          <Link
                            to={`/campaigns/${c.id}/edit`}
                            className="comm-row-action comm-row-action--primary"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Edit
                          </Link>
                        )}
                        <CampaignMenu campaign={c} onDuplicate={handleDuplicate} onDelete={handleDelete} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.pages > 1 && (
        <nav className="comm-pagination comm-pagination--bar" aria-label="Campaign pages">
          <span className="comm-pagination-info">
            Showing page {page} of {meta.pages} ({meta.total} total)
          </span>
          <div className="comm-pagination-buttons">
            <button type="button" className="btn btn-secondary comm-btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <button type="button" className="btn btn-secondary comm-btn-sm" disabled={page >= meta.pages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
