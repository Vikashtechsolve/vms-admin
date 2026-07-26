import { useEffect, useRef, useState } from 'react'
import {
  getImportantLinks,
  createImportantLink,
  updateImportantLink,
  deleteImportantLink,
} from '../services/api.js'

function LinkMenu({ link, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const fn = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [open])

  return (
    <div className="important-link-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        className="important-link-more"
        aria-label="More options"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
      {open && (
        <div className="important-link-menu-dropdown" role="menu">
          <button
            type="button"
            className="important-link-menu-item"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(link)
              setOpen(false)
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="important-link-menu-item danger"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(link)
              setOpen(false)
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function AddEditLinkModal({ open, link, isAdd, onClose, onSubmit }) {
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!open) return
    if (isAdd) {
      setDescription('')
      setUrl('')
    } else if (link) {
      setDescription(link.description || '')
      setUrl(link.url || '')
    }
  }, [open, isAdd, link])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedDesc = description.trim()
    const trimmedUrl = url.trim()
    if (!trimmedDesc || !trimmedUrl) return
    onSubmit({
      ...(isAdd ? {} : { id: link.id }),
      description: trimmedDesc,
      url: trimmedUrl,
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content important-links-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add Link' : 'Edit Link'}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
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
              autoFocus
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
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isAdd ? 'Add Link' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LinkCard({ link, onEdit, onDelete }) {
  const handleClick = (e) => {
    if (e.target.closest('.important-link-menu-wrap')) return
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
      <LinkMenu link={link} onEdit={onEdit} onDelete={onDelete} />
    </article>
  )
}

export default function ImportantLinks() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(null) // null | 'add' | link object
  const [error, setError] = useState(null)

  const fetchLinks = async () => {
    try {
      const data = await getImportantLinks()
      setLinks(Array.isArray(data) ? data : [])
      setError(null)
    } catch {
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
    setLinks((prev) => [...prev, { id: tempId, ...payload }])
    setError(null)
    try {
      const created = await createImportantLink(payload)
      setLinks((prev) => prev.map((l) => (l.id === tempId ? created : l)))
    } catch (e) {
      console.error('Failed to add link', e)
      setLinks((prev) => prev.filter((l) => l.id !== tempId))
      setError('Failed to save link. Is the server running?')
    }
  }

  const handleEdit = async (payload) => {
    if (!payload?.id) return
    const previous = links.find((l) => l.id === payload.id)
    setLinks((prev) => prev.map((l) => (l.id === payload.id ? { ...l, ...payload } : l)))
    setError(null)
    try {
      const updated = await updateImportantLink(payload.id, {
        description: payload.description,
        url: payload.url,
      })
      setLinks((prev) => prev.map((l) => (l.id === payload.id ? updated : l)))
    } catch (e) {
      console.error('Failed to update link', e)
      if (previous) setLinks((prev) => prev.map((l) => (l.id === payload.id ? previous : l)))
      setError('Failed to update link. Please try again.')
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
    const previous = links
    setLinks((prev) => prev.filter((l) => l.id !== link.id))
    try {
      await deleteImportantLink(link.id)
    } catch (e) {
      console.error('Failed to delete link', e)
      setLinks(previous)
      setError('Failed to delete link. Please try again.')
    }
  }

  return (
    <div className="important-links-page">
      <div className="important-links-header">
        <h2 className="important-links-title">Important Links</h2>
        <button
          type="button"
          className="btn btn-primary important-links-add"
          onClick={() => setModalOpen('add')}
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
          <p>
            No links yet. Click <strong>Add Links</strong> to add your first one.
          </p>
        </div>
      ) : (
        <div className="important-links-grid">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              onEdit={(l) => setModalOpen(l)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AddEditLinkModal
        open={!!modalOpen}
        link={modalOpen === 'add' ? null : modalOpen}
        isAdd={modalOpen === 'add'}
        onClose={() => setModalOpen(null)}
        onSubmit={(data) => (modalOpen === 'add' ? handleAdd(data) : handleEdit(data))}
      />
    </div>
  )
}
