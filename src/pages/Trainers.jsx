import { useEffect, useState, useCallback, useRef } from 'react'
import { getTrainers, createTrainer, updateTrainer, deleteTrainer } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useTrainerDuplicateCheck } from '../hooks/useTrainerDuplicateCheck.js'

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
const SKILLS_PREVIEW_COUNT = 4

function parseSkills(subject) {
  if (!subject || !String(subject).trim()) return []
  return String(subject)
    .split(/[,;|/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function DetailItem({ label, value, children }) {
  const content = children ?? value
  if (content == null || content === '') return null
  return (
    <div className="trainer-detail-item">
      <span className="trainer-detail-label">{label}</span>
      <span className="trainer-detail-value">{content}</span>
    </div>
  )
}

function TrainerCard({ trainer, onAddComment, onDeleteComment, onEdit, onDelete }) {
  const initials = trainer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  const hasPhoto = trainer.photo && String(trainer.photo).trim()
  const [photoError, setPhotoError] = useState(false)
  const [commentsExpanded, setCommentsExpanded] = useState(false)
  const [skillsExpanded, setSkillsExpanded] = useState(false)
  const showPhoto = hasPhoto && !photoError
  const handlePhotoError = useCallback(() => setPhotoError(true), [])
  const email = trainer.email?.trim()
  const contact = trainer.contact?.trim()
  const location = trainer.location?.trim()
  const skills = parseSkills(trainer.subject)
  const hasMoreSkills = skills.length > SKILLS_PREVIEW_COUNT
  const visibleSkills = skillsExpanded || !hasMoreSkills
    ? skills
    : skills.slice(0, SKILLS_PREVIEW_COUNT)
  const hiddenSkillsCount = skills.length - SKILLS_PREVIEW_COUNT

  return (
    <article className="trainer-record-card">
      <div className="trainer-record-layout">
        <aside className="trainer-record-photo-col">
          <div className={`trainer-record-photo${showPhoto ? ' trainer-record-photo--has-img' : ''}`}>
            {showPhoto ? (
              <img src={trainer.photo} alt={trainer.name} onError={handlePhotoError} />
            ) : (
              <span className="trainer-record-photo-initials">{initials}</span>
            )}
          </div>
          {skills.length > 0 && (
            <div className="trainer-record-skills">
              <span className="trainer-record-skills-label">Skills</span>
              <ul className={`trainer-record-skills-list${skillsExpanded ? ' trainer-record-skills-list--expanded' : ''}`}>
                {visibleSkills.map((skill, i) => (
                  <li key={`${skill}-${i}`} className="trainer-skill-chip">{skill}</li>
                ))}
              </ul>
              {hasMoreSkills && (
                <button
                  type="button"
                  className="trainer-skills-toggle"
                  onClick={() => setSkillsExpanded((e) => !e)}
                  aria-expanded={skillsExpanded}
                >
                  {skillsExpanded ? 'Show less' : `+${hiddenSkillsCount} more`}
                </button>
              )}
            </div>
          )}
        </aside>

        <div className="trainer-record-body">
          <div className="trainer-record-top">
            <div className="trainer-record-identity">
              <h3 className="trainer-record-name">{trainer.name}</h3>
              <div className="trainer-record-badges">
                {trainer.workLookingFor && (
                  <span className="trainer-record-badge">{trainer.workLookingFor}</span>
                )}
                {trainer.mode?.trim() && (
                  <span className="trainer-record-badge trainer-record-badge--muted">{trainer.mode}</span>
                )}
              </div>
            </div>
            <TrainerMenu trainer={trainer} onEdit={onEdit} onDelete={onDelete} />
          </div>

          {(email || contact || location) && (
            <div className="trainer-record-contacts">
              {email && (
                <a href={`mailto:${email}`} className="trainer-contact-chip trainer-contact-chip--email" title={email}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <span>{email}</span>
                </a>
              )}
              {contact && (
                <a href={`tel:${contact.replace(/\s/g, '')}`} className="trainer-contact-chip" title={contact}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>{contact}</span>
                </a>
              )}
              {location && (
                <span className="trainer-contact-chip trainer-contact-chip--static" title={location}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{location}</span>
                </span>
              )}
            </div>
          )}

          {(trainer.teachingExperience || trainer.developmentExperience || trainer.totalExperience) && (
            <div className="trainer-record-stats">
              {trainer.teachingExperience && (
                <div className="trainer-stat">
                  <span className="trainer-stat-value">{trainer.teachingExperience}</span>
                  <span className="trainer-stat-label">Teaching</span>
                </div>
              )}
              {trainer.developmentExperience && (
                <div className="trainer-stat">
                  <span className="trainer-stat-value">{trainer.developmentExperience}</span>
                  <span className="trainer-stat-label">Development</span>
                </div>
              )}
              {trainer.totalExperience && (
                <div className="trainer-stat trainer-stat--highlight">
                  <span className="trainer-stat-value">{trainer.totalExperience}</span>
                  <span className="trainer-stat-label">Total Exp.</span>
                </div>
              )}
            </div>
          )}

          <div className="trainer-record-details">
            <DetailItem label="Qualification" value={trainer.qualification} />
            <DetailItem label="Passing Year" value={trainer.passingYear} />
            <DetailItem label="Payout / Hour" value={trainer.payoutExpectations} />
            <DetailItem label="Resume">
              {trainer.resume ? (
                <a href={trainer.resume} target="_blank" rel="noopener noreferrer" className="trainer-link">
                  View resume
                </a>
              ) : (
                <span className="trainer-detail-muted">Not uploaded</span>
              )}
            </DetailItem>
          </div>

          <div className="trainer-comment-section">
            <div className="trainer-comment-label">Comments</div>
            {trainer.comments?.length > 0 && (() => {
              const comments = [...trainer.comments].reverse()
              const showAll = commentsExpanded || comments.length <= COMMENT_PREVIEW_COUNT
              const visibleComments = showAll ? comments : comments.slice(0, COMMENT_PREVIEW_COUNT)
              return (
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
        </div>
      </div>
    </article>
  )
}

const TRAINER_DEFAULTS = {
  name: '',
  email: '',
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
  resume: '',
  comments: [],
}

const PASSING_YEARS = (() => {
  const y = new Date().getFullYear()
  return Array.from({ length: y - 1979 }, (_, i) => String(y - i))
})()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateTrainerForm(form) {
  const name = form.name.trim()
  const email = form.email.trim().toLowerCase()
  const contact = form.contact.trim()

  if (!name || !contact) {
    return 'Full name and contact number are required.'
  }
  if (email && !EMAIL_RE.test(email)) {
    return 'Enter a valid email address.'
  }
  return null
}

function FieldHint({ state }) {
  if (state.checking) {
    return <span className="field-hint field-hint--checking">Checking availability…</span>
  }
  if (state.error) {
    return <span className="field-hint field-hint--error" role="alert">{state.error}</span>
  }
  if (state.available) {
    return <span className="field-hint field-hint--ok">Available</span>
  }
  return null
}

function EditTrainerModal({ open, trainer, isAdd, onClose, onSubmit }) {
  const [form, setForm] = useState({ ...TRAINER_DEFAULTS })
  const [photoFile, setPhotoFile] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [duplicateBaseline, setDuplicateBaseline] = useState({ email: '', contact: '' })

  const { fieldState, checking, canSubmit } = useTrainerDuplicateCheck({
    email: form.email,
    contact: form.contact,
    baseline: duplicateBaseline,
    excludeId: isAdd ? undefined : trainer?.id,
    enabled: open,
  })

  useEffect(() => {
    if (!open) return
    setError('')
    setStatus('')
    setSaving(false)
    if (isAdd) {
      setForm({ ...TRAINER_DEFAULTS })
      setPhotoFile(null)
      setResumeFile(null)
      setDuplicateBaseline({ email: '', contact: '' })
    } else if (trainer) {
      setForm({ ...TRAINER_DEFAULTS, ...trainer })
      setPhotoFile(null)
      setResumeFile(null)
      setDuplicateBaseline({ email: trainer.email || '', contact: trainer.contact || '' })
    }
  }, [trainer, isAdd, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleClose() {
    if (saving) return
    onClose()
  }

  function pickPhoto(file) {
    setError('')
    if (!file) {
      setPhotoFile(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Profile photo must be an image (JPG, PNG, or WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Profile photo must be under 5MB.')
      return
    }
    setPhotoFile(file)
  }

  function pickResume(file) {
    setError('')
    if (!file) {
      setResumeFile(null)
      return
    }
    const ok =
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      /\.(pdf|doc|docx)$/i.test(file.name)
    if (!ok) {
      setError('Resume must be a PDF or DOC file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Resume must be under 5MB.')
      return
    }
    setResumeFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (saving || checking || !canSubmit) return
    setError('')

    const validationError = validateTrainerForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    if (fieldState.email.error || fieldState.contact.error) {
      setError(fieldState.email.error || fieldState.contact.error)
      return
    }

    setSaving(true)
    const hasFiles = !!(photoFile || resumeFile)
    setStatus(hasFiles ? 'Uploading files and saving profile…' : 'Saving trainer profile…')

    try {
      const normalizedContact = form.contact.trim()
      const payload = isAdd
        ? {
            ...form,
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            contact: normalizedContact,
          }
        : {
            ...trainer,
            ...form,
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            contact: normalizedContact,
          }
      await onSubmit(payload, photoFile || null, resumeFile || null)
      onClose()
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Something went wrong. Please try again.'
      setError(msg)
      setStatus('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose} role="presentation">
      <div
        className="modal-content edit-trainer-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-trainer-title"
      >
        <div className="modal-header">
          <h3 id="edit-trainer-title">{isAdd ? 'Create New Trainer Profile' : 'Edit Trainer Details'}</h3>
          <button type="button" className="btn-close" aria-label="Close" onClick={handleClose} disabled={saving}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-trainer-modal-form">
          <div className="edit-trainer-form">
            {error && (
              <div className="modal-banner modal-banner--error" role="alert">
                {error}
              </div>
            )}
            {saving && status && (
              <div className="modal-banner modal-banner--info" role="status">
                <span className="modal-spinner" aria-hidden="true" />
                {status}
              </div>
            )}

            <p className="edit-trainer-section">Personal Information</p>

            <label>
              <span>Full Name *</span>
              <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Enter full name" required disabled={saving} />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="Enter email address (optional)"
                disabled={saving}
                autoComplete="email"
                className={fieldState.email.error ? 'input-invalid' : undefined}
                aria-invalid={!!fieldState.email.error}
                aria-describedby="trainer-email-hint"
              />
              <FieldHint state={fieldState.email} />
            </label>
            <label>
              <span>Contact Number *</span>
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => setField('contact', e.target.value)}
                placeholder="Enter contact number"
                required
                disabled={saving}
                autoComplete="tel"
                className={fieldState.contact.error ? 'input-invalid' : undefined}
                aria-invalid={!!fieldState.contact.error}
                aria-describedby="trainer-contact-hint"
              />
              <FieldHint state={fieldState.contact} />
            </label>
            <label className="edit-trainer-span-2">
              <span>Location</span>
              <input type="text" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="City / Location" disabled={saving} />
            </label>

            <p className="edit-trainer-section">Professional Information</p>

            <label>
              <span>Qualification</span>
              <input type="text" value={form.qualification} onChange={(e) => setField('qualification', e.target.value)} placeholder="e.g. B.Tech, MCA" disabled={saving} />
            </label>
            <label>
              <span>Passing Year</span>
              <select value={form.passingYear} onChange={(e) => setField('passingYear', e.target.value)} disabled={saving}>
                <option value="">Select year</option>
                {PASSING_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <input type="text" value={form.subject} onChange={(e) => setField('subject', e.target.value)} placeholder="e.g. Java, React, DSA" disabled={saving} />
            </label>
            <label>
              <span>Payout Expectations (Per hour)</span>
              <input type="text" value={form.payoutExpectations} onChange={(e) => setField('payoutExpectations', e.target.value)} placeholder="e.g. 800" disabled={saving} />
            </label>
            <label>
              <span>Teaching Experience</span>
              <input type="text" value={form.teachingExperience} onChange={(e) => setField('teachingExperience', e.target.value)} placeholder="e.g. 3 Years" disabled={saving} />
            </label>
            <label>
              <span>Development Experience</span>
              <input type="text" value={form.developmentExperience} onChange={(e) => setField('developmentExperience', e.target.value)} placeholder="e.g. 5 Years" disabled={saving} />
            </label>
            <label>
              <span>Total Experience</span>
              <input type="text" value={form.totalExperience} onChange={(e) => setField('totalExperience', e.target.value)} placeholder="e.g. 8 Years" disabled={saving} />
            </label>
            <label>
              <span>Work Looking for</span>
              <select value={form.workLookingFor} onChange={(e) => setField('workLookingFor', e.target.value)} disabled={saving}>
                <option value="Full-Time Trainer">Full-Time Trainer</option>
                <option value="Part-Time Trainer">Part-Time Trainer</option>
                <option value="Full-Time Trainer,Part-Time Trainer">Both</option>
              </select>
            </label>
            <label>
              <span>Mode</span>
              <select value={form.mode} onChange={(e) => setField('mode', e.target.value)} disabled={saving}>
                <option value="Offline Mode">Offline Mode</option>
                <option value="Online Mode">Online Mode</option>
                <option value="Online Mode,Offline Mode">Hybrid</option>
              </select>
            </label>

            <p className="edit-trainer-section">Uploads</p>

            <label className="edit-trainer-upload">
              <span>Profile photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={saving}
                onChange={(e) => pickPhoto(e.target.files?.[0] || null)}
              />
              {photoFile ? (
                <span className="photo-filename">{photoFile.name}</span>
              ) : form.photo ? (
                <span className="photo-filename">Current photo already set</span>
              ) : null}
            </label>

            <label className="edit-trainer-upload">
              <span>Resume (PDF / DOC)</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf"
                disabled={saving}
                onChange={(e) => pickResume(e.target.files?.[0] || null)}
              />
              {resumeFile ? (
                <span className="photo-filename">{resumeFile.name}</span>
              ) : form.resume ? (
                <a href={form.resume} target="_blank" rel="noopener noreferrer" className="trainer-link photo-filename">View current resume</a>
              ) : null}
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || checking || !canSubmit}>
              {saving
                ? (isAdd ? 'Creating…' : 'Saving…')
                : checking
                  ? 'Checking…'
                  : (isAdd ? 'Create Profile' : 'Save Changes')}
            </button>
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
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getTrainers()
      .then(setTrainers)
      .catch(() => setTrainers([]))
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = trainers.filter((t) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      t.name.toLowerCase().includes(q) ||
      (t.email || '').toLowerCase().includes(q) ||
      (t.contact || '').includes(q)
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

  async function handleCreateTrainer(form, photoFile, resumeFile) {
    const res = await createTrainer({ ...form, comments: form.comments || [] }, photoFile, resumeFile)
    setTrainers((cur) => [res, ...cur])
    setToast({ type: 'success', text: `Trainer profile created for ${res.name}.` })
  }

  async function handleEditTrainer(payload, photoFile, resumeFile) {
    const id = payload.id
    const res = await updateTrainer(id, payload, photoFile, resumeFile)
    setTrainers((cur) => cur.map((t) => (t.id === id ? res : t)))
    setToast({ type: 'success', text: `Trainer profile updated for ${res.name}.` })
  }

  function handleDeleteTrainer(trainer) {
    if (!confirm(`Delete trainer "${trainer.name}"?`)) return
    setTrainers((cur) => cur.filter((t) => t.id !== trainer.id))
    deleteTrainer(trainer.id)
      .then(() => setToast({ type: 'success', text: `Deleted ${trainer.name}.` }))
      .catch(() => {
        setTrainers((cur) => [trainer, ...cur])
        setToast({ type: 'error', text: 'Failed to delete trainer. Please try again.' })
      })
  }

  return (
    <>
      {toast && (
        <div className={`page-toast page-toast--${toast.type}`} role="status">
          {toast.text}
          <button type="button" className="page-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
        </div>
      )}
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
            <span>Search By Name, Email or Mobile</span>
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
        onSubmit={async (data, photoFile, resumeFile) => {
          if (editModal === 'add') await handleCreateTrainer(data, photoFile, resumeFile)
          else await handleEditTrainer(data, photoFile, resumeFile)
        }}
      />
    </>
  )
}
