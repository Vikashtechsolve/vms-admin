import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getWhatsAppTemplates,
  getWhatsAppStatus,
  syncWhatsAppTemplates,
  updateWhatsAppTemplate,
  deleteWhatsAppTemplate,
} from '../services/api.js'
import CampaignToast from '../components/CampaignToast.jsx'
import WhatsAppPreviewBubble from '../components/WhatsAppPreviewBubble.jsx'

export default function WhatsAppTemplates() {
  const [templates, setTemplates] = useState([])
  const [status, setStatus] = useState({ configured: false })
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([getWhatsAppTemplates(), getWhatsAppStatus()])
      .then(([items, st]) => {
        setTemplates(Array.isArray(items) ? items : [])
        setStatus(st || { configured: false })
      })
      .catch(() => {
        setTemplates([])
        setStatus({ configured: false })
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSync() {
    setSyncing(true)
    try {
      const result = await syncWhatsAppTemplates()
      setTemplates(result.items || [])
      setToast(`Synced ${result.synced} template(s) from Meta`)
    } catch (e) {
      setToast(e.response?.data?.error || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function toggleActive(template) {
    try {
      await updateWhatsAppTemplate(template.id, { isActive: !template.isActive })
      load()
      setToast(template.isActive ? 'Template deactivated' : 'Template activated')
    } catch {
      setToast('Update failed')
    }
  }

  async function handleDelete(template) {
    if (!window.confirm(`Delete template "${template.name}"?`)) return
    try {
      await deleteWhatsAppTemplate(template.id)
      load()
      setToast('Template deleted')
    } catch {
      setToast('Delete failed')
    }
  }

  return (
    <div className="comm-page">
      <CampaignToast message={toast} onClose={() => setToast('')} />

      <header className="comm-page-header">
        <div className="comm-page-header-text">
          <div className="comm-page-icon comm-page-icon--whatsapp" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <h2 className="comm-page-title">WhatsApp Templates</h2>
            <p className="comm-page-desc">
              Approved Meta templates for bulk trainer opening alerts. Sync from your WhatsApp Business account.
            </p>
          </div>
        </div>
        <div className="compose-header-actions">
          <Link to="/campaigns" className="btn btn-secondary">Campaigns</Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSync}
            disabled={!status.configured || syncing}
          >
            {syncing ? 'Syncing…' : 'Sync from Meta'}
          </button>
        </div>
      </header>

      {!status.configured && (
        <div className="compose-alert compose-alert--warn">
          WhatsApp is not configured on the server. Add <code>WHATSAPP_ACCESS_TOKEN</code> and{' '}
          <code>WHATSAPP_PHONE_NUMBER_ID</code> to your backend environment.
        </div>
      )}

      {loading ? (
        <div className="comm-loading"><div className="comm-loading-spinner" /><p>Loading templates…</p></div>
      ) : templates.length === 0 ? (
        <div className="comm-empty">
          <p>No WhatsApp templates yet.</p>
          {status.configured && (
            <button type="button" className="btn btn-primary" onClick={handleSync} disabled={syncing}>
              Sync from Meta
            </button>
          )}
        </div>
      ) : (
        <div className="wa-template-grid">
          {templates.map((t) => (
            <article key={t.id} className={`wa-template-card${t.isActive ? ' wa-template-card--active' : ''}`}>
              <div className="wa-template-card-head">
                <h3>{t.name}</h3>
                <span className={`wa-template-status wa-template-status--${t.status}`}>{t.status}</span>
              </div>
              <p className="wa-template-lang">{t.language?.toUpperCase() || 'EN'} · {t.category || 'MARKETING'}</p>
              <WhatsAppPreviewBubble text={t.bodyPreview || 'No preview'} compact className="wa-template-chat-preview" />
              <p className="wa-template-vars">
                Variables: {(t.variableMapping || []).join(' → ') || 'firstName → requirementTitle → requirementBody'}
              </p>
              <div className="wa-template-actions">
                <button type="button" className="btn btn-secondary comm-btn-sm" onClick={() => toggleActive(t)}>
                  {t.isActive ? 'Deactivate' : 'Set active'}
                </button>
                <button type="button" className="btn btn-ghost comm-btn-sm" onClick={() => handleDelete(t)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
