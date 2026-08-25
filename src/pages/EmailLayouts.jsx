import { useCallback, useEffect, useState, useRef } from 'react'
import {
  getEmailLayouts,
  getEmailLayout,
  createEmailLayout,
  updateEmailLayout,
  duplicateEmailLayout,
  deleteEmailLayout,
} from '../services/api.js'
import CampaignToast from '../components/CampaignToast.jsx'

const SAMPLE_BODY = '<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#1f2937;">Hi {{trainerName}},</p><p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">We have a new training requirement that matches your profile.</p><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#64748b;">Subject, location, mode, duration, and payout details appear here.</p>'

const EMPTY_FORM = { name: '', headerHtml: '', footerHtml: '', isDefault: false }

function withPreviewTags(html) {
  return String(html ?? '')
    .replace(/\{\{logoUrl\}\}/g, 'https://res.cloudinary.com/dc4gqqd35/image/upload/w_280,f_auto,q_auto/v1787319069/traineradda_bfnnbn.jpg')
    .replace(/\{\{siteUrl\}\}/g, 'https://traineradda.com')
    .replace(/\{\{unsubscribeUrl\}\}/g, '#')
    .replace(/\{\{trainerName\}\}/g, 'Sample Trainer')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function LayoutMenu({ layout, onEdit, onDuplicate, onSetDefault, onDelete, disabled }) {
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
        disabled={disabled}
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
          <button type="button" className="comm-menu-item" onClick={() => { onEdit(layout.id); setOpen(false) }}>
            Edit layout
          </button>
          <button type="button" className="comm-menu-item" onClick={() => { onDuplicate(layout); setOpen(false) }}>
            Duplicate
          </button>
          {!layout.isDefault && (
            <button type="button" className="comm-menu-item" onClick={() => { onSetDefault(layout); setOpen(false) }}>
              Set as default
            </button>
          )}
          {!layout.isProtected && (
            <button type="button" className="comm-menu-item comm-menu-item--danger" onClick={() => { onDelete(layout); setOpen(false) }}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EmailPreviewFrame({ headerHtml, footerHtml, compact }) {
  const bodyPlaceholder = `
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#1f2937;">Hi Sample Trainer,</p>
    <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.75;color:#374151;">We have a new training requirement that matches your profile.</p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:#64748b;font-style:italic;">Campaign body (changes every send)</p>`
  const html = withPreviewTags(`${headerHtml || ''}${bodyPlaceholder}${footerHtml || ''}`)

  return (
    <div className={`comm-email-preview ${compact ? 'comm-email-preview--compact' : ''}`}>
      <div className="comm-email-preview-inner" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}

function DeleteConfirmModal({ layout, onClose, onConfirm, busy }) {
  const [confirmName, setConfirmName] = useState('')
  const canDelete = confirmName.trim() === layout.name

  return (
    <div className="modal-overlay" onClick={() => !busy && onClose()}>
      <div className="modal-content comm-layout-delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete layout?</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={busy}>×</button>
        </div>
        <p className="comm-layout-delete-text">
          This permanently removes <strong>{layout.name}</strong>. Type the layout name to confirm.
        </p>
        {layout.campaignCount > 0 && (
          <div className="compose-alert compose-alert--error">
            Used by {layout.campaignCount} campaign(s). Reassign those campaigns first.
          </div>
        )}
        <label>
          Layout name
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={layout.name}
            disabled={busy || layout.campaignCount > 0}
            autoFocus
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary comm-btn-danger"
            disabled={!canDelete || busy || layout.campaignCount > 0}
            onClick={onConfirm}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LayoutEditorModal({ modalKey, mode, layoutId, onClose, onSaved }) {
  const isAdd = mode === 'add'
  const [loading, setLoading] = useState(!isAdd)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [loadedId, setLoadedId] = useState(null)

  useEffect(() => {
    if (isAdd) {
      setForm(EMPTY_FORM)
      setLoadedId('new')
      setLoading(false)
      setError('')
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError('')
    setForm(EMPTY_FORM)
    setLoadedId(null)

    getEmailLayout(layoutId)
      .then((layout) => {
        if (cancelled) return
        setForm({
          name: layout.name || '',
          headerHtml: layout.headerHtml || '',
          footerHtml: layout.footerHtml || '',
          isDefault: Boolean(layout.isDefault),
        })
        setLoadedId(layout.id)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load this layout. Close and try again.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [modalKey, isAdd, layoutId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, saving])

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))
  const ready = isAdd || (!loading && loadedId === layoutId)
  const previewHtml = withPreviewTags(`${form.headerHtml}${SAMPLE_BODY}${form.footerHtml}`)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ready || saving || !form.name.trim()) return

    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        headerHtml: form.headerHtml,
        footerHtml: form.footerHtml,
        isDefault: form.isDefault,
      }
      if (isAdd) await createEmailLayout(payload)
      else await updateEmailLayout(layoutId, payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <div className="modal-content comm-layout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add email layout' : 'Edit email layout'}</h3>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving}>×</button>
        </div>
        <p className="comm-modal-hint">Header and footer stay the same; only the middle body changes per campaign.</p>

        {error && <div className="compose-alert compose-alert--error" role="alert">{error}</div>}

        {loading ? (
          <div className="comm-layout-modal-loading">
            <div className="comm-loading-spinner" />
            <p>Loading layout…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="comm-layout-modal-grid">
              <div className="comm-layout-form-fields">
                <label>
                  Layout name
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. TrainerAdda Standard"
                    required
                    disabled={!ready || saving}
                  />
                </label>
                <label>
                  Header HTML
                  <textarea
                    rows={8}
                    value={form.headerHtml}
                    onChange={(e) => setField('headerHtml', e.target.value)}
                    placeholder="Logo, banner, branding…"
                    disabled={!ready || saving}
                  />
                </label>
                <label>
                  Footer HTML
                  <textarea
                    rows={8}
                    value={form.footerHtml}
                    onChange={(e) => setField('footerHtml', e.target.value)}
                    placeholder="Include {{unsubscribeUrl}} for opt-out link"
                    disabled={!ready || saving}
                  />
                </label>
                <label className="comm-checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.isDefault}
                    onChange={(e) => setField('isDefault', e.target.checked)}
                    disabled={!ready || saving}
                  />
                  Use as default layout for new campaigns
                </label>
              </div>
              <div className="comm-layout-modal-preview">
                <span className="comm-preview-label">Live preview</span>
                <EmailPreviewFrame headerHtml={form.headerHtml} footerHtml={form.footerHtml} />
                <details className="comm-preview-full">
                  <summary>Full HTML preview</summary>
                  <pre className="comm-layout-html-dump">{previewHtml}</pre>
                </details>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={!ready || saving || !form.name.trim()}>
                {saving ? 'Saving…' : isAdd ? 'Create layout' : 'Save layout'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function EmailLayouts() {
  const [layouts, setLayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editor, setEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEmailLayouts()
      setLayouts(Array.isArray(data) ? data : [])
    } catch {
      setToast('Failed to load layouts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openAdd = () => setEditor({ mode: 'add', key: `add-${Date.now()}` })
  const openEdit = (layoutId) => setEditor({ mode: 'edit', layoutId, key: `edit-${layoutId}-${Date.now()}` })

  const runAction = async (fn, successMsg) => {
    setBusy(true)
    try {
      await fn()
      await load()
      if (successMsg) setToast(successMsg)
    } catch (err) {
      setToast(err.response?.data?.error || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await deleteEmailLayout(deleteTarget.id)
      setDeleteTarget(null)
      await load()
      setToast('Layout deleted')
    } catch (err) {
      setToast(err.response?.data?.error || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="comm-page">
      <CampaignToast message={toast} onClose={() => setToast('')} />

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
        <button type="button" className="btn btn-primary comm-page-cta" onClick={openAdd} disabled={busy}>
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
          <p>Create your first email layout for campaigns.</p>
          <button type="button" className="btn btn-primary" onClick={openAdd}>Create layout</button>
        </div>
      ) : (
        <div className="comm-layout-grid">
          {layouts.map((layout) => (
            <article key={layout.id} className="comm-layout-card">
              <div className="comm-layout-card-head">
                <div>
                  <h3 title={layout.name}>{layout.name}</h3>
                  <div className="comm-layout-card-meta">
                    {layout.isDefault && <span className="comm-badge">Default</span>}
                    {layout.isProtected && <span className="comm-badge comm-badge--muted">Protected</span>}
                    <span className="comm-layout-updated">Updated {formatDate(layout.updatedAt)}</span>
                  </div>
                  {(layout.campaignCount ?? 0) > 0 && (
                    <p className="comm-layout-campaigns">{layout.campaignCount} campaign{layout.campaignCount === 1 ? '' : 's'} using this</p>
                  )}
                </div>
                <LayoutMenu
                  layout={layout}
                  onEdit={openEdit}
                  onDuplicate={(l) => runAction(() => duplicateEmailLayout(l.id), `Duplicated "${l.name}"`)}
                  onSetDefault={(l) => runAction(
                    () => updateEmailLayout(l.id, {
                      name: l.name,
                      headerHtml: l.headerHtml,
                      footerHtml: l.footerHtml,
                      isDefault: true,
                    }),
                    `"${l.name}" set as default`
                  )}
                  onDelete={setDeleteTarget}
                  disabled={busy}
                />
              </div>

              <EmailPreviewFrame
                headerHtml={layout.headerHtml}
                footerHtml={layout.footerHtml}
                compact
              />

              <button
                type="button"
                className="btn btn-secondary comm-btn-sm comm-layout-edit-btn"
                onClick={() => openEdit(layout.id)}
                disabled={busy}
              >
                Edit layout
              </button>
            </article>
          ))}
        </div>
      )}

      {editor && (
        <LayoutEditorModal
          key={editor.key}
          modalKey={editor.key}
          mode={editor.mode}
          layoutId={editor.layoutId}
          onClose={() => !busy && setEditor(null)}
          onSaved={async () => {
            setBusy(true)
            try {
              await load()
              setEditor(null)
              setToast(editor.mode === 'add' ? 'Layout created' : 'Layout saved')
            } finally {
              setBusy(false)
            }
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          layout={deleteTarget}
          onClose={() => !busy && setDeleteTarget(null)}
          onConfirm={handleDelete}
          busy={busy}
        />
      )}
    </div>
  )
}
