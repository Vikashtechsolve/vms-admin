import { useEffect, useState, useCallback, useRef } from 'react'
import { getTrainers, createTrainer, updateTrainer, deleteTrainer } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function TrainerMenu({ trainer, onEdit, onDelete }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const fn = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [open])
  return (
    <div className="trainer-menu-wrap" ref={wrapRef}>
      <button className="more-button" aria-label="More options" onClick={() => setOpen((o) => !o)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="6" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="18" r="1.5" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="trainer-menu-dropdown">
          <button type="button" className="trainer-menu-item" onClick={() => { onEdit(trainer); setOpen(false) }}>
            <span className="trainer-menu-icon">✎</span>
            Edit Details
          </button>
          <button type="button" className="trainer-menu-item danger" onClick={() => { onDelete(trainer); setOpen(false) }}>
            <span className="trainer-menu-icon">🗑</span>
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

const COMMENT_PREVIEW_COUNT = 1

function TrainerCard({ trainer, onAddComment, onDeleteComment, onEdit, onDelete }) {
  const initials = trainer.name.split(' ').map((n) => n[0]).join('').toUpperCase()
  const hasPhoto = trainer.photo && String(trainer.photo).trim()
  const [photoError, setPhotoError] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const showPhoto = hasPhoto && !photoError
  const handlePhotoError = useCallback(() => setPhotoError(true), [])
  return (
    <article className="trainer-record-card">
      <div className="trainer-record-header">
        <div className="trainer-record-profile">
          <div className="trainer-record-avatar">
            {showPhoto ? (
              <img src={trainer.photo} alt={trainer.name} onError={handlePhotoError} />
            ) : (
              initials
            )}
          </div>
          <h3 className="trainer-record-name">{trainer.name.toUpperCase()}</h3>
        </div>
        <TrainerMenu trainer={trainer} onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="trainer-record-meta">
        <span><span className="meta-label">Contact Number :</span> <span className="meta-value">{trainer.contact}</span></span>
        <span className="meta-sep"><span className="meta-label">Location :</span> <span className="meta-value">{trainer.location}</span></span>
      </div>
      <div className="trainer-record-meta">
        <span><span className="meta-label">Qualification :</span> <span className="meta-value">{trainer.qualification}</span></span>
        <span className="meta-sep"><span className="meta-label">Passing Year :</span> <span className="meta-value">{trainer.passingYear}</span></span>
        <span className="meta-sep"><span className="meta-label">Subject :</span> <span className="meta-value">{trainer.subject}</span></span>
      </div>
      <div className="trainer-record-meta">
        <span><span className="meta-label">Teaching Experience :</span> <span className="meta-value">{trainer.teachingExperience}</span></span>
        <span className="meta-sep"><span className="meta-label">Development Experience :</span> <span className="meta-value">{trainer.developmentExperience}</span></span>
        <span className="meta-sep"><span className="meta-label">Total Experience :</span> <span className="meta-value">{trainer.totalExperience}</span></span>
      </div>
      <div className="trainer-record-meta">
        <span><span className="meta-label">Work Looking for :</span> <span className="meta-value">{trainer.workLookingFor}</span></span>
        <span className="meta-sep"><span className="meta-label">Mode :</span> <span className="meta-value">{trainer.mode}</span></span>
        <span className="meta-sep"><span className="meta-label">Payout Expectations (Per hour) :</span> <span className="meta-value">{trainer.payoutExpectations}</span></span>
      </div>
      <div className="trainer-record-meta">
        <span><span className="meta-label">Uploaded Resume :</span> <span className="meta-value">
          {trainer.resume ? (
            <a href={trainer.resume} target="_blank" rel="noopener noreferrer" className="trainer-link">View Resume</a>
          ) : (
            <span className="text-gray-500">No resume uploaded</span>
          )}
        </span></span>
      </div>

      <div className="trainer-comment-section">
        <div className="trainer-comment-label">Comment :</div>
        {trainer.comments?.length > 0 && (() => {
          const comments = [...trainer.comments].reverse()
          const showAll = commentsExpanded || comments.length <= COMMENT_PREVIEW_COUNT
          const visibleComments = showAll ? comments : comments.slice(0, COMMENT_PREVIEW_COUNT)
          const hasMore = comments.length > COMMENT_PREVIEW_COUNT
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
                        <button type="button" className="trainer-comment-delete" onClick={() => onDeleteComment?.(trainer, c.id)} aria-label="Delete comment">
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
            </>
          )
        })()}
        <div className="trainer-comment-actions">
          {trainer.comments?.length > COMMENT_PREVIEW_COUNT && (
            <button type="button" className="trainer-view-comments" onClick={() => setCommentsExpanded((e) => !e)}>
              {commentsExpanded ? 'Show less' : `View more (${trainer.comments.length - COMMENT_PREVIEW_COUNT})`}
            </button>
          )}
          <button type="button" className="trainer-add-comment" onClick={() => onAddComment(trainer)}>
            <span className="trainer-add-comment-icon">+</span>
            Add Comment
          </button>
        </div>
      </div>
    </article>
  )
}

const TRAINER_FORM_FIELDS = [
  ['name', 'Name'],
  ['contact', 'Contact Number'],
  ['location', 'Location'],
  ['qualification', 'Qualification'],
  ['passingYear', 'Passing Year'],
  ['subject', 'Subject'],
  ['teachingExperience', 'Teaching Experience'],
  ['developmentExperience', 'Development Experience'],
  ['totalExperience', 'Total Experience'],
  ['workLookingFor', 'Work Looking for'],
  ['mode', 'Mode'],
  ['payoutExpectations', 'Payout Expectations (Per hour)'],
  ['photo', 'Photo URL (optional – or upload file below)'],
]

const TRAINER_DEFAULTS = {
  name: '',
  contact: '',
  location: '',
  qualification: '',
  passingYear: '',
  subject: '',
  teachingExperience: '',
  developmentExperience: '',
  totalExperience: '',
  workLookingFor: 'Full-Time Trainer',
  mode: 'Offline Mode',
  payoutExpectations: '',
  photo: '',
  comments: [],
}

function EditTrainerModal({ open, trainer, isAdd, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...TRAINER_DEFAULTS })
  const [photoFile, setPhotoFile] = useState(null)
  useEffect(() => {
    if (isAdd) {
      setForm({ ...TRAINER_DEFAULTS })
      setPhotoFile(null)
    } else if (trainer) {
      setForm({ ...TRAINER_DEFAULTS, ...trainer })
      setPhotoFile(null)
    }
  }, [trainer, isAdd, open])
  if (!open) return null
  function handleSubmit(e) {
    e.preventDefault()
    const payload = isAdd ? form : { ...trainer, ...form }
    onSubmit(payload, photoFile || undefined)
    onClose()
  }
  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div className="modal-content edit-trainer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isAdd ? 'Add New Trainer Profile' : 'Edit Trainer Details'}</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="edit-trainer-form">
            {TRAINER_FORM_FIELDS.map(([key, label]) => (
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
            <label className="edit-trainer-photo-upload">
              <span>Upload profile photo (stored in Cloudinary)</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              {photoFile && <span className="photo-filename">{photoFile.name}</span>}
            </label>
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

function AddCommentModal({ open, trainer, onClose, onSubmit, currentUserName }) {
  const [text, setText] = useState('')
  if (!open || !trainer) return null
  const initials = currentUserName?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'AD'
  function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onSubmit(trainer, { authorName: currentUserName || 'Admin', authorInitials: initials, text: text.trim(), createdAt: 'Just now', verified: false })
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

export default function Trainers() {
  const { user } = useAuth()
  const [trainers, setTrainers] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const [commentModal, setCommentModal] = useState(null)
  const [editModal, setEditModal] = useState(null) // null = closed, 'add' = add mode, trainer = edit

  useEffect(() => {
    getTrainers()
      .then(setTrainers)
      .catch(() => setTrainers([]))
  }, [])

  const filtered = trainers.filter((t) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || t.name.toLowerCase().includes(q)
    const matchFilter = !filter || filter === 'All' || (filter === 'Full-Time' && t.workLookingFor?.includes('Full')) || (filter === 'Part-Time' && t.workLookingFor?.includes('Part'))
    return matchSearch && matchFilter
  })

  function handleAddComment(trainer, comment) {
    const newComment = { ...comment, id: `c-${Date.now()}` }
    const updated = { ...trainer, comments: [...(trainer.comments || []), newComment] }
    setTrainers((cur) => cur.map((t) => (t.id === trainer.id ? updated : t)))
    updateTrainer(trainer.id, updated).catch(() => {})
  }

  function handleDeleteComment(trainer, commentId) {
    const updated = { ...trainer, comments: (trainer.comments || []).filter((c) => c.id !== commentId) }
    setTrainers((cur) => cur.map((t) => (t.id === trainer.id ? updated : t)))
    updateTrainer(trainer.id, updated).catch(() => {})
  }

  function handleCreateTrainer(form, photoFile) {
    const newTrainer = { ...form, comments: form.comments || [] }
    createTrainer(newTrainer, photoFile)
      .then((res) => setTrainers((cur) => [res, ...cur]))
      .catch(() => {})
  }

  function handleEditTrainer(payload, photoFile) {
    const id = payload.id
    updateTrainer(id, payload, photoFile)
      .then((res) => setTrainers((cur) => cur.map((t) => (t.id === id ? res : t))))
      .catch(() => {})
  }

  function handleDeleteTrainer(trainer) {
    if (!confirm(`Delete trainer "${trainer.name}"?`)) return
    setTrainers((cur) => cur.filter((t) => t.id !== trainer.id))
    deleteTrainer(trainer.id).catch(() => {})
  }

  return (
    <>
      <div className="hero-card">
        <div>
          <h2>Trainers</h2>
          <p>Manage trainer profiles, verify details, and maintain accurate training records!</p>
        </div>
        <div className="trainer-add-card" onClick={() => setEditModal('add')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setEditModal('add')}>
          <span className="trainer-add-icon">+</span>
          <span className="trainer-add-text">Create New Trainer Profile</span>
        </div>
      </div>
      <div className="filters">
        <div className="filters-title">Trainer Search & Filters</div>
        <div className="filters-row">
          <label>
            <span>Search By Name</span>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            <span>Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Filter by</option>
              <option value="All">All</option>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
            </select>
          </label>
        </div>
      </div>
      <div className="vendor-section">
        <div className="vendor-title">TRAINER LIST ({String(filtered.length).padStart(2, '0')})</div>
        <div className="vendor-list">
          {filtered.map((t) => (
            <TrainerCard key={t.id} trainer={t} onAddComment={setCommentModal} onDeleteComment={handleDeleteComment} onEdit={setEditModal} onDelete={handleDeleteTrainer} />
          ))}
        </div>
      </div>
      <AddCommentModal
        open={!!commentModal}
        trainer={commentModal}
        onClose={() => setCommentModal(null)}
        onSubmit={handleAddComment}
        currentUserName={user?.name}
      />
      <EditTrainerModal
        open={!!editModal}
        trainer={editModal === 'add' ? null : editModal}
        isAdd={editModal === 'add'}
        onClose={() => setEditModal(null)}
        onSubmit={(data, photoFile) => (editModal === 'add' ? handleCreateTrainer(data, photoFile) : handleEditTrainer(data, photoFile))}
      />
    </>
  )
}
