import { useEffect, useState } from 'react'
import { getImportantLinks, createImportantLink, deleteImportantLink } from '../services/api.js'

function AddLinkModal({ open, onClose, onSubmit }) {
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')

  const reset = () => {
    setDescription('')
    setUrl('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedDesc = description.trim()
    const trimmedUrl = url.trim()
    if (!trimmedDesc || !trimmedUrl) return
    const payload = { description: trimmedDesc, url: trimmedUrl }
    reset()
    onClose()
    onSubmit(payload)
  }

  if (!open) return null
  return (
    <div className="modal-overlay" onClick={handleClose} aria-hidden="true">
      <div className="modal-content important-links-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Link</h3>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Trainer Adda Documentation"
              required
            />
          </label>
          <label>
            Link (URL)
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Link
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LinkCard({ link, onDelete }) {
  const handleClick = (e) => {
    if (e.target.closest('.important-link-card-delete')) return
    const u = link.url?.trim()
    if (u) {
      const href = u.startsWith('http') ? u : `https://${u}`
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }

  const displayUrl = link.url?.replace(/^https?:\/\//, '').replace(/\/$/, '') || link.url

  return (
    <article
      className="important-link-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick(e)
        }
      }}
      aria-label={`Open ${link.description}: ${displayUrl}`}
    >
      <div className="important-link-card-inner">
        <span className="important-link-card-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </span>
        <div className="important-link-card-body">
          <h3 className="important-link-card-title">{link.description}</h3>
          <p className="important-link-card-url">{displayUrl}</p>
        </div>
        <span className="important-link-card-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17L17 7M17 7H7M17 7v10" />
          </svg>
        </span>
      </div>
      <button
        type="button"
        className="important-link-card-delete"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(link)
        }}
        aria-label={`Delete ${link.description}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
    </article>
  )
}

export default function ImportantLinks() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)

  const fetchLinks = async () => {
    try {
      const data = await getImportantLinks()
      setLinks(Array.isArray(data) ? data : [])
      setError(null)
    } catch (e) {
      setLinks([])
      setError('Could not load links.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleAdd = async (payload) => {
    const tempId = `temp-${Date.now()}`
    const optimisticLink = { id: tempId, ...payload }
    setLinks((prev) => [...prev, optimisticLink])
    setError(null)
    try {
      await createImportantLink(payload)
      await fetchLinks()
    } catch (e) {
      console.error('Failed to add link', e)
      setLinks((prev) => prev.filter((l) => l.id !== tempId))
      setError('Failed to save link. Is the server running on port 3001?')
    }
  }

  const handleDelete = async (link) => {
    if (!link?.id) return
    const isTemp = String(link.id).startsWith('temp-')
    if (isTemp) {
      setLinks((prev) => prev.filter((l) => l.id !== link.id))
      return
    }
    if (!window.confirm(`Remove "${link.description}"?`)) return
    try {
      await deleteImportantLink(link.id)
      await fetchLinks()
    } catch (e) {
      console.error('Failed to delete link', e)
    }
  }

  return (
    <div className="important-links-page">
      <div className="important-links-header">
        <h2 className="important-links-title">Important Links</h2>
        <button
          type="button"
          className="btn btn-primary important-links-add"
          onClick={() => setModalOpen(true)}
        >
          <span className="important-links-add-icon">+</span>
          Add Links
        </button>
      </div>

      {error && (
        <p className="important-links-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="important-links-loading">Loading links…</p>
      ) : links.length === 0 ? (
        <div className="important-links-empty">
          <p>No links yet. Click <strong>Add Links</strong> to add your first one.</p>
        </div>
      ) : (
        <div className="important-links-grid">
          {links.map((link) => (
            <LinkCard key={link.id} link={link} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <AddLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  )
}
