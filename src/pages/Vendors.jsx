import { useEffect, useMemo, useState, useRef } from 'react'
import { createVendor, deleteVendor, getVendors, updateVendor, shiftVendorToRecord } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const COMMENT_PREVIEW_COUNT = 1

function VendorMenu({ vendor, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [open])
  return (
    <div className="vendor-menu-wrap" ref={wrapRef}>
      <button className="more-button" aria-label="More options" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="vendor-menu-dropdown">
          <button type="button" className="vendor-menu-item" onClick={() => { onEdit(vendor); setOpen(false) }}>
            <span className="vendor-menu-icon">✎</span>
            Edit Details
          </button>
          <button type="button" className="vendor-menu-item danger" onClick={() => { onDelete(vendor); setOpen(false) }}>
            <span className="vendor-menu-icon">🗑</span>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function VendorCard({ v, onAction, onShift, onAddComment, onDeleteComment }) {
  const initials = (v.company || '').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  const hasLogo = v.logo && String(v.logo).trim()
  const [logoError, setLogoError] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const showLogo = hasLogo && !logoError
  return (
    <article className="vendor-record-card">
      <div className="vendor-record-header">
        <div className="vendor-record-profile">
          <div className="vendor-record-logo">
            {showLogo ? (
              <img src={v.logo} alt={v.company} onError={() => setLogoError(true)} />
            ) : (
              initials || 'VN'
            )}
          </div>
          <h3 className="vendor-record-name">{v.company?.toUpperCase() || 'VENDOR'}</h3>
        </div>
        <VendorMenu vendor={v} onEdit={(vend) => onAction('edit', vend)} onDelete={(vend) => onAction('delete', vend)} />
      </div>

      <div className="vendor-record-meta">
        <span className="meta-item"><span className="meta-label">Company Type :</span> <span className="meta-value">{v.type}</span></span>
        <span className="meta-sep" aria-hidden="true" />
        <span className="meta-item"><span className="meta-label">Company Size :</span> <span className="meta-value">{v.size}</span></span>
      </div>
      <div className="vendor-record-meta">
        <span className="meta-item"><span className="meta-label">HR Name :</span> <span className="meta-value">{v.hrName}</span></span>
        <span className="meta-sep" aria-hidden="true" />
        <span className="meta-item"><span className="meta-label">E-mail :</span> <span className="meta-value">{v.email}</span></span>
        <span className="meta-sep" aria-hidden="true" />
        <span className="meta-item"><span className="meta-label">Contact Number :</span> <span className="meta-value">{v.phone}</span></span>
      </div>
      <div className="vendor-record-meta">
        <span className="meta-item"><span className="meta-label">Training Skills/Technologies Required :</span> <span className="meta-value">{v.skills}</span></span>
      </div>
      <div className="vendor-record-meta">
        <span className="meta-item"><span className="meta-label">Hiring Type :</span> <span className="meta-value">{v.hiring}</span></span>
        <span className="meta-sep" aria-hidden="true" />
        <span className="meta-item"><span className="meta-label">Mode :</span> <span className="meta-value">{v.mode}</span></span>
      </div>

      <div className="trainer-comment-section">
        <div className="trainer-comment-head">
          <span className="trainer-comment-label">
            Comments{v.comments?.length ? ` (${v.comments.length})` : ''}
          </span>
          <button type="button" className="trainer-add-comment" onClick={() => onAddComment(v)}>
            <span className="trainer-add-comment-icon">+</span>
            Add
          </button>
        </div>
        {v.comments?.length > 0 && (() => {
          const comments = [...v.comments].reverse()
          const showAll = commentsExpanded || comments.length <= COMMENT_PREVIEW_COUNT
          const visibleComments = showAll ? comments : comments.slice(0, COMMENT_PREVIEW_COUNT)
          return (
            <>
              <ul className="trainer-comment-list">
                {visibleComments.map((c) => (
                  <li key={c.id} className="trainer-comment-item">
                    <div className="trainer-comment-avatar">{c.authorInitials}</div>
                    <div className="trainer-comment-body">
                      <div className="trainer-comment-meta">
                        <span className="trainer-comment-author">{c.authorName}</span>
                        <span className="trainer-comment-time">{c.createdAt}</span>
                        <button type="button" className="trainer-comment-delete" onClick={() => onDeleteComment?.(v, c.id)} aria-label="Delete comment">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                        </button>
                      </div>
                      <div className="trainer-comment-bubble">
                        {c.verified && (
                          <span className="trainer-comment-check" aria-hidden="true">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                          </span>
                        )}
                        {c.text}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {comments.length > COMMENT_PREVIEW_COUNT && (
                <button type="button" className="trainer-view-comments" onClick={() => setCommentsExpanded((e) => !e)}>
                  {commentsExpanded ? 'Show less' : `View more (${comments.length - COMMENT_PREVIEW_COUNT})`}
                </button>
              )}
            </>
          )
        })()}
      </div>

      {onShift && (
        <div className="shift-to-record-bar">
          <button type="button" className="shift-to-record-btn" onClick={() => onShift(v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
            Shift to Record
          </button>
        </div>
      )}
    </article>
  )
}

const VENDOR_FORM_FIELDS = [
  ['company', 'Company'],
  ['type', 'Company Type'],
  ['size', 'Company Size'],
  ['status', 'Status'],
  ['hrName', 'HR Name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['skills', 'Training Skills/Technologies Required'],
  ['hiring', 'Hiring Type'],
  ['mode', 'Mode'],
  ['logo', 'Logo URL (optional)'],
]

const VENDOR_DEFAULTS = {
  company: '',
  type: 'IT Firm',
  size: '50-60 employees',
  status: 'Active',
  hrName: '',
  email: '',
  phone: '',
  skills: '',
  hiring: 'Full-Time Trainer',
  mode: 'Offline Mode',
  logo: '',
  comments: [],
}

function AddEditVendorModal({ open, vendor, isAdd, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...VENDOR_DEFAULTS })
  useEffect(() => {
    if (isAdd) setForm({ ...VENDOR_DEFAULTS })
    else if (vendor) setForm({ ...VENDOR_DEFAULTS, ...vendor })
  }, [vendor, isAdd, open])
  if (!open) return null
  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(isAdd ? form : { ...vendor, ...form })
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content edit-vendor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add Vendor' : 'Edit Vendor Details'}</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="edit-vendor-form">
            {VENDOR_FORM_FIELDS.map(([key, label]) => (
              <label key={key}>
                <span>{label}</span>
                <input
                  type="text"
                  value={form[key] ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={label}
                />
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{isAdd ? 'Create' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddCommentModal({ open, vendor, onClose, onSubmit, currentUserName }) {
  const [text, setText] = useState('')
  if (!open || !vendor) return null
  const initials = currentUserName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'AD'
  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit(vendor, { authorName: currentUserName || 'Admin', authorInitials: initials, text: text.trim(), createdAt: 'Just now', verified: false })
    setText('')
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content trainer-comment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Comment</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label>
            <span>Comment</span>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your comment..." rows={3} required />
          </label>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Comment</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Vendors({ globalSearch, mode = 'records' }) {
  const isRegistrations = mode === 'registrations'
  const source = isRegistrations ? 'website' : 'admin'
  const { user } = useAuth()
  const [vendors, setVendors] = useState([])
  const [modalOpen, setModalOpen] = useState(null) // null = closed, 'add' = add, vendor = edit
  const [commentModal, setCommentModal] = useState(null)
  const [localQuery, setLocalQuery] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    getVendors({ source }).then(setVendors).catch(() => {})
  }, [source])

  const query = (globalSearch || '').trim().toLowerCase()
  const qLocal = (localQuery || '').trim().toLowerCase()
  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      const blob = `${v.company || ''} ${v.type || ''} ${v.hrName || ''} ${v.email || ''} ${v.phone || ''} ${v.skills || ''} ${v.hiring || ''} ${v.mode || ''} ${v.status || ''}`.toLowerCase()
      const matchesQuery = (!query || blob.includes(query)) && (!qLocal || blob.includes(qLocal))
      const matchesFilter =
        !filter || filter === 'All' ||
        (filter === 'Active' && v.status === 'Active') ||
        (filter === 'On-hold' && v.status === 'On-hold') ||
        (filter === 'IT Firm' && v.type === 'IT Firm') ||
        (filter === 'Training Institute' && v.type === 'Training Institute')
      return matchesQuery && matchesFilter
    })
  }, [vendors, query, qLocal, filter])

  function handleAction(action, v) {
    if (action === 'delete') {
      if (!confirm(`Delete vendor "${v.company}"?`)) return
      setVendors((cur) => cur.filter((x) => x.id !== v.id))
      deleteVendor(v.id).catch(() => {})
      return
    }
    if (action === 'active') {
      updateVendor(v.id, { ...v, status: 'Active' }).then((res) => setVendors((cur) => cur.map((x) => (x.id === v.id ? res : x))))
      return
    }
    if (action === 'hold') {
      updateVendor(v.id, { ...v, status: 'On-hold' }).then((res) => setVendors((cur) => cur.map((x) => (x.id === v.id ? res : x))))
      return
    }
    if (action === 'edit') {
      setModalOpen(v)
    }
  }

  function handleCreate(form) {
    createVendor({ ...form, comments: form.comments || [] })
      .then((res) => {
        setVendors((cur) => [res, ...cur])
        setModalOpen(null)
      })
      .catch(() => {
        setVendors((cur) => [{ ...form, id: Date.now() }, ...cur])
        setModalOpen(null)
      })
  }

  function handleEdit(updated) {
    setVendors((cur) => cur.map((v) => (v.id === updated.id ? updated : v)))
    updateVendor(updated.id, updated).catch(() => {})
  }

  function handleAddComment(vendor, comment) {
    const newComment = { ...comment, id: `c-${Date.now()}` }
    const updated = { ...vendor, comments: [...(vendor.comments || []), newComment] }
    setVendors((cur) => cur.map((v) => (v.id === vendor.id ? updated : v)))
    updateVendor(vendor.id, updated).catch(() => {})
  }

  function handleDeleteComment(vendor, commentId) {
    const updated = { ...vendor, comments: (vendor.comments || []).filter((c) => c.id !== commentId) }
    setVendors((cur) => cur.map((v) => (v.id === vendor.id ? updated : v)))
    updateVendor(vendor.id, updated).catch(() => {})
  }

  function handleShiftToRecord(v) {
    if (!confirm(`Shift "${v.company}" to Vendor Records?`)) return
    setVendors((cur) => cur.filter((x) => x.id !== v.id))
    shiftVendorToRecord(v.id).catch(() => {
      setVendors((cur) => [v, ...cur])
    })
  }

  return (
    <>
      <div className="hero-card hero-card-vendor">
        <div>
          <h2>{isRegistrations ? 'Vendor Registration' : 'Vendor Management'}</h2>
          <p>
            {isRegistrations
              ? 'Website company signups. Review details and shift approved vendors to Vendor Records.'
              : 'Manage company and vendor profiles that hire trainers through Trainer Adda.'}
          </p>
        </div>
        {!isRegistrations && (
          <button type="button" className="add-vendor-figma" onClick={() => setModalOpen('add')} aria-label="Add Vendor">
            <span className="add-vendor-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            <span className="add-vendor-label">Add Vendor</span>
          </button>
        )}
      </div>
      <div className="filters">
        <div className="filters-title">{isRegistrations ? 'Registration Search & Filters' : 'Vendor Search & Filters'}</div>
        <div className="filters-row">
          <label>
            <span>Search</span>
            <input value={localQuery} onChange={(e) => setLocalQuery(e.target.value)} type="text" placeholder="Search here..." />
          </label>
          <label>
            <span>Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Filter by</option>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="On-hold">On-hold</option>
              <option value="IT Firm">IT Firm</option>
              <option value="Training Institute">Training Institute</option>
            </select>
          </label>
        </div>
      </div>
      <div className="vendor-section">
        <div className="vendor-title">
          {isRegistrations ? 'VENDOR REGISTRATIONS' : 'VENDOR LIST'} ({String(filtered.length).padStart(2, '0')})
        </div>
        <div className="vendor-list">
          {filtered.map((v) => (
            <VendorCard
              key={v.id}
              v={v}
              onAction={handleAction}
              onShift={isRegistrations ? handleShiftToRecord : undefined}
              onAddComment={setCommentModal}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      </div>
      <AddEditVendorModal
        open={!!modalOpen}
        vendor={modalOpen === 'add' ? null : modalOpen}
        isAdd={modalOpen === 'add'}
        onClose={() => setModalOpen(null)}
        onSubmit={(data) => (modalOpen === 'add' ? handleCreate(data) : handleEdit(data))}
      />
      <AddCommentModal
        open={!!commentModal}
        vendor={commentModal}
        onClose={() => setCommentModal(null)}
        onSubmit={handleAddComment}
        currentUserName={user?.name}
      />
    </>
  )
}
