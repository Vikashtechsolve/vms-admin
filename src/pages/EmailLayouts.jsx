import { useEffect, useState, useRef } from 'react'
import {
  getEmailLayouts,
  createEmailLayout,
  updateEmailLayout,
  deleteEmailLayout,
} from '../services/api.js'

const SAMPLE_BODY = '<p style="margin:0 0 12px;">Hi {{trainerName}},</p><p style="margin:0;color:#64748b;">Your campaign body content appears here — requirements, dates, payout, etc.</p>'

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api\/?$/, '')

function withPreviewTags(html) {
  return String(html ?? '')
    .replace(/\{\{logoUrl\}\}/g, 'https://res.cloudinary.com/dc4gqqd35/image/upload/w_280,f_auto,q_auto/v1787319069/traineradda_bfnnbn.jpg')
    .replace(/\{\{siteUrl\}\}/g, 'https://traineradda.com')
    .replace(/\{\{unsubscribeUrl\}\}/g, '#')
    .replace(/\{\{trainerName\}\}/g, 'Sample Trainer')
}

function LayoutMenu({ layout, onEdit, onDelete }) {
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
        className="comm-menu-btn"
        aria-expanded={open}
        aria-label="Layout actions"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
      {open && (
        <div className="comm-menu-dropdown" role="menu">
          <button type="button" className="comm-menu-item" onClick={() => { onEdit(layout); setOpen(false) }}>
            Edit layout
          </button>
          <button type="button" className="comm-menu-item comm-menu-item--danger" onClick={() => { onDelete(layout); setOpen(false) }}>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function EmailPreviewFrame({ headerHtml, footerHtml, compact }) {
  const bodyPlaceholder = `
    <div style="padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#94a3b8;font-style:italic;text-align:center;background-color:#ffffff;border-top:1px dashed #e5e7eb;border-bottom:1px dashed #e5e7eb;">
      Campaign body (changes every send)
    </div>`
  const html = withPreviewTags(`${headerHtml || ''}${bodyPlaceholder}${footerHtml || ''}`)

  return (
    <div className={`comm-email-preview ${compact ? 'comm-email-preview--compact' : ''}`}>
      <div className="comm-email-preview-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function LayoutModal({ open, layout, isAdd, onClose, onSave }) {
  const [name, setName] = useState('')
  const [headerHtml, setHeaderHtml] = useState('')
  const [footerHtml, setFooterHtml] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (!open) return
    if (isAdd) {
      setName('')
      setHeaderHtml('')
      setFooterHtml('')
      setIsDefault(false)
    } else if (layout) {
      setName(layout.name || '')
      setHeaderHtml(layout.headerHtml || '')
      setFooterHtml(layout.footerHtml || '')
      setIsDefault(Boolean(layout.isDefault))
    }
  }, [open, isAdd, layout])

  if (!open) return null

  const previewHtml = withPreviewTags(`${headerHtml}${SAMPLE_BODY}${footerHtml}`)

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content comm-layout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add email layout' : 'Edit email layout'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <p className="comm-modal-hint">Header and footer stay the same; only the middle body changes per campaign.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            onSave({ name, headerHtml, footerHtml, isDefault })
            onClose()
          }}
        >
          <div className="comm-layout-modal-grid">
            <div className="comm-layout-form-fields">
              <label>
                Layout name
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. TrainerAdda Standard" required />
              </label>
              <label>
                Header HTML
                <textarea rows={5} value={headerHtml} onChange={(e) => setHeaderHtml(e.target.value)} placeholder="Logo, banner, branding…" />
              </label>
              <label>
                Footer HTML
                <textarea rows={5} value={footerHtml} onChange={(e) => setFooterHtml(e.target.value)} placeholder="Include {{unsubscribeUrl}} for opt-out link" />
              </label>
              <label className="comm-checkbox-label">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
                Use as default layout for new campaigns
              </label>
            </div>
            <div className="comm-layout-modal-preview">
              <span className="comm-preview-label">Live preview</span>
              <EmailPreviewFrame headerHtml={headerHtml} footerHtml={footerHtml} />
              <details className="comm-preview-full">
                <summary>Full HTML preview</summary>
                <div className="comm-preview-html" dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </details>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save layout</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EmailLayouts() {
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = () => {
    setLoading(true)
    getEmailLayouts()
      .then((data) => setLayouts(Array.isArray(data) ? data : []))
      .catch(() => setLayouts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async (data) => {
    if (modal?.mode === 'add') await createEmailLayout(data)
    else await updateEmailLayout(modal.layout.id, data)
    load()
  }

  const handleDelete = async (layout) => {
    if (!window.confirm(`Delete layout "${layout.name}"?`)) return
    await deleteEmailLayout(layout.id)
    load()
  }

  return (
    <div className="comm-page">
      <header className="comm-page-header">
        <div className="comm-page-header-text">
          <div className="comm-page-icon comm-page-icon--layout" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
          <div>
            <h2 className="comm-page-title">Email Layouts</h2>
            <p className="comm-page-desc">Fixed header and footer for every email. Campaign body is written fresh each time.</p>
          </div>
        </div>
        <button type="button" className="btn btn-primary comm-page-cta" onClick={() => setModal({ mode: 'add' })}>
          <span className="comm-cta-icon">+</span>
          Add Layout
        </button>
      </header>

      <div className="comm-info-banner">
        <span className="comm-info-banner-icon" aria-hidden="true">💡</span>
        <p>
          <strong>Tip:</strong> Put your logo and branding in the header. Add <code>{'{{unsubscribeUrl}}'}</code> in the footer so trainers can opt out.
        </p>
      </div>

      {loading ? (
        <div className="comm-loading">
          <div className="comm-loading-spinner" />
          <p>Loading layouts…</p>
        </div>
      ) : layouts.length === 0 ? (
        <div className="comm-empty">
          <div className="comm-empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <h3>No layouts yet</h3>
          <p>A default layout is created on first server start. Add custom layouts for different branding.</p>
          <button type="button" className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            Create layout
          </button>
        </div>
      ) : (
        <div className="comm-layout-grid">
          {layouts.map((layout) => (
            <article key={layout.id} className="comm-layout-card">
              <div className="comm-layout-card-head">
                <div>
                  <h3>{layout.name}</h3>
                  {layout.isDefault && <span className="comm-badge">Default</span>}
                </div>
                <LayoutMenu layout={layout} onEdit={(l) => setModal({ mode: 'edit', layout: l })} onDelete={handleDelete} />
              </div>
              <EmailPreviewFrame headerHtml={layout.headerHtml} footerHtml={layout.footerHtml} compact />
              <button type="button" className="btn btn-secondary comm-btn-sm comm-layout-edit-btn" onClick={() => setModal({ mode: 'edit', layout })}>
                Edit layout
              </button>
            </article>
          ))}
        </div>
      )}

      <LayoutModal
        open={Boolean(modal)}
        isAdd={modal?.mode === 'add'}
        layout={modal?.layout}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
    </div>
  )
}
