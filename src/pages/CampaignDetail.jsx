import { useEffect, useState, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getCampaign,
  getCampaignRecipients,
  cancelCampaign,
} from '../services/api.js'
import { audienceSourceLabel, parseAudienceSource } from '../utils/audienceSource.js'

function StatusBadge({ status }) {
  const label = status === 'processing' ? 'Sending' : status.replace('_', ' ')
  return <span className={`comm-status comm-status--${status}`}>{label}</span>
}

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SELECTION_LABELS = {
  all: 'All matching',
  filter: 'Filtered audience',
  manual: 'Manual selection',
}

function formatAudienceScope(campaign) {
  const mode = SELECTION_LABELS[campaign.selectionMode] || campaign.selectionMode
  const source = audienceSourceLabel(parseAudienceSource(campaign.audienceFilter))
  return `${mode} · ${source}`
}

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [recipients, setRecipients] = useState([])
  const [recipientMeta, setRecipientMeta] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    const params = { page, limit: 50 }
    if (statusFilter) params.status = statusFilter

    try {
      const [campaignData, recipientData] = await Promise.all([
        getCampaign(id),
        getCampaignRecipients(id, params),
      ])
      setCampaign(campaignData)
      setRecipients(recipientData.items || [])
      setRecipientMeta({
        page: recipientData.page,
        pages: recipientData.pages,
        total: recipientData.total,
      })
    } catch {
      setCampaign(null)
      setRecipients([])
    }
  }, [id, page, statusFilter])

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    if (!campaign || !['queued', 'processing'].includes(campaign.status)) return
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [campaign?.status, load])

  const handleCancel = async () => {
    if (!window.confirm('Cancel this campaign? Pending emails will not be sent.')) return
    await cancelCampaign(id)
    await load()
  }

  if (loading && !campaign) {
    return (
      <div className="comm-page">
        <div className="comm-loading comm-loading--compact">
          <div className="comm-loading-spinner" />
          <p>Loading campaign…</p>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="comm-page">
        <div className="comm-empty">
          <h3>Campaign not found</h3>
          <Link to="/campaigns" className="btn btn-secondary">Back to campaigns</Link>
        </div>
      </div>
    )
  }

  const emailStats = campaign.channelStats?.email || {}
  const progress = emailStats.totalBatches
    ? Math.round((emailStats.completedBatches / emailStats.totalBatches) * 100)
    : 0
  const isLive = ['queued', 'processing'].includes(campaign.status)
  const isDraft = campaign.status === 'draft'

  return (
    <div className="comm-page comm-detail-page">
      <header className="comm-detail-header">
        <div className="comm-detail-header-main">
          <Link to="/campaigns" className="comm-detail-back" aria-label="Back to campaigns">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Campaigns
          </Link>
          <h2 className="comm-detail-title">{campaign.subject || 'Untitled campaign'}</h2>
          <div className="comm-detail-meta">
            <StatusBadge status={campaign.status} />
            {isLive && <span className="comm-live-dot" title="Sending in progress" />}
            <span>{formatAudienceScope(campaign)}</span>
            {campaign.createdBy && <span>by {campaign.createdBy}</span>}
            <span>{formatDateTime(campaign.createdAt)}</span>
          </div>
        </div>
        <div className="comm-detail-actions">
          {campaign.status === 'draft' && (
            <Link to={`/campaigns/${id}/edit`} className="btn btn-primary comm-btn-sm">Edit</Link>
          )}
          {isLive && (
            <button type="button" className="btn btn-secondary comm-btn-sm comm-btn-danger-text" onClick={handleCancel}>
              Cancel send
            </button>
          )}
        </div>
      </header>

      {isLive && (
        <div className="comm-detail-live">
          <div className="comm-detail-live-text">
            <span className="comm-live-dot" />
            Sending in progress — {progress}% complete
          </div>
          <div className="comm-detail-progress">
            <div className="comm-detail-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="comm-detail-stats-bar">
        <div className="comm-detail-stat">
          <span>Sent</span>
          <strong className="comm-detail-stat--success">{emailStats.sentCount || 0}</strong>
        </div>
        <div className="comm-detail-stat">
          <span>Failed</span>
          <strong className="comm-detail-stat--danger">{emailStats.failedCount || 0}</strong>
        </div>
        <div className="comm-detail-stat">
          <span>Skipped</span>
          <strong>{emailStats.skippedCount || 0}</strong>
        </div>
        <div className="comm-detail-stat">
          <span>Recipients</span>
          <strong>{emailStats.totalRecipients || 0}</strong>
        </div>
      </div>

      {isDraft && emailStats.totalRecipients === 0 && (
        <div className="comm-info-banner comm-detail-draft-hint">
          <span className="comm-info-banner-icon">ℹ</span>
          <span>
            This draft has not been sent yet.{' '}
            <Link to={`/campaigns/${id}/edit`}>Edit campaign</Link> to choose audience and send.
          </span>
        </div>
      )}

      <section className="comm-detail-section">
        <div className="comm-detail-section-head">
          <h3>Recipients</h3>
          <div className="comm-detail-section-tools">
            <span className="comm-detail-count">{recipientMeta.total} total</span>
            <select
              className="comm-detail-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              aria-label="Filter recipients by status"
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="skipped">Skipped</option>
            </select>
          </div>
        </div>

        <div className="comm-table-wrap">
          <table className="comm-campaign-table comm-recipients-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {recipients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="comm-table-empty">
                    {isDraft && !statusFilter
                      ? 'No recipients yet — send the campaign to populate this list.'
                      : 'No recipients match this filter'}
                  </td>
                </tr>
              ) : recipients.map((r) => (
                <tr key={r.id} className="comm-recipient-row">
                  <td className="comm-recipient-name">{r.trainerName || '—'}</td>
                  <td className="comm-td-muted">{r.address || r.trainerEmail || '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td className="comm-recipient-error">{r.errorMessage || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {recipientMeta.pages > 1 && (
          <nav className="comm-pagination comm-pagination--bar comm-detail-pagination" aria-label="Recipient pages">
            <span className="comm-pagination-info">
              Page {page} of {recipientMeta.pages}
            </span>
            <div className="comm-pagination-buttons">
              <button
                type="button"
                className="btn btn-secondary comm-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-secondary comm-btn-sm"
                disabled={page >= recipientMeta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </nav>
        )}
      </section>
    </div>
  )
}
